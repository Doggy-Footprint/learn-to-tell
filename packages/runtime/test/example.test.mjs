// VO-10 (FR-40..FR-42, C-31..C-38, QR-2, QR-4) example lesson, black-box via the stub.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { STUB, EXAMPLE, near } from "./fixtures/helpers.mjs";

const { load, evaluate, createApi } = await import(STUB);
const src = fs.readFileSync(EXAMPLE, "utf8");

test("VO-10 C-38 Node import() succeeds and source has no import statement", async () => {
  const mod = await import(pathToFileURL(EXAMPLE).href);
  assert.equal(typeof mod.default, "function");
  assert.doesNotMatch(src, /(^|[;\s])import\s+[\w{*"'`]/m);
});

const factory = (await import(pathToFileURL(EXAMPLE).href)).default;
const L = load(factory);
const inp = L.input;
const scenes = inp.sections.flatMap((s) => s.scenes);
const predicts = scenes.filter((s) => s.type === "predict");

test("VO-10 C-37 sections = 4, scene count Σ+2 in [18,24]", () => {
  assert.equal(inp.sections.length, 4);
  const n = scenes.length + 2;
  assert.ok(n >= 18 && n <= 24, String(n));
});
test("VO-10 C-37 every scene type used", () => {
  const types = new Set(scenes.map((s) => s.type));
  for (const t of ["hook", "predict", "define", "explain", "steps", "explore", "compare", "quiz"]) assert.ok(types.has(t), t);
});
test("VO-10 C-37 predict inputs choice/drag/draw and a predict targeting misconceptions[0]", () => {
  const kinds = new Set(predicts.map((p) => p.input.kind));
  for (const k of ["choice", "drag", "draw"]) assert.ok(kinds.has(k), k);
  const m0 = inp.meta.learner.misconceptions[0];
  assert.equal(typeof m0, "string");
  assert.ok(predicts.some((p) => p.targets === m0));
});
test("VO-10 C-37 each section ends with a quiz scene", () => {
  inp.sections.forEach((s, i) => assert.equal(s.scenes.at(-1).type, "quiz", `section ${i}`));
});
test("VO-10 C-37 final quiz has choice/numeric/order/classify and a transfer item", () => {
  const kinds = new Set(inp.quiz.map((q) => q.kind));
  for (const k of ["choice", "numeric", "order", "classify"]) assert.ok(kinds.has(k), k);
  assert.ok(inp.quiz.some((q) => q.transfer === true));
});

const isRel = (e) => e && typeof e === "object" && !Array.isArray(e) && Object.keys(e).length > 0 && Object.keys(e).every((k) => k === "lt" || k === "gt");
const leaves = (e) => (typeof e === "number" || typeof e === "boolean" || Array.isArray(e) || isRel(e) ? [e] : Object.values(e).flatMap(leaves));
test("VO-10 C-37 check shapes: number+tol/rel, range, relation, limit", () => {
  const forms = new Set();
  for (const c of inp.checks) for (const e of leaves(c.expect)) {
    if (typeof e === "number" && (c.tol !== undefined || c.rel !== undefined)) forms.add("number");
    if (Array.isArray(e)) forms.add("range");
    if (isRel(e)) forms.add("relation");
  }
  if (inp.checks.some((c) => typeof c.limit === "string" && c.limit.length > 0)) forms.add("limit");
  assert.deepEqual([...forms].sort(), ["limit", "number", "range", "relation"]);
});
test("VO-10 C-37 every string-src model has a limit check; an illustrative model exists", () => {
  const entries = Object.entries(inp.models);
  for (const [name, md] of entries) {
    if (typeof md.args[2] === "string") assert.ok(inp.checks.some((c) => c.model === name && c.limit), name);
  }
  assert.ok(entries.some(([, md]) => md.args[2] && md.args[2].illustrative === true));
  for (const m of ["flight", "best", "fall"]) assert.ok(m in inp.models, m);
});
test("VO-10 C-37 glossary >= 3, explore has knobs and goal", () => {
  assert.ok(Object.keys(inp.glossary ?? {}).length >= 3);
  const ex = scenes.filter((s) => s.type === "explore");
  assert.ok(ex.length > 0 && ex.every((s) => Object.keys(s.knobs).length > 0 && s.goal && typeof s.goal.done === "function"));
});
test("VO-10 C-37 figure TimeSpecs include loop, steps, static", () => {
  const specs = new Set();
  for (const fig of Object.values(inp.figures)) {
    if (fig.kind !== "figure") continue;
    const o = fig.args[0].args.find((a) => a && typeof a === "object" && !Array.isArray(a)) ?? {};
    for (const k of ["loop", "steps", "idle", "static"]) if (k in o) specs.add(k);
  }
  for (const k of ["loop", "steps", "static"]) assert.ok(specs.has(k), k);
});
test("VO-10 C-37 at least one function Text; content in Korean", () => {
  const skip = new Set(["answer", "done"]);
  const hasFn = (v, k) => (typeof v === "function" ? !skip.has(k) : v && typeof v === "object" ? Object.entries(v).some(([kk, vv]) => hasFn(vv, kk)) : false);
  assert.ok(hasFn({ s: inp.sections, q: inp.quiz, m: inp.summary }));
  assert.match(inp.meta.title, /[가-힯]/);
  assert.match(JSON.stringify(scenes), /[가-힯]/);
});
test("VO-10 C-37 custom used 0 times (factory and all draws)", () => {
  const { api, usage } = createApi();
  let i;
  factory(new Proxy(api, { get: (o, k) => (k === "lesson" ? (x) => { i = x; return o.lesson(x); } : o[k]) }));
  const outs = Object.fromEntries(Object.keys(i.models).map((k) => [k, L.run(k)]));
  for (const fig of Object.values(i.figures)) if (fig.kind === "figure") fig.args[1](outs, 0, { step: 0, params: {} });
  assert.ok(!(usage.get("custom") > 0));
  assert.doesNotMatch(src, /\.custom\s*\(/);
});

const flight = (p) => L.run("flight", p);
const vals = [
  ["C-31 range", () => flight({ v0: 40, deg: 45, vt: 20, drag: true }).range, 48.07, 0.05],
  ["C-31 time", () => flight({ v0: 40, deg: 45, vt: 20, drag: true }).time, 3.829, 0.005],
  ...[[30, 48.77], [36, 49.58], [60, 39.10], [15, 38.55]].map(([deg, r]) => [`C-32 drag ${deg}deg range`, () => flight({ v0: 40, deg, vt: 20, drag: true }).range, r, 0.05]),
  ["C-33 no drag 45 range", () => flight({ v0: 40, deg: 45, drag: false }).range, 163.27, 0.05],
  ["C-33 no drag 30 range", () => flight({ v0: 40, deg: 30, drag: false }).range, 141.39, 0.05],
  ["C-33 no drag 45 time", () => flight({ v0: 40, deg: 45, drag: false }).time, 5.772, 0.005],
  ["C-33 no drag 30 time", () => flight({ v0: 40, deg: 30, drag: false }).time, 4.082, 0.005],
  ...[[40, 36.2], [20, 41.0], [10, 43.7], [100, 29.3]].map(([v0, d]) => [`C-34 best v0 ${v0}`, () => L.run("best", { v0, vt: 20 }).deg, d, 0.2]),
  ...[[1, 9.08], [2, 15.06], [3, 17.99]].map(([t, v]) => [`C-35 fall v(${t})`, () => L.run("fall", { vt: 20 }).v.at(t)[0], v, 0.01]),
];
for (const [name, get, exp, tol] of vals) {
  test(`VO-10 ${name} = ${exp} ±${tol}`, () => {
    const a = get();
    assert.ok(near(a, exp, tol), `actual ${a}`);
  });
}
test("VO-10 C-33 closed form cross-check (no drag): range = v0² sin2θ / g", () => {
  assert.ok(near(1600 * Math.sin(Math.PI / 2) / 9.8, 163.27, 0.05));
  assert.ok(near(2 * 40 * Math.sin(Math.PI / 6) / 9.8, 4.082, 0.005));
});
test("VO-10 C-35 closed form cross-check: v = vt·tanh(g t / vt)", () => {
  for (const [t, v] of [[1, 9.08], [2, 15.06], [3, 17.99]]) assert.ok(near(20 * Math.tanh(9.8 * t / 20), v, 0.01));
});
test("VO-10 C-36/FR-42 evaluate(example).ok", () => {
  const rep = evaluate(factory);
  assert.deepEqual(rep.bindingErrors, []);
  assert.equal(rep.ok, true, JSON.stringify({ c: rep.checks.filter((c) => !c.pass), d: rep.deterministic.filter((d) => !d.ok), f: rep.figureErrors, x: rep.focusErrors, b: rep.bindingErrors }));
});

// v6 FR-43 (R2 1st-round fixes), observed through load(factory).input. Oracle: spec FR-43 values.
const sec = (i, j) => inp.sections[i].scenes[j];
const outsAt = (scene, extra = {}) => Object.fromEntries(Object.keys(inp.models).map((k) => {
  const defs = inp.models[k].args[0];
  const p = Object.fromEntries(Object.entries(extra).filter(([n]) => n in defs));
  return [k, L.run(k, p)];
}));
const knobRange = (k) => (Array.isArray(k) ? k.slice(0, 2) : k.range);

test("VO-10 FR-43 s0.1 predict asks on 'traj' and reveals 'angles'", () => {
  const s = sec(0, 1);
  assert.equal(s.type, "predict");
  assert.equal(s.figure, "traj");
  assert.equal(s.reveal.figure, "angles");
});
test("VO-10 FR-43 s2.2 explore uses 'traj' with knobs exactly [vt]; summary.figures has 'byvt'", () => {
  const s = sec(2, 2);
  assert.equal(s.type, "explore");
  assert.equal(s.figure, "traj");
  assert.deepEqual(Object.keys(s.knobs), ["vt"]);
  assert.ok(inp.summary.figures.includes("byvt"));
});
test("VO-10 FR-43 s3.0 predict figure is multiples('vx', over {deg:[30,60]}) and reveal.marks has 'vx-area'", () => {
  const s = sec(3, 0);
  assert.equal(s.type, "predict");
  const d = inp.figures[s.figure];
  assert.equal(d.kind, "multiples");
  assert.equal(d.args[0], "vx");
  assert.deepEqual(d.args[1].over, { deg: [30, 60] });
  assert.ok(s.reveal.marks.includes("vx-area"));
});
test("VO-10 FR-43 s3.2 explore uses 'both' with knobs exactly [deg] range [10,55]", () => {
  const s = sec(3, 2);
  assert.equal(s.type, "explore");
  assert.equal(s.figure, "both");
  assert.deepEqual(Object.keys(s.knobs), ["deg"]);
  assert.deepEqual(knobRange(s.knobs.deg), [10, 55]);
});
test("VO-10 FR-43 final numeric quiz items have no figure", () => {
  const nums = inp.quiz.filter((q) => q.kind === "numeric");
  assert.ok(nums.length >= 1);
  for (const q of nums) assert.equal(q.figure, undefined);
});
test("VO-10 FR-43 no scene text before the define scene (s0.2) contains '항력'", () => {
  assert.equal(sec(0, 2).type, "define");
  const outs = outsAt(null);
  const TEXT_KEYS = new Set(["title", "say", "ask", "text", "feedback"]);
  const texts = [];
  const walk = (v, key) => {
    if (typeof v === "function") { if (TEXT_KEYS.has(key)) texts.push(v(outs)); return; }
    if (typeof v === "string") { if (TEXT_KEYS.has(key)) texts.push(v); return; }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, key)); return; }
    if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (k !== "answer" && k !== "done") walk(x, k);
  };
  for (const j of [0, 1]) walk(sec(0, j));
  assert.ok(texts.length >= 4, String(texts.length));
  for (const t of texts) assert.doesNotMatch(t, /항력/, t);
});
test("VO-10 FR-43 goal reachability: s2.2 false at defaults, true at vt=5", () => {
  const g = sec(2, 2).goal.done;
  assert.equal(g(outsAt(null)), false);
  assert.equal(g(outsAt(null, { vt: 5 })), true);
});
test("VO-10 FR-43 goal reachability: s3.2 false at defaults, true at deg=36", () => {
  const g = sec(3, 2).goal.done;
  assert.equal(g(outsAt(null)), false);
  assert.equal(g(outsAt(null, { deg: 36 })), true);
});
