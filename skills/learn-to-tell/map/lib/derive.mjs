import yaml from "../vendor/js-yaml.mjs";
import { check } from "./check.mjs";
import { DATE_RE, DOMAIN_RE, ID_RE, QUIZ_VALUES, cmp, toDay, uniqSorted } from "./common.mjs";
import { freshness } from "./freshness.mjs";

const FRONTMATTER = /^﻿?---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

function lessonDir(path) {
  const parts = String(path).split("/");
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}

function isList(v, test) {
  return Array.isArray(v) && v.every(test);
}

// Returns {entries} or {errors}; a lesson with any error contributes nothing.
function parseLesson({ path, text }) {
  const match = FRONTMATTER.exec(String(text ?? ""));
  if (!match) return { entries: [] };
  let doc;
  try {
    // CORE_SCHEMA keeps `date: 2026-10-16` a string instead of a Date.
    doc = yaml.load(match[1] ?? "", { schema: yaml.CORE_SCHEMA });
  } catch (err) {
    return { errors: [`${path}: YAML parse failure: ${String(err.message).split("\n")[0]}`] };
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return { entries: [] };
  if (doc.concepts === undefined || doc.concepts === null) return { entries: [] };
  if (!Array.isArray(doc.concepts)) return { errors: [`${path}: concepts must be a list`] };
  if (doc.concepts.length === 0) return { entries: [] };

  const errors = [];
  const lesson = doc.lesson === undefined ? "" : String(doc.lesson);
  const dir = lessonDir(path);
  if (lesson !== dir) errors.push(`${path}: lesson ${JSON.stringify(lesson)} does not match directory name ${JSON.stringify(dir)}`);
  const date = doc.date === undefined ? "" : toDay(doc.date);
  if (!DATE_RE.test(date)) errors.push(`${path}: date must be YYYY-MM-DD`);

  const entries = [];
  doc.concepts.forEach((c, i) => {
    const label = `concepts[${i}]${c && typeof c.id === "string" ? ` (${c.id})` : ""}`;
    if (!c || typeof c !== "object" || Array.isArray(c)) return errors.push(`${path}: ${label} must be a mapping`);
    if (typeof c.id !== "string" || !ID_RE.test(c.id)) errors.push(`${path}: ${label} has invalid id ${JSON.stringify(c.id)}`);
    if (typeof c.title !== "string" || !c.title.trim()) errors.push(`${path}: ${label} is missing title`);
    if (typeof c.definition !== "string" || !c.definition.trim()) errors.push(`${path}: ${label} is missing definition`);
    if (!Array.isArray(c.domains) || c.domains.length === 0) errors.push(`${path}: ${label} is missing domains`);
    else if (!isList(c.domains, (d) => typeof d === "string" && DOMAIN_RE.test(d))) errors.push(`${path}: ${label} has invalid domain id`);
    if (!Number.isInteger(c.level) || c.level < 1 || c.level > 5) errors.push(`${path}: ${label} level ${JSON.stringify(c.level)} is outside 1-5`);
    for (const key of ["requires", "leads_to"]) {
      if (c[key] !== undefined && !isList(c[key], (x) => typeof x === "string" && ID_RE.test(x))) errors.push(`${path}: ${label} ${key} must be a list of concept ids`);
    }
    if (c.aliases !== undefined && !isList(c.aliases, (x) => typeof x === "string")) errors.push(`${path}: ${label} aliases must be a list of strings`);
    const quiz = c.quiz === undefined ? "none" : c.quiz;
    if (!QUIZ_VALUES.includes(quiz)) errors.push(`${path}: ${label} has invalid quiz ${JSON.stringify(quiz)}`);
    entries.push({
      id: c.id,
      title: c.title,
      definition: c.definition,
      aliases: c.aliases ?? [],
      domains: c.domains,
      level: c.level,
      requires: c.requires ?? [],
      leads_to: c.leads_to ?? [],
      quiz,
      lesson,
      date,
      path,
    });
  });
  return errors.length ? { errors } : { entries };
}

function parseDecisions(decisions, errors) {
  let lines = decisions ?? [];
  if (typeof lines === "string") lines = lines.split(/\r?\n/);
  const out = [];
  lines.forEach((raw, i) => {
    const n = i + 1;
    let d = raw;
    if (typeof raw === "string") {
      if (!raw.trim()) return;
      try {
        d = JSON.parse(raw);
      } catch {
        return errors.push(`decisions.jsonl:${n}: malformed JSON line`);
      }
    }
    const ok = (v) => typeof v === "string" && ID_RE.test(v);
    const valid =
      d &&
      typeof d === "object" &&
      ((d.op === "merge" && ok(d.from) && ok(d.into)) ||
        (d.op === "link" && ok(d.from) && ok(d.to)) ||
        (d.op === "reject" && ok(d.a) && ok(d.b)));
    if (!valid) return errors.push(`decisions.jsonl:${n}: invalid decision`);
    out.push({ ...d, line: n });
  });
  return out;
}

export function derive(lessons, decisions, today) {
  const errors = [];
  const warnings = [];
  const entries = [];
  for (const lesson of lessons ?? []) {
    const parsed = parseLesson(lesson);
    if (parsed.errors) errors.push(...parsed.errors);
    else entries.push(...parsed.entries);
  }
  const decs = parseDecisions(decisions, errors);

  const known = new Set(entries.map((e) => e.id));
  const mergeInto = new Map();
  const mergeLine = new Map();
  const resolve = (id) => {
    while (mergeInto.has(id)) id = mergeInto.get(id);
    return id;
  };
  for (const d of decs.filter((x) => x.op === "merge")) {
    const where = `decisions.jsonl:${d.line}`;
    if (!known.has(d.from) && !mergeInto.has(d.from)) {
      warnings.push(`${where}: merge from unknown concept ${d.from} ignored`);
      continue;
    }
    if (mergeInto.has(d.from)) {
      errors.push(`${where}: ${d.from} is already merged into ${mergeInto.get(d.from)}`);
      continue;
    }
    const target = resolve(d.into);
    if (target === d.from) {
      const chain = [];
      for (let id = d.into; id !== d.from; id = mergeInto.get(id)) chain.push(mergeLine.get(id));
      for (let id = d.into; id !== d.from; ) {
        const next = mergeInto.get(id);
        mergeInto.delete(id);
        id = next;
      }
      const others = chain.map((l) => `decisions.jsonl:${l}`);
      errors.push(`${[where, ...others].join(", ")}: merge cycle ${d.from} -> ${d.into}; both merges ignored`);
      continue;
    }
    if (!known.has(target)) {
      errors.push(`${where}: merge into unknown concept ${d.into} ignored`);
      continue;
    }
    mergeInto.set(d.from, d.into);
    mergeLine.set(d.from, d.line);
  }

  const groups = new Map();
  for (const e of entries) {
    const id = resolve(e.id);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(e);
  }

  const edgeMap = new Map();
  const addEdge = (from, to) => from !== to && edgeMap.set(`${from}\0${to}`, { from, to });
  const concepts = [];
  const sources = {};
  for (const id of [...groups.keys()].sort(cmp)) {
    const group = groups.get(id);
    const latest = group.reduce((best, e) => ((cmp(e.date, best.date) || cmp(e.lesson, best.lesson)) >= 0 ? e : best));
    const history = group
      .map((e) => ({ date: e.date, lesson: e.lesson, quiz: e.quiz }))
      .sort((a, b) => cmp(a.date, b.date) || cmp(a.lesson, b.lesson));
    const requires = uniqSorted(group.flatMap((e) => e.requires.map(resolve)));
    const leadsTo = uniqSorted(group.flatMap((e) => e.leads_to.map(resolve)));
    for (const r of requires) addEdge(r, id);
    for (const l of leadsTo) addEdge(id, l);
    const quizzed = history.filter((h) => h.quiz === "pass" || h.quiz === "fail");
    const status = quizzed.length === 0 ? "diagnosed" : quizzed[quizzed.length - 1].quiz === "pass" ? "learned" : "weak";
    sources[id] = uniqSorted(group.map((e) => e.path));
    concepts.push({
      id,
      title: latest.title,
      definition: latest.definition,
      aliases: uniqSorted(group.flatMap((e) => e.aliases)),
      domains: uniqSorted(group.flatMap((e) => e.domains)),
      level: latest.level,
      requires,
      leads_to: leadsTo,
      lessons: uniqSorted(group.map((e) => e.lesson)),
      history,
      status,
      freshness: freshness(history, today),
      last_date: history[history.length - 1].date,
      merged_from: uniqSorted([...mergeInto.keys()].filter((from) => resolve(from) === id)),
    });
  }

  const rejected = [];
  for (const d of decs) {
    if (d.op === "link") addEdge(resolve(d.from), resolve(d.to));
    if (d.op === "reject") rejected.push([resolve(d.a), resolve(d.b)].sort(cmp));
  }
  const rejectedPairs = [...new Map(rejected.filter(([a, b]) => a !== b).map((p) => [p.join("\0"), p])).values()].sort((x, y) => cmp(x[0], y[0]) || cmp(x[1], y[1]));

  const edges = [...edgeMap.values()].sort((x, y) => cmp(x.from, y.from) || cmp(x.to, y.to));
  const ids = new Set(concepts.map((c) => c.id));
  const frontier = uniqSorted(edges.flatMap((e) => [e.from, e.to]).filter((id) => !ids.has(id))).map((id) => ({ id, status: "frontier" }));
  const merged = Object.fromEntries([...mergeInto.keys()].sort(cmp).map((from) => [from, resolve(from)]));

  const base = { concepts, edges, frontier, errors, warnings, rejected: rejectedPairs, merged, sources };
  const checked = check(base);
  return { ...base, errors: checked.errors, warnings: checked.warnings };
}
