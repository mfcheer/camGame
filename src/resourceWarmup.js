import {assetUrl} from './assetUrl.js';
import {WORDS_LIST,resolveAssetUrl} from './wordsConfig.js';

// Network-only warming. Camera access and model execution remain tied to a
// deliberate camera-game start; a library or game action can interrupt this.
export class ResourceWarmup {
  constructor(poseDetector) {
    this.poseDetector=poseDetector;
    this.mode='home';
    this.generation=0;
    this.finished=new Set();
    this.onVisibility=()=>{
      if(document.hidden)this.cancel();
      else if(this.mode==='home')this.schedule();
    };
    if(typeof document!=='undefined')document.addEventListener?.('visibilitychange',this.onVisibility);
  }

  cancel(){
    ++this.generation;
    if(this.idleHandle!=null&&typeof window!=='undefined'&&window.cancelIdleCallback)window.cancelIdleCallback(this.idleHandle);
    if(this.timer!=null)clearTimeout(this.timer);
    this.idleHandle=null;this.timer=null;
    this.controller?.abort();this.controller=null;
  }

  setMode(mode){
    this.cancel();
    this.mode=mode;
    if(mode==='home')this.schedule();
  }

  schedule(){
    if(typeof window==='undefined'||typeof document==='undefined'||document.hidden||this.mode!=='home')return;
    const generation=this.generation;
    const begin=()=>{
      if(generation!==this.generation||this.mode!=='home'||document.hidden)return;
      if(window.requestIdleCallback)this.idleHandle=window.requestIdleCallback(()=>this.warm(generation),{timeout:2500});
      else this.timer=setTimeout(()=>this.warm(generation),350);
    };
    if(document.readyState==='complete')this.timer=setTimeout(begin,750);
    else window.addEventListener('load',begin,{once:true});
  }

  async warm(generation){
    this.idleHandle=null;this.timer=null;
    if(generation!==this.generation||this.mode!=='home'||document.hidden)return;
    const controller=new AbortController();this.controller=controller;
    const cameraReady=!!(this.poseDetector?.worker||this.poseDetector?.poseLandmarker);
    const saveData=!!navigator.connection?.saveData;
    const cameraAssets=[
      assetUrl('tracking-worker.js'),
      assetUrl('vendor/vision_bundle.js'),
      assetUrl('wasm/vision_wasm_internal.wasm'),
      assetUrl('models/hand_landmarker.task'),
      assetUrl('models/pose_landmarker_lite.task')
    ];
    const smallWordImages=WORDS_LIST.slice(0,8).map(word=>resolveAssetUrl(word.bubbleImage||word.image));
    const urls=[...(!cameraReady&&!saveData?cameraAssets:[]),...smallWordImages];
    for(const url of urls){
      if(generation!==this.generation||this.mode!=='home'||document.hidden||controller.signal.aborted)break;
      if(this.finished.has(url))continue;
      try{
        const response=await fetch(url,{signal:controller.signal,priority:'low'});
        if(!response.ok)continue;
        if(response.body?.getReader){
          const reader=response.body.getReader();
          while(true){const {done}=await reader.read();if(done)break;}
        }else await response.arrayBuffer();
        this.finished.add(url);
      }catch(error){if(error?.name==='AbortError')break;}
    }
    if(this.controller===controller)this.controller=null;
  }

  dispose(){this.cancel();if(typeof document!=='undefined')document.removeEventListener?.('visibilitychange',this.onVisibility);}
}
