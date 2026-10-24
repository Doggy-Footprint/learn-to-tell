// VO-4 (FR-12; SC2 report also feeds VO-6, C-6, C-38, C-39), scenario testing SC1..SC4 of the CLI process.
// Oracle: spec 6ed8f04e251d4b22 v1 Signatures CLI contract; SC1 compared to checkHtml of the same input.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LINE, pt, chart, C1 } from "./fixtures/html.mjs";
import { check, assertReport } from "./fixtures/report.mjs";
import { runCli, tempHtml, tempMissing } from "./fixtures/cli.mjs";

const assertUsageError = (p) => {
  assert.equal(p.status, 2);
  assert.equal(p.stdout, "");
  assert.match(p.stderr, /^ltt-check: [^\n]*\n?$/);
};

test("SC1 ok file: exit 0, stdout = pretty report + newline, stderr empty (C-6)", async () => {
  const pg = C1();
  const p = runCli([tempHtml(pg.html)]);
  assert.equal(p.status, 0);
  assert.equal(p.stderr, "");
  const expected = await check(pg);
  assert.deepEqual(JSON.parse(p.stdout), expected);
  assert.equal(p.stdout, JSON.stringify(expected, null, 2) + "\n");
});

test("SC2 failing file (C-24): exit 1, ok false (C-39)", async () => {
  const p = runCli([tempHtml(C1({ charts: [chart("e", LINE(2, [pt("a", { x: 3 }, 6)], { transform: [{ calculate: "foo(datum.x)", as: "y" }] }))] }).html)]);
  assert.equal(p.status, 1);
  assert.equal(p.stderr, "");
  const r = JSON.parse(p.stdout);
  assertReport(r, { charts: 2, points: 3, quizzes: 2 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.rule === "chart-build"));
});

test("SC3 no argument: exit 2 (C-38)", () => {
  assertUsageError(runCli([]));
});

test("SC4 missing file: exit 2 (C-38)", () => {
  assertUsageError(runCli([tempMissing()]));
});
