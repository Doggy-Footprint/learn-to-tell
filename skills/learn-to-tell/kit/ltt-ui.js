(function (root) {
  "use strict";
  var LTT = root.LTT;
  if (!LTT || !LTT.icon) throw new Error("ltt-ui.js needs ltt.js loaded first");

  var STYLE = /* css:start ltt-ui.css */[
    ".ltt-chips{display:flex;flex-wrap:wrap;gap:8px}",
    ".ltt-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:var(--ltt-card);box-shadow:inset 0 0 0 1.5px var(--ltt-line-2);font-size:14px;font-weight:600;color:var(--ltt-ink-2);white-space:nowrap}",
    ".ltt-chip.good{color:var(--ltt-good);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--ltt-good) 45%,transparent)}",
    ".ltt-chip.bad{color:var(--ltt-bad);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--ltt-bad) 45%,transparent)}",
    ".ltt-chip.accent{color:var(--ltt-accent);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--ltt-accent) 45%,transparent)}",
    ".ltt-chip .dot{width:8px;height:8px;border-radius:50%;background:currentColor}",
    ".ltt-badge{display:inline-flex;align-items:center;gap:8px;padding:5px 14px 5px 6px;border-radius:999px;font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}",
    ".ltt-badge i{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;color:var(--ltt-on-accent);font-size:13px}",
    ".ltt-badge.bad{background:var(--ltt-bad-soft);color:var(--ltt-bad)}",
    ".ltt-badge.bad i{background:var(--ltt-bad)}",
    ".ltt-badge.good{background:var(--ltt-good-soft);color:var(--ltt-good)}",
    ".ltt-badge.good i{background:var(--ltt-good)}",
    ".ltt-badge.warn{background:var(--ltt-warn-soft);color:var(--ltt-warn)}",
    ".ltt-badge.warn i{background:var(--ltt-warn)}",
    ".ltt-badge.accent{background:var(--ltt-accent-soft);color:var(--ltt-accent)}",
    ".ltt-badge.accent i{background:var(--ltt-accent)}",
    ".ltt-anno{position:relative}",
    ".ltt-mk{position:absolute;z-index:3;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--ltt-on-accent);background:var(--ltt-accent);box-shadow:0 0 0 3px var(--ltt-card),0 4px 10px rgba(0,0,0,.18);transition:transform .2s;cursor:default}",
    ".ltt-mk.good{background:var(--ltt-good)}",
    ".ltt-mk.bad{background:var(--ltt-bad)}",
    ".ltt-mk.warn{background:var(--ltt-warn)}",
    ".ltt-mk .ltt-ic{width:15px;height:15px}",
    ".ltt-mk.on{transform:translate(-50%,-50%) scale(1.22)}",
    "@keyframes ltt-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}70%{transform:translate(-50%,-50%) scale(1.12)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}",
    ".ltt-mk.pop{animation:ltt-pop .45s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(250ms + var(--i,0)*140ms)}",
    ".ltt-pts{list-style:none;margin:0;padding:0;display:grid;gap:clamp(10px,2vh,20px)}",
    ".ltt-pts li{display:grid;grid-template-columns:28px 1fr;column-gap:12px;align-items:start;border-radius:12px;transition:background-color .2s}",
    ".ltt-pts li.on{background:color-mix(in srgb,var(--ltt-ink) 4%,transparent)}",
    ".ltt-pts .n{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--ltt-on-accent);background:var(--ltt-accent);margin-top:1px}",
    ".ltt-pts .n .ltt-ic{width:15px;height:15px}",
    ".ltt-pts li.good .n{background:var(--ltt-good)}",
    ".ltt-pts li.bad .n{background:var(--ltt-bad)}",
    ".ltt-pts li.warn .n{background:var(--ltt-warn)}",
    ".ltt-pts b{display:block;font-size:clamp(17px,1.6vw,21px);font-weight:800;letter-spacing:-.02em;line-height:1.35}",
    ".ltt-pts p{margin:3px 0 0;color:var(--ltt-muted);font-size:clamp(14.5px,1.25vw,16.5px);line-height:1.5}",
    ".ltt-ba{display:grid;grid-template-columns:minmax(0,1fr) 52px minmax(0,1fr);align-items:center;gap:0}",
    ".ltt-ba-side{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:clamp(12px,1.6vw,22px);background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(10px,1vw,14px);box-shadow:var(--ltt-shadow);height:100%;box-sizing:border-box}",
    ".ltt-ba-stage{background:var(--ltt-card-2);border-radius:var(--ltt-r-md);display:flex;align-items:center;justify-content:center;padding:clamp(10px,1.4vw,18px);min-width:0}",
    ".ltt-ba-rail{display:flex;flex-direction:column;gap:clamp(10px,1.8vh,18px);padding:clamp(6px,.8vw,12px) clamp(4px,.6vw,10px) 6px 0;min-width:0}",
    ".ltt-ba-rail .ltt-badge{align-self:flex-start}",
    ".ltt-ba-foot{margin-top:auto;border-top:1px solid var(--ltt-line);padding-top:12px;font-size:13px;color:var(--ltt-muted)}",
    ".ltt-ba-foot .lab{font-size:12px;margin-bottom:8px}",
    ".ltt-ba-arrow{justify-self:center;width:44px;height:44px;border-radius:50%;background:var(--ltt-ink);color:var(--ltt-bg);display:flex;align-items:center;justify-content:center;font-size:20px;z-index:1}",
    ".ltt-ba{container-type:inline-size}",
    "@container (max-width:900px){.ltt-ba-side{grid-template-columns:1fr}}",
    ".ltt-take{display:flex;align-items:center;gap:16px;flex-wrap:wrap;background:var(--ltt-dark);color:var(--ltt-on-dark);border-radius:var(--ltt-r-lg);padding:clamp(12px,1.6vh,18px) clamp(14px,1.6vw,24px)}",
    ".ltt-take .k{flex:none;background:var(--ltt-accent-on-dark);color:var(--ltt-dark);font-size:14px;font-weight:800;padding:6px 18px;border-radius:999px}",
    ".ltt-take .t{flex:1 1 320px;font-size:clamp(16px,1.6vw,21px);font-weight:750;letter-spacing:-.02em;line-height:1.4}",
    ".ltt-take .src{flex:0 1 auto;font-size:13px;color:color-mix(in srgb,var(--ltt-on-dark) 65%,transparent);display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}",
    ".ltt-take .src b{color:var(--ltt-accent-on-dark);font-weight:700;white-space:nowrap}",
    ".ltt-narr{margin:0;font-size:clamp(16px,1.4vw,19.5px);line-height:1.7;color:var(--ltt-ink-2)}",
    ".ltt-narr b,.ltt-narr strong{color:var(--ltt-ink)}",
    ".ltt-narr+.ltt-narr{margin-top:8px}",
    ".ltt-callout{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;align-items:start;padding:14px 16px;border-radius:16px;background:var(--ltt-accent-soft);color:var(--ltt-ink);font-size:15px;line-height:1.55}",
    ".ltt-callout>.ltt-ic{width:20px;height:20px;color:var(--ltt-accent);margin-top:2px;grid-row:span 2}",
    ".ltt-callout b{display:block}",
    ".ltt-callout.warn{background:var(--ltt-warn-soft)}",
    ".ltt-callout.warn>.ltt-ic{color:var(--ltt-warn)}",
    ".ltt-callout.bad{background:var(--ltt-bad-soft)}",
    ".ltt-callout.bad>.ltt-ic{color:var(--ltt-bad)}",
    ".ltt-callout.good{background:var(--ltt-good-soft)}",
    ".ltt-callout.good>.ltt-ic{color:var(--ltt-good)}",
    ".ltt-sw{display:flex;flex-direction:column;gap:8px}",
    ".ltt-sw .row{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap}",
    ".ltt-sw .it{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--ltt-muted)}",
    ".ltt-sw .it i{display:block;border-radius:var(--r,8px);background:var(--c);width:var(--w,30px);height:var(--h,30px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ltt-ink) 8%,transparent)}",
    ".ltt-sw .cap{font-size:13px;color:var(--ltt-muted)}",
    ".ltt-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:clamp(10px,1.4vw,18px)}",
    ".ltt-fact{display:flex;align-items:center;gap:14px;background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(14px,1.6vw,20px);box-shadow:var(--ltt-shadow)}",
    ".ltt-fact .ic{flex:none;width:48px;height:48px;border-radius:15px;background:var(--ltt-accent-soft);color:var(--ltt-accent);display:flex;align-items:center;justify-content:center}",
    ".ltt-fact .ic .ltt-ic{width:26px;height:26px}",
    ".ltt-fact .v{font-size:clamp(22px,2.3vw,30px);font-weight:850;letter-spacing:-.04em;line-height:1.1;font-variant-numeric:tabular-nums}",
    ".ltt-fact .l{font-size:15px;color:var(--ltt-muted);line-height:1.4;margin-top:2px}",
    ".ltt-fact.bad .ic{background:var(--ltt-bad-soft);color:var(--ltt-bad)}",
    ".ltt-fact.good .ic{background:var(--ltt-good-soft);color:var(--ltt-good)}",
    ".ltt-fact.warn .ic{background:var(--ltt-warn-soft);color:var(--ltt-warn)}",
    ".ltt-panel{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(14px,1.6vw,22px);box-shadow:var(--ltt-shadow)}",
    ".ltt-panel.soft{background:var(--ltt-card-2);box-shadow:none}",
    ".ltt-cf{width:min(100%,980px);border-top:1px solid var(--ltt-ink);padding-top:10px;position:relative}",
    ".ltt-cf::before{content:'';position:absolute;top:-1px;left:0;width:64px;height:5px;background:var(--ltt-ink)}",
    ".ltt-cf h3{font:var(--ltt-display-weight) clamp(17px,1.6vw,22px)/1.25 var(--ltt-font-display);margin:6px 0 2px}",
    ".ltt-cf .dek{margin:0 0 8px;color:var(--ltt-ink-2);font-size:clamp(13px,1.1vw,15px)}",
    ".ltt-cf .src{margin:6px 0 0;color:var(--ltt-muted);font-size:12px}",
    ".ltt-cf svg{width:100%;height:auto;display:block}",
    ".ltt-cf .ltt-stepper,.ltt-cf .ltt-caption{margin-top:8px}",
    ".ltt-insp{width:min(100%,380px);border-radius:var(--ltt-r-md);background:var(--ltt-card);box-shadow:var(--ltt-shadow),inset 0 0 0 1.5px var(--ltt-line);font-size:13px;color:var(--ltt-ink-2)}",
    ".ltt-insp header{padding:10px 14px;border-bottom:1px solid var(--ltt-line);font:700 12px var(--ltt-mono);color:var(--ltt-muted);letter-spacing:.03em}",
    ".ltt-insp .r{display:grid;grid-template-columns:22px 44px 1fr auto;gap:10px;align-items:center;padding:12px 14px;border-bottom:1px solid var(--ltt-line)}",
    ".ltt-insp .r:last-child{border-bottom:0}",
    ".ltt-insp .n{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--ltt-muted);color:var(--ltt-on-accent);font:700 11px var(--ltt-mono)}",
    ".ltt-insp .r.fail .n{background:var(--ltt-bad)}",
    ".ltt-insp .r.pass .n{background:var(--ltt-good)}",
    ".ltt-insp .aa{display:grid;place-items:center;height:36px;border-radius:8px;font-weight:800;font-size:15px;box-shadow:inset 0 0 0 1px var(--ltt-line)}",
    ".ltt-insp b{display:block;color:var(--ltt-ink);font-size:13.5px}",
    ".ltt-insp code{font:11.5px var(--ltt-mono);color:var(--ltt-muted)}",
    ".ltt-insp .v{text-align:right;font:800 17px var(--ltt-mono);color:var(--ltt-ink)}",
    ".ltt-insp .v .ltt-tag{display:block;margin:4px 0 0;font-family:var(--ltt-font)}",
    ".ltt-redline [data-gap]{position:relative}",
    ".ltt-redline [data-gap]::after{content:attr(data-gap);position:absolute;right:var(--ltt-redline-x,-14px);bottom:100%;height:var(--g);display:flex;align-items:center;padding-right:6px;border-right:1.5px solid var(--ltt-accent);font:700 10px var(--ltt-mono);color:var(--ltt-accent);white-space:nowrap}",
    ".ltt-recall{display:grid;gap:8px}",
    ".ltt-recall .q{margin:0;font-family:var(--ltt-font-display);font-size:clamp(17px,1.5vw,21px);font-weight:var(--ltt-display-weight);letter-spacing:-.02em;line-height:1.35}",
    ".ltt-recall .row{display:flex;gap:8px;align-items:stretch}",
    ".ltt-recall .row textarea{flex:1;min-width:0;font:inherit;font-size:15px;line-height:1.4;padding:7px 12px;border:1.5px solid var(--ltt-line-2);border-radius:12px;background:var(--ltt-card);color:var(--ltt-ink);resize:vertical}",
    ".ltt-recall .row .dk-actions{flex:none}",
    ".ltt-recall .a{border-left:3px solid var(--ltt-accent);padding:2px 0 2px 14px}",
    ".ltt-recall .a p{margin:0;font-size:clamp(15px,1.4vw,19px);line-height:1.55;color:var(--ltt-ink-2)}",
    ".ltt-recall .a .ask{margin-top:6px;font-size:clamp(13.5px,1.15vw,15.5px);color:var(--ltt-ink-2)}",
    ".ltt-recall .a .ask b{color:var(--ltt-accent);font-size:12px;margin-right:6px}"
  ].join("")/* css:end */;

  function h(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // Accepts HTML string, a DOM node, or fn(node) that fills the node or returns a node/string to insert.
  function fill(node, v, ctx) {
    if (v == null) return node;
    if (typeof v === "function") { var r = v(node, ctx); if (r !== node && (typeof r === "string" || (typeof Node !== "undefined" && r instanceof Node))) fill(node, r, ctx); }
    else if (typeof Node !== "undefined" && v instanceof Node) node.appendChild(v);
    else node.innerHTML = v;
    return node;
  }

  function chips(list) {
    var w = h("div", "ltt-chips");
    (list || []).forEach(function (c) {
      var o = typeof c === "string" ? { text: c } : c;
      var s = h("span", "ltt-chip" + (o.tone ? " " + o.tone : ""));
      s.innerHTML = (o.icon ? LTT.icon(o.icon) : o.dot ? "<i class='dot'></i>" : "") + "<span></span>";
      s.lastChild.innerHTML = o.text;
      w.appendChild(s);
    });
    return w;
  }

  var BADGE = { before: ["bad", "x", "Before"], after: ["good", "check", "After"], bad: ["bad", "x"], good: ["good", "check"], warn: ["warn", "alert"], accent: ["accent", "bulb"] };

  function badge(kind, text) {
    var b = BADGE[kind] || BADGE.accent;
    return "<span class='ltt-badge " + b[0] + "'><i>" + LTT.icon(b[1], { weight: 2.6 }) + "</i>" + (text || b[2] || "") + "</span>";
  }

  function markerFace(p, i) {
    return p.tone === "bad" ? LTT.icon("x", { weight: 3 }) : String(p.n || i + 1);
  }

  // points: [{at: [x%, y%] (optional), title, text, tone: accent|good|bad|warn}]. Markers go on `target`;
  // the numbered list is returned for the caller to place (the deck puts it in the explanation rail).
  function annotate(target, points, opts) {
    opts = opts || {};
    var tone = opts.tone || "accent";
    if (target) {
      target.classList.add("ltt-anno");
      if (getComputedStyle(target).position === "static") target.style.position = "relative";
    }
    var list = h("ol", "ltt-pts"), marks = [];
    points.forEach(function (p, i) {
      var t = p.tone || tone;
      var li = h("li", t);
      li.innerHTML = "<span class='n'>" + markerFace(p, i) + "</span><div><b></b>" + (p.text ? "<p></p>" : "") + "</div>";
      li.querySelector("b").innerHTML = p.title || "";
      if (p.text) li.querySelector("p").innerHTML = p.text;
      list.appendChild(li);
      var mk = null;
      if (target && p.at) {
        mk = h("span", "ltt-mk " + t, markerFace(p, i));
        mk.style.left = p.at[0] + "%";
        mk.style.top = p.at[1] + "%";
        mk.style.setProperty("--i", i);
        target.appendChild(mk);
      }
      marks.push(mk);
      var on = function (v) { li.classList.toggle("on", v); if (mk) mk.classList.toggle("on", v); };
      [li, mk].forEach(function (n) {
        if (!n) return;
        n.addEventListener("mouseenter", function () { on(true); });
        n.addEventListener("mouseleave", function () { on(false); });
      });
    });
    return {
      list: list,
      markers: marks,
      replay: function () {
        marks.forEach(function (m) { if (!m) return; m.classList.remove("pop"); void m.offsetWidth; m.classList.add("pop"); });
      }
    };
  }

  // side: {visual, points, label, tone, foot: {label, caption, visual}, pointsOn}; `pointsOn` picks the marker target inside the stage.
  function beforeAfter(spec, ctx) {
    var w = h("div", "ltt-ba"), sides = {}, annos = [];
    ["before", "after"].forEach(function (key, k) {
      var s = spec[key] || {};
      var side = h("div", "ltt-ba-side"), stage = h("div", "ltt-ba-stage"), rail = h("div", "ltt-ba-rail");
      fill(stage, s.visual, ctx);
      rail.innerHTML = badge(s.tone || (key === "before" ? "before" : "after"), s.label);
      if (s.points) {
        var target = s.pointsOn ? stage.querySelector(s.pointsOn) : stage.firstElementChild;
        var a = annotate(target, s.points, { tone: key === "before" ? "bad" : "good" });
        rail.appendChild(a.list);
        annos.push(a);
      }
      if (s.foot) {
        var f = h("div", "ltt-ba-foot");
        if (s.foot.label) f.appendChild(h("div", "lab", s.foot.label));
        fill(f.appendChild(h("div")), s.foot.visual, ctx);
        if (s.foot.caption) f.appendChild(h("div", "cap", s.foot.caption));
        rail.appendChild(f);
      }
      side.append(stage, rail);
      w.appendChild(side);
      if (k === 0) w.appendChild(h("div", "ltt-ba-arrow", LTT.icon("arrow", { weight: 2.4 })));
      sides[key] = { side: side, stage: stage, rail: rail };
    });
    return { el: w, before: sides.before, after: sides.after, replay: function () { annos.forEach(function (a) { a.replay(); }); } };
  }

  function takeaway(text, sources) {
    var w = h("div", "ltt-take");
    w.innerHTML = "<span class='k'>핵심</span><span class='t'></span>";
    w.querySelector(".t").innerHTML = text;
    if (sources && sources.length) {
      var s = h("span", "src", "<b>찾아볼 곳</b><span></span>");
      s.lastChild.innerHTML = [].concat(sources).join(" · ");
      w.appendChild(s);
    }
    return w;
  }

  function narration(html) {
    var w = document.createDocumentFragment();
    [].concat(html).forEach(function (p) { w.appendChild(h("p", "ltt-narr", p)); });
    return w;
  }

  function callout(html, opts) {
    opts = opts || {};
    var ic = { warn: "alert", bad: "alert", good: "check" }[opts.tone] || "bulb";
    var w = h("div", "ltt-callout" + (opts.tone ? " " + opts.tone : ""));
    w.innerHTML = LTT.icon(opts.icon || ic) + (opts.title ? "<b></b>" : "") + "<div></div>";
    if (opts.title) w.querySelector("b").innerHTML = opts.title;
    w.lastChild.innerHTML = html;
    return w;
  }

  // items: [{color, label, w, h, r, border}] in px; a swatch row for "what was used" style mini-infographics.
  function swatches(items, opts) {
    opts = opts || {};
    var w = h("div", "ltt-sw"), row = h("div", "row");
    items.forEach(function (it) {
      var c = h("span", "it");
      var sw = h("i");
      sw.style.setProperty("--c", it.color || "var(--ltt-line)");
      if (it.w) sw.style.setProperty("--w", it.w + "px");
      if (it.h) sw.style.setProperty("--h", it.h + "px");
      if (it.r != null) sw.style.setProperty("--r", typeof it.r === "number" ? it.r + "px" : it.r);
      if (it.border) sw.style.boxShadow = "inset 0 0 0 2px " + it.border;
      c.appendChild(sw);
      if (it.label != null) c.appendChild(h("span", null, it.label));
      row.appendChild(c);
    });
    w.appendChild(row);
    if (opts.caption) w.appendChild(h("div", "cap", opts.caption));
    return w;
  }

  // items: [{icon, value, label, tone}]; the givens of a situation as a row of stat cards.
  function facts(items) {
    var w = h("div", "ltt-facts");
    items.forEach(function (it) {
      var c = h("div", "ltt-fact" + (it.tone ? " " + it.tone : ""));
      c.innerHTML = (it.icon ? "<span class='ic'>" + LTT.icon(it.icon) + "</span>" : "") + "<div><div class='v'></div><div class='l'></div></div>";
      c.querySelector(".v").innerHTML = it.value;
      c.querySelector(".l").innerHTML = it.label || "";
      w.appendChild(c);
    });
    return w;
  }

  // Newspaper chart frame: rule with a thick tab, headline, dek, then the chart, then a source line added by foot().
  function chartFrame(o) {
    var w = h("div", "ltt-cf");
    w.appendChild(h("h3", null, o.title || ""));
    if (o.dek) w.appendChild(h("p", "dek", o.dek));
    return { el: w, foot: function () { if (o.source) w.appendChild(h("p", "src", o.source)); return w; } };
  }

  // Design-tool style contrast check. rows: [{name, fg, bg, ratio}]; ratio defaults to LTT.contrast(fg, bg).
  function inspector(o) {
    var min = o.min || 4.5, label = o.level || "AA " + min;
    return "<div class='ltt-insp'><header>" + (o.title || "CONTRAST CHECK") + "</header>" + o.rows.map(function (r, i) {
      var v = r.ratio != null ? +r.ratio : LTT.contrast(r.fg, r.bg), ok = v >= min, shown = r.ratio != null ? r.ratio : v.toFixed(2);
      return "<div class='r " + (ok ? "pass" : "fail") + "'><span class='n'>" + (i + 1) + "</span><span class='aa' style='color:" + r.fg + ";background:" + r.bg + "'>Aa</span>" +
        "<span><b>" + r.name + "</b><code>" + r.fg + " on " + r.bg + "</code></span><span class='v'>" + shown +
        "<span class='ltt-tag " + (ok ? "good" : "bad") + "'>" + label + " " + (ok ? "통과" : "미달") + "</span></span></div>";
    }).join("") + "</div>";
  }

  // Measurement bars for the margin above each target, drawn in the container's right padding; call update() after restyling.
  // Inline margin-top is read first because a figure is often styled before it is attached, when computed style is empty.
  function redline(container, o) {
    o = o || {};
    container.classList.add("ltt-redline");
    if (o.x != null) container.style.setProperty("--ltt-redline-x", o.x + "px");
    function update() {
      container.querySelectorAll(o.selector || ":scope > *").forEach(function (n) {
        var g = Math.round(parseFloat(n.style.marginTop || getComputedStyle(n).marginTop) || 0);
        if (g > 0) { n.dataset.gap = g; n.style.setProperty("--g", g + "px"); } else { delete n.dataset.gap; n.style.removeProperty("--g"); }
      });
    }
    update();
    return { update: update };
  }

  // Retrieval practice: question, a box for the learner's own answer, then the model answer behind a button.
  // With `hold` the caller keeps the answer out of the layout itself (a deck reserves its space); otherwise it is hidden.
  function recall(el, opts) {
    if (!opts || !opts.question) throw new Error("recall: question이 필요하다");
    el.classList.add("ltt-recall");
    var q = el.appendChild(h("p", "q"));
    q.innerHTML = opts.question;
    var row = el.appendChild(h("div", "row"));
    var box = row.appendChild(h("textarea"));
    box.rows = 1;
    box.placeholder = "떠올린 답 (적지 않아도 된다)";
    var btn = row.appendChild(h("div", "dk-actions")).appendChild(h("button", "ghost", "답 보기"));
    var a = el.appendChild(h("div", "a", "<p></p>"));
    a.firstChild.innerHTML = opts.answer == null ? "" : opts.answer;
    if (opts.ask) a.appendChild(h("p", "ask", "<b>agent에게</b>" + opts.ask));
    if (opts.hold) opts.hold(a); else a.hidden = true;
    function reveal() {
      if (btn.disabled) return;
      a.hidden = false;
      btn.disabled = true;
      if (opts.onReveal) opts.onReveal(a);
      LTT.linkTerms(a);
      LTT.record("recall", { scene: opts.title, question: String(opts.question).replace(/<[^>]*>/g, ""), answer: box.value.trim() });
    }
    btn.onclick = reveal;
    return { answer: a, reveal: reveal };
  }

  if (typeof document !== "undefined") {
    var style = document.createElement("style");
    style.id = "ltt-ui-style";
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  LTT.h = h;
  LTT.fill = fill;
  LTT.chips = chips;
  LTT.badge = badge;
  LTT.annotate = annotate;
  LTT.beforeAfter = beforeAfter;
  LTT.takeaway = takeaway;
  LTT.narration = narration;
  LTT.callout = callout;
  LTT.swatches = swatches;
  LTT.facts = facts;
  LTT.chartFrame = chartFrame;
  LTT.inspector = inspector;
  LTT.redline = redline;
  LTT.recall = recall;
})(typeof globalThis !== "undefined" ? globalThis : this);
