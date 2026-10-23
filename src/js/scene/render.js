/* ---------- drawing ---------- */
function render(){
  var hr=(typeof gHour==="function")?gHour():12,st=stageNow(),open=isOpenNow(),i,id;
  if(stage!==st||shelfSig!==ownedSig())rebuild();
  g.clearRect(0,0,PW,PH);
  var sk=skyAt(hr),r=SKYR[st];g.fillStyle=sk;g.fillRect(r[0],r[1],r[2],r[3]);
  if(lightAt(hr)<0.6){g.fillStyle="#ffffff";for(i=0;i<9;i++){var sx=r[0]+2+Math.floor(rn(i*3.1)*(r[2]-4)),sy=r[1]+2+Math.floor(rn(i*7.7)*(Math.min(r[3],28)-4));g.fillRect(sx,sy,1,1)}}
  var wxd=weatherOf(gDay());drawWeather(st,hr,wxd,false);
  g.drawImage(LA,0,0);
  drawBanner(st);
  if(Date.now()<S.hhUntil){for(i=0;i<PW;i+=10){g.fillStyle=["#e0405a","#f2c14a","#3fa3a3","#8a5fb5"][(Math.floor(tt*4)+i/10)%4|0];g.fillRect(i+2,5+((i/10)%2?1:0),3,3)}}
  /* stools show how many seats you have */
  var ms=maxSlots();
  stg.classList.toggle("dense",ms>9);
  for(i=ms-1;i>=0;i--){spr(g,SP.stool,SLOTX[i]-2,SLOTY[i]-6,{K:"#2a1a14",L:"#a8743a"})}
  /* you, then the team on shift, behind the counter */
  var bob=(Math.floor(tt*1.6)%2)?1:0,busy=Math.min(S.jobs.length,WK.length);
  var emps=shiftCounts().emps.slice().sort(function(a,b){return (STAFFM[b.role].sp?1:0)-(STAFFM[a.role].sp?1:0)});
  var crew=[YOU].concat(emps.map(function(e){return staffLook(e)})),bx=[44].concat(STAFFX),extra=Math.max(0,crew.length-(1+STAFFX.length));
  for(i=0;i<crew.length&&i<bx.length;i++){
    var work=i<busy,dy=work?(Math.floor(tt*5+i)%2?-1:0):((Math.floor(tt*1.6+i*0.7)%2)?1:0);
    drawPerson(g,crew[i],bx[i],62,0,dy,false);
    if(work){spr(g,SP.short,bx[i]+5,50+(Math.floor(tt*5+i)%2),{K:"#2a1a14",W:"#ffffff",L:"#cfe8f0"})}
  }
  g.drawImage(LB,0,0);
  drawDecor(hr);
  if(extra>0){g.fillStyle="#2a1a14";g.fillRect(128,46,20,9);txt(g,"+"+extra,131,48,"#f2c14a")}
  /* customers */
  var list=[];for(id in cust)list.push(cust[id]);list.sort(function(a,b){return a.y-b.y});
  for(i=0;i<list.length;i++){
    var c=list[i],mvg=(c.state==="in"||c.state==="out"),fm=mvg?(Math.floor(c.t*6)%2):0,dy2=mvg&&fm?-1:0;
    if(c.state==="out"&&c.mood==="happy")dy2=-Math.abs(Math.sin(c.t*9))*1.5;
    drawPerson(g,c.look,c.x,c.y,fm,dy2,true);
    if(c.state==="out"&&c.mood==="happy")spr(g,SP.heart,Math.round(c.x-2),Math.round(c.y-25+dy2),{R:"#e0405a"});
    if(c.state==="out"&&c.mood==="mad"){g.fillStyle="#d94a2a";g.fillRect(Math.round(c.x),Math.round(c.y-26),1,4);g.fillRect(Math.round(c.x),Math.round(c.y-21),1,1)}
    if(c.state==="linger"&&c.drink&&ITM[c.drink]){
      var gb=glassBase(ITM[c.drink]);g.drawImage(gb,Math.round(c.x+3),Math.round(c.y-12+(Math.floor(tt*0.8+c.id)%4===0?-1:0)));
    }
    if(c.state==="wait"){
      c.b.style.display="";c.b.style.left=(c.x*Z)+"px";c.b.style.top=((c.y-19)*Z)+"px";
    }
  }
  if(tutOn){drawPerson(g,JOE,14,124,0,(Math.floor(tt*1.6)%2)?1:0,true);g.fillStyle="#f2c14a";g.fillRect(13,98+(Math.floor(tt*3)%2),2,5);g.fillRect(13,105,2,2)}
  /* open / closed sign */
  var sg=open?{t:"OPEN",bg:"#2f7a3a",fg:"#e8ffe0"}:{t:"CLOSED",bg:"#a8402a",fg:"#fff0e0"},sw=sg.t.length*4+3;
  var sxp=st===0?4:(st===3?4:5),syp=st===0?20:(st===3?20:44);
  fr(g,sxp,syp,sw,9,"#2a1a14");fr(g,sxp+1,syp+1,sw-2,7,sg.bg);txt(g,sg.t,sxp+2,syp+2,sg.fg);
  /* day, night and closing time */
  drawWeather(st,hr,wxd,true);wxIcon(150,3,wxd);
  var a=(1-lightAt(hr))*0.5+(open?0:0.18);
  if(a>0.01){g.fillStyle="rgba(16,24,80,"+a.toFixed(3)+")";g.fillRect(0,0,PW,PH)}
}

