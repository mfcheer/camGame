import test from 'node:test';
import assert from 'node:assert/strict';
import {WordLibrary} from '../src/wordLibrary.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function fixture(){
 const calls=[],jobs=[];const audio={isMuted:false,recoverFromGesture(){}};
 const library=new WordLibrary(audio,()=>{},{stopWord(){},playWord(id,options){calls.push({id,...options});return new Promise(resolve=>jobs.push(resolve));}});
 library.status={textContent:''};
 const card=()=>({classList:{add(){},remove(){}}});
 return {library,calls,jobs,card};
}
test('one tap reads Chinese then English with a gap; active taps do not restart; completed cards replay',async()=>{
 const {library:l,calls,jobs,card}=fixture(),c=card(),w={id:'apple',word:'apple',zh:'苹果'};
 const done=l.playWord(w,c);await l.playWord(w,c);assert.equal(calls.length,1);assert.equal(calls[0].lang,'zh');
 jobs[0]();await wait(100);assert.equal(calls.length,1);await wait(450);assert.deepEqual(calls[1],{id:'apple',review:true,lang:'en'});
 jobs[1]();await done;assert.equal(l.playingCard,null);
 const replay=l.playWord(w,c);assert.equal(calls.length,3);l.stopPlayback();jobs[2]();await replay;
});
test('switching cards cancels the gap; background/close cancellation never starts stale English',async()=>{
 const {library:l,calls,jobs,card}=fixture();
 const first=l.playWord({id:'apple'},card());jobs[0]();await wait(30);
 const second=l.playWord({id:'red-apple'},card());await first;assert.equal(calls.length,2);
 jobs[1]();await wait(30);l.stopPlayback();await second;await wait(550);assert.equal(calls.length,2);assert.equal(l.playingCard,null);
});
test('a late Chinese completion after cancellation cannot schedule English',async()=>{
 const {library:l,calls,jobs,card}=fixture();const done=l.playWord({id:'water'},card());l.stopPlayback();jobs[0]();await done;await wait(550);assert.equal(calls.length,1);
});
