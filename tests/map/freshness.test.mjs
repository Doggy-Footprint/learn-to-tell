import { test } from "node:test";
import assert from "node:assert/strict";
import { lib, ago, TODAY } from "./helpers.mjs";

const { freshness } = await lib("freshness");
const h = (...e) => e.map(([date, quiz], i) => ({ date, lesson: `l${i}`, quiz }));

const cases = [
  ["13 days", [[ago(13), "pass"]], "fresh"],
  ["14 days (boundary)", [[ago(14), "pass"]], "fresh"],
  ["15 days", [[ago(15), "pass"]], "fading"],
  ["59 days", [[ago(59), "pass"]], "fading"],
  ["60 days (boundary)", [[ago(60), "pass"]], "fading"],
  ["61 days", [[ago(61), "pass"]], "stale"],
  ["today", [[ago(0), "pass"]], "fresh"],
];
for (const [name, e, want] of cases) {
  test(`VO-5 BVA ${name} -> ${want}`, () => assert.equal(freshness(h(...e), TODAY), want));
}

test("VO-5 fail latest -> weak even when an older pass is fresh", () => {
  assert.equal(freshness(h([ago(20), "pass"], [ago(2), "fail"]), TODAY), "weak");
});
test("VO-5 pass after fail -> by pass age (input order unsorted)", () => {
  assert.equal(freshness(h([ago(2), "pass"], [ago(40), "fail"]), TODAY), "fresh");
  assert.equal(freshness(h([ago(40), "fail"], [ago(30), "pass"]), TODAY), "fading");
});
test("VO-5 never quizzed: empty / skipped / none -> unquizzed", () => {
  assert.equal(freshness([], TODAY), "unquizzed");
  assert.equal(freshness(h([ago(1), "skipped"], [ago(3), "none"]), TODAY), "unquizzed");
});
test("VO-5 later skipped does not hide an older pass", () => {
  assert.equal(freshness(h([ago(100), "pass"], [ago(0), "skipped"]), TODAY), "stale");
});
test("VO-5 age is measured from today argument, not the clock", () => {
  assert.equal(freshness(h(["2020-01-01", "pass"]), "2020-01-15"), "fresh");
  assert.equal(freshness(h(["2020-01-01", "pass"]), "2020-03-02"), "stale");
});
