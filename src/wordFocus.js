import {getWordById,resolveAssetUrl} from './wordsConfig.js';
const el=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;};
export class WordFocus {
  constructor(audio,onClose,onSoundChange=()=>{}){this.audio=audio;this.onClose=onClose;this.onSoundChange=onSoundChange;this.token=0;}
  open(word){
    this.close(false);this.word=typeof word==='string'?getWordById(word):word;if(!this.word)return;
    this.returnFocus=document.activeElement===document.body?document.getElementById('btn-last-word'):document.activeElement;
    const overlay=el('div','word-focus-overlay'),panel=el('section','word-focus-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','看看这个单词');
    const close=el('button','word-focus-close','×');close.type='button';close.setAttribute('aria-label','继续玩');close.addEventListener('click',()=>this.close());
    const picture=el('button','word-focus-picture');picture.type='button';picture.setAttribute('aria-label','再听一次英文');const image=el('img','');image.src=resolveAssetUrl(this.word.itemImage||this.word.image);image.alt='';picture.append(image);picture.addEventListener('click',()=>this.play(true));
    const en=el('strong','word-focus-en',this.word.word);en.lang='en';const zh=el('span','word-focus-zh',this.word.zh);zh.lang='zh-CN';
    const listen=el('button','word-focus-listen','🔊 听中文和英文');listen.type='button';listen.addEventListener('click',()=>{if(this.audio.isMuted){this.audio.toggleMute();this.onSoundChange();this.updateControls();this.play(true);}else if(this.audio.recoveryNeeded){this.audio.recoverFromGesture({rebuild:true});this.play(this.lastReview!==false);}else this.play(false);});
    const done=el('button','word-focus-done','继续玩 →');done.type='button';done.addEventListener('click',()=>this.close());
    const status=el('span','word-focus-status','点图片，再听一次英文');status.setAttribute('role','status');
    panel.append(close,picture,en,zh,listen,done,status);overlay.append(panel);document.body.append(overlay);Object.assign(this,{overlay,panel,status,listen});this.updateControls();
    this.keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.close();}if(e.key==='Tab'){const buttons=[...panel.querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
    document.addEventListener('keydown',this.keyHandler,true);close.focus();this.play(true);
  }
  updateControls(){if(this.listen)this.listen.textContent=this.audio.isMuted?'🔊 打开声音':this.audio.recoveryNeeded?'🔊 恢复声音':'🔊 听中文和英文';}
  async play(review){
    if(!this.overlay)return;if(this.audio.isMuted){this.status.textContent='声音已关闭，可点下方打开声音';this.updateControls();return;}const token=++this.token;this.lastReview=review;this.status.textContent=review?'听一听这个词':'中文、英文，一起听一听';
    try{await this.audio.playWord(this.word.id,{review});}catch{}finally{if(token===this.token&&this.overlay)this.status.textContent='准备好就继续玩吧';}
  }
  close(resume=true){
    if(!this.overlay)return;++this.token;this.audio.stopWord();document.removeEventListener('keydown',this.keyHandler,true);this.overlay.remove();this.overlay=null;
    this.returnFocus?.focus?.({preventScroll:true});if(resume)this.onClose?.();
  }
}
