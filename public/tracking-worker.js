/* Local MediaPipe inference. Classic worker because the bundled WASM uses importScripts. */
const localAsset=path=>new URL(path,self.location.href).href;
importScripts(localAsset('vendor/vision_bundle.js'));
let hands, pose, mode='single', frameNumber=0, cachedPose={landmarks:[]}, lastPoseAt=-Infinity;
const canvas=()=>typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(960,540):undefined;
// CPU inference stays off the UI thread and avoids contending with Three.js
// for the same GPU, including software WebGL implementations.
async function create(vision,Task,model,extra) {
  for(const delegate of ['CPU']) {
    try {return {task:await Task.createFromOptions(vision,{baseOptions:{modelAssetPath:model,delegate},canvas:canvas(),runningMode:'VIDEO',...extra}),delegate};}
    catch(error) {if(delegate==='CPU')throw error;}
  }
}
self.onmessage=async({data})=>{
  if(data.type==='init') {
    try {
      self.postMessage({type:'status',step:'loading WASM'});
      const vision=await Vision.FilesetResolver.forVisionTasks(localAsset('wasm'));
      self.postMessage({type:'status',step:'loading hands'});
      const h=await create(vision,Vision.HandLandmarker,localAsset('models/hand_landmarker.task'),{numHands:2,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5});hands=h.task;
      self.postMessage({type:'status',step:'loading body'});
      const p=await create(vision,Vision.PoseLandmarker,localAsset('models/pose_landmarker_lite.task'),{numPoses:1,minPoseDetectionConfidence:.5,minPosePresenceConfidence:.5,minTrackingConfidence:.5});pose=p.task;
      self.postMessage({type:'ready',delegate:h.delegate,poseDelegate:p.delegate});
    }catch(error){hands?.close();pose?.close();self.postMessage({type:'error',message:error.message});}
    return;
  }
  if(data.type!=='frame')return;
  const {bitmap,timestamp,session}=data;
  try {
    if(data.mode!==mode){mode=data.mode;await hands.setOptions({numHands:mode==='coop'?4:2});await pose.setOptions({numPoses:mode==='coop'?2:1});lastPoseAt=-Infinity;}
    const start=performance.now();
    // Hands get the freshest frame. Body ownership is refreshed at 8–10 Hz.
    const handResult=hands.detectForVideo(bitmap,timestamp);
    if(timestamp-lastPoseAt>=120||frameNumber===0) {cachedPose=pose.detectForVideo(bitmap,timestamp);lastPoseAt=timestamp;}
    frameNumber++;
    self.postMessage({type:'result',session,timestamp,pose:cachedPose,hands:handResult,inferenceMs:performance.now()-start});
  }catch(error){self.postMessage({type:'frame-error',session,message:error.message});}
  finally{bitmap.close();}
};
