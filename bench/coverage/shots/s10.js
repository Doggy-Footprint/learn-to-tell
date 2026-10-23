// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, grid, rect, line, flow, label, sweep, dot, path } = api;
  const SET = 22, BAND = 0.5, TOUT = 5, A = 0.03, B = 0.01, TAU = 12, HMAX = 40, DT = 0.25, MIN = 90;
  const thermo = model({ set: SET }, ({ set }) => {
    let T = 17, H = 17, u = 1;
    /** @type {{ t: number; T: number; H: number; u: number }[]} */
    const run = [];
    for (let t = 0; t <= MIN + 1e-9; t += DT) {
      if (T >= set + BAND) u = 0;
      if (T <= set - BAND) u = 1;
      run.push({ t, T, H, u });
      H += (((u ? HMAX : T) - H) / TAU) * DT;
      T += (A * (H - T) - B * (T - TOUT)) * DT;
    }
    const peak = run.reduce((m, p) => (p.T > m.T ? p : m), run[0]);
    const off = run.find((p, i) => i > 0 && run[i - 1].u === 1 && p.u === 0) ?? run[0];
    return { run, peak, off };
  }, { illustrative: true });
  /** @type {import("ltt").P[]} */
  const loopPts = [[12, 27.4], [74, 27.4], [74, 24.9], [12, 24.9], [12, 27.4]];
  return {
    models: { thermo },
    figures: {
      plot: figure(
        cartesian({ x: [0, 90, "분"], y: [16, 28, "°C"], loop: { ms: 9000, span: [0, 90], warp: [[0, 0], [90, 0.88], [90, 1]] } }),
        (m, t) => {
          const run = m.thermo.run;
          const i = Math.min(run.length - 1, Math.round(t / DT));
          const p = run[i];
          const heat = Math.max(0, Math.min(1, (p.H - p.T) / (HMAX - 17)));
          return [
            grid({ y: 2 }),
            axis("x", { label: "시간", ticks: [0, 15, 30, 45, 60, 75, 90] }),
            axis("y", { label: "방 온도" }),
            rect([0, SET - BAND], [90, SET + BAND], { id: "band", tone: "good", fill: "soft", label: "목표 22° ± 0.5" }),
            line([[0, SET], [90, SET]], { id: "setpoint", tone: "good", dash: true }),
            path([["M", 12, 27.4], ["L", 74, 27.4], ["L", 74, 24.9], ["L", 12, 24.9], ["Z"]], { id: "loop", tone: "muted", fill: "soft" }),
            label([12, 27.4], "온도조절기", { id: "thermostat", size: "s" }),
            label([74, 27.4], "보일러 40° 온수", { id: "boiler", size: "s", tone: p.u ? "focus" : "muted" }),
            label([74, 24.9], "라디에이터", { id: "radiator", size: "s" }),
            label([12, 24.9], "방 공기", { id: "room", size: "s" }),
            flow(loopPts, { id: "heat-flow", n: Math.round(26 * (0.15 + 0.85 * heat)), rate: 0.004 + 0.012 * heat, seed: 10, t, tone: "focus", opacity: 0.35 + 0.65 * heat }),
            label([43, 26.15], p.u ? "켜짐 · 열이 돈다" : "꺼짐 · 남은 열이 돈다", { id: "state", tone: p.u ? "focus" : "muted" }),
            line(run.slice(0, i + 1).map((/** @type {{ t: number; T: number }} */ q) => /** @type {import("ltt").P} */ ([q.t, q.T])), { id: "temp", tone: "focus", weight: "bold" }),
            dot([p.t, p.T], { id: "head", tone: "focus" }),
            t >= m.thermo.off.t && sweep("x", m.thermo.off.t, { id: "off", tone: "ref", label: `${m.thermo.off.t.toFixed(0)}분 보일러 끔` }),
            t >= m.thermo.peak.t && line([[m.thermo.peak.t, SET + BAND], [m.thermo.peak.t, m.thermo.peak.T]], { id: "overshoot", tone: "warn", weight: "bold", label: `끈 뒤에도 ${m.thermo.peak.T.toFixed(1)}°까지 오른다` }),
          ];
        },
      ),
    },
    scenes: [{ type: "hook", title: "22°에서 껐는데 왜 23.5°까지 오를까", say: "되먹임 고리를 도는 열 입자와 온도 곡선을 함께 본다.", figure: "plot", focus: ["temp", "heat-flow", "overshoot"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s10", src: "archive/v1:site/gallery/shots/s10-thermostat-overshoot.html", corpus: "shot", domain: "제어 · 온도조절기 되먹임 루프와 오버슈트",
  props: [
    { id: "b1", cat: "T", text: "0–3s 곡선이 왼쪽부터 그려지고 고리를 열 입자가 빽빽하게 돈다", essential: true, why: "beat", status: "kept", by: "Loop span·ms가 모델 시간을 선형 사상; line을 run.slice(0,i)로 그리고 flow n·rate를 모델 heat에서 계산" },
    { id: "b2", cat: "T", text: "3–6s 목표 띠에 닿고 보일러 끔 점선이 선다", essential: true, why: "beat", status: "kept", by: "figure draw가 t마다 재평가; t >= off.t일 때 sweep('x') 출현" },
    { id: "b3", cat: "Q", text: "6–8s 정점(23.5°)을 넘어 내려가다 다시 켜지고 입자가 다시 늘어난다", essential: true, why: "beat; 오버슈트 수치가 결론", status: "kept", by: "api.model 시뮬레이션 출력 peak; flow n이 heat(t)로 증가" },
    { id: "b4", cat: "T", text: "8–9s 곡선이 끝까지 그려진 채 남는다(88% 지점에서 완성 후 정지)", essential: true, why: "beat", status: "kept", by: "Loop.warp [[0,0],[90,0.88],[90,1]] — 'repeated modelT holds'" },
    { id: "p1", cat: "S", text: "원인 흐름(고리)과 결과 곡선을 한 그림에 겹친다", essential: true, why: "principle", status: "kept", by: "MarkOpts 주석 'Later marks in MarkTree paint on top'; 노드는 node at으로 데이터 좌표에 둠" },
    { id: "p2", cat: "Q", text: "흐름의 양(입자 수·속도)을 라디에이터 잔열 H−T에 묶어, 끈 뒤에도 흐름이 서서히 줄어든다", essential: true, why: "principle", status: "ambiguous", diff: "flow의 rate가 프레임마다 바뀔 때 입자 위치가 rate*t로 튀는지 누적 위상인지, n이 바뀔 때 어떤 입자가 사라지는지 d.ts가 말하지 않는다" },
    { id: "x1", cat: "X", text: "켜짐/꺼짐 상태 글자와 '끈 뒤에도 23.5°' 주석", essential: false, why: "보조 글자", status: "kept", by: "label·line label Text" },
  ],
  verdict: "G", custom: [], candidates: ["flow-variable-rate"],
}];
