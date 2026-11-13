import * as THREE from 'three';
import {assetUrl} from './assetUrl.js';

// A visual hint only. It never enters hand tracking or collision/score logic.
export class InteractionDemo {
  constructor(parent) {
    this.group=new THREE.Group();this.group.name='Visual_Fingertip_Demo';parent.add(this.group);
    this.hand=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,opacity:.82,depthTest:false,depthWrite:false}));
    this.hand.center.set(.45,.92);this.hand.renderOrder=45;this.hand.visible=false;this.group.add(this.hand);
    if(typeof document!=='undefined' && typeof document.createElementNS==='function'){
      new THREE.TextureLoader().load(assetUrl('images/ui/fingertip-guide.svg'),texture=>{
        texture.colorSpace=THREE.SRGBColorSpace;this.hand.material.map=texture;this.hand.material.needsUpdate=true;this.loaded=true;
      },undefined,()=>{this.loaded=false;});
    }
    this.trail=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0x69adc1,transparent:true,opacity:.6,depthTest:false,depthWrite:false}));
    this.trail.renderOrder=43;this.group.add(this.trail);
    this.contact=new THREE.Mesh(new THREE.RingGeometry(.8,1,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthTest:false,depthWrite:false}));
    this.contact.renderOrder=44;this.group.add(this.contact);
    this.group.visible=false;
  }
  update({elapsed,kind='tap',target,unit,tips=[],width=1280,height=720,reducedMotion=false}) {
    this.group.visible=!!target;
    if(!target)return;
    const phase=(elapsed%2.8)/2.8;
    const approach=Math.min(1,phase/.32), retreat=Math.max(0,(phase-.68)/.18);
    const reach=THREE.MathUtils.smoothstep(approach,0,1)*(1-THREE.MathUtils.smoothstep(retreat,0,1));
    const start=target.clone().add(new THREE.Vector3((target.x<0?45:-45)*unit,-32*unit,.35));
    const handSize=THREE.MathUtils.clamp(Math.min(width,height)*.12,28,48);
    const handHeight=handSize*1.25;
    const flip=target.y/unit < -height/2+handHeight*.92+12;
    start.x=THREE.MathUtils.clamp(start.x,(-width/2+32)*unit,(width/2-32)*unit);
    start.y=Math.max(start.y,(-height/2+(flip?16:handHeight*.92+8))*unit);
    this.hand.material.rotation=kind==='pet'?Math.PI/2:flip?Math.PI:0;
    const end=target.clone();end.z+=.35;
    if(kind==='pet')end.x+=(Math.sin(Math.max(0,phase-.3)*Math.PI*4)*18)*unit;
    if(kind==='follow'){
      end.x+=Math.sin(phase*Math.PI*2)*Math.min(width*.13,80)*unit;
      end.y+=Math.sin(phase*Math.PI)*12*unit;
    }
    const point=reducedMotion?end:start.clone().lerp(end,reach);
    this.hand.position.copy(point);this.hand.scale.set(handSize*unit,handHeight*unit,1);
    this.hand.visible=!!this.loaded;
    this.trail.geometry.setFromPoints([start,end]);this.trail.computeLineDistances();
    this.trail.material.dashSize=4*unit;this.trail.material.gapSize=4*unit;
    this.trail.visible=!reducedMotion;
    this.contact.position.copy(end);this.contact.scale.setScalar((8+reach*8)*unit);
    this.contact.material.opacity=reducedMotion?.65:Math.max(0,1-Math.abs(phase-.45)*7)*.8;
    this.demoPoint=point;
    // Caller suppresses hints near real tips; this illustration is never an input.
    this.tipCount=tips.length;this.width=width;this.height=height;
  }
  hide(){this.group.visible=false;this.demoPoint=null;}
}
