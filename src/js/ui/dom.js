/* ---------- DOM helpers ---------- */
function $(s){return document.querySelector(s)}
/* el(tag, cls, content): content is text (always set as text, never parsed as HTML)
   or an array of nodes and strings, for rich lines such as ["Points: ",el("b",null,n)] */
function el(tag,cls,x){
  var e=document.createElement(tag);if(cls)e.className=cls;
  if(Array.isArray(x))x.forEach(function(c){e.appendChild(typeof c==="object"?c:document.createTextNode(String(c)))});
  else if(x!=null)e.textContent=x;
  return e;
}
function clear(e){while(e.firstChild)e.removeChild(e.firstChild)}
function setT(e,t){if(e._t!==t){e._t=t;e.textContent=t}}
function setC(e,c){if(e._c!==c){e._c=c;e.className=c}}
