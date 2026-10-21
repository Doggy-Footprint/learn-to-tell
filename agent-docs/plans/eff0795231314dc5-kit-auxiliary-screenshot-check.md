# kit 보조화와 스크린샷·검증표 점검 실행 계획

출처: ADR `6ff15ad3eef7b88d-kit-as-auxiliary-library.md`. 상태: 사용자 검토 대기. 브랜치 `education-first`.

`b4c8f31281e094e4-education-first.md`의 3단계(audit 페이지화)와 5단계(contact sheet 판정)를 이 계획이 대체한다. 그 계획의 1·2·4·6단계(storyboard, shot few-shot, `LTT.clock`, 블라인드 A/B)는 그대로 둔다.

## 사용자 결정 (2026-10-21)

- 수업 구조는 agent가 정한다. kit은 같은 구조가 있을 때만 쓰는 보조 라이브러리다.
- kit 파트는 머리 주석의 축별 키워드(설명 대상, 방식, 그림 종류)를 grep해 찾는다. kit 전체를 읽지 않는다. 주석 예외는 AGENTS.md Comment Enforcement에 추가했다.
- 필수 파트: theme, `LTT.record`(이벤트 기록), `{{용어}}` 풀이, `LTT.expect`.
- audit을 없앤다. 결정적으로 고칠 수 있는 결함은 kit이 자동 보정하고, 나머지는 스크린샷과 검증표로 점검한다. 움직이는 그림은 idle 또는 마지막 단계를 찍는다.
- 한 agent가 계획 → 검증표 → 생성을 하고, 서브에이전트 하나가 검증표로만 검증한다. 보고는 만족하지 않는 항목만 한다.
- 학습자 평가 기준(`outline.md`)과 자료 검증표(`checklist.md`)는 다른 파일이다. 검증표는 파일로 공유하고 출력 토큰으로 다시 내지 않는다.
- 기대값(`LTT.expect`)은 생성 agent가 모델 코드보다 먼저 적는다. 서브에이전트는 불일치 출력만 확인한다.
- 기존 검토(글·개념)·판정(그림) 서브에이전트 둘은 검증 서브에이전트 하나로 합친다.

## 규칙 분류 (`kit/api/rules.md` 기준)

| 갈래 | 규칙 | 처리 |
|---|---|---|
| A. 자동 보정 | 글자 너무 작음(새 규칙), `many-sizes`, `hscroll`, `overflow`, `panel-overlap`, `graph-overlap`, `no-theme`, `unknown-theme`, `unused-term` | kit이 렌더링 때 고친다. 보고하지 않는다 |
| B. 코드 검출, agent 수정 | `unknown-term`, `used-before-defined`, `predict-new-term`, `filler-content`, `goal-unreachable`, `goal-at-start`, `LTT.expect` 불일치 | 스크린샷 도구가 오류로 출력한다. 0건이어야 공개한다 |
| C. 판단 | `small-visual`, `loose-figure`, `empty-stage`, `no-signature`, `card-monotony`, `no-reading-guide`, `goal-narrow`, `shrunk`(78% 미만), deck 순서 규칙(`overview-*`, `keywords-last`, `summary-no-recall`, `term-no-visual`, `no-title`) | `checklist.md` 항목으로 바꿔 스크린샷과 대조한다. deck 순서 규칙은 "수업 끝에 한 장 정리와 recall이 있다" 같은 형식 무관 항목으로 바꾼다 |

## 단계 (각 단계 끝에 사용자 확인)

| # | 내용 | 수정 대상 | 사용자가 보는 것 |
|---|---|---|---|
| 1 | B 검출을 deck에서 떼어 낸다. 용어·채움 글·goal·expect 검사를 페이지 로드 후 kit 공통 코드가 돌리고 결과를 `#ltt-check` JSON과 `lint` 이벤트로 낸다. deck은 장면 정보만 덧붙인다. `recall` 이벤트도 deck 밖에서 기록되게 한다 | `kit/ltt.js`, `kit/ltt-deck.js` | deck이 아닌 시험 페이지의 B 출력 |
| 2 | A 자동 보정: 최소 글자 크기와 theme 크기 단계 맞춤, 가로 넘침 줄바꿈·배율, 자막·정답 칸 빈자리 이동, 그래프 재배치, 기본 theme, 안 쓴 풀이 제거. 보정 전후를 `autofix` 이벤트로 남긴다(보정이 결함을 가리는지 나중에 보려고) | `kit/ltt.js`, `kit/ltt-ui.js`, `kit/ltt-parts.js` | 결함을 심은 시험 페이지의 보정 전후 스크린샷 |
| 3 | `server/audit.mjs`를 스크린샷 도구로 바꾼다. 1440×900·1280×800에서 페이지를 스크롤하며 찍고, `LTT.clock` 그림은 idle(정지 상태) 또는 마지막 t를 찍는다. 출력은 PNG 경로 목록과 B 오류뿐이다. 레이아웃 판정 코드(`LTT.auditScene`)와 "고침/권고" 등급, 4회 상한을 지운다 | `server/audit.mjs`(이름 변경 검토), `kit/ltt.js`, `kit/ltt-deck.js` | 스크린샷 도구 출력 예시 |
| 4 | kit 파트 머리에 축별 검색 키워드 주석을 단다. 축: 설명 대상(예: 시간에 따른 변화, 구성 요소 관계), 방식(2D 지도 위, diagram, 흐름도, 그래프, 목업), 그림 종류. `kit/API.md`는 필수 파트와 페이지 계약, grep 방법만 남기고 파트 목록을 지운다. `look/look.md` 색인도 같은 축으로 맞추고, 없는 `look/src/` 참조를 정리한다 | `kit/*.js`, `kit/API.md`, `kit/api/*.md`, `look/look.md` | `grep` 예시 3개와 결과 |
| 5 | SKILL.md §3을 다시 쓴다. 순서: outline(학습자 평가 기준 포함) → `checklist.md`(C 항목 + 결정 변수별 그림 항목 + 계산 지점 기대값) → storyboard → lesson.html → 스크린샷 도구 → 검증 서브에이전트(`checklist.md`와 PNG 경로, B 출력만 받는다. 만족하지 않는 항목만 보고) → Edit 반영. 검토·판정 서브에이전트 절을 지운다. 반영 후 다시 찍는 횟수 상한과 상한 뒤 사용자 허락 규칙을 둔다 | `SKILL.md` | `SKILL.md` §3 전후 요약 |
| 6 | 시험 생성: 기존 gallery 주제 하나로 새 절차를 돌려 비용(`result.md` 생성 비용)과 검증 보고를 현행본과 비교한다 | 저장소 밖 | 비교표 |

1과 3은 B 출력 형식을 공유하므로 한 묶음으로 되돌린다. 2는 독립적으로 되돌릴 수 있다.

## 남은 위험

- 자동 보정이 판단이 필요한 결함(예: 내용이 너무 많아 글자가 작아짐)을 가릴 수 있다. 2단계의 `autofix` 이벤트를 검증 서브에이전트에게 보여 줄지는 6단계 결과를 보고 정한다.
- 기대값을 생성 agent가 적으므로 독립 계산이 없다. 6단계에서 계산 오류가 나오면 검증 서브에이전트의 독립 계산을 다시 검토한다.
