/* ---------- starting a bar ---------- */
function checkUnlocks(){
  var nw=ITEMS.filter(function(r){return unlocked(r)&&S.known.indexOf(r.id)<0});
  if(!nw.length)return;
  nw.forEach(function(r){S.known.push(r.id);if(S.act[r.id]===undefined)S.act[r.id]=stagedPrice(r)});
  if(S.kits)emit("unlock",nw);
}
function usedIn(x){
  var n=REC.filter(function(r){return !r.s&&r.i.indexOf(x.id)>=0}).length;
  var s=n?"Used in "+n+(n>1?" recipes":" recipe"):"Special ingredient";
  return x.q?s+" and sold neat":s;
}
function beginRun(){
  S.ing={lemonjuice:1};S.ql={};S.brand={};S.stock={};S.bat={};S.auto={};S.par={};S.parCat={};S.notes=[];
  S.price={};S.act={};S.cprice={};
  addStock("lemonjuice",20);
  S.money=300;S.orders=[];S.jobs=[];S.arrive=2;S.sat=60;S.ctlT=15;menuChanged();
  S.kits=true;S.wkMig=1;
  applyPrices();
  checkUnlocks();
  S.newRec=false;
  toast("Your lemonade stand is open. Customers are ordering.");
  emit("save");
}

/* ---------- actions ---------- */
function unlockIng(id){
  var x=INGM[id],fee=x.c||0;
  if(x.raw||has(id)||S.money<fee||ingLock(x))return;
  S.money-=fee;
  if(TIERS[x.g])S.picks[x.g]=(S.picks[x.g]||0)+1;
  S.ing[id]=1;addStock(id,10);menuChanged();
  checkUnlocks();
}
function unlockTier(id,t){
  var x=INGM[id],fee=Math.round(QFEE[t]*x.u[0]);
  if(tierLock(x,t)||S.money<fee)return;
  S.money-=fee;S.ql[id]=t;addStock(skey(id,t),10);menuChanged();
  checkUnlocks();
}
function setPrice(id,v){if(isFinite(v)&&v>=0)S.price[id]=v}
function clearPrice(id){delete S.price[id]}
function copyHours(from){var m0=S.hours[from].slice();S.hours=S.hours.map(function(){return m0.slice()});HV++}
function startHappyHour(){
  var t=now();
  if(!S.kits||t<S.hhReady)return;
  S.hhUntil=t+30000*(1+0.5*lvl("hhour"));S.hhReady=t+120000;
}
function repayPart(a){S.money-=a;S.debt-=a;if(S.debt<0.5)S.debt=0}
function nameBar(v){S.barName=v}
function newGame(){S=def();TV++;menuChanged();recomputeMarket();emit("stage")}   /* TV++: shiftCounts() must forget the old team */
function cycleBrand(id){var ql=S.ql[id]||0;S.brand[id]=((S.brand[id]||0)+1)%(ql+1)}
function autoAssignClerk(){
  while(assignedCount()<clerkCap()){
    var best=null,bs=1e9;
    ING.forEach(function(x){
      if(!x.raw&&has(x.id)&&!S.auto[x.id]&&!(x.pre&&chefActive())){var st=S.stock[x.id]||0;if(st<bs){bs=st;best=x.id}}
    });
    if(!best)break;
    S.auto[best]=true;
  }
}
function toggleClerk(id){
  if(S.auto[id]){delete S.auto[id];return}
  if(assignedCount()>=clerkCap()){toast("Every clerk is busy. Hire a clerk or upgrade one in Team.");return}
  S.auto[id]=true;
}
function upgradeClerk(e){
  var lv=e.cl||1;
  if(e.role!=="clerk"||lv>=3)return;
  var c=CLERK_UP[lv-1];if(S.money<c)return;
  S.money-=c;e.cl=lv+1;TV++;
  autoAssignClerk();
}
function pickName(){
  var used={};S.team.forEach(function(e){used[e.name]=1});
  var free=NAMES.filter(function(n){return !used[n]}),src=free.length?free:NAMES;
  return src[Math.floor(random()*src.length)];
}
function genCand(role){
  var r=STAFFM[role],ns=skillNames(role).length;
  var lv=wpick([0,1,2],function(x){return x===0?70:x===1?25:5});
  var expect=ns===3?[7,9,11]:[4,6,8];
  var budget=expect[lv]+Math.floor(random()*3)-1;
  var sk=[],i;for(i=0;i<ns;i++)sk.push(1);
  var sum=ns,guard=0;
  while(sum<budget&&guard++<60){var j=Math.floor(random()*ns);if(sk[j]<5){sk[j]++;sum++}}
  var prem=1+0.04*(sum-expect[lv]);
  var wage=Math.round(r.w*wk()*LVLM[lv]*prem*clamp(1.25-0.5*S.mood/100,0.75,1.25)*(0.93+random()*0.14)/10)*10;
  return{name:pickName(),role:role,lvl:lv,sk:sk,wage:wage,fee:Math.round(wage*HIRE)};
}
/* today's three candidates for a role, drawn once a day */
function candsToday(role){
  var c=S.cands[role];
  if(!c||c.day!==gDay()||!c.list.length)S.cands[role]=c={day:gDay(),list:[genCand(role),genCand(role),genCand(role)]};
  return c;
}
function hireCand(role,i){
  var c=S.cands[role],cd=c&&c.list[i];if(!cd)return;
  if(S.money<cd.fee){toast("You need "+money0(cd.fee)+" to hire "+cd.name+".");return}
  S.money-=cd.fee;
  var before={};for(var tr in TIERS)before[tr]=picksTotal(tr);
  var e={id:S.nextEmp++,name:cd.name,role:role,lvl:cd.lvl,xp:LVLXP[cd.lvl],sk:cd.sk.slice(),wage:cd.wage,cl:1};
  if(S.exp===0&&(role==="cashier"||role==="clerk")&&!(S.starter&&S.starter[role])){S.starter=S.starter||{};S.starter[role]=1;e.wage=Math.round(e.wage/2/10)*10;e.starter=99}
  S.team.push(e);c.list.splice(i,1);
  syncStaff();
  if(role==="clerk")autoAssignClerk();
  emit("hired",e);
  var pk=false;for(var t2 in TIERS){if(picksTotal(t2)>before[t2])pk=true}
  toast(cd.name+" joined the team."+(e.starter?" Starter deal: half wage until you leave the stand.":"")+(pk?" New ingredient pick! Open Stock.":""));
}
function levelUp(e){
  if(e.lvl>=2||e.xp<LVLXP[e.lvl+1])return;
  var nw=Math.round(e.wage*LVLM[e.lvl+1]/LVLM[e.lvl]/10)*10;
  e.wage=nw;e.lvl++;S.moodB+=8;TV++;
  toast(e.name+" is now "+LVLN[e.lvl].toLowerCase()+". New wage "+money0(nw)+" a month.");
}
function nextRole(e){var i=LADDER.indexOf(e.role);return i>=0&&i<LADDER.length-1?LADDER[i+1]:null}
function promoWage(e,next){
  var sum=0;e.sk.forEach(function(v){sum+=v});
  return Math.round(Math.max(e.wage*1.1,STAFFM[next].w*wk()*(1+0.03*(sum-9)))/10)*10;
}
function promoteRole(e){
  var next=nextRole(e);
  if(!next||e.lvl<2||e.xp<PROMXP||!roleUnlocked(next)||(S.staff[next]||0)>=baseLimit(next))return;
  e.wage=promoWage(e,next);e.role=next;e.lvl=0;e.xp=0;
  S.moodB+=10;syncStaff();
  toast(e.name+" was promoted to "+STAFFM[next].n.toLowerCase()+". New wage "+money0(e.wage)+" a month.");
}
function trainCostOf(e,i){return Math.round(e.wage*0.4*e.sk[i])}
function trainSkill(e,i){
  if(e.sk[i]>=5)return;
  var c=trainCostOf(e,i);if(S.money<c)return;
  S.money-=c;e.sk[i]++;S.moodB+=1;TV++;
}
function raiseWage(e){e.wage=Math.round(e.wage*1.1/10)*10;S.moodB+=3;TV++}
function buyExp(){var nx=EXPS[S.exp+1];if(!nx)return;var c=expCost(nx);if(S.money<c)return;if(S.debt>0.25*c){toast("The bank will not let you expand while you owe "+money0(S.debt)+". Pay the debt down first.");return}S.money-=c;var k0=wk();S.exp++;S.expAt=S.mcount;var ratio=wk()/k0;S.team.forEach(function(e){if(e.starter){e.wage=e.wage*2;delete e.starter}});if(ratio>1)S.team.forEach(function(e){e.wage=Math.round(e.wage*ratio/10)*10});emit("stage");toast("Expanded to "+nx.n.toLowerCase()+". Rent is now "+money0(nx.rent)+" a month. Room for "+staffCap()+" staff, and wages rise with the venue.")}

/* tree nodes */
function nLevel(n){return n.kind==="upg"?(S.upg[n.id]?1:0):n.kind==="train"?(S.train[n.role]||0):lvl(n.id)}
function nMax(n){return n.kind==="upg"?1:n.kind==="train"?3:n.max}
function nCost(n,l){return n.kind==="train"?trainCost(STAFFM[n.role],l):n.cost[l]}
function costText(n,l){var c=nCost(n,l);return n.kind==="perm"?c+(c>1?" pts":" pt"):eur(c)}
function canPay(n,l){var c=nCost(n,l);return n.kind==="perm"?S.pts>=c:S.money>=c}
function nReqMet(n){
  var ok=(n.req||[]).every(function(id){return nLevel(NODEMAP[id])>=1});
  if(n.kind==="train"&&(S.staff[n.role]||0)<1)ok=false;
  return ok;
}
function nReqText(n){
  var p=(n.req||[]).filter(function(id){return nLevel(NODEMAP[id])<1}).map(function(id){return NODEMAP[id].n});
  if(n.kind==="train"&&(S.staff[n.role]||0)<1)p.push("hire 1 "+STAFFM[n.role].n.toLowerCase());
  return p.join(" and ");
}
function nBuy(n){
  var l=nLevel(n);
  if(l>=nMax(n)||!nReqMet(n)||!canPay(n,l))return;
  var c=nCost(n,l);
  if(n.kind==="perm"){S.pts-=c;S.perm[n.id]=l+1}
  else{S.money-=c;if(n.kind==="upg"){S.upg[n.id]=1;menuChanged();if(n.id==="kitchen")autoAssignClerk()}else{S.train[n.role]=l+1;trainToast(n.role)}}
}
function trainToast(role){
  for(var tk in TIERS){if(TIERS[tk].staff===role)toast("Training done: +"+TIERS[tk].per+" ingredient picks. Open Stock!")}
  ING.forEach(function(i){if(i.gs===role&&!TIERS[i.g]&&(S.train[role]||0)===i.gn)toast(i.n+" can now be unlocked (needs reputation "+i.rep+").")});
}


