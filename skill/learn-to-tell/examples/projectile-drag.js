/** @type {import("ltt").LessonFactory} */
export default (api) => {
  const g = 9.8;
  /** @param {number} d */
  const rad = (d) => (d * Math.PI) / 180;
  /** @param {{ v0: number; deg: number; vt: number; drag: boolean }} p */
  const fly = ({ v0, deg, vt, drag }) => {
    const k = drag ? g / (vt * vt) : 0;
    const path = api.ode(
      (t, [, , vx, vy]) => {
        const s = Math.hypot(vx, vy);
        return [vx, vy, -k * s * vx, -g - k * s * vy];
      },
      [0, 0, v0 * Math.cos(rad(deg)), v0 * Math.sin(rad(deg))],
      [0, 60],
      1e-3,
      { event: (t, y) => y[1] },
    );
    return { range: path.end.y[0], time: path.end.t, path };
  };
  const src = "RK4 dt=1e-3, a = g − (g/vt²)|v|v (Taylor, Classical Mechanics §2.4)";

  return api.lesson({
    meta: {
      title: "공기저항이 있으면 최적 발사각은 왜 45°보다 낮아질까",
      objectives: [
        { id: "o1", text: "항력이 속도 반대 방향임을 그림으로 설명한다" },
        { id: "o2", text: "속도 제곱 항력을 v += a*dt 적분으로 계산한다" },
        { id: "o3", text: "종단 속도 vt로 항력/중력 비를 읽는다" },
        { id: "o4", text: "항력이 있을 때 최적각이 45°보다 낮은 이유를 설명한다" },
      ],
      learner: {
        knows: ["등가속도 운동", "사거리 공식 R = v0² sin2θ / g"],
        misconceptions: ["공기저항은 사거리를 일정 비율로 줄일 뿐 최적 각도는 45°다"],
      },
      domains: ["physics", "game-dev"],
    },
    glossary: {
      항력: "공기가 물체 운동을 막는 힘. 속도 반대 방향",
      "종단 속도": "항력이 중력과 같아져 더 빨라지지 않는 낙하 속력 vt",
      "최적 발사각": "같은 v0로 사거리가 가장 긴 각도",
      "오일러 적분": "짧은 dt마다 v += a*dt, x += v*dt로 갱신하는 방법",
    },
    checks: [
      { id: "range45", model: "flight", expect: { range: 48.07 }, tol: 0.05, source: "RK4 수치해, Parker 1977 (Am. J. Phys. 45, 606)" },
      { id: "range30", model: "flight", at: { deg: 30 }, value: (o) => o.range, expect: [48.72, 48.82] },
      { id: "time45", model: "flight", expect: { time: 3.829 }, tol: 0.005 },
      { id: "below45", model: "best", expect: { deg: { lt: 45, gt: 30 } } },
      {
        model: "flight",
        at: { drag: false, deg: 30 },
        value: (o) => o.range - (40 ** 2 * Math.sin(rad(60))) / g,
        expect: 0,
        tol: 0.05,
        limit: "drag:false → R = v0² sin2θ / g",
        source: "진공 포물선 해석해",
      },
      {
        model: "best",
        at: { vt: 1e4 },
        expect: { deg: [44.8, 45.2] },
        limit: "vt → ∞ 이면 최적각 45°",
        source: "진공 해석해 sin2θ 최대",
      },
      {
        model: "fall",
        value: (o) => Math.abs(o.v.at(2)[0] - 20 * Math.tanh((g * 2) / 20)),
        expect: { lt: 0.001 },
        limit: "정지 낙하 v(t) = vt·tanh(g t / vt)",
        source: "Taylor, Classical Mechanics §2.4",
      },
      { model: "fall", value: (o) => o.v.at(3)[0], expect: 17.99, rel: 0.001 },
      { id: "drag-shortens", model: "flight", value: (o, run) => run({ drag: false }).range > o.range, expect: true },
    ],
    models: {
      flight: api.model({ v0: 40, deg: 45, vt: 20, drag: true }, fly, src),
      best: api.model(
        { v0: 40, vt: 20 },
        ({ v0, vt }) => {
          const b = api.argmax((deg) => fly({ v0, deg, vt, drag: true }).range, [1, 89]);
          return { deg: b.x, range: b.y };
        },
        src,
      ),
      fall: api.model(
        { vt: 20 },
        ({ vt }) => ({ v: api.ode((t, [v]) => [g - (g / (vt * vt)) * v * v], [0], [0, 8], 1e-3) }),
        "RK4 dt=1e-3, dv/dt = g − (g/vt²)v²",
      ),
      balls: api.model(
        { cd: 0.5, rho: 1.2 },
        ({ cd, rho }) => {
          /** @param {number} m @param {number} d */
          const vt = (m, d) => Math.sqrt((2 * m * g) / (rho * cd * Math.PI * (d / 2) ** 2));
          return { pingpong: vt(0.0027, 0.04), baseball: vt(0.145, 0.074), shot: vt(7.26, 0.12) };
        },
        { illustrative: true },
      ),
    },
    figures: {
      traj: api.figure(
        api.cartesian({ x: [0, 170, "m"], y: [0, 60, "m"], aspect: "equal", loop: { ms: 4000, span: [0, 6] } }),
        (m, t, { params }) => {
          const v0 = Number(params.v0), th = rad(Number(params.deg));
          const T = (2 * v0 * Math.sin(th)) / g;
          const vac = Array.from({ length: 41 }, (_, i) => {
            const s = (T * i) / 40;
            return /** @type {[number, number]} */ ([v0 * Math.cos(th) * s, v0 * Math.sin(th) * s - (g * s * s) / 2]);
          });
          const [x, y, vx, vy] = m.flight.path.at(t);
          const sp = Math.hypot(vx, vy) || 1;
          const f = (sp * sp) / 400;
          return [
            api.axis("x", { label: "거리" }),
            api.axis("y", { label: "높이" }),
            api.legend([{ tone: "ref", text: "진공" }, { tone: "focus", text: "공기" }], { id: "key", at: [120, 55] }),
            params.drag !== false && api.line(vac, { id: "vacuum", tone: "ref", dash: true, label: "진공" }),
            api.trace(m.flight.path, t, { id: "drag-path", tone: "focus", head: true, dims: [0, 1] }),
            api.arrow([x, y], [x - (8 * f * vx) / sp, y - (8 * f * vy) / sp], { id: "drag-force", tone: "series2", label: "항력" }),
            api.arrow([x, y], [x, y - 8], { id: "gravity", tone: "muted", label: "중력" }),
            api.angle([0, 0], [20, 0], [20 * Math.cos(th), 20 * Math.sin(th)], { id: "launch", text: `${params.deg}°` }),
            api.dim([0, -3], [m.flight.range, -3], (o) => `${o.flight.range.toFixed(1)} m`, { id: "range-dim" }),
          ];
        },
      ),
      forces: api.figure(
        api.cartesian({ x: [-6, 6, "N"], y: [-4, 4, "N"], aspect: "equal", static: "공에 걸린 속도, 항력, 중력 화살표" }),
        () => [
          api.dot([0, 0], { id: "ball" }),
          api.arrow([0, 0], [3, 1.5], { id: "vel", tone: "series1", label: "v" }),
          api.arrow([0, 0], [-1, -0.5], { id: "drag", tone: "focus", label: "항력" }),
          api.arrow([0, 0], [0, -2], { id: "grav", tone: "muted", label: "mg" }),
          api.math([2, 3], String.raw`\vec F_d = -\frac{mg}{v_t^2}\,|\vec v|\,\vec v`, { id: "formula" }),
        ],
      ),
      euler: api.figure(
        api.cartesian({ x: [0, 10, ""], y: [0, 6, ""], steps: ["가속도", "속도 갱신", "위치 갱신"] }),
        (m, t, { step }) => [
          api.code([0.5, 5], "a = g - k*|v|*v\nv += a*dt\nx += v*dt", { id: "code", lang: "js", highlight: [step + 1] }),
          api.label([6, 2], ["a: 항력+중력", "v: dt만큼 변함", "x: 새 v로 이동"][step], { id: "note", anchor: "w" }),
        ],
      ),
      fallv: api.figure(
        api.cartesian({ x: [0, 8, "s"], y: [0, 25, "m/s"], loop: { ms: 3000, span: [0, 8] } }),
        (m, t) => [
          api.axis("x", { label: "시간" }),
          api.axis("y", { label: "낙하 속력" }),
          api.line(Array.from({ length: 81 }, (_, i) => /** @type {[number, number]} */ ([i / 10, m.fall.v.at(i / 10)[0]])), { id: "v-curve", tone: "focus" }),
          api.line([[0, 20], [8, 20]], { id: "vt-line", tone: "ref", dash: true, label: "vt" }),
          api.sweep("x", t, { id: "now" }),
        ],
      ),
      vx: api.figure(
        api.cartesian({ x: [0, 6, "s"], y: [0, 30, "m/s"], loop: { ms: 4000, span: [0, 6] } }),
        (m, t) => {
          /** @type {import("ltt").Series} */
          const s = m.flight.path;
          const pts = s.until(t).map((p) => /** @type {[number, number]} */ ([p.t, p.y[2]]));
          return [
            api.axis("x", { label: "시간" }),
            api.axis("y", { label: "vx" }),
            api.area(pts, { id: "vx-area", tone: "focus", label: "넓이 = 사거리" }),
            api.line(pts, { id: "vx-line" }),
          ];
        },
      ),
      angles: api.figure(
        api.cartesian({ x: [0, 90, "°"], y: [0, 55, "m"], static: "발사각별 사거리, v0 40, vt 20" }),
        (m) => {
          const pts = Array.from({ length: 17 }, (_, i) => {
            const deg = 5 + 5 * i;
            return /** @type {[number, number]} */ ([deg, fly({ v0: 40, deg, vt: 20, drag: true }).range]);
          });
          return [
            api.grid({ x: 15 }),
            api.line(pts, { id: "range-curve", curve: "smooth" }),
            api.dot([45, pts[8][1]], { id: "deg45", tone: "ref", label: "45°" }),
            api.dot([m.best.deg, m.best.range], { id: "best-dot", tone: "focus" }),
            api.sweep("x", m.best.deg, { id: "best-line" }),
          ];
        },
      ),
      both: api.split(["traj", "vx"], { link: "deg" }),
      byvt: api.multiples("traj", { over: { vt: [10, 20, 40] } }),
    },
    sections: [
      {
        concept: { id: "drag-dir", title: "항력과 그 방향", definition: "항력은 속도 반대 방향으로 걸린다", level: 2, leadsTo: ["v2"] },
        scenes: [
          { type: "hook", title: "게임 속 공은 너무 멀리 난다", say: "진공 포물선(점선)과 공기 속 궤적을 비교해 보자.", figure: "traj", focus: ["vacuum", "drag-path"] },
          {
            type: "predict",
            title: "최적각은 그대로일까",
            ask: "공기저항이 있으면 가장 멀리 가는 각도는?",
            figure: "angles",
            focus: ["range-curve"],
            input: {
              kind: "choice",
              options: [
                { text: "그대로 45°", feedback: "항력은 일정 비율이 아니라 속도와 시간에 따라 달라진다." },
                { text: "45°보다 낮다", correct: true },
                { text: "45°보다 높다", feedback: "높이 쏘면 오래 떠 있어 항력을 더 오래 받는다." },
              ],
            },
            reveal: { say: (m) => `최적각은 약 ${m.best.deg.toFixed(0)}°. 오래 떠 있을수록 손해가 커서 낮게 쏘는 쪽이 낫다.`, marks: ["best-dot", "best-line"] },
            targets: "공기저항은 사거리를 일정 비율로 줄일 뿐 최적 각도는 45°다",
          },
          { type: "define", term: "항력", definition: "항력은 속도 반대 방향이라 vx와 vy를 모두 줄인다.", figure: "forces", focus: ["drag", "vel"] },
          {
            type: "quiz",
            items: [{ kind: "choice", prompt: "공이 올라갈 때 항력 방향은?", objective: "o1", options: [{ text: "속도 반대", correct: true }, { text: "항상 아래", feedback: "아래는 중력이다." }] }],
          },
        ],
      },
      {
        concept: { id: "v2", title: "속도 제곱 항력", definition: "항력 크기는 속력의 제곱에 비례한다", level: 3, requires: ["drag-dir"], leadsTo: ["vt"] },
        scenes: [
          {
            type: "predict",
            title: "두 배 빠르면",
            ask: "속력이 두 배면 항력 화살표 끝은 어디일까? 끌어서 놓아 보자.",
            figure: "forces",
            focus: ["drag"],
            input: { kind: "drag", mark: "drag", axis: "x", answer: () => -4, tol: 0.4 },
            reveal: { say: "F ∝ v²이므로 4배다. 빠를수록 항력이 급격히 커진다.", marks: ["formula"] },
          },
          {
            type: "steps",
            title: "게임 루프 한 프레임",
            figure: "euler",
            steps: [
              { say: "항력과 중력으로 가속도를 구한다.", focus: ["code"] },
              { say: "v += a*dt로 속도를 바꾼다.", focus: ["code", "note"] },
              { say: "새 속도로 위치를 옮긴다.", focus: ["code"] },
            ],
          },
          { type: "compare", title: "항력 끄기/켜기", say: "같은 45°라도 항력이 있으면 사거리가 1/3 이하다.", figure: "traj", focus: ["drag-path", "range-dim"], a: { drag: false }, b: { drag: true }, labels: ["진공", "공기"] },
          {
            type: "quiz",
            items: [{ kind: "numeric", prompt: "속력이 3배면 항력은 몇 배?", answer: 9, tol: 0.01, unit: "배", objective: "o2" }],
          },
        ],
      },
      {
        concept: { id: "vt", title: "종단 속도", definition: "항력이 중력과 같아지는 속력 vt. 항력/중력 = (v/vt)²", level: 4, requires: ["v2"], leadsTo: ["angle"] },
        scenes: [
          {
            type: "predict",
            title: "떨어뜨린 공의 속력",
            ask: "정지 상태에서 떨어뜨린 공의 속력 v(t)를 그려 보자.",
            figure: "fallv",
            focus: ["vt-line"],
            input: { kind: "draw", x: [0, 8], answer: "v-curve", tol: 2 },
            reveal: { say: "처음엔 9.8 m/s²로 빨라지다 항력이 커져 vt = 20 m/s에 다가간다.", marks: ["v-curve"] },
          },
          { type: "explain", title: "종단 속도", say: "v = vt에서 항력 = 중력. 항력/중력 비는 (v/vt)²다.", figure: "fallv", focus: ["vt-line", "v-curve"] },
          {
            type: "explore",
            title: "vt를 바꿔 보기",
            say: "vt가 작을수록 궤적이 짧고 뒤쪽이 가파르다.",
            figure: "byvt",
            focus: ["drag-path"],
            knobs: { vt: [5, 60, 1] },
            goal: { say: "사거리가 30 m 아래가 되게 해 보자.", done: (m) => m.flight.range < 30 },
          },
          {
            type: "quiz",
            items: [{ kind: "choice", prompt: "v = vt/2일 때 항력/중력은?", objective: "o3", options: [{ text: "1/4", correct: true }, { text: "1/2", feedback: "비는 (v/vt)²이다." }] }],
          },
        ],
      },
      {
        concept: { id: "angle", title: "최적각이 낮아지는 이유", definition: "항력은 높이 쏠수록 오래 작용해 vx를 깎는다", level: 5, requires: ["vt"] },
        scenes: [
          {
            type: "predict",
            title: "사거리는 넓이다",
            ask: "사거리는 vx(t) 아래 넓이다. 60°와 30° 중 넓이가 큰 쪽은?",
            figure: "both",
            focus: ["vx-area"],
            input: { kind: "choice", options: [{ text: "30°", correct: true }, { text: "60°", feedback: "60°는 오래 날지만 vx가 처음부터 작고 더 깎인다." }] },
            reveal: { say: "30°가 48.8 m, 60°가 39.1 m. 낮은 각은 vx가 커서 넓이가 크다." },
          },
          {
            type: "steps",
            title: "각도별 사거리",
            figure: "angles",
            steps: [
              { say: "45°는 정점이 아니다.", focus: ["deg45"] },
              { say: (m) => `정점은 ${m.best.deg.toFixed(1)}°.`, focus: ["best-dot", "best-line"] },
            ],
          },
          {
            type: "explore",
            title: "가장 멀리 보내기",
            say: "각도를 바꿔 사거리를 늘려 보자.",
            figure: "traj",
            focus: ["range-dim", "launch"],
            knobs: { deg: [10, 80, 1], drag: true },
            goal: { say: "49.5 m를 넘겨 보자.", done: (m) => m.flight.range > 49.5 },
          },
          {
            type: "quiz",
            items: [{ kind: "choice", prompt: "v0를 100 m/s로 올리면 최적각은?", objective: "o4", options: [{ text: "더 낮아진다(약 29°)", correct: true }, { text: "45°로 돌아간다", feedback: "빠를수록 v/vt가 커져 항력 비중이 커진다." }] }],
          },
        ],
      },
    ],
    quiz: [
      { kind: "choice", prompt: "탁구공을 멀리 치려면?", objective: "o4", transfer: true, options: [{ text: "45°보다 꽤 낮게", correct: true }, { text: "45°", feedback: (m) => `탁구공 vt는 약 ${m.balls.pingpong.toFixed(0)} m/s(가정: C_d 0.5, ρ 1.2)로 작아 항력이 지배한다.` }] },
      { kind: "numeric", prompt: "v0 40, vt 20에서 45° 사거리(m)는?", answer: { check: "range45" }, tol: 1, unit: "m", objective: "o2", figure: "traj" },
      { kind: "order", prompt: "한 프레임 갱신 순서", items: ["가속도 계산", "v += a*dt", "x += v*dt"], objective: "o2" },
      {
        kind: "classify",
        prompt: "항력 비중이 큰 공과 작은 공",
        bins: ["크다", "작다"],
        items: [{ text: "탁구공", bin: "크다" }, { text: "포환", bin: "작다" }, { text: (m) => `야구공(가정 vt ${m.balls.baseball.toFixed(0)} m/s)을 100 m/s로`, bin: "크다" }],
        objective: "o3",
      },
    ],
    summary: { figures: ["angles", "fallv"], say: (m) => `항력이 있으면 최적각은 ${m.best.deg.toFixed(0)}°처럼 45°보다 낮다.` },
  });
};
