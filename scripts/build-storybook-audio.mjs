// macOS authoring; published MP3s are platform-independent. Never overwrite existing clips.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {STORYBOOK_WORDS} from '../src/storybookVocabulary.js';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'camgame-story-audio-'));
await fs.mkdir('public/audio/words/review',{recursive:true});
const trim='aformat=sample_rates=44100:channel_layouts=mono,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,apad=pad_dur=0.18,asetpts=N/SR/TB';
const exists=async file=>fs.access(file).then(()=>true,()=>false);
try{
 for(const word of STORYBOOK_WORDS){
  const full=`public/audio/words/${word.id}.mp3`,review=`public/audio/words/review/${word.id}.mp3`;
  const fullExists=await exists(full),reviewExists=await exists(review);if(fullExists&&reviewExists)continue;
  const cn=path.join(temp,`${word.id}-zh.aiff`),en=path.join(temp,`${word.id}-en.aiff`);
  execFileSync('/usr/bin/say',['-v','Tingting','-r','210','-o',cn,word.zh]);
  execFileSync('/usr/bin/say',['-v','Samantha','-r','145','-o',en,word.word]);
  if(!fullExists)execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',cn,'-i',en,'-filter_complex',`[0:a]${trim},asplit=2[c1][c2];[1:a]${trim},asplit=2[e1][e2];[c1][e1][c2][e2]concat=n=4:v=0:a=1,volume=1.3,alimiter=limit=0.9,asetpts=N/SR/TB[out]`,'-map','[out]','-ar','44100','-b:a','128k',full]);
  if(!reviewExists)execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',en,'-af',`${trim},volume=1.3,alimiter=limit=0.9,asetpts=N/SR/TB`,'-ar','44100','-b:a','96k',review]);
 }
 console.log(`Checked ${STORYBOOK_WORDS.length} pairs of storybook word recordings.`);
}finally{await fs.rm(temp,{recursive:true,force:true});}
