/* ---------- types (JSDoc only, no code): checked by `npm run typecheck`, read by editors ---------- */

/** @typedef {{[k:string]:number}} NumMap */

/**
 * A staff role, from STAFF (bartenders, who make drinks) or SUPPORT (everyone else).
 * @typedef {object} Role
 * @property {string} id
 * @property {string} n     name
 * @property {string} pl    plural, lower case
 * @property {number} w     base monthly wage (WAGE)
 * @property {number} [sp]  drinks per second for bartenders; support roles have none
 * @property {number} [g]   support roles: hiring fee growth
 * @property {string} d     description
 */

/**
 * Someone on the team.
 * @typedef {object} Employee
 * @property {number} id
 * @property {string} name
 * @property {string} role     Role.id
 * @property {number} lvl      0 junior, 1 mid-level, 2 senior
 * @property {number} xp       days worked
 * @property {number[]} sk     skills, 1-5 each (names: skillNames(role))
 * @property {number} wage     monthly
 * @property {number} cl       clerks: how many ingredients they watch
 * @property {number} [starter] months left on the stand's half-wage starter deal
 */

/**
 * An ingredient. u is the cost of one serving (an array of three tiers for spirits, beer and wine).
 * @typedef {object} Ingredient
 * @property {string} id
 * @property {string} n
 * @property {number|number[]} u
 * @property {string} g        unlock group (TIERS key or "0")
 * @property {number} [c]      unlock fee
 * @property {boolean} [raw]   raw produce, only bought by the prep chef
 * @property {number} [shelf]  raw produce: days before it spoils
 * @property {number|boolean} [q]  has brand tiers
 * @property {string[]} [tn]   tier names
 * @property {number[]} [sv]   neat serve value per tier
 * @property {string} [gs]     rare ingredient: the role whose training unlocks it
 * @property {number} [gn]     ... at this training level
 * @property {number} [rep]    ... and this reputation
 * @property {{raw:string,y:number,shelf:number}} [pre]  prepared by the prep chef from raw produce
 */

/**
 * Anything on the menu: a recipe (REC) or a neat serve of one ingredient tier (solo).
 * @typedef {object} Item
 * @property {string} id
 * @property {string} n
 * @property {string[]} i      ingredient ids
 * @property {number} p        popularity
 * @property {string} f        drink family (Soft, Classic, Tropical...)
 * @property {number|boolean} [s]  secret recipe
 * @property {boolean} [solo]  neat serve
 * @property {number} [tier]   neat serve: brand tier
 * @property {string} [ing]    neat serve: the ingredient
 */

/**
 * A venue (EXPS): price to expand into it, seconds between arrivals, drinks per order, monthly rent and utilities.
 * @typedef {{n:string,c:number,int:number,k:number,rent:number,util:number}} Venue
 */

/**
 * A customer type (CUST). w: how likely in each of the six parts of the day; pref: favourite families.
 * @typedef {object} CustomerType
 * @property {string} n
 * @property {number} pat      patience in seconds
 * @property {number} m        tip multiplier
 * @property {number} wb       wealth bias
 * @property {number[]} w
 * @property {NumMap} [pref]
 * @property {number} [bi]     extra drinks per order
 */

/** @typedef {{r:string,done:boolean}} OrderItem */

/**
 * A guest's order, from spawnOrder() until collect() or a walkout.
 * @typedef {object} Order
 * @property {number} id
 * @property {number} [cid]    first order of the same guest (repeat rounds)
 * @property {number} re       repeat round, 0 for the first
 * @property {number} [rid]    a regular's id
 * @property {number} slot     seat
 * @property {string} who      CustomerType.n
 * @property {number} m        tip multiplier
 * @property {number} cls      wealth class 0-3
 * @property {OrderItem[]} items
 * @property {number} pat      patience at the start
 * @property {number} left     patience left
 * @property {boolean} ready
 * @property {number} reward   set by finishOrder()
 * @property {number} sat      satisfaction 0-100, set by finishOrder()
 * @property {boolean} [rowdy]
 * @property {number} [rt]     seconds rowdy
 * @property {boolean} [gone]  a rowdy guest who already left
 */

/**
 * A served guest still at their seat (S.hold), who may order another round.
 * @typedef {{slot:number,left:number,id:number,who:string,cls:number,rid?:number,drink:?string,again:boolean,re:number}} Hold
 */

/** @typedef {{rev:number,cogs:number,rent:number,util:number,pay:number,waste:number,interest:number,gs:number,gn:number,gp:number}} Month */
/** @typedef {{rev:number,cogs:number,rent:number,util:number,pay:number,waste:number,interest:number,profit:number,unpaid:number,branch:number}} LastMonth */

/**
 * A special mission. type drink: serve n of item; family: n drinks of fam; streak: n orders without a walkout.
 * @typedef {{id:number,type:string,n:number,days:number,title:string,reward:number,item?:string,fam?:string,p?:number,dl?:number}} Mission
 */
/** @typedef {{offers:Mission[],active:Mission[],next:number,day:number,done:number,failed:number,earned:number,last:?{t:string,r:number},seen:boolean}} Missions */

/** @typedef {{id:number,name:string,type:string,cls:number,fav:string,bond:number,visits:number,last:number}} Regular */

/** @typedef {{id:string,n:string,d:string,col:number,row:number,cost?:number[],max?:number,req?:string[],role?:string,kind?:string}} TreeNode */
/** @typedef {{id:string,n:string,k:number,cost:number}} City */
/** @typedef {{id:string,n:string,d:string,max:number,cost:number[]}} LegacyPerk */
/** @typedef {{h:string,ids:("all"|string[]),f:number,dur:number}} NewsEvent */

/**
 * The whole game state, S. Created by def(), saved as JSON, upgraded by MIGRATIONS on load.
 * @typedef {object} State
 * @property {number} v         save version
 * @property {number} seed      seed of this game
 * @property {number} rng       random() state
 * @property {number} money
 * @property {number} totalEarned
 * @property {number} served
 * @property {number} walkouts
 * @property {NumMap} ing       unlocked ingredients (1)
 * @property {NumMap} ql        brand tier unlocked per ingredient
 * @property {NumMap} brand     brand tier in use per ingredient
 * @property {NumMap} stock     servings in stock, by stock key (skey)
 * @property {Object<string,{d:number,n:number}[]>} bat  prepared batches and the day they were made
 * @property {Object<string,boolean>} auto  ingredients a clerk restocks
 * @property {NumMap} par       stock to hold per ingredient
 * @property {Object<string,string>} parCat  how much the controller asks clerks to hold: hi, mid, lo
 * @property {string[]} notes
 * @property {NumMap} price     prices you typed, by item
 * @property {NumMap} act       prices on the menu now
 * @property {NumMap} cprice    prices the cost controller set
 * @property {NumMap} staff     headcount per role (syncStaff)
 * @property {NumMap} train     training level per role
 * @property {NumMap} upg       upgrades bought
 * @property {number} exp       venue: 0 stand ... 4 global chain
 * @property {number} expAt     month of the last expansion (lease ramp)
 * @property {Order[]} orders
 * @property {{o:number,i:number,p:number}[]} jobs  drinks being made
 * @property {Hold[]} hold
 * @property {number} arrive    seconds to the next guest
 * @property {number} nextId
 * @property {number} sat       guest satisfaction 0-100
 * @property {number} reorders
 * @property {{drift:NumMap,ev:any[],next:number,t20:number}} mkt  market
 * @property {number} ctlT
 * @property {number} chefB
 * @property {number} rep       reputation
 * @property {number} pts       perk points
 * @property {NumMap} perm      perks bought
 * @property {Object<string,number>} ach  achievements earned
 * @property {{p:boolean,u:boolean}} sold  sold premium / ultra premium
 * @property {boolean} paidDebt
 * @property {number} debt
 * @property {number} late      months behind with the bank
 * @property {number} mcount    months played
 * @property {Month} month
 * @property {?LastMonth} lastMonth
 * @property {?{type:string,[k:string]:any}} notice  shown by loop() when the overlay is free
 * @property {number} gt        game time in minutes
 * @property {number} curDay
 * @property {number[][]} hours opening and closing hour per weekday
 * @property {number} dayE
 * @property {number} dayN
 * @property {{e:number,n:number}} prev
 * @property {NumMap} picks
 * @property {string[]} known   recipes discovered
 * @property {boolean} kits     a run has started
 * @property {string} barName
 * @property {Employee[]} team
 * @property {Object<string,{day:number,list:any[]}>} cands  today's hiring candidates per role
 * @property {number} mood      team mood 0-100
 * @property {number} moodB
 * @property {number} nextEmp
 * @property {NumMap} maxStaff
 * @property {Object<string,number>} starter
 * @property {number} wkMig
 * @property {number} hhUntil   happy hour ends (ms)
 * @property {number} hhReady   happy hour available again (ms)
 * @property {number} last      saved at (ms)
 * @property {boolean} newRec
 * @property {Missions} ms
 * @property {Regular[]} reg
 * @property {number} nextReg
 * @property {?{score:number,stars:number,comp:NumMap,month:number}} guide  Bar Guide rating
 * @property {{items:NumMap,theme?:?string}} deco
 * @property {{mode:string,until?:number,lk?:NumMap}} sup  supplier
 * @property {Object<string,string>} nights  themed night booked per day
 * @property {{from:number,until:number,dem:number,sat:number}[]} mods  temporary demand modifiers
 * @property {NumMap} ban       ingredients unavailable until a day
 * @property {?{id:string,ing?:string}} inc  pending incident
 * @property {number} calmed
 * @property {string[]} br      branch cities
 * @property {{pts:number,perks:NumMap}} leg
 * @property {number} legacy    bars retired
 * @property {number} [tut]     tests only
 */
