// VO-1 (FR-2, FR-4..FR-11, C-20..C-37), decision table over the 22 rule ids; also feeds VO-6.
// Oracle: spec 6ed8f04e251d4b22 v1 Cases text and y = k*x arithmetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LIBS, LINE, pt, chart, rawChart, choice, number, rawQuiz, C1 } from "./fixtures/html.mjs";
import { GROUPS, gpt } from "./fixtures/grouped.mjs";
import { RULE_IDS, check, assertIssues, loadIndex, absent } from "./fixtures/report.mjs";

const VEGA = '<script src="https://cdn.jsdelivr.net/npm/vega@6.4.0"></script>';
const VL = (v) => `<script src="https://cdn.jsdelivr.net/npm/vega-lite${v}"></script>`;
const nonEmptyArr = (a) => Array.isArray(a) && a.length > 0 && a.length <= 5;

test("RULES is set-equal to the 23 spec rule ids (22 baseline + point-group)", async () => {
  const { RULES } = await loadIndex();
  assert.equal(RULES.length, 23);
  assert.deepEqual([...RULES].sort(), [...RULE_IDS].sort());
});

test("clean base C-1: ok, no issues, summary per C-1", async () => {
  const r = await check(C1());
  assert.deepEqual(r, { ok: true, summary: { charts: 1, points: 2, quizzes: 2, unchecked: 0 }, errors: [], unchecked: [] });
});

test("lib-version: vega-lite@6.4.0 (C-31)", async () => {
  const src = "https://cdn.jsdelivr.net/npm/vega-lite@6.4.0";
  const r = await check(C1({ libs: VEGA + VL("@6.4.0") }));
  assertIssues(r, [{ rule: "lib-version", src, expected: "6.5.0", actual: "6.4.0" }]);
});

test("lib-source: other host vega-lite file (C-32)", async () => {
  const src = "https://example.com/js/vega-lite.min.js";
  const r = await check(C1({ libs: LIBS + `<script src="${src}"></script>` }));
  assertIssues(r, [{ rule: "lib-source", src }]);
});

test("lib-missing: chart with only vega-embed (C-33)", async () => {
  const r = await check(C1({ libs: '<script src="https://cdn.jsdelivr.net/npm/vega-embed@6.0.0"></script>' }));
  assertIssues(r, [{ rule: "lib-missing", actual: (a) => a === "vega" || a === "vega-lite" }, { rule: "lib-missing" }]);
  assert.deepEqual(r.errors.map((e) => e.actual).sort(), ["vega", "vega-lite"]);
});

test("chart-json: bad text, array JSON, non-script element; valid d unaffected (C-20)", async () => {
  const r = await check(C1({
    charts: [rawChart("a", "{bad json"), rawChart("b", "[1,2]"), rawChart("c", "", { tag: "div" }), chart("d", LINE(2, [pt("dp", { x: 3 }, 6)]))],
  }));
  assertIssues(r, [{ rule: "chart-json", chart: "a" }, { rule: "chart-json", chart: "b" }, { rule: "chart-json", chart: "c" }]);
});

test("chart-id: invalid id and second duplicate; first dup checked normally (C-21)", async () => {
  const r = await check(C1({
    charts: [
      chart("1x", LINE(2, [pt("a", { x: 3 }, 6)])),
      chart("dup", LINE(2, [pt("a", { x: 3 }, 7)])),
      chart("dup", LINE(2, [pt("a", { x: 3 }, 6)])),
    ],
  }));
  assertIssues(r, [
    { rule: "chart-id", chart: "1x", actual: "1x" },
    { rule: "point-mismatch", chart: "dup", point: "a", expected: 7, actual: 6 },
    { rule: "chart-id", chart: "dup", actual: "dup" },
  ]);
});

test("chart-schema: mark barz, no point-*/chart-build (C-22)", async () => {
  const r = await check(C1({ charts: [chart("s", LINE(2, [pt("a", { x: 3 }, 6)], { mark: "barz" }))] }));
  assertIssues(r, [{ rule: "chart-schema", chart: "s", actual: nonEmptyArr }]);
  for (const e of r.errors[0].actual) {
    assert.equal(typeof e.instancePath, "string");
    assert.equal(typeof e.message, "string");
  }
});

test("chart-url: top-level data url (C-23 a)", async () => {
  const r = await check(C1({ charts: [chart("u", LINE(2, [pt("a", { x: 3 }, 6)], { data: { url: "data.csv" } }))] }));
  assertIssues(r, [{ rule: "chart-url", chart: "u" }]);
});

test("chart-build: unknown expression function foo (C-24)", async () => {
  const r = await check(C1({ charts: [chart("e", LINE(2, [pt("a", { x: 3 }, 6)], { transform: [{ calculate: "foo(datum.x)", as: "y" }] }))] }));
  assertIssues(r, [{ rule: "chart-build", chart: "e", actual: (a) => typeof a === "string" && a.includes("foo") }]);
});

test("chart-no-points: usermeta absent, points {}, points [] (C-30)", async () => {
  const noMeta = LINE(2, []);
  delete noMeta.usermeta;
  const obj = LINE(2, []);
  obj.usermeta.ltt.points = {};
  const r = await check(C1({ charts: [chart("n1", noMeta), chart("n2", obj), chart("n3", LINE(2, []))] }));
  assertIssues(r, [{ rule: "chart-no-points", chart: "n1" }, { rule: "chart-no-points", chart: "n2" }, { rule: "chart-no-points", chart: "n3" }]);
});

test("point-invalid: each listed defect, valid points still evaluated (C-29)", async () => {
  const good = (id) => pt(id, { x: 3 }, 6);
  const noTol = good("a");
  delete noTol.tol;
  const points = [
    null, noTol, { ...good("b"), tol: -1 }, { ...good("c"), value: "6" }, { ...good("d"), where: [1] },
    { ...good("e"), params: "k" }, good("9a"), good("p"), good("p"), { ...good("f"), mark: "" },
    pt("ok", { x: 3 }, 7),
  ];
  const r = await check(C1({ charts: [chart("pi", LINE(2, points))] }));
  const inv = (i, point) => ({ rule: "point-invalid", chart: "pi", point, actual: i });
  assertIssues(r, [
    inv(0, absent), inv(1, "a"), inv(2, "b"), inv(3, "c"), inv(4, "d"), inv(5, "e"), inv(6, "9a"), inv(8, "p"), inv(9, "f"),
    { rule: "point-mismatch", chart: "pi", point: "ok", expected: 7, actual: 6 },
  ]);
});

test("point-mark: unknown mark nope (C-25)", async () => {
  const r = await check(C1({ charts: [chart("m", LINE(2, [{ ...pt("a", { x: 3 }, 6), mark: "nope" }]))] }));
  assertIssues(r, [{ rule: "point-mark", chart: "m", point: "a" }]);
});

test("point-param-unknown: zz and selection param sel (C-26)", async () => {
  const sel = LINE(2, [pt("b", { x: 3 }, 6, 0, { params: { sel: 1 } })]);
  sel.params.push({ name: "sel", select: "interval" });
  const r = await check(C1({ charts: [chart("u1", LINE(2, [pt("a", { x: 3 }, 6, 0, { params: { zz: 1 } })])), chart("u2", sel)] }));
  assertIssues(r, [
    { rule: "point-param-unknown", chart: "u1", point: "a", actual: "zz" },
    { rule: "point-param-unknown", chart: "u2", point: "b", actual: "sel" },
  ]);
});

test("point-param-range: k=5.001 outside [1,5] (C-12)", async () => {
  const r = await check(C1({ charts: [chart("r", LINE(2, [pt("a", { x: 3 }, 15.003, 0, { params: { k: 5.001 } })]))] }));
  assertIssues(r, [{ rule: "point-param-range", chart: "r", point: "a", expected: [1, 5], actual: 5.001 }]);
});

test("point-row: zero rows and two rows (C-27)", async () => {
  const two = {
    name: "dots", data: { values: [{ x: 1, y: 2 }, { x: 1, y: 3 }] }, mark: "point",
    encoding: { x: { field: "x", type: "quantitative" }, y: { field: "y", type: "quantitative" } },
    usermeta: { ltt: { points: [{ id: "b", mark: "dots", where: { x: 1 }, field: "y", value: 2, tol: 0 }] } },
  };
  const r = await check(C1({ charts: [chart("w0", LINE(2, [pt("a", { x: 9 }, 18)])), chart("w2", two)] }));
  assertIssues(r, [{ rule: "point-row", chart: "w0", point: "a", actual: 0 }, { rule: "point-row", chart: "w2", point: "b", actual: 2 }]);
});

test("point-mismatch: missing field and NaN row value (C-28)", async () => {
  const nan = LINE(2, [pt("b", { x: 3 }, 0)], { transform: [{ calculate: "sqrt(-1)", as: "y" }] });
  const r = await check(C1({ charts: [chart("f1", LINE(2, [{ ...pt("a", { x: 3 }, 6), field: "nofield" }])), chart("f2", nan)] }));
  assertIssues(r, [
    { rule: "point-mismatch", chart: "f1", point: "a", expected: 6, actual: "undefined" },
    { rule: "point-mismatch", chart: "f2", point: "b", expected: 0, actual: "NaN" },
  ]);
});

test("quiz-id: 'bad id' and second q (C-34)", async () => {
  const r = await check(C1({ quizzes: [choice("bad id", 2, 1), choice("q", 2, 1), choice("q", 2, 1)] }));
  assertIssues(r, [{ rule: "quiz-id", quiz: "bad id", actual: "bad id" }, { rule: "quiz-id", quiz: "q", actual: "q" }]);
});

test("quiz-kind: absent and text (C-34)", async () => {
  const r = await check(C1({
    quizzes: [rawQuiz('<div data-ltt-quiz="k1"><button data-ltt-option data-correct>a</button><button data-ltt-option>b</button></div>'),
      number("k2", { answer: "1", tol: "0", kind: "text" })],
  }));
  assertIssues(r, [{ rule: "quiz-kind", quiz: "k1", actual: null }, { rule: "quiz-kind", quiz: "k2", actual: "text" }]);
});

test("quiz-options: one option with data-correct (C-14)", async () => {
  const r = await check(C1({ quizzes: [choice("o1", 1, 1)] }));
  assertIssues(r, [{ rule: "quiz-options", quiz: "o1", actual: 1 }]);
});

test("quiz-correct: 0 of 3 and 2 of 2 (C-35)", async () => {
  const r = await check(C1({ quizzes: [choice("c0", 3, 0), choice("c2", 2, 2)] }));
  assertIssues(r, [{ rule: "quiz-correct", quiz: "c0", actual: 0 }, { rule: "quiz-correct", quiz: "c2", actual: 2 }]);
});

test("quiz-answer: abc, blank, absent answer; tol -1, absent tol (C-36)", async () => {
  const r = await check(C1({
    quizzes: [number("a1", { answer: "abc", tol: "0" }), number("a2", { answer: "  ", tol: "0" }), number("a3", { tol: "0" }),
      number("a4", { answer: "1", tol: "-1" }), number("a5", { answer: "1" })],
  }));
  assertIssues(r, ["a1", "a2", "a3", "a4", "a5"].map((quiz) => ({ rule: "quiz-answer", quiz })));
  assert.deepEqual(r.unchecked, []);
});

test("quiz-from: malformed and dangling references (C-37)", async () => {
  const froms = ["nochart.p1", "traj.nopoint", "traj", "traj.p1.x", ".p1"];
  const r = await check(C1({ quizzes: froms.map((from, i) => number(`f${i}`, { answer: "6", tol: "0", from })) }));
  assertIssues(r, froms.map((actual, i) => ({ rule: "quiz-from", quiz: `f${i}`, actual })));
});

test("quiz-mismatch: answer 8.5 tol 0.49 vs row 8 (C-15)", async () => {
  const r = await check(C1({ quizzes: [number("m", { answer: "8.5", tol: "0.49", from: "traj.p2" })] }));
  assertIssues(r, [{ rule: "quiz-mismatch", quiz: "m", expected: 8, actual: 8.5 }]);
});

test("point-group: grouped mark with where missing group field g (C-67 first item)", async () => {
  const r = await check(C1({ charts: [chart("g", GROUPS(2, "color", [gpt("a", "curves", { x: 2 }, 8)]))] }));
  assertIssues(r, [{ rule: "point-group", chart: "g", point: "a", expected: ["g"], actual: ["g"] }]);
});
