// This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
// R-3 (spec bf761aaf871d8d45 VO-12): source review of the kit JS outside the css:start/css:end regions, the .css comments,
// untouched author-facing docs and the zip contents. Usage: node bf761aaf871d8d45-r3-source.mjs <repo> <base commit>
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const [repo, base] = process.argv.slice(2);
const KIT = join(repo, "skills/learn-to-tell/kit");
const MODS = ["ltt", "ltt-parts", "ltt-ui", "ltt-mock", "ltt-deck"];
// Spec v3 (BV-2): string, single-quote and template literals outside comments, so concatenated or single-quoted CSS is seen.
// A "/" starts a regex literal after an operator-like character; otherwise it is division.
function literals(src) {
  const outL = [];
  let i = 0, prev = "";
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") { i = src.indexOf("\n", i); if (i < 0) break; continue; }
    if (c === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i + 2) + 2; continue; }
    if (c === "'" || c === '"' || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      outL.push(src.slice(i + 1, j)); i = j + 1; prev = c; continue;
    }
    if (c === "/" && (prev === "" || "(,=:[!&|?{};+-*%<>~^".includes(prev))) {
      let j = i + 1, cls = false;
      while (j < src.length && (cls || src[j] !== "/")) { if (src[j] === "\\") j++; else if (src[j] === "[") cls = true; else if (src[j] === "]") cls = false; j++; }
      i = j + 1; prev = "/"; continue;
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return outL;
}
const out = { outside: {}, link: {}, comments: {}, docsDiff: null, zipCss: [] };
for (const m of MODS) {
  const js = readFileSync(join(KIT, m + ".js"), "utf8");
  const a = js.indexOf(`/* css:start ${m}.css */`), b = js.indexOf("/* css:end */");
  const rest = js.slice(0, a) + js.slice(b);
  out.outside[m] = literals(rest).filter((l) => (l.includes("{") && l.includes(":")) || /\}\s*$/.test(l)).map((l) => l.slice(0, 90));
  out.link[m] = [...js.matchAll(/createElement\(["']link["']\)|<link|\.css["'`]|rel\s*=\s*["']stylesheet/g)].map((x) => x[0]);
  out.comments[m] = [...readFileSync(join(KIT, m + ".css"), "utf8").matchAll(/\/\*([\s\S]*?)\*\//g)].map((x) => x[1].trim());
}
out.docsDiff = execFileSync("git", ["diff", "--stat", base, "--", "skills/learn-to-tell/standalone.md", "skills/learn-to-tell/kit/API.md", "skills/learn-to-tell/SKILL.md"], { cwd: repo, encoding: "utf8" }).trim();
const zip = execFileSync(process.execPath, [join(repo, "scripts/build.mjs"), "zip"], { cwd: repo, encoding: "utf8" }).trim();
out.zipCss = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" }).split("\n").filter((f) => /kit\/[^/]+\.css$/.test(f)).sort();
console.log(JSON.stringify(out, null, 1));
