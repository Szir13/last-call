/* ---------- people, fixed costs, month end and day change ---------- */
function syncStaff(){
  var c={};
  S.team.forEach(function(e){c[e.role]=(c[e.role]||0)+1});
  S.staff=c;
  ROLES.forEach(function(r){var n=c[r.id]||0;if(n>(S.maxStaff[r.id]||0))S.maxStaff[r.id]=n});
  TV++;
}
function refWage(e){var r=STAFFM[e.role].w*wk()*LVLM[e.lvl];return e.starter?r/2:r}
function payroll(){var t=0;S.team.forEach(function(e){t+=wageOf(e)});return t}
function rampK(){var m=S.mcount-(S.expAt||0);return m<=0?0.4:(m===1?0.65:(m===2?0.85:1))}   /* a new venue's lease builds up over three months */
function dailyCost(){var st=EXPS[S.exp],k=rampK();return{rent:st.rent*k/28,util:st.util*k/28,pay:payroll()/28}}
function trimAssign(){while(assignedCount()>clerkCap()){for(var k in S.auto){if(S.auto[k]){delete S.auto[k];break}}}}
function fireEmp(e){
  var ix=S.team.indexOf(e);if(ix<0)return;
  S.team.splice(ix,1);
  syncStaff();trimAssign();
  if(ref.ed&&ref.ed.sel===e.id)ref.ed.sel=0;
}
function staffQuits(quiet){
  var best=null;
  S.team.forEach(function(e){if(!best||e.wage>best.wage)best=e});
  if(!best)return;
  fireEmp(best);
  if(!quiet)toast(best.name+" quit because wages were not paid.");
}
function moodQuit(quiet){
  var worst=null,wr=9;
  S.team.forEach(function(e){var r=e.wage/refWage(e);if(r<wr){wr=r;worst=e}});
  if(!worst)return;
  fireEmp(worst);
  if(!quiet)toast(worst.name+" quit: the team is unhappy.");
}
function repayDebt(){
  var a=Math.min(S.money,S.debt);
  if(a<=0)return;
  S.money-=a;S.debt-=a;
  if(S.debt<0.01){S.debt=0;S.paidDebt=true;S.late=0}
}
var LATE_MAX=3;   /* months in a row without paying the bills before the bank repossesses the bar */
function monthlyFixed(){var dc=dailyCost();return 28*(dc.rent+dc.util+dc.pay)}
function bankLimit(){var lp=S.lastMonth?Math.max(0,S.lastMonth.profit||0):0;return Math.max(2000,Math.round(2*lp/100)*100)}
function bankBorrow(a){
  a=Math.round(a);
  if(a<=0||S.debt+a>bankLimit())return false;
  S.money+=a;S.debt+=a;
  toast("The bank lent you "+money0(a)+". Interest is 4% a month.");
  return true;
}
function repossess(quiet){
  var from=EXPS[S.exp],k0=wk();
  if(S.exp<=0){
    /* nothing smaller to fall back to: the bank restructures the debt instead */
    S.notice={type:"restructure",debtBefore:Math.round(S.debt)};
    S.debt=Math.round(S.debt*0.5);S.late=1;
    return;
  }
  var sale=Math.round(from.c*0.5),paid=Math.min(sale,S.debt);
  S.debt-=paid;var extra=sale-paid;S.money+=extra;if(S.debt<0.5)S.debt=0;
  S.exp--;S.expAt=S.mcount;var ratio=wk()/k0;
  var cap=staffCap(),fired=0;
  while(S.team.length>cap){
    var worst=null;
    S.team.forEach(function(e){if(!worst||e.lvl<worst.lvl||(e.lvl===worst.lvl&&e.wage<worst.wage))worst=e});
    fireEmp(worst);fired++;
  }
  S.team.forEach(function(e){e.wage=Math.round(e.wage*ratio/10)*10});
  /* the fittings, the unlocked ingredients and the training are gone; the recipes you learned are not */
  S.upg={};S.train={};S.picks={};S.ing={lemonjuice:1};S.ql={};S.brand={};S.stock={};S.bat={};S.auto={};S.par={};S.parCat={};
  S.maxStaff={};addStock("lemonjuice",20);
  S.orders=[];S.jobs=[];S.hold=[];S.arrive=2;S.cands={};
  S.nights={};S.sup={mode:"spot"};S.inc=null;S.br=[];S.deco={items:{},theme:null};
  syncStaff();MI=null;
  S.debt=Math.min(S.debt,Math.round(monthlyFixed()*2));   /* the bank writes off what the sale could not cover, beyond a recoverable amount */
  addRep(-Math.round(S.rep*0.4),true);S.mood=Math.max(20,S.mood-15);S.late=0;
  if(S.ms){S.ms.active=[];S.ms.day=-1}
  S.notice={type:"repo",from:from.n,to:EXPS[S.exp].n,sale:sale,toDebt:paid,cash:extra,debtLeft:Math.round(S.debt),fired:fired};
  checkUnlocks();
}
function showNotice(){
  var n=S.notice;if(!n)return;
  var ov=$("#ov");if(ov.classList.contains("on"))return;
  var card=h("div","card");
  if(n.type==="repo"){
    card.appendChild(h("h2",null,"The bank took your bar"));
    card.appendChild(h("p",null,"You could not pay the bills for "+LATE_MAX+" months in a row, so the bank repossessed the "+n.from.toLowerCase()+" and sold it for "+money0(n.sale)+"."));
    card.appendChild(h("p",null,(n.toDebt>0?money0(n.toDebt)+" went to the debt. ":"")+(n.cash>0?money0(n.cash)+" was left for you. ":"")+(n.debtLeft>0?"You still owe "+money0(n.debtLeft)+". ":"The debt is cleared. ")));
    card.appendChild(h("p",null,"You are back at the "+n.to.toLowerCase()+(n.fired?", and "+n.fired+" staff had to go":"")+". The recipes you learned are still yours, but the fittings, the unlocked ingredients and the training are gone: you need the requirements again to buy ingredients."));
  }else{
    card.appendChild(h("h2",null,"The bank steps in"));
    card.appendChild(h("p",null,"You are back at the lemonade stand and still behind on payments, so there is nothing smaller to sell. The bank restructures your debt from "+money0(n.debtBefore)+" down to "+money0(S.debt)+"."));
  }
  var ok=h("button","buy","Continue");ok.onclick=function(){S.notice=null;hideOv()};card.appendChild(ok);
  showOv(card);
}
function monthEnd(quiet){
  var m=S.month;
  if(S.mcount===0){m.rent*=0.5;m.util*=0.5;m.pay*=0.5}   /* the opening month is half price */
  S.mcount++;
  S.team.forEach(function(e2){if(e2.starter){e2.starter--;if(e2.starter<=0){e2.wage=e2.wage*2;delete e2.starter}}});
  if(supMode()==="volume"&&m.cogs<volCommit())m.util+=0.5*(volCommit()-m.cogs);
  var due=m.rent+m.util+m.pay;
  var interest=S.debt*0.04;
  S.debt+=interest;m.interest=interest;
  var paid=Math.min(S.money,due);
  S.money-=paid;
  var unpaid=due-paid;
  S.debt+=unpaid;
  if(S.debt>0){
    var spare=Math.max(0,S.money-300),rp=Math.min(spare,S.debt);
    if(rp>0){S.money-=rp;S.debt-=rp;if(S.debt<0.01){S.debt=0;S.paidDebt=true}}
  }
  var profit=m.rev-m.cogs-due-interest;
  guideUpdate();
  var brInc=branchIncome();if(brInc>0){S.money+=brInc;S.totalEarned+=brInc}
  S.lastMonth={rev:m.rev,cogs:m.cogs,rent:m.rent,util:m.util,pay:m.pay,waste:m.waste,interest:interest,profit:profit,unpaid:unpaid,branch:brInc};
  S.month=newMonth();
  if(unpaid>0.5){
    S.late++;addRep(-15,quiet);
    if(!quiet)toast("Month end: you could not pay everything, so the bank lent you "+money0(unpaid)+". Debt is "+money0(S.debt)+". Month "+S.late+" of "+LATE_MAX+" behind.");
    if(S.late>=2&&S.late<LATE_MAX)staffQuits(quiet);
    if(S.late>=LATE_MAX)repossess(quiet);
  }else{
    S.late=0;
    if(profit>0)addRep(8,quiet);
    if(!quiet)toast("Month end: "+(profit>=0?"profit ":"loss ")+money0(Math.abs(profit))+(S.debt>0.5?". Debt is "+money0(S.debt)+".":"."));
  }
}
function growSkill(e,quiet){
  var idx=[];e.sk.forEach(function(v,i){if(v<5)idx.push(i)});
  if(!idx.length)return;
  idx.sort(function(a,b){return e.sk[a]-e.sk[b]});
  e.sk[idx[0]]++;TV++;
  if(!quiet)toast(e.name+" improved "+skillNames(e.role)[idx[0]].toLowerCase()+".");
}
/* what yesterday meant for the team: experience and mood */
function staffDay(quiet){
  var n=S.team.length,sumR=0;
  S.team.forEach(function(e){
    e.xp++;
    if(e.xp%12===0)growSkill(e,quiet);
    sumR+=e.wage/refWage(e);
  });
  if(n>0){
    var target=55+clamp((sumR/n-1)*60,-15,20)+S.moodB;
    S.mood=clamp(S.mood+(target-S.mood)*0.2,0,100);
  }else S.mood+=(60-S.mood)*0.2;
  S.moodB*=0.9;
  if(n>0&&S.mood<40&&Math.random()<(40-S.mood)/200)moodQuit(quiet);
}
function dayChange(quiet){
  var d=gDay();
  var dc=dailyCost();
  S.month.rent+=dc.rent;S.month.util+=dc.util;S.month.pay+=dc.pay;
  staffDay(quiet);
  S.cands={};
  spoil(quiet);
  if(S.dayN>0)addRep(clamp((S.sat-55)/12,-2,4),quiet);
  S.prev={e:S.dayE,n:S.dayN};S.dayE=0;S.dayN=0;
  FXC.day=-1;
  ctlPrices();
  if(d>0&&d%28===0)monthEnd(quiet);
  msDay(quiet);
  rollIncident(quiet);
  if(supMode()==="contract"&&gDay()>=S.sup.until){S.sup={mode:"spot"};if(!quiet)toast("Your supplier contract has ended. Prices are back to the market.")}
  cleanLT();
  checkAch(quiet);
  recomputeMarket();
  if(quiet)return;
  var msgs=[];
  eventsOn(d).forEach(function(e){if(e.k===0)msgs.push("Today: "+e.n)});
  eventsOn(d+2).forEach(function(e){if(e.k===0)msgs.push("In 2 days: "+e.n)});
  if(msgs.length)toast(msgs.join(" · "));
}

