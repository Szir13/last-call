/* ---------- saving: only the app touches localStorage; the engine asks with emit("save") ---------- */
var KEY="last-call-orders-v5";
function load(){
  var raw=null;
  try{var r=localStorage.getItem(KEY);if(r)raw=JSON.parse(r)}catch(e){}
  if(raw)fromSave(raw);else migrate();
}
function save(){S.last=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
onEv("save",save);
