import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadKit() {
  const context = { console: { info() {}, warn() {} } };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../skills/learn-to-tell/kit/ltt.js", import.meta.url), "utf8"), context);
  return context.LTT;
}

test("lessonId reads the id only from /lessons/<id>/ paths", () => {
  const { lessonId } = loadKit();
  assert.equal(lessonId("/lessons/20261013-demo/lesson.html"), "20261013-demo");
  assert.equal(lessonId("/gallery/alert-precision.html"), null);
  assert.equal(lessonId("/lessons/Bad_Id/lesson.html"), null);
  assert.equal(lessonId("/lessons/demo"), null);
});

test("compare uses the given absolute tolerance", () => {
  const { compare } = loadKit();
  assert.equal(compare(0.161016, 0.16102, 1e-4).ok, true);
  assert.equal(compare(0.1615, 0.16102, 1e-4).ok, false);
  assert.equal(compare(0.16102 + 1e-4, 0.16102, 1e-4).ok, true);
});

test("compare defaults to a tight relative tolerance and rejects non-finite values", () => {
  const { compare } = loadKit();
  assert.equal(compare(1000 + 1e-7, 1000).ok, true);
  assert.equal(compare(1000 + 1e-5, 1000).ok, false);
  assert.equal(compare(NaN, 0).ok, false);
  assert.equal(compare(Infinity, 1).ok, false);
  assert.equal(compare("0.5", 0.5).ok, false);
});

test("expect returns the comparison result outside a browser", () => {
  const { expect } = loadKit();
  assert.equal(expect("match", 2, 2), true);
  assert.equal(expect("mismatch", 2, 3), false);
});
