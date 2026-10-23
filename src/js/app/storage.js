/* ---------- saving: only the app touches localStorage; the engine asks with emit("save") ---------- */
var KEY="last-call-orders-v5";
function load(){
  try{var r=localStorage.getItem(KEY);if(r){S=Object.assign(def(),JSON.parse(r))}}catch(e){}
  migrate();
}
function save(){S.last=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
onEv("save",save);
