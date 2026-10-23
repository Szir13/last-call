/* ---------- toast and overlay ---------- */
var tt;
function toast(m){var t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){t.classList.remove("on")},3000)}
function showOv(card){var o=$("#ov");o.innerHTML="";o.appendChild(card);o.classList.add("on")}
function hideOv(){$("#ov").classList.remove("on")}
var tab="stock";
function checkUnlocks(){
  var nw=ITEMS.filter(function(r){return unlocked(r)&&S.known.indexOf(r.id)<0});
  if(!nw.length)return;
  nw.forEach(function(r){S.known.push(r.id);if(S.act[r.id]===undefined)S.act[r.id]=stagedPrice(r)});
  if(S.kits){
    toast((nw.length>1?"New drinks: ":"New drink: ")+nw.slice(0,3).map(function(r){return r.n}).join(", ")+(nw.length>3?"…":""));
    if(tab!=="book")S.newRec=true;
  }
}


