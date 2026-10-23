// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, split, axis, line, area, sweep, label, rect } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  const TONES = [{ f: 220, a: 1, n: "A3" }, { f: 261.6, a: 0.7, n: "C4" }, { f: 329.6, a: 0.5, n: "E4" }];
  const FS = 8000, N = 800;
  const spectrum = model({ win: 0.1 }, () => {
    /** @param {number} t */
    const sig = (t) => TONES.reduce((s, p) => s + p.a * Math.sin(2 * Math.PI * p.f * t), 0);
    const x = Array.from({ length: N }, (_, i) => sig(i / FS));
    const hann = x.map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
    /** @param {number} f */
    const mag = (f) => { let re = 0, im = 0; for (let i = 0; i < N; i++) { const w = hann[i] * x[i], ph = (2 * Math.PI * f * i) / FS; re += w * Math.cos(ph); im -= w * Math.sin(ph); } return (4 * Math.hypot(re, im)) / N; };
    return { x, spec: Array.from({ length: 251 }, (_, i) => pt(150 + i, mag(150 + i))) };
  }, "A단조 화음 220/261.6/329.6 Hz, 진폭 1:0.7:0.5, 100 ms 해닝 창 DFT, 진폭 정규화 4|X|/N");
  // t: loop 0–1; sweep 0.08–0.8, fade 0.93–1
  /** @param {number} t */
  const freq = (t) => 150 + 250 * Math.max(0, Math.min(1, (t - 0.08) / 0.72));
  /** @param {number} t */
  const fade = (t) => 1 - Math.max(0, Math.min(1, (t - 0.93) / 0.07));
  const loop = { ms: 8000, span: /** @type {[number, number]} */ ([0, 1]) };
  return {
    models: { spectrum },
    figures: {
      wave: figure(cartesian({ x: [0, 30, "ms"], y: [-2.2, 2.2, "진폭"], loop }), (m, t) => {
        const f = freq(t);
        return [
          axis("x", { label: "시간 (앞 30 ms)" }),
          line(m.spectrum.x.slice(0, 240).map((/** @type {number} */ v, /** @type {number} */ i) => pt((i / FS) * 1000, v)), { id: "wave" }),
          line(Array.from({ length: 240 }, (_, i) => pt((i / FS) * 1000, 1.2 * Math.sin((2 * Math.PI * f * i) / FS))), { id: "probe", tone: "focus", weight: "thin", opacity: 0.55 * fade(t) }),
        ];
      }),
      spec: figure(cartesian({ x: [150, 400, "Hz"], y: [0, 1.1, "진폭"], loop }), (m, t) => {
        const f = freq(t), o = fade(t);
        /** @type {import("ltt").P[]} */
        const seen = m.spectrum.spec.filter((/** @type {import("ltt").P} */ p) => p[0] <= f);
        return [
          axis("x", { label: "주파수", ticks: [150, 200, 250, 300, 350, 400] }),
          area(seen, { id: "spectrum", tone: "focus" }),
          o > 0 && rect([f - 3, 0], [f + 3, 1.1], { id: "band", tone: "focus", fill: "soft", opacity: 0.12 * o }),
          o > 0 && sweep("x", f, { id: "cursor", tone: "focus", label: `${Math.round(f)} Hz`, opacity: o }),
          TONES.map((p) => f >= p.f - 2 && label([p.f, p.a + 0.05], `${p.n} ${p.f} Hz`, { id: `peak-${p.n}`, anchor: "s" })),
        ];
      }),
      s19: split(["wave", "spec"], { link: "cursor" }),
    },
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s19", src: "s19-fourier-sweep.html", corpus: "shot", domain: "신호처리 · 푸리에 변환, 파형이 주파수 막대로",
  props: [
    { id: "b1", cat: "T", text: "막대가 낮은 주파수부터 훑으며 위 파형에 같은 주파수의 기준 사인파를 겹친다", essential: true, why: "beat 1", status: "kept", by: "split: Both share t; draw is sampled over the frame's time; sweep(axis, at)" },
    { id: "b2", cat: "T", text: "막대가 지나간 자리까지만 스펙트럼이 그려지고 봉우리에 라벨이 켜진다", essential: true, why: "beat 2", status: "kept", by: "figure draw sampled over time, area(pts) of filtered points; label conditional in MarkTree (false omitted)" },
    { id: "b3", cat: "T", text: "봉우리 세 개가 차례로 드러난다", essential: true, why: "beat 3", status: "kept", by: "Loop span maps linearly onto ms; draw recomputes per t" },
    { id: "b4", cat: "T", text: "막대가 사라지고 완성된 스펙트럼과 라벨 셋만 남는다", essential: true, why: "beat 4", status: "kept", by: "MarkOpts.opacity 0–1 driven by t; Loop" },
    { id: "q1", cat: "Q", text: "스펙트럼은 해닝 창 DFT 진폭(220 Hz에서 1), 주파수 축 150–400 Hz 선형", essential: true, why: "결론이 기대는 수치", status: "kept", by: "model fn + cartesian x Axis [150,400,'Hz']" },
    { id: "p1", cat: "S", text: "입력과 출력을 한 판에 두고 훑은 만큼만 출력이 생긴다(겹쳐 놓기)", essential: true, why: "principle", status: "approx", diff: "split은 side by side라 원본처럼 파형과 스펙트럼을 같은 폭 위아래 한 판에 겹치지 않고, 커서의 같은 x 위치 대응이 두 판 사이 link 강조로만 남는다" },
  ],
  verdict: "V", custom: [], candidates: ["stacked-panels"],
}];
