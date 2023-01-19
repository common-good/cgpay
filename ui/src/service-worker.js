import { build, files, version } from '$service-worker';
 
// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;
 
const ASSETS = [
  ...build, // the app itself
  ...files  // everything in `static`
];
 
self.addEventListener('install', (ev) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
  }
 
  ev.waitUntil(addFilesToCache());
});
 
self.addEventListener('activate', (ev) => {
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }
 
  ev.waitUntil(deleteOldCaches());
});
 
self.addEventListener('fetch', (ev) => {
  // ignore POST requests etc
  if (ev.request.method !== 'GET') return;
 
  async function respond() {
    const url = new URL(ev.request.url);
    const cache = await caches.open(CACHE);
 
    // `build`/`files` can always be served from the cache
    if (ASSETS.includes(url.pathname)) {
      return cache.match(ev.request);
    }
 
    // for everything else, try the network first, but
    // fall back to the cache if we're offline
    try {
      const response = await fetch(ev.request);
 
      if (response.status === 200) {
        cache.put(ev.request, response.clone());
      }
 
      return response;
    } catch {
      return cache.match(ev.request);
    }
  }
 
  ev.respondWith(respond());
});