/* ---------- helpers ---------- */
function mk(w,h){var c=document.createElement("canvas");c.width=w;c.height=h;return c}
function rn(n){var x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function sp(a,n){return a[Math.floor(rn(n)*a.length)]}
function fr(c,x,y,w,hh,col){c.fillStyle=col;c.fillRect(x,y,w,hh)}

/* ---------- sprites ---------- */
var PERSON=[
"....KKKK....","...KHHHHK...","..KHHHHHHK..","..KHHHHHHK..","..KHSSSSHK..","..KSSSSSSK..",
"..KSESSESK..","..KSSSSSSK..","...KSSSSK...","....KKKK....","...KCCCCK...","..KCCCCCCK..",
".KSCCCCCCSK.",".KSCCCCCCSK.","..KKCCCCKK..","...KPPPPK...","...KPKKPK...","...KBKKBK..."];
var PERSON_B=PERSON.slice(0,16).concat(["..KPK..KPK..","..KBK..KBK.."]);
var SP={
 high:["KKKKKKK","KLLLLLK","KLWLLLK","KLLLLLK","KLLLLLK",".KLLLK.","..KKK..",".KKKKK."],
 short:["KKKKKKK","KLLLLLK","KLWLLLK","KLLLLLK","KLLLLLK","KKKKKKK"],
 coupe:["KKKKKKK","KLLLLLK",".KLLLK.","..KLK..","...K...","...K...","..KKK.."],
 wine:[".KKKKK.","KLLLLLK","KLWLLLK",".KLLLK.","..KLK..","...K...","...K...",".KKKKK."],
 mug:["KKKKKK..","KWWWWKKK","KLLLLK.K","KLLLLK.K","KLLLLK.K","KLLLLKKK","KLLLLK..","KKKKKK.."],
 bottle:[".KTK.",".KLK.",".KLK.","KLLLK","KLWLK","KLLLK","KLLLK","KLLLK","KKKKK"],
 can:["KKKKK","KLLLK","KLWLK","KLLLK","KLLLK","KLLLK","KLLLK","KKKKK"],
 crate:["KKKKKKKK","KLLLLLLK","KLLLLLLK","KKKKKKKK"],
 heart:[".R.R.","RRRRR",".RRR.","..R.."],
 coin:["..KKKK..",".KLLLLK.","KLLWLLLK","KLWLLLLK","KLLLLLLK","KLLLLLLK",".KLLLLK.","..KKKK.."],
 stool:["KKKKK","KLLLK","KKKKK",".K.K.",".K.K."]
};
function sprRaw(c,s,x,y,pal){
  for(var r=0;r<s.length;r++){var row=s[r];
    for(var k=0;k<row.length;k++){var ch=row.charAt(k);if(ch===".")continue;var col=pal[ch];if(!col)continue;c.fillStyle=col;c.fillRect(x+k,y+r,1,1)}}
}
/* a sprite is painted pixel by pixel once per palette, then copied: the same pixels for whole-pixel
   positions and opaque colours (anything else is painted directly) */
function spr(c,s,x,y,pal){
  var key="",k;
  for(k in pal){var v=pal[k];if(typeof v!=="string"||v.charAt(0)!=="#"||window.__sprRaw)return sprRaw(c,s,x,y,pal);key+=k+v}
  if(x!==Math.floor(x)||y!==Math.floor(y))return sprRaw(c,s,x,y,pal);
  var cache=s.__img||(s.__img={}),im=cache[key];
  if(!im){
    var w=0;for(var r=0;r<s.length;r++)w=Math.max(w,s[r].length);
    im=cache[key]=mk(Math.max(1,w),Math.max(1,s.length));sprRaw(im.getContext("2d"),s,0,0,pal);
  }
  c.drawImage(im,x,y);
}
function rects(c,list,x,y){for(var i=0;i<list.length;i++){var a=list[i];c.fillStyle=a[4];c.fillRect(x+a[0],y+a[1],a[2],a[3])}}
var F3={A:["010","101","111","101","101"],B:["110","101","110","101","110"],C:["111","100","100","100","111"],D:["110","101","101","101","110"],
 E:["111","100","110","100","111"],F:["111","100","110","100","100"],H:["101","101","111","101","101"],K:["101","101","110","101","101"],
 L:["100","100","100","100","111"],N:["111","101","101","101","101"],O:["111","101","101","101","111"],P:["111","101","111","100","100"],
 R:["110","101","110","101","101"],S:["111","100","111","001","111"],T:["111","010","010","010","010"],Y:["101","101","010","010","010"],
 G:["111","100","101","101","111"],I:["111","010","010","010","111"],J:["001","001","001","101","111"],M:["101","111","111","101","101"],Q:["111","101","101","111","001"],
 U:["101","101","101","101","111"],V:["101","101","101","101","010"],W:["101","101","111","111","101"],X:["101","101","010","101","101"],Z:["111","001","010","100","111"],
 "0":["111","101","101","101","111"],"1":["010","110","010","010","111"],"2":["111","001","111","100","111"],"3":["111","001","111","001","111"],"4":["101","101","111","001","001"],
 "5":["111","100","111","001","111"],"6":["111","100","111","101","111"],"7":["111","001","001","001","001"],"8":["111","101","111","101","111"],"9":["111","101","111","001","111"]};
function txt(c,s,x,y,col){c.fillStyle=col;for(var i=0;i<s.length;i++){var f=F3[s.charAt(i)];if(!f)continue;
  for(var r=0;r<5;r++)for(var q=0;q<3;q++){if(f[r].charAt(q)==="1")c.fillRect(x+i*4+q,y+r,1,1)}}}

/* ---------- drinks -> glasses ---------- */
var COL={gin:"#dff2ee",rum:"#c98a34",vodka:"#e6ebf2",cachaca:"#e9d78d",whiskey:"#b0621f",tequila:"#ecca5c",pisco:"#efe3b0",cognac:"#9a4f1c",mezcal:"#d7c88a",
 campari:"#d4322d",vermouth:"#8c2434",aperol:"#f08a2a",amaretto:"#b8742c",triple:"#f6c46a",elderflower:"#e9efb5",chartreuse:"#9ad05a",prosecco:"#f3e6a0",angostura:"#8a3d1b",
 soda:"#e3f3f7",tonic:"#d6eef3",cola:"#4a3226",gingerbeer:"#d9b25a",cranberry:"#c0334a",pineapple:"#f3d543",coconut:"#f6f0e4",coffee:"#4a2c1c",
 orangejuice:"#f5a02a",limejuice:"#d8eebb",lemonjuice:"#f3e46a",syrup:"#fff3c4",mint:"#44b05e",cucumber:"#a8d98a",beer:"#e8b730",wine:"#a8323f"};
var PRI=["coffee","cola","cranberry","campari","aperol","vermouth","pineapple","coconut","orangejuice","amaretto","gingerbeer","tequila","limejuice","lemonjuice"];
var COUPE={gimlet:1,daiquiri:1,marg:1,mezmarg:1,espresso:1,cosmo:1,sidecar:1,manhattan:1,lastword:1,southside:1};
var SHORT={oldf:1,negroni:1,sbagliato:1,whiskeysour:1,amarettosour:1,piscosour:1,caipirinha:1};
var WINEG={mimosa:1,spritz:1,hugo:1};
var GAR={mint:"#44b05e",limejuice:"#74c443",lemonjuice:"#f3e46a",orangejuice:"#f5a02a",cranberry:"#c0334a",pineapple:"#f3d543"};
function glassSpec(it){
  if(it.solo){
    if(it.ing==="beer")return {t:"mug",l:COL.beer};
    if(it.ing==="wine")return {t:"wine",l:COL.wine};
    return {t:"short",l:COL[it.ing]||"#c98a34"};
  }
  var l=null,i;
  for(i=0;i<PRI.length&&!l;i++){if(it.i.indexOf(PRI[i])>=0)l=COL[PRI[i]]}
  if(!l)l=COL[it.i[0]]||"#e8e0cc";
  var gar=null;
  for(i=0;i<it.i.length&&!gar;i++){if(GAR[it.i[i]])gar=GAR[it.i[i]]}
  return {t:COUPE[it.id]?"coupe":SHORT[it.id]?"short":WINEG[it.id]?"wine":"high",l:l,gar:gar};
}
var GC={};
function glassBase(it){
  var s=GC[it.id];if(s)return s;
  var sp0=glassSpec(it),sh=SP[sp0.t],w=sh[0].length,hh=sh.length+2,c=mk(w,hh),a=c.getContext("2d");
  spr(a,sh,0,2,{K:"#2a1a14",W:"rgba(255,255,255,.75)",L:sp0.l});
  if(sp0.gar){a.fillStyle=sp0.gar;a.fillRect(w-3,0,2,2);a.fillStyle="#2a1a14";a.fillRect(w-3,2,1,1)}
  GC[it.id]=c;return c;
}
function glassEl(it){var b=glassBase(it),c=mk(b.width,b.height);c.getContext("2d").drawImage(b,0,0);return c}

/* ---------- people ---------- */
var SKIN=["#f3cfa8","#e2b184","#bb8458","#8a5a3a","#5e3a24"],HAIR=["#2a1a14","#5a3a1e","#c9a13a","#b5361c","#a3a8ad","#e8d9a8"];
var CL={
 "Jogger":{c:["#e0405a","#3fa3a3","#f2c14a"],p:"#2e3a59",a:[[2,3,8,1,"#e8e0cc"]]},
 "Commuter":{c:["#6f93c7","#8a8f98","#4a7fbf"],p:"#33353a",a:[[5,10,2,4,"#c0392b"],[10,14,4,3,"#6a4a2a"]]},
 "Office crowd":{c:["#e8e0cc","#9fc4d8","#d9d2f0"],p:"#2e3a59",a:[[4,10,1,2,"#4a7fbf"],[7,10,1,2,"#4a7fbf"],[5,12,2,2,"#ffffff"]]},
 "Tourist":{c:["#f08a2a","#3fa3a3","#e0405a"],p:"#d9c9a0",a:[[3,-1,6,3,"#e8d9a8"],[1,2,10,1,"#e8d9a8"],[8,12,3,2,"#2a2a33"]]},
 "Regular":{c:["#8a5a3a","#5a6a4a","#7a7f88"],p:"#4a3a2a",a:[[2,1,8,2,"#4a7fbf"],[1,3,10,1,"#2a1a14"],[4,8,4,1,"#6b3f1f"]]},
 "Couple":{c:["#d97fa0","#8a5fb5","#c75a4a"],p:"#3c4f3a",a:[[1,12,2,2,"#e0405a"]]},
 "Business traveler":{c:["#2f3340","#3a3f50"],p:"#22242b",a:[[5,10,2,4,"#b8402a"],[10,14,4,4,"#3a3a44"]]},
 "Party crowd":{c:["#e0405a","#f2c14a","#8a5fb5","#3fa3a3"],p:"#2e3a59",a:[[5,-3,2,1,"#e0405a"],[4,-2,4,1,"#f2c14a"],[3,-1,6,1,"#e0405a"]]},
 "Night owl":{c:["#2a2f3a","#3a2f4a"],p:"#22242b",a:[[3,6,6,1,"#111111"]]},
 "Food critic":{c:["#e8e0cc","#4a3a2a"],p:"#33353a",a:[[2,0,8,2,"#7a1f2b"],[5,-1,2,1,"#7a1f2b"],[2,6,3,1,"#222222"],[7,6,3,1,"#222222"],[10,12,3,3,"#f6e7c1"]]}
};
var SHORTN={"Business traveler":"Traveler","Office crowd":"Office","Party crowd":"Party","Food critic":"Critic"};
function custLook(o){
  var t=CL[o.who]||CL.Commuter,n=o.id*3.7,acc=t.a.slice();
  if(o.cls>=2)acc.push([4,10,4,1,"#f2c14a"]);
  if(o.cls>=3)acc.push([3,-3,6,3,"#2a2a33"],[1,0,10,1,"#2a2a33"]);
  return {pal:{K:"#2a1a14",E:"#1f1410",H:sp(HAIR,n+1),S:sp(SKIN,n+2),C:sp(t.c,n+3),P:t.p,B:"#3a2a20"},acc:acc};
}
var RL={
 apprentice:{c:"#7ab86a",a:[[4,11,4,4,"#f4f1ea"]]},
 bartender:{c:"#2f3a4a",a:[[4,11,4,4,"#f4f1ea"],[5,10,2,1,"#b8402a"]]},
 head:{c:"#7a2f3a",a:[[4,11,4,4,"#2a2a33"]]},
 mixologist:{c:"#5a3f8a",a:[[5,10,2,1,"#f2c14a"],[4,11,4,4,"#2a2a33"]]},
 manager:{c:"#1f2f5a",a:[[5,10,2,4,"#f2c14a"]]},
 ambassador:{c:"#e8e0cc",a:[[3,10,6,1,"#f2c14a"],[2,0,8,1,"#f2c14a"]]},
 cashier:{c:"#3fa3a3",a:[[8,11,2,1,"#ffffff"]]},
 clerk:{c:"#c98a34",a:[[9,12,5,4,"#a8743a"]]},
 prepchef:{c:"#f4f1ea",a:[[3,-4,6,4,"#ffffff"],[2,-1,8,1,"#ffffff"]]},
 controller:{c:"#4a5058",a:[[3,6,3,1,"#222222"],[6,6,3,1,"#222222"],[9,12,3,4,"#d9c9a0"]]},
 security:{c:"#22252b",a:[[2,1,8,2,"#22252b"],[1,3,10,1,"#111111"],[4,11,4,2,"#f2c14a"]]}
};
function staffLook(e){
  var r=RL[e.role]||RL.apprentice,n=(e.id||1)*5.3;
  return {pal:{K:"#2a1a14",E:"#1f1410",H:sp(HAIR,n+1),S:sp(SKIN,n+2),C:r.c,P:"#2a2a33",B:"#3a2a20"},acc:r.a};
}
var YOU={pal:{K:"#2a1a14",E:"#1f1410",H:"#5a3a1e",S:"#e2b184",C:"#4a7fbf",P:"#2a2a33",B:"#3a2a20"},acc:[[4,11,4,4,"#2f5d3a"]]};
var JOE={pal:{K:"#2a1a14",E:"#1f1410",H:"#a3a8ad",S:"#e2b184",C:"#f3efe4",P:"#2a2a33",B:"#3a2a20"},acc:[[4,7,4,1,"#9aa0a6"],[4,11,4,4,"#2f5d3a"],[5,10,2,1,"#b8402a"]]};
function drawPerson(c,p,x,y,f,dy,shadow){
  var ox=Math.round(x-6),oy=Math.round(y-18+(dy||0));
  if(shadow){c.fillStyle="rgba(0,0,0,.2)";c.fillRect(Math.round(x-5),Math.round(y-1),10,2)}
  spr(c,f?PERSON_B:PERSON,ox,oy,p.pal);
  if(p.acc)rects(c,p.acc,ox,oy);
}

