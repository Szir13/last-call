/* ---------- schedules: every employee has a weekly grid of start hour and length ---------- */
var OFFSTART=[0,1,2,6,3,4,5];     /* default days off: Mon-Tue first, Fri-Sat last */
var LEAD={prepchef:2,clerk:1};    /* back of house starts before opening */
var HV=0,TV=0;                     /* HV: opening hours changed. TV: the team or a schedule changed */
function autoSched(role,idx){
  var out=[];
  for(var wd=0;wd<7;wd++){
    var hr=S.hours[wd],o=hr[0],c=hr[1],span=spanOf(o,c);
    var os=OFFSTART[idx%7],off=wd===os||wd===(os+1)%7;
    if(off||!span){out.push([0,0]);continue}
    var L=Math.min(8,span),lead=LEAD[role]||0,early=(idx%2===0)||lead>0;
    var start=early?o-lead:o+span-L;
    out.push([((start%24)+24)%24,L]);
  }
  return out;
}
function empWorksAt(e,day,h){return true}   /* schedules are gone: the team works whenever the bar is open */
function schedStats(e){return{days:5,hours:40,ot:0,last:-1}}
function otHoursOn(e,wd){return 0}
var SC={key:"",c:{}};
function shiftCounts(){
  var d=gDay(),hr=gHour();
  var key=d+"|"+Math.floor(hr)+"|"+HV+"|"+TV;
  if(SC.key===key)return SC.c;
  var c={emps:[],cashiers:[]};
  ROLES.forEach(function(r){c[r.id]=0;c[r.id+"_lv"]=0});
  S.team.forEach(function(e){
    if(empWorksAt(e,d,hr)){
      c[e.role]++;c.emps.push(e);
      if(e.role==="clerk")c.clerk_lv+=(e.cl||1);
      if(e.role==="cashier")c.cashiers.push(e);
    }
  });
  SC.key=key;SC.c=c;
  return c;
}
function onShift(id){return shiftCounts()[id]||0}
function roleSkill(role,idx){var l=0,n=0;shiftCounts().emps.forEach(function(e){if(e.role===role){l+=e.sk[idx];n++}});return n?l/n:0}
function empAvg(role,idx){var l=0,n=0;S.team.forEach(function(e){if(e.role===role){l+=e.sk[idx];n++}});return n?l/n:0}
function floorAvg(idx){
  var sum=OWN[idx],n=1;
  shiftCounts().emps.forEach(function(e){if(STAFFM[e.role].sp){sum+=e.sk[idx];n++}});
  return sum/n;
}
function perfMult(){return S.team.length?clamp(0.75+0.5*S.mood/100,0.75,1.25):1}
function cashierAt(slot){return shiftCounts().cashiers[slot]||null}
function roleCountAt(role,day,h){var k=0;S.team.forEach(function(e){if(e.role===role&&empWorksAt(e,day,h))k++});return k}
function staffAt(day,h){return isOpenAt(day,h)?S.team.length:0}
function daysWorking(role,day){var k=0;S.team.forEach(function(e){if(e.role===role)k++});return k}

function setHours(w,o,c){
  if(!isFinite(o)||!isFinite(c))return;
  if(spanOf(o,c)>MAXOPEN)c=(o+MAXOPEN)%24;
  S.hours[w]=[o,c];HV++;
}
function rnd(n){var x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function evStartAt(day){
  if(rnd(day*1.37+2.1)>0.2)return null;
  for(var j=0;j<8;j++){
    var t=RANDOM[Math.floor(rnd(day*3.31+5.7+j*17.3)*RANDOM.length)];
    if((!t.wd||t.wd.indexOf(day%7)>=0)&&(t.p===undefined||rnd(day*7.7+j*3.1)<t.p))return t;
  }
  return null;
}
var EVM={};
function eventsOn(day){
  if(EVM[day])return EVM[day];
  var out=[],doy=((day%336)+336)%336;
  HOLIDAYS.forEach(function(hd){
    var hs=hd.m*28+hd.d-1,off=(doy-hs+336)%336;
    if(off<hd.len)out.push({id:hd.id,n:hd.n,fx:hd.fx,mk:hd.mk,hol:true,k:off,len:hd.len});
  });
  for(var k=0;k<3;k++){
    var s=day-k;if(s<0)continue;
    var t=evStartAt(s);
    if(t&&k<t.len)out.push({id:t.id,n:t.n,fx:t.fx,mk:t.mk,hol:false,k:k,len:t.len});
  }
  EVM[day]=out;
  return out;
}
function fxFor(day){
  var fx={dem:1,per:{},type:{},fam:{},sat:0};
  eventsOn(day).forEach(function(e){
    var f=e.fx||{};
    if(f.dem)fx.dem*=f.dem;
    for(var p in f.per)fx.per[p]=(fx.per[p]||1)*f.per[p];
    for(var t in f.type)fx.type[t]=(fx.type[t]||1)*f.type[t];
    for(var m in f.fam)fx.fam[m]=(fx.fam[m]||1)*f.fam[m];
  });
  var wx=weatherOf(day),se=seasonOf(day),outdoor=(S.exp===0||S.exp===3);
  fx.dem*=outdoor?[1.1,1,0.72,0.6][wx]:[1,1,1.05,1][wx];
  if(se===2){fx.dem*=1.03;["Soft","Refreshing","Tropical"].forEach(function(f2){fx.fam[f2]=(fx.fam[f2]||1)*1.25})}
  if(se===0){["Classic","Neat"].forEach(function(f2){fx.fam[f2]=(fx.fam[f2]||1)*1.2})}
  var nt=S.nights&&S.nights[day];
  if(nt&&NIGHTS[nt]){var nd=NIGHTS[nt];for(var p2 in nd.per)fx.per[p2]=(fx.per[p2]||1)*nd.per[p2];for(var ty in nd.type)fx.type[ty]=(fx.type[ty]||1)*nd.type[ty];for(var fm in nd.fam)fx.fam[fm]=(fx.fam[fm]||1)*nd.fam[fm];fx.sat+=nd.sat}
  (S.mods||[]).forEach(function(m2){if(day>=m2.from&&day<=m2.until){fx.dem*=m2.dem;fx.sat+=m2.sat||0}});
  return fx;
}
var FXC={day:-1,fx:null};
function fxNow(){var d=gDay();if(FXC.day!==d){FXC.day=d;FXC.fx=fxFor(d)}return FXC.fx}
function demandAt(day,h,fx){
  fx=fx||fxFor(day);
  return HDEM[Math.floor(h)]*WDAY[day%7]*fx.dem*(fx.per[periodOf(h)]||1);
}
function demandNow(){return demandAt(gDay(),gHour(),fxNow())}
function fxText(e){
  var f=e.fx||{},p=[];
  if(f.dem&&f.dem!==1)p.push("customers ×"+f.dem);
  for(var k in f.per)p.push(PERN[k]+" ×"+f.per[k]);
  for(var t in f.type)p.push(t.toLowerCase()+"s ×"+f.type[t]);
  for(var m in f.fam)p.push(m.toLowerCase()+" drinks ×"+f.fam[m]);
  if(e.mk)p.push(e.mk.h);
  return p.join(", ");
}
var NCM={k:"",v:null};
function nextChange(){
  var key=Math.floor(S.gt/30)+"|"+JSON.stringify(S.hours);
  if(NCM.k===key)return NCM.v;
  var open=isOpenNow(),res={open:open,at:null};
  for(var s=30;s<=48*60;s+=30){
    var gg=S.gt+s,d=Math.floor(gg/1440),h=(gg%1440)/60;
    if(isOpenAt(d,h)!==open){res.at=pad2(Math.floor(h))+":00";break}
  }
  NCM.k=key;NCM.v=res;
  return res;
}

