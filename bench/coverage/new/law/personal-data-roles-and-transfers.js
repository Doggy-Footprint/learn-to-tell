// @ts-check
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, graph, node, edge, rect, label, line, arrow, legend } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  const NODES = [
    { id: "user", text: "이용자 브라우저", at: pt(0, 50) },
    { id: "api", text: "자사 API", at: pt(30, 50) },
    { id: "db", text: "클라우드 DB (IaaS)", at: pt(65, 85) },
    { id: "mail", text: "이메일 발송 서비스", at: pt(65, 60) },
    { id: "analytics", text: "분석 서비스", at: pt(65, 35) },
    { id: "ads", text: "제휴 광고사", at: pt(65, 10) },
  ];
  /** rel: legal relation of each flow. */
  const FLOWS = [
    { from: "user", to: "api", rel: "수집·이용", purpose: "서비스 제공" },
    { from: "api", to: "db", rel: "위탁", purpose: "자사 데이터 보관" },
    { from: "api", to: "mail", rel: "위탁", purpose: "자사 공지 발송" },
    { from: "api", to: "analytics", rel: "위탁", purpose: "자사 대시보드 작성" },
    { from: "api", to: "ads", rel: "제3자 제공", purpose: "광고사 자기 마케팅" },
  ];
  /** @type {Record<string, import("ltt").Tone>} */
  const relTone = { "수집·이용": "series1", 위탁: "series2", "제3자 제공": "focus" };
  const PROC = { "수집·이용": "처리 근거 기록(제15조)", 위탁: "위탁 계약 문서 + 처리방침에 위탁 사실 공개(제26조)", "제3자 제공": "별도 동의와 고지 항목(제17조)" };

  /** @param {boolean} legal @param {boolean} withProc */
  const arch = (legal, withProc) => [
    NODES.map((n) => node(n.id, n.text, { at: n.at, shape: "box" })),
    FLOWS.map((f) => edge(f.from, f.to, {
      directed: true,
      tone: legal ? relTone[f.rel] : "muted",
      weight: legal && f.rel === "제3자 제공" ? "bold" : "normal",
      text: legal ? (withProc ? `${f.rel}: ${PROC[/** @type {keyof typeof PROC} */ (f.rel)]}` : f.rel) : undefined,
    })),
  ];
  const archFig = figure(graph({ layout: "layered", direction: "right", static: "SaaS 데이터 흐름, 기술/법적 레이어" }), (_m, _t, { params }) => [
    arch(params.legal === true, false),
    params.legal === true && legend(Object.entries(relTone).map(([text, tone]) => ({ text, tone })), { id: "rel-legend" }),
  ]);
  const archNote = figure(cartesian({ x: [0, 100, ""], y: [0, 10, ""], static: "주석" }), () => label(pt(50, 5), "예시 아키텍처, 실제 분류는 계약과 실제 운영에 따라 달라짐", { id: "arch-note", tone: "warn" }));

  /** @param {number[][]} pts */
  const outline = (pts, /** @type {import("ltt").MarkOpts & {dash?: boolean}} */ o) => line([...pts, pts[0]].map(([x, y]) => pt(x, y)), o);
  /** @param {Record<string, string | number | boolean>} params */
  const roles = (params) => {
    const b2b = params.tab === "B2B";
    const placed = params.placed === true;
    return [
      outline([[30, 20], [80, 20], [80, 90], [30, 90]], { id: "controller-boundary", weight: "bold" }),
      label(pt(55, 93), b2b ? "개인정보처리자: 고객사" : "개인정보처리자: 자사", { id: "controller-t", weight: "bold" }),
      outline([[55, 25], [77, 25], [77, 55], [55, 55]], { id: "trustee-zone", dash: true }),
      label(pt(66, 57), "수탁자 영역(처리자의 손발)", { id: "trustee-t", size: "s" }),
      label(pt(66, 40), b2b ? "자사(수탁자)" : "클라우드·발송 대행", { id: "trustee-node", tone: b2b ? "focus" : undefined }),
      rect(pt(85, 40), pt(99, 60), { id: "third-party", fill: "soft" }),
      label(pt(92, 50), "제3자(독립 처리자)", { id: "third-t", size: "s" }),
      rect(pt(2, 45), pt(18, 60), { id: "subject", fill: "soft" }),
      label(pt(10, 52), "정보주체(이용자)", { id: "subject-t", size: "s" }),
      arrow(pt(18, 52), pt(30, 52), { id: "basis-arrow" }),
      label(pt(24, 75), "처리 근거(제15조 제1항 각 호): 동의 · 계약 이행에 필요 · 법령상 의무 · …", { id: "basis-t", size: "s", leader: pt(24, 53) }),
      label(pt(24, 14), "동의는 여러 근거 중 하나일 뿐", { id: "consent-one", tone: "focus", size: "s" }),
      label(pt(50, 4), "공동 처리 등 다른 관계는 생략", { id: "omit", tone: "muted", size: "s" }),
      params.mailer === true && [
        rect(placed ? pt(57, 27) : pt(85, 70), placed ? pt(75, 35) : pt(99, 80), { id: "mailer", tone: "focus", fill: "soft" }),
        label(placed ? pt(66, 31) : pt(92, 75), "이메일 발송 대행사", { id: "mailer-t", size: "s" }),
        placed && label(pt(55, 10), "대행사는 자사 업무를 대신 처리하고 자기 목적으로 쓰지 않음 → 위탁", { id: "mailer-why", size: "s" }),
        placed && label(pt(55, 6.5), "대행사가 그 주소로 자기 광고를 보내면 결론이 바뀜", { id: "mailer-cond", tone: "warn", size: "s" }),
      ],
    ];
  };
  const rolesFig = figure(cartesian({ x: [0, 100, ""], y: [0, 100, ""], static: "처리의 세 주체 관계도" }), (_m, _t, { params }) => roles(params));

  const flowchart = figure(graph({ layout: "tree", direction: "down", steps: ["Q1", "Q2", "Q3", "결론"] }), (_m, _t, { step }) => [
    node("q1", "Q1 누구의 업무·이익을 위해 처리하는가?", { shape: "box", size: "l", weight: "bold", tone: "focus" }),
    step >= 1 && [node("q2", "Q2 받는 쪽이 자기 목적으로 이용할 수 있는가?", { shape: "box" }), edge("q1", "q2", { text: "넘기는 쪽" })],
    step >= 2 && [node("q3", "Q3 넘기는 쪽의 지휘·감독을 받는가?", { shape: "box" }), edge("q2", "q3", { text: "아니오" })],
    step >= 3 && [
      node("entrust", "처리위탁(제26조): 문서 계약·위탁 사실 공개·수탁자 감독", { shape: "round", tone: "series2" }),
      node("provide", "제3자 제공(제17조): 원칙적으로 정보주체 동의 또는 법정 사유, 동의 시 고지 사항", { shape: "round", tone: "series1" }),
      edge("q3", "entrust", { text: "예" }), edge("q3", "provide", { text: "아니오" }),
      edge("q1", "provide", { text: "받는 쪽" }), edge("q2", "provide", { text: "예" }),
    ],
    node("substance", "계약서 명칭이 아니라 실질로 판단", { shape: "box", tone: "warn" }),
    node("hard", "판단 어려움: 분석 서비스가 데이터로 자기 모델 개선", { shape: "box", tone: "muted" }),
  ]);

  const purposeFig = figure(cartesian({ x: [0, 100, ""], y: [0, 100, ""], static: "같은 데이터, 같은 분석 회사, 다른 목적" }), (_m, _t, { params }) => {
    const own = params.own === true;
    return [
      outline([[2, 20], [60, 20], [60, 90], [2, 90]], { id: "boundary", weight: "bold" }),
      label(pt(30, 93), "자사(처리자) 경계", { id: "boundary-t" }),
      rect(pt(5, 50), pt(25, 70), { id: "company", fill: "soft" }), label(pt(15, 60), "자사", { id: "company-t" }),
      rect(own ? pt(70, 50) : pt(38, 50), own ? pt(95, 70) : pt(58, 70), { id: "analyst", fill: "soft" }),
      label(own ? pt(82, 60) : pt(48, 60), "분석 회사", { id: "analyst-t" }),
      arrow(pt(25, 63), own ? pt(70, 63) : pt(38, 63), { id: "data-out", label: "이름·이메일·구매 이력" }),
      !own && arrow(pt(38, 55), pt(25, 55), { id: "data-back", label: "대시보드 결과 반환" }),
      own && rect(pt(78, 30), pt(92, 45), { id: "own-store", tone: "bad", fill: "soft" }),
      own && label(pt(85, 37), "자체 저장소", { id: "own-store-t", size: "s" }),
      label(pt(50, 12), own ? "목적: 자사 대시보드 + 자기 광고 상품 개발" : "목적: 자사 대시보드 작성만", { id: "purpose", tone: "focus", weight: "bold" }),
      label(pt(50, 4), own ? "제3자 제공: 정보주체 동의 또는 법정 사유(제17조)" : "위탁: 문서 계약·위탁 사실 공개(제26조)", { id: "proc-line", size: "s" }),
    ];
  });

  const RELS = ["미분류", "수집·이용", "위탁", "제3자 제공"];
  const classModel = api.model(
    { f0: "미분류", f1: "미분류", f2: "미분류", f3: "미분류", f4: "미분류", p0: false, p1: false, p2: false, p3: false, p4: false },
    (p) => {
      /** @type {Record<string, string | boolean>} */
      const q = p;
      const res = FLOWS.map((f, i) => {
        const pick = String(q[`f${i}`]);
        const okRel = pick === f.rel;
        const wrongAt = pick === "미분류" || okRel ? "" : f.rel === "제3자 제공" || pick === "제3자 제공" ? "Q1(누구의 이익)·Q2(자기 목적)에서 갈림" : "Q3(지휘·감독)에서 갈림";
        return { pick, okRel, procDone: q[`p${i}`] === true, wrongAt };
      });
      return { res, done: res.every((r) => r.okRel && r.procDone) };
    },
    "개인정보 보호법 제15조·제17조·제26조",
  );
  const classifyFig = figure(graph({ layout: "layered", direction: "right", static: "흐름 분류 탐색판" }), (m) => [
    NODES.map((n) => node(n.id, n.text, { at: n.at, shape: "box" })),
    FLOWS.map((f, i) => {
      const r = m.classify.res[i];
      return edge(f.from, f.to, {
        directed: true,
        tone: r.pick === "미분류" ? "muted" : r.okRel ? "good" : "warn",
        weight: r.pick === "미분류" ? "thin" : "normal",
        text: `목적: ${f.purpose} | ${r.pick}${r.wrongAt ? " — " + r.wrongAt : ""}${f.to === "db" ? " (단순 보관 인프라의 위탁 해당 여부는 견해가 갈릴 수 있음)" : ""}`,
      });
    }),
    m.classify.done && node("done", "목표 달성: 모든 흐름 분류·절차 완료", { tone: "good", at: pt(30, 0) }),
  ]);

  const liability = figure(cartesian({ x: [0, 100, ""], y: [0, 100, ""], static: "사고 시 책임 경로" }), () => [
    label(pt(25, 96), "위탁: 수탁자에서 유출", { id: "lt-a", weight: "bold" }),
    label(pt(75, 96), "제3자 제공: 받은 쪽에서 유출", { id: "lt-b", weight: "bold" }),
    line([pt(50, 5), pt(50, 95)], { id: "div", tone: "muted" }),
    rect(pt(5, 70), pt(45, 88), { id: "a-controller", fill: "soft" }), label(pt(25, 79), "자사(위탁자)", { id: "a-c-t" }),
    rect(pt(10, 30), pt(40, 45), { id: "a-trustee", fill: "soft", tone: "bad" }), label(pt(25, 37), "수탁자: 유출", { id: "a-t-t" }),
    arrow(pt(25, 45), pt(25, 70), { id: "liab-a", weight: "bold", tone: "focus", label: "수탁자 = 처리자 소속 직원으로 봄(제26조) → 위탁자 배상책임" }),
    rect(pt(55, 70), pt(95, 88), { id: "b-controller", fill: "soft" }), label(pt(75, 79), "자사(제공자)", { id: "b-c-t" }),
    rect(pt(60, 30), pt(90, 45), { id: "b-third", fill: "soft", tone: "bad" }), label(pt(75, 37), "제3자(독립 처리자): 유출", { id: "b-t-t" }),
    arrow(pt(75, 30), pt(75, 15), { id: "liab-b", weight: "normal", label: "자기 책임" }),
    label(pt(75, 58), "제공 자체의 적법성은 별도", { id: "b-note", size: "s", tone: "muted" }),
    label(pt(50, 2), "형사·행정 책임의 세부는 생략, 민사 배상 관계 중심", { id: "civil-only", tone: "muted", size: "s" }),
  ]);

  const procMap = figure(graph({ layout: "layered", direction: "right", static: "흐름별 절차 지도" }), () => [
    arch(true, true),
    node("myth1", "반박 ①: 발송·분석 대행 전송은 제3자 제공이 아니라 위탁", { tone: "focus", at: pt(100, 60) }),
    node("myth2", "반박 ②: 계약서가 있어도 광고사의 자기 목적 이용은 제3자 제공", { tone: "focus", at: pt(100, 10) }),
    edge("myth1", "mail", { id: "myth1-link" }), edge("myth2", "ads", { id: "myth2-link" }),
    node("scope", "법률 자문을 대신하지 않음, 해외 이전·가명정보 요건 별도", { tone: "warn", at: pt(0, 0) }),
  ]);

  return {
    models: { classify: classModel },
    figures: { arch: archFig, archNote, roles: rolesFig, archWithNote: api.split(["arch", "archNote"]), flowchart, purpose: purposeFig, classify: classifyFig, liability, procMap },
    scenes: [
      { type: "explore", title: "우리 파이프라인의 화살표는 모두 같은 화살표인가", say: "법적 관점을 켜 보라.", figure: "archWithNote", focus: ["api->ads"], knobs: { legal: false } },
      { type: "explore", title: "처리자, 정보주체, 그리고 근거", say: "탭을 바꿔 자사의 위치를 보라.", figure: "roles", focus: ["trustee-zone", "consent-one"], knobs: { tab: ["B2C", "B2B"] } },
      { type: "predict", title: "이메일 발송 대행사에 주소를 넘기면?", ask: "이 흐름은?", figure: "roles", focus: ["mailer"], params: { mailer: true, placed: false, tab: "B2C" }, input: { kind: "choice", options: [{ text: "위탁", correct: true }, { text: "제3자 제공", feedback: "대행사는 자기 목적으로 쓰지 않는다." }, { text: "어느 쪽도 아님", feedback: "처리자 밖으로 데이터가 이동한다." }] }, reveal: { say: "대행사는 수탁자 영역에 들어간다.", params: { placed: true }, marks: ["mailer-why", "mailer-cond"] }, targets: "외부 서버 전송 = 제3자 제공" },
      { type: "steps", title: "위탁과 제3자 제공을 가르는 질문", figure: "flowchart", steps: [{ say: "누구의 이익인가", focus: ["q1"] }, { say: "자기 목적 이용", focus: ["q2"] }, { say: "지휘·감독", focus: ["q3"] }, { say: "결론과 절차", focus: ["entrust", "provide", "substance"] }] },
      { type: "compare", title: "같은 데이터 이동, 다른 목적", say: "바뀐 것은 목적뿐이다.", figure: "purpose", focus: ["purpose", "own-store"], a: { own: false }, b: { own: true }, labels: ["A: 대시보드만", "B: 자기 광고 상품에도"] },
      { type: "explore", title: "우리 아키텍처의 흐름 분류하기", say: "흐름마다 분류와 절차를 지정하라.", figure: "classify", focus: [], knobs: { f0: RELS, f1: RELS, f2: RELS, f3: RELS, f4: RELS, p0: false, p1: false, p2: false, p3: false, p4: false }, goal: { say: "모든 흐름 올바르게 분류, 절차 완료", done: (m) => m.classify.done } },
      { type: "quiz", items: [{ kind: "choice", prompt: "수탁자에서 유출되면 자사에 배상책임이 올 수 있는가?", options: [{ text: "그렇다", correct: true }, { text: "넘겼으니 끝", feedback: "제26조는 수탁자를 소속 직원으로 본다." }], objective: "liability", figure: "liability", reveal: { say: "위탁자까지 거슬러 온다.", marks: ["liab-a", "liab-b"] } }] },
      { type: "explain", title: "정리: 흐름별 절차 지도", say: "흐름마다 절차가 다르다.", figure: "procMap", focus: ["myth1", "myth2"] },
    ],
  };
};

const SRC = "bench/coverage/new/law/personal-data-roles-and-transfers.brief.md";
/** @param {string} id @param {"Q"|"G"|"T"|"I"|"E"|"S"|"X"} cat @param {string} text @param {boolean} essential @param {string} why @param {"kept"|"approx"|"lost"|"custom"|"ambiguous"} status @param {string} note @returns {import("../../fragment").Prop} */
const P = (id, cat, text, essential, why, status, note) => (status === "kept" ? { id, cat, text, essential, why, status, by: note } : { id, cat, text, essential, why, status, diff: note });
const row = (/** @type {string} */ fig, /** @type {import("../../fragment").Prop[]} */ props, /** @type {"V"|"G"} */ verdict, /** @type {string[]} */ candidates) => ({ fig, src: SRC, corpus: /** @type {const} */ ("new-b1"), domain: "법", props, verdict, custom: [], candidates });

/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row("personal-data-roles-and-transfers#F1", [
    P("P1", "I", "기술/법적 레이어 토글", true, "hook 반전", "kept", "Explore knobs boolean 'toggle'"),
    P("P2", "E", "제3자 제공 화살표가 가장 먼저 눈에 띔", true, "위험 최대", "kept", "edge tone 'focus is the accent' + weight bold"),
    P("P3", "G", "노드 배치 동일, 화살표 표기만 바뀜", true, "물리 흐름은 같음", "approx", "node at 'overrides layout'로 위치 고정; 다만 edge에 dash 옵션이 없어 '선 모양' 변화는 색·굵기·라벨로만 표현"),
    P("P4", "X", "예시 아키텍처 단정 방지 표시", true, "단정 방지", "kept", "split으로 붙인 주석 figure의 label"),
  ], "V", ["edge-dash"]),
  row("personal-data-roles-and-transfers#F2", [
    P("P1", "G", "수탁자는 처리자 경계 안 점선 영역, 제3자는 경계 밖", true, "공간 대응", "kept", "line dash 닫힌 폴리라인(경계 안), rect 경계 밖 데이터 좌표"),
    P("P2", "X", "동의는 여러 근거 중 하나", true, "오해 방지", "kept", "label consent-one"),
    P("P3", "I", "B2C/B2B 탭 전환", true, "자사 위치가 바뀜", "kept", "Explore knobs string[] 'choices'"),
    P("P4", "X", "공동 처리 등 생략 표시", true, "단순화", "kept", "label omit"),
  ], "V", ["rect-dash"]),
  row("personal-data-roles-and-transfers#F3", [
    P("P1", "I", "선택 확정 후 공개", true, "predict", "kept", "Predict reveal 'stay hidden until answered'"),
    P("P2", "G", "공개 시 노드가 F2 수탁자 영역으로 이동", true, "공간 규칙", "approx", "같은 roles figure에서 reveal.params placed로 수탁자 영역 안에 다시 그려진다; 이동 애니메이션은 보장되지 않으나 최종 위치로 결론이 남는다"),
    P("P3", "X", "판단 근거 한 줄", true, "근거", "kept", "reveal.marks mailer-why"),
    P("P4", "X", "자기 광고 시 결론이 바뀜 주석", true, "조건부 결론", "kept", "reveal.marks mailer-cond"),
  ], "V", []),
  row("personal-data-roles-and-transfers#F4", [
    P("P1", "G", "분기 구조, Q1을 맨 위·가장 큰 노드", true, "주된 기준", "approx", "graph tree가 Q1을 뿌리로 맨 위에 두고 size 'l'을 주지만, node의 size가 노드 상자 크기를 키우는지 d.ts가 말하지 않는다; 맨 위·굵게·focus로 남음"),
    P("P2", "X", "결론 노드에 조문과 절차", true, "", "kept", "node text"),
    P("P3", "X", "계약서 명칭이 아니라 실질", true, "오개념 후반", "kept", "node substance tone warn"),
    P("P4", "T", "질문이 하나씩 열림", false, "읽기 순서", "kept", "TimeSpec steps + step>=i"),
    P("P5", "E", "경계 사례 '판단 어려움' 주석 영역", false, "불확정", "approx", "흐름도 옆 영역이 아니라 tree 레이아웃이 배치하는 별도 노드"),
  ], "V", []),
  row("personal-data-roles-and-transfers#F5", [
    P("P1", "S", "두 패널 동일 배치, 목적 라벨과 반환 화살표만 다름", true, "변수 하나", "approx", "Compare a/b 'side by side'; 다만 B에서는 분석 회사 상자가 경계 밖으로 옮겨져 배치 하나가 더 달라진다(브리프 자체가 A 안/B 밖을 요구)"),
    P("P2", "E", "목적 라벨 강조색", true, "결론 요소", "kept", "label tone focus weight bold"),
    P("P3", "G", "B에서 분석 회사 안 자체 저장소", true, "독자 이용", "kept", "rect own-store (B params만)"),
    P("P4", "X", "패널 아래 절차 한 줄", true, "", "kept", "label proc-line"),
  ], "V", []),
  row("personal-data-roles-and-transfers#F6", [
    P("P1", "I", "화살표 선택→분류 지정→절차 체크, 전부 맞으면 목표", true, "explore", "approx", "화살표 클릭 대신 흐름별 choices knob과 toggle knob으로 지정한다; goal.done으로 목표 판정은 남음"),
    P("P2", "X", "오답 시 F4 어느 질문에서 갈렸는지", true, "근거 복귀", "kept", "model wrongAt를 edge text로"),
    P("P3", "E", "미분류 화살표 점선", false, "진행 상황", "approx", "edge에 dash가 없어 muted thin으로 표시"),
    P("P4", "X", "IaaS 흐름 견해 갈림 주석", true, "불확정", "kept", "db edge text"),
  ], "V", ["click-select", "edge-dash"]),
  row("personal-data-roles-and-transfers#F7", [
    P("P1", "G", "책임 화살표 방향과 도달 범위", true, "결론", "kept", "arrow(수탁자→위탁자) vs arrow(제3자 자기 쪽)"),
    P("P2", "X", "형사·행정 생략, 민사 중심", true, "단순화", "kept", "label civil-only"),
    P("P3", "I", "퀴즈 응답 후에만 책임 화살표 공개", true, "quiz", "kept", "QuizReveal marks 'Shown after a choice or numeric answer is submitted'"),
    P("P4", "E", "위탁자로 오는 화살표 가장 굵게", true, "오개념 반대", "kept", "weight bold + tone focus"),
  ], "V", []),
  row("personal-data-roles-and-transfers#F8", [
    P("P1", "S", "절차 태그가 해당 흐름 화살표에 붙음", true, "조치-흐름 대응", "kept", "edge text 'Between node ids'"),
    P("P2", "X", "법률 자문 아님, 해외 이전·가명정보 별도", true, "범위", "kept", "node scope"),
    P("P3", "E", "오개념 두 부분 반박 흐름 강조", true, "학습 목표", "approx", "반박 노드를 focus로 두고 해당 흐름에 선으로 잇지만, 흐름 edge 자체(mail·ads) 강조는 tone 하나라 두 흐름만 더 굵게 할 수는 있어도 연결 edge가 노드 간 edge라 화살표가 아닌 노드로 이어진다"),
  ], "V", []),
];
