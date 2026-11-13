// macOS authoring only. Static MP3s work on all client platforms; existing files are preserved.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {CLASSROOM_NEW_WORDS} from '../src/classroomVocabulary.js';
import {ANIMAL_PHRASES} from '../src/animalPhrases.js';
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'camgame-classroom-'));
const trim='aformat=sample_rates=44100:channel_layouts=mono,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,apad=pad_dur=0.18,asetpts=N/SR/TB';
const exists=async f=>fs.access(f).then(()=>true,()=>false);
const say=(id,text,voice,rate)=>{const f=path.join(tmp,id+'.aiff');execFileSync('/usr/bin/say',['-v',voice,'-r',String(rate),'-o',f,text]);return f;};
const encode=(input,out)=>execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',input,'-af',`${trim},volume=1.3,alimiter=limit=0.9,asetpts=N/SR/TB`,'-ar','44100','-b:a','96k',out]);
try{
 await fs.mkdir('public/audio/phrases',{recursive:true});
 for(const w of CLASSROOM_NEW_WORDS){
  const full='public'+w.audio,review='public'+w.reviewAudio;if(await exists(full)&&await exists(review))continue;
  const cn=say(w.id+'-cn',w.zh,'Tingting',210),en=say(w.id+'-en',w.word,'Samantha',145);
  if(!await exists(full))execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',cn,'-i',en,'-filter_complex',`[0:a]${trim},asplit=2[c1][c2];[1:a]${trim},asplit=2[e1][e2];[c1][e1][c2][e2]concat=n=4:v=0:a=1,volume=1.3,alimiter=limit=0.9,asetpts=N/SR/TB[out]`,'-map','[out]','-ar','44100','-b:a','128k',full]);
  if(!await exists(review))encode(en,review);
 }
 for(const p of Object.values(ANIMAL_PHRASES).flat()){const legacy=`public/audio/phrases/${p.id}.mp3`;if(!await exists(legacy))encode(say(p.id,p.en,'Samantha',145),legacy);}
 console.log('Checked 8 classroom word pairs and 13 short English phrases.');
}finally{await fs.rm(tmp,{recursive:true,force:true});}
