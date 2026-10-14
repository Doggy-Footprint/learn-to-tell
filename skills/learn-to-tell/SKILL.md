---
name: learn-to-tell
description: 작업의 핵심 결정 변수 중 사용자가 모르는 것을 짧은 대화 진단(quick survey)으로 찾고, 최대 20분 분량의 시각 자료·시뮬레이션과 서술 퀴즈로 익힌 뒤 결과를 원래 작업으로 돌려준다. 사용자가 진단이나 학습을 요청할 때, 또는 작업 중 사용자와 agent 사이의 지식 차이가 결정을 막는다고 보일 때 쓴다(이 경우 먼저 제안만 한다).
---

# Learn to Tell

목표는 숙련이 아니다. 사용자가 (1) 적절한 질문을 하고 (2) agent의 도움으로 결정 변수를 고르고 (3) 그 선택의 의미를 설명하고 (4) map에서 지난 학습을 찾아 복습할 수 있게 하는 것이다. tacit knowledge는 다루지 않는다.

경로 규칙: `<skill>`은 이 skill의 base directory, `<home>`은 `$LTT_HOME`(기본 `~/.learn-to-tell`)이다.

## 0. 시작

- agent가 제안하는 경우: 지식 차이와 그것이 막는 결정을 한 문장으로 말하고, 학습을 원하는지 묻는다. 원하면 아래 세션 안내를 한다.
- 사용자에게 진단만 받을지, 학습까지 할지 묻는다.
- 학습은 작업 세션에서 `/fork`한 세션에서 진행한다. 지금 세션이 fork한 세션이 아니면 사용자에게 `/fork` 후 그 세션에서 `/learn-to-tell <주제>`를 실행하라고 안내하고 멈춘다. 진단만 받는 경우는 지금 세션에서 해도 된다.
- 작업 세션의 context가 100k tokens 이상으로 보이면 새 세션에서 학습하길 권한다. 이때 작업 맥락(목표, 막힌 결정, 이미 정한 것)을 `<home>/lessons/<id>/context.md`로 남기고, 새 세션에서 그 파일을 읽게 한다.
- lesson id는 `YYYYMMDD-<kebab-slug>`이고, 디렉터리는 `<home>/lessons/<id>/`다.
- `<home>/map.md`가 있으면 먼저 읽고, 이미 학습한 개념과 다음 후보를 진단에 반영한다.

## 1. 진단 (대화, 브라우저 아님)

- 상황에 필요한 개념으로 낮은 수준부터 3–5단짜리 **개념 사다리**를 세운다. 낯선 용어로 시작하지 않는다.
- 중간 단부터 묻는다. 묻기 전에 개념의 뜻, 이 상황에서 필요한 이유, 한 줄 예시를 보여 주고 "알고 있음 / 애매함 / 아예 모름" 중 하나를 고르게 한다.
  - 알고 있음·애매함이면 위 단으로, 아예 모름이면 아래 단으로 간다. 질문은 확인 퀴즈를 포함해 최대 5개다.
  - 아는 개념 바로 위에 있는 모르는 개념을 학습 수준으로 정한다.
  - 맨 위 단까지 알고 있음이면 맨 위 단을 간단한 퀴즈로 확인한다. 통과하면 학습 없이 진단 결과만 기록하고, 틀리면 그 단을 학습 수준으로 정한다.
  - 맨 아래 단도 아예 모름이면 더 기초적인 단을 하나 추가해 묻는다. 질문 상한에 닿으면 그때의 맨 아래 단을 학습 수준으로 정한다.
  - 애매함으로 답한 개념은 학습 내용에 일부 넣는다. 핵심 결정 변수에 알고 있음으로 답한 개념은 퀴즈 하나로 확인한다.
- 사용자가 되물으면 정답을 대신 말하지 않는다. 짧게 답한 뒤 같은 질문의 응답을 다시 받는다.
- 진단 결과는 가설이다. "아예 모름"은 정당한 답이다.

## 2. 범위

- 이번 회차의 결정 변수와 개념, 다음으로 미룰 부분을 agent가 정하고 사용자에게 **알리기만** 한다(묻지 않는다).
- 분량 기준은 학습 자료 기준 최대 20분 하나뿐이다(진단·퀴즈 제외). 20분을 넘으면 알리고 회차를 나눈다. 결정 변수 1–2개, 새 개념 5개 이하는 참고값이다.
- 결정 변수는 개념 이름이 아니라 선택지·영향·필요 정보·실패 조건으로 다룬다.
- 조작해서 관찰할 필요가 없으면 **simple 경로**로 간다. 대화 안의 짧은 자료와 서술 퀴즈로 진행하고 3단계를 건너뛴다.

## 3. 자료 (시뮬레이션 경로)

1. `<skill>/gallery/`에서 가장 비슷한 예제를 골라 `<home>/lessons/<id>/lesson.html`로 복사한 뒤 고친다. 필요한 부품이 예제에 없으면 `visual-catalog.html`에서 ID로 찾아 옮긴다.
   - `alert-precision.html`: 수치 모델, 슬라이더 예측과 단위 그림 공개 애니메이션, 건수 흐름 막대, 조건 프리셋 카드, 실사용 범위 슬라이더, Plot 차트, `expect`.
   - `cache-ttl.html`: 수치 sweep. 단계형 로그 슬라이더, 세 범주 단위 그림 공개, 누적 영역 그래프와 따로 그린 두 번째 지표 그래프, 0으로 반올림되는 값의 "<1" 표시.
   - `concurrent-calls.html`: 코드 변형 비교. 선택지 카드 예측, 기준 코드 대비 바뀐 줄 강조, 요청 타임라인(Gantt) 재생, 변형별 결과 비교 막대.
   - `payment-retry.html`: 단계별 상태·흐름. 선택지 예측, 한 단계씩 진행하는 시퀀스 다이어그램과 상태 패널, 조건 조합 결과 행렬, 버그·수정 코드 비교.
   - `realtime-transport.html`: 조건 토글 비교표. 선택지 예측, ✓/△/✗ 표에서 조건을 켜고 끄면 추천 열이 이동, 메시지 흐름 그림, 규칙의 한계를 보이는 사례.
   - `visual-catalog.html`: 수업이 아니라 시각 요소 부품 모음(ID별: 핵심 수치, 비율·건수, 그래프, 흐름·상태, 비교·결정, 예측 입력, 주석).
   - `template.html`: `ltt-parts.js` 공통 함수만으로 짠 최소 수업. 비슷한 예제가 없으면 여기서 시작한다.
   - `<domain>/*.html`(uiux, pedagogy, finance, physics, cognition, linear-algebra, gpu): 코딩 밖 도메인의 예제. 모두 `ltt-parts.js`로 짰다. 각 페이지 head의 `ltt-meta`(audience, pattern, decision)를 보고 고른다. GPU 3편은 같은 주제를 전제 지식 수준별로 나눈 예다(`single-gpu-dataflow` = Transformer 모름, `single-gpu-transformer` = Transformer 앎).
   - `index.html`: 시나리오 목록. 복사 대상이 아니다. gallery에 페이지를 추가하면 여기에도 카드를 추가한다.
2. 시각화 기준: 인포그래픽 + 애니메이션
   - 핵심 수치 하나를 `ltt-hero`로 크게 보인다. 비율은 `ltt-units`(100칸 단위 그림)나 `ltt-bar`(비율 막대)로 건수처럼 보인다.
   - 예측 입력도 시각적으로 받는다(예: 슬라이더를 움직이면 단위 그림이 채워진다). 숫자 입력칸만 두지 않는다.
   - 애니메이션은 변화의 의미를 보일 때만 쓴다: 예측 → 공개 전환, 조건 변경 시 값 이동(d3 transition tween, CSS transition), 공개 후 카드의 단계적 등장(`ltt-rise` + `--i`). 반복 재생되는 장식 애니메이션은 쓰지 않는다.
   - 정지 화면만으로도 읽혀야 한다. JS로 만드는 애니메이션은 `prefers-reduced-motion`이면 길이를 0으로 둔다(CSS는 kit가 처리한다).
3. 원칙
   - 실제 활용 예와 실패·주의 예를 함께 둔다.
   - 예측을 먼저 받고 결과를 공개한다. 첫 예측은 잠그고 `LTT.record("predict", …)`로 남긴다.
   - 슬라이더는 실사용 범위만 움직인다. 범위와 상수에는 근거를 적고, 근거가 약하면 "불확실" 태그를 단다. 근거 없는 수치를 지어내지 않는다.
   - 화면 수치에는 "모델로 계산한 예시" 태그를 단다.
   - 설명은 최소로 두고, 추가 설명은 `data-tip` hover로 준다.
4. 검증 (공개 전)
   - 수치 모델의 기대값은 독립 서브에이전트가 구하게 한다. 서브에이전트에는 공식과 계산 지점만 주고 모델 코드는 주지 않는다. 서브에이전트를 쓸 수 없으면 모델 코드보다 먼저 직접 적는다. 기대값은 `LTT.expect(label, actual, expected, { tol })`로 넣는다.
   - 불일치가 나면 어느 쪽이 틀렸는지 먼저 손으로 다시 계산한다. 모델에 맞춰 기대값을 고치지 않는다. 한 번 고친 뒤에도 불일치가 남으면 그 부분을 빼거나 "검증 실패"로 표시하고 사용자에게 알린다.
   - 결정 변수에 관한 주장(공식, 범위, 비교표 판정)은 목록으로 뽑아 모델 코드를 보지 않는 독립 서브에이전트에게 검토받는다. 검토할 수 없으면 해당 주장에 "미검증" 태그를 단다. 자기 확언만으로 정확성을 인정하지 않는다.
5. 서버를 백그라운드로 실행한다: `node <skill>/server/server.mjs`. 이미 실행 중이면 그대로 재사용한다. 그다음 `http://127.0.0.1:47823/lessons/<id>/lesson.html`을 안내한다. 포트는 `LTT_PORT`로 바꿀 수 있다.
6. 사용자가 다 봤다고 하면 `<home>/lessons/<id>/events.jsonl`을 읽어 예측과 `expect-mismatch` 이벤트를 확인한다.

### kit (`/kit/ltt.js`)

- 불러오는 순서: `/kit/vendor/d3.min.js`, `/kit/vendor/plot.umd.min.js`(Observable Plot 0.6.17, 전역 `Plot`), 수식이 있으면 `/kit/vendor/katex/katex.min.js`(+ `katex.min.css`), `/kit/ltt.js`, `/kit/ltt-parts.js`. `gallery/template.html`이 이 순서의 최소 예제다.
- `LTT.record(type, data)`: lesson 페이지에서만 서버로 이벤트를 보낸다.
- `LTT.expect(label, actual, expected, { tol })`: 결과를 화면 오른쪽 아래 패널에 표시하고, 불일치하면 서버에도 알린다. 모두 일치하면 패널은 요약 한 줄로 접혀 있고, 불일치가 하나라도 있으면 펼쳐진다.
- CSS 클래스: `ltt-card`, `ltt-grid`, `ltt-stat`, `ltt-tag`(`warn`/`bad`/`good`), `ltt-param`, `ltt-basis`, `ltt-lead`, `ltt-hidden`, `ltt-hero`, `ltt-units`·`ltt-unit`(열 수 `--ltt-cols`), `ltt-bar`(자식 `span`의 `flex-grow`로 비율), `ltt-key`(범례), `ltt-rise`(등장, 순서 `--i`). 단위 그림은 `--i`를 칸마다 주면 순서대로 칠해진다.
- `ltt-parts.js` 공통 함수. 새 수업은 이것으로 짜고, 페이지에는 모델 함수와 설정만 둔다.
  - `LTT.predict({question, input | choices, button, preview, answer, hide, show, reveal})`: 첫 예측을 잠그고 기록한 뒤 공개한다. 선택지는 `data-choice` 버튼으로 둔다.
  - `LTT.sweep({params: {id: {fmt, map}}, render, presets})`: range 입력들이 하나의 `render(values)`를 움직인다. `#<id>-v`에 값을 표시하고, `data-preset` JSON 버튼으로 값을 한꺼번에 바꾼다.
  - `LTT.units(el, n, cols).paint(k, cls, alt)`, `LTT.bar(el, parts).set(values)`, `LTT.tween(el, to, fmt)`: 단위 그림, 비율 막대, 숫자 tween.
  - `LTT.stepper(el, [{caption, enter(i, dir)}])`: 이전/다음/자동 재생. `enter`는 다시 들어와도 같은 화면이 되게 짠다.
  - `LTT.flow(svg, {nodes, links}).send(from, to, {count, color})`: 박스와 화살표 그림, 패킷 이동(데이터 흐름, 메시지).
  - `LTT.plane(svg, {range, vectors, shape}).to([[a,b],[c,d]])`: 2×2 행렬로 격자와 벡터를 변형한다.
  - `LTT.sim({init, step, draw, until, dt})`: 고정 시간 간격 시뮬레이션. `runToEnd()`로 화면 없이 결과를 계산한다.
  - `LTT.math()`: `data-tex`(블록 수식은 `data-display`도 붙임) 요소를 KaTeX로 그린다. 로드 시 자동 실행된다.
  - 이 함수들은 `prefers-reduced-motion`이면 애니메이션 길이를 0으로 둔다.
- gallery 페이지의 `<script type="application/json" id="ltt-meta">`(domain, topic, audience, pattern, decision)로 복사할 예제를 고른다.
- 수업마다 반복되는 패턴은 kit 어휘 후보다. `result.md`의 "kit 후보" 항목에 적는다.

## 4. 이해 확인 (대화)

- 서술 퀴즈로 **질문 만들기**와 **선택·의미 설명**을 확인한다.
- 평가 기준은 답을 받기 전에 정해 두고, 사용자에게 보여 주지 않는다.
- 판정은 pass / fail / skipped다. 제출된 답은 skipped로 처리하지 않는다.
- pass는 "이번 상황과 도움 수준에서의 관찰"로 기록한다. 능력 판정이 아니다. 도움을 받은 수행은 따로 표시한다.
- 피드백은 관찰 근거 중심으로 하고, 사실 판정과 정서적 지지를 분리한다. 핵심 결정 1건은 찬성·반대 조건을 대칭적으로 확인한다.

## 5. 작업 복귀

`<home>/lessons/<id>/result.md`를 쓴다. 세션 방식과 관계없이 항상 쓴다.

```markdown
# <주제> (<id>)
- 작업: <원래 작업 한 줄>
- 진단: <사다리 단별 응답과 학습 수준>
- 이번 결정: <선택 또는 보류 이유>
- 선택을 바꾸는 조건: <조건>
- agent에게 할 질문: <질문들>
- 퀴즈: <문항별 pass/fail/skipped, 도움 여부>
- 미룬 범위: <다음 회차 후보>
- kit 후보: <반복된 패턴, 없으면 생략>
```

그다음 원래 작업 세션에 결과를 보낸다. ListAgents로 원래 세션을 찾고 SendMessage로 요약과 `result.md` 경로를 보낸다. 찾을 수 없으면 사용자에게 경로를 알려 원래 세션에 전달하게 한다.

## 6. 지식 map

`<home>/map.md` 하나를 갱신한다. 없으면 만든다.

```markdown
# Learn to Tell map

## 개념
| 개념 | 상태 | 최근 | 수업 |
| --- | --- | --- | --- |
| <개념> | 학습함 / 약함 / 진단만 | <YYYY-MM-DD> | lessons/<id> |

## 다음 후보
- <약한 개념, fail·skipped 항목, 미룬 범위> (출처: lessons/<id>)
```

- 약한 개념, fail·skipped 항목, 미룬 범위는 "다음 후보"에 넣는다.
- 마지막에 다음 학습 경로를 한두 줄로 제시한다.
