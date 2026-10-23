/* The order engine: who walks in, what they order, what they pay and whether they stay for another round. */
"use strict";
var test = require("node:test"), assert = require("node:assert");
var h = require("./game.js");

/* a regular day (no holiday or event), so only the customer weights decide who comes in */
function quietDay(g) { g.run("var d=1;while(eventsOn(d).length)d++;S.gt=d*1440+600;S.curDay=d;FXC.day=-1"); }
function spawnMany(g, hour, n) {
  h.atHour(g, hour);
  var count = {};
  for (var i = 0; i < n; i++) {
    g.run("S.orders=[];S.hold=[];spawnOrder()");
    var o = g.val("S.orders[0]");
    if (o) count[o.who] = (count[o.who] || 0) + 1;
  }
  return count;
}

test("spawnOrder: the customer mix follows the time of day", function () {
  var g = h.game(11); quietDay(g);
  var morning = spawnMany(g, 7, 2000), lunch = spawnMany(g, 12, 2000);
  assert.ok((morning.Jogger || 0) > 4 * (morning["Office crowd"] || 0), "morning: joggers far outnumber the office crowd " + JSON.stringify(morning));
  assert.ok((lunch["Office crowd"] || 0) > 2 * (lunch.Jogger || 0), "lunch: the office crowd outnumbers joggers " + JSON.stringify(lunch));
});

test("spawnOrder: an order only holds drinks on the menu and takes a free seat", function () {
  var g = h.game(12); quietDay(g); h.atHour(g, 12);
  g.run("spawnOrder();spawnOrder()");
  var orders = g.val("S.orders"), menu = g.val("mi().list.map(function(x){return x.id})");
  assert.strictEqual(orders.length, 2);
  assert.notStrictEqual(orders[0].slot, orders[1].slot);
  orders.forEach(function (o) {
    assert.ok(o.items.length >= 1 && o.items.length <= g.val("EXPS[S.exp].k"));
    o.items.forEach(function (it) { assert.ok(menu.indexOf(it.r) >= 0, it.r + " is on the menu"); });
    assert.strictEqual(o.left, o.pat);
  });
});

test("spawnOrder: no free seat, no order", function () {
  var g = h.game(13); quietDay(g); h.atHour(g, 12);
  for (var i = 0; i < 10; i++) g.run("spawnOrder()");
  assert.strictEqual(g.val("S.orders.length"), g.val("maxSlots()"));
});

test("spawnOrder: a drink far above the fair price sends the customer away and lowers satisfaction", function () {
  var g = h.game(14); quietDay(g); h.atHour(g, 12);
  g.run("S.act.lemonade=500;S.sat=60");
  for (var i = 0; i < 20; i++) g.run("spawnOrder()");
  assert.strictEqual(g.val("S.orders.length"), 0);
  assert.ok(g.val("S.sat") < 30, "satisfaction fell to " + g.val("S.sat"));
});

test("finishOrder: a guest served at once pays the full tip; a guest who waited pays less", function () {
  var g = h.game(15); quietDay(g); h.atHour(g, 12);
  g.run("spawnOrder();var o=S.orders[0];o.items.forEach(function(it){it.done=true});finishOrder(o)");
  var o = g.val("S.orders[0]");
  assert.ok(Math.abs(o.reward - g.fn("maxReward")(g.val("S.orders[0]"))) < 1e-9, "reward equals maxReward with full patience left");
  assert.ok(o.reward > g.fn("orderBase")(g.val("S.orders[0]")), "the tip is on top of the menu price");
  var full = o.reward;
  g.run("S.orders=[];spawnOrder();var o=S.orders[0];o.left=o.pat*0.25;finishOrder(o)");
  var late = g.val("S.orders[0]");
  assert.ok(late.reward / g.fn("orderBase")(g.val("S.orders[0]")) < full / g.fn("orderBase")(o), "less tip after waiting");
  assert.ok(late.sat >= 0 && late.sat <= 100 && o.sat > late.sat, "waiting lowers satisfaction");
});

test("finishOrder: pricing above the fair price lowers satisfaction", function () {
  function satAt(price) {
    var g = h.game(16); quietDay(g); h.atHour(g, 12);
    g.run("spawnOrder();var o=S.orders[0];o.items=[{r:'lemonade',done:true}];o.cls=1;S.act.lemonade=" + price + ";finishOrder(o)");
    return g.val("S.orders[0].sat");
  }
  var fair = h.game(16).fn("fairOf")(h.game(16).val("ITM.lemonade"));
  assert.ok(satAt(fair * 0.8) > satAt(fair * 1.6));
});

test("collect: pays the reward into money, revenue and the day's takings", function () {
  var g = h.game(17); quietDay(g); h.atHour(g, 12);
  g.run("spawnOrder();var o=S.orders[0];finishOrder(o)");
  var before = g.val("[S.money,S.month.rev,S.served]"), reward = g.val("S.orders[0].reward");
  g.run("collect(S.orders[0])");
  var after = g.val("[S.money,S.month.rev,S.served]");
  assert.ok(Math.abs(after[0] - before[0] - reward) < 1e-9);
  assert.ok(Math.abs(after[1] - before[1] - reward) < 1e-9);
  assert.strictEqual(after[2], before[2] + 1);
  assert.strictEqual(g.val("S.orders.length"), 0);
  assert.strictEqual(g.val("S.hold.length"), 1, "the guest stays seated for a while");
});

test("reorderChance: unhappy guests never reorder, happy ones up to a cap, fewer with each round", function () {
  var g = h.game(18);
  var rc = g.fn("reorderChance");
  assert.strictEqual(rc({sat: 50, slot: 0, re: 0}), 0);
  var r0 = rc({sat: 100, slot: 0, re: 0}), r1 = rc({sat: 100, slot: 0, re: 1});
  assert.ok(r0 > 0 && r0 <= 0.6);
  assert.ok(Math.abs(r1 - r0 * 0.75) < 1e-12, "each round is 25% less likely");
  assert.strictEqual(rc({sat: 100, slot: 0, re: g.val("MAXRE")}), 0);
  g.run("S.team.push({id:99,name:'H',role:'bartender',lvl:2,xp:0,sk:[5,5,5],wage:1800,cl:1});syncStaff();TV++");
  assert.ok(rc({sat: 100, slot: 0, re: 0}) > r0, "hospitable staff bring more rounds");
});
