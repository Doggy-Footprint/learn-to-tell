---
name: learn-to-tell
description: 사용자가 작업의 핵심 결정 변수를 모른 채 선택을 맡기고 있을 때, 15–20분짜리 상호작용 수업(진단 → 범위 합의 → 시뮬레이션 수업 → 결과 기록)을 만들어 제공한다. "learn to tell", "이거 배우고 싶어", "무슨 기준으로 골라야 해?", "설명해줘가 아니라 이해하고 싶어"처럼 사용자가 결정에 참여할 지식을 원할 때 사용. tacit knowledge(몸으로 익히는 기술)는 대상이 아니다.
---

# Learn to Tell

목표: 사용자가 (1) 결정 변수를 알아보고 (2) agent에게 물을 질문을 만들고 (3) 선택과 그 의미를 설명할 수 있게 한다.
설명을 대신 해 주는 것이 아니라, 사용자가 예측·조작·설명하는 수업을 만든다.

## 0. 준비

- `LTT`: Learn to Tell 런타임 저장소 절대 경로. 설치 스크립트가 이 skill 폴더의 `config.json`(`{"root": ...}`)에 기록해 둔다. 이 SKILL.md가 있는 폴더의 `config.json`을 읽어 `root` 값을 쓴다.
  `$LTT/package.json`의 name이 `learn-to-tell`이 아니거나 `$LTT/node_modules`가 없으면 멈추고 사용자에게 알린다(`npm ci`는 사용자 동의 후). `config.json`이 없으면 설치되지 않은 상태이므로 `node <learn-to-tell>/scripts/install-skill.mjs`로 설치하라고 안내한다.
- 작업 폴더 `W`: `mktemp -d`로 만든 임시 폴더. 사용자 프로젝트 안에는 아무것도 쓰지 않는다.
- 사용자 데이터는 `~/.learn-to-tell/profiles/<profileId>/`(환경변수 `LEARN_TO_TELL_HOME`이 있으면 그 아래)에 있다. 직접 편집하지 않고 CLI로만 바꾼다.
- 생성할 JSON 형식과 제약은 [reference.md](reference.md)를 따른다. 문서를 쓰기 전에 반드시 읽는다.

CLI 공통 규칙:
- `node $LTT/scripts/lesson.mjs …`, `node $LTT/scripts/map.mjs …`는 stdout에 JSON outcome 한 줄을 낸다. exit 0 = 성공, 1 = 실패 outcome(`code`, `message`, `next`, `errors[{code,path}]`), 2 = 사용법 오류.
- `build-*.mjs`, `serve.mjs`는 실패 시 stderr에 `CODE /path` 줄을 낸다.
- exit 2는 이 skill의 호출 실수다. 인자를 고쳐 한 번 다시 실행하고, 그래도 2면 멈추고 보고한다.
- exit 1은 `errors`의 path가 가리키는 필드를 고쳐 다시 실행한다. 같은 명령이 3번 연속 실패하면 멈추고 오류 원문과 함께 사용자에게 상황을 설명한다.
- `map.mjs delete`·`restore`는 사용자가 명시적으로 요청하고 확인 토큰을 직접 확인한 경우에만 실행한다.

## 1. 상황 파악

사용자에게 확인한다(이미 대화에 있으면 요약해서 확인만 받는다).
- 진행 중인 작업이 있는가 → `contextKind: "work"`, 없으면 관심 분야의 대표 상황 → `"interest"`.
- 원하는 결과, 제약, 아직 정하지 못한 선택.
- profileId(소문자로 시작, `[a-z0-9-]`, 64자 이하). 처음이면 사용자와 정한다. `node $LTT/scripts/map.mjs show <profileId>`로 기존 기록을 보고, 이미 배운 개념과 `nextPaths`를 범위 제안에 반영한다(`NO_MAP`이면 첫 학습).

다음 단계 조건: 사용자가 상황 요약을 확인함.

## 2. 진단 (간소 체험으로 분야 찾기)

1. 결과가 서로 다른 짧은 상황 카드 1–3개를 만든다. 각 카드는 "이 결정을 하려면 무엇을 알아야 하나"가 다른 후보다(용어 해석 차이, 모르는 개념 후보). 필요하면 2라운드(좁히기)까지 둔다.
2. `$W/setup.json`(diagnostic-setup) 작성 → `node $LTT/scripts/build-diagnostic.mjs --setup $W/setup.json`
3. `node $LTT/scripts/serve.mjs --target diagnostic` 를 백그라운드로 실행하고 stdout에 찍힌 URL을 사용자에게 준다. serve는 포트에 이미 다른 서버가 있어도 URL을 찍으므로, 실행 전 `lsof -i :4321`로 비어 있는지 보고 사용 중이면 `--port`를 바꾼다.
4. 사용자가 카드마다 반응(비슷함/의외/모름/해당 없음)을 고르고 `diagnostic-choices-<diagnosticId>.json`을 내려받는다. 파일 경로를 받는다. serve는 종료한다.
5. 반응을 근거로 hypotheses(`common-knowledge-gap` | `unknown-concept`)를 `$W/hypotheses.json`에 쓴다. rationale에는 어떤 반응에서 그렇게 추정했는지 적는다. 가설은 판정이 아니라 추정임을 사용자에게 말한다.
6. `node $LTT/scripts/lesson.mjs diagnose --choices <파일> --hypotheses $W/hypotheses.json` → outcome의 `diagnostic`을 `$W/diagnostic.json`에 저장.
7. 마지막 라운드 후보와 가설을 보여 주고 사용자가 고른다.
   - 고름: `selection: <candidateId>`, `confirmation: "confirmed"` 로 바꾼다.
   - 보류: `selection: null`, `confirmation: "deferred"` — 수업을 만들지 않고 9단계(다음 학습)로 간다.
8. `node $LTT/scripts/lesson.mjs place-diagnostic $W/diagnostic.json`. `CONFLICT`면 같은 diagnosticId가 이미 다르게 저장된 것이므로 새 diagnosticId로 다시 만든다.

## 3. 범위 합의

사용자에게 표로 보여 주고 확인받는다: 이번에 결정할 것(결정 변수 1–2개), 배울 개념(≤5개), 나중으로 미룰 것, 예상 시간(필수 활동 합 15–20분).
넘치면 나눈다. 이번 수업 밖의 부분은 나중에 nextPath `lessonStatus: "planned"`로 남긴다(9단계).

## 4. 생성: lesson · model · oracle

[reference.md](reference.md)의 제약을 모두 지킨다.
1. `$W/model.mjs`: 결정 변수를 입력으로, 사용자가 관찰할 값을 출력으로 하는 단일 파일 모델. `import`/`require` 금지, 결정적, 입력 객체 불변, 범위 밖 입력은 `{ok:false}`, 출력은 유한수(또는 nullable 출력의 null).
2. `$W/oracle.json`: 모델 코드를 보지 않고 손계산·공식·출처로 구한 기대값. 경계(min/max)와 시나리오 값을 포함해 4개 이상. `source`에 계산 근거를 적는다. 직접 썼으면 `author: "model-author"`, 6단계 서브에이전트가 썼으면 `"independent-agent"`.
3. `$W/lesson.json`: lesson v2. 실제 활용 예, 실패·주의 예, 시뮬레이션, 설명을 가린 새 사례(transfer)를 포함한다. 내용은 사용자의 상황(1단계) 언어로 쓴다. 수치 주장에는 근거를 둔다. 확실하지 않은 사실은 쓰지 않거나 불확실하다고 적는다.

## 5. check-model

`node $LTT/scripts/lesson.mjs check-model --lesson $W/lesson.json --model $W/model.mjs --oracle $W/oracle.json`

| error code | 의미 · 조치 |
| --- | --- |
| `INVALID`(outcome) | lesson/oracle 계약 위반. path의 필드를 고친다 |
| `MISMATCH /cases/i/expected/j` | 모델과 oracle 불일치. **어느 쪽이 틀렸는지 먼저 손으로 다시 계산**한다. 모델에 맞춰 oracle을 고치지 않는다 |
| `PROBE_RANGE` | 범위 밖 입력에 ok:false를 내지 않음 |
| `NON_FINITE` · `SHAPE` | 0 나눗셈 등 비유한값, 또는 출력 키가 outputIds와 다름 |
| `MUTATION` · `NONDETERMINISTIC` | 입력 객체 변경, 난수·시간 사용 |
| `LOAD` · `TIMEOUT` · `THROW` | import 사용·`model` export 누락, 5초 초과, 예외 |

## 6. 독립 검증 (Claude Code에서만)

Agent 도구가 있으면 서브에이전트에게 model.mjs를 주지 않고 lesson.json·oracle.json·사용자 상황만 주어 다음을 검토시킨다: 개념 설명의 사실 오류, oracle 기대값 재계산, 결정 변수와 선택 조건이 상황에 맞는지, 15–20분 분량이 현실적인지.
지적을 반영하면 4–5단계를 다시 통과시킨다. Agent 도구가 없는 환경(Codex 등)이면 이 단계를 건너뛰었다고 사용자에게 알린다.

## 7. 배치 · 빌드 · 제공

1. `node $LTT/scripts/lesson.mjs place-lesson $W/lesson.json --model $W/model.mjs --oracle $W/oracle.json`
   - `SCOPE`: 결정 > 2 또는 개념 > 5. 3단계로 돌아가 나눈다.
   - `CONFLICT`: 같은 revision이 다르게 저장되어 있다. 내용을 바꿨다면 `lessonRevision`(모델을 바꿨다면 `modelRevision`도, lesson·oracle 양쪽) 을 올린다.
   - 성공 outcome의 `paths`에서 배치된 lesson·model 경로를 얻는다.
2. `$W/session.json` 작성: `{profileId, resultId, baseMapRevision, sequence: 1, previousResultId: null}`. `baseMapRevision`은 `map.mjs show`의 revision(map 없으면 1). resultId는 새 id.
3. `node $LTT/scripts/build-lesson.mjs --session $W/session.json --lesson <배치된 lesson> --model <배치된 model>`
4. `node $LTT/scripts/serve.mjs` 를 백그라운드로 실행하고 URL을 준다. 사용자가 수업을 마치고 `result-<resultId>.json`을 내려받으면 경로를 받고 serve를 종료한다.

수업 중 사용자가 질문하면 답하되, 예측 입력 전에 정답이나 출력값을 먼저 알려 주지 않는다.

## 8. 결과 기록

1. `node $LTT/scripts/map.mjs import <result 파일>` → `imported` 또는 `duplicate`.
2. `node $LTT/scripts/map.mjs show <profileId>`로 요약을 보여 준다. 결과는 이번 상황과 도움 수준에서의 관찰이며 능력 판정이 아니라고 말한다. `not_demonstrated`·`skipped`는 다음 경로 후보로 삼는다.

## 9. 작업 복귀와 다음 학습

1. 작업 복귀 요약을 사용자와 확인한다: 이번 결정(또는 보류 이유), 선택을 바꾸는 조건, agent에게 전달할 질문·조건. `contextKind: "work"`면 원래 작업으로 돌아가 이 요약을 반영한다.
2. 다음 학습 후보(미룬 범위, 약했던 개념, 확장)를 제안하고 사용자가 원하는 것만 `$W/nextPaths.json`에 쓴다. 이미 배치·import된 lesson은 `"placed"`, 아직 만들지 않은 회차는 `"planned"`.
3. 사용자가 저장에 동의하면 `node $LTT/scripts/lesson.mjs set-next-paths <profileId> $W/nextPaths.json` (map이 있어야 한다. `MAP_MISSING`이면 이번에는 저장하지 않았다고 알린다).
