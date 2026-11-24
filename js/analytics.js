/* GA4: edit measurementId here only. Empty means disabled, no Google requests. */
window.SITTOUN_ANALYTICS = Object.freeze({ measurementId: 'G-9J3NGKNGWL', debug: false });
(() => {
  'use strict';
  const cfg = window.SITTOUN_ANALYTICS || {};
  const id = cfg.measurementId;
  if (!/^G-[A-Z0-9]{6,20}$/.test(id || '') || window.__sittounGA4 || !/^https?:$/.test(location.protocol)) return;
  let active = false;
  const root = new URL('../', document.currentScript.src);
  const clean = raw => { try { const u = new URL(raw, location.href); return /^https?:$/.test(u.protocol) ? u.origin + u.pathname : ''; } catch { return ''; } };
  const consentKey = 'sittoun.analyticsConsent.v1';
  let choice = null;
  try {
    const saved = JSON.parse(localStorage.getItem(consentKey) || 'null');
    if (saved && ['granted','denied'].includes(saved.value) && Number.isFinite(saved.at) && Date.now() >= saved.at && Date.now() - saved.at < 180 * 86400000) choice = saved.value;
  } catch { /* Storage denied: ask without persistent tracking. */ }
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL('css/analytics-consent.css', root).href;
  document.head.appendChild(css);
  const panel = document.createElement('section');
  panel.className = 'analytics-consent'; panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', 'اختيار إحصائيات الزيارات');
  const heading = document.createElement('strong'); heading.textContent = 'إحصائيات الزيارات، باختيارك';
  const description = document.createElement('p');
  description.textContent = 'نستخدم Google Analytics لفهم الزيارات والتفاعل. لا يُحمّل ولا يرسل بيانات إلى Google قبل موافقتك. قبولك يسمح بملفات ارتباط للتحليل فقط، وليس للإعلانات. الرفض لا يمنع أي ميزة بالموقع.';
  const actions = document.createElement('div'); actions.className = 'analytics-consent-actions';
  const accept = document.createElement('button'); accept.type = 'button'; accept.textContent = 'قبول الإحصائيات';
  const reject = document.createElement('button'); reject.type = 'button'; reject.textContent = 'رفض الإحصائيات';
  const policy = document.createElement('a'); policy.href = new URL('privacy.html', root).href; policy.textContent = 'سياسة الخصوصية';
  const close = document.createElement('button'); close.type = 'button'; close.textContent = 'إغلاق دون تغيير';
  actions.append(accept, reject, policy, close); panel.append(heading, description, actions);
  const settings = document.createElement('button'); settings.type = 'button'; settings.className = 'analytics-consent-settings'; settings.textContent = 'إعدادات الإحصائيات';
  function open() { panel.hidden = false; settings.hidden = true; accept.focus({preventScroll:true}); }
  function hide() { panel.hidden = true; settings.hidden = false; if (settings.isConnected) settings.focus({preventScroll:true}); }
  function save(value) { choice = value; try { localStorage.setItem(consentKey, JSON.stringify({value,at:Date.now()})); } catch { /* Choice still applies on this page. */ } }
  function clearAnalyticsCookies() {
    const paths = [...new Set(['/', root.pathname, root.pathname.replace(/\/$/, '')])];
    for (const pair of document.cookie.split(';')) {
      const name = pair.trim().split('=')[0];
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const path of paths) {
        document.cookie = name + '=; Max-Age=0; path=' + path + '; SameSite=Lax; Secure';
        document.cookie = name + '=; Max-Age=0; path=' + path + '; domain=' + location.hostname + '; SameSite=Lax; Secure';
      }
    }
  }
  accept.addEventListener('click', () => { save('granted'); hide(); start(); });
  reject.addEventListener('click', () => {
    save('denied'); active = false; window['ga-disable-' + id] = true;
    clearAnalyticsCookies(); hide();
    // Do not send even a consent-denied ping. Remove the loaded tag by reloading.
    if (window.__sittounGA4) location.reload();
  });
  close.addEventListener('click', hide);
  settings.addEventListener('click', open);
  panel.hidden = choice !== null; settings.hidden = choice === null;
  const settingsHost = document.getElementById('analytics-privacy-control');
  if (settingsHost) { settingsHost.append(settings, panel); settings.hidden = !panel.hidden; }
  if (choice === 'granted') start();
  addEventListener('storage', event => {
    if (event.key === consentKey && window.__sittounGA4) {
      try { if (JSON.parse(event.newValue || 'null')?.value === 'granted') return; } catch {}
      active = false; window['ga-disable-' + id] = true; clearAnalyticsCookies(); location.reload();
    }
  });
  function start() {
    if (window.__sittounGA4) return;
    active = true; window.__sittounGA4 = true; window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    const tag = function () { window.dataLayer.push(arguments); };
    window.gtag = window.gtag || tag;
    tag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    tag('consent', 'update', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
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
      if (!active || choice !== 'granted') return;
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
  }
})();
