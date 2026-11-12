import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=new URL('../output/playwright/v12/stages/',import.meta.url).pathname;await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const read=()=>page.evaluate(()=>JSON.parse(render_game_to_text()));const results=[];
try{
 await page.goto('http://127.0.0.1:5175');await page.waitForFunction(()=>gameInstance?.rescueAnimal?.assetStatus==='glb');
 await page.locator('[data-animal="goldenDragon"]').click();await page.locator('#btn-demo-mode').click();await page.waitForFunction(()=>gameInstance.rescueAnimal.assetStatus==='glb');
 const started=await read();assert.equal(started.animalId,'goldenDragon');assert.equal(started.target,9);assert.ok(started.stage);await page.locator('#btn-pause').click();await page.waitForTimeout(250);assert.equal((await read()).stage,started.stage);await page.locator('#btn-resume').click();assert.equal((await read()).stage,started.stage);results.push('Start chooses a stage; pause and resume retain it');
 await page.locator('#btn-pause').click();await page.locator('#btn-restart').click();const restarted=await read();assert.equal(restarted.animalId,'goldenDragon');assert.notEqual(restarted.stage,started.stage);results.push('Restart retains golden dragon and rerolls scenery');
 for(const id of ['forest','brook','orchard','bamboo','cloud']){
  await page.evaluate(id=>gameInstance.sceneManager.setStage(id),id);await page.waitForTimeout(180);assert.equal((await read()).stage,id);
  await page.screenshot({path:out+id+'.png'});
 }
 results.push('All five stage designs render in the actual game');
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:out+'golden-landscape.png'});assert.equal(await page.locator('.progress-dot').count(),9);
 await page.locator('#btn-pause').click();await page.locator('#btn-exit').click();await page.setViewportSize({width:1280,height:720});await page.locator('[data-animal="dragon"]').click();await page.locator('#btn-demo-mode').click();await page.waitForFunction(()=>gameInstance.rescueAnimal.assetStatus==='glb');
 const flying=await read();assert.equal(flying.animalId,'dragon');assert.equal(flying.target,12);assert.ok(await page.evaluate(()=>!!gameInstance.rescueAnimal.model.getObjectByName('Wing_L')));await page.screenshot({path:out+'flying-dragon-preserved.png'});results.push('Original flying dragon retains its own GLB, wings and 12 bubble goal');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'results.json',JSON.stringify({pass:true,results,errors},null,2));console.log(JSON.stringify({pass:true,results,errors},null,2));
}catch(e){await page.screenshot({path:out+'failure.png'});console.error(e);process.exitCode=1;}finally{await browser.close();}
