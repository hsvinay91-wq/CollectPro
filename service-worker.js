/* Ekadhara service worker — installable app shell, fast open, offline fallback */
const V="ekadhara-v4",SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>null)))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==V).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=="GET"||u.origin!==location.origin)return;            /* Supabase / CDN calls are never cached */
  if(r.mode==="navigate"){                                           /* HTML: network first (new deploys show at once); each page cached under its own path */
    const key=u.origin+u.pathname;
    e.respondWith(fetch(r.url,{cache:"no-cache",credentials:"same-origin"}).then(res=>{if(res&&res.ok){const c=res.clone();caches.open(V).then(x=>x.put(key,c))}return res})
      .catch(()=>caches.match(key).then(x=>x||caches.match("./index.html")).then(x=>x||caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>{                          /* static files: instant from cache, refreshed in background */
    const net=fetch(r).then(res=>{if(res&&res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>hit);
    return hit||net;
  }));
});
