---
version: 5
run_id: 80a1b2f18f50b1df
status: complete
base_commit: 2b3df17a7d740dcfe0b6bf30eacb4c82d5bfdb3a
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 생성 agent | 수업 구조(덱/스크롤/한 화면)와 무관하게 결정적 결함(B 갈래)을 같은 방식으로 받는다 | 덱 아닌 페이지에서도 `#ltt-check` JSON에 B 오류가 나온다 |
| UI-2 | 학습자·agent | 덱 아닌 페이지에서도 `{{용어}}` 풀이와 떠올리기(recall) 기록이 된다 | `#ltt-meta` glossary로 팝오버가 뜨고, `LTT.recall`이 `recall` 이벤트를 남긴다 |
| UI-3 | 저장소 유지보수자 | 기존 덱 수업은 결과가 바뀌지 않는다 | 갤러리 덱의 B 판정·recall 이벤트·화면이 이전과 같다 |

# Scope
In scope: kit 공통 B 검사(`unknown-term`, `used-before-defined`, `predict-new-term`, `filler-content`, `goal-unreachable`, `goal-at-start`, `expect-mismatch`)와 그 출력(`#ltt-check`, `data-ltt-check`, 패널 경고, `lint` 이벤트); `#ltt-meta` glossary; 덱 아닌 페이지의 `{{}}` 자동 링크; `LTT.recall` 부품과 덱 summary의 사용; `server/audit.mjs`가 `#ltt-check`를 읽는 최소 수정; 관련 kit 문서와 CHANGELOG.
Out of scope: A 갈래 자동 보정(eff07952 2단계), audit.mjs의 스크린샷 도구화·`LTT.auditScene` 삭제(3단계), kit 키워드 주석(4단계), SKILL.md·standalone.md(R2), C 갈래 규칙의 변경·삭제(`lintDeck`에 남는 규칙과 `goal-narrow` 등 auditScene 규칙은 그대로), `/fork`(issue #16), 버전 올림.

# Paths
Implementation: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-deck.css, skills/learn-to-tell/kit/ltt-ui.js, skills/learn-to-tell/kit/ltt-ui.css, skills/learn-to-tell/server/audit.mjs, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/rules.md, skills/learn-to-tell/kit/api/internals.md, skills/learn-to-tell/kit/api/deck-contracts.md, skills/learn-to-tell/kit/api/ui.md, skills/learn-to-tell/kit/api/base.md, skills/learn-to-tell/kit/CHANGELOG.md
Tests: tests/check.test.mjs, tests/check-page.test.mjs, tests/fixtures/check/, tests/lint-rules.test.mjs, tests/kit.test.mjs, tests/scene-types.test.mjs, tests/api-docs.test.mjs, tests/gallery-audit.test.mjs, tests/gallery-audit.baseline.json, tests/check-differential.fuzz.mjs
Test command: npm test && node scripts/build.mjs css --check && node scripts/build.mjs version (통과 기준: base_commit에서도 실패하는 `tests/api-docs.test.mjs`의 `VO-6 FR-11 PROJECT 범위 line`, `VO-6 FR-11 PROJECT kit/api` 2건 외 실패 0)
Review evidence: RV-1 갤러리 덱 summary recall 장면 스크린샷 전후 픽셀 비교(아래 VO-12), RV-2 브라우저 키보드 조작 확인(VO-13). 산출물은 Execution ledger에 기록.
Fuzzing: `node tests/check-differential.fuzz.mjs --seed 1 --n 3000` — 표면 `LTT.deckIssues(spec)`; oracle은 differential: base_commit의 `ltt.js`(`git show 2b3df17:skills/learn-to-tell/kit/ltt.js`)의 `lintDeck(spec)`에서 rule이 B 4종(`unknown-term`, `used-before-defined`, `predict-new-term`, `filler-content`)인 항목만 순서대로 `[장면, rule, msg]`로 뽑은 것과 새 `deckIssues(spec)`의 `["장면 n" → n, rule, msg]`가 같아야 한다. 무작위 덱 spec: 장면 타입·terms 항목(plain 유무)·glossary·`{{}}`/bare 용어·채움 글·predict 질문 조합. seed 1, 3000건.
Mutation tool: none — Stryker 등 도구가 저장소에 없고(의존성 없음) 새로 들이는 비용이 이번 범위에 비해 크다. 대신 hand mutation 8–10건.

# Signatures
LTT.termIssues(units: [{where: string, text: string, defines?: string[], skipUnknown?: boolean}], glossary: {[key]: string}) → [{where, rule, msg}]
LTT.goalIssues(goals: [{where: string, hits: number, samples: number, start: boolean}]) → [{where, rule, msg}]
LTT.deckIssues(spec, extraGlossary?: {[key]: string}) → [{where: "장면 n", rule, msg}]
LTT.check() → {source: "deck"|"page", viewport: [w, h], errors: [{where, rule, msg}]}
LTT.checkSource({issues: () => errors, prepare?: () => void, whereOf?: (el) => string})
LTT.recall(el, {question, answer, ask?, title?, hold?: (answerEl) => void, onReveal?: (answerEl) => void}) → {answer: Element, reveal: () => void}
#ltt-meta JSON: 기존 필드 + "glossary": {용어: 풀이 HTML}
<script type="application/json" id="ltt-check">{"source","viewport","errors"}</script>, <html data-ltt-check="errors 수">
audit.mjs 결과 객체: 기존 필드 + check: [{where, rule, msg}]

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `termIssues`는 단위 순서대로, 단위마다 `unknown-term`(표시 key가 glossary에도 어느 단위의 `defines`에도 없음, `skipUnknown` 단위는 건너뜀) → `used-before-defined`(glossary·`defines` key가 표시를 뺀 글에 부분 문자열로 나오고, 그 key를 처음 표시하거나 `defines`로 정의한 단위가 없거나 뒤) → `filler-content`(기존 `FILLER` 정규식, 표시 제거 글, 단위당 첫 일치 하나) 순으로 낸다. msg는 base_commit `lintDeck`의 같은 rule 문구와 같다 | must | eff07952 1단계 |
| FR-2 | `deckIssues(spec)`는 base_commit `lintDeck(spec)`의 B 4종 항목과 같은 순서·rule·msg를 내고 위치를 `"장면 n"`(1부터)으로 적는다. terms 항목 plain 누락도 `unknown-term`으로 포함한다. `extraGlossary`(페이지의 `#ltt-meta` glossary)가 있으면 그 key도 풀이가 있는 용어로 친다(없으면 base_commit과 같다). 이때 key 순서(같은 단위 안 `used-before-defined` 메시지 순서)는 FR-5 등록 순서를 따른다: `extraGlossary` → `spec.glossary` → terms | must | eff07952 "deck은 장면 정보만 덧붙인다" |
| FR-3 | `lintDeck`은 더는 B 4종 rule을 내지 않는다. 다른 rule(`term-no-visual` 포함)의 출력은 base_commit과 같다 | must | 검출 단일화 |
| FR-4 | `goalIssues`는 goal마다 `hits == 0`이면 `goal-unreachable`, `start`면 `goal-at-start`(둘 다 가능, 이 순서)를 base_commit 문구로 낸다. `auditScene`은 더는 이 둘을 내지 않고 `goal-narrow`는 그대로 낸다 | must | 1단계 |
| FR-5 | glossary는 `#ltt-meta`의 `glossary`, 덱 `spec.glossary`, terms 장면 plain을 합친 하나다. 같은 key는 먼저 등록된 것이 남는다. 등록 순서는 `#ltt-meta` glossary → 덱 `spec.glossary` → terms 장면(base_commit 덱 규칙: spec.glossary가 terms보다 앞) | must | 사용자 결정 |
| FR-6 | 덱이 아닌 페이지(`checkSource` 미등록)의 단위는 `document.body` 텍스트를 문서 순서로 걸어 h1–h3마다 나눈 구역이다. where는 `구역 '<제목 글>'`(표시는 보이는 말로, 공백 정리), 첫 제목 앞은 `구역 (처음)`. `script`·`style`·`template`·`noscript`·`textarea`와 kit UI(`#ltt-expect`, `#ltt-pop`, `#ltt-check`, `#ltt-meta`)는 건너뛴다. 이미 링크된 `.ltt-term[data-term]`은 그 key의 표시로 센다 | must | 사용자 결정 |
| FR-7 | 덱이 아닌 페이지는 `load` 때 kit이 `document.body`의 `{{}}`를 `.ltt-term`으로 바꾼다. `linkTerms`는 FR-6의 건너뛸 요소 안 텍스트를 바꾸지 않는다 | must | 필수 파트 `{{용어}}` |
| FR-8 | `check()`의 errors 순서: 정적 검사(덱이면 `deckIssues`, 아니면 DOM 단위 `termIssues`) → DOM의 `.ltt-goal[data-samples]` 문서 순서 `goalIssues`(where는 덱이면 그 goal이 든 장면, 아니면 든 구역) → 페이지가 지금까지 부른 `LTT.expect` 불일치(호출 순서, rule `expect-mismatch`, where `페이지`, msg `<label> (모델 <a>, 기대 <b>)`) | must | 1단계 |
| FR-9 | 모든 페이지에서 kit은 `load` 뒤 글꼴 준비 + 300ms에 `check()`를 한 번 자동 실행한다. 덱은 URL에 `?check` 또는 `?audit`이 있으면 검사 전에 모든 장면을 마운트·fit한다. 그 밖의 덱은 마운트된 장면의 goal만 본다 | must | 기본값 D-1 |
| FR-10 | `check()`는 `#ltt-check`를 만들거나 내용을 바꾸고(`<`는 `\u003c`), `<html data-ltt-check>`를 errors 수로, errors마다 패널 경고를 한 줄씩 단다. 자동 실행 때만, `expect-mismatch`를 뺀 errors가 비어 있지 않으면 `LTT.record("lint", 그것)`을 한 번 보낸다 | must | 1단계 |
| FR-11 | `LTT.recall(el, opts)`는 `el`에 질문·답 입력칸·"답 보기" 버튼·숨은 답을 넣는다. 버튼을 누르면 답이 보이고 버튼이 비활성화되며, 답의 `{{}}`가 링크되고 `LTT.record("recall", {scene: title, question: 태그 뺀 question, answer: 입력칸 trim})`을 보낸다. `hold`가 있으면 생성 때 답 요소로 부르고 kit은 숨김을 맡기지 않는다. `onReveal`은 공개 직후 부른다 | must | 1단계 recall |
| FR-12 | 덱 summary의 recall 목록은 `LTT.recall`을 쓰며 화면·이벤트·배율 잠금 동작이 base_commit과 같다 | must | UI-3 |
| FR-13 | 덱 `audit()`의 `#ltt-audit` 형식은 유지한다. `lint`는 새 `lintDeck` 결과, `audit`은 새 `auditScene` 결과, `expectFails`는 지금까지의 `LTT.expect` 불일치 문구(base_commit과 같은 `✗ 검증 실패: …` 형식) | must | 전환기 호환 |
| FR-14 | `audit.mjs`는 `#ltt-check`를 읽어 결과에 `check`로 넣고, 보고에 `    check <where> [<rule>]: <msg>` 줄을 더하고, check가 있으면 종료 코드 1이다. `source: "page"`면 `#ltt-audit` 없이 결과로 인정한다(`scenes: 0`, `audit`·`lint`·`expectFails` 빈 배열). `source: "deck"`인데 `#ltt-audit`이 없으면 기존처럼 재시도·오류 | must | 전환기 |
| FR-15 | 문서: `API.md` 페이지 계약에 glossary 필드와 `#ltt-check`, 기본 이름 표에 `LTT.check`·`LTT.recall`(또는 ui.md), `rules.md`에 B 규칙을 "검사(`#ltt-check`)" 절로, `internals.md`에 `termIssues`·`goalIssues`·`deckIssues`·`checkSource`, `CHANGELOG.md` 맨 위 `## 미출시` 절. 문서화 안 된 공개 이름이 없어야 한다(api-docs 테스트) | must | 저장소 규칙 |

# Errors
- `#ltt-meta`가 없거나 JSON이 깨짐 — 예외 없이 glossary 없음으로 처리, 콘솔 경고 1줄 — 표시된 모든 key가 `unknown-term`으로 나와 저자가 알 수 있다.
- `check()` 안에서 예외(예: 저자 `whereOf` 실패) — 페이지는 계속 동작, `#ltt-check`에 `errors: [{where: "페이지", rule: "check-failed", msg: <예외 메시지>}]` — `data-ltt-check="1"`.
- `LTT.record` 실패(서버 없음, 수업 경로 아님) — 기존 동작(콘솔) — 검사 결과는 그대로 남는다.
- `LTT.recall`에 `question`이 없음 — `Error("recall: question이 필요하다")` throw — el은 바뀌지 않는다.
- audit.mjs: `#ltt-check` JSON 파싱 실패 — 결과 `error: "#ltt-check JSON을 읽을 수 없다"` — 종료 코드 2.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 페이지 구역 2개, glossary {적중}, 구역1 `{{적중}}`, 구역2 `적중` | errors 없음 |
| C-2 | normal | 구역1 `적중률이 높다`, 구역2 `{{적중률}}`, glossary {적중률} | `used-before-defined` where `구역 '<구역1 제목>'` |
| C-3 | normal | `{{없는말}}`, glossary 비어 있음 | `unknown-term` |
| C-4 | normal | 본문 "샘플 텍스트"와 "항목 1" | `filler-content` 한 건(첫 일치) |
| C-5 | boundary | 같은 구역 안에서 bare `적중` 뒤 `{{적중}}` | 오류 없음(같은 단위 허용) |
| C-6 | boundary | 제목이 하나도 없는 페이지 | 단위 1개, where `구역 (처음)` |
| C-7 | boundary | goal hits 1, start false | 오류 없음(`goal-narrow`는 C로 auditScene 몫) |
| C-8 | normal | goal hits 0 / start true / 둘 다 | `goal-unreachable` / `goal-at-start` / 둘 다 그 순서 |
| C-9 | normal | `LTT.expect("x", 2, 3)` 실패 1건 | errors 끝에 `expect-mismatch` `x (모델 2, 기대 3)`; `lint` 이벤트에는 없음 |
| C-10 | normal | 덱 갤러리 13개 `?audit` | check errors 0, lint 0, audit은 baseline 이하, expectFails 0 |
| C-11 | normal | `LTT.recall` 답 보기 클릭, 입력 " 네 " | 답 보임, 버튼 disabled, `recall` 이벤트 `{scene, question, answer: "네"}` |
| C-12 | error | `#ltt-meta` JSON 깨짐 + `{{a}}` | 예외 없음, `unknown-term` a |
| C-13 | error | recall `question` 없음 | throw, el 자식 수 변화 없음 |
| C-14 | edge | `<script>` 안 문자열에 `{{a}}`, `<textarea>`에 `{{b}}` | 둘 다 검사·링크 대상 아님 |
| C-15 | edge | `.ltt-term[data-term=k]`로 이미 링크된 표시 + 뒤 구역 bare k | 오류 없음 |
| C-16 | edge | errors에 `</script>` 문자열을 담는 msg | `#ltt-check` 파싱 가능, 스크립트가 끊기지 않음 |
| C-17 | error | `checkSource.whereOf`가 throw | `check-failed` 1건, 페이지 동작 유지 |
| C-18 | normal | 덱 페이지 `?check`, 3번째 장면 mount 안에 도달 불가 goal | `goal-unreachable` where `장면 3` |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 검출 정확성이 목적 |
| Performance efficiency | no | 로드당 DOM 한 번 순회. 갤러리 audit의 가상 시간 예산(12s)이 이미 상한 역할 |
| Compatibility | yes | 기존 덱 수업·`#ltt-audit`·이벤트 모양 유지(UI-3) |
| Interaction capability | yes | 학습자가 직접 쓰는 `LTT.recall`과 덱 summary 화면 |
| Reliability | yes | 깨진 메타·저자 코드 예외에도 페이지가 멈추지 않아야 함 |
| Security | yes | `#ltt-check` 스크립트 끊김 방지, `linkTerms`가 스크립트 글을 바꾸지 않음 |
| Maintainability | yes | B 규칙 구현이 한 곳, 공개 이름 문서화 |
| Flexibility | no | 형식 무관성은 FR-6–FR-9 기능 요구로 다룸 |
| Safety | no | 물리·인명 위험 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Functional suitability / correctness | `deckIssues` 대 base_commit lintDeck B 부분 | differential fuzz 3000건 중 불일치 건수 | 0, 이하 | fuzz + VO-3 | UI-3 |
| QR-2 | Compatibility / co-existence | 갤러리 덱 13개 × 2 크기 | check·lint·expectFails 건수, audit 건수 | check 0, lint 0, expect 0, audit ≤ baseline | gallery-audit 테스트 | UI-3 |
| QR-3 | Interaction capability / user interface aesthetics | 갤러리 summary recall 장면(답 공개 전·후) 1440×900 | 픽셀이 다른 비율 | 0.1% 이하 | RV-1 | FR-12 |
| QR-4 | Interaction capability / operability | 덱 아닌 페이지의 `LTT.recall` | Tab으로 입력칸·버튼 도달, Enter/Space로 공개 | 키보드만으로 공개 성공 | RV-2 | UI-2 |
| QR-5 | Reliability / fault tolerance | C-12, C-17 | 페이지 예외(`pageerror`) 수 | 0 | VO-9, VO-10 | Errors |
| QR-6 | Security / integrity | C-14, C-16 | 스크립트 텍스트 변경 수, `#ltt-check` JSON 파싱 성공 | 0, 성공 | VO-8 | Errors |
| QR-7 | Maintainability / modifiability | B 4종 규칙 본문 | `ltt-deck.js` 안 B rule id 문자열 등장 수(정적), `lintDeck`이 B rule id를 내는 입력 수(VO-3 케이스 + fuzz 3000건) | 0, 0 | VO-11 | 단일화 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, C-1–C-6, C-15 | `termIssues` (vm) | unit, 열거한 항목 전부 | equivalence partitioning + BVA(2값) | EP: 표시 key ∈/∉ glossary, ∈ 앞 defines, skipUnknown; bare 있음/없음 × 첫 표시 앞/같음/뒤/없음; 채움 0/1/2개; BVA: 첫 표시 단위 = i, i+1 | 100% | 기대 `[where, rule, msg]` 목록과 정확히 같음 | `node --test tests/check.test.mjs` |
| VO-2 | FR-4, C-7, C-8 | `goalIssues`, `auditScene` | unit | decision table | hits∈{0,1,≥2} × start∈{t,f} 6칸 + auditScene에 같은 6칸 | 100% | goalIssues는 표대로, auditScene은 `goal-narrow`만 | tests/kit.test.mjs |
| VO-3 | FR-2, FR-3, QR-1 | `deckIssues`, `lintDeck` | unit, 기존 lint-rules B 케이스 전부 이전 + 차분 fuzz | equivalence partitioning + random(differential) | 기존 VO-4 B 케이스 id 전부; lintDeck 비-B 케이스 전부 | 100% | B 케이스는 deckIssues에서 같은 (장면, rule); lintDeck에선 B id 0건, 비-B 결과 불변 | tests/lint-rules.test.mjs + fuzz |
| VO-4 | FR-5, C-12 | glossary 병합 | integration(Chrome) | equivalence partitioning | 메타만 / 덱만 / terms만 / 메타+덱 충돌 / 메타 깨짐 / 덱 페이지에서 메타에만 있는 key 사용(오류 없음) | 100% | 팝오버 풀이·unknown-term 유무가 기대와 같음 | tests/check-page.test.mjs |
| VO-5 | FR-6, FR-7, FR-8, FR-10, C-1–C-6, C-9, C-14, C-15 | 덱 아닌 고정 페이지 `#ltt-check`·`data-ltt-check`·`.ltt-term`·events.jsonl | integration(Chrome, 서버, `--dump-dom`), 결함판·깨끗한 판 | scenario | SC-clean, SC-defects(각 rule 1회 이상, 순서 확인), SC-script-textarea, SC-prelinked, SC-heading-mark(제목에 `{{보이는 말\|key}}`·여러 공백 → where는 보이는 말·공백 하나), SC-h4(h4와 중첩 요소 안 제목: h4는 단위를 나누지 않음, 중첩 h2는 나눔), SC-kit-ui(`#ltt-expect` 패널 글에 glossary key·채움 글이 있어도 검사 안 함), SC-panel(경고 줄 수 = errors 수, 두 번째 `LTT.check()` 뒤에도 `#ltt-check` 1개·경고 줄 수 그대로), SC-lint-once(수동 `check()`는 `lint` 이벤트를 보내지 않음; 덱 `?check` 자동 실행은 1회), SC-viewport(1440×900 창에서 viewport = 페이지의 `[innerWidth, innerHeight]`) | 100% | errors 목록·속성·링크 수·`lint` 이벤트(expect 제외) 정확히 일치 | tests/check-page.test.mjs |
| VO-6 | FR-9, C-18 | 덱 페이지 `?check` / 없음 | integration(Chrome) | equivalence partitioning | `?check`, `?audit`, 없음(미마운트 goal 미포함), 없음 + 첫 장면(마운트됨)의 goal(포함) | 100% | where `장면 3` goal 오류가 앞 둘에만, 첫 장면 goal 오류는 쿼리 없이도 `장면 1`로 | tests/check-page.test.mjs |
| VO-7 | FR-11, FR-12, C-11, C-13 | `LTT.recall` 독립 / 덱 summary | integration(Chrome, 고정 페이지가 자기 스크립트로 입력·클릭) | state transition | 숨김→공개, 공개 후 재클릭 불가, hold/onReveal 호출, question 없음 throw | 100%(전이 3 + 오류 1) | DOM 상태·이벤트 `{scene, question, answer}` 일치 | tests/check-page.test.mjs |
| VO-8 | QR-6, C-14, C-16 | `#ltt-check` 직렬화, linkTerms | integration | error guessing | `</script>` msg, `<!--` msg, 스크립트 속 `{{}}` | none — experience-based | JSON 파싱 성공, 스크립트 textContent 불변 | tests/check-page.test.mjs |
| VO-9 | QR-5, C-12, Errors | 깨진 메타 | integration | error guessing | 깨진 JSON, 메타 없음 | none — experience-based | pageerror 0, unknown-term 나옴, kit 로드 전에 감싼 `console.warn` 중 `#ltt-meta` 경고가 정확히 1회 | tests/check-page.test.mjs |
| VO-10 | QR-5, C-17, Errors | checkSource 예외 | integration | error guessing | whereOf throw, issues throw, `fetch`가 reject하는 페이지(Errors 3행: `record` 실패) | none — experience-based | 앞 둘은 `check-failed` 1건, 셋째는 `#ltt-check`가 정상 결과로 남음, 모두 pageerror 0 | tests/check-page.test.mjs |
| VO-11 | QR-7, FR-15 | 소스·문서 정적 검사 | unit | syntax | `ltt-deck.js` 안 B rule id 4개; 새 공개 이름 6개 문서화; rules.md 검사 절의 7개 id; `API.md` 페이지 계약 절에 `glossary`·`#ltt-check`·`data-ltt-check`; `CHANGELOG.md` 첫 `##` 절이 `## 미출시`이고 `#ltt-check`·`glossary`·`LTT.recall`을 언급 | 100% | 등장 0, 문서화 누락 0 | tests/check.test.mjs + tests/api-docs.test.mjs |
| VO-12 | FR-12, FR-13, FR-14, QR-2, QR-3, C-10 | 갤러리 덱 audit + summary 화면 | end-to-end(Chrome) + review | scenario | 13 페이지 × 2 크기; recall 덱 summary 장면 전·후; 실패하는 `LTT.expect`가 있는 덱 고정 페이지의 `#ltt-audit.expectFails` = `["✗ 검증 실패: <label> (모델 <a>, 기대 <b>)"]` | 100% | QR-2 기준, 픽셀 차 ≤ 0.1%, expectFails 문구 일치 | tests/gallery-audit.test.mjs + RV-1 |
| VO-13 | QR-4 | 덱 아닌 recall 키보드 | review | scenario | Tab→입력칸→버튼→Enter | 100% | 답 공개, 이벤트 기록 | RV-2(claude-in-chrome) |
| VO-14 | FR-14, Errors | audit.mjs 결과·보고·종료 코드 | integration | decision table | page(#ltt-audit 없음) × check 0/≥1, deck(#ltt-audit 있음) × check 0/≥1, deck #ltt-audit 없음, JSON 깨짐 (page는 #ltt-audit을 만들지 않으므로 page × 있음 칸은 없다) | 100% | 필드·보고 줄·종료 코드 일치 | tests/check-page.test.mjs |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | approval |
| --- | --- | --- | --- |
| D-1 | 검사는 매 로드 자동 1회, 덱 전체 마운트는 `?check`/`?audit`에서만 | 현행 lint도 매 로드; 학습자 화면에서 전 장면 마운트는 비용·기록 부작용 | brief v1 — approved |
| D-2 | 덱 아닌 glossary는 `#ltt-meta` `glossary` | — | user answer |
| D-3 | 덱 아닌 단위는 h1–h3 구역 | — | user answer |
| D-4 | `expect-mismatch`는 `#ltt-check`엔 넣고 `lint` 이벤트엔 뺀다(이미 별도 이벤트) | SKILL §3.10이 두 이벤트를 모두 읽어 중복 계산될 수 있음 | brief v1 — approved |
| D-5 | CHANGELOG는 `## 미출시` 절, 버전은 올리지 않음 | v0.2.0 태그가 이미 있음 | brief v1 — approved |
| D-6 | Mutation tool 없음, hand mutation 8–10건 | 저장소에 의존성 없음 | brief v1 — approved |
| D-7 | Chrome 의존 테스트는 gallery-audit와 같은 skip 규칙 | 기존 관례 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1–C-6, C-15 | VO-1, VO-5 | check.test, check-page.test |
| FR-2, FR-3 | C-10 | VO-3, VO-11 | lint-rules.test, fuzz |
| FR-4 | C-7, C-8 | VO-2 | kit.test |
| FR-5 | C-12 | VO-4, VO-9 | check-page.test |
| FR-6–FR-8, FR-10 | C-1–C-6, C-9, C-14–C-16 | VO-5, VO-8 | check-page.test |
| FR-9 | C-18 | VO-6 | check-page.test |
| FR-11, FR-12 | C-11, C-13 | VO-7, VO-12, VO-13 | check-page.test, RV-1, RV-2 |
| FR-13, FR-14 | C-10 | VO-12, VO-14 | gallery-audit.test, check-page.test |
| FR-15 | — | VO-11 | api-docs.test, check.test |
| QR-1–QR-7 | — | VO-3, VO-12, VO-13, VO-9, VO-10, VO-8, VO-11 | 위와 같음 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 5 | tests/check.test.mjs `VO-1 …`; working tree after A-1 + batch 2·3 tests| accepted | verifier 2 accepted; verifier 1 지적 보완, HM 결과 ledger | — |
| VO-2 | 5 | tests/kit.test.mjs `VO-2 …`; working tree after A-1 | accepted | verifier 1 accepted; 영향 없음(vm 단위, kit.test 변경 없음, HM-10이 여전히 잡음) | — |
| VO-3 | 5 | tests/lint-rules.test.mjs `VO-3 …` + fuzz seed 1 n 3000: 0 violations; working tree after A-1 | accepted | verifier 2 accepted; 재검토: v5 FR-2 순서 + fuzz 생성기 확장 + extraGlossary 단위 테스트 추가(변경 영향) | — |
| VO-4 | 5 | tests/check-page.test.mjs `VO-4 …`; working tree after A-1 + batch 2·3 tests| accepted | verifier 2 accepted; verifier 1 지적 보완, HM 결과 ledger | — |
| VO-5 | 5 | tests/check-page.test.mjs `VO-5 …`; working tree after A-1 + batch 2·3 tests| accepted | verifier 2 accepted; verifier 1 지적 보완, HM 결과 ledger | — |
| VO-6 | 5 | tests/check-page.test.mjs `VO-6 …`; working tree after A-1 + batch 2·3 tests| accepted | verifier 2 accepted; verifier 1 지적 보완, HM 결과 ledger | — |
| VO-7 | 5 | tests/check-page.test.mjs `VO-7 …`; working tree after A-1 | accepted | verifier 2 accepted; 재검토: 이벤트 비교를 순서 무관으로 바꿈(T-1 테스트 변경) | — |
| VO-8 | 5 | tests/check-page.test.mjs `VO-8 …`; working tree after A-1 | accepted | verifier 2 accepted; 재검토: batch 2에서 고정 페이지 전부 재생성(인라인 LTT 스크립트를 kit 뒤로), VO-14는 A-f assertion 추가 | — |
| VO-9 | 5 | tests/check-page.test.mjs `VO-9 …`; working tree after A-1 + batch 2·3 tests| accepted | verifier 2 accepted; verifier 1 지적 보완, HM 결과 ledger | — |
| VO-10 | 5 | tests/check-page.test.mjs `VO-10 …`; working tree after A-1 + batch 2·3 tests| accepted | verifier 2 accepted; verifier 1 지적 보완, HM 결과 ledger | — |
| VO-11 | 5 | tests/check.test.mjs `VO-11 …`, tests/api-docs.test.mjs `VO-11 FR-15`, `VO-4 check rules`; working tree after A-1 + batch 2·3 tests| accepted | verifier 2 accepted; verifier 1 지적 보완, HM 결과 ledger | — |
| VO-12 | 5 | tests/gallery-audit.test.mjs (check 0) + RV-1: 24 shots, worst 0.0019% (base noise 0.0015%); working tree after A-1 + batch 2·3 tests| accepted | verifier 2 accepted; verifier 1 지적 보완, HM 결과 ledger | — |
| VO-13 | 5 | RV-2 CDP keyboard: 2 Tabs to textarea, Tab to button, Enter → visible, disabled, recall event {scene:T, answer:네}; working tree after A-1 + batch 2·3 tests| accepted | verifier 2 accepted; verifier 1 지적 보완, HM 결과 ledger | — |
| VO-14 | 5 | tests/check-page.test.mjs `VO-14 …`; working tree after A-1 | accepted | verifier 2 accepted; 재검토: batch 2에서 고정 페이지 전부 재생성(인라인 LTT 스크립트를 kit 뒤로), VO-14는 A-f assertion 추가 | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| A-1 | 첫 Test command: kit-css 4건 실패 `root.addEventListener is not a function`(ltt.js가 load 리스너를 가드 없이 등록, 스텁 환경 로드 실패) | verified: implementation defect, 기존 관찰 동작(최소 환경에서 kit 로드) 회귀 | implementer가 load 훅·setTimeout·fonts 가드 추가 | fixed: Test command 1117 중 실패 2(A-2 사전 실패)만 |
| A-2 | api-docs `VO-6 FR-11 PROJECT` 2건 실패 | verified: base_commit에서도 같은 2건 실패(scratchpad git archive로 확인), 범위 밖 | Test command 통과 기준에 명시(v3) | accepted |
| A-3 | RV-2 첫 probe: Enter 뒤 답 안 열림 | verified: probe 결함(CDP keyDown에 text "\r"가 없어 버튼 활성화가 일어나지 않음) | Enter keyDown에 text "\r" 추가 | RV-2 통과 |
| V1 | verifier 1 retry: F-1..F-9, SC-1, SC-2 blocking; A-a..A-g advisory | — | 분류: F-1..F-6, F-8 = obligation evidence gap(test-implementer); F-7 = QR-7 측정 방식이 정적 검사로 관찰 불가한 부분 → v4에서 측정을 정적(ltt-deck.js)+행동(lintDeck B 미출력)으로 정정, main 리뷰로 RULES에 B id 없음 확인(git diff); F-9 = main이 리뷰 산출물 경로를 ledger에 기록; SC-1·SC-2 = v4에서 VO-10·VO-11 항목 추가; A-c(FR-9 "마운트된 장면 goal은 본다"의 긍정 쪽 미관찰)·A-f는 요구 문장에 있으므로 gap으로 승격; A-a(fuzz 생성기 확장)는 선택 강화로 같이 요청; A-b, A-d, A-e, A-g는 advisory 유지 | 교정 배치 2 |
| C2 | 교정 배치 2 결과: (1) api-docs SC-2 테스트 실패 — `API.md` 페이지 계약 절에 `#ltt-check` 글자 없음(`id="ltt-check"`로만 적음) (2) fuzz `extraGlossary` 실행에서 used-before-defined 메시지 순서 불일치 77건(seed 1) | (1) implementation(문서) defect (2) spec gap: FR-2/FR-5가 extra 있을 때 key 순서를 못 박지 않음 | v5에서 FR-2에 순서(extra → spec.glossary → terms)를 명시, implementer에 두 건 수정 요청 | fixed: fuzz seed 1 n 3000 violations 0(extraGlossary 포함), api-docs SC-2 통과 |
| C3 | full `npm test`에서 간헐 실패: (a) `VO-7 …` recall 이벤트 순서 뒤바뀜(check-page 5회 중 1회) (b) `tests/diagram.test.mjs` `VO-13 PF1 QR-1` 326ms > 20ms 1회 | (a) verified: test defect — recall마다 별도 POST라 events.jsonl 순서가 도착 순(경쟁), spec은 이벤트 간 순서를 요구하지 않음 (b) hypothesis: 병렬 Chrome 테스트로 인한 CPU 부하 타이밍 flake — diagram.test는 이번 변경과 무관, 단독 3회 7ms, 다음 전체 실행 통과 | (a) test-implementer에 순서 무관 비교 + 같은 패턴 전수 점검 요청 (b) 기록만, 반복 시 재검토 | (a) fixed: VO-7 두 테스트 정렬 비교, 전수 점검 결과 다른 이벤트 비교는 단일 이벤트; check-page 5회 연속 39/39 (b) 이후 전체 실행 2회 모두 PF1 통과 |
| HM | hand mutation 10건(가장 강한 결함 갈래: verifier 1 제안 10갈래 + 차단 지적 F-1·F-2·F-3·F-4 우선) — 스크립트 scratchpad `hand-mut.py`(보관 `agent-docs/spec-logs/80a1b2f18f50b1df-hand-mut.py`), `seed.py backup/restore`로 하나씩 | — | HM-1 defines 첫 위치 무시 → VO-1 3건 실패; HM-2 deckIssues가 extra 무시 → VO-3 2건 + VO-4 F-2 실패; HM-3 SKIP에서 textarea·#ltt-expect 제거 → VO-5 SC-kit-ui·SC-panel·SC-script-textarea 실패; HM-4 goal 오류를 정적 오류 앞에 → VO-5 SC-defects·VO-6 실패; HM-5 lint 이벤트 수동 실행에도·expect 포함 → SC-defects·SC-lint-once 실패; HM-6 `<` 미이스케이프 → VO-8 2건 실패; HM-7 recall answer trim 없음 → VO-7 2건 실패; HM-8 `?check` 전 장면 마운트 안 함 → VO-6 `?check`·VO-4 terms 실패; HM-9 exitCode가 check 무시 → VO-14 실패; HM-10 auditScene goal-at-start 재출력 → VO-2 3건 실패 | 10/10 의도한 assertion이 잡음, restore 확인(seed status none) |
| FZ | fuzz `node tests/check-differential.fuzz.mjs --seed 1 --n 3000`(생성기 확장 후: compare·contrast·overview·steps·narration·extraGlossary) | — | — | execs 3000(2877 with B items), violations 0(extraGlossary 포함) |
| T | Test command 전체 2회 연속 | — | — | 1135 중 실패 2(A-2 사전 실패)만; css in sync; version 0.2.0 |
| V2 | verifier 2 pass: VO-1..VO-14 accepted, blocking 0. advisory: lintDeck 쪽 B 재출력 음성 대조 변이, FR-9 지연 시간 미관찰(임계 없음), fuzz가 defines/skipUnknown 경로 미포함(VO-1 예시로 덮음), PF1 flake 재발 시 재검토 | — | — | complete |
| RV-1 | 산출물 | — | 스크립트 scratchpad `recall-shots.mjs`·`png-diff.mjs`(종료 시 `agent-docs/spec-logs/80a1b2f18f50b1df-rv1-recall-shots.mjs, 80a1b2f18f50b1df-rv1-png-diff.mjs`로 보관), base 사본 `git archive 2b3df17 skills site`; 명령 `node recall-shots.mjs <base 사본> rv1-base`, `node recall-shots.mjs <repo> rv1-new`, `node png-diff.mjs rv1-base rv1-new`; 장면: cache-ttl 9, scenes 12, diversification 9, single-gpu-dataflow 11, anchoring 9, ontology-triples 22, retrieval-practice 10, tls13-quic 15, matrix-as-transform 9, projectile-drag 9, color-contrast 11, visual-hierarchy-spacing 12(trolley-ethics는 recall 없음) | 24장 중 최악 0.0019%(single-gpu-dataflow after), 나머지 0.0000%; base 두 번 촬영 노이즈 0.0015%(projectile-drag after) → QR-3 통과 |
| RV-2 | 산출물 | — | 스크립트 `rv2.mjs`(보관 `agent-docs/spec-logs/80a1b2f18f50b1df-rv2.mjs`), CDP `Input.dispatchKeyEvent` Tab×2, `Input.insertText` " 네 ", Tab, Enter(text "\r") | 답 숨김→보임, 버튼 disabled, 답 안 링크 1개, events.jsonl recall `{scene:"T", question:"{{적중}}이란?", answer:"네"}` → QR-4 통과 |

# Version Log
## v1
- 최초 작성. 사용자 결정 D-2, D-3.
## v2
- 계약만 수정: `deckIssues`에 선택 인자 `extraGlossary`를 더했다. FR-5(메타·덱 glossary 하나로 병합)와 FR-2(base_commit과 같음)가 덱 페이지의 `#ltt-meta` glossary에서 충돌하던 것을 푼다. 인자가 없으면 FR-2 그대로.
## v3
- 계약만 수정: Tests 경로에 `tests/scene-types.test.mjs`(공개 이름 수 테스트, 81로 바뀐 개수의 형제) 추가; FR-5 등록 순서 명시(test-implementer 질의); VO-14에서 존재할 수 없는 page × #ltt-audit 칸 제거; base_commit부터 실패하는 api-docs 2건을 통과 기준에서 제외.
## v4
- 계약만 수정(verifier 1 지적): QR-7 측정을 정적 ltt-deck.js + lintDeck 행동으로 정정(F-7); VO-4·VO-5·VO-6·VO-9·VO-10·VO-11·VO-12 coverage 항목 추가(F-2..F-6, F-8, SC-1, SC-2, A-c). 요구 문장(FR)은 바뀌지 않았다.
## v5
- 계약만 수정(test-implementer 질의): FR-2에 `extraGlossary`가 있을 때의 key 순서를 FR-5 등록 순서로 명시.
