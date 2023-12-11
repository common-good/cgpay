import { build, files, version } from '$service-worker';
 
// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;
 
const ASSETS = [
  ...build, // the app itself
  ...files  // everything in `static`
];
 
self.addEventListener('install', (ev) => {
  self.skipWaiting(); // once a new version is available, install it immediately
  async function addFilesToCache() { // Create a new cache and add all files to it
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
  if (ev.request.method !== 'GET') return; // ignore POST requests etc
 
  async function respond() {
    const url = new URL(ev.request.url);
    const cache = await caches.open(CACHE);
 
    // most built assets can always be served from the cache
    if (ASSETS.includes(url.pathname)) {
      return cache.match(ev.request);
    }
 
    try { // for everything else, try the network first
      const response = await fetch(ev.request);
 
      if (response.status === 200) {
        cache.put(ev.request, response.clone());
      }
      return response;
 
    } catch {
      return cache.match(ev.request); // offline, so fall back to the cache
    }
  }
 
  ev.respondWith(respond());
});