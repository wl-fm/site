// ============================================================
// WLFM — main.js
// Handles: parallax, nav scroll, language toggle, fade-in,
//          hamburger menu, FAQ accordion, image thumbnails
// ============================================================

/* ─── Language System ─── */
const translations = {
  en: {
    'nav-home': 'Home', 'nav-about': 'About Us', 'nav-collections': 'Collections',
    'nav-events': 'Events', 'nav-faq': 'FAQ',
  },
  id: {}
};

let currentLang = localStorage.getItem('wlfm-lang') || 'en';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('wlfm-lang', lang);
  document.documentElement.lang = lang === 'id' ? 'id' : 'en';
  document.getElementById('lang-label').textContent = lang === 'en' ? 'ID' : 'EN';

  document.querySelectorAll('[data-en]').forEach(el => {
    const text = el.getAttribute('data-' + lang);
    if (text) {
      // Use innerHTML if it starts with &
      if (text.startsWith('&') || text.includes('&')) {
        el.innerHTML = text;
      } else {
        el.textContent = text;
      }
    }
  });
}

document.getElementById('lang-toggle')?.addEventListener('click', () => {
  applyLanguage(currentLang === 'en' ? 'id' : 'en');
});

// Apply on load
applyLanguage(currentLang);


/* ─── Navbar Scroll ─── */
const navbar = document.getElementById('navbar');
function handleNavScroll() {
  if (window.scrollY > 60) {
    navbar?.classList.add('scrolled');
  } else {
    navbar?.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll();


/* ─── Hamburger ─── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
hamburger?.addEventListener('click', () => {
  navLinks?.classList.toggle('open');
});
// Close on link click
navLinks?.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});


/* ─── Parallax Scroll ─── */
function handleParallax() {
  const scrollY = window.scrollY;
  document.querySelectorAll('.parallax-bg').forEach(bg => {
    const section = bg.closest('section') || bg.parentElement;
    const rect    = section.getBoundingClientRect();
    const visible = rect.top < window.innerHeight && rect.bottom > 0;
    if (visible) {
      const factor = 0.35;
      const offset = (scrollY - (scrollY + rect.top)) * factor;
      bg.style.transform = `translateY(${offset * 0.3}px)`;
    }
  });
}
window.addEventListener('scroll', handleParallax, { passive: true });
handleParallax();


/* ─── Intersection Observer Fade-in ─── */
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger siblings in the same parent
      const siblings = entry.target.parentElement?.querySelectorAll('.fade-in');
      let delay = 0;
      if (siblings) {
        siblings.forEach((sib, idx) => {
          if (sib === entry.target) delay = idx * 80;
        });
      }
      setTimeout(() => entry.target.classList.add('visible'), delay);
      fadeObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
fadeEls.forEach(el => fadeObs.observe(el));


/* ─── FAQ Accordion ─── */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});


/* ─── Collection Image Thumbnails ─── */
document.querySelectorAll('.collection-thumbs').forEach(thumbs => {
  const mainImg = thumbs.previousElementSibling;
  thumbs.querySelectorAll('img').forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.querySelectorAll('img').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImg && mainImg.tagName === 'IMG') {
        mainImg.src = thumb.src;
      }
    });
  });
  // Set first as active
  const first = thumbs.querySelector('img');
  if (first) first.classList.add('active');
});


/* ─── Active nav link ─── */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});
