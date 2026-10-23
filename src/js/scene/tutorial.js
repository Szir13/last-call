/* ---------- tutorial ---------- */
var bnName="",bnStr="";
function plain(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9 ]/g,"").trim().slice(0,16)}
function drawBanner(st){
  var n=S.barName;if(!n)return;
  if(n!==bnName){bnName=n;bnStr=plain(n)}
  if(!bnStr)return;
  var w=bnStr.length*4+5,x=Math.round(100-w/2),th=TH[st];
  fr(g,x+3,0,1,3,th.trim);fr(g,x+w-4,0,1,3,th.trim);
  fr(g,x,3,w,9,th.sbg);fr(g,x,3,w,1,th.trim);fr(g,x,11,w,1,th.trim);txt(g,bnStr,x+3,5,th.sfg);
}
function applyName(){
  var nm=document.getElementById("pxnm"),sp0=document.getElementById("pxsep");
  nm.textContent=S.barName||"Name your bar";nm.classList.toggle("dim",!S.barName);sp0.textContent=" · ";
}
function submitName(){
  var v=document.getElementById("pxin").value.replace(/\s+/g," ").trim().slice(0,18);
  if(!v)v=S.barName||"Last Call";
  S.barName=v;applyName();save();toast("Welcome to "+v+"!");endTut();
}

var tutOn=false,tutI=0,tutFull="",tutN=0,tutT=0,tutSnap=0;
function pget(){try{return JSON.parse(localStorage.getItem(PK)||"{}")||{}}catch(e){return {}}}
function pset(k,v){try{var o=pget();o[k]=v;localStorage.setItem(PK,JSON.stringify(o))}catch(e){}}
function pdone(){return !!pget().done}
function updHelp(){var b=document.getElementById("pxhelp");if(b)b.style.display=pdone()?"none":""}
function setDone(){pset("done",true);updHelp()}
function navTab(){var b=document.querySelector("nav button.on");return b?b.getAttribute("data-tab"):""}
function pulse(id){document.querySelectorAll("nav button").forEach(function(b){b.classList.toggle("pxpulse",b.getAttribute("data-tab")===id)})}
var TUT=[
 {say:"Welcome to Last Call! I'm Joe. I've been pouring drinks since before you were born, and I'll show you the ropes. Tap here to continue.",tap:true},
 {say:"This is your lemonade stand. While it's open, customers walk up and order. The bubble over their head shows what they want and how long they'll wait.",tap:true},
 {say:"Here comes one! You and your team mix the drinks on your own, as long as the ingredients are in stock. Watch the little bars under each glass.",wait:function(){return anyWaiting()}},
 {say:"When the drink is ready, the bubble turns gold. Tap it to collect the payment. Faster service means a bigger tip!",snap:function(){return S.served},wait:function(){return S.served>tutSnap}},
 {say:"Every drink uses ingredients. Open the Stock tab and unlock a new one, like sugar syrup.",tab:"stock",snap:function(){return Object.keys(S.ing).length},wait:function(){return Object.keys(S.ing).length>tutSnap}},
 {say:"New ingredients unlock new recipes. Check the Menu tab: a bigger menu brings more customers.",tab:"book",wait:function(){return navTab()==="book"}},
 {say:"Salaries, rent and utilities are paid at the end of each month. When you can afford it, open the Team tab and hire some help.",tab:"staff",wait:function(){return navTab()==="staff"}},
 {say:"That's the basics. Watch the news for price swings, set your prices when the bar is closed, and keep an eye on the clock. The bar is yours. Good luck!",tap:true},
 {say:"One last thing, boss. What do you want to call your bar?",name:true}
];
function showStep(i){
  tutI=i;var st=TUT[i];tutFull=st.say;tutN=0;tutT=0;tutSnap=st.snap?st.snap():0;
  document.getElementById("pxdlg").hidden=false;document.getElementById("pxtxt").textContent="";
  document.getElementById("pxnext").style.visibility=st.tap?"visible":"hidden";
  pulse(st.tab||"");
  document.getElementById("pxform").hidden=!st.name;
  document.getElementById("pxskip").style.display=st.name?"none":"";
  if(st.name){document.getElementById("pxin").value=S.barName||""}
}
function startTut(){tutOn=true;showStep(0)}
function endTut(){tutOn=false;document.getElementById("pxdlg").hidden=true;pulse("");setDone()}
function nextStep(){if(tutI+1>=TUT.length)endTut();else showStep(tutI+1)}
function tutTick(dt){
  if(!tutOn)return;var st=TUT[tutI];
  if(tutN<tutFull.length){tutN=Math.min(tutFull.length,tutN+dt*52);document.getElementById("pxtxt").textContent=tutFull.substring(0,Math.floor(tutN))}
  else{tutT+=dt;if(st.wait&&tutT>0.8&&st.wait())nextStep()}
}
document.getElementById("pxdlg").addEventListener("click",function(e){
  if(e.target.closest("button"))return;
  if(tutN<tutFull.length){tutN=tutFull.length;document.getElementById("pxtxt").textContent=tutFull;return}
  if(TUT[tutI].tap)nextStep();
});
document.getElementById("pxskip").addEventListener("click",function(e){e.stopPropagation();if(!S.barName)showStep(TUT.length-1);else endTut()});
document.getElementById("pxok").addEventListener("click",function(e){e.stopPropagation();submitName()});
document.getElementById("pxin").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();submitName()}});
document.getElementById("pxin").addEventListener("click",function(e){e.stopPropagation()});
function openName(){tutOn=true;showStep(TUT.length-1);document.getElementById("pxdlg").scrollIntoView({block:"nearest"})}
document.getElementById("pxnm").addEventListener("click",openName);
document.getElementById("pxnm").addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" ")openName()});
document.getElementById("pxhelp").addEventListener("click",function(){startTut()});
document.getElementById("pxdet").addEventListener("click",function(){
  var o=document.getElementById("orders"),show=o.classList.contains("pxhide");
  o.classList.toggle("pxhide",!show);this.setAttribute("aria-expanded",show?"true":"false");this.textContent=show?"Hide order details":"Order details";
});
(function(){var pc=document.getElementById("pxpor"),a=pc.getContext("2d");drawPerson(a,JOE,6,18,0,0,false)})();

