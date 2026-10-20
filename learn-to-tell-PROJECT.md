# Learn to Tell — 프로젝트 정의

이 프로젝트가 무엇을 하고 어떻게 동작하는지 적는다. 수업을 만드는 규칙은 `skills/learn-to-tell/SKILL.md`와 그 skill이 읽게 하는 문서에, 지난 결정과 그 이유는 `agent-docs/adr/`·`agent-docs/rejections/`에 있다.

## 1. 무엇을 하나

Learn to Tell은 함께 작업하는 AI agent가 skill로 제공하는 짧은 상호작용 학습 도구다.

- 대상: 사용자와 agent 사이의 공통 지식 기반(common knowledge base) 차이, 곧 사용자가 아직 모르는 지식이다. tacit knowledge는 다루지 않는다.
- 하는 일: 작업 초기에 사용자가 모르는 핵심 결정 변수를 짧은 대화 진단(quick survey)으로 찾는다. 그 결정 변수를 이해하는 데 필요한 교과서 기본기를 시각 자료·시뮬레이션·실제 예시로 익히게 하고, 서술 퀴즈로 확인한 뒤 결과를 원래 작업으로 돌려준다.
- 목표: 숙련이 아니라, 사용자가 (1) 적절한 질문을 하고 (2) agent의 도움으로 결정 변수를 고르고 (3) 그 선택의 의미를 설명하고 (4) 지금까지 배운 것을 map에서 찾아 복습할 수 있게 하는 것이다.
- 핵심 결정 변수: 결과를 바꾸는 선택 항목이다. 개념 이름이 아니라 선택지·영향·필요 정보·실패 조건으로 다룬다.
- 사용자와 호스트: 단일 사용자. 로컬 Claude Code에서 쓰고, `<home>`과 로컬 서버가 없는 claude.ai 웹·모바일에서는 `skills/learn-to-tell/standalone.md`의 바뀐 흐름으로 쓴다.
- 시작: agent가 작업 중 지식 차이를 보고 제안하거나, 사용자가 직접 실행한다. 진단만 받을 수도, 학습까지 할 수도 있다.

## 2. 구성 요소

1. **지식 상태 확인**: 사용자가 무엇을 알고 모르는지 대화로 추정한다.
2. **학습 대상 선정**: 이번 결정 변수와 개념, 다음으로 미룰 부분을 정한다.
3. **자료 생성**: 상호작용하는 학습 자료를 만든다. 수치 분야와 비수치 분야를 모두 다룬다.
4. **이해 확인**: 읽었다는 사실이 아니라 수행으로 확인한다.
5. **작업 복귀**: 이번 결정(또는 보류 이유), 선택을 바꾸는 조건, agent에게 할 질문을 원래 작업으로 넘긴다.
6. **지식 map 관리**: 학습 상태를 로컬에 기록하고 다음 학습 경로를 제시한다.

4가 없으면 "읽었으니 안다"는 착각을 막지 못하고, 5가 없으면 일반 튜터와 구분되지 않는다.

## 3. 어떻게 동작하나

한 번의 실행은 `SKILL.md`의 §0–§6을 차례로 지난다.

- **진단(§1, 대화)**: 상황에 필요한 개념으로 낮은 수준부터 개념 사다리를 세우고, 중간 단부터 "알고 있음 / 애매함 / 아예 모름"을 물어 학습 수준을 정한다. 결과는 판정이 아니라 가설이다.
- **범위(§2)**: agent가 결정 변수·개념·다루지 않을 부분을 정해 알린다. 결정 변수마다 파트를 두고 "예측 → 조작 → 확인"으로 짠다. 조작해 볼 필요가 없으면 대화 안의 짧은 자료와 퀴즈로 끝낸다(simple 경로).
- **자료(§3)**: agent가 장면 outline을 쓰고, 검토 서브에이전트가 outline만 받아 주장·기대값·독자 문제를 본다. 그동안 agent는 kit 부품을 조합해 `lesson.html` 하나를 쓴다. audit가 헤드리스 Chrome으로 수업을 두 크기에서 열어 lint·장면 경고·기대값 불일치와 장면 contact sheet를 내고, agent는 검토 결과와 함께 Edit으로 고친다. 수업은 로컬 서버로 연다.
- **이해 확인(§4, 대화)**: 서술 퀴즈로 질문 만들기와 선택·의미 설명을 확인하고 pass / fail / skipped로 기록한다.
- **작업 복귀(§5)**: `result.md`를 쓰고, 원래 작업 세션에 요약과 경로를 보낸다.
- **지식 map(§6)**: `result.md` frontmatter에서 개념 map을 다시 만들고 다음 학습 경로를 제시한다.

학습은 작업 세션을 `/fork`한 세션에서 한다. fork는 원래 세션의 prefix를 그대로 써 prompt cache를 잇고, 학습 세션은 cross-session messaging으로 결과를 원래 세션에 보낸다(`/fork` 세션 복사 v2.1.212, cross-session messaging v2.1.224).

## 4. 구성

- `skills/learn-to-tell/SKILL.md`: 위 흐름. `standalone.md`는 서버·`<home>`이 없는 곳의 대체 흐름, `map/import.md`는 claude.ai에서 만든 수업 결과를 map에 넣는 절차다.
- **kit**(`skills/learn-to-tell/kit/`): 빌드 없는 브라우저 라이브러리. agent는 빈 `lesson.html`에서 부품을 조합한다. manim이 고수준 어휘로 agent가 영상 자료를 만들게 하듯, kit은 "결정 변수 학습"에 맞는 어휘를 준다.
  - 모듈: `ltt.js`(토큰·폰트·아이콘·용어·lint·audit 규칙·기록·기대값 대조), `ltt-parts.js`(움직이는 그림·도식·차트·모션), `ltt-ui.js`(설명 부품), `ltt-mock.js`(목업), `ltt-deck.js`(장면 덱·배치·측정). CSS 원본은 `.css`이고 `npm run build:css`가 JS에 넣는다.
  - vendor: d3, Observable Plot, d3-sankey, elkjs, KaTeX, Prism, rough.js, topojson·world-atlas, 글꼴(`kit/vendor/VERSIONS`).
  - 문서: `kit/API.md`(작성 참조)와 `kit/api/*.md`(부품별, 규칙 `rules.md`, 덱 계약 `deck-contracts.md`, 내부 `internals.md`).
- **화면 기준**(`skills/learn-to-tell/look/`): `look.md`(화면 기준·기대 화면 형식·눈 기준·shot 색인), 쉬는 화면 무드보드 `board.jpg`, 움직이는 본보기 카드 `shots/sNN.jpg`.
- **audit**(`server/audit.mjs`): 헤드리스 Chrome으로 `lesson.html?audit`을 1440×900·1280×800에서 열어 kit이 잰 결과를 출력한다. `--sheet`는 장면을 칸으로 줄인 contact sheet JPEG를 만든다. 폰 화면은 kit이 한 열로 다시 배치한다.
- **로컬 서버**(`server/server.mjs`): Node 표준 라이브러리만 쓰고 127.0.0.1에 bind한다. 수업 HTML과 kit을 제공하고, 브라우저 이벤트(예측·용어·recall·goal·기대값 불일치)를 `lessons/<id>/events.jsonl`에 쌓는다. 같은 포트에서 실행 중이면 재사용하고, 요청 없이 40분이 지나면 끝난다.
- **지식 map**(`map/ltt-map.mjs`): `result.md` frontmatter(원본)와 `decisions.jsonl`에서 `concepts/`, `map.md`, `map-data.json`을 다시 만드는 파생물이다. `find`·`show`·`sweep`·`decide`와 격자·개념 화면(`map/grid.html`, `map/focus.html`)이 있다.
- **데이터**: 개인 데이터는 저장소 밖 `$LTT_HOME`(기본 `~/.learn-to-tell/`)에 둔다. `background.md`, `lessons/<YYYYMMDD-slug>/{outline.md, lesson.html, events.jsonl, result.md, audit/}`, map 파일이다.
- **gallery**(`site/gallery/`): 조합 예시 수업, 장면 타입 데모(`scenes.html`), 부품 카탈로그(`catalog.html`), 움직이는 장면 본보기 `shots/`. 생성 흐름은 gallery를 읽지 않는다.
- **배포**: harness 확장으로 배포하고 원본은 `skills/learn-to-tell/`이다(ADR `190db09929e4196e`).
- **개발 도구**(`scripts/`): `build.mjs`(zip·kit·css·버전), `gallery-audit.mjs`(gallery audit 기준선), `shots.mjs`(shot 카드), `transcript-cost.mjs`(세션 비용), `measure/`(실사용 측정 실행·요약), `reaudit-corpus.mjs`(저장된 생성 수업을 다른 kit으로 다시 audit).

## 5. v0에서 실패한 시도

| 시도 | 실패 근거 | 원인 |
| --- | --- | --- |
| 숫자 입력칸 기반 기본 HTML 수업 화면 | 사용자 피드백 "너무한데, 더 interactive하고 눈이 즐거운 걸 기대" | 스타일이 거의 없었고, 본문은 "슬라이더"로 안내하는데 실제 입력은 숫자칸이었다 |
