// Inputs that make LTT.auditScene / LTT.lintDeck emit each rule (spec 37a2365a466d3e8b VO-8). Only the rule id matters here: every case is
// built from the visible rule conditions in tests/kit.test.mjs, tests/lint-rules.test.mjs and the spec's Signature block, never from kit output.
// still-visual needs a rendered page (its trigger is a real scene without motion), so it is observed in tests/absorb.test.mjs.

// Signature of the spec: the advisory ids, exactly. Every other id is "fix".
export const ADVISE = ["shrunk", "small-visual", "loose-figure", "empty-stage", "many-sizes", "goal-narrow", "still-visual", "card-monotony", "no-signature", "unused-term"];

export const BASE_M = { type: "figure", layout: "", compact: false, zoom: 1, visualRatio: 0.4, figRatio: 0.8, fill: 0.9, fontSizes: 5, hscroll: 0, overflow: false, panelOverlap: 0, graphOverlaps: 0, goals: [] };

export const AUDIT_TRIGGERS = {
  overflow: { overflow: true, zoom: 0.78 },
  shrunk: { zoom: 0.83 },
  "small-visual": { visualRatio: 0.05 },
  "loose-figure": { figRatio: 0.2 },
  "empty-stage": { fill: 0.4 },
  "many-sizes": { fontSizes: 9 },
  hscroll: { hscroll: 30 },
  "graph-overlap": { graphOverlaps: 2 },
  "panel-overlap": { panelOverlap: 1 },
  "goal-unreachable": { goals: [{ hits: 0, samples: 10, start: false }] },
  "goal-narrow": { goals: [{ hits: 1, samples: 10, start: false }] },
  "goal-at-start": { goals: [{ hits: 3, samples: 10, start: true }] },
};

const THEME = "paper";
const KW = () => ({ type: "keywords", terms: [] });
const FIG = () => ({ type: "figure", title: "t", caption: "c", figure: "그림" });
const HOOK = () => ({ type: "hook", text: "h" });
const EX = (o = {}) => ({ type: "explain", title: "e", steps: [], ...o });
const STRIP = (o = {}) => EX({ form: "strip", ...o });
const SUM_RECALL = () => ({ type: "summary", cards: [{ text: "t", recall: "q" }] });
const SUM_NO_RECALL = () => ({ type: "summary", cards: [{ text: "t" }] });
const OV = (o = {}) => ({ type: "overview", title: "o", figure: "<svg></svg>", caption: "c", ...o });
const deck = (scenes, extra = {}) => ({ theme: THEME, ...extra, scenes });
const mid = (...middle) => deck([FIG(), ...middle, KW()]);

export const LINT_TRIGGERS = {
  "unknown-term": () => mid(STRIP({ title: "{{없는말}}" })),
  "used-before-defined": () => deck([FIG(), { type: "hook", text: "TTL을 늘리면" }, STRIP({ title: "{{TTL}}의 뜻" }), KW()], { glossary: { TTL: "유효 시간" } }),
  "predict-new-term": () => deck([FIG(), { type: "predict", title: "몇 건?", question: "{{적중률}}은?", choices: [] }, KW()], { glossary: { 적중률: "x" } }),
  "no-reading-guide": () => mid({ type: "compare", form: "table", title: "c", items: [] }),
  "no-title": () => mid({ type: "explain", form: "strip", steps: [] }),
  "overview-missing": () => mid(SUM_RECALL()),
  "overview-order": () => mid(OV(), SUM_RECALL()),
  "overview-no-visual": () => mid(SUM_RECALL(), OV({ figure: undefined })),
  "keywords-last": () => deck([FIG()]),
  "unused-term": () => deck([FIG(), KW()], { glossary: { 미사용: "x" } }),
  "term-no-visual": () => mid({ type: "terms", title: "용어", terms: [{ key: "적중", plain: "캐시에 있음" }] }),
  "summary-no-recall": () => mid(SUM_NO_RECALL(), OV()),
  "card-monotony": () => ({ theme: THEME, scenes: [HOOK(), EX(), { type: "compare", title: "c", narration: "n.", items: [] }, EX(), KW()] }),
  "no-signature": () => deck([STRIP(), KW()]),
  "no-theme": () => ({ scenes: [FIG(), KW()] }),
  "unknown-theme": () => ({ theme: "nope", scenes: [FIG(), KW()] }),
  "filler-content": () => mid(STRIP({ title: "항목 1과 샘플 텍스트" })),
  "icon-not-string": () => deck([FIG(), { ...HOOK(), art: () => "x" }, KW()]),
};

export const expectedSeverity = (rule) => (ADVISE.includes(rule) ? "advise" : "fix");
