import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { Runtime } from "./runtime.js";

function injectCss() {
  if (document.querySelector("link[data-ltt-katex]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("./katex/katex.min.css", import.meta.url).href;
  link.setAttribute("data-ltt-katex", "");
  document.head.appendChild(link);
}

/** JSON-safe copy; render-only fields are non-enumerable and dropped. @param {any} v */
const plain = (v) => JSON.parse(JSON.stringify(v));

/**
 * @param {HTMLElement} el
 * @param {import("ltt").LessonFactory} factory
 * @param {{ start?: number }} [o]
 */
export function mount(el, factory, o = {}) {
  injectCss();
  const rt = new Runtime(factory, o);
  if (rt.loadError !== null) console.error(`ltt: lesson failed to load: ${rt.loadError}`);
  if (rt.input?.meta?.title) document.title = rt.input.meta.title;
  window.addEventListener("error", (e) => console.error("ltt: uncaught", e.message));
  /** @type {any} */ (window).__ltt = {
    goto: (/** @type {number} */ n) => rt.goto(n),
    freeze: (/** @type {number} */ t, /** @type {number | undefined} */ step) => rt.freeze(t, step),
    state: () => plain(rt.snapshot()),
    layout: () => plain(rt.layouts.filter((l) => l && !l.failed)),
    answer: (/** @type {boolean} */ correct) => rt.answer(!!correct),
    ready: () => rt.ready(),
    timeInfo: () => {
      const tk = rt.timeSpec();
      return plain({ kind: tk.kind, f: { loop: tk.f.loop ? { span: tk.f.loop.span } : undefined }, nsteps: rt.stepCount() });
    },
    info: () => ({ scenes: rt.scenes.map((s) => ({ index: s.index, path: s.path, type: s.type })), viewport: rt.viewport, reduced: rt.reduced, loadError: rt.loadError }),
  };
  createRoot(el).render(<App rt={rt} />);
  const loop = (/** @type {number} */ wall) => {
    if (rt.tick(wall)) rt.relayout();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
