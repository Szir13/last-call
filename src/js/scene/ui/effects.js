/* ---- sound ----
   iOS rules: the audio context can only start inside a tap (touchend or click, not pointerdown), and a
   suspended context may refuse to resume outside one. So every gesture creates or wakes the context, each
   sound waits for it to run, and the context sleeps 1.5 s after the last sound (an idle running context
   keeps the phone's audio hardware awake). "ambient" lets the player's own music keep playing. */
var AC=null,acSleep=0,muted=!!pget().mute;
function audio(){if(AC===null){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=false}}return AC||null}
try{if(navigator.audioSession)navigator.audioSession.type="ambient"}catch(e){}
function wake(){var a=audio();if(a&&a.state!=="running"&&a.state!=="closed"){try{var r=a.resume();if(r&&r.catch)r.catch(function(){})}catch(e){}}return a}
["touchend","click","keydown"].forEach(function(ev){document.addEventListener(ev,function(){if(!muted&&(AC===null||(AC&&AC.state!=="running")))wake()},true)});
function sfx(kind){
  if(muted)return;var a=wake();if(!a)return;
  function play(){
    var now=a.currentTime;
    function n(f,s,d){var o=a.createOscillator(),gg=a.createGain();o.type="square";o.frequency.value=f;
      gg.gain.setValueAtTime(0.0001,now+s);gg.gain.exponentialRampToValueAtTime(0.045,now+s+0.01);gg.gain.exponentialRampToValueAtTime(0.0001,now+s+d);
      o.connect(gg);gg.connect(a.destination);o.start(now+s);o.stop(now+s+d+0.03)}
    clearTimeout(acSleep);acSleep=setTimeout(function(){if(AC&&AC.state==="running")AC.suspend()},1500);
    if(kind==="coin"){n(988,0,0.06);n(1319,0.06,0.14)}
    else if(kind==="new"){n(659,0,0.09);n(784,0.09,0.09);n(988,0.18,0.09);n(1319,0.27,0.22)}
    else if(kind==="tab"){n(523,0,0.07);n(784,0.07,0.1)}
    else if(kind==="tap"){n(440,0,0.04)}
  }
  if(a.state==="running")play();
  else{try{var r=a.resume();if(r&&r.then)r.then(function(){if(a.state==="running")play()},function(){});}catch(e){}}   /* no gesture yet: stay quiet */
}
/* ---- background music: one track on a seamless loop, with its own switch (Music) ----
   It starts on the first tap (browsers and iOS refuse sound before one), pauses while the page is hidden
   and comes back with the next visit or tap. Ogg where the browser plays it, AAC elsewhere (Safari, iOS).
   The file is only fetched when the music is about to play. */
var MUSIC_VOL=0.35,musicOn=pget().music!==false,mus=null;
function musicEl(){
  if(!mus){
    mus=new Audio();mus.loop=true;mus.volume=MUSIC_VOL;mus.preload="none";
    mus.src=mus.canPlayType('audio/ogg; codecs="vorbis"')?"audio/music-lofi.ogg":"audio/music-lofi.m4a";
  }
  return mus;
}
function musicSync(){
  var want=musicOn&&!document.hidden;
  if(!want){if(mus&&!mus.paused)mus.pause();return}
  var m=musicEl();
  if(m.paused){try{var r=m.play();if(r&&r.catch)r.catch(function(){})}catch(e){}}   /* refused before a tap: the next tap retries */
}
["touchend","click","keydown"].forEach(function(ev){document.addEventListener(ev,function(){if(musicOn&&(!mus||mus.paused))musicSync()},true)});
document.addEventListener("visibilitychange",musicSync);
function syncMus(){var b=document.getElementById("pxmus");b.textContent=musicOn?"Music on":"Music off";b.setAttribute("aria-pressed",musicOn?"true":"false")}
document.getElementById("pxmus").addEventListener("click",function(){musicOn=!musicOn;pset("music",musicOn);syncMus();musicSync()});
syncMus();
function syncSnd(){var b=document.getElementById("pxsnd");b.textContent=muted?"Sound off":"Sound on";b.setAttribute("aria-pressed",muted?"false":"true")}
document.getElementById("pxsnd").addEventListener("click",function(){muted=!muted;pset("mute",muted);syncSnd();if(!muted)sfx("tap")});
syncSnd();
document.addEventListener("pointerdown",function(e){var b=e.target.closest&&e.target.closest("button.buy");if(b&&!b.disabled)sfx("tap")});

/* ---- reactions: coin burst and new-recipe banner ---- */
function coinBurst(x,y){
  for(var i=0;i<6;i++){
    var p=el("i","pxcoin");p.style.left=(x*Z)+"px";p.style.top=(y*Z)+"px";
    p.style.setProperty("--dx",(Math.random()*44-22).toFixed(0)+"px");p.style.setProperty("--dy",(-24-Math.random()*26).toFixed(0)+"px");
    ov.appendChild(p);(function(q){setTimeout(function(){if(q.parentNode)q.parentNode.removeChild(q)},850)})(p);
  }
}
function showBan(title,sub,icon){
  if(hidden){toast(title+" "+sub);return}
  var old=ov.querySelector(".pxban");if(old)old.parentNode.removeChild(old);
  var b=el("div","pxban");if(icon)b.appendChild(icon);
  var t=el("div","pxbt");t.appendChild(el("b",null,title));t.appendChild(el("span",null,sub));b.appendChild(t);
  ov.appendChild(b);setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b)},3200);
}
var knownRec=null;
function watchRecipes(){
  var ids={},list=[];
  ITEMS.forEach(function(it){if(unlocked(it)){ids[it.id]=1;list.push(it)}});
  if(knownRec){
    var nw=list.filter(function(it){return !knownRec[it.id]});
    if(nw.length){
      var names=nw.slice(0,2).map(function(it){return it.n}).join(", ")+(nw.length>2?" +"+(nw.length-2):"");
      showBan("New recipe!",names,glassEl(nw[0]));sfx("new");
    }
  }
  knownRec=ids;
}

