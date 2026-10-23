// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, line, area, sweep, label } = api;
  const PA = 0.1, PB = 0.11, D = PB - PA;
  /** @param {number} z */
  const Phi = (z) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp((-z * z) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  };
  const ab = model({ n: 2000 }, ({ n }) => {
    const se = Math.sqrt((PA * (1 - PA) + PB * (1 - PB)) / n);
    return { se, crit: 1.96 * se, power: 1 - Phi(1.96 - D / se) };
  }, "양측 α=0.05 정규 근사, SE = √(pA(1−pA)/n + pB(1−pB)/n)");
  const xs = Array.from({ length: 401 }, (_, i) => -0.02 + (i * 0.05) / 400);
  return {
    models: { ab },
    figures: {
      power: figure(
        cartesian({ x: [-0.02, 0.03, "전환율 차이"], y: [0, 1.1, "최대 밀도 대비"], loop: { ms: 7000, span: [0, 1] } }),
        (m, u) => {
          const { se, crit, power } = m.ab;
          const split = u < 0.25 ? u / 0.25 : u < 0.75 ? 1 : Math.max(0, 1 - (u - 0.75) / 0.2);
          const mu1 = D * split, sh = Math.max(0, Math.min(1, (split - 0.7) / 0.3));
          /** @param {number} x @param {number} mu */
          const pdf = (x, mu) => Math.exp(-((x - mu) ** 2) / (2 * se * se));
          /** @param {number} mu @param {(x: number) => boolean} keep @returns {import("ltt").P[]} */
          const pts = (mu, keep = () => true) => xs.filter(keep).map((x) => /** @type {import("ltt").P} */ ([x, pdf(x, mu)]));
          return [
            axis("x", { label: "관측한 전환율 차이 (B − A)", ticks: [-0.02, -0.01, 0, 0.01, 0.02, 0.03] }),
            sh > 0 && area(pts(mu1, (x) => x >= crit), { id: "power-area", tone: "focus", opacity: sh }),
            sh > 0 && area(pts(mu1, (x) => x < crit), { id: "miss-area", tone: "muted", opacity: 0.6 * sh }),
            line(pts(0), { id: "h0", tone: "ref", label: "차이 없음 (H0)" }),
            line(pts(mu1), { id: "h1", tone: "focus", weight: "bold", label: "B가 +1%p (H1)", from: "h0" }),
            sh > 0 && sweep("x", crit, { id: "crit", tone: "bad", label: "유의 기준선 ±1.96 SE", opacity: sh }),
            sh > 0 && label([Math.min(0.027, Math.max(crit, mu1) + 0.003), 0.1], `검정력 ${Math.round(power * 100)}%`, { id: "power-n", tone: "focus", opacity: sh, anchor: "w" }),
            sh > 0 && label([Math.min(crit, mu1) - 0.002, 0.1], `놓침 ${Math.round((1 - power) * 100)}%`, { id: "miss-n", opacity: sh, anchor: "e" }),
          ];
        },
      ),
    },
    scenes: [{ type: "explore", title: "표본이 작으면 두 분포가 겹쳐, 진짜 1%p 개선도 대부분 놓친다", say: "그룹당 사용자를 늘리면 두 봉우리가 좁아지며 갈라진다.", figure: "power", focus: ["h1", "power-area"],
      knobs: { n: { range: [500, 50000], log: true } }, goal: { say: "검정력 80%를 넘기는 표본을 찾는다", done: (m) => m.ab.power >= 0.8 } }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s18", src: "archive/v1:site/gallery/shots/s18-ab-power.html", corpus: "shot", domain: "실험 · A/B 테스트 표본 크기와 두 분포의 겹침(검정력)",
  props: [
    { id: "b1", cat: "G", text: "0s 두 분포가 한 봉우리로 겹쳐 있다", essential: true, why: "beat", status: "kept", by: "split=0이면 h1 평균 0, line 데이터 단위" },
    { id: "b2", cat: "T", text: "0–1.8s 한 분포가 갈라져 오른쪽(+1%p)으로 미끄러진다", essential: true, why: "beat", status: "kept", by: "loop span [0,1] ms 7000; draw가 mu1 = D·split(t)" },
    { id: "b3", cat: "Q", text: "1.8–5.3s 기준선 오른쪽 음영이 쌓이고 놓침·검정력 비율이 뜬다(n=2000에서 계산값)", essential: true, why: "beat", status: "kept", by: "area 'Filled between pts and y = base', sweep, model power" },
    { id: "p1", cat: "T", text: "매 주기 같은 것을 합쳤다 갈라 겹침의 정체를 먼저 보인다", essential: true, why: "principle", status: "kept", by: "Loop 반복 + draw의 split 위상" },
    { id: "p2", cat: "I", text: "손잡이(그룹당 n, 로그 500–50,000)는 분포 폭(SE)만 바꾼다", essential: true, why: "principle", status: "kept", by: "Explore knobs {range, log: true}; n은 se에만 들어감" },
    { id: "q1", cat: "Q", text: "세로축은 밀도를 n마다 봉우리 높이로 정규화", essential: false, why: "원본도 peak에 맞춰 y 스케일을 다시 잡음", status: "kept", by: "pdf를 최대 1로 정규화" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
