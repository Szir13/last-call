/* ---------- calendar ----------
   12 months of 28 days (every month starts on a Monday). One game hour lasts 60 s while the bar is open and 5 s while it is closed. */
var MAXOPEN=16;
var DAYN=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
var MONN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var PERN=["morning","lunch","afternoon","evening","night","late night"];
var PERL=["06–10","10–15","15–18","18–22","22–02","02–06"];
/* how busy each hour of the day is, and each day of the week */
var HDEM=[1.0,0.8,0.4,0.15,0.1,0.1,0.2,0.4,0.5,0.5,0.6,0.8,1.1,1.1,0.8,0.7,0.8,1.0,1.3,1.5,1.6,1.6,1.4,1.2];
var WDAY=[0.8,0.9,0.95,1.1,1.3,1.5,1.0];
/* fx: dem = all customers, per = part of day, type = customer type, fam = drink family. mk = ingredient prices. */
var HOLIDAYS=[
 {id:"newyear",n:"New Year’s Day",m:0,d:1,len:1,fx:{dem:0.8,per:{0:0.4},fam:{Soft:2}}},
 {id:"valentine",n:"Valentine’s Day",m:1,d:14,len:1,fx:{per:{3:2,4:1.5},type:{Couple:4},fam:{Classic:1.5,Sour:1.4}},mk:{h:"prosecco and liqueurs cost more",ids:LIQUEURS,f:1.25}},
 {id:"spring",n:"Spring Festival",m:2,d:20,len:2,fx:{dem:1.2,type:{Tourist:1.6}}},
 {id:"break",n:"Spring break",m:3,d:10,len:7,fx:{dem:1.1,type:{Tourist:2}},mk:{h:"citrus costs more",ids:["lemon","lime"],f:1.2}},
 {id:"labor",n:"Labor Day",m:4,d:1,len:1,fx:{dem:1.1,per:{1:1.2,2:1.6}}},
 {id:"midsummer",n:"Midsummer Night",m:5,d:21,len:1,fx:{per:{3:1.4,4:2.5},type:{"Party crowd":3}},mk:{h:"spirits cost more",ids:SPIRITS,f:1.25}},
 {id:"beach",n:"Beach season",m:6,d:1,len:56,fx:{type:{Tourist:1.5},fam:{Tropical:1.5,Soft:1.3}}},
 {id:"harvest",n:"Harvest Festival",m:8,d:14,len:3,fx:{per:{3:1.3},fam:{Classic:1.3}},mk:{h:"liqueurs and wine are on sale",ids:LIQUEURS,f:0.8}},
 {id:"costume",n:"Costume Night",m:9,d:28,len:1,fx:{per:{4:3,5:2},type:{"Party crowd":3},fam:{Party:1.5}},mk:{h:"spirits cost more",ids:SPIRITS,f:1.2}},
 {id:"eve",n:"Holiday Eve",m:11,d:24,len:1,fx:{per:{3:1.5},type:{Couple:2,Regular:1.5}}},
 {id:"hday",n:"Holiday Day",m:11,d:25,len:1,fx:{dem:0.4}},
 {id:"yearend",n:"Year’s End Party",m:11,d:28,len:1,fx:{per:{3:2,4:4,5:3},type:{"Party crowd":4}},mk:{h:"prosecco and spirits cost more",ids:LIQUEURS.concat(SPIRITS),f:1.35}}
];
/* random events: each can start on any day that fits wd (weekdays, 0 = Monday) */
var RANDOM=[
 {id:"match",n:"Big match night",len:1,wd:[2,5,6],fx:{per:{3:1.6,4:1.8},fam:{Refreshing:1.4,Party:1.4}}},
 {id:"fest",n:"Music festival",len:3,wd:[4],fx:{dem:1.2,per:{4:2,5:1.8},type:{"Party crowd":2.5}},mk:{h:"mixers cost more",ids:MIXERS,f:1.3}},
 {id:"conf",n:"Conference in town",len:3,wd:[0,1,2],fx:{type:{"Business traveler":3,"Office crowd":1.5},fam:{Classic:1.5}}},
 {id:"marathon",n:"City marathon",len:1,wd:[6],fx:{per:{0:3},type:{Jogger:3},fam:{Soft:2}},mk:{h:"citrus costs more",ids:["lemon","lime"],f:1.3}},
 {id:"heat",n:"Heatwave",len:3,p:0.4,fx:{dem:1.2,fam:{Soft:2,Refreshing:1.6}},mk:{h:"mixers and citrus cost more",ids:MIXERS.concat(["lemon","lime"]),f:1.3}},
 {id:"rain",n:"Rainy spell",len:3,p:0.4,fx:{dem:0.75,type:{Tourist:0.5}}},
 {id:"fair",n:"Trade fair",len:2,wd:[1,2,3],fx:{dem:1.1,type:{"Business traveler":2,"Office crowd":1.5}}},
 {id:"winefair",n:"Wine fair",len:2,fx:{fam:{Classic:1.4,Refreshing:1.2}},mk:{h:"prosecco and liqueurs are on sale",ids:LIQUEURS,f:0.75}}
];

var FR_CAP=[30,50,80,120];

