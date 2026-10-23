// @ts-check
/** @typedef {import("../../fragment").Prop} Prop */
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, line, path, label, circle, dot, rect, arrow, inset, multiples, split } = api;
  const TOP = "ATGCCGTA";
  /** @type {Record<string, string>} */
  const PAIR = { A: "T", T: "A", G: "C", C: "G" };
  /** @type {import("ltt").Tone[]} */
  const TONES = ["series1", "series2", "series3", "series4", "series5", "series6", "series1", "series2"];
  const models = {
    fork: model({ speed: 1000, gap: 1500, dur: 1 }, ({ speed, gap, dur }) => {
      const len = speed * dur, frags = Math.floor(len / gap);
      return { len, frags, nicks: Math.max(0, frags - 1) };
    }, "fragments = travelled length / priming interval; E. coli fork ~1000 nt/s, human ~50 nt/s; Okazaki 1000–2000 nt (E. coli), 100–200 nt (eukaryote) (Alberts, MBoC ch.5)"),
    ms: model({ model: "semi" }, ({ model }) => ({
      bands: [0, 1, 2].map((n) => model === "semi"
        ? (n === 0 ? { heavy: 1, hybrid: 0, light: 0 } : { heavy: 0, hybrid: 2 / 2 ** n, light: 1 - 2 / 2 ** n })
        : { heavy: 1 / 2 ** n, hybrid: 0, light: 1 - 1 / 2 ** n }),
    }), "Meselson & Stahl 1958, PNAS 44:671; semiconservative hybrid fraction 2/2^n for n≥1"),
  };
  const figures = {
    ladder: figure(cartesian({ x: [0, 10, ""], y: [0, 10, ""], static: "역평행 8 bp 사다리와 두 가닥 5'→3' 문자열" }), () => [
      arrow([0.5, 8], [9.5, 8], { id: "top-dir", tone: "series1", label: "5'→3'" }),
      arrow([9.5, 6], [0.5, 6], { id: "bot-dir", tone: "series2", label: "5'→3'" }),
      label([0.2, 8.5], "5'", { id: "t5" }), label([9.8, 8.5], "3'", { id: "t3" }), label([0.2, 5.5], "3'", { id: "b3" }), label([9.8, 5.5], "5'", { id: "b5" }),
      [...TOP].map((b, i) => {
        const x = 1 + i * 1.1, j = TOP.length - 1 - i;
        return [
          label([x, 8], b, { id: `tb${i}`, tone: TONES[i] }), label([x, 6], PAIR[b], { id: `bb${i}`, tone: TONES[i] }),
          line([[x, 7.8], [x, 6.2]], { id: `rung${i}`, tone: TONES[i] }),
          label([x, 3], b, { id: `ts${i}`, tone: TONES[i] }), label([1 + j * 1.1, 1.5], PAIR[b], { id: `bs${j}`, tone: TONES[i] }),
          line([[x, 2.8], [1 + j * 1.1, 1.7]], { id: `idx${i}`, tone: TONES[i], weight: "thin", label: i === 0 ? "i ↔ n−1−i" : undefined }),
        ];
      }),
      label([0.2, 9.7], "나선 꼬임을 펼친 모식도", { id: "unwound", anchor: "nw" }),
    ]),
    backbone: figure(cartesian({ x: [0, 12, ""], y: [0, 10, ""], aspect: "equal", static: "디옥시리보스 탄소 번호와 포스포다이에스터 결합" }), () => {
      /** @param {number} y0 @param {string} k */
      const sugar = (y0, k) => {
        const pts = /** @type {import("ltt").P[]} */ ([[5, y0], [6.5, y0 + 0.8], [6, y0 + 2.2], [4, y0 + 2.2], [3.5, y0 + 0.8]]);
        return [
          path([["M", ...pts[0]], ...pts.slice(1).map((q) => /** @type {import("ltt").PathCmd} */ (["L", ...q])), ["Z"]], { id: `ring${k}` }),
          label([6.9, y0 + 0.8], "1'", { id: `c1${k}` }), label([6.3, y0 + 2.5], "2'", { id: `c2${k}` }), label([3.7, y0 + 2.5], "3'", { id: `c3${k}` }),
          label([3.1, y0 + 0.6], "4'", { id: `c4${k}` }), line([[3.5, y0 + 0.8], [2.5, y0 - 0.2]], { id: `c45${k}` }), label([2.2, y0 - 0.4], "5'", { id: `c5${k}` }),
          circle([1.5, y0 - 0.8], 0.4, { id: `P${k}`, label: "P" }),
          line([[4, y0 + 2.2], [3.5, y0 + 3.2]], { id: `oh-bond${k}` }),
        ];
      };
      return [sugar(0.5, "a"), sugar(5.5, "b"),
        label([3.5, 3.6], "3'-OH", { id: "oh", tone: "focus", weight: "bold" }),
        path([["M", 3.5, 3.7], ["Q", 2, 4.5, 1.5, 4.7]], { id: "phosphodiester", tone: "focus", label: "포스포다이에스터 결합" }),
        label([11.8, 9.8], "결합 각·길이는 정확하지 않음", { id: "geom-note", anchor: "ne" })];
    }),
    forkPredict: figure(cartesian({ x: [0, 20, "nt"], y: [0, 10, ""], static: "Y자 분기점과 두 주형 가닥 방향" }), (m, t, { params }) => [
      path([["M", 0, 6], ["L", 10, 5.5], ["L", 20, 9]], { id: "tmpl-top" }), path([["M", 0, 4], ["L", 10, 4.5], ["L", 20, 1]], { id: "tmpl-bot" }),
      arrow([2, 5], [8, 5], { id: "fork-dir", label: "분기점 진행" }),
      label([20, 9.6], "3'", { id: "tt3" }), label([0, 6.6], "5'", { id: "tt5" }), label([20, 0.4], "5'", { id: "bt5" }), label([0, 3.4], "3'", { id: "bt3" }),
      params.guess === "both-cont" && [arrow([11, 6.5], [19, 9.3], { id: "g-top", tone: "series4" }), arrow([11, 3.5], [19, 0.7], { id: "g-bot", tone: "series4" })],
      params.guess === "correct" && [arrow([11, 6.5], [19, 9.3], { id: "g-top2", tone: "series4" }), arrow([19, 0.7], [15, 2.2], { id: "g-bot2", tone: "series4" })],
      arrow([11, 5.8], [19, 8.4], { id: "ans-lead", tone: "good", label: "연속" }),
      arrow([18.5, 1.8], [15.5, 2.9], { id: "ans-lag1", tone: "good" }), arrow([15, 3.0], [12, 4.1], { id: "ans-lag2", tone: "good", label: "조각" }),
    ]),
    polStep: figure(cartesian({ x: [0, 12, "nt"], y: [0, 6, ""], steps: ["dNTP 접근", "염기쌍 확인", "결합 형성·PPi 방출", "한 칸 전진"] }), (m, t, { step }) => [
      arrow([11, 1], [1, 1], { id: "tmpl", label: "주형 3'→5'" }),
      line([[1, 2], [5 + (step === 3 ? 1 : 0), 2]], { id: "primer", tone: "focus", weight: "bold", label: "프라이머 5'→3'" }),
      dot([5, 2], { id: "end3", label: "3'-OH" }),
      step < 3 && circle([6, step === 0 ? 4 : 2], 0.35, { id: "dntp", tone: "series2", fill: "solid", label: "dNTP" }),
      step === 2 && dot([7, 4], { id: "ppi", tone: "muted", label: "PPi" }),
      label([0.5, 3], "✕ 5' 끝에는 붙일 수 없음", { id: "no5" }),
      label([11.5, 5.7], "오류율 ~10⁻⁷/염기(교정), ~10⁻⁹–10⁻¹⁰(불일치 복구)", { id: "err", anchor: "ne" }),
    ]),
    forkLoop: figure(cartesian({ x: [0, 4000, "nt"], y: [0, 10, ""], loop: { ms: 8000, span: [0, 3] } }), (m, t) => forkMarks(t, "l")),
    forkSteps: figure(cartesian({ x: [0, 4000, "nt"], y: [0, 10, ""], steps: ["헬리케이스 전진", "프라이메이스 RNA 프라이머", "오카자키 절편 합성", "프라이머 제거·리게이스"] }), (m, t, { step }) => forkMarks(step, "s")),
    explorer: figure(cartesian({ x: [0, 2000, "nt"], y: [0, 4, ""], static: "지정 시간 동안의 선도 가닥 길이, 절편, 틈" }), (m) => [
      axis("x", { label: "진행 길이" }),
      line([[0, 3], [m.fork.len, 3]], { id: "lead-len", tone: "series1", label: (o) => `선도 ${o.fork.len} nt` }),
      Array.from({ length: m.fork.frags }, (_, i) => line([[i * (m.fork.len / Math.max(1, m.fork.frags)), 1.5], [(i + 1) * (m.fork.len / Math.max(1, m.fork.frags)) - 10, 1.5]], { id: `frag${i}`, tone: "series2" })),
      Array.from({ length: m.fork.nicks }, (_, i) => dot([(i + 1) * (m.fork.len / m.fork.frags), 1.5], { id: `nick${i}`, tone: "warn" })),
      label([1000, 0.5], (o) => `절편 ${o.fork.frags}개 · 틈 ${o.fork.nicks}개`, { id: "counts" }),
    ]),
    msPanel: figure(cartesian({ x: [0, 10, ""], y: [0, 3, "세대"], static: "세대별 DNA 분자와 원심분리 띠" }), (m, t, { params }) => [
      params.model === "semi" && rect([0, 0], [10, 3], { id: "match", tone: "good", fill: "soft", opacity: 0.2, label: "실제 데이터와 일치" }),
      m.ms.bands.map((/** @type {{heavy:number,hybrid:number,light:number}} */ b, /** @type {number} */ n) => {
        const y = 2.5 - n;
        return [
          label([0.5, y], `${n}세대`, { id: `gen${n}` }),
          b.heavy > 0 && rect([6, y - 0.1], [6 + 0.8 * b.heavy * 3, y + 0.1], { id: `heavy${n}`, fill: "solid", tone: "series1" }),
          b.hybrid > 0 && rect([7.2, y - 0.1], [7.2 + 0.8 * b.hybrid * 3, y + 0.1], { id: `hyb${n}`, fill: "solid", tone: "series3" }),
          b.light > 0 && rect([8.4, y - 0.1], [8.4 + 0.8 * b.light * 3, y + 0.1], { id: `light${n}`, fill: "solid", tone: "series2" }),
          line([[2, y + 0.1], [5, y + 0.1]], { id: `mol${n}a`, tone: n === 0 || params.model === "cons" ? "series1" : "series1", weight: "bold" }),
          line([[2, y - 0.1], [5, y - 0.1]], { id: `mol${n}b`, tone: n === 0 ? "series1" : "series2", weight: "bold" }),
        ];
      }),
      label([7.8, 2.95], "띠 위치: 밀도 순서만 의미, 거리 축척 아님", { id: "band-note" }),
    ]),
    quizBubble: figure(cartesian({ x: [0, 20, ""], y: [0, 10, ""], static: "양방향 복제 거품과 주형 방향, 네 영역 A–D" }), () => [
      path([["M", 0, 5], ["L", 6, 5], ["Q", 10, 9, 14, 5], ["L", 20, 5]], { id: "upper" }), path([["M", 0, 5], ["L", 6, 5], ["Q", 10, 1, 14, 5], ["L", 20, 5]], { id: "lower" }),
      label([0, 5.6], "5'→", { id: "u5" }), label([0, 4.4], "3'←", { id: "l3" }),
      label([7, 7.4], "A", { id: "A" }), label([13, 7.4], "B", { id: "B" }), label([7, 2.6], "C", { id: "C" }), label([13, 2.6], "D", { id: "D" }),
      arrow([9, 5], [6.5, 5], { id: "lf" }), arrow([11, 5], [13.5, 5], { id: "rf" }),
    ]),
    chain: figure(cartesian({ x: [0, 48, ""], y: [0, 20, ""], static: "역평행→3'에만→선도/지연→역상보 인과 사슬" }), () =>
      [["ladder", "두 가닥은 반대 방향이다"], ["polStep", "중합효소는 3' 끝에만 붙인다"], ["forkSteps", "그래서 한 가닥은 조각으로 자란다"], ["ladder", "그래서 다른 가닥은 역상보로 읽힌다"]].map(([f, s], i) => [
        inset(f, { at: [[i * 12 + 1, 7], [i * 12 + 10, 17]], id: `th${i}` }), label([i * 12 + 5.5, 5], s, { id: `cs${i}` }),
        i < 3 && arrow([i * 12 + 10.2, 12], [i * 12 + 12.8, 12], { id: `ca${i}` })])),
  };
  /** @param {number} t @param {string} k @returns {import("ltt").MarkTree} */
  function forkMarks(t, k) {
    const fx = 1000 + 1000 * t; // E. coli ~1000 nt/s
    const frags = Math.floor((fx - 1000) / 1000);
    return [
      axis("x", { label: "위치" }),
      line([[0, 5.3], [fx, 5.3]], { id: `dup${k}`, weight: "bold" }),
      line([[fx, 5.5], [4000, 8]], { id: `ptop${k}` }), line([[fx, 4.5], [4000, 2]], { id: `pbot${k}` }),
      circle([fx, 5], 120, { id: `helicase${k}`, label: "헬리케이스" }),
      circle([fx + 400, 9], 100, { id: `topo${k}`, label: "토포아이소머레이스" }),
      dot([fx - 300, 2.8], { id: `ssb${k}`, label: "SSB" }),
      arrow([0, 6.2], [fx - 150, 6.2], { id: `lead${k}`, tone: "series1", label: "선도 가닥" }),
      Array.from({ length: frags + 1 }, (_, i) => [
        rect([fx - 150 - (i + 1) * 1000 + 950, 3.6], [fx - 150 - (i + 1) * 1000 + 1000, 3.9], { id: `rna${k}${i}`, tone: "series3", fill: "solid" }),
        arrow([fx - 150 - i * 1000 - 50, 3.75], [fx - 150 - (i + 1) * 1000 + 30, 3.75], { id: `oka${k}${i}`, tone: "series2", label: i === 0 ? "오카자키 절편(분기점 반대 방향)" : undefined }),
      ]),
      label([0, 9.8], "대장균 ~1000 nt/s, 사람 ~50 nt/s; 절편 1000–2000 nt(대장균), 100–200 nt(진핵)", { id: `num${k}`, anchor: "nw" }),
      label([0, 0.4], "효소 크기·DNA 길이 비례 아님, 지연 가닥 고리(트롬본) 생략", { id: `scale${k}`, anchor: "sw" }),
    ];
  }
  const all = {
    ...figures,
    ms2: multiples("msPanel", { over: { model: ["semi", "cons"] } }),
    forkBoth: split(["forkSteps", "forkLoop"]),
  };
  /** @type {import("ltt").Scene[]} */
  const scenes = [
    { type: "predict", title: "분기점에서 두 가닥", ask: "두 주형 위 새 가닥 방향과 연속/조각은?", figure: "forkPredict", focus: ["tmpl-top", "tmpl-bot"],
      input: { kind: "choice", options: [{ text: "둘 다 분기점 방향 연속", feedback: "중합효소는 3' 끝에만 붙인다.", params: { guess: "both-cont" } }, { text: "위 연속, 아래 반대 방향 조각", correct: true, params: { guess: "correct" } }] },
      reveal: { say: "아래 가닥은 분기점 반대로 조각조각 자란다.", marks: ["ans-lead", "ans-lag1", "ans-lag2"] }, targets: "두 가닥 모두 분기점 방향으로 연속 복제된다" },
    { type: "steps", title: "중합효소 한 걸음", figure: "polStep", steps: [{ say: "dNTP 접근", focus: ["dntp"] }, { say: "염기쌍 확인", focus: ["dntp"] }, { say: "결합, PPi 방출", focus: ["ppi"] }, { say: "한 칸 전진", focus: ["primer", "end3"] }] },
    { type: "explore", title: "분기점 탐색", say: "속도와 간격을 바꿔 보자.", figure: "explorer", focus: ["frag0", "counts"], knobs: { speed: [50, 1000, 10], gap: [100, 2000, 50] }, goal: { say: "1초에 절편 ~1개", done: (m) => m.fork.frags === 1 } },
    { type: "compare", title: "반보존 vs 보존", say: "1세대 중간 띠 하나.", figure: "msPanel", focus: ["match"], a: { model: "semi" }, b: { model: "cons" }, labels: ["반보존적", "보존적"] },
    { type: "quiz", items: [{ kind: "choice", prompt: "지연 가닥 영역은?", objective: "o4", figure: "quizBubble", options: [{ text: "A와 D", correct: true }, { text: "A와 B", feedback: "양쪽 분기점에서 선도/지연이 뒤바뀐다." }, { text: "C와 D", feedback: "같은 주형이라도 분기점 방향이 반대다." }, { text: "B와 C", feedback: "주형 방향을 다시 보자." }], reveal: { marks: ["lf", "rf"] } }] },
  ];
  return { models, figures: all, scenes };
};

const src = "bench/coverage/new/biology/dna-replication.brief.md";
/** @returns {Prop} */
const p = (/** @type {string} */ id, /** @type {Prop["cat"]} */ cat, /** @type {string} */ text, /** @type {boolean} */ essential, /** @type {string} */ why, /** @type {Prop["status"]} */ status, /** @type {string} */ note) =>
  status === "kept" ? { id, cat, text, essential, why, status, by: note } : { id, cat, text, essential, why, status, diff: note };
/** @param {number} n @param {Prop[]} props @param {string[]} candidates */
const row = (n, props, candidates = []) => /** @type {import("../../fragment").AuditRow} */ ({ fig: `dna-replication#F${n}`, src, corpus: "new-b1", domain: "생명과학", props, verdict: props.some((q) => q.essential && (q.status === "lost" || q.status === "ambiguous")) ? "G" : "V", custom: [], candidates });

/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row(1, [
    p("P1", "G", "두 가닥 화살표 방향 반대", true, "", "kept", "arrow(from,to) 방향이 데이터 좌표로 반대"),
    p("P2", "I", "염기 클릭으로 바꾸기", false, "", "lost", "mark를 탭해 값을 바꾸는 입력이 없다(knobs·handles·predict input뿐)"),
    p("P3", "E", "염기쌍과 i↔n−1−i를 같은 색으로 연결", true, "", "approx", "series 톤이 6개뿐이라 8쌍 중 2쌍이 색을 재사용하고 연결선으로만 구분된다"),
    p("P4", "X", "펼친 모식도 표기", true, "", "kept", "label"),
  ], ["tap-select"]),
  row(2, [
    p("P1", "G", "5' 인산과 3' OH가 고리 반대편", true, "", "kept", "path/line 데이터 좌표, aspect equal"),
    p("P2", "E", "3'-OH 강조 색", true, "", "kept", "tone focus, weight bold"),
    p("P3", "X", "탄소 번호", true, "", "kept", "label"),
    p("P4", "Q", "결합 각·길이 부정확 표기", true, "", "kept", "label"),
  ]),
  row(3, [
    p("P1", "I", "각 주형 방향·연속/조각 선택", true, "", "approx", "두 주형 × 방향 × 연속/조각을 따로 고르지 못하고 조합 선택지 하나를 고른다(그려 넣기 아님)"),
    p("P2", "G", "공개 시 학습자 답과 정답 겹침", true, "", "ambiguous", "Option.params는 'while this option is selected'라고만 해 공개 뒤에도 학습자 답 화살표가 남는지 d.ts가 말하지 않는다"),
    p("P3", "X", "주형 끝 5'/3'", true, "", "kept", "label"),
  ], ["answer-overlay"]),
  row(4, [
    p("P1", "T", "4단계 진행", true, "", "kept", "TimeSpec steps + Steps scene"),
    p("P2", "G", "역평행으로 3' 방향으로만 자람", true, "", "kept", "arrow 방향 + step 3에서 primer 끝 x 증가"),
    p("P3", "E", "프라이머 없으면 시작 불가", false, "", "lost", "그리지 않았다; 별도 상태가 필요"),
    p("P4", "Q", "오류율 표기", false, "", "kept", "label"),
  ]),
  row(5, [
    p("P1", "T", "단계 모드와 연속 루프 모드 전환", true, "", "approx", "한 Figure는 TimeSpec이 정확히 하나라 전환 대신 steps 그림과 loop 그림을 split으로 나란히 둔다"),
    p("P2", "G", "지연 절편 합성 방향이 분기점 진행과 반대", true, "", "kept", "arrow from→to가 −x, 분기점 fx는 +x로 이동"),
    p("P3", "E", "선도/지연/RNA 프라이머 세 색", true, "", "kept", "Tone series1–6 stay mutually distinguishable"),
    p("P4", "Q", "분기점 속도·절편 길이 교과서 값", true, "", "kept", "loop span 0–3 s에 fx = 1000 nt/s·t, 절편 1000 nt + label"),
    p("P5", "X", "비례 아님·트롬본 생략 표기", true, "", "kept", "label"),
    p("P6", "S", "염색체 전체 위치 inset", false, "", "lost", "그리지 않았다(별도 거품 그림 필요)"),
  ], ["timespec-switch"]),
  row(6, [
    p("P1", "I", "속도 50~1000, 간격 100~2000 nt 슬라이더", true, "", "kept", "Explore.knobs [min,max,step]"),
    p("P2", "Q", "절편 수 = 진행 길이/간격, 선형 nt 축", true, "", "kept", "model fork + cartesian x unit nt"),
    p("P3", "T", "목표 대장균 조건", false, "", "kept", "Explore.goal.done"),
    p("P4", "E", "틈을 점으로", false, "", "kept", "dot tone warn"),
  ]),
  row(7, [
    p("P1", "S", "좌우 두 모델, 세대 행 정렬", true, "", "kept", "multiples sharing frame, axes"),
    p("P2", "Q", "중간 2/2^n, 가벼움 1−2/2^n", true, "brief 식은 n≥1에서만 맞다(n=0이면 중간 2). 0세대는 무거움 1로 따로 그렸다", "kept", "model ms → rect 길이 비례"),
    p("P3", "E", "실제 데이터와 일치하는 패널 강조", true, "", "kept", "params.model==='semi'인 사본에만 rect tone good"),
    p("P4", "X", "띠 위치 밀도 순서만 의미", true, "", "kept", "label"),
  ]),
  row(8, [
    p("P1", "G", "거품 양쪽 분기점에서 선도/지연 뒤바뀜", true, "", "kept", "path·arrow 좌표로 양방향 분기점; 선택지 피드백"),
    p("P2", "I", "네 영역 클릭 선택", true, "", "approx", "그림 영역을 직접 누르지 않고 A–D 라벨을 보고 선택지 목록에서 고른다"),
  ], ["region-pick"]),
  row(9, [
    p("P1", "S", "왼→오 사슬, 앞 그림 축소판", true, "", "kept", "inset without source: whole figure as thumbnail"),
    p("P2", "X", "고리마다 한 문장", true, "", "kept", "label"),
  ]),
];
