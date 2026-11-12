import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.88});
const sphere=new THREE.SphereGeometry(1,14,10);
function add(parent,geometry,material,pos=[0,0,0],scale=[1,1,1]){
 const m=new THREE.Mesh(geometry,material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function line(parent,points,r,material){return add(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),28,r,7,false),material);}
function batch(group){
 group.updateMatrixWorld(true);const inv=group.matrixWorld.clone().invert(),batches=new Map();
 group.traverse(o=>{if(o.isMesh){const g=o.geometry.clone().applyMatrix4(inv.clone().multiply(o.matrixWorld));const flat=g.index?g.toNonIndexed():g;if(flat!==g)g.dispose();if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(flat);}});
 const oldGeometries=new Set();group.traverse(o=>{if(o.isMesh)oldGeometries.add(o.geometry);});group.clear();oldGeometries.forEach(g=>g.dispose());
 for(const [material,geometries]of batches){const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());add(group,merged,material);}
}
export const STAGE_IDS=['forest','brook','orchard','bamboo','cloud'];
export const STAGE_NAMES={forest:'林间花径',brook:'溪边栈道',orchard:'秋日果园',bamboo:'竹林石径',cloud:'云上花园'};

export function createStageDesigns(manager){
 const variants={};
 for(const id of STAGE_IDS.slice(1)){
  const left=new THREE.Group(),right=new THREE.Group(),trail=new THREE.Group();
  manager.leftFrame.add(left);manager.rightFrame.add(right);manager.bottomStripGroup.add(trail);
  variants[id]={left,right,trail};
 }
 // Brook: actual timber planks, blue stream margins, reeds and a rope bridge gate.
 {
  const {left,right,trail}=variants.brook,wood=mat(0xc99d72),edge=mat(0x9b795c),water=mat(0x82b8b5),reed=mat(0x7e9e6b),cream=mat(0xe8d9b2);
  for(let i=0;i<76;i++){const x=-13+i*.35;const plank=add(trail,new THREE.BoxGeometry(.32,.035,1.13),i%3?wood:edge,[x,.016,0]);plank.rotation.y=Math.sin(i*7)*.014;for(const z of [-.68,.68])add(trail,sphere,water,[x,-.008,z],[.23,.035,.16]);}
  for(const frame of [left,right]){
   for(let i=0;i<5;i++){const x=(i-2)*.23;add(frame,sphere,water,[x,.015,.02],[.29,.04,.21]);for(let j=0;j<2;j++){const stem=add(frame,new THREE.CylinderGeometry(.009,.012,.34+j*.09,6),reed,[x+j*.04,.18+j*.04,-.3]);stem.rotation.z=.12*(i-2);add(frame,new THREE.CapsuleGeometry(.026,.10,3,7),edge,[x+j*.04,.35+j*.09,-.3]);}}
  }
  for(const s of [-1,1]){add(right,new THREE.CylinderGeometry(.055,.075,.83,10),wood,[s*.54,.415,-.23]);line(right,[[s*.54,.78,-.23],[s*.30,.67,-.23],[0,.64,-.23]],.019,cream);}
  const ring=add(right,new THREE.TorusGeometry(.14,.035,8,24),cream,[.52,.55,-.17]);ring.rotation.y=.1;
  variants.brook.palette={path:0x92b4ad,verge:0x75a8a1,moss:[0x6c9a84,0x97b8a3,0x68978a],stones:[0xcbd9cf,0xa5bfb6,0xe4e7d5],arch:0x98795f};
 }
 // Orchard: terracotta stepping stones, amber foliage, apples, baskets and a picket gate.
 {
  const {left,right,trail}=variants.orchard,terra=mat(0xc79474),light=mat(0xe4c39d),leaf=mat(0xc49757),trunk=mat(0x9d7955),red=mat(0xc87954),cream=mat(0xeeddb8);
  for(let i=0;i<36;i++){const slab=add(trail,new THREE.BoxGeometry(.58,.023,.68),i%3?light:terra,[-12.6+i*.72,.012,(i%2?.13:-.12)]);slab.rotation.y=Math.sin(i*2)*.10;const l=add(trail,sphere,leaf,[-12.4+i*.72,.025,i%2?.52:-.48],[.08,.009,.035]);l.rotation.y=i*1.7;}
  for(const frame of [left,right]){
   for(const s of [-1,1]){add(frame,new THREE.CylinderGeometry(.025,.045,.45,8),trunk,[s*.52,.23,-.32]);for(let i=0;i<3;i++)add(frame,sphere,leaf,[s*.52+(i-1)*.075,.49+(i%2)*.06,-.32],[.18,.16,.15]);for(let i=0;i<3;i++)add(frame,sphere,red,[s*.52+(i-1)*.08,.45+(i%2)*.11,-.19],[.042,.043,.04]);}
  }
  const basket=add(left,new THREE.CylinderGeometry(.14,.11,.15,14),trunk,[.53,.08,.23]);
  const handle=add(left,new THREE.TorusGeometry(.14,.012,6,24,Math.PI),cream,[.53,.15,.23]);
  for(let i=0;i<4;i++)add(left,sphere,red,[.48+(i%2)*.08,.16+Math.floor(i/2)*.02,.22+Math.floor(i/2)*.06],[.045,.045,.043]);
  for(let i=0;i<5;i++){const x=(i-2)*.25;add(right,new THREE.BoxGeometry(.10,.54,.045),cream,[x,.28,-.30]);add(right,new THREE.ConeGeometry(.071,.10,4),cream,[x,.60,-.30]).rotation.y=Math.PI/4;}
  add(right,new THREE.BoxGeometry(1.18,.055,.05),trunk,[0,.24,-.28]);add(right,new THREE.BoxGeometry(1.18,.055,.05),trunk,[0,.44,-.28]);
  variants.orchard.palette={path:0xd4b58a,verge:0xa6aa76,moss:[0xa2ac72,0xc0b17a,0x9a9b64],stones:[0xe5ccaa,0xd2b58c,0xf0dfba],arch:0xaf895f};
 }
 // Bamboo: jade flagstones, low bamboo groves and a red lantern torii.
 {
  const {left,right,trail}=variants.bamboo,jade=mat(0xb3c8b1),stone=mat(0xd9dbbc),green=mat(0x78995d),joint=mat(0xa1b279),wood=mat(0x8d7652),red=mat(0xc6805c),gold=mat(0xf0cd83);
  for(let i=0;i<44;i++){const tile=add(trail,new THREE.BoxGeometry(.49,.022,.82),i%2?jade:stone,[-12.9+i*.60,.012,0]);tile.rotation.y=Math.sin(i*5)*.035;}
  for(const frame of [left,right])for(let i=0;i<5;i++){
   const x=(i-2)*.28,h=.38+(i%3)*.10;add(frame,new THREE.CylinderGeometry(.018,.026,h,7),green,[x,h/2,-.35]);
   for(let j=1;j<4;j++){add(frame,new THREE.TorusGeometry(.024,.005,5,10),joint,[x,j*h/4,-.35]).rotation.x=Math.PI/2;const l=manager.createLeaf(0x8ca96b,.33);l.position.set(x,j*h/4,-.35);l.rotation.z=(i%2?1:-1)*.8;frame.add(l);}
  }
  for(const s of [-1,1])add(right,new THREE.CylinderGeometry(.038,.048,.86,10),wood,[s*.53,.43,-.25]);
  add(right,new THREE.BoxGeometry(1.30,.08,.11),wood,[0,.87,-.25]);add(right,new THREE.BoxGeometry(1.10,.05,.06),wood,[0,.70,-.25]);
  for(const s of [-1,1]){add(right,new THREE.SphereGeometry(.083,14,12),red,[s*.35,.70,-.20],[1,1.25,1]);add(right,new THREE.CylinderGeometry(.04,.04,.025,8),gold,[s*.35,.80,-.20]);add(right,new THREE.CylinderGeometry(.007,.007,.09,6),gold,[s*.35,.55,-.20]);}
  variants.bamboo.palette={path:0xa7b8a2,verge:0x799779,moss:[0x6d8b68,0x96ac7e,0x7c986e],stones:[0xcbd7bd,0xa7b99c,0xe3e4cd],arch:0x8f7b54};
 }
 // Cloud garden: pearl cobbles, cloud banks and an actual crescent destination.
 {
  const {left,right,trail}=variants.cloud,cloud=mat(0xf0e7df),lavender=mat(0xc6b8d7),gold=mat(0xe1bb78),blue=mat(0xaebdcc);
  for(let i=0;i<52;i++){const x=-12.8+i*.50;add(trail,new THREE.CylinderGeometry(.27,.28,.025,12),i%3?cloud:lavender,[x,.012,i%2?.20:-.18],[1,1,.9]);for(const z of [-.69,.67])add(trail,sphere,cloud,[x,-.01,z],[.31,.055,.16]);}
  for(const frame of [left,right])for(let i=0;i<8;i++){add(frame,sphere,i%3?cloud:blue,[(i-3.5)*.16,.055+(i%3)*.025,-.23],[.21,.13,.16]);}
  const moon=new THREE.Shape();moon.moveTo(.22,.40);moon.bezierCurveTo(-.35,.68,-.47,-.18,.12,-.32);moon.bezierCurveTo(-.18,-.09,-.11,.27,.22,.40);
  add(right,new THREE.ExtrudeGeometry(moon,{depth:.045,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:2,steps:1}),gold,[.07,.67,-.3]);
  for(const [x,y]of [[-.44,.50],[.49,.53],[-.32,.92]]){
   const star=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.022:.05;i?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}star.closePath();add(right,new THREE.ExtrudeGeometry(star,{depth:.02,bevelEnabled:false}),gold,[x,y,-.27]);
  }
  variants.cloud.palette={path:0xc7bfd4,verge:0xb1bac2,moss:[0xa4b4ad,0xbdc3b5,0x9baeb0],stones:[0xe6dfeb,0xcac4d7,0xf4e9ec],arch:0xb3a2bb};
 }
 for(const v of Object.values(variants)){batch(v.trail);v.left.visible=v.right.visible=v.trail.visible=false;}
 return variants;
}
