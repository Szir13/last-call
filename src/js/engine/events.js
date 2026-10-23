/* ---------- engine environment: events out, clock and dice in ----------
   The engine never touches the DOM or storage. It announces what happened with emit(name,data);
   the UI listens with onEv(name,fn). now() and random() are its only clock and dice: setEnv() replaces them in tests. */
var BUS={},ENV={now:Date.now,random:Math.random};
function onEv(ev,fn){(BUS[ev]=BUS[ev]||[]).push(fn)}
function emit(ev,a){var l=BUS[ev];if(l)for(var i=0;i<l.length;i++)l[i](a)}
function setEnv(o){for(var k in o)ENV[k]=o[k]}
function now(){return ENV.now()}
function random(){return ENV.random()}
function toast(m){emit("toast",m)}
