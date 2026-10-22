---
name: learn-to-tell
description: This skill generates a learning material in html for a quick and wide understanding of given topic. The level and coverage of the learning material is determined by the user's needs and situation. This tool relies on a visualization to give intuitive understanding of the topic. The purpose of the education is for a better decision making in the original task, or simply for user's demand. Offer this skill if lack of knowledge in certain domain is blocking user's decision making.
---

# Learn to Tell

## Goal of this skill
Make an visual learning material for a given topic to help user get intuitive understanding of the topic to help user's decision making in the original task.

경로 규칙: `<skill>`은 이 skill의 base directory, `<home>`은 `$LTT_HOME`(기본 `~/.learn-to-tell`)이다.

## 0. 시작

- `<home>`과 로컬 서버를 쓸 수 없는 곳(claude.ai 웹·모바일)이면 `<skill>/standalone.md`를 먼저 읽고 그 표대로 바꿔 진행한다.
- 인자가 `import`면 `<skill>/map/import.md`만 읽고 따른다.
- 작업 중 agent가 먼저 제안할 때는 모르는 내용과 그것이 막는 결정을 한 문장으로 말하고, 학습할지 묻는다. 사용자가 받아들이기 전에는 진단을 시작하지 않는다. 학습은 작업 세션에서 `/fork`한 세션에서 한다. 지금 세션이 fork한 세션이 아니면 `/fork` 후 그 세션에서 `/learn-to-tell <주제>`를 실행하라고 안내하고 멈춘다. 진단(§1)만은 지금 세션에서 해도 된다.
- lesson id는 `YYYYMMDD-<kebab-slug>`, 디렉터리는 `<home>/lessons/<id>/`다.
- `node <skill>/map/ltt-map.mjs lessons`로 같은 주제의 수업을 찾는다. `lesson.html`이 있는 디렉터리만 이미 있는 수업으로 보고, 그것을 다시 열지 새로 만들지 사용자에게 묻는다. `lesson.html`이 없는 디렉터리(계획·storyboard에서 멈춘 것)는 없는 수업으로 본다.
- 지식 map은 통째로 읽지 않는다. 학습 사다리의 개념 이름으로 `ltt-map.mjs find "<이름>"`을 실행하고, 걸린 개념은 `ltt-map.mjs show <id>`로 그 개념과 이웃만 읽어 진단(§1 2·5번)에 반영한다.
- `<home>/background.md`가 있으면 읽고 사다리를 세울 높이, 예시, 풀어 줄 용어를 배경에 맞춘다. 배경(직업, 익숙한 도메인·도구, 전제 지식, 선호하는 설명)을 새로 알면 `- <YYYY-MM-DD> <사실 한 줄> (출처: 진단 | 대화 | lessons/<id>)`을 덧붙인다(같은 내용이면 날짜만 고친다, 파일 제목은 `# Learn to Tell background`). 개념별 학습 상태는 map에 둔다.

## 1. 진단

1. 학습 대상 정하기: 사용자가 배우려는 내용을 구체화한다. 사용자가 구체적으로 정하지 못하면 키워드에서 일반적인 교육과정과 그 개념의 선수 과목을 가정해, 낮은 수준부터 올라가는 **학습 사다리**를 세운다.
2. 시작 지점 정하기: 사다리의 아래 단부터 그 내용을 아는지 묻는 간단한 퀴즈를 카드로 하나씩 보인다. 선택지는 "확실히 알고 있음 / 아예 모름 / 이해한 내용을 설명하기"다. 알고 있으면 위 단, 모르면 아래 단으로 가고, 설명을 받으면 agent가 맞고 틀림을 판단해 같은 규칙으로 이동한다. 최대 5회 반복해 학습을 시작할 단을 정한다. 도중에 사용자가 물으면 짧게 답하고, 그 내용을 학습 내용에 추가한다.
3. 종료 지점 정하기: 일반적으로 설명이 끝나는 곳, 즉 수업 단위의 끝이나 연관 개념이 다른 주제로 넘어가는 곳을 경계로 한다. Task에서 시작했다면 이 프로젝트에서 그 내용이 필요한 수준을 경계로 한다. 필요하면 경계를 사용자에게 묻는다. 수업 끝에는 이어서 공부할 수 있는 목록을 **개념 나무** 그래프로 보인다(학습 흥미 유발용).
4. 유저 확인: 유저에게 지금까지 정한 학습 범위와 시작·종료 지점을 보여 주고 확인한다. 필요하면 수정한다.
5. 복습: `show`로 읽은 개념 중 `freshness`가 fading·stale인 것이 있으면 2번의 질문에 포함한다. 사용자가 모르면 복습 대상으로 지정한다.

## 2. 범위

- **진단**으로 정해진 학습 범위를 어떻게 효과적으로 전달할 수 있을지는 agent가 정한다. 단, 필요한 경우 사용자의 선호를 물어볼 수 있다. 자세한 내용은 **학습 자료**를 참고한다.
- **simple 경로**: 대화 안의 짧은 자료와 서술 퀴즈로 진행하고 §3을 건너뛴다. 학습이 필요 없는 경우에 해당한다.

## 3. 학습 자료

학습 자료는 사용자가 **혼자 읽고 이해할 수 있어야 한다**. 설명의 중심은 그림이다. 

> 그림이 보여주는 것은 모두 사실이어야 한다. 그림의 요소와 관계는 실제 대상과 대응하고, 학습자가 그림에서 읽어 낸 결론은 실제에서도 성립해야 한다. 단순화하거나 축척을 깨야 하면 그림에 그렇게 표시한다.
>
> 그림은 설명하고자 하는 것을 담고, 그 중 핵심 관계가 가장 먼저 눈에 띄게 한다.

그림에 더해 확장 학습 자료로 기호와 글, 추상적인 설명을 첨가할 수 있다. 이를 포함하여 어떤 전략으로 학습 자료를 구성할 것인지는 agent가 결정한다. Agent는 무엇이 학습 과제인지를 바탕으로 효과적으로 전달할 수 있는 전략을 선택한다.

### 평가 기준 (sub agent)
> 학습 자료의 생성은 다음 단계로 이루어진다. 계획 → 평가 기준 checklist 작성 (파일로 작성한다.) → 학습 자료 생성 → sub agent를 통한 체크리스트 평가. 
> 체크리스트를 먼저 읽으면 정확한 평가가 어려우므로 checklist는 시행과 정답을 분리해서 작성한다.

1. 그림만 보고 답할 수 있는 질문 하나를 두고, 그 답이 실제와 같은지 확인한다.
2. 그림에서 시선이 가는 요소가 설명하고자 하는 것과 관련된 부분인지 확인한다. 설명 대상과 무관한 요소가 눈에 띄면 그림을 고친다.

### Auxiliary kit

아래는 생성에 도움을 주기 위한 kit이다. agent는 kit을 읽지 않고, 검색어로 필요한 부분만 찾아 쓴다. kit은 agent가 정한 전략과 구조를 보조하는 역할만 한다. kit에 없는 것은 직접 짠다.

- 필수 파트: theme, `{{용어}}` 풀이, `LTT.expect`, `LTT.record`(이벤트 기록), 움직이는 그림은 `LTT.clock`(id를 붙인다). 사용법은 `<skill>/kit/API.md`의 "페이지 계약"·"불러오기"·"기본 이름" 절에 있다. 이 세 절만 읽는다.
- 그 밖의 파트는 정한 구조가 있을 때만 찾는다. 설명 대상(예: 시간에 따른 변화, 구성 요소 관계), 방식(예: 2D 지도, diagram, 흐름도, 그래프, 목업), 그림 종류의 키워드로 `kit/API.md`의 "부품 고르기" 표를 grep하고, 걸린 줄의 참조 문서만 읽는다.
- 그리는 방법의 본보기는 `<skill>/look/look.md`의 shot 색인이다. 개념 구조·움직임 열을 grep해 맞는 shot 2–3개의 카드(`look/shots/sNN.jpg`)를 본다. shot의 주제·문구·수치·배치는 옮기지 않는다. `look/board.jpg`는 완성도 기준으로 한 번 본다.

### 생성 순서

턴마다 context 전체를 다시 읽으므로 아래 순서를 한 번 지나간다. 되돌아가는 곳은 3번의 사용자 선택과 7번의 고침뿐이다. 파일은 모두 `<home>/lessons/<id>/`에 둔다.

1. **계획** `outline.md`: §1에서 정한 범위(시작·종료 지점, 복습 대상), 전달 전략과 설명 흐름(비트 한 줄씩), 주장과 근거(출처), 수치 모델의 공식과 계산 지점마다 직접 구한 기대값(모델 코드보다 먼저 적는다), 수업 끝 개념 나무에 넣을 다음 개념, §4에서 쓸 학습자 평가 기준.
2. **검증표**: 시행과 정답을 두 파일로 나눈다.
   - `checklist.md`: 그림마다 그림만 보고 답할 질문 하나(위 평가 기준 1), 그 그림에서 가장 먼저 눈에 띄어야 할 것(평가 기준 2), 움직이는 그림의 핵심 상태는 `[shot <id> <ms>]` 표식(한 그림에 여러 개 가능), 형식과 무관한 수업 항목(정의 전에 쓴 용어·기호가 없다, 예측을 묻기 전에 답을 말하지 않는다, 수업 끝에 한 장 정리와 떠올리기 질문, 개념 나무가 있다 등).
   - `answers.md`: `checklist.md` 항목 번호마다 정답(실제 대상에서 성립하는 답, 눈에 띄어야 할 요소).
3. **storyboard** `storyboard.html`: 서로 다른 설명 방식 2–3안을 나란히 그린다. 안마다 수업의 근간이 될 핵심 그림 3–5장을 실제로 그리고(움직여도 된다), 그림마다 비트 한 줄을 붙인다. 서버(6번)를 띄워 `http://127.0.0.1:47823/lessons/<id>/storyboard.html`을 안내하고 사용자가 고를 때까지 기다린다. 사용자가 섞거나 고치라고 하면 storyboard를 고쳐 다시 보이고, 바뀐 그림에 맞춰 `checklist.md`·`answers.md`를 고친다.
4. **생성**: 고른 안의 그림을 근간으로 `lesson.html`을 한 번에 Write한다. 형식은 자유다(넘김, 스크롤, 한 화면). 기대값은 1번에 적은 값을 `LTT.expect`에 넣는다.
5. **점검과 검증**: `node <skill>/server/audit.mjs <home>/lessons/<id>/lesson.html --shots <home>/lessons/<id>/shots --checklist <home>/lessons/<id>/checklist.md`를 실행한다. 출력의 `check` 오류와 expect 불일치는 Edit로 고치고 0이 될 때까지 다시 돌린다. expect 불일치는 먼저 손으로 다시 계산하고, 모델에 맞춰 기대값을 고치지 않는다. 0이 되면 검증 서브에이전트를 띄운다(아래 검증). 받은 미충족 항목을 한 응답의 Edit 묶음으로 반영하고 점검과 검증을 다시 돌린다. 검증은 최대 3회다. 3회째에도 미충족 항목이 남으면 그 항목을 보이고 더 고칠지 사용자에게 허락을 구한다.
6. **공개**: 서버를 백그라운드로 실행한다: `node <skill>/server/server.mjs`(실행 중이면 재사용, 포트는 `LTT_PORT`). `http://127.0.0.1:47823/lessons/<id>/lesson.html`을 안내한다.
7. 사용자가 다 봤다고 하면 `events.jsonl`의 예측, `term`, `recall`, `goal`, `expect-mismatch`, `lint` 이벤트를 읽는다. 여러 번 연 용어와 비었거나 틀린 `recall`은 §4에서 다시 묻는다. 사용자가 고칠 곳을 말하면 Edit로 고치고 5번을 다시 지난다.

하지 않는다:
- kit 소스(`kit/*.js`, `kit/*.css`)와 `server/*.mjs`를 읽지 않고 `node -e`로 kit을 실험하지 않는다. kit 파트를 찾는 grep은 위 키워드 검색만 한다. 찾지 못한 것은 페이지에 직접 짜고 `result.md`의 "kit 후보"에 적는다.
- `lesson.html`을 다시 통째로 쓰거나 python·sed로 고치지 않는다(Edit만). Edit가 맞지 않을 때만 그 부분을 Read한다.
- 검증을 통과하려고 `checklist.md`·`answers.md`를 고치지 않는다. 고칠 수 있는 때는 3번에서 사용자가 storyboard를 바꿨을 때뿐이다.
- audit을 `timeout`으로 감싸지 않는다(스스로 시간을 제한한다).

### 검증

- **검증 서브에이전트** 1개, 모델은 지정하지 않는다. 주는 것: `checklist.md` 경로, 스크린샷 디렉터리 경로, `answers.md` 경로, `background.md` 경로. `lesson.html`, 모델 코드, `outline.md`는 주지 않는다.
- 프롬프트에 순서를 적는다: `checklist.md`와 스크린샷만 보고 항목마다 답을 먼저 정한 뒤 `answers.md`를 연다. 두 답이 다르거나 항목을 만족하지 않으면 그 항목만 `항목 번호: 본 것 | 기대한 것` 한 줄로 보고한다. 모두 만족하면 "없음"만 답한다. 검증표를 다시 옮겨 적지 않는다.
- 서브에이전트를 쓸 수 없으면 검증표의 질문을 스크린샷에 직접 답하고, 수업의 해당 주장에 "미검증" 태그를 단다. 자기 확언만으로 정확성을 인정하지 않는다.
- audit은 헤드리스 Chrome으로 `lesson.html?shot`을 1440×900과 1280×800에서 열어 `check` 오류를 내고 스크린샷을 남긴다. 규칙 뜻은 `<skill>/kit/api/rules.md`에 있고, 출력만으로 고칠 수 있으면 읽지 않는다. Chrome이 없으면(종료 코드 2) 브라우저에서 `lesson.html?shot`을 두 크기로 열어 보고, 스크린샷 대신 사용자에게 화면 캡처를 부탁하거나 검증을 "미검증"으로 둔다. 폰 화면은 점검하지 않는다.

## 4. 이해 확인 (대화)

- 서술 퀴즈로 배운 내용을 자기 말로 설명할 수 있는지 확인한다. 작업에서 시작했다면 **질문 만들기**와 **선택·의미 설명**도 확인한다. 평가 기준은 `outline.md`에 적어 둔 것을 쓰고 보여 주지 않는다.
- 판정은 pass / fail / skipped다. 제출된 답은 skipped로 처리하지 않는다. pass는 "이번 상황과 도움 수준에서의 관찰"이지 능력 판정이 아니고, 도움을 받은 수행은 따로 표시한다.
- 피드백은 관찰 근거 중심으로 하고 사실 판정과 정서적 지지를 분리한다. 작업의 핵심 결정이 있으면 1건은 찬성·반대 조건을 대칭적으로 확인한다.

## 5. 작업 복귀

`<home>/lessons/<id>/result.md`를 항상 쓴다. 맨 앞 YAML frontmatter가 지식 map의 원본이고(`ltt-map`이 `<home>/concepts/`, `map.md`, `map-data.json`을 만든다), 본문은 사람이 읽는 기록이다.

```markdown
---
lesson: <id>                  # 디렉터리 이름과 같아야 한다
date: <YYYY-MM-DD>
concepts:                     # 이번 수업에서 다룬 개념. 없으면 `concepts: []`
  - id: <[a-z0-9][a-z0-9-]*>
    title: <표시 이름>
    aliases: [<별칭>]          # 선택
    definition: <한 줄 정의>
    domains: [<domain id>]    # 1개 이상, [a-z0-9-]+
    level: <1-5>
    requires: [<개념 id>]      # 선택: 먼저 알아야 하는 개념
    leads_to: [<개념 id>]      # 선택: 이걸 배운 다음 배울 수 있는 개념
    quiz: <pass|fail|skipped|none>
---
# <주제> (<id>)
- 작업: <원래 작업 한 줄, 작업 없이 시작했으면 "없음">
- 진단: <시작 지점과 종료 경계 목록(대략), 복습 대상>
- 이번 결정: <선택 또는 보류 이유, 작업이 없으면 생략>
- 선택을 바꾸는 조건: <조건, 작업이 없으면 생략>
- agent에게 할 질문: <질문들>
- 퀴즈: <문항별 pass/fail/skipped, 도움 여부>
- 미룬 범위: <다음 수업 후보>
- 다음 개념: <수업 끝 개념 나무에 넣은 개념>
- storyboard: <고른 안과 사용자가 고친 점>
- kit 후보: <문서에 없어 직접 짠 것·반복된 패턴, 없으면 생략>
- 생성 비용:
  - lesson.html: <바이트>, 그림 수 <n>
  - 서브에이전트: 검증 <n>회, 남은 미충족 <항목 번호, 없으면 0>
  - audit: <n>회
  - 시각: 시작 <YYYY-MM-DD HH:MM>, storyboard 공개 <HH:MM>, 공개 <YYYY-MM-DD HH:MM>
  - 토큰: <합계, 읽을 수 없으면 "없음">
```

생성 비용은 단계마다 재지 않고 `result.md`를 쓸 때 한 번 적는다.
토큰은 세션 transcript의 usage를 읽을 수 있을 때만 적고, 없으면 "없음"으로 두고 lesson.html 바이트로 대신한다. transcript 형식은 공개된 API가 아니다.

작업에서 시작했으면 그다음 ListAgents로 원래 작업 세션을 찾아 SendMessage로 요약과 `result.md` 경로를 보낸다. 찾을 수 없으면 사용자에게 경로를 알려 원래 세션에 전달하게 한다.

## 6. 지식 map

map은 `result.md` frontmatter(원본)와 `<home>/decisions.jsonl`(merge·link·reject 기록)에서 `ltt-map`이 만든 파생물이다. `<home>/concepts/*.md`, `map.md`, `map-data.json`은 직접 고치지 않는다. 명령은 `node <skill>/map/ltt-map.mjs <cmd>`다.

### 개념을 적기 전에: 찾고, 재사용한다

1. 후보마다 `ltt-map.mjs find "<이름>"`을 실행한다. `exact` 줄이 있으면 그 `id`를 재사용한다.
2. 비슷한 후보만 있으면 `show <id>`로 정의를 비교해 같은 개념이면 재사용한다. 애매하면 사용자에게 묻는다. 한 개념이 두 id로 갈라져 있으면 `decide merge <없앨 id> <남길 id>`.
3. 쓰고 나면 `ltt-map.mjs rebuild`. `error <path>: ...`가 나오면 frontmatter를 고치고 다시 실행한다.

### 입자도와 level

- 개념 하나 = 퀴즈 문항 하나로 확인할 수 있는 개념 하나. 더 크면 나누고, 따로 확인할 수 없으면 이웃 개념에 넣는다.
- `level`: 1 = 신입생·신입 사원의 기초 / 2 = 입문 과정을 마친 수준 / 3 = 실무에서 판단에 쓰는 수준 / 4 = 설계·트레이드오프를 이끄는 숙련 수준 / 5 = 연구·전문가 수준.
- `requires`·`leads_to`는 모르면 비워 둔다. 선수 개념의 level이 더 높으면 경고가 나온다.

### 연결 점검 (sweep)

1. 결과를 쓴 뒤 `ltt-map.mjs sweep`을 실행한다. 출력 JSON의 `due`가 `false`면 멈춘다.
2. `true`면 JSON을 Haiku 서브에이전트에게 주고 `new`와 `existing`(과 `new`끼리)의 선수·다음 관계와 중복 쌍을 제안하게 한다. 프롬프트에 적는다: 제안 0건은 정상이고 억지로 만들지 않는다, 제안마다 이유를 한 문장으로, `edges`·`rejected`의 쌍은 다시 제안하지 않는다.
3. 제안은 `definition`을 보고 직접 판단해 `decide link <선수 id> <후속 id>`, `decide merge`, `decide reject <id> <id>`로 기록한다.
4. 끝나면 `ltt-map.mjs sweep-done <id>...`로 이번에 본 `new` 개념을 표시한다.

### 찾아 보기

- `find "<텍스트>" [--domain d] [-k n]`, `show <id> [--depth 1|2]`.
- `lessons`: 수업 디렉터리마다 `<id> | finished|unfinished | 파일 목록`을 출력한다. 사용자가 지난 수업이나 저장된 파일을 물으면 이것으로 답한다.
- 격자 `http://127.0.0.1:47823/map/grid.html`, 개념 상세 `http://127.0.0.1:47823/map/focus.html?id=<id>`(서버가 켜져 있어야 한다). 학습을 마치면 방금 다룬 개념의 focus URL을 안내한다.
- 마지막에 다음 학습 경로를 한두 줄 제시한다. 후보는 `status`가 weak인 개념, `freshness`가 fading·stale·weak인 개념, `show`에서 frontier로 표시된 `leads_to` 개념이다.
