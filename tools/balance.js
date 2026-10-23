#!/usr/bin/env node
/* Print every value defined in src/js/data/balance.js as JSON, read from the engine itself,
   so tools never keep their own copy of a game number.

     node tools/balance.js            # all of them
     node tools/balance.js WAGEK EXPS # some of them */
"use strict";
var fs = require("fs"), path = require("path");
var api = require("./engine.js").makeEngine();
var src = fs.readFileSync(path.join(__dirname, "..", "src", "js", "data", "balance.js"), "utf8");
var names = [];
src.split("\n").forEach(function (line) {
  var m = line.match(/^var (.*)$/); if (!m) return;
  m[1].replace(/(?:^|,)\s*([A-Z_][A-Z0-9_]*)=/g, function (_, n) { names.push(n); });
});
var want = process.argv.slice(2).length ? process.argv.slice(2) : names, out = {};
want.forEach(function (n) { out[n] = api.get(n); });
process.stdout.write(JSON.stringify(out));
