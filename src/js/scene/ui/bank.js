/* ---- bank window ---- */
function openBank(){
  var card=el("div","card"),base=Math.max(500,Math.round(monthlyFixed()/100)*100);
  card.appendChild(el("h2",null,"Bank"));
  card.appendChild(el("p",null,"Debt: "+money0(S.debt)+" · interest 4% a month · lending limit "+money0(bankLimit())+"."));
  card.appendChild(el("p",null,S.late>0?"You are "+S.late+" of "+LATE_MAX+" months behind. At "+LATE_MAX+" the bank repossesses the bar, sells it, and you go back one stage.":"If you cannot pay the monthly bills the bank lends you the difference. Fail "+LATE_MAX+" months in a row and it repossesses the bar."));
  card.appendChild(el("div","h","Borrow"));
  [base,base*2,base*4].forEach(function(a){
    var box=el("div","cand");
    box.appendChild(el("b",null,money0(a)));
    box.appendChild(el("span",null,"Repay "+money0(a*1.04)+" after one month"));
    var b=el("button","buy sm","Borrow");b.disabled=S.debt+a>bankLimit();
    b.onclick=function(){if(bankBorrow(a)){sfx("coin");openBank()}};
    box.appendChild(b);card.appendChild(box);
  });
  if(S.debt>0.5){
    card.appendChild(el("div","h","Repay"));
    var half=Math.min(S.money,Math.round(S.debt/2)),all=Math.min(S.money,S.debt);
    var r1=el("button","buy sm","Repay "+money0(half));r1.disabled=half<=0;
    r1.onclick=function(){repayPart(half);sfx("buy");openBank()};
    var r2=el("button","buy sm","Repay "+money0(all)+(all>=S.debt?" (all)":""));r2.disabled=all<=0;
    r2.onclick=function(){repayDebt();sfx("buy");openBank()};
    var row=el("div","cand");row.appendChild(el("span",null,"Cash "+money0(S.money)));row.appendChild(r1);row.appendChild(r2);card.appendChild(row);
  }
  var cl=el("button","link","Close");cl.onclick=hideOv;card.appendChild(cl);
  showOv(card);updBankBtn();
}
document.getElementById("pxbank").addEventListener("click",openBank);
function updBankBtn(){
  var b=document.getElementById("pxbank"),show=(S.served>=8||S.mcount>=1||S.debt>0.5);
  b.hidden=!show;if(!show)return;
  var t="Bank"+(S.debt>0.5?" "+eur(S.debt):"")+(S.late>0?" \u2022":"");
  if(b._t!==t){b._t=t;b.textContent=t}
}

