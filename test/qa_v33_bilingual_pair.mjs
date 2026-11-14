// Real-browser regression: rotating images and complete, nonblocking bilingual pairs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import('playwright-core');
const out=new URL('../output/playwright/v35/browser/',import.meta.url).pathname;await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.HOME+'/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--use-gl=angle','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({viewport:{width:1194,height:834},hasTouch:true,deviceScaleFactor:1});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(()=>{localStorage.setItem('camgame:autoEnglish:v1','true');localStorage.removeItem('camgame.muted');});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5199/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.gameInstance?.rescueAnimal?.assetStatus==='glb',null,{timeout:20000});
 await page.evaluate(()=>{window.speechLog=[];const a=gameInstance.audioManager,original=a.playWord.bind(a);a.playWord=(id,options={})=>{if(!options.phrase)speechLog.push({id:String(id),lang:options.lang||'en'});return original(id,options);};});
 await page.locator('#btn-demo-mode').tap();
 const pop=async()=>{await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5,null,{timeout:15000});await page.touchscreen.tap(25,150);await page.waitForTimeout(100);const state=await page.evaluate(()=>({word:gameInstance.bubbleManager.activeBubble.word.id,score:gameInstance.collectedCount,point:JSON.parse(render_game_to_text()).bubble}));await page.touchscreen.tap(state.point.x,state.point.y);await page.waitForFunction(score=>gameInstance.collectedCount>score,state.score,{timeout:5000});return state.word;};
 const first=await pop();await page.waitForFunction(()=>speechLog.length>=1);assert.deepEqual((await page.evaluate(()=>speechLog))[0],{id:first,lang:'zh'});
 await page.waitForFunction(()=>speechLog.length>=2,null,{timeout:16000});let log=await page.evaluate(()=>speechLog);assert.deepEqual(log.slice(0,2),[{id:first,lang:'zh'},{id:first,lang:'en'}]);
 await page.waitForFunction(()=>!gameInstance.voiceQueue.current,null,{timeout:16000});await page.screenshot({path:out+'first-pair.png'});
 const second=await pop();assert.notEqual(second,first);await page.waitForTimeout(150);
 const third=await pop();assert.notEqual(third,second);assert.notEqual(third,first);assert.equal(await page.evaluate(()=>speechLog.length),2,'busy/cooldown pops must not queue old words');
 await page.waitForFunction(()=>gameInstance.speechPolicy.activeSeconds-gameInstance.speechPolicy.lastSpeechEnd>=4,null,{timeout:16000});
 const fourth=await pop();assert.notEqual(fourth,third);await page.waitForFunction(()=>speechLog.length>=4,null,{timeout:16000});log=await page.evaluate(()=>speechLog);assert.deepEqual(log.slice(2,4),[{id:fourth,lang:'zh'},{id:fourth,lang:'en'}]);
 assert.equal(await page.evaluate(()=>gameInstance.speechPolicy.spokenThisRound),2);await page.screenshot({path:out+'second-pair.png'});
 assert.deepEqual(errors,[]);await fs.writeFile(out+'results.json',JSON.stringify({pass:true,words:[first,second,third,fourth],speech:log,errors},null,2));console.log('PASS',JSON.stringify({words:[first,second,third,fourth],speech:log}));
}catch(e){await page.screenshot({path:out+'failure.png'}).catch(()=>{});console.error(e);process.exitCode=1;}finally{await browser.close();}
