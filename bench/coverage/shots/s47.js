// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, rect, path, label } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const p = (x, y) => [x, y];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const KINDS = ["석탄", "가스", "원자력", "재생에너지", "석유·기타"];
  const TONES = /** @type {const} */ (["series1", "series2", "series3", "series4", "series5"]);
  const YEARS = [2000, 2010, 2015, 2020, 2023];
  /** @type {Record<string, number[][]>} */
  const MIX = {
    독일: [[52, 9, 29, 6, 4], [42, 14, 22, 17, 5], [42, 10, 14, 30, 4], [24, 16, 11, 45, 4], [26, 15, 1.5, 53, 4.5]],
    한국: [[39, 10, 39, 1, 11], [44, 20, 31, 2, 3], [43, 19, 30, 5, 3], [36, 26, 29, 8, 1], [33, 27, 30, 9, 1]],
  };
  const mix = model(
    { year: 2000 },
    () => MIX,
    "Ember Yearly Electricity Data·IEA 통계 반올림 근사(1–2%p 차이 가능)",
  );
  const W = 880, CW = 300, XA = 40, XB = W - CW - 40;
  const bars = figure(
    cartesian({ x: [0, W, ""], y: [0, 112, "%"], loop: { ms: 9000, span: [0, 4], warp: [[0, 0], [0, 0.066], [1, 0.2], [1, 0.266], [2, 0.4], [2, 0.466], [3, 0.6], [3, 0.666], [4, 0.8], [4, 1]] } }),
    (m, t, { params }) => {
      const picked = YEARS.indexOf(Number(params.year));
      const tt = picked > 0 ? picked : t;
      const i = Math.min(YEARS.length - 2, Math.floor(tt)), f = ease(Math.min(1, tt - i));
      /** @param {string} name */
      const at = (name) => m.mix[name][i].map((/** @type {number} */ v, /** @type {number} */ k) => v + (m.mix[name][i + 1][k] - v) * f);
      /** @param {number[]} vals */
      const tops = (vals) => { let y = 100; return vals.map((v) => { const s = [y, y - v]; y -= v; return s; }); };
      const de = tops(at("독일")), ko = tops(at("한국")), mid = (XA + CW + XB) / 2;
      return [
        label(p(XA + CW / 2, 106), "독일", { id: "h-de", weight: "bold", size: "l" }),
        label(p(XB + CW / 2, 106), "한국", { id: "h-ko", weight: "bold", size: "l" }),
        KINDS.map((k, n) => [
          [de, ko].map((col, c) => {
            const x0 = c ? XB : XA, [a, b] = col[n];
            return [
              rect(p(x0, b), p(x0 + CW, a), { id: `${c ? "ko" : "de"}-${n}`, tone: TONES[n], fill: "solid" }),
              a - b > 6.5 && label(p(x0 + 14, (a + b) / 2), `${k} ${Math.round(a - b)}%`, { id: `${c ? "ko" : "de"}-${n}-l`, anchor: "w" }),
            ];
          }),
          path([["M", XA + CW, de[n][0]], ["C", mid, de[n][0], mid, ko[n][0], XB, ko[n][0]], ["L", XB, ko[n][1]], ["C", mid, ko[n][1], mid, de[n][1], XA + CW, de[n][1]], ["Z"]], { id: `link-${n}`, tone: TONES[n], fill: "soft", opacity: 0.4 }),
        ]),
        label(p(W / 2, 48), String(YEARS[Math.round(tt)]), { id: "year", weight: "bold", size: "l" }),
        label(p(W / 2, 40), "발전량 비중", { id: "year-sub", tone: "muted", size: "s" }),
      ];
    },
  );
  return {
    models: { mix },
    figures: { bars },
    scenes: [{ type: "explore", title: "같은 20여 년, 독일은 석탄을 재생에너지로 바꾸고 한국은 가스를 늘렸다", say: "연도를 고르면 그 해에 멈춘다.", figure: "bars", focus: ["link-0", "link-3"], knobs: { year: ["2000", "2010", "2015", "2020", "2023"] } }],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s47", src: "s47-power-mix-sweep.html", corpus: "shot", domain: "에너지 · 연도별 지역 전력 믹스",
  props: [
    { id: "b1", cat: "Q", text: "0–0.9s 첫 해: 양쪽 100% 막대가 칸 비율로 나뉘고 가운데 띠가 같은 범주를 잇는다", essential: true, why: "beat", status: "kept", by: "rect 높이 = 비중(y Axis %, 선형) + path C·Z fill soft (MarkOpts.fill)" },
    { id: "b2", cat: "T", text: "1.8–4.2s 칸 높이가 모양을 바꾸며 다음 해로 옮겨 가고 띠도 따라 휜다", essential: true, why: "beat", status: "kept", by: "loop span [0,4] 연도 색인 + draw에서 보간; warp로 연도당 머묾·이동" },
    { id: "b3", cat: "G", text: "4.2–6s 한쪽은 한 칸이 줄고 다른 칸이 커지며 띠의 기울기가 두 쪽 차이를 보인다", essential: true, why: "beat", status: "kept", by: "띠 양 끝이 두 막대의 같은 범주 경계 좌표를 따른다(path 좌표는 data units)" },
    { id: "b4", cat: "T", text: "7.2–9s 마지막 해에서 멈추고 두 막대의 최종 모양이 띠로 이어진다", essential: true, why: "beat", status: "kept", by: "Loop.warp [[4,0.8],[4,1]] \"repeated modelT holds\"" },
    { id: "pr", cat: "S", text: "비율은 넓이로, 시간은 모양 변화로, 두 쪽을 같은 범주 띠로 이어 비교", essential: true, why: "principle", status: "kept", by: "한 frame에 두 막대와 범주별 path; Tone series1–6 \"mutually distinguishable\"" },
    { id: "i1", cat: "I", text: "연도 단추를 누르면 자동 재생이 멈추고 그 해에 선다", essential: false, why: "원본 조작", status: "approx", diff: "knob 값이 기본값(2000)이면 자동 재생과 구별되지 않고, knob이 loop를 멈추는지 d.ts가 말하지 않는다." },
  ],
  verdict: "V", custom: [], candidates: [],
}];
