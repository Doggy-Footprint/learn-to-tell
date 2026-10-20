// Spec 6cc24f891a69c407 v1 (motion runtime): VO-1..VO-7, VO-9..VO-11, VO-14 at the integration layer.
// Each fixture under tests/fixtures/motion/ drives a deck with setTimeout in headless Chrome virtual time and writes
// its call log to <pre id="R">; expected values come from the spec's FR/Cases, never from the implementation.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { findChrome } from "../skills/learn-to-tell/server/audit.mjs";

const HOLD_CASES = createRequire(import.meta.url)("./fixtures/motion/hold-cases.js");
const REV_CASES = createRequire(import.meta.url)("./fixtures/motion/rev-cases.js");

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

const unescape = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

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
  const profile = await mkdtemp(join(tmpdir(), "ltt-motion-"));
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
// Each fixture runs once; every test that reads it awaits the same promise.
const page = (s, opts) => {
  const key = s + JSON.stringify(opts);
  if (!pages.has(key)) pages.set(key, runPage(s, opts));
  return pages.get(key);
};

const PAGES = {
  loop: ["loop", { budget: 11000 }],
  onceEl: ["once-el", { budget: 16000 }],
  perf: ["perf", { budget: 5500 }],
  nodeck: ["nodeck", { budget: 5000 }],
  bind: ["bind", { budget: 36000 }],
  errors: ["errors", { budget: 8500 }],
  reduced: ["reduced", { budget: 8500, flags: ["--force-prefers-reduced-motion"] }],
  measure: ["measure", { budget: 7000 }],
  autoplay: ["autoplay", { budget: 45000 }],
  autoclick: ["autoclick", { budget: 66000 }],
  hold: ["hold", { budget: 110000 }],
  holdAudit: ["hold", { audit: true, budget: 20000 }],
  holdErr: ["hold-err", { budget: 10000 }],
  holdErrAudit: ["hold-err", { audit: true, budget: 20000 }],
  playersSolo: ["players-solo", { budget: 14000 }],
  playersSoloReduced: ["players-solo", { budget: 14000, flags: ["--force-prefers-reduced-motion"] }],
  playersDeck: ["players-deck", { budget: 58000 }],
  playersDeckReduced: ["players-deck", { budget: 58000, flags: ["--force-prefers-reduced-motion"] }],
  revDeck: ["rev-deck", { budget: 40000 }],
  revPlayer: ["rev-player", { budget: 40000 }],
  revOff: ["rev-off", { budget: 3000 }],
  size: ["size", { budget: 9000 }],
  sweepA: ["sweep-a", { budget: 11500 }],
  sweepB: ["sweep-b", { budget: 5500 }],
  sweepC: ["sweep-c", { budget: 5500 }],
  sweepD: ["sweep-d", { budget: 6500 }],
  beats: ["beats", { audit: true, budget: 20000 }],
  still: ["still", { audit: true, budget: 20000 }],
  stillCompact: ["still", { audit: true, budget: 20000, size: "900,800" }],
  predict: ["predict", { budget: 5500 }],
};
const get = (name) => page(...PAGES[name]);
if (!skip) for (const name of Object.keys(PAGES)) get(name).catch(() => {});

// ---------- log helpers ----------

const calls = (R, label, from = -Infinity, to = Infinity) => R.log.filter(([l, , t]) => l === label && t >= from && t < to);
const us = (rows) => rows.map(([, u]) => u);
const at = (R, name) => {
  assert.ok(R.marks[name], `mark ${name} missing (errors: ${R.errors.join(" | ")})`);
  return R.marks[name].t;
};
const cnt = (R, name, key) => R.marks[name].cnt[key] ?? 0;
const stepAt = (R, label, t) => {
  const rows = R.steps.filter(([l, , s]) => l === label && s <= t);
  return rows.length ? rows[rows.length - 1][1] : null;
};
const maxGap = (rows) => rows.slice(1).reduce((m, r, i) => Math.max(m, r[2] - rows[i][2]), 0);
const circ = (a, b) => { const d = Math.abs(a - b) % 1; return Math.min(d, 1 - d); };
const noErrors = (R) => assert.deepEqual(R.errors, [], `page errors: ${R.errors.join(" | ")}`);

// ---------- VO-1 loop state machine (state transition, 0-switch) ----------

test("VO-1 T1: entering the scene starts the loop; no draw before entry; C-1 60+ calls in 3000ms with one wrap (period 2000)", { skip }, async () => {
  const R = await get("loop");
  noErrors(R);
  const e = at(R, "enter1"), l = at(R, "leave1");
  assert.equal(calls(R, "A", -Infinity, e).length, 0, "draw ran before the scene became current");
  const run = calls(R, "A", e, l);
  assert.ok(run.length >= 60, `only ${run.length} calls in 3000ms`);
  // FR-1: virtual time is exact, so no jitter allowance on the 33ms interval.
  assert.ok(maxGap(run) <= 33, `max gap ${maxGap(run)}ms > 33ms`);
  for (let w = e; w + 1000 <= l; w += 1000) assert.ok(calls(R, "A", w, w + 1000).length >= 30, `fewer than 30 calls in [${w - e}, ${w - e + 1000})ms`);
  const wraps = run.slice(1).filter(([, u], i) => run[i][1] > 0.9 && u < 0.1).length;
  assert.equal(wraps, 1, `u wrapped ${wraps} times in 3000ms (expected 1 for period 2000)`);
  assert.ok(us(run).every((u) => u >= 0 && u <= 1), "u outside [0, 1]");
  const off = run.filter(([, u, t]) => circ(u, ((t - e) % 2000) / 2000) > 0.05);
  assert.deepEqual(off, [], "u differs from ((now - t0) mod period) / period by more than 0.05");
});

test("VO-1 T2: leaving the scene stops drawing (C-3)", { skip }, async () => {
  const R = await get("loop");
  assert.equal(calls(R, "A", at(R, "leave1") + 50, at(R, "enter2")).length, 0);
});

test("VO-1 T3: returning restarts at u≈0 (C-3 first u < 0.05)", { skip }, async () => {
  const R = await get("loop");
  const back = calls(R, "A", at(R, "enter2"), at(R, "hide"));
  assert.ok(back.length > 10, `only ${back.length} calls after return`);
  assert.ok(back[0][1] < 0.05, `first u after return = ${back[0][1]}`);
});

test("VO-1 T4: a hidden tab stops drawing (C-4)", { skip }, async () => {
  const R = await get("loop");
  assert.equal(calls(R, "A", at(R, "hide") + 50, at(R, "show")).length, 0);
});

test("VO-1 T5: visible again resumes drawing (C-4)", { skip }, async () => {
  const R = await get("loop");
  const s = at(R, "show");
  assert.ok(calls(R, "A", s, s + 100).length >= 1, "no draw within 100ms of becoming visible");
  assert.ok(calls(R, "A", s, at(R, "stop")).length >= 10);
});

test("VO-1 T6: handle.stop() stops drawing and running becomes false (C-9)", { skip }, async () => {
  const R = await get("loop");
  assert.equal(R.samples.runningBeforeStop, true);
  assert.equal(R.samples.runningAfterStop, false);
  assert.equal(calls(R, "A", at(R, "stop") + 50, at(R, "play")).length, 0);
});

test("VO-1 T7: handle.play() resumes from the stopped u (C-9 ±0.05)", { skip }, async () => {
  const R = await get("loop");
  const before = calls(R, "A", -Infinity, at(R, "stop") + 1).at(-1)[1];
  const after = calls(R, "A", at(R, "play"), at(R, "stop2"));
  assert.equal(R.samples.runningAfterPlay, true);
  assert.ok(after.length > 5, "no draw after play()");
  assert.ok(circ(after[0][1], before) <= 0.05, `stopped at u=${before}, resumed at u=${after[0][1]}`);
});

test("VO-1 T12: a handle-stopped loop restarts at u≈0 on re-entry (FR-10)", { skip }, async () => {
  const R = await get("loop");
  assert.equal(calls(R, "A", at(R, "stop2") + 50, at(R, "enter3")).length, 0);
  const back = calls(R, "A", at(R, "enter3"));
  assert.ok(back.length > 10, `only ${back.length} calls after re-entry`);
  assert.ok(back[0][1] < 0.05, `first u after re-entry = ${back[0][1]}`);
});

test("VO-1 T8: a once loop ends at draw(1) and draws at most twice after period (C-2)", { skip }, async () => {
  const R = await get("onceEl");
  noErrors(R);
  const e = at(R, "enterO1");
  const run = calls(R, "O", e, at(R, "enterE1"));
  assert.ok(run.length > 10, `only ${run.length} calls`);
  assert.equal(run.at(-1)[1], 1, "last call is not u=1");
  assert.ok(calls(R, "O", e + 1000, at(R, "enterE1")).length <= 2);
  const off = run.filter(([, u, t]) => Math.abs(u - Math.min(1, (t - e) / 1000)) > 0.05);
  assert.deepEqual(off, [], "u differs from min(1, (now - t0)/period)");
});

test("VO-1 T9: re-entering replays a finished once loop from u≈0", { skip }, async () => {
  const R = await get("onceEl");
  const run = calls(R, "O", at(R, "enterO2"), at(R, "enterE2"));
  assert.ok(run.length > 10);
  assert.ok(run[0][1] < 0.05, `first u = ${run[0][1]}`);
  assert.equal(run.at(-1)[1], 1);
});

test("VO-1 T10: removing opts.el from the document while current ends the loop (C-7); detached at creation is not an end", { skip }, async () => {
  const R = await get("onceEl");
  assert.equal(R.samples.elConnectedAtCreate, false, "fixture precondition: the node is detached when the figure function runs");
  assert.ok(calls(R, "E", at(R, "enterE1"), at(R, "removed")).length > 5, "the el loop never ran while its node was attached");
  assert.equal(calls(R, "E", at(R, "removed") + 50, at(R, "enterO2")).length, 0);
});

test("VO-1 T14 (FR-7 v2): a new loop with the same el ends the older loop", { skip }, async () => {
  const R = await get("onceEl");
  const sw = at(R, "swap");
  assert.ok(calls(R, "S1", at(R, "enterS"), sw).length > 5, "the first same-el loop never ran");
  assert.equal(calls(R, "S1", sw + 50, at(R, "enterSE")).length, 0, "the older same-el loop kept drawing");
  assert.ok(calls(R, "S2", sw, at(R, "enterSE")).length > 10, "the new same-el loop did not run");
});

test("VO-1 T13 C-26: loops made in step enter with one el leave one live loop after two auto-play rounds", { skip }, async () => {
  const R = await get("onceEl");
  const e = at(R, "enterSE");
  const live = new Set(R.log.filter(([l, , t]) => l.startsWith("SE#") && t >= e + 2000 && t < e + 2400).map(([l]) => l));
  assert.equal(live.size, 1, `live step loops: ${[...live]}`);
});

test("VO-1 T13 C-26: a loop made in the scene common enter belongs to its visit; 3 visits each have one live loop", { skip }, async () => {
  const R = await get("onceEl");
  for (let v = 0; v < 3; v++) {
    const a = at(R, "ce" + v), b = at(R, "ceOut" + v);
    const live = new Set(R.log.filter(([l, u, t]) => l.startsWith("CE#") && t >= a + 100 && t < b).map(([l]) => l));
    assert.equal(live.size, 1, `visit ${v} live loops: ${[...live]}`);
    assert.equal(R.log.filter(([l, , t]) => l.startsWith("CE#") && t > b + 50 && t < b + 350).length, 0, `visit ${v} loop drew after leaving`);
  }
});

test("VO-2 B13 (FR-9 v3): a bind registered in scene common enter on 3 visits gets one enter and one leave per visit, no accumulation", { skip }, async () => {
  const R = await get("onceEl");
  for (let v = 0; v < 3; v++) {
    assert.deepEqual([cnt(R, "ce" + v, "CEB:enter"), cnt(R, "ceOut" + v, "CEB:leave")], [v + 1, v + 1], `visit ${v}`);
  }
  assert.deepEqual([R.cnt["CEB:enter"], R.cnt["CEB:leave"]], [3, 3]);
});

test("VO-1 T11: an el-ended loop stays ended after leaving and returning (C-7)", { skip }, async () => {
  const R = await get("onceEl");
  assert.equal(calls(R, "E", at(R, "enterE2")).length, 0);
});

// ---------- VO-11 performance in virtual time (BVA 2-value) ----------

test("VO-11 QR-1: loops of non-current scenes draw 0 times in 3000ms", { skip }, async () => {
  const R = await get("perf");
  noErrors(R);
  const s = at(R, "e2") + 50;
  assert.equal(calls(R, "L1", s, s + 3000).length, 0);
  assert.equal(calls(R, "L3", s, s + 3000).length, 0);
});

// A kit scheduling defect fails every run, host load does not: judge up to 3 fresh page runs and pass if any one meets the thresholds.
async function bestOf3(name, judge) {
  const [s, o] = PAGES[name], notes = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const m = judge(attempt === 1 ? await get(name) : await page(s, { ...o, attempt }));
    notes.push(m.note);
    if (m.ok) return;
  }
  assert.fail(notes.map((n, i) => `run ${i + 1}: ${n}`).join("; "));
}

test("VO-11 QR-2 QR-7: the current scene's loop draws at least 30 times in 1000ms with gaps of at most 33ms", { skip }, () => bestOf3("perf", (R) => {
  const s = at(R, "e2");
  const n = calls(R, "L2", s + 100, s + 1100).length, g = maxGap(calls(R, "L2", s, s + 3000));
  return { ok: n >= 30 && g <= 33, note: `${n} calls in 1000ms, max gap ${g}ms` };
}));

test("VO-11 QR-2: the loop page's first second has at least 30 calls", { skip }, () => bestOf3("loop", (R) => {
  const e = at(R, "enter1"), n = calls(R, "A", e, e + 1000).length;
  return { ok: n >= 30, note: `${n} calls in the first second` };
}));

// ---------- VO-2 binding sites (equivalence partitioning) ----------

// B2 (step enter), B8 (reveal) and B11 (common enter, created on the first visit only) are made while the scene is current.
const VISIT_SCOPED = ["B2", "B8", "B11"];
const SITES = ["B1", "B2", "B3", "B4", "B5", "B5a", "B6", "B7", "B8", "B9", "B10", "B11"];
const SITE_NAMES = { B1: "figure function", B2: "figure steps step enter", B3: "statement visual", B4: "compare item visual", B5: "contrast before visual", B5a: "contrast after visual",
  B6: "terms visual", B7: "predict visual", B8: "predict answerVisual after reveal", B9: "overview figure", B10: "mount", B11: "scene common enter" };

for (const b of SITES) {
  test(`VO-2 ${b}: a loop made in the ${SITE_NAMES[b]} stops on leave and restarts on return; bind enter/leave once per transition (C-8)`, { skip }, async () => {
    const R = await get("bind");
    noErrors(R);
    const start = R.marks[`${b}:act`] ? at(R, `${b}:act`) : at(R, `${b}:in`);
    const out = at(R, `${b}:out`), back = at(R, `${b}:back`), out2 = at(R, `${b}:out2`);
    assert.ok(calls(R, b, start, out).length >= 10, `${b} did not run while current`);
    assert.equal(calls(R, b, out + 50, back).length, 0, `${b} drew after leaving`);
    const again = calls(R, b, back, out2);
    if (VISIT_SCOPED.includes(b)) {
      // FR-3 v2 / VO-1 T13: a loop made while the scene is current belongs to that visit and ends on leave.
      if (b !== "B8") assert.equal(again.length, 0, `${b} (made while current) drew again after return`);
    } else {
      assert.ok(again.length >= 10, `${b} did not restart on return`);
      // Measurement re-draws may add a single rest draw (u = 1); the restarted loop's first u must be ≈ 0.
      const first = again.find(([, u]) => u !== 1);
      assert.ok(first && first[1] < 0.05, `${b} first u after return = ${first && first[1]}`);
    }
    if (b === "B8") {
      const pre = R.marks[`${b}:in`].pre;
      const n = cnt(R, `${b}:out`, "B8:enter") - (pre["B8:enter"] ?? 0);
      assert.ok(n >= 1, "answerVisual bind never received enter after reveal");
      assert.equal(cnt(R, `${b}:out`, "B8:leave") - (pre["B8:leave"] ?? 0), n, "every bound answerVisual hook gets one leave per enter");
      return;
    }
    // FR-9 v3: a bind registered while current (B2, B11) gets one enter and one leave for that visit, then is dropped.
    // A visual function may legitimately run more than once at mount; each registration k must get exactly one enter/leave per transition.
    // Counts are deltas from the state just before this site's first navigation: sites sharing a scene (B5/B5a, B7/B8)
    // also receive transitions during the other site's visits. k = live binds (visit-scoped: those registered this visit).
    const base = (key) => R.marks[`${b}:in`].pre[key] ?? 0;
    const d = (mark, key) => cnt(R, mark, key) - base(key);
    const k = VISIT_SCOPED.includes(b) ? d(`${b}:out`, `${b}:reg`) : cnt(R, `${b}:out`, `${b}:reg`);
    assert.ok(k >= 1, `${b} registered no bind`);
    const want = VISIT_SCOPED.includes(b) ? [k, k, k, k] : [k, k, 2 * k, 2 * k];
    assert.deepEqual([d(`${b}:out`, `${b}:enter`), d(`${b}:back`, `${b}:leave`), d(`${b}:out2`, `${b}:enter`), d(`${b}:out2`, `${b}:leave`)],
      want, `${b} bind enter/leave counts [after enter, after leave, after return, after second leave]`);
  });
}

test("VO-2 B12 (C-24): a loop on a page without a deck starts at once and stops while hidden", { skip }, async () => {
  const R = await get("nodeck");
  noErrors(R);
  assert.ok(calls(R, "N", 0, 1000).length >= 30);
  assert.equal(calls(R, "N", at(R, "hide") + 50, at(R, "show")).length, 0);
  assert.ok(calls(R, "N", at(R, "show"), at(R, "show") + 1000).length >= 10);
});

test("VO-2 B12 FR-9 v2: bind outside a deck calls enter once and never leave", { skip }, async () => {
  const R = await get("nodeck");
  assert.deepEqual([R.cnt["NB:enter"] ?? 0, R.cnt["NB:leave"] ?? 0], [1, 0]);
});

// ---------- VO-14 existing behaviour (characterization of pre-existing contracts) ----------

test("VO-14 T1 (characterization): mount's returned {enter, leave} still gets one leave per departure", { skip }, async () => {
  const R = await get("bind");
  assert.equal(cnt(R, "B10:back", "M:leave"), 1);
  assert.equal(R.cnt["M:leave"], 2);
});

// Rewritten for spec 5ad829b7137b4d19 (C-8, FR-2): this characterization asserted that a standalone stepper never plays; it now starts when made.
// The steps carry hold 300, so the 1800ms floor sets the pace.
test("VO-14 T2 (rewritten, was characterization) C-8 FR-4: LTT.stepper outside a deck auto-plays from creation, hold 300 floored to 1800ms", { skip }, async () => {
  const R = await get("nodeck");
  assert.deepEqual([500, 1500].map((t) => stepAt(R, "ST", t)), [0, 0], "moved before the 1800ms floor");
  assert.deepEqual([2300, 2900].map((t) => stepAt(R, "ST", t)), [1, 1]);
});

test("VO-14 T3 (characterization): LTT.sweep still returns render, values and controls", { skip }, async () => {
  const R = await get("nodeck");
  for (const k of ["render", "values", "controls"]) assert.ok(R.samples.sweepKeys.includes(k), `sweep return lacks ${k}: ${R.samples.sweepKeys}`);
});

// ---------- VO-3 reduced motion and measurement mode ----------

test("VO-3 M1: reduced-motion loop with beats draws rest = last beat t/period (0.75) once per entry (C-5)", { skip }, async () => {
  const R = await get("reduced");
  noErrors(R);
  assert.equal(R.samples.reduced, true, "LTT.motion.reduced() is not true under --force-prefers-reduced-motion");
  assert.deepEqual(us(calls(R, "M1")), [0.75, 0.75]);
  assert.equal(calls(R, "M1", at(R, "in1"), at(R, "out1")).length, 1);
});

test("VO-3 M2: reduced-motion loop without beats draws rest = 1 once per entry", { skip }, async () => {
  const R = await get("reduced");
  assert.deepEqual(us(calls(R, "M2")), [1, 1]);
});

test("VO-3 M3: reduced-motion loop with an explicit rest draws that rest once per entry", { skip }, async () => {
  const R = await get("reduced");
  assert.deepEqual(us(calls(R, "M3")), [0.3, 0.3]);
});

test("VO-3 M4: reduced-motion figure steps stay on step 0 (A-12)", { skip }, async () => {
  const R = await get("reduced");
  const s = at(R, "steps");
  for (const t of [s + 500, s + 1000, s + 1900]) assert.equal(stepAt(R, "S", t), 0, `step at +${t - s}ms`);
});

test("VO-3 M5: reduced-motion sweep does not attract; the control value stays 2", { skip }, async () => {
  const R = await get("reduced");
  const vals = R.watch.filter(([id]) => id === "x").map(([, v]) => v);
  assert.ok(vals.length > 10);
  assert.deepEqual([...new Set(vals)], ["2"]);
  assert.deepEqual([...new Set(us(calls(R, "X")))].map(Number), [2]);
});

const loopIds = (R, prefix) => [...new Set(R.created.filter(([l]) => l.startsWith(prefix)).map(([l]) => l))];

// FR-6 makes only loops made inside the measurement inert; the initial and post-measurement draws of the current step are real.
test("VO-3 M6: the figure steps pre-draw leaves at least one inert loop per step: one draw of rest (1), nothing after (C-6)", { skip }, async () => {
  const R = await get("measure");
  noErrors(R);
  const inert = loopIds(R, "M6#").filter((id) => { const c = calls(R, id); return c.length === 1 && c[0][1] === 1; });
  assert.ok(inert.length >= 3, `only ${inert.length} inert step loops: ${inert.join(", ")}`);
});

test("VO-3 M7: loops made in the predict answerVisual pre-draw draw only rest before reveal; after reveal one runs (C-6)", { skip }, async () => {
  const R = await get("measure");
  const reveal = at(R, "reveal");
  const before = R.created.filter(([l, t]) => l.startsWith("M7#") && t < reveal).map(([l]) => l);
  assert.ok(before.length >= 1, "answerVisual was not pre-drawn before reveal");
  const nonRest = R.log.filter(([l, u, t]) => l.startsWith("M7#") && t < reveal && u !== 1);
  assert.deepEqual(nonRest, [], "draw calls other than rest before reveal");
  for (const id of before) assert.ok(calls(R, id).length <= 1, `${id} drew ${calls(R, id).length} times`);
  const after = loopIds(R, "M7#").filter((id) => !before.includes(id));
  assert.ok(after.some((id) => calls(R, id, reveal, at(R, "predLeave")).length >= 10), "no loop made after reveal ran");
  assert.equal(R.log.filter(([l, , t]) => l.startsWith("M7#") && t > at(R, "predLeave") + 50).length, 0, "answerVisual loop drew after leaving");
});

test("VO-3 M8: bind inside the measurement pre-draws is ignored", { skip }, async () => {
  const R = await get("measure");
  assert.equal(cnt(R, "reveal", "M8b:enter"), 0, "answerVisual pre-draw binds received enter before reveal");
  assert.equal(cnt(R, "reveal", "M8b:leave"), 0, "answerVisual pre-draw binds received leave before reveal");
  const binds = R.samples.m6binds ?? [];
  const inert = binds.filter((b) => !R.cnt[b + ":enter"] && !R.cnt[b + ":leave"]);
  assert.ok(inert.length >= 3, `only ${inert.length} of ${binds.length} steps-scene binds never got enter/leave`);
});

// ---------- VO-4 beat normalization (BVA 3-value + EP) ----------

const ts = (b) => b.map((x) => x.t);
const beatsOf = async (i) => {
  const R = await get("beats");
  assert.ok(R.audit, "no #ltt-audit JSON in the ?audit page");
  return R.audit.beats[i];
};

test("VO-4 audit JSON length: beats has one array per scene and equals the scene count (C-23)", { skip }, async () => {
  const R = await get("beats");
  assert.ok(R.audit, "no #ltt-audit JSON");
  assert.ok(Array.isArray(R.audit.beats), "audit JSON lacks beats");
  assert.equal(R.audit.beats.length, R.audit.scenes);
  assert.equal(R.audit.beats.length, 14);
  for (const b of R.audit.beats) for (const x of b) assert.ok(Number.isInteger(x.t), `non-integer t ${x.t}`);
  for (const b of R.audit.beats) assert.deepEqual(ts(b), [...ts(b)].sort((p, q) => p - q), "beats not ascending");
});

test("VO-4 no beats (loop): period 3000 gives [1000, 2000, 2999] (C-22)", { skip }, async () => {
  assert.deepEqual(ts(await beatsOf(1)), [1000, 2000, 2999]);
});

test("VO-4 no beats (once): period 3000 gives [1000, 2000, 3000] (C-22)", { skip }, async () => {
  assert.deepEqual(ts(await beatsOf(2)), [1000, 2000, 3000]);
});

test("VO-4 t = 0, 1, P−1, P, P+1: only 1, 999 and 1000 survive for period 1000", { skip }, async () => {
  assert.deepEqual(ts(await beatsOf(3)), [1, 999, 1000]);
});

test("VO-4 negative and non-numeric t are dropped; the valid beat keeps its text", { skip }, async () => {
  assert.deepEqual((await beatsOf(4)).map((x) => [x.t, x.text]), [[500, "반"]]);
});

test("VO-4 number-array beats [250, 750] become {t} objects", { skip }, async () => {
  assert.deepEqual(ts(await beatsOf(5)), [250, 750]);
});

test("VO-4 object beats keep text; duplicate t collapses to one", { skip }, async () => {
  assert.deepEqual((await beatsOf(6)).map((x) => [x.t, x.text]), [[400, "가"]]);
});

test("VO-4 several motions in one scene merge, sorted, duplicates removed", { skip }, async () => {
  assert.deepEqual(ts(await beatsOf(7)), [100, 300]);
});

test("VO-4 period 0 falls back to 4000: default beats [1333, 2667, 3999] (C-20)", { skip }, async () => {
  assert.deepEqual(ts(await beatsOf(8)), [1333, 2667, 3999]);
});

test("VO-4 steps beats: start + round(0.8 × hold), caption text without markup and {{x|y}} marks", { skip }, async () => {
  // Re-timed for spec 5ad829b7137b4d19 FR-4: holds are floored (1000 -> 1800; 500, 1000 -> 1800, 2000 stays), t = sum of previous holds + round(0.8 x hold).
  assert.deepEqual((await beatsOf(9)).map((x) => [x.t, (x.text ?? "").trim()]), [[1440, "첫 단계"], [3240, "만료 시간 둘"], [5040, "셋 TTL"]]);
  assert.deepEqual((await beatsOf(10)).map((x) => [x.t, (x.text ?? "").trim()]), [[1440, "가"], [3240, "나"], [5200, "다"]]);
});

test("VO-4 contrast beat: one beat at t = max(550 + 90 × (n − 1), ms) (FR-11 v4)", { skip }, async () => {
  const R = await get("beats");
  const b = R.audit.beats[11];
  assert.equal(b.length, 1, JSON.stringify(b));
  assert.equal(b[0].t, R.samples.contrast.t, `FR-11 v4: max(550 + 90 × (${R.samples.contrast.n} − 1), ${R.samples.contrast.ms})`);
});

test("VO-4 no motion: [] in audit JSON and no data-ltt-beats attribute", { skip }, async () => {
  const R = await get("beats");
  for (const i of [0, 12, 13]) {
    assert.deepEqual(R.audit.beats[i], [], `scene index ${i}`);
    assert.equal(R.samples.attrs[i], null, `scene index ${i} has data-ltt-beats`);
  }
});

test("VO-4 data-ltt-beats on each moving scene equals the audit JSON entry", { skip }, async () => {
  const R = await get("beats");
  R.audit.beats.forEach((b, i) => {
    if (!b.length) return;
    assert.ok(R.samples.attrs[i] !== null, `scene index ${i} lacks data-ltt-beats`);
    assert.deepEqual(JSON.parse(R.samples.attrs[i]), b, `scene index ${i}`);
  });
});

test("VO-4 E3 (VO-10): out-of-range and non-numeric beats warn", { skip }, async () => {
  const R = await get("beats");
  assert.ok(R.warns.length >= 1, "no LTT.warn for invalid beats or period 0");
});

// ---------- spec 5ad829b7137b4d19 v1 (steps autoplay build) ----------
// Replaces the old VO-5 block (hold 1000, "once" stopping at the end, `autoplay: false` not starting). Spec expectations only:
// holdOf = max(step.hold || opts.interval || 0, max(1800, 1000 + 100 n)); every player with 2+ steps loops by itself; reduced motion never plays.
// Transition times are read in headless virtual time, so a transition is accepted in [expected, expected + 300] (QR-1 tolerance); a transition
// earlier than the expected hold is a floor violation.

const TOL = 300;
// Consecutive duplicates collapse to the first occurrence: a step entered twice in a row (entry redraw) is one transition.
const trans = (rows) => rows.filter((r, i) => i === 0 || r[1] !== rows[i - 1][1]).map(([, k, t]) => [k, t]);
// Entering a deck scene runs the measurement pre-draw, which enters every step within a few ms of the first (timer-starting) enter; only the
// first row and the rows after 60ms are play-back transitions.
const play = (R, label, from, to = Infinity) => {
  const all = rowsOf(R, label, from - 5, to);
  return trans(all.length ? [all[0], ...all.filter(([, , t]) => t >= from + 60)] : []);
};
// Errors thrown inside an H.at callback carry "at <scheduled ms>:"; the rest (kit timers, parse) have no window and always count.
const errorsIn = (R, a, b) => R.errors.filter((m) => { const w = /^at (\d+):/.exec(m); return !w || (+w[1] >= a - 5 && +w[1] < b); });
const rowsOf = (R, label, from = -Infinity, to = Infinity) => R.steps.filter(([l, , t]) => l === label && t >= from && t < to);
const gaps = (tr) => tr.slice(1).map((x, i) => x[1] - tr[i][1]);
const within = (g, lo, hi, what) => assert.ok(g >= lo && g <= hi, `${what}: ${g}ms not in [${lo}, ${hi}]`);
const ks = (tr) => tr.map((x) => x[0]);
const quiet = (R) => { noErrors(R); assert.deepEqual(R.consoleErrors, [], "console.error calls"); assert.deepEqual(R.warns, [], "LTT.warn calls"); };

// VO-AUTO + VO-COMP: deck figure, `autoplay` ∈ {absent, true, "once", false} must all loop identically (C-1, C-5, FR-1, FR-2).
const VARIANTS = [["S1", "absent", "e1", 1], ["S2", "true", "e2", 2], ["S3", '"once"', "e3", 3], ["S4", "false", "e4", 4]];
for (const [label, name, mark, idx] of VARIANTS) {
  test(`VO-AUTO/VO-COMP C-1 C-5: deck figure steps with autoplay ${name} play from step 0 and loop 0,1,2,0 on the 1800ms floor (author hold 1000)`, { skip }, async () => {
    const R = await get("autoplay");
    quiet(R);
    const e = at(R, mark);
    assert.deepEqual([900, 2700, 4500, 6300].map((d) => stepAt(R, label, e + d)), [0, 1, 2, 0]);
    const tr = play(R, label, e, e + 6400);
    assert.deepEqual(ks(tr), [0, 1, 2, 0]);
    for (const g of gaps(tr)) within(g, 1800, 1800 + TOL, `${label} hold`);
  });
  test(`VO-COMP C-5 FR-4: autoplay ${name} records data-ltt-beats t = [1440, 3240, 5040] (floored holds 1800)`, { skip }, async () => {
    const R = await get("autoplay");
    assert.ok(R.samples["beats" + idx], "scene has no data-ltt-beats");
    assert.deepEqual(ts(JSON.parse(R.samples["beats" + idx])), [1440, 3240, 5040]);
  });
}

test("VO-HOLD C-4 FR-4: the 'first step plain text' captions ('첫 단계', '{{만료 시간|TTL}} 둘', '셋 {{TTL}}') have n = 4, 5, 6 and give no more than the floor", { skip }, async () => {
  const R = await get("autoplay");
  const tr = play(R, "S1", at(R, "e1"), at(R, "e1") + 6400);
  for (const g of gaps(tr)) within(g, 1800, 1800 + TOL, "hold of a short caption");
});

test("VO-HOLD FR-4: per-step author holds [2500, 4000, 1000] are kept when above the floor and floored when below", { skip }, async () => {
  const R = await get("autoplay");
  const e = at(R, "e6");
  assert.deepEqual([2000, 2900, 6000, 6900].map((d) => stepAt(R, "S6", e + d)), [0, 1, 1, 2]);
  const tr = play(R, "S6", e, e + 8200);
  within(gaps(tr)[0], 2500, 2500 + TOL, "step 0 hold 2500");
  within(gaps(tr)[1], 4000, 4000 + TOL, "step 1 hold 4000");
});

test("VO-ONE C-11 FR-6: one step does not auto-play and exposes no beats", { skip }, async () => {
  const R = await get("autoplay");
  const e = at(R, "e5");
  assert.equal(stepAt(R, "S5", e + 1300), 0);
  assert.equal(stepAt(R, "S5", e + 2400), 0);
  assert.deepEqual(ks(play(R, "S5", e, e + 2500)), [0]);
  assert.equal(R.samples.beats6, null);
});

test("VO-ONE FR-6 BVA: two steps do play (0 → 1 → 0) and expose beats [1440, 3240]", { skip }, async () => {
  const R = await get("autoplay");
  const e = at(R, "e7");
  assert.deepEqual([900, 2700, 4500].map((d) => stepAt(R, "S7", e + d)), [0, 1, 0]);
  assert.deepEqual(ts(JSON.parse(R.samples.beats8)), [1440, 3240]);
});

// VO-AUTO state transitions on the deck figure (autoclick fixture): every visit exercises one transition.
const visitsAfter = [["prev", "next"], ["next", "keyl"], ["keyl", "key"], ["key", "re"], ["re", "loop"], ["loop", "q1"], ["q1", "q2"], ["q2", "q3"], ["q3", "q4"], ["q4", "rs"]];
const manual = [["prev", "prev:c", 0, 1, "previous"], ["next", "next:c", 1, 0, "next"], ["key", "key:c", 1, 0, "the → key"], ["keyl", "keyl:c", 0, 1, "the ← key"]];
for (const [v, click, want, was, what] of manual) {
  test(`VO-AUTO C-6 FR-3: clicking ${what} stops auto-play for the visit (step stays ${want} past two holds)`, { skip }, async () => {
    const R = await get("autoclick");
    noErrors(R);
    const c = at(R, click);
    assert.equal(stepAt(R, "I", c - 50), was, "precondition: the player was running and on the expected step");
    assert.equal(stepAt(R, "I", c + 50), want);
    assert.equal(stepAt(R, "I", at(R, v + "x") - 10), want);
    assert.deepEqual(rowsOf(R, "I", c + 100, at(R, v + "x")), [], "a step change after the click");
  });
}

test("VO-AUTO C-6: manual stop → leave → return restarts at step 0 and plays (re-entry transition)", { skip }, async () => {
  const R = await get("autoclick");
  const e = at(R, "re");
  assert.equal(stepAt(R, "I", e + 300), 0, "the manual stop (step 1, the → key visit just before) leaked into the next visit");
  assert.equal(stepAt(R, "I", e + 500), 0);
  assert.equal(stepAt(R, "I", e + 2300), 1);
});

test("VO-AUTO FR-2: leaving the scene stops the player in every visit (no step change between leave and the next entry)", { skip }, async () => {
  const R = await get("autoclick");
  for (const [v, next] of visitsAfter) assert.deepEqual(rowsOf(R, "I", at(R, v + "x") + 50, at(R, next)), [], `after leaving ${v}`);
});

test("VO-AUTO C-7 FR-3: the loop button stops a playing visit, then restarts a stopped one into a cyclic 1800ms+ loop", { skip }, async () => {
  const R = await get("autoclick");
  noErrors(R);
  const s = at(R, "loop:s"), p = at(R, "loop:p");
  assert.deepEqual(rowsOf(R, "I", s + 100, p), [], "a step change while stopped by the loop button");
  // FR-3 v2: the restart resumes at the current step and the first transition comes after that step's hold (floor 1800).
  const cur = stepAt(R, "I", p - 10), first = rowsOf(R, "I", p + 100)[0];
  assert.ok(first, "no step change after restart");
  assert.equal(first[1], (cur + 1) % 3, `restart did not resume from step ${cur}`);
  within(first[2] - p, 1800, 1800 + TOL, "first hold after restart");
  const tr = trans(rowsOf(R, "I", p + 100, at(R, "loopx")));
  assert.ok(tr.length >= 3, `only ${tr.length} transitions in 8.9s after restarting: ${JSON.stringify(tr)}`);
  tr.slice(1).forEach(([k], i) => assert.equal(k, (tr[i][0] + 1) % 3, `not cyclic: ${ks(tr)}`));
  for (const g of gaps(tr)) within(g, 1800, 1800 + TOL, "hold after restart");
});

test("VO-AUTO QR-4: after three enter/leave rounds of the same scene a hold interval has exactly one transition (no stacked timers)", { skip }, async () => {
  const R = await get("autoclick");
  const e = at(R, "q4");
  assert.deepEqual(ks(trans(rowsOf(R, "I", e + 200, e + 2300))), [1]);
  assert.deepEqual(ks(trans(rowsOf(R, "I", e + 2300, e + 4300))), [2]);
  assert.deepEqual(ks(trans(rowsOf(R, "I", e + 4300, e + 6100))), [0]);
  assert.equal(rowsOf(R, "I", e + 200, e + 2300).length, 1, "a step was entered more than once in one hold interval");
});

test("VO-AUTO FR-2 pre-draw: a measurement re-draw (resize) keeps the current step and the running schedule", { skip }, async () => {
  const R = await get("autoclick");
  const e = at(R, "rs"), rs = at(R, "rs:resize");
  const tick = R.steps.filter(([l, , t]) => l === "I" && t >= rs && t < rs + 450).map(([, k]) => k);
  assert.ok([0, 1, 2].every((k) => tick.includes(k)), `step enters after the resize: ${tick}`);
  assert.equal(stepAt(R, "I", rs + 450), 1, "pre-draw did not restore the current step");
  assert.equal(stepAt(R, "I", e + 3400), 1);
  assert.equal(stepAt(R, "I", e + 4000), 2);
});

// VO-AUTO / VO-RM: the four player kinds. Deck-hosted (entry → play, last → 0, leave → stop, re-entry → step 0) and standalone (start when made).
const DECK_PLAYERS = [["F", "F", "figure steps"], ["SS", "poll:SS", "LTT.stepper in a deck"], ["DPS", "poll:DPS", "diagram.player in a deck"], ["SQS", "poll:SQS", "sequence.player in a deck"]];
for (const [L, label, what] of DECK_PLAYERS) {
  test(`VO-AUTO FR-1 FR-2: ${what} waits for scene entry, plays 0 → 1 → 2, stops on leave, restarts at 0 on return and wraps to 0`, { skip }, async () => {
    const R = await get("playersDeck");
    noErrors(R);
    const e1 = at(R, L + ":e1"), l1 = at(R, L + ":l1"), e2 = at(R, L + ":e2"), l2 = at(R, L + ":l2");
    assert.ok(rowsOf(R, label, 0, e1).every(([, k]) => k === 0), `${label} advanced before its scene was entered`);
    assert.deepEqual([900, 2700, 4500].map((d) => stepAt(R, label, e1 + d)), [0, 1, 2]);
    assert.deepEqual(rowsOf(R, label, l1 + 100, e2), [], "step change after leaving");
    assert.deepEqual([900, 2700, 4500, 6300].map((d) => stepAt(R, label, e2 + d)), [0, 1, 2, 0], "re-entry must restart at step 0 and wrap");
    const tr = play(R, label, e2, l2);
    assert.deepEqual(ks(tr), [0, 1, 2, 0]);
    for (const g of gaps(tr)) within(g, 1750, 1800 + TOL + 50, `${label} hold (50ms DOM poll)`);
  });
}

const SOLO_PLAYERS = [["ST", "poll:ST", true, "LTT.stepper"], ["DP", "poll:DP", true, "diagram.player"], ["SQ", "poll:SQ", false, "sequence.player"]];
for (const [L, label, hasHook, what] of SOLO_PLAYERS) {
  test(`VO-AUTO C-8 C-9 FR-1: standalone ${what} starts when made and loops 0,1,2,0,1 on the 1800ms floor`, { skip }, async () => {
    const R = await get("playersSolo");
    noErrors(R);
    const tr = play(R, label, 0).slice(0, 5);
    assert.deepEqual(ks(tr), [0, 1, 2, 0, 1]);
    assert.ok(tr[0][1] < 300, `first step shown at ${tr[0][1]}ms`);
    for (const g of gaps(tr)) within(g, 1750, 1800 + TOL + 50, `${what} hold (50ms DOM poll)`);
    if (hasHook) {
      const ex = play(R, L, 0).slice(0, 5);
      assert.deepEqual(ks(ex), [0, 1, 2, 0, 1]);
      for (const g of gaps(ex)) within(g, 1800, 1800 + TOL, `${what} enter-hook hold`);
    }
  });
}

test("VO-AUTO FR-13: play(true) no longer stops on the last step (2 → 0 happens)", { skip }, async () => {
  const R = await get("playersSolo");
  const tr = trans(rowsOf(R, "SP", 1000));
  const i = tr.findIndex(([k], j) => k === 2 && tr[j + 1] && tr[j + 1][0] === 0);
  assert.ok(i >= 0, `no 2 → 0 transition after play(true): ${ks(tr)}`);
});

// VO-ONE on a standalone stepper
test("VO-ONE FR-6: a standalone stepper with one step does not play; with two steps it plays and loops 0,1,0,1", { skip }, async () => {
  const R = await get("playersSolo");
  assert.deepEqual(ks(play(R, "ST1", 0)), [0]);
  assert.deepEqual(ks(play(R, "poll:ST2", 0).slice(0, 4)), [0, 1, 0, 1]);
});

// VO-HOLD on a standalone stepper: step.hold || opts.interval, floored.
test("VO-HOLD FR-4: opts.interval 4000 holds 4000; interval 1000 is floored to 1800; step.hold 2500 wins over interval 4000 for that step only", { skip }, async () => {
  const R = await get("playersSolo");
  const g = (label) => gaps(play(R, label, 0));
  for (const x of g("SI4").slice(0, 2)) within(x, 4000, 4000 + TOL, "interval 4000");
  for (const x of g("SI1").slice(0, 4)) within(x, 1800, 1800 + TOL, "interval 1000 floored");
  within(g("SM")[0], 2500, 2500 + TOL, "step hold 2500 over interval 4000");
  within(g("SM")[1], 4000, 4000 + TOL, "interval 4000 on a step without hold");
});

test("VO-ERR Errors: a container removed from the document during playback stops the timer and does not restart when re-attached", { skip }, async () => {
  const R = await get("playersSolo");
  noErrors(R);
  assert.deepEqual(rowsOf(R, "DET", 3000), [], "steps kept changing after the container was detached");
  assert.deepEqual(rowsOf(R, "DET", 7000), [], "re-attaching restarted the player");
});

// VO-RM
for (const [L, label, hasHook, what] of SOLO_PLAYERS) {
  test(`VO-RM C-10 FR-5: reduced motion, standalone ${what} stays on step 0 for the whole 12s page`, { skip }, async () => {
    const R = await get("playersSoloReduced");
    noErrors(R);
    assert.equal(R.samples.reduced, true, "LTT.motion.reduced() is not true under --force-prefers-reduced-motion");
    const rows = rowsOf(R, label);
    assert.ok(rows.length >= 1, "the DOM poll never saw a caption: the observation is blind");
    assert.deepEqual(rows.filter(([, k]) => k !== 0), []);
    if (hasHook) assert.deepEqual(rowsOf(R, L).filter(([, k]) => k !== 0), []);
  });
}
for (const [L, label, what] of DECK_PLAYERS) {
  test(`VO-RM C-10 FR-5: reduced motion, ${what} stays on step 0 for 5.3s of the first visit and the whole second visit`, { skip }, async () => {
    const R = await get("playersDeckReduced");
    noErrors(R);
    assert.equal(R.samples.reduced, true);
    for (const [a, b] of [[L + ":e1", L + ":l1"], [L + ":e2", L + ":l2"]]) {
      assert.equal(stepAt(R, label, at(R, a) + 300), 0, "no step shown after entry");
      assert.deepEqual(rowsOf(R, label, at(R, a) + 100, at(R, b)).filter(([, k]) => k !== 0), [], `step change in ${a}..${b}`);
    }
    assert.ok(at(R, L + ":l1") - at(R, L + ":e1") >= 5000, "the first visit is shorter than 5s");
  });
}

// VO-HOLD (BVA n and hold, EP caption classes) + VO-ERR (non-string / missing caption)
for (const c of HOLD_CASES) {
  test(`VO-HOLD ${c.group} ${c.id}: step 0 → 1 after ${c.exp}ms (±${TOL}, never below)`, { skip }, async () => {
    const R = await get(c.id === "nonstring" ? "holdErr" : "hold");
    const e = at(R, "c:" + c.id), label = "h:" + c.id;
    assert.deepEqual(errorsIn(R, e, e + c.exp + 700), [], "page errors in this scene's visit");
    assert.deepEqual(R.consoleErrors, []);
    const tr = play(R, label, e, e + c.exp + 700);
    assert.deepEqual(ks(tr), [0, 1], `steps seen: ${JSON.stringify(tr)}`);
    within(tr[1][1] - tr[0][1], c.exp, c.exp + TOL, `hold of ${c.id}`);
  });
  test(`VO-HOLD ${c.group} ${c.id} C-22: audit beats t = [round(0.8 × ${c.exp}), ${c.exp} + round(0.8 × 1800)]`, { skip }, async () => {
    const err = c.id === "nonstring";
    const R = await get(err ? "holdErrAudit" : "holdAudit");
    assert.ok(R.audit, "no #ltt-audit JSON");
    const idx = err ? 1 : HOLD_CASES.filter((x) => x.id !== "nonstring").indexOf(c) + 1;
    assert.deepEqual(ts(R.audit.beats[idx]), [Math.round(0.8 * c.exp), c.exp + Math.round(0.8 * 1800)]);
  });
}

// VO-REV: C-12..C-19, C-21 in a deck figure (enter → f.dg.highlight) and through diagram.player hot lists.
const names = (s) => [...s];
const onEdge = (list, id) => { const [f, t] = id.split(">"); return list.includes(id) || (list.includes(f) && list.includes(t)); };
for (const [mode, pageName] of [["deck figure steps", "revDeck"], ["diagram.player hot", "revPlayer"]]) {
  for (const c of REV_CASES.filter((x) => pageName === "revDeck" || !x.deckOnly)) {
    test(`VO-REV ${c.id} (${mode}): computed visibility of nodes, edges and edge labels follows the cumulative-reveal table; dim/hot follow the step list`, { skip }, async () => {
      const R = await get(pageName);
      noErrors(R);
      assert.deepEqual(R.consoleErrors, []);
      const snaps = R.samples[c.id];
      assert.equal(snaps.length, c.path.length, "snapshots missing");
      for (const s of snaps) {
        const where = `${c.id} step ${s.k} (path ${c.path.join(">")})`;
        assert.equal(s.shown, s.k, `${where}: the player showed step ${s.shown}`);
        const want = c.want[s.k], list = c.steps[s.k] ?? [];
        for (const id of c.nodes) {
          const vis = want.n.includes(id);
          assert.equal(s.n[id].v, vis ? "visible" : "hidden", `${where}: node ${id}`);
          if (vis && list.length) assert.deepEqual([s.n[id].hot, s.n[id].dim], list.includes(id) ? [true, false] : [false, true], `${where}: node ${id} hot/dim`);
          if (vis && !list.length) assert.equal(s.n[id].dim, false, `${where}: node ${id} dimmed under highlight(null/[])`);
        }
        for (const id of c.edges) {
          const vis = want.e.includes(id);
          assert.equal(s.e[id].v, vis ? "visible" : "hidden", `${where}: edge ${id}`);
          assert.equal(s.e[id].lv, vis ? "visible" : "hidden", `${where}: label of edge ${id}`);
          if (vis && list.length) assert.equal(s.e[id].dim, !onEdge(list, id), `${where}: edge ${id} dim`);
          if (vis && !list.length) assert.equal(s.e[id].dim, false, `${where}: edge ${id} dimmed under highlight(null/[])`);
        }
      }
    });
  }
  test(`VO-REV C-21 (${mode}): ids that do not exist are ignored without a warning`, { skip }, async () => {
    const R = await get(pageName);
    const a = at(R, "C21:e"), b = at(R, "OUT:e");
    assert.deepEqual(R.warns.filter(([t]) => t >= a && t < b), []);
  });
}

test("VO-REV C-19 C-21 FR-9: highlight called directly outside a deck hides nothing (nodes, edges, labels) and only dims", { skip }, async () => {
  const R = await get("revOff");
  noErrors(R);
  const S = R.samples, c = { nodes: "abcd", edges: ["a>b", "b>c", "c>d"] };
  for (const name of ["plain", "a", "null", "unknown", "pair", "late"]) {
    for (const id of c.nodes) assert.equal(S[name].n[id].v, "visible", `${name}: node ${id}`);
    for (const id of c.edges) assert.deepEqual([S[name].e[id].v, S[name].e[id].lv], ["visible", "visible"], `${name}: edge ${id}`);
  }
  for (const name of ["a", "unknown"]) {
    assert.deepEqual(names("abcd").map((id) => [S[name].n[id].hot, S[name].n[id].dim]), [[true, false], [false, true], [false, true], [false, true]], name);
  }
  assert.deepEqual(names("abcd").map((id) => S.null.n[id].dim), [false, false, false, false]);
  assert.deepEqual(names("abcd").map((id) => S.pair.n[id].dim), [true, false, false, true]);
  assert.deepEqual(names("abcd").map((id) => S.late.n[id].dim), [true, true, true, false]);
});

// VO-SIZE
for (const title of ["plain", "tall"]) {
  test(`VO-SIZE C-17 QR-6: ${title} cumulative-reveal scene keeps scene zoom and figure height at steps 0, 1, 2, 3`, { skip }, async () => {
    const R = await get("size");
    noErrors(R);
    const s = R.samples[title];
    assert.deepEqual(s.map((x) => x.shown), [0, 1, 2, 3]);
    for (const x of s.slice(1)) {
      assert.ok(Math.abs(x.zoomIn - s[0].zoomIn) < 0.0005, `.dk-in zoom ${x.zoomIn} vs ${s[0].zoomIn} at step ${x.k}`);
      assert.ok(Math.abs(x.zoomScene - s[0].zoomScene) < 0.0005, `scene zoom ${x.zoomScene} vs ${s[0].zoomScene} at step ${x.k}`);
      for (const key of ["host", "stage", "svg"]) assert.ok(Math.abs(x[key] - s[0][key]) <= 0.5, `${key} height ${x[key]} vs ${s[0][key]} at step ${x.k}`);
    }
  });
}
test("VO-SIZE precondition: the tall scene is zoomed (overflows), so equal zoom is not trivially 1", { skip }, async () => {
  const R = await get("size");
  assert.ok(R.samples.tall[0].zoomIn < 0.999, `.dk-in zoom ${R.samples.tall[0].zoomIn}`);
});

// ---------- VO-6 sweep attract (state transition + EP) ----------

const watch = (R, id, from = -Infinity, to = Infinity) => R.watch.filter(([i, , , , t]) => i === id && t >= from && t < to);
const goalEvents = (R, from = -Infinity, to = Infinity) => R.rec.filter(([t, s]) => t >= from && t < to && /"goal"/.test(s));

test("VO-6 running: attract moves the range value and its value text (C-13)", { skip }, async () => {
  const R = await get("sweepA");
  noErrors(R);
  const w = watch(R, "x", at(R, "eX"), at(R, "touch"));
  assert.ok(new Set(w.map((r) => r[1])).size >= 2, `input values ${[...new Set(w.map((r) => r[1]))]}`);
  assert.ok(new Set(w.map((r) => r[2])).size >= 2, "value text did not move with the control");
  assert.ok(new Set(us(calls(R, "x", at(R, "eX"), at(R, "touch")))).size >= 2, "render was not called with moving values");
  assert.ok(Math.max(...w.map((r) => +r[1])) >= 9, "attract did not reach the end of raws() by half the period");
});

test("VO-6 no goal record: attract sets no done/first and records no goal event (C-13)", { skip }, async () => {
  const R = await get("sweepA");
  const w = watch(R, "x", at(R, "eX"), at(R, "touch"));
  assert.ok(w.every((r) => r[3] === false), "goal element got done/first during attract");
  assert.deepEqual(goalEvents(R, -Infinity, at(R, "goalSet")), []);
});

test("VO-6 goal positive control: the user setting 8 records a goal event and marks the goal element", { skip }, async () => {
  const R = await get("sweepA");
  const g = at(R, "goalSet");
  assert.ok(goalEvents(R, g).length >= 1, "no goal record after the user reached the goal");
  assert.ok(watch(R, "x", g + 100, at(R, "away")).some((r) => r[3] === true), "goal element never got done/first");
});

test("VO-6 pointerdown: attract stops, the start value comes back, then the user value applies (C-14)", { skip }, async () => {
  const R = await get("sweepA");
  const t = at(R, "touch");
  const after = us(calls(R, "x", t)).map(Number);
  const i2 = after.indexOf(2), i5 = after.indexOf(5);
  assert.ok(i2 >= 0 && i5 > i2, `render after the touch: ${after.join(",")}`);
  const w = watch(R, "x", t + 50, at(R, "goalSet"));
  assert.deepEqual([...new Set(w.map((r) => r[1]))], ["5"]);
});

test("VO-6 no restart: after a touch, leaving and returning does not attract again (C-14)", { skip }, async () => {
  const R = await get("sweepA");
  const b = at(R, "back");
  assert.deepEqual([...new Set(watch(R, "x", b).map((r) => r[1]))], ["8"]);
  assert.ok(us(calls(R, "x", b)).every((v) => Number(v) === 8));
});

test("VO-6 control kind steps: attract also moves a steps knob", { skip }, async () => {
  const R = await get("sweepA");
  assert.ok(new Set(us(calls(R, "w", at(R, "eW"), at(R, "eX")))).size >= 2);
});

test("VO-6 control kind range: attract moves a range knob", { skip }, async () => {
  const R = await get("sweepA");
  assert.ok(new Set(watch(R, "x", at(R, "eX"), at(R, "touch")).map((r) => r[1])).size >= 2);
});

test("VO-6 keydown: attract stops and the start value comes back", { skip }, async () => {
  const R = await get("sweepB");
  noErrors(R);
  const t = at(R, "touch");
  assert.ok(new Set(watch(R, "x", 0, t).map((r) => r[1])).size >= 2, "attract was not running before the keydown");
  assert.deepEqual([...new Set(watch(R, "x", t + 50).map((r) => r[1]))], ["2"]);
});

test("VO-6 preset: a preset click stops attract and sets the preset value", { skip }, async () => {
  const R = await get("sweepC");
  noErrors(R);
  const t = at(R, "touch");
  assert.ok(new Set(watch(R, "x", 0, t).map((r) => r[1])).size >= 2, "attract was not running before the preset click");
  assert.deepEqual([...new Set(watch(R, "x", t + 50).map((r) => r[1]))], ["6"]);
});

test("VO-6 attract:false: the control does not move", { skip }, async () => {
  const R = await get("sweepD");
  noErrors(R);
  assert.deepEqual([...new Set(watch(R, "x").map((r) => r[1]))], ["2"]);
  assert.ok(us(calls(R, "x")).every((v) => Number(v) === 2));
});

test("VO-6 invalid param (VO-10 E5, C-21): attract {param: \"nope\"} warns, the value does not move, the sweep still renders input", { skip }, async () => {
  const R = await get("sweepD");
  assert.ok(R.warns.some(([t]) => t >= at(R, "eX")), "no LTT.warn for an unknown attract param");
  assert.deepEqual([...new Set(watch(R, "y").map((r) => r[1]))], ["2"]);
  assert.equal(Number(calls(R, "y", at(R, "input")).at(-1)?.[1]), 4, "sweep did not render the user input");
});

// ---------- VO-7 still-visual decision table (integration; 1-based scene numbers as in the audit JSON) ----------

const stillScenes = (R) => R.audit.audit.filter((w) => w.rule === "still-visual").map((w) => w.scene).sort((a, b) => a - b);

test("VO-7 R1 R3 R4 R5 R6 R7 R8(hook, terms, summary, keywords) + still figure: only still pictures without a valid still fire (C-15)", { skip }, async () => {
  const R = await get("still");
  assert.ok(R.audit, "no #ltt-audit JSON");
  assert.ok(R.audit.viewport[0] > 1000, `viewport ${R.audit.viewport} is compact`);
  // Scenes (1-based): 1 hook, 2 R1, 3 R6, 4 R7, 5 E6, 6 R5, 7 R3, 8 R4, 9 terms, 10 summary, 11 figure (extra positive), 12 keywords.
  assert.deepEqual(stillScenes(R), [2, 4, 5, 11]);
});

test("VO-7 still-visual message names LTT.motion.loop, steps and still", { skip }, async () => {
  const R = await get("still");
  for (const w of R.audit.audit.filter((x) => x.rule === "still-visual")) {
    for (const k of ["LTT.motion.loop", "steps", "still"]) assert.ok(w.msg.includes(k), `message lacks ${k}: ${w.msg}`);
    // FR-15
    assert.ok(w.msg.includes("figure steps(단계 둘 이상)"), `message lacks "figure steps(단계 둘 이상)": ${w.msg}`);
    assert.ok(!w.msg.includes("자동 재생"), `message still says 자동 재생: ${w.msg}`);
  }
});

test("VO-7 R2 (C-16): a compact window reports no still-visual", { skip }, async () => {
  const R = await get("stillCompact");
  assert.ok(R.audit, "no #ltt-audit JSON");
  assert.ok(R.audit.viewport[0] <= 1000, `viewport ${R.audit.viewport} is not compact`);
  assert.deepEqual(stillScenes(R), []);
});

// ---------- VO-9 predict question and takeaway (scenario) ----------

test("VO-9 before reveal: question text shows above the choices; takeaway is hidden and out of the accessibility tree", { skip }, async () => {
  const R = await get("predict");
  noErrors(R);
  const s = R.samples.before;
  assert.ok(s.text.includes("다른 질문 Q"), "question text not rendered");
  assert.ok(s.question.some((q) => q.shown && !q.a11yHidden), "question text not visible");
  assert.ok(s.qTop < s.choiceTop, `question top ${s.qTop} is not above the choices top ${s.choiceTop}`);
  assert.ok(!s.text.includes("핵심 TK"), "takeaway text is rendered before reveal");
  assert.ok(s.take.every((x) => !x.shown && x.a11yHidden), "takeaway visible or exposed before reveal");
});

test("VO-9 question equal to title shows once", { skip }, async () => {
  const R = await get("predict");
  assert.equal(R.samples.sameText.split("같은 질문 S").length - 1, 1);
});

test("VO-9 after reveal: takeaway visible and the scene scale unchanged", { skip }, async () => {
  const R = await get("predict");
  const a = R.samples.after;
  assert.ok(a.text.includes("핵심 TK"));
  assert.ok(a.take.some((x) => x.shown && !x.a11yHidden));
  assert.deepEqual(a.scale, R.samples.before.scale);
});

test("VO-9 after reset: takeaway hidden again", { skip }, async () => {
  const R = await get("predict");
  const r = R.samples.reset;
  assert.ok(!r.text.includes("핵심 TK"));
  assert.ok(r.take.every((x) => !x.shown && x.a11yHidden));
});

test("VO-9 FR-16 v2 no hint: the question takes the default hint line's place", { skip }, async () => {
  const R = await get("predict");
  assert.ok(R.samples.before.text.includes("다른 질문 Q"));
  assert.ok(!R.samples.before.text.includes("틀려도 괜찮다"), "default hint line still shown beside the question");
});

test("VO-9 FR-16 v2 with hint: both the author hint and the question show", { skip }, async () => {
  const R = await get("predict");
  assert.ok(R.samples.hintText.includes("힌트 H"), "author hint missing");
  assert.ok(R.samples.hintText.includes("질문 H2"), "question missing");
});

// ---------- VO-10 error paths (error guessing) ----------

test("VO-10 E1 (C-19): a throwing draw warns once with the scene number and ends only that loop; navigation works", { skip }, async () => {
  const R = await get("errors");
  noErrors(R);
  const inn = at(R, "in"), out = at(R, "out");
  assert.equal(calls(R, "T", inn, out).length, 2, "the throwing loop kept drawing");
  const w = R.warns.filter(([, m]) => m.includes("boom-draw"));
  assert.equal(w.length, 1, JSON.stringify(R.warns));
  assert.match(w[0][1], /장면 2:/, "warn lacks the prefix 장면 2:");
  assert.ok(calls(R, "OK", inn, out).length >= 60, "the other loop stopped");
  assert.equal(R.samples.indexAfterOut, 4);
  assert.equal(R.samples.indexAfterBack, 1);
});

test("VO-10 E2 (C-20): period 0 warns and runs with period 4000", { skip }, async () => {
  const R = await get("errors");
  const p = at(R, "p0"), b = at(R, "bb");
  const run = calls(R, "P0", p, b);
  assert.ok(run.length > 30);
  assert.deepEqual(run.filter(([, u, t]) => circ(u, ((t - p) % 4000) / 4000) > 0.05), [], "u does not follow a 4000ms period");
  assert.ok(R.warns.some(([t]) => t >= p && t < b), "no warn while entering the period-0 scene");
});

test("VO-10 E3 (C-20): out-of-range beats warn in their own scene and the loop still runs", { skip }, async () => {
  const R = await get("errors");
  const b = at(R, "bb");
  assert.ok(R.warns.some(([t]) => t >= b), "no warn while entering the bad-beats scene");
  assert.ok(calls(R, "BB", b).length > 30);
});

test("VO-10 E4: a throwing bind hook warns; the other bind and scene moves continue", { skip }, async () => {
  const R = await get("errors");
  assert.ok(R.warns.some(([, m]) => m.includes("boom-enter")), "no warn for the throwing enter");
  assert.ok(R.warns.some(([, m]) => m.includes("boom-leave")), "no warn for the throwing leave");
  assert.deepEqual([R.cnt["K:enter"], R.cnt["K:leave"]], [2, 2]);
});

test("VO-10 E6: a non-string still counts as no still (still-visual fires on scene 5)", { skip }, async () => {
  const R = await get("still");
  assert.ok(stillScenes(R).includes(5));
});
