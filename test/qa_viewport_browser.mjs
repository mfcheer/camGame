import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const{chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='output/playwright/mobile-fix/viewport/';await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
try{
 await p.goto('http://127.0.0.1:5175/');await p.waitForFunction(()=>!!window.gameInstance);
 // Explicit browser-chrome/notch fixture: layout viewport stays 844px, visible area is 620px.
 await p.evaluate(()=>{
  const css=document.createElement('style');css.textContent=':root{--safe-top:32px;--safe-bottom:24px;--safe-left:12px;--safe-right:12px}';document.head.append(css);
  Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>620});Object.defineProperty(visualViewport,'offsetTop',{configurable:true,get:()=>10});visualViewport.dispatchEvent(new Event('resize'));
 });
 const home=await p.locator('.start-card').boundingBox();assert.ok(home.y>=42);assert.ok(home.y+home.height<=606);const demo=await p.locator('#btn-demo-mode').boundingBox();assert.ok(demo.y+demo.height<606);
 await p.locator('#btn-demo-mode').click();await p.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.45);
 const canvas=await p.locator('canvas').boundingBox();assert.equal(canvas.height,620);assert.equal(canvas.y,10);
 const target=await p.evaluate(()=>JSON.parse(render_game_to_text()).bubble);await p.mouse.move(target.x,target.y,{steps:3});await p.waitForFunction(()=>gameInstance.collectedCount===1);
 await p.evaluate(()=>{gameInstance.bubbleManager.comboCount=3;gameInstance.bubbleManager.comboRemainingMs=1500;gameInstance.handleComboChange(3);});
 await p.waitForTimeout(380);assert.equal(await p.locator('#demo-mode-banner').isVisible(),false);await p.screenshot({path:out+'safe-area-combo.png'});
 await p.locator('#btn-pause').click();await p.setViewportSize({width:844,height:390});assert.equal(await p.evaluate(()=>gameInstance.state),'PAUSED');assert.equal(await p.locator('#pause-modal').isVisible(),true);
 // Clear the visible-height fixture; a genuine orientation resize keeps manual pause.
 await p.evaluate(()=>{delete visualViewport.height;delete visualViewport.offsetTop;visualViewport.dispatchEvent(new Event('resize'));});await p.locator('#btn-resume').click();assert.equal(await p.evaluate(()=>gameInstance.state),'PLAYING');
 console.log(JSON.stringify({pass:true,checks:['Visible browser viewport controls canvas and HUD','Safe insets protect start/actions','Pointer hits use visible viewport coordinates','Combo does not overlap demo label','Manual pause survives orientation changes']},null,2));
 await fs.writeFile(out+'results.json',JSON.stringify({pass:true},null,2));
}catch(e){await p.screenshot({path:out+'failure.png'});console.error(e);process.exitCode=1;}finally{await b.close();}
