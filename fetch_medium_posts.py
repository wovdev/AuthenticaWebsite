#!/usr/bin/env python3
"""
Fetch Medium posts from RSS feed and save as JSON
Run this script periodically to update posts
"""
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
import re

RSS_URL = "https://medium.com/feed/@wovlabs"
OUTPUT_FILE = "medium_posts.json"

def extract_thumbnail(content):
    """Extract thumbnail image from HTML content"""
    if not content:
        return ""
    # Look for img tags
    img_match = re.search(r'<img[^>]+src="([^"]+)"', content)
    if img_match:
        return img_match.group(1)
    return ""

def clean_text(text):
    """Remove HTML tags and clean text"""
    if not text:
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Decode HTML entities
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&quot;', '"')
    # Clean up whitespace
    text = ' '.join(text.split())
    return text

def fetch_medium_posts():
    """Fetch and parse Medium RSS feed"""
    try:
        print(f"Fetching RSS feed from {RSS_URL}...")
        # Add User-Agent to avoid blocking
        req = urllib.request.Request(RSS_URL)
        req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        
        with urllib.request.urlopen(req) as response:
            rss_content = response.read().decode('utf-8')
        
        print("Parsing RSS feed...")
        root = ET.fromstring(rss_content)
        
        # Find all items
        items = root.findall('.//item')
        posts = []
        
        for item in items[:3]:  # Get latest 3 posts
            title_elem = item.find('title')
            link_elem = item.find('link')
            description_elem = item.find('description')
            pub_date_elem = item.find('pubDate')
            content_elem = item.find('.//{http://purl.org/rss/1.0/modules/content/}encoded')
            
            title = title_elem.text if title_elem is not None else ""
            link = link_elem.text if link_elem is not None else ""
            description = description_elem.text if description_elem is not None else ""
            pub_date = pub_date_elem.text if pub_date_elem is not None else ""
            content = content_elem.text if content_elem is not None else description
            
            # Extract thumbnail
            thumbnail = extract_thumbnail(content)
            
            # Clean description - get first 100 characters
            text_content = content if content else description
            clean_desc = clean_text(text_content)
            
            # Get first 100 characters
            if clean_desc:
                clean_desc = clean_desc[:100].strip()
                if len(text_content) > 100:
                    clean_desc += "..."
            else:
                clean_desc = ""
            
            posts.append({
                "title": title,
                "link": link,
                "description": clean_desc,
                "thumbnail": thumbnail,
                "pubDate": pub_date
            })
        
        # Save to JSON file
        output = {
            "lastUpdated": datetime.now().isoformat(),
            "posts": posts
        }
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Successfully fetched {len(posts)} posts")
        print(f"✓ Saved to {OUTPUT_FILE}")
        return True
        
    except Exception as e:
        print(f"✗ Error fetching posts: {e}")
        return False

if __name__ == "__main__":
    fetch_medium_posts()

