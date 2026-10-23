/* ---------- engine environment: events out, clock and dice in ----------
   The engine never touches the DOM or storage. It announces what happened with emit(name,data);
   the UI listens with onEv(name,fn). now() and random() are its only clock and dice.
   random() is seeded (mulberry32) and keeps its state in S.rng, so a save replays the same dice.
   setEnv({now,seed}) replaces the clock and the seed of the next new game (tests). */
var BUS={},ENV={now:Date.now,seed:function(){return Math.floor(Math.random()*4294967296)|0}};
function onEv(ev,fn){(BUS[ev]=BUS[ev]||[]).push(fn)}
function emit(ev,a){var l=BUS[ev];if(l)for(var i=0;i<l.length;i++)l[i](a)}
function setEnv(o){for(var k in o)ENV[k]=o[k]}
function now(){return ENV.now()}
function random(){
  var a=S.rng=((S.rng|0)+0x6D2B79F5)|0,t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296;
}
function toast(m){emit("toast",m)}
