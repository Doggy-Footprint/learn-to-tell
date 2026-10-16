import { test } from "node:test";
import assert from "node:assert/strict";
import { D, L, concept, getC, ids, edgeKeys, frontierIds, msgs, ymd, lessonText } from "./helpers.mjs";

const hist = (c) => (c.history ?? c.quizzes ?? []).map((h) => `${ymd(h.date)}|${h.lesson}|${h.quiz}`).sort();

// VO-1 equivalence partitioning ------------------------------------------
test("VO-1 P1 lesson without frontmatter contributes nothing and no error", async () => {
  const d = await D([{ path: "lessons/old/result.md", text: "# Old result\n\nconcepts:\n  - id: ghost\n" }]);
  assert.deepEqual(ids(d), []);
  assert.deepEqual(msgs(d.errors), []);
});
test("VO-1 P2 empty concepts block contributes nothing and no error", async () => {
  const d = await D([L("l1", "2026-10-01", [])]);
  assert.deepEqual(ids(d), []);
  assert.deepEqual(msgs(d.errors), []);
});
test("VO-1 P3 single lesson maps every field; body below frontmatter is ignored (FR-1)", async () => {
  const d = await D([
    L("l1", "2026-10-01", [concept("a", { title: "Alpha", definition: "first", domains: ["gpu"], level: 3, aliases: ["al"], quiz: "pass" })], {
      body: "# R\n---\nconcepts:\n  - id: ghost\n    title: no\n",
    }),
  ]);
  assert.deepEqual(ids(d), ["a"]);
  const a = getC(d, "a");
  assert.equal(a.title, "Alpha");
  assert.equal(a.definition, "first");
  assert.equal(a.level, 3);
  assert.deepEqual(a.domains, ["gpu"]);
  assert.deepEqual(a.aliases, ["al"]);
  assert.deepEqual(a.lessons, ["l1"]);
  assert.deepEqual(hist(a), ["2026-10-01|l1|pass"]);
  assert.deepEqual(msgs(d.errors), []);
});
test("VO-1 P3b quoted date string is accepted like an unquoted date", async () => {
  const t = lessonText({ lesson: "l1", date: "2026-10-01", concepts: [concept("a")] }).replace("date: 2026-10-01", 'date: "2026-10-01"');
  const d = await D([{ path: "lessons/l1/result.md", text: t }]);
  assert.deepEqual(ids(d), ["a"]);
  assert.deepEqual(hist(getC(d, "a")), ["2026-10-01|l1|none"]);
});
test("VO-1 P4 same id in two lessons merges per FR-2 regardless of input order", async () => {
  const old = L("20261001-x", "2026-10-01", [
    concept("a", { title: "Old", definition: "old def", level: 2, domains: ["gpu"], aliases: ["zz"], requires: ["r1"], quiz: "fail" }),
  ]);
  const neu = L("20261005-y", "2026-10-05", [
    concept("a", { title: "New", definition: "new def", level: 4, domains: ["linear-algebra"], aliases: ["aa"], leads_to: ["n1"], quiz: "pass" }),
  ]);
  for (const order of [[old, neu], [neu, old]]) {
    const a = getC(await D(order), "a");
    assert.equal(a.title, "New");
    assert.equal(a.definition, "new def");
    assert.equal(a.level, 4);
    assert.deepEqual(a.domains, ["gpu", "linear-algebra"]);
    assert.deepEqual(a.aliases, ["aa", "zz"]);
    assert.deepEqual(a.requires, ["r1"]);
    assert.deepEqual(a.leads_to, ["n1"]);
    assert.deepEqual(a.lessons, ["20261001-x", "20261005-y"]);
    assert.deepEqual(hist(a), ["2026-10-01|20261001-x|fail", "2026-10-05|20261005-y|pass"]);
  }
});
test("VO-1 P5 date tie: lexicographically greater lesson id wins", async () => {
  const a = L("20261001-a", "2026-10-01", [concept("c", { title: "FromA", definition: "da", level: 1 })]);
  const b = L("20261001-b", "2026-10-01", [concept("c", { title: "FromB", definition: "db", level: 5 })]);
  for (const order of [[a, b], [b, a]]) {
    const c = getC(await D(order), "c");
    assert.deepEqual([c.title, c.definition, c.level], ["FromB", "db", 5]);
  }
});
test("VO-1 P6 concept removed from its only lesson disappears from derivation", async () => {
  const both = await D([L("l1", "2026-10-01", [concept("a"), concept("b")])]);
  assert.deepEqual(ids(both), ["a", "b"]);
  const one = await D([L("l1", "2026-10-01", [concept("a")])]);
  assert.deepEqual(ids(one), ["a"]);
});
test("VO-1 C-1 two lessons with disjoint concepts both derive", async () => {
  const d = await D([L("l1", "2026-10-01", [concept("a")]), L("l2", "2026-10-02", [concept("b")])]);
  assert.deepEqual(ids(d), ["a", "b"]);
});

// FR-7 status
for (const [name, entries, want] of [
  ["pass -> learned", [["2026-10-01", "pass"]], "learned"],
  ["fail -> weak", [["2026-10-01", "fail"]], "weak"],
  ["skipped -> diagnosed", [["2026-10-01", "skipped"]], "diagnosed"],
  ["none -> diagnosed", [["2026-10-01", "none"]], "diagnosed"],
  ["pass then later fail -> weak", [["2026-10-01", "pass"], ["2026-10-05", "fail"]], "weak"],
  ["fail then later pass -> learned", [["2026-10-01", "fail"], ["2026-10-05", "pass"]], "learned"],
]) {
  test(`VO-5 FR-7 status ${name}`, async () => {
    const ls = entries.map(([date, quiz], i) => L(`l${i}`, date, [concept("a", { quiz })]));
    assert.equal(getC(await D(ls.reverse()), "a").status, want);
  });
}

// VO-2 decision table: edge sources ------------------------------------------
const pair = (extra) => [L("l1", "2026-10-01", [concept("a", extra.a ?? {}), concept("b", extra.b ?? {})])];
const link = (from, to) => ({ op: "link", from, to, date: "2026-10-02" });
const rules = [
  ["R1 leads_to only", pair({ a: { leads_to: ["b"] } }), []],
  ["R2 requires only", pair({ b: { requires: ["a"] } }), []],
  ["R3 link only", pair({}), [link("a", "b")]],
  ["R4 leads_to + requires", pair({ a: { leads_to: ["b"] }, b: { requires: ["a"] } }), []],
  ["R5 leads_to + link", pair({ a: { leads_to: ["b"] } }), [link("a", "b")]],
  ["R6 requires + link", pair({ b: { requires: ["a"] } }), [link("a", "b")]],
  ["R7 all three", pair({ a: { leads_to: ["b"] }, b: { requires: ["a"] } }), [link("a", "b"), link("a", "b")]],
];
for (const [name, ls, decs] of rules) {
  test(`VO-2 ${name} -> exactly one edge a>b, no frontier`, async () => {
    const d = await D(ls, decs);
    assert.deepEqual(edgeKeys(d.edges), ["a>b"]);
    assert.deepEqual(frontierIds(d), []);
  });
}
test("VO-2 R8 leads_to target missing -> frontier node, edge kept, no concept entry", async () => {
  const d = await D(pair({ a: { leads_to: ["ghost"] } }));
  assert.deepEqual(frontierIds(d), ["ghost"]);
  assert.deepEqual(edgeKeys(d.edges), ["a>ghost"]);
  assert.equal(getC(d, "ghost"), undefined);
});
test("VO-2 R8b requires target missing -> prereq frontier, direction prereq>dependent", async () => {
  const d = await D(pair({ b: { requires: ["pre"] } }));
  assert.deepEqual(frontierIds(d), ["pre"]);
  assert.deepEqual(edgeKeys(d.edges), ["pre>b"]);
});
test("VO-2 opposite directions are distinct edges", async () => {
  const d = await D(pair({ a: { leads_to: ["b"] }, b: { leads_to: ["a"] } }));
  assert.deepEqual(edgeKeys(d.edges), ["a>b", "b>a"]);
});

// VO-3 state transition: merge ------------------------------------------------
const merge = (from, into) => ({ op: "merge", from, into, date: "2026-10-03" });
test("VO-3 S-active: no decisions keeps every concept, no merged_from", async () => {
  const d = await D([L("l1", "2026-10-01", [concept("x"), concept("y")])]);
  assert.deepEqual(ids(d), ["x", "y"]);
  assert.equal((getC(d, "y").merged_from ?? []).length, 0);
});
test("VO-3 T-merge: X into Y moves history and edges; references resolve (C-5)", async () => {
  const d = await D(
    [
      L("l1", "2026-10-01", [concept("x", { quiz: "pass", leads_to: ["w"] }), concept("y", { quiz: "fail" }), concept("w")]),
      L("l2", "2026-10-02", [concept("z", { requires: ["x"] })]),
    ],
    [merge("x", "y")],
  );
  assert.deepEqual(ids(d), ["w", "y", "z"]);
  assert.deepEqual(getC(d, "y").merged_from, ["x"]);
  assert.deepEqual(edgeKeys(d.edges), ["y>w", "y>z"]);
  assert.equal(hist(getC(d, "y")).length, 2);
  assert.deepEqual(frontierIds(d), []);
});
test("VO-3 T-merge-into-merged / chain: A->B and B->C in both orders resolve A to C", async () => {
  const ls = [L("l1", "2026-10-01", [concept("a"), concept("b"), concept("c")]), L("l2", "2026-10-02", [concept("e", { requires: ["a"] })])];
  for (const decs of [[merge("a", "b"), merge("b", "c")], [merge("b", "c"), merge("a", "b")]]) {
    const d = await D(ls, decs);
    assert.deepEqual(ids(d), ["c", "e"]);
    assert.deepEqual(edgeKeys(d.edges), ["c>e"]);
    assert.ok(getC(d, "c").merged_from.includes("b"));
    assert.deepEqual(msgs(d.errors), []);
  }
});
test("VO-3 T-cycle: merge X->Y and Y->X is an error naming both, neither applied (C-15)", async () => {
  const d = await D([L("l1", "2026-10-01", [concept("x"), concept("y")])], [merge("x", "y"), merge("y", "x")]);
  assert.deepEqual(ids(d), ["x", "y"]);
  const errs = msgs(d.errors);
  assert.ok(errs.some((e) => e.includes("x") && e.includes("y")), JSON.stringify(errs));
  for (const id of ["x", "y"]) assert.equal((getC(d, id).merged_from ?? []).length, 0);
});

// FR-10
test("VO-1 FR-10 a lesson with one bad concept is skipped as a whole; others derive", async () => {
  const d = await D([
    L("bad", "2026-10-01", [concept("ok1"), concept("broken", { level: 9 })]),
    L("good", "2026-10-02", [concept("ok2")]),
  ]);
  assert.deepEqual(ids(d), ["ok2"]);
  assert.ok(msgs(d.errors).some((e) => e.includes("bad/result.md")));
});

test("VO-1 derive is pure: same input twice gives identical output", async () => {
  const ls = [L("l1", "2026-10-01", [concept("a", { leads_to: ["b"] }), concept("b")]), L("l2", "2026-10-02", [concept("c", { requires: ["a"] })])];
  const a = JSON.stringify(await D(ls));
  assert.equal(JSON.stringify(await D(ls)), a);
});

// F-1 / FR-2: unions are deduplicated and sorted
test("VO-1 P4 FR-2 unions overlap across lessons and duplicate inside one lesson: exact deduped sorted arrays", async () => {
  const first = L("20261001-x", "2026-10-01", [
    concept("a", { domains: ["os", "gpu", "gpu"], aliases: ["y", "x", "x"], requires: ["r2", "r1", "r1"], leads_to: ["n2", "n1", "n2"] }),
  ]);
  const second = L("20261005-y", "2026-10-05", [
    concept("a", { domains: ["os", "linear-algebra"], aliases: ["y", "z"], requires: ["r1", "r3"], leads_to: ["n1", "n3"] }),
  ]);
  for (const order of [[first, second], [second, first]]) {
    const a = getC(await D(order), "a");
    assert.deepEqual(a.domains, ["gpu", "linear-algebra", "os"]);
    assert.deepEqual(a.aliases, ["x", "y", "z"]);
    assert.deepEqual(a.requires, ["r1", "r2", "r3"]);
    assert.deepEqual(a.leads_to, ["n1", "n2", "n3"]);
    assert.deepEqual(a.lessons, ["20261001-x", "20261005-y"]);
  }
});
test("VO-1 P3 FR-2 single lesson: duplicate values inside one lesson collapse and sort", async () => {
  const a = getC(await D([L("l1", "2026-10-01", [concept("a", { domains: ["gpu", "gpu", "al"], aliases: ["q", "q"] })])]), "a");
  assert.deepEqual(a.domains, ["al", "gpu"]);
  assert.deepEqual(a.aliases, ["q"]);
});

// F-2 / FR-4: frontier entries are id + status only
test("VO-2 FR-4 frontier entries carry exactly id and status 'frontier'", async () => {
  const d = await D(pair({ a: { leads_to: ["ghost"] }, b: { requires: ["pre"] } }));
  const arr = Array.isArray(d.frontier) ? d.frontier : d.frontier instanceof Map ? [...d.frontier.values()] : Object.values(d.frontier);
  assert.equal(arr.length, 2);
  for (const f of arr) {
    assert.equal(typeof f, "object");
    assert.deepEqual(Object.keys(f).sort(), ["id", "status"]);
    assert.equal(f.status, "frontier");
  }
  assert.deepEqual(arr.map((f) => f.id).sort(), ["ghost", "pre"]);
});

// F-3 / FR-5
test("VO-3 FR-5 T-merge: X's aliases, domains, requires, leads_to and lessons move into Y (distinct values)", async () => {
  const d = await D(
    [
      L("lx", "2026-10-01", [concept("x", { aliases: ["xa"], domains: ["os"], requires: ["rx"], leads_to: ["lx-t"] })]),
      L("ly", "2026-10-02", [concept("y", { aliases: ["ya"], domains: ["gpu"], requires: ["ry"], leads_to: ["ly-t"] })]),
    ],
    [merge("x", "y")],
  );
  const y = getC(d, "y");
  assert.equal(getC(d, "x"), undefined);
  assert.deepEqual(y.domains, ["gpu", "os"]);
  assert.deepEqual(y.requires, ["rx", "ry"]);
  assert.deepEqual(y.leads_to, ["ly-t", "lx-t"].sort());
  assert.deepEqual(y.lessons, ["lx", "ly"]);
  for (const al of ["xa", "ya"]) assert.ok(y.aliases.includes(al), al);
  assert.deepEqual(edgeKeys(d.edges), ["rx>y", "ry>y", "y>lx-t", "y>ly-t"].sort());
  assert.deepEqual(y.merged_from, ["x"]);
});
test("VO-3 T-cycle: 3-merge cycle a->b, b->c, c->a is an error and none applied; unrelated merge still applies", async () => {
  const d = await D(
    [L("l1", "2026-10-01", ["a", "b", "c", "d", "e"].map((id) => concept(id)))],
    [merge("a", "b"), merge("b", "c"), merge("d", "e"), merge("c", "a")],
  );
  assert.deepEqual(ids(d), ["a", "b", "c", "e"]);
  assert.deepEqual(getC(d, "e").merged_from, ["d"]);
  for (const id of ["a", "b", "c"]) assert.equal((getC(d, id).merged_from ?? []).length, 0, id);
  // the three cycle decisions are log lines 1, 2 and 4; the unrelated merge is line 3
  assert.ok(msgs(d.errors).some((e) => /decisions\.jsonl:1\b/.test(e) && /decisions\.jsonl:2\b/.test(e) && /decisions\.jsonl:4\b/.test(e) && !/decisions\.jsonl:3\b/.test(e)), JSON.stringify(d.errors));
});
test("VO-3 T-cycle: 2-merge cycle in a log with an unrelated merge: unrelated merge applies", async () => {
  const d = await D(
    [L("l1", "2026-10-01", ["x", "y", "p", "q"].map((id) => concept(id)))],
    [merge("x", "y"), merge("p", "q"), merge("y", "x")],
  );
  assert.deepEqual(ids(d), ["q", "x", "y"]);
  assert.deepEqual(getC(d, "q").merged_from, ["p"]);
});
