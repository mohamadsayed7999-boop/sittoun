// وظائف مشتركة: رابط واتساب، نسخ الرابط، وتحميل الفيديو عند النقر فقط
(function () {
  'use strict';

  // أزرار واتساب: النص من data-wa + رابط الصفحة الحالية
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = 'https://wa.me/?text=' + encodeURIComponent(a.dataset.wa + ' ' + location.href);
  });

  document.addEventListener('click', async function (e) {
    // نسخ الرابط
    var copy = e.target.closest('[data-copy]');
    if (copy) {
      try {
        await navigator.clipboard.writeText(copy.dataset.copy || location.href);
        copy.textContent = 'تم النسخ ✓';
      } catch (err) {
        copy.textContent = 'انسخ الرابط يدوياً';
      }
      return;
    }

    // الفيديو: لا يُحمَّل مشغّل يوتيوب إلا بعد الضغط
    var v = e.target.closest('.vid[data-id]');
    if (v) {
      var id = v.dataset.id;
      if (!/^[\w-]{6,20}$/.test(id)) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      f.title = v.getAttribute('aria-label') || 'فيديو';
      v.replaceChildren(f);
    }
  });
})();
