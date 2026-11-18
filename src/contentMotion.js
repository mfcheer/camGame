import {resolveAssetUrl} from './wordsConfig.js';
export function motionFrame(motion,seconds,reduced=false){return reduced?0:Math.floor(Math.max(0,seconds)%motion.duration/motion.duration*motion.frames);}
// Optional visual enhancement: the poster stays visible until the sheet decodes.
export function mountContentMotion(image,content){
  const motion=content.motion;if(!motion)return ()=>{};
  const sheet=new Image(),canvas=document.createElement('canvas');canvas.width=canvas.height=256;canvas.className=image.className;canvas.classList.add('content-motion');
  const ctx=canvas.getContext('2d'),reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false,request=0,last=0,elapsed=0;
  function tick(now){if(disposed)return;const dt=last?Math.min((now-last)/1000,.06):0;last=now;
    if(!document.hidden&&!reduced.matches){elapsed+=dt;ctx.clearRect(0,0,256,256);ctx.drawImage(sheet,motionFrame(motion,elapsed)*256,0,256,256,0,0,256,256);}
    request=requestAnimationFrame(tick);
  }
  sheet.onload=()=>{if(disposed||reduced.matches)return;image.replaceWith(canvas);request=requestAnimationFrame(tick);};
  const change=()=>{if(reduced.matches){canvas.replaceWith(image);}else if(sheet.complete&&sheet.naturalWidth){image.replaceWith(canvas);if(!request)request=requestAnimationFrame(tick);}};
  reduced.addEventListener('change',change);sheet.src=resolveAssetUrl(motion.src);
  return ()=>{disposed=true;canvas.replaceWith(image);cancelAnimationFrame(request);reduced.removeEventListener('change',change);sheet.onload=null;};
}
