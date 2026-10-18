---
version: 5
run_id: 74cb05d7da21907e
status: limit
base_commit: b3d5ba5ee8d1baf0682d20a1749cc6ff24d3e6c3
max_verifier_invocations: 2
handoff: agent-docs/handoff/d7cbe1b9150ab344-placement-module-error-path-evidence.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | kit 개발자 | 라이브러리는 확장 가능하고 유지보수 가능한 아키텍처를 가진다(refactoring-4 3번): 렌더링과 측정을 나눈다 | 미리 그려 재기, 배율 잠금, 자리 예약이 `ltt-deck.js` 안 `placement` 한 곳에 있고, figure·predict·summary 핸들러는 상태 열거자만 넘긴다 |
| UI-2 | 수업 작가, kit 개발자 | 페이지 CSS와 kit이 그림 폭을 두고 다투지 않는다(refactoring-4 4번) | `kit/API.md`에 "figure 그림 폭을 `vw`로 고정하지 않는다(kit이 칸 폭을 준다)"가 있고, 갤러리에 vw로 고정한 figure 그림 폭이 없으며, `widen`이 없다(조건부, FR-8) |
| UI-3 | 학습자 | 정답을 연 뒤 창 크기를 바꿔도 장면 배율이 그 크기에 맞는다(refactoring-5 4번) | 공개 상태에서 크기를 바꾼 뒤의 배율이 그 크기에서 새로 열어 같은 답을 공개한 배율과 같다 |
| UI-4 | 학습자 | 빈자리에 뜰 정답 때문에 장면이 처음부터 작아지지 않는다(refactoring-5 3번) | 보이는 상태로 잰 갤러리 predict 24경우에 해당 사례가 없음을 기록하고 구현하지 않는다(사용자 규칙 E, ledger 4). 진입 배율은 기준과 같다 |
| UI-5 | 사용자 | 리팩터링이 기존 수업을 바꾸지 않고, 의도한 변경은 경고 수와 눈으로 확인된다 | A 단계 DOM·audit·lint 불변, 전체 audit 건수 ≤ 기준선, B·E 단계에서 DOM이 바뀐 페이지의 스크린샷 대조 기록 |
| UI-6 | kit 개발자 | 남은 handoff와 기각 결정이 정리된다(refactoring-4 6번, refactoring-5 1·2번) | 6번 완료 표시, 기각 기록 2개, 두 handoff 종료, overview hero 질문을 refactoring-8로 이동 |

# Scope
In scope:
- `skills/learn-to-tell/kit/ltt-deck.js`
  - 내부 `placement` 모듈(한 객체 또는 한 구획). 맡는 것: 창 크기 키(`innerWidth x innerHeight + document.fonts.status`) 비교, 측정 모드(`LTT.measure`)와 `.dk-still` 감싸기, finally 안의 원상 복구, figure 단계 측정(옆/아래 배치, 단계별 최대 높이, 자막 칸 밑 판정, `min-height`), predict 배율 잠금, summary recall 답 자리 예약·해제.
  - 공개 이름 `LTT.placement = { zoomLock }`(순수 함수만).
  - D: 공개 상태 재측정. E(안 C)는 측정 근거로 구현하지 않음(v4, FR-5). B: `widen`/`unwiden` 제거(FR-8 조건부).
- `site/gallery/network/tls13-quic.html` `.seqwrap`, `site/gallery/knowledge-graph/ontology-triples.html` `.kg.wide, .ladder`: 폭 선언에서 `vw`를 뺀다.
- 문서: `kit/API.md` 원칙에 vw 규칙 한 문장. `kit/api/internals.md`: `LTT.placement` 행, placement 절, ctx·측정 모드 절 갱신. `kit/api/deck-contracts.md`: figure `steps`의 widen 문장 교체, predict 배율 문장 갱신. `kit/CHANGELOG.md` 0.2.0에 줄 추가(version 0.2.0 유지).
- kit CSS 변경은 허용하지만(사용자 답변 2) 계획에는 없다. 페이지 CSS만으로 두 크기에서 배치가 거의 같음을 확인했다(ledger 0).
- 종료(main): `npm run audit:baseline`(건수가 줄었을 때만), 기각 기록 2개와 `agent-docs/rejections/index.md`(승인 brief에서 확인된 뒤), refactoring-4·refactoring-5 handoff 종료(ledger 한 줄, index → stale.md, 파일 → stale/), overview hero Open Question을 refactoring-8 handoff로 이동.

Out of scope: 새 작가 API, 새 kit 스크립트 파일, `auditScene` 임계값, 폰 분기(ADR dbd5ddb9b247aa15), 안 B(단계 프레임 겹쳐 쌓기), `LTT.later`, overview hero 판정 수정, refactoring-8의 갤러리 경고 수정, refactoring-6(CSS 분리), `SKILL.md` 수정, cache-ttl `.ans-row .ltt-units`(predict 정답 그림)와 scenes.html 인라인 `min(8px,1vw)`(간격 눈금), 릴리스·커밋.

# Paths
Implementation: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/internals.md, skills/learn-to-tell/kit/api/deck-contracts.md, skills/learn-to-tell/kit/CHANGELOG.md, site/gallery/network/tls13-quic.html, site/gallery/knowledge-graph/ontology-triples.html
Tests: tests/placement.test.mjs (새 파일), tests/api-docs.test.mjs, tests/scene-types.test.mjs, tests/release-docs.test.mjs, tests/gallery.test.mjs, tests/gallery-audit.baseline.json (test-implementer는 고치지 않는다. main만 `npm run audit:baseline`으로 갱신)
Test command: npm test
Review evidence: R-1 A 단계 갤러리 불변(DOM·audit·lint·baseline), R-2 CDP 하네스(공개 안정성·진입 배율·resize·오류 fixture·진입 시간), R-3 핸들러 잔여 측정 코드 grep, R-4 공개 이름 대조, R-5 B·E 단계 스크린샷 장면별 대조, R-6 문서 문장 대조. 산출물은 `agent-docs/spec-logs/74cb05d7da21907e-*`와 이 spec의 Execution ledger.
Fuzzing: property-based random testing. 도구: node 스크립트 `agent-docs/spec-logs/74cb05d7da21907e-zoomlock-fuzz.mjs`(main 작성·실행, npm test 밖). 표면: `LTT.placement.zoomLock(question, zs)`(6개 kit 파일을 vm에 불러 얻음). oracle: 아래 Signatures 정의를 독립 구현한 참조 모델; 성질: 유효 입력이면 기준 커밋 계산 `Math.min(question, ...zs)`과 같다, 입력 배열이 바뀌지 않는다. seed 20261019(mulberry32). budget 100,000 입력(그중 10%는 잘못된 입력 분할). 위반 0, 잘못된 입력 분할 ≥ 1,000.
Mutation tool: none — JS 변이 도구(Stryker)가 설치되어 있지 않고(`npx --no-install stryker --version` 실패), 전역 설치는 금지다. 대신 hand mutation HM-1..HM-12.

# Signatures
`LTT.placement` (ltt-deck.js가 정의, 공개 이름): `{ zoomLock }`. 다른 속성은 없다.

`LTT.placement.zoomLock(question, zs) → number` (순수 함수, DOM·전역을 읽지 않고 인자를 바꾸지 않는다):
- `question`: 질문 상태(정답 숨김)를 상한 1에서 맞춘 배율.
- `zs`: 공개 상태(정답을 흐름 안에 둔 상태) 하나당 상한 1에서 맞춘 배율의 배열.
- 반환: `Math.min(question, ...zs)`. `zs`가 빈 배열이면 `question`.
- 잘못된 입력이면 1을 돌려준다(기준 커밋에서 측정이 실패했을 때의 배율과 같다). 잘못된 입력: `question`이 유한수가 아니거나 0 이하이거나 1 초과; `zs`가 배열이 아님; 어떤 원소가 number가 아니거나 유한수가 아니거나 0 이하이거나 1 초과.

내부 `placement` (공개 이름 아님, ltt-deck.js 지역). 이름과 세부 시그니처는 구현이 정하되 아래 책임을 한 곳에서 진다. 핸들러가 넘기는 것:
- figure `steps`: 단계 수와 `draw(k)`(= `x.enter(k, api, 1)`), 그림 상자 `pic`, 자막 칸 `ctl`, 행 `row`.
- predict: 선택지 목록(`unsure` 포함), 선택지별 정답 그리기(`answerVisual`), 정답 패널 `ans`, host `w`, 공개 상태 여부와 고른 값. 측정은 버튼 표시(`aria-pressed`·`.right`·`.wrong`)를 바꾸지 않는다(v4 FR-5).
- summary recall: 답 요소. 예약(숨김, 자리 유지)과 해제(보이기)는 placement가 한다.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | 측정 책임(Scope 첫 항목)이 `placement` 한 곳에 있다. `RENDERS.figure`·`RENDERS.predict`·`recallList` 본문에 `LTT.measure`, `dk-still`, `dk-probe`, `pending`, `innerWidth`, `getBoundingClientRect`, `solidRects`, `offsetHeight`, `probe`·`measureAll`·`under`·`eachStep`·`lockZoom`·`widen`·`unwiden`·`tallest` 식별자가 없다 | must | 사용자 결정 A |
| FR-2 | A 단계(phase 1 = FR-1 + FR-3 + FR-4)에서 갤러리 13편 × 1440×900·1280×800의 `?audit` DOM(정규화, 반복 덤프 규칙), `#ltt-audit`의 `audit`·`lint` 배열이 기준 커밋과 같고 `tests/gallery-audit.baseline.json`은 바이트 단위로 같다 | must | 사용자 결정 A |
| FR-3 | `LTT.placement`는 `zoomLock` 하나만 가진 공개 이름이다(Signatures). 공개 이름은 기준 74개 + `placement` = 75개 | must | 사용자 답변 1 |
| FR-4 | 공개 상태 재측정: predict의 `place`가 불릴 때 창 크기 키가 지난 측정과 다르면, 공개 여부와 관계없이 질문 상태와 선택지별 공개 상태를 다시 재어 `ctx.zmax`를 정한다. 공개 상태였다면 측정 뒤 원래 모습으로 되돌린다: `done`, 정답 패널 보임, 고른 선택지의 `aria-pressed=true`·`.right`·`.wrong` 표시, 고른 값으로 다시 그린 `answerVisual`. 이어서 새 `zmax`로 띄우기를 다시 시도한다. 재측정에서는 `s.reveal`과 `LTT.record`를 부르지 않는다. 창 크기 변경(120ms 디바운스)과 크기가 바뀐 뒤 다시 들어온 장면 모두에 적용한다 | must | 사용자 결정 D |
| FR-5 | 띄우기를 고려한 배율(안 C)은 구현하지 않는다. 보이는 상태 재측정(ledger 4)에서 갤러리 predict 24경우 중 띄우기 고려로 진입 배율이 오르는 사례가 0이었다(최대 차이 0). predict 잠금은 기준 커밋과 같은 상태(질문 상태, 선택지별 정답을 흐름 안에 둔 상태)만 재고, 측정 때문에 버튼 표시나 장면 `section`의 style을 바꾸지 않는다 | must | 사용자 답변 IM-1(v4) |
| FR-6 | 공개 안정성: 갤러리의 모든 predict 장면 × 두 크기 × 모든 선택지에서 선택지를 고르고 공개하면 장면 배율이 공개 전과 같다(\|Δ\| ≤ 0.001) | must | ADR 40552, FR-5 위험 |
| FR-7 | B 페이지: tls13-quic `.seqwrap`, ontology-triples `.kg.wide, .ladder`의 폭 선언에 `vw`가 없다. 갤러리 페이지 `<style>` 안 `width`·`min-width`·`max-width` 선언 중 `vw`를 쓰는 것은 허용 목록(cache-ttl `.ans-row .ltt-units`, predict 정답 그림)뿐이다 | must | 사용자 결정 B |
| FR-8 | `widen`·`unwiden`과 그 호출, 관련 상태(`grown`)를 지운다. 조건: phase 2 전체를 적용한 트리에서 모든 페이지·크기의 audit 건수 ≤ 기준선(`tests/gallery-audit.baseline.json`). 조건이 깨지면 `widen`을 남기고 ledger에 이유를 적는다(그 경우 FR-1의 `widen`·`unwiden` 금지는 placement 안으로 옮기는 것으로 바뀐다) | must | 사용자 결정 B |
| FR-9 | 문서. `kit/API.md` "원칙"에 vw 규칙 한 문장. `internals.md`: 표에 `LTT.placement` 행, placement 절(핸들러는 상태 열거자를 넘기고 placement가 측정한다), 측정 모드 절 갱신(predict `answerVisual`은 공개 뒤에도 창 크기가 바뀌면 다시 불린다), ctx 표의 `zmax`·`place` 문장이 코드와 맞음. `deck-contracts.md`: figure `steps`의 "칸 폭까지 넓힌다" 문장을 vw 규칙으로 바꾼다. predict 배율 문장에 "공개 뒤 창 크기가 바뀌면 다시 잰다"를 더한다(띄울 수 있는 정답에 관한 문장은 넣지 않는다). `CHANGELOG.md` `## 0.2.0`에 작가 계약 줄(vw 규칙, 공개 상태 resize, widen 제거)과 kit 개발자 줄(`LTT.placement`, 측정 모듈 분리) | must | 사용자 결정 B·H, IM-1(v4) |
| FR-10 | phase 2 뒤 모든 페이지·크기에서 audit 건수 ≤ 기준선, lint 0, expect 실패 0. 건수가 줄면 main이 `npm run audit:baseline` | must | 사용자 결정 B |
| FR-11 | 진입 배율 불변: phase 2 뒤 모든 predict 장면 × 두 크기의 진입 zoom이 기준 커밋과 같다(\|Δ\| ≤ 0.001) | must | 사용자 답변 IM-1(v4) |

# Errors
- E-1: 배율 잠금 중(진입 또는 공개 상태 재측정) `answerVisual`이 throw한다.
  - signal: 기준 커밋과 같은 `LTT.warn`("장면 n: answerVisual을 미리 그려 보다 실패해 정답을 열 때 배율이 바뀔 수 있다 (msg)").
  - post-failure state: `ctx.zmax = 1`. 장면은 측정 전 모습(질문 상태, 또는 고른 답으로 다시 그린 공개 상태)으로 돌아가고 `.dk-still`이 빠진다.
- E-2: figure 단계 미리 그리기 중 `enter`가 throw한다.
  - signal: 기준 커밋과 같은 `LTT.warn`("장면 n: 단계를 미리 그려 보다 실패해 단계마다 배율이 바뀔 수 있다 (msg)").
  - post-failure state: 최대 높이를 0으로 둔다. 비행 중 `.pk`를 지우고, 현재 단계를 측정 모드 밖에서 다시 그리고, `.dk-still`을 뺀다.
- E-3: `zoomLock`에 잘못된 입력 — throw하지 않고 1을 돌려준다.
- E-4: 측정 중 throw한 뒤에도 다음 크기 키 변경에서 다시 측정한다(키는 측정을 시작할 때 기록하고 throw가 그것을 되돌리지 않는다. 기준 커밋과 같다).

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | `zoomLock(0.95, [0.9, 0.97])` | 0.9 |
| C-2 | normal | `zoomLock(0.85, [0.9, 1])` | 0.85 |
| C-3 | boundary | `zoomLock(q, [])` (q = 1, 0.78), `zoomLock(1, [1])`, `zoomLock(0.9, [0.9])`, `zoomLock(0.9, [0.95])` | q, 1, 0.9, 0.9 |
| C-4 | boundary | question 0 / 1e-9 / 1 / 1.0000001 (zs `[]`); 원소 0 / 1e-9 / 1 / 1.0000001 (question 0.9) | 1 / 1e-9 / 1 / 1; 1 / 1e-9 / 0.9 / 1 |
| C-5 | error | question NaN·Infinity·"0.9"·undefined; zs null·{}·"x"; 원소 null·"0.8"·NaN·undefined(유효 원소 뒤 두 번째 자리) | 1 |
| C-6 | edge | 배열이 아닌 유사 배열 `{length: 1, 0: 0.5}`, 원소가 `{z: 0.5}` 객체(v3까지의 모양) | 1 / 1 |
| C-7 | normal | 갤러리 13편 × 2크기, phase 1 | R-1 불변 |
| C-8 | normal | phase 2, 갤러리 predict 장면 12개 × 2크기 | 진입 zoom이 기준 커밋과 같다(\|Δ\| ≤ 0.001) |
| C-9 | normal | phase 2, 갤러리 predict 장면 12개 × 2크기 × 모든 선택지 | 공개 전후 배율 같음(\|Δ\| ≤ 0.001) |
| C-10 | normal | 공개 상태 resize: predict 장면 12개 × {1440×813→1280×713, 1280×713→1440×813} × {정답 선택지, 첫 오답 선택지} | 크기를 바꾼 뒤 배율이 목표 크기에서 새로 열어 같은 선택지를 공개한 배율과 같다(\|Δ\| ≤ 0.001), 정답 패널이 보이고, 고른 버튼 표시가 그대로다 |
| C-11 | edge | 공개한 장면에서 다른 장면으로 갔다가 창 크기를 바꾼 뒤 돌아온다 | C-10과 같은 기대 |
| C-12 | error | R-2 fixture: 선택지 하나에서 throw하는 `answerVisual` predict, 한 단계에서 throw하는 figure `steps` | E-1·E-2의 warn 한 번 이상, 배율 1(predict), 장면이 원래 모습, 페이지 오류로 덱이 멈추지 않음 |
| C-13 | edge | 공개 상태에서 크기를 바꾸며 재측정할 때 `answerVisual`이 throw(fixture) | E-1 warn, zmax 1, 공개 상태 유지 |
| C-14 | boundary | phase 2 audit 26회 | 각 건수 ≤ 기준선 |
| C-15 | normal | B 페이지 두 편 × 2크기 | `vw` 없는 폭 선언, R-5 장면별 판정 "나빠짐" 0 |
| C-16 | edge | 인자 하나짜리 `answerVisual` predict. 표면: R-2 fixture 3장면(갤러리 6편에도 인자 하나짜리가 있지만 페이지를 고치지 않고는 호출 수를 셀 수 없다; fixture는 같은 kit 경로 `answerVisual.length > 1` 판정을 탄다) | 공개 전 상태에서 크기 키가 한 번 바뀔 때 `answerVisual` 호출 1회 |
| C-17 | edge | R-2 fixture 4장면: figure `steps` 높이 100·150·300px, 마지막 단계가 가장 높다(갤러리에는 마지막 단계만 가장 높은 장면이 없어 HM-6이 R-1을 통과했다) | 0단계를 보는 동안 그림 상자 `min-height` ≥ 300px |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 배율 계산, resize 재측정, audit 결과의 정확성 |
| Performance efficiency | yes | 측정을 placement로 옮기며 진입 시 미리 그리기 경로가 바뀐다. 안 C(v4에서 제외)를 넣었다면 선택지마다 빈자리 찾기가 더해졌을 것이고, 제외 뒤에도 기준 대비 진입 시간을 본다 |
| Compatibility | yes | 기존 수업이 같은 화면을 내고(A 단계), 공개 이름이 하나만 늘어난다 |
| Interaction capability | yes | 공개·resize에서 배율이 흔들리지 않고 맞는 크기로 보인다(학습자 체감) |
| Reliability | no | 새 실패 경로는 작가 코드 throw뿐이고 Errors(E-1..E-4)로 다룬다 |
| Security | no | 입력·권한·네트워크 표면 변화 없음 |
| Maintainability | yes | 이번 작업의 목적(측정 분리, 시험 용이성) |
| Flexibility | no | 설치·이식 변화 없음 |
| Safety | no | 해당 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Compatibility / co-existence | phase 1 트리, 갤러리 13편 × 2크기 | R-1: 반복 덤프 규칙의 nomatch 파일 수, audit·lint 배열 차이 수, baseline sha256 | nomatch 0/26, 차이 0/26, sha 같음 | review R-1; automated gallery-audit; mutation HM-6, HM-7 | FR-2 |
| QR-2 | Compatibility / interoperability | 6개 kit 파일 vm 로드 `Object.keys(LTT)` | R-4: 기준 집합 B와 새 집합 N | B ⊆ N, N − B = {placement} | review R-4; automated api-docs; mutation HM-11 | FR-3 |
| QR-3 | Interaction capability / user engagement(화면 안정) | phase 2, C-9 | R-2: 공개 전후 `.dk-scene.cur .dk-in` zoom 차이, 경우 수 | \|Δ\| ≤ 0.001인 경우 = 전체 경우 | review R-2; mutation HM-9 | FR-6 |
| QR-4 | Interaction capability / user engagement | phase 2, C-10·C-11 | R-2: resize 뒤 zoom − 새로 열어 공개한 zoom | 모든 경우 \|Δ\| ≤ 0.001. 기준 커밋에서 같은 절차는 1건 이상 실패한다(판별력) | review R-2; mutation HM-4 | FR-4 |
| QR-5 | Functional suitability / functional correctness | `zoomLock` | 단위 테스트 decision table 칸 통과 수 + fuzz 위반 수 | 100%, 위반 0/100,000 | automated VO-1; fuzz; mutation HM-1..HM-3 | FR-3 |
| QR-6 | Performance efficiency / time behaviour | 1440×900, 갤러리 predict 장면 12개, 실제 시간 | R-2: 이전 장면에서 점 클릭으로 들어가는 `go(i)` 동기 실행 시간(ms), 5회 중앙값, 기준 커밋과 phase 2 | 장면마다 phase 2 ≤ 기준 + 50 ms이고 ≤ 150 ms | review R-2 | FR-5 위험 |
| QR-7 | Maintainability / modularity | `ltt-deck.js` | R-3: FR-1 목록 식별자가 `RENDERS.figure`·`RENDERS.predict`·`recallList` 본문에 나오는 수 | 0 | review R-3; mutation HM-12 | FR-1 |
| QR-8 | Functional suitability / functional appropriateness | phase 2 갤러리 audit | gallery-audit test + `audit.mjs --gallery --json` 건수 | 26회 모두 ≤ 기준선, lint 0, expect 0 | automated gallery-audit; review R-5 | FR-10 |
| QR-9 | Interaction capability / user interface aesthetics | phase 2에서 audit 크기 DOM이 바뀐 페이지 | R-5: 기준·phase 2 스크린샷(`audit.mjs --shots`, 2크기)을 장면별로 대조해 "나빠짐"으로 판정한 장면 수. 나빠짐 = 겹침·잘림, 그림이 칸 안에 있는데도 기준보다 그림 폭 5% 넘게 축소, 장면 배율 하락 0.005 초과. 칸을 넘치던 그림이 칸 폭으로 줄어든 것은 나빠짐이 아니다 | 0 | review R-5 | 사용자 답변 2, IM-2(v4) |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-3, E-3, C-1..C-6, QR-5 | `LTT.placement.zoomLock` (6개 kit 파일 vm 로드) | unit, 표의 칸 전부 | decision table + 3-value boundary value analysis | 결정 표: {zs 비었음, 최소가 question, 최소가 첫 원소, 최소가 마지막 원소, 최소가 question과 원소에 같이} 5칸; BVA: question 0 / 1e-9 / 1 / 1+1e-7, 원소 같은 4점; 잘못된 입력 분할 C-5의 11개 값; C-6 2개; 인자 불변(호출 뒤 zs 배열 내용 같음) | 100% | 반환값이 Signatures 정의와 같다(손으로 쓴 기대값) | `tests/placement.test.mjs` |
| VO-2 | FR-3, QR-2 | `LTT.placement` 표면 | unit | equivalence partitioning | `Object.keys(LTT.placement)` = `["zoomLock"]`; `typeof zoomLock === "function"`; `document` 없는 vm에서 호출 가능; 공개 이름 75개(BASE_DEFINITIONS 갱신) | 100% | 위와 같다 | `tests/placement.test.mjs`, `tests/api-docs.test.mjs`, `tests/scene-types.test.mjs`(기존 공개 이름 집합 단언: 73 + sceneTypes + placement) |
| VO-3 | FR-9 | 문서 4개 | unit (정적 문서) | syntax testing (문서 구조 토큰) | API.md "## 원칙" 절 안 `vw`와 `figure` 문장 1개; internals.md 표 첫 칸 `LTT.placement` 1회, `zoomLock`; internals.md 측정 모드 절에 `answerVisual`·창 크기·공개 뒤 다시 불림; deck-contracts.md figure 절에 "칸 폭까지 넓힌다"·`56vw` 없음, `vw` 규칙 있음, predict 절에 창 크기가 바뀌면 다시 잰다(`창 크기`+`다시`), "뜰 수 있는 정답"·"띄울 수 있는 정답" 문구가 deck-contracts.md·internals.md에 없음; CHANGELOG `## 0.2.0` 안 토큰 `vw`, `placement`, `창 크기`(또는 resize), `widen`, "뜰 수 있는 정답"·"띄울 수 있는 정답" 없음 | 100% | 토큰 존재·부재 | `tests/release-docs.test.mjs` |
| VO-4 | FR-7, C-15 | 갤러리 페이지 `<style>` | unit (정적) | equivalence partitioning | 갤러리 13편(`site/gallery/*.html`, `site/gallery/*/*.html`, catalog·index·stale 제외)의 `<style>` 블록 안 `width`/`min-width`/`max-width` 선언에 `vw` → 허용 목록 1개만; tls13 `.seqwrap`, ontology `.kg.wide, .ladder` 규칙 존재·vw 없음 | 100% | 허용 목록 밖 0 | `tests/gallery.test.mjs` |
| VO-5 | FR-2, QR-1, C-7 | phase 1 갤러리 실제 화면 | end-to-end | metamorphic testing (기준 대 phase 1) | 26 실행 × {DOM, audit, lint} + baseline sha | 100% | 차이 0 | R-1 (main): 기준 트리(`git archive b3d5ba5`) 덤프 5회와 phase 1 트리 덤프 3회(`0041d668222ce019-dom-dump.mjs`), `0041d668222ce019-dom-match.sh` → `nomatch=0`; `audit.mjs --gallery --json` 기준(`74cb05d7da21907e-base-audit.json`)과 deep-equal; sha256 |
| VO-6 | FR-5, FR-6, FR-11, QR-3, C-8, C-9 | phase 2 갤러리 실제 화면 | end-to-end, 모든 predict 장면·크기·선택지 | scenario testing + metamorphic testing (기준 대 phase 2 진입 배율) | C-9 경우 전부(장면 12 × 크기 2 × 선택지 수); 진입 zoom 24개(기준 대 phase 2) (C-16은 v5에서 VO-8 fixture로) | 100% | 공개 전후 \|Δ\| ≤ 0.001; 진입 zoom \|Δ\| ≤ 0.001(기준 대비) | R-2 (main): `74cb05d7da21907e-cdp-review.mjs reveal` (CDP, 기기 지표 1440×813·1280×713) |
| VO-7 | FR-4, FR-5, QR-4, C-10, C-11 | 공개 상태 resize | end-to-end | scenario testing | C-10 48경우 + C-11 경우 12 × 1방향 | 100% | phase 2 모두 통과, 기준 커밋 1건 이상 실패. `ok` = zoom \|Δ\| ≤ 0.001, 정답 패널 보임, `done`, `.dk-still` 없음, 버튼 표시·정답 글·`.dk-avis` 노드 수·`float` 여부가 새로 연 것과 같음. reenter가 아닌 경우 크기를 바꾸는 동안 `LTT.record` 0회, 선택지 버튼의 `class`·`aria-pressed`와 장면 `section`의 `style`·`class` 속성 변경(MutationObserver, 바꿨다 되돌린 것 포함) 0회 | R-2 (main): `74cb05d7da21907e-cdp-review.mjs resize`를 기준 트리와 phase 1·phase 2 트리에서 |
| VO-8 | E-1, E-2, E-4, FR-2, C-12, C-13, C-16, C-17 | fixture 페이지 | end-to-end | error guessing | EG-1 진입 측정 중 answerVisual throw: 진입 zoom 1(fixture의 성공한 선택지만으로 잠그면 1 미만), warn 문구가 기준과 글자 단위로 같음, 버튼 표시 없음; EG-2 공개 상태 재측정 중 throw: 고른 버튼 표시·정답 패널 보임 유지; EG-3 단계 enter throw: warn 문구가 기준과 같음, 그림 상자 `min-height`가 실패 전까지 잰 최댓값(320px)이 아님, 현재 단계("단계 0")를 다시 그림, `.pk` 0, `.dk-still` 없음; EG-4 throw 뒤 다음 크기 변경에서 다시 측정; EG-5 공개 상태 재측정에서 `s.reveal` 0회(같은 카운터가 실제 공개에서 1회를 세는 것도 기록); C-16 호출 1회; C-17 `min-height` ≥ 300px | none — experience-based | 위 항목 전부 | R-2 (main): `74cb05d7da21907e-cdp-review.mjs errors` + `74cb05d7da21907e-error-fixture.html` |
| VO-9 | FR-8, FR-10, QR-8, C-14 | phase 2 갤러리 audit | end-to-end | equivalence partitioning | 26 실행 | 100% | 건수 ≤ 기준선, lint 0, expect 0 | automated `tests/gallery-audit.test.mjs`; main `audit.mjs --gallery --json` 기록 |
| VO-10 | FR-7, FR-8, QR-9, C-15 | phase 2에서 DOM이 바뀐 페이지 | end-to-end review, DOM이 바뀐 페이지의 모든 장면 | metamorphic testing (기준 대 phase 2 화면) | 페이지 목록(R-1 방식 nomatch 파일) × 장면 × 2크기 | 100% | QR-9의 "나빠짐" 0 | R-5 (main): `audit.mjs <페이지> --size 1440x900 --size 1280x800 --shots`를 기준·phase 2 트리에서; 장면별 판정표 `74cb05d7da21907e-r5-shots-review.md` |
| VO-11 | FR-1, FR-5, FR-8, QR-7 | `ltt-deck.js` 소스 | review | error guessing | FR-1 식별자 목록 × 세 핸들러 본문; 파일 전체 `widen`·`unwiden`·`grown` 수; `placement.predict` 본문의 버튼 표시·장면 style 쓰기(`aria-pressed`, `right`, `wrong`, `.el.style`, `setAttribute`/`removeAttribute`의 `style`) 수; 각 본문 줄 수 | none — experience-based | 모두 0(줄 수는 본문이 잘리지 않았음을 보이는 기록) | R-3 (main): `74cb05d7da21907e-r3-grep.mjs` 출력을 ledger에 |
| VO-12 | FR-3, QR-2 | 공개 이름 | review | equivalence partitioning | B와 N | 100% | N − B = {placement}, B − N = ∅ | R-4 (main): 기준·작업 트리 파일을 각각 vm에 불러 `Object.keys(LTT)` 비교 |
| VO-13 | QR-6 | 진입 시간 | review | equivalence partitioning | predict 장면 12개 | 100% | QR-6 기준 | R-2 (main): `74cb05d7da21907e-cdp-review.mjs timing`을 기준·phase 2 트리에서 |
| VO-14 | FR-3, QR-5 | `zoomLock` 입력 공간 | unit (main 실행) | random testing (property) | 100,000 입력 | 예산 완주 | 위반 0, 잘못된 입력 분할 ≥ 1,000. 성질: 참조 모델과 같음, 유효 입력이면 `Math.min(question, ...zs)`, 입력 불변 | fuzz 스크립트 결과를 ledger에 |
| VO-15 | FR-9 | internals.md·deck-contracts.md·CHANGELOG·API.md의 새·바뀐 문장과 internals.md ctx 표의 `zmax`·`place`·`refit`·`float` 문장 | review | error guessing | 문장마다 코드 줄 대조 | none — experience-based | 맞는 문장 수 / 전체 = 100% | R-6 (main): 대조표 `74cb05d7da21907e-r6-doc-review.md` |

hand mutation (main이 하나씩: `seed.py backup` → 주입 → `npm test` 또는 지정 절차 → `seed.py restore`). 강한 결함 부류를 고른 이유: 배율 계산·공개 상태 복구·측정 누락이 화면 흔들림을 직접 만드는 결함이다.
- HM-1 `zoomLock`이 마지막 원소를 빼고 최솟값을 냄 → VO-1 실패.
- HM-2 `zoomLock`이 `question`을 최솟값에서 뺌 → VO-1.
- HM-3 잘못된 입력에 `question` 반환 → VO-1 C-5.
- HM-4 predict `place`가 공개 상태면 재측정을 건너뜀(기준 버그) → R-2 resize.
- HM-5 공개 상태 재측정 뒤 고른 값으로 `answerVisual`을 다시 그리지 않음 → R-2 resize(정답 글이 새로 연 것과 다름).
- HM-6 figure 미리 그리기가 마지막 단계를 건너뜀 → R-1 DOM 차이 또는 gallery-audit.
- HM-7 미리 그리기에서 `.dk-still`을 붙이지 않음 → R-1(visual-hierarchy-spacing 4장면, 알려진 경우).
- HM-8 tls13 `.seqwrap`을 `56vw`로 되돌림 → VO-4.
- HM-9 공개 상태 재측정 뒤 `done`을 되돌리지 않음 → R-2 resize.
- HM-10 API.md vw 문장 삭제 → VO-3.
- HM-11 `LTT.placement`에 비순수 함수 하나 추가 → VO-2.
- HM-12 summary 답 예약 해제가 placement 밖 `classList.remove("pending")`로 되돌아감 → R-3.

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| AD-1 | `LTT.placement = {zoomLock}`. 순수 함수만 노출하고 internals.md에 한 줄, BASE_DEFINITIONS 74 → 75 | 이해 라운드 질문 1 | user answer |
| AD-2 | kit CSS 변경 허용. 판정은 audit 건수 ≤ 기준선, DOM 불변은 A 단계만, B·E에서 DOM이 바뀐 페이지는 두 크기 스크린샷 장면별 대조(R-5) | 이해 라운드 질문 2 | user answer |
| AD-3 | E 실제 사례 경계 0.02. 경계 미만도 장면별 차이를 기록 | 이해 라운드 질문 3. 첫 측정(`74cb05d7da21907e-e-measure-1440-1280.json`, 실제 사례 8)은 숨은 장면을 잰 오류였다(ledger 4). 보이는 상태 재측정 `74cb05d7da21907e-e-remeasure-visible.json`: 실제 사례 0, 최대 차이 0 | user answer |
| AD-4 | 안 C는 구현하지 않고 refactoring-5 3번을 측정 근거로 닫는다. `zoomLock`은 `(question, zs)`로 줄여 쓰지 않는 계약을 남기지 않는다. 문서·CHANGELOG의 "띄울 수 있는 정답은 배율을 줄이지 않음" 문장을 뺀다. refactoring-5 handoff ledger에 첫 측정 오류와 재측정을 한 줄로, Failed Attempts에 "숨은 장면에서 잰 첫 측정 → 사례 8개로 오판" 행을 더한다 | ledger 4 | [intent-mismatch] user answer IM-1(v4): 안 C 걷어 냄, (a) `zoomLock(question, zs)` |
| AD-5 | `widen` 제거. 측정: 1440×900·1280×800·1000×800·1100×900·1180×800·900×800·820×900에서는 한 번도 작동하지 않고, 창 폭 760(폰 분기 직전)에서 vw 고정 4장면(tls13 4·8·12, ontology 12)에만 작동했다(`74cb05d7da21907e-widen-sizes.json`). 그래서 audit 크기 결과는 바뀌지 않는다. 폭 760에서는 페이지 vw를 뺀 tls13 4장면이 칸 폭을 다 써서 장면이 약간 줄어든다(실험 V1 스크린샷). 760–1279는 ADR dbd5가 보장하지 않는 범위다 | 사용자 결정 B의 판정 규칙 | brief v1 — approved (폭 760 영향은 ADR dbd5ddb9 보장 범위 밖이라 수용) |
| AD-6 | B 페이지 수정은 페이지 CSS만으로 한다: `.seqwrap{width:800px;max-width:100%}`, `.kg.wide,.ladder{width:880px;max-width:100%}`. ontology 10·12 1280 그림 폭 −5.9%(기준 768px이 칸 723px을 넘쳤고 칸 폭으로 줄어듦)와 tls13 4 1280 배율 0.8939→0.8899(−0.004)는 나빠짐이 아니다 | ledger 5 | [intent-mismatch] user answer IM-2(v4) |
| AD-8 | 인자 하나짜리·HTML `answerVisual`은 측정 한 번에 한 번만 그린다(작가 문서의 호출 횟수 유지) | deck-contracts.md 기존 문장 | brief v1 — approved |
| AD-9 | 공개 상태 재측정은 고른 값으로 `answerVisual`을 다시 그리고 `s.reveal`·`LTT.record`는 부르지 않는다. 작가 계약에 "공개 뒤에도 창 크기가 바뀌면 다시 불린다"를 더한다 | `answerVisual`은 이미 순수·동기·멱등 계약 | brief v1 — approved |
| AD-10 | 구현은 두 단계: phase 1(A + D + `zoomLock`) → main R-1 → phase 2(B + widen 제거 + 문서; E는 v4에서 제외) | A 불변 증거를 B·E 변경과 섞지 않는다 | brief v1 — approved |
| AD-11 | `SKILL.md`는 바꾸지 않는다. vw 규칙은 작가가 매 수업 읽는 `kit/API.md` "원칙"에 둔다 | SKILL.md §3 "kit"이 규칙을 API.md로 보냄 | brief v1 — approved |
| AD-12 | vw 허용 목록: cache-ttl `.ans-row .ltt-units`(predict 정답 그림). scenes.html의 인라인 `min(8px,1vw)`는 간격 값을 보이는 눈금이라 `<style>` 검사 대상 밖 | 규칙 문구가 "figure 그림 폭" | brief v1 — approved |
| AD-13 | R-2는 CDP(Chrome DevTools Protocol) 하네스로 main이 실행하고 npm test에 넣지 않는다(실제 시간 대기라 부하에 흔들림) | 2026-10-19 시험: `Emulation.setDeviceMetricsOverride`로 크기를 바꾸면 덱 resize가 돌고, 기준 커밋에서 공개 상태 zoom이 옛 값에서 출발함을 관찰 | brief v1 — approved |
| AD-14 | QR-6 임계값: 장면마다 기준 + 50 ms 이하, 150 ms 이하(1440×900, 5회 중앙값) | 100 ms 안팎이 체감 지연 경계라는 일반 기준. 이 기계 기준 측정 전 | brief v1 — approved |
| AD-15 | fuzz는 기준 커밋과의 차분 대신 참조 모델 property 검사(기준 커밋에는 같은 순수 함수가 없다). 유효 입력이면 기준 계산 `Math.min(question, ...zs)`과 같음을 성질로 포함 | — | brief v1 — approved |
| AD-16 | 기각 기록 2개(안 B, `LTT.later`)를 사용자 문구대로 쓰고 Chosen Instead는 ADR 40552 / `kit/api/deck-contracts.md` | 사용자 결정 F | brief v1 — approved (초안 (a)·(b) 그대로, index 블록 포함) |
| AD-17 | refactoring-4 6번은 완료로 표시(`server/audit.mjs` + 기준선 테스트). overview hero 질문은 refactoring-8 Open Questions로 옮긴다 | 사용자 결정 C·G | user answer |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | — | VO-11 | R-3 |
| FR-2 | C-7 | VO-5 | R-1 |
| FR-3 | C-1..C-6 | VO-1, VO-2, VO-12, VO-14 | placement.test, api-docs.test, R-4, fuzz |
| FR-4 | C-10, C-11, C-13 | VO-7, VO-8 | R-2 |
| FR-5 | C-8, C-16 | VO-6, VO-11 | R-2, R-3(흉내·style 변경 코드 없음) |
| FR-6 | C-9 | VO-6 | R-2 |
| FR-7 | C-15 | VO-4, VO-10 | gallery.test, R-5 |
| FR-8 | C-14 | VO-9, VO-10, VO-11 | gallery-audit, R-5, R-3 |
| FR-9 | — | VO-3, VO-15 | release-docs.test, R-6 |
| FR-10 | C-14 | VO-9 | gallery-audit + audit JSON |
| FR-11 | C-8 | VO-6 | R-2 |
| E-1..E-4 | C-12, C-13 | VO-8 | R-2 errors |
| QR-1 | C-7 | VO-5 | R-1 |
| QR-2 | — | VO-2, VO-12 | api-docs, R-4 |
| QR-3 | C-9 | VO-6 | R-2 |
| QR-4 | C-10, C-11 | VO-7 | R-2 |
| QR-5 | C-1..C-6 | VO-1, VO-14 | placement.test, fuzz |
| QR-6 | — | VO-13 | R-2 timing |
| QR-7 | — | VO-11 | R-3 |
| QR-8 | C-14 | VO-9 | gallery-audit |
| QR-9 | C-15 | VO-10 | R-5 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 4 |
| verifier invocations | 2 |
| open finding ids | TV-6 (VO-8, blocking evidence gap) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 5 | tests/placement.test.mjs VO-1 (verifier 1 승인) | accepted | HM-1·HM-2·HM-3 탐지 | v5 변경 없음 |
| VO-2 | 5 | placement/api-docs/scene-types (verifier 1 승인) | accepted | HM-11 탐지 | v5 변경 없음 |
| VO-3 | 5 | tests/release-docs.test.mjs VO-3 + batch 4 `다시` | accepted (verifier 2) | HM-10 탐지 | TV-1로 테스트 바뀜 |
| VO-4 | 5 | tests/gallery.test.mjs VO-4 (verifier 1 승인) | accepted | HM-8 탐지 | 변경 없음 |
| VO-5 | 5 | R-1 ledger 3 + 최종 `74cb05d7da21907e-r1-r4-record.md` (verifier 1 승인) | accepted | HM-7 탐지; HM-6은 R-1로 볼 수 없어 C-17로 옮김 | 변경 없음 |
| VO-6 | 5 | R-2 reveal p2·base (verifier 1: C-16 표면 미결) | accepted (verifier 2) | — | TV-3로 C-16 표면이 v5에서 fixture로 정해짐(VO-8에서 관찰) |
| VO-7 | 5 | R-2 resize v5 harness `-r2-p2-resize.json`(MutationObserver, float·노드 수) | accepted (verifier 2) | HM-4·HM-5·HM-9·HM-16 탐지 | harness 판정이 바뀜 |
| VO-8 | 5 | R-2 errors v5 `-r2-p2-errors.json`, fixture v5 | open (TV-6) | HM-6b·HM-13·HM-14·HM-15 탐지 | TV-2로 fixture·판정이 바뀜 |
| VO-9 | 5 | gallery-audit + p2-audit (verifier 1 승인) | accepted | — | 변경 없음 |
| VO-10 | 5 | R-5 (verifier 1 승인; A-6 수치 보강) | accepted | — | 판정 불변 |
| VO-11 | 5 | R-3 v5 `74cb05d7da21907e-r3-grep.mjs`(leftovers·placementPredict) | accepted (verifier 2) | HM-12 탐지, 변이 사본 2건 민감도 확인 | TV-4로 범위 늘어남 |
| VO-12 | 5 | R-4 `74cb05d7da21907e-r1-r4-record.md` (verifier 1 승인) | accepted | — | 변경 없음 |
| VO-13 | 5 | R-2 timing (verifier 1 승인) | accepted | — | 변경 없음 |
| VO-14 | 5 | fuzz (verifier 1 승인) | accepted | — | 변경 없음 |
| VO-15 | 5 | R-6 v5(24행) | accepted (verifier 2) | — | TV-5로 3행 추가 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 0 | 착수 전 측정 (E 사례 조사, widen 동작 조사, B 실험) | — | 기준 커밋 사본에 `74cb05d7da21907e-measure-patch.py` 계측(원래 경로 불변: 계측 사본 audit 건수 = 기준선 26/26) → `74cb05d7da21907e-dom-dump.mjs` 덤프 → `74cb05d7da21907e-measure-report.mjs`. headless 가상 시간이라 계측의 `ms`는 0(시간 측정 불가, QR-6은 R-2 실제 시간으로) | E: predict 24경우 중 실제 사례(차이 > 0.02) 8: 1280×800 diversification 4(0.8827→1), ontology 11(0.9197→1), matrix 6(0.8422→1), tls13 3(0.9474→1)·10(0.9003→1), retrieval 5(0.976→1), color-contrast 6(0.9335→1); 1440×900 matrix 6(0.9309→1). 경계 미만: single-gpu 5 1280(0.0165), cache-ttl 4 1440(0.0068). 모든 선택지가 질문 배율에서 뜸(cache-ttl 4 1280은 질문 상태부터 0.78). 결과 `74cb05d7da21907e-e-measure-1440-1280.json`. widen: audit 두 크기와 1000·1100·1180·900·820 폭에서 작동 0, 760×900에서 tls13 4·8·12, ontology 12만 작동(`74cb05d7da21907e-widen-sizes.json`). B 실험 V1(페이지 CSS `width:820px;max-width:100%`/`880px`): tls13·ontology 두 크기 audit 건수 같음, 760에서 tls13 4장면 축소(scratchpad 스크린샷) |
| 1 | 기준 측정 | — | 기준 커밋 b3d5ba5: `audit.mjs --gallery --json` 26회 오류 0, audit 42건 → `74cb05d7da21907e-base-audit.json`. 기준 DOM 덤프 5회(git archive), dom-base-1 대비 diffs 0·1·1·0. baseline sha256 a40956c2…5c5e. R-2 기준: reveal 110경우 bad 0(`74cb05d7da21907e-r2-base-reveal.json`), resize 60경우 bad 18(모두 1280×713→1440×813, 옛 zmax에 묶임, `-r2-base-resize.json`), errors EG2 warnsBefore = warnsAfter(공개 상태 재측정 없음, `-r2-base-errors.json`) | 기준선 확보, R-2 resize가 기준 버그를 판별함 |
| 2 | test-implementer 첫 보고: challenge 6건 | 개수 오기 2, 관찰 틈 2(FR-4 record·reveal 미관찰, 폰트 키), 범위 2 | spec v2: 개수 정정, R-2에 `LTT.record` 카운트(resize)·EG-5(`s.reveal` 카운트)·EG-2 표시 확인, fuzz에 입력 불변·모두 floats 성질 추가. 폰트 키는 R-3 코드 확인, custom-property vw는 advisory A-1 | 반영 |
| 3 | phase 1 첫 npm test: 832 중 818 pass, 14 fail | 13건은 phase 2 문서·갤러리 의무(예상), 1건 `tests/scene-types.test.mjs` "public names are the 73 base names plus sceneTypes"(정확한 집합 단언, test defect) | spec v3: Tests 경로에 scene-types.test.mjs 추가, correction batch 1로 test-implementer에 전달. phase 1 R-1(main): 작업 트리 덤프 3회 `nomatch=0`(26파일), audit·lint 배열 차이 0/26, baseline sha 같음 | VO-5 증거 확보, phase 2 dispatch |
| 4 | [intent-mismatch] implementer phase 2 보고: FR-11/C-8 "8개 사례 +0.02 초과" 0/8, challenge "ledger 0 측정이 숨긴 장면을 쟀다" | verified: ledger 0 계측은 `?audit`이 모든 장면을 `visibility:hidden`으로 mount한 상태에서 float을 쟀고, `solidRects`가 숨은 상자를 빼므로 `freeSlot`이 늘 성공했다. 기준 R-2 reveal에서도 8개 사례의 실제 공개는 모두 `float:false` | main 재측정: 계측 v2(`measure-patch.py --visible-only`, 현재 장면만 잼) + `74cb05d7da21907e-e-remeasure.mjs`(`?audit#<장면>`, 1440×900·1280×800) → `74cb05d7da21907e-e-remeasure-visible.json`: 24경우 실제 사례 0, 최대 차이 0. 질문 배율에서 뜨는 장면은 zmax가 이미 1인 ontology 21(1440)·projectile 4(1440)·scenes 9(두 크기)뿐 | AD-3·AD-4의 근거가 무너짐. 사용자 규칙(사례가 없으면 구현하지 않음)에 따른 재브리프 필요, phase 2 결과 보류 |
| 5 | implementer phase 2 보고: R-5 기준 "그림 폭 5% 넘게 축소·배율 하락"과 충돌 | verified(스크린샷): ontology 10·12 1280에서 기준 그림(60vw=768px)은 칸(723px)을 45px 넘겨 자막 칸 쪽 간격으로 나가 있었다. vw 없이 칸 안에 두면 −5.9%. tls13 4 1280은 칸 폭이 기준 그림보다 커서 px 값으로는 zoom 0.8939→0.8899(−0.004)를 피할 수 없다 | 구현 값 `.seqwrap{width:800px;max-width:100%}`, `.kg.wide,.ladder{width:880px;max-width:100%}`; audit 26/26 기준과 같음 | 재브리프 필요(R-5 판정 기준) |
| 6 | correction batch 2 (v4): 안 C 제거, `zoomLock(question, zs)`, 문서에서 띄우기 문장 제거, VO-1·VO-3 테스트 재작성 | — | implementer: phase 1 predict 잠금으로 되돌림(버튼 흉내·float 판정·숨은 장면 style 처리 제거). test-implementer: VO-1 v4 표, VO-3 부재 검사("뜰/띄울 수 있는 정답", deck-contracts·internals·CHANGELOG) | npm test 832 중 831 pass, 1 fail: 기존 api-docs "VO-3 FR-3 QR-P1: real kit/API.md is at most 8,500 code points"(8,540) |
| 7 | correction batch 3: ID-1 API.md 크기 예산 초과(implementation defect, 기존 프로젝트 제약이 spec에 없었음) | vw 규칙 문장 85자가 예산 8,500을 넘김(기준 8,455) | implementer가 문장을 `figure 그림 폭을 \`vw\`로 고정하지 않는다(kit이 칸 폭을 준다).`로 줄임(8,500). px·max-width 안내는 deck-contracts figure 절에 있음 | npm test 832/832 pass(12.8 s) |
| 8 | 최종 트리 main 증거 | 덤프 3회 첫 대조에서 diversification 1280 nomatch(d3 `stroke-dashoffset` transition 중간값, 같은 코드의 implementer 덤프는 일치) | 덤프 2회 추가(총 5회) | R-1(VO-5 phase 1은 ledger 3): 최종 nomatch는 B 두 페이지 × 2크기 = 4뿐, 차이는 폭 선언·tls13 4 zoom·`min-height`. audit 26회 배열 차이 0(`74cb05d7da21907e-p2-audit.json`, 42건). R-2: reveal 110/110, 진입 zoom 24개 기준과 \|Δ\| 0, resize 60/60(`records` 0), errors EG1–EG5·C16 기대대로, timing 최대 증가 +6.5 ms, 최대 24.6 ms(`-r2-p2-*.json`, `-r2-base-timing.json`). R-3 `74cb05d7da21907e-r3-grep.mjs`: 핸들러 hit 0, 크기 키에 `fonts.status` 있음, `widen` 0. R-4: 74 → 75, +placement. R-5 `74cb05d7da21907e-r5-shots-review.md`: 나빠짐 0. R-6 `74cb05d7da21907e-r6-doc-review.md` 21/21. fuzz `74cb05d7da21907e-zoomlock-fuzz-result.json`: 100,000, 위반 0, 잘못된 입력 9,950, 유효 40,415 |
| 9 | verifier 1 retry: TV-1(VO-3 `다시` 미검사), TV-2(VO-8 오류 경로 판별력: zmax 1이 상수, warn 문구 비교 없음, E-2 상태 미관찰, EG1 표시 미기록), TV-3(C-16 표면), TV-4(FR-5 표시·style, FR-8 `unwiden`·`grown` 범위), TV-5(ctx 표 문장 R-6 누락) blocking; A-1..A-7 advisory | 증거 정밀도 부족(구현 결함 아님) | spec v5. TV-1: test-implementer batch 4(`다시` 추가, 형제 확인). TV-2: fixture 1장면 정답 a를 1400px로(성공한 선택지만 잠그면 진입 zoom < 1), 2장면 단계마다 글·높이(200/320px), harness가 warn 문구를 글자 단위 비교, EG1 표시, EG3 `min-height`·그림 글 기록, EG5 `revealsOnPick`. TV-3: C-16 표면을 fixture로 명시(갤러리 함수는 페이지 수정 없이 셀 수 없음). TV-4: resize에 MutationObserver(버튼 `class`·`aria-pressed`, 장면 `style`·`class`), R-3에 파일 전체 `widen`·`unwiden`·`grown`, `placement.predict` 표시·style 쓰기 수(변이 사본으로 민감도 확인: 2건·1건 검출). TV-5: R-6에 ctx 표 3행(22–24). A-2: `ok`에 `float`·노드 수. A-4: R-3 줄 수 기록. A-5: `74cb05d7da21907e-r1-r4-record.md`. A-6: R-5 tls13 12 수치. A-3: EG5 `revealsOnPick` 1 | 재실행: errors 최종 EG1 zoom 1·문구 일치·표시 없음, EG2 유지, EG3 문구 일치·`min-height` ""·"단계 0", EG4 3, EG5 1/0/0, C16 1, C17 300px; 기준 커밋도 EG2 외 같음. resize 60/60, 변경 관찰 0. npm test 832/832 |
| 10 | hand mutation 1차(HM-1..HM-12, `74cb05d7da21907e-hand-mutations.py`, seed.py backup/restore, 매번 원문 대조) | HM-6(미리 그리기가 마지막 단계를 건너뜀) 미탐지: R-1 2회 덤프 nomatch가 B 페이지뿐 | 갤러리 figure `steps` 장면 중 마지막 단계만 가장 높은 장면이 없어 R-1이 이 결함을 볼 수 없다(verified: 같은 변이가 C-17 fixture에서 `min-height` 150px) | 11/12 탐지: HM-1 10 fail, HM-2 7, HM-3 12, HM-4 resize 18 bad, HM-5 50 bad(정답 글 다름), HM-7 R-1 visual-hierarchy-spacing 2파일, HM-8 VO-4 2, HM-9 resize 60 bad, HM-10 VO-3 1, HM-11 VO-2 1, HM-12 R-3 hit 1. `-hand-mutations-result.json`, `seed: none` |
| 11 | hand mutation 2차(v5) | — | HM-6b(HM-6과 같은 변이, C-17로 판정), HM-13(오류 경로가 성공한 상태로 잠금), HM-14(E-2에서 부분 최댓값 유지), HM-15(warn 장면 번호 틀림), HM-16(공개 상태 재측정 중 버튼 `aria-pressed`를 바꿨다 되돌림) | 5/5 탐지: HM-6b EG3·EG4·C17, HM-13 EG1 zoom 0.78, HM-14 EG3 `min-height` 320px, HM-15 EG1 문구, HM-16 resize 48 bad(MutationObserver). 실행 당시 `detected()`에 detect 블록이 중복되어 결과 JSON의 `detected`가 dict로 기록된 것을 `fails`로 다시 계산했다(스크립트 고침). `-hand-mutations-v5-result.json`, `seed: none` |
| 12 | verifier 2 retry: TV-6 blocking(VO-8: (a) 공개 상태 재측정 throw에서 fixture 답 a가 1400px이라 zmax와 관계없이 배율이 0.78 하한에 붙어 C-13의 zmax 1을 판별하지 못하고, 세 번째 warn 문구를 비교하지 않음; (b) E-2 fixture에 `.pk`가 생기지 않아 `.pk` 정리를 판별하지 못함). TV-1..TV-5 닫힘. 나머지 VO accepted/retained. advisory A-1, A-7, A-8, A-9, A-11, A-12 | verified(fixture 설계): 판별할 상태가 fixture에 없다 | A-8: 최종 트리 R-3 출력 `{"lines":{"figure":27,"predict":63,"recallList":32},"hits":[],"sizeKeyHasFontStatus":true,"leftovers":{"widen":0,"unwiden":0,"grown":0},"placementPredict":{"lines":51,"markOrStyleWrites":0}}`. TV-6 수정은 새 감사가 필요한데 verifier 2회를 다 써서 stop condition에 따라 고치지 않음 | status limit, handoff `agent-docs/handoff/d7cbe1b9150ab344-placement-module-error-path-evidence.md` |

# Version Log
## v5 (종료 기록)
- verifier 2 retry(TV-6)로 예산 소진, status limit, handoff d7cbe1b9150ab344. 계약 변경 없음.
## v5
- 계약·증거만 고침(재브리프 없음), verifier 1 retry(TV-1..TV-5)와 main hand mutation HM-6 미탐지에 따름: VO-3 internals 문장에 `다시` 토큰(TV-1, test-implementer batch 4); VO-8에 EG 판별 조건(진입 zoom, warn 문구 일치, 버튼 표시, E-2 `min-height`·현재 단계 다시 그림, EG-5 카운터 민감도)과 C-17(마지막 단계가 가장 높은 fixture)(TV-2, HM-6); C-16 표면을 fixture로 명시(TV-3); VO-7에 MutationObserver 버튼·장면 속성 변경 0회와 `float`·노드 수 일치(TV-4, A-2); VO-11에 파일 전체 `widen`·`unwiden`·`grown`과 `placement.predict`의 표시·style 쓰기 0(TV-4, A-4); VO-15에 ctx 표 문장(TV-5).
## v4
- [intent-mismatch] IM-1(ledger 4): E 첫 측정이 `?audit`의 숨은 장면에서 잰 오류로 실제 사례 8을 냈다. 보이는 상태 재측정은 사례 0. 사용자 답변: 안 C를 걷어 내고 측정 근거로 닫는다, `zoomLock(question, zs)`(a). 바뀐 곳: UI-4, Signatures, FR-5, FR-9(빈자리 문장 제거), FR-11, E-1, C-1..C-6, C-8, VO-1, VO-3, VO-6, VO-14, Fuzzing, HM-1·HM-5·HM-9, AD-3, AD-4, AD-7 삭제, AD-15.
- [intent-mismatch] IM-2(ledger 5): R-5 "나빠짐" 기준을 "겹침·잘림, 칸 안 그림의 5% 넘는 축소, 배율 하락 0.005 초과"로 바꿈(사용자 답변). QR-9, VO-10, AD-6.
## v3
- 계약만 고침: phase 1 첫 npm test에서 지난 run의 `tests/scene-types.test.mjs` "VO-2 FR-11 C-3: public names are the 73 base names plus sceneTypes"가 실패(공개 이름 집합을 정확히 단언, `placement`가 더해져 예상대로 깨짐 = test defect). Tests 경로에 `tests/scene-types.test.mjs`를 더하고 VO-2 증거 위치에 넣음.
## v2
- 계약만 고침(재브리프 없음, test-implementer 지적): VO-1 개수 오기(C-5 11개, C-6 3개). VO-7에 크기 변경 중 `LTT.record` 0회, VO-8에 EG-5(`s.reveal` 0회)와 EG-2 표시 확인을 더함(FR-4의 "부르지 않는다"가 관찰되지 않던 틈). VO-14 성질 2개 추가(입력 불변, 모두 floats면 question). 크기 키의 `document.fonts.status` 포함은 R-3에서 코드로 확인(자동 관찰 수단 없음). vw를 사용자 정의 속성·`inline-size`·`flex-basis`로 거는 경우는 FR-7 범위 밖(advisory A-1).
## v1
- 이해 라운드 답변(AD-1..AD-3, AD-17)과 착수 전 측정(ledger 0)으로 초안 작성.
- 승인: brief v1 전 항목 승인(질문 1: 기각 기록 초안 그대로, AD-5 폭 760 영향 수용). status active.
