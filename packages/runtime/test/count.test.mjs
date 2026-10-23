// VO-8 (FR-30..FR-35, C-23..C-28) aggregate/wilson/validation; VO-9 (FR-36, C-29) count CLI state transitions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { COUNT, tmpdir, near } from "./fixtures/helpers.mjs";
import { prop, row, valid, writeFragment, fragmentSource } from "./fixtures/fragments.mjs";

const { wilson, aggregate } = await import(COUNT);

function refWilson(k, n, z = 1.96) {
  const p = k / n, z2 = z * z, den = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / den, h = (z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / den;
  return [c - h, c + h];
}

test("VO-8 C-23 wilson(5,50) = [0.0435, 0.2136] ±1e-4", () => {
  const [lo, hi] = wilson(5, 50);
  assert.ok(near(lo, 0.0435, 1e-4) && near(hi, 0.2136, 1e-4), `${lo} ${hi}`);
});
test("VO-8 C-24 wilson(0,20) lower 0 ±1e-9 upper 0.1611 ±1e-4; wilson(3,0) null", () => {
  const [lo, hi] = wilson(0, 20);
  assert.ok(near(lo, 0, 1e-9) && near(hi, 0.1611, 1e-4), `${lo} ${hi}`);
  assert.equal(wilson(3, 0), null);
});
test("VO-8 wilson honours explicit z", () => {
  const [lo, hi] = wilson(5, 50, 1);
  const [rl, rh] = refWilson(5, 50, 1);
  assert.ok(near(lo, rl, 1e-9) && near(hi, rh, 1e-9));
});

test("VO-8 C-26 V8 C1 G1 X2 -> ratio 0.2, X outside denominator, wilson(2,10); subdirs; ratio null", async () => {
  const dir = tmpdir("ltt-agg-");
  const rows = [...Array(8)].map(() => valid.V()).concat([valid.C(), valid.G(), valid.X(), valid.X()]);
  writeFragment(dir, "a.js", rows.slice(0, 6));
  writeFragment(dir, "deep/er/b.js", rows.slice(6));
  writeFragment(dir, "lessons/c.js", [valid.X({ corpus: "lesson" }), valid.N({ corpus: "lesson" })]);
  fs.writeFileSync(path.join(dir, "notes.txt"), "not a fragment");
  const s = await aggregate(dir);
  const shot = s.corpora.shot;
  assert.deepEqual({ V: shot.V, C: shot.C, G: shot.G, X: shot.X, N: shot.N }, { V: 8, C: 1, G: 1, X: 2, N: 0 });
  assert.ok(near(shot.ratio, 0.2, 1e-12));
  const [rl, rh] = refWilson(2, 10);
  assert.ok(near(shot.wilson[0], rl, 1e-9) && near(shot.wilson[1], rh, 1e-9));
  assert.equal(s.corpora.lesson.ratio, null);
  assert.equal(s.corpora.lesson.wilson, null);
  assert.equal(s.corpora.lesson.X + s.corpora.lesson.N, 2);
});

test("VO-8 FR-34 usage summed per corpus and in total", async () => {
  const dir = tmpdir("ltt-usage-");
  writeFragment(dir, "a.js", [valid.V()]);
  writeFragment(dir, "sub/b.js", [valid.V()]);
  writeFragment(dir, "c.js", [valid.V({ corpus: "lesson" })]);
  const s = await aggregate(dir);
  assert.equal(s.usage.total.dot, 3);
  assert.equal(s.usage.total.figure, 3);
  assert.equal(s.usage.total.cartesian, 3);
  assert.equal(s.usage.byCorpus.shot.dot, 2);
  assert.equal(s.usage.byCorpus.lesson.dot, 1);
});

test("VO-8 C-27 candidate promotion boundaries + normalization", async () => {
  const dir = tmpdir("ltt-cand-");
  const r = (cands, domain) => valid.V({ candidates: cands, domain });
  writeFragment(dir, "a.js", [
    r(["warp"], "physics"), r([" WARP "], "music"),
    r(["bend"], "physics"), r(["Bend"], "physics"), r(["bend "], "physics"),
    r(["twist"], "physics"), r(["TWIST"], "physics"), r(["twist"], "law"),
  ]);
  const s = await aggregate(dir);
  const by = Object.fromEntries(s.candidates.map((c) => [c.text, c]));
  assert.deepEqual(Object.keys(by).sort(), ["bend", "twist", "warp"]);
  assert.deepEqual([by.warp.count, by.warp.promoted], [2, false]);
  assert.deepEqual([by.bend.count, by.bend.promoted], [3, false]);
  assert.deepEqual([by.twist.count, by.twist.promoted], [3, true]);
  assert.deepEqual([...by.twist.domains].sort(), ["law", "physics"]);
  assert.deepEqual([...by.bend.domains], ["physics"]);
});

// Validation decision table (FR-32, FR-33, Errors) observed through the CLI: exit 1, stderr "<file>: <reason>", no outputs.
const runCli = (args) => spawnSync(process.execPath, [COUNT, ...args], { encoding: "utf8" });
function cliCase(fragment) {
  const dir = tmpdir("ltt-cli-in-"), out = tmpdir("ltt-cli-out-");
  const f = writeFragment(dir, "frag.js", ...fragment);
  return { r: runCli([dir, "--out", out]), out, f };
}
const legal = [
  ["V all essential kept/approx, non-essential lost", [[valid.V({ props: [prop(), prop({ id: "p2", status: "approx", by: undefined, diff: "thinner" }), prop({ id: "p3", essential: false, status: "lost", by: undefined })] })]]],
  ["C custom non-empty", [[valid.C()]]],
  ["G essential ambiguous", [[valid.G({ props: [prop({ status: "ambiguous", by: undefined })] })]]],
  ["G essential lost", [[valid.G()]]],
  ["X with reason", [[valid.X()]]],
  ["N with reason", [[valid.N()]]],
  ["all corpora accepted", [["shot", "shot-extra", "lesson", "new-b1", "new-b2"].map((c) => valid.V({ corpus: c }))]],
];
for (const [name, frag] of legal) {
  test(`VO-8 legal row: ${name} -> exit 0`, () => {
    const { r } = cliCase(frag);
    assert.equal(r.status, 0, r.stderr);
  });
}
const illegal = [
  ["C-25 V with essential lost", [[valid.V({ props: [prop({ status: "lost", by: undefined })] })]]],
  ["V with custom non-empty", [[valid.V({ custom: ["x"] })]]],
  ["C with empty custom", [[row("C")]]],
  ["G with no essential lost/ambiguous", [[row("G")]]],
  ["G with custom non-empty", [[valid.G({ custom: ["x"] })]]],
  ["X without reason", [[row("X", { props: [] })]]],
  ["N with empty reason", [[row("N", { props: [], reason: "" })]]],
  ["kept without by", [[valid.V({ props: [prop({ by: undefined })] })]]],
  ["kept with empty by", [[valid.V({ props: [prop({ by: "" })] })]]],
  ["approx without diff", [[valid.V({ props: [prop({ status: "approx", by: undefined })] })]]],
  ["unknown verdict", [[row("Q")]]],
  ["unknown corpus", [[valid.V({ corpus: "blog" })]]],
  ["unknown status", [[valid.V({ props: [prop({ status: "gone" })] })]]],
  ["no audit export", [fragmentSource([]).replace(/export const audit[\s\S]*$/, "")]],
  ["default export not a function", [fragmentSource([valid.V()], { body: "42" })]],
  ["factory throws", [fragmentSource([valid.V()], { body: "() => { throw new Error('x'); }" })]],
  ["C-28 @ts-ignore", [[valid.V()], { extra: "// @ts-ignore" }]],
  ["@ts-expect-error", [[valid.V()], { extra: "// @ts-expect-error" }]],
  ["@ts-nocheck", [[valid.V()], { extra: "// @ts-nocheck" }]],
  ["{any}", [[valid.V()], { extra: "/** @type {any} */ const z = 1;" }]],
  ["{*}", [[valid.V()], { extra: "/** @type {*} */ const z = 1;" }]],
  ["v3 syntax error (cannot import)", [fragmentSource([valid.V()]) + "\nexport const = ;\n"]],
];
for (const [name, frag] of illegal) {
  test(`VO-8/VO-9 validation error: ${name} -> exit 1, stderr '<file>: <reason>', no outputs`, () => {
    const { r, out } = cliCase(frag);
    assert.equal(r.status, 1, `stdout ${r.stdout} stderr ${r.stderr}`);
    assert.match(r.stderr, /frag\.js[^\n]*: \S/);
    assert.deepEqual(fs.readdirSync(out), []);
  });
}

test("VO-9 success -> figures.tsv header + one line per row, summary.json equals aggregate()", async () => {
  const dir = tmpdir("ltt-ok-in-"), out = tmpdir("ltt-ok-out-");
  writeFragment(dir, "a.js", [valid.V(), valid.G({ fig: "g" })]);
  writeFragment(dir, "s/b.js", [valid.C({ fig: "h", corpus: "new-b2" })]);
  const r = runCli([dir, "--out", out]);
  assert.equal(r.status, 0, r.stderr);
  const lines = fs.readFileSync(path.join(out, "figures.tsv"), "utf8").split("\n").filter(Boolean);
  assert.equal(lines[0], "corpus\tdomain\tfig\tsrc\tverdict\tcustom\tlost_essential");
  assert.equal(lines.length, 4);
  assert.ok(lines.slice(1).every((l) => l.split("\t").length === 7));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out, "summary.json"), "utf8")), JSON.parse(JSON.stringify(await aggregate(dir))));
});
test("VO-9 C-29 failing run leaves pre-existing summary.json byte-identical and creates no figures.tsv", () => {
  const dir = tmpdir("ltt-keep-in-"), out = tmpdir("ltt-keep-out-");
  writeFragment(dir, "frag.js", [row("C")]);
  fs.writeFileSync(path.join(out, "summary.json"), '{"old":true}\n');
  const r = runCli([dir, "--out", out]);
  assert.equal(r.status, 1);
  assert.equal(fs.readFileSync(path.join(out, "summary.json"), "utf8"), '{"old":true}\n');
  assert.deepEqual(fs.readdirSync(out), ["summary.json"]);
});
test("VO-9 one bad fragment among good ones still fails the whole run", () => {
  const dir = tmpdir("ltt-mix-in-"), out = tmpdir("ltt-mix-out-");
  writeFragment(dir, "good.js", [valid.V()]);
  writeFragment(dir, "frag.js", [row("X", { props: [] })]);
  const r = runCli([dir, "--out", out]);
  assert.equal(r.status, 1);
  assert.deepEqual(fs.readdirSync(out), []);
});
test("VO-9 missing dir -> exit 2, stderr usage, no output", () => {
  const out = tmpdir("ltt-nodir-");
  const r = runCli([path.join(out, "does-not-exist"), "--out", out]);
  assert.equal(r.status, 2);
  assert.ok(r.stderr.trim().length > 0);
  assert.deepEqual(fs.readdirSync(out), []);
});
test("VO-9 missing --out -> exit 2, stderr usage", () => {
  const dir = tmpdir("ltt-noout-");
  writeFragment(dir, "a.js", [valid.V()]);
  const r = runCli([dir]);
  assert.equal(r.status, 2);
  assert.ok(r.stderr.trim().length > 0);
  assert.deepEqual(fs.readdirSync(dir), ["a.js"]);
});
test("VO-9 no arguments -> exit 2", () => {
  assert.equal(runCli([]).status, 2);
});

// v3 additions (FR-34)
test("VO-8 v3 fragment with models: draw runs once (loop span start / t=0, step 0) with default outputs; its mark calls are counted", async () => {
  const dir = tmpdir("ltt-draw-");
  const body = `(api) => ({
  models: { m: api.model({ k: 3 }, (p) => ({ v: p.k * 2 }), "m") },
  figures: {
    a: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], loop: { ms: 1, span: [2, 9] } }), (m, t, ctx) => {
      if (m.m.v !== 6 || t !== 2 || ctx.step !== 0) throw new Error("bad draw input " + JSON.stringify([m, t, ctx.step]));
      return [api.line([[0, 0], [1, 1]]), api.dot([0, 0])];
    }),
    b: api.figure(api.graph({ layout: "tree", steps: ["x", "y"] }), (m, t, ctx) => {
      if (t !== 0 || ctx.step !== 0) throw new Error("bad");
      return [api.dot([0, 0]), api.dot([1, 1])];
    }),
  },
})`;
  writeFragment(dir, "a.js", [valid.V()], { body });
  const s = await aggregate(dir);
  assert.equal(s.usage.total.line, 1, JSON.stringify(s.usage.total));
  assert.equal(s.usage.total.dot, 3);
  assert.equal(s.usage.byCorpus.shot.dot, 3);
});
test("VO-8 v3 fragment spanning two corpora adds usage to each corpus and once to total; corpora only those in rows", async () => {
  const dir = tmpdir("ltt-two-");
  writeFragment(dir, "a.js", [valid.V(), valid.V({ corpus: "new-b1" }), valid.C({ corpus: "new-b1" })]);
  const s = await aggregate(dir);
  assert.equal(s.usage.total.dot, 1);
  assert.equal(s.usage.byCorpus.shot.dot, 1);
  assert.equal(s.usage.byCorpus["new-b1"].dot, 1);
  assert.deepEqual(Object.keys(s.corpora).sort(), ["new-b1", "shot"]);
});
test("VO-8 v3 candidates ordered by count desc then text asc", async () => {
  const dir = tmpdir("ltt-order-");
  const r = (c) => valid.V({ candidates: c });
  writeFragment(dir, "a.js", [r(["zeta", "beta", "alpha"]), r(["zeta", "beta"]), r(["gamma"])]);
  const s = await aggregate(dir);
  assert.deepEqual(s.candidates.map((c) => [c.text, c.count]), [["beta", 2], ["zeta", 2], ["alpha", 1], ["gamma", 1]]);
});

// VO-19 C-50 / FR-34: binding sampling must not add to usage; explore-with-knobs scenes present.
test("VO-19 C-50 fragment with scenes, knobs, handles: usage = factory calls + one draw per figure", async () => {
  const dir = tmpdir("ltt-c50-");
  const body = `(api) => ({
  models: { m: api.model({ q: 1 }, (p) => ({ v: p.q }), "m") },
  figures: {
    a: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([0, 0], { id: "h" }), api.line([[0, 0], [1, 1]])]),
    b: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([1, 1], { id: "k" })]),
  },
  scenes: [
    { type: "explain", title: "e", say: "s", figure: "a", focus: ["h"], params: { tab: "x" } },
    { type: "explore", title: "x", say: "s", figure: "a", focus: ["h"], knobs: { q: [0, 1], tab: ["x", "y"] }, handles: [{ mark: "h", x: "q" }] },
  ],
})`;
  writeFragment(dir, "a.js", [valid.V()], { body });
  const s = await aggregate(dir);
  const u = s.usage.total;
  assert.equal(u.dot, 2, JSON.stringify(u));
  assert.equal(u.line, 1);
  assert.equal(u.figure, 2);
  assert.equal(u.cartesian, 2);
  assert.equal(u.model, 1);
  assert.equal(s.usage.byCorpus.shot.dot, 2);
});
