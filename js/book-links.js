/* Documented purchase destinations. No click counting or automatic navigation. */
(()=>{'use strict';
const script=document.currentScript,root=new URL('../',script.src);
// Retire this key only. Consent, focus and all other preferences are untouched.
try{localStorage.removeItem('sittoun.paidClicks.v1')}catch{/* Storage may be disabled. */}
function safe(raw){try{const u=new URL(raw);return /^https?:$/.test(u.protocol)&&u.hostname&&!u.username&&!u.password?u.href:null}catch{return null}}
let pending;function load(){if(!pending)pending=(async()=>{const get=async u=>{const r=await fetch(u);if(!r.ok)throw Error('registry');const d=await r.json();if(!Array.isArray(d.books))throw Error('registry');return d};const d=await get(new URL('data/books.json',root));for(const name of d.additional_files||[]){if(!/^books-[0-9]+\.json$/.test(name))throw Error('registry path');d.books.push(...(await get(new URL('data/'+name,root))).books)}return d.books})();return pending}
function route(book,n){return n==='0'?book:(book.alternative_routes||[]).find(r=>r.route_id===n)}
function node(tag,cls,text){let e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e}
function describe(book,selected){const dest=safe(selected.destination_url);if(!dest)return null;return{dest,name:selected.source_name||book.source_name||new URL(dest).hostname,edition:(selected.edition_notes||(selected===book?book.edition_notes:[])||[]).join(' ')||'لم نوثق نوع الطبعة لهذا المرجع.',availability:selected.availability_note||(selected===book?book.availability_note:null)||'السعر والتوفر والتوصيل أو التفعيل غير مؤكدين الآن؛ راجع المصدر قبل الدفع.'}}
async function info(raw){const dest=safe(raw);if(!dest)return null;const books=await load();for(const b of books){if(b.routing_status!=='active')continue;for(const s of[b,...(b.alternative_routes||[])])if(safe(s.destination_url)===dest)return describe(b,s)}return{dest,name:new URL(dest).hostname,edition:'لم نوثق اسم المتجر أو نوع الطبعة لهذا المرجع في سجل التحويلات؛ المعروض هو نطاق الوجهة.',availability:'هذا مرجع طبعة مدفوعة، وليس تأكيدا للتوفر أو السعر أو إمكانية الشراء والتوصيل في بلدك.'}}
function panel(d){const box=node('section','callout paid-destination');box.setAttribute('aria-label','وجهة شراء خارجية');box.append(node('p','', 'المصدر: '+d.name),node('p','meta',d.edition),node('p','meta',d.availability),node('p','meta','ستغادر «ستّون» إلى موقع المصدر. راجع بيانات الطبعة والسعر وشروط الشراء هناك.'));const a=node('a','btn','فتح صفحة المصدر: '+d.name+' ↗');a.href=d.dest;a.target='_blank';a.rel='noopener noreferrer';const url=node('a','meta destination-url',d.dest);url.href=d.dest;url.target='_blank';url.rel='noopener noreferrer';url.dir='ltr';box.append(a,url);return box}
async function resolve(raw){const u=new URL(raw,location.href);if(u.pathname!==new URL('go.html',root).pathname||u.origin!==root.origin)return null;if([...u.searchParams.keys()].some(k=>!['id','route'].includes(k))||u.searchParams.getAll('id').length!==1||u.searchParams.getAll('route').length>1)return null;const id=u.searchParams.get('id'),n=u.searchParams.get('route')||'0';if(!/^[a-z0-9-]+$/.test(id||'')||!/^\d+$/.test(n))return null;const b=(await load()).find(b=>b.id===id&&b.routing_status==='active'),s=b&&route(b,n);return s?describe(b,s):null}
window.SittounPaid={info,panel,resolve};
if(document.body.dataset.bookRouter==='true'){
 const status=document.getElementById('route-status'),fallback=document.getElementById('route-fallback');fallback.hidden=true;
 resolve(location.href).then(d=>{if(!d)throw Error('route');status.textContent='راجع الوجهة، ثم افتح رابط المصدر المباشر أدناه.';fallback.before(panel(d))}).catch(()=>{status.textContent='تعذر فتح هذا المرجع. ارجع إلى صفحة الكتاب لاختيار مصدره.'});
}
})();
