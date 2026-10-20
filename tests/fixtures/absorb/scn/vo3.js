// VO-3: state transitions. predict (question -> choose -> reveal -> reset), figure steps (1 -> 2 -> 3 -> 4 -> 1), summary recall (hidden -> shown).
// Observations are taken right after each entry/action; the Node side compares each with the entry snapshot.
const TK = (n) => ({ type: "explain", title: "항목 " + n, steps: [], takeaway: "핵심 " + n + " " + "내용 ".repeat(6), recall: "질문 " + n + " 무엇인가?" });
// Step 4 holds 800ms: the repeat button replays from the last step and jumps to step 1 once that hold has passed; step 1 holds 600s so nothing advances further.
const EXTRA = [0, 60, 330, 120];
let extra;
H.deck = LTT.deck({ title: "vo3", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "predict", title: "P", question: "Q?", choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "b",
    visual: A.col(A.svg("q", 360, null)),
    answerVisual(node, id) { node.appendChild(A.col(A.svg("a_" + id, id === "b" ? 480 : 240, null), A.spacer(id === "b" ? 220 : 0))); },
    why: "이유" },
  { type: "figure", title: "S", caption: "c", autoplay: false,
    figure(st) { extra = A.spacer(0); extra.className = "sp extra"; st.appendChild(A.col(A.svg("fig", 480, null), extra)); },
    steps: EXTRA.map((px, k) => ({ caption: "단계 " + (k + 1), hold: k === 3 ? 800 : 600000, enter() { extra.style.height = px + "px"; H.steps.push([k, H.now()]); } })) },
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(TK),
  { type: "summary" },
  { type: "keywords", terms: [] },
] });
const btn = (t) => H.button(H.cur(), t);
const SUMMARY = 3 + 14;
(async () => {
  const snap = (name) => { H.samples[name] = A.snap(); };
  await A.wait(150); H.deck.go(1); await A.wait(500); snap("pred.entry");
  H.click(H.cur().querySelector('[data-choice="b"]')); await A.wait(300); snap("pred.chosen");
  H.click(btn("정답 보기")); await A.wait(600); snap("pred.revealed");
  H.click(btn("초기화")); await A.wait(600); snap("pred.reset");

  await A.wait(150); H.deck.go(2); await A.wait(500); snap("steps.1"); H.samples["steps.1"].extraH = extra.style.height;
  const stepLog = [];
  for (const [name, text] of [["steps.2", "다음"], ["steps.3", "다음"], ["steps.4", "다음"], ["steps.1again", "반복"]]) {
    const before = H.steps.length;
    H.click(btn(text)); await A.wait(text === "반복" ? 1500 : 400); snap(name);
    H.samples[name].extraH = extra.style.height;
    stepLog.push([name, H.steps.slice(before).map((r) => r[0])]);
  }
  H.samples.stepLog = stepLog;

  await A.wait(150); H.deck.go(SUMMARY); await A.wait(500); snap("recall.entry");
  H.samples.recallAnswerBefore = H.cur().innerText.includes("핵심 1 내용");
  H.click(btn("답 보기")); await A.wait(500); snap("recall.shown");
  H.samples.recallAnswerAfter = H.cur().innerText.includes("핵심 1 내용");
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
