import {LEARNING_PHRASES} from './learningPhrases.js';
const KEY='rainbow-content-exposure-v1';
export function readExposure(){try{const data=JSON.parse(localStorage.getItem(KEY));return data?.version===1&&data.seen&&typeof data.seen==='object'?data.seen:{};}catch{return {};}}
export function recordExposure(id){const seen=readExposure();seen[id]=(Number(seen[id])||0)+1;try{localStorage.setItem(KEY,JSON.stringify({version:1,seen}));}catch{}}
export function conflicts(a,b){
  if(a.id===b.id)return true;
  if(a.kind==='phrase'&&b.kind==='phrase')return false;
  const [phrase,word]=a.kind==='phrase'?[a,b]:[b,a];
  return phrase.kind==='phrase'&&phrase.relatedWordIds.includes(word.id);
}
export function mixPhrase(words,allWords,size,{seen=readExposure(),random=Math.random,phrases=LEARNING_PHRASES,recentIds=[]}={}){
  const freshPhrases=phrases.filter(p=>!recentIds.includes(p.id));
  const ranked=(freshPhrases.length?freshPhrases:phrases).map(p=>({p,tie:random()})).sort((a,b)=>(Number(seen[a.p.id])||0)-(Number(seen[b.p.id])||0)||a.tie-b.tie);
  const chosen=ranked.length?[ranked[0].p]:[];
  for(const word of [...words,...allWords.filter(w=>!recentIds.includes(w.conceptId||w.id)),...allWords]){
    if(chosen.length>=size)break;
    if(!chosen.some(other=>conflicts(other,word)||(other.conceptId||other.id)===(word.conceptId||word.id)))chosen.push(word);
  }
  return chosen;
}
// A bounded, cancellable check before the round is locked. Failed phrases fall
// back to ordinary words; failed/abandoned preparation never records exposure.
export async function preparePhraseMedia(pool,resolve,signal){
  return Promise.all(pool.map(async content=>{
    if(content.kind!=='phrase')return content;
    try{
      await Promise.all([content.image,content.audioEn,content.audioZh].map(async path=>{
        const response=await fetch(resolve(path),{signal});
        if(!response.ok)throw Error('Missing media');
        const bytes=await response.arrayBuffer();if(!bytes.byteLength)throw Error('Empty media');
      }));return content;
    }catch{return null;}
  }));
}
