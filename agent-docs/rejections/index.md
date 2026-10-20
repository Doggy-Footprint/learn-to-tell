File: 2c5216fdfdbccf54-copy-gallery-page-as-lesson-template.md
Summary: 수업을 gallery 페이지 복사로 만드는 방식을 거부하고 kit 라이브러리 조합으로 바꿨다
Related Files: skills/learn-to-tell/SKILL.md, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/gallery/catalog.html
Related Symbols: LTT.deck, LTT.lintDeck
---
File: f9e3756dd41b66c2-kit-css-runtime-link.md
Summary: kit CSS를 각 JS가 런타임에 `<link rel="stylesheet">`로 불러오는 안을 기각하고, `.css` 원본을 편집 시점에 JS 문자열로 생성하는 방식을 택했다
Related Files: scripts/build.mjs, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/standalone.md
Related Symbols: STYLE, KIT
---
File: 32d48725db48c450-browser-diagnosis-page.md
Summary: v0의 브라우저 진단 페이지(카드 + 4가지 반응)를 기각하고 대화 진단을 택했다. 페이지에서는 "내가 아는 개념인지"를 되물을 수 없었다
Related Files: skills/learn-to-tell/SKILL.md, learn-to-tell-PROJECT.md
Related Symbols: 없음
---
File: 92f0f2a78d6b9dca-situation-card-first-diagnosis.md
Summary: 상황 카드로 바로 시작하는 진단을 기각했다. 2026-10-13 설계는 상황 카드 단계 없이 개념 사다리만으로 학습 수준을 정한다
Related Files: skills/learn-to-tell/SKILL.md, learn-to-tell-PROJECT.md
Related Symbols: 없음
---
File: fe3a45c84cd7828b-download-result-json.md
Summary: 결과 JSON을 내려받아 경로를 agent에 전달하는 방식을 기각하고, 경량 로컬 서버가 브라우저 결과를 events.jsonl로 받게 했다
Related Files: skills/learn-to-tell/server/server.mjs, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/standalone.md
Related Symbols: recordEvent, createLttServer
---
File: d03c1a1badc46449-observable-framework-build.md
Summary: 수업마다 Observable Framework를 빌드하는 방식을 기각하고(수업별 빌드, 무거운 런타임), 빌드 없는 단일 HTML + kit을 택했다
Related Files: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/vendor/VERSIONS, skills/learn-to-tell/server/server.mjs
Related Symbols: 없음
---
File: 1d250c5adce868bf-versioned-json-contracts.md
Summary: 버전이 붙은 엄격한 JSON 계약(lesson v1–v4, diagnostic v1–v2)을 기각하고, 버전 필드 없는 result.md frontmatter와 ltt-map check를 택했다
Related Files: skills/learn-to-tell/SKILL.md, skills/learn-to-tell/map/lib/check.mjs, agent-docs/adr/06a89373c78aaf85-rewrite-v0-with-minimal-design.md
Related Symbols: check
---
File: 472b8df126578190-lesson-time-floor-and-scope-caps.md
Summary: 수업 시간 15분 하한과 결정 변수·개념 수 상한을 기각했다. 분량은 시간 기준이고 장면 예산은 기본값일 뿐이다
Related Files: skills/learn-to-tell/SKILL.md, learn-to-tell-PROJECT.md
Related Symbols: 없음
