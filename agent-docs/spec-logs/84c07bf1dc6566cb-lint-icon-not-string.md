---
version: 1
run_id: 84c07bf1dc6566cb
status: complete
base_commit: 77c3ecef2eefb96901ba612229846f31d60a53ed
max_verifier_invocations: 2
handoff: agent-docs/handoff/d422e4de167b576d-lint-hook-art-non-string.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 수업 생성 agent·학습자 | 아이콘 자리에 함수 같은 값을 넣어 화면에 소스가 찍히는 결함을 공개 전에 잡는다 | `LTT.lintDeck`이 그 장면에 "고침" 등급 `icon-not-string` 경고를 낸다 |
| UI-2 | 프로젝트 유지자 | 기존 수업·규칙 출력은 그대로 둔다 | 기존 lint 테스트·gallery audit 기준선(0)이 바뀌지 않는다 |

# Scope
In scope: `skills/learn-to-tell/kit/ltt.js` `RULES`에 장면 규칙 `icon-not-string` 하나를 더한다. 대상 필드는 그룹 A: `type: "hook"` 장면의 `art`, `type: "explain"` 장면의 `steps[i].icon`, `type: "terms"` 장면의 `terms[i].icon`. `kit/api/rules.md` lint 표 행, `kit/CHANGELOG.md` `## 1.0.0` 작가 계약 한 줄.
Out of scope: kit 렌더 동작(`iconOr`, `LTT.icon`) 변경. 부품 인자(그룹 B: `LTT.facts`·`chips`·`callout`·diagram 노드·sequence 배우의 `icon`). 다른 장면 타입의 같은 이름 필드. 버전 번호(커밋 `77c3ece`에서 끝남). npm publish·push.

# Paths
Implementation: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/api/rules.md, skills/learn-to-tell/kit/CHANGELOG.md
Tests: tests/lint-rules.test.mjs, tests/api-docs.test.mjs
Test command: npm test && LTT_AUDIT=1 node --test tests/gallery-audit.test.mjs && npm run check:css
Review evidence: none — 모든 관찰 대상(경고 목록, 문서 행)이 자동 테스트로 읽힌다.
Fuzzing: none — `lintDeck`은 순수 함수이고 값 종류가 유한(VO-1 결정표)하다. 결정표가 typeof 분할을 모두 덮는다.
Mutation tool: none — Stryker 미설치(run 6cc24f891a69c407 기록). 손 변이 8–10개를 main이 고른다.

# Signatures
`LTT.lintDeck(spec) → [{scene, rule, msg}]` (변경 없음; 새 rule 값 `"icon-not-string"`)
`RULES` 항목 `{ id: "icon-not-string", scene: function (s, i) → [[i, "icon-not-string", msg], ...] }`

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `type: "hook"` 장면의 `art`가 truthy이고 문자열이 아니면 그 장면에 `icon-not-string` 경고 1개 | must | 사용자 결정(그룹 A) |
| FR-2 | `type: "explain"` 장면의 `steps`가 배열이면, `icon`이 truthy이고 문자열이 아닌 단계마다 경고 1개, 배열 순서대로 | must | 사용자 결정(그룹 A) |
| FR-3 | `type: "terms"` 장면의 `terms`가 배열이면, `icon`이 truthy이고 문자열이 아닌 항목마다 경고 1개, 배열 순서대로 | must | 사용자 결정(그룹 A) |
| FR-4 | 문자열(아이콘 이름·HTML·이모지·빈 칸 아닌 아무 문자열)과 falsy 값(`undefined`·`null`·`""`·`0`·`false`)은 경고하지 않는다 | must | brief 기본값(kit이 falsy는 그리지 않음) |
| FR-5 | 경고 `msg`는 필드 경로(`art`, `steps[<0-based i>].icon`, `terms[<0-based i>].icon`)와 값의 종류(배열은 `array`, 그 밖은 `typeof`)를 담는다 | must | 작가가 출력만으로 고칠 수 있어야 함(rules.md 머리말) |
| FR-6 | 다른 장면 타입(타입 없는 장면 포함)의 `art`·`steps`·`terms`·`icon`은 보지 않는다 | must | 범위 |
| FR-7 | 규칙은 장면 규칙 중 마지막(`filler-content` 뒤)에 등록된다. 한 장면 안에서 기존 장면 경고 뒤, 덱 경고 앞에 나온다 | must | brief 기본값 |
| FR-8 | `kit/api/rules.md` lint 표에 첫 칸 `` `icon-not-string` ``, 등급 `고침`, 뜻(대상 필드 셋)을 담은 행 | must | 문서 관례 |
| FR-9 | `kit/CHANGELOG.md` `## 1.0.0` 절에 `icon-not-string`을 적은 한 줄 | must | 사용자 결정(1.0.0) |

# Errors
- explain `steps`가 배열이 아니거나(없음·객체·문자열) 원소가 `null`·원시값 — `lintDeck`이 throw하지 않고 그 장면에서 `icon-not-string` 경고를 내지 않는다 — 다른 규칙의 경고는 base_commit과 같다(지금도 throw하지 않음).
- terms `terms`가 배열이 아니거나 원소가 `null`이면 기존 `terms-entries`·용어 수집이 base_commit에서 이미 throw한다. 이 run의 범위 밖이며 동작을 바꾸지 않는다.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | hook `art: "rocket"`, `art: "<svg></svg>"`, `art: "🚀"` | `icon-not-string` 없음 |
| C-2 | normal | hook `art: () => "x"` | 그 장면 번호로 `icon-not-string` 1개, msg에 `art`와 `function` |
| C-3 | normal | explain `steps: [{icon: "a"}, {icon: {}}, {icon: [1]}]` | 경고 2개, 순서대로 msg에 `steps[1].icon`·`object`, `steps[2].icon`·`array` |
| C-4 | normal | terms `terms: [{key:"k", plain:"p", visual:false, icon: 3}]` | 경고 1개, msg에 `terms[0].icon`·`number` |
| C-5 | boundary | 세 필드에 각각 `undefined`, `null`, `""`, `0`, `false`; 그리고 `true`, `1` | falsy 다섯은 경고 없음; `true`(`boolean`), `1`(`number`)은 경고 |
| C-6 | edge | `figure`·`statement`·`predict`·`compare`·타입 없는 장면에 `art: fn`, `steps: [{icon: fn}]`, `terms: [{icon: fn}]`; hook의 `icon: fn` | `icon-not-string` 없음 |
| C-7 | edge | 한 장면에 `no-title`·`filler-content`와 `icon-not-string`이 함께, 덱 규칙 경고도 있음 | 출력 순서: 그 장면의 기존 경고 → `icon-not-string` → 다음 장면 → 덱 경고 |
| C-8 | error | explain `steps: "x"`, `steps: {}`, `steps: [null, 3]` | throw 없음, `icon-not-string` 없음, 나머지 경고는 같은 덱의 base_commit 출력과 같음 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | FR-1..FR-9 |
| Performance efficiency | no | 장면당 필드 몇 개를 한 번 훑는다; lint 전체 비용에 무시할 만함 |
| Compatibility | yes | 기존 규칙 출력·gallery 기준선과 공존 |
| Interaction capability | yes | 경고만 보고 고칠 수 있어야 함(FR-5) |
| Reliability | yes | 잘못된 모양의 spec에도 throw하지 않음(Errors) |
| Security | no | 값을 읽고 typeof만 본다; 실행·출력 삽입 없음 |
| Maintainability | yes | 기존 `RULES` 레지스트리·rules.md 표 관례를 따름 |
| Flexibility | no | 환경·설치 변화 없음 |
| Safety | no | 물리·사람 위해 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Interaction capability / self-descriptiveness | `icon-not-string` msg | C-2..C-5 각 경고 msg에 기대 경로 토큰과 종류 토큰이 있는 비율 | 100%, 높을수록 | automated (VO-1), mutation | FR-5 |
| QR-2 | Reliability / fault tolerance | C-8 입력 | throw한 입력 수 / C-8 입력 수 | 0, 낮을수록 | automated (VO-5), mutation | Errors |
| QR-3 | Compatibility / co-existence | 기존 lint 테스트, gallery 수업 | Test command의 기존 테스트 실패 수, gallery audit 기준선 대비 증가 경고 수 | 둘 다 0 | automated (VO-7) | UI-2 |
| QR-4 | Maintainability / modifiability | 규칙 등록 위치·문서 | rules.md 행·등급, CHANGELOG 줄, `LINT_IDS` 목록 일치 | 모두 일치 | automated (VO-6) | FR-8, FR-9 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1..FR-5, C-1..C-5, QR-1 | `LTT.lintDeck` 반환값, `rule === "icon-not-string"` 항목 | unit (`vm`으로 ltt.js 로드, 기존 `lint` 헬퍼 관례) | decision table testing | 필드 F ∈ {hook.art, explain.steps[i].icon, terms.terms[i].icon} × 값 종류 V ∈ {V1 아이콘 이름 문자열, V2 HTML 문자열, V3 function, V4 plain object, V5 array, V6 0 아닌 number, V7 true, V8 undefined, V9 null, V10 "", V11 0, V12 false}: 36 규칙 DT-F-V | 100% | V1,V2,V8..V12 → 경고 0; V3..V7 → 경고 1, scene 번호 = 그 장면 1-based, msg에 경로 토큰과 종류 토큰(function, object, array, number, boolean) | Test command |
| VO-2 | FR-6, C-6 | 같은 반환값 | unit | equivalence partitioning | EP-1 figure, EP-2 statement, EP-3 predict, EP-4 compare, EP-5 타입 없는 장면(`mount` 포함) 각각에 art·steps·terms 함수 값; EP-6 hook의 `icon` 함수 값 | 100% | `icon-not-string` 0개 | Test command |
| VO-3 | FR-2, FR-3, C-3 | 같은 반환값 | unit | boundary value analysis (2-value) | 배열 내 잘못된 원소 개수 BV-0, BV-1, BV-2(첫·마지막 위치), 덱에 잘못된 장면 2개 BV-S2 | 100% | 경고 수 = 잘못된 원소 수, 원소 순서·장면 순서대로, 경로 인덱스가 0-based 위치와 일치 | Test command |
| VO-4 | FR-7, C-7 | 경고 배열 전체 순서 | unit | scenario testing | SC-1 한 장면에 no-title·filler-content·icon-not-string, 다음 장면 경고, 덱 경고(no-theme 등) | 100% | `[scene, rule]` 배열이 정확히 기대 순서; 기존 VO-5 C-12 순서 테스트 통과 유지 | Test command |
| VO-5 | Errors, C-8, QR-2 | `lintDeck` 호출 | unit | equivalence partitioning | ER-1 steps 문자열, ER-2 steps 객체, ER-3 steps `[null, 3]` | 100% | throw 없음, `icon-not-string` 0개, 전체 `[scene, rule]` 출력 = `[[0,"no-signature"],[0,"keywords-last"]]`(theme "paper", 그 장면 하나인 덱) | Test command |
| VO-6 | FR-8, FR-9, QR-4 | `kit/api/rules.md`, `kit/CHANGELOG.md`, `tests/api-docs.test.mjs` `LINT_IDS` | unit (문서 파싱) | equivalence partitioning | D-1 rules.md 첫 칸 `icon-not-string` 행 정확히 1개, 등급 `고침`, 뜻 칸에 `art`·`icon` 토큰; D-2 CHANGELOG `## 1.0.0` 절에 `icon-not-string` 한 줄; D-3 `LINT_IDS`에 새 id | 100% | 모두 성립 | Test command |
| VO-7 | QR-3, UI-2 | 저장소 전체 | integration | equivalence partitioning | 전체 suite, gallery audit 기준선 | 100% | Test command 통과, gallery 기준선 증가 0 | Test command |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | approval |
| --- | --- | --- | --- |
| A-1 | 규칙 id `icon-not-string`(kebab-case) | 기존 RULES id 관례 | user answer(이해 확인 "승인") |
| A-2 | falsy 값은 통과, truthy 비문자열만 경고 | `ltt-deck.js` 렌더가 falsy면 아무것도 그리지 않음(`if (!s.art)`, `st.icon ?`, `t.icon ?`) | user answer(이해 확인 "승인") |
| A-3 | 장면 규칙 맨 끝에 등록 | 기존 출력 순서 보존 | user answer(이해 확인 "승인") |
| A-4 | 경로 인덱스는 0-based, 종류는 배열이면 `array` 그 밖은 `typeof` | 작가가 쓰는 JS 배열 인덱스와 일치. 사용자에게 보이는 msg 문구는 테스트가 토큰만 확인 | brief v1 — approved |
| A-5 | 그룹 B 제외 | lint가 볼 수 없는 런타임 값 | user answer |
| A-6 | 손 변이 8–10, 변이 도구·fuzz 없음 | Stryker 미설치, 유한 값 분할 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-2, C-5 | VO-1 | Test command |
| FR-2 | C-3, C-5 | VO-1, VO-3 | Test command |
| FR-3 | C-4, C-5 | VO-1, VO-3 | Test command |
| FR-4 | C-1, C-5 | VO-1 | Test command |
| FR-5 | C-2..C-5 | VO-1, VO-3 | Test command |
| FR-6 | C-6 | VO-2 | Test command |
| FR-7 | C-7 | VO-4 | Test command |
| FR-8, FR-9 | — | VO-6 | Test command |
| Errors | C-8 | VO-5 | Test command |
| QR-1 | C-2..C-5 | VO-1 | Test command |
| QR-2 | C-8 | VO-5 | Test command |
| QR-3 | — | VO-7 | Test command |
| QR-4 | — | VO-6 | Test command |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 0 |
| verifier invocations | 1 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1..VO-6 | 1 | tests/lint-rules.test.mjs `84c0 VO-1..VO-5`, tests/api-docs.test.mjs `84c0 VO-6` + `LINT_IDS`; Test command run 1 | accepted (verifier 1) | HM-1..HM-12 KILLED (spec-logs/84c07bf1dc6566cb-hand-mutations.txt) | ltt.js icon-not-string 규칙, rules.md 행, CHANGELOG 1.0.0 줄 |
| VO-7 | 1 | Test command run 1: npm test 1281/1281, gallery audit 1/1, css in sync (5 pairs) | accepted (verifier 1) | — | 저장소 전체 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| TC-1 | Test command 1회차 | — | — | 1281/1281, gallery 1/1, css in sync. 테스트 작성자 보고: 구현이 먼저 들어와 새 테스트가 처음부터 통과(실패 단계 관찰 없음) — 손 변이 12개로 보완 |
| verify-1 | verifier 1 pass, 차단 0. ADV-1: `art` 경로 토큰이 부분 문자열 일치라 "start" 같은 단어에도 맞음 | — | 권고로 둠(비차단) | VO-1..VO-7 accepted |
| mutate-1 | HM-1..HM-12 | — | spec-logs/84c07bf1dc6566cb-hand-mutations.txt | 12/12 KILLED, 복원 확인. 변이 도구·fuzz 없음(spec 사유) |

# Version Log
## v1
- 완료: verifier 1 pass, HM-1..HM-12 KILLED, ADV-1 권고.
- 초안. handoff d422e4de167b576d와 사용자 결정(그룹 A, 1.0.0은 별도 커밋 77c3ece)에서 작성.
