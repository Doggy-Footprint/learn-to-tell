// @ts-check
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const DESCRIPTOR_MEMBERS = [
  "lesson", "model", "figure", "custom",
  "cartesian", "polar", "lanes", "graph", "cells", "space3d", "geo",
  "axis", "grid", "legend", "line", "area", "dot", "circle", "rect", "arc", "arrow", "path", "label", "dim", "angle", "brace",
  "node", "edge", "cell", "field", "glyph", "icon", "math", "code", "mock",
  "trace", "flow", "sweep", "inset", "split", "multiples",
];

/** @type {WeakSet<object>} */
const descriptors = new WeakSet();

/** @param {unknown} v @returns {v is Record<string, any>} */
const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

/** @param {string} kind @param {any[]} args */
function describe(kind, args) {
  /** @type {{ kind: string; args: any[]; id?: string }} */
  const d = { kind, args };
  let id;
  if (kind === "node") id = args[0];
  else if (kind === "edge") id = (isPlainObject(args[2]) ? args[2].id : undefined) ?? `${args[0]}->${args[1]}`;
  else {
    const last = [...args].reverse().find(isPlainObject);
    id = last?.id;
  }
  if (typeof id === "string") d.id = id;
  descriptors.add(d);
  return d;
}

/** @param {number} a @param {number} b @param {number} f */
const lerp = (a, b, f) => a + (b - a) * f;

/** @param {{ t: number; y: number[] }[]} points */
function makeSeries(points) {
  /** @param {number} t */
  const at = (t) => {
    if (t <= points[0].t) return points[0].y.slice();
    const last = points[points.length - 1];
    if (t >= last.t) return last.y.slice();
    let lo = 0;
    let hi = points.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (points[mid].t <= t) lo = mid;
      else hi = mid;
    }
    const a = points[lo];
    const b = points[hi];
    const f = (t - a.t) / (b.t - a.t);
    return a.y.map((v, i) => lerp(v, b.y[i], f));
  };
  /** @param {number} t */
  const until = (t) => {
    const out = points.filter((p) => p.t <= t);
    const tc = Math.min(Math.max(t, points[0].t), points[points.length - 1].t);
    if (out.length === 0 || out[out.length - 1].t !== tc) out.push({ t: tc, y: at(tc) });
    return out;
  };
  return {
    points,
    at,
    until,
    end: points[points.length - 1],
    /** @param {number} [i] @param {number} [j] @param {number} [upTo] @returns {[number, number][]} */
    xy: (i = 0, j = 1, upTo) => (upTo === undefined ? points : until(upTo)).map((p) => [p.y[i], p.y[j]]),
  };
}

/**
 * @param {(t: number, y: number[]) => number[]} f
 * @param {number[]} y0 @param {[number, number]} span @param {number} dt
 * @param {{ event?: (t: number, y: number[]) => number }} [o]
 */
export function ode(f, y0, span, dt, o = {}) {
  const [t0, t1] = span;
  if (!(dt > 0) || !(t1 > t0)) throw new RangeError("ode: need dt > 0 and span[1] > span[0]");
  /** @param {number[]} y @param {number[]} k @param {number} h */
  const add = (y, k, h) => y.map((v, i) => v + h * k[i]);
  let t = t0;
  let y = y0.slice();
  const points = [{ t, y }];
  let e = o.event?.(t, y);
  const n = Math.ceil((t1 - t0) / dt - 1e-9);
  for (let s = 0; s < n; s++) {
    const h = Math.min(dt, t1 - t);
    const k1 = f(t, y);
    const k2 = f(t + h / 2, add(y, k1, h / 2));
    const k3 = f(t + h / 2, add(y, k2, h / 2));
    const k4 = f(t + h, add(y, k3, h));
    const yn = y.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    const tn = s === n - 1 ? t1 : t + h;
    if (o.event && e !== undefined) {
      const en = o.event(tn, yn);
      if (e >= 0 && en < 0) {
        const fr = e / (e - en);
        points.push({ t: lerp(t, tn, fr), y: y.map((v, i) => lerp(v, yn[i], fr)) });
        return makeSeries(points);
      }
      e = en;
    }
    t = tn;
    y = yn;
    points.push({ t, y });
  }
  return makeSeries(points);
}

/** @param {number} seed */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {(x: number) => number} f @param {[number, number]} range @param {{ tol?: number }} [o] */
export function argmax(f, [lo, hi], o = {}) {
  const tol = o.tol ?? (hi - lo) * 1e-4;
  const g = (Math.sqrt(5) - 1) / 2;
  let a = lo;
  let b = hi;
  let c = b - g * (b - a);
  let d = a + g * (b - a);
  let fc = f(c);
  let fd = f(d);
  while (b - a > tol) {
    if (fc > fd) {
      b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c);
    } else {
      a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d);
    }
  }
  const x = (a + b) / 2;
  return { x, y: f(x) };
}

/** @param {(x: number) => number} f @param {[number, number]} range @param {{ tol?: number }} [o] */
export function root(f, [lo, hi], o = {}) {
  const tol = o.tol ?? (hi - lo) * 1e-12;
  let flo = f(lo);
  const fhi = f(hi);
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  if (Math.sign(flo) === Math.sign(fhi)) throw new RangeError("root: f(lo) and f(hi) have the same sign");
  for (let i = 0; i < 200 && hi - lo > tol; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (fm === 0) return mid;
    if (Math.sign(fm) === Math.sign(flo)) {
      lo = mid; flo = fm;
    } else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * @param {() => number} rand @param {number} n
 * @param {{ normal: [number, number] } | { uniform: [number, number] }} dist
 */
export function sample(rand, n, dist) {
  const out = [];
  if ("normal" in dist) {
    const [mu, sigma] = dist.normal;
    for (let i = 0; i < n; i++) {
      const u1 = 1 - rand();
      const u2 = rand();
      out.push(mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
    }
  } else {
    const [a, b] = dist.uniform;
    for (let i = 0; i < n; i++) out.push(a + (b - a) * rand());
  }
  return out;
}

/** @param {number[]} values @param {{ bins: number; range: [number, number] }} o */
export function histogram(values, { bins, range: [lo, hi] }) {
  if (!(bins >= 1) || !(hi > lo)) throw new RangeError("histogram: need bins >= 1 and range[1] > range[0]");
  const w = (hi - lo) / bins;
  const out = Array.from({ length: bins }, (_, i) => ({ x0: lo + i * w, x1: i === bins - 1 ? hi : lo + (i + 1) * w, count: 0 }));
  for (const v of values) {
    if (!(v >= lo && v <= hi)) continue;
    out[v === hi ? bins - 1 : Math.min(bins - 1, Math.floor((v - lo) / w))].count++;
  }
  return out;
}

/** @param {number[]} xs @param {number[]} ys @param {number} x */
export function interpolate(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  const n = xs.length - 1;
  if (x >= xs[n]) return ys[n];
  let i = 0;
  while (xs[i + 1] < x) i++;
  return lerp(ys[i], ys[i + 1], (x - xs[i]) / (xs[i + 1] - xs[i]));
}

const HELPERS = { ode, rng, argmax, root, sample, histogram, interpolate };

export function createApi() {
  /** @type {Map<string, number>} */
  const usage = new Map();
  /** @type {Record<string, Function>} */
  const api = {};
  /** @param {string} name @param {Function} fn */
  const wrap = (name, fn) => (/** @type {any[]} */ ...args) => {
    usage.set(name, (usage.get(name) ?? 0) + 1);
    return fn(...args);
  };
  for (const k of DESCRIPTOR_MEMBERS) api[k] = wrap(k, (/** @type {any[]} */ ...args) => describe(k, args));
  for (const [k, fn] of Object.entries(HELPERS)) api[k] = wrap(k, fn);
  return { api: /** @type {import("ltt").Api} */ (/** @type {unknown} */ (api)), usage };
}

/** @param {import("ltt").LessonFactory} factory */
export function load(factory) {
  const { api } = createApi();
  /** @type {any} */
  const spec = factory(api);
  if (!spec || spec.kind !== "lesson") throw new Error("factory did not return api.lesson(...)");
  /** @type {any} */
  const input = spec.args[0];
  /** @param {string} name @param {Record<string, unknown>} [params] */
  const run = (name, params = {}) => {
    const m = input.models?.[name];
    if (!m) throw new Error(`unknown model: ${name}`);
    return m.args[1]({ ...m.args[0], ...params });
  };
  return { input: /** @type {import("ltt").LessonInput} */ (input), run };
}

/** @param {unknown} v */
const isSeries = (v) => isPlainObject(v) && Array.isArray(v.points) && typeof v.at === "function";

/** @param {unknown} a @param {unknown} b @returns {boolean} */
function same(a, b) {
  if (isSeries(a) && isSeries(b)) return same(/** @type {any} */ (a).points, /** @type {any} */ (b).points);
  if (typeof a === "function" && typeof b === "function") return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return Object.is(a, b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => same(/** @type {any} */ (a)[k], /** @type {any} */ (b)[k]));
}

/** @param {number} actual @param {number} expected @param {number | undefined} tol @param {number | undefined} rel */
function near(actual, expected, tol, rel) {
  const d = Math.abs(actual - expected);
  const eps = 1e-12 * Math.max(1, Math.abs(expected));
  return (tol !== undefined && d <= tol + eps) || (rel !== undefined && d <= rel * Math.abs(expected) + eps);
}

/**
 * @param {unknown} actual @param {unknown} expected @param {number | undefined} tol @param {number | undefined} rel
 * @returns {boolean}
 */
function compare(actual, expected, tol, rel) {
  if (typeof expected === "number") {
    if (tol === undefined && rel === undefined) throw new Error("tol or rel required");
    return typeof actual === "number" && near(actual, expected, tol, rel);
  }
  if (typeof expected === "boolean") return actual === expected;
  if (Array.isArray(expected)) return typeof actual === "number" && actual >= expected[0] && actual <= expected[1];
  if (isPlainObject(expected) && typeof actual === "number") {
    const okLt = !("lt" in expected) || actual < expected.lt;
    const okGt = !("gt" in expected) || actual > expected.gt;
    return okLt && okGt;
  }
  throw new Error("unsupported expect");
}

/**
 * @param {any} input
 * @returns {{ index: number; id?: string; pass: boolean; actual?: unknown; expected: unknown; error?: string }[]}
 */
function evaluateChecks(input) {
  const models = input.models ?? {};
  return (input.checks ?? []).map((/** @type {any} */ c, /** @type {number} */ index) => {
    /** @type {{ index: number; id?: string; pass: boolean; actual?: unknown; expected: unknown; error?: string }} */
    const r = { index, pass: false, expected: c.expect };
    if (c.id !== undefined) r.id = c.id;
    try {
      const m = models[c.model];
      if (!m) throw new Error(`unknown model: ${c.model}`);
      const base = { ...m.args[0], ...c.at };
      const out = m.args[1](base);
      if (c.value) {
        r.actual = c.value(out, (/** @type {object} */ at) => m.args[1]({ ...base, ...at }));
        r.pass = compare(r.actual, c.expect, c.tol, c.rel);
      } else if (isPlainObject(c.expect) && !(typeof out === "number")) {
        /** @type {Record<string, unknown>} */
        const picked = {};
        let pass = true;
        for (const [k, e] of Object.entries(c.expect)) {
          picked[k] = out?.[k];
          if (!compare(picked[k], e, c.tol, c.rel)) pass = false;
        }
        r.actual = picked;
        r.pass = pass;
      } else {
        r.actual = out;
        r.pass = compare(out, c.expect, c.tol, c.rel);
      }
    } catch (err) {
      r.pass = false;
      r.error = err instanceof Error ? err.message : String(err);
    }
    return r;
  });
}

/** @param {unknown} v @param {Set<unknown>} seen @returns {boolean} */
function hasBadNumber(v, seen = new Set()) {
  if (typeof v === "number") return !Number.isFinite(v);
  if (typeof v !== "object" || v === null || seen.has(v)) return false;
  seen.add(v);
  return Object.values(v).some((x) => hasBadNumber(x, seen));
}

/** @param {unknown} tree @param {(d: any) => void} visit @param {Set<unknown>} seen */
function walkDescriptors(tree, visit, seen = new Set()) {
  if (typeof tree !== "object" || tree === null || seen.has(tree)) return;
  seen.add(tree);
  if (descriptors.has(tree)) visit(tree);
  for (const x of Object.values(tree)) walkDescriptors(x, visit, seen);
}

/** @param {any} frame @param {number} S */
function samplesFor(frame, S) {
  const o = frame?.args?.[0] ?? {};
  if (o.loop) {
    const [a, b] = o.loop.span;
    return Array.from({ length: S + 1 }, (_, k) => ({ t: a + ((b - a) * k) / S, step: 0 }));
  }
  if (o.steps) return o.steps.map((/** @type {string} */ _, /** @type {number} */ i) => ({ t: i, step: i }));
  if (o.idle) return Array.from({ length: S }, (_, k) => ({ t: k / S, step: 0 }));
  return [{ t: 0, step: 0 }];
}

/**
 * @param {any} input @param {Record<string, unknown>} outputs @param {Record<string, unknown>} params @param {number} S
 */
function sampleFigures(input, outputs, params, S) {
  /** @type {{ figure: string; t: number; step: number; message: string }[]} */
  const figureErrors = [];
  /** @type {Map<string, Set<string>>} */
  const ownIds = new Map();
  const figures = input.figures ?? {};
  for (const [name, /** @type {any} */ fig] of Object.entries(figures)) {
    const ids = new Set();
    ownIds.set(name, ids);
    if (fig?.kind !== "figure") continue;
    const [frame, draw] = fig.args;
    for (const { t, step } of samplesFor(frame, S)) {
      try {
        const tree = draw(outputs, t, { step, params: { ...params } });
        let bad = false;
        walkDescriptors(tree, (d) => {
          if (d.id !== undefined) ids.add(d.id);
          if (hasBadNumber(d.args)) bad = true;
        });
        if (bad) figureErrors.push({ figure: name, t, step, message: "NaN or Infinity in mark arguments" });
      } catch (err) {
        figureErrors.push({ figure: name, t, step, message: err instanceof Error ? err.message : String(err) });
      }
    }
  }
  /** @param {string} name @param {Set<string>} [stack] @returns {Set<string>} */
  const idsOf = (name, stack = new Set()) => {
    /** @type {any} */
    const fig = figures[name];
    if (!fig || stack.has(name)) return new Set();
    stack.add(name);
    if (fig.kind === "split") return new Set(fig.args[0].flatMap((/** @type {string} */ k) => [...idsOf(k, stack)]));
    if (fig.kind === "multiples") return idsOf(fig.args[0], stack);
    return /** @type {Set<string>} */ (ownIds.get(name));
  };

  return { figureErrors, idsOf };
}

/**
 * @param {any} input @param {{ samples?: number }} [o]
 * @returns {{ section: number; scene: number; id: string; message: string }[]}
 */
export function bindingErrors(input, o = {}) {
  /** @type {Record<string, unknown>} */
  const outputs = {};
  /** @type {Record<string, unknown>} */
  const params = {};
  for (const [model, /** @type {any} */ m] of Object.entries(input.models ?? {})) {
    Object.assign(params, m.args[0]);
    try {
      outputs[model] = m.args[1]({ ...m.args[0] });
    } catch {
      // a throwing model is reported by evaluate; binding only needs params
    }
  }
  const { idsOf } = sampleFigures(input, outputs, params, o.samples ?? 5);
  return bindings(input, params, idsOf);
}

/**
 * @param {import("ltt").LessonFactory} factory
 * @param {{ samples?: number }} [o]
 */
export function evaluate(factory, o = {}) {
  const S = o.samples ?? 5;
  const { input: raw } = load(factory);
  /** @type {any} */
  const input = raw;
  const models = input.models ?? {};
  const checks = evaluateChecks(input);

  /** @type {Record<string, unknown>} */
  const outputs = {};
  /** @type {Record<string, unknown>} */
  const params = {};
  const deterministic = Object.entries(models).map(([model, /** @type {any} */ m]) => {
    Object.assign(params, m.args[0]);
    try {
      const a = m.args[1]({ ...m.args[0] });
      const b = m.args[1]({ ...m.args[0] });
      outputs[model] = a;
      return { model, ok: same(a, b) };
    } catch {
      return { model, ok: false };
    }
  });

  const { figureErrors, idsOf } = sampleFigures(input, outputs, params, S);
  /** @type {{ section: number; scene: number; step?: number; id: string }[]} */
  const focusErrors = [];
  (input.sections ?? []).forEach((/** @type {any} */ sec, /** @type {number} */ section) => {
    (sec.scenes ?? []).forEach((/** @type {any} */ sc, /** @type {number} */ scene) => {
      const ids = sc.figure === undefined ? new Set() : idsOf(sc.figure);
      /** @param {string[]} focus @param {number} [step] */
      const test = (focus, step) => {
        for (const id of focus ?? []) {
          if (!ids.has(id)) focusErrors.push(step === undefined ? { section, scene, id } : { section, scene, step, id });
        }
      };
      if (sc.type === "steps") (sc.steps ?? []).forEach((/** @type {any} */ s, /** @type {number} */ i) => test(s.focus, i));
      else test(sc.focus);
    });
  });

  const bindingErrs = bindings(input, params, idsOf);
  const ok =
    checks.every((c) => c.pass) && deterministic.every((d) => d.ok) && figureErrors.length === 0 && focusErrors.length === 0 && bindingErrs.length === 0;
  return { ok, checks, deterministic, figureErrors, focusErrors, bindingErrors: bindingErrs };
}

/** @param {any} input @param {Record<string, unknown>} defaults */
function declaredParams(input, defaults) {
  const keys = new Set(Object.keys(defaults));
  /** @param {any} p */
  const add = (p) => {
    if (isPlainObject(p)) for (const k of Object.keys(p)) keys.add(k);
  };
  /** @param {any} o */
  const option = (o) => add(o?.params);
  /** @param {any} items */
  const quiz = (items) => {
    for (const q of items ?? []) {
      add(q?.params);
      add(q?.reveal?.params);
      (q?.options ?? []).forEach(option);
    }
  };
  for (const sec of input.sections ?? []) {
    for (const sc of sec.scenes ?? []) {
      add(sc.params);
      if (sc.type === "predict") {
        add(sc.reveal?.params);
        (sc.input?.options ?? []).forEach(option);
      }
      if (sc.type === "compare") {
        add(sc.a);
        add(sc.b);
      }
      if (sc.type === "quiz") quiz(sc.items);
    }
  }
  quiz(input.quiz);
  return keys;
}

/**
 * @param {any} input @param {Record<string, unknown>} params @param {(name: string) => Set<string>} idsOf
 * @returns {{ section: number; scene: number; id: string; message: string }[]}
 */
function bindings(input, params, idsOf) {
  /** @type {{ section: number; scene: number; id: string; message: string }[]} */
  const out = [];
  const figures = input.figures ?? {};
  /** @param {number} section @param {number} scene @param {string} id @param {string} message */
  const err = (section, scene, id, message) => out.push({ section, scene, id, message });
  const declared = declaredParams(input, params);
  /** @param {number} section @param {number} scene @param {string} key */
  const param = (section, scene, key) => {
    if (!declared.has(key)) err(section, scene, key, `not a declared param: ${key}`);
  };
  /** @param {number} section @param {number} scene @param {unknown} key @param {string} what */
  const fig = (section, scene, key, what) => {
    if (typeof key === "string" && !(key in figures)) err(section, scene, key, `${what} is not a figure: ${key}`);
  };
  for (const [name, /** @type {any} */ f] of Object.entries(figures)) {
    if (f?.kind === "multiples") for (const k of Object.keys(f.args[1]?.over ?? {})) param(-1, -1, k);
    const link = f?.kind === "split" ? f.args[1]?.link : undefined;
    if (typeof link === "string" && !declared.has(link) && !idsOf(name).has(link)) err(-1, -1, link, `split link is neither a mark id nor a declared param: ${link}`);
  }
  /** @param {any[]} items @param {number} section @param {number} scene */
  const quizReveals = (items, section, scene) => {
    for (const q of items ?? []) fig(section, scene, q?.reveal?.figure, "quiz reveal.figure");
  };
  (input.sections ?? []).forEach((/** @type {any} */ sec, /** @type {number} */ i) => {
    (sec.scenes ?? []).forEach((/** @type {any} */ sc, /** @type {number} */ j) => {
      if (sc.type === "explore") {
        const ids = sc.figure in figures ? idsOf(sc.figure) : new Set();
        for (const h of sc.handles ?? []) {
          if (!ids.has(h.mark)) err(i, j, h.mark, `handle mark not in figure ${sc.figure}: ${h.mark}`);
          for (const k of [h.x, h.y]) if (k !== undefined) param(i, j, k);
        }
        for (const k of Object.keys(sc.knobs ?? {})) param(i, j, k);
      }
      if (sc.type === "predict") fig(i, j, sc.reveal?.figure, "predict reveal.figure");
      if (sc.type === "quiz") quizReveals(sc.items, i, j);
    });
  });
  quizReveals(input.quiz, -1, -1);
  for (const k of input.summary?.figures ?? []) fig(-1, -1, k, "summary figure");
  return out;
}

async function main() {
  const file = process.argv[2];
  if (!file || !existsSync(file)) {
    process.stderr.write(`spec-stub: file not found: ${file ?? "(none)"}\n`);
    return 2;
  }
  let report;
  try {
    const mod = await import(pathToFileURL(resolve(file)).href);
    if (typeof mod.default !== "function") {
      process.stderr.write(`spec-stub: default export of ${file} is not a function\n`);
      return 2;
    }
    report = evaluate(mod.default);
  } catch (err) {
    process.stderr.write(`spec-stub: cannot load ${file}: ${err instanceof Error ? err.message : String(err)}\n`);
    return 2;
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
