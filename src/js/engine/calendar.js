/* ---------- calendar engine ---------- */
function pad2(n){return n<10?"0"+n:String(n)}
function gDay(){return Math.floor(S.gt/1440)}
function gHour(){return (S.gt%1440)/60}
function dateOf(d){var y=Math.floor(d/336),r=d%336;return{year:y+1,m:Math.floor(r/28),d:r%28+1,wd:d%7}}
function dstr(d){var t=dateOf(d);return DAYN[t.wd]+" "+t.d+" "+MONN[t.m]}
function hstr(h){var hh=Math.floor(h),mm=Math.floor((h-hh)*60);return pad2(hh)+":"+pad2(mm)}
function spanOf(o,c){return c>o?c-o:(c===o?0:24-o+c)}
function periodOf(h){h=Math.floor(h);return h>=6&&h<10?0:h>=10&&h<15?1:h>=15&&h<18?2:h>=18&&h<22?3:(h>=22||h<2)?4:5}
function isOpenAt(day,h){
  var w=day%7,hr=S.hours[w],o=hr[0],c=hr[1];
  if(o<c&&h>=o&&h<c)return true;
  if(o>c&&h>=o)return true;
  var pw=(w+6)%7,ph=S.hours[pw];
  return ph[0]>ph[1]&&h<ph[1];
}
function isOpenNow(){return isOpenAt(gDay(),gHour())}
