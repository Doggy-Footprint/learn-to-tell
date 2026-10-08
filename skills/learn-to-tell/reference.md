# 문서 형식과 제약

정본은 `$LTT/contracts/definitions.mjs`(필드)와 `$LTT/contracts/index.mjs`(의미 검사)다. 아래와 다르면 정본이 맞다.
완전한 예시(lesson v3)는 `$LTT/tests/fixtures/learning/synthetic-lesson-v3.json`과 그 model·oracle 파일을 복사해 고친다. 만드는 lesson은 항상 v3다. lesson v2(`synthetic-lesson-v2.json`)는 기존 문서 호환용이며 새로 만들지 않는다.

공통: 모든 `...Id`는 `^[a-z][a-z0-9-]{0,63}$`. revision·version은 1 이상 정수. 알 수 없는 필드는 `UNKNOWN_FIELD`로 거부된다.

## diagnostic v2 (agent가 `$W/diagnostic.json`으로 직접 작성 → place-diagnostic)

```json
{"kind": "diagnostic", "version": 2, "diagnosticId": "ab-test-diagnostic", "profileId": "me", "contextKind": "work",
 "candidates": [
   {"candidateId": "sample-size", "title": "몇 명에게 보여야 하나", "decisionQuestion": "언제 실험을 멈춰도 되나?", "reason": "왜 이 후보인가", "preview": "카드에 보일 짧은 상황"}
 ],
 "selection": "sample-size", "confirmation": "confirmed",
 "hypotheses": [{"candidateId": "sample-size", "category": "unknown-concept", "rationale": "‘의외’ 반응: 검정력 개념을 모름", "status": "hypothesis"}],
 "ladder": [
   {"step": 2, "conceptId": "conversion-rate", "label": "전환율", "answer": "known", "askedBack": null},
   {"step": 3, "conceptId": "statistical-power", "label": "검정력", "answer": "vague", "askedBack": "표본 수와 무슨 관계인지 물음"}
 ],
 "reactions": [
   {"round": 1, "candidateId": "sample-size", "reaction": "unknown", "askedBack": "검정력이 무슨 뜻인지 물음"}
 ]}
```
- `ladder`는 필수이며 1–5개다(0개나 6개 이상은 거부). 항목은 사다리에서 실제로 질문한 개념의 응답이다.
  - `step`은 1–5 정수(사다리 위치), `conceptId`는 id 형식, `label`은 문자열.
  - `answer`는 `known` | `vague` | `unknown`. `vague`는 사다리 이동에서 `unknown`처럼 아래로 가지만 기록은 구분한다.
  - `askedBack`은 되물음 요약 문자열 또는 `null`.
  - `step`끼리, `conceptId`끼리 중복 금지. `step`의 연속성, 항목 순서, 응답 간 일관성은 검사하지 않는다.
- v1 diagnostic에는 `ladder`를 넣을 수 없고(`UNKNOWN_FIELD`), v2에서는 빼면 거부된다(`REQUIRED`).
- `candidates` 1–3개(마지막 라운드 후보). `hypotheses`의 `candidateId`는 candidates 중 하나. category: `common-knowledge-gap` | `unknown-concept`, status는 항상 `hypothesis`.
- `reactions`는 1개 이상. 사다리로 확정한 수준의 상황 카드 반응이다. `round`는 1 또는 2, `reaction`은 `similar` | `surprising` | `unknown` | `not-applicable`, `askedBack`은 되물음 요약 문자열 또는 `null`.
- `(round, candidateId)` 쌍은 중복 금지. 가장 큰 round의 reaction은 `candidateId`가 `candidates`에 있어야 하고, 더 낮은 round의 reaction은 id 형식만 맞으면 된다.
- `ladder`와 `candidates` 사이의 참조 관계는 검사하지 않는다.
- `confirmation: "confirmed"` ⇔ `selection`이 candidateId(마지막 라운드 후보). `deferred`/`unconfirmed`는 `selection: null`.
- 결과 import 시 diagnostic은 `confirmed`여야 하고, lesson의 `diagnosticId`·`candidateId`(= selection)·`contextKind`·`profileId`가 일치해야 한다.
- version 1 diagnostic(`reactions`·`ladder` 없음)도 계속 유효하다. v1에 `reactions`를 넣거나 v2에서 빼면 거부된다.

## model.mjs

```js
export const model = {
  modelId: 'water-tank', modelRevision: 1,
  inputIds: ['flow-rate'], outputIds: ['filled-volume', 'fill-ratio'],
  calculate(values) {
    const rate = values['flow-rate'];
    if (typeof rate !== 'number' || !(rate >= 0 && rate <= 100)) return {ok: false, errors: [{code: 'RANGE', path: '/flow-rate'}]};
    const volume = rate * 10;
    return {ok: true, value: {'filled-volume': volume, 'fill-ratio': volume / 2000}};
  },
};
```
- 단일 파일. `import`라는 단어가 소스 어디에도(주석 포함) 없어야 한다.
- `modelId`·`modelRevision`·`inputIds`·`outputIds`는 lesson의 `modelId`·`modelRevision`·`inputs[].inputId`·`outputs[].outputId`와 일치.
- 범위 판정은 lesson `inputs`의 min/max와 같게(경계 포함, 바깥 거부).
- 출력은 lesson에 보일 원래 단위의 값. 화면 표시 배율은 lesson `outputs[].scale`(예: 비율 0.1 → scale 100 → 10%).

## oracle.json

- `modelId`·`modelRevision`이 모델과 일치. cases ≥ 1(권장 4+: min, max, default, 시나리오 값).
- 각 case의 `values`는 모든 입력을 정확히 한 번씩, `expected`는 출력마다 한 번씩(nullable 출력은 `null` 가능).
- `absolute`: 허용 오차(≥ 0). 손계산 정확값이면 `1e-9`.
- `author`: `model-author` | `independent-agent`. `source`: 계산 근거 문장.

## lesson v3 — 의미 제약 (필드는 예시 파일 참고)

v3는 v2 필드를 모두 가지며(`"version": 3`) `inputs[]` 확장과 `visuals[]`가 더해진다. 아래 v2 규칙은 그대로 적용된다.

```json
{"inputs": [{"inputId": "flow-rate", "label": "유입 속도", "unit": "L/min", "min": 0, "max": 100, "default": 20, "step": 5,
             "practical": {"min": 10, "max": 60, "basis": "이 범위를 관찰한 출처·근거 문장(약하면 불확실하다고 적는다)"}}],
 "visuals": [
   {"visualId": "sweep-flow", "kind": "sweep", "inputId": "flow-rate", "outputIds": ["filled-volume"], "caption": "유입 속도에 따른 채운 부피"},
   {"visualId": "share-parts", "kind": "composition", "inputId": null, "outputIds": ["part-a", "part-b"], "caption": "구성 비율"}
 ]}
```

- `inputs`: `label`(비어 있지 않음, 사용자가 읽는 이름), `step > 0`, `practical{min,max,basis}`.
  - `min < max`, `min ≤ default ≤ max`(정의역, 모델 RANGE와 동일). `practical.min ≥ min`, `practical.max ≤ max`, `practical.min < practical.max`, `practical.min ≤ default ≤ practical.max`, `step ≤ practical.max − practical.min`. 위반은 `RANGE`.
  - `practical`은 실사용 범위(실제로 관찰되는 범위). `basis`에 출처·근거를 적고, 근거가 약하면 불확실하다고 명시한다(`basis` 공백은 `VALUE`).
  - 슬라이더는 `practical` 범위와 `step`으로, 숫자칸은 정의역으로 움직인다. 시나리오 값은 정의역 안이면 `practical` 밖이어도 유효하지만, 그런 시나리오는 failure 내용에서 설명할 때만 쓴다.
- `visuals` 1개 이상, 각 항목 `{visualId, kind, inputId, outputIds, caption}`.
  - `kind: "sweep"`: `inputId`는 입력 id. 그 입력을 `practical` 범위에서 움직일 때 `outputIds`의 변화를 곡선으로 보인다. 결정 변수마다 1개 이상.
  - `kind: "composition"`: `inputId: null`. 부분-전체 출력을 100% 막대로 보인다. `outputIds` 2개 이상, nullable 출력 금지. 합이 일정할 필요는 없지만 음수가 나오면 안 된다.
  - `outputIds`는 존재하는 출력, 중복 금지, 단위가 모두 같아야 한다(`STATE /visuals/i/outputIds`). `visualId` 중복 금지.
- v2 lesson에 v3 필드를 넣으면 `UNKNOWN_FIELD`, v3에서 빼면 `REQUIRED`.

### 공통 (v2와 동일)

- `concepts` 1–5개(5 초과 시 place-lesson `SCOPE`), 각 개념에 `meaning`·`example`·`confusion`(흔한 오해)·`plain`(쉬운 말). 화면 힌트는 confusion → plain 순서로 쓰인다.
- `content[].role`: `explanation` | `simulation` | `application` | `failure` | `assessment`. `conceptIds`는 존재하는 개념.
- `decisions` 1–2개(2 초과 `SCOPE`). `choices` ≥ 2, `requiredInformation` ≥ 1. `explanationId`/`simulationId`/`applicationId`/`failureId`/`assessmentId`는 각각 그 role의 content를 가리킨다.
- `outputs`: `scale > 0`, `nullable`은 모델이 null을 낼 수 있을 때만 true.
- `scenarios`: 각 시나리오가 모든 입력을 한 번씩, 범위 안 값으로.
- `transfer.scenarioId`는 시나리오 중 하나(설명 없이 예측하는 새 사례), `tolerances`는 모든 출력에 하나씩.
- `activities`: `required: true` 활동이 6개 stage(`diagnosis`, `orientation`, `exploration`, `assessment`, `return`, `map`)를 모두 포함하고, required 활동 `minutes` 합이 15–20. `diagnosis` stage의 content는 수업 화면에 나오지 않는다.
- `rubric.criteria` ≥ 5, `dimension` 5종(`concept`, `prediction-model`, `transfer`, `question`, `choice-meaning`)을 모두 포함. `contentId`는 `assessment` role. `mode`: 계산 비교는 `automatic`, 서술 판단은 `agent`.

## session.json (build-lesson 입력)

```json
{"profileId": "me", "resultId": "ab-test-result-1", "baseMapRevision": 1, "sequence": 1, "previousResultId": null}
```
- `baseMapRevision` = 현재 map revision(map 없으면 1). 같은 수업을 이어서 하는 회차면 `sequence`를 올리고 `previousResultId`에 직전 resultId.

## nextPaths.json (set-next-paths 입력)

```json
[{"pathId": "next-power", "lessonId": "ab-test-power", "conceptId": "statistical-power", "conceptRevision": 1, "lessonStatus": "planned", "reason": "이번에 미룬 검정력 계산"}]
```
- `placed`: lessonId가 map에 import된 lesson이고, conceptId·conceptRevision이 그 lesson의 개념이어야 한다.
- `planned`: 아직 만들지 않은 회차. 참조 검사를 하지 않는다.
- 배열 전체가 기존 nextPaths를 교체한다. 남길 기존 항목도 함께 넣는다.

## check-model 추가 오류 (lesson v3에만 적용)

| error code | 의미 |
| --- | --- |
| `PROBE_SWEEP /visuals/i` | sweep visual의 `practical` 범위를 양끝 포함 41점 등간격(다른 입력은 default)으로 계산했을 때 `ok:false`이거나 non-nullable 출력이 비유한값 |
| `PROBE_COMPOSITION /visuals/i` | composition visual의 출력이 기존 probe나 sweep 샘플 중 하나에서 음수 |

## serve

`node $LTT/scripts/serve.mjs [--port <n>] [--out <dir>]`: `dist/`를 `127.0.0.1`에서 제공한다. `--out`을 주면 수업 화면의 "결과 제출"이 `<dir>/result-<resultId>.json`으로 저장된다(없으면 제출은 `NO_OUT`으로 거부).
