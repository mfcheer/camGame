import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const out='output/playwright/v08/';
try {
 await page.goto('http://127.0.0.1:5175');await page.locator('#btn-demo-mode').click();
 await page.waitForFunction(()=>window.gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5);
 // Synthetic landmark replay verifies the UI integration; this is not a camera accuracy test.
 const before=await page.evaluate(()=>{
  const g=gameInstance,b=g.bubbleManager,a=b.activeBubble;
  const vh=2*Math.tan(g.sceneManager.camera.fov/2*Math.PI/180)*7.5,vw=vh*g.sceneManager.camera.aspect;
  a.basePos.set(vw*.30,0,0);a.group.position.copy(a.basePos);a.spawnElapsed=1;b.idleTimer=1300;
  g.poseDetector.useDedicatedHands=true;return a.basePos.x;
 });
 await page.screenshot({path:out+'10-edge-before.png'});
 await page.evaluate(async()=>{
  const p=gameInstance.poseDetector;
  const body=Array.from({length:33},()=>({x:.5,y:.4,visibility:.95}));body[11].x=.4;body[12].x=.6;
  body[15]={x:.7,y:.5,visibility:.9};body[16]={x:.3,y:.5,visibility:.9};
  for(let i=0;i<35;i++){p.processLandmarks({landmarks:[body]},{landmarks:[]},performance.now());await new Promise(r=>setTimeout(r,33));}
 });
 await page.waitForFunction(x=>window.gameInstance.bubbleManager.activeBubble?.basePos.x<x-.4,before);
 assert.equal(await page.evaluate(()=>gameInstance.collectedCount),0,'inward assistance cannot score');
 await page.screenshot({path:out+'11-edge-assisted.png'});
 const after=await page.evaluate(()=>gameInstance.bubbleManager.activeBubble.basePos.x);
 await page.evaluate(()=>{
  const g=gameInstance,p=g.poseDetector,center=g.bubbleManager.activeBubble.group.position.clone().project(g.sceneManager.camera);
  const x=(center.x+1)/2,y=(1-center.y)/2;
  const body=Array.from({length:33},()=>({x:.5,y:.4,visibility:.95}));body[11].x=.4;body[12].x=.6;
  body[15]={x:.7,y:.5,visibility:.95};body[16]={x:1-x,y:y+.12,visibility:.95};
  body[19]={x:.01,y:.95,visibility:.95};body[20]={x:.99,y:.95,visibility:.95};
  const hand=Array.from({length:21},()=>({x:1-x,y:y+.1,z:0}));hand[0]={x:1-x,y:y+.12};hand[8]={x:1-x,y};hand[5]={x:1-x-.03,y:y+.05};hand[17]={x:1-x+.03,y:y+.05};
  p.processLandmarks({landmarks:[body]},{landmarks:[hand]},performance.now());
 });
 await page.waitForFunction(()=>window.gameInstance.collectedCount===1);
 await page.waitForFunction(()=>window.gameInstance.rescueAnimal.energyLevel===1);
 assert.deepEqual(errors,[]);
 const result={pass:true,scope:'synthetic landmark replay through actual UI, not real camera',beforeX:before,afterX:after,score:1,errors};
 await fs.writeFile(out+'edge-results.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close();}
