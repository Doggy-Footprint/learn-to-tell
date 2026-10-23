// VO-10 (FR-43, FR-50 v6 sentences, V1-5): black-box checks on the example through load()/descriptors.
// Oracle: spec FR-15 (time samples), Signatures params priority, FR-43 / rules text. No implementation source is read.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { STUB, EXAMPLE } from "./fixtures/helpers.mjs";

const { load, createApi } = await import(STUB);
const factory = (await import(pathToFileURL(EXAMPLE).href)).default;
const L = load(factory);
const inp = L.input;
const S = 5;

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const baseParams = Object.assign({}, ...Object.values(inp.models).map((m) => m.args[0]));
const merge = (...ps) => Object.assign({}, ...ps.map((p) => p ?? {}));
const outCache = new Map();
function outputs(params) {
  const key = JSON.stringify(params);
  if (!outCache.has(key)) {
    outCache.set(key, Object.fromEntries(Object.entries(inp.models).map(([name, m]) => {
      const defs = m.args[0];
      return [name, L.run(name, Object.fromEntries(Object.entries(params).filter(([k]) => k in defs)))];
    })));
  }
  return outCache.get(key);
}

const frameOf = (fig) => fig.args[0];
const frameOpts = (fig) => frameOf(fig).args.find(isObj) ?? {};
function samples(fig) {
  const o = frameOpts(fig);
  if (o.loop) { const [a, b] = o.loop.span; return Array.from({ length: S + 1 }, (_, k) => ({ t: a + (b - a) * k / S, step: 0 })); }
  if (o.steps) return o.steps.map((_, i) => ({ t: i, step: i }));
  if (o.idle) return Array.from({ length: S }, (_, k) => ({ t: k / S, step: 0 }));
  return [{ t: 0, step: 0 }];
}

/** Leaves of a figure key: [{key, params}] — split shares params, multiples overrides one key per copy. */
function leaves(key, params) {
  const f = inp.figures[key];
  assert.ok(f, `figure ${key}`);
  if (f.kind === "split") return f.args[0].flatMap((k) => leaves(k, params));
  if (f.kind === "multiples") {
    const over = f.args[1].over;
    return Object.entries(over).flatMap(([k, vs]) => vs.flatMap((v) => leaves(f.args[0], merge(params, { [k]: v }))));
  }
  return [{ key, params }];
}

const flat = (tree) => {
  const out = [];
  const walk = (n) => {
    if (!n) return;
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (typeof n !== "object" || !n.kind) return;
    out.push(n);
    if (n.kind === "mock") walk(n.args[2]);
  };
  walk(tree);
  return out;
};
const optsOf = (d) => { const l = d.args.at(-1); return isObj(l) ? l : {}; };

/** All descriptors of a figure key drawn at every FR-15 sample; stepOverride replaces ctx.step. */
function drawAll(key, params, stepOverride) {
  const res = [];
  for (const lf of leaves(key, params)) {
    const fig = inp.figures[lf.key];
    const outs = outputs(lf.params);
    for (const s of samples(fig)) {
      const step = stepOverride ?? s.step;
      for (const d of flat(fig.args[1](outs, s.t, { step, params: lf.params }))) res.push({ d, leaf: lf, t: s.t, step });
    }
  }
  return res;
}

const knobValues = (k) => {
  if (typeof k === "boolean") return [true, false];
  if (Array.isArray(k) && typeof k[0] === "string") return k;
  const r = Array.isArray(k) ? k.slice(0, 2) : k.range;
  return [r[0], r[1]];
};
const optionParams = (opts) => (opts ?? []).filter((o) => o.params).map((o) => o.params);

/** Figure uses: { where, key, focus: string[] | null (null = no focus list), step?, variants: [{label, params}] } */
function uses() {
  const out = [];
  const add = (where, key, focus, variants, step) => out.push({ where, key, focus, variants, step });
  inp.sections.forEach((sec, si) => sec.scenes.forEach((sc, ji) => {
    const at = `s${si}.${ji}(${sc.type})`;
    if (sc.type === "quiz") {
      sc.items.forEach((it, ii) => quizUse(`${at}.item${ii}`, it, add));
      return;
    }
    if (!sc.figure) return;
    const P0 = merge(baseParams, sc.params);
    let vs = [{ label: "scene", params: P0 }];
    if (sc.type === "explore") for (const [k, spec] of Object.entries(sc.knobs)) for (const v of knobValues(spec)) vs.push({ label: `knob ${k}=${v}`, params: merge(P0, { [k]: v }) });
    if (sc.type === "compare") vs.push({ label: "a", params: merge(P0, sc.a) }, { label: "b", params: merge(P0, sc.b) });
    let revVs = [];
    if (sc.type === "predict") {
      const opts = sc.input.kind === "choice" ? optionParams(sc.input.options) : [];
      const after = [...opts.map((p) => merge(P0, p)), ...(sc.reveal.params ? [merge(P0, sc.reveal.params), ...opts.map((p) => merge(P0, p, sc.reveal.params))] : [])];
      vs.push(...after.map((params, i) => ({ label: `committed#${i}`, params })));
      revVs = [{ label: "reveal-base", params: P0 }, ...after.map((params, i) => ({ label: `reveal#${i}`, params }))];
    }
    if (sc.type === "steps") sc.steps.forEach((st, i) => add(`${at}.step${i}`, sc.figure, st.focus, vs, i));
    else add(at, sc.figure, sc.focus, vs);
    if (sc.type === "predict" && sc.reveal.figure) add(`${at}.reveal.figure`, sc.reveal.figure, null, revVs);
  }));
  inp.quiz.forEach((it, ii) => quizUse(`quiz${ii}`, it, add));
  for (const k of inp.summary.figures) add(`summary:${k}`, k, null, [{ label: "defaults", params: baseParams }]);
  return out;
}
function quizUse(at, it, add) {
  if (!it.figure && !(it.reveal && it.reveal.figure)) return;
  const P0 = merge(baseParams, it.params);
  const opts = it.kind === "choice" ? optionParams(it.options) : [];
  const vs = [{ label: "item", params: P0 }, ...opts.map((p, i) => ({ label: `option#${i}`, params: merge(P0, p) }))];
  const rv = it.reveal?.params ? [{ label: "reveal", params: merge(P0, it.reveal.params) }, ...opts.map((p, i) => ({ label: `option#${i}+reveal`, params: merge(P0, p, it.reveal.params) }))] : [];
  if (it.figure) add(`${at}.figure`, it.figure, null, [...vs, ...rv]);
  if (it.reveal?.figure) add(`${at}.reveal.figure`, it.reveal.figure, null, [...vs, ...rv]);
}
const U = uses();

test("VO-10 FR-43 V1-5 figure-use enumeration is non-trivial (guards against vacuous loops)", () => {
  assert.ok(U.length >= 15, String(U.length));
  assert.ok(U.some((u) => u.focus === null), "figures without focus list exist");
  assert.ok(U.some((u) => u.step !== undefined), "steps scene exists");
  assert.ok(U.some((u) => u.variants.length > 2), "variants beyond scene params exist");
});

test("VO-10 FR-43 V1-5 traj has no arrow descriptors at defaults; euler has no label and its code has an options label; vx y max >= 34.6", () => {
  const trajArrows = drawAll("traj", baseParams).filter(({ d }) => d.kind === "arrow");
  assert.deepEqual(trajArrows.map((x) => x.d.id), []);
  assert.ok(drawAll("traj", baseParams).length > 0);
  const eu = drawAll("euler", baseParams);
  assert.ok(eu.length > 0);
  assert.deepEqual(eu.filter(({ d }) => d.kind === "label").map((x) => x.d.id), []);
  const codes = eu.filter(({ d }) => d.kind === "code");
  assert.ok(codes.length > 0);
  for (const { d } of codes) assert.ok(optsOf(d).label !== undefined && optsOf(d).label !== "", "code has MarkOpts label");
  assert.ok(frameOpts(inp.figures.vx).y[1] >= 34.6, String(frameOpts(inp.figures.vx).y));
});

// define-term: no term appears in text of an earlier scene (lesson order)
const TEXT_KEYS = new Set(["title", "say", "ask", "prompt", "text", "feedback"]);
function sceneTexts(sc) {
  const outs = outputs(baseParams);
  const texts = [];
  const walk = (v, key) => {
    if (typeof v === "function") { if (TEXT_KEYS.has(key)) texts.push(v(outs)); return; }
    if (typeof v === "string") { if (TEXT_KEYS.has(key)) texts.push(v); return; }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, key)); return; }
    if (isObj(v)) for (const [k, x] of Object.entries(v)) if (k !== "answer" && k !== "done") walk(x, k);
  };
  walk(sc);
  return texts;
}
test("VO-10 FR-43 V1-5 every define term is absent from all earlier scene texts", () => {
  const all = inp.sections.flatMap((s, si) => s.scenes.map((sc, ji) => ({ sc, at: `s${si}.${ji}` })));
  const defines = all.filter((x) => x.sc.type === "define");
  assert.ok(defines.length >= 1);
  for (const def of defines) {
    assert.ok(typeof def.sc.term === "string" && def.sc.term.length > 0);
    const idx = all.indexOf(def);
    assert.ok(idx > 0);
    for (const prev of all.slice(0, idx)) {
      for (const t of sceneTexts(prev.sc)) assert.ok(!t.includes(def.sc.term), `${def.at} term '${def.sc.term}' found in ${prev.at}: ${t}`);
    }
  }
});

test("VO-10 FR-50 A-27 V1-5 accent-focus-only: tone focus ids are within the scene/step focus list; no tone focus without a focus list", () => {
  const bad = [];
  let focusSeen = 0;
  for (const u of U) {
    for (const v of u.variants) {
      for (const { d, t, step } of drawAll(u.key, v.params, u.step)) {
        if (optsOf(d).tone !== "focus") continue;
        focusSeen++;
        const allowed = u.focus === null ? [] : u.focus;
        if (!allowed.includes(d.id)) bad.push(`${u.where} [${v.label}] t=${t} step=${step}: ${d.kind} id=${d.id}`);
      }
    }
  }
  assert.ok(focusSeen > 0, "example uses tone focus somewhere (else the check is vacuous)");
  assert.deepEqual(bad.slice(0, 20), []);
});

// data-in-domain (V2-1: every mark kind that carries data-unit points; argument positions per Signatures)
const TEXT_KINDS = new Set(["label", "legend", "math", "code"]);
function pathPoints(cmds) {
  return (Array.isArray(cmds) ? cmds : []).flatMap((c, i) => {
    const n = { M: [[1, 2]], L: [[1, 2]], Q: [[1, 2], [3, 4]], C: [[1, 2], [3, 4], [5, 6]], A: [[6, 7]], Z: [] }[c[0]] ?? [];
    return n.map(([xi, yi], j) => ({ p: [c[xi], c[yi]], what: `path[${i}:${c[0]}.${j}]` }));
  });
}
function pointsOf(d) {
  const a = d.args;
  const P = (p, what) => (Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number") ? [{ p, what }] : []);
  const o = optsOf(d);
  switch (d.kind) {
    case "line": case "area": return (Array.isArray(a[0]) ? a[0] : []).flatMap((p, i) => P(p, `${d.kind}[${i}]`));
    case "dot": return P(a[0], "dot");
    case "arrow": case "rect": return [...P(a[0], `${d.kind}.from`), ...P(a[1], `${d.kind}.to`)];
    case "dim": return [...P(a[0], "dim.from"), ...P(a[1], "dim.to")];
    case "brace": return [...P(a[0], "brace.from"), ...P(a[1], "brace.to")];
    case "angle": return [...P(a[0], "angle.vertex"), ...P(a[1], "angle.from"), ...P(a[2], "angle.to")];
    case "sweep": return typeof a[1] === "number" ? [{ axis: a[0], v: a[1], what: "sweep" }] : [];
    case "trace": {
      const dims = isObj(a[2]) && a[2].dims ? a[2].dims : [0, 1];
      return a[0].until(a[1]).flatMap((pt, i) => P([pt.y[dims[0]], pt.y[dims[1]]], `trace[${i}]`));
    }
    case "label": return [...P(a[0], "label.at"), ...P(o.leader, "label.leader")];
    case "legend": return P(o.at, "legend.at");
    case "math": case "code": return P(a[0], `${d.kind}.at`);
    case "glyph": case "icon": return P(a[1], `${d.kind}.at`);
    case "circle": case "arc": return P(a[0], `${d.kind}.center`);
    case "path": return pathPoints(a[0]);
    case "mock": return Array.isArray(a[1]) ? [...P(a[1][0], "mock.box[0]"), ...P(a[1][1], "mock.box[1]")] : [];
    case "inset": return [
      ...(Array.isArray(o.at) ? [...P(o.at[0], "inset.at[0]"), ...P(o.at[1], "inset.at[1]")] : []),
      ...(Array.isArray(o.source) ? [...P(o.source[0], "inset.source[0]"), ...P(o.source[1], "inset.source[1]")] : []),
    ];
    case "flow": return (Array.isArray(a[0]) ? a[0] : []).flatMap((p, i) => P(p, `flow[${i}]`));
    default: return [];
  }
}
/** Out-of-domain report for descriptors drawn in one cartesian frame. */
function domainReport(descs, fopts) {
  const [x0, x1] = fopts.x, [y0, y1] = fopts.y;
  const over = (val, lo, hi) => Math.max(lo - val, val - hi, 0);
  const viol = [];
  let checked = 0, textChecked = 0;
  for (const d of descs) for (const pt of pointsOf(d)) {
    checked++;
    if (TEXT_KINDS.has(d.kind)) textChecked++;
    const e = pt.axis ? over(pt.v, ...(pt.axis === "x" ? [x0, x1] : [y0, y1])) : Math.max(over(pt.p[0], x0, x1), over(pt.p[1], y0, y1));
    if (e > 1e-9) viol.push({ e, what: pt.what, val: pt.p ?? pt.v });
  }
  return { viol, checked, textChecked };
}
test("VO-10 FR-43 V1-5 V2-1 data-in-domain: every point-carrying mark's coordinates lie inside cartesian axis ranges", () => {
  const viol = [];
  let checked = 0, textChecked = 0;
  for (const u of U) for (const v of u.variants) {
    const byLeaf = new Map();
    for (const x of drawAll(u.key, v.params, u.step)) {
      if (frameOf(inp.figures[x.leaf.key]).kind !== "cartesian") continue;
      const k = `${x.leaf.key}|${x.t}|${x.step}`;
      if (!byLeaf.has(k)) byLeaf.set(k, { ...x, ds: [] });
      byLeaf.get(k).ds.push(x.d);
    }
    for (const g of byLeaf.values()) {
      const r = domainReport(g.ds, frameOpts(inp.figures[g.leaf.key]));
      checked += r.checked; textChecked += r.textChecked;
      for (const x of r.viol) viol.push({ e: x.e, msg: `${u.where} [${v.label}] fig=${g.leaf.key} t=${g.t} step=${g.step} ${x.what} ${x.val} by ${x.e}` });
    }
  }
  assert.ok(checked > 100, `checked ${checked}`);
  assert.ok(textChecked > 0, "at least one label/legend/math/code point was checked");
  viol.sort((a, b) => b.e - a.e);
  assert.deepEqual(viol.slice(0, 10).map((x) => x.msg), [], `${viol.length} violations; max ${viol[0]?.e}`);
});

test("VO-10 V2-1 checker self-test: out-of-range code at and path C control point are reported; in-range reports nothing", () => {
  const { api } = createApi();
  const fo = { x: [0, 10, "m"], y: [0, 5, "m"] };
  const draw = (cx, ctrl) => (api.figure(api.cartesian(fo), () => [
    api.code([cx, 2], "x=1", { label: "n" }),
    api.path([["M", 1, 1], ["C", 2, 2, ctrl[0], ctrl[1], 4, 4], ["Z"]]),
    api.label([1, 1], "t", { leader: [2, 2] }),
    api.legend([{ tone: "a", text: "s" }], { at: [9, 4] }),
  ]));
  const run = (f) => flat(f.args[1]({}, 0, { step: 0, params: {} }));
  const ok = domainReport(run(draw(10, [5, 5])), fo);
  assert.deepEqual(ok.viol, []);
  assert.ok(ok.checked >= 8 && ok.textChecked >= 3, `${ok.checked}/${ok.textChecked}`);
  const badCode = domainReport(run(draw(10.5, [5, 5])), fo);
  assert.deepEqual(badCode.viol.map((v) => v.what), ["code.at"]);
  const badPath = domainReport(run(draw(10, [5, 5.5])), fo);
  assert.deepEqual(badPath.viol.map((v) => v.what), ["path[1:C.1]"]);
});

test("VO-10 A2-3 V2-1 mock box corners and children recursion, inset/flow/arc/glyph/brace points are extracted", () => {
  const { api } = createApi();
  const fo = { x: [0, 10, "m"], y: [0, 5, "m"] };
  const f = api.figure(api.cartesian(fo), () => [
    api.mock("browser", [[1, 1], [11, 4]], [api.dot([2, 2]), [api.dot([3, 6])]]),
    api.inset("k", { at: [[0, 0], [2, 2]], source: [[1, 1], [3, 5.5]] }),
    api.flow([[1, 1], [2, -1]], { n: 1, rate: 1, seed: 1, t: 0 }),
    api.arc([-1, 1], 1, [0, 90]), api.circle([5, 5], 1),
    api.glyph("g", [0, 6]), api.icon("i", [1, 1]), api.math([11, 0], "x"),
    api.brace([0, 0], [0, 5.1], "b"),
  ]);
  const r = domainReport(flat(f.args[1]({}, 0, { step: 0, params: {} })), fo);
  assert.deepEqual(r.viol.map((v) => v.what).sort(), ["arc.center", "brace.to", "dot", "flow[1]", "glyph.at", "inset.source[1]", "math.at", "mock.box[1]"]);
});

// A2-3: reveal.marks ids must be drawn by the scene/item figure
function drawnIds(key, variants, step) {
  const ids = new Set();
  for (const v of variants) for (const { d } of drawAll(key, v.params, step)) if (d.id !== undefined) ids.add(d.id);
  return ids;
}
test("VO-10 A2-3 every predict and quiz reveal.marks id is drawn by that scene/item figure", () => {
  const bad = [];
  let seen = 0;
  const chk = (where, marks, key, variants) => {
    if (!marks) return;
    const ids = key ? drawnIds(key, variants, 0) : new Set();
    for (const m of marks) { seen++; if (!ids.has(m)) bad.push(`${where}: reveal.marks '${m}' not drawn by figure ${key}`); }
  };
  for (const u of U) {
    // predict scenes: main figure uses (variants include committed + reveal params)
    const m = /^s(\d+)\.(\d+)\(predict\)$/.exec(u.where);
    if (m) {
      const sc = inp.sections[+m[1]].scenes[+m[2]];
      chk(u.where, sc.reveal.marks, sc.figure, u.variants);
    }
    const q = /^(.*)\.figure$/.exec(u.where);
    if (q && !u.where.includes("reveal.figure") && !u.where.startsWith("summary")) {
      const it = u.where.startsWith("quiz") ? inp.quiz[+/^quiz(\d+)/.exec(u.where)[1]]
        : (() => { const mm = /^s(\d+)\.(\d+)\(quiz\)\.item(\d+)/.exec(u.where); return inp.sections[+mm[1]].scenes[+mm[2]].items[+mm[3]]; })();
      chk(u.where, it?.reveal?.marks, it?.figure, u.variants);
    }
  }
  // quiz items with reveal.marks but no figure are also failures
  const allItems = [...inp.quiz.map((it, i) => [`quiz${i}`, it]), ...inp.sections.flatMap((s, si) => s.scenes.flatMap((sc, ji) => sc.type === "quiz" ? sc.items.map((it, ii) => [`s${si}.${ji}.item${ii}`, it]) : []))];
  for (const [w, it] of allItems) if (it.reveal?.marks && !it.figure) { seen++; bad.push(`${w}: reveal.marks without figure`); }
  assert.ok(seen > 0, "example has reveal.marks (else vacuous)");
  assert.deepEqual(bad, []);
});
