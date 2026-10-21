# Education first 실행 계획

출처: `agent-docs/handoff/b7ee48d448480ff5-education-first.md`. 상태: 사용자 검토 대기. 브랜치 `education-first`.

## 사용자 결정 (2026-10-21)

- storyboard는 2–3안을 나란히 보여 주고 사용자가 고른다.
- 수업 형식(deck)을 유지하지 않는다. 형식은 agent가 주제에 맞게 고른다.
- 단계마다 결과를 사용자가 보고 다음 단계로 간다.
- blockchain 수업은 마무리하지 않고 A/B의 현행본으로만 쓴다.

## 형식 자유화에 따른 계약

handoff 4번의 `mount(el) → {enter, leave, draw(t)}`는 deck을 전제하므로 쓰지 않는다. 생성기가 강제하는 것은 경계 세 가지다.

1. 수업은 현행대로 `lessons/<id>/lesson.html` 한 페이지다(서버 경로·안내 URL 호환). 구성(넘김, 스크롤, 한 화면)은 자유다.
2. 이해 확인용 손잡이·기대값은 `LTT.expect`로 선언한다.
3. 움직이는 그림은 `LTT.clock(draw)`로 돌린다. 화면 밖(IntersectionObserver, `display:none` 포함)이면 멈추고, reduced-motion이면 최종 t를 그린다. clock은 audit이 쓸 수 있게 등록부(그림 요소, 시간 범위)를 남긴다.

`LTT.deck`은 선택 부품으로 남긴다. `kit/API.md` 첫머리에 "여러 화면을 순서대로 넘길 때만 deck, 아니면 페이지에 직접"을 한 줄로 둔다. 현재 예시가 deck 중심이라 생성 agent가 deck을 기본값으로 읽기 때문이다.

## audit을 페이지 단위로 바꾼다

현행 audit은 deck의 `#ltt-audit`과 장면 번호(`#1`…)로 진입·촬영한다(`server/audit.mjs:125`, `:135`). deck이 아닌 수업은 audit에서 매번 실패하므로 단계 3에서 함께 바꾼다.

- 진입: kit이 페이지 로드 후 `#ltt-audit`을 직접 낸다. deck이 있으면 deck 정보를 덧붙인다.
- 촬영: 장면 번호 대신 `LTT.clock` 등록부의 각 그림을 화면에 스크롤해 시간 간격으로 프레임을 찍는다. 등록부가 비면 페이지 전체를 스크롤 간격으로 찍는다.
- 넘침: 장면 대신 뷰포트·각 clock 그림 요소 기준으로 잰다.
- 고침 등급의 이진 결함 정의:
  - 주 그림 없음 = 페이지에 `LTT.clock` 등록도, 뷰포트 면적의 일정 이상을 차지하는 svg/canvas도 없음
  - 전부 정적 = `LTT.clock` 등록 0

## 단계 (각 단계 끝에 사용자 확인)

| # | 내용 | 수정 대상 | 사용자가 보는 것 |
|---|---|---|---|
| 0 | A/B 판정 기준을 먼저 정한다(이해, 재미, 그림 품질 중 무엇을 묻는지). 1–5단계 설계가 이 기준을 향하게 한다 | 이 계획 | 질문 하나 |
| 1 | storyboard 단계: outline(결정 변수·비트 목록)을 쓴 뒤, `lesson.html`을 쓰기 전. agent가 핵심 그림 3–5장 × 2–3안을 `lessons/<id>/storyboard.html`로 그리고 비트 한 줄씩 붙인다. 서버로 보여 주고 사용자 선택을 기다린다. 이 대기는 "되돌아가지 않는다"(SKILL.md:44)의 예외로 명시한다. 검토 서브에이전트는 선택 뒤에 띄운다. outline의 "매체·주 그림" 항목은 storyboard가 정한다 | `SKILL.md` §3 | blockchain storyboard 비교 페이지 |
| 2 | shot 소스 few-shot: `SKILL.md:66` 금지 중 gallery 읽기만 푼다(kit·server 소스 금지는 유지). look 색인에서 고른 shot 2–3개의 gallery HTML을 읽게 한다. 기각 `2c5216fdfdbccf54`와의 경계: 구조·움직임 기법은 옮기고, 파일 복사·문구·수치·배치는 옮기지 않는다 | `SKILL.md`, `look/look.md` | 바뀐 지시 요약 |
| 3 | 규제 완화 + audit 페이지화(위 절): 매체·리듬 강제, "손 그림은 kit으로 못 그릴 때만", 스타일 권고를 삭제한다. 재Read 금지(SKILL.md:67, look.md:3)는 비용 이유로 둔 것이라 storyboard·contact sheet 대조에 필요한 범위만 푼다. 장면 예산(SKILL.md:35, 기본 8–10장면, 고정 장면 hook·summary·overview·keywords)은 지우고 대체 기본값을 두지 않는다(사용자 결정) | `SKILL.md`, `kit/API.md`, `kit/ltt.js`, `server/audit.mjs` | `SKILL.md` 전후 요약, deck이 아닌 시험 페이지의 audit 출력 |
| 4 | `LTT.clock` 추가. audit의 virtual-time 촬영에서 rAF가 진행되는지 확인한다. 동작 레시피는 `kit/api/motion.md`에 둔다(부품 아님, 07c9c39 동사 부품 미복원) | `kit/ltt.js`, `kit/API.md`, `kit/api/motion.md` | 데모 한 장면 |
| 5 | 결과 대조: contact sheet는 이미 있다(SKILL.md:61, audit.mjs:199). 바뀌는 것은 둘이다. 촬영이 장면별에서 그림별 시간 간격으로 바뀌고, 판정 서브에이전트가 contact sheet와 고른 storyboard를 대조한다. 기존 검토 서브에이전트(SKILL.md:74)는 글·개념 검토로, 판정 서브에이전트는 그림 대조로 입력을 나눈다. 판정 기준(생성 지시에는 넣지 않는다). 원칙(artifact-diagramming): 처음 보는 사람이 글을 조립하지 않고 그림에서 메커니즘을 보는가, 메커니즘이 걸린 만큼만 그렸는가. 판정: 이 그림만으로 이 장면의 storyboard 한 줄을 설명할 수 있나(못 하면 빠진 것을 적는다), 빼도 그 설명이 무너지지 않는 요소는 군더더기로 적는다. 판정을 storyboard 한 줄에 묶는 이유: 원칙만 주면 판정자가 관대해지고, 기준 없이 충분성을 물으면 늘 추가를 권한다 | `server/audit.mjs`, `SKILL.md` | contact sheet 예시 |
| 6 | 블라인드 A/B: blockchain 현행본 대 새 절차본, 0단계 기준으로 사용자가 판정한다 | 저장소 밖 | 판정 페이지 |

6에서 새 절차본이 지면 단계별 커밋을 되돌려 원인을 찾는다. 1과 2는 서로 의존하므로(storyboard가 shot을 참조) 한 묶음으로 되돌린다. 3과 4도 audit·clock이 엮이므로 한 묶음이다.

## 남은 질문

- `look/shots/` 카드는 이미 비트별 프레임 형식이다(look.md:10). handoff의 "더 짧은 시간 간격으로 재생성"은 2단계에서 gallery 소스를 읽게 한 뒤에도 필요한지 사용자 확인 후 정한다.
