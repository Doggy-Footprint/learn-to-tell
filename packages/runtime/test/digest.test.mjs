// VO-13 (FR-18, C-39) digest: unit (digest(factory)) + integration (ltt digest). Oracles: spec digest sections;
// Text functions and check-named answers evaluated independently through core load().run().
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { shuffledOrder, DIGEST, CORE, EXAMPLE, importFile, ltt, copyLesson, writeLesson, readLog } from "./fixtures/m1.mjs";
import { input } from "./fixtures/helpers.mjs";

const { digest } = await import(DIGEST);
const { load } = await import(CORE);

function split(md) {
  const q = md.indexOf("## 문항"), k = md.indexOf("## 정답 키");
  assert.ok(q >= 0 && k > q, "## 문항 then ## 정답 키");
  return { Q: md.slice(q, k), K: md.slice(k) };
}

const fixture = (api) => api.lesson(input({
  checks: [{ id: "c1", model: "m", expect: { v: 42.5 }, tol: 0.1 }],
  models: { m: api.model({ a: 17 }, (p) => ({ v: p.a * 2.5, w: p.a + 1 }), "m") },
  figures: { f: api.figure(api.cartesian({ x: [0, 10, "m"], y: [0, 10, "m"], static: "s" }), () => [api.dot([1, 1], { id: "d" }), api.line([[0, 0], [10, 10]], { id: "ln" })]) },
  sections: [{ concept: { id: "k", title: "k", definition: "d", level: 1 }, scenes: [
    { type: "predict", title: "고르기", ask: (m) => `값 ${m.m.w}은 어디?`, figure: "f", focus: ["d"], input: { kind: "choice", options: [{ text: "위쪽 선택지", correct: true }, { text: "아래쪽 선택지", feedback: "오답 해설 알파" }] }, reveal: { say: "공개 문장 베타" } },
    { type: "predict", title: "끌기", ask: "끌기 질문 감마", figure: "f", focus: ["d"], input: { kind: "drag", mark: "d", axis: "x", answer: (m) => m.m.v / 10, tol: 0.5 }, reveal: { say: "공개 문장 델타" } },
    { type: "predict", title: "그리기", ask: "그리기 질문 엡실론", figure: "f", focus: ["d"], input: { kind: "draw", x: [0, 10], answer: "ln", tol: 1 }, reveal: { say: (m) => `공개 문장 제타 ${m.m.v}` } },
    { type: "quiz", items: [{ kind: "choice", prompt: "절 퀴즈 질문 에타", objective: "o1", options: [{ text: "정답 보기 세타", correct: true }, { text: "오답 보기 이오타", feedback: "오답 해설 카파" }], reveal: { say: "공개 문장 람다" } }] },
  ] }],
  quiz: [
    { kind: "numeric", prompt: "수치 질문 뮤", answer: { check: "c1" }, tol: 0.5, unit: "킬로그램", objective: "o1" },
    { kind: "numeric", prompt: "수치 질문 크시", answer: 3.75, tol: 0.1, unit: "초", objective: "o1" },
    { kind: "order", prompt: "순서 질문 오미크론", items: ["첫째 항목", "둘째 항목", "셋째 항목"], objective: "o1" },
    { kind: "classify", prompt: "분류 질문 파이", bins: ["통 하나", "통 둘"], items: [{ text: (m) => `항목 ${m.m.w}`, bin: "통 하나" }, { text: "항목 로", bin: "통 둘" }], objective: "o1" },
  ],
}));

test("VO-13 digest(factory): ## 문항 lists every question with Text functions evaluated, no answers", () => {
  const { Q } = split(digest(fixture));
  for (const s of ["값 18은 어디?", "위쪽 선택지", "아래쪽 선택지", "끌기 질문 감마", "그리기 질문 엡실론", "절 퀴즈 질문 에타", "정답 보기 세타", "오답 보기 이오타", "수치 질문 뮤", "킬로그램", "수치 질문 크시", "초", "순서 질문 오미크론", "첫째 항목", "둘째 항목", "셋째 항목", "분류 질문 파이", "통 하나", "통 둘", "항목 18", "항목 로"]) {
    assert.ok(Q.includes(s), `question part has ${s}`);
  }
  for (const leak of ["오답 해설 알파", "공개 문장 베타", "공개 문장 델타", "공개 문장 제타", "오답 해설 카파", "공개 문장 람다", "42.5", "3.75", "correct"]) {
    assert.ok(!Q.includes(leak), `question part leaks ${leak}`);
  }
});
test("VO-13 digest(factory): ## 정답 키 has every predict/quiz answer, feedback, reveal.say, numeric values (check name resolved)", () => {
  const { K } = split(digest(fixture));
  for (const s of ["위쪽 선택지", "오답 해설 알파", "공개 문장 베타", "4.25", "공개 문장 델타", "ln", "공개 문장 제타 42.5", "정답 보기 세타", "오답 해설 카파", "공개 문장 람다", "42.5", "3.75", "첫째 항목", "통 하나", "항목 18"]) {
    assert.ok(K.includes(s), `answer key has ${s}`);
  }
});
test("VO-13 digest is deterministic and a string", () => {
  assert.equal(typeof digest(fixture), "string");
  assert.equal(digest(fixture), digest(fixture));
});

const example = await importFile(EXAMPLE);
const L = load(example);
test("VO-13 C-39 example: question part has no answer markers; answer key covers every predict and quiz item", () => {
  const md = digest(example);
  const { Q, K } = split(md);
  const inp = L.input;
  const scenes = inp.sections.flatMap((s) => s.scenes);
  const items = [...scenes.filter((s) => s.type === "quiz").flatMap((s) => s.items), ...inp.quiz];
  assert.ok(!/correct/i.test(Q));
  for (const p of scenes.filter((s) => s.type === "predict")) {
    assert.ok(Q.includes(typeof p.ask === "string" ? p.ask : ""));
    if (typeof p.reveal.say === "string") { assert.ok(!Q.includes(p.reveal.say)); assert.ok(K.includes(p.reveal.say)); }
    if (p.input.kind === "choice") {
      const right = p.input.options.find((o) => o.correct);
      assert.ok(K.includes(right.text));
      for (const o of p.input.options) if (typeof o.feedback === "string") { assert.ok(!Q.includes(o.feedback), o.feedback); assert.ok(K.includes(o.feedback)); }
    }
  }
  const outs = (name) => L.run(name);
  for (const it of items) {
    assert.ok(Q.includes(it.prompt), it.prompt);
    if (it.kind === "choice") {
      assert.ok(K.includes(it.options.find((o) => o.correct).text));
      for (const o of it.options) if (o.feedback) {
        const fb = typeof o.feedback === "function" ? o.feedback(Object.fromEntries(Object.keys(inp.models).map((k) => [k, outs(k)]))) : o.feedback;
        assert.ok(!Q.includes(fb)); assert.ok(K.includes(fb), fb);
      }
    }
    if (it.kind === "numeric") assert.ok(Q.includes(it.unit));
  }
  assert.ok(K.includes("-4") || K.includes("−4"), "drag answer -4");
  const best = outs("best").deg.toFixed(0);
  assert.ok(K.includes(`최적각은 약 ${best}°`), "reveal.say function evaluated");
  assert.match(K, /48\.\d/, "numeric answer from check range45");
  const baseball = outs("balls").baseball.toFixed(0);
  assert.ok(Q.includes(`야구공(가정 vt ${baseball} m/s)을 100 m/s로`), "classify Text function evaluated");
});

test("VO-13 CLI ltt digest example -> exit 0, stdout = digest(factory), log line", () => {
  const f = copyLesson(EXAMPLE);
  const r = ltt(["digest", f]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), digest(example).trim());
  const log = readLog(f);
  assert.equal(log.length, 1);
  assert.equal(log[0].cmd, "digest");
  assert.equal(log[0].exit, 0);
});
test("VO-13 CLI ltt digest missing file -> exit 2, stderr, no log", () => {
  const f = path.join(path.dirname(copyLesson(EXAMPLE)), "nope.js");
  const r = ltt(["digest", f]);
  assert.equal(r.status, 2);
  assert.ok(r.stderr.trim().length > 0);
  assert.ok(!fs.existsSync(path.join(path.dirname(f), ".ltt")));
});
test("VO-13 CLI ltt digest factory throws -> exit 1, stderr", () => {
  const f = writeLesson(`export default () => { throw new Error("boom"); };\n`);
  const r = ltt(["digest", f]);
  assert.equal(r.status, 1);
  assert.ok(r.stderr.trim().length > 0);
});
test("VO-13 CLI ltt digest usage error (no file) -> exit 2", () => {
  assert.equal(ltt(["digest"]).status, 2);
});

/** Spec v2: the question section shows order items in the shuffled display order, never in the correct order. */
function assertNotInCorrectOrder(Q, items) {
  const pos = items.map((t) => Q.indexOf(t));
  for (const [i, p] of pos.entries()) assert.ok(p >= 0, `order item ${items[i]} listed`);
  assert.ok(pos.some((p, i) => i > 0 && p < pos[i - 1]), `order items appear in correct order: ${items}`);
  const shown = [...items.keys()].sort((a, b) => pos[a] - pos[b]);
  assert.deepEqual(shown, shuffledOrder(items.length), "exact mulberry32(1) Fisher–Yates order (spec v3)");
}
test("VO-13 order quiz (fixture): question section lists items, not in correct order (spec v2 shuffle)", () => {
  assertNotInCorrectOrder(split(digest(fixture)).Q, ["첫째 항목", "둘째 항목", "셋째 항목"]);
});
test("VO-13 order quiz (example): question section not in correct order", () => {
  const it = L.input.quiz.find((q) => q.kind === "order");
  const Q = split(digest(example)).Q;
  const sec = Q.slice(Q.indexOf(it.prompt));
  assertNotInCorrectOrder(sec, it.items);
});
