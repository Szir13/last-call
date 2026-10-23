/* ---------- the order engine ---------- */
var T=0,recent=[],wasOpen=true;
function earn(a){recent.push({t:T,a:a})}
function addSat(s){S.sat=S.sat*0.88+s*0.12}
function findOrder(id){for(var i=0;i<S.orders.length;i++){if(S.orders[i].id===id)return S.orders[i]}return null}
function jobFor(oid,idx){for(var j=0;j<S.jobs.length;j++){if(S.jobs[j].o===oid&&S.jobs[j].i===idx)return S.jobs[j]}return null}
function missingOf(it){
  var ks=itemKeys(it);
  for(var k=0;k<ks.length;k++){if((S.stock[ks[k]]||0)<1)return ks[k]}
  return null;
}
function workers(){
  var w=[1];
  var perf=perfMult();
  shiftCounts().emps.forEach(function(e){
    var st=STAFFM[e.role];
    if(st.sp)w.push(st.sp*Math.pow(2,S.train[e.role]||0)*(0.8+0.1*e.sk[1])*perf);
  });
  var mult=1+0.25*lvl("speed");
  w.sort(function(a,b){return b-a});
  return w.map(function(x){return x*mult});
}
var LINGER=[8,12,16,18,20];   /* seconds a served customer stays seated, by venue */
function lingerTime(){return LINGER[S.exp]*(0.7+Math.random()*0.6)}
function freeSlot(){
  var used={};S.orders.forEach(function(o){used[o.slot]=1});
  (S.hold||[]).forEach(function(hd){used[hd.slot]=1});
  for(var i=0;i<maxSlots();i++){if(!used[i])return i}
  return -1;
}
function demandCls(o){return WTP[o.cls]}
function spawnOrder(re){
  var m=mi();if(!m.list.length)return;
  if(!re){var rg=pickRegular();if(rg)re={cust:custByName(rg.type),cls:rg.cls,rid:rg.id,fav:rg.fav,reg:rg}}
  var slot=(re&&re.slot!==undefined)?re.slot:freeSlot();if(slot<0)return;
  var fx=fxNow(),per=periodOf(gHour());
  var cust=re?re.cust:wpick(CUST,function(c){return c.w[per]*(fx.type[c.n]||1)*(c.n==="Food critic"&&lvl("critics")?2:1)*themeType(c.n)*(c.n==="Food critic"?1+0.25*(guideStars()-2):1)});
  var cls=re?re.cls:clamp(Math.floor(cust.wb+wealthShift()+(Math.random()-0.5)*1.4+0.5),0,3);
  var want=1+Math.floor(Math.random()*(EXPS[S.exp].k+(S.upg.table?1:0)+(cust.bi||0)));
  var items=[],know=1+0.12*(floorAvg(0)-1);
  for(var i=0;i<want;i++){
    var it=(re&&re.fav&&i===0&&ITM[re.fav]&&m.list.indexOf(ITM[re.fav])>=0)?ITM[re.fav]:wpick(m.list,function(x){
      var w=Math.pow(x.p,0.6)*((cust.pref&&cust.pref[x.f])||1)*(fx.fam[x.f]||1)*themeFam(x.f);
      if(x.solo)w*=0.5*TP[cls][x.tier];
      if(x.solo?x.tier>=1:quality(x)>1)w*=know;   /* knowledgeable staff recommend better brands */
      return w;
    });
    var q=priceOf(it)/(fairOf(it)*WTP[cls]);
    if((re&&re.rid&&i===0)||Math.random()<demandFactor(q))items.push({r:it.id,done:false});
  }
  if(!items.length){if(!re)addSat(15);return}   /* too expensive: the customer walks away */
  var n=items.length;
  var pat=cust.pat*(S.upg.seats?1.5:1)*(1+0.2*lvl("patience"))*(1+0.1*(n-1));
  var od={id:S.nextId++,cid:re?re.cid:undefined,re:re&&re.n?re.n:0,rid:re?re.rid:undefined,slot:slot,who:cust.n,m:cust.m,cls:cls,items:items,pat:pat,left:pat,ready:false,reward:0,sat:0};
  if(per>=3&&!(re&&re.n)&&Math.random()<rowdyChance(cust,per)){od.rowdy=true;od.rt=0}
  S.orders.push(od);
  if(re&&re.reg)re.reg.last=gDay();
}
function orderBase(o){var b=0;o.items.forEach(function(it){b+=priceOf(ITM[it.r])});return b}
function maxReward(o){return orderBase(o)*(1+tipMax()*o.m)}
function finishOrder(o){
  o.ready=true;
  var b=0,ps=0;
  o.items.forEach(function(it){
    var r=ITM[it.r],pr=priceOf(r);
    b+=pr;ps+=priceScore(pr/(fairOf(r)*WTP[o.cls]));
    if(r.solo){if(r.tier>=1)S.sold.p=true;if(r.tier>=2)S.sold.u=true}
  });
  ps/=o.items.length;
  var frac=Math.max(0,o.left/o.pat);
  o.sat=0.6*ps+0.4*(40+60*frac);
  var ce=cashierAt(o.slot);
  o.sat=clamp(o.sat+4*(floorAvg(2)-2.5)*perfMult()+(ce?2.5*(ce.sk[0]-1):0)+(fxNow().sat||0)+styleSat()+(supMode()==="premium"?2:0),0,100);
  addSat(o.sat);
  S.month.gs=(S.month.gs||0)+o.sat;S.month.gn=(S.month.gn||0)+1;S.month.gp=(S.month.gp||0)+ps;
  o.reward=b*(1+tipMax()*frac*o.m)*(ce?1+0.02*ce.sk[1]:1)*(o.rid?1+bondOf(o.rid)/300:1)*(1+0.04*legLvl("fame"));
  if(ce)collect(o);
}
var MAXRE=3;   /* a happy customer can ask for another round up to this many times */
function reorderChance(o){
  var rc=o.re||0;if(rc>=MAXRE)return 0;
  var hosp=clamp((floorAvg(2)-1)/4,0,1),ce=cashierAt(o.slot),charm=ce?clamp((ce.sk[0]-1)/4,0,1):0;
  var satF=clamp((o.sat-55)/45,0,1);
  return clamp(satF*(0.10+0.25*hosp+0.20*charm+(o.rid?bondOf(o.rid)/500:0))*Math.pow(0.75,rc),0,0.6);
}
function collect(o){
  var ix=S.orders.indexOf(o);if(ix<0)return;
  S.orders.splice(ix,1);
  S.money+=o.reward;S.totalEarned+=o.reward;S.served++;
  S.dayE+=o.reward;S.dayN++;S.month.rev+=o.reward;
  earn(o.reward);
  msProgress(o);
  regAfterServe(o);
  var again=Math.random()<reorderChance(o);
  if(again)S.reorders=(S.reorders||0)+1;
  (S.hold=S.hold||[]).push({slot:o.slot,left:again?4+Math.random()*5:lingerTime(),id:o.cid||o.id,who:o.who,cls:o.cls,rid:o.rid,drink:o.items&&o.items[0]?o.items[0].r:null,again:again,re:(o.re||0)+1});
}
function dropOrder(o){
  msStreakBreak();
  var ix=S.orders.indexOf(o);if(ix>=0)S.orders.splice(ix,1);
  S.jobs=S.jobs.filter(function(j){return j.o!==o.id});
}
function startJob(){
  for(var a=0;a<S.orders.length;a++){
    var o=S.orders[a];if(o.ready)continue;
    for(var b=0;b<o.items.length;b++){
      var it=o.items[b];if(it.done||jobFor(o.id,b))continue;
      var r=ITM[it.r];
      if(missingOf(r)===null){
        itemKeys(r).forEach(function(k){takeStock(k,1)});
        S.jobs.push({o:o.id,i:b,p:0});
        return true;
      }
    }
  }
  return false;
}
function buyStock(id,t){
  if(S.ban&&S.ban[id]>gDay())return false;
  var x=INGM[id],tt2=t||0,key=skey(id,tt2),st=S.stock[key]||0,units=Math.min(10,cap()-st);
  if(units<=0)return false;
  var cost=units*unitCost(x,tt2);
  if(S.money<cost)return false;
  S.money-=cost;S.month.cogs+=cost;addStock(key,units);
  return true;
}
function buyBulk(raw){
  var cp=cap()*2,st=S.stock[raw.id]||0,units=Math.min(30,cp-st);
  if(units<=0)return false;
  var cost=units*raw.u*mkt(raw.id)*0.7*disc();
  if(S.money<cost)return false;
  S.money-=cost;S.month.cogs+=cost;addStock(raw.id,units);
  return true;
}
/* the prep chef turns raw produce into syrup and juices */
function chefTick(dt){
  var n=onShift("prepchef");
  if(!n||!S.upg.kitchen)return;
  S.chefB=Math.min(24,(S.chefB||0)+n*0.6*dt*(1+0.1*(roleSkill("prepchef",1)-1))*perfMult());
  ING.forEach(function(x){
    if(!x.pre||!has(x.id))return;
    var guard=0;
    while(guard++<6&&(S.stock[x.id]||0)<24&&S.chefB>=x.pre.y){
      var raw=INGM[x.pre.raw];
      if((S.stock[raw.id]||0)<1&&!buyBulk(raw))break;
      var y=x.pre.y*(1+0.08*(roleSkill("prepchef",0)-1)),yu=Math.floor(y)+(Math.random()<y-Math.floor(y)?1:0);
      takeStock(raw.id,1);addStock(x.id,yu);S.chefB-=x.pre.y;
    }
  });
}

function relevantId(id){
  if(has(id))return true;
  return ING.some(function(x){return x.pre&&x.pre.raw===id&&has(x.id)});
}
/* market: slow drift plus news events */
function tickMarket(dt,quiet){
  var M=S.mkt,changed=false;
  M.t20-=dt;
  if(M.t20<=0){
    M.t20=20;
    ING.forEach(function(x){
      var d=M.drift[x.id]||1;
      d+=(1-d)*0.15+(Math.random()-0.5)*0.08;
      M.drift[x.id]=clamp(d,0.75,1.35);
    });
    changed=true;
  }
  for(var i=M.ev.length-1;i>=0;i--){
    M.ev[i].left-=dt;
    if(M.ev[i].left<=0){M.ev.splice(i,1);changed=true}
  }
  M.next-=dt;
  if(M.next<=0){
    M.next=100+Math.random()*100;
    if(M.ev.length<3){
      var opts=NEWS.filter(function(n){return n.ids==="all"||n.ids.some(relevantId)});
      if(opts.length){
        var n=opts[Math.floor(Math.random()*opts.length)];
        M.ev.push({h:n.h,ids:n.ids,f:n.f,left:n.dur});
        changed=true;
        if(!quiet)toast("News: "+n.h);
      }
    }
  }
  if(changed)recomputeMarket();
}

/* the cost controller watches prices and tells clerks how much stock to hold */
function addNote(s){S.notes.unshift(s);if(S.notes.length>4)S.notes.length=4}
function controllerTick(dt){
  if(onShift("controller")<1)return;
  S.ctlT-=dt;if(S.ctlT>0)return;
  S.ctlT=15;
  ctlPrices();
  ING.forEach(function(x){
    if(x.raw||!has(x.id)||!S.auto[x.id])return;
    var m=mkt(x.id),cat=m>=1.25?"hi":m<=0.85?"lo":"ok";
    var par=cat==="hi"?3:cat==="lo"?Math.floor(cap()*0.8):10;
    S.par[x.id]=par;
    var prev=S.parCat[x.id];
    if(prev!==cat){
      S.parCat[x.id]=cat;
      var pc=Math.round(Math.abs(m-1)*100);
      if(cat==="hi")addNote(x.n+" is "+pc+"% above normal. Clerks will hold only "+par+".");
      else if(cat==="lo")addNote(x.n+" is "+pc+"% below normal. Clerks will stock up to "+par+".");
      else if(prev)addNote(x.n+" is back to normal. Clerks hold "+par+" again.");
    }
  });
}

function tick(dt,quiet){
  T+=dt;
  tickMarket(dt,quiet);
  controllerTick(dt);
  var hh=Date.now()<S.hhUntil;
  /* the clock: time flies while the bar is closed */
  var open=isOpenNow();
  if(wasOpen&&!open)ctlPrices();
  if(!wasOpen&&open)applyPrices();
  wasOpen=open;
  S.gt+=dt*(open?1:12);
  var dn=gDay();
  if(dn!==S.curDay){S.curDay=dn;dayChange(quiet)}
  /* customers arrive, but only while the bar is open */
  if(open&&freeSlot()>=0){
    S.arrive-=dt*(hh?2:1)*arrivalMult()*demandNow();
    if(S.arrive<=0){spawnOrder();S.arrive=interval()*(0.8+Math.random()*0.4)}
  }
  if(S.hold){for(var hi=S.hold.length-1;hi>=0;hi--){
    var hd=S.hold[hi];hd.left-=dt;
    if(hd.left<=0){
      S.hold.splice(hi,1);
      if(hd.again&&open){var ct=null;for(var ci=0;ci<CUST.length;ci++){if(CUST[ci].n===hd.who)ct=CUST[ci]}
        if(ct)spawnOrder({slot:hd.slot,cust:ct,cls:hd.cls,cid:hd.id,n:hd.re,rid:hd.rid})}
    }
  }}
  /* patience */
  for(var i=S.orders.length-1;i>=0;i--){
    var o=S.orders[i];
    if(o.ready)continue;
    o.left-=dt;
    if(o.rowdy){rowdyStep(o,dt,quiet);if(o.gone)continue}
    if(o.left<=0){if(o.rid)regBond(o.rid,-15);dropOrder(o);S.walkouts++;addSat(0);if(!quiet)toast(o.who+" got tired of waiting and left.")}
  }
  /* team works */
  var W=workers();
  for(var j=S.jobs.length-1;j>=0;j--){
    var job=S.jobs[j],sp=W[j];
    if(sp===undefined)continue;
    var od=findOrder(job.o);
    if(!od){S.jobs.splice(j,1);continue}
    job.p+=sp*dt;
    if(job.p>=prepTime(ITM[od.items[job.i].r])){
      od.items[job.i].done=true;
      S.jobs.splice(j,1);
      if(od.items.every(function(it){return it.done}))finishOrder(od);
    }
  }
  var guard=0;
  while(S.jobs.length<W.length&&guard++<30){if(!startJob())break}
  /* cashiers collect for their own slot */
  var cs=onShift("cashier");
  if(cs>0)S.orders.filter(function(o){return o.ready&&o.slot<cs}).forEach(collect);
  /* the prep chef */
  chefTick(dt);
  /* clerks restock their ingredients, every quality in stock */
  var capNow=shiftCounts().clerk_lv||0,watched=0;
  if(capNow>0){
    for(var k=0;k<ING.length;k++){
      var x=ING[k];
      if(x.raw||!has(x.id)||!S.auto[x.id])continue;
      if(x.pre&&chefActive())continue;
      if(watched>=capNow)break;
      watched++;
      var top=x.q?(S.ql[x.id]||0):0;
      for(var t2=0;t2<=top;t2++){if((S.stock[skey(x.id,t2)]||0)<parOf(x.id))buyStock(x.id,t2)}
    }
  }
  /* safety net: never get stuck without lemons or money */
  if(S.money<5&&(S.stock.lemonjuice||0)===0&&S.jobs.length===0){
    S.money+=10;
    if(!quiet)toast("A regular lent you $10 for lemons.");
  }
}
function simulate(secs){
  var steps=Math.floor(secs/2);
  var m0=S.totalEarned,s0=S.served;
  for(var i=0;i<steps;i++)tick(2,true);
  recent=[];
  return{earned:S.totalEarned-m0,served:S.served-s0};
}

