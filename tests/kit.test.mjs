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
  assert.ok(rules(spec).includes("used-before-defined"));
  spec.scenes[0].text = "{{TTL}}을 늘리면";
  assert.ok(!rules(spec).includes("used-before-defined"));
});

test("lint flags marks without a definition, and terms-scene keys count as definitions", () => {
  assert.ok(rules({ scenes: [{ type: "explain", title: "{{없는말}}", steps: [] }, KW] }).includes("unknown-term"));
  assert.ok(!rules({ scenes: [
    { type: "terms", title: "t", terms: [{ key: "적중", plain: "캐시에 있음" }] },
    { type: "explain", title: "{{적중}}", steps: [] }, KW] }).includes("unknown-term"));
});

test("lint caps new terms per scene at two, four in a terms scene", () => {
  const g = { a: "1", b: "2", c: "3" };
  assert.ok(rules({ glossary: g, scenes: [{ type: "explain", title: "{{a}} {{b}} {{c}}", steps: [] }, KW] }).includes("too-many-terms"));
  assert.ok(!rules({ glossary: g, scenes: [{ type: "explain", title: "{{a}} {{b}}", steps: [] }, { type: "explain", title: "{{c}}", steps: [] }, KW] }).includes("too-many-terms"));
});

test("lint wants predict after an explanation, once per lesson, without new terms in the question", () => {
  const p = { type: "predict", title: "몇 건?", choices: [] };
  assert.ok(rules({ scenes: [{ type: "hook", text: "h" }, p, KW] }).includes("predict-before-explain"));
  assert.ok(!rules({ scenes: [{ type: "hook", text: "h" }, { type: "explain", title: "e", steps: [] }, p, KW] }).includes("predict-before-explain"));
  assert.ok(rules({ scenes: [{ type: "explain", title: "e", steps: [] }, p, p, KW] }).includes("many-predicts"));
  const fresh = rules({ glossary: { 적중률: "x" }, scenes: [{ type: "explain", title: "e", steps: [] }, { ...p, question: "{{적중률}}은?" }, KW] });
  assert.ok(fresh.includes("predict-new-term"));
});

test("lint requires keywords last and a reading guide on visual scenes", () => {
  assert.ok(rules({ scenes: [{ type: "explain", title: "e", steps: [] }] }).includes("keywords-last"));
  const cmp = { type: "compare", title: "c", items: [] };
  assert.ok(rules({ scenes: [cmp, KW] }).includes("no-reading-guide"));
  assert.ok(!rules({ scenes: [{ ...cmp, narration: "칸 하나가 1건이다." }, KW] }).includes("no-reading-guide"));
});

test("lint keeps narration to four sentences and points to three", () => {
  const long = "하나다. 둘이다. 셋이다. 넷이다. 다섯이다.";
  assert.ok(rules({ scenes: [{ title: "t", narration: long, mount() {} }, KW] }).includes("long-narration"));
  const pts = [1, 2, 3, 4].map((i) => ({ title: "p" + i }));
  assert.ok(rules({ scenes: [{ title: "t", points: pts, mount() {} }, KW] }).includes("many-points"));
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
  assert.ok(rules({ scenes: [{ type: "explain", title: "항목 1과 샘플 텍스트", steps: [] }, KW] }).includes("filler-content"));
  assert.ok(!rules({ scenes: [{ type: "explain", title: "placeholder 글자색은 옅다", steps: [] }, KW] }).includes("filler-content"));
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
  assert.deepEqual(r({ narrow: true, visualRatio: 0.01, zoom: 0.5, hscroll: 30 }), ["hscroll"]);
});

test("every theme is listed with a medium", () => {
  const { themes } = loadKit();
  assert.deepEqual([...themes.map((t) => t.name)].sort(), ["blueprint", "lab", "ledger", "paper", "studio", "terminal"]);
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
