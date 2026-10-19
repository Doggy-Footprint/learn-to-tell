// Beat windows end at 1000·k ms and start 400 ms earlier, so state holds ≥600 ms after each exposed end time (spec A-9 dwell ≥500 ms).
const W = (k, text) => (text === undefined ? { t: [1000 * k - 400, 1000 * k] } : { t: [1000 * k - 400, 1000 * k], text });
const LONG = "가나다라마바사아자차카타파하".repeat(5);
LTT.deck({ title: "sheet main", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  SHEET.colourFig("rest", []),
  SHEET.colourFig("two", [W(1, "첫째"), W(2, "둘째")]),
  SHEET.colourFig("three", [W(1), W(2), W(3)]),
  SHEET.colourFig("four", [W(1, "a1"), W(2, LONG), W(3, "a3"), W(4, "a4")]),
  SHEET.colourFig("five", [W(1, "b1"), W(2, "b2"), W(3, "b3"), W(4, "b4"), W(5, "b5")]),
  SHEET.colourFig("seven", [W(1, "c1"), W(2, "c2"), W(3, "c3"), W(4, "c4"), W(5, "c5"), W(6, "c6"), W(7, "c7")]),
  SHEET.colourFig("mixed", [W(1), W(2, "섞임")]),
  SHEET.loopFig("same-t", { period: 1000, beats: [{ t: 200, text: "다른" }, { t: 300 }, { t: 300, text: "뒤글" }, { t: 500, text: "먼저" }, { t: 500, text: "나중" }, { t: 700 }, { t: 700 }, { t: 900, text: "남음" }, { t: 900 }] }),
  SHEET.loopFig("two-loops", { period: 1000, beats: [{ t: 300 }] }, { period: 1000, beats: [{ t: 300, text: "둘째" }] }),
  { type: "statement", title: "정리 한 줄" },
  { type: "keywords", terms: [] },
] });
