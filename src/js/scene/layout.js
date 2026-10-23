/* ---------- loop and layout ---------- */
function resize(){
  var wrap=stg.parentNode,avail=wrap.clientWidth,dpr=window.devicePixelRatio||1;
  if(!avail)return;
  var w=Math.floor(Math.min(avail,PW*4)*dpr)/dpr;Z=w/PW;
  stg.style.setProperty("--z",Z);stg.style.width=w+"px";cv.style.width=w+"px";cv.style.height=(PH*Z)+"px";
}
window.addEventListener("resize",resize);
/* the scene draws at about 30 fps while it is on screen; off screen (scrolled away, tab in the background)
   guests keep moving 4 times a second so sounds and seats stay right, but nothing is drawn */
var DRAW_S=0.03,OFF_S=0.25,acc=0;
function frame(now){
  var dt=Math.min(0.1,(now-lastF)/1000);lastF=now;if(!(dt>0))dt=0.016;tt+=dt;
  statT-=dt;if(statT<=0){statT=0.12;statusTick()}
  acc+=dt;
  var vis=sceneVis&&!document.hidden;
  if(!hidden&&acc>=(vis?DRAW_S:OFF_S)){
    try{sync(Math.min(acc,OFF_S));if(vis)render()}catch(e){if(!window.__pxerr){window.__pxerr=e;if(window.console)console.error("pixel scene:",e)}}
    acc=0;
  }
  tutTick(dt);
  requestAnimationFrame(frame);
}
resize();rebuild();
var hidden=!!pget().hide,snapNext=true,sceneVis=true;
function updStrip(){}
if("IntersectionObserver" in window){new IntersectionObserver(function(es){sceneVis=es[0].intersectionRatio>=0.25;updStrip()},{threshold:[0,0.25,0.5],rootMargin:"-130px 0px 0px 0px"}).observe(stg)}
function applyHide(){
  stg.style.display=hidden?"none":"";updStrip();
  document.getElementById("pxhide").textContent=hidden?"Show scene":"Hide scene";
  window.dispatchEvent(new Event("pxmeasure"));
  if(!hidden){for(var id in cust){if(cust[id].b&&cust[id].b.parentNode)cust[id].b.parentNode.removeChild(cust[id].b)}cust={};snapNext=true;resize()}
}
document.getElementById("pxhide").addEventListener("click",function(){hidden=!hidden;pset("hide",hidden);applyHide()});
document.getElementById("pxcol").addEventListener("click",function(){S.orders.filter(function(o){return o.ready}).forEach(collect)});
applyHide();
/* long help notes fold to two lines; tap to read the rest */
function clampNotes(){
  document.querySelectorAll(".panel.on .note,.panel.on .gnote").forEach(function(n){
    if(n.classList.contains("clamp")||n.classList.contains("up")||n.classList.contains("down")||n.closest(".tdetail"))return;
    if(n.textContent.length>90)n.classList.add("clamp");
  });
}
document.addEventListener("click",function(e){var n=e.target.closest&&e.target.closest(".clamp");if(n)n.classList.toggle("open")});
/* long sections fold; later tiers start closed */
var DEFFOLD=/^(Unlocked by|Rare|Neat, beer|Achievements|Finances|Team satisfaction|Staff training)/;
function foldKey(h){return h.parentNode.id+"|"+h.textContent}
function applyFolds(){
  var st=pget().fold||{};
  document.querySelectorAll(".panel > .h").forEach(function(h){
    var sec=h.classList.contains("pxsec"),k=foldKey(h),f=sec?false:((k in st)?!!st[k]:DEFFOLD.test(h.textContent));
    if(!sec){h.classList.add("fh");h.classList.toggle("folded",f);h.setAttribute("role","button");h.setAttribute("aria-expanded",f?"false":"true")}
    var e=h.nextElementSibling;
    while(e&&!e.classList.contains("h")){e.classList.toggle("fold",f);e=e.nextElementSibling}
  });
}
document.addEventListener("click",function(e){
  var h=e.target.closest&&e.target.closest(".panel > .h");if(!h||h.classList.contains("pxsec"))return;
  var o=pget().fold||{};o[foldKey(h)]=!h.classList.contains("folded");pset("fold",o);applyFolds();
});
/* each tab opens at the top of its own scroll area */
document.querySelectorAll("nav button").forEach(function(nb){nb.addEventListener("click",function(){var m=document.getElementById("main");if(m)m.scrollTo(0,0)})});
applyName();updHelp();
if(!pdone()&&(S.served||0)<3)startTut();
