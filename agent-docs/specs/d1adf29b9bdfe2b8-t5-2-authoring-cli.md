---
version: 1
run_id: d1adf29b9bdfe2b8
status: draft
base_commit: f486a2e8db3efb17e131729cbf71d0ffb7ce808f
max_verifier_invocations: 2
handoff: agent-docs/handoff/bc687eb8711f016a-t5-remaining.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| I1 | 작업 agent | agent가 생성한 lesson v2·모델 코드·oracle을 배치 전에 기계적으로 검증한다 | 계산 불일치·범위 미검사·비유한값·입력 변경·비결정성·무한 루프 모델이 오류 코드와 경로로 거부된다 |
| I2 | 작업 agent | 진단 화면의 원시 선택과 agent 가설을 diagnostic 문서로 만든다 | 계약을 통과하는 diagnostic v1이 출력되고, 확정은 하지 않는다 |
| I3 | 학습자 | 생성 자료가 profile 폴더에 일부만 쓰이거나 기존 자료를 덮어쓰지 않는다 | 실패 시 profile 폴더가 바뀌지 않고, 같은 id·revision의 다른 내용은 CONFLICT |
| I4 | 학습자 | 한 회 분량이 넘는 lesson을 배치하지 않는다 | 결정 변수 >2 또는 개념 >5는 SCOPE로 거부 |
| I5 | 작업 agent | 다음 학습 경로(분할 회차 포함)를 map에 기록한다 | nextPaths가 교체되고 map.revision이 1 증가 |

# Scope
In scope: `scripts/lesson.mjs` CLI의 `check-model`, `diagnose`, `place-diagnostic`, `place-lesson`, `set-next-paths`; 모델 실행용 자식 프로세스 runner; 원시 진단 선택 형식(diagnostic-choices v1) 정의와 검증; profile 폴더 원자적·불변 배치; `package.json` verify coverage include 추가.
Out of scope: 진단·수업 화면(T5-3), 일반 런타임 전환(T5-3), skill 문서(T5-4), lesson 계약 변경(series 필드 등), 기존 `scripts/map.mjs`·`knowledge/*` 동작 변경, 생성 코드의 보안 sandbox(자식 프로세스는 충돌·시간 격리만 제공), Codex 지원.

# Paths
Implementation: scripts/lesson.mjs, authoring/, package.json
Tests: tests/authoring.test.mjs, tests/lesson-cli.test.mjs, tests/fixtures/authoring/
Test command: npm run verify
Review evidence: none — 모든 관찰이 자동화 가능

# Signatures
CLI `node scripts/lesson.mjs <command>`; stdout에 JSON outcome 한 줄, exit 0 = ok, 1 = 실패 outcome, 2 = 사용법 오류(stderr에 usage). `scripts/map.mjs` 관례를 따른다.
`check-model --lesson <lesson.json> --model <model.mjs> --oracle <oracle.json>` → `{ok:true}` | `{ok:false, code:'CHECK', errors:[{code,path}], message, next}`
`diagnose --choices <choices.json> --hypotheses <hypotheses.json>` → `{ok:true, diagnostic}` | 실패 outcome
`place-diagnostic <diagnostic.json>` → `{ok:true, action:'placed'|'unchanged', path}` | 실패 outcome
`place-lesson <lesson.json> --model <model.mjs> --oracle <oracle.json>` → `{ok:true, action:'placed'|'unchanged', paths:[...]}` | 실패 outcome
`set-next-paths <profileId> <nextPaths.json>` → `{ok:true, revision, generation}` | 실패 outcome
Module `authoring/check-model.mjs`: `checkModel({lessonText, modelPath, oracleText}, {timeoutMs?}) → Promise<{ok, errors}>`
Module `authoring/diagnose.mjs`: `buildDiagnostic(choices, hypotheses) → {ok, diagnostic?, errors}`
Module `authoring/place.mjs`: `placeDiagnostic(text, opts)`, `placeLesson({lessonText, modelPath, oracleText}, opts)`, `setNextPaths(profileId, nextPathsText, opts)`; `opts = {home?, fs?}`는 `knowledge/paths.mjs` `context`와 같다.
실패 outcome 형식: `knowledge/store.mjs` `fail(code, message, next, errors?)`.
모델 모듈 계약: `export const model = {modelId, modelRevision, inputIds, outputIds, calculate(values)}`; `values`는 inputId→number 객체; `calculate`는 `{ok:true, value:{<outputId>: number|null}}` 또는 `{ok:false, errors:[{code,path}]}`를 반환한다(`examples/manufacturing-inspection/model.mjs`의 `model`과 동일).
원시 진단 형식 diagnostic-choices v1:
`{kind:'diagnostic-choices', version:1, diagnosticId, profileId, contextKind:'work'|'interest', rounds:[{candidates:[candidate 1..3], reactions:[{candidateId, reaction:'similar'|'surprising'|'unknown'|'not-applicable'}]}] (1..2개)}`; candidate는 diagnostic 계약의 candidate 형식.
hypotheses 입력: diagnostic 계약 `hypotheses` 배열과 같은 형식의 JSON 배열.
배치 경로(profile dir = `knowledge/paths.mjs` `profileDir`): `diagnostics/<diagnosticId>.json`, `lessons/<lessonId>.<lessonRevision>.json`, `models/<modelId>.<modelRevision>.mjs`, `models/<modelId>.<modelRevision>.oracle.json`.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| R1 | check-model은 lesson(v2 계약), oracle(계약), 모델 선언 binding(`validateModelBinding`), oracle binding(`validateOracleBinding`)을 검증하고 하나라도 실패하면 해당 오류를 그대로 담아 거부한다 | must | T5-1 계약 |
| R2 | check-model은 모델을 자식 프로세스에서 import·실행하고, import·탐침 전체가 5000ms를 넘으면 프로세스를 종료하고 `TIMEOUT /model`로 거부한다 | must | 사용자 결정(자식 프로세스, 전체 5초) |
| R3 | 모델 모듈 load 실패·`model` export 없음은 `LOAD /model`, calculate의 throw는 `THROW <탐침 경로>`로 거부한다 | must | R2 파생 |
| R4 | oracle 각 case의 각 expected에 대해 `|actual-expected| <= case.absolute`(null은 null과만 일치)가 아니거나 calculate가 ok:false면 `MISMATCH /cases/<i>/expected/<j>`로 거부한다 | must | handoff T5-2 |
| R5 | 범위 밖 입력 탐침: 각 입력에 대해 다른 입력은 default, 그 입력만 `min-ε`·`max+ε`(ε = max(1e-9, |bound|·1e-9))로 호출해 ok:false가 아니면 `PROBE_RANGE /inputs/<inputId>/min|max`로 거부한다 | must | 사용자 결정 |
| R6 | 비유한값 탐침: 탐침 입력 집합(oracle case 입력, 각 입력의 min·max·default를 다른 입력 default와 조합, 전부 min, 전부 max)에서 ok:true 출력의 각 값이 유한수가 아니거나(nullable 출력의 null 제외) 출력 키 집합이 outputIds와 다르면 `NON_FINITE /probes/<k>/<outputId>` 또는 `SHAPE /probes/<k>`로 거부한다 | must | 사용자 결정; Infinity는 계약·JSON·채점에서 표현 불가(`contracts/index.mjs:24`, `learning/grading.mjs:11`) |
| R7 | 입력 불변 탐침: R6의 각 탐침 호출 전후 입력 객체의 깊은 스냅샷이 다르면 `MUTATION /probes/<k>` | must | 사용자 결정 |
| R8 | 결정성 탐침: R6의 각 탐침 입력으로 2회 호출한 결과가 깊은 비교로 다르면 `NONDETERMINISTIC /probes/<k>` | must | 사용자 결정 |
| R9 | diagnose는 choices를 검증하고(형식·round 1–2개·reaction의 candidateId가 같은 round candidates에 존재·round 내 candidateId 중복 금지), 마지막 round의 candidates, `selection:null`, `confirmation:'unconfirmed'`, 입력 hypotheses로 diagnostic v1을 만들고 diagnostic 계약으로 검증해 출력한다 | must | 사용자 결정(CLI 변환, 반응만 보존, agent 가설) |
| R10 | place-diagnostic은 diagnostic 계약 통과 문서만 `diagnostics/<diagnosticId>.json`에 원자적으로 쓴다 | must | handoff T5-2 |
| R11 | place-lesson은 lesson 계약(v2만 허용), 분량(R12), check-model을 모두 통과해야만 lesson·model·oracle 3파일을 배치한다 | must | 사용자 결정(묶음 검사) |
| R12 | lesson의 `decisions` 수가 2를 넘으면 `SCOPE /decisions`, `concepts` 수가 5를 넘으면 `SCOPE /concepts`로 거부한다(분할 제안은 출력하지 않는다) | must | 사용자 결정(거부만) |
| R13 | 배치 대상 파일이 이미 있으면 바이트가 같을 때 `unchanged`, 다를 때 `CONFLICT`로 거부하며 어떤 파일도 쓰지 않는다. place-lesson은 3파일 모두 같을 때만 unchanged | must | 사용자 결정(불변 파일) |
| R14 | 배치 쓰기는 temp 파일(`wx`)→sync→rename이며, 실패 시 temp를 지우고 이번 호출이 새로 만든 대상 파일도 제거한다. place-lesson은 model·oracle을 먼저, lesson을 마지막에 rename한다 | must | `knowledge/store.mjs` writeMap 패턴 |
| R15 | set-next-paths는 nextPaths 배열로 map의 nextPaths를 교체하고 revision을 1 올려 `writeMap`으로 저장한다. map이 없으면 `MAP_MISSING`, 읽을 수 없으면 `MAP_UNREADABLE`, 결과 map이 계약을 통과하지 않으면 `INVALID` | must | 사용자 결정(전용 명령) |
| R16 | profileId 형식 오류는 fs 호출 전에 `PROFILE`(knowledge `profileFail`) | must | 기존 관례 |
| R17 | 입력 파일 읽기 실패는 `IO`, JSON 파싱 실패는 `INVALID`(errors `[{code:'JSON', path:'/<label>'}]`) | must | `knowledge/import.mjs` 관례 |

# Errors
- 계약·binding 실패 — exit 1, outcome code `INVALID`(문서) 또는 `CHECK`(check-model 단계), errors에 계약 오류 — profile 폴더 변경 없음
- 모델 시간 초과 — `CHECK` + `TIMEOUT /model`, 자식 프로세스 종료됨 — 변경 없음, 잔여 자식 프로세스 없음
- 모델 load 실패·throw — `CHECK` + `LOAD /model` / `THROW <path>` — 변경 없음
- 분량 초과 — `SCOPE`, errors `/decisions`·`/concepts` — 변경 없음
- 기존 파일과 다른 내용 — `CONFLICT`, errors에 충돌 파일 경로 — 기존 파일 바이트 유지
- 쓰기 I/O 실패 — `IO` — temp 없음, 이번 호출이 새로 만든 대상 파일 없음, 기존 파일 유지
- map 없음/손상 — `MAP_MISSING` / `MAP_UNREADABLE` — map.json 바이트 유지
- map 동시 변경 — `STALE`(writeMap) — map.json 유지
- 사용법 오류 — exit 2, stderr usage, stdout 없음

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | 제조 검사 lesson-v2·model·oracle로 check-model | `{ok:true}` |
| C2 | normal | C1 자료로 place-lesson, 빈 profile | placed, 3파일 바이트 = 입력, 이후 `knowledge/import` 가 lesson을 찾음 |
| C3 | normal | 같은 입력으로 place-lesson 재실행 | unchanged, 파일 mtime·바이트 유지 |
| C4 | normal | 유효 choices(2 round)+hypotheses로 diagnose 후 place-diagnostic | diagnostic 계약 통과, candidates = 마지막 round, selection null, unconfirmed |
| C5 | normal | 유효 nextPaths로 set-next-paths, map revision r | revision r+1, nextPaths 교체, generation +1 |
| C6 | boundary | decisions 2개·concepts 5개 | 통과; decisions 3개 / concepts 6개는 SCOPE |
| C7 | boundary | 모델이 4900ms 안에 끝남 / 무한 루프 | 통과 / TIMEOUT, 5000ms+여유 안에 반환 |
| C8 | boundary | oracle 차이 = absolute / absolute+ε | 통과 / MISMATCH |
| C9 | boundary | choices round 1개·2개 / 0개·3개 | 통과 / INVALID |
| C10 | error | 범위 검사 없는 모델 | PROBE_RANGE |
| C11 | error | 0/0으로 NaN, 1/0으로 Infinity, non-nullable에 null을 내는 모델 | NON_FINITE |
| C12 | error | 입력 객체를 수정하는 모델 / Math.random 사용 모델 | MUTATION / NONDETERMINISTIC |
| C13 | error | throw 모델, `model` export 없는 모듈, 문법 오류 모듈 | THROW / LOAD / LOAD |
| C14 | error | 다른 바이트의 같은 lesson id.revision 존재 | CONFLICT, 어떤 파일도 바뀌지 않음 |
| C15 | error | lesson rename 단계 I/O 실패(fault fs) | IO, 이번에 만든 model·oracle 제거, temp 없음 |
| C16 | error | map 없음 / 손상 map으로 set-next-paths | MAP_MISSING / MAP_UNREADABLE, 바이트 유지 |
| C17 | error | 잘못된 profileId, 인자 누락 | PROFILE(fs 호출 0회) / exit 2 |
| C18 | edge | 모델 출력에 outputIds 외 키 또는 누락 | SHAPE |
| C19 | edge | lesson v1 으로 place-lesson | INVALID(VERSION 또는 binding 오류) |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 검증·배치 정확성이 목적 |
| Performance efficiency | yes | 생성 모델 시간 제한 |
| Compatibility | yes | 배치 파일을 기존 `knowledge/import`가 읽어야 함 |
| Interaction capability | yes | agent가 outcome의 message·next로 다음 행동을 정함 |
| Reliability | yes | 원자적·불변 배치 |
| Security | yes | 생성 코드 실행을 CLI 프로세스와 분리 |
| Maintainability | yes | 기존 100% 커버리지 정책 유지 |
| Flexibility | no | 단일 로컬 Node 환경, 이식 요구 없음 |
| Safety | no | 물리적·인명 위해 경로 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Functional suitability / correctness | C1–C19 | 사례별 outcome 일치 비율, % | = 100% | automated: tests | spec |
| Q2 | Performance / time behaviour | 무한 루프 모델의 check-model 반환 시간 | 측정 경과 시간, ms | ≤ 7000ms (5000 제한 + 2000 여유) | automated: C7 | 사용자 결정(5초) |
| Q3 | Compatibility / interoperability | place-lesson·place-diagnostic 결과 | 같은 home에서 `importResult`가 MISSING_LESSON/MISSING_DIAGNOSTIC 없이 진행 | 해당 오류 0건 | automated: C2·C4 | handoff |
| Q4 | Interaction capability / user error protection | 모든 실패 outcome | `code`·`message`·`next` 존재 비율, % | = 100% | automated | `scripts/map.mjs` 관례 |
| Q5 | Reliability / fault tolerance | C14·C15·C16 및 mkdir·open·write·sync·rename 단계 fault | 실패 후 profile 트리 스냅샷 동일 여부 | 차이 0 | automated: fault fs | R13·R14 |
| Q6 | Security / integrity | 모델이 전역 변경·process.exit·무한 루프를 해도 | CLI 프로세스가 outcome JSON을 출력하고 종료, 잔여 자식 0 | 위반 0 | automated: C7·C13, `process.exit` 모델 fixture | 사용자 결정(격리) |
| Q7 | Maintainability / testability | `authoring/*.mjs` | Node test coverage line·function, % | = 100% (`package.json` verify include 추가) | automated: npm run verify | 기존 정책 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | R1, C1, C19 | checkModel / CLI check-model | unit + integration | equivalence partitioning | {유효, lesson 계약 실패, lesson v1, oracle 계약 실패, model binding 실패, oracle binding 실패} | 100% | ok 또는 해당 계약 오류 포함 | tests/authoring.test.mjs |
| V2 | R2, R3, C7, C13, Q2, Q6 | checkModel | integration(실제 자식 프로세스) | equivalence partitioning | {정상 종료, 4900ms 지연, 무한 루프, throw, export 없음, 문법 오류, process.exit 호출, 전역 오염} | 100% | 해당 코드, 경과 ≤ 7000ms, 자식 pid 종료 확인 | tests/authoring.test.mjs |
| V3 | R4, C8 | checkModel oracle 대조 | unit | boundary value analysis (2-value) | {차이=absolute, 차이=absolute+ε, expected null·actual null, expected null·actual 수, expected 수·actual null, calculate ok:false} | 100% | 통과/MISMATCH 경로 정확 | tests/authoring.test.mjs |
| V4 | R5, C10 | 탐침 범위 | unit | boundary value analysis (3-value) | 입력별 {min-ε, min, max, max+ε} × {범위 검사 모델, min 검사 누락 모델, max 검사 누락 모델} | 100% | PROBE_RANGE 경로가 누락 bound만 지목 | tests/authoring.test.mjs |
| V5 | R6, C11, C18 | 탐침 출력 | unit | equivalence partitioning | {유한, NaN, Infinity, -Infinity, nullable null, non-nullable null, 문자열, 키 누락, 키 초과} | 100% | NON_FINITE/SHAPE 경로 정확 | tests/authoring.test.mjs |
| V6 | R7, R8, C12 | 탐침 불변·결정성 | unit | error guessing | {값 덮어쓰기, 키 추가, 키 삭제, Math.random, 호출 카운터 전역 상태} | none — experience-based | MUTATION / NONDETERMINISTIC | tests/authoring.test.mjs |
| V7 | R9, C4, C9 | buildDiagnostic / CLI diagnose | unit | classification tree | rounds 수 {0,1,2,3}; reaction 값 {4종, 미정의}; candidateId {존재, 미존재, 중복}; hypotheses {유효, 계약 위반, 미존재 candidateId}; candidates 수 {0,1,3,4} — 각 분류 값 1회 이상(each choice) | 100% | 유효는 계약 통과 diagnostic, 나머지 INVALID 경로 | tests/authoring.test.mjs |
| V8 | R10–R14, C2, C3, C6, C14, C15, Q3, Q5 | place* / CLI | integration (temp home, `tests/fixtures/knowledge/faults.mjs` 방식 fault fs) | state transition | 상태 {없음, 동일 존재, 다른 내용 존재, 일부만 존재} × 동작 {placeDiagnostic, placeLesson}, fault 지점 {mkdir, open, write, sync, rename(model), rename(lesson)} | 100% | placed/unchanged/CONFLICT/IO, 실패 후 스냅샷 동일, temp 0 | tests/authoring.test.mjs |
| V9 | R12, C6 | 분량 | unit | boundary value analysis (2-value) | decisions {2,3}, concepts {5,6} | 100% | 통과/SCOPE 경로 | tests/authoring.test.mjs |
| V10 | R15, R16, C5, C16, C17 | setNextPaths | integration | equivalence partitioning | {유효, map 없음, map 손상, 계약 위반 nextPath, JSON 오류, 잘못된 profileId, STALE} | 100% | revision+1·generation+1 또는 해당 코드, 실패 시 바이트 유지 | tests/authoring.test.mjs |
| V11 | R17, Q4, 전체 CLI | scripts/lesson.mjs 프로세스 | end-to-end(실제 node 프로세스) | syntax testing | 명령 5종 × {정상 인자, 인자 누락, 알 수 없는 옵션}, 알 수 없는 명령, 파일 없음 | 100% | exit 0/1/2, stdout JSON 1줄, 실패 outcome에 code·message·next | tests/lesson-cli.test.mjs |
| V12 | Q7 | authoring/*.mjs | structure-based | statement + function coverage (node --experimental-test-coverage) | authoring/*.mjs 전체 | line 100%, function 100% | npm run verify 통과 | npm run verify |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | 반응(reaction)은 diagnostic 문서에 저장되지 않는다 — diagnostic v1 계약에 필드가 없고 계약 변경은 범위 밖 | `contracts/definitions.mjs` diagnostic | 승인 필요 |
| A2 | 탐침 ε = max(1e-9, |bound|·1e-9) | 부동소수 오차 안에서 경계 판정 안정 | 승인 필요 |
| A3 | set-next-paths는 map이 없으면 새로 만들지 않고 MAP_MISSING | 첫 import 전 경로 기록은 의미 없음 | 승인 필요 |
| A4 | nextPath.lessonId는 아직 배치되지 않은 lesson을 가리킬 수 있다(참조 검사 안 함) | 분할 회차는 아직 생성 전 | 승인 필요 |
| A5 | 로직은 `authoring/`에 두고 `scripts/lesson.mjs`는 인자 해석·출력만 한다 | `scripts/map.mjs`+`knowledge/` 구조와 동일, coverage include 대상 | 승인 필요 |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| R1 | C1, C19 | V1 | npm run verify |
| R2, R3 | C7, C13 | V2 | npm run verify |
| R4 | C8 | V3 | npm run verify |
| R5 | C10 | V4 | npm run verify |
| R6 | C11, C18 | V5 | npm run verify |
| R7, R8 | C12 | V6 | npm run verify |
| R9 | C4, C9 | V7 | npm run verify |
| R10, R11, R13, R14 | C2, C3, C14, C15 | V8 | npm run verify |
| R12 | C6 | V9 | npm run verify |
| R15, R16 | C5, C16, C17 | V10 | npm run verify |
| R17 | C17 | V11 | npm run verify |
| Q1–Q7 | C1–C19 | V1–V12 | npm run verify |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 0 |
| verifier invocations | 0 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| V1–V12 | 1 | none | pending | 미구현 | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |

# Version Log
## v1
- 초안. 결정 근거: 사용자 응답(2026-10-05) — 자식 프로세스+전체 5초, CLI 변환·반응만 보존·agent 가설 입력, nextPaths 전용 명령, 분량 초과 거부만, 묶음 검사·불변 파일(진단 포함), 탐침 4종(Infinity는 계약상 표현 불가 확인 후 금지).
