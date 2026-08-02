// ============================================================
// WLFM — main.js
// Handles: parallax, nav scroll, language toggle, fade-in,
//          hamburger menu, FAQ accordion, image thumbnails
// Exposes window.wlfmReInit() for cms-loader.js to call
// after dynamic content is injected.
// ============================================================

/* ─── Language System ─── */
let currentLang = localStorage.getItem('wlfm-lang') || 'en';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('wlfm-lang', lang);
  document.documentElement.lang = lang === 'id' ? 'id' : 'en';
  const label = document.getElementById('lang-label');
  if (label) label.textContent = lang === 'en' ? 'ID' : 'EN';

  document.querySelectorAll('[data-en]').forEach(el => {
    const text = el.getAttribute('data-' + lang);
    if (text) {
      if (text.includes('&')) { el.innerHTML = text; }
      else { el.textContent = text; }
    }
  });
}

document.getElementById('lang-toggle')?.addEventListener('click', () => {
  applyLanguage(currentLang === 'en' ? 'id' : 'en');
});

applyLanguage(currentLang);


/* ─── Navbar Scroll ─── */
const navbar = document.getElementById('navbar');
function handleNavScroll() {
  if (window.scrollY > 60) { navbar?.classList.add('scrolled'); }
  else { navbar?.classList.remove('scrolled'); }
}
window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll();


/* ─── Hamburger ─── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
hamburger?.addEventListener('click', () => navLinks?.classList.toggle('open'));
navLinks?.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});


/* ─── Parallax Scroll ─── */
function handleParallax() {
  const scrollY = window.scrollY;
  document.querySelectorAll('.parallax-bg').forEach(bg => {
    const section = bg.closest('section') || bg.parentElement;
    const rect    = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      bg.style.transform = `translateY(${(scrollY - (scrollY + rect.top)) * 0.3 * 0.35}px)`;
    }
  });
}
window.addEventListener('scroll', handleParallax, { passive: true });
handleParallax();


/* ─── Fade-in Observer ─── */
let fadeObs;
function initFade() {
  if (fadeObs) fadeObs.disconnect();
  fadeObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = entry.target.parentElement?.querySelectorAll('.fade-in');
        let delay = 0;
        if (siblings) {
          siblings.forEach((sib, idx) => { if (sib === entry.target) delay = idx * 80; });
        }
        setTimeout(() => entry.target.classList.add('visible'), delay);
        fadeObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el => fadeObs.observe(el));
}
initFade();


/* ─── FAQ Accordion ─── */
function initFaq() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}
initFaq();


/* ─── Collection Thumbnails ─── */
function initThumbs() {
  document.querySelectorAll('.collection-thumbs').forEach(thumbs => {
    const mainImg = thumbs.previousElementSibling;
    thumbs.querySelectorAll('img').forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.querySelectorAll('img').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (mainImg && mainImg.tagName === 'IMG') mainImg.src = thumb.src;
      });
    });
    const first = thumbs.querySelector('img');
    if (first) first.classList.add('active');
  });
}
initThumbs();


/* ─── Active Nav Link ─── */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});


/* ─── Re-init hook for cms-loader.js ─── */
window.wlfmReInit = function () {
  initFade();
  initFaq();
  initThumbs();
  applyLanguage(currentLang);
};
