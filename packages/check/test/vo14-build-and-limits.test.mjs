// VO-14 (FR-6, FR-2, QR-4, C-32 relative src, C-40, C-41, C-42), equivalence partitions X1..X4; feeds VO-6.
// Oracle: spec 6ed8f04e251d4b22 v2 Cases C-32, C-40..C-42; y = k*x arithmetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LIBS, LINE, pt, chart, C1 } from "./fixtures/html.mjs";
import { check, assertIssues, absent } from "./fixtures/report.mjs";

const calc = (expr) => ({ transform: [{ calculate: expr, as: "y" }] });

test("X1 dataflow evaluation error at default build: chart-build without point (C-40)", async () => {
  const r = await check(C1({ charts: [chart("x1", LINE(2, [pt("a", { x: 3 }, 6)], calc("datum.nope.a")))] }));
  assertIssues(r, [{ rule: "chart-build", chart: "x1", point: absent }]);
});

test("X2 point-only build failure: chart-build with point a, nothing for b (C-41)", async () => {
  const spec = LINE(2, [pt("a", { x: 3 }, 12, 0, { params: { k: 4 } }), pt("b", { x: 3 }, 6)], calc("k > 3 ? datum.nope.a : k*datum.x"));
  const r = await check(C1({ charts: [chart("x2", spec)] }));
  assertIssues(r, [{ rule: "chart-build", chart: "x2", point: "a" }]);
});

test("X3 relative src is lib-source (C-32 third input)", async () => {
  const src = "vendor/vega-lite.min.js";
  const r = await check(C1({ libs: LIBS + `<script src="${src}"></script>` }));
  assertIssues(r, [{ rule: "lib-source", src }]);
});

test("X4 message capped at 300 chars for a 401-char chart id (C-42)", async () => {
  const id = "c" + "x".repeat(400);
  const r = await check(C1({ charts: [chart(id, LINE(2, [pt("a", { x: 3 }, 7)]))] }));
  assertIssues(r, [{ rule: "point-mismatch", chart: id, point: "a", expected: 7, actual: 6 }]);
  assert.ok(r.errors[0].message.length <= 300);
});
