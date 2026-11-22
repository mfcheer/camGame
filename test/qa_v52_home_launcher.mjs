import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../src/homeLauncher.js',import.meta.url),'utf8')).replaceAll('import.meta.env.BASE_URL',"'/'");
const {initHomeLauncher, ESSENTIAL_RESOURCES, preloadEssentialResources, LAUNCHER_CANDIDATE_TIPS}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
function fixture({seen=false,reduced=false,noCanvas=false,blockedStorage=false}={}) {
 const listeners=new Map(),frames=new Map(),timers=new Map();let seq=0,overlay=null,removed=false,focusCount=0;
 const on=(name,cb)=>listeners.set(name,cb),off=(name)=>listeners.delete(name);
 const btnClassSet=new Set();
 const btnClassList={add:(c)=>btnClassSet.add(c),remove:(c)=>btnClassSet.delete(c),contains:(c)=>btnClassSet.has(c)};
 const btnListeners=new Map();
 const button={style:{},classList:btnClassList,btnClassSet,setAttribute(){},addEventListener:(n,cb)=>btnListeners.set(n,cb),removeEventListener:(n)=>btnListeners.delete(n),btnListeners,focus(){focusCount++;}};
 const points=[];
 const arcs=[];
 const ctx={
  setTransform(){},
  clearRect(){points.length=0;arcs.length=0;},
  beginPath(){},
  arc(x,y,r,s,e){
    if (s === 0 && e === Math.PI * 2) {
      points.push([x,y]);
    } else {
      arcs.push([x,y,r,s,e]);
    }
  },
  fill(){},
  fillRect(){},
  stroke(){},
  save(){},
  restore(){}
 };
 const canvas={getContext:()=>noCanvas?null:ctx};
 const classListSet=new Set();
 const classList={add:(c)=>classListSet.add(c),remove:(c)=>classListSet.delete(c),contains:(c)=>classListSet.has(c)};
 const homeListeners=new Map();
 const home={inert:false,classList,classListSet,querySelector:()=>button,addEventListener:(n,cb)=>homeListeners.set(n,cb),removeEventListener:(n)=>homeListeners.delete(n),homeListeners};
 const media={matches:reduced,addEventListener:on,removeEventListener:off};
 const storage=new Map(seen?[['camgame:rainbow-reveal:v1','1']]:[]);
 globalThis.sessionStorage={getItem:k=>{if(blockedStorage)throw Error('blocked');return storage.get(k);},setItem:(k,v)=>{if(blockedStorage)throw Error('blocked');storage.set(k,v);}};
 globalThis.window={innerWidth:1194,innerHeight:834,devicePixelRatio:3,matchMedia:()=>media,addEventListener:on,removeEventListener:off};
 globalThis.document={hidden:false,body:{append(el){overlay=el;}},activeElement:null,getElementById:id=>id==='start-screen'?home:id==='btn-start-game'?button:removed?null:overlay,addEventListener:on,removeEventListener:off,createElement(){return {style:{},setAttribute(){},querySelector:s=>s==='canvas'?canvas:button,addEventListener:on,removeEventListener:off,contains:()=>false,remove(){removed=true;}};}};
 globalThis.requestAnimationFrame=cb=>{frames.set(++seq,cb);return seq;};
 globalThis.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.setTimeout=cb=>{timers.set(++seq,cb);return seq;};globalThis.clearTimeout=id=>timers.delete(id);
 const tick=t=>{const [id,cb]=frames.entries().next().value;frames.delete(id);cb(t);};
 return {home,media,canvas,storage,listeners,frames,timers,tick,points,arcs,get overlay(){return overlay;},get removed(){return removed;}};
}
const originals=Object.fromEntries(['window','document','sessionStorage','requestAnimationFrame','cancelAnimationFrame','setTimeout','clearTimeout'].map(k=>[k,globalThis[k]]));
test.after(()=>Object.assign(globalThis,originals));

test('reveal follows real elapsed time, caps DPR, isolates home and frees everything at deadline', () => {
 const f=fixture();initHomeLauncher();assert(f.home.inert);assert.equal(f.canvas.width,2388);assert.match(f.overlay.innerHTML,/icons/);
 f.tick(0);f.tick(200);assert.equal(f.overlay.style.transform,'translateY(0%)');assert(!f.removed);
 f.tick(600);assert.equal(f.overlay.style.transform,'translateY(0%)');assert(!f.removed);
 f.tick(1200);assert.equal(f.overlay.style.transform,'translateY(0%)');assert(!f.removed);
 f.tick(1750);assert.equal(f.overlay.style.transform,'translateY(0%)');assert(!f.removed);
 f.tick(1950);assert.match(f.overlay.style.transform,/translateY\(-/);assert(!f.removed);
 f.tick(2200);
 assert(f.removed);assert(!f.home.inert);assert.equal(f.frames.size,0);assert.equal(f.timers.size,0);assert.equal(f.listeners.has('resize'),false);assert.equal(f.canvas.width,0);assert.equal(f.storage.size,0);
});

test('no skip control; each new page runs despite a previous session marker, without storage access', () => {
 for(const options of [{seen:true},{blockedStorage:true}]){
  const f=fixture(options);initHomeLauncher();assert(f.overlay);assert.doesNotMatch(f.overlay.innerHTML,/<button|launcher-skip/);assert(!f.listeners.has('click'));assert.equal(initHomeLauncher(),null);
  f.tick(0);f.tick(1200);f.tick(2300);assert(f.removed);assert(!f.home.inert);
 }
});

test('Escape, background, page hide and changed reduced-motion all clean up without replay', () => {
 for(const name of ['keydown','visibilitychange','pagehide','change']){
  const f=fixture();initHomeLauncher();document.hidden=true;f.media.matches=true;f.listeners.get(name)({key:'Escape',preventDefault(){}});
  assert(f.removed,name);assert(!f.home.inert,name);assert.equal(f.frames.size,0);assert.equal(initHomeLauncher(),null);
 }
});

test('reduced motion and unavailable canvas enter home without a blocking overlay', () => {
 for(const options of [{reduced:true},{noCanvas:true}]){const f=fixture(options);assert.equal(initHomeLauncher(),null);assert(!f.overlay);assert(!f.home.inert);}
});

test('disabled storage is harmless; resize retains timeline and failsafe frees a stalled reveal', () => {
 const f=fixture({blockedStorage:true});initHomeLauncher();f.tick(0);window.innerWidth=834;window.innerHeight=1194;f.listeners.get('resize')();assert.equal(f.canvas.width,1668);f.tick(300);assert(!f.removed);
 [...f.timers.values()][0]();assert(f.removed);assert(!f.home.inert);assert.equal(f.frames.size,0);
});

test('essential resources include camera MediaPipe assets and home screen visual thumbnails', () => {
 assert.ok(Array.isArray(ESSENTIAL_RESOURCES));
 const urls = ESSENTIAL_RESOURCES.map(r=>r.url);
 assert.ok(urls.some(u=>u.includes('tracking-worker.js')));
 assert.ok(urls.some(u=>u.includes('vision_bundle.js')));
 assert.ok(urls.some(u=>u.includes('vision_wasm_internal.wasm')));
 assert.ok(urls.some(u=>u.includes('hand_landmarker.task')));
 assert.ok(urls.some(u=>u.includes('pose_landmarker_lite.task')));
 assert.ok(urls.some(u=>u.includes('bunny-preview.png')));
 assert.ok(urls.some(u=>u.includes('forest-bunny.glb')));
 assert.ok(urls.some(u=>u.includes('bicycle-preview.png')));
 assert.ok(urls.some(u=>u.includes('snowking-preview.png')));
 assert.ok(urls.some(u=>u.includes('modelx-preview.png')));
 assert.ok(urls.some(u=>u.includes('airplane-preview.png')));
 assert.equal(urls.filter(u=>u.includes('-preview.png')).length, 22);
});

test('progress bar DOM renders at bottom and delays closing until resource download completes', () => {
 const f=fixture();
 let notifyProgress=null;
 const resourceLoader=({onProgress})=>{notifyProgress=onProgress;return new Promise(()=>{});};
 initHomeLauncher({resourceLoader});
 assert.match(f.overlay.innerHTML,/launcher-progress-container/);
 assert.match(f.overlay.innerHTML,/launcher-progress-track/);
 assert.match(f.overlay.innerHTML,/launcher-progress-bar/);
 assert.match(f.overlay.innerHTML,/launcher-progress-text/);
 f.tick(0);
 f.tick(1000);
 notifyProgress(0.5);
 f.tick(2000);
 assert.equal(f.overlay.style.transform,'translateY(0%)');
 assert(!f.removed);
 f.tick(2600);
 assert.equal(f.overlay.style.transform,'translateY(0%)');
 assert(!f.removed,'must not disappear before downloads finish even past 2400ms');
 notifyProgress(1.0);
 f.tick(3000);
 f.tick(3250);
 assert.equal(f.overlay.style.transform,'translateY(0%)','downloads completing cannot start an early slide');
 f.tick(3600);
 assert.equal(f.overlay.style.transform,'translateY(0%)','holding at 100% ready state');
 f.tick(3900);
 assert.match(f.overlay.style.transform,/translateY\(-/,'slides up after full progress and ready hold');
 f.tick(4100);
 assert(f.removed,'cleanly removes after slide completes');
 assert(!f.home.inert);
});

test('late downloads reach 100 smoothly, hold, then fade; percentage never rounds up early', () => {
 const f=fixture();let notify;
 initHomeLauncher({resourceLoader:({onProgress})=>{notify=onProgress;return new Promise(()=>{});}});
 f.tick(0);notify(.99);f.tick(4000);
 assert.match(f.home.querySelector().textContent,/99%/);
 f.tick(6000);assert.equal(f.overlay.style.transform,'translateY(0%)');
 notify(1);f.tick(6001);
 assert.match(f.home.querySelector().textContent,/99%/);
 f.tick(6800);assert.equal(f.home.querySelector().textContent,'彩虹伙伴已就绪 100%');
 f.tick(7400);assert.equal(f.overlay.style.transform,'translateY(0%)');
 f.tick(7600);assert.match(f.overlay.style.transform,/translateY\(-/);assert(!f.removed);
 f.tick(8000);assert(f.removed);assert(!f.home.inert);
});

test('dust keeps forming through the progress interval and flowing during slow downloads', () => {
 const f=fixture();let notify;
 initHomeLauncher({resourceLoader:({onProgress})=>{notify=onProgress;return new Promise(()=>{});}});
 const positions=t=>{f.tick(t);assert.equal(f.points.length,240);assert(f.points.flat().every(Number.isFinite));return f.points.map(p=>[...p]);};
 const distance=(a,b)=>a.reduce((sum,p,i)=>sum+Math.hypot(p[0]-b[i][0],p[1]-b[i][1]),0)/a.length;
 positions(0);notify(.5);
 const early=positions(1000),middle=positions(2000);
 notify(.75);const formed=positions(2600);
 assert(distance(early,middle)>15,'formation must continue past early interval');
 assert(distance(middle,formed)>8,'second half of loading still develops the rainbow');
 const waiting=positions(8000),flowing=positions(9000);
 assert(distance(waiting,flowing)>6,'slow downloads keep a visibly moving rainbow');
 assert.equal(f.overlay.style.transform,'translateY(0%)');
 notify(1);positions(9800);positions(10200);const releasing=positions(10600);
 assert.match(f.overlay.style.transform,/translateY\(-/);assert(distance(flowing,releasing)>6);
 f.tick(11000);assert(f.removed);assert(!f.home.inert);assert.equal(f.frames.size,0);
});

test('formation keeps substantial travel for the last quarter and waits for slow progress', () => {
 const originalRandom=Math.random;
 Math.random=()=>.5;
 try {
  const sample=(ratio,t)=>{
   const f=fixture();
   initHomeLauncher({minDuration:20000,progressDuration:2600,resourceLoader:({onProgress})=>{onProgress(ratio);return new Promise(()=>{});}});
   f.tick(0);f.tick(t);return [...f.points[0]];
  };
  const scattered=sample(0,1950),threeQuarters=sample(1,1950),target=sample(1,2600);
  const travel=Math.hypot(target[0]-scattered[0],target[1]-scattered[1]);
  assert(Math.hypot(target[0]-threeQuarters[0],target[1]-threeQuarters[1])>travel*.2,
   'at 75% there must still be substantial formation, rather than an almost finished rainbow');
  const slow=sample(.25,8000),full=sample(1,8000),origin=sample(0,8000);
  const fullTravel=Math.hypot(full[0]-origin[0],full[1]-origin[1]);
  assert(Math.hypot(slow[0]-origin[0],slow[1]-origin[1])<fullTravel*.2,
   'a slow download must not form a completed rainbow just because four seconds passed');
 } finally {Math.random=originalRandom;}
});

test('12 candidate tips pool is exported and vector base arcs + 100% pulse ring render cleanly', () => {
 assert.equal(LAUNCHER_CANDIDATE_TIPS.length, 12);
 assert(LAUNCHER_CANDIDATE_TIPS.every(t=>typeof t==='string'&&t.length>0));
 const f=fixture();
 initHomeLauncher();
 f.tick(0);
 assert.equal(f.arcs.length, 6, '6 vector base arcs are drawn');
 f.tick(1200); // 100% reached
 f.tick(1350); // pulse ring is active
 assert.equal(f.arcs.length, 7, '6 base arcs + 1 pulse ring');
});

test('reveal cleanly slides overlay up without spotlight clip-path or opacity fading, while home screen stays completely static', () => {
 const f=fixture();
 initHomeLauncher();
 f.tick(0);
 f.tick(1200); // Progress reaches 100%
 f.tick(1750); // Holding ready before slide up
 assert.equal(f.overlay.style.transform, 'translateY(0%)');
 assert.equal(f.home.classList.contains('home-stage-enter'), false);
 assert(!f.overlay.style.clipPath);

 // Enter slide up phase (slideStartElapsed is 1800ms)
 f.tick(1850); // slideElapsed = 50ms (< 360ms)
 assert.match(f.overlay.style.transform, /translateY\(-/);
 assert(!f.overlay.style.clipPath, 'no spotlight clipPath applied to overlay');
 assert.equal(f.overlay.style.opacity, '1', 'overlay remains fully opaque without cross-fade bleeding');
 assert.equal(f.home.classList.contains('home-stage-enter'), false, 'home layer stays completely static');

 f.tick(1950); // slideElapsed = 150ms
 assert.match(f.overlay.style.transform, /translateY\(-/);
 assert.equal(f.home.classList.contains('home-stage-enter'), false, 'home layer remains static throughout transition');

 f.tick(2200); // Finish (targetFinishElapsed = 2160ms)
 assert(f.removed, 'overlay cleanly unmounted after sliding out of view');
 assert(!f.home.inert);
 assert.equal(f.home.classList.contains('home-stage-enter'), false);
});

test('reduced-motion preference skips overlay and never triggers stage entrance animation', () => {
 const f=fixture({reduced:true});
 assert.equal(initHomeLauncher(), null);
 assert.equal(f.overlay, null);
 assert.equal(f.home.classList.contains('home-stage-enter'), false);
});
