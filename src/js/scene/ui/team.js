/* ---- team list: week schedule and shift status; upgrades: expansion preview ---- */
var DAYL=["M","T","W","T","F","S","S"];
function pad2(n){return n<10?"0"+n:""+n}
function hhmm(v){v=((v%24)+24)%24;var m=Math.round((v%1)*60),hh=Math.floor(v);if(m===60){m=0;hh=(hh+1)%24}return pad2(hh)+":"+pad2(m)}
function weekStrip(){
  var w=el("div","pxwkw"),st=el("div","pxwk"),i;
  for(i=0;i<7;i++){var c=el("i"),bb=el("b",null,DAYL[i]),u=el("u");c.append(bb,u);st.appendChild(c)}
  var meta=el("div","pxmeta"),dot=el("span","dot"),tx=el("span");meta.append(dot,tx);
  w.append(st,meta);w._st=st;w._meta=meta;w._tx=tx;
  return w;
}
function updTeamRows(){
  return;
  var td=gDay()%7,gd=gDay(),gh=gHour();
  S.team.forEach(function(e){
    var r=ref.emps&&ref.emps[e.id];if(!r||!r.row||!r.info)return;
    var w=r.row._wk;
    if(!w){w=r.row._wk=weekStrip();r.info.insertBefore(w,r.sub)}
    var cells=w._st.children,i;
    for(i=0;i<7;i++){
      var len=e.sch[i][1],on=len>0,cn=(on?"w":"")+(i===td?" t":""),c=cells[i];
      if(c._c!==cn){c._c=cn;c.className=cn}
      var wd=on?Math.max(25,Math.min(100,Math.round(len/12*100))):35;
      if(c._w!==wd){c._w=wd;c.lastChild.style.width=wd+"%"}
    }
    var live=empWorksAt(e,gd,gh),s0=e.sch[td],txt;
    if(live){
      var y=e.sch[(td+6)%7],endH=null;
      if(s0[1]>0&&gh>=s0[0]&&gh<s0[0]+s0[1])endH=s0[0]+s0[1];
      else if(y[1]>0&&y[0]+y[1]>24)endH=y[0]+y[1]-24;
      txt="On shift"+(endH==null?"":" until "+hhmm(endH));
    }else if(s0[1]>0&&gh<s0[0])txt="Starts at "+hhmm(s0[0]);
    else if(s0[1]>0)txt="Finished for today";
    else txt="Day off today";
    var key=txt+(live?"1":"0");
    if(w._m!==key){w._m=key;w._tx.textContent=txt;w._meta.className=live?"pxmeta on":"pxmeta"}
  });
}
function buildPrev(st){
  var c=mk(PW,PH),a=c.getContext("2d"),r=SKYR[st];
  a.fillStyle="#8fd0f0";a.fillRect(r[0],r[1],r[2],r[3]);
  a.drawImage(buildA(st),0,0);a.drawImage(buildB(st),0,0);
  c.className="pxprev";c.setAttribute("aria-hidden","true");return c;
}
function updExpPrev(){
  var row=ref.exp&&ref.exp.row;if(!row)return;
  var st=cl(S.exp+1,0,4);
  if(row._pv!==st){
    if(row._pc&&row._pc.parentNode)row._pc.parentNode.removeChild(row._pc);
    row._pv=st;row._pc=buildPrev(st);row.insertBefore(row._pc,row.firstChild);row.setAttribute("data-exp","1");
  }
}
setInterval(function(){try{updTeamRows();updExpPrev()}catch(e){}},700);

