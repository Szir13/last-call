/* workers: sp = how fast one person works (you work the counter yourself at speed 1). w = monthly wage (data/balance.js). */
var STAFF=[
 {id:"apprentice",n:"Apprentice bartender",pl:"apprentices",w:WAGE.apprentice,sp:0.5,d:"Slow, but learning fast."},
 {id:"bartender",n:"Bartender",pl:"bartenders",w:WAGE.bartender,sp:1,d:"Knows the drill."},
 {id:"head",n:"Head bartender",pl:"head bartenders",w:WAGE.head,sp:2,d:"Keeps the bar running."},
 {id:"mixologist",n:"Mixologist",pl:"mixologists",w:WAGE.mixologist,sp:4,d:"Every glass is a small show."},
 {id:"manager",n:"Bar manager",pl:"bar managers",w:WAGE.manager,sp:8,d:"Works the floor and the counter."},
 {id:"ambassador",n:"Brand ambassador",pl:"brand ambassadors",w:WAGE.ambassador,sp:16,d:"Your bar, in every city."}
];
var SUPPORT=[
 {id:"cashier",n:"Cashier",pl:"cashiers",w:WAGE.cashier,g:1.35,d:"Collects finished orders for one counter slot."},
 {id:"clerk",n:"Stock clerk",pl:"clerks",w:WAGE.clerk,g:1.35,d:"Keeps ingredients stocked. Starts with one and can be upgraded to watch up to 3."},
 {id:"prepchef",n:"Prep chef",pl:"prep chefs",w:WAGE.prepchef,g:1.5,d:"Buys fresh produce in bulk and prepares syrup and juices. Prepared items spoil after a few days."},
 {id:"controller",n:"Cost controller",pl:"cost controllers",w:WAGE.controller,g:1,d:"Watches the market. Reprices your drinks overnight and tells clerks how much stock to hold."},
 {id:"security",n:"Security guard",pl:"security guards",w:WAGE.security,g:1.4,d:"Calms rowdy guests before they cause trouble, so you do not have to."}
];
var ROLES=STAFF.concat(SUPPORT);
var STAFFM={};ROLES.forEach(function(s){STAFFM[s.id]=s});

/* ---------- people ---------- */
var SKN=["Knowledge","Speed","Hospitality"];
var SSK={cashier:["Charm","Upselling"],clerk:["Negotiation","Care"],prepchef:["Yield","Pace"],controller:["Negotiation","Analysis"],security:["Composure","Awareness"]};
function skillNames(role){return SSK[role]||SKN}
var LVLN=["Junior","Mid-level","Senior"];
var LADDER=["apprentice","bartender","head","mixologist","manager","ambassador"];
var NAMES=["Ana","Bruno","Carla","Diego","Elena","Felix","Gina","Hugo","Iris","Jonas","Karen","Luca","Maya","Nico","Olga","Pablo","Rita","Sam","Tina","Uri","Vera","Wes","Yara","Zane","Ada","Ben","Cleo","Dan","Eva","Finn"];

function staffCap(){return STAFFCAP[S.exp]||STAFFCAP[0]}
function wk(){return (WAGEK[S.exp]||1)*(1-0.04*legLvl("crew"))}

/* w = how likely each customer type is in each part of the day:
   [morning 6-10, lunch 10-15, afternoon 15-18, evening 18-22, night 22-2, late 2-6].
   wb = how well off they are (0-3). pref = tastes. m = tipping. bi = extra drinks per order. */
var CUST=[
 {n:"Jogger",pat:50,m:0.8,wb:0.3,w:[40,5,5,0,0,0],pref:{Soft:4}},
 {n:"Commuter",pat:35,m:0.9,wb:0.6,w:[35,10,15,5,0,0],pref:{Soft:2,Refreshing:1.3,Beer:1.2}},
 {n:"Office crowd",pat:40,m:1,wb:1,w:[5,45,10,25,0,0],pref:{Refreshing:1.5,Soft:1.5,Beer:1.4,Wine:1.2}},
 {n:"Tourist",pat:60,m:1,wb:1,w:[10,30,40,20,5,0],pref:{Tropical:1.5,Refreshing:1.2,Beer:1.5}},
 {n:"Regular",pat:75,m:1.1,wb:1,w:[5,10,25,25,10,5],pref:{Beer:1.5,Neat:1.2}},
 {n:"Couple",pat:60,m:1.05,wb:1.3,w:[0,5,10,25,5,0],pref:{Classic:1.5,Sour:1.3,Wine:2}},
 {n:"Business traveler",pat:40,m:1.3,wb:2,w:[5,10,10,20,5,0],pref:{Classic:1.8,Neat:2,Wine:1.5}},
 {n:"Party crowd",pat:30,m:1.15,wb:1.2,w:[0,0,0,10,45,20],pref:{Party:2,Tropical:1.5,Neat:1.2,Beer:1.3},bi:1},
 {n:"Night owl",pat:45,m:1.25,wb:1.4,w:[0,0,0,0,15,50],pref:{Classic:1.5,Sour:1.2,Neat:1.8}},
 {n:"Food critic",pat:35,m:1.4,wb:2.2,w:[0,5,10,10,0,0],pref:{Wine:1.5,Neat:1.3}}
];


