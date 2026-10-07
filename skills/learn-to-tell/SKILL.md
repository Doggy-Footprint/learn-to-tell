---
name: learn-to-tell
description: 사용자가 작업의 핵심 결정 변수를 모른 채 선택을 맡기고 있을 때, 15–20분짜리 상호작용 수업(진단 → 시뮬레이션 수업 → 결과 기록)을 만들어 제공한다. "learn to tell", "이거 배우고 싶어", "무슨 기준으로 골라야 해?", "설명해줘가 아니라 이해하고 싶어"처럼 사용자가 결정에 참여할 지식을 원할 때 사용. tacit knowledge(몸으로 익히는 기술)는 대상이 아니다.
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

## 2. 진단 (개념 사다리 → 상황 카드)

일반 대화 메시지로 진행한다. 브라우저·선택 UI 도구는 쓰지 않는다. 사용자는 용어를 모를 수 있으므로, 용어를 쓰는 질문은 반드시 설명을 먼저 한다.

**사다리: 어디서부터 배울지 정한다.**

1. 사용자의 프로젝트·질문·상황에서 결정에 필요한 개념을 낮은 수준부터 높은 수준 순서로 3–5단 `ladder`(사다리)로 만든다. 단마다 개념 하나, `conceptId`와 `label`을 붙인다.
2. 한 번에 하나씩 개념을 묻는다. 묻기 전에 반드시 (a) 그 개념의 뜻, (b) 이 사용자의 상황에서 왜 필요한지, (c) 한 줄 예시를 설명한다. 그다음 세 가지 중에서 고르게 한다: 알아요 `known` · 들어봤지만 설명은 어려워요 `vague` · 몰라요 `unknown`. 자유 문장으로 답하거나 개념을 되물어도 된다.
   - 되물으면 정답을 대신 말하지 말고 짧게 답한 뒤 같은 개념의 응답을 다시 받는다.
3. 중간 단에서 시작한다. `known`이면 위 단, `unknown`이면 아래 단으로 이동한다. `vague`는 `unknown`처럼 아래로 이동하되 기록은 `vague`로 따로 남긴다. 질문은 최대 5문항(`5문항`)이다.
4. 학습 수준을 확정한다: 아는 개념 바로 위의 모르는(또는 `vague`인) 개념. 전부 알면 최상단, 전부 모르면 최하단 개념이다. 확정한 수준을 사용자에게 한 문장으로 알린다.
5. 응답마다 `{step, conceptId, label, answer, askedBack}`를 `ladder`에 쌓는다. `step`은 사다리 위치(1–5)이고, 질문한 개념만 기록하며, `askedBack`은 되물은 내용 한 줄 요약(없으면 `null`)이다.

**상황 카드: 확정된 수준에서 어느 정도 아는지 본다.**

6. 확정된 수준의 개념에 대해서만, 결정에 필요한 지식이 서로 다른 짧은 상황 카드를 라운드마다 최대 3개 만든다. 좁히기가 필요하면 최대 2라운드(`2라운드`)까지 한다.
7. 카드를 한 번에 하나씩 보여 주고 반응을 묻는다: 비슷함 `similar` · 의외 `surprising` · 모름 `unknown` · 해당 없음 `not-applicable`. 카드에 낯선 용어가 있으면 먼저 짧게 설명한다. 되물으면 정답은 알려 주지 않고 짧게 답한 뒤 같은 카드의 반응을 다시 받는다.
   - `not-applicable`은 곧바로 기록하지 않고 먼저 속으로 점검한다. 이 주제가 사용자의 상황·결정과 실제로 관련 있는데 사용자가 그 관련성을 모르거나 낯선 용어 때문에 착각한 것 같으면 `unknown`으로 기록한다. 판단이 서지 않으면 관련성을 한 번만 짧게 물어본다. 재분류했으면 가설의 rationale에 원래 답과 이유를 남긴다.
8. 반응마다 `{round, candidateId, reaction, askedBack}`를 `reactions`에 쌓는다. `askedBack`은 되물은 내용 한 줄 요약이고, 없으면 `null`.
9. `ladder`와 `reactions`를 근거로 hypotheses(`common-knowledge-gap` | `unknown-concept`)를 쓴다. rationale에 근거가 된 응답을 적고 `status`는 `hypothesis`다. 판정이 아니라 추정이라고 사용자에게 말한다.
10. 마지막 라운드 후보와 가설을 보여 주고 사용자가 고른다.
    - 고름: `selection: <candidateId>`, `confirmation: "confirmed"`
    - 보류: `selection: null`, `confirmation: "deferred"` — 수업 없이 9단계로 간다.
11. `$W/diagnostic.json`을 쓴다(version 2, `candidates`는 마지막 라운드 후보, `ladder`와 `reactions` 포함, 형식은 [reference.md](reference.md)). 그 뒤 `node $LTT/scripts/lesson.mjs place-diagnostic $W/diagnostic.json`. `CONFLICT`면 새 diagnosticId로 다시 만든다.

## 3. 범위 결정

사용자에게 묻지 않고 agent가 정한다: 이번에 결정할 변수 1–2개, 배울 개념 ≤5개, 필수 활동 합 15–20분. 진단 결과와 1단계 상황, 기존 기록(`nextPaths`)을 근거로 삼는다.
넘치면 나눈다. 이번 수업 밖의 부분은 나중에 nextPath `lessonStatus: "planned"`로 남긴다(9단계). 정한 범위는 한두 문장으로 알려 주고 바로 4단계로 간다.

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
4. `node $LTT/scripts/serve.mjs --out $W` 를 백그라운드로 실행하고 URL을 준다. 사용자에게 수업을 마친 뒤 화면 끝의 "결과 제출"을 누르고 끝났다고 알려 달라고 한다. 알림을 받으면 `$W/result-<resultId>.json`이 있는지 확인하고 serve를 종료한다.

수업 중 사용자가 질문하면 답하되, 예측 입력 전에 정답이나 출력값을 먼저 알려 주지 않는다.

## 8. 결과 기록

1. `node $LTT/scripts/map.mjs import $W/result-<resultId>.json` → `imported` 또는 `duplicate`.
2. `node $LTT/scripts/map.mjs show <profileId>`로 요약을 보여 준다. 결과는 이번 상황과 도움 수준에서의 관찰이며 능력 판정이 아니라고 말한다. `not_demonstrated`·`skipped`는 다음 경로 후보로 삼는다.

## 9. 작업 복귀와 다음 학습

1. 작업 복귀 요약을 사용자와 확인한다: 이번 결정(또는 보류 이유), 선택을 바꾸는 조건, agent에게 전달할 질문·조건. `contextKind: "work"`면 원래 작업으로 돌아가 이 요약을 반영한다.
2. 다음 학습 후보(미룬 범위, 약했던 개념, 확장)를 제안하고 사용자가 원하는 것만 `$W/nextPaths.json`에 쓴다. 이미 배치·import된 lesson은 `"placed"`, 아직 만들지 않은 회차는 `"planned"`.
3. 사용자가 저장에 동의하면 `node $LTT/scripts/lesson.mjs set-next-paths <profileId> $W/nextPaths.json` (map이 있어야 한다. `MAP_MISSING`이면 이번에는 저장하지 않았다고 알린다).
