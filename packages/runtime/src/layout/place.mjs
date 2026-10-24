import { LEADER_PX } from "./constants.mjs";
import { wrapText, linesBox } from "./text.mjs";

export const GAP = 4;
/** Minimum px between placed text boxes, and between text and obstacles. */
export const TEXT_GAP = 6;
const EPS = 1e-6;
const DIRS = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
const ANGLE = { e: 0, ne: 45, n: 90, nw: 135, w: 180, sw: 225, s: 270, se: 315 };

/** @typedef {{ x: number; y: number; width: number; height: number }} Box */

/** @param {Box} a @param {Box} b */
export const overlaps = (a, b) =>
  a.x < b.x + b.width - EPS && b.x < a.x + a.width - EPS && a.y < b.y + b.height - EPS && b.y < a.y + a.height - EPS;

/** @param {Box} a @param {Box} b */
const near = (a, b) => overlaps({ x: a.x - TEXT_GAP, y: a.y - TEXT_GAP, width: a.width + 2 * TEXT_GAP, height: a.height + 2 * TEXT_GAP }, b);

/** Whether segment p-q crosses box b. @param {Box} b @param {number[]} g */
export function segHits(b, [x1, y1, x2, y2]) {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const clip = (/** @type {number} */ p, /** @type {number} */ q) => {
    if (Math.abs(p) < 1e-12) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  return clip(-dx, x1 - b.x) && clip(dx, b.x + b.width - x1) && clip(-dy, y1 - b.y) && clip(dy, b.y + b.height - y1) && t1 - t0 > 1e-9;
}

/** Segments bucketed on a coarse grid for fast box queries. @param {number[][]} segs */
function segIndex(segs) {
  const C = 48;
  /** @type {Map<string, number[][]>} */
  const cells = new Map();
  for (const g of segs) {
    const x0 = Math.floor(Math.min(g[0], g[2]) / C);
    const x1 = Math.floor(Math.max(g[0], g[2]) / C);
    const y0 = Math.floor(Math.min(g[1], g[3]) / C);
    const y1 = Math.floor(Math.max(g[1], g[3]) / C);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 400) continue;
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const k = `${x},${y}`;
      if (!cells.has(k)) cells.set(k, []);
      /** @type {number[][]} */ (cells.get(k)).push(g);
    }
  }
  return (/** @type {Box} */ b) => {
    for (let x = Math.floor(b.x / C); x <= Math.floor((b.x + b.width) / C); x++)
      for (let y = Math.floor(b.y / C); y <= Math.floor((b.y + b.height) / C); y++) for (const g of cells.get(`${x},${y}`) ?? []) if (segHits(b, g)) return true;
    return false;
  };
}

/** @param {Box} a @param {{ width: number; height: number }} box */
export const inside = (a, box) => a.x >= -EPS && a.y >= -EPS && a.x + a.width <= box.width + EPS && a.y + a.height <= box.height + EPS;

/**
 * Box of size w×h on side `dir` of ref, its nearest point d px away.
 * @param {[number, number]} ref @param {string} dir @param {number} d @param {number} w @param {number} h
 * @returns {Box}
 */
export function sideBox([rx, ry], dir, d, w, h) {
  if (dir === "c") return { x: rx - w / 2, y: ry - h / 2, width: w, height: h };
  const q = d / Math.SQRT2;
  switch (dir) {
    case "n": return { x: rx - w / 2, y: ry - d - h, width: w, height: h };
    case "s": return { x: rx - w / 2, y: ry + d, width: w, height: h };
    case "e": return { x: rx + d, y: ry - h / 2, width: w, height: h };
    case "w": return { x: rx - d - w, y: ry - h / 2, width: w, height: h };
    case "ne": return { x: rx + q, y: ry - q - h, width: w, height: h };
    case "nw": return { x: rx - q - w, y: ry - q - h, width: w, height: h };
    case "se": return { x: rx + q, y: ry + q, width: w, height: h };
    default: return { x: rx - q - w, y: ry + q, width: w, height: h };
  }
}

/** @param {Box} b @param {{ width: number; height: number }} box */
const clamp = (b, box) => ({
  x: Math.min(Math.max(b.x, 0), box.width - b.width),
  y: Math.min(Math.max(b.y, 0), box.height - b.height),
  width: b.width,
  height: b.height,
});

/** Nearest point of b to p. @param {Box} b @param {[number, number]} p @returns {[number, number]} */
export const nearest = (b, [px, py]) => [Math.min(Math.max(px, b.x), b.x + b.width), Math.min(Math.max(py, b.y), b.y + b.height)];

/** @param {Box} b @param {[number, number]} p */
const dist = (b, p) => {
  const [nx, ny] = nearest(b, p);
  return Math.hypot(nx - p[0], ny - p[1]);
};

/** @param {number} maxD */
function distances(maxD) {
  const out = [GAP];
  for (let d = 8; d <= 40; d += 4) out.push(d);
  for (let d = 48; d <= 120; d += 8) out.push(d);
  for (let d = 136; d <= maxD + 16; d += 16) out.push(d);
  return out;
}

/** @param {string} anchor */
function dirOrder(anchor) {
  const a = anchor === "c" ? 90 : ANGLE[/** @type {keyof typeof ANGLE} */ (anchor)] ?? 90;
  const diff = (/** @type {string} */ d) => {
    const x = Math.abs(ANGLE[/** @type {keyof typeof ANGLE} */ (d)] - a) % 360;
    return Math.min(x, 360 - x);
  };
  return DIRS.filter((d) => d !== anchor).sort((p, q) => diff(p) - diff(q) || DIRS.indexOf(p) - DIRS.indexOf(q));
}

/** @param {string} t */
const quote = (t) => JSON.stringify(t.length > 60 ? `${t.slice(0, 57)}...` : t);

/**
 * @param {{ box: { width: number; height: number }; obstacles: Box[]; texts: any[]; avoid?: number[][] }} req
 * @returns {{ placed: { id: string; box: Box; lines: string[]; leader?: [number, number, number, number] }[]; errors: { id: string; rule: "text-no-room"; message: string }[] }}
 */
export function placeTexts(req) {
  const { box } = req;
  /** @type {Box[]} */
  const taken = (req.obstacles ?? []).map((o) => ({ x: o.x, y: o.y, width: o.width, height: o.height }));
  /** @type {{ id: string; rule: "text-no-room"; message: string }[]} */
  const errors = [];
  /** @type {{ i: number; p: { id: string; box: Box; lines: string[]; leader?: [number, number, number, number] } }[]} */
  const out = [];
  const items = req.texts.map((t, i) => {
    const o = { size: t.size, weight: t.weight };
    const lines = t.lines ?? (t.maxWidth !== undefined ? wrapText(String(t.text), { ...o, maxWidth: t.maxWidth }) : String(t.text).split("\n"));
    const dims = t.dims ?? (String(t.text) === "" ? { width: 0, height: 0 } : linesBox(lines, t.size, t.weight === 600 ? "600" : "400"));
    return { t, i, lines, w: dims.width, h: dims.height };
  });
  const order = [...items.filter((x) => x.t.fixed), ...items.filter((x) => !x.t.fixed).sort((a, b) => (b.t.priority ?? 0) - (a.t.priority ?? 0) || a.i - b.i)];
  /** @param {Box} b */
  const crosses = req.avoid?.length ? segIndex(req.avoid) : () => false;
  let strict = true;
  const free = (b) => inside(b, box) && !taken.some((o) => near(o, b)) && !(strict && !current?.noAvoid && crosses(b));
  /** @type {any} */
  let current = null;

  for (const it of order) {
    const { t, w, h } = it;
    current = t;
    const anchor = t.anchor ?? "n";
    const ref = /** @type {[number, number]} */ (t.ref);
    /** @type {Box | undefined} */
    let found;
    if (t.fixed) {
      const b = sideBox(ref, anchor, anchor === "c" ? 0 : GAP, w, h);
      if (!inside(b, box)) {
        errors.push({ id: t.id, rule: "text-no-room", message: `fixed text ${quote(t.text)} at its anchor spans x ${b.x.toFixed(1)}..${(b.x + w).toFixed(1)}, y ${b.y.toFixed(1)}..${(b.y + h).toFixed(1)}; expected inside ${box.width.toFixed(0)}x${box.height.toFixed(0)}` });
        continue;
      }
      const hit = taken.findIndex((o) => near(o, b));
      if (hit >= 0) {
        errors.push({ id: t.id, rule: "text-no-room", message: `fixed text ${quote(t.text)} is closer than ${TEXT_GAP} px to (or overlaps) another text or obstacle at its anchor; expected a gap of at least ${TEXT_GAP} px` });
        continue;
      }
      found = b;
    } else if (w <= box.width + EPS && h <= box.height + EPS) {
      const ds = distances(Math.hypot(box.width, box.height));
      const tryAt = (/** @type {string} */ dir, /** @type {number} */ d) => {
        const b = clamp(sideBox(ref, dir, d, w, h), box);
        return free(b) ? b : undefined;
      };
      for (const pass of [true, false]) {
        if (found) break;
        strict = pass;
        if (anchor === "c") found = tryAt("c", 0);
        for (const d of anchor === "c" ? [] : ds) {
          if (found) break;
          found = tryAt(anchor, d);
        }
        for (const dir of dirOrder(anchor)) {
          if (found) break;
          for (const d of ds) if ((found = tryAt(dir, d))) break;
        }
        if (!found) found = gridSearch(ref, w, h, box, free);
      }
      strict = true;
    }
    if (!found) {
      errors.push({ id: t.id, rule: "text-no-room", message: `no room for ${quote(t.text)} (${w.toFixed(0)}x${h.toFixed(0)} px at size ${t.size}) in ${box.width.toFixed(0)}x${box.height.toFixed(0)} px without overlapping other text; text is not shrunk` });
      continue;
    }
    taken.push(found);
    /** @type {{ id: string; box: Box; lines: string[]; leader?: [number, number, number, number] }} */
    const p = { id: t.id, box: found, lines: it.lines };
    const target = t.noLeader ? undefined : /** @type {[number, number] | undefined} */ (t.leader) ?? (dist(found, ref) > LEADER_PX ? ref : undefined);
    if (target) {
      const [x1, y1] = nearest(found, target);
      p.leader = [x1, y1, target[0], target[1]];
    }
    out.push({ i: it.i, p });
  }
  out.sort((a, b) => a.i - b.i);
  return { placed: out.map((o) => o.p), errors };
}

/**
 * @param {[number, number]} ref @param {number} w @param {number} h @param {{ width: number; height: number }} box
 * @param {(b: Box) => boolean} free
 */
function gridSearch(ref, w, h, box, free) {
  const step = Math.max(4, Math.min(w, h) / 2);
  /** @type {Box | undefined} */
  let best;
  let bestD = Infinity;
  const xs = [];
  const ys = [];
  for (let x = 0; x < box.width - w; x += step) xs.push(x);
  xs.push(Math.max(0, box.width - w));
  for (let y = 0; y < box.height - h; y += step) ys.push(y);
  ys.push(Math.max(0, box.height - h));
  for (const y of ys) {
    for (const x of xs) {
      const b = { x, y, width: w, height: h };
      const d = dist(b, ref);
      if (d < bestD && free(b)) {
        best = b;
        bestD = d;
      }
    }
  }
  return best;
}
