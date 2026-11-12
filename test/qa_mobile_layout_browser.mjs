import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.GAME_SITE_URL||'http://127.0.0.1:5175/';
const out=process.env.GAME_SITE_OUTPUT||'output/playwright/mobile-fix/local/';await fs.mkdir(out,{recursive:true});
const browser=await (process.env.GAME_BROWSER==='webkit'?webkit:chromium).launch({headless:true,executablePath:process.env.GAME_BROWSER==='webkit'?process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
const results=[],errors=[];
const sizes=process.env.GAME_SIZES?JSON.parse(process.env.GAME_SIZES):[[320,568],[375,667],[390,844],[430,932],[568,320],[667,320],[844,390],[915,412],[1280,720]];
try{
 for(const [width,height]of sizes){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>!!window.gameInstance);assert.equal(await page.locator('#orientation-modal').isVisible(),false);
  const rects=await page.evaluate(()=>{
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};return{card:rect('.start-card'),start:rect('#btn-start-game'),demo:rect('#btn-demo-mode'),choices:rect('.start-choices'),overflow:document.documentElement.scrollWidth>innerWidth};
  });assert.equal(rects.overflow,false);for(const key of ['card','start','demo']){const r=rects[key];assert.ok(r.x>=0&&r.y>=0&&r.right<=width+1&&r.bottom<=height+1,`${width}x${height} ${key} clipped ${JSON.stringify(r)}`);}
  await page.screenshot({path:`${out}${width}x${height}-home.png`});
  await page.locator('[data-animal="dragon"]').scrollIntoViewIfNeeded();await page.locator('[data-animal="dragon"]').click();await page.locator('#btn-demo-mode').click();await page.waitForFunction(()=>gameInstance.rescueAnimal.assetStatus==='glb'&&gameInstance.bubbleManager.activeBubble?.spawnElapsed>.45);
  const hud=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};return{bar:rect(document.querySelector('.progress-dots-container')),sound:rect(document.querySelector('#btn-sound')),pause:rect(document.querySelector('#btn-pause')),canvas:rect(document.querySelector('canvas'))};});
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  assert.equal(overlap(hud.bar,hud.sound),false);assert.equal(overlap(hud.bar,hud.pause),false);assert.ok(hud.bar.left>=0&&hud.bar.right<=width+1);assert.ok(Math.abs(hud.canvas.bottom-height)<2);
  const state=await page.evaluate(()=>JSON.parse(render_game_to_text()));await page.mouse.move(state.bubble.x,state.bubble.y,{steps:2});await page.waitForFunction(()=>gameInstance.collectedCount===1);
  await page.screenshot({path:`${out}${width}x${height}-game.png`});
  await page.locator('#btn-pause').click();await page.locator('#btn-exit').scrollIntoViewIfNeeded();const exit=await page.locator('#btn-exit').boundingBox();assert.ok(exit.y>=0&&exit.y+exit.height<=height+1);await page.screenshot({path:`${out}${width}x${height}-pause.png`});await page.locator('#btn-resume').scrollIntoViewIfNeeded();await page.locator('#btn-resume').click();
  await page.setViewportSize({width:height,height:width});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>gameInstance.state),'PLAYING');assert.equal(await page.locator('#orientation-modal').isVisible(),false);
  await page.locator('#btn-pause').click();await page.locator('#btn-exit').click();
  // Calibration and victory are explicit UI fixtures: inspect scroll reachability without camera access.
  for(const id of ['calibration-screen','error-modal','victory-modal']){
   await page.setViewportSize({width,height});await page.evaluate(id=>{document.querySelector('#start-screen').classList.add('hidden');document.getElementById(id).classList.remove('hidden');},id);
   const card=await page.locator(`#${id} .card`).boundingBox();assert.ok(card.y>=0&&card.y+card.height<=height+1,`${id} ${width}x${height} clipped`);
   const button=page.locator(`#${id} button:visible`).last();await button.scrollIntoViewIfNeeded();const b=await button.boundingBox();assert.ok(b.y>=0&&b.y+b.height<=height+1,`${id} action unreachable`);
   await page.screenshot({path:`${out}${width}x${height}-${id}.png`});await page.evaluate(id=>document.getElementById(id).classList.add('hidden'),id);
  }
  results.push({width,height,pass:true});console.log(`${width}x${height} passed`);await page.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'results.json',JSON.stringify({pass:true,results,errors},null,2));console.log(JSON.stringify({pass:true,results,errors},null,2));
}catch(e){for(const p of browser.contexts().flatMap(c=>c.pages()))await p.screenshot({path:out+'failure.png'});console.error(e);await fs.writeFile(out+'results.json',JSON.stringify({pass:false,results,error:e.message,errors},null,2));process.exitCode=1;}finally{await browser.close();}
