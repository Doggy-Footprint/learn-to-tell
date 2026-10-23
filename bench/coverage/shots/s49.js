// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, rect, path, circle, line, label } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const p = (x, y) => [x, y];
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const Z = [
    { id: "ra", name: "림 앞", fg: 0.66, pts: 2, at: p(25, 2.2), ring: p(25, 3) },
    { id: "paint", name: "페인트", fg: 0.44, pts: 2, at: p(25, 12), ring: p(25, 12) },
    { id: "mid", name: "미드레인지", fg: 0.42, pts: 2, at: p(10.5, 15.5), ring: p(10.5, 15.5) },
    { id: "corner", name: "코너 3점", fg: 0.39, pts: 3, at: p(1.5, 4), ring: p(1.5, 3) },
    { id: "above", name: "윙·탑 3점", fg: 0.36, pts: 3, at: p(25, 28.5), ring: p(25, 28.5) },
  ];
  const zones = model({ showEps: false }, (q) => ({ show: Boolean(q.showEps), z: Z.map((z) => ({ ...z, eps: z.fg * z.pts })) }), "NBA.com 2023-24 리그 구역별 야투율(반올림, 불확실). 기대 득점 = 야투율 × 슛 점수");
  const D = 32, bx = 25, by = 5.25, R3 = 23.75, yc = by + Math.sqrt(R3 * R3 - 22 * 22);
  /** @type {Record<string, import("ltt").PathCmd[]>} */
  const shapes = {
    corner: [["M", 0, 0], ["L", 0, yc], ["L", 3, yc], ["L", 3, 0], ["Z"], ["M", 47, 0], ["L", 47, yc], ["L", 50, yc], ["L", 50, 0], ["Z"]],
    mid: [["M", 3, 0], ["L", 3, yc], ["A", R3, R3, 0, 0, 0, 47, yc], ["L", 47, 0], ["Z"]],
    ra: [["M", 21, 0], ["L", 21, by], ["A", 4, 4, 0, 0, 0, 29, by], ["L", 29, 0], ["Z"]],
  };
  const court = figure(
    cartesian({ x: [0, 50, "ft"], y: [-5, D, "ft"], aspect: "equal", loop: { ms: 8000, span: [0, 6] } }),
    (m, t) => {
      const k = Math.floor(t), local = t - k;
      /** @param {string} id */
      const zo = (id) => { const i = Z.findIndex((z) => z.id === id); return { id: `z-${id}`, tone: /** @type {import("ltt").Tone} */ (i === k ? "focus" : "muted"), fill: /** @type {"soft" | "none"} */ (i === k ? "soft" : "none") }; };
      return [
        rect(p(0, 0), p(50, D), zo("above")),
        path(shapes.corner, zo("corner")),
        path(shapes.mid, zo("mid")),
        rect(p(17, 0), p(33, 19), zo("paint")),
        path(shapes.ra, zo("ra")),
        circle(p(bx, by), 0.75, { id: "hoop", fill: "none", weight: "bold" }),
        line([p(22, 4), p(28, 4)], { id: "board", weight: "bold" }),
        m.zones.z.map((/** @type {{id:string,name:string,fg:number,pts:number,at:import("ltt").P,eps:number}} */ z, /** @type {number} */ i) => {
          const tone = /** @type {import("ltt").Tone | undefined} */ (i === k ? "focus" : k === 5 ? undefined : "muted");
          const below = z.id === "corner" || z.id === "ra";
          const x = z.id === "corner" ? 1.5 : z.at[0];
          const anchor = /** @type {"w" | "c"} */ (z.id === "corner" ? "w" : "c");
          return [
            label(p(x, below ? -1.6 : z.at[1] + 0.5), z.name, { id: `n-${z.id}`, anchor, weight: "bold", tone }),
            label(p(x, below ? -3.3 : z.at[1] - 1.5), m.zones.show ? `${z.eps.toFixed(2)}점` : `성공률 ${Math.round(z.fg * 100)}% · ${z.pts}점슛`, { id: `v-${z.id}`, anchor, tone, weight: k === 5 ? "bold" : "normal" }),
          ];
        }),
        k < 5 && circle(Z[k].ring, (70 + 40 * ease(clamp(local / 0.6))) / 12, { id: "scan", tone: "focus", fill: "none", weight: "bold", opacity: 1 - clamp((local - 0.3) / 0.6) }),
      ];
    },
  );
  return {
    models: { zones },
    figures: { court },
    scenes: [{
      type: "predict", title: "슛 한 번의 값은 어디가 가장 낮을까", ask: "기대 득점이 가장 낮은 구역은?", figure: "court", focus: ["z-mid"],
      input: { kind: "choice", options: [{ text: "림 앞", feedback: "0.66 × 2 = 1.32점이다." }, { text: "미드레인지", correct: true }, { text: "윙·탑 3점", feedback: "0.36 × 3 = 1.08점이다." }] },
      reveal: { say: "미드레인지는 0.42 × 2 = 0.84점, 성공률이 더 낮은 3점은 0.36 × 3 = 1.08점이다.", params: { showEps: true } },
    }],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s49", src: "s49-basketball-zone-value.html", corpus: "shot", domain: "스포츠 분석 · 농구 구역별 기대 득점",
  props: [
    { id: "b1", cat: "E", text: "0–1.6s 첫 구역이 칠해지고 고리가 퍼지며 그 구역 숫자만 진해진다", essential: true, why: "beat", status: "kept", by: "구역 rect/path tone focus fill soft, circle 반지름을 t로; 나머지 label tone muted (Tone \"focus is the accent\")" },
    { id: "b2", cat: "E", text: "2.9–4.3s 강조가 옆 구역으로 옮겨 가고 앞 구역은 흐려진다", essential: true, why: "beat", status: "kept", by: "loop span [0,6], k = floor(t) 구역 색인" },
    { id: "b3", cat: "E", text: "5.6–7s 마지막 구역까지 훑으며 고리가 한 번 더 퍼진다", essential: true, why: "beat", status: "kept", by: "같은 k 규칙, k=4" },
    { id: "b4", cat: "E", text: "7–8s 강조가 모두 빠지고 다섯 구역 숫자가 한꺼번에 진하게 남는다", essential: true, why: "beat", status: "kept", by: "k=5에서 focus·muted를 모두 빼고 값 label weight \"bold\"" },
    { id: "pr", cat: "S", text: "강조를 영역에서 영역으로 옮기며 숫자를 하나씩 읽히고 끝에서 전체를 한꺼번에 보인다", essential: true, why: "principle", status: "kept", by: "위 b1–b3 구조" },
    { id: "g1", cat: "G", text: "코트 구역 기하(3점 호 23.75ft, 코너 22ft, 페인트 16×19ft), 같은 축척", essential: true, why: "구역이 실제 코트와 대응", status: "kept", by: "cartesian aspect \"equal\", PathCmd \"A\"(sweep 0 = 시계방향, y up)" },
    { id: "q1", cat: "Q", text: "구역별 성공률·점수, 정답 공개 뒤 기대 득점 = fg × pts", essential: true, why: "결론 0.84 vs 1.08", status: "kept", by: "Api.model src + Predict.reveal.params {showEps:true}" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
