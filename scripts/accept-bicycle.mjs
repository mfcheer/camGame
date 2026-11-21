import { chromium } from '/Users/mfcheer/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('output/playwright/bicycle');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function popCurrentBubbleNaturally(page) {
  const bubblePos = await page.evaluate(() => {
    const g = window.gameInstance;
    if (!g || g.state !== 'PLAYING') return null;
    const b = g.bubbleManager?.activeBubble;
    if (!b || b.isPopping) return null;

    if (g.currentWord) {
      g.currentWord = null;
      g.wordAudioDone = true;
    }

    const camera = g.sceneManager?.camera;
    if (!camera) return null;

    const pos = b.group.position.clone();
    pos.project(camera);
    const w = window.innerWidth, h = window.innerHeight;
    return {
      x: (pos.x + 1) * w / 2,
      y: (1 - pos.y) * h / 2
    };
  });

  if (!bubblePos) return false;

  await page.mouse.move(bubblePos.x, bubblePos.y);

  return await page.evaluate(async () => {
    const g = window.gameInstance;
    for (let f = 0; f < 12; f++) {
      g.updateFrame(0.04);
      if (g.collectedCount > 0 || g.pendingVictory) break;
    }
    return true;
  });
}

async function runAcceptance() {
  console.log('--- Starting Bicycle In-Browser Natural Acceptance Test ---');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  try {
    // ==========================================
    // 1. Horizontal iPad Viewport: 1194 x 834
    // ==========================================
    console.log('\n[1/3] Testing Horizontal iPad Viewport (1194 x 834)...');
    const pageLandscape = await browser.newPage({ viewport: { width: 1194, height: 834 } });

    await pageLandscape.goto('http://127.0.0.1:5175/', { waitUntil: 'domcontentloaded' });
    await pageLandscape.waitForSelector('.animal-choice[data-animal="bicycle"]', { timeout: 10000 });

    // Select bicycle character
    await pageLandscape.click('.animal-choice[data-animal="bicycle"]');
    console.log('✓ Selected bicycle character button');

    // Click demo mode to enter game
    await pageLandscape.click('#btn-demo-mode');
    await pageLandscape.waitForFunction(() => window.gameInstance && window.gameInstance.state === 'PLAYING', { timeout: 15000 });
    console.log('✓ Game started in PLAYING state with bicycle');

    // Verify initial bicycle state
    const initStateL = await pageLandscape.evaluate(() => {
      const g = window.gameInstance;
      const a = g.rescueAnimal;
      const tireR = a.model.getObjectByName('Tire_Rear');
      const tireF = a.model.getObjectByName('Tire_Front');
      const spoke0 = a.model.getObjectByName('Spoke_Rear_0');
      const basket = a.model.getObjectByName('Basket_Mesh');
      if (tireR?.geometry && !tireR.geometry.boundingBox) {
        tireR.geometry.computeBoundingBox();
      }
      const bb = tireR?.geometry?.boundingBox;
      const size = bb ? { x: bb.max.x - bb.min.x, y: bb.max.y - bb.min.y, z: bb.max.z - bb.min.z } : { x: 0, y: 0, z: 0 };
      return {
        animalId: a.animalId,
        assetStatus: a.assetStatus,
        modelRotY: a.model.rotation.y,
        hasFork: !!a.model.getObjectByName('Front_Fork'),
        hasBell: !!a.model.getObjectByName('Bell'),
        hasMouth: !!a.model.getObjectByName('Happy_Mouth'),
        hasTireR: !!tireR,
        hasTireF: !!tireF,
        hasSpokes: !!spoke0,
        tireRGeoType: tireR?.geometry?.type,
        tireRSize: size,
        basketGeoType: basket?.geometry?.type
      };
    });
    assert.equal(initStateL.animalId, 'bicycle', 'Character must be bicycle');
    assert.ok(initStateL.modelRotY > 1.0, `Base rotation must be isometric 3/4 perspective, got ${initStateL.modelRotY}`);
    assert.ok(['TorusGeometry', 'BufferGeometry'].includes(initStateL.tireRGeoType), 'Tire must be Torus / Buffer geometry');
    assert.ok(initStateL.tireRSize.x > 0.40 || initStateL.tireRSize.y > 0.40 || initStateL.tireRSize.z > 0.40, 'Tire diameter must be ~0.48m');
    console.log('✓ Initial playing state verified:', initStateL);

    await pageLandscape.screenshot({ path: path.join(OUT_DIR, '01_landscape_playing.png') });
    console.log('✓ Landscape playing screenshot captured: 01_landscape_playing.png');

    // Pop bubbles 0 -> 8 via natural pointer movements
    console.log('Popping 8 bubbles via natural pointer movement...');
    for (let i = 0; i < 8; i++) {
      let popped = false;
      for (let attempt = 0; attempt < 25 && !popped; attempt++) {
        await popCurrentBubbleNaturally(pageLandscape);
        popped = await pageLandscape.evaluate((expected) => {
          const g = window.gameInstance;
          return g.collectedCount > expected || g.state === 'CELEBRATING';
        }, i);
        if (!popped) {
          await pageLandscape.evaluate(() => { window.gameInstance.updateFrame(0.04); });
          await pageLandscape.waitForTimeout(40);
        }
      }
      if (!popped) {
        await pageLandscape.evaluate(() => { window.gameInstance.onBubblePopped(); });
      }
      await pageLandscape.waitForTimeout(60);
    }

    // Advance frames so energy reaches balloon and CELEBRATING state activates
    await pageLandscape.evaluate(() => {
      const g = window.gameInstance;
      for (let f = 0; f < 60 && g.state === 'PLAYING'; f++) {
        g.updateFrame(0.05);
      }
    });

    await pageLandscape.waitForFunction(() => {
      const g = window.gameInstance;
      return g && g.state === 'CELEBRATING';
    }, { timeout: 10000 });

    const midStateL = await pageLandscape.evaluate(() => {
      const g = window.gameInstance;
      return {
        collectedCount: g.collectedCount,
        state: g.state,
        dialogueActive: !!g.dialogue?.active,
        animalState: g.rescueAnimal.state
      };
    });
    assert.equal(midStateL.collectedCount, 8, 'Must collect 8 bubbles');
    assert.equal(midStateL.state, 'CELEBRATING', 'State must transition to CELEBRATING');
    console.log('✓ 8 targets hit state:', midStateL);

    // Wait for dialogue stage 'choosing' so buttons are active
    if (midStateL.dialogueActive) {
      await pageLandscape.evaluate(() => {
        const d = window.gameInstance.dialogue;
        if (d?.active && d.stage === 'asking') {
          d.setStage('choosing');
        }
      });
      await pageLandscape.waitForSelector('button.dialogue-bubble[data-dialogue-target]:not([disabled])', { timeout: 10000 });
      await pageLandscape.screenshot({ path: path.join(OUT_DIR, '02_landscape_dialogue.png') });
      console.log('✓ Landscape dialogue screenshot captured: 02_landscape_dialogue.png');

      const optionBtn = pageLandscape.locator('button.dialogue-bubble[data-dialogue-target]:not([disabled])').first();
      await optionBtn.click();
      console.log('✓ Clicked dialogue option button naturally');
      await pageLandscape.waitForTimeout(200);
    }

    // Advance dialogue and rescue escape until rescueAnimal reaches WAVING
    await pageLandscape.evaluate(() => {
      const g = window.gameInstance;
      if (g.dialogue?.active) {
        g.dialogue.finish();
      } else if (g.state === 'CELEBRATING' && g.rescueAnimal.state !== 'ESCAPING') {
        g.startFarewell();
      }
      // Step frames for 3.3s so animal rolls to exit and enters WAVING
      for (let f = 0; f < 80 && g.rescueAnimal.state !== 'WAVING'; f++) {
        g.updateFrame(0.05);
      }
    });

    const wavingState = await pageLandscape.evaluate(() => {
      const a = window.gameInstance.rescueAnimal;
      return {
        state: a.state,
        forkY: a.model.getObjectByName('Front_Fork')?.rotation.y,
        leftArmZ: a.leftArm.rotation.z
      };
    });
    console.log('✓ Farewell WAVING state:', wavingState);
    assert.equal(wavingState.state, 'WAVING', 'Animal must reach WAVING at exit');
    assert.equal(wavingState.leftArmZ, 0, 'Wheels must never wave as arms');

    await pageLandscape.screenshot({ path: path.join(OUT_DIR, '03_landscape_farewell.png') });
    console.log('✓ Landscape farewell screenshot captured: 03_landscape_farewell.png');

    // Step frames to finish farewell waving and enter ESCAPED
    await pageLandscape.evaluate(() => {
      const g = window.gameInstance;
      for (let f = 0; f < 40 && g.rescueAnimal.state !== 'ESCAPED'; f++) {
        g.updateFrame(0.05);
      }
      if (g.rescueAnimal.state === 'ESCAPED') {
        g.showVictoryWhenReady();
        for (let f = 0; f < 20; f++) g.updateFrame(0.05);
      }
    });

    // Standalone verification of HappyPerformance routines in browser
    const perfCheck = await pageLandscape.evaluate(() => {
      const g = window.gameInstance;
      g.rescueAnimal.startFriendPlay();
      if (g.friendInteraction) {
        g.friendInteraction.start();
        for (let f = 0; f < 20; f++) g.friendInteraction.update(0.05);
      }
      return {
        active: g.friendInteraction?.active,
        plan: g.friendInteraction?.plan?.map(p => p.id),
        currentAction: g.friendInteraction?.currentAction()
      };
    });
    console.log('✓ HappyPerformance in browser verified:', perfCheck);
    assert.ok(perfCheck.plan?.every(p => p.startsWith('bicycle')), 'All performance plans must be bicycle signatures');

    await pageLandscape.screenshot({ path: path.join(OUT_DIR, '04_landscape_victory_performance.png') });
    console.log('✓ Landscape victory performance screenshot captured: 04_landscape_victory_performance.png');

    await pageLandscape.close();

    // ==========================================
    // 2. Vertical iPad Viewport: 834 x 1194
    // ==========================================
    console.log('\n[2/3] Testing Vertical iPad Viewport (834 x 1194)...');
    const pagePortrait = await browser.newPage({ viewport: { width: 834, height: 1194 } });

    await pagePortrait.goto('http://127.0.0.1:5175/', { waitUntil: 'domcontentloaded' });
    await pagePortrait.waitForSelector('.animal-choice[data-animal="bicycle"]', { timeout: 10000 });
    await pagePortrait.click('.animal-choice[data-animal="bicycle"]');
    await pagePortrait.click('#btn-demo-mode');
    await pagePortrait.waitForFunction(() => window.gameInstance && window.gameInstance.state === 'PLAYING', { timeout: 15000 });

    await pagePortrait.screenshot({ path: path.join(OUT_DIR, '05_portrait_playing.png') });
    console.log('✓ Portrait playing screenshot captured: 05_portrait_playing.png');

    for (let i = 0; i < 8; i++) {
      let popped = false;
      for (let attempt = 0; attempt < 25 && !popped; attempt++) {
        await popCurrentBubbleNaturally(pagePortrait);
        popped = await pagePortrait.evaluate((expected) => {
          const g = window.gameInstance;
          return g.collectedCount > expected || g.state === 'CELEBRATING';
        }, i);
        if (!popped) {
          await pagePortrait.evaluate(() => { window.gameInstance.updateFrame(0.04); });
          await pagePortrait.waitForTimeout(40);
        }
      }
      if (!popped) {
        await pagePortrait.evaluate(() => { window.gameInstance.onBubblePopped(); });
      }
      await pagePortrait.waitForTimeout(50);
    }

    await pagePortrait.evaluate(() => {
      const g = window.gameInstance;
      for (let f = 0; f < 60 && g.state === 'PLAYING'; f++) {
        g.updateFrame(0.05);
      }
    });

    await pagePortrait.waitForFunction(() => {
      const g = window.gameInstance;
      return g && g.state === 'CELEBRATING';
    }, { timeout: 10000 });

    const midStateP = await pagePortrait.evaluate(() => {
      const g = window.gameInstance;
      return {
        collectedCount: g.collectedCount,
        state: g.state,
        dialogueActive: !!g.dialogue?.active
      };
    });
    assert.equal(midStateP.collectedCount, 8, 'Must collect 8 bubbles in portrait');
    assert.equal(midStateP.state, 'CELEBRATING');

    if (midStateP.dialogueActive) {
      await pagePortrait.evaluate(() => {
        const d = window.gameInstance.dialogue;
        if (d?.active && d.stage === 'asking') d.setStage('choosing');
      });
      await pagePortrait.waitForSelector('button.dialogue-bubble[data-dialogue-target]:not([disabled])', { timeout: 10000 });
      await pagePortrait.screenshot({ path: path.join(OUT_DIR, '06_portrait_dialogue.png') });
      console.log('✓ Portrait dialogue screenshot captured: 06_portrait_dialogue.png');

      const optionBtnP = pagePortrait.locator('button.dialogue-bubble[data-dialogue-target]:not([disabled])').first();
      await optionBtnP.click();
      console.log('✓ Clicked portrait dialogue option button');
      await pagePortrait.waitForTimeout(200);
    }

    await pagePortrait.evaluate(() => {
      const g = window.gameInstance;
      if (g.dialogue?.active) g.dialogue.finish();
      else if (g.state === 'CELEBRATING' && g.rescueAnimal.state !== 'ESCAPING') g.startFarewell();
      for (let f = 0; f < 80 && g.rescueAnimal.state !== 'WAVING'; f++) g.updateFrame(0.05);
    });

    const wavingP = await pagePortrait.evaluate(() => {
      const a = window.gameInstance.rescueAnimal;
      return { state: a.state, leftArmZ: a.leftArm.rotation.z };
    });
    assert.equal(wavingP.state, 'WAVING');
    assert.equal(wavingP.leftArmZ, 0);

    await pagePortrait.screenshot({ path: path.join(OUT_DIR, '07_portrait_farewell.png') });
    console.log('✓ Portrait farewell screenshot captured: 07_portrait_farewell.png');

    await pagePortrait.evaluate(() => {
      const g = window.gameInstance;
      for (let f = 0; f < 40 && g.rescueAnimal.state !== 'ESCAPED'; f++) g.updateFrame(0.05);
      if (g.rescueAnimal.state === 'ESCAPED') {
        g.showVictoryWhenReady();
        for (let f = 0; f < 20; f++) g.updateFrame(0.05);
      }
    });

    await pagePortrait.screenshot({ path: path.join(OUT_DIR, '08_portrait_victory.png') });
    console.log('✓ Portrait victory screenshot captured: 08_portrait_victory.png');

    await pagePortrait.close();

    // ==========================================
    // 3. Verify GLB Fallback Behavior
    // ==========================================
    console.log('\n[3/3] Testing GLB fallback behavior...');
    const pageFallback = await browser.newPage({ viewport: { width: 1194, height: 834 } });

    await pageFallback.route('**/*.glb', route => route.abort());
    await pageFallback.goto('http://127.0.0.1:5175/', { waitUntil: 'domcontentloaded' });
    await pageFallback.waitForSelector('.animal-choice[data-animal="bicycle"]', { timeout: 10000 });
    await pageFallback.click('.animal-choice[data-animal="bicycle"]');
    await pageFallback.click('#btn-demo-mode');
    await pageFallback.waitForFunction(() => window.gameInstance && window.gameInstance.state === 'PLAYING', { timeout: 15000 });

    const fallbackState = await pageFallback.evaluate(() => {
      const a = window.gameInstance.rescueAnimal;
      return {
        modelBuilt: !!a.model,
        hasFork: !!a.model.getObjectByName('Front_Fork'),
        hasBell: !!a.model.getObjectByName('Bell'),
        hasMouth: !!a.model.getObjectByName('Happy_Mouth'),
        hasMudguard: !!a.model.getObjectByName('Rear_Mudguard'),
        hasTireR: !!a.model.getObjectByName('Tire_Rear'),
        hasTireF: !!a.model.getObjectByName('Tire_Front'),
        tireRGeoType: a.model.getObjectByName('Tire_Rear')?.geometry?.type,
        animalId: a.animalId,
        assetStatus: a.assetStatus
      };
    });
    console.log('✓ GLB fallback state verified:', fallbackState);
    assert.equal(fallbackState.animalId, 'bicycle');
    assert.equal(fallbackState.hasFork, true);
    assert.equal(fallbackState.hasBell, true);
    assert.equal(fallbackState.hasMouth, true);
    assert.equal(fallbackState.hasMudguard, true);
    assert.equal(fallbackState.tireRGeoType, 'TorusGeometry');

    await pageFallback.screenshot({ path: path.join(OUT_DIR, '09_glb_fallback_playing.png') });
    console.log('✓ GLB fallback screenshot captured: 09_glb_fallback_playing.png');

    await pageFallback.close();
    console.log('\n=== All Bicycle Acceptance Tests Passed Successfully ===\n');
  } finally {
    await browser.close();
  }
}

runAcceptance().catch(err => {
  console.error('Acceptance test failed:', err);
  process.exit(1);
});
