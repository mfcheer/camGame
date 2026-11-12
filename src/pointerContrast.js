// Sample a tiny annulus around each rendered tip, not the whole room average.
export function inverseCoverPoint(x,y,videoW,videoH,screenW,screenH) {
  const scale=Math.max(screenW/videoW,screenH/videoH);
  return {x:1-(x*screenW+(videoW*scale-screenW)/2)/(videoW*scale),y:(y*screenH+(videoH*scale-screenH)/2)/(videoH*scale)};
}
export function relativeLuminance(r,g,b) {
  const f=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  return .2126*f(r)+.7152*f(g)+.0722*f(b);
}
export function pointerPalette(luminance,previous='light',player=1) {
  // Hysteresis prevents rapid colour switching along a curtain/wall boundary.
  const mode=previous==='light' ? (luminance>.50?'ink':'light') : (luminance<.32?'light':'ink');
  return {mode,color:mode==='ink'?(player===2?0x00558e:0x6622aa):(player===2?0x83edff:0xffe36a)};
}
export class PointerContrastSampler {
  constructor(video) {
    this.video=video;this.elapsed=1;this.pixels=null;
    if(typeof document!=='undefined' && typeof document.createElement==='function') {
      this.canvas=document.createElement('canvas');
      this.context=this.canvas?.getContext?.('2d',{willReadFrequently:true});
      if(this.canvas){this.canvas.width=160;this.canvas.height=90;}
    }
  }
  clear(){this.pixels=null;this.context?.clearRect(0,0,160,90);}
  update(dt) {
    this.elapsed+=dt;
    if(this.elapsed<.12||!this.context||!(this.video?.readyState>=2))return;
    this.elapsed=0;
    try {this.context.drawImage(this.video,0,0,160,90);this.pixels=this.context.getImageData(0,0,160,90).data;}
    catch {this.pixels=null;}
  }
  sample(x,y,w,h) {
    if(!this.pixels)return .76; // Light simulation sky; double outlines remain visible in either case.
    const vw=this.video.videoWidth||1280,vh=this.video.videoHeight||720;
    let sum=0,n=0;
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4,p=inverseCoverPoint(x+Math.cos(a)*20/w,y+Math.sin(a)*20/h,vw,vh,w,h);
      const px=Math.max(0,Math.min(159,Math.round(p.x*159))),py=Math.max(0,Math.min(89,Math.round(p.y*89))),offset=(px+py*160)*4;
      sum+=relativeLuminance(this.pixels[offset],this.pixels[offset+1],this.pixels[offset+2]);n++;
    }
    return sum/n;
  }
}
