/* Every save in tests/saves/ must load, migrate and keep playing.
   Add a fixture whenever you add a migration step (MIGRATIONS in src/js/state.js). */
"use strict";
var test = require("node:test"), assert = require("node:assert");
var fs = require("fs"), path = require("path");
var makeEngine = require("../../tools/engine.js").makeEngine;

var DIR = path.join(__dirname, "..", "saves");

fs.readdirSync(DIR).filter(function (f) { return f.endsWith(".json"); }).sort().forEach(function (f) {
  test("save " + f + " loads, migrates and plays a week", function () {
    var raw = JSON.parse(JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"))["last-call-orders-v5"]);
    var api = makeEngine();
    api.run("setEnv({seed:function(){return 1}})");
    var current = api.get("MIGRATIONS").length, defKeys = Object.keys(api.get("def")());
    api.run("fromSave(" + JSON.stringify(raw) + ")");
    var S = api.get("S");

    assert.strictEqual(S.v, current, "reaches the current save version");
    assert.deepStrictEqual(defKeys.filter(function (k) { return !(k in S); }), [], "has every field def() defines");
    assert.ok(S.team.every(function (e) { return !("sch" in e) && !("ot" in e); }), "removed schedule fields are gone");
    assert.ok([S.month, S.lastMonth].every(function (m) { return !m || !("ot" in m); }), "removed overtime is gone");

    var wk = api.get("wk")();
    raw.team.forEach(function (e, i) {
      var want = raw.kits && !raw.wkMig && wk !== 1 ? Math.round(e.wage * wk / 10) * 10 : e.wage;
      assert.strictEqual(S.team[i].wage, want, e.name + "'s wage after migration");
    });

    var once = JSON.stringify(S);
    api.run("fromSave(JSON.parse(" + JSON.stringify(once) + "))");
    assert.strictEqual(JSON.stringify(api.get("S")), once, "loading a migrated save changes nothing");

    api.run("S.last=0;simulate(7*1440/2)");
    S = api.get("S");
    assert.ok(isFinite(S.money), "money stays finite");
    assert.ok(Object.keys(S.stock).every(function (k) { return isFinite(S.stock[k]); }), "stock stays finite");
  });
});

var h = require("./game.js");

test("export and import: a game survives the round trip as text", function () {
  var g = h.game(41, "S.money=12345;S.exp=2;S.barName='Round trip';S.team.push({id:7,name:'Ana',role:'cashier',lvl:1,xp:20,sk:[3,4],wage:1300,cl:1});syncStaff()");
  var text = g.fn("exportSave")({done: 1});
  var before = JSON.stringify(g.S());
  var g2 = h.game(42);
  var d = g2.fn("parseSave")(text);
  assert.strictEqual(d.prefs.done, 1);
  g2.run("fromSave(" + JSON.stringify(d.state) + ")");
  assert.strictEqual(JSON.stringify(g2.S()), before);
});

test("import: a raw saved state is accepted, anything else is refused with a message", function () {
  var g = h.game(43);
  var raw = JSON.stringify(g.S());
  assert.strictEqual(g.fn("parseSave")(raw).state.money, 300);
  ["", "hello", "{}", "[1,2]", JSON.stringify({game: "other", state: {}})].forEach(function (t) {
    assert.throws(function () { g.fn("parseSave")(t); }, /not a Last Call save/, JSON.stringify(t));
  });
  var newer = JSON.parse(g.fn("exportSave")(null));
  newer.state.v = 999;
  assert.throws(function () { g.fn("parseSave")(JSON.stringify(newer)); }, /newer version/);
});
