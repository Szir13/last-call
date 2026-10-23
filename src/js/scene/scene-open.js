/* ---------- pixel scene: a window onto the same orders, team and clock ---------- */
(function(){
"use strict";
var PW=160,PH=140,PK="last-call-pixel-v1";
var cv=document.getElementById("pxcv"),g=cv.getContext("2d"),ov=document.getElementById("pxov"),stg=document.getElementById("pxstage");
var Z=2.2,tt=0,lastF=performance.now(),statT=0,WK=[1];
var SLOTX=[28,56,84,112,140,42,70,98,126,154,28,56,84,112,140],SLOTY=[132,132,132,132,132,108,108,108,108,108,84,84,84,84,84],DOOR={x:12,y:66},STAFFX=[64,82,100,118,136];

