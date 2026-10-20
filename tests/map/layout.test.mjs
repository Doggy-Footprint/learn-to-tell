import { test } from "node:test";
import assert from "node:assert/strict";
import { L, concept, lib, tmpHome, writeHome, ltt, readJson, gridRows, linkedOf, focusParts, itemId, isDashed, collect, stringValues, ago, realToday } from "./helpers.mjs";
import { join } from "node:path";

const { layoutGrid, layoutFocus } = await lib("layout");

function dataFor(lessons, decisions) {
  const home = tmpHome();
  writeHome(home, { lessons, decisions });
  ltt(home, ["rebuild"]);
  return readJson(join(home, "map-data.json"));
}
const T = realToday();
const lesson = (cs, date = ago(1, T)) => [{ id: "l1", ...L("l1", date, cs) }];

const data = dataFor(
  [
    ...lesson([
      concept("c-gpu", { title: "CenterG", domains: ["gpu"], level: 3, quiz: "pass", requires: ["p-gpu", "p-missing", "px-os"], leads_to: ["d-gpu", "d-missing"] }),
      concept("p-gpu", { title: "PrereqG", domains: ["gpu"], level: 1, quiz: "fail" }),
      concept("d-gpu", { title: "DepG", domains: ["gpu", "linear-algebra"], level: 4, quiz: "none" }),
      concept("px-os", { title: "PrereqOS", domains: ["os"], level: 1, quiz: "pass" }),
      concept("x-os", { title: "CrossOS", domains: ["os"], level: 3, quiz: "pass", requires: ["c-gpu"] }),
      concept("m-multi", { title: "MultiDom", domains: ["zeta", "alpha"], level: 5, quiz: "pass", requires: ["d-gpu"] }),
      concept("iso", { title: "Isolated", domains: ["alpha"], level: 1 }),
    ]),
    { id: "l0", ...L("l0", ago(100, T), [concept("old-stale", { title: "StaleOne", domains: ["alpha"], level: 2, quiz: "pass" })]) },
    { id: "l2", ...L("l2", ago(40, T), [concept("mid-fade", { title: "FadeOne", domains: ["alpha"], level: 2, quiz: "pass" })]) },
  ],
);

test("VO-10 domains many: rows are the sorted domains, each concept in each of its domains", () => {
  const rows = gridRows(layoutGrid(data));
  assert.deepEqual(rows.map((r) => r.domain), ["alpha", "gpu", "linear-algebra", "os", "zeta"]);
});
test("VO-10 columns are levels 1-5: each chip sits in the column of its level", () => {
  const rows = gridRows(layoutGrid(data));
  const want = { "c-gpu": 3, "p-gpu": 1, "d-gpu": 4, "x-os": 3, "px-os": 1, "m-multi": 5, iso: 1, "old-stale": 2, "mid-fade": 2 };
  for (const r of rows) for (const c of r.chips) assert.equal(c.col, want[c.id], `${r.domain}/${c.id}`);
});
test("VO-10 multi-domain concept appears once per domain (n rows), single-domain once (C-8)", () => {
  const rows = gridRows(layoutGrid(data));
  const where = (id) => rows.filter((r) => r.chips.some((c) => c.id === id)).map((r) => r.domain);
  assert.deepEqual(where("m-multi"), ["alpha", "zeta"]);
  assert.deepEqual(where("d-gpu"), ["gpu", "linear-algebra"]);
  assert.deepEqual(where("c-gpu"), ["gpu"]);
  assert.equal(rows.flatMap((r) => r.chips).filter((c) => c.id === "m-multi").length, 2);
});
test("VO-10 chip text is the concept title", () => {
  const chip = gridRows(layoutGrid(data)).flatMap((r) => r.chips).find((c) => c.id === "c-gpu");
  assert.ok(JSON.stringify(chip.chip).includes("CenterG"));
});
test("VO-10 chip color token follows freshness (fresh/fading/stale/weak/unquizzed), others absent", () => {
  const chips = gridRows(layoutGrid(data)).flatMap((r) => r.chips);
  const tokens = ["fresh", "fading", "stale", "weak", "unquizzed"];
  const values = (o) => collect(o, () => true).flatMap((x) => Object.values(x)).filter((v) => typeof v === "string");
  const expect = { "c-gpu": "fresh", "mid-fade": "fading", "old-stale": "stale", "p-gpu": "weak", "d-gpu": "unquizzed" };
  for (const [id, tok] of Object.entries(expect)) {
    const vals = values(chips.find((c) => c.id === id).chip);
    assert.ok(vals.some((v) => v.includes(tok)), `${id} lacks ${tok}`);
    for (const other of tokens.filter((t) => t !== tok)) {
      assert.ok(!vals.some((v) => v === other || v.endsWith(`-${other}`)), `${id} wrongly carries ${other}`);
    }
  }
});
test("VO-10 highlight set: hovering a concept highlights all connected concepts (both directions), C-8", () => {
  const g = layoutGrid(data);
  const norm = (id) => linkedOf(g, id).filter((x) => x !== id && !["p-missing", "d-missing"].includes(x)).sort();
  assert.deepEqual(norm("c-gpu"), ["d-gpu", "p-gpu", "px-os", "x-os"]);
  assert.deepEqual(norm("d-gpu"), ["c-gpu", "m-multi"]);
  assert.deepEqual(norm("m-multi"), ["d-gpu"]);
  assert.deepEqual(norm("iso"), []);
});
test("VO-10 domains one: single-domain data gives one row", () => {
  const d = dataFor(lesson([concept("a", { domains: ["only"] }), concept("b", { domains: ["only"], level: 4 })]));
  const rows = gridRows(layoutGrid(d));
  assert.deepEqual(rows.map((r) => r.domain), ["only"]);
  assert.deepEqual(rows[0].chips.map((c) => c.id).sort(), ["a", "b"]);
});
test("VO-10 empty data: no rows, no throw (C-23)", () => {
  const d = dataFor([]);
  assert.deepEqual(gridRows(layoutGrid(d)), []);
});

// focus
test("VO-10 focus: prerequisites below, dependents above, frontier dashed, cross-domain at sides", () => {
  const f = focusParts(layoutFocus(data, "c-gpu"));
  assert.equal(f.notFound, false);
  assert.equal(f.center, "c-gpu");
  assert.deepEqual(f.below.map(itemId).sort(), ["p-gpu", "p-missing"]);
  assert.deepEqual(f.above.map(itemId).sort(), ["d-gpu", "d-missing"]);
  assert.deepEqual(f.sides.map(itemId).sort(), ["px-os", "x-os"]);
  assert.ok(!f.below.map(itemId).includes("px-os"), "cross-domain prerequisite is in sides, not below");
  const dash = (arr) => Object.fromEntries(arr.map((x) => [itemId(x), isDashed(x)]));
  assert.deepEqual(dash(f.below), { "p-gpu": false, "p-missing": true });
  assert.deepEqual(dash(f.above), { "d-gpu": false, "d-missing": true });
  for (const s of f.sides) assert.ok(stringValues(s).includes("os"), "side item tagged with its domain");
});
test("VO-10 focus: concept with no neighbors has empty sections", () => {
  const f = focusParts(layoutFocus(data, "iso"));
  assert.equal(f.notFound, false);
  assert.deepEqual([f.below, f.above, f.sides], [[], [], []]);
});
test("VO-10 focus: unknown id -> not found (C-23); empty data too", () => {
  assert.equal(focusParts(layoutFocus(data, "nope")).notFound, true);
  assert.equal(focusParts(layoutFocus(dataFor([]), "nope")).notFound, true);
});
