/* Service worker: keeps Last Call playable offline once it has been opened.
   The page comes from the network when there is one (so updates arrive), from the cache otherwise.
   Fonts and icons are stored at install; the music when it first plays, served in ranges for Safari.
   VERSION is filled in by build.js from the files' contents: a new release replaces the old cache. */
var VERSION = "__VERSION__", CACHE = "last-call-" + VERSION;
var SHELL = __SHELL__;

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf("last-call-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function put(req, res) { if (res && res.ok && res.status === 200) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); } return res; }

/* media elements ask for byte ranges: answer them from a cached copy of the whole file */
function ranged(req) {
  var url = req.url.split("#")[0];
  return caches.match(url).then(function (hit) {
    return hit || fetch(url).then(function (res) { return put(url, res).clone(); });
  }).then(function (full) {
    var range = req.headers.get("range");
    if (!range || !full.ok) return full;
    return full.blob().then(function (blob) {
      var m = /bytes=(\d*)-(\d*)/.exec(range), size = blob.size;
      var start = m && m[1] ? +m[1] : 0, end = m && m[2] ? Math.min(+m[2], size - 1) : size - 1;
      return new Response(blob.slice(start, end + 1), {status: 206, statusText: "Partial Content", headers: {
        "Content-Range": "bytes " + start + "-" + end + "/" + size, "Content-Length": String(end - start + 1),
        "Content-Type": full.headers.get("Content-Type") || "audio/ogg", "Accept-Ranges": "bytes"}});
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.url.indexOf("/audio/") >= 0) { e.respondWith(ranged(req)); return; }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) { return put("index.html", res); }).catch(function () { return caches.match("index.html"); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req).then(function (res) { return put(req, res); }); }));
});
