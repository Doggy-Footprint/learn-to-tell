/** @type {import("ltt").LessonFactory} */
export default (api) => {
  /** @param {number} g */
  const lin = (g) => {
    const c = g / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  /** @param {number} fg @param {number} bg */
  const ratioOf = (fg, bg) => {
    const a = lin(fg), b = lin(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const MISC = "세련됨은 그림자·그라데이션 같은 장식을 더해서 나온다";

  return api.lesson({
    meta: {
      title: "투박한 관리자 화면을 세련되게: 장식보다 간격·위계·색·상태",
      objectives: [
        { id: "o1", text: "4/8pt 간격 체계와 근접성으로 묶음을 만든다" },
        { id: "o2", text: "타입 스케일 비율로 글자 위계를 정한다" },
        { id: "o3", text: "중립색 + 강조색 하나로 색 역할을 나누고 대비비 4.5:1을 확인한다" },
        { id: "o4", text: "hover·focus·loading·empty 상태가 빠진 곳을 찾는다" },
      ],
      learner: {
        knows: ["컴포넌트 라이브러리 사용", "CSS margin·padding·font-size", "정렬과 그리드(애매함)"],
        misconceptions: [MISC],
      },
      domains: ["frontend", "ui-design"],
    },
    glossary: {
      근접성: "가까이 있는 요소를 한 묶음으로 읽는 지각 원리",
      "8pt 그리드": "모든 간격을 4나 8의 배수로만 쓰는 규칙",
      "타입 스케일": "본문 크기에 같은 비율을 거듭 곱해 만든 글자 크기 단계",
      대비비: "밝은 색과 어두운 색의 상대 휘도 비 (L1+0.05)/(L2+0.05), 1:1–21:1",
      "포커스 링": "키보드로 선택된 요소를 둘러 표시하는 테두리",
    },
    checks: [
      { id: "h2", model: "type", value: (o) => o.sizes[2], expect: 25, tol: 0.01 },
      { model: "type", at: { ratio: 1 }, value: (o) => o.sizes[4] - o.base, expect: 0, tol: 1e-9, limit: "ratio = 1 이면 모든 단계가 본문 크기", source: "size_k = base·ratio^k" },
      { id: "grey118", model: "contrast", expect: { ratio: [4.5, 4.6] } },
      { model: "contrast", at: { fg: 0 }, expect: { ratio: [20.9, 21.1] }, limit: "검정 on 흰색 = 21:1", source: "WCAG 2.1 contrast ratio 정의" },
      { model: "contrast", at: { fg: 255 }, expect: { ratio: [0.99, 1.01] }, limit: "같은 색 = 1:1", source: "WCAG 2.1 contrast ratio 정의" },
      { id: "good-gap", model: "spacing", at: { inner: 8, outer: 24 }, expect: { grouped: true, onGrid: true } },
      { model: "spacing", expect: { grouped: false } },
    ],
    models: {
      spacing: api.model(
        { inner: 16, outer: 18 },
        ({ inner, outer }) => ({ inner, outer, ratio: outer / inner, onGrid: inner % 4 === 0 && outer % 4 === 0, grouped: outer / inner >= 2 }),
        { illustrative: true },
      ),
      type: api.model(
        { base: 16, ratio: 1.25 },
        ({ base, ratio }) => {
          const sizes = [0, 1, 2, 3, 4].map((k) => base * ratio ** k);
          return { base, ratio, sizes, lh: Math.round((base * 1.5) / 4) * 4 };
        },
        "modular scale: size_k = base·ratio^k",
      ),
      contrast: api.model(
        { fg: 118, bg: 255 },
        ({ fg, bg }) => ({ fg, ratio: ratioOf(fg, bg) }),
        "WCAG 2.1 relative luminance (sRGB) and contrast ratio",
      ),
    },
    figures: {
      card: api.figure(
        api.cartesian({ x: [-20, 380, "px"], y: [-40, 270, "px"], static: "관리자 폼 카드: 라벨, 입력칸, 버튼과 그 사이 간격" }),
        (m, t, { params }) => {
          const { inner, outer } = m.spacing;
          const top = 210, lh = 12, ih = 30;
          const l1 = top, i1 = l1 - lh - inner, l2 = i1 - ih - outer, i2 = l2 - lh - inner, b = i2 - ih - outer;
          return api.mock("browser", [[20, 10], [340, 230]], [
            params.deco === true && api.rect([46, b - 34], [326, top + 6], { id: "shadow", tone: "muted", fill: "soft", label: "그림자" }),
            api.rect([40, l1 - lh], [120, l1], { id: "label1", tone: "muted", fill: "solid" }),
            api.rect([40, i1 - ih], [320, i1], { id: "input1" }),
            api.rect([40, l2 - lh], [120, l2], { id: "label2", tone: "muted", fill: "solid" }),
            api.rect([40, i2 - ih], [320, i2], { id: "input2" }),
            api.rect([40, b - 28], [130, b], { id: "btn", tone: "series1", fill: "solid" }),
            api.dim([330, l1 - lh], [330, i1], `${inner}`, { id: "gap-in", tone: "series2" }),
            api.dim([330, i1 - ih], [330, l2], `${outer}`, { id: "gap-out", tone: "series3" }),
            api.sweep("x", 40, { id: "edge", tone: "ref" }),
          ], { title: "회원 관리" });
        },
      ),
      scale: api.figure(
        api.cartesian({ x: [0, 5, ""], y: [0, 80, "px"], static: "본문부터 H1까지 글자 크기 막대" }),
        (m) => [
          api.axis("y", { label: "글자 크기" }),
          api.grid({ y: 8 }),
          ...["본문", "H4", "H3", "H2", "H1"].map((n, k) =>
            api.rect([k + 0.2, 0], [k + 0.8, m.type.sizes[k]], { id: `s${k}`, tone: k === 0 ? "ref" : "series1", fill: "soft", label: `${n} ${m.type.sizes[k].toFixed(0)}` }),
          ),
        ],
      ),
      contrast: api.figure(
        api.cartesian({ x: [0, 255, ""], y: [1, 21, ":1"], static: "흰 배경 위 회색 값별 대비비" }),
        (m) => [
          api.axis("x", { label: "글자 회색 값(0 검정)" }),
          api.axis("y", { label: "대비비" }),
          api.line(Array.from({ length: 52 }, (_, i) => /** @type {[number, number]} */ ([i * 5, ratioOf(i * 5, 255)])), { id: "curve", curve: "smooth" }),
          api.sweep("y", 4.5, { id: "aa", tone: "warn", label: "4.5:1" }),
          api.dot([m.contrast.fg, m.contrast.ratio], { id: "now", tone: m.contrast.ratio >= 4.5 ? "good" : "bad", label: `${m.contrast.ratio.toFixed(2)}:1` }),
        ],
      ),
      palette: api.figure(
        api.cells({ cols: 5, rows: 2, static: "중립 회색 5단계와 강조색 하나" }),
        () => [
          ...["배경", "선", "보조글", "본문", "제목"].map((n, i) => api.cell(i, 0, { id: `n${i}`, tone: "muted", fill: "solid", opacity: 0.15 + 0.2 * i, text: n })),
          api.cell(0, 1, { id: "accent", tone: "series1", fill: "solid", text: "주 버튼" }),
          api.cell(1, 1, { id: "danger", tone: "bad", fill: "solid", text: "삭제" }),
        ],
      ),
      states: api.figure(
        api.cartesian({ x: [0, 200, "px"], y: [0, 120, "px"], steps: ["기본", "hover", "focus", "loading", "empty"] }),
        (m, t, { step }) => [
          step < 4 && api.rect([60, 45], [140, 75], { id: "button", tone: "series1", fill: step === 1 ? "solid" : "soft", label: ["저장", "저장 (hover)", "저장", "저장 중"][step] }),
          step === 2 && api.rect([54, 39], [146, 81], { id: "ring", tone: "good", weight: "bold" }),
          step === 3 && api.arc([75, 60], 7, [0, 270], { id: "spinner", tone: "series1", weight: "bold" }),
          step === 4 && api.rect([20, 15], [180, 105], { id: "empty", tone: "muted", dash: true, label: "회원이 없습니다 · 회원 추가" }),
        ],
      ),
    },
    sections: [
      {
        concept: { id: "space", title: "정렬·간격·근접성", definition: "왼쪽 정렬선을 맞추고 4/8pt 간격으로 묶음 안은 좁게, 밖은 넓게", level: 2, leadsTo: ["type"] },
        scenes: [
          { type: "hook", title: "왜 투박해 보일까", say: "라벨과 입력칸 사이(16)와 항목 사이(18)가 거의 같다. 무엇이 무엇에 붙는지 눈이 헷갈린다.", figure: "card", focus: ["gap-in", "gap-out"] },
          {
            type: "predict",
            title: "첫 수정은 무엇일까",
            ask: "이 폼을 세련되게 만드는 첫 수정으로 가장 효과가 큰 것은?",
            figure: "card",
            focus: ["gap-in", "gap-out"],
            params: { deco: false },
            input: {
              kind: "choice",
              options: [
                { text: "카드에 그림자를 더한다", feedback: "그림자는 묶음 구조를 바꾸지 않는다. 간격이 모호하면 장식을 더해도 여전히 헷갈린다." },
                { text: "라벨-입력 간격은 좁히고 항목 사이는 넓힌다", correct: true },
                { text: "버튼에 그라데이션을 넣는다", feedback: "장식은 눈길만 끌 뿐 라벨이 어느 입력칸에 붙는지 알려 주지 않는다." },
              ],
            },
            reveal: { say: "안 8, 밖 24로 바꾸면 라벨이 제 입력칸에 붙어 보인다. 장식 없이 구조만 바꿨다.", params: { inner: 8, outer: 24 } },
            targets: MISC,
          },
          { type: "explain", title: "한 줄 정렬과 4/8 배수", say: "모든 왼쪽 끝을 한 정렬선에 맞추고, 간격은 4·8·16·24처럼 4의 배수만 쓴다. 고를 값이 줄어 화면 전체가 일정해진다.", figure: "card", focus: ["edge", "gap-in", "gap-out"], params: { inner: 8, outer: 24 } },
          { type: "define", term: "근접성", definition: "가까운 것은 한 묶음으로 읽힌다. 묶음 안 간격의 2배 이상을 묶음 사이에 두면 경계가 분명하다(경험칙).", figure: "card", focus: ["gap-in", "gap-out"] },
          {
            type: "explore",
            title: "간격 맞추기",
            say: "두 간격을 바꿔 보자. 숫자가 4의 배수인지도 보자.",
            figure: "card",
            focus: ["gap-in", "gap-out"],
            knobs: { inner: [2, 16, 2], outer: [8, 32, 2] },
            goal: { say: "밖 간격이 안 간격의 2배 이상이고 둘 다 4의 배수가 되게 하자.", done: (m) => m.spacing.grouped && m.spacing.onGrid },
          },
          {
            type: "quiz",
            items: [
              {
                kind: "choice",
                prompt: "라벨-입력 8px일 때 항목 사이 간격으로 알맞은 것은?",
                objective: "o1",
                options: [
                  { text: "10px", feedback: "8과 거의 같아 묶음이 흐려지고 4의 배수도 아니다." },
                  { text: "24px", correct: true },
                  { text: "13px", feedback: "4의 배수가 아니고 2배에도 못 미친다." },
                ],
              },
            ],
          },
        ],
      },
      {
        concept: { id: "type", title: "타이포 위계", definition: "본문 크기에 일정 비율을 거듭 곱해 제목 크기를 정하고 굵기·행간으로 보탠다", level: 3, requires: ["space"], leadsTo: ["color"] },
        scenes: [
          {
            type: "predict",
            title: "제목이 안 보이는 이유",
            ask: "본문 16px에서 단계마다 1.067배씩 키우면 H1(4단계)은 대략 몇 px일까?",
            figure: "scale",
            focus: ["s4"],
            params: { ratio: 1.067 },
            input: {
              kind: "choice",
              options: [
                { text: "약 21px", correct: true },
                { text: "약 32px", feedback: "1.067⁴ ≈ 1.30이라 16 × 1.30 ≈ 21이다." },
                { text: "약 64px", feedback: "4배는 비율 2일 때다." },
              ],
            },
            reveal: { say: "H1이 21px뿐이라 본문과 차이가 작다. 위계가 흐린 화면이 투박해 보이는 흔한 이유다." },
          },
          { type: "define", term: "타입 스케일", definition: "size_k = 본문 × 비율^k. 비율 하나로 모든 제목 크기가 정해진다.", figure: "scale", focus: ["s0", "s1", "s2", "s3", "s4"] },
          {
            type: "compare",
            title: "비율 1.067 대 1.333",
            say: "작은 비율은 단계가 뭉치고, 큰 비율은 제목이 또렷하다. 관리자 화면처럼 정보가 많으면 1.2–1.25 근처가 흔하다.",
            figure: "scale",
            focus: ["s4", "s0"],
            a: { ratio: 1.067 },
            b: { ratio: 1.333 },
            labels: ["1.067", "1.333"],
          },
          {
            type: "explore",
            title: "스케일 만들기",
            say: (m) => `본문 행간은 크기의 1.5배를 4 배수로 맞춰 ${m.type.lh}px. 크기 대신 굵기(600)로 위계를 보탤 수도 있다.`,
            figure: "scale",
            focus: ["s0", "s4"],
            knobs: { base: [12, 20, 1], ratio: [1.05, 1.4, 0.01] },
            params: { ratio: 1.1 },
            goal: { say: "H1이 본문의 2배 이상이 되게 해 보자.", done: (m) => m.type.sizes[4] >= 2 * m.type.base },
          },
          {
            type: "quiz",
            items: [{ kind: "numeric", prompt: "본문 16px, 비율 1.25일 때 H2(2단계)는 몇 px?", answer: { check: "h2" }, tol: 0.5, unit: "px", objective: "o2" }],
          },
        ],
      },
      {
        concept: { id: "color", title: "색 역할과 대비", definition: "대부분은 중립 회색, 강조색은 주 행동 하나에만. 글자는 배경과 4.5:1 이상", level: 3, requires: ["type"], leadsTo: ["state"] },
        scenes: [
          {
            type: "predict",
            title: "연한 회색 글자",
            ask: "흰 배경에 회색 값 160(#a0a0a0) 글자. 본문 기준 4.5:1을 넘을까?",
            figure: "contrast",
            focus: ["aa"],
            params: { fg: 160 },
            input: {
              kind: "choice",
              options: [
                { text: "넘는다", feedback: "약 2.6:1로 크게 못 미친다." },
                { text: "못 넘는다", correct: true },
              ],
            },
            reveal: { say: (m) => `${m.contrast.ratio.toFixed(1)}:1. 세련돼 보이려 글자를 흐리게 하면 읽기 어려워진다.`, marks: ["now", "curve"] },
          },
          { type: "define", term: "대비비", definition: "(밝은 휘도 + 0.05) / (어두운 휘도 + 0.05). WCAG AA는 본문 4.5:1, 큰 글자 3:1.", figure: "contrast", focus: ["curve", "aa"] },
          {
            type: "explain",
            title: "중립색 + 강조색 하나",
            say: "배경·선·보조글·본문·제목은 회색 단계로 나누고, 색은 주 버튼 하나에만 쓴다. 빨강은 삭제 같은 위험에만 남긴다.",
            figure: "palette",
            focus: ["accent", "n0", "n1", "n2", "n3", "n4"],
          },
          {
            type: "explore",
            title: "가장 연한 보조글",
            say: "회색 값을 올리면 글자가 연해진다.",
            figure: "contrast",
            focus: ["now", "aa"],
            knobs: { fg: [0, 200, 1] },
            params: { fg: 150 },
            goal: { say: "4.5:1을 지키면서 회색 값을 110 이상으로 올려 보자.", done: (m) => m.contrast.ratio >= 4.5 && m.contrast.fg >= 110 },
          },
        ],
      },
      {
        concept: { id: "state", title: "상태와 피드백", definition: "버튼과 목록은 hover·focus·loading·empty마다 다른 모습을 보여 지금 무슨 일이 일어나는지 알린다", level: 4, requires: ["color"] },
        scenes: [
          {
            type: "predict",
            title: "저장을 눌렀는데",
            ask: "저장 버튼을 누른 뒤 2초간 아무 변화가 없다. 무엇이 빠졌나?",
            figure: "states",
            focus: ["button"],
            input: {
              kind: "choice",
              options: [
                { text: "버튼 그림자", feedback: "그림자는 요청이 진행 중인지 알려 주지 않는다." },
                { text: "loading 상태", correct: true },
                { text: "더 큰 글씨", feedback: "크기는 진행 여부와 무관하다." },
              ],
            },
            reveal: { say: "누른 즉시 버튼을 '저장 중'과 스피너로 바꾸고 다시 누르지 못하게 막는다." },
          },
          {
            type: "steps",
            title: "버튼 하나의 다섯 모습",
            figure: "states",
            steps: [
              { say: "기본: 강조색 버튼.", focus: ["button"] },
              { say: "hover: 채움을 진하게 해 누를 수 있음을 알린다.", focus: ["button"] },
              { say: "focus: Tab으로 왔을 때 바깥 테두리를 그린다.", focus: ["button", "ring"] },
              { say: "loading: 스피너와 '저장 중'.", focus: ["button", "spinner"] },
              { say: "empty: 빈 목록은 이유와 다음 행동을 보여 준다.", focus: ["empty"] },
            ],
          },
          { type: "define", term: "포커스 링", definition: "키보드로 고른 요소를 둘러 그리는 테두리. outline: none으로 지우면 키보드 사용자가 길을 잃는다.", focus: [] },
          {
            type: "quiz",
            items: [
              {
                kind: "classify",
                prompt: "각 상황에 필요한 상태",
                bins: ["hover", "focus", "loading", "empty"],
                items: [
                  { text: "마우스를 올린 행", bin: "hover" },
                  { text: "Tab으로 이동한 버튼", bin: "focus" },
                  { text: "목록 요청 중", bin: "loading" },
                  { text: "검색 결과 0건", bin: "empty" },
                ],
                objective: "o4",
              },
            ],
          },
        ],
      },
    ],
    quiz: [
      {
        kind: "choice",
        prompt: "주문 상세 화면이 '밋밋하다'는 피드백. 먼저 볼 곳은?",
        objective: "o1",
        transfer: true,
        options: [
          { text: "간격 묶음과 제목 크기 단계", correct: true },
          { text: "모든 카드에 그라데이션 배경", feedback: "장식은 구조를 고치지 않는다. 묶음과 위계가 먼저다." },
          { text: "버튼마다 다른 색", feedback: "강조색이 많으면 무엇이 주 행동인지 사라진다." },
        ],
      },
      { kind: "numeric", prompt: "흰 배경 위 #767676(회색 118) 글자의 대비비는? (소수 둘째 자리까지)", answer: { check: "grey118" }, tol: 0.05, unit: ":1", objective: "o3" },
      { kind: "order", prompt: "이 수업에서 배운 순서대로 놓기: 정렬이 가장 아래 단, 상태가 맨 위 단", items: ["정렬선 맞추기", "4/8 간격과 묶음", "타입 스케일", "중립색 + 강조색", "상태 추가"], objective: "o1" },
      {
        kind: "choice",
        prompt: "설정 페이지에 파랑 버튼 3개, 초록 링크, 주황 배지가 있다. 고칠 방향은?",
        objective: "o3",
        transfer: true,
        options: [
          { text: "주 행동 하나만 강조색, 나머지는 중립색", correct: true },
          { text: "색마다 그림자를 더해 구분", feedback: "색 역할이 겹친 문제는 그대로다." },
        ],
      },
    ],
    summary: { figures: ["card", "scale", "contrast", "states"], say: "세련됨은 장식이 아니라 정렬·간격, 크기 위계, 절제된 색, 빠짐없는 상태에서 나온다." },
  });
};
