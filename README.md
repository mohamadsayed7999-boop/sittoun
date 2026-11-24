# ستّون ⏱ — خلاصة كل كتاب في 60 ثانية

موقع عربي ثابت (HTML + CSS + JavaScript صافي، بلا مكتبات ولا خطوات بناء):
خلاصات كتب، أداة تلخيص فورية تعمل محلياً داخل المتصفح، فيديوهات قصيرة تُحمَّل عند النقر،
ومساحات إعلان ومحتوى مدفوع منظّمة.

## الملفات
| الملف | دوره |
|---|---|
| index.html | الرئيسية: هيرو، خلاصات، فيديوهات، ستّون بلس، إعلانات |
| tool.html | أداة التلخيص (30/60/90 ثانية) |
| about.html privacy.html terms.html contact.html | الصفحات الأساسية |
| summaries/*.html | صفحة مستقلة لكل خلاصة |
| css/style.css | التصميم، الوضع الليلي/النهاري، RTL |
| js/app.js | واتساب، نسخ الرابط، تشغيل الفيديو عند النقر |
| js/summarizer.js | منطق التلخيص الاستخراجي |

## التجربة محلياً
افتح index.html مباشرة في المتصفح، أو شغّل خادماً بسيطاً:
python3 -m http.server 8000
ثم افتح http://localhost:8000.

## الرفع على GitHub (من المتصفح)
1. ادخل github.com ثم New repository، الاسم sittoun، اختر Public، ولا تضف README.
2. اضغط uploading an existing file.
3. اسحب محتويات المجلد (الملفات والمجلدات css وjs وsummaries)، لا المجلد نفسه.
4. اضغط Commit changes.

## الرفع بالأوامر
git init
git add .
git commit -m "ستّون: أول إصدار"
git branch -M main
git remote add origin https://github.com/USERNAME/sittoun.git
git push -u origin main
## تفعيل GitHub Pages
**Settings ← Pages ← Source: Deploy from a branch ← Branch: main / Folder: / (root) ← Save.**
بعد دقيقة إلى ثلاث يظهر الرابط: https://USERNAME.github.io/sittoun/

## عناصر نائبة متبقية (اختيارية)
| العنصر | أين | بماذا تستبدله |
|---|---|---|
| VIDEO_ID | index.html (التعليق داخل قسم الفيديو) | معرّف فيديو يوتيوب عند توفر فيديوهات |

صفحة التواصل تعمل حالياً عبر البريد المباشر (mailto) دون الحاجة إلى formspree.

## إضافة خلاصة جديدة
1. انسخ ملف summaries/deep-work.html باسم جديد.
2. عدّل: <title>، description، وسوم og:، العنوان، المؤلف، الأفكار، فقرة «طبّقها اليوم»، ونص data-wa.
3. أضف بطاقة جديدة داخل <div class="grid"> في index.html.
اكتب الخلاصات بصياغتك الخاصة ولا تنسخ نصوص الكتب.

## الإعلانات
مساحات .ad-slot محجوزة الارتفاع فلا تقفز الصفحة. عند إضافة شبكة إعلانية (مثل AdSense)
عدّل وسم Content-Security-Policy في كل صفحة HTML ليسمح بنطاقاتها، وإلا ستحجبها السياسة.
وحدّث صفحة الخصوصية بما يناسب الشبكة، وأضف إشعار الموافقة على الكوكيز إن كان جمهورك يتطلبه.

## الخصوصية والأمان
- أداة التلخيص تعمل بالكامل داخل المتصفح ولا ترسل النصوص لأي خادم.
- سياسة CSP صارمة، ولا يوجد innerHTML مع مدخلات المستخدم (يُستخدم textContent).
- مشغّل يوتيوب (youtube-nocookie) لا يُحمَّل إلا بعد النقر.
- حقل Honeypot في نموذج التواصل، وروابط خارجية بـ noopener.

## وسوم المشاركة (Open Graph)
كل صفحة تحتوي og:title وog:description وog:type. لإظهار صورة عند المشاركة،
أضف في <head> الصفحة المطلوبة (بعد رفع الصورة إلى المستودع):
<meta property="og:image" content="https://USERNAME.github.io/sittoun/img/cover.png">
وأضف img-src المناسب إن استخدمت نطاقاً آخر.

## Google Analytics 4

Installation is ready but disabled until a real Measurement ID is set in `js/analytics.js`. See [ANALYTICS.md](ANALYTICS.md) for setup, privacy and verification steps.
