// R-1 (spec bf761aaf871d8d45 VO-8): byte comparison of the kit <style> texts in two ?audit DOM dump directories.
// Usage: node bf761aaf871d8d45-style-diff.mjs <base dump dir> <final dump dir> [out.json] [kit dir with the .css files]
// With a kit dir (spec v3, BV-2) each final dump is also checked by composition: parts/ui/mock/deck <style> === N(pair css),
// #ltt-style === base head + N(ltt.css) + base tail, so no static CSS can live outside the generated regions.
// Kit styles: #ltt-style, #ltt-parts-style, #ltt-ui-style, #ltt-mock-style and the deck's id-less <style> (starts "html,body{height:100%}").
// The only normalisation is the server origin in ltt.js's font URLs (each dump run uses a fresh port).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const [baseDir, finalDir, outFile, kitDir] = process.argv.slice(2);
// Independent N (spec Signatures rules 1-6), same as bf761aaf871d8d45-css-fuzz.mjs.
function N(css) {
  let out = "", i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") { const e = css.indexOf("*/", i + 2); i = e + 2; if (!out.endsWith(" ")) out += " "; continue; }
    if (c === "'" || c === '"') { let j = i + 1; while (css[j] !== c) { if (css[j] === "\\") j++; j++; } out += css.slice(i, j + 1); i = j + 1; continue; }
    if (" \t\r\n\f".includes(c)) { if (!out.endsWith(" ")) out += " "; i++; continue; }
    out += c; i++;
  }
  let r = "", q = null;
  for (let k = 0; k < out.length; k++) {
    const c = out[k];
    if (q) { r += c; if (c === "\\") r += out[++k]; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"') { q = c; r += c; continue; }
    if (c === " ") { const p = r[r.length - 1], n = out[k + 1]; if (r === "" || "{};,>:".includes(p) || n === undefined || "{};,>".includes(n)) continue; }
    if (c === "}" && r.endsWith(";")) r = r.slice(0, -1);
    r += c;
  }
  return r;
}
const CSS = kitDir ? Object.fromEntries(["ltt", "ltt-parts", "ltt-ui", "ltt-mock", "ltt-deck"].map((m) => [m, N(readFileSync(join(kitDir, m + ".css"), "utf8"))])) : null;
const KEY = { "ltt-parts-style": "ltt-parts", "ltt-ui-style": "ltt-ui", "ltt-mock-style": "ltt-mock", deck: "ltt-deck" };
function composition(a, b) {
  const bad = [];
  for (const [k, m] of Object.entries(KEY)) if (k in b && b[k] !== CSS[m]) bad.push(k);
  const base = a["ltt-style"], at = base.indexOf(CSS.ltt);
  if (at < 0 || base.indexOf(CSS.ltt, at + 1) >= 0) bad.push("ltt-style: N(ltt.css) not exactly once in base");
  else if (b["ltt-style"] !== base.slice(0, at) + CSS.ltt + base.slice(at + CSS.ltt.length)) bad.push("ltt-style");
  return bad;
}
const IDS = ["ltt-style", "ltt-parts-style", "ltt-ui-style", "ltt-mock-style"];
function styles(file) {
  const html = readFileSync(file, "utf8").replace(/127\.0\.0\.1:[0-9]+/g, "HOST");
  const out = {};
  for (const m of html.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)) {
    const id = (m[1].match(/id="([^"]+)"/) || [])[1];
    if (IDS.includes(id)) out[id] = m[2];
    else if (!id && m[2].startsWith("html,body{height:100%}")) out.deck = m[2];
  }
  return out;
}
const rows = [];
for (const name of readdirSync(baseDir).sort()) {
  const a = styles(join(baseDir, name)), b = styles(join(finalDir, name));
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  rows.push({ name, kinds: keys, differ: keys.filter((k) => a[k] !== b[k]), composition: CSS ? composition(a, b) : null, bytes: Object.fromEntries(keys.map((k) => [k, [a[k]?.length ?? null, b[k]?.length ?? null]])) });
}
const bad = rows.filter((r) => r.differ.length || (r.composition && r.composition.length) || !r.kinds.includes("ltt-style") || !r.kinds.includes("deck"));
const out = { files: rows.length, composition: !!CSS, bad: bad.length, badFiles: bad.map((r) => [r.name, r.differ, r.composition]), rows };
if (outFile) writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log(`files=${rows.length} styleDiff=${bad.length}${CSS ? " composition=on" : ""}`);
