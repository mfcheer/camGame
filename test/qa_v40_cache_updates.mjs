import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {CacheManager} from '../src/cacheManager.js';

test('an unchanged model keeps its cache key across a media-only release',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'camgame-cache-'));
  await mkdir(path.join(root,'assets'),{recursive:true});
  await mkdir(path.join(root,'models'),{recursive:true});
  await mkdir(path.join(root,'images'),{recursive:true});
  await writeFile(path.join(root,'index.html'),'<script src="/camGame/assets/index-test.js"></script>');
  await writeFile(path.join(root,'assets/index-test.js'),'console.log("game")');
  await writeFile(path.join(root,'models/hand_landmarker.task'),'stable model bytes');
  await writeFile(path.join(root,'images/card.svg'),'<svg>old</svg>');
  const build=()=>{
    execFileSync(process.execPath,['scripts/build-cache-worker.mjs'],{
      cwd:process.cwd(),env:{...process.env,CACHE_BUILD_DIST:root,VITE_BASE_PATH:'/camGame/'},stdio:'ignore'
    });
    return readFile(path.join(root,'service-worker.js'),'utf8');
  };
  const first=await build();
  assert.match(first,/const BASE="\/camGame\/"/);
  assert.match(first,/const SHELL=\["index.html","assets\/index-test.js"\]/);
  assert.equal(await build(),first);
  await writeFile(path.join(root,'images/card.svg'),'<svg>new</svg>');
  const second=await build();
  const revisions=source=>JSON.parse(source.match(/const REVISIONS=(\{[^\n]+\});/)[1]);
  const before=revisions(first),after=revisions(second);
  assert.notEqual(first,second);
  assert.equal(before['models/hand_landmarker.task'][0],after['models/hand_landmarker.task'][0]);
  assert.notEqual(before['images/card.svg'][0],after['images/card.svg'][0]);
});

test('a waiting update stays pending during play and activates on a safe home boundary',()=>{
  let safe=false,signals=0;
  const manager=new CacheManager(()=>safe);
  manager.registration={waiting:{postMessage:message=>{
    assert.equal(message.type,'ACTIVATE_UPDATE');signals++;
  }}};
  manager.check();
  assert.equal(signals,0);
  safe=true;
  manager.check();manager.check();
  assert.equal(signals,1);
});
