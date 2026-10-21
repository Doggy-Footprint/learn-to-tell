import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadKit() {
  const context = { console: { info() {}, warn() {} } };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../skills/learn-to-tell/kit/ltt.js", import.meta.url), "utf8"), context);
  return context.LTT;
}

test("lessonId reads the id only from /lessons/<id>/ paths", () => {
  const { lessonId } = loadKit();
  assert.equal(lessonId("/lessons/20261013-demo/lesson.html"), "20261013-demo");
  assert.equal(lessonId("/gallery/alert-precision.html"), null);
  assert.equal(lessonId("/lessons/Bad_Id/lesson.html"), null);
  assert.equal(lessonId("/lessons/demo"), null);
});

test("compare uses the given absolute tolerance", () => {
  const { compare } = loadKit();
  assert.equal(compare(0.161016, 0.16102, 1e-4).ok, true);
  assert.equal(compare(0.1615, 0.16102, 1e-4).ok, false);
  assert.equal(compare(0.16102 + 1e-4, 0.16102, 1e-4).ok, true);
});

test("compare defaults to a tight relative tolerance and rejects non-finite values", () => {
  const { compare } = loadKit();
  assert.equal(compare(1000 + 1e-7, 1000).ok, true);
  assert.equal(compare(1000 + 1e-5, 1000).ok, false);
  assert.equal(compare(NaN, 0).ok, false);
  assert.equal(compare(Infinity, 1).ok, false);
  assert.equal(compare("0.5", 0.5).ok, false);
});

test("expect returns the comparison result outside a browser", () => {
  const { expect } = loadKit();
  assert.equal(expect("match", 2, 2), true);
  assert.equal(expect("mismatch", 2, 3), false);
});

function loadParts() {
  const context = { console: { info() {}, warn() {} } };
  vm.createContext(context);
  for (const f of ["vendor/d3.min.js", "ltt.js", "ltt-parts.js"]) {
    vm.runInContext(readFileSync(new URL("../skills/learn-to-tell/kit/" + f, import.meta.url), "utf8"), context);
  }
  return context.LTT;
}

const rules = (spec) => loadKit().lintDeck(spec).map((w) => w.rule);
// Spec 80a1b2f18f50b1df FR-2/FR-3: the four B rules (term and filler checks) moved from lintDeck to deckIssues.
const brules = (spec) => Array.from(loadKit().deckIssues(spec), (w) => w.rule);
const KW = { type: "keywords", terms: [] };

test("termsIn reads {{key}} and {{shown|key}} marks in order", () => {
  const { termsIn } = loadKit();
  assert.deepEqual(JSON.parse(JSON.stringify(termsIn("{{TTL}}을 늘리면 {{만료 시간|TTL}}이 길어진다"))),
    [{ key: "TTL", shown: "TTL" }, { key: "TTL", shown: "만료 시간" }]);
  assert.equal(termsIn("표시 없음").length, 0);
});

test("termIndex records the first scene that marks or lists each term", () => {
  const { termIndex } = loadKit();
  const first = termIndex({ scenes: [
    { type: "hook", text: "시작" },
    { type: "terms", terms: [{ key: "적중", plain: "p" }] },
    { type: "explain", title: "{{TTL}}과 {{적중}}", steps: [] },
  ] });
  assert.equal(first["적중"], 1);
  assert.equal(first["TTL"], 2);
});

test("lint flags a glossary term used before its first definition", () => {
  const spec = { glossary: { TTL: "유효 시간" }, scenes: [
    { type: "hook", text: "TTL을 늘리면" },
    { type: "explain", title: "{{TTL}}의 뜻", steps: [] }, KW] };
  assert.ok(brules(spec).includes("used-before-defined"));
  spec.scenes[0].text = "{{TTL}}을 늘리면";
  assert.ok(!brules(spec).includes("used-before-defined"));
});

test("lint flags marks without a definition, and terms-scene keys count as definitions", () => {
  assert.ok(brules({ scenes: [{ type: "explain", title: "{{없는말}}", steps: [] }, KW] }).includes("unknown-term"));
  assert.ok(!brules({ scenes: [
    { type: "terms", title: "t", terms: [{ key: "적중", plain: "캐시에 있음" }] },
    { type: "explain", title: "{{적중}}", steps: [] }, KW] }).includes("unknown-term"));
});

test("lint flags new terms in a predict question", () => {
  const p = { type: "predict", title: "몇 건?", choices: [] };
  const fresh = brules({ glossary: { 적중률: "x" }, scenes: [{ type: "explain", title: "e", steps: [] }, { ...p, question: "{{적중률}}은?" }, KW] });
  assert.ok(fresh.includes("predict-new-term"));
});

test("lint requires keywords last and a reading guide on visual scenes", () => {
  assert.ok(rules({ scenes: [{ type: "explain", title: "e", steps: [] }] }).includes("keywords-last"));
  const cmp = { type: "compare", title: "c", items: [] };
  assert.ok(rules({ scenes: [cmp, KW] }).includes("no-reading-guide"));
  assert.ok(!rules({ scenes: [{ ...cmp, narration: "칸 하나가 1건이다." }, KW] }).includes("no-reading-guide"));
});

test("lint flags runs and majorities of equal card grids, but not non-card forms", () => {
  const ex = (form) => ({ type: "explain", form, title: "e", steps: [] });
  const run = [{ type: "hook", text: "h" }, ex(), { type: "compare", title: "c", narration: "n.", items: [] }, ex(), KW];
  assert.ok(rules({ scenes: run }).includes("card-monotony"));
  const mixed = [{ type: "hook", text: "h" }, ex(), ex("strip"), { type: "figure", title: "f", caption: "c", figure: "" }, ex("stack"), { type: "compare", form: "table", title: "t", sub: "s", items: [] }, KW];
  assert.ok(!rules({ scenes: mixed }).includes("card-monotony"));
  const majority = [ex(), ex(), { type: "statement", title: "s" }, ex(), ex(), { type: "statement", title: "s" }, ex(), KW];
  assert.ok(rules({ scenes: majority }).includes("card-monotony"));
});

test("lint wants a picture for every term unless it is opted out with visual: false", () => {
  const terms = (t) => rules({ scenes: [{ type: "terms", title: "t", terms: [t] }, KW] });
  assert.ok(terms({ key: "색상", plain: "p" }).includes("term-no-visual"));
  assert.ok(!terms({ key: "색상", plain: "p", visual: "<svg></svg>" }).includes("term-no-visual"));
  assert.ok(!terms({ key: "색상", plain: "p", visual: false }).includes("term-no-visual"));
});

test("lint wants a recall question for every takeaway a summary collects, and a recall summary is not a card grid", () => {
  const ex = (o) => Object.assign({ type: "explain", form: "strip", title: "e", steps: [], takeaway: "핵심" }, o);
  const sum = { type: "summary" };
  assert.ok(rules({ scenes: [ex(), ex({ recall: "q" }), sum, KW] }).includes("summary-no-recall"));
  assert.ok(!rules({ scenes: [ex({ recall: "q" }), ex({ recall: "q2" }), sum, KW] }).includes("summary-no-recall"));
  assert.ok(rules({ scenes: [{ type: "summary", cards: [{ text: "t" }] }, KW] }).includes("summary-no-recall"));
  const grid = (recall) => [{ type: "explain", title: "a", steps: [], takeaway: "x", recall }, { type: "terms", title: "t", terms: [] }, sum, KW];
  assert.ok(rules({ scenes: grid() }).includes("card-monotony"));
  assert.ok(!rules({ scenes: grid("q") }).includes("card-monotony"));
});

test("lint wants a one-page overview after the recall summary and right before keywords", () => {
  const ex = { type: "explain", form: "strip", title: "e", steps: [], takeaway: "핵심", recall: "q" };
  const sum = { type: "summary" }, ov = { type: "overview", title: "o", figure: "<svg></svg>", caption: "c" };
  assert.ok(rules({ scenes: [ex, sum, KW] }).includes("overview-missing"));
  assert.ok(!rules({ scenes: [ex, sum, ov, KW] }).some((r) => r.startsWith("overview")));
  assert.ok(rules({ scenes: [ex, ov, sum, KW] }).includes("overview-order"));
  assert.ok(rules({ scenes: [ex, sum, { ...ov, figure: undefined }, KW] }).includes("overview-no-visual"));
});

test("lint wants a signature visual and a known theme", () => {
  const ex = { type: "explain", title: "e", steps: [] };
  assert.ok(rules({ scenes: [ex, KW] }).includes("no-signature"));
  assert.ok(!rules({ scenes: [{ ...ex, layout: "full" }, KW] }).includes("no-signature"));
  assert.ok(!rules({ scenes: [{ type: "figure", title: "f", caption: "c" }, KW] }).includes("no-signature"));
  assert.ok(rules({ scenes: [ex, KW] }).includes("no-theme"));
  assert.ok(rules({ theme: "neon", scenes: [ex, KW] }).includes("unknown-theme"));
  const ok = rules({ theme: "paper", scenes: [ex, KW] });
  assert.ok(!ok.includes("no-theme") && !ok.includes("unknown-theme"));
});

test("figure scenes accept a caption as their reading guide", () => {
  assert.ok(rules({ scenes: [{ type: "figure", title: "f" }, KW] }).includes("no-reading-guide"));
  assert.ok(!rules({ scenes: [{ type: "figure", title: "f", caption: "가로축은 시간이다." }, KW] }).includes("no-reading-guide"));
});

test("lint flags filler text but not the UI word placeholder", () => {
  assert.ok(brules({ scenes: [{ type: "explain", title: "항목 1과 샘플 텍스트", steps: [] }, KW] }).includes("filler-content"));
  assert.ok(!brules({ scenes: [{ type: "explain", title: "placeholder 글자색은 옅다", steps: [] }, KW] }).includes("filler-content"));
});

test("auditScene judges rendered measurements", () => {
  const { auditScene } = loadKit();
  const r = (m) => [...auditScene({ type: "figure", zoom: 1, visualRatio: 0.4, figRatio: 0.8, fill: 0.9, fontSizes: 5, ...m })].map((w) => w.rule);
  assert.deepEqual(r({}), []);
  assert.deepEqual(r({ overflow: true, zoom: 0.78 }), ["overflow"]);
  assert.deepEqual(r({ zoom: 0.8 }), ["shrunk"]);
  assert.deepEqual(r({ visualRatio: 0.15 }), ["small-visual"]);
  assert.deepEqual(r({ type: "", visualRatio: 0.15 }), []);
  assert.deepEqual(r({ figRatio: 0.2 }), ["loose-figure"]);
  assert.deepEqual(r({ fill: 0.4 }), ["empty-stage"]);
  assert.deepEqual(r({ fontSizes: 9 }), ["many-sizes"]);
  assert.deepEqual(r({ type: "statement", visualRatio: 0.01 }), []);
  assert.deepEqual(r({ hscroll: 30 }), ["hscroll"]);
  assert.deepEqual(r({ compact: true, zoom: 0.8, visualRatio: 0.01, figRatio: 0.1 }), []);
  assert.deepEqual(r({ compact: true, overflow: true, zoom: 0.78, hscroll: 5 }), ["hscroll", "overflow"]);
});

// Spec 80a1b2f18f50b1df VO-2 (decision table): hits {0, 1, >=2} x start {true, false}.
// goal-narrow stays an auditScene rule (hits == 1); the other two moved to goalIssues.
const GOAL_CELLS = [
  { id: "hits 0, start false", hits: 0, start: false, issues: ["goal-unreachable"], audit: [] },
  { id: "hits 0, start true", hits: 0, start: true, issues: ["goal-unreachable", "goal-at-start"], audit: [] },
  { id: "hits 1, start false", hits: 1, start: false, issues: [], audit: ["goal-narrow"] },
  { id: "hits 1, start true", hits: 1, start: true, issues: ["goal-at-start"], audit: ["goal-narrow"] },
  { id: "hits 3, start false", hits: 3, start: false, issues: [], audit: [] },
  { id: "hits 3, start true", hits: 3, start: true, issues: ["goal-at-start"], audit: [] },
];

for (const c of GOAL_CELLS) {
  test(`VO-2 goalIssues ${c.id}`, () => {
    const { goalIssues } = loadKit();
    const got = Array.from(goalIssues([{ where: "W", hits: c.hits, samples: 10, start: c.start }]), (w) => [w.where, w.rule]);
    assert.deepEqual(got, c.issues.map((rule) => ["W", rule]));
  });
  test(`VO-2 auditScene ${c.id}: only goal-narrow`, () => {
    const { auditScene } = loadKit();
    const got = Array.from(auditScene({ type: "", zoom: 1, fill: 0.9, fontSizes: 5, goals: [{ hits: c.hits, samples: 10, start: c.start }] }), (w) => w.rule);
    assert.deepEqual(got, c.audit);
  });
}

test("VO-2 goalIssues messages keep the base_commit wording and order goals as given", () => {
  const { goalIssues } = loadKit();
  const got = Array.from(goalIssues([
    { where: "A", hits: 0, samples: 12, start: true },
    { where: "B", hits: 5, samples: 12, start: true },
  ]), (w) => ({ where: w.where, rule: w.rule, msg: w.msg }));
  assert.deepEqual(got, [
    { where: "A", rule: "goal-unreachable", msg: "목표를 맞추는 손잡이 위치가 없다 (표본 12개 중 0개). 기준이나 손잡이 범위를 고칠 것" },
    { where: "A", rule: "goal-at-start", msg: "시작 위치에서 이미 목표가 맞는다. 시작값을 목표 밖으로 옮길 것" },
    { where: "B", rule: "goal-at-start", msg: "시작 위치에서 이미 목표가 맞는다. 시작값을 목표 밖으로 옮길 것" },
  ]);
});

test("VO-2 goalIssues of no goals is empty", () => {
  assert.equal(loadKit().goalIssues([]).length, 0);
});

test("stepValues lists control positions and thins long ranges to evenly spaced ones with both ends", () => {
  const { stepValues } = loadKit();
  assert.deepEqual([...stepValues(-2, 2, 0.5)], [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]);
  assert.deepEqual([...stepValues(0, 0.3, 0.1)], [0, 0.1, 0.2, 0.3]);
  const long = stepValues(0, 1000, 1, 11);
  assert.deepEqual([...long], [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
});

test("goalReach counts every combination when few, samples repeatably when many, and treats a throwing check as a miss", () => {
  const { goalReach } = loadKit();
  const all = goalReach({ a: [1, 2, 3], b: [10, 20] }, ({ a, b }) => a * b >= 40, { a: 1, b: 10 });
  assert.deepEqual({ ...all }, { samples: 6, hits: 2, start: false });
  assert.equal(goalReach({ a: [1, 2] }, ({ a }) => a === 1, { a: 1 }).start, true);
  const big = { x: Array.from({ length: 300 }, (_, i) => i), y: Array.from({ length: 300 }, (_, i) => i) };
  const s1 = goalReach(big, ({ x, y }) => x < 150 && y < 150, null, 4000), s2 = goalReach(big, ({ x, y }) => x < 150 && y < 150, null, 4000);
  assert.equal(s1.samples, 4000);
  assert.equal(s1.hits, s2.hits);
  assert.ok(s1.hits > 800 && s1.hits < 1200, `quarter of 4000 expected, got ${s1.hits}`);
  assert.equal(goalReach({ a: [1, 2] }, () => { throw new Error("x"); }).hits, 0);
});

test("every theme is listed with a medium", () => {
  const { themes } = loadKit();
  assert.deepEqual([...themes.map((t) => t.name)].sort(), ["atlas", "blueprint", "lab", "ledger", "paper", "sketch", "studio", "terminal"]);
  for (const t of themes) assert.ok(t.medium, `${t.name} has no medium`);
});

test("diagramLayout centres nodes in grid cells and clips edges to box borders", () => {
  const { diagramLayout } = loadParts();
  const L = diagramLayout({ cols: 2, rows: 1, cell: [200, 100], node: [120, 40], pad: 0,
    nodes: [{ id: "a", c: 0, r: 0 }, { id: "b", c: 1, r: 0 }], edges: [{ f: "a", t: "b" }] });
  assert.equal(L.width, 400);
  assert.equal(L.height, 100);
  assert.deepEqual([L.nodes.a.cx, L.nodes.a.cy, L.nodes.b.cx], [100, 50, 300]);
  const e = L.edges[0];
  assert.equal(e.x1, 100 + 60 + 4);
  assert.equal(e.x2, 300 - 60 - 8);
  assert.equal(e.y1, 50);
  assert.throws(() => diagramLayout({ nodes: [{ id: "a", c: 0, r: 0 }], edges: [{ f: "a", t: "zz" }] }));
});

// WCAG relative luminance and OKLab distance; CVD by Machado et al. (2009) severity-1.0 matrices on linear RGB.
const hexRgb = (h) => (h.length === 4 ? [1, 2, 3].map((i) => parseInt(h[i] + h[i], 16) / 255) : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255));
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const unlin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const luminance = (rgb) => { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const oklab = (rgb) => {
  const [r, g, b] = rgb.map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b),
    s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const simulate = (rgb, k) => { const v = rgb.map(lin); return CVD[k].map((r) => unlin(Math.min(1, Math.max(0, r[0] * v[0] + r[1] * v[1] + r[2] * v[2])))); };
const okDist = (a, b) => Math.hypot(...oklab(a).map((x, i) => x - oklab(b)[i]));

test("every theme's palette has 6 colours readable on its surfaces and distinct under colour-vision deficiency", () => {
  const { themes, palette, themeTokens } = loadKit();
  for (const { name } of themes) for (const scheme of ["light", "dark"]) {
    const pal = [...palette(name, scheme)], tk = themeTokens(name, scheme), at = `${name}/${scheme}`;
    assert.equal(pal.length, 6, at);
    for (const c of pal) {
      assert.match(c, /^#[0-9a-f]{6}$/i, `${at} ${c}`);
      for (const surface of ["bg", "card", "card-2"]) assert.ok(contrast(hexRgb(c), hexRgb(tk[surface])) >= 3, `${at} ${c} on ${surface} ${tk[surface]}`);
    }
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
      const a = hexRgb(pal[i]), b = hexRgb(pal[j]);
      assert.ok(okDist(a, b) >= 0.06, `${at} ${pal[i]} vs ${pal[j]}`);
      for (const k of Object.keys(CVD)) assert.ok(okDist(simulate(a, k), simulate(b, k)) >= 0.06, `${at} ${pal[i]} vs ${pal[j]} under ${k}`);
    }
  }
});

test("every theme's text tokens reach 4.5:1 on its surfaces and their own soft fill", () => {
  const { themes, themeTokens } = loadKit();
  for (const { name } of themes) for (const scheme of ["light", "dark"]) {
    const tk = themeTokens(name, scheme), at = `${name}/${scheme}`;
    for (const fg of ["ink", "ink-2", "muted", "accent", "good", "bad", "warn"]) {
      const on = ["bg", "card", "card-2"].concat(tk[fg + "-soft"] ? [fg + "-soft"] : []);
      for (const bg of on) assert.ok(contrast(hexRgb(tk[fg]), hexRgb(tk[bg])) >= 4.5, `${at} ${fg} ${tk[fg]} on ${bg} ${tk[bg]}`);
    }
  }
});

test("palette outside a browser falls back to the studio light set", () => {
  const { palette } = loadKit();
  assert.deepEqual([...palette()], [...palette("studio", "light")]);
});

test("mark draws each shape centred on the origin and rejects unknown kinds", () => {
  const { mark, marks } = loadKit();
  assert.deepEqual([...marks], ["square", "ring", "dot", "diamond", "cross"]);
  assert.match(mark("square", { size: 18, color: "red" }), /x='-9' y='-9' width='18' height='18'.*fill:red/);
  assert.match(mark("dot", { size: 10 }), /<circle r='5'/);
  assert.match(mark("ring", { size: 18, weight: 2 }), /r='8'.*stroke-width:2/);
  assert.match(mark("cross"), /stroke-linecap:round/);
  assert.match(mark("diamond", { inline: true }), /^<svg class='ltt-ic ltt-mark-ic' viewBox=/);
  assert.throws(() => mark("star"), /unknown mark/);
});

test("icons include the borrowed Lucide set and render with the kit stroke", () => {
  const { icon, icons } = loadKit();
  for (const n of ["globe", "map-pin", "route", "git-branch", "network", "truck"]) assert.ok(icons.includes(n), n);
  assert.match(icon("globe"), /stroke-width='1.8'/);
  assert.equal(new Set(icons).size, icons.length);
});

function loadAll() {
  const context = { console: { info() {}, warn() {} } };
  vm.createContext(context);
  for (const f of ["vendor/d3.min.js", "ltt.js", "ltt-parts.js", "ltt-ui.js"]) {
    vm.runInContext(readFileSync(new URL("../skills/learn-to-tell/kit/" + f, import.meta.url), "utf8"), context);
  }
  return context.LTT;
}

test("sequenceLayout places messages in time order and opens activations on sync calls until the reply", () => {
  const { sequenceLayout } = loadAll();
  const L = sequenceLayout({ col: 200, row: 40, pad: 20, head: 50, actors: [{ id: "c" }, { id: "s" }],
    items: [{ f: "c", t: "s", l: "req", id: "a" }, { note: "wait", over: ["s"] }, { f: "s", t: "c", kind: "reply", id: "b" }],
    spans: [{ from: "a", to: "b", l: "1s" }] });
  assert.deepEqual([L.actors.c.x, L.actors.s.x], [120, 320]);
  const [a, note, b] = L.items;
  assert.equal(a.y, 20 + 50 + 32);
  assert.equal(note.type, "note");
  assert.equal(b.y - a.y, 80);
  assert.equal(L.activations.length, 1);
  assert.deepEqual([L.activations[0].actor, L.activations[0].y1, L.activations[0].y2], ["s", a.y, b.y]);
  assert.ok(a.x2 <= 315 && b.x1 === 315, "arrows stop at and leave from the activation bar edge (bar is 10 wide on the lifeline)");
  assert.deepEqual([L.spans[0].y1, L.spans[0].y2], [a.y, b.y]);
  assert.throws(() => sequenceLayout({ actors: [{ id: "c" }], items: [{ f: "c", t: "x" }] }), /missing actor 'x'/);
});

test("sequenceLayout keeps a sync call without reply open to the end and loops self messages", () => {
  const { sequenceLayout } = loadAll();
  const L = sequenceLayout({ row: 40, actors: [{ id: "a" }, { id: "b" }], items: [{ f: "a", t: "b" }, { f: "b", t: "b", l: "retry" }] });
  assert.equal(L.activations.length, 1);
  assert.ok(L.activations[0].y2 > L.items[1].y);
  assert.match(L.items[1].d, /^M[\d.]+,[\d.]+H[\d.]+V[\d.]+H/);
});

test("contrast follows WCAG 2.x", () => {
  const { contrast } = loadKit();
  assert.equal(contrast("#000", "#fff"), 21);
  assert.equal(contrast("#767676", "#ffffff").toFixed(2), "4.54");
  assert.equal(contrast("#fff", "#fff"), 1);
});

test("plotTheme fills palette and theme defaults but keeps caller options", () => {
  const { plotTheme, palette } = loadAll();
  const o = plotTheme({ y: { label: "ms" }, color: { legend: true } });
  assert.equal(o.className, "ltt-plot");
  assert.deepEqual([...o.color.range], [...palette()]);
  assert.equal(o.color.legend, true);
  assert.deepEqual([o.y.label, o.y.grid], ["ms", true]);
});

test("inspector judges each row against the threshold", () => {
  const { inspector } = loadAll();
  const html = inspector({ rows: [{ name: "a", fg: "#999999", bg: "#FFFFFF" }, { name: "b", fg: "#595959", bg: "#FFFFFF" }] });
  assert.match(html, /class='r fail'.*2\.85.*미달/s);
  assert.match(html, /class='r pass'.*7\.00.*통과/s);
});

test("icon renders unknown names as escaped text so emoji are not dropped", () => {
  const { icon } = loadKit();
  assert.match(icon("🚀"), /^<span class='ltt-ic' aria-hidden='true'>🚀<\/span>$/);
  assert.equal(icon("<b>").includes("<b>"), false);
  assert.equal(icon(""), "");
});

test("freeSlot returns the first spot below or beside solids and null when the box fits nowhere", () => {
  const { freeSlot } = loadKit();
  const region = { x0: 0, y0: 0, x1: 100, y1: 100 };
  const top = { x0: 0, y0: 0, x1: 100, y1: 30 };
  assert.deepEqual([...freeSlot(region, [100, 40], [top], 0, 1)], [0, 30]);
  assert.deepEqual([...freeSlot(region, [100, 40], [top], 5, 1)], [0, 35]);
  assert.deepEqual([...freeSlot(region, [40, 40], [{ x0: 0, y0: 0, x1: 50, y1: 100 }], 0, 1)], [50, 0]);
  assert.equal(freeSlot(region, [100, 80], [top], 0, 1), null);
  assert.equal(freeSlot(region, [120, 10], [], 0, 1), null);
});
