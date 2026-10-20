// VO-7: five scenes whose zoom is decided by different things. Spacers are plain divs (not absorbable) so that zoom, not absorb, takes the overflow.
// 2 predict whose choice b answer is tall (floor); 3 figure steps whose 3rd step is tall enough to shrink but not to floor; 4 predict whose question visual is tall; 5 a scene that is
// tall by itself; 6 a figure with a 900-char narration (zoom lands between the 78% floor and the shrunk bar).
let extra;
const HEIGHTS = [0, 0, 375, 0];
H.deck = LTT.deck({ title: "vo7", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "predict", title: "정답이 정한다", question: "Q?", choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "b",
    answerVisual(node, id) { node.appendChild(A.spacer(id === "b" ? 700 : 0)); }, why: "이유" },
  { type: "figure", title: "단계가 정한다", caption: "c",
    figure(st) { extra = A.spacer(0); st.appendChild(A.col(A.svg("fig", 480, null), extra)); },
    steps: HEIGHTS.map((px, k) => ({ caption: "단계 " + (k + 1), hold: 600000, enter() { extra.style.height = px + "px"; } })) },
  { type: "predict", title: "질문이 정한다", question: "Q?", choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "a",
    visual: A.col(A.spacer(900)), answerVisual(node) { node.appendChild(A.spacer(0)); }, why: "이유" },
  { title: "스스로 크다", narration: "n", mount(body) { body.appendChild(A.spacer(2000)); } },
  { type: "figure", title: "긴 해설", caption: "c", narration: "가".repeat(900), figure(st) { st.appendChild(A.svg("fig", 480, null)); } },
  { type: "keywords", terms: [] },
] });
(async () => {
  for (let i = 1; i <= 5; i++) { await A.wait(150); H.deck.go(i); await A.wait(450); H.samples["s" + (i + 1)] = A.snap(); }
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
