import { load, evaluate, rng } from "../core/model.mjs";
import { isDescriptor, isPlainObject, samplesFor, walkDescriptors, declaredParams, hasBadNumber } from "../core/model.mjs";
import { layoutFigure, resolveParams, outputsFor, leavesOf, flattenMarks } from "../layout/figure.mjs";
import { stageBox, stageBoxes, summaryBoxes } from "../layout/constants.mjs";
import { REGIONS } from "../layout/geo.mjs";

export const RULES = [
  "load-error",
  "check-fail",
  "model-pure",
  "figure-eval",
  "focus-unknown-id",
  "binding",
  "data-in-domain",
  "goal-reachable",
  "goal-at-start",
  "reveal-marks-exist",
  "input-binding",
  "term-defined-before-use",
  "accent-focus-only",
  "unimplemented",
  "unknown-region",
  "text-no-room",
  "graph-too-large",
];

const LAYOUT_RULES = new Set(["unimplemented", "unknown-region", "text-no-room", "graph-too-large"]);
const MAX_MESSAGE = 300;
const GOAL_LIMIT = 4096;

/** @param {unknown} v */
const show = (v) => {
  if (typeof v === "function") return "(function)";
  if (typeof v === "number") return Number.isFinite(v) ? String(Math.round(v * 1e6) / 1e6) : String(v);
  try {
    const s = JSON.stringify(v, (_, x) => (typeof x === "number" && Number.isFinite(x) ? Math.round(x * 1e6) / 1e6 : x));
    return s === undefined ? String(v) : s.length > 80 ? `${s.slice(0, 77)}...` : s;
  } catch {
    return String(v);
  }
};
/** @param {any} v @param {any} m */
const txt = (v, m) => {
  try {
    return typeof v === "function" ? String(v(m)) : v === undefined || v === null ? "" : String(v);
  } catch {
    return "";
  }
};
/** @param {any[]} args */
const optsOf = (args) => [...args].reverse().find((a) => isPlainObject(a) && !isDescriptor(a)) ?? {};
/** @param {unknown} e */
const msgOf = (e) => (e instanceof Error ? e.message : String(e));

/**
 * @param {import("ltt").LessonFactory} factory
 * @param {{ file?: string; viewports?: ("desktop" | "mobile")[]; samples?: number }} [o]
 */
export async function checkLesson(factory, o = {}) {
  const viewports = o.viewports ?? ["desktop", "mobile"];
  const S = o.samples ?? 5;
  /** @type {{ layer: "check" | "layout"; rule: string; path: string; message: string; viewport?: "desktop" | "mobile" }[]} */
  const errors = [];
  const seen = new Set();
  /** @param {string} rule @param {string} path @param {string} message @param {"desktop" | "mobile"} [viewport] */
  const add = (rule, path, message, viewport) => {
    const key = `${rule}\u0000${path}\u0000${viewport ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    /** @type {any} */
    const e = { layer: LAYOUT_RULES.has(rule) ? "layout" : "check", rule, path, message: message.length > MAX_MESSAGE ? `${message.slice(0, MAX_MESSAGE - 3)}...` : message };
    if (viewport) e.viewport = viewport;
    errors.push(e);
  };

  /** @type {any} */
  let input;
  try {
    input = load(factory).input;
  } catch (e) {
    add("load-error", "lesson", `expected the default export to return api.lesson(...); got: ${msgOf(e)}`);
    return { ok: false, errors };
  }
  /** @param {string} rule @param {() => unknown} fn */
  const guard = async (rule, fn) => {
    try {
      await fn();
    } catch (e) {
      add(rule, "lesson", `rule could not run: ${msgOf(e)}`);
    }
  };

  const L = new Lesson(input, S);

  await guard("check-fail", () => {
    const rep = evaluate(factory, { samples: S });
    for (const c of rep.checks) {
      if (c.pass) continue;
      const chk = input.checks[c.index];
      const name = c.id !== undefined ? `"${c.id}"` : `#${c.index}`;
      const tol = chk?.tol !== undefined ? ` tol ${chk.tol}` : chk?.rel !== undefined ? ` rel ${chk.rel}` : "";
      add("check-fail", `checks[${c.index}]`, c.error ? `check ${name} on model ${chk?.model} threw: ${c.error}` : `check ${name} on model ${chk?.model}: expected ${show(c.expected)}${tol}, actual ${show(c.actual)}`);
    }
    for (const d of rep.deterministic) if (!d.ok) add("model-pure", `models.${d.model}`, `model ${d.model} returned different outputs (or threw) for the same params; expected a pure deterministic fn`);
    for (const f of rep.focusErrors) {
      const sc = input.sections[f.section].scenes[f.scene];
      const list = f.step === undefined ? sc.focus : sc.steps[f.step].focus;
      const k = list.indexOf(f.id);
      const base = `sections[${f.section}].scenes[${f.scene}]${f.step === undefined ? "" : `.steps[${f.step}]`}.focus[${k}]`;
      add("focus-unknown-id", base, `focus id "${f.id}" is not a mark id drawn by figure ${show(sc.figure)}`);
    }
  });

  await guard("figure-eval", () => L.figureEval(add));
  await guard("binding", () => L.binding(add));
  await guard("data-in-domain", () => L.dataInDomain(add));
  await guard("goal-reachable", () => L.goals(add));
  await guard("reveal-marks-exist", () => L.revealMarks(add));
  await guard("input-binding", () => L.inputBinding(add));
  await guard("term-defined-before-use", () => L.terms(add));
  await guard("accent-focus-only", () => L.accent(add));
  await guard("text-no-room", () => L.layout(add, viewports));

  return { ok: errors.length === 0, errors };
}

class Lesson {
  /** @param {any} input @param {number} S */
  constructor(input, S) {
    this.input = input;
    this.S = S;
    this.defaults = resolveParams(input, {});
    /** @type {{ path: string; sc: any; i: number; j: number }[]} */
    this.scenes = [];
    (input.sections ?? []).forEach((/** @type {any} */ sec, /** @type {number} */ i) =>
      (sec?.scenes ?? []).forEach((/** @type {any} */ sc, /** @type {number} */ j) => this.scenes.push({ path: `sections[${i}].scenes[${j}]`, sc, i, j })),
    );
  }

  /** @param {string} key */
  isFigure(key) {
    return typeof key === "string" && isDescriptor(this.input.figures?.[key]);
  }

  /** @param {Record<string, any>} [p] */
  params(p) {
    return resolveParams(this.input, p ?? {});
  }

  /**
   * Draw outputs of every leaf of a figure at params over time samples.
   * @param {string} key @param {Record<string, any>} params
   * @param {(leaf: any, marks: any[], s: { t: number; step: number }, m: any) => void} visit
   */
  sampleDraw(key, params, visit, steps = /** @type {number[] | null} */ (null)) {
    for (const leaf of leavesOf(this.input, key, params)) {
      if (leaf.fig.kind !== "figure") continue;
      const [frame, draw] = leaf.fig.args;
      const m = outputsFor(this.input, leaf.params);
      let samples = samplesFor(frame, this.S);
      if (steps) samples = samples.filter((s) => steps.includes(s.step));
      for (const s of samples) visit(leaf, flattenMarks(draw(m, s.t, { step: s.step, params: { ...leaf.params } })), s, m);
    }
  }

  /** @param {string} key @param {Record<string, any>[]} paramSets */
  idsOf(key, paramSets) {
    const ids = new Set();
    for (const p of paramSets) {
      try {
        this.sampleDraw(key, p, (_l, marks) => walkDescriptors(marks, (d) => d.id !== undefined && ids.add(d.id)));
      } catch {
        // draw failures are figure-eval errors
      }
    }
    return ids;
  }

  /** Param sets a scene can show: start, knob ends, options, reveal, compare a/b. @param {any} sc */
  sceneParamSets(sc) {
    const base = sc.params ?? {};
    /** @type {Record<string, any>[]} */
    const sets = [base];
    if (sc.type === "explore") {
      const start = { ...this.defaults, ...base };
      for (const [k, spec] of Object.entries(sc.knobs ?? {})) {
        const vals = knobValues(spec, 2, start[k]);
        for (const v of [vals[0], vals[vals.length - 1]]) sets.push({ ...base, [k]: v });
      }
    }
    if (sc.type === "predict") {
      for (const op of sc.input?.options ?? []) if (op?.params) sets.push({ ...base, ...op.params });
      if (sc.reveal?.params) sets.push({ ...base, ...sc.reveal.params });
    }
    if (sc.type === "compare") {
      sets.push({ ...base, ...(sc.a ?? {}) }, { ...base, ...(sc.b ?? {}) });
    }
    return sets.map((p) => this.params(p));
  }

  /** @param {any} q */
  itemParamSets(q) {
    const base = q.params ?? {};
    const sets = [base];
    for (const op of q.options ?? []) if (op?.params) sets.push({ ...base, ...op.params });
    if (q.reveal?.params) sets.push({ ...base, ...q.reveal.params });
    return sets.map((p) => this.params(p));
  }

  /** Every (path, figure key, param sets, focus) the lesson renders. */
  views() {
    /** @type {{ path: string; key: string; sets: Record<string, any>[]; focus: string[] | null; focusPath: string; sc?: any; kind: string; steps?: number[]; half?: boolean }[]} */
    const out = [];
    for (const { path, sc } of this.scenes) {
      if (sc.type === "quiz") {
        (sc.items ?? []).forEach((/** @type {any} */ q, /** @type {number} */ k) => this.itemViews(q, `${path}.items[${k}]`, out));
        continue;
      }
      if (this.isFigure(sc.figure)) {
        if (sc.type === "steps") {
          (sc.steps ?? []).forEach((/** @type {any} */ st, /** @type {number} */ s) =>
            out.push({ path, key: sc.figure, sets: [this.params({})], focus: st.focus ?? [], focusPath: `${path}.steps[${s}]`, sc, kind: "steps", steps: [s] }),
          );
        } else out.push({ path, key: sc.figure, sets: this.sceneParamSets(sc), focus: sc.focus ?? [], focusPath: path, sc, kind: sc.type });
      }
      if (sc.type === "predict" && this.isFigure(sc.reveal?.figure)) {
        out.push({ path: `${path}.reveal`, key: sc.reveal.figure, sets: [this.params({ ...(sc.params ?? {}), ...(sc.reveal.params ?? {}) })], focus: null, focusPath: `${path}.reveal.figure`, kind: "reveal", half: this.isFigure(sc.figure) });
      }
    }
    (this.input.quiz ?? []).forEach((/** @type {any} */ q, /** @type {number} */ k) => this.itemViews(q, `quiz[${k}]`, out));
    (this.input.summary?.figures ?? []).forEach((/** @type {string} */ key, /** @type {number} */ k) => {
      if (this.isFigure(key)) out.push({ path: `summary.figures[${k}]`, key, sets: [this.params({})], focus: null, focusPath: `summary.figures[${k}]`, kind: "summary" });
    });
    return out;
  }

  /** @param {any} q @param {string} path @param {any[]} out */
  itemViews(q, path, out) {
    if (this.isFigure(q?.figure)) out.push({ path, key: q.figure, sets: this.itemParamSets(q), focus: null, focusPath: path, kind: "item" });
    if (this.isFigure(q?.reveal?.figure)) out.push({ path: `${path}.reveal`, key: q.reveal.figure, sets: [this.params({ ...(q.params ?? {}), ...(q.reveal.params ?? {}) })], focus: null, focusPath: `${path}.reveal.figure`, kind: "reveal", half: this.isFigure(q?.figure) });
  }

  /** @param {Function} add */
  figureEval(add) {
    for (const [key, fig] of Object.entries(this.input.figures ?? {})) {
      if (/** @type {any} */ (fig)?.kind !== "figure") continue;
      const [frame, draw] = /** @type {any} */ (fig).args;
      const m = outputsFor(this.input, this.defaults);
      for (const s of samplesFor(frame, this.S)) {
        const at = `@t=${fmtT(s.t)},step=${s.step}`;
        try {
          const marks = flattenMarks(draw(m, s.t, { step: s.step, params: { ...this.defaults } }));
          const bad = marks.findIndex((d) => hasBadNumber(d.args));
          if (bad >= 0) add("figure-eval", `figures.${key}${at}`, `mark ${marks[bad].kind} (${marks[bad].id ?? `#${bad}`}) has NaN or Infinity in its arguments; expected finite numbers`);
        } catch (e) {
          add("figure-eval", `figures.${key}${at}`, `figure draw threw: ${msgOf(e)}`);
        }
      }
    }
  }

  /** @param {Function} add */
  binding(add) {
    const input = this.input;
    const figures = input.figures ?? {};
    const declared = declaredParams(input, this.defaults);
    for (const [name, f] of Object.entries(figures)) {
      const fd = /** @type {any} */ (f);
      if (fd?.kind === "multiples") for (const k of Object.keys(fd.args[1]?.over ?? {})) if (!declared.has(k)) add("binding", `figures.${name}.over.${k}`, `multiples over key "${k}" is not a declared param; expected a model default or a scene/item/option/reveal/compare param`);
      const link = fd?.kind === "split" ? fd.args[1]?.link : undefined;
      if (typeof link === "string" && !declared.has(link) && !this.idsOf(name, [this.defaults]).has(link)) add("binding", `figures.${name}.link`, `split link "${link}" is neither a mark id in either figure nor a declared param`);
    }
    /** @param {any} key @param {string} path @param {string} what */
    const fig = (key, path, what) => {
      if (typeof key === "string" && !(key in figures)) add("binding", path, `${what} "${key}" is not a key of figures`);
    };
    /** @param {any[]} items @param {string} base */
    const quiz = (items, base) => (items ?? []).forEach((q, k) => fig(q?.reveal?.figure, `${base}[${k}].reveal.figure`, "quiz reveal.figure"));
    for (const { path, sc } of this.scenes) {
      if (sc.type === "explore") {
        const ids = this.isFigure(sc.figure) ? this.idsOf(sc.figure, [this.defaults]) : new Set();
        (sc.handles ?? []).forEach((/** @type {any} */ h, /** @type {number} */ k) => {
          if (!ids.has(h.mark)) add("binding", `${path}.handles[${k}].mark`, `handle mark "${h.mark}" is not a mark id drawn by figure ${show(sc.figure)}`);
          for (const ax of ["x", "y"]) if (h[ax] !== undefined && !declared.has(h[ax])) add("binding", `${path}.handles[${k}].${ax}`, `handle ${ax} "${h[ax]}" is not a declared param`);
        });
        for (const k of Object.keys(sc.knobs ?? {})) if (!declared.has(k)) add("binding", `${path}.knobs.${k}`, `knob "${k}" is not a declared param; expected a model default or a view param`);
      }
      if (sc.type === "predict") fig(sc.reveal?.figure, `${path}.reveal.figure`, "predict reveal.figure");
      if (sc.type === "quiz") quiz(sc.items, `${path}.items`);
    }
    quiz(input.quiz, "quiz");
    (input.summary?.figures ?? []).forEach((/** @type {any} */ k, /** @type {number} */ i) => fig(k, `summary.figures[${i}]`, "summary figure"));
  }

  /** @param {Function} add */
  dataInDomain(add) {
    const done = new Set();
    for (const v of this.views()) {
      for (const p of v.sets) {
        const sig = `${v.key}|${JSON.stringify(p)}|${v.steps ?? ""}`;
        if (done.has(sig)) continue;
        done.add(sig);
        try {
          this.sampleDraw(
            v.key,
            p,
            (leaf, marks, s, m) => {
              const dom = domainOf(leaf.fig.args[0], m, s.t);
              if (!dom) return;
              const visit = (/** @type {any[]} */ list, /** @type {string} */ prefix) =>
                list.forEach((d, i) => {
                  const idx = prefix ? `${prefix}.${i}` : String(i);
                  const path = `figures.${leaf.key}#${d.id ?? idx}`;
                  for (const pt of pointsOf(d)) {
                    const why = outside(pt, dom);
                    if (why) {
                      add("data-in-domain", path, `${d.kind} point ${show(pt)} is outside the frame ${why} (t=${fmtT(s.t)}, params ${show(diffParams(leaf.params, this.defaults))})`);
                      break;
                    }
                  }
                  if (d.kind === "mock") visit(flattenMarks(d.args[2]), d.id ?? idx);
                });
              visit(marks, "");
            },
            v.steps ?? null,
          );
        } catch {
          // reported by figure-eval or layout
        }
      }
    }
  }

  /** @param {Function} add */
  goals(add) {
    for (const { path, sc } of this.scenes) {
      if (sc.type !== "explore" || typeof sc.goal?.done !== "function") continue;
      const start = this.params(sc.params ?? {});
      const done = (/** @type {Record<string, any>} */ p) => {
        try {
          return !!sc.goal.done(outputsFor(this.input, p));
        } catch {
          return false;
        }
      };
      if (done(start)) add("goal-at-start", `${path}.goal`, `goal.done is already true at the scene start params ${show(diffParams(start, this.defaults))}; expected false so the learner has something to do`);
      const knobs = Object.entries(sc.knobs ?? {}).map(([k, spec]) => ({ k, vals: knobValues(spec, 10, start[k]) }));
      if (!knobs.length) {
        add("goal-reachable", `${path}.goal`, "goal.done is never true: the scene has no knobs to explore");
        continue;
      }
      const total = knobs.reduce((n, x) => n * x.vals.length, 1);
      let reached = false;
      /** @param {Record<string, any>} combo */
      const test = (combo) => {
        if (!reached && done({ ...start, ...combo })) reached = true;
      };
      if (total <= GOAL_LIMIT) {
        /** @param {number} i @param {Record<string, any>} acc */
        const rec = (i, acc) => {
          if (reached) return;
          if (i === knobs.length) return test(acc);
          for (const v of knobs[i].vals) rec(i + 1, { ...acc, [knobs[i].k]: v });
        };
        rec(0, {});
      } else {
        const corners = (/** @type {number} */ i, /** @type {Record<string, any>} */ acc) => {
          if (reached) return;
          if (i === knobs.length) return test(acc);
          const vs = knobs[i].vals;
          for (const v of new Set([vs[0], vs[vs.length - 1]])) corners(i + 1, { ...acc, [knobs[i].k]: v });
        };
        corners(0, {});
        const r = rng(1);
        for (let n = 0; n < GOAL_LIMIT && !reached; n++) {
          /** @type {Record<string, any>} */
          const combo = {};
          for (const x of knobs) combo[x.k] = x.vals[Math.min(x.vals.length - 1, Math.floor(r() * x.vals.length))];
          test(combo);
        }
      }
      if (!reached) add("goal-reachable", `${path}.goal`, `goal.done was never true over ${Math.min(total, GOAL_LIMIT)} knob settings (${knobs.map((x) => `${x.k} ${show(x.vals[0])}..${show(x.vals[x.vals.length - 1])}`).join(", ")}); expected reachable within knob ranges`);
    }
  }

  /** @param {Function} add */
  revealMarks(add) {
    for (const { path, sc } of this.scenes) {
      if (sc.type === "predict") {
        const keys = [sc.figure, sc.reveal?.figure].filter((k) => this.isFigure(k));
        const sets = this.sceneParamSets(sc);
        this.checkMarks(add, sc.reveal?.marks, `${path}.reveal.marks`, keys, sets);
      }
      if (sc.type === "quiz") (sc.items ?? []).forEach((/** @type {any} */ q, /** @type {number} */ k) => this.itemMarks(add, q, `${path}.items[${k}]`));
    }
    (this.input.quiz ?? []).forEach((/** @type {any} */ q, /** @type {number} */ k) => this.itemMarks(add, q, `quiz[${k}]`));
  }

  /** @param {Function} add @param {any} q @param {string} path */
  itemMarks(add, q, path) {
    const keys = [q?.figure, q?.reveal?.figure].filter((k) => this.isFigure(k));
    this.checkMarks(add, q?.reveal?.marks, `${path}.reveal.marks`, keys, this.itemParamSets(q ?? {}));
  }

  /** @param {Function} add @param {any} marks @param {string} path @param {string[]} keys @param {Record<string, any>[]} sets */
  checkMarks(add, marks, path, keys, sets) {
    if (!Array.isArray(marks) || !marks.length) return;
    const ids = new Set();
    for (const k of keys) for (const id of this.idsOf(k, sets)) ids.add(id);
    marks.forEach((id, k) => {
      if (!ids.has(id)) add("reveal-marks-exist", `${path}[${k}]`, `reveal mark "${id}" is never drawn by ${keys.length ? keys.map((x) => `figures.${x}`).join(" or ") : "any figure"} in any sample`);
    });
  }

  /** @param {Function} add */
  inputBinding(add) {
    for (const { path, sc } of this.scenes) {
      if (sc.type !== "predict") continue;
      const inp = sc.input ?? {};
      if (inp.kind !== "drag" && inp.kind !== "draw") continue;
      const ids = this.isFigure(sc.figure) ? this.idsOf(sc.figure, this.sceneParamSets(sc)) : new Set();
      if (inp.kind === "drag" && !ids.has(inp.mark)) add("input-binding", `${path}.input.mark`, `drag mark "${inp.mark}" is not a mark id drawn by figure ${show(sc.figure)}`);
      if (inp.kind === "draw" && !ids.has(inp.answer)) add("input-binding", `${path}.input.answer`, `draw answer "${inp.answer}" is not a mark id drawn by figure ${show(sc.figure)}`);
    }
  }

  /** @param {Function} add */
  terms(add) {
    /** @type {{ path: string; text: string }[][]} */
    const texts = this.scenes.map(({ path, sc }) => sceneTexts(sc, path, outputsFor(this.input, this.params(sc.params ?? {}))));
    this.scenes.forEach(({ path, sc }, g) => {
      if (sc.type !== "define" || typeof sc.term !== "string" || !sc.term) return;
      for (let h = 0; h < g; h++) {
        for (const t of texts[h]) if (t.text.includes(sc.term)) add("term-defined-before-use", t.path, `term "${sc.term}" appears here before its define scene ${path}; expected first use at or after the define scene`);
      }
    });
  }

  /** @param {Function} add */
  accent(add) {
    for (const v of this.views()) {
      /** @type {Set<string>} */
      const offenders = new Set();
      for (const p of v.sets) {
        try {
          this.sampleDraw(
            v.key,
            p,
            (_leaf, marks) =>
              walkDescriptors(marks, (d) => {
                const o = optsOf(d.kind === "node" || d.kind === "edge" ? [d.args[2]] : d.args.slice(1));
                if (o.tone !== "focus") return;
                if (!v.focus || d.id === undefined || !v.focus.includes(d.id)) offenders.add(d.id ?? `(${d.kind} without id)`);
              }),
            v.steps ?? null,
          );
        } catch {
          // reported elsewhere
        }
      }
      if (offenders.size) {
        const ids = [...offenders].map((x) => `"${x}"`).join(", ");
        add("accent-focus-only", v.focusPath, v.focus ? `tone focus mark ${ids} is visible here but not in this focus list ${show(v.focus)}` : `tone focus mark ${ids} is drawn where there is no focus list (quiz item figure, summary or reveal.figure); expected another tone`);
      }
    }
  }

  /** @param {Function} add @param {("desktop" | "mobile")[]} viewports */
  async layout(add, viewports) {
    const input = this.input;
    /** @type {{ key: string; params: Record<string, any>; focus: string[] | null; samples?: { t: number; step: number }[]; compare?: any; box?: (vp: "desktop" | "mobile") => { width: number; height: number } }[]} */
    const jobs = [];
    for (const v of this.views()) {
      const sc = v.sc;
      if (v.kind === "compare") jobs.push({ key: v.key, params: v.sets[0], focus: v.focus, compare: { a: sc.a ?? {}, b: sc.b ?? {}, labels: sc.labels ?? ["a", "b"] } });
      else if (v.kind === "steps") jobs.push({ key: v.key, params: v.sets[0], focus: v.focus, samples: [{ t: /** @type {number[]} */ (v.steps)[0], step: /** @type {number[]} */ (v.steps)[0] }] });
      else if (v.kind === "summary") {
        const n = input.summary.figures.filter((/** @type {string} */ k) => this.isFigure(k)).length;
        jobs.push({ key: v.key, params: v.sets[0], focus: null, box: (vp) => summaryBoxes(vp, n)[0] });
      } else if (v.kind === "reveal" && v.half) {
        jobs.push({ key: v.key, params: v.sets[0], focus: null, box: (vp) => stageBoxes(vp, 2)[1] });
      } else for (const p of v.sets.slice(0, v.kind === "explore" ? v.sets.length : 1)) jobs.push({ key: v.key, params: p, focus: v.focus });
    }
    const done = new Set();
    for (const vp of viewports) {
      for (const j of jobs) {
        const fig = input.figures[j.key];
        const leaves = leavesOf(input, j.key, j.params);
        const frame = leaves[0]?.fig?.args?.[0];
        const samples = j.samples ?? (frame ? samplesFor(frame, this.S) : [{ t: 0, step: 0 }]);
        for (const s of samples) {
          const sig = JSON.stringify([vp, j.key, j.params, j.focus, s, j.compare ?? null, j.box ? j.box(vp) : null]);
          if (done.has(sig)) continue;
          done.add(sig);
          try {
            const r = await layoutFigure(input, j.key, { viewport: vp, t: s.t, step: s.step, params: j.params, focus: j.focus, box: j.box ? j.box(vp) : stageBox(vp), compare: j.compare });
            for (const e of r.errors) add(e.rule, e.path, e.message, vp);
          } catch (e) {
            add("figure-eval", `figures.${j.key}@t=${fmtT(s.t)},step=${s.step}`, `layout threw: ${msgOf(e)}`);
          }
        }
        void fig;
      }
    }
  }
}

/** @param {number} t */
const fmtT = (t) => String(Math.round(t * 1e6) / 1e6);

/** @param {Record<string, any>} p @param {Record<string, any>} d */
function diffParams(p, d) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const [k, v] of Object.entries(p)) if (d[k] !== v) out[k] = v;
  return out;
}

/**
 * Knob candidate values: numbers on n points (snapped to step), lists, booleans.
 * @param {any} spec @param {number} n @param {any} start
 */
export function knobValues(spec, n, start) {
  if (typeof spec === "boolean") return [false, true];
  if (Array.isArray(spec) && spec.every((x) => typeof x === "string")) return spec.slice();
  let lo;
  let hi;
  let step;
  let log = false;
  if (Array.isArray(spec)) [lo, hi, step] = spec;
  else if (isPlainObject(spec) && Array.isArray(spec.range)) {
    [lo, hi] = spec.range;
    step = spec.step;
    log = !!spec.log;
  } else return start === undefined ? [] : [start];
  /** @type {number[]} */
  const out = [];
  for (let k = 0; k < n; k++) {
    const f = n === 1 ? 0 : k / (n - 1);
    let v = log && lo > 0 && hi > 0 ? lo * (hi / lo) ** f : lo + (hi - lo) * f;
    if (typeof step === "number" && step > 0) v = Math.min(hi, Math.max(lo, lo + Math.round((v - lo) / step) * step));
    v = Math.round(v * 1e12) / 1e12;
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

/** @param {any} frame @param {any} m @param {number} t */
function domainOf(frame, m, t) {
  const o = frame?.args?.[0] ?? {};
  if (frame?.kind === "cartesian") {
    const cam = typeof o.camera === "function" ? o.camera(m, t) : null;
    return { kind: "cartesian", x: cam?.x ?? o.x.slice(0, 2), y: cam?.y ?? o.y.slice(0, 2), log: o.log };
  }
  if (frame?.kind === "graph") return { kind: "graph", x: [0, 1], y: [0, 1] };
  if (frame?.kind === "cells") return { kind: "cells", x: [0, o.cols], y: [0, o.rows] };
  if (frame?.kind === "geo") {
    const b = /** @type {any} */ (REGIONS)[o.region ?? "world"] ?? REGIONS.world;
    return { kind: "geo", x: [b[0], b[2]], y: [b[1], b[3]] };
  }
  return null;
}

/** @param {number[]} pt @param {any} dom */
function outside(pt, dom) {
  let [x, y] = pt;
  if (dom.kind === "geo" && x < dom.x[0]) x += 360;
  const range = (/** @type {number} */ v, /** @type {number[]} */ r, /** @type {boolean} */ log) => {
    const lo = Math.min(r[0], r[1]);
    const hi = Math.max(r[0], r[1]);
    const tol = 1e-9 * Math.max(1, hi - lo);
    if (log && !(v > 0)) return false;
    return v >= lo - tol && v <= hi + tol;
  };
  const lx = dom.log === "x" || dom.log === "xy";
  const ly = dom.log === "y" || dom.log === "xy";
  if (!range(x, dom.x, lx) || !range(y, dom.y, ly)) return `x [${dom.x.join(", ")}], y [${dom.y.join(", ")}]${dom.log ? ` (log ${dom.log})` : ""}`;
  return null;
}

/** Data points a mark places, per the data-in-domain rule. @param {any} d @returns {number[][]} */
export function pointsOf(d) {
  const a = d.args;
  const P = (/** @type {any} */ p) => (Array.isArray(p) && p.length >= 2 && typeof p[0] === "number" ? [p] : []);
  switch (d.kind) {
    case "line":
    case "area":
      return (a[0] ?? []).flatMap(P);
    case "dot":
    case "label":
    case "math":
    case "code":
      return P(a[0]);
    case "circle":
    case "arc":
      return P(a[0]);
    case "rect":
    case "arrow":
    case "dim":
    case "brace":
      return [...P(a[0]), ...P(a[1])];
    case "angle":
      return [...P(a[0]), ...P(a[1]), ...P(a[2])];
    case "path":
      return (a[0] ?? []).flatMap((/** @type {any[]} */ c) => {
        if (c[0] === "A") return [[c[6], c[7]]];
        const out = [];
        for (let i = 1; i + 1 < c.length; i += 2) out.push([c[i], c[i + 1]]);
        return out;
      });
    case "mock":
      return [...P(a[1]?.[0]), ...P(a[1]?.[1])];
    case "flow":
      return (a[0] ?? []).flatMap(P);
    case "node":
      return P(optsOf([a[2]]).at);
    case "cell":
      return [[a[0], a[1]], [a[0] + 1, a[1] + 1]];
    case "trace": {
      const o = optsOf(a.slice(2));
      const [i, j] = o.dims ?? [0, 1];
      try {
        return a[0].until(a[1]).map((/** @type {any} */ p) => [p.y[i], p.y[j]]);
      } catch {
        return [];
      }
    }
    case "legend":
      return P(optsOf(a.slice(1)).at);
    case "custom":
      return [...P(a[0]?.bounds?.[0]), ...P(a[0]?.bounds?.[1])];
    default:
      return [];
  }
}

/** Learner-facing texts of a scene with their paths. @param {any} sc @param {string} path @param {any} m */
function sceneTexts(sc, path, m) {
  /** @type {{ path: string; text: string }[]} */
  const out = [];
  /** @param {any} v @param {string} p */
  const t = (v, p) => {
    if (v !== undefined) out.push({ path: p, text: txt(v, m) });
  };
  /** @param {any[]} options @param {string} p */
  const opts = (options, p) =>
    (options ?? []).forEach((op, k) => {
      t(op?.text, `${p}[${k}].text`);
      t(op?.feedback, `${p}[${k}].feedback`);
    });
  t(sc.title, `${path}.title`);
  t(sc.say, `${path}.say`);
  t(sc.ask, `${path}.ask`);
  if (sc.type === "predict") {
    opts(sc.input?.options, `${path}.input.options`);
    t(sc.reveal?.say, `${path}.reveal.say`);
  }
  if (sc.type === "steps") (sc.steps ?? []).forEach((/** @type {any} */ s, /** @type {number} */ k) => t(s?.say, `${path}.steps[${k}].say`));
  if (sc.type === "explore") t(sc.goal?.say, `${path}.goal.say`);
  if (sc.type === "quiz")
    (sc.items ?? []).forEach((/** @type {any} */ q, /** @type {number} */ k) => {
      const p = `${path}.items[${k}]`;
      t(q?.prompt, `${p}.prompt`);
      opts(q?.options, `${p}.options`);
      t(q?.reveal?.say, `${p}.reveal.say`);
    });
  return out;
}
