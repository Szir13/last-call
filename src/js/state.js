/* ---------- state ---------- */
/* Saves are upgraded one numbered step at a time. A save without v is version 0 (everything saved
   before versions existed). To change the save format: add a step at the end, never edit an old one,
   and add a fixture to tests/saves/. Each step also gets the raw saved object, to tell "missing in
   the save" from "filled in by def()". */
var MIGRATIONS=[
  /* 0 -> 1: wages scale with the venue; saves from before stored stand-level wages */
  function(raw){if(S.kits&&!raw.wkMig){var wk0=wk();if(wk0!==1)S.team.forEach(function(e){e.wage=Math.round(e.wage*wk0/10)*10})}S.wkMig=1},
  /* 1 -> 2: weekly schedules and overtime are gone; overtime already owed counts as payroll */
  function(){
    /* fields that no longer exist in the types: reach them as plain objects */
    S.team.forEach(function(e){var o=/** @type {any} */(e);delete o.sch;delete o.ot});
    [S.month,S.lastMonth].forEach(function(m){var o=/** @type {any} */(m);if(o&&o.ot!==undefined){o.pay+=o.ot||0;delete o.ot}});
  }
];
function defHours(){var a=[];for(var i=0;i<7;i++)a.push([10,22]);return a}
function newMonth(){return{rev:0,cogs:0,rent:0,util:0,pay:0,waste:0,interest:0,gs:0,gn:0,gp:0}}
/* every field the game uses, with the value it has before the feature is first touched */
/** @returns {State} */
function def(){var seed=ENV.seed();return{v:MIGRATIONS.length,seed:seed,rng:seed,money:300,totalEarned:0,served:0,walkouts:0,
  ing:{},ql:{},brand:{},stock:{},bat:{},auto:{},par:{},parCat:{},notes:[],
  price:{},act:{},cprice:{},staff:{},train:{},upg:{},exp:0,expAt:0,
  orders:[],jobs:[],hold:[],arrive:2,nextId:1,sat:60,reorders:0,
  mkt:{drift:{},ev:[],next:80,t20:20},ctlT:15,chefB:0,
  rep:0,pts:0,perm:{},ach:{},sold:{p:false,u:false},paidDebt:false,
  debt:0,late:0,mcount:0,month:newMonth(),lastMonth:null,notice:null,
  gt:600,curDay:0,hours:defHours(),dayE:0,dayN:0,prev:{e:0,n:0},
  picks:{},known:[],kits:false,barName:"",
  team:[],cands:{},mood:60,moodB:0,nextEmp:1,maxStaff:{},starter:{},wkMig:1,
  hhUntil:0,hhReady:0,last:now(),newRec:false,
  /* long-term systems */
  ms:{offers:[],active:[],next:1,day:-1,done:0,failed:0,earned:0,last:null,seen:true},
  reg:[],nextReg:0,guide:null,deco:{items:{},theme:null},sup:{mode:"spot"},nights:{},mods:[],ban:{},
  inc:null,calmed:0,br:[],leg:{pts:0,perks:{}},legacy:0}}
/** @type {State} */
var S=def();
/* load a saved object: defaults first, then the save, then the migration steps it has not had yet */
function fromSave(raw){S=Object.assign(def(),raw);S.v=raw.v||0;migrate(raw)}
function migrate(raw){
  /* repairs: cheap checks that keep a damaged save playable */
  if(!Array.isArray(S.hours)||S.hours.length!==7)S.hours=defHours();
  if(!S.prev)S.prev={e:0,n:0};
  if(!S.month)S.month=newMonth();
  if(!Array.isArray(S.team))S.team=[];
  for(var v=S.v||0;v<MIGRATIONS.length;v++)MIGRATIONS[v](raw||{});
  S.v=Math.max(S.v||0,MIGRATIONS.length);
  syncStaff();
}
