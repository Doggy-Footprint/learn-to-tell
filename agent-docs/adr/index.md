File: 06a89373c78aaf85-rewrite-v0-with-minimal-design.md
Summary: v0를 폐기하고 최소 설계로 재작성하며, 기반 장치는 실사용 문제 확인 뒤로 미루는 설계 규칙
Related Files: learn-to-tell-PROJECT.md
Related Symbols: 없음
---
File: 190db09929e4196e-distribute-as-harness-extension.md
Summary: learn-to-tell을 harness 확장으로 배포하고, 방식이 정해질 때까지 원본 위치·상대 경로·개발용 링크 규칙을 둔다
Related Files: skills/learn-to-tell/SKILL.md, .claude/skills/learn-to-tell
Related Symbols: 없음
---
File: 90dd94ba2dec2365-auto-layout-with-elkjs.md
Summary: 도식 자동 배치에 elkjs(EPL-2.0, layered)를 vendor하고 dagre·Mermaid를 기각한 결정
Related Files: skills/learn-to-tell/kit/vendor/elk.bundled.js, skills/learn-to-tell/kit/vendor/LICENSE-elkjs, skills/learn-to-tell/kit/ltt-parts.js
Related Symbols: LTT.autoLayout, LTT.state
---
File: 6f876d6c883ac0b6-fix-feedback-at-the-generator.md
Summary: 수업 하나에 대한 피드백은 그 수업이 아니라 skill(kit·SKILL.md·gallery·검증)에서 원인을 찾아 고치는 작업 범위 규칙
Related Files: skills/learn-to-tell/SKILL.md, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/gallery/index.html
Related Symbols: 없음
---
File: b130c928be880b9c-infographic-for-learning-recall-for-summary.md
Summary: 학습 장면(terms 포함)은 인포그래픽 우선, summary는 recall 질문 → 답 공개의 글 인출 연습으로 둔 결정
Related Files: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/SKILL.md
Related Symbols: LTT.deck, LTT.lintDeck, terms, summary
---
File: 8a61c967e180bedb-desktop-only-min-720px.md
Summary: 수업 화면을 폭 720px 이상 데스크톱 전용으로 하고 휴대폰 레이아웃·390×844 점검을 없앤 결정
Related Files: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-ui.js, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/kit/API.md
Related Symbols: LTT.deck, LTT.auditScene, fit, measure
---
File: 0b47efebac2cbc9f-overview-after-recall.md
Summary: 한 장 인포그래픽 정리를 summary(회상) 뒤, keywords 앞의 overview 장면으로 두고 수업마다 대표 그림 위에 직접 그리게 한 결정
Related Files: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/kit/API.md
Related Symbols: LTT.deck, LTT.lintDeck, overview, summary
---
File: 40552fcb2a7c3985-lock-scene-scale-on-entry.md
Summary: predict·stepper·recall의 배율을 장면 진입 시 모든 상태를 화면 밖에서 미리 그려 고정하고, 측정 중 send 연출과 CSS transition을 끄는 결정
Related Files: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/API.md
Related Symbols: lockZoom, probe, measureAll, widen, recallList, LTT.measure, LTT.stepper
