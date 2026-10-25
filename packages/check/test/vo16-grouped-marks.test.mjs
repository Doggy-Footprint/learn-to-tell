// VO-16 (FR-8, C-60..C-65), equivalence partitioning Q1..Q10 of grouped and faceted mark structures.
// Oracle: spec fd0231d3293c45b1 v1 arithmetic (GROUPS, HDATA, HGDATA). Each item also runs a wrong-value control
// (value+1 must yield point-mismatch with the arithmetic row value) so an ignored value or constant pass is rejected.
import { test } from "node:test";
import { chart, C1 } from "./fixtures/html.mjs";
import { check, assertIssues } from "./fixtures/report.mjs";
import { GROUPS, gpt, XY, hFacet, hgFacet, layerFacet } from "./fixtures/grouped.mjs";

async function passes(label, build, mark, where, value, more = {}) {
  const ok = await check(C1({ charts: [chart("v", build([gpt("a", mark, where, value, more)]))] }));
  assertIssues(ok, []);
  const bad = await check(C1({ charts: [chart("v", build([gpt("a", mark, where, value + 1, more)]))] }));
  assertIssues(bad, [{ rule: "point-mismatch", chart: "v", point: "a", expected: value + 1, actual: value }]);
}

test("Q1 color line: g=b x=2 k=2 -> 8 (C-60)", () => passes("Q1", (p) => GROUPS(2, "color", p), "curves", { x: 2, g: "b" }, 8));
test("Q2 param change on grouped line: k=3 g=a x=1 -> 3 (C-60)", () => passes("Q2", (p) => GROUPS(2, "color", p), "curves", { x: 1, g: "a" }, 3, { params: { k: 3 } }));
test("Q3 detail line -> 8 (C-61)", () => passes("Q3", (p) => GROUPS(2, "detail", p), "curves", { x: 2, g: "b" }, 8));
test("Q4 strokeDash line -> 8 (C-61)", () => passes("Q4", (p) => GROUPS(2, "strokeDash", p), "curves", { x: 2, g: "b" }, 8));
test("Q5 color area -> 8 (C-61)", () => passes("Q5", (p) => GROUPS(2, "color", p, { mark: "area" }), "curves", { x: 2, g: "b" }, 8));
test("Q6 facet operator with named child: cell h=q x=1 -> 21 (C-62)", () =>
  passes("Q6", (p) => hFacet({ name: "cell", mark: "line", encoding: XY() }, p), "cell", { h: "q", x: 1 }, 21));
test("Q7 facet operator unnamed child resolves through f: h=p x=1 -> 11 (C-63)", () =>
  passes("Q7", (p) => hFacet({ mark: "line", encoding: XY() }, p, { name: "f" }), "f", { h: "p", x: 1 }, 11));
test("Q8 facet + color nested: h=q g=b x=1 -> 22 (C-64)", () => passes("Q8", (p) => hgFacet(p), "c", { h: "q", g: "b", x: 1 }, 22));
test("Q9 facet + layer, 2-D facet, line A h=p x=0 -> 10 (C-65)", () => passes("Q9", (p) => layerFacet(p), "A", { h: "p", x: 0 }, 10));
test("Q10 point layer with local filter in facet, B h=q x=0 -> 20 (C-65)", () => passes("Q10", (p) => layerFacet(p), "B", { h: "q", x: 0 }, 20));
