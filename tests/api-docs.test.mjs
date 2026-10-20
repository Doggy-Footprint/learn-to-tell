import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SKILL = join(ROOT, "skills/learn-to-tell");
const KIT = join(SKILL, "kit");
const API_DIR = join(KIT, "api");
const PKG = join(ROOT, "packages/ltt-kit");

const PART_DOCS = ["base", "ui", "mock", "diagram", "sequence", "map", "controls", "charts"];
const API_FILES = [...PART_DOCS, "deck-contracts", "internals", "rules"].map((f) => `${f}.md`);
const P2_PARTS = ["ui", "mock", "diagram", "sequence", "map", "controls", "charts"];
// Plan b71ddee49f77ac06 §3: what a generating agent reads before writing (SKILL.md + API.md) stays near 30K bytes.
// API.md carries the authoring rules and syntax snippets; the snippets shrink once scene specs become declarative.
const CORE_LIMIT = 11500;
const SKILL_LIMIT = 9500;
const P2_LIMIT = 18000;
const ROW_LIMIT = 300;

// ---------- pure checkers ----------

const lines = (text) => text.split(/\r?\n/);
const cp = (text) => [...text].length;
const isSeparator = (line) => /^\|[\s:|-]*$/.test(line) && line.includes("-");
const isRow = (line) => line.startsWith("|") && !isSeparator(line);

function cells(row) {
  const out = [];
  let cur = "";
  for (let i = 1; i < row.length; i++) {
    if (row[i] === "|" && row[i - 1] !== "\\") {
      out.push(cur);
      cur = "";
    } else cur += row[i];
  }
  if (cur.trim()) out.push(cur);
  return out;
}
const firstCell = (row) => cells(row)[0] ?? "";
const codeSpans = (text) => lines(text).flatMap((l) => [...l.matchAll(/`([^`]+)`/g)].map((m) => m[1]));

function definitions(files) {
  const defs = new Map();
  for (const [file, text] of Object.entries(files)) {
    for (const line of lines(text)) {
      if (!isRow(line)) continue;
      for (const span of codeSpans(firstCell(line))) {
        for (const m of span.matchAll(/LTT\.([A-Za-z_$][\w$]*)/g)) {
          if (!defs.has(m[1])) defs.set(m[1], new Set());
          defs.get(m[1]).add(file);
        }
      }
    }
  }
  return defs;
}

function definitionErrors(names, defs) {
  const errors = [];
  for (const name of names) {
    const files = [...(defs.get(name) ?? [])].sort();
    if (files.length === 0) errors.push(`${name}: defined in no file of D (EP-0, FR-1)`);
    else if (files.length > 1) errors.push(`${name}: defined in ${files.length} files: ${files.join(", ")} (EP-2, FR-1)`);
  }
  return errors;
}

function sizeError(text, limit, label) {
  const n = cp(text);
  return n <= limit ? null : `${label}: ${n} code points > limit ${limit}`;
}

function partsSumError(core, parts, limit) {
  const sized = Object.entries(parts).map(([name, text]) => [name, cp(text)]).sort((a, b) => b[1] - a[1]);
  const top = sized.slice(0, 2);
  const total = cp(core) + top.reduce((s, [, n]) => s + n, 0);
  if (total <= limit) return null;
  return `QR-P2: API.md ${cp(core)} + ${top.map(([f, n]) => `${f} ${n}`).join(" + ")} = ${total} code points > limit ${limit}`;
}

const lineWithAll = (text, tokens) => lines(text).some((l) => tokens.every((t) => l.includes(t)));

function tokenLineError(text, id, tokens) {
  if (lineWithAll(text, tokens)) return null;
  const absent = tokens.filter((t) => !text.includes(t));
  return `${id}: no single line contains all of ${tokens.map((t) => JSON.stringify(t)).join(", ")}` +
    (absent.length ? `; absent from the text: ${absent.map((t) => JSON.stringify(t)).join(", ")}` : "; tokens are split across lines");
}

function anchorErrors(html, parts) {
  const errors = [];
  for (const p of parts) {
    const n = (html.match(new RegExp(`["']api-${p}["']`, "g")) ?? []).length;
    if (n !== 1) errors.push(`api-${p}: ${n} occurrences (expected exactly 1, FR-6)`);
  }
  return errors;
}

// Mirrors section() in tests/map/skill.test.mjs (copied, not imported, so that file stays independent).
function section(text, n) {
  const start = text.search(new RegExp(`^##(?!#)\\s*(?:§\\s*)?${n}\\b`, "m"));
  assert.ok(start >= 0, `section ${n} heading ("## ${n}. ...") not found`);
  const rest = text.slice(start + 3);
  const end = rest.search(/^##(?!#)\s/m);
  return end >= 0 ? text.slice(start, start + 3 + end) : text.slice(start);
}

function tableBlocks(text) {
  const blocks = [];
  let cur = null;
  for (const line of lines(text)) {
    if (!line.startsWith("|")) {
      cur = null;
      continue;
    }
    if (!cur) blocks.push((cur = []));
    cur.push(line);
  }
  return blocks;
}

const firstNonEmptyLine = (text) => lines(text).find((l) => l.trim() !== "") ?? "";

function loadAttrs(apiText) {
  const block = apiText.match(/^```html[^\n]*\n([\s\S]*?)^```/m);
  if (!block) return null;
  return [...block[1].matchAll(/<script\b[^>]*?\bsrc=["']([^"']+)["']|<link\b[^>]*?\bhref=["']([^"']+)["']/g)].map((m) => m[1] ?? m[2]);
}

function fencedBlock(sectionText, lang, containing) {
  const ls = lines(sectionText);
  const blocks = [];
  for (let i = 0; i < ls.length; i++) {
    const open = ls[i].match(new RegExp(`^\\s*(\`{3,})${lang}\\b`));
    if (!open) continue;
    let j = i + 1;
    while (j < ls.length && !new RegExp(`^\\s*\`{${open[1].length},}\\s*$`).test(ls[j])) j++;
    blocks.push({ start: i, end: j, body: ls.slice(i + 1, j) });
    i = j;
  }
  return blocks.find((b) => b.body.some(containing)) ?? blocks[0] ?? null;
}

// ---------- real inputs ----------

function readReal(path, what) {
  assert.ok(existsSync(path), `${what} is missing: ${path}`);
  return readFileSync(path, "utf8");
}

function loadLTT() {
  const context = { console: { info() {}, warn() {} } };
  vm.createContext(context);
  for (const f of ["vendor/d3.min.js", "ltt.js", "ltt-parts.js", "ltt-ui.js", "ltt-mock.js", "ltt-deck.js"]) {
    vm.runInContext(readFileSync(join(KIT, f), "utf8"), context);
  }
  return context.LTT;
}

function realDocs() {
  const files = { "kit/API.md": readReal(join(KIT, "API.md"), "kit/API.md") };
  assert.ok(existsSync(API_DIR), `kit/api/ directory is missing: ${API_DIR}`);
  for (const f of readdirSync(API_DIR).filter((f) => f.endsWith(".md")).sort()) {
    files[`kit/api/${f}`] = readFileSync(join(API_DIR, f), "utf8");
  }
  return files;
}

const apiText = () => readReal(join(KIT, "API.md"), "kit/API.md");
const apiDoc = (f) => readReal(join(API_DIR, f), `kit/api/${f}`);
const rulesText = () => apiDoc("rules.md");
const skillText = () => readReal(join(SKILL, "SKILL.md"), "SKILL.md");

// ---------- VO-1 definition checker (synthetic) ----------

test("VO-1 C-3 EP-0: a name defined in no file fails with that name", () => {
  const defs = definitions({ "a.md": "| `LTT.beta()` | b |\n" });
  const errors = definitionErrors(["alpha", "beta"], defs);
  assert.equal(errors.length, 1, errors.join("\n"));
  assert.match(errors[0], /^alpha: /);
});

test("VO-1 C-3 EP-1: a name defined in exactly one file passes, even with two rows in that file", () => {
  const defs = definitions({
    "a.md": "| `LTT.gamma(x)` | one |\n| `LTT.gamma(x, y)` | two |\n",
    "b.md": "| `LTT.delta` | d |\n",
  });
  assert.deepEqual(definitionErrors(["gamma", "delta"], defs), []);
  assert.deepEqual([...defs.get("gamma")], ["a.md"]);
});

test("VO-1 C-3 EP-2: a name defined in two files fails with the name and both files", () => {
  const defs = definitions({ "a.md": "| `LTT.gamma()` | a |\n", "b.md": "| `LTT.gamma(x)` | b |\n", "c.md": "| `LTT.other` | c |\n" });
  const errors = definitionErrors(["gamma", "other"], defs);
  assert.equal(errors.length, 1, errors.join("\n"));
  assert.match(errors[0], /^gamma: /);
  assert.ok(errors[0].includes("a.md") && errors[0].includes("b.md"), errors[0]);
});

const FORMS = [
  { id: "F-call", row: "| `LTT.theme(name)` | 고른다 |", names: ["theme"] },
  { id: "F-multi", row: "| `LTT.theme(name)`, `LTT.themes` | 테마 |", names: ["theme", "themes"] },
  { id: "F-mock", row: "| `LTT.mock.phone(o)` | 폰 |", names: ["mock"] },
  { id: "F-dollar", row: "| `LTT.$` | id 도우미 |", names: ["$"] },
  { id: "F-pipe", row: "| `LTT.narration(html \\| [html])` | 해설 |", names: ["narration"] },
];
for (const { id, row, names } of FORMS) {
  test(`VO-1 C-4 ${id}: the first-cell form defines ${names.join(", ")}`, () => {
    const defs = definitions({ "x.md": `| 이름 | 설명 |\n| --- | --- |\n${row}\n` });
    assert.deepEqual([...defs.keys()].sort(), [...names].sort());
    for (const n of names) assert.deepEqual([...defs.get(n)], ["x.md"], `${id}: ${n}`);
  });
}

const NON_DEFS = [
  { id: "X-prose", text: "`LTT.diagram(svg, spec)`은 그래프를 그린다.\n- 목록 속 `LTT.diagram`\n" },
  { id: "X-cell2", text: "| 이름 | 설명 |\n| --- | --- |\n| 그래프 | `LTT.diagram(svg, spec)`을 쓴다 |\n" },
];
for (const { id, text } of NON_DEFS) {
  test(`VO-1 C-5 ${id}: LTT.diagram outside a table first cell is not a definition`, () => {
    const defs = definitions({ "x.md": text });
    assert.equal(defs.has("diagram"), false, `${id} counted as a definition`);
    assert.deepEqual(definitionErrors(["diagram"], defs), ["diagram: defined in no file of D (EP-0, FR-1)"]);
  });
}

// ---------- VO-1 / VO-2 real D and N ----------

test("VO-1 C-1: every name in the runtime LTT is defined in exactly one file of D", () => {
  const names = Object.keys(loadLTT());
  assert.ok(names.length > 0, "LTT has no public names");
  const errors = definitionErrors(names, definitions(realDocs()));
  assert.deepEqual(errors, [], errors.join("\n"));
});

test("VO-1 C-6: an undocumented runtime name newThing is reported", () => {
  const names = [...Object.keys(loadLTT()), "newThing"];
  const errors = definitionErrors(names, definitions(realDocs()));
  assert.ok(errors.some((e) => e.startsWith("newThing: ")), `newThing not reported: ${JSON.stringify(errors)}`);
});

const BASE_DEFINITIONS = {
  "kit/API.md": "theme, themes, palette, mark, marks, icon, icons, expect, record, lintDeck, math, MOTION_MS, deck",
  "kit/api/base.md": "themeTokens, summaryCards, linkTerms, warn",
  "kit/api/ui.md": "narration, annotate, beforeAfter, facts, chips, badge, callout, swatches, takeaway, chartFrame, inspector, redline, h, fill, contrast",
  "kit/api/mock.md": "mock",
  "kit/api/diagram.md": "diagram, graphOverlaps, diagramLayout, autoLayout, state, stateSpec",
  "kit/api/sequence.md": "sequence, sequenceLayout",
  "kit/api/map.md": "map",
  "kit/api/controls.md": "sweep, drag, predict, stepper, sim, tween",
  "kit/api/charts.md": "axisPlot, hbars, lanes, sankey, plot, plotTheme, plane, units, bar",
  "kit/api/internals.md": "kitBase, lessonId, compare, termsIn, sceneText, termIndex, rectHit, freeSlot, stepValues, goalReach, setGlossary, auditScene, mobile, measure, $, deckTypes, sceneTypes, placement",
};

// Spec 74cb05d7da21907e v1 FR-3: the base 74 public names plus placement (defined by ltt-deck.js, documented in internals.md) = 75.
test("VO-2 oracle table lists 75 distinct names: the base 74 plus placement", () => {
  const all = Object.values(BASE_DEFINITIONS).flatMap((s) => s.split(", "));
  assert.equal(new Set(all).size, 75);
  assert.equal(all.length, 75);
  assert.equal(all.filter((n) => n !== "placement").length, 74);
});

test("VO-2 FR-3 QR-2: the runtime LTT public names are exactly the 75 oracle names", () => {
  const expected = Object.values(BASE_DEFINITIONS).flatMap((s) => s.split(", ")).sort();
  const names = Object.keys(loadLTT()).sort();
  const missing = expected.filter((n) => !names.includes(n));
  const extra = names.filter((n) => !expected.includes(n));
  assert.deepEqual({ missing, extra }, { missing: [], extra: [] }, `runtime LTT differs from the oracle: missing [${missing.join(", ")}], extra [${extra.join(", ")}]`);
  assert.equal(names.length, 75);
});

for (const [file, list] of Object.entries(BASE_DEFINITIONS)) {
  test(`VO-2 FR-2: ${file} is the only file defining ${list.split(", ").length} base names`, () => {
    const defs = definitions(realDocs());
    const wrong = list.split(", ").flatMap((name) => {
      const files = [...(defs.get(name) ?? [])].sort();
      return files.length === 1 && files[0] === file ? [] : [`${name}: expected only ${file}, got [${files.join(", ")}]`];
    });
    assert.deepEqual(wrong, [], wrong.join("\n"));
  });
}

test("VO-2 FR-2: kit/api/deck-contracts.md defines no name", () => {
  apiDoc("deck-contracts.md");
  const defs = definitions(realDocs());
  const names = [...defs].filter(([, files]) => files.has("kit/api/deck-contracts.md")).map(([n]) => n);
  assert.deepEqual(names, [], `deck-contracts.md defines ${names.join(", ")}`);
});

// ---------- VO-3 size ----------

const pad = (n) => "😀".repeat(100) + "가".repeat(4000) + "a".repeat(n - 4100);

test("VO-3 C-2: 11,500 code points pass the core size check", () => {
  const text = pad(11500);
  assert.equal(cp(text), 11500);
  assert.equal(sizeError(text, CORE_LIMIT, "kit/API.md"), null);
});

test("VO-3 C-2: 11,501 code points fail with the actual count and the limit", () => {
  const err = sizeError(pad(11501), CORE_LIMIT, "kit/API.md");
  assert.ok(err, "11,501 code points passed");
  assert.ok(err.includes("11501") && err.includes("11500"), err);
});

test("VO-3 FR-3 QR-P1: real kit/API.md is at most 11,500 code points", () => {
  const err = sizeError(apiText(), CORE_LIMIT, "kit/API.md");
  assert.equal(err, null, err);
});

test("plan b71ddee49f77ac06 §3: real SKILL.md is at most 8,500 code points", () => {
  const err = sizeError(skillText(), SKILL_LIMIT, "SKILL.md");
  assert.equal(err, null, err);
});

const p2Parts = (charts) => ({ ui: pad(4200), mock: pad(4200), diagram: pad(4200), sequence: pad(4200), map: pad(4200), controls: pad(5000), charts: pad(charts) });

test("VO-3 C-2 QR-P2: core plus the two largest parts at 18,000 passes", () => {
  assert.equal(partsSumError(pad(8000), p2Parts(5000), P2_LIMIT), null);
});

test("VO-3 C-2 QR-P2: core plus the two largest parts at 18,001 fails with the sum and the limit", () => {
  const err = partsSumError(pad(8000), p2Parts(5001), P2_LIMIT);
  assert.ok(err, "18,001 passed");
  assert.ok(err.includes("18001") && err.includes("18000") && err.includes("charts") && err.includes("controls"), err);
});

test("VO-3 QR-P2: real API.md plus the two largest of the seven part docs is at most 18,000 code points", () => {
  const parts = Object.fromEntries(P2_PARTS.map((p) => [p, apiDoc(`${p}.md`)]));
  const err = partsSumError(apiText(), parts, P2_LIMIT);
  assert.equal(err, null, err);
});

// ---------- VO-4 core structure ----------

const BASE_LOAD = [
  "/kit/vendor/katex/katex.min.css",
  "/kit/vendor/d3.min.js",
  "/kit/vendor/plot.umd.min.js",
  "/kit/vendor/katex/katex.min.js",
  "/kit/vendor/d3-sankey.min.js",
  "/kit/vendor/topojson-client.min.js",
  "/kit/vendor/prism/prism.min.js",
  "/kit/vendor/elk.bundled.js",
  "/kit/vendor/rough.js",
  "/kit/ltt.js",
  "/kit/ltt-parts.js",
  "/kit/ltt-ui.js",
  "/kit/ltt-mock.js",
  "/kit/ltt-deck.js",
];

const firstCellSpans = (text) => new Set(lines(text).filter(isRow).flatMap((r) => codeSpans(firstCell(r))));

test("VO-4 load block: first ```html block keeps the base src/href list in order", () => {
  const got = loadAttrs(apiText());
  assert.ok(got, "kit/API.md has no ```html block");
  assert.deepEqual(got, BASE_LOAD);
});

test("VO-4 themes: every LTT.themes name is a first-cell code span", () => {
  // vm-realm arrays fail deepStrictEqual against main-realm arrays on prototype; Array.from rebuilds in this realm.
  const themes = Array.from(loadLTT().themes, (t) => t.name);
  assert.ok(themes.length > 0, "LTT.themes is empty");
  const spans = firstCellSpans(apiText());
  const missing = themes.filter((t) => !spans.has(t));
  assert.deepEqual(missing, [], `theme rows missing: ${missing.join(", ")}`);
});

const LINT_IDS = ["unknown-term", "used-before-defined", "predict-new-term", "no-reading-guide", "no-title", "overview-missing", "overview-order", "overview-no-visual", "keywords-last", "unused-term", "term-no-visual", "summary-no-recall", "card-monotony", "no-signature", "no-theme", "unknown-theme", "filler-content"];
const AUDIT_IDS = ["overflow", "shrunk", "small-visual", "loose-figure", "empty-stage", "many-sizes", "hscroll", "graph-overlap", "panel-overlap", "goal-unreachable", "goal-narrow", "goal-at-start"];

for (const [label, ids] of [["lint", LINT_IDS], ["audit", AUDIT_IDS]]) {
  test(`VO-4 ${label} rules: all ${ids.length} ids are first-cell code spans of kit/api/rules.md`, () => {
    const spans = firstCellSpans(rulesText());
    const missing = ids.filter((id) => !spans.has(id));
    assert.deepEqual(missing, [], `${label} rule rows missing: ${missing.join(", ")}`);
  });
}

const SCENE_TYPES = ["hook", "terms", "explain", "figure", "overview", "statement", "contrast", "compare", "predict", "summary", "keywords", "(없음)"];
const isTypeCell = (row, t) => {
  const c = firstCell(row).trim();
  return c === t || c === `\`${t}\``;
};

function sceneTypeProblems(text) {
  const rows = lines(text).filter(isRow);
  const problems = [];
  for (const t of SCENE_TYPES) {
    const hits = rows.filter((r) => isTypeCell(r, t));
    if (hits.length !== 1) problems.push(`${t}: ${hits.length} rows have this first cell (expected exactly 1)`);
    for (const r of hits) if (cp(r) > ROW_LIMIT) problems.push(`${t}: row has ${cp(r)} code points > ${ROW_LIMIT}`);
  }
  return problems;
}

const fakeSceneTable = (figureRows) => ["| type | 필드 |", "| --- | --- |",
  ...SCENE_TYPES.flatMap((t) => (t === "figure" ? figureRows : [`| ${t === "(없음)" ? t : `\`${t}\``} | 짧은 설명 |`]))].join("\n");

test("VO-4 scene-type checker: a clean table with one short row per type passes", () => {
  assert.deepEqual(sceneTypeProblems(fakeSceneTable(["| `figure` | 짧은 설명 |"])), []);
});

test("VO-4 scene-type checker: a duplicated long figure row fails on count and on length", () => {
  const long = `| \`figure\` | ${"가".repeat(ROW_LIMIT)} |`;
  const problems = sceneTypeProblems(fakeSceneTable(["| `figure` | 짧은 설명 |", long]));
  assert.deepEqual(problems, ["figure: 2 rows have this first cell (expected exactly 1)", `figure: row has ${cp(long)} code points > ${ROW_LIMIT}`]);
});

test("VO-4 scene types: each type and (없음) is the first cell of exactly one row, each such row at most 300 code points", () => {
  const problems = sceneTypeProblems(apiText());
  assert.deepEqual(problems, [], problems.join("\n"));
});

test("VO-4 common fields: every row of the table under the 공통 필드 heading is at most 300 code points", () => {
  const ls = lines(apiText());
  const at = ls.findIndex((l) => /^#+\s/.test(l) && l.includes("공통 필드"));
  assert.ok(at >= 0, "no heading containing 공통 필드");
  const rest = ls.slice(at + 1);
  const until = rest.findIndex((l) => /^#+\s/.test(l));
  const rows = (until >= 0 ? rest.slice(0, until) : rest).filter(isRow);
  assert.ok(rows.length > 1, "no table under the 공통 필드 heading");
  const long = rows.filter((r) => cp(r) > ROW_LIMIT).map((r) => `${firstCell(r).trim()}: ${cp(r)} code points > ${ROW_LIMIT}`);
  assert.deepEqual(long, [], long.join("\n"));
});

test("VO-4 deck-contracts pointer: one line holds steps, answerVisual and kit/api/deck-contracts.md", () => {
  const err = tokenLineError(apiText(), "FR-3 deck-contracts line", ["steps", "answerVisual", "kit/api/deck-contracts.md"]);
  assert.equal(err, null, err);
});

test("VO-4 part paths: kit/API.md names the nine kit/api docs and not internals.md", () => {
  const text = apiText();
  const missing = [...PART_DOCS, "deck-contracts"].map((f) => `kit/api/${f}.md`).filter((p) => !text.includes(p));
  assert.deepEqual(missing, [], `kit/API.md lacks ${missing.join(", ")}`);
  assert.equal(text.includes("internals.md"), false, "kit/API.md mentions internals.md");
});

test("VO-4 principles heading: kit/API.md has ## 원칙 or ### 원칙", () => {
  assert.match(apiText(), /^#{2,3} 원칙/m, "kit/API.md has no 원칙 heading");
});

test("VO-4 kit/api holds the ten split docs", () => {
  assert.ok(existsSync(API_DIR), `kit/api/ directory is missing: ${API_DIR}`);
  const have = new Set(readdirSync(API_DIR));
  const missing = API_FILES.filter((f) => !have.has(f));
  assert.deepEqual(missing, [], `kit/api lacks ${missing.join(", ")}`);
});

const FIRST_LINE = [
  ...PART_DOCS.map((p) => [`${p}.md`, ["언제", "vendor", `catalog.html#api-${p}`]]),
  ["deck-contracts.md", ["언제", "steps", "answerVisual"]],
  ["internals.md", ["kit 개발자용", "수업에서 부르지 않"]],
];
for (const [file, tokens] of FIRST_LINE) {
  test(`VO-4 FR-5 first line of kit/api/${file} holds ${tokens.join(", ")}`, () => {
    const line = firstNonEmptyLine(apiDoc(file));
    const missing = tokens.filter((t) => !line.includes(t));
    assert.deepEqual(missing, [], `kit/api/${file} first line ${JSON.stringify(line)} lacks ${missing.join(", ")}`);
  });
}

// ---------- VO-6 SKILL.md, standalone.md, PROJECT.md tokens ----------

const BUDGET = {
  B1: ["기본 예산", "결정 변수마다 장면 4개 이하", "8~10장면"],
  B2: ["한 챕터 전체", "길게", "3개 이상", "늘린다"],
  B3: ["상한이 아니라 기본값", "v0", "하한"],
  B4: ["예산을 넘기면", "장면 수와 이유", "묻지 않는다"],
};

test("VO-6 C-9: B1 tokens on one line pass", () => {
  assert.equal(tokenLineError(`앞 줄\n${BUDGET.B1.join(" ")}\n뒤 줄`, "B1", BUDGET.B1), null);
});

test("VO-6 C-9: B1 tokens split across two lines fail with the id and tokens", () => {
  const err = tokenLineError(`${BUDGET.B1.slice(0, 2).join(" ")}\n${BUDGET.B1.slice(2).join(" ")}`, "B1", BUDGET.B1);
  assert.ok(err, "split tokens passed");
  assert.ok(err.startsWith("B1:") && err.includes("8~10장면"), err);
});

for (const [id, tokens] of Object.entries(BUDGET)) {
  test(`VO-6 FR-8 ${id}: SKILL.md §2 has a line with ${tokens.join(" / ")}`, () => {
    const err = tokenLineError(section(skillText(), 2), `FR-8 ${id}`, tokens);
    assert.equal(err, null, err);
  });
}

test("VO-6 FR-8 no-scene-budget: SKILL.md §2 has no scene-budget", () => {
  assert.equal(section(skillText(), 2).includes("scene-budget"), false, "FR-8: §2 mentions scene-budget");
});

test("VO-6 FR-7 §3 read line: one line holds kit/API.md, kit/api/<part>.md and 만 읽는다", () => {
  const err = tokenLineError(section(skillText(), 3), "FR-7 §3 read line", ["kit/API.md", "kit/api/<part>.md", "만 읽는다"]);
  assert.equal(err, null, err);
});

const REF_HEADER = "| 보여 줄 것 | 부품 | 참조 |";
const REF_PATHS = [...["diagram", "sequence", "map", "controls", "charts", "ui", "mock"].map((x) => `\`kit/api/${x}.md\``), "`kit/API.md`"];

// Plan b71ddee49f77ac06 §3 moved the part-picking table from SKILL.md §3 into kit/API.md.
test("VO-6 FR-7 API.md reference column: every row of the 보여 줄 것 | 부품 | 참조 table points at a doc", () => {
  const ls = lines(apiText());
  const at = ls.findIndex((l) => l.trim() === REF_HEADER);
  assert.ok(at >= 0, `FR-7: kit/API.md has no table header ${REF_HEADER}`);
  const rows = [];
  for (let i = at + 1; i < ls.length && ls[i].trimStart().startsWith("|"); i++) {
    const row = ls[i].trimStart();
    if (isRow(row)) rows.push(row);
  }
  assert.ok(rows.length > 0, "FR-7: the reference table has no data rows");
  const bad = rows.filter((r) => !REF_PATHS.some((p) => (cells(r)[2] ?? "").includes(p)));
  assert.deepEqual(bad, [], `FR-7: rows without a doc in the 참조 cell:\n${bad.join("\n")}`);
});

test("VO-6 FR-7 no-internals: SKILL.md never mentions internals.md", () => {
  assert.equal(skillText().includes("internals.md"), false, "FR-7: SKILL.md mentions internals.md");
});

const COST_TOKENS = ["lesson.html", "바이트", "장면 수", "결정 변수 수", "검토 서브에이전트", "audit", "남은 권고", "시작", "공개", "토큰"];
const isCostLine = (l) => l.trimStart().startsWith("- 생성 비용:");

function costTemplate() {
  const s5 = section(skillText(), 5);
  const block = fencedBlock(s5, "markdown", isCostLine);
  assert.ok(block, "FR-9: §5 has no ```markdown template block");
  return { s5, block };
}

test("VO-6 FR-9 §5 template: a - 생성 비용: line followed by all 10 sub-value tokens before the block end", () => {
  const { block } = costTemplate();
  const at = block.body.findIndex(isCostLine);
  assert.ok(at >= 0, "FR-9: §5 template has no line starting with - 생성 비용:");
  const tail = block.body.slice(at).join("\n");
  const missing = COST_TOKENS.filter((t) => !tail.includes(t));
  assert.deepEqual(missing, [], `FR-9: 생성 비용 block lacks ${missing.join(", ")}`);
});

for (const [id, tokens] of [["FR-9 §5 once line", ["생성 비용", "한 번"]], ["FR-9 §5 transcript line", ["transcript", "바이트"]]]) {
  test(`VO-6 ${id}: outside the template block one line holds ${tokens.join(", ")}`, () => {
    const { s5, block } = costTemplate();
    const outside = lines(s5).filter((_, i) => i < block.start || i > block.end).join("\n");
    const err = tokenLineError(outside, id, tokens);
    assert.equal(err, null, err);
  });
}

test("VO-6 FR-10 standalone line: 생성 비용, 해당 없음, 서브에이전트, 브라우저 on one line", () => {
  const err = tokenLineError(readReal(join(SKILL, "standalone.md"), "standalone.md"), "FR-10 standalone line", ["생성 비용", "해당 없음", "서브에이전트", "브라우저"]);
  assert.equal(err, null, err);
});

const projectText = () => readReal(join(ROOT, "learn-to-tell-PROJECT.md"), "learn-to-tell-PROJECT.md");

test("VO-6 FR-11 PROJECT 범위 line: ### 범위 has a line with 장면 수, 기본값, 상한이 아니", () => {
  const ls = lines(projectText());
  const at = ls.findIndex((l) => /^###\s+범위/.test(l));
  assert.ok(at >= 0, "FR-11: learn-to-tell-PROJECT.md has no ### 범위 heading");
  const rest = ls.slice(at + 1);
  const until = rest.findIndex((l) => /^#{2,3}\s/.test(l));
  const err = tokenLineError((until >= 0 ? rest.slice(0, until) : rest).join("\n"), "FR-11 PROJECT 범위 line", ["장면 수", "기본값", "상한이 아니"]);
  assert.equal(err, null, err);
});

test("VO-6 FR-11 PROJECT kit/api: kit/api/ occurs at least twice", () => {
  const n = projectText().split("kit/api/").length - 1;
  assert.ok(n >= 2, `FR-11: kit/api/ occurs ${n} times (need >= 2)`);
});

// ---------- VO-7 catalog anchors ----------

test("VO-7 one occurrence of an api anchor passes", () => {
  assert.deepEqual(anchorErrors(`<h2 id="api-controls">x</h2><script>go('api-map')</script>`, ["controls", "map"]), []);
});

test("VO-7 zero occurrences fail with the anchor name and count", () => {
  assert.deepEqual(anchorErrors(`<h2 id="api-control">x</h2> api-controls`, ["controls"]), ["api-controls: 0 occurrences (expected exactly 1, FR-6)"]);
});

test("VO-7 two occurrences fail with the anchor name and count", () => {
  assert.deepEqual(anchorErrors(`<h2 id="api-controls"></h2><a data-x='api-controls'></a>`, ["controls"]), ["api-controls: 2 occurrences (expected exactly 1, FR-6)"]);
});

test("VO-7 FR-6: catalog.html quotes each of the eight api anchors exactly once", () => {
  const errors = anchorErrors(readReal(join(ROOT, "site/gallery/catalog.html"), "site/gallery/catalog.html"), PART_DOCS);
  assert.deepEqual(errors, [], errors.join("\n"));
});

// ---------- VO-8 packaging scenarios (real processes) ----------

let built = false;
function buildKit() {
  try {
    execFileSync(process.execPath, [join(ROOT, "scripts/build.mjs"), "kit"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    assert.fail(`build.mjs kit exited ${e.status ?? e.code}: ${e.stderr ?? e.message}`);
  }
  built = true;
}

test("VO-8 S1 FR-12: packages/ltt-kit/package.json files includes api/", () => {
  const pkg = JSON.parse(readReal(join(PKG, "package.json"), "packages/ltt-kit/package.json"));
  assert.ok(Array.isArray(pkg.files) && pkg.files.includes("api/"), `files = ${JSON.stringify(pkg.files)}`);
});

test("VO-8 S2 C-8: build kit removes a planted stale api file and copies every kit/api file", { timeout: 60_000 }, () => {
  mkdirSync(join(PKG, "api"), { recursive: true });
  const stale = join(PKG, "api/zz-stale.md");
  writeFileSync(stale, "stale\n");
  buildKit();
  assert.equal(existsSync(stale), false, "packages/ltt-kit/api/zz-stale.md survived build kit");
  assert.ok(existsSync(API_DIR), `kit/api/ directory is missing: ${API_DIR}`);
  const source = readdirSync(API_DIR).sort();
  const missingSource = API_FILES.filter((f) => !source.includes(f));
  assert.deepEqual(missingSource, [], `kit/api lacks ${missingSource.join(", ")}`);
  assert.deepEqual(readdirSync(join(PKG, "api")).sort(), source, "packages/ltt-kit/api differs from kit/api");
});

test("VO-8 S3: npm pack --dry-run lists api/controls.md and API.md", { timeout: 60_000 }, () => {
  if (!built) buildKit();
  let out;
  try {
    out = execFileSync("npm", ["pack", "--dry-run", "--json"], { cwd: PKG, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    assert.fail(e.code === "ENOENT" ? "npm is not available; npm pack --dry-run could not run" : `npm pack --dry-run exited ${e.status}: ${e.stderr}`);
  }
  const at = out.search(/^\[/m);
  assert.ok(at >= 0, `npm pack printed no JSON array: ${out}`);
  const paths = JSON.parse(out.slice(at))[0].files.map((f) => f.path);
  for (const p of ["api/controls.md", "API.md"]) assert.ok(paths.includes(p), `npm pack list lacks ${p}: ${paths.join(", ")}`);
});

// spec bf761aaf871d8d45 VO-5 (FR-5, C-9): kit .css files are packaged; kept in this file so build kit never runs concurrently with S2.

const KIT_CSS = ["ltt.css", "ltt-parts.css", "ltt-ui.css", "ltt-mock.css", "ltt-deck.css"];

test("VO-8 bf761 VO-5 FR-5: packages/ltt-kit/package.json files includes *.css", () => {
  const pkg = JSON.parse(readReal(join(PKG, "package.json"), "packages/ltt-kit/package.json"));
  assert.ok(Array.isArray(pkg.files) && pkg.files.includes("*.css"), `files = ${JSON.stringify(pkg.files)}`);
});

test("VO-8 bf761 VO-5 C-9: build kit removes planted zz-stale.css and zz-stale.js and copies the five kit .css byte for byte", { timeout: 60_000 }, () => {
  const planted = ["zz-stale.css", "zz-stale.js"].map((f) => join(PKG, f));
  for (const p of planted) writeFileSync(p, "/* stale */\n");
  let survived;
  try {
    buildKit();
    survived = planted.filter((p) => existsSync(p));
  } finally {
    for (const p of planted) rmSync(p, { force: true });
  }
  assert.deepEqual(survived, [], "stale files survived build kit");
  const noSource = KIT_CSS.filter((f) => !existsSync(join(KIT, f)));
  assert.deepEqual(noSource, [], "kit/ lacks these .css sources");
  const differ = KIT_CSS.filter((f) => !existsSync(join(PKG, f)) || !readFileSync(join(PKG, f)).equals(readFileSync(join(KIT, f))));
  assert.deepEqual(differ, [], "packages/ltt-kit .css missing or not byte-equal to kit/");
});

test("VO-8 bf761 VO-5 C-9: npm pack --dry-run lists the five kit .css files", { timeout: 60_000 }, () => {
  if (!built) buildKit();
  let out;
  try {
    out = execFileSync("npm", ["pack", "--dry-run", "--json"], { cwd: PKG, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    assert.fail(e.code === "ENOENT" ? "npm is not available; npm pack --dry-run could not run" : `npm pack --dry-run exited ${e.status}: ${e.stderr}`);
  }
  const at = out.search(/^\[/m);
  assert.ok(at >= 0, `npm pack printed no JSON array: ${out}`);
  const paths = JSON.parse(out.slice(at))[0].files.map((f) => f.path);
  const missing = KIT_CSS.filter((p) => !paths.includes(p));
  assert.deepEqual(missing, [], `npm pack list lacks ${missing.join(", ")}: ${paths.join(", ")}`);
});

// ---------- spec 1e62814b16984176 VO-5 (FR-2, C-15): audit table rows carry the measured-zoom and full-scene wording ----------

// A row counts for an audit id only when that id is a code span of its first cell; text in other rows never satisfies it.
// One such row holding every token suffices, so an unrelated second table naming the id cannot cause a false failure.
function auditRowError(text, id, tokens, has = (row, t) => row.includes(t)) {
  const hits = lines(text).filter(isRow).filter((r) => codeSpans(firstCell(r)).includes(id));
  if (hits.length === 0) return `${id}: no table row has \`${id}\` in its first cell`;
  if (hits.some((r) => tokens.every((t) => has(r, t)))) return null;
  return hits.map((r) => `${id}: row lacks ${tokens.filter((t) => !has(r, t)).map((t) => JSON.stringify(t)).join(", ")}: ${r}`).join("\n");
}

const DOC_ROWS = [
  { id: "DOC-1", rule: "shrunk", tokens: ["모든 상태", "최소 배율"] },
  { id: "DOC-2", rule: "small-visual", tokens: ["layout을 적지 않은 overview"] },
  { id: "DOC-3", rule: "empty-stage", tokens: ["layout을 적지 않은 overview"] },
];

const fakeAuditTable = (rowsByRule) => ["| 규칙 | 뜻 |", "| --- | --- |", ...Object.entries(rowsByRule).map(([rule, text]) => `| \`${rule}\` | ${text} |`)].join("\n");

test("VO-5 checker: tokens in the shrunk row pass", () => {
  assert.equal(auditRowError(fakeAuditTable({ overflow: "넘침", shrunk: "모든 상태를 그려 잠근 최소 배율로 판정" }), "shrunk", ["모든 상태", "최소 배율"]), null);
});

test("VO-5 checker: tokens only in a neighbouring row fail and name the shrunk row", () => {
  const err = auditRowError(fakeAuditTable({ overflow: "모든 상태의 최소 배율", shrunk: "축소" }), "shrunk", ["모든 상태", "최소 배율"]);
  assert.ok(err && err.includes('row lacks "모든 상태", "최소 배율"') && err.includes("축소"), String(err));
});

test("VO-5 checker: the two tokens split over two rows that both have shrunk in the first cell fail", () => {
  const err = auditRowError(fakeAuditTable({ shrunk: "모든 상태를 그린다" }) + "\n\n" + fakeAuditTable({ shrunk: "최소 배율로 판정" }), "shrunk", ["모든 상태", "최소 배율"]);
  assert.ok(err && err.split("\n").length === 2, String(err));
});

test("VO-5 checker: one of two tokens missing fails naming the missing one", () => {
  const err = auditRowError(fakeAuditTable({ shrunk: "모든 상태를 그려 판정" }), "shrunk", ["모든 상태", "최소 배율"]);
  assert.ok(err && err.includes('"최소 배율"') && !err.includes('"모든 상태"'), String(err));
});

test("VO-5 checker: the id in a non-first cell or outside a table does not count as the row", () => {
  const text = `\`small-visual\`은 layout을 적지 않은 overview도 본다.\n\n${fakeAuditTable({ "empty-stage": "`small-visual`과 같이 layout을 적지 않은 overview" })}`;
  assert.equal(auditRowError(text, "small-visual", ["layout을 적지 않은 overview"]), "small-visual: no table row has `small-visual` in its first cell");
});

test("VO-5 checker: a first cell holding several ids counts for each of them", () => {
  const text = ["| 규칙 | 뜻 |", "| --- | --- |", "| `overflow` · `shrunk` · `hscroll` | 모든 상태를 그린 최소 배율 |"].join("\n");
  assert.equal(auditRowError(text, "shrunk", ["모든 상태", "최소 배율"]), null);
});

for (const { id, rule, tokens } of DOC_ROWS) {
  test(`VO-5 ${id} FR-2 C-15: kit/api/rules.md has a row with \`${rule}\` in the first cell containing ${tokens.join(" and ")}`, () => {
    const err = auditRowError(rulesText(), rule, tokens);
    assert.equal(err, null, err ?? "");
  });
}

// ---------- spec 1e62814b16984176 v2 VO-5 DOC-5 (FR-2(c)): threshold text stays in its base-commit audit row ----------

// A threshold must not be a digit-extended number ("188%", "17단계") or a decimal tail ("0.88%").
const hasThreshold = (row, t) => new RegExp(`(?<![\\d.])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(row);

const THRESHOLD_ROWS = [
  { rule: "shrunk", tokens: ["78%", "88%"], what: "the shrunk row" },
  { rule: "small-visual", tokens: ["10%", "22%"], what: "the small-visual row" },
  { rule: "empty-stage", tokens: ["35%", "60%"], what: "the loose-figure · empty-stage row" },
  { rule: "many-sizes", tokens: ["7단계"], what: "the many-sizes row" },
];

const fakeThresholdTable = (rows) => ["| 규칙 | 뜻 |", "| --- | --- |", ...rows].join("\n");

test("VO-5 DOC-5 checker: thresholds in their own rows pass", () => {
  const text = fakeThresholdTable(["| `overflow`, `shrunk`, `hscroll` | 배율 78% 미만 넘침, 88% 미만 축소 |", "| `small-visual` | 그림 10% 미만, full 장면은 22% 미만 |"]);
  assert.equal(auditRowError(text, "shrunk", ["78%", "88%"], hasThreshold), null);
  assert.equal(auditRowError(text, "small-visual", ["10%", "22%"], hasThreshold), null);
});

test("VO-5 DOC-5 checker: a changed number (88% → 85%) fails naming 88%", () => {
  const err = auditRowError(fakeThresholdTable(["| `overflow`, `shrunk`, `hscroll` | 배율 78% 미만 넘침, 85% 미만 축소 |"]), "shrunk", ["78%", "88%"], hasThreshold);
  assert.ok(err && err.includes('row lacks "88%"') && !err.includes('"78%"'), String(err));
});

test("VO-5 DOC-5 checker: a threshold moved to a neighbouring row fails", () => {
  const err = auditRowError(fakeThresholdTable(["| `small-visual` | 그림 10% 미만 |", "| `loose-figure`, `empty-stage` | 22% 미만, 35%, 60% |"]), "small-visual", ["10%", "22%"], hasThreshold);
  assert.ok(err && err.includes('row lacks "22%"'), String(err));
});

test("VO-5 DOC-5 checker: digit-extended numbers (188%, 17단계, 0.88%) do not count as the threshold", () => {
  assert.notEqual(auditRowError(fakeThresholdTable(["| `shrunk` | 178%, 188% |"]), "shrunk", ["78%", "88%"], hasThreshold), null);
  assert.notEqual(auditRowError(fakeThresholdTable(["| `shrunk` | 0.78%, 0.88% |"]), "shrunk", ["78%", "88%"], hasThreshold), null);
  assert.notEqual(auditRowError(fakeThresholdTable(["| `many-sizes` | 글자 크기 17단계 초과 |"]), "many-sizes", ["7단계"], hasThreshold), null);
});

for (const { rule, tokens, what } of THRESHOLD_ROWS) {
  test(`VO-5 DOC-5 FR-2(c): kit/api/rules.md ${what} (first cell holds \`${rule}\`) keeps ${tokens.join(" and ")}`, () => {
    const err = auditRowError(rulesText(), rule, tokens, hasThreshold);
    assert.equal(err, null, err ?? "");
  });
}

// ---------- plan b71ddee49f77ac06 §1–3: flow docs stay consistent ----------

test("plan §2: the 권고 ids named in SKILL.md §3 are exactly the rules.md rows graded 권고", () => {
  const graded = lines(rulesText()).filter(isRow).filter((r) => (cells(r)[1] ?? "").trim() === "권고").flatMap((r) => codeSpans(firstCell(r)));
  const line = lines(section(skillText(), 3)).find((l) => l.includes("**권고**"));
  assert.ok(line, "SKILL.md §3 has no line naming **권고**");
  const named = codeSpans(line.slice(line.indexOf("**권고**"), line.indexOf("**고침**")));
  assert.deepEqual([...named].sort(), [...graded].sort());
});

test("plan §2: every rules.md row is graded 고침 or 권고", () => {
  const bad = lines(rulesText()).filter(isRow).filter((r) => firstCell(r).trim() !== "rule" && !["고침", "권고"].includes((cells(r)[1] ?? "").trim()));
  assert.deepEqual(bad, []);
});

test("plan §3: the kit/API.md lesson example is valid JavaScript", () => {
  const block = apiText().match(/^```js\n([\s\S]*?)^```/m);
  assert.ok(block, "kit/API.md has no ```js example");
  assert.doesNotThrow(() => new vm.Script(block[1]));
});
