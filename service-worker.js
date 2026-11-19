/* Ekadhara service worker — installable app shell, fast open, offline fallback */
const V="ekadhara-v2",SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>null)))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==V).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=="GET"||u.origin!==location.origin)return;            /* Supabase / CDN calls are never cached */
  if(r.mode==="navigate"){                                           /* HTML: network first (new deploys show at once), cache when offline */
    e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put("./index.html",c));return res})
      .catch(()=>caches.match("./index.html",{ignoreSearch:true}).then(x=>x||caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>{                          /* static files: instant from cache, refreshed in background */
    const net=fetch(r).then(res=>{if(res&&res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>hit);
    return hit||net;
  }));
});
