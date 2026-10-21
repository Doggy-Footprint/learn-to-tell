import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Spec 80a1b2f18f50b1df v2. Expected messages are the base_commit lintDeck templates (FR-1: "msg는 base_commit과 같다").

function loadKit() {
  const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../skills/learn-to-tell/kit/ltt.js", import.meta.url), "utf8"), context);
  return context.LTT;
}

const issues = (units, glossary = {}) =>
  Array.from(loadKit().termIssues(units, glossary), (w) => [w.where, w.rule, w.msg]);

const unknown = (where, key) => [where, "unknown-term", `풀이가 없는 용어 {{${key}}}`];
const early = (where, key) => [where, "used-before-defined", `'${key}'가 풀이(첫 {{${key}}})보다 먼저 쓰였다`];
const filler = (where, match) => [where, "filler-content", `채움 글 '${match}' (실제 사례·값으로 바꿀 것)`];

// ---------- VO-1 equivalence partitions ----------

const CASES = [
  // displayed key partition: in glossary / not / defined by an earlier unit / skipUnknown unit
  { id: "EP display key in glossary: quiet", units: [{ where: "u1", text: "{{적중}}" }], glossary: { 적중: "x" }, out: [] },
  { id: "EP display key not in glossary nor defines: unknown-term", units: [{ where: "u1", text: "{{없는말}}" }], out: [unknown("u1", "없는말")] },
  { id: "EP display key set by {{shown|key}} uses the key, not the shown text", units: [{ where: "u1", text: "{{보이는 말|없는키}}" }], out: [unknown("u1", "없는키")] },
  { id: "EP {{shown|key}} with key in glossary: quiet", units: [{ where: "u1", text: "{{보이는 말|적중}}" }], glossary: { 적중: "x" }, out: [] },
  {
    id: "EP display key in an earlier unit's defines: quiet",
    units: [{ where: "u1", text: "", defines: ["k"] }, { where: "u2", text: "{{k}}" }],
    out: [],
  },
  {
    id: "EP display key in a LATER unit's defines is still not unknown (defines of any unit)",
    units: [{ where: "u1", text: "{{k}}" }, { where: "u2", text: "", defines: ["k"] }],
    out: [],
  },
  { id: "EP skipUnknown unit: unknown mark is skipped", units: [{ where: "u1", text: "{{없는말}}", skipUnknown: true }], out: [] },
  {
    id: "EP skipUnknown applies to its own unit only",
    units: [{ where: "u1", text: "{{없는말}}", skipUnknown: true }, { where: "u2", text: "{{없는말}}" }],
    out: [unknown("u2", "없는말")],
  },
  // bare x first display position
  {
    id: "EP bare before first display (BVA display unit = i+1): used-before-defined at the bare unit",
    units: [{ where: "u1", text: "적중이 높다" }, { where: "u2", text: "{{적중}}" }],
    glossary: { 적중: "x" },
    out: [early("u1", "적중")],
  },
  {
    id: "EP bare in the same unit as the first display, bare first (BVA display unit = i): quiet",
    units: [{ where: "u1", text: "적중 {{적중}}" }],
    glossary: { 적중: "x" },
    out: [],
  },
  {
    id: "EP bare in the same unit as the first display, display first (BVA display unit = i): quiet",
    units: [{ where: "u1", text: "{{적중}} 적중" }],
    glossary: { 적중: "x" },
    out: [],
  },
  {
    id: "EP bare after the first display: quiet (C-1)",
    units: [{ where: "u1", text: "{{적중}}" }, { where: "u2", text: "적중" }],
    glossary: { 적중: "x" },
    out: [],
  },
  { id: "EP no bare at all: quiet", units: [{ where: "u1", text: "{{적중}}" }], glossary: { 적중: "x" }, out: [] },
  { id: "EP glossary key neither shown nor bare anywhere: quiet", units: [{ where: "u1", text: "다른 글" }], glossary: { 적중: "x" }, out: [] },
  {
    id: "EP bare but never displayed or defined in any unit: used-before-defined",
    units: [{ where: "u1", text: "적중이 높다" }],
    glossary: { 적중: "x" },
    out: [early("u1", "적중")],
  },
  {
    id: "EP first display is the earliest one: later displays do not move it",
    units: [{ where: "u1", text: "적중" }, { where: "u2", text: "{{적중}}" }, { where: "u3", text: "{{적중}}" }],
    glossary: { 적중: "x" },
    out: [early("u1", "적중")],
  },
  {
    id: "EP bare in two units before the first display: each unit is reported",
    units: [{ where: "u1", text: "적중" }, { where: "u2", text: "적중" }, { where: "u3", text: "{{적중}}" }],
    glossary: { 적중: "x" },
    out: [early("u1", "적중"), early("u2", "적중")],
  },
  {
    id: "EP bare of a defines key before the defining unit (BVA defines unit = i+1)",
    units: [{ where: "u1", text: "k가 먼저" }, { where: "u2", text: "", defines: ["k"] }],
    out: [early("u1", "k")],
  },
  {
    id: "EP bare of a defines key in the defining unit (BVA defines unit = i): quiet",
    units: [{ where: "u1", text: "k가 정의됨", defines: ["k"] }],
    out: [],
  },
  {
    id: "EP bare of a defines key after the defining unit: quiet",
    units: [{ where: "u1", text: "", defines: ["k"] }, { where: "u2", text: "k를 쓴다" }],
    out: [],
  },
  {
    id: "EP bare is a substring match (C-2): 적중률 in 적중률이 높다",
    units: [{ where: "구역 '앞'", text: "적중률이 높다" }, { where: "구역 '뒤'", text: "{{적중률}}" }],
    glossary: { 적중률: "x" },
    out: [early("구역 '앞'", "적중률")],
  },
  {
    id: "EP marks are removed before the bare search: {{적중률}} is not a bare 적중",
    units: [{ where: "u1", text: "{{적중률}}" }],
    glossary: { 적중: "x", 적중률: "y" },
    out: [],
  },
  {
    id: "EP marks are removed before the bare search: shown text of {{shown|key}} is not bare",
    units: [{ where: "u1", text: "{{적중이란|캐시}}" }],
    glossary: { 적중: "x", 캐시: "y" },
    out: [],
  },
  // F-1: defines and display for the same key
  {
    id: "defines in u1, bare in u2, display in u3: quiet",
    units: [{ where: "u1", text: "", defines: ["k"] }, { where: "u2", text: "k를 쓴다" }, { where: "u3", text: "{{k}}" }],
    out: [],
  },
  {
    id: "display in u1, bare in u2, defines in u3: quiet",
    units: [{ where: "u1", text: "{{k}}" }, { where: "u2", text: "k를 쓴다" }, { where: "u3", text: "", defines: ["k"] }],
    out: [],
  },
  {
    id: "two keys fire in one unit: message order is glossary key order, then defines keys in unit order",
    units: [
      { where: "u1", text: "마바 다라 가나" },
      { where: "u2", text: "{{가나}} {{다라}}" },
      { where: "u3", text: "", defines: ["마바"] },
    ],
    glossary: { 가나: "x", 다라: "y" },
    out: [early("u1", "가나"), early("u1", "다라"), early("u1", "마바")],
  },
  {
    id: "two defines-only keys fire in one unit: order of first introduction by defines",
    units: [
      { where: "u1", text: "둘째 첫째" },
      { where: "u2", text: "", defines: ["첫째"] },
      { where: "u3", text: "", defines: ["둘째"] },
    ],
    out: [early("u1", "첫째"), early("u1", "둘째")],
  },
  // filler partition 0 / 1 / 2
  { id: "EP filler 0: the UI word placeholder is not filler", units: [{ where: "u1", text: "placeholder 글자색은 옅다" }], out: [] },
  { id: "EP filler 1: 샘플 텍스트", units: [{ where: "u1", text: "본문 샘플 텍스트" }], out: [filler("u1", "샘플 텍스트")] },
  { id: "EP filler 1: TODO keeps the matched casing (regex is case-insensitive)", units: [{ where: "u1", text: "곧 todo 할 일" }], out: [filler("u1", "todo")] },
  { id: "EP filler 2: only the first match is reported (leftmost)", units: [{ where: "u1", text: "항목 1과 샘플 텍스트" }], out: [filler("u1", "항목 1")] },
  { id: "EP filler 2 (C-4): leftmost is 샘플 텍스트 when it comes first", units: [{ where: "u1", text: "본문 샘플 텍스트와 항목 1" }], out: [filler("u1", "샘플 텍스트")] },
  {
    id: "EP filler is searched in the mark-removed text: {{샘플 텍스트|적중}} is quiet",
    units: [{ where: "u1", text: "{{샘플 텍스트|적중}}" }],
    glossary: { 적중: "x" },
    out: [],
  },
  {
    id: "EP filler is reported once per unit",
    units: [{ where: "u1", text: "TODO" }, { where: "u2", text: "TBD" }],
    out: [filler("u1", "TODO"), filler("u2", "TBD")],
  },
  // ordering: unit order first, then unknown -> used-before-defined -> filler inside a unit
  {
    id: "order: inside a unit unknown-term, used-before-defined, filler-content",
    units: [{ where: "u1", text: "{{없는말}} TODO 적중" }, { where: "u2", text: "{{적중}}" }],
    glossary: { 적중: "x" },
    out: [unknown("u1", "없는말"), early("u1", "적중"), filler("u1", "TODO")],
  },
  {
    id: "order: unit order wins over rule order",
    units: [{ where: "u1", text: "TODO" }, { where: "u2", text: "{{없는말}}" }],
    out: [filler("u1", "TODO"), unknown("u2", "없는말")],
  },
  { id: "empty units: no issues", units: [], out: [] },
];

for (const { id, units, glossary, out } of CASES) {
  test(`VO-1 termIssues ${id}`, () => {
    assert.deepEqual(issues(units, glossary), out);
  });
}

test("VO-1 termIssues does not mutate its inputs", () => {
  const units = [{ where: "u1", text: "적중 {{적중}}", defines: ["a"] }];
  const glossary = { 적중: "x" };
  const before = JSON.stringify({ units, glossary });
  loadKit().termIssues(units, glossary);
  assert.equal(JSON.stringify({ units, glossary }), before);
});

// ---------- VO-11 static: single implementation of the B rules ----------

const B_IDS = ["unknown-term", "used-before-defined", "predict-new-term", "filler-content"];

test("VO-11 QR-7: ltt-deck.js contains none of the four B rule ids", () => {
  const src = readFileSync(new URL("../skills/learn-to-tell/kit/ltt-deck.js", import.meta.url), "utf8");
  const found = B_IDS.filter((id) => src.includes(id));
  assert.deepEqual(found, []);
});

test("VO-11 QR-7: lintDeck never emits a B rule for a deck that triggers each of them", () => {
  const LTT = loadKit();
  const KW = { type: "keywords", terms: [] };
  const triggers = {
    "unknown-term": { scenes: [{ type: "explain", form: "strip", title: "{{없는말}}", steps: [] }, KW] },
    "unknown-term (terms entry without plain)": { scenes: [{ type: "terms", title: "t", terms: [{ key: "가" }] }, KW] },
    "used-before-defined": { glossary: { TTL: "x" }, scenes: [{ type: "hook", text: "TTL을" }, { type: "explain", title: "{{TTL}}", steps: [] }, KW] },
    "predict-new-term": { glossary: { 적중률: "x" }, scenes: [{ type: "predict", title: "p", question: "{{적중률}}은?", choices: [] }, KW] },
    "filler-content": { scenes: [{ type: "explain", form: "strip", title: "샘플 텍스트", steps: [] }, KW] },
  };
  for (const [name, spec] of Object.entries(triggers)) {
    const deckRules = Array.from(LTT.deckIssues(spec), (w) => w.rule);
    assert.ok(deckRules.some((r) => B_IDS.includes(r)), `fixture "${name}" does not trigger a B rule in deckIssues`);
    const lintRules = Array.from(LTT.lintDeck(spec), (w) => w.rule);
    assert.deepEqual(lintRules.filter((r) => B_IDS.includes(r)), [], `lintDeck emits a B rule for "${name}"`);
  }
});
