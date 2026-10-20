// text-overlap and unknown-icon on rendered scenes (?audit). Scene 1 puts a nowrap code line wider than the hook art tile,
// so it runs over the title; scene 2 is the same hook with an icon art; scene 3 names icons: a kit name, the database
// alias, an emoji, and a mistyped name; scene 4 stacks two lines of a tight-leading statement title (no overlap).
H.deck = LTT.deck({ title: "overlap", theme: "paper", scenes: [
  { type: "hook", text: "틀린 답을 낸 모델은 정답을 몰랐을까", art: '<div style="white-space:nowrap;width:max-content;font-size:15px">30번 샘플링 → Canberra 17 · Sydney 11 · Melbourne 2 · Perth 0</div>' },
  { type: "hook", text: "틀린 답을 낸 모델은 정답을 몰랐을까", art: "cache" },
  { type: "terms", title: "아이콘", terms: [
    { key: "a", word: "가", icon: "db", plain: "뜻 가", visual: false },
    { key: "b", word: "나", icon: "database", plain: "뜻 나", visual: false },
    { key: "c", word: "다", icon: "🧪", plain: "뜻 다", visual: false },
    { key: "d", word: "라", icon: "databse", plain: "뜻 라", visual: false },
  ] },
  { type: "statement", title: "긴 주장 제목이 두 줄로 넘어가도 줄끼리 겹치지 않는다는 것을 확인하는 문장이다 <u>밑줄 친 부분</u>도 있다" },
  { type: "keywords", terms: [] },
] });
H.done(6000);
