// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, rect, label, line, dot, path, split } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const pt = (x, y) => [x, 330 - y];
  /** NN/g eye-tracking F pattern (2006, 2017), simplified */
  const PATH_A = [[40, 92], [330, 92], [40, 128], [250, 128], [40, 164], [170, 164], [40, 200], [40, 236], [110, 236], [40, 272]].map(([x, y]) => pt(x, y));
  const PATH_B = [[200, 104], [200, 178], [200, 238], [200, 280]].map(([x, y]) => pt(x, y));
  const FIX_B = ["① 헤드라인", "② 제품 사진", "③ 한 줄 설명", "④ 체험 시작"];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  /** @param {import("ltt").P[]} pts @param {number} frac */
  const headAt = (pts, frac) => {
    const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    let e = frac * seg.reduce((a, b) => a + b, 0), k = 0;
    while (k < seg.length - 1 && e > seg[k]) { e -= seg[k]; k++; }
    const f = seg[k] ? Math.min(1, e / seg[k]) : 0;
    /** @type {import("ltt").P} */
    const at = [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f];
    return { at, k };
  };
  /** @param {"A" | "B"} kind @param {string} pre */
  const page = (kind, pre) => [
    rect(pt(1, 317), pt(399, 1), { id: `${pre}-card`, fill: "soft", tone: "muted" }),
    rect(pt(20, 30), pt(66, 18), { id: `${pre}-logo`, fill: "solid", tone: "ref" }),
    label(pt(380, 52), kind === "A" ? "시안 A · 모두 같은 크기" : "시안 B · 크기·대비로 순서", { id: `${pre}-tag`, anchor: "e", tone: "muted" }),
    kind === "A"
      ? [92, 128, 164, 200, 236, 272].map((y, i) => rect(pt(30, y + 6), pt(30 + [320, 300, 330, 290, 310, 120][i], y - 6), { id: `${pre}-row-${i}`, fill: "solid", tone: i === 5 ? "ref" : "muted" }))
      : [
          rect(pt(70, 112), pt(330, 86), { id: `${pre}-headline`, fill: "solid", weight: "bold" }),
          rect(pt(120, 218), pt(280, 132), { id: `${pre}-photo`, fill: "soft", tone: "muted" }),
          path([["M", 140, 126], ["L", 175, 162], ["L", 200, 140], ["L", 225, 170], ["L", 262, 126], ["Z"]], { id: `${pre}-photo-icon`, fill: "solid", tone: "muted" }),
          rect(pt(110, 242), pt(290, 232), { id: `${pre}-desc`, fill: "solid", tone: "muted" }),
          rect(pt(140, 296), pt(260, 264), { id: `${pre}-cta`, fill: "solid", tone: "focus", label: "체험 시작" }),
        ],
  ];
  const frame = () => cartesian({ x: [0, 400, "px"], y: [0, 330, "px"], aspect: "equal", loop: { ms: 6000, span: [0, 1] } });
  return {
    figures: {
      pageA: figure(frame(), (m, t) => {
        const r = ease(Math.min(1, t / 0.8));
        return [page("A", "a"), line(PATH_A, { id: "gaze-a", tone: "focus", weight: "bold", reveal: r, opacity: 0.85 }), dot(headAt(PATH_A, r).at, { id: "gaze-a-dot", tone: "focus", size: "l" })];
      }),
      pageB: figure(frame(), () => page("B", "b")),
      pageBans: figure(cartesian({ x: [0, 400, "px"], y: [0, 330, "px"], aspect: "equal", loop: { ms: 5000, span: [0, 1] } }), (m, t) => {
        const r = ease(Math.min(1, t / 0.8)), h = headAt(PATH_B, r);
        return [
          page("B", "c"), line(PATH_B, { id: "gaze-b", tone: "focus", weight: "bold", reveal: r, opacity: 0.85 }), dot(h.at, { id: "gaze-b-dot", tone: "focus", size: "l" }),
          FIX_B.map((s, i) => (i <= h.k + (r >= 1 ? 1 : 0)) && label([PATH_B[i][0] + 112, PATH_B[i][1]], s, { id: `fix-${i}`, anchor: "w", tone: "focus" })),
        ];
      }),
      s31: split(["pageA", "pageB"]),
    },
    scenes: [{
      type: "predict", title: "위계를 주면 시선은 어디부터 멈출까?", ask: "시안 B에서 시선이 가장 먼저 멈추는 곳은?", figure: "s31", focus: ["gaze-a"],
      input: { kind: "choice", options: [
        { text: "왼쪽 위 로고", feedback: "로고는 작고 대비가 약하다." },
        { text: "가장 크고 진한 헤드라인", correct: true },
        { text: "색이 있는 체험 시작 버튼", feedback: "색 버튼은 마지막 도착점이다." }] },
      reveal: { say: "가장 크고 대비가 센 요소가 첫 시선을 받고, 시선은 크기 순서대로 내려가 버튼에서 끝난다. (예시 궤적)", figure: "pageBans" },
      targets: "색이 있는 요소가 가장 먼저 눈에 띈다",
    }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s31", src: "s31-visual-hierarchy-gaze.html", corpus: "shot", domain: "디자인 · 시각적 위계와 시선이 지나는 길",
  props: [
    { id: "b1", cat: "T", text: "점이 시안 A의 첫 줄을 가로로 훑으며 궤적을 남긴다", essential: true, why: "beat 1", status: "kept", by: "MarkOpts reveal 'Drawn fraction 0–1, by arc length from the path start' driven by loop t; dot at same arc length" },
    { id: "b2", cat: "G", text: "둘째·셋째 줄을 점점 짧게 훑으며 F 모양 궤적을 남긴다", essential: true, why: "beat 2", status: "kept", by: "line pts in data coordinates (NN/g F 패턴 단순화)" },
    { id: "b3", cat: "T", text: "점이 왼쪽 가장자리를 따라 내려가고 시안 B는 움직이지 않는다", essential: true, why: "beat 3", status: "kept", by: "split shares t; pageB draw ignores t" },
    { id: "b4", cat: "T", text: "F 궤적이 완성된 채 멈추고(끝 20%) B의 궤적은 비워 둔다", essential: true, why: "beat 4", status: "kept", by: "reveal clamps at 1 for t > 0.8; B 궤적은 pageBans 그림에만 있음" },
    { id: "p1", cat: "I", text: "예측 장면에서는 비교 대상만 움직이고 답이 될 움직임은 정답 공개 그림으로 미룬다", essential: true, why: "principle", status: "kept", by: "Predict: 'reveal.figure and reveal.params show after' answered" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
