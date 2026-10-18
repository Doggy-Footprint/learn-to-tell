// Spec bf761aaf871d8d45 v1: kit CSS lives in skills/learn-to-tell/kit/<module>.css and build.mjs css regenerates the JS marker regions.
// Every expected value comes from the spec (Signatures, Errors, Cases) or is hand-written; nothing here imports scripts/build.mjs.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const KIT_REL = "skills/learn-to-tell/kit";
const KIT = join(ROOT, KIT_REL);

const PAIRS = [
  ["ltt.js", "ltt.css"],
  ["ltt-parts.js", "ltt-parts.css"],
  ["ltt-ui.js", "ltt-ui.css"],
  ["ltt-mock.js", "ltt-mock.css"],
  ["ltt-deck.js", "ltt-deck.css"],
];
const JS_FILES = PAIRS.map(([js]) => js);
const cssOf = (js) => PAIRS.find(([j]) => j === js)[1];

// ---------- independent normalization N (spec Signatures rules 1-6) ----------

const WS = new Set([" ", "\t", "\r", "\n", "\f"]);
const AROUND = new Set(["{", "}", ";", ",", ">"]);

function scan(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== ch) j += css[j] === "\\" ? 2 : 1;
      if (j >= css.length) throw new Error(`unterminated string at offset ${i}`);
      out.push({ kind: "s", from: i, to: j + 1 });
      i = j + 1;
    } else if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      if (end < 0) throw new Error(`unterminated comment at offset ${i}`);
      out.push({ kind: "m", from: i, to: end + 2 });
      i = end + 2;
    } else {
      out.push({ kind: "c", from: i, to: i + 1 });
      i++;
    }
  }
  return out;
}

function classify(css) {
  const kinds = new Array(css.length);
  for (const seg of scan(css)) kinds.fill(seg.kind, seg.from, seg.to);
  return kinds;
}

function N(css) {
  // Rules 1-2: each comment becomes one code space; string characters are kept and flagged.
  const toks = [];
  for (const seg of scan(css)) {
    if (seg.kind === "m") toks.push({ c: " ", s: false });
    else for (let k = seg.from; k < seg.to; k++) toks.push({ c: css[k], s: seg.kind === "s" });
  }
  // Rule 3.
  const a = [];
  for (const t of toks) {
    const ws = !t.s && WS.has(t.c);
    if (ws && a.length && a[a.length - 1].ws) continue;
    a.push(ws ? { c: " ", s: false, ws: true } : t);
  }
  // Rule 4: after rule 3 the neighbours of a space are never spaces.
  const b = a.filter((t, k) => {
    if (!t.ws) return true;
    const p = a[k - 1];
    const n = a[k + 1];
    if (p && !p.s && (AROUND.has(p.c) || p.c === ":")) return false;
    if (n && !n.s && AROUND.has(n.c)) return false;
    return true;
  });
  // Rule 5.
  const c = b.filter((t, k) => !(t.c === ";" && !t.s && b[k + 1] && !b[k + 1].s && b[k + 1].c === "}"));
  // Rule 6.
  while (c.length && c[0].ws) c.shift();
  while (c.length && c[c.length - 1].ws) c.pop();
  return c.map((t) => t.c).join("");
}

// ---------- .css format rule (spec Signatures `.css` 파일 형식) ----------

// Spec v3 definition, all outside strings and comments:
// after `{` or `;` only whitespace or comments until end of line; a line holding a code `}` holds nothing but whitespace, `}` and comments;
// a line that is neither blank nor comment-only is indented with 2 x (depth at line start, minus 1 when it starts with `}`) spaces;
// a line ending with `;` has no space before its first code `:` and exactly one space after it;
// a code line that neither ends with `{` nor starts with `}` ends with `;` or `,`.
function formatErrors(css) {
  const kinds = classify(css);
  const errors = [];
  const blank = (k) => kinds[k] === "m" || (kinds[k] === "c" && WS.has(css[k]));
  const code = (k, ch) => kinds[k] === "c" && css[k] === ch;
  let start = 0;
  let lineNo = 1;
  let depth = 0;
  for (let i = 0; i <= css.length; i++) {
    if (i < css.length && css[i] !== "\n") continue;
    const idx = [];
    for (let k = start; k < i; k++) idx.push(k);
    const shown = JSON.stringify(css.slice(start, i));
    const err = (msg) => errors.push(`line ${lineNo}: ${msg}: ${shown}`);
    for (let p = 0; p < idx.length; p++) {
      const k = idx[p];
      if ((code(k, "{") || code(k, ";")) && !idx.slice(p + 1).every(blank)) {
        err(`text after ${css[k]}`);
        break;
      }
    }
    if (idx.some((k) => code(k, "}")) && !idx.every((k) => blank(k) || code(k, "}"))) err("} not alone on its line");
    const solid = idx.filter((k) => !blank(k));
    if (solid.length) {
      const first = solid[0];
      const last = solid[solid.length - 1];
      const startsClose = code(first, "}");
      const lead = idx.filter((k) => k < first);
      if (lead.every((k) => kinds[k] === "c")) {
        const want = 2 * (depth - (startsClose ? 1 : 0));
        if (lead.some((k) => css[k] !== " ")) err("indentation is not spaces only");
        else if (lead.length !== want) err(`indentation ${lead.length}, want ${want}`);
      }
      if (code(last, ";")) {
        const colon = idx.find((k) => code(k, ":"));
        if (colon === undefined) err("declaration line without :");
        else if (WS.has(css[colon - 1] ?? "")) err("space before :");
        else if (css[colon + 1] !== " " || WS.has(css[colon + 2] ?? "")) err("not exactly one space after :");
      }
      if (!code(last, "{") && !startsClose && !code(last, ";") && !code(last, ",")) err("line does not end with ; or ,");
    }
    for (const k of idx) {
      if (code(k, "{")) depth++;
      else if (code(k, "}")) depth--;
    }
    start = i + 1;
    lineNo++;
  }
  return errors;
}

// Top-level rules of an N result: each ends at the code `}` where depth returns to 0; a trailing remainder is kept as a last piece.
function topRules(n) {
  const rules = [];
  let depth = 0;
  let from = 0;
  for (const seg of scan(n)) {
    if (seg.kind !== "c") continue;
    if (n[seg.from] === "{") depth++;
    else if (n[seg.from] === "}" && --depth === 0) {
      rules.push(n.slice(from, seg.to));
      from = seg.to;
    }
  }
  if (from < n.length) rules.push(n.slice(from));
  return rules;
}

const JOIN_TAIL = '].join("")';

function shapeErrors(text, n) {
  const t = text.trim();
  if (n === "") return t === '""' ? [] : [`N(css) is "" but the region text is ${JSON.stringify(t)}`];
  if (!t.startsWith("[") || !t.endsWith(JOIN_TAIL)) return [`region text does not start with [ and end with ${JOIN_TAIL}`];
  const ls = t.slice(1, -JOIN_TAIL.length).split("\n").map((l) => l.trim()).filter((l) => l !== "");
  const errors = [];
  const values = ls.map((l, i) => {
    const last = i === ls.length - 1;
    if (last && l.endsWith(",")) errors.push(`last line ends with ,: ${l}`);
    const lit = !last && l.endsWith(",") ? l.slice(0, -1) : l;
    try {
      const v = JSON.parse(lit);
      if (typeof v === "string") return v;
    } catch {}
    errors.push(`line ${i + 1} is not exactly one JSON string literal: ${l}`);
    return null;
  });
  const rules = topRules(n);
  if (values.length !== rules.length) errors.push(`${values.length} lines, want ${rules.length} top-level rules`);
  rules.forEach((r, i) => {
    if (values[i] !== undefined && values[i] !== null && values[i] !== r) errors.push(`line ${i + 1} value ${JSON.stringify(values[i])}, want rule ${JSON.stringify(r)}`);
  });
  return errors;
}

// ---------- marker region (spec Signatures 생성 구간) ----------

const END_MARKER = "/* css:end */";
const startMarker = (css) => `/* css:start ${css} */`;
const countRe = (text, re) => [...text.matchAll(re)].length;

function region(js, css) {
  const starts = countRe(js, /\/\*\s*css:start\b/g);
  const ends = countRe(js, /\/\*\s*css:end\b/g);
  if (starts !== 1 || ends !== 1) return { error: `css:start markers ${starts}, css:end markers ${ends} (want 1 and 1)` };
  const s = js.indexOf(startMarker(css));
  if (s < 0) return { error: `no start marker naming ${css} (want ${startMarker(css)})` };
  const textStart = s + startMarker(css).length;
  const e = js.indexOf(END_MARKER);
  if (e < 0) return { error: `no end marker ${END_MARKER}` };
  if (e < textStart) return { error: "css:end comes before css:start" };
  return { before: js.slice(0, textStart), text: js.slice(textStart, e), after: js.slice(e) };
}

function regionValue(js, css) {
  const r = region(js, css);
  assert.equal(r.error, undefined, `${css} region: ${r.error}`);
  let value;
  assert.doesNotThrow(() => {
    value = vm.runInNewContext(`(${r.text})`, {}, { timeout: 1000 });
  }, `${css} region does not evaluate as one expression in an empty context`);
  assert.equal(typeof value, "string", `${css} region evaluates to ${typeof value}, not a string`);
  return value;
}

function assertShape(js, css, n) {
  const r = region(js, css);
  assert.equal(r.error, undefined, `${css} region: ${r.error}`);
  assert.deepEqual(shapeErrors(r.text, n), [], `${css} region shape`);
}

// ---------- oracle self-checks (synthetic) ----------

test("oracle N: comment becomes one space, adjacent comments do not merge words", () => {
  assert.equal(N(".x/**/.y{a:b}"), ".x .y{a:b}");
  assert.equal(N(".x/*a*//*b*/.y{a:b}"), ".x .y{a:b}");
});

test("oracle N: unterminated comment or string throws", () => {
  assert.throws(() => N(".a{b:c}/* open"), /unterminated comment/);
  assert.throws(() => N('.a{content:"open}'), /unterminated string/);
  assert.throws(() => N(".a{content:'x\\'}"), /unterminated string/);
});

test("format checker: one declaration per line, } alone, braces in strings and comments ignored, passes", () => {
  const css = [
    "/* rationale { kept ; } */",
    ".a {",
    "  color: red; /* why */",
    "}",
    "@media (max-width: 600px) {",
    "  .b::after {",
    '    content: "{;} x";',
    "      /* comment-only line, any indent */",
    "  }",
    "}",
    ".c,",
    ".d {",
    "  margin: 0 auto;",
    "/*",
    "   multi-line rationale",
    "*/",
    "}",
    "",
  ].join("\n");
  assert.deepEqual(formatErrors(css), []);
  assert.deepEqual(formatErrors(css.replace(/\n/g, "\r\n")), [], "CRLF line ends");
});

const FORMAT_NEGATIVES = [
  ["two declarations on one line", ".a {\n  color: red; margin: 0;\n}\n", /line 2: text after ;/],
  ["declaration after {", ".a { color: red;\n}\n", /line 1: text after \{/],
  ["} after a declaration", ".a {\n  color: red;}\n", /line 2: \} not alone/],
  ["selector after }", ".a {\n  color: red;\n} .b {\n  margin: 0;\n}\n", /line 3: \} not alone/],
  ["string after ;", '.a {\n  color: red; "x"\n}\n', /line 2: text after ;/],
  ["4-space indent at depth 1", ".a {\n    color: red;\n}\n", /line 2: indentation 4, want 2/],
  ["tab indent", ".a {\n\tcolor: red;\n}\n", /line 2: indentation is not spaces only/],
  ["} indented at depth 1", ".a {\n  color: red;\n  }\n", /line 3: indentation 2, want 0/],
  ["missing final ;", ".a {\n  color: red\n}\n", /line 2: line does not end with ; or ,/],
  ["no space after :", ".a {\n  color:red;\n}\n", /line 2: not exactly one space after :/],
  ["two spaces after :", ".a {\n  color:  red;\n}\n", /line 2: not exactly one space after :/],
  ["space before :", ".a {\n  color : red;\n}\n", /line 2: space before :/],
];

for (const [label, css, re] of FORMAT_NEGATIVES) {
  test(`format checker: ${label} fails naming the line`, () => {
    const errors = formatErrors(css);
    assert.ok(errors.some((e) => re.test(e)), `errors: ${JSON.stringify(errors)}`);
  });
}

const markerJs = (inner) => `var A = 1;\nvar STYLE = ${inner};\n`;
const REGION_CASES = [
  ["well formed", markerJs('/* css:start x.css */"a{b:c}"/* css:end */'), null],
  ["start missing", markerJs('"a{b:c}"/* css:end */'), /css:start markers 0/],
  ["end missing", markerJs('/* css:start x.css */"a{b:c}"'), /css:end markers 0/],
  ["start twice", markerJs('/* css:start x.css */"a"/* css:end */') + "/* css:start x.css */\n", /css:start markers 2/],
  ["end before start", markerJs('/* css:end */"a"/* css:start x.css */'), /before/],
  ["start names another css", markerJs('/* css:start y.css */"a"/* css:end */'), /no start marker naming x\.css/],
];

for (const [label, js, re] of REGION_CASES) {
  test(`region parser: ${label}`, () => {
    const r = region(js, "x.css");
    if (re === null) {
      assert.equal(r.error, undefined);
      assert.equal(r.text, '"a{b:c}"');
    } else assert.match(String(r.error), re);
  });
}

test("oracle topRules: splits where depth returns to 0 outside strings", () => {
  assert.deepEqual(topRules('@media (x){.a{b:c}}.d{content:"}"}'), ["@media (x){.a{b:c}}", '.d{content:"}"}']);
  assert.deepEqual(topRules(""), []);
});

const SHAPE_N = "a{b:c}d{e:f}";
const SHAPE_CASES = [
  ["two rules on two lines", '\n[\n  "a{b:c}",\n  "d{e:f}"\n].join("")\n', SHAPE_N, null],
  ["empty N is a bare empty string", ' "" ', "", null],
  ["a single string for two rules", '"a{b:c}d{e:f}"', SHAPE_N, /does not start with \[/],
  ["two rules on one line", '[\n  "a{b:c}d{e:f}"\n].join("")', SHAPE_N, /1 lines, want 2/],
  ["two literals on one line", '[\n  "a{b:c}", "d{e:f}"\n].join("")', SHAPE_N, /not exactly one JSON string literal/],
  ["missing .join(\"\")", '[\n  "a{b:c}",\n  "d{e:f}"\n]', SHAPE_N, /does not start with \[ and end with/],
  ["trailing , on the last line", '[\n  "a{b:c}",\n  "d{e:f}",\n].join("")', SHAPE_N, /last line ends with ,/],
  ["rules out of order", '[\n  "d{e:f}",\n  "a{b:c}"\n].join("")', SHAPE_N, /line 1 value/],
  ["empty N written as an array", '[\n].join("")', "", /N\(css\) is ""/],
];

for (const [label, text, n, re] of SHAPE_CASES) {
  test(`shape checker: ${label}`, () => {
    const errors = shapeErrors(text, n);
    if (re === null) assert.deepEqual(errors, []);
    else assert.ok(errors.some((e) => re.test(e)), `errors: ${JSON.stringify(errors)}`);
  });
}

// ---------- VO-1 (FR-1, FR-4, C-1): real tree, five pairs ----------

const realPath = (f) => join(KIT, f);

for (const [js, css] of PAIRS) {
  test(`VO-1 C-1 ${js}: ${css} exists`, () => {
    assert.ok(existsSync(realPath(css)), `${KIT_REL}/${css} is missing`);
  });

  test(`VO-1 C-1 ${js}: exactly one css:start and one css:end marker, start before end`, () => {
    const text = readFileSync(realPath(js), "utf8");
    assert.equal(countRe(text, /\/\*\s*css:start\b/g), 1, "css:start marker count");
    assert.equal(countRe(text, /\/\*\s*css:end\b/g), 1, "css:end marker count");
    const s = text.search(/\/\*\s*css:start\b/);
    assert.ok(s < text.indexOf(END_MARKER), `${END_MARKER} is missing or before css:start`);
  });

  test(`VO-1 C-1 ${js}: the start marker names ${css}`, () => {
    const text = readFileSync(realPath(js), "utf8");
    assert.ok(text.includes(startMarker(css)), `${js} lacks ${startMarker(css)}`);
  });

  test(`VO-1 C-1 ${js}: the region evaluates to N(${css})`, () => {
    assert.ok(existsSync(realPath(css)), `${KIT_REL}/${css} is missing`);
    const want = N(readFileSync(realPath(css), "utf8"));
    assert.equal(regionValue(readFileSync(realPath(js), "utf8"), css), want);
  });

  test(`VO-1 C-1 ${js}: the region is [ one JSON string per top-level rule of N(${css}) ].join("")`, () => {
    assert.ok(existsSync(realPath(css)), `${KIT_REL}/${css} is missing`);
    assertShape(readFileSync(realPath(js), "utf8"), css, N(readFileSync(realPath(css), "utf8")));
  });

  test(`VO-1 FR-4 ${css}: format (one declaration per line, } lines, 2-space depth indent, prop: value;, final ;)`, () => {
    assert.ok(existsSync(realPath(css)), `${KIT_REL}/${css} is missing`);
    assert.deepEqual(formatErrors(readFileSync(realPath(css), "utf8")), []);
  });
}

// ---------- temp trees and the build.mjs css CLI ----------

const trees = [];
after(() => {
  for (const dir of trees) rmSync(dir, { recursive: true, force: true });
});

function makeTree() {
  const dir = mkdtempSync(join(tmpdir(), "ltt-kit-css-"));
  trees.push(dir);
  const kitFiles = readdirSync(KIT).filter((f) => /\.(js|css)$/.test(f) && statSync(join(KIT, f)).isFile());
  const rel = ["scripts/build.mjs", ".claude-plugin/plugin.json", "packages/ltt-kit/package.json", ...kitFiles.map((f) => `${KIT_REL}/${f}`)];
  for (const r of rel) {
    mkdirSync(dirname(join(dir, r)), { recursive: true });
    copyFileSync(join(ROOT, r), join(dir, r));
  }
  return dir;
}

const kitPath = (dir, f) => join(dir, KIT_REL, f);
const readKit = (dir, f) => readFileSync(kitPath(dir, f), "utf8");
const writeKit = (dir, f, text) => writeFileSync(kitPath(dir, f), text);

function runCss(dir, check) {
  const args = [join(dir, "scripts/build.mjs"), "css", ...(check ? ["--check"] : [])];
  const r = spawnSync(process.execPath, args, { cwd: dir, encoding: "utf8", timeout: 30_000 });
  assert.equal(r.error, undefined, `build.mjs css${check ? " --check" : ""} did not run: ${r.error?.message}`);
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

const show = (r) => `exit ${r.code}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`;
const snapshot = (dir) => Object.fromEntries(JS_FILES.map((f) => [f, readFileSync(kitPath(dir, f))]));
const changedSince = (dir, snap) => JS_FILES.filter((f) => !readFileSync(kitPath(dir, f)).equals(snap[f]));
const CSS_FILES = PAIRS.map(([, c]) => c);
const readOrNull = (p) => (existsSync(p) ? readFileSync(p) : null);
const cssSnapshot = (dir) => Object.fromEntries(CSS_FILES.map((f) => [f, readOrNull(kitPath(dir, f))]));
const cssChangedSince = (dir, snap) => CSS_FILES.filter((f) => {
  const now = readOrNull(kitPath(dir, f));
  return now === null || snap[f] === null ? now !== snap[f] : !now.equals(snap[f]);
});
const standalone = (digit) => new RegExp(`(?<!\\d)${digit}(?!\\d)`);

function assertExit(r, code, what) {
  assert.equal(r.code, code, `${what}: ${show(r)}`);
}

function assertStderrHas(r, tokens, what) {
  const missing = tokens.filter((t) => !r.stderr.includes(t));
  assert.deepEqual(missing, [], `${what}: stderr lacks ${missing.join(", ")}\n${show(r)}`);
}

// Whole file names only: a name preceded or followed by an identifier character, "-" or (before) "." is another name.
const nameRe = (name) => new RegExp(`(?<![\\w.-])${name.replace(/[.]/g, "\\.")}(?![\\w-])`);

function assertStderrLacks(r, names, what) {
  const present = names.filter((n) => nameRe(n).test(r.stderr));
  assert.deepEqual(present, [], `${what}: stderr names JS files that did not drift: ${present.join(", ")}\n${show(r)}`);
}

// A tree whose pristine copy is drift-free, so later failures are caused by the scenario edit alone.
function cleanTree() {
  const dir = makeTree();
  assertExit(runCss(dir, true), 0, "precondition: --check on a fresh copy of the real tree");
  return dir;
}

// C-3 "css 값 하나를 바꿈": replace the value of the first comment-free `prop: value;` line.
function changeFirstValue(css, value) {
  const kinds = classify(css);
  let off = 0;
  for (const line of css.split("\n")) {
    const m = /^(\s+[\w-]+:\s+)(.*\S)\s*;\s*$/.exec(line);
    const lineKinds = kinds.slice(off, off + line.length);
    if (m && lineKinds[0] === "c" && !lineKinds.includes("m") && m[2] !== value) {
      return css.slice(0, off) + `${m[1]}${value};` + (line.endsWith("\r") ? "\r" : "") + css.slice(off + line.length);
    }
    off += line.length + 1;
  }
  assert.fail("no `prop: value;` declaration line to change");
}

const driftRule = (n) => `\n.zz-drift-${n} {\n  color: red;\n}\n`;

// ---------- VO-2 (FR-3, E-1..E-5, C-2, C-3, C-5, C-6, C-7): scenarios ----------

test("VO-2 S1 C-2: node scripts/build.mjs css --check exits 0 on the real tree", { timeout: 60_000 }, () => {
  const r = spawnSync(process.execPath, [join(ROOT, "scripts/build.mjs"), "css", "--check"], { cwd: ROOT, encoding: "utf8", timeout: 30_000 });
  assert.equal(r.error, undefined, `build.mjs css --check did not run: ${r.error?.message}`);
  assert.equal(r.status, 0, `exit ${r.status}\nstderr: ${r.stderr}`);
});

let chain = null;
let chainCss = null;

test("VO-2 S2 C-3 E-5: after one ltt-deck.css value changes, --check exits 1 naming ltt-deck.js and no other JS, and writes nothing", { timeout: 60_000 }, () => {
  chain = cleanTree();
  chainCss = changeFirstValue(readKit(chain, "ltt-deck.css"), "zz-probe-value");
  writeKit(chain, "ltt-deck.css", chainCss);
  const snap = snapshot(chain);
  const cssSnap = cssSnapshot(chain);
  const r = runCss(chain, true);
  assertExit(r, 1, "--check after the edit");
  assertStderrHas(r, ["build.mjs css:", "ltt-deck.js"], "--check after the edit");
  assertStderrLacks(r, JS_FILES.filter((f) => f !== "ltt-deck.js"), "--check after the edit");
  assert.deepEqual(changedSince(chain, snap), [], "--check wrote JS files");
  assert.deepEqual(cssChangedSince(chain, cssSnap), [], "--check changed .css files");
});

test("VO-2 S3 C-3: css exits 0 printing 1, the ltt-deck.js region becomes N(new css) in rule-per-line shape, bytes outside the markers and the other four JS stay", { timeout: 60_000 }, () => {
  assert.ok(chain, "S2 did not set up the tree");
  const snap = snapshot(chain);
  const chainBefore = region(snap["ltt-deck.js"].toString("utf8"), "ltt-deck.css");
  assert.equal(chainBefore.error, undefined, `precondition region: ${chainBefore.error}`);
  const r = runCss(chain, false);
  assertExit(r, 0, "css after the edit");
  assert.match(r.stdout, standalone(1), `stdout has no standalone 1 (one file changed): ${show(r)}`);
  const js = readKit(chain, "ltt-deck.js");
  assert.equal(regionValue(js, "ltt-deck.css"), N(chainCss));
  assertShape(js, "ltt-deck.css", N(chainCss));
  assert.ok(N(chainCss).includes("zz-probe-value"), "precondition: the edited value is in N(new css)");
  const chainAfter = region(js, "ltt-deck.css");
  assert.equal(chainAfter.before, chainBefore.before, "bytes before the region changed");
  assert.equal(chainAfter.after, chainBefore.after, "bytes after the region changed");
  assert.deepEqual(changedSince(chain, snap), ["ltt-deck.js"], "only ltt-deck.js may be rewritten");
});

test("VO-2 S4 C-3: --check right after css exits 0", { timeout: 60_000 }, () => {
  assert.ok(chain, "S2 did not set up the tree");
  assertExit(runCss(chain, true), 0, "--check after css");
});

test("VO-2 S5 C-3: a second css changes no JS byte and prints 0", { timeout: 60_000 }, () => {
  assert.ok(chain, "S2 did not set up the tree");
  const snap = snapshot(chain);
  const r = runCss(chain, false);
  assertExit(r, 0, "second css");
  assert.match(r.stdout, standalone(0), `stdout has no standalone 0 (no file changed): ${show(r)}`);
  assert.deepEqual(changedSince(chain, snap), [], "second css rewrote JS files");
});

const EMPTY_CASES = [
  ["empty file", ""],
  ["comment only", "/* only a rationale comment { ; } */\n"],
];

for (const [label, css] of EMPTY_CASES) {
  test(`VO-2 S6 C-5: ${label} ltt-mock.css regenerates to "" without error`, { timeout: 60_000 }, () => {
    const dir = cleanTree();
    writeKit(dir, "ltt-mock.css", css);
    const r = runCss(dir, false);
    assertExit(r, 0, `css with ${label} ltt-mock.css`);
    assert.equal(regionValue(readKit(dir, "ltt-mock.js"), "ltt-mock.css"), "");
    assertShape(readKit(dir, "ltt-mock.js"), "ltt-mock.css", "");
  });
}

const replaceOnce = (text, from, to) => {
  assert.equal(text.split(from).length, 2, `precondition: ${JSON.stringify(from)} occurs once`);
  return text.replace(from, () => to);
};
const editJs = (js, f) => (dir) => writeKit(dir, js, f(readKit(dir, js)));
const editCss = (css, f) => (dir) => writeKit(dir, css, f(readKit(dir, css)));

// Every other pair is drifted first, so a generator that writes pair by pair before validating all five leaves a changed JS file.
const ERROR_CASES = [
  ["S7 E-1 ltt-ui.css missing", "ltt-ui.css", (dir) => rmSync(kitPath(dir, "ltt-ui.css")), ["build.mjs css:", "ltt-ui.css"]],
  ["S8 E-2 start marker missing in ltt-parts.js", "ltt-parts.css",
    editJs("ltt-parts.js", (t) => replaceOnce(t, startMarker("ltt-parts.css"), "")), ["build.mjs css:", "ltt-parts.js", "marker"]],
  ["S8 E-2 end marker missing in ltt-ui.js", "ltt-ui.css",
    editJs("ltt-ui.js", (t) => replaceOnce(t, END_MARKER, "")), ["build.mjs css:", "ltt-ui.js", "marker"]],
  ["S8 E-2 start marker twice in ltt-mock.js", "ltt-mock.css",
    editJs("ltt-mock.js", (t) => `${t}\n${startMarker("ltt-mock.css")}\n`), ["build.mjs css:", "ltt-mock.js", "marker"]],
  ["S8 E-2 end marker twice in ltt.js", "ltt.css",
    editJs("ltt.js", (t) => `${t}\n${END_MARKER}\n`), ["build.mjs css:", "ltt.js", "marker"]],
  ["S8 E-2 end marker before start marker in ltt-deck.js", "ltt-deck.css",
    editJs("ltt-deck.js", (t) => replaceOnce(replaceOnce(replaceOnce(t, startMarker("ltt-deck.css"), "\u0000"), END_MARKER, startMarker("ltt-deck.css")), "\u0000", END_MARKER)),
    ["build.mjs css:", "ltt-deck.js", "marker"]],
  ["S8 E-2 ltt-deck.js start marker names ltt-ui.css", "ltt-deck.css",
    editJs("ltt-deck.js", (t) => replaceOnce(t, startMarker("ltt-deck.css"), startMarker("ltt-ui.css"))), ["build.mjs css:", "ltt-deck.js", "marker"]],
  // Unterminated at depth 0 with nothing else wrong, so only the E-3 check can reject them.
  ["S9 E-3 unterminated comment in ltt-mock.css", "ltt-mock.css",
    editCss("ltt-mock.css", (t) => `${t}\n/* unterminated rationale\n`), ["build.mjs css:", "ltt-mock.css"]],
  ["S9 E-3 unterminated string in ltt-parts.css", "ltt-parts.css",
    editCss("ltt-parts.css", (t) => `${t}\n.zz-open::after {\n  content: "x";\n}\n"unterminated\n`), ["build.mjs css:", "ltt-parts.css"]],
  // Depth goes to -1 and back to 0, so a check of the final depth alone passes it.
  ["S10 E-4 extra } in ltt-ui.css (depth negative, final depth 0)", "ltt-ui.css",
    editCss("ltt-ui.css", (t) => `${t}\n}\n.zz-rebalance {\n  color: red;\n`), ["build.mjs css:", "ltt-ui.css"]],
  ["S10 E-4 missing } in ltt.css (final depth 1)", "ltt.css",
    editCss("ltt.css", (t) => `${t}\n.zz-open {\n  color: red;\n`), ["build.mjs css:", "ltt.css"]],
];

for (const [label, brokenCss, mutate, tokens] of ERROR_CASES) {
  test(`VO-2 ${label}: css and --check exit 1 with the names in stderr, all five JS unchanged`, { timeout: 60_000 }, () => {
    const dir = cleanTree();
    PAIRS.filter(([, c]) => c !== brokenCss).forEach(([, c], n) => writeKit(dir, c, readKit(dir, c) + driftRule(n)));
    mutate(dir);
    const snap = snapshot(dir);
    const cssSnap = cssSnapshot(dir);
    for (const check of [false, true]) {
      const what = check ? "css --check" : "css";
      const r = runCss(dir, check);
      assertExit(r, 1, what);
      assertStderrHas(r, tokens, what);
      assert.deepEqual(changedSince(dir, snap), [], `${what} changed JS files`);
      assert.deepEqual(cssChangedSince(dir, cssSnap), [], `${what} changed .css files`);
    }
  });
}

test("VO-2 S11 C-7 E-5: two drifted pairs make --check exit 1 naming ltt-parts.js and ltt-mock.js but not ltt.js, ltt-ui.js, ltt-deck.js, writing nothing", { timeout: 60_000 }, () => {
  const dir = cleanTree();
  for (const css of ["ltt-parts.css", "ltt-mock.css"]) writeKit(dir, css, changeFirstValue(readKit(dir, css), "zz-probe-value"));
  const snap = snapshot(dir);
  const cssSnap = cssSnapshot(dir);
  const r = runCss(dir, true);
  assertExit(r, 1, "--check with two drifted pairs");
  assertStderrHas(r, ["build.mjs css:", "ltt-parts.js", "ltt-mock.js"], "--check with two drifted pairs");
  assertStderrLacks(r, ["ltt.js", "ltt-ui.js", "ltt-deck.js"], "--check with two drifted pairs");
  assert.deepEqual(changedSince(dir, snap), [], "--check wrote JS files");
  assert.deepEqual(cssChangedSince(dir, cssSnap), [], "--check changed .css files");
});

// ---------- VO-3 (FR-1, C-4): N rules through the CLI, hand-written expected strings ----------

const SYNTAX_CASES = [
  ["rule 1 comment (one space in its place, unbalanced { inside)",
    "/* lead { rationale */\n.x/**/.y {\n  color: red; /* why: contrast */\n}\n.z{margin:0/* tail */}\n",
    ".x .y{color:red}.z{margin:0}"],
  ["rule 2 single-quoted string keeps { } ; , : /* and runs of spaces, \\' skipped",
    "a::before {\n  content: '} ; , :  /* x */ \\' {';\n}\n",
    "a::before{content:'} ; , :  /* x */ \\' {'}"],
  ["rule 2 double-quoted string keeps { , > and runs of spaces, \\\" skipped",
    'a[title="x , y > z"] {\n  font-family: "A  B", serif;\n  content: "{ \\" ;";\n}\n',
    'a[title="x , y > z"]{font-family:"A  B",serif;content:"{ \\" ;"}'],
  ["rule 2 trailing whitespace inside strings stays",
    "b::after {\n  content: \"end   \";\n  quotes: '  ' '\t';\n}\n",
    "b::after{content:\"end   \";quotes:'  ' '\t'}"],
  ["rule 3 tabs, CRLF and form feed collapse",
    "\t.a\t{\r\n\t\tborder:\t1px\t\tsolid;\r\n\t}\r\n.b\f.c {\r\n  margin:\f0;\r\n}\r\n",
    ".a{border:1px solid}.b .c{margin:0}"],
  ["rule 4 spaces around { } ; , > go",
    "ul  >  li , ol>li {\n  color:red ;\n  margin:0 ;\n}\n.z  {  }\n",
    "ul>li,ol>li{color:red;margin:0}.z{}"],
  ["rule 4 space after : goes",
    "a {\n  color:   blue;\n  transition: color .2s;\n}\n",
    "a{color:blue;transition:color .2s}"],
  ["rule 4 space before : stays (.a :hover)",
    ".a :hover ,.b  :focus {\n  color: red;\n}\n",
    ".a :hover,.b :focus{color:red}"],
  ["rule 3/4 spaces around + and - inside calc stay single",
    ".w {\n  width: calc(1px + 2px);\n  height: calc(100%  -  2 * 8px);\n}\n",
    ".w{width:calc(1px + 2px);height:calc(100% - 2 * 8px)}"],
  ["rule 5 ; right before } goes, other ; stay",
    ".p{color:red;}\n.q {\n  margin: 0;\n}\n.r{a:b;c:d}\n",
    ".p{color:red}.q{margin:0}.r{a:b;c:d}"],
  ["rule 5 applies once: ;;} keeps one ;",
    ".p{a:b;;}\n",
    ".p{a:b;}"],
  ["rule 5 after rule 4: ; } loses the ;",
    ".q{a:b; }\n.r {\n  c: d;  }\n",
    ".q{a:b}.r{c:d}"],
  ["nested @media and @keyframes",
    "@media (max-width: 600px) {\n  .a {\n    color: red;\n  }\n  .b > .c {\n    margin: 0 auto;\n  }\n}\n@keyframes k {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n",
    "@media (max-width:600px){.a{color:red}.b>.c{margin:0 auto}}@keyframes k{from{opacity:0}to{opacity:1}}"],
  ["rule 6 leading and trailing whitespace go",
    "\n\n  \t.a {\n  color: red;\n}\n\n \t \n",
    ".a{color:red}"],
];

for (const [label, css, want] of SYNTAX_CASES) {
  test(`oracle N C-4 ${label}: matches the hand-written string`, () => {
    assert.equal(N(css), want);
  });
}

let syntaxTree = null;
for (const [label, css, want] of SYNTAX_CASES) {
  test(`VO-3 C-4 ${label}: css regenerates ltt-mock.js to the hand-written string`, { timeout: 60_000 }, () => {
    syntaxTree ??= cleanTree();
    writeKit(syntaxTree, "ltt-mock.css", css);
    const r = runCss(syntaxTree, false);
    assertExit(r, 0, "css");
    assert.equal(regionValue(readKit(syntaxTree, "ltt-mock.js"), "ltt-mock.css"), want);
    assertShape(readKit(syntaxTree, "ltt-mock.js"), "ltt-mock.css", want);
  });
}

// ---------- VO-4 (FR-2, C-8): runtime <style> text in a vm with a stub document ----------

function stubDom() {
  const created = [];
  const textNode = (data) => ({ nodeType: 3, data: String(data) });
  const element = (tag) => {
    const el = {
      nodeType: 1,
      tagName: String(tag).toUpperCase(),
      id: "",
      textContent: "",
      innerHTML: "",
      childNodes: [],
      style: {},
      dataset: {},
      attrs: {},
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      setAttribute(k, v) {
        this.attrs[k] = String(v);
        if (k === "id") this.id = String(v);
      },
      getAttribute(k) {
        return k === "id" ? this.id || null : this.attrs[k] ?? null;
      },
      appendChild(c) {
        this.childNodes.push(c);
        return c;
      },
      append(...cs) {
        for (const c of cs) this.childNodes.push(typeof c === "string" ? textNode(c) : c);
      },
      addEventListener() {},
      removeEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => [],
    };
    created.push(el);
    return el;
  };
  const head = element("head");
  head.insertBefore = (c) => head.appendChild(c);
  head.prepend = (...cs) => head.append(...cs);
  const byId = (id) => created.find((e) => e.id === id) ?? null;
  const document = {
    readyState: "loading",
    head,
    documentElement: element("html"),
    currentScript: null,
    createElement: element,
    createElementNS: (ns, tag) => element(tag),
    createTextNode: textNode,
    getElementById: byId,
    querySelector: (sel) => (/^#[\w-]+$/.test(sel) ? byId(sel.slice(1)) : null),
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
  };
  const styleText = (id) => {
    const els = created.filter((e) => e.id === id);
    assert.equal(els.length, 1, `elements with id ${id} created: ${els.length}`);
    const el = els[0];
    assert.equal(el.tagName, "STYLE", `#${id} is a ${el.tagName}`);
    const kids = el.childNodes.filter((c) => c && c.nodeType === 3).map((c) => c.data).join("");
    return el.textContent || el.innerHTML || kids;
  };
  return { document, styleText };
}

const RUNTIME_CHAIN = ["vendor/d3.min.js", "ltt.js", "ltt-parts.js", "ltt-ui.js", "ltt-mock.js"];
let runtime = null;

function loadRuntime() {
  if (runtime) return runtime;
  const dom = stubDom();
  const noop = () => 0;
  const context = { console: { info() {}, warn() {}, log() {}, error() {} }, document: dom.document, setTimeout: noop, clearTimeout: noop, requestAnimationFrame: noop, URL };
  vm.createContext(context);
  for (const f of RUNTIME_CHAIN) {
    dom.document.currentScript = { src: `https://example.test/${KIT_REL}/${f}`, getAttribute: () => null, dataset: {} };
    assert.doesNotThrow(
      () => vm.runInContext(readFileSync(join(KIT, f), "utf8"), context, { filename: f }),
      `${f} threw while loading with the stub document (stub surface: createElement, head.appendChild, addEventListener, getElementById, currentScript; no matchMedia, no body)`,
    );
  }
  dom.document.currentScript = null;
  return (runtime = dom);
}

for (const [js, id] of [["ltt-parts.js", "ltt-parts-style"], ["ltt-ui.js", "ltt-ui-style"], ["ltt-mock.js", "ltt-mock-style"]]) {
  test(`VO-4 C-8 ${js}: #${id} text is N(${cssOf(js)})`, () => {
    const want = N(readFileSync(realPath(cssOf(js)), "utf8"));
    assert.equal(loadRuntime().styleText(id), want);
  });
}

test("VO-4 C-8 ltt.js: #ltt-style holds N(ltt.css) once, after a head starting with @font-face and before a :root[data-ltt-theme= tail", () => {
  const core = N(readFileSync(realPath("ltt.css"), "utf8"));
  assert.ok(core.length > 0, "N(ltt.css) is empty");
  const text = loadRuntime().styleText("ltt-style");
  const at = text.indexOf(core);
  assert.ok(at >= 0, "#ltt-style does not contain N(ltt.css)");
  assert.equal(text.indexOf(core, at + core.length), -1, "#ltt-style contains N(ltt.css) more than once");
  assert.ok(text.slice(0, at).startsWith("@font-face"), `head before N(ltt.css) starts with ${JSON.stringify(text.slice(0, 40))}`);
  assert.ok(text.slice(at + core.length).startsWith(":root[data-ltt-theme="), `tail after N(ltt.css) starts with ${JSON.stringify(text.slice(at + core.length, at + core.length + 40))}`);
});

// ---------- VO-6 (FR-6): npm scripts and the pre-commit hook ----------

test("VO-6 FR-6: package.json scripts build:css and check:css", () => {
  const scripts = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts ?? {};
  assert.equal(scripts["build:css"], "node scripts/build.mjs css");
  assert.equal(scripts["check:css"], "node scripts/build.mjs css --check");
});

test("VO-6 FR-6: scripts/git/pre-commit runs build.mjs css --check on a line after the build.mjs version line", () => {
  const ls = readFileSync(join(ROOT, "scripts/git/pre-commit"), "utf8").split(/\r?\n/);
  const live = (l) => !/^\s*#/.test(l);
  const version = ls.findIndex((l) => live(l) && l.includes("build.mjs") && /\bversion\b/.test(l));
  assert.ok(version >= 0, "pre-commit has no uncommented build.mjs version line");
  const check = ls.findIndex((l, i) => i > version && live(l) && l.includes("build.mjs") && l.includes("css --check"));
  assert.ok(check > version, "pre-commit has no uncommented build.mjs css --check line after the version line");
});

// GIT_* variables inherited from an outer hook would point git at the real repository instead of the temp tree.
const isolatedEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("GIT_")));

function runHook(dir) {
  const r = spawnSync("bash", [join(dir, "scripts/git/pre-commit")], { cwd: dir, env: isolatedEnv(), encoding: "utf8", timeout: 50_000 });
  assert.equal(r.error, undefined, `pre-commit did not run: ${r.error?.message}`);
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

let hookTree = null;

test("VO-6 FR-6: in a git-initialised temp tree without drift, bash scripts/git/pre-commit exits 0", { timeout: 60_000 }, () => {
  hookTree = makeTree();
  mkdirSync(join(hookTree, "scripts/git"), { recursive: true });
  copyFileSync(join(ROOT, "scripts/git/pre-commit"), join(hookTree, "scripts/git/pre-commit"));
  const g = spawnSync("git", ["init", "-q"], { cwd: hookTree, env: isolatedEnv(), encoding: "utf8" });
  assert.equal(g.status, 0, `git init failed: ${g.error?.message ?? g.stderr}`);
  const top = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: hookTree, env: isolatedEnv(), encoding: "utf8" });
  assert.equal(realpathSync(top.stdout.trim()), realpathSync(hookTree), "precondition: git resolves the temp tree as toplevel");
  const r = runHook(hookTree);
  assertExit(r, 0, "pre-commit in the temp tree");
});

test("VO-6 FR-6 UI-2: after one css value changes without regeneration, the temp-tree pre-commit exits non-zero", { timeout: 60_000 }, () => {
  assert.ok(hookTree, "the previous VO-6 test did not set up the tree");
  writeKit(hookTree, "ltt-deck.css", changeFirstValue(readKit(hookTree, "ltt-deck.css"), "zz-probe-value"));
  const r = runHook(hookTree);
  assert.notEqual(r.code, 0, `pre-commit passed with a drifted ltt-deck.css: ${show(r)}`);
});

test("VO-6 FR-6: bash scripts/git/pre-commit exits 0 on the real tree", { timeout: 60_000 }, () => {
  const r = spawnSync("bash", [join(ROOT, "scripts/git/pre-commit")], { cwd: ROOT, encoding: "utf8", timeout: 50_000 });
  assert.equal(r.error, undefined, `pre-commit did not run: ${r.error?.message}`);
  assert.equal(r.status, 0, `exit ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
});
