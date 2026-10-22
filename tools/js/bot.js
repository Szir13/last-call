// A rule-based player. Argument: [style, months]. Styles: careful, idle, reckless, heavy, optimizer.
// Edit CFG, PLAN and decide() to teach it new behaviour.
([style,months])=>{
 const L=window.__lc;clearInterval(window.__loopId);let S=L.getS();
 Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,L.def());L.beginRun();S.tut=99;
 const cfg={
  careful:  {collect:1,restock:1,buf:1.0,spend:0.55,ready:1,expand:1.0,venue:0,borrow:0,plan:'mid'},
  idle:     {collect:0,restock:0,buf:1.0,spend:0.55,ready:1,expand:1.0,venue:0,borrow:0,plan:'auto'},
  reckless: {collect:1,restock:1,buf:0.0,spend:0.15,ready:0,expand:1.0,venue:0,borrow:1,plan:'min'},
  heavy:    {collect:1,restock:1,buf:0.8,spend:0.80,ready:1,expand:1.0,venue:0,borrow:0,plan:'full'},
  optimizer:{collect:1,restock:1,buf:1.0,spend:0.55,ready:1,expand:1.0,venue:1,borrow:0,plan:'mid'}
 }[style];
 const PLAN={ // desired headcount by stage
  min:{cashier:[0,1,1,2,2],clerk:[0,1,1,1,2],bartender:[0,1,2,1,0],head:[0,0,0,1,2],mixologist:[0,0,0,0,1]},
  auto:{apprentice:[0,1,1,1,1],cashier:[1,1,2,3,4],clerk:[1,2,2,3,3],bartender:[0,2,3,2,0],head:[0,0,1,2,2],mixologist:[0,0,0,1,2],prepchef:[0,0,0,1,1]},
  mid:{apprentice:[0,1,1,1,1],cashier:[1,1,2,3,4],clerk:[0,2,1,3,3],bartender:[0,2,3,0,0],head:[0,0,1,2,2],mixologist:[0,0,0,2,3],manager:[0,0,0,0,2],ambassador:[0,0,0,0,1],prepchef:[0,0,1,1,1],controller:[0,0,0,1,1],security:[0,0,1,1,2]},
  full:{apprentice:[0,1,1,1,1],cashier:[1,2,3,4,5],clerk:[0,2,2,3,4],bartender:[0,3,4,3,2],head:[0,0,2,3,3],mixologist:[0,0,0,3,4],manager:[0,0,0,1,3],ambassador:[0,0,0,0,2],prepchef:[0,0,1,2,2],controller:[0,0,0,1,1],security:[0,0,1,2,2]}
 }[cfg.plan];
 const UPG=['cashier','clerk','apprentice','bartender','counter4','seats','fridge1','head','counter5','glass','music','kitchen','table','lights','mixologist','controller','security','manager','ambassador','fridge2','fridge3'];
 const TARGET=[6,14,26,40,60];
 const log={reach:{},repo:0,peak:0,satSum:0,satN:0,stuck:0};
 let lastExp=S.exp,step=0,restocks=0;
 const fixed=()=>L.monthlyFixed();
 const reserve=()=>cfg.buf*fixed();
 function menuSize(){return L.mi().list.length}
 function best(role){const cs=[L.genCand(role),L.genCand(role),L.genCand(role)];S.cands[role]={day:L.gDay(),list:cs};let bi=0,bv=-1;cs.forEach((c,i)=>{const v=(c.sk.reduce((a,b)=>a+b,0)+2*c.lvl)/c.wage;if(v>bv){bv=v;bi=i}});return bi}
 function top(){L.ING.forEach(x=>{if(x.raw||!S.ing[x.id])return;const q=x.q?(S.ql[x.id]||0):0;for(let t=0;t<=q;t++){let g=0;while((S.stock[L.skey(x.id,t)]||0)<20&&g++<12){if(!L.buyStock(x.id,t))break}}})}
 function decide(){
  const st=S.exp,res=reserve();
  // ingredients
  let guard=0;
  while(menuSize()<TARGET[st]&&guard++<4){
    const c=L.ING.filter(x=>!x.raw&&!S.ing[x.id]&&!L.ingLock(x)&&(x.c||0)<=Math.max(0,S.money-res*0.5)*0.9).sort((a,b)=>(a.c||0)-(b.c||0))[0];
    if(!c)break;L.unlockIng(c.id);
  }
  // staff
  const plan=PLAN;let cap=L.staffCap();
  for(const role in plan){
    const want=plan[role][st]||0;
    while((S.staff[role]||0)<want&&S.team.length<cap&&L.roleUnlocked(role)&&(S.staff[role]||0)<L.roleLimit(role)){
      const i=best(role),cd=S.cands[role].list[i];
      if(S.money-res<cd.fee*3)break;
      const n0=S.team.length;L.hireCand(role,i);if(S.team.length===n0)break;
    }
  }
  // melhoramentos e treino
  UPG.forEach(id=>{const n=L.NODEMAP[id];if(!n)return;const l=L.nLevel(n);if(l>=L.nMax(n)||!L.nReqMet(n))return;const c=L.nCost(n,l);if(c<=Math.max(0,S.money-res)*cfg.spend)L.nBuy(n)});
  if(cfg.plan!=='min')L.ROLES.forEach(r=>{if((S.staff[r.id]||0)>0){const n=L.NODEMAP['t_'+r.id];if(!n)return;const l=L.nLevel(n);if(l>=L.nMax(n)||!L.nReqMet(n))return;const c=L.nCost(n,l);if(c<=Math.max(0,S.money-res)*cfg.spend*0.8)L.nBuy(n)}});
  // expandir
  const nx=L.EXPS[st+1];
  if(nx){
    const cost=L.expCost(nx);
    if(cfg.borrow&&S.money<cost+res){const need=cost-S.money;if(need>0&&S.debt+need<=L.bankLimit())L.bankBorrow(need)}
    const planTot=Object.values(PLAN).reduce((a,v)=>a+(v[st]||0),0),ready=!cfg.ready||(menuSize()>=TARGET[st]*0.7&&S.team.length>=Math.min(L.staffCap(),Math.floor(planTot*0.6)));
    if(S.money>=cost+res&&ready)L.buyExp();
  }
  // dívida
  if(S.debt>0&&S.money>S.debt*1.5+res*0.5)L.repayDebt();
  // venue
  if(cfg.venue&&S.mcount>=1){
    if(!S.deco||!S.deco.theme)L.setTheme('jazz');
    L.DECOR.forEach(d=>{if(!(S.deco&&S.deco.items&&S.deco.items[d.id])&&S.money-res>L.decorCost(d)*3)L.buyDecor(d.id)});
    if(S.exp>=2&&L.supSet)L.supSet('volume');
    const d=L.gDay();if(d%7===3&&S.exp>=1){const t=['live','quiz','cocktail'][Math.floor(d/7)%3];L.bookNight(d+1,t)}
    if(S.exp===4)L.CITIES.forEach(c=>{if(S.money-res>c.cost*1.2)L.openBranch(c.id)});
  }
  // missões (quem as usa)
  if(cfg.collect&&S.served>=8){const ms=L.msInit();if(ms.day!==L.gDay())L.msDay(true);while(ms.active.length<2&&ms.offers.length)L.msAccept(ms.offers[0].id)}
 }
 const totalMin=months*28*780/60;
 for(let t=0;t<totalMin;t++){
  L.simulate(60);S=L.getS();step++;
  if(cfg.collect)S.orders.filter(o=>o.ready).forEach(L.collect);
  else if(!S.team.some(e=>e.role==='cashier')&&step%3===0)S.orders.filter(o=>o.ready).forEach(L.collect);
  if(cfg.restock)top();else if(step%15===0)top();
  if(step%10===0)decide();
  if(S.exp>lastExp){log.reach[S.exp]=Math.round(10*L.gDay()/28)/10;lastExp=S.exp}
  if(S.exp<lastExp){log.repo++;lastExp=S.exp;S.notice=null}
  S.notice=null;S.inc=null;
  if(S.exp>log.peak)log.peak=S.exp;
  if(t>totalMin*0.75){log.satSum+=S.sat;log.satN++}
 }
 const nw=Math.round(S.money-S.debt);
 return {style,peak:log.peak,reach:log.reach,repo:log.repo,final:S.exp,networth:nw,debt:Math.round(S.debt),sat:Math.round(log.satSum/Math.max(1,log.satN)),ing:Object.keys(S.ing).length,team:S.team.length,stars:L.guideStars(),missions:(S.ms&&S.ms.done)||0,regs:(S.reg||[]).length,earned:Math.round(S.totalEarned),late:S.late}
}
