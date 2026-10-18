---
version: 2
run_id: 1e62814b16984176
status: limit
base_commit: 17ccf58234f84d8bae80736c90b88c389204f635
max_verifier_invocations: 2
handoff: agent-docs/handoff/2f6fe9bc88fb2faa-gallery-audit-zero-limit-evidence.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 수업을 만드는 agent, 사용자 | 갤러리가 skill 자신의 화면 점검 규칙(SKILL.md §3.6 "두 크기 모두 0건")을 지켜, 참고물에서 규칙 위반 패턴이 복제되지 않는다 (handoff fb7b84e0280f15ef Goal) | 갤러리 deck 13편 × 1440×900·1280×800에서 audit·lint·expect 0건, 기준선이 모두 0이라 `npm test`가 0을 강제한다 |
| UI-2 | 학습자 | 경고를 없애도 수업이 가르치는 것은 그대로다 (사용자 결정 3) | 각 수업의 개념·결정 변수·predict 문제·recall·ltt-meta가 남고, 나뉜 장면은 둘이 합쳐 원래 내용을 담는다 |
| UI-3 | 수업 작가 | audit 판정이 덱이 실제로 그리는 배치와 같은 기준이고, `shrunk`가 무엇을 재는지 문서로 안다 (사용자 결정 2·4) | layout을 적지 않은 overview가 full 장면 기준으로 판정되고, API.md audit 표와 CHANGELOG에 적혀 있다 |
| UI-4 | kit 개발자 | 갤러리에 죽은 코드와 형식이 다른 메타가 없다 (사용자 결정 5) | tls13-quic에 `streamsMiniOld`가 없고 `ltt-meta.mode`가 다른 수업처럼 서술문이다 |
| UI-5 | orchestrator | refactoring-8 handoff가 결과와 미결 질문의 답과 함께 닫힌다 (사용자 결정 7) | handoff가 stale/로 옮겨지고 ledger에 Open Questions 답이 있으며 `verify_rules.py` 통과 |

# Scope
In scope:
- `skills/learn-to-tell/kit/ltt.js` `auditScene`: hero 판정을 실제 layout 기준으로(FR-1). 다른 판정·임계값·문구·순서는 그대로.
- `skills/learn-to-tell/kit/API.md` 화면 점검 표: `shrunk` 배율의 뜻 한 문장, `small-visual`·`empty-stage`의 full 장면 정의(FR-2). 기존 문서 예산(8,500 코드포인트, tests/api-docs.test.mjs `QR-P1`) 안에 넣기 위해 API.md 다른 곳의 순수 중복 문장·칸 끝 마침표를 지울 수 있다(규칙·필드·이름·임계값·참조 문서는 지우지 않는다, FR-2(c)).
- `skills/learn-to-tell/kit/CHANGELOG.md` 0.2.0 "작가 계약" 절에 hero 변경 한 줄(FR-3).
- 갤러리 live deck 13편(`site/gallery/` 아래 `index.html`·`catalog.html`·`stale/` 제외)의 장면 수정: 글 줄이기, 그림 키우기·`layout: "full"`, 장면 나누기(FR-4, FR-6, FR-7).
- `site/gallery/network/tls13-quic.html`: `streamsMiniOld` 삭제, `ltt-meta.mode` 서술문(FR-5).
- `tests/gallery-audit.baseline.json`을 모두 0으로(FR-8).
- 종료 시(main): refactoring-8 handoff 닫기(FR-9), 증거 파일 `agent-docs/spec-logs/1e62814b16984176-*`.

Out of scope: audit 임계값(88%·78%·10%·22%·35%·60%·7단계) 변경, `measure`·placement·zoom 잠금 변경(ADR 40552fcb2a7c3985), audit 크기 변경(두 크기 유지), 폰 배치(ADR dbd5ddb9b247aa15), `ltt-deck.js` 수정, `index.html`·`catalog.html`·`stale/`, `server/audit.mjs` 수정, SKILL.md 수정, 다른 handoff(refactoring-1/6/9/10, d7cbe1b9150ab344), 커밋·push·릴리스·version 변경.

# Paths
Implementation: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/CHANGELOG.md, site/gallery/cache-ttl.html, site/gallery/scenes.html, site/gallery/cognition/anchoring.html, site/gallery/finance/diversification.html, site/gallery/gpu/single-gpu-dataflow.html, site/gallery/knowledge-graph/ontology-triples.html, site/gallery/linear-algebra/matrix-as-transform.html, site/gallery/network/tls13-quic.html, site/gallery/pedagogy/retrieval-practice.html, site/gallery/philosophy/trolley-ethics.html, site/gallery/physics/projectile-drag.html, site/gallery/uiux/color-contrast.html, site/gallery/uiux/visual-hierarchy-spacing.html
Tests: tests/scene-types.test.mjs, tests/kit.test.mjs, tests/gallery.test.mjs, tests/gallery-audit.test.mjs, tests/gallery-audit.baseline.json, tests/api-docs.test.mjs, tests/release-docs.test.mjs
Test command: npm test
Review evidence: R-1 기준선 재생성·반복 audit, R-2 전후 스크린샷 검토, R-3 내용 보존 대조, R-4 장면 수 대조, R-5 kit·문서 변경 범위 대조, R-6 금지 수단 점검 (아래 Verification Obligations). 산출물은 `agent-docs/spec-logs/1e62814b16984176-*`와 이 spec의 Execution ledger. 모두 main이 만들고 돌린다(npm test 밖).
Fuzzing: none — 바뀌는 코드는 `auditScene`의 불리언 식 하나이고 입력 공간(타입 × layout × fullByDefault)이 유한해 VO-1의 결정표가 전부 덮는다. 나머지는 정적 페이지의 내용 수정이라 fuzz 표면이 없다.
Mutation tool: none — JS 변이 도구(Stryker)가 설치되어 있지 않다(사용자 결정 6). 대신 hand mutation HM-1..HM-10(VO-12).

# Signatures
`LTT.auditScene(m) → [{rule, msg}]` (ltt.js, 시그니처 불변). `m.layout`은 작가가 적은 layout 문자열(없으면 `""`, `measure`가 그대로 넘긴다).
- `hero = sceneMeta(m.type, "auditHero") || effectiveFull`
- `effectiveFull = m.layout ? m.layout === "full" : !!sceneMeta(m.type, "fullByDefault")` — 덱 mount(ltt-deck.js `var full = s.layout ? s.layout === "full" : !!sceneMeta(s.type, "fullByDefault")`)와 같은 규칙. `m.layout`이 빈 문자열·`undefined`·`null`이면 타입 기본값을 쓴다.
- hero는 지금처럼 `small-visual` 기준(hero 22%, 아니면 10%)과 `empty-stage` 판정 여부만 바꾼다.

`tests/gallery-audit.baseline.json` 형식 불변: `{ "1440x900": {<page>: n}, "1280x800": {<page>: n} }`, 키는 지금과 같은 13쪽 × 2크기(26개), 값은 모두 `0`, `npm run audit:baseline`이 쓰는 형식(2칸 들여쓰기, 끝 줄바꿈).

`ltt-meta.mode` 형식(갤러리 deck 페이지 전부): `"<형>: <서술>"`. `<형>`은 `체험형`·`설명형`·`카탈로그용` 중 하나, 그 뒤 `": "`, `<서술>`은 20자 이상.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `auditScene`의 hero는 Signatures의 식을 따른다. hero가 지금과 같게 나오는 입력에서는 출력 배열(규칙·문구·순서)이 기준 커밋과 같다(규칙·순서는 VO-1·VO-2, 문구는 R-5: `auditScene`에서 바뀐 줄이 hero 식 한 줄과 주석 한 줄뿐이라 문구를 만드는 줄이 기준 커밋과 같다). 실행 중에 더한 타입 entry의 `fullByDefault`도 반영된다 | must | 사용자 결정 4, handoff Open Question(overview hero) |
| FR-2 | `kit/API.md` 화면 점검 표: (a) `overflow`, `shrunk`, `hscroll` 행에 "판정하는 배율은 장면에 들어올 때 모든 상태(predict 선택지별 정답, figure의 모든 단계, summary recall 답)를 미리 그려 잠근 최소 배율"이라는 뜻의 한 문장이 있고 그 행은 `모든 상태`와 `최소 배율`을 글자 그대로 담는다. (b) `small-visual` 행과 `loose-figure`, `empty-stage` 행은 full 장면을 "실제 layout이 full인 장면(layout을 적지 않은 overview 포함)"으로 적고 두 행 모두 `layout을 적지 않은 overview`를 글자 그대로 담는다. 임계값 숫자는 바꾸지 않는다. (c) 화면 점검 표의 임계값 글자 `78%`·`88%`·`10%`·`22%`·`35%`·`60%`·`7단계`가 기준 커밋과 같은 행에 그대로 있고, FR-2 행 밖의 수정은 Scope가 허용한 중복 제거뿐이다 | must | 사용자 결정 2·4, v2 SC-2 |
| FR-3 | `kit/CHANGELOG.md`의 `## 0.2.0` 아래 "작가 계약" 목록(다음 소제목 "kit 개발자용" 앞)에 한 줄: layout을 적지 않은 overview도 audit에서 full 장면으로 판정되어 `small-visual` 22% 기준과 `empty-stage`를 받는다. 그 줄은 `overview`, `layout`, `small-visual`, `empty-stage`를 담는다. 기존 줄은 그대로(이 run이 CHANGELOG에 더하는 것은 이 한 줄뿐) | must | 사용자 답변 2 |
| FR-4 | 갤러리 deck 13편 각각을 1440x900·1280x800으로 `audit.mjs`가 열면 결과 JSON의 `audit`·`lint`·`expectFails`가 모두 빈 배열이고 `error`가 없다 | must | 사용자 결정 3 |
| FR-5 | `tls13-quic.html`에 `streamsMiniOld`라는 글자가 없다(정의·호출·주석 모두). 갤러리 deck 페이지 전부의 `ltt-meta.mode`가 Signatures 형식을 따른다. tls13-quic의 새 mode는 `체험형: `으로 시작하고 수업 흐름(핸드셰이크·0-RTT·스트림·연결 이전을 무엇으로 보고 무엇을 짐작하는지)을 서술한다 | must | 사용자 결정 5 |
| FR-6 | 내용 보존. 각 수업에서 (a) `ltt-meta`의 `domain`·`topic`·`audience`·`theme`·`medium`·`decision`·`lesson`은 그대로다(tls13 `mode`, 나눈 수업의 `pattern`만 바뀐다). (b) predict 장면 수, 각 predict의 `question`·`choices`·`answer`는 그대로다. (c) glossary 키 집합, terms 장면의 용어 키, keywords 장면, `LTT.expect` 라벨 집합은 그대로다. (d) summary가 모으는 takeaway·recall·ask의 개수는 그대로다. (e) 줄인 글(narration·sub·caption·points·단계 자막·`why`·`answerVisual` 글·takeaway·recall 답)은 원래 주장을 유지한다(같은 개념·같은 수치·같은 판정). 중복된 문장만 지운다 | must | 사용자 결정 3 |
| FR-7 | 고치는 순서와 허용 수단. 글 줄이기를 먼저 하고, 줄이면 FR-6(e)를 지킬 수 없을 때만 장면을 나눈다. `scenes.html`은 나누지 않는다. 나눈 장면 둘은 각자 주장 문장 제목을 갖고 각자 하나의 완결된 단계로 읽히며, takeaway·recall·ask는 둘 중 한 장면에만 둔다. 나눈 수업의 `ltt-meta.pattern`에 새 장면의 타입을 그 자리에 넣는다. 원래 타입이 반쪽 내용을 담을 수 없으면(예: 양쪽을 한 화면에 나란히 두는 `contrast`) 나뉜 두 장면은 다른 타입(타입 없는 `mount` 등)이 될 수 있고, 그때 pattern의 원래 항목을 두 장면의 타입으로 바꾼다. 나뉜 두 장면은 원래 장면이 보이던 비교(값·번호 주석)를 글이나 그림으로 유지한다. 한 수업의 장면 수가 기준 커밋보다 3개 넘게 늘어야 하면 그 수업은 나누기 전에 멈추고 보고한다(E-5). 금지: 임계값·kit 코드(FR-1 한 줄 외) 변경, 페이지 CSS로 글자 크기 단계 추가·글자 축소, `transform`·`zoom`·`overflow:hidden`·`display:none`·`title` 속성으로 내용을 숨기거나 줄여 보이기, 그림이 아닌 요소에 `data-visual` 달기, 빈 여백으로 그림 상자 키우기, 폭 `vw` 고정(API.md 원칙), predict 선택지·정답·용어·기대값 삭제 | must | 사용자 결정 3, 사용자 답변 1 |
| FR-8 | `tests/gallery-audit.baseline.json`이 Signatures 형식으로 26개 값이 모두 0이고, 최종 트리에서 `npm run audit:baseline`이 쓰는 파일과 바이트가 같다 | must | 사용자 결정 3 |
| FR-9 | (main) refactoring-8 handoff를 닫는다: Execution Ledger에 이 run의 결과 줄과 Open Questions 답(두 크기 유지, 헤드리스 측정 기준 인정, `shrunk` 최소 배율은 의도, overview hero는 실제 layout 기준으로 해결)을 덧붙이고(기존 Failed Attempts 행은 고치지 않고 덧붙이기만), `index.md`의 항목을 `stale.md`로 옮기고 파일을 `stale/`로 옮긴다. `python3 .harness/git/verify_rules.py` 통과 | must | 사용자 결정 7 |

# Errors
- E-1 Chrome이 없음 / `CI`(LTT_AUDIT≠1) / `LTT_AUDIT=0` — gallery-audit 테스트가 이유와 함께 skip(기존 동작) — 다른 테스트는 그대로 돈다.
- E-2 한 페이지·크기의 audit 실행이 세 번 재시도 뒤에도 `#ltt-audit`을 내지 못함 — gallery-audit 테스트 실패, `<size> <page>: <error>` 줄 — 기준선 파일은 바뀌지 않는다.
- E-3 갤러리 페이지에 audit 경고가 1건이라도 생김(기준선 0) — gallery-audit 테스트 실패, `<size> <page>: audit n > 0`과 장면별 `장면 k [rule]: msg` 줄 — 페이지는 그대로, 테스트만 빨강.
- E-4 lint 경고·기대값 불일치가 생김 — gallery-audit 테스트 실패, `lint …` / 불일치 문구 줄.
- E-5 한 수업을 고치려면 장면이 기준보다 3개 넘게 늘어야 함 — implementer가 그 수업을 나누지 않고 멈춘 채 보고(수업 이름, 필요한 장면 수, 줄이기로 안 되는 이유) — main이 orchestrator에게 hand back, 다른 수업 작업은 계속.
- E-6 deck 페이지의 `ltt-meta.mode`가 형식을 어김(예: `"simulation"`) 또는 tls13에 `streamsMiniOld`가 있음 — gallery 테스트 실패, 페이지 이름을 담은 메시지.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | `auditScene({type:"overview", layout:"", visualRatio:0.15, fill:0.9, …})` | `["small-visual"]` (전에는 `[]`) |
| C-2 | boundary | overview, layout `""`, visualRatio 0.2199 / 0.22 / 0.2201 | `small-visual` / 없음 / 없음 |
| C-3 | boundary | overview, layout `""`, fill 0.599 / 0.6 / 0.601 | `empty-stage` / 없음 / 없음 |
| C-4 | normal | overview, layout `"split"`, visualRatio 0.15, fill 0.3 | `[]` (작가가 적은 layout이 우선) |
| C-5 | normal | overview, layout `"full"`, visualRatio 0.15 | `["small-visual"]` |
| C-6 | normal | figure, layout `"split"`, visualRatio 0.15 | `["small-visual"]` (`auditHero`) |
| C-7 | normal | explain, layout `""`, visualRatio 0.15, fill 0.3 | `[]`; explain layout `"full"` visualRatio 0.15 → `["small-visual"]` |
| C-8 | edge | `LTT.sceneTypes.foo = {fullByDefault: true}` 뒤 type `foo`, layout `""`, visualRatio 0.15 / fill 0.3 | `small-visual` / `empty-stage`; `sceneTypes.foo = {}`이면 `[]` |
| C-9 | edge | `LTT.sceneTypes.overview.fullByDefault = false`로 바꾼 뒤 overview, layout `""`, visualRatio 0.15 | `[]` (표에서 읽는다) |
| C-10 | edge | `m.layout`이 `undefined` 또는 `null`인 overview, visualRatio 0.15 | `["small-visual"]` (빈 문자열과 같다) |
| C-11 | normal | 최종 트리에서 `audit.mjs --gallery --json` | 26개 결과 모두 `audit`·`lint`·`expectFails` 빈 배열, `error` 없음 |
| C-12 | normal | 최종 트리의 `tests/gallery-audit.baseline.json` | 26개 키 모두 0 |
| C-13 | normal | tls13-quic.html 원문 | `streamsMiniOld` 없음, mode가 `체험형: `으로 시작하고 20자 이상 |
| C-14 | boundary | mode 검사기에 `"체험형: "+19자`, `"체험형: "+20자`, `"simulation"`, `"체험형:"+20자(공백 없음)`, `"실습형: "+30자` | 실패 / 통과 / 실패 / 실패 / 실패 |
| C-15 | normal | API.md 화면 점검 표 | `shrunk` 행에 `모든 상태`·`최소 배율`, `small-visual` 행과 `empty-stage` 행에 `layout을 적지 않은 overview` |
| C-16 | normal | CHANGELOG `## 0.2.0` | "작가 계약"과 "kit 개발자용" 사이에 `overview`·`layout`·`small-visual`·`empty-stage`를 모두 담은 줄 |
| C-17 | error | 고친 predict 장면 하나에 원래의 긴 `why`를 되돌림 | 그 크기에서 `shrunk`; gallery-audit 테스트 실패(E-3) |
| C-18 | error | 기준선 한 값을 1로 올림 | 테스트는 통과한다. 기준선은 상한이라 결함이 아니다(HM-3에 기록) |
| C-19 | edge | 나눈 수업 | 장면 수 = 기준 + 나눈 횟수(≤ 기준 + 3), `pattern`에 새 타입이 들어감, lint 0 |
| C-20 | edge | `scenes.html` | 장면 수 14 그대로, overview(장면 13)의 `small-visual` 해소 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | audit 판정의 정확성(hero)과 갤러리 0건이 핵심 결과다 |
| Performance efficiency | no | 바뀌는 kit 코드는 불리언 식 하나다. 장면을 나누면 audit 시간이 장면 수만큼 조금 늘지만 `npm test` 13초 수준이고 별도 목표가 없다 |
| Compatibility | yes | 사용자의 기존 수업(`~/.learn-to-tell/lessons`)에서 layout 없는 overview의 audit 판정이 바뀐다. 그 밖의 입력은 같아야 하고 변경은 CHANGELOG로 알린다 |
| Interaction capability | yes | 갤러리는 학습자가 읽는 화면이다. 고친 장면이 겹침·잘림 없이 읽히고 그림이 먼저 보여야 하며, 내용이 줄지 않아야 한다(학습 가능성) |
| Reliability | yes | 기준선이 0이 되면 측정이 흔들릴 때 테스트가 깜빡인다. 임계값 경계에 걸친 장면이 없어야 한다 |
| Security | no | 정적 페이지와 순수 함수 수정이다. 입력 처리·권한·네트워크 경계가 바뀌지 않는다 |
| Maintainability | yes | 죽은 코드 삭제, 메타 형식 통일, 문서와 코드의 일치 |
| Flexibility | no | 지원 크기·환경이 바뀌지 않는다(두 크기 유지, 폰 배치 범위 밖) |
| Safety | no | 물리적·인적 위해와 무관하다 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Functional suitability / functional correctness | 갤러리 deck 13편 × 2크기, 헤드리스 Chrome(`--window-size`, 화면 1440×813·1280×713) | `audit.mjs --gallery --json`의 `audit`+`lint`+`expectFails` 원소 수 합, 건 | = 0 | automated: VO-3(gallery-audit 테스트), review: R-1, mutation: HM-1·HM-9 | 사용자 결정 1·3 |
| QR-2 | Functional suitability / functional correctness | `auditScene` hero 결정표 | VO-1 coverage item 중 기대 출력과 같은 것의 비율, % | = 100% | automated: VO-1, mutation: HM-4·HM-5·HM-6 | 사용자 결정 4 |
| QR-3 | Compatibility / co-existence | hero가 바뀌지 않는 `auditScene` 입력(overview·fullByDefault 타입의 빈 layout 밖) | 기존 VO-6·VO-7 auditScene 테스트(tests/scene-types.test.mjs)와 kit.test의 auditScene 테스트 중 통과 비율(C-11 행과 TYPE_VARIANTS의 hero 기준만 새 기준으로 고침), % | = 100% | automated: VO-2 | 사용자 결정 4(다른 판정 불변) |
| QR-4 | Interaction capability / learnability·user engagement | 기준 대비 바뀐 장면 전부 × 2크기, 진입 상태와(predict·summary는) 공개 상태 | R-2 스크린샷 검토에서 겹침·잘림·그림이 첫눈에 안 들어옴·나뉜 장면이 혼자 안 읽힘 중 하나라도 있는 장면 수, 장면 | = 0 | review: R-2 | 사용자 결정 6(b) |
| QR-5 | Interaction capability / learnability | 각 수업의 가르치는 내용 | R-3: 구조 불변식(FR-6 a–d) 차이 수 + 줄인 글 중 주장이 바뀌거나 빠진 항목 수, 건 | = 0 | review: R-3 | 사용자 결정 3 |
| QR-6 | Reliability / faultlessness | 최종 트리, 같은 기계에서 연속 3회 `audit.mjs --gallery --json` | 3회 각각의 경고 합, 건 | 3회 모두 = 0 | review: R-1 | 2026-10-18 anchoring 88% 경계 사례(handoff ledger) |
| QR-7 | Maintainability / modifiability·analysability | tls13-quic.html, 갤러리 deck 페이지의 ltt-meta, API.md·CHANGELOG | `streamsMiniOld` 출현 수(건), mode 형식 위반 페이지 수(쪽), FR-2·FR-3 토큰 누락 수(개) | 모두 = 0 | automated: VO-4·VO-5, mutation: HM-7·HM-8·HM-10 | 사용자 결정 2·4·5 |
| QR-8 | Interaction capability / learnability | 장면 수 | 수업별 (최종 장면 수 − 기준 장면 수), 장 | 나눈 횟수와 같고 ≤ 3, `scenes.html` = 0 | review: R-4 | 사용자 결정 6(d), 사용자 답변 1 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, C-1..C-10, QR-2 | `LTT.auditScene` (vm에 ltt.js 로드, 기존 `loadKit`) | unit, `tests/scene-types.test.mjs`; 아래 항목 전부 | decision table testing + boundary value analysis (3-value) | DT-1..DT-8: (auditHero T/F) × (layout `""`/`"full"`/`"split"`) 중 T·`""`, T·`"split"`, F·`""`·fullByDefault T(overview), F·`""`·fullByDefault F(explain), F·`"full"`, F·`"split"`·fullByDefault T(overview), 런타임 entry `{fullByDefault:true}`, 런타임 entry `{}`; BV-1..BV-6: C-2 세 값, C-3 세 값(overview, layout `""`); EC-1: C-9(표 값 변경 반영); EC-2: C-10(`undefined`·`null`) | 100% | 각 항목의 규칙 배열이 Cases 기대값과 같다. 기존 `C-11 overview without layout` 행과 TYPE_VARIANTS의 22%·`fill 0.3` 기대식은 hero = `auditHero ∨ effectiveFull`(Signatures)로 바꾼다 | `npm test` |
| VO-2 | FR-1, QR-3 | 기존 auditScene 테스트 전체 | unit, 기존 테스트 유지 | equivalence partitioning (기존 분할 재사용) | 기존 VO-6 TYPE_VARIANTS × AUDIT_TYPES, AUDIT_BOUNDARIES, VO-7 MR-1/MR-2, kit.test `auditScene judges…`·`…sweep goals…` | 100% | hero가 그대로인 항목은 기대값을 바꾸지 않고 통과. 바뀐 기대값은 overview·런타임 fullByDefault 항목뿐 | `npm test` |
| VO-3 | FR-4, FR-8, C-11, C-12, E-2..E-4, QR-1 | `tests/gallery-audit.test.mjs` + `tests/gallery-audit.baseline.json` | end-to-end(헤드리스 Chrome), 13쪽 × 2크기 전부 | equivalence partitioning | GA-1..GA-26 (페이지 × 크기) | 100% | 기준선 26개 값이 모두 0이고, 각 결과가 기준선 이하·lint 0·expect 0 → 통과. 테스트 코드 자체는 바꾸지 않아도 된다(기준선 파일만) | `npm test` (Chrome 있는 로컬) |
| VO-4 | FR-5, C-13, C-14, E-6, QR-7 | `tests/gallery.test.mjs`: 갤러리 페이지 원문 | unit(파일 검사), deck 페이지 전부(`/kit/ltt-deck.js`를 불러오는 페이지) | syntax testing | SY-1 형식 검사기 자체: C-14의 다섯 문자열; SY-2 deck 페이지 전부의 mode; SY-3 tls13 원문에 `streamsMiniOld` 없음 | 100% | 검사기는 Signatures 형식을 따르고, 페이지 위반 시 페이지 이름을 담아 실패 | `npm test` |
| VO-5 | FR-2, FR-3, C-15, C-16, QR-7 (v2: FR-2(c)) | `skills/learn-to-tell/kit/API.md` 화면 점검 표, `kit/CHANGELOG.md` | unit(문서 검사), `tests/api-docs.test.mjs`·`tests/release-docs.test.mjs` | equivalence partitioning | DOC-1 `shrunk` 행 두 토큰, DOC-2 `small-visual` 행 토큰, DOC-3 `empty-stage` 행 토큰, DOC-4 CHANGELOG 작가 계약 절 한 줄의 네 토큰(그 줄이 "kit 개발자용" 앞에 있음), DOC-5 화면 점검 표의 임계값 글자: `overflow`·`shrunk`·`hscroll` 행에 `78%`·`88%`, `small-visual` 행에 `10%`·`22%`, `loose-figure`·`empty-stage` 행에 `35%`·`60%`, `many-sizes` 행에 `7단계` | 100% | 토큰이 FR-2·FR-3이 정한 행·절 안에 있다(다른 행·절에 있으면 실패) | `npm test` |
| VO-6 | FR-8, QR-6 | 최종 트리 | review | — (절차 증거) | R-1 | 전부 | `npm run audit:baseline` 뒤 `git diff --exit-code tests/gallery-audit.baseline.json`이 0, `audit.mjs --gallery --json` 3회 모두 경고 0 | R-1 |
| VO-7 | QR-4, FR-7 | 기준 대비 바뀐 장면 | review | — | R-2 표의 행(바뀐 장면 × 2크기, predict·summary는 공개 상태 추가) | 100% | 나빠짐 0 | R-2 |
| VO-8 | FR-6, QR-5 | 13편 | review | — | R-3 표의 행(수업 13 × 불변식 a–d, 바뀐 글 항목 전부) | 100% | 차이 0, 주장 손실 0 | R-3 |
| VO-9 | FR-7, QR-8, C-19, C-20, E-5 | 13편 | review | — | R-4 표의 13행 | 100% | 증가 = 나눈 횟수 ≤ 3, scenes.html 0, 나눈 수업의 pattern 반영 | R-4 |
| VO-10 | FR-9 | refactoring-8 handoff | review(main 종료 단계) | — | 이동·ledger·verify_rules | 전부 | `verify_rules.py` 종료 코드 0, `index.md`에 fb7b84e0 없음, `stale.md`에 그 블록 | 종료 단계 기록 |
| VO-11 | 전 FR | 기본 회귀 | `npm test` 전체 | — | 832개 기존 테스트 + 새 테스트 | 100% 통과 | fail 0 | `npm test` |
| VO-13 | FR-1(문구), FR-2(c), FR-3(기존 줄) | ltt.js·API.md·CHANGELOG 변경 범위 | review | — | R-5 | 전부 | ltt.js `auditScene` 안의 바뀐 줄은 hero 식 1줄과 주석 1줄, API.md 임계값 글자 전부 기준과 같고 FR-2 행 밖 수정은 중복 제거뿐, CHANGELOG는 1줄 추가뿐 | R-5 |
| VO-14 | FR-7 금지 목록, QR-4 | 갤러리 13쪽의 기준 대비 diff | review | — | R-6 금지 수단 9종 각각의 탐색 결과 | 100% | 각 출현에 판정(금지 위반 아님 / 위반 → 수정)이 있고 위반 0 | R-6 |
| VO-12 | QR-1, QR-2, QR-7, E-2, E-4 | hand mutation | main, 하나씩 backup→주입→`npm test`→restore | error guessing | HM-1..HM-10, v2 추가 HM-11..HM-15 (아래) | none — experience-based | 각 HM이 기대한 assertion으로 실패(HM-3은 통과가 기대값) | Execution ledger |

Review procedures (main):
- R-1: 최종 트리에서 `npm run audit:baseline` 뒤 파일이 Signatures 구성(기준 커밋 기준선의 키·순서, 값 0, `JSON.stringify(…, null, 2) + "\n"`)과 바이트가 같은지 node로 비교한다(v2: 기준 커밋 값이 0이 아니어서 `git diff --exit-code`는 쓸 수 없다). 이어 `node skills/learn-to-tell/server/audit.mjs --gallery --json > agent-docs/spec-logs/1e62814b16984176-final-audit-<k>.json`을 k=1,2,3으로 돌려 경고 합을 센다. 기준은 `agent-docs/spec-logs/1e62814b16984176-base-audit.json`(기준 커밋, 42건)과 hero 변경만 넣은 scratch 측정(44건).
- R-2: 기준 트리(`git archive 17ccf58`를 scratchpad에 푼 사본)와 최종 트리에서 `audit.mjs --gallery --shots <dir>`(두 크기). 검토 대상("바뀐 장면")은 `agent-docs/spec-logs/1e62814b16984176-review.mjs scenes` 모드가 두 크기에서 뽑은 장면별 서명(정규화한 outerHTML·textContent 해시, 장면 배율, 본문 요소 상자의 해시) 중 하나라도 기준과 다른 장면 전부다(장면은 제목·타입으로 짝짓고, 나뉜 장면은 원래 장면에 짝짓는다). 목록은 `1e62814b16984176-changed-scenes.json`. 그 장면 전부를 두 크기 모두 진입 상태로 보고, predict·summary는 `review.mjs reveal`(정답 공개·recall 답 열기)로 공개 상태도, 등장 애니메이션이 있는 장면은 같은 모드로 안정 상태도 본다. 나뉜 장면은 기준의 한 장과 최종의 두 장을 나란히 본다. 판정 기준: 글자·그림 겹침, 잘림, 화면에서 가장 먼저 보이는 것이 그림인가, 나뉜 장면이 각자 제목·그림·읽는 법을 갖춘 완결된 단계인가. 결과 표 `agent-docs/spec-logs/1e62814b16984176-shots-review.md`.
- R-3: `agent-docs/spec-logs/1e62814b16984176-review.mjs dump`가 헤드리스 Chrome에서 `LTT.deck`에 넘긴 spec을 가로채(kit 파일은 바꾸지 않고 CDP로 주입) 수업마다 ltt-meta, predict `question`·`choices`·`answer`, glossary 키, terms 키, keywords 장면, takeaway·recall·ask 수, `LTT.expect` 라벨, 장면 제목·타입 목록을 JSON으로 뽑는다. 기준·최종을 비교해 FR-6(a–d) 차이를 센다. `1e62814b16984176-content-diff.mjs`가 비교한다. 이어 `review.mjs scenes`가 뽑은 장면별 textContent와 spec 문자열 필드를 기준·최종 사이에서 문장 단위로 비교한 목록(`1e62814b16984176-text-diff.md`, 바뀐 문장마다 전·후 원문)을 만들고, 그 항목 전부에 (장면, 전, 후, 주장 유지 여부·근거)를 `agent-docs/spec-logs/1e62814b16984176-content-review.md`에 적는다.
- R-5: main이 `git diff 17ccf58 -- skills/learn-to-tell/kit/ltt.js skills/learn-to-tell/kit/API.md skills/learn-to-tell/kit/CHANGELOG.md`를 읽고 VO-13의 세 조건을 확인해 결과(줄 수와 판정, diff 내용은 적지 않음)를 `1e62814b16984176-scope-review.md`에 적는다.
- R-6: main이 `git diff 17ccf58 -- site/gallery`의 추가 줄에서 금지 수단 9종(글자 크기 선언 추가·변경, `transform`, `zoom`, `overflow: hidden`·`clip`, `display: none`·`visibility: hidden`, `title=` 속성, `data-visual`, 그림 상자의 `padding`·`min-height`·`height` 키움, 폭 `vw`)을 정규식으로 찾고, 출현마다 금지 위반인지 판정해 `1e62814b16984176-scope-review.md`에 적는다. 이어 최종 트리 장면 서명에서 본문 글자 크기 최솟값이 기준보다 작아진 장면을 찾아 같은 표에 적는다.
- R-4: 기준·최종 덤프의 장면 수로 수업별 장면 수 표(기준, 최종, 나눈 장면과 이유, pattern 반영)를 `content-review.md`에 둔다.

Hand mutations (VO-12; 강한 결함 부류 순. 선택 이유: 이 run의 결과가 무너지는 경로—긴 글 재발, vw 재도입, 기준선 완화, hero 식의 세 갈래 오류, 정리 항목 되돌림, 문서 누락—를 하나씩 대표한다):
- HM-1 고친 predict 장면 하나에 기준 커밋의 긴 `why`를 되돌림 → gallery-audit 테스트가 `shrunk`로 실패.
- HM-2 figure 그림 규칙 하나(tls13 `.seqwrap`)에 `width: 56vw` 재도입 → gallery.test VO-4 vw 검사가 실패(audit이 잡는지도 함께 기록, 못 잡으면 그 사실을 기록).
- HM-3 기준선 한 값을 1로 → 테스트 통과(기준선은 상한, 결함 아님을 기록).
- HM-4 hero를 기준 커밋 식(`|| m.layout === "full"`)으로 되돌림 → VO-1 DT·BV 항목 실패.
- HM-5 hero를 `auditHero || m.layout === "full" || fullByDefault`(작가 layout 무시) → DT(overview `"split"`) 실패.
- HM-6 hero에서 `auditHero` 항을 뺌 → DT(figure `"split"`) 실패.
- HM-7 tls13에 `function streamsMiniOld(el) {}` 다시 넣음 → gallery.test SY-3 실패.
- HM-8 tls13 mode를 `"simulation"`으로 → gallery.test SY-2 실패.
- HM-9 scenes.html overview 수정 되돌림 → gallery-audit 테스트가 `small-visual`로 실패.
- HM-10 API.md `shrunk` 행의 새 문장 삭제 → VO-5 DOC-1 실패.
- v2 추가(verifier 1회차 제안 중 E-2·E-4·새 assertion을 직접 겨누는 것): HM-11 한 페이지의 `LTT.expect` 기대값 변조 → gallery-audit expectFails 줄(E-4). HM-12 한 페이지 스크립트를 깨뜨림(`LTT.deck(` 앞에 throw) → `<size> <page>: <error>` 또는 audit 없음(E-2). HM-13 기준선 키 하나 삭제 → gallery-audit 대상 집합 검사 실패. HM-14 CHANGELOG 새 줄을 "kit 개발자용" 아래로 이동 → DOC-4 실패. HM-15 tls13 밖 페이지(scenes.html) mode를 `카탈로그: …`로 → SY-2 실패. HM-16 API.md `88%`를 `85%`로 → DOC-5 실패.

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| A-1 | audit 크기는 1440×900·1280×800 둘 다 유지(헤드리스 `--window-size`, 화면 1440×813·1280×713) | handoff Open Question; 2026-10-18 실제 Chrome 대조 일치 | user answer (지시 1) |
| A-2 | 헤드리스 측정을 판정 기준(oracle)으로 쓴다 | 2026-10-18 tls13 대조에서 건수·장면·규칙 일치, 비율 1%p 차이 | user answer (지시 1) |
| A-3 | `shrunk`가 모든 상태의 최소 배율을 보는 것은 의도. 임계값 불변, 장면을 고친다 | ADR 40552fcb2a7c3985, handoff f0ceee98 원칙 | user answer (지시 2) |
| A-4 | overview hero를 실제 layout 기준으로. scratch 측정: 1쪽(`scenes.html` 장면 13) 2건(1440 15%, 1280 12%) → 5쪽 이하라 이번 run에 포함, 고칠 경고 합 44 | `agent-docs/spec-logs/1e62814b16984176-hero-scratch.txt`(main이 옮김) | user answer (지시 4) |
| A-5 | hero 계산은 `auditScene` 안에서(`measure`는 작가 layout 그대로) | 순수 함수라 단위 테스트로 판정이 드러난다. 나중에 measure로 옮겨도 판정 같음 | user answer (승인된 Decided) |
| A-6 | 추가 분할 허용: 줄이기 우선, 내용 손실 없이 못 맞출 때만 분할, scenes.html 분할 금지, 수업당 +3 초과면 먼저 보고 | refactoring-3 기본 예산(SKILL.md 53행) | user answer (답 1) |
| A-7 | CHANGELOG 줄은 "작가 계약" 절 | 작가가 받는 판정이 바뀜 | user answer (답 2) |
| A-8 | 장면 번호 밀림 허용. 저장소에 `#n` 딥링크 없음(grep), 지난 spec-log 장면 번호는 기록이라 고치지 않음 | grep 결과 | user answer (승인된 Decided) |
| A-9 | tls13 cleanup: `streamsMiniOld` 삭제, mode 서술문 | 호출 없음(grep 124행 정의뿐) | user answer (지시 5) |
| A-10 | 기준선 0은 미리 정해진 값이라 test-implementer가 파일을 0으로 쓰고, main이 R-1로 `npm run audit:baseline` 결과와 바이트 같음을 확인한다 | 테스트 역할은 구현을 기다리지 않는다 | brief v1 — approved |
| A-11 | mode 형식 검사 규칙: `^(체험형|설명형|카탈로그용): ` + 20자 이상 | 현재 12쪽이 이 형식(scenes.html은 `카탈로그용`), tls13만 위반 | brief v1 — approved |
| A-12 | 나눈 장면의 takeaway·recall·ask는 한 장면에만 둔다(summary 개수 불변) | FR-6(d)를 자동으로 확인할 수 있게 하는 선택 | brief v1 — approved |
| A-13 | 스크린샷 검토는 main이 한다(사용자 지시 6(b) "reviewed by main"). 독립 눈 검토 서브에이전트는 쓰지 않는다 | 지시 6(b) | brief v1 — approved |
| A-14 | 평가 기법·목표: VO-1 결정표+BVA 100%, VO-3 페이지×크기 100%, VO-4 syntax 100%, VO-5 EP 100%, HM 10개 | 유한한 입력 공간 | brief v1 — approved |
| A-15 | Fuzzing none, mutation tool none | 지시 6 | user answer (지시 6) |
| A-16 | API.md 예산 8,500 안에 FR-2 문장을 넣으려고 다른 곳의 순수 중복 문장·칸 끝 마침표를 지운다 | 세 행만 압축해도 8,635자(implementer 측정), 예산은 다른 spec의 기존 QR | user answer (재브리핑 v2 답 1: "deck-contracts.md를 읽는다" 안내는 SKILL.md §3.1과 부품 문서 표에 남으면 된다) |
| A-17 | 나눌 때 원래 타입이 반쪽을 못 담으면 다른 타입 허용(visual-hierarchy contrast → mount 둘) | `contrast`는 BEFORE·AFTER를 한 화면에 나란히 두는 타입 | user answer (재브리핑 v2 답 2: 두 장면이 각각 완결되고 BEFORE 값과 바뀐 값의 비교가 화면에 남는다는 전제) |
| A-18 | FR-1 문구 불변은 R-5 코드 범위 대조로 증명한다(테스트로 기준 문구를 고정하지 않음) | 문구를 만드는 줄이 바뀌지 않았음을 diff로 보이면 충분, 문구 고정 테스트는 이후 문구 개선을 막는다 | contract-only (v2) |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1..C-10 | VO-1, VO-2, VO-12(HM-4..6) | npm test |
| FR-2 | C-15 | VO-5, VO-12(HM-10) | npm test |
| FR-3 | C-16 | VO-5 | npm test |
| FR-4 | C-11, C-17, C-20 | VO-3, VO-6, VO-12(HM-1, HM-9) | npm test, R-1 |
| FR-5 | C-13, C-14 | VO-4, VO-12(HM-7, HM-8) | npm test |
| FR-6 | C-19 | VO-8 | R-3 |
| FR-7 | C-19, C-20 | VO-7, VO-9, VO-12(HM-2) | R-2, R-4, npm test |
| FR-8 | C-12, C-18 | VO-3, VO-6, VO-12(HM-3) | npm test, R-1 |
| FR-9 | — | VO-10 | 종료 단계 |
| QR-1..QR-8 | — | VO-1..VO-9, VO-12 | 위 표 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| open finding ids | TF-4, TF-5 (verifier 2회차, 예산 소진) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 2 | tests/scene-types.test.mjs `VO-1 …`; npm test 892/892; HM-4·5·6 실패 확인 | accepted (verifier 1, 2회차 유지) | 결정표·BVA 100%, HM-4/5/6 의도한 assertion | ltt.js hero 식(바뀌지 않음) |
| VO-2 | 2 | 기존 auditScene 테스트, R-5(문구 줄 불변) | accepted (verifier 1) | 문구 절은 v2 R-5로(SC-1) | — |
| VO-3 | 2 | baseline 26×0, 대상 집합 검사; HM-1·9·11·12·13 실패, HM-3 통과(기록) | accepted (verifier 1, 설계) | E-2·E-4 mutation 추가 | — |
| VO-4 | 2 | SY-1..3; HM-7·8·15 실패 | accepted (verifier 1) | — | tls13·scenes ltt-meta |
| VO-5 | 2 | DOC-1..5; HM-10·14·16 실패 | accepted (verifier 2) | — | API.md 8,495자 |
| VO-6 | 2 | ledger 12: 최종 트리 기준선 재생성·구성 바이트 비교, final-audit-1..3 | accepted (verifier 2) | — | batch 3 뒤 |
| VO-7 | 2 | shots-review.md v2(54곳 × 2크기, 공개·안정 11장) | accepted (verifier 2) | — | changed-scenes.json |
| VO-8 | 2 | content-diff.txt(차이 1), text-diff.md, content-review.md v2 | open: TF-4 (verifier 2) | 진단 steps-*.json은 미감사 | — |
| VO-9 | 2 | content-review.md 장면 수 표, A-17 | accepted (verifier 2) | — | — |
| VO-10 | 2 | 종료 단계 | pending-by-design | — | — |
| VO-11 | 2 | npm test 892/892 (05:28, batch 3 뒤) | accepted (verifier 2) | — | — |
| VO-12 | 2 | hand-mutations-result.json HM-1..16 | accepted (verifier 2) | 16개 실행, 15개 기대 실패·HM-3 기대 통과 | — |
| VO-13 | 2 | scope-review.md R-5 | accepted (verifier 2) | — | — |
| VO-14 | 2 | scope-review.md R-6 | open: TF-5 (verifier 2) | 넓힌 정규식 진단은 미감사 | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 0 | 기준 측정 | — | 기준 커밋 `audit.mjs --gallery`: 1440×900 8건, 1280×800 34건(합 42), lint 0, expect 0. `npm test` 832/832, 13.0초. hero scratch: +2건(scenes.html 장면 13) | 기준 확정 |
| 1 | test-implementer 이의 FR-2(a)·(b) intent gap: DOC-1은 `shrunk` 행만, DOC-3은 `empty-stage` 행만 본다 | API.md 표에서 `overflow`·`shrunk`·`hscroll`은 한 행, `loose-figure`·`empty-stage`도 한 행이다(첫 칸에 id가 함께 있음) | DOC-1의 "shrunk 행"이 곧 그 공용 행, DOC-3도 같다 | 기각(spec 변경 없음), 증거: API.md 화면 점검 표 첫 칸 |
| 2 | 첫 `npm test`: 884개 중 883 통과, `VO-3 FR-3 QR-P1: real kit/API.md is at most 8,500 code points` 실패(IMP-1) | 기준 커밋 API.md가 정확히 8,500자(상한)였고 FR-2 문장이 180자를 더함(8,680) — verified | correction batch 1: implementer에게 FR-2 토큰을 같은 행에 유지한 채 8,500 이하로 줄이게 함. 세 행 압축만으로 8,635 → 나머지는 중복 안내 문장·칸 끝 마침표 제거(규칙·필드·이름·임계값 삭제 없음, main이 word diff로 확인) | API.md 8,495자, `npm test` 884/884 통과. IMP-1 닫힘 |
| 3 | R-3 첫 대조: ontology·tls13·visual-hierarchy `counts`(recall·ask 2배) | 대조 스크립트 결함: 나눈 summary가 `cards`를 명시해 같은 recall을 두 번 셈 — verified | content-diff.mjs가 summary에 보이는 카드 목록을 순서대로 비교하도록 고침 | 남은 차이 1건: tls13 카드 제목(나눈 compare 표의 takeaway가 앞쪽 절반 제목을 따름, A-12의 허용 변화) |
| 4 | R-3 글 대조: visual-hierarchy 장면 4 캡션 "핵심은 2단계: 가격 대신 나머지를 낮춘다"(CR-1) | 줄이면서 "가격을 더 키우는 대신"의 "키우는"이 빠져 "가격을 낮추는 대신"으로도 읽힘 — verified(git diff) | correction batch 2: implementer에게 뜻을 되살리게 함 | 캡션 "핵심은 2단계: 가격을 키우는 대신 나머지를 낮춘다." 두 크기 audit 0. CR-1 닫힘 |
| 5 | R-2 스크린샷 검토 | — | 40곳 진입·공개·안정 상태, `1e62814b16984176-shots-review.md` | 나빠짐 0 |
| 6 | advisory AF-1: 페이지 CSS가 kit 내부 클래스를 덮음(`.dk-body .dk-kw` 칸 비율 2쪽, `.dk-capbar > .ltt-basis` 1쪽, `ltt-ba-foot` 재사용 1쪽). AF-2: summary 나누기를 페이지가 `LTT.summaryCards` + 자체 `recap` 필드로 3쪽에서 반복 | FR-7 금지 목록 밖, keywords는 FR-6(c)로 내용 고정이라 CSS가 유일한 수단 | kit 후보로 refactoring-8 종료 ledger에 남김(kit 수정은 이 run 범위 밖) | advisory, 비차단 |
| 7 | 손 mutation HM-1,2,4..10(구현 쪽, verifier 감사와 동시) | — | `1e62814b16984176-hand-mutations.py`, 결과 `…-hand-mutations-result.json`; 매번 seed.py backup/restore | 9개 모두 의도한 assertion으로 실패. HM-1 matrix 장면 6 `shrunk` 84%, HM-9 scenes 장면 13 `small-visual` 15%/12%, HM-2 56vw는 gallery.test VO-4 vw 검사만 잡음(audit은 `max-width:100%` 때문에 못 잡음 — 기록). 복원 뒤 `npm test` 884/884 |
| 8 | verifier 1회차 retry: TF-1(R-2 두 크기·predict 진입·batch 2 뒤·선정 절차), TF-2(R-3 전·후 원문), TF-3(최종 트리 증거 기록), SC-1..SC-4, AV-1..4 | TF-3: 기록 누락이지 실행 누락은 아님 — verified(파일 시각: batch 2 수정 05:10:52 < 기준선 재생성 05:11:39 < final-audit-1..3 05:12:04–23 < final-content 05:12:36; `npm test` 884/884는 같은 명령에서 기준선 직전) | v2 개정: R-2 선정 절차(장면 서명), R-3 문장 단위 목록, R-5·R-6, DOC-5, HM-11..16, FR-2(c), FR-7 타입 변경 조건 | SC-2(b)·SC-3은 brief 항목이라 재브리핑(A-16, A-17) |
| 9 | 재브리핑 v2 답: A-16·A-17 user answer | — | spec v2 확정 | — |
| 10 | test-implementer DOC-5(tests/api-docs.test.mjs, 실문서 4 + 합성 4) | — | `auditRowError`에 판정 함수 인자 추가(기본값 같음, DOC-1..3 그대로) | 로드 검사 통과 |
| 11 | R-3 v2 문장 목록 검토: visual-hierarchy AFTER 장면이 바뀐 값만 보이고 BEFORE 값과의 비교가 없음(CR-2) | A-17 전제(비교 유지) 미충족 — verified(text-diff.md 장면 7) | correction batch 3: AFTER 점 제목에 "14→8px, 10·12→24px" 등 전·후 값 | 두 크기 audit 0(implementer), CR-2 닫힘 |
| 12 | 최종 트리 증거 재생성(05:28–05:45): `npm test` 892/892(12.9초) → `npm run audit:baseline` → 구성 바이트 비교 true → final-audit-1..3 각 26결과 경고 0 → sig-final·final-content·changed-scenes(54곳)·content-diff(차이 1)·text-diff·shots-final·reveal | — | R-1·R-2·R-3·R-4 v2, R-5·R-6(`1e62814b16984176-scope-review.md`) | 모두 기대값 충족(AF-3: tls13 13·14 새 제목이 판정을 미리 말하는 정도가 기준보다 큼 — advisory, content-review.md 참고 1) |
| 13 | 손 mutation v2: HM-3, HM-11..HM-16 | — | 같은 러너, seed.py backup/restore | HM-3 통과(기준선은 상한, 결함 아님). HM-11 `✗ 검증 실패: net lives saved (모델 3, 기대 4)` 두 크기, HM-12 `audit이 돌지 않았다(#ltt-audit 없음)` 두 크기(E-2), HM-13 대상 집합 검사(`1440x900 cache-ttl.html` 누락), HM-14 DOC-4, HM-15 SY-2, HM-16 DOC-5 실패. 복원 뒤 `npm test` 892/892 |
| 14 | verifier 2회차 limit-blocking: TF-4(R-3이 페이지가 만든 단계 자막을 못 봄), TF-5(R-6 정규식이 JS·d3 표기를 놓침). AV-5..AV-9 advisory | verified(검증 범위 공백, 구현 결함 증거 없음) | 진단(미감사): `review.mjs steps`로 stepper 장면 14곳의 모든 단계 글을 기준·최종 비교 → 차이 4곳 모두 content-review.md에서 판정한 변경; 넓힌 정규식 → 새 출현 0 | 예산 소진으로 감사 불가 → status limit, handoff 2f6fe9bc88fb2faa |

# Version Log
## v1
- 초안. understanding round 확인과 orchestrator 답 1(추가 분할 허용, +3 초과 보고)·답 2(CHANGELOG 작가 계약 절), Decided 승인(A-5, A-8)을 반영.
## v2
- verifier 1회차(retry) 반영. SC-1: FR-1 문구 절의 증거를 R-5로 지정(A-18). SC-2: FR-2(c) 임계값 글자 보존과 DOC-5 추가, Scope에 API.md 예산 안의 중복 제거 허용(A-16, 재브리핑), FR-3 "한 줄만 추가"를 R-5로 확인. SC-3: FR-7에 나눌 때 타입 변경 허용 조건(A-17, 재브리핑). SC-4: R-6 금지 수단 점검과 VO-14 추가. TF-1·TF-2: R-2 검토 대상을 장면 서명 차이로 뽑는 절차와 R-3 문장 단위 전·후 목록으로 바꿈. AV-1: R-1을 구성 바이트 비교로. AV-2: 산출물 이름을 실제 `review.mjs` 모드로. VO-13·VO-14, HM-11..HM-16 추가.
## v2 종료
- status limit: verifier 2회 소진, TF-4·TF-5 미해결(진단 결과는 ledger 14), handoff `agent-docs/handoff/2f6fe9bc88fb2faa-gallery-audit-zero-limit-evidence.md`.
