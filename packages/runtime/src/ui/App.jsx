import { Component, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate } from "motion/mini";
import { FigureView, ErrorPanel } from "./Figure.jsx";
import { txt, parseNumber, loopSlow, pxToData, dataToPx, handlePoint, frameOf, timeKind } from "./runtime.js";
import { numericAnswer } from "../core/answer.mjs";
import { stageBox } from "../layout/constants.mjs";
import { outputsFor, resolveParams } from "../layout/figure.mjs";

const TYPE_LABEL = { hook: "도입", predict: "예측", define: "용어", explain: "설명", steps: "단계", explore: "탐색", compare: "비교", quiz: "확인 문제", summary: "정리" };

/** @param {{ rt: import("./runtime.js").Runtime }} p */
export function App({ rt }) {
  useSyncExternalStore(
    (fn) => rt.subscribe(fn),
    () => rt.version,
  );
  const [term, setTerm] = useState(/** @type {string | null} */ (null));
  useEffect(() => {
    const onKey = (/** @type {KeyboardEvent} */ e) => {
      if (e.key === "Escape" && term) setTerm(null);
      const el = /** @type {HTMLElement | null} */ (e.target);
      const tag = el?.tagName ?? "";
      const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(tag) || el?.isContentEditable;
      const owns = el?.closest?.("[data-ltt-drag],[data-ltt-handle],[data-ltt-order-item]");
      if (e.key === "ArrowRight" && !typing && !owns && !e.altKey && !e.metaKey) {
        if (rt.scene < rt.scenes.length - 1) rt.goto(rt.scene + 1);
        e.preventDefault();
      } else if (e.key === "ArrowLeft" && !typing && !owns && !e.altKey && !e.metaKey) {
        if (rt.scene > 0) rt.goto(rt.scene - 1);
        e.preventDefault();
      } else if ((e.key === " " || e.code === "Space") && !typing && !/^(BUTTON|A)$/.test(tag) && !owns && !el?.closest?.("[role=button],[tabindex]:not(body)")) {
        rt.togglePlay();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rt, term]);
  useEffect(() => setTerm(null), [rt.scene]);

  if (rt.loadError !== null) {
    return (
      <div className={`ltt ltt-${rt.viewport}`}>
        <div className="ltt-load-error">
          <ErrorPanel title="수업을 불러올 수 없습니다" message={rt.loadError} />
        </div>
      </div>
    );
  }
  const s = rt.current;
  const total = rt.scenes.length;
  return (
    <>
      <div className={`ltt ltt-${rt.viewport}`}>
        <header className="ltt-bar">
          <span className="ltt-title">{rt.input.meta?.title}</span>
          <div className="ltt-progress" data-ltt-progress="" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={rt.scene + 1} aria-label="진행">
            <span className="ltt-progress-text">
              {rt.scene + 1} / {total}
            </span>
            <span className="ltt-progress-track" aria-hidden="true">
              <span className="ltt-progress-fill" style={{ width: `${((rt.scene + 1) / total) * 100}%` }} />
            </span>
          </div>
        </header>
        <div className="ltt-scene" key={rt.scene} data-ltt-scene={rt.scene} data-ltt-type={s.type}>
          <SceneBoundary rt={rt}>
            <Stage rt={rt} />
            <aside className="ltt-card" data-ltt-card="">
              <CardBody rt={rt}>
                <Card rt={rt} onTerm={setTerm} />
              </CardBody>
              <nav className="ltt-nav">
                <button type="button" className="ltt-btn ltt-btn-ghost" data-ltt-prev="" disabled={rt.scene === 0} onClick={() => rt.goto(rt.scene - 1)}>
                  이전
                </button>
                <button type="button" className="ltt-btn ltt-btn-primary" data-ltt-next="" disabled={rt.scene >= total - 1} onClick={() => rt.goto(rt.scene + 1)}>
                  다음
                </button>
              </nav>
            </aside>
          </SceneBoundary>
        </div>
        {term && <Glossary rt={rt} term={term} onClose={() => setTerm(null)} />}
      </div>
    </>
  );
}

/** Card text slides in on scene entry; reduced motion shows it at once. */
function CardBody({ rt, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const want = rt.reveal;
    if (!want || want.scene !== rt.scene || !ref.current) return;
    rt.reveal = null;
    const root = want.item === null ? ref.current : ref.current.querySelector(`[data-ltt-item="${want.item}"]`) ?? ref.current;
    const targets = root.querySelectorAll("[data-ltt-feedback],[data-ltt-reveal]");
    const first = targets[0];
    const last = targets[targets.length - 1];
    if (!first) return;
    const body = ref.current;
    const b = body.getBoundingClientRect();
    const top = first.getBoundingClientRect().top - b.top + body.scrollTop;
    const bottom = last.getBoundingClientRect().bottom - b.top + body.scrollTop;
    const target = bottom - body.clientHeight + 12 > body.scrollTop ? Math.min(top - 12, bottom - body.clientHeight + 12) : body.scrollTop;
    body.scrollTop = Math.max(0, target);
  });
  useEffect(() => {
    if (!ref.current || rt.reduced) return undefined;
    const a = animate(ref.current, { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"] }, { duration: 0.28, ease: "easeOut" });
    return () => a.cancel?.();
  }, [rt.scene, rt.reduced]);
  return (
    <div className="ltt-card-body" ref={ref}>
      {children}
    </div>
  );
}

function Ghost({ html }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) animate(ref.current, { opacity: [1, 0] }, { duration: 0.3 });
  }, [html]);
  return <div className="ltt-ghost" aria-hidden="true" ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error("ltt: scene render failed:", error);
  }
  render() {
    const err = this.state.error ?? (this.props.rt.renderError ? new Error(this.props.rt.renderError) : null);
    if (err) {
      return (
        <div className="ltt-scene-error">
          <ErrorPanel title="이 장면을 그릴 수 없습니다" message={err.message ?? String(err)} />
          <nav className="ltt-nav">
            <button type="button" className="ltt-btn ltt-btn-ghost" data-ltt-prev="" disabled={this.props.rt.scene === 0} onClick={() => this.props.rt.goto(this.props.rt.scene - 1)}>
              이전
            </button>
            <button type="button" className="ltt-btn ltt-btn-primary" data-ltt-next="" disabled={this.props.rt.scene >= this.props.rt.scenes.length - 1} onClick={() => this.props.rt.goto(this.props.rt.scene + 1)}>
              다음
            </button>
          </nav>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------- stage ----------------

function Stage({ rt }) {
  const s = rt.current;
  const specs = rt.specs;
  const layouts = rt.layouts;
  const ghost = useGhost(rt);
  const box = stageBox(rt.viewport);
  const summary = s.type === "summary";
  const inner = box.height;
  const st = rt.stateOf(rt.scene);
  return (
    <section className="ltt-stage-wrap">
      <div className="ltt-stage" data-ltt-stage="" ref={ghost.ref}>
        <div className="ltt-stage-inner" style={{ height: inner }}>
          {specs.length === 0 && <StagePlaceholder rt={rt} />}
          {specs.map((sp, i) => {
            const L = layouts[i];
            if (!L) return null;
            if (L.failed) return <ErrorPanel key={i} at={sp.at} message={String(L.failed?.message ?? L.failed)} />;
            const un = L.errors.filter((e) => e.rule === "unimplemented");
            if (un.length) return <ErrorPanel key={i} at={sp.at} title="아직 그릴 수 없는 그림입니다" message={un.map((e) => `${e.path}: ${e.message}`).join("\n")} />;
            return (
              <FigureView key={i} uid={`${rt.scene}-${i}`} layout={L} at={sp.at} label={figureLabel(rt, sp.key)}>
                {i === 0 && s.type === "predict" && !st.committed && <PredictOverlay rt={rt} layout={L} />}
                {i === 0 && s.type === "explore" && <HandleOverlay rt={rt} layout={L} />}
              </FigureView>
            );
          })}
        </div>
        {ghost.html && <Ghost html={ghost.html} />}
      </div>
    </section>
  );
}

/** Snapshot of the previous scene's stage, stripped of data-ltt attributes, for the crossfade. */
function useGhost(rt) {
  const ref = useRef(/** @type {HTMLDivElement | null} */ (null));
  const last = useRef({ scene: rt.scene, html: "" });
  const [html, setHtml] = useState("");
  useEffect(() => {
    if (last.current.scene !== rt.scene && !rt.reduced && last.current.html) {
      setHtml(last.current.html);
      const id = setTimeout(() => setHtml(""), 320);
      last.current.scene = rt.scene;
      return () => clearTimeout(id);
    }
    last.current.scene = rt.scene;
    return undefined;
  }, [rt.scene, rt.reduced]);
  useEffect(() => {
    const inner = ref.current?.querySelector(".ltt-stage-inner");
    if (inner) last.current.html = inner.innerHTML.replace(/\s(data-ltt-[\w-]+|id)="[^"]*"/g, "").replace(/url\(#ltt-clip-[\w-]+\)/g, "none");
  });
  return { ref, html };
}

function figureLabel(rt, key) {
  const f = frameOf(rt.input, key);
  return typeof f.static === "string" ? f.static : `그림 ${key}`;
}

function StagePlaceholder({ rt }) {
  const s = rt.current;
  if (s.type === "define") {
    return (
      <div className="ltt-placeholder">
        <span className="ltt-placeholder-term">{s.sc.term}</span>
      </div>
    );
  }
  if (s.type === "quiz") {
    const st = rt.stateOf(rt.scene);
    const done = s.sc.items.filter((_, k) => st.items[k].submitted).length;
    return (
      <div className="ltt-placeholder">
        <span className="ltt-placeholder-term">{s.final ? "마지막 확인" : "확인 문제"}</span>
        <span className="ltt-placeholder-sub">
          {done} / {s.sc.items.length} 문항 완료
        </span>
      </div>
    );
  }
  return <div className="ltt-placeholder" />;
}

/** Converts a pointer event to figure px. */
function localPx(e, el) {
  const fig = el.closest("[data-ltt-figure]");
  const r = fig.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

function PredictOverlay({ rt, layout }) {
  const inp = rt.current.sc.input ?? {};
  if (inp.kind === "drag") return <DragHandle rt={rt} layout={layout} inp={inp} />;
  if (inp.kind === "draw") return <DrawArea rt={rt} layout={layout} inp={inp} />;
  return null;
}

function DragHandle({ rt, layout, inp }) {
  const st = rt.stateOf(rt.scene);
  const panel = rt.panelOf(layout, inp.mark);
  const f = rt.findMark(inp.mark);
  const hp = f ? handlePoint(f.d) : null;
  if (!panel || !hp) return null;
  const axis = inp.axis === "x" ? 0 : 1;
  const value = st.drag ?? hp[axis];
  const pt = axis === 0 ? [value, hp[1]] : [hp[0], value];
  const [px, py] = dataToPx(panel, pt);
  const dom = axis === 0 ? panel.domain.x : panel.domain.y;
  const clamp = (v) => Math.min(Math.max(v, Math.min(...dom)), Math.max(...dom));
  const set = (v) => rt.setDrag(Math.round(clamp(v) * 1e6) / 1e6);
  const onPointer = (e) => {
    if (e.type === "pointerdown") e.currentTarget.setPointerCapture?.(e.pointerId);
    if (e.type === "pointermove" && !e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
    const d = pxToData(panel, localPx(e, e.currentTarget));
    set(d[axis]);
    e.preventDefault();
  };
  const onKey = (e) => {
    const stepv = (dom[1] - dom[0]) / 100;
    const keys = axis === 0 ? { ArrowRight: 1, ArrowLeft: -1, ArrowUp: 1, ArrowDown: -1 } : { ArrowUp: 1, ArrowDown: -1, ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in keys) {
      set(value + keys[e.key] * stepv);
      e.preventDefault();
      e.stopPropagation();
    }
  };
  return (
    <div
      className="ltt-handle ltt-drag"
      data-ltt-drag={inp.mark}
      tabIndex={0}
      role="slider"
      aria-label={`${inp.mark} ${inp.axis}축으로 끌기`}
      aria-valuenow={value}
      aria-valuemin={Math.min(...dom)}
      aria-valuemax={Math.max(...dom)}
      style={{ left: px - 22, top: py - 22 }}
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onKeyDown={onKey}
    />
  );
}

function DrawArea({ rt, layout, inp }) {
  const panel = layout.panels[0];
  const drawing = useRef(/** @type {[number, number][] | null} */ (null));
  if (!panel) return null;
  const [x0] = dataToPx(panel, [inp.x[0], panel.domain.y[0]]);
  const [x1] = dataToPx(panel, [inp.x[1], panel.domain.y[0]]);
  const { plot } = panel;
  const ylo = Math.min(...panel.domain.y);
  const yhi = Math.max(...panel.domain.y);
  const add = (e) => {
    const [x, y] = pxToData(panel, localPx(e, e.currentTarget));
    const pts = drawing.current ?? [];
    const cx = Math.min(Math.max(x, inp.x[0]), inp.x[1]);
    const cy = Math.min(Math.max(y, ylo), yhi);
    const next = pts.filter((p) => Math.abs(p[0] - cx) > 1e-9);
    next.push([cx, cy]);
    next.sort((a, b) => a[0] - b[0]);
    drawing.current = next;
    if (next.length >= 2) rt.setDraw(next.map(([a, b]) => [Math.round(a * 1e4) / 1e4, Math.round(b * 1e4) / 1e4]));
  };
  return (
    <div
      className="ltt-draw"
      data-ltt-draw=""
      aria-label={`x ${inp.x[0]}–${inp.x[1]} 구간에 그리기`}
      style={{ left: Math.min(x0, x1), top: plot.y, width: Math.abs(x1 - x0), height: plot.height }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        drawing.current = [];
        add(e);
        e.preventDefault();
      }}
      onPointerMove={(e) => {
        if (drawing.current && e.currentTarget.hasPointerCapture?.(e.pointerId)) add(e);
      }}
      onPointerUp={() => {
        drawing.current = null;
      }}
    />
  );
}

function knobRange(rt, name) {
  const spec = rt.current.sc.knobs?.[name];
  if (Array.isArray(spec) && typeof spec[0] === "number") return [spec[0], spec[1]];
  if (spec && typeof spec === "object" && Array.isArray(spec.range)) return spec.range;
  return null;
}

function HandleOverlay({ rt, layout }) {
  const handles = rt.current.sc.handles ?? [];
  const params = rt.params();
  return handles.map((h, k) => {
    const panel = rt.panelOf(layout, h.mark);
    if (!panel || panel.frame === "geo") return null;
    const items = layout.items.filter((i) => i.markId === h.mark);
    if (!items.length) return null;
    const bb = items.reduce((a, i) => {
      const b = i.kind === "text" ? i.box : i.bbox;
      return { x0: Math.min(a.x0, b.x), y0: Math.min(a.y0, b.y), x1: Math.max(a.x1, b.x + b.width), y1: Math.max(a.y1, b.y + b.height) };
    }, { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
    const center = pxToData(panel, [(bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2]);
    const dx = h.x !== undefined && typeof params[h.x] === "number" ? params[h.x] : center[0];
    const dy = h.y !== undefined && typeof params[h.y] === "number" ? params[h.y] : center[1];
    const [px, py] = dataToPx(panel, [dx, dy]);
    const lim = (name, d) => knobRange(rt, name) ?? d;
    const clamp = (v, r) => Math.min(Math.max(v, Math.min(...r)), Math.max(...r));
    const set = (x, y) => {
      const patch = {};
      if (h.x !== undefined) patch[h.x] = Math.round(clamp(x, lim(h.x, panel.domain.x)) * 1e6) / 1e6;
      if (h.y !== undefined) patch[h.y] = Math.round(clamp(y, lim(h.y, panel.domain.y)) * 1e6) / 1e6;
      rt.setKnobs(patch);
    };
    const onPointer = (e) => {
      if (e.type === "pointerdown") e.currentTarget.setPointerCapture?.(e.pointerId);
      if (e.type === "pointermove" && !e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
      const [x, y] = pxToData(panel, localPx(e, e.currentTarget));
      set(x, y);
      e.preventDefault();
    };
    const onKey = (e) => {
      const sx = (panel.domain.x[1] - panel.domain.x[0]) / 100;
      const sy = (panel.domain.y[1] - panel.domain.y[0]) / 100;
      const mv = { ArrowRight: [sx, 0], ArrowLeft: [-sx, 0], ArrowUp: [0, sy], ArrowDown: [0, -sy] }[e.key];
      if (mv) {
        set(dx + mv[0], dy + mv[1]);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    return (
      <div
        key={k}
        className="ltt-handle"
        data-ltt-handle={h.mark}
        tabIndex={0}
        role="slider"
        aria-label={`${h.mark} 끌기`}
        aria-valuenow={h.x !== undefined ? dx : dy}
        style={{ left: px - 22, top: py - 22 }}
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onKeyDown={onKey}
      />
    );
  });
}

// ---------------- card ----------------

/** Text with glossary term buttons for terms already defined at this scene. */
function Rich({ rt, text, onTerm }) {
  const g = rt.input.glossary ?? {};
  const terms = Object.keys(g)
    .filter((t) => t && (!rt.defineAt.has(t) || rt.defineAt.get(t) <= rt.scene))
    .sort((a, b) => b.length - a.length);
  if (!terms.length || !text) return text;
  const out = [];
  let rest = text;
  let key = 0;
  while (rest) {
    let best = -1;
    let hit = "";
    for (const t of terms) {
      const i = rest.indexOf(t);
      if (i >= 0 && (best < 0 || i < best)) {
        best = i;
        hit = t;
      }
    }
    if (best < 0) {
      out.push(rest);
      break;
    }
    if (best > 0) out.push(rest.slice(0, best));
    out.push(
      <button type="button" key={key++} className="ltt-term" data-ltt-term={hit} onClick={() => onTerm(hit)}>
        {hit}
      </button>,
    );
    rest = rest.slice(best + hit.length);
  }
  return out;
}

function Glossary({ rt, term, onClose }) {
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="ltt-glossary-backdrop" onClick={onClose}>
      <div className="ltt-glossary" data-ltt-glossary="" role="dialog" aria-label={term} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <strong>{term}</strong>
        <p>{rt.input.glossary?.[term]}</p>
        <button type="button" className="ltt-btn ltt-btn-ghost" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

function Card({ rt, onTerm }) {
  const s = rt.current;
  const sc = s.sc;
  let m = {};
  try {
    m = rt.outputs();
  } catch (e) {
    throw e instanceof Error ? e : new Error(String(e));
  }
  const R = (str) => <Rich rt={rt} text={str} onTerm={onTerm} />;
  const T = (v) => R(txt(v, m));
  const kicker = <span className="ltt-kicker">{TYPE_LABEL[s.type] ?? s.type}</span>;
  switch (s.type) {
    case "hook":
    case "explain":
      return (
        <>
          {kicker}
          <h2>{T(sc.title)}</h2>
          <p>{T(sc.say)}</p>
          <TimeControls rt={rt} />
        </>
      );
    case "define":
      return (
        <>
          {kicker}
          <h2 className="ltt-term-title">{sc.term}</h2>
          <p>{T(sc.definition)}</p>
        </>
      );
    case "steps":
      return (
        <>
          {kicker}
          <h2>{T(sc.title)}</h2>
          <ol className="ltt-steps">
            {sc.steps.map((st, i) => (
              <li key={i} className={i === Math.min(rt.clock.step, sc.steps.length - 1) ? "ltt-step-on" : ""} aria-current={i === rt.clock.step ? "step" : undefined}>
                {T(st.say)}
              </li>
            ))}
          </ol>
          <TimeControls rt={rt} />
        </>
      );
    case "compare":
      return (
        <>
          {kicker}
          <h2>{T(sc.title)}</h2>
          <p>{T(sc.say)}</p>
          <div className="ltt-compare-labels">
            <span>A · {T(sc.labels?.[0])}</span>
            <span>B · {T(sc.labels?.[1])}</span>
          </div>
          <TimeControls rt={rt} />
        </>
      );
    case "explore":
      return <ExploreCard rt={rt} T={T} kicker={kicker} m={m} />;
    case "predict":
      return <PredictCard rt={rt} T={T} kicker={kicker} m={m} />;
    case "quiz":
      return <QuizCard rt={rt} R={R} kicker={kicker} />;
    case "summary":
      return (
        <>
          {kicker}
          <h2>{rt.input.meta?.title}</h2>
          {sc.say !== undefined && <p>{T(sc.say)}</p>}
          {rt.viewport === "mobile" && <SummaryPager rt={rt} />}
          <ul className="ltt-objectives">
            {(rt.input.meta?.objectives ?? []).map((o) => (
              <li key={o.id}>{o.text}</li>
            ))}
          </ul>
        </>
      );
    default:
      return <ErrorPanel message={`unknown scene type ${s.type}`} />;
  }
}

function SummaryPager({ rt }) {
  const keys = (rt.current.sc.figures ?? []).filter((k) => rt.isFig(k));
  if (keys.length < 2) return null;
  const page = rt.stateOf(rt.scene).page ?? 0;
  return (
    <div className="ltt-time" role="group" aria-label="정리 그림">
      {keys.map((k, i) => (
        <button key={k} type="button" className={`ltt-btn ${i === page ? "ltt-btn-primary" : "ltt-btn-ghost"}`} data-ltt-summary-page={i} aria-pressed={i === page} onClick={() => rt.summaryPage(i)}>
          그림 {i + 1}
        </button>
      ))}
    </div>
  );
}

function TimeControls({ rt }) {
  const key = rt.mainFigure();
  if (!key) return null;
  const f = frameOf(rt.input, key);
  const kind = timeKind(f);
  const steps = rt.stepCount();
  if (kind === "static" && !steps) return null;
  const c = rt.clock;
  const slow = kind === "loop" && loopSlow(f.loop, c.w ?? 0);
  return (
    <div className="ltt-time">
      <button type="button" className="ltt-btn ltt-btn-ghost" data-ltt-play="" aria-pressed={c.playing} onClick={() => rt.togglePlay()}>
        {c.playing ? "멈춤" : "재생"}
      </button>
      <button type="button" className="ltt-btn ltt-btn-ghost" data-ltt-rewind="" onClick={() => rt.rewind()}>
        처음으로
      </button>
      {steps > 0 && (
        <button type="button" className="ltt-btn ltt-btn-ghost" data-ltt-step-next="" onClick={() => rt.nextStep()}>
          다음 단계
        </button>
      )}
      {slow && c.playing && (
        <span className="ltt-slow ltt-slow-on" data-ltt-slow="">
          느린 재생 구간
        </span>
      )}
      {steps > 0 && (
        <span className="ltt-step-count">
          {Math.min(c.step, steps - 1) + 1} / {steps}
        </span>
      )}
    </div>
  );
}

function ExploreCard({ rt, T, kicker, m }) {
  const sc = rt.current.sc;
  const params = rt.params();
  let done = null;
  if (sc.goal) {
    try {
      done = !!sc.goal.done(m);
    } catch {
      done = false;
    }
  }
  return (
    <>
      {kicker}
      <h2>{T(sc.title)}</h2>
      <p>{T(sc.say)}</p>
      <div className="ltt-knobs">
        {Object.entries(sc.knobs ?? {}).map(([name, spec]) => (
          <Knob key={name} rt={rt} name={name} spec={spec} value={params[name]} />
        ))}
      </div>
      {sc.goal && (
        <div className={`ltt-goal${done ? " ltt-goal-done" : ""}`} data-ltt-goal="" data-ltt-done={done ? "true" : "false"} role="status">
          <span className="ltt-goal-mark">{done ? "달성" : "도전"}</span>
          <span>{T(sc.goal.say)}</span>
        </div>
      )}
      <TimeControls rt={rt} />
    </>
  );
}

function fmtNum(v) {
  if (typeof v !== "number") return String(v);
  return String(Math.round(v * 1000) / 1000);
}

function Knob({ rt, name, spec, value }) {
  const id = `ltt-knob-${name}`;
  if (typeof spec === "boolean") {
    return (
      <label className="ltt-knob ltt-knob-toggle" htmlFor={id}>
        <span>{name}</span>
        <input id={id} type="checkbox" role="switch" data-ltt-knob={name} checked={!!value} onChange={(e) => rt.setKnobs({ [name]: e.target.checked })} />
      </label>
    );
  }
  if (Array.isArray(spec) && spec.every((x) => typeof x === "string")) {
    return (
      <label className="ltt-knob" htmlFor={id}>
        <span>{name}</span>
        <select id={id} data-ltt-knob={name} value={String(value)} onChange={(e) => rt.setKnobs({ [name]: e.target.value })}>
          {spec.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
    );
  }
  const [lo, hi, step] = Array.isArray(spec) ? spec : [spec.range[0], spec.range[1], spec.step];
  const log = !Array.isArray(spec) && spec.log && lo > 0 && hi > 0;
  if (log) {
    const toPos = (v) => Math.round((Math.log(v / lo) / Math.log(hi / lo)) * 1000);
    const fromPos = (p) => {
      let v = lo * (hi / lo) ** (p / 1000);
      if (step) v = lo + Math.round((v - lo) / step) * step;
      return Math.min(hi, Math.max(lo, Math.round(v * 1e9) / 1e9));
    };
    return (
      <label className="ltt-knob" htmlFor={id}>
        <span>
          {name} <output>{fmtNum(value)}</output>
        </span>
        <input id={id} type="range" data-ltt-knob={name} data-ltt-log="true" min={0} max={1000} step={1} value={toPos(Number(value))} onChange={(e) => rt.setKnobs({ [name]: fromPos(Number(e.target.value)) })} />
      </label>
    );
  }
  return (
    <label className="ltt-knob" htmlFor={id}>
      <span>
        {name} <output>{fmtNum(value)}</output>
      </span>
      <input id={id} type="range" data-ltt-knob={name} min={lo} max={hi} step={step ?? (hi - lo) / 100} value={Number(value)} onChange={(e) => rt.setKnobs({ [name]: Number(e.target.value) })} />
    </label>
  );
}

function PredictCard({ rt, T, kicker, m }) {
  const sc = rt.current.sc;
  const st = rt.stateOf(rt.scene);
  const inp = sc.input ?? {};
  const committed = st.committed;
  const rm = committed ? m : null;
  return (
    <>
      {kicker}
      <h2>{T(sc.title)}</h2>
      <p>{T(sc.ask)}</p>
      {inp.kind === "choice" && (
        <div className="ltt-options" role="radiogroup">
          {inp.options.map((op, k) => (
            <button key={k} type="button" role="radio" aria-checked={st.choice === k} className={`ltt-option${st.choice === k ? " ltt-option-on" : ""}${committed && op.correct ? " ltt-option-right" : ""}`} data-ltt-option={k} disabled={committed} onClick={() => rt.choose(k)}>
              <span className="ltt-option-text">{T(op.text)}</span>
            </button>
          ))}
        </div>
      )}
      {inp.kind === "drag" && !committed && <p className="ltt-hint">그림의 손잡이를 끌거나, 손잡이에 초점을 두고 방향키로 옮긴 뒤 확정하세요.</p>}
      {inp.kind === "draw" && !committed && <DrawKeyboard rt={rt} inp={inp} />}
      {!committed && (
        <button type="button" className="ltt-btn ltt-btn-primary ltt-commit" data-ltt-commit="" disabled={!rt.canCommit()} onClick={() => rt.commit()}>
          확정
        </button>
      )}
      {committed && (
        <>
          <div className={`ltt-feedback ${st.correct ? "ltt-right" : "ltt-wrong"}`} data-ltt-feedback="" data-ltt-correct={st.correct ? "true" : "false"} role="status">
            <strong>{st.correct ? "예측이 맞았습니다." : "예측과 다릅니다."}</strong>
            {!st.correct && inp.kind === "choice" && inp.options[st.choice]?.feedback !== undefined && <p>{T(inp.options[st.choice].feedback)}</p>}
            {!st.correct && inp.kind === "drag" && <p>정답은 {fmtNum(Number(inp.answer(rm)))} 근처입니다(허용 ±{inp.tol}).</p>}
          </div>
          <div className="ltt-reveal" data-ltt-reveal="" data-ltt-correct={st.correct ? "true" : "false"}>
            <p>{T(sc.reveal?.say)}</p>
          </div>
        </>
      )}
      <TimeControls rt={rt} />
    </>
  );
}

function DrawKeyboard({ rt, inp }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const ya = parseNumber(a);
  const yb = parseNumber(b);
  return (
    <fieldset className="ltt-draw-keys">
      <legend>키보드로 직선 근사 넣기</legend>
      <label>
        x = {inp.x[0]}일 때 y <input type="text" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} data-ltt-draw-y0="" />
      </label>
      <label>
        x = {inp.x[1]}일 때 y <input type="text" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} data-ltt-draw-y1="" />
      </label>
      <button type="button" className="ltt-btn ltt-btn-ghost" data-ltt-draw-line="" disabled={ya === null || yb === null} onClick={() => rt.setDraw([[inp.x[0], ya], [inp.x[1], yb]])}>
        직선으로 그리기
      </button>
    </fieldset>
  );
}

function QuizCard({ rt, R, kicker }) {
  const s = rt.current;
  return (
    <>
      {kicker}
      <h2>{s.final ? "마지막 확인" : "확인 문제"}</h2>
      {s.sc.items.map((q, k) => (
        <QuizItem key={k} rt={rt} q={q} k={k} R={R} />
      ))}
    </>
  );
}

function QuizItem({ rt, q, k, R }) {
  const it = rt.stateOf(rt.scene).items[k];
  const done = it.submitted;
  const mq = outputsFor(rt.input, resolveParams(rt.input, { ...(q.params ?? {}), ...(done ? q.reveal?.params ?? {} : {}) }));
  const TT = (v) => R(txt(v, mq));
  return (
    <section className="ltt-item" data-ltt-item={k} aria-label={`문항 ${k + 1}`}>
      <p className="ltt-prompt">
        <span className="ltt-item-no">{k + 1}.</span> {TT(q.prompt)}
      </p>
      {q.kind === "choice" && (
        <div className="ltt-options" role="radiogroup">
          {q.options.map((op, j) => (
            <button key={j} type="button" role="radio" aria-checked={it.value === j} className={`ltt-option${it.value === j ? " ltt-option-on" : ""}${done && op.correct ? " ltt-option-right" : ""}`} data-ltt-option={j} disabled={done} onClick={() => rt.setItem(k, j)}>
              <span className="ltt-option-text">{TT(op.text)}</span>
            </button>
          ))}
        </div>
      )}
      {q.kind === "numeric" && (
        <label className="ltt-numeric">
          <input type="text" inputMode="decimal" data-ltt-numeric="" value={it.value ?? ""} disabled={done} onChange={(e) => rt.setItem(k, e.target.value)} onKeyDown={(e) => e.key === "Enter" && rt.submit(k)} aria-label="답" />
          <span>{q.unit}</span>
        </label>
      )}
      {q.kind === "order" && <OrderList rt={rt} q={q} k={k} it={it} TT={TT} />}
      {q.kind === "classify" && <Classify rt={rt} q={q} k={k} it={it} TT={TT} />}
      {!done && (
        <button type="button" className="ltt-btn ltt-btn-primary" data-ltt-submit="" disabled={!rt.canSubmit(k)} onClick={() => rt.submit(k)}>
          제출
        </button>
      )}
      {done && <QuizFeedback rt={rt} q={q} it={it} TT={TT} />}
    </section>
  );
}

function QuizFeedback({ rt, q, it, TT }) {
  let detail = null;
  if (!it.correct) {
    if (q.kind === "choice") detail = q.options[it.value]?.feedback !== undefined ? <p>{TT(q.options[it.value].feedback)}</p> : null;
    if (q.kind === "numeric") {
      let ans = NaN;
      try {
        ans = numericAnswer(rt.input, q.answer);
      } catch {
        ans = NaN;
      }
      detail = (
        <p>
          정답은 {fmtNum(Math.round(ans * 1e4) / 1e4)} {q.unit}입니다(허용 ±{q.tol}).
        </p>
      );
    }
    if (q.kind === "order") detail = <p>올바른 순서: {q.items.map((x) => txt(x, rt.outputs())).join(" → ")}</p>;
    if (q.kind === "classify") detail = <p>{q.items.map((x) => `${txt(x.text, rt.outputs())} → ${x.bin}`).join(", ")}</p>;
  }
  return (
    <>
      <div className={`ltt-feedback ${it.correct ? "ltt-right" : "ltt-wrong"}`} data-ltt-feedback="" data-ltt-correct={it.correct ? "true" : "false"} role="status">
        <strong>{it.correct ? "정답입니다." : "다시 생각해 볼 부분이 있습니다."}</strong>
        {detail}
      </div>
      {q.reveal?.say !== undefined && (
        <div className="ltt-reveal" data-ltt-reveal="">
          <p>{TT(q.reveal.say)}</p>
        </div>
      )}
    </>
  );
}

function OrderList({ rt, q, k, it, TT }) {
  const order = it.value;
  const done = it.submitted;
  const refs = useRef({});
  const [focusKey, setFocusKey] = useState(null);
  useEffect(() => {
    if (focusKey !== null) refs.current[focusKey]?.focus();
  }, [order, focusKey]);
  const move = (pos, d) => {
    const to = pos + d;
    if (to < 0 || to >= order.length || done) return;
    const next = order.slice();
    [next[pos], next[to]] = [next[to], next[pos]];
    setFocusKey(order[pos]);
    rt.setItem(k, next);
  };
  return (
    <ol className="ltt-order">
      {order.map((idx, pos) => (
        <li
          key={idx}
          className="ltt-order-item"
          data-ltt-order-item={idx}
          tabIndex={0}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          aria-label={`${pos + 1}번째: ${txt(q.items[idx], rt.outputs())}. 위아래 방향키로 옮기기`}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              move(pos, -1);
              e.preventDefault();
            } else if (e.key === "ArrowDown") {
              move(pos, 1);
              e.preventDefault();
            }
          }}
        >
          <span className="ltt-order-text">{TT(q.items[idx])}</span>
          <button type="button" className="ltt-icon-btn" aria-label="위로" disabled={done || pos === 0} tabIndex={-1} onClick={() => move(pos, -1)}>
            ↑
          </button>
          <button type="button" className="ltt-icon-btn" aria-label="아래로" disabled={done || pos === order.length - 1} tabIndex={-1} onClick={() => move(pos, 1)}>
            ↓
          </button>
        </li>
      ))}
    </ol>
  );
}

function Classify({ rt, q, k, it, TT }) {
  const done = it.submitted;
  const sel = it.selected ?? -1;
  const assign = (bin) => {
    if (done) return;
    const i = sel >= 0 ? sel : -1;
    if (i < 0) return;
    const v = { ...it.value, [i]: bin };
    it.selected = null;
    rt.setItem(k, v);
  };
  return (
    <div className="ltt-classify">
      <ul className="ltt-classify-items">
        {q.items.map((x, i) => (
          <li key={i}>
            <button
              type="button"
              className={`ltt-option${sel === i ? " ltt-option-on" : ""}`}
              data-ltt-classify-item={i}
              aria-pressed={sel === i}
              data-ltt-picked={sel === i ? "true" : undefined}
              disabled={done}
              onClick={() => {
                it.selected = i;
                rt.emit();
              }}
            >
              <span>{TT(x.text)}</span>
              <span className="ltt-chip">{typeof it.value[i] === "string" ? it.value[i] : "미분류"}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="ltt-bins" role="group" aria-label="분류함">
        {q.bins.map((b) => (
          <button key={b} type="button" className="ltt-btn ltt-btn-ghost ltt-bin" data-ltt-bin={b} disabled={done} onClick={() => assign(b)}>
            {b}에 넣기
          </button>
        ))}
      </div>
    </div>
  );
}

