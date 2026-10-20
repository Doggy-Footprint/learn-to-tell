import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const KIT = join(ROOT, "skills/learn-to-tell/kit");
const INTERNALS = join(KIT, "api/internals.md");
const CHANGELOG = join(KIT, "CHANGELOG.md");
const PLUGIN = join(ROOT, ".claude-plugin/plugin.json");
const PKG = join(ROOT, "packages/ltt-kit/package.json");
const README = join(ROOT, "README.md");

function readReal(path, what) {
  assert.ok(existsSync(path), `${what} is missing: ${path}`);
  return readFileSync(path, "utf8");
}

// ---------- Markdown helpers (same table conventions as tests/api-docs.test.mjs) ----------

const lines = (text) => text.split(/\r?\n/);
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
const codeSpans = (text) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
const rows = (text) => lines(text).filter(isRow);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Exact token, tolerant of surrounding backticks and punctuation; identifier characters and "-" on either side break the match.
const tokenRe = (token) => new RegExp(`(?<![\\w$-])${escape(token)}(?![\\w$-])`);
const hasToken = (text, token) => tokenRe(token).test(text);

function headings(text) {
  const out = [];
  let fence = false;
  lines(text).forEach((line, i) => {
    if (/^\s*```/.test(line)) fence = !fence;
    const m = !fence && line.match(/^(#{1,6})\s+(.*)$/);
    if (m) out.push({ i, level: m[1].length, title: m[2] });
  });
  return out;
}

// Text under every heading whose title matches, up to the next heading of the same or higher level.
function sectionsUnder(text, match) {
  const ls = lines(text);
  const hs = headings(text);
  return hs
    .filter((h) => match(h.title))
    .map((h) => {
      const next = hs.find((n) => n.i > h.i && n.level <= h.level);
      return ls.slice(h.i, next ? next.i : ls.length).join("\n");
    })
    .join("\n");
}

const internals = () => readReal(INTERNALS, "kit/api/internals.md");

// ---------- VO-10 internals.md structure tokens ----------

test("VO-10 FR-9: internals.md first line keeps kit 개발자용 and 수업에서 부르지 않", () => {
  const first = lines(internals()).find((l) => l.trim() !== "") ?? "";
  const missing = ["kit 개발자용", "수업에서 부르지 않"].filter((t) => !first.includes(t));
  assert.deepEqual(missing, [], `first line ${JSON.stringify(first)} lacks ${missing.join(", ")}`);
});

const definesName = (row, name) => codeSpans(firstCell(row)).some((s) => new RegExp(`LTT\\.${name}(?![\\w$])`).test(s));

test("VO-10 FR-9: exactly one table row defines LTT.sceneTypes in a first-cell code span", () => {
  const hits = rows(internals()).filter((r) => definesName(r, "sceneTypes"));
  assert.equal(hits.length, 1, `rows defining LTT.sceneTypes:\n${hits.join("\n")}`);
});

test("VO-10 FR-9: the LTT.deckTypes row mentions sceneTypes", () => {
  const hits = rows(internals()).filter((r) => definesName(r, "deckTypes"));
  assert.ok(hits.length > 0, "no table row defines LTT.deckTypes");
  const stale = hits.filter((r) => !r.includes("sceneTypes"));
  assert.deepEqual(stale, [], `LTT.deckTypes rows without sceneTypes:\n${stale.join("\n")}`);
});

const FIELDS = ["head", "autoSplit", "fullByDefault", "pointsOnMock", "sumVisualAreas", "needsReadingGuide", "titleOptional", "bookend", "cardGrid", "signature", "auditHero", "auditSmallVisual", "auditLooseFigure", "render"];

const fieldCell = (row, field) => new RegExp(`^${field}(?![\\w$-])`).test(firstCell(row).replace(/`/g, "").trim());

for (const field of FIELDS) {
  test(`VO-10 FR-9 field table: ${field} is the first cell of a table row`, () => {
    assert.ok(rows(internals()).some((r) => fieldCell(r, field)), `no table row starts with ${field}`);
  });
}

const CTX_TOKENS = ["el", "scene", "index", "scenes", "predictRest", "refit", "float", "fit", "gate", "place", "unplace", "back", "zmax", "enter", "leave"];

for (const token of CTX_TOKENS) {
  test(`VO-10 FR-9 ctx section: ${token} appears under a ctx heading`, () => {
    const section = sectionsUnder(internals(), (t) => t.includes("ctx"));
    assert.ok(section, "internals.md has no heading containing ctx");
    assert.ok(hasToken(section, token), `ctx section lacks the token ${token}`);
  });
}

const MEASURE_TOKENS = ["LTT.measure", "send", ".dk-still", "answerVisual", "멱등"];

for (const token of MEASURE_TOKENS) {
  test(`VO-10 FR-9 measurement-mode section: ${token} appears under a 측정 heading`, () => {
    const section = sectionsUnder(internals(), (t) => t.includes("측정"));
    assert.ok(section, "internals.md has no heading containing 측정");
    assert.ok(hasToken(section, token), `measurement-mode section lacks the token ${token}`);
  });
}

// ---------- VO-10 meta field table values (oracle: spec Signatures table) ----------

const SPEC_TYPES = ["hook", "explain", "terms", "compare", "figure", "overview", "statement", "contrast", "predict", "summary", "keywords", "map-related"];
const SPEC_META = {
  head: [true, ["hook", "statement"]],
  autoSplit: [true, ["map-related", "hook", "keywords", "summary", "terms", "contrast", "predict", "figure", "overview", "statement"]],
  fullByDefault: [false, ["figure", "overview"]],
  pointsOnMock: [false, ["figure", "overview"]],
  sumVisualAreas: [false, ["compare"]],
  needsReadingGuide: [false, ["compare", "contrast", "figure", "overview"]],
  titleOptional: [false, ["hook", "keywords", "summary"]],
  bookend: [false, ["hook", "keywords"]],
  cardGrid: [false, ["explain", "compare", "summary", "terms"]],
  signature: [false, ["figure", "contrast"]],
  auditHero: [false, ["figure"]],
  auditSmallVisual: [true, ["hook", "terms", "summary", "keywords", "statement", "predict"]],
  auditLooseFigure: [false, ["figure"]],
};

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

const plainCell = (c) => c.replace(/`/g, "").trim();

function metaTable() {
  for (const block of tableBlocks(internals())) {
    const header = cells(block[0]).map(plainCell);
    const def = header.findIndex((c) => c === "기본");
    const nonDef = header.findIndex((c) => c.includes("기본이 아닌"));
    if (header.some((c) => c.includes("필드")) && def >= 0 && nonDef >= 0) return { rows: block.slice(1).filter(isRow), def, nonDef };
  }
  return null;
}

const typesIn = (cell) => SPEC_TYPES.filter((t) => tokenRe(t).test(cell)).sort();

test("VO-10 FR-9: internals.md has a meta field table with 필드, 기본 and 기본이 아닌 타입 columns", () => {
  assert.ok(metaTable(), "no table whose header has 필드, 기본 and 기본이 아닌 타입 columns");
});

for (const [field, [def, nonDefault]] of Object.entries(SPEC_META)) {
  test(`VO-10 FR-9 meta table ${field}: 기본 ${def} and 기본이 아닌 타입 {${nonDefault.join(", ")}}`, () => {
    const table = metaTable();
    assert.ok(table, "no meta field table");
    const row = table.rows.find((r) => fieldCell(r, field));
    assert.ok(row, `meta field table has no ${field} row`);
    const c = cells(row);
    const value = plainCell(c[table.def] ?? "").match(/\b(true|false)\b/);
    assert.ok(value, `${field}: 기본 cell ${JSON.stringify(c[table.def])} has no true/false`);
    assert.equal(value[1], String(def), `${field}: 기본 cell`);
    assert.deepEqual(typesIn(c[table.nonDef] ?? ""), [...nonDefault].sort(), `${field}: 기본이 아닌 타입 cell ${JSON.stringify(c[table.nonDef])}`);
  });
}

for (const token of ["RULES", "scene", "deck", "등록 순서"]) {
  test(`VO-10 FR-9 lint section: ${token} appears under a heading containing lint`, () => {
    const section = sectionsUnder(internals(), (t) => t.includes("lint"));
    assert.ok(section, "internals.md has no heading containing lint");
    assert.ok(token === "등록 순서" ? section.includes(token) : hasToken(section, token), `lint section lacks ${token}`);
  });
}

// ---------- VO-11 versions, CHANGELOG, README ----------

const json = (path, what) => JSON.parse(readReal(path, what));

test("VO-11 C-16: .claude-plugin/plugin.json version is 1.0.0", () => {
  assert.equal(json(PLUGIN, ".claude-plugin/plugin.json").version, "1.0.0");
});

test("VO-11 C-16: packages/ltt-kit/package.json version is 1.0.0", () => {
  assert.equal(json(PKG, "packages/ltt-kit/package.json").version, "1.0.0");
});

test("VO-11 C-16: the two manifest versions are equal", () => {
  assert.equal(json(PLUGIN, ".claude-plugin/plugin.json").version, json(PKG, "packages/ltt-kit/package.json").version);
});

test("VO-11 C-16: packages/ltt-kit/package.json files includes CHANGELOG.md", () => {
  const files = json(PKG, "packages/ltt-kit/package.json").files;
  assert.ok(Array.isArray(files) && files.includes("CHANGELOG.md"), `files = ${JSON.stringify(files)}`);
});

const isV020 = (title) => /^[[`]?0\.2\.0(?![\d.])/.test(title.trim());

function sectionAt2(text) {
  const ls = lines(text);
  const hs = headings(text);
  const h = hs.find((x) => x.level === 2 && isV020(x.title));
  if (!h) return null;
  const next = hs.find((n) => n.i > h.i && n.level <= 2);
  return ls.slice(h.i, next ? next.i : ls.length).join("\n");
}

test("VO-11 C-16: kit/CHANGELOG.md exists with a ## 0.2.0 heading", () => {
  assert.ok(sectionAt2(readReal(CHANGELOG, "kit/CHANGELOG.md")) !== null, "kit/CHANGELOG.md has no ## 0.2.0 heading");
});

const CHANGELOG_TOKENS = ["enter", "answerVisual", "rest", "predictRest", "auto-reveal", "panel-overlap", "ltt-audit", "audit.mjs", "kit/api/", "sceneTypes", "deckTypes"];

for (const token of CHANGELOG_TOKENS) {
  test(`VO-11 C-16 CHANGELOG 0.2.0 item: ${token}`, () => {
    const section = sectionAt2(readReal(CHANGELOG, "kit/CHANGELOG.md"));
    assert.ok(section !== null, "kit/CHANGELOG.md has no ## 0.2.0 heading");
    const found = token.endsWith("/") ? section.includes(token) : hasToken(section, token);
    assert.ok(found, `## 0.2.0 lacks ${token}`);
  });
}

test("VO-11 C-16 CHANGELOG 0.2.0 item: 빈자리", () => {
  const section = sectionAt2(readReal(CHANGELOG, "kit/CHANGELOG.md"));
  assert.ok(section !== null, "kit/CHANGELOG.md has no ## 0.2.0 heading");
  assert.ok(section.includes("빈자리"), "## 0.2.0 lacks 빈자리");
});

test("VO-11 C-16 FR-10: node scripts/build.mjs version exits 0 and prints 1.0.0", () => {
  let out;
  try {
    out = execFileSync(process.execPath, [join(ROOT, "scripts/build.mjs"), "version"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    assert.fail(`build.mjs version exited ${e.status ?? e.code}: ${e.stderr ?? e.message}`);
  }
  assert.equal(out.trim(), "1.0.0");
});

test("VO-11 C-16 CHANGELOG 0.2.0 item: one line names the lint 레지스트리", () => {
  const section = sectionAt2(readReal(CHANGELOG, "kit/CHANGELOG.md"));
  assert.ok(section !== null, "kit/CHANGELOG.md has no ## 0.2.0 heading");
  assert.ok(lines(section).some((l) => l.includes("lint") && l.includes("레지스트리")), "## 0.2.0 has no line with lint and 레지스트리");
});

test("VO-11 C-16: README ### 릴리스 section mentions kit/CHANGELOG.md", () => {
  const text = readReal(README, "README.md");
  const ls = lines(text);
  const hs = headings(text);
  const h = hs.find((x) => x.level === 3 && x.title.trim().startsWith("릴리스"));
  assert.ok(h, "README.md has no ### 릴리스 heading");
  const next = hs.find((n) => n.i > h.i);
  const section = ls.slice(h.i, next ? next.i : ls.length).join("\n");
  assert.ok(section.includes("kit/CHANGELOG.md"), "README ### 릴리스 section lacks kit/CHANGELOG.md");
});

// ---------- spec 74cb05d7da21907e VO-3 (FR-9): placement module, vw rule, revealed-state resize ----------

const API = join(KIT, "API.md");
const CONTRACTS = join(KIT, "api/deck-contracts.md");
const lineHasAll = (text, tokens) => lines(text).some((l) => tokens.every((t) => (/^[\w$]+$/.test(t) ? hasToken(l, t) : l.includes(t))));

function sectionsOrFail(text, what, match, label) {
  const section = sectionsUnder(text, match);
  assert.ok(section, `${what} has no heading ${label}`);
  return section;
}

test("VO-3 FR-9 API.md ## 원칙: exactly one line states the vw rule with vw and figure", () => {
  const text = readReal(API, "kit/API.md");
  const h = headings(text).find((x) => x.level === 2 && x.title.trim().startsWith("원칙"));
  assert.ok(h, "kit/API.md has no ## 원칙 heading");
  const section = sectionsUnder(text, (t) => t === h.title);
  const hits = lines(section).filter((l) => hasToken(l, "vw") && hasToken(l, "figure"));
  assert.equal(hits.length, 1, `## 원칙 lines holding both vw and figure:\n${hits.join("\n")}`);
});

test("VO-3 FR-9 internals.md: exactly one table row defines LTT.placement in a first-cell code span, and it names zoomLock", () => {
  const hits = rows(internals()).filter((r) => definesName(r, "placement"));
  assert.equal(hits.length, 1, `rows defining LTT.placement:\n${hits.join("\n")}`);
  assert.ok(hasToken(hits[0], "zoomLock"), `LTT.placement row lacks zoomLock: ${hits[0]}`);
});

test("VO-3 FR-9 internals.md measurement-mode section: one line holds answerVisual, 공개, 창 크기 and 다시 (called again after reveal on resize)", () => {
  const section = sectionsOrFail(internals(), "kit/api/internals.md", (t) => t.includes("측정"), "containing 측정");
  assert.ok(lineHasAll(section, ["answerVisual", "공개", "창 크기", "다시"]), "no line under a 측정 heading holds answerVisual, 공개, 창 크기 and 다시");
});

const contracts = () => readReal(CONTRACTS, "kit/api/deck-contracts.md");

test("VO-3 FR-9 deck-contracts.md figure section: no 칸 폭까지 넓힌다, no 56vw, and the vw rule is stated", () => {
  const section = sectionsOrFail(contracts(), "kit/api/deck-contracts.md", (t) => t.includes("figure"), "containing figure");
  assert.ok(!section.includes("칸 폭까지 넓힌다"), "figure section still says 칸 폭까지 넓힌다");
  assert.ok(!section.includes("56vw"), "figure section still mentions 56vw");
  assert.ok(hasToken(section, "vw"), "figure section does not mention vw");
});

test("VO-3 FR-9 deck-contracts.md predict section: one line says it re-measures (다시) when the 창 크기 changes", () => {
  const section = sectionsOrFail(contracts(), "kit/api/deck-contracts.md", (t) => t.includes("predict"), "containing predict");
  assert.ok(lineHasAll(section, ["창 크기", "다시"]), "no line in the predict section holds 창 크기 and 다시");
});

for (const token of ["vw", "placement", "widen"]) {
  test(`VO-3 FR-9 CHANGELOG 0.2.0 item: ${token}`, () => {
    const section = sectionAt2(readReal(CHANGELOG, "kit/CHANGELOG.md"));
    assert.ok(section !== null, "kit/CHANGELOG.md has no ## 0.2.0 heading");
    assert.ok(/^[\w$]+$/.test(token) ? hasToken(section, token) : section.includes(token), `## 0.2.0 lacks ${token}`);
  });
}

test("VO-3 FR-9 CHANGELOG 0.2.0 item: 창 크기 or resize", () => {
  const section = sectionAt2(readReal(CHANGELOG, "kit/CHANGELOG.md"));
  assert.ok(section !== null, "kit/CHANGELOG.md has no ## 0.2.0 heading");
  assert.ok(section.includes("창 크기") || hasToken(section, "resize"), "## 0.2.0 lacks both 창 크기 and resize");
});

// v4 (IM-1): option C was dropped, so no doc may promise that a floatable answer keeps the entry zoom.
const FLOAT_PROMISES = ["뜰 수 있는 정답", "띄울 수 있는 정답"];
const floatPromiseTargets = [
  ["kit/api/deck-contracts.md", () => contracts()],
  ["kit/api/internals.md", () => internals()],
  ["kit/CHANGELOG.md ## 0.2.0", () => {
    const section = sectionAt2(readReal(CHANGELOG, "kit/CHANGELOG.md"));
    assert.ok(section !== null, "kit/CHANGELOG.md has no ## 0.2.0 heading");
    return section;
  }],
];

for (const [what, text] of floatPromiseTargets) {
  test(`VO-3 FR-9 v4: ${what} contains neither ${FLOAT_PROMISES.join(" nor ")}`, () => {
    const t = text();
    const found = FLOAT_PROMISES.filter((p) => t.includes(p));
    assert.deepEqual(found, [], `${what} still contains ${found.join(", ")}`);
  });
}

// ---------- spec 1e62814b16984176 VO-5 DOC-4 (FR-3, C-16): CHANGELOG 0.2.0 작가 계약 part names the overview hero change ----------

const HERO_TOKENS = ["overview", "layout", "small-visual", "empty-stage"];
// A part label is a non-list line (heading, bold or plain) whose text, stripped of #, * and _, starts with the label.
const isPartLabel = (line, label) => !/^\s*(?:[-+]|\d+[.)])\s/.test(line) && line.replace(/^[\s#*_]+/, "").startsWith(label);

function authorContractError(section) {
  const ls = lines(section);
  const start = ls.findIndex((l) => isPartLabel(l, "작가 계약"));
  if (start < 0) return "## 0.2.0 has no 작가 계약 line";
  const rel = ls.slice(start + 1).findIndex((l) => isPartLabel(l, "kit 개발자용"));
  if (rel < 0) return "## 0.2.0 has no kit 개발자용 line after 작가 계약";
  const part = ls.slice(start + 1, start + 1 + rel);
  if (part.some((l) => HERO_TOKENS.every((t) => hasToken(l, t)))) return null;
  const inSection = HERO_TOKENS.filter((t) => hasToken(section, t));
  return `no single line between 작가 계약 and kit 개발자용 holds all of ${HERO_TOKENS.join(", ")}` +
    (inSection.length === HERO_TOKENS.length ? " (they appear elsewhere in ## 0.2.0 or split across lines)" : `; ## 0.2.0 lacks ${HERO_TOKENS.filter((t) => !inSection.includes(t)).join(", ")}`);
}

const HERO_LINE = "- layout을 적지 않은 `overview`도 full 장면으로 판정되어 `small-visual` 22% 기준과 `empty-stage`를 받는다.";
const fakeSection = (author, dev) => ["## 0.2.0", "", "### 작가 계약", "", ...author, "", "### kit 개발자용", "", ...dev].join("\n");

test("VO-5 DOC-4 checker: the four tokens on one 작가 계약 line pass", () => {
  assert.equal(authorContractError(fakeSection(["- 다른 줄", HERO_LINE], ["- 내부 변경"])), null);
});

test("VO-5 DOC-4 checker: the same line under kit 개발자용 fails", () => {
  assert.match(String(authorContractError(fakeSection(["- 다른 줄"], [HERO_LINE]))), /elsewhere in ## 0\.2\.0/);
});

test("VO-5 DOC-4 checker: the tokens split over two 작가 계약 lines fail", () => {
  assert.notEqual(authorContractError(fakeSection(["- layout을 적지 않은 `overview`는 full이다.", "- `small-visual`과 `empty-stage`를 받는다."], [])), null);
});

test("VO-5 DOC-4 checker: a bold part label works and a list item mentioning kit 개발자용 does not end the part", () => {
  const text = ["## 0.2.0", "**작가 계약**", "- kit 개발자용 문서는 따로 있다.", HERO_LINE, "**kit 개발자용**", "- 내부"].join("\n");
  assert.equal(authorContractError(text), null);
});

test("VO-5 DOC-4 checker: a missing kit 개발자용 label fails with that reason", () => {
  assert.equal(authorContractError(["## 0.2.0", "### 작가 계약", HERO_LINE].join("\n")), "## 0.2.0 has no kit 개발자용 line after 작가 계약");
});

test("VO-5 DOC-4 FR-3 C-16: kit/CHANGELOG.md ## 0.2.0 has one line between 작가 계약 and kit 개발자용 holding overview, layout, small-visual and empty-stage", () => {
  const section = sectionAt2(readReal(CHANGELOG, "kit/CHANGELOG.md"));
  assert.ok(section !== null, "kit/CHANGELOG.md has no ## 0.2.0 heading");
  const err = authorContractError(section);
  assert.equal(err, null, err ?? "");
});

// ---------- spec bf761aaf871d8d45 VO-7 (FR-7): kit .css files and npm run build:css in the docs ----------

// The kit 개발자용 part runs from its label to the next heading or bold label line, or to the end of ## 0.2.0.
function devPart(section) {
  const ls = lines(section);
  const start = ls.findIndex((l) => isPartLabel(l, "kit 개발자용"));
  if (start < 0) return null;
  const rel = ls.slice(start + 1).findIndex((l) => /^#{1,6}\s/.test(l) || /^\s*\*\*[^*]+\*\*\s*$/.test(l));
  return ls.slice(start + 1, rel < 0 ? ls.length : start + 1 + rel);
}

test("VO-7 FR-7 CHANGELOG 0.2.0 kit 개발자용: one line holds .css, build:css and npm test or --check", () => {
  const section = sectionAt2(readReal(CHANGELOG, "kit/CHANGELOG.md"));
  assert.ok(section !== null, "kit/CHANGELOG.md has no ## 0.2.0 heading");
  const part = devPart(section);
  assert.ok(part, "## 0.2.0 has no kit 개발자용 label");
  const hit = (l) => l.includes(".css") && l.includes("build:css") && (l.includes("npm test") || l.includes("--check"));
  assert.ok(part.some(hit), "no kit 개발자용 line holds .css, build:css and one of npm test / --check");
});

function cssSection() {
  const text = internals();
  const h = headings(text).find((x) => x.level === 2 && x.title.trim().startsWith("CSS를 고치려면"));
  assert.ok(h, "kit/api/internals.md has no ## CSS를 고치려면 heading");
  return sectionsUnder(text, (t) => t === h.title);
}

for (const [label, ok] of [
  [".css", (s) => s.includes(".css")],
  ["npm run build:css", (s) => s.includes("npm run build:css")],
  ["--check", (s) => s.includes("--check")],
  ["themeCss or 테마", (s) => hasToken(s, "themeCss") || s.includes("테마")],
  ["@font-face", (s) => s.includes("@font-face")],
  ["one line with css:start and 손으로", (s) => lines(s).some((l) => l.includes("css:start") && l.includes("손으로"))],
]) {
  test(`VO-7 FR-7 internals.md ## CSS를 고치려면: ${label}`, () => {
    assert.ok(ok(cssSection()), `## CSS를 고치려면 lacks ${label}`);
  });
}

function fencedBlocks(text) {
  const blocks = [];
  let cur = null;
  for (const line of lines(text)) {
    if (/^\s*```/.test(line)) {
      if (cur) blocks.push(cur);
      cur = cur ? null : [];
    } else if (cur) cur.push(line);
  }
  return blocks;
}

test("VO-7 FR-7 README ## 사용: a fenced code block holds npm run build:css", () => {
  const text = readReal(README, "README.md");
  const ls = lines(text);
  const hs = headings(text);
  const h = hs.find((x) => x.level === 2 && x.title.trim().startsWith("사용"));
  assert.ok(h, "README.md has no ## 사용 heading");
  const next = hs.find((n) => n.i > h.i && n.level <= 2);
  const section = ls.slice(h.i, next ? next.i : ls.length).join("\n");
  assert.ok(fencedBlocks(section).some((b) => b.some((l) => l.includes("npm run build:css"))), "no fenced code block under ## 사용 holds npm run build:css");
});

// ---------- spec 37a2365a466d3e8b v1 VO-13 (FR-15): docs follow the absorb / severity / report / exit-code change ----------

const RULES = join(KIT, "api/rules.md");

// "미배포 절": the level-2 section whose heading says 미배포. No fallback to another section.
function unreleasedSection(text) {
  const hs = headings(text).filter((h) => h.level === 2);
  const h = hs.find((x) => x.title.includes("미배포"));
  assert.ok(h, "kit/CHANGELOG.md has no level-2 section whose heading says 미배포");
  const next = hs.find((n) => n.i > h.i);
  return lines(text).slice(h.i, next ? next.i : undefined).join("\n");
}

for (const token of ["absorb", "severity", "종료 코드"]) {
  test(`VO-13 CHANGELOG unreleased section mentions ${token}`, () => {
    const section = unreleasedSection(readReal(CHANGELOG, "kit/CHANGELOG.md"));
    assert.ok(/^[\w$]+$/.test(token) ? hasToken(section, token) : section.includes(token), `unreleased section lacks ${token}`);
  });
}

for (const token of ["measures", "zoom", "absorb", "zoomBy", "floor"]) {
  test(`VO-13 internals.md documents the measures field ${token}`, () => {
    assert.ok(hasToken(internals(), token), `internals.md lacks ${token}`);
  });
}

test("VO-13 rules.md overflow row keeps 78% and no longer says only '78%로 줄여도 넘친다': it separates the floor from a zoom set by another state", () => {
  const hits = rows(readReal(RULES, "kit/api/rules.md")).filter((r) => codeSpans(firstCell(r)).includes("overflow"));
  assert.equal(hits.length, 1, `rows with overflow in the first cell: ${hits.length}`);
  const row = hits[0];
  assert.ok(row.includes("78%"), `threshold text 78% missing: ${row}`);
  assert.ok(row.includes("하한"), `no mention of the 78% floor (하한): ${row}`);
  assert.ok(/상태|zoomBy/.test(row), `no mention of a zoom fitted to another state: ${row}`);
});

// ---------- spec 5ad829b7137b4d19 v1 VO-DOCS (FR-15, FR-17) ----------

test("VO-DOCS FR-17: the CHANGELOG unreleased section records autoplay removal, the hold floor, cumulative reveal and standalone stepper auto-play", () => {
  const section = unreleasedSection(readReal(CHANGELOG, "kit/CHANGELOG.md"));
  const need = [["autoplay removed", /autoplay/], ["hold floor 1800", /1800/], ["floor formula 100", /1000\s*\+\s*100/], ["cumulative reveal 누적 공개", /누적 공개/], ["standalone LTT.stepper", /단독\s*`?LTT\.stepper/], ["auto-play 자동", /자동/]];
  const missing = need.filter(([, re]) => !re.test(section)).map(([n]) => n);
  assert.deepEqual(missing, [], `unreleased section lacks: ${missing.join("; ")}`);
});

test("VO-DOCS FR-15: the rules.md still-visual row counts figure steps with two or more steps as an exposure beat and no longer says 자동 재생", () => {
  const hit = rows(readReal(RULES, "kit/api/rules.md")).filter((r) => codeSpans(firstCell(r)).includes("still-visual"));
  assert.equal(hit.length, 1);
  assert.ok(/steps`?\(단계 둘 이상\)/.test(hit[0]), `row lacks figure steps(단계 둘 이상): ${hit[0]}`);
  assert.equal(/steps`?\s*자동 재생/.test(hit[0]), false, "row still says 'figure steps 자동 재생'");
});
