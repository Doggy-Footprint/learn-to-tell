import { test } from "node:test";
import assert from "node:assert/strict";
import { D, L, concept, allDiag, msgs, lessonText, getC, ids, lib } from "./helpers.mjs";

const diag = async (ls, decs = []) => allDiag(await D(ls, decs));
const named = (list, needle) => list.some((e) => e.includes(needle));

test("VO-6 clean input -> no errors, no warnings (rejects always-error)", async () => {
  const r = await diag([L("l1", "2026-10-01", [concept("a", { level: 2, leads_to: ["b"] }), concept("b", { level: 3 })])]);
  assert.deepEqual(r, { errors: [], warnings: [] });
});

// levels (C-10)
for (const [lv, ok] of [[1, true], [5, true], [0, false], [6, false]]) {
  test(`VO-6 level ${lv} -> ${ok ? "valid" : "error naming file, concept dropped"}`, async () => {
    const d = await D([L("lv", "2026-10-01", [concept("a", { level: lv })])]);
    const r = await allDiag(d);
    if (ok) {
      assert.deepEqual(r.errors, []);
      assert.deepEqual(ids(d), ["a"]);
    } else {
      assert.ok(named(r.errors, "lv/result.md"), JSON.stringify(r.errors));
      assert.deepEqual(ids(d), []);
    }
  });
}

const errCases = [
  ["invalid concept id syntax (uppercase)", [concept("Bad")]],
  ["invalid concept id syntax (slash)", [concept("a/b")]],
  ["invalid concept id syntax (leading hyphen)", [concept("-a")]],
  ["invalid concept id syntax (empty)", [concept("")]],
  ["invalid domain syntax", [concept("a", { domains: ["Not Valid"] })]],
  ["missing title", [concept("a", { title: undefined })]],
  ["missing definition", [concept("a", { definition: undefined })]],
  ["missing domains", [concept("a", { domains: undefined })]],
  ["empty domains", [concept("a", { domains: [] })]],
];
for (const [name, cs] of errCases) {
  test(`VO-6 error: ${name} -> names file, lesson skipped`, async () => {
    const d = await D([L("bad1", "2026-10-01", cs), L("good1", "2026-10-02", [concept("fine")])]);
    const r = await allDiag(d);
    assert.ok(named(r.errors, "bad1/result.md"), JSON.stringify(r.errors));
    assert.deepEqual(ids(d), ["fine"]);
  });
}
test("VO-6 error: lesson field differs from directory name (C-17)", async () => {
  const t = lessonText({ lesson: "other-name", date: "2026-10-01", concepts: [concept("a")] });
  const d = await D([{ path: "lessons/dirname/result.md", text: t }]);
  const r = await allDiag(d);
  assert.ok(named(r.errors, "dirname/result.md"), JSON.stringify(r.errors));
  assert.deepEqual(ids(d), []);
});
test("VO-6 error: YAML parse failure names the file, other lessons derive (C-13)", async () => {
  const d = await D([
    { path: "lessons/broken/result.md", text: "---\nlesson: broken\nconcepts: [ {id: a,\n  - : :\n---\nbody" },
    L("good", "2026-10-02", [concept("fine")]),
  ]);
  const r = await allDiag(d);
  assert.ok(named(r.errors, "broken/result.md"), JSON.stringify(r.errors));
  assert.deepEqual(ids(d), ["fine"]);
});
const rotations = (arr) => arr.map((_, i) => [...arr.slice(i), ...arr.slice(0, i)].join(","));
const cycleOrder = (msgText, re) => {
  const seq = [...msgText.matchAll(re)].map((m) => m[0]);
  const out = [];
  for (const x of seq) if (!out.includes(x)) out.push(x);
  return out.join(",");
};
test("VO-6 error: requires cycle (4 nodes, sorted order is not a cycle order) lists ids as a path along the cycle; check() alone reports it (C-14)", async () => {
  // n1 requires n3, n3 requires n2, n2 requires n4, n4 requires n1
  const d = await D([
    L("l1", "2026-10-01", [concept("n1", { requires: ["n3"] }), concept("n2", { requires: ["n4"] }), concept("n3", { requires: ["n2"] }), concept("n4", { requires: ["n1"] }), concept("outside")]),
  ]);
  const { check } = await lib("check");
  const errs = msgs(check(d).errors);
  const e = errs.find((x) => /\bn[1-4]\b/.test(x));
  assert.ok(e, JSON.stringify(errs));
  assert.ok(!/outside/.test(e));
  const order = cycleOrder(e, /\bn[1-4]\b/g);
  const along = rotations(["n1", "n3", "n2", "n4"]); // following requires edges
  const against = rotations(["n1", "n4", "n2", "n3"]); // following dependency direction
  assert.ok(along.includes(order) || against.includes(order), `ids not in cycle order: ${order}`);
  assert.deepEqual(ids(d), ["n1", "n2", "n3", "n4", "outside"]);
});
test("VO-6 error: two-node requires cycle A<->B names both (check alone)", async () => {
  const d = await D([L("l1", "2026-10-01", [concept("cy-a", { requires: ["cy-b"] }), concept("cy-b", { requires: ["cy-a"] })])]);
  const { check } = await lib("check");
  assert.ok(msgs(check(d).errors).some((e) => /\bcy-a\b/.test(e) && /\bcy-b\b/.test(e)));
});
test("VO-6 requires chain without cycle is not an error", async () => {
  const r = await diag([L("l1", "2026-10-01", [concept("a"), concept("b", { requires: ["a"] }), concept("c", { requires: ["b", "a"] })])]);
  assert.deepEqual(r.errors, []);
});

// warnings: check() in isolation on derive output
const checkOnly = async (ls, decs = []) => (await lib("check")).check(await D(ls, decs));
const word = (id) => new RegExp(`(?<![\\w-])${id}(?![\\w-])`);
test("VO-6 warning (check alone): prereq level 4 -> dependent level 2 names both ids (C-21); equal and lower levels do not warn", async () => {
  const w = await checkOnly([L("l1", "2026-10-01", [concept("pre-hi", { level: 4 }), concept("dep-lo", { level: 2, requires: ["pre-hi"] }), concept("bystander")])]);
  assert.deepEqual(msgs(w.errors), []);
  const hit = msgs(w.warnings).filter((x) => word("pre-hi").test(x) && word("dep-lo").test(x));
  assert.equal(hit.length, 1, JSON.stringify(w.warnings));
  assert.ok(!msgs(w.warnings).some((x) => word("bystander").test(x)));
  for (const [p, q] of [[2, 2], [1, 5]]) {
    const n = await checkOnly([L("l1", "2026-10-01", [concept("pre", { level: p }), concept("dep", { level: q, requires: ["pre"] })])]);
    assert.deepEqual(msgs(n.warnings), []);
  }
});
test("VO-6 warning (check alone): alias shared by exactly two concepts names those ids and not a third", async () => {
  const r = await checkOnly([L("l1", "2026-10-01", [concept("al-one", { aliases: ["sharedterm"] }), concept("al-two", { aliases: ["sharedterm"] }), concept("al-three", { aliases: ["other"] })])]);
  const w = msgs(r.warnings);
  assert.equal(w.filter((x) => word("al-one").test(x) && word("al-two").test(x)).length, 1, JSON.stringify(w));
  assert.ok(!w.some((x) => word("al-three").test(x)));
  assert.deepEqual(msgs(r.errors), []);
});
test("VO-6 warning (check alone): normalized title shared by two concepts names those ids and not a third", async () => {
  const r = await checkOnly([L("l1", "2026-10-01", [concept("ti-one", { title: "Cache Hit" }), concept("ti-two", { title: "cache-hit" }), concept("ti-three", { title: "Miss" })])]);
  const w = msgs(r.warnings);
  assert.equal(w.filter((x) => word("ti-one").test(x) && word("ti-two").test(x)).length, 1, JSON.stringify(w));
  assert.ok(!w.some((x) => word("ti-three").test(x)));
});
test("VO-6 warning (check alone): edge on a rejected pair names the pair; edge and concepts kept (C-20)", async () => {
  const d = await D(
    [L("l1", "2026-10-01", [concept("rj-a", { leads_to: ["rj-b"] }), concept("rj-b"), concept("rj-c")])],
    [{ op: "reject", a: "rj-b", b: "rj-a", date: "2026-10-02" }],
  );
  const { check } = await lib("check");
  const r = check(d);
  const w = msgs(r.warnings);
  assert.equal(w.filter((x) => word("rj-a").test(x) && word("rj-b").test(x)).length, 1, JSON.stringify(w));
  assert.ok(!w.some((x) => word("rj-c").test(x)));
  assert.deepEqual(msgs(r.errors), []);
  assert.deepEqual(ids(d), ["rj-a", "rj-b", "rj-c"]);
  assert.equal(d.edges.length, 1);
});
test("VO-6 reject without an edge between the pair gives no warning (check alone)", async () => {
  const r = await checkOnly([L("l1", "2026-10-01", [concept("a"), concept("b")])], [{ op: "reject", a: "a", b: "b", date: "2026-10-02" }]);
  assert.deepEqual(msgs(r.warnings), []);
});
