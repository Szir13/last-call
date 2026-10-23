#!/usr/bin/env node
/* Every save in tests/saves/ must load, migrate and keep playing.

     node tools/test_saves.js

   For each fixture: load it through fromSave() in the headless engine, then check that
   - it reaches the current save version and has every field def() defines,
   - the removed schedule and overtime fields are gone,
   - saves from before wage scaling get scaled wages, the others keep theirs,
   - saving and loading again changes nothing (migrations are idempotent),
   - a week of play runs without errors and keeps money and stock finite.
   Add a fixture whenever you add a migration step (see MIGRATIONS in src/js/state.js). */
"use strict";
var fs = require("fs"), path = require("path");
var makeEngine = require("./engine.js").makeEngine;

var DIR = path.join(__dirname, "..", "tests", "saves"), fails = 0;
function check(name, ok, msg) { if (!ok) { fails++; console.log("  FAIL " + name + ": " + msg); } }

fs.readdirSync(DIR).filter(function (f) { return f.endsWith(".json"); }).sort().forEach(function (f) {
  var raw = JSON.parse(JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"))["last-call-orders-v5"]);
  var api = makeEngine();
  api.run("setEnv({seed:function(){return 1}})");
  var current = api.get("MIGRATIONS").length, defKeys = Object.keys(api.get("def")());
  try { api.run("fromSave(" + JSON.stringify(raw) + ")"); } catch (e) { check(f, false, "load threw " + e); return; }
  var S = api.get("S");
  check(f, S.v === current, "version " + S.v + ", expected " + current);
  var missing = defKeys.filter(function (k) { return !(k in S); });
  check(f, !missing.length, "fields missing after load: " + missing.join(", "));
  check(f, S.team.every(function (e) { return !("sch" in e) && !("ot" in e); }), "employees still have sch or ot");
  check(f, [S.month, S.lastMonth].every(function (m) { return !m || !("ot" in m); }), "month still has ot");
  var wk = api.get("wk")();
  raw.team.forEach(function (e, i) {
    var want = raw.kits && !raw.wkMig && wk !== 1 ? Math.round(e.wage * wk / 10) * 10 : e.wage;
    check(f, S.team[i].wage === want, e.name + " wage " + S.team[i].wage + ", expected " + want);
  });
  var once = JSON.stringify(S);
  api.run("fromSave(JSON.parse(" + JSON.stringify(once) + "))");
  check(f, JSON.stringify(api.get("S")) === once, "loading a migrated save changed it");
  try { api.run("S.last=0;simulate(7*1440/2)"); } catch (e) { check(f, false, "a week of play threw " + e); return; }
  S = api.get("S");
  check(f, isFinite(S.money) && Object.keys(S.stock).every(function (k) { return isFinite(S.stock[k]); }), "money or stock not finite");
  console.log((fails ? "  " : "  ok ") + f + "  (v" + (raw.v || 0) + " -> v" + S.v + ", stage " + S.exp + ", " + S.team.length + " staff)");
});
console.log(fails ? fails + " check(s) failed" : "all saves load");
process.exit(fails ? 1 : 0);
