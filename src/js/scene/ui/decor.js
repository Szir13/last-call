/* ---- weather, decor, night sign ---- */
function wxIcon(x,y,wx){
  if(wx===0){g.fillStyle="#f2c14a";g.fillRect(x+1,y+1,5,5);g.fillRect(x+3,y-1,1,9);g.fillRect(x-1,y+3,9,1);g.fillStyle="#fff3b0";g.fillRect(x+2,y+2,2,2)}
  else{
    g.fillStyle=wx===2?"#7d8798":"#d7dce6";g.fillRect(x,y+2,8,4);g.fillRect(x+2,y,5,3);
    if(wx===2){g.fillStyle="#7fb4ff";g.fillRect(x+1,y+7,1,2);g.fillRect(x+4,y+8,1,2);g.fillRect(x+7,y+7,1,2)}
    if(wx===3){g.fillStyle="#ffffff";g.fillRect(x+1,y+7,1,1);g.fillRect(x+4,y+8,1,1);g.fillRect(x+7,y+7,1,1)}
  }
}
function drawWeather(st,hr,wx,front){
  var r=SKYR[st],out=(st===0||st===3),i,x,y;
  if(!front){
    if(wx>=1){
      g.fillStyle=wx===2?"#7d8798":(lightAt(hr)<0.6?"#3a4060":"#e6e9f0");
      for(var k=0;k<3;k++){var cx=r[0]+((k*47+tt*(1.5+k*0.7))%(r[2]+36))-18,cy=r[1]+3+k*5;g.fillRect(Math.floor(cx),cy,16,4);g.fillRect(Math.floor(cx)+3,cy-2,9,3)}
    }
    return;
  }
  var ar=out?[0,0,PW,PH]:r;
  if(wx===2){g.fillStyle="rgba(170,196,232,.85)";for(i=0;i<(out?46:12);i++){x=ar[0]+((rn(i*3.7)*ar[2]+tt*9)%ar[2]);y=ar[1]+((rn(i*9.1)*ar[3]+tt*(60+rn(i)*30))%ar[3]);g.fillRect(Math.floor(x),Math.floor(y),1,3)}}
  else if(wx===3){g.fillStyle="#ffffff";for(i=0;i<(out?50:12);i++){x=ar[0]+((rn(i*2.9)*ar[2]+Math.sin(tt*1.2+i)*3+ar[2])%ar[2]);y=ar[1]+((rn(i*6.3)*ar[3]+tt*(14+rn(i)*10))%ar[3]);g.fillRect(Math.floor(x),Math.floor(y),1,1)}}
}
function drawDecor(hr){
  var d=S.deco,night=lightAt(hr)<0.6;
  if(d&&d.items){
    if(d.items.bunting){fr(g,0,2,PW,1,"#3b2414");for(var x=3;x<PW;x+=9){fr(g,x,3,3,3,["#e0405a","#f2c14a","#3fa3a3","#8a5fb5"][((x/9)|0)%4])}}
    if(d.items.plant){fr(g,8,133,5,5,"#a8743a");fr(g,8,133,5,1,"#c98a34");fr(g,10,128,1,6,"#2f7a3a");fr(g,6,128,4,3,"#44b05e");fr(g,11,127,4,3,"#44b05e");fr(g,8,124,5,4,"#5fc46e")}
    if(d.items.lamp){fr(g,20,130,1,8,"#2a1a14");fr(g,18,137,5,1,"#2a1a14");fr(g,17,124,7,6,night?"#ffe9a8":"#f2c14a");if(night){g.fillStyle="rgba(255,233,168,.18)";g.fillRect(10,118,22,20)}}
    if(d.items.jukebox){var jx=148,jy=124;fr(g,jx,jy,12,15,"#8a2f4a");fr(g,jx+1,jy-2,10,3,"#c0405a");fr(g,jx+2,jy+2,8,7,(Math.floor(tt*2)%2)?"#ffd36a":"#ffb347");fr(g,jx+2,jy+11,8,3,"#2a1a14")}
    if(d.items.trophy){var tx=136,ty=53;fr(g,tx+1,ty,4,3,"#f2c14a");fr(g,tx+2,ty+3,2,3,"#f2c14a");fr(g,tx,ty+6,6,2,"#8a5a30")}
    if(d.items.neon&&d.theme&&THEMES[d.theme]){var th=THEMES[d.theme],w=th.w.length*4+4;fr(g,36,3,w,9,"#12161d");fr(g,36,3,w,1,th.c);txt(g,th.w,38,5,th.c);if(night){g.fillStyle="rgba(255,255,255,.06)";g.fillRect(34,1,w+4,13)}}
  }
  var nt=S.nights&&S.nights[gDay()];
  if(nt&&NIGHTS[nt]){var wd=({live:"LIVE",quiz:"QUIZ",cocktail:"MIX"})[nt],nw=wd.length*4+4;fr(g,126,12,nw,9,"#2a1a14");fr(g,126,12,nw,1,"#ffd36a");txt(g,wd,128,14,"#ffd36a")}
}

/* ---- trouble at the bar ---- */
function openRowdy(o){
  var card=h("div","card");
  card.appendChild(h("h2",null,"Trouble at the bar"));
  card.appendChild(h("p",null,"A guest is getting loud. If nobody steps in, it will cost you damages and some unhappy neighbours."));
  var a=h("button","buy","Calm them down ("+Math.round(rowdyCalmChance()*100)+"% chance)");
  a.onclick=function(){hideOv();calmRowdy(o)};
  var b=h("button","buy","Show them out (no sale, no harm)");
  b.onclick=function(){hideOv();escortRowdy(o)};
  var wrap=h("div","cand");wrap.appendChild(a);wrap.appendChild(b);card.appendChild(wrap);
  var cl=h("button","link","Close");cl.onclick=hideOv;card.appendChild(cl);
  showOv(card);
}

