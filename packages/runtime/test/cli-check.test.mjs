// VO-11 (FR-15, FR-19, C-33, C-34, C-40, QR-3) `ltt check` as a child process: state transitions over file states,
// stdout formats, --json, .ltt/log.jsonl. Lessons are copied into temp dirs so logs never land in the repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EXAMPLE, ltt, copyLesson, writeLesson, readLog } from "./fixtures/m1.mjs";

const HEADER = `/** @type {import("ltt").LessonFactory} */\n`;
const lessonSrc = (sceneSay = "점을 본다.", extraMark = "") => `${HEADER}export default (api) => api.lesson({
  meta: { title: "t", objectives: [{ id: "o1", text: "x" }], learner: { knows: [], misconceptions: [] }, domains: ["d"] },
  glossary: { 속도계: "속도를 재는 계기" },
  checks: [],
  models: { m: api.model({ q: 0.5 }, (p) => ({ v: p.q }), "identity") },
  figures: { f: api.figure(api.cartesian({ x: [0, 10, "m"], y: [0, 10, "m"], static: "s" }), () => [api.dot([5, 5], { id: "a" })${extraMark}]) },
  sections: [{ concept: { id: "k", title: "k", definition: "d", level: 1 }, scenes: [
    { type: "hook", title: "출발", say: ${JSON.stringify(sceneSay)}, figure: "f", focus: ["a"] },
    { type: "define", term: "속도계", definition: "속도계는 속도를 잰다.", focus: [] },
  ] }],
  quiz: [], summary: { figures: ["f"] },
});
`;
const OK = lessonSrc();
const VIOLATING = lessonSrc("속도계를 본다.", `, api.dot([11, 5], { id: "out" })`);
const TYPE_ERR = `${HEADER}export default (api) => api.lesson({ meta: { title: 1 }, checks: [], models: {}, figures: {}, sections: [], quiz: [], summary: { figures: [] } });\n`;
const LINE = /^(\S+) (\S+) \[([\w-]+)\] (.+)$/;

test("VO-11 C-33 ok lesson -> exit 0, last line 'ok', one log line {cmd check, exit 0, counts 0/0/0}", () => {
  const f = writeLesson(OK);
  const r = ltt(["check", f]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.stdout.trim().split("\n").at(-1), "ok");
  const log = readLog(f);
  assert.equal(log.length, 1);
  const e = log[0];
  assert.equal(e.cmd, "check");
  assert.equal(e.exit, 0);
  assert.ok(!Number.isNaN(Date.parse(e.ts)) && new Date(e.ts).toISOString() === e.ts, "ISO ts");
  assert.ok(typeof e.ms === "number" && e.ms >= 0);
  assert.ok(String(e.file).endsWith("lesson.js"));
  assert.deepEqual(e.counts, { type: 0, check: 0, layout: 0 });
});
test("VO-11 C-33 violating lesson -> exit 1, one line per error '<file> <path> [<rule>] <message>', last line '<n> errors'", () => {
  const f = writeLesson(VIOLATING);
  const r = ltt(["check", f]);
  assert.equal(r.status, 1, r.stderr);
  const lines = r.stdout.trim().split("\n");
  const body = lines.slice(0, -1);
  assert.equal(lines.at(-1), `${body.length} errors`);
  const rules = body.map((l) => { const m = l.match(LINE); assert.ok(m, `line format: ${l}`); assert.ok(m[1].endsWith("lesson.js")); return m[3]; });
  assert.deepEqual([...new Set(rules)].sort(), ["data-in-domain", "term-defined-before-use"]);
  const log = readLog(f);
  assert.equal(log.at(-1).exit, 1);
  assert.deepEqual(log.at(-1).counts, { type: 0, check: body.length, layout: 0 });
});
test("VO-11 C-33 tsc error -> exit 1, only type-layer errors (TS<code>, <line>:<col>), checkLesson not run", () => {
  const f = writeLesson(TYPE_ERR);
  const r = ltt(["check", f, "--json"]);
  assert.equal(r.status, 1, r.stderr);
  const rep = JSON.parse(r.stdout);
  assert.equal(rep.ok, false);
  assert.ok(rep.errors.length >= 1);
  for (const e of rep.errors) {
    assert.equal(e.layer, "type");
    assert.match(e.rule, /^TS\d+$/);
    assert.match(e.path, /^\d+:\d+$/);
    assert.ok(e.message.length > 0);
  }
  const h = ltt(["check", f]);
  assert.equal(h.status, 1);
  for (const l of h.stdout.trim().split("\n").slice(0, -1)) assert.match(l, /^\S+ \d+:\d+ \[TS\d+\] .+$/);
  const log = readLog(f);
  assert.equal(log.length, 2);
  assert.ok(log.every((e) => e.counts.type >= 1 && e.counts.check === 0 && e.counts.layout === 0));
});
test("VO-11 C-33 missing file -> exit 2, stderr one line, no stdout report, no log", () => {
  const dir = path.dirname(writeLesson(OK));
  const f = path.join(dir, "nope.js");
  const r = ltt(["check", f]);
  assert.equal(r.status, 2);
  assert.equal(r.stderr.trim().split("\n").length, 1);
  assert.ok(!fs.existsSync(path.join(dir, ".ltt")));
});
test("VO-11 usage errors -> exit 2 (no file, unknown command)", () => {
  assert.equal(ltt(["check"]).status, 2);
  assert.equal(ltt(["frobnicate"]).status, 2);
  assert.equal(ltt([]).status, 2);
});
test("VO-11 C-34 --json: {ok, errors} with layer/rule/path/message for check errors", () => {
  const f = writeLesson(VIOLATING);
  const r = ltt(["check", f, "--json"]);
  assert.equal(r.status, 1);
  const rep = JSON.parse(r.stdout);
  assert.deepEqual(Object.keys(rep).sort(), ["errors", "ok"]);
  assert.equal(rep.ok, false);
  for (const e of rep.errors) {
    assert.equal(e.layer, "check");
    assert.ok(e.message.length <= 300);
    assert.equal(typeof e.path, "string");
  }
  const ok = JSON.parse(ltt(["check", writeLesson(OK), "--json"]).stdout);
  assert.deepEqual(ok, { ok: true, errors: [] });
});
test("VO-11 C-40 check twice -> log.jsonl has 2 lines with cmd, exit, counts", () => {
  const f = writeLesson(VIOLATING);
  ltt(["check", f]);
  ltt(["check", f, "--json"]);
  const log = readLog(f);
  assert.equal(log.length, 2);
  for (const e of log) {
    assert.equal(e.cmd, "check");
    assert.equal(e.exit, 1);
    assert.deepEqual(Object.keys(e.counts).sort(), ["check", "layout", "type"]);
    assert.deepEqual(Object.keys(e).filter((k) => ["ts", "cmd", "file", "ms", "exit", "counts"].includes(k)).sort(), ["cmd", "counts", "exit", "file", "ms", "ts"]);
  }
});
test("VO-11 load-error lesson -> exit 1 with exactly one load-error", () => {
  const f = writeLesson(`${HEADER}export default (api) => { throw new Error("boom"); };\n`);
  const rep = JSON.parse(ltt(["check", f, "--json"]).stdout);
  assert.deepEqual(rep.errors.map((e) => e.rule), ["load-error"]);
});
test("VO-11 QR-3 ltt check on the example: exit 0, 'ok', wall time ≤ 15 s", { timeout: 60000 }, () => {
  const f = copyLesson(EXAMPLE);
  const t0 = Date.now();
  const r = ltt(["check", f]);
  const ms = Date.now() - t0;
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.stdout.trim().split("\n").at(-1), "ok");
  assert.ok(ms <= 15000, `check took ${ms} ms`);
});
