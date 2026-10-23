// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, arc, dot, circle, label, line, code } = api;
  const PH = [
    { id: "timers", w: 1, log: "setTimeout(cb, 0) 만료 → cb()" },
    { id: "pending", w: 0.6, log: "미뤄 둔 TCP 오류 콜백" },
    { id: "idle·prepare", w: 0.4, log: "(내부용)" },
    { id: "poll", w: 2.6, log: "readFile 콜백 · 없으면 대기" },
    { id: "check", w: 1, log: "setImmediate(cb) → cb()" },
    { id: "close", w: 0.6, log: "socket.on('close') 콜백" }];
  const N = PH.length, GAP = 4, TICK = 0.25, R = 10;
  const TW = PH.reduce((a, p) => a + p.w, 0) + N * TICK;
  const loopm = model({}, () => ({ phases: PH }), "Node.js 공식 문서 'The Node.js Event Loop' 단계 순서; 머무는 비중 w는 설명용");
  /** clockwise from 12 o'clock in degrees → math degrees */
  /** @param {number} cw */
  const deg = (cw) => 90 - cw;
  /** @param {number} cw @returns {import("ltt").P} */
  const pt = (cw) => [R * Math.cos((deg(cw) * Math.PI) / 180), R * Math.sin((deg(cw) * Math.PI) / 180)];
  /** @param {number} u */
  const at = (u) => {
    let t = u * TW;
    for (let i = 0; i < N; i++) {
      if (t < TICK) return { a: (i / N) * 360, k: i, tick: true };
      t -= TICK;
      if (t < PH[i].w) return { a: (i / N) * 360 + (t / PH[i].w) * (360 / N), k: i, tick: false };
      t -= PH[i].w;
    }
    return { a: 360, k: N - 1, tick: false };
  };
  return {
    models: { loop: loopm },
    figures: {
      ring: figure(
        cartesian({ x: [-16, 16, ""], y: [-13, 13, ""], aspect: "equal", loop: { ms: 10000, span: [0, 1] } }),
        (m, t) => {
          const { a, k, tick } = at(t);
          return [
            PH.map((p, i) => {
              const c0 = (i / N) * 360 + GAP, c1 = ((i + 1) / N) * 360 - GAP;
              const on = i === k && !tick;
              return [
                arc([0, 0], R, [deg(c1), deg(c0)], { id: `arc-${p.id}`, tone: on ? "focus" : "muted", weight: "bold" }),
                label(/** @type {import("ltt").P} */ (pt((c0 + c1) / 2).map((v) => v * 1.3)), p.id, { id: `name-${p.id}`, tone: on ? "focus" : "ref" }),
                circle(pt((i / N) * 360), tick && i === k ? 0.8 : 0.5, { id: `gap-${i}`, tone: "warn", fill: "none" }),
              ];
            }),
            label([R * 0.25, R * 1.25], "틈 = nextTick·Promise", { id: "gap-note", tone: "warn", anchor: "w" }),
            code([-6.5, 4.5], PH.map((p) => `${p.id.padEnd(8)} ${p.log}`).slice(0, tick ? k : k + 1).join("\n"), { id: "log", lang: "text", highlight: tick ? [] : [k + 1] }),
            line(Array.from({ length: 25 }, (_, j) => pt(Math.max(0, a - 63) + ((a - Math.max(0, a - 63)) * j) / 24)), { id: "tail", tone: "focus", weight: "bold", opacity: 0.55 }),
            dot(pt(a), { id: "now", tone: "focus", size: "l" }),
          ];
        },
      ),
    },
    scenes: [{ type: "explain", title: "이벤트 루프 한 바퀴에 콜백이 도는 자리", say: "점은 poll에서 오래 머물고, 단계 사이 틈에서 마이크로태스크를 비운다.", figure: "ring", focus: ["now", "arc-poll", "gap-0"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s12", src: "archive/v1:site/gallery/shots/s12-node-event-loop.html", corpus: "shot", domain: "런타임 · Node.js 이벤트 루프 단계 한 장 정리",
  props: [
    { id: "b1", cat: "T", text: "0–1s 점이 첫 단계를 돌며 꼬리 궤적을 남기고 로그 첫 줄이 찍힌다", essential: true, why: "beat", status: "kept", by: "loop TimeSpec; draw가 t로 dot·꼬리 line·code 줄 수 계산" },
    { id: "b2", cat: "T", text: "3–7s 점이 가장 긴 poll 단계(w 2.6)에 오래 머물고 로그가 쌓인다", essential: true, why: "beat; 머무는 시간 = 비중", status: "kept", by: "Loop 'maps span linearly onto ms' + draw 안의 단계별 시간 분할(at)" },
    { id: "b3", cat: "T", text: "7–9s 단계 사이 틈에서 잠깐 멈춘다", essential: true, why: "beat", status: "kept", by: "draw가 TICK 구간에 점 각도를 고정하고 gap circle을 키움" },
    { id: "b4", cat: "T", text: "9–10s 한 바퀴 뒤 로그가 다 찍힌 채 처음으로", essential: true, why: "beat", status: "kept", by: "Loop(once 없음) 반복" },
    { id: "p1", cat: "G", text: "순환을 원으로, 단계 순서를 시계 방향 호로", essential: true, why: "principle", status: "kept", by: "arc 'degrees counterclockwise from +x', aspect 'equal'" },
    { id: "p2", cat: "E", text: "단계 사이 틈(마이크로태스크)을 표식으로", essential: true, why: "principle", status: "kept", by: "circle 마크 + tone warn + label" },
    { id: "x1", cat: "X", text: "가운데 로그 패널에 단계별 콜백 줄", essential: true, why: "overlay된 로그가 단계와 콜백을 잇는다", status: "kept", by: "code(at, source, highlight)" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
