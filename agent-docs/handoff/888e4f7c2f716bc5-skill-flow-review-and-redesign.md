# SKILL.md 흐름 검토와 Design Principles 기반 재설계 착수

## Goal

"이 스킬을 수행하는 AI agent가 어떤 단계를 거치는지 단계별로 자세하게 설명해줘" → "서브 에이전트에게 이 흐름의 잠재적 문제점을 옆에서 보고 체크하라고 해줘" → "이 세션 잘 정리해서 handoff로 남겨. 다음 세션에서 진행해야겠다."

## State

- 브랜치 `education-first`, 커밋 `6558676`(ADR·계획·AGENTS·SKILL 수정), `5e95796`(계획 98c0e5bb, 이 handoff) 이후 이 handoff 보완 커밋.
- 이번 세션에서 바뀐 파일:
  - `AGENTS.md`: Project Definition 다음에 `# Design Principles`(사용자가 다듬은 6개 원칙)를 harness 표시 앞에 두었다. Comment Enforcement에 kit 파트 검색 키워드 주석 예외를 추가했다(harness 영역 안이지만 harness는 개별 수정이 있으면 덮어쓰지 않는다고 사용자가 확인).
  - `intent.md`: Design principles는 AGENTS.md로 옮겼다. Open questions는 품질 측정, 비용 목표 둘.
  - `skills/learn-to-tell/SKILL.md`: 100k tokens 새 세션 권고 삭제 / §0에 기존 수업 판정(`lesson.html`이 있어야 이미 있는 수업) / §3 audit 6–8번 합쳐 최대 4회, 이후 고칠 것이 남으면 사용자 허락 / outline에 학습자 평가 기준을 제작 전에 적고 §4가 그것을 씀 / §2 범위 문장을 "진단으로 정해진 범위 안에서 agent가 우선 결정, 필요하면 질문"으로 교체.
  - `agent-docs/adr/6ff15ad3eef7b88d-kit-as-auxiliary-library.md`(Accepted) + index.
  - `agent-docs/plans/eff0795231314dc5-kit-auxiliary-screenshot-check.md`, `agent-docs/plans/98c0e5bb55098a10-skill-redesign-by-principles.md` + index.
- GitHub issue #16: `/fork` 안내 대신 백그라운드 생성 서브에이전트로 학습 세션 분리. **이 작업 범위 밖이다. 다시 묻지 않는다.**

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| 계획 98c0e5bb 초안에 fork 제거(R0·R2)와 storyboard 질의 시점 질문을 넣음 | 사용자: "포크에 대한 내용은 issue로 넘겼는데 왜 계속 물어보지?", "작업할 때 당연히 학습을 진행할지 물어보고 storyboard를 준비해야지" | verified: issue로 넘긴 범위를 계획에 다시 끌어들였고, 사용자 흐름상 자명한 것을 질문함. 계획에서 제거함 |
| Design Principles를 AGENTS.md `<!-- harness:begin -->` 안쪽에 삽입 | 삽입 직후 확인 | verified: 삽입 위치 계산 실수. 표시 앞으로 옮김 |

## Next Step

1. 계획 `98c0e5bb55098a10`의 R1 = 계획 `eff0795231314dc5`의 1단계부터 시작한다: 코드 검출 규칙(B 갈래: `unknown-term`, `used-before-defined`, `predict-new-term`, `filler-content`, `goal-unreachable`, `goal-at-start`, `LTT.expect` 불일치)을 `kit/ltt-deck.js`의 `audit()`(1195–1208)에서 kit 공통 코드로 떼어 내 deck이 아닌 페이지에서도 `#ltt-check` JSON과 `lint` 이벤트를 내게 한다. `recall` 기록(`ltt-deck.js:797`)도 deck 밖에서 되게 한다.
2. 단계마다 사용자 확인을 받는다.

## Open Questions

- 없음(이번 세션에서 결정됨). 결정 요약:
  - 필수 kit 파트: theme, `LTT.record`, `{{용어}}`, `LTT.expect`.
  - 기대값은 생성 agent가 모델 코드보다 먼저 적고, 검증 서브에이전트는 불일치 출력만 확인한다.
  - 학습자 평가 기준(`outline.md`)과 자료 검증표(`checklist.md`)는 다른 파일. 파일 이름은 agent 기본값(바꿀 수 있음).
  - kit 검색 키워드는 각 kit 파트 머리의 코드 주석(유지보수 편의, 검색 후 바로 봄).
  - 기존 수업이 있으면(`lesson.html` 존재) 다시 열지 새로 만들지 사용자에게 묻는다: agent 기본값, 사용자 거부 없음. 자동으로 다시 열기로 바꿀 수 있다.
  - SKILL.md 범위 문장은 초기 scaffold(`26644e0`)부터 있던 "알리기만 한다(묻지 않는다)"를 사용자가 교체 지시함. intent Problem 1(모호한 상황에서 LLM의 임의 결정)과는 다른 문제로 정리됨.
  - audit 규칙 3갈래 분류는 계획 `eff07952` "규칙 분류" 표를 사용자가 승인함.

## 방향 미정 (사용자에게 지적했으나 결정되지 않음)

- 성공(품질) 측정 방법, 수업당 비용 목표: `intent.md` Open questions 1·2.
- simple 경로(§2 "조작해서 관찰할 필요가 없으면")의 판단 기준이 모호하고, kit 보조화 뒤 경계가 더 흐려진다.
- `standalone.md:7, 26`이 참조하는 `<skill>/VERSION`은 빌드 zip에만 생긴다(`scripts/build.mjs:34`).

## Spec

없음(workflow-approach spec을 만들지 않았다).

## Execution Ledger

외부 검토 서브에이전트 1회(SKILL.md 흐름 잠재 문제). 주요 지적과 처리:

| 지적 | 처리 |
| --- | --- |
| 형식 자유인데 audit·recall·lint가 `LTT.deck`에서만 동작(`ltt-deck.js:797, 996, 1195–1208`, `audit.mjs:125`) — 파일로 확인 | ADR 6ff15ad3 + 계획 eff07952 |
| 판정 서브에이전트에 줄 contact sheet 없음(`--shots` 없을 때 PNG 안 남김, `audit.mjs:30`) — 확인 | 계획 eff07952 3단계(스크린샷 도구)로 대체 |
| `standalone.md`가 참조하는 `<skill>/VERSION`이 소스에 없음(빌드 zip에만) — 확인 | 미처리 |
| `look/src/` 디렉터리 없음(SKILL.md §3 3번이 참조) — 확인 | 계획 eff07952 4단계 |
| fork 판정·원래 세션 찾기 불가 | issue #16 |
| 실패·이탈 경로 | 사용자 이탈은 다루지 않음. 기존 수업 판정·audit 상한 규칙 추가 |
| 검토 서브에이전트 outline-only 구조 한계 | 단일 검증 서브에이전트 + 생성 agent 선기록 기대값으로 대체(계획) |
| 자기 보고 진단 편향, 범위 비공개 | 평가 기준 선기록, 범위 문장 교체 |
| map 퀴즈 1회 결정·도움 받은 pass 구분 없음 | 미처리 |
| context 폭증 | 미처리(계획 R4 시험에서 비용 측정) |

구현 변경·테스트·mutation 없음. 수정·검증 카운터 0.
