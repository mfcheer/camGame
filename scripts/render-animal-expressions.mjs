import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='output/playwright/v14/expressions';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:384,height:420}});for(const id of ['bunny','cat','frog','dog','dragon','goldenDragon'])for(const phase of ['idle','react']){
 await page.goto(`http://127.0.0.1:5175/scripts/animal-expression-preview.html?animal=${id}&phase=${phase}`);await page.waitForFunction(()=>window.previewReady);await page.screenshot({path:`${out}/${id}-${phase}.png`});
 }
}finally{await browser.close();}
