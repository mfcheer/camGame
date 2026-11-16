import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');

const output=process.env.FAREWELL_OUTPUT||'/tmp/camgame-farewell-browser';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1194,height:834}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));

async function play(id,fullRound=false) {
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5176/');
  await page.locator(`[data-animal="${id}"]`).click();
  await page.locator('#btn-demo-mode').click();
  await page.waitForFunction(()=>gameInstance.state==='PLAYING'&&gameInstance.rescueAnimal.assetStatus==='glb');
  if(fullRound) {
    while((await state()).mode==='PLAYING') {
      await page.waitForFunction(()=>gameInstance.bubbleManager.activeBubble?.spawnElapsed>.5,null,{timeout:15000});
      const before=await state();
      await page.mouse.move(600,100);await page.mouse.move(before.bubble.x,before.bubble.y,{steps:6});
      await page.waitForFunction(score=>gameInstance.collectedCount>score,before.score,{timeout:6000});
      await page.mouse.move(600,100);
    }
  }else await page.evaluate(()=>gameInstance.handleVictory());
  await page.waitForFunction(()=>gameInstance.friendInteraction?.active);
  await page.locator('#btn-friend-done').click();
  await page.evaluate(()=>window.advanceTime(3600));
  assert.equal((await state()).animal.state,'WAVING',`${id} farewell should be visible`);
  await page.screenshot({path:`${output}/${id}-farewell.png`});
  await page.evaluate(()=>window.advanceTime(850));
  assert.equal((await state()).animal.state,'ESCAPED',`${id} should finish the exit`);
  await page.locator('#victory-modal').waitFor({state:'visible',timeout:8000});
  assert.equal((await state()).resultVisible,true,`${id} should show the result`);
  await page.screenshot({path:`${output}/${id}-result.png`});
}

try {
  await play('bunny',true);
  await play('cat');
  await play('thomas');
  await play('maiqi');
  assert.deepEqual(errors,[]);
  console.log('Four farewell scenes and result transitions passed.');
}finally{await browser.close();}
