/* Generated at build time. The resource list contains file content hashes. */
const BASE=__BASE_PATH__;
const BUILD=__BUILD_ID__;
const SHELL=__SHELL_FILES__;
const REVISIONS=__REVISIONS__;
const CORE_CACHE='camgame-core-v1';
const MEDIA_CACHE='camgame-media-v1';
const MEDIA_LIMIT=72*1024*1024;
let maintenance=Promise.resolve();

function relativePath(url){
  if(url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return null;
  const path=url.pathname.slice(BASE.length);
  return path||'index.html';
}
function revisionUrl(path){
  const url=new URL(BASE+path,self.location.origin);
  url.searchParams.set('__cg_rev',REVISIONS[path][0]);
  return url;
}
function cacheName(path){
  return /^(assets\/|wasm\/|vendor\/|icons\/|tracking-worker\.js$|models\/[^/]+\.task$)/.test(path)?CORE_CACHE:MEDIA_CACHE;
}
async function trimMedia(cache,limit=MEDIA_LIMIT){
  const keys=await cache.keys();
  let bytes=keys.reduce((total,key)=>{
    const path=relativePath(new URL(key.url));
    return total+(REVISIONS[path]?.[1]||0);
  },0);
  for(const key of keys){
    if(bytes<=limit)break;
    const path=relativePath(new URL(key.url));
    await cache.delete(key);
    bytes-=REVISIONS[path]?.[1]||0;
  }
}
async function pruneOldVersions(cache){
  for(const key of await cache.keys()){
    const url=new URL(key.url);
    const path=relativePath(url);
    if(!path||url.searchParams.get('__cg_rev')!==REVISIONS[path]?.[0])await cache.delete(key);
  }
}
async function store(path,response,event){
  let cache;
  try{
    cache=await caches.open(cacheName(path));
    await cache.put(revisionUrl(path),response);
    if(cache&&cacheName(path)===MEDIA_CACHE){
      maintenance=maintenance.then(()=>trimMedia(cache)).catch(()=>{});
      await maintenance;
    }
  }catch{
    if(cacheName(path)===MEDIA_CACHE){
      maintenance=maintenance.then(()=>trimMedia(cache,MEDIA_LIMIT/2)).catch(()=>{});
      await maintenance;
    }
  }
}
async function cachedAsset(path,request,event){
  const key=revisionUrl(path);
  try{
    const cached=await (await caches.open(cacheName(path))).match(key);
    if(cached)return cached;
  }catch{} // Storage can be unavailable while the network is still usable.
  const networkRequest=new Request(key,{headers:request.headers,credentials:'same-origin',mode:'same-origin',signal:request.signal});
  const response=await fetch(networkRequest);
  if(response.ok&&response.status===200)event.waitUntil(store(path,response.clone(),event));
  return response;
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CORE_CACHE);
    await Promise.all(SHELL.map(async path=>{
      const key=revisionUrl(path);
      const response=await fetch(key,{cache:'no-store'});
      if(!response.ok)throw new Error(`Missing app shell: ${path}`);
      await cache.put(key,response);
    }));
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await Promise.allSettled([
      caches.open(CORE_CACHE).then(pruneOldVersions),
      caches.open(MEDIA_CACHE).then(async cache=>{await pruneOldVersions(cache);await trimMedia(cache);})
    ]);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.headers.has('range'))return;
  const url=new URL(request.url);
  const path=relativePath(url);
  if(!path||!REVISIONS[path])return;
  if(request.mode==='navigate'){
    // Keep one page load on one build; the waiting worker switches at home.
    event.respondWith((async()=>{
      try{
        const cached=await (await caches.open(CORE_CACHE)).match(revisionUrl('index.html'));
        if(cached)return cached;
      }catch{}
      return fetch(request);
    })());
    return;
  }
  event.respondWith(cachedAsset(path,request,event));
});
