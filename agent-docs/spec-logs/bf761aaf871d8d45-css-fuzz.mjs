// This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
// Fuzz (spec bf761aaf871d8d45 VO-11): differential random testing of `node scripts/build.mjs css` against an independent N.
// Usage: node bf761aaf871d8d45-css-fuzz.mjs <repo> <out.json> [n=500] [seed=20261019]
// Each input becomes ltt-mock.css in a temp tree (same relative layout as the repo); oracle: region value === N(input),
// a second `css` run leaves every JS byte-identical, and `css --check` exits 0 right after.
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";

const [repo, outFile, nArg = "500", seedArg = "20261019"] = process.argv.slice(2);
const N_INPUTS = +nArg, SEED = +seedArg;
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(SEED), pick = (a) => a[Math.floor(rnd() * a.length)], int = (n) => Math.floor(rnd() * n);

// Independent N (spec Signatures rules 1-6).
function N(css) {
  let out = "", i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") { const e = css.indexOf("*/", i + 2); i = e + 2; if (!out.endsWith(" ")) out += " "; continue; }
    if (c === "'" || c === '"') { let j = i + 1; while (css[j] !== c) { if (css[j] === "\\") j++; j++; } out += css.slice(i, j + 1); i = j + 1; continue; }
    if (" \t\r\n\f".includes(c)) { if (!out.endsWith(" ") || /['"]$/.test(out)) out += " "; i++; continue; }
    out += c; i++;
  }
  let r = "", q = null;
  for (let k = 0; k < out.length; k++) {
    const c = out[k];
    if (q) { r += c; if (c === "\\") r += out[++k]; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"') { q = c; r += c; continue; }
    if (c === " ") { const p = r[r.length - 1], n = out[k + 1]; if (r === "" || "{};,>:".includes(p) || n === undefined || "{};,>".includes(n)) continue; }
    if (c === "}" && r.endsWith(";") && !q) r = r.slice(0, -1);
    r += c;
  }
  return r;
}

const WS = () => pick(["", " ", "  ", "\t", "\n", "\r\n", "\n    ", " \t "]);
const COMMENT = () => pick(["", "", "", "/* note */", "/*x{;}*/", "/* a, b: c */"]);
const STR = () => { const q = pick(["'", '"']); return q + pick(["$ ", "예) ", "lab vis vd", "a{b};c,d:e", "  two  spaces ", "/* not a comment */", "x"]) + q; };
const IDENT = () => pick(["a", ".dk-x", "#id", "button", ".a .b", ".a>b", ".a > b", "li:hover", ".a :focus-visible", "[data-x=y]", "*::before"]);
const SEL = () => Array.from({ length: 1 + int(3) }, IDENT).join(WS() + "," + WS());
const VAL = () => pick(["0", "1px", "calc(100% + 4px)", "calc(1px - 2px)", "var(--x,0)", "rgba(0,0,0,.3)", "0 1px 2px rgba(0, 0, 0, .05), 0 10px 30px red", STR(), "url(a.png)", "1px solid var(--c)", "repeat(3, 1fr)", "none!important"]);
const DECL = () => pick(["color", "margin", "content", "grid-template-areas", "--ltt-x", "box-shadow"]) + WS() + ":" + WS() + VAL();
const BLOCK = (depth) => {
  const decls = Array.from({ length: int(4) }, () => WS() + COMMENT() + DECL()).join(WS() + ";");
  return decls + (rnd() < 0.5 ? ";" : "") + WS();
};
function RULE(depth = 0) {
  const r = rnd();
  if (depth < 2 && r < 0.12) return "@media" + " (max-width:" + WS() + "760px)" + WS() + "{" + Array.from({ length: 1 + int(3) }, () => WS() + RULE(depth + 1)).join("") + WS() + "}";
  if (depth < 1 && r < 0.18) return "@keyframes k" + WS() + "{" + WS() + "from" + WS() + "{" + BLOCK(depth) + "}" + WS() + "to{" + BLOCK(depth) + "}" + WS() + "}";
  return SEL() + WS() + "{" + BLOCK(depth) + "}";
}
const INPUT = () => COMMENT() + Array.from({ length: int(6) }, () => WS() + COMMENT() + RULE()).join("") + WS();

function region(js, name) {
  const s = `/* css:start ${name} */`, a = js.indexOf(s), b = js.indexOf("/* css:end */", a);
  return vm.runInNewContext("(" + js.slice(a + s.length, b) + ")", {});
}

const tmp = mkdtempSync(join(tmpdir(), "ltt-css-fuzz-"));
const KIT = "skills/learn-to-tell/kit";
mkdirSync(join(tmp, "scripts"), { recursive: true }); mkdirSync(join(tmp, KIT), { recursive: true });
mkdirSync(join(tmp, ".claude-plugin"), { recursive: true }); mkdirSync(join(tmp, "packages/ltt-kit"), { recursive: true });
cpSync(join(repo, "scripts/build.mjs"), join(tmp, "scripts/build.mjs"));
for (const f of readdirSync(join(repo, KIT))) if (/\.(js|css)$/.test(f)) cpSync(join(repo, KIT, f), join(tmp, KIT, f));
cpSync(join(repo, ".claude-plugin/plugin.json"), join(tmp, ".claude-plugin/plugin.json"));
cpSync(join(repo, "packages/ltt-kit/package.json"), join(tmp, "packages/ltt-kit/package.json"));
const run = (...args) => spawnSync(process.execPath, [join(tmp, "scripts/build.mjs"), "css", ...args], { cwd: tmp, encoding: "utf8" });
const jsFiles = readdirSync(join(tmp, KIT)).filter((f) => f.endsWith(".js")).sort();
const snap = () => Object.fromEntries(jsFiles.map((f) => [f, readFileSync(join(tmp, KIT, f), "utf8")]));

const violations = [];
let execs = 0;
try {
  for (let k = 0; k < N_INPUTS; k++) {
    const input = INPUT();
    writeFileSync(join(tmp, KIT, "ltt-mock.css"), input);
    const r1 = run(); execs++;
    const want = N(input);
    let got = null, err = null;
    try { got = region(readFileSync(join(tmp, KIT, "ltt-mock.js"), "utf8"), "ltt-mock.css"); } catch (e) { err = String(e.message); }
    const before = snap();
    const r2 = run(); const after = snap();
    const r3 = run("--check");
    const bad = [];
    if (r1.status !== 0) bad.push("css exit " + r1.status + " " + r1.stderr.trim());
    if (err || got !== want) bad.push("region");
    if (r2.status !== 0 || JSON.stringify(before) !== JSON.stringify(after)) bad.push("not idempotent");
    if (r3.status !== 0) bad.push("check exit " + r3.status);
    if (bad.length) violations.push({ k, bad, input, want, got, err });
  }
} finally { rmSync(tmp, { recursive: true, force: true }); }
const out = { seed: SEED, inputs: N_INPUTS, cssRuns: execs, violations: violations.length, first: violations.slice(0, 5) };
writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log(`inputs=${N_INPUTS} violations=${violations.length}`);
