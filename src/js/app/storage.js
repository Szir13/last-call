/* ---------- saving: only the app touches storage; the engine asks with emit("save") ----------
   Everything persistent goes through storeGet/storeSet. The backend is localStorage unless a native shell
   (Capacitor Preferences, a cloud save) sets window.lastCallStore = {get(k), set(k,v), remove(k)} before this
   script runs; get must answer at once, so an async store is read into memory first (docs/MOBILE.md). */
var KEY="last-call-orders-v5";
var STORE=window.lastCallStore||{
  get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},
  set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},
  remove:function(k){try{localStorage.removeItem(k)}catch(e){}}
};
function storeGet(k){try{return STORE.get(k)}catch(e){return null}}
function storeSet(k,v){try{STORE.set(k,v)}catch(e){}}
var saving=true;   /* off while another game is being loaded in its place */
function load(){
  var raw=null;
  try{var r=storeGet(KEY);if(r)raw=JSON.parse(r)}catch(e){}
  if(raw)fromSave(raw);else migrate();
}
function save(){if(!saving)return;S.last=Date.now();storeSet(KEY,JSON.stringify(S))}
onEv("save",save);
/* replace the game on this device with an imported one, then start again from it */
function replaceGame(d){
  saving=false;
  storeSet(KEY,JSON.stringify(d.state));
  if(d.prefs)storeSet(PREFS_KEY,JSON.stringify(d.prefs));
  location.reload();
}
var PREFS_KEY="last-call-pixel-v1";
function prefsText(){return storeGet(PREFS_KEY)}
