#!/usr/bin/env python3
"""
Crawler to download pages and images from https://wovlabs.com/en.
Uses only the standard library. Outputs:
  wovlabs_dump/pages/*.html   (page snapshots)
  wovlabs_dump/images/*       (images encountered)
"""
from __future__ import annotations

import collections
import hashlib
import re
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable, Set

BASE_URL = "https://wovlabs.com/en"
ALLOWED_DOMAIN = "wovlabs.com"
OUTPUT_DIR = Path("wovlabs_dump")
PAGES_DIR = OUTPUT_DIR / "pages"
IMAGES_DIR = OUTPUT_DIR / "images"

MAX_PAGES = 120
REQUEST_DELAY = 0.2  # seconds between requests
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
)


def normalize_url(url: str, base: str) -> str | None:
    if not url:
        return None
    if url.startswith(("mailto:", "tel:", "javascript:", "#")):
        return None
    joined = urllib.parse.urljoin(base, url)
    parsed = urllib.parse.urlparse(joined)
    if parsed.scheme not in {"http", "https"}:
        return None
    if parsed.netloc and not parsed.netloc.endswith(ALLOWED_DOMAIN):
        return None
    cleaned = parsed._replace(fragment="").geturl()
    return cleaned


def safe_filename(url: str, fallback_prefix: str, default_ext: str = "") -> str:
    parsed = urllib.parse.urlparse(url)
    name = Path(parsed.path).name
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name) or ""
    if not name:
        digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
        name = f"{fallback_prefix}_{digest}{default_ext}"
    return name


@dataclass
class PageAssets:
    links: Set[str] = field(default_factory=set)
    images: Set[str] = field(default_factory=set)


class LinkImageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.assets = PageAssets()

    def handle_starttag(self, tag: str, attrs: Iterable[tuple[str, str | None]]) -> None:
        attr_dict = {k.lower(): (v or "") for k, v in attrs}
        tag = tag.lower()
        if tag in {"a", "link", "script"} and "href" in attr_dict:
            self.assets.links.add(attr_dict["href"])
        if tag == "script" and "src" in attr_dict:
            self.assets.links.add(attr_dict["src"])
        if tag in {"img", "source"}:
            if "srcset" in attr_dict:
                for part in attr_dict["srcset"].split(","):
                    candidate = part.strip().split(" ")[0]
                    if candidate:
                        self.assets.images.add(candidate)
            if "src" in attr_dict:
                self.assets.images.add(attr_dict["src"])


def fetch(url: str) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read()
    except Exception as exc:  # pragma: no cover
        print(f"[skip] {url} ({exc})")
        return None


def parse_links_and_images(html_bytes: bytes) -> PageAssets:
    parser = LinkImageParser()
    try:
        parser.feed(html_bytes.decode("utf-8", errors="ignore"))
    finally:
        parser.close()
    return parser.assets


def extract_assets_from_text(text: str) -> set[str]:
    """Find asset-like URLs inside CSS/JS text (basic heuristic)."""
    matches: set[str] = set()
    for m in re.findall(r"url\(['\"]?([^'\"\)]+)", text, flags=re.IGNORECASE):
        if m:
            matches.add(m)
    for _, path in re.findall(
        r"(['\"])(/assets/[^'\"\s]+\.(?:png|jpe?g|webp|svg|gif))\1",
        text,
        flags=re.IGNORECASE,
    ):
        matches.add(path)
    return matches


def download_binary(url: str, dest: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            dest.write_bytes(resp.read())
        return True
    except Exception as exc:  # pragma: no cover
        print(f"[skip image] {url} ({exc})")
        return False


def crawl() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    PAGES_DIR.mkdir(exist_ok=True)
    IMAGES_DIR.mkdir(exist_ok=True)

    queue = collections.deque([BASE_URL])
    seen_pages: set[str] = set()
    downloaded_images: set[str] = set()

    while queue and len(seen_pages) < MAX_PAGES:
        url = queue.popleft()
        if url in seen_pages:
            continue
        seen_pages.add(url)
        print(f"[page] {url}")
        blob = fetch(url)
        if not blob:
            continue

        content = blob
        text_sample = blob[:2048].lower()
        is_html = b"<html" in text_sample or b"<!doctype html" in text_sample
        is_text = any(x in text_sample for x in [b"function", b"var ", b"const ", b"import ", b"url("])

        if is_html:
            page_name = safe_filename(url, "page", ".html")
            (PAGES_DIR / page_name).write_bytes(content)
            assets = parse_links_and_images(content)
        else:
            # Save non-HTML assets into pages dir for visibility
            page_name = safe_filename(url, "asset")
            (PAGES_DIR / page_name).write_bytes(content)
            text_content = ""
            if is_text:
                try:
                    text_content = content.decode("utf-8", errors="ignore")
                except Exception:
                    text_content = ""
            assets = PageAssets()
            if text_content:
                assets.images = extract_assets_from_text(text_content)

        for link in assets.links:
            normalized = normalize_url(link, url)
            if normalized and normalized not in seen_pages:
                queue.append(normalized)

        for img_src in assets.images:
            img_url = normalize_url(img_src, url)
            if not img_url or img_url in downloaded_images:
                continue
            downloaded_images.add(img_url)
            filename = safe_filename(img_url, "image")
            dest = IMAGES_DIR / filename
            if dest.exists():
                continue
            download_binary(img_url, dest)

        time.sleep(REQUEST_DELAY)

    print(f"[done] pages: {len(seen_pages)}, images: {len(downloaded_images)}")
    print(f"[output] pages -> {PAGES_DIR}, images -> {IMAGES_DIR}")


if __name__ == "__main__":
    crawl()
