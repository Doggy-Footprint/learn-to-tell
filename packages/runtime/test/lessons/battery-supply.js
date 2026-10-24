// QR-1 fixture: graph frame (layered down/right, tree, some nodes pinned with at, union layout over a loop), node, edge with text.
/** @type {import("ltt").LessonFactory} */
export default (api) => {
  return api.lesson({
    meta: {
      title: "배터리 한 개가 차에 실리기까지",
      objectives: [
        { id: "o1", text: "배터리 공급망의 단계를 순서대로 말한다" },
        { id: "o2", text: "한 단계의 지연이 뒤 단계로 번지는 이유를 설명한다" },
      ],
      learner: { knows: ["공장과 운송의 개념"], misconceptions: ["지연은 그 단계에서만 문제가 된다"] },
      domains: ["supply-chain"],
    },
    glossary: { 리드타임: "주문부터 납품까지 걸리는 시간" },
    checks: [
      { model: "chain", expect: { lead: 6 }, tol: 0.01 },
      { model: "chain", at: { delay: 0 }, expect: { lead: 2 }, tol: 0.01, limit: "지연이 없으면 기본 2주", source: "가정 모델" },
    ],
    models: {
      chain: api.model({ delay: 2, buffer: 0 }, (p) => ({ lead: 2 + 2 * p.delay - p.buffer, late: p.delay > p.buffer }), { illustrative: true }),
    },
    figures: {
      down: api.figure(
        api.graph({ layout: "layered", direction: "down", static: "광산과 재활용에서 완성차까지 이어지는 공급망" }),
        () => [
          api.node("mine", "광산(리튬 원광 채굴)"),
          api.node("recycle", "폐배터리 재활용"),
          api.node("refine", "정련 공장"),
          api.node("cell", "배터리 셀 공장"),
          api.node("pack", "팩 조립 라인"),
          api.node("car", "완성차 공장"),
          api.edge("mine", "refine", { text: "원광", directed: true }),
          api.edge("recycle", "refine", { text: "회수 리튬", directed: true }),
          api.edge("refine", "cell", { text: "수산화리튬", directed: true }),
          api.edge("refine", "pack", { text: "긴급 직송", directed: true, dash: true }),
          api.edge("cell", "car", { text: "셀 직납", directed: true }),
          api.edge("pack", "car", { text: "배터리 팩", directed: true }),
        ],
      ),
      right: api.figure(
        api.graph({ layout: "layered", direction: "right", steps: ["원료", "가공", "조립"] }),
        (m, t, { step }) => [
          api.node("ore", "원광"),
          step >= 1 && api.node("cathode", "양극재"),
          step >= 1 && api.node("anode", "음극재"),
          step >= 2 && api.node("cellR", "셀"),
          step >= 1 && api.edge("ore", "cathode", { directed: true }),
          step >= 1 && api.edge("ore", "anode", { directed: true }),
          step >= 2 && api.edge("cathode", "cellR", { directed: true }),
          step >= 2 && api.edge("anode", "cellR", { directed: true }),
        ],
      ),
      tree: api.figure(
        api.graph({ layout: "tree", static: "납품 지연 원인 나무" }),
        () => [
          api.node("late", "납품 지연", { shape: "round" }),
          api.node("supply", "원료 부족"),
          api.node("plant", "공장 문제"),
          api.node("ship", "운송 문제"),
          api.node("strike", "파업"),
          api.node("fire", "설비 화재"),
          api.node("port", "항만 적체"),
          api.edge("late", "supply"),
          api.edge("late", "plant"),
          api.edge("late", "ship"),
          api.edge("plant", "strike"),
          api.edge("plant", "fire"),
          api.edge("ship", "port"),
        ],
      ),
      hub: api.figure(
        api.graph({ layout: "layered", static: "가운데 물류 허브와 고정된 두 공장" }),
        () => [
          api.node("hubN", "물류 허브", { at: [0.5, 0.5], shape: "circle" }),
          api.node("korea", "한국 셀 공장", { at: [0, 0] }),
          api.node("hungary", "헝가리 팩 공장", { at: [1, 1] }),
          api.node("chile", "칠레 광산"),
          api.edge("chile", "hubN", { text: "해상", directed: true }),
          api.edge("hubN", "korea", { text: "항공", directed: true }),
          api.edge("hubN", "hungary", { text: "철도", directed: true }),
          api.label([0.5, 0.15], "고정 위치", { id: "pin-note", anchor: "s" }),
        ],
      ),
      grow: api.figure(
        api.graph({ layout: "layered", direction: "down", loop: { ms: 4000, span: [0, 3] } }),
        (m, t) => [
          api.node("g1", "주문"),
          api.node("g2", "생산 계획"),
          api.node("g3", "원료 구매"),
          t >= 1 && api.node("g4", "셀 생산"),
          t >= 2 && api.node("g5", "팩 조립"),
          t >= 2 && api.node("g6", "출하"),
          api.edge("g1", "g2", { directed: true }),
          api.edge("g1", "g3", { directed: true }),
          t >= 1 && api.edge("g3", "g4", { directed: true }),
          t >= 2 && api.edge("g2", "g5", { directed: true }),
          t >= 2 && api.edge("g4", "g6", { directed: true }),
          t >= 2 && api.edge("g5", "g6", { directed: true, text: m.chain.late ? "지연" : "정시" }),
        ],
      ),
    },
    sections: [
      {
        concept: { id: "chain", title: "공급망 단계", definition: "원료에서 완제품까지 이어지는 단계", level: 1, leadsTo: ["delay"] },
        scenes: [
          { type: "hook", title: "배터리의 긴 여행", say: "전기차 배터리 하나는 여러 나라의 공장을 거쳐 차에 실린다.", figure: "down", focus: ["mine", "car"] },
          { type: "explain", title: "허브와 고정된 공장", say: "물류 허브가 가운데에서 원료와 부품을 나눈다.", figure: "hub", focus: ["hubN"] },
          {
            type: "steps",
            title: "원료에서 셀까지",
            figure: "right",
            steps: [
              { say: "원광을 캐낸다.", focus: ["ore"] },
              { say: "양극재와 음극재를 만든다.", focus: ["cathode", "anode"] },
              { say: "두 재료로 셀을 만든다.", focus: ["cellR"] },
            ],
          },
          {
            type: "quiz",
            items: [
              { kind: "choice", prompt: "정련 공장 바로 다음 단계는?", objective: "o1", figure: "down", options: [{ text: "배터리 셀 공장", correct: true }, { text: "판매점", feedback: "판매점은 맨 끝 단계다." }], reveal: { say: "셀 공장이다.", marks: ["refine->cell"] } },
              { kind: "order", prompt: "공급망 순서", items: ["광산", "정련", "셀", "팩", "완성차"], objective: "o1" },
            ],
          },
        ],
      },
      {
        concept: { id: "delay", title: "지연의 전파", definition: "앞 단계의 지연은 뒤 단계 전체를 늦춘다", level: 2, requires: ["chain"] },
        scenes: [
          {
            type: "predict",
            title: "앞 단계가 늦으면",
            ask: "원료 구매가 2주 늦으면 출하는 어떻게 될까?",
            figure: "grow",
            focus: ["g3"],
            input: { kind: "choice", options: [{ text: "출하도 늦어진다", correct: true }, { text: "출하는 그대로다", feedback: "뒤 단계는 앞 단계 결과를 기다린다.", params: { buffer: 2 } }] },
            reveal: { say: "완충 재고가 없으면 지연이 그대로 번진다.", marks: ["g5->g6"] },
            targets: "지연은 그 단계에서만 문제가 된다",
          },
          { type: "define", term: "리드타임", definition: "리드타임은 주문부터 납품까지 걸리는 전체 시간이다.", figure: "grow", focus: ["g1", "g6"] },
          { type: "explain", title: "지연 원인 나누기", say: "리드타임을 늘리는 원인을 나무로 나누면 대응할 곳이 보인다.", figure: "tree", focus: ["late", "plant"] },
          {
            type: "explore",
            title: "완충 재고",
            say: "지연과 완충 재고를 바꿔 리드타임을 보자.",
            figure: "grow",
            focus: ["g5->g6"],
            knobs: { delay: [0, 4, 1], buffer: [0, 4, 1] },
            goal: { say: "지연을 완충 재고로 흡수해 보자.", done: (m) => !m.chain.late },
          },
          { type: "quiz", items: [{ kind: "numeric", prompt: "지연 2주, 완충 0일 때 리드타임(주)?", answer: 6, tol: 0.1, unit: "주", objective: "o2" }] },
        ],
      },
    ],
    quiz: [
      { kind: "choice", prompt: "항만 적체는 어느 갈래의 원인인가?", objective: "o2", transfer: true, options: [{ text: "운송 문제", correct: true }, { text: "공장 문제", feedback: "항만은 운송 경로다." }] },
      { kind: "numeric", prompt: "지연 3주, 완충 1주일 때 리드타임(주)?", answer: 7, tol: 0.1, unit: "주", objective: "o2" },
      { kind: "order", prompt: "주문 처리 순서", items: ["주문", "생산 계획", "원료 구매", "셀 생산"], objective: "o1" },
      { kind: "classify", prompt: "원인 분류", bins: ["공장", "운송"], items: [{ text: "설비 화재", bin: "공장" }, { text: "항만 적체", bin: "운송" }, { text: "파업", bin: "공장" }], objective: "o2" },
    ],
    summary: { figures: ["down", "tree"], say: "공급망은 이어져 있어 앞 단계의 지연이 뒤로 번진다." },
  });
};
