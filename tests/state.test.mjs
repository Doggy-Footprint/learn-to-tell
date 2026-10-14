import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const KIT = new URL("../skills/learn-to-tell/kit/", import.meta.url);
function load(withElk) {
  const c = { console: { info() {}, warn() {} }, setTimeout, clearTimeout };
  c.global = c;
  vm.createContext(c);
  for (const f of [...(withElk ? ["vendor/elk.bundled.js"] : []), "vendor/d3.min.js", "ltt.js", "ltt-parts.js"]) {
    vm.runInContext(readFileSync(new URL(f, KIT), "utf8"), c);
  }
  return c.LTT;
}
const plain = (o) => JSON.parse(JSON.stringify(o));

const DOOR = {
  initial: "closed",
  states: [{ id: "closed", l: "닫힘" }, { id: "open", l: "열림" }, { id: "locked", l: "잠김", s: "열쇠 필요" }, { id: "gone", l: "철거", final: true }],
  transitions: [
    { f: "closed", t: "open", l: "열기" }, { f: "open", t: "closed", l: "닫기" }, { f: "closed", t: "locked", l: "잠그기" },
    { f: "locked", t: "closed", l: "풀기" }, { f: "locked", t: "locked", l: "두드림" }, { f: "closed", t: "closed", l: "밀기" }, { f: "closed", t: "gone", l: "철거" },
  ],
};

test("stateSpec adds an entry dot, folds self-transitions into the sub line and marks final states with a ring", () => {
  const out = plain(load(false).stateSpec(DOOR));
  assert.deepEqual(out.nodes.map((n) => n.id), ["__start", "closed", "open", "locked", "gone"]);
  assert.deepEqual(out.edges[0], { id: "__start>closed", f: "__start", t: "closed" });
  assert.equal(out.edges.filter((e) => e.f === e.t).length, 0);
  assert.equal(out.edges.length, 1 + 5);
  const byId = Object.fromEntries(out.nodes.map((n) => [n.id, n]));
  assert.equal(byId.locked.s, "열쇠 필요\n↻ 두드림");
  assert.equal(byId.closed.s, "↻ 밀기");
  assert.equal(byId.gone.ring, true);
  assert.equal("final" in byId.gone, false);
  assert.equal(out.direction, "RIGHT");
});

test("stateSpec leaves the caller's objects untouched and passes layout options through", () => {
  const src = plain(DOOR);
  const out = plain(load(false).stateSpec({ ...src, direction: "DOWN", pad: 8, label: "문" }));
  assert.deepEqual(src, plain(DOOR));
  assert.equal(out.direction, "DOWN");
  assert.equal(out.pad, 8);
  assert.equal(out.label, "문");
  assert.equal("maxWidth" in out, false);
});

test("stateSpec rejects unknown states", () => {
  const { stateSpec } = load(false);
  assert.throws(() => stateSpec({ states: [{ id: "a" }], transitions: [{ f: "a", t: "zz" }] }), /zz|missing/);
  assert.throws(() => stateSpec({ initial: "nope", states: [{ id: "a" }] }), /nope/);
});

test("stateSpec output lays out with elk: no self loops reach autoLayout and the entry dot sits before the initial state", async () => {
  const LTT = load(true);
  const spec = plain(await LTT.autoLayout(LTT.stateSpec(DOOR)));
  const byId = Object.fromEntries(spec.nodes.map((n) => [n.id, n]));
  assert.ok(byId.__start.x < byId.closed.x);
  assert.equal(byId.__start.w, 22);
  assert.ok(byId.locked.h > 52, "two sub lines grow the box");
  assert.doesNotThrow(() => LTT.diagramLayout(spec));
});
