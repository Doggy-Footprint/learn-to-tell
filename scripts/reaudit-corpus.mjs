#!/usr/bin/env node
// Usage: node scripts/reaudit-corpus.mjs <set-dir>... [--stage first|final] [--checkout <repo dir>] [--out <dir>] [--json]
// Re-audits generated lessons from measurement sets with the kit of <checkout> (default: this repo).
// --stage first takes the first Write of lesson.html from each run's out.jsonl, so the count stands in for how much
// fixing a new kit would leave to the agent; --stage final audits the published lesson.
// Severity comes from the audit's own `severity` field when the checkout has one, otherwise from the 권고 list in
// this repo's SKILL.md, so two checkouts are compared under the same classification.
import { execFileSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : dflt; };
const stage = opt("--stage", "first");
const checkout = resolve(opt("--checkout", REPO));
const out = resolve(opt("--out", mkdtempSync(join(tmpdir(), "ltt-reaudit-"))));
const json = args.includes("--json");
const sets = args.filter((a) => !a.startsWith("--"));
if (!sets.length || !["first", "final"].includes(stage)) {
  console.error("usage: node scripts/reaudit-corpus.mjs <set-dir>... [--stage first|final] [--checkout <repo dir>] [--out <dir>] [--json]");
  process.exit(2);
}

function advisoryIds() {
  const skill = readFileSync(join(REPO, "skills", "learn-to-tell", "SKILL.md"), "utf8");
  const line = skill.split("\n").find((l) => l.includes("**권고**"));
  return new Set([...(line ?? "").split("**고침**")[0].matchAll(/`([a-z-]+)`/g)].map((m) => m[1]));
}

function firstWrite(outFile) {
  for (const line of readFileSync(outFile, "utf8").split("\n")) {
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.type !== "assistant" || o.parent_tool_use_id) continue;
    for (const c of o.message?.content ?? []) {
      if (c.type === "tool_use" && c.name === "Write" && /lesson\.html$/.test(c.input?.file_path ?? "")) return c.input.content;
    }
  }
  return null;
}

function finalLesson(runDir) {
  const lessons = join(runDir, "home", "lessons");
  const id = existsSync(lessons) ? readdirSync(lessons).find((d) => existsSync(join(lessons, d, "lesson.html"))) : null;
  return id ? readFileSync(join(lessons, id, "lesson.html"), "utf8") : null;
}

const home = join(out, "home");
const targets = [];
for (const set of sets) {
  const runs = join(set, "runs");
  for (const run of readdirSync(runs).sort()) {
    const runDir = join(runs, run);
    if (!existsSync(join(runDir, "out.jsonl"))) continue;
    const html = stage === "first" ? firstWrite(join(runDir, "out.jsonl")) : finalLesson(runDir);
    if (!html) continue;
    const id = `${set.replace(/\/+$/, "").split("/").pop()}-${run}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    mkdirSync(join(home, "lessons", id), { recursive: true });
    writeFileSync(join(home, "lessons", id, "lesson.html"), html);
    targets.push(id);
  }
}

const audit = join(checkout, "skills", "learn-to-tell", "server", "audit.mjs");
// Older audit.mjs calls process.exit right after printing, which truncates a piped stdout past 64 KB; a file is written in full.
const report = join(out, "audit.json");
const fd = openSync(report, "w");
try {
  execFileSync("node", [audit, "--home", home, "--json", ...targets], { stdio: ["ignore", fd, "inherit"] });
} catch (e) {
  if (e.status !== 1 && e.status !== 2) throw e;
} finally {
  closeSync(fd);
}
const parsed = JSON.parse(readFileSync(report, "utf8"));
const results = Array.isArray(parsed) ? parsed : parsed.results ?? [];
const advisory = advisoryIds();
const sev = (w) => w.severity ?? (advisory.has(w.rule) ? "advise" : "fix");

const perRun = {};
const byRule = {};
for (const r of results) {
  const id = r.target.split("/")[1];
  const row = (perRun[id] ||= { fix: 0, advise: 0, lint: 0, expect: 0, errors: 0 });
  if (r.error) { row.errors += 1; continue; }
  for (const w of r.audit) {
    row[sev(w)] += 1;
    const k = `${w.rule}·${sev(w)}`;
    byRule[k] = (byRule[k] ?? 0) + 1;
  }
  row.lint += r.lint.length;
  row.expect += r.expectFails.length;
  for (const w of r.lint) byRule[`lint:${w.rule ?? "?"}`] = (byRule[`lint:${w.rule ?? "?"}`] ?? 0) + 1;
}
const totals = Object.values(perRun).reduce((t, r) => { for (const k in r) t[k] = (t[k] ?? 0) + r[k]; return t; }, {});

if (json) console.log(JSON.stringify({ checkout, stage, home, perRun, byRule, totals }, null, 2));
else {
  console.log(`checkout ${checkout} · stage ${stage} · ${targets.length} lessons · home ${home}`);
  for (const [id, r] of Object.entries(perRun)) console.log(`${id}\tfix ${r.fix}\tadvise ${r.advise}\tlint ${r.lint}\texpect ${r.expect}${r.errors ? `\terrors ${r.errors}` : ""}`);
  console.log(`total\tfix ${totals.fix}\tadvise ${totals.advise}\tlint ${totals.lint}\texpect ${totals.expect}\terrors ${totals.errors}`);
  for (const [k, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`  ${k}\t${n}`);
}
