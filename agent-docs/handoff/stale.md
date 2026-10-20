# Stale Index Archive
<!-- harness:stale-index-archive -->
---
File: 4f7ea6efa16f46da-kit-library-expansion.md
Summary: kit 확장 계획: 테마 자산(팔레트·폰트·아이콘), 설명 형태별 라이브러리, 도식 꺾인 화살표·중첩 영역·자동 배치·시퀀스 다이어그램, 부품 백로그
Related Files: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/vendor/VERSIONS, skills/learn-to-tell/gallery/catalog.html
Related Symbols: THEMES, ICONS, diagramLayout, LTT.diagram, LTT.auditScene
---
File: 6635afcb4d444207-hsl-lesson-feedback.md
Summary: HSL 색 수업 실사용 테스트 피드백(용어 그림, 색상 회전, 인출형 정리, 밝은 테마, ADR 제안) 반영 남은 작업
Related Files: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/gallery/catalog.html
Related Symbols: LTT.deck, terms, summary, LTT.lintDeck
---
File: b6a5a9acd7e7b268-knowledge-map-grid.md
Summary: 지식 map을 레슨 기록 원본·격자/focus view·leads_to·10개마다 연결 조사로 재설계하는 workflow, 구현 단계부터 재개
Related Files: agent-docs/specs/b6a5a9acd7e7b268-knowledge-map-grid.md, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/server/server.mjs, skills/learn-to-tell/map/
Related Symbols: derive, check, find, freshness, ltt-map
---
File: f0ceee98d2eb9ada-audit-1280x800-gallery.md
Summary: 1280×800 audit에서 경고가 나는 gallery 레슨 7개를 기준 변경 없이 고치는 남은 작업
Related Files: skills/learn-to-tell/gallery, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/kit/API.md
Related Symbols: auditScene, lintDeck
---
File: 4c26cb8f53d1c99b-replace-projectile-example-with-ontology.md
Summary: gallery 예시 projectile-drag를 /tmp/standalone.html 기반 ontology 기본 수업으로 교체하는 남은 작업(참고 파일 경로 미확인)
Related Files: skills/learn-to-tell/gallery/physics/projectile-drag.html, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/gallery/index.html
Related Symbols: LTT.autoLayout
---
File: a095db8efa4b543c-refactoring-7-mobile-support-decision.md
Summary: refactoring-7: 데스크톱 전용 ADR 8a61c967과 재도입된 모바일 reflow 코드의 충돌을 사용자 결정(ADR supersede 또는 분기 제거)으로 정리하는 작업
Related Files: agent-docs/adr/8a61c967e180bedb-desktop-only-min-720px.md, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/standalone.md
Related Symbols: LTT.mobile, mobileFit, LTT.autoLayout
---
File: f58211edae367035-refactoring-3-scene-budget-default.md
Summary: refactoring-3: SKILL.md §2에 장면 수 기본 예산(결정 변수당 4장면 이하, 전체 8~10)을 두고 한 챕터 전체는 명시적으로만 해제하는 작업
Related Files: skills/learn-to-tell/SKILL.md, learn-to-tell-PROJECT.md, skills/learn-to-tell/kit/ltt.js
Related Symbols: LTT.lintDeck
---
File: a3a320e98302b058-refactoring-2-api-core-and-part-docs.md
Summary: refactoring-2: kit/API.md를 항상 읽는 핵심과 쓸 때만 읽는 부품별 참조(kit/api/<part>.md)로 나누고 SKILL.md가 고른 부품만 읽게 하는 작업
Related Files: skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/, skills/learn-to-tell/SKILL.md, site/gallery/catalog.html, packages/ltt-kit/package.json, scripts/build.mjs, tests/api-docs.test.mjs, tests/api-docs-preservation.test.mjs, agent-docs/spec-logs/fd310baab4363801-api-split-cost-budget.md
Related Symbols: 없음
---
File: 47c0f728cfa2d600-refactoring-4-deck-type-meta-and-ctx-protocol.md
Summary: refactoring-4: 1·2·5·7번(run 0041d668222ce019)과 3·4·6번(run 74cb05d7da21907e: placement 측정 모듈, vw 규칙·widen 제거, audit 회귀 기준)이 구현됐고, 오류 경로 증거(handoff d7cbe1b9150ab344)가 끝나면 닫는다
Related Files: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/api/internals.md, skills/learn-to-tell/kit/API.md, tests/scene-types.test.mjs, tests/lint-rules.test.mjs
Related Symbols: LTT.sceneTypes, RENDERS, RULES, LTT.deckTypes, LTT.lintDeck, LTT.auditScene, placement, LTT.placement.zoomLock, measure
---
File: e72bbfb2418e2e6d-refactoring-5-scene-scale-deferred.md
Summary: refactoring-5: 장면 배율 보류 항목. 1·2번 기각 기록, 3번 측정 근거로 구현 안 함, 4번 공개 상태 resize 구현(run 74cb05d7da21907e). 오류 경로 증거(handoff d7cbe1b9150ab344)가 끝나면 닫는다
Related Files: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/API.md
Related Symbols: placement, LTT.placement.zoomLock, floatPanel, fit, LTT.stepper, diagram.send
---
File: fb7b84e0280f15ef-refactoring-8-gallery-audit-zero-and-cleanup.md
Summary: refactoring-8: 갤러리 12편을 1440×900·1280×800 audit 0건으로 맞추고(2026-10-18 헤드리스 측정 6·26+1·5건) tls13-quic의 죽은 코드와 ltt-meta를 정리하는 작업
Related Files: site/gallery, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-deck.js, tests/gallery.test.mjs
Related Symbols: LTT.auditScene, placement, streamsMiniOld
---
File: 2f6fe9bc88fb2faa-gallery-audit-zero-limit-evidence.md
Summary: 갤러리 audit 0건 run 1e62814b16984176이 verifier 예산 소진(limit)으로 멈춤: 갤러리 13편 두 크기 0건·기준선 0·hero 실제 layout은 끝났고, R-3 단계 자막(TF-4)·R-6 JS 표기(TF-5) 증거의 감사만 남음
Related Files: site/gallery, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/API.md, tests/gallery-audit.baseline.json, agent-docs/spec-logs/1e62814b16984176-gallery-audit-zero.md, agent-docs/spec-logs/1e62814b16984176-review.mjs
Related Symbols: LTT.auditScene
---
File: 12094d07d53f7dff-refactoring-6-kit-css-files.md
Summary: refactoring-6: 다섯 kit 모듈의 CSS 문자열 588줄을 .css 파일로 분리하고 각 JS가 자기 경로 기준으로 link를 넣게 하는 작업
Related Files: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/ltt-ui.js, skills/learn-to-tell/kit/ltt-mock.js, skills/learn-to-tell/kit/ltt-deck.js, packages/ltt-kit/package.json
Related Symbols: STYLE, themeCss, KIT
---
File: d7cbe1b9150ab344-placement-module-error-path-evidence.md
Summary: 측정 모듈 분리 run 74cb05d7da21907e가 verifier 예산 소진(limit)으로 멈춤: 구현·테스트는 끝났고 R-2 오류 fixture의 판별력(TV-6: 공개 상태 재측정 throw의 zmax 1·warn 문구, E-2 `.pk` 정리)만 남음
Related Files: skills/learn-to-tell/kit/ltt-deck.js, agent-docs/spec-logs/74cb05d7da21907e-cdp-review.mjs, agent-docs/spec-logs/74cb05d7da21907e-error-fixture.html, agent-docs/spec-logs/74cb05d7da21907e-placement-module-float-aware-zoom.md
Related Symbols: placement, LTT.placement.zoomLock
---
File: 0f72dd38f6236771-refactoring-10-move-v0-rejected-designs-to-rejections.md
Summary: refactoring-10: learn-to-tell-PROJECT.md에서 옮긴 v0 폐기 설계 표를 rejection 기록으로 정리하는 남은 작업
Related Files: learn-to-tell-PROJECT.md, agent-docs/rejections/index.md
Related Symbols: 없음
---
File: 418133af7560aefc-refactoring-1-skill-time-breakdown.md
Summary: refactoring-1 compare1 실험의 skill·기준선 서브에이전트 소요 시간 분해 원자료(단계·도구·이벤트 시각)
Related Files: site/compare1/index.html, agent-docs/handoff/b41cd6aec66a2589-refactoring-1-lesson-cost-ledger.md
Related Symbols: 없음
---
File: d422e4de167b576d-lint-hook-art-non-string.md
Summary: lint: hook `art`(와 iconOr를 거치는 icon 필드)에 문자열이 아닌 값이 오면 "고침"으로 잡는 작업, 착수 전
Related Files: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/api/rules.md, skills/learn-to-tell/kit/API.md, tests/lint-rules.test.mjs
Related Symbols: RULES, iconOr, LTT.lintDeck
