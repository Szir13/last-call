/* ---- special missions: button, window and announcements ---- */
function openMissions(){
  var ms=msInit();ms.seen=true;
  var card=h("div","card");
  card.appendChild(h("h2",null,"Special missions"));
  card.appendChild(h("p",null,"Finish a mission before the time runs out to earn a cash bonus. You can hold "+MS_MAX+" at once, and new offers arrive every day."));
  card.appendChild(h("div","h","In progress ("+ms.active.length+" of "+MS_MAX+")"));
  if(!ms.active.length)card.appendChild(h("p","note","Nothing yet. Accept a mission below."));
  ms.active.forEach(function(m1){
    var box=h("div","cand");
    box.appendChild(h("b",null,m1.title));
    var left=Math.max(0,m1.dl-gDay()+1);
    box.appendChild(h("span",null,m1.p+" of "+m1.n+" · "+left+" day"+(left===1?"":"s")+" left · reward "+money0(m1.reward)));
    var bar=h("div","pxbr"),fi=h("i");fi.style.width=Math.min(100,m1.p/m1.n*100)+"%";bar.appendChild(fi);box.appendChild(bar);
    var ab=h("button","link","Give up");ab.onclick=function(){msAbandon(m1.id);openMissions()};box.appendChild(ab);
    card.appendChild(box);
  });
  card.appendChild(h("div","h","On offer today"));
  if(!ms.offers.length)card.appendChild(h("p","note","No offers right now. Come back tomorrow."));
  ms.offers.forEach(function(m1){
    var box=h("div","cand");
    box.appendChild(h("b",null,m1.title));
    box.appendChild(h("span",null,"Within "+m1.days+" days · reward "+money0(m1.reward)));
    var b=h("button","buy sm","Accept");b.disabled=ms.active.length>=MS_MAX;
    b.onclick=function(){if(msAccept(m1.id)){sfx("tab");openMissions()}};
    box.appendChild(b);card.appendChild(box);
  });
  card.appendChild(h("p","note","Completed "+ms.done+" · earned "+money0(ms.earned)+" · missed "+ms.failed));
  var cl=h("button","link","Close");cl.onclick=hideOv;card.appendChild(cl);
  showOv(card);updMisBtn();
}
document.getElementById("pxmis").addEventListener("click",openMissions);
function updMisBtn(){
  var b=document.getElementById("pxmis"),ms=S.ms,show=(S.served>=8||S.mcount>=1||(ms&&ms.done>0));
  b.hidden=!show;if(!show)return;
  ms=msToday();
  var t="Missions"+(ms.active.length?" "+ms.active.length+"/"+MS_MAX:"")+(!ms.seen&&ms.offers.length?" \u2022":"");
  if(b._t!==t){b._t=t;b.textContent=t}
}
var lastMisDone=S.ms?S.ms.done:0;
function misTick(){
  updMisBtn();
  if(S.ms&&S.ms.done>lastMisDone){
    lastMisDone=S.ms.done;
    var cc=mk(8,8);spr(cc.getContext("2d"),SP.coin,0,0,{K:"#2a1a14",L:"#f2c14a",W:"#fff3b0"});pxCv(cc,8,8,3);
    showBan("Mission complete!",S.ms.last.t+" \u00b7 +"+money0(S.ms.last.r),cc);sfx("new");
  }
}

