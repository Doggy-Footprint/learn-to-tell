// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, model, line, circle, dot, label, axis, arrow } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const p = (x, y) => [x, y];
  const ST = [{ l: "기준금리", s: "0.25%p 인상" }, { l: "대출금리", s: "은행 가산" }, { l: "소비·투자", s: "가계·기업 지출" }, { l: "물가", s: "소비자물가 상승률" }];
  const LAG = [{ t: "수주~1개월", w: 0.12 }, { t: "2~4분기", w: 0.33 }, { t: "4~8분기", w: 0.55 }];
  const ease = (/** @type {number} */ x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  /** lead fraction 0–1 → x position; equal segment lengths, unequal durations */
  const posAt = (/** @type {number} */ u) => {
    let acc = 0;
    for (let i = 0; i < 3; i++) { if (u <= acc + LAG[i].w) return i + ease((u - acc) / LAG[i].w); acc += LAG[i].w; }
    return 3;
  };
  const resp = model({ amp: 0.9 }, ({ amp }) => ({ f: (/** @type {number} */ q, /** @type {number} */ peak) => amp * Math.pow(q / peak, 2) * Math.exp(2 * (1 - q / peak)) }), { illustrative: true });
  return {
    models: { resp },
    figures: {
      pipe: figure(
        // model time = lead front in 분기; trailing particles arrive at 10 (wall 0.85), then hold
        cartesian({ x: [-0.3, 3.3, ""], y: [-1, 1, ""], loop: { ms: 7000, span: [0, 10], warp: [[0, 0], [10, 0.85], [10, 1]] } }),
        (m, t) => {
          const lead = Math.min(1, t / 8), front = t / 8;
          let reached = 0, acc = 0;
          for (let i = 0; i < 3; i++) { acc += LAG[i].w; if (lead >= acc - 1e-6) reached = i + 1; }
          const parts = [];
          for (let i = 0; i < 9; i++) {
            const v = Math.max(0, Math.min(1, front - i * 0.03));
            if (v > 0) parts.push(dot(p(posAt(v), ((i % 3) - 1) * 0.05), { id: `part-${i}`, tone: "focus", size: "s", opacity: v >= 1 ? 0.35 : 1 }));
          }
          return [
            line([p(0, 0), p(3, 0)], { id: "track", tone: "muted" }),
            LAG.map((g, i) => [
              label(p(i + 0.5, 0.3), `시차 ${g.t}`, { id: `lag-${i}` }),
              arrow(p(i + 0.45, 0), p(i + 0.6, 0), { id: `dir-${i}`, tone: "muted" }),
            ]),
            ST.map((st, i) => [
              circle(p(i, 0), 0.08, { id: `ring-${i}`, tone: i <= reached ? "focus" : "ref", fill: i <= reached ? "soft" : "none" }),
              label(p(i, -0.35), `${st.l} · ${st.s}`, { id: `st-${i}` }),
            ]),
            parts,
            label(p(3.3, 0.9), `인상 후 ${Math.round(Math.min(8, t))}분기`, { id: "clock", anchor: "ne" }),
          ];
        },
      ),
      answer: figure(
        cartesian({ x: [0, 12, "분기"], y: [0, 1, "반응(정규화)"], static: "0.25%p 인상에 대한 대출금리·소비·물가 반응 곡선, 최대 시점 1·3·6분기" }),
        (m) => [
          axis("x", { ticks: [0, 4, 8, 12] }),
          [{ l: "대출금리", pk: 1, tone: /** @type {const} */ ("series2") }, { l: "소비", pk: 3, tone: /** @type {const} */ ("series3") }, { l: "물가", pk: 6, tone: /** @type {const} */ ("focus") }].map((sr) =>
            line(Array.from({ length: 121 }, (_, i) => p(i / 10, m.resp.f(i / 10, sr.pk))), { id: `resp-${sr.l}`, tone: sr.tone, label: sr.l, weight: sr.l === "물가" ? "bold" : "normal" })),
          api.rect(p(4, 0), p(8, 0.03), { id: "window", tone: "focus", opacity: 0.35, fill: "solid" }),
        ],
      ),
    },
    scenes: [{
      type: "predict", title: "기준금리를 올린 효과는 물가에 언제 가장 크게 닿을까",
      ask: "한국은행이 기준금리를 0.25%p 올렸다. 소비자물가 상승률이 가장 크게 내려가는 때는?",
      figure: "pipe", focus: ["ring-3", "clock"],
      input: { kind: "choice", options: [{ text: "한 달 안", feedback: "대출금리만 금방 따라온다." }, { text: "6개월쯤 뒤", feedback: "소비·투자가 줄기까지만 해도 수분기다." }, { text: "1~2년 뒤", correct: true }] },
      reveal: { say: "단계마다 시차가 쌓인다. 모델로 계산한 예시.", figure: "answer" },
    }],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s02", src: "archive/v1:site/gallery/shots/s02-rate-transmission.html", corpus: "shot", domain: "거시경제",
  props: [
    { id: "b1", cat: "T", text: "0–1s 입자 무리가 기준금리에서 대출금리로 빠르게 흐르고 원이 켜진다", essential: true, why: "beat 1", status: "kept", by: "dot positions from t (posAt) and circle tone/fill switched per t; figure draw sampled over time" },
    { id: "b2", cat: "T", text: "1–2s 무리가 소비·투자 쪽으로 느려지며 흐르고 시계가 분기 수를 센다", essential: true, why: "beat 2", status: "kept", by: "posAt with LAG.w durations; label Text 'clock' from t" },
    { id: "b3", cat: "T", text: "2–5s 마지막 칸은 가장 느리게 흘러 물가 원에 닿는다", essential: true, why: "beat 3", status: "kept", by: "posAt last segment w 0.55 of flow time" },
    { id: "b4", cat: "T", text: "네 원이 켜진 채 '인상 후 8분기'로 멈췄다가 처음으로 돌아간다", essential: true, why: "beat 4", status: "kept", by: "Loop.warp [10,0.85]→[10,1]: 'repeated modelT holds'; loop repeats" },
    { id: "pr1", cat: "T", text: "단계 사이 시차는 같은 거리를 지나는 속도 차로 보인다", essential: true, why: "principle", status: "kept", by: "stages at x = 0,1,2,3 data units (equal), durations differ" },
    { id: "pr2", cat: "X", text: "옆 시계로 숫자도 읽게 한다", essential: true, why: "principle", status: "kept", by: "label mark 'clock' with t-derived text" },
    { id: "i1", cat: "I", text: "예측 선택 후 반응 곡선 공개", essential: false, why: "scene role predict", status: "kept", by: "Predict.input choice + reveal.figure" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
