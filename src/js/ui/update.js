/* ---------- UI: update ---------- */
function hint(x){
  /* no recipe hints: the player buys first and finds out what it unlocks */
  if(SPIRITS.indexOf(x.id)>=0)return x.q?"A spirit. Also sold neat.":"A spirit.";
  if(LIQUEURS.indexOf(x.id)>=0)return "A liqueur or wine.";
  if(MIXERS.indexOf(x.id)>=0)return "A mixer.";
  return x.q?"Also sold neat.":"An ingredient for your bar.";
}
function moodWord(q){return q<=0.85?"Bargain":q<=1.15?"Fair":q<=1.6?"Pricey":"Too pricey"}
function satTeam(v){return v>=80?"Thrilled":v>=60?"Happy":v>=40?"Okay":v>=25?"Unhappy":"About to walk out"}
function satWord(v){return v>=80?"Delighted":v>=60?"Happy":v>=40?"Okay":v>=20?"Unhappy":"Furious"}
function mshow(n){return n<1e6?money0(n):eur(n)}

function updateOrders(W){
  var slots=maxSlots(),cs=onShift("cashier"),map={};
  S.orders.forEach(function(o){map[o.slot]=o});
  var openNow=isOpenNow();
  for(var i=0;i<5;i++){
    var c=ref.ord[i],o=map[i];
    if(i>=slots){c.card.style.display="none";continue}
    c.card.style.display="";
    if(!o){
      setC(c.card,"ocard empty");c.empty.style.display="";c.body.style.display="none";c.oid=0;
      setT(c.empty,!openNow?"The bar is closed.":(i<cs?"Cashier on duty. Waiting for the next customer…":"Waiting for the next customer…"));
      continue;
    }
    c.oid=o.id;
    setC(c.card,"ocard"+(o.ready?" ready":""));
    c.empty.style.display="none";c.body.style.display="";
    setT(c.who,o.who+(o.cls>=2?" ("+CLASSN[o.cls]+")":""));
    setT(c.rew,o.ready?"Paid "+eur(o.reward)+" · "+satWord(o.sat):"Up to "+eur(maxReward(o)));
    for(var k=0;k<3;k++){
      var ln=c.lines[k],it=o.items[k];
      if(!it){ln.l.style.display="none";continue}
      ln.l.style.display="";
      var r=ITM[it.r];
      setT(ln.nm,r.n);
      if(it.done){setT(ln.st,"Done");setC(ln.st,"ost ok")}
      else{
        var job=jobFor(o.id,k);
        if(job){
          var idx=S.jobs.indexOf(job);
          if(idx>=W.length){setT(ln.st,"Waiting for a free hand");setC(ln.st,"ost")}
          else{setT(ln.st,"Mixing "+Math.min(99,Math.floor(job.p/prepTime(r)*100))+"%");setC(ln.st,"ost")}
        }else{
          var ms=missingOf(r);
          if(ms){setT(ln.st,"Out of "+keyName(ms));setC(ln.st,"ost bad")}
          else{setT(ln.st,"Queued");setC(ln.st,"ost")}
        }
      }
    }
    c.fill.style.width=(o.ready?100:Math.max(0,o.left/o.pat*100))+"%";
    c.skip.style.display=o.ready?"none":"";
    c.collectBtn.style.display=o.ready?"":"none";
    setT(c.note,i<cs?"Cashier on duty":"");
    if(o.ready)setT(c.collectBtn,"Collect "+eur(o.reward));
  }
}

function updateCal(){
  var C=ref.cal,today=gDay(),sel=C.sel;
  var vt=dateOf(C.vm*28);
  setT(C.ttl,MONN[vt.m]+" · Year "+vt.year);
  for(var i=0;i<28;i++){
    var d=C.vm*28+i,evs=eventsOn(d),cell=C.cells[i];
    var hol=evs.some(function(e){return e.hol}),rn=evs.some(function(e){return !e.hol});
    setT(cell.n,String(i+1));
    setT(cell.mk,(hol?"●":"")+(rn?"○":""));
    setC(cell.b,"cday"+(d===today?" today":d<today?" past":"")+(d===sel?" sel":""));
    if(cell.b._cur!==(d===today)){cell.b._cur=(d===today);if(d===today)cell.b.setAttribute("aria-current","date");else cell.b.removeAttribute("aria-current")}
  }
  var se=eventsOn(sel);
  setT(C.dt,dstr(sel)+(sel===today?" (today)":""));
  for(var k=0;k<3;k++){
    var ln=C.evl[k],ev=se[k];
    if(ev){ln.style.display="";setT(ln,ev.n+(ev.len>1?" (day "+(ev.k+1)+" of "+ev.len+")":"")+": "+fxText(ev))}
    else if(k===0){ln.style.display="";setT(ln,"A regular day. Weekends are busier than Mondays.")}
    else ln.style.display="none";
  }
  var fx=fxFor(sel),dm=[],mx=0.01,hour;
  for(hour=0;hour<24;hour++){var v=demandAt(sel,hour,fx);dm.push(v);if(v>mx)mx=v}
  for(hour=0;hour<24;hour++){
    var bar=C.bars[hour],ph=Math.max(4,Math.round(dm[hour]/mx*100));
    if(bar._ph!==ph){bar._ph=ph;bar.style.height=ph+"%"}
    setC(bar,(isOpenAt(sel,hour)?"open":"")+(sel===today&&Math.floor(gHour())===hour?" now":""));
  }
  for(var p=0;p<6;p++){
    var arr=CUST.map(function(c){return{n:c.n,w:c.w[p]*(fx.type[c.n]||1)}}).filter(function(x){return x.w>0}).sort(function(a,b){return b.w-a.w}).slice(0,3);
    setT(C.mix[p],PERL[p]+" "+PERN[p]+": "+arr.map(function(x){return x.n.toLowerCase()}).join(", "));
  }
  setT(C.sum,sel===today?"Yesterday: "+eur(S.prev.e)+" from "+S.prev.n+" orders. Today so far: "+eur(S.dayE)+".":"Green bars are the hours the bar is open. Taller bars are busier hours.");
  for(var w=0;w<7;w++){
    var r=C.hr[w],hv=S.hours[w];
    if(document.activeElement!==r.so&&r.so._v!==hv[0]){r.so._v=hv[0];r.so.value=String(hv[0])}
    if(document.activeElement!==r.sc&&r.sc._v!==hv[1]){r.sc._v=hv[1];r.sc.value=String(hv[1])}
    setT(r.sp,hv[0]===hv[1]?"Closed":spanOf(hv[0],hv[1])+" h");
  }
}


function update(){
  var now=Date.now(),W=workers(),openNow=isOpenNow();
  setT($("#money"),mshow(S.money));
  var sum=0;
  for(var q=recent.length-1;q>=0;q--){if(recent[q].t<T-60){recent.splice(0,q+1);break}}
  recent.forEach(function(e){sum+=e.a});
  setT($("#ips"),mshow(sum)+" / min"+(S.debt>0?"  ·  Debt "+mshow(S.debt):""));
  setT($("#stage"),EXPS[S.exp].n);
  setT($("#starsTop"),"Reputation "+repLevel());
  var m=mi();
  setT($("#sMenu"),String(m.list.length));
  setT($("#sTeam"),String(W.length));
  setT($("#sStyle"),m.bn>=3?m.bf+" ×"+String(m.spec):"—");

  /* satisfaction and news */
  var sv=Math.round(S.sat);
  setT($("#satv"),satWord(sv)+" "+sv+"%");
  $("#satfill").style.width=clamp(S.sat,0,100)+"%";
  setC($("#satfill"),sv>=65?"hi":sv<35?"lo":"");
  var evs=S.mkt.ev,ne=$("#news");
  var gdn=gDay(),calMk=eventsOn(gdn).filter(function(e){return e.mk});
  if(evs.length){
    var last=evs[evs.length-1];
    setT(ne,(last.f>1?"↑ ":"↓ ")+last.h);
    setC(ne,"news "+(last.f>1?"up":"down"));
  }else if(calMk.length){
    setT(ne,(calMk[0].mk.f>1?"↑ ":"↓ ")+calMk[0].n+": "+calMk[0].mk.h);
    setC(ne,"news "+(calMk[0].mk.f>1?"up":"down"));
  }else{setT(ne,"Markets are calm.");setC(ne,"news")}

  /* clock */
  var nc=nextChange(),cs2=$("#clockS");
  setT($("#clockT"),"Year "+dateOf(gdn).year+" · "+dstr(gdn)+" · "+hstr(gHour()));
  setT(cs2,nc.at?(nc.open?"Open until ":"Closed until ")+nc.at:(nc.open?"Open":"Closed"));
  setC(cs2,nc.open?"open":"shut");
  var tev=eventsOn(gdn),tl="";
  if(tev.length)tl="Today: "+tev.map(function(e){return e.n}).join(", ")+" · "+fxText(tev[0]);
  else{var tmw=eventsOn(gdn+1).filter(function(e){return e.k===0});tl=tmw.length?"Tomorrow: "+tmw.map(function(e){return e.n}).join(", "):""}
  setT($("#today"),tl);

  var hb=$("#hh");
  if(now<S.hhUntil){setT(hb,"Happy hour: "+Math.ceil((S.hhUntil-now)/1000)+" s");hb.disabled=true;setC(hb,"ghost on")}
  else if(now<S.hhReady){setT(hb,"Happy hour in "+Math.ceil((S.hhReady-now)/1000)+" s");hb.disabled=true;setC(hb,"ghost")}
  else{setT(hb,"Happy hour ×2");hb.disabled=false;setC(hb,"ghost")}

  updateOrders(W);

  /* market panel */
  var mlist=[];
  calMk.forEach(function(c){mlist.push({f:c.mk.f,t:c.n+": "+c.mk.h+" (today)"})});
  evs.forEach(function(ev){mlist.push({f:ev.f,t:ev.h+" ("+Math.ceil(ev.left)+" s)"})});
  for(var e=0;e<5;e++){
    var ln=ref.mk.ev[e],ev=mlist[e];
    if(ev){ln.style.display="";setT(ln,(ev.f>1?"↑ ":"↓ ")+ev.t);setC(ln,"gnote "+(ev.f>1?"up":"down"))}
    else if(e===0){ln.style.display="";setT(ln,"Markets are calm. Small price swings still happen.");setC(ln,"gnote")}
    else ln.style.display="none";
  }
  var hasCtl=(S.staff.controller||0)>0;
  for(var z=0;z<4;z++){
    var nl=ref.mk.notes[z];
    if(!hasCtl){nl.style.display="none";continue}
    nl.style.display="";
    setT(nl,S.notes[z]?"Controller: "+S.notes[z]:(z===0?"Controller: watching the market.":""));
    if(!S.notes[z]&&z>0)nl.style.display="none";
  }

  /* stock */
  var chef=chefActive();
  GROUPS.forEach(function(gr){
    var t=gr[0],cfg=TIERS[t],gn=ref.grp[t];
    if(t==="R"){setT(gn,chef?"Raw produce the prep chef buys in bulk and turns into prepared items.":"Hire a prep chef to buy fresh produce in bulk and prepare syrup and juices.");return}
    if(!cfg){setT(gn,t==="4"?"Each one needs trained staff, reputation and a one-time fee.":"Pay once to open a supplier account.");return}
    var tot=picksTotal(t),left=picksLeft(t),lv=S.train[cfg.staff]||0;
    gn._show=tot>=1||ING.some(function(x){return x.g===t&&has(x.id)});
    setT(gn,tot===0?"Hire your first "+STAFFM[cfg.staff].n.toLowerCase()+" to earn your first picks and reveal these ingredients.":"Picks left: "+left+" of "+tot+(left>0?". Choose with your recipes in mind.":(lv<TRAIN_COST.length?". Train your "+STAFFM[cfg.staff].pl+" in the Upgrades tab for "+cfg.per+" more.":". That is every pick for this group.")));
  });
  var clerks=S.staff.clerk||0,clerkUnlocked=!!S.upg.clerk,cp=cap();
  ING.forEach(function(x){
    var r=ref.ing[x.id],cfg=TIERS[x.g];
    if(x.raw){
      var showRaw=chef;
      r.row.style.display=showRaw?"":"none";
      if(!showRaw)return;
      var rs=S.stock[x.id]||0;
      setT(r.nm,x.n+" (raw)");
      setT(r.sub,"Stock "+Math.floor(rs)+" / "+(cp*2)+". The chef buys in bulk at "+eur(x.u*mkt(x.id)*0.7*disc())+" each.");
      r.barWrap.style.display="";r.bar.style.width=Math.min(100,rs/(cp*2)*100)+"%";
      r.btn.style.display="none";r.tog.style.display="none";setC(r.row,r.cls);
      return;
    }
    r.btn.style.display="";
    r.row.style.display=(!cfg||ref.grp[x.g]._show||has(x.id))?"":"none";
    if(has(x.id)){
      var st=S.stock[x.id]||0,uc=unitCost(x,0),units=Math.min(10,cp-st),cost=units*uc;
      var pct=Math.round((mkt(x.id)-1)*100);
      var trend=Math.abs(pct)>=3?(pct>0?"  ↑ "+pct+"%":"  ↓ "+(-pct)+"%"):"";
      setT(r.nm,x.q?tierName(x,0)+(x.id==="beer"||x.id==="wine"?"":""):x.n);
      var made=x.pre&&chef?" The chef makes it for "+eur(effUnit(x,0))+".":"";
      setT(r.sub,"Stock "+st+" / "+cp+". "+eur(uc)+" each"+(x.pre?" ready-made":"")+"."+trend+made+(S.auto[x.id]&&clerks>0&&!(x.pre&&chef)?" Keeps "+parOf(x.id)+".":""));
      r.barWrap.style.display="";r.bar.style.width=(st/cp*100)+"%";
      if(units<=0){setT(r.btn,"Full");r.btn.disabled=true}
      else{setT(r.btn,"+"+units+"  "+eur(cost));r.btn.disabled=S.money<cost}
      setC(r.btn,"buy");setC(r.row,r.cls);
      if(x.pre&&chef){r.tog.style.display=clerkUnlocked?"":"none";setT(r.tog,"Made by the prep chef")}
      else{
        r.tog.style.display=clerkUnlocked?"":"none";
        setT(r.tog,S.auto[x.id]?"Watched by a clerk (tap to free)":(clerkCap()>0?"Assign a clerk slot ("+assignedCount()+"/"+clerkCap()+" busy)":"No clerk hired"));
      }
      if(x.q){
        var ql=S.ql[x.id]||0;
        r.bt.style.display=ql>0?"":"none";
        setT(r.bt,"Cocktails use: "+tierName(x,brandOf(x.id)).toLowerCase()+" (tap to change)");
        for(var t=1;t<3;t++){
          var tr=r.tiers[t];
          tr.row.style.display="";
          setT(tr.nm,tierName(x,t));
          if(ql>=t){
            var s2=S.stock[skey(x.id,t)]||0,u2=unitCost(x,t),n2=Math.min(10,cp-s2);
            setT(tr.sub,"Stock "+s2+" / "+cp+". "+eur(u2)+" each. Sold neat for "+eur(priceOf(ITM["s_"+x.id+"_"+t]))+".");
            tr.barWrap.style.display="";tr.bar.style.width=(s2/cp*100)+"%";
            if(n2<=0){setT(tr.btn,"Full");tr.btn.disabled=true}
            else{setT(tr.btn,"+"+n2+"  "+eur(n2*u2));tr.btn.disabled=S.money<n2*u2}
            setC(tr.btn,"buy");setC(tr.row,tr.cls);
          }else{
            var lk=tierLock(x,t),fee=Math.round(QFEE[t]*x.u[0]);
            tr.barWrap.style.display="none";
            if(lk){setT(tr.btn,"Locked");tr.btn.disabled=true;setT(tr.sub,lk);setC(tr.row,tr.cls+" locked")}
            else{setT(tr.btn,"Unlock "+eur(fee));tr.btn.disabled=S.money<fee;setT(tr.sub,"A better brand for cocktails and for neat serves. Customers who can afford it will ask for it.");setC(tr.row,tr.cls)}
            setC(tr.btn,"buy");
          }
        }
      }
    }else{
      r.barWrap.style.display="none";r.tog.style.display="none";
      if(x.q){r.bt.style.display="none";for(var t3=1;t3<3;t3++)r.tiers[t3].row.style.display="none"}
      var lock=ingLock(x),fee0=x.c||0;
      setT(r.nm,x.q?tierName(x,0):x.n);
      if(lock){setT(r.btn,cfg?"No picks":"Locked");r.btn.disabled=true;setC(r.btn,"buy");setT(r.sub,lock);setC(r.row,r.cls+" locked")}
      else{setT(r.btn,fee0?"Unlock "+eur(fee0):"Unlock");r.btn.disabled=S.money<fee0;setC(r.btn,"buy");setT(r.sub,hint(x)+(cfg?" Uses 1 pick.":""));setC(r.row,r.cls)}
    }
  });

  /* finances and team */
  var dc=dailyCost(),mo=S.month,left=28-(gDay()%28);
  var est=mo.rent+mo.util+mo.pay+left*(dc.rent+dc.util+dc.pay);
  if(S.mcount===0)est*=OPENING;
  setT(ref.fin[0],"Month ends in "+left+" day"+(left>1?"s":"")+". Fixed costs expected: "+money0(est)+(S.mcount===0?" (half price in your opening month)":"")+". Full month: payroll "+money0(payroll())+", rent "+money0(EXPS[S.exp].rent)+", utilities "+money0(EXPS[S.exp].util)+").");
  setT(ref.fin[1],"This month so far: revenue "+money0(mo.rev)+", stock bought "+money0(mo.cogs)+", spoiled "+money0(mo.waste)+".");
  var lm=S.lastMonth;
  setT(ref.fin[2],lm?"Last month: revenue "+money0(lm.rev)+", stock "+money0(lm.cogs)+", fixed costs "+money0(lm.rent+lm.util+lm.pay)+(lm.interest>0?", interest "+money0(lm.interest):"")+". "+(lm.profit>=0?"Profit ":"Loss ")+money0(Math.abs(lm.profit))+".":"No month has closed yet.");
  ref.fin[3].style.display=S.debt>0?"":"none";
  setT(ref.fin[3],"Debt: "+money0(S.debt)+", with 4% interest a month. "+(S.late>0?S.late+" month"+(S.late>1?"s":"")+" overdue. Staff quit after 2.":""));
  setC(ref.fin[3],"gnote up");
  var short=left<=7&&S.money<est-(mo.rent+mo.util+mo.pay)*0+0&&est>S.money;
  ref.fin[4].style.display=short?"":"none";
  setT(ref.fin[4],"Careful: you have "+money0(S.money)+" and about "+money0(est)+" is due at month end. Unpaid costs become debt and hurt your reputation.");
  setC(ref.fin[4],"gnote up");
  ref.finBtn.style.display=S.debt>0?"":"none";
  setT(ref.finBtn,"Repay "+money0(Math.min(S.money,S.debt))+" now");

  /* team */
  var mood=Math.round(S.mood),nT=S.team.length;
  setT(ref.mood.txt,nT?satTeam(mood)+" "+mood+"%. It changes how fast and friendly people work, how much new candidates ask for, and whether people quit.":"No employees yet. You work the counter alone.");
  ref.mood.fill.style.width=clamp(S.mood,0,100)+"%";
  setC(ref.mood.fill,mood>=65?"hi":mood<35?"lo":"");
  if(nT){
    var sr=0;
    S.team.forEach(function(e){sr+=e.wage/refWage(e)});
    setT(ref.mood.drv,"Wages average "+Math.round(sr/nT*100)+"% of the market rate. Raises, promotions and training lift the mood; low pay sinks it.");
  }else setT(ref.mood.drv,"Wages, raises and promotions will move this bar once you hire.");

  ROLES.forEach(function(x){
    var r=ref.staff[x.id],n=S.staff[x.id]||0,unl=roleUnlocked(x.id);
    setT(r.cnt,n?"×"+n:"");
    if(!unl){
      setT(r.sub,"Unlock it in the Upgrades tree first.");
      setT(r.btn,"Locked");r.btn.disabled=true;setC(r.btn,"buy");setC(r.row,r.cls+" locked");
      return;
    }
    var extra="";
    if(x.sp){
      extra=" Base speed "+fmt(x.sp*Math.pow(2,S.train[x.id]||0)*(1+0.25*lvl("speed")))+".";
      for(var tk in TIERS){if(TIERS[tk].staff===x.id){extra+=(TIERS[tk].base?" Your first hire earns "+TIERS[tk].base+" ingredient picks.":"")+" Each training level earns "+TIERS[tk].per+" more."}}
      var rare=ING.filter(function(i){return i.gs===x.id&&!TIERS[i.g]});
      if(rare.length)extra+=" Training them to level "+rare[0].gn+" opens "+rare[0].n+" (needs reputation "+rare[0].rep+").";
    if(S.exp===0&&(x.id==="cashier"||x.id==="clerk")&&!(S.starter&&S.starter[x.id]))extra+=" Starter deal: your first one at the stand works for half wage until you expand.";
    }else if(x.id==="cashier")extra=" Covering "+onShift("cashier")+" of "+maxSlots()+" slots right now.";
    else if(x.id==="clerk")extra=" Watching "+assignedCount()+" of "+clerkCap()+" ingredient slots.";
    setT(r.sub,x.d+" Typical wage "+money0(x.w*wk())+" a month."+extra+(n>0?" On shift now: "+onShift(x.id)+" of "+n+".":""));
    setC(r.row,r.cls);
    var lim=roleLimit(x.id);
    if(n>=lim){setT(r.btn,S.team.length>=staffCap()?"Team full":"Max");r.btn.disabled=true;setC(r.btn,"buy owned")}
    else{setT(r.btn,"Hire");r.btn.disabled=false;setC(r.btn,"buy")}
  });

  var sig=S.team.map(function(e){return e.id+e.role}).join(",");
  if(sig!==ref.empSig){ref.empSig=sig;rebuildEmps()}
  ref.empNote.style.display=nT?"none":"";
  setT(ref.empNote,"Nobody yet. Hire your first person above.");
  S.team.forEach(function(e){
    var r=ref.emps[e.id];if(!r)return;
    setT(r.nm,e.name+" · "+STAFFM[e.role].n);
    setT(r.sub,LVLN[e.lvl]+". "+skillNames(e.role).map(function(sn,i){return sn.slice(0,4)+" "+e.sk[i]}).join(", ")+".");
    setT(r.tag,money0(wageOf(e)));
    setC(r.row,r.cls+" pick"+(ref.ed.sel===e.id?" sel":""));
  });
  var ed=ref.ed,se=selEmp();
  if(!se&&nT){se=S.team[0];ed.sel=se.id}
  ed.card.style.display=se?"":"none";
  if(se){
    var ns=skillNames(se.role).length;
    setT(ed.nm,se.name+", "+STAFFM[se.role].n.toLowerCase()+" ("+LVLN[se.lvl].toLowerCase()+")");
    setT(ed.sub,"Wage "+money0(wageOf(se))+" a month, "+Math.round(se.wage/refWage(se)*100)+"% of the market rate. "+se.xp+" days worked.");
    for(var si=0;si<3;si++){
      var sk=ed.sk[si];
      if(si>=ns){sk.row.style.display="none";continue}
      sk.row.style.display="";
      setT(sk.lab,skillNames(se.role)[si]+" "+se.sk[si]+"/5: "+skillEffect(se.role,si));
      if(se.sk[si]>=5){setT(sk.btn,"Max");sk.btn.disabled=true;setC(sk.btn,"buy sm owned")}
      else{var tc=trainCostOf(se,si);setT(sk.btn,"Train "+money0(tc));sk.btn.disabled=S.money<tc;setC(sk.btn,"buy sm")}
    }
    var nr=nextRole(se);
    setT(ed.prog,se.lvl<2?"Next level at "+LVLXP[se.lvl+1]+" days worked ("+se.xp+" so far). Skills also grow with every 12 days worked.":(nr?"Senior. Can move up to "+STAFFM[nr].n.toLowerCase()+" after "+PROMXP+" days worked ("+se.xp+" so far).":"Senior. This role is the top of its ladder."));
    if(se.lvl<2){
      var nw=Math.round(se.wage*LVLM[se.lvl+1]/LVLM[se.lvl]/10)*10;
      ed.bLevel.style.display="";setT(ed.bLevel,"Promote to "+LVLN[se.lvl+1].toLowerCase()+": "+money0(nw));
      ed.bLevel.disabled=se.xp<LVLXP[se.lvl+1];
    }else ed.bLevel.style.display="none";
    if(nr&&se.lvl===2){
      ed.bRole.style.display="";setT(ed.bRole,"Promote to "+STAFFM[nr].n.toLowerCase()+": "+money0(promoWage(se,nr)));
      ed.bRole.disabled=se.xp<PROMXP||!roleUnlocked(nr)||(S.staff[nr]||0)>=baseLimit(nr);
    }else ed.bRole.style.display="none";
    if(se.role==="clerk"){
      ed.bClerk.style.display="";
      if((se.cl||1)>=3){setT(ed.bClerk,"Watching 3 (max)");ed.bClerk.disabled=true}
      else{var cc=CLERK_UP[(se.cl||1)-1];setT(ed.bClerk,"Watch "+((se.cl||1)+1)+" ingredients: "+money0(cc));ed.bClerk.disabled=S.money<cc}
    }else ed.bClerk.style.display="none";
    setT(ed.bRaise,"Raise 10%: "+money0(se.wage*1.1));
  }

  /* expansion and trees */
  var nx=EXPS[S.exp+1];
  if(nx){
    var ec=expCost(nx);
    setT(ref.exp.nm,"Expand to "+nx.n.toLowerCase());
    setT(ref.exp.sub,"Customers every "+nx.int+" s, "+SLOTBASE[S.exp+1]+" seats (up to "+(SLOTBASE[S.exp+1]+2*SEATINC[S.exp+1])+"), up to "+nx.k+" drinks per order. Room for "+STAFFCAP[S.exp+1]+" staff. Rent "+money0(nx.rent)+" and utilities "+money0(nx.util)+" a month, starting at 40% and building up over 3 months.");
    setT(ref.exp.btn,mshow(ec));ref.exp.btn.disabled=S.money<ec;setC(ref.exp.btn,"buy");
  }else{
    setT(ref.exp.nm,EXPS[S.exp].n);setT(ref.exp.sub,"Fully expanded.");
    setT(ref.exp.btn,"Done");ref.exp.btn.disabled=true;setC(ref.exp.btn,"buy owned");
  }
  updateTree(ref.tr.bar);updateTree(ref.tr.train);

  /* menu */
  var found=0,secretFound=0,secretTotal=REC.filter(function(r){return r.s}).length;
  ITEMS.forEach(function(r){
    var x=ref.rec[r.id],u=unlocked(r);
    if(u){found++;if(r.s)secretFound++}
    if(r.s||r.solo){x.row.style.display=u?"":"none"}
    if(u){
      var act=priceOf(r),pr=stagedPrice(r),fr=fairOf(r),cost=itemCost(r),manual=S.price[r.id]!==undefined;
      var margin=Math.round((1-cost/Math.max(pr,0.01))*100);
      var ql2=quality(r);
      setT(x.nm,r.n);
      setT(x.sub,(r.solo?"Neat serve. ":r.f+": "+r.i.map(nameOf).join(", ")+". ")+"Costs "+eur(cost)+", margin "+margin+"%."+(ql2>1?" Brand adds "+Math.round((ql2-1)*100)+"%.":""));
      x.box.style.display="";
      if(document.activeElement!==x.inp){var sv2=pr.toFixed(2);if(x.inp._v!==sv2){x.inp._v=sv2;x.inp.value=sv2}}
      setT(x.fair,"Fair "+eur(fr)+" · "+moodWord(act/fr));
      var pend=Math.abs(pr-act)>0.005;
      x.pend.style.display=pend?"":"none";
      setT(x.pend,"On the menu now: "+eur(act)+". New price from the next opening.");
      x.rst.style.display=manual?"":"none";
      setT(x.rst,hasCtl?"Back to auto":"Reset");
      setC(x.row,x.cls);
    }else if(!r.solo){
      var have=r.i.filter(has).length;
      if(S.known.indexOf(r.id)>=0){
        setT(x.nm,r.n);
        setT(x.sub,"A recipe you know. Missing: "+r.i.filter(function(i){return !has(i)}).map(function(i){return INGM[i].n}).join(", ")+".");
        x.box.style.display="none";setC(x.row,x.cls+" known");
      }else{
        setT(x.nm,"???");
        setT(x.sub,r.f+", "+r.i.length+" ingredients. You have "+have+".");
        x.box.style.display="none";setC(x.row,x.cls+" locked");
      }
    }
  });
  setT(ref.bookNote,found+" drinks on your menu, "+(secretTotal-secretFound)+" secret ones left to discover. "+"You can change prices any time, but they only go on the menu the next time the bar opens."+" Customers compare your price with a fair price that follows ingredient costs: too high and they get unhappy, and some walk away. Richer customers accept more."+(hasCtl?" Drinks you have not priced yourself are repriced overnight by your cost controller.":""));

  updateCal();

  /* brand */
  var B=ref.br,L=repLevel(),curR=L*L*25,nxtR=(L+1)*(L+1)*25;
  setT(B.lvl,"Level "+L);setT(B.name,repName(L));setT(B.pts,String(S.pts));
  B.bar.style.width=clamp((S.rep-curR)/(nxtR-curR)*100,0,100)+"%";
  setT(B.prog,Math.floor(S.rep)+" reputation. Next level at "+nxtR+".");
  setT(B.eff,"Customers arrive "+Math.round((repArrival()-1)*100)+"% faster. Richer customers are more common, and premium brands unlock at levels "+QREP[1]+" and "+QREP[2]+".");
  ACH.forEach(function(a){
    var r=B.ach[a.id];
    setT(r.val,S.ach[a.id]?"Done":"+"+a.r);
    setC(r.row,S.ach[a.id]?r.cls:r.cls+" locked");
  });
  updateTree(ref.tr.rep);

  var pk=false;for(var tk2 in TIERS){if(picksLeft(tk2)>0)pk=true}
  $("#dotStock").style.display=(pk&&tab!=="stock")?"block":"none";
  $("#dotBook").style.display=S.newRec?"block":"none";
  $("#dotBrand").style.display=(S.pts>0&&tab!=="brand")?"block":"none";
}

/* ---------- tabs ---------- */
function setTab(t){
  tab=t;
  document.querySelectorAll("nav button").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-tab")===t)});
  document.querySelectorAll(".panel").forEach(function(p){p.classList.toggle("on",p.id==="p-"+t)});
  if(t==="book")S.newRec=false;
  drawAll();
  emit("tab",t);
}
document.querySelectorAll("nav button").forEach(function(b){b.onclick=function(){setTab(b.getAttribute("data-tab"))}});

$("#hh").onclick=startHappyHour;

