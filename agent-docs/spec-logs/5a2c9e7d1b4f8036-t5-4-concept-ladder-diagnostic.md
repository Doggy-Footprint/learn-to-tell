---
version: 2
run_id: 5a2c9e7d1b4f8036
status: complete
base_commit: 2c6e7781f67d2a95f4e2c6f0b4ee81c460bbcc4f
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| I1 | 사용자(학습자) | 낯선 용어가 바로 나오는 상황 카드 대신, 이 프로젝트·질문·상황에 필요한 개념을 설명받고 "아는지"를 묻는 방식으로 시작한다. 알면 다음 단계 개념, 모르면 아래 단계 개념으로 이동해 학습 수준을 정한다 | SKILL.md 2단계가 개념 사다리 탐색 후 수준이 정해진 개념에 대해서만 상황 카드 반응을 받는 흐름이다 |
| I2 | 사용자 | 학습 수준이 정해진 뒤 기존처럼 상세 질문으로 그 개념을 어느 정도 아는지 판별한다 | 상세 질문 반응이 기존 `reactions`로 기록된다 |
| I3 | 사용자·map | 사다리 응답이 진단 기록에 남는다 | diagnostic v2가 필수 `ladder`를 담고 place-diagnostic·import가 통과한다 |

# Scope
In scope: diagnostic v2 계약에 필수 필드 `ladder` 추가(기존 v2 문서의 migration은 하지 않음, 사용자 결정 2026-10-07: 사용 이력 없는 프로젝트); SKILL.md 2단계와 reference.md diagnostic 절의 재작성; 이에 따른 테스트·픽스처 갱신.
Out of scope: v1 diagnostic 변경; lesson·map·result 계약 변경; 수업 화면 시각화 개선(별도 작업, handoff·ROADMAP에 기록); candidate와 ladder 개념의 연결 필드; 사다리 응답의 일관성(단조성) 검사; 대화 자체의 자동 실행 검증.

# Paths
Implementation: contracts/definitions.mjs, contracts/index.mjs, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/reference.md
Tests: tests/contracts.test.mjs, tests/contracts-v2.test.mjs, tests/authoring.test.mjs, tests/lesson-cli.test.mjs, tests/knowledge.test.mjs, tests/skill-docs.test.mjs, tests/fixtures/
Test command: `npm run verify`
Review evidence: none — 문서 정합은 tests/skill-docs.test.mjs가 문자열 조건으로 자동 검증하고, 대화 흐름의 자연스러움은 사용자가 실제 실행으로 확인한다(범위 밖)

# Signatures
`ladderItem = {step: integer, conceptId: id, label: string, answer: 'known'|'vague'|'unknown', askedBack: string|null}`
`diagnostic` v2 = 기존 v2 필드 + `ladder: ladderItem[]`(길이 1–5, 필수). v1은 변경 없음
`validateDocument(doc, 'diagnostic')` — v2에서 `ladder` 의미 검사 추가

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| R1 | `ladderItem` 필드 형식: `step` 정수, `conceptId` id 형식, `label` 문자열, `answer` 3값 중 하나, `askedBack` 문자열 또는 null. 알 수 없는 필드는 `UNKNOWN_FIELD` | must | I3 |
| R2 | v2 `ladder`는 길이 1–5 배열이다. 빈 배열은 `RANGE /ladder`, 6개 이상은 `LIMIT /ladder`(기존 `candidates` max·`reactions` min과 같은 계약 코드) | must | I3, 사용자 승인 |
| R3 | `step`은 1 이상 5 이하다(위반 시 `RANGE /ladder/<i>/step`). `step` 중복은 `DUPLICATE /ladder/<i>`, `conceptId` 중복도 `DUPLICATE /ladder/<i>` | must | I3 |
| R4 | v2 문서에 `ladder`가 없으면 `REQUIRED /ladder`. v1 문서에 `ladder`가 있으면 `UNKNOWN_FIELD /ladder` | must | 사용자 결정(migration 생략) |
| R5 | `reactions`·`hypotheses`·`candidates` 규칙은 변경하지 않는다. place-diagnostic과 import는 `ladder`가 있는 v2를 기존 경로·원자성·CONFLICT 규칙으로 처리한다 | must | I2, I3 |
| R6 | SKILL.md 2단계는 다음 흐름이다. (a) agent가 사용자의 프로젝트·질문·상황에서 결정에 필요한 개념을 낮은 수준부터 높은 수준 순서의 3–5단 사다리로 만든다. (b) 각 개념을 의미와 이 상황에서 왜 필요한지, 한 줄 예시와 함께 설명한 뒤 "알아요 `known` / 들어봤지만 설명은 어려워요 `vague` / 몰라요 `unknown`"으로 묻는다. (c) 중간 단계에서 시작해 `known`이면 위, `unknown`이면 아래로 이동하고(`vague`는 `unknown`처럼 아래로 이동), 최대 5문항이다. (d) 아는 개념 바로 위의 모르는 개념을 학습 수준으로 확정한다. 전부 알면 최상단, 전부 모르면 최하단. (e) 확정된 수준의 개념에 대해서만 상황 카드를 한 번에 하나씩, 최대 3장, 최대 2라운드로 `similar`/`surprising`/`unknown`/`not-applicable` 반응을 받는다. (f) 후보 제시·선택·`$W/diagnostic.json` 작성·`place-diagnostic`은 기존과 같다. 사다리 응답은 `ladder`에, 카드 반응은 `reactions`에 기록한다 | must | I1, I2 |
| R7 | reference.md diagnostic v2 절은 `ladder` 필드와 위 제약을 포함하도록 재작성된다(기존 문장을 이어 붙이지 않고 절 전체를 다시 쓴다) | must | I3, 사용자 지시 |
| R8 | 위 변경 외 기존 동작은 유지되고 `npm run verify`의 커버리지 게이트(100% lines/functions)가 유지된다 | must | 기존 verify |

# Errors
- ladder 필드·길이·step 범위·중복·누락 위반(R1–R4): `validateDocument`가 `{ok:false, errors:[{code,path}]}` — 문서·파일 변경 없음.
- place-diagnostic에 위 오류 문서: `INVALID` outcome(exit 1) — 파일 미생성.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | v2 diagnostic, ladder 3개(step 1–3, answer가 known·vague·unknown 각 1, askedBack 문자열·null 혼합) | `ok`, errors `[]` |
| C2 | normal | ladder가 있는 v2를 place-diagnostic 배치 후 lesson·result import | placed, `imported` |
| C3 | normal | v1 diagnostic(ladder 없음) | `ok` |
| C4 | boundary | ladder 길이 1 / 5 | `ok` |
| C5 | boundary | ladder `[]` / 길이 6 | `[]`은 `RANGE /ladder`, 길이 6은 `LIMIT /ladder` |
| C6 | boundary | step 0, 1, 5, 6 | 0·6은 `RANGE /ladder/<i>/step`, 1·5는 ok |
| C7 | error | step 1.5 / `"1"` | `VALUE` / `TYPE` `/ladder/<i>/step` (기존 integer 규칙 코드) |
| C8 | error | answer가 3값 밖 문자열 | `VALUE /ladder/<i>/answer` |
| C9 | error | askedBack 숫자 / 누락, label 누락, 알 수 없는 키 | `TYPE` / `REQUIRED` `/ladder/<i>/…`, `UNKNOWN_FIELD` |
| C10 | error | step 중복, conceptId 중복 | `DUPLICATE /ladder/1` 각각 |
| C11 | error | conceptId가 id 형식 위반 | 형식 위반 error |
| C12 | error | v2에 ladder 누락 / v1에 ladder 존재 | `REQUIRED /ladder` / `UNKNOWN_FIELD /ladder` |
| C13 | error | place-diagnostic에 step 중복 문서 | `INVALID` outcome exit 1, 파일 미생성 |
| C14 | edge | step이 1,3,5처럼 비연속 / items 순서가 step 역순 | `ok` (A1) |
| C15 | edge | answer가 모두 `known` / 모두 `unknown` | `ok` (A2) |
| C16 | edge | SKILL.md·reference.md 텍스트 | R6·R7의 존재·부재 문자열 조건 충족 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 계약 확장의 정확성 |
| Performance efficiency | no | 크기가 5개로 제한된 문서, 성능 영향 없음 |
| Compatibility | yes | v1 diagnostic과 ladder 없는 기존 흐름이 아닌 `reactions`·`hypotheses` 호환 유지 |
| Interaction capability | no | 대화 흐름 체감은 사용자 실행 확인으로 이관, UI 변경 없음 |
| Reliability | yes | 배치 원자성·CONFLICT 유지 |
| Security | no | 새 외부 입력 경로 없음 |
| Maintainability | yes | 커버리지 게이트 유지 |
| Flexibility | no | 설치·이식 변경 없음 |
| Safety | no | 해당 위험 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Compatibility / interoperability | v1 diagnostic이 import 경로에서 계속 수용됨 | v1 픽스처로 importResult 실행, 성공 수 / 시도 수 | =100% | automated, mutation | R4 |
| Q2 | Reliability / maturity | `ladder` 포함 v2 배치 실패(rename 실패 주입) 시 상태 | 기존 fault 케이스를 ladder 포함 v2 문서로 실행, 생성·변경된 파일 수 | =0 | automated | 기존 T5-2 S1 |
| Q3 | Maintainability / testability | 측정 대상 소스의 라인·함수 커버리지 | `npm run verify` 내 node coverage, include 목록 기존 그대로 | lines =100, functions =100 | automated | package.json |
| Q4 | Functional suitability / correctness | 기존 스위트 | `npm run verify` 종료 코드와 실패 수 | exit 0, 실패 0 | automated | R8 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O1 | R1,R2,R4 / C1,C3,C4,C5,C7,C8,C9,C11,C12,C15 | `validateDocument(doc,'diagnostic')` v1·v2 | unit, 열거한 항목 전부 | 분류 트리 + 2값 경계값 분석 | 필드 {step, conceptId, label, answer, askedBack, unknownKey}×유효/무효 값, ladder 길이 {0,1,5,6}, 유무×version {v1 유,v1 무,v2 유,v2 무} | 100% | errors 코드·경로가 Cases와 일치 | tests/contracts-v2.test.mjs |
| O2 | R3 / C6,C10,C14 | 같은 함수, 의미 검사 | unit | 분류 트리 + 2값 경계값 분석 | step {0,1,5,6}, step 중복, conceptId 중복, 비연속·역순 | 100% | errors | tests/contracts-v2.test.mjs |
| O3 | R5 / C2,C13 | place-diagnostic API + CLI, importResult | integration | 시나리오 | 시나리오 2(배치→import, 오류 문서 배치 거부) | 100% | outcome 코드, 파일 존재 | tests/authoring.test.mjs, tests/lesson-cli.test.mjs, tests/knowledge.test.mjs |
| O4 | R5,R4 / Q1,Q2 | v1 import, ladder 포함 v2 배치 fault 주입 | integration | 시나리오 | 시나리오 2 | 100% | Q1·Q2 척도 | 위 테스트 파일들 |
| O5 | R8 / Q3,Q4 | 전체 스위트와 커버리지 | unit/integration/e2e | 구조 기반: 문장·함수 커버리지(node test coverage) | include 파일의 라인·함수 | 100% | `npm run verify` exit 0 | 명령 출력 |
| O6 | R6,R7 / C16 | SKILL.md, reference.md 텍스트 | unit(문서 검사) | 분류 트리 | 존재 문자열 {SKILL: `ladder`, `사다리`, `known`, `vague`, `unknown`, `5문항`, `reactions`, `place-diagnostic`, `한 번에 하나`, `2라운드`, `$W/diagnostic.json`; reference: `ladder`, `reactions`, `askedBack`, `vague`}, 기존 부재 문자열(build-diagnostic 계열 5종) 유지 | 100% | 문자열 조건 | tests/skill-docs.test.mjs |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | step 값의 연속성·items 순서는 검사하지 않는다(적응형 이동이라 방문 순서와 step이 다를 수 있다) | 사다리 위치(step)와 질문 순서는 다른 정보다. 잘못된 step 입력을 잡지 못한다 | 승인 필요 |
| A2 | answer 일관성(known 위가 unknown이어야 함 등)은 검사하지 않는다 | 사용자 응답은 모순될 수 있고 기록은 관찰이다 | 승인 필요 |
| A3 | candidate와 ladder 개념 사이의 참조 필드는 추가하지 않는다. 앞서 제안한 "선택 후보의 개념이 ladder에 있어야 함" 검사는 candidate에 개념 필드가 없어 정의할 수 없으므로 포함하지 않는다 | 연결이 필요하면 후속 작업에서 candidate 확장으로 다룬다 | 승인 필요 |
| A4 | `vague`는 사다리 이동에서 `unknown`처럼 아래로 간다. 기록은 구분한다 | "설명할 수 없는 지식"은 학습 수준 결정에서 기초 보강 대상이다 | 승인 필요 |
| A5 | 사다리 길이 최대 5는 문항 수 제한(5문항)과 같다. 사다리 후보 개념은 3–5단으로 만들고 응답 항목은 질문한 개념만 기록한다 | 사용자 승인 제안안 | 승인됨(제안안) |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| R1 | C1,C7,C8,C9,C11 | O1 | contracts-v2 test |
| R2 | C4,C5 | O1 | contracts-v2 test |
| R3 | C6,C10,C14 | O2 | contracts-v2 test |
| R4 | C3,C12 | O1,O4 | contracts-v2, knowledge test |
| R5 | C2,C13 | O3,O4 | authoring·lesson-cli·knowledge test |
| R6 | C16 | O6 | skill-docs test |
| R7 | C16 | O6 | skill-docs test |
| R8 | — | O5 | npm run verify |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 1 |
| verifier invocations | 2 |
| open finding ids | none (F-T54L-1 closed by verifier 2) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| O1,O2 | 2 | verifier 2; fix adds `<case>@2` variants | accepted | M1 (step range only for index 0) green before fix, detected after fix | shared helper ladderField/stepsOf changed |
| O3–O6 | 2 | verifier 1 and 2 | accepted | M2 (step max 6) and M3 (no conceptId duplicate) detected by T54L-O2.step-6, T54L-O2.dup-conceptId, T54-O3 cases | fixture manifest rows only added |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | verifier 1 F-T54L-1: item-level invalid cases only at /ladder/0 | single-item helper pattern | mutation M1 (range check only index 0) stayed green; added `@2` variants for 12 rows | resolved; M1 now detected; verify green (flakes seen: values.spec V5.S3.reload and serve O3.size EPIPE once each, 0/15 isolated, unchanged files) |

# Version Log
## v1
- 초안. 사용자 결정 2026-10-07: 개념 사다리(알면 위, 모르면 아래) 후 상세 질문 흐름, 스키마에 ladder 필드 추가·migration 생략, 시각화는 이번 범위 밖(handoff·ROADMAP에 기록). 제안안 승인 후 A3(후보-개념 연결 검사 제외)가 새로 생겼다.
## v2
- R2·C5: 길이 위반 코드를 `RANGE`(0개)·`LIMIT`(6개 이상)로 명시. 테스트 작성자의 spec challenge(코드 미명시)에 대해 기존 계약 관례를 확인해 정함. 동작 변경 없음.
- 종료: verifier 2 pass. 비차단 권고 A-T54L-2(배치→import 연쇄 테스트 없음), A-T54L-3(문서 문자열 검사 약함). 미실행 mutation 부류: 버전별 ladder 존재 규칙 반전.
