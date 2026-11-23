(()=>{
'use strict';
const $=id=>document.getElementById(id),picker=$('source-file'),zone=$('drop-zone'),status=$('upload-status'),progress=$('upload-progress'),go=$('extract-file'),cancel=$('cancel-extract'),input=$('src');
let file=null,busy=false,token=0,worker=null,loadingTask=null;const LIMIT=100000,MAX=500*1024*1024;
function say(text,p){status.textContent=text;if(p!==undefined){progress.hidden=false;progress.value=p;}}
function state(on){busy=on;go.disabled=on;picker.disabled=on;cancel.hidden=!on;['run','clear','src','ocr-language','pdf-start','pdf-end'].forEach(id=>$(id).disabled=on);}
function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error('تعذر تنزيل محرك القراءة. تحقق من الإنترنت ثم أعد المحاولة.'));};document.head.append(s);});}
function choose(f){if(busy)return;if(!f)return;const ext=f.name.split('.').pop().toLowerCase();if(!['pdf','txt','png','jpg','jpeg','webp'].includes(ext)){say('الصيغة غير مدعومة. اختر PDF أو TXT أو صورة PNG / JPG / WEBP.');return;}if(f.size>MAX){say('الملف أكبر من ٥٠٠ ميجابايت. قسّم الكتاب إلى أجزاء أصغر.');return;}file=f;$('file-ready').hidden=false;$('file-name').textContent=f.name+' · '+(f.size/1024/1024).toFixed(2)+' MB';say(f.size>20*1024*1024?'ملف كبير. ابدأ بنطاق قصير من صفحات PDF. قد يستهلك ذاكرة كبيرة على الهاتف.':'الملف جاهز. اختر نطاق الصفحات للـ PDF، ثم اضغط استخرج النص.');progress.hidden=true;}
picker.addEventListener('change',()=>choose(picker.files[0]));['dragenter','dragover'].forEach(e=>zone.addEventListener(e,x=>{x.preventDefault();zone.classList.add('dragging');}));['dragleave','drop'].forEach(e=>zone.addEventListener(e,x=>{x.preventDefault();zone.classList.remove('dragging');}));zone.addEventListener('drop',e=>{if(e.dataTransfer.files.length!==1){say('اختر ملفاً واحداً في كل مرة.');return;}choose(e.dataTransfer.files[0]);});
cancel.addEventListener('click',async()=>{token++;say('تم إلغاء الاستخراج. النص السابق لم يتغير.');if(worker){await worker.terminate().catch(()=>{});worker=null;}if(loadingTask){await loadingTask.destroy().catch(()=>{});loadingTask=null;}progress.hidden=true;});
function check(t){if(t!==token)throw new Error('cancelled');}
go.addEventListener('click',async()=>{
if(!file||busy)return;const t=++token;let pdf=null;state(true);say('جارٍ تجهيز الملف…',0);
try{let text='',truncated=false,emptyPages=0;const ext=file.name.split('.').pop().toLowerCase();
if(ext==='txt'){text=await file.text();check(t);}
else if(ext==='pdf'){
 say('جارٍ تحميل قارئ PDF…',3);const lib=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.mjs');check(t);lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.mjs';
 loadingTask=lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});pdf=await loadingTask.promise;check(t);const from=Math.max(1,Math.floor(Number($('pdf-start').value)||1)),to=Math.min(pdf.numPages,Math.floor(Number($('pdf-end').value)||pdf.numPages));if(from>to)throw new Error('نطاق الصفحات غير صحيح. عدد صفحات الملف '+pdf.numPages+'.');
 let empty=0;for(let n=from;n<=to;n++){check(t);say('قراءة صفحة '+n+' من '+to+'…',Math.round(10+85*(n-from)/(to-from+1)));const page=await pdf.getPage(n),content=await page.getTextContent();check(t);let line='';for(const item of content.items){line+=item.str+(item.hasEOL?'\n':' ');}if(line.trim().length<20)empty++;text+=line+'\n\n';page.cleanup();if(text.length>LIMIT){truncated=true;break;}await new Promise(r=>setTimeout(r,0));}
 emptyPages=empty;if(empty)say('توجد صفحات بلا نص قابل للاستخراج. استخدم صورة واضحة لها لقراءتها ضوئياً.');
}else{
 say('جارٍ تحميل محرك قراءة الصور وملف اللغة. قد يستغرق أول استخدام بعض الوقت…',5);if(!window.Tesseract)await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js');check(t);
 worker=await Tesseract.createWorker($('ocr-language').value,1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',langPath:'https://tessdata.projectnaptha.com/4.0.0',logger:m=>{if(t===token&&m.status==='recognizing text')say('جارٍ قراءة الصورة… '+Math.round(m.progress*100)+'٪',10+Math.round(m.progress*85));}});check(t);const result=await worker.recognize(file);check(t);text=result.data.text;
}
check(t);text=text.normalize('NFKC').replace(/[\u200E\u200F\u202A-\u202E]/g,'').trim();if(text.length<20)throw new Error('لم نجد نصاً كافياً. إذا كان PDF مصوراً، احفظ صورة واضحة للصفحة واخترها هنا.');if(text.length>LIMIT){text=text.slice(0,LIMIT);truncated=true;}
 input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));$('out').textContent='النص المستخرج جاهز للمراجعة. اضغط لخّص عندما تكون جاهزاً.';$('stats').textContent='';$('actions').hidden=true;say((truncated?'تم الوصول إلى حد ١٠٠ ألف حرف. عالج الصفحات الباقية في دفعة أخرى. ':'تم استخراج النص بنجاح. ')+text.split(/\s+/).length+' كلمة. '+(emptyPages?'تنبيه: '+emptyPages+' صفحات بلا نص قابل للاستخراج؛ استخدم صوراً واضحة لها. ':'')+'راجعه بالأسفل ثم اضغط لخّص.',100);
}catch(e){if(t===token)say(e.name==='PasswordException'?'هذا PDF محمي بكلمة مرور. افتح نسخة غير محمية تملك حق استخدامها.':e.message||'تعذر قراءة الملف. جرّب ملفاً آخر.');}
finally{if(worker){await worker.terminate().catch(()=>{});worker=null;}if(pdf){await pdf.destroy().catch(()=>{});}loadingTask=null;state(false);}
});
})();
