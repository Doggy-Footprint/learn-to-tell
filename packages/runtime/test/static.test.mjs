// VO-18 (QR-5, QR-13) bundle/SKILL bytes and module boundary scan; VO-20 (FR-40, FR-41) contract JSDoc and rules.md status;
// VO-22 unit part (FR-60, FR-61, C-57); QR-7 tone contrast (own WCAG formula, not the exported contrast()).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, RT, DIST, LAYOUT, wcag } from "./fixtures/m1.mjs";

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

// ---------- QR-13 ----------
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/.*$/gm, "$1");
const stripStrings = (s) => s.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g, '""');
const GLOBALS = ["window", "document"];
/** A global is referenced unless the file declares a local binding of that name (variable, parameter, destructured name). */
const declares = (s, name) => new RegExp(`(?:\\b(?:const|let|var|function)\\s+${name}\\b|[({,]\\s*${name}\\s*(?:[,)}=:]|\\)\\s*=>))`).test(s);
function scanText(text) {
  const hits = [];
  const raw = stripComments(text);
  const imp = /(?:from\s*|import\s*\(\s*|import\s+|require\s*\(\s*)["'](react|react-dom|motion|framer-motion)(?:\/[^"']*)?["']/g;
  for (const m of raw.matchAll(imp)) hits.push(`import ${m[1]}`);
  const s = stripStrings(raw);
  for (const g of GLOBALS) {
    const explicit = new RegExp(`typeof\\s+${g}\\b|globalThis\\s*\\.\\s*${g}\\b`, "g");
    const bare = new RegExp(`(?<![\\w$.])${g}(?![\\w$])`, "g");
    const n = declares(s, g) ? (s.match(explicit) ?? []).length : (s.match(bare) ?? []).length;
    if (n) hits.push(g);
  }
  return hits;
}
test("VO-18 QR-13 scanner self-check: flags real references, ignores comments/strings/local names", () => {
  assert.deepEqual(scanText(`import React from "react";`), ["import react"]);
  assert.deepEqual(scanText(`const m = await import("motion/react");`), ["import motion"]);
  assert.deepEqual(scanText(`const w = window.innerWidth;`), ["window"]);
  assert.deepEqual(scanText(`if (typeof document !== "undefined") {}`), ["document"]);
  assert.deepEqual(scanText(`const el = document.createElement("div");`), ["document"]);
  assert.deepEqual(scanText(`const w = globalThis.window; const window = 1;`), ["window"]);
  assert.deepEqual(scanText(`// window.x\nconst s = "camera window"; /* document */`), []);
  assert.deepEqual(scanText(`const window = cam(t); use(window.x[0]);`), []);
  assert.deepEqual(scanText(`function f({ window }) { return window; }`), []);
});
test("VO-18 QR-13 src/layout, src/check, src/core: no react/react-dom/motion import and no window/document reference", () => {
  const files = ["layout", "check", "core"].flatMap((d) => walk(path.join(RT, "src", d))).filter((f) => /\.(m?js|ts)$/.test(f));
  assert.ok(files.length >= 3, "module files exist");
  const hits = files.flatMap((f) => scanText(fs.readFileSync(f, "utf8")).map((h) => `${path.relative(RT, f)}: ${h}`));
  // A local binding named window (e.g. a camera window) is not the DOM global; only typeof/globalThis access counts then.
  assert.deepEqual(hits, []);
});

// ---------- QR-5 ----------
test("VO-18 QR-5 first-load bundle (ltt-runtime.js + its static imports, lazy chunks excluded) ≤ 400,000 B", () => {
  const entry = path.join(DIST, "ltt-runtime.js");
  assert.ok(fs.existsSync(entry), "run npm run build:runtime first");
  const seen = new Set();
  const visit = (f) => {
    if (seen.has(f)) return;
    seen.add(f);
    const s = fs.readFileSync(f, "utf8");
    for (const m of s.matchAll(/(?:^|[;\s}])(?:import|export)\s*(?:[\w*{}\s,$]+from\s*)?["'](\.{1,2}\/[^"']+)["']/g)) visit(path.resolve(path.dirname(f), m[1]));
  };
  visit(entry);
  const bytes = [...seen].reduce((n, f) => n + fs.statSync(f).size, 0);
  assert.ok(bytes <= 400000, `first-load bytes ${bytes} over ${seen.size} files`);
});
test("VO-18 QR-5 SKILL.md ≤ 12,000 B", () => {
  const n = fs.statSync(path.join(ROOT, "skill/learn-to-tell/SKILL.md")).size;
  assert.ok(n > 0 && n <= 12000, `${n} B`);
});

// ---------- VO-22 unit ----------
test("VO-22 C-57 SKILL.md names the FR-60 anchors (reading order files, commands, runtime-issues.md, verify-answers.md)", () => {
  const s = read("skill/learn-to-tell/SKILL.md");
  for (const k of ["lesson.d.ts", "ltt check", "ltt sheet", "ltt digest", "runtime-issues.md", "verify-answers.md", "illustrative"]) assert.ok(s.includes(k), k);
  for (const m of ["polar", "lanes", "space3d", "glyph", "icon", "inset", "field"]) assert.ok(s.includes(m), `unimplemented list has ${m}`);
  assert.match(s, /\[0,\s*1\]/, "graph at in [0,1]²");
});
test("VO-22 verify-answers.md: three verdicts and a table output", () => {
  const s = read("skill/learn-to-tell/verify-answers.md");
  for (const k of ["일치", "불일치", "판정 불가"]) assert.ok(s.includes(k), k);
  assert.match(s, /^\|.*\|\s*$/m, "table row");
  assert.match(s, /^\|\s*:?-{3,}/m, "table separator");
  assert.ok(s.includes("## 문항") || s.includes("문항"), "refers to the question part");
  assert.ok(s.includes("정답 키"), "refers to the answer key");
});

// ---------- VO-20 ----------
const DTS = "packages/runtime/types/lesson.d.ts";
const jsdocBefore = (src, decl) => {
  const i = src.indexOf(decl);
  assert.ok(i >= 0, decl);
  const blocks = [...src.slice(0, i).matchAll(/\/\*\*[\s\S]*?\*\//g)];
  const last = blocks.at(-1);
  const between = src.slice(last.index + last[0].length, i);
  assert.equal(between.trim(), "", `JSDoc directly precedes ${decl}`);
  return last[0];
};
test("VO-20 FR-40 lesson.d.ts ≤ 21,000 B and types unchanged since base commit (JSDoc-only diff)", () => {
  assert.ok(fs.statSync(path.join(ROOT, DTS)).size <= 21000);
  const base = execFileSync("git", ["show", `08c85ef361d68c260dc42b1fdcc0e7167291c07a:${DTS}`], { cwd: ROOT, encoding: "utf8" });
  const norm = (s) => s.replace(/\/\*\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
  assert.equal(norm(read(DTS)), norm(base));
});
test("VO-20 FR-40 JSDoc: cells row 0 is the top row", () => {
  assert.match(jsdocBefore(read(DTS), "cells(o:"), /row/i);
  assert.match(jsdocBefore(read(DTS), "cells(o:"), /\btop\b|down/i);
});
test("VO-20 FR-40 JSDoc: graph at window and layout fixed across t/step", () => {
  const src = read(DTS);
  const g = jsdocBefore(src, "graph(o:") + jsdocBefore(src, "node(id:");
  assert.match(g, /\[0,\s*1\]/);
  assert.match(g, /\bonce\b|union|fixed|stable|do(?:es)? not move|never move/i, "layout fixed over the scene");
  assert.match(g, /\btime\b|\bt\b|step|sample/i, "fixed across time/steps");
});
test("VO-20 FR-40 JSDoc: geo regions and great-circle lines", () => {
  const s = read(DTS) + read("packages/runtime/types/ext/geo.d.ts");
  assert.match(s, /great[- ]circle/i);
  const g = read("packages/runtime/types/ext/geo.d.ts");
  for (const r of ["world", "europe", "asia", "east-asia", "southeast-asia", "south-asia", "middle-east", "africa", "north-america", "south-america", "oceania", "atlantic", "indian-ocean", "pacific"]) assert.match(g, new RegExp(`(^|[^\\w-])${r}([^\\w-]|$)`), `ext/geo.d.ts names region ${r}`);
  const REGIONS = ["europe", "asia", "east-asia", "southeast-asia", "south-asia", "middle-east", "africa", "north-america", "south-america", "oceania", "atlantic", "indian-ocean", "pacific"];
  assert.ok(REGIONS.filter((r) => new RegExp(`["'\\s,(]${r}["'\\s,)]`).test(s)).length >= 3, "names regions");
});
test("VO-20 FR-40 JSDoc: mock box is the content area; children use parent coordinates", () => {
  const d = jsdocBefore(read(DTS), "mock(kind:");
  assert.match(d, /content/i);
  assert.match(d, /parent|frame/i);
});

const rows = () => {
  const lines = read("packages/runtime/rules.md").split("\n").filter((l) => l.trim().startsWith("|"));
  const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim());
  return Object.fromEntries(lines.slice(2).map(cells).map((r) => [r[0].replace(/`/g, ""), r]));
};
test("VO-20 FR-41 rules.md: predict-reveal-hidden and custom-bounds enforced (runtime, M1)", () => {
  const R = rows();
  for (const id of ["predict-reveal-hidden", "custom-bounds"]) assert.match(R[id].at(-1), /강제됨\s*\(runtime,\s*M1\)/, id);
});
test("VO-20 FR-41 rules.md: 7 pulled rules and stub rules enforced (ltt check, M1)", () => {
  const R = rows();
  for (const id of ["data-in-domain", "goal-reachable", "goal-at-start", "reveal-marks-exist", "input-binding", "term-defined-before-use", "accent-focus-only", "focus-unknown-id", "model-pure", "figure-eval", "handle-binding", "multiples-param", "reveal-figure-exists"]) {
    assert.ok(R[id], `row ${id}`);
    assert.match(R[id].at(-1), /강제됨\s*\(ltt check,\s*M1\)/, id);
  }
});
test("VO-20 rules.md row reveal-marks-exist has 6 non-empty cells (spec v4)", () => {
  const r = rows()["reveal-marks-exist"];
  assert.ok(r, "row exists");
  assert.equal(r.length, 6);
  assert.ok(r.every((c) => c.length > 0));
});
test("VO-20 FR-41 rules.md: label-anchor is SKILL rule + runtime placement (undetectable)", () => {
  const st = rows()["label-anchor"].at(-1);
  assert.ok(st.includes("SKILL 규칙") && st.includes("runtime 배치") && st.includes("감지 불가"), st);
});

// ---------- QR-7 tone contrast and the exported contrast() ----------
const { TONES, BACKGROUND, contrast } = await import(LAYOUT);
test("VO-15 QR-7 focus, series1–6, good/warn/bad tones have ≥ 3:1 against BACKGROUND (own WCAG formula)", () => {
  for (const t of ["focus", "series1", "series2", "series3", "series4", "series5", "series6", "good", "warn", "bad"]) {
    const c = wcag(TONES[t], BACKGROUND);
    assert.ok(c >= 3, `${t} ${TONES[t]} ${c.toFixed(2)}`);
  }
  assert.deepEqual(Object.keys(TONES).sort(), ["bad", "focus", "good", "muted", "ref", "series1", "series2", "series3", "series4", "series5", "series6", "warn"]);
});
test("VO-15 contrast() agrees with the independent WCAG formula (black/white 21, equal 1, sample pairs)", () => {
  assert.ok(Math.abs(contrast("#000000", "#ffffff") - 21) < 1e-6);
  assert.ok(Math.abs(contrast("#777777", "#777777") - 1) < 1e-9);
  for (const [a, b] of [["#336699", "#ffffff"], ["#b3261e", "#fafafa"], [TONES.series1, BACKGROUND]]) assert.ok(Math.abs(contrast(a, b) - wcag(a, b)) < 0.01, `${a} ${b}`);
});
