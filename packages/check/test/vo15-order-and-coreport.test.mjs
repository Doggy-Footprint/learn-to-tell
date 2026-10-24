// VO-15 (FR-1 order, FR-2 always-on lib rules, FR-4, FR-5, QR-4 cap; C-43..C-48), partitions O1..O6; feeds VO-6.
// Oracle: spec 6ed8f04e251d4b22 v3 Cases C-43..C-48; y = k*x arithmetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LINE, pt, chart, rawChart, choice, page, C1, C1_POINTS, C1_QUIZZES } from "./fixtures/html.mjs";
import { check, assertIssues } from "./fixtures/report.mjs";

const s = (src) => `<script src="${src}"></script>`;
const VL64 = "https://cdn.jsdelivr.net/npm/vega-lite@6.4.0";

test("O1 cross-category order: lib-version (end of body), point-mismatch, quiz-correct (C-43)", async () => {
  const r = await check(page({
    libs: s("https://cdn.jsdelivr.net/npm/vega@6.4.0"),
    charts: [chart("t", LINE(2, [pt("a", { x: 3 }, 7)]))],
    quizzes: [choice("qa", 3, 0), { html: s(VL64), quizzes: 0 }],
  }));
  assertIssues(r, [
    { rule: "lib-version", src: VL64, expected: "6.5.0", actual: "6.4.0" },
    { rule: "point-mismatch", chart: "t", point: "a", expected: 7, actual: 6 },
    { rule: "quiz-correct", quiz: "qa", actual: 0 },
  ]);
});

test("O2 div chart with invalid id: chart-json then chart-id (C-44)", async () => {
  const r = await check(C1({ charts: [rawChart("1x", "{}", { tag: "div" })] }));
  assertIssues(r, [{ rule: "chart-json", chart: "1x" }, { rule: "chart-id", chart: "1x", actual: "1x" }]);
});

test("O3 url and schema failure: chart-url then chart-schema, no chart-build (C-45)", async () => {
  const r = await check(C1({ charts: [chart("u", LINE(2, [pt("a", { x: 3 }, 6)], { mark: "barz", data: { url: "d.csv" } }))] }));
  assertIssues(r, [{ rule: "chart-url", chart: "u" }, { rule: "chart-schema", chart: "u" }]);
});

test("O4 type Application/JSON accepted, points evaluated as C-1 (C-46)", async () => {
  const r = await check(page({ charts: [rawChart("traj", JSON.stringify(LINE(2, C1_POINTS())), { type: "Application/JSON" })], quizzes: C1_QUIZZES() }));
  assert.deepEqual(r, { ok: true, summary: { charts: 1, points: 2, quizzes: 2, unchecked: 0 }, errors: [], unchecked: [] });
});

test("O5 no chart: lib-version and lib-source still reported, no lib-missing (C-47)", async () => {
  const other = "https://example.com/vega.js";
  const r = await check(page({ libs: s(VL64) + s(other) }));
  assertIssues(r, [{ rule: "lib-version", src: VL64, expected: "6.5.0", actual: "6.4.0" }, { rule: "lib-source", src: other }]);
});

test("O6 400-char unknown param key: message within 1..300 (C-48)", async () => {
  const key = "z".repeat(400);
  const r = await check(C1({ charts: [chart("p", LINE(2, [pt("a", { x: 3 }, 6, 0, { params: { [key]: 1 } })]))] }));
  assertIssues(r, [{ rule: "point-param-unknown", chart: "p", point: "a", actual: key }]);
  assert.ok(r.errors[0].message.length >= 1 && r.errors[0].message.length <= 300);
});
