// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, rect, path, dot, label, legend } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const MODS = [
    { id: "react", l: "react-dom", kb: 130 }, { id: "router", l: "react-router", kb: 60 },
    { id: "app", l: "앱 코드", kb: 140 }, { id: "chart", l: "chart.js · /reports", kb: 200 },
    { id: "moment", l: "moment + 로캘 · /reports", kb: 290 }, { id: "editor", l: "quill 편집기 · /write", kb: 210 },
  ];
  /** @type {Record<string, string>} */
  const SPLIT = { react: "main", router: "main", app: "main", chart: "reports", moment: "reports", editor: "write" };
  const bundles = model({ split: false }, ({ split }) => {
    const chunks = split
      ? [{ id: "main", file: "main.js", lazy: false }, { id: "reports", file: "reports.js", lazy: true }, { id: "write", file: "write.js", lazy: true }]
      : [{ id: "main", file: "main.js", lazy: false }];
    const of = (/** @type {string} */ id) => (split ? SPLIT[id] : "main");
    let top = 1100;
    const placed = chunks.map((c) => {
      const kb = MODS.filter((m) => of(m.id) === c.id).reduce((a, m) => a + m.kb, 0);
      const r = { ...c, kb, top, fillTop: top };
      top -= kb + 60;
      return r;
    });
    const segs = MODS.map((m) => {
      const c = placed.find((k) => k.id === of(m.id));
      if (!c) throw new Error("chunk");
      const y1 = c.fillTop, y0 = c.fillTop - m.kb;
      c.fillTop = y0;
      return { ...m, chunk: c.id, y0, y1 };
    });
    const first = placed.filter((c) => !c.lazy).reduce((a, c) => a + c.kb, 0);
    return { chunks: placed, segs, first };
  }, "bundlephobia minified 크기 대략값(버전마다 다름), 합계는 모델 계산");
  const figures = {
    bundle: figure(
      cartesian({ x: [0, 10, ""], y: [-100, 1150, "KB"], loop: { ms: 8000, span: [0, 8] } }),
      (m, t) => {
        /** @type {{ chunks: { id: string; file: string; lazy: boolean; kb: number; top: number }[]; segs: { id: string; l: string; kb: number; y0: number; y1: number }[]; first: number }} */
        const b = m.bundles;
        const out = t > 7.2 ? 1 - ease(clamp((t - 7.2) / 0.6)) : 1;
        const rowY = (/** @type {number} */ i) => 1080 - i * 160;
        return [
          axis("y", { label: "파일 크기" }),
          label(pt(0.2, 1140), "import한 모듈", { id: "h-mod", anchor: "w" }),
          label(pt(6.2, 1140), "만들어진 파일", { id: "h-file", anchor: "w" }),
          b.chunks.map((c) => [
            rect(pt(6.2, c.top - c.kb), pt(7.4, c.top), { id: `file-${c.id}`, fill: "none", tone: c.lazy ? "muted" : "ref" }),
            label(pt(7.6, c.top - 30), `${c.file} ${c.kb} KB${c.lazy ? " · 필요할 때" : " · 첫 화면"}`, { id: `file-label-${c.id}`, anchor: "w" }),
          ]),
          b.segs.map((s, i) => {
            const k = ease(clamp((t - 0.3 - i * 0.45) / 0.9));
            const g = ease(clamp((t - 0.3 - i * 0.45 - 0.8) / 0.4));
            const tone = /** @type {import("ltt").Tone} */ (`series${i + 1}`);
            const y = rowY(i), ty = (s.y0 + s.y1) / 2;
            return [
              dot(pt(2.6, y), { id: `mod-${s.id}`, tone, label: `${s.l} ${s.kb} KB` }),
              path([["M", 2.7, y], ["C", 4.3, y, 4.5, ty, 6.2, ty]], { id: `wire-${s.id}`, tone, reveal: k, opacity: 0.9 * out }),
              g > 0 && rect(pt(6.2, s.y1 - (s.y1 - s.y0) * g), pt(7.4, s.y1), { id: `seg-${s.id}`, tone, fill: "solid", opacity: 0.85 * out }),
            ];
          }),
          label(pt(0.2, -60), `${b.first} KB 첫 화면에서 받는 JS`, { id: "first-kb", anchor: "w", size: "l", tone: b.chunks.length > 1 ? "good" : "bad" }),
          legend([{ tone: "ref", text: "첫 화면 파일" }, { tone: "muted", text: "필요할 때 받는 파일" }], { id: "key", at: pt(6.2, -60) }),
        ];
      },
    ),
  };
  return {
    models: { bundles },
    figures,
    scenes: [{ type: "compare", title: "같은 모듈을 나눠 담으면 첫 화면이 받는 양이 3분의 1로 준다", say: "막대 높이는 파일 크기다.", figure: "bundle", focus: ["first-kb"], a: { split: false }, b: { split: true }, labels: ["분할 전 · 한 파일", "코드 분할 후 · 경로별 파일"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s36", src: "s36-code-splitting.html", corpus: "shot", domain: "프런트엔드 · 앱 번들 구성, 코드 분할 전후",
  props: [
    { id: "b1", cat: "T", text: "0–1.5s 첫 모듈에서 파일 막대로 선이 그려지고 닿은 칸이 차오른다", essential: true, why: "beat", status: "kept", by: "MarkOpts.reveal(호 길이 기준 그린 비율) + Loop{ms:8000,span:[0,8]}; 칸 높이는 draw가 t로 계산" },
    { id: "b2", cat: "T", text: "1.5–3s 선이 하나씩 더 그려지며 분할 전은 한 막대, 분할 후는 세 막대로 갈라진다", essential: true, why: "beat", status: "kept", by: "모듈별 지연 i*0.45로 reveal 계산; Compare a/b params split" },
    { id: "b3", cat: "Q", text: "3–7s 모든 칸이 차서 쌓이고 첫 화면 크기 차이(1030 vs 330 KB)가 숫자로 남는다", essential: true, why: "beat", status: "kept", by: "rect 높이 = KB(y Axis 'KB') + label 텍스트; 7.2s 뒤 페이드는 opacity" },
    { id: "p1", cat: "Q", text: "부분과 전체는 넓이(막대 높이 = KB)로", essential: true, why: "principle", status: "kept", by: "cartesian y Axis [.., 'KB'] 데이터 단위 rect" },
    { id: "p2", cat: "G", text: "무엇이 어디로 가는지는 그려지는 선(모듈→칸 곡선)으로", essential: true, why: "principle", status: "kept", by: "path C 명령 + reveal" },
    { id: "p3", cat: "S", text: "앞뒤를 같은 좌표계에 둔다", essential: true, why: "principle", status: "kept", by: "Compare: 'Same figure under params a and b, side by side'" },
    { id: "x1", cat: "E", text: "필요할 때 받는 파일은 점선 테두리", essential: false, why: "구분 보조", status: "approx", diff: "rect에 dash 옵션이 없어 tone muted로만 구분한다" },
  ],
  verdict: "V", custom: [], candidates: ["rect-dash"],
}];
