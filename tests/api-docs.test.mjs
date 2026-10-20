import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { ADVISE, AUDIT_TRIGGERS, BASE_M, LINT_TRIGGERS } from "./fixtures/absorb/severity-cases.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SKILL = join(ROOT, "skills/learn-to-tell");
const KIT = join(SKILL, "kit");
const API_DIR = join(KIT, "api");
const PKG = join(ROOT, "packages/ltt-kit");

const PART_DOCS = ["base", "ui", "mock", "diagram", "sequence", "map", "controls", "charts"];
const API_FILES = [...PART_DOCS, "deck-contracts", "internals", "rules"].map((f) => `${f}.md`);
const P2_PARTS = ["ui", "mock", "diagram", "sequence", "map", "controls", "charts"];
// What SKILL.md §3 step 1 has the agent read before writing, measured at 9c67b3b (2026-10-20). One budget over the whole
// read set replaced per-file caps: those forced every fix to compress a neighbouring sentence, and the compression left
// contradictory stop rules in §3.
const READ_SET_LIMIT = 44990;
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

function readSetError(fixed, parts, limit) {
  const top = Object.entries(parts).map(([name, text]) => [name, cp(text)]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const sized = [...Object.entries(fixed).map(([name, text]) => [name, cp(text)]), ...top];
  const total = sized.reduce((s, [, n]) => s + n, 0);
  if (total <= limit) return null;
  return `read set: ${sized.map(([f, n]) => `${f} ${n}`).join(" + ")} = ${total} code points > limit ${limit}`;
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
  "kit/API.md": "theme, themes, palette, mark, marks, icon, icons, expect, record, lintDeck, math, MOTION_MS, deck, motion",
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
// Spec 6cc24f891a69c407 v1 Signatures/FR-18: plus motion (LTT.motion, defined in kit/API.md) = 76.
test("VO-2 oracle table lists 76 distinct names: the base 74 plus placement and motion", () => {
  const all = Object.values(BASE_DEFINITIONS).flatMap((s) => s.split(", "));
  assert.equal(new Set(all).size, 76);
  assert.equal(all.length, 76);
  assert.equal(all.filter((n) => n !== "placement" && n !== "motion").length, 74);
});

test("VO-2 FR-3 QR-2: the runtime LTT public names are exactly the 76 oracle names", () => {
  const expected = Object.values(BASE_DEFINITIONS).flatMap((s) => s.split(", ")).sort();
  const names = Object.keys(loadLTT()).sort();
  const missing = expected.filter((n) => !names.includes(n));
  const extra = names.filter((n) => !expected.includes(n));
  assert.deepEqual({ missing, extra }, { missing: [], extra: [] }, `runtime LTT differs from the oracle: missing [${missing.join(", ")}], extra [${extra.join(", ")}]`);
  assert.equal(names.length, 76);
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

// ---------- read-set size ----------

const pad = (n) => "😀".repeat(100) + "가".repeat(4000) + "a".repeat(n - 4100);
const fixedSet = (skill) => ({ "SKILL.md": pad(skill), "kit/API.md": pad(11000), "look/look.md": pad(6000), "kit/api/deck-contracts.md": pad(8000) });
const fakeParts = { ui: pad(4200), mock: pad(4200), diagram: pad(4300), sequence: pad(4200), map: pad(4200), controls: pad(4400), charts: pad(4100) };

test("read set: the four fixed docs plus the three largest parts at the limit pass", () => {
  assert.equal(readSetError(fixedSet(READ_SET_LIMIT - 11000 - 6000 - 8000 - 4400 - 4300 - 4200), fakeParts, READ_SET_LIMIT), null);
});

test("read set: one code point over fails naming every counted doc, the sum and the limit", () => {
  const err = readSetError(fixedSet(READ_SET_LIMIT - 11000 - 6000 - 8000 - 4400 - 4300 - 4200 + 1), fakeParts, READ_SET_LIMIT);
  assert.ok(err, "one over passed");
  assert.ok(err.includes(String(READ_SET_LIMIT + 1)) && err.includes(String(READ_SET_LIMIT)) && err.includes("controls") && err.includes("diagram") && err.includes("deck-contracts"), err);
  assert.equal(err.includes("charts"), false, err);
});

test("read set: SKILL.md, API.md, look.md, deck-contracts.md and the three largest part docs stay within the budget", () => {
  const fixed = {
    "SKILL.md": skillText(),
    "kit/API.md": apiText(),
    "look/look.md": readReal(join(SKILL, "look/look.md"), "look/look.md"),
    "kit/api/deck-contracts.md": apiDoc("deck-contracts.md"),
  };
  const parts = Object.fromEntries(P2_PARTS.map((p) => [p, apiDoc(`${p}.md`)]));
  const err = readSetError(fixed, parts, READ_SET_LIMIT);
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

const LINT_IDS = ["unknown-term", "used-before-defined", "predict-new-term", "no-reading-guide", "no-title", "overview-missing", "overview-order", "overview-no-visual", "keywords-last", "unused-term", "term-no-visual", "summary-no-recall", "card-monotony", "no-signature", "no-theme", "unknown-theme", "filler-content", "icon-not-string"];
const AUDIT_IDS = ["overflow", "shrunk", "small-visual", "loose-figure", "empty-stage", "many-sizes", "hscroll", "graph-overlap", "panel-overlap", "goal-unreachable", "goal-narrow", "goal-at-start", "still-visual", "text-overlap", "unknown-icon"];

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

test("VO-4 part paths: kit/API.md names the nine kit/api docs and not internals.md", () => {
  const text = apiText();
  const missing = [...PART_DOCS, "deck-contracts"].map((f) => `kit/api/${f}.md`).filter((p) => !text.includes(p));
  assert.deepEqual(missing, [], `kit/API.md lacks ${missing.join(", ")}`);
  assert.equal(text.includes("internals.md"), false, "kit/API.md mentions internals.md");
});

test("VO-4 kit/api holds the ten split docs", () => {
  assert.ok(existsSync(API_DIR), `kit/api/ directory is missing: ${API_DIR}`);
  const have = new Set(readdirSync(API_DIR));
  const missing = API_FILES.filter((f) => !have.has(f));
  assert.deepEqual(missing, [], `kit/api lacks ${missing.join(", ")}`);
});

// ---------- VO-6 SKILL.md ----------

test("VO-6 FR-7 §3 read line: one line names the whole read set, kit/API.md, deck-contracts.md, look.md and kit/api/<part>.md", () => {
  const err = tokenLineError(section(skillText(), 3), "FR-7 §3 read line", ["kit/API.md", "kit/api/deck-contracts.md", "look/look.md", "kit/api/<part>.md", "만 읽는다"]);
  assert.equal(err, null, err);
});

// The §3 fix sequence lives only in SKILL.md prose, so these tests rebuild it from the numbered steps: an agent that
// finds something to fix at every chance follows the steps in order, and the trace must end on an audit.
const ACTIONS = [["audit", /audit\.mjs|audit을[^.]{0,12}(돌|실행)/g], ["view", /Read/g], ["edit", /Edit 묶음/g]];

function fixSteps(s3) {
  const steps = lines(s3).filter((l) => /^\d+\. /.test(l));
  const first = steps.findIndex((l) => /audit\.mjs/.test(l));
  const server = steps.findIndex((l) => l.includes("server.mjs"));
  return steps.slice(first, server < 0 ? undefined : server);
}

function fixTrace(steps) {
  return steps.flatMap((l) => ACTIONS.flatMap(([name, re]) => [...l.matchAll(re)].map((m) => [m.index, name])).sort((a, b) => a[0] - b[0]).map(([, n]) => n));
}

test("SKILL §3 fix sequence: at most 3 audits, the sheet is read before the last audit, and no Edit follows the last audit", () => {
  const steps = fixSteps(section(skillText(), 3));
  const trace = fixTrace(steps);
  assert.ok(trace.filter((a) => a === "audit").length <= 3, `more than 3 audits: ${trace.join(" → ")}`);
  assert.equal(trace.at(-1), "audit", `the last Edit has no audit after it: ${trace.join(" → ")}`);
  assert.ok(trace.indexOf("view") >= 0 && trace.indexOf("view") < trace.lastIndexOf("audit"), `no sheet view before the last audit: ${trace.join(" → ")}`);
  assert.ok(steps.some((l) => l.includes("뒤에는 Edit하지 않는다")), "no step says the last audit is final");
});

test("SKILL §3 fix sequence replay: a fourth audit, a trailing Edit or a missing view is caught", () => {
  const ok = ["5. `audit.mjs`를 실행한다.", "6. Edit 묶음으로 반영한다.", "7. audit을 다시 돌리고 sheet를 Read한다.", "8. Edit 묶음으로 고치고 audit을 한 번 더 돌린다."];
  assert.deepEqual(fixTrace(ok), ["audit", "edit", "audit", "view", "edit", "audit"]);
  assert.equal(fixTrace([...ok, "9. Edit 묶음으로 고치고 audit을 또 돌린다."]).filter((a) => a === "audit").length, 4);
  assert.equal(fixTrace([...ok, "9. Edit 묶음으로 고친다."]).at(-1), "edit");
  assert.equal(fixTrace(ok.map((l) => l.replace(" sheet를 Read한다", ""))).includes("view"), false);
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
  const line = lines(section(skillText(), 3)).find((l) => l.includes("**권고**는"));
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

// ---------- spec 6cc24f891a69c407 v1 VO-13 (FR-18, QR-6): motion documentation (syntax) ----------

const rowsWithFirstSpan = (text, pred) => lines(text).filter(isRow).filter((r) => codeSpans(firstCell(r)).some(pred));

test("VO-13 D1: kit/API.md has a table row whose first cell holds LTT.motion", () => {
  const rows = rowsWithFirstSpan(apiText(), (s) => /LTT\.motion\b/.test(s));
  assert.ok(rows.length >= 1, "no first-cell LTT.motion row in kit/API.md");
});

for (const [id, tokens] of [["D3 loop", ["loop"]], ["D4 bind", ["bind"]], ["D6 attract", ["attract"]], ["D7 beats", ["data-ltt-beats", "beats"]]]) {
  test(`VO-13 ${id}: kit/api/deck-contracts.md documents ${tokens.join(" and ")}`, () => {
    const text = apiDoc("deck-contracts.md");
    const missing = tokens.filter((t) => !text.includes(t));
    assert.deepEqual(missing, [], `deck-contracts.md lacks ${missing.join(", ")}`);
  });
}

// Rewritten for spec 5ad829b7137b4d19 (FR-11, C-23): D5 used to require the token `autoplay`; the field is gone and the contract is the auto-play
// and hold rule, so the token is now forbidden and the rule's own words are required.
test("VO-13 D5 (rewritten): kit/api/deck-contracts.md documents steps auto-play and the 1800ms hold floor, and no longer names autoplay", () => {
  const text = apiDoc("deck-contracts.md");
  assert.equal(text.includes("autoplay"), false, "deck-contracts.md still names autoplay");
  const missing = ["자동", "1800", "hold"].filter((t) => !text.includes(t));
  assert.deepEqual(missing, [], `deck-contracts.md lacks ${missing.join(", ")}`);
});

test("VO-13 D8: kit/api/rules.md has a still-visual row graded 권고, and lists 15 audit ids", () => {
  const rows = rowsWithFirstSpan(rulesText(), (s) => s === "still-visual");
  assert.equal(rows.length, 1, "expected exactly one rules.md row with `still-visual` in the first cell");
  assert.equal((cells(rows[0])[1] ?? "").trim(), "권고");
  assert.equal(AUDIT_IDS.length, 15);
});

test("VO-13 D9: kit/api/charts.md documents axisPlot set(id, points) point format", () => {
  const ok = lines(apiDoc("charts.md")).some((l) => l.includes("set(") && l.includes("points"));
  assert.ok(ok, "charts.md has no line with set( and points");
});

test("VO-13 D10: kit/api/charts.md documents hbars ticks and tickFormat", () => {
  const ok = lines(apiDoc("charts.md")).some((l) => l.includes("hbars") && l.includes("ticks") && l.includes("tickFormat"))
    || rowsWithFirstSpan(apiDoc("charts.md"), (s) => s.includes("hbars")).some((r) => r.includes("ticks") && r.includes("tickFormat"));
  assert.ok(ok, "charts.md has no hbars line naming ticks and tickFormat");
});

test("VO-13 D11: compare form \"table\" head and cols format is documented in kit/API.md or deck-contracts.md", () => {
  const ok = [apiText(), apiDoc("deck-contracts.md")].some((t) => lines(t).some((l) => l.includes("table") && l.includes("head") && l.includes("cols")));
  assert.ok(ok, "no line names table, head and cols");
});

test("VO-13 D12: kit/CHANGELOG.md mentions LTT.motion", () => {
  assert.ok(readReal(join(KIT, "CHANGELOG.md"), "kit/CHANGELOG.md").includes("LTT.motion"));
});

// catalog anchors get their id from group(title, "<id>") and demo("<id>", ...) at runtime, so a static id="motion" and the demo call both count.
test("VO-13 D13: catalog.html defines the #motion demo anchor exactly once", () => {
  const html = readReal(join(ROOT, "site/gallery/catalog.html"), "site/gallery/catalog.html");
  const n = (html.match(/demo\(\s*["']motion["']/g) ?? []).length + (html.match(/id=["']motion["']/g) ?? []).length
    + (html.match(/group\([^()]*,\s*["']motion["']\s*\)/g) ?? []).length;
  assert.equal(n, 1, `#motion anchor defined ${n} times`);
});

// ---------- spec 2d467cf453771b95 VO-9: motion verbs documentation (syntax checks on document strings) ----------

const MOTION_VERBS = ["draw", "flow", "camera", "morph", "stack"];
const verbMentioned = (text, verb) => new RegExp(`(^|[^A-Za-z])${verb}([^A-Za-z]|$)`).test(text);
const motionRows = () => lines(apiText()).filter((l) => isRow(l) && firstCell(l).includes("LTT.motion"));

test("VO-9 FR-11: the LTT.motion rows of kit/API.md mention play", () => {
  const rows = motionRows();
  assert.ok(rows.length >= 1, "no LTT.motion row in kit/API.md");
  // The pre-existing loop row already says {stop, play, running}, so require the new call form with its beats argument.
  assert.ok(rows.some((r) => /play\([^)]*(t:\s*\[|beats)/.test(r)), "no LTT.motion row shows a play( call with a beats argument");
});

test("VO-9 FR-11: the motion rule line of kit/API.md names the five verbs draw, flow, camera, morph, stack", () => {
  const rule = lines(apiText()).filter((l) => l.includes("기본으로 움직인다"));
  assert.equal(rule.length, 1, `lines holding "기본으로 움직인다": ${rule.length}`);
  const missing = MOTION_VERBS.filter((v) => !verbMentioned(rule[0], v));
  assert.deepEqual(missing, [], `verbs missing on the motion rule line: ${missing}`);
});

// Clauses are checked inside the play subsection only: the file already had a 비트 노출 heading and loop text before play existed.
const playSection = () => {
  const ls = lines(apiDoc("deck-contracts.md")), i = ls.findIndex((l) => /^###\s+`play`/.test(l));
  assert.ok(i >= 0, "no ### `play` subsection in deck-contracts.md");
  let j = i + 1;
  while (j < ls.length && !/^#{1,3}\s/.test(ls[j])) j++;
  return ls.slice(i, j).join("\n");
};

test("VO-9 FR-11: the deck-contracts play subsection documents LTT.motion.play and the five verbs", () => {
  const t = playSection();
  assert.ok(t.includes("LTT.motion.play"), "no LTT.motion.play");
  const missing = MOTION_VERBS.filter((v) => !verbMentioned(t, v));
  assert.deepEqual(missing, [], `verbs missing: ${missing}`);
});

test("VO-9 FR-11: the play subsection has the target-resolution clause (diagram ids, \"from>to\", axisPlot series, CSS selector)", () => {
  const t = playSection();
  for (const needle of ["from>to", "LTT.axisPlot", "CSS 선택자"]) assert.ok(t.includes(needle), `no "${needle}"`);
});

test("VO-9 FR-11: the play subsection has the state-rule clause (period restart, p = 0 before a beat, p = 1 after)", () => {
  const t = playSection();
  assert.ok(/p\s*=\s*0/.test(t) && /p\s*=\s*1/.test(t), "no p = 0 / p = 1 state statement");
  assert.ok(/주기가 다시 시작/.test(t), "no statement about the period restarting");
});

test("VO-9 FR-11: the play subsection has the beat-exposure clause (data-ltt-beats, period − 1)", () => {
  const t = playSection();
  assert.ok(t.includes("비트 노출") && t.includes("data-ltt-beats") && /period\s*[-−]\s*1/.test(t), "no beat exposure with data-ltt-beats and period − 1");
});

test("VO-9 FR-10: the beforeAfter row of kit/api/ui.md documents ms", () => {
  const row = lines(apiDoc("ui.md")).find((l) => isRow(l) && firstCell(l).includes("LTT.beforeAfter"));
  assert.ok(row, "no LTT.beforeAfter row in kit/api/ui.md");
  assert.ok(/(^|[^A-Za-z])ms([^A-Za-z]|$)/.test(row), "the beforeAfter row does not mention ms");
  assert.ok(/없으면\s*0/.test(row), "the row does not state 0 for no markers");
  assert.ok(row.includes("700") && row.includes("140"), "the row does not state the constants 700 and 140");
});

test("VO-9 FR-11: kit/CHANGELOG.md mentions LTT.motion.play", () => {
  assert.ok(readReal(join(KIT, "CHANGELOG.md"), "kit/CHANGELOG.md").includes("LTT.motion.play"));
});

for (const id of ["motion-draw", "motion-flow", "motion-camera", "motion-morph", "motion-stack"]) {
  test(`VO-9 FR-11: catalog.html defines the ${id} verb demo exactly once`, () => {
    const html = readReal(join(ROOT, "site/gallery/catalog.html"), "site/gallery/catalog.html");
    const n = (html.match(new RegExp(`demo\\(\\s*["']${id}["']`, "g")) ?? []).length + (html.match(new RegExp(`id=["']${id}["']`, "g")) ?? []).length
      + (html.match(new RegExp(`group\\([^()]*,\\s*["']${id}["']\\s*\\)`, "g")) ?? []).length;
    assert.equal(n, 1, `${id} defined ${n} times`);
  });
}

// ---------- spec 84c07bf1dc6566cb v1 VO-6 (FR-8, FR-9, QR-4): icon-not-string documentation ----------

test("84c0 VO-6 D-1: kit/api/rules.md has exactly one icon-not-string row graded 고침 whose meaning names art and icon", () => {
  const rows = rowsWithFirstSpan(rulesText(), (s) => s === "icon-not-string");
  assert.equal(rows.length, 1, "expected exactly one rules.md row with `icon-not-string` in the first cell");
  const c = cells(rows[0]);
  assert.equal((c[1] ?? "").trim(), "고침");
  const meaning = c.slice(2).join(" | ");
  assert.ok(meaning.includes("art") && meaning.includes("icon"), `meaning lacks art/icon: ${meaning}`);
});

test("84c0 VO-6 D-2: kit/CHANGELOG.md ## 1.0.0 section has a line naming icon-not-string", () => {
  const s = section(readReal(join(KIT, "CHANGELOG.md"), "kit/CHANGELOG.md"), "1\\.0\\.0");
  assert.ok(lines(s).some((l) => l.includes("icon-not-string")), "no icon-not-string line under ## 1.0.0");
});

test("84c0 VO-6 D-3: LINT_IDS lists icon-not-string", () => {
  assert.ok(LINT_IDS.includes("icon-not-string"));
});

// ---------- spec 37a2365a466d3e8b v1 VO-8 / QR-7: the advisory list lives in three places ----------

// The Signature fixes the advisory ids; SKILL.md §3's **권고** line, the 등급 column of kit/api/rules.md and the severity the kit emits must all equal it.
const adviseFromSkill = () => {
  const line = lines(skillText()).find((l) => l.includes("**권고**는"));
  assert.ok(line, "SKILL.md has no line with **권고**는");
  return new Set(codeSpans(line.split("**권고**는")[1].split("**고침**")[0]));
};
const adviseFromRules = () => new Set(lines(rulesText()).filter(isRow).filter((r) => (cells(r)[1] ?? "").trim() === "권고").flatMap((r) => codeSpans(firstCell(r))));

test("VO-8 QR-7 SKILL.md §3 **권고** list equals the spec's ten advisory ids", () => {
  assert.deepEqual([...adviseFromSkill()].sort(), [...ADVISE].sort());
});

test("VO-8 QR-7 kit/api/rules.md rows graded 권고 are exactly the same ten ids", () => {
  assert.deepEqual([...adviseFromRules()].sort(), [...ADVISE].sort());
});

test("VO-8 QR-7 every other audit and lint id has a rules.md row graded 고침", () => {
  const graded = new Map();
  for (const r of lines(rulesText()).filter(isRow)) for (const span of codeSpans(firstCell(r))) graded.set(span, (cells(r)[1] ?? "").trim());
  const wrong = [...AUDIT_IDS, ...LINT_IDS].filter((id) => !ADVISE.includes(id)).filter((id) => graded.get(id) !== "고침");
  assert.deepEqual(wrong, [], `ids whose rules.md grade is not 고침: ${wrong.map((id) => `${id}=${graded.get(id)}`).join(", ")}`);
});

test("VO-8 QR-7 the severity the kit emits (audit and lint triggers) gives the same advisory set as SKILL.md and rules.md", () => {
  const LTT = loadLTT();
  const emitted = new Map();
  for (const extra of Object.values(AUDIT_TRIGGERS)) for (const w of LTT.auditScene({ ...BASE_M, ...extra })) emitted.set(w.rule, w.severity);
  for (const build of Object.values(LINT_TRIGGERS)) for (const w of LTT.lintDeck(build())) emitted.set(w.rule, w.severity);
  const kitAdvise = new Set([...emitted].filter(([, sev]) => sev === "advise").map(([rule]) => rule));
  // still-visual needs a rendered scene (observed in tests/absorb.test.mjs); the other nine are produced by the pure triggers.
  const want = new Set([...adviseFromSkill()].filter((id) => id !== "still-visual"));
  assert.deepEqual([...kitAdvise].sort(), [...want].sort());
  assert.deepEqual([...adviseFromRules()].filter((id) => id !== "still-visual").sort(), [...kitAdvise].sort());
  for (const id of [...AUDIT_IDS, ...LINT_IDS].filter((i) => i !== "still-visual")) assert.ok(emitted.has(id), `no trigger emitted ${id}`);
});

// ---------- spec 5ad829b7137b4d19 v1 VO-DOCS (syntax testing; FR-10..FR-12, FR-14, FR-15, C-23, QR-7) ----------

const allAuthorDocs = () => {
  const docs = { "kit/API.md": apiText(), "SKILL.md": skillText(), "look/look.md": readReal(join(SKILL, "look/look.md"), "look/look.md") };
  for (const f of readdirSync(API_DIR).filter((x) => x.endsWith(".md")).sort()) docs[`kit/api/${f}`] = apiDoc(f);
  return docs;
};
const hits = (needle) => Object.entries(allAuthorDocs()).filter(([, t]) => (typeof needle === "string" ? t.includes(needle) : needle.test(t))).map(([f]) => f);

// Forbidden tokens: every author doc, a superset of the declared files (API.md, deck-contracts, controls, diagram, sequence, rules, SKILL.md).
for (const [id, needle] of [
  ["autoplay field name", "autoplay"],
  ["'한 번 재생 후 멈춤' (the once exception sentence)", "한 번 재생 후 멈춤"],
  ["'한 번 재생하고 멈…' (stop after one play)", /한 번 재생하고 멈/],
  ["'되도록 `once`로' (recommending once)", /되도록\s*`?once`?로/],
  ["'가능하면 `once`' (recommending once)", /가능하면\s*(한 번\s*)?`?once`?/],
  ["'단독으로는 자동 재생하지 않는다'", "단독으로는 자동 재생하지 않는다"],
  ["play(true) (stop at the last step)", "play(true)"],
]) {
  test(`VO-DOCS C-23 forbidden: no author doc contains ${id}`, () => {
    assert.deepEqual(hits(needle), [], `${id} still in: ${hits(needle).join(", ")}`);
  });
}

test('VO-DOCS C-23 forbidden: the quoted step mode "once" is in none of API.md, deck-contracts.md, controls.md, diagram.md, sequence.md', () => {
  const bad = ["kit/API.md", "kit/api/deck-contracts.md", "kit/api/controls.md", "kit/api/diagram.md", "kit/api/sequence.md"].filter((f) => allAuthorDocs()[f].includes('"once"'));
  assert.deepEqual(bad, []);
});

test("VO-DOCS FR-10: the API.md scene-field row for figure lists no autoplay and the 'figure moves by default' paragraph has no once exception", () => {
  const api = apiText();
  const row = lines(api).filter(isRow).find((r) => codeSpans(firstCell(r)).includes("figure"));
  assert.ok(row, "no scene field row for figure");
  assert.equal(row.includes("autoplay"), false);
  const para = lines(api).find((l) => l.includes("기본으로 움직인다"));
  assert.ok(para, 'no line saying "기본으로 움직인다"');
  assert.equal(/once|멈춤/.test(para), false, `the paragraph still carries the stop-after-one-play exception: ${para}`);
});

// API.md composition snippet figure example: the steps array of the scene whose `steps:` follows `figure:`.
function figureExampleSteps(text) {
  const block = text.match(/^```js\n([\s\S]*?)^```/m);
  assert.ok(block, "kit/API.md has no ```js example");
  const src = block[1];
  const at = src.search(/figure:\s*\w+,\s*\n?\s*steps:\s*\[/);
  assert.ok(at >= 0, "the example has no figure scene with steps");
  const open = src.indexOf("[", src.indexOf("steps:", at));
  let depth = 0, end = open;
  for (; end < src.length; end++) { if (src[end] === "[") depth++; else if (src[end] === "]" && --depth === 0) break; }
  const body = src.slice(open + 1, end);
  const nodeIds = [...src.matchAll(/\{\s*id:\s*"([^"]+)",\s*c:/g)].map((m) => m[1]);
  const steps = body.split(/(?=\{\s*caption:)/).filter((c) => /caption:/.test(c)).map((c) => ({
    text: c, ids: [...(c.match(/highlight\(\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]) }));
  return { steps, nodeIds };
}

test("VO-DOCS FR-10 C-23: the API.md composition figure example has at least three steps", () => {
  assert.ok(figureExampleSteps(apiText()).steps.length >= 3);
});

test("VO-DOCS FR-10: each API.md example step highlights a node no earlier step highlighted, and the lists do not repeat earlier nodes", () => {
  const { steps, nodeIds } = figureExampleSteps(apiText());
  const seen = new Set();
  steps.forEach((st, i) => {
    assert.ok(st.ids.length >= 1, `step ${i + 1} calls no highlight([...])`);
    for (const id of st.ids) {
      assert.ok(nodeIds.includes(id), `step ${i + 1} highlights ${id}, which the example diagram does not define (${nodeIds})`);
      assert.equal(seen.has(id), false, `step ${i + 1} lists ${id} again: the earlier node should stay out of the list`);
      seen.add(id);
    }
  });
});

test("VO-DOCS FR-12 v3: the controls.md LTT.stepper row states auto-play, cycling back, stopping, the repeat button, and points to deck-contracts.md for the formula and reduced motion", () => {
  const row = lines(apiDoc("controls.md")).filter(isRow).find((r) => codeSpans(firstCell(r)).some((s) => s.startsWith("LTT.stepper")));
  assert.ok(row, "no LTT.stepper row");
  const need = [["자동 재생", /자동 재생/], ["cycles back to the first step", /(처음|0)(으)?로 돌아/], ["stops when previous/next is pressed", /멈/], ["반복 재생 button", /반복 재생/],
    ["hold and interval", /hold[\s\S]*interval|interval[\s\S]*hold|hold/], ["reference to deck-contracts.md", /deck-contracts\.md/], ["reduced motion", /reduced-motion|동작 줄이기/]];
  const missing = need.filter(([, re]) => !re.test(row)).map(([n]) => n);
  assert.deepEqual(missing, [], `LTT.stepper row lacks: ${missing.join("; ")}`);
});

// The formula lives only in deck-contracts.md (FR-12 v3).
const FORMULA = /1000\s*\+\s*100|100\s*[×x*]\s*n|max\(\s*1800/;
for (const [file, pick] of [["controls.md", (r) => codeSpans(firstCell(r)).some((s) => s.startsWith("LTT.stepper"))], ["diagram.md", (r) => /\.player\(/.test(r)], ["sequence.md", (r) => /\.player\(/.test(r)]]) {
  test(`VO-DOCS FR-12 v3: the ${file} stepper/player row does not repeat the hold formula`, () => {
    const row = lines(apiDoc(file)).filter(isRow).find(pick);
    assert.ok(row, `no row in ${file}`);
    assert.equal(FORMULA.test(row), false, `formula in ${file} row: ${row}`);
  });
}

test("VO-DOCS FR-4 A-6: deck-contracts.md states the hold is a lower bound for hold/interval and counts code points", () => {
  const text = apiDoc("deck-contracts.md");
  assert.ok(/하한보다 길 때만/.test(text) || /max\(\s*hold[^)]*,/.test(text), "no 'only when longer than the floor' / max(hold …, …) form");
  assert.ok(/code point/.test(text), "no 'code point'");
});

for (const [file, withAccum] of [["diagram.md", true], ["sequence.md", false]]) {
  test(`VO-DOCS FR-12: the ${file} player row mentions auto-play${withAccum ? " and cumulative reveal (누적 공개)" : " and no cumulative reveal"}`, () => {
    // sequence.md has no row of its own for player (it sits in the LTT.sequence row), so any row that shows `.player(` counts.
    const row = lines(apiDoc(file)).filter(isRow).find((r) => /\.player\(/.test(r));
    assert.ok(row, `no row showing .player( in ${file}`);
    assert.ok(row.includes("자동 재생"), "no 자동 재생");
    assert.equal(row.includes("누적 공개"), withAccum);
  });
}

test("VO-DOCS FR-11 C-23: deck-contracts.md has the hold formula, cumulative reveal, reduced motion and still, and the old '### figure autoplay' heading is gone", () => {
  const text = apiDoc("deck-contracts.md");
  assert.equal(/^#{2,4}\s.*autoplay/m.test(text), false);
  const need = [["1800", /1800/], ["1000 + 100", /1000\s*\+\s*100/], ["누적 공개", /누적 공개/], ["reduced-motion", /prefers-reduced-motion/], ["still", /`still`/], ["반복 재생", /반복 재생/]];
  const missing = need.filter(([, re]) => !re.test(text)).map(([n]) => n);
  assert.deepEqual(missing, [], `deck-contracts.md lacks: ${missing.join("; ")}`);
});

test("VO-DOCS FR-11: the deck-contracts.md first line (언제:) no longer lists autoplay but still names figure steps", () => {
  const first = lines(apiDoc("deck-contracts.md")).find((l) => l.trim() !== "") ?? "";
  assert.ok(first.startsWith("언제:"), first);
  assert.equal(first.includes("autoplay"), false);
  assert.ok(first.includes("steps"));
});

// The six checklist lines (FR-11): (1) order follows time/causality (2) one event per step, earlier steps stay (3) what is made shows where it goes
// (4) what recurs is drawn as a loop (5) the caption names what moves now (6) what does not change over time does not move (still).
const CHECKLIST = [[/시간/, /인과/], [/사건 하나/, /앞 단계/], [/어디로/], [/고리/], [/자막/, /이름/], [/변하지 않/, /still/]];
test("VO-DOCS FR-11 C-23: deck-contracts.md steps section carries the 6-line 움직이는 그림 체크리스트 with each item's key words, in order", () => {
  const ls = lines(apiDoc("deck-contracts.md"));
  const head = ls.findIndex((l) => l.includes("움직이는 그림 체크리스트"));
  assert.ok(head >= 0, "no 움직이는 그림 체크리스트");
  const items = [];
  for (let i = head + 1; i < ls.length; i++) {
    if (/^#{1,6}\s/.test(ls[i])) break;
    if (ls[i].trim() === "") { if (items.length) break; else continue; }
    items.push(ls[i]);
  }
  assert.equal(items.length, 6, `checklist items:\n${items.join("\n")}`);
  items.forEach((it, i) => CHECKLIST[i].forEach((re) => assert.ok(re.test(it), `item ${i + 1} lacks ${re}: ${it}`)));
  const steps = ls.map((l, i) => [l, i]).filter(([l]) => /^###\s.*steps/.test(l)).map(([, i]) => i);
  assert.ok(steps.length >= 1, "no ### steps heading");
  const nextHead = ls.findIndex((l, i) => i > steps[0] && /^#{1,3}\s/.test(l));
  assert.ok(head > steps[0] && (nextHead < 0 || head < nextHead), "the checklist is not inside the ### steps section");
});

test("VO-DOCS FR-14 C-23: SKILL.md §3 step 2 asks for a 흐름 line per steps scene, and review request (1) checks the step flow and where made things go", () => {
  const s3 = section(skillText(), 3);
  const outline = lines(s3).find((l) => l.includes("outline.md") && l.includes("기대 화면"));
  assert.ok(outline, "no outline step line");
  for (const t of ["`steps`", "흐름:", "①", "→", "처음 나오는 것", "어디로 가는지"]) assert.ok(outline.includes(t), `outline line lacks ${t}`);
  const review = lines(skillText()).find((l) => l.includes("검토 서브에이전트") && l.includes("(1)"));
  assert.ok(review, "no review request line");
  const one = review.slice(review.indexOf("(1)"), review.indexOf("(2)"));
  assert.ok(one.length > 0, "no (1)…(2) clause");
  for (const t of ["단계 흐름", "절차·인과", "만들어진 것", "어디로 가는지"]) assert.ok(one.includes(t), `review request (1) lacks ${t}`);
});

// ---------- spec 5ad829b7137b4d19 v1 VO-GAL (FR-16, C-24): the catalog demo ----------

test("VO-GAL FR-16: catalog.html keeps the figure-autoplay demo id and has no autoplay variants", () => {
  const html = readReal(join(ROOT, "site/gallery/catalog.html"), "site/gallery/catalog.html");
  assert.equal((html.match(/demo\(\s*"figure-autoplay"/g) ?? []).length, 1, 'expected exactly one demo("figure-autoplay", ...)');
  assert.equal(/autoplay\s*:/.test(html), false, "catalog.html still has an `autoplay:` variant");
});

test("VO-GAL UI-2: no gallery page sets an autoplay field", () => {
  const pagesDir = join(ROOT, "site/gallery");
  const files = readdirSync(pagesDir, { recursive: true }).map((f) => String(f).split("\\").join("/")).filter((f) => f.endsWith(".html") && !f.startsWith("stale"));
  assert.ok(files.length >= 14, `only ${files.length} gallery pages found`);
  const bad = files.filter((f) => /autoplay\s*:/.test(readFileSync(join(pagesDir, f), "utf8")));
  assert.deepEqual(bad, []);
});
