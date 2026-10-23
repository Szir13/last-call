/* ---- stock: unlocked ingredients together, locked ones together ---- */
var stkSig="",stkH=null;
function groupStock(){
  var p=document.getElementById("p-stock");if(!p||!ref.ing||!ref.grp)return;
  var sig=ING.map(function(x){return ((x.raw||has(x.id))?1:0)+(x.q?":"+(S.ql[x.id]||0):"")}).join("");
  if(sig===stkSig&&stkH)return;
  if(!stkH){
    stkH={un:el("div","h pxsec","Unlocked"),lk:el("div","h pxsec","Locked"),grp:{}};
    var hs=p.querySelectorAll(":scope > .h");
    GROUPS.forEach(function(gr){for(var i=0;i<hs.length;i++){if(hs[i].textContent===gr[1]&&!hs[i].classList.contains("pxsec")){stkH.grp[gr[0]]=hs[i];break}}});
  }
  stkSig=sig;
  function tierRows(x,wantOpen){var r=ref.ing[x.id],a=[];if(r.tiers){var ql=S.ql[x.id]||0;for(var t=1;t<3;t++){if(r.tiers[t]&&((ql>=t)===wantOpen))a.push(r.tiers[t].row)}}return a}
  var unRows=[],lkBy={},nUn=0,nLk=0;
  GROUPS.forEach(function(gr){
    lkBy[gr[0]]=[];
    ING.filter(function(x){return x.g===gr[0]}).sort(function(a,b){return u0(a)-u0(b)}).forEach(function(x){
      if(!ref.ing[x.id])return;
      var r0=ref.ing[x.id].row;
      if(x.raw||has(x.id)){
        if(!x.raw)nUn++;
        unRows=unRows.concat([r0],tierRows(x,true));
        var lt=tierRows(x,false);if(lt.length){nLk+=lt.length;lkBy[gr[0]]=lkBy[gr[0]].concat(lt)}
      }else{nLk++;lkBy[gr[0]]=lkBy[gr[0]].concat([r0],tierRows(x,true),tierRows(x,false))}
    });
  });
  stkH.un.textContent="Unlocked · "+nUn;stkH.lk.textContent="Locked · "+nLk;
  var frag=document.createDocumentFragment();
  frag.appendChild(stkH.un);
  unRows.forEach(function(r){r.classList.remove("fold");frag.appendChild(r)});
  frag.appendChild(stkH.lk);
  GROUPS.forEach(function(gr){
    var hd=stkH.grp[gr[0]],gn=ref.grp[gr[0]],rows=lkBy[gr[0]];
    if(hd){frag.appendChild(hd);if(rows.length)hd.removeAttribute("data-empty");else hd.setAttribute("data-empty","1")}
    if(gn){frag.appendChild(gn);if(rows.length)gn.removeAttribute("data-empty");else gn.setAttribute("data-empty","1")}
    rows.forEach(function(r){frag.appendChild(r)});
  });
  p.appendChild(frag);
  applyFolds();
}

