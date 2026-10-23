/* Number formatting shown everywhere in the UI. */
"use strict";
var test = require("node:test"), assert = require("node:assert");
var h = require("./game.js");

test("money0 matches toLocaleString('en-US') for whole dollars", function () {
  var money0 = h.game(1).fn("money0");
  var values = [0, -0, 0.4, -0.4, 0.5, -0.5, 1, 999, 1000, 1001, 9999.5, -1234.6, 1e6, 12345678.9, -98765432.1, 2e15, NaN, Infinity, -Infinity];
  for (var i = 0; i < 4000; i++) values.push((Math.random() - 0.3) * Math.pow(10, Math.random() * 10));
  values.forEach(function (n) {
    assert.strictEqual(money0(n), "$" + Math.round(n).toLocaleString("en-US"), "for " + n);
  });
});
