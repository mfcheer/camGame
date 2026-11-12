import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
try{
 const svg=await fs.readFile('public/icons/app-icon.svg','utf8');
 const page=await browser.newPage({deviceScaleFactor:1});
 for(const [size,file]of [[32,'icon-32.png'],[180,'apple-touch-icon.png'],[192,'icon-192.png'],[512,'icon-512.png']]){
  await page.setViewportSize({width:size,height:size});
  await page.setContent(`<style>html,body{margin:0;width:100%;height:100%}svg{display:block;width:100%;height:100%}</style>${svg}`);
  await page.screenshot({path:`public/icons/${file}`,omitBackground:true});
 }
}finally{await browser.close();}
