// QR-1 fixture: geo (equalEarth world, mercator east-asia, equalEarth indian-ocean), cells with values/text, mock browser/phone; dense city labels.
/** @type {import("ltt").LessonFactory} */
export default (api) => {
  /** @type {Record<string, [number, number]>} */
  const city = {
    서울: [126.98, 37.57], 부산: [129.07, 35.18], 상하이: [121.47, 31.23], 도쿄: [139.69, 35.69],
    타이베이: [121.56, 25.03], 홍콩: [114.17, 22.32], 싱가포르: [103.82, 1.35], 로테르담: [4.48, 51.92], 로스앤젤레스: [-118.24, 34.05],
  };
  const waits = [
    [3, 4, 6, 9, 12, 8, 5],
    [2, 3, 5, 7, 10, 9, 6],
    [1, 2, 4, 6, 8, 7, 4],
    [1, 1, 2, 4, 5, 4, 2],
    [0, 1, 1, 2, 3, 2, 1],
  ];
  return api.lesson({
    meta: {
      title: "항구가 막히면 왜 물건값이 오를까",
      objectives: [
        { id: "o1", text: "주요 항로와 항구를 지도에서 찾는다" },
        { id: "o2", text: "선박 대기 일수가 운임에 주는 영향을 설명한다" },
      ],
      learner: { knows: ["수출과 수입"], misconceptions: ["배는 항구에 도착하면 바로 짐을 내린다"] },
      domains: ["economics", "geography"],
    },
    glossary: { 체선: "배가 항구에 도착하고도 부두가 비지 않아 바다에서 기다리는 일" },
    checks: [
      { model: "port", expect: { peak: 12 }, tol: 0 },
      { model: "port", at: { surcharge: 0 }, expect: { fee: 1000 }, tol: 1e-9, limit: "할증 0이면 기본 운임", source: "가정 운임표" },
    ],
    models: {
      port: api.model(
        { surcharge: 50, week: 0 },
        (p) => {
          const peak = Math.max(...waits.flat());
          return { peak, fee: 1000 + p.surcharge * waits[0][Math.min(6, Math.max(0, Math.round(p.week)))], wait: waits[0][Math.min(6, Math.max(0, Math.round(p.week)))] };
        },
        { illustrative: true },
      ),
    },
    figures: {
      world: api.figure(
        api.geo({ projection: "equalEarth", static: "세계 주요 컨테이너 항로" }),
        () => [
          api.line([city.서울, city.로스앤젤레스], { id: "pacific", tone: "series1", label: "태평양 항로" }),
          api.arrow(city.싱가포르, city.로테르담, { id: "suez", tone: "series2", label: "수에즈 경유" }),
          ...Object.entries(city).map(([name, at]) => api.dot(at, { id: `dot-${name}`, tone: "series3", label: name })),
        ],
      ),
      asia: api.figure(
        api.geo({ projection: "mercator", region: "east-asia", static: "동아시아 항구가 몰려 있는 모습" }),
        () => [
          ...["서울", "부산", "상하이", "도쿄", "타이베이", "홍콩"].map((name) => api.label(city[name], name, { id: `lab-${name}` })),
          ...["서울", "부산", "상하이", "도쿄", "타이베이", "홍콩"].map((name) => api.dot(city[name], { id: `pin-${name}`, tone: "series1" })),
          api.path([["M", ...city.부산], ["L", ...city.상하이], ["L", ...city.홍콩]], { id: "coast-route", tone: "series2", dash: true }),
        ],
      ),
      ocean: api.figure(
        api.geo({ projection: "equalEarth", region: "indian-ocean", idle: { ms: 3000 } }),
        (m, t) => [
          api.flow([city.싱가포르, [80, 5], [55, 12], [43, 12.5]], { id: "ships", n: 8, rate: 0.3, seed: 11, t, tone: "series1" }),
          api.dot(city.싱가포르, { id: "sg", tone: "series2", label: "싱가포르" }),
          api.label([43, 12.5], "홍해 입구", { id: "red-sea", anchor: "w" }),
        ],
      ),
      heat: api.figure(
        api.cells({ cols: 7, rows: 5, static: "항구별 주차별 평균 대기 일수" }),
        (m, t, { params }) => {
          const show = params.numbers !== false;
          return waits.flatMap((row, r) => row.map((v, c) => api.cell(c, r, { id: `c${c}-${r}`, value: v, text: show ? String(v) : undefined })));
        },
      ),
      weeks: api.figure(
        api.cells({ cols: 7, rows: 1, steps: ["1주", "4주", "7주"] }),
        (m, t, { step }) => [0, 1, 2, 3, 4, 5, 6].map((c) => api.cell(c, 0, { id: `w${c}`, value: c === [0, 3, 6][step] ? 1 : 0, text: `${c + 1}주` })),
      ),
      dash: api.figure(
        api.cartesian({ x: [0, 10, ""], y: [0, 10, ""], static: "물류 회사 대시보드 화면" }),
        (m) => [
          api.mock("browser", [[1, 1], [9, 8]], [
            api.rect([1.5, 5], [8.5, 7.5], { id: "banner", tone: "warn", fill: "soft" }),
            api.label([2, 6.2], `부산항 대기 ${m.port.wait}일`, { id: "banner-text", anchor: "e" }),
            api.rect([0, 1.5], [5, 4], { id: "overflow-box", tone: "series1", fill: "soft" }),
            api.label([6.5, 2.5], `운임 ${m.port.fee}달러`, { id: "fee-text" }),
          ], { id: "browser", title: "logistics.example.com" }),
        ],
      ),
      phone: api.figure(
        api.cartesian({ x: [0, 10, ""], y: [0, 10, ""], static: "선사 알림 앱 화면" }),
        () => [
          api.mock("phone", [[3, 1], [7, 9]], [
            api.label([5, 7], "입항 지연 알림", { id: "push-title", anchor: "c" }),
            api.label([5, 5], "3일 대기 예정", { id: "push-body", anchor: "c" }),
          ], { id: "phone-mock" }),
        ],
      ),
    },
    sections: [
      {
        concept: { id: "routes", title: "항로와 항구", definition: "컨테이너는 몇 개의 큰 항로로 오간다", level: 1, leadsTo: ["wait"] },
        scenes: [
          { type: "hook", title: "바다 위의 고속도로", say: "컨테이너선은 몇 개의 큰 항로를 따라 세계를 오간다.", figure: "world", focus: ["pacific", "suez"] },
          { type: "explain", title: "동아시아에 몰린 항구", say: "세계 10대 항구 중 여러 곳이 동아시아 해안에 몰려 있다.", figure: "asia", focus: ["pin-부산", "pin-상하이"] },
          { type: "explain", title: "인도양을 건너는 배", say: "싱가포르를 떠난 배는 인도양을 건너 홍해로 향한다.", figure: "ocean", focus: ["ships"] },
          {
            type: "quiz",
            items: [
              { kind: "choice", prompt: "부산에서 가장 가까운 항구는?", objective: "o1", figure: "asia", options: [{ text: "상하이", correct: true }, { text: "홍콩", feedback: "홍콩은 더 남쪽이다." }], reveal: { marks: ["coast-route"] } },
            ],
          },
        ],
      },
      {
        concept: { id: "wait", title: "대기와 운임", definition: "배가 오래 기다릴수록 운임이 오른다", level: 2, requires: ["routes"] },
        scenes: [
          {
            type: "predict",
            title: "배가 도착하면",
            ask: "부두가 꽉 찬 항구에 배가 도착하면 어떻게 될까?",
            figure: "heat",
            focus: ["c4-0"],
            input: { kind: "choice", options: [{ text: "바다에서 며칠씩 기다린다", correct: true }, { text: "바로 짐을 내린다", feedback: "부두가 비어야 짐을 내릴 수 있다." }] },
            reveal: { say: "가장 붐비는 주에는 12일까지 기다렸다(가정 값).", marks: ["c4-1"] },
            targets: "배는 항구에 도착하면 바로 짐을 내린다",
          },
          { type: "define", term: "체선", definition: "체선은 배가 부두를 기다리며 바다에 머무는 일이다.", figure: "heat", focus: ["c4-0"] },
          {
            type: "explore",
            title: "주별 체선과 운임",
            say: "주를 바꿔 체선 일수와 운임을 보자. 숫자 표시를 끌 수도 있다.",
            figure: "heat",
            focus: ["c4-0"],
            params: { numbers: true },
            knobs: { week: [0, 6, 1], numbers: true, surcharge: [0, 100, 10] },
            goal: { say: "운임이 1,500달러를 넘는 주를 찾아보자.", done: (m) => m.port.fee > 1500 },
          },
          { type: "explain", title: "대시보드로 보는 체선", say: "물류 회사는 체선 일수와 운임을 한 화면에서 본다.", figure: "dash", focus: ["banner", "browser"] },
          { type: "explain", title: "알림 앱", say: "선사는 체선이 길어지면 화주에게 알림을 보낸다.", figure: "phone", focus: ["push-title"] },
          {
            type: "steps",
            title: "가장 붐빈 주 찾기",
            figure: "weeks",
            steps: [
              { say: "1주에는 비교적 한산하다.", focus: ["w0"] },
              { say: "4주에 체선이 늘기 시작한다.", focus: ["w3"] },
              { say: "7주에는 다시 줄어든다.", focus: ["w6"] },
            ],
          },
          { type: "quiz", items: [{ kind: "numeric", prompt: "할증 50달러/일, 대기 12일이면 할증 합계(달러)?", answer: 600, tol: 1, unit: "달러", objective: "o2" }] },
        ],
      },
    ],
    quiz: [
      { kind: "choice", prompt: "수에즈 운하가 막히면 아시아-유럽 배는?", objective: "o1", transfer: true, options: [{ text: "아프리카를 돌아간다", correct: true }, { text: "태평양을 건넌다", feedback: "태평양은 반대 방향이다." }] },
      { kind: "numeric", prompt: "기본 운임 1,000달러, 할증 50달러/일, 대기 5일이면 운임(달러)?", answer: 1250, tol: 1, unit: "달러", objective: "o2" },
      { kind: "order", prompt: "북쪽에서 남쪽 순서", items: ["서울", "부산", "상하이", "홍콩"], objective: "o1" },
      { kind: "classify", prompt: "항구가 있는 바다", bins: ["태평양", "인도양"], items: [{ text: "부산", bin: "태평양" }, { text: "콜롬보", bin: "인도양" }, { text: "로스앤젤레스", bin: "태평양" }], objective: "o1" },
    ],
    summary: { figures: ["world", "heat"], say: "항구가 막히면 배가 기다리고, 기다린 날만큼 운임이 오른다." },
  });
};
