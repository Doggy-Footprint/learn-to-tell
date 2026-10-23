// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, arc, arrow, rect, label, dot } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const NODES = [
    { n: "1", l: "예금 인출", v: "3월 9일 하루 420억 달러", d: "다음 날 아침 1,000억 달러가 더 대기" },
    { n: "2", l: "현금 부족", v: "채권을 팔아 현금 마련", d: "3월 8일 210억 달러 매각" },
    { n: "3", l: "손실 확정", v: "매각 손실 18억 달러", d: "만기보유 채권 평가손 약 150억 달러" },
    { n: "4", l: "신뢰 하락", v: "주가 하루 −60%", d: "증자 발표가 오히려 경보가 됐다" },
    { n: "5", l: "불안 확산", v: "예금 약 94%가 보호 한도 밖", d: "25만 달러 넘는 예금은 먼저 빼는 쪽이 유리" },
  ];
  const R = 205, W = 960, H = 580, cx = 480, cy = 288;
  /** clockwise from top, degrees in data space (y up) */
  const deg = (/** @type {number} */ i) => 90 - (i / 5) * 360;
  const P = (/** @type {number} */ a) => pt(cx + R * Math.cos((a * Math.PI) / 180), cy + R * Math.sin((a * Math.PI) / 180));
  const ZW = 560, ZH = (ZW * H) / W;
  /** @param {number} i @returns {{ x: [number, number]; y: [number, number] }} */
  const view = (i) => { const [x, y] = P(deg(i)); return { x: [x - ZW / 2, x + ZW / 2], y: [y - ZH / 2, y + ZH / 2] }; };
  const full = { x: /** @type {[number, number]} */ ([0, W]), y: /** @type {[number, number]} */ ([0, H]) };
  /** @param {{ x: [number, number]; y: [number, number] }} a @param {{ x: [number, number]; y: [number, number] }} b @param {number} e */
  const lerp = (a, b, e) => ({ x: /** @type {[number, number]} */ ([a.x[0] + (b.x[0] - a.x[0]) * e, a.x[1] + (b.x[1] - a.x[1]) * e]), y: /** @type {[number, number]} */ ([a.y[0] + (b.y[0] - a.y[0]) * e, a.y[1] + (b.y[1] - a.y[1]) * e]) });
  /** @param {number} T seconds */
  const state = (T) => {
    if (T < 1.2) return { vb: full, focus: -1, a: deg(0) };
    if (T < 2.2) return { vb: lerp(full, view(0), ease(T - 1.2)), focus: 0, a: deg(0) };
    if (T < 8.2) {
      const k = (T - 2.2) / 1.2, i = Math.floor(k), e = ease(clamp((k - i - 0.45) / 0.55));
      return { vb: i < 4 ? lerp(view(i), view(i + 1), e) : view(4), focus: e < 0.5 ? i : (i + 1) % 5, a: deg(i) - (i < 4 ? e : ease(clamp(k - 4))) * 72 };
    }
    if (T < 9.2) return { vb: lerp(view(4), full, ease(T - 8.2)), focus: -1, a: deg(0) };
    return { vb: full, focus: -1, a: deg(0) };
  };
  const figures = {
    loop: figure(
      cartesian({ x: [0, W, ""], y: [0, H, ""], aspect: "equal", loop: { ms: 10000, span: [0, 10] }, camera: (m, T) => state(T).vb }),
      (m, T) => {
        const s = state(T), zoomed = s.vb.x[1] - s.vb.x[0] < W * 0.7;
        return [
          NODES.map((_, i) => {
            const a0 = deg(i) - 17.2, a1 = deg(i + 1) + 17.2;
            const end = P(a1), pre = P(a1 + 4);
            return [arc(pt(cx, cy), R, [a1, a0], { id: `link-${i}`, tone: "bad", weight: "bold" }), arrow(pre, end, { id: `link-tip-${i}`, tone: "bad", weight: "bold" })];
          }),
          label(pt(cx, cy - 34), "인출이 인출을 부른다", { id: "center", size: "l", weight: "bold" }),
          label(pt(cx, cy - 62), "실리콘밸리은행(SVB), 2023년 3월 8–10일", { id: "center-sub", tone: "muted" }),
          (T > 9.2 || T < 1.2) && label(pt(cx, cy - 92), "한 바퀴 돌 때마다 다음 인출이 커진다: 420억 → 1,000억 달러", { id: "summary", tone: "bad", weight: "bold" }),
          dot(P(s.a), { id: "runner", tone: "bad", size: "m" }),
          NODES.map((nd, i) => {
            const [x, y] = P(deg(i)), on = i === s.focus;
            return [
              rect(pt(x - 98, y - 40), pt(x + 98, y + 40), { id: `box-${i}`, tone: on ? "bad" : undefined, weight: on ? "bold" : "normal", fill: "none" }),
              label(pt(x - 98, y + 40), nd.n, { id: `badge-${i}`, weight: "bold" }),
              label(pt(x, y + 10), nd.l, { id: `title-${i}`, weight: "bold", size: "l" }),
              label(pt(x, y - 14), nd.v, { id: `value-${i}` }),
              label(pt(x, y - 31), nd.d, { id: `detail-${i}`, tone: "muted", size: "s", opacity: zoomed && on ? 1 : 0 }),
            ];
          }),
          label(pt(W - 12, 8), "출처: Federal Reserve, SVB 감독 검토 보고서(2023-04) · 확대하면 세부 수치가 보인다", { id: "source", anchor: "se", tone: "muted", size: "s" }),
        ];
      },
    ),
  };
  return { figures, scenes: [{ type: "explain", title: "뱅크런은 다섯 칸짜리 되먹임 고리다", say: "번호를 따라 확대해 보면, 각 칸의 결과가 다음 칸의 원인이 된다.", figure: "loop", focus: ["link-0", "box-0"] }] };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s43", src: "s43-bank-run-loop.html", corpus: "shot", domain: "금융 안정 · 뱅크런 되먹임 한 장 정리",
  props: [
    { id: "b1", cat: "T", text: "1–2s 전체 고리에서 첫 칸으로 확대되고 칸 테두리가 빨개진다", essential: true, why: "beat", status: "kept", by: "cartesian camera '(m, t) → visible data window over time' + Loop{ms:10000,span:[0,10]}; rect tone 'bad'" },
    { id: "b2", cat: "X", text: "2–8s 확대된 채 다음 칸으로 훑으며 칸마다 세부 수치가 드러난다", essential: true, why: "beat", status: "approx", diff: "세부 label은 draw가 camera 창 폭으로 opacity를 정해 드러나지만, camera 확대 시 글자 크기가 함께 커지는지(원본 viewBox 확대처럼)는 d.ts가 말하지 않아 작은 글씨 판독성이 보장되지 않는다" },
    { id: "b3", cat: "T", text: "8–9s 마지막 칸에서 다시 전체 고리로 축소된다", essential: true, why: "beat", status: "kept", by: "camera 보간" },
    { id: "b4", cat: "X", text: "9–10s 전체 고리와 한 줄 요약이 보이는 상태로 머문다", essential: true, why: "beat", status: "kept", by: "T > 9.2에서 full 창 + summary label" },
    { id: "p1", cat: "S", text: "축소하면 구조만, 확대하면 칸마다 근거", essential: true, why: "principle", status: "ambiguous", diff: "확대가 표시 축척을 키워 숨은 세부를 읽게 만든다는 것이 핵심인데, camera가 글자·선 두께를 화면 크기로 유지하는지 데이터와 함께 키우는지 d.ts가 정하지 않는다" },
    { id: "g1", cat: "G", text: "다섯 칸이 고리를 이루고 화살표가 결과→원인 방향으로 돈다", essential: true, why: "제목", status: "kept", by: "arc(degrees 반시계 데이터 각) + 끝 arrow" },
  ],
  verdict: "G", custom: [], candidates: ["camera-zoom-scales-text"],
}];
