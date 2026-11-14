// 中英成对发音专项浏览器闭环验证（qa_v33）
// 验证：每轮锁定一张词卡；前两次自动发音一次英文一次中文（顺序随机）；
// 进度点为偶数（小兔 6）；胜利流程与 5 秒自动下一局不受影响。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import('playwright-core');
const out=new URL('../output/playwright/v33/',import.meta.url).pathname;
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.HOME+'/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--use-gl=angle','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({viewport:{width:1194,height:834},hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage(),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  await page.addInitScript(()=>{try{localStorage.setItem('camgame:autoEnglish:v1','true');}catch{}});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5199/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.gameInstance?.rescueAnimal&&(gameInstance.rescueAnimal.assetStatus==='glb'||gameInstance.rescueAnimal.assetStatus==='ready'),null,{timeout:20000});
  // 记录每一次 playWord 的语言与词
  await page.evaluate(()=>{window.speechLog=[];const a=gameInstance.audioManager,original=a.playWord.bind(a);a.playWord=(id,options={})=>{speechLog.push({id:String(id),lang:options.lang||'en',review:!!options.review});return original(id,options);};});
  // 中文音频可访问
  const zhStatus=await page.evaluate(async()=>{const w=gameInstance.bubbleManager.chooseRoundWord();const r=await fetch(`audio/words/zh/${w.id}.mp3`);return r.status;});
  assert.equal(zhStatus,200,'中文单词音频应可访问');
  // 进入游戏（演示模式，兔 6 能量）
  await page.locator('#btn-demo-mode').tap();
  await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.4,null,{timeout:15000});
  const roundWord=await page.evaluate(()=>gameInstance.bubbleManager.roundWord?.id);
  assert.ok(roundWord,'每轮应锁定词卡');
  const dots=await page.evaluate(()=>document.querySelectorAll('.progress-dot').length);
  assert.equal(dots,6,'小兔进度点应为 6（偶数起步）');
  // 逐个碰破直到两次自动发音完成（等待成对间隔 2.5s）
  const pop=async()=>{await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.4,null,{timeout:15000});const s=await page.evaluate(()=>{const b=gameInstance.bubbleManager.activeBubble,c=gameInstance.sceneManager.camera,scr=v=>{const p=b.group.position.clone().project(c);return {x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight};};return scr();});await page.touchscreen.tap(s.x,s.y);await page.waitForFunction(()=>gameInstance.collectedCount>(gameInstance.bubbleManager.completedBubbleCount-1)||true);};
  const waitForSecondSpeech=async()=>{
    for(let i=0;i<30;i++){
      if(await page.evaluate(()=>window.speechLog.length>=2))return;
      if(await page.evaluate(()=>gameInstance.speechPolicy.activeSeconds-(gameInstance.speechPolicy.lastSpeechEnd===-Infinity?-1e9:gameInstance.speechPolicy.lastSpeechEnd)>=2.6||window.speechLog.length===0)){await pop();await page.waitForTimeout(300);continue;}
      await page.waitForTimeout(250);
    }
  };
  await waitForSecondSpeech();
  const log=await page.evaluate(()=>window.speechLog);
  assert.equal(log.length,2,`应有两次自动发音，实际 ${log.length}：${JSON.stringify(log)}`);
  assert.equal(log[0].id,roundWord);assert.equal(log[1].id,roundWord,'两次发音应为同一张词卡');
  assert.equal(log[0].lang!==log[1].lang,true,'两次发音应一英一中');
  assert.ok(log.every(l=>['en','zh'].includes(l.lang)));
  const spoken=await page.evaluate(()=>gameInstance.speechPolicy.spokenThisRound);
  assert.equal(spoken,2,'本轮自动发音预算应为 2');
  await page.screenshot({path:out+'pair-speech.png'});
  // 词卡一致性：继续打完，泡泡词均等于 roundWord
  let mismatch=0;
  while(await page.evaluate(()=>gameInstance.state==='PLAYING'&&gameInstance.collectedCount<gameInstance.targetCount)){
    const w=await page.evaluate(()=>gameInstance.bubbleManager.activeBubble?.word?.id);
    if(w&&w!==roundWord)mismatch++;
    await pop();
    await page.waitForTimeout(150);
  }
  await page.waitForFunction(()=>gameInstance.state!=='PLAYING',null,{timeout:20000});
  assert.equal(mismatch,0,'本轮所有泡泡都应携带同一张词卡');
  await page.screenshot({path:out+'victory.png'});
  results.push({pairSpeech:true,langs:[log[0].lang,log[1].lang],word:roundWord,progressDots:dots,evenTargets:true,zhAudioStatus:zhStatus});
  assert.deepEqual(errors,[]);
  await fs.writeFile(out+'results.json',JSON.stringify({pass:true,results,errors},null,2));
  console.log(JSON.stringify({pass:true,results,errors},null,2));
}catch(e){
  await page.screenshot({path:out+'failure.png'}).catch(()=>{});
  const state=await page.evaluate(()=>({state:gameInstance?.state,speechLog:window.speechLog,roundWord:gameInstance?.bubbleManager?.roundWord?.id,collected:gameInstance?.collectedCount})).catch(()=>null);
  await fs.writeFile(out+'results.json',JSON.stringify({pass:false,error:e.stack,errors,state},null,2));
  console.error(e.message,state);process.exitCode=1;
}finally{await browser.close();}
