/* ---------- helpers ---------- */
var SUF=["","k","M","B","T","Qa","Qi","Sx","Sp"];
function fmt(n){
  if(!isFinite(n))return "∞";
  if(n<1000){return n<10?n.toFixed(2):n<100?n.toFixed(1):String(Math.floor(n))}
  var i=0;while(n>=1000&&i<SUF.length-1){n/=1000;i++}
  return (n<10?n.toFixed(2):n<100?n.toFixed(1):n.toFixed(0))+SUF[i];
}
function eur(n){return "$"+fmt(n)}
function money0(n){return "$"+Math.round(n).toLocaleString("en-US")}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lvl(id){return S.perm[id]||0}
function has(id){return !!S.ing[id]}
function teamSize(){return S.team.length}
function roleUnlocked(id){return !!S.upg[id==="prepchef"?"kitchen":id]}
function chefActive(){return !!S.upg.kitchen&&(S.staff.prepchef||0)>0}
function wpick(arr,wf){
  var t=0,i;for(i=0;i<arr.length;i++)t+=wf(arr[i]);
  var r=random()*t;
  for(i=0;i<arr.length;i++){r-=wf(arr[i]);if(r<=0)return arr[i]}
  return arr[arr.length-1];
}

/* stock keys: tier 0 is the plain id, better brands are id#1 and id#2 */
function skey(id,t){return t?id+"#"+t:id}
function baseId(key){var i=key.indexOf("#");return i<0?key:key.slice(0,i)}
function tierOfKey(key){var i=key.indexOf("#");return i<0?0:parseInt(key.slice(i+1),10)}
function tierName(x,t){
  if(x.id==="beer"||x.id==="wine")return x.tn[t];
  return t?x.tn[t]+" "+x.n.toLowerCase():x.n;
}
function keyName(key){return tierName(INGM[baseId(key)],tierOfKey(key)).toLowerCase()}
function shelfOf(key){return SHELF[baseId(key)]||0}
function brandOf(id){return Math.min(S.brand[id]||0,S.ql[id]||0)}
function addStock(key,n){
  S.stock[key]=(S.stock[key]||0)+n;
  if(shelfOf(key)){(S.bat[key]=S.bat[key]||[]).push({d:Math.floor(S.gt/1440),n:n})}
}
function takeStock(key,n){
  S.stock[key]=(S.stock[key]||0)-n;
  if(shelfOf(key)){
    var b=S.bat[key],r=n;
    if(b){while(r>0&&b.length){if(b[0].n>r){b[0].n-=r;r=0}else{r-=b[0].n;b.shift()}}}
  }
}
function spoil(quiet){
  var d=Math.floor(S.gt/1440),cost=0;
  for(var key in S.bat){
    var sh=shelfOf(key),b=S.bat[key],x=INGM[baseId(key)];
    while(b.length&&b[0].d+sh<=d){
      var n=b[0].n;b.shift();
      var care=empAvg("clerk",1),keep=care>0?0.06*(care-1)*n:0,saved=Math.floor(keep)+(random()<keep-Math.floor(keep)?1:0);
      if(saved>0){n=Math.max(0,n-saved);b.push({d:d,n:saved})}
      S.stock[key]=Math.max(0,(S.stock[key]||0)-n);
      cost+=n*(x.q?x.u[tierOfKey(key)]:x.u);
    }
  }
  if(cost>0){S.month.waste+=cost;if(!quiet&&cost>=5)toast("Spoiled stock: "+eur(cost))}
}

/* the menu: which drinks are on offer */
function unlocked(it){
  if(it.solo)return has(it.ing)&&(S.ql[it.ing]||0)>=it.tier;
  return it.i.every(has);
}
function itemKeys(it){
  if(it.solo)return [skey(it.ing,it.tier)];
  return it.i.map(function(id){return skey(id,INGM[id].q?brandOf(id):0)});
}
var MI=null;
function menuChanged(){MI=null;emit("menu")}   /* ingredients or menu changed: drop the cache, tell the UI */
function mi(){
  if(MI)return MI;
  var list=ITEMS.filter(unlocked),fam={};
  list.forEach(function(r){if(!r.solo&&r.f!=="Soft")fam[r.f]=(fam[r.f]||0)+1});
  var bf="",bn=0;for(var f in fam){if(fam[f]>bn){bn=fam[f];bf=f}}
  MI={list:list,bf:bf,bn:bn,spec:bn>=7?2:bn>=5?1.6:bn>=3?1.25:1};
  return MI;
}

/* market */
var MK={};
function recomputeMarket(){
  MK={};
  ING.forEach(function(x){
    var m=S.mkt.drift[x.id]||1;
    S.mkt.ev.forEach(function(e){if(e.ids==="all"||e.ids.indexOf(x.id)>=0)m*=e.f});
    eventsOn(gDay()).forEach(function(e){if(e.mk&&(e.mk.ids==="all"||e.mk.ids.indexOf(x.id)>=0))m*=e.mk.f});
    MK[x.id]=m;
  });
}
function mkt(id){
  var key=RAWOF[id]||id,base=MK[key]||1,m=supMode();
  if(m==="contract"&&S.sup.lk&&S.sup.lk[key]!==undefined)return S.sup.lk[key];
  if(m==="volume")return base*0.92;
  if(m==="premium")return base*1.12;
  return base;
}
function disc(){return 1-0.06*lvl("disc")-0.025*Math.max(0,roleSkill("clerk",0)-1)-0.025*Math.max(0,roleSkill("controller",0)-1)}
function unitCost(x,t){return (x.q?x.u[t||0]:x.u)*mkt(x.id)*disc()}
function effUnit(x,t){
  if(x.pre&&chefActive()){var raw=INGM[x.pre.raw];return raw.u*mkt(raw.id)*0.7*disc()/x.pre.y}
  return unitCost(x,t);
}
function itemCost(it){var c=0;itemKeys(it).forEach(function(k){c+=effUnit(INGM[baseId(k)],tierOfKey(k))});return c}
function costRatio(it){
  var a=0,b=0;
  itemKeys(it).forEach(function(k){var x=INGM[baseId(k)],u=x.q?x.u[tierOfKey(k)]:x.u;a+=u*mkt(x.id);b+=u});
  return a/b;
}

/* prices: value = what a drink is worth. fair = what customers accept today (follows ingredient costs).
   price = what you charge: your own number, the cost controller's, or the value you last set it to. */
function quality(it){
  if(it.solo)return 1;
  var s=0,n=0;
  it.i.forEach(function(id){if(INGM[id].q){s+=QV[brandOf(id)];n++}});
  return n?s/n:1;
}
function valueOf(it){
  var m=mi();
  var v=it.p*quality(it)*(S.upg.glass?1.2:1);
  if(!it.solo&&m.spec>1&&it.f===m.bf)v*=m.spec;
  return v;
}
function fairOf(it){return valueOf(it)*(0.6+0.4*costRatio(it))*(1+0.08*lvl("awards"))}
/* the price you set (or the controller sets) waits until the bar opens; priceOf is what is on the menu right now */
function stagedPrice(it){
  if(S.price[it.id]!==undefined)return S.price[it.id];
  if(S.staff.controller>0&&S.cprice[it.id]!==undefined)return S.cprice[it.id];
  return valueOf(it);
}
function priceOf(it){return S.act[it.id]!==undefined?S.act[it.id]:stagedPrice(it)}
function applyPrices(){ITEMS.forEach(function(it){S.act[it.id]=stagedPrice(it)})}
function ctlPrices(){
  if(onShift("controller")<1)return;
  var an=1+0.012*(roleSkill("controller",1)-1);
  ITEMS.forEach(function(it){if(unlocked(it))S.cprice[it.id]=fairOf(it)*an});
}
function demandFactor(q){return q<=1?1:Math.exp(-0.8*(q-1))}
function priceScore(q){return clamp(75-80*(q-1),0,100)}

/* reputation */
function repLevel(){return Math.floor(Math.sqrt(Math.max(0,S.rep)/25))}
function repName(L){return REPN[Math.min(L,REPN.length-1)]}
function addRep(x,quiet){
  var before=repLevel();
  S.rep=Math.max(0,S.rep+x);
  var after=repLevel();
  if(after>before){S.pts+=after-before;if(!quiet)toast("Reputation level "+after+": "+repName(after)+". +"+(after-before)+" perk point")}
}
function checkAch(quiet){
  ACH.forEach(function(a){
    if(!S.ach[a.id]&&a.ok()){S.ach[a.id]=1;addRep(a.r,quiet);if(!quiet)toast("Achievement: "+a.n+" (+"+a.r+" reputation)")}
  });
}
function repArrival(){return (1+0.04*repLevel())*(1+0.08*lvl("press"))}
function wealthShift(){return 0.12*repLevel()+0.3*lvl("vip")+0.05*(guideStars()-2)}

/* caps, perks and numbers */
function cap(){return S.upg.fridge3?FR_CAP[3]:S.upg.fridge2?FR_CAP[2]:S.upg.fridge1?FR_CAP[1]:FR_CAP[0]}
function tipScale(){return clamp(S.sat/70,0.3,1.5)}
function tipMax(){return ((S.upg.music?1:0.5)+0.25*lvl("tips"))*tipScale()*(1+0.04*(floorAvg(2)-2.5))}
function arrivalMult(){return clamp(0.5+0.5*S.sat/70,0.5,1.4)*repArrival()*(1+0.03*(guideStars()-2))*(1+0.005*stylePts())}
function expCost(nx){return Math.round(nx.c*(1-0.15*lvl("expand")-0.08*legLvl("estate")))}
function wageOf(e){return e.wage*(1-0.05*lvl("wage"))}
function trainCost(s,l){return Math.round(s.w*TRAIN_COST[l])}
function maxSlots(){return (SLOTBASE[S.exp]||3)+(SEATINC[S.exp]||1)*((S.upg.counter4?1:0)+(S.upg.counter5?1:0))}
function interval(){return EXPS[S.exp].int*(S.upg.lights?0.8:1)}
function prepTime(it){return it.solo?3:2+2*it.i.length}
function picksTotal(t){var c=TIERS[t],hired=(S.maxStaff[c.staff]||0)>=1,tot=(FREEP[t]||0)+(hired?c.base:0)+c.per*(S.train[c.staff]||0)+legLvl("picks");return Math.max(tot,S.picks[t]||0)}
function picksLeft(t){return picksTotal(t)-(S.picks[t]||0)}
function ingLock(x){
  var cfg=TIERS[x.g];
  if(cfg){
    if(picksLeft(x.g)>0)return "";
    if((S.maxStaff[cfg.staff]||0)<1)return cfg.base?"Hire your first "+STAFFM[cfg.staff].n.toLowerCase()+" to earn "+cfg.base+" picks.":"Hire a "+STAFFM[cfg.staff].n.toLowerCase()+", then train them for "+cfg.per+" picks.";
    if((S.train[cfg.staff]||0)<TRAIN_COST.length)return "No picks left. Train your "+STAFFM[cfg.staff].pl+" for "+cfg.per+" more.";
    return "No picks left.";
  }
  var parts=[];
  if(x.gs){var tl=S.train[x.gs]||0;if(tl<x.gn)parts.push(STAFFM[x.gs].pl+" trained to level "+x.gn+" ("+tl+"/"+x.gn+")")}
  if(x.rep&&repLevel()<x.rep)parts.push("reputation level "+x.rep);
  return parts.length?"Requires "+parts.join(" and "):"";
}
function tierLock(x,t){
  if(!has(x.id))return "Unlock the ingredient first.";
  var q=S.ql[x.id]||0;
  if(q>=t)return "";
  if(q<t-1)return "Unlock "+x.tn[t-1].toLowerCase()+" first.";
  if(repLevel()<QREP[t])return "Needs reputation level "+QREP[t]+".";
  return "";
}
function roleLimit(id){
  var room=Math.max(0,staffCap()-S.team.length);
  return Math.min(baseLimit(id),(S.staff[id]||0)+room);
}
function baseLimit(id){
  if(id==="cashier")return maxSlots();
  if(id==="clerk")return Math.min(12,Object.keys(S.ing).length);
  if(id==="prepchef")return 3;
  if(id==="controller")return 1;
  if(id==="security")return Math.min(3,S.exp+1);
  return Infinity;
}
function assignedCount(){var n=0;for(var k in S.auto){if(S.auto[k])n++}return n}
function clerkCap(){var c=0;S.team.forEach(function(e){if(e.role==="clerk")c+=(e.cl||1)});return c}
function parOf(id){return (S.staff.controller>0&&S.par[id]!==undefined)?Math.min(S.par[id],cap()):10}

