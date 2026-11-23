(()=>{
'use strict';
const $=id=>document.getElementById(id),input=$('src'),out=$('out'),stats=$('stats'),actions=$('actions'),run=$('run'),stop=$('cancel-summary');
let worker=null,job=0;const wc=s=>(s.match(/\S+/g)||[]).length,fmt=n=>Number(n).toLocaleString('ar-EG');
function lock(on){['src','summary-mode','extract-file','source-file','pdf-start','pdf-end','ocr-language','clear'].forEach(id=>$(id).disabled=on);$('secs').disabled=on||$('summary-mode').value==='book';}
function idle(){run.disabled=false;stop.hidden=true;lock(false);}
function cancel(){job++;if(worker)worker.terminate();worker=null;idle();stats.textContent='تم إلغاء التلخيص. النص الأصلي لم يتغير.';}
input.addEventListener('input',e=>{if(e.isTrusted)delete input.dataset.pages;$('count').textContent=fmt(wc(input.value))+' كلمة · '+fmt(input.value.length)+' حرف · تتم معالجة النص كله دون قص صامت.';});
$('summary-mode').addEventListener('change',()=>{$('secs').disabled=$('summary-mode').value==='book';});
run.addEventListener('click',()=>{
 if(wc(input.value)<40){out.textContent='أضف نصا من ٤٠ كلمة على الأقل.';return;}
 const id=++job;lock(true);run.disabled=true;stop.hidden=false;$('clear').disabled=true;actions.hidden=true;stats.textContent='جارٍ تحليل النص كله في الخلفية وتجميع نتيجة واحدة مرتبة…';
 worker=new Worker('js/summary-worker.js?v=1');worker.onmessage=e=>{
  if(id!==job)return;const data=e.data;worker.terminate();worker=null;idle();out.replaceChildren();
  if(data.error){out.textContent=data.error;stats.textContent='لم نعرض نتيجة جزئية على أنها مكتملة.';return;}
  const note=document.createElement('p');note.className='callout';note.textContent='خلاصة استخراجية من جمل المصدر، وليست إعادة صياغة ذكية أو بديلا عن الكتاب. روجع النص كله، لكن الخلاصة لا تضمن ذكر كل فكرة أو حدث. راجع أخطاء الاستخراج والأسماء قبل الاعتماد عليها.';out.append(note);
  data.segments.forEach(segment=>{if(data.mode==='book'){const h=document.createElement('h3');h.textContent=data.coverage===1?'أبرز ما في النص':'من الجزء '+fmt(segment.section)+' من '+fmt(segment.total)+' بحسب ترتيب النص';out.append(h);}segment.text.split('\n\n').forEach(text=>{const p=document.createElement('p');p.textContent=text;out.append(p);});});
  stats.textContent=(input.dataset.pages||'')+'عولج النص المتاح كاملا: '+fmt(data.totalWords)+' كلمة · الناتج: '+fmt(data.summaryWords)+' كلمة · اختيار موزع على '+fmt(data.coverage)+' أجزاء من بداية المصدر إلى نهايته، وليست فصولا مكتشفة تلقائيا.'+(data.rejected?' تم استبعاد '+fmt(data.rejected)+' مقاطع قصيرة أو مشوهة؛ راجع النص إن بدت النتيجة ناقصة.':'');actions.hidden=false;
 };worker.onerror=()=>{if(id!==job)return;cancel();out.textContent='تعذر تشغيل التحليل على هذا الجهاز. لم ننتج ملخصا جزئيا. حاول من متصفح حديث.';};
 worker.postMessage({text:input.value,mode:$('summary-mode').value,seconds:$('secs').value});
});
stop.addEventListener('click',cancel);
$('clear').addEventListener('click',()=>{if(worker)cancel();input.value='';delete input.dataset.pages;out.textContent='ستظهر الخلاصة هنا.';stats.textContent='';$('count').textContent='';actions.hidden=true;});
$('copy').addEventListener('click',async e=>{try{await navigator.clipboard.writeText(out.innerText);e.target.textContent='تم النسخ ✓';}catch{e.target.textContent='تعذر النسخ';}});
$('share').addEventListener('click',()=>{const text=out.innerText.slice(0,1500);if(navigator.share)navigator.share({title:'خلاصة من ستّون',text}).catch(()=>{});else window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener');});
})();
