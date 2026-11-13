import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=new URL('../output/playwright/v32/browser/',import.meta.url).pathname;
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:720}});
const page=await context.newPage(),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const read=()=>page.evaluate(()=>JSON.parse(render_game_to_text()));
const shot=async name=>{
 await page.waitForFunction(()=>[...document.querySelectorAll('.animal-speech:not(.is-leaving),.play-word-cue')].every(e=>Number(getComputedStyle(e).opacity)>.95));
 return page.screenshot({path:out+name+'.png'});
};
const voices=()=>page.evaluate(()=>window.voiceCalls.length);
const idleVoice=()=>page.waitForFunction(()=>!gameInstance.voiceQueue.current,null,{timeout:18000});
async function setup(){
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5177');
 await page.waitForFunction(()=>window.gameInstance?.rescueAnimal.assetStatus==='glb');
 await page.evaluate(()=>{
  window.voiceCalls=[];const a=gameInstance.audioManager;
  for(const method of ['playWord','playPhrase']){const original=a[method].bind(a);a[method]=(...args)=>{if(method!=='playWord'||!args[1]?.phrase)voiceCalls.push({method,args,time:gameInstance.speechPolicy.activeSeconds});return original(...args);};}
 });
}
async function pop(){
 await page.waitForFunction(()=>gameInstance.state==='PLAYING'&&gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5);
 const before=await read();await page.mouse.move(640,100);await page.mouse.move(before.bubble.x,before.bubble.y,{steps:6});
 await page.waitForFunction(n=>gameInstance.collectedCount>n,before.score,{timeout:5000});await page.mouse.move(640,100);
 return read();
}
async function finish(){
 while((await read()).mode==='PLAYING')await pop();
 await page.waitForFunction(()=>gameInstance.friendInteraction.active);
 const count=await voices();await shot('pet-play');await page.locator('#btn-friend-done').click();
 await page.locator('#victory-modal').waitFor({state:'visible',timeout:18000});assert.equal(await voices(),count,'farewell must not speak automatically');
 assert.equal((await read()).flowLearning.voice.speaking,null);
}
try{
 await setup();assert.equal(await page.locator('#word-mode').isChecked(),false);await shot('home-default');
 await page.locator('#btn-demo-mode').click();await pop();assert.equal(await voices(),0);assert.ok(await page.evaluate(()=>gameInstance.bubbleManager.wordMode));
 assert.equal((await read()).flowLearning.cue,null);assert.ok((await read()).flowLearning.word);await shot('default-picture-play');
 const score=(await read()).score;await page.locator('#btn-last-word').click();await page.locator('.word-focus-panel').waitFor();assert.equal((await read()).mode,'PAUSED');assert.equal(await voices(),1);
 await shot('manual-word');await idleVoice();await page.locator('.word-focus-picture').click();assert.equal(await voices(),2);await idleVoice();
 await page.locator('.word-focus-listen').click();assert.equal(await voices(),3);assert.equal(await page.evaluate(()=>voiceCalls.at(-1).args[1].review),false);
 await page.locator('.word-focus-done').click();assert.equal((await read()).score,score);assert.equal((await read()).mode,'PLAYING');
 await page.locator('#btn-animal-voice').click();assert.equal(await voices(),4);await shot('manual-animal');
 await page.evaluate(()=>gameInstance.handlePageBackground());const paused=(await read()).flowLearning.speechPolicy.cooldownSeconds;
 await page.waitForTimeout(250);await page.evaluate(()=>gameInstance.handlePageForeground());await page.locator('#btn-resume').click();
 assert.equal(await voices(),4);assert.equal((await read()).animalSpeech,null);assert.ok((await read()).flowLearning.speechPolicy.cooldownSeconds>=paused-.6);
 await finish();assert.equal(await voices(),4);await shot('default-result');results.push('Default full rescue has no automatic voice; manual English/bilingual/animal speech works without extra score; background cancels speech and does not replay.');
 await page.locator('#btn-victory-exit').click();
 for(const [width,height] of [[320,568],[390,844],[844,390],[667,240]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(160);
  for(const selector of ['#btn-start-game','#word-mode']){const box=await page.locator(selector).boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,`${selector} fits ${width}x${height}`);}
  await shot(`home-${width}x${height}`);
 }
 await page.setViewportSize({width:1280,height:720});await page.locator('#word-mode').check();await page.reload();
 assert.equal(await page.locator('#word-mode').isChecked(),true);results.push('Automatic setting persists; home toggle and start remain reachable in four mobile viewports.');
 // Fresh game clock gives the first automatic word a clear opportunity.
 await setup();await page.locator('#btn-demo-mode').click();
 for(let round=0;round<3;round++){
  const before=await voices();await pop();if(round===0){assert.equal(await voices(),before+1);assert.ok((await read()).flowLearning.cue);await shot('automatic-cue');}
  while((await read()).mode==='PLAYING')await pop();
  const count=await voices()-before;assert.ok(count<=1,`round ${round+1} speaks at most once`);
  await page.locator('#btn-friend-done').click();await page.locator('#victory-modal').waitFor({state:'visible',timeout:18000});
  assert.equal(await voices()-before,count);results.push(`Automatic round ${round+1}: ${count} word, no phrase or backlog.`);
  if(round<2)await page.locator('#btn-play-again').click();
 }
 await page.locator('#btn-play-again').click();await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble);
 for(const [width,height] of [[320,568],[390,844],[844,390],[667,240]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(160);
  // An explicit picture card and phrase also need to fit after adding the HUD control.
  for(const selector of ['#btn-animal-voice','#btn-last-word','#btn-pause']){
   if(await page.locator(selector).isVisible()){const b=await page.locator(selector).boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1);}
  }
  await page.locator('#btn-animal-voice').click();await shot(`speech-${width}x${height}`);
  const rect=await page.locator('.animal-speech').boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1);
  await page.evaluate(()=>gameInstance.animalSpeech.cancel());
 }
 results.push('HUD and explicit animal captions fit all four mobile viewports.');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'results.json',JSON.stringify({pass:true,results,errors},null,2));console.log(JSON.stringify({pass:true,results,errors},null,2));
}catch(e){await shot('failure');await fs.writeFile(out+'results.json',JSON.stringify({pass:false,results,error:e.stack,errors,state:await read()},null,2));console.error(e);process.exitCode=1;}
finally{await browser.close();}
