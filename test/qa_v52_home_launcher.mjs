import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../src/homeLauncher.js',import.meta.url),'utf8')).replaceAll('import.meta.env.BASE_URL',"'/camGame/'");
const {initHomeLauncher}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
function fixture({seen=false,reduced=false,noCanvas=false,blockedStorage=false}={}) {
 const listeners=new Map(),frames=new Map(),timers=new Map();let seq=0,overlay=null,removed=false,focusCount=0;
 const on=(name,cb)=>listeners.set(name,cb),off=(name)=>listeners.delete(name);
 const button={addEventListener:on,focus(){focusCount++;}};
 const ctx={setTransform(){},clearRect(){},beginPath(){},arc(){},fill(){},fillRect(){}};
 const canvas={getContext:()=>noCanvas?null:ctx};
 const home={inert:false,querySelector:()=>button};
 const media={matches:reduced,addEventListener:on,removeEventListener:off};
 const storage=new Map(seen?[['camgame:rainbow-reveal:v1','1']]:[]);
 globalThis.sessionStorage={getItem:k=>{if(blockedStorage)throw Error('blocked');return storage.get(k);},setItem:(k,v)=>{if(blockedStorage)throw Error('blocked');storage.set(k,v);}};
 globalThis.window={innerWidth:1194,innerHeight:834,devicePixelRatio:3,matchMedia:()=>media,addEventListener:on,removeEventListener:off};
 globalThis.document={hidden:false,body:{append(el){overlay=el;}},activeElement:null,getElementById:()=>home,addEventListener:on,removeEventListener:off,createElement(){return {style:{},setAttribute(){},querySelector:s=>s==='canvas'?canvas:button,addEventListener:on,removeEventListener:off,contains:()=>false,remove(){removed=true;}};}};
 globalThis.requestAnimationFrame=cb=>{frames.set(++seq,cb);return seq;};
 globalThis.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.setTimeout=cb=>{timers.set(++seq,cb);return seq;};globalThis.clearTimeout=id=>timers.delete(id);
 const tick=t=>{const [id,cb]=frames.entries().next().value;frames.delete(id);cb(t);};
 return {home,media,canvas,storage,listeners,frames,timers,tick,get overlay(){return overlay;},get removed(){return removed;}};
}
const originals=Object.fromEntries(['window','document','sessionStorage','requestAnimationFrame','cancelAnimationFrame','setTimeout','clearTimeout'].map(k=>[k,globalThis[k]]));
test.after(()=>Object.assign(globalThis,originals));
test('reveal follows real elapsed time, caps DPR, isolates home and frees everything at deadline',()=>{
 const f=fixture();initHomeLauncher();assert(f.home.inert);assert.equal(f.canvas.width,2388);assert.match(f.overlay.innerHTML,/\/camGame\/icons/);
 f.tick(100);f.tick(1300);assert.equal(f.overlay.style.opacity,'1');assert(!f.removed);f.tick(2300);assert(+f.overlay.style.opacity<1);f.tick(2500);
 assert(f.removed);assert(!f.home.inert);assert.equal(f.frames.size,0);assert.equal(f.timers.size,0);assert.equal(f.listeners.has('resize'),false);assert.equal(f.canvas.width,0);assert.equal(f.storage.get('camgame:rainbow-reveal:v1'),'1');
});
test('skip is immediate and idempotent; keyboard focus cannot reach home during reveal',()=>{
 const f=fixture();const c=initHomeLauncher();f.listeners.get('click')();c.finish();assert(f.removed);assert(!f.home.inert);assert.equal(f.frames.size,0);
});
test('Escape, background, page hide and changed reduced-motion all clean up without replay',()=>{
 for(const name of ['keydown','visibilitychange','pagehide','change']){
  const f=fixture();initHomeLauncher();document.hidden=true;f.media.matches=true;f.listeners.get(name)({key:'Escape',preventDefault(){}});
  assert(f.removed,name);assert(!f.home.inert,name);assert.equal(f.frames.size,0);assert.equal(initHomeLauncher(),null);
 }
});
test('seen session, reduced motion and unavailable canvas enter home without a blocking overlay',()=>{
 for(const options of [{seen:true},{reduced:true},{noCanvas:true}]){const f=fixture(options);assert.equal(initHomeLauncher(),null);assert(!f.overlay);assert(!f.home.inert);}
});
test('disabled storage is harmless; resize retains timeline and failsafe frees a stalled reveal',()=>{
 const f=fixture({blockedStorage:true});initHomeLauncher();f.tick(0);window.innerWidth=834;window.innerHeight=1194;f.listeners.get('resize')();assert.equal(f.canvas.width,1668);f.tick(1200);assert(!f.removed);
 [...f.timers.values()][0]();assert(f.removed);assert(!f.home.inert);assert.equal(f.frames.size,0);
});
