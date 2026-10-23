/* ---------- toast and overlay ---------- */
var tt;
function showToast(m){var t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){t.classList.remove("on")},3000)}
function showOv(card){var o=$("#ov");clear(o);o.appendChild(card);o.classList.add("on")}
function hideOv(){$("#ov").classList.remove("on")}
var tab="stock";
onEv("toast",showToast);
onEv("unlock",function(nw){
  toast((nw.length>1?"New drinks: ":"New drink: ")+nw.slice(0,3).map(function(r){return r.n}).join(", ")+(nw.length>3?"…":""));
  if(tab!=="book")S.newRec=true;
});
onEv("hired",function(e){ref.ed.sel=e.id;hideOv()});
onEv("fired",function(e){if(ref.ed&&ref.ed.sel===e.id)ref.ed.sel=0});
