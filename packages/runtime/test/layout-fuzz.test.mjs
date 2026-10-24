// VO-4 (FR-3, QR-2) seeded random testing of placeTexts: seed 20261024, 2,000 cases, 3–40 texts, box 120–900 px, 0–10 obstacles.
// Property oracle (spec Fuzzing): every placed box inside the box, ≥ 6 px gap (spec v11) among placed boxes and to obstacles,
// every requested id is placed or reported as text-no-room. On failure the case index and request JSON are printed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LAYOUT, mulberry32, inside, tooClose, separation } from "./fixtures/m1.mjs";

const { placeTexts } = await import(LAYOUT);

const SEED = 20261024, CASES = 2000;
const WORDS = ["항구", "냉각", "상수", "Drag", "force", "v0", "45°", "60°C", "체선", "운임", "12", "3.5", "km/h", "공급망", "허브", "—", "(가정)", "x", "리튬"];
const ANCH = [undefined, "c", "n", "s", "e", "w", "ne", "nw", "se", "sw"];

function genCase(r) {
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const box = { width: int(120, 900), height: int(120, 900) };
  const obstacles = Array.from({ length: int(0, 10) }, () => {
    const w = int(4, Math.max(5, Math.floor(box.width / 3))), h = int(4, Math.max(5, Math.floor(box.height / 3)));
    return { x: int(0, box.width - w), y: int(0, box.height - h), width: w, height: h };
  });
  const texts = Array.from({ length: int(3, 40) }, (_, i) => {
    const t = { id: `t${i}`, text: Array.from({ length: int(1, 4) }, () => WORDS[int(0, WORDS.length - 1)]).join(" "), size: [12, 14, 17][int(0, 2)], ref: [r() * box.width, r() * box.height] };
    const a = ANCH[int(0, ANCH.length - 1)];
    if (a) t.anchor = a;
    if (r() < 0.3) t.maxWidth = int(40, 200);
    if (r() < 0.1) t.leader = [r() * box.width, r() * box.height];
    if (r() < 0.3) t.priority = int(0, 3);
    if (r() < 0.05) t.weight = 600;
    return t;
  });
  // v11 weak obstacles: present so the avoid path runs; avoid crossings are not asserted (no tractable oracle for "no free spot").
  const avoid = r() < 0.5 ? Array.from({ length: int(0, 6) }, () => [r() * box.width, r() * box.height, r() * box.width, r() * box.height]) : undefined;
  return avoid ? { box, obstacles, texts, avoid } : { box, obstacles, texts };
}

function violation(rq, out) {
  const B = { x: 0, y: 0, ...rq.box };
  const ids = new Set();
  for (const p of out.placed) {
    if (!inside(p.box, B, 1e-6)) return `${p.id} outside box`;
    for (const o of rq.obstacles) if (tooClose(p.box, o)) return `${p.id} within 6 px of obstacle (${separation(p.box, o).toFixed(2)})`;
    if (ids.has(p.id)) return `${p.id} placed twice`;
    ids.add(p.id);
  }
  for (let i = 0; i < out.placed.length; i++) for (let j = i + 1; j < out.placed.length; j++) if (tooClose(out.placed[i].box, out.placed[j].box)) return `${out.placed[i].id} within 6 px of ${out.placed[j].id}`;
  const err = new Set(out.errors.filter((e) => e.rule === "text-no-room").map((e) => e.id));
  for (const t of rq.texts) if (!ids.has(t.id) && !err.has(t.id)) return `${t.id} neither placed nor text-no-room`;
  for (const t of rq.texts) if (ids.has(t.id) && err.has(t.id)) return `${t.id} both placed and reported`;
  return null;
}

test(`VO-4 fuzz placeTexts seed ${SEED}, ${CASES} cases: property violations = 0`, { timeout: 300000 }, () => {
  const r = mulberry32(SEED);
  let ran = 0;
  for (let i = 0; i < CASES; i++) {
    const rq = genCase(r);
    const out = placeTexts(structuredClone(rq));
    const v = violation(rq, out);
    if (v) assert.fail(`case ${i} (seed ${SEED}): ${v}\nrequest: ${JSON.stringify(rq)}`);
    ran++;
  }
  assert.equal(ran, CASES);
});
