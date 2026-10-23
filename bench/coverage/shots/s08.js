// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, model, rect, label, custom } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const p = (x, y) => [x, y];
  const lin = (/** @type {number} */ c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const hslToRgb = (/** @type {number} */ h, /** @type {number} */ s, /** @type {number} */ l) => {
    const k = (/** @type {number} */ n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (/** @type {number} */ n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)];
  };
  const okL = (/** @type {number[]} */ rgb) => {
    const [r, g, b] = rgb.map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  };
  const HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const ease = (/** @type {number} */ x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const light = model({ hslL: 0.5, okLfix: 0.7 }, ({ hslL, okLfix }) => ({
    rows: [
      { name: "HSL", sub: `L ${hslL * 100}% 고정`, css: (/** @type {number} */ h) => `hsl(${h} 100% ${hslL * 100}%)`, L: HUES.map((h) => okL(hslToRgb(h, 1, hslL))) },
      { name: "OKLCH", sub: `L ${okLfix.toFixed(2)} 고정`, css: (/** @type {number} */ h) => `oklch(${okLfix} 0.13 ${h})`, L: HUES.map(() => okLfix) },
    ],
  }), "sRGB → OKLab, Björn Ottosson 2020; hsl(60 100% 50%) L 0.968, hsl(240 100% 50%) L 0.452");
  const CW = 1, GAP = 0.1;
  const colX = (/** @type {number} */ i) => i * (CW + GAP);
  return {
    models: { light },
    figures: {
      strips: figure(
        // 11.6 s: sweep right 4.8 s, hold 1 s, sweep back 4.8 s, hold 1 s
        cartesian({ x: [-2.5, 13.3, ""], y: [-0.5, 6, ""], loop: { ms: 11600, span: [0, 11.6] } }),
        (m, t) => {
          const u = t < 4.8 ? t / 4.8 : t < 5.8 ? 1 : t < 10.6 ? 1 - (t - 5.8) / 4.8 : 0;
          const pos = ease(u) * (HUES.length - 1), i = Math.round(pos);
          return [
            m.light.rows.map((/** @type {{name: string, sub: string, css: (h: number) => string, L: number[]}} */ r, /** @type {number} */ ri) => {
              const y = ri ? 0.3 : 3.2;
              return [
                label(p(-0.3, y + 2.1), `${r.name} · ${r.sub}`, { id: `row-${r.name}`, anchor: "e" }),
                label(p(-0.3, y + 0.9), "흑백으로", { id: `gray-cap-${r.name}`, anchor: "e", tone: "muted" }),
                custom({ id: `swatches-${r.name}`, why: "견본 색 자체가 내용(실제 hsl()/oklch() 값과 그 흑백 명도)인데 Tone은 runtime이 고르는 색뿐", bounds: [p(0, y + 0.6), p(colX(11) + CW, y + 2.6)] }, ({ h }) =>
                  HUES.map((hue, j) => h("g", {},
                    h("rect", { x: colX(j), y: y + 1.6, width: CW, height: 1, fill: r.css(hue) }),
                    h("rect", { x: colX(j), y: y + 0.6, width: CW, height: 0.6, fill: `oklch(${r.L[j].toFixed(3)} 0 0)` })))),
                HUES.map((hue, j) => label(p(colX(j) + CW / 2, y + 0.3), r.L[j].toFixed(2), { id: `L-${r.name}-${hue}`, tone: j === i ? "focus" : "muted", size: j === i ? "m" : "s" })),
              ];
            }),
            rect(p(colX(0) - 0.1 + pos * (CW + GAP), 0), p(colX(0) + CW + 0.1 + pos * (CW + GAP), 5.7), { id: "hi", fill: "none", weight: "bold" }),
            label(p(CW / 2 + pos * (CW + GAP), 5.9), `색상 ${HUES[i]}°`, { id: "hue" }),
            label(p(5.5, -0.4), `HSL은 둘 다 50%라 부르지만 눈에 보이는 명도는 ${m.light.rows[0].L[i].toFixed(2)} · OKLCH는 어느 색상에서나 0.70`, { id: "readout" }),
          ];
        },
      ),
    },
    scenes: [
      { type: "explain", title: "같은 ‘명도 50%’라도 노랑과 파랑은 밝기가 다르다", say: "강조 틀이 색상을 따라 훑는다. 각 색 아래 칸은 흑백으로 바꾼 밝기다.", figure: "strips", focus: ["hi", "readout"] },
      { type: "define", term: "명도", definition: "눈에 보이는 밝기. HSL의 L은 계산값이고 OKLCH의 L은 사람이 느끼는 밝기에 맞춘 값", figure: "strips", focus: ["swatches-HSL", "swatches-OKLCH"] },
    ],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s08", src: "archive/v1:site/gallery/shots/s08-hsl-oklch-lightness.html", corpus: "shot-extra", domain: "UI 색",
  props: [
    { id: "q1", cat: "Q", text: "견본은 실제 색 hsl(h 100% 50%)와 oklch(0.70 0.13 h), 색상 0–330° 30° 간격", essential: true, why: "결론 '노랑과 파랑은 밝기가 다르다'는 실제 색을 눈으로 보는 데 기댄다", status: "custom", by: "api.custom rect fill css color" },
    { id: "q2", cat: "Q", text: "각 견본 아래 흑백 칸은 그 색의 OKLab L 회색 oklch(L 0 0)", essential: true, why: "보이는 밝기 차이를 색상 없이 비교", status: "custom", by: "api.custom rect fill oklch gray" },
    { id: "x1", cat: "X", text: "칸마다 L 값(HSL은 0.45–0.97로 흔들림, OKLCH는 0.70)", essential: true, why: "수치로도 결론을 확인", status: "kept", by: "label Text from model L values (Ottosson formula)" },
    { id: "e1", cat: "E", text: "강조 틀이 색상을 따라 훑고 현재 열의 L 값을 키운다(4.8s 왕, 1s 멈춤, 4.8s 복, 1s 멈춤)", essential: true, why: "motion '강조가 훑음'", status: "kept", by: "Loop ms 11600 span [0,11.6]; rect x from t; label size/tone by current column" },
    { id: "s1", cat: "S", text: "HSL 줄과 OKLCH 줄을 같은 열 위치로 위아래 정렬", essential: true, why: "같은 색상끼리 비교", status: "kept", by: "same colX(j) data coordinates for both rows" },
  ],
  verdict: "C", custom: ["color-swatch"], candidates: ["color-literal"],
}];
