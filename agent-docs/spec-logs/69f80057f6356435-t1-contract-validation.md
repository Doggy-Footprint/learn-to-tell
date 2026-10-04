---
version: 5
run_id: 69f80057f6356435
status: complete
base_commit: 8c148446ed622bc88c3b85773e4763d050b5934b
max_verifier_invocations: 2
handoff: none
---

# User Intent

| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| U1 | 사용자 | 로드맵의 환경·범위를 확정하고 첫 구현 spec을 작성 | ROADMAP에 일반적인 제품 기준을 통합하고 T1의 검토 가능한 spec 제공 |
| U2 | 학습 사용자 | 잘못된 자료와 과대 수행 기록을 수용하지 않음 | 유효한 진단·수업·결과·map은 수용하고 구조·참조·기록 의미 위반은 이유와 위치를 반환 |

이 문서는 사용자 구현 계획 실행 요청으로 전체 승인된 T1 구현 계약이다. 상세 필드·오류 정책·품질 수치·검증 목표를 포함하여 v2에서 승인 상태를 기록했다.

# Scope

In scope: JavaScript ESM 프로젝트 구성, 네 종류의 JSON 계약, 부작용 없는 parser·validator, 문서 간 참조·profile·revision·응답 이력 검사, 독립 정상/경계/오류 fixture, 통합 검증 명령.

Out of scope: T2 계산 모델·계산 oracle·대표 수업 콘텐츠와 채점 rubric의 교육적 검토, Observable 설치·화면 빌드, 브라우저 UI·내보내기, 실제 결과 가져오기와 map 변경, 파일 저장·백업·삭제·복구, 호스트 연결·콘텐츠 생성·자유 응답 채점. T1의 fixture는 계약을 검증하는 합성 자료이며 완성된 대표 수업이 아니다. 지원 환경은 Codex 앱·macOS·Chrome이며 T1은 Node에서만 실행한다.

입력으로 받은 현재 map revision과 결과의 baseMapRevision 일치만 확인한다. 다른 프로세스가 보관 중인 실제 최신 revision, 원자적 저장, 재시작 후 복구와 동일 결과의 실제 중복 가져오기는 T4 책임이다.

# Paths

Implementation: `package.json`, `package-lock.json`, `.node-version`, `.npmrc`, `contracts/index.mjs`, `contracts/definitions.mjs`

Tests: `tests/contracts.test.mjs`, `tests/fixtures/contracts/`

Test command: `npm run verify`

`package.json`은 private ESM package, Node 26.8.1·npm 11.19.0을 실행 기준으로 선언한다. `.node-version`은 26.8.1, `.npmrc`는 engine-strict 설정을 둔다. T1은 외부 runtime·test 패키지를 추가하지 않고 Node 내장 test runner를 사용한다. lockfile은 npm 11.19.0으로 생성한다. Observable Framework 1.13.4 의존성 설치는 실제 소비하는 T3에서 수행하며 버전을 변경하지 않는다.

`verify` script는 `node --test --experimental-test-coverage --test-coverage-include='contracts/*.mjs' --test-coverage-include-all --test-coverage-lines=100 --test-coverage-functions=100 tests/contracts.test.mjs`이다. main이 이 명령으로 Implementation 범위의 행·함수 실행률을 확인한다. 초안 작성 시 Node 26.8.1의 `node --help`에서 위 coverage 옵션의 지원을 확인했다. 구현 실행 시에도 동일 버전을 확인한다. 변경이 필요하면 spec amendment와 승인을 거친다. 전체 명령 timeout은 60초이며 timeout은 실패다.

Review evidence: main의 정적 검수 결과와 실행·mutation·독립 감사 결과는 이 spec의 Execution ledger에 기록한다.

# Signatures

```text
parseDocument(text: string, expectedKind: Kind): ValidationResult
validateDocument(document: unknown, expectedKind: Kind): ValidationResult
validateBundle(bundle: {diagnostic: unknown, lesson: unknown, result: unknown, map: unknown, previousResult: unknown | null}): ValidationResult
Kind = 'diagnostic' | 'lesson' | 'result' | 'map'
ValidationResult = {ok: true, errors: []} | {ok: false, errors: [{code: ErrorCode, path: string}]}
```

파싱·검증 함수는 입력을 수정하거나 정규화하지 않는다. 실패 결과에는 원본 응답·입력 문자열·stack trace를 담지 않는다. `path`는 JSON Pointer이며 bundle 경로는 `/lesson`처럼 문서 이름으로 시작한다. parser의 JSON 구문 오류 위치는 루트 빈 문자열이다. 오류는 code, path 순으로 정렬하고 중복 제거한다. 모든 구조 오류를 수집한 뒤, 구조가 유효한 문서에 대해서만 의미 검사를 수행한다. 구조 위반이 있는 bundle은 문서 간 의미 검사를 생략한다. 단독 Result 검증은 내부 응답·판정·이력 규칙을 검사하되 외부 Lesson과의 참조·rubric mode 검사는 bundle 또는 Map 검증에서 수행한다. 단독 Lesson은 diagnostic의 존재·선택 상태를 요구하지 않고 bundle에서 확인한다. 단독 Map은 포함한 모든 snapshot과 내부 문서 간 참조를 검사한다. 잘못된 expectedKind는 `KIND`로 실패한다.

# Functional Requirements

| id | requirement | priority | source |
| --- | --- | --- | --- |
| F1 | 네 계약의 필수 필드·타입·enum·version·추가 필드·ID·단위·범위를 검사 | must | ROADMAP §8–9 |
| F2 | 수업의 결정 변수마다 설명·조작·활용·실패·확인 콘텐츠를 연결하고 필수 시간 합계 15–20분을 검사 | must | ROADMAP §1·3·9 |
| F3 | 단일 문서 및 bundle의 참조·profile·lesson/concept/rubric revision·baseMapRevision을 검사 | must | ROADMAP §6·9 |
| F4 | 최초 예측·재시도·도움 정보·자유 응답의 pending 의미를 보존하는 기록만 수용 | must | ROADMAP §6 |
| F5 | supported 관찰에 원본 수행 근거·기준 버전·상황·도움 정보를 요구하며 열람·계산 실패만으로 수행 판정 불허 | must | ROADMAP §6 |
| F6 | 검증 실패를 구조화된 오류로 반환하고 입력·기존 map·외부 상태를 변경하지 않음 | must | ROADMAP §9 |
| F7 | 전체 계약 fixture를 하나의 검증 명령으로 실행하고 독립 기대 결과로 검증 | must | M0 확정안 |

## 공통 계약 규칙

계약은 아래 명시한 필드만 허용한다. 선택 필드는 명시적으로 `?`를 붙이며 그 외는 필수다. `null`은 명시한 위치에서만 허용한다. 모든 object는 JSON object, 모든 숫자는 finite number다. `validateDocument`에도 JSON에서 표현할 수 없는 값, cyclic reference, own accessor property를 허용하지 않는다. property getter를 실행하지 않고 `TYPE`로 거부한다. 클래스 instance·Date·함수·undefined·Symbol·BigInt·배열의 빈 slot도 `TYPE`로 거부한다. 일반 object와 null-prototype object는 허용한다.

각 루트는 `{kind, version, ...}`이며 version은 정수 1이다. 필드명이 Id로 끝나거나 명시적으로 ID라 표시된 값은 공통 ID 규칙을 적용하고, Revision/Version으로 끝나는 필드는 양의 safe integer다. 루트 version만 고정값 1을 요구한다. ID는 `[a-z][a-z0-9-]{0,63}`, revision은 1 이상의 safe integer, 일반 문자열은 앞뒤 공백 제거 결과가 비어 있지 않아야 한다. timestamp는 UTC ISO 형식 `YYYY-MM-DDTHH:mm:ss.sssZ`이고 실제 달력 시각과 왕복 변환이 일치해야 한다. ID는 소속 collection 안에서 고유하며 문서 간 동일 ID는 동일 entity를 참조한다. 단, lessons collection은 `(lessonId, lessonRevision)` 쌍을 고유 키로 사용한다. ID는 파일 경로가 아니다. 추가 필드 이름 `__proto__`, `constructor`, `prototype`도 허용하지 않는다.

하나의 object property 수와 하나의 array 길이는 각각 최대 1,000, 루트 object의 depth를 1로 세며 중첩 object·array마다 1 증가하는 container depth는 최대 32이다. bundle envelope는 depth에 포함하지 않고 각 문서를 별도로 센다. 문자열 길이는 UTF-8 bytes 기준 최대 65,536이다. parser 입력은 UTF-8 bytes 기준 최대 1,048,576이다. parser의 text가 문자열이 아니면 루트 TYPE으로 거부하고, 원시 텍스트가 큰 경우 JSON parse 전에 `LIMIT`로 거부한다. scalar 루트는 `TYPE`이다. 배열의 최소 길이는 아래 표를 따른다. 동일 JSON key 중복 검사는 T1 범위에서 제외하고 JSON.parse의 결과 object를 검증한다. 별도 구문 분석기 도입은 후속 결정이다.

## 구조 정의

| 구조 | 필드와 제약 |
| --- | --- |
| Diagnostic | kind=`diagnostic`, version=1, diagnosticId, profileId, contextKind=`work` 또는 `interest`, candidates[1..3], selection=ID 또는 null, confirmation=`confirmed`/`deferred`/`unconfirmed`, hypotheses[0..1000] |
| Candidate | candidateId, title, decisionQuestion, reason, preview |
| Hypothesis | candidateId, category=`common-knowledge-gap`/`unknown-concept`, rationale, status=`hypothesis` |
| Lesson | kind=`lesson`, version=1, lessonId, lessonRevision, profileId, diagnosticId, candidateId, contextKind, concepts[1..1000], content[1..1000], decisions[1..1000], inputs[1..1000], activities[1..1000], rubric |
| Concept | conceptId, conceptRevision, label |
| Content | contentId, role=`explanation`/`simulation`/`application`/`failure`/`assessment`, text, conceptIds[1..1000] |
| Decision | decisionId, question, choices[2..1000] (문자열), requiredInformation[1..1000] (문자열), explanationId, simulationId, applicationId, failureId, assessmentId |
| NumericInput | inputId, unit, min, max, default; min <= default <= max, min < max |
| Activity | activityId, stage=`diagnosis`/`orientation`/`exploration`/`assessment`/`return`/`map`, contentIds[0..1000], required=boolean, minutes > 0 |
| Rubric | rubricId, rubricVersion, criteria[5..1000] |
| Criterion | criterionId, dimension=`concept`/`prediction-model`/`transfer`/`question`/`choice-meaning`, conceptIds[1..1000], contentId, mode=`automatic`/`agent`, rule |
| Result | kind=`result`, version=1, resultId, profileId, lessonId, lessonRevision, baseMapRevision, sequence (양의 safe integer), previousResultId=ID 또는 null, state=`partial`/`completed`, responses[0..1000], assessments[0..1000] |
| Response | responseId, activityId, conceptId, conceptRevision, purpose=`prediction`/`explanation`/`transfer`/`question`/`choice`/`view`/`calculation-error`, attempt (양의 safe integer), previousResponseId=ID 또는 null, answer=문자열 또는 null, help=`none`/`hint`/`agent`/`unknown`, recordedAt, visibility=`before-output`/`after-output`/`unknown` |
| Assessment | assessmentId, responseId, criterionId, rubricVersion, status=`pending`/`supported`/`partial`/`not_demonstrated`/`skipped`, reviewer=`unreviewed`/`automatic`/`agent`, context, help |
| Map | kind=`map`, version=1, profileId, revision, lessons[0..1000], results[0..1000], observations[0..1000], nextPaths[0..1000] |
| Observation | observationId, resultId, assessmentId, conceptId, conceptRevision |
| NextPath | pathId, lessonId, conceptId, conceptRevision, reason |

Map의 lessons/results는 위 전체 계약의 원본 snapshot이다. T1은 원본을 함께 갖는 자체 완결형 map을 제안한다. 외부 원본 파일 참조만 보관하는 형식은 이 초안에서 제안하지 않는다. 이 중복 저장 비용과 향후 크기 제한은 승인 시 검토 대상이다. 파일 분리·migration·정정·삭제 명령은 T4에서 결정한다.

## 의미·참조·상태 규칙

1. Diagnostic에서 selection은 후보를 참조한다. confirmed는 non-null selection을 요구하고 unconfirmed/deferred는 null을 요구한다. hypotheses는 후보를 참조하고 항상 가설로 남는다. bundle에서는 confirmed 선택만 수업으로 연결하며 diagnosticId·profileId·contextKind가 lesson과 일치하고 lesson.candidateId는 선택된 후보 ID와 일치한다.
2. Lesson의 모든 concept/content 참조는 존재한다. Decision의 다섯 콘텐츠 참조는 각각 지정 role과 일치한다. simulation 콘텐츠와 NumericInput의 연결은 T2 계산 모델 계약에서 추가한다. 활동은 여섯 stage 각각에 필수 활동을 하나 이상 둔다. 필수 minutes의 합계는 [15,20]이고, 기본 대표 예산은 18이다. 각 criterion의 content는 assessment role이며 모든 다섯 dimension을 포함한다. rubric rule은 판정 근거를 담는 문자열이며 T1은 교육적 정확성을 자동 판정하지 않는다.
3. Result의 모든 응답·assessment 참조는 연결된 Lesson의 activity·concept·criterion·revision과 일치한다. Assessment가 참조한 criterion의 conceptIds에 원본 Response의 conceptId가 포함되어야 한다. Assessment의 help는 참조 Response의 help와 일치한다. agent criterion은 reviewer=agent인 경우에만 pending/skipped 외 상태를 허용한다. automatic criterion은 reviewer=automatic인 경우에만 pending/skipped 외 상태를 허용한다. unreviewed는 pending 또는 skipped만 허용한다. answer=null인 응답은 skipped 또는 pending만 허용한다. view/calculation-error 응답은 pending/skipped 외 판정 근거로 사용할 수 없다. calculation-error를 이해 부족으로 판정하지 않는다.
4. Response의 최초 attempt는 1이며 previousResponseId=null이다. 재시도는 동일 activity·concept·purpose의 이전 응답을 참조하고 attempt가 정확히 1 증가하며 recordedAt은 이전 시각 이상이다. 참조는 responses 배열에서 앞선 응답만 가리킨다. 최초 prediction은 visibility=before-output, 이후 prediction은 after-output이며 최초 원본이 반드시 남는다. prediction 건너뛰기는 answer=null인 최초 응답 또는 응답 자체 없음으로 허용한다. help=unknown은 보존하고 none으로 대체하지 않는다.
5. Result sequence=1은 previousResultId=null, 2 이상은 직전 result ID를 요구한다. previousResult를 제공한 bundle은 같은 profile·lesson·lessonRevision·baseMapRevision, 정확히 1 증가한 sequence를 요구한다. 이전 responses/assessments는 JSON key 순서를 제외하고 값·배열 순서가 동일한 prefix여야 한다. 후속 결과는 새 응답·assessment를 append하며 이전 판정의 정정도 새 assessment로 남긴다. 비교 과정에서 어떤 입력도 바꾸지 않는다. sequence>1에 이전 snapshot이 없으면 bundle은 REFERENCE로 실패한다.
6. completed는 활동 진행 상태이며 숙련 판정이 아니다. pending·skipped assessment를 포함한 completed를 허용한다. supported에는 non-null 수행 응답, 허용된 reviewer, 해당 criterion·rubricVersion, nonempty context, help를 요구한다. unknown 도움 수준도 명시적으로 허용하며 도움 없음으로 해석하지 않는다. 전역 숙련도/작업 준비 완료 필드는 제공하지 않는다.
7. Map 내부 lesson/result의 profile은 map과 같아야 한다. 결과는 lesson snapshot을 참조한다. sequence>1은 map 내부 이전 결과를 참조하며 규칙 5를 만족한다. result.baseMapRevision <= map.revision이다. Observation은 result의 assessment와 그 response의 concept/revision을 참조한다. NextPath는 map 안의 lesson/concept/revision을 참조한다. 각 ID collection 중복은 거부한다. 같은 lessonId의 여러 revision을 보관할 수 있으며 `(lessonId, lessonRevision)` 쌍은 고유하다.
8. bundle.result는 bundle.lesson을 참조하고 profile은 네 문서 모두 같으며 baseMapRevision은 bundle.map.revision과 정확히 일치해야 한다. map은 가져오기 전 snapshot이다. 동일 resultId가 이미 map에 있으면 동일 내용은 검증 성공, 다른 내용은 CONFLICT로 실패한다. 이는 중복 인식 규칙이며 map을 실제 갱신하거나 중복 저장을 수행하지 않는다. 결과의 lesson snapshot이 map에도 있으면 같은 ID/revision의 내용은 동일해야 한다. 없으면 신규 lesson으로 허용한다.


### 승인된 의미 오류 위치·수집 정책 (v4)

- 의미 검사는 적용되는 모든 위반을 수집하고 code/path 중복만 제거한다. unreviewed의 비중립 판정은 status의 STATE이며 criterion mode와 reviewer도 불일치하면 reviewer의 STATE를 함께 반환한다.
- bundle profile 비교의 기준은 diagnostic.profileId이다. lesson/result/map의 불일치 profileId에 PROFILE을 반환한다. Result와 Lesson의 직접 profile 비교도 별도로 적용한다. Map 내부는 map.profileId가 기준이다.
- checkpoint는 previousResult를 기준으로 새 result의 profileId/lessonId/lessonRevision/baseMapRevision/sequence/previousResultId 위치에 해당 오류를 반환한다. 이전 snapshot 자체의 내부 오류는 previousResult 아래에 유지한다.
- 진단과 수업의 contextKind 불일치는 /lesson/contextKind에 REFERENCE를 반환한다.
- 재시도의 activityId/conceptId/purpose가 이전 응답과 다르면 각 불일치 필드에 STATE를 반환한다. 이전 ID가 없거나 앞선 응답을 참조하지 않으면 previousResponseId에 REFERENCE를 반환한다.

# Errors

| code | failure condition | observable signal | post-failure state |
| --- | --- | --- | --- |
| JSON | malformed JSON text | ok=false, code=JSON, path="" | 입력·외부 상태 불변 |
| TYPE | JSON-compatible type/shape 위반 | 해당 위치의 TYPE | 입력·외부 상태 불변 |
| REQUIRED | 필수 property 없음 | 누락 위치의 REQUIRED | 입력·외부 상태 불변 |
| UNKNOWN_FIELD | 미정의 property | 해당 위치의 UNKNOWN_FIELD | 입력·외부 상태 불변 |
| KIND | expectedKind와 kind 불일치 또는 잘못된 expectedKind | kind 위치의 KIND | 입력·외부 상태 불변 |
| VERSION | 정수 1 외 version | version 위치의 VERSION | migration·보정 없음 |
| VALUE | ID·문자열·enum·timestamp·정수 형식 위반 | 해당 위치의 VALUE | 보정 없음 |
| RANGE | 수치 범위·시간 예산·array 최소 길이 위반 | 해당 위치의 RANGE | clamp·부분 수용 없음 |
| LIMIT | bytes·depth·collection 상한 초과 | 제한 위반 위치의 LIMIT | 의미 검증·외부 쓰기 없음 |
| DUPLICATE | collection ID 또는 lesson ID/revision 중복 | 두 번째 항목 ID 위치의 DUPLICATE | deduplicate 없음 |
| REFERENCE | 끊긴 ID·role 불일치·필수 이전 snapshot 부재 | 참조 property의 REFERENCE | 부분 연결 없음 |
| PROFILE | 다른 사용자 profile | 불일치 profileId의 PROFILE | map 미변경 |
| REVISION | lesson/concept/rubric/base map revision 불일치 | 불일치 property의 REVISION | 승격·덮어쓰기 없음 |
| STATE | confirmation·예측·재시도·판정 의미 위반 | 위반 상태 property의 STATE | 수행 상태 승격 없음 |
| CONFLICT | 동일 result ID나 lesson ID/revision의 상이한 내용 | resultId 또는 lessonRevision의 CONFLICT | 원본 교체 없음 |

expectedKind 자체가 잘못된 경우 path=""이다. 동일 위치에서 타입이 맞지 않으면 TYPE만, 올바른 타입의 unsupported version은 VERSION만 반환한다. depth나 cyclic/accessor 위반 subtree는 즉시 중단하며 다른 subtree는 계속 검사한다. bundle 자체 property도 signature와 동일한 필수·추가 필드 규칙을 적용한다. contract input 오류는 예외로 throw하지 않는다. 환경·프로그램 결함은 숨겨서 검증 성공으로 바꾸지 않는다.

# Cases

| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | 네 valid 문서, confirmed 진단, 빈 초기 map, 첫 결과 | 각 document와 bundle ok=true |
| C2 | normal | partial/completed 결과에 pending 자유 응답과 unknown 도움, 건너뛴 예측 | 허용; 상태·도움·응답 불변 |
| C3 | normal | 동일 결과 재검증, 이미 포함된 동일 result의 bundle, 유효한 append checkpoint | 허용; 입력 map과 이전 이력 불변 |
| C4 | boundary | 입력 min/default/max, 시간 합계 15·20, 각 자료 크기 상한 | inclusive 경계 허용 |
| C5 | boundary | default 범위 밖, 시간 15 미만·20 초과, bytes/depth/collection 상한+1 | RANGE/LIMIT 실패, 보정 없음 |
| C6 | error | JSON/type/required/unknown/kind/version/value 각각 단독 위반 | 지정 code/path, 상태 불변 |
| C7 | error | 중복 ID·끊긴 참조·role·profile·revision 각각 단독 위반 | DUPLICATE/REFERENCE/PROFILE/REVISION |
| C8 | error | unreviewed 자유 응답 supported, view·calculation-error 판정, 근거·상황 누락 | STATE 또는 REQUIRED |
| C9 | error | 예측 원본 교체·재시도 누락·checkpoint 역순·상충하는 같은 result ID | STATE/REFERENCE/CONFLICT |
| C10 | edge | 빈 map·partial 응답 없음·양성 수치와 무관한 임의 도메인·후보 보류 | standalone 허용; 보류 진단의 bundle 연결은 STATE |
| C11 | edge | cyclic/accessor/non-JSON 입력, 특수 property, deep-frozen 입력 | TYPE/UNKNOWN_FIELD 또는 valid 성공; getter 호출·mutation 없음 |
| C12 | error | 한 문서에 독립 구조 오류 2개, bundle 일부만 구조 유효 | 정렬된 두 오류; cross-document 의미 검사 생략 |

# Quality Applicability

| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 계약 수용·거부와 수행 기록 의미가 T1의 기능 |
| Performance efficiency | yes | Agent에서 검증이 입력 크기에 따라 무한 대기하면 사용 불가 |
| Compatibility | yes | 승인된 Node/npm과 JSON round trip 호환 필요; Chrome은 T3 검수 |
| Interaction capability | yes | Agent가 오류 원인·위치를 구분할 수 있어야 함; UI 접근성은 T3 |
| Reliability | yes | 반복 검사와 실패에서도 입력·map 보존 필요 |
| Security | yes | 입력을 코드로 실행하지 않고 원시 학습 응답 유출·getter 실행 방지 |
| Maintainability | yes | 계약 변경으로 거부 기준이 누락되는 문제를 검증 명령으로 발견 |
| Flexibility | yes | 도메인별 자료를 동일 계약으로 검사해야 함 |
| Safety | no | T1은 학습 자료의 구조 검증이며 실제 제품 조치·제어·의료 판단을 수행하지 않음. 콘텐츠의 오해·거짓 완료 방지는 F4–F5로 검증하고 전체 학습 안전성은 T2–T6에서 재평가 |

# Quality Requirements

| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Functional suitability | 승인 계약 수용·거부 일치 | V1–V6 항목의 독립 기대 결과 일치율, % | 100%, 이상 | automated + mutation | F1–F5, draft target |
| Q2 | Performance efficiency | 문서별 1,048,576 bytes 이하에 가능한 가까운 유효 합성 bundle 검증 | 10회 반복 중 최댓값 wall-clock ms, Node 26.8.1/macOS, 1회 warmup 제외 | 각 회 <=1,000ms | automated; 성능 fixture bytes·항목 수 기록 | draft target |
| Q3 | Compatibility | 승인 toolchain·JSON round trip | node/npm exact 버전 일치, 네 valid kind의 stringify→parse 검증 성공 수 | 버전 2/2, kind 4/4 | automated + main 정적 검수 | M0 |
| Q4 | Interaction capability | 소비자가 오류 위치·종류를 분리 | 15 code 단독 오류와 복수 오류의 code/path/정렬 일치율 | 100% | automated | F6, draft target |
| Q5 | Reliability | 반복·실패 시 입력 보존 | frozen input 검증, 전후 deep equality, 반복 결과 equality; V5 항목 통과율 | 100% | automated + mutation | F4·F6 |
| Q6 | Security | 외부 부작용·응답 노출 없음 | 악성 property/accessor fixture getter 호출 수, 오류 payload 응답 포함 수, validator의 fs/network/eval 사용 수 | 모두 0 | automated + main 정적 검수 | ROADMAP §8 |
| Q7 | Maintainability | 검증 가능한 계약 변경 | Node test coverage, contracts/*.mjs의 실행 행·함수 비율 | 각각 100% | automated, main 측정 | draft target |
| Q8 | Flexibility | 도메인 이름·통계 수치에 종속하지 않음 | 제조 검사와 비통계 합성 lesson에 동일 구조·참조 검사, domain fixture 성공 수 | 2/2 | automated | ROADMAP §12 |

시간·coverage 수치는 이 초안의 프로젝트별 제안이다. ISO/IEC 25023의 측정 개념이나 ISO/IEC/IEEE 29119-4의 기법·coverage 정의가 이 수치의 통과 기준을 정하지 않는다. spec 전체 승인 시 수치와 범위를 함께 승인한다. Q2는 사용자가 승인한 성능 fixture 범위인 문서별 약 1MiB(1,048,576 bytes 이하)에 맞는 유효 bundle을 만들어 문서 네 개 각각의 크기·depth·collection 길이를 보고하며, map은 사용 중인 lesson/result snapshot을 포함한다. bytes는 문자열 padding으로 채워 문서별 1,048,576 bytes 이하에서 가능한 가장 가까운 fixture를 사용한다. 이는 성능 검증의 선택 범위이며 validateDocument/validateBundle의 총량 제한을 추가하지 않는다.

# Verification Obligations

각 항목은 독립 입력에서 지정된 출력과 불변 상태를 확인한다. 임의로 전체 Cartesian product를 요구하지 않는다. 구조 필드와 종류의 조합은 해당 구조를 실제 포함하는 각 계약에서 모두 확인한다. rows의 하위 항목 ID는 `tests/fixtures/contracts/manifest.json`에서 고정하고 검증 명령이 누락을 실패로 처리한다. 각 manifest 항목은 `{id, obligationId, caseId, inputFixture, expected}`이며 expected는 명시한 ok/errors다. 입력과 기대 결과는 test-implementer가 이 spec에서 독립적으로 작성하고 Implementation 정의를 읽거나 호출해 기대값을 생성하지 않는다. 파생한 필드별 coverage 항목도 manifest에 모두 나열한다.

| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | F1,C1,C6,C10,C11 | 네 kind parser/document 결과 | unit, 모든 선언 필드와 실제 소속 구조 | syntax + equivalence partitioning | 각 필수 필드의 present/missing/wrong-type; 각 enum member/unknown; 각 구조 extra-field; kind·version·ID·timestamp·JSON-compatible partition | 선언 항목 100% | valid 허용, invalid 정확한 code/path | fixtures 기대값 명시; 검사 구현으로 oracle 생성 금지 |
| V2 | F1,F2,C4,C5,Q2 | 수치·분량·입력 크기 결과 | unit, 각 독립 경계 | boundary value analysis (3-value) | default=min/max 및 바로 밖; min=max; budget=14.99/15/15.01/19.99/20/20.01; bytes/depth/collection/string 상한-1/상한/상한+1; revisions=0/1/2; sequence/attempt=0/1/2 | 선언 항목 100% | 경계 포함·범위 밖 거부·승인된 문서별 약 1MiB fixture 시간 <=1,000ms | 자동 결과·시간·fixture 크기 출력 |
| V3 | F2,F3,C1,C7,C10 | lesson/map/bundle 참조 결과 | integration, 각 참조 종류 단독 위반 | decision table | selection confirmation 3상태×null/non-null 6행; 다섯 content role valid/missing/wrong-role; 모든 참조 필드 existing/missing; 모든 profile/revision 필드 match/mismatch; map 같은 lesson ID의 같은/다른 revision | 선언 항목 100% | 지정 참조/상태/버전 오류, 신규 lesson 허용 | 고정 fixture와 명시한 기대 code/path |
| V4 | F4,F5,C2,C8,C9 | 응답·판정·checkpoint·중복 결과 | unit + integration, 아래 명시 state 전환과 판정 표 | state transition + decision table | 최초→재시도·최초→유효 checkpoint·역순·원본삭제·원본수정·이전snapshot부재; prediction before/after/unknown; reviewer 3종×criterion mode 2종×status 5종 30행; answer null/문자열; purpose 7종의 근거 허용 여부; help 4종 일치/불일치; supported context present/missing; 같은 ID 동일/상이한 내용 | 선언 항목 100% | pending·unknown 보존, 과대 판정/이력 파괴 거부 | 정답 문자열 채점 없이 계약 결과만 자동 확인 |
| V5 | F6,C3,C6–C12,Q4–Q6 | 성공·오류 payload 및 입력 불변 | unit + integration, 모든 15 error code와 대표 valid bundle | scenario + error guessing | 15 code 단독 오류, 독립 복수 구조 오류, frozen valid/invalid, repeat validate, JSON round trip, malicious property/accessor/cycle, 네 kind 실패와 bundle 실패의 입력 보존 | scenario 항목 100%; error guessing none — experience-based | 정확한 정렬·오류 shape·원본 미노출·불변·getter 호출 0 | 자동 deep equality와 getter spy; main 정적 부작용 검수 |
| V6 | F7,Q3,Q7,Q8 | package 명령·validator 공개 API | integration + unit, 설치 후 승인 toolchain | scenario + statement coverage | 단일 verify 성공/선언 fixture 누락 실패; toolchain 2개 exact; kind 4개 round trip; domain 2개; contracts/*.mjs 모든 executable line·function | 항목 및 실행 행·함수 100% | 명령 exit=0, 누락/coverage 부족 exit!=0 | main 실행 출력과 coverage 보고서 |

분기·MC/DC·data-flow coverage는 이번 초안에서 필수로 제안하지 않는다. 유한 오류 분할·상태/판정 표·경계 검사와 행·함수 coverage를 기준으로 삼는다. 외부 저장·브라우저·호스트 계층은 T1 범위 밖이므로 end-to-end나 실제 재시작 검사를 수행하지 않는다. 표의 unit/integration 조합은 동일 항목을 무조건 양쪽에서 반복하지 않는다. V4의 응답·판정은 unit, checkpoint·중복 결과는 integration, V5의 parser/document는 unit, bundle는 integration에서 확인한다.

# Assumptions and Defaults

| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | Codex/macOS/Chrome, JavaScript ESM, Node 26.8.1/npm 11.19.0, Observable 1.13.4, npm run verify | ROADMAP 구현 기준. 실제 Framework 빌드 호환성은 후속 실행 검수 필요 | M0 확정안 사용자 승인 |
| A2 | 홈 아래 .learn-to-tell, 학습 응답·도움 보존, 최근 백업 5개, 관련 백업 삭제, JSON 전달, 학습 중 오프라인 | ROADMAP §8·9; 실제 저장은 T4 | M0 확정안 사용자 승인 |
| A3 | 18분, 첫 버전 상호작용, A+B/C/D 힌트, 제조 결함 검사 | ROADMAP §3·5·7·부록; 콘텐츠 정확성은 T2 이후 검수 | M0 확정안 사용자 승인 |
| A4 | version=1, 필드·함수·오류 정책·snapshot map·크기 제한·coverage/성능 목표 | 이 spec의 제안. snapshot 중복 비용과 입력 상한은 사용 경험으로 재검토 가능 | 사용자 구현 계획 실행 요청으로 전체 spec 승인 |
| A5 | JSON 중복 key 검사는 제외, T1 외부 패키지 없음, Framework 설치 T3 | parsed object 기준 검증으로 T1 범위 제한. raw duplicate key 감지는 별도 parser 필요 | 사용자 구현 계획 실행 요청으로 전체 spec 승인 |

명시적인 미정 결정을 구현자가 선택하지 않는다. 사용자 구현 계획 실행 요청은 A4–A5와 구현 dispatch를 포함하는 전체 spec 승인이다.

# Traceability

| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| U1 | C1 | V6 | ROADMAP와 draft 검토; 구현 완료 판정과 별도 |
| U2,F1 | C1,C4–C7,C10–C12 | V1,V2,V3,V5 | 자동 fixture 결과 |
| F2 | C1,C4,C5,C7 | V2,V3 | 분량·role fixture |
| F3 | C1,C3,C7,C9,C10 | V3,V4 | bundle/map fixture |
| F4,F5 | C2,C3,C8,C9 | V4,V5 | 이력·판정 fixture |
| F6 | C3,C6–C12 | V5 | 오류·불변 fixture, main 정적 검수 |
| F7,Q3,Q7,Q8 | C1,C3,C10 | V1,V5,V6 | 명령·round trip·coverage·도메인 결과 |
| Q1 | C1–C10 | V1–V6 | 자동 결과와 confirming mutations |
| Q2 | C4,C5 | V2 | 문서별 약 1MiB fixture 10회 시간 측정 |
| Q4,Q5,Q6 | C3,C6–C12 | V5 | code/path·원본 보존·부작용 검사, main 정적 검수 |

# Workflow Control

| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 1 |
| open finding ids | none |
| approval | approved — 사용자 구현 계획 실행 요청으로 전체 spec 승인 |

Audit state:

| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| V1 | 4 | tests/fixtures/contracts/manifest.json + Execution ledger 6–8 | accepted | verifier 1 accepted; 3/3 confirming mutations detected; final restored verify passes | v4 계약·테스트 기준의 당시 검증; 문서 정리로 재감사하지 않음 |
| V2 | 4 | tests/fixtures/contracts/manifest.json + Execution ledger 6–8 | accepted | verifier 1 accepted; 3/3 confirming mutations detected; final restored verify passes | v4 계약·테스트 기준의 당시 검증; 문서 정리로 재감사하지 않음 |
| V3 | 4 | tests/fixtures/contracts/manifest.json + Execution ledger 6–8 | accepted | verifier 1 accepted; 3/3 confirming mutations detected; final restored verify passes | v4 계약·테스트 기준의 당시 검증; 문서 정리로 재감사하지 않음 |
| V4 | 4 | tests/fixtures/contracts/manifest.json + Execution ledger 6–8 | accepted | verifier 1 accepted; 3/3 confirming mutations detected; final restored verify passes | v4 계약·테스트 기준의 당시 검증; 문서 정리로 재감사하지 않음 |
| V5 | 4 | tests/fixtures/contracts/manifest.json + Execution ledger 6–8 | accepted | verifier 1 accepted; 3/3 confirming mutations detected; final restored verify passes | v4 계약·테스트 기준의 당시 검증; 문서 정리로 재감사하지 않음 |
| V6 | 4 | tests/fixtures/contracts/manifest.json + Execution ledger 6–8 | accepted | verifier 1 accepted; 3/3 confirming mutations detected; final restored verify passes | v4 계약·테스트 기준의 당시 검증; 문서 정리로 재감사하지 않음 |

Execution ledger:

| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | none — draft 작성 | 해당 없음 | 승인된 M0 기준과 ROADMAP 의미 규칙으로 T1 초안 작성 | 구현·dispatch·verifier·mutation 없음 |
| 2 | 전체 spec 승인·lifecycle start | 사용자 실행 요청 | v2 승인, Node 26.8.1/npm 11.19.0 확인; HEAD e611c35049604302fd13bbc2de73d73b9d5a4ace, 기존 base 보존 | start 성공; 병렬 구현·테스트 dispatch |

| 3 | S1: Q2 최대 bundle은 map만 65GB 이상 가능 | parser cap은 raw text에만 적용 | 사용자 승인: 성능 fixture만 문서별 약 1MiB로 한정; 계약 제한 유지 | v3, V2/Q2 선택 범위 명확화 |

| 4 | E1: initial verify 1497 tests, 31 failures, lines 99.53% | snapshot conflict isolation and underspecified mismatch paths | 사용자 승인: 비교 기준·의미 오류 수집·재시도 각 불일치 필드 STATE 명시; tests fixture isolation; main envelope safety correction | v4; V3/V4/V5/V6 재검증 pending |

| 5 | E2: completed v4 oracle verify 1534 tests, 1 fail; lines/functions 100% | broken response concept also violates criterion membership | isolate missing concept reference from assessment membership; check sibling fixtures | V3 fixture correction, expected policy unchanged; rerun pending |

| 6 | E3: 1756/1756 pass, line/function 100%; manifest removal exit 1 | E2 isolated and missing boundary evidence added | valid upper fixtures, pointer escaping, reverse/prediction history, manifest probe; Q2 max 0.929709ms | fresh verifier invocation 1 persisted; all V1–V6 pending independent audit |

| 7 | fresh verifier 1: V1–V6 accepted, no findings | independent E3 audit | strongest version/prediction-prefix/unreviewed mutations accepted violating witness then failed intended assertions; every restore SHA-identical | 3/3 detected; no blocking/advisory/spec challenge |
| 8 | E4 restored verify 1756/1756, line/function 100%, Q2 max 0.804875ms | final restoration confirmation | unchanged evidence dependencies; E4 adds confirmation only | all obligations accepted; complete, corrections 3, verifier 1/2 |

| 9 | 사용자 요청: 필수 문서만 유지 | 별도 보고서가 spec 이력과 중복 | 별도 검수 문서 요구·참조 삭제; 최소 검수 결과를 이 ledger에 통합 | v5 문서 정리만 수행; 계약·코드·테스트 변경 없음 |

당시 main 정적 검수: 고정 toolchain·외부 의존성 없음 확인. validator의 파일·네트워크·eval 사용 없음, 입력 변경·getter 실행·응답 payload 노출 경로 없음 확인. manifest 누락 probe는 의도한 assertion으로 exit 1; 버전·예측 prefix·미검토 supported 결함 주입은 각각 의도한 assertion으로 검출 후 원본 복원. 이후 변경의 정확성을 보증하는 기록은 아니다.

# Version Log

## v1

- 승인된 환경·제품 범위를 반영한 T1 계약 검증 초안. 상세 schema·품질 수치·검증 정책은 전체 승인 전 제안이다.

## v2

- 사용자 구현 계획 실행 요청으로 전체 계약·오류 정책·품질 목표 승인. 계약 내용과 run ID, base commit, 검증 카운터 유지; audit state v2 pending.

## v3

- S1 해결: 사용자 승인에 따라 Q2 성능 fixture만 문서별 약 1MiB로 한정. 모든 API의 계약 제한은 유지하며 10회 각 1,000ms 기준 유지.

## v4

- 사용자 예시 승인으로 문서 간 오류 비교 기준·contextKind REFERENCE·모든 적용 의미 오류 수집을 명시. 사용자 선택에 따라 재시도 activityId/conceptId/purpose 각각의 불일치 필드에 STATE를 반환. 초기 실패 증거와 원인·교정 방향 보존.

## v5

- 사용자 요청으로 별도 검수 문서 요구·참조와 상세 절차를 삭제하고, 완료 검증의 최소 결과는 Execution ledger에 통합. 계약·오류 정책·품질 목표·테스트 및 v4의 당시 감사 판정은 유지.
