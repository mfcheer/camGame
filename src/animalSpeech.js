import {chooseAnimalPhrase} from './animalPhrases.js';

export class AnimalSpeech {
  constructor(audio,ui,animal){this.audio=audio;this.ui=ui;this.animal=animal;this.token=0;this.history={};}
  start(phase,animalId,onDone,forcedPhrase=null,options={}){
    this.cancel();this.bilingual=!!options.bilingual;this.phase=phase;this.animalId=animalId;this.onDone=onDone;
    this.phrase=forcedPhrase||chooseAnimalPhrase(phase,animalId,this.history[phase]);this.history[phase]=this.phrase.id;
    this.active=true;this.paused=false;this.play();
  }
  play(){
    const token=++this.token;this.elapsed=0;this.quiet=0;this.done=false;this.closing=0;
    this.ui?.showAnimalSpeech?.(this.phrase,this.animalId,this.phase);
    this.animal?.setSpeechListening?.(false);
    this.animal?.setSpeaking?.(true);
    const finish=()=>{if(token!==this.token)return;this.done=true;this.animal?.setSpeaking?.(false);this.animal?.setSpeechListening?.(true);this.ui?.setAnimalSpeechListening?.();};
    const isZh = this.phase === 'celebrate' || this.bilingual;
    const audioObj = isZh
      ? { ...this.phrase, audio: this.phrase.audioZh || `/audio/phrases/natural/${this.phrase.id}-zh.mp3`, lang: 'zh', primaryLang: 'zh' }
      : { ...this.phrase, audio: this.phrase.audioEn || this.phrase.audio, lang: 'en', primaryLang: 'en' };
    const first=Promise.resolve(this.audio?.playPhrase?.(audioObj));
    if(this.bilingual){
      first.then(()=>{
        if(token!==this.token||!this.active||this.paused)return;
        return this.audio?.playPhrase?.({...this.phrase,audio:this.phrase.audioEn||this.phrase.audio,lang:'en',primaryLang:'en'});
      },()=>{}).then(finish,finish);
    }else first.then(finish,finish);
  }
  replay(){if(this.active&&!this.paused&&!this.closing)this.play();}
  update(dt){
    if(!this.active||this.paused)return;
    if(this.closing>0){
      this.closing=Math.max(0,this.closing-dt);if(this.closing>0)return;
      const onDone=this.onDone;this.cancel();onDone?.();
      return;
    }
    this.elapsed+=dt;if(this.done)this.quiet+=dt;
    if((this.elapsed>=4&&this.done&&this.quiet>=1.8)||this.elapsed>=12){
      this.closing=.28;this.ui?.hideAnimalSpeech?.(true);
    }
  }
  setPaused(paused){
    if(!this.active)return;this.paused=paused;
    if(paused){if(this.bilingual)this.done=true;++this.token;this.audio?.stopPhrase?.();this.ui?.hideAnimalSpeech?.();this.animal?.setSpeaking?.(false);this.animal?.setSpeechListening?.(false);}
    else if(this.nonBlocking&&this.done){this.ui?.showAnimalSpeech?.(this.phrase,this.animalId,this.phase);this.ui?.setAnimalSpeechListening?.();this.animal?.setSpeechListening?.(true);}
    else this.play();
  }
  cancel(){++this.token;this.active=false;this.onDone=null;this.audio?.stopPhrase?.();this.ui?.hideAnimalSpeech?.();this.animal?.setSpeaking?.(false);this.animal?.setSpeechListening?.(false);}
  toJSON(){return this.active?{phase:this.phase,animalId:this.animalId,en:this.phrase.en,zh:this.phrase.zh,speaking:!this.done,listening:this.done&&!this.closing,closing:!!this.closing,paused:this.paused}:null;}
}
