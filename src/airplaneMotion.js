// Fixed wings and landing struts never use the generic animal arm/leg gestures.
export function neutralAirplaneParts(a){
 for(const p of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg,a.leftEarGroup,a.rightEarGroup,a.tailGroup])p.rotation.set(0,0,0);
 a.headGroup.rotation.set(0,0,0);a.bodyMesh.rotation.set(0,0,0);
}
export function rollAirplaneWheels(a,angle){
 a.model.traverse(o=>{if(['Landing_Wheel','Wheel_Hub','Front_Wheel'].includes(o.name))o.rotation.x=angle;});
}
export function airplaneTaxi(a,t,m){
 const s=Math.sin(t*Math.PI)*m;
 a.model.rotation.x=-Math.sin(t*Math.PI*4)*s*.07;
 rollAirplaneWheels(a,Math.sin(t*Math.PI)*Math.PI*3*m);
}
export function airplaneBank(a,t,m){
 const s=Math.sin(t*Math.PI)*m;
 a.model.position.y=s*.12;a.model.rotation.z=Math.sin(t*Math.PI*2)*s*.22;
 a.tailGroup.rotation.y=Math.sin(t*Math.PI*2)*s*.18;
}
export function airplaneTakeoff(a,t,m){
 const s=Math.sin(t*Math.PI)*m;
 a.model.position.y=s*.22;a.model.rotation.x=-s*.17;
 a.tailGroup.rotation.y=Math.sin(t*Math.PI*4)*s*.20;
}
export function resetAirplaneMotion(a){
 neutralAirplaneParts(a);a.model.position.y=0;a.model.rotation.x=0;a.model.rotation.z=0;rollAirplaneWheels(a,0);
}
