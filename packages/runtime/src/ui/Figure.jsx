import { renderMath } from "../layout/math.mjs";
import { LINE_HEIGHT } from "../layout/constants.mjs";

const r2 = (v) => Math.round(v * 100) / 100;

/** @param {{ layout: any; at: { x: number; y: number; width: number; height: number }; children?: any; label?: string }} p */
export function FigureView({ layout, at, children, label, uid = "0" }) {
  const clips = new Map();
  const clipId = (c) => {
    if (!c) return null;
    const k = `${r2(c.x)},${r2(c.y)},${r2(c.width)},${r2(c.height)}`;
    if (!clips.has(k)) clips.set(k, { id: `ltt-clip-${uid}-${clips.size}`, c });
    return clips.get(k).id;
  };
  const shapes = layout.items.filter((i) => i.kind === "shape");
  const texts = layout.items.filter((i) => i.kind === "text");
  const groups = [];
  for (const s of shapes) {
    const last = groups[groups.length - 1];
    if (last && last.markId === s.markId && last.emphasis === s.emphasis) last.items.push(s);
    else groups.push({ markId: s.markId, emphasis: s.emphasis, items: [s] });
  }
  const shapeIds = new Set(shapes.map((s) => s.markId).filter((x) => x !== undefined));
  const textOnly = [...new Set(texts.map((t) => t.markId).filter((x) => x !== undefined && !shapeIds.has(x)))];
  const meta = layout._r?.meta ?? {};
  const CASED = new Set(["focus", "series1", "series2", "series3", "series4", "series5", "series6", "good", "warn", "bad"]);
  const els = groups.map((g, gi) => {
    const info = g.markId !== undefined ? meta[g.markId] : undefined;
    const cased = g.emphasis !== "dim" && info && CASED.has(info.tone);
    const kids = g.items.flatMap((s, i) => {
      const cid = clipId(s._r?.clip);
      const casing =
        cased && s.stroke && s.stroke !== "none" ? (
          <path key={`c${i}`} data-ltt-casing="" d={s.d || "M0,0"} fill="none" stroke="#ffffff" strokeWidth={(s._r?.sw ?? 2) + 3} strokeLinecap="round" strokeLinejoin="round" clipPath={cid ? `url(#${cid})` : undefined} />
        ) : null;
      return [
        casing,
        <path
          key={i}
          d={s.d || "M0,0"}
          fill={s.fill ?? "none"}
          stroke={s.stroke ?? "none"}
          strokeWidth={s._r?.sw ?? 2}
          strokeDasharray={s.dash ? "6 4" : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={s.opacity}
          clipPath={cid ? `url(#${cid})` : undefined}
          fillRule="nonzero"
        />,
      ];
    });
    return g.markId !== undefined ? (
      <g key={gi} data-ltt-mark={g.markId} data-ltt-emphasis={g.emphasis} data-ltt-kind={info?.kind} data-ltt-tone={info?.tone}>
        {kids}
      </g>
    ) : (
      <g key={gi}>{kids}</g>
    );
  });
  const leaders = texts
    .filter((t) => t.leader)
    .map((t) => (
      <g key={`l-${t.id}`} opacity={t.emphasis === "dim" ? 0.6 : 1}>
        <line x1={t.leader[0]} y1={t.leader[1]} x2={t.leader[2]} y2={t.leader[3]} stroke="#8a919c" strokeWidth={1} />
        <circle cx={t.leader[2]} cy={t.leader[3]} r={2} fill="#8a919c" />
      </g>
    ));
  return (
    <div className="ltt-fig" data-ltt-figure="" style={{ left: at.x, top: at.y, width: layout.width, height: layout.height }} role="img" aria-label={label}>
      <svg width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
        <defs>
          {[...clips.values()].map(({ id, c }) => (
            <clipPath key={id} id={id}>
              <rect x={c.x} y={c.y} width={c.width} height={c.height} />
            </clipPath>
          ))}
        </defs>
        {els}
        {textOnly.map((id) => (
          <g key={`t-${id}`} data-ltt-mark={id} data-ltt-emphasis={texts.find((t) => t.markId === id)?.emphasis} data-ltt-kind={meta[id]?.kind} data-ltt-tone={meta[id]?.tone} />
        ))}
        {leaders}
      </svg>
      {texts.map((t) => (
        <FigureText key={t.id} t={t} info={t.markId !== undefined ? meta[t.markId] : undefined} />
      ))}
      {children}
    </div>
  );
}

function FigureText({ t, info }) {
  const kind = t._r?.kind ?? "text";
  const style = { left: t.box.x, top: t.box.y, fontSize: t.size, fontWeight: t.weight, color: t.color, lineHeight: LINE_HEIGHT };
  const common = { "data-ltt-text": "", "data-ltt-text-id": t.id, "data-ltt-mark": t.markId, "data-ltt-emphasis": t.emphasis, "data-ltt-kind": t.markId !== undefined ? info?.kind : undefined, "data-ltt-tone": t.markId !== undefined ? info?.tone : undefined };
  if (t._r?.extra?.bg) common["data-ltt-bg"] = t._r.extra.bg;
  if (kind === "math") {
    let html = "";
    try {
      html = renderMath(t._r.extra.tex);
    } catch {
      html = "";
    }
    return <div {...common} className="ltt-t ltt-t-math" style={{ ...style, height: t.box.height }} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return (
    <div {...common} className={`ltt-t${kind === "code" ? " ltt-t-code" : ""}`} style={style}>
      {t.lines.map((l, i) => (
        <div key={i}>{l === "" ? <br /> : l}</div>
      ))}
    </div>
  );
}

/** @param {{ message: string; at?: any; title?: string }} p */
export function ErrorPanel({ message, at, title }) {
  return (
    <div className="ltt-error" data-ltt-error="" role="alert" style={at ? { position: "absolute", left: at.x, top: at.y, width: at.width, height: at.height } : undefined}>
      <strong>{title ?? "이 그림을 그릴 수 없습니다"}</strong>
      <p>{message}</p>
    </div>
  );
}
