// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, multiples, line, rect, circle, path, label, flow, legend } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const p = (x, y) => [x, 430 - y];
  const x0 = 70, x1 = 470, y0 = 80, y1 = 340;
  /** @param {number} f */
  const evX = (f) => 110 + f * 320;
  /** @param {number} f */
  const cdX = (f) => 430 - f * 320;
  const CASES = {
    normal: { n: 12, split: 0.78, merge: 0.3, sh: "과열도 6K", sc: "과냉도 10K", title: "정상 충전" },
    low: { n: 6, split: 0.22, merge: 0.92, sh: "과열도 22K", sc: "과냉도 1K", title: "냉매 부족 (약 −40%)" },
  };
  const charge = model(
    { kind: "normal" },
    (q) => CASES[q.kind === "low" ? "low" : "normal"],
    "R-410A 가정용 에어컨 흔한 진단 범위(제조사 충전 가이드): 정상 과열도 5–8K·과냉도 8–12K, 냉매 부족이면 과열도↑ 과냉도↓. 화면 숫자는 예시",
  );
  const PER = 2 * ((x1 - x0) + (y1 - y0));
  const circuit = figure(
    cartesian({ x: [0, 540, ""], y: [0, 430, ""], aspect: "equal", loop: { ms: 7000, span: [0, 7] } }),
    (m, t) => {
      const C = m.charge, sx = evX(C.split), mx = cdX(C.merge);
      const liquid = [p(mx, y0), p(x0, y0), p(x0, y1), p(sx, y1)];
      const vapor = [p(sx, y1), p(x1, y1), p(x1, y0), p(mx, y0)];
      const lenL = (mx - x0) + (y1 - y0) + (sx - x0), lenV = (x1 - sx) + (y1 - y0) + (x1 - mx);
      return [
        label(p(270, 18), C.title, { id: "title", weight: "bold" }),
        rect(p(x0, y1), p(x1, y0), { id: "pipe", tone: "muted", fill: "none" }),
        line([p(sx, y1), p(430, y1)], { id: "vapor-zone", tone: "warn", weight: "bold", opacity: 0.35 }),
        line([p(mx, y0), p(110, y0)], { id: "subcool-zone", tone: "focus", weight: "bold", opacity: 0.35 }),
        rect(p(150, y1 + 22), p(390, y1 - 22), { id: "evap", fill: "none", label: "증발기 · 저압" }),
        rect(p(150, y0 + 22), p(390, y0 - 22), { id: "cond", fill: "none", label: "응축기 · 고압" }),
        circle(p(x1, 210), 32, { id: "comp", fill: "solid", tone: "ref", label: "압축기" }),
        path([["M", x0 - 16, 430 - 196], ["L", x0 + 16, 430 - 224], ["L", x0 + 16, 430 - 196], ["L", x0 - 16, 430 - 224], ["Z"]], { id: "valve", fill: "solid", tone: "ref" }),
        label(p(x0 + 26, 210), "팽창밸브", { id: "valve-l", anchor: "w", weight: "bold" }),
        label(p((sx + 430) / 2, y1 + 52), C.sh, { id: "sh", weight: "bold" }),
        label(p((mx + 110) / 2, y0 - 36), C.sc, { id: "sc", weight: "bold" }),
        flow(liquid, { id: "liq", n: Math.max(1, Math.round((C.n * lenL) / PER)), rate: PER / 7 / lenL, seed: 1, t, tone: "focus", size: "l" }),
        flow(vapor, { id: "gas", n: Math.max(1, Math.round((3 * C.n * lenV) / PER)), rate: PER / 7 / lenV, seed: 2, t, tone: "warn", size: "s" }),
        legend([{ tone: "focus", text: "액체 덩어리" }, { tone: "warn", text: "쪼개진 기체" }], { id: "key", at: p(270, 410) }),
      ];
    },
  );
  const pair = multiples("circuit", { over: { kind: ["normal", "low"] } });
  return { models: { charge }, figures: { circuit, pair } };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s45", src: "s45-refrigerant-undercharge.html", corpus: "shot", domain: "냉동 사이클 · 정상 vs 냉매 부족",
  props: [
    { id: "b1", cat: "T", text: "0–2s 두 회로에서 큰 점이 흐르다 증발기에서 작은 점으로 갈라진다", essential: true, why: "beat", status: "approx", by: "Api.flow 두 개(액체 큰 점·기체 작은 점)", diff: "한 입자가 세 알갱이로 쪼개지는 연속 변형 대신 구간 경계에서 큰 점 흐름이 끝나고 작은 점 흐름이 시작된다(개수 3배)." },
    { id: "b2", cat: "T", text: "2–5s 갈라진 점이 압축기를 지나 응축기에서 다시 합쳐진다", essential: true, why: "beat", status: "approx", diff: "합쳐짐도 두 flow의 경계 전환으로만 보이고, flow의 rate 단위(경로 비율인지 데이터 거리인지)를 d.ts가 말하지 않아 두 구간 속도가 같다는 보장은 없다." },
    { id: "b3", cat: "G", text: "5–7s 오른쪽은 갈라지는 자리가 앞당겨진 채 계속 흐른다", essential: true, why: "beat", status: "kept", by: "model charge.split → evX(split) 좌표의 경계와 vapor-zone line; multiples over kind" },
    { id: "pr", cat: "S", text: "같은 회로를 나란히 두고 상이 바뀌는 자리만 달리 하면 차이가 그 길이로 읽힌다", essential: true, why: "principle", status: "kept", by: "Api.multiples \"one copy per value, sharing frame, axes, t\"" },
    { id: "x1", cat: "X", text: "과열도·과냉도 수치 라벨", essential: false, why: "진단 기준", status: "kept", by: "Api.label" },
  ],
  verdict: "V", custom: [], candidates: ["particle-morph"],
}];
