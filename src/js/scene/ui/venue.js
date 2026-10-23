/* ---- the venue window ---- */
var VPAGE="guide",MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function vBar(page,label,frac,color){
  var row=el("div","vbar");row.appendChild(el("span",null,label));
  var bar=el("div","pxbr"),fi=el("i");fi.style.width=Math.round(clamp(frac,0,1)*100)+"%";if(color)fi.style.background=color;bar.appendChild(fi);row.appendChild(bar);page.appendChild(row);
}
function vGuide(page){
  var stars=guideStars(),gd=S.guide,sr=el("div","vstars");
  sr.textContent="\u2605".repeat(stars)+"\u2606".repeat(5-stars);page.appendChild(sr);
  page.appendChild(el("p",null,gd?"The Bar Guide rated you at the end of last month. Each star brings 3% more guests, richer guests and more critics.":"Your first rating arrives at the end of this month. Until then you are at 2 stars."));
  var comp=gd?gd.comp:guideCalc().comp;
  [["sat","Guest satisfaction"],["price","Fair prices"],["menu","Menu variety"],["rep","Reputation"],["style","Style and decor"]].forEach(function(r){vBar(page,r[1],comp[r[0]])});
  var TIP={sat:"Faster service and friendlier staff lift satisfaction.",price:"Prices close to the fair price score best.",menu:"Unlock more ingredients to widen the menu.",rep:"Reputation grows with good months and happy guests.",style:"Decor and a theme add style points."};
  var low=null,lv=2;for(var k in comp){if(comp[k]<lv){lv=comp[k];low=k}}
  if(low)page.appendChild(el("p","note","Weakest area: "+TIP[low]));
}
function vRegs(page){
  page.appendChild(el("p",null,"Regulars are guests who keep coming back for their favourite drink. A strong bond means bigger tips and more rounds. Happy guests can become regulars. Room for "+regCap()+" at this venue."));
  var a=S.reg||[];
  if(!a.length){page.appendChild(el("p","note","Nobody yet. Serve guests well and friendly staff will win some over."));return}
  a.forEach(function(r){
    var box=el("div","cand");
    box.appendChild(el("b",null,"\u2665 "+r.name+" \u00b7 "+r.type));
    box.appendChild(el("span",null,"Favourite: "+(ITM[r.fav]?ITM[r.fav].n:"anything")+" \u00b7 "+r.visits+" visit"+(r.visits===1?"":"s")+" \u00b7 bond "+Math.round(r.bond)+"%"));
    var bar=el("div","pxbr"),fi=el("i");fi.style.width=r.bond+"%";bar.appendChild(fi);box.appendChild(bar);
    page.appendChild(box);
  });
}
function vStyle(page){
  var d=S.deco||{items:{}};
  page.appendChild(el("p",null,"Style points: "+stylePts()+" of 11. Each one makes guests a little happier and the bar a little busier. A theme attracts certain guests."));
  page.appendChild(el("div","h","Theme"));
  Object.keys(THEMES).forEach(function(id){
    var t=THEMES[id],box=el("div","cand"),on=d.theme===id;
    box.appendChild(el("b",null,t.n+(on?" \u2713":"")));box.appendChild(el("span",null,t.d));
    if(!on){var c=themeCost(),b=el("button","buy sm",c?"Switch "+money0(c):"Choose");b.disabled=S.money<c;b.onclick=function(){if(setTheme(id)){sfx("buy");openVenue("style")}};box.appendChild(b)}
    page.appendChild(box);
  });
  page.appendChild(el("div","h","Decor"));
  DECOR.forEach(function(it){
    var box=el("div","cand"),own=!!d.items[it.id];
    box.appendChild(el("b",null,it.n+(own?" \u2713":"")));box.appendChild(el("span",null,"+"+it.pts+" style point"+(it.pts>1?"s":"")+(it.id==="neon"?" \u00b7 shows your theme":"")));
    if(!own){var c=decorCost(it),b=el("button","buy sm","Buy "+money0(c));b.disabled=S.money<c;b.onclick=function(){if(buyDecor(it.id)){sfx("buy");openVenue("style")}};box.appendChild(b)}
    page.appendChild(box);
  });
}
function vNights(page){
  page.appendChild(el("p",null,"Book a themed night to pull a crowd in the evening. You pay when you book. The calendar and the weather still apply."));
  var d0=gDay(),hr=gHour();
  for(var i=0;i<7;i++){
    (function(day){
      var dt=dateOf(day),box=el("div","cand"),wx=weatherOf(day);
      box.appendChild(el("b",null,DAYN[day%7]+" "+dt.d+" "+MN[dt.m]+(day===d0?" (today)":"")));
      box.appendChild(el("span",null,WXN[wx]+" \u00b7 "+SEASONN[seasonOf(day)]));
      var booked=S.nights&&S.nights[day];
      if(booked){box.appendChild(el("span",null,"Booked: "+NIGHTS[booked].n))}
      else if(day===d0&&hr>=17){box.appendChild(el("span",null,"Too late to book tonight."))}
      else{
        var row=el("div","vrow");
        Object.keys(NIGHTS).forEach(function(t){
          var c=nightCost(t),b=el("button","buy sm",NIGHTS[t].n.split(" ")[0]+" "+eur(c));b.disabled=S.money<c;
          b.onclick=function(){if(bookNight(day,t)){sfx("buy");openVenue("nights")}};row.appendChild(b);
        });
        box.appendChild(row);
      }
      page.appendChild(box);
    })(d0+i);
  }
}
function vSup(page){
  page.appendChild(el("p",null,"Choose how you buy your ingredients. Your clerks' negotiation still lowers the price on top."));
  Object.keys(SUPS).forEach(function(id){
    var s2=SUPS[id],box=el("div","cand"),on=supMode()===id;
    box.appendChild(el("b",null,s2.n+(on?" \u2713":"")));box.appendChild(el("span",null,s2.d));
    if(id==="volume")box.appendChild(el("span",null,"Commitment: "+money0(volCommit())+" of purchases a month."));
    if(on&&id==="contract")box.appendChild(el("span",null,Math.max(0,S.sup.until-gDay())+" days left."));
    if(!on){var locked=supMode()==="contract"&&gDay()<S.sup.until,b=el("button","buy sm",locked?"Locked until the contract ends":"Switch");b.disabled=locked;b.onclick=function(){if(supSet(id)){sfx("buy");openVenue("sup")}};box.appendChild(b)}
    page.appendChild(box);
  });
}
function vLegacy(page){
  var L=S.leg||{pts:0,perks:{}};
  page.appendChild(el("p",null,["Legacy points: ",el("b",null,L.pts)," \u00b7 bars retired: "+(S.legacy||0)+"."]));
  page.appendChild(el("div","h","Branches"));
  if(S.exp<4)page.appendChild(el("p","note","Branches open once you run the global chain. Each branch needs a brand ambassador and pays a share of a chain's profit every month."));
  else page.appendChild(el("p","note","Active branches: "+branchActive()+" of "+(S.br||[]).length+" open (each needs its own brand ambassador). Income last month: "+money0((S.lastMonth&&S.lastMonth.branch)||0)+"."));
  CITIES.forEach(function(c){
    var box=el("div","cand"),open=(S.br||[]).indexOf(c.id)>=0;
    box.appendChild(el("b",null,c.n+(open?" \u2713":"")));
    box.appendChild(el("span",null,open?"Open. Pays about "+money0(BRANCH_SHARE*HQP*c.k*(0.7+0.06*guideStars()))+" a month with an ambassador.":"Opening costs "+money0(c.cost)+"."));
    if(!open){var b=el("button","buy sm","Open branch");b.disabled=S.exp<4||S.money<c.cost;b.onclick=function(){if(openBranch(c.id)){sfx("new");openVenue("legacy")}};box.appendChild(b)}
    page.appendChild(box);
  });
  page.appendChild(el("div","h","Retire and restart"));
  page.appendChild(el("p",null,["Hand the keys to the next generation. You start again at the lemonade stand, but your reputation perks stay, and you earn legacy points to spend on permanent bonuses. You would earn ",el("b",null,legacyPoints())," points now."]));
  var rb=el("button","buy","Retire and restart");rb.disabled=!canRetire();
  if(!canRetire())page.appendChild(el("p","note","Available at the global chain once you have earned at least $3,000,000 in total."));
  rb.onclick=function(){
    var c=el("div","card");c.appendChild(el("h2",null,"Retire for good?"));
    c.appendChild(el("p",null,"Your bar, team, stock and money are gone. You keep reputation perks, legacy points ("+legacyPoints()+" new) and any permanent bonuses."));
    var yes=el("button","buy","Yes, retire"),no=el("button","link","Not yet");
    yes.onclick=function(){retire();location.reload()};no.setAttribute("data-close","");no.onclick=function(){openVenue("legacy")};
    c.appendChild(yes);c.appendChild(no);showOv(c);
  };
  page.appendChild(rb);
  page.appendChild(el("div","h","Legacy bonuses"));
  LEGP.forEach(function(p){
    var l=legLvl(p.id),box=el("div","cand");
    box.appendChild(el("b",null,p.n+" \u00b7 level "+l+" of "+p.max));box.appendChild(el("span",null,p.d));
    if(l<p.max){var b=el("button","buy sm","Buy for "+p.cost[l]+" points");b.disabled=L.pts<p.cost[l];b.onclick=function(){if(buyLeg(p.id)){sfx("buy");openVenue("legacy")}};box.appendChild(b)}
    page.appendChild(box);
  });
}
/* which: the tab to show (guide, regs, style, nights, sup, legacy); the last one shown when omitted */
function openVenue(which){
  if(which)VPAGE=which;
  var card=el("div","card vh");card.appendChild(el("h2",null,"Venue"));
  var tabs=el("div","vtabs");
  [["guide","Guide"],["regs","Regulars"],["style","Style"],["nights","Nights"],["sup","Suppliers"],["legacy","Legacy"]].forEach(function(t){
    var b=el("button","ghost"+(VPAGE===t[0]?" on":""),t[1]);b.onclick=function(){openVenue(t[0])};tabs.appendChild(b);
  });
  card.appendChild(tabs);
  var page=el("div","vpage");card.appendChild(page);
  ({guide:vGuide,regs:vRegs,style:vStyle,nights:vNights,sup:vSup,legacy:vLegacy})[VPAGE](page);
  var cl=el("button","link","Close");cl.onclick=hideOv;card.appendChild(cl);
  showOv(card);updVenBtn();
}
document.getElementById("pxven").addEventListener("click",function(){openVenue()});
function updVenBtn(){
  var b=document.getElementById("pxven"),show=(S.served>=15||S.mcount>=1);
  b.hidden=!show;if(!show)return;
  var t="Venue"+(guideStars()?" "+guideStars()+"\u2605":"");
  if(b._t!==t){b._t=t;b.textContent=t}
}
