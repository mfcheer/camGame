// Build English-only review clips with the same local Samantha voice used by the source word library.
// macOS authoring only; the checked-in MP3s work on every deployment platform.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {WORDS_LIST} from '../src/wordsConfig.js';
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'camgame-review-'));
await fs.mkdir('public/audio/words/review',{recursive:true});
try{
 for(const word of WORDS_LIST){
  const input=path.join(temporary,`${word.id}.aiff`);
  execFileSync('/usr/bin/say',['-v','Samantha','-r','145','-o',input,word.word]);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',input,'-af','silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,apad=pad_dur=0.12,volume=1.3,alimiter=limit=0.9,asetpts=N/SR/TB','-ar','44100','-b:a','96k',`public/audio/words/review/${word.id}.mp3`]);
 }
 console.log(`Built ${WORDS_LIST.length} English review clips.`);
}finally{await fs.rm(temporary,{recursive:true,force:true});}
