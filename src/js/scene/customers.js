/* ---------- customers follow the real orders ---------- */
var cust={},floats=[];
function shortName(w){return SHORTN[w]||w}
function newCust(o,snap){
  var out=(stageNow()===0||stageNow()===3);
  var c={id:o.cid||o.id,o:o,look:custLook({id:o.cid||o.id,who:o.who,cls:o.cls}),x:out?-8:DOOR.x,y:out?SLOTY[o.slot]:DOOR.y,slot:o.slot,state:"in",t:rn(o.id)*5,b:null,rdy:null,cells:[],mood:""};
  if(snap){c.x=SLOTX[o.slot];c.y=SLOTY[o.slot];c.state="wait"}
  buildBubble(c);cust[o.cid||o.id]=c;return c;
}
function buildBubble(c){
  var o=c.o,rg0=o.rid?regOf(o.rid):null,b=el("div","pb"),nm=el("div","pbn",rg0?"\u2665 "+rg0.name:shortName(o.who)),row=el("div","pbi"),rd=el("div","pbr"),pt=el("div","pbp"),pf=el("i"),xb=el("button","pbx","×"),tl=el("i","pbt");
  o.items.forEach(function(it,k){
    var cell=el("div","pbg q"),gc=glassEl(ITM[it.r]),s=el("i","pbs");
    gc.style.width=(gc.width*2)+"px";gc.style.height=(gc.height*2)+"px";
    cell.append(gc,s);row.appendChild(cell);c.cells.push({e:cell,s:s,st:"q",p:-1});
  });
  var cc=mk(8,8);spr(cc.getContext("2d"),SP.coin,0,0,{K:"#2a1a14",L:"#f2c14a",W:"#fff3b0"});cc.style.width="22px";cc.style.height="22px";
  var cv2=el("div","pbv","");rd.append(cc,cv2);rd.style.display="none";
  pt.appendChild(pf);b.append(nm,row,rd,pt,xb,tl);
  b.addEventListener("pointerdown",function(e){if(e.target===xb)return;e.preventDefault();tapCust(c)});
  b.setAttribute("role","button");b.tabIndex=0;
  b.setAttribute("aria-label",(rg0?rg0.name+", regular":o.who)+": "+o.items.map(function(it){return ITM[it.r].n}).join(", "));
  b.addEventListener("keydown",function(e){if(e.target===b&&(e.key==="Enter"||e.key===" ")){e.preventDefault();e.stopPropagation();tapCust(c)}});
  xb.setAttribute("aria-label","Turn this order away");
  xb.addEventListener("click",function(e){if(e.detail===0){var od=c.o;if(od&&!od.ready&&S.orders.indexOf(od)>=0){dropOrder(od);addSat(30)}}});   /* keyboard only: pointerdown handles touch */
  xb.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();var od=c.o;if(od&&!od.ready&&S.orders.indexOf(od)>=0){dropOrder(od);addSat(30)}});
  b.style.display="none";ov.appendChild(b);
  c.b=b;c.items=row;c.rd=rd;c.rv=cv2;c.pt=pt;c.pf=pf;c.xb=xb;
}
function describe(o){
  var parts=o.items.map(function(it,k){
    var r=ITM[it.r],st;
    if(it.done)st="done";
    else{var job=jobFor(o.id,k);
      if(job){var idx=S.jobs.indexOf(job);st=idx>=WK.length?"waiting for a free hand":"mixing "+Math.min(99,Math.floor(job.p/prepTime(r)*100))+"%"}
      else{var ms=missingOf(r);st=ms?"out of "+keyName(ms):"queued"}}
    return r.n+" ("+st+")";
  });
  return o.who+": "+parts.join(", ")+".";
}
function tapCust(c){
  var o=c.o;if(!o||c.state!=="wait")return;
  if(o.rowdy&&S.orders.indexOf(o)>=0){openRowdy(o);return}
  if(o.ready&&S.orders.indexOf(o)>=0)collect(o);else toast(describe(o));
}
function floatAt(x,y,t,cls){
  var f=el("div","pxf"+(cls?" "+cls:""),t);f.style.left=(x*Z)+"px";f.style.top=(y*Z)+"px";ov.appendChild(f);
  setTimeout(function(){if(f.parentNode)f.parentNode.removeChild(f)},1300);
}
var MORE=["Another one!","Same again!","One more, please!"],HAPPY=["Thanks!","Lovely!","Cheers!","Perfect!"],MADS=["Too slow!","Never mind.","I'm leaving!"];
function depart(c,seat){
  var o=c.o;c.state=(seat&&o&&o.ready)?"linger":"out";
  if(c.b){c.b.style.display="none"}
  if(o&&o.ready){c.mood="happy";coinBurst(c.x,c.y-14);sfx("coin");floatAt(c.x,c.y-24,"+"+eur(o.reward),"gold");setTimeout(function(){floatAt(c.x,c.y-30,sp(HAPPY,o.id))},350)}
  else if(o&&o.left<=0){c.mood="mad";floatAt(c.x,c.y-24,sp(MADS,o.id),"red")}
}
function sync(dt){
  var seen={},i,id,c;
  for(i=0;i<S.orders.length;i++){
    var o=S.orders[i],key=o.cid||o.id;seen[key]=1;c=cust[key];
    if(!c)c=newCust(o,snapNext);
    else if(c.o!==o&&(!c.o||c.o.id!==o.id)){
      if(c.b&&c.b.parentNode)c.b.parentNode.removeChild(c.b);
      c.o=o;c.cells=[];buildBubble(c);c.rdy=null;c.state="wait";c.drink=null;
      floatAt(c.x,c.y-24,sp(MORE,o.id));
    }
    c.o=o;c.slot=o.slot;
  }
  var holdIds={};
  (S.hold||[]).forEach(function(hd){
    holdIds[hd.id]=hd;
    if(!cust[hd.id]&&!seen[hd.id]){
      var lc=newCust({id:hd.id,who:hd.who,cls:hd.cls,slot:hd.slot,items:[],ready:true,reward:0,left:1,pat:1},true);
      lc.state="linger";lc.drink=hd.drink;lc.o=null;if(lc.b)lc.b.style.display="none";
    }
  });
  for(id in cust){
    if(seen[id])continue;
    c=cust[id];
    if(c.state==="linger"){if(!holdIds[id])c.state="out"}
    else if(c.state!=="out"){var hd0=holdIds[id];if(hd0)c.drink=hd0.drink;depart(c,!!hd0)}
  }
  snapNext=false;
  var stg0=(stageNow()===0||stageNow()===3);
  for(id in cust){
    c=cust[id];c.t+=dt;
    if(c.state==="in"){
      if(mv(c,SLOTX[c.slot],SLOTY[c.slot],dt,38)){c.state="wait"}
    }else if(c.state==="out"){
      var ex=stg0?{x:-12,y:c.y}:{x:DOOR.x,y:DOOR.y};
      if(mv(c,ex.x,ex.y,dt,44)){if(c.b&&c.b.parentNode)c.b.parentNode.removeChild(c.b);delete cust[id]}
    }
  }
}
function mv(c,tx,ty,dt,sp0){var dx=tx-c.x,dy=ty-c.y,d=Math.sqrt(dx*dx+dy*dy);if(d<0.6){c.x=tx;c.y=ty;return true}var st=Math.min(d,sp0*dt);c.x+=dx/d*st;c.y+=dy/d*st;return false}
function anyWaiting(){for(var id in cust){if(cust[id].state==="wait")return true}return false}

function statusTick(){
  WK=workers();
  var nw=0,rd0=0;S.orders.forEach(function(o){if(o.ready)rd0++;else nw++});
  var sm=document.getElementById("pxsum"),cb=document.getElementById("pxcol");
  if(sm){var tx=nw+" waiting";if(sm._t!==tx){sm._t=tx;sm.textContent=tx}}
  if(cb){cb.disabled=!rd0;var cl0=rd0?"Collect "+rd0:"Collect";if(cb._t!==cl0){cb._t=cl0;cb.textContent=cl0}}
  for(var id in cust){
    var c=cust[id],o=c.o;if(c.state!=="wait"||!o)continue;
    c.b.classList.toggle("rowdy",!!o.rowdy);
    var rdy=!!o.ready;
    if(rdy!==c.rdy){c.rdy=rdy;c.b.classList.toggle("rdy",rdy);
      if(rdy)c.b.setAttribute("aria-label",(c.b.getAttribute("aria-label")||"").replace(/\. Ready.*$/,"")+". Ready: collect "+eur(o.reward));c.items.style.display=rdy?"none":"";c.rd.style.display=rdy?"flex":"none";c.xb.style.display=rdy?"none":"";c.pt.style.display=rdy?"none":""}
    if(rdy){c.rv.textContent=eur(o.reward)}
    else{
      var f=clamp(o.left/o.pat,0,1);c.pf.style.width=(f*100)+"%";c.pf.style.background=f>0.5?"#4f9a3a":(f>0.25?"#e0a020":"#c0402a");
      for(var k=0;k<o.items.length;k++){
        var it=o.items[k],cell=c.cells[k],st,p=0;if(!cell)continue;
        if(it.done){st="done"}
        else{var job=jobFor(o.id,k);
          if(job){var ix=S.jobs.indexOf(job);if(ix>=WK.length){st="q"}else{st="mix";p=clamp(job.p/prepTime(ITM[it.r]),0,1)}}
          else if(missingOf(ITM[it.r])){st="out"}else st="q"}
        if(cell.st!==st){cell.st=st;cell.e.className="pbg "+st}
        var pp=Math.round(p*100);if(cell.p!==pp){cell.p=pp;cell.s.style.setProperty("--p",pp+"%")}
      }
    }
  }
}

