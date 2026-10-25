// VO-17 (FR-8, C-67, C-68, C-70, C-73), decision table for point-group. Oracle: spec fd0231d3293c45b1 v1 FR-8 / B-5:
// expected = all group fields (outermost to innermost, deduplicated), actual = missing ones in the same order.
import { test } from "node:test";
import { chart, C1 } from "./fixtures/html.mjs";
import { check, assertIssues } from "./fixtures/report.mjs";
import { GROUPS, gpt, XY, HDATA_VALUES, HDATA_CALC, hgFacet, layerFacet } from "./fixtures/grouped.mjs";

const run = (spec) => check(C1({ charts: [chart("v", spec)] }));
const pg = (expected, actual) => ({ rule: "point-group", chart: "v", point: "a", expected, actual });

test("D1 single group field missing; later point in same chart still evaluated (C-67)", async () => {
  const r = await run(GROUPS(2, "color", [gpt("a", "curves", { x: 2 }, 8), gpt("b", "curves", { x: 2, g: "b" }, 8)]));
  assertIssues(r, [pg(["g"], ["g"])]);
});

test("D2 nested, both missing (C-67)", async () => {
  assertIssues(await run(hgFacet([gpt("a", "c", { x: 1 }, 22)])), [pg(["h", "g"], ["h", "g"])]);
});

test("D3 nested, one missing, expected keeps order (C-67)", async () => {
  assertIssues(await run(hgFacet([gpt("a", "c", { x: 1, h: "q" }, 22)])), [pg(["h", "g"], ["g"])]);
});

test("D4 duplicate group field deduplicated (C-70)", async () => {
  const spec = {
    data: { values: ["a", "b"].flatMap((g) => [0, 1, 2].map((x) => ({ x, g }))) },
    transform: [{ calculate: "(datum.g==='a'?1:2)*2*datum.x", as: "y" }],
    facet: { column: { field: "g", type: "nominal" } },
    spec: { name: "c", mark: "line", encoding: { ...XY(), color: { field: "g", type: "nominal" } } },
    usermeta: { ltt: { points: [gpt("a", "c", { x: 1 }, 4)] } },
  };
  assertIssues(await run(spec), [pg(["g"], ["g"])]);
});

test("D5 point-mark precedes point-group (C-68)", async () => {
  assertIssues(await run(GROUPS(2, "color", [gpt("a", "nope", { x: 2 }, 8)])), [{ rule: "point-mark", chart: "v", point: "a", actual: "nope" }]);
});

test("D6 point-group precedes point-param-unknown (C-68)", async () => {
  assertIssues(await run(GROUPS(2, "color", [gpt("a", "curves", { x: 2 }, 8, { params: { zz: 1 } })])), [pg(["g"], ["g"])]);
});

test("D7 all group fields present in any key order -> no point-group (C-73)", async () => {
  assertIssues(await run(GROUPS(2, "color", [gpt("a", "curves", { x: 2, g: "b" }, 8), gpt("b", "curves", { g: "b", x: 2 }, 8)])), []);
  assertIssues(await run(hgFacet([gpt("a", "c", { g: "b", x: 1, h: "q" }, 22), gpt("b", "c", { x: 1, h: "q", g: "b" }, 22)])), []);
});

test("D8 other structures: detail, encoding-facet unit, 2-D facet + layer (C-74)", async () => {
  assertIssues(await run(GROUPS(2, "detail", [gpt("a", "curves", { x: 2 }, 8)])), [pg(["g"], ["g"])]);
  const unit = { name: "f", data: { values: HDATA_VALUES() }, transform: [HDATA_CALC], mark: "point",
    encoding: { column: { field: "h", type: "nominal" }, ...XY() }, usermeta: { ltt: { points: [gpt("a", "f", { x: 1 }, 21)] } } };
  assertIssues(await run(unit), [pg(["h"], ["h"])]);
  assertIssues(await run(layerFacet([gpt("a", "A", { h: "p" }, 10)])), [pg(["h", "x"], ["x"])]);
});

test("D9 later point still evaluated after a point-group (C-75)", async () => {
  const r = await run(GROUPS(2, "color", [gpt("a", "curves", { x: 2 }, 8), gpt("b", "curves", { x: 2, g: "b" }, 9)]));
  assertIssues(r, [pg(["g"], ["g"]), { rule: "point-mismatch", chart: "v", point: "b", expected: 9, actual: 8 }]);
});
