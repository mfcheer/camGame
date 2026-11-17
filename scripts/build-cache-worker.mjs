import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(process.env.CACHE_BUILD_DIST||'dist');
const base=(process.env.VITE_BASE_PATH||'/').replace(/\/?$/,'/');

async function filesIn(dir,prefix=''){
  const entries=await readdir(dir,{withFileTypes:true});
  const paths=[];
  for(const entry of entries){
    const relative=prefix?`${prefix}/${entry.name}`:entry.name;
    if(entry.isDirectory())paths.push(...await filesIn(path.join(dir,entry.name),relative));
    else if(entry.isFile()&&relative!=='service-worker.js')paths.push(relative);
  }
  return paths;
}

const revisions={};
for(const relative of (await filesIn(root)).sort()){
  const content=await readFile(path.join(root,relative));
  revisions[relative]=[createHash('sha256').update(content).digest('hex').slice(0,16),content.byteLength];
}
const buildId=createHash('sha256').update(JSON.stringify(revisions)).digest('hex').slice(0,16);
const shell=['index.html',...Object.keys(revisions).filter(file=>/^assets\/index-[^/]+\.(js|css)$/.test(file))];
const template=await readFile(new URL('./cache-worker.template.js',import.meta.url),'utf8');
const worker=template
  .replace('__BASE_PATH__',JSON.stringify(base))
  .replace('__BUILD_ID__',JSON.stringify(buildId))
  .replace('__SHELL_FILES__',JSON.stringify(shell))
  .replace('__REVISIONS__',JSON.stringify(revisions));
await writeFile(path.join(root,'service-worker.js'),worker);
console.log(`Cache worker ${buildId}: ${Object.keys(revisions).length} revisioned files, ${shell.length} shell files`);
