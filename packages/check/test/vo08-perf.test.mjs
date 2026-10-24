// VO-8 (QR-2): median wall-clock of 3 CLI runs on the perf fixture <= 5000 ms.
// Oracle: QR-2 threshold and fixture definition.
import { test } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { LINE, pt, chart, choice, number, page } from "./fixtures/html.mjs";
import { runCli, tempHtml } from "./fixtures/cli.mjs";

const big = (id) => chart(id, LINE(2, [1, 2, 3, 4, 5].map((x) => pt(`p${x}`, { x }, 2 * x, 1e-6)), { data: { sequence: { start: 0, stop: 100, step: 0.01, as: "x" } } }));

test("M1 median of 3 CLI runs on perf fixture <= 5000 ms", () => {
  const pg = page({
    charts: [big("c1"), big("c2"), big("c3")],
    quizzes: [choice("q1", 3, 1), choice("q2", 2, 1), number("q3", { answer: "2", tol: "0.001", from: "c1.p1" }), number("q4", { answer: "4", tol: "0.001", from: "c2.p2" })],
  });
  const file = tempHtml(pg.html);
  const times = [];
  for (let i = 0; i < 3; i++) {
    const t = performance.now();
    const p = runCli([file]);
    times.push(performance.now() - t);
    assert.ok(p.status === 0 || p.status === 1, `exit ${p.status}: ${p.stderr}`);
  }
  times.sort((a, b) => a - b);
  assert.ok(times[1] <= 5000, `median ${times[1]} ms`);
});
