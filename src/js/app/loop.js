/* ---------- loop ---------- */
var lastT=Date.now(),lastSave=Date.now();
function loop(){
  var now=Date.now(),dt=(now-lastT)/1000;lastT=now;
  if(S.kits){
    if(dt>5){
      var res=simulate(Math.min(dt,offlineCap()));
      if(res.earned>=1)toast("While you were away, the bar earned "+mshow(res.earned));
    }else tick(dt,false);
  }
  checkUnlocks();
  if(S.notice)showNotice();else if(S.inc)showIncident();
  update();
  if(now-lastSave>5000){lastSave=now;save()}
}


