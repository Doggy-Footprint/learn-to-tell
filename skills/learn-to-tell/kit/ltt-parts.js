(function (root) {
  "use strict";
  var LTT = root.LTT;
  var d3 = root.d3;
  if (!LTT || !d3) throw new Error("ltt-parts.js needs d3.min.js and ltt.js loaded first");

  var STYLE = [
    ".ltt-unit.on{background:var(--ltt-on,var(--ltt-accent))}.ltt-unit.alt{background:var(--ltt-alt,var(--ltt-bad))}",
    ".ltt-units.band{max-width:none;gap:2px}.ltt-units.band .ltt-unit{border-radius:1px}",
    ".ltt-unit.guess{background:var(--ltt-guess,color-mix(in srgb,var(--ltt-accent) 35%,var(--ltt-card)))}",
    ".ltt-choices{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}",
    ".ltt-choices button{background:var(--ltt-card);color:var(--ltt-ink);box-shadow:inset 0 0 0 1.5px var(--ltt-line-2);text-align:left;",
    "border-radius:16px;font-weight:650;transition:box-shadow .2s,background-color .2s}",
    ".ltt-choices button:hover:not(:disabled){box-shadow:inset 0 0 0 1.5px var(--ltt-ink)}",
    ".ltt-choices button[aria-pressed=true]{box-shadow:inset 0 0 0 2px var(--ltt-accent);background:var(--ltt-accent-soft)}",
    ".ltt-choices button.right{box-shadow:inset 0 0 0 2px var(--ltt-good);background:var(--ltt-good-soft)}",
    ".ltt-choices button.wrong{box-shadow:inset 0 0 0 2px var(--ltt-bad);background:var(--ltt-bad-soft)}",
    ".ltt-stepper{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 0 0}",
    ".ltt-stepper button{padding:7px 14px;font-size:14px}",
    ".ltt-dots{display:flex;gap:5px;flex:1}.ltt-dots i{flex:1;max-width:40px;height:5px;border-radius:3px;background:var(--ltt-line);",
    "transition:background-color .3s}.ltt-dots i.done{background:var(--ltt-accent)}",
    ".ltt-caption{min-height:3em;margin:12px 0 0;font-size:clamp(15px,1.35vw,18px);line-height:1.6}",
    ".ltt-caption b{color:var(--ltt-accent)}",
    ".ltt-svg{width:100%;height:auto;display:block;overflow:visible}",
    ".ltt-svg text{font:13px var(--ltt-font);fill:var(--ltt-ink)}",
    ".ltt-dg .n rect.box{fill:var(--ltt-card);stroke:var(--ltt-line-2);stroke-width:1.5;transition:fill .3s,stroke .3s}",
    ".ltt-dg .n .l{font-size:14px;font-weight:750;fill:var(--ltt-ink)}.ltt-dg .n .s{font-size:11.5px;fill:var(--ltt-muted)}",
    ".ltt-dg .n .ic{color:var(--ltt-ink-2)}",
    ".ltt-dg .n.k-accent rect.box{stroke:var(--ltt-accent);fill:var(--ltt-accent-soft)}.ltt-dg .n.k-accent .ic{color:var(--ltt-accent)}",
    ".ltt-dg .n.k-good rect.box{stroke:var(--ltt-good);fill:var(--ltt-good-soft)}.ltt-dg .n.k-good .ic{color:var(--ltt-good)}",
    ".ltt-dg .n.k-bad rect.box{stroke:var(--ltt-bad);fill:var(--ltt-bad-soft)}.ltt-dg .n.k-bad .ic{color:var(--ltt-bad)}",
    ".ltt-dg .n.k-warn rect.box{stroke:var(--ltt-warn);fill:var(--ltt-warn-soft)}.ltt-dg .n.k-warn .ic{color:var(--ltt-warn)}",
    ".ltt-dg .n.k-dark rect.box{stroke:var(--ltt-dark);fill:var(--ltt-dark)}.ltt-dg .n.k-dark .l,.ltt-dg .n.k-dark .s{fill:var(--ltt-on-dark)}.ltt-dg .n.k-dark .ic{color:var(--ltt-on-dark)}",
    ".ltt-dg .n.k-muted rect.box{fill:var(--ltt-card-2);stroke-dasharray:4 4}",
    ".ltt-dg .n.flaw rect.box{stroke:var(--ltt-bad);stroke-width:2}",
    ".ltt-dg .n.hot rect.box{stroke-width:2.5;filter:drop-shadow(0 6px 14px color-mix(in srgb,var(--ltt-accent) 22%,transparent))}",
    ".ltt-dg .e{fill:none;stroke:var(--ltt-line-2);stroke-width:2;transition:stroke .3s,opacity .3s}",
    ".ltt-dg .e.k-accent{stroke:var(--ltt-accent)}.ltt-dg .e.k-good{stroke:var(--ltt-good)}.ltt-dg .e.k-bad{stroke:var(--ltt-bad)}.ltt-dg .e.k-warn{stroke:var(--ltt-warn)}",
    ".ltt-dg .e.dash{stroke-dasharray:5 6}",
    ".ltt-dg .e.run{stroke-dasharray:7 7;animation:ltt-dash .7s linear infinite}",
    "@keyframes ltt-dash{to{stroke-dashoffset:-14}}",
    ".ltt-dg .el{font-size:11.5px;font-weight:650;fill:var(--ltt-muted);paint-order:stroke;stroke:var(--ltt-card);stroke-width:4px;stroke-linejoin:round}",
    ".ltt-dg .z rect{fill:color-mix(in srgb,var(--ltt-ink) 2.5%,transparent);stroke:var(--ltt-line-2);stroke-width:1.5;stroke-dasharray:5 6}",
    ".ltt-dg .z.k-bad rect{stroke:var(--ltt-bad);fill:color-mix(in srgb,var(--ltt-bad) 5%,transparent)}",
    ".ltt-dg .z.k-accent rect{stroke:var(--ltt-accent);fill:color-mix(in srgb,var(--ltt-accent) 5%,transparent)}",
    ".ltt-dg .z.k-good rect{stroke:var(--ltt-good);fill:color-mix(in srgb,var(--ltt-good) 5%,transparent)}",
    ".ltt-dg .z text{font-size:11.5px;font-weight:750;fill:var(--ltt-muted);letter-spacing:.02em}",
    ".ltt-dg .z.k-bad text{fill:var(--ltt-bad)}.ltt-dg .z.k-accent text{fill:var(--ltt-accent)}.ltt-dg .z.k-good text{fill:var(--ltt-good)}",
    ".ltt-dg .n,.ltt-dg .e,.ltt-dg .el,.ltt-dg .z{transition:opacity .3s}.ltt-dg .dim{opacity:.22}",
    ".ltt-dg .pk{filter:drop-shadow(0 1px 3px rgba(0,0,0,.25))}",
    ".ltt-dg .n rect.ring{fill:none;stroke:var(--ltt-line-2);stroke-width:1.5}.ltt-dg .n.k-accent rect.ring{stroke:var(--ltt-accent)}.ltt-dg .n.k-good rect.ring{stroke:var(--ltt-good)}.ltt-dg .n.k-bad rect.ring{stroke:var(--ltt-bad)}.ltt-dg .n.k-warn rect.ring{stroke:var(--ltt-warn)}",
    ".ltt-dg.rk rect.box,.ltt-dg.rk rect.ring,.ltt-dg.rk .z rect,.ltt-dg.rk path.e:not(.rkl){stroke:transparent}",
    ".ltt-dg .rkl{fill:none;stroke-linecap:round;stroke-linejoin:round;transition:opacity .3s,stroke-width .3s}",
    ".ltt-dg .n .rkl{stroke:var(--ltt-ink-2);stroke-width:1.6}.ltt-dg .n.hot .rkl{stroke-width:2.6}.ltt-dg .z .rkl{stroke:var(--ltt-line-2);stroke-width:1.3}.ltt-dg .rkl.e{stroke:var(--ltt-line-2);stroke-width:2}",
    ".ltt-dg .n.k-accent .rkl,.ltt-dg .z.k-accent .rkl,.ltt-dg .rkl.e.k-accent{stroke:var(--ltt-accent)}.ltt-dg .n.k-good .rkl,.ltt-dg .z.k-good .rkl,.ltt-dg .rkl.e.k-good{stroke:var(--ltt-good)}",
    ".ltt-dg .n.k-bad .rkl,.ltt-dg .n.flaw .rkl,.ltt-dg .z.k-bad .rkl,.ltt-dg .rkl.e.k-bad{stroke:var(--ltt-bad)}.ltt-dg .n.k-warn .rkl,.ltt-dg .rkl.e.k-warn{stroke:var(--ltt-warn)}.ltt-dg .n.k-dark .rkl{stroke:var(--ltt-dark)}",
    ".ltt-map .sea{fill:var(--ltt-sea)}.ltt-map .land{fill:var(--ltt-land);stroke:var(--ltt-border);stroke-width:.6;transition:fill .3s,opacity .3s}",
    ".ltt-map .land.k-accent{fill:color-mix(in srgb,var(--ltt-accent) 30%,var(--ltt-land))}.ltt-map .land.k-good{fill:color-mix(in srgb,var(--ltt-good) 30%,var(--ltt-land))}",
    ".ltt-map .land.k-bad{fill:color-mix(in srgb,var(--ltt-bad) 30%,var(--ltt-land))}.ltt-map .land.k-warn{fill:color-mix(in srgb,var(--ltt-warn) 30%,var(--ltt-land))}",
    ".ltt-map .grat{fill:none;stroke:var(--ltt-border);stroke-opacity:.35;stroke-width:.5}",
    ".ltt-map .rt{fill:none;stroke:var(--ltt-ink-2);stroke-width:2;stroke-linecap:round;transition:opacity .3s}",
    ".ltt-map .rt.k-accent{stroke:var(--ltt-accent)}.ltt-map .rt.k-good{stroke:var(--ltt-good)}.ltt-map .rt.k-bad{stroke:var(--ltt-bad)}.ltt-map .rt.k-warn{stroke:var(--ltt-warn)}",
    ".ltt-map .rt.dash{stroke-dasharray:5 6}.ltt-map .rt.run{stroke-dasharray:7 7;animation:ltt-dash .7s linear infinite}",
    ".ltt-map .pl circle{fill:var(--ltt-ink);stroke:var(--ltt-card);stroke-width:2}.ltt-map .pl.k-accent circle{fill:var(--ltt-accent)}",
    ".ltt-map .pl.k-good circle{fill:var(--ltt-good)}.ltt-map .pl.k-bad circle{fill:var(--ltt-bad)}.ltt-map .pl.k-warn circle{fill:var(--ltt-warn)}",
    ".ltt-map .pl text{font-size:12.5px;font-weight:750;paint-order:stroke;stroke:var(--ltt-card);stroke-width:4px;stroke-linejoin:round}",
    ".ltt-map .rl{font-size:11.5px;font-weight:650;fill:var(--ltt-muted);paint-order:stroke;stroke:var(--ltt-card);stroke-width:4px;stroke-linejoin:round}",
    ".ltt-map .dim{opacity:.22}.ltt-map .pk{filter:drop-shadow(0 1px 3px rgba(0,0,0,.25))}",
    ".ltt-seq .act rect{fill:var(--ltt-card);stroke:var(--ltt-line-2);stroke-width:1.5}.ltt-seq .act .l{font-size:14px;font-weight:750}.ltt-seq .act .s{font-size:11.5px;fill:var(--ltt-muted)}",
    ".ltt-seq .act.k-accent rect{stroke:var(--ltt-accent);fill:var(--ltt-accent-soft)}.ltt-seq .act.k-dark rect{fill:var(--ltt-dark);stroke:var(--ltt-dark)}.ltt-seq .act.k-dark text{fill:var(--ltt-on-dark)}",
    ".ltt-seq .act.k-bad rect{stroke:var(--ltt-bad);fill:var(--ltt-bad-soft)}.ltt-seq .act.k-good rect{stroke:var(--ltt-good);fill:var(--ltt-good-soft)}",
    ".ltt-seq .life{stroke:var(--ltt-line-2);stroke-width:1.5;stroke-dasharray:4 5}",
    ".ltt-seq .bar{fill:var(--ltt-card-2);stroke:var(--ltt-ink-2);stroke-width:1.2}",
    ".ltt-seq .msg path{fill:none;stroke:var(--ltt-ink-2);stroke-width:1.8}.ltt-seq .msg.reply path{stroke-dasharray:5 4}",
    ".ltt-seq .msg text{font-size:12.5px;font-weight:650;fill:var(--ltt-ink-2);paint-order:stroke;stroke:var(--ltt-bg);stroke-width:4px;stroke-linejoin:round}",
    ".ltt-seq .msg.k-accent path{stroke:var(--ltt-accent)}.ltt-seq .msg.k-accent text{fill:var(--ltt-accent)}.ltt-seq .msg.k-bad path{stroke:var(--ltt-bad)}.ltt-seq .msg.k-bad text{fill:var(--ltt-bad)}",
    ".ltt-seq .msg.k-good path{stroke:var(--ltt-good)}.ltt-seq .msg.k-good text{fill:var(--ltt-good)}.ltt-seq .msg.k-warn path{stroke:var(--ltt-warn)}.ltt-seq .msg.k-warn text{fill:var(--ltt-warn)}",
    ".ltt-seq .note rect{fill:var(--ltt-warn-soft);stroke:var(--ltt-warn);stroke-width:1}.ltt-seq .note text{font-size:12px;fill:var(--ltt-ink-2)}",
    ".ltt-seq .span path{fill:none;stroke:var(--ltt-accent);stroke-width:1.5}.ltt-seq .span text{font-size:12px;font-weight:750;fill:var(--ltt-accent)}",
    ".ltt-seq .span.k-bad path{stroke:var(--ltt-bad)}.ltt-seq .span.k-bad text{fill:var(--ltt-bad)}.ltt-seq .span.k-warn path{stroke:var(--ltt-warn)}.ltt-seq .span.k-warn text{fill:var(--ltt-warn)}",
    ".ltt-seq .msg,.ltt-seq .bar,.ltt-seq .note,.ltt-seq .span{transition:opacity .3s}.ltt-seq .dim{opacity:.25}.ltt-seq .later{opacity:0}",
    ".ltt-seq .msg.hot path{stroke-width:2.6}.ltt-seq .msg.hot text{font-weight:800}",
    ".ltt-axplot .tk line{stroke:var(--ltt-line)}.ltt-axplot .tk text{font:11px var(--ltt-mono);fill:var(--ltt-muted)}",
    ".ltt-axplot .frame{fill:none;stroke:var(--ltt-ink-2);stroke-width:1.5}.ltt-axplot .ax{font:11.5px var(--ltt-mono);fill:var(--ltt-ink-2)}",
    ".ltt-axplot .sr{fill:none;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}",
    ".ltt-lanes text{font:12px var(--ltt-mono);fill:var(--ltt-muted)}.ltt-lanes .ln{font:600 14px var(--ltt-mono);fill:var(--ltt-ink)}.ltt-lanes .val{font:600 14px var(--ltt-mono)}",
    ".ltt-lanes .grid{stroke:var(--ltt-line);stroke-dasharray:2 4}.ltt-lanes .base{stroke:var(--ltt-line-2);stroke-width:1.5}",
    ".ltt-hbars text{font-family:var(--ltt-mono);font-size:13px;fill:var(--ltt-muted)}.ltt-hbars .lab{font-family:var(--ltt-font);font-size:15px;font-weight:700;fill:var(--ltt-ink)}",
    ".ltt-hbars .val{font-size:15px;font-weight:700;fill:var(--ltt-ink)}.ltt-hbars .grid line{stroke:var(--ltt-line-2);stroke-width:1}.ltt-hbars .zero{stroke:var(--ltt-ink);stroke-width:1.2}",
    ".ltt-plot{font-family:var(--ltt-font);color:var(--ltt-ink-2)}.ltt-plot [aria-label$='tick label'] text,.ltt-plot g[aria-label$='tick label']{font-family:var(--ltt-mono)}",
    ".ltt-sankey .nd rect{fill:var(--ltt-ink-2)}.ltt-sankey .lk{fill:none;stroke-opacity:.35;transition:stroke-opacity .3s}.ltt-sankey .lk.hot{stroke-opacity:.7}",
    ".ltt-sankey text{font-size:12.5px;font-weight:650;fill:var(--ltt-ink)}.ltt-sankey .v{font:11.5px var(--ltt-mono);fill:var(--ltt-muted)}",
    ".katex-display{overflow-x:auto;overflow-y:hidden;max-width:100%;padding:2px 0}"
  ].join("");

  var MOTION_MS = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
  var $ = function (id) { return document.getElementById(id); };
  var el = function (x) { return typeof x === "string" ? (x[0] === "#" ? document.querySelector(x) : $(x)) : x; };

  function tween(node, to, fmt, ms) {
    node = el(node);
    fmt = fmt || d3.format(",.0f");
    var from = Number(node.dataset.v != null ? node.dataset.v : to);
    node.dataset.v = to;
    var dur = ms == null ? MOTION_MS : (MOTION_MS ? ms : 0);
    d3.select(node).interrupt().transition().duration(dur).ease(d3.easeCubicOut)
      .tween("text", function () { var i = d3.interpolateNumber(from, to); return function (t) { node.textContent = fmt(i(t)); }; });
  }

  // opts.band: a wide strip of thin ticks (e.g. 2×50 requests in time order) instead of a square grid.
  function units(container, n, cols, opts) {
    container = el(container);
    n = n || 100;
    if (cols) container.style.setProperty("--ltt-cols", cols);
    container.classList.add("ltt-units");
    if (opts && opts.band) container.classList.add("band");
    var cells = d3.range(n).map(function (i) {
      var u = document.createElement("i");
      u.className = "ltt-unit";
      u.style.setProperty("--i", i);
      return u;
    });
    container.replaceChildren.apply(container, cells);
    return {
      cells: cells,
      paint: function (k, cls, alt) {
        cls = cls || "on";
        cells.forEach(function (u, i) {
          u.classList.remove("on", "alt", "guess");
          if (i < k) u.classList.add(cls);
          else if (alt != null && i < k + alt) u.classList.add("alt");
        });
      }
    };
  }

  function bar(container, parts) {
    container = el(container);
    container.classList.add("ltt-bar");
    var spans = parts.map(function (p) {
      var s = document.createElement("span");
      s.style.background = p.color;
      s.style.flexGrow = 0;
      return s;
    });
    container.replaceChildren.apply(container, spans);
    return {
      set: function (values, labels) {
        spans.forEach(function (s, i) {
          s.style.flexGrow = values[i];
          s.textContent = labels ? labels[i] : (parts[i].label || "");
        });
      }
    };
  }

  // The first prediction is locked and recorded once; later slider moves are exploration, not prediction.
  function predict(opts) {
    var locked = false;
    var input = el(opts.input);
    var choices = opts.choices ? el(opts.choices) : null;
    var button = el(opts.button);
    var value = null;
    if (choices) {
      choices.classList.add("ltt-choices");
      button.disabled = true;
      choices.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          if (locked) return;
          choices.querySelectorAll("button").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
          value = b.dataset.choice;
          button.disabled = false;
          if (opts.preview) opts.preview(value);
        });
      });
    }
    if (input) {
      var onInput = function () { value = Number(input.value); if (opts.preview) opts.preview(value); };
      input.addEventListener("input", function () { if (!locked) onInput(); });
      onInput();
    }
    button.addEventListener("click", function () {
      if (locked || value == null) return;
      locked = true;
      button.disabled = true;
      if (input) input.disabled = true;
      LTT.record("predict", { question: opts.question, guess: value });
      if (choices && opts.answer != null) {
        choices.querySelectorAll("button").forEach(function (b) {
          if (b.dataset.choice === String(opts.answer)) b.classList.add("right");
          else if (b.getAttribute("aria-pressed") === "true") b.classList.add("wrong");
        });
      }
      (opts.hide || []).forEach(function (x) { el(x).classList.add("ltt-hidden"); });
      setTimeout(function () {
        (opts.show || []).forEach(function (x) {
          var n = el(x);
          n.classList.remove("ltt-hidden");
          n.classList.add("ltt-rise");
        });
        if (opts.reveal) opts.reveal(value);
      }, MOTION_MS ? 350 : 0);
    });
    return { get value() { return value; }, get locked() { return locked; } };
  }

  // Range inputs drive one render(values); `#<id>-v` gets the formatted value when present.
  function sweep(opts) {
    var ids = Object.keys(opts.params);
    function values() {
      var v = {};
      ids.forEach(function (id) {
        var p = opts.params[id];
        var raw = Number($(id).value);
        v[id] = p.map ? p.map(raw) : raw;
        var label = $(id + "-v");
        if (label) label.textContent = p.fmt ? p.fmt(v[id]) : String(v[id]);
      });
      return v;
    }
    function render() { opts.render(values()); }
    ids.forEach(function (id) { $(id).addEventListener("input", render); });
    if (opts.presets) {
      document.querySelectorAll(opts.presets).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var set = JSON.parse(btn.dataset.preset);
          Object.keys(set).forEach(function (k) { $(k).value = set[k]; });
          render();
        });
      });
    }
    if (opts.immediate !== false) render();
    return { render: render, values: values };
  }

  // steps[i].enter(i, dir) must be idempotent: going back re-enters the earlier step from scratch.
  function stepper(container, steps, opts) {
    container = el(container);
    opts = opts || {};
    var i = -1, timer = null;
    var caption = document.createElement("p");
    caption.className = "ltt-caption";
    var bar = document.createElement("div");
    bar.className = "ltt-stepper";
    var prev = document.createElement("button"); prev.className = "ghost"; prev.textContent = "← 이전";
    var next = document.createElement("button"); next.textContent = "다음 →";
    var play = document.createElement("button"); play.className = "ghost"; play.textContent = "자동 재생";
    var dots = document.createElement("div"); dots.className = "ltt-dots";
    steps.forEach(function () { dots.appendChild(document.createElement("i")); });
    bar.append(prev, next, play, dots);
    container.append(caption, bar);
    function go(k, dir) {
      k = Math.max(0, Math.min(steps.length - 1, k));
      i = k;
      caption.innerHTML = steps[k].caption || "";
      if (LTT.linkTerms) LTT.linkTerms(caption);
      [].forEach.call(dots.children, function (d, j) { d.classList.toggle("done", j <= k); });
      prev.disabled = k === 0;
      next.disabled = k === steps.length - 1;
      steps[k].enter(k, dir || 1);
      if (opts.onStep) opts.onStep(k);
    }
    function stop() { clearInterval(timer); timer = null; play.textContent = "자동 재생"; }
    prev.onclick = function () { stop(); go(i - 1, -1); };
    next.onclick = function () { stop(); go(i + 1, 1); };
    play.onclick = function () {
      if (timer) return stop();
      if (i >= steps.length - 1) go(0, -1);
      play.textContent = "정지";
      timer = setInterval(function () { if (i >= steps.length - 1) stop(); else go(i + 1, 1); }, opts.interval || 2200);
    };
    go(0, 1);
    return { go: go, get index() { return i; } };
  }

  function nodeHeight(n, base) {
    if (n.h != null) return n.h;
    var lines = String(n.l || n.id).split("\n"), sub = n.s ? String(n.s).split("\n") : [];
    return lines.length > 1 || sub.length > 1 ? Math.max(base, 24 + 18 * lines.length + 16 * sub.length) : base;
  }

  // Diagram geometry, DOM-free so it runs in a bare vm. Nodes sit at grid cells (c, r may be fractional) or pixel offsets (x, y);
  // edges are straight, orthogonal or curved paths clipped to box borders.
  function diagramLayout(spec) {
    var cell = spec.cell || [210, 120], size = spec.node || [164, 60], pad = spec.pad == null ? 20 : spec.pad;
    var parallel = spec.parallel == null ? 14 : spec.parallel;
    var SIDES = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] }, SHAPES = { straight: 1, ortho: 1, curve: 1 };
    function G(c, r) { return [pad + (c + 0.5) * cell[0], pad + (r + 0.5) * cell[1]]; }
    function fx(v) { return String(Math.round(v * 100) / 100 || 0); }
    function fp(p) { return fx(p[0]) + " " + fx(p[1]); }
    function isPx(o) { return typeof o.x === "number" && typeof o.y === "number"; }

    var nodes = {}, gridCols = 0, gridRows = 0, pxW = 0, pxH = 0;
    spec.nodes.forEach(function (n) {
      var lines = String(n.l || n.id).split("\n"), sub = n.s != null && n.s !== "" ? String(n.s).split("\n") : [];
      var w = n.w != null ? n.w : size[0], h = nodeHeight(n, size[1]), cx, cy;
      if (isPx(n)) {
        cx = pad + n.x; cy = pad + n.y;
        pxW = Math.max(pxW, cx + w / 2 + pad); pxH = Math.max(pxH, cy + h / 2 + pad);
      } else if (typeof n.c === "number" && typeof n.r === "number") {
        var g = G(n.c, n.r); cx = g[0]; cy = g[1];
        gridCols = Math.max(gridCols, 1 + n.c); gridRows = Math.max(gridRows, 1 + n.r);
      } else throw new Error("diagram node " + n.id + " has no position (x, y or c, r)");
      nodes[n.id] = { x: cx - w / 2, y: cy - h / 2, w: w, h: h, cx: cx, cy: cy, lines: lines, sub: sub };
    });

    function clip(b, dx, dy, gap) {
      if (dx === 0 && dy === 0) { dx = 1; dy = 0; }
      var t = Math.min(dx !== 0 ? (b.w / 2 + gap) / Math.abs(dx) : Infinity, dy !== 0 ? (b.h / 2 + gap) / Math.abs(dy) : Infinity);
      return [b.cx + dx * t, b.cy + dy * t];
    }
    function side(b, s, gap) {
      return s === "top" ? [b.cx, b.y - gap] : s === "bottom" ? [b.cx, b.y + b.h + gap] : s === "left" ? [b.x - gap, b.cy] : [b.x + b.w + gap, b.cy];
    }
    function infer(dx, dy) { return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : (dy > 0 ? "bottom" : "top"); }
    function shifted(b, ox, oy) {
      return { x: b.x + ox, y: b.y + oy, w: b.w, h: b.h, cx: b.cx + ox, cy: b.cy + oy };
    }
    function unit(dx, dy) { var l = Math.sqrt(dx * dx + dy * dy); return l ? [dx / l, dy / l] : [0, 0]; }

    var raw = spec.edges || [], groups = {};
    raw.forEach(function (e, i) {
      var id = e.id != null ? e.id : e.f + ">" + e.t;
      if (e.f === e.t) throw new Error("diagram edge " + id + " connects node " + e.f + " to itself");
      if (!nodes[e.f] || !nodes[e.t]) throw new Error("diagram edge " + id + " (#" + i + ") points to a missing node");
      ["from", "to"].forEach(function (k) {
        if (e[k] != null && !SIDES.hasOwnProperty(e[k])) throw new Error("diagram edge " + id + " has invalid " + k + " side: " + e[k]);
      });
      if (e.shape != null && !SHAPES.hasOwnProperty(e.shape)) throw new Error("diagram edge " + id + " has invalid shape: " + e.shape);
      if (Array.isArray(e.points) && e.points.length < 2) throw new Error("diagram edge " + id + " needs at least 2 points");
      if (e.via && e.via.length || Array.isArray(e.points)) return;
      var key = String(e.f) < String(e.t) ? e.f + "\u0000" + e.t : e.t + "\u0000" + e.f;
      (groups[key] = groups[key] || []).push(i);
    });
    var offs = [];
    Object.keys(groups).forEach(function (key) {
      var idx = groups[key], n = idx.length, e0 = raw[idx[0]], u = unit(nodes[e0.t].cx - nodes[e0.f].cx, nodes[e0.t].cy - nodes[e0.f].cy);
      if (!u[0] && !u[1]) u = [1, 0];
      idx.forEach(function (ei, i) {
        var o = n === 1 ? 0 : (i - (n - 1) / 2) * parallel;
        offs[ei] = [-u[1] * o, u[0] * o];
      });
    });

    function cleanOrtho(list) {
      var eps = 1e-6, out = [];
      list.forEach(function (p) {
        var l = out[out.length - 1];
        if (l && Math.abs(l[0] - p[0]) <= eps && Math.abs(l[1] - p[1]) <= eps) return;
        while (out.length >= 2) {
          var a = out[out.length - 2], b = out[out.length - 1];
          if ((Math.abs(a[0] - b[0]) <= eps && Math.abs(b[0] - p[0]) <= eps) || (Math.abs(a[1] - b[1]) <= eps && Math.abs(b[1] - p[1]) <= eps)) out.pop();
          else break;
        }
        out.push(p);
      });
      if (out.length === 1) out.push(out[0].slice());
      return out;
    }
    function kinks(p, kp, q, kq) {
      if (Math.abs(p[0] - q[0]) <= 0.5 || Math.abs(p[1] - q[1]) <= 0.5) return [];
      var m;
      if (kp === "H" && kq === "H") { m = (p[0] + q[0]) / 2; return [[m, p[1]], [m, q[1]]]; }
      if (kp === "V" && kq === "V") { m = (p[1] + q[1]) / 2; return [[p[0], m], [q[0], m]]; }
      if (kp === "H") return [[q[0], p[1]]];
      if (kp === "V") return [[p[0], q[1]]];
      return kq === "H" ? [[p[0], q[1]]] : [[q[0], p[1]]];
    }
    function orthoD(pts, radius) {
      var d = "M " + fp(pts[0]);
      for (var i = 1; i < pts.length; i++) {
        var c = pts[i];
        if (i === pts.length - 1) { d += " L " + fp(c); break; }
        var p = pts[i - 1], n = pts[i + 1], lp = Math.hypot(c[0] - p[0], c[1] - p[1]), ln = Math.hypot(n[0] - c[0], n[1] - c[1]);
        var rc = Math.min(radius, lp / 2, ln / 2);
        if (rc > 0) {
          d += " L " + fp([c[0] + (p[0] - c[0]) / lp * rc, c[1] + (p[1] - c[1]) / lp * rc]) +
            " Q " + fp(c) + " " + fp([c[0] + (n[0] - c[0]) / ln * rc, c[1] + (n[1] - c[1]) / ln * rc]);
        } else d += " L " + fp(c);
      }
      return d;
    }
    // Same-direction control offsets at both ends; start/end normals are null when an end has no side (points input).
    function curve(anchors, n0, n1) {
      var d = "M " + fp(anchors[0]), segs = [];
      for (var i = 1; i < anchors.length; i++) {
        var p = anchors[i - 1], q = anchors[i], t = 0.5 * Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1]));
        var o = i === 1 && n0 ? n0 : unit(q[0] - p[0], q[1] - p[1]), bk = i === anchors.length - 1 && n1 ? n1 : unit(p[0] - q[0], p[1] - q[1]);
        var c1 = [p[0] + o[0] * t, p[1] + o[1] * t], c2 = [q[0] + bk[0] * t, q[1] + bk[1] * t];
        d += " C " + fp(c1) + " " + fp(c2) + " " + fp(q);
        segs.push([p, c1, c2, q]);
      }
      return { d: d, segs: segs };
    }
    function bez(s, t) {
      var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, e = t * t * t;
      return [a * s[0][0] + b * s[1][0] + c * s[2][0] + e * s[3][0], a * s[0][1] + b * s[1][1] + c * s[2][1] + e * s[3][1]];
    }
    function midpoint(poly) {
      var total = 0, i, len = [];
      for (i = 1; i < poly.length; i++) { len.push(Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1])); total += len[i - 1]; }
      if (poly.length === 2) return [(poly[0][0] + poly[1][0]) / 2, (poly[0][1] + poly[1][1]) / 2];
      var half = total / 2;
      for (i = 0; i < len.length; i++) {
        if (half <= len[i] && len[i] > 0) {
          var f = half / len[i];
          return [poly[i][0] + (poly[i + 1][0] - poly[i][0]) * f, poly[i][1] + (poly[i + 1][1] - poly[i][1]) * f];
        }
        half -= len[i];
      }
      return poly[poly.length - 1].slice();
    }

    var edges = raw.map(function (e, i) {
      var id = e.id != null ? e.id : e.f + ">" + e.t, shape = e.shape == null ? "straight" : e.shape;
      var a = nodes[e.f], b = nodes[e.t], off = offs[i] || [0, 0];
      var via = (e.via || []).map(function (v) { return G(v[0], v[1]); });
      var pts, d, poly;
      if (Array.isArray(e.points)) {
        var anc = e.points.map(function (p) { return [pad + p[0], pad + p[1]]; });
        if (shape === "curve") { var cv = curve(anc, null, null); pts = anc; d = cv.d; poly = sample(cv.segs); }
        else if (shape === "ortho") {
          var list = [anc[0]];
          for (var k = 1; k < anc.length; k++) { list = list.concat(kinks(anc[k - 1], "F", anc[k], "F")); list.push(anc[k]); }
          pts = cleanOrtho(list); d = orthoD(pts, e.radius == null ? 10 : e.radius); poly = pts;
        } else { pts = anc; d = "M " + pts.map(fp).join(" L "); poly = pts; }
      } else if (shape === "straight") {
        var sa = a, sb = b;
        if (off[0] || off[1]) { sa = shifted(a, off[0], off[1]); sb = shifted(b, off[0], off[1]); }
        var p, q;
        if (e.from != null) p = side(sa, e.from, 4);
        else p = via.length ? clip(sa, via[0][0] - sa.cx, via[0][1] - sa.cy, 4) : clip(sa, sb.cx - sa.cx, sb.cy - sa.cy, 4);
        if (e.to != null) q = side(sb, e.to, 8);
        else q = via.length ? clip(sb, via[via.length - 1][0] - sb.cx, via[via.length - 1][1] - sb.cy, 8) : clip(sb, sa.cx - sb.cx, sa.cy - sb.cy, 8);
        pts = [p].concat(via, [q]); d = "M " + pts.map(fp).join(" L "); poly = pts;
      } else {
        var t0 = via.length ? via[0] : [b.cx, b.cy], t1 = via.length ? via[via.length - 1] : [a.cx, a.cy];
        var s0 = e.from != null ? e.from : infer(t0[0] - a.cx, t0[1] - a.cy), s1 = e.to != null ? e.to : infer(t1[0] - b.cx, t1[1] - b.cy);
        var hz0 = s0 === "left" || s0 === "right", hz1 = s1 === "left" || s1 === "right";
        var st = side(a, s0, 4), en = side(b, s1, 8);
        if (hz0) st[1] += off[1]; else st[0] += off[0];
        if (hz1) en[1] += off[1]; else en[0] += off[0];
        var anchors = [st].concat(via, [en]), kinds = ["F"];
        via.forEach(function () { kinds.push("F"); });
        kinds[0] = hz0 ? "H" : "V"; kinds.push(hz1 ? "H" : "V");
        if (shape === "curve") { var cc = curve(anchors, SIDES[s0], SIDES[s1]); pts = anchors; d = cc.d; poly = sample(cc.segs); }
        else {
          var lst = [anchors[0]];
          for (var j = 1; j < anchors.length; j++) { lst = lst.concat(kinks(anchors[j - 1], kinds[j - 1], anchors[j], kinds[j])); lst.push(anchors[j]); }
          pts = cleanOrtho(lst); d = orthoD(pts, e.radius == null ? 10 : e.radius); poly = pts;
        }
      }
      var mid = midpoint(poly), last = pts[pts.length - 1];
      return { id: id, f: e.f, t: e.t, shape: shape, x1: pts[0][0], y1: pts[0][1], x2: last[0], y2: last[1], pts: pts, d: d, lx: mid[0], ly: mid[1] };
    });
    function sample(segs) {
      var poly = [segs[0][0]];
      segs.forEach(function (s) { for (var k = 1; k <= 48; k++) poly.push(bez(s, k / 48)); });
      return poly;
    }

    var zs = spec.zones || [], zid = [], zseen = {}, zout = [], zstate = [];
    zs.forEach(function (z, i) {
      var id = z.id != null ? z.id : "z" + i;
      if (zseen.hasOwnProperty(id)) throw new Error("diagram zone id " + id + " is duplicated");
      zseen[id] = i; zid.push(id);
    });
    function zone(i) {
      if (zout[i]) return zout[i];
      var z = zs[i], id = zid[i];
      if (zstate[i]) throw new Error("diagram zone " + id + " is in a parent cycle");
      zstate[i] = 1;
      var par = null;
      if (z.parent != null) {
        if (!zseen.hasOwnProperty(z.parent)) throw new Error("diagram zone " + id + " has unknown parent " + z.parent);
        par = zone(zseen[z.parent]);
      }
      var depth = par ? par.depth + 1 : 0, inset = 6 + 10 * depth, x, y, w, h;
      var zpx = ["x", "y", "w", "h"].every(function (k) { return typeof z[k] === "number"; });
      if (!zpx && !["c0", "r0", "c1", "r1"].every(function (k) { return typeof z[k] === "number"; })) throw new Error("diagram zone " + id + " has no position (x, y, w, h or c0, r0, c1, r1)");
      if (zpx) { x = pad + z.x; y = pad + z.y; w = z.w; h = z.h; pxW = Math.max(pxW, x + w + pad); pxH = Math.max(pxH, y + h + pad); }
      else {
        x = pad + z.c0 * cell[0] + inset; y = pad + z.r0 * cell[1] + inset;
        w = (z.c1 - z.c0 + 1) * cell[0] - 2 * inset; h = (z.r1 - z.r0 + 1) * cell[1] - 2 * inset;
      }
      if (par) {
        var pl = zs[zseen[z.parent]].l, x0 = Math.max(x, par.x + 10), y0 = Math.max(y, par.y + (pl ? 26 : 10));
        var x1 = Math.min(x + w, par.x + par.w - 10), y1 = Math.min(y + h, par.y + par.h - 10);
        x = x0; y = y0; w = x1 - x0; h = y1 - y0;
        if (w <= 0 || h <= 0) throw new Error("diagram zone " + id + " does not fit inside its parent " + z.parent);
      }
      return (zout[i] = { id: id, parent: z.parent != null ? z.parent : null, depth: depth, x: x, y: y, w: w, h: h });
    }
    var zones = zs.map(function (z, i) { return zone(i); });

    var width = spec.width != null ? spec.width : Math.max(pad * 2 + (spec.cols != null ? spec.cols : gridCols) * cell[0], pxW);
    var height = spec.height != null ? spec.height : Math.max(pad * 2 + (spec.rows != null ? spec.rows : gridRows) * cell[1], pxH);
    return { width: width, height: height, nodes: nodes, edges: edges, zones: zones };
  }

  // Box-and-arrow diagram from a grid spec (see diagramLayout); `player` turns it into a captioned step replay.
  function diagram(svgEl, spec) {
    var L = diagramLayout(spec), uid = "dg" + Math.random().toString(36).slice(2, 8);
    var svg = d3.select(el(svgEl)).classed("ltt-svg ltt-dg", true).attr("viewBox", "0 0 " + L.width + " " + L.height)
      .attr("role", "img").attr("aria-label", spec.label || null);
    if (spec.maxWidth !== false) svg.style("max-width", (spec.maxWidth || L.width) + "px");
    var defs = svg.append("defs");
    ["", "accent", "good", "bad", "warn"].forEach(function (k) {
      defs.append("marker").attr("id", uid + "-m" + k).attr("viewBox", "0 0 10 10").attr("refX", 8).attr("refY", 5)
        .attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto-start-reverse")
        .append("path").attr("d", "M1 1L9 5L1 9z").style("fill", k ? "var(--ltt-" + k + ")" : "var(--ltt-line-2)");
    });
    var gZones = svg.append("g"), gEdges = svg.append("g"), gNodes = svg.append("g"), gPackets = svg.append("g");
    // Under the sketch theme (or spec.sketch: true) with rough.js loaded, strokes are redrawn by hand while the plain
    // shapes stay underneath for fills, markers and packet paths. Seeds are fixed so a page redraws identically.
    var themed = svgEl && svgEl.closest ? svgEl.closest("[data-ltt-theme]") : null;
    var gen = root.rough && (spec.sketch === true || (spec.sketch !== false && themed && themed.getAttribute("data-ltt-theme") === "sketch")) ? root.rough.generator() : null, seed = 0;
    svg.classed("rk", !!gen);
    function scribble(parent, drawable, cls) {
      var out = null;
      gen.toPaths(drawable).forEach(function (p) {
        if (p.stroke === "none") return;
        out = parent.append("path").attr("class", "rkl" + (cls ? " " + cls : "")).attr("d", p.d);
      });
      return out;
    }
    function rough(kind, args) { return gen[kind].apply(gen, args.concat([{ seed: ++seed, roughness: 1.1, bowing: 0.8, stroke: "#000", strokeWidth: 1 }])); }
    // Parents paint before children so nested zones stay visible; stable sort keeps input order within a depth.
    d3.range((spec.zones || []).length).sort(function (a, b) { return L.zones[a].depth - L.zones[b].depth || a - b; }).forEach(function (i) {
      var z = spec.zones[i], b = L.zones[i], g = gZones.append("g").attr("class", "z" + (z.k ? " k-" + z.k : ""));
      g.append("rect").attr("x", b.x).attr("y", b.y).attr("width", b.w).attr("height", b.h).attr("rx", 18);
      if (gen) scribble(g, rough("rectangle", [b.x, b.y, b.w, b.h]));
      if (z.l) g.append("text").attr("x", b.x + 14).attr("y", b.y + 18).text(z.l);
    });
    var edgeSel = {}, byPair = {};
    (spec.edges || []).forEach(function (e, i) {
      var g = L.edges[i], k = e.flaw ? "bad" : e.k || "";
      var line = gEdges.append("path").attr("class", "e" + (k ? " k-" + k : "") + (e.dash ? " dash" : "")).attr("d", g.d)
        .attr("marker-end", e.arrow === false ? null : "url(#" + uid + "-m" + (/^(accent|good|bad|warn)$/.test(k) ? k : "") + ")");
      if (e.both) line.attr("marker-start", "url(#" + uid + "-m" + (/^(accent|good|bad|warn)$/.test(k) ? k : "") + ")");
      var rk = gen ? scribble(gEdges, rough("path", [g.d]), "e" + (k ? " k-" + k : "") + (e.dash ? " dash" : "")) : null;
      var label = null;
      if (e.l) {
        var lo = e.lo || [0, -8];
        label = gEdges.append("text").attr("class", "el").attr("text-anchor", "middle")
          .attr("x", g.lx + lo[0]).attr("y", g.ly + lo[1]).text(e.l);
      }
      edgeSel[g.id] = byPair[e.f + ">" + e.t] = { line: line, rk: rk, label: label, geo: g };
    });
    var nodeSel = {};
    spec.nodes.forEach(function (n) {
      var b = L.nodes[n.id];
      var g = gNodes.append("g").attr("class", "n" + (n.k ? " k-" + n.k : "") + (n.flaw ? " flaw" : ""))
        .attr("transform", "translate(" + b.x + "," + b.y + ")");
      g.append("rect").attr("class", "box").attr("width", b.w).attr("height", b.h).attr("rx", Math.min(14, b.h / 2));
      if (n.ring) g.append("rect").attr("class", "ring").attr("x", 4).attr("y", 4).attr("width", b.w - 8).attr("height", b.h - 8).attr("rx", Math.max(0, Math.min(14, b.h / 2) - 4));
      if (gen) {
        scribble(g, b.h <= 30 && b.w <= 30 ? rough("ellipse", [b.w / 2, b.h / 2, b.w, b.h]) : rough("rectangle", [0, 0, b.w, b.h]));
        if (n.ring) scribble(g, rough("rectangle", [4, 4, b.w - 8, b.h - 8]));
      }
      var tx = b.w / 2, anchor = "middle";
      if (n.icon && LTT.icon) {
        var s = Math.min(26, b.h - 20);
        g.append("g").attr("class", "ic").attr("transform", "translate(14," + (b.h - s) / 2 + ")")
          .html(LTT.icon(n.icon).replace("<svg ", "<svg width='" + s + "' height='" + s + "' "));
        tx = 14 + s + 10; anchor = "start";
      }
      var multi = b.lines.length > 1 || b.sub.length > 1, top = b.h / 2 - (18 * b.lines.length + 16 * b.sub.length) / 2;
      function block(cls, rows, y0, step) {
        var t = g.append("text").attr("class", cls).attr("text-anchor", anchor);
        rows.forEach(function (row, j) { t.append("tspan").attr("x", tx).attr("y", y0 + step * j).text(row); });
      }
      block("l", b.lines, multi ? top + 13 : b.sub.length ? b.h / 2 - 3 : b.h / 2 + 5, 18);
      if (b.sub.length) block("s", b.sub, multi ? top + 18 * b.lines.length + 12 : b.h / 2 + 14, 16);
      if (n.flaw) {
        var f = g.append("g").attr("transform", "translate(" + (b.w - 4) + ",4)");
        f.append("circle").attr("r", 9).style("fill", "var(--ltt-bad)");
        f.append("text").attr("text-anchor", "middle").attr("y", 4).style("fill", "#fff").style("font-weight", 800).style("font-size", "12px").text("!");
      }
      nodeSel[n.id] = g;
    });
    // Returns t in [0,1] -> point along the edge's drawn path (reversed for a to->from edge), or the centre line when no edge exists.
    function track(from, to) {
      var e = byPair[from + ">" + to], r = false;
      if (!e) { e = byPair[to + ">" + from]; r = !!e; }
      if (e) {
        var path = e.line.node(), len = path.getTotalLength();
        return function (t) { var q = path.getPointAtLength(len * (r ? 1 - t : t)); return [q.x, q.y]; };
      }
      var a = L.nodes[from], b = L.nodes[to];
      return function (t) { return [a.cx + (b.cx - a.cx) * t, a.cy + (b.cy - a.cy) * t]; };
    }
    var api = {
      svg: svg,
      layout: L,
      node: function (id) { return nodeSel[id]; },
      edge: function (id) { return edgeSel[id] && edgeSel[id].line; },
      // Ids may name nodes or edges ("from>to" or the edge's id); everything else dims. No ids clears the focus.
      highlight: function (ids) {
        var on = ids && ids.length ? ids : null;
        Object.keys(nodeSel).forEach(function (id) {
          nodeSel[id].classed("dim", !!on && on.indexOf(id) < 0).classed("hot", !!on && on.indexOf(id) >= 0);
        });
        Object.keys(edgeSel).forEach(function (id) {
          var e = edgeSel[id], lit = !on || on.indexOf(id) >= 0 || (on.indexOf(e.geo.f) >= 0 && on.indexOf(e.geo.t) >= 0);
          e.line.classed("dim", !lit);
          if (e.rk) e.rk.classed("dim", !lit);
          if (e.label) e.label.classed("dim", !lit);
        });
      },
      // Marching dashes show direction of travel only; pass [] to stop them.
      flow: function (ids) {
        Object.keys(edgeSel).forEach(function (id) {
          var on = (ids || []).indexOf(id) >= 0;
          edgeSel[id].line.classed("run", on);
          if (edgeSel[id].rk) edgeSel[id].rk.classed("run", on);
        });
      },
      // Resolves when the last packet arrives; with reduced motion it resolves immediately.
      send: function (from, to, o) {
        o = o || {};
        var n = o.count || 5, ms = o.ms || 900, gap = o.gap || 120;
        if (!MOTION_MS) return Promise.resolve();
        var at = track(from, to), a = at(0);
        return new Promise(function (done) {
          d3.range(n).forEach(function (k) {
            gPackets.append("circle").attr("class", "pk").attr("r", o.r || 5.5).style("fill", o.color || "var(--ltt-accent)")
              .attr("cx", a[0]).attr("cy", a[1]).attr("opacity", 0)
              .transition().delay(k * gap).duration(ms).ease(d3.easeCubicInOut)
              .tween("path", function () {
                var c = this;
                return function (t) { var q = at(t); c.setAttribute("cx", q[0]); c.setAttribute("cy", q[1]); };
              }).attr("opacity", 1).remove()
              .on("end", function () { if (k === n - 1) done(); })
              .on("interrupt", function () { if (k === n - 1) done(); });
          });
        });
      },
      clear: function () { gPackets.selectAll("*").interrupt().remove(); },
      // steps: [{caption, hot, flow, send: [[from, to, opts], ...], enter(diagram, i)}]; sends run one after another.
      player: function (container, steps, opts) {
        var run = 0;
        return stepper(container, steps.map(function (st) {
          return {
            caption: st.caption,
            enter: function (i) {
              var id = ++run;
              api.clear(); api.highlight(st.hot || null); api.flow(st.flow || []);
              (st.send || []).reduce(function (p, s) {
                return p.then(function () { return id === run ? api.send(s[0], s[1], s[2]) : null; });
              }, Promise.resolve());
              if (st.enter) st.enter(api, i);
            }
          };
        }), opts);
      }
    };
    return api;
  }

  // 2D plane that morphs a unit grid and vectors under a 2x2 matrix [[a,b],[c,d]] (column vectors i-hat=(a,c), j-hat=(b,d)).
  function plane(svgEl, o) {
    o = o || {};
    var R = o.range || 4, S = o.size || 360;
    var svg = d3.select(el(svgEl)).attr("class", "ltt-svg").attr("viewBox", [-S / 2, -S / 2, S, S].join(" "))
      .style("max-width", S + "px");
    var k = S / (2 * R);
    var px = function (p) { return [p[0] * k, -p[1] * k]; };
    svg.append("g").selectAll("line").data(d3.range(-R, R + 1)).join("line")
      .attr("x1", function (t) { return t * k; }).attr("x2", function (t) { return t * k; }).attr("y1", -S / 2).attr("y2", S / 2)
      .attr("stroke", "var(--ltt-line)").attr("stroke-width", 1);
    svg.append("g").selectAll("line").data(d3.range(-R, R + 1)).join("line")
      .attr("y1", function (t) { return t * k; }).attr("y2", function (t) { return t * k; }).attr("x1", -S / 2).attr("x2", S / 2)
      .attr("stroke", "var(--ltt-line)").attr("stroke-width", 1);
    var gGrid = svg.append("g"), gShape = svg.append("g"), gVec = svg.append("g");
    var M = [[1, 0], [0, 1]], vectors = o.vectors || [], shape = o.shape || null;
    var apply = function (m, v) { return [m[0][0] * v[0] + m[0][1] * v[1], m[1][0] * v[0] + m[1][1] * v[1]]; };
    function draw(m) {
      var lines = [];
      d3.range(-R, R + 1).forEach(function (t) {
        lines.push([apply(m, [t, -R]), apply(m, [t, R]), t === 0]);
        lines.push([apply(m, [-R, t]), apply(m, [R, t]), t === 0]);
      });
      gGrid.selectAll("line").data(lines).join("line")
        .attr("x1", function (l) { return px(l[0])[0]; }).attr("y1", function (l) { return px(l[0])[1]; })
        .attr("x2", function (l) { return px(l[1])[0]; }).attr("y2", function (l) { return px(l[1])[1]; })
        .attr("stroke", function (l) { return l[2] ? "var(--ltt-muted)" : "color-mix(in srgb,var(--ltt-accent) 30%,var(--ltt-card))"; })
        .attr("stroke-width", function (l) { return l[2] ? 1.5 : 1; });
      if (shape) {
        gShape.selectAll("path").data([shape]).join("path")
          .attr("d", function (pts) { return "M" + pts.map(function (p) { return px(apply(m, p)).join(","); }).join("L") + "Z"; })
          .attr("fill", o.shapeFill || "color-mix(in srgb,var(--ltt-accent) 18%,transparent)").attr("stroke", "var(--ltt-accent)");
      }
      var vs = gVec.selectAll("g").data(vectors).join(function (enter) {
        var g = enter.append("g");
        g.append("line").attr("stroke-width", 3).attr("stroke-linecap", "round");
        g.append("circle").attr("r", 4.5);
        g.append("text").style("font-weight", 700);
        return g;
      });
      vs.each(function (v) {
        var p = px(v.fixed ? v.v : apply(m, v.v)), g = d3.select(this);
        g.select("line").attr("x1", 0).attr("y1", 0).attr("x2", p[0]).attr("y2", p[1]).attr("stroke", v.color || "var(--ltt-accent)");
        g.select("circle").attr("cx", p[0]).attr("cy", p[1]).attr("fill", v.color || "var(--ltt-accent)");
        g.select("text").attr("x", p[0] + 7).attr("y", p[1] - 7).style("fill", v.color || null).text(v.label || "");
      });
    }
    draw(M);
    return {
      apply: apply,
      get matrix() { return M; },
      setVectors: function (v) { vectors = v; draw(M); },
      setShape: function (s) { shape = s; draw(M); },
      // Linear interpolation between matrices, so the grid visibly slides from the old to the new transform.
      to: function (m, ms) {
        var from = M; M = m;
        var dur = ms == null ? MOTION_MS * 1.4 : (MOTION_MS ? ms : 0);
        if (!dur) { draw(m); return Promise.resolve(); }
        return new Promise(function (done) {
          d3.select(gGrid.node()).interrupt().transition().duration(dur).ease(d3.easeCubicInOut).tween("m", function () {
            return function (t) {
              draw([[from[0][0] + (m[0][0] - from[0][0]) * t, from[0][1] + (m[0][1] - from[0][1]) * t],
                    [from[1][0] + (m[1][0] - from[1][0]) * t, from[1][1] + (m[1][1] - from[1][1]) * t]]);
            };
          }).on("end", done).on("interrupt", done);
        });
      }
    };
  }

  // Fixed-step simulation loop; under reduced motion it computes to the end and draws only the final state.
  function sim(o) {
    var state, raf = null, t = 0, acc = 0, last = 0;
    var dt = o.dt || 1 / 120, speed = o.speed || 1;
    function reset() { stop(); state = o.init(); t = 0; o.draw(state, t); return state; }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
    function done() { return o.until ? o.until(state, t) : false; }
    function frame(now) {
      acc += Math.min(0.1, (now - last) / 1000) * speed;
      last = now;
      while (acc >= dt && !done()) { state = o.step(state, dt, t); t += dt; acc -= dt; }
      o.draw(state, t);
      if (done()) { stop(); if (o.onEnd) o.onEnd(state, t); } else raf = requestAnimationFrame(frame);
    }
    function start() {
      reset();
      if (!MOTION_MS) {
        var guard = 0;
        while (!done() && guard++ < 1e6) { state = o.step(state, dt, t); t += dt; }
        o.draw(state, t);
        if (o.onEnd) o.onEnd(state, t);
        return;
      }
      last = performance.now(); acc = 0;
      raf = requestAnimationFrame(frame);
    }
    function runToEnd() {
      var s = o.init(), tt = 0, guard = 0;
      while (!(o.until ? o.until(s, tt) : true) && guard++ < 1e6) { s = o.step(s, dt, tt); tt += dt; }
      return { state: s, t: tt };
    }
    reset();
    return { start: start, stop: stop, reset: reset, runToEnd: runToEnd, get state() { return state; } };
  }

  // Sequence-diagram geometry. items are in time order: messages {f, t, l, kind: "sync"|"async"|"reply", k, id} or notes {note, over: [ids]}.
  // A sync message opens an activation bar on its target; the next reply from that actor closes it. Self messages (f === t) loop on the right.
  function sequenceLayout(spec) {
    var col = spec.col || 200, row = spec.row || 46, pad = spec.pad == null ? 20 : spec.pad, head = spec.head || 54, bw = spec.actorW || 150;
    var actors = {}, order = spec.actors.map(function (a) { return a.id; });
    spec.actors.forEach(function (a, i) { actors[a.id] = { x: pad + (i + 0.5) * col, i: i }; });
    var y = pad + head + row * 0.8, items = [], open = {}, acts = [];
    function need(id, what) { if (!actors[id]) throw new Error("sequence " + what + " names a missing actor '" + id + "'"); return actors[id]; }
    function depth(id) { return (open[id] || []).length; }
    (spec.items || spec.messages || []).forEach(function (m, i) {
      if (m.note != null) {
        var over = (m.over || [order[0]]).map(function (id) { return need(id, "note").x; });
        var x0 = Math.min.apply(null, over) - (over.length > 1 ? 20 : bw / 2), x1 = Math.max.apply(null, over) + (over.length > 1 ? 20 : bw / 2);
        items.push({ i: i, type: "note", x: x0, y: y - row * 0.36, w: x1 - x0, h: row * 0.72, cx: (x0 + x1) / 2, cy: y });
        y += row;
        return;
      }
      var a = need(m.f, "message " + (m.id || i)), b = need(m.t, "message " + (m.id || i)), kind = m.kind || "sync", self = m.f === m.t;
      var off = function (id, dir) { var d = depth(id); return d ? dir * (5 + (d - 1) * 5) : 0; };
      var dir = b.x >= a.x ? 1 : -1, x1 = a.x + off(m.f, self ? 1 : dir), item;
      if (kind === "reply" && open[m.f] && open[m.f].length) {
        var st = open[m.f].pop();
        acts.push({ actor: m.f, x: a.x + (st.d - 1) * 5 - 5, y1: st.y, y2: y, d: st.d });
      }
      if (self) {
        var x2 = a.x + off(m.f, 1);
        item = { x1: x1, x2: x2, y: y, y2: y + row * 0.6, d: "M" + x1 + "," + y + "H" + (x1 + 40) + "V" + (y + row * 0.6) + "H" + (x2 + 2), lx: x1 + 46, ly: y + row * 0.3 + 4, anchor: "start" };
      } else {
        var x2 = b.x - off(m.t, dir) - dir * 2;
        if (kind === "sync") x2 -= dir * 5;
        item = { x1: x1, x2: x2, y: y, d: "M" + x1 + "," + y + "H" + x2, lx: (x1 + x2) / 2, ly: y - 7, anchor: "middle" };
      }
      item.i = i; item.type = "msg"; item.id = m.id || m.f + ">" + m.t + "#" + i; item.f = m.f; item.t = m.t; item.kind = kind;
      items.push(item);
      if (kind === "sync" && !self) (open[m.t] = open[m.t] || []).push({ y: y, d: depth(m.t) + 1 });
      y += self ? row * 1.4 : row;
    });
    Object.keys(open).forEach(function (id) {
      open[id].forEach(function (st) { acts.push({ actor: id, x: actors[id].x + (st.d - 1) * 5 - 5, y1: st.y, y2: y - row * 0.5, d: st.d }); });
    });
    var byId = {};
    items.forEach(function (it) { if (it.type === "msg") byId[it.id] = it; });
    var spans = (spec.spans || []).map(function (sp) {
      var a = byId[sp.from], b = byId[sp.to];
      if (!a || !b) throw new Error("sequence span names a missing message '" + (a ? sp.to : sp.from) + "'");
      return { y1: a.y, y2: b.y, x: pad + 4, l: sp.l, k: sp.k };
    });
    Object.keys(actors).forEach(function (id) { actors[id].top = pad; actors[id].bottom = y; });
    return { width: pad * 2 + order.length * col, height: y + pad - row * 0.2, head: head, actorW: bw, actors: actors, items: items, activations: acts, spans: spans };
  }

  // Lifelines and messages; `player` reveals messages in order (steps: [{caption, upto, hot}], upto = items shown, default i + 1).
  function sequence(svgEl, spec) {
    var L = sequenceLayout(spec), uid = "sq" + Math.random().toString(36).slice(2, 8), pad = spec.pad == null ? 20 : spec.pad;
    var spanW = (spec.spans || []).length ? 64 : 0;
    var svg = d3.select(el(svgEl)).classed("ltt-svg ltt-seq", true).attr("viewBox", [-spanW, 0, L.width + spanW, L.height].join(" "))
      .attr("role", "img").attr("aria-label", spec.label || null);
    if (spec.maxWidth !== false) svg.style("max-width", (spec.maxWidth || L.width + spanW) + "px");
    var defs = svg.append("defs");
    ["", "accent", "good", "bad", "warn"].forEach(function (k) {
      var c = k ? "var(--ltt-" + k + ")" : "var(--ltt-ink-2)";
      defs.append("marker").attr("id", uid + "-f" + k).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerWidth", 7).attr("markerHeight", 7)
        .attr("orient", "auto").append("path").attr("d", "M1 1L9 5L1 9z").style("fill", c);
      defs.append("marker").attr("id", uid + "-o" + k).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerWidth", 8).attr("markerHeight", 8)
        .attr("orient", "auto").append("path").attr("d", "M1 1L9 5L1 9").style("fill", "none").style("stroke", c).style("stroke-width", 1.5);
    });
    var gLife = svg.append("g"), gBars = svg.append("g"), gItems = svg.append("g"), gSpans = svg.append("g"), gPk = svg.append("g");
    spec.actors.forEach(function (a) {
      var p = L.actors[a.id];
      gLife.append("line").attr("class", "life").attr("x1", p.x).attr("x2", p.x).attr("y1", p.top + L.head).attr("y2", p.bottom);
      var g = gLife.append("g").attr("class", "act" + (a.k ? " k-" + a.k : "")).attr("transform", "translate(" + (p.x - L.actorW / 2) + "," + p.top + ")");
      g.append("rect").attr("width", L.actorW).attr("height", L.head).attr("rx", Math.min(12, L.head / 2));
      var tx = L.actorW / 2, anchor = "middle";
      if (a.icon && LTT.icon) {
        g.append("g").attr("class", "ic").attr("transform", "translate(12," + (L.head - 22) / 2 + ")").style("color", "currentColor")
          .html(LTT.icon(a.icon).replace("<svg ", "<svg width='22' height='22' "));
        tx = 12 + 22 + 8; anchor = "start";
      }
      g.append("text").attr("class", "l").attr("x", tx).attr("y", a.s ? L.head / 2 - 2 : L.head / 2 + 5).attr("text-anchor", anchor).text(a.l || a.id);
      if (a.s) g.append("text").attr("class", "s").attr("x", tx).attr("y", L.head / 2 + 14).attr("text-anchor", anchor).text(a.s);
    });
    var src = spec.items || spec.messages || [], barSel = L.activations.map(function (b) {
      return { geo: b, node: gBars.append("rect").attr("class", "bar").attr("x", b.x).attr("y", b.y1).attr("width", 10).attr("height", Math.max(6, b.y2 - b.y1)).attr("rx", 2) };
    });
    var itemSel = L.items.map(function (it) {
      var m = src[it.i], k = m.flaw ? "bad" : m.k || "", tone = /^(accent|good|bad|warn)$/.test(k) ? k : "";
      if (it.type === "note") {
        var gn = gItems.append("g").attr("class", "note");
        gn.append("rect").attr("x", it.x).attr("y", it.y).attr("width", it.w).attr("height", it.h).attr("rx", 4);
        gn.append("text").attr("x", it.cx).attr("y", it.cy + 4).attr("text-anchor", "middle").text(m.note);
        return { it: it, node: gn };
      }
      var g = gItems.append("g").attr("class", "msg " + it.kind + (k ? " k-" + k : ""));
      g.append("path").attr("d", it.d).attr("marker-end", "url(#" + uid + (it.kind === "async" ? "-o" : "-f") + tone + ")");
      if (m.l) g.append("text").attr("x", it.lx).attr("y", it.ly).attr("text-anchor", it.anchor).text(m.l);
      return { it: it, node: g };
    });
    L.spans.forEach(function (sp) {
      var g = gSpans.append("g").attr("class", "span" + (sp.k ? " k-" + sp.k : "")), x = -6;
      g.append("path").attr("d", "M" + (x + 6) + "," + sp.y1 + "H" + x + "V" + sp.y2 + "H" + (x + 6));
      g.append("text").attr("x", x - 6).attr("y", (sp.y1 + sp.y2) / 2 + 4).attr("text-anchor", "end").text(sp.l || "");
    });
    var api = {
      svg: svg, layout: L,
      // Shows the first n items (null shows all); activation bars and spans appear once their opening message is shown.
      show: function (n) {
        var lastY = n == null || n >= L.items.length ? Infinity : n > 0 ? L.items[n - 1].y : -Infinity;
        itemSel.forEach(function (s, j) { s.node.classed("later", n != null && j >= n); });
        barSel.forEach(function (b) { b.node.classed("later", b.geo.y1 > lastY); });
        gSpans.selectAll(".span").each(function (d, j) { d3.select(this).classed("later", L.spans[j].y2 > lastY); });
      },
      // Ids name messages (their id, or "f>t#index") or actors; other messages dim.
      highlight: function (ids) {
        var on = ids && ids.length ? ids : null;
        itemSel.forEach(function (s) {
          if (s.it.type !== "msg") return;
          var lit = !on || on.indexOf(s.it.id) >= 0 || on.indexOf(s.it.f) >= 0 && on.indexOf(s.it.t) >= 0;
          s.node.classed("dim", !lit).classed("hot", !!on && lit);
        });
      },
      send: function (id, o) {
        o = o || {};
        var s = itemSel.filter(function (x) { return x.it.id === id; })[0];
        if (!s || !MOTION_MS) return Promise.resolve();
        var node = s.node.select("path").node(), len = node.getTotalLength();
        return new Promise(function (done) {
          gPk.append("circle").attr("r", o.r || 5).style("fill", o.color || "var(--ltt-accent)")
            .transition().duration(o.ms || 700).ease(d3.easeCubicInOut)
            .attrTween("transform", function () { return function (t) { var q = node.getPointAtLength(t * len); return "translate(" + q.x + "," + q.y + ")"; }; })
            .remove().on("end", done).on("interrupt", done);
        });
      },
      player: function (container, steps, opts) {
        return stepper(container, steps.map(function (st, i) {
          return { caption: st.caption, enter: function (k) {
            gPk.selectAll("*").interrupt().remove();
            var upto = st.upto == null ? i + 1 : st.upto;
            api.show(upto); api.highlight(st.hot || null);
            var last = L.items[upto - 1];
            if (st.send !== false && last && last.type === "msg") api.send(last.id);
            if (st.enter) st.enter(api, k);
          } };
        }), opts);
      }
    };
    return api;
  }

  // Axes with fixed domains so curves are compared against the same frame; `equal` uses one scale for x and y (shapes stay true).
  function axisPlot(target, o) {
    var W = o.width || 560, H = o.height || 200, M = Object.assign({ l: 40, r: 12, t: 10, b: 30 }, o.margin || {});
    var xd = o.x, sx = (W - M.l - M.r) / (xd[1] - xd[0]), yd = o.y || [0];
    if (o.equal || yd.length < 2) yd = [yd[0], yd[0] + (H - M.t - M.b) / sx];
    var x = d3.scaleLinear(xd, [M.l, W - M.r]), y = d3.scaleLinear(yd, [H - M.b, M.t]);
    var px = function (p) { return [x(p[0]), y(p[1])]; };
    var node = el(target), svg = (node.tagName && node.tagName.toLowerCase() === "svg" ? d3.select(node) : d3.select(node).append("svg"))
      .classed("ltt-svg ltt-axplot", true).classed(o.cls || "", !!o.cls).attr("viewBox", "0 0 " + W + " " + H);
    var ticks = o.ticks || [6, 4], fx = o.xFormat || String, fy = o.yFormat || String;
    var xt = Array.isArray(ticks[0]) ? ticks[0] : x.ticks(ticks[0]), yt = Array.isArray(ticks[1]) ? ticks[1] : y.ticks(ticks[1]), g = svg.append("g").attr("class", "tk");
    if (o.grid !== false) {
      g.selectAll(".gx").data(xt).join("line").attr("x1", x).attr("x2", x).attr("y1", M.t).attr("y2", H - M.b);
      g.selectAll(".gy").data(yt).join("line").attr("y1", y).attr("y2", y).attr("x1", M.l).attr("x2", W - M.r);
    }
    g.selectAll(".lx").data(xt).join("text").attr("x", x).attr("y", H - M.b + 15).attr("text-anchor", "middle").text(fx);
    g.selectAll(".ly").data(yt.filter(function (d) { return d !== yd[0]; })).join("text").attr("x", M.l - 6).attr("y", function (d) { return y(d) + 4; }).attr("text-anchor", "end").text(fy);
    svg.append("path").attr("class", "frame").attr("d", "M" + M.l + "," + M.t + "V" + (H - M.b) + "H" + (W - M.r));
    var labels = o.labels || {};
    if (labels.x) svg.append("text").attr("class", "ax").attr("x", W - M.r).attr("y", H - 2).attr("text-anchor", "end").text(labels.x);
    if (labels.y) svg.append("text").attr("class", "ax").attr("x", M.l + 6).attr("y", M.t + 10).text(labels.y);
    var series = {};
    (o.series || []).forEach(function (sr, i) {
      var c = sr.color || (sr.k ? "var(--ltt-" + sr.k + ")" : "var(--ltt-c" + (i % 6 + 1) + ")");
      var path = svg.append("path").attr("class", "sr").style("stroke", c).attr("stroke-dasharray", sr.dash ? (sr.dash === true ? "6 5" : sr.dash) : null);
      var dot = sr.dot ? svg.append("circle").attr("r", 5).style("fill", c).style("opacity", 0) : null;
      series[sr.id] = { path: path, dot: dot };
    });
    return {
      svg: svg, x: x, y: y, px: px,
      set: function (id, pts) {
        var s = series[id];
        if (!s) throw new Error("axisPlot has no series '" + id + "'");
        s.path.attr("d", pts.length ? d3.line()(pts.map(px)) : null);
        if (s.dot) { var e = pts.length ? px(pts[pts.length - 1]) : null; s.dot.style("opacity", e ? 1 : 0).attr("cx", e && e[0]).attr("cy", e && e[1]); }
        return this;
      }
    };
  }

  // Bars on one shared time axis so a 300x gap reads as length (lanes: [{l, s, value, text, color | k}], axis: {max, step, fmt}).
  function lanes(target, o) {
    var W = o.width || 880, X0 = o.labelW || 230, X1 = W - (o.right || 40), laneH = o.laneH || 70, top = 22;
    var H = top + o.lanes.length * laneH + 48, base = top + o.lanes.length * laneH - 10, ax = o.axis, sc = (X1 - X0) / ax.max;
    var node = el(target), svg = (node.tagName && node.tagName.toLowerCase() === "svg" ? d3.select(node) : d3.select(node).append("svg"))
      .classed("ltt-svg ltt-lanes", true).attr("viewBox", "0 0 " + W + " " + H);
    var ticks = d3.range(0, ax.max + ax.step / 2, ax.step), fmt = ax.fmt || String;
    svg.append("g").selectAll("line").data(ticks).join("line").attr("class", "grid")
      .attr("x1", function (d) { return X0 + d * sc; }).attr("x2", function (d) { return X0 + d * sc; }).attr("y1", 10).attr("y2", base);
    svg.append("line").attr("class", "base").attr("x1", X0).attr("x2", X1).attr("y1", base).attr("y2", base);
    svg.append("g").selectAll("text").data(ticks).join("text").attr("x", function (d) { return X0 + d * sc; }).attr("y", base + 20).attr("text-anchor", "middle").text(fmt);
    var bars = o.lanes.map(function (ln, i) {
      var y = top + i * laneH, c = ln.color || (ln.k ? "var(--ltt-" + ln.k + ")" : "var(--ltt-c" + (i % 6 + 1) + ")");
      svg.append("text").attr("class", "ln").attr("x", 0).attr("y", y + 20).text(ln.l);
      if (ln.s) svg.append("text").attr("x", 0).attr("y", y + 38).text(ln.s);
      var r = svg.append("rect").attr("x", X0).attr("y", y).attr("height", 40).attr("width", 0).style("fill", c);
      var v = svg.append("text").attr("class", "val").attr("y", y + 25).style("fill", c).text(ln.text != null ? ln.text : fmt(ln.value));
      return { r: r, v: v, w: Math.max(2, ln.value * sc) };
    });
    function play() {
      bars.forEach(function (b) {
        b.r.interrupt().attr("width", 0).transition().duration(MOTION_MS * 2).attr("width", b.w);
        b.v.attr("x", X0 + b.w + 10);
      });
    }
    return { svg: svg, play: play };
  }

  // Horizontal bars on a fixed axis (domain), so every chart in a lesson is measured against the same reference.
  // rows: [{label, value, text, tone: "accent"|"bad"|"good"|"warn"|"floor"}]; "floor" draws a dashed outline for a lower bound.
  function hbars(target, o) {
    var W = o.width || 820, L = o.labelW || 250, R = o.right || 70, rowH = o.rowH || 54, top = 30, H = top + o.rows.length * rowH + 6;
    var x = d3.scaleLinear(o.domain, [L, W - R]), fmt = o.fmt || String;
    var node = el(target), svg = (node.tagName && node.tagName.toLowerCase() === "svg" ? d3.select(node) : d3.select(node).append("svg"))
      .classed("ltt-hbars", true).attr("viewBox", "0 0 " + W + " " + H).style("width", "100%").style("height", "auto").style("display", "block");
    var grid = svg.append("g").attr("class", "grid"), ticks = o.ticks || x.ticks(4), tf = o.tickFormat || String;
    ticks.forEach(function (t) {
      grid.append("line").attr("x1", x(t)).attr("x2", x(t)).attr("y1", top - 6).attr("y2", H);
      svg.append("text").attr("x", x(t)).attr("y", top - 12).attr("text-anchor", "middle").text(tf(t));
    });
    var bars = o.rows.map(function (r, k) {
      var y = top + k * rowH + 12, floor = r.tone === "floor", c = "var(--ltt-" + (floor || !r.tone ? "accent" : r.tone) + ")";
      svg.append("text").attr("class", "lab").attr("x", 0).attr("y", y + 19).text(r.label);
      var bar = svg.append("rect").attr("x", x(o.domain[0])).attr("y", y).attr("height", 28).attr("width", 0)
        .style("fill", floor ? "none" : c).style("stroke", floor ? c : "none").style("stroke-width", 2).style("stroke-dasharray", floor ? "5 4" : null);
      var val = svg.append("text").attr("class", "val").attr("x", x(o.domain[0]) + 8).attr("y", y + 20).text(r.text != null ? r.text : fmt(r.value));
      return { bar: bar, val: val, v: r.value };
    });
    svg.append("line").attr("class", "zero").attr("x1", x(o.domain[0])).attr("x2", x(o.domain[0])).attr("y1", top - 6).attr("y2", H);
    function play() {
      bars.forEach(function (b, k) {
        b.bar.interrupt().attr("width", 0); b.val.interrupt().attr("x", x(o.domain[0]) + 8).style("opacity", 0);
        b.bar.transition().delay(60 + k * 150).duration(MOTION_MS * 1.5).attr("width", x(b.v) - x(o.domain[0]));
        b.val.transition().delay(60 + k * 150).duration(MOTION_MS * 1.5).attr("x", x(b.v) + 8).style("opacity", 1);
      });
    }
    return { svg: svg, play: play };
  }

  function merge(a, b) {
    var out = {};
    [a, b].forEach(function (src) {
      Object.keys(src || {}).forEach(function (k) {
        var v = src[k];
        out[k] = v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k]) ? merge(out[k], v) : v;
      });
    });
    return out;
  }

  // Observable Plot defaults that follow the theme: categorical palette, mono tick labels (via .ltt-plot CSS), transparent background.
  function plotTheme(options) {
    return merge({
      className: "ltt-plot",
      style: { background: "transparent", fontSize: "12px", overflow: "visible" },
      color: { range: LTT.palette() },
      x: { labelArrow: "none" }, y: { labelArrow: "none", grid: true }
    }, options);
  }

  function plot(options) {
    if (!root.Plot) throw new Error("LTT.plot needs /kit/vendor/plot.umd.min.js");
    return root.Plot.plot(plotTheme(options));
  }

  // Flow quantities (cost, traffic) between stages; link width = value. nodes: [{id, l, k}], links: [{f, t, value}].
  function sankey(target, o) {
    if (!d3.sankey) throw new Error("LTT.sankey needs /kit/vendor/d3-sankey.min.js");
    var W = o.width || 820, H = o.height || 360, fmt = o.fmt || d3.format(",");
    var node = el(target), svg = (node.tagName && node.tagName.toLowerCase() === "svg" ? d3.select(node) : d3.select(node).append("svg"))
      .classed("ltt-svg ltt-sankey", true).attr("viewBox", "0 0 " + W + " " + H);
    var pal = LTT.palette(), color = {};
    o.nodes.forEach(function (n, i) { color[n.id] = n.k ? "var(--ltt-" + n.k + ")" : pal[i % pal.length]; });
    var gen = d3.sankey().nodeId(function (d) { return d.id; }).nodeWidth(o.nodeWidth || 14).nodePadding(o.nodePadding || 18)
      .nodeSort(null).extent([[1, 8], [W - (o.labelRight || 150), H - 8]]);
    var g = gen({ nodes: o.nodes.map(function (n) { return Object.assign({}, n); }), links: o.links.map(function (l) { return { source: l.f, target: l.t, value: l.value, k: l.k }; }) });
    var lk = svg.append("g").selectAll("path").data(g.links).join("path").attr("class", "lk").attr("d", d3.sankeyLinkHorizontal())
      .style("stroke", function (d) { return d.k ? "var(--ltt-" + d.k + ")" : color[d.source.id]; }).attr("stroke-width", function (d) { return Math.max(1, d.width); });
    var nd = svg.append("g").selectAll("g").data(g.nodes).join("g").attr("class", "nd");
    nd.append("rect").attr("x", function (d) { return d.x0; }).attr("y", function (d) { return d.y0; }).attr("width", function (d) { return d.x1 - d.x0; })
      .attr("height", function (d) { return Math.max(1, d.y1 - d.y0); }).style("fill", function (d) { return color[d.id]; });
    var tx = nd.append("text").attr("x", function (d) { return d.x1 + 8; }).attr("y", function (d) { return (d.y0 + d.y1) / 2 - 2; });
    tx.append("tspan").text(function (d) { return d.l || d.id; });
    tx.append("tspan").attr("class", "v").attr("x", function (d) { return d.x1 + 8; }).attr("dy", 15).text(function (d) { return fmt(d.value); });
    return {
      svg: svg, graph: g,
      highlight: function (ids) {
        var on = ids && ids.length ? ids : null;
        lk.classed("hot", function (d) { return !!on && (on.indexOf(d.source.id) >= 0 || on.indexOf(d.target.id) >= 0); })
          .style("stroke-opacity", function (d) { return !on ? null : on.indexOf(d.source.id) >= 0 || on.indexOf(d.target.id) >= 0 ? 0.7 : 0.12; });
      }
    };
  }

  var WORLD_URL = "/kit/vendor/world-atlas/countries-110m.json", worldData = null;
  function world() {
    if (!worldData) worldData = fetch(WORLD_URL).then(function (r) {
      if (!r.ok) throw new Error("map data " + WORLD_URL + " " + r.status);
      return r.json();
    });
    return worldData;
  }

  // World map (Natural Earth 1:110m via world-atlas). Routes are great-circle arcs, so long hauls curve the way flights and cables do.
  // countries keys are Natural Earth English names (e.g. "South Korea", "United States of America").
  function map(svgEl, o) {
    o = o || {};
    var topojson = root.topojson;
    if (!topojson) return Promise.reject(new Error("LTT.map needs /kit/vendor/topojson-client.min.js"));
    var W = o.width || 900, H = o.height || 460;
    var svg = d3.select(el(svgEl)).classed("ltt-svg ltt-map", true).attr("viewBox", "0 0 " + W + " " + H)
      .attr("role", "img").attr("aria-label", o.label || null);
    if (o.maxWidth !== false) svg.style("max-width", (o.maxWidth || W) + "px");
    return (o.data ? Promise.resolve(o.data) : world()).then(function (topo) {
      var land = topojson.feature(topo, topo.objects.countries);
      var kind = { equalEarth: d3.geoEqualEarth, mercator: d3.geoMercator, naturalEarth: d3.geoNaturalEarth1, orthographic: d3.geoOrthographic }[o.projection || "equalEarth"];
      if (!kind) throw new Error("unknown projection '" + o.projection + "'");
      var proj = kind();
      if (o.rotate) proj.rotate(o.rotate);
      var target = o.extent ? { type: "MultiPoint", coordinates: [o.extent[0], o.extent[1], [o.extent[0][0], o.extent[1][1]], [o.extent[1][0], o.extent[0][1]]] } : { type: "Sphere" };
      proj.fitExtent([[8, 8], [W - 8, H - 8]], target);
      var path = d3.geoPath(proj);
      svg.append("clipPath").attr("id", (o.id || "m") + "-clip").append("rect").attr("width", W).attr("height", H);
      var g = svg.append("g").attr("clip-path", "url(#" + (o.id || "m") + "-clip)");
      g.append("path").attr("class", "sea").attr("d", path({ type: "Sphere" }));
      if (o.graticule !== false) g.append("path").attr("class", "grat").attr("d", path(d3.geoGraticule10()));
      var countries = o.countries || {}, landSel = {};
      g.append("g").selectAll("path").data(land.features).join("path")
        .attr("class", function (f) { var k = countries[f.properties.name]; return "land" + (k ? " k-" + k : ""); })
        .attr("d", path).each(function (f) { landSel[f.properties.name] = d3.select(this); });
      var places = {};
      (o.places || []).forEach(function (p) { places[p.id] = p; });
      var gRoutes = g.append("g"), gPlaces = g.append("g"), gPackets = g.append("g"), routeSel = {};
      (o.routes || []).forEach(function (r) {
        var a = places[r.f], b = places[r.t];
        if (!a || !b) throw new Error("map route " + (r.id || r.f + ">" + r.t) + " points to a missing place");
        var id = r.id || r.f + ">" + r.t, line = { type: "LineString", coordinates: [[a.lon, a.lat], [b.lon, b.lat]] };
        var p = gRoutes.append("path").attr("class", "rt" + (r.k ? " k-" + r.k : "") + (r.dash ? " dash" : "")).attr("d", path(line));
        var label = null;
        if (r.l) {
          var mid = proj(d3.geoInterpolate(line.coordinates[0], line.coordinates[1])(0.5)), lo = r.lo || [0, -8];
          label = gRoutes.append("text").attr("class", "rl").attr("text-anchor", "middle").attr("x", mid[0] + lo[0]).attr("y", mid[1] + lo[1]).text(r.l);
        }
        routeSel[id] = { path: p, label: label, f: r.f, t: r.t };
      });
      var placeSel = {};
      (o.places || []).forEach(function (p) {
        var xy = proj([p.lon, p.lat]), gp = gPlaces.append("g").attr("class", "pl" + (p.k ? " k-" + p.k : "")).attr("transform", "translate(" + xy + ")");
        if (p.mark) gp.html(LTT.mark(p.mark, { size: 12, color: p.k ? "var(--ltt-" + p.k + ")" : "var(--ltt-ink)" }));
        else gp.append("circle").attr("r", 5);
        if (p.l) {
          var lo = p.lo || [8, 4];
          gp.append("text").attr("x", lo[0]).attr("y", lo[1]).attr("text-anchor", lo[0] < 0 ? "end" : "start").text(p.l);
        }
        placeSel[p.id] = gp;
      });
      var api = {
        svg: svg, projection: proj, path: path,
        project: function (lon, lat) { return proj([lon, lat]); },
        // Ids may name places, routes ("from>to" or id) or countries; everything else dims. No ids clears the focus.
        highlight: function (ids) {
          var on = ids && ids.length ? ids : null, has = function (x) { return !on || on.indexOf(x) >= 0; };
          Object.keys(placeSel).forEach(function (id) { placeSel[id].classed("dim", !has(id)); });
          Object.keys(routeSel).forEach(function (id) {
            var r = routeSel[id], lit = has(id) || (on && on.indexOf(r.f) >= 0 && on.indexOf(r.t) >= 0);
            r.path.classed("dim", !lit);
            if (r.label) r.label.classed("dim", !lit);
          });
          var anyCountry = on && on.some(function (x) { return landSel[x]; });
          Object.keys(landSel).forEach(function (n) { landSel[n].classed("dim", !!anyCountry && on.indexOf(n) < 0); });
        },
        flow: function (ids) { Object.keys(routeSel).forEach(function (id) { routeSel[id].path.classed("run", (ids || []).indexOf(id) >= 0); }); },
        send: function (from, to, so) {
          so = so || {};
          var r = routeSel[from + ">" + to], rev = false;
          if (!r) { r = routeSel[to + ">" + from]; rev = true; }
          if (!r || !MOTION_MS) return Promise.resolve();
          var node = r.path.node(), len = node.getTotalLength(), n = so.count || 3, ms = so.ms || 1400, gap = so.gap || 180;
          return new Promise(function (done) {
            d3.range(n).forEach(function (k) {
              gPackets.append("circle").attr("class", "pk").attr("r", so.r || 5).style("fill", so.color || "var(--ltt-accent)")
                .transition().delay(k * gap).duration(ms).ease(d3.easeCubicInOut)
                .attrTween("transform", function () { return function (t) { var q = node.getPointAtLength((rev ? 1 - t : t) * len); return "translate(" + q.x + "," + q.y + ")"; }; })
                .remove().on("end", function () { if (k === n - 1) done(); }).on("interrupt", function () { if (k === n - 1) done(); });
            });
          });
        },
        clear: function () { gPackets.selectAll("*").interrupt().remove(); },
        player: function (container, steps, popts) {
          var run = 0;
          return stepper(container, steps.map(function (st) {
            return {
              caption: st.caption,
              enter: function (i) {
                var id = ++run;
                api.clear(); api.highlight(st.hot || null); api.flow(st.flow || []);
                (st.send || []).reduce(function (p, x) { return p.then(function () { return id === run ? api.send(x[0], x[1], x[2]) : null; }); }, Promise.resolve());
                if (st.enter) st.enter(api, i);
              }
            };
          }), popts);
        }
      };
      return api;
    });
  }

  function math(scope) {
    if (!root.katex) return;
    (scope ? el(scope) : document).querySelectorAll("[data-tex]").forEach(function (n) {
      root.katex.render(n.dataset.tex, n, { throwOnError: false, displayMode: n.hasAttribute("data-display") });
    });
  }

  if (typeof document !== "undefined") {
    var style = document.createElement("style");
    style.id = "ltt-parts-style";
    style.textContent = STYLE;
    document.head.appendChild(style);
    document.addEventListener("DOMContentLoaded", function () { math(); });
  }

  LTT.MOTION_MS = MOTION_MS;
  LTT.$ = $;
  // Coordinate-free diagram -> pixel diagram spec via elkjs layered layout. elk rejects arrays/objects built in another
  // realm (it silently returns no coordinates), so the elk graph is built only from fresh literals, never from user input.
  // Array#map on a user array also yields a foreign-realm array (species lookup), hence the push loop in `each`.
  function autoLayout(spec) {
    return new Promise(function (resolve, reject) {
      spec = spec || {};
      var nodesIn = spec.nodes || [], edgesIn = spec.edges || [], groupsIn = spec.groups || [];
      var dir = spec.direction == null ? "RIGHT" : spec.direction;
      var size = spec.node || [164, 60], gap = spec.spacing || [72, 36], pad = spec.pad == null ? 20 : spec.pad;
      var radius = spec.radius == null ? 10 : spec.radius;
      if (dir !== "RIGHT" && dir !== "DOWN") throw new Error("autoLayout direction must be RIGHT or DOWN: " + dir);

      var nodeIdx = {}, groupIdx = {};
      groupsIn.forEach(function (g, k) {
        if (groupIdx.hasOwnProperty(g.id)) throw new Error("autoLayout group id " + g.id + " is duplicated");
        groupIdx[g.id] = k;
      });
      nodesIn.forEach(function (n, k) {
        if (nodeIdx.hasOwnProperty(n.id)) throw new Error("autoLayout node id " + n.id + " is duplicated");
        nodeIdx[n.id] = k;
        if (n.group != null && !groupIdx.hasOwnProperty(n.group)) throw new Error("autoLayout node " + n.id + " refers to missing group " + n.group);
      });
      groupsIn.forEach(function (g) {
        if (g.parent != null && !groupIdx.hasOwnProperty(g.parent)) throw new Error("autoLayout group " + g.id + " refers to missing parent group " + g.parent);
      });
      groupsIn.forEach(function (g) {
        var seen = {}, cur = g;
        while (cur && cur.parent != null) {
          if (seen.hasOwnProperty(cur.id)) throw new Error("autoLayout group parent cycle at " + cur.id);
          seen[cur.id] = 1;
          cur = groupsIn[groupIdx[cur.parent]];
        }
      });
      edgesIn.forEach(function (e) {
        var id = e.id != null ? e.id : e.f + ">" + e.t;
        if (e.f === e.t) throw new Error("autoLayout edge " + id + " connects node " + e.f + " to itself");
        if (!nodeIdx.hasOwnProperty(e.f) || !nodeIdx.hasOwnProperty(e.t)) throw new Error("autoLayout edge " + id + " points to a missing node");
      });
      if (typeof root.ELK !== "function") throw new Error("autoLayout needs elk.bundled.js loaded before use");

      function each(list, fn) { var out = [], k; for (k = 0; k < list.length; k++) out.push(fn(list[k], k)); return out; }
      var filled = each(groupsIn, function () { return false; });
      nodesIn.forEach(function (n) {
        var g = n.group;
        while (g != null && !filled[groupIdx[g]]) { filled[groupIdx[g]] = true; g = groupsIn[groupIdx[g]].parent; }
      });

      var sizes = each(nodesIn, function (n) { return [n.w != null ? n.w : size[0], nodeHeight(n, size[1])]; });
      var elkNodes = each(nodesIn, function (n, k) { return { id: "n" + k, width: sizes[k][0], height: sizes[k][1] }; });
      var elkGroups = each(groupsIn, function (g, k) {
        return {
          id: "g" + k, children: [],
          layoutOptions: { "elk.padding": "[top=" + (g.l ? 30 : 12) + ",left=12,bottom=12,right=12]" }
        };
      });
      var top = [];
      groupsIn.forEach(function (g, k) {
        if (!filled[k]) return;
        (g.parent == null ? top : elkGroups[groupIdx[g.parent]].children).push(elkGroups[k]);
      });
      nodesIn.forEach(function (n, k) { (n.group == null ? top : elkGroups[groupIdx[n.group]].children).push(elkNodes[k]); });
      var elkEdges = each(edgesIn, function (e, k) { return { id: "e" + k, sources: ["n" + nodeIdx[e.f]], targets: ["n" + nodeIdx[e.t]] }; });
      var graph = {
        id: "root", children: top, edges: elkEdges,
        layoutOptions: {
          "elk.algorithm": "layered", "elk.direction": dir, "elk.edgeRouting": "ORTHOGONAL", "elk.hierarchyHandling": "INCLUDE_CHILDREN",
          "elk.padding": "[top=0,left=0,bottom=0,right=0]",
          "elk.layered.spacing.nodeNodeBetweenLayers": String(gap[0]), "elk.spacing.nodeNode": String(gap[1])
        }
      };

      new root.ELK().layout(graph).then(function (res) {
        var abs = { root: [0, 0] }, boxes = {};
        (function walk(list, ox, oy) {
          list.forEach(function (c) {
            var x = ox + c.x, y = oy + c.y;
            abs[c.id] = [x, y]; boxes[c.id] = [x, y, c.width, c.height];
            if (c.children) walk(c.children, x, y);
          });
        })(res.children || [], 0, 0);

        function copy(o) { var r = {}; for (var key in o) if (o.hasOwnProperty(key)) r[key] = o[key]; return r; }
        var right = 0, bottom = 0;
        function grow(b) { right = Math.max(right, b[0] + b[2]); bottom = Math.max(bottom, b[1] + b[3]); }
        var nodes = each(nodesIn, function (n, k) {
          var b = boxes["n" + k], o = copy(n);
          if (!b) throw new Error("autoLayout: elk returned no position for node " + n.id);
          grow(b);
          o.x = b[0] + b[2] / 2; o.y = b[1] + b[3] / 2; o.w = b[2]; o.h = b[3];
          return o;
        });
        var zones = [];
        groupsIn.forEach(function (g, k) {
          if (!filled[k]) return;
          var b = boxes["g" + k];
          if (!b) throw new Error("autoLayout: elk returned no position for group " + g.id);
          grow(b);
          var z = { id: g.id, parent: g.parent == null ? null : g.parent };
          if (g.l !== undefined) z.l = g.l;
          if (g.k !== undefined) z.k = g.k;
          z.x = b[0]; z.y = b[1]; z.w = b[2]; z.h = b[3];
          zones.push(z);
        });
        function shorten(a, b, d) {
          var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy);
          if (!len) return [a[0], a[1]];
          var t = d / len;
          return [a[0] + dx * t, a[1] + dy * t];
        }
        function seg(a, b) { return Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])); }
        var edges = each(edgesIn, function (e, k) {
          var el = null, sec;
          (function find(g) {
            (g.edges || []).forEach(function (x) { if (x.id === "e" + k) el = x; });
            (g.children || []).forEach(find);
          })(res);
          sec = el && el.sections && el.sections[0];
          if (!sec) throw new Error("autoLayout: elk returned no route for edge " + (e.id != null ? e.id : e.f + ">" + e.t));
          var off = abs[el.container != null ? el.container : "root"] || [0, 0], pts = [];
          pts.push([sec.startPoint.x + off[0], sec.startPoint.y + off[1]]);
          (sec.bendPoints || []).forEach(function (p) { pts.push([p.x + off[0], p.y + off[1]]); });
          pts.push([sec.endPoint.x + off[0], sec.endPoint.y + off[1]]);
          var n = pts.length, l0 = seg(pts[0], pts[1]), ln = seg(pts[n - 2], pts[n - 1]);
          // A single segment shares its length between both trims so the line never collapses or flips.
          var first = shorten(pts[0], pts[1], n === 2 ? Math.min(4, l0 / 6) : Math.min(4, l0 / 2));
          var last = shorten(pts[n - 1], pts[n - 2], n === 2 ? Math.min(8, ln / 3) : Math.min(8, ln / 2));
          pts[0] = first; pts[n - 1] = last;
          var o = copy(e);
          o.shape = "ortho"; o.radius = e.radius != null ? e.radius : radius; o.points = pts;
          return o;
        });
        var out = { pad: pad, width: right + 2 * pad, height: bottom + 2 * pad, nodes: nodes, edges: edges, zones: zones };
        if (spec.label !== undefined) out.label = spec.label;
        if (spec.maxWidth !== undefined) out.maxWidth = spec.maxWidth;
        (function check(v) {
          if (typeof v === "number" && !isFinite(v)) throw new Error("autoLayout produced a non-finite number");
          if (v && typeof v === "object") for (var key in v) if (v.hasOwnProperty(key)) check(v[key]);
        })(out);
        resolve(out);
      }).then(null, reject);
    });
  }

  // State machine → autoLayout input. Self-transitions cannot be routed by the layered layout, so they become a
  // "↻ event" line under the state's name; the initial state gets an entry dot; final states get a double border.
  function stateSpec(o) {
    var start = "__start", byId = {}, loops = {};
    (o.states || []).forEach(function (st) { byId[st.id] = st; });
    if (o.initial != null && !byId[o.initial]) throw new Error("state: initial " + o.initial + " is not a state");
    var edges = [];
    (o.transitions || []).forEach(function (t, i) {
      if (!byId[t.f] || !byId[t.t]) throw new Error("state: transition " + (t.id || t.f + ">" + t.t) + " (#" + i + ") points to a missing state");
      if (t.f === t.t) (loops[t.f] = loops[t.f] || []).push("↻ " + (t.l || ""));
      else edges.push(Object.assign({}, t));
    });
    var nodes = (o.states || []).map(function (st) {
      var n = Object.assign({}, st);
      if (loops[st.id]) n.s = (st.s ? st.s + "\n" : "") + loops[st.id].join("\n");
      if (st.final) { n.ring = true; delete n.final; }
      return n;
    });
    if (o.initial != null) {
      nodes.unshift({ id: start, l: " ", w: 22, h: 22, k: "dark" });
      edges.unshift({ id: start + ">" + o.initial, f: start, t: o.initial });
    }
    var out = { nodes: nodes, edges: edges, groups: o.groups || [], direction: o.direction || "RIGHT", node: o.node || [148, 52], spacing: o.spacing || [100, 40] };
    ["pad", "radius", "label", "maxWidth"].forEach(function (k) { if (o[k] !== undefined) out[k] = o[k]; });
    return out;
  }

  // Resolves to the diagram api (player, highlight, send ...); rejects without elk.bundled.js or on bad input.
  function state(svgEl, o) {
    return new Promise(function (resolve) { resolve(stateSpec(o)); })
      .then(autoLayout)
      .then(function (spec) { return diagram(svgEl, spec); });
  }

  LTT.tween = tween;
  LTT.units = units;
  LTT.bar = bar;
  LTT.predict = predict;
  LTT.sweep = sweep;
  LTT.stepper = stepper;
  LTT.diagram = diagram;
  LTT.diagramLayout = diagramLayout;
  LTT.autoLayout = autoLayout;
  LTT.stateSpec = stateSpec;
  LTT.state = state;
  LTT.plane = plane;
  LTT.map = map;
  LTT.sequence = sequence;
  LTT.sequenceLayout = sequenceLayout;
  LTT.axisPlot = axisPlot;
  LTT.lanes = lanes;
  LTT.hbars = hbars;
  LTT.plotTheme = plotTheme;
  LTT.plot = plot;
  LTT.sankey = sankey;
  LTT.sim = sim;
  LTT.math = math;
})(typeof globalThis !== "undefined" ? globalThis : this);
