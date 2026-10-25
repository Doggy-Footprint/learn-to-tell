// VO-5 (FR-8, C-2, C-3, C-8, C-9, C-25), equivalence partitions P1..P8 of mark resolution; also feeds VO-6.
// Oracle: spec 6ed8f04e251d4b22 v1 HTML contract "mark" clause, Cases; arithmetic sums and y = k*x.
import { test } from "node:test";
import { LINE, pt, chart, C1 } from "./fixtures/html.mjs";
import { check, assertIssues } from "./fixtures/report.mjs";
import { HDATA_VALUES, HDATA_CALC } from "./fixtures/grouped.mjs";

const Q = (f) => ({ field: f, type: "quantitative" });
const one = (spec) => check(C1({ charts: [chart("v", spec)] }));

test("P1 top-level unit: point on LINE(2) x=3 -> 6", async () => {
  assertIssues(await one(LINE(2, [pt("a", { x: 3 }, 6)])), []);
});

test("P2 layer + P4 aggregate sum_v (C-2)", async () => {
  const spec = {
    layer: [
      { name: "bars", data: { values: [{ c: "a", v: 1 }, { c: "a", v: 2 }, { c: "b", v: 5 }] }, mark: "bar",
        encoding: { x: { field: "c", type: "nominal" }, y: { aggregate: "sum", field: "v", type: "quantitative" } } },
      { name: "curve", data: { sequence: { start: 0, stop: 4, step: 1, as: "x" } }, transform: [{ calculate: "2*datum.x", as: "y" }],
        mark: "line", encoding: { x: Q("x"), y: Q("y") } },
    ],
    usermeta: { ltt: { points: [{ id: "s", mark: "bars", where: { c: "a" }, field: "sum_v", value: 3, tol: 0 }, pt("c", { x: 3 }, 6)] } },
  };
  assertIssues(await one(spec), []);
});

test("P3 hconcat left/right (C-3)", async () => {
  const unit = (name, a, b) => ({ name, data: { values: [{ a, b }] }, mark: "point", encoding: { x: Q("a"), y: Q("b") } });
  const spec = {
    hconcat: [unit("left", 1, 10), unit("right", 2, 20)],
    usermeta: { ltt: { points: [
      { id: "l", mark: "left", where: { a: 1 }, field: "b", value: 10, tol: 0 },
      { id: "r", mark: "right", where: { a: 2 }, field: "b", value: 20, tol: 0 },
    ] } },
  };
  assertIssues(await one(spec), []);
});

test("P5 defaults without params: LINE(3) x=3 -> 9 (C-8 v2)", async () => {
  assertIssues(await one(LINE(3, [pt("a", { x: 3 }, 9)])), []);
});

test("P6 empty where on single-row dataset (C-9)", async () => {
  const spec = { name: "one", data: { values: [{ v: 7 }] }, mark: "point", encoding: { x: Q("v") },
    usermeta: { ltt: { points: [{ id: "a", mark: "one", where: {}, field: "v", value: 7, tol: 0 }] } } };
  assertIssues(await one(spec), []);
});

test("P7 unknown mark (C-25)", async () => {
  assertIssues(await one(LINE(2, [{ ...pt("a", { x: 3 }, 6), mark: "nope" }])), [{ rule: "point-mark", chart: "v", point: "a" }]);
});

test("P8 encoding-facet unit: mark f and f_child both resolve and pass (C-25 v1)", async () => {
  const spec = { name: "f", data: { values: HDATA_VALUES() }, transform: [HDATA_CALC], mark: "point",
    encoding: { column: { field: "h", type: "nominal" }, x: Q("x"), y: Q("y") },
    usermeta: { ltt: { points: [
      { id: "a", mark: "f", where: { h: "q", x: 1 }, field: "y", value: 21, tol: 0 },
      { id: "b", mark: "f_child", where: { h: "q", x: 1 }, field: "y", value: 21, tol: 0 },
    ] } } };
  assertIssues(await one(spec), []);
});

test("P8 negative control: f and f_child with value 22 -> point-mismatch actual 21", async () => {
  const spec = { name: "f", data: { values: HDATA_VALUES() }, transform: [HDATA_CALC], mark: "point",
    encoding: { column: { field: "h", type: "nominal" }, x: Q("x"), y: Q("y") },
    usermeta: { ltt: { points: [
      { id: "a", mark: "f", where: { h: "q", x: 1 }, field: "y", value: 22, tol: 0 },
      { id: "b", mark: "f_child", where: { h: "q", x: 1 }, field: "y", value: 22, tol: 0 },
    ] } } };
  assertIssues(await one(spec), [
    { rule: "point-mismatch", chart: "v", point: "a", expected: 22, actual: 21 },
    { rule: "point-mismatch", chart: "v", point: "b", expected: 22, actual: 21 },
  ]);
});
