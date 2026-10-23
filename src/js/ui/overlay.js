/* ---------- toast and overlay ---------- */
var tt;
function showToast(m){var t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){t.classList.remove("on")},3000)}
/* the overlay is a modal dialog: focus moves in, Tab stays in, Escape presses the card's close button
   (one with data-close, or one whose onclick is hideOv), and focus goes back to what opened it */
var ovFrom=null;
function focusables(root){return [].slice.call(root.querySelectorAll("button,input,select,textarea,a[href],[tabindex]")).filter(function(e){return !e.disabled&&e.tabIndex>=0&&e.offsetParent!==null})}
function showOv(card){
  var o=$("#ov");
  if(!o.classList.contains("on"))ovFrom=document.activeElement;
  clear(o);o.appendChild(card);o.classList.add("on");
  o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");
  var t=card.querySelector("h2");if(t){t.id="ovt";o.setAttribute("aria-labelledby","ovt")}else o.removeAttribute("aria-labelledby");
  card.setAttribute("tabindex","-1");card.focus();
}
function hideOv(){
  $("#ov").classList.remove("on");
  if(ovFrom&&document.contains(ovFrom)&&ovFrom.focus)ovFrom.focus();
  ovFrom=null;
}
document.addEventListener("keydown",function(e){
  var o=$("#ov");if(!o.classList.contains("on"))return;
  if(e.key==="Escape"){
    var c=o.querySelector("[data-close]")||[].slice.call(o.querySelectorAll("button")).filter(function(b){return b.onclick===hideOv})[0];
    if(c){e.preventDefault();c.click()}
  }else if(e.key==="Tab"){
    var f=focusables(o),i=f.indexOf(document.activeElement);
    if(!f.length){e.preventDefault();return}
    if(i<0){e.preventDefault();f[e.shiftKey?f.length-1:0].focus()}
    else if(e.shiftKey&&i===0){e.preventDefault();f[f.length-1].focus()}
    else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}
  }
});
var tab="stock";
onEv("toast",showToast);
onEv("unlock",function(nw){
  toast((nw.length>1?"New drinks: ":"New drink: ")+nw.slice(0,3).map(function(r){return r.n}).join(", ")+(nw.length>3?"…":""));
  if(tab!=="book")S.newRec=true;
});
onEv("hired",function(e){ref.ed.sel=e.id;hideOv()});
onEv("fired",function(e){if(ref.ed&&ref.ed.sel===e.id)ref.ed.sel=0});
