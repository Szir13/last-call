/* ================= pixel UI layer: icons, cards, tabs, dashboard, reactions ================= */
SP.fruit=["..KKK..",".KLLLK.","KLWLLLK","KLLLLLK","KLLLLLK",".KLLLK.","..KKK.."];
SP.leaf=["...K...","..KLK..",".KLLLK.","KLLWLLK",".KLLLK.","..KLK..","...K..."];
SP.cube=["KKKKKK","KLLLLK","KLWWLK","KLWWLK","KLLLLK","KKKKKK"];
SP.card=["KKKKKKK","KLLLLLK","KLKKKLK","KLLLLLK","KLKKKLK","KLLLLLK","KKKKKKK"];
var RAWC={lemon:"#f3e46a",lime:"#74c443",orange:"#f5a02a",sugar:"#fbfbf7"};
var CANI=["soda","tonic","cola","gingerbeer","cranberry","pineapple","coconut","orangejuice","lemonjuice","limejuice"];
function ingKind(id){
  if(id==="beer"||id==="coffee")return "mug";
  if(id==="wine")return "wine";
  if(id==="mint"||id==="cucumber")return "leaf";
  if(id==="lemon"||id==="lime"||id==="orange")return "fruit";
  if(id==="sugar")return "cube";
  if(CANI.indexOf(id)>=0)return "can";
  return "bottle";
}
function pxCv(c,w,hh,sc){c.style.width=(w*sc)+"px";c.style.height=(hh*sc)+"px";return c}
function ingIconEl(id){
  var sh=SP[ingKind(id)],c=mk(sh[0].length,sh.length);
  spr(c.getContext("2d"),sh,0,0,{K:"#2a1a14",W:"#ffffff",L:COL[id]||RAWC[id]||"#e8e0cc",T:"#efe6d2"});
  return pxCv(c,sh[0].length,sh.length,3);
}
function icoBox(inner){var b=el("div","pxic");b.appendChild(inner);return b}
function roleIcon(role,seed){
  var c=mk(12,18);drawPerson(c.getContext("2d"),staffLook({role:role,id:seed||1}),6,18,0,0,false);return pxCv(c,12,18,2);
}
function faceEl(mood,sc){
  var c=mk(9,9),a=c.getContext("2d"),base=["..KKKKK..",".KLLLLLK.","KLLLLLLLK","KLLLLLLLK","KLLLLLLLK","KLLLLLLLK","KLLLLLLLK",".KLLLLLK.","..KKKKK.."];
  spr(a,base,0,0,{K:"#2a1a14",L:mood>=60?"#f2c14a":mood>=35?"#e0c070":"#d98a6a"});
  a.fillStyle="#2a1a14";a.fillRect(2,3,1,2);a.fillRect(6,3,1,2);
  if(mood>=60){a.fillRect(2,5,1,1);a.fillRect(3,6,3,1);a.fillRect(6,5,1,1)}
  else if(mood>=35){a.fillRect(3,6,3,1)}
  else{a.fillRect(2,6,1,1);a.fillRect(3,5,3,1);a.fillRect(6,6,1,1)}
  return pxCv(c,9,9,sc||3);
}

