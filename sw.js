/* Pocket Dreamer service worker: keeps the app files on the phone so it opens fast.
 * Your money data is never cached here; it always comes from your Google Sheet.
 * Change CACHE whenever you upload new files so phones pick them up. */
var CACHE = 'pocketdreamer-4.8.0-1';
var SHELL = ['./', 'index.html', 'styles.css', 'manifest.webmanifest', 'js/main.js', 'js/core.js', 'js/shared.js', 'js/sweep.js',
  'js/screens/home.js', 'js/screens/accounts.js', 'js/screens/transactions.js', 'js/screens/more.js', 'js/vendor/preact-htm.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
