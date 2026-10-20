import { test } from "node:test";
import assert from "node:assert/strict";
import { lib, mulberry32, lessonText, concept, TODAY, tmpHome, writeHome, ltt, snapshot, msg, conceptsOf, isStrictlySorted } from "./helpers.mjs";

const { derive } = await lib("derive");
const { check } = await lib("check");

const SEED = 20261016;
const HOMES = 2000;
const POOL = ["a", "b", "c", "d", "e", "f", "g", "h"];
const DATES = ["2026-09-01", "2026-09-20", "2026-10-01", "2026-10-01", "2026-10-15"];
const CONCEPT_FAULTS = ["id-invalid", "id-numeric", "title-missing", "def-missing", "domains-empty", "domains-scalar", "domain-bad", "level-bad", "quiz-bad", "null-entry"];
const LESSON_FAULTS = ["lesson-missing", "lesson-nonstring", "lesson-mismatch", "date-missing", "date-invalid"];

function genHome(rnd) {
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const chance = (p) => rnd() < p;
  const subset = (arr, max) => Array.from(new Set(Array.from({ length: Math.floor(rnd() * (max + 1)) }, () => pick(arr))));
  const refs = [...POOL, "ghost", "Bad_Id"];
  const okRefs = [...POOL, "ghost"];
  const lessons = [];
  const nl = Math.floor(rnd() * 6);
  for (let i = 0; i < nl; i++) {
    const id = `l${i}`;
    const path = `lessons/${id}/result.md`;
    const kind = rnd();
    let text;
    let malformed = false;
    if (kind < 0.08) text = "# plain old result\n\nnothing structured\n";
    else if (kind < 0.14) {
      text = "---\nlesson: " + id + "\nconcepts: [ {id: a,\n : :\n---\nbody";
      malformed = true;
    } else if (kind < 0.19) {
      text = "---\nlesson: " + id + "\ndate: 2026-10-01\nconcepts: 5\n---\n";
      malformed = true;
    } else if (kind < 0.22) text = "---\nlesson: " + id + "\nno closing fence";
    else if (kind < 0.25) text = "\u0000\u0001�--- ::: [[{{";
    else if (kind < 0.28) text = "---\n---\n";
    else {
      const faults = new Set();
      if (chance(0.15)) {
        for (let n = 1 + Math.floor(rnd() * 2); n > 0; n--) faults.add(pick([...CONCEPT_FAULTS, ...LESSON_FAULTS]));
        malformed = true;
      }
      const cf = (name) => faults.has(name);
      const concepts = Array.from({ length: Math.max(faults.size ? 1 : 0, Math.floor(rnd() * 4)) }, (_, n) => {
        const first = n === 0;
        const useRefs = chance(0.1) ? refs : okRefs;
        return concept(first && cf("id-invalid") ? pick(["Up", "a/b", "", "-x"]) : first && cf("id-numeric") ? 5 : pick(POOL), {
          title: first && cf("title-missing") ? undefined : pick(["Cache Hit", "cache-hit", "Warp", "Other"]),
          definition: first && cf("def-missing") ? undefined : "def " + Math.floor(rnd() * 3),
          domains: first && cf("domains-empty") ? [] : first && cf("domains-scalar") ? "gpu" : first && cf("domain-bad") ? ["Bad Domain"] : subset(["gpu", "os", "linear-algebra"], 2).concat(["gpu"]),
          level: first && cf("level-bad") ? pick([0, 6, -1]) : 1 + Math.floor(rnd() * 5),
          quiz: first && cf("quiz-bad") ? pick(["maybe", "PASS", "ok"]) : pick(["pass", "fail", "skipped", "none"]),
          aliases: chance(0.3) ? subset(["al", "be", "ga"], 2) : undefined,
          requires: chance(0.4) ? subset(useRefs, 2) : undefined,
          leads_to: chance(0.4) ? subset(useRefs, 2) : undefined,
        });
      });
      if (cf("null-entry")) concepts.push(null);
      text = lessonText({ lesson: id, date: pick(DATES), concepts });
      if (cf("lesson-missing")) text = text.replace(/^lesson:.*\n/m, "");
      if (cf("lesson-nonstring")) text = text.replace(/^lesson:.*$/m, "lesson: [a, b]");
      if (cf("lesson-mismatch")) text = text.replace(/^lesson:.*$/m, 'lesson: "mismatch"');
      if (cf("date-missing")) text = text.replace(/^date:.*\n/m, "");
      if (cf("date-invalid")) text = text.replace(/^date:.*$/m, "date: not-a-date");
    }
    lessons.push({ id, path, text, malformed });
  }
  const decisions = [];
  const nd = Math.floor(rnd() * 7);
  for (let i = 0; i < nd; i++) {
    const op = pick(["merge", "merge", "link", "reject", "bogus", undefined, 7]);
    const d = { op, date: pick(DATES) };
    if (op === "merge") Object.assign(d, { from: pick(refs), into: pick(refs) });
    else if (op === "link") Object.assign(d, { from: pick(refs), to: pick(refs) });
    else if (op === "reject") Object.assign(d, { a: pick(refs), b: pick(refs) });
    if (chance(0.1)) delete d[pick(["from", "into", "to", "a", "b"])];
    if (chance(0.1)) for (const k of ["from", "into", "to", "a", "b"]) if (k in d) d[k] = pick([5, null, ["x"], {}]);
    decisions.push(d);
  }
  return { lessons, decisions };
}

const namesSource = (e) => /result\.md|decisions|cycle/i.test(msg(e));
const asList = (x) => (Array.isArray(x) ? x : x instanceof Map ? [...x.values()] : Object.values(x ?? {}));
const shuffle = (arr, rnd) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

test("VO-15 random testing: seed 20261016, 2000 homes; never throw, deterministic, structural invariants, errors name sources", () => {
  const rnd = mulberry32(SEED);
  let withErrors = 0;
  let withConcepts = 0;
  let malformedLessons = 0;
  for (let i = 0; i < HOMES; i++) {
    const { lessons, decisions } = genHome(rnd);
    const input = lessons.map(({ path, text }) => ({ path, text }));
    const label = `home #${i}`;
    let a, b, c;
    try {
      a = derive(input, decisions, TODAY);
      b = derive(input, decisions, TODAY);
      c = check(a);
    } catch (e) {
      assert.fail(`${label} threw: ${e.stack}`);
    }
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${label} derive not deterministic`);
    for (const key of ["concepts", "edges", "frontier", "errors", "warnings"]) assert.ok(key in a, `${label} missing ${key}`);
    const errors = [...a.errors, ...c.errors];
    for (const e of errors) assert.ok(namesSource(e), `${label} error without source: ${msg(e)}`);
    for (const l of lessons.filter((x) => x.malformed)) {
      malformedLessons++;
      const dir = `${l.id}/result.md`;
      assert.ok(errors.some((e) => msg(e).includes(dir)), `${label} malformed lesson ${l.id} silently skipped; text:\n${l.text}\nerrors: ${JSON.stringify(errors)}`);
    }
    const cs = conceptsOf(a);
    for (const cc of cs) {
      for (const k of ["aliases", "domains", "requires", "leads_to", "lessons"]) {
        if (cc[k] !== undefined) assert.ok(isStrictlySorted(cc[k]), `${label} ${cc.id}.${k} not deduped+sorted: ${JSON.stringify(cc[k])}`);
      }
    }
    const conceptIds = new Set(cs.map((x) => x.id));
    const frontier = new Set(asList(a.frontier).map((f) => (typeof f === "string" ? f : f.id)));
    const mergedFrom = new Set(cs.flatMap((x) => x.merged_from ?? []));
    for (const m of mergedFrom) assert.ok(!conceptIds.has(m) && !frontier.has(m), `${label} merged-from id ${m} still present`);
    for (const e of a.edges) {
      const [from, to] = Array.isArray(e) ? e : [e.from ?? e.source, e.to ?? e.target];
      for (const end of [from, to]) {
        assert.ok(conceptIds.has(end) || frontier.has(end), `${label} edge endpoint ${end} is neither concept nor frontier`);
        assert.ok(!mergedFrom.has(end), `${label} edge endpoint ${end} is a merged-from id`);
      }
    }
    for (const f of frontier) assert.ok(!conceptIds.has(f), `${label} frontier ${f} is also a concept`);
    if (errors.length) withErrors++;
    if (cs.length) withConcepts++;
  }
  assert.ok(withErrors > HOMES * 0.2, `generator exercised error paths (${withErrors})`);
  assert.ok(withConcepts > HOMES * 0.3, `generator produced concepts (${withConcepts})`);
  assert.ok(malformedLessons > 500, `generator produced malformed lessons (${malformedLessons})`);
});

test("VO-15 permuting lesson input order yields identical derive output (all keys, incl. errors), seed 20261016, 2000 homes", () => {
  const rnd = mulberry32(SEED);
  const shuf = mulberry32(SEED + 1);
  for (let i = 0; i < HOMES; i++) {
    const { lessons, decisions } = genHome(rnd);
    const input = lessons.map(({ path, text }) => ({ path, text }));
    const a = derive(input, decisions, TODAY);
    const p = derive(shuffle(input, shuf), decisions, TODAY);
    for (const key of Object.keys(a)) {
      assert.equal(JSON.stringify(p[key]), JSON.stringify(a[key]), `home #${i} derive.${key} depends on lesson input order`);
    }
  }
});

const RAW_DECISION_LINES = ['{"op":"zzz","x":1}', "[]", "null", '"str"', '{"op":"merge","from":5,"into":null}', '{"op":"link","from":{},"to":["a"]}', '{"op":"reject","a":"a"}', "42"];

test("VO-15 rebuild idempotent on every 100th generated home (CLI, incl. malformed and wrong-type jsonl lines); exit 0/1; no crash output", () => {
  const rnd = mulberry32(SEED);
  let ran = 0;
  for (let i = 0; i < HOMES; i++) {
    const { lessons, decisions } = genHome(rnd);
    if (i % 100 !== 0) continue;
    const home = tmpHome();
    const lines = decisions.map((d) => JSON.stringify(d));
    if (i % 200 === 0) lines.splice(Math.min(1, lines.length), 0, "{broken json");
    lines.splice(Math.min(2, lines.length), 0, RAW_DECISION_LINES[(i / 100) % RAW_DECISION_LINES.length], RAW_DECISION_LINES[(i / 100 + 3) % RAW_DECISION_LINES.length]);
    writeHome(home, { lessons, decisions: lines.join("\n") + "\n" });
    const r1 = ltt(home, ["rebuild"]);
    const s1 = snapshot(home);
    const r2 = ltt(home, ["rebuild"]);
    const s2 = snapshot(home);
    assert.ok([0, 1].includes(r1.code), `home #${i}: exit ${r1.code} ${r1.err}`);
    assert.equal(r2.code, r1.code, `home #${i}`);
    assert.doesNotMatch(r1.err, /TypeError|ReferenceError|RangeError|\n\s+at /, `home #${i}: ${r1.err}`);
    assert.deepEqual(s2, s1, `home #${i} rebuild not idempotent`);
    for (const line of r1.all.split("\n").filter((l) => /^error /.test(l))) assert.ok(namesSource(line), `home #${i}: ${line}`);
    ran++;
  }
  assert.equal(ran, 20);
});
