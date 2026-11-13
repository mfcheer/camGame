import {getViewport,getSafeInsets,installViewport} from './viewport.js';
import * as THREE from 'three';
import {createStageDesigns,STAGE_IDS,STAGE_NAMES} from './stageDesigns.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const material = (color, roughness = 0.9) => new THREE.MeshStandardMaterial({ color, roughness });
function addMesh(parent, geo, mat, pos = [0,0,0], scale = [1,1,1]) {
  const mesh = new THREE.Mesh(geo, mat); mesh.position.set(...pos); mesh.scale.set(...scale);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
const sphere = new THREE.SphereGeometry(1, 16, 12);
const TAU = Math.PI * 2;

/** A shallow 3D forest diorama. The central camera/hand area stays transparent. */
export class SceneManager {
  constructor(canvasContainer) {
    installViewport();
    this.container = canvasContainer;
    this.scene = new THREE.Scene();
    this.balloon = null; this.rescueAnimal = null;
    this.leftFlowerBounceTimer = 0; this.rightArchGlowTimer = 0;
    this.elapsed = 0; this.swayingPlants = [];
    const w = typeof window !== 'undefined' ? getViewport().width : 1280;
    const h = typeof window !== 'undefined' ? getViewport().height : 720;
    this.camera = new THREE.PerspectiveCamera(48, w/h, 0.1, 100);
    this.camera.position.set(0,0,7.5);
    if (typeof window !== 'undefined') {
      this.renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
      this.renderer.setSize(w,h); this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.16;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.container.appendChild(this.renderer.domElement);
    }
    this.setupLighting(); this.setupGround(); this.updateGroundLayout(w,h); this.setupResizeHandler();
  }
  setupLighting() {
    this.scene.add(new THREE.HemisphereLight(0xe5f6ff,0xbaa482,1.65));
    this.scene.add(new THREE.AmbientLight(0xffffff,0.32));
    const key = new THREE.DirectionalLight(0xffefd6,2.6);
    key.position.set(-3,7,6); key.castShadow = true;
    key.shadow.mapSize.set(2048,2048);
    Object.assign(key.shadow.camera,{left:-12,right:12,top:6,bottom:-6,near:0.1,far:24});
    key.shadow.bias = -0.0005; key.shadow.normalBias = 0.025; key.shadow.radius = 3;
    this.scene.add(key); this.keyLight = key;
    const fill = new THREE.DirectionalLight(0xf1f7ff,0.8); fill.position.set(5,2,-3); this.scene.add(fill);
  }
  createLeaf(color=0x70a87b, scale=1) {
    const g = new THREE.SphereGeometry(1,12,12);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++) {
      const t=(p.getY(i)+1)/2;
      p.setXYZ(i,p.getX(i)*.105*(.45+.55*Math.sin(t*Math.PI)),t*.43,p.getZ(i)*.018+.08*t*t);
    }
    g.computeVertexNormals(); const leaf=new THREE.Mesh(g,material(color));
    leaf.scale.setScalar(scale); leaf.castShadow=true; return leaf;
  }
  createFlower(petalColor=0xfff7df, centerColor=0xe9b64f, scale=1) {
    const flower=new THREE.Group();
    const stem=addMesh(flower,new THREE.CylinderGeometry(.013,.018,.38,7),material(0x658d52),[0,.19,0]);
    stem.rotation.z=-.05;
    const head=new THREE.Group(); head.position.set(0,.39,.01); flower.add(head);
    const petals=material(petalColor);
    for(let i=0;i<7;i++) {
      const a=i*TAU/7;
      const petal=addMesh(head,sphere,petals,[Math.cos(a)*.078,Math.sin(a)*.078,0],[.055,.033,.019]);
      petal.rotation.z=a;
    }
    addMesh(head,sphere,material(centerColor),[0,0,.022],[.042,.043,.024]);
    const leaf=this.createLeaf(0x6f9f5c,.45); leaf.position.set(0,.13,0); leaf.rotation.z=.9; flower.add(leaf);
    flower.scale.setScalar(scale); return flower;
  }
  createMushroom(color=0xcb7961,scale=1) {
    const m=new THREE.Group();
    addMesh(m,new THREE.CylinderGeometry(.045,.065,.23,12),material(0xf4e6ca),[0,.12,0]);
    const cap=addMesh(m,new THREE.SphereGeometry(.17,20,12,0,TAU,0,Math.PI/2),material(color),[0,.23,0],[1,.65,1]);
    addMesh(m,sphere,material(0xe7d7ba),[0,.234,0],[.163,.025,.163]);
    for(let i=0;i<5;i++) {
      const a=i*2.4; const r=i%2?.085:.045;
      addMesh(cap,sphere,material(0xf9edce),[Math.cos(a)*r,.17*Math.sqrt(1-r*r/(.17*.17))+.002,Math.sin(a)*r],[.022,.008,.017]);
    }
    m.scale.setScalar(scale); return m;
  }
  createFern(parent,x,z,scale=1,color=0x69965e) {
    const group=new THREE.Group(); group.position.set(x,.02,z); group.scale.setScalar(scale); parent.add(group);
    for(let i=0;i<6;i++) {
      const leaf=this.createLeaf(color,.8+(i%3)*.2);
      leaf.rotation.z=(i-2.5)*.28; leaf.rotation.y=i*1.4; group.add(leaf);
    }
    this.swayingPlants.push({group,phase:x*3+z,base:group.rotation.z}); return group;
  }
  setupGround() {
    this.groundGroup = new THREE.Group(); this.scene.add(this.groundGroup);
    this.bottomStripGroup = new THREE.Group(); this.groundGroup.add(this.bottomStripGroup);
    // A horizontal surface, seen in perspective, rather than a vertical screen border.
    const pathMat=material(0xd8bc8e);this.pathMaterial=pathMat;
    const roadGeo=new THREE.BoxGeometry(1,.16,1.5,1,1,1);
    this.road=addMesh(this.bottomStripGroup,roadGeo,pathMat,[0,-.09,.04]);
    this.road.castShadow=false;
    const verge=material(0x719760);
    this.backVerge=addMesh(this.bottomStripGroup,new THREE.BoxGeometry(1,.12,.30),verge,[0,-.08,-.84]);
    this.frontVerge=addMesh(this.bottomStripGroup,new THREE.BoxGeometry(1,.13,.24),material(0x7b9c60),[0,-.1,.83]);
    this.pathDetails=new THREE.Group(); this.bottomStripGroup.add(this.pathDetails);
    const stones=[material(0xe8d5ae),material(0xc8b18d),material(0xf3e4c7)];
    const moss=[material(0x72975b),material(0x8baa6d),material(0x5d8652)];
    this.mossMaterials=moss;this.pebbleMaterials=stones;
    // Deterministic placement: no popping vegetation and no per-frame allocation.
    for(let i=0;i<96;i++) {
      const x=-13+i*.275, seed=Math.sin(i*137.3)*.5+.5;
      const z=(i%2===0?-.67:.69)+Math.sin(i*2.7)*.06;
      const stone=addMesh(this.pathDetails,sphere,stones[i%3],[x,-.015,z],[.11+seed*.09,.055+seed*.025,.085+seed*.05]);
      stone.rotation.y=i;
      if(i%3!==0) addMesh(this.pathDetails,sphere,moss[i%3],[x+.08,-.02,z+(z<0?-.16:.12)],[.20,.09,.15]);
      if(i%4===0) {
        const pebble=addMesh(this.pathDetails,sphere,stones[(i+1)%3],[x+.12,.008,Math.sin(i)*.35],[.055,.018,.035]);
        pebble.rotation.y=i;
      }
    }
    // Batch static path stones by material (six draws rather than ~180).
    const batches=new Map();
    for(const child of [...this.pathDetails.children]) {
      child.updateMatrix();
      const geometry=child.geometry.clone().applyMatrix4(child.matrix);
      if(!batches.has(child.material))batches.set(child.material,[]);
      batches.get(child.material).push(geometry);
      this.pathDetails.remove(child);
    }
    for(const [mat,geometries] of batches) {
      const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
      const pathMesh=addMesh(this.pathDetails,merged,mat);pathMesh.castShadow=false;
    }
    this.leftFrame=new THREE.Group(); this.groundGroup.add(this.leftFrame);
    this.rightFrame=new THREE.Group(); this.groundGroup.add(this.rightFrame);
    for(const [frame,sign] of [[this.leftFrame,-1],[this.rightFrame,1]]) {
      for(let i=0;i<8;i++) {
        const x=(i/7-.5)*1.5;
        addMesh(frame,sphere,moss[i%3],[x,-.03,-.35-(i%3)*.12],[.38,.15+(i%3)*.06,.32]);
        this.createFern(frame,x,-.38-(i%2)*.13,.8+(i%3)*.2,[0x779f64,0x567e58,0x94ac6b][i%3]);
      }
      for(let i=0;i<3;i++) {
        const flower=this.createFlower(i===1?0xf0bd87:0xfff6df,0xe4ac46,.7+i*.13);
        flower.position.set((i-1)*.43,.03,-.27); flower.rotation.z=(i-1)*.13; frame.add(flower);
        if(sign<0&&i===2)this.leftDaisy1=flower;
      }
    }
    this.leftDaisy2=this.leftDaisy1;
    this.mushroom=this.createMushroom(0xc77e67,1.15);this.mushroom.position.set(.65,.02,.31);this.rightFrame.add(this.mushroom);
    const small=this.createMushroom(0xd9ae74,.7);small.position.set(-.7,.01,.20);this.leftFrame.add(small);
    this.gate=new THREE.Group();this.rightFrame.add(this.gate);
    this.archMat=material(0xb79969);this.archMat.emissive=new THREE.Color(0xf5cf78);this.archMat.emissiveIntensity=0;
    const archPoints=[];
    for(let i=0;i<=32;i++) {
      const a=Math.PI-i/32*Math.PI;archPoints.push(new THREE.Vector3(Math.cos(a)*.54,.63+Math.sin(a)*.54,-.24));
    }
    this.archMesh=addMesh(this.gate,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPoints),32,.048,10,false),this.archMat);
    for(const s of [-1,1]) {
      addMesh(this.gate,new THREE.CylinderGeometry(.046,.065,.64,12),this.archMat,[s*.54,.32,-.24]);
      for(let i=0;i<7;i++) {
        const leaf=this.createLeaf(i%2?0x9cac6a:0x729258,.55);leaf.position.set(s*.54,.18+i*.115,-.20);leaf.rotation.z=s*(.55+(i%2)*.7);this.gate.add(leaf);
      }
      const flower=this.createFlower(0xffedcf,0xdba24e,.72);flower.position.set(s*.48,.48,-.16);this.gate.add(flower);
    }
    for(let i=0;i<5;i++) {
      const a=.35+i*.61;
      const leaf=this.createLeaf(0x87a56d,.55);leaf.position.set(Math.cos(a)*.54,.63+Math.sin(a)*.54,-.20);leaf.rotation.z=a;this.gate.add(leaf);
    }
    // A tiny lantern gives the destination an unmistakable warm focal point.
    const lanternMat=material(0xffda8e);lanternMat.emissive=new THREE.Color(0xffbb55);lanternMat.emissiveIntensity=.6;
    this.lantern=addMesh(this.gate,new THREE.SphereGeometry(.09,16,12),lanternMat,[0,1.01,-.21],[.8,1, .8]);
    addMesh(this.gate,new THREE.ConeGeometry(.10,.06,12),material(0x8b7154),[0,1.11,-.21]);
    addMesh(this.gate,new THREE.CylinderGeometry(.008,.008,.09,6),material(0x8b7154),[0,1.19,-.21]);
    this.leftGarden=new THREE.Group();this.rightGarden=new THREE.Group();
    for(const child of [...this.leftFrame.children])this.leftGarden.add(child);
    for(const child of [...this.rightFrame.children])this.rightGarden.add(child);
    this.leftFrame.add(this.leftGarden);this.rightFrame.add(this.rightGarden);
    this.bunnyExtras=new THREE.Group();this.leftFrame.add(this.bunnyExtras);
    for(let i=0;i<2;i++) {
      const carrot=addMesh(this.bunnyExtras,new THREE.ConeGeometry(.055,.20,10),material(0xe6a05e),[.42+i*.16,.08,.24]);carrot.rotation.z=.12;carrot.rotation.x=Math.PI;
      const leaf=this.createLeaf(0x71955e,.46);leaf.position.set(.42+i*.16,.17,.24);leaf.rotation.z=.4-i*.6;this.bunnyExtras.add(leaf);
    }
    this.catExtras=new THREE.Group();this.leftFrame.add(this.catExtras);
    const yarn=addMesh(this.catExtras,new THREE.SphereGeometry(.13,20,16),material(0xc67759),[.56,.13,.28]);
    for(let i=0;i<5;i++){const loop=addMesh(this.catExtras,new THREE.TorusGeometry(.132,.005,5,32),material(0xe5a37f),[.56,.13,.28]);loop.rotation.set(i*.6,i*.4,i*.8);}
    this.catPawTrail=new THREE.Group();this.bottomStripGroup.add(this.catPawTrail);
    for(let i=0;i<7;i++) {
      const paw=new THREE.Group();paw.position.set(-2.4+i*.8,.018,(i%2?.23:-.08));paw.rotation.y=.4;this.catPawTrail.add(paw);
      addMesh(paw,sphere,material(0xbca083),[0,0,0],[.065,.008,.05]);
      for(let j=0;j<3;j++)addMesh(paw,sphere,material(0xbca083),[(j-1)*.05,.001,-.075+Math.abs(j-1)*.015],[.022,.009,.026]);
    }
    this.frogExtras=new THREE.Group();this.bottomStripGroup.add(this.frogExtras);
    const pondLeaf=material(0x70a07a),water=material(0x9fc5bf),petal=material(0xecc1bc);
    for(let i=0;i<8;i++) {
      const x=-4.2+i*1.2,z=i%2?.38:-.28;
      const pad=addMesh(this.frogExtras,new THREE.CylinderGeometry(.22,.23,.022,28,1,false,.15,Math.PI*1.84),pondLeaf,[x,.012,z]);pad.rotation.y=i*.9;
      if(i%3===0){const flower=new THREE.Group();flower.position.set(x,.045,z);this.frogExtras.add(flower);for(let j=0;j<7;j++){const a=j*Math.PI*2/7;const p=addMesh(flower,sphere,petal,[Math.cos(a)*.055,.025,Math.sin(a)*.055],[.035,.045,.065]);p.rotation.y=a;}addMesh(flower,sphere,material(0xeac478),[0,.05,0],[.035,.035,.035]);}
    }
    this.dogExtras=new THREE.Group();this.leftFrame.add(this.dogExtras);
    const ball=addMesh(this.dogExtras,sphere,material(0xa1b7c3),[.56,.12,.28],[.12,.12,.12]);
    const seam=addMesh(this.dogExtras,new THREE.TorusGeometry(.121,.008,6,30),material(0xffe7be),[.56,.12,.28]);seam.rotation.x=.4;
    this.dogTrail=new THREE.Group();this.bottomStripGroup.add(this.dogTrail);
    for(let i=0;i<5;i++){const g=new THREE.Group();g.position.set(-2+i*1.0,.021,i%2?.35:-.20);g.rotation.y=.25;this.dogTrail.add(g);const b=material(0xe6d5b6);addMesh(g,new THREE.BoxGeometry(.14,.012,.045),b);for(const x of [-.08,.08])for(const z of [-.023,.023])addMesh(g,sphere,b,[x,.0,z],[.035,.012,.027]);}
    this.dragonExtras=new THREE.Group();this.bottomStripGroup.add(this.dragonExtras);
    const crystal=material(0xb5a2d0),cloud=material(0xe3e4f0);
    for(let i=0;i<7;i++){
      const g=new THREE.Group();g.position.set(-2.8+i*.9,.025,i%2?.30:-.19);this.dragonExtras.add(g);
      for(let j=0;j<3;j++){const c=addMesh(g,new THREE.ConeGeometry(.045,.15+j*.045,5),crystal,[(j-1)*.055,.075+j*.022,0]);c.rotation.z=(j-1)*-.24;}
      for(let j=0;j<3;j++)addMesh(g,sphere,cloud,[(j-1)*.075,.025,.09],[.085,.035,.06]);
    }
    this.stageVariants=createStageDesigns(this);this.stageId='forest';
    this.setAnimalTheme('bunny');
  }
  setAnimalTheme(id) {
    this.theme=id;
    const themes={
      bunny:{path:0xd8bc8e,moss:[0x72975b,0x8baa6d,0x5d8652],stones:[0xe8d5ae,0xc8b18d,0xf3e4c7],arch:0xb79969},
      cat:{path:0xd2b6a0,moss:[0x9a9c69,0xb3af80,0x7f9168],stones:[0xe8d1b6,0xc7ac93,0xf0dfc5],arch:0xa7835f},
      frog:{path:0xaacbc2,moss:[0x4c8d72,0x78a98d,0x659477],stones:[0xc2d5c9,0xa3bcb1,0xdce6d5],arch:0x7c9c7d},
      dragon:{path:0xc4bbd3,moss:[0x859dac,0xa8b7bb,0x8396a4],stones:[0xe4dfef,0xc6bcd7,0xf2e9f6],arch:0x9e8eac},
      goldenDragon:{path:0xd5c69c,moss:[0x8ca783,0xa9b894,0x7e9b79],stones:[0xe8d9b7,0xcbbb8e,0xf3e8c8],arch:0xc2a063},
      dog:{path:0xd6b795,moss:[0x9aaf74,0xaec28d,0x819e69],stones:[0xe4ceb1,0xc6ac8d,0xf2e3c9],arch:0xb18e69}
    };
    this.animalPalette=themes[id]||themes.bunny;
    const t=this.animalPalette;this.pathMaterial?.color.setHex(t.path);
    this.mossMaterials?.forEach((m,i)=>m.color.setHex(t.moss[i]));this.pebbleMaterials?.forEach((m,i)=>m.color.setHex(t.stones[i]));this.archMat?.color.setHex(t.arch);
    if(this.bunnyExtras)this.bunnyExtras.visible=id==='bunny';
    if(this.catExtras)this.catExtras.visible=id==='cat';
    if(this.catPawTrail)this.catPawTrail.visible=id==='cat';
    if(this.frogExtras)this.frogExtras.visible=id==='frog';
    if(this.dogExtras)this.dogExtras.visible=id==='dog';
    if(this.dogTrail)this.dogTrail.visible=id==='dog';
    if(this.dragonExtras)this.dragonExtras.visible=['dragon','goldenDragon'].includes(id);
    this.setStage(this.stageId||'forest');
  }
  randomizeStage(random=Math.random){
    const candidates=STAGE_IDS.filter(id=>id!==this.stageId);
    this.setStage(candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))]);
    return this.stageId;
  }
  setStage(id){
    this.stageId=STAGE_IDS.includes(id)?id:'forest';this.stageName=STAGE_NAMES[this.stageId];
    const forest=this.stageId==='forest',p=this.stageVariants?.[this.stageId]?.palette||this.animalPalette;
    if(this.leftGarden)this.leftGarden.visible=forest;if(this.rightGarden)this.rightGarden.visible=forest;
    for(const [key,v]of Object.entries(this.stageVariants||{}))v.left.visible=v.right.visible=v.trail.visible=key===this.stageId;
    if(p){this.pathMaterial.color.setHex(p.path);this.backVerge.material.color.setHex(p.verge||0x719760);this.frontVerge.material.color.setHex(p.verge||0x7b9c60);this.mossMaterials.forEach((m,i)=>m.color.setHex(p.moss[i]));this.pebbleMaterials.forEach((m,i)=>m.color.setHex(p.stones[i]));this.archMat.color.setHex(p.arch);}
    for(const [key,animal]of [['catPawTrail','cat'],['frogExtras','frog'],['dogTrail','dog']])if(this[key])this[key].visible=forest&&this.theme===animal;
    if(this.dragonExtras)this.dragonExtras.visible=forest&&['dragon','goldenDragon'].includes(this.theme);
  }
  setBalloon(balloon) {this.balloon=balloon; if(typeof window!=='undefined')balloon.updateLayout(getViewport().width,getViewport().height,this.camera);}
  setRescueAnimal(animal) {this.rescueAnimal=animal;if(typeof window!=='undefined')animal.updateLayout(getViewport().width,getViewport().height,this.camera);}
  updateGroundLayout(w,h) {
    const vh=2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*this.camera.position.z;
    const vw=vh*w/h;const bottom=-vh/2;
    this.groundY=bottom+.45+getSafeInsets().bottom*vh/h;
    this.bottomStripGroup.position.set(0,this.groundY,0);
    this.road.scale.x=vw+5;this.backVerge.scale.x=vw+5;this.frontVerge.scale.x=vw+5;
    const decorScale=.9;
    this.leftFrame.scale.setScalar(decorScale);this.rightFrame.scale.setScalar(decorScale);
    this.leftFrame.position.set(-vw/2+.72+getSafeInsets().left*vh/h,this.groundY,-.05);
    this.rightFrame.position.set(vw/2-1.0-getSafeInsets().right*vh/h,this.groundY,-.05);
    this.mushroom.visible=w>=600;
    this.rescueAnimal?.updateLayout(w,h,this.camera);
  }
  setupResizeHandler() {
    if(typeof window==='undefined')return;
    window.addEventListener('gameviewportchange',()=>{
      const w=getViewport().width,h=getViewport().height;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
      this.renderer?.setSize(w,h);this.updateGroundLayout(w,h);this.balloon?.updateLayout(w,h,this.camera);
    });
  }
  triggerLeftFlowerBounce(){this.leftFlowerBounceTimer=.45;}
  triggerRightArchGlow(){this.rightArchGlowTimer=1.15;}
  update(dt=0) {
    this.elapsed+=dt;
    this.leftFlowerBounceTimer=Math.max(0,this.leftFlowerBounceTimer-dt);
    this.rightArchGlowTimer=Math.max(0,this.rightArchGlowTimer-dt);
    if(this.leftDaisy1)this.leftDaisy1.rotation.z=Math.sin(this.leftFlowerBounceTimer/.45*Math.PI)*.22;
    this.archMat.emissiveIntensity=this.rightArchGlowTimer/1.15*.7;
    for(const v of Object.values(this.stageVariants||{})){v.right.scale.setScalar(1+Math.sin(this.rightArchGlowTimer/1.15*Math.PI)*.025);v.left.rotation.z=Math.sin(this.leftFlowerBounceTimer/.45*Math.PI)*.025;}
    for(const {group,phase,base} of this.swayingPlants)group.rotation.z=base+Math.sin(this.elapsed*1.4+phase)*.025;
  }
  render(){this.renderer?.render(this.scene,this.camera);}
}
