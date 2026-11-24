(function(){
'use strict';
var display=document.getElementById('focus-time');if(!display)return;
var duration=document.getElementById('focus-duration'),toggle=document.getElementById('focus-toggle'),status=document.getElementById('focus-status');
var remaining=25*60,endAt=0,running=false,clock,audio;
var custom=document.getElementById('custom-minutes'),sound=document.getElementById('focus-sound'),alarm=document.getElementById('focus-alarm');
function minutes(){var n=duration.value==='custom'?Number(custom.value):Number(duration.value);if(!Number.isInteger(n)||n<1||n>360){status.textContent='اختر مدة صحيحة من دقيقة إلى ٣٦٠ دقيقة.';custom.focus();return null;}return n;}
var audioAttempt=0;
function audioMessage(){return 'تعذّر تفعيل الصوت. اضغط «جرّب الصوت» وارفع صوت الوسائط. سيظل التنبيه المرئي متاحاً.';}
function timeout(promise,ms){return Promise.race([promise,new Promise(function(_,reject){setTimeout(function(){reject(new Error('audio-timeout'));},ms);})]);}
async function unlockSound(){
var AC=window.AudioContext||window.webkitAudioContext;
if(!AC)throw new Error('audio-unavailable');
if(!audio||audio.state==='closed')audio=new AC();
if(audio.state!=='running')await timeout(audio.resume(),2500);
if(audio.state!=='running')throw new Error('audio-not-running');
return audio;
}
async function chime(){
if(!sound.checked)return false;
var ctx=await unlockSound();
[0,.55,1.1,1.8,2.35,2.9].forEach(function(delay,i){
var osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+delay+.03;
osc.type='triangle';osc.frequency.value=i%2?880:660;
gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.32,start+.025);gain.gain.exponentialRampToValueAtTime(.001,start+.45);
osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+.5);
osc.onended=function(){osc.disconnect();gain.disconnect();};
});
return true;
}
document.getElementById('test-alarm').addEventListener('click',async function(){
sound.checked=true;var attempt=++audioAttempt;status.textContent='جارٍ تفعيل الصوت…';
try{await chime();if(attempt===audioAttempt)status.textContent='تم إرسال النغمة للمتصفح. هل سمعتها؟ ارفع صوت الوسائط إن لم تسمعها؛ لا يمكن للموقع معرفة مستوى صوت جهازك.';}
catch(e){if(attempt===audioAttempt)status.textContent=audioMessage();}
});
document.getElementById('dismiss-alarm').addEventListener('click',function(){alarm.hidden=true;toggle.focus();});
function draw(){var min=Math.floor(remaining/60),sec=remaining%60;display.textContent=String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0');document.title=running?display.textContent+' | وقت التركيز | ستّون':'ستّون | ركن التركيز';}
function pause(){running=false;clearInterval(clock);toggle.textContent='استكمل';duration.disabled=false;custom.disabled=false;draw();}
function tick(){remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));draw();if(!remaining){pause();toggle.textContent='ابدأ جلسة جديدة';status.textContent='أحسنت! انتهت الجلسة. خذ استراحة قصيرة.';alarm.hidden=false;chime().catch(function(){status.textContent='انتهت الجلسة. '+audioMessage();});document.title='انتهى التركيز | ستّون';}}
toggle.addEventListener('click',function(){if(running){tick();pause();status.textContent='الجلسة متوقفة مؤقتاً.';return;}var n=minutes();if(n===null)return;if(!remaining)remaining=n*60;var attempt=++audioAttempt;if(sound.checked)unlockSound().catch(function(){if(attempt===audioAttempt&&running)status.textContent=audioMessage();});alarm.hidden=true;endAt=Date.now()+remaining*1000;running=true;duration.disabled=true;custom.disabled=true;toggle.textContent='إيقاف مؤقت';status.textContent='وقت لفكرة واحدة. أبعد المشتتات وابدأ.';clock=setInterval(tick,500);tick();});
document.getElementById('focus-reset').addEventListener('click',function(){var n=minutes();if(n===null)return;pause();alarm.hidden=true;remaining=n*60;toggle.textContent='ابدأ التركيز';status.textContent='اختر مهمة واحدة، واترك الباقي لوقت آخر.';draw();});
duration.addEventListener('change',function(){document.getElementById('custom-minutes-wrap').hidden=duration.value!=='custom';var n=minutes();if(n===null)return;remaining=n*60;toggle.textContent='ابدأ التركيز';draw();});custom.addEventListener('input',function(){if(running)return;var n=Number(custom.value);if(Number.isInteger(n)&&n>=1&&n<=360){remaining=n*60;draw();}});
// Reconcile the wall-clock deadline immediately after a browser interruption.
function returnToTimer(){if(running){tick();if(running&&sound.checked)unlockSound().catch(function(){status.textContent=audioMessage();});}}
document.addEventListener('visibilitychange',function(){if(!document.hidden)returnToTimer();});
window.addEventListener('pageshow',returnToTimer);
window.addEventListener('focus',returnToTimer);
var form=document.getElementById('task-form'),input=document.getElementById('task-input'),list=document.getElementById('task-list'),note=document.getElementById('task-note'),tasks=[];var key='sittoun-study-tasks-v1';
try{var saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))tasks=saved.filter(function(t){return t&&typeof t.text==='string';}).slice(0,30).map(function(t){return {text:t.text.slice(0,120),done:!!t.done};});}catch(e){note.textContent='الحفظ غير متاح في هذا المتصفح. المهام متاحة حتى إغلاق الصفحة.';}
function save(){try{localStorage.setItem(key,JSON.stringify(tasks));}catch(e){note.textContent='تعذّر الحفظ. المهام متاحة حتى إغلاق الصفحة.';}}
function render(){list.replaceChildren();if(!tasks.length){var empty=document.createElement('li');empty.className='task-empty';empty.textContent='خطوتك الأولى؟ أضف كتاباً تقرؤه أو فكرة تطبّقها.';list.appendChild(empty);}tasks.forEach(function(task,i){var li=document.createElement('li'),label=document.createElement('label'),box=document.createElement('input'),text=document.createElement('span'),del=document.createElement('button');box.type='checkbox';box.checked=task.done;text.textContent=task.text;if(task.done)li.className='task-done';box.addEventListener('change',function(){tasks[i].done=box.checked;save();render();});label.append(box,text);del.type='button';del.className='task-delete';del.textContent='×';del.setAttribute('aria-label','حذف المهمة: '+task.text);del.addEventListener('click',function(){tasks.splice(i,1);save();render();});li.append(label,del);list.appendChild(li);});document.getElementById('task-progress').textContent=tasks.length?tasks.filter(function(t){return t.done;}).length+' / '+tasks.length+' مهام مكتملة':'';}
form.addEventListener('submit',function(e){e.preventDefault();var value=input.value.trim();if(!value)return;if(tasks.length>=30){note.textContent='وصلت إلى ٣٠ مهمة. احذف مهمة قديمة لإضافة غيرها.';return;}tasks.push({text:value.slice(0,120),done:false});input.value='';save();render();input.focus();});render();
})();
