// Spec 2d467cf453771b95 v1 (motion verbs): VO-1..VO-7 at the integration layer (VO-8 is tests/motion.test.mjs, VO-9 is tests/api-docs.test.mjs).
// Fixtures under tests/fixtures/motion/scn/verbs-*.js run in headless Chrome virtual time. A page places a play at an exact ms of its cycle by
// freezing Date.now (the loop's clock, FR-1) and reports raw observations plus references taken from the browser's own SVG APIs; live-tick
// pages record DOM-change batches (MutationObserver). Every expected value below is computed here from the spec's formulas, never from
// implementation output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findChrome } from "../skills/learn-to-tell/server/audit.mjs";

const PAGE = pathToFileURL(fileURLToPath(new URL("./fixtures/motion/page.html", import.meta.url))).href;
const chrome = findChrome();
const skip = process.env.CI && process.env.LTT_AUDIT !== "1" ? "CI without LTT_AUDIT=1"
  : !chrome ? "no Chrome found (set LTT_CHROME)"
  : false;

const JOBS = 3;
let active = 0;
const queue = [];
const slot = () => new Promise((go) => (active < JOBS ? (active++, go()) : queue.push(go)));
const release = () => { const next = queue.shift(); next ? next() : active--; };

function chromeRun(args, timeout = 120_000) {
  return new Promise((done) => {
    const child = spawn(chrome, args, { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    const timer = setTimeout(() => { child.kill("SIGKILL"); done({ out, error: "Chrome timed out" }); }, timeout);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (d) => { out += d; });
    child.on("error", (e) => { clearTimeout(timer); done({ out, error: e.message }); });
    child.on("close", () => { clearTimeout(timer); done({ out, error: null }); });
  });
}

const unescape = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

// Under CPU load headless Chrome can stop before virtual time reaches H.done; like audit.mjs, retry with triple the budget.
async function runPage(s, opts, attempt = 1) {
  try {
    return await runPageOnce(s, opts);
  } catch (e) {
    if (attempt >= 3 || !/no <pre id="R">/.test(e.message)) throw e;
    await new Promise((r) => setTimeout(r, 500 * attempt));
    return runPage(s, { ...opts, budget: opts.budget * 3 }, attempt + 1);
  }
}

async function runPageOnce(s, { audit = false, hash = "1", size = "1280,800", budget, flags = [] }) {
  await slot();
  const profile = await mkdtemp(join(tmpdir(), "ltt-verbs-"));
  try {
    const url = `${PAGE}?s=${s}${audit ? "&audit" : ""}#${hash}`;
    const { out, error } = await chromeRun(["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
      "--hide-scrollbars", "--allow-file-access-from-files", `--user-data-dir=${profile}`, `--window-size=${size}`,
      `--virtual-time-budget=${budget}`, ...flags, "--dump-dom", url]);
    const m = out.match(/<pre id="R">([\s\S]*?)<\/pre>/);
    if (!m) throw new Error(`${s}: no <pre id="R"> in the dumped DOM (${error ?? "budget ran out or the page threw"})`);
    const R = JSON.parse(unescape(m[1]));
    const a = out.match(/<script[^>]*id="ltt-audit"[^>]*>([\s\S]*?)<\/script>/);
    R.audit = a ? JSON.parse(a[1]) : null;
    return R;
  } finally {
    await rm(profile, { recursive: true, force: true });
    release();
  }
}

const pages = new Map();
const page = (s, opts) => {
  const key = s + JSON.stringify(opts);
  if (!pages.has(key)) pages.set(key, runPage(s, opts));
  return pages.get(key);
};

const PAGES = {
  hand: ["verbs-hand", { budget: 3500 }],
  dg: ["verbs-dg", { budget: 3500 }],
  ba: ["verbs-ba", { budget: 2500 }],
  life: ["verbs-life", { budget: 12000 }],
  perf: ["verbs-perf", { budget: 4000 }],
  ctrl: ["verbs-ctrl", { budget: 10000 }],
  beats: ["verbs-beats", { audit: true, budget: 20000 }],
  measure: ["verbs-measure", { budget: 5000 }],
  reduced: ["verbs-reduced", { budget: 5000, flags: ["--force-prefers-reduced-motion"] }],
  errors: ["verbs-errors", { budget: 6500 }],
};
const get = (name) => page(...PAGES[name]);
if (!skip) for (const name of Object.keys(PAGES)) get(name).catch(() => {});

// ---------- spec formulas (Signatures) ----------

const TOL = 0.02; // VO-1: tolerance on p-derived values
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const ease = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const prog = (ms, a, b) => clamp((ms - a) / (b - a), 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const mod1 = (x) => ((x % 1) + 1) % 1;
const inBeat = (ms, a, b) => ms >= a && ms <= b;

const near = (got, want, tol, what) => assert.ok(Number.isFinite(got) && Math.abs(got - want) <= tol, `${what}: got ${got}, want ${want} ± ${tol}`);
const nearVec = (got, want, tol, what) => {
  assert.ok(Array.isArray(got) && got.length === want.length, `${what}: got ${JSON.stringify(got)}`);
  want.forEach((w, i) => near(got[i], w, typeof tol === "function" ? tol(i) : tol, `${what}[${i}]`));
};
const noErrors = (R) => assert.deepEqual(R.errors, [], `page errors: ${R.errors.join(" | ")}`);

const group = async (pageName, name) => {
  const R = await get(pageName);
  noErrors(R);
  const x = R.samples.g && R.samples.g[name];
  assert.ok(x, `fixture group ${name} missing`);
  return x;
};
const at = (grp, ms) => {
  const s = grp.samples.find((x) => x.ms === ms);
  assert.ok(s, `no sample at ${ms}ms`);
  return s;
};

// draw: stroke-dashoffset = L (1 - e), stroke-dasharray = "L L"
function expectDraw(snap, key, L, p, what) {
  const d = snap.dash[key];
  near(d.off / L, 1 - ease(p), TOL, `${what} dashoffset/L at ${snap.ms}ms`);
  assert.equal(d.arr.length, 2, `${what} stroke-dasharray ${JSON.stringify(d.arr)}`);
  for (const v of d.arr) near(v, L, Math.max(0.5, L * 0.005), `${what} dasharray at ${snap.ms}ms`);
}
const viewAt = (v0, v1, e) => v0.map((c, i) => lerp(c, v1[i], e));
const expectView = (got, v0, v1, p, what) => nearVec(got, viewAt(v0, v1, ease(p)), (i) => TOL * Math.abs(v1[i] - v0[i]) + 0.05, what);
const camBox = (box, pad) => [box[0] - pad, box[1] - pad, box[2] + 2 * pad, box[3] + 2 * pad];

function ptAt(tbl, f) {
  const x = mod1(f) * tbl.N, i = Math.min(Math.floor(x), tbl.N - 1), t = x - i;
  return [lerp(tbl.pts[i][0], tbl.pts[i + 1][0], t), lerp(tbl.pts[i][1], tbl.pts[i + 1][1], t)];
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const FLOW_PX = 1.5;
function expectFlowShown(fl, tbl, p, count, laps, what) {
  assert.ok(fl.layer, `${what}: no g.ltt-flow layer`);
  assert.equal(fl.centers.length, count, `${what}: visible particles ${fl.centers.length}, want ${count}`);
  const used = new Set();
  for (let k = 0; k < count; k++) {
    const f = mod1(p * laps + k / count), want = ptAt(tbl, f);
    const i = fl.centers.findIndex((c, j) => !used.has(j) && dist(c, want) <= FLOW_PX);
    assert.ok(i >= 0, `${what}: no particle within ${FLOW_PX}px of f_${k}=${f.toFixed(4)} ${JSON.stringify(want.map((x) => +x.toFixed(2)))}; have ${JSON.stringify(fl.centers.map((c) => c.map((x) => +x.toFixed(2))))}`);
    used.add(i);
  }
}
const expectFlowHidden = (fl, what) => {
  assert.deepEqual(fl.centers, [], `${what}: particles visible`);
  assert.equal(fl.tails, 0, `${what}: tails visible`);
};

// stack: q_i = e(clamp(p n - i, 0, 1)); scale about the bottom edge (bottom) or left edge (left)
function expectStack(mats, edge, from, p, what) {
  const n = mats.length;
  mats.forEach((m, i) => {
    const q = ease(clamp(p * n - i, 0, 1));
    if (from === "bottom") {
      near(m[3], q, TOL, `${what} bar ${i} scaleY`);
      near(m[0], 1, TOL, `${what} bar ${i} scaleX`);
      if (m[3] > 0.02) near(m[5], edge[i] * (1 - m[3]), 1, `${what} bar ${i} pivot (bottom edge fixed)`);
    } else {
      near(m[0], q, TOL, `${what} bar ${i} scaleX`);
      near(m[3], 1, TOL, `${what} bar ${i} scaleY`);
      if (m[0] > 0.02) near(m[4], edge[i] * (1 - m[0]), 1, `${what} bar ${i} pivot (left edge fixed)`);
    }
  });
}

// ---------- VO-1 boundary values of the beat clock ----------

const BVA_A = 1000, BVA_B = 1050;
function expectBva(s, ref, what) {
  const p = prog(s.ms, BVA_A, BVA_B), e = ease(p);
  expectDraw(s, "p", ref.L.p, p, `${what} draw`);
  if (inBeat(s.ms, BVA_A, BVA_B)) expectFlowShown(s.flow, ref.q, p, 1, 10, `${what} flow`);
  else expectFlowHidden(s.flow, `${what} flow`);
  expectView(s.vb, ref.vb0, camBox(ref.cam, 16), p, `${what} camera`);
  near(s.m.width, lerp(ref.m0.width, 200, e), TOL * 100, `${what} morph width`);
  expectStack(s.bars, ref.barBottoms, "bottom", p, `${what} stack`);
}
const BVA_ITEMS = [
  ["a-1", BVA_A - 1], ["a", BVA_A], ["a+1", BVA_A + 1], ["b-1", BVA_B - 1], ["b", BVA_B], ["b+1", BVA_B + 1],
];
for (const [label, ms] of BVA_ITEMS) {
  test(`VO-1 BVA ms=${label} (${ms}ms, beat [${BVA_A},${BVA_B}]): all five verbs match the p formula (C-9)`, { skip }, async () => {
    const g = await group("hand", "bva");
    expectBva(at(g, ms), g.ref, `ms=${label}`);
  });
}

test("VO-1 BVA right after cycle restart: u back at 0 returns every verb to p = 0 after a p = 1 state (FR-2)", { skip }, async () => {
  const g = await group("hand", "bva");
  expectBva(g.restart.end, g.ref, "before restart (ms 1999)");
  assert.ok(g.restart.end.dash.p.off / g.ref.L.p < 0.02, "precondition: the draw was finished before the restart");
  expectBva(g.restart.after, g.ref, "right after restart (ms 0)");
  assert.ok(g.restart.after.dash.p.off / g.ref.L.p > 0.98, "draw is not back at p = 0");
});

const markT = (R, name) => { assert.ok(R.marks[name], `mark ${name} missing`); return R.marks[name].t; };
const watchOf = (R, label) => { const w = R.samples.watch && R.samples.watch[label]; assert.ok(w, `no watcher for ${label}`); return w; };
const within = (rows, from, to) => rows.filter((r) => (Array.isArray(r) ? r[0] : r) >= from && (Array.isArray(r) ? r[0] : r) < to);
// The first write of a visit can be the measurement-mode rest draw (offset/L 0) just before the live loop starts at p = 0; drop it.
const liveRows = (rows) => { const i = rows.slice(0, 4).findIndex((r) => r[1] > 0.9); return i > 0 ? rows.slice(i) : rows; };
// The live loop's t0 lies inside H.go, i.e. in [mark.t, mark.t2]; fit that single t0 and require every write to match the formula for it.
function expectLive(rows, mark, P, once, what, a = 0, b = 1000) {
  let best = { err: Infinity, t0: mark.t };
  for (let t0 = mark.t; t0 <= (mark.t2 ?? mark.t); t0++) {
    const err = Math.max(...rows.map(([t, f]) => Math.abs(f - (1 - ease(prog(once ? Math.min(t - t0, P) : (t - t0) % P, a, b))))));
    if (err < best.err) best = { err, t0 };
  }
  assert.ok(best.err <= TOL, `${what}: best fit over t0 in [${mark.t}, ${mark.t2}] still off by ${best.err.toFixed(4)} (t0=${best.t0})`);
}
// offset/L expected at tick time t for a draw beat [0, 1000] in a visit entered at e (loop wraps at P; once clamps at P)
const liveFrac = (t, e, P, once) => 1 - ease(prog(once ? Math.min(t - e, P) : (t - e) % P, 0, 1000));

test("VO-1 BVA right after leave -> return: the first tick of the new visit is back at p = 0 (C-15)", { skip }, async () => {
  const R = await get("life");
  noErrors(R);
  const w = watchOf(R, "life"), e1 = markT(R, "life1"), out = markT(R, "lifeOut"), e2 = markT(R, "life2");
  const before = liveRows(within(w.rows, e1, out));
  assert.ok(before.length > 20, `only ${before.length} ticks in the first visit`);
  assert.ok(before.at(-1)[1] < 0.02, `precondition: the first visit ended in the p = 1 state (offset/L ${before.at(-1)[1]})`);
  const back = liveRows(within(w.rows, e2, markT(R, "lifeOut2")));
  assert.ok(back.length > 20, `only ${back.length} ticks after returning`);
  assert.ok(back[0][0] - e2 <= 33, `first tick of the new visit came ${back[0][0] - e2}ms after entry`);
  near(back[0][1], liveFrac(back[0][0], e2, 2000), TOL, "first offset/L after return");
  assert.ok(back[0][1] > 0.98, `state after return is not p = 0 (offset/L ${back[0][1]})`);
});

test("VO-1 (FR-1 FR-2) every live tick of the loop applies the beat formula at its own time", { skip }, async () => {
  const R = await get("life");
  const w = watchOf(R, "life");
  for (const [mark, out] of [["life1", "lifeOut"], ["life2", "lifeOut2"]]) {
    const rows = liveRows(within(w.rows, markT(R, mark), markT(R, out)));
    assert.ok(rows.length > 60, `only ${rows.length} ticks`);
    expectLive(rows, R.marks[mark], 2000, false, `${mark} offset/L`);
    assert.ok(rows.some(([, f]) => f > 0.9) && rows.some(([, f]) => f < 0.1), "the visit never showed both the start and the end state");
  }
});

// ---------- VO-2 verbs (equivalence partitioning) ----------

const DRAW_MS = [500, 1500, 250, 0, 1000, 750, 1999];
function checkDrawGroup(g, keys, what) {
  for (const ms of DRAW_MS) for (const k of keys) expectDraw(at(g, ms), k, g.ref.L[k], prog(ms, 0, 1000), `${what} ${k}`);
}

test("VO-2 V1 draw(path): dashoffset = L (1 - e(p)), dasharray 'L L', held at 0 after the beat (C-1)", { skip }, async () => {
  const g = await group("hand", "draw");
  checkDrawGroup(g, ["p"], "path");
  near(at(g, 500).dash.p.off / g.ref.L.p, 0.5, TOL, "C-1 offset at 500ms is L x 0.5");
  assert.ok(at(g, 0).dash.p.off / g.ref.L.p > 0.98 && at(g, 1500).dash.p.off / g.ref.L.p < 0.02, "start and end states");
});

test("VO-2 V2 draw(line and circle outlines): same dash formula with their own length", { skip }, async () => {
  const g = await group("hand", "draw");
  checkDrawGroup(g, ["ln", "ci"], "line/circle");
  assert.ok(g.ref.L.ln > 100 && g.ref.L.ci > 100, "fixture lengths");
});

const FLOW_TIMES = [500, 750, 1000, 1250, 1500];
test("VO-2 V3 flow position and spacing: count 4, laps 2, f_k = (p laps + k/count) mod 1 on the path, linear in p", { skip }, async () => {
  const g = await group("hand", "flow");
  for (const ms of FLOW_TIMES) expectFlowShown(at(g, ms).flow, g.ref.q, prog(ms, 500, 1500), 4, 2, `flow at ${ms}ms`);
  const a = at(g, 750).flow.centers, b = at(g, 1000).flow.centers;
  assert.notDeepEqual(a.map((c) => c.map(Math.round)), b.map((c) => c.map(Math.round)), "particles did not move between 750 and 1000ms");
});

test("VO-2 V4 flow outside its beat: no particle and no tail before a or after b (C-3 300/1500ms hidden, 750ms shown)", { skip }, async () => {
  const g = await group("hand", "flow");
  for (const ms of [0, 300, 1700, 1999]) expectFlowHidden(at(g, ms).flow, `flow at ${ms}ms`);
  assert.equal(at(g, 750).flow.centers.length, 4, "flow at 750ms is shown");
});

test("VO-2 V5 flow tail: while the beat runs a tail shape exists in the flow layer next to the particles", { skip }, async () => {
  const g = await group("hand", "flow");
  for (const ms of [750, 1000, 1250]) assert.ok(at(g, ms).flow.tails >= 1, `no visible tail shape at ${ms}ms`);
});

const V0 = [0, 0, 600, 300];
test("VO-2 V6 camera rectangle: viewBox = V0 + (V1 - V0) e for camera [0,0,100,50] (C-4 first half)", { skip }, async () => {
  const g = await group("hand", "cam");
  nearVec(g.ref.vb0, V0, 0.001, "fixture V0");
  for (const ms of [0, 250, 500, 1000]) expectView(at(g, ms).vb, g.ref.vb0, [0, 0, 100, 50], prog(ms, 0, 1000), `camera at ${ms}ms`);
  nearVec(at(g, 500).vb, viewAt(g.ref.vb0, [0, 0, 100, 50], 0.5), 0.5, "C-4 viewBox at 500ms is V0 + (V1 - V0) x 0.5");
});

test("VO-2 V7 camera target: V1 = target bbox in root coordinates widened by pad (default 16, and pad: 30)", { skip }, async () => {
  const g = await group("hand", "camTarget");
  assert.ok(g.ref.cam[2] > 50, "fixture bbox");
  for (const ms of [0, 500, 750, 1000, 1500]) expectView(at(g, ms).vb, g.ref.vb0, camBox(g.ref.cam, 16), prog(ms, 0, 1000), `default pad at ${ms}ms`);
  const p = await group("hand", "camPad");
  for (const ms of [0, 500, 750, 1000]) expectView(at(p, ms).vb, p.ref.vb0, camBox(p.ref.cam, 30), prog(ms, 0, 1000), `pad 30 at ${ms}ms`);
});

test("VO-2 V8 camera chaining: the second camera beat starts from the first beat's V1, not V0 (C-4)", { skip }, async () => {
  const g = await group("hand", "cam");
  const V1 = [0, 0, 100, 50], V2 = [300, 100, 100, 50];
  for (const ms of [1000, 1500, 1750, 1999]) expectView(at(g, ms).vb, V1, V2, prog(ms, 1000, 2000), `second beat at ${ms}ms`);
  nearVec(at(g, 1500).vb, viewAt(V1, V2, 0.5), 0.5, "C-4 1500ms is midway between V1 and V2");
  const fromV0 = viewAt(g.ref.vb0, V2, 0.5);
  assert.ok(Math.abs(at(g, 1500).vb[2] - fromV0[2]) > 20, "viewBox at 1500ms looks interpolated from V0");
});

test("VO-2 V9 morph attributes: attr = v0 + (to - v0) e for x, width, opacity (rect) and cx, r (circle) (C-5)", { skip }, async () => {
  const g = await group("hand", "morph");
  for (const ms of [0, 250, 500, 750, 1000, 1500]) {
    const s = at(g, ms), e = ease(prog(ms, 0, 1000));
    near(s.m.width, lerp(g.ref.m0.width, 200, e), TOL * 100, `rect width at ${ms}ms`);
    near(s.m.x, lerp(g.ref.m0.x, 90, e), TOL * 40, `rect x at ${ms}ms`);
    near(s.m.opacity, lerp(g.ref.m0.opacity, 0.2, e), TOL * 0.8, `rect opacity at ${ms}ms`);
    near(s.m.height, g.ref.m0.height, 0.001, `rect height (not in to) at ${ms}ms`);
    near(s.mc.cx, lerp(g.ref.mc0.cx, 500, e), TOL * 200, `circle cx at ${ms}ms`);
    near(s.mc.r, lerp(g.ref.mc0.r, 60, e), TOL * 40, `circle r at ${ms}ms`);
    near(s.mc.cy, g.ref.mc0.cy, 0.001, `circle cy (not in to) at ${ms}ms`);
  }
  near(at(g, 500).m.width, 100 + (200 - 100) * 0.5, 0.5, "C-5 mid-beat width is w0 + (200 - w0) x 0.5");
});

test("VO-2 V10 morph translate: the move is added after the element's own transform (translate(10,5) + [40,20] e)", { skip }, async () => {
  const g = await group("hand", "morph");
  nearVec(g.ref.tr0, [1, 0, 0, 1, 10, 5], 0.001, "fixture transform before play");
  for (const ms of [0, 250, 500, 750, 1000, 1500]) {
    const e = ease(prog(ms, 0, 1000)), m = at(g, ms).tr;
    near(m[4], 10 + 40 * e, TOL * 40 + 0.05, `translate x at ${ms}ms`);
    near(m[5], 5 + 20 * e, TOL * 20 + 0.05, `translate y at ${ms}ms`);
    near(m[0], 1, 0.001, `scale a at ${ms}ms`);
    near(m[3], 1, 0.001, `scale d at ${ms}ms`);
  }
});

test("VO-2 V11 morph diagram node + edges: node a moves to the new centre and the touching edge and label are redrawn there every frame (C-6)", { skip }, async () => {
  const g = await group("dg", "move");
  const s0 = g.ref.snap0, lay0 = g.ref.layout0.edges;
  for (const ms of [0, 250, 500, 750, 1000, 1500]) {
    const s = at(g, ms), p = prog(ms, 0, 1000), e = ease(p);
    near(s.p, p, 1e-9, "page progress copy");
    nearVec([s.pos.x, s.pos.y], [lerp(g.V0.x, g.TO.x, e), lerp(g.V0.y, g.TO.y, e)], 1e-6, `fixture centre at ${ms}ms`);
    const dx = s.nodes[0].rel[4] - s0.nodes[0].rel[4], dy = s.nodes[0].rel[5] - s0.nodes[0].rel[5];
    near(dx, (g.TO.x - g.V0.x) * e, 1, `node a x displacement at ${ms}ms`);
    near(dy, (g.TO.y - g.V0.y) * e, 1, `node a y displacement at ${ms}ms`);
    const L = s.layout.edges[0], L0 = lay0[0];
    nearVec(s.edges[0].ends[0], [s0.edges[0].ends[0][0] + L.x1 - L0.x1, s0.edges[0].ends[0][1] + L.y1 - L0.y1], 1.5, `edge a>b start at ${ms}ms`);
    nearVec(s.edges[0].ends[1], [s0.edges[0].ends[1][0] + L.x2 - L0.x2, s0.edges[0].ends[1][1] + L.y2 - L0.y2], 1.5, `edge a>b end at ${ms}ms`);
    nearVec(s.labels[0], [s0.labels[0][0] + L.lx - L0.lx, s0.labels[0][1] + L.ly - L0.ly], 2, `edge label at ${ms}ms`);
    const box = s.boxA, st = s.edges[0].ends[0];
    const gapX = Math.max(box[0] - st[0], 0, st[0] - (box[0] + box[2])), gapY = Math.max(box[1] - st[1], 0, st[1] - (box[1] + box[3]));
    assert.ok(Math.hypot(gapX, gapY) <= 8, `edge start is ${Math.hypot(gapX, gapY).toFixed(1)}px from the moved node box at ${ms}ms`);
    assert.equal(s.nodes[1].html, s0.nodes[1].html, "node b changed");
    assert.equal(s.nodes[2].html, s0.nodes[2].html, "node c changed");
    assert.equal(s.edges[1].html, s0.edges[1].html, "edge b>c (not touching a) changed");
  }
  const mid = at(g, 500);
  assert.ok(Math.abs(mid.edges[0].ends[0][0] - s0.edges[0].ends[0][0]) + Math.abs(mid.edges[0].ends[0][1] - s0.edges[0].ends[0][1]) > 5, "edge start did not follow the node");
});

const STACK_MS = [250, 2000, 1000, 0, 500, 1500, 2500];
test("VO-2 V12 stack bottom: bar i grows in its own window [i/n, (i+1)/n] about its bottom edge, q_i = e(clamp(p n - i)) (C-7)", { skip }, async () => {
  const g = await group("hand", "stack");
  for (const ms of STACK_MS) expectStack(at(g, ms).bars, g.ref.barBottoms, "bottom", prog(ms, 0, 2000), `stack at ${ms}ms`);
  const s = at(g, 250).bars;
  near(s[0][3], ease(0.5), TOL, "C-7 bar 0 is growing at 250ms");
  for (const i of [1, 2, 3]) near(s[i][3], 0, TOL, `C-7 bar ${i} still scale 0 at 250ms`);
  for (const m of at(g, 2000).bars) near(m[3], 1, TOL, "C-7 all bars scale 1 at 2000ms");
});

test("VO-2 V13 stack left: from 'left' scales along x about the left edge in document order", { skip }, async () => {
  const g = await group("hand", "stack");
  for (const ms of STACK_MS) expectStack(at(g, ms).hbs, g.ref.hbLefts, "left", prog(ms, 0, 2000), `left stack at ${ms}ms`);
  near(at(g, 500).hbs[0][0], ease(clamp(0.25 * 3, 0, 1)), TOL, "bar 0 of 3 at p = 0.25");
});

// ---------- VO-3 target resolution (equivalence partitioning; untouched siblings) ----------

const untouched = (snap, ref, keys, what) => { for (const k of keys) assert.equal(snap.html[k], ref.html0[k], `${what}: untouched element ${k} changed`); };
const changed = (snap, ref, keys, what) => { for (const k of keys) assert.notEqual(snap.html[k], ref.html0[k], `${what}: targeted element ${k} did not change`); };
const T_ALL = ["p", "ln", "ci", "t1", "t2", "t3", "t4", "t5"];

test("VO-3 T1 diagram node id resolves to that node's g: camera frames its bbox + pad, morph translate moves only it", { skip }, async () => {
  const c = await group("dg", "t1cam");
  for (const ms of [0, 500, 750, 1000]) expectView(at(c, ms).vb, c.ref.vb0, camBox(c.ref.nodeBox, 16), prog(ms, 0, 1000), `camera on node a at ${ms}ms`);
  const m = await group("dg", "t1move");
  const s0 = m.ref.snap0;
  for (const ms of [0, 250, 500, 1000]) {
    const s = at(m, ms), e = ease(prog(ms, 0, 1000));
    near(s.nodes[0].rel[4] - s0.nodes[0].rel[4], 60 * e, TOL * 60 + 0.1, `node a x at ${ms}ms`);
    near(s.nodes[0].rel[5] - s0.nodes[0].rel[5], 40 * e, TOL * 40 + 0.1, `node a y at ${ms}ms`);
    assert.equal(s.nodes[1].html, s0.nodes[1].html, "node b changed");
    assert.equal(s.nodes[2].html, s0.nodes[2].html, "node c changed");
  }
});

test("VO-3 T2 diagram edge 'from>to' resolves to that edge's line only (draw)", { skip }, async () => {
  const g = await group("dg", "t2");
  for (const ms of [0, 500, 1000]) {
    const s = at(g, ms);
    near(s.edges[0].dash.off / g.ref.L[0], 1 - ease(prog(ms, 0, 1000)), TOL, `edge a>b dashoffset/L at ${ms}ms`);
    assert.equal(s.edges[1].html, g.ref.snap0.edges[1].html, "edge b>c changed");
    for (const i of [0, 1, 2]) assert.equal(s.nodes[i].html, g.ref.snap0.nodes[i].html, `node ${i} changed`);
  }
});

test("VO-3 T3 diagram edge id resolves to that edge's line only (draw 'e2')", { skip }, async () => {
  const g = await group("dg", "t3");
  for (const ms of [0, 500, 1000]) {
    const s = at(g, ms);
    near(s.edges[1].dash.off / g.ref.L[1], 1 - ease(prog(ms, 0, 1000)), TOL, `edge e2 dashoffset/L at ${ms}ms`);
    assert.equal(s.edges[0].html, g.ref.snap0.edges[0].html, "edge a>b changed");
  }
});

test("VO-3 T4 axisPlot series id resolves to that series' line only; C-8 its dashoffset changes", { skip }, async () => {
  const g = await group("dg", "axis");
  assert.ok(g.html0[1].includes(" d="), "fixture: series s2 has a drawn line");
  for (const ms of [0, 250, 500, 1000, 1500]) {
    const s = at(g, ms);
    near(s.dash[0].off / g.L[0], 1 - ease(prog(ms, 0, 1000)), TOL, `series s1 dashoffset/L at ${ms}ms`);
    assert.equal(s.html[1], g.html0[1], "series s2 changed");
  }
  assert.notEqual(at(g, 500).dash[0].off, at(g, 0).dash[0].off, "C-8 dashoffset did not change");
});

test("VO-3 T5 CSS selector matching several elements: all of them are drawn, the rest stay untouched", { skip }, async () => {
  const g = await group("hand", "tSel");
  for (const ms of [0, 500, 1000]) for (const k of ["t1", "t2"]) expectDraw(at(g, ms), k, g.ref.L[k], prog(ms, 0, 1000), `.g ${k}`);
  untouched(at(g, 500), g.ref, ["p", "ln", "ci", "t3", "t4", "t5"], "selector .g");
  changed(at(g, 500), g.ref, ["t1", "t2"], "selector .g");
});

test("VO-3 T6 Element target: only that element is drawn", { skip }, async () => {
  const g = await group("hand", "tEl");
  for (const ms of [0, 500, 1000]) expectDraw(at(g, ms), "t4", g.ref.L.t4, prog(ms, 0, 1000), "element t4");
  untouched(at(g, 500), g.ref, T_ALL.filter((k) => k !== "t4"), "Element target");
  changed(at(g, 500), g.ref, ["t4"], "Element target");
});

test("VO-3 T7 Element array target: every listed element is drawn, the rest stay untouched", { skip }, async () => {
  const g = await group("hand", "tArr");
  for (const ms of [0, 500, 1000]) for (const k of ["t3", "t5"]) expectDraw(at(g, ms), k, g.ref.L[k], prog(ms, 0, 1000), `array ${k}`);
  untouched(at(g, 500), g.ref, T_ALL.filter((k) => k !== "t3" && k !== "t5"), "Element array");
  changed(at(g, 500), g.ref, ["t3", "t5"], "Element array");
});

test("VO-3 C-2 flow on diagram edge 'a>b' (count 2): particles sit on the edge line, move with time, f_0 and f_1 differ by 0.5", { skip }, async () => {
  const g = await group("dg", "flow");
  for (const ms of [0, 250, 500, 1000, 1500]) {
    const s = at(g, ms);
    expectFlowShown(s.flow, g.ref.table, prog(ms, 0, 2000), 2, 1, `diagram flow at ${ms}ms`);
    for (const c of s.flow.centers) assert.ok(Math.min(...g.ref.table.pts.map((q) => dist(q, c))) < 1, `particle ${JSON.stringify(c)} is off the edge line at ${ms}ms`);
  }
  assert.notDeepEqual(at(g, 0).flow.centers.map((c) => c.map(Math.round)), at(g, 500).flow.centers.map((c) => c.map(Math.round)), "positions did not change by 500ms");
});

test("VO-3 C-4 camera [0,0,100,50] then camera on a diagram node id: 500ms V0 + (V1 - V0) x 0.5, 1000ms V1, 1500ms midway to V2", { skip }, async () => {
  const g = await group("dg", "chain");
  const V1 = [0, 0, 100, 50], V2 = camBox(g.ref.nodeBox, 16);
  for (const ms of [0, 500, 1000]) expectView(at(g, ms).vb, g.ref.vb0, V1, prog(ms, 0, 1000), `first beat at ${ms}ms`);
  for (const ms of [1000, 1500, 1750, 1999]) expectView(at(g, ms).vb, V1, V2, prog(ms, 1000, 2000), `second beat at ${ms}ms`);
});

test("VO-2 V14 same-property chaining: two morph beats on one attribute; the second starts from the first's `to`, and does not write before it starts", { skip }, async () => {
  const g = await group("hand", "morphChain");
  const w0 = g.ref.m0.width;
  for (const ms of [0, 500, 750, 1000, 1250, 1500, 1999]) {
    const want = ms < 1000 ? lerp(w0, 200, ease(prog(ms, 0, 1000))) : lerp(200, 300, ease(prog(ms, 1000, 2000)));
    near(at(g, ms).m.width, want, TOL * 100, `width at ${ms}ms`);
  }
  near(at(g, 1500).m.width, 250, 2, "mid-second-beat width is 200 + (300 - 200) x 0.5");
});

test("VO-2 V15 flow without count: exactly 3 particles at f_k = (p + k/3) mod 1", { skip }, async () => {
  const g = await group("hand", "flowDefault");
  for (const ms of [250, 500, 750]) expectFlowShown(at(g, ms).flow, g.ref.q, prog(ms, 0, 1000), 3, 1, `default-count flow at ${ms}ms`);
  expectFlowHidden(at(g, 1500).flow, "default-count flow after the beat");
});

for (const [name, id, what] of [["rootD3", "T8", "a d3 selection"], ["rootDiv", "T9", "an Element wrapping one <svg>"]]) {
  test(`VO-3 ${id} root is ${what}: the verbs act inside that svg`, { skip }, async () => {
    const g = await group("hand", name);
    for (const ms of [0, 500, 1000]) {
      expectDraw(at(g, ms), "p", g.ref.L.p, prog(ms, 0, 1000), `${id} draw`);
      expectView(at(g, ms).vb, g.ref.vb0, [0, 0, 100, 50], prog(ms, 0, 1000), `${id} camera at ${ms}ms`);
    }
    untouched(at(g, 500), g.ref, T_ALL.filter((k) => k !== "p"), id);
  });
}

// ---------- VO-4 M1 coupling ----------

test("VO-4 leave stop: a play changes nothing while its scene is not current (loop and once)", { skip }, async () => {
  const R = await get("life");
  assert.equal(within(watchOf(R, "life").ticks, markT(R, "lifeOut") + 50, markT(R, "life2")).length, 0, "loop play kept drawing after leaving");
  assert.equal(within(watchOf(R, "once").ticks, markT(R, "onceOut") + 50, markT(R, "once2")).length, 0, "once play kept drawing after leaving");
});

test("VO-4 return p = 0: re-entering a finished once play replays from p = 0 and ends in the p = 1 state", { skip }, async () => {
  const R = await get("life");
  const e = markT(R, "once2"), back = liveRows(within(watchOf(R, "once").rows, e, markT(R, "onceOut2")));
  assert.ok(back.length > 10, `only ${back.length} ticks after return`);
  assert.ok(back[0][0] - e <= 33, `first tick ${back[0][0] - e}ms after entry`);
  near(back[0][1], liveFrac(back[0][0], e, 2000, true), TOL, "first offset/L after return");
  assert.ok(back[0][1] > 0.98, `not at p = 0 (offset/L ${back[0][1]})`);
  near(back.at(-1)[1], 0, TOL, "state at the end of the replay");
});

test("VO-4 once end held: the p = 1 state is reached and stays, and at most two ticks follow after the period (once)", { skip }, async () => {
  const R = await get("life");
  const w = watchOf(R, "once"), e = markT(R, "once1"), out = markT(R, "onceOut");
  const rows = liveRows(within(w.rows, e, out));
  assert.ok(rows.length > 10, `only ${rows.length} ticks`);
  expectLive(rows, R.marks.once1, 2000, true, "once offset/L");
  near(rows.at(-1)[1], 0, TOL, "p = 1 state after the once play ended");
  assert.ok(within(w.ticks, e + 2000, out).length <= 2, "once keeps changing the picture after the period");
});

const restState = (s, what) => {
  near(s.frac, 0, TOL, `${what}: draw offset/L`);
  nearVec(s.vb, [0, 0, 100, 50], 0.5, `${what}: camera is V1`);
  near(s.mw, 200, TOL * 100, `${what}: morph width`);
  s.bars.forEach((d, i) => near(d, 1, TOL, `${what}: stack bar ${i} scale`));
};

test("VO-4 reduced-motion final state: every visit shows all beats at p = 1 once and does not repeat (C-11)", { skip }, async () => {
  const R = await get("reduced");
  noErrors(R);
  assert.equal(R.samples.reduced, true, "LTT.motion.reduced() is not true under --force-prefers-reduced-motion");
  restState(R.samples.state1, "visit 1");
  restState(R.samples.state2, "visit 2");
  // One batch of changes per visit (the rest draw) and nothing for the remaining time of the visit; a looping reduced play would add batches.
  for (const [mark, out] of [["in1", "out1"], ["in2", null]]) {
    const e = markT(R, mark), ticks = within(R.samples.ticks, e, out ? markT(R, out) : Infinity);
    assert.equal(ticks.length, 1, `${mark}: ${ticks.length} draw batches in the visit: +${ticks.map((t) => t - e).join(", +")}ms`);
  }
});

test("VO-4 measurement-mode rest (C-16): the plays made by the steps 1 and 2 enters (only ever run by the pre-draw) are each inert; step 0's live draw is not", { skip }, async () => {
  const R = await get("measure");
  noErrors(R);
  const plays = R.samples.plays;
  const pre = plays.filter((p) => p.step !== 0), live = plays.filter((p) => p.step === 0);
  assert.ok(pre.some((p) => p.step === 1) && pre.some((p) => p.step === 2), `pre-draw plays by step: ${JSON.stringify(plays.map((p) => [p.label, p.step]))}`);
  for (const p of pre) {
    assert.equal(p.ticks.length, 1, `${p.label} (step ${p.step}) ticked ${p.ticks.length} batches; a pre-draw play draws once`);
    near(p.frac, 0, TOL, `${p.label} draw state at rest`);
    near(p.mw, 200, TOL * 100, `${p.label} morph state at rest`);
  }
  assert.ok(live.some((p) => p.ticks.length > 5), `no live step-0 play: ticks ${JSON.stringify(live.map((p) => p.ticks.length))}`);
});

test("VO-4 hidden tab: no writes while hidden; on becoming visible the play continues from where it paused, not from the elapsed time", { skip }, async () => {
  const R = await get("ctrl");
  noErrors(R);
  const w = watchOf(R, "hid"), e = R.marks.hidIn, hide = markT(R, "hide"), show = markT(R, "show");
  const pre = liveRows(within(w.rows, e.t, hide)), post = within(w.rows, show, show + 400);
  assert.ok(pre.length > 10, `only ${pre.length} writes before hiding`);
  assert.equal(within(w.rows, hide + 50, show).length, 0, "the play kept writing while the tab was hidden");
  assert.ok(post.length >= 3, `only ${post.length} writes within 400ms of becoming visible`);
  const lastBefore = pre.at(-1)[0], fb = post[0][1];
  let best = Infinity;
  for (let ms = lastBefore - e.t2; ms <= lastBefore - e.t + 150; ms++) best = Math.min(best, Math.abs(fb - (1 - ease(prog(ms, 0, 1900)))));
  assert.ok(best <= TOL, `first offset/L after showing = ${fb}; the paused progress (${lastBefore - e.t2}..${lastBefore - e.t + 150}ms) would give it within ${TOL}, best miss ${best.toFixed(3)}; elapsed-time progress would be ${(1 - ease(prog(show - e.t, 0, 1900))).toFixed(3)}`);
});

test("VO-4 el: a second play with the same opts.el ends the first; default el (the root) behaves the same and a root removed from the document ends its play", { skip }, async () => {
  const R = await get("ctrl");
  const el = markT(R, "elIn"), t2 = markT(R, "el2"), end = markT(R, "hndIn");
  for (const label of ["A", "C", "D"]) assert.ok(within(watchOf(R, label).rows, el + 100, t2).length >= 10, `precondition: play ${label} ran before the second play`);
  assert.equal(within(watchOf(R, "A").rows, t2 + 60, end).length, 0, "the first play with the shared opts.el kept writing");
  assert.ok(within(watchOf(R, "B").rows, t2, end).length >= 10, "the second play with the shared opts.el did not run");
  assert.equal(within(watchOf(R, "C").rows, t2 + 60, end).length, 0, "default el: the first play on the same root kept writing");
  assert.ok(within(watchOf(R, "C").ticks, t2 + 60, t2 + 600).length >= 10, "default el: the second play on the root did not run");
  assert.equal(within(watchOf(R, "D").rows, t2 + 60, end).length, 0, "a play whose default el (root svg) left the document kept writing");
});

test("VO-4 handle: stop() leaves the picture unchanged and running false; play() makes it change again and running true", { skip }, async () => {
  const R = await get("ctrl");
  const w = watchOf(R, "hnd"), enter = markT(R, "hndIn"), stop = markT(R, "stop"), play = markT(R, "play");
  assert.ok(within(w.rows, enter + 100, stop).length >= 10, "precondition: the play ran before stop()");
  assert.equal(R.samples.runningStopped, false);
  assert.equal(within(w.rows, stop + 50, play).length, 0, "writes after stop()");
  assert.equal(R.samples.runningPlayed, true);
  assert.ok(within(w.rows, play, play + 500).length >= 10, "no writes after play()");
});

// FR-9: loop -> min(b, period - 1), once -> b, no text -> only t
const beatsAt = async (i) => {
  const R = await get("beats");
  noErrors(R);
  assert.ok(R.audit, "no #ltt-audit JSON in the ?audit page");
  return { R, audit: R.audit.beats[i], attr: R.samples.attrs[i] };
};
async function exposure(i, want) {
  const { audit, attr } = await beatsAt(i);
  assert.deepEqual(audit, want, "audit JSON beats");
  assert.ok(attr !== null && attr !== undefined, "scene has no data-ltt-beats");
  assert.deepEqual(JSON.parse(attr), want, "data-ltt-beats");
}

test("VO-4 beat exposure (loop): ends 1000 and 3000 in period 3000 become t = 1000 and min(3000, 2999) = 2999, with their text, dwell beat included (C-10)", { skip }, async () => {
  await exposure(1, [{ t: 1000, text: "가" }, { t: 2999, text: "나" }]);
});

test("VO-4 beat exposure (once): the same beats keep b exactly: t = 1000 and 3000 (C-10)", { skip }, async () => {
  await exposure(2, [{ t: 1000, text: "가" }, { t: 3000, text: "나" }]);
});

test("VO-4 beat exposure (no text): beats without text expose only t; an end equal to the period is cut to period - 1 for a loop", { skip }, async () => {
  await exposure(3, [{ t: 500 }, { t: 1500 }, { t: 1999 }]);
});

test("VO-4 default period = largest b + 1000 (A-5): a play with beats ending at 1500 and no period restarts at 2500ms", { skip }, async () => {
  const R = await get("life");
  const w = watchOf(R, "dflt"), e = markT(R, "dflt");
  expectLive(liveRows(within(w.rows, e, e + 2900)), R.marks.dflt, 2500, false, "default-period offset/L", 0, 1500);
  const at1500 = w.rows.filter(([t]) => t - e >= 1600 && t - e < 2400);
  assert.ok(at1500.length > 10 && at1500.every(([, f]) => f < TOL), "the finished state is not held until the restart");
  assert.deepEqual(JSON.parse(R.samples.dfltBeats), [{ t: 1500 }], "exposure: b below period - 1 stays b");
  const restart = w.rows.find(([t, f]) => t - e > 2000 && f > 0.9);
  assert.ok(restart, "the play never restarted");
  assert.ok(restart[0] - R.marks.dflt.t2 - 2500 <= 40 && restart[0] - e - 2500 >= -40, `restart at +${restart[0] - e}ms, want +2500ms`);
});

// ---------- VO-5 error guessing ----------

const sceneWarns = (R, n) => R.warns.map(([, m]) => m).filter((m) => m.includes(`장면 ${n}:`));
const tok = (m, n, i) => new RegExp(`(^|[^0-9A-Za-z])${i}(?![0-9A-Za-z])`).test(m.replace(`장면 ${n}:`, " "));
// The spec says the warn carries "비트 번호" without fixing 0- or 1-based, so accept one consistent convention.
function expectBeatWarns(R, n, wants, what) {
  const ws = sceneWarns(R, n);
  assert.ok(ws.length >= wants.length, `${what}: ${ws.length} warns with the prefix "장면 ${n}:" for ${wants.length} bad beats: ${JSON.stringify(R.warns)}`);
  const ok = [0, 1].filter((c) => wants.every((w) => ws.some((m) => (w.has ? m.includes(w.has) : true) && tok(m, n, w.idx + c))));
  assert.ok(ok.length > 0, `${what}: warns must name the beat index (0- or 1-based, consistently) of ${JSON.stringify(wants)}; got ${JSON.stringify(ws)}`);
}
// Beats ended before the sampled ms 1500, so a beat that ran shows its p = 1 state; the dasharray proves the draw was applied at all.
const goodDrawn = (dash, L, what) => {
  near(dash.off / L, 0, TOL, `${what}: dashoffset/L`);
  assert.equal(dash.arr.length, 2, `${what}: stroke-dasharray ${JSON.stringify(dash.arr)}`);
  for (const v of dash.arr) near(v, L, Math.max(0.5, L * 0.005), `${what}: dasharray`);
};
const goodRan = (a) => {
  goodDrawn(a.dash, a.L, "good draw beat at 1500ms");
  near(a.mw, 200, TOL * 100, "good morph beat width at 1500ms");
};

test("VO-5 E1 reverse / out-of-range / non-array t: warn with 장면 2: and the beat index, only those beats dropped, the others animate", { skip }, async () => {
  const R = await get("errors");
  noErrors(R);
  const e = R.samples.e.e1;
  expectBeatWarns(R, 2, [{ idx: 1 }, { idx: 2 }, { idx: 3 }], "E1");
  goodRan(e.at);
  for (const k of ["ln", "ci", "t1"]) assert.equal(e.at.html[k], e.before[k], `E1: dropped beat's target ${k} changed`);
  assert.equal(e.running, true, "E1: the play stopped");
});

test("VO-5 E2 two verbs in one beat: warn with 장면 3: and the beat index, that beat is dropped entirely, the others animate", { skip }, async () => {
  const R = await get("errors");
  const e = R.samples.e.e2;
  expectBeatWarns(R, 3, [{ idx: 1 }], "E2");
  goodRan(e.at);
  assert.equal(e.at.html.ln, e.before.ln, "E2: the dropped beat's draw was applied");
  nearVec(e.at.vb, e.vb0, 0.001, "E2: the dropped beat's camera was applied");
  assert.equal(e.running, true);
});

test("VO-5 E3 missing target (unknown diagram id, unmatched selector): warn with 장면 4:, the beat index and the target; other beats animate", { skip }, async () => {
  const R = await get("errors");
  const e = R.samples.e.e3;
  expectBeatWarns(R, 4, [{ idx: 1, has: "nothere" }, { idx: 2, has: "x>y" }, { idx: 1, has: "#nope" }], "E3");
  goodDrawn(e.dg.dash, e.dg.L, "E3 diagram: the good draw 'a>b' at 1500ms");
  nearVec(e.dg.vb, e.dg.vb0, 0.001, "E3 diagram: the dropped camera moved the view");
  assert.deepEqual(e.dg.flow.centers, [], "E3 diagram: the dropped flow drew particles");
  goodRan(e.hand.at);
  assert.equal(e.dg.running, true);
  assert.equal(e.hand.running, true);
});

test("VO-5 E4 bad camera / morph arguments: each warns with 장면 5: and its beat index; only those beats are dropped", { skip }, async () => {
  const R = await get("errors");
  const e = R.samples.e.e4;
  expectBeatWarns(R, 5, [{ idx: 1 }, { idx: 2 }, { idx: 3 }, { idx: 4 }, { idx: 5 }], "E4");
  goodDrawn(e.at.dash, e.at.L, "E4 good draw beat at 1500ms");
  nearVec(e.at.vb, e.vb0, 0.001, "E4: a bad camera beat moved the view");
  assert.equal(e.at.html.m, e.before.m, "E4: a bad morph beat changed #m");
  near(e.at.mcr, 60, TOL * 40, "E4 good morph beat (circle r) at 1500ms");
  assert.equal(e.running, true);
});

test("VO-5 E5 root without an <svg>: warn with 장면 6:, no exception, a handle with running === false", { skip }, async () => {
  const R = await get("errors");
  noErrors(R);
  const e = R.samples.e.e5;
  assert.equal(e.thrown, null, `play threw: ${e.thrown}`);
  assert.equal(e.hasHandle, true, "no handle returned");
  assert.equal(e.running, false);
  assert.ok(sceneWarns(R, 6).length >= 1, `no warn with the prefix "장면 6:": ${JSON.stringify(R.warns)}`);
});

test("VO-5 E6 a verb that throws while applying: one warn with 장면 7: and the error, only that play ends, another play keeps going, navigation works", { skip }, async () => {
  const R = await get("errors");
  noErrors(R);
  const e = R.samples.e.e6, w = sceneWarns(R, 7).filter((m) => m.includes("boom-verb"));
  assert.equal(w.length, 1, `warns: ${JSON.stringify(R.warns)}`);
  assert.equal(e.badRunning, false, "the failing play still reports running");
  assert.equal(e.okRunning, true, "the other play stopped");
  const enter = markT(R, "e6In"), after = within(e.okTicks, enter + 300, enter + 1500);
  assert.ok(after.length >= 35, `the other play changed the picture in only ${after.length} ticks between +300 and +1500ms`);
  assert.equal(R.samples.indexAfter, 7, "deck navigation after the fault");
});

// ---------- VO-6 beforeAfter().ms ----------

test("VO-6 no markers: ms = 0 (C-14)", { skip }, async () => {
  const R = await get("ba");
  noErrors(R);
  assert.equal(R.samples.ms.none, 0);
});

test("VO-6 one marker: ms = 700", { skip }, async () => {
  assert.equal((await get("ba")).samples.ms.one, 700);
});

test("VO-6 before 3 / after 2 markers: ms = 700 + 140 (3 - 1) = 980 (C-14)", { skip }, async () => {
  assert.equal((await get("ba")).samples.ms.threeTwo, 980);
});

test("VO-6 after has more markers than before: ms = 700 + 140 (m - 1) with m the after count (4 -> 1120, 5 -> 1260)", { skip }, async () => {
  const ms = (await get("ba")).samples.ms;
  assert.equal(ms.afterMore, 700 + 140 * (4 - 1));
  assert.equal(ms.afterMore2, 700 + 140 * (5 - 1));
});

// ---------- VO-7 performance (BVA 2-value) ----------

// A kit scheduling defect fails every run, host load does not: take up to 3 fresh page runs and judge the first one meeting both thresholds.
const perfSummary = (R) => {
  const t0 = markT(R, "perf"), ticks = within(R.samples.w.ticks, t0, t0 + 1000);
  const gaps = ticks.slice(1).map((t, i) => t - ticks[i]);
  return { R, t0, ticks, count: ticks.length, maxGap: gaps.length ? Math.max(...gaps) : Infinity };
};
let perfRuns = null;
const perfAttempts = () => (perfRuns ??= (async () => {
  const [name, opts] = PAGES.perf, runs = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const m = perfSummary(await page(name, { ...opts, attempt }));
    runs.push(m);
    if (m.count >= 30 && m.maxGap <= 33) break;
  }
  return runs;
})());
const perfPick = async () => {
  const runs = await perfAttempts(), good = runs.find((m) => m.count >= 30 && m.maxGap <= 33);
  return { m: good ?? runs.at(-1), note: runs.map((m, i) => `run ${i + 1}: ${m.count} ticks, max gap ${m.maxGap}ms`).join("; ") };
};

test("VO-7 QR-1: a play with 6 beats (five verbs + a dwell) changes the picture at least 30 times in 1000ms at 1280x800", { skip }, async () => {
  const { m, note } = await perfPick();
  noErrors(m.R);
  assert.deepEqual(JSON.parse(m.R.samples.perfBeats), [{ t: 500 }, { t: 1000 }, { t: 1500 }, { t: 2000 }, { t: 2500 }, { t: 3000, text: "쉼" }],
    "five verbs + one dwell beat reach the loop as 6 beats");
  assert.ok(m.count >= 30, `${m.count} loop ticks in 1000ms (${note})`);
});

test("VO-7 QR-1: the gap between ticks stays at most 33ms and the writes apply the beats (offset/L follows the formula in the draw beat)", { skip }, async () => {
  const { m, note } = await perfPick();
  assert.ok(m.maxGap <= 33, `max gap ${m.maxGap}ms (${note})`);
  const drawing = liveRows(within(m.R.samples.w.rows, m.t0, m.t0 + 500));
  assert.ok(drawing.length >= 10, `only ${drawing.length} writes inside the draw beat`);
  expectLive(drawing, m.R.marks.perf, 4000, false, "perf draw-beat offset/L", 0, 500);
});
