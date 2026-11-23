// تلخيص استخراجي محلي بالكامل داخل المتصفح (لا يُرسل أي نص لأي خادم)
(function () {
  'use strict';

  var WPM = 180;          // سرعة القراءة التقريبية بالعربية (كلمة/دقيقة)
  var MAX_CHARS = 20000;  // الحد الأقصى للنص المدخل
  var MIN_WORDS = 40;     // أقل عدد كلمات للتلخيص

  function $(id) { return document.getElementById(id); }
  function fmt(n) { return Number(n).toLocaleString('ar-EG'); }
  function wc(t) { return (t.trim().match(/\S+/g) || []).length; }

  // توحيد الكلمة: إزالة التشكيل والتطويل وتوحيد الألف والياء والتاء المربوطة وقصّ "ال"
  function norm(w) {
    return w
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\p{L}\p{N}]/gu, '')
      .replace(/^(وال|بال|كال|فال|لل|ال)(?=.{3,})/, '')
      .toLowerCase();
  }

  var STOP = new Set((
    'في من على إلى عن أن إن أنه أنها هذا هذه هذان ذلك تلك هؤلاء التي الذي الذين اللذين كان كانت يكون تكون هو هي هم هن ما لا لم لن لا مع أو ثم قد كل بعد قبل عند بين حتى هل كما إذا إذ لكن هناك أيضا أيضاً حيث نحن أنا أنت أنتم به بها له لها فيه فيها منه منها عليه عليها إليه إليها كذلك لذلك بل أي أمام خلال عبر دون غير سوى فقط جدا جداً مثل بعض كثير كثيرا عندما بينما لأن لأنه ولكن وهو وهي وقد ومن وفي وعلى وإن'
  ).split(/\s+/).map(norm));

  function keywords(s) {
    return (s.match(/\S+/g) || []).map(norm).filter(function (w) { return w.length > 2 && !STOP.has(w); });
  }

  // تقسيم إلى جمل (بدون lookbehind لدعم متصفحات أقدم)
  function splitSentences(text) {
    var out = [];
    text.replace(/\r/g, '').split(/\n+/).forEach(function (line) {
      var parts = line.replace(/[ \t]+/g, ' ').match(/[^.!؟?۔…]+[.!؟?۔…]*/g) || [];
      parts.forEach(function (p) {
        p = p.trim();
        if (wc(p) >= 4) out.push(p);
      });
    });
    // إزالة الجمل المتطابقة تماماً
    var seen = new Set();
    return out.filter(function (s) {
      var k = s.replace(/\s+/g, ' ');
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function jaccard(a, b) {
    if (!a.size || !b.size) return 0;
    var inter = 0;
    a.forEach(function (x) { if (b.has(x)) inter++; });
    return inter / (a.size + b.size - inter);
  }

  function summarize(text, target) {
    var sents = splitSentences(text);
    var total = wc(text);
    if (total <= target) return text.trim();
    if (sents.length < 3) {
      return (text.trim().match(/\S+/g) || []).slice(0, target).join(' ') + '…';
    }

    var N = sents.length;
    var tf = new Map(), df = new Map();
    var items = sents.map(function (s, i) {
      var arr = keywords(s);
      arr.forEach(function (w) { tf.set(w, (tf.get(w) || 0) + 1); });
      var set = new Set(arr);
      set.forEach(function (w) { df.set(w, (df.get(w) || 0) + 1); });
      return { s: s, i: i, set: set, wc: wc(s), score: 0 };
    });

    // وزن الكلمة: تكرارها × ندرتها بين الجمل (تجاهل الكلمات المفردة)
    function weight(w) {
      var f = tf.get(w);
      return f < 2 ? 0 : f * Math.log(1 + N / df.get(w));
    }

    items.forEach(function (it) {
      var sum = 0;
      it.set.forEach(function (w) { sum += weight(w); });
      var score = sum / Math.pow(it.set.size || 1, 0.7);
      if (it.wc < 6) score *= 0.7;       // جملة قصيرة جداً
      if (it.wc > 45) score *= 0.8;      // جملة طويلة جداً
      if (it.i === 0) score *= 1.25;     // عادةً تحمل الفكرة الرئيسية
      else if (it.i < N * 0.1) score *= 1.1;
      it.score = score + 0.001 * (N - it.i); // ترجيح موضعي عند التعادل
    });

    var maxScore = items.reduce(function (m, x) { return Math.max(m, x.score); }, 0) || 1;
    var pool = items.slice();
    var chosen = [], used = 0;

    // مرحلتان: صارمة ضد التشابه ثم أخف إن لم نبلغ الطول المطلوب
    [0.5, 0.75].forEach(function (simMax) {
while (pool.length && used < target) {
        var best = -1, bestVal = -Infinity;
        for (var k = 0; k < pool.length; k++) {
          var c = pool[k];
          var sim = 0;
          for (var j = 0; j < chosen.length; j++) {
            sim = Math.max(sim, jaccard(c.set, chosen[j].set));
          }
          if (sim > simMax) continue;
          if (chosen.length && used + c.wc > target * 1.2) continue;
          var val = 0.75 * (c.score / maxScore) - 0.25 * sim;
          if (val > bestVal) { bestVal = val; best = k; }
        }
        if (best < 0) break;
        var pick = pool.splice(best, 1)[0];
        chosen.push(pick);
        used += pick.wc;
      }
    });

    return chosen.sort(function (a, b) { return a.i - b.i; })
      .map(function (x) { return x.s; }).join('\n\n');
  }

  function fmtTime(words) {
    var sec = Math.max(1, Math.round((words / WPM) * 60));
    return sec < 90 ? fmt(sec) + ' ث' : fmt(Math.round(sec / 60)) + ' د';
  }

  var input = $('src'), secs = $('secs'), out = $('out'),
      stats = $('stats'), count = $('count'), actions = $('actions');

  input.addEventListener('input', function () {
    var n = wc(input.value);
    count.textContent = fmt(n) + ' كلمة · وقت القراءة ~' + fmtTime(n);
  });

  $('run').addEventListener('click', function () {
    var text = input.value.trim().slice(0, MAX_CHARS);
    if (wc(text) < MIN_WORDS) {
      out.textContent = 'الصق نصاً أطول (' + fmt(MIN_WORDS) + ' كلمة على الأقل) ليتمكن من تلخيصه.';
      stats.textContent = '';
      actions.hidden = true;
      return;
    }
    var target = Math.round((Number(secs.value) / 60) * WPM);
    var res = summarize(text, target);
    var a = wc(text), b = wc(res);
    out.textContent = res;
    var savedMin = Math.max(0, Math.round((a - b) / WPM));
    stats.textContent = 'الأصل: ' + fmt(a) + ' كلمة (' + fmtTime(a) + ') ← الخلاصة: ' +
      fmt(b) + ' كلمة (' + fmtTime(b) + ') · الوقت الموفَّر ~' + fmt(savedMin) + ' دقيقة';
    actions.hidden = false;
  });

  $('clear').addEventListener('click', function () {
    input.value = '';
    count.textContent = '';
    stats.textContent = '';
    out.textContent = 'ستظهر الخلاصة هنا.';
    actions.hidden = true;
  });

  $('copy').addEventListener('click', async function (e) {
    try {
      await navigator.clipboard.writeText(out.textContent);
      e.target.textContent = 'تم النسخ ✓';
    } catch (err) {
      e.target.textContent = 'تعذّر النسخ';
    }
  });

  $('share').addEventListener('click', function () {
    var t = out.textContent.slice(0, 500);
    if (navigator.share) {
      navigator.share({ title: 'خلاصة من ستّون', text: t }).catch(function () {});
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener');
    }
  });
})();
