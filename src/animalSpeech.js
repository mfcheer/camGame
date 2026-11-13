import {chooseAnimalPhrase} from './animalPhrases.js';

export class AnimalSpeech {
  constructor(audio,ui,animal){this.audio=audio;this.ui=ui;this.animal=animal;this.token=0;this.history={};}
  start(phase,animalId,onDone){
    this.cancel();this.phase=phase;this.animalId=animalId;this.onDone=onDone;
    this.phrase=chooseAnimalPhrase(phase,animalId,this.history[phase]);this.history[phase]=this.phrase.id;
    this.active=true;this.paused=false;this.play();
  }
  play(){
    const token=++this.token;this.elapsed=0;this.quiet=0;this.done=false;
    this.ui?.showAnimalSpeech?.(this.phrase,this.animalId,this.phase);
    this.animal?.setSpeaking?.(true);
    Promise.resolve(this.audio?.playPhrase?.(this.phrase)).then(()=>{if(token===this.token)this.done=true;},()=>{if(token===this.token)this.done=true;});
  }
  update(dt){
    if(!this.active||this.paused)return;
    this.elapsed+=dt;if(this.done){this.quiet+=dt;this.animal?.setSpeaking?.(false);}
    if((this.elapsed>=1.8&&this.done&&this.quiet>=.35)||this.elapsed>=8){
      const onDone=this.onDone;this.cancel();onDone?.();
    }
  }
  setPaused(paused){
    if(!this.active)return;this.paused=paused;
    if(paused){++this.token;this.audio?.stopPhrase?.();this.ui?.hideAnimalSpeech?.();this.animal?.setSpeaking?.(false);}
    else this.play();
  }
  cancel(){++this.token;this.active=false;this.onDone=null;this.audio?.stopPhrase?.();this.ui?.hideAnimalSpeech?.();this.animal?.setSpeaking?.(false);}
  toJSON(){return this.active?{phase:this.phase,animalId:this.animalId,en:this.phrase.en,zh:this.phrase.zh,speaking:!this.done,paused:this.paused}:null;}
}
