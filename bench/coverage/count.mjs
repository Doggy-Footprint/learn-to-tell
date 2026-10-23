// @ts-check
import { existsSync, statSync } from "node:fs";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createApi, bindingErrors } from "../../packages/runtime/dev/spec-stub.mjs";

const CORPORA = ["shot", "shot-extra", "lesson", "new-b1", "new-b2"];
const VERDICTS = ["V", "C", "G", "X", "N"];
const STATUSES = ["kept", "approx", "lost", "custom", "ambiguous"];
const BANNED = ["@ts-ignore", "@ts-expect-error", "@ts-nocheck", "{any}", "{*}"];

/** @param {number} k @param {number} n @param {number} [z] @returns {[number, number] | null} */
export function wilson(k, n, z = 1.96) {
  if (n === 0) return null;
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

/** @param {string} dir @returns {Promise<string[]>} */
async function listJs(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listJs(p)));
    else if (e.isFile() && e.name.endsWith(".js")) out.push(p);
  }
  return out;
}

/** @param {unknown} s */
const filled = (s) => typeof s === "string" && s.trim() !== "";

/** @param {any} row @returns {string[]} */
function rowErrors(row) {
  const where = `row ${row?.fig ?? "?"}`;
  if (typeof row !== "object" || row === null) return ["audit row is not an object"];
  const errs = [];
  if (!CORPORA.includes(row.corpus)) errs.push(`${where}: unknown corpus ${row.corpus}`);
  if (!VERDICTS.includes(row.verdict)) errs.push(`${where}: unknown verdict ${row.verdict}`);
  const props = Array.isArray(row.props) ? row.props : [];
  if (!Array.isArray(row.props)) errs.push(`${where}: props must be an array`);
  const custom = Array.isArray(row.custom) ? row.custom : [];
  for (const p of props) {
    if (!STATUSES.includes(p?.status)) errs.push(`${where}: unknown status ${p?.status}`);
    else if (p.status === "kept" && !filled(p.by)) errs.push(`${where}: kept prop ${p.id} needs by`);
    else if (p.status === "approx" && !filled(p.diff)) errs.push(`${where}: approx prop ${p.id} needs diff`);
  }
  if (row.verdict === "X" || row.verdict === "N") {
    if (!filled(row.reason)) errs.push(`${where}: verdict ${row.verdict} needs reason`);
  } else if (VERDICTS.includes(row.verdict)) {
    const essential = props.filter((/** @type {any} */ p) => p?.essential);
    let expected;
    if (custom.length > 0) expected = "C";
    else if (essential.some((/** @type {any} */ p) => p.status === "lost" || p.status === "ambiguous")) expected = "G";
    else if (essential.every((/** @type {any} */ p) => p.status === "kept" || p.status === "approx")) expected = "V";
    if (expected !== row.verdict) errs.push(`${where}: verdict ${row.verdict} contradicts custom and essential props${expected ? ` (expected ${expected})` : ""}`);
  }
  return errs;
}

/** @param {any} spec @param {any} api */
function drawFigures(spec, api) {
  /** @type {Record<string, unknown>} */
  const outputs = {};
  /** @type {Record<string, unknown>} */
  const params = {};
  for (const [name, m] of Object.entries(spec?.models ?? {})) {
    const d = /** @type {any} */ (m);
    if (d?.kind !== "model") continue;
    Object.assign(params, d.args[0]);
    outputs[name] = d.args[1]({ ...d.args[0] });
  }
  for (const f of Object.values(spec?.figures ?? {})) {
    const d = /** @type {any} */ (f);
    if (d?.kind !== "figure") continue;
    const span = d.args[0]?.args?.[0]?.loop?.span;
    d.args[1](outputs, span ? span[0] : 0, { step: 0, params: { ...params } });
  }
}

/** @param {Record<string, number>} into @param {Map<string, number>} usage */
const addUsage = (into, usage) => {
  for (const [k, v] of usage) into[k] = (into[k] ?? 0) + v;
};

/** @param {string} dir */
export async function aggregate(dir) {
  const files = await listJs(dir);
  /** @type {string[]} */
  const errors = [];
  /** @type {any[]} */
  const rows = [];
  /** @type {Record<string, number>} */
  const total = {};
  /** @type {Record<string, Record<string, number>>} */
  const byCorpus = {};
  let n = 0;
  for (const file of files) {
    const fail = (/** @type {string} */ reason) => errors.push(`${file}: ${reason}`);
    const source = await readFile(file, "utf8");
    const banned = BANNED.filter((t) => source.includes(t));
    for (const t of banned) fail(`forbidden token ${t}`);
    let mod;
    try {
      mod = await import(`${pathToFileURL(resolve(file)).href}?v=${n++}`);
    } catch (err) {
      fail(`cannot import: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    if (!Array.isArray(mod.audit)) {
      fail("missing audit array");
      continue;
    }
    const errs = mod.audit.flatMap(rowErrors);
    errs.forEach(fail);
    if (typeof mod.default !== "function") {
      fail("default export is not a function");
      continue;
    }
    const { api, usage } = createApi();
    try {
      const spec = mod.default(api);
      drawFigures(spec, api);
      const { models, figures, scenes } = spec;
      const counted = new Map(usage);
      const found = bindingErrors({ models, figures, sections: scenes ? [{ scenes }] : [] });
      usage.clear();
      for (const [k, v] of counted) usage.set(k, v);
      for (const b of found) fail(`binding ${b.id}: ${b.message}`);
    } catch (err) {
      fail(`factory threw: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    if (banned.length || errs.length) continue;
    for (const row of mod.audit) rows.push({ ...row, file });
    addUsage(total, usage);
    for (const c of new Set(mod.audit.map((/** @type {any} */ r) => r.corpus))) addUsage((byCorpus[c] ??= {}), usage);
  }
  if (errors.length) {
    const e = /** @type {Error & { errors: string[] }} */ (new Error(errors.join("\n")));
    e.errors = errors;
    throw e;
  }

  /** @type {Record<string, { V: number; C: number; G: number; X: number; N: number; ratio: number | null; wilson: [number, number] | null }>} */
  const corpora = {};
  for (const r of rows) {
    const c = (corpora[r.corpus] ??= { V: 0, C: 0, G: 0, X: 0, N: 0, ratio: null, wilson: null });
    c[/** @type {"V" | "C" | "G" | "X" | "N"} */ (r.verdict)]++;
  }
  for (const c of Object.values(corpora)) {
    const k = c.C + c.G;
    const den = c.V + k;
    c.ratio = den === 0 ? null : k / den;
    c.wilson = wilson(k, den);
  }

  /** @type {Map<string, { count: number; domains: Set<string> }>} */
  const cand = new Map();
  for (const r of rows) {
    for (const raw of r.candidates ?? []) {
      const text = String(raw).trim().toLowerCase();
      if (!text) continue;
      const e = cand.get(text) ?? { count: 0, domains: new Set() };
      e.count++;
      e.domains.add(r.domain);
      cand.set(text, e);
    }
  }
  const candidates = [...cand]
    .map(([text, e]) => ({ text, count: e.count, domains: [...e.domains].sort(), promoted: e.count >= 3 && e.domains.size >= 2 }))
    .sort((a, b) => b.count - a.count || (a.text < b.text ? -1 : 1));

  const summary = { corpora, usage: { total, byCorpus }, candidates };
  Object.defineProperty(summary, "rows", { value: rows, enumerable: false });
  return summary;
}

/** @param {unknown} v */
const cell = (v) => String(v ?? "").replace(/[\t\r\n]+/g, " ");

/** @param {any[]} rows */
function toTsv(rows) {
  const head = "corpus\tdomain\tfig\tsrc\tverdict\tcustom\tlost_essential";
  const lines = rows.map((r) => {
    const lost = (r.props ?? []).filter((/** @type {any} */ p) => p.essential && p.status === "lost").map((/** @type {any} */ p) => p.id);
    return [r.corpus, r.domain, r.fig, r.src, r.verdict, (r.custom ?? []).join(","), lost.join(",")].map(cell).join("\t");
  });
  return `${[head, ...lines].join("\n")}\n`;
}

async function main() {
  const args = process.argv.slice(2);
  const oi = args.indexOf("--out");
  const out = oi >= 0 ? args[oi + 1] : undefined;
  const dir = args.find((a, i) => a !== "--out" && i !== oi + 1);
  const usage = "usage: node bench/coverage/count.mjs <dir> --out <outDir>\n";
  if (!dir || !out || !existsSync(dir) || !statSync(dir).isDirectory()) {
    process.stderr.write(usage);
    return 2;
  }
  /** @type {any} */
  let summary;
  try {
    summary = await aggregate(dir);
  } catch (err) {
    const e = /** @type {any} */ (err);
    process.stderr.write(`${(e.errors ?? [String(e?.message ?? e)]).join("\n")}\n`);
    return 1;
  }
  await mkdir(out, { recursive: true });
  await writeFile(join(out, "figures.tsv"), toTsv(summary.rows));
  await writeFile(join(out, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
