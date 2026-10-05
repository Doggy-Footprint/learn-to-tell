---
version: 3
run_id: fd5077c6a63a8fb9
status: complete
base_commit: 34a51f91b2eb991b11f17164a12d52c03320bfb0
max_verifier_invocations: 2
handoff: agent-docs/handoff/bc687eb8711f016a-t5-remaining.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| U1 | agent(skill) | 새 분야 수업을 lesson으로 선언하고 생성한 모델과 연결 | lesson v2가 모델 ID·revision·출력 선언·시나리오·채점 허용오차를 담고 `validateDocument(…,'lesson')`이 v1/v2를 모두 판정 |
| U2 | agent(skill) | 생성 모델의 계산을 자기 확언 없이 대조할 기대값을 기록 | oracle 문서가 케이스마다 입력·기대값·허용오차·출처·작성 주체를 담고 계약 검증을 통과해야 사용 가능 |
| U3 | agent(skill) | 모델 선언과 lesson의 연결 오류를 실행 전에 발견 | `validateModelBinding(declaration, lesson)`이 입력·출력 ID·범위 불일치를 오류 경로로 반환 |
| U4 | 사용자 | 기존 기록이 계속 유효 | 기존 lesson v1·result v2·map v2 fixture 판정 결과가 변경 전과 동일 |
| U5 | 개발(T5-2·T5-3) | 제조 검사가 일반 경로의 회귀 기준 | 제조 검사의 lesson v2·모델 선언·oracle이 계약과 binding을 통과하고, oracle 기대값이 기존 T2 기대값과 일치 |

# Scope
In scope: lesson v2 계약(definitions·semantics), 버전별 분기를 위한 definitions 엔진 확장, oracle v1 계약, 모델 선언 계약과 `validateModelBinding`, map·bundle의 lesson v1/v2 혼재 허용, 제조 검사의 lesson v2·모델 선언(`model` export)·oracle 자료.
Out of scope: 모델 실행과 oracle 대조(`check-model`, T5-2), profile 폴더 배치·map.revision·nextPaths(T5-2), 런타임·채점 코드(`learning/*`, `site/*`)의 v2 전환(T5-3), 진단 페이지(T5-3), skill(T5-4), lesson v1·result v2·map v2·diagnostic v1의 의미 변경, 기존 `calculateInspection`·`validateSimulationBinding`의 동작 변경.

# Paths
Implementation: contracts/definitions.mjs, contracts/index.mjs, contracts/model.mjs, examples/manufacturing-inspection/model.mjs (`model` export 추가만), examples/manufacturing-inspection/lesson-v2.mjs, examples/manufacturing-inspection/oracle.json, package.json (coverage include 변경 시만)
Tests: tests/contracts-v2.test.mjs, tests/fixtures/contracts-v2/
Test command: npm run verify
Review evidence: R1 — main이 `examples/manufacturing-inspection/oracle.json`의 각 케이스 기대값을 `tests/fixtures/simulation/cases.mjs`의 같은 입력 기대값과 대조한 표를 Execution ledger에 기록.

# Signatures
D1–D6 승인됨:
- lesson v2 = lesson v1 필드 + `modelId: id`, `modelRevision: integer`, `outputs: array(output,1)`, `scenarios: array(scenario,1)`, `transfer: {scenarioId: id, tolerances: array({outputId: id, absolute: number ≥0},1)}`; `version: 2`.
  - `output = {outputId: id, label: string, unit: string, scale: number>0, nullable: boolean}` — 화면값 = 모델 raw 값 × scale, 허용오차는 화면값 기준.
  - `scenario = {scenarioId: id, label: string, values: array({inputId: id, value: number},1)}`.
- oracle v1: `{kind:'oracle', version:1, modelId, modelRevision, cases: array(case,1)}`; `case = {caseId: id, values: array({inputId, value},1), expected: array({outputId, value: number|null},1), absolute: number ≥0, source: string, author: enum('model-author','independent-agent')}`.
- 모델 module: `export const model = {modelId, modelRevision, inputIds: string[], outputIds: string[], calculate(values) → {ok:true, value:{[outputId]: number|null}} | {ok:false, errors:[{code,path}]}}`. `values`의 key는 inputId.
- contracts/index.mjs: `validateDocument(doc, 'lesson'|'oracle'|…)`, `parseDocument` 동일 확장. `validateBundle`은 lesson v1/v2 모두 수용.
- contracts/model.mjs: `validateModelBinding(declaration, lesson) → {ok, errors}`; declaration은 `model`에서 `calculate`를 제외한 필드. `validateOracleBinding(oracle, lesson) → {ok, errors}`.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| F1 | `validateDocument(x,'lesson')`는 `version` 1이면 기존 v1 규칙만, 2이면 v2 규칙을 적용하고, 그 외 version은 `VERSION /version` | must | 결정: lesson v2 추가, v1 읽기 유지 |
| F2 | lesson v2는 v1의 모든 semantics(참조·역할·시간 15–20·6단계·5차원)를 그대로 적용 | must | ROADMAP §9 M1 |
| F3 | lesson v2 semantics: outputId·scenarioId 중복 `DUPLICATE`; scenario의 inputId는 lesson inputs 참조(`REFERENCE` 항목 경로 `.../values/j/inputId`), 값은 min–max(`RANGE` `.../values/j/value`), 각 scenario는 모든 input을 정확히 한 번 포함(누락·중복 `STATE /scenarios/i/values`); transfer.scenarioId 참조(`REFERENCE`); tolerances의 outputId 참조(`REFERENCE`)·중복(`DUPLICATE`), 모든 output 포함(누락 `STATE /transfer/tolerances`); `absolute < 0`·`scale ≤ 0`은 `RANGE` | must | U1 |
| F4 | oracle v1 semantics(`validateDocument`): caseId 중복 `DUPLICATE`; case 안 inputId·outputId 중복 `STATE /cases/i/values`·`/cases/i/expected`; `absolute < 0` `RANGE`. 누락·nullable 검사는 binding(F6) | must | U2 |
| F5 | `validateModelBinding`: 오류 경로는 `/model`·`/lesson` 접두어. modelId 불일치 `REFERENCE /model/modelId`, modelRevision 불일치 `REVISION /model/modelRevision`, inputIds·outputIds 집합이 lesson과 일치, `calculate`의 존재 여부는 검사하지 않음(T5-2) | must | U3 |
| F6 | `validateOracleBinding`: 오류 경로는 `/oracle`·`/lesson` 접두어. modelId 불일치 `REFERENCE`, modelRevision 불일치 `REVISION`, case 안 input·output 누락 `STATE /oracle/cases/i/values`·`/expected`, case의 inputId·outputId가 lesson 참조, 값 범위, nullable 위반 `STATE`, 각 input의 min과 max를 값으로 쓰는 case가 하나 이상 존재(`STATE /oracle/cases`) | must | 결정: oracle 1차 검증 |
| F7 | map v2의 `lessons` 항목과 bundle의 `lesson`은 v1·v2를 모두 허용하고, 기존 map·bundle 규칙(결과-lesson 참조, revision, CONFLICT, duplicate)은 버전과 무관하게 동일 | must | U4 |
| F8 | 기존 contracts·learning·knowledge·simulation 테스트와 e2e가 통과. 예외: 'version 2 = 모르는 lesson 버전'을 예시로 쓰는 기존 4개 테스트(V1.lesson.version-2, V1.map.version-2, CH-V1.version.lesson.2, V4.lesson-version-2)는 예시 값을 3으로만 바꾼다 | must | U4 |
| F9 | 제조 검사 lesson v2·모델 선언·oracle이 F1–F6을 모두 통과하고, oracle은 T2 기대값 케이스(baseline-a, population-contrast, candidate-b, PPV null 케이스, 입력 min/max 경계)를 포함 | must | U5 |

# Errors
- 구조·semantics 위반 — `{ok:false, errors:[{code,path}]}` 정렬·중복 제거(기존 `output` 규칙) — 입력 객체 불변, 예외 없음.
- 모르는 kind — `KIND ''`; 숫자인 모르는 version — `VERSION /version`만; 숫자가 아닌 version — `TYPE /version`(기존 규칙).
- oracle 기대값·`absolute`는 모델 raw 값 단위(scale 적용 전).
- binding 함수에 객체가 아닌 값 — `TYPE /model` 또는 `TYPE /lesson`·`/oracle`, 예외 없음.
- binding 함수에 객체이지만 선언·oracle 필드가 없거나 타입이 틀린 값 — 필드 없음 `REQUIRED <경로>`, 타입 오류 `TYPE <경로>`(경로는 `/model/…`·`/oracle/…` 접두어), 예외 없음.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | 제조 검사 lesson v1 (기존) | ok, 기존과 동일 |
| C2 | normal | 제조 검사 lesson v2·declaration·oracle | 세 검증 모두 ok |
| C3 | boundary | scenario 값 = input min / max, absolute = 0 | ok |
| C4 | boundary | scenario 값이 min−ε / max+ε | `RANGE` 해당 경로 |
| C5 | error | lesson version 3 | `VERSION /version` |
| C6 | error | scenario에 input 누락·중복 | `STATE` |
| C7 | error | oracle에서 nullable=false output에 null 기대값 | `STATE` |
| C8 | error | oracle에 어떤 input의 max 값을 쓰는 case 없음 | `STATE /oracle/cases` |
| C9 | error | declaration의 outputIds가 lesson outputs와 집합 불일치 | `REFERENCE` |
| C10 | edge | map에 같은 lessonId의 v1 rev1과 v2 rev2가 공존, 결과는 rev1 참조 | ok |
| C11 | edge | 적대적 입력(getter·symbol key·순환·깊이>32·크기>1000)이 v2 신규 필드에 위치 | 기존 `TYPE`/`LIMIT` 규칙, getter 미실행 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 계약 판정 정확성이 핵심 |
| Performance efficiency | no | 기존 크기 제한(1MB·1000·깊이 32)이 상한을 정하며 새 반복 구조 없음 |
| Compatibility | yes | lesson v1·map v2 공존 |
| Interaction capability | no | 사용자 화면 없음 |
| Reliability | yes | 비정상 입력에도 예외 없이 오류 반환 |
| Security | yes | 생성 자료는 신뢰할 수 없는 입력; getter 실행·prototype 오염 금지 |
| Maintainability | yes | 100% line/function coverage 유지 |
| Flexibility | no | 다른 호스트·형식 범위 밖 |
| Safety | no | 물리적 위해 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Functional suitability / correctness | C1–C11 판정 | 기대 오류 집합과 실제 비교 / 케이스 수 | 일치 11/11 | automated; mutation M1 | F1–F9 |
| Q2 | Compatibility / co-existence | 기존 fixture 전체 | 기존 테스트 통과 수 | 100%, 기존 테스트 diff는 F8 예외 4건의 버전 값 변경만 | automated | F8 |
| Q3 | Reliability / fault tolerance | 적대적 입력 | 예외 발생 수 | 0 | automated | Errors |
| Q4 | Security / integrity | getter·입력 변이 | getter 호출 수·snapshot 차이 | 0 | automated | C11 |
| Q5 | Maintainability / testability | contracts/*.mjs, examples/manufacturing-inspection/*.mjs | node --test coverage line·function % | 100 이상 | automated(Test command) | 기존 verify |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | F1,C1,C5 | `validateDocument` lesson version 1/2/기타 | unit | equivalence partitioning | {v1, v2, 0, 3, 문자열 "2"} | 100% | v1·v2 ok, 0·3 `VERSION /version`, "2" `TYPE /version` | tests/contracts-v2.test.mjs |
| V2 | F2,F3,C3,C4,C6 | lesson v2 신규 규칙 | unit | boundary value analysis (3-value) + error guessing | 각 input min/max의 −ε, =, +ε; absolute −ε,0; F3 규칙별 위반 1건; v2 lesson의 v1 규칙 위반 {필수 시간 합 14, 단계 누락, 차원 누락, 역할 불일치 참조} 각 1건(v1과 같은 code·path) | 100% | 기대 code·path | 동일 |
| V3 | F4,F6,C7,C8 | oracle 문서·binding | unit | decision table | {nullable × 기대 null} 4조합, min/max 커버 유무 2×input 수, 참조 오류 각 1 | 100% | 기대 code·path | 동일 |
| V4 | F5,C9 | `validateModelBinding` | unit | equivalence partitioning | {일치, modelId 불일치, revision 불일치, input 누락, input 추가, output 누락, output 추가, 비객체, 선언 필드 누락(`outputIds` 없음 → `REQUIRED /model/outputIds`), 선언 필드 타입 오류(`inputIds` 비배열 → `TYPE /model/inputIds`), oracle 필드 누락(`cases` 없음 → `REQUIRED /oracle/cases`), oracle 필드 타입 오류(`cases` 비배열 → `TYPE /oracle/cases`)} | 100% | 기대 code·path | 동일 |
| V5 | F7,C10 | map·bundle v1/v2 혼재 | unit | combinatorial (each choice) | lesson 버전 {v1,v2} × 결과 참조 {v1,v2} × {duplicate, conflict, ok} | 100% | 기존 규칙 결과 | 동일 |
| V6 | F8,Q2 | 기존 전체 suite | unit+e2e | scenario | 기존 테스트 전부 | 100% | 통과(환경 npm 버전 불일치로 이미 실패하던 `V6 approved toolchain npm exact version`은 범위 밖으로 기록) | npm run verify, git diff tests/ 기존 파일이 F8 예외 4건만 |
| V7 | F9,R1 | 제조 검사 v2 자료 | unit + review | scenario | C2; oracle 케이스별 T2 기대값 일치 | 100% | ok, 값 차이 ≤1e-9 | tests + R1 |
| V8 | C11,Q3,Q4 | 신규 필드 위치의 적대적 입력 | unit | error guessing | getter, symbol, 순환, 깊이, 길이, 비plain prototype × {outputs, scenarios, transfer, oracle cases} 전 조합 | none — experience-based | 예외 0, getter 0, 입력 불변 | tests |
| V9 | Q5 | 구조 coverage | unit | statement + branch(측정은 line·function) | Implementation 파일 | 100% line/function | Test command 통과 | npm run verify |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| D1 | lesson v2 출력 표현: `scale`로 raw→화면 단위 변환, 허용오차는 화면값 기준 | 현재 grading은 비율을 %로, 개수를 그대로 비교. 다른 분야에서 scale이 충분한지 불확실 | 사용자 승인 2026-10-05 |
| D2 | oracle을 lesson과 별도 문서(kind `oracle`)로 둠 | 독립 agent가 lesson만 보고 작성 가능. lesson 내장 대안 있음 | 사용자 승인 2026-10-05 |
| D3 | oracle 최소 커버리지 = 각 input의 min·max를 쓰는 case 존재 (nullable output별 null case 의무는 미포함, F6 기준) | 경계 결함 검출 목적. 조합 폭증은 피함 | 사용자 승인 2026-10-05 |
| D4 | 모델 선언에서 단위·범위는 lesson이 단일 출처(모델 선언은 ID만) | 중복 선언으로 인한 불일치 방지 | 사용자 승인 2026-10-05 |
| D5 | definitions 엔진에 version 분기(`versions: {1: def, 2: def}`) 추가 | 기존 엔진은 단일 정의만 지원 | 사용자 승인 2026-10-05 |
| D6 | 기존 `inspectionLesson`(v1)과 런타임은 T5-3까지 그대로 두고 v2는 별도 파일 | 런타임 회귀 위험을 T5-3으로 분리 | 사용자 승인 2026-10-05 |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| F1 | C1,C5 | V1 | tests |
| F2,F3 | C3,C4,C6 | V2 | tests |
| F4,F6 | C7,C8 | V3 | tests |
| F5 | C9 | V4 | tests |
| F7 | C10 | V5 | tests |
| F8 | — | V6 | npm run verify |
| F9 | C2 | V7 | tests + R1 |
| Q3,Q4 | C11 | V8 | tests |
| Q5 | — | V9 | npm run verify |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| V1–V9 | 3 | tests/contracts-v2.test.mjs, tests/fixtures/contracts-v2/ (129 cases), ledger 4–8 | accepted | verifier 2 PASS; M1·M2·M3 검출 | 없음 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | npm run verify: line coverage 99.71% (<100%), contracts/model.mjs 미실행 분기 | binding의 malformed 선언 동작이 spec에 미선언 | spec v3: Errors·V4 항목 추가, 테스트 보강 | 해결: contracts/model.mjs line 100% |
| 2 | F8 예외 4건 기존 테스트 수정이 test-implementer 권한 검사로 차단 | 공유 자원 수정 분류 | 사용자 지시로 main이 직접 적용(version 2→3, manifest id 3개 개명) | 해결 |
| 3 | npm run verify 1회 knowledge/store.mjs:79-80 미실행으로 99.88% | 기존 T4 코드의 실행 순서 의존 coverage(이번 변경 무관, store.mjs diff 0) | 재실행 2회 | 2회 모두 exit 0, 56 e2e 통과. 비결정성은 미해결 관찰로 남김 |
| 4 | R1 리뷰 | — | oracle.json 7 case를 tests/fixtures/simulation/cases.mjs calculationCases 대응 항목과 대조 | baseline-a·population-contrast·candidate-b·transfer(V1.fresh)·no-defects-no-false-positives·no-detection·corner.100.100.100 모두 최대 차이 0, null 일치 |
| 5 | verifier 1: retry. B1(scale≤0 RANGE 미검증, V2), B2(oracle absolute<0 RANGE 미검증, V3); 권고 A1–A5 | main의 test-implementer 지시가 해당 항목을 선택 사항으로 표현(test 지시 결함) | 테스트 3건 추가(V2.f3.scale-zero/-negative, V3.f4.absolute-negative), V2.f3·V8 exact 단언으로 강화. A4: git diff tests/ 기존 파일은 F8 4건(contracts id 3 + knowledge 1)만. A5: verify의 coverage include가 contracts/*.mjs·examples/manufacturing-inspection/*.mjs 포함 | npm run verify exit 0 (2689 node, 56 e2e, line/function 100%) |
| 6 | 변이 M1 range: positive/nonNegative 범위 검사 제거 | — | seed backup→주입→contracts 테스트→restore | 7 fail(V2.absolute.minus, V2.f3.scale-zero/-negative, V3.f4.absolute-negative 등) 검출 |
| 7 | 변이 M2 version: 모르는 숫자 version을 v2 규칙으로 처리 | — | 동일 | 10 fail(CH-V1.version.lesson.0/1.5/3, V1.version-*) 검출 |
| 8 | 변이 M3 oracle coverage: max 경계 검사 제거 | — | 동일 | 4 fail(V3.cover.*.max.absent 3 + 1) 검출. restore 확인 |
| 9 | verifier 2: PASS, blocking 없음. 권고 A-1(oracle absolute 검사를 case 0에만), A-2(일부 prefix 단언), A-3(store.mjs coverage 비결정성), A-4(diff 기록) | — | A-4: `git diff --stat tests/` =  tests/fixtures/contracts/cases.mjs     /  4 ++--; tests/fixtures/contracts/manifest.json / 12 ++++++------; tests/knowledge.test.mjs               /  2 +-; 3 files changed, 9 insertions(+), 9 deletions(-); | 완료. A-1–A-3은 advisory로 미해결 유지 |