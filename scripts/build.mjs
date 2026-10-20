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

const cmds = { version: checkVersion, zip, kit };
const cmd = process.argv[2];
if (!cmds[cmd]) {
  console.error(`usage: build.mjs ${Object.keys(cmds).join("|")}`);
  process.exit(2);
}
mkdirSync(DIST, { recursive: true });
try {
  console.log(cmds[cmd](...process.argv.slice(3)));
} catch (e) {
  console.error(`build.mjs ${cmd}: ${e.message}`);
  process.exit(1);
}
