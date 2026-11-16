import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');

const output=process.env.CELEBRATION_OUTPUT||'/tmp/camgame-celebration-browser';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1194,height:834}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
const state=()=>page.evaluate(()=>JSON.parse(render_game_to_text()));

async function captureAction(id,index) {
  for(let step=0;step<120;step++) {
    const ready=await page.evaluate(index=>{
      const show=gameInstance.friendInteraction;
      return show?.active&&show.actionIdx===index&&!show.resting&&show.actionElapsed>show.plan[index].dur*.8*.40;
    },index);
    if(ready)break;
    await page.evaluate(()=>window.advanceTime(80));
  }
  const scene=await state();
  assert.ok(scene.friendPlay,`${id} keeps its performance visible`);
  assert.equal(scene.friendPlay.current,scene.friendPlay.actions[index]);
  assert.equal(scene.animal.visible,true);
  await page.screenshot({path:`${output}/${id}-${index}-${scene.friendPlay.current}.png`});
}

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
  await page.evaluate(()=>window.advanceTime(80));
  const plan=(await state()).friendPlay.actions;
  assert.equal(plan.length,3,id);
  for(let i=0;i<3;i++)await captureAction(id,i);
  await page.evaluate(()=>window.advanceTime(2500));
  assert.equal((await state()).friendPlay,null,`${id} completes the show`);
  await page.evaluate(()=>window.advanceTime(4500));
  assert.equal((await state()).animal.state,'ESCAPED',`${id} completes farewell`);
  await page.locator('#victory-modal').waitFor({state:'visible',timeout:8000});
  assert.equal((await state()).resultVisible,true,`${id} reaches results`);
}

try {
  const cases=[['bunny',true],['cat',false],['frog',false],['goldenDragon',false],['thomas',false],['maiqi',false]];
  const selected=process.env.CELEBRATION_IDS?.split(',')||cases.map(([id])=>id);
  for(const [id,full] of cases)if(selected.includes(id))await play(id,full);
  assert.deepEqual(errors,[]);
  console.log(`${selected.length} character shows, farewells and results passed.`);
}finally{await browser.close();}
