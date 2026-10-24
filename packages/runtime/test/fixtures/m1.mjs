// Shared M1 helpers: public module paths, geometry, independent WCAG oracle, rng, CLI runner, lesson scene walk.
import path from "node:path";
import fs from "node:fs";
import { spawnSync, spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { ROOT, EXAMPLE, tmpdir } from "./helpers.mjs";

export { ROOT, EXAMPLE, tmpdir };
export const RT = path.join(ROOT, "packages/runtime");
export const CORE = path.join(RT, "src/core/index.mjs");
export const LAYOUT = path.join(RT, "src/layout/index.mjs");
export const CHECK = path.join(RT, "src/check/index.mjs");
export const DIGEST = path.join(RT, "src/cli/digest.mjs");
export const LTT = path.join(RT, "bin/ltt.mjs");
export const DIST = path.join(RT, "dist");
export const LESSONS_DIR = path.join(RT, "test/lessons");
export const FIXTURE_LESSONS = fs.existsSync(LESSONS_DIR)
  ? fs.readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".js")).sort().map((f) => path.join(LESSONS_DIR, f))
  : [];

export const importFile = async (f) => (await import(pathToFileURL(f).href)).default;

// ---------- geometry ----------
export const EPS = 0.5;
export function overlaps(a, b, eps = EPS) {
  return a.x < b.x + b.width - eps && b.x < a.x + a.width - eps && a.y < b.y + b.height - eps && b.y < a.y + a.height - eps;
}
export function inside(a, box, eps = EPS) {
  const bx = box.x ?? 0, by = box.y ?? 0;
  return a.x >= bx - eps && a.y >= by - eps && a.x + a.width <= bx + box.width + eps && a.y + a.height <= by + box.height + eps;
}
export const center = (b) => [b.x + b.width / 2, b.y + b.height / 2];
/** Distance from point to the nearest point of box (0 if inside). */
export function distToBox([px, py], b) {
  const dx = Math.max(b.x - px, 0, px - (b.x + b.width));
  const dy = Math.max(b.y - py, 0, py - (b.y + b.height));
  return Math.hypot(dx, dy);
}
export function overlapPairs(boxes, eps = EPS) {
  const out = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (overlaps(boxes[i].box, boxes[j].box, eps)) out.push([boxes[i].id, boxes[j].id]);
  return out;
}

// ---------- independent px oracle (spec Signatures: dataToPx) ----------
/** Linear or log10 map of a data value onto [p0, p0+len]; flip for y-up axes. */
export function axisPx(v, [d0, d1], p0, len, log, flip) {
  const f = log ? (Math.log10(v) - Math.log10(d0)) / (Math.log10(d1) - Math.log10(d0)) : (v - d0) / (d1 - d0);
  return flip ? p0 + len - f * len : p0 + f * len;
}
/** y up for cartesian and graph, down for cells (spec Panel). */
export function oraclePx(panel, [x, y]) {
  const lx = panel.log === "x" || panel.log === "xy", ly = panel.log === "y" || panel.log === "xy";
  return [
    axisPx(x, panel.domain.x, panel.plot.x, panel.plot.width, lx, false),
    axisPx(y, panel.domain.y, panel.plot.y, panel.plot.height, ly, panel.frame !== "cells"),
  ];
}

// ---------- independent WCAG 2.x oracle ----------
export function parseColor(s) {
  s = String(s).trim().toLowerCase();
  const named = { white: [255, 255, 255, 1], black: [0, 0, 0, 1], transparent: [0, 0, 0, 0] };
  if (named[s]) return named[s];
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    const ch = (v) => (v.endsWith("%") ? (parseFloat(v) * 255) / 100 : parseFloat(v));
    const a = p[3] === undefined ? 1 : p[3].endsWith("%") ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    return [ch(p[0]), ch(p[1]), ch(p[2]), a];
  }
  m = s.match(/^hsla?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    const h = parseFloat(p[0]) / 360, sat = parseFloat(p[1]) / 100, l = parseFloat(p[2]) / 100;
    const a = p[3] === undefined ? 1 : p[3].endsWith("%") ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, pp = 2 * l - q;
    const hue = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
    return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255, a];
  }
  throw new Error(`unparseable color ${s}`);
}
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
/** Source-over composite of fg (with alpha) over an opaque bg. */
export const over = ([r, g, b, a], [R, G, B]) => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a), 1];
export function wcag(fg, bg) {
  const B = typeof bg === "string" ? over(parseColor(bg), [255, 255, 255]) : bg;
  const F = over(typeof fg === "string" ? parseColor(fg) : fg, B);
  const [l1, l2] = [luminance(F), luminance(B)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

// ---------- rng (copy of mulberry32, spec Fuzzing) ----------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- CLI ----------
export function ltt(args, { cwd, env = {}, timeout = 180000 } = {}) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [LTT, ...args], { cwd: cwd ?? tmpdir("ltt-cwd-"), encoding: "utf8", env: { ...process.env, ...env }, timeout, maxBuffer: 64 << 20 });
  return { ...r, ms: Date.now() - t0 };
}
export function lttAsync(args, { cwd, env = {} } = {}) {
  return spawn(process.execPath, [LTT, ...args], { cwd: cwd ?? tmpdir("ltt-cwd-"), env: { ...process.env, ...env } });
}
/** Copy a lesson file into a fresh temp dir so .ltt/log.jsonl never lands in the repo. */
export function copyLesson(src, name = "lesson.js") {
  const dir = tmpdir("ltt-lesson-");
  const f = path.join(dir, name);
  fs.copyFileSync(src, f);
  return f;
}
export function writeLesson(source, name = "lesson.js") {
  const dir = tmpdir("ltt-lesson-");
  const f = path.join(dir, name);
  fs.writeFileSync(f, source);
  return f;
}
export function readLog(lessonFile) {
  const f = path.join(path.dirname(lessonFile), ".ltt/log.jsonl");
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

// ---------- lesson walk (spec Signatures: scene order) ----------
/** Global scene list: sections' scenes, then the final quiz (one scene), then summary. */
export function globalScenes(inp) {
  const out = [];
  inp.sections.forEach((sec, s) => sec.scenes.forEach((scene, c) => out.push({ type: scene.type, scene, path: `sections[${s}].scenes[${c}]` })));
  if (inp.quiz.length) out.push({ type: "quiz", scene: { type: "quiz", items: inp.quiz }, path: "quiz" });
  out.push({ type: "summary", scene: inp.summary, path: "summary" });
  return out.map((x, index) => ({ ...x, index }));
}
/** TimeSpec of a figure key, following split / multiples to their first sub-figure. */
export function timeSpecOf(inp, key, depth = 0) {
  const fig = inp.figures[key];
  if (!fig || depth > 4) return { static: "" };
  const a = fig.args ?? [];
  if (fig.kind === "split") return timeSpecOf(inp, a[0][0], depth + 1);
  if (fig.kind === "multiples") return timeSpecOf(inp, a[0], depth + 1);
  const opts = a[0]?.args?.[0] ?? {};
  if (opts.loop) return { loop: opts.loop };
  if (opts.steps) return { steps: opts.steps };
  if (opts.idle) return { idle: opts.idle };
  return { static: opts.static ?? "" };
}
/** (t, step) for the two sheet states (spec `ltt sheet`). */
export function stateTime(inp, sceneEntry, state) {
  const sc = sceneEntry.scene;
  const key = sc.figure ?? (sc.type === "steps" ? sc.figure : undefined);
  const ts = key ? timeSpecOf(inp, key) : { static: "" };
  if (state === "initial") return ts.loop ? { t: ts.loop.span[0], step: 0 } : { t: 0, step: 0 };
  if (ts.loop) return { t: ts.loop.span[0] + 0.6 * (ts.loop.span[1] - ts.loop.span[0]), step: 0 };
  if (ts.steps) return { t: ts.steps.length - 1, step: ts.steps.length - 1 };
  if (ts.idle) return { t: 0.5, step: 0 };
  return { t: 0, step: 0 };
}

/** Spec v3 order display: fresh mulberry32(1), Fisher–Yates i = n−1..1, j = floor(r()·(i+1)); identity result rotates left by one. Returns original indices. */
export function shuffledOrder(n) {
  const r = mulberry32(1), a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i >= 1; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  if (n >= 2 && a.every((v, i) => v === i)) a.push(a.shift());
  return a;
}

/** Spec v11: placed text boxes keep ≥ 6 px from each other and from obstacles (own literal oracle, not TEXT_GAP). */
export const MIN_TEXT_GAP = 6;
/** Separation between boxes: > 0 apart, ≤ 0 touching/overlapping (negative = overlap depth along the less-overlapping axis). */
export const separation = (a, b) => Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), b.y - (a.y + a.height), a.y - (b.y + b.height));
export const tooClose = (a, b, gap = MIN_TEXT_GAP, tol = 1e-6) => separation(a, b) < gap - tol;
export function closePairs(boxes, gap = MIN_TEXT_GAP, tol = 1e-6) {
  const out = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (tooClose(boxes[i].box, boxes[j].box, gap, tol)) out.push([boxes[i].id, boxes[j].id, +separation(boxes[i].box, boxes[j].box).toFixed(2)]);
  return out;
}

/** Liang–Barsky: does segment [x1,y1,x2,y2] pass through the open interior of box (shrunk by eps)? */
export function segHitsBox([x1, y1, x2, y2], b, eps = 0.5) {
  const xmin = b.x + eps, xmax = b.x + b.width - eps, ymin = b.y + eps, ymax = b.y + b.height - eps;
  if (xmin >= xmax || ymin >= ymax) return false;
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  for (const [p, q] of [[-dx, x1 - xmin], [dx, xmax - x1], [-dy, y1 - ymin], [dy, ymax - y1]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t0 <= t1;
}
