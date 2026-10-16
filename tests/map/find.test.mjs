import { test } from "node:test";
import assert from "node:assert/strict";
import { D, L, concept, lib, conceptsOf, tmpHome, writeHome, ltt } from "./helpers.mjs";

const { find } = await lib("find");

async function corpus() {
  const d = await D([
    L("l1", "2026-10-01", [
      concept("gpu-warp", { title: "GPU Warp", definition: "32 threads executing in lockstep", domains: ["gpu"] }),
      concept("memory-coalescing", { title: "Memory Access Pattern", aliases: ["Coalescing"], definition: "adjacent threads touch adjacent addresses", domains: ["gpu"] }),
      concept("cache-eviction", { title: "Cache Eviction", definition: "choosing which line to drop", domains: ["os"] }),
      concept("warp-divergence", { title: "Warp divergence cost", definition: "branches serialize lanes", domains: ["gpu"] }),
      concept("lockstep-note", { title: "Unrelated Note", definition: "warp divergence appears here only in the definition", domains: ["os"] }),
    ]),
  ]);
  return conceptsOf(d);
}
const cs = await corpus();
const run = (q, o = {}) => find(cs, q, o);

test("VO-8 exact by id: first, score 1, exact true", () => {
  const r = run("gpu-warp", {});
  assert.equal(r[0].id, "gpu-warp");
  assert.equal(r[0].score, 1);
  assert.equal(r[0].exact, true);
});
test("VO-8 exact by title", () => assert.equal(run("Cache Eviction", {})[0].id, "cache-eviction"));
test("VO-8 exact by alias beats partial hits (C-7)", () => {
  const r = run("coalescing", {});
  assert.equal(r[0].id, "memory-coalescing");
  assert.equal(r[0].exact, true);
  assert.equal(r[0].score, 1);
});
for (const q of ["GPU_WARP", "gpuwarp", "gpu  warp", "Gpu-Warp", "ＧＰＵ　ｗａｒｐ", "COALESCING"]) {
  test(`VO-8 normalized match (case/hyphen/underscore/space/NFKC) "${q}" is exact`, () => {
    const r = run(q, {});
    assert.equal(r[0].exact, true, JSON.stringify(r));
    assert.equal(r[0].score, 1);
  });
}
test("VO-8 partial (query is no normalized id/title/alias): title hit (weight 2) outranks definition-only hit (weight 1); not exact", () => {
  const r = run("divergent warps", {});
  const i = r.findIndex((x) => x.id === "warp-divergence");
  const j = r.findIndex((x) => x.id === "lockstep-note");
  assert.ok(i >= 0 && j >= 0, JSON.stringify(r));
  assert.ok(i < j);
  for (const x of r) assert.ok(x.score > 0 && !x.exact);
  for (let k = 1; k < r.length; k++) assert.ok(r[k - 1].score >= r[k].score);
});
test("VO-8 result items carry id, title, definition", () => {
  const x = run("cache eviction", {})[0];
  assert.deepEqual([x.id, x.title, x.definition], ["cache-eviction", "Cache Eviction", "choosing which line to drop"]);
});
test("VO-8 no match -> empty array", () => assert.deepEqual(run("zzzqqqxxx", {}), []));
test("VO-8 k=1 limits to one; default k is 5", async () => {
  assert.equal(run("warp", { k: 1 }).length, 1);
  const d = await D([L("l1", "2026-10-01", Array.from({ length: 9 }, (_, i) => concept(`warp-${i}`, { title: `Warp thing ${i}` })))]);
  assert.equal(find(conceptsOf(d), "warp thing", {}).length, 5);
  assert.equal(find(conceptsOf(d), "warp thing", { k: 7 }).length, 7);
});
test("VO-8 ties are ordered by id", async () => {
  const d = await D([L("l1", "2026-10-01", ["b-x", "a-x", "c-x"].map((id) => concept(id, { title: "same title words", definition: "same def words" })))]);
  assert.deepEqual(find(conceptsOf(d), "title words", {}).map((x) => x.id), ["a-x", "b-x", "c-x"]);
});
test("VO-8 domain filter keeps only that domain", () => {
  const r = run("warp", { domain: "os" });
  assert.ok(r.length > 0);
  for (const x of r) assert.ok(["cache-eviction", "lockstep-note"].includes(x.id), x.id);
});

// F-8 FR-12 additions
test("VO-8 domain filter excludes an exact-match concept that lives outside the domain", () => {
  assert.deepEqual(run("gpu-warp", { domain: "os" }).map((x) => x.id).filter((id) => id === "gpu-warp"), []);
  assert.equal(run("gpu-warp", { domain: "gpu" })[0].id, "gpu-warp");
});
test("VO-8 domain filter is applied before the k cut: k results from the domain even when other domains rank higher", async () => {
  const os = Array.from({ length: 6 }, (_, i) => concept(`os-${i}`, { title: `Warp scheduling note ${i}`, definition: "x", domains: ["os"] }));
  const gpu = Array.from({ length: 4 }, (_, i) => concept(`gpu-${i}`, { title: `Warp note ${i}`, definition: "y", domains: ["gpu"] }));
  const d = await D([L("l1", "2026-10-01", [...os, ...gpu])]);
  const r = find(conceptsOf(d), "warp scheduling note", { k: 3, domain: "gpu" });
  assert.equal(r.length, 3);
  for (const x of r) assert.match(x.id, /^gpu-/);
});
test("VO-8 exact hit ranks first with score 1 even when a partial hit has far more trigram overlap", async () => {
  const d = await D([
    L("l1", "2026-10-01", [
      concept("aa-p", { title: "cache lines cache", definition: "cache cache cache" }),
      concept("zz-e", { title: "Totally different", aliases: ["cache"], definition: "unrelated words" }),
    ]),
  ]);
  const r = find(conceptsOf(d), "cache", {});
  assert.deepEqual(r.map((x) => x.id), ["zz-e", "aa-p"]);
  assert.equal(r[0].score, 1);
  assert.equal(r[0].exact, true);
  assert.ok(!r[1].exact && r[1].score > 0);
});

// CLI -------------------------------------------------------------------------
function cliHome() {
  const home = tmpHome();
  writeHome(home, {
    lessons: [
      { id: "l1", ...L("l1", "2026-10-01", [
        concept("gpu-warp", { title: "GPU Warp", definition: "32 threads in lockstep", domains: ["gpu"], aliases: ["Warp"], leads_to: ["warp-divergence"] }),
        concept("warp-divergence", { title: "Warp divergence", definition: "branches serialize", domains: ["gpu"], leads_to: ["divergence-fix"] }),
        concept("divergence-fix", { title: "Divergence fix", definition: "predication", domains: ["gpu"], leads_to: ["far-away"] }),
        concept("far-away", { title: "Far away", definition: "four hops off", domains: ["gpu"] }),
        concept("old-warp", { title: "Old warp", definition: "to be merged", domains: ["gpu"], requires: ["gpu-warp"] }),
        concept("unrelated", { title: "Tax law", definition: "irrelevant", domains: ["law"] }),
      ]) },
    ],
    decisions: [{ op: "merge", from: "old-warp", into: "warp-divergence", date: "2026-10-02" }],
  });
  assert.equal(ltt(home, ["rebuild"]).code, 0);
  return home;
}
const home = cliHome();

test("VO-8 CLI find: exact alias line format and ordering", () => {
  const r = ltt(home, ["find", "Warp"]);
  assert.equal(r.code, 0);
  const lines = r.out.split("\n").filter(Boolean);
  const first = lines[0].split(" | ");
  assert.equal(first.length, 5, lines[0]);
  assert.deepEqual([first[0], first[1], first[2], first[4]], ["gpu-warp", "GPU Warp", "32 threads in lockstep", "exact"]);
  for (const l of lines.slice(1)) assert.equal(l.split(" | ").length, 4, l);
});
test("VO-8 CLI find -k 1 -> one line; no match -> no lines, exit 0 (C-12)", () => {
  assert.equal(ltt(home, ["find", "warp", "-k", "1"]).out.split("\n").filter(Boolean).length, 1);
  const none = ltt(home, ["find", "qqqzzzxxx"]);
  assert.equal(none.code, 0);
  assert.equal(none.out.trim(), "");
});
test("VO-8 CLI find --domain filter", () => {
  const r = ltt(home, ["find", "law tax", "--domain", "gpu"]);
  assert.ok(!r.out.includes("unrelated"));
  assert.ok(ltt(home, ["find", "Tax law", "--domain", "law"]).out.startsWith("unrelated |"));
});
test("VO-8 CLI show depth 1: concept and neighbors only, <= 1 + degree lines", () => {
  const r = ltt(home, ["show", "warp-divergence"]);
  assert.equal(r.code, 0);
  const lines = r.out.split("\n").filter((l) => l.trim());
  // neighbors of warp-divergence: gpu-warp, divergence-fix, and merged old-warp's edge (gpu-warp) collapses
  assert.ok(lines.length <= 1 + 2, r.out);
  for (const id of ["warp-divergence", "gpu-warp", "divergence-fix"]) assert.ok(r.out.includes(id), id);
  for (const id of ["far-away", "unrelated"]) assert.ok(!r.out.includes(id), id);
});
test("VO-8 CLI show --depth 2 reaches two hops, still not the whole map", () => {
  const r = ltt(home, ["show", "warp-divergence", "--depth", "2"]);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes("far-away"));
  assert.ok(!r.out.includes("unrelated"));
});
test("VO-8 CLI show merged id resolves to its target (C-5)", () => {
  const r = ltt(home, ["show", "old-warp"]);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes("warp-divergence"));
});
