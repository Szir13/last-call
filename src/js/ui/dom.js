/* ---------- DOM helpers ---------- */
function $(s){return document.querySelector(s)}
function h(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
function setT(e,t){if(e._t!==t){e._t=t;e.textContent=t}}
function setC(e,c){if(e._c!==c){e._c=c;e.className=c}}
