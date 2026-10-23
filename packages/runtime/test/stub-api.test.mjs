// VO-5 (FR-10..FR-12) createApi/load; VO-6 (FR-19, C-16..C-22, helper Errors); VO-1 runtime usage of the positive fixture (QR-1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { STUB, API_MEMBERS, input, near } from "./fixtures/helpers.mjs";

const { createApi, load } = await import(STUB);

test("VO-5 createApi exposes all 48 Api members as functions", () => {
  const { api } = createApi();
  assert.equal(API_MEMBERS.length, 48);
  for (const k of API_MEMBERS) assert.equal(typeof api[k], "function", k);
});

test("VO-5 generic descriptor: kind, args, id from last object argument", () => {
  const { api } = createApi();
  const d = api.arrow([0, 0], [1, 1], { id: "v", tone: "focus" });
  assert.equal(d.kind, "arrow");
  assert.deepEqual(d.args, [[0, 0], [1, 1], { id: "v", tone: "focus" }]);
  assert.equal(d.id, "v");
  assert.equal(api.dot([1, 2]).id, undefined);
  assert.deepEqual(api.dot([1, 2]).args, [[1, 2]]);
  assert.equal(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }).kind, "cartesian");
});
test("VO-5 v4 circle and legend descriptors", () => {
  const { api } = createApi();
  const c = api.circle([1, 2], 3, { id: "c1", fill: "soft" });
  assert.equal(c.kind, "circle");
  assert.deepEqual(c.args, [[1, 2], 3, { id: "c1", fill: "soft" }]);
  assert.equal(c.id, "c1");
  const entries = [{ tone: "series1", text: "a" }];
  const l = api.legend(entries, { id: "lg", at: [0, 0] });
  assert.equal(l.kind, "legend");
  assert.deepEqual(l.args, [entries, { id: "lg", at: [0, 0] }]);
  assert.equal(l.id, "lg");
  assert.equal(api.legend(entries).id, undefined);
});
test("VO-5 node id is first argument", () => {
  const { api } = createApi();
  const n = api.node("n1", "root", { shape: "box" });
  assert.equal(n.kind, "node");
  assert.equal(n.id, "n1");
});
test("VO-5 edge id default '<from>-><to>' and explicit o.id", () => {
  const { api } = createApi();
  assert.equal(api.edge("a", "b").id, "a->b");
  assert.equal(api.edge("a", "b", { directed: true }).id, "a->b");
  assert.equal(api.edge("a", "b", { id: "e1" }).id, "e1");
});
test("VO-5 helpers compute instead of returning descriptors", () => {
  const { api } = createApi();
  assert.equal(api.interpolate([0, 1], [0, 10], 0.5), 5);
  assert.equal(typeof api.rng(1)(), "number");
});
test("VO-5 usage counts calls per member", () => {
  const { api, usage } = createApi();
  api.dot([0, 0]); api.dot([1, 1]); api.line([[0, 0]]); api.interpolate([0, 1], [0, 1], 0);
  assert.equal(usage.get("dot"), 2);
  assert.equal(usage.get("line"), 1);
  assert.equal(usage.get("interpolate"), 1);
  assert.ok(!usage.get("arrow"));
});
test("VO-5 load returns the input passed to lesson() and run merges params over defaults", () => {
  let captured;
  const factory = (api) => { captured = input({ models: { m: api.model({ a: 1, b: 2 }, (p) => ({ ...p }), "id") } }); return api.lesson(captured); };
  const l = load(factory);
  assert.deepEqual(l.input, captured);
  assert.deepEqual(l.run("m"), { a: 1, b: 2 });
  assert.deepEqual(l.run("m", { b: 5 }), { a: 1, b: 5 });
  assert.deepEqual(l.run("m"), { a: 1, b: 2 }, "run does not mutate defaults");
});
test("VO-5 run with unknown model name throws Error naming it", () => {
  const l = load((api) => api.lesson(input()));
  assert.throws(() => l.run("ghost"), (e) => e instanceof Error && /ghost/.test(e.message));
});

test("VO-1/QR-1 positive fixture uses all 48 Api members (factory + model fns + draws)", async () => {
  const factory = (await import("./types/positive-all-members.js")).default;
  const { api, usage } = createApi();
  let inp;
  factory(new Proxy(api, { get: (o, k) => (k === "lesson" ? (x) => { inp = x; return o.lesson(x); } : o[k]) }));
  const outs = Object.fromEntries(Object.entries(inp.models).map(([k, md]) => [k, md.args[1](md.args[0])]));
  for (const fig of Object.values(inp.figures)) {
    if (fig.kind !== "figure") continue;
    for (const t of [0, 2]) fig.args[1](outs, t, { step: 1, params: {} });
  }
  assert.deepEqual(API_MEMBERS.filter((k) => !(usage.get(k) > 0)), []);
});

// VO-6 helpers
const { api } = createApi();
test("VO-6 C-16 ode y'=-y RK4 dt 0.01: |at(1) - e^-1| <= 1e-8", () => {
  const s = api.ode((t, y) => [-y[0]], [1], [0, 1], 0.01);
  assert.ok(near(s.at(1)[0], Math.exp(-1), 1e-8), String(s.at(1)[0]));
});
test("VO-6 C-17(v2) free fall from 10 m, event y[0]: last t = sqrt(20/9.8) ±1e-5, y ±1e-9", () => {
  const s = api.ode((t, y) => [y[1], -9.8], [10, 0], [0, 5], 0.001, { event: (t, y) => y[0] });
  assert.ok(near(s.end.t, Math.sqrt(20 / 9.8), 1e-5), String(s.end.t));
  assert.ok(near(s.end.y[0], 0, 1e-9), String(s.end.y[0]));
  const last = s.points[s.points.length - 1];
  assert.equal(last.t, s.end.t);
  assert.ok(s.points.every((p) => p.t <= s.end.t));
});
for (const [name, dt, span] of [["dt 0", 0, [0, 1]], ["dt < 0", -0.1, [0, 1]], ["span equal", 0.1, [1, 1]], ["span reversed", 0.1, [1, 0]]]) {
  test(`VO-6 ode RangeError: ${name}`, () => {
    assert.throws(() => api.ode(() => [0], [0], span, dt), RangeError);
  });
}
test("VO-6 Series at inside/outside, until, end, xy", () => {
  const s = api.ode(() => [1, 2], [0, 0], [0, 1], 0.1);
  assert.ok(near(s.at(0.55)[0], 0.55, 1e-9));
  assert.ok(near(s.at(-1)[0], 0, 1e-12), "before start -> first value");
  assert.ok(near(s.at(5)[0], 1, 1e-9), "after end -> last value");
  const u = s.until(0.55);
  assert.equal(u.length, 7);
  assert.ok(near(u[6].t, 0.55, 1e-12) && near(u[6].y[0], 0.55, 1e-9));
  assert.ok(u.slice(0, 6).every((p) => p.t <= 0.55));
  assert.ok(near(s.end.t, 1, 1e-9) && near(s.end.y[1], 2, 1e-9));
  const xy = s.xy();
  assert.equal(xy.length, s.points.length);
  assert.ok(xy.every(([x, y]) => near(y, 2 * x, 1e-9)));
  assert.ok(s.xy(1, 0).every(([x, y]) => near(x, 2 * y, 1e-9)));
  const up = s.xy(0, 1, 0.5);
  assert.ok(up.length < xy.length && up.length >= 6);
  assert.ok(up.every(([x]) => x <= 0.5 + 1e-9));
});

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
test("VO-6 C-18 rng determinism, range [0,1), seed difference, mulberry32", () => {
  const take = (r) => Array.from({ length: 10 }, r);
  const a = take(api.rng(7)), b = take(api.rng(7)), c = take(api.rng(8));
  assert.deepEqual(a, b);
  assert.ok(a.every((v) => v >= 0 && v < 1));
  assert.notDeepEqual(a, c);
  assert.deepEqual(a, take(mulberry32(7)));
});
test("VO-6 C-19 argmax -(x-3)^2 on [0,10] -> |x-3| <= 1e-3", () => {
  const r = api.argmax((x) => -((x - 3) ** 2), [0, 10]);
  assert.ok(near(r.x, 3, 1e-3), String(r.x));
  assert.ok(near(r.y, -((r.x - 3) ** 2), 1e-12));
});
test("VO-6 root bisection finds x-1 on [0,3]; C-20 same-sign RangeError", () => {
  assert.ok(near(api.root((x) => x - 1, [0, 3], { tol: 1e-9 }), 1, 1e-6));
  assert.ok(near(api.root((x) => x * x - 2, [0, 2], { tol: 1e-9 }), Math.SQRT2, 1e-6));
  assert.throws(() => api.root((x) => x * x + 1, [-1, 1]), RangeError);
});
test("VO-6 sample normal n=10000 mean within 0.05 sigma; uniform within range", () => {
  const xs = api.sample(api.rng(1), 10000, { normal: [5, 2] });
  assert.equal(xs.length, 10000);
  const mean = xs.reduce((s, v) => s + v, 0) / xs.length;
  assert.ok(Math.abs(mean - 5) <= 0.05 * 2, String(mean));
  const sd = Math.sqrt(xs.reduce((s, v) => s + (v - mean) ** 2, 0) / xs.length);
  assert.ok(sd > 1.8 && sd < 2.2, `sd ${sd}`);
  const us = api.sample(api.rng(2), 1000, { uniform: [2, 3] });
  assert.equal(us.length, 1000);
  assert.ok(us.every((v) => v >= 2 && v <= 3));
  assert.ok(new Set(us).size > 900);
});
test("VO-6 C-21 histogram boundaries: [0,5,10,10.0001] bins 2 range [0,10] -> [1,2]", () => {
  const h = api.histogram([0, 5, 10, 10.0001], { bins: 2, range: [0, 10] });
  assert.deepEqual(h.map((b) => b.count), [1, 2]);
  assert.deepEqual(h.map((b) => [b.x0, b.x1]), [[0, 5], [5, 10]]);
  assert.deepEqual(api.histogram([-0.1], { bins: 1, range: [0, 1] }).map((b) => b.count), [0]);
});
for (const [name, o] of [["bins 0", { bins: 0, range: [0, 1] }], ["range equal", { bins: 2, range: [1, 1] }], ["range reversed", { bins: 2, range: [2, 1] }]]) {
  test(`VO-6 histogram RangeError: ${name}`, () => assert.throws(() => api.histogram([1], o), RangeError));
}
test("VO-6 C-22 interpolate -1 / 0.5 / 2 -> 0 / 5 / 10; multi-segment", () => {
  assert.equal(api.interpolate([0, 1], [0, 10], -1), 0);
  assert.equal(api.interpolate([0, 1], [0, 10], 0.5), 5);
  assert.equal(api.interpolate([0, 1], [0, 10], 2), 10);
  assert.ok(near(api.interpolate([0, 1, 3], [0, 10, 30], 2), 20, 1e-12));
});
