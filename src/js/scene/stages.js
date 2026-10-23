/* ---------- stages ---------- */
var TH=[
 {wall:"#a8743a",floor:"#cdbf9a",top:"#f2d7a0",hi:"#fff0c8",front:"#c98a34",panel:"#b87a2a",trim:"#7a4a1a",sign:"FRESH",sbg:"#fff7d6",sfg:"#c0392b"},
 {wall:"#5b3a26",floor:"#b9824a",top:"#e8bb7c",hi:"#f6d49a",front:"#7d4a26",panel:"#6a3d1e",trim:"#3b2414",sign:"BAR",sbg:"#2a1a14",sfg:"#ffd36a"},
 {wall:"#2f4a42",floor:"#e8e2d2",top:"#f2efe6",hi:"#ffffff",front:"#2f4a42",panel:"#3b5a50",trim:"#d9a63a",sign:"HOTEL",sbg:"#1c2e29",sfg:"#f2c14a"},
 {wall:"#2a2f4a",floor:"#8a6a46",top:"#d9b27a",hi:"#f0cf9a",front:"#5a3f2a",panel:"#6b4a30",trim:"#3b2414",sign:"SKY",sbg:"#161a2e",sfg:"#7fd6e8"},
 {wall:"#1f2530",floor:"#2a2f3a",top:"#cfd6e0",hi:"#ffffff",front:"#2f3643",panel:"#252b36",trim:"#4fe0e0",sign:"LC",sbg:"#12161d",sfg:"#4fe0e0"}
];
var SKYR=[[0,0,PW,48],[26,10,16,30],[26,10,16,30],[0,0,PW,50],[104,10,52,30]];
var stage=-1,LA=null,LB=null,shelfSig="";
function ownedSig(){return stageNow()+"|"+Object.keys(S.ing).join(",")}
function stageNow(){return cl(S.exp||0,0,4)}
function drawShelf(a,st,x0,x1,y1){
  var th=TH[st];
  fr(a,x0,y1+9,x1-x0,2,th.trim);fr(a,x0,y1+9,x1-x0,1,th.hi);
  fr(a,x0,y1+23,x1-x0,2,th.trim);fr(a,x0,y1+23,x1-x0,1,th.hi);
  var bt=[],cn=[],mg=[];
  var CANS=["soda","tonic","cola","gingerbeer","cranberry","pineapple","coconut","coffee","orangejuice","limejuice","lemonjuice","syrup"];
  Object.keys(COL).forEach(function(id){if(!S.ing[id])return;
    if(CANS.indexOf(id)>=0)cn.push(id);
    else if(id==="beer"||id==="wine")mg.push(id);
    else if(id!=="mint"&&id!=="cucumber")bt.push(id)});
  var x=x0+2;
  bt.forEach(function(id){if(x+5<x1){spr(a,SP.bottle,x,y1,{K:"#2a1a14",W:"#ffffff",L:COL[id],T:"#efe6d2"});x+=7}});
  x=x0+2;
  cn.concat(mg).forEach(function(id){if(x+6<x1){spr(a,SP.can,x,y1+15,{K:"#2a1a14",W:"#ffffff",L:COL[id]});x+=7}});
}
function buildA(st){
  var c=mk(PW,PH),a=c.getContext("2d"),th=TH[st],x,y;
  if(st===0){
    fr(a,0,40,PW,24,"#4f7a4a");for(x=0;x<PW;x+=14){fr(a,x,34+((x/14)%2)*4,12,12,"#5f8f58")}
    fr(a,0,62,PW,PH-62,th.floor);fr(a,0,62,PW,4,"#6aa05a");
    for(y=68;y<PH;y+=12){fr(a,0,y,PW,1,"#b8aa86");for(x=((y/12)%2)*14;x<PW;x+=28)fr(a,x,y,1,12,"#b8aa86")}
    fr(a,20,36,140,26,th.wall);for(x=22;x<160;x+=9)fr(a,x,36,1,26,"#8f6130");
    for(x=20;x<160;x+=8){fr(a,x,18,8,16,((x-20)/8)%2?"#fff7d6":"#f2c14a")}
    for(x=20;x<160;x+=8){fr(a,x,34,8,2,((x-20)/8)%2?"#fff7d6":"#f2c14a");fr(a,x+2,36,4,1,((x-20)/8)%2?"#fff7d6":"#f2c14a")}
    fr(a,20,18,140,1,"#c9a43a");
    fr(a,20,36,3,30,"#7a4a1a");fr(a,157,36,3,30,"#7a4a1a");
    fr(a,60,40,40,16,th.sbg);fr(a,60,40,40,1,"#7a4a1a");fr(a,60,55,40,1,"#7a4a1a");txt(a,"FRESH",68,45,th.sfg);
    for(x=0;x<3;x++){spr(a,SP.crate,112+x*14,52,{K:"#2a1a14",L:"#a8743a"});fr(a,114+x*14,49,4,3,"#f3e46a");fr(a,119+x*14,49,4,3,"#f3e46a")}
    if(S.ing.syrup)spr(a,SP.bottle,26,53,{K:"#2a1a14",W:"#fff",L:COL.syrup,T:"#efe6d2"});
    if(S.ing.soda)spr(a,SP.bottle,33,53,{K:"#2a1a14",W:"#fff",L:COL.soda,T:"#efe6d2"});
    return c;
  }
  if(st===3){
    fr(a,0,50,PW,14,"#10132a");
    for(x=0;x<PW;x+=11){var bh=10+Math.floor(rn(x)*14);fr(a,x,50-bh+10,9,bh+4,"#1b2040");
      for(y=50-bh+13;y<60;y+=4){if(rn(x+y)>0.5)fr(a,x+2,y,2,2,"#f2c14a")}}
    fr(a,0,52,PW,12,"#2a2f4a");fr(a,0,52,PW,1,"#7fd6e8");for(x=0;x<PW;x+=10)fr(a,x,52,1,10,"#3a4468");
    fr(a,0,62,PW,PH-62,th.floor);for(y=64;y<PH;y+=6)fr(a,0,y,PW,1,"#6e5236");
    fr(a,0,12,PW,1,"#3b2414");for(x=3;x<PW;x+=10){fr(a,x,13,1,2,"#3b2414");fr(a,x-1,15,3,3,((x/10)|0)%2?"#f2c14a":"#ffd9a0")}
    drawShelf(a,st,60,150,22);
    return c;
  }
  /* indoor stages */
  fr(a,0,0,PW,62,th.wall);
  if(st===1){for(x=0;x<PW;x+=8){fr(a,x,0,1,62,"#4a2f1f");fr(a,x+1,0,1,62,"#6a4430")}}
  else if(st===2){for(x=0;x<PW;x+=16){fr(a,x,6,14,52,th.panel);fr(a,x,6,14,1,th.trim);fr(a,x,57,14,1,th.trim)}}
  else{for(x=0;x<PW;x+=20){fr(a,x,0,1,62,"#2f3643")}fr(a,0,8,PW,1,"#e04fb0");fr(a,0,44,PW,1,"#4fe0e0");fr(a,0,45,PW,1,"rgba(79,224,224,.3)")}
  fr(a,0,0,PW,3,st===4?"#12161d":th.trim);fr(a,0,3,PW,1,st===2?"#f2c14a":"#7a5236");
  fr(a,0,60,PW,2,st===2?"#d9a63a":th.trim);
  fr(a,0,62,PW,PH-62,th.floor);
  if(st===2){for(y=62;y<PH;y+=8)for(x=((y-62)/8%2)*8;x<PW;x+=16)fr(a,x,y,8,8,"#9a9484")}
  else if(st===1){for(y=62;y<PH;y+=6){fr(a,0,y,PW,1,"#9c6a3a");fr(a,0,y+1,PW,1,"#c89458");for(x=((y-62)/6%2)*10;x<PW;x+=20)fr(a,x,y,1,6,"#9c6a3a")}}
  else{for(y=62;y<PH;y+=10)fr(a,0,y,PW,1,"#353b48");fr(a,0,100,PW,1,"#4fe0e0")}
  fr(a,24,82,136,3,"rgba(0,0,0,.2)");
  /* door */
  var dc=st===2?"#d9a63a":st===4?"#4fe0e0":"#2a1a14";
  fr(a,3,22,18,44,dc);fr(a,5,24,14,42,st===1?"#8a5a30":st===2?"#3b5a50":"#1c2230");
  if(st===1){fr(a,5,38,14,1,"#6f4624");fr(a,5,52,14,1,"#6f4624");fr(a,11,24,2,12,"#6f4624");fr(a,6,26,5,9,"#9fc4d8");fr(a,13,26,5,9,"#9fc4d8");fr(a,16,46,2,2,"#f2c14a")}
  else if(st===2){fr(a,11,24,2,42,"#d9a63a");fr(a,9,44,1,3,"#f2c14a");fr(a,14,44,1,3,"#f2c14a")}
  else{fr(a,6,26,12,36,"#2a3a4a");fr(a,11,26,2,36,"#4fe0e0")}
  fr(a,4,65,16,2,"#7a2f2a");
  /* sign */
  var sw=th.sign.length*4+3;fr(a,2,6,sw+2,10,th.sbg);fr(a,2,6,sw+2,1,th.trim);fr(a,2,15,sw+2,1,th.trim);txt(a,th.sign,5,8,th.sfg);
  /* window */
  if(st===1||st===2){fr(a,24,8,20,34,th.trim);a.clearRect(26,10,16,30);fr(a,33,10,2,30,th.trim);fr(a,26,23,16,2,th.trim);fr(a,22,42,24,2,th.trim)}
  if(st===4){fr(a,102,8,56,34,"#12161d");a.clearRect(104,10,52,30);for(x=104;x<156;x+=13)fr(a,x,10,1,30,"#12161d");fr(a,102,40,56,2,"#4fe0e0")}
  /* back bar */
  if(st===2){fr(a,46,10,110,32,"#7aa6a0");fr(a,46,10,110,1,"#d9a63a");fr(a,46,41,110,1,"#d9a63a");fr(a,84,0,1,6,"#d9a63a");fr(a,76,6,17,3,"#d9a63a");
    for(x=0;x<3;x++)fr(a,77+x*6,9,3,3,"#ffe9a8")}
  if(st===4){fr(a,48,10,100,32,"#18202a");fr(a,48,10,100,1,"#4fe0e0");fr(a,48,41,100,1,"#4fe0e0")}
  drawShelf(a,st,50,154,15);
  return c;
}
function buildB(st){
  var c=mk(PW,PH),b=c.getContext("2d"),th=TH[st],x;
  fr(b,24,62,136,4,th.top);fr(b,24,62,136,1,th.hi);fr(b,24,65,136,1,"rgba(0,0,0,.18)");
  fr(b,24,66,136,16,th.front);
  for(x=26;x<158;x+=17){fr(b,x,68,15,12,th.panel);fr(b,x,68,15,1,"rgba(255,255,255,.18)")}
  fr(b,24,81,136,1,th.trim);fr(b,23,62,1,20,th.trim);
  if(st===4)fr(b,24,66,136,1,"#4fe0e0");
  if(st===2)fr(b,24,66,136,1,"#d9a63a");
  /* register */
  fr(b,26,55,8,7,"#2a1a14");fr(b,27,56,6,5,"#4a5058");fr(b,28,57,4,2,"#7fd6a0");fr(b,28,60,4,1,"#f2c14a");
  /* tip jar */
  fr(b,150,57,5,5,"#cfe8f0");fr(b,150,57,5,1,"#2a1a14");fr(b,151,59,3,2,"#f2c14a");
  return c;
}
function rebuild(){var s=stageNow();stage=s;shelfSig=ownedSig();LA=buildA(s);LB=buildB(s)}
function skyAt(hr){
  var K=[[0,"#0f1438"],[5,"#1c2150"],[6.5,"#f0a070"],[8,"#8fd0f0"],[17,"#8fd0f0"],[19,"#f08a5a"],[20.5,"#242a62"],[24,"#0f1438"]];
  for(var i=1;i<K.length;i++){if(hr<=K[i][0]){var a=K[i-1],b=K[i],t=(hr-a[0])/(b[0]-a[0]);
    var ca=[parseInt(a[1].substr(1,2),16),parseInt(a[1].substr(3,2),16),parseInt(a[1].substr(5,2),16)],cb=[parseInt(b[1].substr(1,2),16),parseInt(b[1].substr(3,2),16),parseInt(b[1].substr(5,2),16)];
    return "rgb("+Math.round(ca[0]+(cb[0]-ca[0])*t)+","+Math.round(ca[1]+(cb[1]-ca[1])*t)+","+Math.round(ca[2]+(cb[2]-ca[2])*t)+")"}}
  return "#0f1438";
}
function lightAt(hr){if(hr>=8&&hr<17)return 1;if(hr>=5&&hr<8)return 0.3+0.7*(hr-5)/3;if(hr>=17&&hr<20)return 1-0.7*(hr-17)/3;return 0.3}

