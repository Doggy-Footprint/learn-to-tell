// Test harness for tests/motion.test.mjs. Records draw calls, hook counts, LTT.warn and LTT.record calls against
// page-relative virtual time, drives the page with setTimeout, and writes the result as JSON into <pre id="R">.
(function () {
  const T0 = Date.now();
  const H = (window.H = { log: [], steps: [], warns: [], rec: [], marks: {}, cnt: {}, samples: {}, watch: [], created: [], errors: [], consoleErrors: [] });
  H.now = () => Date.now() - T0;
  window.addEventListener("error", (e) => H.errors.push(String(e.message)));
  const consoleError = console.error;
  console.error = function (...a) { H.consoleErrors.push(a.map(String).join(" ")); return consoleError.apply(this, a); };
  // Player captions carry "#k#" so the DOM, not a kit hook, tells which step is on screen (works for players without an enter hook).
  H.poll = (label, el, every = 50) => {
    let last = null;
    const tick = () => {
      const c = el.querySelector(".ltt-caption"), m = c && /#(\d+)#/.exec(c.textContent), k = m ? +m[1] : null;
      if (k !== null && k !== last) { last = k; H.steps.push(["poll:" + label, k, H.now()]); }
    };
    setInterval(tick, every);
    tick();
  };
  H.vis = (el) => (el ? getComputedStyle(el).visibility : "missing");
  H.draw = (label) => {
    H.created.push([label, H.now()]);
    return (u) => { H.log.push([label, typeof u === "number" ? Math.round(u * 1e4) / 1e4 : String(u), H.now()]); };
  };
  H.step = (label) => (k) => { H.steps.push([label, k, H.now()]); };
  H.inc = (k) => { H.cnt[k] = (H.cnt[k] || 0) + 1; };
  H.bind = (label) => (H.inc(label + ":reg"), LTT.motion.bind({ enter() { H.inc(label + ":enter"); }, leave() { H.inc(label + ":leave"); } }));
  const warn = LTT.warn;
  LTT.warn = function (...a) {
    H.warns.push([H.now(), a.map((x) => (typeof x === "string" ? x : (() => { try { return JSON.stringify(x); } catch { return String(x); } })())).join(" ")]);
    return warn && warn.apply(this, a);
  };
  const record = LTT.record;
  LTT.record = function (...a) {
    let s;
    try { s = JSON.stringify(a); } catch { s = String(a[0]); }
    H.rec.push([H.now(), s]);
    return record && record.apply(this, a);
  };
  let hidden = false;
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
  H.setHidden = (v) => { hidden = v; document.dispatchEvent(new Event("visibilitychange")); };
  H.at = (ms, fn) => setTimeout(() => { try { fn(); } catch (e) { H.errors.push("at " + ms + ": " + (e && e.stack || e)); } }, Math.max(0, ms - H.now()));
  H.mark = (name) => { H.marks[name] = { t: H.now(), cnt: { ...H.cnt }, index: H.deck ? H.deck.index : null }; };
  // The mark time is taken before navigating (entry draws run synchronously inside go), the count/index snapshot after it.
  H.act = (name, fn) => { const t = H.now(), pre = { ...H.cnt }; fn(); H.mark(name); H.marks[name].t = t; H.marks[name].pre = pre; };
  H.go = (name, i) => H.act(name, () => H.deck.go(i));
  H.cur = () => document.querySelector(".dk-scene.cur");
  H.click = (el) => { if (!el) throw new Error("no element to click"); el.click(); };
  H.button = (root, text) => [...root.querySelectorAll("button")].find((b) => b.textContent.trim().includes(text));
  H.done = (ms) => H.at(ms, () => {
    const p = document.createElement("pre");
    p.id = "R";
    p.textContent = JSON.stringify({ log: H.log, steps: H.steps, warns: H.warns, rec: H.rec, marks: H.marks, cnt: H.cnt, samples: H.samples, watch: H.watch, created: H.created, errors: H.errors, consoleErrors: H.consoleErrors, end: H.now() });
    document.body.appendChild(p);
  });
})();
