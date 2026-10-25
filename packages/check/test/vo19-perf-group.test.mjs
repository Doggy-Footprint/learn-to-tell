// VO-19 (QR-2): median wall-clock of 3 CLI runs on fixture perf-group <= 5000 ms.
// Fixture per QR-2: LIBS + 3 charts of C-64 shape, x = i/100 for i = 0..2499 per (h,g) cell (10000 rows per chart, spec v2), 5 points each.
// Oracle: QR-2 threshold; point values from HGDATA arithmetic y=(h=p?10:20)+(g=a?1:2)*x.
// The run must also exit 0 with ok report so a fast-failing checker cannot satisfy the time bound (added guard, not a spec threshold).
import { test } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { chart, page } from "./fixtures/html.mjs";
import { gpt, XY } from "./fixtures/grouped.mjs";
import { runCli, tempHtml } from "./fixtures/cli.mjs";
import { assertReport } from "./fixtures/report.mjs";

const rows = [];
for (const h of ["p", "q"]) for (const g of ["a", "b"]) for (let i = 0; i < 2500; i++) rows.push({ h, g, x: i / 100 });
const POINTS = [
  gpt("p1", "c", { h: "p", g: "a", x: 1 }, 11, { tol: 1e-6 }),
  gpt("p2", "c", { h: "p", g: "b", x: 2 }, 14, { tol: 1e-6 }),
  gpt("p3", "c", { h: "q", g: "a", x: 3 }, 23, { tol: 1e-6 }),
  gpt("p4", "c", { h: "q", g: "b", x: 4 }, 28, { tol: 1e-6 }),
  gpt("p5", "c", { h: "q", g: "b", x: 5 }, 30, { tol: 1e-6 }),
];
const big = (id) => chart(id, {
  data: { values: rows },
  transform: [{ calculate: "(datum.h==='p'?10:20)+(datum.g==='a'?1:2)*datum.x", as: "y" }],
  facet: { column: { field: "h", type: "nominal" } },
  spec: { name: "c", mark: "line", encoding: { ...XY(), color: { field: "g", type: "nominal" } } },
  usermeta: { ltt: { points: POINTS } },
});

test("M2 median of 3 CLI runs on perf-group fixture <= 5000 ms", (t) => {
  const pg = page({ charts: [big("c1"), big("c2"), big("c3")] });
  const file = tempHtml(pg.html);
  const times = [];
  for (let i = 0; i < 3; i++) {
    const t = performance.now();
    const p = runCli([file]);
    times.push(performance.now() - t);
    assert.equal(p.status, 0, `exit ${p.status}: ${p.stderr}`);
    const report = JSON.parse(p.stdout);
    assertReport(report, pg.counts);
    assert.deepEqual(report.errors, []);
  }
  times.sort((a, b) => a - b);
  t.diagnostic(`median ${times[1]} ms`);
  assert.ok(times[1] <= 5000, `median ${times[1]} ms`);
});
