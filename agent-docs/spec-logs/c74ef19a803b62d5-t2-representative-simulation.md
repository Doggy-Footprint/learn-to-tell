---
version: 4
run_id: c74ef19a803b62d5
status: complete
base_commit: 5cf9014b9bc05965b142f58bc8875b2dbd6fb0e9
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| U1 | 사용자 | T2 완료 계획을 구현 | 고정 계산 모델·한국어 대표 수업·독립 기대값·rubric과 완료 증거 제공 |

# Scope
In scope: 승인된 T2 계획 전체. 10,000개 제조 결함 검사 모델, 세 비율 입력, 별도 모델 선언과 T1 연결 검증, 한국어 18분 수업, 분리된 평가 기준, 독립 테스트·콘텐츠 검토·mutation·verifier.
Out of scope: Observable 설치·화면·시각화·수업 진행 상태 관리, 응답 수집·채점 실행, 파일 내보내기·map 저장, 자료 생성 skill, 교육 효과 입증. T1 v1과 기존 공개 API·fixture는 변경하지 않는다.

# Paths
Implementation: examples/manufacturing-inspection/model.mjs, examples/manufacturing-inspection/lesson.mjs, examples/manufacturing-inspection/assessment-guide.mjs
Tests: tests/simulation.test.mjs, tests/fixtures/simulation/
Integration (main only): package.json; this spec and ROADMAP.md completion status.
Test command: npm run verify
Review evidence: 이 spec의 Execution ledger에 R1 계산 근거, R2 콘텐츠·분량·평가, R3 브라우저 호환·부작용 검토와 M1–M3 mutation 결과 기록. 검토 절차는 V5에 고정한다.

# Signatures
model.mjs: export const inspectionModel; export function calculateInspection(inputs); export function validateSimulationBinding(model, lesson).
lesson.mjs: export const inspectionLesson; export const inspectionScenarios.
assessment-guide.mjs: export const inspectionAssessmentGuide.

## Public shapes
Inputs = {defectPercent, detectionPercent, falsePositivePercent}. 각 값은 유한 number [0,100], 정밀도 자릿수 제한 없음. 추가 필드는 거부한다.
Calculation success = {ok:true,value:{sampleSize:10000,truePositive,falsePositive,falseNegative,trueNegative,positiveCount,positivePredictiveValue,accuracy}}. 모든 비율 출력은 [0,1]; positivePredictiveValue만 null 허용. 숫자 표시 formatter는 T3 범위다.
Calculation failure = {ok:false,errors:[{code,path}]}. Binding success = {ok:true,errors:[]}; failure = {ok:false,errors:[{code,path}]}.
모든 오류는 code와 JSON pointer path만 담고 code, path 순으로 정렬·중복 제거한다. caller 오류는 throw하지 않는다.
Model = {modelId:'manufacturing-inspection',modelRevision:1,sampleSize:10000,simulationContentId,inputIds:{defectPercent,detectionPercent,falsePositivePercent}}. 참조 값은 T1 ID 형식. 세 inputId는 서로 다르다. 위 필드 외 필드는 거부한다.
inspectionModel은 inspectionLesson의 실제 simulation 콘텐츠와 세 NumericInput에 연결된다. 각 연결 입력의 unit='%', min=0, max=100, default는 각각 1,90,5다.
Binding은 모델 구조를 검증한 후 lesson.content / lesson.inputs의 연결을 검증한다. T1 전체 검증을 대체하지 않는다. 유효 T1 lesson에서 콘텐츠·입력 참조 누락, 콘텐츠 role 불일치, 단위·범위·기본값 불일치, 입력 중복 연결을 거부한다. lesson에는 별도 입력·콘텐츠가 있어도 허용한다.
inspectionScenarios는 [{scenarioId,inputs}]이며 scenarioId는 'baseline-a', 'population-contrast', 'candidate-b'다. 새 사례의 질문용 입력은 Lesson에, 기대값·모범 응답은 assessment-guide에만 둔다.
inspectionAssessmentGuide = {lessonId,lessonRevision,rubricId,rubricVersion,transferCase:{inputs,expected},criteria:[{criterionId,dimension,mode,rule,examples:{supported,partial,not_demonstrated},pending,skipped}],hints:[{level,text}],feedback:{matched,mismatched}}. 모든 예시·힌트·피드백은 한국어다. transferCase.expected는 계산 success의 value 형태다. guide의 참조·모드·rule은 Lesson rubric과 일치한다.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| F1 | N=10000, p=defectPercent/100, s=detectionPercent/100, f=falsePositivePercent/100. TP=Nps, FP=N(1-p)f, FN=Np(1-s), TN=N(1-p)(1-f), positiveCount=TP+FP, PPV=TP/(TP+FP), accuracy=(TP+TN)/N. 예상 개수 소수와 원시값 보존; positiveCount=0이면 PPV=null | must | 승인 계획 |
| F2 | 세 입력의 엄격 검증과 오류 분리; 보정·반올림·형변환 없음; getter 실행·입력 변경 없음; 반복 호출 결정적 | must | 승인 계획 |
| F3 | 모델 선언으로 simulation 콘텐츠와 세 입력 참조 및 단위·범위·기본값 검증; T1 v1 유지 | must | 승인 계획 |
| F4 | 한국어 실제 Lesson: 개념 5개(결함 비율·검출률·오탐률·PPV·전체 정확도), 결정 2개(검사 A/B 선택, 양성의 자동 조치/추가 확인/보류); 각 결정에 다섯 content role 연결; 여섯 필수 stage 예상 시간 2/1/6/5/2/2분 | must | 승인 계획·ROADMAP |
| F5 | 기본 A(1,90,5), 집단 대비(10,90,5), B(1,80,1), 새 사례(2,80,2); 검사 A/B의 누락·오탐 tradeoff, 모르는 오류 비용·추가 검사 성능·독립성을 질문으로 남기고 합리적 보류 인정 | must | 승인 계획 |
| F6 | 다섯 rubric dimension 모두 포함. prediction-model은 수치 자동 확인 기준(mode=automatic), 나머지는 자유 응답 검토(mode=agent); 검토자는 별도 guide에서 판단 기준·성공/부분/미확인 예시 확인. 도움·관찰 조건 보존, 미검토 pending, 건너뜀 skipped, 계산 실패를 이해 부족으로 채점하지 않음 | must | 승인 계획·T1 |
| F7 | 전체 정확도와 PPV의 혼동, 다른 집단 수치 전용 오류, 예상값과 실제 표본의 차이, 입력 조건과 현실 결정 변수 구분, 가상 수치·가정·한계·계산 출처 명시. 최초 예측 보존·새 사례 결과 선공개 금지 지침, A+B 피드백·핵심 선택 1건 찬반 대칭 비교·단계별 힌트 | must | 승인 계획·ROADMAP |
| F8 | 테스트 oracle은 구현과 독립적. 단일 verify로 기존 T1와 T2 사례·행/함수 coverage 검증. pure browser-compatible ESM, 외부 의존성·파일·네트워크·eval·난수 없음 | must | 승인 계획 |

# Errors
누락 필드: REQUIRED; 잘못된 타입·비유한 숫자·accessor·symbol property·비평문 객체: TYPE; 범위 밖·고정 총수/입력 메타데이터 불일치: RANGE; 추가 필드: UNKNOWN_FIELD.
모델 ID 불일치: KIND; 모델 revision!=1: VERSION; 잘못된 참조 ID 문자열·unit: VALUE; 누락/잘못된 role 참조: REFERENCE; 모델 inputId 중복 연결: DUPLICATE.
calculateInspection path는 /<field>, root ''. Binding 모델 path는 /model/<field> 또는 /model; lesson 오류는 /lesson/content 또는 /lesson/inputs와 항목/필드 pointer. missing simulation reference는 /model/simulationContentId, missing input reference는 /model/inputIds/<field>; role mismatch도 /model/simulationContentId.
타입·구조 실패 후 종속 의미 검사는 실행하지 않는다. 독립 필드 오류는 함께 수집한다. 모든 실패 후 원본과 getter 호출 수는 그대로이고 성공 value는 없다.
Binding의 잘못된 lesson root/content/inputs·항목·필요 필드도 TYPE/REQUIRED로 반환하며 예외를 던지지 않는다. 이 API가 읽는 모든 사용자 property는 descriptor로 검사하고 accessor를 실행하지 않는다.
오류 pointer 구체화: inputIds 중복은 defectPercent, detectionPercent, falsePositivePercent 순서에서 두 번째 이후 참조 필드에 DUPLICATE를 반환한다. Symbol property는 소속 객체 pointer에 TYPE이다. Binding이 읽는 lesson.content 항목의 필수 필드는 contentId와 role, lesson.inputs 항목의 필수 필드는 inputId, unit, min, max, default다. 누락은 해당 field pointer REQUIRED, 잘못된 타입/accessor는 해당 field pointer TYPE이다. role/contentId/inputId/unit은 문자열, min/max/default는 유한 숫자다. 전체 T1 의미 검증은 별도 validateDocument의 책임으로 유지한다.
모델 선언의 구조·ID·revision·총수·중복 오류가 있으면 이에 종속된 수업 참조·메타데이터 대조를 생략한다. 독립 model/lesson 구조 오류는 수집한다.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | A=(1,90,5) | TP90 FP495 FN10 TN9405 positives585 PPV2/13 accuracy9495/10000 |
| C2 | normal | contrast=(10,90,5) | TP900 FP450 FN100 TN8550 positives1350 PPV2/3 accuracy9450/10000 |
| C3 | normal | B=(1,80,1) | TP80 FP99 FN20 TN9801 positives179 PPV80/179 accuracy9881/10000 |
| C4 | normal | fresh=(2,80,2) | TP160 FP196 FN40 TN9604 positives356 PPV40/89 accuracy9764/10000 |
| C5 | boundary | 각 입력 독립 -0.01,0,0.01,99.99,100,100.01; 다른 입력은 A | endpoint 포함·밖은 RANGE; 0/100 조합 8개 별도 확인 |
| C6 | edge | (0.015,90,5); (0,90,0); (1,0,0); (100,0,5) | 소수 TP1.35 FP499.925 FN0.15 TN9498.575 positives501.275 PPV54/20051 accuracy9499.925/10000; 나머지 세 사례 positives0 PPVnull |
| C7 | error | 각 입력 missing, string, null, boolean, undefined, NaN, ±Infinity, negative, >100; extra; invalid root | 정확한 오류·성공값 없음·입력 보존 |
| C8 | normal | 실제 model와 lesson, 추가 unrelated valid T1 콘텐츠/입력; JSON 왕복 | T1 검증과 binding 성공 |
| C9 | error | model metadata·참조·role·각 unit/min/max/default·중복 inputId 단독 위반; model/lesson malformed/accessor | 지정 오류·입력 보존·getter 0 |
| C10 | normal | Lesson 및 별도 guide | T1 통과, 고정 개념·결정·18분·시나리오·rubric 연결; 콘텐츠 검토 R1–R3 통과 |
| C11 | edge | frozen 입력/모델/수업, 반복 호출, getters/symbol/nonplain roots, 출력 JSON 왕복 | 결정적·불변·getter 0; null 유지 |
| C12 | error | binding 복합 오류5개: modelRevision string+lesson.inputs false; wrong modelId/revision/sampleSize 함께; wrong revision+bound default 불일치; missing modelRevision+missing simulation reference; model/lesson 각각 symbol2개 | 독립 오류 모두 code/path 정렬·중복 제거, 무효 모델의 종속 메타데이터/참조 오류는 없음, 원본 보존 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 정확한 계산·참조·콘텐츠 필요 |
| Performance efficiency | no | T2는 세 스칼라 고정 계산이며 브라우저 지연 목표는 T3에서 측정; 새 성능 임계값 추가하지 않음 |
| Compatibility | yes | 승인 Node/npm·JSON·브라우저 import 가능 |
| Interaction capability | yes | 오류 code/path와 한국어 콘텐츠; UI 접근성은 T3 |
| Reliability | yes | 오류·반복 호출 원본 보존 |
| Security | yes | getter·외부 부작용·원시 입력 노출 방지 |
| Maintainability | yes | 독립 oracle·통합 coverage와 회귀 |
| Flexibility | no | T2는 고정 제조 검사 모델; 범용 플러그인·다른 도메인 지원을 추가하지 않음 |
| Safety | yes | 모델 결과를 실제 조치·숙련·의료 판정으로 오해하지 않도록 가정·보류·평가 제한 명시 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Functional suitability | 계산 기대값·참조 검증 | C1–C11 값 절대 오차와 선언 항목 통과율 | 오차<=1e-9, 항목100% | automated + mutation | 승인 계획 |
| Q2 | Compatibility | Node26.8.1/npm11.19.0, JSON, pure ESM | 기존 toolchain 검사·JSON 왕복, R3 금지 import/API 검토 | 모두 통과; Node 전용/외부 import 0 | automated + review | 승인 계획 |
| Q3 | Interaction capability | 구분 가능한 오류와 18분 한국어 자료 | V2–V5 code/path·구조·R2 검토 항목 통과율 | 100% | automated + review | 승인 계획 |
| Q4 | Reliability | 성공·실패·반복의 불변성 | V1–V3 frozen/deep equality·결정성 | 100% | automated | 승인 계획 |
| Q5 | Security | getter 미실행·오류 입력 미노출·부작용 없음 | accessor spy·오류 key shape, R3 fs/network/eval/random/API 검사 | 호출/원문노출/부작용 모두0 | automated + review | 승인 계획 |
| Q6 | Maintainability | 통합 회귀·독립 기대값·대상 코드 coverage | npm run verify, Node coverage: contracts/*.mjs와 examples/manufacturing-inspection/*.mjs | 선언 항목·실행 행·함수100%; T1 전부 통과 | automated + review | 승인 계획 |
| Q7 | Safety | 한계·보류·평가 의미·새 사례 답 분리 | R2 체크리스트 전 항목과 guide/lesson 참조 검사 | 100% | automated + review | 승인 계획 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | F1,F5,Q1,C1–C6,C11 | 계산 공개 API | unit, 네 사례·경계·소수·미정의 | boundary value analysis (3-value) + combinatorial all combinations | C1–4 모든 value 필드; 세 입력 각 6경계; 0/100 8조합; C6 4사례 | 100% | 오차<=1e-9, PPVnull, 합계10000 | tests 독립 숫자·분수 oracle, 입력 불변·반복 |
| V2 | F2,Q3–Q5,C7,C11 | 입력 검증 API | unit, 각 독립 필드와 구조 | syntax + equivalence partitioning | 세 필드 각각 valid/missing/string/null/boolean/undefined/NaN/+Inf/-Inf; root null/array/scalar/nonplain; extra/symbol/accessor; frozen valid/invalid; 복수 오류 정렬 | 100% | 지정 code/path·getter0·불변·오류 shape | 독립 fixture와 spy/deep equality |
| V3 | F3,Q1–Q5,C8,C9,C11,C12 | binding API | unit + integration, 단독 위반 및 기존 Errors 정책의 C12 복합5사례 | decision table + syntax | model 각 필수 필드 valid/missing/type/extra; modelId/revision/sampleSize valid/invalid; 각 inputId existing/missing/invalid/duplicated; content existing/missing/wrong role; 각 세 입력 unit/min/max/default 일치/불일치; lesson root/collection/item/필요필드 malformed/accessor; extra unrelated valid 입력·콘텐츠; JSON/frozen/repeat; C12 독립 구조/선언 오류 수집2사례·무효 모델의 종속 검사 생략2사례·동일 pointer 오류 중복제거1사례 | 100% | 지정 성공/오류, getter0·원본 불변·정렬/중복제거·종속 오류 없음 | T1 validateDocument와 별도 binding, 독립 fixture |
| V4 | F4–F7,Q1,Q3,Q7,C10 | 고정 Lesson·guide | integration, 실제 exports | scenario | T1 통과; 5개 개념·2개 결정·각5role; 필수 stage 6개 minutes[2,1,6,5,2,2]; 시나리오3개와 fresh 입력; guide 5차원 각 참조·모드·rule 및 3예시/pending/skipped; 기대값 C4·JSON 왕복 | 100% | 실제 콘텐츠와 평가 연결·18분·기대값 일치 | 자동 구조 검사 + R2 내용 검토 |
| V5 | F7,F8,Q2,Q5–Q7,C10,C11 | 원리·교육 자료·통합 명령 | integration + review | scenario + statement coverage | R1 수식·공식 출처와 C1–4 독립 산술 대조; R2 아래 체크리스트; R3 아래 체크리스트; T1 회귀·Node line/function coverage·테스트 fixture 항목 누락 거부 | 100% | 모든 검토 통과·verify exit0·누락/coverage 부족 exit!=0 | main ledger R1–R3, manifest completeness와 coverage 보고서 |

R1: 공식 MedCalc PPV 정의(https://www.medcalc.org/en/manual/roc-curve-analysis-predictive-values.php)·ROADMAP 부록과 수식 대조. C1–4 및 accuracy의 독립 산술 확인. 실제 통계 표본·신뢰구간으로 주장하지 않는지 확인.
R2: Lesson·guide를 읽고 (1)다섯 개념과 조건/선택 구분 (2)두 결정의 5role 연결과 A/B tradeoff (3)accuracy/PPV 혼동·다른 집단 전용 실패 (4)예상 소수 개수·실제 표본 차이·PPVnull (5)가상 수치·고정 N·검사 성능 유지 가정·출처 (6)비용·추가 검사 성능/독립성 질문과 보류 인정 (7)예측 먼저 보존·새 사례 질문과 기대답 분리 (8)다섯 평가 차원의 근거/관찰 조건/도움·pending/skipped·계산 실패 분리 (9)A+B 사실/지지 표현·핵심 결정 1건 찬반 비교·단계적 힌트 (10)여섯 stage 18분 자료 검토를 각각 기록. 분량 검토는 설계 예산 확인이며 실제 학습 시간·교육 효과 검증은 T3 이후.
R3: production imports가 상대 ESM뿐이고 fs/Buffer/process/node:/외부 URL/fetch/eval/random/전역 DOM 의존이 없는지 검토. 모델/수업에 파일·네트워크·map 변경·채점 실행 없는지 확인. tests가 구현을 이용해 기대값을 계산하지 않는지 확인.
Branch/MC/DC/data-flow·무작위/성능·브라우저 end-to-end는 요구하지 않는다: 유한 경계·참조·오류 표와 100% 실행 행/함수, 콘텐츠 검토로 이번 고정 모델을 검증하며 화면은 T3 책임이다.

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | M1 자료까지, 고정10000·퍼센트·T1 밖 별도 모델 계약 | 사용자 선택; 전 도메인/교육 효과 검증 아님 | 계획 질문 답변 및 Implement the plan |
| A2 | 소수 허용·엄격 검증·PPVnull·오차1e-9·선언/행/함수100% | 사용자 선택 | 계획 질문 답변 및 Implement the plan |
| A3 | A/B/fresh 고정, rubric만·채점 후속, 한국어18분 | 사용자 선택·ROADMAP | 계획 질문 답변 및 Implement the plan |
| A4 | 필드/exports/오류 pointer는 위 API로 계획의 인터페이스를 구체화; T1 모델 연결은 별도 교차 검증 | 기존 T1 검증과 approved error shape 사용, 새 제품 범위/품질 임계값 없음 | 승인 계획 구현 요청 |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| U1,F1 | C1–C6,C11 | V1,V5 | 자동 oracle·R1·mutation M1/M2 |
| F2 | C7,C11 | V2 | 오류·불변·spy |
| F3 | C8,C9,C11,C12 | V3 | 교차 검증·mutation M3·복합 오류 정책 |
| F4,F5,F6 | C1–C4,C10 | V1,V4,V5 | 수치·구조·R2 |
| F7 | C10 | V4,V5 | R1/R2 |
| F8,Q6 | C1–C12 | V1–V5 | verify·coverage·manifest·R3 |
| Q1 | C1–C12 | V1–V5 | 기대값·mutation |
| Q2 | C8,C10,C11 | V3–V5 | JSON·toolchain·R3 |
| Q3 | C7,C9,C10,C12 | V2–V5 | 오류·콘텐츠 |
| Q4,Q5 | C7–C12 | V1–V3,V5 | 불변·spy·R3 |
| Q7 | C10 | V4,V5 | R2 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 4 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state:
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| V1 | 4 | V1 34항목 unchanged, ledger9–14; revision7418e7ecdd5fb91d2a40da7877f14d41f8a83af3e81517ca43becd23c97a42e8 | accepted | verifier2 retained acceptance; helpers/oracles unchanged, v4 labels만 변경, full verify 통과, M1/M2 의도 assertion 검출·정확 복원 | model·tests; 변경 시 영향 재평가 |
| V2 | 4 | V2 43항목 unchanged, ledger9–14; same revision | accepted | verifier2 retained acceptance; helper/oracle/behavior 변경 없음, full verify 통과 | model·tests; 변경 시 영향 재평가 |
| V3 | 4 | V3 125항목 및 actual exports; C12·ledger9–14; same revision | accepted | verifier2 accepted; S2 C12 독립 수집·정렬/중복제거·종속 검사 생략 5개 충분; M3 의도 assertion 검출·복원 | model·lesson·tests; 변경 시 영향 재평가 |
| V4 | 4 | named V4 tests unchanged, R2 ledger6–7 및 ledger13–14; same revision | accepted | verifier2 retained acceptance; public snapshot에서 내용 확인; lesson/guide/구조 helpers unchanged, full verify 통과 | lesson·guide·tests; 변경 시 영향 재평가 |
| V5 | 4 | manifest202·C12 누락 거부; R1/R2/R3 ledger3,6–7 및 ledger9–14; package verify; same revision | accepted | verifier2 accepted; 새 inventory·coverage·T1 회귀·검토·3mutations 충분, S2 closed | 전체 자료·package; 변경 시 영향 재평가 |

Execution ledger:
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | 시작 | 기존 T1 완료·활성 spec 없음 verified | 승인 계획과 사용자 구현 요청을 spec v1으로 구체화 | 구현/독립 테스트 분리 배정 |
| 2 | V3 오류 위치 해석 차이 예방 | 중복/symbol pointer·binding 필수 필드 상세 표현 부족 verified | 구현 전 v2 명시·두 역할에 전체 spec 재지정 | 기능·품질 기준 변경 없음; correction batch 1 |
| 3 | R1 독립 기대값 산술 | 계산 oracle의 독립성 필요 verified | Python Fraction으로 A/contrast/B/fresh TP·FP·FN·TN, PPV, accuracy 산술 대조 | counts 90/495/10/9405,900/450/100/8550,80/99/20/9801,160/196/40/9604; PPV 2/13,2/3,80/179,40/89; accuracy1899/2000,189/200,9881/10000,2441/2500. 공식 MedCalc PPV 정의는 TP/(TP+FP)와 일치; 구현 대조는 pending |
| 4 | S1 C6 소수 기대값이 F1과 모순 | main의 소수 사례 산술 오류 verified; 기존 spec FP499.9925/TN9499.8575로 합계10001.35 | Fraction('0.015')/100으로 독립 계산, TP1.35/FP499.925/FN0.15/TN9498.575, positives501.275 PPV54/20051 accuracy9499.925/10000, 합10000 확인; v3 수정·두 역할 재지정 | 승인 계획의 공식·입력·오차 정책 유지; 기대값 오류 정정. 종속 model binding 검사 정책도 명시; correction batch2 |
| 5 | 최초 통합 검증 | 구현·테스트 분리 후 실제 연결 verified | npm run verify, log /private/tmp/learn-to-tell-t2-verify.log | 1957/1957 통과; contracts와 production3개 모두 line/function100%; 독립 manifest V1=34/V2=43/V3=120 |
| 6 | R2 콘텐츠 수정 C-R2 | product text에 구현 단계가 노출되고 A→B가 개별 입력1개 변경처럼 읽힐 수 있음 verified | lesson에서 구현 설명 제거, 사용자 저장 상태 확인 안내, 검사 후보 변경은 두 성능 입력 동시 변화라고 명시; implementer만 lesson 수정·Tests 격리 유지 | correction batch3; V4/V5 콘텐츠·실행 증거 갱신. V1–V3 계산/오류/참조와 tests/helpers는 변경 없음, 기존 통과 영향 없음 |
| 7 | R1–R3 final pre-audit | 검토 증거 필요 verified | npm run verify final-preaudit log; 아래 R1–R3 개별 체크; exported public surfaces JSON /private/tmp/learn-to-tell-t2-surfaces.json | 1957/1957 통과, 대상 실행 행·함수100%; evidence revision8ac8a01ede86e8e1c1fe0b63a355c5b6d3a82f049980e6a1fd22c85a5579253a; verifier invocation1 배정 |
| 8 | verifier1 S2 검증 선택 누락 | binding 독립 오류 수집·정렬/중복제거·무효 모델의 종속 검사 생략 정책은 기존 Errors에 있지만 단독 오류 사례로만 검증됨 verified | spec v4 C12 대표5사례로 기존 정책 추적 보완, 독립 test 담당 재지정; 기능·오류 정책·품질 threshold 변경 없음 | V1/V2/V4 primary evidence accepted, V3 S2 open, V5 global coverage invalidated; correction batch4; 테스트 변경 후 영향 평가·full verify·mutation·verifier2 필요 |
| 9 | S2 evidence correction | V3 선택 누락 verified | 독립 test 담당이 C12 복합5개, manifest202(V1=34,V2=43,V3=125), v4 labels/evidence-map 보강; 기존197 cases·helpers·수치 oracle unchanged; main 코드/테스트 확인 및 npm run verify | 1962/1962 통과, line/function100%; source behavior/lesson/guide/package 변경 없음. V1/V2/V4 retained, V3/V5 reopened |
| 10 | M1 PPV 분모 결함 주입 | 학습 의미와 직결하는 산술 오류 위험 verified | seed.py backup→주입→실제 API PPV0.009 관찰→full verify→seed.py restore·SHA256 원본 일치 | verify exit1, 18 tests fail; V1.baseline-a intended AssertionError positivePredictiveValue0.009 vs0.15384615384615385; /private/tmp/learn-to-tell-t2-M1.log; detected, restored |
| 11 | M2 양성0을 PPV0으로 반환 결함 주입 | 미정의를 확정 비율로 바꾸는 경계 오류 위험 verified | backup→주입→실제 API zero-positive PPV0 관찰→full verify→restore·SHA256 일치 | exit1, 7 tests fail; V1.no-defects-no-false-positives intended strict assertion 0!==null; /private/tmp/learn-to-tell-t2-M2.log; detected, restored |
| 12 | M3 bound default 불일치 수용 결함 주입 | Lesson/model 연결 무결성 오류 위험 verified | backup→주입→default42 lesson binding이 oktrue 반환 관찰→full verify→restore·SHA256 일치 | exit1, 3 default mismatch tests fail; V3.metadata.defectPercent.default.mismatch expects RANGE /lesson/inputs/0/default but got oktrue; /private/tmp/learn-to-tell-t2-M3.log; detected, restored |
| 13 | 복원 후 최종 검증·영향 감사 | mutation 임시 변경 복원 필요 verified | seed.py status none; npm run verify restored log; git diff --check; evidence hash 재계산 | 1962/1962 통과, 기존T1 1756 유지, T2 206; contracts/production3 전부 line/function100%, full branch97.88%는 비필수. revision7418e7ecdd5fb91d2a40da7877f14d41f8a83af3e81517ca43becd23c97a42e8. Review R1–R3와 public snapshot source unchanged; verifier2 배정, S2 pending audit |
| 14 | verifier2 final pass | 독립 evidence-only 감사 완료 verified | 새 verifier는 fork_turns=none으로 production 컨텍스트 없이 specv4·Tests·검토 ledger·public export JSON·최종/변이 logs만 감사. V1–V5 전부 accepted, S2 오류 수집/생략/중복제거 추적 보강 충분 | blocking findings none; S1 corrected, S2 closed; advisory A1 first-error-only 추가 mutation은 기존 C12 정확 assertion으로 이미 검증되고 선택3mutations 외 보강이므로 미실행·비차단. correction4회, verifier2회, mutations3/3 detected/restored; complete, handoff none |

## Review evidence revision 8ac8a01ede86e8e1c1fe0b63a355c5b6d3a82f049980e6a1fd22c85a5579253a
Revision hashes package.json, sorted production3 modules, sorted tests/fixtures/simulation files, tests/simulation.test.mjs with path+contents in that order. Main read production and test sources; independent roles did not cross-read. Public surface snapshot is generated solely by importing production exports and JSON.stringify, not by copying source.

| review item | inputs and observation | expected result / disposition |
| --- | --- | --- |
| R1 | model p/s/f 퍼센트 conversion·TP/FP/FN/TN·PPV/accuracy formulas; inspection-explanation MedCalc source; C1–C4 Fraction counts/ratios and C6 corrected arithmetic; actual tests compare every numeric field | 승인 공식·독립 기대값 일치, 소수 예상값·null 보존; pass |
| R2.1 | concepts5·lesson-orientation: 각 분모와 입력 조건 vs 현실 검사/조치 선택 구분 | 핵심 개념5개·조건/결정 구분; pass |
| R2.2 | decisions2 each5role, inspection-application: A는10개 추가 검출/396개 추가 오탐; inspection-simulation의 candidate 변화 두 입력 동시 변경 명시 | A/B tradeoff와 참조·조작 해석 정확; pass |
| R2.3 | inspection-failure: A accuracy94.95% vs PPV15.38%; 10% 집단 수치 전용 거부 | 전체 정확도/PPV 혼동·다른 집단 적용 실패 포함; pass |
| R2.4 | action-failure: 소수 TP1.35는 기대 평균, 실제 표본 정수/변동; positiveCount0이면 null, 완벽 검사 아님 | 예상 개수/실제 표본·미정의 설명 정확; pass |
| R2.5 | orientation/explanation/failure: 가상 제조, N10000, 대비 집단에서 성능 유지 가정 확인·원시값 반올림 금지·공식 출처·실제 표본/신뢰구간 아님 | 모델 근거·한계 명시; pass |
| R2.6 | inspection/action application: 누락/오탐 비용·성능·독립성·처리 용량 질문과 이유; 정보 없으면 보류·임의 최적화 거부 | 질문/선택 의미·합리적 보류 인정; pass |
| R2.7 | diagnostic/simulation/assessment: 최초 예측 보존·건너뜀; 새 사례 입력2/80/2만 Lesson에, 160/196/40/9604·40/89 기대값은 별도 guide에 있음 | 새 사례 결과 선공개 금지·전후 구분; pass |
| R2.8 | rubric5차원 + guide 각3예시/pending/skipped; 관찰 조건·help4수준 기록, 최초/공개후 응답 구분, 도구 오류·미검토를 이해 부족/숙련으로 승격 안 함 | 평가 근거·리뷰 모드·도움·오류 의미 보존; pass |
| R2.9 | guide feedback 사실(A)와 지지(B) 구분, B 오탐 감소/누락 증가의 찬반 비교·조건 반전, hints3단계 | 확증·위축 없는 근거 표현·대칭 비교·선택적 도움; pass |
| R2.10 | 필수 stage diagnosis/orientation/exploration/assessment/return/map 2/1/6/5/2/2, 총18; 모든 단계 실제 활동과 읽을 자료 연결 | 18분 설계 분량·계약 검토 pass; 실제 학습 속도/효과/브라우저 소요시간은 미검증(T3 이후) |
| R3.1 | production imports only assessment-guide→relative lesson; model uses pure ECMAScript·own descriptors; no Buffer/process/node:/fs/remote/fetch/eval/random/DOM; import-time data allocation only | 금지 의존/API·외부 부작용0; pass |
| R3.2 | model error objects code/path only, descriptor reads avoid accessor; fixed source no save/export/grading execution; tests use counts/fractions and BigInt population oracle, never production result for expected | getter0·원문 노출0·입력 불변, 독립 oracle; pass |
| R3.3 | verify includes contracts/*.mjs and all production3 modules, tests/*.test.mjs; Node26.8.1/npm11.19.0; no deps added, T1 untouched | toolchain·회귀·전체 line/function100% 및 manifest 누락 거부; pass |

Main mutation selection: M1 wrong PPV denominator targets mathematical meaning despite plausible accuracy; M2 zero-positive→0 targets undefined boundary; M3 accepting input metadata mismatch targets Lesson/model integrity independently of arithmetic. 이 세 클래스는 승인 계획의 가장 강한 서로 다른 실패 위험이며 full verify의 의도한 assertion 검출과 복원 후 통과가 필요하다.

# Version Log
## v1
- 승인된 T2 계획을 실행 계약으로 고정. 사용자가 Implement the plan으로 구현을 요청함.
## v2
- 구현 전 오류 pointer와 binding이 읽는 필수 필드를 명시하여 구현·테스트 간 표현 차이를 제거. 승인 계획의 기능·오류 코드·품질 기준은 변경 없음.
## v3
- 독립 테스트 담당이 발견한 C6 산술 모순을 F1과 독립 Fraction 계산에 맞게 정정. invalid model declaration의 종속 cross-reference 검사 생략을 명시. 승인 계획의 기능·품질 기준 변경 없음.
## v4
- verifier1 S2에 따라 기존 binding Errors 정책의 추적 누락을 C12 복합5사례로 보완. 독립 오류 수집·정렬/중복제거·종속 검사 생략은 v3 동작 그대로이며 새로운 기능·오류 정책·품질 threshold를 추가하지 않음.
