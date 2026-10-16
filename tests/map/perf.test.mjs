import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { lib, L, concept, TODAY, tmpHome, writeHome, ltt, edgeKeys, conceptsOf } from "./helpers.mjs";

const { derive } = await lib("derive");
const { check } = await lib("check");
const { find } = await lib("find");

const N = 500;
const LESSONS = 100;
const id = (i) => `c${String(i).padStart(3, "0")}`;
// 800 unique forward edges i -> i+d (d=1,2): acyclic, as leads_to on the source concept
const edgesOf = (i) => {
  const out = [];
  for (let k = i; k < 800; k += 499) {
    if (k % 499 === i) out.push(id(i + 1 + Math.floor(k / 499)));
  }
  return out;
};
function gen() {
  const lessons = [];
  for (let l = 0; l < LESSONS; l++) {
    const cs = [];
    for (let j = 0; j < 5; j++) {
      const i = l * 5 + j;
      cs.push(concept(id(i), { title: `Concept number ${i}`, definition: `definition words ${i % 17} topic${i % 7}`, domains: [`dom${i % 6}`], level: 1 + (i % 5), leads_to: edgesOf(i), quiz: ["pass", "fail", "none", "skipped"][i % 4] }));
    }
    lessons.push({ id: `l${String(l).padStart(3, "0")}`, ...L(`l${String(l).padStart(3, "0")}`, `2026-09-${String(1 + (l % 28)).padStart(2, "0")}`, cs) });
  }
  return lessons;
}
const lessons = gen();
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

test("VO-13 generator oracle: 500 concepts, 100 lessons, 800 distinct edges", () => {
  const d = derive(lessons.map(({ path, text }) => ({ path, text })), [], TODAY);
  assert.equal(conceptsOf(d).length, N);
  assert.equal(new Set(edgeKeys(d.edges)).size, 800);
  assert.equal(d.edges.length, 800);
  assert.deepEqual(d.errors, []);
});
test("VO-13 QR-1 in-process derive+check median of 3 <= 2000 ms", () => {
  const input = lessons.map(({ path, text }) => ({ path, text }));
  const times = [];
  for (let r = 0; r < 3; r++) {
    const t0 = performance.now();
    const d = derive(input, [], TODAY);
    check(d);
    times.push(performance.now() - t0);
  }
  assert.ok(median(times) <= 2000, `median ${median(times)} ms`);
});
test("VO-13 QR-1 (supplementary, same threshold) CLI rebuild process median of 3 <= 2000 ms; QR-2 output bounds", () => {
  const home = tmpHome();
  writeHome(home, { lessons });
  const times = [];
  for (let r = 0; r < 3; r++) {
    const t0 = performance.now();
    const res = ltt(home, ["rebuild"]);
    times.push(performance.now() - t0);
    assert.equal(res.code, 0, res.all);
  }
  assert.ok(median(times) <= 2000, `median ${median(times)} ms`);

  const f = ltt(home, ["find", "concept number", "-k", "5"]);
  assert.ok(f.out.split("\n").filter(Boolean).length <= 5);
  assert.equal(ltt(home, ["find", "concept number", "-k", "3"]).out.split("\n").filter(Boolean).length, 3);
  // c010: in-edges from c009 and c008, out-edges to c011 and c012
  const s = ltt(home, ["show", "c010"]);
  const degree = 4;
  assert.ok(s.out.split("\n").filter((l) => l.trim()).length <= 1 + degree, s.out);
  assert.ok(s.out.includes("c010"));
});
test("VO-13 QR-2 find library bound on 500 concepts", () => {
  const d = derive(lessons.map(({ path, text }) => ({ path, text })), [], TODAY);
  assert.ok(find(conceptsOf(d), "concept number", { k: 5 }).length <= 5);
  assert.equal(find(conceptsOf(d), "concept number", { k: 1 }).length, 1);
});
