/* Month end, the bank and repossession. */
"use strict";
var test = require("node:test"), assert = require("node:assert");
var h = require("./game.js");

function close(a, b, msg) { assert.ok(Math.abs(a - b) < 1e-6, (msg || "") + " " + a + " vs " + b); }
/* a month with known numbers; mcount 1 so the opening-month discount does not apply */
function month(g, m) { g.run("S.mcount=1;S.month=Object.assign(newMonth()," + JSON.stringify(m) + ")"); }

test("monthEnd: pays rent, utilities and wages, records last month and starts a new one", function () {
  var g = h.game(21);
  month(g, {rev: 5000, cogs: 800, rent: 900, util: 150, pay: 1000});
  g.run("S.money=10000;S.debt=0;monthEnd(true)");
  var S = h.toJSON(g.S());
  close(S.money, 10000 - 2050, "money");
  close(S.lastMonth.profit, 5000 - 800 - 2050, "profit");
  assert.strictEqual(S.mcount, 2);
  assert.strictEqual(S.month.rev, 0);
  assert.strictEqual(S.late, 0);
});

test("monthEnd: the opening month costs OPENING of rent, utilities and wages", function () {
  var g = h.game(22);
  g.run("S.mcount=0;S.month=Object.assign(newMonth(),{rent:1000,util:200,pay:800});S.money=10000;monthEnd(true)");
  close(g.val("S.money"), 10000 - 2000 * g.val("OPENING"));
});

test("monthEnd: what you cannot pay becomes debt, with interest, and makes you late", function () {
  var g = h.game(23);
  month(g, {rent: 3000, util: 0, pay: 0});
  g.run("S.money=1000;S.debt=500;monthEnd(true)");
  var S = h.toJSON(g.S());
  close(S.lastMonth.interest, 500 * g.val("INTEREST"), "interest");
  close(S.debt, 500 * (1 + g.val("INTEREST")) + 2000, "debt");
  assert.strictEqual(S.money, 0);
  assert.strictEqual(S.late, 1);
});

test("monthEnd: spare cash above $300 repays debt", function () {
  var g = h.game(24);
  month(g, {rent: 100});
  g.run("S.money=5000;S.debt=1000;monthEnd(true)");
  assert.strictEqual(g.val("S.debt"), 0);
  close(g.val("S.money"), 5000 - 100 - 1000 * (1 + g.val("INTEREST")));
  assert.strictEqual(g.val("S.paidDebt"), true);
});

test("monthEnd: LATE_MAX unpaid months in a row and the bank takes the bar", function () {
  var g = h.game(25, "S.exp=2;S.ing.gin=1;S.upg.table=1");
  for (var i = 0; i < g.val("LATE_MAX"); i++) { month(g, {rent: 1e6}); g.run("S.money=0;monthEnd(true)"); }
  assert.strictEqual(g.val("S.exp"), 1);
  assert.strictEqual(g.val("S.notice.type"), "repo");
});

test("repossess: drops one stage, sells it, keeps recipes and resets what was bought", function () {
  var g = h.game(26, "S.exp=2;S.debt=50000;S.ing.gin=1;S.ql.gin=1;S.upg.table=1;S.train.bartender=2;S.picks={'1':3};" +
    "S.nights={5:'jazz'};S.sup={mode:'volume'};S.br=['lisbon'];S.deco={items:{plants:1},theme:'tiki'};S.ms.active=[{id:1}];" +
    "for(var i=0;i<12;i++)S.team.push({id:100+i,name:'E'+i,role:'cashier',lvl:i%3,xp:0,sk:[3,3],wage:1000+10*i,cl:1});syncStaff()");
  var known = h.toJSON(g.val("S.known")), price = g.val("EXPS[2].c"), sale = Math.round(price * g.val("REPO_SALE"));
  g.run("repossess(true)");
  var S = h.toJSON(g.S());
  assert.strictEqual(S.exp, 1);
  assert.ok(S.team.length <= g.fn("staffCap")(), "team trimmed to the smaller venue");
  assert.deepStrictEqual(S.known, known, "recipes learned are kept");
  assert.deepStrictEqual(S.ing, {lemonjuice: 1});
  [["upg", {}], ["train", {}], ["picks", {}], ["ql", {}], ["nights", {}], ["sup", {mode: "spot"}], ["br", []],
    ["deco", {items: {}, theme: null}], ["orders", []], ["hold", []], ["inc", null]].forEach(function (p) {
    assert.deepStrictEqual(S[p[0]], p[1], p[0] + " is reset");
  });
  assert.deepStrictEqual(S.ms.active, [], "missions in progress are dropped");
  assert.strictEqual(S.notice.sale, sale);
  assert.ok(S.debt <= Math.round(g.fn("monthlyFixed")() * g.val("REPO_KEEP")), "debt beyond REPO_KEEP months is written off");
  assert.strictEqual(S.late, 0);
});

test("repossess at the stand: nothing to sell, the debt is restructured", function () {
  var g = h.game(27, "S.exp=0;S.debt=8000;S.late=3");
  g.run("repossess(true)");
  assert.strictEqual(g.val("S.debt"), Math.round(8000 * g.val("RESTRUCTURE")));
  assert.strictEqual(g.val("S.late"), 1);
  assert.strictEqual(g.val("S.notice.type"), "restructure");
});

test("bankLimit: LOAN_K months of last month's profit, at least LOAN_MIN", function () {
  var g = h.game(28);
  assert.strictEqual(g.fn("bankLimit")(), g.val("LOAN_MIN"));
  g.run("S.lastMonth={profit:50000}");
  assert.strictEqual(g.fn("bankLimit")(), g.val("LOAN_K") * 50000);
});

test("rampK: a new venue's lease builds up over three months", function () {
  var g = h.game(29, "S.exp=1;S.expAt=5");
  var seen = [5, 6, 7, 8, 9].map(function (m) { g.run("S.mcount=" + m); return g.fn("rampK")(); });
  assert.deepStrictEqual(seen, [0.4, 0.65, 0.85, 1, 1]);
});

test("newGame: the old team is gone from the shift at once", function () {
  var g = h.game(30, "for(var i=0;i<3;i++)S.team.push({id:50+i,name:'E'+i,role:'cashier',lvl:0,xp:0,sk:[3,3],wage:1000,cl:1});syncStaff();TV++");
  assert.strictEqual(g.val("shiftCounts().emps.length"), 3);
  g.run("newGame()");
  assert.strictEqual(g.val("shiftCounts().emps.length"), 0);
});
