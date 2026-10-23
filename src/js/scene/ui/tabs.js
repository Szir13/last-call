/* ---- tabs appear as the bar grows ---- */
var tabsInit=false;
var TABRULE={
  stock:function(){return true},book:function(){return true},
  staff:function(){return S.served>=3||S.team.length>0||(tutOn&&tutI>=6)||S.mcount>0},
  upg:function(){return S.served>=3||S.team.length>0||(tutOn&&tutI>=6)||S.mcount>0},
  brand:function(){return S.rep>0||S.pts>0||S.mcount>=1||Object.keys(S.ach||{}).length>0},
  cal:function(){return S.mcount>=1||gDay()>=2||S.served>=15}
};
var TABN={staff:"Team",upg:"Upgrades",brand:"Brand",cal:"Calendar"};
function updTabs(){
  var seen=pget().tabs||{},changed=false,newly=[],n=0;
  document.querySelectorAll("nav button").forEach(function(b){
    var k=b.getAttribute("data-tab"),ok=!!seen[k]||(TABRULE[k]?TABRULE[k]():true);
    if(ok&&!seen[k]){seen[k]=1;changed=true;if(tabsInit&&k!=="stock"&&k!=="book")newly.push(k)}
    b.classList.toggle("pxgone",!ok);if(ok)n++;
  });
  if(changed)pset("tabs",seen);
  document.querySelector("nav .in").style.gridTemplateColumns="repeat("+n+",1fr)";
  if(newly.length){var nm=newly.map(function(k){return TABN[k]||k}).join(", ");toast("New tab unlocked: "+nm);sfx("tab");
    newly.forEach(function(k){var b=document.querySelector('nav button[data-tab="'+k+'"]');if(b){b.classList.add("pxnew");setTimeout(function(){b.classList.remove("pxnew")},5000)}})}
  tabsInit=true;
}

