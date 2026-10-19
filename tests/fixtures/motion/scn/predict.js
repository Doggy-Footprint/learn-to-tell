// VO-9 (C-18): predict question text and takeaway hiding.
H.deck = LTT.deck({ title: "predict", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "predict", title: "제목 P", question: "다른 질문 Q", choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "a", why: "이유 W", takeaway: "핵심 TK" },
  { type: "predict", title: "같은 질문 S", question: "같은 질문 S", choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "a", why: "이유" },
  { type: "predict", title: "힌트 장면", question: "질문 H2", hint: "힌트 H", choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "a", why: "이유" },
  { type: "keywords", terms: [] },
] });
const hiddenByAncestor = (el) => {
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (e.hidden || e.getAttribute("aria-hidden") === "true" || e.hasAttribute("inert") || cs.display === "none") return true;
  }
  return false;
};
const shown = (el) => !hiddenByAncestor(el) && getComputedStyle(el).visibility !== "hidden" && el.getClientRects().length > 0;
const holders = (root, text) => [...root.querySelectorAll("*")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.includes(text)));
const scale = (root) => [root, ...root.querySelectorAll(".dk-in, .dk-main, .dk-body")].map((e) => { const cs = getComputedStyle(e); return [cs.zoom, cs.transform, cs.scale]; });
const snap = (name) => {
  const cur = H.cur();
  H.samples[name] = {
    text: cur.innerText,
    question: holders(cur, "다른 질문 Q").map((e) => ({ shown: shown(e), a11yHidden: hiddenByAncestor(e) })),
    take: holders(cur, "핵심 TK").map((e) => ({ shown: shown(e), a11yHidden: hiddenByAncestor(e) })),
    scale: scale(cur),
    qTop: (holders(cur, "다른 질문 Q")[0] || { getBoundingClientRect: () => ({ top: NaN }) }).getBoundingClientRect().top,
    choiceTop: (cur.querySelector("[data-choice]") || { getBoundingClientRect: () => ({ top: NaN }) }).getBoundingClientRect().top,
  };
};
H.at(100, () => H.go("in", 1));
H.at(600, () => snap("before"));
H.at(700, () => { H.act("reveal", () => { H.click(H.cur().querySelector('[data-choice="b"]')); H.click(H.button(H.cur(), "정답 보기")); }); });
H.at(1300, () => snap("after"));
H.at(1400, () => { H.act("reset", () => { H.click(H.button(H.cur(), "초기화")); }); });
H.at(2000, () => snap("reset"));
H.at(2100, () => H.go("same", 2));
H.at(2600, () => { H.samples.sameText = H.cur().innerText; });
H.at(2700, () => H.go("hint", 3));
H.at(3200, () => { H.samples.hintText = H.cur().innerText; });
H.done(3300);
