/**
 * v2. The first version was cache-first for everything, which meant an
 * installed home-screen app served its original index.html forever and never
 * saw a new build. Now:
 *
 *   navigations  -> network first, cache only as an offline fallback
 *   /assets/*    -> cache first, safe because Vite content-hashes the names
 *   everything else -> serve cache, refresh it in the background
 */
const CACHE = "noodle-v2";
const TIMEOUT = 3500;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function putInCache(req, res) {
  if (res && res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

function networkFirst(req) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (r) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    const fallback = () => caches.match(req).then((hit) => hit && done(hit));
    setTimeout(fallback, TIMEOUT);
    fetch(req)
      .then((res) => done(putInCache(req, res)))
      .catch(() => caches.match(req).then((hit) => done(hit ?? Response.error())));
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(networkFirst(req));
    return;
  }

  if (new URL(req.url).pathname.includes("/assets/")) {
    event.respondWith(caches.match(req).then((hit) => hit ?? fetch(req).then((res) => putInCache(req, res))));
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req).then((res) => putInCache(req, res)).catch(() => hit);
      return hit ?? network;
    }),
  );
});
