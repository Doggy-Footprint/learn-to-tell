// Spec 37a2365a466d3e8b v1 (kit absorbs layout, actionable audit): VO-1..VO-5, VO-7, VO-11, VO-12 at the integration layer.
// Fixtures live in tests/fixtures/absorb/ (page.html + scn/*.js + common.js). Each runs once in headless Chrome and writes observations to
// <pre id="R"> (and the kit's own #ltt-audit JSON when ?audit is given). Expected values come from the spec text and from fixture geometry:
// the free height of a scene is derived from a calibration run of the same fixture (cap = clientHeight - 8 and the unabsorbed content height,
// both read from the DOM), never from the kit's absorb output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findChrome } from "../skills/learn-to-tell/server/audit.mjs";
import { expectedSeverity } from "./fixtures/absorb/severity-cases.mjs";

const PAGE = pathToFileURL(fileURLToPath(new URL("./fixtures/absorb/page.html", import.meta.url))).href;
const chrome = findChrome();
const skip = process.env.LTT_AUDIT === "0" ? "LTT_AUDIT=0"
  : process.env.CI && process.env.LTT_AUDIT !== "1" ? "CI without LTT_AUDIT=1"
  : !chrome ? "no Chrome found (set LTT_CHROME)"
  : false;

// ---------- harness (same shape as tests/motion.test.mjs) ----------

const JOBS = 3;
let active = 0;
const queue = [];
const slot = () => new Promise((go) => (active < JOBS ? (active++, go()) : queue.push(go)));
const release = () => { const next = queue.shift(); next ? next() : active--; };

function chromeRun(args, timeout = 180_000) {
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

async function runOnce(query, { size, budget }) {
  await slot();
  const profile = await mkdtemp(join(tmpdir(), "ltt-absorb-"));
  try {
    const { out, error } = await chromeRun(["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
      "--allow-file-access-from-files", `--user-data-dir=${profile}`, `--window-size=${size}`, `--virtual-time-budget=${budget}`, "--dump-dom", `${PAGE}?${query}`]);
    const m = out.match(/<pre id="R">([\s\S]*?)<\/pre>/);
    if (!m) throw new Error(`${query}: no <pre id="R"> in the dumped DOM (${error ?? "budget ran out or the page threw"})`);
    const R = JSON.parse(unescape(m[1]));
    const a = out.match(/<script[^>]*id="ltt-audit"[^>]*>([\s\S]*?)<\/script>/);
    R.audit = a ? JSON.parse(a[1]) : null;
    return R;
  } finally {
    await rm(profile, { recursive: true, force: true });
    release();
  }
}

// Under CPU load headless Chrome can stop before the page reaches H.done; like audit.mjs, retry with triple the budget.
async function runPage(query, opts, attempt = 1) {
  try {
    return await runOnce(query, opts);
  } catch (e) {
    if (attempt >= 3 || !/no <pre id="R">/.test(e.message)) throw e;
    await new Promise((r) => setTimeout(r, 500 * attempt));
    return runPage(query, { ...opts, budget: opts.budget * 3 }, attempt + 1);
  }
}

const pages = new Map();
function page(query, { size = "1280,800", budget = 20000 } = {}) {
  const key = `${query}|${size}`;
  if (!pages.has(key)) {
    const p = skip ? Promise.reject(new Error(String(skip))) : runPage(query, { size, budget });
    p.catch(() => {});
    pages.set(key, p);
  }
  return pages.get(key);
}

const noErrors = (R) => assert.deepEqual(R.errors, [], `page errors: ${R.errors.join(" | ")}`);
const near = (got, want, tol, what) => assert.ok(Math.abs(got - want) <= tol, `${what}: got ${got}, want ${want} ± ${tol}`);
const sameZoom = (a, b, what) => assert.ok(Math.abs(a - b) < 0.0005, `${what}: zoom ${a} vs ${b} (3 decimals)`);
const px = (s) => parseFloat(s);
const clampAbsorb = (b) => Math.min(1, Math.max(0.65, 1 - b));

// ---------- calibration ----------
// One scene with the figure (480px wide, viewBox 640x400, natural 300px high) above a 1px spacer fits at 1280x800. cap is the stage height the
// spec names (scene clientHeight - 8); inH is the unabsorbed content (.dk-in) height. A spacer of N px therefore overflows by N - 1 + inH - cap.

const calib = () => page("s=calib&ns=1").then((R) => {
  const c = R.samples.n1;
  noErrors(R);
  assert.equal(c.zIn, 1, "calibration scene was zoomed: it must fit unadapted");
  near(c.els.fig.h, 300, 0.5, "calibration figure height");
  assert.ok(c.cap - c.inH > 60, `calibration scene leaves only ${c.cap - c.inH}px free`);
  return c;
});

// ---------- VO-1 boundary value analysis (3-value) on the overflow ratio b = overflow / figure height ----------

const POINTS = [
  ["fit-below: 0.06 of the figure height of room left", -0.06],
  ["fit-exact: content equals the stage", 0],
  ["fit-above: overflows by 0.06 of the figure", 0.06],
  ["cap-below: overflows by 0.31 (inside the 35% reach)", 0.31],
  ["cap-exact: overflows by 0.35", 0.35],
  ["cap-above: overflows by 0.45 (beyond the 0.65 floor)", 0.45],
];

const vo1Page = async (b) => {
  const c = await calib();
  const n = Math.round(1 + (c.cap - c.inH) + b * c.els.fig.h);
  return { c, n, R: await page(`s=vo1&n=${n}&audit`) };
};

for (const [label, b] of POINTS) {
  test(`VO-1 ${label} (b=${b}): absorb, figure height, aspect ratio, zoom follow FR-1`, { skip }, async () => {
    const { c, n, R } = await vo1Page(b);
    noErrors(R);
    const s = R.samples.s, m = R.audit.measures[1];
    const F0 = c.els.fig.h, want = clampAbsorb(b);
    const dom = s.els.fig.h / F0;
    near(m.absorb, want, 0.03, `measures[1].absorb (n=${n})`);
    near(dom, want, 0.03, "figure height / natural height");
    near(m.absorb, dom, 0.03, "reported absorb vs observed figure height ratio");
    near(s.els.fig.ratio / c.els.fig.ratio, 1, 0.01, "figure width/height ratio vs unabsorbed");
    sameZoom(m.zoom, s.zIn, "measures zoom vs .dk-in");
    if (b <= 0.31) near(s.zIn, 1, 0.001, ".dk-in zoom (the figure absorbs the whole overflow)");
    if (b === 0.35) assert.ok(s.zIn >= 0.98, `.dk-in zoom ${s.zIn} at the 35% edge`);
    if (b === 0.45) {
      near(m.absorb, 0.65, 0.001, "absorb floor 0.65");
      assert.ok(s.zIn >= 0.9 && s.zIn <= 0.99, `.dk-in zoom ${s.zIn}: the remaining 30px of overflow (0.1 of the figure) goes to zoom`);
    }
    if (b <= 0.35) assert.deepEqual(R.audit.audit.filter((w) => w.scene === 2 && w.rule === "shrunk"), [], "C-1: a scene the figure absorbed fully must not be reported shrunk");
    if (b === -0.06) {
      assert.equal(m.absorb, 1);
      assert.equal(s.els.fig.style, R.samples.init.raw, "C-3: a scene that fits keeps the authored inline style string");
      assert.deepEqual(s.els.fig.mut, [], "FR-1: no attribute mutation at all on the drawing during entry pre-draw (not even a transient one)");
    }
    if (m.absorb === 1) assert.equal(s.els.fig.style, R.samples.init.raw, "absorb 1 leaves the inline style untouched");
    if (m.absorb < 1) assert.notEqual(s.els.fig.style, R.samples.init.raw, "an absorbed figure carries a kit limit");
  });
}

// ---------- VO-2 equivalence partitioning of absorbable figures ----------

const VO2 = [
  [1, "figure stage svg", "absorbed", { t: 300 }],
  [2, "[data-visual] element", "absorbed", { t: 300 }],
  [3, "compare .vis svg (both cards)", "absorbed", { t1: 325, t2: 325 }],
  [4, "untyped mount svg", "absorbed", { t: 300 }],
  [5, "icon svg inside .ltt-ic (excluded), control svg absorbed", "excluded", { c: 300 }, { x: 125 }],
  [6, "svg inside a .ltt-phone mock (excluded), control svg absorbed", "excluded", { c: 300 }, { x: 125 }],
  [7, "svg inside another absorbed [data-visual] (excluded), outer absorbed", "excluded", { c: 300 }, { x: 125 }],
];

for (const [scene, label, kind, absorbed, excluded = {}] of VO2) {
  test(`VO-2 class ${scene} ${label}`, { skip }, async () => {
    const R = await page("s=vo2&audit", { budget: 30000 });
    noErrors(R);
    const s = R.samples["s" + scene];
    for (const [k, F] of Object.entries(absorbed)) near(s.els[k].h / F, 0.65, 0.01, `${k} height / natural (overflow is far beyond 35%, so absorb is the 0.65 floor)`);
    for (const [k, F] of Object.entries(excluded)) {
      near(s.els[k].h, F, 0.5, `excluded ${k} keeps its authored height`);
      assert.equal(s.els[k].style, "display:block;width:200px;", `excluded ${k} keeps its authored inline style string`);
    }
    near(R.audit.measures[scene].absorb, 0.65, 0.001, "measures absorb");
  });
}

// ---------- VO-3 state transitions: zoom and absorbed figure height never change after entry ----------

const vo3 = () => page("s=vo3", { budget: 40000 }).then((R) => { noErrors(R); return R.samples; });
const unchanged = (a, b, keys, what) => {
  sameZoom(a.zIn, b.zIn, `${what} .dk-in`);
  for (const k of keys) near(b.els[k].h, a.els[k].h, 0.5, `${what} figure ${k} height`);
};

test("VO-3 precondition: the predict entry already absorbs for the tallest (revealed) state, steps and recall entries overflow", { skip }, async () => {
  const S = await vo3();
  assert.ok(S["pred.entry"].els.q.h < 225 * 0.99, `question figure ${S["pred.entry"].els.q.h} is unabsorbed although the answer state overflows`);
  assert.ok(S["steps.1"].els.fig.h < 300 * 0.99, `steps figure ${S["steps.1"].els.fig.h} is unabsorbed although step 3 overflows`);
  assert.ok(S["recall.entry"].zIn < 0.99, "recall summary does not overflow: the transition would prove nothing");
});

test("VO-3 T1 predict: question -> choice -> reveal keeps zoom and the question figure height (C-4)", { skip }, async () => {
  const S = await vo3();
  unchanged(S["pred.entry"], S["pred.chosen"], ["q"], "choose");
  unchanged(S["pred.entry"], S["pred.revealed"], ["q"], "reveal");
  assert.ok(S["pred.revealed"].els.a_b, "the answer figure for choice b is not on screen after reveal");
});

test("VO-3 T1b A-3: one ratio for every absorbed figure of the scene (question and answer figure shrink by the same factor)", { skip }, async () => {
  const S = await vo3();
  const q = S["pred.revealed"].els.q.h / 225, a = S["pred.revealed"].els.a_b.h / 300;
  near(q, a, 0.01, "question figure ratio vs answer figure ratio");
});

test("VO-3 T2 predict: reveal -> reset returns to the entry zoom and figure height", { skip }, async () => {
  const S = await vo3();
  unchanged(S["pred.entry"], S["pred.reset"], ["q"], "reset");
  unchanged(S["pred.revealed"], S["pred.reset"], ["q"], "reset vs revealed");
});

for (const [t, name, extraH, steps] of [
  ["T3", "steps.2", "60px", [1]],
  ["T4", "steps.3", "330px", [2]],
  ["T5", "steps.4", "120px", [3]],
  ["T6", "steps.1again", "0px", [0]],
]) {
  test(`VO-3 ${t} figure steps -> ${name}: the step really changed, zoom and figure height stay (C-5)`, { skip }, async () => {
    const S = await vo3();
    assert.equal(S[name].extraH, extraH, "the step content did not move to the expected step");
    assert.deepEqual(S.stepLog.find(([n]) => n === name)[1], steps, "enter calls after the click");
    unchanged(S["steps.1"], S[name], ["fig"], name);
  });
}

test("VO-3 T7 summary recall: hidden -> shown keeps the zoom", { skip }, async () => {
  const S = await vo3();
  assert.equal(S.recallAnswerBefore, false, "precondition: the recall answer is hidden at entry");
  assert.equal(S.recallAnswerAfter, true, "the recall answer did not open");
  unchanged(S["recall.entry"], S["recall.shown"], [], "recall");
});

// ---------- VO-4 decision table: author inline max-height x (desktop overflow, desktop fit, phone) ----------

for (const author of [0, 150]) {
  const nat = author || 300;
  const q = (extra) => `s=vo4&author=${author}${extra}`;
  const tag = author ? "author max-height 150px" : "no author max-height";

  test(`VO-4 [${tag}] x desktop overflow: the kit limit is at most the authored value and the figure is smaller than natural`, { skip }, async () => {
    const R = await page(q(""), { budget: 30000 });
    noErrors(R);
    const e = R.samples.entry.els.fig;
    assert.equal(R.samples.entry.mobile, false);
    assert.ok(e.h < nat - 1, `figure ${e.h}px not absorbed below its natural ${nat}px`);
    assert.ok(px(e.maxH) <= nat + 0.01, `kit max-height ${e.maxH} exceeds the natural/authored ${nat}px`);
    if (author) assert.ok(px(e.maxH) <= author, `kit max-height ${e.maxH} exceeds the authored ${author}px`);
  });

  test(`VO-4 [${tag}] x desktop fit: nothing is written to the figure's style`, { skip }, async () => {
    const R = await page(q("&pre=fit"), { budget: 20000 });
    noErrors(R);
    const s = R.samples.entry;
    assert.equal(s.els.fig.style, R.samples.init.raw, "inline style string changed although the scene fits");
    near(s.els.fig.h, nat, 0.5, "figure height");
    assert.equal(s.zIn, 1);
  });

  test(`VO-4 [${tag}] x overflow -> fit -> overflow: absorb back to 1 restores the authored style, and absorbs again`, { skip }, async () => {
    const R = await page(q(""), { budget: 30000 });
    const { entry, fit, overflowAgain } = R.samples, init = R.samples.init;
    assert.equal(fit.zIn, 1, "precondition: the scene fits once the spacer is hidden");
    assert.equal(fit.els.fig.css, init.css, "authored inline style not restored when absorb returned to 1");
    near(fit.els.fig.h, nat, 0.5, "figure height after absorb returned to 1");
    near(overflowAgain.els.fig.h, entry.els.fig.h, 0.5, "absorbed height after the second overflow");
    assert.ok(px(overflowAgain.els.fig.maxH) <= nat + 0.01);
  });

  test(`VO-4 [${tag}] x phone: no kit height limit remains (real 390px window)`, { skip }, async () => {
    const R = await page(q("&once=1"), { size: "390,844", budget: 20000 });
    noErrors(R);
    const s = R.samples.entry;
    assert.ok(s.iw <= 760, `window is ${s.iw}px wide: not a phone`);
    assert.equal(s.mobile, true, "LTT.mobile() is false in a narrow window");
    assert.equal(s.els.fig.css, R.samples.init.css, "inline style differs from the authored one on the phone layout");
    assert.deepEqual(s.limits.map(([k]) => k).filter((k) => k !== "fig"), [], "a kit height limit sits on another element");
    assert.equal(s.limits.length, author ? 1 : 0, `inline max-height limits: ${JSON.stringify(s.limits)}`);
  });
}

// ---------- VO-5 (C-19): pre-absorb size judges small-visual / loose-figure ----------

const hasRule = (R, scene, rule) => R.audit.audit.some((w) => w.scene === scene && w.rule === rule);

test("VO-5 absorbed class (loose-figure, small-visual): an absorbed figure that was above the bars before absorbing raises neither", { skip }, async () => {
  const R = await page("s=vo5&audit", { budget: 30000 });
  assert.ok(R.audit.measures[1].absorb < 1, "precondition: the figure scene was absorbed at 1280x800");
  for (const rule of ["loose-figure", "small-visual"]) assert.equal(hasRule(R, 2, rule), false, `${rule} was reported on the absorbed scene`);
});

test("VO-5 precondition from DOM rects: the figure's share of its stage is above 35% unabsorbed and below 35% once absorbed", { skip }, async () => {
  const share = (R) => (R.samples.s2.els.fig.w * R.samples.s2.els.fig.h) / (R.samples.stage2.w * R.samples.stage2.h);
  const pre = share(await page("s=vo5&audit", { size: "1280,1700", budget: 30000 })), post = share(await page("s=vo5&audit", { budget: 30000 }));
  assert.ok(pre >= 0.35, `unabsorbed share ${pre}`);
  assert.ok(post < 0.35, `absorbed share ${post}: the test would not notice a kit that judged after absorbing`);
});

test("VO-5 no-absorb class: the same scene unabsorbed (tall window) is clean, proving the pre-absorb size is above both bars", { skip }, async () => {
  const R = await page("s=vo5&audit", { size: "1280,1700", budget: 30000 });
  assert.equal(R.audit.measures[1].absorb, 1);
  for (const rule of ["loose-figure", "small-visual"]) assert.equal(hasRule(R, 2, rule), false, `${rule} on the unabsorbed twin: the fixture is not above the bar`);
});

test("VO-5 positive control: a genuinely small figure is still reported loose-figure and small-visual", { skip }, async () => {
  for (const size of ["1280,800", "1280,1700"]) {
    const R = await page("s=vo5&audit", { size, budget: 30000 });
    for (const rule of ["loose-figure", "small-visual"]) assert.equal(hasRule(R, 3, rule), true, `${size}: ${rule} missing on the small figure`);
  }
});

// ---------- VO-7 scenario and VO-11 syntax ----------

const vo7 = () => page("s=vo7&audit", { budget: 40000 }).then((R) => { noErrors(R); return R; });
const byScene = (R, n) => R.audit.audit.filter((w) => w.scene === n && (w.rule === "shrunk" || w.rule === "overflow"));
const pct = (z) => `${Math.round(z * 100)}%`;

function assertStateMessages(R, scene, { zoomBy, floor }) {
  const m = R.audit.measures[scene - 1];
  const items = byScene(R, scene);
  assert.ok(items.length >= 1, `scene ${scene}: no shrunk/overflow warning although zoom is ${m.zoom}`);
  assert.equal(m.floor, m.zoom <= 0.781, "floor flag vs zoom <= 0.781");
  if (floor !== undefined) assert.equal(m.floor, floor);
  for (const w of items) {
    const at = `scene ${scene} ${w.rule}: ${w.msg}`;
    assert.ok(w.msg.includes(pct(m.zoom)), `no ${pct(m.zoom)} in ${at}`);
    assert.equal(w.msg.includes("78% 하한"), m.floor, `"78% 하한" must appear exactly when floor is true: ${at}`);
    // FR-7 tells floor and "fitted to another state" apart for overflow; FR-6 puts the state name into every shrunk message.
    if (zoomBy && (w.rule === "shrunk" || !m.floor)) assert.ok(w.msg.includes(zoomBy), `no "${zoomBy}" in ${at}`);
    if (!zoomBy) for (const t of ["정답 ", "단계 ", "회상 답", "질문"]) assert.ok(!w.msg.includes(t), `invented state "${t}" in ${at}`);
  }
}

test("VO-7 scene 2: a predict answer decides the zoom -> zoomBy '정답 나'", { skip }, async () => {
  const R = await vo7();
  const m = R.audit.measures[1];
  assert.equal(m.zoomBy, "정답 나");
  assert.ok(m.zoom < 1);
  sameZoom(m.zoom, R.samples.s2.zIn, "measures zoom vs .dk-in");
  assertStateMessages(R, 2, { zoomBy: "정답 나" });
});

test("VO-7 scene 3: a figure step decides the zoom -> zoomBy '단계 3' in measures and in the shrunk message", { skip }, async () => {
  const R = await vo7();
  const m = R.audit.measures[2];
  assert.ok(m.zoom > 0.781 && m.zoom < 0.88, `precondition: zoom ${m.zoom} must be above the floor and below the shrunk bar`);
  assert.equal(m.zoomBy, "단계 3");
  assert.ok(byScene(R, 3).some((w) => w.rule === "shrunk"), "no shrunk warning for scene 3");
  sameZoom(R.audit.measures[2].zoom, R.samples.s3.zIn, "measures zoom vs .dk-in");
  assertStateMessages(R, 3, { zoomBy: "단계 3" });
});

test("VO-7 scene 4: the question itself decides the zoom -> zoomBy '질문'", { skip }, async () => {
  const R = await vo7();
  assert.equal(R.audit.measures[3].zoomBy, "질문");
  sameZoom(R.audit.measures[3].zoom, R.samples.s4.zIn, "measures zoom vs .dk-in");
  assertStateMessages(R, 4, { zoomBy: "질문" });
});

test("VO-7 scene 5: a scene that is tall by itself reaches the floor and has no zoomBy", { skip }, async () => {
  const R = await vo7();
  const m = R.audit.measures[4];
  assert.equal(m.zoomBy, null, "the scene decided its own zoom: zoomBy is null");
  assert.equal(m.floor, true);
  near(m.zoom, 0.78, 0.002, "floor zoom");
  assertStateMessages(R, 5, { zoomBy: null, floor: true });
});

test("VO-7 scene 6: a long narration field is named with its length in the shrunk message, no floor", { skip }, async () => {
  const R = await vo7();
  const m = R.audit.measures[5];
  assert.ok(m.zoom > 0.781 && m.zoom < 0.88, `precondition: zoom ${m.zoom} must be above the floor and below the shrunk bar`);
  assert.equal(m.floor, false);
  assert.equal(m.zoomBy, null);
  const shrunk = byScene(R, 6).filter((w) => w.rule === "shrunk");
  assert.equal(shrunk.length, 1);
  assert.ok(shrunk[0].msg.includes("narration") && shrunk[0].msg.includes("900"), shrunk[0].msg);
  assertStateMessages(R, 6, { zoomBy: null, floor: false });
});

test("VO-7 scenes 1 and 7 (hook, keywords) are untouched: zoom 1, absorb 1, floor false", { skip }, async () => {
  const R = await vo7();
  for (const i of [0, 6]) assert.deepEqual({ ...R.audit.measures[i] }, { zoom: 1, absorb: 1, zoomBy: null, floor: false });
});

// Floor boundary: a text-only scene settles at zoom = cap / inH, so the spacer is chosen from the calibration (cap and inH at n=1, read from the DOM)
// to put the zoom just above the 0.781 floor and clearly on it. A kit whose floor threshold is a little too high would flag the first one.
const vo20 = async (target) => {
  const c = (await page("s=vo20&n=1&audit", { budget: 20000 })).samples.s;
  const n = Math.round(1 + c.cap / target - c.inH);
  return page(`s=vo20&n=${n}&audit`, { budget: 20000 });
};

test("VO-7 floor boundary above: zoom settles at about 0.79 -> floor false, the shrunk message says 79% and not '78% 하한'", { skip }, async () => {
  const R = await vo20(0.79);
  noErrors(R);
  const m = R.audit.measures[1];
  assert.ok(m.zoom > 0.785 && m.zoom < 0.795, `precondition: zoom ${m.zoom} is not in the intended 0.785..0.795 band (geometry drifted)`);
  assert.equal(m.absorb, 1);
  assert.equal(m.floor, false);
  const items = byScene(R, 2);
  assert.ok(items.some((w) => w.rule === "shrunk"), `no shrunk warning: ${JSON.stringify(items)}`);
  for (const w of items) {
    assert.ok(w.msg.includes("79%"), `no 79% in ${w.msg}`);
    assert.ok(!w.msg.includes("78% 하한"), `floor wording at zoom ${m.zoom}: ${w.msg}`);
    assert.ok(!w.msg.includes("78%로 줄여도"), w.msg);
  }
});

test("VO-7 floor boundary at the floor: zoom 0.78 -> floor true and '78% 하한' in the message", { skip }, async () => {
  const R = await vo20(0.7);
  noErrors(R);
  const m = R.audit.measures[1];
  near(m.zoom, 0.78, 0.002, "precondition: the scene reaches the zoom floor");
  assert.equal(m.absorb, 1);
  assert.equal(m.floor, true);
  const items = byScene(R, 2);
  assert.ok(items.length >= 1);
  for (const w of items) assert.ok(w.msg.includes("78% 하한"), w.msg);
});

test("VO-11 measures syntax: one entry per scene, exactly the keys zoom/absorb/zoomBy/floor with the declared types, existing fields kept", { skip }, async () => {
  for (const R of [await vo7(), await page("s=vo2&audit", { budget: 30000 })]) {
    const A = R.audit;
    for (const k of ["viewport", "scenes", "audit", "lint", "expectFails", "beats"]) assert.ok(k in A, `existing field ${k} missing`);
    assert.ok(Array.isArray(A.measures));
    assert.equal(A.measures.length, A.scenes);
    A.measures.forEach((m, i) => {
      assert.deepEqual(Object.keys(m).sort(), ["absorb", "floor", "zoom", "zoomBy"], `scene ${i + 1} keys`);
      assert.equal(typeof m.zoom, "number");
      assert.ok(m.zoom > 0 && m.zoom <= 1, `zoom ${m.zoom}`);
      assert.equal(typeof m.absorb, "number");
      assert.ok(m.absorb >= 0.65 && m.absorb <= 1, `absorb ${m.absorb}`);
      assert.ok(m.zoomBy === null || typeof m.zoomBy === "string", `zoomBy ${JSON.stringify(m.zoomBy)}`);
      assert.equal(typeof m.floor, "boolean");
    });
    for (const w of [...A.audit, ...A.lint]) assert.ok(w.severity === "fix" || w.severity === "advise", `severity ${w.severity} on ${w.rule}`);
  }
});

test("VO-8 rendered pages: every audit item's severity follows the spec's advisory ids, still-visual included", { skip }, async () => {
  const seen = new Set();
  for (const R of [await vo7(), await page("s=vo2&audit", { budget: 30000 }), await page("s=vo5&audit", { budget: 30000 })]) {
    for (const wn of [...R.audit.audit, ...R.audit.lint]) {
      assert.equal(wn.severity, expectedSeverity(wn.rule), `${wn.rule} on scene ${wn.scene}`);
      seen.add(wn.rule);
    }
  }
  for (const rule of ["still-visual", "shrunk", "overflow", "small-visual", "loose-figure"]) assert.ok(seen.has(rule), `${rule} never appeared, so its severity was not observed`);
});

// ---------- VO-18 (FR-16): absorbing must not add pre-draw passes ----------
// Contract (deck-contracts "steps (측정 모드)"): entering a scene pre-draws every figure step once; predict answers are drawn off-screen at most once
// per choice for measurement (the docs say "한 번씩 불릴 수 있다", so a lower bound is not pinned, only the upper bound of one).

const vo18 = (w) => page(`s=vo18&w=${w}`, { budget: 20000 }).then((R) => { noErrors(R); return R; });

for (const [w, label, absorbs] of [["steps", "absorbing steps scene (caption column beside the picture)", true], ["plain", "non-absorbing steps scene (all states fit; caption column beside the picture)", false]]) {
  test(`VO-18 ${label}: steps 2..4 enter exactly once per entry, step 1 exactly as often as at base (3)`, { skip }, async () => {
    const R = await vo18(w);
    const c = R.samples.calls;
    // Steps 2..4 only ever run in the pre-draw, so they are the pre-draw count: exactly one. Step 1 is also drawn live (stepper creation, restore;
    // tests/motion-verbs.test.mjs C-16: "step 0's live draw is not inert"), so FR-16 pins it to the count measured at base commit a78503e: 3.
    assert.deepEqual([c.enter1, c.enter2, c.enter3], [1, 1, 1], `enter calls per step: ${JSON.stringify(c)}`);
    assert.equal(c.enter0, 3, `step 1 (enter0) ran ${c.enter0} times; base a78503e runs it 3 times`);
    if (absorbs) assert.ok(R.samples.snap.els.fig.h < 300 * 0.99, "precondition: the scene was absorbed");
    else {
      near(R.samples.snap.els.fig.h, 300, 0.5, "precondition: every state fits, the figure keeps its natural height");
      assert.deepEqual(R.samples.snap.els.fig.mut, [], "FR-1: a scene that fits at ratio 1 gets no kit writes on its drawing, even transiently during the pre-draw");
    }
  });
}

// Size change (FR-1/FR-16 "진입·창 크기 변경 동안"): 1280 -> 1279 wide changes the measured size key. Deltas of the enter counters across the change:
// steps 2..4 once (one pre-draw), step 1 +2 as measured at base commit a78503e (pre-draw plus the live redraw).
for (const [w, label] of [["steps", "absorbing"], ["plain", "non-absorbing"]]) {
  test(`VO-18 size change, ${label} steps scene: steps 2..4 enter exactly once more, step 1 as many more as at base (2)`, { skip }, async () => {
    const R = await page(`s=vo18&w=${w}&resize=1`, { budget: 30000 });
    noErrors(R);
    const a = R.samples.calls, b = R.samples.calls2;
    assert.deepEqual([b.enter1 - a.enter1, b.enter2 - a.enter2, b.enter3 - a.enter3], [1, 1, 1], `enter calls ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
    assert.equal(b.enter0 - a.enter0, 2, `step 1 delta; ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
  });
}

test("VO-18 size change, scene where every state fits at ratio 1: the resize re-fit writes no attribute on the drawing", { skip }, async () => {
  const R = await page("s=vo18&w=plain&resize=1", { budget: 30000 });
  assert.deepEqual(R.samples.snap.els.fig.mut, [], "entry");
  assert.deepEqual(R.samples.snap2.els.fig.mut, [], "FR-1: no kit write on a fitting scene's drawing during the size-change re-fit either");
  near(R.samples.snap2.els.fig.h, 300, 0.5, "the scene still fits after the size change");
});

test("VO-18 absorbing predict scene: each choice's answerVisual is drawn at most once during entry", { skip }, async () => {
  const R = await vo18("pred");
  assert.ok(R.samples.snap.els.q.h < 225 * 0.99, "precondition: the scene was absorbed");
  const c = R.samples.calls;
  assert.deepEqual(Object.keys(c).sort(), ["ava", "avb", "avunsure"], `answerVisual ids: ${JSON.stringify(c)}`);
  for (const id of ["a", "b", "unsure"]) assert.ok((c["av" + id] ?? 0) <= 1, `answerVisual("${id}") ran ${c["av" + id]} times on entry`);
});

// ---------- VO-12 error guessing ----------

const vo12 = () => page("s=vo12", { budget: 40000 }).then((R) => { noErrors(R); return R; });
const absorbWarns = (R) => R.warns.filter(([, m]) => !m.startsWith("화면 점검"));

test("VO-12 injection 1 (absorb reads/writes the figure style and throws): scene renders, no kit limit, one warn with scene number and reason", { skip }, async () => {
  const R = await vo12();
  const s = R.samples.s2;
  assert.equal(s.rendered, true);
  assert.deepEqual(s.limits, [], "a kit height limit was written although absorbing failed");
  const w = absorbWarns(R).filter(([, m]) => /^장면 2:/.test(m) && /그림 높이를 맞추다 실패/.test(m));
  assert.equal(w.length, 1, `warns: ${JSON.stringify(absorbWarns(R))}`);
  assert.ok(w[0][1].includes("boom-style"), `the reason is missing from: ${w[0][1]}`);
  assert.ok(s.zIn < 1, "the scene should still be fitted by zoom alone");
});

test("VO-12 injection 2 (the kit's search of the scene body for figures throws): scene renders, no kit limit, one warn", { skip }, async (t) => {
  const R = await vo12();
  if (!R.samples.cnt.bodyQuery) return t.skip("injection not reached: the kit never searched the mount body through the replaced members, so this error path cannot be driven from the page");
  const s = R.samples.s3;
  assert.equal(s.rendered, true);
  assert.deepEqual(s.limits, []);
  const w = absorbWarns(R).filter(([, m]) => /^장면 3:/.test(m) && /그림 높이를 맞추다 실패/.test(m));
  assert.equal(w.length, 1, `warns: ${JSON.stringify(absorbWarns(R))}`);
  assert.ok(/boom-/.test(w[0][1]), w[0][1]);
});

test("VO-12 injection 3 (a step's enter throws while the kit pre-draws every step): scene renders without a kit limit and a warn names scene 4", { skip }, async () => {
  const R = await vo12();
  const s = R.samples.s4;
  assert.equal(s.rendered, true);
  assert.deepEqual(s.limits, []);
  const w4 = absorbWarns(R).filter(([, m]) => /^장면 4:/.test(m));
  assert.equal(w4.length, 1, `exactly one warn line for scene 4: ${JSON.stringify(absorbWarns(R))}`);
  near(s.els.fig.h, 300, 0.5, "scene 4 keeps absorb 1: the drawing is at its natural height in the same page");
  assert.ok(s.zIn < 1, "scene 4 is fitted by zoom alone");
});

test("VO-12 the deck continues: all 6 scenes exist, the next ordinary overflowing figure is still absorbed, no uncaught error", { skip }, async () => {
  const R = await vo12();
  assert.equal(R.samples.sceneCount, 6);
  assert.equal(R.samples.s5.rendered, true);
  assert.ok(R.samples.s5.limits.length === 1 && R.samples.s5.els.fig.h < 300 * 0.99, `scene 5 limits ${JSON.stringify(R.samples.s5.limits)}`);
  assert.equal(R.samples.s6.rendered, false, "scene 6 is keywords and has no figure");
  assert.equal(R.samples.s6.index, 5);
});

test("VO-12 audit run: failed scenes report absorb 1, the normal scene reports absorb < 1, measures cover every scene", { skip }, async () => {
  const R = await page("s=vo12&audit&noquery=1", { budget: 40000 });
  assert.ok(R.audit, "#ltt-audit missing: the injected failure broke the audit pass");
  assert.equal(R.audit.measures.length, 6);
  assert.equal(R.audit.measures[1].absorb, 1);
  assert.equal(R.audit.measures[3].absorb, 1);
  assert.ok(R.audit.measures[4].absorb < 1);
});

// Start every page up front (limited to JOBS at a time) so the tests below mostly wait on finished runs.
if (!skip) {
  for (const [, b] of POINTS) vo1Page(b).catch(() => {});
  page("s=vo2&audit", { budget: 30000 }); page("s=vo3", { budget: 40000 }); page("s=vo5&audit", { budget: 30000 });
  page("s=vo5&audit", { size: "1280,1700", budget: 30000 }); page("s=vo7&audit", { budget: 40000 });
  page("s=vo12", { budget: 40000 }); for (const w of ["steps", "plain", "pred"]) page(`s=vo18&w=${w}`); for (const w of ["steps", "plain"]) page(`s=vo18&w=${w}&resize=1`); page("s=vo12&audit&noquery=1", { budget: 40000 });
  for (const author of [0, 150]) {
    page(`s=vo4&author=${author}`, { budget: 30000 }); page(`s=vo4&author=${author}&pre=fit`);
    page(`s=vo4&author=${author}&once=1`, { size: "390,844" });
  }
}
