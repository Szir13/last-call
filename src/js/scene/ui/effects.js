/* ---- sound ---- */
var AC=null,muted=!!pget().mute;
function audio(){if(AC===null){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=false}}return AC||null}
function sfx(kind){
  if(muted)return;var a=audio();if(!a)return;if(a.state==="suspended"){try{a.resume()}catch(e){}}
  var now=a.currentTime;
  function n(f,s,d){var o=a.createOscillator(),gg=a.createGain();o.type="square";o.frequency.value=f;
    gg.gain.setValueAtTime(0.0001,now+s);gg.gain.exponentialRampToValueAtTime(0.045,now+s+0.01);gg.gain.exponentialRampToValueAtTime(0.0001,now+s+d);
    o.connect(gg);gg.connect(a.destination);o.start(now+s);o.stop(now+s+d+0.03)}
  if(kind==="coin"){n(988,0,0.06);n(1319,0.06,0.14)}
  else if(kind==="new"){n(659,0,0.09);n(784,0.09,0.09);n(988,0.18,0.09);n(1319,0.27,0.22)}
  else if(kind==="tab"){n(523,0,0.07);n(784,0.07,0.1)}
  else if(kind==="tap"){n(440,0,0.04)}
}
document.addEventListener("pointerdown",function(){audio()},{once:true});
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

