// VO-18 (FR-8, UI-3, C-66, C-69, C-71, C-72), error guessing G13..G16: wrong-pass guards and regression.
// Oracle: spec fd0231d3293c45b1 v1 Cases and Errors (rows not drawn are not rows; baseline results unchanged).
import { test } from "node:test";
import assert from "node:assert/strict";
import { LINE, pt, chart, C1 } from "./fixtures/html.mjs";
import { check, assertIssues } from "./fixtures/report.mjs";
import { GROUPS, gpt, Q, HDATA_VALUES, layerFacet } from "./fixtures/grouped.mjs";

const run = (spec) => check(C1({ charts: [chart("v", spec)] }));
const row0 = { rule: "point-row", chart: "v", point: "a", actual: 0 };

test("G13 row filtered out by facet-local transform: B h=p x=0 -> point-row 0 (C-66)", async () => {
  assertIssues(await run(layerFacet([gpt("a", "B", { h: "p", x: 0 }, 10)])), [row0]);
});

test("G14 empty facet cell: A h=q x=1 with that row removed -> point-row 0 (C-71)", async () => {
  const values = HDATA_VALUES().filter((r) => !(r.x === 1 && r.h === "q"));
  assertIssues(await run(layerFacet([gpt("a", "A", { h: "q", x: 1 }, 21)], values)), [row0]);
});

test("G15 group value that does not exist -> point-row 0 (C-69)", async () => {
  assertIssues(await run(GROUPS(2, "color", [gpt("a", "curves", { x: 2, g: "z" }, 8)])), [row0]);
});

test("G16 baseline C-2 layer with top-level datasets unchanged (no point-group)", async () => {
  const spec = {
    layer: [
      { name: "bars", data: { values: [{ c: "a", v: 1 }, { c: "a", v: 2 }, { c: "b", v: 5 }] }, mark: "bar",
        encoding: { x: { field: "c", type: "nominal" }, y: { aggregate: "sum", field: "v", type: "quantitative" } } },
      { name: "curve", data: { sequence: { start: 0, stop: 4, step: 1, as: "x" } }, transform: [{ calculate: "2*datum.x", as: "y" }],
        mark: "line", encoding: { x: Q("x"), y: Q("y") } },
    ],
    usermeta: { ltt: { points: [{ id: "s", mark: "bars", where: { c: "a" }, field: "sum_v", value: 3, tol: 0 }, pt("c", { x: 3 }, 6)] } },
  };
  assertIssues(await run(spec), []);
});

test("G16 baseline C-9 empty where on ungrouped one-row data unchanged", async () => {
  const spec = { name: "one", data: { values: [{ v: 7 }] }, mark: "point", encoding: { x: Q("v") },
    usermeta: { ltt: { points: [{ id: "a", mark: "one", where: {}, field: "v", value: 7, tol: 0 }] } } };
  assertIssues(await run(spec), []);
});

test("G16 baseline C-28 line NaN row -> point-mismatch actual \"NaN\", no point-group", async () => {
  const r = await run(LINE(2, [pt("a", { x: 3 }, 0)], { transform: [{ calculate: "sqrt(-1)", as: "y" }] }));
  assertIssues(r, [{ rule: "point-mismatch", chart: "v", point: "a", expected: 0, actual: "NaN" }]);
  assert.ok(r.errors.every((e) => e.rule !== "point-group"));
});
