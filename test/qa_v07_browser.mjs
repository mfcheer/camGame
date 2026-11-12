import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const targets={bunny:5,cat:8,frog:6,dog:10,dragon:12,goldenDragon:9};
const animalId=process.env.GAME_ANIMAL||'bunny',target=targets[animalId];
const out=process.env.GAME_OUTPUT || new URL('../output/playwright/v07/',import.meta.url).pathname;
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,recordVideo:{dir:out+'video',size:{width:1280,height:720}}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const read=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const results=[];
const capture=async name=>page.screenshot({path:out+name+'.png'});
try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5175');
  await page.waitForFunction(()=>window.gameInstance?.rescueAnimal?.assetStatus==='glb');
  await page.locator(`[data-animal="${animalId}"]`).click();
  await capture('00-animal-picker');
  await page.locator('#btn-demo-mode').click();
  await page.waitForFunction(()=>window.gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5);
  await capture('01-ready');
  assert.equal((await read()).animal.asset,'glb');assert.equal((await read()).target,target);assert.equal(await page.locator('.progress-dot').count(),target);const initialStage=(await read()).stage;assert.ok(initialStage);results.push('GLB loads and game starts');
  // Pause freezes both actor and scene active-time clocks.
  await page.locator('#btn-pause').click();
  const frozen=await page.evaluate(()=>({animal:gameInstance.rescueAnimal.idleTime,scene:gameInstance.sceneManager.elapsed}));
  await page.waitForTimeout(350);
  assert.deepEqual(await page.evaluate(()=>({animal:gameInstance.rescueAnimal.idleTime,scene:gameInstance.sceneManager.elapsed})),frozen);
  await page.locator('#btn-resume').click();results.push('Pause/resume freezes scene and character');
  for(let n=1;n<=target;n++) {
    await page.waitForFunction(()=>window.gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5);
    const before=await read();
    await page.mouse.move(640,125);await page.mouse.move(before.bubble.x,before.bubble.y,{steps:5});
    await page.waitForFunction(n=>window.gameInstance.collectedCount===n,n);
    const afterHit=await read();
    assert.equal(afterHit.animal.energy,n-1,'energy must wait for arrival');
    if(n===target) {
      // Last flight is paused before arrival: no early rescue during the pause.
      await page.locator('#btn-pause').click();const flight=await read();await page.waitForTimeout(450);
      assert.equal((await read()).animal.energy,flight.animal.energy);
      await capture('03-final-flight-paused');await page.locator('#btn-resume').click();
    }
    await page.waitForFunction(n=>window.gameInstance.rescueAnimal.energyLevel===n,n);
    if(n===2)await capture('02-two-energy');
  }
  results.push(`${target} real pointer hits; every energy arrives before response; final flight pauses safely`);
  await page.waitForFunction(()=>window.gameInstance.rescueAnimal.state==='ESCAPING');
  await page.waitForTimeout(850);await capture('04-animal-escape');
  await page.waitForFunction(()=>window.gameInstance.rescueAnimal.state==='WAVING' && window.gameInstance.rescueAnimal.escapeElapsed>3.43);
  assert.equal(await page.locator('#victory-modal').isVisible(),false,'victory cannot cover the goodbye');
  await capture('05-goodbye');
  await page.waitForFunction(()=>window.gameInstance.rescueAnimal.state==='ESCAPED');
  assert.equal((await read()).animal.visible,false);
  await page.locator('#victory-modal').waitFor({state:'visible'});await capture('06-victory');
  results.push(`${animalId} crosses visible path, waves at gate, fades, then victory appears`);
  if(process.env.TEST_AUTO_NEXT==='1') {
    await page.waitForFunction(()=>window.gameInstance.state==='PLAYING'&&window.gameInstance.collectedCount===0,{},{timeout:10000});
    const next=await read();assert.equal(next.target,targets[next.animalId]);assert.notEqual(next.stage,initialStage,'automatic next round rerolls the stage');results.push('Five-second automatic random next round starts without input');await capture('09-auto-next');
  }else await page.locator('#btn-play-again').click();
  await page.waitForFunction(()=>window.gameInstance.bubbleManager.activeBubble);
  const reset=await read();assert.equal(reset.score,0);assert.equal(reset.animal.energy,0);assert.equal(reset.animal.visible,true);assert.equal(reset.animal.state,'TRAPPED');
  results.push('Replay resets score, character, ropes and opacity');
  // Resize during a live run, including the fixed-landscape orientation pause.
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(150);await capture('07-mobile-landscape');
  const smallState=await read();
  assert.ok(smallState.animal.x>0 && smallState.animal.x<844);
  assert.ok(smallState.bubble.y>130,'small landscape bubble clears HUD');
  await page.setViewportSize({width:390,height:844});await page.locator('#orientation-modal').waitFor({state:'visible'});
  assert.equal((await read()).mode,'PAUSED');await capture('08-portrait-paused');
  await page.setViewportSize({width:1280,height:720});await page.waitForFunction(()=>window.gameInstance.state==='PLAYING');
  results.push('844×390 landscape and portrait pause/resume');
  await page.locator('#btn-sound').click();assert.equal(await page.evaluate(()=>gameInstance.audioManager.isMuted),true);
  await page.locator('#btn-sound').click();assert.equal(await page.evaluate(()=>gameInstance.audioManager.isMuted),false);
  await page.locator('#btn-pause').click();await page.locator('#btn-exit').click();
  assert.equal((await read()).mode,'START');
  await page.locator('[data-animal="random"]').click();
  await page.locator('#btn-demo-mode').click();
  const surprise=await read();assert.ok(Object.hasOwn(targets,surprise.animalId));assert.equal(surprise.target,targets[surprise.animalId]);
  await page.locator('#btn-pause').click();await page.locator('#btn-restart').click();assert.equal((await read()).animalId,surprise.animalId);
  await page.locator('#btn-pause').click();await page.locator('#btn-exit').click();results.push('Random picks a playable animal at start; restart keeps it');
  await page.locator('#btn-mode-coop').click();await page.locator('#btn-demo-mode').click();
  assert.equal(await page.evaluate(()=>gameInstance.playerMode),'coop');
  await page.locator('#btn-pause').click();await page.locator('#btn-restart').click();
  assert.equal((await read()).score,0);results.push('Sound, exit, cooperative selection and restart');
  assert.deepEqual(errors,[]);
  await fs.writeFile(out+'results.json',JSON.stringify({pass:true,results,errors},null,2));
  console.log(JSON.stringify({pass:true,results,errors},null,2));
} catch(e) {
  await capture('failure');console.error(e);
  await fs.writeFile(out+'results.json',JSON.stringify({pass:false,results,error:e.message,errors},null,2));process.exitCode=1;
} finally {
  const videoPath=await page.video()?.path();
  await context.close();
  if(videoPath)await fs.copyFile(videoPath,out+'playthrough.webm');
  await browser.close();
}
