/* ---------- special missions: finish a task before it runs out for a cash bonus ---------- */
var MS_DAYREV=[505,3000,10400,22300,34000];
var MS_MAX=2;     /* missions you can hold at once */     /* typical revenue of one day in each venue; rewards are a share of it */
function msInit(){if(!S.ms)S.ms={offers:[],active:[],next:1,day:-1,done:0,failed:0,earned:0,last:null,seen:true};return S.ms}
function msExpected(list){
  /* how many drinks a day the bar sells, and each drink's share of them */
  var hr=S.hours[gDay()%7],span=Math.max(6,spanOf(hr[0],hr[1])),arrivals=span*60/interval()*arrivalMult()*0.9;
  var perOrder=1+(EXPS[S.exp].k+(S.upg.table?1:0)-1)/2,tot=0,w={};
  list.forEach(function(x){w[x.id]=Math.pow(x.p,0.6)*(x.solo?0.5:1);tot+=w[x.id]});
  return{perDay:arrivals*perOrder,share:function(x){return tot?w[x.id]/tot:0}};
}
function msRound(v){return Math.max(10,Math.round(v/10)*10)}
function msGenerate(){
  var ms=msInit(),m=mi(),list=m.list.filter(function(x){return !x.solo});
  if(!list.length)list=m.list;
  ms.offers=[];
  if(!list.length)return;
  var ex=msExpected(m.list),flat=MS_DAYREV[S.exp];
  var fams={};list.forEach(function(x){(fams[x.f]=fams[x.f]||[]).push(x)});
  var famNames=Object.keys(fams).filter(function(f){return fams[f].length>=2});
  var avg=0;m.list.forEach(function(x){avg+=priceOf(x)});avg=avg/m.list.length||1;
  var types=["drink","family","streak","drink"],picks=[],usedItem={};
  while(picks.length<3&&types.length){var t=types.splice(Math.floor(random()*types.length),1)[0];if(picks.indexOf(t)<0||t==="drink")picks.push(t)}
  picks.forEach(function(type){
    if(type==="drink"&&!list.some(function(x){return !usedItem[x.id]}))type="streak";
    var id=ms.next++,n,m1,days,jitter=0.8+random()*0.5;
    if(type==="drink"||(type==="family"&&!famNames.length)){
      var it=wpick(list,function(x){return usedItem[x.id]?0.0001:Math.pow(x.p,0.6)});usedItem[it.id]=1;
      days=4;n=Math.max(6,Math.min(90,Math.round(ex.perDay*ex.share(it)*days*1.6*jitter)));
      m1={id:id,type:"drink",item:it.id,n:n,days:days,title:"Serve "+n+" "+it.n,reward:msRound(flat*0.25*clamp(priceOf(it)/avg,0.8,1.3))};
    }else if(type==="family"){
      var fam=famNames[Math.floor(random()*famNames.length)],sh=0,fa=0;
      fams[fam].forEach(function(x){sh+=ex.share(x);fa+=priceOf(x)});fa=fa/fams[fam].length;
      days=5;n=Math.max(10,Math.min(200,Math.round(ex.perDay*sh*days*1.6*jitter)));
      m1={id:id,type:"family",fam:fam,n:n,days:days,title:"Serve "+n+" "+fam.toLowerCase()+" drinks",reward:msRound(flat*0.22*clamp(fa/avg,0.8,1.3))};
    }else{
      days=4;n=30+Math.floor(random()*21);
      m1={id:id,type:"streak",n:n,days:days,title:"Serve "+n+" orders in a row without losing a customer",reward:msRound(flat*0.14)};
    }
    ms.offers.push(m1);
  });
}
function msAccept(id){
  var ms=msInit();if(ms.active.length>=MS_MAX)return false;
  for(var i=0;i<ms.offers.length;i++){if(ms.offers[i].id===id){var m1=ms.offers.splice(i,1)[0];m1.p=0;m1.dl=gDay()+m1.days;ms.active.push(m1);return true}}
  return false;
}
function msAbandon(id){var ms=msInit();ms.active=ms.active.filter(function(m1){return m1.id!==id})}
function msStreakBreak(){var ms=S.ms;if(!ms)return;ms.active.forEach(function(m1){if(m1.type==="streak")m1.p=0})}
function msComplete(m1){
  var ms=msInit();ms.active=ms.active.filter(function(x){return x!==m1});
  S.money+=m1.reward;S.totalEarned+=m1.reward;S.month.rev+=m1.reward;S.dayE+=m1.reward;
  ms.done++;ms.earned+=m1.reward;ms.last={t:m1.title,r:m1.reward};
  toast("Mission complete: "+m1.title+". +"+money0(m1.reward));
}
function msProgress(o){
  var ms=S.ms;if(!ms||!ms.active.length)return;
  var done=[];
  ms.active.forEach(function(m1){
    if(m1.type==="drink"){o.items.forEach(function(it){if(it.r===m1.item)m1.p++})}
    else if(m1.type==="family"){o.items.forEach(function(it){if(ITM[it.r].f===m1.fam)m1.p++})}
    else m1.p++;
    if(m1.p>=m1.n)done.push(m1);
  });
  done.forEach(msComplete);
}
/* missions for today: offers are drawn the first time they are looked at on a new day */
function msToday(){var ms=msInit();if(ms.day!==gDay())msDay(true);return ms}
function msDay(quiet){
  var ms=msInit(),d=gDay();
  ms.active=ms.active.filter(function(m1){if(d>m1.dl){ms.failed++;if(!quiet)toast("Mission expired: "+m1.title+".");return false}return true});
  if(ms.day!==d){ms.day=d;ms.seen=false;msGenerate();if(!quiet&&S.served>=8)toast("New special missions are on offer.")}
}


/* ====================== long-term systems ====================== */
function dRev(){return MS_DAYREV[S.exp]}
function ic(f){return Math.max(10,Math.round(f*dRev()/10)*10)}
function hasRole(r){return (S.staff[r]||0)>0}
function legLvl(id){return ((S.leg&&S.leg.perks)||{})[id]||0}

