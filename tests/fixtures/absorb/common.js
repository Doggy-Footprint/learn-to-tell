// Shared observation helpers for tests/absorb.test.mjs. Nothing here knows how the kit absorbs: it builds figures of known
// pixel size and reads rendered geometry back. Heights are divided by the effective zoom f (a fixed 100px probe) so that
// a scene the kit also zooms still yields the pixel size the author wrote.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const A = (window.A = { NS, q: new URLSearchParams(location.search) });
  A.init = {};
  A.muts = {};
  A.num = (k, d) => (A.q.has(k) ? Number(A.q.get(k)) : d);
  A.wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // 640x400 viewBox drawn at w px wide, so the natural height is w * 400 / 640 unless h is given.
  A.svg = (k, w, h, style = "") => {
    // w may be a number (px) or a CSS length string.
    const W = typeof w === "number" ? w + "px" : w;
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 640 400");
    s.setAttribute("data-k", k);
    s.setAttribute("style", `display:block;width:${W};${h ? `height:${h}px;` : ""}${style}`);
    const r = document.createElementNS(NS, "rect");
    r.setAttribute("x", "10"); r.setAttribute("y", "10"); r.setAttribute("width", "620"); r.setAttribute("height", "380");
    r.setAttribute("fill", "#9bb"); r.setAttribute("stroke", "#245"); r.setAttribute("stroke-width", "6");
    s.appendChild(r);
    A.init[k] = { raw: s.getAttribute("style"), css: s.style.cssText };
    // Watch from creation (before the kit mounts or measures it); the fixture never touches the drawing after this point.
    const names = [];
    const mo = new MutationObserver((list) => { for (const m of list) names.push(m.attributeName); });
    mo.observe(s, { attributes: true, subtree: true });
    A.muts[k] = { names, mo };
    return s;
  };
  A.spacer = (px) => { const d = document.createElement("div"); d.className = "sp"; d.setAttribute("style", `height:${px}px;margin:0;padding:0`); return d; };
  // The stage is a flex row; a block wrapper keeps figure and spacer stacked so heights add.
  A.col = (...kids) => { const d = document.createElement("div"); d.className = "a-col"; d.setAttribute("style", "display:block;margin:0 auto"); for (const k of kids) d.appendChild(k); return d; };
  A.cur = () => document.querySelector(".dk-scene.cur");

  A.probe = (scene) => {
    let p = scene.querySelector(".a-probe");
    if (!p) {
      p = document.createElement("div");
      p.className = "a-probe";
      p.setAttribute("style", "position:fixed;left:0;top:0;width:1px;height:100px;visibility:hidden;pointer-events:none");
      (scene.querySelector(".dk-body") || scene).appendChild(p);
    }
    return p;
  };
  A.zoomOf = (el) => parseFloat(getComputedStyle(el).zoom || "1");

  // One observation of a scene: zoom (.dk-in computed), effective zoom f, every [data-k] element's pixel height/width/aspect and inline style.
  A.snap = (scene = A.cur()) => {
    const f = A.probe(scene).getBoundingClientRect().height / 100;
    const inEl = scene.querySelector(".dk-in");
    const els = {};
    // Prototype calls and try/catch: the error-injection fixtures replace these members on the figure itself.
    const rectOf = (e) => Element.prototype.getBoundingClientRect.call(e);
    const attempt = (fn) => { try { return fn(); } catch { return null; } };
    for (const e of scene.querySelectorAll("[data-k]")) {
      const r = rectOf(e);
      const mu = A.muts[e.getAttribute("data-k")];
      if (mu) for (const m of mu.mo.takeRecords()) mu.names.push(m.attributeName);
      els[e.getAttribute("data-k")] = { mut: mu ? [...mu.names] : null, h: r.height / f, w: r.width / f, ratio: r.width / r.height, style: e.getAttribute("style"), css: attempt(() => e.style.cssText), maxH: getComputedStyle(e).maxHeight };
    }
    return {
      f, zIn: inEl ? A.zoomOf(inEl) : null, els,
      // cap is the stage height the spec names (clientHeight - 8); inH is the content block (.dk-in) in unzoomed px.
      cap: scene.clientHeight - 8, inH: inEl ? inEl.getBoundingClientRect().height / f : null,
      limits: [...scene.querySelectorAll(".dk-body *")].filter((e) => /max-height/.test(e.getAttribute("style") || "")).map((e) => [e.getAttribute("data-k") || e.tagName.toLowerCase(), (e.getAttribute("style").match(/max-height:\s*([^;]+)/) || [])[1]]),
    };
  };

  A.fakeWidth = (w) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, get: () => w });
    window.dispatchEvent(new Event("resize"));
  };
})();
