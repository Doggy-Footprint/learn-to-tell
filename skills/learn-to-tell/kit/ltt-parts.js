(function (root) {
  "use strict";
  var LTT = root.LTT;
  var d3 = root.d3;
  if (!LTT || !d3) throw new Error("ltt-parts.js needs d3.min.js and ltt.js loaded first");

  var STYLE = [
    ".ltt-unit.on{background:var(--ltt-on,var(--ltt-accent))}.ltt-unit.alt{background:var(--ltt-alt,var(--ltt-bad))}",
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

  function units(container, n, cols) {
    container = el(container);
    n = n || 100;
    if (cols) container.style.setProperty("--ltt-cols", cols);
    container.classList.add("ltt-units");
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
  LTT.sim = sim;
  LTT.math = math;
})(typeof globalThis !== "undefined" ? globalThis : this);
