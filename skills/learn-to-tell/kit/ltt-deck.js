(function (root) {
  "use strict";
  var LTT = root.LTT;
  if (!LTT || !LTT.predict) throw new Error("ltt-deck.js needs ltt.js and ltt-parts.js loaded first");

  var STYLE = [
    "html,body{height:100%}body{overflow:hidden;background:var(--ltt-bg)}",
    ".dk{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr auto;height:100vh;height:100dvh;max-width:1180px;margin:0 auto;padding:0 clamp(16px,3vw,40px);box-sizing:border-box}",
    ".dk-top{display:flex;align-items:center;gap:16px;padding:14px 0 6px}",
    ".dk-top h1{font-size:14px;font-weight:700;color:var(--ltt-muted);margin:0;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".dk-dots{display:flex;gap:4px;flex:0 1 auto;min-width:0}.dk-dots i{width:22px;flex:0 1 22px;min-width:4px;height:5px;border-radius:3px;background:var(--ltt-line);cursor:pointer;transition:background-color .3s}",
    ".dk-dots i.on{background:var(--ltt-accent)}",
    ".dk-stage{position:relative;min-height:0}",
    ".dk-scene{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:clamp(12px,2.2vh,24px);overflow:auto;",
    "padding:8px 2px;opacity:0;visibility:hidden;transform:translateX(24px);transition:opacity .35s,transform .45s cubic-bezier(.2,.7,.2,1),visibility 0s .45s}",
    ".dk-scene.prev{transform:translateX(-24px)}",
    ".dk-scene.cur{opacity:1;visibility:visible;transform:none;transition:opacity .35s,transform .45s cubic-bezier(.2,.7,.2,1)}",
    ".dk-kicker{font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--ltt-accent);text-transform:uppercase}",
    ".dk-scene h2{font-size:clamp(22px,3.2vw,34px);line-height:1.25;letter-spacing:-.02em;margin:2px 0 0}",
    ".dk-sub{font-size:clamp(15px,1.6vw,18px);color:var(--ltt-muted);margin:0;max-width:62ch}",
    ".dk-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0 16px}",
    ".dk-nav .ghost{background:transparent;color:var(--ltt-muted);border:1px solid var(--ltt-line)}",
    ".dk-hint{font-size:12px;color:var(--ltt-muted)}",
    /* hook */
    ".dk-hook{display:grid;grid-template-columns:auto 1fr;gap:clamp(16px,4vw,48px);align-items:center}",
    ".dk-hook .art{font-size:clamp(64px,12vw,140px);line-height:1}",
    ".dk-hook .big{font-size:clamp(26px,4.4vw,48px);font-weight:800;line-height:1.2;letter-spacing:-.03em;margin:0}",
    /* explain */
    ".dk-steps{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:clamp(10px,2vw,28px);align-items:stretch}",
    ".dk-step{position:relative;background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:18px;padding:clamp(14px,2vw,24px)}",
    ".dk-step .ic{font-size:clamp(34px,4.4vw,52px);line-height:1;margin-bottom:10px}",
    ".dk-step b{display:block;font-size:clamp(16px,1.7vw,20px);margin-bottom:6px}",
    ".dk-step p{margin:0;color:var(--ltt-muted);font-size:clamp(14px,1.4vw,16px)}",
    ".dk-steps.arrows .dk-step:not(:last-child)::after{content:'→';position:absolute;right:calc(-1 * clamp(10px,2vw,28px) / 2 - 8px);",
    "top:50%;transform:translateY(-50%);font-size:20px;color:var(--ltt-accent);font-weight:800}",
    /* compare */
    ".dk-cmp{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:clamp(10px,1.6vw,20px)}",
    ".dk-item{display:flex;flex-direction:column;gap:10px;background:var(--ltt-card);border:2px solid var(--ltt-line);border-radius:18px;",
    "padding:clamp(12px,1.6vw,20px);transition:border-color .3s,box-shadow .3s}",
    ".dk-item .lab{font-size:13px;font-weight:700;color:var(--ltt-muted)}",
    ".dk-item .vis{flex:1;display:flex;align-items:center;justify-content:center;min-height:90px}",
    ".dk-item .vd{font-weight:700;opacity:0;transform:translateY(6px);transition:opacity .4s,transform .4s}",
    ".dk-cmp.shown .dk-item .vd{opacity:1;transform:none}",
    ".dk-cmp.shown .dk-item.good{border-color:var(--ltt-good)}.dk-cmp.shown .dk-item.bad{border-color:var(--ltt-bad)}.dk-cmp.shown .dk-item.warn{border-color:var(--ltt-warn)}",
    ".dk-item.good .vd{color:var(--ltt-good)}.dk-item.bad .vd{color:var(--ltt-bad)}.dk-item.warn .vd{color:var(--ltt-warn)}",
    ".dk-item .note{font-size:14px;color:var(--ltt-muted);margin:0;transition:opacity .4s}.dk-cmp:not(.shown) .dk-item .note.after{opacity:0}",
    /* predict */
    ".dk-pred .ltt-choices button{padding:14px 16px;font-size:clamp(15px,1.5vw,17px)}",
    ".dk-why{font-size:clamp(15px,1.6vw,18px);background:var(--ltt-card);border-left:4px solid var(--ltt-accent);padding:12px 16px;border-radius:0 12px 12px 0;margin:0}",
    /* keywords */
    ".dk-kw{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(12px,2vw,24px)}",
    ".dk-kw section{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:18px;padding:clamp(14px,1.8vw,22px)}",
    ".dk-kw h3{font-size:13px;letter-spacing:.06em;color:var(--ltt-muted);margin:0 0 10px;text-transform:uppercase}",
    ".dk-term{font-size:clamp(20px,2.4vw,28px);font-weight:800;line-height:1.25}.dk-term small{display:block;font-size:14px;font-weight:600;color:var(--ltt-accent)}",
    ".dk-kw ul{margin:0;padding-left:1.1em}.dk-kw li{margin:4px 0}",
    ".dk-q{display:inline-block;font:13px ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--ltt-bg);border:1px solid var(--ltt-line);",
    "border-radius:8px;padding:4px 8px;margin:0 6px 6px 0;cursor:copy}",
    ".dk-nb{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px}.dk-nb b{white-space:nowrap}.dk-nb span{color:var(--ltt-muted)}",
    /* shared */
    ".dk-math summary{cursor:pointer;font-size:13px;color:var(--ltt-muted)}.dk-math{font-size:15px}",
    ".dk-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:clamp(12px,2vh,20px)}",
    ".dk-scene .ltt-tag{font-size:11px}",
    "@media (max-width:720px){.dk-steps{grid-template-columns:repeat(min(var(--n),2),minmax(0,1fr))}.dk-cmp{grid-template-columns:repeat(var(--m,min(var(--n),2)),minmax(0,1fr))}.dk-steps.arrows .dk-step::after{display:none}",
    ".dk-kw{grid-template-columns:1fr}.dk-hook{grid-template-columns:1fr}.dk-dots i{width:12px}.dk-hint{display:none}.dk-item{padding:10px;gap:6px}.dk-item .note{font-size:12px}.dk-item .vis{min-height:60px}.dk-step .ic{margin-bottom:4px}",
    ".dk-scene{gap:10px}.dk-kw{gap:10px}.dk-kw section{padding:12px 14px}.dk-kw h3{margin-bottom:6px}.dk-kw li{margin:2px 0;font-size:14px;line-height:1.4}.dk-nb{font-size:13px}.dk-q{margin:0 4px 4px 0;font-size:12px;padding:3px 6px}.dk-term{font-size:19px}.dk-sub{font-size:14px}}",
    "@media (max-width:420px){.dk-steps{grid-template-columns:1fr}.dk-step{display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:start;padding:12px 14px}.dk-step .ic{grid-row:span 2;font-size:28px;margin:0}.dk-step b{margin-bottom:2px}}"
  ].join("");

  function h(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function fill(node, v, ctx) {
    if (v == null) return;
    if (typeof v === "function") v(node, ctx);
    else if (v instanceof Node) node.appendChild(v);
    else node.innerHTML = v;
  }

  function rise(nodes) {
    [].forEach.call(nodes, function (n, i) {
      n.classList.remove("ltt-rise");
      void n.offsetWidth;
      n.style.setProperty("--i", i);
      n.classList.add("ltt-rise");
    });
  }

  var TYPES = {
    hook: function (s, body) {
      var w = h("div", "dk-hook");
      w.append(h("div", "art", s.art || ""), h("div", null));
      w.lastChild.append(h("p", "big", s.text), s.sub ? h("p", "dk-sub", s.sub) : "");
      body.appendChild(w);
      return { enter: function () { rise(w.children); } };
    },
    explain: function (s, body) {
      var w = h("div", "dk-steps" + (s.arrows === false ? "" : " arrows"));
      w.style.setProperty("--n", s.steps.length);
      s.steps.forEach(function (st) {
        var c = h("div", "dk-step");
        c.append(h("div", "ic", st.icon || ""), h("b", null, st.title), h("p", null, st.text || ""));
        w.appendChild(c);
      });
      body.appendChild(w);
      return { enter: function () { rise(w.children); } };
    },
    // Verdicts stay hidden until the viewer asks, so side-by-side cases are judged before being labelled.
    compare: function (s, body, ctx) {
      var w = h("div", "dk-cmp");
      w.style.setProperty("--n", s.items.length);
      if (s.cols) w.style.setProperty("--m", s.cols);
      s.items.forEach(function (it) {
        var c = h("div", "dk-item " + (it.tone || ""));
        var vis = h("div", "vis");
        c.append(h("div", "lab", it.label), vis, h("div", "vd", it.verdict || ""), it.note ? h("p", "note" + (it.noteAfter ? " after" : ""), it.note) : "");
        fill(vis, it.visual, ctx);
        w.appendChild(c);
      });
      var replays = s.items.filter(function (it) { return it.enter; });
      body.appendChild(w);
      if (s.reveal === false) w.classList.add("shown");
      else {
        var b = h("button", null, s.revealLabel || "판정 보기");
        b.onclick = function () { w.classList.add("shown"); b.disabled = true;
          s.items.forEach(function (it, k) { if (it.onReveal) it.onReveal(w.children[k].querySelector(".vis")); }); LTT.record("compare-reveal", { scene: s.title }); };
        body.appendChild(h("div", "dk-actions")).appendChild(b);
      }
      return { enter: function () { rise(w.children); replays.forEach(function (it, k) { it.enter(w.children[s.items.indexOf(it)].querySelector(".vis")); }); } };
    },
    predict: function (s, body) {
      var w = h("div", "dk-pred");
      var box = h("div");
      s.choices.forEach(function (c) {
        var b = h("button", null, c.text);
        b.dataset.choice = c.id;
        box.appendChild(b);
      });
      var lock = h("button", null, s.button || "이걸로 정하고 확인");
      var why = h("p", "dk-why ltt-hidden", s.why || "");
      if (s.visual) { var pv = h("div", "dk-pvis"); fill(pv, s.visual); w.appendChild(pv); }
      w.append(box, h("div", "dk-actions"), why);
      w.querySelector(".dk-actions").appendChild(lock);
      body.appendChild(w);
      LTT.predict({ question: s.question || s.title, choices: box, button: lock, answer: s.answer, show: [why],
        reveal: s.reveal });
      return {};
    },
    keywords: function (s, body) {
      var w = h("div", "dk-kw");
      var a = h("section"), b = h("section");
      a.appendChild(h("h3", null, "이 이름으로 기억"));
      (s.terms || []).forEach(function (t) { a.appendChild(h("div", "dk-term", t.ko + (t.en ? "<small>" + t.en + "</small>" : ""))); });
      if (s.signals) {
        a.appendChild(h("h3", null, "이럴 때 떠올린다")).style.marginTop = "16px";
        var ul = h("ul");
        s.signals.forEach(function (x) { ul.appendChild(h("li", null, x)); });
        a.appendChild(ul);
      }
      b.appendChild(h("h3", null, "검색어"));
      (s.queries || []).forEach(function (q) {
        var c = h("span", "dk-q");
        c.textContent = q;
        c.title = "클릭해서 복사";
        c.onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(q); };
        b.appendChild(c);
      });
      if (s.neighbors) {
        b.appendChild(h("h3", null, "헷갈리는 이웃")).style.marginTop = "16px";
        var nb = h("div", "dk-nb");
        s.neighbors.forEach(function (n) { nb.append(h("b", null, n.term), h("span", null, n.diff)); });
        b.appendChild(nb);
      }
      w.append(a, b);
      body.appendChild(w);
      return { enter: function () { rise(w.children); } };
    }
  };

  // Scenes mount lazily on first visit; `enter` runs on every visit so motion replays when the viewer comes back.
  function deck(spec) {
    var style = h("style");
    style.textContent = STYLE;
    document.head.appendChild(style);
    var root_ = h("div", "dk");
    var top = h("header", "dk-top"), dots = h("nav", "dk-dots"), stage = h("div", "dk-stage"), nav = h("footer", "dk-nav");
    top.append(h("h1", null, spec.title), dots);
    var prev = h("button", "ghost", "◀ 이전"), next = h("button", null, "다음 ▶"), hint = h("span", "dk-hint", "← → 키로 이동");
    nav.append(prev, hint, next);
    root_.append(top, stage, nav);
    document.title = spec.title;
    (spec.mountIn ? document.querySelector(spec.mountIn) : document.body).appendChild(root_);

    var scenes = spec.scenes, cur = -1, mounted = [];
    scenes.forEach(function (s, i) {
      var d = h("i");
      d.title = s.title || "";
      d.onclick = function () { go(i); };
      dots.appendChild(d);
      stage.appendChild(h("section", "dk-scene"));
    });

    function mount(i) {
      var s = scenes[i], el = stage.children[i], ctx = { el: el, scene: s, index: i };
      if (s.kicker) el.appendChild(h("div", "dk-kicker", s.kicker));
      if (s.title && s.type !== "hook") el.appendChild(h("h2", null, s.title));
      if (s.sub) el.appendChild(h("p", "dk-sub", s.sub));
      var body = h("div");
      el.appendChild(body);
      var r = TYPES[s.type] ? TYPES[s.type](s, body, ctx) : {};
      var custom = s.mount ? s.mount(body, ctx) : null;
      if (s.tex) {
        var m = h("details", "dk-math");
        m.append(h("summary", null, "수식으로 보기"), h("div"));
        m.lastChild.dataset.tex = s.tex;
        m.lastChild.setAttribute("data-display", "");
        el.appendChild(m);
        LTT.math(m);
      }
      if (s.basis) el.appendChild(h("p", "ltt-basis", s.basis));
      mounted[i] = { enter: function () {
        if (r && r.enter) r.enter();
        if (custom && custom.enter) custom.enter();
        if (s.enter) s.enter(body, ctx);
      }, leave: custom && custom.leave };
    }

    function go(i) {
      i = Math.max(0, Math.min(scenes.length - 1, i));
      if (i === cur) return;
      if (cur >= 0) {
        if (mounted[cur] && mounted[cur].leave) mounted[cur].leave();
        stage.children[cur].classList.remove("cur");
        stage.children[cur].classList.toggle("prev", i > cur);
      }
      if (!mounted[i]) mount(i);
      var el = stage.children[i];
      el.classList.remove("prev");
      el.classList.add("cur");
      el.scrollTop = 0;
      cur = i;
      [].forEach.call(dots.children, function (d, j) { d.classList.toggle("on", j <= i); });
      prev.disabled = i === 0;
      next.textContent = i === scenes.length - 1 ? "끝" : "다음 ▶";
      next.disabled = i === scenes.length - 1;
      try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) { /* file:// or sandboxed */ }
      LTT.record("scene", { index: i, title: scenes[i].title || scenes[i].type });
      mounted[i].enter();
    }

    prev.onclick = function () { go(cur - 1); };
    next.onclick = function () { go(cur + 1); };
    document.addEventListener("keydown", function (e) {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(cur + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(cur - 1); }
    });
    var start = parseInt((location.hash || "").slice(1), 10);
    go(isFinite(start) ? start - 1 : 0);
    return { go: go, get index() { return cur; } };
  }

  LTT.deck = deck;
  LTT.deckTypes = TYPES;
})(typeof globalThis !== "undefined" ? globalThis : this);
