---
version: 5
run_id: 5ad829b7137b4d19
status: complete
base_commit: e8816d051973469318f5bba67f3887eb1b05f7d3
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 사용자(생성 수업 `20261020-ltt-project-structure` 장면 2 신고: "순차적으로 진행되는 게 아니라 그냥 이미지 보여줬다", "audit, 검토는 어떻게 연결되는지 모르겠고") | 단계 그림이 순서대로 쌓이며 읽힐 시간 동안 머문다 | 단계가 있는 모든 재생기가 자동으로 넘어가고, 자막을 읽을 시간보다 짧게 머물지 않으며, 덱 단계 안의 도식은 처음 강조되는 단계에 나타난다 |
| UI-2 | 사용자 결정("자동 재생을 기본 동작(모든 곳에서)으로 만들고, 그거랑 반대되는 규칙/lint 등을 고쳐") | 자동 재생을 끄는 선택지와 그것을 권하는 문서를 없앤다 | `autoplay` 필드·`"once"`·`false`와 "가능하면 once" 문구가 kit·문서·gallery에서 사라진다 |
| UI-3 | 사용자("온톨로지를 움직이는 그림으로 표현하기 위해 신경써야 할 것들 체크리스트 정도로 이해해도 좋아") | 움직이는 그림을 쓸 때 볼 기준을 작가가 매 수업 읽는다 | `deck-contracts.md` 단계 절에 체크리스트 6줄 |
| UI-4 | 같은 신고(검토 결과가 어디로 가는지 그림에 없었음) | 단계 그림의 흐름이 사실과 맞는지 검토가 본다 | outline이 단계 장면마다 흐름 한 줄을 갖고, 검토 서브에이전트 요청 (1)이 그 흐름을 점검 대상으로 명시한다 |
| UI-5 | 사용자 답 1("사용자의 설정 존중") | OS의 동작 줄이기 설정에서는 자동 재생하지 않는다 | `prefers-reduced-motion: reduce`이면 어떤 재생기도 자동으로 넘어가지 않는다 |

# Scope
In scope: `LTT.stepper`(와 그것을 쓰는 덱 figure `steps`, `diagram.player`, `state`가 돌려준 diagram의 `player`, `sequence.player`)의 자동 재생·머무름; 덱 figure `steps` 안과 `diagram.player`의 도식 누적 공개; `autoplay` 필드 제거와 그 서술; `API.md` 조합 조각의 figure 예시; `deck-contracts.md` 단계 절 체크리스트; SKILL.md §3 2단계 outline 흐름 줄과 검증 절 검토 요청 (1); `rules.md`·`ltt.js`의 still-visual 문구; `kit/CHANGELOG.md`; gallery `catalog.html`의 autoplay 데모.
Out of scope: 타입 엣지·`kind`·`teaches`/`needs` 같은 설명 온톨로지와 그 검사 규칙; 새 audit·lint 규칙(고침·권고 모두); `still` 필드와 공개 전 predict 예외; `LTT.motion.loop`·`play`의 `once`; sweep `attract`·contrast 재생; `sequence`의 `upto`/`show` 동작; 덱 밖에서 직접 부르는 `highlight`; 폰 배치; 생성된 사용자 수업과 측정 run 수업; 측정 프롬프트·측정 실행(워크플로 뒤 main이 따로 한다).

# Paths
Implementation: skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-parts.css, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/deck-contracts.md, skills/learn-to-tell/kit/api/controls.md, skills/learn-to-tell/kit/api/diagram.md, skills/learn-to-tell/kit/api/sequence.md, skills/learn-to-tell/kit/api/rules.md, skills/learn-to-tell/kit/CHANGELOG.md, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/look/look.md, site/gallery/catalog.html
Tests: tests/motion.test.mjs, tests/fixtures/motion/, tests/absorb.test.mjs, tests/fixtures/absorb/, tests/diagram.test.mjs, tests/kit.test.mjs, tests/api-docs.test.mjs, tests/release-docs.test.mjs, tests/scene-types.test.mjs, tests/gallery-audit.baseline.json
Test command: npm test && LTT_AUDIT=1 node --test tests/gallery-audit.test.mjs && npm run check:css
Review evidence: R-1 단계 화면 눈 확인 — main이 구현 뒤 `~/.learn-to-tell/lessons/20261020-ltt-project-structure/lesson.html`을 새 kit으로 서버(LTT_PORT=4813)에서 열어 장면 2를 1440×900에서 단계 0·1·3에 캡처하고, 단계 0에 SKILL.md·읽기 노드와 그 엣지, 그리고 어떤 단계도 강조하지 않는 노드(AD-6 배경)와 두 끝이 보이는 엣지만 보이고 단계 3에 server·map 외 앞 단계 노드가 흐리게 남는지 판정 줄과 함께 `agent-docs/spec-logs/5ad829b7137b4d19-r1-*.png`에 남긴다. R-2 문서 일관성 — main이 `grep -rn "autoplay\|\"once\"\|interval" skills/learn-to-tell/kit skills/learn-to-tell/SKILL.md skills/learn-to-tell/look/look.md site/gallery/catalog.html`의 남은 줄이 `motion.loop`/`play`의 `once`와 무관한 이름(cache-ttl의 `interval` 등)뿐임을 확인한다.
Fuzzing: none — 입력은 장면 spec과 시간이라 무작위 생성의 오라클이 정해지지 않는다. 머무름 공식은 경계값, 공개 규칙은 결정표로 다 덮는다.
Mutation tool: none — Stryker 미설치(run 6cc24f891a69c407, 37a2365a466d3e8b 기록), 전역 설치 금지. 손 변이 8–10개를 main이 고른다.

# Signatures
- `LTT.stepper(el, steps, opts)` → `{go, play, stop, index}`. `steps: [{caption, hold, enter(i, dir)}]`, `opts: {onStep, interval}`. 반환 모양은 그대로.
- 머무름: `holdOf(step) = max(step.hold || opts.interval || 0, floor(caption))`, `floor(caption) = max(1800, 1000 + 100 × n)`(ms). `n`은 자막 평문의 문자 수: HTML 태그 제거, `{{용어|별칭}}`은 별칭·`{{용어}}`는 용어로 바꾸고, 공백 연속을 공백 하나로 줄이고 앞뒤 공백을 뺀 뒤 센 Unicode code point 수. 자막이 없으면 n = 0.
- 덱 figure 장면 필드에서 `autoplay`가 없어진다(주어도 무시). 문서에 그 이름이 남지 않는다.
- 누적 공개 상태: 숨은 노드·엣지·엣지 라벨 요소의 계산된 `visibility`는 `hidden`이다. 보이는 요소는 `visible`. 흐림(`dim`)·강조(`hot`) 클래스 규칙은 그대로.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | 단계가 둘 이상인 모든 stepper(덱 figure `steps`, 단독 `LTT.stepper`, 각 `player`)는 자동으로 다음 단계로 넘어가고 마지막 뒤 단계 0으로 돌아간다. 끝에서 멈추는 동작은 없다. | must | UI-1, UI-2 |
| FR-2 | 덱 안의 stepper는 그 장면에 들어올 때 단계 0에서 자동 재생을 시작하고, 떠날 때 멈춘다. 덱 밖의 단독 stepper는 만들 때 시작한다. 덱 figure의 기존 진입·이탈·측정 미리 그리기 동작(현재 단계 유지 포함)은 그대로다. | must | UI-1 |
| FR-3 | 이전·다음(←/→ 키 포함)을 누르면 그 방문 동안 자동 재생이 멈춘다. "반복 재생/정지" 버튼은 멈춘 재생을 현재 단계에서 다시 시작하고(첫 전환은 그 단계 머무름 뒤) 재생 중이면 멈춘다. 단계 점은 표시일 뿐 누르는 대상이 아니다. | must | UI-1(WCAG 2.2.2) |
| FR-4 | 각 단계의 머무름은 Signatures의 `holdOf`다. 작가의 `hold`·`interval`은 하한보다 길 때만 반영된다. 덱 figure의 노출 비트(`data-ltt-beats`) 시각은 이 머무름으로 계산한다(비트 t = 앞 단계 머무름 합 + round(0.8 × 그 단계 머무름)). | must | UI-1 |
| FR-5 | `prefers-reduced-motion: reduce`(`LTT.motion.reduced()` 참)이면 어떤 stepper도 자동 재생하지 않고 단계 0에서 클릭을 기다린다. 측정 모드(`?audit`)의 미리 그리기·비트 기록은 지금과 같다. | must | UI-5 |
| FR-6 | 단계가 하나인 stepper는 자동 재생하지 않고 비트도 없다(지금과 같음). | must | 기존 계약(C-27) |
| FR-7 | 덱 figure `steps`의 단계 `enter` 안에서 부른 `LTT.diagram(...).highlight(ids)`와 `diagram.player` 단계의 `hot`에 대해, 단계 k에서 노드는 단계 0..k 중 어느 한 단계에서 강조되었거나 어떤 단계에서도 강조되지 않으면 보이고, 그 밖에는 숨는다. 엣지(와 그 라벨)는 두 끝 노드가 보이고, 단계 0..k 중 한 단계에서 켜졌거나(id가 강조 목록에 있거나 두 끝이 그 단계에서 함께 강조됨) 어떤 단계에서도 켜지지 않으면 보이고, 그 밖에는 숨는다. `highlight(null)`/빈 배열은 그 단계에서 모든 요소를 강조한 것으로 센다. 한 단계 `enter`가 `highlight`를 여러 번 부르면 마지막 호출이 그 단계의 기록이다. 숨김은 크기와 배치를 바꾸지 않는다(장면 zoom·그림 높이가 단계마다 같다). | must | UI-1 |
| FR-8 | 단계 k에서 보이는 요소의 흐림·강조는 지금 규칙 그대로다(그 단계의 강조 목록 밖이면 흐림). | must | UI-1 |
| FR-9 | 덱 밖에서 직접 부른 `highlight`(단계 `enter` 밖, player 밖)는 지금처럼 흐림만 바꾸고 아무것도 숨기지 않는다. 같은 diagram의 단계 밖 호출은 누적 공개 기록에 들어가지 않는다. | must | Scope |
| FR-10 | `API.md`: 장면 필드 표에서 `autoplay`를 지운다. "그림은 기본으로 움직인다" 문단의 "예외도 가능하면 한 번 재생 후 멈춤(`once`)" 문장을 지운다. 조합 조각 figure 예시를 단계 셋 이상의 누적 예시(단계마다 새 노드 하나 이상이 처음 강조되고 앞 단계 노드는 목록에 남지 않음)로 바꾼다. | must | UI-2, UI-3 |
| FR-11 | `deck-contracts.md`: `### figure autoplay` 절을 자동 재생·머무름 공식·누적 공개·reduced-motion 서술로 바꾸고 `autoplay` 이름을 없앤다. `### steps` 절에 "움직이는 그림 체크리스트" 6줄: (1) 단계 순서는 시간이나 인과 순서를 따른다 (2) 한 단계에 사건 하나, 앞 단계는 남긴다 (3) 만들어진 것은 어디로 가는지 보인다 (4) 되도는 것은 고리로 그린다 (5) 자막은 지금 움직이는 것의 이름을 부른다 (6) 시간에 따라 변하지 않는 내용은 움직이지 않는다(`still`). 첫 줄 "언제:"에서 `autoplay`를 뺀다. | must | UI-2, UI-3 |
| FR-12 | `controls.md`의 `LTT.stepper` 행: "단독으로는 자동 재생하지 않는다"와 `play(true)`(마지막에서 멈춤)를 지우고 자동 재생·순환·멈춤을 적되, 머무름 공식과 reduced-motion은 `deck-contracts.md`를 가리킨다(공식은 한 곳에만 둔다). `diagram.md`·`sequence.md`의 `player` 행은 자동 재생과(diagram만) 누적 공개를 한 구절로 적는다. | must | UI-2 |
| FR-13 | `play(once)` 인자는 없어진다: `play()`는 늘 순환한다. | must | UI-2 |
| FR-14 | SKILL.md §3 2단계 outline 줄에 "단계(`steps`) 장면은 `흐름: ①a→b ②…` 한 줄(단계마다 처음 나오는 것과 그것이 어디로 가는지)"을 더하고, 검증 절 검토 요청 (1)에 "단계 흐름이 실제 절차·인과와 맞는지, 만들어진 것이 어디로 가는지"를 더한다. SKILL.md의 권고 목록·audit 문장은 바꾸지 않는다. | must | UI-4 |
| FR-15 | `rules.md` still-visual 행과 `ltt.js` still-visual 메시지에서 "figure steps 자동 재생"을 "figure steps(단계 둘 이상)"로 바꾼다. 판정 로직은 그대로(단계 둘 이상이면 노출 비트가 있으므로 통과). | must | UI-2 |
| FR-16 | `site/gallery/catalog.html`의 `figure-autoplay` 데모는 `autoplay` 변형 없이 자동 재생·누적 공개를 보이는 데모 하나가 된다. gallery audit 기준선을 넘지 않는다. | must | UI-2 |
| FR-17 | `kit/CHANGELOG.md`에 바뀐 동작(autoplay 제거, 머무름 하한, 누적 공개, 단독 stepper 자동 재생)을 적는다. | should | 프로젝트 관례 |

# Errors
- 자막 평문 계산 중 caption이 문자열이 아님(숫자·undefined) — 오류 없이 n = 0으로 센다 — 머무름 1800ms, 재생 계속.
- `highlight`에 없는 id가 섞임 — 지금처럼 무시한다(경고·예외 없음) — 그 id는 공개 기록에 영향 없음.
- 재생 중 컨테이너가 문서에서 떨어짐 — 지금처럼 타이머가 멈춘다 — 다시 붙어도 스스로 재시작하지 않는다(덱은 진입 때 재시작).

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 덱 figure, 단계 3개, 자막 짧음(≤8자), hold 없음 | 진입 뒤 1800ms마다 넘어가고 3단계 뒤 0으로 돌아간다 |
| C-2 | boundary | 자막 평문 8자 / 9자 / 60자 | 머무름 1800 / 1900 / 7000ms |
| C-3 | boundary | hold 5000, 자막 평문 60자 / hold 9000, 같은 자막 | 7000ms / 9000ms |
| C-4 | normal | 자막 `"{{만료 시간\|TTL}} <b>둘</b>"` | n = 길이("TTL 둘") = 5 → 1800ms |
| C-5 | normal | 덱 figure에 `autoplay: false` 또는 `"once"` | 기본과 똑같이 순환 자동 재생, 비트 기록 |
| C-6 | normal | 재생 중 "다음" 클릭 | 그 단계에 머물고 떠날 때까지 넘어가지 않는다; 다시 들어오면 단계 0부터 재생 |
| C-7 | normal | 재생을 멈춘 뒤 "반복 재생" 클릭 | 다시 순환 재생 |
| C-8 | normal | 덱 밖 단독 `LTT.stepper`, 단계 3개 | 만들자마자 자동 재생, 순환 |
| C-9 | normal | `diagram.player`, `sequence.player` 단계 3개 | 자동 재생, 순환 |
| C-10 | edge | reduced-motion | 덱 figure·단독 stepper·player 모두 단계 0에 머문다 |
| C-11 | edge | 단계 1개 | 자동 재생·비트 없음 |
| C-12 | normal | 도식 노드 a,b,c,d, 엣지 a>b,b>c,c>d; 단계 `[a,b]`,`[c]`,`[d]` | 단계0: a,b,a>b 보임, c,d,b>c,c>d 숨음. 단계1: c 보임, b>c 보임(한 번도 켜지지 않은 엣지는 두 끝이 보이면 보임), c>d 숨음. 단계2: d, c>d 보임 |
| C-12b | edge | 노드 a,b, 엣지 a>b; 단계 `[a]`,`[b]`,`[a,b]` | 단계1: a,b 보임, a>b 숨음(단계2에서 처음 켜짐). 단계2: a>b 보임 |
| C-13 | normal | 같은 도식, 단계 `[a,b,"a>b"]`,`[b,c,"b>c"]`,`[c,d]` | 단계1에 b>c 보임, 단계2에 c>d 보임(두 끝 함께 강조) |
| C-14 | edge | 단계 중 하나도 강조하지 않는 노드 e와 엣지 e>a | e, e>a는 모든 단계에서 보임(흐림) |
| C-15 | edge | 단계0이 `highlight(null)` | 단계0에 모든 요소 보임 |
| C-16 | boundary | 단계 마지막→0 순환 | 단계 0의 공개 상태로 돌아간다(뒤 단계 요소 다시 숨음) |
| C-17 | normal | 누적 공개 장면에서 단계 이동 | 장면 zoom·그림 높이 단계마다 같음 |
| C-18 | edge | 같은 diagram을 덱 밖(장면 만들 때 figure 함수 안)에서 `highlight([a])` 한 뒤 단계 진행 | 그 호출은 공개 기록에 없다; 단계 규칙만 따른다 |
| C-19 | edge | 덱 밖 `LTT.diagram(...).highlight([a])` 직접 호출(단계 없음) | 아무 요소도 숨지 않음, b..d 흐림 |
| C-20 | error | caption 없음 / 숫자 | n = 0, 머무름 1800, 오류 없음 |
| C-21 | error | highlight에 없는 id | 예외 없음, 공개 결과는 그 id를 뺀 것과 같음 |
| C-22 | normal | 측정 모드(`?audit`) 덱 figure | 비트 t가 FR-4 공식(새 머무름)을 따른다 |
| C-23 | normal | 문서 | `API.md`·`deck-contracts.md`·`controls.md`에 `autoplay`·`"once"` 단계 설명·"가능하면 한 번 재생 후 멈춤"이 없고, 체크리스트 6줄과 머무름 공식이 있다; SKILL.md에 흐름 줄과 검토 항목 |
| C-24 | normal | gallery 전체 audit | 기준선 이하 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 재생·머무름·공개 규칙이 정확해야 한다 |
| Performance efficiency | no | 단계 수가 수십 이하이고 공개 계산은 미리 그리기 한 번에 끝난다; 측정 대상 없음 |
| Compatibility | yes | 기존 장면 spec(`autoplay`를 가진 것 포함)이 오류 없이 열리고, 덱 측정 미리 그리기 계약과 공존해야 한다 |
| Interaction capability | yes | 읽을 시간 확보, 멈춤 수단, reduced-motion 존중 |
| Reliability | yes | 타이머 누수·방문마다 쌓이는 재생이 없어야 한다 |
| Security | no | 새 입력 경로·외부 호출 없음 |
| Maintainability | yes | 생성 agent가 읽는 문서와 kit 동작이 일치해야 한다 |
| Flexibility | no | 폰 배치·새 환경 지원은 범위 밖 |
| Safety | no | 해당 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Interaction capability / user error protection·inclusivity | 단계 자막 머무름 | headless 덱에서 단계 전환 시각 차 − 기대 머무름, ms | 각 전환 \|오차\| ≤ 300ms, 머무름 < floor인 전환 0개 | 자동(VO-HOLD), 손 변이 | UI-1, Netflix 한국어 성인 12자/초에 그림 볼 시간 가산 |
| QR-2 | Interaction capability / inclusivity | reduced-motion | reduced 에뮬레이션에서 진입 뒤 5초간 단계 변화 수 | 0 | 자동(VO-RM) | UI-5 |
| QR-3 | Compatibility / co-existence | 기존 장면 spec | `autoplay` 필드를 가진 fixture가 콘솔 오류·LTT.warn 없이 열리는 수 / 전체 | 100% | 자동 | UI-2 |
| QR-4 | Reliability / faultlessness | 방문 반복 | 같은 장면 3회 진입·이탈 뒤 한 머무름 구간의 단계 전환 수 | 정확히 1 | 자동 | 기존 계약(bind 방문당) |
| QR-5 | Functional suitability / correctness | 누적 공개 결정표 C-12–C-19 | 요소별 계산된 visibility | 표와 100% 일치 | 자동(VO-REV), 손 변이 | UI-1 |
| QR-6 | Compatibility / co-existence | 측정 미리 그리기 | 단계 0..마지막의 장면 zoom·그림 offsetHeight | 단계 간 차 0 | 자동 | ADR 40552fcb2a7c3985 |
| QR-7 | Maintainability / modifiability(문서 정합) | 작가용 문서 | C-23 토큰 검사; 읽기 묶음(SKILL.md·API.md·look.md·deck-contracts.md + 가장 큰 부품 문서 셋) code point 수 | 금지 토큰 0, 필수 구절 모두; 읽기 묶음 ≤ 44,990(기존 예산 그대로) | 자동(api-docs), 리뷰 R-2 | UI-2, UI-3 |
| QR-8 | Compatibility | gallery | `LTT_AUDIT=1 node --test tests/gallery-audit.test.mjs` | 통과 | 자동 | 기존 기준선 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-AUTO | FR-1, FR-2, FR-3, FR-13, C-1, C-5–C-9, C-16, QR-4 | 덱 figure·단독 stepper·diagram.player·sequence.player의 단계 index 시간열 | e2e(headless Chrome fixture), 4 재생기 전부 | state transition testing | 상태 {재생, 수동 멈춤, 이탈}; 전이 {진입→재생, 머무름 경과→다음, 마지막→0, 이전/다음(←/→ 키) 클릭→멈춤, 반복 재생 클릭(멈춤→재생, 재생→멈춤), 이탈→멈춤, 재진입→단계0 재생}; 4 재생기 × 진입·순환 전이 + 덱 figure에서 나머지 전이 | 100% | 시각별 단계 index가 기대 전이와 같다 | motion.test.mjs 기록 |
| VO-HOLD | FR-4, C-2, C-3, C-4, C-20, C-22, QR-1 | 단계 전환 시각, `data-ltt-beats` | e2e | boundary value analysis (3-value) + equivalence partitioning | n 경계 {7,8,9}(floor 1800↔1900 경계), {59,60,61}; hold {floor−1, floor, floor+1}; 클래스 {태그 포함, 용어 별칭, 용어만, 공백 연속, 비문자열, 없음} | 100% | 전환 간격 = holdOf ±300ms; beats t 공식 일치 | motion.test.mjs |
| VO-RM | FR-5, C-10, QR-2 | reduced-motion 에뮬레이션 | e2e, 4 재생기 | equivalence partitioning | {덱 figure, 단독 stepper, diagram.player, sequence.player} × reduced | 100% | 5초간 단계 변화 0 | motion.test.mjs |
| VO-ONE | FR-6, C-11 | 단계 1개 | e2e | boundary value analysis | 단계 수 {1, 2} | 100% | 1: 재생·비트 없음; 2: 재생 | motion.test.mjs |
| VO-REV | FR-7, FR-8, FR-9, C-12–C-19, C-21, QR-5 | 노드·엣지·엣지 라벨 계산된 visibility와 dim/hot 클래스 | e2e(덱 figure와 diagram.player 각각) | decision table testing | 규칙: 노드 {이번 이하 강조됨, 뒤 단계에서만 강조, 한 번도 안 됨}; 엣지 {id 강조, 두 끝 동시 강조, 끝 하나 숨음, 한 번도 안 켜짐, 뒤에서만 켜짐}; 호출 맥락 {단계 enter, player hot, 덱 밖/단계 밖}; null 강조; 없는 id | 100% | C-12–C-19·C-21 기대와 일치 | diagram.test.mjs 또는 motion.test.mjs |
| VO-SIZE | FR-7, C-17, QR-6 | 장면 zoom, 그림 offsetHeight | e2e | equivalence partitioning | 누적 공개 장면 단계 {0, 중간, 마지막} | 100% | 값이 모두 같다 | absorb/motion fixture |
| VO-COMP | C-5, QR-3 | 콘솔 오류·LTT.warn | e2e | equivalence partitioning | `autoplay` ∈ {없음, true, "once", false} | 100% | 오류 0, 네 경우 같은 재생 | motion.test.mjs |
| VO-DOCS | FR-10–FR-12, FR-14, FR-15, FR-17, C-23, QR-7 | 문서 텍스트(API.md, SKILL.md, kit/api/*.md, look/look.md) | unit(파일 읽기) | syntax testing | 금지 토큰 {figure 필드 `autoplay`, `"once"`(단계 맥락), "가능하면 한 번 재생 후 멈춤"과 그 변형(once로/한 번 재생하고 멈춘다), "단독으로는 자동 재생하지 않는다", `play(true)`, controls·diagram·sequence 행의 머무름 공식(`1000 + 100`)}; controls 행은 `deck-contracts.md`와 reduced-motion을 함께 가리킨다; 필수 {체크리스트 6줄 각 핵심어, 머무름 공식, 누적 공개 서술, reduced-motion, SKILL 흐름 줄, 검토 (1) 항목, still-visual 문구, CHANGELOG 항목}; API.md 조합 조각 figure 예시가 단계 ≥3이고 단계마다 처음 강조되는 노드가 있다 | 100% | 모두 만족 | api-docs.test.mjs, release-docs.test.mjs |
| VO-GAL | FR-16, C-24, QR-8 | gallery audit | e2e | equivalence partitioning | catalog 데모 존재(autoplay 변형 없음), 기준선 | 100% | 통과 | gallery-audit.test.mjs, gallery.test.mjs |
| VO-ERR | Errors | 위 오류 3건 | e2e | error guessing | 비문자열 caption, 없는 id, 분리된 컨테이너 | none — experience-based | 예외 없음, 기대 상태 | motion.test.mjs |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| AD-1 | 타입 온톨로지·검사 규칙을 넣지 않고 kit 동작(시간·쌓기)+체크리스트+검토 흐름 줄로 간다 | 비판 검토: 싱크 규칙 오탐 >80%, 엣지 6타입 표본 12 중 10 부적합, 순환에서 위상 규칙 깨짐, 고침 기본값이 수정 루프 비용 증가; 사실 오류는 구조 검사로 못 잡음 | user answer ("하나의 길") — rejection 기록은 초안 확인 뒤 |
| AD-2 | 머무름 하한 `max(1800, 1000+100n)`ms | Netflix 한국어 성인 12자/초(조사 확인) + 그림 볼 시간; 1800은 기존 기본값 유지. 계수는 근사 | brief v1 — approved |
| AD-3 | reduced-motion은 자동 재생하지 않는다 | WCAG 2.3.3·OS 설정 | user answer 1 |
| AD-4 | `autoplay` 필드는 호환 경고 없이 제거(주어도 무시) | 배포 전 | user answer 2 |
| AD-5 | 누적 공개는 덱 figure 단계 enter 안의 highlight와 diagram.player hot에만; 덱 밖 직접 호출은 그대로 | 덱 밖 사용은 단계 맥락이 없어 "처음 강조"를 정의할 수 없음 | brief v1 — approved |
| AD-6 | 한 번도 강조되지 않은 요소는 처음부터 보인다(흐림) | 배경 맥락(구역·보조 노드)을 숨기면 그림이 깨진다; 오버뷰-먼저는 1단계 전부 강조로 쓸 수 있다 | brief v1 — approved |
| AD-7 | `still`·공개 전 predict 예외 유지 | Tversky 2002 congruence; predict 자동 공개는 예측을 무효화 | brief v1 — approved |
| AD-8 | 단독 stepper 시작: 덱 안은 장면 진입, 덱 밖은 생성 즉시 | `LTT.motion.bind` 계약(deck-contracts 46행)과 같은 방식 | brief v1 — approved |
| AD-9 | 측정은 워크플로 밖: 새 주제 3개(LLM 환각 내부 표현 논문, MML 5장 벡터 미적분, 드로잉 기본) × base/new × 1회 | 사용자 답 3; 1회는 비용 가드만 가능(CV 22%) | user answer 3 — 주제별 base·new 각 1회(총 6회), sonnet medium |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1, C-8, C-9, C-16 | VO-AUTO | motion.test.mjs |
| FR-2 | C-1, C-6, C-8 | VO-AUTO | motion.test.mjs |
| FR-3 | C-6, C-7 | VO-AUTO | motion.test.mjs |
| FR-4 | C-2, C-3, C-4, C-22 | VO-HOLD | motion.test.mjs |
| FR-5 | C-10 | VO-RM | motion.test.mjs |
| FR-6 | C-11 | VO-ONE | motion.test.mjs |
| FR-7 | C-12–C-17, C-21 | VO-REV, VO-SIZE | diagram/motion tests |
| FR-8 | C-12, C-14 | VO-REV | diagram/motion tests |
| FR-9 | C-18, C-19 | VO-REV | diagram/motion tests |
| FR-10–FR-12, FR-14, FR-15, FR-17 | C-23 | VO-DOCS | api-docs/release-docs tests, R-2 |
| FR-13 | C-7 | VO-AUTO | motion.test.mjs |
| FR-16 | C-24 | VO-GAL | gallery tests |
| Errors | C-20, C-21 | VO-ERR, VO-HOLD | motion.test.mjs |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| open finding ids | none (advisory A-1–A-9 비차단) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-AUTO | 5 | motion.test.mjs VO-AUTO*, scn/autoclick·players-*; verifier 2 accepted (F-2 closed) | accepted | M5,M6,M11 killed | Test command 통과 트리(커밋 전 작업 트리) |
| VO-HOLD | 5 | hold-cases.js, VO-HOLD*; verifier 1 accepted | accepted | M1,M2,M3,M4 killed | Test command 통과 트리(커밋 전 작업 트리) |
| VO-RM | 5 | VO-RM*; verifier 1 accepted | accepted | M7 killed | Test command 통과 트리(커밋 전 작업 트리) |
| VO-ONE | 5 | VO-ONE*; verifier 1 accepted | accepted | — | Test command 통과 트리(커밋 전 작업 트리) |
| VO-REV | 5 | rev-cases.js(+EIDHID), VO-REV*; verifier 1·2 accepted | accepted | M8,M9,M10 killed | Test command 통과 트리(커밋 전 작업 트리) |
| VO-SIZE | 5 | VO-SIZE*; verifier 1 accepted | accepted | — | Test command 통과 트리(커밋 전 작업 트리) |
| VO-COMP | 5 | VO-COMP*; verifier 1 accepted | accepted | M4 killed | Test command 통과 트리(커밋 전 작업 트리) |
| VO-DOCS | 5 | api-docs·release-docs VO-DOCS*; verifier 2 accepted (F-1·F-4 closed) | accepted | M12,M13,M14 killed | Test command 통과 트리(커밋 전 작업 트리) |
| VO-GAL | 5 | gallery-audit·gallery tests; verifier 1 accepted | accepted | — | Test command 통과 트리(커밋 전 작업 트리) |
| VO-ERR | 5 | hold-err, C21, detached; verifier 1 accepted | accepted | — | Test command 통과 트리(커밋 전 작업 트리) |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | 첫 실행 npm test 9 fail: C-6 단계 점 클릭, C-20 비문자열 caption 예외(`(x.caption\|\|"").replace`), diagram/sequence player 행 문구, 읽기 묶음 46,491 > 44,990, absorb VO-3 T6(옛 `autoplay:false`·hold 800), VO-1 T1·VO-9 PF1(병렬 실행 타이밍) | 단계 점은 원래 누를 수 없음(spec 결함); ghost 자막 경로 비문자열 미처리(구현 결함, verified); 문서 미반영; 새 문서 +1.5k; 옛 fixture 계약 | spec v2(FR-3 점 제외·재개 시점, FR-7 마지막 호출, QR-7 예산 명시, absorb 경로 추가); 구현: String() 처리·player 행·문서 압축; 테스트: 점 제외, ←/→ 키, MULTI, vo3 fixture | 다음 행 |
| 2 | controls 행 공식 요구 vs 예산 압축 충돌; 압축이 기존 계약(비트 노출 표지·stop 무관 재시작·attract 값 표시·goal 표본 수·still-visual 조건) 일부를 지움; look.md:72 "되도록 once" 잔존 | 공식 중복 배치(spec), 과압축(구현) | spec v3(FR-12 공식은 deck-contracts 한 곳), v4(look.md 경로, 의미 보존 압축만 인정·goal 표본 수 rules.md로·still-visual 조건은 rules.md 포인터 인정); 구현 batch 2로 복원 | 읽기 묶음 44,946; Test command 전부 통과(npm test 1512/1512, gallery audit, check:css). VO-1 T1·VO-9 PF1은 이후 전체 실행에서 통과(독립 flaky로 판단, 변경 경로 무관 — hypothesis) |
| 3 | 손 변이 12개(main, seed.py backup/restore, 해시로 복원 확인): M1 하한 제거, M2 자막 원문 길이, M3 작가 hold 무시, M4 비트 옛 hold, M5 순환 없음, M6 이탈 후 타이머 유지, M7 reduced 무시, M8 숨김 없음, M9 한 끝 숨어도 엣지 보임, M10 단계 밖 호출 기록, M11 다음 클릭 후 재생 지속, M12 체크리스트 3줄 삭제 | 선정 이유: 각 FR의 관찰 가능한 실패 유형 중 서로 다른 코드 경로(머무름 계산·비트·재생 상태·공개 규칙·호출 맥락·문서) | 각 변이 뒤 해당 테스트 파일 실행 | 12/12 kill(의도한 VO 단언이 실패: M1 34, M2 20, M3 9, M4 16, M5 18, M6 5, M7 8, M8 19, M9 13, M10 3, M11 2, M12 1 실패) |
| 4 | verifier 1(retry): F-1 look.md 미검사·"되도록 once" 변형 미금지, F-2 VO-AUTO 점 항목, F-3 R-1 문장, F-4 부품 행 공식 중복·reduced 지시 미검사; 권고 A-1~A-7 | F-2·F-3 spec 결함, F-1·F-4 증거 결함 | spec v5; 테스트 batch(F-1, F-4, A-3 엣지-id-끝 숨김 사례, A-7 주석) | npm test 1521/1521, gallery audit·check:css 통과; main 변이 M13 look.md에 "되도록 once" 문장 복원 → 2 실패(kill), M14 controls 행에 공식 중복 → 1 실패(kill), 복원 확인 |
| R | R-1 장면 2 캡처(step0·1·3), R-2 grep | — | `5ad829b7137b4d19-r1-verdict.md`; R-2 남은 줄은 stepper `interval` 옵션·CHANGELOG 1.0.0 이력·catalog stepper 데모 서명뿐 | 통과 |

# Version Log
## v5
- [verifier 1 F-2·F-3] VO-AUTO 전이 항목에서 단계 점을 뺀다(FR-3 v2와 맞춤). R-1 기대 문장에 AD-6 배경 노드를 넣는다. [F-1·F-4] VO-DOCS 표면에 look.md를 넣고, "되도록 once로 한 번 재생하고 멈춘다" 변형과 부품 행의 공식 중복을 금지 항목으로, controls 행의 reduced-motion 지시를 필수 항목으로 둔다.
## v4
- look/look.md를 Implementation에 넣는다: 72행 "그때도 되도록 `once`로 한 번 재생하고 멈춘다"가 UI-2가 없애려는 문구다(implementer 보고). 읽기 묶음 예산을 맞추려 deck-contracts.md의 기존 문장을 줄인 것은 의미를 보존하는 범위만 인정하고, 빠진 계약(비트 노출 표지, stop 여부와 무관한 재시작, attract의 값 표시 동기, 전체 개요용 `highlight(null)`)은 되돌리며, goal 표본 수는 rules.md로 옮긴다. 브리프의 "읽기 묶음 약 +600자"는 기존 문장 압축으로 순증 0이 되었다(사용자 보고 대상).
## v3
- [계약만] FR-12: controls.md 행은 머무름 공식·reduced-motion을 `deck-contracts.md`로 가리킨다. 근거: 읽기 묶음 예산(QR-7) 안에서 공식을 두 곳에 두면 중복이고, 작가는 deck-contracts.md를 매 수업 읽는다.
## v2
- [spec 정정] FR-3: 단계 점은 기존 kit에서 누를 수 없는 표시라 멈춤 대상에서 뺀다(test-implementer 탐침); 반복 재생 재개 시점을 정한다. FR-7: 한 enter의 여러 highlight는 마지막이 기록(implementer 보고, 구현 동작). QR-7: 기존 읽기 묶음 예산 44,990을 명시(새 문서로 46,491 → 초과, 예산은 사용자 결정 "One read-set budget"이라 그대로 두고 문서를 줄인다). Tests 경로에 absorb 테스트·fixture 추가(옛 `autoplay: false`·hold 800 계약을 씀). 브리프 항목 변경 없음(단계 점은 브리프의 멈춤 수단 중 기존에 동작하지 않던 하나).
## v1
- 초안. 근거: 사용자 신고(장면 2), sonnet 자료 조사·비판 검토, 사용자 결정("하나의 길", 자동 재생 기본, 답 1–3).
