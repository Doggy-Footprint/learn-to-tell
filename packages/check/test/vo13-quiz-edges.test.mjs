// VO-13 (FR-10, FR-11, C-4, C-5, C-50..C-53), equivalence partitions E1..E7; also feeds VO-6.
// Oracle: spec 6ed8f04e251d4b22 v1 Cases C-4, C-5, C-50..C-53; y = 2*x arithmetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LINE, pt, chart, choice, number, page, C1 } from "./fixtures/html.mjs";
import { check, assertIssues, quietCheckHtml, assertReport } from "./fixtures/report.mjs";

test("E1 nested quiz: outer counts only its own options (C-50)", async () => {
  const inner = choice("inner", 2, 1);
  const outer = choice("outer", 2, 1, inner.html);
  const r = await check(C1({ quizzes: [{ html: outer.html, quizzes: 2 }] }));
  assertIssues(r, []);
});

test("E2 number quiz without data-from -> unchecked no-from (C-4)", async () => {
  const r = await check(C1({ quizzes: [number("q3", { answer: "5", tol: "0" })] }));
  assert.deepEqual(r, { ok: true, summary: { charts: 1, points: 2, quizzes: 3, unchecked: 1 }, errors: [], unchecked: [{ quiz: "q3", reason: "no-from" }] });
});

test("E3 linked to schema-failed chart; E4 linked to invalid point (C-51)", async () => {
  const noTol = pt("p9", { x: 3 }, 6);
  delete noTol.tol;
  const r = await check(C1({
    charts: [chart("bad", LINE(2, [pt("p1", { x: 3 }, 6)], { mark: "barz" })), chart("ok", LINE(2, [noTol]))],
    quizzes: [number("l1", { answer: "6", tol: "0", from: "bad.p1" }), number("l2", { answer: "6", tol: "0", from: "ok.p9" })],
  }));
  assert.deepEqual(r.errors.map((e) => e.rule), ["chart-schema", "point-invalid"]);
  assert.deepEqual(r.unchecked, [{ quiz: "l1", reason: "linked-point-unevaluated" }, { quiz: "l2", reason: "linked-point-unevaluated" }]);
});

test("E5 linked to mismatched point compares against row value 6 (C-52)", async () => {
  const r = await check(C1({
    charts: [chart("mm", LINE(2, [pt("pm", { x: 3 }, 7)]))],
    quizzes: [number("r6", { answer: "6", tol: "0", from: "mm.pm" }), number("r7", { answer: "7", tol: "0", from: "mm.pm" })],
  }));
  assertIssues(r, [
    { rule: "point-mismatch", chart: "mm", point: "pm", expected: 7, actual: 6 },
    { rule: "quiz-mismatch", quiz: "r7", expected: 6, actual: 7 },
  ]);
});

test("E6 plain text page: ok, zero counts, no lib-missing (C-5)", async () => {
  const r = await check(page({ libs: "" }));
  assert.deepEqual(r, { ok: true, summary: { charts: 0, points: 0, quizzes: 0, unchecked: 0 }, errors: [], unchecked: [] });
});

test("E7 unclosed tags: quiz-options 0 and quiz-correct 0 (C-53)", async () => {
  const r = await quietCheckHtml('<div data-ltt-quiz="q" data-kind="choice"><p>');
  assertReport(r, { charts: 0, points: 0, quizzes: 1 });
  assertIssues(r, [{ rule: "quiz-options", quiz: "q", actual: 0 }, { rule: "quiz-correct", quiz: "q", actual: 0 }]);
});
