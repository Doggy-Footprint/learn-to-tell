// VO-6 R-deterministic (FR-1): two runs of C-1 and C-20 stringify identically. The per-Report
// conformance part of VO-6 is fixtures/report.mjs assertReport, applied by check() in VO-1..VO-5, VO-7, VO-13.
// Oracle: FR-1 byte-identical clause.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LINE, pt, chart, rawChart, C1 } from "./fixtures/html.mjs";
import { check } from "./fixtures/report.mjs";

const C20 = () => C1({ charts: [rawChart("a", "{bad json"), rawChart("b", "[1,2]"), rawChart("c", "", { tag: "div" }), chart("d", LINE(2, [pt("dp", { x: 3 }, 6)]))] });

for (const [name, mk] of [["C-1", () => C1()], ["C-20", C20]]) {
  test(`R-deterministic ${name}`, async () => {
    const a = JSON.stringify(await check(mk()));
    const b = JSON.stringify(await check(mk()));
    assert.equal(a, b);
  });
}
