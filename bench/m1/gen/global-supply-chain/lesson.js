/** @type {import("ltt").LessonFactory} */
export default (api) => {
  /** @param {{ dSuez: number; dCape: number; kn: number; portDays: number }} p */
  const voyage = ({ dSuez, dCape, kn, portDays }) => {
    const suezDays = dSuez / (kn * 24);
    const capeDays = dCape / (kn * 24);
    const rtSuez = 2 * suezDays + portDays;
    const rtCape = 2 * capeDays + portDays;
    return { suezDays, capeDays, rtSuez, rtCape, shipsSuez: Math.ceil(rtSuez / 7), shipsCape: Math.ceil(rtCape / 7) };
  };
  const V = voyage({ dSuez: 10500, dCape: 13800, kn: 16, portDays: 12 });
  /** @param {number} share @param {number} base @param {number} u0 @param {number} k */
  const rateAt = (share, base, u0, k) => {
    const stretch = 1 + share * (V.rtCape / V.rtSuez - 1);
    const u = u0 * stretch;
    return { u, rate: base * Math.exp(k * (u - u0)) };
  };
  /** @param {number} L @param {number} p */
  const amp = (L, p) => 1 + (2 * L) / p + (2 * L * L) / (p * p);
  const modeNames = ["해상", "철도", "트럭", "항공"];

  return api.lesson({
    meta: {
      title: "홍해·파나마가 막히면 왜 납기와 운임이 같이 뛸까",
      objectives: [
        { id: "o1", text: "운송 수단별 단가 차이와 해상 운송의 비중을 설명한다" },
        { id: "o2", text: "주요 항로가 hub 항만과 chokepoint로 연결된 구조를 지도에서 읽는다" },
        { id: "o3", text: "우회 거리가 선박 회전율을 떨어뜨려 공급 능력과 운임에 주는 영향을 계산한다" },
        { id: "o4", text: "리드타임 증가가 bullwhip 효과와 안전재고를 키우는 이유를 설명한다" },
      ],
      learner: {
        knows: ["컨테이너(TEU·FEU)와 선적 서류", "조달 실무 2년차", "운송 수단별 비중과 단가는 애매함"],
        misconceptions: ["수에즈가 막혀도 희망봉으로 돌면 며칠 늦을 뿐 운임은 크게 오르지 않는다"],
      },
      domains: ["logistics", "procurement"],
    },
    glossary: {
      "hub 항만": "여러 지선(feeder) 항만의 화물을 모아 대형 간선 선박에 옮겨 싣는 환적 거점 항만",
      chokepoint: "대체 경로가 멀어 여러 주요 항로가 한꺼번에 지나야 하는 좁은 해협이나 운하",
      "선박 회전율": "한 선박이 일정 기간에 왕복 항해를 몇 번 하는지. 왕복일이 길수록 낮다",
      "bullwhip 효과": "공급망 상류로 갈수록 주문량 변동이 소비 수요 변동보다 커지는 현상",
    },
    checks: [
      { id: "suez-days", model: "voyage", value: (o) => o.suezDays, expect: 27.34, tol: 0.01 },
      { id: "ships-suez", model: "voyage", value: (o) => o.shipsSuez, expect: 10, tol: 0 },
      { id: "ships-cape", model: "voyage", value: (o) => o.shipsCape, expect: 12, tol: 0 },
      {
        model: "voyage",
        at: { dCape: 10500 },
        value: (o) => o.shipsCape - o.shipsSuez,
        expect: 0,
        tol: 0,
        limit: "우회 거리가 0이면 필요 선박 수가 같다",
        source: "항해일 = 거리/(속력×24)",
      },
      { id: "rate-full", model: "rates", at: { share: 1 }, expect: { rate: [5400, 5800] } },
      { model: "rates", value: (o) => o.rate, expect: 1500, tol: 0.5 },
      { id: "amp4", model: "bull", value: (o) => o.A, expect: 2.5, tol: 0.001 },
      { model: "bull", at: { L: 6 }, value: (o) => o.A, expect: 3.625, tol: 0.001 },
      {
        model: "bull",
        at: { L: 0 },
        value: (o) => o.A,
        expect: 1,
        tol: 1e-9,
        limit: "리드타임 0이면 주문 변동 = 수요 변동",
        source: "Chen, Drezner, Ryan & Simchi-Levi (2000), Management Science 46(3)",
      },
      { id: "ss5", model: "safety", value: (o) => o.ss, expect: 368.9, tol: 0.2 },
      { model: "safety", at: { L: 7.5 }, value: (o) => o.ss, expect: 451.9, tol: 0.2 },
      {
        model: "safety",
        at: { L: 0 },
        value: (o) => o.ss,
        expect: 0,
        tol: 1e-9,
        limit: "리드타임 0이면 안전재고 0",
        source: "SS = z·σ·√L (Silver, Pyke & Peterson)",
      },
      { model: "modes", value: (o) => o.cost[3] / o.cost[0], expect: { gt: 50 } },
    ],
    models: {
      voyage: api.model({ dSuez: 10500, dCape: 13800, kn: 16, portDays: 12 }, voyage, "항해일 = 거리/(노트×24), 주간 서비스 선박 수 = ceil(왕복일/7)"),
      rates: api.model(
        { share: 0, base: 1500, u0: 0.85, k: 6 },
        ({ share, base, u0, k }) => rateAt(share, base, u0, k),
        { illustrative: true },
      ),
      bull: api.model({ L: 4, p: 8 }, ({ L, p }) => ({ A: amp(L, p) }), "Var(q)/Var(D) = 1 + 2L/p + 2L²/p² (Chen et al. 2000)"),
      safety: api.model({ z: 1.65, sigma: 100, L: 5 }, ({ z, sigma, L }) => ({ ss: z * sigma * Math.sqrt(L) }), "SS = z·σ·√L"),
      modes: api.model({ k: 1 }, ({ k }) => ({ cost: [0.005, 0.03, 0.1, 0.8].map((c) => c * k), share: [80, 8, 10, 0.3] }), { illustrative: true }),
    },
    figures: {
      modes: api.figure(
        api.cartesian({ x: [-0.6, 3.6, ""], y: [0.001, 3, "$/t·km"], log: "y", static: "운송 수단별 톤·km당 단가 막대(가정 값)" }),
        (m) => [
          api.axis("y", { label: "단가" }),
          ...modeNames.map((n, i) =>
            api.rect([i - 0.3, 0.001], [i + 0.3, m.modes.cost[i]], { id: `mode-${i}`, tone: i === 0 ? "good" : "muted", fill: "solid", label: n }),
          ),
        ],
      ),
      hubs: api.figure(
        api.graph({ layout: "layered", direction: "down", static: "지선 항만 → 환적 거점 → 간선 → 환적 거점 → 지선 항만" }),
        () => [
          api.node("incheon", "인천"),
          api.node("haiphong", "하이퐁"),
          api.node("sg", "싱가포르", { shape: "round" }),
          api.node("rtm", "로테르담", { shape: "round" }),
          api.node("gdansk", "그단스크"),
          api.edge("incheon", "sg", { id: "f1", directed: true }),
          api.edge("haiphong", "sg", { id: "f2", directed: true }),
          api.edge("sg", "rtm", { id: "main", directed: true, text: "2만 TEU급", weight: "bold", tone: "series1" }),
          api.edge("rtm", "gdansk", { id: "f4", directed: true }),
        ],
      ),
      map: api.figure(
        api.geo({ projection: "equalEarth", region: "world", static: "아시아–유럽 항로: 수에즈 경유와 희망봉 우회" }),
        () => [
          api.line(
            [[121.5, 31.2], [114, 20], [106, 5], [103.8, 1.3], [95, 6], [80, 6], [60, 13], [50, 12.5], [43.4, 12.6], [38, 20], [33, 28], [32.5, 30.5], [25, 34], [12, 37], [-6, 36], [-10, 40], [-5, 48], [4.5, 51.9]],
            { id: "suez", tone: "series1", weight: "bold", label: "수에즈 경유" },
          ),
          api.line(
            [[103.8, 1.3], [80, -5], [50, -25], [30, -36], [18.5, -35], [10, -20], [-15, 0], [-20, 20], [-12, 38], [-5, 48], [4.5, 51.9]],
            { id: "cape", tone: "series2", dash: true, weight: "bold", label: "희망봉 우회" },
          ),
          api.dot([121.5, 31.2], { id: "sha", label: "상하이" }),
          api.dot([103.8, 1.3], { id: "sin", label: "싱가포르" }),
          api.dot([4.5, 51.9], { id: "rot", label: "로테르담" }),
        ],
      ),
      choke: api.figure(
        api.geo({ projection: "equalEarth", region: "world", steps: ["말라카", "바브엘만데브", "수에즈", "파나마"] }),
        (m, t, { step }) => {
          const pts = /** @type {[number, number][]} */ ([[101, 2.5], [43.4, 12.6], [32.5, 30], [-79.6, 9]]);
          const names = ["말라카 해협", "바브엘만데브", "수에즈 운하", "파나마 운하"];
          return [
            api.line([[121.5, 31.2], [106, 5], [101, 2.5], [80, 6], [43.4, 12.6], [32.5, 30], [12, 37], [-6, 36], [4.5, 51.9]], { id: "ae", tone: "muted" }),
            api.line([[-74, 40.7], [-75, 25], [-79.6, 9], [-95, 12], [-118, 33.7]], { id: "pan-route", tone: "muted" }),
            ...pts.map((p, i) => api.dot(p, { id: `cp-${i}`, tone: i === step ? "warn" : "ref", size: i === step ? "l" : "s", label: i === step ? names[i] : undefined })),
          ];
        },
      ),
      voyage: api.figure(
        api.cartesian({ x: [-0.6, 1.6, ""], y: [0, 100, "일"], static: "수에즈·희망봉 왕복일과 필요 선박 수" }),
        (m) => [
          api.axis("y", { label: "왕복일" }),
          api.rect([-0.3, 0], [0.3, m.voyage.rtSuez], { id: "rt-suez", tone: "series1", fill: "solid", label: (o) => `수에즈 ${o.voyage.rtSuez.toFixed(0)}일 · ${o.voyage.shipsSuez}척` }),
          api.rect([0.7, 0], [1.3, m.voyage.rtCape], { id: "rt-cape", tone: "series2", fill: "solid", label: (o) => `희망봉 ${o.voyage.rtCape.toFixed(0)}일 · ${o.voyage.shipsCape}척` }),
        ],
      ),
      rates: api.figure(
        api.cartesian({ x: [0, 100, "%"], y: [0, 6500, "$/FEU"], static: "우회 비율에 따른 운임(가정 모델)" }),
        (m, t, { params }) => {
          const pts = Array.from({ length: 21 }, (_, i) => /** @type {[number, number]} */ ([i * 5, rateAt(i / 20, 1500, 0.85, 6).rate]));
          return [
            api.axis("x", { label: "우회 선박 비율" }),
            api.axis("y", { label: "운임" }),
            api.line(pts, { id: "rate-curve", tone: "series1", curve: "smooth" }),
            api.dot([Number(params.share) * 100, m.rates.rate], { id: "rate-now", tone: "warn", label: (o) => `$${o.rates.rate.toFixed(0)}` }),
          ];
        },
      ),
      bull: api.figure(
        api.cartesian({ x: [-0.6, 3.6, ""], y: [1, 200, "배"], log: "y", static: "공급망 단계별 주문 변동 배율" }),
        (m) => {
          const names = ["소비자", "소매", "도매", "수입사"];
          return [
            api.axis("y", { label: "변동 배율" }),
            ...names.map((n, i) => api.rect([i - 0.3, 1], [i + 0.3, Math.max(1.05, m.bull.A ** i)], { id: `st-${i}`, tone: i === 3 ? "warn" : "series1", fill: "solid", label: n })),
          ];
        },
      ),
      safety: api.figure(
        api.cartesian({ x: [0, 10, "주"], y: [0, 600, "개"], static: "리드타임과 안전재고(z 1.65, σ 주 100개 가정)" }),
        (m) => {
          const pts = Array.from({ length: 41 }, (_, i) => /** @type {[number, number]} */ ([i / 4, 165 * Math.sqrt(i / 4)]));
          return [
            api.axis("x", { label: "리드타임" }),
            api.axis("y", { label: "안전재고" }),
            api.line(pts, { id: "ss-curve", tone: "series1" }),
            api.dot([5, 165 * Math.sqrt(5)], { id: "ss-suez", tone: "ref", label: "수에즈 5주" }),
            api.dot([7.5, 165 * Math.sqrt(7.5)], { id: "ss-cape", tone: "warn", label: "우회 7.5주" }),
          ];
        },
      ),
    },
    sections: [
      {
        concept: { id: "mode-hub", title: "운송 수단과 환적 거점", definition: "무역 물동량 대부분은 바다로, 큰 거점 항만을 거쳐 움직인다", level: 2, leadsTo: ["choke"] },
        scenes: [
          { type: "hook", title: "상하이에서 로테르담까지", say: "내 원자재 컨테이너는 이 굵은 선을 따라 온다. 그런데 이 선이 막히면?", figure: "map", focus: ["suez", "sha", "rot"] },
          {
            type: "predict",
            title: "톤·km당 단가",
            ask: "같은 1톤을 1 km 옮길 때 항공은 해상의 대략 몇 배일까?",
            figure: "modes",
            focus: ["mode-0", "mode-3"],
            input: {
              kind: "choice",
              options: [
                { text: "2–3배", feedback: "항공은 연료와 기체 비용이 커서 수십 배 이상 비싸다." },
                { text: "약 10배", feedback: "그보다 훨씬 크다. 가정 값으로도 100배 넘게 차이 난다." },
                { text: "100배 넘게", correct: true },
              ],
            },
            reveal: { say: (m) => `가정 값(해상 $${m.modes.cost[0]}, 항공 $${m.modes.cost[3]}/t·km)으로 ${(m.modes.cost[3] / m.modes.cost[0]).toFixed(0)}배. 그래서 원자재는 거의 다 배로 온다(물동량 약 80%라는 UNCTAD 인용치, 대략값).` },
          },
          { type: "define", term: "hub 항만", definition: "인천·하이퐁 같은 지선 항만 화물을 싱가포르에 모아 2만 TEU급 간선 선박에 싣는다. 로테르담에서 다시 나눈다.", figure: "hubs", focus: ["sg", "rtm", "main"] },
          { type: "explain", title: "간선은 소수의 대형선", say: "간선 한 노선에 큰 배가 몰려 있어서, 그 길이 막히면 지선 화물까지 함께 묶인다.", figure: "hubs", focus: ["main", "f1", "f4"] },
          {
            type: "quiz",
            items: [
              {
                kind: "choice",
                prompt: "하이퐁에서 그단스크로 가는 컨테이너가 보통 거치는 곳은?",
                objective: "o2",
                options: [
                  { text: "싱가포르와 로테르담에서 환적", correct: true },
                  { text: "하이퐁에서 그단스크로 직항", feedback: "작은 항만끼리는 물량이 적어 직항 간선이 드물다." },
                ],
              },
            ],
          },
        ],
      },
      {
        concept: { id: "choke", title: "해협·운하 병목", definition: "여러 간선이 좁은 해협·운하를 지나며, 막히면 먼 우회로밖에 없다", level: 3, requires: ["mode-hub"], leadsTo: ["turn"] },
        scenes: [
          {
            type: "predict",
            title: "수에즈가 막히면",
            ask: "아시아–유럽 배가 희망봉으로 돌면 운임은 어떻게 될까?",
            figure: "map",
            focus: ["suez", "cape"],
            input: {
              kind: "choice",
              options: [
                { text: "며칠 늦을 뿐 운임은 거의 그대로", feedback: "늦어지는 동안 배가 묶여 노선의 공급 능력이 줄어든다. 공급이 줄면 운임이 뛴다." },
                { text: "연료비만큼 10–20% 오른다", feedback: "연료비보다 큰 원인은 배가 부족해지는 것이다." },
                { text: "몇 배로 뛸 수 있다", correct: true },
              ],
            },
            reveal: { say: "편도 약 3,300해리(대략값)가 늘어 왕복 2주 넘게 길어진다. 같은 배로 실을 수 있는 양이 줄어 2024년 초 아시아–유럽 운임은 몇 배로 뛰었다.", marks: ["cape"] },
            targets: "수에즈가 막혀도 희망봉으로 돌면 며칠 늦을 뿐 운임은 크게 오르지 않는다",
          },
          { type: "define", term: "chokepoint", definition: "말라카·바브엘만데브·수에즈·파나마처럼 여러 간선이 한꺼번에 지나는 좁은 길. 대체로가 멀다.", figure: "choke", focus: ["cp-0", "cp-1", "cp-2", "cp-3"] },
          {
            type: "steps",
            title: "네 곳의 chokepoint",
            figure: "choke",
            steps: [
              { say: "말라카: 동아시아와 인도양을 잇는다.", focus: ["cp-0", "ae"] },
              { say: "바브엘만데브: 홍해 입구. 2023년 말 선박 공격 뒤 많은 선사가 피했다.", focus: ["cp-1", "ae"] },
              { say: "수에즈: 막히면 희망봉으로 돌아야 한다.", focus: ["cp-2", "ae"] },
              { say: "파나마: 2023년 가뭄으로 수위가 낮아 통과 척수를 줄였다.", focus: ["cp-3", "pan-route"] },
            ],
          },
          {
            type: "quiz",
            items: [
              {
                kind: "choice",
                prompt: "홍해 공격이 수에즈 운하 자체가 열려 있어도 문제인 이유는?",
                objective: "o2",
                options: [
                  { text: "수에즈로 가려면 바브엘만데브를 지나야 해서", correct: true },
                  { text: "운하 통행료가 올라서", feedback: "통행료보다 홍해 입구 안전이 문제다. 길이 이어져 있다." },
                ],
              },
            ],
          },
        ],
      },
      {
        concept: { id: "turn", title: "회전율과 운임", definition: "왕복일이 늘면 같은 배로 실을 수 있는 양이 줄어 운임이 오른다", level: 4, requires: ["choke"], leadsTo: ["bull"] },
        scenes: [
          {
            type: "predict",
            title: "주 1회 서비스에 필요한 배",
            ask: "매주 한 척씩 출항하는 노선은 왕복일 ÷ 7만큼 배가 필요하다. 희망봉 우회 때 필요한 배는?",
            figure: "voyage",
            focus: ["rt-suez"],
            input: {
              kind: "choice",
              options: [
                { text: "같다", feedback: "왕복이 길어지면 같은 주기를 지키려고 배가 더 필요하다." },
                { text: "약 20% 더", correct: true },
                { text: "두 배", feedback: "거리는 약 30%만 늘고 항만 체류일은 그대로다." },
              ],
            },
            reveal: { say: (m) => `16노트, 항만 12일 가정에서 ${m.voyage.shipsSuez}척 → ${m.voyage.shipsCape}척. 업계 전체에서 배 20%가 사라진 것과 같다.`, marks: ["rt-cape"] },
          },
          { type: "define", term: "선박 회전율", definition: (m) => `왕복일이 ${m.voyage.rtSuez.toFixed(0)}일에서 ${m.voyage.rtCape.toFixed(0)}일로 늘면 한 배가 1년에 도는 횟수가 줄어든다.`, figure: "voyage", focus: ["rt-suez", "rt-cape"] },
          {
            type: "explore",
            title: "우회 비율과 운임",
            say: "가정 모델(기준 $1,500/FEU, 가동률 85%)이다. 가동률이 100%에 가까워지면 운임이 가파르게 오른다.",
            figure: "rates",
            focus: ["rate-curve", "rate-now"],
            knobs: { share: [0, 1, 0.05] },
            goal: { say: "운임이 기준의 2배를 넘는 우회 비율을 찾아보자.", done: (m) => m.rates.rate > 3000 },
          },
          {
            type: "quiz",
            items: [
              {
                kind: "numeric",
                prompt: "16노트로 10,500해리(대략값)를 가면 편도 며칠인가?",
                answer: { check: "suez-days" },
                tol: 0.5,
                unit: "일",
                objective: "o3",
              },
            ],
          },
        ],
      },
      {
        concept: { id: "bull", title: "bullwhip과 재고 완충", definition: "리드타임이 길수록 상류 주문 변동과 필요한 안전재고가 커진다", level: 5, requires: ["turn"] },
        scenes: [
          {
            type: "predict",
            title: "소비는 조금 출렁였는데",
            ask: "소비자 수요가 조금 흔들릴 때, 맨 위 수입사의 주문량 변동은?",
            figure: "bull",
            focus: ["st-0"],
            input: {
              kind: "choice",
              options: [
                { text: "소비자와 비슷", feedback: "각 단계가 리드타임 동안 예측하며 주문해서 변동이 단계마다 불어난다." },
                { text: "단계마다 커진다", correct: true },
              ],
            },
            reveal: { say: (m) => `리드타임 4주, 예측 8주 평균에서 단계마다 ${m.bull.A.toFixed(1)}배, 수입사는 ${(m.bull.A ** 3).toFixed(0)}배다.`, marks: ["st-3"] },
          },
          { type: "define", term: "bullwhip 효과", definition: "채찍 끝처럼, 소비 쪽 작은 흔들림이 공급망 상류로 갈수록 큰 주문 변동이 된다.", figure: "bull", focus: ["st-0", "st-3"] },
          {
            type: "explore",
            title: "리드타임을 늘려 보기",
            say: "Var(q)/Var(D) = 1 + 2L/p + 2L²/p² (Chen 외 2000, 모든 단계 같은 L로 가정).",
            figure: "bull",
            focus: ["st-3"],
            knobs: { L: [0, 8, 0.5] },
            goal: { say: "수입사 변동이 30배를 넘게 해 보자.", done: (m) => m.bull.A ** 3 > 30 },
          },
          { type: "explain", title: "안전재고는 √L로 늘어난다", say: (m) => `SS = z·σ·√L. 리드타임 5주에서 7.5주가 되면 안전재고는 약 ${m.safety.ss.toFixed(0)}개에서 452개로 는다(z 1.65, σ 주 100개 가정).`, figure: "safety", focus: ["ss-curve", "ss-suez", "ss-cape"] },
          {
            type: "quiz",
            items: [
              {
                kind: "choice",
                prompt: "리드타임이 4배가 되면 안전재고는?",
                objective: "o4",
                options: [
                  { text: "2배", correct: true },
                  { text: "4배", feedback: "안전재고는 √L에 비례한다. √4 = 2." },
                ],
              },
            ],
          },
        ],
      },
    ],
    quiz: [
      {
        kind: "choice",
        prompt: "파나마 운하 통과 척수가 줄어 미국 동부–아시아 배가 수에즈로 돈다. 미국 동부발 조달에서 먼저 볼 것은?",
        objective: "o3",
        transfer: true,
        options: [
          { text: "왕복일이 늘어 선복이 부족해지고 운임·리드타임이 함께 오른다", correct: true },
          { text: "거리만 조금 늘어 영향이 없다", feedback: "거리 증가는 회전율을 낮춰 공급 능력을 줄인다." },
          { text: "운임만 오르고 재고는 그대로 둬도 된다", feedback: "리드타임이 늘면 안전재고도 √L로 늘려야 한다." },
        ],
      },
      { kind: "numeric", prompt: "리드타임 4주, p 8주일 때 한 단계의 변동 배율은?", answer: { check: "amp4" }, tol: 0.05, unit: "배", objective: "o4" },
      { kind: "order", prompt: "홍해 사태가 내 재고에 닿는 순서", items: ["바브엘만데브 회피", "희망봉 우회", "회전율 하락·선복 부족", "운임과 리드타임 상승", "안전재고 증가"], objective: "o3" },
      {
        kind: "classify",
        prompt: "chokepoint인 것과 hub 항만인 것",
        bins: ["chokepoint", "hub 항만"],
        items: [{ text: "말라카 해협", bin: "chokepoint" }, { text: "싱가포르", bin: "hub 항만" }, { text: "파나마 운하", bin: "chokepoint" }, { text: "로테르담", bin: "hub 항만" }],
        objective: "o2",
      },
      { kind: "choice", prompt: "항공 대신 해상을 쓰는 가장 큰 이유는?", objective: "o1", options: [{ text: "톤·km당 단가가 훨씬 싸서", correct: true }, { text: "더 빨라서", feedback: "항공이 훨씬 빠르다. 해상의 장점은 단가다." }] },
    ],
    summary: {
      figures: ["map", "voyage", "rates", "safety"],
      say: (m) => `우회는 며칠의 문제가 아니다. 왕복이 ${m.voyage.rtSuez.toFixed(0)}일→${m.voyage.rtCape.toFixed(0)}일로 늘면 배가 약 20% 모자라고, 운임과 리드타임이 함께 오르며, 그만큼 재고 완충이 필요하다.`,
    },
  });
};
