import {DIALOGUES} from './dialogueContent.js';

// Exact content IDs only: relatedWordIds must not turn red apples into ball questions.
export const DIALOGUE_LINKS = {
  cat: ['identify','cat'], dog: ['identify','dog'],
  'blue-ball': ['color','blue'], 'two-balls': ['count','two-balls'],
  apple: ['likes'], banana: ['likes'], 'red-apple': ['likes'],
  'yellow-banana': ['likes'], 'three-apples': ['likes'], 'eat-an-apple': ['likes'],
  water: ['drinks'], milk: ['drinks'], 'drink-water': ['drinks'],
  happy: ['feelings'], sunny: ['weather','sunny']
};

export function selectDialogue(poppedIds, {lastTopic=null, counts={}, fallbackIndex=0, random=Math.random}={}) {
  const candidates=new Map();
  for(const id of new Set(poppedIds||[])) {
    const link=DIALOGUE_LINKS[id];
    if(!link||link[0]===lastTopic)continue;
    if(!candidates.has(link[0]))candidates.set(link[0],[]);
    candidates.get(link[0]).push({contentId:id,correct:link[1]||null});
  }
  if(candidates.size){
    const entries=[...candidates.entries()];
    const min=Math.min(...entries.map(([id])=>counts[id]||0));
    const least=entries.filter(([id])=>(counts[id]||0)===min);
    const [topicId,links]=least[Math.floor(random()*least.length)];
    const link=links[Math.floor(random()*links.length)];
    return {topic:DIALOGUES.find(t=>t.id===topicId),...link,linked:true,fallbackIndex};
  }
  let index=fallbackIndex%DIALOGUES.length;
  if(DIALOGUES[index].id===lastTopic)index=(index+1)%DIALOGUES.length;
  return {topic:DIALOGUES[index],correct:null,contentId:null,linked:false,fallbackIndex:(index+1)%DIALOGUES.length};
}
