/* ---- the venue window ---- */
var VPAGE="guide",MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function vBar(pg,label,frac,color){
  var row=h("div","vbar");row.appendChild(h("span",null,label));
  var bar=h("div","pxbr"),fi=h("i");fi.style.width=Math.round(clamp(frac,0,1)*100)+"%";if(color)fi.style.background=color;bar.appendChild(fi);row.appendChild(bar);pg.appendChild(row);
}
function vGuide(pg){
  var stars=guideStars(),gd=S.guide,sr=h("div","vstars");
  sr.textContent="\u2605".repeat(stars)+"\u2606".repeat(5-stars);pg.appendChild(sr);
  pg.appendChild(h("p",null,gd?"The Bar Guide rated you at the end of last month. Each star brings 3% more guests, richer guests and more critics.":"Your first rating arrives at the end of this month. Until then you are at 2 stars."));
  var comp=gd?gd.comp:guideCalc().comp;
  [["sat","Guest satisfaction"],["price","Fair prices"],["menu","Menu variety"],["rep","Reputation"],["style","Style and decor"]].forEach(function(r){vBar(pg,r[1],comp[r[0]])});
  var TIP={sat:"Faster service and friendlier staff lift satisfaction.",price:"Prices close to the fair price score best.",menu:"Unlock more ingredients to widen the menu.",rep:"Reputation grows with good months and happy guests.",style:"Decor and a theme add style points."};
  var low=null,lv=2;for(var k in comp){if(comp[k]<lv){lv=comp[k];low=k}}
  if(low)pg.appendChild(h("p","note","Weakest area: "+TIP[low]));
}
function vRegs(pg){
  pg.appendChild(h("p",null,"Regulars are guests who keep coming back for their favourite drink. A strong bond means bigger tips and more rounds. Happy guests can become regulars. Room for "+regCap()+" at this venue."));
  var a=S.reg||[];
  if(!a.length){pg.appendChild(h("p","note","Nobody yet. Serve guests well and friendly staff will win some over."));return}
  a.forEach(function(r){
    var box=h("div","cand");
    box.appendChild(h("b",null,"\u2665 "+r.name+" \u00b7 "+r.type));
    box.appendChild(h("span",null,"Favourite: "+(ITM[r.fav]?ITM[r.fav].n:"anything")+" \u00b7 "+r.visits+" visit"+(r.visits===1?"":"s")+" \u00b7 bond "+Math.round(r.bond)+"%"));
    var bar=h("div","pxbr"),fi=h("i");fi.style.width=r.bond+"%";bar.appendChild(fi);box.appendChild(bar);
    pg.appendChild(box);
  });
}
function vStyle(pg){
  var d=S.deco||{items:{}};
  pg.appendChild(h("p",null,"Style points: "+stylePts()+" of 11. Each one makes guests a little happier and the bar a little busier. A theme attracts certain guests."));
  pg.appendChild(h("div","h","Theme"));
  Object.keys(THEMES).forEach(function(id){
    var t=THEMES[id],box=h("div","cand"),on=d.theme===id;
    box.appendChild(h("b",null,t.n+(on?" \u2713":"")));box.appendChild(h("span",null,t.d));
    if(!on){var c=themeCost(),b=h("button","buy sm",c?"Switch "+money0(c):"Choose");b.disabled=S.money<c;b.onclick=function(){if(setTheme(id)){sfx("buy");openVenue("style")}};box.appendChild(b)}
    pg.appendChild(box);
  });
  pg.appendChild(h("div","h","Decor"));
  DECOR.forEach(function(it){
    var box=h("div","cand"),own=!!d.items[it.id];
    box.appendChild(h("b",null,it.n+(own?" \u2713":"")));box.appendChild(h("span",null,"+"+it.pts+" style point"+(it.pts>1?"s":"")+(it.id==="neon"?" \u00b7 shows your theme":"")));
    if(!own){var c=decorCost(it),b=h("button","buy sm","Buy "+money0(c));b.disabled=S.money<c;b.onclick=function(){if(buyDecor(it.id)){sfx("buy");openVenue("style")}};box.appendChild(b)}
    pg.appendChild(box);
  });
}
function vNights(pg){
  pg.appendChild(h("p",null,"Book a themed night to pull a crowd in the evening. You pay when you book. The calendar and the weather still apply."));
  var d0=gDay(),hr=gHour();
  for(var i=0;i<7;i++){
    (function(day){
      var dt=dateOf(day),box=h("div","cand"),wx=weatherOf(day);
      box.appendChild(h("b",null,DAYN[day%7]+" "+dt.d+" "+MN[dt.m]+(day===d0?" (today)":"")));
      box.appendChild(h("span",null,WXN[wx]+" \u00b7 "+SEASONN[seasonOf(day)]));
      var booked=S.nights&&S.nights[day];
      if(booked){box.appendChild(h("span",null,"Booked: "+NIGHTS[booked].n))}
      else if(day===d0&&hr>=17){box.appendChild(h("span",null,"Too late to book tonight."))}
      else{
        var row=h("div","vrow");
        Object.keys(NIGHTS).forEach(function(t){
          var c=nightCost(t),b=h("button","buy sm",NIGHTS[t].n.split(" ")[0]+" "+eur(c));b.disabled=S.money<c;
          b.onclick=function(){if(bookNight(day,t)){sfx("buy");openVenue("nights")}};row.appendChild(b);
        });
        box.appendChild(row);
      }
      pg.appendChild(box);
    })(d0+i);
  }
}
function vSup(pg){
  pg.appendChild(h("p",null,"Choose how you buy your ingredients. Your clerks' negotiation still lowers the price on top."));
  Object.keys(SUPS).forEach(function(id){
    var s2=SUPS[id],box=h("div","cand"),on=supMode()===id;
    box.appendChild(h("b",null,s2.n+(on?" \u2713":"")));box.appendChild(h("span",null,s2.d));
    if(id==="volume")box.appendChild(h("span",null,"Commitment: "+money0(volCommit())+" of purchases a month."));
    if(on&&id==="contract")box.appendChild(h("span",null,Math.max(0,S.sup.until-gDay())+" days left."));
    if(!on){var locked=supMode()==="contract"&&gDay()<S.sup.until,b=h("button","buy sm",locked?"Locked until the contract ends":"Switch");b.disabled=locked;b.onclick=function(){if(supSet(id)){sfx("buy");openVenue("sup")}};box.appendChild(b)}
    pg.appendChild(box);
  });
}
function vLegacy(pg){
  var L=S.leg||{pts:0,perks:{}};
  pg.appendChild(h("p",null,"Legacy points: <b>"+L.pts+"</b> \u00b7 bars retired: "+(S.legacy||0)+"."));
  pg.appendChild(h("div","h","Branches"));
  if(S.exp<4)pg.appendChild(h("p","note","Branches open once you run the global chain. Each branch needs a brand ambassador and pays a share of a chain's profit every month."));
  else pg.appendChild(h("p","note","Active branches: "+branchActive()+" of "+(S.br||[]).length+" open (each needs its own brand ambassador). Income last month: "+money0((S.lastMonth&&S.lastMonth.branch)||0)+"."));
  CITIES.forEach(function(c){
    var box=h("div","cand"),open=(S.br||[]).indexOf(c.id)>=0;
    box.appendChild(h("b",null,c.n+(open?" \u2713":"")));
    box.appendChild(h("span",null,open?"Open. Pays about "+money0(0.3*HQP*c.k*(0.7+0.06*guideStars()))+" a month with an ambassador.":"Opening costs "+money0(c.cost)+"."));
    if(!open){var b=h("button","buy sm","Open branch");b.disabled=S.exp<4||S.money<c.cost;b.onclick=function(){if(openBranch(c.id)){sfx("new");openVenue("legacy")}};box.appendChild(b)}
    pg.appendChild(box);
  });
  pg.appendChild(h("div","h","Retire and restart"));
  pg.appendChild(h("p",null,"Hand the keys to the next generation. You start again at the lemonade stand, but your reputation perks stay, and you earn legacy points to spend on permanent bonuses. You would earn <b>"+legacyPoints()+"</b> points now."));
  var rb=h("button","buy","Retire and restart");rb.disabled=!canRetire();
  if(!canRetire())pg.appendChild(h("p","note","Available at the global chain once you have earned at least $3,000,000 in total."));
  rb.onclick=function(){
    var c=h("div","card");c.appendChild(h("h2",null,"Retire for good?"));
    c.appendChild(h("p",null,"Your bar, team, stock and money are gone. You keep reputation perks, legacy points ("+legacyPoints()+" new) and any permanent bonuses."));
    var yes=h("button","buy","Yes, retire"),no=h("button","link","Not yet");
    yes.onclick=function(){retire();location.reload()};no.onclick=function(){openVenue("legacy")};
    c.appendChild(yes);c.appendChild(no);showOv(c);
  };
  pg.appendChild(rb);
  pg.appendChild(h("div","h","Legacy bonuses"));
  LEGP.forEach(function(p){
    var l=legLvl(p.id),box=h("div","cand");
    box.appendChild(h("b",null,p.n+" \u00b7 level "+l+" of "+p.max));box.appendChild(h("span",null,p.d));
    if(l<p.max){var b=h("button","buy sm","Buy for "+p.cost[l]+" points");b.disabled=L.pts<p.cost[l];b.onclick=function(){if(buyLeg(p.id)){sfx("buy");openVenue("legacy")}};box.appendChild(b)}
    pg.appendChild(box);
  });
}
function openVenue(page){
  if(page)VPAGE=page;
  var card=h("div","card vh");card.appendChild(h("h2",null,"Venue"));
  var tabs=h("div","vtabs");
  [["guide","Guide"],["regs","Regulars"],["style","Style"],["nights","Nights"],["sup","Suppliers"],["legacy","Legacy"]].forEach(function(t){
    var b=h("button","ghost"+(VPAGE===t[0]?" on":""),t[1]);b.onclick=function(){openVenue(t[0])};tabs.appendChild(b);
  });
  card.appendChild(tabs);
  var pg=h("div","vpage");card.appendChild(pg);
  ({guide:vGuide,regs:vRegs,style:vStyle,nights:vNights,sup:vSup,legacy:vLegacy})[VPAGE](pg);
  var cl=h("button","link","Close");cl.onclick=hideOv;card.appendChild(cl);
  showOv(card);updVenBtn();
}
document.getElementById("pxven").addEventListener("click",function(){openVenue()});
function updVenBtn(){
  var b=document.getElementById("pxven"),show=(S.served>=15||S.mcount>=1);
  b.hidden=!show;if(!show)return;
  var t="Venue"+(guideStars()?" "+guideStars()+"\u2605":"");
  if(b._t!==t){b._t=t;b.textContent=t}
}
setInterval(function(){try{updVenBtn()}catch(e){}},900);
