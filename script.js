console.log('✓ script.js loaded');

const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

// Toggle mobile navigation visibility
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu after selecting a link
  navLinks.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Smooth-scroll to anchors for on-page links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Fetch Medium posts
async function loadMediumPosts() {
  const postsContainer = document.getElementById('medium-posts');
  if (!postsContainer) {
    console.error('Medium posts container not found');
    return;
  }

  console.log('Starting to load Medium posts...');
  
  try {
    // Try different paths for the JSON file
    let response;
    let lastError;
    
    const paths = ['medium_posts.json', './medium_posts.json', '/medium_posts.json'];
    
    for (const path of paths) {
      try {
        console.log(`Trying path: ${path}`);
        response = await fetch(path);
        if (response.ok) {
          console.log(`✓ Successfully fetched from ${path}`);
          break;
        } else {
          console.log(`✗ ${path} returned status ${response.status}`);
        }
      } catch (e) {
        console.log(`✗ Error with ${path}:`, e.message);
        lastError = e;
        continue;
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`Failed to load JSON from all paths. Last error: ${lastError?.message || 'Unknown'}`);
    }
    
    const data = await response.json();
    console.log('✓ Loaded JSON data:', data);
    
    const posts = data.posts || [];
    console.log(`✓ Found ${posts.length} posts`);
    
    if (posts.length > 0) {
      postsContainer.innerHTML = '';
      
      posts.forEach((post, index) => {
        console.log(`Rendering post ${index + 1}:`, post.title);
        const article = document.createElement('article');
        article.className = 'card';
        
        const thumbnail = post.thumbnail || '';
        const title = post.title || 'Untitled Post';
        const description = post.description || '';
        const link = post.link || '#';
        const source = post.source || 'Wov Labs';
        
        // Format date from Medium publish date
        let formattedDate = '';
        const publishDate = post.pubDate || post.published || post.publishDate || post.date;
        if (publishDate) {
          try {
            // Handle ISO date string or timestamp
            const dateObj = new Date(publishDate);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
            }
          } catch (e) {
            console.warn('Error parsing date:', publishDate, e);
          }
        }
        
        article.innerHTML = `
          ${thumbnail ? `<img src="${thumbnail}" alt="${title}" class="news-thumbnail" onerror="this.style.display='none';" />` : '<div class="news-thumbnail"></div>'}
          <div style="display: flex; align-items: center; justify-content: flex-end; margin-bottom: 12px;">
            ${formattedDate ? `<div class="news-card__date">${formattedDate}</div>` : ''}
          </div>
          <h3>${title}</h3>
          ${description ? `<p>${description}</p>` : ''}
        `;
        
        // Make the card clickable
        article.style.cursor = 'pointer';
        article.addEventListener('click', () => {
          window.open(link, '_blank', 'noopener,noreferrer');
        });
        
        postsContainer.appendChild(article);
      });
      
      console.log('✓ All posts rendered successfully');
    } else {
      console.warn('No posts in JSON file');
      postsContainer.innerHTML = '<p class="loading">No posts available.</p>';
    }
  } catch (error) {
    console.error('✗ Error loading Medium posts:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Show fallback content
    const fallbackPosts = [
      {
        title: 'How to prepare for EU DPP',
        description: 'Implementation checklist for brands and manufacturers.',
        date: 'January 15, 2025',
        source: 'Wov Labs',
        link: 'https://medium.com/@wovlabs'
      },
      {
        title: 'Announcing AUTHENTICA.ID',
        description: 'Unified platform for issuance, engagement, and analytics.',
        date: 'December 10, 2024',
        source: 'Wov Labs',
        link: 'https://medium.com/@wovlabs'
      },
      {
        title: 'Retail pilots with NFC',
        description: 'Store and service flows with secure scan-to-verify.',
        date: 'November 20, 2024',
        source: 'Wov Labs',
        link: 'https://medium.com/@wovlabs'
      }
    ];
    
    postsContainer.innerHTML = '';
    fallbackPosts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'card';
      article.style.cursor = 'pointer';
      article.innerHTML = `
        <div class="news-thumbnail"></div>
        <div style="display: flex; align-items: center; justify-content: flex-end; margin-bottom: 12px;">
          <div class="news-card__date">${post.date}</div>
        </div>
        <h3>${post.title}</h3>
        <p>${post.description}</p>
      `;
      article.addEventListener('click', () => {
        window.open(post.link, '_blank', 'noopener,noreferrer');
      });
      postsContainer.appendChild(article);
    });
  }
}

// Load Medium posts when page loads - try multiple times to ensure it runs
function initMediumPosts() {
  const postsContainer = document.getElementById('medium-posts');
  if (postsContainer) {
    loadMediumPosts();
  } else {
    // Retry if container not found yet
    setTimeout(initMediumPosts, 100);
  }
}

// Try immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMediumPosts);
} else {
  initMediumPosts();
}

// Also try after a short delay as backup
setTimeout(initMediumPosts, 500);

// Dynamic background on scroll
function updateBackgroundOnScroll() {
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const scrollProgress = scrollY / (document.documentElement.scrollHeight - windowHeight);
  
  // Change gradient positions based on scroll
  const gradient1X = 20 + (scrollProgress * 30);
  const gradient1Y = 30 + (scrollProgress * 20);
  const gradient2X = 80 - (scrollProgress * 20);
  const gradient2Y = 20 + (scrollProgress * 30);
  
  // Update background gradient
  document.body.style.setProperty('--gradient-1-x', `${gradient1X}%`);
  document.body.style.setProperty('--gradient-1-y', `${gradient1Y}%`);
  document.body.style.setProperty('--gradient-2-x', `${gradient2X}%`);
  document.body.style.setProperty('--gradient-2-y', `${gradient2Y}%`);

  // Toggle back-to-top visibility
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    if (scrollY > windowHeight * 0.8) {
      backToTop.classList.add('is-visible');
    } else {
      backToTop.classList.remove('is-visible');
    }
  }
}

// Throttle scroll events
let scrollTimeout;
window.addEventListener('scroll', () => {
  if (scrollTimeout) {
    cancelAnimationFrame(scrollTimeout);
  }
  scrollTimeout = requestAnimationFrame(updateBackgroundOnScroll);
});

// Initial call
updateBackgroundOnScroll();

// Back to top click handler
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Multi-language support
let currentLanguage = localStorage.getItem('language') || 'en';

// Initialize translations
function initTranslations() {
  if (typeof translations === 'undefined') {
    console.error('Translations not loaded - retrying...');
    // Retry after a short delay
    setTimeout(() => {
      if (typeof translations !== 'undefined') {
        updateLanguage(currentLanguage);
        setupLanguageSwitcher();
      } else {
        console.error('Translations still not available after retry');
      }
    }, 100);
    return;
  }
  
  console.log('Initializing translations for language:', currentLanguage);
  const elementsCount = document.querySelectorAll('[data-i18n]').length;
  console.log(`Found ${elementsCount} elements with data-i18n attributes`);
  updateLanguage(currentLanguage);
  setupLanguageSwitcher();
}

// Update page content with translations
function updateLanguage(lang) {
  if (typeof translations === 'undefined') {
    console.error('Translations object not available');
    return;
  }
  
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  
  const langData = translations[lang];
  if (!langData) {
    console.error(`Language ${lang} not found in translations`);
    return;
  }
  
  let updatedCount = 0;
  let missingCount = 0;
  
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (langData[key]) {
      // Preserve SVG content if it's inside a button/link
      if ((element.tagName === 'A' || element.tagName === 'BUTTON') && element.querySelector('svg')) {
        const svg = element.querySelector('svg').outerHTML;
        const text = langData[key];
        element.innerHTML = text + ' ' + svg;
      } else if (element.tagName === 'LABEL' && element.querySelector('.required')) {
        // Preserve required asterisk in labels
        const requiredSpan = element.querySelector('.required').outerHTML;
        element.innerHTML = langData[key] + ' ' + requiredSpan;
      } else if (element.tagName === 'SPAN' && element.parentElement && element.parentElement.tagName === 'SPAN') {
        // Handle nested spans (like in announcement)
        element.textContent = langData[key];
      } else {
        element.textContent = langData[key];
      }
      updatedCount++;
    } else {
      console.warn(`Translation key "${key}" not found for language "${lang}"`);
      missingCount++;
    }
  });
  
  console.log(`Updated ${updatedCount} elements, ${missingCount} missing translations`);
  
  // Update placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (langData[key]) {
      element.placeholder = langData[key];
    }
  });
  
  // Update option elements with data-i18n
  document.querySelectorAll('option[data-i18n]').forEach(option => {
    const key = option.getAttribute('data-i18n');
    if (langData[key]) {
      option.textContent = langData[key];
    }
  });
  
  // Update message field default value if it exists and is empty or has default text
  const messageField = document.getElementById('message');
  if (messageField && langData.formMessageDefault) {
    const currentValue = messageField.value.trim();
    const defaultEn = translations['en']?.formMessageDefault || '';
    const defaultIt = translations['it']?.formMessageDefault || '';
    
    // If field is empty or contains the default text in any language, update it
    if (!currentValue || 
        currentValue === defaultEn || 
        currentValue === defaultIt ||
        currentValue === 'I would like to schedule a demo to learn more about how WoV Labs can help my brand.' ||
        currentValue === 'Vorrei fissare una demo per capire meglio come WoV Labs può aiutare il mio brand.') {
      messageField.value = langData.formMessageDefault;
    }
  }
  
  // Update language switcher display
  const langDisplay = document.getElementById('current-lang');
  if (langDisplay) {
    langDisplay.textContent = lang.toUpperCase();
  }
  
  // Update HTML lang attribute
  document.documentElement.lang = lang;
  
  // Dispatch event for other scripts to listen to
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

// Setup language switcher
function setupLanguageSwitcher() {
  const langSwitcher = document.getElementById('lang-switcher');
  const langOptions = document.querySelectorAll('.nav__lang-option');
  
  if (!langSwitcher) return;
  
  // Prevent default link behavior
  langSwitcher.addEventListener('click', (e) => {
    e.preventDefault();
  });
  
  // Handle language selection
  langOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedLang = option.getAttribute('data-lang');
      updateLanguage(selectedLang);
    });
  });
}

// Initialize on page load - wait for translations to be available
function waitForTranslations(maxRetries = 20, retryCount = 0) {
  if (typeof translations !== 'undefined') {
    console.log('Translations loaded, initializing...');
    initTranslations();
  } else if (retryCount < maxRetries) {
    // Retry after a short delay if translations aren't loaded yet
    setTimeout(() => waitForTranslations(maxRetries, retryCount + 1), 50);
  } else {
    console.error('Translations failed to load after maximum retries');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => waitForTranslations());
} else {
  waitForTranslations();
}

// Cookie Consent Management
function initCookieConsent() {
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieModal = document.getElementById('cookie-modal');
  const cookieAcceptAll = document.getElementById('cookie-accept-all');
  const cookieCustomize = document.getElementById('cookie-customize');
  const cookieModalClose = document.getElementById('cookie-modal-close');
  const cookieSave = document.getElementById('cookie-save');
  const cookieRemoveAll = document.getElementById('cookie-remove-all');
  
  // Check if user has already made a choice
  const cookieConsent = localStorage.getItem('cookieConsent');
  if (!cookieConsent) {
    // Show banner after a short delay
    setTimeout(() => {
      cookieBanner.classList.add('is-visible');
    }, 1000);
  }
  
  // Accept all cookies
  if (cookieAcceptAll) {
    cookieAcceptAll.addEventListener('click', () => {
      saveCookiePreferences({
        essential: true,
        analytics: true,
        marketing: true,
        personalization: true
      });
      cookieBanner.classList.remove('is-visible');
    });
  }
  
  // Open customize modal
  if (cookieCustomize) {
    cookieCustomize.addEventListener('click', () => {
      cookieModal.classList.add('is-visible');
      cookieModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  }
  
  // Close modal
  if (cookieModalClose) {
    cookieModalClose.addEventListener('click', closeCookieModal);
  }
  
  if (cookieModal) {
    cookieModal.addEventListener('click', (e) => {
      if (e.target === cookieModal || e.target.classList.contains('cookie-modal__overlay')) {
        closeCookieModal();
      }
    });
  }
  
  // Save preferences
  if (cookieSave) {
    cookieSave.addEventListener('click', () => {
      const preferences = {
        essential: true, // Always required
        analytics: document.getElementById('cookie-analytics').checked,
        marketing: document.getElementById('cookie-marketing').checked,
        personalization: document.getElementById('cookie-personalization').checked
      };
      saveCookiePreferences(preferences);
      closeCookieModal();
      cookieBanner.classList.remove('is-visible');
    });
  }
  
  // Remove all cookies
  if (cookieRemoveAll) {
    cookieRemoveAll.addEventListener('click', () => {
      saveCookiePreferences({
        essential: true,
        analytics: false,
        marketing: false,
        personalization: false
      });
      // Uncheck all toggles except essential
      document.getElementById('cookie-analytics').checked = false;
      document.getElementById('cookie-marketing').checked = false;
      document.getElementById('cookie-personalization').checked = false;
    });
  }
  
  // Load saved preferences
  if (cookieConsent) {
    const preferences = JSON.parse(cookieConsent);
    if (document.getElementById('cookie-analytics')) {
      document.getElementById('cookie-analytics').checked = preferences.analytics || false;
    }
    if (document.getElementById('cookie-marketing')) {
      document.getElementById('cookie-marketing').checked = preferences.marketing || false;
    }
    if (document.getElementById('cookie-personalization')) {
      document.getElementById('cookie-personalization').checked = preferences.personalization || false;
    }
  }
}

function closeCookieModal() {
  const cookieModal = document.getElementById('cookie-modal');
  if (cookieModal) {
    cookieModal.classList.remove('is-visible');
    cookieModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

function saveCookiePreferences(preferences) {
  localStorage.setItem('cookieConsent', JSON.stringify(preferences));
  localStorage.setItem('cookieConsentDate', new Date().toISOString());
  
  // Here you would typically trigger your analytics/marketing scripts based on preferences
  if (preferences.analytics) {
    // Initialize analytics
    console.log('Analytics enabled');
  }
  if (preferences.marketing) {
    // Initialize marketing tools
    console.log('Marketing enabled');
  }
  if (preferences.personalization) {
    // Initialize personalization
    console.log('Personalization enabled');
  }
}

// Initialize cookie consent on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieConsent);
} else {
  initCookieConsent();
}

// Update copyright year dynamically
function updateCopyrightYear() {
  const yearElement = document.getElementById('copyright-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Initialize copyright year
updateCopyrightYear();

