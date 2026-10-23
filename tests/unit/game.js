/* Shared setup for the unit tests: a fresh headless engine (tools/engine.js) with a fixed seed.
   g.S() is the live state, g.fn(name) an engine function, g.run(code) runs code inside the engine.
   Engine objects come from another realm: compare them with toJSON(), not deepStrictEqual. */
"use strict";
var makeEngine = require("../../tools/engine.js").makeEngine;

function game(seed, setup) {
  var api = makeEngine();
  api.run("setEnv({seed:function(){return " + (seed || 1) + "},now:function(){return 0}})");
  api.run("S=def();beginRun();S.tut=99;" + (setup || ""));
  return {
    S: function () { return api.get("S"); },
    get: function (n) { return api.get(n); },
    fn: function (n) { return api.get(n); },
    run: function (code) { return api.run(code); },
    /* run code and return the value of an expression, e.g. g.val("S.money") */
    val: function (expr) { return api.get(expr); }
  };
}
function toJSON(x) { return JSON.parse(JSON.stringify(x)); }
/* move the clock to a given hour of the current day */
function atHour(g, h) { g.run("S.gt=gDay()*1440+" + (h * 60) + ";FXC.day=-1"); }

module.exports = { game: game, toJSON: toJSON, atHour: atHour };
