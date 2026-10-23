// @ts-check
/** @typedef {import("../../fragment").Prop} Prop */
/** @typedef {import("ltt").P} P */
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, polar, line, path, label, dot, rect, circle, arc, arrow, multiples } = api;
  const NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  /** @type {import("ltt").Tone[]} */
  const PC_TONE = ["series1", "muted", "series5", "muted", "series2", "series6", "muted", "series3", "muted", "series4", "muted", "ref"];
  const BLACK = [1, 3, 6, 8, 10];
  const OPEN = [40, 45, 50, 55, 59, 64]; // MIDI E2 A2 D3 G3 B3 E4
  /** @param {number} f fret → distance from nut, scale 1 */
  const fretX = (f) => 1 - 2 ** (-f / 12);
  /** @param {number} midi diatonic staff step from C4 (0) */
  const step = (midi) => { const o = Math.floor(midi / 12) - 5, pc = ((midi % 12) + 12) % 12; return o * 7 + [0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6][pc]; };
  const QUAL = { maj: [4, 3], min: [3, 4], dim: [3, 3], aug: [4, 4] };
  /** @param {number[][]} prog */
  const moves = (prog) => prog.slice(1).reduce((a, ch, i) => a + ch.reduce((s, n, k) => s + Math.abs(n - prog[i][k]), 0), 0);
  const models = {
    chord: model({ root: 60, qual: "maj", inv: 0 }, ({ root, qual, inv }) => {
      const iv = QUAL[/** @type {keyof typeof QUAL} */ (qual)] ?? QUAL.maj;
      const notes = [root, root + iv[0], root + iv[0] + iv[1]];
      for (let k = 0; k < inv; k++) notes.push(/** @type {number} */ (notes.shift()) + 12);
      return { notes, sym: inv === 0 ? NAMES[root % 12] : `${NAMES[root % 12]}/${NAMES[notes[0] % 12]}`, iv: [notes[1] - notes[0], notes[2] - notes[1]], fifth: iv[0] + iv[1] };
    }, "triads by stacked thirds: maj 4+3, min 3+4, dim 3+3, aug 4+4"),
    lead: model({ voiced: false }, ({ voiced }) => {
      const root = [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55]], near = [[60, 64, 67], [60, 65, 69], [59, 62, 67], [60, 64, 67]];
      const prog = voiced ? near : root;
      return { prog, total: moves(prog) };
    }, "C–F–G–C semitone voice motion; root position 15+2·3+21=42 vs nearest inversions 3+6+3=12"),
    hand: model({ win: 0 }, ({ win }) => ({ lo: win, hi: win + 4 }), "standard tuning EADGBE"),
  };
  /** @param {number[]} sel @returns {import("ltt").MarkTree} */
  const keyboard = (sel) => Array.from({ length: 24 }, (_, i) => {
    const midi = 48 + i, pc = i % 12, black = BLACK.includes(pc), on = sel.includes(midi);
    const w = Math.floor(i / 12) * 7 + [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc];
    return black ? rect([w + 0.65, 1.6], [w + 1.35, 3], { id: `k${midi}`, fill: "solid", tone: on ? PC_TONE[pc] : "muted", opacity: on ? (midi < 60 ? 0.6 : 1) : 1 })
      : rect([w, 0], [w + 1, 3], { id: `k${midi}`, fill: on ? "solid" : "none", tone: on ? PC_TONE[pc] : "muted", opacity: on && midi < 60 ? 0.6 : 1 });
  });
  /** @param {number[]} sel @param {number} y0 @returns {import("ltt").MarkTree} */
  const staff = (sel, y0, x = 7) => [
    [0, 1, 2, 3, 4].map((k) => line([[0, y0 + k * 0.5], [14, y0 + k * 0.5]], { id: `st${y0}-${k}`, weight: "thin" })),
    sel.map((n) => circle([x, y0 + 1 + (step(n) - step(64)) * 0.25 + 0.5], 0.22, { id: `nh${y0}-${n}`, fill: "solid", tone: PC_TONE[n % 12], opacity: n < 60 ? 0.6 : 1 })),
  ];
  /** @param {number[]} sel @param {number} y0 @returns {import("ltt").MarkTree} */
  const fretboard = (sel, y0, w = 14) => [
    Array.from({ length: 16 }, (_, f) => line([[fretX(f) / fretX(15) * w, y0], [fretX(f) / fretX(15) * w, y0 + 2.5]], { id: `fr${f}`, weight: f === 0 ? "bold" : "thin" })),
    OPEN.map((o, s) => [line([[0, y0 + s * 0.5], [w, y0 + s * 0.5]], { id: `str${s}`, weight: "thin" }),
      Array.from({ length: 16 }, (_, f) => sel.includes(o + f) && dot([((fretX(f) + fretX(Math.max(0, f - 1))) / 2) / fretX(15) * w, y0 + s * 0.5], { id: `fd${s}-${f}`, tone: PC_TONE[(o + f) % 12], opacity: o + f < 60 ? 0.6 : 1 }))]),
  ];
  const figures = {
    triple: figure(cartesian({ x: [0, 14, ""], y: [-4, 10, ""], static: "건반 C3–B4, 대보표, 기타 지판 0–15프렛" }), (m) => [
      keyboard(m.chord.notes), staff(m.chord.notes, 4.5), fretboard(m.chord.notes.map((/** @type {number} */ n) => n - 12).concat(m.chord.notes), -3.5),
      label([0, 9.7], "기타는 실제 음보다 한 옥타브 높게 기보", { id: "gtr-oct", anchor: "nw" }),
      dot([m.chord.notes[0] - 48, 3.3], { id: "pick" }),
    ]),
    ruler: figure(cartesian({ x: [0, 14, ""], y: [0, 6, ""], steps: ["C", "+1", "+2", "+3", "+4", "+5", "+6", "+7"] }), (m, t, { step: s }) => {
      const pos = (/** @type {number} */ k) => { const pc = k % 12; return Math.floor(k / 12) * 7 + [0.5, 1, 1.5, 2, 2.5, 3.5, 4, 4.5, 5, 5.5, 6, 6.5][pc]; };
      return [keyboard([48 + s]), Array.from({ length: s }, (_, k) => path([["M", pos(k), 3.2], ["Q", (pos(k) + pos(k + 1)) / 2, 4.2, pos(k + 1), 3.2]], { id: `jump${k}`, tone: "focus", reveal: k === s - 1 ? 1 : 1 })),
        label([0, 5.6], `반음 ${s} · ${["", "", "", "단3도", "장3도", "", "", "완전5도"][s]}`, { id: "count", anchor: "nw" }), label([10, 5.6], "E–F, B–C도 반음", { id: "ef" })];
    }),
    stack: figure(cartesian({ x: [0, 14, ""], y: [0, 8, ""], steps: ["근음", "+3도", "+3도"] }), (m, t, { step: s }) => {
      const n = m.chord.notes.slice(0, s + 1);
      return [keyboard(n), staff(n, 4.5),
        s >= 1 && label([9, 6.8], `${m.chord.iv[0]}`, { id: "iv1" }), s >= 2 && label([9, 7.3], `${m.chord.iv[1]} · 합 ${m.chord.fifth}`, { id: "iv2" }),
        s >= 1 && dot([n[1] - 48 - 4, 3.3], { id: "third", tone: "warn", size: "l", label: "장/단 차이 = 가운데 음 반음 하나" })];
    }),
    inv: figure(cartesian({ x: [0, 14, ""], y: [0, 8, ""], steps: ["근음 위치 C", "1전위 C/E", "2전위 C/G"] }), (m, t, { step: s }) => {
      const base = [60, 64, 67], n = base.slice(s).concat(base.slice(0, s).map((x) => x + 12));
      return [keyboard(n), staff(n, 4.5),
        circle([7, 5.5 + (step(n[0]) - step(64)) * 0.25 + 0.5], 0.32, { id: "bass", tone: "focus", fill: "none", weight: "bold", label: "베이스" }),
        s > 0 && circle([7, 5.5 + (step(base[s - 1] + 12) - step(64)) * 0.25 + 0.5], 0.22, { id: "moved", from: `nh4.5-${base[s - 1]}`, tone: "warn", fill: "solid" }),
        label([0, 7.7], ["C", "C/E", "C/G"][s], { id: "sym", anchor: "nw" }), label([12, 7.7], ["4+3", "3+5", "5+4"][s], { id: "ivs" })];
    }),
    map: figure(cartesian({ x: [0, 14, ""], y: [-1, 3, ""], static: "지판 위 C·E·G 전 위치와 CAGED 영역" }), (m) => {
      const w = 14, X = (/** @type {number} */ f) => ((fretX(f) + fretX(Math.max(0, f - 1))) / 2) / fretX(15) * w;
      const lo = m.hand.lo, hi = m.hand.hi;
      /** @type {{s:number,f:number,pc:number}[]} */
      const inWin = [];
      return [fretboard([], 0),
        OPEN.map((o, s) => Array.from({ length: 16 }, (_, f) => {
          const pc = (o + f) % 12, at = /** @type {P} */ ([X(f), s * 0.5]);
          if (f >= lo && f <= hi && [0, 4, 7].includes(pc)) inWin.push({ s, f, pc });
          return pc === 0 ? circle(at, 0.12, { id: `C${s}-${f}`, fill: "solid", tone: "series1" })
            : pc === 4 ? path([["M", at[0], at[1] + 0.14], ["L", at[0] + 0.12, at[1] - 0.1], ["L", at[0] - 0.12, at[1] - 0.1], ["Z"]], { id: `E${s}-${f}`, fill: "solid", tone: "series2" })
            : pc === 7 && rect([at[0] - 0.1, at[1] - 0.1], [at[0] + 0.1, at[1] + 0.1], { id: `G${s}-${f}`, fill: "solid", tone: "series3" });
        })),
        [[0, 3], [3, 6], [5, 8], [8, 11], [10, 13]].map(([a, b], i) => rect([X(a), -0.2], [X(b), 2.7], { id: `caged${i}`, fill: "soft", opacity: 0.15, tone: "muted", label: "CAGED"[i] })),
        rect([X(lo), -0.4], [X(hi), 2.9], { id: "window", tone: "focus", fill: "none", weight: "bold" }),
        label([0, -0.8], () => { const b = inWin[0]; return b ? `베이스 ${NAMES[b.pc]} → ${b.pc === 0 ? "근음 위치" : b.pc === 4 ? "1전위" : "2전위"}` : "창 안에 구성음 없음"; }, { id: "bass-name", anchor: "w" }),
        label([14, -0.8], "● 근음 C ▲ 3음 E ■ 5음 G", { id: "key", anchor: "e" }),
        line([[X(12), -0.3], [X(12), 2.8]], { id: "oct12", dash: true, label: "12프렛부터 반복" })];
    }),
    lead: figure(cartesian({ x: [0, 14, ""], y: [0, 8, ""], static: "C–F–G–C 성부 이동" }), (m) => [
      m.lead.prog.map((/** @type {number[]} */ ch, /** @type {number} */ i) => [staff(ch, 4.5, 2 + i * 3.5),
        i > 0 && ch.map((n, k) => { const pv = m.lead.prog[i - 1][k]; const y = (/** @type {number} */ z) => 5.5 + (step(z) - step(64)) * 0.25 + 0.5;
          return n === pv ? path([["M", 2 + (i - 1) * 3.5 + 0.3, y(n) + 0.2], ["Q", 2 + (i - 0.5) * 3.5, y(n) + 0.6, 2 + i * 3.5 - 0.3, y(n) + 0.2]], { id: `tie${i}-${k}`, tone: "good", label: "공통음" })
            : label([2 + (i - 0.5) * 3.5, y(n)], `${Math.abs(n - pv)}`, { id: `mv${i}-${k}` }); })]),
      label([0, 7.7], (o) => `이동 합계 ${o.lead.total} 반음`, { id: "total", anchor: "nw" })]),
    chroma: figure(polar({ r: [0, 1.2, ""], theta: [0, 360], static: "12음 원 위 C·Am 삼각형" }), (m) => {
      const th = (/** @type {number} */ pc) => 90 - pc * 30, tri = [0, 4, 7], mir = [9, 0, 4];
      return [NAMES.map((n, k) => label([1.12, th(k)], n, { id: `pc${k}` })),
        path([...tri.map((pc, i) => /** @type {import("ltt").PathCmd} */ ([i ? "L" : "M", Math.cos(th(pc) * Math.PI / 180), Math.sin(th(pc) * Math.PI / 180)])), ["Z"]], { id: "maj-tri", tone: "series1" }),
        path([...mir.map((pc, i) => /** @type {import("ltt").PathCmd} */ ([i ? "L" : "M", Math.cos(th(pc) * Math.PI / 180), Math.sin(th(pc) * Math.PI / 180)])), ["Z"]], { id: "min-tri", tone: "series2"}),
        [[0, 4, "4"], [4, 7, "3"], [7, 12, "5"]].map(([a, b, s]) => arc([0, 0], 1, [th(Number(b)), th(Number(a))], { id: `arc${a}`, label: String(s), tone: "focus" })),
        label([0.3, 270], "옥타브 차이는 원에서 사라짐(음높이 아님 음이름)", { id: "oct-note" })];
    }),
    quizV: figure(cartesian({ x: [0, 14, ""], y: [0, 3.5, ""], static: "건반 위 3음 보이싱" }), (m, t, { params }) => [keyboard([48, 57, 64]),
      params.colored === true && [dot([0.5, 3.3], { id: "q-root", tone: "series4", label: "A 근음" }), dot([9.5, 3.3], { id: "q-3", tone: "series1", label: "C 3음 (베이스)" })]]),
  };
  const all = { ...figures, stack4: multiples("stack", { over: { qual: ["maj", "min", "dim", "aug"] } }) };
  /** @type {import("ltt").Scene[]} */
  const scenes = [
    { type: "explore", title: "세 뷰 연동", say: "근음과 종류를 바꿔 보자.", figure: "triple", focus: ["pick"], knobs: { root: [48, 59, 1], qual: ["maj", "min", "dim", "aug"], inv: [0, 2, 1] }, handles: [{ mark: "pick", x: "root" }] },
    { type: "steps", title: "반음 세기", figure: "ruler", steps: Array.from({ length: 8 }, (_, k) => ({ say: `${k}`, focus: [`jump${Math.max(0, k - 1)}`, "count"] })) },
    { type: "steps", title: "3도 쌓기", figure: "stack4", steps: [{ say: "근음", focus: [] }, { say: "+3도", focus: ["iv1"] }, { say: "+3도", focus: ["iv2", "third"] }] },
    { type: "predict", title: "1전위의 베이스", ask: "1전위의 맨 아래 음은?", figure: "inv", focus: ["bass"], input: { kind: "choice", options: [{ text: "E", correct: true }, { text: "C", feedback: "C는 한 옥타브 위로 올라갔다." }] }, reveal: { say: "구성음은 같고 베이스만 바뀐다.", marks: ["sym"] }, targets: "전위하면 다른 코드가 된다" },
    { type: "steps", title: "전위 사다리", figure: "inv", steps: [{ say: "C", focus: ["bass"] }, { say: "C/E", focus: ["moved", "bass"] }, { say: "C/G", focus: ["moved", "bass"] }] },
    { type: "explore", title: "지판 위 C", say: "손 창을 끌어 운지를 찾자.", figure: "map", focus: ["window", "bass-name"], knobs: { win: [0, 11, 1] }, handles: [{ mark: "window", x: "win" }], goal: { say: "1전위 운지 찾기", done: (m) => m.hand.lo === 2 } },
    { type: "compare", title: "근음 위치 vs 전위", say: (m) => `합계 ${m.lead.total}`, figure: "lead", focus: ["total", "tie1-0"], a: { voiced: false }, b: { voiced: true }, labels: ["모두 근음 위치", "가까운 전위"] },
    { type: "quiz", items: [{ kind: "choice", prompt: "코드 이름은?", objective: "o4", figure: "quizV", options: [{ text: "Am/C", correct: true }, { text: "C6", feedback: "근음은 A다." }, { text: "Am", feedback: "베이스가 C다." }], reveal: { params: { colored: true }, marks: ["q-root", "q-3"] } }] },
  ];
  return { models, figures: all, scenes };
};

const src = "bench/coverage/new/music/triads-inversions-voicing.brief.md";
/** @returns {Prop} */
const p = (/** @type {string} */ id, /** @type {Prop["cat"]} */ cat, /** @type {string} */ text, /** @type {boolean} */ essential, /** @type {string} */ why, /** @type {Prop["status"]} */ status, /** @type {string} */ note) =>
  status === "kept" ? { id, cat, text, essential, why, status, by: note } : { id, cat, text, essential, why, status, diff: note };
/** @param {number} n @param {Prop[]} props @param {string[]} candidates */
const row = (n, props, candidates = []) => /** @type {import("../../fragment").AuditRow} */ ({ fig: `triads-inversions-voicing#F${n}`, src, corpus: "new-b1", domain: "음악", props, verdict: props.some((q) => q.essential && (q.status === "lost" || q.status === "ambiguous")) ? "G" : "V", custom: [], candidates });

/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row(1, [
    p("P1", "G", "건반 2–3 묶음, 프렛 간격 2^(−1/12)씩 좁아짐", true, "", "kept", "rect 데이터 좌표; fretX(f) = 1 − 2^(−f/12)"),
    p("P2", "G", "같은 음높이 같은 색, 다른 옥타브 같은 색상 다른 명도", true, "", "approx", "Tone에 명도 단계가 없어 opacity로 대신하며, 12 음이름에 series 6개뿐이라 반음계 음 5개는 muted를 공유한다"),
    p("P3", "X", "기타 한 옥타브 높게 기보 표기", true, "", "kept", "label"),
    p("P4", "I", "어느 뷰에서 탭해도 나머지에 반영", true, "", "lost", "mark 탭 입력이 없고 handles는 연속 x→param뿐이라 지판·오선의 음을 골라 같은 param으로 보낼 수 없다"),
    p("P5", "S", "세 뷰 세로 정렬, 연결선", false, "", "approx", "한 프레임에 세로로 놓았으나 건반–지판 연결선은 그리지 않았다"),
  ], ["tap-select", "staff-notation", "tone-shade"]),
  row(2, [
    p("P1", "Q", "인접 건반 = 반음, E–F·B–C 포함", true, "", "kept", "keyboard rect 배치 + 점프마다 midi+1"),
    p("P2", "T", "1칸씩 점프 애니메이션", true, "", "kept", "TimeSpec steps; Steps: Each step advances the figure's steps index"),
    p("P3", "X", "누적 카운터", true, "", "kept", "label"),
  ]),
  row(3, [
    p("P1", "G", "오선에서 모두 줄 또는 모두 칸", true, "", "kept", "circle y = 음계 단계×0.25(반 칸) 데이터 좌표"),
    p("P2", "Q", "3도 반음 수, 합 7/7/6/8", true, "검산 맞음", "kept", "model chord iv, fifth + label"),
    p("P3", "S", "4종 small multiples 같은 근음", true, "", "kept", "multiples over qual: sharing frame, axes, t, step"),
    p("P4", "T", "근음→+3도→+3도", true, "", "kept", "TimeSpec steps"),
    p("P5", "E", "장/단 차이 강조", true, "", "kept", "dot tone warn size l + Steps focus"),
  ], ["staff-notation"]),
  row(4, [
    p("P1", "G", "구성음 집합 동일, 맨 아래만 바뀜", true, "", "kept", "notes 회전 + 옥타브 이동 좌표"),
    p("P2", "X", "C, C/E, C/G", true, "", "kept", "label"),
    p("P3", "T", "맨 아래 음이 옥타브 위로 오르는 단계 애니메이션", true, "", "ambiguous", "MarkOpts.from은 'Mark id this mark animates out of'일 뿐 그 id가 이전 step에만 있을 때 옮겨 가는 움직임을 그리는지 d.ts가 말하지 않는다"),
    p("P4", "I", "predict 1전위 베이스", true, "", "kept", "Predict input choice + reveal"),
    p("P5", "Q", "4+3 / 3+5 / 5+4", false, "검산 맞음", "kept", "label"),
  ]),
  row(5, [
    p("P1", "G", "모든 위치가 표준 조율 기준 정확", true, "검산: 5번 줄 3프렛 = A2+3 = C3", "kept", "OPEN MIDI + fret 계산 좌표"),
    p("P2", "I", "4프렛 창 드래그, 목표 서로 다른 운지 3개", true, "", "approx", "창 handle은 되지만 goal.done이 현재 출력만 보므로 '3개 찾기' 누적 대신 한 운지 도달로 줄였다"),
    p("P3", "E", "가장 낮은 줄의 음 강조, 전위 이름 자동", true, "", "approx", "전위 이름은 label로 자동이지만 창 안 베이스 음 자체를 별도 강조하지 않았다"),
    p("P4", "X", "근음/3음/5음 범례", true, "", "kept", "label(모양 기호 범례; legend는 tone만 받음)"),
    p("P5", "G", "12프렛 반복 표시", false, "", "kept", "line dash + label"),
  ], ["goal-history", "legend-shape"]),
  row(6, [
    p("P1", "Q", "성부 이동 합계 (a) 20+ vs (b) 한 자리", true, "brief 수치 불일치: 3성부 C–F–G–C에서 (a) 15+6+21=42, (b) 가장 가까운 전위도 3+6+3=12로 합계가 두 자리다(전환마다는 한 자리)", "kept", "model lead total + 화살표 대신 이동 반음 label"),
    p("P2", "S", "compare 같은 오선 스케일 좌우", true, "", "kept", "Compare: Same figure under params a and b, side by side"),
    p("P3", "E", "공통음 이음줄", true, "", "kept", "path Q tone good"),
    p("P4", "X", "비교 재생 버튼", false, "", "lost", "소리가 없다"),
  ], ["audio", "staff-notation"]),
  row(7, [
    p("P1", "G", "꼭짓점 간 원호 = 반음 4,3,5", true, "", "approx", "polar frame에서 path 좌표가 [r,θ]인지 직교인지 d.ts가 path에 대해 따로 말하지 않아 삼각형은 cos/sin으로 넣었다; 원호와 라벨은 arc로 유지"),
    p("P2", "I", "회전·반전", false, "", "lost", "삼각형 회전 조작을 넣지 않았다"),
    p("P3", "X", "옥타브 사라짐 표기", true, "", "kept", "label"),
  ]),
  row(8, [
    p("P1", "I", "제출 후 근음/3음/5음 색 공개", true, "", "kept", "QuizReveal: Shown after a choice answer is submitted; params, marks"),
    p("P2", "G", "겹친 음·넓은 간격 보이싱", false, "", "approx", "C3–A3–E4 넓은 간격만, 배가 음은 없다; 무작위 출제 대신 고정 문항"),
  ]),
];
