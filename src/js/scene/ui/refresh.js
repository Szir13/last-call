/* ---- refresh: this layer redraws on events, with no timers of its own ----
   menu (ingredients changed)        -> new-recipe banner, stock groups
   stage (venue changed)             -> expansion preview
   a panel gains or loses elements   -> row icons, folded sections (MutationObserver)
   tab (tab switched)                -> refresh the live values now
   render (app loop, after update()) -> runs what is due; values that change all the time
                                        (money, bills, timers, prices) refresh every 500 ms,
                                        the team dashboard and the trees only while their tab is open */
var DUE={},liveAt=0,errs={};
var JOBS={recipes:watchRecipes,stock:groupStock,expansion:updExpPrev,panels:function(){decorate();applyFolds()}};
function panelOn(id){var p=document.getElementById("p-"+id);return !!p&&p.classList.contains("on")}
function live(){
  updTabs();misTick();updBankBtn();updVenBtn();clampNotes();
  if(panelOn("staff"))updDash();
  if(panelOn("upg"))updTrees();
}
function safely(name,fn){try{fn()}catch(e){if(!errs[name]){errs[name]=1;if(window.console)console.error("ui refresh "+name+":",e)}}}
function structural(rs){
  for(var i=0;i<rs.length;i++){var ns=[].concat([].slice.call(rs[i].addedNodes),[].slice.call(rs[i].removedNodes));
    for(var j=0;j<ns.length;j++)if(ns[j].nodeType===1)return true}
  return false;
}
var panelObs=new MutationObserver(function(rs){if(structural(rs))DUE.panels=1});
document.querySelectorAll(".panel").forEach(function(p){panelObs.observe(p,{childList:true,subtree:true})});
onEv("menu",function(){DUE.recipes=1;DUE.stock=1});
onEv("stage",function(){DUE.expansion=1});
onEv("tab",function(){liveAt=0});
onEv("render",function(){
  if(structural(panelObs.takeRecords()))DUE.panels=1;   /* changes update() just made */
  var t=Date.now();
  if(t-liveAt>=500){liveAt=t;safely("live",live)}
  for(var k in DUE){delete DUE[k];safely(k,JOBS[k])}
  panelObs.takeRecords();                              /* our own edits are not news */
});
for(var k0 in JOBS)safely(k0,JOBS[k0]);
safely("live",live);
