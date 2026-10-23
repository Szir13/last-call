/* ---- icons and portraits on rows, cards open on tap ---- */
function decorate(){
  var id,r,t;
  for(id in ref.ing){
    r=ref.ing[id];
    if(r.row&&!r.row._ic){r.row._ic=1;r.row.insertBefore(icoBox(ingIconEl(id)),r.row.firstChild)}
    if(r.tiers){
      for(var tq=1;tq<3;tq++){
        var tr2=r.tiers[tq];
        if(tr2&&tr2.row&&!tr2.row._ic){
          tr2.row._ic=1;var tb=icoBox(ingIconEl(id));tb.appendChild(el("span","pxstar",tq===1?"\u2605":"\u2605\u2605"));
          tr2.row.insertBefore(tb,tr2.row.firstChild);
        }
      }
    }
  }
  for(id in ref.rec){
    r=ref.rec[id];
    if(r.row&&!r.row._ic&&ITM[id]){r.row._ic=1;r.row.insertBefore(icoBox(glassEl(ITM[id])),r.row.firstChild);var g0=r.row.firstChild.firstChild;g0.style.width=(g0.width*3)+"px";g0.style.height=(g0.height*3)+"px"}
  }
  ROLES.forEach(function(x,i){
    r=ref.staff[x.id];
    if(r&&r.row&&!r.row._ic){r.row._ic=1;r.row.insertBefore(icoBox(roleIcon(x.id,i+3)),r.row.firstChild)}
  });
  S.team.forEach(function(e){
    r=ref.emps&&ref.emps[e.id];
    if(r&&r.row&&!r.row._ic){r.row._ic=1;r.row.insertBefore(icoBox(portraitFor(e)),r.row.firstChild)}
  });
}
function portraitFor(e){var c=mk(12,18);drawPerson(c.getContext("2d"),staffLook(e),6,18,0,0,false);return pxCv(c,12,18,2)}
setInterval(decorate,700);decorate();
document.addEventListener("click",function(e){
  var row=e.target.closest&&e.target.closest("#p-stock>.row,#p-book>.row,#p-staff>.row");
  if(!row||e.target.closest("button,input,select"))return;
  if(row.hasAttribute("data-open"))row.removeAttribute("data-open");else row.setAttribute("data-open","1");
});

/* ---- team dashboard: numbers and bars instead of paragraphs ---- */
var dash=null;
function buildDash(){
  var s=document.getElementById("p-staff");if(!s||s.querySelector(".pxdash"))return;
  var d=el("div","pxdash"),grid=el("div","pxg3");
  function tile(icon,label){var t=el("div","pxtile"),ic=el("div","pxti"),tx=el("div","pxtx"),v=el("b",null,"—");ic.appendChild(icon);tx.append(el("span",null,label),v);t.append(ic,tx);grid.appendChild(t);return v}
  var cc=mk(8,8);spr(cc.getContext("2d"),SP.coin,0,0,{K:"#2a1a14",L:"#f2c14a",W:"#fff3b0"});pxCv(cc,8,8,3);
  var cd=mk(7,7);spr(cd.getContext("2d"),SP.card,0,0,{K:"#2a1a14",L:"#9fdcd0"});pxCv(cd,7,7,3);
  var vCash=tile(cc,"Cash"),vDue=tile(cd,"Bills due"),vTeam=tile(portraitFor({role:"bartender",id:2}),"Team"),faceHold=el("span");
  var vMood=tile(faceEl(60,3),"Team mood");
  d.appendChild(grid);
  var b1=el("div","pxbl"),l1=el("span"),bar1=el("div","pxbr"),f1=el("i");bar1.appendChild(f1);b1.append(l1,bar1);d.appendChild(b1);
  var b2=el("div","pxbl"),l2=el("span"),bar2=el("div","pxbr"),f2=el("i");bar2.appendChild(f2);b2.append(l2,bar2);d.appendChild(b2);
  var warn=el("div","pxwarn"),wt=el("span"),wb=el("button","ghost","Repay debt");wb.type="button";wb.addEventListener("click",function(){repayDebt()});warn.append(wt,wb);warn.hidden=true;d.appendChild(warn);
  var first=s.children[1];s.insertBefore(d,first||null);
  dash={vTeam:vTeam,vCash:vCash,vDue:vDue,vMood:vMood,l1:l1,f1:f1,l2:l2,f2:f2,warn:warn,wt:wt,wb:wb,face:null,moodTile:vMood.parentNode.parentNode,lastMood:-1};
}
function updDash(){
  if(!dash){buildDash();if(!dash)return}
  var dc=dailyCost(),mo=S.month,left=28-(gDay()%28);
  var est=mo.rent+mo.util+mo.pay+(mo.ot||0)+left*(dc.rent+dc.util+dc.pay);if(S.mcount===0)est*=0.5;
  dash.vTeam.textContent=S.team.length+" / "+staffCap();dash.vCash.textContent=money0(S.money);dash.vDue.textContent="~"+money0(est);
  dash.vMood.textContent=satTeam(S.mood)+" "+Math.round(S.mood)+"%";
  var mb=S.mood>=60?2:S.mood>=35?1:0;
  if(dash.lastMood!==mb){dash.lastMood=mb;var ic=dash.moodTile.querySelector(".pxti");ic.innerHTML="";ic.appendChild(faceEl(mb===2?70:mb===1?45:20,3))}
  dash.l1.textContent="Payday in "+left+" day"+(left>1?"s":"");
  dash.f1.style.width=((28-left)/28*100)+"%";
  var cov=est>0?cl(S.money/est,0,1):1;
  dash.l2.textContent="Cash covers "+Math.round(cov*100)+"% of the bills";
  dash.f2.style.width=(cov*100)+"%";dash.f2.style.background=cov>=1?"#4f9a3a":cov>=0.6?"#e0a020":"#c0402a";
  var w="";
  if(S.late>0)w="Behind with the bank: month "+S.late+" of "+LATE_MAX+". Debt "+money0(S.debt)+".";
  else if(S.debt>0)w="Debt "+money0(S.debt)+", 4% interest a month.";
  else if(left<=7&&S.money<est)w="Careful: about "+money0(est)+" is due in "+left+" day"+(left>1?"s":"")+".";
  dash.warn.hidden=!w;dash.wt.textContent=w;dash.wb.style.display=S.debt>0?"":"none";
}
setInterval(updDash,500);

/* ---- the long finance and mood paragraphs start folded ---- */

