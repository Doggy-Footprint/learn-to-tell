import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import vm from "node:vm";

// Spec 76b739afacf5b868 v1 VO-1..VO-4 (C-1..C-8, C-20). Expected draw sequences come from the spec's Signatures
// ("LTT.clock 환경 계약") and Cases, computed by hand; the kit is only loaded, never read.

const KIT_JS = new URL("../skills/learn-to-tell/kit/ltt.js", import.meta.url);
const DUR = 1000;

// Globals are read at LTT.clock() call time (spec contract), so the stubs are added after ltt.js loaded.
function makeEnv({ io = true, doc = true, rm = false, search = "", hidden = false, mm = true } = {}) {
  const warns = [];
  const context = { console: { info() {}, log() {}, error() {}, warn: (...a) => warns.push(a.join(" ")) } };
  vm.createContext(context);
  vm.runInContext(readFileSync(KIT_JS, "utf8"), context);

  const queue = new Map();
  let nextId = 0;
  const raf = { calls: 0 };
  context.requestAnimationFrame = (cb) => {
    raf.calls++;
    queue.set(++nextId, cb);
    return nextId;
  };
  context.cancelAnimationFrame = (id) => void queue.delete(id);
  const step = (ts) => {
    for (const [id, cb] of [...queue]) if (queue.has(id)) { queue.delete(id); cb(ts); }
  };

  const observers = [];
  if (io) {
    context.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; this.targets = new Set(); observers.push(this); }
      observe(el) { this.targets.add(el); }
      unobserve(el) { this.targets.delete(el); }
      disconnect() { this.targets.clear(); }
    };
  }
  const fireIO = (el, isIntersecting) => {
    for (const o of observers) if (o.targets.has(el)) o.cb([{ target: el, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }], o);
  };

  const document = { hidden, listeners: [], addEventListener(type, fn) { this.listeners.push([type, fn]); }, removeEventListener() {} };
  if (doc) context.document = document;
  const setHidden = (v) => {
    document.hidden = v;
    for (const [type, fn] of document.listeners) if (type === "visibilitychange") fn({ type });
  };

  context.location = { search };
  if (mm) context.matchMedia = (q) => ({ media: q, matches: /prefers-reduced-motion/.test(q) ? rm : false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });

  const mkEl = () => ({ id: "el", isConnected: true, scrollIntoView() {}, closest: () => null, getBoundingClientRect: () => ({ top: 0, left: 0, right: 1, bottom: 1, width: 1, height: 1 }) });
  const el = mkEl();
  const draws = [];
  const clock = (opts = { dur: DUR }, draw = (t) => draws.push(t), target = el) => context.LTT.clock(target, draw, opts);
  return { context, LTT: context.LTT, warns, raf, step, fireIO, setHidden, document, el, mkEl, draws, clock, observers, queue };
}

const seq = (e, ts) => ts.forEach((t) => e.step(t));
const typeError = (err) => err && err.name === "TypeError"; // the error is created in the vm realm, so instanceof would fail

// ---------- VO-1 C-1, C-2 ----------

test("VO-1 C-1: visible clock dur 1000, frames 0, 500, 1200 draws 0, 500, 1000 and then no more", () => {
  const e = makeEnv();
  e.clock();
  e.fireIO(e.el, true);
  seq(e, [0, 500, 1200]);
  assert.deepEqual(e.draws, [0, 500, 1000]);
  seq(e, [2000, 3000]);
  assert.deepEqual(e.draws, [0, 500, 1000]);
});

test("VO-1 C-2: loop clock dur 1000, frames 0, 1500 draws 0, 500", () => {
  const e = makeEnv();
  e.clock({ dur: DUR, loop: true });
  e.fireIO(e.el, true);
  seq(e, [0, 1500]);
  assert.deepEqual(e.draws, [0, 500]);
});

test("VO-1 contract: with IntersectionObserver present, nothing draws before the first callback says isIntersecting", () => {
  const e = makeEnv();
  e.clock();
  seq(e, [0, 100, 200]);
  assert.deepEqual(e.draws, []);
  e.fireIO(e.el, false);
  seq(e, [300, 400]);
  assert.deepEqual(e.draws, []);
  e.fireIO(e.el, true);
  seq(e, [500, 600]);
  assert.deepEqual(e.draws, [0, 100]);
});

test("VO-1 contract: without IntersectionObserver and without document the clock counts as always visible", () => {
  const e = makeEnv({ io: false, doc: false });
  e.clock();
  seq(e, [0, 250]);
  assert.deepEqual(e.draws, [0, 250]);
});

// ---------- VO-1 C-3, C-4 (QR-2: zero draws while away) ----------

test("VO-1 C-3 QR-2: out of the viewport at 300, back at 2000: no draw while out, then draw(300), draw(400)", () => {
  const e = makeEnv();
  e.clock();
  e.fireIO(e.el, true);
  seq(e, [0, 300]);
  e.fireIO(e.el, false);
  seq(e, [1000, 1500]); // stale frames while away
  assert.deepEqual(e.draws, [0, 300], "draw while out of the viewport");
  e.fireIO(e.el, true);
  seq(e, [2000, 2100]);
  assert.deepEqual(e.draws, [0, 300, 300, 400]);
});

test("VO-1 C-4 QR-2: document.hidden at 300, visible at 2000: same sequence as C-3", () => {
  const e = makeEnv();
  e.clock();
  e.fireIO(e.el, true);
  seq(e, [0, 300]);
  e.setHidden(true);
  seq(e, [1000, 1500]);
  assert.deepEqual(e.draws, [0, 300], "draw while the document is hidden");
  e.setHidden(false);
  seq(e, [2000, 2100]);
  assert.deepEqual(e.draws, [0, 300, 300, 400]);
});

test("VO-1 C-4: a clock created while the document is already hidden waits for visibilitychange", () => {
  const e = makeEnv({ hidden: true });
  e.clock();
  e.fireIO(e.el, true);
  seq(e, [0, 100]);
  assert.deepEqual(e.draws, []);
  e.setHidden(false);
  seq(e, [200, 300]);
  assert.deepEqual(e.draws, [0, 100]);
});

// ---------- VO-1 state transition: 5 states x 8 events (0-switch) ----------

const P = [0, 200]; // PLAYING reaches t = 200 with the last frame at ts 200
const STATES = {
  playing: { ops: (e) => seq(e, [0, 200]), prefix: [0, 200] },
  "paused-user": { ops: (e, c) => { seq(e, [0, 200]); c.pause(); }, prefix: [0, 200] },
  "paused-offscreen": { ops: (e) => { seq(e, [0, 200]); e.fireIO(e.el, false); }, prefix: [0, 200] },
  "paused-hidden": { ops: (e) => { seq(e, [0, 200]); e.setHidden(true); }, prefix: [0, 200] },
  ended: { ops: (e) => seq(e, [0, 200, 1500]), prefix: [0, 200, 1000] },
};
const EVENTS = {
  play: (e, c) => c.play(),
  pause: (e, c) => c.pause(),
  seek: (e, c) => c.seek(600),
  offscreen: (e) => e.fireIO(e.el, false),
  onscreen: (e) => e.fireIO(e.el, true),
  hidden: (e) => e.setHidden(true),
  visible: (e) => e.setHidden(false),
  "tick-to-end": (e) => e.step(6000),
};
const PROBE = [7000, 7100];
const NONE = [[]];

// outcomes: the draws after the event and two probe frames. Several outcomes only where the spec leaves the cell open
// (marked "open" below); each listed outcome is consistent with the spec's contract sentences.
const CELLS = {
  playing: {
    play: { open: "play() while playing: no-op or re-anchor", outcomes: [[1000], [200, 300]] },
    pause: { outcomes: NONE },
    seek: { open: "next frame after seek: delta from old anchor or re-anchor", outcomes: [[600, 1000], [600, 600, 700]] },
    offscreen: { outcomes: NONE },
    onscreen: { open: "visible again while already running", outcomes: [[1000], [200, 300]] },
    hidden: { outcomes: NONE },
    visible: { open: "visibilitychange while already running", outcomes: [[1000], [200, 300]] },
    "tick-to-end": { outcomes: [[1000]] },
  },
  "paused-user": {
    play: { outcomes: [[200, 300]] },
    pause: { outcomes: NONE },
    seek: { outcomes: [[600]] },
    offscreen: { outcomes: NONE },
    onscreen: { outcomes: NONE },
    hidden: { outcomes: NONE },
    visible: { outcomes: NONE },
    "tick-to-end": { outcomes: NONE },
  },
  "paused-offscreen": {
    play: { outcomes: NONE },
    pause: { outcomes: NONE },
    seek: { open: "seek while offscreen: immediate draw or none", outcomes: [[], [600]] },
    offscreen: { outcomes: NONE },
    onscreen: { outcomes: [[200, 300]] },
    hidden: { outcomes: NONE },
    visible: { outcomes: NONE },
    "tick-to-end": { outcomes: NONE },
  },
  "paused-hidden": {
    play: { outcomes: NONE },
    pause: { outcomes: NONE },
    seek: { open: "seek while hidden: immediate draw or none", outcomes: [[], [600]] },
    offscreen: { outcomes: NONE },
    onscreen: { outcomes: NONE },
    hidden: { outcomes: NONE },
    visible: { outcomes: [[200, 300]] },
    "tick-to-end": { outcomes: NONE },
  },
  ended: {
    play: { open: "play() after the end: no-op, replay the end, or restart", outcomes: [[], [1000], [0, 100]] },
    pause: { outcomes: NONE },
    seek: { open: "seek after the end: only the immediate draw(600) is fixed", custom: (after) => after[0] === 600 && after.every((t) => t >= 0 && t <= DUR) },
    offscreen: { outcomes: NONE },
    onscreen: { outcomes: NONE },
    hidden: { outcomes: NONE },
    visible: { outcomes: NONE },
    "tick-to-end": { outcomes: NONE },
  },
};

for (const [state, row] of Object.entries(CELLS)) {
  for (const [event, cell] of Object.entries(row)) {
    test(`VO-1 transition ${state} --${event}-->${cell.open ? ` (open: ${cell.open})` : ""}`, () => {
      const e = makeEnv();
      const c = e.clock();
      e.fireIO(e.el, true);
      STATES[state].ops(e, c);
      assert.deepEqual(e.draws, STATES[state].prefix, "prefix to reach the state");
      EVENTS[event](e, c);
      seq(e, PROBE);
      const after = e.draws.slice(STATES[state].prefix.length);
      const ok = cell.custom ? cell.custom(after) : cell.outcomes.some((o) => isDeepStrictEqual(o, after));
      assert.ok(ok, `${state} --${event}--> draws after: ${JSON.stringify(after)}; accepted ${cell.custom ? "custom" : JSON.stringify(cell.outcomes)}`);
    });
  }
}

test("VO-1 transition coverage: the table has all 5 states x 8 events", () => {
  assert.deepEqual(Object.keys(CELLS), Object.keys(STATES));
  for (const row of Object.values(CELLS)) assert.deepEqual(Object.keys(row), Object.keys(EVENTS));
});

// ---------- VO-2 seek BVA ----------

for (const [arg, want] of [[-1, 0], [0, 0], [1, 1], [DUR - 1, DUR - 1], [DUR, DUR], [DUR + 1, DUR]]) {
  test(`VO-2 C-6: seek(${arg}) with dur ${DUR} draws ${want} at once`, () => {
    const e = makeEnv();
    const c = e.clock();
    e.fireIO(e.el, true);
    c.seek(arg);
    assert.deepEqual(e.draws, [want]);
  });
}

test("VO-2 C-6: seek(-5), seek(dur+5), seek(dur) in a row draw 0, dur, dur", () => {
  const e = makeEnv();
  const c = e.clock();
  e.fireIO(e.el, true);
  c.seek(-5);
  c.seek(DUR + 5);
  c.seek(DUR);
  assert.deepEqual(e.draws, [0, DUR, DUR]);
});

test("VO-2: seek draws with the clock's own dur (dur 400, seek(401) draws 400)", () => {
  const e = makeEnv();
  const c = e.clock({ dur: 400 });
  e.fireIO(e.el, true);
  c.seek(401);
  assert.deepEqual(e.draws, [400]);
});

// ---------- VO-3 reduced-motion x ?shot x loop (8 combinations) ----------

for (const rm of [true, false]) {
  for (const shot of [true, false]) {
    for (const loop of [true, false]) {
      const label = `reduced-motion ${rm ? "on" : "off"} x ?shot ${shot ? "yes" : "no"} x loop ${loop}`;
      test(`VO-3 ${label}: ${rm || shot ? "draw(dur) once, no rAF" : "plays from rAF frames"}`, () => {
        const e = makeEnv({ rm, search: shot ? "?shot" : "" });
        const c = e.clock({ dur: DUR, loop });
        e.fireIO(e.el, true);
        if (rm || shot) {
          c.play();
          seq(e, [0, 100, 2500]);
          assert.deepEqual(e.draws, [DUR]);
          assert.equal(e.raf.calls, 0, "requestAnimationFrame was called");
        } else {
          seq(e, [0, 100]);
          assert.deepEqual(e.draws, [0, 100]);
          assert.ok(e.raf.calls > 0);
        }
      });
    }
  }
}

test("VO-3 C-5: reduced-motion draws draw(dur) once and play() afterwards registers no rAF", () => {
  const e = makeEnv({ rm: true });
  const c = e.clock();
  e.fireIO(e.el, true);
  assert.deepEqual(e.draws, [DUR]);
  assert.equal(e.raf.calls, 0);
  c.play();
  assert.equal(e.raf.calls, 0);
  assert.deepEqual(e.draws, [DUR]);
});

test("VO-3 C-8: ?shot page with two clocks: both draw(dur) once, rAF 0", () => {
  const e = makeEnv({ search: "?shot" });
  const a = [], b = [];
  e.clock({ dur: 700, id: "a" }, (t) => a.push(t), e.mkEl());
  e.clock({ dur: 1500, id: "b" }, (t) => b.push(t), e.mkEl());
  for (const o of e.observers) for (const t of o.targets) e.fireIO(t, true);
  seq(e, [0, 100]);
  assert.deepEqual(a, [700]);
  assert.deepEqual(b, [1500]);
  assert.equal(e.raf.calls, 0);
});

test("VO-3 contract: without matchMedia the clock is not reduced-motion", () => {
  const e = makeEnv({ mm: false });
  e.clock();
  e.fireIO(e.el, true);
  seq(e, [0, 100]);
  assert.deepEqual(e.draws, [0, 100]);
});

// ---------- VO-4 dur partitions and draw throw ----------

for (const [label, opts] of [["0", { dur: 0 }], ["-1", { dur: -1 }], ["NaN", { dur: NaN }], ["missing", {}]]) {
  test(`VO-4 C-7: dur ${label} throws TypeError and registers nothing`, () => {
    const e = makeEnv();
    assert.throws(() => e.clock(opts), typeError);
    assert.deepEqual(e.draws, []);
    assert.equal(e.raf.calls, 0);
    for (const o of e.observers) assert.equal(o.targets.size, 0, "an observer still watches the element of a rejected clock");
  });
}

test("VO-4: dur positive returns {play, pause, seek}", () => {
  const e = makeEnv();
  const c = e.clock({ dur: 1 });
  for (const k of ["play", "pause", "seek"]) assert.equal(typeof c[k], "function", k);
});

test("VO-4 C-20: a draw that throws on its first frame warns, stops, and does not stop another clock", () => {
  const e = makeEnv();
  let aCalls = 0;
  const b = [];
  e.clock({ dur: DUR, id: "a" }, () => { aCalls++; throw new Error("boom"); }, e.mkEl());
  e.clock({ dur: DUR, id: "b" }, (t) => b.push(t), e.mkEl());
  for (const o of e.observers) for (const t of o.targets) e.fireIO(t, true);
  assert.doesNotThrow(() => seq(e, [0, 100, 200, 300]));
  assert.equal(aCalls, 1, "the throwing clock kept drawing");
  assert.deepEqual(b, [0, 100, 200, 300]);
  assert.ok(e.warns.length >= 1, "no console warning");
});

for (const [label, search, rm] of [["reduced-motion", "", true], ["?shot", "?shot", false]]) {
  test(`VO-4 C-20: a draw that throws in the ${label} one-shot path does not escape LTT.clock and warns`, () => {
    const e = makeEnv({ search, rm });
    let doneB = false;
    assert.doesNotThrow(() => e.clock({ dur: DUR }, () => { throw new Error("boom"); }, e.mkEl()));
    assert.doesNotThrow(() => e.clock({ dur: DUR }, () => { doneB = true; }, e.mkEl()));
    for (const o of e.observers) for (const t of o.targets) e.fireIO(t, true);
    assert.equal(doneB, true, "the second clock did not draw");
    assert.ok(e.warns.length >= 1, "no console warning");
  });
}

// ---------- VO-3 addendum (spec v2 Errors): ?shot&clock=<id>&t=<ms> beats reduced-motion for that clock ----------

for (const rm of [true, false]) {
  test(`VO-3 v2: reduced-motion ${rm ? "on" : "off"} with ?shot&clock=a&t=400: clock a draws 400 once, clock b draws dur, rAF 0`, () => {
    const e = makeEnv({ rm, search: "?shot&clock=a&t=400" });
    const a = [], b = [];
    const ca = e.clock({ dur: DUR, id: "a" }, (t) => a.push(t), e.mkEl());
    e.clock({ dur: 1500, id: "b" }, (t) => b.push(t), e.mkEl());
    for (const o of e.observers) for (const t of o.targets) e.fireIO(t, true);
    ca.play();
    seq(e, [0, 100, 2500]);
    assert.deepEqual(a, [400]);
    assert.deepEqual(b, [1500]);
    assert.equal(e.raf.calls, 0);
  });
}
