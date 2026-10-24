// QR-1 fixture: cartesian (linear, log x/y/xy, aspect equal, camera), 17 non-graph marks, trace/flow/sweep/reveal/split/multiples/custom,
// all 8 scene types + summary, predict choice/drag/draw, explore slider/log slider/select/toggle/handle/goal, quiz 4 kinds, loop once/warp, steps, idle, static, glossary.
/** @type {import("ltt").LessonFactory} */
export default (api) => {
  /** @param {number} T0 @param {number} Ta @param {number} k @param {number} t */
  const temp = (T0, Ta, k, t) => Ta + (T0 - Ta) * Math.exp(-k * t);
  const src = "뉴턴 냉각 법칙 dT/dt = −k(T − Ta), 해 T = Ta + (T0 − Ta)e^(−kt) (Incropera, Heat Transfer 5.2절)";
  /** @param {number} n @param {(i: number) => [number, number]} f */
  const pts = (n, f) => Array.from({ length: n }, (_, i) => f(i));

  return api.lesson({
    meta: {
      title: "뜨거운 커피는 왜 처음에 빨리 식을까",
      objectives: [
        { id: "o1", text: "온도차가 클수록 빨리 식는다는 것을 그래프로 설명한다" },
        { id: "o2", text: "냉각 상수로 60°C까지 걸리는 시간을 계산한다" },
        { id: "o3", text: "뚜껑과 컵 크기가 식는 속도에 주는 영향을 비교한다" },
      ],
      learner: {
        knows: ["온도와 열의 차이", "지수 함수의 모양"],
        misconceptions: ["커피는 일정한 속도로 식는다"],
      },
      domains: ["physics", "everyday"],
    },
    glossary: {
      "냉각 상수": "온도차 1°C당 1분 동안 줄어드는 온도의 비율 k",
      열평형: "두 물체의 온도가 같아져 더 이상 열이 흐르지 않는 상태",
    },
    checks: [
      { id: "t60", model: "cool", expect: { t60: 7.27 }, tol: 0.05, source: "ln(68/38)/0.08" },
      { model: "cool", at: { k: 1e-6 }, expect: { end: [89.9, 90] }, limit: "k → 0 이면 식지 않는다", source: "해석해" },
      { model: "cool", value: (o, run) => run({ lid: true }).t60 > o.t60, expect: true },
      { model: "cups", expect: { minutes: 7.2 }, tol: 0.01 },
    ],
    models: {
      cool: api.model(
        { T0: 90, Ta: 22, k: 0.08, lid: false },
        (p) => {
          const k = p.lid ? p.k / 2 : p.k;
          const s = api.ode((t, y) => [1, -k * (y[1] - p.Ta)], [0, p.T0], [0, 60], 0.05);
          return { s, k, t60: Math.log((p.T0 - p.Ta) / (60 - p.Ta)) / k, end: temp(p.T0, p.Ta, k, 60), half: Math.LN2 / k };
        },
        src,
      ),
      cups: api.model({ r: 4 }, (p) => ({ minutes: 1.8 * p.r }), { illustrative: true }),
    },
    figures: {
      curve: api.figure(
        api.cartesian({ x: [0, 60, "분"], y: [0, 100, "°C"], loop: { ms: 6000, span: [0, 60], warp: [[0, 0], [10, 0.5], [60, 1]] } }),
        (m, t, { params }) => {
          const Ta = Number(params.Ta ?? 22), k0 = Number(params.k ?? 0.08);
          const now = m.cool.s.at(t)[1];
          return [
            api.axis("x", { label: "경과 시간" }),
            api.axis("y", { label: "커피 온도" }),
            api.grid({ y: 20 }),
            api.legend([{ tone: "series1", text: "뚜껑 없음" }, { tone: "series2", text: "뚜껑 덮음" }, { tone: "ref", text: "실온" }], { id: "key" }),
            api.line([[0, Ta], [60, Ta]], { id: "room", tone: "ref", dash: true, label: `실온 ${Ta}°C` }),
            api.line(pts(61, (i) => [i, m.cool.s.at(i)[1]]), { id: "temp", tone: "series1", reveal: Math.min(1, t / 60) }),
            api.line(pts(61, (i) => [i, temp(90, Ta, k0 / 2, i)]), { id: "lid-curve", tone: "series2", label: "뚜껑 덮음" }),
            api.trace(m.cool.s, t, { id: "now-trace", tone: "series1", head: true, trail: true, dims: [0, 1] }),
            api.sweep("x", t, { id: "now" }),
            api.dot([t, now], { id: "cup-dot", tone: "series1", label: `${now.toFixed(0)}°C` }),
          ];
        },
      ),
      decay: api.figure(
        api.cartesian({ x: [0, 40, "분"], y: [0.01, 1, ""], log: "y", static: "온도차 비율을 로그 눈금에 그린 직선" }),
        (m) => [
          api.axis("x", { label: "경과 시간" }),
          api.axis("y", { label: "온도차 비율" }),
          api.line(pts(41, (i) => [i, Math.exp(-m.cool.k * i)]).filter(([, y]) => y >= 0.01), { id: "ratio", tone: "series1", label: "직선이 된다" }),
          api.dot([m.cool.half, 0.5], { id: "half-dot", tone: "series2" }),
          api.label([m.cool.half, 0.5], "온도차 절반", { id: "half-label", anchor: "ne" }),
        ],
      ),
      sizes: api.figure(
        api.cartesian({ x: [0.1, 100, "cm"], y: [0.1, 1000, "분"], log: "xy", static: "컵 반지름과 식는 시간의 로그-로그 그래프" }),
        () => [
          api.axis("x", { label: "컵 반지름" }),
          api.axis("y", { label: "60°C까지 시간" }),
          api.line(pts(31, (i) => { const r = 0.5 * 100 ** (i / 30); return [r, 1.8 * r]; }), { id: "size-line", tone: "series1" }),
          api.dot([1, 1.8], { id: "espresso-dot", tone: "series2", label: "에스프레소 잔" }),
          api.dot([4, 7.2], { id: "mug-dot", tone: "series3", label: "머그컵" }),
          api.dot([15, 27], { id: "pot-dot", tone: "series4", label: "냄비 한가득" }),
        ],
      ),
      cup: api.figure(
        api.cartesian({ x: [-6, 6, "cm"], y: [-1, 11, "cm"], aspect: "equal", static: "커피잔 단면과 열이 빠져나가는 방향" }),
        () => [
          api.rect([-3, 0], [3, 9], { id: "cup-body", tone: "muted", fill: "soft" }),
          api.circle([1.5, 7], 0.4, { id: "bubble", tone: "series2" }),
          api.arc([3, 5], 1.5, [-90, 90], { id: "handle", tone: "muted" }),
          api.path([["M", -1, 9.2], ["C", -2, 9.8, 0, 10.2, -1, 10.8], ["Q", -1.5, 10.9, -1.2, 10.9]], { id: "steam-path", tone: "muted", dash: true }),
          api.arrow([0, 8.6], [4.5, 10.4], { id: "heat-out", tone: "series1", label: "열 손실(증발·대류)" }),
          api.angle([0, 8.6], [4.5, 8.6], [4.5, 10.4], { id: "tilt", text: "22°" }),
          api.dim([-4.5, 0], [-4.5, 9], "높이 9 cm", { id: "height" }),
          api.brace([-3, -0.5], [3, -0.5], "지름 6 cm", { id: "width" }),
          api.label([0, 8.6], "커피 표면", { id: "surface", anchor: "s" }),
          api.label([-3, 4], "도자기 벽", { id: "wall", anchor: "e" }),
          api.math([-4, 10.4], String.raw`\frac{dT}{dt} = -k\,(T - T_a)`, { id: "law" }),
          api.custom({ id: "thermo", why: "온도계 눈금 모양은 기본 mark로 표현할 수 없다", bounds: [[4.4, 0], [5.8, 6]] }, ({ h }) =>
            h("g", {},
              h("rect", { x: 0.35, y: 0.1, width: 0.3, height: 0.8, fill: "none", stroke: "#555555", "stroke-width": 1 }),
              h("circle", { cx: 0.5, cy: 0.1, r: 0.15, fill: "#b3261e" }),
              h("line", { x1: 0.5, y1: 0.1, x2: 0.5, y2: 0.6, stroke: "#b3261e", "stroke-width": 2 }))),
        ],
      ),
      camera: api.figure(
        api.cartesian({
          x: [0, 60, "분"], y: [0, 100, "°C"], loop: { ms: 4000, span: [0, 60], once: true },
          camera: (m, t) => ({ x: [Math.max(0, t - 20), Math.max(20, t)], y: [0, 100] }),
        }),
        (m, t) => {
          const lo = Math.max(0, t - 20), hi = Math.max(20, t);
          const xs = pts(61, (i) => [i, m.cool.s.at(i)[1]]).filter(([x]) => x >= lo && x <= hi);
          return [
            api.axis("x", { label: "경과 시간" }),
            api.axis("y", { label: "온도" }),
            api.line(xs, { id: "cam-line", tone: "series1" }),
            api.dot([t, m.cool.s.at(t)[1]], { id: "cam-dot", tone: "series1", label: "지금" }),
          ];
        },
      ),
      code: api.figure(
        api.cartesian({ x: [0, 10, ""], y: [0, 6, ""], steps: ["온도차 계산", "변화량 계산", "온도 갱신"] }),
        (m, t, { step }) => [
          api.code([0.5, 5.5], "d = T - Ta\ndT = -k * d * dt\nT = T + dT", { id: "code", lang: "js", highlight: [step + 1], label: ["실온과의 차이", "차이에 비례해 감소", "새 온도로 바꾼다"][step] }),
        ],
      ),
      steam: api.figure(
        api.cartesian({ x: [0, 10, "cm"], y: [0, 10, "cm"], idle: { ms: 2500 } }),
        (m, t) => [
          api.rect([3, 0], [7, 1], { id: "cup-top", tone: "muted", fill: "solid" }),
          api.flow([[5, 1], [4, 4], [6, 7], [5, 9.5]], { id: "steam", n: 6, rate: 0.4, seed: 7, t, tone: "series1" }),
          api.label([5, 9.5], "김", { id: "steam-label", anchor: "n" }),
        ],
      ),
      play: api.figure(
        api.cartesian({ x: [0, 60, "분"], y: [0, 100, "°C"], static: "냉각 곡선과 60°C 목표선" }),
        (m, t, { params }) => {
          const tx = Number(params.tx ?? 30), Ta = Number(params.Ta ?? 22);
          const curve = pts(61, (i) => [i, m.cool.s.at(i)[1]]);
          const y = m.cool.s.at(tx)[1];
          return [
            api.axis("x", { label: "경과 시간" }),
            api.axis("y", { label: "온도" }),
            api.area(curve, { id: "excess", tone: "series1", base: Ta, label: "남은 열" }),
            api.line(curve, { id: "play-curve", tone: "series1" }),
            api.line([[0, 60], [60, 60]], { id: "target", tone: "good", dash: true, label: "마시기 좋은 60°C" }),
            api.dot([tx, y], { id: "probe", tone: "series2", label: `${tx.toFixed(0)}분: ${y.toFixed(0)}°C` }),
            api.label([45, 90], String(params.cup ?? "머그"), { id: "cup-name", anchor: "c" }),
          ];
        },
      ),
      halfway: api.figure(
        api.cartesian({ x: [0, 30, "분"], y: [0, 100, "°C"], static: "60°C까지 걸리는 시간을 끌어서 고르기" }),
        (m) => [
          api.axis("x", { label: "경과 시간" }),
          api.axis("y", { label: "온도" }),
          api.line(pts(31, (i) => [i, m.cool.s.at(i)[1]]), { id: "half-curve", tone: "series1" }),
          api.line([[0, 60], [30, 60]], { id: "line60", tone: "ref", dash: true }),
          api.dot([15, 60], { id: "drag-pt", tone: "series2", label: "여기를 끌기" }),
          api.dim([0, 50], [m.cool.t60, 50], `${m.cool.t60.toFixed(1)}분`, { id: "t60-dim" }),
        ],
      ),
      sketch: api.figure(
        api.cartesian({ x: [0, 60, "분"], y: [0, 100, "°C"], static: "온도 곡선을 그려 보는 빈 축" }),
        (m) => [
          api.axis("x", { label: "경과 시간" }),
          api.axis("y", { label: "온도" }),
          api.line(pts(61, (i) => [i, m.cool.s.at(i)[1]]), { id: "true-curve", tone: "series1" }),
        ],
      ),
      pair: api.split(["curve", "decay"], { link: "k" }),
      byk: api.multiples("decay", { over: { k: [0.05, 0.1, 0.2] } }),
    },
    sections: [
      {
        concept: { id: "rate", title: "온도차와 식는 속도", definition: "식는 속도는 실온과의 온도차에 비례한다", level: 2, leadsTo: ["balance"] },
        scenes: [
          { type: "hook", title: "식어 가는 커피", say: "갓 내린 커피는 처음 몇 분 동안 빠르게 식고, 실온에 가까워질수록 천천히 식는다.", figure: "curve", focus: ["temp", "now-trace"] },
          {
            type: "predict",
            title: "뚜껑을 덮으면",
            ask: "뚜껑을 덮으면 60°C까지 걸리는 시간은 어떻게 될까?",
            figure: "curve",
            focus: ["temp"],
            input: {
              kind: "choice",
              options: [
                { text: "두 배쯤 길어진다", correct: true, params: { lid: true } },
                { text: "그대로다", feedback: "뚜껑은 표면의 증발과 대류를 막아 식는 속도를 늦춘다." },
                { text: "절반으로 줄어든다", feedback: "뚜껑이 열을 더 빨리 빼앗지는 않는다. 오히려 막는다.", params: { k: 0.16 } },
              ],
            },
            reveal: { say: (m) => `이 조건에서는 60°C까지 약 ${m.cool.t60.toFixed(1)}분이 걸린다.`, marks: ["lid-curve"] },
            targets: "커피는 일정한 속도로 식는다",
          },
          { type: "define", term: "냉각 상수", definition: "냉각 상수 k는 온도차 1°C당 1분에 줄어드는 비율이다. 클수록 빨리 식는다.", figure: "decay", focus: ["ratio"] },
          { type: "explain", title: "로그 눈금에서는 직선", say: "온도차 비율을 로그 눈금에 그리면 기울기가 냉각 상수인 직선이 된다.", figure: "pair", focus: ["temp", "ratio"] },
          {
            type: "predict",
            title: "60°C가 되는 순간",
            ask: "90°C 커피가 60°C가 되는 시각에 점을 끌어다 놓아 보자.",
            figure: "halfway",
            focus: ["drag-pt"],
            input: { kind: "drag", mark: "drag-pt", axis: "x", answer: (m) => m.cool.t60, tol: 1 },
            reveal: { say: "약 7.3분. 처음 30°C는 금방 떨어진다.", marks: ["t60-dim"] },
          },
          {
            type: "quiz",
            items: [
              {
                kind: "choice",
                prompt: "로그-로그 그래프에서 컵이 클수록 60°C까지 시간은?",
                objective: "o3",
                figure: "sizes",
                options: [{ text: "길어진다", correct: true }, { text: "짧아진다", feedback: "부피에 비해 표면이 작아 열을 천천히 잃는다." }],
                reveal: { say: "반지름에 비례해 늘어난다(가정 값).", marks: ["mug-dot"] },
              },
              { kind: "numeric", prompt: "k = 0.1일 때 온도차가 절반이 되는 시간(분)은?", answer: 7, tol: 0.5, unit: "분", objective: "o2" },
              { kind: "numeric", prompt: "k = 0.1일 때 온도차가 1/4이 되는 시간(분)은?", answer: 14, tol: 0.5, unit: "분", objective: "o2" },
            ],
          },
        ],
      },
      {
        concept: { id: "balance", title: "실온에 다가가기", definition: "온도는 실온에 지수적으로 다가간다", level: 3, requires: ["rate"] },
        scenes: [
          {
            type: "steps",
            title: "한 걸음씩 계산하기",
            figure: "code",
            steps: [
              { say: "먼저 실온과의 온도차를 구한다.", focus: ["code"] },
              { say: "냉각 상수와 온도차를 곱해 변화량을 얻는다.", focus: ["code"] },
              { say: "변화량만큼 온도를 바꾸고 반복한다.", focus: ["code"] },
            ],
          },
          { type: "explain", title: "열이 빠져나가는 길", say: "열은 대부분 커피 표면에서 증발과 대류로 빠져나가고, 일부는 컵 벽을 통해 나간다.", figure: "cup", focus: ["heat-out", "surface"] },
          { type: "define", term: "열평형", definition: "커피와 공기의 온도가 같아지면 열평형이다. 그때부터 온도는 변하지 않는다.", focus: [] },
          {
            type: "predict",
            title: "곡선 그려 보기",
            ask: "90°C 커피의 한 시간 동안 온도 곡선을 그려 보자.",
            figure: "sketch",
            focus: ["true-curve"],
            input: { kind: "draw", x: [0, 60], answer: "true-curve", tol: 8 },
            reveal: { say: "처음엔 가파르고 점점 평평해지며 실온 22°C에 다가간다.", marks: ["true-curve"] },
          },
          {
            type: "explore",
            title: "빨리 식히기",
            say: "냉각 상수, 실온, 컵, 뚜껑을 바꿔 보고 점을 끌어 시각별 온도를 읽어 보자.",
            figure: "play",
            focus: ["probe", "target"],
            params: { cup: "머그", tx: 30 },
            knobs: { k: { range: [0.02, 0.4], log: true }, Ta: [10, 30, 1], cup: ["머그", "종이컵", "보온병"], lid: true, tx: [0, 60, 1] },
            handles: [{ mark: "probe", x: "tx" }],
            goal: { say: "5분 안에 60°C까지 떨어지게 해 보자.", done: (m) => m.cool.t60 < 5 },
          },
          { type: "compare", title: "뚜껑 없음과 덮음", say: "뚜껑을 덮으면 냉각 상수가 절반이 되어 곡선이 완만하다.", figure: "play", focus: ["play-curve"], a: { lid: false }, b: { lid: true }, labels: ["뚜껑 없음", "뚜껑 덮음"] },
          { type: "explain", title: "마지막 20분 확대", say: "시간이 지나면 열평형에 가까워져 곡선이 거의 평평해진다.", figure: "camera", focus: ["cam-line"] },
          { type: "explain", title: "김은 식는 속도의 신호", say: "김이 많을수록 증발로 잃는 열이 크다. 냉각 상수가 큰 상태다.", figure: "steam", focus: ["steam"] },
          { type: "explain", title: "냉각 상수 비교", say: "냉각 상수가 두 배면 같은 비율까지 걸리는 시간은 절반이다.", figure: "byk", focus: ["ratio"] },
          {
            type: "quiz",
            items: [
              {
                kind: "choice",
                prompt: "반로그 그래프의 기울기가 가팔라지면?",
                objective: "o2",
                figure: "decay",
                options: [{ text: "냉각 상수가 커진다", correct: true }, { text: "실온이 올라간다", feedback: "실온은 비율 그래프의 기울기를 바꾸지 않는다." }],
                reveal: { marks: ["half-dot"] },
              },
            ],
          },
        ],
      },
    ],
    quiz: [
      { kind: "choice", prompt: "보온병에 담은 커피가 오래 따뜻한 이유는?", objective: "o3", transfer: true, options: [{ text: "냉각 상수가 아주 작다", correct: true }, { text: "처음 온도가 더 높다", feedback: "같은 온도에서 시작해도 보온병이 훨씬 천천히 식는다." }] },
      { kind: "numeric", prompt: "실온 22°C, k = 0.08일 때 90°C에서 60°C까지(분)?", answer: { check: "t60" }, tol: 0.5, unit: "분", objective: "o2" },
      { kind: "order", prompt: "한 번의 계산 순서", items: ["온도차 계산", "변화량 계산", "온도 갱신"], objective: "o2" },
      {
        kind: "classify",
        prompt: "빨리 식는 경우와 천천히 식는 경우",
        bins: ["빨리", "천천히"],
        items: [{ text: "얇은 종이컵", bin: "빨리" }, { text: "뚜껑 덮은 보온병", bin: "천천히" }, { text: (m) => `냄비 한가득(가정 ${m.cups.minutes.toFixed(1)}분 기준보다 큼)`, bin: "천천히" }],
        objective: "o3",
      },
    ],
    summary: { figures: ["curve", "decay", "cup"], say: (m) => `90°C 커피는 약 ${m.cool.t60.toFixed(1)}분 만에 60°C가 되고, 그 뒤로는 점점 천천히 식는다.` },
  });
};
