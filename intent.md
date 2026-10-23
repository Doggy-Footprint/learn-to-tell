# Intent: Learn to Tell v2

Status: draft (2026-10-23). v1 전체는 태그 `archive/v1`(`0da38db`)에 있다.

## What I want (사용자 원문)

1. 일반적인 요청보다 양질의 교육 자료를 저렴한 cost(time/token)으로 제공한다.
2. infographic을 중심으로 하는 학습 자료를 만든다. infographic은 수치, 비례, 위치, 시간 등이 정확하게 모델링되어 있어야 하며, idle하게 계속 움직이거나, 정해진 step을 계속 반복해야 한다. 이를 위해 infographic을 code로 모델링한 다음 그걸 rendering 하는 방식을 택한다.
3. 교육적인 목적을 위해 예측 -> 설명, 학습 후 퀴즈 등의 구조를 차용한다.
4. 접근성에 대한 부담을 낮추기위해 interactive한 구성으로 재미를 제공한다. interactive한 구성은 단순히 slide를 움직이는 수준을 지양하고 현대적인 UI 구성으로 간다.
5. 외부 의존성을 이용해서 낮은 비용으로 깔끔하고, 세련되고, 심미적으로 괜찮은 UI를 구성한다. (ex. 페이지를 넘길 때 component 들이 움직여서 제자리를 찾아가는 등)

## 사용자 결정 (2026-10-23)

- 범위: v1 범위 전체(사다리 진단, 지식 map, 작업 세션 복귀)를 v2에 넣는다.
- 제공 경로: Claude Code와 claude.ai(웹·모바일) 둘 다.
- 분량: 수업 하나 15–20분, 교과서 한 챕터.

## v1에서 확인한 것

| | 일반 요청 (compare1, 5주제) | v1 skill |
|---|---|---|
| 토큰 (`subagent_tokens`) | 56.8k–72.4k | 생성 161k–307k (gallery-v2), 검증 포함 445k–612k (compare1) |
| 시간 (`duration_ms`) | 159–296초 | 19분 01초–35분 21초 (gallery-v2 평균 25분 22초) |
| agent가 쓴 것 | HTML 30KB, 렌더 확인 없음 | HTML 30–68KB, kit 문서 최대 85KB 탐색 |

- gallery-v2 시간의 58%(평균 14분 37초)가 audit·검증 반복이었다. audit 평균 8.8회, 검증 평균 2.8회.
- 반복을 만든 결함은 레이아웃(넘침·작은 글자·겹침)과 kit 사용 형식(predict `choices` 형식 오류로 빈 버튼, check 통과)이 대부분이었다. agent가 HTML·레이아웃을 직접 쓰면 결함 공간이 넓고, 렌더해야만 보인다.
- 사용자 판정: 그림 품질은 괜찮았다.
- 진단·지식 map·작업 복귀는 비용 원인이 아니었다. v1 설계를 이어 쓴다.

## What I need

### 핵심 결정

1. agent는 수업 spec(수치 모델, 데이터 단위 그림, 장면)만 쓴다. 레이아웃·CSS·DOM·애니메이션 코드는 쓰지 않는다. 미리 만들어 검증한 runtime이 전부 그린다. ADR `3c44a1f91bcb8367`(v1 ADR `6ff15ad3eef7b88d` 대체).
2. 인포그래픽은 `model → view`다. model은 매개변수·시간 → 수치를 내는 순수 함수, view는 수치를 데이터 단위 도형으로 바꾼다. px는 runtime의 scale만 계산한다.
3. 검사(`ltt check`)는 브라우저 없이 Node에서 결정적으로 돈다. 화면은 마지막에 contact sheet로 한 번 본다. 검증 서브에이전트는 기본으로 쓰지 않는다(bench에서 수치 오류가 나오면 켠다).
4. 교수 설계 규칙은 장면 타입의 구조로 강제한다. 예측 장면의 공개 내용은 확정 전에 렌더되지 않는다.
5. 외부 라이브러리는 runtime 안에서만 쓴다. 수업 파일은 라이브러리를 부르지 않는다.

### 수업 구조

수업 = 절(section) 3–5개 + 마무리. 절 하나 = 진단 사다리의 한 단 = 핵심 관계 하나.

```
hook
절 × 3–5:  predict → define/steps → explore/compare → 중간 확인 1문항
quiz (6–8문항) → summary
```

- 장면 16–24개, 학습 15–20분.
- 절마다 중간 확인 문항을 둔다. 긴 온라인 강의에서 중간 시험은 딴생각을 줄이고 마지막 시험 성적을 올렸다(Szpunar, Khan & Schacter 2013).

장면 타입(닫힌 목록):

| 타입 | 역할 | 상호작용 |
|---|---|---|
| hook | 현상·질문 | 움직이는 그림 |
| predict | 확정 → 공개 (공개 단계 내장) | 선택 / 그래프 위 끌기 / 곡선 그리기. 예측은 유령선으로 남아 실제와 겹쳐 보인다(Kim, Reinecke & Hullman 2017) |
| define | 용어 사전 학습 | 작은 그림 + 한 줄 정의, 이후 `{{용어}}` 팝오버 |
| steps | 메커니즘 단계 | 자동 반복, 멈춤·되감기 |
| explore | 직접 조작 | knob, 그림 위 핸들, 도전 목표 |
| compare | 대비 사례 | 같은 scale의 두 패널 |
| quiz | 인출 연습 | 선택·수치(허용 오차)·순서·분류, 즉시 피드백, 오답별 설명 |
| summary | 한 장 정리 | 앞 장면 그림이 제자리로 모이는 공유 요소 전환 |

check가 강제하는 문법:

- 첫 장면은 hook 또는 predict. 절마다 첫 설명 장면 앞에 predict 1개.
- `meta.learner.misconceptions`마다 그것을 겨냥한 predict 1개.
- 모든 장면에 `focus`. 강조색은 focus 도형에만, 나머지는 중립색.
- 퀴즈 문항마다 `meta.objectives` 중 하나에 연결, 오답 선택지마다 피드백, 전이 문항 1개 이상.
- `{{용어}}`는 define 또는 glossary로 정의한 뒤에만 쓴다.
- 수치 모델마다 해석해가 알려진 극한 check 1개 이상.
- 출처 없는 수치는 `illustrative: true` → 화면에 "가상 예시" 표시.

### 인포그래픽 계약

```js
export default lesson({
  meta: { title, objectives: [...], learner: { knows, misconceptions, review } },
  checks: [   // 모델보다 먼저 쓴다. 한 번에 Write하면 파일 앞쪽이 먼저 생성된다
    { model: "flight", at: { v0: 20, deg: 45, k: 0 }, expect: { range: 40.8 }, tol: 0.2 },
  ],
  models: { flight: model({ v0: 20, deg: 45, k: 0.02 }, p => simulate(p)) },
  figures: {
    field: figure({ x: [0, 45, "m"], y: [0, 15, "m"], aspect: "equal", loop: 2600 },
      ({ flight }, t) => [
        line(flight.path.until(t), { id: "drag", tone: "focus" }),
        dot(flight.at(t), { id: "ball" }),
        dim([0, 0], [flight.range, 0], { id: "R", text: `${flight.range.toFixed(1)} m` }),
      ]),
  },
  sections: [{ concept: { id, title, definition, level, requires }, scenes: [ /* 위 장면 타입 */ ] }],
  quiz: [...],
});
```

어휘는 차트 종류 목록이 아니라 서로 독립인 층으로 둔다. 층끼리 조합하므로 문서 크기는 항목 수의 합으로 늘고, 표현할 수 있는 그림은 곱으로 는다.

| 층 | 항목 |
|---|---|
| 좌표계 | cartesian(선형·로그), polar(고리 포함), lanes(시간축 레인), graph(tree·layered·force·sankey 자동 배치), grid(셀·단위 칸), space3d(정사영·원근 투영), geo(지도 투영, 지연 로드) |
| 도형 | axis, grid, line, area, dot, rect, arc, arrow, path, label, dim(치수선), angle, brace, node/edge, cell, field(f(x,y)의 색·화살표장), glyph(회로·광학·사람·서버 등 기호), icon, math, code(줄·구간 강조), mock(UI 틀) |
| 움직임 | morph, flow(입자), accumulate, trace, draw, split/merge, camera(확대·인셋), sweep(훑는 강조). v1 `look/look.md`의 움직임 8종과 같다 |
| 구도 | full, hero, split(같은 변수 동시 강조 `link`), multiples(축 공유 강제), overlay |
| 모델 도우미 | ode(RK4), rng(seed), sample·histogram, particles, argmax·root, interpolate, 단위 변환 |
| plugin(지연 로드, 후보) | 악보, 화학 구조식, 소리(Web Audio) |

- 시간: `loop`(모델 시간 반복), `steps`(단계 반복), `idle`(은은한 반복), 정적 그림은 `static: "<이유>"`.
- agent가 처음 읽는 계약(`lesson.d.ts`)에는 core 층 전체를 한 줄씩 둔다. plugin·geo의 자세한 문서는 정확한 이름으로만 연다(`ltt docs <이름>`). v1처럼 키워드 grep으로 부품을 찾지 않는다.
- 움직임: 개념의 시간·변화를 보일 때만 크게 움직인다. 연속 애니메이션은 지나간 정보를 붙잡게 해 부담을 키우므로(Ayres & Paas 2007) 멈춤·되감기를 늘 두고, 잔상(trail)으로 멈춘 화면에서도 시간을 읽게 한다. `prefers-reduced-motion`이면 루프를 멈추고 잔상만 보인다.
- 장면 전환: 같은 `id` 도형은 새 위치로 이동·변형한다. 전환 중간 프레임은 UI 보간이고, 수치를 보이는 프레임은 늘 `model(t)` 값이다.
- 탈출구: `custom(ctx => …)`는 frame 안 SVG 그룹만 받고, check가 경계를 검사한다. 쓰면 result.md "어휘 후보"에 적는다.

### 표현 범위

- `custom`은 v1처럼 SVG를 직접 그리되 model·시간 계약 안에서 그린다. 그래서 표현 범위는 v1보다 좁아지지 않는다. 레이아웃 보장은 어휘가 덮는 그림에만 있다. 따라서 범위의 지표는 `custom`을 쓴 그림의 비율이다.
- v1 shot 49개(`look/look.md`, s05·s08 없음)를 위 어휘로 지면 대조한 결과(2026-10-23): 49개 모두 core 층으로 표현할 수 있다. 렌더로 확인한 것은 아니다. 처음 제안한 어휘(좌표계 5, 도형 14, 시간 3)로는 움직임 operator, 로그·고리 좌표, `link`, camera, glyph, code, mock이 없어 부족했다. gallery-v2 수업에서는 space3d(drawing-basics 원근), mock(visual-hierarchy), 로그-로그(single-gpu roofline)가 추가로 필요했다.
- 잘 덮지 못하는 주제:
  - 사실적 일러스트(해부도, 식물 형태, 미술 작품), 사진·영상이 본질인 절차(실험 술기, 운동 자세). 도식으로만 대신한다.
  - 글이 본질인 인문 주제(문학 해석, 역사 서술). 연표·논증 지도로 구조만 보이고, 절마다 그림 필수 규칙의 예외(`figure: none, reason`)를 허용한다.
  - 큰 실데이터(수천 행). spec 토큰이 커진다. 요약 표 + 출처, 또는 seed 기반 가상 데이터(`illustrative`)로 대신한다.
  - 본격 3D(메시·조명). space3d는 점·선·면의 가벼운 투영까지다.

### UI

- 데스크톱: 왼쪽 stage(그림, 장면이 바뀌어도 유지·변형) + 오른쪽 card(글·입력). 모바일: stage 위 고정, card 아래, 스와이프.
- 최소 글자 크기·대비·여백·글 분량 상한은 runtime 상수다. 수업이 바꿀 수 없다.
- runtime 내부 의존성: React + Motion(`layoutId` 공유 요소 전환, spring), d3-scale/shape/array, KaTeX·elkjs는 쓰는 수업만 지연 로드.

### 생성 흐름 (agent)

| 단계 | 하는 일 |
|---|---|
| 0 | 진단(아래). 결과는 `meta.learner`와 절 목록이 된다 |
| 1 | SKILL.md + `lesson.d.ts` + 가장 가까운 예시 1개를 읽는다 |
| 2 | 절 목록과 절마다 핵심 그림 한 줄을 대화에 알리고 기다리지 않는다(v1 rejection `20187af899089f43`) |
| 3 | `lesson.js`를 한 번에 Write한다 |
| 4 | `ltt check` → 오류(경로·기대·제안)를 Edit로 고친다 |
| 5 | `ltt sheet` → 장면 핵심 상태 contact sheet PNG를 한 번 보고 명백한 것만 고친다 |
| 6 | 제공(아래) |
| 7 | 학습이 끝나면 이벤트를 읽고 대화 서술 퀴즈 → `ltt result` → map |

v1의 storyboard(설명 방식 2–3안 그려서 고르기)는 없앤다. 그리는 시간과 대기가 들고, 절 목록 공지로 방향을 바꿀 기회는 남는다.

### 제공 경로

- runtime은 `@doggy-footprint/ltt-runtime`으로 npm에 공개하고, 수업 HTML은 jsDelivr의 정확한 버전을 불러온다. 같은 수업 파일이 로컬·Claude Code Artifact·claude.ai에서 열린다. 옛 수업은 버전 고정으로 계속 열린다.
- Claude Code: `ltt open`이 로컬 서버로 수업을 열고 학습 이벤트를 `events.jsonl`로 받는다(v1 rejection `fe3a45c84cd7828b`). 폰 열람은 Artifact 게시.
- claude.ai: 수업은 artifact 하나. sheet는 없다. Node를 쓸 수 있으면 check를 돌리고, 없으면 "미점검"을 표시한다. 결과는 artifact 안 result 블록에 두고 Claude Code `import`로 map에 넣는다(v1 standalone 방식).

### 진단·결과·지식 map

v1 SKILL.md §1·§4·§5·§6과 `skills/learn-to-tell/map/`(archive/v1)을 이어 쓴다. 바뀌는 점만 적는다.

- 진단 사다리의 단 하나가 수업의 절 하나다. 오개념은 `meta.learner.misconceptions`로 들어가 predict 문법 검사 대상이 된다.
- 쪽 안 퀴즈(객관식·수치)는 자동 채점하고 이벤트로 남긴다. 대화 서술 퀴즈는 v1 §4(질문 만들기, 선택·의미 설명)를 그대로 쓴다.
- `result.md` frontmatter의 `concepts`는 `ltt result`가 절의 `concept`과 퀴즈 이벤트에서 만든다. agent는 같은 내용을 두 번 쓰지 않는다.

### 목표 수치

측정 조건은 v1 시험과 같다(`bench/v1-results.md` "지표"·"실행 방법": 고정 진단, 서브에이전트 완료 알림의 `subagent_tokens`·`duration_ms`). 진단 대화와 학습 시간은 빼고 잰다.

| 지표 | 목표 |
|---|---|
| 생성 토큰 | 120k 이하 |
| 생성 시간 | 12분 이하 |
| check 실행 | 3회 이하 |
| sheet 확인 | 1회 |
| contact sheet 블라인드 쌍 비교 (같은 prompt의 일반 요청 대비) | v2 우세 80% 이상 |

### 품질 판정 (bench)

- 같은 prompt로 일반 요청과 v2 수업을 만든다. 주제는 `bench/topics.md`(18개)를 쓴다. 그중 5개는 일반 요청 산출물이 `archive/v1:site/compare1/`에 있다.
- 객관 지표: 기대값 일치, 레이아웃 결함 0, 장면당 글자 수, 예측 지점 수, 절당 중간 확인 유무.
- 쌍 비교: contact sheet를 이름을 가린 채 판정 agent와 사용자가 비교한다.

### 마일스톤

| | 내용 | 끝 조건 |
|---|---|---|
| M0 | 범위 지면 감사 + `lesson.d.ts` 계약 + 손으로 쓴 예시 수업 1개 | v1 shot 49개, gallery-v2 17개 수업의 그림, v1에 없던 분야 12개 × 2주제를 어휘만으로 적어 `custom` 비율 10% 이하. 타입 검사 통과, 사용자 검토 |
| M1 | runtime: stage·card, 감사에서 많이 쓰인 층부터(space3d·geo·plugin은 뒤로), predict 3방식, quiz, summary 전환. v1 shot 12개(움직임 8종·구도 5종을 한 번 이상)를 v2 spec으로 다시 써서 회귀 corpus로 둔다 | 예시 수업과 corpus가 데스크톱·모바일에서 렌더 |
| M2 | `ltt check`, `ltt sheet` | 예시 수업의 고의 결함 목록을 모두 잡음 |
| M3 | SKILL.md, 예시 2개, bench 3주제 | 목표 수치 측정 |
| M4 | 진단·`ltt open`·`ltt result`·map 이식 | v1 흐름 전체가 한 주제로 끝까지 돎 |
| M5 | npm 배포, claude.ai standalone, import | claude.ai에서 수업 1개 생성·열람 |

## 기각한 대안

| 대안 | 이유 |
|---|---|
| v1식 자유 HTML + 보조 kit | 토큰 8.2×(compare1), 결함이 렌더해야만 보여 audit·검증 반복이 시간의 58% |
| v1 kit처럼 차트 종류별 부품 목록(hbars, lanes, sankey, plane 등 35개) | 필요가 생길 때마다 부품과 문서가 하나씩 늘고(부품 문서 85KB), 부품끼리 조합되지 않는다 |
| headless audit 반복 + 검증 서브에이전트 기본 사용 | 위와 같음. 구조 보장으로 대체 |
| Manim · Motion Canvas · Remotion | 빌드·렌더 파이프라인이 필요하고 결과가 영상이라 조작 불가 |
| Observable Plot · Vega-Lite를 그림 층으로 | 프레임마다 모델을 그리는 애니메이션과 도식(궤적, 프로토콜 사다리)에 맞지 않고 agent가 배울 계약이 하나 더 생긴다 |
| 스크롤리텔링 | 예측 확정 지점을 두기 어렵고 모바일 스크롤과 충돌 |
| View Transitions API만으로 전환 | SVG 내부 도형 단위 모핑을 못 한다 |
| storyboard 단계 유지 | 2–3안을 그리는 시간과 사용자 대기. 절 목록 공지로 대체 |

## 열린 질문

- claude.ai 코드 실행 환경에서 Node로 `ltt check`를 돌릴 수 있는가 (M5에서 확인).
- claude.ai artifact에서 runtime이 쓸 글꼴(예: Pretendard)을 불러올 수 있는가 (M5에서 확인).
- 독립 검산 서브에이전트를 켤지 (M3 bench의 수치 오류율로 정함).
