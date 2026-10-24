// VO-7 (QR-5, Errors), error guessing G1..G12 with console/stdio spies; CLI exit in {0,1}.
// Oracle: spec 6ed8f04e251d4b22 v1 Errors section and FR-4..FR-11 rule definitions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LINE, pt, chart, rawChart, number, C1 } from "./fixtures/html.mjs";
import { quietCheckHtml, assertReport, assertIssues } from "./fixtures/report.mjs";
import { runCli, tempHtml } from "./fixtures/cli.mjs";

async function quietCheck(html, counts) {
  const r = await quietCheckHtml(html);
  assertReport(r, counts);
  const p = runCli([tempHtml(html)]);
  assert.ok(p.status === 0 || p.status === 1, `cli exit ${p.status}`);
  assert.equal(p.stderr, "");
  assert.deepEqual(JSON.parse(p.stdout), r);
  return r;
}
const q = (pg) => quietCheck(pg.html, pg.counts);

test("G1 empty string", async () => {
  const r = await quietCheck("", { charts: 0, points: 0, quizzes: 0 });
  assert.equal(r.ok, true);
});

test("G2 non-HTML text", async () => {
  const r = await quietCheck("not html at all {", { charts: 0, points: 0, quizzes: 0 });
  assert.equal(r.ok, true);
});

test("G3 chart JSON null -> chart-json", async () => {
  assertIssues(await q(C1({ charts: [rawChart("n", "null")] })), [{ rule: "chart-json", chart: "n" }]);
});

test("G4 usermeta null -> chart-no-points", async () => {
  // usermeta:null may also fail the Vega-Lite schema (Dict type); FR-7 is independent of FR-5 and intra-chart order is unspecified.
  const r = await q(C1({ charts: [chart("n", LINE(2, [], { usermeta: null }))] }));
  assert.ok(r.errors.some((e) => e.rule === "chart-no-points" && e.chart === "n"));
  assert.ok(r.errors.every((e) => e.chart === "n" && ["chart-no-points", "chart-schema"].includes(e.rule)));
});

test("G5 usermeta.ltt 5 -> chart-no-points", async () => {
  assertIssues(await q(C1({ charts: [chart("n", LINE(2, [], { usermeta: { ltt: 5 } }))] })), [{ rule: "chart-no-points", chart: "n" }]);
});

test("G6 point where null -> point-invalid", async () => {
  assertIssues(await q(C1({ charts: [chart("n", LINE(2, [{ ...pt("a", { x: 3 }, 6), where: null }]))] })),
    [{ rule: "point-invalid", chart: "n", point: "a", actual: 0 }]);
});

test("G7 point params [] -> point-invalid", async () => {
  assertIssues(await q(C1({ charts: [chart("n", LINE(2, [pt("a", { x: 3 }, 6, 0, { params: [] })]))] })),
    [{ rule: "point-invalid", chart: "n", point: "a", actual: 0 }]);
});

test("G8 data-answer ' 8 ' is 8", async () => {
  assertIssues(await q(C1({ quizzes: [number("s", { answer: " 8 ", tol: "0", from: "traj.p2" })] })), []);
});

test("G9 data-from a..b -> quiz-from", async () => {
  assertIssues(await q(C1({ quizzes: [number("s", { answer: "1", tol: "0", from: "a..b" })] })), [{ rule: "quiz-from", quiz: "s", actual: "a..b" }]);
});

test("G10 BOM-prefixed C-1 page", async () => {
  assertIssues(await q(C1({ prefix: "﻿" })), []);
});

test("G11 chart JSON string containing </div>", async () => {
  assertIssues(await q(C1({ charts: [chart("t", LINE(2, [pt("a", { x: 3 }, 6)], { description: "a </div> b" }))] })), []);
});

test("G12 spec params not an array -> chart-schema", async () => {
  assertIssues(await q(C1({ charts: [chart("t", LINE(2, [pt("a", { x: 3 }, 6)], { params: "k" }))] })), [{ rule: "chart-schema", chart: "t" }]);
});
