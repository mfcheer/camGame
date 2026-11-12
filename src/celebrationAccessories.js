import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const TAU=Math.PI*2;
function part(parent,name,geo,material,position=[0,0,0],scale=[1,1,1]) {
  const m=new THREE.Mesh(geo,material);m.name=name;m.position.set(...position);m.scale.set(...scale);parent.add(m);return m;
}
function tube(parent,name,points,radius,material,closed=false) {
  return part(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),Math.max(20,points.length*3),radius,7,closed),material);
}
function bead(parent,name,material,position,scale) {return part(parent,name,new THREE.SphereGeometry(1,16,12),material,position,scale);}
function leafGeo(length=.22,width=.065) {
  const g=new THREE.SphereGeometry(1,16,20),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const t=(p.getY(i)+1)/2;p.setXYZ(i,p.getX(i)*width*(.5+.5*Math.sin(t*Math.PI)),t*length,p.getZ(i)*.012+Math.sin(t*Math.PI)*.045);}
  g.computeVertexNormals();return g;
}
function ribbon(parent,name,points,width,material) {
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),v=[],uv=[],index=[];
  for(let i=0;i<=32;i++){const t=i/32,p=path.getPoint(t),w=width*(1-.3*t);v.push(p.x-w/2,p.y,p.z,p.x+w/2,p.y,p.z+.008*Math.sin(t*TAU));uv.push(0,t,1,t);if(i<32){const n=i*2;index.push(n,n+1,n+2,n+1,n+3,n+2);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();return part(parent,name,geo,material);
}
function crownWall() {
  const v=[],uv=[],index=[],n=120;
  for(let i=0;i<=n;i++) {
    const a=i/n*TAU,top=.22+.30*Math.pow(Math.max(0,Math.cos(a*5)),1.3);
    for(const [r,y] of [[.48,.08],[.50,top],[.448,.08],[.468,top]]){v.push(Math.sin(a)*r,y,Math.cos(a)*r*.58);uv.push(i/n,y/.55);}
    if(i<n){const k=i*4,j=k+4;for(const [a,b,c,d]of[[k,j,k+1,j+1],[k+2,k+3,j+2,j+3],[k+1,j+1,k+3,j+3],[k,k+2,j,j+2]])index.push(a,b,c,b,d,c);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
}
function finish(group) {
  // Bake the designed static pieces into a handful of material draws, not hundreds.
  group.updateMatrixWorld(true);const batches=new Map(),original=new Set(),names=[];
  group.traverse(o=>{if(o.isMesh){names.push(o.name);original.add(o.geometry);let g=o.geometry.clone();if(g.index){const raw=g;g=g.toNonIndexed();raw.dispose();}g.applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);}});
  group.clear();for(const [material,geometries]of batches){const g=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());part(group,'Baked_'+material.name,g,material);}
  original.forEach(g=>g.dispose());group.userData={designVersion:2,parts:names};return group;
}
export function createAccessory(style=0) {
  const group=new THREE.Group();group.name=['crown','flower-crown','explorer-hat'][style];
  const palette=new Map();
  const m=(name,color,roughness=.55,metalness=0)=>{if(!palette.has(name)){const p=new THREE.MeshStandardMaterial({color,roughness,metalness,side:THREE.DoubleSide});p.name=name;palette.set(name,p);}return palette.get(name);};
  const gold=m('Champagne_gold',0xefc25c,.29,.48),thread=m('Ivory_thread',0xffebc3,.75),green=m('Laurel_green',0x48836a,.80);
  if(style===0) {
    const velvet=m('Peacock_velvet',0x286f72,.9),rose=m('Rose_quartz',0xce6887,.19,.22),aquamarine=m('Aquamarine',0x63b6bd,.18,.20);
    part(group,'Five_curved_gold_points',crownWall(),gold);
    part(group,'Velvet_lining',new THREE.CylinderGeometry(.465,.455,.13,64,1,true),velvet,[0,.074,0],[1,1,.58]);
    for(const y of [.025,.145]){const rim=part(group,'Rolled_gold_edge',new THREE.TorusGeometry(.48,.016,8,64),gold,[0,y,0]);rim.rotation.x=Math.PI/2;rim.scale.y=.58;}
    for(let i=0;i<5;i++){const a=i/5*TAU;bead(group,'Pearl_point',thread,[Math.sin(a)*.5,.535,Math.cos(a)*.5*.58],[.033,.033,.033]);}
    const jewel=part(group,'Central_faceted_gem',new THREE.IcosahedronGeometry(.11,0),aquamarine,[0,.22,.318],[.87,1.2,.48]);jewel.rotation.z=.15;
    for(const x of [-.28,.28]){const gem=part(group,'Rose_side_gem',new THREE.OctahedronGeometry(.056),rose,[x,.13,.255],[1,1.2,.5]);gem.rotation.z=Math.PI/4;}
    for(const x of [-.13,.13])bead(group,'Pearl_setting',thread,[x,.065,.295],[.021,.021,.018]);
    for(const side of [-1,1])tube(group,'Gold_filigree',[[side*.04,.07,.32],[side*.12,.14,.32],[side*.20,.10,.30],[side*.23,.17,.28]],.008,gold);
    bead(group,'Gem_catchlight',m('Gem_glint',0xfffcdf,.1),[-.031,.252,.378],[.014,.018,.006]);
  }else if(style===1) {
    const peach=m('Peach_petals',0xeaa38f,.82),pink=m('Rose_petals',0xd57a85,.82),ivory=m('Cream_petals',0xffefd2,.90),sage=m('Sage_leaves',0x8ca36f,.86),lavender=m('Lavender_buds',0xb2a6d6,.80);
    const vine=[];for(let i=0;i<48;i++){const a=i/48*TAU;vine.push([Math.sin(a)*.44,.04,Math.cos(a)*.24]);}tube(group,'Braided_vine',vine,.022,green,true);
    for(let i=0;i<16;i++){const a=i/16*TAU,l=part(group,'Laurel_leaf',leafGeo(.18+(i%3)*.025),i%2?sage:green,[Math.sin(a)*.44,.035,Math.cos(a)*.25]);l.rotation.set(.25, a,(i%2?1:-1)*.62);}
    const rose=(x,y,z,size,colors)=>{const flower=new THREE.Group();flower.position.set(x,y,z);flower.scale.setScalar(size);flower.rotation.z=x*.35;group.add(flower);
      for(let layer=0;layer<3;layer++)for(let j=0;j<7;j++){const a=j/7*TAU+layer*.42,r=.075-layer*.022;const petal=bead(flower,'Layered_rose_petal',colors[layer%colors.length],[Math.cos(a)*r,Math.sin(a)*r,.018*layer],[.045-layer*.006,.074-layer*.012,.018]);petal.rotation.z=a-.6;}
      bead(flower,'Rose_heart',thread,[0,0,.065],[.024,.024,.016]);};
    rose(-.22,.16,.265,1.25,[peach,pink]);rose(.09,.11,.286,.85,[ivory,peach]);
    for(const [x,y,z]of[[.33,.14,.21],[-.42,.11,.11]]){for(let j=0;j<6;j++){const a=j/6*TAU;bead(group,'Daisy_petal',ivory,[x+Math.cos(a)*.057,y+Math.sin(a)*.057,z],[.037,.045,.016]).rotation.z=a;}bead(group,'Pollen_heart',gold,[x,y,z+.025],[.026,.026,.018]);}
    for(let i=0;i<4;i++)bead(group,'Lavender_bud',lavender,[.25+i*.034,.19+i*.034,.17],[.025,.035,.02]);
    ribbon(group,'Silk_ribbon_left',[[-.43,.045,.10],[-.48,-.06,.15],[-.44,-.20,.18]],.055,m('Dusty_pink_silk',0xd79091,.54));
    ribbon(group,'Silk_ribbon_right',[[.43,.045,.10],[.49,-.08,.17],[.53,-.17,.16]],.047,m('Honey_silk',0xe8c483,.54));
    for(const x of [-.35,.38])bead(group,'Dew_pearl',thread,[x,.08,.26],[.018,.018,.018]);
  }else {
    const canvas=m('Sand_canvas',0xcaa677,.88),leather=m('Chestnut_leather',0x855b42,.68),teal=m('Evergreen_band',0x427e78,.76),lens=m('Smoky_blue_glass',0x72aeb7,.17,.25);
    const brimGeo=new THREE.SphereGeometry(1,64,16),p=brimGeo.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setXYZ(i,x*.61,.055*p.getY(i)+.027*Math.pow(Math.abs(x),3),z*.31);}brimGeo.computeVertexNormals();part(group,'Curved_safari_brim',brimGeo,canvas,[0,.025,0]);
    const profile=[[.40,.07],[.40,.14],[.365,.32],[.29,.43],[.14,.48],[0,.49]].map(p=>new THREE.Vector2(...p));
    part(group,'Shaped_canvas_crown',new THREE.LatheGeometry(new THREE.SplineCurve(profile).getPoints(40),48),canvas,[0,0,0],[1,1,.66]);
    part(group,'Evergreen_leather_band',new THREE.CylinderGeometry(.40,.405,.105,64,1,true),teal,[0,.13,0],[1,1,.66]);
    const seam=[[-.36,.17,.10],[-.30,.35,.08],[-.16,.46,.04],[0,.491,.0],[.16,.46,.04],[.30,.35,.08],[.36,.17,.10]];tube(group,'Tailored_crown_seam',seam,.006,thread);
    for(let i=0;i<18;i++){const a=(i/17-.5)*2.5;tube(group,'Hand_stitch',[[Math.sin(a)*.407,.09,Math.cos(a)*.271],[Math.sin(a+.015)*.407,.11,Math.cos(a+.015)*.271]],.003,thread);}
    for(const x of [-.115,.115]){part(group,'Brass_goggle_rim',new THREE.TorusGeometry(.087,.014,8,32),gold,[x,.25,.275]);bead(group,'Goggle_lens',lens,[x,.25,.279],[.074,.074,.018]);bead(group,'Lens_glint',thread,[x-.02,.275,.299],[.017,.008,.004]);}
    tube(group,'Goggle_bridge',[[-.03,.25,.29],[0,.27,.30],[.03,.25,.29]],.009,leather);
    for(let i=0;i<2;i++){const f=part(group,'Forest_feather',leafGeo(.27-i*.055,.048),i?m('Copper_feather',0xd59668,.84):green,[-.36+i*.025,.26,.045]);f.rotation.z=.35-i*.45;f.rotation.y=-.3;}
    part(group,'Compass_badge',new THREE.CircleGeometry(.052,20),gold,[.37,.15,.17]);part(group,'Compass_star',new THREE.OctahedronGeometry(.027),teal,[.37,.15,.19],[1,1.4,.3]);
    const piping=[];for(let i=0;i<64;i++){const a=i/64*TAU;piping.push([Math.sin(a)*.607,.03+.027*Math.pow(Math.abs(Math.sin(a)),3),Math.cos(a)*.309]);}tube(group,'Leather_brim_piping',piping,.009,leather,true);
  }
  return finish(group);
}
export class CelebrationAccessories {
  constructor(scene,camera){this.camera=camera;this.group=new THREE.Group();scene.add(this.group);this.slots=[];this.active=false;this.age=0;}
  start(players=[],demo=false,random=Math.random) {
    this.clear();this.active=true;this.demo=demo;this.age=0;
    for(let i=0;i<2;i++){const prop=createAccessory(Math.min(2,Math.floor(random()*3)));prop.visible=false;this.group.add(prop);this.slots.push({prop,id:i+1,age:Infinity});}
    this.setPlayers(players);
  }
  setPlayers(players=[]) {
    if(!this.active)return;
    for(const slot of this.slots){const player=players.find(p=>p.id===slot.id);if(player?.face){if(slot.age>.4)slot.positioned=false;slot.face={...player.face};slot.age=0;}}
  }
  update(dt,w,h) {
    if(!this.active)return;this.age+=dt;
    for(const slot of this.slots) {
      slot.age+=dt;
      const face=slot.face || (this.demo&&slot.id===1?{x:.5,y:.27,width:.15,roll:0}:null);
      const visible=face&&(this.demo||slot.age<.4);slot.prop.visible=!!visible;if(!visible)continue;
      const distance=this.camera.position.z-.65;
      const vh=2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*distance,vw=vh*w/h;
      const target=new THREE.Vector3((face.x-.5)*vw,(.5-face.y)*vh,.65);
      if(!slot.positioned){slot.prop.position.copy(target);slot.positioned=true;}else slot.prop.position.lerp(target,1-Math.exp(-dt*12));
      const entrance=1+.10*Math.sin(Math.min(1,this.age/.6)*Math.PI);
      slot.prop.scale.setScalar(THREE.MathUtils.clamp(face.width*vw,.35,2.0)*entrance);
      slot.prop.rotation.z=-(face.roll||0);
    }
  }
  clear(){for(const slot of this.slots){this.group.remove(slot.prop);slot.prop.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});}this.slots=[];this.active=false;}
}
