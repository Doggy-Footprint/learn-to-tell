// Helpers for tests/motion-verbs.test.mjs (spec 2d467cf453771b95). Observation only: no formula for an expected value lives here
// except easeInOutCubic, which the page needs to place flow/diagram references; the Node side recomputes every expectation itself.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const V = (window.V = { NS });
  V.clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  V.e = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  // The kit's loop reads Date.now, so a page can place a play at an exact ms of its cycle by freezing the clock: the play is created while the
  // clock is frozen at F0 and V.freeze(F0 + ms) followed by a short wait makes the next tick draw exactly ms. H.now keeps following real time.
  const real = Date.now.bind(Date);
  const base = real() - H.now();
  H.now = () => real() - base;
  let fake = null;
  Date.now = () => (fake === null ? real() : fake);
  V.real = real;
  V.clock = (hnow) => base + hnow;
  V.freeze = (t) => { fake = t; };
  V.thaw = () => { fake = null; };
  V.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // ticks: one timestamp per batch of DOM changes under svg. rows: [time, offset/L] stamped when p's stroke-dashoffset is WRITTEN (instance-level
  // setAttribute wrapper), because MutationObserver callbacks can lag the draw under host load and the formula depends on the write time.
  // opts.ignoreRootStyle (opt-in): inline-style writes on the observed root <svg> are layout fitting of the drawing (the kit limits an overflowing
  // scene's drawings), not draws of the play; only the play's own elements count. Other callers keep counting every mutation.
  V.watch = (svg, p, opts = {}) => {
    const w = { rows: [], ticks: [] };
    new MutationObserver((list) => {
      if (opts.ignoreRootStyle && list.every((m) => m.type === "attributes" && m.target === svg && m.attributeName === "style")) return;
      w.ticks.push(H.now());
    }).observe(svg, { attributes: true, subtree: true, childList: true });
    if (p) {
      const orig = p.setAttribute;
      p.setAttribute = function (name, value) {
        const r = orig.apply(this, arguments);
        if (name === "stroke-dashoffset") { const d = V.dashRaw(p); w.rows.push([H.now(), d.off / d.L]); }
        return r;
      };
    }
    return w;
  };

  V.visible = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentNode) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0 || n.hasAttribute("hidden")) return false;
      if (n === document.body) break;
    }
    return true;
  };
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; };
  V.rect = rectOf;
  V.shown = (el) => { const r = el.getBoundingClientRect(); return V.visible(el) && r.width + r.height > 0.1; };

  V.dash = (el) => {
    const cs = getComputedStyle(el);
    return { off: parseFloat(cs.strokeDashoffset), arr: cs.strokeDasharray.split(/[ ,]+/).map(parseFloat) };
  };
  V.vb = (svg) => { const b = svg.viewBox.baseVal; return [b.x, b.y, b.width, b.height]; };
  V.attrs = (el, names) => Object.fromEntries(names.map((n) => [n, parseFloat(el.getAttribute(n))]));
  V.rel = (el) => {
    const M = el.parentNode.getScreenCTM().inverse().multiply(el.getScreenCTM());
    return [M.a, M.b, M.c, M.d, M.e, M.f];
  };
  // Bounding box of `el` in `svg` root user coordinates, from getBBox mapped through the CTMs.
  V.rootBox = (el, svg) => {
    const bb = el.getBBox(), M = svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
    const xs = [], ys = [];
    for (const [x, y] of [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]) {
      const q = new DOMPoint(x, y).matrixTransform(M);
      xs.push(q.x); ys.push(q.y);
    }
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  };
  V.toRoot = (svg, x, y) => { const q = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; };
  // Path sampled with the browser's own getPointAtLength, in the path's own coordinates; every table path sits in root user space (no transformed ancestor).
  V.table = (path, N = 1000) => {
    const L = path.getTotalLength(), pts = [];
    for (let i = 0; i <= N; i++) { const q = path.getPointAtLength((i / N) * L); pts.push([q.x, q.y]); }
    return { L, N, pts };
  };
  V.dashRaw = (el) => {
    const g = (n) => el.getAttribute(n) ?? el.style.getPropertyValue(n);
    return { off: parseFloat(g("stroke-dashoffset")), L: parseFloat(String(g("stroke-dasharray")).split(/[ ,]+/)[0]) };
  };
  V.flow = (svg) => {
    const g = svg.querySelector("g.ltt-flow");
    if (!g) return { layer: false, nCircles: 0, centers: [], tails: 0 };
    const all = [...g.querySelectorAll("*")];
    const circles = all.filter((e) => e.localName === "circle");
    const tails = all.filter((e) => ["path", "line", "polyline", "polygon", "rect", "ellipse"].includes(e.localName) && V.shown(e));
    return { layer: true, nCircles: circles.length, centers: circles.filter(V.shown).map((c) => { const r = rectOf(c); return V.toRoot(svg, r.cx, r.cy); }), tails: tails.length };
  };

  // Hand-made <svg>. ids repeat across instances on purpose: targets must resolve inside root, not in the document.
  V.hand = (attach = true) => {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "600"); svg.setAttribute("height", "300"); svg.setAttribute("viewBox", "0 0 600 300");
    svg.style.display = "block";
    const st = 'fill="none" stroke="#000" stroke-width="2"';
    svg.innerHTML = `
      <path id="p" d="M20 250 C150 20 300 280 580 60" ${st}/>
      <line id="ln" x1="20" y1="280" x2="220" y2="280" ${st}/>
      <circle id="ci" cx="300" cy="150" r="40" ${st}/>
      <path id="q" d="M20 20 Q300 140 580 20" ${st}/>
      <path id="t1" class="g" d="M10 10 L200 40" ${st}/>
      <path id="t2" class="g" d="M10 60 L200 90" ${st}/>
      <path id="t3" d="M10 110 L200 140" ${st}/>
      <line id="t4" x1="10" y1="160" x2="200" y2="190" ${st}/>
      <circle id="t5" cx="100" cy="230" r="15" ${st}/>
      <rect id="cam" x="100" y="50" width="100" height="40" fill="#eee" stroke="none"/>
      <rect id="m" x="50" y="40" width="100" height="30" opacity="1" fill="#09f" stroke="none"/>
      <circle id="mc" cx="300" cy="200" r="20" fill="#f90" stroke="none"/>
      <g id="tr" transform="translate(10,5)"><rect x="0" y="0" width="30" height="30" fill="#0a0" stroke="none"/></g>
      <rect class="bar" x="300" y="240" width="40" height="30" fill="#555" stroke="none"/>
      <rect class="bar" x="350" y="210" width="40" height="60" fill="#555" stroke="none"/>
      <rect class="bar" x="400" y="180" width="40" height="90" fill="#555" stroke="none"/>
      <rect class="bar" x="450" y="150" width="40" height="120" fill="#555" stroke="none"/>
      <rect class="hb" x="500" y="20" width="60" height="20" fill="#555" stroke="none"/>
      <rect class="hb" x="500" y="50" width="120" height="20" fill="#555" stroke="none"/>
      <rect class="hb" x="500" y="80" width="90" height="20" fill="#555" stroke="none"/>`;
    if (attach) document.body.appendChild(svg);
    const q = (s) => svg.querySelector(s), qa = (s) => [...svg.querySelectorAll(s)];
    return { svg, p: q("#p"), ln: q("#ln"), ci: q("#ci"), q: q("#q"), t: ["#t1", "#t2", "#t3", "#t4", "#t5"].map(q), cam: q("#cam"), m: q("#m"), mc: q("#mc"), tr: q("#tr"), bars: qa(".bar"), hbs: qa(".hb") };
  };
  const DRAWN = (h) => ({ p: h.p, ln: h.ln, ci: h.ci, t1: h.t[0], t2: h.t[1], t3: h.t[2], t4: h.t[3], t5: h.t[4] });
  V.ref = (h, withTable) => ({
    L: Object.fromEntries(Object.entries(DRAWN(h)).map(([k, el]) => [k, el.getTotalLength()])),
    vb0: V.vb(h.svg), cam: V.rootBox(h.cam, h.svg),
    m0: V.attrs(h.m, ["x", "y", "width", "height", "opacity"]), mc0: V.attrs(h.mc, ["cx", "cy", "r"]), tr0: V.rel(h.tr),
    barBottoms: h.bars.map((b) => +b.getAttribute("y") + +b.getAttribute("height")), hbLefts: h.hbs.map((b) => +b.getAttribute("x")), q: withTable ? V.table(h.q) : null,
    html0: Object.fromEntries(Object.entries(DRAWN(h)).map(([k, el]) => [k, el.outerHTML])),
  });
  V.snap = (h, ms) => ({
    ms,
    dash: Object.fromEntries(Object.entries(DRAWN(h)).map(([k, el]) => [k, V.dash(el)])),
    html: Object.fromEntries(Object.entries(DRAWN(h)).map(([k, el]) => [k, el.outerHTML])),
    vb: V.vb(h.svg), m: V.attrs(h.m, ["x", "y", "width", "height", "opacity"]), mc: V.attrs(h.mc, ["cx", "cy", "r"]), tr: V.rel(h.tr),
    bars: h.bars.map(V.rel), hbs: h.hbs.map(V.rel), flow: V.flow(h.svg),
  });
  V.guard = (name, fn) => { try { fn(); } catch (e) { H.errors.push(name + ": " + (e && e.stack || e)); } };
})();
// The loop of a scene starts somewhere inside H.go (layout work can take tens of ms under host load); keep the time after go returns as t2 so a test
// can bound the loop's own t0 to [t, t2].
H.act = (name, fn) => {
  const t = H.now(), pre = { ...H.cnt };
  fn();
  const t2 = H.now();
  H.mark(name);
  H.marks[name].t = t;
  H.marks[name].t2 = t2;
  H.marks[name].pre = pre;
};
