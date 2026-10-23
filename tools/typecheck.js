#!/usr/bin/env node
/* Type-check the engine with TypeScript, reading the JSDoc types in src/js (no build output, no transpiling).

     node tools/typecheck.js        (npm run typecheck)

   The engine files are slices of one scope, not modules, so they are checked together as one file:
   tools/.build/engine.check.js. Errors are reported against the src/ file and line they came from. */
"use strict";
var fs = require("fs"), path = require("path"), cp = require("child_process");
var build = require("../build.js");
var ROOT = path.join(__dirname, ".."), OUT = path.join(__dirname, ".build", "engine.check.js");

var head = "// @ts-check\n(function(){\n\"use strict\";\n", map = [], line = head.split("\n").length;
var body = build.ENGINE.map(function (f) {
  var src = fs.readFileSync(path.join(ROOT, "src", "js", f + ".js"), "utf8");
  map.push({file: "src/js/" + f + ".js", from: line});
  line += src.split("\n").length - 1;
  return src;
}).join("");
fs.mkdirSync(path.dirname(OUT), {recursive: true});
fs.writeFileSync(OUT, head + body + "})();\n");

var tsc = path.join(ROOT, "node_modules", ".bin", "tsc");
var r = cp.spawnSync(tsc, ["--noEmit", "--allowJs", "--checkJs", "--target", "es2017", "--lib", "es2017", "--skipLibCheck", "--pretty", "false", OUT], {encoding: "utf8"});
var lines = (r.stdout || "").split("\n").filter(Boolean), errors = 0;
lines.forEach(function (l) {
  var m = l.match(/engine\.check\.js\((\d+),(\d+)\): (.*)$/);
  if (!m) { console.log(l); return; }
  errors++;
  var n = +m[1], at = map.filter(function (x) { return x.from <= n; }).pop();
  console.log(at.file + ":" + (n - at.from + 1) + ":" + m[2] + "  " + m[3]);
});
console.log(errors ? errors + " type error(s)" : "engine types ok");
process.exit(errors ? 1 : 0);
