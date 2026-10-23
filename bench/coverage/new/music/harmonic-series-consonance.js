// @ts-check
/** @typedef {import("../../fragment").Prop} Prop */
/** @typedef {import("ltt").P} P */
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, polar, axis, line, path, label, dot, arrow, sweep, multiples, split, area } = api;
  /** @param {number} n @param {(i: number) => P} f @returns {P[]} */
  const pts = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i));
  /** Sethares 1993 dissonance of two partials. @param {number} f1 @param {number} f2 @param {number} a1 @param {number} a2 */
  const pair = (f1, f2, a1, a2) => { const s = 0.24 / (0.021 * Math.min(f1, f2) + 19), d = Math.abs(f2 - f1); return a1 * a2 * (Math.exp(-3.5 * s * d) - Math.exp(-5.75 * s * d)); };
  /** @param {number} cents @param {number} N */
  const diss = (cents, N, base = 261.6) => {
    const r = 2 ** (cents / 1200), fs = [];
    for (let n = 1; n <= N; n++) fs.push([base * n, 0.88 ** n], [base * r * n, 0.88 ** n]);
    let d = 0; for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++) d += pair(fs[i][0], fs[j][0], fs[i][1], fs[j][1]);
    return d;
  };
  const dmax = Math.max(...Array.from({ length: 1201 }, (_, c) => diss(c, 6)));
  const models = {
    rough: model({ cents: 700, partials: 6 }, ({ cents, partials }) => ({ d: diss(cents, partials) / dmax }), "Sethares 1993 (JASA 94:1218) Plomp–Levelt fit, base 261.6 Hz, amplitudes 0.88^n, normalized to 6-partial max"),
    beat: model({ f2: 444 }, ({ f2 }) => ({ fb: Math.abs(f2 - 440) }), "beat frequency |f1−f2|"),
    tune: model({ just: true }, ({ just }) => { const g = just ? 261.63 * 1.5 : 261.63 * 2 ** (7 / 12); return { beat: Math.abs(3 * 261.63 - 2 * g) }; }, "ET fifth 2^(7/12); 3rd harmonic of C4 vs 2nd of G4"),
    mix: model({ ratio: "3:2" }, ({ ratio }) => { const [p, q] = String(ratio).split(":").map(Number); return { p, q, period: q / 220 }; }, "common period = q cycles of 220 Hz"),
  };
  const figures = {
    mode: figure(cartesian({ x: [0, 1, "현 길이"], y: [-1.2, 1.2, ""], loop: { ms: 2000, span: [0, 1] } }), (m, t, { params }) => {
      const n = Number(params.n);
      /** @param {number} x */
      const y = (x) => n === 0 ? [1, 2, 3, 4, 5, 6].reduce((a, k) => a + Math.sin(k * Math.PI * x) * Math.cos(2 * Math.PI * k * t) / k, 0) : Math.sin(n * Math.PI * x) * Math.cos(2 * Math.PI * n * t) / n;
      return [
        line(pts(120, (i) => [i / 120, y(i / 120)]), { id: "string", tone: n === 0 ? "focus" : "series1" }),
        n > 0 && Array.from({ length: n + 1 }, (_, k) => dot([k / n, 0], { id: `node${k}`, size: "s" })),
        label([1, 1.1], n === 0 ? "합 = 실제 현" : `${n}×110 Hz`, { id: "freq", anchor: "ne" }),
        label([0, 1.1], "진폭 ×20 과장", { id: "exag", anchor: "nw" }),
      ];
    }),
    ladder: figure(cartesian({ x: [0, 10, ""], y: [65, 1100, "Hz"], log: "y", static: "C2의 1–16배음, 로그 진동수 축" }), () => {
      const names = ["C2", "C3", "G3", "C4", "E4", "G4", "B♭4 −31¢", "C5", "D5", "E5", "F♯5 −49¢", "G5", "A♭5 +41¢", "B♭5", "B5", "C6"];
      return [axis("y", { label: "진동수" }), names.map((nm, i) => {
        const f = 65.4 * (i + 1), c = [0, 1, 3, 7, 15].includes(i);
        return [line([[1, f], [6, f]], { id: `h${i + 1}`, weight: i < 6 ? "bold" : "thin", opacity: i < 6 ? 1 : 0.5, tone: c ? "focus" : "series1" }), label([6.3, f], `${i + 1}: ${nm}`, { id: `n${i + 1}`, anchor: "w" })];
      })];
    }),
    wave: figure(cartesian({ x: [0, 20, "ms"], y: [-2.2, 2.2, ""], static: "두 음 파형과 공통 주기" }), (m) => {
      const { p, q, period } = m.mix;
      return [axis("x", { label: "시간" }),
        line(pts(800, (i) => [i / 40, Math.sin(2 * Math.PI * 0.22 * i / 40)]), { id: "base", tone: "series1" }),
        line(pts(800, (i) => [i / 40, Math.sin(2 * Math.PI * 0.22 * (p / q) * i / 40) - 1.1 + 1.1]), { id: "upper", tone: "series2", opacity: 0.8 }),
        [1, 2, 3, 4].map((k) => k * period * 1000 <= 20 && sweep("x", k * period * 1000, { id: `rep${k}`, label: k === 1 ? "공통 주기" : undefined })),
        label([0.3, 2.1], `비 ${p}:${q}, 반복 = 기준음 ${q}주기`, { id: "ratio", anchor: "nw" })];
    }),
    partials: figure(cartesian({ x: [100, 3000, "Hz"], y: [-1.1, 1.1, ""], log: "x", static: "두 음의 1–10배음과 부딪힘" }), (m, t, { params }) => {
      const fa = 261.6, fb = 261.6 * 2 ** (Number(params.cents) / 1200);
      const A = pts(9, (i) => [fa * (i + 1), 1 / (i + 1)]), B = pts(9, (i) => [fb * (i + 1), -1 / (i + 1)]);
      /** @type {import("ltt").MarkTree[]} */
      const clash = [];
      A.forEach(([x], i) => B.forEach(([y], j) => {
        const d = Math.abs(x - y), cb = 0.175 * (x + y) / 2;
        if (d < 1) clash.push(line([[x, -1.05], [x, 1.05]], { id: `match${i}-${j}`, tone: "good", weight: "bold" }));
        else if (d < cb) clash.push(path([["M", x, 0], ["L", (x + y) / 2, 0.1], ["L", y, 0]], { id: `clash${i}-${j}`, tone: "bad", weight: "bold" }));
      }));
      return [axis("x", { label: "진동수" }), A.map(([x, a], i) => line([[x, 0], [x, a]], { id: `a${i}`, tone: "series1" })), B.map(([x, a], i) => line([[x, 0], [x, a]], { id: `b${i}`, tone: "series2" })), clash,
        label([110, 1.05], "임계대역 ≈ 중심주파수의 15–20%로 근사", { id: "cb-note", anchor: "nw" })];
    }),
    beats: figure(cartesian({ x: [0, 1, "s"], y: [-2.2, 2.2, ""], loop: { ms: 1000, span: [0, 1] } }), (m, t) => {
      const fb = m.beat.fb;
      return [axis("x", { label: "시간" }),
        line(pts(4000, (i) => { const s = i / 4000; return [s, Math.sin(2 * Math.PI * 440 * s) + Math.sin(2 * Math.PI * (440 + fb) * s)]; }), { id: "sum", weight: "thin" }),
        line(pts(400, (i) => [i / 400, 2 * Math.abs(Math.cos(Math.PI * fb * i / 400))]), { id: "env", tone: "focus" }),
        sweep("x", t, { id: "now" }),
        label([0.02, 2.1], (o) => `맥놀이 ${o.beat.fb} Hz · ${o.beat.fb < 15 ? "출렁임" : o.beat.fb <= 40 ? "거칠음" : "두 음"}`, { id: "fb", anchor: "nw" })];
    }),
    curve: figure(cartesian({ x: [0, 1200, "cent"], y: [0, 1, "상대 불협화도"], static: "Sethares 거칠기 곡선" }), (m, t, { params }) => {
      const N = Number(params.partials);
      return [axis("x", { label: "음정", ticks: [0, 316, 386, 498, 702, 884, 1200] }), axis("y"),
        line(pts(600, (i) => [i * 2, diss(i * 2, N) / dmax]), { id: "rough-curve", tone: "focus" }),
        [316, 386, 498, 702, 884, 1200].map((c) => dot([c, diss(c, N) / dmax], { id: `v${c}`, tone: c === 702 ? "good" : "ref" })),
        dot([100, diss(100, N) / dmax], { id: "peak", tone: "bad", size: "l", label: "단2도 부근 최고" }),
        dot([Number(params.cents), m.rough.d], { id: "cursor", tone: "focus", size: "l" }),
        label([1190, 0.97], "모델 계산값, 문화적 선호는 포함 안 함", { id: "model-note", anchor: "ne" })];
    }),
    circle12: figure(polar({ r: [0, 1.2, ""], theta: [0, 360], static: "12음 원 위 평균율과 순정비 위치" }), () => {
      /** @param {number} c */
      const th = (c) => 90 - c * 0.3;
      return [Array.from({ length: 12 }, (_, k) => dot([1, th(k * 100)], { id: `et${k}`, size: "s" })),
        [[702, 700, "5도 −1.96¢"], [386.3, 400, "장3도 +13.7¢"], [315.6, 300, "단3도 −15.6¢"]].map(([j, e, s]) => {
          const je = Number(e) + 5 * (Number(j) - Number(e));
          return [dot([1, th(je)], { id: `just${e}`, tone: "focus" }), arrow([1, th(je)], [1, th(Number(e))], { id: `err${e}`, tone: "warn", label: String(s) })];
        }),
        label([0.2, 0], "오차 ×5 확대", { id: "x5" }), label([0.4, 180], "피아노·DAW 기본값은 평균율", { id: "daw" })];
    }),
  };
  const all = {
    ...figures,
    modes: multiples("mode", { over: { n: [1, 2, 3, 4, 5, 6, 0] } }),
    ratios: multiples("wave", { over: { ratio: ["2:1", "3:2", "5:4", "16:15"] } }),
    linked: split(["curve", "partials"], { link: "cents" }),
  };
  /** @type {import("ltt").Scene[]} */
  const scenes = [
    { type: "predict", title: "어디서 부딪히나", ask: "C–G와 C–C# 중 부딪힘이 많은 쪽은?", figure: "partials", focus: ["a0", "b0"], params: { cents: 700 },
      input: { kind: "choice", options: [{ text: "C–C#", correct: true, params: { cents: 100 } }, { text: "C–G", feedback: "배음이 일치한다.", params: { cents: 700 } }] }, reveal: { say: "C–C#은 배음마다 임계대역 안에서 부딪힌다." } },
    { type: "explore", title: "맥놀이", say: "f2를 바꿔 보자.", figure: "beats", focus: ["env", "fb"], knobs: { f2: [440, 480, 1] } },
    { type: "explore", title: "거칠기 곡선", say: "커서를 끌어 골짜기를 찾자.", figure: "linked", focus: ["cursor"], knobs: { cents: [0, 1200, 1], partials: [1, 6, 1] }, handles: [{ mark: "cursor", x: "cents" }], goal: { say: "골짜기에 놓기", done: (m) => m.rough.d < 0.25 } },
    { type: "compare", title: "순정 5도 vs 평균율 5도", say: (m) => `평균율에서 3·2배음 쌍이 약 ${m.tune.beat.toFixed(1)} Hz로 맥놀이`, figure: "partials", focus: ["match2-1"], a: { cents: 701.955 }, b: { cents: 700 }, labels: ["순정", "평균율"] },
    { type: "quiz", items: [{ kind: "order", prompt: "협화 순(높음→낮음)", items: ["옥타브", "완전5도", "장3도", "증4도", "단2도"], objective: "o3" }] },
  ];
  return { models, figures: all, scenes };
};

const src = "bench/coverage/new/music/harmonic-series-consonance.brief.md";
/** @returns {Prop} */
const p = (/** @type {string} */ id, /** @type {Prop["cat"]} */ cat, /** @type {string} */ text, /** @type {boolean} */ essential, /** @type {string} */ why, /** @type {Prop["status"]} */ status, /** @type {string} */ note) =>
  status === "kept" ? { id, cat, text, essential, why, status, by: note } : { id, cat, text, essential, why, status, diff: note };
/** @param {number} n @param {Prop[]} props @param {string[]} candidates */
const row = (n, props, candidates = []) => /** @type {import("../../fragment").AuditRow} */ ({ fig: `harmonic-series-consonance#F${n}`, src, corpus: "new-b1", domain: "음악", props, verdict: props.some((q) => q.essential && (q.status === "lost" || q.status === "ambiguous")) ? "G" : "V", custom: [], candidates });

/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row(1, [
    p("P1", "G", "n차 모드가 현을 n등분", true, "", "kept", "line 좌표 sin(nπx), 마디 dot at k/n"),
    p("P2", "T", "n차가 정확히 n배 빠름, 1차 주기 2초", true, "", "kept", "Loop: loop maps span linearly onto ms (ms 2000, span 0–1 = 1차 1주기), cos(2πnt)"),
    p("P3", "Q", "진폭 ~1/n", false, "", "kept", "draw에서 /n"),
    p("P4", "S", "모드 small multiples + 하단 합성", true, "", "approx", "multiples는 사본 배치를 정하지 않아 세로 쌓기·합성이 맨 아래라는 순서가 보장되지 않는다"),
    p("P5", "X", "n×110 Hz", true, "", "kept", "label"),
    p("P6", "E", "진폭 ×20 과장 표시", true, "", "kept", "label"),
  ], ["multiples-layout"]),
  row(2, [
    p("P1", "Q", "로그 세로축 65–1100 Hz, 옥타브 등간격", true, "16×65.4=1046 Hz 범위 안", "kept", "cartesian log: 'y'"),
    p("P2", "G", "2·4·8·16배음이 C로 정렬", true, "", "kept", "log y에서 등간격 + 같은 tone focus"),
    p("P3", "X", "7·11·13배음 cent 오차", true, "검산: 7배음 −31, 11배음 −49(F♯ 기준), 13배음 +41(A♭ 기준) 맞음", "kept", "label"),
    p("P4", "E", "1–6배음 진하게", false, "", "kept", "weight bold, opacity"),
    p("P5", "I", "배음 선 탭 시 정보·재생", false, "", "lost", "mark 탭 입력과 소리가 없다"),
  ], ["staff-notation", "tap-select", "audio"]),
  row(3, [
    p("P1", "Q", "동일 시간축, 220 Hz, 창 20 ms", true, "", "kept", "multiples sharing frame, axes; x [0,20,'ms']"),
    p("P2", "G", "공통 주기마다 세로 점선(2:1 1주기, 3:2 2주기, 16:15 15주기)", true, "brief 모순: 16:15의 공통 주기는 15/220 s = 68 ms라 20 ms 창 밖이다(5:4도 18.2 ms에 한 번뿐)", "kept", "sweep x at q/220 s; 창 밖이면 그리지 않음"),
    p("P3", "S", "4개 음정 small multiples 같은 시간 스케일", true, "", "kept", "multiples: sharing frame, axes"),
    p("P4", "X", "비 p:q, 반복 = 기준음 q주기", true, "", "kept", "label"),
  ]),
  row(4, [
    p("P1", "Q", "로그 x 100–3000 Hz, 높이 1/n", true, "", "kept", "cartesian log: 'x'"),
    p("P2", "G", "일치·근접·멀리 구분", true, "brief 내부 불일치: '25~40 Hz'와 '중심주파수 15~20%'가 다르다. 17.5%로 구현", "kept", "일치 line tone good, 근접 path tone bad, 멀리는 표시 없음"),
    p("P3", "E", "부딪힘 쌍이 가장 먼저 보임", true, "", "approx", "tone bad·bold로 강조할 뿐 '가장 먼저 보이게'는 runtime 색 선택에 맡겨진다"),
    p("P4", "I", "predict C–G vs C–C# 선택 후 공개", true, "", "kept", "Predict input choice, Option.params"),
    p("P5", "X", "임계대역 근사 고지", true, "", "kept", "label"),
  ]),
  row(5, [
    p("P1", "Q", "맥놀이 = |f1−f2|", true, "", "kept", "model beat + 포락선 2|cos(π fb t)|"),
    p("P2", "T", "실제 속도 1초 창 루프", true, "", "kept", "Loop ms 1000 span [0,1] s, sweep at t"),
    p("P3", "I", "f2 슬라이더 440–480, 구간 표기", true, "", "kept", "Explore.knobs + label Text 함수"),
    p("P4", "X", "구간 라벨", false, "", "kept", "label"),
  ], ["audio"]),
  row(6, [
    p("P1", "Q", "Sethares 1993, 261.6 Hz, 0.88ⁿ, 0–1", true, "", "kept", "model rough, dmax로 정규화"),
    p("P2", "G", "골짜기가 316·386·498·702·884·1200 cent", true, "검산: 6:5=315.6, 5:4=386.3, 4:3=498.0, 3:2=702.0, 5:3=884.4 맞음", "kept", "axis ticks + 계산 곡선"),
    p("P3", "E", "100 cent 최고점 vs 702 골짜기", true, "", "kept", "dot tone bad size l / tone good"),
    p("P4", "I", "핸들 → F4 연동, 목표 골짜기 3개 찾기", true, "", "approx", "split이 params를 공유해 연동은 되지만 goal.done은 현재 출력만 보므로 '서로 다른 3개 찾기'의 누적을 셀 수 없어 한 골짜기 도달로 줄였다"),
    p("P5", "I", "배음 수 토글", false, "", "kept", "Explore.knobs partials"),
    p("P6", "X", "모델 계산값 고지", true, "", "kept", "label"),
  ], ["goal-history"]),
  row(7, [
    p("P1", "Q", "오차 5도 −1.96, 장3도 +13.7, 단3도 −15.6", true, "검산 맞음(평균율−순정)", "kept", "label + polar 각 0.3°/cent"),
    p("P2", "E", "오차 ×5 확대와 표기", true, "", "kept", "점 위치 = e + 5(j−e), label"),
    p("P3", "S", "F4를 순정/평균율 5도로 나란히, ~0.9 Hz 맥놀이", true, "검산: 3·261.63 − 2·392.00 = 0.89 Hz 맞음", "kept", "Compare: Same figure under params a and b, side by side"),
    p("P4", "X", "DAW 기본값 평균율", false, "", "kept", "label"),
  ]),
  row(8, [
    p("P1", "I", "카드를 곡선 위로 드래그, 제출 후 정답 위치 공개", true, "", "lost", "order 문항은 figure·reveal이 없고 DragInput은 mark 하나만 끈다"),
    p("P2", "Q", "공개 시 F6과 같은 세로 스케일", true, "", "lost", "order 문항에 그림을 붙일 수 없다"),
  ], ["multi-drag-place", "order-reveal"]),
];
