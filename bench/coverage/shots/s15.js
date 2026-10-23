// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, rect, label } = api;
  const N = 16, POOL = 1000, LOSS = 60;
  const TR = [{ l: "선순위", a: 800, r: "AAA · 연 4.5%" }, { l: "중순위", a: 150, r: "BBB · 연 7.0%" }, { l: "후순위", a: 50, r: "등급 없음 · 남는 이자 전부" }];
  const tranche = model({ loss: LOSS }, ({ loss }) => {
    let left = loss;
    const hit = TR.slice().reverse().map((t) => { const x = Math.min(t.a, left); left -= x; return x; }).reverse();
    return { hit };
  }, { illustrative: true });
  /** @param {number} x */
  const cl = (x) => Math.max(0, Math.min(1, x));
  /** @param {number} u @param {number} a @param {number} b */
  const seg = (u, a, b) => cl((u - a) / (b - a));
  /** @param {number} a @param {number} b @param {number} k */
  const lerp = (a, b, k) => a + (b - a) * k;
  // y in 억 for the pool column (0 = bottom of 후순위); loans sit left in the same frame, 62.5억 tall each.
  const PX0 = 500, PX1 = 620, GAPY = 65;
  return {
    models: { tranche },
    figures: {
      sec: figure(
        cartesian({ x: [0, 1120, ""], y: [-150, 1150, "억"], loop: { ms: 9000, span: [0, 1] } }),
        (m, u) => {
          const merge = seg(u, 0.32, 0.4), split = seg(u, 0.42, 0.56), hit = seg(u, 0.62, 0.78), out = 1 - seg(u, 0.92, 0.99);
          const bottoms = [200, 50, 0];
          const lossH = LOSS * hit;
          return [
            label([172, 1120], "① 은행의 대출 16건"), label([560, 1120], "② 하나로 묶은 풀"), label([640, 1120], "③ 순서대로 나눈 트랜치", { anchor: "w" }),
            Array.from({ length: N }, (_, i) => {
              const hx = 70 + (i % 4) * 56, hy = 900 - Math.floor(i / 4) * 170;
              const k = seg(u, 0.05 + i * 0.012, 0.22 + i * 0.012);
              const sy = POOL - (i + 1) * 62.5;
              const x0 = lerp(hx, PX0, k), x1 = lerp(hx + 44, PX1, k), y0 = lerp(hy, sy, k), y1 = lerp(hy + 110, sy + 62.5, k);
              return [
                rect([hx, hy], [hx + 44, hy + 110], { id: `ghost-${i}`, tone: "muted", fill: "none", weight: "thin" }),
                rect([x0, y0], [x1, y1], { id: `loan-${i}`, tone: "ref", fill: "soft", opacity: (1 - merge) * out }),
              ];
            }),
            u > 0.58 && rect([67, 900 - 3 * 170 - 5], [117, 900 - 3 * 170 + 115], { id: "default", tone: "bad", fill: "soft", opacity: out, label: "1건 부도 → 회수 못한 60억" }),
            rect([PX0, 0], [PX1, POOL], { id: "pool", tone: "ref", fill: "soft", opacity: merge * (1 - split) * out, label: "풀 1,000억" }),
            TR.map((t, i) => {
              const dy = (2 - i) * GAPY * split;
              const y0 = bottoms[i] + dy;
              return [
                rect([PX0, y0], [PX1, y0 + t.a], { id: `tr-${i}`, tone: /** @type {const} */ (["series1", "series2", "series3"])[i], fill: "solid", opacity: merge * out }),
                label([PX1 + 20, y0 + t.a / 2], `${t.l} ${t.a}억 · ${t.r}`, { anchor: "w", opacity: split * out }),
                m.tranche.hit[i] > 0 && label([PX1 + 20, y0 + t.a / 2 - 40], `−${m.tranche.hit[i]}억${m.tranche.hit[i] === t.a ? " 전액" : ""}`, { anchor: "w", tone: "bad", opacity: hit * out }),
              ];
            }),
            hit > 0 && rect([PX0, 0], [PX1, Math.min(lossH, 50)], { id: "loss-equity", tone: "bad", fill: "solid", opacity: out }),
            hit > 0 && lossH > 50 && rect([PX0, 50 + GAPY], [PX1, 50 + GAPY + lossH - 50], { id: "loss-mezz", tone: "bad", fill: "solid", opacity: out }),
            u > 0.58 && label([PX0 - 16, 20], `대출 손실 ${LOSS}억 · 아래 칸부터 깎인다`, { anchor: "e", tone: "bad", opacity: out }),
          ];
        },
      ),
    },
    scenes: [{ type: "explain", title: "대출을 하나로 묶고, 손실을 받는 순서로 다시 나눈다", say: "손실 60억이면 후순위 50억이 먼저 사라지고 10억만 중순위가 떠안는다.", figure: "sec", focus: ["pool", "loss-equity"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s15", src: "archive/v1:site/gallery/shots/s15-securitization-tranches.html", corpus: "shot", domain: "금융 · 증권화, 대출을 묶어 트랜치로 나눔",
  props: [
    { id: "b1", cat: "T", text: "0–2s 대출 칸들이 하나씩 가운데로 날아가 쌓인다", essential: true, why: "beat", status: "kept", by: "draw가 t로 loan rect 좌표를 집→풀 칸으로 보간" },
    { id: "b2", cat: "T", text: "3–4s 쌓인 칸들이 합쳐져 풀 기둥 하나가 된다", essential: true, why: "beat", status: "kept", by: "MarkOpts.opacity 교차(loan 사라짐·pool 나타남)" },
    { id: "b3", cat: "Q", text: "4–5s 풀이 800·150·50억 세 층으로 갈라지고 이름표가 붙는다", essential: true, why: "beat", status: "kept", by: "rect 높이가 데이터 단위(억), split로 층 간격 벌림" },
    { id: "b4", cat: "Q", text: "6–8s 손실 60억이 아래층부터 차올라 후순위 50 전액, 중순위 10", essential: true, why: "beat; 흡수 순서가 결론", status: "kept", by: "api.model absorb 계산 + rect 높이 데이터 단위" },
    { id: "p1", cat: "S", text: "주인공(풀)을 가운데 자리에 둔 채 모이고 갈라진다", essential: true, why: "principle", status: "kept", by: "pool·tranche rect가 같은 x 구간 PX0–PX1에 고정" },
    { id: "p2", cat: "E", text: "떠난 대출의 빈자리를 점선으로 남긴다", essential: true, why: "principle", status: "approx", diff: "rect에 dash가 없어 빈자리는 thin 윤곽(fill none)으로 남고 점선 질감은 잃지만 빈자리 자체는 보인다" },
  ],
  verdict: "V", custom: [], candidates: ["rect-dash"],
}];
