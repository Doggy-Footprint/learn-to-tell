import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("../skills/learn-to-tell/kit/ltt.js");
const LTT = globalThis.LTT;
const schema = (fn, re) => assert.throws(fn, (e) => e instanceof LTT.SchemaError && re.test(e.message));

test("seq lays steps end to end, par takes its longest branch, beats sit 65% into each step plus the end", () => {
  const t = LTT.seq([["travel", { along: "a>b" }], { par: [["pulse", { node: "b" }], ["show", { id: "x", dur: 2 }]] }, ["wait", 1], ["mark", "ask"], ["zoom", { to: "b" }]]);
  assert.deepEqual(t.items.map((i) => [i.verb, i.start, i.dur]), [["travel", 0, 1.6], ["pulse", 1.6, 0.9], ["show", 1.6, 2], ["zoom", 4.6, 1.2]]);
  assert.equal(t.marks.ask, 4.6);
  assert.equal(t.dur, 5.8);
  assert.deepEqual(t.beats, [1.04, 2.9, 4.25, 5.38, 5.8]);
});

test("par passes side, panel and on down to its steps", () => {
  const t = LTT.seq([{ side: "right", par: [["highlight", { id: "a" }], ["show", { id: "b", side: "left" }]] }]);
  assert.deepEqual(t.items.map((i) => i.args.side), ["right", "left"]);
});

test("seq rejects unknown verbs and malformed steps with the list of valid verbs", () => {
  schema(() => LTT.seq([["fly", {}]]), /동사 'fly'는 없다.*travel/);
  schema(() => LTT.seq([["wait"]]), /wait/);
  schema(() => LTT.seq([{ foo: 1 }]), /단계는/);
});

test("parts enforce caps before drawing", () => {
  const nodes = Array.from({ length: 11 }, (_, i) => ({ id: "n" + i, label: "노드" }));
  schema(() => LTT.graph({ nodes, edges: [] }), /graph.nodes ≤ 10/);
  schema(() => LTT.graph({ nodes: [{ id: "a", label: "아주 길고 긴 노드 이름이 열여섯 자를 넘는다" }] }), /label ≤ 16자/);
  schema(() => LTT.graph({ nodes: [{ id: "a" }], edges: [{ from: "a", to: "z" }] }), /from·to는 노드 id/);
  schema(() => LTT.chart({ x: { domain: [0, 1] }, y: {}, series: [{ points: [[0, 1]] }] }), /y.domain/);
  schema(() => LTT.table({ cols: ["a", "b"], rows: [["x"]] }), /열 2개짜리/);
  schema(() => LTT.facts([{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }]), /facts ≤ 4/);
  schema(() => LTT.units({ n: 10, groups: [{ k: 11 }] }), /합\(11\)이 n\(10\)/);
  schema(() => LTT.terminal({ lines: ["x".repeat(80)] }), /64자/);
  schema(() => LTT.graph({ nodes: [{ id: "a", icon: "rocket" }] }), /아이콘 'rocket'은 없다/);
});

test("glossary marks count as their shown text toward caps", () => {
  LTT.graph({ nodes: [{ id: "a", label: "{{캐시|cache}} 계층의 맨 위" }] });
  schema(() => LTT.graph({ nodes: [{ id: "a", label: "{{캐시}} 계층의 맨 위에 있는 작은 것" }] }), /label ≤ 16자/);
});

test("lint enforces deck order, recall, terms and the scene budget", () => {
  const base = (scenes, extra = {}) => LTT.lint({ glossary: { TTL: "시간" }, scenes, ...extra }).issues.map((x) => x.rule);
  const good = [{ type: "hook", text: "{{TTL}}" }, { type: "figure", title: "a", recall: { q: "q", a: "a" } }, { type: "predict", title: "p", recall: { q: "q", a: "a" } }, { type: "summary", title: "s" }, { type: "overview", title: "o" }, { type: "keywords" }];
  assert.deepEqual(base(good).filter((r) => !/no-motion|no-reading/.test(r)), []);
  assert.ok(base(good.slice(1)).includes("hook-first"));
  assert.ok(base([good[0], good[3], good[5]]).includes("overview-missing"));
  assert.ok(base([{ type: "hook", text: "TTL 먼저" }, { type: "figure", title: "{{TTL}}" }, ...good.slice(3)]).includes("used-before-defined"));
  assert.ok(base([{ type: "hook", text: "{{캐시}}" }, ...good.slice(1)]).includes("unknown-term"));
  const many = [good[0], ...Array.from({ length: 10 }, () => ({ type: "figure", title: "x" })), ...good.slice(3)];
  assert.ok(base(many).includes("scene-budget"));
  assert.ok(!base(many, { budget: { scenes: 14, why: "긴 수업 요청" } }).includes("scene-budget"));
});
