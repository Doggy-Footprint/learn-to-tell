// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, model, field, line, label, dim, split, multiples } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const p = (x, y) => [x, y];
  const LAMBDA = 0.55, SEP = 0.6;
  const ease = (/** @type {number} */ x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const LENS = { mag: [[10, 0.25], [40, 0.25], [100, 0.25]], na: [[10, 0.25], [40, 0.65], [100, 1.25]] };
  const psf = model({ set: "mag", idx: 0 }, ({ set, idx }) => {
    const [mag, na] = LENS[set === "na" ? "na" : "mag"][Number(idx)];
    const d = (0.61 * LAMBDA) / na, s = (0.21 * LAMBDA) / na;
    return { mag, na, d, ok: d < SEP, I: (/** @type {number} */ xu, /** @type {number} */ yu) => Math.exp(-((xu - SEP / 2) ** 2 + yu * yu) / (2 * s * s)) + Math.exp(-((xu + SEP / 2) ** 2 + yu * yu) / (2 * s * s)) };
  }, "Rayleigh d = 0.61λ/NA, λ = 550 nm; 점상 분포를 가우스 σ = 0.21λ/NA로 근사; 두 점 간격 0.6 µm");
  /** frame in screen px so that magnification sets on-screen size: 1 µm = mag·1.2·z px */
  const cellFig = (/** @type {string} */ pre) => figure(
    // 7 s: zoom in 0–2.5 s, hold to 5.5 s, zoom out to 7 s
    cartesian({ x: [-120, 120, "화면 px"], y: [-170, 140, "화면 px"], aspect: "equal", loop: { ms: 7000, span: [0, 7] } }),
    (m, t) => {
      const u = t / 7, z = u < 0.36 ? 0.15 + 0.85 * ease(u / 0.36) : u < 0.79 ? 1 : 1 - 0.85 * ease((u - 0.79) / 0.21);
      const ppu = m.psf.mag * 1.2 * z;
      const img = (/** @type {number} */ x, /** @type {number} */ y) => (y < -120 ? 0 : Math.min(1, m.psf.I(x / ppu, y / ppu)));
      return [
        field(img, { id: `${pre}-image`, as: "color", density: 240 }),
        line(Array.from({ length: 81 }, (_, i) => p(-120 + i * 3, -165 + 40 * Math.min(1, m.psf.I((-120 + i * 3) / ppu, 0)))), { id: `${pre}-profile`, tone: "focus" }),
        dim(p(-100, -125), p(-100 + ppu, -125), "1 µm", { id: `${pre}-scale` }),
        label(p(-115, 135), `${m.psf.mag}× · NA ${m.psf.na} · d ${m.psf.d.toFixed(2)} µm`, { id: `${pre}-spec`, anchor: "nw" }),
        label(p(115, 135), m.psf.ok ? "두 점" : "한 덩어리", { id: `${pre}-verdict`, anchor: "ne", tone: m.psf.ok ? "good" : "bad" }),
      ];
    },
  );
  return {
    models: { psf },
    figures: {
      cellMag: cellFig("mag"),
      cellNa: cellFig("na"),
      rowMag: multiples("cellMag", { over: { idx: [0, 1, 2] } }),
      rowNa: multiples("cellNa", { over: { idx: [0, 1, 2] } }),
      both: split(["rowMag", "rowNa"]),
    },
    scenes: [{
      type: "compare", title: "확대만 하면 덩어리가 커질 뿐, 두 점은 개구수가 갈라 준다",
      say: "0.6 µm 떨어진 두 점을 찍어 확대한다. 곡선은 가운데 줄의 밝기, d는 갈라 볼 수 있는 최소 간격이다.",
      figure: "rowMag", focus: ["mag-verdict"], a: { set: "mag" }, b: { set: "na" }, labels: ["배율만 올림 · NA 0.25 고정", "개구수를 함께 올림 · 표준 대물렌즈"],
    }],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s05", src: "archive/v1:site/gallery/shots/s05-microscope-na.html", corpus: "shot-extra", domain: "광학",
  props: [
    { id: "q1", cat: "Q", text: "상 = 간격 0.6 µm 두 점의 PSF 합(σ = 0.21λ/NA) 밝기 영상", essential: true, why: "결론 '개구수가 갈라 준다'는 영상에서 두 봉우리가 갈라지는지에 기댄다", status: "kept", by: "field(f, {as:'color'}): 'Scalar f is colored'; f = model I at data coords" },
    { id: "q2", cat: "Q", text: "화면 크기는 배율에 비례(1 µm = mag·1.2·z px), 확대해도 덩어리는 같이 커짐", essential: true, why: "결론 '확대만 하면 덩어리가 커질 뿐'", status: "kept", by: "frame axes in screen px with aspect 'equal'; coords scaled by ppu; dim mark shows 1 µm length" },
    { id: "g1", cat: "G", text: "가운데 줄 밝기 프로필 곡선(봉우리 둘 vs 하나)", essential: true, why: "갈라짐을 수치로 읽게 함", status: "kept", by: "line of I(x,0) points" },
    { id: "t1", cat: "T", text: "넓은 시야에서 확대 2.5s → 멈춤 3s → 되돌림 1.5s 반복", essential: true, why: "contrast의 움직임 '확대·축소'", status: "kept", by: "Loop ms 7000 span [0,7]; z(t) computed in draw" },
    { id: "s1", cat: "S", text: "두 줄(배율만 / NA 함께) × 세 배율(10·40·100×) 작은 여러 칸, 같은 시간", essential: true, why: "contrast 구도", status: "kept", by: "multiples over idx 'one copy per value, sharing frame, axes, t'; split 'Both share t'" },
    { id: "x1", cat: "X", text: "칸마다 배율·NA·d 값과 '두 점'/'한 덩어리' 판정", essential: true, why: "판정을 글로도 읽게 함", status: "kept", by: "label Text from model outputs; tone good/bad 'semantic'" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
