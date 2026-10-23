/* workers: sp = how fast one person works (you work the counter yourself at speed 1). w = monthly wage. */
var STAFF=[
 {id:"apprentice",n:"Apprentice bartender",pl:"apprentices",w:1000,sp:0.5,d:"Slow, but learning fast."},
 {id:"bartender",n:"Bartender",pl:"bartenders",w:1800,sp:1,d:"Knows the drill."},
 {id:"head",n:"Head bartender",pl:"head bartenders",w:2800,sp:2,d:"Keeps the bar running."},
 {id:"mixologist",n:"Mixologist",pl:"mixologists",w:3800,sp:4,d:"Every glass is a small show."},
 {id:"manager",n:"Bar manager",pl:"bar managers",w:4800,sp:8,d:"Works the floor and the counter."},
 {id:"ambassador",n:"Brand ambassador",pl:"brand ambassadors",w:6500,sp:16,d:"Your bar, in every city."}
];
var SUPPORT=[
 {id:"cashier",n:"Cashier",pl:"cashiers",w:1000,g:1.35,d:"Collects finished orders for one counter slot."},
 {id:"clerk",n:"Stock clerk",pl:"clerks",w:1000,g:1.35,d:"Keeps ingredients stocked. Starts with one and can be upgraded to watch up to 3."},
 {id:"prepchef",n:"Prep chef",pl:"prep chefs",w:2400,g:1.5,d:"Buys fresh produce in bulk and prepares syrup and juices. Prepared items spoil after a few days."},
 {id:"controller",n:"Cost controller",pl:"cost controllers",w:3500,g:1,d:"Watches the market. Reprices your drinks overnight and tells clerks how much stock to hold."},
 {id:"security",n:"Security guard",pl:"security guards",w:2200,g:1.4,d:"Calms rowdy guests before they cause trouble, so you do not have to."}
];
var ROLES=STAFF.concat(SUPPORT);
var STAFFM={};ROLES.forEach(function(s){STAFFM[s.id]=s});
var TIERS={"1":{staff:"apprentice",base:0,per:2},"2":{staff:"bartender",base:3,per:3},"3":{staff:"head",base:2,per:1}};   /* base = picks for the first hire, per = picks for each training level */
var FREEP={"1":2};            /* founding picks, so the first cocktails do not need a payroll */
var GROWTH=1.17,HIRE=0.15;    /* a hire costs 15% of a month's wage, and a bit more each time */
var TRAIN_COST=[0.8,3,8];     /* training costs this many months of wage */
var CLERK_UP=[600,3000];

/* ---------- people ---------- */
var SKN=["Knowledge","Speed","Hospitality"];
var SSK={cashier:["Charm","Upselling"],clerk:["Negotiation","Care"],prepchef:["Yield","Pace"],controller:["Negotiation","Analysis"],security:["Composure","Awareness"]};
function skillNames(role){return SSK[role]||SKN}
var LVLN=["Junior","Mid-level","Senior"],LVLM=[1,1.25,1.6];
var LVLXP=[0,14,42];              /* days worked needed to reach mid-level and senior */
var PROMXP=70;                    /* days worked before a senior can move to the next role */
var LADDER=["apprentice","bartender","head","mixologist","manager","ambassador"];
var MAXLEN=10,MAXDAYS=6;          /* at most 10 hours a day, at least one day off */
var NAMES=["Ana","Bruno","Carla","Diego","Elena","Felix","Gina","Hugo","Iris","Jonas","Karen","Luca","Maya","Nico","Olga","Pablo","Rita","Sam","Tina","Uri","Vera","Wes","Yara","Zane","Ada","Ben","Cleo","Dan","Eva","Finn"];
var OWN=[2,3,3];                  /* your own skills at the counter */

/* int = seconds between customers, k = max drinks per order. rent and util are monthly. */
var EXPS=[
 {n:"Lemonade stand",c:0,int:9.6,k:1,rent:900,util:150},
 {n:"Neighborhood bar",c:10000,int:7.8,k:2,rent:17000,util:2700},
 {n:"Hotel bar",c:75000,int:6.9,k:3,rent:71000,util:12000},
 {n:"Rooftop bar",c:260000,int:5.9,k:3,rent:150000,util:26000},
 {n:"Global chain",c:780000,int:4.5,k:3,rent:232000,util:38000}
];
/* team size limit and wage level for each venue: past these sizes an extra person earns less than the wage */
var STAFFCAP=[2,5,8,12,18];
var WAGEK=[1,1.3,1.8,2.5,2.8];
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


