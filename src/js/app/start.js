/* ---------- start ---------- */
load();
recomputeMarket();
build();
(function(){
  var now=Date.now(),away=(now-S.last)/1000;
  if(S.kits&&away>30){
    var res=simulate(Math.min(away,offlineCap()));
    if(res.earned>=1){
      var card=el("div","card");
      card.appendChild(el("h2",null,"Welcome back"));
      card.appendChild(el("p",null,"While you were away, your team served "+res.served+" orders and the bar earned "+mshow(res.earned)+"."));
      var ok=el("button","big","Continue");ok.onclick=hideOv;card.appendChild(ok);
      showOv(card);
    }
  }
  S.last=now;lastT=now;
  wasOpen=isOpenNow();
  if(!S.kits)beginRun();
})();
update();
