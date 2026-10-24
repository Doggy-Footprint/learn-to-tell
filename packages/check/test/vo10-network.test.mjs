// VO-10 (QR-6, FR-3, C-23, C-1): recording fetch stub and http/https spies installed BEFORE importing
// index.mjs, so module-load-time captures of these functions are also observed. N1..N4.
// Oracle: QR-6 threshold 0 calls; C-23 expected chart-url per chart.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire, syncBuiltinESMExports } from "node:module";

const require = createRequire(import.meta.url);
const calls = [];
globalThis.fetch = (...a) => {
  calls.push(["fetch", a]);
  return Promise.reject(new Error("network disabled in test"));
};
for (const name of ["http", "https"]) {
  const m = require(`node:${name}`);
  for (const fn of ["request", "get"]) {
    m[fn] = (...a) => {
      calls.push([`${name}.${fn}`, a]);
      throw new Error("network disabled in test");
    };
  }
}
syncBuiltinESMExports();

const { LINE, pt, chart, C1 } = await import("./fixtures/html.mjs");
const { check, assertIssues } = await import("./fixtures/report.mjs");

const P = () => [pt("a", { x: 3 }, 6)];
const cases = {
  N1: () => chart("n1", LINE(2, P(), { data: { url: "data.csv" } })),
  N2: () => chart("n2", {
    layer: [{ name: "curve", data: { url: "https://x/y.json" }, mark: "line",
      encoding: { x: { field: "x", type: "quantitative" }, y: { field: "y", type: "quantitative" } } }],
    usermeta: { ltt: { points: P() } },
  }),
  N3: () => chart("n3", LINE(2, P(), { transform: [{ calculate: "k*datum.x", as: "y" }, { lookup: "x", from: { data: { url: "z.csv" }, key: "k", fields: ["f"] } }] })),
};

for (const [id, mk] of Object.entries(cases)) {
  test(`${id}: chart-url, no build, zero network calls`, async () => {
    calls.length = 0;
    const c = mk();
    const r = await check(C1({ charts: [c] }));
    assertIssues(r, [{ rule: "chart-url", chart: `n${id[1]}` }]);
    assert.deepEqual(calls, []);
  });
}

test("N4 normal C-1 point evaluation: zero network calls", async () => {
  calls.length = 0;
  assertIssues(await check(C1()), []);
  assert.deepEqual(calls, []);
});
