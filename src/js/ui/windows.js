/* ---------- windows: hiring, bank notices and incidents ---------- */
function openHire(role){
  if(!roleUnlocked(role))return;
  if((S.staff[role]||0)>=roleLimit(role)){toast(S.team.length>=staffCap()?"Your bar is full ("+staffCap()+" staff). Expand to make room for more.":"You cannot hire more "+STAFFM[role].pl+" right now.");return}
  var c=candsToday(role);
  var card=el("div","card");
  card.appendChild(el("h2",null,"Hire a "+STAFFM[role].n.toLowerCase()));
  card.appendChild(el("p",null,"Pick one of today’s candidates. A happy team attracts candidates who ask for less. New candidates come tomorrow."));
  c.list.forEach(function(cd,i){
    var box=el("div","cand");
    box.appendChild(el("b",null,cd.name+" · "+LVLN[cd.lvl]));
    box.appendChild(el("span",null,skillNames(role).map(function(sn,k){return sn+" "+cd.sk[k]+"/5"}).join(" · ")));
    box.appendChild(el("span",null,"Wage "+money0(cd.wage)+" a month · hiring fee "+money0(cd.fee)));
    var b=el("button","buy sm","Hire for "+money0(cd.fee));
    b.disabled=S.money<cd.fee;
    b.onclick=function(){hireCand(role,i)};
    box.appendChild(b);card.appendChild(box);
  });
  var cl=el("button","link","Close");cl.onclick=hideOv;card.appendChild(cl);
  showOv(card);
}
function showNotice(){
  var n=S.notice;if(!n)return;
  var ov=$("#ov");if(ov.classList.contains("on"))return;
  var card=el("div","card");
  if(n.type==="repo"){
    card.appendChild(el("h2",null,"The bank took your bar"));
    card.appendChild(el("p",null,"You could not pay the bills for "+LATE_MAX+" months in a row, so the bank repossessed the "+n.from.toLowerCase()+" and sold it for "+money0(n.sale)+"."));
    card.appendChild(el("p",null,(n.toDebt>0?money0(n.toDebt)+" went to the debt. ":"")+(n.cash>0?money0(n.cash)+" was left for you. ":"")+(n.debtLeft>0?"You still owe "+money0(n.debtLeft)+". ":"The debt is cleared. ")));
    card.appendChild(el("p",null,"You are back at the "+n.to.toLowerCase()+(n.fired?", and "+n.fired+" staff had to go":"")+". The recipes you learned are still yours, but the fittings, the unlocked ingredients and the training are gone: you need the requirements again to buy ingredients."));
  }else{
    card.appendChild(el("h2",null,"The bank steps in"));
    card.appendChild(el("p",null,"You are back at the lemonade stand and still behind on payments, so there is nothing smaller to sell. The bank restructures your debt from "+money0(n.debtBefore)+" down to "+money0(S.debt)+"."));
  }
  var ok=el("button","buy","Continue");ok.setAttribute("data-close","");ok.onclick=function(){S.notice=null;hideOv()};card.appendChild(ok);
  showOv(card);
}
function showIncident(){
  var ov=$("#ov");if(ov.classList.contains("on")||!S.inc)return;
  var inc=incById(S.inc.id);if(!inc){S.inc=null;return}
  var card=el("div","card");
  card.appendChild(el("h2",null,inc.t));
  card.appendChild(el("p",null,inc.x+(S.inc.ing?" It is "+INGM[S.inc.ing].n+".":"")));
  incOptions(inc).forEach(function(op,i){
    var box=el("div","cand"),c=op.c();
    box.appendChild(el("b",null,op.l));
    box.appendChild(el("span",null,c>0?"Costs "+money0(c):"Free"+(op.role?" · "+STAFFM[op.role].n+" on your team":"")));
    var b=el("button","buy sm","Choose");b.disabled=c>S.money;
    b.onclick=function(){
      var text=resolveInc(i,false);if(text===null)return;
      var out=el("div","card");out.appendChild(el("h2",null,inc.t));out.appendChild(el("p",null,text));
      var ok=el("button","buy","Continue");ok.onclick=hideOv;out.appendChild(ok);showOv(out);
    };
    box.appendChild(b);card.appendChild(box);
  });
  showOv(card);
}
/* export: the game as text to copy or a file to keep; import: paste or pick that text on another device */
function openExport(){
  var text=exportSave(JSON.parse(prefsText()||"null")),card=el("div","card");
  card.appendChild(el("h2",null,"Export your game"));
  card.appendChild(el("p",null,"Keep this as a backup, or import it on another device. It holds your whole bar."));
  var ta=el("textarea","savebox");ta.readOnly=true;ta.value=text;ta.setAttribute("aria-label","Your saved game");card.appendChild(ta);
  var row=el("div","eacts"),cp=el("button","ghost","Copy"),dl=el("button","ghost","Download file");
  cp.onclick=function(){
    var done=function(){toast("Saved game copied.")};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done,function(){ta.select();document.execCommand("copy");done()});
    else{ta.select();document.execCommand("copy");done()}
  };
  dl.onclick=function(){
    var a=document.createElement("a"),d=new Date(now());
    a.href=URL.createObjectURL(new Blob([text],{type:"application/json"}));
    a.download="last-call-"+d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate())+".json";
    document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
  };
  row.append(cp,dl);card.appendChild(row);
  var cl=el("button","link","Close");cl.onclick=hideOv;card.appendChild(cl);
  showOv(card);
}
function openImport(){
  var card=el("div","card");
  card.appendChild(el("h2",null,"Import a game"));
  card.appendChild(el("p",null,"Paste an exported game or choose its file. It replaces the game on this device."));
  var ta=el("textarea","savebox");ta.setAttribute("aria-label","Exported game to import");card.appendChild(ta);
  var file=el("input");file.type="file";file.accept=".json,.txt,application/json,text/plain";file.setAttribute("aria-label","Choose an exported game file");
  file.onchange=function(){var f=file.files&&file.files[0];if(!f)return;var r=new FileReader();r.onload=function(){ta.value=String(r.result)};r.readAsText(f)};
  card.appendChild(file);
  var msg=el("p","gnote up");msg.setAttribute("role","alert");card.appendChild(msg);
  var go=el("button","buy","Replace my game"),armed=false;
  go.onclick=function(){
    var d;
    try{d=parseSave(ta.value)}catch(e){msg.textContent=e.message;armed=false;go.textContent="Replace my game";return}
    if(!armed){armed=true;msg.textContent="";go.textContent="Tap again: your current game will be gone";return}
    replaceGame(d);
  };
  card.appendChild(go);
  var cl=el("button","link","Close");cl.onclick=hideOv;card.appendChild(cl);
  showOv(card);
}
