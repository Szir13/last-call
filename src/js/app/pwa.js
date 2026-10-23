/* ---------- installable app: the service worker keeps the game playable offline (only over http/https) ---------- */
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){
  window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
}
