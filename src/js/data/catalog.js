/* ---------- data ---------- */
var SPIRITS=["gin","rum","vodka","cachaca","whiskey","tequila","pisco","cognac","mezcal"];
var LIQUEURS=["campari","vermouth","aperol","amaretto","triple","elderflower","chartreuse","prosecco","angostura"];
var MIXERS=["soda","tonic","cola","gingerbeer","orange","cranberry","pineapple","coconut","coffee"];
var TN=["Standard","Premium","Ultra premium"];

/* Ingredients. u = cost of one serving (an array for quality ingredients: standard, premium, ultra).
   c = one-time supplier fee. g = tier. Tiers 1-3 unlock with staff picks, tier 4 needs staff and reputation.
   pre = a prepared item the prep chef can make from a raw one. raw = fresh produce. sv = price of a neat serving. */
function QI(id,n,u0,v0,g,more){
  return Object.assign({id:id,n:n,q:1,u:[u0,Math.round(u0*2.2*100)/100,u0*5],sv:[v0,Math.round(v0*1.9*10)/10,v0*4],tn:TN,g:g},more||{});
}
var ING=[
 {id:"lemonjuice",n:"Lemon juice",u:0.45,g:"0",pre:{raw:"lemon",y:2,shelf:3}},
 {id:"syrup",n:"Simple syrup",u:0.3,c:20,g:"0",pre:{raw:"sugar",y:4,shelf:10}},
 {id:"soda",n:"Soda water",u:0.15,c:15,g:"0"},
 {id:"orangejuice",n:"Orange juice",u:0.4,c:30,g:"0",pre:{raw:"orange",y:2,shelf:3}},
 {id:"mint",n:"Mint",u:0.25,c:30,g:"0"},
 {id:"cranberry",n:"Cranberry juice",u:0.4,c:40,g:"0"},

 {id:"limejuice",n:"Lime juice",u:0.5,g:"1",pre:{raw:"lime",y:2,shelf:3}},
 {id:"tonic",n:"Tonic water",u:0.35,g:"1"},
 {id:"cola",n:"Cola",u:0.3,g:"1"},
 QI("gin","Gin",1.3,6,"1"),
 QI("rum","Rum",1.2,6,"1"),
 QI("vodka","Vodka",1.1,5.5,"1"),
 QI("cachaca","Cachaça",1.2,6,"1"),
 {id:"beer",n:"Beer",q:1,u:[1.2,2.2,4],sv:[5,7.5,11],tn:["Lager","Craft ale","Imported beer"],g:"1"},

 {id:"cucumber",n:"Cucumber",u:0.3,g:"2"},
 {id:"coffee",n:"Espresso",u:0.4,g:"2"},
 {id:"gingerbeer",n:"Ginger beer",u:0.5,g:"2"},
 {id:"pineapple",n:"Pineapple juice",u:0.45,g:"2"},
 {id:"coconut",n:"Coconut cream",u:0.7,g:"2"},
 {id:"angostura",n:"Angostura bitters",u:0.2,g:"2"},
 {id:"amaretto",n:"Amaretto",u:1.2,g:"2"},
 {id:"prosecco",n:"Prosecco",u:1.4,g:"2"},
 {id:"triple",n:"Triple sec",u:1,g:"2"},
 QI("tequila","Tequila",1.8,7,"2"),
 QI("whiskey","Whiskey",2,8,"2"),
 {id:"wine",n:"Wine",q:1,u:[1.8,3.5,8],sv:[7,12,22],tn:["House wine","Reserve wine","Grand cru"],g:"2"},

 QI("pisco","Pisco",2,7,"3"),
 QI("cognac","Cognac",3,11,"3"),
 {id:"vermouth",n:"Sweet vermouth",u:1,g:"3"},
 {id:"campari",n:"Campari",u:1.5,g:"3"},
 {id:"aperol",n:"Aperol",u:1.4,g:"3"},

 {id:"elderflower",n:"Elderflower liqueur",u:1.6,c:4000,g:"4",gs:"mixologist",gn:1,rep:3},
 QI("mezcal","Mezcal",2.8,10,"4",{c:8000,gs:"manager",gn:1,rep:5}),
 {id:"chartreuse",n:"Chartreuse",u:2.5,c:15000,g:"4",gs:"ambassador",gn:1,rep:7},

 {id:"sugar",n:"Sugar",u:0.1,g:"R",raw:true},
 {id:"lemon",n:"Lemons",u:0.22,g:"R",raw:true,shelf:7},
 {id:"lime",n:"Limes",u:0.28,g:"R",raw:true,shelf:7},
 {id:"orange",n:"Oranges",u:0.25,g:"R",raw:true,shelf:7}
];
var GROUPS=[["0","Basics"],["1","Unlocked by apprentices"],["2","Unlocked by bartenders"],["3","Unlocked by head bartenders"],["4","Rare: staff and reputation"],["R","Fresh produce"]];
var INGM={},SHELF={},RAWOF={};
ING.forEach(function(x){
  INGM[x.id]=x;
  if(x.pre){SHELF[x.id]=x.pre.shelf;RAWOF[x.id]=x.pre.raw}
  else if(x.raw&&x.shelf)SHELF[x.id]=x.shelf;
});
function u0(x){return x.q?x.u[0]:x.u}
function nameOf(id){return INGM[id].n}

/* Drinks. p = what the drink is worth (its list price). Soft drinks, then cocktails. */
var REC=[
 {id:"lemonade",n:"Lemonade",i:["lemonjuice"],p:3,f:"Soft"},
 {id:"sweetlem",n:"Sweet lemonade",i:["lemonjuice","syrup"],p:3.5,f:"Soft"},
 {id:"sparklem",n:"Sparkling lemonade",i:["lemonjuice","soda"],p:3.5,f:"Soft"},
 {id:"orangelem",n:"Orange lemonade",i:["lemonjuice","orangejuice"],p:4,f:"Soft"},
 {id:"mintlem",n:"Mint lemonade",i:["lemonjuice","syrup","mint"],p:4.5,f:"Soft"},
 {id:"pinklem",n:"Pink lemonade",i:["lemonjuice","syrup","cranberry"],p:5,f:"Soft"},

 {id:"gintonic",n:"Gin and tonic",i:["gin","tonic"],p:9,f:"Refreshing"},
 {id:"screw",n:"Screwdriver",i:["vodka","orangejuice"],p:8,f:"Party"},
 {id:"cuba",n:"Cuba libre",i:["rum","cola","limejuice"],p:9,f:"Tropical"},
 {id:"daiquiri",n:"Daiquiri",i:["rum","limejuice","syrup"],p:10,f:"Tropical"},
 {id:"caipirinha",n:"Caipirinha",i:["cachaca","limejuice","syrup"],p:10,f:"Tropical"},
 {id:"gimlet",n:"Gimlet",i:["gin","limejuice","syrup"],p:10,f:"Sour"},
 {id:"mimosa",n:"Mimosa",i:["prosecco","orangejuice"],p:10,f:"Refreshing"},
 {id:"collins",n:"Tom Collins",i:["gin","lemonjuice","syrup","soda"],p:10,f:"Refreshing"},
 {id:"mule",n:"Moscow mule",i:["vodka","limejuice","gingerbeer"],p:11,f:"Refreshing"},
 {id:"dark",n:"Dark ’n’ Stormy",i:["rum","gingerbeer","limejuice"],p:11,f:"Tropical"},
 {id:"sunrise",n:"Tequila sunrise",i:["tequila","orangejuice","cranberry"],p:10,f:"Party"},
 {id:"cucgin",n:"Cucumber gin and tonic",i:["gin","cucumber","tonic"],p:11,f:"Refreshing"},
 {id:"whiskeysour",n:"Whiskey sour",i:["whiskey","lemonjuice","syrup"],p:11,f:"Sour"},
 {id:"amarettosour",n:"Amaretto sour",i:["amaretto","lemonjuice","syrup"],p:10,f:"Sour"},
 {id:"mojito",n:"Mojito",i:["rum","limejuice","syrup","mint","soda"],p:11,f:"Tropical"},
 {id:"oldf",n:"Old fashioned",i:["whiskey","syrup","angostura"],p:13,f:"Classic"},
 {id:"colada",n:"Piña colada",i:["rum","pineapple","coconut"],p:12,f:"Tropical"},
 {id:"marg",n:"Margarita",i:["tequila","limejuice","triple"],p:12,f:"Party"},
 {id:"espresso",n:"Espresso martini",i:["vodka","coffee","syrup"],p:13,f:"Party"},
 {id:"piscosour",n:"Pisco sour",i:["pisco","lemonjuice","syrup"],p:11,f:"Sour"},
 {id:"spritz",n:"Aperol spritz",i:["aperol","prosecco","soda"],p:11,f:"Refreshing"},
 {id:"negroni",n:"Negroni",i:["gin","campari","vermouth"],p:13,f:"Classic"},
 {id:"manhattan",n:"Manhattan",i:["whiskey","vermouth","angostura"],p:14,f:"Classic"},
 {id:"cosmo",n:"Cosmopolitan",i:["vodka","triple","cranberry","limejuice"],p:12,f:"Party"},
 {id:"sidecar",n:"Sidecar",i:["cognac","triple","lemonjuice"],p:13,f:"Sour"},
 {id:"hugo",n:"Hugo",i:["elderflower","prosecco","mint","soda"],p:12,f:"Refreshing"},
 {id:"mezmarg",n:"Mezcal margarita",i:["mezcal","limejuice","triple"],p:15,f:"Party"},
 {id:"lastword",n:"Last word",i:["gin","chartreuse","limejuice"],p:16,f:"Classic"},
 {id:"royalmojito",n:"Royal mojito",i:["rum","limejuice","syrup","mint","prosecco"],p:15,f:"Tropical",s:1},
 {id:"sbagliato",n:"Negroni sbagliato",i:["campari","vermouth","prosecco"],p:13,f:"Classic",s:1},
 {id:"southside",n:"Southside",i:["gin","limejuice","syrup","mint"],p:12,f:"Sour",s:1}
];
/* neat serves: every spirit, beer and wine in three qualities */
var SOLOS=[];
ING.forEach(function(x){
  if(!x.q)return;
  var fam=x.id==="beer"?"Beer":x.id==="wine"?"Wine":"Neat",plain=x.id==="beer"||x.id==="wine";
  for(var t=0;t<3;t++){
    SOLOS.push({id:"s_"+x.id+"_"+t,n:plain?x.tn[t]:x.n+", "+x.tn[t].toLowerCase(),i:[x.id],p:x.sv[t],f:fam,solo:true,tier:t,ing:x.id});
  }
});
var ITEMS=REC.concat(SOLOS),ITM={};
ITEMS.forEach(function(i){ITM[i.id]=i});
var QV=[1,1.3,1.9];          /* how much a better brand adds to a cocktail's worth */
var QFEE=[0,150,500];        /* brand unlock fee, times the standard serving cost */
var QREP=[0,2,5];            /* reputation level needed for premium and ultra */
var WTP=[0.85,1,1.3,1.7];    /* how much more a richer customer accepts */
var CLASSN=["budget","regular","affluent","wealthy"];
var TP=[[1,0.1,0],[1,0.35,0.03],[0.5,1,0.25],[0.1,0.8,1]]; /* quality taste by wealth */

/* market news. f multiplies the price of the listed ingredients for dur seconds. */
var NEWS=[
 {h:"Citrus shortage: lemons and limes cost more",ids:["lemon","lime"],f:1.8,dur:150},
 {h:"Bumper citrus harvest: lemons and limes get cheaper",ids:["lemon","lime"],f:0.6,dur:150},
 {h:"Poor harvest pushes sugar prices up",ids:["sugar"],f:1.7,dur:150},
 {h:"Distillers’ strike: spirits are scarce",ids:SPIRITS,f:1.5,dur:180},
 {h:"New trade deal: imported spirits get cheaper",ids:SPIRITS,f:0.7,dur:180},
 {h:"Heatwave: mixers and juices cost more",ids:MIXERS,f:1.4,dur:150},
 {h:"Coffee crop fails: espresso costs more",ids:["coffee"],f:1.9,dur:150},
 {h:"Wine fair: prosecco and liqueurs on sale",ids:LIQUEURS,f:0.7,dur:150},
 {h:"Herb blight: mint and cucumber cost more",ids:["mint","cucumber"],f:1.7,dur:150},
 {h:"Tropical fruit glut: pineapple and coconut get cheaper",ids:["pineapple","coconut"],f:0.65,dur:150},
 {h:"Hop shortage: beer costs more",ids:["beer"],f:1.5,dur:150},
 {h:"Great vintage: wine gets cheaper",ids:["wine"],f:0.7,dur:150},
 {h:"Port strike delays shipments: everything costs more",ids:"all",f:1.25,dur:120},
 {h:"Supplier discount week: everything is cheaper",ids:"all",f:0.8,dur:120}
];

