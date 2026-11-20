export function setFalcon(a,l,r=l){
 a.model.getObjectByName('Falcon_L').rotation.z=l===0?0:-l;
 a.model.getObjectByName('Falcon_R').rotation.z=r;
}
export function resetModelX(a){
 for(const p of [a.headGroup,a.bodyMesh,a.leftArm,a.rightArm,a.leftLeg,a.rightLeg,a.leftEarGroup,a.rightEarGroup,a.tailGroup])p.rotation.set(0,0,0);
 setFalcon(a,0);a.model.rotation.set(0,0,0);a.model.position.y=0;
}
export function modelxWings(a,t,m){setFalcon(a,Math.sin(t*Math.PI)*1.18*m);}
export function modelxDance(a,t,m){const s=Math.sin(t*Math.PI)*m;setFalcon(a,s*(.65+.25*Math.sin(t*Math.PI*4)),s*(.65-.25*Math.sin(t*Math.PI*4)));a.model.rotation.z=Math.sin(t*Math.PI*4)*s*.055;}
export function modelxDeparture(a,t,m){const s=Math.sin(t*Math.PI)*m;setFalcon(a,Math.max(0,Math.sin(Math.min(1,t*1.6)*Math.PI))*.95*m);a.model.rotation.x=-s*.055;for(const w of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])w.rotation.x=s*3;}
