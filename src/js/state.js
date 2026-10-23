/* ---------- state ---------- */
function defHours(){var a=[];for(var i=0;i<7;i++)a.push([10,22]);return a}
function newMonth(){return{rev:0,cogs:0,rent:0,util:0,pay:0,waste:0,interest:0,gs:0,gn:0,gp:0}}
function def(){return{money:300,totalEarned:0,served:0,walkouts:0,
  ing:{},ql:{},brand:{},stock:{},bat:{},auto:{},par:{},parCat:{},notes:[],
  price:{},act:{},cprice:{},staff:{},train:{},upg:{},exp:0,
  orders:[],jobs:[],arrive:2,nextId:1,sat:60,
  mkt:{drift:{},ev:[],next:80,t20:20},ctlT:15,chefB:0,
  rep:0,pts:0,perm:{},ach:{},sold:{p:false,u:false},paidDebt:false,
  debt:0,late:0,mcount:0,month:newMonth(),lastMonth:null,
  gt:600,curDay:0,hours:defHours(),dayE:0,dayN:0,prev:{e:0,n:0},
  picks:{},known:[],kits:false,
  team:[],cands:{},mood:60,moodB:0,nextEmp:1,maxStaff:{},
  hhUntil:0,hhReady:0,last:now(),newRec:false}}
var S=def();
/* bring a loaded save up to date (new fields are also created lazily where they are used) */
function migrate(){
  if(!Array.isArray(S.hours)||S.hours.length!==7)S.hours=defHours();
  if(!S.prev)S.prev={e:0,n:0};
  if(!S.month)S.month=newMonth();
  if(!Array.isArray(S.team))S.team=[];
  /* weekly schedules and overtime are gone: drop their fields, overtime already owed counts as payroll */
  S.team.forEach(function(e){delete e.sch;delete e.ot});
  [S.month,S.lastMonth].forEach(function(m){if(m&&m.ot!==undefined){m.pay+=m.ot||0;delete m.ot}});
  syncStaff();
  if(S.kits&&!S.wkMig){S.wkMig=1;var wk0=wk();if(wk0!==1)S.team.forEach(function(e){e.wage=Math.round(e.wage*wk0/10)*10})}
}

