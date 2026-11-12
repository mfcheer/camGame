import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=new URL('../output/playwright/v13-review/',import.meta.url).pathname;await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5175');await page.waitForFunction(()=>gameInstance?.rescueAnimal?.assetStatus==='glb');await page.locator('[data-animal="goldenDragon"]').click();await page.locator('#btn-demo-mode').click();
 await page.evaluate(()=>{const a=gameInstance.audioManager;window.audioNoteCount=0;const play=a._playBGMNote.bind(a);a._playBGMNote=(...args)=>{window.audioNoteCount++;return play(...args);};});
 await page.waitForFunction(()=>audioNoteCount>0);const before=await page.evaluate(()=>({notes:audioNoteCount,stage:gameInstance.sceneManager.stageId,bgm:gameInstance.audioManager.currentStageId,ctx:gameInstance.audioManager.ctx?.state,playing:gameInstance.audioManager.isBGMPlaying,timer:!!gameInstance.audioManager.bgmInterval,muted:gameInstance.audioManager.isMuted}));console.log(JSON.stringify({before}));assert.equal(before.stage,before.bgm);
 const hits=[];for(let i=0;i<3;i++){
  await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.42);
  const b=await page.evaluate(()=>JSON.parse(render_game_to_text()).bubble);await page.mouse.move(640,130);await page.mouse.move(b.x,b.y,{steps:2});await page.waitForFunction(n=>gameInstance.collectedCount===n,i+1);
  hits.push(await page.evaluate(()=>({count:gameInstance.collectedCount,combo:gameInstance.bubbleManager.comboCount,time:performance.now()})));
 }
 await page.screenshot({path:out+'01-live-feedback.png'});
 // Fixture only for inspecting each UI tier; the real hit timing is recorded separately.
 await page.evaluate(()=>{gameInstance.bubbleManager.comboCount=6;gameInstance.bubbleManager.lastPopTime=performance.now()+10000;gameInstance.uiManager.updateCombo(6);});await page.waitForTimeout(500);await page.screenshot({path:out+'02-combo-tier3-fixture.png'});await page.evaluate(()=>gameInstance.uiManager.hideCombo());
 await page.locator('#btn-sound').click();await page.locator('#btn-pause').click();await page.locator('#btn-exit').click();await page.locator('#btn-demo-mode').click();
 const mutedStart=await page.evaluate(()=>({muted:gameInstance.audioManager.isMuted,playing:gameInstance.audioManager.isBGMPlaying,hasTimer:!!gameInstance.audioManager.bgmInterval}));
 await page.locator('#btn-sound').click();const notesAtUnmute=await page.evaluate(()=>audioNoteCount);await page.waitForTimeout(900);
 const afterUnmute=await page.evaluate(()=>({muted:gameInstance.audioManager.isMuted,playing:gameInstance.audioManager.isBGMPlaying,hasTimer:!!gameInstance.audioManager.bgmInterval,newNotes:audioNoteCount}));afterUnmute.noteDelta=afterUnmute.newNotes-notesAtUnmute;
 const result={before,hits,mutedStart,afterUnmute,errors};await fs.writeFile(out+'results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
