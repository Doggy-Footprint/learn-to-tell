// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, circle, rect, dot, label, path, legend, rng } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const D0 = 0.1, RW = 15, EDGE = 0.3;
  const wafer = model({ side: 1 }, ({ side }) => {
    const r = rng(7), defects = [], n = Math.round(Math.PI * RW * RW * D0);
    while (defects.length < n) {
      const x = (r() * 2 - 1) * RW, y = (r() * 2 - 1) * RW;
      if (x * x + y * y < (RW - EDGE) ** 2) defects.push(pt(x, y));
    }
    /** @type {{ x0: number; y0: number; hit: number }[]} */
    const dice = [];
    const k = Math.floor((2 * RW) / side);
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      const x0 = -RW + i * side, y0 = -RW + j * side;
      const ok = [[x0, y0], [x0 + side, y0], [x0, y0 + side], [x0 + side, y0 + side]].every(([x, y]) => x * x + y * y < (RW - EDGE) ** 2);
      if (ok) dice.push({ x0, y0, hit: Infinity });
    }
    defects.forEach(([x, y], idx) => {
      const d = dice.find((d) => x >= d.x0 && x < d.x0 + side && y >= d.y0 && y < d.y0 + side);
      if (d) d.hit = Math.min(d.hit, idx);
    });
    return { side, defects, dice, poisson: Math.exp(-side * side * D0) };
  }, "푸아송 수율 Y = e^(−A·D₀), D₀ 0.1/cm² 예시값, 300mm 웨이퍼");
  const figures = {
    wafer: figure(
      cartesian({ x: [-16, 32, "cm"], y: [-16, 18, "cm"], aspect: "equal", loop: { ms: 8000, span: [0, 1] } }),
      (m, u) => {
        const w = m.wafer, fall = clamp(u / 0.62), fade = clamp((u - 0.92) / 0.08);
        let landed = 0;
        const drops = w.defects.map((/** @type {import("ltt").P} */ [x, y], /** @type {number} */ k) => {
          const p = ease(clamp((fall - (k / w.defects.length) * 0.8) / 0.2));
          if (p >= 1) landed = k + 1;
          return p > 0 && dot(pt(x, y + (1 - p) * 17 + 1.3), { id: `defect-${k}`, tone: "bad", size: "s", opacity: Math.min(1, p * 3) * (1 - fade) });
        });
        let bad = 0;
        const cells = w.dice.map((/** @type {{ x0: number; y0: number; hit: number }} */ d, /** @type {number} */ i) => {
          const b = d.hit < landed && fade < 1;
          if (b) bad++;
          return rect(pt(d.x0 + 0.04, d.y0 + 0.04), pt(d.x0 + w.side - 0.04, d.y0 + w.side - 0.04), { id: `die-${i}`, tone: b ? "bad" : "good", fill: "soft" });
        });
        const y = 1 - bad / w.dice.length;
        return [
          circle(pt(0, 0), RW, { id: "wafer", fill: "none" }),
          path([["M", -0.9, -RW + 0.05], ["L", 0, -RW + 0.75], ["L", 0.9, -RW + 0.05]], { id: "notch" }),
          cells,
          drops,
          label(pt(18, 13), "300mm 웨이퍼 · D₀ 0.1개/cm²", { id: "spec", anchor: "w", tone: "muted" }),
          label(pt(18, 10.5), `다이 ${w.side}×${w.side} cm · 완전한 다이 ${w.dice.length}개`, { id: "die-size", anchor: "w", weight: "bold" }),
          label(pt(18, 7), `떨어진 결함 ${landed}개 · 결함 다이 ${bad}개`, { id: "counts", anchor: "w" }),
          label(pt(18, 2), `수율 ${(y * 100).toFixed(0)}%`, { id: "yield", anchor: "w", size: "l", weight: "bold" }),
          rect(pt(18, 0), pt(29, 0.6), { id: "bar-bg", tone: "muted", fill: "soft" }),
          rect(pt(18, 0), pt(18 + 11 * y, 0.6), { id: "bar", tone: "good", fill: "solid" }),
          label(pt(18, -2), `푸아송 모델 e^(−A·D₀) = ${(w.poisson * 100).toFixed(0)}%`, { id: "model", anchor: "w", tone: "muted" }),
          legend([{ tone: "good", text: "양품 다이" }, { tone: "bad", text: "결함 다이" }], { id: "key", at: pt(18, -5) }),
        ];
      },
    ),
  };
  return {
    models: { wafer },
    figures,
    scenes: [{
      type: "predict", title: "같은 웨이퍼에서 다이만 네 배 키우면 수율은?",
      ask: "결함은 같은 자리에 같은 수(약 71개)로 떨어진다. 다이를 1×1cm에서 2×2cm로 바꾸면 수율은 어떻게 될까?",
      figure: "wafer", focus: ["yield", "bar"], params: { side: 1 },
      input: { kind: "choice", options: [
        { text: "약 90% 그대로. 결함 수가 같으니까", feedback: "결함 하나가 큰 다이를 통째로 버린다." },
        { text: "약 67%로 떨어진다", correct: true },
        { text: "약 23%. 면적이 4배라 4배 나빠진다", feedback: "결함이 몰려 겹치면 손실은 4배까지 가지 않는다." },
      ] },
      reveal: { say: "e^(−0.1)=90%, e^(−0.4)=67%.", figure: "wafer", params: { side: 2 } },
    }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s40", src: "s40-wafer-yield.html", corpus: "shot", domain: "반도체 · 웨이퍼 결함 분포와 칩 크기별 수율",
  props: [
    { id: "b1", cat: "T", text: "0–2s 결함 점이 위에서 하나씩 떨어지고 맞은 칸이 빨갛게 바뀐다", essential: true, why: "beat", status: "kept", by: "Loop{ms:8000,span:[0,1]}; dot y를 t로 계산, 착지한 결함이 든 다이 rect tone 'bad'" },
    { id: "b2", cat: "Q", text: "2–5s 점이 쌓이며 결함 칸이 늘고 수율 막대가 줄어든다", essential: true, why: "beat", status: "kept", by: "막대 rect 폭 = 11cm × 수율(데이터 단위)" },
    { id: "b3", cat: "T", text: "5–7s 떨어지기를 멈추고 최종 수율 숫자와 막대가 머문다", essential: true, why: "beat", status: "kept", by: "fall = clamp(u/0.62) 뒤 유지" },
    { id: "p1", cat: "S", text: "질문과 정답 화면이 같은 그림·같은 입력(같은 결함 71개 위치)을 쓰고 다이 크기만 바꾼다", essential: true, why: "principle", status: "kept", by: "Predict reveal.figure 같은 키 + reveal.params {side:2}; rng 'same sequence in runtime and stub'로 결함 위치 고정" },
    { id: "q1", cat: "Q", text: "결함 위치는 원본 LCG(seed 7) 표본", essential: false, why: "구체 값", status: "approx", diff: "mulberry32(7)라 위치와 시뮬레이션 수율 숫자가 원본과 조금 다르다; 개수 71과 푸아송 값은 같다" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
