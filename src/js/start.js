/* ---------- start ---------- */
load();
if(S.kits&&!S.wkMig){S.wkMig=1;var wk0=wk();if(wk0!==1)S.team.forEach(function(e){e.wage=Math.round(e.wage*wk0/10)*10})}
recomputeMarket();
build();
(function(){
  var now=Date.now(),away=(now-S.last)/1000;
  if(S.kits&&away>30){
    var res=simulate(Math.min(away,offlineCap()));
    if(res.earned>=1){
      var card=h("div","card");
      card.appendChild(h("h2",null,"Welcome back"));
      card.appendChild(h("p",null,"While you were away, your team served "+res.served+" orders and the bar earned "+mshow(res.earned)+"."));
      var ok=h("button","big","Continue");ok.onclick=hideOv;card.appendChild(ok);
      showOv(card);
    }
  }
  S.last=now;lastT=now;
  wasOpen=isOpenNow();
  if(!S.kits)beginRun();
})();
update();
