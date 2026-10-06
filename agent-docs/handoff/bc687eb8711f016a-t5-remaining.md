# T5 남은 작업 (T5-2 ~ T5-4)

## Goal
"T5 계획 해줘" → 승인된 계획(진단과 자료 생성 skill: 작업 유무별 간소 체험, 범위 조정, 콘텐츠 검증; agent가 lesson과 도메인 모델 코드까지 생성).

## State
- branch: main, base commit: b05f8efa8c5dbb39f7bfa04e717a3bf7105fbfe3
- T5-2 완료(미커밋, 2026-10-06): scripts/lesson.mjs, authoring/{check-model,model-runner,probes,diagnose,place}.mjs, package.json(coverage include), contracts/{definitions,index}.mjs(nextPath lessonStatus), tests/{authoring,lesson-cli}.test.mjs, tests/fixtures/{authoring,contracts,knowledge}/ 갱신
- 변경 파일: 이 handoff, T5-2 spec(archived)
- T5-1 잔여 권고 A-1–A-3 처리 완료: `tests/fixtures/knowledge/faults.mjs`(readFail이 readdir도 실패시킴), `tests/knowledge.test.mjs`(backups 디렉터리 EACCES), `tests/fixtures/contracts-v2/{cases.mjs,manifest.json}`(마지막 oracle case absolute 검사, prefix 단언을 leaf 경로로 강화)
- T5-1 완료(커밋 "impl: T5-1 lesson v2 and model/oracle contract"): contracts/definitions.mjs, contracts/index.mjs, contracts/model.mjs, examples/manufacturing-inspection/{model.mjs,lesson-v2.mjs,oracle.json}, tests/contracts-v2.test.mjs, tests/fixtures/contracts-v2/, 기존 테스트 F8 예외 4건

## Failed Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| `knowledge/store.mjs:79-80` coverage 비결정성 조사 | catch에 임시 로그 삽입 후 knowledge·map-cli 전체 실행 시 로그 0회 | `throw readFailure` 경로는 어떤 테스트도 실행하지 않았고, 100% 보고는 V8 block coverage 범위 착시 (verified). readdir EACCES 테스트 추가로 해결 |

## Next Step
1. T5-2 완료. 다음: T5-3 spec 작성. T5-3에서 `build-lesson`이 profile 폴더 lesson·model을 쓰고, 진단 페이지가 diagnostic-choices v1(T5-2 spec Signatures)을 내보낸다.
2. ~~**T5-2 생성물 검증·배치 CLI**~~ (완료; 15–20분 검사는 lesson 계약 RANGE에 맡김, nextPath `lessonStatus: placed|planned` 추가) (`scripts/lesson.mjs` 제안)
   - `check-model`: 자식 프로세스+timeout으로 모델 `calculate`를 oracle 케이스와 대조하고, 경계·null·비유한값·입력 불변을 검사한다.
   - `place-diagnostic`·`place-lesson`: `~/.learn-to-tell/profiles/<id>/{diagnostics,lessons,models}/`에 원자적으로 쓴다(`knowledge/store.mjs` 패턴).
   - 분량 검사: 결정 변수 1–2, 개념 ≤5, 15–20분. 초과 시 분할 제안 오류를 낸다.
   - `diagnose`: 브라우저 원시 선택 JSON을 diagnostic 문서로 변환·검증한다.
   - map.revision 증가와 nextPaths 갱신(T4에서 넘어온 항목). 분할 회차도 nextPaths로 연결한다.
3. **T5-3 일반 런타임 + 진단 페이지**
   - `site/src/components/ui.js`, `learning/progress.mjs`·`grading.mjs`·`result.mjs`·`storage.mjs`의 제조 검사 import를 lesson v2 선언 기반으로 바꾼다.
   - `scripts/build-lesson.mjs`가 profile 폴더의 lesson·model을 scratch tree로 복사한다.
   - 진단 페이지: 카드 2–3개, 조작 1개, 4가지 반응, 최대 2라운드, 원시 선택 JSON 내보내기.
   - 기존 e2e·오프라인·키보드·axe를 유지한다.
4. **T5-4 사용자 skill** `skills/learn-to-tell/SKILL.md`
   - 흐름: 진단 → 범위 합의 → lesson·model·oracle 생성 → check-model → (필요 시) Claude Code 독립 검증 서브에이전트 → 배치·빌드·serve → import.
   - 검증: 고정 맥락 2개(작업 있음/없음)로 실제 실행.

## Decisions (사용자 결정, 2026-10-05)
- 생성 모델 코드 실행 격리: 자식 프로세스 + 시간 제한 (T5-2 check-model)
- 진단 선택 → diagnostic 문서 변환: CLI 책임. 브라우저는 원시 선택 JSON만 내보낸다 (T5-2/T5-3)
- 분할 회차 연결: nextPaths만 사용, lesson 계약 변경 없음; 미배치 lesson은 nextPath `lessonStatus:'planned'` (T5-2, D2 2026-10-06)
- 배치 실패 시 이번 호출이 만든 파일·디렉터리 모두 제거 (T5-2, S1)
- 독립 검증 서브에이전트: Claude Code만 지원, Codex는 후속 (T5-4)

## Open Questions
- 없음

## Spec
- T5-1 archived: `agent-docs/spec-logs/fd5077c6a63a8fb9-t5-1-lesson-v2-model-contract.md`, version 3, status complete, run ID fd5077c6a63a8fb9
- T5-2 archived: `agent-docs/spec-logs/d1adf29b9bdfe2b8-t5-2-authoring-cli.md`, version 4, status complete, run ID d1adf29b9bdfe2b8
- T5-3 ~ T5-4: spec 미작성

## Execution Ledger
- T5-1: findings B1·B2(테스트 누락) 해결, mutation M1–M3 모두 검출, correction batches 3, verifier invocations 2 (최종 PASS). 상세는 archived spec ledger
- T5-2: 첫 실행 F1–F4 + 계약 충돌 2건(D1, D2), verifier 1 VF1–VF5·S1 → 모두 해결, mutation M1–M3 검출, correction batches 2, verifier invocations 2 (최종 PASS). 비차단 권고 A1–A6, 동시 쓰기 시 생성 디렉터리 재귀 삭제 위험
