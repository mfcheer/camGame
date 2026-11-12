import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=new URL('../output/playwright/v14/interactions/',import.meta.url).pathname;await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const read=()=>page.evaluate(()=>JSON.parse(render_game_to_text()));const results=[];
try{
 await page.goto('http://127.0.0.1:5175');await page.waitForFunction(()=>gameInstance?.rescueAnimal?.assetStatus==='glb');await page.locator('[data-animal="cat"]').click();await page.locator('#btn-demo-mode').click();await page.waitForFunction(()=>gameInstance.rescueAnimal.assetStatus==='glb');
 await page.evaluate(()=>{const a=gameInstance.audioManager;window.audioNoteCount=0;const play=a._playBGMNote.bind(a);a._playBGMNote=(...args)=>{window.audioNoteCount++;return play(...args);};});await page.waitForFunction(()=>audioNoteCount>0);
 const hits=[];for(let i=0;i<3;i++){
  await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.42);
  const before=await read();await page.mouse.move(640,130);await page.mouse.move(before.bubble.x,before.bubble.y,{steps:2});await page.waitForFunction(n=>gameInstance.collectedCount===n,i+1);hits.push(await read());
 }
 assert.ok(hits.at(-1).combo>=2,'real pointer hits should be able to reach a combo');
 await page.waitForTimeout(350);await page.screenshot({path:out+'01-real-combo.png'});assert.equal(await page.locator('#combo-badge').isVisible(),true);results.push('Three actual pointer hits reach combo and show the real badge');
 await page.locator('#btn-pause').click();const paused=await read();assert.equal(paused.combo,0);assert.equal(await page.locator('#combo-badge').isVisible(),false);await page.locator('#btn-resume').click();assert.equal((await read()).combo,0);results.push('Pause cancels combo and resume does not resurrect it');
 // Stop moving; spend the entire ready-bubble budget, which must expire without scoring.
 const score=(await read()).score;await page.waitForTimeout(1800);assert.equal((await read()).score,score);
 await page.locator('#btn-sound').click();await page.locator('#btn-pause').click();await page.locator('#btn-exit').click();await page.locator('#btn-demo-mode').click();const muted=await page.evaluate(()=>gameInstance.audioManager.isMuted);assert.equal(muted,true);await page.locator('#btn-sound').click();const notes=await page.evaluate(()=>audioNoteCount);await page.waitForFunction(n=>audioNoteCount>n,notes);assert.equal(await page.evaluate(()=>!!gameInstance.audioManager.bgmInterval),true);results.push('Muted exit and new round recover real Web Audio BGM notes after unmute');
 assert.equal((await read()).stage,(await read()).bgmStage);results.push('Random scenery and its music theme remain aligned');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#combo-rainbow-wave').evaluate(el=>getComputedStyle(el).animationName),'none');results.push('Reduced-motion preference disables the breathing rainbow animation');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'results.json',JSON.stringify({pass:true,results,hits,errors},null,2));console.log(JSON.stringify({pass:true,results,errors},null,2));
}catch(e){await page.screenshot({path:out+'failure.png'});await fs.writeFile(out+'results.json',JSON.stringify({pass:false,results,error:e.message,errors},null,2));console.error(e);process.exitCode=1;}finally{await browser.close();}
