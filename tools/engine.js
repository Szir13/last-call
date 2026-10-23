#!/usr/bin/env node
/* Run the game engine headless in Node: no browser, no DOM, no storage.

     echo '{"script":"bot.js","calls":[["careful",12]],"seed":1}' | node tools/engine.js

   Loads the engine files listed in build.js (data/, engine/, state) into an empty vm
   context, so any DOM or localStorage access throws. Then runs a tools/js script
   (scenario.js, bot.js) once per entry in "calls" and prints the results as JSON.
   The scripts see the engine as window.__lc, exactly like the hooked browser build.
   With "seed", call i starts a new game with seed + i, so runs are reproducible.
   tools/harness.py uses this when called with --node. */
"use strict";
var vm = require("vm"), fs = require("fs"), path = require("path");
var build = require("../build.js");

function makeEngine() {
  var ctx = vm.createContext({ console: console });
  var src = '(function(){"use strict";\n' + build.engineSource() +
    "\nreturn{get:function(n){return eval(n)},run:function(s){eval(s)}}})()";
  return vm.runInContext(src, ctx, { filename: "engine" });
}

function hook(api) {
  return new Proxy({}, {
    get: function (_, k) {
      if (k === "getS") return function () { return api.get("S"); };
      if (k === "resetMI") return function () { api.run("MI=null"); };
      try { return api.get(k); } catch (e) { return undefined; }
    }
  });
}

function main() {
  var job = JSON.parse(fs.readFileSync(0, "utf8"));
  var code = fs.readFileSync(path.join(__dirname, "js", job.script), "utf8");
  var api = makeEngine();
  global.window = { __lc: hook(api), __loopId: 0 };
  var fn = eval(code);
  var out = job.calls.map(function (args, i) {
    if (job.seed != null) api.run("setEnv({seed:function(){return " + ((job.seed + i) | 0) + "}})");
    var t0 = Date.now(), r = fn(args);
    r.secs = Math.round((Date.now() - t0) / 1000);
    return r;
  });
  process.stdout.write(JSON.stringify(out));
}

module.exports = { makeEngine: makeEngine };
if (require.main === module) main();
