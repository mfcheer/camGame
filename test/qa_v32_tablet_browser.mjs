import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=new URL('../output/playwright/v32/ipad/',import.meta.url).pathname;await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1194,height:834},hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage(),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(()=>JSON.parse(render_game_to_text()));
async function pop(){await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5);const s=await read();await page.touchscreen.tap(s.bubble.x,s.bubble.y);await page.waitForFunction(n=>gameInstance.collectedCount>n,s.score);}
const diameter=()=>page.evaluate(()=>{const b=gameInstance.bubbleManager.activeBubble,c=gameInstance.sceneManager.camera;return b.baseRadius*2*innerHeight/(2*Math.tan(c.fov*Math.PI/360)*Math.abs(c.position.z));});
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5177');await page.waitForFunction(()=>window.gameInstance?.rescueAnimal.assetStatus==='glb');
 await page.evaluate(()=>{window.voiceStarts=0;const a=gameInstance.audioManager,original=a.playWord.bind(a);a.playWord=(...args)=>{voiceStarts++;return original(...args);};});
 await page.screenshot({path:out+'home-landscape.png'});await page.locator('#btn-demo-mode').tap();
 await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5);const landscape=await diameter();assert.ok(landscape>220);await page.screenshot({path:out+'large-bubble-landscape.png'});
 await pop();await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5);const count=(await read()).score;
 await page.setViewportSize({width:834,height:1194});await page.waitForTimeout(220);assert.equal((await read()).score,count);assert.equal((await read()).mode,'PLAYING');
 const portrait=await diameter();assert.ok(Math.abs(landscape-portrait)<1);await page.screenshot({path:out+'large-bubble-portrait.png'});
 while((await read()).mode==='PLAYING')await pop();await page.locator('#btn-friend-done').tap();await page.locator('#victory-modal').waitFor({state:'visible',timeout:18000});
 assert.equal(await page.evaluate(()=>voiceStarts),0);await page.screenshot({path:out+'rescue-result.png'});results.push({touchRescue:'passed',rotationKeepsScore:true,landscapeBaseDiameter:landscape,portraitBaseDiameter:portrait,noAutomaticVoice:true});
 await page.locator('#btn-victory-exit').tap();
 // The bigger geometric target must also leave all controls and the animal stage usable.
 for(const animal of ['cat','frog','dog','dragon','goldenDragon']){
  await page.locator(`[data-animal="${animal}"]`).tap();await page.locator('#btn-demo-mode').tap();await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5);
  for(const size of [{width:1194,height:834},{width:834,height:1194}]){
   await page.setViewportSize(size);await page.waitForTimeout(550);const s=await read(),d=await diameter();assert.ok(d>205,`${animal} ${size.width}x${size.height}: diameter=${d}`);assert.ok(s.bubble.x-d/2>0&&s.bubble.x+d/2<size.width);assert.ok(s.bubble.y-d/2>85&&s.bubble.y+d/2<size.height*.9);
   await page.screenshot({path:out+`${animal}-${size.width}x${size.height}.png`});
  }
  await pop();await page.locator('#btn-last-word').tap();await page.screenshot({path:out+`${animal}-manual-word.png`});await page.locator('.word-focus-done').tap();
  await page.locator('#btn-pause').tap();await page.locator('#btn-exit').tap();
 }
 await page.locator('[data-animal="bunny"]').tap();await page.locator('#btn-demo-mode').tap();
 for(const type of ['jelly','rainbow','coop_heart']){
  await page.evaluate(type=>{const g=gameInstance;g.handleRestart();g.bubbleManager.clear();g.bubbleManager.createBubble(2,type,'ball');},type);
  await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5);
  const before=(await read()).score;await pop();const after=await read();assert.ok(after.score>before);assert.equal(await page.evaluate(()=>gameInstance.bubbleManager.completedBubbleCount),1);
  await page.screenshot({path:out+`one-touch-${type}.png`,scale:'css'});
 }
 results.push({oneTouchSpecials:'jelly, rainbow and decorative hearts pop on the first real touch event'});
 assert.deepEqual(errors,[]);await fs.writeFile(out+'results.json',JSON.stringify({pass:true,results,allSixAnimalsBothOrientations:true,errors},null,2));console.log(JSON.stringify({pass:true,results,allSixAnimalsBothOrientations:true,errors},null,2));
}catch(e){await page.screenshot({path:out+'failure.png'});console.error(e);await fs.writeFile(out+'results.json',JSON.stringify({pass:false,error:e.stack,errors,state:await read()},null,2));process.exitCode=1;}
finally{await browser.close();}
