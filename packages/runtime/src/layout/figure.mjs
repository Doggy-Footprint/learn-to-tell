import { ticks as d3ticks, tickStep } from "d3-array";
import { line as d3line, area as d3area, curveLinear, curveMonotoneX, curveStepAfter } from "d3-shape";
import { isDescriptor, isPlainObject, samplesFor, rng } from "../core/model.mjs";
import { stageBox, TEXT, TONES, INK, BACKGROUND, LINE_HEIGHT, textColor, mix, sequential, onColor, contrast } from "./constants.mjs";
import { measureText, wrapText, linesBox, lineWidth } from "./text.mjs";
import { placeTexts, GAP, TEXT_GAP, sideBox, overlaps } from "./place.mjs";
import { polyD, parseD, mapCmds, serialize, flatten, cutFraction, bboxOf, cmdsBBox, arcToCubics, parseTransform, mul, apply, IDENTITY } from "./path.mjs";
import { loadGeo, loadLand, makeProjection, REGIONS, geoModule } from "./geo.mjs";
import { loadKatex, measureMath } from "./math.mjs";
import { elkLayout } from "./graph.mjs";

/** @typedef {{ x: number; y: number; width: number; height: number }} Box */
/** @typedef {[number, number]} Pt */

const MARK_INK = "#3d4450";
const GRID = "#e3e6eb";
const AXIS = "#8a919c";
const DIM_OPACITY = 0.3;
const STROKE = { thin: 1.25, normal: 2, bold: 3.25 };
const DOT_R = { s: 3, m: 4.5, l: 6 };
const NODE_PAD = { x: 12, y: 8 };
const NODE_WRAP = [160, 120, 90];
const SPACING = [1, 0.6, 0.35];
const CODE_PAD = 8;
const LEGEND_PAD = 8;
const SWATCH = 12;
const TICK = 5;
const MOCK_BAR = { browser: 30, window: 26, phone: 18 };
const MOCK_SIDE = { browser: 0, window: 0, phone: 10 };
const AVOID = new Set(["line", "area", "path", "arrow", "trace"]);
const UNIMPLEMENTED_MARKS = new Set(["field", "glyph", "icon", "inset"]);
const FRAMES = new Set(["cartesian", "graph", "cells", "geo"]);
const UNIMPLEMENTED_FRAMES = new Set(["polar", "lanes", "space3d"]);

/** Render-only data that is not part of the FigureLayout contract. */
const hide = (/** @type {object} */ obj, /** @type {object} */ r) => Object.defineProperty(obj, "_r", { value: r, enumerable: false });

/** @param {any} v @param {any} m */
const txt = (v, m) => (typeof v === "function" ? String(v(m)) : v === undefined || v === null ? "" : String(v));
/** @param {any[]} args */
const optsOf = (args) => [...args].reverse().find((a) => isPlainObject(a) && !isDescriptor(a)) ?? {};
const sizeOf = (/** @type {any} */ o) => TEXT.figure[/** @type {"s" | "m" | "l"} */ (o?.size)] ?? TEXT.figure.m;
const colorOf = (/** @type {any} */ o, fallback = MARK_INK) => (o?.tone && /** @type {any} */ (TONES)[o.tone]) || fallback;
const swOf = (/** @type {any} */ o) => STROKE[/** @type {"thin" | "normal" | "bold"} */ (o?.weight)] ?? STROKE.normal;
const soft = (/** @type {string} */ c) => mix(c, BACKGROUND, 0.8);

/** Pure params resolution: model defaults, then the given params. @param {any} input @param {any} params */
export function resolveParams(input, params) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const m of Object.values(input?.models ?? {})) Object.assign(out, /** @type {any} */ (m).args?.[0]);
  return { ...out, ...(params ?? {}) };
}

/** @type {WeakMap<object, Map<string, any>>} */
const outCache = new WeakMap();

/** Model outputs at params; each model gets its own declared keys. @param {any} input @param {Record<string, any>} params */
export function outputsFor(input, params) {
  let c = outCache.get(input);
  if (!c) outCache.set(input, (c = new Map()));
  const key = JSON.stringify(params, Object.keys(params).sort());
  if (c.has(key)) return c.get(key);
  /** @type {Record<string, any>} */
  const out = {};
  for (const [name, m] of Object.entries(input?.models ?? {})) {
    let done = false;
    /** @type {any} */
    let value;
    Object.defineProperty(out, name, {
      enumerable: true,
      get() {
        if (!done) {
          const d = /** @type {any} */ (m).args[0] ?? {};
          /** @type {Record<string, any>} */
          const p = { ...d };
          for (const k of Object.keys(d)) if (k in params) p[k] = params[k];
          value = /** @type {any} */ (m).args[1](p);
          done = true;
        }
        return value;
      },
    });
  }
  if (c.size > 200) c.clear();
  c.set(key, out);
  return out;
}

/** Flattens a MarkTree to descriptors with their draw-order index. @param {any} tree */
export function flattenMarks(tree) {
  /** @type {any[]} */
  const out = [];
  const walk = (/** @type {any} */ t) => {
    if (Array.isArray(t)) t.forEach(walk);
    else if (isDescriptor(t)) out.push(t);
  };
  walk(tree);
  return out;
}

/**
 * Leaf figures of a figure key: split children and multiples copies, with their params and caption.
 * @param {any} input @param {string} key @param {Record<string, any>} params
 * @returns {{ key: string; fig: any; params: Record<string, any>; caption?: string }[]}
 */
export function leavesOf(input, key, params, depth = 0) {
  const fig = input.figures?.[key];
  if (!fig) throw new Error(`unknown figure: ${key}`);
  if (depth > 4) throw new Error(`figure nesting too deep at ${key}`);
  if (fig.kind === "split") return fig.args[0].flatMap((/** @type {string} */ k) => leavesOf(input, k, params, depth + 1));
  if (fig.kind === "multiples") {
    const over = fig.args[1]?.over ?? {};
    /** @type {{ p: Record<string, any>; cap: string[] }[]} */
    let combos = [{ p: {}, cap: [] }];
    for (const [k, vals] of Object.entries(over)) combos = combos.flatMap((c) => /** @type {any[]} */ (vals).map((v) => ({ p: { ...c.p, [k]: v }, cap: [...c.cap, `${k} = ${v}`] })));
    return combos.flatMap((c) => leavesOf(input, fig.args[0], { ...params, ...c.p }, depth + 1).map((l) => ({ ...l, caption: c.cap.join(", ") })));
  }
  return [{ key, fig, params }];
}

/** @param {number} n @param {Box} box @param {number} gap */
function gridCells(n, box, gap) {
  let best = { cols: 1, score: -1 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const w = (box.width - gap * (cols - 1)) / cols;
    const h = (box.height - gap * (rows - 1)) / rows;
    const score = Math.min(w, h);
    if (score > best.score + 1e-9) best = { cols, score };
  }
  const cols = best.cols;
  const rows = Math.ceil(n / cols);
  const w = (box.width - gap * (cols - 1)) / cols;
  const h = (box.height - gap * (rows - 1)) / rows;
  return Array.from({ length: n }, (_, i) => ({ x: box.x + (i % cols) * (w + gap), y: box.y + Math.floor(i / cols) * (h + gap), width: w, height: h }));
}

/**
 * @param {any} panel @param {Pt} p @returns {Pt}
 */
export function dataToPx(panel, p) {
  if (panel.frame === "geo") return geoProject(panel, p);
  const { plot, domain } = panel;
  const lx = panel.log === "x" || panel.log === "xy";
  const ly = panel.log === "y" || panel.log === "xy";
  const fx = lx ? (Math.log10(p[0]) - Math.log10(domain.x[0])) / (Math.log10(domain.x[1]) - Math.log10(domain.x[0])) : (p[0] - domain.x[0]) / (domain.x[1] - domain.x[0]);
  const fy = ly ? (Math.log10(p[1]) - Math.log10(domain.y[0])) / (Math.log10(domain.y[1]) - Math.log10(domain.y[0])) : (p[1] - domain.y[0]) / (domain.y[1] - domain.y[0]);
  const x = plot.x + fx * plot.width;
  const y = panel.frame === "cells" ? plot.y + fy * plot.height : plot.y + plot.height - fy * plot.height;
  return [x, y];
}

/** @param {any} panel @param {Pt} p @returns {Pt} */
export function pxToData(panel, [x, y]) {
  const { plot, domain } = panel;
  const fx = (x - plot.x) / plot.width;
  const fy = panel.frame === "cells" ? (y - plot.y) / plot.height : (plot.y + plot.height - y) / plot.height;
  const lx = panel.log === "x" || panel.log === "xy";
  const ly = panel.log === "y" || panel.log === "xy";
  const inv = (/** @type {number} */ f, /** @type {[number, number]} */ d, /** @type {boolean} */ log) =>
    log ? 10 ** (Math.log10(d[0]) + f * (Math.log10(d[1]) - Math.log10(d[0]))) : d[0] + f * (d[1] - d[0]);
  if (panel.frame === "geo") {
    const pr = panel._r?.projection;
    const ll = pr?.invert?.([x, y]);
    return ll ? [ll[0], ll[1]] : [NaN, NaN];
  }
  return [inv(fx, domain.x, lx), inv(fy, domain.y, ly)];
}

/** @param {any} panel @param {Pt} lonlat @returns {Pt} */
export function geoProject(panel, lonlat) {
  let pr = panel._r?.projection;
  if (!pr) {
    pr = makeProjection(panel.projection ?? "equalEarth", panel.region ?? "world", panel.plot);
  }
  const p = pr(lonlat);
  return p ? [p[0], p[1]] : [NaN, NaN];
}

class Builder {
  /** @param {any} input @param {any} o @param {Box} box */
  constructor(input, o, box) {
    this.input = input;
    this.o = o;
    this.box = box;
    this.viewport = o.viewport ?? "desktop";
    /** @type {Set<string> | null} */
    this.focus = Array.isArray(o.focus) ? new Set(o.focus) : null;
    this.hidden = new Set(o.hidden ?? []);
    this.t = o.t ?? 0;
    this.step = o.step ?? 0;
    /** @type {any[]} */
    this.panels = [];
    /** @type {any[]} */
    this.shapes = [];
    /** @type {any[]} */
    this.texts = [];
    /** @type {Box[]} */
    this.obstacles = [];
    /** @type {{ rule: string; path: string; message: string }[]} */
    this.errors = [];
    /** @type {Set<string>} */
    this.errKeys = new Set();
    this.seq = 0;
    this.extraUsed = false;
    /** @type {string | undefined} */
    this.link = undefined;
    /** @type {Set<string>} */
    this.tooLarge = new Set();
    /** @type {any[]} */
    this.pre = [];
    /** @type {Box[]} */
    this.panelBoxes = [];
    /** @type {{ panel: number; g: number[] }[]} */
    this.segs = [];
    /** @type {Map<string, { kind: string; tone?: string }>} */
    this.meta = new Map();
  }

  /** @param {string} rule @param {string} path @param {string} message */
  error(rule, path, message) {
    const k = `${rule}|${path}`;
    if (this.errKeys.has(k)) return;
    this.errKeys.add(k);
    this.errors.push({ rule, path, message: message.length > 300 ? `${message.slice(0, 297)}...` : message });
  }

  /** @param {string | undefined} id */
  emphasis(id) {
    if (!this.focus) return "none";
    return id !== undefined && this.focus.has(id) ? "focus" : "dim";
  }

  /**
   * @param {{ mark: string; markId?: string; d: string; stroke?: string; fill?: string; opacity?: number; dash?: boolean; sw?: number; clip?: Box | null; pts?: Pt[]; bbox?: Box; panel: number; plain?: boolean; cap?: string }} s
   */
  shape(s) {
    const emphasis = s.plain ? "none" : this.emphasis(s.markId);
    let bbox = s.bbox ?? bboxOf(s.pts ?? []);
    if (s.clip) {
      const x0 = Math.max(bbox.x, s.clip.x);
      const y0 = Math.max(bbox.y, s.clip.y);
      const x1 = Math.min(bbox.x + bbox.width, s.clip.x + s.clip.width);
      const y1 = Math.min(bbox.y + bbox.height, s.clip.y + s.clip.height);
      if (x1 < x0 - 1e-9 || y1 < y0 - 1e-9) return null;
      bbox = { x: x0, y: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) };
    }
    const item = /** @type {any} */ ({ kind: "shape", mark: s.mark });
    if (s.markId !== undefined) item.markId = s.markId;
    item.bbox = bbox;
    item.d = s.d;
    if (s.stroke !== undefined) item.stroke = s.stroke;
    if (s.fill !== undefined) item.fill = s.fill;
    item.opacity = Math.max(0, Math.min(1, s.opacity ?? 1)) * (emphasis === "dim" ? DIM_OPACITY : 1);
    item.dash = !!s.dash;
    item.emphasis = emphasis;
    item.panel = s.panel ?? 0;
    if (AVOID.has(s.mark) && s.d) {
      try {
        for (const sub of flatten(parseD(s.d), 8)) {
          let a = sub.pts[0];
          for (let i = 1; i < sub.pts.length; i++) {
            const b = sub.pts[i];
            if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 4 && i < sub.pts.length - 1) continue;
            this.segs.push({ panel: item.panel, g: [a[0], a[1], b[0], b[1]] });
            a = b;
          }
        }
      } catch {
        // malformed path data only loses its avoid hint
      }
    }
    if (this.link !== undefined && s.markId === this.link) item.link = true;
    hide(item, { sw: s.sw ?? STROKE.normal, clip: s.clip ?? null, panel: s.panel, cap: s.cap });
    this.shapes.push(item);
    return item;
  }

  /**
   * Queues text for placeTexts.
   * @param {{ mark: string; markId?: string; text: string; size?: number; weight?: 400 | 600; ref: Pt; anchor?: string; maxWidth?: number; leader?: Pt; fixed?: boolean; priority?: number; color?: string; path: string; dims?: { width: number; height: number }; lines?: string[]; kind?: string; itemRef?: Pt; plain?: boolean; extra?: any; onPlaced?: (b: Box) => void; dimText?: boolean }} q
   */
  text(q) {
    const id = `${q.markId ?? q.mark}~${this.seq++}`;
    this.texts.push({ ...q, id, panel: this.curPanel ?? 0, size: q.size ?? TEXT.figure.m, weight: q.weight ?? 400 });
    return id;
  }

  finish() {
    const reqs = this.texts.map((q) => {
      /** @type {any} */
      const r = { id: q.id, text: q.text, size: q.size, weight: q.weight, ref: q.ref };
      if (q.anchor) r.anchor = q.anchor;
      if (q.maxWidth !== undefined) r.maxWidth = q.maxWidth;
      if (q.leader) r.leader = q.leader;
      if (q.fixed) r.fixed = true;
      if (q.priority !== undefined) r.priority = q.priority;
      if (q.dims) r.dims = q.dims;
      if (q.lines) r.lines = q.lines;
      if (q.noAvoid) r.noAvoid = true;
      if (q.noLeader) r.noLeader = true;
      return r;
    });
    /** @type {{ placed: any[]; errors: any[] }} */
    const res = { placed: [], errors: [] };
    const groups = new Map();
    reqs.forEach((r, i) => {
      const p = this.texts[i].panel;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(r);
    });
    for (const [p, list] of groups) {
      const pb = this.panelBoxes[p] ?? this.box;
      const sh = (/** @type {number[]} */ v) => [v[0] - pb.x, v[1] - pb.y];
      const local = list.map((/** @type {any} */ r) => ({ ...r, ref: sh(r.ref), ...(r.leader ? { leader: sh(r.leader) } : {}) }));
      const obs = this.obstacles.map((o) => ({ ...o, x: o.x - pb.x, y: o.y - pb.y }));
      const avoid = this.segs.filter((x) => x.panel === p).map(({ g }) => [g[0] - pb.x, g[1] - pb.y, g[2] - pb.x, g[3] - pb.y]);
      const r = placeTexts({ box: { width: pb.width, height: pb.height }, obstacles: obs, texts: local, avoid });
      for (const pl of r.placed) {
        pl.box = { ...pl.box, x: pl.box.x + pb.x, y: pl.box.y + pb.y };
        if (pl.leader) {
          const cx = (v, lo, w) => Math.min(Math.max(v, lo), lo + w);
          pl.leader = [pl.leader[0] + pb.x, pl.leader[1] + pb.y, cx(pl.leader[2] + pb.x, pb.x, pb.width), cx(pl.leader[3] + pb.y, pb.y, pb.height)];
        }
        res.placed.push(pl);
      }
      res.errors.push(...r.errors);
    }
    const byId = new Map(this.texts.map((q) => [q.id, q]));
    /** @type {any[]} */
    const textItemsPre = [];
    for (const e of res.errors) {
      const q = byId.get(e.id);
      if (q.graph && this.tooLarge.has(q.graph)) continue;
      this.error("text-no-room", q.path, e.message);
    }
    for (const q of this.pre) {
      const it = /** @type {any} */ ({ kind: "text", id: q.id, mark: q.mark });
      const emphasis = q.plain ? "none" : this.emphasis(q.markId);
      if (q.markId !== undefined) it.markId = q.markId;
      Object.assign(it, { box: q.box, lines: q.lines, size: q.size, weight: q.weight ?? 400, color: emphasis === "dim" ? dimColor(q.color) : q.color, ref: q.itemRef, emphasis, panel: q.panel ?? 0 });
      if (this.link !== undefined && q.markId === this.link) it.link = true;
      hide(it, { kind: "text", extra: null });
      textItemsPre.push(it);
    }
    /** @type {any[]} */
    const textItems = [];
    const blockShapes = [];
    for (const p of res.placed) {
      const q = byId.get(p.id);
      const emphasis = q.plain ? "none" : this.emphasis(q.markId);
      const it = /** @type {any} */ ({ kind: "text", id: p.id, mark: q.mark });
      if (q.markId !== undefined) it.markId = q.markId;
      let box = p.box;
      if (q.onPlaced) {
        const before = this.shapes.length;
        q.onPlaced(box);
        blockShapes.push(...this.shapes.splice(before));
      }
      if (q.inner) box = q.inner(box);
      it.box = { x: box.x, y: box.y, width: box.width, height: box.height };
      it.lines = p.lines;
      it.size = q.size;
      it.weight = q.weight;
      it.color = q.color ?? INK;
      if (emphasis === "dim" && !q.keepColor) it.color = dimColor(it.color);
      it.ref = q.itemRef ?? q.ref;
      if (p.leader) it.leader = p.leader;
      it.emphasis = emphasis;
      it.panel = q.panel ?? 0;
      if (this.link !== undefined && q.markId === this.link) it.link = true;
      hide(it, { kind: q.kind ?? "text", extra: q.extra ?? null });
      textItems.push(it);
    }
    return hide(
      {
        width: this.box.width,
        height: this.box.height,
        panels: this.panels,
        items: [...this.shapes, ...blockShapes, ...textItemsPre, ...textItems],
        errors: this.errors,
      },
      { meta: Object.fromEntries(this.meta) },
    );
  }
}

/**
 * @param {any} input @param {string} figKey
 * @param {{ viewport: "desktop" | "mobile"; t: number; step: number; params?: Record<string, any>; focus?: string[] | null; hidden?: string[]; box?: { width: number; height: number }; compare?: { a: Record<string, any>; b: Record<string, any>; labels: [any, any] } }} o
 */
export async function layoutFigure(input, figKey, o) {
  const opts = o ?? /** @type {any} */ ({});
  const vb = opts.box ?? stageBox(opts.viewport ?? "desktop");
  const box = { x: 0, y: 0, width: vb.width, height: vb.height };
  const B = new Builder(input, opts, box);
  const base = resolveParams(input, opts.params);
  const fig = input?.figures?.[figKey];
  if (!fig) throw new Error(`unknown figure: ${figKey}`);
  /** @type {{ key: string; fig: any; params: Record<string, any>; caption?: string }[]} */
  let leaves;
  if (opts.compare) {
    const labels = opts.compare.labels ?? ["a", "b"];
    const outs = outputsFor(input, base);
    leaves = [opts.compare.a, opts.compare.b].flatMap((p, i) =>
      leavesOf(input, figKey, { ...base, ...(p ?? {}) }).map((l) => ({ ...l, caption: [txt(labels[i], outs), l.caption].filter(Boolean).join(" · ") })),
    );
  } else leaves = leavesOf(input, figKey, base);
  if (fig.kind === "split") {
    const link = fig.args[1]?.link;
    if (typeof link === "string") {
      if (B.focus) B.focus.add(link);
      B.link = link;
    }
  }
  const cells = gridCells(leaves.length, box, leaves.length > 1 ? 16 : 0);
  for (let i = 0; i < leaves.length; i++) await layoutLeaf(B, leaves[i], cells[i]);
  return B.finish();
}

/** @param {Builder} B @param {{ key: string; fig: any; params: Record<string, any>; caption?: string }} leaf @param {Box} cell */
async function layoutLeaf(B, leaf, cell) {
  const { key, fig, params } = leaf;
  if (fig.kind !== "figure") throw new Error(`figures.${key} is not a figure`);
  const [frame, draw] = fig.args;
  const fo = frame?.args?.[0] ?? {};
  if (!frame || !FRAMES.has(frame.kind)) {
    if (UNIMPLEMENTED_FRAMES.has(frame?.kind)) B.error("unimplemented", `figures.${key}`, `frame ${frame.kind} is not implemented in M1; expected cartesian, graph, cells or geo`);
    else throw new Error(`figures.${key}: unknown frame`);
    return;
  }
  if (frame.kind === "graph" && fo.layout !== "layered" && fo.layout !== "tree") {
    B.error("unimplemented", `figures.${key}`, `graph layout ${fo.layout} is not implemented in M1; expected layered or tree`);
    return;
  }
  if (frame.kind === "geo" && fo.projection !== "equalEarth" && fo.projection !== "mercator") {
    B.error("unimplemented", `figures.${key}`, `geo projection ${fo.projection} is not implemented in M1; expected equalEarth or mercator`);
    return;
  }
  const outputs = outputsFor(B.input, params);
  const marks = flattenMarks(draw(outputs, B.t, { step: B.step, params: { ...params } }));
  const extra = B.o.extraMarks;
  if (Array.isArray(extra) && extra.length && !B.extraUsed && (!B.o.extraFor || marks.some((d) => d.id === B.o.extraFor))) {
    marks.push(...flattenMarks(extra));
    B.extraUsed = true;
  }
  let area = { ...cell };
  if (leaf.caption) {
    const size = TEXT.figure.m;
    const h = size * LINE_HEIGHT;
    const w = lineWidth(leaf.caption, size, "600");
    const tb = { x: cell.x + Math.max(0, (cell.width - w) / 2), y: cell.y, width: Math.min(w, cell.width), height: h };
    B.obstacles.push({ ...tb });
    B.pre.push({ id: `title~${B.panels.length}`, mark: "title", box: tb, lines: [leaf.caption], size, weight: 600, color: INK, itemRef: [tb.x + tb.width / 2, tb.y + h], panel: B.panels.length, plain: true, title: true });
    area = { x: cell.x, y: cell.y + h + 6, width: cell.width, height: cell.height - h - 6 };
  }
  B.panelBoxes[B.panels.length] = cell;
  B.curPanel = B.panels.length;
  const ctx = new Panel(B, key, frame, fo, outputs, params, area, marks);
  await ctx.layout();
}

/** Panel context: frame mapping plus mark renderers. */
class Panel {
  /** @param {Builder} B @param {string} key @param {any} frame @param {any} fo @param {any} m @param {Record<string, any>} params @param {Box} area @param {any[]} marks */
  constructor(B, key, frame, fo, m, params, area, marks) {
    this.B = B;
    this.key = key;
    this.frame = frame;
    this.fo = fo;
    this.m = m;
    this.params = params;
    this.area = area;
    this.marks = marks;
    this.index = B.panels.length;
    /** @type {any} */
    this.panel = null;
    /** @type {Box | null} */
    this.clip = null;
    /** @type {Map<string, any>} */
    this.graphPos = new Map();
  }

  /** @param {any} d @param {string | number} idx */
  path(d, idx) {
    return `figures.${this.key}#${d.id ?? idx}`;
  }

  /** @param {Pt} p @returns {Pt} */
  px(p) {
    return dataToPx(this.panel, p);
  }

  visible(/** @type {any} */ d) {
    return !(d.id !== undefined && this.B.hidden.has(d.id));
  }

  async layout() {
    const kind = this.frame.kind;
    if (kind === "cartesian") this.cartesian();
    else if (kind === "cells") this.cells();
    else if (kind === "geo") await this.geo();
    else await this.graph();
    this.B.panels.push(this.panel);
    if (this.marks.some((d) => d.kind === "math" || hasMath(d))) await loadKatex();
    this.marks.forEach((d, i) => this.mark(d, String(i), this.clip));
  }

  // ---------- frames ----------

  cartesian() {
    const fo = this.fo;
    const B = this.B;
    const camera = typeof fo.camera === "function" ? fo.camera(this.m, B.t) : null;
    const domain = { x: /** @type {[number, number]} */ ([...(camera?.x ?? fo.x.slice(0, 2))]), y: /** @type {[number, number]} */ ([...(camera?.y ?? fo.y.slice(0, 2))]) };
    const log = fo.log;
    const axes = this.marks.filter((d) => d.kind === "axis" && this.visible(d));
    const ax = axes.find((d) => d.args[0] === "x");
    const ay = axes.find((d) => d.args[0] === "y");
    const legend = this.marks.find((d) => d.kind === "legend" && this.visible(d) && !optsOf(d.args.slice(1)).at);
    const a = this.area;
    const tickSize = TEXT.figure.s;
    const lh = tickSize * LINE_HEIGHT;
    const titleSize = TEXT.figure.m;
    const tlh = titleSize * LINE_HEIGHT;
    let left = 12;
    let right = 16;
    let top = 14;
    let bottom = 12;
    if (ay) {
      const guess = Math.max(40, a.height - 60);
      const t = this.ticks("y", domain.y, log === "y" || log === "xy", guess, ay);
      const w = Math.max(0, ...t.labels.map((s) => lineWidth(s, tickSize)));
      left = w + TICK + GAP + 4;
      if (optsOf(ay.args.slice(1)).label !== undefined) top = Math.max(top, tlh + lh / 2 + TEXT_GAP + 4);
    }
    if (ax) {
      bottom = TICK + GAP + lh + 4;
      if (optsOf(ax.args.slice(1)).label !== undefined) bottom += tlh + TEXT_GAP + 1;
    }
    /** @type {{ width: number; height: number } | null} */
    let lg = null;
    if (legend) {
      lg = this.legendSize(legend);
      if (B.viewport === "mobile") bottom += lg.height + 8;
      else right += lg.width + 12;
    }
    let plot = { x: a.x + left, y: a.y + top, width: Math.max(10, a.width - left - right), height: Math.max(10, a.height - top - bottom) };
    if (fo.aspect === "equal" && !log) {
      const s = Math.min(plot.width / (domain.x[1] - domain.x[0]), plot.height / (domain.y[1] - domain.y[0]));
      const w = s * (domain.x[1] - domain.x[0]);
      const h = s * (domain.y[1] - domain.y[0]);
      plot = { x: plot.x + (plot.width - w) / 2, y: plot.y + (plot.height - h) / 2, width: w, height: h };
    }
    /** @type {any} */
    const panel = { frame: "cartesian", box: { ...this.B.panelBoxes[this.index] }, plot, domain };
    if (log === "x" || log === "y" || log === "xy") panel.log = log;
    this.panel = panel;
    this.clip = plot;
    this.legendSlot = lg && legend ? { d: legend, size: lg } : null;
  }

  cells() {
    const { cols, rows } = this.fo;
    const a = this.area;
    const m = 8;
    const s = Math.min((a.width - 2 * m) / cols, (a.height - 2 * m) / rows);
    const w = s * cols;
    const h = s * rows;
    const plot = { x: a.x + (a.width - w) / 2, y: a.y + (a.height - h) / 2, width: w, height: h };
    this.panel = { frame: "cells", box: { ...this.B.panelBoxes[this.index] }, plot, domain: { x: [0, cols], y: [0, rows] } };
    this.clip = plot;
    const lines = [];
    for (let c = 0; c <= cols; c++) lines.push(`M${f2(plot.x + c * s)},${f2(plot.y)}V${f2(plot.y + h)}`);
    for (let r = 0; r <= rows; r++) lines.push(`M${f2(plot.x)},${f2(plot.y + r * s)}H${f2(plot.x + w)}`);
    this.B.shape({ mark: "cells", d: lines.join(""), stroke: GRID, sw: 1, bbox: plot, panel: this.index, plain: true });
  }

  async geo() {
    const B = this.B;
    const fo = this.fo;
    let region = fo.region ?? "world";
    if (!(region in REGIONS)) {
      B.error("unknown-region", `figures.${this.key}`, `region "${region}" is unknown; expected one of ${Object.keys(REGIONS).join(", ")}; drawn as world`);
      region = "world";
    }
    await loadGeo();
    const a = this.area;
    const m = 8;
    const plot = { x: a.x + m, y: a.y + m, width: a.width - 2 * m, height: a.height - 2 * m };
    const projection = makeProjection(fo.projection, region, plot);
    const b = /** @type {number[]} */ (/** @type {any} */ (REGIONS)[region]);
    /** @type {any} */
    const panel = { frame: "geo", box: { ...this.B.panelBoxes[this.index] }, plot, domain: { x: [b[0], b[2]], y: [b[1], b[3]] }, projection: fo.projection, region };
    hide(panel, { projection, region, kind: fo.projection });
    this.panel = panel;
    this.clip = plot;
    const g = geoModule();
    const path = g.geoPath(projection).digits(2);
    const land = await loadLand();
    const sphere = path({ type: "Sphere" });
    if (region === "world" && fo.projection === "equalEarth") this.B.shape({ mark: "geo", d: sphere, stroke: GRID, fill: "#f7f9fb", sw: 1, bbox: plot, panel: this.index, plain: true });
    this.B.shape({ mark: "geo", d: path(land) ?? "", fill: "#e4e8ee", stroke: "#cfd5de", sw: 0.75, bbox: plot, panel: this.index, plain: true, clip: plot });
  }

  async graph() {
    const B = this.B;
    const fo = this.fo;
    const fig = B.input.figures[this.key];
    const union = await graphUnion(B, this, fig);
    const a = this.area;
    const pad = 8;
    const avail = { x: a.x + pad, y: a.y + pad, width: a.width - 2 * pad, height: a.height - 2 * pad };
    let res = null;
    let tooLarge = false;
    const algorithm = fo.layout === "tree" ? "mrtree" : "layered";
    const direction = fo.direction === "right" ? "RIGHT" : "DOWN";
    outer: for (const wrap of NODE_WRAP) {
      for (const spacing of SPACING) {
        const sized = sizeNodes(union, wrap);
        const r = await cachedElk(B.input, this.key, { algorithm, direction, spacing, wrap, union: sized });
        const bb = graphBBox(r, sized);
        res = { r, sized, bb };
        if (bb.width <= avail.width + 1e-6 && bb.height <= avail.height + 1e-6) break outer;
      }
    }
    if (!res) throw new Error("graph layout failed");
    if (res.bb.width > avail.width + 1e-6 || res.bb.height > avail.height + 1e-6) {
      tooLarge = true;
      B.tooLarge.add(this.key + "#" + this.index);
      B.error("graph-too-large", `figures.${this.key}`, `graph needs ${res.bb.width.toFixed(0)}x${res.bb.height.toFixed(0)} px after tighter spacing and narrower node text; expected at most ${avail.width.toFixed(0)}x${avail.height.toFixed(0)} px`);
    }
    const ox = avail.x + (avail.width - res.bb.width) / 2 - res.bb.x;
    const oy = avail.y + (avail.height - res.bb.height) / 2 - res.bb.y;
    const plot = { x: res.bb.x + ox, y: res.bb.y + oy, width: Math.max(res.bb.width, 1), height: Math.max(res.bb.height, 1) };
    this.panel = { frame: "graph", box: { ...this.B.panelBoxes[this.index] }, plot, domain: { x: [0, 1], y: [0, 1] } };
    this.clip = tooLarge ? null : { x: a.x, y: a.y, width: a.width, height: a.height };
    for (const n of res.sized.nodes) {
      const p = res.r.nodes.get(n.id);
      let box = { x: p.x + ox, y: p.y + oy, width: p.width, height: p.height };
      if (n.at) {
        const [cx, cy] = this.px(n.at);
        box = { x: cx - p.width / 2, y: cy - p.height / 2, width: p.width, height: p.height };
      }
      this.graphPos.set(n.id, { box, lines: n.lines, pinned: !!n.at });
    }
    this.graphEdges = new Map();
    for (const e of res.sized.edges) {
      const g = res.r.edges.get(e.id);
      const A = this.graphPos.get(e.from);
      const Z = this.graphPos.get(e.to);
      if (!A || !Z) continue;
      /** @type {Pt[]} */
      let pts;
      /** @type {Pt | undefined} */
      let label;
      if (A.pinned || Z.pinned || !g || g.points.length < 2) {
        pts = straightBetween(A.box, Z.box);
        label = undefined;
      } else {
        pts = g.points.map(([x, y]) => /** @type {Pt} */ ([x + ox, y + oy]));
        label = g.label ? [g.label[0] + ox, g.label[1] + oy] : undefined;
      }
      this.graphEdges.set(e.id, { pts, label });
    }
  }

  // ---------- ticks, legend ----------

  /** @param {"x" | "y"} which @param {[number, number]} dom @param {boolean} log @param {number} len @param {any} d */
  ticks(which, dom, log, len, d) {
    const o = optsOf(d.args.slice(1));
    const unit = which === "x" ? this.fo.x?.[2] ?? "" : this.fo.y?.[2] ?? "";
    const target = typeof o.ticks === "number" ? o.ticks : Math.max(2, Math.round(len / (which === "x" ? 90 : 56)));
    /** @type {number[]} */
    let values;
    if (Array.isArray(o.ticks)) values = o.ticks.filter((/** @type {number} */ v) => v >= Math.min(...dom) && v <= Math.max(...dom));
    else {
      values = log ? logTicks(dom, target) : d3ticks(Math.min(...dom), Math.max(...dom), target);
    }
    const lo = Math.min(...dom);
    const hi = Math.max(...dom);
    const step = log ? 0 : Math.abs(tickStep(lo, hi, target));
    const labels = values.map((v) => fmtTick(v, step));
    const label = o.label !== undefined ? txt(o.label, this.m) : undefined;
    let title = label;
    if (unit && label !== undefined) title = `${label} (${unit})`;
    if (unit && label === undefined && labels.length) labels[labels.length - 1] = withUnit(labels[labels.length - 1], unit);
    return { values, labels, title };
  }

  /** @param {any} d */
  legendSize(d) {
    const entries = /** @type {any[]} */ (d.args[0] ?? []);
    const size = sizeOf(optsOf(d.args.slice(1)));
    const w = Math.max(0, ...entries.map((e) => lineWidth(txt(e.text, this.m), size)));
    return { width: LEGEND_PAD * 2 + SWATCH + 6 + w, height: LEGEND_PAD * 2 + entries.length * size * LINE_HEIGHT };
  }

  // ---------- marks ----------

  /** @param {any} d @param {string} idx @param {Box | null} clip */
  mark(d, idx, clip) {
    if (!this.visible(d)) return;
    const B = this.B;
    const kind = d.kind;
    const o = optsOf(kind === "node" || kind === "edge" ? [d.args[2]] : d.args.slice(1));
    if (UNIMPLEMENTED_MARKS.has(kind)) {
      B.error("unimplemented", this.path(d, idx), `mark ${kind} is not implemented in M1`);
      return;
    }
    if (o.from !== undefined) B.error("unimplemented", this.path(d, idx), `MarkOpts from is not implemented in M1 (from: ${JSON.stringify(o.from)})`);
    const fn = /** @type {any} */ (this)[`m_${kind}`];
    if (typeof fn !== "function") throw new Error(`${this.path(d, idx)}: ${kind} is not a mark`);
    if (!this.allowed(kind, d, idx)) return;
    if (d.id !== undefined && !B.meta.has(d.id)) B.meta.set(d.id, { kind, tone: o.tone });
    fn.call(this, d, o, idx, clip);
  }

  /** @param {string} kind @param {any} d @param {string} idx */
  allowed(kind, d, idx) {
    const f = this.frame.kind;
    if ((kind === "axis" || kind === "sweep") && f !== "cartesian") {
      this.B.error("unimplemented", this.path(d, idx), `${kind} in a ${f} frame is not implemented in M1; use it in cartesian`);
      return false;
    }
    if (kind === "axis" && d.args[0] !== "x" && d.args[0] !== "y") {
      this.B.error("unimplemented", this.path(d, idx), `axis "${d.args[0]}" is not implemented in M1; expected "x" or "y"`);
      return false;
    }
    if ((kind === "node" || kind === "edge") && f !== "graph") {
      this.B.error("unimplemented", this.path(d, idx), `${kind} outside a graph frame is not implemented in M1`);
      return false;
    }
    if (kind === "cell" && f !== "cells") {
      this.B.error("unimplemented", this.path(d, idx), `cell outside a cells frame is not implemented in M1`);
      return false;
    }
    return true;
  }

  /** @param {any} o @param {string} idx @param {any} d @param {Pt} ref @param {string} anchor */
  optLabel(d, o, idx, ref, anchor) {
    if (o.label === undefined || o.label === null || o.label === false) return;
    const text = txt(o.label, this.m);
    if (!text) return;
    this.B.text({ mark: d.kind, markId: d.id, text, size: sizeOf(o), ref, anchor, color: textColor(o.tone), path: this.path(d, idx), priority: 1 });
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip @param {Pt[]} pts @param {{ close?: boolean; fill?: string; curve?: any; stroke?: string | null; base?: number }} [s] */
  polyShape(d, o, idx, clip, pts, s = {}) {
    let use = pts;
    if (typeof o.reveal === "number" && o.reveal < 1) use = cutFraction([{ pts }], o.reveal)[0] ?? [];
    const curve = s.curve ?? curveLinear;
    const dstr = use.length ? d3line().curve(curve).digits(2)(use) ?? "" : "";
    const color = colorOf(o);
    return this.B.shape({ mark: d.kind, markId: d.id, d: dstr + (s.close && use.length ? "Z" : ""), stroke: s.stroke === null ? undefined : color, fill: s.fill, opacity: o.opacity, dash: o.dash, sw: swOf(o), clip, pts: use, panel: this.index });
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_line(d, o, idx, clip) {
    const pts = /** @type {Pt[]} */ (d.args[0] ?? []);
    const curve = o.curve === "smooth" ? curveMonotoneX : o.curve === "step" ? curveStepAfter : curveLinear;
    if (this.frame.kind === "geo") return this.geoLine(d, o, idx, clip, pts, false);
    const px = pts.map((p) => this.px(p));
    this.polyShape(d, o, idx, clip, px, { curve, fill: "none" });
    if (px.length) this.optLabel(d, o, idx, px[px.length - 1], "ne");
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_area(d, o, idx, clip) {
    const pts = /** @type {Pt[]} */ (d.args[0] ?? []);
    const base = o.base ?? 0;
    let use = pts;
    if (typeof o.reveal === "number" && o.reveal < 1) {
      const px = pts.map((p) => this.px(p));
      const cut = cutFraction([{ pts: px }], o.reveal)[0] ?? [];
      use = cut.map((p) => pxToData(this.panel, p));
    }
    const top = use.map((p) => this.px(p));
    const bot = use.map((p) => this.px([p[0], base]));
    const color = colorOf(o);
    const fillMode = o.fill ?? "soft";
    const fill = fillMode === "none" ? "none" : fillMode === "solid" ? color : soft(color);
    const dstr = use.length ? d3area().x((_, i) => top[i][0]).y0((_, i) => bot[i][1]).y1((_, i) => top[i][1]).digits(2)(use) ?? "" : "";
    this.B.shape({ mark: "area", markId: d.id, d: dstr, stroke: color, fill, opacity: o.opacity, dash: o.dash, sw: STROKE.thin, clip, pts: [...top, ...bot], panel: this.index });
    if (top.length) this.optLabel(d, o, idx, top[top.length - 1], "ne");
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_dot(d, o, idx, clip) {
    const c = this.px(d.args[0]);
    const r = DOT_R[/** @type {"s" | "m" | "l"} */ (o.size)] ?? DOT_R.m;
    const color = colorOf(o);
    const fillMode = o.fill ?? "solid";
    this.B.shape({ mark: "dot", markId: d.id, d: circleD(c, r), stroke: color, fill: fillMode === "none" ? BACKGROUND : fillMode === "soft" ? soft(color) : color, opacity: o.opacity, dash: o.dash, sw: 1.5, clip, bbox: { x: c[0] - r, y: c[1] - r, width: 2 * r, height: 2 * r }, panel: this.index });
    this.B.obstacles.push({ x: c[0] - r, y: c[1] - r, width: 2 * r, height: 2 * r });
    this.optLabel(d, o, idx, c, "ne");
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_circle(d, o, idx, clip) {
    const c = this.px(d.args[0]);
    const e = this.px([d.args[0][0] + d.args[1], d.args[0][1]]);
    const r = Math.abs(e[0] - c[0]);
    const color = colorOf(o);
    const fill = fillOf(o, color, "none");
    if (typeof o.reveal === "number" && o.reveal < 1) {
      const pts = Array.from({ length: 65 }, (_, i) => /** @type {Pt} */ ([c[0] + r * Math.cos((i / 64) * 2 * Math.PI), c[1] - r * Math.sin((i / 64) * 2 * Math.PI)]));
      this.polyShape(d, o, idx, clip, pts, { fill: "none" });
    } else this.B.shape({ mark: "circle", markId: d.id, d: circleD(c, r), stroke: color, fill, opacity: o.opacity, dash: o.dash, sw: swOf(o), clip, bbox: { x: c[0] - r, y: c[1] - r, width: 2 * r, height: 2 * r }, panel: this.index });
    this.optLabel(d, o, idx, c, "ne");
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_rect(d, o, idx, clip) {
    const a = this.px(d.args[0]);
    const b = this.px(d.args[1]);
    const x0 = Math.min(a[0], b[0]);
    const y0 = Math.min(a[1], b[1]);
    const x1 = Math.max(a[0], b[0]);
    const y1 = Math.max(a[1], b[1]);
    const color = colorOf(o);
    /** @type {Pt[]} */
    const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
    if (typeof o.reveal === "number" && o.reveal < 1) this.polyShape(d, o, idx, clip, pts, { fill: "none" });
    else this.B.shape({ mark: "rect", markId: d.id, d: polyD(pts.slice(0, 4), true), stroke: color, fill: fillOf(o, color, "none"), opacity: o.opacity, dash: o.dash, sw: swOf(o), clip, pts, panel: this.index });
    this.optLabel(d, o, idx, [(x0 + x1) / 2, y0], "n");
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_arc(d, o, idx, clip) {
    const [cxy, rad, [a0, a1]] = d.args;
    const c = this.px(cxy);
    const e = this.px([cxy[0] + rad, cxy[1]]);
    const r = Math.abs(e[0] - c[0]);
    const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 4));
    /** @type {Pt[]} */
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      pts.push([c[0] + r * Math.cos(a), c[1] - r * Math.sin(a)]);
    }
    const color = colorOf(o);
    const all = o.sector ? [c, ...pts, c] : pts;
    const fill = o.sector ? fillOf(o, color, "none") : "none";
    this.polyShape(d, o, idx, clip, all, { fill, close: !!o.sector && !(typeof o.reveal === "number" && o.reveal < 1) });
    const mid = ((a0 + a1) / 2) * (Math.PI / 180);
    this.optLabel(d, o, idx, [c[0] + r * Math.cos(mid), c[1] - r * Math.sin(mid)], dirOf(Math.cos(mid), -Math.sin(mid)));
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_arrow(d, o, idx, clip) {
    if (this.frame.kind === "geo") return this.geoLine(d, o, idx, clip, [d.args[0], d.args[1]], true);
    const a = this.px(d.args[0]);
    const b = this.px(d.args[1]);
    this.arrowShapes(d, o, idx, clip, [a, b]);
    this.optLabel(d, o, idx, b, dirOf(b[0] - a[0], b[1] - a[1]));
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip @param {Pt[]} pts */
  arrowShapes(d, o, idx, clip, pts) {
    let use = pts;
    if (typeof o.reveal === "number" && o.reveal < 1) use = cutFraction([{ pts }], o.reveal)[0] ?? [];
    const sw = swOf(o);
    const color = colorOf(o);
    const len = 7 + sw * 2;
    const wid = 4 + sw * 1.2;
    if (use.length < 2) return;
    const b = use[use.length - 1];
    let k = use.length - 2;
    while (k > 0 && Math.hypot(b[0] - use[k][0], b[1] - use[k][1]) < 1e-9) k--;
    const a = use[k];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 1e-9) return;
    const ux = (b[0] - a[0]) / L;
    const uy = (b[1] - a[1]) / L;
    const hl = Math.min(len, L * 0.6);
    /** @type {Pt} */
    const base = [b[0] - ux * hl, b[1] - uy * hl];
    const shaft = [...use.slice(0, -1), base];
    this.B.shape({ mark: d.kind, markId: d.id, d: polyD(shaft), stroke: color, fill: "none", opacity: o.opacity, dash: o.dash, sw, clip, pts: shaft, panel: this.index });
    /** @type {Pt[]} */
    const head = [b, [base[0] - uy * wid, base[1] + ux * wid], [base[0] + uy * wid, base[1] - ux * wid]];
    this.B.shape({ mark: d.kind, markId: d.id, d: polyD(head, true), stroke: color, fill: color, opacity: o.opacity, dash: false, sw: 1, clip, pts: head, panel: this.index });
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_path(d, o, idx, clip) {
    const cmds = /** @type {any[]} */ (d.args[0] ?? []);
    if (this.frame.kind === "geo") {
      const pts = cmds.filter((c) => c[0] !== "Z").map((c) => /** @type {Pt} */ (c.slice(-2)));
      return this.geoLine(d, o, idx, clip, pts, false);
    }
    const sx = this.panel.plot.width / (this.panel.domain.x[1] - this.panel.domain.x[0]);
    const sy = this.panel.plot.height / (this.panel.domain.y[1] - this.panel.domain.y[0]);
    /** @type {any[]} */
    const pc = [];
    /** @type {Pt} */
    let cur = [0, 0];
    /** @type {Pt} */
    let start = [0, 0];
    for (const c of cmds) {
      if (c[0] === "M") {
        cur = this.px([c[1], c[2]]);
        start = cur;
        pc.push({ c: "M", p: [...cur] });
      } else if (c[0] === "L") {
        cur = this.px([c[1], c[2]]);
        pc.push({ c: "L", p: [...cur] });
      } else if (c[0] === "Q") {
        const q = this.px([c[1], c[2]]);
        const e = this.px([c[3], c[4]]);
        pc.push({ c: "C", p: [cur[0] + (2 / 3) * (q[0] - cur[0]), cur[1] + (2 / 3) * (q[1] - cur[1]), e[0] + (2 / 3) * (q[0] - e[0]), e[1] + (2 / 3) * (q[1] - e[1]), e[0], e[1]] });
        cur = e;
      } else if (c[0] === "C") {
        const p1 = this.px([c[1], c[2]]);
        const p2 = this.px([c[3], c[4]]);
        const e = this.px([c[5], c[6]]);
        pc.push({ c: "C", p: [...p1, ...p2, ...e] });
        cur = e;
      } else if (c[0] === "A") {
        const e = this.px([c[6], c[7]]);
        for (const k of arcToCubics(cur[0], cur[1], c[1] * sx, c[2] * sy, -c[3], c[4] ? 1 : 0, c[5] ? 0 : 1, e[0], e[1])) pc.push({ c: "C", p: k });
        cur = e;
      } else if (c[0] === "Z") {
        pc.push({ c: "Z", p: [] });
        cur = start;
      }
    }
    const color = colorOf(o);
    if (typeof o.reveal === "number" && o.reveal < 1) {
      const parts = cutFraction(flatten(pc), o.reveal);
      const dd = parts.map((p) => polyD(p)).join("");
      this.B.shape({ mark: "path", markId: d.id, d: dd, stroke: color, fill: "none", opacity: o.opacity, dash: o.dash, sw: swOf(o), clip, pts: parts.flat(), panel: this.index });
    } else this.B.shape({ mark: "path", markId: d.id, d: serialize(pc), stroke: color, fill: fillOf(o, color, "none"), opacity: o.opacity, dash: o.dash, sw: swOf(o), clip, bbox: cmdsBBox(pc), panel: this.index });
    this.optLabel(d, o, idx, cur, "ne");
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip @param {Pt[]} lonlat @param {boolean} arrow */
  geoLine(d, o, idx, clip, lonlat, arrow) {
    const g = geoModule();
    const pr = this.panel._r.projection;
    /** @type {Pt[]} */
    const dense = [];
    for (let i = 0; i < lonlat.length; i++) {
      if (i === 0) {
        dense.push(lonlat[0]);
        continue;
      }
      const f = g.geoInterpolate(lonlat[i - 1], lonlat[i]);
      for (let k = 1; k <= 32; k++) dense.push(f(k / 32));
    }
    let use = dense;
    if (typeof o.reveal === "number" && o.reveal < 1) {
      const pp = dense.map((p) => pr(p) ?? [NaN, NaN]);
      const lens = [0];
      for (let i = 1; i < pp.length; i++) lens.push(lens[i - 1] + (Number.isFinite(pp[i][0] + pp[i - 1][0]) ? Math.hypot(pp[i][0] - pp[i - 1][0], pp[i][1] - pp[i - 1][1]) : 0));
      const goal = lens[lens.length - 1] * Math.max(0, o.reveal);
      let n = 0;
      while (n < lens.length - 1 && lens[n + 1] <= goal + 1e-9) n++;
      use = dense.slice(0, n + 1);
    }
    const path = g.geoPath(pr).digits(2);
    const px = use.map((p) => pr(p)).filter(Boolean);
    const color = colorOf(o);
    if (arrow && px.length >= 2) this.arrowShapes(d, { ...o, reveal: undefined }, idx, clip, px);
    else this.B.shape({ mark: d.kind, markId: d.id, d: use.length >= 2 ? path({ type: "LineString", coordinates: use }) ?? "" : "", stroke: color, fill: "none", opacity: o.opacity, dash: o.dash, sw: swOf(o), clip, pts: px, panel: this.index });
    if (px.length) this.optLabel(d, o, idx, px[px.length - 1], "ne");
  }

  /** @param {any} d @param {any} o @param {string} idx */
  m_label(d, o, idx) {
    const ref = this.px(d.args[0]);
    const text = txt(d.args[1], this.m);
    const leader = o.leader ? this.px(o.leader) : undefined;
    this.B.text({ mark: "label", markId: d.id, text, size: sizeOf(o), weight: o.weight === "bold" ? 600 : 400, ref, anchor: o.anchor ?? "n", leader, color: textColor(o.tone), path: this.path(d, idx), priority: 1 });
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_dim(d, o, idx, clip) {
    const a = this.px(d.args[0]);
    const b = this.px(d.args[1]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    let nx = -dy / L;
    let ny = dx / L;
    if (ny > 1e-9 || (Math.abs(ny) <= 1e-9 && nx > 0)) {
      nx = -nx;
      ny = -ny;
    }
    const t = 5;
    const color = colorOf(o, AXIS);
    const dstr = `${polyD([a, b])}M${f2(a[0] + nx * t)},${f2(a[1] + ny * t)}L${f2(a[0] - nx * t)},${f2(a[1] - ny * t)}M${f2(b[0] + nx * t)},${f2(b[1] + ny * t)}L${f2(b[0] - nx * t)},${f2(b[1] - ny * t)}`;
    this.B.shape({ mark: "dim", markId: d.id, d: dstr, stroke: color, fill: "none", opacity: o.opacity, dash: o.dash, sw: STROKE.thin, clip: null, pts: [a, b, [a[0] + nx * t, a[1] + ny * t], [b[0] - nx * t, b[1] - ny * t]], panel: this.index });
    if (Math.abs(dx) < 1e-6 || Math.abs(dy) < 1e-6) this.B.obstacles.push(inflate(bboxOf([a, b]), t));
    const mid = /** @type {Pt} */ ([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    this.B.text({ mark: "dim", markId: d.id, text: txt(d.args[2], this.m), size: sizeOf(o), ref: [mid[0] + nx * 2, mid[1] + ny * 2], itemRef: mid, anchor: dirOf(nx, ny), color: textColor(o.tone), path: this.path(d, idx), priority: 2 });
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_brace(d, o, idx, clip) {
    const a = this.px(d.args[0]);
    const b = this.px(d.args[1]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    let nx = -dy / L;
    let ny = dx / L;
    if (ny > 1e-9 || (Math.abs(ny) <= 1e-9 && nx > 0)) {
      nx = -nx;
      ny = -ny;
    }
    const q = 10;
    const ux = dx / L;
    const uy = dy / L;
    const P = (/** @type {number} */ s, /** @type {number} */ h) => /** @type {Pt} */ ([a[0] + ux * s + nx * h, a[1] + uy * s + ny * h]);
    const m = L / 2;
    const c = Math.min(q, L / 4);
    const cmds = [
      { c: "M", p: P(0, 0) },
      { c: "C", p: [...P(0, q / 2), ...P(c, q / 2), ...P(c, q / 2)] },
      { c: "L", p: P(m - c, q / 2) },
      { c: "C", p: [...P(m, q / 2), ...P(m, q), ...P(m, q)] },
      { c: "C", p: [...P(m, q), ...P(m, q / 2), ...P(m + c, q / 2)] },
      { c: "L", p: P(L - c, q / 2) },
      { c: "C", p: [...P(L, q / 2), ...P(L, 0), ...P(L, 0)] },
    ];
    const color = colorOf(o, AXIS);
    const bb = cmdsBBox(/** @type {any} */ (cmds));
    this.B.shape({ mark: "brace", markId: d.id, d: serialize(/** @type {any} */ (cmds)), stroke: color, fill: "none", opacity: o.opacity, dash: o.dash, sw: STROKE.thin, clip: null, bbox: bb, panel: this.index });
    this.B.obstacles.push(bb);
    const tip = P(m, q);
    this.B.text({ mark: "brace", markId: d.id, text: txt(d.args[2], this.m), size: sizeOf(o), ref: tip, anchor: dirOf(nx, ny), color: textColor(o.tone), path: this.path(d, idx), priority: 2 });
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_angle(d, o, idx, clip) {
    const v = this.px(d.args[0]);
    const a = this.px(d.args[1]);
    const b = this.px(d.args[2]);
    let t1 = Math.atan2(-(a[1] - v[1]), a[0] - v[0]);
    let t2 = Math.atan2(-(b[1] - v[1]), b[0] - v[0]);
    let delta = t2 - t1;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    const r = 22 + (o.size === "l" ? 6 : 0);
    const n = Math.max(6, Math.ceil(Math.abs(delta) / 0.08));
    /** @type {Pt[]} */
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = t1 + (delta * i) / n;
      pts.push([v[0] + r * Math.cos(t), v[1] - r * Math.sin(t)]);
    }
    const color = colorOf(o, AXIS);
    const last = this.polyShape(d, { ...o, tone: o.tone }, idx, clip, pts, { fill: "none" });
    if (!o.tone && last) last.stroke = color;
    const mid = t1 + delta / 2;
    const text = o.text !== undefined ? txt(o.text, this.m) : "";
    if (text) {
      const ux = Math.cos(mid);
      const uy = -Math.sin(mid);
      this.B.text({ mark: "angle", markId: d.id, text, size: sizeOf(o), ref: [v[0] + ux * (r + 2), v[1] + uy * (r + 2)], itemRef: [v[0] + ux * r, v[1] + uy * r], anchor: dirOf(ux, uy), color: textColor(o.tone), path: this.path(d, idx), priority: 2 });
    }
    this.optLabel(d, o, idx, v, "sw");
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_axis(d, o, idx, clip) {
    const which = d.args[0];
    const p = this.panel;
    const plot = p.plot;
    const log = p.log === which || p.log === "xy";
    const len = which === "x" ? plot.width : plot.height;
    const tk = this.ticks(which, p.domain[which], log, len, d);
    const size = TEXT.figure.s;
    const lh = size * LINE_HEIGHT;
    const color = AXIS;
    const pos = tk.values.map((v) => (which === "x" ? this.px([v, p.domain.y[0]])[0] : this.px([p.domain.x[0], v])[1]));
    const boxes = tk.labels.map((s, i) => {
      const w = lineWidth(s, size);
      return which === "x" ? { x: pos[i] - w / 2, y: plot.y + plot.height + TICK + GAP, width: w, height: lh } : { x: plot.x - TICK - GAP - w, y: pos[i] - lh / 2, width: w, height: lh };
    });
    let k = 1;
    const ok = (/** @type {number} */ step) => {
      const keep = boxes.filter((_, i) => i % step === 0);
      for (let i = 1; i < keep.length; i++) if (overlaps(inflate(keep[i - 1], 3), keep[i])) return false;
      return true;
    };
    while (k < boxes.length && !ok(k)) k++;
    let dstr = which === "x" ? `M${f2(plot.x)},${f2(plot.y + plot.height)}H${f2(plot.x + plot.width)}` : `M${f2(plot.x)},${f2(plot.y)}V${f2(plot.y + plot.height)}`;
    /** @type {Pt[]} */
    const pts = [];
    tk.values.forEach((_, i) => {
      if (i % k !== 0) return;
      if (which === "x") dstr += `M${f2(pos[i])},${f2(plot.y + plot.height)}v${TICK}`;
      else dstr += `M${f2(plot.x)},${f2(pos[i])}h${-TICK}`;
    });
    pts.push([plot.x - TICK, plot.y], [plot.x + plot.width, plot.y + plot.height + TICK]);
    this.B.shape({ mark: "axis", markId: d.id, d: dstr, stroke: color, fill: "none", opacity: o.opacity, sw: 1, clip: null, pts, panel: this.index });
    const keepIdx = tk.values.map((_, i) => i).filter((i) => i % k === 0);
    if (keepIdx.length && k > 1 && !tk.title && keepIdx[keepIdx.length - 1] !== tk.values.length - 1) {
      const unit = which === "x" ? this.fo.x?.[2] : this.fo.y?.[2];
      if (unit) {
        const li = keepIdx[keepIdx.length - 1];
        const s = withUnit(String(tk.labels[li]), unit);
        tk.labels[li] = s;
        const w = lineWidth(s, size);
        boxes[li] = which === "x" ? { ...boxes[li], x: pos[li] - w / 2, width: w } : { ...boxes[li], x: plot.x - TICK - GAP - w, width: w };
      }
    }
    const fb = this.B.panelBoxes[this.index] ?? this.B.box;
    for (const i of keepIdx) {
      const b0 = boxes[i];
      if (b0.width > fb.width || b0.height > fb.height) continue;
      const b = { ...b0, x: Math.min(Math.max(b0.x, fb.x), fb.x + fb.width - b0.width), y: Math.min(Math.max(b0.y, fb.y), fb.y + fb.height - b0.height) };
      if (this.B.pre.some((q) => overlaps({ x: q.box.x - TEXT_GAP, y: q.box.y - TEXT_GAP, width: q.box.width + 2 * TEXT_GAP, height: q.box.height + 2 * TEXT_GAP }, b))) continue;
      const ref = /** @type {Pt} */ (which === "x" ? [pos[i], plot.y + plot.height + TICK] : [plot.x - TICK, pos[i]]);
      this.B.obstacles.push(b);
      this.B.pre.push({ id: `${d.id ?? "axis"}~t${which}${this.index}.${i}`, mark: "axis", markId: d.id, box: b, lines: [tk.labels[i]], size, color: "#4b5260", itemRef: ref, panel: this.index });
    }
    if (tk.title) {
      const ts = TEXT.figure.m;
      const w = lineWidth(tk.title, ts);
      const h = ts * LINE_HEIGHT;
      let b;
      if (which === "x") b = { x: plot.x + plot.width / 2 - w / 2, y: plot.y + plot.height + TICK + GAP + lh + TEXT_GAP + 0.5, width: w, height: h };
      else b = { x: Math.max(this.area.x, plot.x - w / 2), y: plot.y - lh / 2 - h - TEXT_GAP - 0.5, width: w, height: h };
      if (b.x + b.width > this.area.x + this.area.width) b.x = this.area.x + this.area.width - b.width;
      if (b.x < this.area.x) b.x = this.area.x;
      const pb = this.B.panelBoxes[this.index] ?? this.B.box;
      const near = (/** @type {Box} */ c) => this.B.pre.some((q) => overlaps({ x: q.box.x - TEXT_GAP, y: q.box.y - TEXT_GAP, width: q.box.width + 2 * TEXT_GAP, height: q.box.height + 2 * TEXT_GAP }, c));
      const fits = (/** @type {Box} */ c) => c.x >= pb.x - 1e-6 && c.y >= pb.y - 1e-6 && c.x + c.width <= pb.x + pb.width + 1e-6 && c.y + c.height <= pb.y + pb.height + 1e-6;
      /** @type {Box | null} */
      let at = null;
      for (const dy of [0, 4, 8, 12, 16, 24]) {
        for (const dx of which === "x" ? [0] : [0, 8, 16, 32]) {
          const c = { ...b, x: Math.min(b.x + dx, pb.x + pb.width - w), y: which === "x" ? b.y + dy : b.y - dy };
          if (fits(c) && !near(c)) {
            at = c;
            break;
          }
        }
        if (at) break;
      }
      if (at) {
        this.B.obstacles.push(at);
        this.B.pre.push({ id: `${d.id ?? "axis"}~title${which}${this.index}`, mark: "axis", markId: d.id, box: at, lines: [tk.title], size: ts, color: INK, itemRef: which === "x" ? [plot.x + plot.width / 2, plot.y + plot.height] : [plot.x, plot.y], panel: this.index });
      }
    }
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_grid(d, o, idx, clip) {
    const p = this.panel;
    const plot = p.plot;
    const spec = d.args[0] && isPlainObject(d.args[0]) ? d.args[0] : {};
    /** @param {"x" | "y"} w */
    const vals = (w) => {
      const s = spec[w];
      const dom = p.domain[w];
      if (Array.isArray(s)) return s;
      if (typeof s === "number" && s > 0) {
        const out = [];
        for (let v = Math.ceil(dom[0] / s - 1e-9) * s; v <= dom[1] + 1e-9; v += s) out.push(v);
        return out.slice(0, 500);
      }
      if (spec.x !== undefined || spec.y !== undefined) return [];
      const log = p.log === w || p.log === "xy";
      return this.ticks(w, dom, log, w === "x" ? plot.width : plot.height, { args: [w, {}] }).values;
    };
    let dstr = "";
    for (const v of vals("x")) {
      const x = this.px([v, p.domain.y[0]])[0];
      dstr += `M${f2(x)},${f2(plot.y)}V${f2(plot.y + plot.height)}`;
    }
    for (const v of vals("y")) {
      const y = this.px([p.domain.x[0], v])[1];
      dstr += `M${f2(plot.x)},${f2(y)}H${f2(plot.x + plot.width)}`;
    }
    this.B.shape({ mark: "grid", markId: d.id, d: dstr, stroke: o.tone ? colorOf(o) : GRID, fill: "none", opacity: o.opacity, dash: o.dash, sw: 1, clip, bbox: plot, panel: this.index });
  }

  /** @param {any} d @param {any} o @param {string} idx */
  m_legend(d, o, idx) {
    const entries = /** @type {any[]} */ (d.args[0] ?? []);
    const size = sizeOf(o);
    const lh = size * LINE_HEIGHT;
    const dims = this.legendSize(d);
    const plot = this.panel.plot;
    /** @type {Pt} */
    let ref;
    let fixed = false;
    let anchor = "se";
    if (o.at) {
      const pb = this.B.panelBoxes[this.index] ?? this.B.box;
      const p0 = this.px(o.at);
      const x = Math.min(Math.max(p0[0], pb.x), pb.x + pb.width - dims.width);
      const y = Math.min(Math.max(p0[1], pb.y), pb.y + pb.height - dims.height);
      anchor = "c";
      ref = [x + dims.width / 2, y + dims.height / 2];
    } else if (this.B.viewport === "mobile") {
      fixed = true;
      ref = [this.area.x + dims.width / 2, this.area.y + this.area.height - dims.height / 2];
      anchor = "c";
    } else {
      fixed = true;
      ref = [this.area.x + this.area.width - dims.width / 2, plot.y + dims.height / 2];
      anchor = "c";
    }
    const texts = entries.map((e) => txt(e.text, this.m));
    this.B.text({
      mark: "legend",
      markId: d.id,
      text: texts.join("\n"),
      size,
      ref,
      anchor,
      fixed,
      dims,
      lines: texts,
      path: this.path(d, idx),
      priority: 3,
      kind: "legend",
      noAvoid: true,
      noLeader: true,
      extra: { entries: entries.map((e, i) => ({ text: texts[i], color: colorOf(e) })) },
      onPlaced: (b) => {
        this.B.shape({ mark: "legend", markId: d.id, d: polyD([[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]], true), stroke: GRID, fill: BACKGROUND, sw: 1, bbox: b, panel: this.index, opacity: 1 });
        entries.forEach((e, i) => {
          const y = b.y + LEGEND_PAD + i * lh + lh / 2;
          const x = b.x + LEGEND_PAD;
          const c = colorOf(e);
          this.B.shape({ mark: "legend", markId: d.id, d: polyD([[x, y - SWATCH / 2], [x + SWATCH, y - SWATCH / 2], [x + SWATCH, y + SWATCH / 2], [x, y + SWATCH / 2]], true), stroke: c, fill: c, sw: 1, bbox: { x, y: y - SWATCH / 2, width: SWATCH, height: SWATCH }, panel: this.index });
        });
      },
      inner: (b) => ({ x: b.x + LEGEND_PAD + SWATCH + 6, y: b.y + LEGEND_PAD, width: b.width - 2 * LEGEND_PAD - SWATCH - 6, height: b.height - 2 * LEGEND_PAD }),
    });
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_sweep(d, o, idx, clip) {
    const [axis, at] = d.args;
    const p = this.panel;
    const plot = p.plot;
    const color = colorOf(o, TONES.ref);
    const w = typeof o.width === "number" ? o.width : 0;
    if (axis === "x") {
      const x = this.px([at, p.domain.y[0]])[0];
      if (w > 0) {
        const x0 = this.px([at - w / 2, p.domain.y[0]])[0];
        const x1 = this.px([at + w / 2, p.domain.y[0]])[0];
        this.B.shape({ mark: "sweep", markId: d.id, d: polyD([[x0, plot.y], [x1, plot.y], [x1, plot.y + plot.height], [x0, plot.y + plot.height]], true), fill: soft(color), stroke: "none", opacity: o.opacity, sw: 0, clip, bbox: { x: Math.min(x0, x1), y: plot.y, width: Math.abs(x1 - x0), height: plot.height }, panel: this.index });
      }
      const ln = this.polyShape(d, o, idx, clip, [[x, plot.y + plot.height], [x, plot.y]], { fill: "none" });
      if (!o.tone && ln) ln.stroke = color;
      this.optLabel(d, o, idx, [x, plot.y], "n");
    } else {
      const y = this.px([p.domain.x[0], at])[1];
      if (w > 0) {
        const y0 = this.px([p.domain.x[0], at - w / 2])[1];
        const y1 = this.px([p.domain.x[0], at + w / 2])[1];
        this.B.shape({ mark: "sweep", markId: d.id, d: polyD([[plot.x, y0], [plot.x + plot.width, y0], [plot.x + plot.width, y1], [plot.x, y1]], true), fill: soft(color), stroke: "none", opacity: o.opacity, sw: 0, clip, bbox: { x: plot.x, y: Math.min(y0, y1), width: plot.width, height: Math.abs(y1 - y0) }, panel: this.index });
      }
      const ln = this.polyShape(d, o, idx, clip, [[plot.x, y], [plot.x + plot.width, y]], { fill: "none" });
      if (!o.tone && ln) ln.stroke = color;
      this.optLabel(d, o, idx, [plot.x + plot.width, y], "e");
    }
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_trace(d, o, idx, clip) {
    const [s, t] = d.args;
    const [i, j] = o.dims ?? [0, 1];
    const pts = /** @type {Pt[]} */ (s.until(t).map((/** @type {any} */ p) => [p.y[i], p.y[j]]));
    const px = pts.map((p) => this.px(p));
    if (o.trail !== false) this.polyShape({ kind: "trace", id: d.id }, o, idx, clip, px, { fill: "none" });
    if (o.head && px.length) {
      const h = px[px.length - 1];
      const color = colorOf(o);
      const r = DOT_R.m + 0.5;
      this.B.shape({ mark: "trace", markId: d.id, d: circleD(h, r), stroke: BACKGROUND, fill: color, opacity: o.opacity, sw: 1.5, clip, bbox: { x: h[0] - r, y: h[1] - r, width: 2 * r, height: 2 * r }, panel: this.index });
    }
    if (px.length) this.optLabel(d, o, idx, px[px.length - 1], "ne");
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_flow(d, o, idx, clip) {
    const pts = /** @type {Pt[]} */ (d.args[0] ?? []);
    const px = this.frame.kind === "geo" ? pts.map((p) => this.px(p)) : pts.map((p) => this.px(p));
    const n = Math.max(0, Math.floor(o.n ?? 0));
    const rand = rng(o.seed ?? 0);
    const segs = [];
    let total = 0;
    for (let k = 1; k < px.length; k++) {
      const L = Math.hypot(px[k][0] - px[k - 1][0], px[k][1] - px[k - 1][1]);
      segs.push(L);
      total += L;
    }
    const color = colorOf(o);
    const r = DOT_R[/** @type {"s" | "m" | "l"} */ (o.size)] ?? 3;
    let dstr = "";
    /** @type {Pt[]} */
    const at = [];
    for (let q = 0; q < n; q++) {
      const off = rand();
      let f = (off + (o.rate ?? 0) * (o.t ?? 0)) % 1;
      if (f < 0) f += 1;
      let left = f * total;
      let k = 0;
      while (k < segs.length - 1 && left > segs[k]) left -= segs[k++];
      const a = px[k];
      const b = px[k + 1] ?? px[k];
      const g = segs[k] ? left / segs[k] : 0;
      /** @type {Pt} */
      const p = a ? [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g] : [0, 0];
      at.push(p);
      dstr += circleD(p, r);
    }
    this.B.shape({ mark: "flow", markId: d.id, d: dstr, stroke: "none", fill: color, opacity: o.opacity, sw: 0, clip, pts: at.flatMap(([x, y]) => [/** @type {Pt} */ ([x - r, y - r]), /** @type {Pt} */ ([x + r, y + r])]), panel: this.index });
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_cell(d, o, idx, clip) {
    const [c, r] = d.args;
    const a = this.px([c, r]);
    const b = this.px([c + 1, r + 1]);
    const box = { x: a[0], y: a[1], width: b[0] - a[0], height: b[1] - a[1] };
    let fill = "none";
    let ink = INK;
    if (typeof o.value === "number") {
      const vs = this.marks.filter((m) => m.kind === "cell" && typeof optsOf([m.args[2]]).value === "number").map((m) => optsOf([m.args[2]]).value);
      const lo = Math.min(...vs);
      const hi = Math.max(...vs);
      fill = sequential(hi > lo ? (o.value - lo) / (hi - lo) : 0.5);
      ink = onColor(fill);
    } else if (o.tone) {
      const col = colorOf(o);
      fill = o.fill === "solid" ? col : o.fill === "none" ? "none" : soft(col);
      ink = fill === "none" ? INK : onColor(fill);
    }
    /** @type {Pt[]} */
    const pts = [[box.x, box.y], [box.x + box.width, box.y], [box.x + box.width, box.y + box.height], [box.x, box.y + box.height]];
    this.B.shape({ mark: "cell", markId: d.id, d: polyD(pts, true), stroke: o.tone ? colorOf(o) : "#ffffff", fill, opacity: o.opacity, dash: o.dash, sw: 1, clip, bbox: box, panel: this.index });
    const text = o.text !== undefined ? txt(o.text, this.m) : "";
    if (text) {
      const size = sizeOf(o);
      const m = measureText(text, { size });
      const path = this.path(d, idx);
      if (m.width > box.width - 4 || m.height > box.height) {
        this.B.error("text-no-room", path, `cell text ${JSON.stringify(text)} needs ${m.width.toFixed(0)}x${m.height.toFixed(0)} px; cell is ${box.width.toFixed(0)}x${box.height.toFixed(0)} px`);
      } else {
        const dim = this.B.emphasis(d.id) === "dim";
        const op = (typeof o.opacity === "number" ? o.opacity : 1) * (dim ? DIM_OPACITY : 1);
        const shown = fill === "none" ? BACKGROUND : mix(BACKGROUND, fill, op);
        this.B.text({ mark: "cell", markId: d.id, text, size, ref: [box.x + box.width / 2, box.y + box.height / 2], anchor: "c", fixed: true, color: fill === "none" ? ink : onColor(shown), keepColor: true, path, extra: { bg: shown } });
      }
    }
  }

  /** @param {any} d @param {any} o @param {string} idx */
  m_node(d, o, idx) {
    const pos = this.graphPos.get(d.args[0]);
    if (!pos) return;
    const { box, lines } = pos;
    const color = colorOf(o, "#5b6472");
    const shape = o.shape ?? "box";
    let dstr;
    if (shape === "circle") dstr = circleD([box.x + box.width / 2, box.y + box.height / 2], Math.max(box.width, box.height) / 2);
    else if (shape === "round") dstr = roundRect(box, Math.min(box.height / 2, 16));
    else dstr = roundRect(box, 4);
    const fillMode = o.fill ?? "soft";
    const fill = fillMode === "none" ? BACKGROUND : fillMode === "solid" ? color : soft(color);
    this.B.shape({ mark: "node", markId: d.id, d: dstr, stroke: color, fill, opacity: o.opacity, dash: o.dash, sw: swOf(o) * 0.75, clip: null, bbox: box, panel: this.index });
    const size = sizeOf(o);
    const tw = Math.max(0, ...lines.map((/** @type {string} */ l) => lineWidth(l, size)));
    const th = lines.length * size * LINE_HEIGHT;
    this.B.text({
      mark: "node",
      markId: d.id,
      graph: `${this.key}#${this.index}`,
      text: lines.join("\n"),
      lines,
      dims: { width: box.width, height: box.height },
      size,
      ref: [box.x + box.width / 2, box.y + box.height / 2],
      anchor: "c",
      fixed: true,
      color: fillMode === "solid" ? onColor(color) : INK,
      keepColor: fillMode === "solid",
      path: this.path(d, idx),
      inner: (b) => ({ x: b.x + (b.width - tw) / 2, y: b.y + (b.height - th) / 2, width: tw, height: th }),
    });
  }

  /** @param {any} d @param {any} o @param {string} idx */
  m_edge(d, o, idx) {
    const id = d.id ?? `${d.args[0]}->${d.args[1]}`;
    const e = this.graphEdges?.get(id);
    if (!e) return;
    const color = colorOf(o, "#7a8290");
    const directed = o.directed === true;
    if (directed) this.arrowShapes({ kind: "edge", id: d.id }, { ...o, tone: o.tone }, idx, null, e.pts);
    else this.polyShape({ kind: "edge", id: d.id }, o, idx, null, e.pts, { fill: "none" });
    for (const s of this.B.shapes.slice(directed ? -2 : -1)) if (!o.tone) {
      s.stroke = color;
      if (s.fill && s.fill !== "none") s.fill = color;
    }
    const text = o.text !== undefined ? txt(o.text, this.m) : "";
    if (text) {
      const mid = e.label ?? midpoint(e.pts);
      this.B.text({ mark: "edge", markId: d.id, text, size: TEXT.figure.s, ref: mid, anchor: "c", color: textColor(o.tone), path: this.path(d, idx), priority: 1, maxWidth: 140, graph: `${this.key}#${this.index}` });
    }
  }

  /** @param {any} d @param {any} o @param {string} idx */
  m_math(d, o, idx) {
    const size = sizeOf(o);
    const tex = String(d.args[1] ?? "");
    const dims = measureMath(tex, size);
    const ref = this.px(d.args[0]);
    this.B.text({ mark: "math", markId: d.id, text: tex, lines: [tex], size, ref, anchor: "e", dims, color: INK, path: this.path(d, idx), priority: 2, kind: "math", extra: { tex } });
    this.optLabel(d, o, idx, ref, "n");
  }

  /** @param {any} d @param {any} o @param {string} idx */
  m_code(d, o, idx) {
    const size = sizeOf(o);
    const src = String(d.args[1] ?? "").replace(/\t/g, "  ");
    const lines = src.split("\n");
    const tw = Math.max(0, ...lines.map((l) => lineWidth(l, size, "mono")));
    const th = lines.length * size * LINE_HEIGHT;
    const dims = { width: tw + 2 * CODE_PAD, height: th + 2 * CODE_PAD };
    const ref = this.px(d.args[0]);
    const hl = new Set(Array.isArray(o.highlight) ? o.highlight : []);
    let placed = /** @type {Box | null} */ (null);
    this.B.text({
      mark: "code",
      markId: d.id,
      text: src,
      lines,
      size,
      ref,
      anchor: "se",
      dims,
      color: INK,
      path: this.path(d, idx),
      priority: 2,
      kind: "code",
      keepColor: true,
      extra: { highlight: [...hl] },
      onPlaced: (b) => {
        placed = b;
        this.B.shape({ mark: "code", markId: d.id, d: roundRect(b, 6), stroke: "#d8dde4", fill: "#f6f7f9", sw: 1, bbox: b, panel: this.index });
        for (const n of hl) {
          if (n < 1 || n > lines.length) continue;
          const y = b.y + CODE_PAD + (n - 1) * size * LINE_HEIGHT;
          const hb = { x: b.x + 3, y, width: b.width - 6, height: size * LINE_HEIGHT };
          this.B.shape({ mark: "code", markId: d.id, d: roundRect(hb, 3), stroke: "none", fill: soft(TONES.focus), sw: 0, bbox: hb, panel: this.index });
        }
      },
      inner: (b) => ({ x: b.x + CODE_PAD, y: b.y + CODE_PAD, width: b.width - 2 * CODE_PAD, height: b.height - 2 * CODE_PAD }),
    });
    if (o.label !== undefined) {
      const text = txt(o.label, this.m);
      if (text) this.B.text({ mark: "code", markId: d.id, text, size: sizeOf(o), ref: [ref[0], ref[1]], anchor: "s", color: textColor(o.tone), path: this.path(d, idx), priority: 1, maxWidth: 220 });
    }
    void placed;
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_mock(d, o, idx, clip) {
    const [kind, [p0, p1], children] = d.args;
    const a = this.px(p0);
    const b = this.px(p1);
    const box = { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), width: Math.abs(b[0] - a[0]), height: Math.abs(b[1] - a[1]) };
    const bar = /** @type {any} */ (MOCK_BAR)[kind] ?? 26;
    const side = /** @type {any} */ (MOCK_SIDE)[kind] ?? 0;
    const outer = kind === "phone" ? { x: box.x - side, y: box.y - bar, width: box.width + 2 * side, height: box.height + 2 * bar } : { x: box.x, y: box.y - bar, width: box.width, height: box.height + bar };
    const path = this.path(d, idx);
    const fb = this.B.box;
    if (outer.x < -1e-6 || outer.y < -1e-6 || outer.x + outer.width > fb.width + 1e-6 || outer.y + outer.height > fb.height + 1e-6) {
      this.B.error("text-no-room", path, `mock ${kind} frame spans x ${outer.x.toFixed(0)}..${(outer.x + outer.width).toFixed(0)}, y ${outer.y.toFixed(0)}..${(outer.y + outer.height).toFixed(0)}; expected inside the ${fb.width.toFixed(0)}x${fb.height.toFixed(0)} figure`);
    }
    const chrome = "#dfe3e8";
    this.B.shape({ mark: "mock", markId: d.id, d: roundRect(outer, kind === "phone" ? 18 : 8), stroke: "#b9c0c9", fill: kind === "phone" ? "#2b2f36" : chrome, sw: 1, bbox: outer, panel: this.index, opacity: o.opacity });
    this.B.shape({ mark: "mock", markId: d.id, d: polyD([[box.x, box.y], [box.x + box.width, box.y], [box.x + box.width, box.y + box.height], [box.x, box.y + box.height]], true), stroke: "none", fill: BACKGROUND, sw: 0, bbox: box, panel: this.index });
    if (kind === "browser") {
      for (let i = 0; i < 3; i++) this.B.shape({ mark: "mock", markId: d.id, d: circleD([box.x + 12 + i * 12, box.y - bar / 2], 3.5), stroke: "none", fill: ["#ef6b5e", "#f4bf4f", "#61c554"][i], sw: 0, bbox: { x: box.x + 8.5 + i * 12, y: box.y - bar / 2 - 3.5, width: 7, height: 7 }, panel: this.index });
      const pill = { x: box.x + 52, y: box.y - bar + 6, width: Math.max(0, box.width - 64), height: bar - 12 };
      if (pill.width > 0) this.B.shape({ mark: "mock", markId: d.id, d: roundRect(pill, 6), stroke: "none", fill: BACKGROUND, sw: 0, bbox: pill, panel: this.index });
    }
    if (o.title !== undefined) {
      const title = txt(o.title, this.m);
      const size = TEXT.figure.s;
      const w = lineWidth(title, size);
      const h = size * LINE_HEIGHT;
      const x0 = kind === "browser" ? box.x + 58 : box.x + 8;
      const tb = { x: x0, y: box.y - bar / 2 - h / 2, width: w, height: h };
      if (kind === "phone" || tb.x + tb.width > box.x + box.width - 6 || tb.y < 0) {
        this.B.error("text-no-room", path, `mock title ${JSON.stringify(title)} needs ${w.toFixed(0)} px; the ${kind} bar has ${Math.max(0, box.x + box.width - 6 - x0).toFixed(0)} px`);
      } else {
        this.B.text({ mark: "mock", markId: d.id, text: title, size, ref: [tb.x + w / 2, tb.y + h / 2], anchor: "c", fixed: true, dims: { width: w, height: h }, lines: [title], color: INK, path });
      }
    }
    const inner = clip ? intersect(clip, box) : box;
    flattenMarks(children).forEach((c, ci) => this.mark(c, c.id ?? `${d.id ?? idx}.${ci}`, inner));
  }

  /** @param {any} d @param {any} o @param {string} idx @param {Box | null} clip */
  m_custom(d, o, idx, clip) {
    const [opts, render] = d.args;
    const [[bx0, by0], [bx1, by1]] = opts.bounds;
    const a = this.px([bx0, by0]);
    const b = this.px([bx1, by1]);
    const box = { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), width: Math.abs(b[0] - a[0]), height: Math.abs(b[1] - a[1]) };
    const base = [box.width, 0, 0, box.height, box.x, box.y];
    const out = render({ h: vnode, m: this.m, t: this.B.t });
    const cl = clip ? intersect(clip, box) : box;
    const id = opts.id;
    const path = this.path({ id }, idx);
    const emit = (/** @type {any} */ n, /** @type {number[]} */ M, /** @type {Record<string, string>} */ inh) => {
      if (Array.isArray(n)) return n.forEach((c) => emit(c, M, inh));
      if (!n || typeof n !== "object" || !n.__ltt_vnode) return;
      const tag = n.tag;
      if (!CUSTOM_TAGS.has(tag)) return;
      const at = sanitize(n.attrs);
      const M2 = at.transform ? mul(M, parseTransform(at.transform)) : M;
      const style = { ...inh };
      for (const k of ["fill", "stroke", "stroke-width", "opacity"]) if (at[k] !== undefined) style[k] = at[k];
      if (tag === "g") return n.children.forEach((/** @type {any} */ c) => emit(c, M2, style));
      if (tag === "text" || tag === "tspan") {
        const s = n.children.filter((/** @type {any} */ c) => typeof c === "string").join("");
        if (s) {
          const p = apply(M2, [num(at.x), num(at.y)]);
          const anchor = at["text-anchor"] === "middle" ? "n" : at["text-anchor"] === "end" ? "nw" : "ne";
          this.B.text({ mark: "custom", markId: id, text: s, size: TEXT.figure.m, ref: p, anchor, color: INK, path, priority: 1 });
        }
        n.children.filter((/** @type {any} */ c) => typeof c === "object").forEach((/** @type {any} */ c) => emit(c, M2, style));
        return;
      }
      const cmds = shapeCmds(tag, at);
      if (!cmds) return;
      const pxCmds = mapCmds(cmds, (p) => apply(M2, p));
      const fill = style.fill ?? "#000000";
      const stroke = style.stroke;
      const sw = num(style["stroke-width"] ?? (stroke ? "1" : "0"));
      this.B.shape({ mark: "custom", markId: id, d: serialize(pxCmds), stroke: stroke ?? undefined, fill: tag === "line" || tag === "polyline" ? style.fill ?? "none" : fill, opacity: (style.opacity !== undefined ? num(style.opacity) : 1) * (o.opacity ?? 1), sw, clip: cl, bbox: cmdsBBox(pxCmds), panel: this.index });
    };
    emit(out, base, {});
  }
}

/** @param {Builder} B @param {Panel} P @param {any} fig */
async function graphUnion(B, P, fig) {
  const frame = fig.args[0];
  const draw = fig.args[1];
  const samples = samplesFor(frame, 24);
  if (!samples.some((s) => s.t === B.t && s.step === B.step)) samples.push({ t: B.t, step: B.step });
  /** @type {Map<string, { id: string; texts: string[]; at?: Pt; size: number; shape: string }>} */
  const nodes = new Map();
  /** @type {Map<string, { id: string; from: string; to: string; text: string }>} */
  const edges = new Map();
  for (const s of samples) {
    const marks = s.t === B.t && s.step === B.step ? P.marks : flattenMarks(draw(P.m, s.t, { step: s.step, params: { ...P.params } }));
    const visit = (/** @type {any[]} */ list) => {
      for (const d of list) {
        if (d.kind === "node") {
          const o = optsOf([d.args[2]]);
          const text = txt(d.args[1], P.m);
          const n = nodes.get(d.args[0]);
          if (n) {
            if (!n.texts.includes(text)) n.texts.push(text);
          } else nodes.set(d.args[0], { id: d.args[0], texts: [text], at: o.at, size: sizeOf(o), shape: o.shape ?? "box" });
        } else if (d.kind === "edge") {
          const o = optsOf([d.args[2]]);
          const id = d.id ?? `${d.args[0]}->${d.args[1]}`;
          const text = o.text !== undefined ? txt(o.text, P.m) : "";
          const e = edges.get(id);
          if (!e) edges.set(id, { id, from: d.args[0], to: d.args[1], text });
          else if (text.length > e.text.length) e.text = text;
        } else if (d.kind === "mock") visit(flattenMarks(d.args[2]));
      }
    };
    visit(marks);
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()].filter((e) => nodes.has(e.from) && nodes.has(e.to)) };
}

/** @param {{ nodes: any[]; edges: any[] }} u @param {number} wrap */
function sizeNodes(u, wrap) {
  const nodes = u.nodes.map((n) => {
    let best = { lines: /** @type {string[]} */ ([]), w: 0, h: 0 };
    for (const t of n.texts) {
      const lines = wrapText(t, { size: n.size, maxWidth: wrap });
      const b = linesBox(lines, n.size);
      if (b.width * b.height >= best.w * best.h) best = { lines, w: b.width, h: b.height };
    }
    let width = best.w + 2 * NODE_PAD.x;
    let height = best.h + 2 * NODE_PAD.y;
    if (n.shape === "circle") width = height = Math.max(width, height);
    return { ...n, lines: best.lines, width: Math.ceil(width), height: Math.ceil(height) };
  });
  const edges = u.edges.map((e) => {
    if (!e.text) return { ...e };
    const lines = wrapText(e.text, { size: TEXT.figure.s, maxWidth: 140 });
    const b = linesBox(lines, TEXT.figure.s);
    return { ...e, label: { width: Math.ceil(b.width) + 4, height: Math.ceil(b.height) + 2 } };
  });
  return { nodes, edges };
}

/** @type {WeakMap<object, Map<string, any>>} */
const elkCache = new WeakMap();
/** @param {any} input @param {string} key @param {any} g */
async function cachedElk(input, key, g) {
  let c = elkCache.get(input);
  if (!c) elkCache.set(input, (c = new Map()));
  const k = JSON.stringify([key, g.algorithm, g.direction, g.spacing, g.wrap, g.union.nodes.map((/** @type {any} */ n) => [n.id, n.width, n.height]), g.union.edges.map((/** @type {any} */ e) => [e.id, e.from, e.to, e.label])]);
  if (c.has(k)) return c.get(k);
  const r = await elkLayout({ algorithm: g.algorithm, direction: g.direction, spacing: g.spacing, nodes: g.union.nodes, edges: g.union.edges });
  if (c.size > 100) c.clear();
  c.set(k, r);
  return r;
}

/** @param {any} r @param {{ nodes: any[] }} sized */
function graphBBox(r, sized) {
  if (!sized.nodes.length) return { x: 0, y: 0, width: 0, height: 0 };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const n of sized.nodes) {
    const p = r.nodes.get(n.id);
    if (!p) continue;
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x + p.width);
    y1 = Math.max(y1, p.y + p.height);
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** @param {Box} a @param {Box} b @returns {Pt[]} */
function straightBetween(a, b) {
  const ca = /** @type {Pt} */ ([a.x + a.width / 2, a.y + a.height / 2]);
  const cb = /** @type {Pt} */ ([b.x + b.width / 2, b.y + b.height / 2]);
  return [exitPoint(a, ca, cb), exitPoint(b, cb, ca)];
}

/** Point where the ray from c toward t leaves box. @param {Box} box @param {Pt} c @param {Pt} t @returns {Pt} */
function exitPoint(box, c, t) {
  const dx = t[0] - c[0];
  const dy = t[1] - c[1];
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return c;
  const sx = dx !== 0 ? box.width / 2 / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? box.height / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy, 1);
  return [c[0] + dx * s, c[1] + dy * s];
}

/** @param {Pt[]} pts @returns {Pt} */
function midpoint(pts) {
  const cut = cutFraction([{ pts }], 0.5)[0];
  return cut[cut.length - 1] ?? pts[0] ?? [0, 0];
}

const f2 = (/** @type {number} */ v) => (Math.round(v * 100) / 100).toString();
/** @param {Pt} c @param {number} r */
const circleD = (c, r) => `M${f2(c[0] - r)},${f2(c[1])}a${f2(r)},${f2(r)} 0 1,0 ${f2(2 * r)},0a${f2(r)},${f2(r)} 0 1,0 ${f2(-2 * r)},0Z`;
/** @param {Box} b @param {number} r */
function roundRect(b, r) {
  const q = Math.max(0, Math.min(r, b.width / 2, b.height / 2));
  return `M${f2(b.x + q)},${f2(b.y)}H${f2(b.x + b.width - q)}Q${f2(b.x + b.width)},${f2(b.y)} ${f2(b.x + b.width)},${f2(b.y + q)}V${f2(b.y + b.height - q)}Q${f2(b.x + b.width)},${f2(b.y + b.height)} ${f2(b.x + b.width - q)},${f2(b.y + b.height)}H${f2(b.x + q)}Q${f2(b.x)},${f2(b.y + b.height)} ${f2(b.x)},${f2(b.y + b.height - q)}V${f2(b.y + q)}Q${f2(b.x)},${f2(b.y)} ${f2(b.x + q)},${f2(b.y)}Z`;
}
/** @param {Box} b @param {number} m */
const inflate = (b, m) => ({ x: b.x - m, y: b.y - m, width: b.width + 2 * m, height: b.height + 2 * m });
/** @param {Box} a @param {Box} b */
function intersect(a, b) {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  return { x, y, width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x), height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y) };
}
/** Compass anchor for a screen direction (y down). @param {number} dx @param {number} dy */
function dirOf(dx, dy) {
  const a = (Math.atan2(-dy, dx) * 180) / Math.PI;
  const dirs = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
  return dirs[((Math.round(a / 45) % 8) + 8) % 8];
}
/** @param {any} o @param {string} color @param {"none" | "soft" | "solid"} def */
function fillOf(o, color, def) {
  const f = o.fill ?? def;
  return f === "none" ? "none" : f === "solid" ? color : soft(color);
}
/** @param {string} label @param {string} unit */
const withUnit = (label, unit) => (/^[°%′″]/.test(unit) ? `${label}${unit}` : `${label} ${unit}`);
/** @param {any} d */
const hasMath = (d) => d.kind === "mock" && flattenMarks(d.args[2]).some((c) => c.kind === "math" || hasMath(c));

// ---------- custom ----------

export const CUSTOM_TAGS = new Set(["g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan"]);
export const CUSTOM_ATTRS = new Set(["fill", "stroke", "stroke-width", "opacity", "transform", "d", "points", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "text-anchor"]);

/** VNode factory handed to custom render functions. @param {string} tag @param {Record<string, any>} [attrs] @param {...any} children */
export function vnode(tag, attrs, ...children) {
  return { __ltt_vnode: true, tag: String(tag), attrs: attrs && typeof attrs === "object" ? { ...attrs } : {}, children: children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false).map((c) => (typeof c === "object" ? c : String(c))) };
}

/** Allowed attributes only; color values must be plain colors. @param {Record<string, any>} attrs */
export function sanitize(attrs) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (!CUSTOM_ATTRS.has(k)) continue;
    const s = String(v);
    if ((k === "fill" || k === "stroke") && !/^(none|currentColor|#[0-9a-fA-F]{3,8}|[a-zA-Z]+|rgba?\([\d\s.,%]+\))$/.test(s)) continue;
    if (/url\s*\(|javascript:|expression\s*\(/i.test(s)) continue;
    out[k] = s;
  }
  return out;
}

/** @param {any} v */
const num = (v) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/** @param {string} tag @param {Record<string, string>} a */
function shapeCmds(tag, a) {
  try {
    if (tag === "path") return a.d ? parseD(a.d) : null;
    if (tag === "rect") {
      const x = num(a.x);
      const y = num(a.y);
      const w = num(a.width);
      const h = num(a.height);
      return [{ c: "M", p: [x, y] }, { c: "L", p: [x + w, y] }, { c: "L", p: [x + w, y + h] }, { c: "L", p: [x, y + h] }, { c: "Z", p: [] }];
    }
    if (tag === "circle" || tag === "ellipse") {
      const cx = num(a.cx);
      const cy = num(a.cy);
      const rx = tag === "circle" ? num(a.r) : num(a.rx);
      const ry = tag === "circle" ? num(a.r) : num(a.ry);
      return parseD(`M${cx - rx},${cy}A${rx},${ry} 0 1,0 ${cx + rx},${cy}A${rx},${ry} 0 1,0 ${cx - rx},${cy}Z`);
    }
    if (tag === "line") return [{ c: "M", p: [num(a.x1), num(a.y1)] }, { c: "L", p: [num(a.x2), num(a.y2)] }];
    if (tag === "polyline" || tag === "polygon") {
      const v = (String(a.points ?? "").match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? []).map(Number);
      /** @type {any[]} */
      const cmds = [];
      for (let i = 0; i + 1 < v.length; i += 2) cmds.push({ c: i === 0 ? "M" : "L", p: [v[i], v[i + 1]] });
      if (tag === "polygon" && cmds.length) cmds.push({ c: "Z", p: [] });
      return cmds.length ? cmds : null;
    }
  } catch {
    return null;
  }
  return null;
}

export { IDENTITY };

/** Dimmed text: the same hue blended toward the background, contrast kept >= 4.5 and below the original. @param {string} c */
export function dimColor(c) {
  const base = contrast(c, BACKGROUND);
  const target = Math.max(4.55, Math.min(base - 0.01, 4.55 + (base - 4.55) * 0.35));
  if (base <= 4.51) return c;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (contrast(mix(c, BACKGROUND, mid), BACKGROUND) >= target) lo = mid;
    else hi = mid;
  }
  return mix(c, BACKGROUND, lo);
}

/** @param {number[]} dom @param {number} target */
function logTicks(dom, target) {
  const lo = Math.min(...dom);
  const hi = Math.max(...dom);
  if (!(lo > 0)) return [];
  const out = [];
  for (let e = Math.ceil(Math.log10(lo) - 1e-9); e <= Math.floor(Math.log10(hi) + 1e-9); e++) out.push(10 ** e);
  if (out.length < 2) for (const m of [2, 5]) for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
    const v = m * 10 ** e;
    if (v >= lo && v <= hi) out.push(v);
  }
  out.sort((a, b) => a - b);
  const k = Math.max(1, Math.ceil(out.length / Math.max(2, target)));
  return out.filter((_, i) => i % k === 0);
}

/** Tick label with the step's decimals; minus sign U+2212. @param {number} v @param {number} step */
function fmtTick(v, step) {
  let s;
  if (step > 0) {
    const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    s = v.toFixed(Math.min(dec, 12));
  } else s = Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-4 && v !== 0) ? v.toExponential().replace("e+", "e") : String(Number(v.toPrecision(6)));
  if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
  return s.replace(/^-/, "\u2212");
}
