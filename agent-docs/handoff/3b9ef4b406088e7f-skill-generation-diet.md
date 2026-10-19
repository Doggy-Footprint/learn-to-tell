# 수업 생성 경로 다이어트: 흐름·검증·문서·audit·kit 선언형 부품

## Goal

- "handoff를 참고해서 skill의 시행 흐름과 속도, 비용을 개선해야 해."
- "내 진짜 intent는 '이 프로젝트가 좋은 품질의 학습 자료를 빠르고 적은 토큰 비용으로 제공하는 것'이야."
- "이 계획을 임시 폴더에 커밋하고 handoff에 적어줄 수 있어? 새로운 세션에서 이어가야해"

## State

- 브랜치 `fix/efficiency`. 기준 커밋 `f16c44e`(앞 세션 handoff `418133af…` 커밋)이다.
- 승인된 계획: `agent-docs/plans/b71ddee49f77ac06-skill-generation-diet.md`. 이 handoff와 같은 커밋에 들어 있다.
- 변경 파일은 다음과 같고, 코드 변경은 없다.
  - `agent-docs/plans/`(새 디렉터리: 계획, `index.md`, `stale.md`, `stale/`)
  - 이 handoff
  - `agent-docs/handoff/index.md`
- `tmp/`는 `.gitignore`에 있어 커밋할 수 없다. 그래서 계획을 `agent-docs/plans/`에 두었다.
- `agent-docs/plans/`는 이 작업을 위해 2026-10-19 세션이 새로 만든 임시 디렉터리다. 이 handoff가 끝나면 `git rm -r agent-docs/plans`로 폴더째 지운다(사용자 지시). `stale/`로 옮기지 않는다. 이 handoff 자체는 Handoff Rule대로 `stale/`로 옮긴다.
- 계획 단계 0의 첫 항목(미커밋 handoff 커밋)은 `f16c44e`로 끝났다.
- 2026-10-19 두 번째 세션:
  - 단계 0 완료(`bed2771`): `scripts/transcript-cost.mjs`.
  - 단계 1 완료(`46feba8`): SKILL.md·API.md·rules.md·map/import.md·standalone·PROJECT·README, 테스트. `npm test` 1025 통과.
  - 단계 2 완료.
  - run A는 understanding round에서 사용자 확인을 기다린다.
  - 지시문 수정(`fc378e1`): API.md 수업 예를 다른 분야의 조합 조각으로 바꾸고 SKILL.md 범위·매체·주 그림 문단을 되살렸다.
  - AGENTS.md에 "생성된 수업의 결함은 생성기에서 고친다" 규칙을 넣었다(`96e06db`).
  - 사용자 지시로 여기서 멈췄다. 저장소 변경은 모두 커밋·푸시했다.
- 2026-10-19 세 번째 세션(화면 품질):
  - artifact-design·artifact-diagramming·dataviz에서 쓸 부분을 흡수했다. 차트 기준은 `kit/api/charts.md` "그리기", 도식 기준은 `kit/api/diagram.md` "그리기", 구조 장치 규칙은 API.md 독학 기준에 넣었다. API.md의 매체 줄은 SKILL.md §3과 겹쳐서 뺐다.
  - 모션 규칙을 "제한 없음(자동 재생·반복 허용)"으로 바꿨다(API.md, PROJECT.md).
  - 평가 먼저: `skills/learn-to-tell/look/look.md`(화면 기준, 기대 화면 형식, 눈 기준)를 새로 만들고, SKILL.md §3 outline 줄에 장면별 "기대 화면"을 넣었다. contact sheet는 아직 없어서 §3 8단계는 그대로다.
  - shot 카드 49장과 무드보드(`dd6e1f9`).
- 2026-10-19 네 번째 세션: 계획 `~/.claude/plans/vast-baking-lark.md`(1 실사용 확인 → 2 kit 움직임 부품 run M1·M2 → 3 audit `--sheet`와 눈 검토, 1·2 뒤에 `/compact`)를 승인받았다.
  - 1 완료(코드 변경 없음). `3e5d277` 대 `dd6e1f9`, 3주제(CPU+cache, cache-ttl, projectile) × 1쌍, opus low 블라인드 채점.
    - 베끼기: 0건이다. 주제·글·숫자를 옮긴 수업이 없었다. cache-ttl 변경 후의 sweep 좌우 분할이 s29와 부분적으로 닮았다.
    - 품질: 5축 합은 변경 후가 3/3 주제에서 1–2점 앞섰다(채점 편차 안). 시각 축은 projectile만 4 대 3이고 나머지 둘은 같아서 기준(2/3)에 못 미쳤다.
    - 원인(verified): 변경 후 outline의 기대 화면은 움직임을 계획했다("줄이 차례로 켜짐", "띠와 눈금이 차례로 그려짐", "화살표 셋이 자란다"). 그러나 lesson.html의 타이머·애니메이션 코드는 0줄이고, 클릭 단계(steps)로만 구현했다. 그래서 0.9s와 5s 프레임이 같다. 문서에 반복 재생 부품이 없어 움직임이 클릭 단계로 바뀐다. look.md는 고치지 않고 2로 간다.
    - 비용: 변경 후가 1.1–1.5배다(가중 46만–65만, 목표 130만 안). 이미지 Read는 3–4장(무드보드 + 카드 2–3장)이다.
  - 테스트 실행 방법(3의 마무리 측정에 다시 쓴다).
    - macOS에서 `CLAUDE_CONFIG_DIR`로 격리하면 로그인이 풀린다. 그래서 실제 config에 `--setting-sources project --strict-mcp-config --mcp-config <빈 JSON>`을 줬다. 이러면 사용자 동기 skill과 MCP가 빠지고 plugin skill만 보인다.
    - 생성 agent가 Write 경로의 `<home>`을 기본값 `~/.learn-to-tell`로 풀었다가 `$LTT_HOME`으로 옮긴 일이 1회 있었다. 사용자 파일은 바뀌지 않았다.
- 2026-10-19 다섯 번째 세션: 사용자 지시 "예외를 빼고 모든 그림을 움직이는 것을 기본으로". run M1(`6cc24f891a69c407`) 끝(status limit).
  - kit: `LTT.motion.loop/bind/reduced`(장면 수명 결합, setTimeout 16ms, 방문 범위, 같은 `el` 대체), figure `autoplay`(단계 2개 이상), sweep `attract`, 장면 `data-ltt-beats`·audit JSON `beats`, `still` 필드, audit `still-visual`(권고), predict question(기본 안내 줄 자리)·takeaway 공개 뒤, `expect` 비숫자 엄격 비교, stepper 단계 `hold`가 덱에서 버려지던 버그 수정.
  - 문서: API.md 모션 규칙 줄(예외 셋, `once`), deck-contracts, rules.md, charts.md 데이터 형식, compare head·cols, ui.md `ms`, CHANGELOG(미배포), catalog `#motion`. SKILL.md §3 권고 목록에 `still-visual`.
  - ADR `61d6c4210ba48008`: gallery 13편은 새 규칙에 맞춰 고치지 않는다. baseline에 `still-visual` 허용치(두 크기 32)를 따로 적고 `scripts/gallery-audit.mjs` 기록기도 맞췄다.
  - 검증: npm test 1139 통과, gallery audit 통과, 손 변이 13개 중 12 KILLED + 1 equivalent.
- 2026-10-19~20 여섯 번째 세션: run M2(`2d467cf453771b95`) complete(`07c9c39`), 계획 2 끝.
  - kit: `LTT.motion.play(root, [{t: [a, b], 동사: 대상, text}], {period, once, el})`, 동사 `draw`·`flow`·`camera`·`morph`·`stack`. 비트 노출은 비트 끝 시각(loop는 `period − 1`로 깎음)과 `text`. `beforeAfter().ms` = 0 또는 700 + 140(m − 1). diagram 노드·엣지·라벨, axisPlot 계열에 `data-ltt-*` 표식.
  - 문서: API.md motion 행·모션 규칙 줄(동사 이름), 샌드박스 문장 되살림, deck-contracts `play` 절, catalog 동사 데모 다섯. look.md 비트 문법(비트 하나 = 동사 하나, 끝 화면이 프레임), SKILL.md 2단계.
  - shot s29·s37·s45·s47을 `play`로 다시 썼고, `scripts/shots.mjs`가 페이지 `data-ltt-beats`의 글 있는 비트를 먼저 쓴다. 네 beats json에서는 낡은 beats를 지웠다. 카드 4장과 무드보드를 다시 찍었다.
  - 검증: npm test 1212 통과, gallery audit 통과, css in sync. shot 4편 audit 경고는 고치기 전과 같다.
- 2026-10-20 일곱 번째 세션: run S(`a96c8781ab82e025`) limit(verifier 2/2, 열린 F-2는 테스트 증거 공백, 구현은 맞음).
  - audit: `--sheet`(값 없음)가 장면을 칸으로 찍어 JPEG로 합친다. 비트가 있으면 비트 시각마다 칸(글 있는 비트 우선, 최대 4), 없으면 쉬는 칸 1. 1280×800 한 크기, 칸 320px, 4열, 위 띠 장면 번호·type·경고 배지(두 크기 합집합), 아래 띠 비트 글 3줄. 장당 1320×≤800. 수업은 `<lesson>/audit/sheet*.jpg`, 그 밖은 `<tmpdir>/ltt-audit-sheets/<slug>/`. 출력 끝 줄 `sheet <대상>: <경로>`, `--json`은 `sheet.cells`(장면·t·text·warn·사각형). Chrome canvas로 JPEG를 만든다(sips 없음).
  - kit: `#ltt-audit`에 `types`, `sceneBeats` 같은 시각이면 글 있는 비트가 이긴다(kit 후보 1).
  - 문서: SKILL.md §3 7단계 `--sheet`, 8단계 sheet 눈 검토(9,479자), look.md 눈 기준에 sheet 모양, standalone.md 검증 행, PROJECT.md 검증 절.
  - 검증: npm test 1222 통과, gallery audit 통과, css in sync. 손 변이 HM-1..HM-16 KILLED, HM-17 SURVIVED(F-2). R-1 gallery 2편 + s47 sheet 눈 확인.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |
| 단계 1 흐름(`46feba8`: outline → 한 번 Write, outline만 보는 검토 1개, 독자·눈 검토 제거) | 블라인드 비교에서 변경 전 흐름보다 낮게 평가됐다 | hypothesis: outline이 범위를 굳히고, 완성본을 읽는 검토가 없어 빠진 개념·약한 그림을 고칠 단계가 없다(뒤 분석에서 약해졌다: 분량 차이는 쓰기 전 지시문에서 생겼다) |
| run M1 FR-16 v1(predict question을 선택지 위 새 줄로) | gallery 4편 5장면이 1280×800 `shrunk`(기준 커밋 0) | verified: 줄이 늘어 배율이 88% 아래로. 기본 안내 줄 자리에 넣어 해결 |
| run M1 VO-7 판정표를 figure 기준으로 | R3(그림 없음) 행이 항상 그림으로 잡힘 | verified: figure 무대의 자식은 정의상 그림. statement 기준으로 바꿈 |
| motion 테스트 1회 실행 runner | 부하 중 bind 페이지가 결과 블록 없이 끝남(13 fail 동시) | verified: 헤드리스 Chrome이 가상 시간 예산 전에 끝남. audit.mjs처럼 3배 예산 재시도 |
| 단계 1의 눈 검토·장면별 스크린샷 제거(`46feba8`, 대체로 계획한 contact sheet는 run B 전이라 없음) | 사용자가 생성된 수업을 직접 보고 그림 결함을 찾았다. 새 흐름은 이미지를 한 번도 Read하지 않았다 | verified: 화면을 보는 단계가 없고, audit·lint가 이 결함 종류를 잡지 못한다 |
| run M2 시간 검사를 MutationObserver 콜백 시각으로 | 전체 Test command에서 offset/L +473ms 0.598 대 0.577, reduced "+6ms" | verified: 부하에서 콜백이 그리기보다 늦다. 쓰기 순간 시각 기록 + t0 맞춤, 횟수 기반 판정으로 바꿈 |
| run M2 픽스처가 다음 장면 이동을 미리 예약 | 부하에서 VO-5 E1·E2 "the play stopped" | verified: 늦은 표본 타이머를 이동이 앞질러 장면 밖에서 `running`을 읽음. 기다림을 사슬로 이어 해결 |
| shot s29·s45를 정수 바퀴 flow 비트로 나눔 | 카드 프레임끼리 입자 자리가 같다 | verified: 고른 간격 입자가 정수 바퀴를 돌면 비트 끝 화면 = 시작 화면. `laps` 0.75, 주기 내내 도는 flow + 글만 단 머무는 비트로 바꿈(look.md에 적음) |
| run S 비트 칸 아래 글을 한 줄로 | ontology-triples sheet에서 비트 글이 약 22자에서 잘림 | verified: 칸 폭 320px에 14px 한 줄. 3줄 줄바꿈 띠(56px)로 바꿈 |

## Next Step

재개 지점(2026-10-20 일곱 번째 세션 뒤): 계획 3의 남은 일.
1. run S F-2 닫기(선택): `tests/audit-sheet.test.mjs`에 late.js 장면을 budget 2000(회색 기대)·6000(파랑 기대)으로 두 번 찍는 검사를 넣고 HM-17(쉬는 칸 고정 12000)이 잡히는지 본다. 테스트만 바꾸는 일이라 새 run 없이 할지 사용자가 정한다.
2. 마무리 측정: 단계 1과 같은 3주제(CPU+cache, cache-ttl, 공기저항 최대 사거리)로 `dd6e1f9` 대 HEAD, sonnet medium 6회. 눈 검토가 그림 결함을 고쳤는지(sheet Read 수, 8단계 Edit 내용), 가중 토큰·벽시계가 얼마나 늘었는지.
3. 그 뒤 마무리(아래).
재개 지점(2026-10-20 여섯 번째 세션 뒤): 계획 `~/.claude/plans/vast-baking-lark.md` 3(run S: audit `--sheet`, SKILL.md §3 8단계·standalone·PROJECT.md, 마무리 측정)부터 한다. sheet 필름스트립은 장면 `data-ltt-beats`(글 있는 비트 우선, M2 형식 `{t, text}`)를 찍는다. 아래 kit 후보 중 1(같은 시각 비트 합치기)은 sheet가 비트 글을 읽으므로 run S에 함께 넣는 것을 기본값으로 제안한다.
M2 kit 후보(shot 4편을 다시 쓰며 나온 것):
1. 같은 시각의 비트를 합칠 때 먼저 온 글 없는 비트가 글을 가린다(`sceneBeats`). 페이지에서는 글 있는 비트를 앞에 두어 피했다(s45·s47).
2. play에 매 프레임 훅이 없어 path `d`·글자처럼 숫자 속성 하나로 못 옮기는 파생 그림은 따로 `loop`(다른 `el`)로 따라 그린다(s47 띠·칸 글자). 그 loop는 기본 비트 셋을 더 노출한다.
3. flow 입자 색을 비트마다 정할 수 없다(s45는 `r` 속성 CSS로 기체 입자 색을 바꿨다).
4. sweep `attract`(기본 true)와 render마다 play를 새로 만드는 그림이 부딪친다. 손잡이를 훑을 때마다 play가 처음부터 다시 시작해서 s29·s47은 `attract: false`.
재개 지점(2026-10-19 다섯 번째 세션 뒤): 계획 `~/.claude/plans/vast-baking-lark.md` 2의 run M2(움직임 동사)부터 한다. M2 spec에 넣을 것: M1 S-1(`LTT.beforeAfter().ms` 값 의무 — 표식 없음 0, 표식 있음 재생 길이 — 와 ui.md 문서 항목), API.md에서 크기 때문에 빠진 두 문장 되살리기(결정 변수끼리 영향을 주면 summary 앞 샌드박스, 모션 예시 "선이 그려지고·모양이 바뀌고·값이 쌓이고·패킷이 흐르며"는 동사 이름으로). M2 뒤에 main이 look.md·SKILL.md에 기대 화면 비트·예외(`still`·`once`)를 적고 s29·s45·s37·s47 카드를 다시 찍는다.
이전 재개 지점(네 번째 세션 뒤): 계획의 2(run M1)부터.
이전 재개 지점: Open Questions의 생성기 수정 제안을 사용자가 정하면 그 순서로 진행한다. 남은 것은 계획 "단계와 순서"의 단계 3–6(workflow-approach run A–D), 단계 7, 마무리다.

마무리:
- `agent-docs/plans/` 폴더를 통째로 지운다(`git rm -r agent-docs/plans`).
- 이 handoff의 index 항목을 `stale.md`로 옮기고 파일을 `stale/`로 옮긴다.
- `b41cd6ae…`와 `418133af…`도 계획대로 `stale/`로 옮긴다.

사용자가 정한 에이전트 운용:
- 작업·분석 서브에이전트는 `model: opus`, `effort: low`로 띄운다. 탐색 에이전트와 workflow의 implementer·test-implementer·test-verifier·mutant-triager가 모두 여기에 든다.
- skill을 실제로 써 보는 테스트는 sonnet-5.5 + effort medium으로 돌린다.

## Open Questions

화면 품질 작업(2026-10-19 세 번째 세션):
- 참고 GIF를 구하기 어려워 사용자 지시로 본보기 후보 51개를 kit으로 만들었다(축 조합 51, 에이전트 17 × 3). `site/gallery/shots/`에 넣었고 `shots/index.html`에서 모아 본다. 사용자가 이 중에서 shot을 고른다. 공통 kit 공백(자동 재생 반복 도우미, 그림 칸 함수의 `leave` 부재와 측정용 사본, terms 주 그림 자리, contrast 칸 폭, 경로 입자·선 그리기·카메라·배치 모핑 부품, predict `question` 미표시·`takeaway` 선공개, sweep 자동 재생, `expect` boolean)은 카드마다 "kit 공백"으로 적혀 있다. 헤드리스 가상 시간에서는 `requestAnimationFrame`이 진행되지 않아 반복을 `setTimeout`으로 돌렸다(contact sheet에 반영할 것).
- shot 카드: 사용자가 49개(05·08 제외)를 골랐다. `scripts/shots.mjs`로 카드 49장과 무드보드를 만들었고 SKILL.md §3 1단계가 무드보드 + 카드 2–3장을 읽는다. 정지 프레임으로 움직임이 잘 안 보이는 카드: s29·s45(위상 없이 계속 흐름), s37 프레임 1(비트보다 앞선 상태), s47(연도 단추가 2000에 고정). kit `LTT.timeline`(비트 시각을 알려 주는 반복 도우미)이 생기면 비트 시각을 페이지에서 받아 찍게 바꾼다.
- contact sheet: audit에 줄인 장면 스크린샷을 한 장으로 합치는 옵션을 workflow-approach로 만든다(계획 run B의 contact sheet와 같은 일). 그 뒤 SKILL.md §3 8단계를 "sheet 한 장을 Read해 outline의 기대 화면과 look.md 눈 기준으로 대조하고 Edit 한 묶음, 다시 보기는 한 번까지"로 바꾸고 PROJECT.md 검증 절에 적는다.
- shot(few-shot 본보기): 사용자가 외부 GIF를 주면 그것을 바탕으로 kit으로 본보기 10–12개를 만든다. 구성: 개념 구조(순환·순서·비율·연결·공간·시간·분포·변환) × 매체(테마) × 모션 종류가 겹치지 않는 다양성 격자, shot마다 "옮길 것(원리) / 옮기지 않을 것(주제·구도)" 캡션 두 줄, 약한/강한 대비 쌍 2–3개, 코드는 넣지 않는다(rejection `2c5216fd…`). 정지 contact sheet 1장 + 필름스트립(핵심 프레임 3–4개) 1장, 한 장 800–1000px 폭이면 된다(모델은 GIF를 첫 프레임만 보고, 긴 변 1568px 넘으면 줄여 본다). 테스트 주제의 분야는 shot에서 뺀다. kit으로 만들 수 없는 효과는 kit 작업 목록이 된다. 이미지는 `look/`에 두고 look.md에 캡션을 넣는다.


M1 입력(1 실사용 확인에서 나온 것):
- 기대 화면에 적은 움직임이 클릭 단계로 바뀌었다. figure `steps`를 자동으로 재생하는 반복 도우미가 필요하다. 이름의 기본값은 `LTT.motion`이다. 원래 계획 K5가 `LTT.timeline`을 시간축 부품 이름으로 잡아 두었다.
- 문서에 형식이 없어 추측하거나 포기한 것들이 있다.
  - `LTT.axisPlot`의 `set(id, points)` 점 형식.
  - `LTT.hbars`의 `ticks`·`tickFormat`.
  - compare `form: "table"`의 head·cols 스키마(2회).
  - 이것들은 M1 문서에서 함께 고친다.
- 손으로 그린 반복 도메인 그림: 64B 메모리 띠 격자(2회), 요청 테이프(키별 시간축 + TTL 띠, 2회, K5 후보), 한 점의 힘 화살표(2회).
- predict 장면에 그림이 없는 경우(projectile 2회)와 `shrunk` 78–86%는 6편 중 5편에 남았다.

생성기 수정 제안(사용자 결정 대기, AGENTS.md "Generated Lesson Defects"):
- lint: 장면 타입에 없는 필드(예: 타입 없는 장면의 `figure`)를 "고침"으로 잡는다.
- audit: 빈 그림, 번호 표식이 글자와 겹치거나 그림 밖에 있는 경우, 손 그림 SVG의 표식 겹침·작은 글자를 잡는다.
- 번호 표식 위치: `points.at`의 % 좌표 대신 그림 요소에 붙여, 화면을 보지 않아도 맞게 한다.
- 표현력: gallery 수업의 장면 캡처를 주제 유형별 본보기로 보여 준다.
- outline에 개념 사다리를 적고 개념마다 장면을 하나씩 대응시킨다. 용어집에만 있는 개념은 다룬 것으로 치지 않는다.

## Spec

- run M1: `agent-docs/spec-logs/6cc24f891a69c407-motion-runtime.md` v4, status limit, run ID `6cc24f891a69c407`. verifier 2/2, 정정 묶음 4, 열린 finding S-1(Next Step).
- run M2: `agent-docs/spec-logs/2d467cf453771b95-motion-verbs.md` v3, status complete, run ID `2d467cf453771b95`. verifier 2/2(retry → pass), 정정 묶음 3.
- run S: `agent-docs/spec-logs/a96c8781ab82e025-audit-sheet.md` v3, status limit, run ID `a96c8781ab82e025`. verifier 2/2(retry → retry), 정정 묶음 2, 열린 finding F-2(Next Step 1).
- 계획 단계 3–6에서 run마다 `agent-docs/specs/`에 spec을 만든다(run A: kit 측정·판정, B: audit CLI, C: 선언형 칸, D: 부품).

## Execution Ledger

### run M1 (`6cc24f891a69c407`)

- 정정: impl-1(FR-16 shrunk → 안내 줄 자리), impl-2(loop·bind 방문 범위, 같은 el 대체), TD-1~4(mark 시각, M6/M8 oracle, catalog 앵커, 공개 이름 76), verify-1 F-1~F-9(간격 ≤33ms, B5a, 재측정 증명, goal 양성 대조, 판정표 격리, contrast 식, warn 분리, VO-7 층, R-2 판정 열), run-2(사이트별 증분, statement 판정표), load-1(runPage 재시도).
- 손 변이(`agent-docs/spec-logs/6cc24f891a69c407-hand-mutations.txt`): HM-1,2,3b,4–12 KILLED, HM-3 equivalent(이탈 멈춤이 타이머 해제와 sc.on 검사 두 겹). 변이 도구·fuzz 없음(spec 사유).
- 리뷰: R-1 `6cc24f891a69c407-r1-vhs-*.png`, `r1-catalog-dom.txt`. R-2 `r2-still.txt`(32건 장면별 판정).
- verifier: 1회 retry(F-1~F-9), 2회 retry(S-1) → limit.
- 부하 민감: `tests/map/perf.test.mjs`의 벽시계 중앙값 ≤2000ms 검사가 병렬 부하에서 1회 실패(2557ms). 이 run 밖.

### run M2 (`2d467cf453771b95`)

- 정정: batch 1(관찰 시각 TD-1~4: reduced 횟수 판정, 쓰기 순간 시각, ui.md 700·140, 성능 3회 중 최선), batch 2(verifier F-1 → v3 VO-4 9항목·VO-3 T8·T9·VO-2 V14·V15, F-2 API.md play 항목 검사), batch 3(픽스처 사슬, JOBS 5 → 3).
- 손 변이(`agent-docs/spec-logs/2d467cf453771b95-hand-mutations.txt`): HM-1..HM-15 모두 KILLED. 변이 도구·fuzz 없음(spec 사유).
- 리뷰: R-1 `2d467cf453771b95-r1-verbs.txt`(catalog 동사 데모 값 표), R-2 shot 카드 4장 눈 확인(이 세션).
- verifier 권고(비차단): F-3 픽스처 대기 시간 의존, F-4 `play(` 검사 접두, F-5 가림 재개 허용창 약 150ms.
- 범위 밖 부하 흔들림: `tests/server.test.mjs` "second start reuses" 1회(단독 3/3 통과).

### run S (`a96c8781ab82e025`)

- 정정: batch 1(TD-1 `cells.text` 전체 글 → v3, R1-1 비트 글 3줄), batch 2(verifier F-1 Chrome 호출 기록 래퍼, F-2 늦게 바뀌는 쉬는 장면, F-3 크기별 경고 단언, F-4 실패 뒤 다른 칸 색, F-5 두 대상 합성 실패, F-9).
- 손 변이(`agent-docs/spec-logs/a96c8781ab82e025-hand-mutations.txt`, runner `.py`): 1회차 HM-1..12 KILLED, 2회차 HM-1..16 KILLED, HM-17 SURVIVED(F-2 확인). 변이 도구·fuzz 없음(spec 사유).
- 리뷰: R-1·R-2 `a96c8781ab82e025-r1-sheet.txt`, sheet 사본 `r1-gpu-1.jpg`·`r1-ontology-2.jpg`·`r1-s47.jpg`.
- verifier 권고(비차단): F-6 t+300 상한·loop 비트 색 oracle 없음, F-7 라벨 `…`·`s` 꼴 이미지 검사 없음, P3 호출 수 하한만.
- 범위 밖 부하 흔들림: `tests/autolayout.test.mjs` VO-9 PF1 성능(중앙값 393ms > 300) 1회, 재실행 통과. audit-sheet 테스트(약 108s, Chrome 다수)가 병렬 부하를 늘린다.

### audit.mjs 구조 (CDP 재작성 run B 입력)

- Chrome 찾기: `audit.mjs:36-44`. 없으면 종료 코드 2.
- 실행: 대상 × 크기마다 1회, `--jobs` 4 pool(`:13, :144-154, :170`). `--dump-dom` + `--virtual-time-budget=12000`(`:12, :79-81, :114`).
- 결과 추출: `<script id="ltt-audit">`를 정규식으로 읽는다(`:116`).
- 재시도: JSON이 없으면 예산 3배로 두 번 재시도(`:118-122`), 각각 `RUN_TIMEOUT` 60s(`:14, :96-99`).
- 스크린샷: `takeShots`(`:133-141`)가 장면마다 Chrome을 새로 띄워 `--screenshot`, `url#i`로 차례로 찍는다.
- 출력: `formatReport`(`:185-205`). lint 줄에 rule id가 없고(`:199`), lint·expect를 크기마다 반복한다. 종료 코드는 0/1/2(`:207-210`).
- 페이지 쪽: `ltt-deck.js:1235-1236`이 `fonts.ready` + 300ms 뒤 `audit()`을 부른다. 장면 `#n`은 시작 때만 읽는다(`:1224`). `go(i)`는 closure다(`:1081`, 점 클릭 `:1016/:1217`). `data-ltt-audit`는 `:1203`.
- server 경로: `server.mjs` `/kit/*`(`:109`), `/lessons/<id>/*`(`:123`), events POST(`:105`). audit 임시 home에서는 `/map/data.json`이 404다.

### kit 지점 (run A·C 입력, Plan 에이전트 검토)

- `fit()`: `ltt-deck.js:826-838`이 장면 zoom을 정하는 유일한 곳이다(하한 0.78). `placement`는 `ctx.refit`(`:1024`)로 거기에 닿는다.
  - predict lock은 정답 상태마다 `refit()`을 읽는다(`~:392-398`). steps `measureAll`은 `~:333-345`다.
  - steps의 `tallest`는 `pic.offsetHeight`와 `minHeight`로 잰다(`~:325`).
  - 폰은 `mobileFit`(`:848`)이 맡는다.
- `zoomLock`: `ltt-deck.js:292-301`. 최소 배율을 만든 상태를 버린다.
- `measure`: `ltt-deck.js:946-981`. `graphOverlaps`는 개수만 남긴다(`:976`). `visualRatio`는 그림이 없으면 `null`이고, 그러면 `small-visual`이 판정을 건너뛴다.
- `auditScene`: `ltt.js:619-639`. `lintDeck` 규칙은 `ltt.js:513-599`, runner는 `:602-613`이다. 메시지 문구를 고정한 테스트는 없다(rule id만 확인한다). 그래서 메시지를 고쳐 써도 테스트는 깨지지 않는다.
- `fill`: `ltt-ui.js:115-121`. 함수·Node·그 밖(innerHTML)만 받아서, 객체를 주면 `[object Object]`가 나온다.
  - figure는 `ltt-deck.js:552-583`, overview는 figure를 다시 쓴다(`:594`).
  - `answerVisual`은 `fill`을 거치지 않는다(`:640-643`).
  - `mount`는 `:1046`이다.
- 장면 타입: `ltt-deck.js:819-821`이 `LTT.sceneTypes` entry 없는 타입을 막는다. `internals.md:28`에 "12개 entry"라고 적혀 있다. sweep `control`은 `ltt-parts.js:376`이다.
- K1: 1안(장면당 한 번 계산하는 CSS `--avail`)으로 간다. 상태와 무관해서 ADR `40552fcb…`를 그대로 지킨다. 2안(`fit` 안에서 줄이기)은 `zoomLock`이 `{z, figMax}`를 잠가야 하고, 그렇지 않으면 predict 공개 때 그림 크기가 바뀐다.
- K1 실패한 시도: 매번 `style.maxHeight = ""`로 되돌리면 작가가 건 `max-height`가 지워져 장면 zoom이 나빠진다. kit이 건 값만 기억해 되돌린다.

### 문서 문구를 고정한 테스트 (단계 1에서 고친다)

- `tests/map/skill.test.mjs`: SKILL.md를 `## N` 헤딩으로 나눈다(`:10`). 고정한 것:
  - `:21` §5 frontmatter 필드
  - `:27` §0 `find`·`show`, map.md는 통째로 읽지 않는다
  - `:36` §6 find/재사용
  - `:44` 입자도
  - `:50` level 1–5
  - `:58` sweep 문구
  - `:69` grid·focus URL
- `tests/api-docs.test.mjs`:
  - 이름 정의: `:230-274`(런타임 `LTT.*` 75개가 API.md·api/*.md 첫 칸에 한 번씩), `:284`(deck-contracts.md는 이름을 정의하지 않는다)
  - 크기 상한: `:307` API.md ≤ 8,500자, `:324` API.md + 가장 큰 부품 문서 2개 ≤ 18,000
  - API.md 구조: `:351` 불러오기 순서, `:357` 테마 이름, `:370` lint 17·audit 12 id, `:407`·`:412` 행 길이, `:424`, `:429`, `:436`
  - 부품 문서: `:440` 10개, `:453` 첫 줄 언제·vendor·catalog
  - SKILL.md 문구: `:480` §2 예산 B1–B4, `:486`, `:490` §3 읽기 줄, `:498` 부품 표, `:512` internals 언급 금지, `:526`·`:535` §5 생성 비용
  - 그 밖: `:544` standalone 줄, `:551`·`:561` PROJECT.md, `:580` catalog 앵커, `:719`·`:762` audit 임계값 문구
- `tests/release-docs.test.mjs`:
  - internals.md: `:75`, `:83`, `:88`, `:99`, `:105`, `:115`, `:176`, `:190`, `:299`, `:305`, `:443`
  - CHANGELOG: `:230-262`, `:325-336`, `:401`, `:419`
  - README: `:267`, `:460`
  - API.md 원칙 vw 줄: `:290`
  - deck-contracts: `:312`, `:319`, `:351`
- gallery audit 테스트(`tests/gallery-audit.test.mjs`)는 `LTT_AUDIT=1`일 때만 Chrome으로 돈다. 기준선은 전부 0이다.

### 결정 기록

- 2026-10-19 사용자 답: 검토 서브에이전트 1개 유지, audit "고침" 0 + "권고"는 3회 안, kit K1–K8 전부, kit·audit 코드는 workflow-approach.
- 2026-10-19 세 번째 세션 사용자 답: 모션은 제한 없이 허용(정지 화면 규칙 없앰), contact sheet 눈 검토는 생성 agent 본인, shot은 사용자가 준 외부 GIF를 바탕으로 kit으로 제작한다. 모든 수정은 skill 실행 시점(수업 생성 흐름) 기준이다.
- 계획의 counter proposal도 승인과 함께 받아들여졌다. 비용 지표를 가중 합으로 바꾸고, 목표치를 기준선 대비 벽시계 ≤ 1.5배·가중 토큰 ≤ 2배로 둔다.
