// One voice at a time. Automatic opportunities are dropped; only explicit legacy requests can queue.
export class VoiceQueue {
  constructor(audio,policy=null){this.audio=audio;this.policy=policy;this.current=null;this.pendingWord=null;this.pendingPhrase=null;this.paused=false;this.resumeWord=null;}
  request(kind,value,onStart,options={review:true}){
    return new Promise(resolve=>{
      const job={kind,value,onStart,resolve,options};
      if(this.paused){resolve();return;}
      if(kind==='phrase'){this.pendingWord?.resolve();this.pendingWord=null;this.pendingPhrase?.resolve();this.pendingPhrase=null;if(this.current?.kind==='phrase'){const old=this.current;this.current=null;this.audio.stopWord();this.policy?.endSpeech(old.speechToken);old.resolve();}}
      if(!this.current){this.start(job);return;}
      const slot=kind==='word'?'pendingWord':'pendingPhrase';this[slot]?.resolve();this[slot]=job;
      if(kind==='phrase'){this.pendingWord?.resolve();this.pendingWord=null;}
    });
  }
  playWord(id,onStart){return this.request('word',id,onStart);}
  playAutomaticWord(id,onStart,options={review:true}){
    // Automatic opportunities are disposable; they must never enter the pending slots.
    if(this.paused||this.audio.isMuted||this.audio.recoveryNeeded||!this.policy?.allowAutomatic({busy:!!this.current}))return Promise.resolve();
    return new Promise(resolve=>this.start({kind:'word',value:id,onStart,resolve,options,automatic:true}));
  }
  playManualWord(id,options={review:true}){this.cancel();this.resume();return this.request('word',id,null,options);}
  playPhrase(phrase){return this.request('phrase',phrase);}
  start(job){
    this.current=job;
    job.speechToken=this.policy?.beginSpeech();
    let playing;
    try{job.onStart?.();playing=job.kind==='word'?this.audio.playWord(job.value,job.options):this.audio.playPhrase(job.value);}catch{playing=Promise.resolve();}
    Promise.resolve(playing).then(()=>this.finish(job),()=>this.finish(job));
  }
  finish(job){
    if(this.current!==job)return;this.current=null;this.policy?.endSpeech(job.speechToken);job.resolve();this.drain();
  }
  drain(){
    if(this.paused||this.current)return;
    const job=this.pendingPhrase||this.pendingWord;if(!job)return;
    if(job===this.pendingPhrase)this.pendingPhrase=null;else this.pendingWord=null;
    this.start(job);
  }
  stopPhrase(){
    this.pendingPhrase?.resolve();this.pendingPhrase=null;
    if(this.current?.kind==='phrase'){const old=this.current;this.current=null;this.audio.stopWord();this.policy?.endSpeech(old.speechToken);old.resolve();this.drain();}
  }
  cancel(){
    const old=this.current;this.current=null;this.pendingWord?.resolve();this.pendingPhrase?.resolve();this.pendingWord=null;this.pendingPhrase=null;this.resumeWord=null;
    if(old){this.audio.stopWord();this.policy?.endSpeech(old.speechToken);old.resolve();}
  }
  pause({discard=false}={}){
    if(this.paused){if(discard)this.resumeWord=null;return;}
    const word=this.pendingWord||(this.current?.kind==='word'?this.current:null);
    this.paused=true;this.cancel();this.resumeWord=discard||word?.automatic?null:word;
  }
  resume(){this.paused=false;}
  resumePending(){const word=this.resumeWord;this.resumeWord=null;if(word)this.playWord(word.value,word.onStart);}
  toJSON(){return {speaking:this.current?.kind||null,automatic:!!this.current?.automatic,word:this.current?.kind==='word'?this.current.value:null,pendingWord:this.pendingWord?.value||null,phrasePending:!!this.pendingPhrase,paused:this.paused};}
}
