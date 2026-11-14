import {WORDS_LIST,resolveAssetUrl} from './wordsConfig.js';
export const WORD_CATEGORIES=[['all','全部'],['toys','玩具乐园'],['school','小小教室'],['colors','彩虹颜色'],['shapes','形状积木'],['two_book','绘本朋友'],['animals','动物朋友'],['body','身体部位'],['everyday','生活发现']];
// Picture-book animals remain in their story theme during play, but are also
// discoverable alongside the other animals in the library.
const extraLibraryCategories={animals:new Set(['bee','fish','bird','cat','dog','cow','horse'])};
export function libraryWords(category='all'){return WORDS_LIST.filter(w=>category==='all'||w.category===category||extraLibraryCategories[category]?.has(w.id));}
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;};

export class WordLibrary {
  constructor(audio,onMuteChange=()=>{},voice=audio){if(typeof document!=='undefined'){const count=document.querySelector('.vocabulary-entry-count');if(count)count.textContent=`${WORDS_LIST.length} 词`;}this.audio=audio;this.voice=voice;this.onMuteChange=onMuteChange;this.category='all';this.token=0;}
  open(){
    if(this.overlay||typeof document==='undefined')return;
    this.returnFocus=document.activeElement;this.home=document.getElementById('start-screen');if(this.home)this.home.inert=true;
    const overlay=el('div','word-library-overlay'),panel=el('section','word-library');overlay.id='word-library';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','word-library-title');
    const header=el('header','word-library-header'),book=el('img','word-library-book');book.src=resolveAssetUrl('/images/words/learning/book.svg');book.alt='';
    const title=el('div','word-library-heading'),h=el('h2','','单词小花园');h.id='word-library-title';title.append(h,el('p','',`${WORDS_LIST.length} 个小发现，点点卡片听英文`));
    const close=el('button','word-library-close','×');close.type='button';close.setAttribute('aria-label','关闭词库，返回首页');close.addEventListener('click',()=>this.close());header.append(book,title,close);
    const filters=el('nav','word-library-filters');filters.setAttribute('aria-label','单词分类');
    for(const [id,label]of WORD_CATEGORIES){const button=el('button','word-library-filter',label);button.type='button';button.dataset.category=id;button.addEventListener('click',()=>{this.stopPlayback();this.category=id;this.renderWords();});filters.appendChild(button);}
    const grid=el('div','word-library-grid');grid.setAttribute('aria-label','单词图片列表');
    const footer=el('footer','word-library-footer'),status=el('span','word-library-status','选一张喜欢的卡片吧');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const sound=el('button','word-library-sound');sound.type='button';sound.addEventListener('click',()=>{if(this.audio?.recoveryNeeded&&!this.audio.isMuted){this.audio.recoverFromGesture?.({rebuild:true});if(this.lastWord&&this.lastCard?.isConnected)this.playWord(this.lastWord,this.lastCard);return;}this.audio?.toggleMute?.();this.onMuteChange();this.updateSound();});
    footer.append(status,sound);panel.append(header,filters,grid,footer);overlay.appendChild(panel);document.body.appendChild(overlay);
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
    for(const button of this.filters.children)button.setAttribute('aria-pressed',String(button.dataset.category===this.category));
    this.grid.replaceChildren();this.grid.scrollTop=0;
    for(const word of libraryWords(this.category)){
      const card=el('button','library-word');card.type='button';card.dataset.word=word.id;card.setAttribute('aria-label',`${word.word}，${word.zh}，点击听英文`);
      const picture=el('img','library-word-image');picture.src=resolveAssetUrl(word.itemImage||word.image);picture.alt='';picture.loading='lazy';picture.decoding='async';
      const en=el('strong','library-word-en',word.word);en.lang='en';const zh=el('span','library-word-zh',word.zh);zh.lang='zh-CN';
      const speaker=el('span','library-word-speaker','♪');speaker.setAttribute('aria-hidden','true');card.append(picture,en,zh,speaker);card.addEventListener('click',()=>this.playWord(word,card));this.grid.appendChild(card);
    }
    this.status.textContent=`${libraryWords(this.category).length} 张词卡 · 点一下听英文`;
  }
  async playWord(word,card){
    this.lastWord=word;this.lastCard=card;this.stopPlayback();if(this.audio?.isMuted){this.status.textContent='先点右边的小喇叭，再听英文吧';return;}
    const token=++this.token;this.playingCard=card;card.classList.add('is-speaking');this.status.textContent=`${word.word} · ${word.zh}`;
    this.audio?.recoverFromGesture?.();
    try{await this.voice?.playWord?.(word.id,{review:true});}catch{/* The ordinary word player already attempts local media and speech fallbacks. */}finally{if(token===this.token){card.classList.remove('is-speaking');this.playingCard=null;if(this.status)this.status.textContent='再点一次，还可以听一遍';}}
  }
  stopPlayback(){++this.token;this.voice?.stopWord?.();this.playingCard?.classList.remove('is-speaking');this.playingCard=null;}
  close(){
    if(!this.overlay)return;this.stopPlayback();document.removeEventListener('keydown',this.keyHandler,true);this.overlay.remove();this.overlay=null;
    if(this.home)this.home.inert=false;if(this.returnFocus?.isConnected)this.returnFocus.focus();
  }
}
