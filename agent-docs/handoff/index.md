File: b41cd6aec66a2589-refactoring-1-lesson-cost-ledger.md
Summary: refactoring-1: 수업 생성 비용(읽은 문서·수업 바이트·서브에이전트·브라우저 왕복·시간)을 result.md에 기록해 intent 1을 측정 가능하게 하는 작업
Related Files: skills/learn-to-tell/SKILL.md, skills/learn-to-tell/standalone.md
Related Symbols: 없음
---
File: a3a320e98302b058-refactoring-2-api-core-and-part-docs.md
Summary: refactoring-2: kit/API.md를 항상 읽는 핵심과 쓸 때만 읽는 부품별 참조(kit/api/<part>.md)로 나누고 SKILL.md가 고른 부품만 읽게 하는 작업
Related Files: skills/learn-to-tell/kit/API.md, skills/learn-to-tell/SKILL.md, site/gallery/catalog.html, packages/ltt-kit/package.json, tests/gallery.test.mjs
Related Symbols: 없음
---
File: f58211edae367035-refactoring-3-scene-budget-default.md
Summary: refactoring-3: SKILL.md §2에 장면 수 기본 예산(결정 변수당 4장면 이하, 전체 8~10)을 두고 한 챕터 전체는 명시적으로만 해제하는 작업
Related Files: skills/learn-to-tell/SKILL.md, learn-to-tell-PROJECT.md, skills/learn-to-tell/kit/ltt.js
Related Symbols: LTT.lintDeck
---
File: 47c0f728cfa2d600-refactoring-4-deck-type-meta-and-ctx-protocol.md
Summary: refactoring-4: 장면 타입 메타(SPLIT_OFF·NO_HEAD·VISUAL_TYPES·AUDIT_SKIP·isCardGrid·isSignature)를 TYPES로 모으고, ctx 프로토콜·측정 모드를 문서화하고, probe·lockZoom·widen 측정 로직을 핸들러에서 분리하고, CHANGELOG·버전을 두는 작업
Related Files: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/API.md, tests/kit.test.mjs
Related Symbols: TYPES, LTT.deckTypes, LTT.lintDeck, LTT.auditScene, probe, lockZoom, widen, measure
---
File: e72bbfb2418e2e6d-refactoring-5-scene-scale-deferred.md
Summary: refactoring-5: 장면 배율 고정 작업의 보류 항목(단계 그림 겹쳐 쌓기, 지연 그리기 측정, 띄우기를 고려한 배율, 공개 상태 resize)
Related Files: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/API.md
Related Symbols: lockZoom, probe, widen, floatPanel, fit, LTT.stepper, diagram.send
---
File: 12094d07d53f7dff-refactoring-6-kit-css-files.md
Summary: refactoring-6: 다섯 kit 모듈의 CSS 문자열 588줄을 .css 파일로 분리하고 각 JS가 자기 경로 기준으로 link를 넣게 하는 작업
Related Files: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/ltt-ui.js, skills/learn-to-tell/kit/ltt-mock.js, skills/learn-to-tell/kit/ltt-deck.js, packages/ltt-kit/package.json
Related Symbols: STYLE, themeCss, KIT
---
File: a095db8efa4b543c-refactoring-7-mobile-support-decision.md
Summary: refactoring-7: 데스크톱 전용 ADR 8a61c967과 재도입된 모바일 reflow 코드의 충돌을 사용자 결정(ADR supersede 또는 분기 제거)으로 정리하는 작업
Related Files: agent-docs/adr/8a61c967e180bedb-desktop-only-min-720px.md, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/standalone.md
Related Symbols: LTT.mobile, mobileFit, LTT.autoLayout
---
File: fb7b84e0280f15ef-refactoring-8-gallery-audit-zero-and-cleanup.md
Summary: refactoring-8: 갤러리 12편을 1440×900·1280×800 audit 0건으로 맞추고(2026-10-18 헤드리스 측정 6·26+1·5건) tls13-quic의 죽은 코드와 ltt-meta를 정리하는 작업
Related Files: site/gallery, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-deck.js, tests/gallery.test.mjs
Related Symbols: LTT.auditScene, lockZoom, probe, streamsMiniOld
---
File: 3d2bdfc94cd5e417-refactoring-9-kit-3d-lessons.md
Summary: refactoring-9: 3D가 핵심인 수업이 생기면 three.js를 kit에 넣는 남은 작업(kit 확장 handoff에서 보류된 항목)
Related Files: skills/learn-to-tell/kit/vendor/VERSIONS, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/gallery/catalog.html
Related Symbols: 없음
---
File: 0f72dd38f6236771-refactoring-10-move-v0-rejected-designs-to-rejections.md
Summary: refactoring-10: learn-to-tell-PROJECT.md에서 옮긴 v0 폐기 설계 표를 rejection 기록으로 정리하는 남은 작업
Related Files: learn-to-tell-PROJECT.md, agent-docs/rejections/index.md
Related Symbols: 없음
