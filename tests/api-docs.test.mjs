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
  "kit/API.md": "theme, themes, palette, mark, marks, icon, icons, expect, record, lintDeck, math, MOTION_MS, deck, check, clock",
  "kit/api/base.md": "themeTokens, summaryCards, linkTerms, warn",
  "kit/api/ui.md": "narration, annotate, beforeAfter, facts, chips, badge, callout, swatches, takeaway, chartFrame, inspector, redline, h, fill, contrast, recall",
  "kit/api/mock.md": "mock",
  "kit/api/diagram.md": "diagram, graphOverlaps, diagramLayout, autoLayout, state, stateSpec",
  "kit/api/sequence.md": "sequence, sequenceLayout",
  "kit/api/map.md": "map",
  "kit/api/controls.md": "sweep, drag, predict, stepper, sim, tween",
  "kit/api/charts.md": "axisPlot, hbars, lanes, sankey, plot, plotTheme, plane, units, bar",
  "kit/api/internals.md": "kitBase, lessonId, compare, termsIn, sceneText, termIndex, rectHit, freeSlot, stepValues, goalReach, setGlossary, mobile, measure, $, deckTypes, sceneTypes, placement, termIssues, goalIssues, deckIssues, checkSource",
};

// Spec 74cb05d7da21907e v1 FR-3: the base 74 public names plus placement (defined by ltt-deck.js, documented in internals.md) = 75.
// Spec 76b739afacf5b868 FR-14/FR-16: auditScene is gone and LTT.clock joins kit/API.md (net 81 again).
// Spec 80a1b2f18f50b1df FR-15: plus check (API.md), recall (ui.md), termIssues, goalIssues, deckIssues, checkSource (internals.md) = 81.
const CHECK_NAMES = ["check", "recall", "termIssues", "goalIssues", "deckIssues", "checkSource"];
test("VO-2 oracle table lists 81 distinct names: the base 74 (auditScene out, clock in) plus placement plus the 6 check names", () => {
  const all = Object.values(BASE_DEFINITIONS).flatMap((s) => s.split(", "));
  assert.equal(new Set(all).size, 81);
  assert.equal(all.length, 81);
  assert.equal(all.filter((n) => n !== "placement" && !CHECK_NAMES.includes(n)).length, 74);
});

test("VO-11 FR-15: each new check name is defined in exactly its declared doc file", () => {
  const where = { check: "kit/API.md", recall: "kit/api/ui.md", termIssues: "kit/api/internals.md", goalIssues: "kit/api/internals.md", deckIssues: "kit/api/internals.md", checkSource: "kit/api/internals.md" };
  const defs = definitions(realDocs());
  const wrong = Object.entries(where).flatMap(([name, file]) => {
    const files = [...(defs.get(name) ?? [])].sort();
    return files.length === 1 && files[0] === file ? [] : [`${name}: expected only ${file}, got [${files.join(", ")}]`];
  });
  assert.deepEqual(wrong, [], wrong.join("\n"));
});

// Spec 753ff3c539424409 v3 Signatures: LTT.usesTerm and LTT.isAdvice join the public set (83 names); both are documented in kit/api/internals.md.
const NEW_NAMES = ["usesTerm", "isAdvice"];
test("VO-2 FR-3 QR-2: the runtime LTT public names are exactly the 81 oracle names plus usesTerm and isAdvice (83)", () => {
  const expected = [...Object.values(BASE_DEFINITIONS).flatMap((s) => s.split(", ")), ...NEW_NAMES].sort();
  const names = Object.keys(loadLTT()).sort();
  const missing = expected.filter((n) => !names.includes(n));
  const extra = names.filter((n) => !expected.includes(n));
  assert.deepEqual({ missing, extra }, { missing: [], extra: [] }, `runtime LTT differs from the oracle: missing [${missing.join(", ")}], extra [${extra.join(", ")}]`);
  assert.equal(names.length, 83);
});

for (const name of NEW_NAMES) {
  test(`VO-11 FR-14 (753ff3c539424409 v3): ${name} is defined in exactly kit/api/internals.md`, () => {
    const files = [...(definitions(realDocs()).get(name) ?? [])].sort();
    assert.deepEqual(files, ["kit/api/internals.md"]);
  });
}

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

const LINT_IDS = ["no-reading-guide", "no-title", "overview-missing", "overview-order", "overview-no-visual", "keywords-last", "unused-term", "term-no-visual", "summary-no-recall", "card-monotony", "no-signature", "no-theme", "unknown-theme"];
// Spec 80a1b2f18f50b1df FR-15 / VO-11: the seven kit-common B checks live in the "검사(`#ltt-check`)" section of rules.md.
const CHECK_IDS = ["unknown-term", "used-before-defined", "predict-new-term", "filler-content", "goal-unreachable", "goal-at-start", "expect-mismatch"];

for (const [label, ids] of [["lint", LINT_IDS], ["check", CHECK_IDS]]) {
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
  }
  return problems;
}

const fakeSceneTable = (figureRows) => ["| type | 필드 |", "| --- | --- |",
  ...SCENE_TYPES.flatMap((t) => (t === "figure" ? figureRows : [`| ${t === "(없음)" ? t : `\`${t}\``} | 짧은 설명 |`]))].join("\n");

test("VO-4 scene-type checker: a clean table with one short row per type passes", () => {
  assert.deepEqual(sceneTypeProblems(fakeSceneTable(["| `figure` | 짧은 설명 |"])), []);
});

test("VO-4 scene-type checker: a duplicated figure row fails on count", () => {
  const problems = sceneTypeProblems(fakeSceneTable(["| `figure` | 짧은 설명 |", "| `figure` | 다른 설명 |"]));
  assert.deepEqual(problems, ["figure: 2 rows have this first cell (expected exactly 1)"]);
});

test("VO-4 scene types: each type and (없음) is the first cell of exactly one row", () => {
  const problems = sceneTypeProblems(apiText());
  assert.deepEqual(problems, [], problems.join("\n"));
});

test("VO-4 deck-contracts pointer: one line holds steps, answerVisual and kit/api/deck-contracts.md", () => {
  const err = tokenLineError(apiText(), "FR-3 deck-contracts line", ["steps", "answerVisual", "kit/api/deck-contracts.md"]);
  assert.equal(err, null, err);
});

// ADR 6ff15ad3eef7b88d: agents find parts by grepping `@ltt-part` lines, so each line must fill every axis and point at a real doc.
const PART_TAG = /^\s*\/\/ @ltt-part (LTT\.\w+) \| 대상: ([^|]+) \| 방식: ([^|]+) \| 그림: ([^|]+) \| 문서: (\S+)$/;
const TAGGED_PARTS = ["tween", "units", "bar", "predict", "sweep", "drag", "stepper", "diagram", "plane", "sim", "sequence", "axisPlot",
  "lanes", "hbars", "plot", "sankey", "map", "math", "autoLayout", "state", "chips", "badge", "annotate", "beforeAfter", "takeaway",
  "narration", "callout", "swatches", "facts", "chartFrame", "inspector", "redline", "recall", "mock", "deck", "clock"].map((n) => `LTT.${n}`);
const partTags = () => readdirSync(KIT).filter((f) => f.endsWith(".js")).flatMap((f) =>
  readFileSync(join(KIT, f), "utf8").split("\n").filter((l) => l.includes("@ltt-part")).map((line) => ({ f, line, m: line.match(PART_TAG) })));

test("@ltt-part: every public part has one four-axis tag whose 문서 path exists", () => {
  const tags = partTags();
  const bad = tags.filter((t) => !t.m).map((t) => `${t.f}: ${t.line.trim()}`);
  assert.deepEqual(bad, [], `malformed @ltt-part lines:\n${bad.join("\n")}`);
  const names = tags.map((t) => t.m[1]);
  assert.deepEqual([...names].sort(), [...TAGGED_PARTS].sort());
  const missingDoc = tags.filter((t) => !existsSync(join(SKILL, t.m[5]))).map((t) => `${t.m[1]} → ${t.m[5]}`);
  assert.deepEqual(missingDoc, [], missingDoc.join(", "));
});

test("@ltt-part: the SKILL.md example keywords reach the expected parts", () => {
  const hits = (k) => partTags().filter((t) => t.line.toLowerCase().includes(k.toLowerCase())).map((t) => t.m[1]).sort();
  assert.deepEqual(hits("흐름도"), ["LTT.autoLayout", "LTT.diagram"]);
  assert.deepEqual(hits("2D 지도"), ["LTT.map"]);
  assert.deepEqual(hits("시간에 따른 변화"), ["LTT.clock", "LTT.sim"]);
});

test("VO-4 part paths: kit/API.md plus the @ltt-part tags name the nine kit/api docs; API.md does not name internals.md", () => {
  const text = apiText() + partTags().map((t) => t.line).join("\n");
  const missing = [...PART_DOCS, "deck-contracts"].map((f) => `kit/api/${f}.md`).filter((p) => !text.includes(p));
  assert.deepEqual(missing, [], `kit/API.md and @ltt-part lack ${missing.join(", ")}`);
  assert.equal(apiText().includes("internals.md"), false, "kit/API.md mentions internals.md");
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

// The scene budget was removed by plan b4c8f31281e094e4 (user decision); BUDGET stays only as tokenLineError fixtures.

test("VO-6 FR-8 no-scene-budget: SKILL.md §2 has no scene-budget", () => {
  assert.equal(section(skillText(), 2).includes("scene-budget"), false, "FR-8: §2 mentions scene-budget");
});

for (const [id, tokens] of [["FR-7 §3 kit read line", ["kit/API.md", "페이지 계약", "불러오기", "기본 이름"]],
  ["FR-7 §3 part search line", ["@ltt-part", "문서:"]], ["FR-7 §3 look line", ["look/look.md", "board.jpg"]]]) {
  test(`VO-6 ${id}: one §3 line holds ${tokens.join(", ")}`, () => {
    const err = tokenLineError(section(skillText(), 3), id, tokens);
    assert.equal(err, null, err);
  });
}

test("VO-6 FR-7 no-internals: SKILL.md never mentions internals.md", () => {
  assert.equal(skillText().includes("internals.md"), false, "FR-7: SKILL.md mentions internals.md");
});

const COST_TOKENS = ["lesson.html", "바이트", "그림 수", "서브에이전트", "검증", "미충족", "audit", "시작", "storyboard 공개", "토큰"];
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

// Spec 76b739afacf5b868 FR-16: the rules.md audit section (auditScene rule rows and their wording checks) is deleted.

// ---------- plan b71ddee49f77ac06 §1–3: flow docs stay consistent ----------

// Spec 80a1b2f18f50b1df FR-15: the "## 검사(`#ltt-check`)" section lists kit-common checks that are not graded; every row above it still is.
test("plan §2: every rules.md row outside the 검사 section is graded 고침 or 권고", () => {
  const text = rulesText();
  const at = text.search(/^## 검사/m);
  assert.ok(at > 0, "rules.md has no '## 검사' section");
  const bad = lines(text.slice(0, at)).filter(isRow).filter((r) => firstCell(r).trim() !== "rule" && !["고침", "권고"].includes((cells(r)[1] ?? "").trim()));
  assert.deepEqual(bad, []);
});

test("plan §3: the kit/API.md lesson example is valid JavaScript", () => {
  const block = apiText().match(/^```js\n([\s\S]*?)^```/m);
  assert.ok(block, "kit/API.md has no ```js example");
  assert.doesNotThrow(() => new vm.Script(block[1]));
});

// ---------- Spec 80a1b2f18f50b1df VO-11 (SC-2): page contract and changelog mention the check surface ----------

test("VO-11 SC-2: kit/API.md '## 페이지 계약' section mentions glossary, #ltt-check and data-ltt-check", () => {
  const text = apiText();
  const start = text.search(/^## 페이지 계약/m);
  assert.ok(start >= 0, "kit/API.md has no '## 페이지 계약' section");
  const rest = text.slice(start + 3);
  const end = rest.search(/^## /m);
  const sec = end >= 0 ? rest.slice(0, end) : rest;
  const missing = ["glossary", "#ltt-check", "data-ltt-check"].filter((t) => !sec.includes(t));
  assert.deepEqual(missing, [], `page contract section lacks: ${missing.join(", ")}`);
});

test("VO-11 SC-2: kit/CHANGELOG.md first '## ' heading is '## 미출시' and that section mentions #ltt-check, glossary and LTT.recall", () => {
  const text = readFileSync(join(KIT, "CHANGELOG.md"), "utf8");
  const heads = [...text.matchAll(/^## .*$/gm)];
  assert.ok(heads.length > 0, "CHANGELOG.md has no '## ' heading");
  assert.equal(heads[0][0].trim(), "## 미출시");
  const sec = text.slice(heads[0].index, heads[1]?.index ?? text.length);
  const missing = ["#ltt-check", "glossary", "LTT.recall"].filter((t) => !sec.includes(t));
  assert.deepEqual(missing, [], `미출시 section lacks: ${missing.join(", ")}`);
});

// ---------- spec 76b739afacf5b868 VO-11 (FR-14, FR-16, QR-7) ----------

// Oracle: the four strings are the removed audit surface (FR-14); the six file groups are the QR-7 target list.
const REMOVED_STRINGS = ["auditScene", "ltt-audit", "?audit", "layout-audit"];
const mjsIn = (dir) => readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort().map((f) => join(dir, f));
const ltt = (rel) => join(KIT, rel);
const FILE_GROUPS = {
  "kit/*.js": () => readdirSync(KIT).filter((f) => f.endsWith(".js")).sort().map(ltt),
  "server/*.mjs": () => mjsIn(join(SKILL, "server")),
  "scripts/*.mjs": () => mjsIn(join(ROOT, "scripts")),
  "kit/API.md": () => [join(KIT, "API.md")],
  "kit/api/*.md": () => readdirSync(API_DIR).filter((f) => f.endsWith(".md")).sort().map((f) => join(API_DIR, f)),
  "SKILL.md": () => [join(SKILL, "SKILL.md")],
};

for (const [group, list] of Object.entries(FILE_GROUPS)) {
  for (const str of REMOVED_STRINGS) {
    test(`VO-11 QR-7: ${JSON.stringify(str)} occurs 0 times in ${group}`, () => {
      const files = list();
      assert.ok(files.length > 0, `${group} matched no file`);
      const hits = files.filter((f) => readFileSync(f, "utf8").includes(str));
      assert.deepEqual(hits.map((f) => f.replace(ROOT, "")), []);
    });
  }
}

test("VO-11 QR-7 checker: the file-group walk is not vacuous (finds ltt.js, audit.mjs, rules.md)", () => {
  assert.ok(FILE_GROUPS["kit/*.js"]().some((f) => f.endsWith("/ltt.js")));
  assert.ok(FILE_GROUPS["server/*.mjs"]().some((f) => f.endsWith("/audit.mjs")));
  assert.ok(FILE_GROUPS["kit/api/*.md"]().some((f) => f.endsWith("/rules.md")));
});

test("VO-11 FR-14: LTT.auditScene === undefined on the full deck chain", () => {
  assert.equal(loadLTT().auditScene, undefined);
});

test("VO-11 FR-16: kit/API.md has a table row whose first cell holds the LTT.clock code span", () => {
  const rows = lines(apiText()).filter(isRow).filter((r) => /`LTT\.clock\b/.test(firstCell(r)));
  assert.equal(rows.length, 1, `rows with LTT.clock in the first cell: ${rows.length}`);
});

test("VO-11 FR-16: kit/API.md '## 페이지 계약' section mentions ?shot, scroll, scenes and clocks", () => {
  const text = apiText();
  const start = text.search(/^## 페이지 계약/m);
  assert.ok(start >= 0, "kit/API.md has no '## 페이지 계약' section");
  const rest = text.slice(start + 3);
  const end = rest.search(/^## /m);
  const sec = end >= 0 ? rest.slice(0, end) : rest;
  const missing = ["?shot", "scroll", "scenes", "clocks"].filter((t) => !sec.includes(t));
  assert.deepEqual(missing, [], `page contract section lacks: ${missing.join(", ")}`);
});

test("VO-11 FR-16: kit/API.md mentions ?shot", () => {
  assert.ok(apiText().includes("?shot"));
});

test("VO-11 FR-16: SKILL.md contains `[shot` and `--checklist` and `LTT.clock`", () => {
  const t = skillText();
  const missing = ["[shot", "--checklist", "LTT.clock"].filter((x) => !t.includes(x));
  assert.deepEqual(missing, [], `SKILL.md lacks: ${missing.join(", ")}`);
});

test("VO-11 FR-16: rules.md has no audit section heading and internals.md names no removed helper", () => {
  assert.ok(!/^#+ .*audit/im.test(rulesText()), "rules.md still has an audit heading");
  assert.ok(!apiDoc("internals.md").includes("auditScene"));
});

test("VO-11 FR-16: kit/CHANGELOG.md 미출시 section mentions LTT.clock", () => {
  const text = readFileSync(join(KIT, "CHANGELOG.md"), "utf8");
  const heads = [...text.matchAll(/^## .*$/gm)];
  const sec = text.slice(heads[0].index, heads[1]?.index ?? text.length);
  const missing = ["LTT.clock"].filter((t) => !sec.includes(t));
  assert.deepEqual(missing, [], `미출시 section lacks: ${missing.join(", ")}`);
});
