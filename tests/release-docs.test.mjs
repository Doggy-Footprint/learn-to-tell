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

test("VO-11 C-16: .claude-plugin/plugin.json version is 0.2.0", () => {
  assert.equal(json(PLUGIN, ".claude-plugin/plugin.json").version, "0.2.0");
});

test("VO-11 C-16: packages/ltt-kit/package.json version is 0.2.0", () => {
  assert.equal(json(PKG, "packages/ltt-kit/package.json").version, "0.2.0");
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

test("VO-11 C-16 FR-10: node scripts/build.mjs version exits 0 and prints 0.2.0", () => {
  let out;
  try {
    out = execFileSync(process.execPath, [join(ROOT, "scripts/build.mjs"), "version"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    assert.fail(`build.mjs version exited ${e.status ?? e.code}: ${e.stderr ?? e.message}`);
  }
  assert.equal(out.trim(), "0.2.0");
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
