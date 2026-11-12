import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage();page.on('console',m=>console.log(m.type(),m.text().slice(0,240)));page.on('requestfailed',r=>console.log('failed',r.url(),r.failure()));
try {
  await page.goto('http://127.0.0.1:5175/test/vision-harness.html');
  const result=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const worker=new Worker('/tracking-worker.js');let phase=0,frames=0;const timings=[];let imageBlob;const timer=setTimeout(()=>{worker.terminate();reject(Error('Worker timeout'));},90000);
    worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(Error(e.message));};
    worker.onmessage=async({data})=>{
      if(data.type==='status')console.log(data.step);
      if(data.type==='error'||data.type==='frame-error'){clearTimeout(timer);worker.terminate();reject(Error(data.message));}
      if(data.type==='ready'){
        const canvas=new OffscreenCanvas(640,360);canvas.getContext('2d').fillRect(0,0,640,360);
        const bitmap=canvas.transferToImageBitmap();worker.postMessage({type:'frame',bitmap,timestamp:performance.now(),session:7,mode:'single'},[bitmap]);
      }
      if(data.type==='result') {
        if(phase===0) {
          if(data.pose.landmarks.length||data.hands.landmarks.length){clearTimeout(timer);worker.terminate();reject(Error('blank image false positive'));return;}
          phase=1;imageBlob=await (await fetch('/output/playwright/v08/right_hands.jpg')).blob();
        } else {
          if(!data.hands.landmarks.length){clearTimeout(timer);worker.terminate();reject(Error('official hand sample was not detected'));return;}
          timings.push(data.inferenceMs);frames++;
          if(frames===8){clearTimeout(timer);worker.terminate();resolve({poseCount:0,handCount:data.hands.landmarks.length,pointsPerHand:data.hands.landmarks[0].length,tip:data.hands.landmarks[0][8],warmInferenceMs:timings,session:data.session});return;}
        }
        const bitmap=await createImageBitmap(imageBlob);worker.postMessage({type:'frame',bitmap,timestamp:performance.now(),session:7,mode:'single'},[bitmap]);
      }
    };
    worker.postMessage({type:'init'});
  }));
  assert.equal(result.poseCount,0);assert.ok(result.handCount>=1);assert.equal(result.pointsPerHand,21);assert.equal(result.session,7);
  await fs.writeFile('output/playwright/v08/worker-results.json',JSON.stringify({pass:true,...result},null,2));console.log(result);
}finally{await browser.close();}
