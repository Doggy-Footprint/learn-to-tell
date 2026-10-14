(function (root) {
  "use strict";
  var LTT = root.LTT;
  var d3 = root.d3;
  if (!LTT || !d3) throw new Error("ltt-parts.js needs d3.min.js and ltt.js loaded first");

  var STYLE = [
    ".ltt-unit.on{background:var(--ltt-on,var(--ltt-accent))}.ltt-unit.alt{background:var(--ltt-alt,var(--ltt-bad))}",
    ".ltt-unit.guess{background:var(--ltt-guess,#b9c4f6)}",
    ".ltt-choices{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}",
    ".ltt-choices button{background:var(--ltt-card);color:var(--ltt-ink);border:2px solid var(--ltt-line);text-align:left;",
    "font-weight:600;transition:border-color .2s,background-color .2s}",
    ".ltt-choices button[aria-pressed=true]{border-color:var(--ltt-accent);background:#eef1fd}",
    ".ltt-choices button.right{border-color:var(--ltt-good);background:#e6f6ef}",
    ".ltt-choices button.wrong{border-color:var(--ltt-bad);background:#fdecef}",
    ".ltt-stepper{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 0 0}",
    ".ltt-stepper button.ghost{background:var(--ltt-line);color:var(--ltt-ink)}",
    ".ltt-dots{display:flex;gap:5px;flex:1}.ltt-dots i{flex:1;max-width:40px;height:6px;border-radius:3px;background:var(--ltt-line);",
    "transition:background-color .3s}.ltt-dots i.done{background:var(--ltt-accent)}",
    ".ltt-caption{min-height:3em;margin:10px 0 0;font-size:15px}",
    ".ltt-svg{width:100%;height:auto;display:block;overflow:visible}",
    ".ltt-svg text{font:12px -apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;fill:var(--ltt-ink)}",
    ".ltt-node rect{fill:var(--ltt-card);stroke:var(--ltt-line);stroke-width:1.5;transition:fill .3s,stroke .3s}",
    ".ltt-node.hot rect{stroke:var(--ltt-accent);fill:#eef1fd}",
    ".ltt-node text.sub{fill:var(--ltt-muted);font-size:11px}",
    ".ltt-link{stroke:var(--ltt-line);fill:none}",
    ".ltt-link-label{fill:var(--ltt-muted)!important;font-size:11px!important}",
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
    var prev = document.createElement("button"); prev.className = "ghost"; prev.textContent = "◀ 이전";
    var next = document.createElement("button"); next.textContent = "다음 ▶";
    var play = document.createElement("button"); play.className = "ghost"; play.textContent = "자동 재생";
    var dots = document.createElement("div"); dots.className = "ltt-dots";
    steps.forEach(function () { dots.appendChild(document.createElement("i")); });
    bar.append(prev, next, play, dots);
    container.append(caption, bar);
    function go(k, dir) {
      k = Math.max(0, Math.min(steps.length - 1, k));
      i = k;
      caption.innerHTML = steps[k].caption || "";
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

  // Box-and-arrow diagram whose arrows can carry animated packets; sizes are in viewBox units.
  function flow(svgEl, spec) {
    var svg = d3.select(el(svgEl)).classed("ltt-svg", true).attr("viewBox", spec.viewBox || "0 0 880 360");
    var gLinks = svg.append("g"), gNodes = svg.append("g"), gPackets = svg.append("g");
    var nodes = spec.nodes;
    function center(id) { var n = nodes[id]; return [n.x + n.w / 2, n.y + n.h / 2]; }
    (spec.links || []).forEach(function (l) {
      var a = center(l.from), b = center(l.to);
      gLinks.append("line").attr("class", "ltt-link").attr("x1", a[0]).attr("y1", a[1]).attr("x2", b[0]).attr("y2", b[1])
        .attr("stroke-width", l.width || 3);
      if (l.label) gLinks.append("text").attr("class", "ltt-link-label").attr("x", (a[0] + b[0]) / 2 + 6)
        .attr("y", (a[1] + b[1]) / 2 - 6).text(l.label);
    });
    var nodeSel = {};
    Object.keys(nodes).forEach(function (id) {
      var n = nodes[id];
      var g = gNodes.append("g").attr("class", "ltt-node").attr("transform", "translate(" + n.x + "," + n.y + ")");
      g.append("rect").attr("width", n.w).attr("height", n.h).attr("rx", 10).style("fill", n.fill || null);
      g.append("text").attr("x", n.w / 2).attr("y", n.sub ? n.h / 2 - 4 : n.h / 2 + 4).attr("text-anchor", "middle")
        .style("font-weight", 700).text(n.label || id);
      if (n.sub) g.append("text").attr("class", "sub").attr("x", n.w / 2).attr("y", n.h / 2 + 13).attr("text-anchor", "middle").text(n.sub);
      nodeSel[id] = g;
    });
    return {
      svg: svg,
      node: function (id) { return nodeSel[id]; },
      highlight: function (ids) {
        Object.keys(nodeSel).forEach(function (id) { nodeSel[id].classed("hot", ids.indexOf(id) >= 0); });
      },
      // Resolves when the last packet arrives; with reduced motion it resolves immediately.
      send: function (from, to, o) {
        o = o || {};
        var a = center(from), b = center(to), n = o.count || 5, ms = o.ms || 900, gap = o.gap || 120;
        if (!MOTION_MS) return Promise.resolve();
        return new Promise(function (done) {
          d3.range(n).forEach(function (k) {
            gPackets.append("circle").attr("r", o.r || 5).attr("fill", o.color || "var(--ltt-accent)")
              .attr("cx", a[0]).attr("cy", a[1])
              .transition().delay(k * gap).duration(ms).ease(d3.easeCubicInOut)
              .attr("cx", b[0]).attr("cy", b[1]).remove()
              .on("end", function () { if (k === n - 1) done(); });
          });
        });
      },
      clear: function () { gPackets.selectAll("*").interrupt().remove(); }
    };
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
        .attr("stroke", function (l) { return l[2] ? "var(--ltt-muted)" : "#c5cdf3"; })
        .attr("stroke-width", function (l) { return l[2] ? 1.5 : 1; });
      if (shape) {
        gShape.selectAll("path").data([shape]).join("path")
          .attr("d", function (pts) { return "M" + pts.map(function (p) { return px(apply(m, p)).join(","); }).join("L") + "Z"; })
          .attr("fill", o.shapeFill || "rgba(79,107,237,.18)").attr("stroke", "var(--ltt-accent)");
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
  LTT.flow = flow;
  LTT.plane = plane;
  LTT.sim = sim;
  LTT.math = math;
})(typeof globalThis !== "undefined" ? globalThis : this);
