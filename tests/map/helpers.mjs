// Shared builders and shape adapters for tests/map. The spec leaves the container shapes of derive()/layout
// results open; every guess about shape lives in this file only.
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const MAP_DIR = join(ROOT, "skills/learn-to-tell/map");
export const CLI = join(MAP_DIR, "ltt-map.mjs");
export const TODAY = "2026-10-16";

export const lib = (name) => import(join(MAP_DIR, "lib", `${name}.mjs`));

export function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
export const ago = (n, today = TODAY) => addDays(today, -n);
export const realToday = () => new Date().toISOString().slice(0, 10);

const q = JSON.stringify;
function conceptYaml(c) {
  if (c === null) return "  - null";
  const out = [];
  const put = (k, v, raw) => {
    if (v !== undefined) out.push(`    ${k}: ${raw ? v : q(v)}`);
  };
  out.push(`  - id: ${q(c.id)}`);
  put("title", c.title);
  if (c.aliases) put("aliases", q(c.aliases), true);
  put("definition", c.definition);
  if (c.domains !== undefined) put("domains", q(c.domains), true);
  put("level", c.level, true);
  if (c.requires) put("requires", q(c.requires), true);
  if (c.leads_to) put("leads_to", q(c.leads_to), true);
  put("quiz", c.quiz, true);
  return out.join("\n");
}

export function concept(id, over = {}) {
  return { id, title: `T ${id}`, definition: `definition of ${id}`, domains: ["d"], level: 2, quiz: "none", ...over };
}

export function lessonText({ lesson, date, concepts, body = "# Result\n\nfree text\n" }) {
  const head = [`---`, `lesson: ${q(lesson)}`, `date: ${date}`];
  if (concepts.length === 0) head.push("concepts: []");
  else head.push("concepts:", ...concepts.map(conceptYaml));
  head.push("---", "", body);
  return head.join("\n");
}

export function L(lesson, date, concepts, extra = {}) {
  return { path: `lessons/${lesson}/result.md`, text: lessonText({ lesson, date, concepts, ...extra }) };
}

export async function D(lessons, decisions = [], today = TODAY) {
  const { derive } = await lib("derive");
  return derive(lessons, decisions, today);
}

// adapters ------------------------------------------------------------
export const conceptsOf = (d) => {
  const c = d.concepts;
  return Array.isArray(c) ? c : c instanceof Map ? [...c.values()] : Object.values(c ?? {});
};
export const getC = (d, id) => conceptsOf(d).find((c) => c.id === id);
export const ids = (d) => conceptsOf(d).map((c) => c.id).sort();
const edgePair = (e) => (Array.isArray(e) ? [e[0], e[1]] : [e.from ?? e.source, e.to ?? e.target]);
export const edgeKeys = (edges) => (edges ?? []).map((e) => edgePair(e).join(">")).sort();
export const frontierIds = (d) => {
  const f = d.frontier;
  const arr = Array.isArray(f) ? f : f instanceof Map ? [...f.values()] : Object.values(f ?? {});
  return arr.map((x) => (typeof x === "string" ? x : x.id)).sort();
};
export const msg = (x) => (typeof x === "string" ? x : JSON.stringify(x));
export const msgs = (list) => (list ?? []).map(msg);
export const ymd = (x) => (x instanceof Date ? x.toISOString().slice(0, 10) : String(x).slice(0, 10));

export async function allDiag(d) {
  const { check } = await lib("check");
  const c = check(d);
  return { errors: [...msgs(d.errors), ...msgs(c.errors)], warnings: [...msgs(d.warnings), ...msgs(c.warnings)] };
}

// home + CLI ------------------------------------------------------------
export function tmpHome() {
  const parent = mkdtempSync(join(tmpdir(), "ltt-map-"));
  const home = join(parent, "home");
  mkdirSync(home);
  return home;
}

export function writeHome(home, { lessons = [], decisions } = {}) {
  for (const l of lessons) {
    const id = l.id ?? l.path.split("/").at(-2);
    mkdirSync(join(home, "lessons", id), { recursive: true });
    writeFileSync(join(home, "lessons", id, "result.md"), l.text);
  }
  if (decisions !== undefined) {
    const text = Array.isArray(decisions) ? decisions.map((x) => (typeof x === "string" ? x : q(x))).join("\n") + "\n" : decisions;
    writeFileSync(join(home, "decisions.jsonl"), text);
  }
  return home;
}

export function ltt(home, args, opts = {}) {
  const env = { ...process.env, LTT_HOME: home, ...(opts.env ?? {}) };
  const r = spawnSync(process.execPath, [CLI, ...args], { env, encoding: "utf8", timeout: 60000 });
  return { code: r.status, out: r.stdout ?? "", err: r.stderr ?? "", all: (r.stdout ?? "") + (r.stderr ?? "") };
}

export const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
export const exists = existsSync;

export function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else out[p.slice(dir.length)] = readFileSync(p, "utf8");
    }
  };
  walk(dir);
  return out;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// layout adapters (shape assumptions A1..A4 in the report) --------------
export function collect(node, pred, out = []) {
  if (Array.isArray(node)) node.forEach((n) => collect(n, pred, out));
  else if (node && typeof node === "object") {
    if (pred(node)) out.push(node);
    for (const v of Object.values(node)) collect(v, pred, out);
  }
  return out;
}
const isChip = (o) => typeof o.id === "string" && ("title" in o || "text" in o || "label" in o);
export function gridRows(grid) {
  if (!Array.isArray(grid.rows)) throw new Error("layoutGrid result has no rows array (shape assumption A1)");
  return grid.rows.map((row) => {
    const domain = row.domain ?? row.id ?? row.label ?? row.name;
    const cellsKey = ["cells", "columns", "levels"].find((k) => Array.isArray(row[k]) && row[k].length === 5);
    let chips;
    if (cellsKey) chips = row[cellsKey].flatMap((cell, i) => collect(cell, isChip).map((c) => ({ ...c, col: i + 1, chip: c })));
    else chips = collect(row, isChip).map((c) => ({ ...c, col: c.level ?? c.col, chip: c }));
    return { domain, chips };
  });
}
export function linkedOf(grid, id) {
  const norm = (v) => (v instanceof Set ? [...v] : Array.isArray(v) ? v : v && typeof v === "object" ? Object.keys(v) : null);
  for (const k of ["links", "neighbors", "adjacency", "linked"]) {
    const m = grid[k];
    const v = m instanceof Map ? m.get(id) : m?.[id];
    const n = norm(v);
    if (n) return n.map((x) => (typeof x === "string" ? x : x.id));
  }
  for (const row of grid.rows ?? []) {
    for (const c of collect(row, (o) => o.id === id)) {
      for (const k of ["linked", "links", "neighbors"]) {
        const n = norm(c[k]);
        if (n) return n.map((x) => (typeof x === "string" ? x : x.id));
      }
    }
  }
  throw new Error("no linked-concept set found in layoutGrid result (shape assumption A3)");
}
export function focusParts(f) {
  const pick = (...ks) => {
    for (const k of ks) if (Array.isArray(f[k])) return f[k];
    return [];
  };
  const left = f.left ?? f.sides?.left ?? [];
  const right = f.right ?? f.sides?.right ?? [];
  const sides = Array.isArray(f.sides) ? f.sides : [...left, ...right];
  return {
    below: pick("below", "prerequisites", "prereqs", "requires"),
    above: pick("above", "dependents", "leads_to", "next"),
    sides,
    notFound: f.notFound === true || f.found === false || f.status === "not-found",
    center: typeof f.center === "string" ? f.center : f.center?.id,
  };
}
export const itemId = (x) => (typeof x === "string" ? x : x.id);
export const stringValues = (x) => collect(x, () => true).flatMap((o) => Object.values(o)).flatMap((v) => (Array.isArray(v) ? v : [v])).filter((v) => typeof v === "string");
export const isDashed = (x) =>
  typeof x === "object" &&
  (x.dashed === true || x.frontier === true || stringValues(x).some((v) => v.split(/\s+/).some((t) => t === "dashed" || t === "frontier")));

export async function yamlLoad(text) {
  const y = await import(join(MAP_DIR, "vendor/js-yaml.mjs"));
  return (y.load ?? y.default?.load)(text);
}
export const isStrictlySorted = (arr) => arr.every((v, i) => i === 0 || arr[i - 1] < v);
