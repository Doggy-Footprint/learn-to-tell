// Shared by scn/hold.js (browser) and motion.test.mjs (node, via createRequire). `exp` is the expected hold of step 0 in ms, computed by hand
// from the spec: max(author hold, max(1800, 1000 + 100 * n)) with n the code-point length of the caption's plain text. The comment on each
// case shows that n; nothing here calls the kit.
(function () {
  const C = [];
  const add = (id, group, caption, hold, exp) => C.push({ id, group, caption, hold, exp, noCaption: caption === undefined });
  const rep = (s, n) => s.repeat(n);
  // n boundaries (floor 1800 flat below n = 8, 1000 + 100n above)
  add("n7", "n", rep("가", 7), undefined, 1800);
  add("n8", "n", rep("가", 8), undefined, 1800);
  add("n9", "n", "가나다라" + rep("😀", 5), undefined, 1900); // 4 + 5 astral code points: UTF-16 length would be 14
  add("n59", "n", rep("가", 59), undefined, 6900);
  add("n60", "n", rep("가", 60), undefined, 7000);
  add("n61", "n", rep("가", 61), undefined, 7100);
  // author hold around the 1800 floor (n = 8) and around the 7000 floor (n = 60)
  add("h1799", "hold", rep("가", 8), 1799, 1800);
  add("h1800", "hold", rep("가", 8), 1800, 1800);
  add("h1801", "hold", rep("가", 8), 1801, 1801);
  add("h6999", "hold", rep("가", 60), 6999, 7000);
  add("h7000", "hold", rep("가", 60), 7000, 7000);
  add("h7001", "hold", rep("가", 60), 7001, 7001);
  add("h5000", "hold", rep("가", 60), 5000, 7000); // C-3
  add("h9000", "hold", rep("가", 60), 9000, 9000); // C-3
  // equivalence classes of the caption text
  add("tags", "class", "<b>" + rep("가", 9) + "</b><i></i>", undefined, 1900); // n = 9; raw length 9 + 14
  add("alias", "class", "{{길고 긴 용어 이름이 매우 길다|가나다}} 라마바사아자", undefined, 2000); // 가나다 + space + 6 = 10
  add("term", "class", "{{가나다라마바사아자차}}", undefined, 2000); // n = 10; raw length 14
  add("ws", "class", "        가나다   라마바   사아자        ", undefined, 2100); // "가나다 라마바 사아자" = 11
  add("nonstring", "class", 123456789012345, undefined, 1800); // n = 0; String() would give 15
  add("missing", "class", undefined, undefined, 1800);
  if (typeof module !== "undefined" && module.exports) { module.exports = C; return; }
  globalThis.HOLD_CASES = C;
  // The non-string caption is expected to throw while the kit does not handle it (Errors, C-20); it runs on its own page so the other cases
  // are judged on their own.
  // Plain run: visit each scene long enough to see step 0 -> 1. ?audit run: no navigation, only the audit JSON beats are read.
  globalThis.HOLD_RUN = (LIST) => {
    const AUDIT = new URLSearchParams(location.search).has("audit");
    const step0 = (c) => {
      const s = { enter: H.step("h:" + c.id) };
      if (!c.noCaption) s.caption = c.caption;
      if (c.hold != null) s.hold = c.hold;
      return s;
    };
    H.deck = LTT.deck({ title: "hold", theme: "paper", glossary: { "길고 긴 용어 이름이 매우 길다": "x", "가나다라마바사아자차": "y" }, scenes: [
      { type: "hook", text: "시작" },
      ...LIST.map((c) => ({ type: "figure", title: c.id, caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = c.id; },
        steps: [step0(c), { caption: "x", enter: H.step("h:" + c.id) }] })),
      { type: "keywords", terms: [] },
    ] });
    if (AUDIT) H.done(9100);
    else {
      let T = 100;
      LIST.forEach((c, i) => { const t = T; H.at(t, () => H.go("c:" + c.id, i + 1)); T += c.exp + 700; });
      H.done(T + 300);
    }
  };
})();
