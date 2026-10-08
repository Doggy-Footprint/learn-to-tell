---
version: 4
run_id: 0dcd8454f6e5111d
status: limit
base_commit: 2359115d09303e66f2efec63bb62b9492c5037cb
max_verifier_invocations: 2
handoff: agent-docs/handoff/f305f68fa49a22d3-f4-lesson-visuals-limit.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| I1 | 학습자 | 수업 화면이 상호작용적이고 시각적으로 읽기 좋은 교육 자료가 된다 | v3 lesson 화면에 사람이 읽는 입력 라벨, 슬라이더, 출력 카드, 입력 스윕 곡선, 구성 막대, 단계 진행 표시가 나타남 |
| I2 | 학습자·agent | 수치 조정 범위가 개념의 실제 사용 범위(근거 포함)를 따른다 | 슬라이더는 실사용 범위, 숫자칸은 모델 정의역, 범위 밖 값은 표시로 구분되고 근거 문장을 볼 수 있음 |
| I3 | agent | 위 두 가지가 한 예시가 아니라 앞으로 생성하는 모든 lesson에 적용된다 | lesson v3 계약·check-model·skill 문서가 실사용 범위와 시각화 선언을 요구하고 검사함 |
| I4 | 학습자 | 기존 품질(키보드·접근성·오프라인·저장 복구·결과 제출)과 v2 lesson이 깨지지 않는다 | 기존 e2e 품질 항목과 v2 빌드가 계속 통과 |

# Scope
In scope: lesson v3 계약(입력 `label`·`step`·`practical`, `visuals`), v3 의미 검사, model binding·build-lesson·place-lesson의 v3 수용, check-model의 `PROBE_SWEEP`·`PROBE_COMPOSITION`, 런타임의 v2→v3 정규화, 수업 화면 시각 개편(디자인 토큰, 단계 stepper, 슬라이더+숫자칸, 출력 카드+막대, sweep·composition SVG 차트, 합친 출력 표, 예측·피드백·개념·결정 카드 스타일), 범용 합성 v3 fixture(테스트·skill 예시용), skill 문서(SKILL.md·reference.md)의 boundary·visuals 생성 규칙, ROADMAP §5 미결 항목·handoff F4 갱신.
Out of scope: 특정 분야 lesson 내용(예: `examples/manufacturing-inspection`의 v3 전환·실사용 범위 수치) — agent가 skill 규칙으로 생성할 내용이며 기능 요구사항이 아님, result·map·diagnostic·oracle 계약 변경, 수업 단계(STAGES)·채점·저장 키 규칙 변경, 두 시나리오 나란히 고정(ROADMAP 후속), 인과 경로 강조, 다크 모드, Observable Plot 등 새 의존성, 테스트 프로젝트에 대한 skill 재설치(완료 후 main이 수행).

# Paths
Implementation: contracts/definitions.mjs, contracts/index.mjs, contracts/model.mjs, authoring/, scripts/build-lesson.mjs, learning/, site/src/, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/reference.md
Tests: tests/, playwright.config.mjs
Test command: npm run verify
Review evidence: RV1 시각 검수 — main이 v3 합성 lesson F1(테스트 fixture)을 빌드·serve하고 Chrome에서 1280px·390px 폭으로 context·simulation(공개 후)·assessment(결과 공개 후) 화면을 캡처해 `test-results/review/F4-*.png`로 남기고 Q8 체크리스트를 기록

# Signatures
lesson v3 = lesson v2 필드 전부 + 아래 변경. `version: 3`.
- `inputs[]`: `{inputId: id, label: 비어 있지 않은 string, unit: string, min: number, max: number, default: number, step: number(>0), practical: {min: number, max: number, basis: 비어 있지 않은 string}}`
- `visuals[]`(1개 이상): `{visualId: id, kind: 'sweep'|'composition', inputId: id|null, outputIds: id[](1개 이상), caption: 비어 있지 않은 string}`
v1·v2 정의와 의미 검사는 불변.
Module `contracts/model.mjs`: `validateModelBinding`·`validateOracleBinding`의 lesson intake는 version 2와 3을 받는다(그 외 `VERSION /lesson/version`).
CLI `build-lesson`: v2·v3 lesson 수용, v1은 기존대로 `VERSION /version`.
`place-lesson`: v2·v3 수용, 그 외 `VERSION /version`(기존 문구 "lesson v2 문서만"은 "lesson v2·v3 문서만"으로).
check-model 새 오류: `PROBE_SWEEP /visuals/<index>`, `PROBE_COMPOSITION /visuals/<index>` (v3 lesson에만 적용).
Module `learning/progress.mjs`: `createRuntime(lesson, model)`의 `runtime.inputs` 항목은 항상 `{inputId, label, unit, min, max, default, step, practical: {min, max, basis}}` 형태(v2는 R9 기본값), `runtime.visuals`는 배열(v2는 `[]`). 그 외 반환 필드 불변. 새 export `sweepPoints(runtime, visual, inputs, count = 41) → [{x, values: {outputId: 표시값|null}}]`(R14 규칙), `compositionShares(runtime, visual, display) → [{outputId, value, share}]`(R15 규칙).
testid(새로 추가, 기존 testid는 아래 변경 외 유지):
- `stage-stepper`, 단계 항목 `stepper-<stage>`(현재 단계 `aria-current="step"`, 도달한 단계는 button)
- `slider-<inputId>`(type=range), `practical-range-<inputId>`(실사용 범위 문구), `practical-out-<inputId>`(실사용 범위 밖 배지, 범위 안이면 DOM에 없음), `practical-basis-<inputId>`(근거 `<details>`)
- `output-group-<n>`(unit 그룹 컨테이너, n = 0부터 unit 첫 등장 순서, `data-unit` = unit), `output-card-<outputId>`(현재 값 카드, 소속 그룹 안에 outputs 순서), `output-delta-<outputId>`(직전 대비 문구), `bar-previous-<outputId>`(직전 값 마커, 직전 값이 있고 non-null일 때만, `data-value` = 직전 raw)
- `visual-<visualId>`(차트 컨테이너, `role="img"`가 있는 svg와 aria-label 요약 포함), sweep: `sweep-line-<visualId>-<outputId>`, `sweep-point-<visualId>-<outputId>`(`data-x`=현재 입력값, `data-y`=현재 표시값), `sweep-previous-<visualId>-<outputId>`(직전 입력이 있고 해당 입력값이 다를 때만, `data-x` = 직전 확정 입력값, `data-y` = 직전 확정 입력 전체로 계산한 표시값; 그 값이 null이면 없음); composition: `composition-<visualId>-<outputId>`(`data-share`, 폭 % = share·100, DOM·화면 순서 = visual `outputIds`), `composition-previous-<visualId>-<outputId>`(직전 확정 입력이 있을 때만, 같은 규칙의 `data-share`·폭), `composition-legend-<visualId>`(항목 순서 = `outputIds`)
- `simulation-guidance`(출력 표 바로 뒤의 표 읽기 안내 문단; R16 "안내 문구들"의 첫 요소. `safety-notice`는 페이지 상단 고정 안내로 R16 순서 대상 아님)
- `output-table`은 한 표로 합침: 열 = 항목·현재·직전·변화. 현재 셀 `[data-output=<outputId>]`(기존 위치 의미 유지), 직전 셀 `[data-previous=<outputId>]`, 변화 셀 `[data-change=<outputId>]`. `output-previous`·`output-change` testid는 제거.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| R1 | lesson v3 구조: Signatures 필드가 모두 필수. 누락 `REQUIRED`, 타입 `TYPE`, 빈 문자열(`label`, `basis`, `caption`) `VALUE`, `step <= 0` `RANGE /…/step`, `visuals` 0개 `RANGE /visuals`, 알 수 없는 필드 `UNKNOWN_FIELD`. v2 lesson에 v3 필드를 넣으면 `UNKNOWN_FIELD` | must | 계획 결정 2 |
| R2 | v3 입력 의미 검사(입력 i, 기존 min<max·min≤default≤max 검사 유지): `practical.min < min` → `RANGE /inputs/i/practical/min`; `practical.max > max` → `RANGE /inputs/i/practical/max`; `practical.min >= practical.max` → `RANGE /inputs/i/practical/max`; default가 practical 밖 → `RANGE /inputs/i/default`; `step > practical.max - practical.min` → `RANGE /inputs/i/step`. 시나리오 값은 정의역 안이면 practical 밖이어도 유효 | must | 계획 결정 1 |
| R3 | v3 visuals 의미 검사(visual i): visualId 중복 `DUPLICATE /visuals/i/visualId`; sweep인데 inputId null → `STATE /visuals/i/inputId`; composition인데 inputId non-null → `STATE /visuals/i/inputId`; inputId가 inputs에 없음 → `REFERENCE /visuals/i/inputId`; outputIds 각 항목 미존재 `REFERENCE /visuals/i/outputIds/j`, 중복 `DUPLICATE /visuals/i/outputIds/j`; 존재하는 outputIds의 unit이 둘 이상 → `STATE /visuals/i/outputIds`; composition outputIds 1개 → `RANGE /visuals/i/outputIds`; composition에 nullable 출력 → `STATE /visuals/i/outputIds/j` | must | 계획 결정 3 |
| R4 | v3는 lesson 계약을 쓰는 모든 경로에서 v2와 같은 의미 검사(시나리오·transfer·tolerance 등)를 받는다. map에 v3 lesson이 들어가도 map 검증이 같은 규칙을 적용하고, result import는 v3 lesson으로도 v2와 동일하게 동작한다 | must | 호환 |
| R5 | `validateModelBinding`·`validateOracleBinding`·`build-lesson`·`place-lesson`은 v3를 v2와 동일하게 처리한다(R4 Signatures) | must | 호환 |
| R6 | check-model(v3 lesson): sweep visual i마다 practical 범위를 양끝 포함 41점 등간격 샘플, 다른 입력은 default로 계산. 한 점이라도 `ok !== true`이거나 visual의 outputIds 중 non-nullable 출력이 비유한값이면 `PROBE_SWEEP /visuals/i` 1건. 예외(throw)는 기존 `THROW` 규칙 | must | 계획 §2 |
| R7 | check-model(v3 lesson): composition visual i의 outputIds 값이 기존 probe 집합과 모든 sweep 샘플 중 `ok:true`인 결과에서 하나라도 음수이면 `PROBE_COMPOSITION /visuals/i` 1건. 합이 일정할 것은 요구하지 않음 | must | 계획 §2(전체가 입력에 따라 변하는 모델 허용) |
| R8 | v2 lesson의 check-model 결과는 이전과 동일(새 probe 미적용) | must | 호환 |
| R9 | `createRuntime` v2 정규화: `label` = inputId, `step` = (max−min)/100, `practical` = `{min, max, basis: ''}`, `visuals` = `[]`. v3는 lesson 값을 그대로 사용 | must | 계획 결정 2 |
| R10 | 입력 행: 라벨 텍스트 `<label> (<unit>)`; 슬라이더 `slider-<id>`의 min/max/step = practical.min/practical.max/step, 값 = 현재 입력을 practical 범위로 clamp(격자 practical.min + k·step 밖의 값은 브라우저 snap 허용 — 정확한 값의 기준은 숫자칸, 계약에 격자 규칙 없음); 숫자칸 `input-<id>`는 기존 정의역 검증·오류 문구·testid 유지. `practical-range-<id>`에 `실사용 범위 <practical.min>–<practical.max><unit>` 표시(v2는 정의역과 같으므로 `범위 <min>–<max><unit>`). 현재 입력이 practical 밖이면 `practical-out-<id>` 배지 `현실 범위 밖(모델로는 계산 가능)`. basis가 비어 있지 않으면 `practical-basis-<id>` details(요약 `이 범위의 근거`, 본문 = basis) | must | 계획 결정 1 |
| R11 | 슬라이더 동작: `input` 이벤트는 진행 상태를 바꾸지 않고 미리보기 입력(현재 입력 + 그 값)으로 출력 카드·막대·차트·표 현재 값을 다시 그리며, 해당 숫자칸도 미리보기 값을 보인다. `change` 이벤트에서 `setInput`을 dispatch해 확정(직전 값은 드래그 시작 전 확정 입력). 숫자칸 변경·시나리오·초기화는 미리보기를 버린다. 숫자칸 동작은 기존과 동일 | must | 직전 비교 의미 보존 |
| R12 | 출력 카드: 출력마다 `output-card-<id>`에 label, 현재 표시값 `formatCount` + unit(또는 `정의되지 않음`), 기존 막대 `bar-<id>`(같은 unit 안 |v|/max|v| 폭, `data-value` raw — 기존 R6 규칙)과 직전 마커 `bar-previous-<id>`(같은 정규화 기준의 위치, 100% 초과는 막대 끝 100%에 표시; 현재 값이 null이어도 직전 값이 non-null이면 표시), `output-delta-<id>` 문구: 직전 없음 `직전 값 없음`, 둘 다 수 `직전 대비 ▲ +x`/`▼ −x`/`변화 없음`(x = formatCount(|현재−직전|)), null 관련 `정의 여부가 달라짐`/`변화 없음`. 카드는 unit별로 묶어 보인다(`output-group-<n>`: unit 첫 등장 순서, 그룹 안은 outputs 순서) | must | 계획 §3 |
| R13 | 출력 표 `output-table`: 행 = outputs 순서, 열 = 항목(`label (unit)`)·현재·직전·변화. 현재·직전 셀은 formatCount 또는 `정의되지 않음`, 직전 없음은 `—`, 변화 셀은 기존 비교 문구(둘 다 수: 증가 `+` + formatCount(현재−직전), 그 외 formatCount(현재−직전) — 감소는 음수 부호, 같으면 `0`; null 관련 `변화 없음`/`정의 여부가 달라짐`; 직전 없으면 `—`). caption 문구 = `현재 입력(<label> <formatCount(값)><unit> · …)의 출력`(inputs 선언 순서, ` · `로 연결, 미리보기 중이면 미리보기 입력) | must | 계획 결정 5 |
| R14 | sweep 차트: x 정의역 = [min(practical.min, 현재값), max(practical.max, 현재값)]; 41점 등간격(양끝 포함), 다른 입력은 현재(미리보기 포함) 입력; 각 점의 값 = 표시값(raw·scale), `ok:false` 또는 null 점은 선을 끊는다. outputId마다 선 `sweep-line-…`과 현재 점 `sweep-point-…`(`data-x`, `data-y`), 직전 확정 입력의 해당 값이 현재와 다르면 `sweep-previous-…`(점선 테두리 고스트, 직전 확정 입력 기준 계산). y축 = [min(0, 최소), 최대](모두 같으면 ±1). 축에 양끝 눈금과 단위, 범례(선마다 다른 대시 패턴 + 라벨). svg `role="img"` aria-label = `<caption>. <입력 label>이 <a>에서 <b><unit>로 바뀔 때 <출력 label> <ymin>–<ymax><unit>; 현재 <x><unit>에서 <y><unit>`(출력별 반복, `, `로 연결; ymin–ymax는 그 차트의 공통 y축 범위) | must | 계획 결정 3 |
| R15 | composition 차트: 현재 표시값으로 share = value/Σvalue(Σ=0이면 모두 0), 가로 100% 막대에 visual의 `outputIds` 순서로 세그먼트 `composition-…`(폭 = share·100%, 세그먼트마다 다른 패턴 채움), 범례 `composition-legend-<visualId>`에 `label: 값 unit (share·100을 formatCount한 %)`. 직전 확정 입력이 있으면 아래에 `직전` 막대를 같은 규칙으로 표시. aria-label = caption + 범례 문구 나열 | must | 계획 결정 3 |
| R16 | 시뮬레이션 블록 순서: simulation content → 시나리오·초기화 → 입력 행 → stale 안내 → 출력 카드 → visuals(선언 순서, 각 caption 제목) → 출력 표 → 안내 문구들 → 설명 링크. v2는 visuals 없음 | must | 계획 §3 |
| R17 | 단계 stepper `stage-stepper`: 6단계 순서 목록, 현재 단계 `aria-current="step"`, 도달한(reached 이하) 다른 단계는 button으로 `goToStage`, 미도달 단계는 비활성 텍스트, 완료(현재보다 앞) 단계에 `✓` 기호. 기존 `stage-indicator` 문구·`stage-back`·`stage-next` 유지 | must | 계획 §3 |
| R18 | 시각 스타일: `:root` 디자인 토큰(색·간격·반경·그림자), 카드형 섹션, 주/보조 버튼 위계(주: 예측 기록·다음 단계·결과 제출), 피드백·안내·오류 callout, 개념 칩, 결정 카드. 상태 구분은 색만으로 하지 않음(기호·패턴·문구 병행). `prefers-reduced-motion: reduce`이면 전환 애니메이션 없음. 390px 폭에서 가로 스크롤 없음 | must | ROADMAP §5 |
| R19 | skill 문서: SKILL.md 4단계와 reference.md에 lesson v3를 생성 대상으로 명시하고 boundary 규칙을 둔다 — 정의역(`min`/`max`, 모델 RANGE와 동일), 실사용 범위(`practical`, 실제 현장·사용자 상황에서 관찰되는 범위, `basis`에 출처·근거, 근거가 약하면 불확실하다고 명시), `default`는 practical 안의 대표값, `step`은 의미 있는 최소 변화량, visuals는 결정 변수마다 sweep 1개 이상·부분-전체 출력이 있으면 composition, practical 밖 시나리오는 failure content에서 설명할 때만. 6단계 독립 검증 체크리스트에 practical 범위·basis 사실성 포함. check-model 오류 표에 `PROBE_SWEEP`·`PROBE_COMPOSITION`. 예시 파일 안내는 v3 합성 fixture F1(`tests/fixtures/learning/synthetic-lesson-v3.json`과 그 model·oracle) | must | I3 |

# Errors
- v3 구조·의미 위반(validateDocument, place-lesson, build-lesson, check-model) — 해당 코드·경로(R1–R3), 기존 실패 상태(배치 파일 없음, `dist/` 불변) 유지
- check-model probe 실패 — `PROBE_SWEEP`/`PROBE_COMPOSITION` outcome `CHECK`, 배치 없음
- 런타임에서 sweep 점 계산 `ok:false` — 해당 점에서 선을 끊고 화면 오류 없음; 현재 입력 계산 실패는 기존 stale 규칙
- 슬라이더 미리보기 중 숫자칸 오류 입력 — 미리보기 폐기, 기존 오류 표시
- v2 lesson — 오류 없음, R9 기본값으로 렌더

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | v3 합성 lesson F1(A5) + model로 빌드, 키보드만으로 전 단계 진행·결과 제출 | result 계약 통과, 입력마다 `<label> (<unit>)` 라벨과 슬라이더, 선언한 visuals 전부 표시 |
| C2 | normal | F1 기본값에서 각 sweep visual | 출력마다 현재 점 data-x = 해당 입력 default, data-y = 테스트가 fixture 수식으로 독립 계산한 표시값; 선 존재 |
| C3 | normal | 슬라이더 키보드 →(1 step) | 입력 = default + step, `setInput` 확정, 직전 = default, delta 문구가 계산 방향(▲/▼)과 일치 |
| C4 | normal | 슬라이더 드래그 중(input 이벤트만) | 카드·차트 현재 값 갱신, 저장 progress.inputs 불변, 직전 불변 |
| C5 | boundary | 숫자칸 = practical.min, practical.max / practical.min − step/10, practical.max + step/10 / 정의역 min, max / min − 0.01, max + 0.01 | 배지 없음 / 배지 있음 / 배지 있음 / 기존 RANGE 오류 |
| C6 | boundary | practical.min = min, practical.max = max, step = practical 폭 | 유효 |
| C7 | error | practical.min < min, practical.max > max, practical.min = practical.max, default 밖, step 0, step > 폭, basis 공백, label 공백 | R1·R2 코드·경로 |
| C8 | error | visuals 0개, visualId 중복, sweep inputId null, composition inputId 있음, 없는 inputId/outputId, outputId 중복, unit 혼합, composition 출력 1개, composition nullable 출력 | R3 코드·경로 |
| C9 | error | 모델이 practical 내부 한 점에서 ok:false / NaN / composition 출력 음수 | PROBE_SWEEP / PROBE_SWEEP / PROBE_COMPOSITION, 배치 없음 |
| C10 | normal | 기존 v2 fixture(제조 검사 v2·물탱크 v2) 빌드 | 기존 흐름 통과, 라벨 = inputId, visuals 없음, 슬라이더 범위 = 정의역 |
| C11 | normal | F1 composition 기본값 | 세그먼트 share = 독립 계산 value/Σ, 폭·범례 문구 일치 |
| C12 | edge | F1 sweep 구간 안에서 nullable 출력이 null이 되는 점 | 그 점에서 선이 끊기고 오류 없음 |
| C13 | edge | 숫자칸으로 입력을 practical.max < v ≤ max인 v로 | 슬라이더 값 = practical.max(clamp), 해당 sweep x 상한 = v, 현재 점 data-x = v |
| C14 | normal | v3 lesson을 map import·결과 import | v2와 동일한 outcome |
| C15 | normal | stepper에서 도달한 이전 단계 클릭 | 해당 단계로 이동, aria-current 갱신; 미도달 단계는 button 아님 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 계약 검사·차트 값·확정/미리보기 의미 |
| Performance efficiency | yes | 슬라이더 조작마다 sweep 재계산 |
| Compatibility | yes | v2 lesson·기존 map·result 경로 유지 |
| Interaction capability | yes | 슬라이더·차트의 키보드·스크린리더·모바일 사용성 |
| Reliability | yes | 저장 복구·빌드 실패 보존 유지 |
| Security | yes | 오프라인·loopback 전용 유지(새 외부 자원 없음) |
| Maintainability | yes | 100% line/function coverage 정책 유지 |
| Flexibility | yes | 임의 v3 lesson(입력·출력·visual 수 가변)에 적응 |
| Safety | yes | 실사용 범위·근거가 실제 조치 근거로 오인되지 않게 안전 문구 유지 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Functional suitability / correctness | C1–C15 | 사례 통과율, % | = 100% | automated + mutation | spec |
| Q2 | Performance / time behaviour | 로컬 Chrome, F1 빌드, 슬라이더 키보드 1 step 20회 | 키 입력부터 sweep 현재 점 data-x 갱신 확인까지, ms | p95 ≤ 100ms | automated | T3 Q2 |
| Q3 | Compatibility / interoperability | 기존 v2 fixture 빌드, v3 결과 import | 기존 e2e·map import 통과 | 실패 0건 | automated | I4 |
| Q4 | Interaction capability / accessibility | F1: 공개 전·공개 후·새 사례 결과·힌트 열림 4상태; F2 1상태 | axe WCAG 2.2 A/AA 위반 수; 키보드 전용 흐름(C1); 390px 폭 `document.documentElement.scrollWidth − clientWidth` | 위반 0, 100%, ≤ 0px | automated | T3 Q4, R18 |
| Q5 | Reliability / recoverability | 새로고침·손상·저장 불가·키 불일치, 빌드 실패 | 기존 storage e2e, 빌드 실패 후 dist 바이트 비교 | 100%, 차이 0 | automated | T3 Q5 |
| Q6 | Security / confidentiality | v3 수업 전 과정 | 비-127.0.0.1 요청 수 | 0건 | automated | T3 Q6 |
| Q7 | Maintainability / testability | 기존 coverage include 전체 | node line·function coverage % | 100% / 100% | automated | 기존 정책 |
| Q8 | Interaction capability / user engagement + Safety | RV1 캡처 6장(F1의 context·simulation 공개 후·assessment 결과 후 × 1280px·390px) | 체크리스트: (a) 입력 라벨이 사람이 읽는 이름 (b) 슬라이더와 실사용 범위·근거 노출 (c) sweep·composition이 잘리지 않고 범례·축 단위 판독 가능 (d) 카드·표 값이 같은 수 (e) 390px에서 겹침·잘림 없음 (f) safety-notice 유지 | 6/6 | review | 사용자 피드백 F4 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | R1, R2, C6, C7 | validateDocument(lesson v3/v2) | unit | boundary value analysis (2-value) + equivalence partitioning | practical.min {= min, min−0.01}; practical.max {= max, max+0.01}; practical 폭 {>0, =0}; default {practical.min, practical.min−0.01, practical.max, practical.max+0.01}; step {폭, 폭+0.01, 0, −1}; label·basis·caption {유효, 공백, 숫자, 누락}; v2에 `label` 추가; v3 누락(REQUIRED)·타입(TYPE) {visuals, inputs[i].step, inputs[i].practical, practical.min, practical.max, visuals[i].visualId·kind·inputId·outputIds·caption}; v3 알 수 없는 필드(최상위, inputs[i], practical, visuals[i]) UNKNOWN_FIELD; v2에 `step`·`practical`·`visuals` 각각 UNKNOWN_FIELD | 100% | 코드·경로 정확 일치 | tests/contracts-v3.test.mjs |
| V2 | R3, C8 | validateDocument(lesson v3) visuals | unit | decision table | 규칙 행: {visuals 0, 중복 visualId, sweep×inputId{null, 존재, 미존재}, composition×inputId{null, non-null}, outputId 미존재, outputId 중복, unit 혼합, composition 출력 1개, composition nullable, 유효 sweep, 유효 composition} | 100% | R3 코드·경로 | tests/contracts-v3.test.mjs |
| V3 | R4, R5, C14 | map 검증, map import·result import, validateModelBinding, validateOracleBinding, build-lesson, place-lesson | unit + integration(실제 node 프로세스) | equivalence partitioning | lesson version {2, 3, 1(build·place 거부), 4(VERSION)} × 표면 6종; v3 map 안 lesson의 R2 위반 1건; v2 의미 검사 동등성: F1(v3)에 v2 의미 위반 클래스별 1건(시나리오 입력 참조, 시나리오 값 정의역 밖, transfer 시나리오 참조, tolerance 출력 참조 — v2 계약이 정의한 클래스 전부)을 넣어 validateDocument·map·bundle에서 v2 형태와 같은 코드·경로 | 100% | v3 결과 = v2 결과(성공 outcome 동일 형태), 거부 코드 | tests/contracts-v3.test.mjs, tests/build.test.mjs, tests/lesson-cli.test.mjs, tests/knowledge.test.mjs |
| V4 | R6, R7, R8, C9 | checkModel | integration(child process) | equivalence partitioning + boundary value analysis (2-value) | sweep 실패 위치 {practical.min, 내부 1점, practical.max, practical 밖만(=통과)}; 실패 종류 {ok:false, NaN, Infinity, nullable 출력 null(=통과)}; composition {음수 1회, 0(=통과)}; v2 lesson에 같은 결함 모델(=새 코드 없음) | 100% | 코드·경로 | tests/authoring.test.mjs |
| V5 | R9, R14, R15 | createRuntime, sweepPoints, compositionShares | unit | equivalence partitioning + boundary value analysis | v2 정규화 필드 4종; sweep 점 수 41·양끝 x; 현재값 {practical 안, 위로 밖, 아래로 밖}; ok:false 점 → values null; scale 적용; composition Σ {>0, 0}; null 없음 | 100% | 독립 계산 기대값 비교 | tests/learning.test.mjs |
| V6 | R10, R11, C3, C4, C5, C13, Q2 | 빌드된 F1 수업 입력 행 | end-to-end (Playwright Chrome) | state transition | 상태 {확정, 미리보기 중, 미리보기 후 change, 미리보기 중 숫자칸 입력, 미리보기 중 정의역 밖 숫자칸 입력(오류 표시·미리보기 폐기·저장 불변), 미리보기 중 시나리오, 미리보기 중 초기화} × 관찰 {progress.inputs(localStorage), 직전 셀, 슬라이더 값, 숫자칸 값(미리보기 중 = 미리보기 값)}; 숫자칸 C5 값(practical ≠ 정의역인 입력 1개 이상)의 배지 유무; clamp C13; 키보드 1 step 20회 p95 | 100% | 기대 상태·값 | tests/e2e/visuals.spec.mjs |
| V7 | R12, R13, R14, R15, R16, C2, C11, C12 | 빌드된 F1 수업 출력 | end-to-end | equivalence partitioning | 카드 delta 문구 6종(직전 없음, ▲, ▼, 변화 없음, 정의 여부 달라짐, null→null); 막대 폭·마커; 표 4열 문자열; sweep 점 data-x/data-y = 독립 계산, 선 개수, previous 고스트 유무 2상태 + 고스트 data-x/data-y, null 구간 끊김, 비기본 확정 상태 1개·미리보기 상태 1개에서 전체 aria-label(R14 템플릿); composition share·폭(상태 변경 후 포함)·세그먼트와 범례 순서, 직전 막대 share·폭; 표 caption 문구(기본·변경 후); unit 그룹(F3: 그룹 수·순서·data-unit·소속 카드 순서); 블록 순서 R16 전체(안내 문구·설명 링크 포함) | 100% | 테스트가 fixture 수식으로 독립 계산한 리터럴과 비교 | tests/e2e/visuals.spec.mjs |
| V8 | R17, C15 | stepper | end-to-end | state transition | {context 최초, 단계 진행 후 이전 단계 button 클릭, 미도달 단계 비button, aria-current 이동, ✓ 기호} | 100% | DOM 상태 | tests/e2e/visuals.spec.mjs |
| V9 | R18, Q4 | F1·F2 수업 화면 | end-to-end | scenario testing | axe 5상태; 390px 가로 스크롤 2상태(simulation 공개 후, assessment 결과 후); reduced-motion에서 computed `transition-duration` 0s(카드·버튼) | 100% | 위반 0, ≤0px, 0s | tests/e2e/quality.spec.mjs |
| V10 | I4, Q3, Q5, Q6, C10 | 기존 e2e 전체(기존 v2 fixture 기준) | end-to-end | scenario testing | 기존 시나리오 전부를 합친 표 testid(R13)로 이관; v2 라벨·visuals 없음·슬라이더 범위=정의역 | 100% | 기존 기대 | tests/e2e/*.spec.mjs |
| V11 | R19 | skill 문서 | unit(text) | syntax testing | SKILL.md 포함 문자열 {`practical`, `basis`, `step`, `visuals`, `sweep`, `composition`, `실사용 범위`, `정의역`}; reference.md 포함 {`"version": 3`, `practical`, `basis`, `visuals`, `PROBE_SWEEP`, `PROBE_COMPOSITION`, `synthetic-lesson-v3.json`} | 100% | 포함 | tests/skill-docs.test.mjs |
| V12 | Q7 | 기존 coverage include | structure-based: statement + function (node --experimental-test-coverage) | include 전체 | 100% / 100% | npm run verify 통과 | npm run verify |
| V13 | Q8 | 캡처 6장 | review | error guessing | 체크리스트 (a)–(f) | none — experience-based | 6/6 | RV1 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | 정의역(min/max)과 실사용 범위(practical) 분리, 슬라이더=practical, 숫자칸=정의역 | 모델이 계산 가능한 범위(정의역)가 실제로 쓰이는 범위보다 넓으면 슬라이더 대부분이 의미 없는 구간이 되고 의미 있는 구간의 조작 해상도가 낮아짐 | 사용자 위임("알잘딱깔센") + 계획 승인(2026-10-07) |
| A2 | lesson v3 추가, v1·v2 유지, v2는 기본값 렌더 | 계약 엔진에 선택 필드 없음(`contracts/index.mjs:93-101`) | 위와 같음 |
| A3 | 차트는 인라인 SVG 직접 생성, 새 의존성 없음 | 오프라인 빌드·기존 vanilla DOM | 위와 같음 |
| A4 | 슬라이더는 change에서만 확정(R11) | input마다 dispatch하면 직전 값이 한 틱 전 값이 됨(`learning/progress.mjs:101-104`) | 위임 범위 안 main 결정 |
| A5 | v3 검증은 테스트가 정의하는 범용 합성 fixture로만 한다. F1: 입력 2개 이상(모두 practical이 정의역보다 좁음), sweep 2개 이상, composition 1개, sweep 구간 안에서 null이 되는 nullable 출력 1개 이상, 출력 unit 2종 이상. F2: 입력 1개·sweep 1개·composition 없음(최소 형태). F3: outputs 선언 순서에서 unit이 섞인(예: X, Y, X) v3 fixture(R12 그룹 검증용, 입력 1개 이상·visual 1개 이상). 각 fixture는 lesson·model·oracle 세트이고 기대값은 테스트가 fixture 수식으로 독립 계산. 특정 분야 수치는 spec에 넣지 않음 | 기능은 분야 무관이며 분야 내용은 skill 규칙으로 agent가 생성 | 사용자 지적(2026-10-07) |
| A6 | `PROBE_COMPOSITION`은 음수만 검사하고 합 일정은 요구하지 않음 | 전체가 입력에 따라 변하는 모델(예: 예산 배분) 허용 | 위임 범위 안 main 결정 |
| A7 | 출력 표 3개 → 1개(4열)로 합치고 `output-previous`·`output-change` testid 제거 | 교육 자료 가독성; 기존 테스트 이관 필요 | 위임 범위 안 main 결정 |
| A8 | Playwright 기본 webServer는 기존 v2 제조 검사 그대로(기존 e2e 회귀), F1·F2는 visuals.spec 등에서 별도 빌드·포트 | `tests/e2e/builds.mjs` 패턴 | 위임 범위 안 main 결정 |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| R1, R2 | C6, C7 | V1 | npm run verify |
| R3 | C8 | V2 | npm run verify |
| R4, R5 | C14 | V3 | npm run verify |
| R6, R7, R8 | C9 | V4 | npm run verify |
| R9, R14, R15 | C2, C11, C12, C13 | V5, V7 | npm run verify |
| R10, R11 | C3, C4, C5, C13 | V6 | npm run verify |
| R12, R13, R16 | C2, C11 | V7, V10 | npm run verify |
| R17 | C15 | V8 | npm run verify |
| R18 | — | V9, V13 | npm run verify, RV1 |
| R19 | — | V11 | npm run verify |
| Q1–Q7 | C1–C15 | V1–V12 | npm run verify |
| Q8 | — | V13 | RV1 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 4 |
| verifier invocations | 2 |
| open finding ids | F8 (감사 2회차, V7) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| V2, V4, V5, V8, V9, V10, V11, V12 | 4 | verify8; 감사 1회차 | accepted | 감사 1회차 accepted (V12는 verify5 coverage 100/100) | 공유 helper(tests/e2e/helpers.mjs)·fixture F1 변경 시 V9·V10 재확인 |
| V1, V3, V6 | 4 | verify8; 감사 2회차 | accepted | F1·F5·F6 closed; M1·M3 검출 | V3 A-1(클래스×표면 해석) 미결 |
| V7 | 4 | verify8; 감사 2회차 | open | F2·F3·F4·F7 closed, F8 open(카드 현재 값·null 문구); M2b 검출 | 새 run에서 보강 |
| V13 | 4 | RV1 round 2: test-results/review/F4-*.png, F4-checklist.md | accepted | 6/6 (round 1 5/6 → D3 수정) | 차트 스타일 변경 시 재캡처 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | 첫 `npm run verify`: 3245 중 1 실패 `F4-V3.place-lesson v4` (VERSION /version은 맞으나 "lesson v2·v3 문서만" 문구 없음). coverage line/func 100% | 구현 결함 D1: place-lesson이 version 1만 문구와 함께 거부, 4는 일반 계약 오류로 감 (verified, diff 확인) | spec v2 개정(challenge 해소) + 배치 1: D1 수정, R11 숫자칸 미리보기, R12·R14·R15 명시 확인 / 테스트 v2 보강 | D1 해소(node 3246/3246 pass, coverage 100/100) |
| 2 | 세 번째 verify(4321 포트 점유 프로세스는 사용자 승인 후 종료): e2e 3 실패, 9 미실행. `V6.axe.hint-open`·`F4-V9.axe F1 hint-open` color-contrast serious on `button[data-testid="hint-level-2"]`; `F4-V7.deltas and table` strict mode violation — row locator `tr … locator('th, td')`가 4요소 | D2 구현 결함: 새 버튼 스타일의 힌트 버튼 대비 부족(verified, axe); T1 테스트 결함: 행 라벨 locator가 행 헤더 셀로 좁혀지지 않음(verified, Playwright 오류) | 배치 2: implementer D2, test-implementer T1(같은 패턴 전체 점검) | D2(버튼 color/background transition 제거)·T1(`.first()`) 후 verify5 rc=0: node 3246/3246, coverage line 100·func 100, e2e 117 passed |
| 3 | verify4: node 1 실패 `O3.size` (tests/serve.test.mjs, EPIPE) | 기존 테스트의 연결 종료·쓰기 경합(hypothesis); scripts/serve.mjs·tests/serve.test.mjs 모두 이번 변경 없음 | 단독 5회 반복 0 실패, 전체 재실행 verify5 통과 | 범위 밖 기존 flaky로 기록, 수정 없음 |
| 4 | 검증자 1회차 진행 중(결과 미수신), RV1 5/6 | D3: 390px에서 SVG가 축소되어 축 글자가 읽기 어려움(verified, 캡처) | 다음: 검증자 결과 triage + D3을 묶어 수정 배치 3, verify 재실행, RV1 재캡처, mutation 2–3건 | 사용량 한도로 일시 중단 |
| 5 | 감사 1회차 retry: blocking F1(V6 미리보기 중 잘못된 숫자칸), F2(R16 순서 꼬리), F3(sweep 다른 입력=현재 입력 관찰 없음), F4(관찰수단 없는 R12·R13·R14·R15 항목), F5(R1 필수 필드 coverage), F6(v3의 v2 의미 검사 동등성), F7(composition 순서·폭); advisory A1–A9 | F4·F5 spec 누락(verified, spec 문구), 나머지 test evidence gap(verified, 감사 근거) | spec v3 개정(사용자 결정) + 배치 3: implementer = v3 관찰수단(output-group, sweep-previous data-x/y, composition-previous, caption 문구) + D3(390px 차트 글자); test-implementer = F1–F7 + F3 fixture | verify8 통과로 해소(감사 2회차에서 확인) |
| 6 | verify6: 기존 flaky `O3.size` EPIPE 재발(2/6회, 미변경 파일) → verify7: node 3292/3292, coverage 100/100, e2e 1 실패 `F4-V7.block order` (`output-table -> safety-notice` 역순), 5 미실행 | spec 누락: R16 "안내 문구들"에 testid 없음 → 테스트가 페이지 상단 `safety-notice`를 안내 문구로 가정(verified, ui.js 배치 확인) | spec v4: `simulation-guidance` testid 정의; 배치 4: implementer testid 추가, test-implementer 순서 검사에서 safety-notice → simulation-guidance | verify8 rc=0: node 3292/3292, coverage line 100·func 100, e2e 123 passed |
| 7 | 확인 mutation(감사 1회차 제안 중 강한 3 클래스) | M1 슬라이더 `input`에서 setInput(R11 상태 전이); M2 sweep 다른 입력=default(R14, 감사 F3 클래스); M3 v3가 v2 의미 검사 생략(R4, 감사 F6 클래스) — 상태 전이·차트 데이터 원천·계약 동등성으로 서로 다른 계층이며 감사가 생존 예측한 결함 포함 | M1 전체 verify: `F4-V6.previewing` 실패(의도한 assertion) → 검출. M2 1차(모든 입력 default): `F4-C13.clamp`만 실패(x 정의역 부작용) + 무관한 `V8.S11` stage 탐색 timeout → inconclusive; M2b(대상 입력만 현재, 나머지 default) 전체 verify: `F4-V7.aria and caption states` aria-label ymax 208 vs 200 실패 → 검출. M3 `node --test tests/contracts-v3.test.mjs tests/knowledge.test.mjs`: `F4-V3.v2 semantics *` 12건 실패 → 검출. 모두 seed.py restore 확인 | 3/3 검출. `V8.S11`(storage.spec, show() 400ms 단계 탐색) 1회 실패는 다른 실행에서 통과 — flaky 관찰로 기록 |
| 8 | RV1 2회차 | D3 수정 확인 | 6장 재캡처, 차트 글자 11 CSS px 측정 | 6/6, V13 accepted |
| 9 | 감사 2회차 retry: blocking F8(V7 카드 텍스트 null·비기본 확정 상태 관찰 없음), advisory A-1–A-3 | test evidence gap (verified, 감사 근거) | 수정에는 추가 감사가 필요하나 verifier 2/2 소진 → limit | handoff f305f68fa49a22d3 |

# Version Log
## v1
- 초안(승인 전 사용자 지적 반영: A1 일반 용어화, 제조 검사 v3 예시·수치 제거 → 범용 합성 fixture F1·F2). 승인된 계획 `/Users/hwansu/.claude/plans/silly-orbiting-moth.md`와 사용자 위임(2026-10-07) 반영.
## v2
- 사용자 결정(2026-10-08): 슬라이더 격자 밖 값은 브라우저 snap 허용(R10, 계약 격자 규칙 없음); 미리보기 중 숫자칸은 미리보기 값을 따름(R11, V6 관찰 확장).
- 사용자 승인(2026-10-08) 세부 규칙 명시: composition 세그먼트 순서 = visual `outputIds`(R15); sweep aria-label ymin–ymax = 공통 y축(R14); 직전 마커 100% 초과는 끝에 표시, 현재 null이어도 표시(R12).
- R13 변화 셀 문구를 기존 비교 문구 그대로 명시(감소 음수 부호, 같으면 `0`) — 동작 변경 없음, test-implementer 지적 해소.
- 근거: test-implementer challenge 1·2·3·4·6·7·10.
## v3
- 감사 1회차 F4 → 사용자 결정(2026-10-08): 네 관찰수단 모두 추가 — `output-group-<n>`(R12, fixture F3 추가), `sweep-previous` data-x/data-y(R14), `composition-previous-*`(R15), 표 caption 문구 고정(R13). 세그먼트·범례 순서 = `outputIds` 관찰 명시.
- 감사 1회차 F5 → 사용자 결정: V1 coverage에 v3 필수 필드 누락·타입, UNKNOWN_FIELD(v3·v2) 항목 추가.
- 감사 1회차 F1·F2·F3·F6·F7(evidence gap) → V3·V6·V7 coverage 항목 명시.
## v4
- R16 "안내 문구들"의 관찰수단 `simulation-guidance` 추가(동작 변경 없음, testid만). 근거: verify7 `F4-V7.block order` 실패와 test-implementer challenge 1 — `safety-notice`는 페이지 상단 고정 안내라 R16 순서 대상이 아님.
