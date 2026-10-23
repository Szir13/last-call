/* ---------- who is on shift: everyone on the team works whenever the bar is open ---------- */
var HV=0,TV=0;                     /* HV: opening hours changed. TV: the team changed */
var SC={key:"",c:{}};
function shiftCounts(){
  var key=gDay()+"|"+Math.floor(gHour())+"|"+TV;
  if(SC.key===key)return SC.c;
  var c={emps:[],cashiers:[]};
  ROLES.forEach(function(r){c[r.id]=0;c[r.id+"_lv"]=0});
  S.team.forEach(function(e){
    c[e.role]++;c.emps.push(e);
    if(e.role==="clerk")c.clerk_lv+=(e.cl||1);
    if(e.role==="cashier")c.cashiers.push(e);
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
