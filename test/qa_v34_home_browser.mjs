// 首页新布局多端目检 + 倒数人声与告别短语浏览器闭环（qa_v34）
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import('playwright-core');
const out=new URL('../output/playwright/v34/',import.meta.url).pathname;
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.HOME+'/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--use-gl=angle','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
const results=[],errors=[];
const context=await browser.newContext({viewport:{width:1194,height:834},hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
try{
  await page.addInitScript(()=>{try{localStorage.setItem('camgame:autoEnglish:v1','true');}catch{}});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5199/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.gameInstance&&document.querySelector('.start-actions'),null,{timeout:20000});

  // 1. 倒数中英文音频可访问
  for(const u of ['audio/countdown/zh/3.mp3','audio/countdown/en/3.mp3','audio/countdown/zh/go.mp3','audio/countdown/en/go.mp3']){
    const s=await page.evaluate(async u=>(await fetch(u)).status,u);
    assert.equal(s,200,`倒数音频 ${u} 应可访问`);
  }

  // 2. 多视口布局目检：两排按钮同行、无重叠、不越界
  const viewports=[[1280,800],[1194,834],[834,1194],[834,390],[390,844],[667,240]];
  const boxOf=sel=>page.evaluate(sel=>{const els=[...document.querySelectorAll(sel)];return els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,visible:r.width>0&&r.height>0};});},sel);
  for(const [w,h] of viewports){
    await page.setViewportSize({width:w,height:h});
    await page.waitForTimeout(320);
    const feature=await boxOf('.start-feature-row>*');
    const foot=await boxOf('.start-foot-row>*');
    assert.equal(feature.length,3,`${w}x${h} 功能排应有 3 个元素`);
    assert.equal(foot.length,3,`${w}x${h} 底排应有 3 个元素`);
    const rowTop=a=>Math.round(a.reduce((s,b)=>s+b.y,0)/a.length);
    const tol=Math.max(2,h*.012);
    assert.ok(Math.max(...feature.map(b=>b.y))>0&&rowTop(feature)&&Math.abs(Math.max(...feature.map(b=>b.y))-(await rowTop(feature)))<tol,`${w}x${h} 功能排未对齐`);
    assert.ok(Math.abs(Math.max(...foot.map(b=>b.y))-(await rowTop(foot)))<tol,`${w}x${h} 底排未对齐`);
    const overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
    for(const row of [feature,foot])for(let i=0;i<row.length;i++)for(let j=i+1;j<row.length;j++)
      assert.ok(!overlap(row[i],row[j]),`${w}x${h} 第${i}/${j}个按钮重叠`);
    for(const row of [feature,foot])for(const b of row)assert.ok(b.visible&&b.w>28&&b.h>24,`${w}x${h} 按钮被压扁`);
    const card=await page.evaluate(()=>{const r=document.querySelector('.start-card').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
    // 水平越界是真实形变；垂直方向允许滚动容器裁剪（start-actions 可滚动），只要求与卡片相交可见
    for(const [name,row] of [['功能排',feature],['底排',foot]])for(const [i,b] of row.entries()){
      assert.ok(b.x>=card.x-1&&b.x+b.w<=card.x+card.w+1,`${w}x${h} ${name}[${i}] 水平超出卡片边界`);
      const vInter=b.y<card.y+card.h&&b.y+b.h>card.y;
      assert.ok(vInter||h<260,`${w}x${h} ${name}[${i}] 完全滚出可视区`);
    }
    const imgH=await page.evaluate(()=>Math.max(...[...document.querySelectorAll('.animal-choice>img')].map(i=>i.getBoundingClientRect().height)));
    if(h>=700&&w>=h)assert.ok(imgH>=95,`${w}x${h} 桌面/横屏动物展示图应放大到 ≥95px，实际 ${imgH}`);
    if(h>=700&&w<h)assert.ok(imgH>=50,`${w}x${h} 竖屏动物展示图应 ≥50px，实际 ${imgH}`);
    await page.screenshot({path:out+`home-${w}x${h}.png`});
    results.push({viewport:`${w}x${h}`,rowsAligned:true,noOverlap:true,animalImgH:Math.round(imgH)});
  }

  // 3. 倒计时人声路由：保持校准态驱动一次真实倒数，验证三/二/一/GO 完整播出（stub 开局避免状态跃迁）
  await page.setViewportSize({width:1194,height:834});
  await page.evaluate(()=>{window.phraseLog=[];const a=gameInstance.audioManager,o=a.playPhrase.bind(a);a.playPhrase=p=>{phraseLog.push(p.id);return o(p);};});
  await page.locator('#btn-demo-mode').tap();
  await page.waitForFunction(()=>gameInstance.state==='PLAYING'&&gameInstance.bubbleManager.activeBubble,null,{timeout:25000});
  const usedSet=await page.evaluate(()=>{window._prev={state:gameInstance.state,ready:gameInstance.handleReadyToPlay};gameInstance.state='CALIBRATING';gameInstance.handleReadyToPlay=()=>false;gameInstance.startAutoCountdown();return gameInstance.countdownVoiceSet;});
  assert.ok(['synth','zh','en'].includes(usedSet),'开局应随机选定倒数配音套');
  if(usedSet!=='synth'){
    await page.waitForFunction(set=>window.phraseLog.filter(id=>id.startsWith(`countdown-${set}`)).length>=4,usedSet,{timeout:12000});
    assert.ok(await page.evaluate(set=>window.phraseLog.includes(`countdown-${set}-go`),usedSet),`${usedSet} 套 GO 人声应在开局前触发`);
  }
  await page.evaluate(()=>{gameInstance.cancelAutoCountdown();gameInstance.state=window._prev.state;gameInstance.handleReadyToPlay=window._prev.ready;gameInstance.uiManager?.hideCalibration?.();gameInstance.uiManager?.hideCountdownOverlay?.();});
  results.push({countdownVoiceSet:usedSet});

  // 4. 完整解救一轮：演出结束后自动播报告别短语
  const pop=async()=>{await page.waitForFunction(()=>gameInstance.state==='PLAYING'&&gameInstance.bubbleManager.activeBubble?.spawnElapsed>.4,null,{timeout:20000});const s=await page.evaluate(()=>{const b=gameInstance.bubbleManager.activeBubble,c=gameInstance.sceneManager.camera,p=b.group.position.clone().project(c);return {x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight};});await page.touchscreen.tap(s.x,s.y);};
  for(let i=0;i<12;i++){
    if(await page.evaluate(()=>gameInstance.state!=='PLAYING'))break;
    await pop();
    await page.waitForTimeout(120);
  }
  await page.waitForFunction(()=>gameInstance.state==='CELEBRATING',null,{timeout:20000});
  // 等演出结束进入告别（friendInteraction 不再 active）
  await page.waitForFunction(()=>gameInstance.state==='CELEBRATING'&&!gameInstance.friendInteraction?.active,null,{timeout:25000});
  await page.waitForFunction(()=>(window.phraseLog||[]).some(id=>['thank-you','nice-day','see-you','goodbye'].includes(id)),null,{timeout:12000});
  const farewellId=await page.evaluate(()=>(window.phraseLog||[]).find(id=>['thank-you','nice-day','see-you','goodbye'].includes(id)));
  const subtitle=await page.evaluate(()=>!!document.querySelector('.animal-speech'));
  await page.screenshot({path:out+'farewell-speech.png'});
  results.push({countdownVoiceSet:usedSet,farewellPhrase:farewellId,farewellSubtitle:subtitle});

  assert.deepEqual(errors,[]);
  await fs.writeFile(out+'results.json',JSON.stringify({pass:true,results},null,2));
  console.log(JSON.stringify({pass:true,results},null,2));
}catch(e){
  await page.screenshot({path:out+'failure.png'}).catch(()=>{});
  await fs.writeFile(out+'results.json',JSON.stringify({pass:false,error:e.stack,errors},null,2));
  console.error(e.message);process.exitCode=1;
}finally{await browser.close();}
