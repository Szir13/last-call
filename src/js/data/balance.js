/* ---------- balance: every number that tunes the economy ----------
   Design targets (docs/ECONOMY.md): a fully equipped, attentive player keeps a 50-57% margin at every
   stage; the next expansion pays back in 1.5-2.5 months of profit; staff past the stage limit earn less
   than they cost; engaged play (decor, nights, suppliers, missions) adds 3-10% revenue, never doubles it.
   After changing anything here: python tools/reference.py (and --sweep), then python tools/run_bots.py.
   tools/reference.py reads these values from the engine, so there is nothing to copy into Python. */

/* venues. c = expansion price, int = seconds between arrivals, k = max drinks per order, rent and util monthly.
   Target: margin 50-57% with the reference team; c / monthly profit of the stage before = 1.5-2.5 months. */
var EXPS=[
 {n:"Lemonade stand",c:0,int:9.6,k:1,rent:900,util:150},
 {n:"Neighborhood bar",c:10000,int:7.8,k:2,rent:17000,util:2700},
 {n:"Hotel bar",c:75000,int:6.9,k:3,rent:71000,util:12000},
 {n:"Rooftop bar",c:260000,int:5.9,k:3,rent:150000,util:26000},
 {n:"Global chain",c:780000,int:4.5,k:3,rent:232000,util:38000}
];
var RAMP=[0.4,0.65,0.85,1];      /* share of rent and utilities in the 1st, 2nd, 3rd and later months after expanding: a new venue must be survivable before it is fully equipped */
var OPENING=0.5;                 /* the very first month costs this share of rent, utilities and wages */

/* team. Target: at STAFFCAP an extra person earns less than their wage (reference.py --sweep). */
var STAFFCAP=[2,5,8,12,18];      /* team size limit per venue */
var WAGEK=[1,1.3,1.8,2.5,2.8];   /* wage level per venue: new hires ask this times the base wage; expanding raises everyone */
var WAGE={apprentice:1000,bartender:1800,head:2800,mixologist:3800,manager:4800,ambassador:6500,
  cashier:1000,clerk:1000,prepchef:2400,controller:3500,security:2200};   /* base monthly wage per role */
var GROWTH=1.17,HIRE=0.15;       /* a hire costs 15% of a month's wage, and a bit more each time */
var TRAIN_COST=[0.8,3,8];        /* training costs this many months of wage */
var CLERK_UP=[600,3000];         /* price of letting a clerk watch a 2nd and a 3rd ingredient */
var LVLM=[1,1.25,1.6];           /* wage multiplier for junior, mid-level and senior */
var LVLXP=[0,14,42];             /* days worked needed to reach mid-level and senior */
var PROMXP=70;                   /* days worked before a senior can move to the next role */
var OWN=[2,3,3];                 /* your own skills at the counter */

/* ingredients */
var TIERS={"1":{staff:"apprentice",base:0,per:2},"2":{staff:"bartender",base:3,per:3},"3":{staff:"head",base:2,per:1}};   /* base = picks for the first hire, per = picks for each training level */
var FREEP={"1":2};               /* founding picks, so the first cocktails do not need a payroll */
var QFEE=[0,150,500];            /* brand unlock fee, times the standard serving cost */

/* seats and guests. Target: seats, not staff, limit sales at the reference team (walkouts low). */
var SLOTBASE=[3,4,5,7,9];        /* customers that can wait at once in each venue, before seat upgrades */
var SEATINC=[1,1,2,2,3];         /* seats added by each seat upgrade: bigger venues have more room to add */
var LINGER=[8,12,16,18,20];      /* seconds a served customer stays seated, by venue */
var MAXRE=3;                     /* a happy customer can ask for another round up to this many times */

/* missions, incidents, decor and nights are priced in days of revenue (ic()).
   MS_DAYREV: copy the "daily revenue" line printed by tools/reference.py. */
var MS_DAYREV=[505,3000,10400,22300,34000];   /* typical revenue of one day in each venue; rewards are a share of it */
var MS_MAX=2;                    /* missions you can hold at once */
var MENUREF=[3,12,25,45,60];     /* menu size the Bar Guide expects in each venue */

/* the bank. Target: a bad month is recoverable; three in a row is not. */
var LATE_MAX=3;                  /* months in a row without paying the bills before the bank repossesses the bar */
var INTEREST=0.04;               /* monthly interest on debt */
var LOAN_K=2,LOAN_MIN=2000;      /* you can borrow this many months of last month's profit, at least LOAN_MIN */
var REPO_SALE=0.5;               /* a repossessed venue sells for this share of its price */
var REPO_KEEP=2;                 /* after a repossession the bank writes off debt beyond this many months of fixed costs */
var RESTRUCTURE=0.5;             /* at the stand there is nothing to sell: the debt is cut to this share */

/* branches. Target: income from branches stays below what the chain itself earns. */
var CITIES=[
  {id:"lisbon",n:"Lisbon",k:1.0,cost:2700000},{id:"london",n:"London",k:1.15,cost:4000000},{id:"nyc",n:"New York",k:1.3,cost:6000000},
  {id:"tokyo",n:"Tokyo",k:1.2,cost:9000000},{id:"dubai",n:"Dubai",k:1.4,cost:13500000}
];
var HQP=455000;                  /* a global chain's typical monthly profit: branches pay a share of it */
var BRANCH_SHARE=0.3;            /* each branch pays this share of HQP, times its city factor */
