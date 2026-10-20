// Predict reveals on the pick; forward opens an unrevealed compare verdict and nudges at an unpicked predict.
H.deck = LTT.deck({ title: "gate", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "predict", title: "P1", question: "Q1", choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "a", why: "이유 W1" },
  { type: "compare", title: "C", items: [{ label: "왼쪽", visual: "<div>L</div>", tone: "good", verdict: "판정 V1" }, { label: "오른쪽", visual: "<div>R</div>", tone: "bad", verdict: "판정 V2" }] },
  { type: "compare", title: "C2", items: [{ label: "왼쪽", visual: "<div>L</div>", tone: "good", verdict: "판정 V3" }, { label: "오른쪽", visual: "<div>R</div>", tone: "bad", verdict: "판정 V4" }] },
  { type: "predict", title: "P2", question: "Q2", choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "a", why: "이유 W2" },
  { type: "keywords", terms: [] },
] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const key = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
const next = () => H.button(document, "다음").click();
const shown = (el) => !!el && getComputedStyle(el).visibility !== "hidden" && el.getClientRects().length > 0 && !el.closest(".ltt-hidden");
const snap = (name) => {
  const cur = H.cur(), why = [...cur.querySelectorAll(".dk-why")][0], cmp = cur.querySelector(".dk-cmp");
  H.samples[name] = {
    index: H.deck.index,
    buttons: [...cur.querySelectorAll("button")].map((b) => b.textContent.trim()),
    whyShown: shown(why),
    verdictShown: !!cmp && cmp.classList.contains("shown"),
    nudged: !!cur.querySelector(".ltt-nudge"),
  };
};
(async () => {
  await wait(100); H.go("p1", 1);
  await wait(500); snap("p1.entry");
  H.click(H.cur().querySelector('[data-choice="b"]'));
  await wait(600); snap("p1.picked");
  await wait(100); H.go("c", 2);
  await wait(500); snap("c.entry");
  key(); await wait(400); snap("c.key1");
  key(); await wait(500); snap("c.key2");
  await wait(100); H.go("c2", 3);
  await wait(500); next(); await wait(400); snap("c2.next1");
  await wait(100); H.go("p2", 4);
  await wait(500); key(); await wait(300); snap("p2.key1");
  key(); await wait(500); snap("p2.key2");
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
