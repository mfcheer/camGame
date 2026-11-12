let installed=false;
let insets={top:0,right:0,bottom:0,left:0};

export function getViewport(){
 const w=typeof window!=='undefined'?window:null,v=w?.visualViewport;
 // Pinch zoom should magnify the page rather than rebuilding the game under the fingers.
 const visual=v&&Math.abs((v.scale||1)-1)<.02?v:null;
 return {width:Math.round(visual?.width||w?.innerWidth||1280),height:Math.round(visual?.height||w?.innerHeight||720),left:visual?.offsetLeft||0,top:visual?.offsetTop||0};
}
export function getSafeInsets(){return insets;}
export function getHudBottom(){
 const rect=typeof document!=='undefined'?document.getElementById?.('game-hud')?.getBoundingClientRect?.():null;
 return rect?.height?rect.bottom-getViewport().top:insets.top+84;
}
export function installViewport(){
 if(installed||typeof window==='undefined'||typeof document==='undefined'||!document.documentElement?.style)return;
 installed=true;
 const sync=()=>{
  const v=getViewport(),root=document.documentElement;
  root.style.setProperty('--app-width',`${v.width}px`);root.style.setProperty('--app-height',`${v.height}px`);
  root.style.setProperty('--viewport-left',`${v.left}px`);root.style.setProperty('--viewport-top',`${v.top}px`);
  root.dataset.orientation=v.height>v.width?'portrait':'landscape';
  const css=getComputedStyle(root);for(const side of ['top','right','bottom','left'])insets[side]=parseFloat(css.getPropertyValue(`--safe-${side}`))||0;
  window.dispatchEvent(new Event('gameviewportchange'));
 };
 window.addEventListener('resize',sync);window.addEventListener('orientationchange',sync);
 window.visualViewport?.addEventListener('resize',sync);window.visualViewport?.addEventListener('scroll',sync);sync();
}
