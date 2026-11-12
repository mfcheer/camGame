import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}});const out='output/playwright/v09/';const results=[];
try {
 await page.goto('http://127.0.0.1:5175');await page.locator('[data-animal="cat"]').click();await page.locator('#btn-demo-mode').click();await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble);
 // Controlled local video replaces the camera with a white/black room test card.
 await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,640,720);c.fillStyle='#111';c.fillRect(640,0,640,720);
  const video=document.querySelector('video');video.srcObject=canvas.captureStream(10);await video.play();
 });
 await page.mouse.move(280,160);await page.waitForFunction(()=>gameInstance.bubbleManager.handIndicators[0].contrastMode==='light');await page.waitForTimeout(400);await page.screenshot({path:out+'12-dark-background-tip.png'});
 await page.mouse.move(1000,160);await page.waitForFunction(()=>gameInstance.bubbleManager.handIndicators[0].contrastMode==='ink');await page.waitForTimeout(400);await page.screenshot({path:out+'13-light-background-tip.png'});results.push('Real video-pixel sampling changes the local fingertip colour on black and white regions');
 await page.evaluate(()=>{const v=document.querySelector('video');v.srcObject.getTracks().forEach(t=>t.stop());v.srcObject=null;const g=gameInstance;g.bubbleManager.activeBubble.relocateAfterMs=50;g.bubbleManager.idleTimer=100;g.bubbleManager.isNearHand=false;});
 const before=await page.evaluate(()=>gameInstance.bubbleManager.activeBubble.group.uuid);
 await page.waitForFunction(uuid=>gameInstance.bubbleManager.activeBubble.group.uuid!==uuid,before);
 assert.equal(await page.evaluate(()=>gameInstance.collectedCount),0);results.push('An idle bubble refreshes without changing progress');
 // Completion fixture isolates the actual result controls and head-anchored prop renderer.
 await page.evaluate(()=>{const g=gameInstance;g.bubbleManager.clear();g.state='CELEBRATING';g.rescueAnimal.state='ESCAPED';g.rescueAnimal.animalGroup.visible=false;g.resultVisible=false;g.celebrationAccessories.start([{id:1,face:{x:.5,y:.25,width:.16,roll:.1}}],true,()=>0);g.showVictoryWhenReady();});
 await page.locator('#victory-modal').waitFor({state:'visible'});await page.waitForFunction(()=>gameInstance.celebrationAccessories.slots[0].prop.visible);
 await page.locator('#btn-stop-auto-next').click();await page.waitForTimeout(5500);assert.equal(await page.evaluate(()=>gameInstance.state),'CELEBRATING');assert.equal(await page.locator('#btn-stop-auto-next').isHidden(),true);await page.screenshot({path:out+'14-reward-and-stopped-countdown.png'});results.push('A visible head reward remains while the stop control cancels automatic replay');
 await fs.writeFile(out+'interaction-results.json',JSON.stringify({pass:true,scope:'synthetic local video and completion fixture; not a real camera accuracy test',results},null,2));console.log(results);
}finally{await browser.close();}
