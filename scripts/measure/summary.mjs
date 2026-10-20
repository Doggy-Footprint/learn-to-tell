#!/usr/bin/env node
// Usage: node scripts/measure/summary.mjs <set-dir>... [--json]
// One row per <set-dir>/runs/<run>/: cost from transcripts/<run>/*.jsonl (transcript-cost.mjs), loop shape from out.jsonl,
// content guard from the final lesson. Means per variant (<topic>-<variant>-<rep>) follow the rows.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COST = join(dirname(fileURLToPath(import.meta.url)), "..", "transcript-cost.mjs");

function loopShape(outFile) {
  const s = { turns: 0, edits: 0, writes: 0, audits: 0, sheetReads: 0, agents: 0, lastEditAudited: false, usd: null, version: null, seq: [] };
  const ids = new Set();
  for (const line of readFileSync(outFile, "utf8").split("\n")) {
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.type === "system" && o.subtype === "init") s.version = o.claude_code_version ?? null;
    if (o.type === "result") s.usd = o.total_cost_usd ?? null;
    if (o.type !== "assistant" || o.parent_tool_use_id) continue;
    if (o.message?.id && !ids.has(o.message.id)) { ids.add(o.message.id); s.turns += 1; }
    for (const c of o.message?.content ?? []) {
      if (c.type !== "tool_use") continue;
      const i = c.input ?? {};
      if (c.name === "Bash" && /(audit|check)\.mjs/.test(i.command ?? "") && !/--cover/.test(i.command ?? "")) { s.audits += 1; s.seq.push("A"); }
      else if ((c.name === "Edit" || c.name === "MultiEdit") && /lesson\.html$/.test(i.file_path ?? "")) { s.edits += 1; s.seq.push("E"); }
      else if (c.name === "Write" && /lesson\.html$/.test(i.file_path ?? "")) { s.writes += 1; s.seq.push("W"); }
      else if (c.name === "Read" && /(sheet[^/]*|\/check\/s\d\d)\.jpg$/.test(i.file_path ?? "")) s.sheetReads += 1;
      else if (c.name === "Agent" || c.name === "Task") s.agents += 1;
    }
  }
  const lastMod = Math.max(s.seq.lastIndexOf("E"), s.seq.lastIndexOf("W"));
  s.lastEditAudited = s.seq.lastIndexOf("A") > lastMod;
  delete s.seq;
  return s;
}

function content(runDir) {
  const lessons = join(runDir, "home", "lessons");
  const id = existsSync(lessons) ? readdirSync(lessons).find((d) => existsSync(join(lessons, d, "lesson.html"))) : null;
  if (!id) return { htmlBytes: null, hangul: null, scenes: null, fixLeft: null };
  const html = readFileSync(join(lessons, id, "lesson.html"), "utf8");
  // Prose is Korean and drawing code is ASCII, so the Hangul count tracks prose without moving when figure code shrinks.
  const hangul = (html.match(/[가-힣]/g) ?? []).length;
  let scenes = null, fixLeft = null;
  const final = join(runDir, "final-check.json");
  if (existsSync(final)) {
    try {
      const [r] = JSON.parse(readFileSync(final, "utf8"));
      const d = r.modes.desktop, m = r.modes.mobile;
      scenes = d ? d.scenes.length : null;
      fixLeft = r.errors.length + [d, m].filter(Boolean).reduce((n, rep, k) => n + rep.scenes.reduce((a, sc) => a + sc.issues.length, 0) + rep.console.length + (k ? 0 : rep.lint.filter((l) => l.level === "fix").length + rep.expect.length), 0);
    } catch { /* an unreadable check leaves the guard empty rather than wrong */ }
  }
  const audit = join(runDir, "final-audit.json");
  if (scenes == null && existsSync(audit)) {
    try {
      const rs = JSON.parse(readFileSync(audit, "utf8"));
      const list = Array.isArray(rs) ? rs : rs.results ?? [];
      scenes = Math.max(...list.map((r) => r.scenes ?? 0));
      fixLeft = list.reduce((n, r) => n + (r.lint?.length ?? 0) + (r.expectFails?.length ?? 0) + (r.audit ?? []).filter((w) => w.severity === "fix").length, 0);
    } catch { /* an unreadable audit leaves the guard empty rather than wrong */ }
  }
  return { htmlBytes: statSync(join(lessons, id, "lesson.html")).size, hangul, scenes, fixLeft };
}

function cost(setDir, run) {
  const dir = join(setDir, "transcripts", run);
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".jsonl")).map((f) => join(dir, f)) : [];
  if (!files.length) return { weighted: null, maxContext: null, cacheRead: null, outputEst: null };
  const [r] = JSON.parse(execFileSync("node", [COST, files[0], "--json"], { encoding: "utf8" }));
  const t = r.total;
  return { weighted: t.weighted, maxContext: t.maxContext, cacheRead: t.cacheRead, outputEst: t.outputEst };
}

function wall(runDir) {
  const read = (f) => (existsSync(join(runDir, f)) ? Number(readFileSync(join(runDir, f), "utf8")) : NaN);
  const w = read("end") - read("start");
  return Number.isFinite(w) ? w : null;
}

const args = process.argv.slice(2);
const json = args.includes("--json");
const rows = [];
for (const setDir of args.filter((a) => !a.startsWith("--"))) {
  const runs = join(setDir, "runs");
  for (const run of readdirSync(runs).sort()) {
    const runDir = join(runs, run);
    if (!existsSync(join(runDir, "out.jsonl"))) continue;
    const m = run.match(/^(.+)-([^-]+)-(\d+)$/);
    rows.push({ set: basename(setDir), run, topic: m?.[1] ?? run, variant: m?.[2] ?? "", wall: wall(runDir), ...cost(setDir, run), ...loopShape(join(runDir, "out.jsonl")), ...content(runDir) });
  }
}

const COLS = ["wall", "weighted", "usd", "turns", "edits", "audits", "sheetReads", "maxContext", "htmlBytes", "hangul", "scenes", "fixLeft"];
const groups = {};
for (const r of rows) (groups[`${r.set}/${r.variant}`] ||= []).push(r);
const means = Object.entries(groups).map(([key, rs]) => {
  const m = { key, n: rs.length };
  for (const c of COLS) {
    const v = rs.map((r) => r[c]).filter((x) => typeof x === "number");
    m[c] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  }
  return m;
});

if (json) console.log(JSON.stringify({ rows, means }, null, 2));
else {
  const f = (v) => (v == null ? "-" : typeof v === "number" ? (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en-US") : String(Math.round(v * 100) / 100)) : String(v));
  const head = ["run", ...COLS, "lastEditAudited", "version"];
  console.log(head.join("\t"));
  for (const r of rows) console.log([`${r.set}/${r.run}`, ...COLS.map((c) => f(r[c])), r.lastEditAudited, r.version].join("\t"));
  console.log("");
  console.log(["mean", "n", ...COLS].join("\t"));
  for (const m of means) console.log([m.key, m.n, ...COLS.map((c) => f(m[c]))].join("\t"));
}
