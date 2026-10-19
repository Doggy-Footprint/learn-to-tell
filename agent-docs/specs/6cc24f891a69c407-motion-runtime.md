---
version: 1
run_id: 6cc24f891a69c407
status: active
base_commit: 84bf138cea1a2130e096e6f2b5e862cb7fe49324
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 사용자 | "예외적인 경우를 제외하고, 모든 그림을 움직이게 하는 걸 기본으로 하자." | 생성된 수업의 그림 장면이 장면에 들어오면 손대지 않아도 움직인다. 0.9s와 5s 화면이 다르다 |
| UI-2 | 사용자(계획 2 run M1) | 기대 화면에 적은 움직임이 클릭 단계로 바뀌지 않게, kit이 반복 재생·장면 수명·비트 노출을 제공한다 | 작가가 `setTimeout` 손 루프 없이 `LTT.motion.loop`로 움직임을 만들고, 장면을 떠나면 멈춘다 |
| UI-3 | 사용자(예외 답) | 예외는 글 읽기·답 가림·명시(`still`), "이 경우에도 가능하면 재생 후 멈춤 형태를 쓸 것" | 한 번 재생하고 마지막 상태로 멈추는 `once`가 있다 |
| UI-4 | 사용자(강제 방식 답) | kit 기본값 + audit 권고 | 움직임 없는 그림 장면이 audit `still-visual` 권고로 나온다 |
| UI-5 | 계획 3단계·shots.mjs | 장면이 비트 시각을 노출해 sheet·카드가 비트마다 찍을 수 있다 | `data-ltt-beats`와 audit JSON `beats` |
| UI-6 | AGENTS.md 생성기 결함 | shot 카드에서 나온 생성기 결함 후보 3건을 생성기에서 고친다 | predict `question` 표시, `takeaway` 공개 뒤 표시, `expect` boolean |

# Scope
In scope: `LTT.motion.loop`·`LTT.motion.bind`, 장면 수명 결합(mount 중·현재 장면), 탭 가림·reduced-motion·측정 모드 처리, figure `steps` 자동 재생(`autoplay`), `LTT.sweep` 자동 훑기(`attract`), contrast 재생의 비트 노출, 장면 비트 노출(`data-ltt-beats`, audit JSON `beats`), 장면 공통 필드 `still`, audit 규칙 `still-visual`(권고), `LTT.expect` boolean·문자열, predict `question` 표시와 `takeaway` 가림, 문서(API.md 한 줄과 모션 규칙 줄, deck-contracts.md 세부, rules.md 행, charts.md의 `axisPlot` `set` 점 형식·`hbars` `ticks`/`tickFormat`, compare `form:"table"`의 `head`/`cols` 형식, CHANGELOG), catalog 데모.
Out of scope: 움직임 동사(`draw`·`flow`·`camera`·`morph`·`stack`, run M2), audit `--sheet`(run S), shots.mjs가 페이지 비트를 읽는 일, shot 페이지 51개와 gallery 수업의 그림 수정, look.md·SKILL.md(main이 run 뒤에 직접), `requestAnimationFrame` 기반 타이밍, 폰 전용 동작 변경.

# Paths
Implementation: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/ltt-ui.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-mock.js, skills/learn-to-tell/kit/*.css, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/, skills/learn-to-tell/kit/CHANGELOG.md, site/gallery/catalog.html
Tests: tests/motion.test.mjs, tests/kit.test.mjs, tests/scene-types.test.mjs, tests/lint-rules.test.mjs, tests/placement.test.mjs, tests/api-docs.test.mjs, tests/release-docs.test.mjs, tests/gallery.test.mjs, tests/gallery-audit.test.mjs, tests/gallery-audit.baseline.json, tests/fixtures/motion/
Test command: npm test && LTT_AUDIT=1 node --test tests/gallery-audit.test.mjs && npm run check:css
Review evidence: R-1 catalog 데모(`site/gallery/catalog.html#motion`)와 gallery `physics/projectile-drag.html` figure steps 장면을 1280×800에서 가상 시간 900ms·5000ms로 찍은 두 장이 다르고, reduced-motion 강제(`--force-prefers-reduced-motion`) 두 장은 같다. 산출물 `agent-docs/spec-logs/6cc24f891a69c407-r1-*.png`. R-2 gallery audit 결과에서 `still-visual` 장면 목록을 장면 타입별로 적은 `agent-docs/spec-logs/6cc24f891a69c407-r2-still.txt`(예외 판정이 맞는지 main이 장면마다 읽어 표시).
Fuzzing: none — 표면이 DOM 수명·시간 전이라 무작위 입력보다 상태 전이 표가 결함을 더 잘 가른다. beats 정규화는 동등 분할·경계값으로 다 덮는다.
Mutation tool: none — JS 변이 도구(Stryker)가 설치되어 있지 않다(run bf761aaf… 기록). 전역 설치는 하지 않는다. 대신 hand mutation HM-1..HM-10.

# Signatures
`LTT.motion.loop(draw, opts?) → handle` — `draw(u)`, u ∈ [0, 1]. `opts`: `period`(ms, 기본 4000), `beats`(`[{t, text?}]` 또는 `[t]`, t는 주기 안 ms, 0 < t ≤ period), `once`(boolean, 기본 false), `rest`(u, 기본: beats가 있으면 마지막 beat의 t/period, 없으면 1), `el`(Node, 선택).
`handle`: `stop()`(멈춤), `play()`(멈춘 u에서 이어 감), `running`(읽기 전용 boolean).
`LTT.motion.bind({enter?, leave?})` → undefined. 결합 대상 장면의 진입·이탈마다 부른다.
`LTT.motion.reduced()` → boolean. `(prefers-reduced-motion: reduce)` 결과. DOM이 없으면 false.
figure 장면 필드 `autoplay`: `true`(기본, `steps`가 있을 때) | `"once"` | `false`. 단계별 `hold`(ms, 기본 1800)는 기존 stepper 필드.
`LTT.sweep(opts)`의 새 옵션 `attract`: 기본 `true` | `false` | `{param, period}`(param 기본: 첫 param, period 기본 6000).
장면 공통 필드 `still`: 비어 있지 않은 문자열(정지 이유).
장면 요소 `section.dk-scene[data-ltt-beats]`: JSON `[{"t": <정수 ms>, "text"?: <문자열>}]`, t 오름차순, 장면 진입 시각 기준.
audit 결과 JSON(`<script id="ltt-audit">`)의 새 필드 `beats`: 길이가 장면 수인 배열, 원소는 그 장면의 `data-ltt-beats` 배열(없으면 `[]`).
audit 규칙 `still-visual`(권고): 메시지에 `LTT.motion.loop`, `steps`, `still`을 언급한다.
`LTT.expect(label, actual, expected, opts?)`: `expected`가 number가 아니면 `actual === expected`로 판정한다.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | 반복 loop는 결합된 장면이 현재이고 탭이 보이는 동안 33ms 이하 간격으로 `draw(u)`를 부른다. u = ((지금 − t0) mod period) / period, t0는 장면 진입 시각(현재 장면에서 만든 loop는 만든 시각). 시각은 `Date.now()`, 간격은 `setTimeout`이다 | must | UI-1, UI-2, 계획 M1 |
| FR-2 | `once` loop는 u = min(1, (지금 − t0)/period)로 그리고, `draw(1)`을 부른 뒤 다음 진입까지 더 부르지 않는다 | must | UI-3 |
| FR-3 | 장면을 떠나면 그 장면의 loop는 더 그리지 않는다. 다시 들어오면 u≈0에서 다시 시작한다 | must | UI-2 |
| FR-4 | `document.hidden`이 true인 동안 그리지 않고, 다시 보이면 이어서 그린다 | must | 계획 M1 |
| FR-5 | `LTT.motion.reduced()`가 true면 loop는 진입마다 `draw(rest)`를 한 번만 부르고 반복하지 않는다. figure 자동 재생과 sweep attract도 돌지 않는다 | must | API.md 모션 규칙 |
| FR-6 | `LTT.measure` 안에서 만든 loop는 `draw(rest)`를 한 번 부르고 결합·반복·비트 노출을 하지 않는다. `bind`도 무시한다 | must | deck-contracts `steps` 측정 모드 |
| FR-7 | `opts.el`이 주어졌고 결합 장면이 현재인 동안 그 노드가 문서에서 떨어지면 loop는 영구히 끝난다(다시 들어와도 안 돈다). 처음 만들 때 떨어져 있는 것은 끝으로 치지 않는다 | must | 사본 문제 재현 결과(그림 함수는 문서에 붙기 전에 불린다) |
| FR-8 | 결합: 장면 i의 mount 중(모든 장면 타입의 figure·visual·answerVisual·terms visual·contrast 칸 그림·`mount`·장면 공통 `enter`가 부르는 함수 포함) 만든 loop·bind는 장면 i에 붙는다. 장면 i가 현재일 때 만든 것(reveal, step enter)은 장면 i에 붙고 바로 시작한다. 덱 밖에서 만든 loop는 바로 시작하고 FR-4·FR-7·handle로만 멈춘다 | must | 계획 M1 "leave를 받게" |
| FR-9 | `LTT.motion.bind`: 결합 장면에 들어올 때마다 `enter()`, 떠날 때마다 `leave()`를 부른다. 현재 장면에서 등록하면 `enter()`를 바로 한 번 부른다. 기존 `mount`의 `{enter, leave}`와 장면 공통 `enter`는 그대로 동작한다 | must | 계획 M1 |
| FR-10 | `handle.stop()` 뒤에는 그리지 않는다. `play()`는 멈춘 u에서 이어 간다. 장면을 떠났다 다시 들어오면 stop 상태와 무관하게 다시 시작한다 | should | sweep attract·작가 제어 |
| FR-11 | 비트 노출: mount 중 결합된 loop, figure 자동 재생, sweep attract, contrast 재생은 장면 요소의 `data-ltt-beats`에 합쳐 적힌다. loop beats가 없으면 기본 [P/3, 2P/3, P−1](once는 [P/3, 2P/3, P]), 반올림 정수. figure 자동 재생은 단계 k마다 t = 단계 k 시작 + round(0.8 × hold_k), text = 자막의 글(마크업·`{{x|y}}` 표시 제거). contrast는 재생이 끝나는 시각 하나. 같은 t는 하나로. 움직임이 없으면 속성이 없다. audit JSON `beats`는 장면마다 이 배열이다(audit은 장면에 들어가지 않고 mount만 해도 채워진다) | must | UI-5 |
| FR-12 | figure `steps` 자동 재생: `autoplay`가 false가 아니면 진입 때 단계 0에서 시작해 `hold`마다 다음 단계로 간다. `true`는 마지막 뒤에 0으로, `"once"`는 마지막에서 멈춘다. 이전·다음·반복 단추를 누르면 그 방문 동안 자동 재생을 멈춘다. 떠나면 멈추고, 다시 들어오면 단계 0부터 다시 재생한다. 측정 미리 그리기 뒤에도 현재 단계에서 이어 간다 | must | UI-1, 1단계 원인 |
| FR-13 | sweep attract: `attract`가 false가 아니고 reduced-motion이 아니면, 결합 장면이 현재이고 사용자가 아직 손대지 않은 동안 대상 param의 컨트롤 값을 `raws()` 처음→끝→처음으로 period 동안 옮기며 `render`를 부른다. 화면의 손잡이와 값 표시도 함께 움직인다. attract 중에는 goal의 `done`·`first`를 바꾸지 않고 `LTT.record`를 부르지 않는다. 처음 손대면(컨트롤의 pointerdown·keydown·input, preset 클릭) 시작값으로 되돌린 뒤 그 조작을 적용하고, 그 페이지에서 attract는 다시 돌지 않는다 | must | 계획 M1 sweep, UI-1 |
| FR-14 | audit `still-visual`(권고): 좁은 창(compact)이 아니고, 장면 본문에 그림(VISUALS 중 목업 제외)이 있고, 노출 비트가 없고, `still`이 비어 있지 않은 문자열이 아니고, 타입이 terms·summary·keywords·hook·map-related가 아니면 낸다 | must | UI-4, UI-3 |
| FR-15 | `LTT.expect`: `expected`가 boolean·문자열이면 `actual === expected`일 때만 통과다. 숫자 판정과 `compare`는 그대로다 | must | UI-6 |
| FR-16 | predict: `question`이 비어 있지 않고 `title`과 다르면 선택지 위에 글로 보인다 | must | UI-6 |
| FR-17 | predict: 장면 공통 `takeaway`는 정답 공개 전에는 보이지 않고 접근성 트리에도 없다. 공개하면 보이고, 초기화하면 다시 가린다. 이것 때문에 공개 때 장면 배율이 바뀌지 않는다 | must | UI-6 |
| FR-18 | 문서: API.md에 `LTT.motion` 이름 줄과 고친 모션 규칙 줄("그림은 기본으로 움직인다", 예외 3가지, 예외도 가능하면 `once`, `still: "이유"`), deck-contracts.md에 loop·bind·autoplay·attract·beats·결합 범위·측정 모드 세부, rules.md에 `still-visual` 행, charts.md에 `axisPlot` `set(id, points)`의 점 형식과 `hbars` `ticks`·`tickFormat` 형식, compare `form:"table"`의 `head`·`cols` 형식, CHANGELOG 항목, catalog에 `#motion` 데모 | must | 계획 공통, 1단계 M1 입력 |

# Errors
- `draw`가 예외를 던짐 — `LTT.warn`에 장면 번호와 메시지, 그 loop만 끝남 — 덱 이동·다른 loop·stepper는 계속 동작한다.
- `period`가 양의 유한수가 아님 — `LTT.warn` — 4000으로 돈다.
- beat의 t가 (0, period] 밖이거나 수가 아님 — `LTT.warn` — 그 beat만 버린다.
- `bind`의 `enter`·`leave`가 던짐 — `LTT.warn` — 다른 훅과 장면 이동은 계속된다.
- `attract.param`이 없는 id — `LTT.warn` — attract 없이 sweep은 평소대로 동작한다.
- `still`이 문자열이 아니거나 빈 문자열 — 신호 없음(무시) — `still-visual` 판정은 `still`이 없는 것과 같다.
- `expect`에 기대값 boolean, 실제값 다른 타입 — 불일치(고침 패널 fail) — 기존과 같은 실패 표시.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | figure 장면 함수 안에서 `loop(draw, {period: 2000})`, 장면 진입 후 가상 시간 3000ms | draw가 60회 이상 불리고 u가 0→1 근처→0으로 한 번 넘어간다 |
| C-2 | normal | `once`, period 1000, 3000ms | 마지막 호출이 u=1이고 1000ms 뒤로 호출이 2회 이하(마지막 한 번) |
| C-3 | normal | 장면 1의 loop, 장면 2로 이동 후 1000ms, 다시 장면 1 | 이동 뒤 호출 0, 복귀 직후 첫 u < 0.05 |
| C-4 | normal | `visibilitychange`로 hidden 1000ms 후 visible | hidden 동안 호출 0, visible 뒤 호출 재개 |
| C-5 | boundary | reduced-motion 강제, beats [{t:500},{t:1500}], period 2000 | 진입당 `draw(0.75)` 1회, figure steps는 단계 0에 머문다, sweep 값이 변하지 않는다 |
| C-6 | edge | predict answerVisual 안에서 loop 생성(측정 미리 그리기 포함) | 측정 중 만든 loop는 rest 한 번만, 공개 뒤 만든 loop만 돈다. 공개 전 호출은 rest 외 0 |
| C-7 | edge | `el`을 준 loop, 현재 장면에서 그 노드를 지움 | 이후 호출 0, 떠났다 들어와도 0 |
| C-8 | normal | visual·terms visual·contrast 칸·answerVisual·overview figure·statement visual 각각에서 만든 loop와 bind | 각 장면 이탈에서 leave 1회·loop 정지, 진입에서 enter 1회·재시작 |
| C-9 | normal | handle.stop() 후 1000ms, play() | stop 동안 호출 0, play 직후 u가 멈춘 값 근처(±0.05) |
| C-10 | normal | figure steps 3개(hold 1000), autoplay 기본 | 0.5s 단계 0, 1.5s 단계 1, 2.5s 단계 2, 3.5s 단계 0; `data-ltt-beats` t = [800, 1800, 2800] |
| C-11 | normal | 같은 장면 `autoplay: "once"` | 3.5s에도 단계 2 |
| C-12 | normal | 자동 재생 중 "다음" 클릭 | 클릭한 단계에서 멈추고 hold가 지나도 안 바뀐다. 떠났다 들어오면 단계 0부터 재생 |
| C-13 | normal | sweep range param, goal 있음, attract 기본, 3000ms | input 값과 값 표시가 2개 이상 다른 값을 거치고, goal 요소에 `done`·`first`가 생기지 않고 `goal` 이벤트 기록 0 |
| C-14 | normal | attract 중 input에 pointerdown 후 값 변경 | 시작값으로 돌아간 뒤 사용자 값, 그 뒤 값이 혼자 바뀌지 않음, 이탈·복귀 후에도 안 돈다 |
| C-15 | normal | audit: figure 정지 그림, `still: "표를 읽는다"` figure, loop가 있는 statement, terms, mock만 있는 장면 | `still-visual`은 첫 장면만 |
| C-16 | boundary | 좁은 창(compact) 정지 그림 | `still-visual` 없음 |
| C-17 | normal | `expect("b", true, true)`, `expect("b", false, true)`, `expect("s", "a", "a")`, `expect("n", 2, 2)` | true, false, true, true |
| C-18 | normal | predict `question` ≠ title, takeaway 있음 | 공개 전 question 글이 보이고 takeaway는 안 보인다. 공개 후 takeaway 보이고 배율 동일. 초기화 후 다시 안 보인다 |
| C-19 | error | `draw`가 두 번째 호출에서 throw, 같은 장면에 다른 loop | warn 1회, 다른 loop 계속, 다음 장면 이동 정상 |
| C-20 | error | period 0, beats [{t: -1}, {t: 99999}, {t: 500}], period 1000 | warn, period 4000으로 돈다. 다른 경우 beats는 500만 남는다 |
| C-21 | error | attract `{param: "nope"}` | warn, sweep 정상, 값 변화 없음 |
| C-22 | boundary | loop beats 없음 period 3000 / once period 3000 | beats [1000, 2000, 2999] / [1000, 2000, 3000] |
| C-23 | normal | audit JSON | `beats` 길이 = 장면 수, 움직임 없는 장면은 [] |
| C-24 | edge | 덱 없는 페이지에서 loop | 바로 돌고, hidden이면 멈춘다 |
| C-25 | normal | 기존 gallery 13편 audit | 기존 규칙 결과 0, lint 0, expect 0 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 위 FR 전부 |
| Performance efficiency | yes | 장면이 많고 loop가 여러 개라도 현재 장면 밖에서 그리지 않아야 한다 |
| Compatibility | yes | 기존 gallery 수업과 `mount` `{enter, leave}`, stepper, sweep 호출이 깨지지 않아야 한다 |
| Interaction capability | yes | reduced-motion, 사용자가 손대면 자동 동작이 물러나야 한다, takeaway 선공개 |
| Reliability | yes | 작가 그리기 함수의 예외가 덱을 멈추면 안 된다 |
| Security | no | 새 입력 경로·권한·외부 요청이 없다 |
| Maintainability | yes | API.md·문서 크기 상한, 이름 정의 규칙 |
| Flexibility | yes | 헤드리스 Chrome 가상 시간(audit·shots·sheet)에서도 움직여야 한다 |
| Safety | no | 물리적·사람 안전과 무관 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Performance / resource utilization | 장면 3개 각각 loop 1개, 장면 2가 현재 | 3000ms 가상 시간 동안 장면 1·3의 draw 호출 수 | = 0 | automated(motion.test), HM | 계획 M1 |
| QR-2 | Performance / time behaviour | 현재 장면 loop | 1000ms 가상 시간 draw 호출 수 | ≥ 25 | automated | FR-1 |
| QR-3 | Compatibility / co-existence | gallery 13편 × 2크기 | audit 규칙별 개수(still-visual 제외), lint, expect | 기존 규칙 0 유지. still-visual은 run 뒤 잰 개수를 baseline에 적고 그 이하 | automated(gallery-audit) | 계획 공통 |
| QR-4 | Interaction capability / user error protection·accessibility | reduced-motion, 사용자 조작 | C-5·C-12·C-14·C-18 관찰 | 모두 기대대로 | automated | FR-5, FR-12, FR-13, FR-17 |
| QR-5 | Reliability / fault tolerance | draw·bind 예외 | C-19 관찰 | 덱 이동·다른 loop 정상 | automated | Errors |
| QR-6 | Maintainability / modifiability | API.md 글자 수, API.md + 가장 큰 부품 문서 2개 | `tests/api-docs.test.mjs` 크기 테스트 | ≤ 11,500 / ≤ 18,000 | automated | 사용자 답(상한 유지) |
| QR-7 | Flexibility / adaptability | 헤드리스 Chrome `--virtual-time-budget` | `requestAnimationFrame`을 쓰지 않고 C-1·C-10이 가상 시간에서 통과 | 통과 | automated + R-1 | handoff(rAF 미진행) |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1..FR-4, FR-7, FR-10, C-1..C-4, C-7, C-9 | loop 상태 기계, fixture 페이지(덱) | integration(헤드리스 Chrome `--dump-dom` + 가상 시간), 전이마다 1 fixture 이상 | state transition (0-switch) | 상태 {대기(mount, 비현재), 실행, 이탈 정지, 가림 정지, handle 정지, once 끝, el 끝}. 전이 T1 대기→실행(진입), T2 실행→이탈(go), T3 이탈→실행(복귀, u≈0), T4 실행→가림, T5 가림→실행, T6 실행→handle 정지, T7 handle 정지→실행(play, 이어서), T8 실행→once 끝, T9 once 끝→실행(복귀), T10 실행→el 끝, T11 el 끝→(복귀해도 끝), T12 handle 정지→실행(복귀) | 12/12 | 페이지가 기록한 호출 로그(u, 시각, 장면)로 판정 | `node --test tests/motion.test.mjs` |
| VO-2 | FR-8, FR-9, C-8, C-24 | 결합 지점 | integration, 지점마다 1 | equivalence partitioning | B1 figure 함수, B2 figure steps의 step enter, B3 statement visual, B4 compare 칸 visual, B5 contrast before/after visual, B6 terms visual, B7 predict visual, B8 predict answerVisual(공개 뒤), B9 overview figure, B10 `mount`, B11 장면 공통 `enter`, B12 덱 밖 | 12/12 | 각 지점에서 loop 이탈 정지·복귀 재시작, bind enter/leave 횟수 | 같은 |
| VO-3 | FR-5, FR-6, C-5, C-6 | reduced-motion·측정 모드 | integration | equivalence partitioning | M1 reduced loop(beats 있음 → rest=마지막 beat), M2 reduced loop(beats 없음 → rest=1), M3 reduced 명시 rest, M4 reduced figure steps, M5 reduced sweep, M6 측정 중 loop(steps 미리 그리기), M7 측정 중 loop(predict 미리 그리기), M8 측정 중 bind | 8/8 | 호출 로그·단계 번호·컨트롤 값 | 같은(Chrome `--force-prefers-reduced-motion`) |
| VO-4 | FR-11, C-10, C-22, C-23, C-20 | 비트 정규화 | unit 또는 integration | boundary value analysis (3-value) + equivalence partitioning | t = 0, 1, P−1, P, P+1, 음수, 비수, beats 없음(loop/once), 숫자 배열 형식, 객체 형식, 중복 t, 여러 움직임 합치기, steps 비트(자막 마크업 제거), contrast 비트, 움직임 없음(속성 없음), audit JSON 길이 | 16/16 | `data-ltt-beats`·audit JSON 값 | 같은 |
| VO-5 | FR-12, C-10..C-12 | figure 자동 재생 | integration | state transition | 자동(true)→다음 단계, 마지막→0, once 마지막 정지, 클릭→수동, 수동→이탈→복귀 자동 단계 0, 측정 미리 그리기 뒤 이어 감, `autoplay:false`면 시작 안 함 | 7/7 | 시각별 현재 단계 | 같은 |
| VO-6 | FR-13, C-13, C-14, C-21 | sweep attract | integration | state transition + equivalence partitioning | attract 실행 중 값·표시 변화, goal 무기록, pointerdown 정지·시작값 복원, keydown 정지, preset 정지, 정지 뒤 이탈·복귀 무재시작, `attract:false`, 잘못된 param, 컨트롤 종류 range·steps | 10/10 | 컨트롤 값, 표시 글, goal class, 기록 이벤트 | 같은 |
| VO-7 | FR-14, C-15, C-16 | `still-visual` 판정 | unit(`LTT.auditScene` 측정값 입력) + integration 1 | decision table | 조건 {compact, 그림 있음, 비트 있음, still 유효, 제외 타입} 규칙: R1 모두 판정 대상→낸다, R2 compact, R3 그림 없음, R4 목업만, R5 비트 있음, R6 still 유효, R7 still 빈 문자열(→낸다), R8 제외 타입 5종 각각 | 12/12(R8은 5개) | 규칙 id 유무 | `node --test tests/lint-rules.test.mjs tests/motion.test.mjs` |
| VO-8 | FR-15, C-17 | `LTT.expect` | unit(vm) | equivalence partitioning | 같은 boolean, 다른 boolean, boolean 대 숫자, 같은 문자열, 다른 문자열, 숫자 회귀 | 6/6 | 반환값 | `node --test tests/kit.test.mjs` |
| VO-9 | FR-16, FR-17, C-18 | predict 장면 | integration | scenario | 공개 전 question 보임·takeaway 가림, title과 같은 question은 한 번만, 공개 뒤 takeaway 보임·배율 동일, 초기화 뒤 가림 | 4/4 | innerText, 계산 스타일, 접근성(aria-hidden 또는 hidden), zoom | `node --test tests/motion.test.mjs` |
| VO-10 | Errors, C-19..C-21, QR-5 | 예외 경로 | integration | error guessing | E1 draw throw, E2 period 0, E3 beat 범위 밖, E4 bind throw, E5 attract param 없음, E6 still 비문자열 | none — experience-based | warn 문구에 장면 번호, 후속 동작 | 같은 |
| VO-11 | QR-1, QR-2, QR-7 | 성능·가상 시간 | integration | boundary value analysis (2-value) | 비현재 호출 0, 1000ms 호출 ≥ 25 | 2/2 | 호출 수 | 같은 |
| VO-12 | QR-3, C-25 | gallery 회귀 | end-to-end | scenario | 13편 × 2크기 | 26/26 | audit·lint·expect 개수 | `LTT_AUDIT=1 node --test tests/gallery-audit.test.mjs` |
| VO-13 | FR-18, QR-6 | 문서 | unit(문서 문자열) | syntax | API.md `LTT.motion` 줄, 모션 규칙 줄 핵심어(기본, `once`, `still`), deck-contracts의 loop·bind·autoplay·attract·beats 절, rules.md `still-visual` 행·audit id 13개, charts.md `set` 점 형식·`ticks`·`tickFormat`, compare `head`·`cols`, CHANGELOG 항목, catalog `#motion`, 크기 상한 2개 | 12/12 | 문자열 포함·크기 | `node --test tests/api-docs.test.mjs tests/release-docs.test.mjs` |
| VO-14 | FR-9(기존 동작), QR-3 | 기존 `mount` `{enter, leave}`, stepper 수동 사용, sweep 반환값 | integration | equivalence partitioning | 기존 mount leave 1회, `LTT.stepper` 단독(덱 밖) 자동 재생 안 함, `LTT.sweep` 반환 `{render, values, controls}` 유지 | 3/3 | 호출 횟수·반환 키 | `node --test tests/motion.test.mjs` |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| A-1 | 강제 방식은 kit 기본값 + audit `still-visual` 권고 | 사용자 답 | user answer |
| A-2 | 예외: 글 읽기(terms·summary·keywords·hook·map-related 타입은 자동 제외, 목업은 그림으로 안 셈), 답 가림·그 밖은 `still: "이유"`, 예외도 가능하면 `once` | 사용자 답. predict의 답 가림은 자동 판정할 수 없어 `still`로 적게 한다 | user answer + brief v1 — approved |
| A-3 | API.md 상한 11,500 유지, 다른 줄을 줄여 자리를 만든다 | 사용자 답 | user answer |
| A-4 | 이름 `LTT.motion`(`loop`·`bind`·`reduced`) | 계획 기본값(K5가 `LTT.timeline` 예약) | brief v1 — approved |
| A-5 | 비트 노출 형식은 shots `beats/sNN.json`과 같은 `[{t, text}]`, t는 장면 진입 기준 ms | shots.mjs·sheet가 같은 형식으로 읽는다 | brief v1 — approved |
| A-6 | figure steps·sweep attract 기본 켬, `autoplay:false`·`attract:false`로 끈다 | 사용자 지시 "모든 그림을 움직이게 하는 걸 기본". 기존 gallery 수업도 자동 재생된다 | brief v1 — approved |
| A-7 | sweep attract는 처음 손대면 그 페이지에서 다시 돌지 않고 시작값에서 조작이 시작된다 | goal-at-start 규칙(시작값은 목표 밖)을 지키기 위해 | brief v1 — approved |
| A-8 | 자동 재생 단계 비트 t = 단계 시작 + 0.8 × hold, 기본 loop 비트 P/3·2P/3·끝 | 전환 transition(약 400ms) 뒤 안정 화면을 찍기 위해 | brief v1 — approved |
| A-9 | 브라우저 동작 테스트는 헤드리스 Chrome(`--dump-dom`, 가상 시간), Chrome이 없거나 CI(LTT_AUDIT≠1)면 skip | 저장소에 DOM 테스트 도구가 없고 gallery-audit가 같은 방식 | brief v1 — approved |
| A-10 | gallery baseline: 기존 규칙 0 유지, `still-visual`은 구현 뒤 잰 개수를 허용치로 적는다(gallery 수업은 고치지 않음) | AGENTS.md 생성기 결함 규칙, ADR `61d6c4210ba48008`(매번 고치는 비용을 아끼기 위해) | user answer |
| A-11 | 결함 후보 3건(predict question·takeaway, expect boolean)과 문서 공백 3건을 이번 run에 넣는다 | 1단계 M1 입력, 작은 범위 | brief v1 — approved |
| A-12 | reduced-motion이면 figure steps는 단계 0에서 사용자 클릭을 기다린다(마지막 단계로 건너뛰지 않음) | 단계는 이야기 순서라 끝 상태만 보이면 앞 단계를 놓친다 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1 | VO-1, VO-11 | motion.test |
| FR-2 | C-2 | VO-1 | motion.test |
| FR-3 | C-3 | VO-1 | motion.test |
| FR-4 | C-4, C-24 | VO-1, VO-2 | motion.test |
| FR-5 | C-5 | VO-3 | motion.test |
| FR-6 | C-6 | VO-3 | motion.test |
| FR-7 | C-7 | VO-1 | motion.test |
| FR-8 | C-8, C-24 | VO-2 | motion.test |
| FR-9 | C-8 | VO-2, VO-14 | motion.test |
| FR-10 | C-9 | VO-1 | motion.test |
| FR-11 | C-10, C-20, C-22, C-23 | VO-4 | motion.test |
| FR-12 | C-10, C-11, C-12 | VO-5 | motion.test |
| FR-13 | C-13, C-14, C-21 | VO-6 | motion.test |
| FR-14 | C-15, C-16 | VO-7 | lint-rules.test, motion.test |
| FR-15 | C-17 | VO-8 | kit.test |
| FR-16 | C-18 | VO-9 | motion.test |
| FR-17 | C-18 | VO-9 | motion.test |
| FR-18 | — | VO-13 | api-docs.test, release-docs.test |
| QR-1, QR-2, QR-7 | C-1, C-10 | VO-11 | motion.test, R-1 |
| QR-3 | C-25 | VO-12, VO-14 | gallery-audit.test |
| QR-4 | C-5, C-12, C-14, C-18 | VO-3, VO-5, VO-6, VO-9 | motion.test |
| QR-5 | C-19 | VO-10 | motion.test |
| QR-6 | — | VO-13 | api-docs.test |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 0 |
| verifier invocations | 0 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1..VO-14 | 1 | — | pending | 착수 전 | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |

# Version Log
## v1
- 초안. 사용자 승인(brief v1). gallery 13편은 고치지 않는다는 답을 ADR `61d6c4210ba48008`로 적었다. 1단계 원인(움직임이 클릭 단계로 바뀜), 사용자 답 3개(kit 기본값 + audit 권고, 예외와 `once`, API.md 상한 유지), 코드 확인(leave는 `mount`에서만, 그림 함수는 문서에 붙기 전에 불림, 결함 후보 3건 재현)에서 정했다.
