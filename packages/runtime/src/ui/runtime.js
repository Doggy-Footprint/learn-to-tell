import { createApi, load, evaluate } from "../core/model.mjs";
import { numericAnswer, orderShuffle } from "../core/answer.mjs";
import { layoutFigure, resolveParams, outputsFor, leavesOf, flattenMarks, pxToData, dataToPx } from "../layout/figure.mjs";
import { stageBox, stageBoxes, summaryBoxes } from "../layout/constants.mjs";

const STEP_MS = 2600;
const MOBILE_MAX = 760;

/** @param {any} v @param {any} m */
export const txt = (v, m) => (typeof v === "function" ? String(v(m)) : v === undefined || v === null ? "" : String(v));
/** @param {any[]} args */
const optsOf = (args) => [...args].reverse().find((a) => a && typeof a === "object" && !Array.isArray(a)) ?? {};

/** Global scene list: section scenes, then the final quiz, then summary. @param {any} input */
export function buildScenes(input) {
  /** @type {any[]} */
  const out = [];
  (input.sections ?? []).forEach((/** @type {any} */ sec, /** @type {number} */ i) =>
    (sec.scenes ?? []).forEach((/** @type {any} */ sc, /** @type {number} */ j) => out.push({ type: sc.type, sc, path: `sections[${i}].scenes[${j}]`, section: i })),
  );
  out.push({ type: "quiz", sc: { type: "quiz", items: input.quiz ?? [] }, path: "quiz", final: true });
  out.push({ type: "summary", sc: input.summary ?? { figures: [] }, path: "summary" });
  return out.map((s, index) => ({ ...s, index }));
}

/** @param {any} input @param {string} key */
export function frameOf(input, key) {
  try {
    const leaf = leavesOf(input, key, resolveParams(input, {}))[0];
    return leaf?.fig?.args?.[0]?.args?.[0] ?? {};
  } catch {
    return {};
  }
}

/** @param {any} f frame options */
export function timeKind(f) {
  if (f.loop) return "loop";
  if (f.steps) return "steps";
  if (f.idle) return "idle";
  return "static";
}

/** Model time for a wall fraction w through the optional warp. @param {any} loop @param {number} w */
export function loopT(loop, w) {
  const [a, b] = loop.span;
  const warp = Array.isArray(loop.warp) && loop.warp.length >= 2 ? loop.warp : null;
  if (!warp) return a + (b - a) * w;
  const pts = [[a, 0], ...warp, [b, 1]].sort((p, q) => p[1] - q[1]);
  for (let i = 1; i < pts.length; i++) {
    if (w <= pts[i][1]) {
      const [t0, w0] = pts[i - 1];
      const [t1, w1] = pts[i];
      return w1 === w0 ? t1 : t0 + ((t1 - t0) * (w - w0)) / (w1 - w0);
    }
  }
  return b;
}

/** Whether the warp segment at w runs slower than linear time. @param {any} loop @param {number} w */
export function loopSlow(loop, w) {
  const warp = Array.isArray(loop.warp) && loop.warp.length >= 2 ? loop.warp : null;
  if (!warp) return false;
  const [a, b] = loop.span;
  const pts = [[a, 0], ...warp, [b, 1]].sort((p, q) => p[1] - q[1]);
  for (let i = 1; i < pts.length; i++) {
    if (w <= pts[i][1] + 1e-12) {
      const dw = pts[i][1] - pts[i - 1][1];
      if (dw <= 0) continue;
      return (pts[i][0] - pts[i - 1][0]) / dw < (b - a) * 0.999;
    }
  }
  return false;
}

/** Inverse of loopT: the first wall fraction showing model time t. @param {any} loop @param {number} t */
function loopW(loop, t) {
  const [a, b] = loop.span;
  if (!(Array.isArray(loop.warp) && loop.warp.length >= 2)) return b === a ? 0 : (t - a) / (b - a);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (loopT(loop, mid) < t) lo = mid;
    else hi = mid;
  }
  return hi;
}

export class Runtime {
  /** @param {import("ltt").LessonFactory} factory @param {{ start?: number }} [o] */
  constructor(factory, o = {}) {
    /** @type {Set<() => void>} */
    this.listeners = new Set();
    this.version = 0;
    /** @type {string | null} */
    this.loadError = null;
    /** @type {any} */
    this.input = null;
    try {
      this.input = load(factory).input;
    } catch (e) {
      this.loadError = e instanceof Error ? e.message : String(e);
    }
    this.scenes = this.input ? buildScenes(this.input) : [];
    this.defineAt = new Map();
    this.scenes.forEach((s) => {
      if (s.type === "define" && typeof s.sc.term === "string" && !this.defineAt.has(s.sc.term)) this.defineAt.set(s.sc.term, s.index);
    });
    this.reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.viewport = /** @type {"desktop" | "mobile"} */ (typeof innerWidth === "number" && innerWidth <= MOBILE_MAX ? "mobile" : "desktop");
    this.scene = Math.max(0, Math.min(this.scenes.length - 1, o.start ?? 0));
    /** @type {Record<number, any>} */
    this.states = {};
    this.clock = { t: 0, step: 0, playing: true, frozen: false, start: 0, offset: 0 };
    /** @type {any[]} */
    this.layouts = [];
    /** @type {any[]} */
    this.specs = [];
    /** @type {string | null} */
    this.renderError = null;
    this.layoutSeq = 0;
    /** @type {Promise<void>} */
    this.layoutDone = Promise.resolve();
    this.transitionUntil = 0;
    this.warned = new Set();
    if (this.input) this.enterScene(this.scene);
  }

  subscribe(/** @type {() => void} */ fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  get current() {
    return this.scenes[this.scene];
  }

  /** @param {number} n */
  stateOf(n) {
    if (!this.states[n]) {
      const s = this.scenes[n];
      /** @type {any} */
      const st = { committed: false, choice: null, drag: null, draw: null, knobs: {}, items: {} };
      if (s?.type === "quiz") {
        s.sc.items.forEach((/** @type {any} */ q, /** @type {number} */ k) => {
          st.items[k] = { value: q.kind === "order" ? orderShuffle(q.items.length) : q.kind === "classify" ? {} : null, submitted: false, correct: null, selected: null };
        });
      }
      this.states[n] = st;
    }
    return this.states[n];
  }

  /** @param {number} n */
  enterScene(n) {
    this.scene = n;
    this.renderError = null;
    const tk = this.timeSpec();
    this.clock = { t: this.restT(tk, false), step: 0, playing: !this.reduced && tk.kind !== "static", frozen: false, start: now(), offset: 0 };
    if (this.reduced) this.clock.t = this.restT(tk, true);
    this.transitionUntil = now() + (this.reduced ? 0 : 320);
    this.relayout();
  }

  /** @param {number} n */
  async goto(n) {
    if (!this.input) return;
    const k = Math.max(0, Math.min(this.scenes.length - 1, Math.floor(n)));
    this.enterScene(k);
    this.emit();
    await this.ready();
  }

  /** Main figure key of the current scene. */
  mainFigure() {
    const s = this.current;
    if (!s) return null;
    const sc = s.sc;
    if (s.type === "quiz") {
      const k = this.activeItem();
      return k === null ? null : sc.items[k].figure ?? null;
    }
    if (s.type === "summary") return null;
    return this.isFig(sc.figure) ? sc.figure : null;
  }

  /** @param {any} k */
  isFig(k) {
    return typeof k === "string" && !!this.input?.figures?.[k];
  }

  /** Quiz item whose figure the stage shows. */
  activeItem() {
    const s = this.current;
    const st = this.stateOf(this.scene);
    const items = s.sc.items ?? [];
    let last = null;
    for (let k = 0; k < items.length; k++) {
      if (!this.isFig(items[k].figure)) continue;
      if (!st.items[k]?.submitted) return k;
      last = k;
    }
    return last;
  }

  timeSpec() {
    const key = this.mainFigure();
    const f = key ? frameOf(this.input, key) : {};
    const kind = timeKind(f);
    return { kind, f, n: kind === "steps" ? f.steps.length : this.current?.type === "steps" ? this.current.sc.steps.length : 0 };
  }

  /** @param {any} tk @param {boolean} end */
  restT(tk, end) {
    if (tk.kind === "loop") return end ? tk.f.loop.span[1] : tk.f.loop.span[0];
    return 0;
  }

  stepCount() {
    const s = this.current;
    if (s?.type === "steps") return s.sc.steps.length;
    const tk = this.timeSpec();
    return tk.kind === "steps" ? tk.f.steps.length : 0;
  }

  /** Advances the clock; returns true when t or step changed. @param {number} wall */
  tick(wall) {
    const c = this.clock;
    if (!this.input || c.frozen || !c.playing || this.reduced) return false;
    const tk = this.timeSpec();
    const el = c.offset + (wall - c.start);
    let t = c.t;
    let step = c.step;
    if (tk.kind === "loop") {
      const ms = Math.max(1, tk.f.loop.ms);
      let w = el / ms;
      if (tk.f.loop.once) w = Math.min(1, w);
      else w = w % 1;
      t = loopT(tk.f.loop, w);
      c.w = w;
    } else if (tk.kind === "idle") {
      t = (el / Math.max(1, tk.f.idle.ms)) % 1;
    } else if (this.stepCount() > 0) {
      step = Math.floor(el / STEP_MS) % this.stepCount();
      t = step;
    } else return false;
    if (t === c.t && step === c.step) return false;
    c.t = t;
    c.step = step;
    return true;
  }

  /** @param {number} t @param {number} [step] */
  freeze(t, step) {
    const tk = this.timeSpec();
    this.clock.frozen = true;
    this.clock.playing = false;
    this.clock.t = Number(t);
    if (step !== undefined) this.clock.step = Math.floor(step);
    else if (tk.kind === "steps" || this.current?.type === "steps") this.clock.step = Math.max(0, Math.floor(Number(t)));
    if (tk.kind === "loop") this.clock.w = loopW(tk.f.loop, this.clock.t);
    this.relayout();
    this.emit();
  }

  togglePlay() {
    const c = this.clock;
    if (c.playing) {
      c.offset += now() - c.start;
      c.playing = false;
    } else {
      c.frozen = false;
      c.start = now();
      c.playing = true;
    }
    this.emit();
  }

  rewind() {
    const tk = this.timeSpec();
    const c = this.clock;
    c.offset = 0;
    c.start = now();
    c.step = 0;
    c.t = this.restT(tk, false);
    c.w = 0;
    this.relayout();
    this.emit();
  }

  nextStep() {
    const n = this.stepCount();
    if (!n) return;
    const c = this.clock;
    c.playing = false;
    c.step = (c.step + 1) % n;
    c.t = c.step;
    c.offset = c.step * STEP_MS;
    this.relayout();
    this.emit();
  }

  /** Resolved params of the current scene per the contract precedence. */
  params() {
    const s = this.current;
    if (!s || !this.input) return {};
    const st = this.stateOf(this.scene);
    const sc = s.sc;
    /** @type {Record<string, any>} */
    let p = { ...(sc.params ?? {}) };
    if (s.type === "explore") p = { ...p, ...st.knobs };
    if (s.type === "predict" && st.committed) {
      const op = sc.input?.kind === "choice" && st.choice !== null ? sc.input.options[st.choice] : null;
      p = { ...p, ...(op?.params ?? {}), ...(sc.reveal?.params ?? {}) };
    }
    if (s.type === "quiz") {
      const k = this.activeItem();
      if (k !== null) {
        const q = sc.items[k];
        const it = st.items[k];
        p = { ...(q.params ?? {}) };
        if (it?.submitted) {
          const op = q.kind === "choice" && it.value !== null ? q.options[it.value] : null;
          p = { ...p, ...(op?.params ?? {}), ...(q.reveal?.params ?? {}) };
        }
      }
    }
    return resolveParams(this.input, p);
  }

  outputs() {
    return outputsFor(this.input, this.params());
  }

  focus() {
    const s = this.current;
    if (!s) return null;
    if (s.type === "steps") return s.sc.steps[Math.min(this.clock.step, s.sc.steps.length - 1)]?.focus ?? [];
    if (s.type === "quiz" || s.type === "summary") return null;
    return Array.isArray(s.sc.focus) ? s.sc.focus : [];
  }

  /** Figures on the stage with their layout options. */
  stageSpecs() {
    const s = this.current;
    if (!s || !this.input) return [];
    const vp = this.viewport;
    const st = this.stateOf(this.scene);
    const sc = s.sc;
    const c = this.clock;
    const params = this.params();
    /** @type {any[]} */
    const specs = [];
    /** @param {string} key */
    const settledT = (key) => {
      const f = frameOf(this.input, key);
      const k = timeKind(f);
      if (k === "loop") return { t: f.loop.span[1], step: 0 };
      if (k === "steps") return { t: f.steps.length - 1, step: f.steps.length - 1 };
      return { t: 0, step: 0 };
    };
    if (s.type === "summary") {
      const keys = (sc.figures ?? []).filter((/** @type {any} */ k) => this.isFig(k));
      const boxes = summaryBoxes(vp, keys.length);
      const page = Math.min(st.page ?? 0, Math.max(0, keys.length - 1));
      keys.forEach((/** @type {string} */ key, /** @type {number} */ i) => (vp === "mobile" && i !== page) || specs.push({ key, at: boxes[i], opts: { viewport: vp, ...settledT(key), params: resolveParams(this.input, {}), focus: null, hidden: [], box: { width: boxes[i].width, height: boxes[i].height } } }));
      return specs;
    }
    const main = this.mainFigure();
    if (!main) return specs;
    let hidden = [];
    let reveal = null;
    let extra = null;
    if (s.type === "predict") {
      if (!st.committed) hidden = sc.reveal?.marks ?? [];
      else if (this.isFig(sc.reveal?.figure)) reveal = sc.reveal.figure;
      extra = this.guessMarks();
    }
    if (s.type === "quiz") {
      const k = /** @type {number} */ (this.activeItem());
      const q = sc.items[k];
      if (!st.items[k]?.submitted) hidden = q.reveal?.marks ?? [];
      else if (this.isFig(q.reveal?.figure)) reveal = q.reveal.figure;
    }
    const boxes = reveal ? stageBoxes(vp, 2) : [{ x: 0, y: 0, ...stageBox(vp) }];
    /** @type {any} */
    const opts = { viewport: vp, t: c.t, step: c.step, params, focus: this.focus(), hidden, box: { width: boxes[0].width, height: boxes[0].height } };
    if (s.type === "compare") opts.compare = { a: sc.a ?? {}, b: sc.b ?? {}, labels: sc.labels ?? ["a", "b"] };
    if (extra) {
      opts.extraMarks = extra.marks;
      opts.extraFor = extra.for;
    }
    specs.push({ key: main, at: boxes[0], opts });
    if (reveal) specs.push({ key: reveal, at: boxes[1], opts: { viewport: vp, ...settledT(reveal), params, focus: null, hidden: [], box: { width: boxes[1].width, height: boxes[1].height } } });
    return specs;
  }

  /** Descriptor with this id drawn by the current main figure, with its leaf. @param {string} id */
  findMark(id) {
    const key = this.mainFigure();
    if (!key) return null;
    const params = this.params();
    for (const leaf of leavesOf(this.input, key, params)) {
      if (leaf.fig.kind !== "figure") continue;
      const m = outputsFor(this.input, leaf.params);
      const marks = flattenMarks(leaf.fig.args[1](m, this.clock.t, { step: this.clock.step, params: { ...leaf.params } }));
      const d = marks.find((x) => x.id === id);
      if (d) return { d, leaf };
    }
    return null;
  }

  /** Learner answer marks ("guess") for drag and draw predicts. */
  guessMarks() {
    const s = this.current;
    const st = this.stateOf(this.scene);
    const inp = s.sc.input ?? {};
    const { api } = createApi();
    const style = { id: "guess", tone: /** @type {const} */ ("ref"), dash: true };
    if (inp.kind === "drag" && st.drag !== null) {
      const f = this.findMark(inp.mark);
      if (!f) return null;
      const moved = moveMark(api, f.d, inp.axis, st.drag, style);
      return moved ? { marks: [moved], for: inp.mark } : null;
    }
    if (inp.kind === "draw" && Array.isArray(st.draw) && st.draw.length >= 2) return { marks: [api.line(st.draw, style)], for: inp.answer };
    return null;
  }

  /** Data value of the drag mark's handle point on its axis. */
  dragStart() {
    const inp = this.current.sc.input;
    const f = this.findMark(inp.mark);
    if (!f) return 0;
    const p = handlePoint(f.d);
    return p ? p[inp.axis === "x" ? 0 : 1] : 0;
  }

  relayout() {
    if (!this.input) return this.layoutDone;
    const seq = ++this.layoutSeq;
    let specs;
    try {
      specs = this.stageSpecs();
    } catch (e) {
      this.fail(e);
      return this.layoutDone;
    }
    const job = Promise.all(specs.map((sp) => layoutFigure(this.input, sp.key, sp.opts).catch((e) => ({ failed: e })))).then((res) => {
      if (seq !== this.layoutSeq) return;
      this.specs = specs;
      this.layouts = res;
      for (const r of res) {
        if (r.failed) {
          this.reportOnce(`fail:${this.scene}:${String(r.failed?.message)}`, () => console.error("ltt: figure failed:", r.failed));
          continue;
        }
        for (const e of r.errors) {
          if (e.rule === "unimplemented") this.reportOnce(`${this.scene}:${e.path}:${e.rule}`, () => console.error(`ltt: ${e.path} [${e.rule}] ${e.message}`));
          else this.reportOnce(`${this.scene}:${e.path}:${e.rule}`, () => console.warn(`ltt: ${e.path} [${e.rule}] ${e.message}`));
        }
      }
      this.emit();
    });
    this.layoutDone = job;
    return job;
  }

  /** @param {string} key @param {() => void} fn */
  reportOnce(key, fn) {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    fn();
  }

  /** @param {unknown} e */
  fail(e) {
    this.renderError = e instanceof Error ? e.message : String(e);
    console.error("ltt: render failed:", e);
    this.emit();
  }

  async ready() {
    for (let i = 0; i < 5; i++) {
      const before = this.layoutSeq;
      await this.layoutDone;
      if (before === this.layoutSeq) break;
    }
    if (typeof document !== "undefined" && document.fonts) {
      try {
        await Promise.all([document.fonts.load('400 16px "LTT Pretendard"', "가A1"), document.fonts.load('600 16px "LTT Pretendard"', "가A1")]);
        await document.fonts.ready;
      } catch {
        // missing fonts fall back; layout still matches within the fallback
      }
    }
    const wait = this.transitionUntil - now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    await frames(2);
    if (typeof document !== "undefined" && typeof document.getAnimations === "function") {
      for (let i = 0; i < 3; i++) {
        const running = document.getAnimations().filter((a) => a.playState === "running" || a.playState === "pending");
        if (!running.length) break;
        await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
        await frames(1);
      }
    }
  }

  // ---------- learner input ----------

  /** @param {number} p */
  summaryPage(p) {
    this.stateOf(this.scene).page = p;
    this.relayout();
    this.emit();
  }

  /** @param {number} k */
  choose(k) {
    const st = this.stateOf(this.scene);
    if (st.committed) return;
    st.choice = k;
    this.emit();
  }

  /** @param {number} v */
  setDrag(v) {
    const st = this.stateOf(this.scene);
    if (st.committed) return;
    st.drag = v;
    this.relayout();
    this.emit();
  }

  /** @param {[number, number][]} pts */
  setDraw(pts) {
    const st = this.stateOf(this.scene);
    if (st.committed) return;
    st.draw = pts;
    this.relayout();
    this.emit();
  }

  canCommit() {
    const s = this.current;
    const st = this.stateOf(this.scene);
    if (s.type !== "predict" || st.committed) return false;
    const k = s.sc.input?.kind;
    if (k === "choice") return st.choice !== null;
    if (k === "drag") return st.drag !== null;
    if (k === "draw") return Array.isArray(st.draw) && st.draw.length >= 2;
    return false;
  }

  commit() {
    if (!this.canCommit()) return;
    const s = this.current;
    const st = this.stateOf(this.scene);
    const inp = s.sc.input;
    const m = this.outputs();
    if (inp.kind === "choice") st.correct = !!inp.options[st.choice].correct;
    else if (inp.kind === "drag") st.correct = Math.abs(st.drag - Number(inp.answer(m))) <= inp.tol + 1e-9;
    else st.correct = drawCorrect(this, st.draw);
    st.committed = true;
    this.reveal = { scene: this.scene, item: null };
    this.relayout();
    this.emit();
  }

  /** @param {Record<string, any>} patch */
  setKnobs(patch) {
    const st = this.stateOf(this.scene);
    st.knobs = { ...st.knobs, ...patch };
    this.relayout();
    this.emit();
  }

  /** @param {number} k @param {any} value */
  setItem(k, value) {
    const it = this.stateOf(this.scene).items[k];
    if (!it || it.submitted) return;
    it.value = value;
    this.emit();
  }

  /** @param {number} k */
  canSubmit(k) {
    const s = this.current;
    const q = s.sc.items[k];
    const it = this.stateOf(this.scene).items[k];
    if (!q || !it || it.submitted) return false;
    if (q.kind === "choice") return it.value !== null;
    if (q.kind === "numeric") return parseNumber(it.value) !== null;
    if (q.kind === "order") return true;
    if (q.kind === "classify") return q.items.every((/** @type {any} */ _, /** @type {number} */ i) => typeof it.value[i] === "string");
    return false;
  }

  /** @param {number} k */
  submit(k) {
    if (!this.canSubmit(k)) return;
    const q = this.current.sc.items[k];
    const it = this.stateOf(this.scene).items[k];
    if (q.kind === "choice") it.correct = !!q.options[it.value].correct;
    else if (q.kind === "numeric") {
      let ans = NaN;
      try {
        ans = numericAnswer(this.input, q.answer);
      } catch (e) {
        console.error("ltt: numeric answer failed:", e);
      }
      it.correct = Math.abs(/** @type {number} */ (parseNumber(it.value)) - ans) <= q.tol + 1e-9;
    } else if (q.kind === "order") it.correct = it.value.every((/** @type {number} */ v, /** @type {number} */ i) => v === i);
    else it.correct = q.items.every((/** @type {any} */ x, /** @type {number} */ i) => it.value[i] === x.bin);
    it.submitted = true;
    this.reveal = { scene: this.scene, item: k };
    this.relayout();
    this.emit();
  }

  /** Fills the first predict/quiz item with the correct or first wrong answer and commits it. @param {boolean} correct */
  async answer(correct) {
    const s = this.current;
    if (!s) return;
    const st = this.stateOf(this.scene);
    if (s.type === "predict" && !st.committed) {
      const inp = s.sc.input;
      if (inp.kind === "choice") st.choice = Math.max(0, inp.options.findIndex((/** @type {any} */ o) => (correct ? o.correct : !o.correct)));
      else if (inp.kind === "drag") {
        const ans = Number(inp.answer(this.outputs()));
        st.drag = correct ? ans : wrongValue(this, ans, inp.tol, inp.axis);
      } else if (inp.kind === "draw") {
        const pts = answerCurve(this, inp);
        const off = correct ? 0 : 3 * inp.tol + 1;
        st.draw = pts.map(([x, y]) => [x, y + off]);
      }
      this.commit();
    } else if (s.type === "quiz") {
      const k = s.sc.items.findIndex((/** @type {any} */ _, /** @type {number} */ i) => !st.items[i].submitted);
      if (k >= 0) {
        const q = s.sc.items[k];
        const it = st.items[k];
        if (q.kind === "choice") it.value = Math.max(0, q.options.findIndex((/** @type {any} */ o) => (correct ? o.correct : !o.correct)));
        else if (q.kind === "numeric") {
          let ans = 0;
          try {
            ans = numericAnswer(this.input, q.answer);
          } catch {
            ans = 0;
          }
          it.value = String(correct ? ans : ans + 10 * q.tol + 1);
        } else if (q.kind === "order") {
          const n = q.items.length;
          it.value = correct ? Array.from({ length: n }, (_, i) => i) : orderShuffle(n);
        } else if (q.kind === "classify") {
          /** @type {Record<number, string>} */
          const v = {};
          q.items.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
            v[i] = correct || i > 0 ? x.bin : q.bins.find((/** @type {string} */ b) => b !== x.bin) ?? x.bin;
          });
          it.value = v;
        }
        this.submit(k);
      }
    }
    await this.ready();
  }

  snapshot() {
    return { scene: this.scene, t: this.clock.t, step: this.clock.step, params: { ...this.params() }, committed: this.committed() };
  }

  committed() {
    const s = this.current;
    if (!s) return false;
    const st = this.stateOf(this.scene);
    if (s.type === "predict") return !!st.committed;
    if (s.type === "quiz") return s.sc.items.length > 0 && s.sc.items.every((/** @type {any} */ _, /** @type {number} */ k) => st.items[k].submitted);
    return false;
  }

  /** @param {any} layout @param {string} markId */
  panelOf(layout, markId) {
    const it = layout?.items?.find((/** @type {any} */ i) => i.markId === markId && i._r?.panel !== undefined);
    return it ? layout.panels[it._r.panel] : layout?.panels?.[0];
  }
}

/** @param {any} v */
export function parseNumber(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().replace(/,/g, "").replace(/−/g, "-");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** @param {any} d @returns {[number, number] | null} */
export function handlePoint(d) {
  const a = d.args;
  switch (d.kind) {
    case "arrow":
    case "rect":
    case "dim":
    case "brace":
      return a[1];
    case "line":
    case "area":
      return a[0]?.[a[0].length - 1] ?? null;
    case "angle":
      return a[0];
    default:
      return Array.isArray(a[0]) && typeof a[0][0] === "number" ? a[0] : null;
  }
}

/** @param {any} api @param {any} d @param {"x" | "y"} axis @param {number} v @param {any} style */
function moveMark(api, d, axis, v, style) {
  const i = axis === "x" ? 0 : 1;
  /** @param {[number, number]} p @returns {[number, number]} */
  const mv = (p) => (i === 0 ? [v, p[1]] : [p[0], v]);
  const a = d.args.slice();
  const last = a.length - 1;
  const o = a[last] && typeof a[last] === "object" && !Array.isArray(a[last]) ? { ...a[last], ...style, label: undefined } : style;
  if (a[last] && typeof a[last] === "object" && !Array.isArray(a[last])) a[last] = o;
  else a.push(o);
  switch (d.kind) {
    case "arrow":
    case "rect":
    case "dim":
    case "brace":
      a[1] = mv(a[1]);
      break;
    case "line":
    case "area":
      a[0] = a[0].map((/** @type {any} */ p, /** @type {number} */ k, /** @type {any[]} */ arr) => (k === arr.length - 1 ? mv(p) : p));
      break;
    default:
      if (Array.isArray(a[0]) && typeof a[0][0] === "number") a[0] = mv(a[0]);
      else return null;
  }
  if (typeof api[d.kind] !== "function") return null;
  return api[d.kind](...a);
}

/** @param {Runtime} rt @param {number} ans @param {number} tol @param {"x" | "y"} axis */
function wrongValue(rt, ans, tol, axis) {
  const key = rt.mainFigure();
  const f = key ? frameOf(rt.input, key) : {};
  const ax = axis === "x" ? f.x : f.y;
  const lo = ax?.[0] ?? ans - 10;
  const hi = ax?.[1] ?? ans + 10;
  const d = Math.max(3 * tol, (hi - lo) / 5);
  return ans + d <= hi ? ans + d : ans - d;
}

/** Answer curve points of a draw input. @param {Runtime} rt @param {any} inp @returns {[number, number][]} */
function answerCurve(rt, inp) {
  const f = rt.findMark(inp.answer);
  /** @type {[number, number][]} */
  const pts = f && Array.isArray(f.d.args[0]) ? f.d.args[0].filter((/** @type {any} */ p) => Array.isArray(p)) : [];
  const [x0, x1] = inp.x;
  const out = [];
  for (let k = 0; k <= 24; k++) {
    const x = x0 + ((x1 - x0) * k) / 24;
    const y = interp(pts, x);
    if (y !== null) out.push(/** @type {[number, number]} */ ([x, y]));
  }
  return out;
}

/** @param {[number, number][]} pts @param {number} x */
function interp(pts, x) {
  const s = pts.slice().sort((a, b) => a[0] - b[0]);
  if (!s.length || x < s[0][0] - 1e-9 || x > s[s.length - 1][0] + 1e-9) return null;
  for (let i = 1; i < s.length; i++) {
    if (x <= s[i][0]) {
      const [xa, ya] = s[i - 1];
      const [xb, yb] = s[i];
      return xb === xa ? yb : ya + ((yb - ya) * (x - xa)) / (xb - xa);
    }
  }
  return s[s.length - 1][1];
}

/** Draw answers are correct when the integral mean |gap| to the answer curve over the x range (trapezoid, 200 intervals) is within tol. @param {Runtime} rt @param {[number, number][]} draw */
function drawCorrect(rt, draw) {
  const inp = rt.current.sc.input;
  const f = rt.findMark(inp.answer);
  /** @type {[number, number][]} */
  const ans = f && Array.isArray(f.d.args[0]) ? f.d.args[0].filter((/** @type {any} */ p) => Array.isArray(p)) : [];
  const [x0, x1] = inp.x;
  const N = 200;
  let sum = 0;
  for (let k = 0; k <= N; k++) {
    const x = x0 + ((x1 - x0) * k) / N;
    const a = interp(ans, x);
    const sd = draw.slice().sort((p, q) => p[0] - q[0]);
    const g = sd.length ? interp(sd, Math.min(Math.max(x, sd[0][0]), sd[sd.length - 1][0])) : null;
    if (a === null || g === null) return false;
    sum += (k === 0 || k === N ? 0.5 : 1) * Math.abs(g - a);
  }
  return sum / N <= inp.tol + 1e-9;
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
/** @param {number} n */
const frames = (n) =>
  new Promise((r) => {
    if (typeof requestAnimationFrame !== "function") return r(undefined);
    let k = 0;
    const f = () => (++k >= n ? r(undefined) : requestAnimationFrame(f));
    requestAnimationFrame(f);
  });

export { pxToData, dataToPx, evaluate, optsOf };
