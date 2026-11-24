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

(()=>{const sources=document.querySelectorAll('.book-source');for(const s of sources){const links=[...s.querySelectorAll('a[href]')];const jarir=links.some(a=>{try{return new URL(a.href).hostname==='www.jarir.com'}catch{return false}});const paid=/مدفوع|شراء|اقتناء/.test(s.textContent);if(!jarir&&!paid)continue;if(/مجانية رسمية|النسخة المجانية|نسخة متاحة قانونيا/.test(s.textContent)&&!jarir)continue;const p=document.createElement('p');p.className='callout acquisition-note';p.textContent=jarir?'مرجع لطبعة ورقية لدى جرير، بواجهة السعودية. لم نثبت إمكانية طلبها إلى مصر، وليست نسخة إلكترونية أو تحميلا. لا تعتمد هذا الرابط كخيار شراء محلي مؤكد.':'رابط لتوثيق الطبعة. التوفر وإمكان الشراء من مصر لم يتحققا لهذا الرابط، ولا يعني وجوده إتاحة تحميل أو نسخة إلكترونية. نراجع بدائل محلية مناسبة.';s.prepend(p);for(const a of links){if(a.classList.contains('btn')&&/اقتناء|شراء/.test(a.textContent))a.textContent='مرجع الطبعة الورقية ↗';}}})();
