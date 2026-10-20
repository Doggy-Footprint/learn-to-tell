---
version: 3
run_id: 2d467cf453771b95
status: complete
base_commit: 288302f2fffe674abec7f92c2a16402e5b23b453
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 사용자 | "예외적인 경우를 제외하고, 모든 그림을 움직이게 하는 걸 기본으로 하자." | 수업 생성 agent가 손 타이머 없이 선 그리기·입자 흐름·카메라·모양 바꾸기·쌓기를 부품 이름으로 쓴다 |
| UI-2 | 사용자(답) | 동사 API는 비트 타임라인: `LTT.motion.play(svg, [{t: [a, b], draw: …, text}], {period})` | outline의 기대 화면 비트(`a–bs 무엇이 어떻게`)를 그대로 옮기고, 비트 글이 장면 비트로 노출된다 |
| UI-3 | 계획 2 run M2 | 동사는 M1 loop 비트 위에서 돌고 diagram·axisPlot·손 SVG에 똑같이 붙는다 | 같은 동사가 세 종류 그림에서 동작한다 |
| UI-4 | M1 verifier S-1 | `LTT.beforeAfter().ms`를 의무로 덮는다 | ms 값이 표식 수에 맞다 |
| UI-5 | M1 handoff | API.md를 줄이며 빠진 두 문장(손잡이 샌드박스, 모션 예시)을 되살린다 | API.md에 두 내용이 있고 상한 안 |

# Scope
In scope: `LTT.motion.play`와 동사 `draw`·`flow`·`camera`·`morph`·`stack`, 대상 해석(diagram 노드·엣지 id, axisPlot 계열 id, CSS 선택자, Element), 비트 노출, 오류 처리, `LTT.beforeAfter().ms` 값, 문서(API.md motion 행·모션 규칙 줄을 동사 이름으로, 빠진 두 문장, deck-contracts.md 동사 절, CHANGELOG), catalog 데모.
Out of scope: shot 페이지 4편(s29·s45·s37·s47) 다시 쓰기와 카드 재촬영·`scripts/shots.mjs`(main이 run 뒤 직접), look.md·SKILL.md(main), gallery 수업(ADR `61d6c4210ba48008`), audit `--sheet`(run S), Canvas 그림, 3D.

# Paths
Implementation: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/ltt-ui.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/*.css, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/, skills/learn-to-tell/kit/CHANGELOG.md, site/gallery/catalog.html
Tests: tests/motion-verbs.test.mjs, tests/fixtures/motion/, tests/motion.test.mjs, tests/api-docs.test.mjs, tests/release-docs.test.mjs, tests/kit.test.mjs
Test command: npm test && LTT_AUDIT=1 node --test tests/gallery-audit.test.mjs && npm run check:css
Review evidence: R-1 catalog `#motion` 동사 데모 다섯을 1280×800, 가상 시간으로 각 비트 끝 시각에 `--dump-dom`해 동사마다 속성 값(대시 오프셋, 입자 위치, viewBox, 노드 transform, 쌓기 scale)이 비트 순서대로 바뀌는지 표로 남긴다(`agent-docs/spec-logs/2d467cf453771b95-r1-verbs.txt`). R-2 main이 shot 4편을 `LTT.motion.play`로 다시 쓰고 찍은 카드 4장을 눈으로 본다(run 뒤, 별도 기록).
Fuzzing: none — 입력은 작가가 쓰는 비트 배열이고 경계·동등 분할로 다 덮는다. 렌더 출력은 headless 관찰이 비싸 무작위 대량 실행이 맞지 않다.
Mutation tool: none — Stryker 미설치(run 6cc24f891a69c407 기록). hand mutation HM-1..HM-10.

# Signatures
`LTT.motion.play(root, beats, opts?) → handle` — M1 `LTT.motion.loop`의 handle과 같다(`stop`, `play`, `running`).
- `root`: `<svg>` Element, d3 selection, 또는 `<svg>`를 하나 품은 Element.
- `beats`: `[{t: [a, b], text?, <동사>: target, ...동사 옵션}]`. a, b는 주기 안 ms(0 ≤ a < b ≤ period). 비트마다 동사는 0개 또는 1개(0개면 머무는 비트).
- `opts`: `period`(ms, 기본: 가장 큰 b + 1000), `once`(boolean), `el`(M1과 같음, 기본 root).
대상 `target` 해석(모든 동사 공통): Element 또는 Element 배열이면 그대로. 문자열이면 root가 diagram이면(`LTT.diagram` 결과 svg) 노드 id → 그 노드 `g`, 엣지 id 또는 `"from>to"` → 그 엣지 선; root가 `LTT.axisPlot` svg면 계열 id → 그 계열 선; 그 밖이면 root 안 CSS 선택자(여러 개 가능).
동사(진행도 p = clamp((ms − a)/(b − a), 0, 1), e = easeInOutCubic(p) = p < .5 ? 4p³ : 1 − (−2p + 2)³/2):
- `draw: target` — 선(path·line·polyline·polygon·circle·rect의 윤곽)이 처음부터 그려진다. 길이 L, `stroke-dasharray = "L L"`, `stroke-dashoffset = L × (1 − e)`.
- `flow: target`, `count`(기본 3), `tail`(px, 기본 24), `r`(px, 기본 4), `laps`(기본 1) — root 안 레이어 `g.ltt-flow`에 입자 `circle` count개와 꼬리. 입자 k의 경로 위 비율 f_k = (p × laps + k / count) mod 1(선형, e 아님), 위치 = 경로의 `getPointAtLength(f_k × L)`. 비트 밖(ms < a 또는 ms > b)에는 그 비트의 입자·꼬리가 보이지 않는다.
- `camera: target | [x, y, w, h]`, `pad`(기본 16) — root `viewBox`가 play 때의 viewBox V0에서 목표 V1로 간다. 대상이면 V1 = 대상 bbox(root 좌표)를 pad만큼 넓힌 것. viewBox = V0 + (V1 − V0) × e. 다음 camera 비트는 앞 camera 비트의 V1에서 시작한다.
- `morph: target`, `to` — 대상 요소의 숫자 속성을 play 때 값에서 `to` 값으로: `to: {x, y, width, height, cx, cy, r, opacity, …}`(속성 이름 → 수), 특수 키 `translate: [dx, dy]`(play 때 transform 뒤에 이동을 더한다). diagram 노드 id를 대상으로 `to: {x, y}`(노드 중심, 노드 명세의 `x`·`y`와 같은 좌표)를 주면 노드가 옮겨 가고 그 노드에 닿은 엣지 선과 라벨이 매 프레임 새 위치로 다시 그려진다(`LTT.diagramLayout`으로 계산).
- `stack: target`, `from`(`"bottom"` 기본 | `"left"`) — 대상 요소 n개가 문서 순서대로 차례로 자란다. 요소 i의 구간 [i/n, (i+1)/n]에서 q_i = easeInOutCubic(clamp(p × n − i, 0, 1)), 요소의 bbox 아래 변(`left`면 왼쪽 변)을 기준으로 `scale(1, q_i)`(`left`면 `scale(q_i, 1)`) transform. q_i = 0이면 보이지 않는다.
상태 규칙: 주기 시각 ms에서 모든 비트를 배열 순서로 적용한다. 같은 요소·같은 속성에 비트가 여럿이면 아직 시작하지 않은 뒤 비트(p = 0)는 그 속성을 쓰지 않고, 뒤 비트는 앞 비트의 끝 값에서 시작한다(camera가 앞 V1에서 시작하는 것과 같다). 비트 시작 전에는 p = 0 상태, 끝난 뒤에는 p = 1 상태를 유지한다. 주기가 다시 시작하면(u가 0으로) 모두 p = 0 상태로 돌아간다. reduced-motion·측정 모드의 rest는 M1과 같이 마지막 비트 끝 시각 / period(모든 비트 p = 1; flow는 그 시각이 자기 비트 [a, b] 안일 때만 보인다).
비트 노출: play는 M1 loop의 `beats`로 각 비트의 끝 시각과 글을 넘긴다: `{t: once ? b : min(b, period − 1), text}`(글이 없으면 `t`만).
`LTT.beforeAfter(...)` 결과 `ms` = 표식이 없으면 0, 있으면 700 + 140 × (m − 1)(m: 두 쪽 중 번호 표식(`at`이 있는 `points` 항목)이 가장 많은 쪽의 표식 수).

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `LTT.motion.play`는 M1 `LTT.motion.loop` 위에서 돈다: 장면 결합·이탈 정지·가림·reduced-motion·측정 모드·`once`·`el`·handle이 M1과 같다 | must | UI-3 |
| FR-2 | 시각 ms(= u × period)에서 비트를 배열 순서로 적용하고, 비트 전 p = 0, 비트 뒤 p = 1을 유지하며, 주기 시작에 모두 p = 0으로 돌아간다 | must | UI-2 |
| FR-3 | `draw` 동작(Signatures) | must | UI-1 |
| FR-4 | `flow` 동작(Signatures), 비트 밖 입자·꼬리 숨김 | must | UI-1 |
| FR-5 | `camera` 동작(Signatures), 연속 camera 비트는 이어진다 | must | UI-1 |
| FR-6 | `morph` 동작(Signatures), diagram 노드 이동 때 닿은 엣지·라벨이 따라간다 | must | UI-1, shot kit 공백(s20·s03) |
| FR-7 | `stack` 동작(Signatures) | must | UI-1 |
| FR-8 | 대상 해석(Signatures): diagram 노드·엣지 id, axisPlot 계열 id, CSS 선택자, Element·배열 | must | UI-3 |
| FR-9 | 비트 노출: 장면의 `data-ltt-beats`·audit JSON `beats`에 비트 끝 시각과 글이 들어간다(M1 FR-11 합치기 규칙) | must | UI-2 |
| FR-10 | `LTT.beforeAfter().ms` 값(Signatures)과 `kit/api/ui.md` 행 | must | UI-4 |
| FR-11 | 문서: API.md `LTT.motion` 행에 `play`, 모션 규칙 줄이 동사 이름(`draw`·`flow`·`camera`·`morph`·`stack`)으로 움직임 예를 든다, 빠진 문장 "결정 변수끼리 영향을 주면 summary 앞에 손잡이를 함께 여는 샌드박스를 둘 수 있다"를 되살린다, deck-contracts.md에 play·동사·대상 해석·상태 규칙·비트 노출, CHANGELOG, catalog `#motion`에 동사 데모 다섯(각 동사 하나, diagram·axisPlot·손 SVG를 모두 한 번 이상) | must | UI-5, 계획 공통 |

# Errors
- 비트의 `t`가 [a, b] 꼴이 아니거나 0 ≤ a < b ≤ period가 아님 — `LTT.warn`(장면 번호, 비트 번호) — 그 비트만 버리고 나머지는 돈다.
- 한 비트에 동사가 2개 이상 — `LTT.warn` — 그 비트를 버린다.
- 대상을 찾지 못함(없는 id, 빈 선택자 결과) — `LTT.warn`(비트 번호, 대상) — 그 비트만 버린다.
- `camera`에 대상도 4개 수 배열도 아님, `morph`에 `to`가 객체가 아님 — `LTT.warn` — 그 비트를 버린다.
- `root`에서 `<svg>`를 찾지 못함 — `LTT.warn` — 아무것도 돌지 않는 handle(`running` false)을 돌려준다. 예외를 던지지 않는다.
- 동사 적용 중 예외 — M1 FR(draw 예외)과 같이 warn하고 그 play만 끝난다.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 손 SVG path, `[{t:[0,1000], draw:"#p"}]`, period 2000 | 500ms에 dashoffset = L × (1 − e(0.5)) = L × 0.5, 1000·1500ms에 0, 주기 재시작 직후 ≈ L |
| C-2 | normal | diagram 엣지 `"a>b"`에 flow count 2, t [0, 2000], period 2000 | 입자 2개가 엣지 선 위(거리 < 1px), 500ms 뒤 위치가 바뀜, f_0과 f_1의 차이 0.5 |
| C-3 | normal | flow t [500, 1000] | 300ms·1500ms에 입자 안 보임, 750ms에 보임 |
| C-4 | normal | camera `[0,0,100,50]` t [0,1000], 이어 camera 노드 id t [1000,2000] | 500ms viewBox = V0 + (V1 − V0) × 0.5, 1000ms = V1, 1500ms는 V1에서 V2로 가는 중간 |
| C-5 | normal | morph rect `to:{width: 200}` | 시작 너비 w0에서 비트 중간 w0 + (200 − w0) × 0.5 |
| C-6 | normal | diagram 노드 morph `to:{x, y}` | 노드 transform이 새 중심으로, 닿은 엣지 `d`의 끝점이 노드 상자 경계에 붙어 따라감 |
| C-7 | normal | stack 막대 4개 t [0, 2000] | 250ms에 막대 0만 자라는 중, 막대 1–3은 scale 0; 2000ms에 모두 scale 1 |
| C-8 | normal | axisPlot 계열 id에 draw | 그 계열 선의 dashoffset이 변한다 |
| C-9 | boundary | p 경계: ms = a, a+1, b−1, b, b+1 | p = 0, >0, <1, 1, 1 유지 |
| C-10 | normal | 비트 글 `text` 둘, period 3000, 끝 [1000, 3000] | `data-ltt-beats` = [{t:1000,text}, {t:2999,text}](once면 3000) |
| C-11 | normal | reduced-motion | 모든 비트 p = 1 상태 한 번 그림 |
| C-12 | error | t [800, 400], 동사 2개, 없는 id, camera `"x"`, morph `to: 3` | 각각 warn, 그 비트만 빠지고 나머지 돈다 |
| C-13 | error | root에 svg 없음 | warn, 예외 없음, `running` false |
| C-14 | normal | `LTT.beforeAfter` 표식 없음 / before 3개·after 2개 | ms = 0 / 980 |
| C-15 | edge | 장면 이탈·복귀 | M1처럼 멈추고 p = 0부터 다시 |
| C-16 | edge | 측정 모드(figure steps 미리 그리기)에서 play | 마지막 상태(rest) 한 번만 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 동사 다섯과 대상 해석 |
| Performance efficiency | yes | 프레임마다 모든 비트를 적용하므로 비용이 비트 수에 비례해야 한다 |
| Compatibility | yes | M1 loop·gallery·기존 diagram·axisPlot 동작을 깨지 않는다 |
| Interaction capability | yes | reduced-motion |
| Reliability | yes | 작가 실수(잘못된 비트)가 덱을 멈추지 않는다 |
| Security | no | 새 입력 경로 없음 |
| Maintainability | yes | API.md·문서 크기 상한, 이름 정의 규칙 |
| Flexibility | yes | 헤드리스 가상 시간, diagram·axisPlot·손 SVG 세 종류 |
| Safety | no | 무관 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Performance / time behaviour | 비트 6개(동사 다섯 + 머무는 비트) play, 1280×800 | 1000ms 가상 시간 동안 draw 호출 수(M1 간격 유지) | ≥ 30 | automated | M1 QR-2 |
| QR-2 | Compatibility / co-existence | M1 테스트 전체, gallery audit | 통과 수 | 기존 전부 통과, gallery 기존 규칙 0, still-visual 허용치 이하 | automated | ADR 61d6c4210ba48008 |
| QR-3 | Reliability / fault tolerance | C-12·C-13 | 관찰 | 덱 이동·다른 비트 정상 | automated | Errors |
| QR-4 | Maintainability / modifiability | API.md, API.md + 가장 큰 부품 문서 2개 | 크기 테스트 | ≤ 11,500 / ≤ 18,000 code points | automated | M1 A-3 |
| QR-5 | Flexibility / adaptability | diagram·axisPlot·손 SVG | C-1·C-2·C-6·C-8 | 셋 모두 동작 | automated + R-1 | UI-3 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-2, C-9, C-15 | 비트 시각 계산 | integration(헤드리스 Chrome fixture, 가상 시간) | boundary value analysis (3-value) | ms = a−1(또는 0), a, a+1, b−1, b, b+1, 주기 재시작 직후, 이탈 뒤 복귀 직후 | 8/8 | 동사 속성 값으로 p를 역산해 Signatures 식과 비교(허용 0.02) | `node --test tests/motion-verbs.test.mjs` |
| VO-2 | FR-3, FR-4, FR-5, FR-6, FR-7, C-1..C-7 | 동사 다섯 | integration | equivalence partitioning | V1 draw(path), V2 draw(line·circle 중 하나), V3 flow 위치·간격, V4 flow 비트 밖 숨김, V5 flow 꼬리 존재, V6 camera 사각형, V7 camera 대상 bbox+pad, V8 camera 이어짐, V9 morph 속성, V10 morph translate, V11 morph diagram 노드+엣지, V12 stack bottom, V13 stack left, V14 같은 속성 연쇄(morph 두 비트: 뒤 비트가 앞 `to`에서 시작), V15 flow `count` 기본 3 | 15/15 | 속성 값과 Signatures 식(e, f_k, V, scale) | 같은 |
| VO-3 | FR-8, C-2, C-6, C-8 | 대상 해석 | integration | equivalence partitioning | T1 diagram 노드 id, T2 diagram 엣지 `from>to`, T3 diagram 엣지 id, T4 axisPlot 계열 id, T5 CSS 선택자 여러 개, T6 Element, T7 Element 배열, T8 root가 d3 selection, T9 root가 `<svg>`를 품은 Element | 9/9 | 바뀐 요소가 의도한 요소뿐 | 같은 |
| VO-4 | FR-1, FR-9, C-10, C-11, C-15, C-16 | M1 결합 | integration | equivalence partitioning | 이탈 정지, 복귀 p=0, reduced 최종 상태, 측정 모드 rest(미리 그리는 play를 지목), `once` 끝 유지, 비트 노출(loop: min(b, P−1), once: b, 글 없음 → t만), 가림 동안 멈춤·돌아오면 이어짐, `el` 지정(같은 `el`의 앞 play가 끝남), handle `stop()` 뒤 변화 없음·`play()` 뒤 다시 돎 | 9/9 | 속성 값·`data-ltt-beats` | 같은 |
| VO-5 | Errors, C-12, C-13, QR-3 | 오류 | integration | error guessing | E1 t 역순·범위 밖, E2 동사 2개, E3 없는 대상, E4 camera·morph 인자, E5 svg 없음, E6 동사 적용 예외 | none — experience-based | warn에 `장면 N:`와 비트 번호, 나머지 비트 동작, 예외 없음 | 같은 |
| VO-6 | FR-10, C-14 | `beforeAfter().ms` | unit 또는 integration | equivalence partitioning + boundary value analysis (2-value) | 표식 0, 표식 1(700), before 3·after 2(980), after가 더 많음 | 4/4 | ms 값 | 같은 |
| VO-7 | QR-1 | 성능 | integration | boundary value analysis (2-value) | 1000ms 호출 수 ≥ 30, 최대 간격 ≤ 33ms | 2/2 | draw 호출 기록(동사 적용 함수 감싸기 대신 loop 호출 수를 페이지가 셈) | 같은 |
| VO-8 | QR-2 | 회귀 | end-to-end | scenario | M1 motion.test 전체, gallery audit | 2/2 | 통과 | Test command |
| VO-9 | FR-11, FR-10, QR-4 | 문서 | unit(문서 문자열) | syntax | API.md `LTT.motion` 행에 `play(` 호출 꼴과 비트 인자(`t: [a, b]` 또는 `beats`) — 기존 handle `{stop, play, running}`만으로는 통과하지 않음, 동사 다섯 이름, 샌드박스 문장, deck-contracts play·대상 해석·상태 규칙·비트 노출, ui.md `ms`, CHANGELOG `play`, catalog 동사 데모 다섯(id `motion-draw`·`motion-flow`·`motion-camera`·`motion-morph`·`motion-stack` 각 1회), 크기 2개 | 10/10 | 문자열·크기 | `node --test tests/api-docs.test.mjs` |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| A-1 | API는 비트 타임라인 `LTT.motion.play` | 사용자 답 | user answer |
| A-2 | shot 4편은 새 동사로 main이 다시 쓴다(run 뒤) | 사용자 답 | user answer |
| A-3 | 비트당 동사 하나, 동시에 둘이 필요하면 같은 t의 비트 둘 | 비트 글과 동사가 1:1이라 sheet 글이 명확하다 | brief v1 — approved |
| A-4 | 이징 easeInOutCubic 고정(flow만 선형), 옵션 없음 | 동사 다섯이 같은 리듬을 갖고 테스트 기대값이 정해진다 | brief v1 — approved |
| A-5 | period 기본 = 가장 큰 b + 1000ms(마지막 상태를 1초 보여 준다) | shot 카드 관찰: 끝 상태가 바로 사라지면 읽을 틈이 없다 | brief v1 — approved |
| A-6 | 비트 노출 시각은 비트 끝(loop는 P−1로 깎음) | sheet가 각 비트가 끝난 화면을 찍는다 | brief v1 — approved |
| A-7 | diagram 노드 morph는 엣지를 `LTT.diagramLayout`으로 매 프레임 다시 그린다 | s20(지분 구조)·s03처럼 노드만 움직이면 선이 끊긴다 | brief v1 — approved |
| A-8 | Canvas 그림은 동사 대상이 아니다(손으로 `LTT.motion.loop`) | SVG 속성 기반 동사라서 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-11, C-15, C-16 | VO-4 | motion-verbs.test |
| FR-2 | C-9, C-15 | VO-1 | motion-verbs.test |
| FR-3..FR-7 | C-1..C-7 | VO-2 | motion-verbs.test |
| FR-8 | C-2, C-6, C-8 | VO-3 | motion-verbs.test |
| FR-9 | C-10 | VO-4 | motion-verbs.test |
| FR-10 | C-14 | VO-6, VO-9 | motion-verbs.test, api-docs.test |
| FR-11 | — | VO-9 | api-docs.test |
| QR-1 | — | VO-7 | motion-verbs.test |
| QR-2 | — | VO-8 | Test command |
| QR-3 | C-12, C-13 | VO-5 | motion-verbs.test |
| QR-4 | — | VO-9 | api-docs.test |
| QR-5 | C-1, C-2, C-6, C-8 | VO-2, VO-3 | motion-verbs.test, R-1 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| open finding ids | none (advisory F-3·F-4·F-5, A-2·A-4 기록) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1..VO-9 | 3 | tests/motion-verbs.test.mjs, tests/fixtures/motion/verbs.js·scn/verbs-*.js·scn/predict.js, tests/api-docs.test.mjs VO-9, R-1 `2d467cf453771b95-r1-verbs.txt` (batch 3 뒤) | accepted (verifier 2) | 손 변이 HM-1..HM-15 15/15 죽음 | 구현 변경 없음 since verifier 1 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | Test command 1회차: 1205 중 2 실패 — `VO-1 every live tick` offset/L +473ms 0.598 vs 0.577, M1 `VO-11` max gap 98ms; 두 파일만 3회 돌리면 VO-4 reduced "draws kept coming +6/+7ms" 2/3 | 부하에서 관찰 시각이 그리기 시각보다 늦다(MutationObserver 콜백 시각, 5ms 창) — verified: 단독 실행은 통과, 실패는 부하 때만; M1 VO-11은 Chrome 10개 동시 실행에서 실제 간격이 벌어짐 — hypothesis | TD-1 VO-4 reduced는 방문당 그리기 묶음 수(1)로, TD-2 live tick은 그리기 시점의 Date.now를 기록하는 관찰로, TD-3 ui.md 행은 700·140 값까지, TD-4 성능 의무(VO-7, M1 VO-11)는 새 페이지 최대 3회 중 하나라도 기준을 만족하면 통과(kit 결함은 매 회 실패하므로 판별력 유지) | correction batch 1 |
| 2 | batch 1 뒤 Test command 2회: 1회 전부 통과(1205/1205, gallery audit, css), 2회 `tests/server.test.mjs` "second start reuses" 1건 실패 | 범위 밖 부하 흔들림 — verified: 단독 3회 통과, server 코드·테스트 base 이후 변경 없음. 테스트 작성자 6회 실행에서 M1 `VO-1 T8`·`VO-5 autoplay wraps` 각 1회 실패(부하) — hypothesis | 기록만 | 비차단 관찰 O-1 |
| 3 | 손 변이 HM-1..HM-10(flow 이징, camera V0 시작, stack 창 겹침, loop 노출 b, 기본 period max b, 잘못된 비트가 play 전체 중단, flow 비트 밖 표시, diagram 엣지 미갱신, 문서 범위 선택자, beforeAfter 140·m) | — | `2d467cf453771b95-hand-mutations.txt` | 10/10 죽음, 각각 의도한 VO 테스트가 잡음, restore 성공 |
| 4 | verifier 1(retry): F-1 spec challenge — FR-1의 가림·`el`·handle stop/play와 Signatures root 꼴(d3 selection, svg를 품은 Element)에 coverage item 없음; F-2 evidence gap — VO-9 `play` 검사가 기존 `{stop, play, running}`에 걸려 새 항목 없이도 통과; 권고 A-1(측정 play 지목), A-3(flow count 기본·같은 속성 연쇄), A-2·A-4..A-6 | F-1 spec 누락 — verified(spec VO-4·VO-3 표), F-2 테스트 결함 — verified(API.md:45 handle 서명) | v3: VO-4 9항목, VO-3 T8·T9, VO-2 V14·V15, VO-9 play 항목 강화; A-1 반영; A-2(동결 시계 BVA가 덮음)·A-4(R-1은 리뷰 증거)·A-5·A-6 기록만 | correction batch 2 |
| 5 | batch 2 뒤 Test command 3회: 1·2회 통과(1212), 3회 `VO-5 E1`·`E2` "the play stopped"; 테스트 작성자 2회 실행 중 1회 M1 `VO-1 T8` | E1/E2: 픽스처 경합 — 표본 읽기(+300ms 타이머 + 60ms)가 다음 장면 이동(+400ms)보다 늦으면 장면을 떠난 뒤 `running`을 읽는다 — verified(verbs-errors.js 일정, 부하에서 타이머 지연 관찰); M1 T8·autoplay: 같은 부하 부류 — hypothesis | 표본을 읽은 뒤에 다음 이동을 거는 순서 고정, M1 흔들림은 Chrome 동시 수 조정 또는 같은 순서·기록 시각 방식 | correction batch 3 |
| 6 | batch 3 뒤: 테스트 작성자 전체 Test command 3/3 통과(1212), main 1회 통과(1212, gallery audit, css in sync) | — | 손 변이 재실행 HM-6 + v3 항목용 HM-11(handle.stop 무효)·HM-12(`el` 무시)·HM-13(svg 품은 Element 미탐색)·HM-14(연쇄 morph가 play 때 값에서)·HM-15(API.md play 항목 삭제) | 6/6 죽음, restore 확인; verifier 2 디스패치 |
| 7 | verifier 2: pass, 막는 지적 없음; 권고 F-3(픽스처 대기 시간 의존, 흔들림만 유발), F-4(`play(` 검사가 `LTT.motion.` 접두를 요구하지 않음, play 절 검사가 덮음), F-5(가림 재개 허용창 약 150ms) | — | 기록만 | complete |

# Version Log
## v3
- [verifier F-1] FR-1·Signatures에 있던 행동(가림, `el`, handle stop/play, root 꼴)과 v2 연쇄 규칙·flow count 기본값을 coverage item으로 올렸다(VO-4 9/9, VO-3 9/9, VO-2 15/15). [F-2] VO-9 `play` 항목을 기존 handle 서명과 구별되게 고쳤다. 요구 자체는 그대로라 브리프 항목 변경 없음.
## v2
- 계약만 바뀜(사용자 브리프 항목 아님): 같은 속성 연쇄 비트 규칙, diagram 노드 `to` 좌표 단위, rest의 flow 표시, `beforeAfter` 표식 정의. 구현·테스트 보고의 모호점(구현 보고 1·3, 테스트 보고 2·3·7)에서 왔고 양쪽 구현이 이미 이 해석을 따른다.
## v1
- 초안. 사용자 답 2개(비트 타임라인, shot 4편 다시 쓰기), M1 handoff의 S-1과 빠진 문장에서 정했다.
