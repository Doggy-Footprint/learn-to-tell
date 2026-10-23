// @ts-check
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, lanes, rect, label, line, arrow, sweep, dot, mock, axis, path } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  const terms = [
    { id: "t-scope", text: "서비스 범위", y: 70, settled: true },
    { id: "t-fee", text: "요금·자동 갱신", y: 58, settled: false },
    { id: "t-exempt", text: "면책 조항", y: 46, settled: false },
    { id: "t-change", text: "일방 변경 조항", y: 34, settled: false },
  ];
  const map = figure(cartesian({ x: [0, 100, ""], y: [0, 100, ""], static: "가입 화면 요소와 청약·승낙·약관 조항의 대응도" }), () => [
    label(pt(25, 97), "사실 세계: 가입 화면", { id: "col-fact", weight: "bold" }),
    label(pt(75, 97), "법률 관계", { id: "col-law", weight: "bold" }),
    line([pt(50, 5), pt(50, 95)], { id: "divider", tone: "muted" }),
    mock("browser", [pt(5, 15), pt(45, 90)], [
      label(pt(25, 80), "약관 보기 ›", { id: "ui-link" }),
      rect(pt(10, 60), pt(14, 64), { id: "ui-check" }),
      label(pt(16, 62), "전체 동의", { id: "ui-check-label", anchor: "w" }),
      rect(pt(12, 30), pt(38, 38), { id: "ui-submit", fill: "soft" }),
      label(pt(25, 34), "가입하기", { id: "ui-submit-label" }),
    ], { id: "wire", title: "예시 화면, 실제 서비스 아님" }),
    label(pt(25, 10), "예시 화면, 실제 서비스 아님", { id: "not-real", tone: "warn" }),
    label(pt(75, 88), "청약 (가입 신청)", { id: "law-offer" }),
    label(pt(75, 80), "승낙 (가입 완료 처리)", { id: "law-accept" }),
    terms.map((t) => label(pt(80, t.y), t.text, { id: t.id })),
    line([pt(38, 34), pt(66, 88)], { id: "ln-offer" }),
    line([pt(46, 20), pt(66, 80)], { id: "ln-accept" }),
    line([pt(30, 80), pt(70, 74)], { id: "ln-link", tone: "muted" }),
    terms.map((t) => line([pt(14, 62), pt(70, t.y)], { id: `ln-${t.id}`, dash: !t.settled, tone: t.settled ? "muted" : "focus", weight: t.settled ? "thin" : "bold" })),
    label(pt(60, 25), "점선: 체크했지만 편입·효력 미확정", { id: "dash-note", tone: "focus" }),
  ]);

  const send = [0.5, 3, 6.2], arrive = [1.8, 4.6, 7.6];
  const timeline = figure(lanes({ time: [0, 9, "순서 (축척 없음)"], lanes: ["회사", "이용자"], steps: ["청약의 유인", "청약", "승낙"] }), (_m, _t, { step }) => [
    label(pt(4.5, -0.6), "축척 없음, 순서만 의미", { id: "noscale", tone: "muted" }),
    [0, 1, 2].map((i) => {
      const fromLane = i === 1 ? 1 : 0, toLane = 1 - fromLane;
      const names = ["게시(청약의 유인)", "가입 신청(청약)", "가입 완료 메일(승낙)"];
      return step >= i && [
        dot(pt(send[i], fromLane), { id: `send-${i}`, label: "발신" }),
        arrow(pt(send[i], fromLane), pt(arrive[i], toLane), { id: `msg-${i}`, label: names[i] }),
        dot(pt(arrive[i], toLane), { id: `arrive-${i}`, label: "도달", tone: "focus", fill: "solid" }),
        i > 0 && label(pt(arrive[i], toLane + 0.3), "효력 발생 (민법 제111조 제1항)", { id: `effect-${i}`, tone: "good" }),
      ];
    }),
    label(pt(1.2, 1.5), "게시 페이지는 청약이 아니라 청약의 유인일 수 있다(서비스 구조에 따라 다름)", { id: "invite-note", tone: "muted", size: "s" }),
    step >= 2 && sweep("x", arrive[2], { id: "formed", weight: "bold", tone: "focus", label: "계약 성립 = 승낙 도달" }),
  ]);

  const gateX = [25, 50, 75];
  const gates = [
    { name: "관문 1 편입 통제", law: "약관규제법 제3조 (명시·설명의무)" },
    { name: "관문 2 해석", law: "같은 법 제5조 (객관적·통일적 해석, 작성자 불리)" },
    { name: "관문 3 내용 통제", law: "같은 법 제6조, 제7조 이하" },
  ];
  /** fall: gate index where the card drops out, -1 passes. */
  const cards = [
    { id: "c-scope", text: "서비스 범위", fall: -1 },
    { id: "c-fee", text: "설명 없는 자동 갱신", fall: 0 },
    { id: "c-exempt", text: "고의·중과실 면책", fall: 2 },
  ];
  /** @param {number} step @param {number} fall */
  const cardPos = (step, fall) => {
    if (fall >= 0 && step > fall) return fall === 0 ? pt(gateX[0], 12) : pt(gateX[fall], 12);
    return pt(step >= 3 ? 92 : gateX[Math.min(step, 2)] - 10, 60);
  };
  /** @param {Record<string, string | number | boolean>} params */
  const pipeline = (params) => [
    gates.map((g, i) => [
      rect(pt(gateX[i] - 3, 40), pt(gateX[i] + 3, 85), { id: `gate-${i}`, fill: "soft" }),
      label(pt(gateX[i], 88), g.name, { id: `gate-name-${i}` }),
      label(pt(gateX[i], 36), g.law, { id: `gate-law-${i}`, size: "s" }),
    ]),
    rect(pt(gateX[0] - 10, 2), pt(gateX[0] + 10, 18), { id: "bin-not-incorporated", fill: "none" }),
    label(pt(gateX[0], 20), "편입 안 됨 = 계약 내용 아님", { id: "bin-1-label" }),
    rect(pt(gateX[2] - 10, 2), pt(gateX[2] + 10, 18), { id: "bin-void", fill: "none", tone: "bad" }),
    label(pt(gateX[2], 20), "편입됐으나 무효", { id: "bin-2-label", tone: "bad" }),
    rect(pt(8, 70), pt(12, 74), { id: "checkbox-icon", tone: "focus", fill: "solid" }),
    label(pt(10, 76), "동의 체크 = 관문 1의 일부", { id: "checkbox-note", tone: "focus", size: "s" }),
    params.omitNote !== false && label(pt(50, 96), "개별 협상한 조항은 약관이 아님, 그림에서 생략", { id: "omit-note", tone: "muted", size: "s" }),
  ];
  const gatesFig = figure(cartesian({ x: [0, 100, ""], y: [0, 100, ""], steps: ["입구", "관문 1", "관문 2", "관문 3"] }), (_m, _t, { step, params }) => [
    pipeline(params),
    cards.map((c, i) => {
      const p = cardPos(step, c.fall);
      return [rect(pt(p[0] - 7, p[1] - 3 - i * 8), pt(p[0] + 7, p[1] + 3 - i * 8), { id: c.id, fill: "soft" }), label(pt(p[0], p[1] - i * 8), c.text, { id: `${c.id}-t`, size: "s" })];
    }),
  ]);

  const exemptFig = figure(cartesian({ x: [0, 100, ""], y: [0, 100, ""], static: "면책 조항 카드와 관문 3 위치" }), (_m, _t, { params }) => [
    pipeline(params),
    label(pt(30, 62), "회사는 서비스 장애로 인한", { id: "clause-a", anchor: "e" }),
    label(pt(31, 62), "어떠한 손해", { id: "clause-key", anchor: "w", tone: "focus", weight: "bold" }),
    line([pt(31, 59.5), pt(45, 59.5)], { id: "underline", tone: "focus" }),
    label(pt(46, 62), "에 대해서도 책임지지 않는다", { id: "clause-b", anchor: "w" }),
    label(pt(38, 54), "'어떠한'은 고의·중과실까지 포함 → 제7조가 금지", { id: "key-note", tone: "focus", size: "s", leader: pt(38, 59) }),
    params.revealed === true && [
      rect(pt(gateX[2] - 7, 7), pt(gateX[2] + 7, 13), { id: "exempt-card", tone: "bad", fill: "soft", from: "clause-key" }),
      label(pt(gateX[2], 10), "관문 3에서 무효 (제7조)", { id: "exempt-card-t", tone: "bad" }),
    ],
    label(pt(50, 46), "구체적 효력은 사안별 판단, 예시 결론", { id: "case-note", tone: "warn" }),
  ]);

  const explainFig = figure(cartesian({ x: [0, 100, ""], y: [0, 100, ""], static: "설명의무 이행 방식 A/B" }), (_m, _t, { params }) => {
    const shown = params.summary === true;
    return [
      mock("phone", [pt(5, 30), pt(40, 95)], [
        label(pt(22, 88), "약관 전문 보기 ›", { id: "ui-full" }),
        shown && rect(pt(8, 60), pt(37, 80), { id: "ui-summary", tone: "focus", fill: "soft" }),
        shown && label(pt(22, 70), "요약: 매년 자동 갱신, 요금 인상 가능 [확인]", { id: "ui-summary-t", tone: "focus", size: "s" }),
        rect(pt(8, 45), pt(11, 48), { id: "ui-box" }),
        label(pt(13, 46.5), "전체 동의", { id: "ui-box-t", anchor: "w" }),
      ]),
      rect(pt(60, 40), pt(66, 85), { id: "gate1", fill: "soft" }),
      label(pt(63, 88), "관문 1 편입 통제", { id: "gate1-t" }),
      shown ? rect(pt(74, 58), pt(94, 66), { id: "fee-card", tone: "good", fill: "soft" }) : rect(pt(53, 8), pt(73, 16), { id: "fee-card", tone: "bad", fill: "soft" }),
      label(shown ? pt(84, 62) : pt(63, 12), shown ? "자동 갱신 조항: 편입" : "자동 갱신 조항: 편입 안 됨", { id: "fee-card-t" }),
      label(pt(50, 4), "설명의무가 면제되는 경우(거래상 일반적이고 공통된 내용 등)는 생략", { id: "exempt-omit", tone: "muted", size: "s" }),
      shown && label(pt(84, 50), "B가 항상 충분하다는 보장은 아님", { id: "b-caveat", tone: "warn", size: "s" }),
    ];
  });

  const sortCards = [
    { id: "s-change", text: "일방적 서비스 변경", bin: "gray", why: "제10조: 상당한 이유 없는 일방 변경은 무효 가능, 사유에 따라 다름" },
    { id: "s-gross", text: "고의·중과실 면책", bin: "void", why: "제7조 제1호: 고의·중과실 책임 배제는 무효" },
    { id: "s-data", text: "데이터 이전 거부", bin: "gray", why: "제6조: 고객의 정당한 이익을 해치는지 사안별 판단" },
    { id: "s-court", text: "관할 법원 지정", bin: "void", why: "제14조: 고객에게 부당하게 불리한 재판관할 합의는 무효" },
    { id: "s-refund", text: "환불 불가", bin: "gray", why: "제6조·제9조: 해지 시 원상회복 제한 정도에 따라 다름" },
  ];
  const bins = { pass: [[85, 50], [99, 90]], void: [[65, 2], [85, 18]], gray: [[35, 2], [60, 18]], out: [[15, 2], [33, 18]] };
  /** @param {number} x @param {number} y */
  const binOf = (x, y) => Object.entries(bins).find(([, b]) => x >= b[0][0] && x <= b[1][0] && y >= b[0][1] && y <= b[1][1])?.[0] ?? "none";
  const sortModel = api.model(
    { "s-change-x": 5, "s-change-y": 90, "s-gross-x": 5, "s-gross-y": 80, "s-data-x": 5, "s-data-y": 70, "s-court-x": 5, "s-court-y": 60, "s-refund-x": 5, "s-refund-y": 50 },
    (p) => {
      /** @type {Record<string, number>} */
      const q = p;
      const placed = sortCards.map((c) => binOf(q[`${c.id}-x`], q[`${c.id}-y`]));
      return { placed, done: placed.every((b, i) => b === sortCards[i].bin) };
    },
    "약관규제법 제6조·제7조·제9조·제10조·제14조",
  );
  const sortFig = figure(cartesian({ x: [0, 100, ""], y: [0, 100, ""], static: "조항 카드를 관문 탈락 통에 끌어 놓는 판" }), (m, _t, { params }) => [
    gates.map((g, i) => [rect(pt(gateX[i] - 2, 40), pt(gateX[i] + 2, 85), { id: `sgate-${i}`, fill: "soft" }), label(pt(gateX[i], 88), g.name, { id: `sgate-t-${i}`, size: "s" })]),
    rect(pt(85, 50), pt(99, 90), { id: "bin-pass", tone: "good", fill: "none" }), label(pt(92, 92), "통과", { id: "bin-pass-t" }),
    rect(pt(65, 2), pt(85, 18), { id: "bin-void2", tone: "bad", fill: "none" }), label(pt(75, 20), "무효", { id: "bin-void2-t" }),
    rect(pt(35, 2), pt(60, 18), { id: "bin-gray", tone: "muted", fill: "solid", opacity: 0.4 }), label(pt(47, 20), "사안에 따라 다름", { id: "bin-gray-t", tone: "muted" }),
    rect(pt(15, 2), pt(33, 18), { id: "bin-out", fill: "none" }), label(pt(24, 20), "편입 안 됨", { id: "bin-out-t" }),
    sortCards.map((c, i) => {
      const x = Number(params[`${c.id}-x`]), y = Number(params[`${c.id}-y`]);
      const where = m.sort.placed[i];
      return [
        rect(pt(x - 5, y - 2), pt(x + 5, y + 2), { id: c.id, fill: "soft", tone: where === c.bin ? "good" : where === "none" ? undefined : "warn" }),
        label(pt(x, y), c.text, { id: `${c.id}-t`, size: "s" }),
        where !== "none" && label(pt(x, y - 4), where === c.bin ? c.why : "다시 보기: " + c.why.split(":")[0], { id: `${c.id}-why`, size: "s" }),
      ];
    }),
    m.sort.done && label(pt(50, 97), "완료: 모든 조항을 옳은 위치에 놓았다", { id: "done", tone: "good" }),
  ]);

  const scaleModel = api.model({ apply: false }, (p) => ({ tilt: p.apply ? -12 : 0 }), { illustrative: true });
  const scaleFig = figure(cartesian({ x: [-50, 50, ""], y: [0, 60, ""], aspect: "equal", static: "작성자 불리 해석의 저울" }), (m) => {
    const a = (m.scale.tilt * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    const L = pt(-30 * c, 40 - 30 * s), R = pt(30 * c, 40 + 30 * s);
    return [
      path([["M", -8, 5], ["L", 8, 5], ["L", 0, 40], ["Z"]], { id: "stand", fill: "soft" }),
      line([L, R], { id: "beam", weight: "bold" }),
      label(pt(L[0], L[1] - 6), "회사에 유리: 어떤 변경이든 가능", { id: "pan-company" }),
      label(pt(R[0], R[1] - 6), "이용자에 유리: 중요하지 않은 변경만", { id: "pan-user", tone: m.scale.tilt !== 0 ? "focus" : undefined }),
      label(pt(0, 57), "\"회사는 필요한 경우 서비스를 변경할 수 있다\"", { id: "clause" }),
      label(pt(0, 50), "기울기 정도는 의미 없음, 방향만 의미", { id: "dir-only", tone: "muted", size: "s" }),
      label(pt(0, 2), "먼저 객관적 해석을 시도하고, 그래도 애매할 때 고객에게 유리하게 (제5조 제2항)", { id: "order-note", size: "s" }),
    ];
  });

  const checklist = figure(cartesian({ x: [0, 100, ""], y: [0, 100, ""], static: "관문별 개발 리드 체크리스트" }), (_m, _t, { params }) => [
    pipeline({ ...params, omitNote: false }),
    dot(pt(gateX[0], 85), { id: "pin-1", tone: "focus", size: "l" }),
    label(pt(gateX[0], 94), "① 체크박스는 관문 1의 일부일 뿐: 중요 조항 별도 표시·확인 로그 보존", { id: "pin-1-t", tone: "focus", weight: "bold", leader: pt(gateX[0], 85) }),
    dot(pt(gateX[1], 85), { id: "pin-2" }),
    label(pt(gateX[1], 30), "② 모호한 문구 제거", { id: "pin-2-t", leader: pt(gateX[1], 85) }),
    dot(pt(gateX[2], 85), { id: "pin-3" }),
    label(pt(gateX[2], 26), "③ 고의·중과실 면책·일방 변경 조항 검토", { id: "pin-3-t", leader: pt(gateX[2], 85) }),
    label(pt(50, 99), "법률 자문을 대신하지 않음", { id: "no-advice", tone: "warn" }),
  ]);
  void axis;

  return {
    models: { sort: sortModel, scale: scaleModel },
    figures: { map, timeline, gates: gatesFig, exempt: exemptFig, explain: explainFig, sort: sortFig, scale: scaleFig, checklist },
    scenes: [
      { type: "hook", title: "체크박스 하나로 무엇이 묶이는가", say: "점선은 체크했지만 효력이 확정되지 않은 연결이다.", figure: "map", focus: ["ln-t-exempt", "ln-t-change", "ln-t-fee"] },
      { type: "steps", title: "청약·승낙과 도달", figure: "timeline", steps: [
        { say: "가입 페이지 게시는 청약의 유인일 수 있다.", focus: ["msg-0"] },
        { say: "이용자의 가입 신청이 회사에 도달하면 청약의 효력이 생긴다.", focus: ["arrive-1", "effect-1"] },
        { say: "승낙이 이용자에게 도달하는 순간 계약이 성립한다.", focus: ["formed"] },
      ] },
      { type: "predict", title: "이 면책 조항은 효력이 있을까", ask: "이 조항은?", figure: "exempt", focus: ["clause-key"], input: { kind: "choice", options: [
        { text: "유효", feedback: "동의 체크는 관문 1의 일부일 뿐이다." },
        { text: "무효", feedback: "고의·중과실이 아닌 경미한 과실 부분은 다툼의 여지가 있다." },
        { text: "일부만 무효", correct: true },
      ] }, reveal: { say: "'어떠한 손해'가 고의·중과실 책임까지 배제해 관문 3(제7조)에 걸린다.", marks: ["exempt-card", "exempt-card-t"], params: { revealed: true } }, targets: "전체 동의 = 전부 유효" },
      { type: "steps", title: "약관이 계약이 되기까지의 세 관문", figure: "gates", steps: [
        { say: "조항 카드가 입구에 있다. 체크박스는 첫 관문 앞에만 있다.", focus: ["checkbox-icon"] },
        { say: "관문 1: 설명되지 않은 중요 조항은 편입되지 않는다.", focus: ["gate-0", "bin-not-incorporated"] },
        { say: "관문 2: 객관적으로 해석하고, 애매하면 작성자에게 불리하게.", focus: ["gate-1"] },
        { say: "관문 3: 불공정 조항은 편입됐어도 무효다.", focus: ["gate-2", "bin-void"] },
      ] },
      { type: "compare", title: "중요 조항의 설명 여부를 바꿔 보기", say: "바뀐 것은 화면의 요약 박스 하나다.", figure: "explain", focus: ["ui-summary", "fee-card"], a: { summary: false }, b: { summary: true }, labels: ["A: 전문 링크 + 체크박스", "B: 별도 요약 + 개별 확인"] },
      { type: "explore", title: "조항을 관문에 통과시켜 보기", say: "카드를 끌어 통에 놓아라.", figure: "sort", focus: ["bin-gray"], knobs: {}, handles: sortCards.map((c) => ({ mark: c.id, x: `${c.id}-x`, y: `${c.id}-y` })), goal: { say: "모든 카드를 옳은 위치에", done: (m) => m.sort.done } },
      { type: "quiz", items: [{ kind: "choice", prompt: "애매한 변경 조항은 누구에게 유리하게 해석되는가?", options: [{ text: "이용자", correct: true }, { text: "회사", feedback: "작성자 불리 원칙(제5조 제2항)." }], objective: "interp", figure: "scale", params: { apply: false }, reveal: { say: "객관적 해석으로도 애매하면 고객에게 유리하게.", params: { apply: true }, marks: ["pan-user"] } }] },
      { type: "explain", title: "정리: 동의 UI와 조항 설계 체크리스트", say: "체크박스는 관문 1의 일부일 뿐이다.", figure: "checklist", focus: ["pin-1-t"] },
    ],
  };
};

const SRC = "bench/coverage/new/law/contract-formation-and-terms.brief.md";
/** @param {string} id @param {"Q"|"G"|"T"|"I"|"E"|"S"|"X"} cat @param {string} text @param {boolean} essential @param {string} why @param {"kept"|"approx"|"lost"|"custom"|"ambiguous"} status @param {string} note @returns {import("../../fragment").Prop} */
const P = (id, cat, text, essential, why, status, note) => (status === "kept" ? { id, cat, text, essential, why, status, by: note } : { id, cat, text, essential, why, status, diff: note });
const row = (/** @type {string} */ fig, /** @type {import("../../fragment").Prop[]} */ props, /** @type {"V"|"G"} */ verdict, /** @type {string[]} */ candidates) => ({ fig, src: SRC, corpus: /** @type {const} */ ("new-b1"), domain: "법", props, verdict, custom: [], candidates });

/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row("contract-formation-and-terms#F1", [
    P("P1", "G", "화면 요소와 법적 요소의 1:1 또는 1:다 연결선", true, "UI를 법 개념에 고정", "kept", "line(pts) 데이터 좌표로 화면 요소→법적 요소 연결; P is data units"),
    P("P2", "E", "점선(효력 미확정) 연결이 가장 먼저 눈에 띔", true, "오개념 겨냥", "kept", "line dash + Tone 'focus is the accent' + weight bold, 확정 선은 muted thin"),
    P("P3", "X", "와이어프레임 위 '예시 화면, 실제 서비스 아님'", true, "특정 회사로 읽히지 않게", "kept", "mock(..., {title}) 및 label"),
    P("P4", "I", "화면 요소 hover 시 대응 법적 요소 강조", false, "탐색 보조", "lost", "Explore/handles에 hover 상호작용이 없다"),
    P("P5", "S", "좌 사실 / 우 법률 2단", true, "층위 구분", "kept", "cartesian 데이터 좌표 배치 x<50 / x>50 + 구분선 line"),
  ], "V", ["hover-link"]),
  row("contract-formation-and-terms#F2", [
    P("P1", "T", "단계 버튼으로 화살표 하나씩, 도달 순간에만 효력 마크", true, "발신·도달 시점 차이", "kept", "TimeSpec steps + Steps 'Each step advances the figure's steps index'; effect label은 step>=i에서 도달 점에만"),
    P("P2", "G", "발신점과 도달점이 시간축에서 떨어짐", true, "도달주의 시각화", "kept", "lanes 'Points are [time, lane index]'; arrow(send, arrive) 다른 time 좌표"),
    P("P3", "X", "'축척 없음, 순서만 의미' 표시", true, "간격 오독 방지", "kept", "label + time Axis unit 문자열"),
    P("P4", "X", "청약의 유인 주석", false, "판단 조건부", "kept", "label"),
    P("P5", "E", "계약 성립 순간 굵은 세로선", true, "그림의 결론", "kept", "sweep('x', at, {weight:'bold', tone:'focus'}) 'Line across the frame at a data value'"),
  ], "V", []),
  row("contract-formation-and-terms#F3", [
    P("P1", "G", "관문 순서 왼→오 고정", true, "논리적 선후", "kept", "rect 데이터 x 좌표 25<50<75"),
    P("P2", "S", "두 탈락 통 구분", true, "근거가 다름", "kept", "별도 rect + label 두 개, bad tone은 무효 통만"),
    P("P3", "T", "단계별로 카드가 이동하는 애니메이션", true, "steps 진행 단위", "ambiguous", "steps는 단계 index만 주고, 같은 id 마크가 단계 사이에 보간 이동하는지 d.ts가 말하지 않는다(위치가 순간 이동하는 runtime도 계약을 지킨다)"),
    P("P4", "X", "각 관문 아래 근거 조문", true, "원문 찾기", "kept", "label(gate-law-i)"),
    P("P5", "X", "개별 협상 조항 생략 표시", false, "단순화", "kept", "label omit-note"),
    P("P6", "E", "체크박스 아이콘이 첫 관문 앞에만", true, "동의는 관문 1의 일부", "kept", "rect checkbox-icon x=10 (관문 1 x=25 앞), tone focus"),
  ], "G", ["step-tween"]),
  row("contract-formation-and-terms#F4", [
    P("P1", "I", "선택 확정해야 공개", true, "predict 약속", "kept", "Predict: 'Ask before explaining. reveal.marks stay hidden until answered'"),
    P("P2", "G", "공개 후 카드가 F3 관문 3 위치로 이동", true, "같은 공간에서 결론", "approx", "F3과 같은 pipeline 배치에서 reveal.params로 카드가 관문 3 무효 통에 나타나고 from:'clause-key'를 주지만, 이동 경로 애니메이션은 d.ts가 보장하지 않아 최종 위치로만 읽힌다(결론은 남음)"),
    P("P3", "X", "'어떠한 손해' 밑줄과 주석", true, "핵심 단어", "approx", "문장을 label 세 조각으로 나눠 밑줄 line을 데이터 좌표로 대략 맞춘다; 글자 폭을 모르므로 밑줄 길이가 단어와 정확히 맞지 않을 수 있다"),
    P("P4", "X", "'구체적 효력은 사안별 판단, 예시 결론'", true, "단정 방지", "kept", "label case-note"),
  ], "V", ["text-underline"]),
  row("contract-formation-and-terms#F5", [
    P("P1", "S", "두 패널 같은 레이아웃·조항, 차이는 표시 방식 하나", true, "변수 하나", "kept", "Compare 'Same figure under params a and b, side by side', a/b는 summary만 다름"),
    P("P2", "E", "차이 나는 요약 박스 강조색", true, "원인 먼저", "kept", "rect ui-summary tone focus"),
    P("P3", "X", "설명의무 면제 경우 생략 표시", true, "단순화", "kept", "label exempt-omit"),
    P("P4", "X", "'B가 항상 충분하다는 보장은 아님'", true, "과대해석 방지", "kept", "label b-caveat"),
  ], "V", []),
  row("contract-formation-and-terms#F6", [
    P("P1", "I", "카드 드래그 앤 드롭, 목표 달성 시 완료", true, "explore 목표", "kept", "Explore handles 'Dragging a handle mark sets params x, y to its data coordinates' + goal.done"),
    P("P2", "X", "놓을 때마다 조문 단위 근거", true, "이유 익히기", "kept", "놓인 통을 model이 판정, 근거 label을 카드 아래 표시"),
    P("P3", "E", "'사안에 따라 다름' 회색 영역 별도 표시", true, "불확정성", "kept", "rect bin-gray tone muted fill solid + label"),
    P("P4", "S", "F3 관문 배치 재사용", false, "부하 감소", "kept", "같은 gateX 좌표"),
  ], "V", []),
  row("contract-formation-and-terms#F7", [
    P("P1", "G", "저울 기울기 방향(이용자 쪽)", true, "결론 제5조 제2항", "kept", "beam line 끝점을 tilt로 계산, QuizReveal params {apply:true}"),
    P("P2", "X", "'기울기 정도는 의미 없음, 방향만 의미'", true, "정량 오독 방지", "kept", "label dir-only"),
    P("P3", "T", "원칙 적용 시 짧은 기울기 전환", false, "인과 강조", "ambiguous", "params 변경 시 전환 애니메이션을 d.ts가 말하지 않는다"),
    P("P4", "X", "객관적 해석 먼저, 애매할 때 적용", true, "적용 순서", "kept", "label order-note"),
  ], "V", ["param-tween"]),
  row("contract-formation-and-terms#F8", [
    P("P1", "S", "체크 항목이 해당 관문 위치에 핀 고정", true, "조치-근거 대응", "kept", "dot at gateX + label leader 'draws a line from the label to that point'"),
    P("P2", "X", "'법률 자문을 대신하지 않음'", true, "책임 범위", "kept", "label no-advice"),
    P("P3", "E", "체크박스 항목을 맨 앞에 강조", true, "학습 목표", "kept", "pin-1 tone focus weight bold, 가장 왼쪽"),
  ], "V", []),
];
