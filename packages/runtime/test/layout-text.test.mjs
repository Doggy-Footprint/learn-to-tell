// VO-2 (FR-2, C-2, C-3) measureText/wrapText; VO-3 (FR-3, C-4..C-7) placeTexts.
// Oracles: spec formulas (height = lines × size × 1.3, no kerning => additive widths, linear in size), placement guarantees.
import { test } from "node:test";
import assert from "node:assert/strict";
import { segHitsBox, LAYOUT, overlaps, inside, distToBox, center, overlapPairs, closePairs, tooClose } from "./fixtures/m1.mjs";

const { measureText, wrapText, placeTexts, LEADER_PX, TEXT, TEXT_GAP } = await import(LAYOUT);
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b} (tol ${tol})`);

// ---------- VO-2 ----------
test("VO-2 constants TEXT and LEADER_PX match spec", () => {
  assert.deepEqual(TEXT, { figure: { m: 14, s: 12, l: 17 }, card: 16, min: 12 });
  assert.equal(LEADER_PX, 20);
  assert.equal(TEXT_GAP, 6, "spec v11");
});
test("VO-2 C-2 measureText('가나다', 14) twice: equal, width > 0, height = 14 × 1.3", () => {
  const a = measureText("가나다", { size: 14 }), b = measureText("가나다", { size: 14 });
  assert.deepEqual(a, b);
  assert.ok(a.width > 0);
  close(a.height, 14 * 1.3, 1e-9);
});
const CLASSES = [["Hangul", "공기저항"], ["Latin", "Drag force"], ["digits", "0123456789"], ["punctuation", ".,;:!?()[]—·°%"], ["space", "   "], ["mixed", "v0 = 40 m/s, 각도 45°"]];
for (const [name, s] of CLASSES) {
  test(`VO-2 ${name}: width > 0, height 1 line, additive (no kerning), linear in size, deterministic`, () => {
    const w = measureText(s, { size: 14 });
    assert.ok(w.width > 0, "width > 0");
    close(w.height, 14 * 1.3, 1e-9);
    const parts = [...s].reduce((acc, ch) => acc + measureText(ch, { size: 14 }).width, 0);
    close(w.width, parts, 1e-6, "sum of glyph widths");
    close(measureText(s, { size: 28 }).width, 2 * w.width, 1e-6, "linear in size");
    assert.deepEqual(measureText(s, { size: 14 }), w);
  });
}
test("VO-2 empty string has width 0", () => {
  assert.equal(measureText("", { size: 14 }).width, 0);
});
test("VO-2 weight 600 is at least as wide as 400 and differs for Latin", () => {
  const s = "Bold Weight 600";
  const a = measureText(s, { size: 14, weight: 400 }).width, b = measureText(s, { size: 14, weight: 600 }).width;
  assert.ok(b >= a);
  assert.notEqual(a, b, "weight 600 uses its own width table");
  assert.equal(measureText(s, { size: 14 }).width, a, "default weight is 400");
});
const words = "냉각 상수가 클수록 커피는 빨리 식는다";
test("VO-2 boundary: maxWidth = text width -> one line", () => {
  const w = measureText(words, { size: 14 }).width;
  assert.deepEqual(wrapText(words, { size: 14, maxWidth: w }), [words]);
});
test("VO-2 boundary: maxWidth = text width − 1 -> breaks at a space, every line ≤ maxWidth, words preserved", () => {
  const max = measureText(words, { size: 14 }).width - 1;
  const lines = wrapText(words, { size: 14, maxWidth: max });
  assert.ok(lines.length >= 2);
  for (const l of lines) assert.ok(measureText(l, { size: 14 }).width <= max + 1e-9, l);
  assert.equal(lines.join(" ").split(/\s+/).join(" "), words);
});
test("VO-2 weight 600 wraps against its own widths", () => {
  const max = measureText(words, { size: 14, weight: 600 }).width - 1;
  for (const l of wrapText(words, { size: 14, weight: 600, maxWidth: max })) assert.ok(measureText(l, { size: 14, weight: 600 }).width <= max + 1e-9);
});
test("VO-2 C-3 token longer than maxWidth splits per character; each line ≤ maxWidth; concatenation preserved", () => {
  const tok = "가나다라마바사아자차카타파하";
  const max = measureText("가나다", { size: 14 }).width;
  const lines = wrapText(tok, { size: 14, maxWidth: max });
  assert.ok(lines.length >= 5);
  for (const l of lines) assert.ok(measureText(l, { size: 14 }).width <= max + 1e-9, l);
  assert.equal(lines.join(""), tok);
});
test("VO-2 long token mixed with words: words still break at spaces", () => {
  const s = "짧은 SupercalifragilisticExpialidocious 말";
  const max = measureText("Supercali", { size: 14 }).width;
  const lines = wrapText(s, { size: 14, maxWidth: max });
  for (const l of lines) assert.ok(measureText(l, { size: 14 }).width <= max + 1e-9, l);
  assert.equal(lines.join("").replace(/\s/g, ""), s.replace(/\s/g, ""));
});

// ---------- VO-3 ----------
const W = 600, H = 400;
const req = (texts, obstacles = [], box = { width: W, height: H }) => ({ box, obstacles, texts });
const sz = (t, size = 14) => measureText(t, { size });

function invariants(r, rq) {
  const boxOf = { x: 0, y: 0, ...rq.box };
  for (const p of r.placed) {
    assert.ok(inside(p.box, boxOf, 1e-6), `${p.id} inside box`);
    for (const o of rq.obstacles) assert.ok(!tooClose(p.box, o), `${p.id} keeps ≥ 6 px from obstacle`);
    const t = rq.texts.find((x) => x.id === p.id);
    assert.ok(p.box.height >= p.lines.length * t.size * 1.3 - 1e-6, `${p.id} height fits lines at full size (size never shrinks)`);
    for (const l of p.lines) assert.ok(measureText(l, { size: t.size, weight: t.weight }).width <= p.box.width + 1e-6);
  }
  assert.deepEqual(closePairs(r.placed), [], "placed texts ≥ 6 px apart");
  const ids = new Set([...r.placed.map((p) => p.id), ...r.errors.map((e) => e.id)]);
  for (const t of rq.texts) assert.ok(ids.has(t.id), `${t.id} placed or reported`);
  for (const e of r.errors) {
    assert.equal(e.rule, "text-no-room");
    assert.ok(e.message.length > 0 && e.message.length <= 300);
  }
  for (const p of r.placed) {
    const t = rq.texts.find((x) => x.id === p.id);
    if (!p.leader && !t.leader) assert.ok(distToBox(t.ref, p.box) <= LEADER_PX + 1e-6, `${p.id} far from ref without leader`);
  }
}

test("VO-3 C-4 five texts at the same ref in a wide box: 5 placed, no overlap, inside, ≥ 2 leaders", () => {
  const rq = req(["냉각 곡선", "실온 22°C", "60°C 목표", "뚜껑 덮음", "지금 온도"].map((text, i) => ({ id: `t${i}`, text, size: 14, ref: [300, 200] })));
  const r = placeTexts(rq);
  invariants(r, rq);
  assert.equal(r.placed.length, 5);
  assert.deepEqual(r.errors, []);
  assert.ok(r.placed.filter((p) => p.leader).length >= 2);
});
for (const [name, ref] of [["(0,0)", [0, 0]], ["(W,0)", [W, 0]], ["(0,H)", [0, H]], ["(W,H)", [W, H]]]) {
  test(`VO-3 C-5 ref at corner ${name}: placed fully inside the box`, () => {
    const rq = req([{ id: "c", text: "모서리 글자", size: 14, ref }]);
    const r = placeTexts(rq);
    invariants(r, rq);
    assert.equal(r.placed.length, 1);
  });
}
test("VO-3 C-6 one-line text wider than the box (no maxWidth) -> text-no-room, not placed", () => {
  const text = "이 글자는 상자보다 훨씬 넓어서 들어갈 자리가 없다 이 글자는 상자보다 훨씬 넓다";
  const box = { width: Math.floor(sz(text).width / 2), height: 200 };
  const rq = req([{ id: "wide", text, size: 14, ref: [10, 10] }], [], box);
  const r = placeTexts(rq);
  assert.deepEqual(r.placed, []);
  assert.deepEqual(r.errors.map((e) => [e.id, e.rule]), [["wide", "text-no-room"]]);
});
test("VO-3 maxWidth wraps a long text so it fits", () => {
  const text = "이 글자는 상자보다 넓지만 maxWidth로 줄을 바꾸면 들어간다";
  const rq = req([{ id: "w", text, size: 14, ref: [150, 100], maxWidth: 120 }], [], { width: 300, height: 200 });
  const r = placeTexts(rq);
  invariants(r, rq);
  assert.equal(r.placed.length, 1);
  assert.ok(r.placed[0].lines.length >= 2);
  assert.ok(r.placed[0].box.width <= 120 + 1e-6);
});

const ANCHORS = {
  c: (b, [x, y]) => b.x <= x && x <= b.x + b.width && b.y <= y && y <= b.y + b.height,
  n: (b, [, y]) => b.y + b.height <= y + 1e-6,
  s: (b, [, y]) => b.y >= y - 1e-6,
  e: (b, [x]) => b.x >= x - 1e-6,
  w: (b, [x]) => b.x + b.width <= x + 1e-6,
};
for (const a of ["c", "n", "s", "e", "w", "ne", "nw", "se", "sw"]) {
  test(`VO-3 anchor ${a} in free space: first candidate is the anchor side`, () => {
    const ref = [300, 200];
    const rq = req([{ id: "a", text: "기준 글자", size: 14, ref, anchor: a }]);
    const r = placeTexts(rq);
    invariants(r, rq);
    const b = r.placed[0].box;
    for (const side of a === "c" ? ["c"] : [...a]) assert.ok(ANCHORS[side](b, ref), `side ${side} of ${JSON.stringify(b)}`);
    if (a !== "c") assert.ok(distToBox(ref, b) <= LEADER_PX, "anchor candidate is next to ref");
  });
}
test("VO-3 C-7 two fixed texts overlapping -> reported in errors", () => {
  const rq = req([{ id: "f1", text: "고정 글자 하나", size: 14, ref: [200, 200], anchor: "c", fixed: true }, { id: "f2", text: "고정 글자 둘", size: 14, ref: [205, 202], anchor: "c", fixed: true }]);
  const r = placeTexts(rq);
  assert.ok(r.errors.some((e) => (e.id === "f1" || e.id === "f2") && e.rule === "text-no-room"), JSON.stringify(r.errors));
  assert.deepEqual(closePairs(r.placed), []);
});
test("VO-3 fixed texts not overlapping: both placed at their ref/anchor spot, and become obstacles", () => {
  const texts = [
    { id: "f1", text: "고정 하나", size: 14, ref: [100, 100], anchor: "c", fixed: true },
    { id: "f2", text: "고정 둘", size: 14, ref: [400, 300], anchor: "c", fixed: true },
    { id: "free", text: "움직이는 글자", size: 14, ref: [100, 100] },
  ];
  const r = placeTexts(req(texts));
  invariants(r, req(texts));
  assert.deepEqual(r.errors, []);
  const f1 = r.placed.find((p) => p.id === "f1").box, f2 = r.placed.find((p) => p.id === "f2").box;
  const [cx1, cy1] = center(f1), [cx2, cy2] = center(f2);
  close(cx1, 100, 0.5); close(cy1, 100, 0.5); close(cx2, 400, 0.5); close(cy2, 300, 0.5);
  assert.ok(f1.width >= sz("고정 하나").width - 1e-6);
  assert.ok(!tooClose(r.placed.find((p) => p.id === "free").box, f1));
});
test("VO-3 fixed text keeps its spot even when an obstacle covers it -> error, never moved", () => {
  const rq = req([{ id: "f", text: "고정", size: 14, ref: [100, 100], anchor: "c", fixed: true }], [{ x: 80, y: 80, width: 40, height: 40 }]);
  const r = placeTexts(rq);
  const p = r.placed.find((x) => x.id === "f");
  if (p) { const [cx, cy] = center(p.box); close(cx, 100, 0.5); close(cy, 100, 0.5); }
  assert.ok(r.errors.some((e) => e.id === "f" && e.rule === "text-no-room"));
});
test("VO-3 req.leader always yields a leader ending at that point", () => {
  const rq = req([{ id: "l", text: "지시선", size: 14, ref: [300, 200], leader: [250, 150] }]);
  const r = placeTexts(rq);
  invariants(r, rq);
  const L = r.placed[0].leader;
  assert.ok(L, "leader present");
  const ends = [[L[0], L[1]], [L[2], L[3]]];
  assert.ok(ends.some(([x, y]) => Math.abs(x - 250) <= 0.5 && Math.abs(y - 150) <= 0.5), JSON.stringify(L));
});
test("VO-3 LEADER_PX boundary: crowded ref -> texts farther than LEADER_PX carry a leader; near ones need not", () => {
  const rq = req(Array.from({ length: 9 }, (_, i) => ({ id: `k${i}`, text: `글자 ${i}번`, size: 14, ref: [300, 200] })));
  const r = placeTexts(rq);
  invariants(r, rq);
  for (const p of r.placed) if (distToBox([300, 200], p.box) > LEADER_PX + 1e-6) assert.ok(p.leader, `${p.id} beyond LEADER_PX has leader`);
  assert.ok(r.placed.some((p) => !p.leader && distToBox([300, 200], p.box) <= LEADER_PX), "the first text sits next to ref without leader");
});
test("VO-3 no room anywhere (box filled by an obstacle) -> every text reported, none placed", () => {
  const rq = req([{ id: "a", text: "가", size: 14, ref: [50, 50] }, { id: "b", text: "나", size: 14, ref: [60, 60] }], [{ x: 0, y: 0, width: 200, height: 200 }], { width: 200, height: 200 });
  const r = placeTexts(rq);
  assert.deepEqual(r.placed, []);
  assert.deepEqual(r.errors.map((e) => e.id).sort(), ["a", "b"]);
});
function oneSlot() {
  const t = "한 칸";
  const m = sz(t);
  return { box: { width: Math.ceil(m.width) + 1, height: Math.ceil(m.height) + 1 }, t };
}
test("VO-3 priority: higher priority wins the only slot even when listed later", () => {
  const { box, t } = oneSlot();
  const rq = req([{ id: "low", text: t, size: 14, ref: [1, 1], priority: 1 }, { id: "high", text: t, size: 14, ref: [1, 1], priority: 5 }], [], box);
  const r = placeTexts(rq);
  assert.deepEqual(r.placed.map((p) => p.id), ["high"]);
  assert.deepEqual(r.errors.map((e) => e.id), ["low"]);
});
test("VO-3 equal priority: input order wins the only slot", () => {
  const { box, t } = oneSlot();
  const rq = req([{ id: "first", text: t, size: 14, ref: [1, 1] }, { id: "second", text: t, size: 14, ref: [1, 1] }], [], box);
  const r = placeTexts(rq);
  assert.deepEqual(r.placed.map((p) => p.id), ["first"]);
  assert.deepEqual(r.errors.map((e) => e.id), ["second"]);
});
test("VO-3 determinism: same input -> deep-equal output, input not mutated", () => {
  const rq = req(Array.from({ length: 12 }, (_, i) => ({ id: `d${i}`, text: `항구 ${i}`, size: [12, 14, 17][i % 3], ref: [200 + 10 * (i % 4), 150 + 7 * i], anchor: ["n", "e", "s", "w"][i % 4] })), [{ x: 220, y: 160, width: 60, height: 40 }]);
  const snap = JSON.stringify(rq);
  const a = placeTexts(rq), b = placeTexts(JSON.parse(snap));
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(rq), snap);
  invariants(a, rq);
});
test("VO-3 obstacles are avoided with ≥ 6 px gap (spec v11)", () => {
  const obstacles = [{ x: 0, y: 0, width: 300, height: 400 }];
  const rq = req([{ id: "o", text: "장애물 옆", size: 14, ref: [290, 200], anchor: "w" }], obstacles);
  const r = placeTexts(rq);
  invariants(r, rq);
  assert.equal(r.placed.length, 1);
  assert.ok(r.placed[0].box.x >= 306 - 1e-6, "≥ 6 px from the obstacle edge");
});

test("VO-3 v11 two fixed texts 5 px apart (gap < 6) -> reported like an overlap", () => {
  const w = measureText("고정", { size: 14 }).width;
  const rq = req([{ id: "g1", text: "고정", size: 14, ref: [100, 100], anchor: "c", fixed: true }, { id: "g2", text: "고정", size: 14, ref: [100 + w + 5, 100], anchor: "c", fixed: true }]);
  const r = placeTexts(rq);
  assert.ok(r.errors.some((e) => (e.id === "g1" || e.id === "g2") && e.rule === "text-no-room"), JSON.stringify(r.errors));
  assert.deepEqual(closePairs(r.placed), []);
});
test("VO-3 v11 two fixed texts 7 px apart -> both placed, no error", () => {
  const w = measureText("고정", { size: 14 }).width;
  const rq = req([{ id: "g1", text: "고정", size: 14, ref: [100, 100], anchor: "c", fixed: true }, { id: "g2", text: "고정", size: 14, ref: [100 + w + 7, 100], anchor: "c", fixed: true }]);
  const r = placeTexts(rq);
  assert.deepEqual(r.errors, []);
  assert.equal(r.placed.length, 2);
});

// ---------- spec v11 avoid segments ----------
test("VO-3 v11 avoid: a segment through the anchor-preferred spot with free space elsewhere -> placed box clear of every segment", () => {
  for (const anchor of ["n", "e", "s", "w"]) {
    const ref = [300, 200];
    const avoid = [[0, 190, 600, 190], [0, 210, 600, 210], [290, 0, 290, 400], [310, 0, 310, 400]].filter((s, i) => (anchor === "n" ? i === 0 : anchor === "s" ? i === 1 : anchor === "w" ? i === 2 : i === 3));
    const rq = { ...req([{ id: "t", text: "냉각 곡선", size: 14, ref, anchor }]), avoid };
    const r = placeTexts(rq);
    invariants(r, rq);
    assert.equal(r.placed.length, 1, anchor);
    for (const sg of avoid) assert.ok(!segHitsBox(sg, r.placed[0].box), `anchor ${anchor}: box ${JSON.stringify(r.placed[0].box)} crosses ${sg}`);
  }
});
test("VO-3 v11 avoid: several texts and a polyline -> every placed box clear when space allows", () => {
  const avoid = [[0, 200, 150, 120], [150, 120, 300, 200], [300, 200, 450, 120], [450, 120, 600, 200]];
  const rq = { ...req(["뚜껑 없음", "뚜껑 덮음", "실온", "60°C 목표"].map((text, i) => ({ id: `p${i}`, text, size: 14, ref: [150 * i + 75, 160] }))), avoid };
  const r = placeTexts(rq);
  invariants(r, rq);
  assert.equal(r.placed.length, 4);
  for (const p of r.placed) for (const sg of avoid) assert.ok(!segHitsBox(sg, p.box), `${p.id} crosses ${sg}`);
});
test("VO-3 v11 avoid: dense grid of segments covering the whole box -> still placed, no error", () => {
  const W2 = 200, H2 = 120, avoid = [];
  for (let x = 0; x <= W2; x += 4) avoid.push([x, 0, x, H2]);
  for (let y = 0; y <= H2; y += 4) avoid.push([0, y, W2, y]);
  const rq = { ...req([{ id: "t", text: "격자 위 글자", size: 14, ref: [100, 60] }], [], { width: W2, height: H2 }), avoid };
  const r = placeTexts(rq);
  assert.deepEqual(r.errors, []);
  assert.equal(r.placed.length, 1);
});
test("VO-3 v11 avoid omitted or empty -> same result as before (deterministic)", () => {
  const base = req([{ id: "t", text: "글자", size: 14, ref: [300, 200], anchor: "n" }]);
  assert.deepEqual(placeTexts(base), placeTexts({ ...base, avoid: [] }));
});
