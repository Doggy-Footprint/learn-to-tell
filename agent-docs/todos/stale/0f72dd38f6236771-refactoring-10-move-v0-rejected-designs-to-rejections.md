# v0 폐기 설계 표를 rejection 기록으로 옮기기

## Goal

"7장은 handoff로 넘겨서 이후에 rejection에 추가하게 해."

## State

- branch: `master`, 기준 commit: `b7ded9d` (커밋 전 상태에서 작성).
- 변경 파일: `learn-to-tell-PROJECT.md`(7장 "폐기한 설계와 이유" 제거, 기존 8장을 7장으로), `agent-docs/handoff/index.md`, 이 파일.
- `agent-docs/rejections/`에 작성된 기록은 아직 없다. 옮긴 표는 아래 "## Moved Table"에 원문 그대로 있다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |

## Next Step

1. "## Moved Table"의 각 행을 AGENTS.md Rejection Record Rule 구조(Title, Context, Rejected Alternative, Reason, Revisit Condition, Chosen Instead)로 초안을 만든다.
2. ADR 체크리스트를 모두 만족하는 행은 rejection 대신 ADR의 Alternatives로 제안한다.
3. 초안을 사용자에게 보여 주고 확인받은 뒤 `agent-docs/rejections/`에 쓰고 `index.md`를 갱신한다.
4. 모든 행을 처리하면 이 파일의 index 항목을 `stale.md`로 옮기고 파일을 `stale/`로 옮긴다.

## Open Questions

- Revisit Condition은 "map 저장소 견고화" 행에만 있다("실제 문제가 확인되면 다시 검토"). 나머지 행은 사용자에게 받아야 한다.
- 2026-10-13 결정으로 일부 행의 Chosen Instead가 표와 달라졌다.
  - "결과 JSON 다운로드 후 경로를 agent에 전달": 새 설계는 대화가 아니라 경량 로컬 서버로 브라우저 결과를 받는다.
  - "Observable Framework 빌드 + 로컬 서버": 새 설계도 경량 서버를 쓰므로, 남는 폐기 이유는 빌드 필요와 무거운 런타임이다.
  - "상황 카드로 바로 시작하는 진단": 새 설계의 진단에서 상황 카드 단계가 빠졌다(`learn-to-tell-PROJECT.md` 3장 진단).

## Spec

해당 없음. workflow-approach를 거치지 않은 문서 작업이다.

## Execution Ledger

- 2026-10-19: Moved Table 8행을 agent-docs/rejections/ 기록 8개로 옮기고 index.md를 갱신했다(행 합치기 없음).

## Moved Table

`learn-to-tell-PROJECT.md` 7장 "폐기한 설계와 이유"(commit `b7ded9d` 기준) 원문.

| 설계 | 폐기 이유 |
| --- | --- |
| 브라우저 진단 페이지(카드 + 4가지 반응) | 모르는 상태에서 카드에 반응하려면 "내가 아는 개념인지" 되물어야 하는데 페이지에서는 불가능했다 → 대화 진단 |
| 상황 카드로 바로 시작하는 진단 | 낯선 용어가 곧바로 나와 대처하기 힘들고, 모두 "모름"이면 구분되지 않았다 → 개념 사다리를 먼저 |
| 결과 JSON 다운로드 후 경로를 agent에 전달 | 사용자 조작 부담이 컸다 → v0 말기에는 서버 수신, 새 설계에서는 대화 |
| Observable Framework 빌드 + 로컬 서버 | 수업마다 빌드·서버 실행이 필요하고 런타임이 무거웠다 → 단일 HTML + kit |
| 버전이 붙은 엄격한 JSON 계약(lesson v1–v4, diagnostic v1–v2) | 설계가 바뀔 때마다 계약, 검증기, 테스트를 연쇄로 수정해야 했다 |
| map 저장소 견고화(원자적 쓰기, 백업 5개, restore, 토큰 확인 delete, revision 충돌, content hash) | 단일 사용자의 작은 파일에는 과했다. 실제 문제가 확인되면 다시 검토 |
| 수업 시간 15분 하한, 결정 변수·개념 수 상한 | 간단한 개념을 억지로 늘리게 만들었다 |
| 범위를 사용자에게 확인받는 단계 | 사용자가 판단할 근거가 없는 질문이었다 → agent가 정하고 알리기만 |
