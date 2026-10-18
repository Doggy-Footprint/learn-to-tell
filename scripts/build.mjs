#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SKILL = join(ROOT, "skills/learn-to-tell");
const KIT_SRC = join(SKILL, "kit");
const DIST = join(ROOT, "dist");
const KIT_PKG = join(ROOT, "packages/ltt-kit");
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const version = () => readJson(".claude-plugin/plugin.json").version;

// plugin.json is the single version source; the kit package must match so a standalone lesson's pinned CDN URL
// (built from <skill>/VERSION in the zip) points at the kit that shipped with that skill.
function checkVersion() {
  const v = version(), kit = readJson("packages/ltt-kit/package.json").version;
  if (kit !== v) throw new Error(`packages/ltt-kit/package.json version ${kit} != .claude-plugin/plugin.json ${v}`);
  return v;
}

// claude.ai runs no hooks, so hooks/ is dropped; the gallery already lives outside the skill (site/gallery).
function zip() {
  const v = checkVersion();
  const stage = join(DIST, "stage");
  rmSync(stage, { recursive: true, force: true });
  const out = join(stage, "learn-to-tell");
  cpSync(SKILL, out, {
    recursive: true,
    filter: (src) => !["hooks", "__pycache__", ".DS_Store"].includes(basename(src)),
  });
  writeFileSync(join(out, "VERSION"), v + "\n");
  cpSync(join(ROOT, "LICENSE"), join(out, "LICENSE"));
  const file = join(DIST, "learn-to-tell.zip");
  rmSync(file, { force: true });
  execFileSync("zip", ["-qr", file, "learn-to-tell"], { cwd: stage });
  rmSync(stage, { recursive: true, force: true });
  return file;
}

function kit() {
  checkVersion();
  for (const f of ["vendor", "API.md", "api"]) rmSync(join(KIT_PKG, f), { recursive: true, force: true });
  for (const e of readdirSync(KIT_PKG, { withFileTypes: true })) {
    if (e.isFile() && /\.(js|css)$/.test(e.name)) rmSync(join(KIT_PKG, e.name));
  }
  cpSync(KIT_SRC, KIT_PKG, { recursive: true, filter: (src) => basename(src) !== ".DS_Store" });
  cpSync(join(ROOT, "LICENSE"), join(KIT_PKG, "LICENSE"));
  return KIT_PKG;
}

const CSS_MODULES = ["ltt", "ltt-parts", "ltt-ui", "ltt-mock", "ltt-deck"];
const START = "css:start", END = "css:end";

// Only comments, whitespace and the ; before } may differ between a .css file and its injected <style>: the kit's
// <style> bytes must stay identical to what the hand-written STYLE strings produced, and tests re-implement these rules.
function normalizeCss(css, name) {
  const toks = [];
  let depth = 0;
  for (let i = 0; i < css.length; ) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      const j = css.indexOf("*/", i + 2);
      if (j < 0) throw new Error(`${name}: unclosed comment`);
      if (toks[toks.length - 1] !== " ") toks.push(" ");
      i = j + 2;
    } else if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < css.length && css[j] !== c) j += css[j] === "\\" ? 2 : 1;
      if (j >= css.length) throw new Error(`${name}: unclosed string`);
      toks.push({ str: css.slice(i, j + 1) });
      i = j + 1;
    } else if (" \t\r\n\f".includes(c)) {
      if (toks[toks.length - 1] !== " ") toks.push(" ");
      i++;
    } else {
      if (c === "{") depth++;
      else if (c === "}" && --depth < 0) throw new Error(`${name}: unbalanced braces (extra })`);
      toks.push(c);
      i++;
    }
  }
  if (depth !== 0) throw new Error(`${name}: unbalanced braces (${depth} unclosed {)`);
  const spaced = toks.filter((t, k) => {
    if (t !== " ") return true;
    const prev = toks[k - 1], next = toks[k + 1];
    if (prev === undefined || next === undefined) return false;
    if (typeof prev === "string" && "{};,>:".includes(prev)) return false;
    if (typeof next === "string" && "{};,>".includes(next)) return false;
    return true;
  });
  const out = spaced.filter((t, k) => !(t === ";" && spaced[k + 1] === "}"));
  return out.map((t) => (typeof t === "string" ? t : t.str)).join("");
}

function topLevelRules(min) {
  const rules = [];
  let depth = 0, from = 0;
  for (let i = 0; i < min.length; i++) {
    const c = min[i];
    if (c === "'" || c === '"') {
      i++;
      while (min[i] !== c) i += min[i] === "\\" ? 2 : 1;
    } else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      rules.push(min.slice(from, i + 1));
      from = i + 1;
    }
  }
  if (from < min.length) rules.push(min.slice(from));
  return rules;
}

// Marker text inside a generated literal is escaped so a CSS string mentioning a marker cannot add a second marker.
function regionText(min, indent) {
  if (!min) return '""';
  const lines = topLevelRules(min).map((r) => indent + "  " + JSON.stringify(r).replace(/css:(start|end)/g, "css\\u003a$1"));
  return "[\n" + lines.join(",\n") + "\n" + indent + '].join("")';
}

function cssPair(mod) {
  const jsName = mod + ".js", cssName = mod + ".css";
  const cssPath = join(KIT_SRC, cssName), jsPath = join(KIT_SRC, jsName);
  if (!existsSync(cssPath)) throw new Error(`${cssName}: missing (paired with ${jsName})`);
  if (!existsSync(jsPath)) throw new Error(`${jsName}: missing (paired with ${cssName})`);
  const min = normalizeCss(readFileSync(cssPath, "utf8"), cssName);
  const js = readFileSync(jsPath, "utf8");
  const count = (tok) => js.split(tok).length - 1;
  if (count(START) !== 1 || count(END) !== 1) {
    throw new Error(`${jsName}: marker: expected one ${START} and one ${END}, found ${count(START)} and ${count(END)}`);
  }
  const start = /\/\* css:start (\S+) \*\//.exec(js), endAt = js.indexOf("/* " + END + " */");
  if (!start) throw new Error(`${jsName}: marker: start must read /* ${START} ${cssName} */`);
  if (endAt < 0) throw new Error(`${jsName}: marker: end must read /* ${END} */`);
  if (start[1] !== cssName) throw new Error(`${jsName}: marker: start names ${start[1]}, expected ${cssName}`);
  const from = start.index + start[0].length;
  if (endAt < from) throw new Error(`${jsName}: marker: ${END} comes before ${START}`);
  const indent = /^[ \t]*/.exec(js.slice(js.lastIndexOf("\n", start.index) + 1))[0];
  const next = js.slice(0, from) + regionText(min, indent) + js.slice(endAt);
  return { jsName, cssName, jsPath, changed: next !== js, next };
}

// Every pair is validated before anything is written so a bad .css never leaves the kit half regenerated.
function css(flag) {
  if (flag !== undefined && flag !== "--check") throw new Error(`unknown option ${flag} (usage: build.mjs css [--check])`);
  const pairs = [], errors = [];
  for (const mod of CSS_MODULES) {
    try { pairs.push(cssPair(mod)); } catch (e) { errors.push(e.message); }
  }
  if (errors.length) throw new Error(errors.join("\nbuild.mjs css: "));
  const drift = pairs.filter((p) => p.changed);
  if (flag === "--check") {
    if (drift.length) throw new Error(drift.map((p) => `${p.jsName}: drift (${p.cssName})`).join("\nbuild.mjs css: "));
    return `css in sync (${pairs.length} pairs)`;
  }
  for (const p of drift) writeFileSync(p.jsPath, p.next);
  return `${drift.length} file(s) regenerated` + (drift.length ? ": " + drift.map((p) => p.jsName).join(", ") : "");
}

const cmds = { version: checkVersion, zip, kit, css };
const cmd = process.argv[2];
if (!cmds[cmd]) {
  console.error(`usage: build.mjs ${Object.keys(cmds).join("|")} (css takes --check)`);
  process.exit(2);
}
mkdirSync(DIST, { recursive: true });
try {
  console.log(cmds[cmd](...process.argv.slice(3)));
} catch (e) {
  console.error(`build.mjs ${cmd}: ${e.message}`);
  process.exit(1);
}
