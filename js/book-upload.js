(()=>{
'use strict';
const $=id=>document.getElementById(id),picker=$('source-file'),zone=$('drop-zone'),status=$('upload-status'),progress=$('upload-progress'),go=$('extract-file'),cancel=$('cancel-extract'),input=$('src');
let file=null,busy=false,token=0,ocr=null,loadingTask=null;const MAX=500*1024*1024;
function say(text,p){status.textContent=text;if(p!==undefined){progress.hidden=false;progress.value=p;}}
function state(on){busy=on;go.disabled=on;picker.disabled=on;cancel.hidden=!on;['run','clear','src','ocr-language','pdf-start','pdf-end','summary-mode','pdf-ocr'].forEach(id=>$(id).disabled=on);}
function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error('تعذر تنزيل محرك القراءة. تحقق من الإنترنت ثم أعد المحاولة.'));};document.head.append(s);});}
function choose(f){if(busy||!f)return;const ext=f.name.split('.').pop().toLowerCase();if(!['pdf','txt','png','jpg','jpeg','webp'].includes(ext)){say('الصيغة غير مدعومة. اختر PDF أو TXT أو صورة PNG / JPG / WEBP.');return;}if(f.size>MAX){say('الملف أكبر من ٥٠٠ ميجابايت، ويتجاوز الحد المدعوم.');return;}file=f;$('file-ready').hidden=false;$('file-name').textContent=f.name+' · '+(f.size/1024/1024).toFixed(2)+' MB';say('الملف جاهز. اترك نهاية النطاق فارغة للكتاب كله. ستُقرأ الصفحات المتضررة ضوئيا تلقائيا؛ قد يطول ذلك على الهاتف.');progress.hidden=true;}
function check(t){if(t!==token)throw new Error('cancelled');}
function normalize(s){return s.replace(/\u0000/g,'').normalize('NFKC').replace(/[\u200E\u200F\u202A-\u202E]/g,'').trim();}
// Heuristics detect broken font mappings and short isolated glyph clusters, not just empty pages.
function quality(text){const s=normalize(text),w=s.match(/[\p{L}]+/gu)||[],arabic=w.filter(x=>/[\u0621-\u064A]/.test(x)),short=arabic.filter(x=>x.length===1).length;
 const scrambled=(s.match(/(?:^|\s)(?:يف|عىل|إىل|بني|حني|غري|كثري|يشء|امل[\u0621-\u064A]{2,})(?=\s|[،؛.!؟])/g)||[]).length;
 const bad=(text.match(/\u0000|�/g)||[]).length;
 return {needs:s.length<35||bad>2||(arabic.length>15&&(short/arabic.length>.17||scrambled>=2)),words:w.length};}
async function engine(t,report){if(ocr)return ocr;if(!window.Tesseract)await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js');check(t);
 const worker=await Tesseract.createWorker($('ocr-language').value,1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',langPath:'https://tessdata.projectnaptha.com/4.0.0',logger:m=>{if(t===token&&m.status==='recognizing text')report(Math.round(m.progress*100));}});
 if(t!==token){await worker.terminate();check(t);}ocr=worker;return worker;}
picker.addEventListener('change',()=>choose(picker.files[0]));['dragenter','dragover'].forEach(e=>zone.addEventListener(e,x=>{x.preventDefault();zone.classList.add('dragging');}));['dragleave','drop'].forEach(e=>zone.addEventListener(e,x=>{x.preventDefault();zone.classList.remove('dragging');}));zone.addEventListener('drop',e=>{if(e.dataTransfer.files.length!==1){say('اختر ملفا واحدا في كل مرة.');return;}choose(e.dataTransfer.files[0]);});
cancel.addEventListener('click',async()=>{token++;say('جارٍ إلغاء الاستخراج… النص السابق لن يتغير.');if(ocr){await ocr.terminate().catch(()=>{});ocr=null;}if(loadingTask){await loadingTask.destroy().catch(()=>{});loadingTask=null;}});
go.addEventListener('click',async()=>{
 if(!file||busy)return;const t=++token;let pdf=null;state(true);say('جارٍ تجهيز الملف…',0);
 try{let text='',pageInfo='',emptyPages=0,ocrPages=0,weakPages=0;const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='txt'){text=await file.text();check(t);}
 else if(ext==='pdf'){
  say('جارٍ تحميل قارئ PDF…',1);const lib=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.mjs');check(t);lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.mjs';
  loadingTask=lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});pdf=await loadingTask.promise;check(t);
  const from=Math.max(1,Math.floor(Number($('pdf-start').value)||1)),to=Math.min(pdf.numPages,Math.floor(Number($('pdf-end').value)||pdf.numPages));if(from>to)throw new Error('نطاق الصفحات غير صحيح. عدد صفحات الملف '+pdf.numPages+'.');
  const pages=[],mode=$('pdf-ocr').value;pageInfo='الصفحات '+from+' إلى '+to+' من أصل '+pdf.numPages+'. ';let current=from;
  const report=p=>say('قراءة ضوئية للصفحة '+current+' من '+to+' · '+p+'٪. قد تحتاج الكتب المصورة وقتا طويلا. يمكنك الإلغاء.',Math.round(3+94*(current-from+p/100)/(to-from+1)));
  for(let n=from;n<=to;n++){
   check(t);current=n;say('فحص صفحة '+n+' من '+to+'…',Math.round(3+94*(n-from)/(to-from+1)));
   const page=await pdf.getPage(n);let canvas=null;
   try{const content=await page.getTextContent();check(t);let line='';for(const item of content.items){if(typeof item.str==='string')line+=item.str+(item.hasEOL?'\n':' ');}
    if(mode==='always'||(mode==='auto'&&quality(line).needs)){
     report(0);const worker=await engine(t,report);check(t);
     // Bound canvas area and reuse a single OCR worker for the entire document.
     const base=page.getViewport({scale:1}),scale=Math.min(2.5,Math.sqrt(2800000/(base.width*base.height))),view=page.getViewport({scale});
     canvas=document.createElement('canvas');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
     await page.render({canvasContext:canvas.getContext('2d'),viewport:view}).promise;check(t);
     const result=await worker.recognize(canvas);check(t);line=result.data.text;ocrPages++;
     if((line.trim().length>35&&result.data.confidence<55)||quality(line).needs)weakPages++;
    }
    line=normalize(line);if(line.length<20)emptyPages++;pages.push(line);
   }finally{if(canvas){canvas.width=0;canvas.height=0;canvas=null;}page.cleanup();}
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  // Remove repeated running headers/footers and standalone page numbers.
  const repeats=new Map();pages.forEach(p=>new Set(p.split('\n').map(l=>l.trim()).filter(l=>l.length>2&&l.length<65)).forEach(l=>repeats.set(l,(repeats.get(l)||0)+1)));
  const threshold=Math.max(5,Math.ceil(pages.length*.12));text=pages.map(p=>p.split('\n').filter(l=>!/^\s*[\d٠-٩]+\s*$/.test(l)&&(repeats.get(l.trim())||0)<threshold).join('\n')).join('\n\n');
 }else{
  say('جارٍ تحميل محرك قراءة الصور وملف اللغة…',5);const worker=await engine(t,p=>say('جارٍ قراءة الصورة… '+p+'٪',5+Math.round(p*.9)));check(t);const result=await worker.recognize(file);check(t);text=result.data.text;ocrPages=1;if(result.data.confidence<55)weakPages=1;
 }
 check(t);text=normalize(text);if(text.length<20)throw new Error('لم نجد نصا كافيا حتى بعد محاولة القراءة. جرّب نسخة أو صورة أوضح.');
 input.value=text;input.dataset.pages=pageInfo;input.dispatchEvent(new Event('input',{bubbles:true}));$('out').textContent='النص المستخرج جاهز للمراجعة. اضغط لخّص عندما تكون جاهزا.';$('stats').textContent='';$('actions').hidden=true;
 say('تم استخراج كل النطاق المحدد دون قص. '+pageInfo+text.split(/\s+/).length+' كلمة. '+(ocrPages?'قُرئت '+ocrPages+' صفحات ضوئيا. ':'')+(emptyPages?'تنبيه: '+emptyPages+' صفحات فارغة أو ذات نص قليل. ':'')+(weakPages?'جودة القراءة ضعيفة في '+weakPages+' صفحات؛ راجعها قبل التلخيص. ':'')+'راجع النص بالأسفل ثم اضغط لخّص.',100);
 }catch(e){if(t===token)say(e.name==='PasswordException'?'هذا PDF محمي بكلمة مرور. افتح نسخة غير محمية تملك حق استخدامها.':e.message||'تعذر قراءة الملف. جرّب ملفا آخر.');}
 finally{if(ocr){await ocr.terminate().catch(()=>{});ocr=null;}if(pdf)await pdf.destroy().catch(()=>{});loadingTask=null;state(false);if(t!==token){say('تم إلغاء الاستخراج. النص السابق لم يتغير.');progress.hidden=true;}}
});
})();
