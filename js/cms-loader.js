// ============================================================
// js/cms-loader.js - Fetches CMS JSON data and re-renders
// dynamic page sections. Loaded after main.js.
// ============================================================

(async function () {
  // Normalize page path (e.g. /collections or /collections.html -> collections)
  let pathSegments = window.location.pathname.replace(/\/$/, '').split('/');
  let rawPage = pathSegments.pop() || 'index';
  const page = rawPage.replace(/\.html$/, '') || 'index';

  // Parse Markdown & HTML formatting to HTML string for display
  function formatRichText(str) {
    if (!str) return '';
    let html = str;
    // Markdown bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    // Markdown italic: *text* or _text_
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    // Markdown links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Newlines to linebreaks if not block HTML
    if (!html.includes('<p>') && !html.includes('<br>')) {
      html = html.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    }
    return html;
  }

  // Get text for the correct language with EN fallback
  function t(obj, field) {
    const lang = localStorage.getItem('wlfm-lang') || 'en';
    return obj[`${field}_${lang}`] || obj[`${field}_en`] || '';
  }

  // Escape text for safe HTML attribute usage while preserving rich text HTML
  function escAttr(str) {
    return formatRichText(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  // Pure text attribute escaper (for titles, labels, etc.)
  function esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // After rendering, re-run main.js setup
  function reInit() {
    if (typeof window.wlfmReInit === 'function') window.wlfmReInit();
  }

  // ── Collections & Index pages ────────────────────────────────
  if (page === 'collections' || page === 'index') {
    try {
      const res = await fetch('/_data/products.json');
      if (!res.ok) return;
      const products = await res.json();

      // Index page: update collection cards grid
      const grid = document.getElementById('collections-grid');
      if (grid && products.length) {
        grid.innerHTML = products
          .filter(p => p.slug !== 'obi') // obi belt not shown as card
          .map(p => `
            <div class="collection-card fade-in" id="card-${esc(p.slug)}">
              <div class="card-image">
                <img src="${esc(p.main_image)}" alt="${esc(p.title)}" loading="lazy" />
                <div class="card-hover-overlay">
                  <a href="collections.html#${esc(p.slug)}" class="btn-card"
                     data-en="View Details" data-id="Lihat Detail">View Details</a>
                </div>
              </div>
              <div class="card-info">
                <span class="card-label" data-en="${esc(t(p,'category'))}" data-id="${esc(p[`category_id`] || '')}">${esc(t(p,'category'))}</span>
                <h3>${esc(p.title)}</h3>
              </div>
            </div>`).join('');
        reInit();
      }

      // Collections page: re-render all product sections
      const container = document.getElementById('products-container');
      if (container && products.length) {
        const bgs = ['var(--cream)', 'var(--cream-2)'];
        container.innerHTML = products.map((p, i) => {
          const isReverse = i % 2 !== 0;
          const bg = bgs[i % 2];
          const hasGallery = p.gallery && p.gallery.length > 1;

          const thumbsHtml = hasGallery
            ? `<div class="collection-thumbs">${p.gallery.map((img, gi) =>
                `<img src="${esc(img)}" alt="${esc(p.title)} ${gi + 1}" loading="lazy" />`
              ).join('')}</div>`
            : '';

          const detailsHtml = (p.details || []).map(d =>
            `<li data-en="${escAttr(d.en)}" data-id="${escAttr(d.id)}">${formatRichText(d.en)}</li>`
          ).join('');

          const noteHtml = p.note_en
            ? `<p style="margin-top:0.8rem" data-en="${escAttr(p.note_en)}" data-id="${escAttr(p.note_id || p.note_en)}">${formatRichText(p.note_en)}</p>`
            : '';

          const imageCol = `
            <div class="fade-in">
              <img id="${esc(p.slug)}-main" class="collection-full-img"
                   src="${esc(p.main_image)}" alt="${esc(p.title)}" loading="lazy" />
              ${thumbsHtml}
            </div>`;

          const textCol = `
            <div class="fade-in">
              <span class="section-label" data-en="${esc(t(p,'category'))}" data-id="${esc(p.category_id || '')}">${esc(t(p,'category'))}</span>
              <h2>${esc(p.title)}</h2>
              <p style="margin-top:1rem" data-en="${escAttr(p.description_en)}" data-id="${escAttr(p.description_id || '')}">${formatRichText(t(p,'description'))}</p>
              ${noteHtml}
              <ul class="details-list" style="margin-top:2rem">${detailsHtml}</ul>
            </div>`;

          return `
            <section class="collection-full" id="${esc(p.slug)}" style="background:${bg};">
              <div class="container">
                <div class="grid-2col${isReverse ? ' reverse' : ''}">
                  ${isReverse ? textCol + imageCol : imageCol + textCol}
                </div>
              </div>
            </section>`;
        }).join('');
        reInit();
      }
    } catch (e) {
      console.warn('[CMS] Products load failed, using static HTML.', e);
    }
  }

  // ── Events page ──────────────────────────────────────────────
  if (page === 'events') {
    try {
      const res = await fetch('/_data/events.json');
      if (!res.ok) return;
      const events = await res.json();
      const container = document.getElementById('events-container');
      if (!container || !events.length) return;

      container.innerHTML = events.map((ev, i) => `
        <article class="event-item" id="event-${i + 1}">
          <div class="event-image">
            <img src="${esc(ev.image)}" alt="${esc(t(ev,'title'))}" loading="lazy" />
          </div>
          <div class="event-text fade-in">
            <div class="event-meta" data-en="${esc(ev.meta)}" data-id="${esc(ev.meta)}">${esc(ev.meta)}</div>
            <h3 data-en="${esc(ev.title_en)}" data-id="${esc(ev.title_id || ev.title_en)}">${esc(t(ev,'title'))}</h3>
            <p data-en="${escAttr(ev.description_en)}" data-id="${escAttr(ev.description_id || ev.description_en)}">${formatRichText(t(ev,'description'))}</p>
          </div>
        </article>`).join('');
      reInit();
    } catch (e) {
      console.warn('[CMS] Events load failed, using static HTML.', e);
    }
  }

  // ── FAQ page ─────────────────────────────────────────────────
  if (page === 'faq') {
    try {
      const res = await fetch('/_data/faq.json');
      if (!res.ok) return;
      const faqs = await res.json();
      const container = document.getElementById('faq-container');
      if (!container || !faqs.length) return;

      const categoryLabels = {
        brand:         { en: 'Brand &amp; Design Philosophy', id: 'Filosofi Merek &amp; Desain' },
        craftsmanship: { en: 'Craftsmanship &amp; Materials', id: 'Kerajinan &amp; Material' },
        sustainability:{ en: 'Sustainability',                id: 'Keberlanjutan' },
        care:          { en: 'Care &amp; Shipping',           id: 'Perawatan &amp; Pengiriman' },
      };

      const lang = localStorage.getItem('wlfm-lang') || 'en';
      let lastCat = null;
      let html = '';
      let faqIdx = 0;

      faqs.forEach((faq) => {
        if (faq.category !== lastCat) {
          lastCat = faq.category;
          const label = categoryLabels[faq.category] || { en: faq.category, id: faq.category };
          html += `<h3 class="faq-category-title fade-in"
                       data-en="${label.en}" data-id="${label.id}">${label[lang] || label.en}</h3>`;
        }
        faqIdx++;
        html += `
          <div class="faq-item fade-in">
            <button class="faq-question" id="faq-${faqIdx}">
              <span data-en="${esc(faq.question_en)}" data-id="${esc(faq.question_id || faq.question_en)}">${esc(t(faq,'question'))}</span>
              <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-inner">
                <p data-en="${escAttr(faq.answer_en)}" data-id="${escAttr(faq.answer_id || faq.answer_en)}">${formatRichText(t(faq,'answer'))}</p>
              </div>
            </div>
          </div>`;
      });

      container.innerHTML = html;
      reInit();
    } catch (e) {
      console.warn('[CMS] FAQ load failed, using static HTML.', e);
    }
  }

  // ── About page ───────────────────────────────────────────────
  if (page === 'about') {
    try {
      const res = await fetch('/_data/about.json');
      if (!res.ok) return;
      const about = await res.json();

      // Update elements using their data-en attributes as handles
      function updateEl(selector, enVal, idVal) {
        const el = document.querySelector(selector);
        if (el) {
          const formattedEn = formatRichText(enVal);
          const formattedId = formatRichText(idVal || enVal);
          el.setAttribute('data-en', formattedEn);
          el.setAttribute('data-id', formattedId);
          el.innerHTML = (localStorage.getItem('wlfm-lang') === 'id' && formattedId) ? formattedId : formattedEn;
        }
      }

      updateEl('.story-text h2',       about.story_heading_en,   about.story_heading_id);
      updateEl('.story-text p:first-of-type', about.story_en,    about.story_id);
      updateEl('.story-text p:last-of-type',  about.story_closing_en, about.story_closing_id);
      // Vision & Purpose cards
      const vmCards = document.querySelectorAll('.vm-card');
      if (vmCards[0]) {
        const visionEn = formatRichText(about.vision_en);
        const visionId = formatRichText(about.vision_id || about.vision_en);
        const visionH3En = esc(about.vision_heading_en);
        const visionH3Id = esc(about.vision_heading_id);
        const h3 = vmCards[0].querySelector('h3');
        const p = vmCards[0].querySelector('p');
        if (h3) { h3.setAttribute('data-en', visionH3En); h3.setAttribute('data-id', visionH3Id); }
        if (p) { p.setAttribute('data-en', visionEn); p.setAttribute('data-id', visionId); p.innerHTML = (localStorage.getItem('wlfm-lang') === 'id' && visionId) ? visionId : visionEn; }
      }
      if (vmCards[1]) {
        const purposeEn = formatRichText(about.purpose_en);
        const purposeId = formatRichText(about.purpose_id || about.purpose_en);
        const purposeH3En = esc(about.purpose_heading_en);
        const purposeH3Id = esc(about.purpose_heading_id);
        const h3 = vmCards[1].querySelector('h3');
        const p = vmCards[1].querySelector('p');
        if (h3) { h3.setAttribute('data-en', purposeH3En); h3.setAttribute('data-id', purposeH3Id); }
        if (p) { p.setAttribute('data-en', purposeEn); p.setAttribute('data-id', purposeId); p.innerHTML = (localStorage.getItem('wlfm-lang') === 'id' && purposeId) ? purposeId : purposeEn; }
      }
      // Hero image
      const heroBg = document.querySelector('.page-hero .parallax-bg');
      if (heroBg && about.hero_image) {
        heroBg.style.backgroundImage = `url('${about.hero_image}')`;
      }
      reInit();
    } catch (e) {
      console.warn('[CMS] About load failed, using static HTML.', e);
    }
  }
})();

