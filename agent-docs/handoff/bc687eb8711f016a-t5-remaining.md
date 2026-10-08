# T5 남은 작업 (T5-2 ~ T5-4)

## Goal
"T5 계획 해줘" → 승인된 계획(진단과 자료 생성 skill: 작업 유무별 간소 체험, 범위 조정, 콘텐츠 검증; agent가 lesson과 도메인 모델 코드까지 생성).

## State
- T5-4 진행 중(2026-10-07, 미커밋): skills/learn-to-tell/{SKILL.md,reference.md,manifest.json}, scripts/install-skill.mjs(`--dest` 반복, config.json에 런타임 root 기록, 남의 동명 skill은 CONFLICT). 검증용 테스트 프로젝트 위치는 `/Users/hwansu/tmp/ltt-test-projects/`로 고정(사용자 결정 2026-10-07): {ab-test-sample-size(kunal-kotian/ab_testing_sample_size_calculator),base-rate-fallacy(bogdan-kulynych/base_rate_fallacy_demo)} --depth 1, project-scoped 설치 완료. 사용자가 직접 실행 후 피드백 예정
- branch: main, base commit: b05f8efa8c5dbb39f7bfa04e717a3bf7105fbfe3
- T5-3 완료(미커밋, 2026-10-06, base 47832bd): lesson v2 concept 카드 필드, learning/·site/ 일반 런타임(createRuntime), 출력 막대+표, build-lesson `--lesson --model`, 진단 페이지(site/diagnostic, scripts/build-diagnostic.mjs → dist-diagnostic/), serve `--target`, learning/diagnostic-setup.mjs, grid.js 삭제; tests 전반 이관(tests/build.test.mjs, e2e generic·diagnostic 추가)
- T5-2 완료(미커밋, 2026-10-06): scripts/lesson.mjs, authoring/{check-model,model-runner,probes,diagnose,place}.mjs, package.json(coverage include), contracts/{definitions,index}.mjs(nextPath lessonStatus), tests/{authoring,lesson-cli}.test.mjs, tests/fixtures/{authoring,contracts,knowledge}/ 갱신
- 변경 파일: 이 handoff, T5-2 spec(archived)
- T5-1 잔여 권고 A-1–A-3 처리 완료: `tests/fixtures/knowledge/faults.mjs`(readFail이 readdir도 실패시킴), `tests/knowledge.test.mjs`(backups 디렉터리 EACCES), `tests/fixtures/contracts-v2/{cases.mjs,manifest.json}`(마지막 oracle case absolute 검사, prefix 단언을 leaf 경로로 강화)
- T5-1 완료(커밋 "impl: T5-1 lesson v2 and model/oracle contract"): contracts/definitions.mjs, contracts/index.mjs, contracts/model.mjs, examples/manufacturing-inspection/{model.mjs,lesson-v2.mjs,oracle.json}, tests/contracts-v2.test.mjs, tests/fixtures/contracts-v2/, 기존 테스트 F8 예외 4건

- T5-4 F2 변경(미커밋): contracts/{definitions,index}.mjs(diagnostic v2 reactions), scripts/{lesson,serve}.mjs, skills/learn-to-tell/{SKILL,reference}.md, .gitignore, 삭제(authoring/diagnose.mjs, learning/diagnostic-setup.mjs, scripts/build-diagnostic.mjs, site/diagnostic/), tests/ 이관·tests/skill-docs.test.mjs 신설
- T5-4 F3 변경(미커밋, 2026-10-07): contracts/{definitions,index}.mjs(diagnostic v2 필수 `ladder`, migration 없음), skills/learn-to-tell/{SKILL,reference}.md 2단계 재작성(개념 사다리 → 상황 카드), ROADMAP §4 재작성·§5 시각화 미결 항목, tests/ 갱신. 설치된 테스트 프로젝트의 skill은 `scripts/install-skill.mjs`로 재설치해야 반영된다

## Failed Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| `knowledge/store.mjs:79-80` coverage 비결정성 조사 | catch에 임시 로그 삽입 후 knowledge·map-cli 전체 실행 시 로그 0회 | `throw readFailure` 경로는 어떤 테스트도 실행하지 않았고, 100% 보고는 V8 block coverage 범위 착시 (verified). readdir EACCES 테스트 추가로 해결 |

## Next Step
1. **사용자 실행 검증 대기(2026-10-07)**: 테스트 프로젝트 2곳({ab-test-sample-size, base-rate-fallacy})에 최신 skill 설치됨. 사용자가 직접 실행 후 피드백 예정. 피드백은 User Feedback Backlog에 적립한다.
2. 반영된 사용자 지시(2026-10-07): 진단 대화 설문(되묻기, `not-applicable`은 내부 재점검 후 필요 시 `unknown`으로 기록), 범위 합의 단계를 agent 자율 결정(사용자에게 묻지 않고 알리기만)으로 변경, 결과는 화면 "결과 제출" → serve `--out` 수신.
3. ~~**미결(사용자 결정 2026-10-07: 이번엔 흐름만 하고 여기에 기록)**: 수업 화면 시각화.~~ 완료(2026-10-08, F4: spec 0dcd8454f6e5111d limit → 679f728f2f602897 complete). 원 기록: 사용자가 4321 화면을 보고 "너무한데, 더 interactive하고 눈이 즐거운 걸 기대"라고 피드백. 관찰: 스타일이 거의 없는 기본 HTML(제목·안내문·버튼·빈 숫자 입력칸 세로 나열), 입력은 숫자 입력칸인데 lesson 본문은 "슬라이더"로 안내하는 불일치, 출력은 막대+표. 방향(슬라이더, 실시간 그래프, 전후 비교 연출 등)과 ROADMAP §5의 텍스트·표 대체 표현 요건과의 양립은 미정. 대상 코드: `site/src/components/{ui.js,content.js,style.css}`. ROADMAP §5 말미에도 같은 항목을 적어 둠.
4. T5-4 본체(SKILL.md·installer) spec은 미작성이며 지금까지 spec 없이 진행됨. 사용자 실행 검증 후 필요하면 정리한다.
5. 미규명 간헐 실패(Open Questions)를 기준선과 비교해 원인 확인.

(이하 이전 계획, 참고용)
2. ~~**T5-2 생성물 검증·배치 CLI**~~ (완료; 15–20분 검사는 lesson 계약 RANGE에 맡김, nextPath `lessonStatus: placed|planned` 추가) (`scripts/lesson.mjs` 제안)
   - `check-model`: 자식 프로세스+timeout으로 모델 `calculate`를 oracle 케이스와 대조하고, 경계·null·비유한값·입력 불변을 검사한다.
   - `place-diagnostic`·`place-lesson`: `~/.learn-to-tell/profiles/<id>/{diagnostics,lessons,models}/`에 원자적으로 쓴다(`knowledge/store.mjs` 패턴).
   - 분량 검사: 결정 변수 1–2, 개념 ≤5, 15–20분. 초과 시 분할 제안 오류를 낸다.
   - `diagnose`: 브라우저 원시 선택 JSON을 diagnostic 문서로 변환·검증한다.
   - map.revision 증가와 nextPaths 갱신(T4에서 넘어온 항목). 분할 회차도 nextPaths로 연결한다.
3. ~~**T5-3 일반 런타임 + 진단 페이지**~~ (완료)
   - `site/src/components/ui.js`, `learning/progress.mjs`·`grading.mjs`·`result.mjs`·`storage.mjs`의 제조 검사 import를 lesson v2 선언 기반으로 바꾼다.
   - `scripts/build-lesson.mjs`가 profile 폴더의 lesson·model을 scratch tree로 복사한다.
   - 진단 페이지: 카드 2–3개, 조작 1개, 4가지 반응, 최대 2라운드, 원시 선택 JSON 내보내기.
   - 기존 e2e·오프라인·키보드·axe를 유지한다.
4. **T5-4 사용자 skill** `skills/learn-to-tell/SKILL.md`
   - 흐름: 진단 → 범위 합의 → lesson·model·oracle 생성 → check-model → (필요 시) Claude Code 독립 검증 서브에이전트 → 배치·빌드·serve → import.
   - 검증: 고정 맥락 2개(작업 있음/없음)로 실제 실행.

## Decisions (사용자 결정, 2026-10-05)
- T5-3(2026-10-06): 출력 막대+표, 별도 build-diagnostic, build-lesson 경로 인자, 채점 = outputs+tolerances, concept v2 카드 필드 필수, 힌트 = 개념 카드 confusion/plain 2단계, A1–A9 승인
- 생성 모델 코드 실행 격리: 자식 프로세스 + 시간 제한 (T5-2 check-model)
- 진단 선택 → diagnostic 문서 변환: CLI 책임. 브라우저는 원시 선택 JSON만 내보낸다 (T5-2/T5-3)
- 분할 회차 연결: nextPaths만 사용, lesson 계약 변경 없음; 미배치 lesson은 nextPath `lessonStatus:'planned'` (T5-2, D2 2026-10-06)
- 배치 실패 시 이번 호출이 만든 파일·디렉터리 모두 제거 (T5-2, S1)
- 독립 검증 서브에이전트: Claude Code만 지원, Codex는 후속 (T5-4)
- T5-4(2026-10-07): 외부 설치 = 독립 설치 스크립트(harness에는 extension 개념이 없어 harness 확장은 보류, manifest.json으로 이후 이전 대비). 검증 실행은 사용자가 `/Users/hwansu/tmp/ltt-test-projects/`에서 직접(저장소 밖이라 상위 CLAUDE.md 혼입 없음)

## User Feedback Backlog (T5-4, 미작업 적립)
| # | 날짜 | 피드백 | 현재 동작 근거 | 상태 |
| --- | --- | --- | --- | --- |
| F1 | 2026-10-07 | 브라우저에서 JSON 파일을 내려받아 경로를 agent에게 전달하는 방식은 고쳐야 함 | 진단: `site/diagnostic/components/diagnostic.js` download(`diagnostic-choices-<id>.json`), 수업: `site/src/components/ui.js` 결과 Blob download(`result-<resultId>.json`); SKILL.md 2·7단계가 사용자에게 파일 경로를 받음 | 완료(커밋 23bad96·699e53f, 2026-10-07): 수업 화면 다운로드 제거, "결과 제출" → `serve.mjs --out <dir>`가 `POST /__ltt/result`로 수신, `http-server` 제거 |
| F2 | 2026-10-07 | 진단 설문(상황 카드 반응)은 브라우저가 아니라 agent 대화에서 진행하는 게 낫다. 모르는 상태에서 카드에 반응하려니 "내가 아는 개념인지" 되묻고 싶은데 브라우저 페이지에서는 불가 | 진단 페이지 `site/diagnostic/`(카드 + 4가지 반응, 질문 경로 없음), `scripts/build-diagnostic.mjs`; SKILL.md 2단계가 진단을 브라우저로 보냄. T5-3 결정 "진단 페이지: 카드 2–3개, 조작 1개, 4가지 반응"과 충돌 | 완료(커밋 23bad96·699e53f, 2026-10-07): 대화 설문 전환, 진단 페이지·build-diagnostic·diagnostic-setup·diagnose CLI·serve `--target` 제거, diagnostic v2 `reactions`. F1의 진단 쪽은 소멸 |
| F3 | 2026-10-07 | 진단에서 낯선 용어가 곧바로 나와 대처하기 힘들다. 프로젝트·질문·상황에 필요한 개념을 설명하고 아는지 물어(알면 위 단계, 모르면 아래 단계) 학습 수준을 정한 뒤, 현재처럼 상세 질문으로 세부 수준을 판별 | 진단 대화가 상황 카드 3장 반응부터 시작(모두 `unknown`이면 구분 불가) | 완료(2026-10-07, spec 5a2c9e7d1b4f8036): 개념 사다리 → 상황 카드, diagnostic v2 `ladder` |
| F4 | 2026-10-07 | 수업 화면 시각화 개선 | 위 Next Step 3 | 완료(2026-10-08, 미커밋, spec 0dcd8454f6e5111d·679f728f2f602897): lesson v3(`label`·`step`·`practical`·`visuals`), check-model `PROBE_SWEEP`·`PROBE_COMPOSITION`, 슬라이더·카드·sweep·composition 차트·stepper, skill 문서 v3 생성 규칙. 테스트 프로젝트 skill 재설치 필요 |

## Open Questions
- 간헐 실패 추가 관찰(2026-10-07, F3 검증 중 각 1회, 이어진 전체 실행은 통과): ~~`tests/serve.test.mjs` `[O3.size]`의 `write EPIPE`~~ 해결(2026-10-08, spec 679f728f2f602897: `Connection: close` 클라이언트에 대해 Node가 413 응답 직후 소켓을 닫던 경합, verified — 본문 소진 후 413 전송), `values.spec.mjs` V5.S3.reload 재발(단독 5회 통과, 미해결). `storage.spec` V8.S11 단계 탐색 400ms 고정 대기도 상태 기반 대기로 교체(같은 spec)
- 미규명 간헐 실패: `tests/e2e/values.spec.mjs` `[V5.S3.reload] defect-percent`가 `npm run verify` 중 약 8회 중 2회 6.2s 후 `input-defect-percent` 못 찾음(재실행·단독 24회 통과). 변경 전 기준선과 비교하지 못함
- 없음

## Spec
- T5-1 archived: `agent-docs/spec-logs/fd5077c6a63a8fb9-t5-1-lesson-v2-model-contract.md`, version 3, status complete, run ID fd5077c6a63a8fb9
- T5-2 archived: `agent-docs/spec-logs/d1adf29b9bdfe2b8-t5-2-authoring-cli.md`, version 4, status complete, run ID d1adf29b9bdfe2b8
- T5-3 archived: `agent-docs/spec-logs/65ba74b36b0ef5da-t5-3-generic-runtime-diagnostic-page.md`, version 3, status complete, run ID 65ba74b36b0ef5da
- T5-4 F2 archived: `agent-docs/spec-logs/7e3b1a94c2d05f68-t5-4-conversational-diagnostic.md`, version 3, status complete, run ID 7e3b1a94c2d05f68
- T5-4 F1 archived: `agent-docs/spec-logs/3c9d5e71a0b84f26-t5-4-result-submit-to-serve.md`, version 2, status complete, run ID 3c9d5e71a0b84f26
- T5-4 F3 archived: `agent-docs/spec-logs/5a2c9e7d1b4f8036-t5-4-concept-ladder-diagnostic.md`, version 2, status complete, run ID 5a2c9e7d1b4f8036
- T5-4 본체: spec 미작성(skill·installer는 spec 없이 진행됨)

## Execution Ledger
- T5-1: findings B1·B2(테스트 누락) 해결, mutation M1–M3 모두 검출, correction batches 3, verifier invocations 2 (최종 PASS). 상세는 archived spec ledger
- T5-2: 첫 실행 F1–F4 + 계약 충돌 2건(D1, D2), verifier 1 VF1–VF5·S1 → 모두 해결, mutation M1–M3 검출, correction batches 2, verifier invocations 2 (최종 PASS). 비차단 권고 A1–A6, 동시 쓰기 시 생성 디렉터리 재귀 삭제 위험
- T5-3: F1–F7(구현 2, 테스트 3, spec 공백 1, 연쇄 1) 해결, verifier 1 retry(F-1·F-2·S-1–S-3·V13) → v3, verifier 2 pass, mutation M1–M3 검출, correction batches 3. 비차단 권고 A-1–A-3(archived spec). 루트 `observablehq.config.js` title은 제조 검사 문구로 남음(빌드가 scratch config에서 덮어씀)
- T5-4 F2: 첫 verify 실패 F1–F6(spec C6 코드 1, 테스트 결함 5) 해결, verifier 1 → SC1(Q4 문구 모순) 사용자 승인으로 spec v3 정정, mutation M1–M3 검출, correction batches 2, verifier invocations 1. 비차단 권고 A1–A4(spec-log)
- T5-4 F1: 첫 verify 실패(테스트 결함 2: 해시 변조 단언, 부재 요소 textContent) 해결, verifier 1 retry(F1–F3 증거 부족, S1 spec 공백) → 사용자 승인 spec v2, verifier 2 pass, mutation M1–M3 검출, correction batches 3, verifier invocations 2. 비차단 권고 A2·A3(spec-log), 위 간헐 실패
- T5-4 F3: 첫 verify 통과, verifier 1 → F-T54L-1(항목 위치 `/ladder/0`만 검증) 확정(mutation M1이 초록), 테스트 `@2` 변형 추가로 해결, spec v2(길이 위반 코드 RANGE·LIMIT 명시), verifier 2 pass, mutation M1–M3 검출, correction batches 1, verifier invocations 2. 비차단 권고 A-T54L-2·A-T54L-3(spec-log)
