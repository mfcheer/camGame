import assert from 'node:assert/strict';
import * as T from 'three';
import {ACCESSORY_NAMES,createAccessory,CelebrationAccessories} from '../src/celebrationAccessories.js';
import {Game} from '../src/main.js';
const results=[];
function check(name,fn){fn();results.push(name);}
const camera=()=>{const c=new T.PerspectiveCamera(48,1194/834,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;};
const player=(x=.5,y=.27,roll=0)=>[{id:1,face:{x,y,width:.15,roll}}];
function make(style){const a=new CelebrationAccessories(new T.Scene(),camera());a.start(player(),false,()=>style/7+.001);return a;}
check('Seven distinct rewards; four new silhouettes have bounded size and batched geometry',()=>{
 assert.equal(ACCESSORY_NAMES.length,7);
 for(let i=0;i<7;i++){
  const p=createAccessory(i);assert.equal(p.name,ACCESSORY_NAMES[i]);
  if(i<3)continue;
  const box=new T.Box3().setFromObject(p),size=box.getSize(new T.Vector3());
  assert.ok(box.min.y>-.05,'brim stays above forehead');assert.ok(size.x>.65&&size.x<1.15);assert.ok(size.y>.4&&size.y<.95);
  let meshes=0;p.traverse(o=>{if(o.isMesh){meshes++;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}});assert.ok(meshes<13,'bounded material draws');
 }
});
check('Every reward is reachable; rounds exclude both previous hats and current partner',()=>{
 const seen=new Set();for(let i=0;i<7;i++){const a=make(i);seen.add(a.slots[0].prop.name);a.clear();}assert.equal(seen.size,7);
 const a=make(3);for(let i=0;i<18;i++){const old=a.slots.map(s=>s.prop.name);a.clear();a.start(player(),false,()=>.5);const next=a.slots.map(s=>s.prop.name);assert.notEqual(...next);assert.ok(next.every(n=>!old.includes(n)));}a.clear();
});
check('One-shot motions settle; stale tracking hides and reacquisition does not replay',()=>{
 for(let i=3;i<7;i++){
  const a=make(i);a.update(.25,1194,834);const moving=a.slots[0].prop.userData.moving;
  a.setPlayers(player());a.update(.25,1194,834);a.setPlayers(player());a.update(.25,1194,834);
  moving.updateMatrix();const expected=moving.matrix.clone();
  a.update(.5,1194,834);assert.equal(a.slots[0].prop.visible,false);
  a.setPlayers(player(.8));a.update(.01,1194,834);moving.updateMatrix();assert.deepEqual(moving.matrix.elements,expected.elements);assert.ok(a.slots[0].prop.position.x>0);
  if(i===3)assert.equal(moving.visible,false);
  if(i===4)assert.equal(moving.getObjectByName('Baked_Butter_yellow').visible,false);
  a.clear();
 }
});
check('Portrait/landscape, head roll and edge anchors keep all new hats inside viewport',()=>{
 for(const [w,h]of [[1194,834],[834,1194]])for(let style=3;style<7;style++)for(const [x,y,roll]of [[.5,.27,0],[.08,.12,-.4],[.92,.12,.4],[.5,.06,.2]]){
  const a=make(style);a.camera.aspect=w/h;a.camera.updateProjectionMatrix();a.setPlayers(player(x,y,roll));a.update(.16,w,h);
  const b=new T.Box3().setFromObject(a.slots[0].prop);
  for(const corner of [b.min,b.max]){const p=corner.clone().project(a.camera);assert.ok(Math.abs(p.x)<1.001&&p.y<1.001,`${style} ${w} ${x},${y}: ${p.toArray()}`);}
  a.clear();
 }
});
check('Reduced motion has static ornaments from first frame; paused Game freezes entire effect',()=>{
 const previous=globalThis.window;globalThis.window={matchMedia:()=>({matches:true})};
 try{for(let i=3;i<7;i++){const a=make(i);a.update(.12,1194,834);const moving=a.slots[0].prop.userData.moving;assert.equal(moving.rotation.z,0);assert.equal(moving.scale.y,1);if(i===3)assert.equal(moving.visible,false);a.clear();}}
 finally{globalThis.window=previous;}
 const a=make(5);a.update(.12,1194,834);const age=a.slots[0].revealAge;
 const g=Object.assign(Object.create(Game.prototype),{state:'PAUSED',celebrationAccessories:a});g.updateFrame(5);assert.equal(a.slots[0].revealAge,age);a.clear();assert.equal(a.group.children.length,0);assert.equal(a.active,false);
});
check('Round cleanup disposes each shared material and geometry exactly once',()=>{
 const a=make(4),counts=new Map();
 for(const slot of a.slots)slot.prop.traverse(o=>{if(o.isMesh)for(const resource of [o.geometry,o.material])if(!counts.has(resource)){counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1));}});
 a.clear();assert.ok([...counts.values()].every(n=>n===1));
 a.clear();assert.ok([...counts.values()].every(n=>n===1));
});
console.log(JSON.stringify({passed:results.length,results},null,2));
