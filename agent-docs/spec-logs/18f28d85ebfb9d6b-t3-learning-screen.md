---
version: 7
run_id: 18f28d85ebfb9d6b
status: complete
base_commit: 257ed37b553b574b70d42098cd05e317e53b9a83
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| U1 | 사용자 | 대표 수업 한 회를 브라우저에서 진행 | 로컬 HTTP·외부 요청 없이 예측·조작·확인을 수행하고 T1 result JSON을 내보냄 |
| U2 | 사용자 | 이해 착각 방지 장치가 화면에서 동작 | 최초 예측 보존, 새 사례 결과 선공개 금지, 도움 수준과 판정 상태가 결과에 남음 |

# Scope
In scope: Observable Framework 1.13.4 설치(직접 버전·lockfile 고정)와 대표 수업 한 페이지 빌드. ROADMAP §5 첫 버전 상호작용 전체(개념 카드, 시뮬레이션↔설명 왕복 링크, 예측→실행→비교, 하나씩 바꾸기·초기화·전후 비교, 대비 예시, 단계별 힌트 깊이 선택, ‘내 상황에 적용’ 카드). §7 A+B 피드백 표현과 핵심 선택 1건의 C 대칭 비교. localStorage 상태 유지. T1 result 다운로드. session 설정 주입 빌드. http-server 로컬 실행 스크립트. prediction-model 자동 판정과 이에 맞춘 T2 rubric rule 문구 수정.
Out of scope: map 가져오기·저장·중복 방지(T4), 자유 응답의 agent 검토 실행, 진단·자료 생성 skill(T5), 후속 상호작용(인과 경로 강조, 두 시나리오 고정), 피드백 시점 선택·묶어 돌아보기, 다른 수업·도메인 지원, 교육 효과 검증. T1 계약 v1과 T2 계산·binding API는 변경하지 않는다.

# Paths
Implementation: observablehq.config.js, site/src/index.md, site/src/components/, learning/, scripts/build-lesson.mjs, scripts/serve.mjs, examples/manufacturing-inspection/lesson.mjs (rubric criterion `calculate-transfer`의 rule 문구만), examples/manufacturing-inspection/assessment-guide.mjs (calculate-transfer 예시 문구의 1e-9 표현만 A7 기준으로), package.json, package-lock.json
Tests: tests/learning.test.mjs, tests/fixtures/learning/, tests/e2e/, playwright.config.mjs
Integration (main only): package.json scripts.verify 연결, ROADMAP.md 완료 상태, 이 spec.
Test command: npm run verify
Review evidence: Execution ledger의 R1(화면 콘텐츠·피드백·안전 표현), R2(의존성·버전·오프라인 자산), R3(색 외 구분·표 대체·초점 표시 수동 점검) 기록과 M1–M3 mutation 결과.

# Signatures
learning/session-config.mjs: export function validateSessionConfig(value) → {ok:true,value} | {ok:false,errors:[{code,path}]}
learning/progress.mjs: export function initialProgress(session); export function applyAction(progress, action) → {ok:true,progress} | {ok:false,errors:[{code,path}]}
learning/grading.mjs: export function gradeTransferPrediction(prediction, expected) → {status, matched:[field], mismatched:[field]}
learning/result.mjs: export function buildResult(progress, lesson, session, now) → T1 result v1 문서
learning/progress.mjs: export function predictionState(track) → 'empty'|'recorded'|'skipped'|'revealed'|'retried' (progress.baseline 또는 progress.transfer를 받음)
learning/result.mjs: export function validateResultShape(document) → {ok, errors:[{code,path}]}: 브라우저용 T1 result 구조 검사. 유효 문서는 ok:true; 구조 위반은 T1 validateDocument와 같은 code·path(TYPE/REQUIRED/UNKNOWN_FIELD/VALUE/RANGE/KIND/VERSION), sequence/previousResultId 불일치는 STATE /previousResultId. export 버튼은 ok:false면 다운로드하지 않는다.
validateSessionConfig의 errors는 code, path 순으로 정렬한다(T1·T2와 동일).
learning/storage.mjs: export function loadProgress(storage, session); export function saveProgress(storage, progress) → {ok:true}|{ok:false,reason}
learning/format.mjs: export function formatCount(n); export function formatRatio(r)
scripts/build-lesson.mjs: CLI `node scripts/build-lesson.mjs --session <path>`; scripts/serve.mjs: CLI, dist/를 127.0.0.1에 제공하고 URL 출력.
package.json scripts: build, serve, verify.

## Public shapes
SessionConfig = {profileId, resultId, baseMapRevision, sequence, previousResultId}. ID는 T1 id 형식, baseMapRevision은 1 이상 정수(v3), sequence는 1 이상 정수, previousResultId는 id 또는 null. 추가 필드 거부.
Prediction 필드 = truePositive, falsePositive, falseNegative, trueNegative, positiveCount, positivePredictiveValue, accuracy (7개). 사용자는 비율을 % 단위로 입력한다.
Action 종류: setInput, applyScenario, resetInputs, recordPrediction, skipPrediction, reveal, retryPrediction, recordFreeResponse, openHint(level), setHelp, completeLesson. 상세 필드는 implementer가 정하되 아래 FR·Errors 의미를 지킨다.
localStorage key: `learn-to-tell:<lessonId>:<lessonRevision>:<resultId>`; 값은 {schemaVersion:1, progress}.

## UI surface contract (v2)
테스트는 아래 data-testid와 표시 형식만 사용한다.
- CLI: `node scripts/build-lesson.mjs --session <path>` → dist/. `node scripts/serve.mjs --port <n>`(기본 4321) → stdout 첫 줄 `http://127.0.0.1:<n>/`. npm scripts `build`, `serve`가 각각 이를 호출.
- 입력: `input-defect`, `input-detection`, `input-false-positive`(type=number, label 포함); 오류 `input-error-<같은 접미사>`; 이전 값 표시 `stale-output-notice`.
- 시나리오·초기화: `scenario-baseline-a`, `scenario-population-contrast`, `scenario-candidate-b`, `reset-inputs`.
- 출력 표 `output-table`: 각 셀 `[data-field=<truePositive|falsePositive|falseNegative|trueNegative|positiveCount|positivePredictiveValue|accuracy>]`. 직전 값 비교 `output-previous` 동일 data-field. 시각화 `output-grid`는 data-true-positive/false-positive/false-negative/true-negative 속성에 원시값.
- 표시 형식: 개수는 정수면 ko-KR 천 단위 구분(9,405), 정수가 아니면 소수 최대 3자리(1.35); 비율은 % 소수 2자리(15.38%); PPV null은 `정의되지 않음(양성 0)`.
- 기본 예측: 영역 `baseline-prediction`, 필드 `prediction-<field>`(비율은 %), `prediction-ppv-undefined` checkbox, 버튼 `prediction-record`, `prediction-skip`, `prediction-reveal`, `prediction-retry`; 공개 후 비교 영역 `baseline-comparison`; 최초 예측 표시 `prediction-original`(공개 후 입력은 disabled).
- 새 사례: 영역 `transfer-prediction`, 필드 `transfer-<field>`, `transfer-ppv-undefined`, 버튼 `transfer-record`, `transfer-skip`, `transfer-retry`; 결과 `transfer-result`(공개 전 DOM에 없음); 판정 `transfer-grade`(data-status=판정값).
- 설명 왕복: `link-to-explanation`, `link-back-to-simulation`; 강조 대상에 `data-highlighted="true"`.
- 개념 카드: 트리거 `concept-<conceptId>`(button, aria-expanded), 카드 `concept-card-<conceptId>`.
- 힌트·도움: `hint-level-1..3`(버튼, 선택 깊이까지 `hint-text-<n>` 표시), `help-level`(select: none/hint/agent/unknown).
- 자유 응답: `response-question`, `response-choice`, `response-apply`(textarea); 핵심 선택 찬반 `choice-pro`, `choice-con`.
- 완료·내보내기: `complete-lesson`, `export-result`(다운로드 파일명 `result-<resultId>.json`), `export-error`, `export-notice`(map 저장 아님 안내).
- 저장: `storage-notice`(data-kind=load-failed|unavailable), `reset-learning`, `reset-learning-confirm`.

## Shapes and stage flow (v3)
- 단계 흐름: progress.stage ∈ context → prediction → simulation → assessment → return → map. 초기 stage는 context이며 화면에는 맥락(diagnostic-cards, lesson-orientation)과 안전 안내만 보인다. `advanceStage` action은 바로 다음 stage로만 이동한다. prediction에서 simulation으로는 기본 예측 record 또는 skip 이후에만 이동 가능하다. 다른 이동은 순서대로 항상 가능하다. 이전 stage로 돌아가 내용을 볼 수 있지만(`goToStage{stage}`가 이미 도달한 stage만 허용) 진행 기록은 바뀌지 않는다.
- 출력 표·시각화·입력 조작·시나리오 버튼·`baseline-comparison`은 stage가 simulation에 도달하기 전에는 DOM에 없다. 최초 예측(attempt 1) response는 visibility before-output, 재시도 response는 T1 계약대로 after-output이다.
- testid: 각 단계 영역 `stage-<context|prediction|simulation|assessment|return|map>`(현재 단계만 DOM에 존재), `stage-next`, 이전 단계 이동 `stage-back`, 진행 표시 `stage-indicator`(텍스트에 현재 단계명).
- Action: 모든 action은 `{type, at?}`(at은 ISO timestamp). setInput{field: defectPercent|detectionPercent|falsePositivePercent, value}, applyScenario{scenarioId}, resetInputs, recordPrediction{target: baseline|transfer, values}, skipPrediction{target}, reveal{target}, retryPrediction{target, values}, recordFreeResponse{kind: question|choice|apply, answer: string|null}(null=건너뜀, 빈 문자열=지움), openHint{level 1–3}, setHelp{level: none|hint|agent|unknown}, completeLesson, advanceStage, goToStage{stage}. values는 7 Prediction 필드, 비율은 %, positivePredictiveValue null=정의되지 않음.
- 예측 상태 전이(target별): empty→recorded(record), empty→skipped(skip), recorded|skipped→revealed(reveal), revealed|retried→retried(retry, previousResponseId는 직전 attempt). 그 외는 무효: recorded/skipped에서 record·skip·retry, empty에서 reveal·retry, revealed/retried에서 record·skip·reveal. transfer의 record/skip은 같은 action에서 revealed까지 진행한다. setInput/applyScenario/resetInputs는 stage simulation 이전에는 무효. completeLesson은 stage map에서만 유효하며 반복은 무효.
- 도움 기본값은 unknown. openHint는 help가 unknown 또는 none이면 hint로 올린다. setHelp는 사용자가 직접 지정.
- 평가 매핑: transfer 최초 예측 response → calculate-transfer(automatic) + distinguish-denominators(agent); apply → explain-transfer; question → ask-for-evidence; choice → justify-choice. agent 차원은 응답 있으면 pending/unreviewed, answer null이면 skipped, 응답 없으면 assessment 없음. 재시도 response는 판정 대상이 아니다. testid `response-skip-<kind>` 추가.
- 계산 실패: transfer 계산이 실패하면 progress.transfer.calculationError, response purpose calculation-error, calculate-transfer pending.
- loadProgress(storage, session) → {progress, notice: null|'load-failed'|'unavailable'}; saveProgress → {ok:true}|{ok:false, reason:'unavailable'}.
- gradeTransferPrediction(prediction, expected): prediction은 7필드(비율 %) 또는 null(건너뜀), expected는 T2 계산 value(비율 0–1). 경계: |차이| ≤ 1(개수) 또는 ≤ 1%p(비율) 포함, 부동소수 보정 1e-9.
- buildResult의 now: Date | ISO string; recordedAt은 action.at, 없으면 now.
- validateSessionConfig 오류 code: TYPE, REQUIRED, UNKNOWN_FIELD, VALUE(형식), RANGE(범위), STATE(sequence 1 ⇔ previousResultId null 위반, path /previousResultId). baseMapRevision과 sequence는 정수 ≥1(T1 integer와 일치).
- 스크롤 유지 허용 오차 ±2px.
- R2 외부 URL 검사 허용 목록: 수업 본문의 표시용 출처 문자열 `https://www.medcalc.org/en/manual/roc-curve-analysis-predictive-values.php`만. 클릭 가능한 a 태그로 만들지 않으며 실제 요청 0건은 e2e S8로 검증한다.

## Clarifications (v6)
- serve.mjs는 http-server가 연결을 받을 수 있게 된 후에 첫 stdout 줄 URL을 출력한다.
- `prediction-original`/`transfer-original`은 최초 예측 7필드 값을 표시 형식(개수 형식, 비율 %, PPV 정의되지 않음)의 텍스트로 포함하고, 건너뛴 경우 `건너뜀`을 표시한다.
- 최초 예측 입력 `prediction-<field>`, `prediction-ppv-undefined`는 기본 예측 record/skip 이후 disabled이고 최초 값(건너뜀이면 빈 값)을 유지한다. 재시도 값은 별도 필드 `prediction-retry-<field>`, `prediction-retry-ppv-undefined`에 입력하고 `prediction-retry`로 기록한다(reveal 이후에만 DOM에 존재). 새 사례도 같은 규칙: `transfer-<field>`는 record/skip 이후 disabled, 재시도는 `transfer-retry-<field>`, `transfer-retry-ppv-undefined`, `transfer-retry`.
- `choice-pro`, `choice-con`은 표시 전용 영역이며 키보드 초점 대상이 아니다.
- 출력 요소(`output-table` 등)는 갱신 때 교체될 수 있다. 테스트는 testid 요소 동일성에 의존하지 않는다.
- 새로고침·탭 재열기 후 현재 stage도 복원된다.

## Verifier-1 resolutions (v7)
- SC1(사용자 결정): 저장 오류·초기화는 e2e로 검증한다 — 손상 localStorage 값 주입 시 `storage-notice[data-kind=load-failed]` 표시, 학습 action 전까지 원래 값이 그대로 남음, 화면 조작 계속 가능; `localStorage` 접근 예외(init script로 getItem/setItem throw) 시 `storage-notice[data-kind=unavailable]`와 메모리 진행; `reset-learning` → 화면 내 `reset-learning-confirm`(브라우저 dialog 이벤트 0건) → 저장 상태 삭제·context stage 복귀, `reset-learning-cancel`은 상태 유지. 결과 형식 위반에 따른 다운로드 차단과 계산 실패 표시는 정상 UI로 유발할 수 없으므로 단위 증거(validateResultShape·buildResult·calculation-error)로 충분하다.
- SC2(사용자 결정): `output-grid` 내부 범주 도형은 `[data-series=true-positive|false-positive|false-negative|true-negative]`이고 각 도형에 실제 그린 칸 수 `data-cells`(정수)를 둔다. 칸 수 규칙: TP, FP, FN, TN 순서의 누적합을 Math.round(반올림, .5는 올림)한 경계로 나누고 마지막 경계는 10,000이다. 네 data-cells의 합은 10,000이다. 그린 칸 수와 data-cells는 같은 경계에서 계산한다.
- 검증 범위 보강(검증 정책 명확화): V1 상태표와 무효 action 탐침은 baseline과 transfer 두 target 모두에 적용한다(transfer는 record/skip이 곧 revealed). V2는 1e-9 부동소수 보정이 필요한 사례(예: 기대 비율 0.57, 예측 58%)를 포함한다. V3·e2e는 기본 fixture와 다른 두 번째 session(sequence 2, previousResultId 존재, baseMapRevision 3 등)으로 빌드·다운로드한 결과를 검증한다. V5 S3은 빈 값·숫자 아님 입력과, 잘못된 입력 후 새로고침 시 직전 유효값 복원을 포함한다. F4는 설명 문단과 관련 입력이 모두 `data-highlighted=true`인지, 개념 카드가 Enter와 Space 모두로 열리는지, 링크 이동으로 실제 스크롤이 바뀐 뒤 복귀 위치가 ±2px인지 확인한다. e2e는 `scenario-baseline-a`, `prediction-ppv-undefined`·`transfer-ppv-undefined`(기대 PPV null 사례는 (0,90,0) 입력이 아닌 새 사례에서는 없으므로 기본 예측의 정의되지 않음 선택이 불일치로 판정되는 것과 표시), `prediction-original`의 `건너뜀`, transfer-grade의 partial·not_demonstrated를 구동한다.
- V8(신규): SC1 e2e 시나리오(S9 손상 값, S10 저장 불가, S11 초기화 확인/취소)와 SC2 격자 칸 수(S12: C1·대비·B·C6 소수 사례 (0.015,90,5)에서 data-cells 독립 계산과 일치, 합 10,000). 기법 scenario, 커버리지 100%.
- R1·R3 검토는 반복 가능한 절차·항목별 결과·명명된 산출물로 다시 기록한다(EG6).

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| F1 | 빌드는 session 설정을 검증한 후에만 dist/를 생성한다. 산출물은 런타임에 외부 URL import·원격 폰트·외부 API 요청을 하지 않는다. scripts/serve.mjs는 http-server로 dist/만 `-a 127.0.0.1 -c-1` 제공하며 쓰기 엔드포인트가 없다 | must | A1, ROADMAP §9·§12 |
| F2 | 세 입력(0–100, 단위 %, 기본 1/90/5)을 각각 변경하고, 시나리오 baseline-a·population-contrast·candidate-b를 적용하며, 초기화 범위(입력만)를 표시한다. 출력은 calculateInspection 결과의 TP/FP/FN/TN·양성 총수·PPV·정확도를 표와 10,000칸 시각화에 같은 값으로 보이고, 변경 직전 값과 전후 비교를 표시한다. PPV null은 “정의되지 않음(양성 0)”으로 표시한다 | must | ROADMAP §5, T2 |
| F3 | 결과 공개 전 예측을 기록한다. 건너뛰기를 허용한다. 공개 후 최초 예측은 변경할 수 없고, 재시도는 previousResponseId로 연결된 새 response로 남는다 | must | ROADMAP §5·§6 |
| F4 | 용어 개념 카드는 클릭·Enter/Space로 열고 Escape로 닫는다. 시뮬레이션↔설명 링크는 해당 문단과 관련 입력을 강조하고, 돌아오면 입력·예측·스크롤 위치를 유지한다 | must | ROADMAP §5 |
| F5 | 새 사례(2/80/2)의 결과는 예측 기록 또는 건너뛰기 전에는 DOM에 렌더링하지 않는다. 질문 만들기·선택 이유·‘내 상황에 적용’ 자유 응답을 받는다. 단계별 힌트(guide hints 3단계)는 선택한 깊이까지만 연다. 도움 수준 none/hint/agent/unknown을 기록하며, 힌트 열람만으로 수행을 인정하지 않는다 | must | ROADMAP §5·§6 |
| F6 | prediction-model 판정: 개수 5필드는 기대값과 절대 차이 ≤1, PPV·정확도는 %p 차이 ≤1(기대 PPV null이면 사용자가 “정의되지 않음”을 선택해야 일치). 7개 전부 일치 supported, 1–6개 partial, 0개 not_demonstrated, 건너뜀 skipped. reviewer는 automatic. 나머지 4차원은 응답이 있으면 pending/unreviewed, 건너뛰면 skipped. 계산 실패는 purpose `calculation-error` response로 기록하고 해당 판정을 pending으로 둔다. lesson.mjs의 calculate-transfer rule 문구를 이 허용 오차로 수정하고 계산 도구 오차 1e-9는 별도 기준으로 명시한다 | must | A7 |
| F7 | 진행 중(partial)·완료(completed) 언제든 결과를 T1 result v1 JSON 파일로 다운로드한다. session 설정의 profileId·resultId·baseMapRevision·sequence·previousResultId를 그대로 쓴다. 각 response는 visibility(before-output/after-output)와 help를 기록한다. 화면에 “다운로드는 map 저장이 아니며 agent에게 파일 경로를 전달해야 함”을 표시한다 | must | A3, A8, ROADMAP §8 |
| F8 | 모든 상태 변경 후 localStorage에 저장하고, 로드 시 복원한다. ‘학습 초기화’는 확인 후(브라우저 confirm 대화상자 금지, 화면 내 확인) 저장 상태를 지운다 | must | A4 |
| F9 | 피드백 문구는 관찰 범위 근거(A)와 사실/지지 분리(B)를 따른다. 핵심 선택(검사 A/B) 1건에 찬반 근거를 같은 형식으로 나란히 보인다. 사람·능력 판정, 점수·순위 문구를 쓰지 않는다. 가상 수치·모델 가정·실제 조치 사용 금지 문구를 표시한다 | must | ROADMAP §7, T2 R2 |
| F10 | 핵심 흐름(입력 조작·예측·공개·왕복 링크·힌트·자유 응답·다운로드)은 키보드만으로 수행할 수 있고, 시각화의 모든 값은 표로도 제공되며, 상태는 색 외 텍스트·아이콘으로도 구분된다 | must | ROADMAP §5, A5 |

# Errors
session 설정 파일 없음·JSON 파싱 실패·필드 누락/타입/형식/추가 필드 — 빌드 CLI exit≠0과 stderr에 code·path — dist/는 생성·변경되지 않음(기존 dist 보존).
화면 입력이 숫자가 아니거나 0–100 밖 — 해당 입력 옆 오류 문구와 aria-invalid=true, 계산하지 않음 — 직전 유효 출력 유지와 “이전 값 표시 중” 표시, progress의 입력값은 직전 유효값.
applyAction의 잘못된 action·순서 위반(공개 후 최초 예측 수정, 미공개 상태 reveal 이전 결과 요청 등) — {ok:false,errors} 반환, throw 없음 — progress 원본 불변.
localStorage 값 JSON 손상·schemaVersion 불일치·lessonId/revision/resultId 불일치 — 초기 progress로 시작하고 “저장된 진행을 불러오지 못함” 알림 — 손상 값은 사용자가 학습을 진행해 저장하기 전까지 덮어쓰지 않음.
localStorage 접근 예외(차단·용량 초과) — “이 브라우저에 진행이 저장되지 않음, 결과를 내보내 보관” 경고 — 메모리 상태로 진행 계속.
buildResult 결과가 결과 계약 형태 위반 — 다운로드 차단과 오류 표시 — 파일 생성 없음, 성공 문구 없음.
calculateInspection 실패 — 계산 실패 표시, calculation-error response 기록 — 이해 부족으로 판정하지 않음.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | 기본 입력 로드 | 표·시각화 TP90 FP495 FN10 TN9405 양성585 PPV 15.38% 정확도 94.95%(표시 형식은 F2, 원시값은 T2) |
| C2 | normal | baseline-a 예측 기록 → 공개 → 대비 시나리오 → B 적용 → 초기화 | 각 단계 출력 T2 C1–C3 값, 전후 비교 표시, 초기화 후 1/90/5, 최초 예측 유지 |
| C3 | normal | 키보드만으로 전체 흐름 완료 후 다운로드 | result state completed, validateDocument(result,'result') ok, session 값 일치 |
| C4 | normal | 새 사례 예측 160/196/40/9604/356/44.94%/97.64% | calculate-transfer supported, reviewer automatic |
| C5 | boundary | 새 사례 각 개수 필드 기대±1, ±1.01 / 비율 ±1%p, ±1.01%p (한 필드씩) | ±1·±1%p는 일치, 초과는 불일치 → partial |
| C6 | boundary | 입력 -0.01, 0, 0.01, 99.99, 100, 100.01 | 0–100 포함 계산, 밖은 오류 표시·직전 출력 유지 |
| C7 | edge | (0,90,0) 입력 | PPV “정의되지 않음(양성 0)” 표시, 0%로 표시하지 않음 |
| C8 | edge | 예측 건너뛰기, 힌트 2단계 열람 후 자유 응답, 재시도 | skipped 판정, help=hint, 재시도 response의 previousResponseId=최초 response, 최초 답 유지 |
| C9 | edge | 설명 링크 이동 후 복귀, 페이지 새로고침, 탭 재열기 | 입력·예측·자유 응답·스크롤(왕복 시) 유지, 새로고침 후 복원 |
| C10 | error | 손상 localStorage, 다른 schemaVersion, 다른 resultId, localStorage 예외 | F8/Errors의 알림·초기 상태·경고, 화면 계속 동작 |
| C11 | error | session 설정 누락/필드 각각 누락·타입·형식·추가 필드 | 빌드 exit≠0, code·path 출력, dist 불변 |
| C12 | error | 공개 후 최초 예측 수정 action, 새 사례 미예측 상태 결과 요청 | {ok:false}, progress 불변; 화면에 새 사례 결과 DOM 없음 |
| C13 | edge | 진행 중 다운로드 | state partial, 미응답 판정 없음 또는 pending/skipped만, validateDocument ok |
| C14 | normal | 모든 페이지 요청 기록 | 127.0.0.1 외 요청 0건 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 계산 표시·예측 보존·판정·결과 계약 정확성 |
| Performance efficiency | yes | 조작 즉시 반응이 예측→실행→비교 학습에 필요 (A6) |
| Compatibility | yes | Node 26.8.1/npm 11.19.0, macOS 설치 Chrome, T1 result 계약 |
| Interaction capability | yes | 키보드·접근성·색 외 구분·표 대체 (A5) |
| Reliability | yes | 상태 유지·복원·손상 처리·허위 성공 없음 |
| Security | yes | 루프백 바인딩, 외부 요청 0, 쓰기 권한 없음, 작업 원문 자동 수집 없음 |
| Maintainability | yes | 순수 로직 100% line/function, 독립 oracle, 기존 회귀 |
| Flexibility | no | 단일 대표 수업; 범용 수업 런타임은 T5 범위 |
| Safety | yes | 가상 수치·판정 의미 한계·실제 조치 금지 표시 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Functional suitability / correctness | 표시값·판정·결과 | C1–C14 선언 항목 통과율(%) | 100% | automated + mutation | F1–F10 |
| Q2 | Performance efficiency / time behaviour | 로컬 Chrome, 빌드 산출물, 입력 1개 변경 | 입력 이벤트 dispatch부터 표·시각화 갱신 완료까지 20회, ms | p95 ≤ 100ms | automated | A6 |
| Q3 | Compatibility | Node 26.8.1/npm 11.19.0, 설치 Chrome, T1 result v1 | verify 실행·Chrome 버전 기록·validateDocument | 모두 통과 | automated + review R2 | ROADMAP §9 |
| Q4 | Interaction capability / accessibility | 공개 전·후·새 사례·힌트 열림 4상태 페이지 | @axe-core/playwright WCAG 2.2 A/AA 태그 위반 수; 키보드 e2e 단계 통과율; R3 항목 | 위반 0건, 100%, R3 전 항목 통과 | automated + review | A5 |
| Q5 | Reliability | 새로고침·손상·저장 불가·다운로드 실패 | C9–C13 통과율 | 100% | automated | F8, Errors |
| Q6 | Security | 학습 중 네트워크, 서버 바인딩 | e2e 요청 기록의 비-127.0.0.1 요청 수; serve 인자; R2 | 0건, 127.0.0.1 바인딩, 쓰기 메서드 처리 없음 | automated + review | F1 |
| Q7 | Maintainability | learning/*.mjs | Node coverage line/function(%) + 기존 T1/T2 테스트 | 100% / 기존 전부 통과 | automated | 기존 verify 정책 |
| Q8 | Safety | 화면 문구 | R1 체크리스트 통과율 | 100% | review | F9, T2 R2 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | F3,F5,F6,C8,C12 | applyAction 예측 상태 | unit, 모든 상태·전이 | state transition (0-switch) | 상태: empty, recorded, skipped, revealed, retried; 각 상태에서 action 11종의 유효 전이와 무효 전이 | 100% 유효 전이, 상태별 무효 전이 각 1개 이상 | 유효는 기대 상태, 무효는 {ok:false}·원본 불변 | tests/learning.test.mjs 독립 상태표 |
| V2 | F6,C4,C5 | gradeTransferPrediction | unit | boundary value analysis (3-value) + equivalence partitioning | 7필드 각각 기대-1.01, -1, 0, +1, +1.01(비율은 %p); 일치 수 0/1/6/7; PPV null 일치/불일치; skipped | 100% | 판정 status·matched/mismatched 정확 | 독립 Fraction 기대값(T2 C4) |
| V3 | F7,F6,C3,C13 | buildResult | unit + integration | decision table | state partial/completed × prediction status 5종 × help 4종(pairwise 축소 금지, 4차원 pending/skipped 각 1) | 100% | Node validateDocument ok, session 값·visibility·previousResponseId 일치 | contracts/index.mjs 로 검증 |
| V4 | F1,F8,C10,C11 | validateSessionConfig, loadProgress/saveProgress, build CLI | unit + integration | syntax + equivalence partitioning | 5필드 각 valid/missing/type/format, extra, 비객체 root; storage 손상 JSON/schemaVersion/lesson·result 불일치/getItem 예외/setItem 예외/정상 | 100% | 지정 code·path, 빌드 exit≠0·dist 불변, 알림 상태 | 임시 디렉터리 빌드, fake storage |
| V5 | F2,F4,F5,F7,F10,C1–C3,C6,C7,C9,C14 | 빌드된 페이지(설치 Chrome) | end-to-end, 시나리오별 1회 | scenario | S1 키보드만 C3 흐름; S2 C2 조작 순서; S3 C6 경계 6값; S4 C7; S5 왕복 링크·새로고침·탭 재열기(C9); S6 새 사례 공개 전 DOM 부재; S7 다운로드 파일 validateDocument; S8 요청 기록 | 100% | 각 시나리오 기대 결과, 외부 요청 0 | tests/e2e, Playwright channel chrome |
| V6 | Q2,Q4,Q6 | 페이지 품질 | end-to-end | scenario | axe 4상태; 갱신 시간 20회 p95; serve 인자 127.0.0.1·-c-1 | 100% | 위반0, p95≤100ms, 바인딩 | e2e 보고에 측정값·Chrome 버전 기록 |
| V8 | F2,F8,C10 | 저장 오류·초기화·격자 칸 수(v7) | end-to-end, 시나리오별 1회 | scenario | S9 손상 값, S10 저장 불가, S11 초기화 확인/취소, S12 격자 data-cells 4입력 | 100% | v7 Verifier-1 resolutions 기대 결과 | tests/e2e |
| V7 | Q3,Q7,Q8,F9 | 통합·검토 | integration + review | statement coverage (Node coverage, learning/*.mjs) + review | line/function 100%; T1/T2 회귀; R1–R3 | 100% | verify exit0, 부족 시 exit≠0 | main ledger R1–R3 |

R1: 화면 문구 — (1) A 관찰 범위 표현 (2) B 사실/지지 분리 (3) 검사 A/B 찬반 대칭 (4) 사람·능력·점수 판정 문구 없음 (5) 가상 수치·성능 유지 가정·실제 조치 금지 (6) 다운로드≠map 저장 안내 (7) PPV null·소수 예상 개수 설명 (8) 판정이 이번 조건의 관찰이라는 의미.
R2: package.json 직접 버전 고정(@observablehq/framework 1.13.4, http-server, @playwright/test, @axe-core/playwright), lockfile 존재, dist의 외부 URL 문자열 검사, serve 인자, 라이선스 기록.
R3: 색 외 상태 구분, 시각화 표 대체, 초점 표시 가시성, 개념 카드 Escape/초점 복귀를 Chrome에서 수동 확인.
제외 기법: branch/MC/DC는 요구하지 않음(기존 정책과 동일 line/function 100%). 무작위·성능 부하·다중 브라우저는 범위 밖.

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | http-server, 127.0.0.1, -c-1 | 사용자 선택 | 2026-10-05 질의 답변 |
| A2 | Playwright e2e, 설치 Chrome | 사용자 선택; Chrome 자동 업데이트로 버전 변동 가능 | 질의 답변 |
| A3 | T1 result v1 직접 내보내기 | 사용자 선택 | 질의 답변 |
| A4 | localStorage 유지 | 사용자 선택 | 질의 답변 |
| A5 | 키보드 e2e + axe WCAG 2.2 A/AA + 수동 | 사용자 선택 | 질의 답변 |
| A6 | 갱신 p95 ≤100ms, 20회 | 사용자 선택 | 질의 답변 |
| A7 | 허용 오차 ±1개·±1%p 판정, rubric 문구 수정 | 사용자 선택; T2 산출물 문구 변경 | 질의 답변 |
| A8 | session 설정 빌드 주입 | 사용자 선택 | 질의 답변 |
| A9 | Paths·Signatures·Action 목록·localStorage key·판정 경계 해석(“≤1”) | 계획 승인 시 제안 경로; 세부는 이 spec 승인으로 확정 | 2026-10-05 사용자 spec v1 전체 승인 |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| U1,F1,F2,F7 | C1–C3,C6,C7,C11,C13,C14 | V3,V4,V5 | e2e·빌드·validateDocument |
| U2,F3,F5,F6 | C4,C5,C8,C12 | V1,V2,V5 | 상태표·경계·DOM 부재 |
| F4,F8 | C9,C10 | V4,V5 | storage·e2e |
| F9 | — | V7 | R1 |
| F10,Q4 | C3 | V5,V6,V7 | 키보드·axe·R3 |
| Q2 | — | V6 | 측정 |
| Q3,Q6,Q7 | C14 | V5–V7 | verify·R2 |
| Q1,Q5,Q8 | C1–C14 | V1–V7 | 전체 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 5 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state:
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| V1–V8 | 7 | verify6 log, revision 798502a6e66ce58e95b0e3b7f8b6dce852e16b7a7febf1dff296891e0ddfc78d | accepted | verifier2 pass: EG1–EG7·SC1·SC2 closed, V1–V8 accepted; mutations M1–M6 실행·의도 assertion 검출·복원 | 구현·테스트 변경 시 영향 재평가 |

Execution ledger:
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | 시작 | T2 complete, 활성 spec 없음 verified | 사용자 결정 A1–A8로 spec v1 초안 | 사용자 전체 승인, active |

| 2 | 구현/테스트 spec challenge | action·stage·평가 매핑 미지정 verified | 사용자 결정(맥락→예측→시뮬레이션, help unknown, session ≥1, MedCalc 허용)으로 v3; v4 재시도 visibility 정정 | correction batch1 |
| 3 | verify1: node 2 fail, learning coverage line96.47/func96.52 | C8 test defect(기본 예측 건너뜀은 판정 대상 아님); 미선언 공개 동작 verified | v5 Signatures에 predictionState·validateResultShape·오류 정렬 명시, 테스트 보강 | correction batch2 |
| 4 | e2e1: 6 fail | 구현 결함 I1 최초 예측 값 미표시, I2 공개 후 입력 편집 가능, spec 공백 I3 serve 준비 전 URL; 테스트 결함 T1–T4 verified | v6 명확화, 구현·테스트 각각 수정 | 같은 batch2 |
| 5 | verify2/3: S2 innerText/textContent, serve ECONNRESET·hang up | 테스트 결함 verified(텍스트 결합 미지정, 쓰기 거부는 연결 종료 허용) | 필드별 값 비교, 쓰기 메서드 연결 오류=거부 | correction batch3 |
| 6 | verify4 | — | npm run verify exit0 | node 2279/2279, e2e 31/31, learning line/func 100%, Chrome 154.0.8037.97 p95 0.80ms, axe 0 |
| 7 | R1–R3 검토 | — | 아래 Review evidence | 모두 pass; verifier1 배정 |

## Review evidence revision 91853433264719f0f0d91436c56ab5782d3cc61685b3d1becc75ea5abc40b9a8
| review item | inputs and observation | expected result / disposition |
| --- | --- | --- |
| R1 | site/src/components/content.js, ui.js feedback()/choice: 사실(A) 문장에 조건·항목 수, 지지(B) 문장 분리; choice-pro/con 동일 구조(근거·수치·유리 조건·필요 정보); 능력/점수/순위 문구 grep 0; SAFETY_NOTICE 가상·가정·조치 금지; EXPORT_NOTICE map 저장 아님; NUMBER_NOTES PPV null·소수 개수; OBSERVATION_NOTICE 이번 조건 관찰 | pass |
| R2 | devDependencies 정확 고정 @observablehq/framework 1.13.4 ISC, http-server 14.1.1 MIT, @playwright/test 1.63.0 Apache-2.0, @axe-core/playwright 4.13.0 MPL-2.0; lockfile 존재; 빌드 dist의 http(s) 문자열은 허용 목록 MedCalc 1건뿐, a href 아님(href는 다운로드 blob·내부 앵커만); serve 127.0.0.1 -c-1, 준비 후 URL; .build-* 잔여 없음 | pass |
| R3 | 설치 Chrome 회색조 스크린샷(scratchpad r3-sim.png): 잘못된 입력 ⚠ 텍스트+점선 테두리, 판정 상태 기호(✓△·–…)+문구, 격자 패턴 채움·aria-label·표 대체; CSS :focus-visible 3px 외곽선; 개념 카드 Escape 후 초점이 트리거로 복귀 확인 | pass |

| 8 | verifier1 retry: EG1–EG7, SC1–SC2 | 증거 공백 verified; SC1/SC2 사용자 결정 | spec v7, grid data-cells, 테스트 보강(transfer 표, 1e-9, 두 번째 session, 비숫자·복원, F4, UI 구동, V8 S9–S12), R1/R3 스크립트화 | correction batch4 |
| 9 | verify5/e2e5: node 3 fail, e2e 3 fail | 테스트 결함 verified(empty transfer 원본 단언, S12 기대값 입력 불일치, help-level 단계 이동) | 테스트 수정 | correction batch5 |
| 10 | verify6 | — | npm run verify exit0 | node 2349/2349, e2e 55/55, learning line/func 100%, Chrome 154.0.8037.97 p95 1.80ms |
| 11 | mutations | 선택: 최초 예측 보존·결과 선공개·판정 경계는 학습 의미 핵심, 보정·session 주입·transfer 보존은 verifier1이 미검출로 지목 | seed backup→주입→verify→restore, 해시 일치 | M1 baseline 덮어쓰기: V1.C12 등 검출; M2 transfer-result 숨김 선렌더: S1·S6 검출; M3 `<1`: V2 ±1 14건 검출; M4 transfer 덮어쓰기: V1.transfer revealed/retried record 검출; M5 1e-9 제거: V2.tolerance.*.58 검출; M6 session 하드코딩: V5.S7.second-session 검출. 모두 복원 |
| 12 | R1/R3 재기록(EG6) | 반복 불가 지적 verified | scratchpad review/review-script.mjs(설치 Chrome, 로컬 dist) → review.json, R3-context/simulation-invalid/focus/reset-confirm.png | R1.1–R1.8, R3.1–R3.5 항목별 true |

| 13 | verifier2 pass | — | 새 verifier가 구현 없이 spec v7·tests·logs·review 산출물 감사 | blocking 없음. advisory A1(R1 토큰 검사·PNG 검토 증적·대상 URL/revision 기록), A2(C5 UI 수준 경계는 단위 증거) 비차단. correction 5회, verifier 2회, complete |

Mutation 후보(main 최종 선택): M1 공개 후 최초 예측 덮어쓰기 허용, M2 새 사례 결과 공개 전 렌더링, M3 판정 허용 오차 경계 off-by-one(<1).

# Version Log
## v1
- ROADMAP T3와 사용자 결정 A1–A8로 초안 작성.
## v2
- 구현 전 테스트 역할이 구현을 보지 않고 e2e를 작성할 수 있도록 UI surface contract(data-testid·CLI 인자·표시 형식)를 명시. 기능·품질 기준 변경 없음.
## v3
- 사용자 결정: 맥락→예측→시뮬레이션 단계 흐름(출력은 예측 후 DOM 생성), 도움 기본 unknown, session을 T1 규칙(≥1, sequence/previousResultId 일관)으로 빌드에서 강제, MedCalc 출처 문자열 R2 허용 목록. 구현·테스트 보고의 spec challenge에 따라 action/progress/load/grade shape, 상태 전이 무효 칸, 평가 매핑, 스크롤 허용 오차, assessment-guide 문구 경로를 명시.
## v4
- 구현 보고: “기본 예측 response는 항상 before-output”이 T1의 재시도 after-output 규칙과 충돌. 의도(최초 예측 보존)에 맞게 최초 예측만 before-output으로 정정. 기능 의미 변경 없음. 완료 후 조작·개념 카드 위치·공개 후 재시도 초안 편집은 미지정 상태로 현재 구현 유지, 완료 보고에 기재.
- 같은 v4: Public shapes의 baseMapRevision 하한을 v3 결정(≥1)과 일치시킴.
## v5
- 첫 verify: learning 커버리지 미달(predictionState, validateResultShape, session 오류 정렬 비교자 미실행). 구현에 있으나 spec에 없던 공개 동작을 Signatures에 명시해 검증 대상으로 포함. 동작 변경 없음. C8 실패는 v3 평가 매핑상 기본 예측 건너뜀에는 판정이 없으므로 test defect로 분류.
## v6
- 첫 e2e 실행 6건 실패 분류: 구현 결함(최초 예측 값 미표시, 공개 후 최초 예측 입력 편집 가능 — v2 계약 위반), 테스트 결함(새로고침 후 stage 복원 미반영, 표시 전용 choice-pro 초점 요구, 교체된 출력 노드 관찰), spec 공백(serve URL 출력 시점). 재시도 입력 필드를 분리해 v2의 공개 후 disabled 규칙과 재시도 기능을 함께 만족하도록 명시.
## v7
- verifier1 retry: 증거 공백 EG1–EG7 수용(transfer 전이·보존, 1e-9 보정, 두 번째 session, 비숫자 입력·유효값 복원, F4 강조·Space·스크롤, 선언 UI 구동, 검토 반복성). 사용자 결정: SC1 저장·초기화 e2e·나머지 단위, SC2 범주별 data-cells 노출과 누적 반올림 규칙. V8 추가. 기능 의미 변경 없음(격자 data-cells 노출만 추가).
