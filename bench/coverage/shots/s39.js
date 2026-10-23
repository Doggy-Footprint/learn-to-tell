// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, rect, path, label, multiples, axis } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const CAP = 40;
  const sprint = model({ i: 0 }, ({ i }) => {
    const debt = 6 * i, tax = Math.min(CAP, debt * 0.25);
    return { i, debt, tax, feat: CAP - tax };
  }, "모델 예시: 용량 40점, 스프린트마다 부채 +6점, 쌓인 부채의 25%가 이자(Cunningham 1992 비유)");
  const figures = {
    cell: figure(
      cartesian({ x: [0, 1, ""], y: [0, CAP, "점"], loop: { ms: 9000, span: [0, 1] } }),
      (m, t) => {
        const s = m.sprint, out = ease(clamp((t - 0.93) / 0.07));
        const k = ease(clamp((t - 0.05 - s.i * 0.12) / 0.12)) * (1 - out);
        const taxH = s.tax * k, yb = CAP - taxH, amp = Math.min(1, taxH / 3);
        /** @type {import("ltt").PathCmd[]} */
        const d = [["M", 0, CAP], ["L", 1, CAP], ["L", 1, yb]];
        for (let j = 0; j <= 10; j++) d.push(["L", 1 - j * 0.1, yb + (j % 2 ? -amp : amp) * (taxH > 0.3 ? 1 : 0)]);
        d.push(["Z"]);
        return [
          axis("y", { label: "팀 용량" }),
          label(pt(0.5, CAP + 2), `스프린트 ${s.i + 1}`, { id: "title", anchor: "s" }),
          rect(pt(0, 0), pt(1, CAP), { id: "cap", fill: "none" }),
          rect(pt(0, 0), pt(1, yb - amp), { id: "feat", tone: "series1", fill: "soft" }),
          taxH > 0.1 && path(d, { id: "tax", tone: "series2", fill: "soft" }),
          label(pt(0.5, (yb - amp) / 2), `기능 ${(CAP - taxH).toFixed(1)}`, { id: "feat-v", weight: "bold" }),
          label(pt(0.5, -3), taxH > 0.2 ? `이자 −${taxH.toFixed(1)}` : "이자 0", { id: "tax-v", tone: "series2" }),
        ];
      },
    ),
    board: multiples("cell", { over: { i: [0, 1, 2, 3, 4, 5] } }),
  };
  return {
    models: { sprint },
    figures,
    scenes: [{ type: "hook", title: "여섯 스프린트 만에 기능이 19% 줄었다", say: "기술 부채를 갚지 않으면 칸마다 위에서 이자가 내려와 기능 개발 자리를 먹는다.", figure: "board", focus: ["tax", "feat-v"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s39", src: "s39-tech-debt-sprints.html", corpus: "shot", domain: "제품 · 스프린트마다 쌓이는 기술 부채",
  props: [
    { id: "b1", cat: "T", text: "0–2s 두 번째 칸 위로 톱니 모양 이자 층이 얇게 내려온다", essential: true, why: "beat", status: "kept", by: "Loop{ms:9000,span:[0,1]}; path L 톱니 + 칸별 지연 i*0.12" },
    { id: "b2", cat: "T", text: "2–5s 다음 칸들에 이자 층이 차례로 두껍게 쌓이고 기능 숫자가 줄어든다", essential: true, why: "beat", status: "kept", by: "multiples 'one copy per value, sharing … t'; params.i로 지연과 두께 계산" },
    { id: "b3", cat: "Q", text: "5–8s 여섯 칸 모두 내려와 마지막 칸 기능이 40→32.5로 머문다", essential: true, why: "beat", status: "kept", by: "model sprint 출력(tax = 0.25·6i), label 텍스트" },
    { id: "p1", cat: "S", text: "같은 축의 작은 칸을 나란히 두고 한 칸씩 같은 변형을 재생한다", essential: true, why: "principle", status: "kept", by: "multiples: 'sharing frame, axes, t, step, knobs'" },
    { id: "x1", cat: "S", text: "칸 순서가 시간(스프린트 1→6)이다", essential: true, why: "principle의 누적 변화는 칸 순서가 시간 순서일 때만 읽힌다", status: "ambiguous", diff: "multiples가 over 값 순서대로 한 줄로 배치하는지 d.ts가 말하지 않는다" },
  ],
  verdict: "G", custom: [], candidates: ["multiples-order"],
}];
