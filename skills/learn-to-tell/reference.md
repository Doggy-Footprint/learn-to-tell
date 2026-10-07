# 문서 형식과 제약

정본은 `$LTT/contracts/definitions.mjs`(필드)와 `$LTT/contracts/index.mjs`(의미 검사)다. 아래와 다르면 정본이 맞다.
완전한 예시는 `$LTT/tests/fixtures/learning/synthetic-lesson-v2.json`, `synthetic-model.mjs`, `synthetic-oracle.json`(물탱크, 입력 1·출력 2)을 복사해 고친다.

공통: 모든 `...Id`는 `^[a-z][a-z0-9-]{0,63}$`. revision·version은 1 이상 정수. 알 수 없는 필드는 `UNKNOWN_FIELD`로 거부된다.

## diagnostic v2 (agent가 `$W/diagnostic.json`으로 직접 작성 → place-diagnostic)

```json
{"kind": "diagnostic", "version": 2, "diagnosticId": "ab-test-diagnostic", "profileId": "me", "contextKind": "work",
 "candidates": [
   {"candidateId": "sample-size", "title": "몇 명에게 보여야 하나", "decisionQuestion": "언제 실험을 멈춰도 되나?", "reason": "왜 이 후보인가", "preview": "카드에 보일 짧은 상황"}
 ],
 "selection": "sample-size", "confirmation": "confirmed",
 "hypotheses": [{"candidateId": "sample-size", "category": "unknown-concept", "rationale": "‘의외’ 반응: 검정력 개념을 모름", "status": "hypothesis"}],
 "reactions": [
   {"round": 1, "candidateId": "sample-size", "reaction": "unknown", "askedBack": "검정력이 무슨 뜻인지 물음"}
 ]}
```
- `candidates` 1–3개(마지막 라운드 후보). `hypotheses`의 `candidateId`는 candidates 중 하나. category: `common-knowledge-gap` | `unknown-concept`, status는 항상 `hypothesis`.
- `reactions`는 1개 이상. `round`는 1 또는 2, `reaction`은 `similar` | `surprising` | `unknown` | `not-applicable`, `askedBack`은 되물음 요약 문자열 또는 `null`.
- `(round, candidateId)` 쌍은 중복 금지. 가장 큰 round의 reaction은 `candidateId`가 `candidates`에 있어야 하고, 더 낮은 round의 reaction은 id 형식만 맞으면 된다.
- `confirmation: "confirmed"` ⇔ `selection`이 candidateId(마지막 라운드 후보). `deferred`/`unconfirmed`는 `selection: null`.
- 결과 import 시 diagnostic은 `confirmed`여야 하고, lesson의 `diagnosticId`·`candidateId`(= selection)·`contextKind`·`profileId`가 일치해야 한다.
- version 1 diagnostic(`reactions` 없음)도 계속 유효하다. v1에 `reactions`를 넣거나 v2에서 빼면 거부된다.

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

## lesson v2 — 의미 제약 (필드는 예시 파일 참고)

- `concepts` 1–5개(5 초과 시 place-lesson `SCOPE`), 각 개념에 `meaning`·`example`·`confusion`(흔한 오해)·`plain`(쉬운 말). 화면 힌트는 confusion → plain 순서로 쓰인다.
- `content[].role`: `explanation` | `simulation` | `application` | `failure` | `assessment`. `conceptIds`는 존재하는 개념.
- `decisions` 1–2개(2 초과 `SCOPE`). `choices` ≥ 2, `requiredInformation` ≥ 1. `explanationId`/`simulationId`/`applicationId`/`failureId`/`assessmentId`는 각각 그 role의 content를 가리킨다.
- `inputs`: `min < max`, `min ≤ default ≤ max`.
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

## serve

`node $LTT/scripts/serve.mjs [--port <n>] [--out <dir>]`: `dist/`를 `127.0.0.1`에서 제공한다. `--out`을 주면 수업 화면의 "결과 제출"이 `<dir>/result-<resultId>.json`으로 저장된다(없으면 제출은 `NO_OUT`으로 거부).
