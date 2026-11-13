export function shouldBlockNavigationWheel(event,active){
  return !!active&&!event.ctrlKey&&!event.metaKey&&Math.abs(event.deltaX)>0&&Math.abs(event.deltaX)>=Math.abs(event.deltaY)*.5;
}

// Trackpad history gestures start as horizontal wheel events. Do not trap normal scrolling or zoom.
export function installNavigationGuard(isActive,target=window){
  const wheel=event=>{if(shouldBlockNavigationWheel(event,isActive())&&event.cancelable)event.preventDefault();};
  target.addEventListener('wheel',wheel,{capture:true,passive:false});
  return ()=>target.removeEventListener('wheel',wheel,{capture:true});
}
