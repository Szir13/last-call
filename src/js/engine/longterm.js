/* ---- seasons and weather: nothing is stored, both follow the calendar ---- */
var SEASONN=["Winter","Spring","Summer","Autumn"],WXN=["Sunny","Cloudy","Rainy","Snowy"];
function seasonOf(day){var m=dateOf(day).m;return (m===11||m<2)?0:(m<5?1:(m<8?2:3))}
function weatherOf(day){
  var P=[[0.28,0.30,0.30,0.12],[0.45,0.30,0.25,0],[0.70,0.18,0.12,0],[0.40,0.30,0.30,0]][seasonOf(day)],r=rnd(day*5.77+1.3),acc=0;
  for(var t=0;t<4;t++){acc+=P[t];if(r<=acc)return t}
  return 0;
}

/* ---- themed nights ---- */
var NIGHTS={
  live:{n:"Live music",k:0.08,per:{3:1.45,4:1.35},type:{"Couple":1.6,"Regular":1.3,"Tourist":1.2},fam:{Classic:1.2},sat:4},
  quiz:{n:"Quiz night",k:0.06,per:{3:1.4},type:{"Office crowd":1.7,"Party crowd":1.2},fam:{},sat:3},
  cocktail:{n:"Cocktail night",k:0.09,per:{3:1.3,4:1.25},type:{"Food critic":1.8,"Couple":1.3},fam:{Classic:1.4,Sour:1.4,Tropical:1.3},sat:5}
};
function nightCost(t){return ic(NIGHTS[t].k)}
function bookNight(day,t){
  S.nights=S.nights||{};
  if(S.nights[day]||!NIGHTS[t])return false;
  var c=nightCost(t);if(S.money<c)return false;
  S.money-=c;S.month.cogs+=c;S.nights[day]=t;FXC.day=-1;
  return true;
}
function addMod(days,dem,sat){(S.mods=S.mods||[]).push({from:gDay(),until:gDay()+days-1,dem:dem,sat:sat||0});FXC.day=-1}

/* ---- Bar Guide: a monthly star rating ---- */
function guideStars(){return S.guide?S.guide.stars:2}
function guideCalc(){
  var m=S.month,gn=Math.max(1,m.gn||0),sat=(m.gs||0)/gn,pr=(m.gp||0)/gn;
  var comp={sat:clamp(sat/100,0,1),price:clamp(pr/100,0,1),menu:Math.min(1,mi().list.length/MENUREF[S.exp]),rep:Math.min(1,repLevel()/8),style:Math.min(1,stylePts()/11)};
  return {comp:comp,score:0.32*comp.sat+0.22*comp.price+0.18*comp.menu+0.14*comp.rep+0.14*comp.style};
}
function guideUpdate(){
  var gc=guideCalc(),prev=S.guide?S.guide.score:gc.score,sc=0.5*prev+0.5*gc.score;
  S.guide={score:sc,stars:Math.max(0,Math.min(5,Math.round(sc*6.2-0.7))),comp:gc.comp,month:S.mcount};
}

/* ---- regulars: guests who come back, with a favourite drink and a bond with the bar ---- */
var REGN=["Ana","Rui","Marta","Tiago","Ines","Carlos","Bea","Nuno","Sofia","Joao","Rita","Pedro","Lena","Hugo","Clara","Diogo","Maya","Tomas","Vera","Leo","Nina","Dario"];
function regCap(){return [2,4,6,9,12][S.exp]||2}
function regOf(id){var a=S.reg||[];for(var i=0;i<a.length;i++){if(a[i].id===id)return a[i]}return null}
function bondOf(id){var r=regOf(id);return r?r.bond:0}
function regBond(id,d){var r=regOf(id);if(r)r.bond=clamp(r.bond+d,0,100)}
function custByName(n){for(var i=0;i<CUST.length;i++){if(CUST[i].n===n)return CUST[i]}return CUST[0]}
function pickRegular(){
  if(!S.reg||!S.reg.length)return null;
  if(random()>Math.min(0.5,0.05*S.reg.length*(1+0.1*(guideStars()-2))))return null;
  var busy={},d=gDay();
  S.orders.forEach(function(o){if(o.rid)busy[o.rid]=1});(S.hold||[]).forEach(function(x){if(x.rid)busy[x.rid]=1});
  var pool=S.reg.filter(function(r){return !busy[r.id]&&r.last<d});
  if(!pool.length)return null;
  return wpick(pool,function(r){return 1+r.bond/50});
}
function regAfterServe(o){
  if(!S.reg)S.reg=[];
  if(o.rid){var r=regOf(o.rid);if(r){r.visits++;r.bond=clamp(r.bond+(o.sat>=70?6:(o.sat<45?-10:1)),0,100)}return}
  if(o.sat>=85&&(o.re||0)===0&&S.reg.length<regCap()&&random()<0.05+0.10*clamp((floorAvg(2)-1)/4,0,1)){
    var used={};S.reg.forEach(function(x){used[x.name]=1});
    var free=REGN.filter(function(n){return !used[n]});if(!free.length)return;
    var nm=free[Math.floor(random()*free.length)];
    S.reg.push({id:(S.nextReg=(S.nextReg||0)+1),name:nm,type:o.who,cls:o.cls,fav:o.items[0]?o.items[0].r:null,bond:20,visits:1,last:gDay()});
    toast(nm+" liked it here and became a regular.");
  }
}

/* ---- decor and style ---- */
var DECOR=[
  {id:"bunting",n:"String lights",k:0.15,pts:1},
  {id:"plant",n:"Potted plants",k:0.12,pts:1},
  {id:"lamp",n:"Floor lamp",k:0.15,pts:1},
  {id:"neon",n:"Neon sign",k:0.5,pts:2},
  {id:"trophy",n:"Trophy case",k:0.8,pts:3},
  {id:"jukebox",n:"Jukebox",k:1.0,pts:3}
];
var THEMES={
  classic:{n:"Classic",w:"BAR",c:"#ffd36a",type:{"Business traveler":1.2,"Food critic":1.2,"Couple":1.1},fam:{Classic:1.15},d:"Business travellers, critics and couples."},
  tiki:{n:"Tiki",w:"TIKI",c:"#6fe0a8",type:{"Tourist":1.35,"Party crowd":1.15},fam:{Tropical:1.3},d:"Tourists, party crowds and tropical drinks."},
  jazz:{n:"Jazz",w:"JAZZ",c:"#8fb4ff",type:{"Couple":1.3,"Regular":1.2,"Night owl":1.2},fam:{Classic:1.2,Neat:1.15},d:"Couples, regulars, night owls and neat spirits."},
  retro:{n:"Retro",w:"RETRO",c:"#ff9a5a",type:{"Commuter":1.2,"Regular":1.25,"Office crowd":1.15},fam:{Beer:1.25,Soft:1.1},d:"Commuters, the office crowd and beer."},
  neon:{n:"Neon",w:"NEON",c:"#ff5ad8",type:{"Party crowd":1.35,"Night owl":1.25},fam:{Party:1.3,Sour:1.1},d:"Party crowds, night owls and party drinks."}
};
function stylePts(){var n=0;if(S.deco&&S.deco.items)DECOR.forEach(function(d){if(S.deco.items[d.id])n+=d.pts});return n}
function styleSat(){return Math.min(4,0.35*stylePts())}
function decorCost(d){return Math.max(10,Math.round(d.k*dRev()*3/10)*10)}
function themeType(n){var t=S.deco&&S.deco.theme&&THEMES[S.deco.theme];return (t&&t.type[n])||1}
function themeFam(f){var t=S.deco&&S.deco.theme&&THEMES[S.deco.theme];return (t&&t.fam[f])||1}
function themeCost(){return (S.deco&&S.deco.theme)?ic(0.4):0}
function setTheme(id){
  if(!THEMES[id])return false;
  var c=themeCost();if(S.money<c)return false;
  S.money-=c;S.deco=S.deco||{items:{}};S.deco.theme=id;return true;
}
function buyDecor(id){
  var d=null;DECOR.forEach(function(x){if(x.id===id)d=x});if(!d)return false;
  S.deco=S.deco||{items:{}};if(S.deco.items[id])return false;
  var c=decorCost(d);if(S.money<c)return false;
  S.money-=c;S.deco.items[id]=1;return true;
}

/* ---- suppliers ---- */
var SUPS={
  spot:{n:"Spot market",d:"Buy at the daily market price. No commitments."},
  contract:{n:"3-month contract",d:"Prices are frozen at 97% of today's market for 84 days. Great when prices climb, a loss when they fall."},
  volume:{n:"Volume deal",d:"8% off everything, but you owe half of the shortfall if a month's purchases fall below the commitment."},
  premium:{n:"Premium supplier",d:"Prices are 12% higher, but fresher produce leaves guests a little happier (+2 satisfaction)."}
};
function supMode(){return (S.sup&&S.sup.mode)||"spot"}
function volCommit(){return Math.round(dRev()*28*0.05/100)*100}
function supSet(mode){
  if(!SUPS[mode]||mode===supMode())return false;
  if(supMode()==="contract"&&gDay()<S.sup.until)return false;   /* a contract has to run its course */
  var o={mode:mode};
  if(mode==="contract"){
    o.until=gDay()+84;o.lk={};
    for(var id in INGM){var key=RAWOF[id]||id;if(o.lk[key]===undefined)o.lk[key]=(MK[key]||1)*0.97}
  }
  S.sup=o;return true;
}

/* ---- incidents: a surprise with a choice ---- */
function loseStock(f){for(var k in S.stock){S.stock[k]=Math.floor((S.stock[k]||0)*(1-f))}}
function incIng(){return S.inc&&S.inc.ing?INGM[S.inc.ing]:null}
function shortCost(f){var x=incIng();return x?Math.round(40*unitCost(x,0)*f/10)*10:0}
var INCS=[
  {id:"fridge",from:1,t:"The fridge broke down",x:"The cold room stopped overnight and the stock is warming up.",o:[
    {l:"Emergency repair",c:function(){return ic(0.07)},r:function(){return "The technician saved the stock. Nothing was lost."}},
    {l:"Wait for the technician",c:function(){return 0},r:function(){loseStock(0.35);return "A third of your stock spoiled before it was fixed."}},
    {l:"Let your manager handle it",role:"manager",c:function(){return ic(0.035)},r:function(){loseStock(0.1);return "Your manager sorted it out quickly. Only a little was lost."}}]},
  {id:"inspect",from:2,t:"Health inspection",x:"An inspector walked in and wants to see the kitchen.",o:[
    {l:"Deep clean right now",c:function(){return ic(0.04)},r:function(){addRep(3);return "Spotless. The inspector left a glowing note."}},
    {l:"Carry on as usual",c:function(){return 0},r:function(){var p=clamp(0.35+0.1*(guideStars()-2)+(hasRole("manager")?0.15:0),0.15,0.9);if(random()<p){addRep(2);return "You passed without drama."}var f=Math.min(S.money,ic(0.12));S.money-=f;addRep(-10);return "You failed the inspection: "+money0(f)+" in fines and a dent in your reputation."}},
    {l:"Let your cost controller handle it",role:"controller",c:function(){return ic(0.02)},r:function(){if(random()<0.85){addRep(2);return "The paperwork was perfect. You passed."}addRep(-4);return "A minor fail, but the controller limited the damage."}}]},
  {id:"review",from:1,t:"A bad review is spreading",x:"A guest posted a harsh review of the bar and people are sharing it.",o:[
    {l:"Reply graciously",c:function(){return 0},r:function(){var p=clamp(0.3+0.12*(floorAvg(2)-1),0.2,0.85);if(random()<p){addRep(2);return "Your kind reply won people over. The review turned into praise."}addRep(-4);return "The reply did not land and your reputation took a hit."}},
    {l:"Ignore it",c:function(){return 0},r:function(){addRep(-5);addMod(3,0.92,0);return "It stung: fewer guests for a few days."}},
    {l:"Offer a free round to apologise",c:function(){return ic(0.03)},r:function(){addMod(3,1,5);return "The gesture calmed things down and guests left happier."}}]},
  {id:"shortage",from:1,t:"Supplier shortage",x:"Your supplier cannot deliver one of your ingredients this week.",o:[
    {l:"Emergency order at a premium",c:function(){return shortCost(1.6)},r:function(){var x=incIng();if(x)addStock(x.id,40);return "A rush delivery arrived: 40 units on the shelf."}},
    {l:"Do without for a few days",c:function(){return 0},r:function(){var x=incIng();if(x){S.ban=S.ban||{};S.ban[x.id]=gDay()+3;S.stock[x.id]=0}return "Drinks that need it are off the menu until the supplier recovers."}},
    {l:"Let your clerk negotiate",role:"clerk",c:function(){return shortCost(1.15)},r:function(){var x=incIng();if(x)addStock(x.id,40);return "Your clerk found another supplier at a fair price."}}]},
  {id:"power",from:2,t:"Power cut",x:"The lights went out across the street and your bar is dark.",o:[
    {l:"Rent a generator",c:function(){return ic(0.05)},r:function(){return "The generator kept everything running."}},
    {l:"Serve by candlelight",c:function(){return 0},r:function(){addMod(1,0.8,4);return "Fewer guests came, but the mood was lovely."}}]},
  {id:"viral",from:1,t:"Your bar is trending",x:"A photo of your bar is going round the internet.",o:[
    {l:"Run a quick promotion",c:function(){return ic(0.04)},r:function(){addMod(3,1.45,0);return "The promotion turned the buzz into a crowd for three days."}},
    {l:"Let it ride",c:function(){return 0},r:function(){addMod(2,1.2,0);return "A few more curious guests came through."}}]}
];
function incById(id){for(var i=0;i<INCS.length;i++){if(INCS[i].id===id)return INCS[i]}return null}
function rollIncident(quiet){
  if(S.inc||S.served<30||S.mcount<1)return;
  if(random()>0.08+0.01*S.exp)return;
  var pool=INCS.filter(function(i){return S.exp>=i.from});
  if(!pool.length)return;
  var inc=pool[Math.floor(random()*pool.length)];
  S.inc={id:inc.id};
  if(inc.id==="shortage"){
    var own=ING.filter(function(x){return S.ing[x.id]&&!x.raw});
    if(!own.length){S.inc=null;return}
    S.inc.ing=own[Math.floor(random()*own.length)].id;
  }
  if(quiet)resolveInc(null,true);
}
function incOptions(inc){return inc.o.filter(function(op){return !op.role||hasRole(op.role)})}
function resolveInc(i,auto){
  var inc=incById(S.inc.id),ops=incOptions(inc),op=null;
  if(i===null){for(var k=0;k<ops.length;k++){if(ops[k].c()===0){op=ops[k];break}}if(!op)op=ops[0]}else op=ops[i];
  var c=op.c();
  if(c>S.money&&c>0)return null;
  S.money-=c;S.month.cogs+=c;
  var text=op.r();
  S.inc=null;
  if(auto){S.notes=S.notes||[]}
  return text;
}

/* ---- rowdy guests ---- */
function rowdyChance(cust,per){
  var base=0.006*(cust.n==="Party crowd"?3:cust.n==="Night owl"?2.5:cust.n==="Tourist"?1.3:0.6)*(per===4?1.6:1);
  var g=shiftCounts().security||0;
  return base*(1-Math.min(0.6,0.3*g));
}
function dropQuiet(o){
  var ix=S.orders.indexOf(o);if(ix>=0)S.orders.splice(ix,1);
  S.jobs=S.jobs.filter(function(j){return j.o!==o.id});o.gone=true;
}
function rowdyEscalate(o,quiet){
  var f=Math.min(S.money,ic(0.04));S.money-=f;S.month.cogs+=f;addRep(-1.5,true);
  S.orders.forEach(function(n){if(n!==o&&Math.abs(n.slot-o.slot)<=1&&!n.ready)n.left*=0.6});
  o.rowdy=false;S.walkouts++;addSat(0);msStreakBreak();dropQuiet(o);
  if(!quiet)toast("A rowdy guest made a scene: "+money0(f)+" in damages.");
}
function rowdyStep(o,dt,quiet){
  o.rt=(o.rt||0)+dt;
  if((shiftCounts().security||0)>0&&o.rt>5){o.rowdy=false;S.calmed=(S.calmed||0)+1;return}
  if(o.rt>25)rowdyEscalate(o,quiet);
}
function rowdyCalmChance(){return clamp(0.35+0.15*(floorAvg(2)-1),0.2,0.9)}
function calmRowdy(o){
  if(random()<rowdyCalmChance()){o.rowdy=false;toast("You talked them round.");return true}
  rowdyEscalate(o,false);return false;
}
function escortRowdy(o){o.rowdy=false;dropQuiet(o);toast("You showed them out politely. No harm done.")}

/* ---- branches and legacy: what comes after the global chain ---- */
function branchActive(){return Math.min((S.br||[]).length,S.staff.ambassador||0)}
function branchIncome(){
  var inc=0,act=branchActive();
  (S.br||[]).slice(0,act).forEach(function(id){CITIES.forEach(function(c){if(c.id===id)inc+=BRANCH_SHARE*HQP*c.k*(0.7+0.06*guideStars())})});
  return Math.round(inc);
}
function openBranch(id){
  var c=null;CITIES.forEach(function(x){if(x.id===id)c=x});
  S.br=S.br||[];
  if(!c||S.exp<4||S.br.indexOf(id)>=0||S.money<c.cost)return false;
  S.money-=c.cost;S.br.push(id);return true;
}
function legacyPoints(){return Math.floor(Math.sqrt(S.totalEarned/250000))+3*(S.br?S.br.length:0)}
function canRetire(){return S.exp>=4&&S.totalEarned>=3000000}
var LEGP=[
  {id:"seed",n:"Seed money",d:"Start each new bar with +$2,500 per level.",max:5,cost:[2,3,4,6,8]},
  {id:"crew",n:"Loyal crew",d:"New hires ask 4% less in wages, per level.",max:5,cost:[2,3,4,6,8]},
  {id:"fame",n:"Famous name",d:"Every order pays 4% more, per level.",max:5,cost:[3,4,6,8,12]},
  {id:"estate",n:"Real estate",d:"Expansions cost 8% less, per level.",max:5,cost:[3,4,6,8,12]},
  {id:"picks",n:"Insider tips",d:"+1 ingredient pick in every group, per level.",max:3,cost:[3,5,8]},
  {id:"recipes",n:"Recipe book",d:"Keep the recipes you learned when you start over.",max:1,cost:[4]}
];
function buyLeg(id){
  var p=null;LEGP.forEach(function(x){if(x.id===id)p=x});if(!p)return false;
  S.leg=S.leg||{pts:0,perks:{}};var l=legLvl(id);
  if(l>=p.max||S.leg.pts<p.cost[l])return false;
  S.leg.pts-=p.cost[l];S.leg.perks[id]=l+1;return true;
}
function retire(){
  var gain=legacyPoints(),perks=(S.leg&&S.leg.perks)||{},keepKnown=legLvl("recipes")?S.known.slice():[],seed=2500*legLvl("seed");
  var keep={perm:S.perm,pts:S.pts,ach:S.ach,leg:{pts:((S.leg&&S.leg.pts)||0)+gain,perks:perks},legacy:(S.legacy||0)+1,wkMig:1};
  S=Object.assign(def(),keep);
  S.known=keepKnown;
  beginRun();
  S.money=300+seed;
  emit("save");
}

function cleanLT(){
  var d=gDay();
  if(S.nights){for(var k in S.nights){if(+k<d-1)delete S.nights[k]}}
  if(S.mods)S.mods=S.mods.filter(function(m){return m.until>=d});
  if(S.ban){for(var b in S.ban){if(S.ban[b]<=d)delete S.ban[b]}}
}

