// One voice at a time, with just the latest pending word. Never slow the game to drain a backlog.
export class VoiceQueue {
  constructor(audio){this.audio=audio;this.current=null;this.pendingWord=null;this.pendingPhrase=null;this.paused=false;this.resumeWord=null;}
  request(kind,value,onStart){
    return new Promise(resolve=>{
      const job={kind,value,onStart,resolve};
      if(this.paused){resolve();return;}
      if(kind==='phrase'){this.pendingWord?.resolve();this.pendingWord=null;this.pendingPhrase?.resolve();this.pendingPhrase=null;if(this.current?.kind==='phrase'){const old=this.current;this.current=null;this.audio.stopWord();old.resolve();}}
      if(!this.current){this.start(job);return;}
      const slot=kind==='word'?'pendingWord':'pendingPhrase';this[slot]?.resolve();this[slot]=job;
      if(kind==='phrase'){this.pendingWord?.resolve();this.pendingWord=null;}
    });
  }
  playWord(id,onStart){return this.request('word',id,onStart);}
  playPhrase(phrase){return this.request('phrase',phrase);}
  start(job){
    this.current=job;
    let playing;
    try{job.onStart?.();playing=job.kind==='word'?this.audio.playWord(job.value,{review:true}):this.audio.playPhrase(job.value);}catch{playing=Promise.resolve();}
    Promise.resolve(playing).then(()=>this.finish(job),()=>this.finish(job));
  }
  finish(job){
    if(this.current!==job)return;this.current=null;job.resolve();this.drain();
  }
  drain(){
    if(this.paused||this.current)return;
    const job=this.pendingPhrase||this.pendingWord;if(!job)return;
    if(job===this.pendingPhrase)this.pendingPhrase=null;else this.pendingWord=null;
    this.start(job);
  }
  stopPhrase(){
    this.pendingPhrase?.resolve();this.pendingPhrase=null;
    if(this.current?.kind==='phrase'){const old=this.current;this.current=null;this.audio.stopWord();old.resolve();this.drain();}
  }
  cancel(){
    const old=this.current;this.current=null;this.pendingWord?.resolve();this.pendingPhrase?.resolve();this.pendingWord=null;this.pendingPhrase=null;this.resumeWord=null;
    if(old){this.audio.stopWord();old.resolve();}
  }
  pause(){
    if(this.paused)return;
    const word=this.pendingWord||(this.current?.kind==='word'?this.current:null);
    this.paused=true;this.cancel();this.resumeWord=word;
  }
  resume(){this.paused=false;}
  resumePending(){const word=this.resumeWord;this.resumeWord=null;if(word)this.playWord(word.value,word.onStart);}
  toJSON(){return {speaking:this.current?.kind||null,word:this.current?.kind==='word'?this.current.value:null,pendingWord:this.pendingWord?.value||null,phrasePending:!!this.pendingPhrase,paused:this.paused};}
}
