// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, grid, line, dot, label, brace, rect } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const p = (x, y) => [x, y];
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const LEVELS = [{ id: "ONE", k: 1 }, { id: "QUORUM", k: 2 }, { id: "ALL", k: 3 }];
  const lat = model(
    { one1: 1, one2: 2, one3: 3, m1: 1, m2: 70, m3: 140 },
    (q) => {
      /** @param {number[]} r @param {number} k */
      const kth = (r, k) => [...r].sort((a, b) => a - b)[k - 1];
      const one = [q.one1, q.one2, q.one3], multi = [q.m1, q.m2, q.m3];
      return { one: LEVELS.map((L) => kth(one, L.k)), multi: LEVELS.map((L) => kth(multi, L.k)) };
    },
    "지연 = RF=3 중 k번째로 빠른 복제본 왕복. 리전 간 ping 공개 측정치(서울–도쿄 30–40ms, 서울–오레곤 120–140ms), 불확실",
  );
  const pacelc = figure(
    cartesian({ x: [-0.4, 2.6, ""], y: [-30, 165, "ms"], loop: { ms: 9000, span: [0, 9] } }),
    (m, t) => {
      const out = clamp((t - 8.3) / 0.7);
      const ph = [clamp((t - 0.3) / 1.6), clamp((t - 2.6) / 2.0)];
      const series = [
        { key: "one", tone: /** @type {const} */ ("series1"), text: "한 리전 (복제본 왕복 1–3ms)", dy: 14 },
        { key: "multi", tone: /** @type {const} */ ("series2"), text: "세 리전 (서울·도쿄·오레곤)", dy: -16 },
      ];
      const b = ease(clamp((t - 5.0) / 0.8)) * (1 - out);
      return [
        axis("y", { label: "읽기 지연", ticks: [0, 50, 100, 150] }),
        grid({ y: [50, 100, 150] }),
        LEVELS.map((L, i) => [
          label(p(i, -12), L.id, { id: `lv-${L.id}`, anchor: "c", weight: "bold" }),
          label(p(i, -24), `복제본 ${L.k}/3 응답 대기`, { id: `lv-${L.id}-sub`, tone: "muted", size: "s" }),
        ]),
        label(p(2.55, -5), "일관성 강해짐 →", { id: "dir", anchor: "e", tone: "muted" }),
        series.map((s, j) => {
          const e = ease(ph[j]);
          /** @type {number[]} */
          const ys = m.lat[s.key];
          return [
            line(ys.map((y, i) => p(i, y)), { id: `line-${s.key}`, tone: s.tone, weight: "bold", reveal: e, opacity: 1 - out }),
            ys.map((y, i) => {
              const on = clamp((e - i / 2.05) * 8) * (1 - out);
              return [
                j === 0 ? dot(p(i, y), { id: `pt-${s.key}-${i}`, tone: s.tone, opacity: on }) : rect(p(i - 0.03, y - 3), p(i + 0.03, y + 3), { id: `pt-${s.key}-${i}`, tone: s.tone, fill: "solid", opacity: on }),
                label(p(i + 0.05, y + 7), `${y}ms`, { id: `val-${s.key}-${i}`, anchor: "sw", weight: "bold", opacity: on }),
              ];
            }),
            label(p(1.95, ys[2] + s.dy), s.text, { id: `name-${s.key}`, anchor: "e", weight: "bold", opacity: clamp((ph[j] - 0.85) * 7) * (1 - out) }),
          ];
        }),
        brace(p(1.15, m.lat.one[1]), p(1.15, m.lat.multi[1]), "+68ms: 바다 건너 한 번 더 왕복", { id: "gap", tone: "bad", weight: "bold", opacity: b }),
        label(p(2.55, 160), "모델로 계산한 예시 · 지연 = k번째로 빠른 복제본의 왕복 시간", { id: "tag", anchor: "ne", tone: "muted", size: "s" }),
      ];
    },
  );
  return { models: { lat }, figures: { pacelc } };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s44", src: "s44-pacelc-latency.html", corpus: "shot", domain: "분산 시스템 · 일관성 수준과 지연(PACELC)",
  props: [
    { id: "b1", cat: "T", text: "0–2s 같은 축 위에 첫 번째 선이 왼쪽부터 그려진다", essential: true, why: "beat", status: "kept", by: "MarkOpts.reveal \"Drawn fraction 0–1, by arc length from the path start\" + loop {ms:9000, span:[0,9]}" },
    { id: "b2", cat: "T", text: "3–5s 두 번째 선이 위에 겹쳐 그려지며 값이 하나씩 붙는다", essential: true, why: "beat", status: "kept", by: "MarkOpts \"Later marks in MarkTree paint on top\" + reveal + 점·값 label opacity를 t로 계산" },
    { id: "b3", cat: "E", text: "5–8s 같은 손잡이 위치(QUORUM)에 차이 괄호가 나타나 머문다", essential: true, why: "beat", status: "kept", by: "Api.brace(from,to,text) 두 선의 QUORUM 값 사이, opacity를 t로" },
    { id: "pr", cat: "S", text: "같은 축에 조건 두 개를 차례로 겹쳐 그리면 값 차이만 눈에 남는다", essential: true, why: "principle", status: "kept", by: "한 cartesian frame에 두 line(같은 x·y Axis)" },
    { id: "q1", cat: "Q", text: "지연 = k번째로 빠른 복제본 왕복(ms), 선형 y축", essential: true, why: "결론 2ms→70ms가 이 값에 기댄다", status: "kept", by: "Api.model(src 인용) + Axis [min,max,\"ms\"]" },
    { id: "x1", cat: "X", text: "x축 범주 이름 ONE·QUORUM·ALL과 '복제본 k/3 응답 대기'", essential: true, why: "x 위치의 의미", status: "approx", diff: "axis ticks는 숫자만 받으므로 범주 이름을 frame 안 label로 따로 놓는다(축과 정렬은 좌표로만 맞춘다)." },
  ],
  verdict: "V", custom: [], candidates: ["category-axis"],
}];
