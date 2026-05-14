var CACHE_NAME = "genshin-char-v2";
var toCache = [
  "./",
  "index.html",
  "css/style.css",
  "js/data.js",
  "js/sky.js",
  "js/main.js",
  "manifest.json"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(toCache);
    })
  );
});

self.addEventListener("fetch", function (e) {
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request);
    })
  );
});
