/* ---------- skill trees ----------
   upg:   unlocks, paid with money, bought once. Roles are unlocked here, then hired in the Team tab.
   train: staff training, paid with money, 3 levels
   perm:  reputation perks, paid with perk points, 1 point per reputation level */
/** @type {TreeNode[]} */
var UT=[
 {id:"apprentice",n:"Apprentices",d:"Lets you hire apprentice bartenders in the Team tab.",cost:[100],col:0,row:0},
 {id:"bartender",n:"Bartenders",d:"Lets you hire bartenders in the Team tab.",cost:[500],req:["apprentice"],col:0,row:1},
 {id:"head",n:"Head bartenders",d:"Lets you hire head bartenders in the Team tab.",cost:[2500],req:["bartender"],col:0,row:2},
 {id:"mixologist",n:"Mixologists",d:"Lets you hire mixologists in the Team tab.",cost:[12000],req:["head"],col:0,row:3},
 {id:"manager",n:"Bar managers",d:"Lets you hire bar managers in the Team tab.",cost:[50000],req:["mixologist"],col:0,row:4},
 {id:"ambassador",n:"Ambassadors",d:"Lets you hire brand ambassadors in the Team tab.",cost:[200000],req:["manager"],col:0,row:5},

 {id:"cashier",n:"Cashiers",d:"Lets you hire cashiers. Each cashier collects the finished orders of one counter slot.",cost:[100],col:1,row:0},
 {id:"counter4",n:"Extra seats",d:"More customers can wait at once. The bigger the venue, the more seats this adds.",cost:[1200],req:["cashier"],col:1,row:1},
 {id:"counter5",n:"More seats",d:"More customers can wait at once. The bigger the venue, the more seats this adds.",cost:[9000],req:["counter4"],col:1,row:2},
 {id:"table",n:"Table service",d:"Orders can include one extra drink.",cost:[45000],req:["counter5"],col:1,row:3},

 {id:"clerk",n:"Stock clerks",d:"Lets you hire stock clerks. Each starts with one ingredient and can be upgraded to watch up to 3.",cost:[150],col:2,row:0},
 {id:"fridge1",n:"Fridge I",d:"Shelf capacity 30 → 50 per item.",cost:[500],req:["clerk"],col:2,row:1},
 {id:"kitchen",n:"Prep kitchen",d:"Lets you hire a prep chef. The chef buys fresh produce in bulk at a discount, makes syrup and juices and keeps them stocked. Prepared items spoil after a few days.",cost:[1500],req:["fridge1"],col:2,row:2},
 {id:"controller",n:"Cost control",d:"Lets you hire a cost controller who tracks the market, reprices your drinks overnight and tells clerks how much stock to hold.",cost:[6000],req:["kitchen"],col:2,row:3},
 {id:"fridge2",n:"Fridge II",d:"Shelf capacity 50 → 80 per item.",cost:[4000],req:["controller"],col:2,row:4},
 {id:"fridge3",n:"Fridge III",d:"Shelf capacity 80 → 120 per item.",cost:[30000],req:["fridge2"],col:2,row:5},

 {id:"seats",n:"Comfy seating",d:"Customers wait 50% longer.",cost:[2000],col:3,row:0},
 {id:"glass",n:"Better glassware",d:"Drinks are worth 20% more, so their fair price rises.",cost:[3500],req:["seats"],col:3,row:1},
 {id:"music",n:"Ambient music",d:"Speed tips are twice as big.",cost:[12000],req:["glass"],col:3,row:2},
 {id:"lights",n:"Mood lighting",d:"Customers arrive 25% faster.",cost:[35000],req:["music"],col:3,row:3},
 {id:"security",n:"Security team",d:"Lets you hire security guards. They calm rowdy guests before they cause trouble.",cost:[6000],req:["glass"],col:3,row:4}
];
function trainPerk(role){
  var t="";
  for(var k in TIERS){if(TIERS[k].staff===role)t+=" Each level also earns "+TIERS[k].per+" ingredient picks."}
  ING.forEach(function(i){if(i.gs===role&&!TIERS[i.g])t+=" Level "+i.gn+" opens "+i.n+"."});
  return t;
}
var TT_POS=[[0,0],[1,0],[2,0],[2,1],[1,1],[0,1]];
/** @type {TreeNode[]} */
var TT=STAFF.map(function(s,i){
  return{id:"t_"+s.id,role:s.id,n:"Train "+s.pl,d:"Doubles the working speed of every "+s.n.toLowerCase()+", per level. Costs "+TRAIN_COST.map(function(m){return Math.round(m*s.w).toLocaleString("en-US")}).join(", ")+" dollars per level."+trainPerk(s.id),
    col:TT_POS[i][0],row:TT_POS[i][1],req:i?["t_"+STAFF[i-1].id]:[]};
});
/** @type {TreeNode[]} */
var PT=[
 {id:"press",n:"Press coverage",d:"Customers arrive 8% faster, per level.",max:4,cost:[1,1,2,2],col:0,row:0},
 {id:"vip",n:"VIP list",d:"Richer customers walk in more often, per level.",max:3,cost:[1,2,3],req:["press"],col:0,row:1},
 {id:"awards",n:"Awards",d:"Customers accept prices 8% higher, per level.",max:3,cost:[2,3,4],req:["vip"],col:0,row:2},
 {id:"critics",n:"Critics’ darling",d:"Food critics visit twice as often.",max:1,cost:[3],req:["awards"],col:0,row:3},

 {id:"speed",n:"Faster service",d:"+25% working speed for everyone, per level.",max:5,cost:[1,1,2,3,4],col:1,row:0},
 {id:"patience",n:"Patient customers",d:"Customers wait 20% longer, per level.",max:3,cost:[1,2,3],req:["speed"],col:1,row:1},
 {id:"tips",n:"Generous tips",d:"Speed tips are 25% bigger, per level.",max:3,cost:[1,2,3],req:["patience"],col:1,row:2},
 {id:"hhour",n:"Happy hour mastery",d:"Happy hour lasts 50% longer, per level.",max:3,cost:[2,3,4],req:["tips"],col:1,row:3},

 {id:"disc",n:"Friendly supplier",d:"Stock is 6% cheaper, per level.",max:4,cost:[1,2,3,4],col:2,row:0},
 {id:"wage",n:"Staff loyalty",d:"Wages are 5% lower, per level.",max:3,cost:[2,3,4],req:["disc"],col:2,row:1},
 {id:"expand",n:"Expansion discount",d:"Expansions cost 15% less, per level.",max:3,cost:[2,3,4],req:["wage"],col:2,row:2},
 {id:"offline",n:"Night shift",d:"+2 h of offline work, per level.",max:4,cost:[1,2,3,4],req:["expand"],col:2,row:3}
];
var NODEMAP={};
UT.forEach(function(n){n.kind="upg";NODEMAP[n.id]=n});
TT.forEach(function(n){n.kind="train";NODEMAP[n.id]=n});
PT.forEach(function(n){n.kind="perm";NODEMAP[n.id]=n});

/* achievements give reputation once */
var ACH=[
 {id:"o100",n:"Serve your first 100 orders",r:10,ok:function(){return S.served>=100}},
 {id:"cocktail",n:"Put a real cocktail on the menu",r:10,ok:function(){return mi().list.some(function(i){return !i.solo&&i.f!=="Soft"})}},
 {id:"menu10",n:"Ten drinks on the menu",r:15,ok:function(){return mi().list.length>=10}},
 {id:"team5",n:"Build a team of five",r:10,ok:function(){return teamSize()>=5}},
 {id:"happy",n:"Reach 85% customer satisfaction",r:15,ok:function(){return S.sat>=85}},
 {id:"black",n:"Finish a month in profit",r:30,ok:function(){return !!S.lastMonth&&S.lastMonth.profit>0}},
 {id:"kitchen",n:"Hire a prep chef",r:10,ok:function(){return (S.staff.prepchef||0)>0}},
 {id:"premium",n:"Sell a premium drink",r:15,ok:function(){return S.sold.p}},
 {id:"ultra",n:"Sell an ultra premium drink",r:30,ok:function(){return S.sold.u}},
 {id:"exp1",n:"Expand to a neighborhood bar",r:20,ok:function(){return S.exp>=1}},
 {id:"clean",n:"A month with less than $20 of spoiled stock",r:15,ok:function(){return !!S.lastMonth&&S.lastMonth.waste<20&&S.lastMonth.rev>0}},
 {id:"debt",n:"Pay off a debt",r:10,ok:function(){return S.paidDebt}},
 {id:"o1000",n:"Serve 1,000 orders",r:30,ok:function(){return S.served>=1000}},
 {id:"exp4",n:"Become a global chain",r:100,ok:function(){return S.exp>=4}}
];
var REPN=["Unknown","Known locally","Neighborhood favorite","Local star","City hotspot","Destination bar","Famous","Legendary"];

