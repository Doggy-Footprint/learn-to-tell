// VO-7 decision table (integration, ?audit) and VO-10 E6. Base row R1 is a statement whose visual is one still svg.ltt-svg;
// each row changes one condition. A figure stage always counts as a picture (FR-14 VISUALS), so statement is the base type.
const SVG = '<svg class="ltt-svg" viewBox="0 0 400 200" style="width:100%;height:auto"><rect x="10" y="10" width="380" height="180" fill="currentColor" opacity=".2"/></svg>';
const pic = (el) => el.insertAdjacentHTML("beforeend", SVG);
const row = (title, extra) => ({ type: "statement", title, visual: pic, takeaway: title + " 핵심", recall: title + "?", ...extra });
H.deck = LTT.deck({ title: "still", theme: "paper", scenes: [
  { type: "hook", art: "cache", text: "시작", mount: pic },
  row("R1 정지 그림"),
  row("R6 이유 있음", { still: "표를 읽는다" }),
  row("R7 빈 이유", { still: "" }),
  row("E6 문자열 아님", { still: 123 }),
  row("R5 비트 있음", { visual(el) { pic(el); LTT.motion.loop(() => {}, { period: 2000 }); } }),
  row("R3 그림 없음", { visual: undefined }),
  row("R4 목업만", { visual(el) { el.appendChild(LTT.mock.terminal({ title: "log" }).el); } }),
  { type: "terms", title: "R8 terms", terms: [{ key: "용어", plain: "뜻", visual: false }], mount: pic },
  { type: "summary", title: "R8 summary", mount: pic },
  { type: "figure", title: "정지 figure", caption: "c", figure: SVG },
  { type: "keywords", terms: [], mount: pic },
] });
H.done(8000);
