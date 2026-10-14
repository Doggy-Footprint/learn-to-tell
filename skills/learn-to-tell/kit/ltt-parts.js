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

  // Grid-placed diagram geometry: nodes sit at cell centres (c, r may be fractional), edges are clipped to box borders.
  function diagramLayout(spec) {
    var cell = spec.cell || [210, 120], size = spec.node || [164, 60], pad = spec.pad == null ? 20 : spec.pad;
    var cols = spec.cols || 1 + d3.max(spec.nodes, function (n) { return n.c; });
    var rows = spec.rows || 1 + d3.max(spec.nodes, function (n) { return n.r; });
    var nodes = {};
    spec.nodes.forEach(function (n) {
      var w = n.w || size[0], h = n.h || size[1];
      var cx = pad + (n.c + 0.5) * cell[0], cy = pad + (n.r + 0.5) * cell[1];
      nodes[n.id] = { x: cx - w / 2, y: cy - h / 2, w: w, h: h, cx: cx, cy: cy };
    });
    function clip(b, dx, dy, gap) {
      var t = Math.min(dx ? (b.w / 2 + gap) / Math.abs(dx) : Infinity, dy ? (b.h / 2 + gap) / Math.abs(dy) : Infinity);
      return [b.cx + dx * t, b.cy + dy * t];
    }
    var edges = (spec.edges || []).map(function (e, i) {
      var a = nodes[e.f], b = nodes[e.t];
      if (!a || !b) throw new Error("diagram edge " + (e.id || i) + " points to a missing node");
      var dx = b.cx - a.cx, dy = b.cy - a.cy, p = clip(a, dx, dy, 4), q = clip(b, -dx, -dy, 8);
      return { id: e.id || e.f + ">" + e.t, f: e.f, t: e.t, x1: p[0], y1: p[1], x2: q[0], y2: q[1] };
    });
    var zones = (spec.zones || []).map(function (z) {
      return { x: pad + z.c0 * cell[0] + 6, y: pad + z.r0 * cell[1] + 6, w: (z.c1 - z.c0 + 1) * cell[0] - 12, h: (z.r1 - z.r0 + 1) * cell[1] - 12 };
    });
    return { width: pad * 2 + cols * cell[0], height: pad * 2 + rows * cell[1], nodes: nodes, edges: edges, zones: zones };
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
    (spec.zones || []).forEach(function (z, i) {
      var b = L.zones[i], g = gZones.append("g").attr("class", "z" + (z.k ? " k-" + z.k : ""));
      g.append("rect").attr("x", b.x).attr("y", b.y).attr("width", b.w).attr("height", b.h).attr("rx", 18);
      if (z.l) g.append("text").attr("x", b.x + 14).attr("y", b.y + 18).text(z.l);
    });
    var edgeSel = {}, byPair = {};
    (spec.edges || []).forEach(function (e, i) {
      var g = L.edges[i], k = e.flaw ? "bad" : e.k || "";
      var line = gEdges.append("line").attr("class", "e" + (k ? " k-" + k : "") + (e.dash ? " dash" : ""))
        .attr("x1", g.x1).attr("y1", g.y1).attr("x2", g.x2).attr("y2", g.y2)
        .attr("marker-end", e.arrow === false ? null : "url(#" + uid + "-m" + (/^(accent|good|bad|warn)$/.test(k) ? k : "") + ")");
      if (e.both) line.attr("marker-start", "url(#" + uid + "-m" + (/^(accent|good|bad|warn)$/.test(k) ? k : "") + ")");
      var label = null;
      if (e.l) {
        var lo = e.lo || [0, -8];
        label = gEdges.append("text").attr("class", "el").attr("text-anchor", "middle")
          .attr("x", (g.x1 + g.x2) / 2 + lo[0]).attr("y", (g.y1 + g.y2) / 2 + lo[1]).text(e.l);
      }
      edgeSel[g.id] = byPair[e.f + ">" + e.t] = { line: line, label: label, geo: g };
    });
    var nodeSel = {};
    spec.nodes.forEach(function (n) {
      var b = L.nodes[n.id];
      var g = gNodes.append("g").attr("class", "n" + (n.k ? " k-" + n.k : "") + (n.flaw ? " flaw" : ""))
        .attr("transform", "translate(" + b.x + "," + b.y + ")");
      g.append("rect").attr("class", "box").attr("width", b.w).attr("height", b.h).attr("rx", Math.min(14, b.h / 2));
      var tx = b.w / 2, anchor = "middle";
      if (n.icon && LTT.icon) {
        var s = Math.min(26, b.h - 20);
        g.append("g").attr("class", "ic").attr("transform", "translate(14," + (b.h - s) / 2 + ")")
          .html(LTT.icon(n.icon).replace("<svg ", "<svg width='" + s + "' height='" + s + "' "));
        tx = 14 + s + 10; anchor = "start";
      }
      g.append("text").attr("class", "l").attr("x", tx).attr("y", n.s ? b.h / 2 - 3 : b.h / 2 + 5).attr("text-anchor", anchor).text(n.l || n.id);
      if (n.s) g.append("text").attr("class", "s").attr("x", tx).attr("y", b.h / 2 + 14).attr("text-anchor", anchor).text(n.s);
      if (n.flaw) {
        var f = g.append("g").attr("transform", "translate(" + (b.w - 4) + ",4)");
        f.append("circle").attr("r", 9).style("fill", "var(--ltt-bad)");
        f.append("text").attr("text-anchor", "middle").attr("y", 4).style("fill", "#fff").style("font-weight", 800).style("font-size", "12px").text("!");
      }
      nodeSel[n.id] = g;
    });
    function ends(from, to) {
      var e = byPair[from + ">" + to];
      if (e) return [[e.geo.x1, e.geo.y1], [e.geo.x2, e.geo.y2]];
      e = byPair[to + ">" + from];
      if (e) return [[e.geo.x2, e.geo.y2], [e.geo.x1, e.geo.y1]];
      return [[L.nodes[from].cx, L.nodes[from].cy], [L.nodes[to].cx, L.nodes[to].cy]];
    }
    var api = {
      svg: svg,
      layout: L,
      node: function (id) { return nodeSel[id]; },
      // Ids may name nodes or edges ("from>to" or the edge's id); everything else dims. No ids clears the focus.
      highlight: function (ids) {
        var on = ids && ids.length ? ids : null;
        Object.keys(nodeSel).forEach(function (id) {
          nodeSel[id].classed("dim", !!on && on.indexOf(id) < 0).classed("hot", !!on && on.indexOf(id) >= 0);
        });
        Object.keys(edgeSel).forEach(function (id) {
          var e = edgeSel[id], lit = !on || on.indexOf(id) >= 0 || (on.indexOf(e.geo.f) >= 0 && on.indexOf(e.geo.t) >= 0);
          e.line.classed("dim", !lit);
          if (e.label) e.label.classed("dim", !lit);
        });
      },
      // Marching dashes show direction of travel only; pass [] to stop them.
      flow: function (ids) {
        Object.keys(edgeSel).forEach(function (id) { edgeSel[id].line.classed("run", (ids || []).indexOf(id) >= 0); });
      },
      // Resolves when the last packet arrives; with reduced motion it resolves immediately.
      send: function (from, to, o) {
        o = o || {};
        var pts = ends(from, to), a = pts[0], b = pts[1], n = o.count || 5, ms = o.ms || 900, gap = o.gap || 120;
        if (!MOTION_MS) return Promise.resolve();
        return new Promise(function (done) {
          d3.range(n).forEach(function (k) {
            gPackets.append("circle").attr("class", "pk").attr("r", o.r || 5.5).style("fill", o.color || "var(--ltt-accent)")
              .attr("cx", a[0]).attr("cy", a[1]).attr("opacity", 0)
              .transition().delay(k * gap).duration(ms).ease(d3.easeCubicInOut)
              .attr("cx", b[0]).attr("cy", b[1]).attr("opacity", 1).remove()
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
  LTT.tween = tween;
  LTT.units = units;
  LTT.bar = bar;
  LTT.predict = predict;
  LTT.sweep = sweep;
  LTT.stepper = stepper;
  LTT.diagram = diagram;
  LTT.diagramLayout = diagramLayout;
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
