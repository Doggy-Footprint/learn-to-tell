# T5 남은 작업 (T5-2 ~ T5-4)

## Goal
"T5 계획 해줘" → 승인된 계획(진단과 자료 생성 skill: 작업 유무별 간소 체험, 범위 조정, 콘텐츠 검증; agent가 lesson과 도메인 모델 코드까지 생성).

## State
- branch: main, base commit: 34a51f91b2eb991b11f17164a12d52c03320bfb0
- 변경 파일: `agent-docs/specs/fd5077c6a63a8fb9-t5-1-lesson-v2-model-contract.md`(draft), 이 handoff
- T5-1 완료(커밋 "impl: T5-1 lesson v2 and model/oracle contract"): contracts/definitions.mjs, contracts/index.mjs, contracts/model.mjs, examples/manufacturing-inspection/{model.mjs,lesson-v2.mjs,oracle.json}, tests/contracts-v2.test.mjs, tests/fixtures/contracts-v2/, 기존 테스트 F8 예외 4건

## Failed Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| 없음 | — | — |

## Next Step
1. T5-1 완료·커밋됨. 다음은 2번 T5-2 spec 초안부터.
2. **T5-2 생성물 검증·배치 CLI** (`scripts/lesson.mjs` 제안)
   - `check-model`: 모델 `calculate`를 oracle 케이스와 대조하고, 경계·null·비유한값·입력 불변을 검사한다.
   - `place-diagnostic`·`place-lesson`: `~/.learn-to-tell/profiles/<id>/{diagnostics,lessons,models}/`에 원자적으로 쓴다(`knowledge/store.mjs` 패턴).
   - 분량 검사: 결정 변수 1–2, 개념 ≤5, 15–20분. 초과 시 분할 제안 오류를 낸다.
   - map.revision 증가와 nextPaths 갱신(T4에서 넘어온 항목).
3. **T5-3 일반 런타임 + 진단 페이지**
   - `site/src/components/ui.js`, `learning/progress.mjs`·`grading.mjs`·`result.mjs`·`storage.mjs`의 제조 검사 import를 lesson v2 선언 기반으로 바꾼다.
   - `scripts/build-lesson.mjs`가 profile 폴더의 lesson·model을 scratch tree로 복사한다.
   - 진단 페이지: 카드 2–3개, 조작 1개, 4가지 반응, 최대 2라운드, JSON 내보내기.
   - 기존 e2e·오프라인·키보드·axe를 유지한다.
4. **T5-4 사용자 skill** `skills/learn-to-tell/SKILL.md`
   - 흐름: 진단 → 범위 합의 → lesson·model·oracle 생성 → check-model → (필요 시) 독립 검증 서브에이전트 → 배치·빌드·serve → import.
   - 검증: 고정 맥락 2개(작업 있음/없음)로 실제 실행.

## Open Questions
- 생성 모델 코드 실행 격리: 동일 프로세스 import vs 자식 프로세스 + 시간 제한 (T5-2)
- 진단 선택 → diagnostic 문서 변환 책임: 브라우저 vs CLI (T5-2/T5-3)
- Codex 앱에서 독립 검증 서브에이전트를 호출하는 방법 (T5-4)
- 분할 회차 연결: nextPaths만 쓸지, lesson series 필드를 추가할지 (T5-2)
- T5-1 잔여 권고: oracle absolute 검사 테스트가 case 0만 확인; 일부 prefix 단언; `knowledge/store.mjs:79-80` coverage가 실행에 따라 미달(99.88%)하는 비결정성(T4 코드, 원인 미확인)

## Spec
- T5-1 archived: `agent-docs/spec-logs/fd5077c6a63a8fb9-t5-1-lesson-v2-model-contract.md`, version 3, status complete, run ID fd5077c6a63a8fb9
- T5-2 ~ T5-4: spec 미작성

## Execution Ledger
- T5-1: findings B1·B2(테스트 누락) 해결, mutation M1–M3 모두 검출, correction batches 3, verifier invocations 2 (최종 PASS). 상세는 archived spec ledger
