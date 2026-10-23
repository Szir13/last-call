
setInterval(loop,100);
document.addEventListener("visibilitychange",function(){if(document.hidden)save()});
window.addEventListener("pagehide",save);
window.addEventListener("resize",drawAll);
})();

