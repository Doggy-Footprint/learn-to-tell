LTT.deck({ title: "sheet small", theme: "paper", scenes: [
  { type: "hook", text: "작은 수업" },
  SHEET.colourFig("beats", [{ t: [600, 1000], text: "하나" }, { t: [1600, 2000], text: "둘" }]),
  { type: "figure", title: "키 큰 그림", caption: "높이가 고정된 블록", figure(st) { const d = st.appendChild(LTT.h("div")); d.style.cssText = "height:860px;background:#ccc"; } },
  SHEET.colourFig("still", []),
  { type: "keywords", terms: [] },
] });
