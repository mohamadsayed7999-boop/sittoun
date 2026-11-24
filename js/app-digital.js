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

(()=>{const sources=document.querySelectorAll('.book-source');for(const s of sources){const links=[...s.querySelectorAll('a[href]')];const jarir=links.some(a=>{try{return new URL(a.href).hostname==='www.jarir.com'}catch{return false}});const paid=/مدفوع|شراء|اقتناء/.test(s.textContent);if(!jarir&&!paid)continue;if(/مجانية رسمية|النسخة المجانية|نسخة متاحة قانونيا/.test(s.textContent)&&!jarir)continue;const p=document.createElement('p');p.className='callout acquisition-note';p.textContent=jarir?'نسخة إلكترونية رسمية مدفوعة عبر قارئ جرير، وليست طبعة ورقية أو ملف PDF مجانيا. إتاحة الشراء والتفعيل في مصر لم تثبت؛ تحقق منها لدى الخدمة قبل الدفع.':'رابط لتوثيق الطبعة. التوفر وإمكان الشراء من مصر لم يتحققا لهذا الرابط، ولا يعني وجوده إتاحة تحميل أو نسخة إلكترونية. نراجع بدائل محلية مناسبة.';s.prepend(p);for(const a of links){if(a.classList.contains('btn')&&/اقتناء|شراء/.test(a.textContent))a.textContent='مرجع الطبعة الورقية ↗';}}})();

// Egyptian paper-edition routes checked on 2026-11-24. Stock can change.
(()=>{
const routes={"dialogue-atheist": {"url": "https://www.shoroukbookstores.com/books/view.aspx?id=c391bf8f-577e-4b17-9d8f-d5a6505515d0", "edition": "طبعة ديوان للنشر، 2024."}, "games-people": {"url": "https://www.shoroukbookstores.com/books/view.aspx?id=d490f291-24db-4ddf-a31f-1f0aa27ece70", "edition": "طبعة آفاق، ترجمة جورج نبيل."}, "renew-life": {"url": "https://www.shoroukbookstores.com/books/view.aspx?id=211248ea-bb4e-4f86-bcdb-32284c87f81e", "inquiry": true}, "butterfly-effect": {"url": "https://www.shoroukbookstores.com/books/view.aspx?id=520f7810-ab88-4380-9ce6-00848d82e5b7", "edition": "طبعة الأهلية، 2015، 280 صفحة."}, "filled-empty": {"url": "https://www.shoroukbookstores.com/books/view.aspx?id=70572049-9547-4667-a9bf-385d37cd7dd6"}, "flamenco": {"url": "https://www.shoroukbookstores.com/books/view.aspx?id=9cfd51eb-7efe-43ac-955e-95b41bd20c8e"}, "father-hate": {"url": "https://www.shoroukbookstores.com/books/view.aspx?id=9befa2fb-0fd9-4881-bb5a-c9fefb0ecce6"}, "dangerous-relations": {"url": "https://www.shoroukbookstores.com/books/view.aspx?id=4dce552f-d498-4345-929b-09be1a19c6d7"}};
const slug=location.pathname.split('/').pop().replace(/\.html$/,'');
const route=routes[slug];
const source=document.querySelector('.book-source');
if(!route||!source)return;
const panel=document.createElement('section');panel.className='callout egypt-route';
const h=document.createElement('h2');h.textContent=route.inquiry?'مسار استفسار داخل مصر':'طبعة ورقية لدى بائع مصري';panel.append(h);
const p=document.createElement('p');p.textContent=route.inquiry?'فهرس الشروق يعرض هذه الطبعة متاحة، لكن واجهة التصفح الدولي تخفي سلة هذا الكتاب. هذا مسار للاستفسار المحلي فقط، وليس شراء إلكترونيا مؤكدا.':'تحققنا في 24 نوفمبر 2026 من أن صفحة هذه الطبعة لدى مكتبات الشروق تعرض الكتاب متاحا وزر إضافة للسلة. هذا بديل ورقي مدفوع من بائع له فروع في مصر، وليس ملف PDF أو كتابا إلكترونيا.';panel.append(p);
if(route.edition){const e=document.createElement('p');e.textContent=route.edition;panel.append(e);}
const caveat=document.createElement('p');caveat.textContent='المخزون قد يتغير. لم نختبر قبول عنوان توصيل بعينه. تأكد من التوصيل والتكلفة مع المكتبة قبل الدفع.';panel.append(caveat);
for(const [url,label] of [[route.url,'الطبعة الورقية لدى الشروق ↗'],['https://www.shoroukbookstores.com/contact/','اسأل المكتبة عن التوفر والتوصيل ↗'],['https://www.shoroukbookstores.com/branches','فروع المكتبة في مصر ↗']]){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='btn';a.textContent=label;panel.append(a,document.createTextNode(' '));}
source.before(panel);
})();
