/* Local whole-source extractive analysis. No network calls. */
'use strict';
const STOP=new Set('في من على الى عن ان انه انها هذا هذه ذلك تلك التي الذي الذين كان كانت يكون تكون هو هي هم ما لا لم لن مع او ثم قد كل بعد قبل عند بين حتى هل كما اذا اذ لكن هناك ايضا حيث نحن انا انت به بها له لها فيه فيها منه منها عليه عليها كذلك لذلك بل اي امام خلال عبر دون غير سوى فقط جدا مثل بعض كثير عندما بينما لان وهو وهي وقد ومن وفي وعلى وان'.split(' '));
const norm=s=>s.toLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
const words=s=>s.match(/[\p{L}\p{N}]+/gu)||[];
const keys=s=>words(norm(s)).filter(w=>w.length>2&&!STOP.has(w));
function clean(s){return s.normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,'').replace(/\u0000/g,'').replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/ +([،؛؟!:.])/g,'$1').trim();}
function analyze(text,mode,seconds){
 const blocks=clean(text).split(/\n\s*\n/),items=[],seen=new Set();let rejected=0;
 // Exact dedup is linear; no comparison of every sentence with every earlier sentence.
 for(const block of blocks){
  const value=block.split('\n').filter(l=>!/^\s*[\d٠-٩]+\s*$/.test(l)).join(' ');
  const parts=value.match(/[^.!؟?۔…]+(?:[.!؟?۔…]+|$)/g)||[];
  for(let part of parts){part=part.trim();const w=words(part),letters=(part.match(/\p{L}/gu)||[]).length;
   if(w.length<7||w.length>180||w.filter(x=>/^[\d٠-٩]+$/.test(x)).length>w.length*.12||letters<part.replace(/\s/g,'').length*.6||/�|[|_]{2,}|(.)\1{6,}/u.test(part)){rejected++;continue;}
   const id=norm(part).replace(/[^\p{L}\p{N}]/gu,'');if(seen.has(id))continue;seen.add(id);
   items.push({s:part,i:items.length,w:w.length,k:keys(part)});
  }
 }
 if(!items.length)return {error:'لم نجد جملا سليمة كافية. راجع النص المستخرج؛ لا يمكن إصلاح نص OCR تالف بمجرد تلخيصه.'};
 const total=(text.trim().match(/\S+/g)||[]).length,target=mode==='book'?Math.min(4200,Math.max(650,Math.round(total*.035))):Math.round(Number(seconds)/60*180);
 // Stratify over the full source so the end is never silently ignored.
 const groups=mode==='book'?Math.min(16,Math.max(1,Math.ceil(total/3500))):Math.min(6,Math.max(1,Math.floor(target/70)));
 const segments=Array.from({length:groups},()=>[]);
 items.forEach((it,i)=>segments[Math.min(groups-1,Math.floor(i*groups/items.length))].push(it));
 const result=[],globalSeen=new Set();let used=0;
 segments.forEach((segment,section)=>{
  const freq=new Map();segment.forEach(it=>it.k.forEach(k=>freq.set(k,(freq.get(k)||0)+1)));
  const budget=Math.max(45,Math.round(target/groups));
  const rank=segment.map((it,j)=>({...it,score:it.k.reduce((n,k)=>n+Math.log(1+(freq.get(k)||0)),0)/Math.pow(it.k.length||1,.65)*(j===0?1.12:1)})).sort((a,b)=>b.score-a.score);
  const chosen=[];let local=0;
  for(const item of rank){if(local>=budget)break;if(item.w>budget*1.3&&chosen.length)continue;
   const tokens=new Set(item.k);let duplicate=false;
   for(const old of chosen){let overlap=0;tokens.forEach(k=>{if(old.tokens.has(k))overlap++;});if(overlap/Math.max(1,Math.min(tokens.size,old.tokens.size))>.8){duplicate=true;break;}}
   if(duplicate||globalSeen.has(item.i))continue;
   // One preceding source sentence can restore a referent without invented transitions.
   const prev=items[item.i-1];if(prev&&prev.i>=segment[0].i&&/^(هو|هي|هذا|هذه|ذلك|تلك|لكن|ولكن|لذلك|ثم|فقال|قال)/.test(item.s)&&!globalSeen.has(prev.i)&&local+prev.w+item.w<budget*1.35){chosen.push({...prev,tokens:new Set(prev.k)});globalSeen.add(prev.i);local+=prev.w;}
   chosen.push({...item,tokens});globalSeen.add(item.i);local+=item.w;
  }
  chosen.sort((a,b)=>a.i-b.i);if(chosen.length){result.push({section:section+1,total:groups,text:chosen.map(i=>i.s).join('\n\n')});used+=local;}
 });
 return {segments:result,totalWords:total,summaryWords:used,sentences:items.length,rejected,mode,coverage:groups};
}
self.onmessage=e=>{try{self.postMessage(analyze(e.data.text,e.data.mode,e.data.seconds));}catch(err){self.postMessage({error:'تعذر تحليل النص في ذاكرة هذا الجهاز. لم ننتج ملخصا ناقصا. أغلق التطبيقات الثقيلة أو جرّب جهازا بذاكرة أكبر.'});}};
