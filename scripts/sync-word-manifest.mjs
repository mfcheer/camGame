import fs from 'node:fs/promises';
import {WORDS_LIST} from '../src/wordsConfig.js';
const entries=WORDS_LIST.map(({id,word,zh,category,image,bubbleImage,svg,bubbleSvg,audio,accent,aliases,sources,conceptId})=>({id,word,zh,category,image,bubbleImage,svg,bubbleSvg,audio,reviewAudio:`/audio/words/review/${id}.mp3`,accent,aliases,sources,...(conceptId?{conceptId}:{})}));
await fs.writeFile('public/images/words/words-manifest.json',JSON.stringify(entries,null,2)+'\n');
console.log(`Synced ${entries.length} unique word entries.`);
