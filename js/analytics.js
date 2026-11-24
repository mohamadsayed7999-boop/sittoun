/* GA4: edit measurementId here only. Empty means disabled, no Google requests. */
window.SITTOUN_ANALYTICS = Object.freeze({ measurementId: '', debug: false });
(() => {
  'use strict';
  const cfg = window.SITTOUN_ANALYTICS || {};
  const id = cfg.measurementId;
  if (!/^G-[A-Z0-9]{6,20}$/.test(id || '') || window.__sittounGA4 || !/^https?:$/.test(location.protocol)) return;
  window.__sittounGA4 = true;
  const root = new URL('../', document.currentScript.src);
  const clean = raw => { try { const u = new URL(raw, location.href); return /^https?:$/.test(u.protocol) ? u.origin + u.pathname : ''; } catch { return ''; } };
  window.dataLayer = window.dataLayer || [];
  const tag = function () { window.dataLayer.push(arguments); };
  window.gtag = window.gtag || tag;
  tag('js', new Date());
  tag('config', id, {
    send_page_view: true,
    page_location: clean(location.href),
    page_referrer: clean(document.referrer),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_path: root.pathname,
    cookie_flags: 'SameSite=Lax;Secure',
    debug_mode: cfg.debug === true
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(script);
  const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  function context(el, url) {
    const box = el.closest('.free-card,.video-item,.card,.source-card,article,.prose');
    const ownBook = document.body.dataset.paidBookId || (/\/summaries\/([^/]+)\.html$/.exec(location.pathname) || [])[1] || '';
    const ref = box?.querySelector('a[href*="summaries/"]');
    let book = url && (/\/summaries\/([^/]+)\.html$/.exec(url.pathname) || [])[1];
    if (url?.pathname.endsWith('/go.html')) book = url.searchParams.get('id');
    if (!book && ref) book = (/\/summaries\/([^/]+)\.html$/.exec(new URL(ref.href).pathname) || [])[1];
    if (!book) book = ownBook;
    const title = text(box?.querySelector('h3,h2,h1')) || (ownBook ? text(document.querySelector('article h1,h1')) : '');
    return { book_id: (book || '').slice(0, 100), book_title: title, book_type: text(box?.querySelector('.tag')) };
  }
  function track(event) {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const el = event.target instanceof Element ? event.target.closest('a[href],.vid[data-id]') : null;
    if (!el) return;
    let u; try { u = el.href ? new URL(el.href, location.href) : null; } catch { return; }
    let name, params = context(el, u);
    if (u && /(^|\.)(wa\.me|whatsapp\.com)$/.test(u.hostname)) {
      name = 'whatsapp_click'; params = { link_domain: u.hostname };
    } else if (el.matches('.vid[data-id]') || (u && /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/.test(u.hostname))) {
      name = 'video_click';
      params.video_id = el.dataset.id || u?.searchParams.get('v') || (u?.hostname === 'youtu.be' ? u.pathname.slice(1) : '');
      params.video_action = el.matches('.vid[data-id]') ? 'open_embed' : 'open_link';
      params.link_domain = u?.hostname || 'www.youtube-nocookie.com';
    } else if (u && u.origin === location.origin && /\/summaries\/[^/]+\.html$/.test(u.pathname)) {
      name = 'book_click'; params.link_type = 'internal_book';
    } else if (u && (u.pathname.endsWith('/go.html') || (u.origin !== location.origin && el.closest('.book-source,.editorial-sources,.free-card,.source-card,.egypt-route,.free-grid')))) {
      name = 'book_source_click';
      params.link_type = u.pathname.endsWith('/go.html') ? 'paid_edition' : /\.(pdf|epub|mobi)$/i.test(u.pathname) ? 'download' : 'source';
      let destination = u; try { if (el.dataset.destination) destination = new URL(el.dataset.destination); } catch { /* Retain observed URL. */ }
      params.link_domain = destination.hostname;
      params.link_url = clean(destination.href);
    } else return;
    // No text inputs, WhatsApp messages/numbers, URL queries or fragments are sent.
    tag('event', name, Object.assign({ transport_type: 'beacon' }, params));
  }
  document.addEventListener('click', track, { capture: true, passive: true });
  document.addEventListener('auxclick', track, { capture: true, passive: true });
})();
