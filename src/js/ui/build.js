/* ---------- UI: build ---------- */
var ref={ord:[],tr:{},grp:{},ing:{},staff:{},rec:{},exp:null,br:{},mk:{},cal:{},fin:[],ed:{sel:0},mood:{},emps:{},empSig:""};
/* kind is a stable class for styling (ing, tier, rec, role, emp, exp, ach); setC on a row always starts from r.cls */
function mkRow(name,withBtn,kind){
  var cls="row"+(kind?" "+kind:""),row=el("div",cls),info=el("div","info"),nm=el("div","name",name),sub=el("div","sub");
  info.append(nm,sub);row.appendChild(info);
  var btn=null;if(withBtn){btn=el("button","buy");row.appendChild(btn)}
  return{row:row,nm:nm,sub:sub,btn:btn,info:info,cls:cls};
}
/* ---------- UI: skill trees ---------- */
function setA(e,k,v){if(e["_"+k]!==v){e["_"+k]=v;e.setAttribute(k,v)}}
function mkTree(root,nodes,labels,cols){
  var NS="http://www.w3.org/2000/svg";
  var wrap=el("div","tree");
  if(labels){
    var lb=el("div","tlabels");lb.style.gridTemplateColumns="repeat("+cols+",1fr)";
    labels.forEach(function(x){lb.appendChild(el("span",null,x))});wrap.appendChild(lb);
  }
  var grid=el("div","tgrid"+(cols>3?" c"+cols:""));
  grid.style.gridTemplateColumns="repeat("+cols+",1fr)";
  var svg=document.createElementNS(NS,"svg");
  svg.setAttribute("class","tlines");svg.setAttribute("aria-hidden","true");
  grid.appendChild(svg);
  var tr={nodes:nodes,tiles:{},edges:[],svg:svg,grid:grid,sel:nodes[0].id};
  nodes.forEach(function(n){
    var b=el("button","tile"),nm=el("span","tn",n.n),st=el("span","ts");
    b.style.gridColumn=String(n.col+1);b.style.gridRow=String(n.row+1);
    b.append(nm,st);
    b.onclick=function(){tr.sel=n.id;updateTree(tr)};
    grid.appendChild(b);tr.tiles[n.id]={b:b,st:st};
    (n.req||[]).forEach(function(pid){
      var pa=document.createElementNS(NS,"path");
      svg.appendChild(pa);tr.edges.push({from:pid,to:n.id,el:pa});
    });
  });
  wrap.appendChild(grid);
  var det=el("div","tdetail"),dn=el("div","tdn"),dd=el("div","tdd"),dm=el("div","tdm"),db=el("button","big");
  det.append(dn,dd,dm,db);wrap.appendChild(det);
  tr.dn=dn;tr.dd=dd;tr.dm=dm;tr.db=db;
  db.onclick=function(){nBuy(NODEMAP[tr.sel]);updateTree(tr)};
  root.appendChild(wrap);
  return tr;
}
function updateTree(tr){
  tr.nodes.forEach(function(n){
    var t=tr.tiles[n.id],l=nLevel(n),mx=nMax(n),met=nReqMet(n),cls="tile",txt;
    if(l>=mx){cls+=" owned";txt=mx>1?"Max "+l+"/"+mx:"Owned"}
    else if(!met){cls+=" locked";txt="Locked"}
    else{if(canPay(n,l))cls+=" can";txt=(mx>1?l+"/"+mx+"  ":"")+costText(n,l)}
    if(l>0&&l<mx)cls+=" part";
    if(tr.sel===n.id)cls+=" sel";
    setC(t.b,cls);setT(t.st,txt);
  });
  tr.edges.forEach(function(e){setA(e.el,"class",nLevel(NODEMAP[e.from])>=1?"on":"")});
  var n=NODEMAP[tr.sel],l=nLevel(n),mx=nMax(n);
  setT(tr.dn,n.n+(mx>1?"  ("+l+"/"+mx+")":""));
  setT(tr.dd,n.d);
  if(l>=mx){setT(tr.dm,"Fully upgraded.");setT(tr.db,"Maxed");tr.db.disabled=true}
  else if(!nReqMet(n)){setT(tr.dm,"Requires: "+nReqText(n));setT(tr.db,"Locked");tr.db.disabled=true}
  else{setT(tr.dm,"Cost: "+costText(n,l));setT(tr.db,"Buy for "+costText(n,l));tr.db.disabled=!canPay(n,l)}
}
function drawTree(tr){
  var g=tr.grid,W=g.offsetWidth,H=g.offsetHeight;
  if(!W)return;
  tr.svg.setAttribute("viewBox","0 0 "+W+" "+H);tr.svg.setAttribute("width",W);tr.svg.setAttribute("height",H);
  tr.edges.forEach(function(e){
    var a=tr.tiles[e.from].b,c=tr.tiles[e.to].b;
    var ax=a.offsetLeft,ay=a.offsetTop,aw=a.offsetWidth,ah=a.offsetHeight;
    var cx=c.offsetLeft,cy=c.offsetTop,cw=c.offsetWidth,ch=c.offsetHeight,d;
    if(cy>ay+ah/2){
      var x1=ax+aw/2,y1=ay+ah,x2=cx+cw/2,y2=cy,my=(y1+y2)/2;
      d="M"+x1+" "+y1+" C"+x1+" "+my+" "+x2+" "+my+" "+x2+" "+y2;
    }else if(cx>ax){d="M"+(ax+aw)+" "+(ay+ah/2)+" L"+cx+" "+(cy+ch/2)}
    else{d="M"+ax+" "+(ay+ah/2)+" L"+(cx+cw)+" "+(cy+ch/2)}
    e.el.setAttribute("d",d);
  });
}
function drawAll(){for(var k in ref.tr)drawTree(ref.tr[k])}


function buildOrders(){
  var box=$("#orders");clear(box);
  for(var i=0;i<5;i++){
    (function(){
      var card=el("div","ocard");
      var head=el("div","oh"),who=el("span"),rew=el("span","orew");head.append(who,rew);
      var itemsEl=el("div"),lines=[];
      for(var k=0;k<3;k++){
        var l=el("div","oline"),nm=el("span"),st=el("span","ost");l.append(nm,st);itemsEl.appendChild(l);lines.push({l:l,nm:nm,st:st});
      }
      var bar=el("div","obar"),fill=el("i");bar.appendChild(fill);
      var foot=el("div","ofoot"),skip=el("button","skip","Skip customer"),note=el("span","onote"),collectBtn=el("button","buy sm","Collect");
      foot.append(skip,note,collectBtn);
      var empty=el("div",null,"Waiting for the next customer…");
      var body=el("div");body.append(head,itemsEl,bar,foot);
      card.append(empty,body);
      var o={card:card,who:who,rew:rew,lines:lines,fill:fill,skip:skip,note:note,collectBtn:collectBtn,empty:empty,body:body,oid:0};
      skip.onclick=function(){var od=findOrder(o.oid);if(od&&!od.ready){dropOrder(od);addSat(30)}};
      collectBtn.onclick=function(){var od=findOrder(o.oid);if(od&&od.ready)collect(od)};
      ref.ord.push(o);box.appendChild(card);
    })();
  }
}


function selEmp(){var id=ref.ed.sel;for(var i=0;i<S.team.length;i++){if(S.team[i].id===id)return S.team[i]}return null}
function roleIndex(e){var i=0;for(var k=0;k<S.team.length;k++){var x=S.team[k];if(x===e)return i;if(x.role===e.role)i++}return i}
function buildEmpDetail(parent){
  var ed=ref.ed;
  ed.card=el("div","tdetail");ed.card.style.display="none";
  ed.nm=el("div","tdn");ed.sub=el("div","tdd");
  ed.card.append(ed.nm,ed.sub);
  ed.sk=[];
  for(var i=0;i<3;i++){
    (function(i){
      var row=el("div","erow"),lab=el("span"),btn=el("button","buy sm");
      btn.onclick=function(){var e=selEmp();if(e)trainSkill(e,i)};
      row.append(lab,btn);ed.card.appendChild(row);ed.sk.push({row:row,lab:lab,btn:btn});
    })(i);
  }
  ed.prog=el("div","tdd");ed.prog.style.marginTop="10px";ed.card.appendChild(ed.prog);
  ed.acts=el("div","eacts");
  function act(label,fn){var b=el("button","ghost",label);b.onclick=function(){var e=selEmp();if(e)fn(e)};ed.acts.appendChild(b);return b}
  ed.bLevel=act("Promote",levelUp);
  ed.bRole=act("Promote role",promoteRole);
  ed.bClerk=act("Upgrade clerk",upgradeClerk);
  ed.bRaise=act("Raise 10%",raiseWage);
  ed.bFire=act("Let go",function(e){fireEmp(e)});
  ed.card.appendChild(ed.acts);
  parent.appendChild(ed.card);
}
function rebuildEmps(){
  var box=ref.empBox;clear(box);ref.emps={};
  var order=ROLES.map(function(r){return r.id});
  S.team.slice().sort(function(a,b){return order.indexOf(a.role)-order.indexOf(b.role)||a.id-b.id}).forEach(function(e){
    var r=mkRow("",false,"emp");
    r.row.className=r.cls+" pick";
    var tag=el("div","val");r.row.appendChild(tag);r.tag=tag;
    r.row.onclick=function(){ref.ed.sel=e.id;ref.ed.sig=""};
    ref.emps[e.id]=r;box.appendChild(r.row);
  });
}
var SKE={
  apprentice:["recommends better brands","works faster","guests leave happier"],
  cashier:["guests at their slot leave happier","adds to each order they handle"],
  clerk:["cheaper stock","less spoilage"],
  prepchef:["more per batch","works faster"],
  controller:["cheaper stock","better prices"]
};
function skillEffect(role,i){return (SKE[role]||SKE.apprentice)[i]}
function stockRow(x,t,p){
  var r=mkRow(t?"":x.n,true,t?"tier":"ing");
  r.barWrap=el("div","sbar");r.bar=el("i");r.barWrap.appendChild(r.bar);r.info.appendChild(r.barWrap);
  r.tog=el("button","tog");r.info.appendChild(r.tog);
  p.appendChild(r.row);
  return r;
}
function build(){
  buildOrders();

  var p=$("#p-stock");clear(p);
  p.appendChild(el("p","note","Every drink uses 1 serving of each ingredient. Unlock ingredients here, then keep the shelves stocked or orders will wait. Spirits, beer and wine come in three qualities: unlock better brands as your reputation grows, pick which one your cocktails use, and sell them neat from the Menu tab. Every 2 staff you hire earns a pick from the next ingredient list."));
  p.appendChild(el("div","h","Market"));
  ref.mk.ev=[];ref.mk.notes=[];
  for(var e=0;e<5;e++){var ge=el("div","gnote");p.appendChild(ge);ref.mk.ev.push(ge)}
  for(var q=0;q<4;q++){var gq=el("div","gnote");p.appendChild(gq);ref.mk.notes.push(gq)}
  GROUPS.forEach(function(gr){
    p.appendChild(el("div","h",gr[1]));
    var gnote=el("div","gnote");p.appendChild(gnote);ref.grp[gr[0]]=gnote;
    ING.filter(function(x){return x.g===gr[0]}).sort(function(a,b){return u0(a)-u0(b)}).forEach(function(x){
      var r=stockRow(x,0,p);
      r.btn.onclick=function(){if(x.raw)return;if(has(x.id))buyStock(x.id,0);else unlockIng(x.id)};
      r.tog.onclick=function(){toggleClerk(x.id)};
      if(x.q){
        r.bt=el("button","tog");r.info.appendChild(r.bt);
        r.bt.onclick=function(){cycleBrand(x.id)};
        r.tiers=[];
        for(var t=1;t<3;t++){
          (function(t){
            var tr=stockRow(x,t,p);
            tr.tog.style.display="none";
            tr.btn.onclick=function(){if((S.ql[x.id]||0)>=t)buyStock(x.id,t);else unlockTier(x.id,t)};
            r.tiers[t]=tr;
          })(t);
        }
      }
      ref.ing[x.id]=r;
    });
  });

  var s=$("#p-staff");clear(s);
  s.appendChild(el("p","note","You work the counter yourself. Unlock each role in the Upgrades tree, then hire people here: each time you hire you choose between 3 candidates with different wages and skills. Everyone works whenever the bar is open. Wages are due at the end of the calendar month."));
  s.appendChild(el("div","h","Finances"));
  for(var f=0;f<5;f++){var fl=el("div","gnote");s.appendChild(fl);ref.fin.push(fl)}
  ref.finBtn=el("button","tog","Repay debt");ref.finBtn.onclick=repayDebt;s.appendChild(ref.finBtn);
  s.appendChild(el("div","h","Team satisfaction"));
  var M=ref.mood;
  M.txt=el("div","gnote");s.appendChild(M.txt);
  var mb=el("div","satb");M.fill=el("i");mb.appendChild(M.fill);s.appendChild(mb);
  M.drv=el("div","gnote");M.drv.style.marginTop="8px";s.appendChild(M.drv);
  s.appendChild(el("div","h","Hire"));
  ROLES.forEach(function(x){
    var r=mkRow(x.n,true,"role");r.cnt=el("span","cnt");r.nm.appendChild(r.cnt);
    r.btn.onclick=function(){openHire(x.id)};
    ref.staff[x.id]=r;s.appendChild(r.row);
  });
  s.appendChild(el("div","h","Your team"));
  ref.empNote=el("div","gnote");s.appendChild(ref.empNote);
  ref.empBox=el("div");s.appendChild(ref.empBox);
  
  buildEmpDetail(s);

  var u=$("#p-upg");clear(u);
  u.appendChild(el("div","h","Expansion"));
  ref.exp=mkRow("",true,"exp");ref.exp.btn.onclick=buyExp;u.appendChild(ref.exp.row);
  u.appendChild(el("div","h","Bar upgrades"));
  u.appendChild(el("p","gnote","Tap a node to see what it does. Each branch unlocks from the top down. Roles are hired in the Team tab once unlocked."));
  ref.tr.bar=mkTree(u,UT,["Team","Service","Stock","Customers"],4);
  u.appendChild(el("div","h","Staff training"));
  u.appendChild(el("p","gnote","Train one role to open the next. You need at least one person in a role to train it."));
  ref.tr.train=mkTree(u,TT,null,3);

  var b=$("#p-book");clear(b);
  ref.bookNote=el("p","note");b.appendChild(ref.bookNote);
  [["soft","Soft drinks"],["cocktail","Cocktails"],["solo","Neat, beer and wine"]].forEach(function(sec){
    b.appendChild(el("div","h",sec[1]));
    ITEMS.filter(function(r){return (r.solo?"solo":r.f==="Soft"?"soft":"cocktail")===sec[0]}).sort(function(a,c){return a.p-c.p}).forEach(function(r){
      var row=mkRow("",false,"rec");
      var box=el("div","pbox"),inp=el("input"),fair=el("small"),rst=el("button","tog");
      inp.type="number";inp.step="any";inp.min="0";inp.setAttribute("inputmode","decimal");
      inp.setAttribute("aria-label","Price of "+r.n);
      inp.addEventListener("input",function(){setPrice(r.id,parseFloat(inp.value))});
      inp.addEventListener("change",function(){if(inp.value===""||!isFinite(parseFloat(inp.value)))clearPrice(r.id)});
      rst.onclick=function(){clearPrice(r.id)};
      var pend=el("small");
      box.append(inp,fair,pend,rst);row.row.appendChild(box);
      row.box=box;row.inp=inp;row.fair=fair;row.pend=pend;row.rst=rst;
      ref.rec[r.id]=row;b.appendChild(row.row);
    });
  });

  var cp=$("#p-cal");clear(cp);
  var C=ref.cal;
  C.vm=Math.floor(gDay()/28);C.sel=gDay();
  cp.appendChild(el("p","note","The calendar decides who walks in and what stock costs. Holidays and events change how many customers come, which kinds, and what you pay for ingredients. The bar can open at most "+MAXOPEN+" hours a day, and time runs faster while it is closed. Your team works whenever the bar is open."));
  var chd=el("div","chead"),cpv=el("button",null,"◀"),cnx=el("button",null,"▶");
  cpv.setAttribute("aria-label","Previous month");cnx.setAttribute("aria-label","Next month");
  C.ttl=el("b");chd.append(cpv,C.ttl,cnx);cp.appendChild(chd);
  cpv.onclick=function(){C.vm=Math.max(0,C.vm-1)};
  cnx.onclick=function(){C.vm=C.vm+1};
  var cg=el("div","cgrid");
  DAYN.forEach(function(l){cg.appendChild(el("span","wd",l))});
  C.cells=[];
  for(var cc=0;cc<28;cc++){
    (function(i){
      var cb=el("button","cday"),cn=el("span","n"),cm=el("span","mk");
      cb.append(cn,cm);
      cb.onclick=function(){C.sel=C.vm*28+i};
      C.cells.push({b:cb,n:cn,mk:cm});cg.appendChild(cb);
    })(cc);
  }
  cp.appendChild(cg);
  var cdet=el("div","tdetail");
  C.dt=el("div","tdn");cdet.appendChild(C.dt);
  C.evl=[];
  for(var ce=0;ce<3;ce++){var cel=el("div","tdd");cdet.appendChild(cel);C.evl.push(cel)}
  C.strip=el("div","hstrip");C.bars=[];
  for(var cbh=0;cbh<24;cbh++){var cbi=el("i");C.strip.appendChild(cbi);C.bars.push(cbi)}
  cdet.appendChild(C.strip);
  var chl=el("div","hlab");
  ["0h","6h","12h","18h","24h"].forEach(function(x){chl.appendChild(el("span",null,x))});
  cdet.appendChild(chl);
  C.mix=[];
  for(var cx=0;cx<6;cx++){var cmx=el("div","tdd");cdet.appendChild(cmx);C.mix.push(cmx)}
  C.sum=el("div","tdm");cdet.appendChild(C.sum);
  cp.appendChild(cdet);
  cp.appendChild(el("div","h","Opening hours"));
  cp.appendChild(el("p","gnote","Pick when the bar opens and closes each day. Closing after midnight is fine. Staff need at least "+(24-MAXOPEN)+" hours off a day."));
  C.hr=[];
  for(var cw=0;cw<7;cw++){
    (function(w){
      var row=el("div","hrow"),lab=el("b",null,DAYN[w]),so=el("select"),sc=el("select"),sp=el("span","sp");
      so.setAttribute("aria-label",DAYN[w]+" opening hour");sc.setAttribute("aria-label",DAYN[w]+" closing hour");
      for(var hx=0;hx<24;hx++){
        var o1=el("option",null,pad2(hx)+":00"),o2=el("option",null,pad2(hx)+":00");
        o1.value=String(hx);o2.value=String(hx);so.appendChild(o1);sc.appendChild(o2);
      }
      var apply=function(){setHours(w,parseInt(so.value,10),parseInt(sc.value,10))};
      so.onchange=apply;sc.onchange=apply;
      row.append(lab,so,sc,sp);cp.appendChild(row);
      C.hr.push({so:so,sc:sc,sp:sp});
    })(cw);
  }
  var ccopy=el("button","link","Copy Monday to every day");
  ccopy.onclick=function(){copyHours(0)};
  cp.appendChild(ccopy);


  var br=$("#p-brand");clear(br);
  var B=ref.br;
  B.note=el("p","note","Reputation grows with happy customers, profitable months and achievements, and falls when you cannot pay your bills. A better name brings more customers and richer ones, who accept higher prices and ask for premium brands. Each level earns a perk point.");
  br.appendChild(B.note);
  var sm=el("div","summary");
  B.lvl=el("b");B.pts=el("b");
  var ba=el("div"),bc=el("div");
  B.name=el("span");ba.append(B.lvl,B.name);bc.append(B.pts,el("span",null,"perk points"));
  sm.append(ba,bc);br.appendChild(sm);
  var bb=el("div","satb");B.bar=el("i","hi");bb.appendChild(B.bar);br.appendChild(bb);
  B.prog=el("p","note");br.appendChild(B.prog);
  B.eff=el("p","gnote");br.appendChild(B.eff);
  br.appendChild(el("div","h","Reputation perks"));
  ref.tr.rep=mkTree(br,PT,["Brand","Service","Business"],3);
  br.appendChild(el("div","h","Achievements"));
  B.ach={};
  ACH.forEach(function(a){
    var r=mkRow(a.n,false,"ach");var v=el("div","val");r.row.appendChild(v);r.val=v;
    B.ach[a.id]=r;br.appendChild(r.row);
  });
  br.appendChild(el("div","h","Your game"));   /* its own section: not folded away under Achievements */
  var reset=el("button","link","Erase all progress");var rc=false,rt;
  reset.onclick=function(){
    if(!rc){rc=true;reset.textContent="Tap again to erase everything";clearTimeout(rt);rt=setTimeout(function(){rc=false;reset.textContent="Erase all progress"},4000)}
    else{newGame();save();rc=false;reset.textContent="Erase all progress";setTab("stock");beginRun()}
  };
  var ex=el("button","link","Export save"),im=el("button","link","Import save");
  ex.onclick=openExport;im.onclick=openImport;
  var row=el("div","eacts");row.append(ex,im,reset);br.appendChild(row);
}

