// Runs one economy scenario in the page and returns last month's numbers.
// Argument: {stage, ings, ql, qlv, upg, train, team, lvl, sk, wmul, days, par, econ, linger}
(c)=>{
 const L=window.__lc,S=L.getS();clearInterval(window.__loopId);
 Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,L.def());L.beginRun();
 if(c.econ){c.econ.forEach((e,i)=>Object.assign(L.EXPS[i],e))}
 if(c.linger){c.linger.forEach((v,i)=>{L.LINGER[i]=v})}
 S.exp=c.stage;S.expAt=-9;S.money=5e7;S.tut=99;
 (c.ings||[]).forEach(id=>{S.ing[id]=1});
 (c.ql||[]).forEach(id=>{S.ql[id]=c.qlv||1});
 Object.assign(S.upg,c.upg||{});
 S.train=Object.assign({},c.train||{});
 Object.keys(c.team||{}).forEach(role=>{
   const n=c.team[role],ns=L.skillNames(role).length;
   for(let i=0;i<n;i++){S.team.push({id:S.nextEmp++,name:'E'+role+i,role:role,lvl:c.lvl||0,xp:0,sk:Array(ns).fill(c.sk||3),wage:Math.round(L.STAFFM[role].w*(c.wmul||1)),cl:(role==='clerk'?(c.clerkcl||1):1),ot:0,sch:L.autoSched(role,i)})}
 });
 L.resetMI();L.syncStaff();L.autoAssignClerk();
 const days=c.days||58;
 const par=c.par||20;
 const top=()=>{L.ING.forEach(x=>{if(x.raw||!S.ing[x.id])return;const q=x.q?(S.ql[x.id]||0):0;for(let t=0;t<=q;t++){let g=0;while((S.stock[L.skey(x.id,t)]||0)<par&&g++<40)L.buyStock(x.id,t)}})};
 const totalSec=days*780;let acc=0,lastTop=0,occ=0,occN=0,occMax=0,full=0;
 for(let t=0;t<totalSec;t+=6){L.simulate(6);S.orders.filter(o=>o.ready).forEach(L.collect);{const n=S.orders.length+(S.hold||[]).length;if(t>780*30){occ+=n;occN++;if(n>occMax)occMax=n;if(n>=L.maxSlots())full++}}acc+=6;if(acc-lastTop>=60){top();lastTop=acc}}
 const lm=S.lastMonth||{};
 return {avgOcc:Math.round(10*occ/Math.max(1,occN))/10,maxOcc:occMax,seats:L.maxSlots(),fullPct:Math.round(100*full/Math.max(1,occN)),rev:Math.round(lm.rev||0),cogs:Math.round(lm.cogs||0),rent:Math.round(lm.rent||0),util:Math.round(lm.util||0),pay:Math.round(lm.pay||0),ot:Math.round(lm.ot||0),profit:Math.round(lm.profit||0),
   served:S.served,walk:S.walkouts,sat:Math.round(S.sat),rep:Math.round((S.rep||0)*10)/10,staff:S.team.length,menu:L.mi().list.length,debt:Math.round(S.debt||0)}
}
