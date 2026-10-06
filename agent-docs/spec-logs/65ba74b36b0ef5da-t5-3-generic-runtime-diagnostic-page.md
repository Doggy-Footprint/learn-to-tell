---
version: 3
run_id: 65ba74b36b0ef5da
status: complete
base_commit: 47832bdbda9ef6bcc4bc0e1a8ef6171e962de4b4
max_verifier_invocations: 2
handoff: agent-docs/handoff/bc687eb8711f016a-t5-remaining.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| I1 | 학습자·agent | agent가 생성·배치한 lesson v2와 model로 수업 화면을 빌드한다 | `build-lesson --session --lesson --model`로 만든 dist에서 제조 검사 전용 코드 없이 수업 완료·결과 내보내기 |
| I2 | 학습자·agent | 진단 단계를 브라우저에서 체험하고 원시 선택을 agent에게 넘긴다 | `build-diagnostic --setup`으로 만든 페이지에서 반응을 고르고 diagnostic-choices v1 JSON을 내려받으며, 그 파일이 `lesson.mjs diagnose`를 통과 |
| I3 | 학습자 | 기존 수업 품질(키보드·접근성·오프라인·저장 복구)을 잃지 않는다 | 기존 e2e 품질 항목이 일반 런타임에서 계속 통과 |

# Scope
In scope: lesson v2 concept 카드 필드 추가, `learning/*.mjs`·`site/src/**`의 lesson·model 주입형 일반화, 출력 막대+표 시각화, `build-lesson` 경로 인자, 진단 페이지와 `build-diagnostic`, `serve` 대상 선택, 기존 테스트 이관.
Out of scope: lesson v1 런타임 지원, lesson/result/map/diagnostic 계약의 다른 변경, map 저장(브라우저는 map을 쓰지 않음), T5-4 skill, 진단 반응의 diagnostic 문서 보존(T5-2 A1).

# Paths
Implementation: contracts/definitions.mjs, contracts/index.mjs, examples/manufacturing-inspection/lesson-v2.mjs, learning/, site/src/, site/diagnostic/, scripts/build-lesson.mjs, scripts/build-diagnostic.mjs, scripts/serve.mjs, package.json, .gitignore
Tests: tests/, playwright.config.mjs
Test command: npm run verify
Review evidence: R1 안전 문구 체크리스트(아래 Q8) — 빌드된 제조 검사 v2 수업과 진단 페이지 화면 텍스트를 읽고 기록

# Signatures
CLI `node scripts/build-lesson.mjs --session <session.json> --lesson <lesson.json> --model <model.mjs>` → exit 0 `dist/` 교체 | exit 1 stderr `CODE /path` 줄들, `dist/` 불변 | exit 2 인자 오류(`ARGUMENT --<name>`)
CLI `node scripts/build-diagnostic.mjs --setup <setup.json>` → exit 0 `dist-diagnostic/` 교체 | exit 1 stderr `CODE /path` | exit 2 `ARGUMENT --setup`
CLI `node scripts/serve.mjs [--port N] [--target lesson|diagnostic]` → 기본 `lesson`(=`dist/`), `diagnostic`(=`dist-diagnostic/`); 대상 index.html 없으면 exit 1 `DIST_MISSING <dir>/index.html`
Module `learning/progress.mjs`: `createRuntime(lesson, model) → {inputIds, defaultInputs, stages, ...}`; `initialProgress(session, runtime)`; `applyAction(progress, action, runtime)`; progress.inputs·transfer.inputs는 inputId→number
Module `learning/grading.mjs`: `gradeTransferPrediction(prediction, expected, lesson) → {status, matched:[outputId], mismatched:[outputId]}`; prediction·expected는 outputId→(표시 단위 값 = raw·scale | null)
Module `learning/result.mjs`: `buildResult(progress, lesson, session, now, runtime)`; `finalizeResult`, `validateResultShape` 불변
Module `learning/format.mjs`: `formatCount(n)` → `Intl.NumberFormat('ko-KR', {maximumFractionDigits: 3})` 문자열, -0은 "0"(기존 동작 유지); 출력 표 셀·예측 표시값에 사용
Module `learning/storage.mjs`: `loadProgress(storage, session, runtime)`, `saveProgress(storage, progress)`, `storageKey` 불변
Module `site/src/components/ui.js`: `mount(session, lesson, model)`; 빌드는 scratch tree에 `lesson.js`(`export default <lesson JSON>`)·`model.js`(모델 파일 복사)를 두고 `index.md`가 `mount(session, lesson, model.model)` 호출
Module `site/diagnostic/` → `mountDiagnostic(setup)`; 빌드는 `setup.js`(`export default <setup JSON>`)
lesson v2 concept: `{conceptId, conceptRevision, label, meaning, example, confusion, plain}`(모두 필수, 문자열은 비어 있지 않음); v1 concept 불변
setup v1: `{kind:'diagnostic-setup', version:1, diagnosticId, profileId, contextKind:'work'|'interest', rounds:[{candidates:[candidate 1..3]}] (1..2개)}`; candidate는 diagnostic 계약 형식
내보내는 diagnostic-choices v1: T5-2 spec Signatures 형식 그대로, 파일명 `diagnostic-choices-<diagnosticId>.json`
testid 규칙(일반화): 입력 `input-<inputId>`, 예측 필드 `<prefix>-<outputId>`, null 표시 `<prefix>-<outputId>-undefined`(nullable 출력만), 출력 표 셀 `[data-output=<outputId>]`, 막대 `bar-<outputId>`(`data-value` = raw 값), 시나리오 `scenario-<scenarioId>`, 개념 `concept-<conceptId>`/`concept-card-<conceptId>`, 결정 `decision-<decisionId>`, 진단 카드 `candidate-<candidateId>`, 반응 `reaction-<candidateId>-<reaction>`, `diagnostic-next`, `diagnostic-export`; 그 밖의 기존 testid(`stage-*`, `prediction-record|skip|retry|reveal`, `transfer-*`, `hint-level-<n>`, `hint-text-<n>`, `help-level`, `response-*`, `export-*`, `storage-notice`, `reset-*`, `link-to-explanation`, `link-back-to-simulation`, `complete-lesson`, `safety-notice`)는 유지

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| R1 | lesson v2 concept은 `meaning, example, confusion, plain` 필수 비어 있지 않은 문자열을 가진다. 누락 `REQUIRED`, 타입 `TYPE`, 공백 `VALUE`. v1 lesson concept은 기존대로 3필드만 허용 | must | 사용자 결정(2026-10-06) |
| R2 | `learning/`·`site/` 런타임 코드는 `examples/` 모듈을 import하지 않는다 | must | handoff T5-3 |
| R3 | 입력 필드·단위·범위·기본값은 `lesson.inputs`, 라벨은 inputId(단위 병기); setInput은 `[min,max]` 밖이면 `RANGE`; 시나리오 버튼은 `lesson.scenarios` 중 transfer 시나리오를 제외한 것 | must | 계약 |
| R4 | 기본 예측(baseline) 대상은 `lesson.scenarios[0]`, 새 사례(transfer)는 `transfer.scenarioId`의 값. 예측 필드는 `lesson.outputs` 순서, 단위는 `unit`, 값은 raw·scale; nullable 출력만 "정의되지 않음" 선택 가능; 예측값은 유한수만 허용(범위 제한 없음) | must | 사용자 결정(채점) |
| R5 | 채점: 출력별 `|given - raw·scale| <= absolute + 1e-9`(absolute = 해당 outputId tolerance, 없으면 0), expected null은 given null과만 일치. 상태 supported/partial/not_demonstrated 규칙은 기존과 같다 | must | 사용자 결정(채점) |
| R6 | 시뮬레이션: 현재 입력의 `model.calculate` 결과를 출력 표(label·unit·표시값)와 출력 막대로 보인다. 막대는 non-null 출력마다 하나, 같은 unit 묶음 안에서 `|v|/max|v|` 비율 폭(최대 0이면 폭 0), `data-value`는 raw 값. 이전 입력 결과 표를 유지. calculate ok:false면 마지막 유효 결과와 stale 안내 | must | 사용자 결정(시각 자료) |
| R7 | 개념 버튼·카드는 `lesson.concepts`로 렌더하며 카드(`concept-card-<id>`)는 label 전체·meaning·example·confusion·plain을 모두 표시한다 | must | 사용자 결정 |
| R8 | 힌트 2단계: `hint-text-1` = 모든 개념의 confusion, `hint-text-2` = 모든 개념의 plain; level 2에서는 두 블록이 모두 보인다. `openHint` level 범위는 1–2, 그 밖은 `RANGE` | must | 사용자 결정(힌트 대체) |
| R9 | 단계 본문: context = orientation activity의 content, simulation = exploration activity의 content(설명은 `explanation-denominators`가 아니라 `explanation-content` testid의 첫 explanation content), assessment = assessment activity의 content, return/map = 해당 activity content. content text는 그대로 표시 | must | A1 |
| R10 | 결정 비교: `lesson.decisions`마다 카드(question, choices 목록, requiredInformation 목록)를 simulation 단계에 보인다. 정답 표시 없음 | must | A2 |
| R11 | result: responses의 conceptId·revision = `prediction-model` criterion의 첫 conceptId; baseline activityId = 첫 exploration activity, transfer·자유응답 = 첫 assessment activity; prediction answer = outputId→표시 단위 값 JSON(outputs 순서); 채점 context 문구는 출력 label과 ±absolute unit을 나열. 그 밖의 response/assessment 생성 규칙은 기존과 같다 | must | A3 |
| R12 | storage: 복원 조건은 기존 조건 + 저장 inputs 키 집합 = lesson inputId 집합 + `model.calculate(inputs).ok` | must | 기존 F8 |
| R13 | build-lesson은 lesson 파일을 lesson 계약(v2만), model 파일을 load·`validateModelBinding`으로 검사하고, 실패 시 오류 코드 줄을 쓰고 exit 1, `dist/` 불변. 모델 파일 규칙(import 금지)은 T5-2 모델 계약 | must | 사용자 결정(경로 인자) |
| R14 | 진단 페이지: setup의 round 순서대로 한 번에 한 round, 카드 1–3개(제목·decisionQuestion·reason·preview), 카드마다 4반응 단일 선택 radio 그룹. 모든 카드에 반응해야 `diagnostic-next`(마지막 round면 `diagnostic-export`)가 활성. 이전 round로 돌아가기 없음. export는 rounds 전체(candidates + reactions)를 담은 diagnostic-choices v1 | must | handoff T5-3, 사용자 결정 |
| R15 | build-diagnostic은 setup을 검증(R16)하고 실패 시 exit 1, `dist-diagnostic/` 불변 | must | 사용자 결정 |
| R16 | setup 검증: kind/version, 필드 집합(알 수 없는 필드 `UNKNOWN_FIELD`), id 형식, contextKind, rounds 1–2(`RANGE /rounds`), round별 candidates 1–3(`RANGE /rounds/<i>/candidates`), round 내 candidateId 중복 `DUPLICATE /rounds/<i>/candidates/<j>/candidateId`, candidate 형식은 diagnostic 계약 | must | A5 |
| R17 | 진단 페이지는 진행을 저장하지 않으며 외부 네트워크 요청을 하지 않는다 | must | 기존 F1 |
| R18 | serve `--target`이 lesson/diagnostic 외 값이면 exit 2 `ARGUMENT --target` | must | A4 |

# Errors
- lesson 계약/v1/모델 binding 실패(build-lesson) — exit 1, stderr `CODE /path` — `dist/` 바이트 유지, `.build-*` 잔여 없음
- lesson·model·session 파일 읽기 실패 — exit 1, `LESSON_FILE|MODEL_FILE|SESSION_FILE <path>`; JSON 파싱 실패 `LESSON_JSON|SESSION_JSON <path>`; model load 실패 `MODEL_LOAD <path>` — `dist/` 유지
- setup 검증 실패 — exit 1, stderr `CODE /path` — `dist-diagnostic/` 유지; 읽기 실패 `SETUP_FILE`, 파싱 실패 `SETUP_JSON`
- 인자 누락/알 수 없음 — exit 2 `ARGUMENT --<name>` — 변경 없음
- 런타임 calculate ok:false — 입력 오류 표시, 마지막 유효 결과 유지(R6); transfer는 기존 calculation-error 경로
- 저장 손상·다른 lesson·inputs 키 불일치 — `load-failed` 안내, 첫 동작 전 저장값 불변

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | 제조 검사 lesson-v2(개념 카드 포함)·model로 build-lesson 후 키보드만으로 전 단계 진행·완료·내보내기 | result 계약 통과, contentHash 일치, state completed |
| C2 | normal | 기본값 입력의 출력 표·막대 | 표시값 = calculate·scale, 막대 data-value = raw, 같은 unit 최대 막대 폭 100% |
| C3 | normal | 새 사례 예측 = 정확한 기대값 / 일부 / 전부 틀림 / 건너뜀 | supported / partial / not_demonstrated / skipped |
| C4 | boundary | 예측과 기대 차이 = absolute / absolute + 0.01 | 일치 / 불일치 |
| C5 | boundary | 입력 = min, max / min-0.01, max+0.01 | 계산 / RANGE 오류 표시·재계산 없음 |
| C6 | edge | nullable 출력의 기대 null(예: 결함 0, 오탐 0) | 표시 "정의되지 않음", given null만 일치 |
| C7 | normal | 두 번째 합성 lesson(제조 검사 아님, 입력 1개, 출력 2개, unit 2종, nullable 없음)으로 빌드 | 같은 흐름으로 결과 내보내기 성공, 화면에 제조 검사 문구 없음 |
| C8 | error | v1 lesson / 계약 위반 lesson / binding 불일치 model / import 포함 model / 파일 없음 / 인자 누락 | exit 1(인자 누락은 2), `dist/` 불변 |
| C9 | normal | 2 round setup으로 진단 페이지: round1 반응 → next → round2 반응 → export | 파일이 T5-2 `buildDiagnostic`(유효 hypotheses와 함께) 통과, rounds 2개, 반응 값 그대로 |
| C10 | boundary | 1 round·카드 1개 setup / 2 round·카드 3개 | 1 round면 next 없이 export; 카드 3개 모두 반응 전 export 비활성 |
| C11 | error | setup rounds 0·3, candidates 0·4, 중복 candidateId, 알 수 없는 필드, kind 오류, 파일 없음 | exit 1, 해당 코드/경로, `dist-diagnostic/` 불변 |
| C12 | error | 저장값의 inputs 키가 다른 lesson의 것 | load-failed, 초기 상태 |
| C13 | normal | 힌트 1→2 단계 | hint-text-1 = confusion들, hint-text-2 = plain들, help가 hint로 바뀜 |
| C14 | error | lesson v2 concept 카드 필드 누락·공백·숫자 | REQUIRED / VALUE / TYPE |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 일반 런타임 표시·채점·결과 정확성 |
| Performance efficiency | yes | 입력 변경 반응 시간 기존 기준 유지 |
| Compatibility | yes | 내보낸 결과·진단 파일을 기존 CLI(`map import`, `lesson diagnose`)가 읽어야 함 |
| Interaction capability | yes | 키보드·WCAG 2.2 A/AA 유지, 진단 페이지 포함 |
| Reliability | yes | 저장 복구·빌드 실패 시 dist 보존 |
| Security | yes | 오프라인·loopback 전용 유지 |
| Maintainability | yes | 100% line/function coverage 유지, 런타임의 예제 비의존 |
| Flexibility | yes | 임의 lesson v2(입력·출력 수 가변)에 적응 — C7 |
| Safety | yes | 가상 수치를 실제 조치 근거로 오인하지 않게 하는 문구 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Functional suitability / correctness | C1–C14 | 사례 통과율, % | = 100% | automated + mutation | spec |
| Q2 | Performance / time behaviour | 로컬 Chrome, 제조 검사 v2 빌드, 입력 1개 변경 20회 | dispatch부터 표·막대 갱신 확인까지, ms | p95 ≤ 100ms | automated | T3 Q2 |
| Q3 | Compatibility / interoperability | C1·C7 결과 파일, C9 진단 파일 | `validateDocument(result)` 통과, `buildDiagnostic` 통과 | 실패 0건 | automated | I1, I2 |
| Q4 | Interaction capability / accessibility | 수업: 공개 전·후·새 사례·힌트 열림 4상태; 진단: round1·마지막 round 반응 완료 2상태 | axe WCAG 2.2 A/AA 위반 수; 키보드 전용 흐름(C1, C9) 통과 | 위반 0, 100% | automated | T3 Q4 |
| Q5 | Reliability / recoverability | 새로고침·손상·저장 불가·inputs 키 불일치, 빌드 실패 | 기존 storage e2e + C12; 빌드 실패 후 dist 바이트 비교 | 100% 통과, 차이 0 | automated | T3 Q5 |
| Q6 | Security / confidentiality | 수업·진단 전 과정 | 비-127.0.0.1 요청 수 | 0건 | automated | T3 Q6 |
| Q7 | Maintainability / modularity·testability | learning/*.mjs, contracts/*.mjs, examples/manufacturing-inspection/*.mjs | Node coverage line·function %, `learning/`·`site/` 소스의 `examples/` import 수 | 100% / 0건 | automated | 기존 정책, R2 |
| Q8 | Safety / user warning | 수업 safety-notice, 진단 페이지 안내 | 체크리스트: 수치가 lesson 모델 계산 예시이며 실제 조치 근거가 아님을 밝힘; 진단 반응이 능력 판정이 아님을 밝힘 | 2/2 항목 | review | T3 Q8 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | R1, C14 | validateDocument(lesson v2/v1) | unit | equivalence partitioning | 4필드 각각 {유효, 누락, 공백, 숫자}; v1 lesson에 4필드 추가 시 UNKNOWN_FIELD | 100% | 해당 코드·경로 | tests/contracts-v2.test.mjs |
| V2 | R3, R4, R6, R12, C2, C5, C6, C12 | createRuntime/applyAction/loadProgress | unit | boundary value analysis (3-value) | 입력별 {min-0.01, min, max, max+0.01}; nullable null 기대; 저장 inputs {같은 키, 다른 키, 부분집합(키 1개 누락만), 초과집합(알 수 없는 키 1개 추가만), 계산 실패} | 100% | RANGE/계산/복원 여부 | tests/learning.test.mjs |
| V3 | R5, C3, C4 | gradeTransferPrediction | unit | boundary value analysis (2-value) + decision table | 차이 {absolute, absolute+0.01}; tolerance 없음 출력; 기대 null×given {null, 수}; 상태 4종 | 100% | 일치/상태 정확 | tests/learning.test.mjs |
| V4 | R8, R11, C13 | buildResult/openHint | unit | equivalence partitioning | 힌트 level {0,1,2,3}; result conceptId·activityId·answer 직렬화·context 문구; calculation-error·skipped 경로 | 100% | result 계약 통과 + 지정 값 | tests/learning.test.mjs |
| V5 | R2, Q7 | learning/, site/ 소스 | static check in node test | syntax testing | `learning/*.mjs`, `site/**/*.js`, `site/src/index.md`, `site/diagnostic/index.md` 각 파일의 import specifier | 100% | `examples/` 포함 0건 | tests/learning.test.mjs |
| V6 | R13, C8, Q5 | build-lesson 프로세스 | integration(실제 node 프로세스, Framework 빌드는 실패 경로에서 미실행) | equivalence partitioning | {v1 lesson, 계약 위반, binding 불일치, import 포함 model, lesson 파일 없음, model 파일 없음, lesson JSON 오류, 인자 3종 각각 누락, 알 수 없는 플래그(exit 2 `ARGUMENT --<그 플래그>`)} | 100% | exit 코드·stderr 코드, dist 바이트·`.build-*` 잔여 0 | tests/build.test.mjs |
| V7 | R15, R16, C11 | build-diagnostic 프로세스 | integration(실제 node 프로세스) | classification tree (each choice) | rounds 수 {0,1,2,3}; candidates 수 {0,1,3,4}; 중복 id; 알 수 없는 필드; kind/version 오류; contextKind 오류; diagnosticId·profileId 형식 오류(VALUE); candidate 빈 title(VALUE)·preview 누락(REQUIRED); round·candidate 내부 알 수 없는 필드(UNKNOWN_FIELD); 파일 없음; JSON 오류; 인자 누락; 알 수 없는 플래그(exit 2 `ARGUMENT --<그 플래그>`) | 100% | exit·코드·경로, dist-diagnostic 불변 | tests/build.test.mjs |
| V8 | R3–R11, C1, C2, C3, C6, C13, Q2, Q4 | 빌드된 제조 검사 v2 수업 | end-to-end (Playwright, Chrome) | scenario testing | 기존 e2e 시나리오(flow, persist, values, storage, quality, session2)를 일반 testid로 이관; 출력 막대 data-value; 결정 카드 2개; 개념 카드 5개(label 포함 5필드) | 100% | 기존 기대 + 새 testid 값; 출력 표 셀·예측 표시는 formatCount 의미의 독립 리터럴과 정확 비교(기본 입력 예: `9,405`, `15.385`) | tests/e2e/*.spec.mjs |
| V9 | R6, R7, R9, R10, C7, Q8 | 두 번째 합성 lesson 빌드 | end-to-end | scenario testing | {표·막대 2개, 입력 범위, 예측→공개→새 사례→내보내기, 화면에 "결함"·"검사" 문자열 없음} | 100% | result 계약 통과 | tests/e2e/generic.spec.mjs |
| V10 | R14, R17, C9, C10, Q3, Q4, Q6 | 빌드된 진단 페이지 | end-to-end | state transition | 상태 {round1 미완, round1 완료, round2 미완, round2 완료(export)} × {next/export 활성 여부}; 1 round setup; 키보드 전용 경로; axe 2상태; 네트워크 | 100% | 내보낸 JSON이 buildDiagnostic 통과, 반응 일치 | tests/e2e/diagnostic.spec.mjs |
| V11 | R18 | serve 프로세스 | integration | equivalence partitioning | --target {생략, lesson, diagnostic, 기타}, 대상 dist 없음, 알 수 없는 플래그(exit 2 `ARGUMENT --<그 플래그>`) | 100% | 해당 dir 서빙 / exit 코드 | tests/e2e/quality.spec.mjs |
| V14 | R6 display, Q7 | formatCount | unit | equivalence partitioning | {0, -0, 정수 천 단위, 소수 3자리 초과 반올림, 음수} | 100% | 기대 문자열 | tests/learning.test.mjs |
| V12 | Q7 | learning, contracts, examples, knowledge, authoring | structure-based: statement + function coverage (node --experimental-test-coverage) | 기존 include 전체 | line 100%, function 100% | npm run verify 통과 | npm run verify |
| V13 | Q8 | 화면 문구 | review | error guessing | {수업 safety-notice, 진단 안내} | none — experience-based | 체크리스트 2/2 | Review evidence 기록 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | UI 6단계(context, prediction, simulation, assessment, return, map)는 유지하고 각 단계 본문을 activity stage의 content로 채운다(diagnosis activity는 수업 화면에 표시하지 않음) | 현재 STAGE_BODIES는 하드코딩 문구 | 사용자 승인(2026-10-06, v1 전체 승인) |
| A2 | 제조 검사 전용 A/B 찬반 카드(계산 근거 포함)는 `lesson.decisions` 카드로 대체한다; 수치 근거 비교는 시나리오 버튼·이전 결과 표로 대신한다 | 계약에 찬반 필드 없음 | 사용자 승인(2026-10-06, v1 전체 승인) |
| A3 | result의 conceptId는 prediction-model criterion 첫 conceptId(현재 고정값 `positive-predictive-value`는 그 criterion의 conceptIds에 포함되지만 첫 값은 아닐 수 있어 제조 검사 결과의 conceptId가 바뀔 수 있음) | `learning/result.mjs:6` | 사용자 승인(2026-10-06, v1 전체 승인) |
| A4 | 진단 출력 폴더 `dist-diagnostic/`, `serve --target` | 미정의였음 | 사용자 승인(2026-10-06, v1 전체 승인) |
| A5 | setup 오류 코드는 build-lesson의 `CODE /path` stderr 관례와 계약 오류 코드(REQUIRED/TYPE/VALUE/RANGE/UNKNOWN_FIELD/KIND/VERSION, 중복은 DUPLICATE) | `scripts/build-lesson.mjs` | 사용자 승인(2026-10-06, v1 전체 승인) |
| A6 | 안전 문구는 일반 고정 문구(lesson 모델 계산 예시, 실제 조치 근거 아님), 제조 검사 전용 문구 제거. 제조 검사 고유 경고는 lesson content(failure)로 표시됨 | `content.js` SAFETY_NOTICE | 사용자 승인(2026-10-06, v1 전체 승인) |
| A7 | storageKey는 이미 lessonId·revision을 포함하므로 변경하지 않음 | `learning/storage.mjs:4` | 사용자 승인(2026-10-06, v1 전체 승인) |
| A8 | `examples/manufacturing-inspection/{lesson.mjs, assessment-guide.mjs}`는 계약 테스트용으로 남기고 런타임에서만 제거; coverage 100% 유지 책임은 테스트 쪽 | 기존 contracts 테스트가 import | 사용자 승인(2026-10-06, v1 전체 승인) |
| A9 | Playwright webServer는 제조 검사 v2 lesson JSON·model 경로로 빌드하며, 합성 lesson·진단 페이지는 각 spec에서 별도 포트로 빌드·serve | `playwright.config.mjs` | 사용자 승인(2026-10-06, v1 전체 승인) |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| R1 | C14 | V1 | npm run verify |
| R2 | — | V5 | npm run verify |
| R3, R4, R6, R12 | C2, C5, C6, C12 | V2, V8 | npm run verify |
| R5 | C3, C4 | V3, V8 | npm run verify |
| R7–R11 | C1, C7, C13 | V4, V8, V9 | npm run verify |
| R13 | C8 | V6 | npm run verify |
| R14, R17 | C9, C10 | V10 | npm run verify |
| R15, R16 | C11 | V7 | npm run verify |
| R18 | — | V11 | npm run verify |
| Q1–Q7 | C1–C14 | V1–V12 | npm run verify |
| Q8 | — | V13 | review |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| V13 review | 통과 2/2 (2026-10-06, main): 수업 safety-notice "이 화면의 수치는 이 수업의 모델로 계산한 예시입니다. 실제 값이 아니며 실제 작업의 조치나 결정의 근거로 사용하지 마세요."; 진단 안내 "아래 반응은 지식이나 능력을 판정하지 않습니다." (test-results/review/V13-*.txt) |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| V3, V4, V10, V12, V14 | 3 | verify5 | accepted (verifier 1) | M1 grading 전역 tolerance → T53-V3.diff.*·result-per-output-tolerance 검출 | v3 변경 영향 없음 |
| V13 | 3 | Workflow Control V13 review | accepted (main review) | 2/2 | — |
| V1, V2, V5, V6, V7, V8, V9, V11 | 3 | verify5(node 2973, e2e 84) | accepted (verifier 2) | v3 보강 반영; M2 막대 전역 정규화 → T53-V9.tables-bars·T53-V8.bar-width-100 검출; M3 검증 전 dist 삭제 → T53-V6.v1-lesson 검출 | verifier 1 F-1·F-2·S-1–S-3 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | F1 `T53-V8.cards`: 개념 카드에 label 없음 | 구현 결함(verified: 카드 텍스트에 label 없음) | 구현자에게 R7 명시 전달 | 해결(ui.js 카드 label) |
| 1 | F2 `T53-V8.output-bars`: 값 0 막대 hidden | 테스트 결함: 폭 0 요소는 Playwright hidden | 존재·data-value로 단언 | 해결 |
| 1 | F3 `T53-V9.range`: 범위 밖 입력 후 0 기대 | 테스트 결함: stale은 마지막 유효 입력(직전 값) 결과 | 기대값을 직전 유효 입력으로 | 해결 |
| 1 | F4 coverage `learning/format.mjs` 0% line | spec 공백: 표시 형식 Signature 없음 | v2 Signature·V14 추가 | 해결(formatCount 테스트) |
| 2 | F5 `T53-V9.content-cards` 90s timeout: show()가 assessment로 이동한 뒤 stage-next | 테스트 결함(verified) | `gotoStage` 헬퍼, no-manufacturing-text 형제 동일 수정 | 해결 |
| 2 | F6 `V8.S11` 전체 실행에서만 실패, 단독 3회 반복 통과 | hypothesis: F5 timeout 연쇄(같은 실행) | 변경 없이 F5 수정 후 전체 재실행 | verify3에서 통과 |
| 3 | verifier 1: F-1(R12 부분/초과집합 미관측), F-2(표시 문자열 미관측) 증거 gap; S-1·S-2·S-3 spec challenge; V13 판정 미기록 | 증거·spec 공백 | v3 보강, V13 판정 기록, 테스트 보강 | 테스트 보강 완료 |
| 3 | F7 serve 알 수 없는 플래그에서 parseArgs 예외 exit 1 | 구현 결함(verified) | strict:false+tokens로 ARGUMENT exit 2 | verify5 통과 |
| 4 | verifier 2 pass, finding 0; advisory A-1(v1-lesson·model-with-import 코드 정규식 느슨), A-2(V13 산출물 test-results는 실행마다 재생성), A-3(15.38 예측 입력 vs 15.385 셀 구분) | — | 비차단 | complete |

# Version Log
## v1
- 초안. 계획(`/Users/hwansu/.claude/plans/t5-3-optimized-aho.md`)의 사용자 결정 반영.
## v2
- F4: `formatCount` Signature와 V14 추가(기존 동작 유지라 행동 변경 없음). V8 개념 카드 6→5 오기 수정(두 역할 지적). R7 카드에 label 포함 명시, R8/C13 hint-text 내용 명확화(행동 변경 없음, 기존 C13 표현과 일치).
## v3
- verifier 1 S-1: V5 대상에 index.md 2개 추가. S-2: 알 수 없는 플래그 exit 2 항목을 V6·V7·V11에 추가. S-3: V7에 id 형식·candidate 필드·중첩 unknown 필드 추가, V7 층을 프로세스 통합으로 확정. F-1: V2 저장 inputs 부분/초과집합. F-2: V8 표시 문자열 정확 비교. 사용자 승인(2026-10-06).
