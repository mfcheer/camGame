import {mountContentMotion} from './contentMotion.js';
import {LEARNING_PHRASES} from './learningPhrases.js';
import {WORDS_LIST,resolveAssetUrl} from './wordsConfig.js';
export const WORD_CATEGORIES=[['all','全部'],['fruits','香甜水果'],['drinks','好喝饮料'],['toys','玩具乐园'],['school','小小教室'],['colors','彩虹颜色'],['shapes','形状积木'],['numbers','数数乐园'],['two_book','绘本朋友'],['animals','动物朋友'],['body','身体部位'],['everyday','生活发现']];
// Picture-book animals remain in their story theme during play, but are also
// discoverable alongside the other animals in the library.
const extraLibraryCategories={animals:new Set(['bee','fish','bird','cat','dog','cow','horse']),numbers:new Set(['one','two'])};
export function libraryWords(category='all'){
  if(category==='learning-phrases')return LEARNING_PHRASES;
  const words=WORDS_LIST.filter(w=>category==='all'||w.category===category||extraLibraryCategories[category]?.has(w.id));
  if(category==='numbers'){
    const order=['one','two','three','four','five'];
    return words.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  }
  return words;
}
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;};

export class WordLibrary {
  constructor(audio,onMuteChange=()=>{},voice=audio,resourceEvents={}){if(typeof document!=='undefined'){const count=document.querySelector('.vocabulary-entry-count');if(count)count.textContent=`${WORDS_LIST.length} 单词 · ${LEARNING_PHRASES.length} 短语`;}this.audio=audio;this.voice=voice;this.onMuteChange=onMuteChange;this.resourceEvents=resourceEvents;this.category='all';this.token=0;this.preloadToken=0;this.preloadSeen=new Set();}
  open(){
    if(this.overlay||typeof document==='undefined')return;
    this.audio?.recoverFromGesture?.();
    this.preloadSeen=new Set();
    this.resourceEvents.onOpen?.();
    this.returnFocus=document.activeElement;this.home=document.getElementById('start-screen');if(this.home)this.home.inert=true;
    const overlay=el('div','word-library-overlay'),panel=el('section','word-library');overlay.id='word-library';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','word-library-title');
    const header=el('header','word-library-header'),book=el('img','word-library-book');book.src=resolveAssetUrl('/images/words/learning/book.svg');book.alt='';
    const title=el('div','word-library-heading'),h=el('h2','','单词小花园');h.id='word-library-title';title.append(h,el('p','',`${WORDS_LIST.length} 个单词 · ${LEARNING_PHRASES.length} 个小短语，点图片，先听中文再听英文`));
    const close=el('button','word-library-close','×');close.type='button';close.setAttribute('aria-label','关闭词库，返回首页');close.addEventListener('click',()=>this.close());header.append(book,title,close);
    const types=el('nav','word-library-filters');types.setAttribute('aria-label','内容类型');
    for(const [id,label] of [['all','单词'],['learning-phrases','小短语']]){const b=el('button','word-library-filter',label);b.type='button';b.dataset.kind=id;b.onclick=()=>{this.stopPlayback();this.category=id;this.renderWords();};types.append(b);}
    this.types=types;
    const filters=el('nav','word-library-filters');filters.setAttribute('aria-label','单词分类');
    for(const [id,label]of WORD_CATEGORIES){const button=el('button','word-library-filter',label);button.type='button';button.dataset.category=id;button.addEventListener('click',()=>{this.stopPlayback();this.category=id;this.resourceEvents.onCategory?.(id);this.renderWords();});filters.appendChild(button);}
    const grid=el('div','word-library-grid');grid.setAttribute('aria-label','单词图片列表');
    const footer=el('footer','word-library-footer'),status=el('span','word-library-status','选一张喜欢的卡片吧');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const sound=el('button','word-library-sound');sound.type='button';sound.addEventListener('click',()=>{if(this.audio?.recoveryNeeded&&!this.audio.isMuted){this.audio.recoverFromGesture?.({rebuild:true});if(this.lastWord&&this.lastCard?.isConnected)this.playWord(this.lastWord,this.lastCard);return;}this.stopPlayback();this.audio?.toggleMute?.();this.onMuteChange();this.updateSound();});
    footer.append(status,sound);panel.append(header,types,filters,grid,footer);overlay.appendChild(panel);document.body.appendChild(overlay);
    Object.assign(this,{overlay,panel,grid,filters,status,sound});this.updateSound();this.renderWords();
    this.keyHandler=e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.close();return;}
      if(e.key!=='Tab')return;
      const buttons=[...this.panel.querySelectorAll('button:not([disabled])')],first=buttons[0],last=buttons.at(-1);
      if(e.shiftKey&&(document.activeElement===first||!this.panel.contains(document.activeElement))){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&(document.activeElement===last||!this.panel.contains(document.activeElement))){e.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown',this.keyHandler,true);close.focus();
  }
  updateSound(){if(!this.sound)return;this.sound.textContent=this.audio?.isMuted?'🔇 声音已关':this.audio?.recoveryNeeded?'🔊 恢复声音':'🔊 声音已开';this.sound.setAttribute('aria-pressed',String(!this.audio?.isMuted));}
  renderWords(){
    const phraseMode=this.category==='learning-phrases';
    this.filters.hidden=phraseMode;
    this.filters.style.display=phraseMode?'none':'';
    for(const b of this.types.children)b.setAttribute('aria-pressed',String((b.dataset.kind==='learning-phrases')===phraseMode));
    for(const button of this.filters.children)button.setAttribute('aria-pressed',String(button.dataset.category===this.category));
    this.preloadObserver?.disconnect();
    const preloadToken=++this.preloadToken;
    // Downloads from the previous category/open still count until they settle.
    this.preloadQueue=[];this.preloadActive=this.preloadActive||0;
    this.grid.replaceChildren();this.grid.scrollTop=0;
    const words = libraryWords(this.category);
    for(const [index,word] of words.entries()){
      const card=el('button','library-word');card.type='button';card.dataset.word=word.id;card.setAttribute('aria-label',`${word.word}，${word.zh}，点击先听中文再听英文`);
      const picture=el('img','library-word-image');picture.alt='';picture.loading=index<8?'eager':'lazy';picture.decoding='async';
      const pictureUrl=resolveAssetUrl(word.itemImage||word.image);
      if(index<8||typeof IntersectionObserver==='undefined'){
        if(index<8)picture.fetchPriority='high';
        picture.src=pictureUrl;
      }else picture.dataset.src=pictureUrl;
      const en=el('strong','library-word-en',word.word);en.lang='en';const zh=el('span','library-word-zh',word.zh);zh.lang='zh-CN';
      const speaker=el('span','library-word-speaker','♪');speaker.setAttribute('aria-hidden','true');card.append(picture,en,zh,speaker);card.addEventListener('click',()=>this.playWord(word,card));this.grid.appendChild(card);
    }
    this.preloadQueue=(this.category==='all'?words.slice(0,8):words).map(word=>word.id).filter(id=>!this.preloadSeen.has(id));
    if(typeof IntersectionObserver!=='undefined'){
      this.preloadObserver=new IntersectionObserver(entries=>{
        if(preloadToken!==this.preloadToken)return;
        for(const entry of entries)if(entry.isIntersecting){
          const picture=entry.target.querySelector('img[data-src]');
          if(picture){picture.src=picture.dataset.src;delete picture.dataset.src;}
          this.prioritizeAudio(entry.target.dataset.word);
        }
      },{root:this.grid,rootMargin:'140px'});
      for(const card of this.grid.children)this.preloadObserver.observe(card);
    }
    this.pumpAudioPreload(preloadToken);
    this.status.textContent=`${libraryWords(this.category).length} 张词卡 · 点一下，先中文再英文`;
  }
  prioritizeAudio(id){
    if(!id||this.preloadSeen.has(id))return;
    const index=this.preloadQueue.indexOf(id);
    if(index>=0)this.preloadQueue.splice(index,1);
    this.preloadQueue.unshift(id);
    this.pumpAudioPreload(this.preloadToken);
  }
  pumpAudioPreload(token){
    if(token!==this.preloadToken||!this.overlay||typeof this.audio?.loadWordBuffer!=='function')return;
    while(this.preloadActive<2&&this.preloadQueue.length){
      const id=this.preloadQueue.shift();
      if(this.preloadSeen.has(id))continue;
      this.preloadSeen.add(id);this.preloadActive++;
      let loading;try{loading=this.audio.loadWordBuffer(id,{review:true});}catch{loading=null;}
      Promise.resolve(loading).catch(()=>{}).finally(()=>{
        this.preloadActive--;this.pumpAudioPreload(this.preloadToken);
      });
    }
  }
  async playWord(word,card){
    // A second tap on the active card must not restart or overlap its sequence.
    if(this.playingCard===card)return;
    this.lastWord=word;this.lastCard=card;this.stopPlayback();if(this.audio?.isMuted){this.status.textContent='先点右边的小喇叭，再听中文和英文吧';return;}
    const token=++this.token;this.playingCard=card;card.classList.add('is-speaking');this.status.textContent=`${word.zh} → ${word.word}`;
    this.audio?.recoverFromGesture?.();
    const image=card.querySelector?.('img');
    if(image&&word.motion){try{this.disposeMotion=mountContentMotion(image,word);}catch{/* Keep the static picture if motion is unavailable. */}}
    let failed=false;
    const failedStatus=()=>['unavailable','blocked','timeout','stalled','interrupted'].includes(this.audio?.lastVoiceStatus);
    try{
      await this.voice?.playWord?.(word.id,{lang:'zh'});
      if(token!==this.token)return;
      failed=failedStatus();
      await new Promise(resolve=>{this.gapResolve=resolve;this.gapTimer=setTimeout(()=>{this.gapTimer=null;this.gapResolve=null;resolve();},500);});
      if(token!==this.token)return;
      await this.voice?.playWord?.(word.id,{review:true,lang:'en'});
      failed=failed||failedStatus();
    }catch{failed=true;}finally{
      if(token===this.token){
        this.disposeMotion?.();this.disposeMotion=null;
        card.classList.remove('is-speaking');this.playingCard=null;
        if(this.status)this.status.textContent=failed?'声音暂时没准备好，可以重试或换一张卡片':'再点一次，还可以听一遍';
      }
    }
  }
  stopPlayback(){
    ++this.token;clearTimeout(this.gapTimer);this.gapTimer=null;this.gapResolve?.();this.gapResolve=null;
    this.voice?.stopWord?.();this.disposeMotion?.();this.disposeMotion=null;
    this.playingCard?.classList.remove('is-speaking');this.playingCard=null;
  }
  close(){
    if(!this.overlay)return;this.stopPlayback();++this.preloadToken;this.preloadQueue=[];this.preloadObserver?.disconnect();this.preloadObserver=null;document.removeEventListener('keydown',this.keyHandler,true);this.overlay.remove();this.overlay=null;this.resourceEvents.onClose?.();
    if(this.home)this.home.inert=false;if(this.returnFocus?.isConnected)this.returnFocus.focus();
  }
}
