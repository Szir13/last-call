/* ---- upgrades: expansion preview ---- */
function buildPrev(st){
  var c=mk(PW,PH),a=c.getContext("2d"),r=SKYR[st];
  a.fillStyle="#8fd0f0";a.fillRect(r[0],r[1],r[2],r[3]);
  a.drawImage(buildA(st),0,0);a.drawImage(buildB(st),0,0);
  c.className="pxprev";c.setAttribute("aria-hidden","true");return c;
}
function updExpPrev(){
  var row=ref.exp&&ref.exp.row;if(!row)return;
  var st=clamp(S.exp+1,0,4);
  if(row._pv!==st){
    if(row._pc&&row._pc.parentNode)row._pc.parentNode.removeChild(row._pc);
    row._pv=st;row._pc=buildPrev(st);row.insertBefore(row._pc,row.firstChild);row.setAttribute("data-exp","1");
  }
}

