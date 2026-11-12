import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:384,height:384}});
 for(const animal of ['bunny','cat','frog','dog','dragon','goldenDragon']) {
  await page.goto(`http://127.0.0.1:5175/scripts/model-preview.html?animal=${animal}`);await page.waitForFunction(()=>window.previewReady);
  const png=await page.locator('canvas').evaluate(c=>c.toDataURL().split(',')[1]);await fs.writeFile(`public/models/${animal}-preview.png`,Buffer.from(png,'base64'));
 }
 await page.setViewportSize({width:1280,height:420});await page.goto('http://127.0.0.1:5175/scripts/reward-preview.html');await page.waitForFunction(()=>window.previewReady);await page.screenshot({path:'output/playwright/v10/01-rewards-gallery.png'});
}finally {await browser.close();}
