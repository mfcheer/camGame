// A suspended browser must never leave media loading/resume promises pending forever.
export function withDeadline(promise,ms,fallback=null){
  return new Promise(resolve=>{
    const timer=setTimeout(()=>resolve(fallback),ms);
    Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},()=>{clearTimeout(timer);resolve(fallback);});
  });
}
