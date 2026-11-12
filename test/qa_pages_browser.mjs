import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.GAME_SITE_URL||'http://127.0.0.1:4175/camGame/';
const out=process.env.GAME_SITE_OUTPUT||'output/playwright/pages-local/';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:process.env.GAME_SOFTWARE_RENDER==='1'?['--use-gl=angle','--use-angle=swiftshader']:[]});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],bad=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()});});page.on('request',r=>requests.push(r.url()));
try{
 await page.goto(url);await page.waitForFunction(()=>gameInstance?.rescueAnimal?.assetStatus==='glb');
 assert.equal(await page.locator('.animal-choice:not(.random-choice)').count(),6);
 const base=new URL(url);const imageUrls=await page.locator('.animal-choice img,.app-logo').evaluateAll(els=>els.map(e=>({src:e.src,loaded:e.complete&&e.naturalWidth>0})));assert.ok(imageUrls.every(e=>e.loaded));assert.ok(imageUrls.every(e=>new URL(e.src).pathname.startsWith(base.pathname)));
 await page.screenshot({path:out+'01-home.png'});
 const metadata=await page.evaluate(async()=>{
  const manifestUrl=document.querySelector('link[rel="manifest"]').href,manifest=await(await fetch(manifestUrl)).json();
  const icons=await Promise.all(manifest.icons.map(async icon=>({url:new URL(icon.src,manifestUrl).href,status:(await fetch(new URL(icon.src,manifestUrl))).status})));
  return {manifestUrl,manifest,icons,secure:window.isSecureContext};
 });assert.ok(metadata.icons.every(i=>i.status===200));assert.equal(metadata.manifest.start_url,'./');assert.ok(metadata.secure);
 for(const id of ['cat','frog','dog','dragon','goldenDragon','bunny']){await page.locator(`[data-animal="${id}"]`).click();await page.waitForFunction(id=>gameInstance.rescueAnimal.animalId===id&&gameInstance.rescueAnimal.assetStatus==='glb',id);}
 // Loads real app Worker + WASM + both local inference models; no camera permission requested.
 const tracking=await page.evaluate(async()=>({ready:await gameInstance.poseDetector.init(),metrics:gameInstance.poseDetector.metrics}));assert.equal(tracking.ready,true);assert.match(tracking.metrics.backend,/worker/);
 await page.locator('#btn-demo-mode').click();await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.45);
 const before=await page.evaluate(()=>JSON.parse(render_game_to_text()));await page.mouse.move(before.bubble.x,before.bubble.y,{steps:3});await page.waitForFunction(()=>gameInstance.collectedCount===1);await page.locator('#btn-pause').click();assert.equal(await page.evaluate(()=>gameInstance.state),'PAUSED');await page.locator('#btn-resume').click();await page.screenshot({path:out+'02-game.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 const assetRequests=requests.filter(u=>/\.glb|\.task|\.wasm|tracking-worker|vision_bundle/.test(u));assert.ok(assetRequests.length>=10);assert.ok(assetRequests.every(u=>new URL(u).pathname.startsWith(base.pathname)));
 const result={pass:true,url,tracking,metadata,imageCount:imageUrls.length,assetRequests,errors,bad};await fs.writeFile(out+'results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:true,url,backend:tracking.metrics.backend,assetRequests:assetRequests.length,errors,bad},null,2));
}catch(e){await page.screenshot({path:out+'failure.png'});console.error(e);await fs.writeFile(out+'results.json',JSON.stringify({pass:false,error:e.message,errors,bad},null,2));process.exitCode=1;}finally{await browser.close();}
