/* Missions, suppliers and the calendar's demand modifiers. */
"use strict";
var test = require("node:test"), assert = require("node:assert");
var h = require("./game.js");

/* a neighborhood bar with a few drinks, so missions have something to ask for */
var BAR = "S.exp=1;['limejuice','tonic','soda','syrup','mint','gin','rum','cola'].forEach(function(i){S.ing[i]=1});menuChanged();checkUnlocks()";

test("missions: three offers a day, rewards scale with the venue's daily revenue", function () {
  var g = h.game(31, BAR);
  g.run("msGenerate()");
  var offers = h.toJSON(g.val("S.ms.offers"));
  assert.strictEqual(offers.length, 3);
  var flat = g.val("MS_DAYREV[1]");
  offers.forEach(function (m) {
    assert.ok(m.n > 0 && m.days > 0 && m.title.length > 0);
    assert.ok(m.reward >= 10 && m.reward <= flat * 0.25 * 1.3 + 10, "reward " + m.reward + " within a share of a day's revenue");
  });
});

test("missions: accept up to MS_MAX, with a deadline", function () {
  var g = h.game(32, BAR + ";msGenerate()");
  var ids = h.toJSON(g.val("S.ms.offers.map(function(m){return m.id})")), max = g.val("MS_MAX"), day = g.val("gDay()");
  ids.forEach(function (id) { g.fn("msAccept")(id); });
  var active = h.toJSON(g.val("S.ms.active"));
  assert.strictEqual(active.length, max);
  active.forEach(function (m) { assert.strictEqual(m.dl, day + m.days); assert.strictEqual(m.p, 0); });
});

test("missions: progress from served orders completes the mission and pays the reward once", function () {
  var g = h.game(33, BAR);
  g.run("S.ms.active=[{id:1,type:'drink',item:'lemonade',n:3,days:4,title:'Serve 3 Lemonade',reward:500,p:0,dl:99}]");
  var money = g.val("S.money");
  for (var i = 0; i < 3; i++) g.run("msProgress({items:[{r:'lemonade'}]})");
  assert.strictEqual(g.val("S.ms.done"), 1);
  assert.strictEqual(g.val("S.ms.active.length"), 0);
  assert.strictEqual(g.val("S.money"), money + 500);
  g.run("msProgress({items:[{r:'lemonade'}]})");
  assert.strictEqual(g.val("S.money"), money + 500, "paid once");
});

test("missions: a streak mission resets when a guest walks out; expired missions count as failed", function () {
  var g = h.game(34, BAR);
  g.run("S.ms.active=[{id:2,type:'streak',n:30,days:4,title:'x',reward:100,p:12,dl:gDay()}]");
  g.run("msStreakBreak()");
  assert.strictEqual(g.val("S.ms.active[0].p"), 0);
  g.run("S.gt+=1440;msDay(true)");
  assert.strictEqual(g.val("S.ms.active.length"), 0);
  assert.strictEqual(g.val("S.ms.failed"), 1);
});

test("suppliers: volume is 8% cheaper, premium 12% dearer than the spot market", function () {
  var g = h.game(35, BAR);
  var spot = g.val("unitCost(INGM.gin,0)");
  g.run("supSet('volume')"); var vol = g.val("unitCost(INGM.gin,0)");
  g.run("supSet('premium')"); var prem = g.val("unitCost(INGM.gin,0)");
  assert.ok(Math.abs(vol / spot - 0.92) < 1e-9, "volume " + vol / spot);
  assert.ok(Math.abs(prem / spot - 1.12) < 1e-9, "premium " + prem / spot);
});

test("suppliers: a contract freezes prices at 97% of the market and cannot be left early", function () {
  var g = h.game(36, BAR);
  var spot = g.val("unitCost(INGM.gin,0)");
  assert.ok(g.fn("supSet")("contract"));
  var frozen = g.val("unitCost(INGM.gin,0)");
  assert.ok(Math.abs(frozen / spot - 0.97) < 1e-9);
  g.run("MK[RAWOF.gin||'gin']*=1.5");
  assert.ok(Math.abs(g.val("unitCost(INGM.gin,0)") - frozen) < 1e-9, "market moves do not reach a contract");
  assert.strictEqual(g.fn("supSet")("spot"), false, "locked for 84 days");
  g.run("S.gt+=85*1440");
  assert.strictEqual(g.fn("supSet")("spot"), true);
});

test("suppliers: the volume deal charges half the shortfall below the commitment at month end", function () {
  var g = h.game(37, BAR + ";supSet('volume')");
  var commit = g.fn("volCommit")();
  g.run("S.mcount=1;S.month=Object.assign(newMonth(),{cogs:0});S.money=1e6;monthEnd(true)");
  assert.ok(Math.abs(g.val("S.lastMonth.util") - 0.5 * commit) < 1e-9);
});

test("fxFor: weather, seasons, booked nights and temporary modifiers combine", function () {
  var g = h.game(38);
  /* an ordinary day with no events, in each season */
  function plainDay(season, wx) {
    for (var d = 1; d < 4000; d++) {
      if (!g.val("eventsOn(" + d + ").length") && g.val("seasonOf(" + d + ")") === season && (wx === undefined || g.val("weatherOf(" + d + ")") === wx)) return d;
    }
    throw new Error("no such day");
  }
  var sunnySummer = plainDay(2, 0), fx = h.toJSON(g.fn("fxFor")(sunnySummer));
  assert.ok(Math.abs(fx.dem - 1.1 * 1.03) < 1e-12, "outdoor stand on a sunny summer day: " + fx.dem);
  assert.strictEqual(fx.fam.Soft, 1.25);
  var winter = plainDay(0, 1), fw = h.toJSON(g.fn("fxFor")(winter));
  assert.strictEqual(fw.fam.Classic, 1.2);
  var stormy = plainDay(1, 2);
  assert.ok(Math.abs(g.fn("fxFor")(stormy).dem - 0.72) < 1e-12, "rain keeps people away from an outdoor stand");
  g.run("S.exp=1"); assert.ok(Math.abs(g.fn("fxFor")(stormy).dem - 1.05) < 1e-12, "and sends them indoors");
  g.run("S.nights[" + winter + "]='live'");
  var fn = h.toJSON(g.fn("fxFor")(winter));
  assert.strictEqual(fn.per["3"], 1.45);
  assert.strictEqual(fn.sat, 4);
  var demIn = g.fn("fxFor")(winter).dem, demOut = g.fn("fxFor")(winter + 1).dem;
  g.run("S.mods=[{from:" + winter + ",until:" + winter + ",dem:0.5,sat:-3}]");
  assert.ok(Math.abs(g.fn("fxFor")(winter).dem - demIn * 0.5) < 1e-12, "a modifier scales demand inside its dates");
  assert.strictEqual(g.fn("fxFor")(winter).sat, 1, "and adds its satisfaction");
  assert.strictEqual(g.fn("fxFor")(winter + 1).dem, demOut, "but not outside them");
});
