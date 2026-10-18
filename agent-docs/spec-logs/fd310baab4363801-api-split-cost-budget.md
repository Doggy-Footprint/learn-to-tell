---
version: 4
run_id: fd310baab4363801
status: limit
base_commit: b514c52bc42039a27860636919b3a6cc6a2d68e7
max_verifier_invocations: 2
handoff: agent-docs/handoff/a3a320e98302b058-refactoring-2-api-core-and-part-docs.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 사용자(학습자), skill 운영자 | 학습 자료를 직접 요청하는 것보다 빠르고 적은 토큰으로 수업을 만든다 (intent 1) | 수업 작가(agent)가 매 수업 읽는 kit 문서가 기존 `kit/API.md` 전체(22,944자)보다 줄고, 고른 부품의 문서만 더 읽는다 |
| UI-2 | skill 운영자 | 수업 생성 비용을 기록해 intent 1을 측정 가능하게 한다 (refactoring-1) | `result.md` 템플릿과 standalone 결과 블록에 "생성 비용" 항목이 있다 |
| UI-3 | 사용자, skill 운영자 | 장면 수 기본값으로 쓰기·검증 비용을 줄이되 한 챕터 전체는 명시적으로만 늘린다 (refactoring-3) | SKILL.md §2에 기본 예산과 초과 시 알림 규칙이 있다 |
| UI-4 | kit 개발자 | 라이브러리가 커져도 문서와 코드가 어긋나지 않는다 | `LTT` 공개 이름이 문서 없이 추가되거나 두 곳에 정의되면 `npm test`가 실패한다 |

# Scope
In scope:
- `skills/learn-to-tell/kit/API.md`를 핵심 문서로 줄이고, 옮긴 내용을 `skills/learn-to-tell/kit/api/`의 10개 파일(base, diagram, sequence, map, controls, charts, ui, mock, deck-contracts, internals)로 이동한다(삭제 없음).
- SKILL.md §2(장면 기본 예산), §3.1(읽기 규칙), §3.3 부품 표(참조 열), §3 "### kit" 문단, §5(`result.md` 생성 비용 항목)를 고친다.
- `standalone.md`에 생성 비용 항목(서브에이전트·브라우저는 "해당 없음")을 넣는다.
- `site/gallery/catalog.html`에 `api-<part>` anchor 8개를 넣는다. 데모는 옮기지 않는다. catalog·index의 "`kit/API.md`" 안내 문장도 kit/api/를 가리키게 고친다.
- `packages/ltt-kit/package.json` `files`에 `api/`를 넣는다. `scripts/build.mjs kit`은 복사 전에 패키지의 `api/`를 지운다.
- `learn-to-tell-PROJECT.md` §3 범위에 장면 수 기본값 한 줄을 넣고, line 91·§5의 API.md 언급을 "API.md + kit/api/"로 고친다.
- 새 영구 테스트 `tests/api-docs.test.mjs`(공개 이름 정의·크기 상한·구조·SKILL 토큰·catalog·배포 검사). 이번 이동 전용 테스트 `tests/api-docs-preservation.test.mjs`와 fixture `tests/fixtures/api-md-base-codespans.json`은 내용 보존(FR-4) 검사만 맡는다.
- 종료 시(main, status complete일 때만): `tests/api-docs-preservation.test.mjs`를 `agent-docs/spec-logs/fd310baab4363801-api-docs-preservation.test.mjs`로, fixture를 `agent-docs/spec-logs/fd310baab4363801-api-md-base-codespans.json`으로 옮긴다. 옮긴 사실은 Execution ledger와 Version Log에 적는다. 이유: 옛 span을 영구히 요구하면 refactoring-4가 문서를 고칠 때 바로 깨진다.
- 종료 시(main): refactoring-2·3 handoff에 Execution Ledger 한 줄을 넣고 stale로 옮긴다. refactoring-1 handoff는 State와 Next Step만 갱신하고 열어 둔다.

Out of scope: kit JS 동작 변경, `api.mjs show` CLI, lint 규칙 `scene-budget`, 짧은 덱 tier, `ltt-meta` 변경, 기준선 실험과 비용 기록 누적 비교, 버전 올리기·릴리스, refactoring-4의 ctx 프로토콜 본문, catalog 데모 재배치, gallery 수업 페이지.

# Paths
Implementation: skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/standalone.md, site/gallery/catalog.html, site/gallery/index.html, packages/ltt-kit/package.json, scripts/build.mjs, learn-to-tell-PROJECT.md
Tests: tests/api-docs.test.mjs, tests/api-docs-preservation.test.mjs, tests/fixtures/api-md-base-codespans.json
Test command: npm test
Review evidence: R-1 내용 보존 대조, R-2 catalog anchor DOM 확인, R-3 읽기 바이트 측정(아래 Verification Obligations). 산출물은 이 spec의 Execution ledger에 기록한다.
Fuzzing: none — 입력 표면이 없다. 바뀌는 것은 정적 Markdown·HTML 문서, package.json 한 줄, build 스크립트 한 줄이고, 새 테스트는 저장소 파일을 읽는 결정적 정적 검사다.
Mutation tool: none — Stryker 같은 도구는 Markdown·HTML·JSON을 변이하지 못한다. 변이할 수 있는 JS 변경은 build.mjs 한 줄뿐이다. 대신 hand mutation 10건(HM-1..HM-10)을 둔다.

# Signatures
공통 정의:
- **문서 집합 D** = `skills/learn-to-tell/kit/API.md`(핵심)와 `skills/learn-to-tell/kit/api/*.md` 전부.
- **글자 수** = 파일을 UTF-8로 읽은 문자열의 code point 수(`[...text].length`).
- **표 행** = `|`로 시작하는 줄 중 구분선(`| --- |` 형태)이 아닌 줄. **첫 칸** = 줄 첫 `|` 뒤부터 이스케이프되지 않은 다음 `|`(즉 `\|`가 아닌 것) 앞까지.
- **정의**: 어떤 파일의 어떤 표 행 첫 칸 안의 code span(`` `...` ``)에 `LTT.<name>`(name = `[A-Za-z_$][\w$]*`, `LTT.mock.phone`이면 `mock`)이 있으면, 그 파일이 `<name>`을 정의한다. 한 칸에 여러 이름이 있으면 모두 정의된 것으로 센다. 산문이나 다른 칸의 언급은 정의가 아니다.
- **공개 이름 집합 N** = node `vm`의 새 context(`console` stub만 둠)에서 `kit/vendor/d3.min.js`, `ltt.js`, `ltt-parts.js`, `ltt-ui.js`, `ltt-mock.js`, `ltt-deck.js`를 차례로 실행한 뒤의 `Object.keys(context.LTT)`. 기준 커밋에서는 73개다. 이 값을 테스트에 박아 두지 않는다. 이 순서로 불러올 때 오류 없이 실행됨을 기준 커밋에서 확인했다.

이름별 정의 파일 (기준 커밋의 73개 전부):
| 파일 | 이름 |
| --- | --- |
| `kit/API.md` | theme, themes, palette, mark, marks, icon, icons, expect, record, lintDeck, math, MOTION_MS, deck |
| `kit/api/base.md` | themeTokens, summaryCards, linkTerms, warn |
| `kit/api/ui.md` | narration, annotate, beforeAfter, facts, chips, badge, callout, swatches, takeaway, chartFrame, inspector, redline, h, fill, contrast |
| `kit/api/mock.md` | mock |
| `kit/api/diagram.md` | diagram, graphOverlaps, diagramLayout, autoLayout, state, stateSpec |
| `kit/api/sequence.md` | sequence, sequenceLayout |
| `kit/api/map.md` | map |
| `kit/api/controls.md` | sweep, drag, predict, stepper, sim, tween |
| `kit/api/charts.md` | axisPlot, hbars, lanes, sankey, plot, plotTheme, plane, units, bar |
| `kit/api/internals.md` | kitBase, lessonId, compare, termsIn, sceneText, termIndex, rectHit, freeSlot, stepValues, goalReach, setGlossary, auditScene, mobile, measure, $, deckTypes |
| `kit/api/deck-contracts.md` | (정의하는 이름 없음) |

파일별 첫 줄 (파일의 첫 비어 있지 않은 줄):
- 부품 문서 8개(`base`, `ui`, `mock`, `diagram`, `sequence`, `map`, `controls`, `charts`)의 첫 줄에는 `언제`, `vendor`, `catalog.html#api-<파일 이름>`이 모두 들어 있다. vendor가 필요 없으면 `vendor 없음`처럼 적는다.
- `deck-contracts.md` 첫 줄에는 `언제`, `steps`, `answerVisual`이 들어 있다.
- `internals.md` 첫 줄에는 `kit 개발자용`과 `수업에서 부르지 않`이 들어 있다.

핵심 `kit/API.md`:
- 글자 수 ≤ 8,500(목표 8,000 안팎).
- 첫 ```` ```html ```` 블록의 `<script src>`·`<link href>` 값이 기준 커밋 API.md 같은 블록의 값과 같은 집합이고 순서도 같다.
- 테마 표: `LTT.themes`의 각 `name`(8개)이 표 행 첫 칸 code span으로 나온다.
- lint 규칙 표: `unknown-term, used-before-defined, predict-new-term, no-reading-guide, no-title, overview-missing, overview-order, overview-no-visual, keywords-last, unused-term, term-no-visual, summary-no-recall, card-monotony, no-signature, no-theme, unknown-theme, filler-content`(17개)이 각각 어떤 표 행 첫 칸 code span에 나온다.
- audit 규칙 표: `overflow, shrunk, small-visual, loose-figure, empty-stage, many-sizes, hscroll, graph-overlap, panel-overlap, goal-unreachable, goal-narrow, goal-at-start`(12개)이 각각 어떤 표 행 첫 칸 code span에 나온다.
- 장면 타입 표: `hook, terms, explain, figure, overview, statement, contrast, compare, predict, summary, keywords`(11개)와 `(없음)`이 각각 한 행의 첫 칸이다. 이 행들과 공통 필드 표의 행은 각각 300자 이하다.
- 한 줄에 `steps`, `answerVisual`, `kit/api/deck-contracts.md`가 함께 나온다.
- `kit/api/<f>.md`라는 경로 문자열이 f ∈ {base, ui, mock, diagram, sequence, map, controls, charts, deck-contracts} 각각에 대해 나온다. `internals.md`는 나오지 않는다.
- 문단 제목 `원칙`(`## 원칙` 또는 `### 원칙`)이 있다.

내용 보존:
- fixture `tests/fixtures/api-md-base-codespans.json`은 `git show b514c52:skills/learn-to-tell/kit/API.md`에서 fenced block을 뺀 본문의 서로 다른 code span 텍스트 배열이다(기준 커밋에서 454개). 각 텍스트의 `\|`는 `|`로 바꿔 둔다.
- 새 문서 집합 D의 code span에서도 같은 방식(`\|` → `|`)으로 텍스트를 모은다. fixture의 모든 텍스트가 이 모음에 있어야 한다.

catalog:
- `site/gallery/catalog.html` 원문에 `api-<p>`가 따옴표로 감싼 문자열(`"api-<p>"` 또는 `'api-<p>'`, 즉 `id="api-<p>"` 속성이거나 JS 문자열)로 정확히 한 번 나온다. p ∈ {base, ui, mock, diagram, sequence, map, controls, charts}.
- 기존 `group("움직이는 그림 · ltt-parts.js")`, `group("장면 덱 · ltt-deck.js")`, `demo("math"`와 그 순서는 그대로다(VO-4).

SKILL.md (`## N` 제목부터 다음 `## ` 제목 앞까지가 §N이다. tests/map/skill.test.mjs의 `section()`과 같은 정의):
- §2에 아래 각 Bn의 토큰을 모두 담은 줄이 하나 이상 있다. 서로 다른 Bn이 같은 줄을 써도 된다.
  - B1: `기본 예산`, `결정 변수마다 장면 4개 이하`, `8~10장면`
  - B2: `한 챕터 전체`, `길게`, `3개 이상`, `늘린다`
  - B3: `상한이 아니라 기본값`, `v0`, `하한`
  - B4: `예산을 넘기면`, `장면 수와 이유`, `묻지 않는다`
- §2에는 `scene-budget`이 없다.
- §3에 `kit/API.md`, `kit/api/<part>.md`, `만 읽는다`를 모두 담은 줄이 있다.
- §3에 머리 행 `| 보여 줄 것 | 부품 | 참조 |`인 표가 있다(SKILL.md의 이 표는 목록 항목 안에 들여쓰여 있으므로, SKILL.md 표의 행과 머리 행은 앞 공백을 지운 뒤 판정한다. 공통 정의의 "`|`로 시작하는 줄"은 문서 집합 D에만 적용한다). 그 표의 각 데이터 행 셋째 칸에는 `` `kit/api/X.md` ``(X ∈ {diagram, sequence, map, controls, charts, ui, mock}) 또는 `` `kit/API.md` ``가 하나 이상 있다.
- SKILL.md 어디에도 `internals.md`가 없다.
- §5의 ```` ```markdown ```` 템플릿 블록 안에 `- 생성 비용:`으로 시작하는 줄이 있다. 그 줄부터 블록 끝까지에 `읽은 문서`, `바이트`, `lesson.html`, `장면 수`, `결정 변수 수`, `기대값`, `주장 검토`, `독자 검토`, `눈 검토`, `audit`, `스크린샷`, `시작`, `공개`, `토큰`이 모두 나온다.
- §5의 템플릿 블록 밖에 `생성 비용`과 `한 번`을 담은 줄, `transcript`와 `바이트`를 담은 줄이 있다.
- 기존 VO-16 테스트(§5 frontmatter 순서 등)는 그대로 통과한다.

standalone.md: 한 줄에 `생성 비용`, `해당 없음`, `서브에이전트`, `브라우저`가 함께 나온다.

learn-to-tell-PROJECT.md: `### 범위` 절(다음 `###` 또는 `##` 앞까지)에 `장면 수`, `기본값`, `상한이 아니`를 담은 줄이 있다. 파일 안에 `kit/api/`가 두 번 이상 나온다(line 91 근처와 §5).

배포:
- `packages/ltt-kit/package.json` `files`에 `"api/"`가 있다.
- `node scripts/build.mjs kit` 실행 뒤 `packages/ltt-kit/api/`에 kit/api의 10개 파일이 모두 있다. 실행 전에 심어 둔 `packages/ltt-kit/api/zz-stale.md`는 사라진다. 이어서 `packages/ltt-kit`에서 `npm pack --dry-run --json`을 실행하면 `api/controls.md`와 `API.md`가 목록에 나온다.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | N의 모든 이름은 D 안에서 정확히 한 파일이 정의한다 | must | user answer (refactoring-2 자동 검사) |
| FR-2 | 기준 73개 이름은 Signatures의 이름별 정의 파일에 정의된다 | must | user answer 1·2 |
| FR-3 | 핵심 API.md는 8,500자 이하이고 Signatures의 핵심 구성(불러오기 블록, 테마·lint·audit·장면 타입·공통 필드 표, deck-contracts 안내 줄, 부품 문서 경로, 원칙)을 갖춘다 | must | user answer 1 |
| FR-4 | 기준 API.md의 code span은 모두 D 어딘가에 남는다(이동, 삭제 없음) | must | user decision "삭제가 아니라 이동" |
| FR-5 | 부품 문서 8개, deck-contracts, internals의 첫 줄이 Signatures의 형식을 따른다. deck-contracts는 작가 계약만, internals는 개발자용 이름만 담는다 | must | user answer 2 |
| FR-6 | catalog에 `api-<p>` anchor 8개가 정확히 한 번씩 있고, VO-4 구조는 유지된다 | must | user decision (catalog anchor), brief v1 |
| FR-7 | SKILL.md §3이 핵심과 고른 부품 문서만 읽게 하고, 부품 표에 참조 열이 있으며, internals.md를 가리키지 않는다 | must | user decision (refactoring-2), user answer 2 |
| FR-8 | SKILL.md §2에 기본 예산 B1~B4가 있고 `scene-budget`은 없다 | must | user decision (refactoring-3) |
| FR-9 | SKILL.md §5 템플릿에 생성 비용 항목과 하위 값이 있고, 템플릿 밖에 "§5에서 한 번"과 transcript 대체 규칙이 있다 | must | user decision (refactoring-1) |
| FR-10 | standalone.md에 생성 비용 항목이 있고 서브에이전트·브라우저 항목은 "해당 없음"이다 | must | user decision (refactoring-1) |
| FR-11 | PROJECT.md §3 범위에 장면 수 기본값 한 줄이 있고, API.md 언급이 kit/api/를 함께 가리킨다 | must | user answer 3 |
| FR-12 | kit 패키지에 api/가 포함되고, build kit이 오래된 api 파일을 남기지 않는다 | must | user decision (배포), brief v1 |

# Errors
- 공개 이름이 D 어디에도 정의되지 않음 → 테스트가 그 이름을 대며 실패한다. 파일은 바뀌지 않는다.
- 공개 이름이 둘 이상의 파일에 정의됨 → 테스트가 이름과 파일 목록을 대며 실패한다.
- API.md가 8,500자를 넘음 → 테스트가 실제 글자 수와 상한을 대며 실패한다.
- 기준 code span이 사라짐 → 테스트가 사라진 span을 나열하며 실패한다.
- 필수 토큰(B1~B4, 생성 비용 하위 값, standalone 줄, PROJECT 줄)이 빠짐 → 테스트가 빠진 항목 id와 토큰을 대며 실패한다.
- catalog anchor가 없거나 중복됨 → 테스트가 anchor 이름과 출현 횟수를 대며 실패한다.
- build kit이 실패하거나 stale 파일을 남김 → 테스트가 남은 파일이나 build의 stderr를 보이며 실패한다. `packages/ltt-kit/`는 gitignore 대상이라 저장소 상태는 더럽혀지지 않는다.
- `npm pack --dry-run`을 쓸 수 없음(npm 없음) → 그 하위 검사만 실패로 보고한다. 건너뛰지 않는다.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 작업 완료 후의 저장소 | FR-1..FR-12 검사가 모두 통과한다 |
| C-2 | boundary | 검사 함수에 글자 수 8,500인 문자열 / 8,501인 문자열 | 8,500은 통과, 8,501은 실패 |
| C-3 | boundary | 정의 판정 함수에 이름 x를 정의한 파일이 0개 / 1개 / 2개인 합성 문서 집합 | 0개는 "없음", 1개는 통과, 2개는 "중복"으로 실패 |
| C-4 | edge | 합성 문서: `` `LTT.mock.phone(o)` ``, `` `LTT.theme(name)`, `LTT.themes` `` 첫 칸, `` `LTT.$` `` 첫 칸, `` `LTT.narration(html \| [html])` ``처럼 `\|`가 든 첫 칸 | 각각 mock / theme·themes / $ / narration을 정의한 것으로 센다 |
| C-5 | edge | 합성 문서: 산문 줄이나 표의 둘째 칸에만 `` `LTT.diagram` ``이 있음 | 정의로 세지 않는다 |
| C-6 | error | 합성 상황: N에 문서 없는 이름 `newThing`이 추가됨 | FR-1 검사가 `newThing`을 대며 실패 |
| C-7 | error | 합성 fixture에 D에 없는 span `zz-missing`이 있음 | FR-4 검사가 `zz-missing`을 대며 실패 |
| C-8 | edge | build kit 전에 `packages/ltt-kit/api/zz-stale.md`를 심음 | 실행 뒤 그 파일은 없고 kit/api의 10개 파일은 있다 |
| C-9 | boundary | B1~B4: 한 줄에 토큰이 다 있음 / 토큰이 두 줄에 나뉘어 있음(합성 텍스트) | 한 줄이면 통과, 나뉘면 실패 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 문서 분할, 템플릿 항목, 예산 규칙이 user decision과 맞아야 한다 |
| Performance efficiency | yes | intent 1의 본체다. 작가가 읽는 kit 문서 글자 수(자원 활용) |
| Compatibility | yes | 기존 테스트(VO-4, VO-16), standalone.md의 "API.md 불러오기 순서" 참조, npm 패키지·skill zip 내용과 공존해야 한다 |
| Interaction capability | yes | 문서의 "사용자"는 수업 작가 agent다. 무엇을 언제 읽을지 알 수 있어야 한다(학습성: 첫 줄의 언제·vendor·catalog 링크, SKILL 참조 열) |
| Reliability | no | 실행 시 동작이 바뀌는 코드가 없다. build의 stale 정리는 Compatibility(QR-C2)에서 다룬다 |
| Security | no | 입력 표면, 비밀 정보, 권한 경계가 없다 |
| Maintainability | yes | 문서와 코드의 동기화 검사(FR-1)가 kit 확장 시 수정 용이성과 시험 용이성을 지킨다 |
| Flexibility | no | 설치·이식 환경이 바뀌지 않는다. 패키지 포함은 Compatibility에서 다룬다 |
| Safety | no | 물리적·인명 위험이 없다 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-P1 | Performance efficiency / resource utilization | 수업마다 항상 읽는 핵심 문서 | `kit/API.md` code point 수 | ≤ 8,500 (작을수록 좋음) | automated VO-3; mutation HM-4 | user answer 1 |
| QR-P2 | Performance efficiency / resource utilization | 부품 문서를 두 개 고른 수업의 최악 경우 | API.md 글자 수 + 7개 부품 문서(ui, mock, diagram, sequence, map, controls, charts) 중 가장 큰 두 개의 글자 수 | ≤ 18,000 (기존 API.md 22,944의 약 78%, 작을수록 좋음) | automated VO-3; review R-3 | brief v1 |
| QR-C1 | Compatibility / co-existence | 기존 테스트 스위트와 문서 참조 | `npm test` 전체(기존 361개 + 새 검사) | 실패 0 | automated (Test command) | 기존 동작 보존 |
| QR-C2 | Compatibility / interoperability | npm 패키지와 build | build kit 후 패키지 api/ 내용, `npm pack --dry-run` 목록 | kit/api의 10개 파일 = 패키지 api/의 파일, stale 0개, pack 목록에 api/ 포함 | automated VO-8; mutation HM-7, HM-8 | user decision (배포) |
| QR-I1 | Interaction capability / learnability | 작가가 부품 문서를 고르고 실물을 찾는 일 | 부품 문서 8개의 첫 줄 형식, SKILL 참조 열 | 10개 파일 모두 형식 충족, 참조 열 행 100% | automated VO-4, VO-6 | user decision (부품 문서 첫 줄) |
| QR-M1 | Maintainability / modifiability·testability | kit에 공개 이름 추가·이동 | N 중 정의 파일이 정확히 1개인 이름의 비율 | 100% | automated VO-1; mutation HM-1, HM-2, HM-3 | user decision (자동 검사) |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, QR-M1, C-1, C-3, C-4, C-5, C-6 | 정의 판정 함수와 실제 문서 집합 D, 실제 N | unit(합성 입력) + integration(실제 파일). 실제 N의 모든 이름 | equivalence partitioning | EP-0(정의 0곳), EP-1(1곳), EP-2(2곳 이상); 첫 칸 형태 F-call(`LTT.x(...)`), F-multi(한 칸 여러 이름), F-mock(`LTT.mock.y`), F-dollar(`LTT.$`), F-pipe(`\|` 포함); 비정의 위치 X-prose, X-cell2 | 100% | EP-0·EP-2는 해당 이름을 담은 메시지로 실패하고, EP-1은 통과한다. F-*는 정의로 세고 X-*는 세지 않는다. 실제 D·N에서는 모든 이름이 EP-1이다 | tests/api-docs.test.mjs |
| VO-2 | FR-2 | 실제 D, 기준 73개 이름 | integration, Signatures 표의 전 이름 | equivalence partitioning(파일별 클래스) | 정의 파일 11개(deck-contracts는 "정의 없음" 클래스) | 100% | 이름마다 정의 파일이 표와 같다. deck-contracts.md는 아무 이름도 정의하지 않는다 | tests/api-docs.test.mjs |
| VO-3 | FR-3, QR-P1, QR-P2, C-2 | 크기 검사 함수와 실제 API.md, 부품 문서 | unit + integration | boundary value analysis (2-value) | 8,500/8,501(합성), 실제 API.md; QR-P2 합 18,000/18,001(합성), 실제 합 | 100% | ≤ 상한이면 통과, 상한+1이면 실제 값과 상한을 담은 메시지로 실패 | tests/api-docs.test.mjs |
| VO-4 | FR-3, FR-5, QR-I1 | 실제 API.md 구조, 10개 api 파일 첫 줄 | integration, Signatures 항목 전부 | syntax testing | 불러오기 블록 src 순서, 테마 8, lint 17, audit 12, 장면 타입 11+`(없음)`, 행 300자, deck-contracts 안내 줄, 부품 경로 9개, internals 미언급, 원칙 제목, 첫 줄 형식 10개 파일 | 100% | 항목마다 있으면 통과하고, 빠지면 항목 이름을 담아 실패 | tests/api-docs.test.mjs |
| VO-5 | FR-4, C-7 | fixture ⊆ D의 code span | integration + unit(합성 fixture) | equivalence partitioning | 보존(span 있음), 손실(span 없음) | 100% | 손실 span이 0개다. 합성 손실은 그 span 이름으로 실패 | tests/api-docs-preservation.test.mjs + fixture(이 run 동안만 tests/, complete 시 spec-logs로 이동) |
| VO-6 | FR-7, FR-8, FR-9, FR-10, FR-11, C-9 | SKILL.md §2·§3·§5, standalone.md, PROJECT.md | integration, Signatures 토큰 전부 | syntax testing | B1, B2, B3, B4, no-scene-budget, §3 읽기 줄, 참조 열(행 전부), no-internals, §5 생성 비용 블록 14 토큰, §5 한 번 줄, §5 transcript 줄, standalone 줄, PROJECT 범위 줄, PROJECT kit/api ≥2; 합성: 토큰이 한 줄 / 두 줄로 나뉨 | 100% | 항목마다 있으면 통과, 빠지면 항목 id를 담아 실패 | tests/api-docs.test.mjs |
| VO-7 | FR-6 | catalog.html 원문 | integration | equivalence partitioning | anchor 8개 × {1회(통과), 0회, 2회 이상}; 실제 파일은 8개 모두 1회 | 100% | 8개 모두 정확히 1회. VO-4(기존 gallery 테스트)는 그대로 통과 | tests/api-docs.test.mjs, 기존 tests/gallery.test.mjs |
| VO-8 | FR-12, QR-C2, C-8 | package.json, `node scripts/build.mjs kit`, `npm pack --dry-run --json` | integration(실제 프로세스 실행) | scenario testing | S1 files에 `api/`; S2 stale 파일 심기 → build → stale 제거와 10개 파일 존재; S3 pack 목록에 `api/controls.md`, `API.md` | 100% | 시나리오마다 기대 결과 | tests/api-docs.test.mjs |
| VO-9 | FR-4, FR-5 | 기준 API.md의 산문·수치(code span 밖)가 새 위치에 남았는지 | review | experience-based (error guessing) | 수치·조건 문장 손실, 엉뚱한 파일로 이동(작가 계약이 internals로 가거나 개발자 이름이 deck-contracts로 감), 의미가 바뀐 압축 | none — experience-based | 기준 API.md의 섹션·행마다 새 위치를 대조해 손실 0을 기록한다 | R-1 |
| VO-10 | FR-6 | 렌더된 catalog DOM | review | scenario testing | 8개 anchor가 DOM id로 존재, 페이지 오류 없음 | 100% | headless Chrome `--dump-dom` 출력에 `id="api-<p>"` 8개 | R-2 |
| VO-11 | QR-P2, UI-1 | 읽기 바이트 전후 | review | scenario testing | 기존 API.md 전체, 핵심만, 핵심 + 대표 부품 1개, 핵심 + 대표 부품 2개 | 100% | 수치를 기록한다. 핵심 + 2개 < 22,944 | R-3 → refactoring-2 handoff Execution Ledger |

Review procedures:
- R-1(v4 보강): 스크립트 `agent-docs/spec-logs/fd310baab4363801-r1-review.py`를 저장소 루트에서 실행해 `agent-docs/spec-logs/fd310baab4363801-r1-review-output.md`를 만든다. 출력은 기준 문장마다 한 행이다: 기준 절, 첫 칸, 기준 줄, 가장 비슷한 새 파일:줄, 단어 일치율, 숫자 일치, 극성 토큰 차이(미만·이상·초과·이하·않·없·못·뿐·모두·항상·기본·넘·아래·끈·켜·말고·대신·만·전·뒤·앞·먼저·나중). 일치율 0.6 미만이거나 숫자가 빠졌거나 극성 토큰이 다른 행은 표시되고, main이 출력 파일 끝의 판정 표에 하나씩 판정을 적는다. 이동 위치 요약(절 → 파일)으로 잘못된 파일로 간 것(작가 계약이 internals로 간 것 등)이 있는지 본다. 그 밖에 main이 `git show b514c52:skills/learn-to-tell/kit/API.md`의 섹션과 표 행마다 새 파일과 위치를 찾는다. code span 밖의 수치(78%, 88%, 10%, 22%, 35%, 60%, 7단계, 201곳, 360곳, 41곳, 2만 개, 1.6MB, 1000px, 760px, 500px, 14px, 10px, 1800ms, 44–84px, 3:1, 4.5:1 등)와 조건 문장이 남았는지 대조해 ledger에 표로 남긴다. 손실이 있으면 implementation defect다.
- R-2(v4 보강): `bash agent-docs/spec-logs/fd310baab4363801-r2-review.sh [port]`를 실행해 출력을 `agent-docs/spec-logs/fd310baab4363801-r2-review-output.txt`에 저장한다. 스크립트는 서버를 띄우고 Chrome `--headless=new --enable-logging=stderr --virtual-time-budget=8000 --window-size=1440,900 --dump-dom`으로 catalog를 연다. 기대 결과는 네 가지다. (1) `id="api-*"` 8개. (2) anchor마다 바로 뒤 데모 id가 그 부품 묶음의 데모다(A-13 위치). (3) 렌더된 `.demo` 수가 기준 커밋 소스의 `demo(` 호출 수와 같다. (4) Chrome stderr에 `Uncaught`나 오류 수준 CONSOLE 줄이 없다. 오류 관찰이 실제로 작동하는지는 양성 대조로 한 번 확인한다: deck 그룹 앞에 `throw`를 넣으면 `Uncaught`가 보이고 `.demo`가 줄어야 한다.
- R-3: 각 파일의 code point 수와 바이트 수를 잰다. 대표 부품은 갤러리 사용 빈도로 고른다(controls: sweep·stepper·tween, charts: bar·units).

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| A-1 | 생성 비용 값: 읽은 문서(이름·바이트), lesson.html 바이트·장면 수, 결정 변수 수, 서브에이전트 호출 수(기대값·주장 검토·독자 검토·눈 검토), audit 횟수·스크린샷 수, 시작·공개 시각, 토큰(transcript를 읽을 수 있을 때만, 아니면 바이트) | refactoring-1 handoff Next Step 1. transcript는 비공개 형식(PROJECT §5) | user answer |
| A-2 | SKILL.md에는 §5에서 한 번 정리하라고만 적는다 | 단계마다 재면 그것도 비용이다 | user answer |
| A-3 | standalone도 같은 항목을 쓰고 서브에이전트·브라우저 항목은 "해당 없음" | standalone은 둘 다 없다 | user answer |
| A-4 | 기준선 실험과 누적 비교는 범위 밖. refactoring-1 handoff는 열어 두고 State와 Next Step만 갱신한다 | — | user answer |
| A-5 | 장면 기본 예산 B1~B4. 상한이 아니라 기본값이며 v0에서 없앤 것은 하한이었다 | 갤러리 장면 수 중앙값 11.5(refactoring-3 ledger) | user answer |
| A-6 | `scene-budget` lint 없음, 짧은 덱 tier 보류, `ltt-meta` 불변, 결정 변수 수는 result.md에 적는다 | 경고 장치 기각 전례 | user answer |
| A-7 | API.md 상한 8,500자(목표 8,000), 드문 ltt.js 기초 이름은 `kit/api/base.md` | 핵심 목록만 압축해도 약 8,000~8,600자(main 추정) | user answer |
| A-8 | `contrast`는 `ui.md`에 둔다(inspector가 쓰는 계산이라 함께 읽힌다) | 이용 위치 기준 | brief v1 — approved |
| A-9 | 내부 이름은 `kit/api/internals.md`에 둔다(첫 줄 "kit 개발자용"). SKILL.md는 가리키지 않고 D에는 포함한다. deck-contracts는 작가 계약만 담는다 | refactoring-4가 internals에 ctx 프로토콜을 이어 적는다 | user answer |
| A-10 | `LTT.$`(ltt-parts의 getElementById 도우미), `auditScene`, `mobile`, `deckTypes`, `measure`는 internals에 둔다. `math`, `MOTION_MS`, `deck`은 핵심에 둔다 | `$`는 handoff 측정 뒤 확인된 73번째 이름. `mobile`은 폰 열람 전용 ADR상 작가가 분기할 일이 없다 | brief v1 — approved |
| A-11 | "정의" = 표 행 첫 칸의 code span 속 `LTT.<name>`. 파일 단위로 센다. 산문 언급은 허용한다 | 교차 언급을 막지 않으면서 중복 정의를 잡는다 | brief v1 — approved |
| A-12 | N은 vm에서 다섯 모듈을 불러 얻는다(정적 목록 아님). 새 이름이 생기면 자동으로 검사 대상이 된다 | 기준 커밋에서 vm 로드가 오류 없이 된다는 것을 확인했다 | brief v1 — approved |
| A-13 | catalog: 데모는 옮기지 않는다. 그룹 제목(기초·ui·mock)과 parts 그룹 안 다섯 지점에 `api-<p>` anchor를 넣는다 | VO-4가 그룹 문자열과 math 위치에 묶여 있다. parts 데모는 이미 묶음 순서로 모여 있다 | brief v1 — approved |
| A-14 | `build.mjs kit`은 복사 전에 패키지의 `api/`도 지운다. 테스트는 실제 build와 `npm pack --dry-run`을 실행한다(gitignore된 `packages/ltt-kit/` 안에서만 쓴다) | 지금은 vendor와 API.md만 지운다 | brief v1 — approved |
| A-15 | refactoring-1·3 증거는 SKILL.md, standalone.md, PROJECT.md의 정적 토큰 검사다(tests/map/skill.test.mjs와 같은 방식) | 문서 규칙이라 행동 테스트를 할 수 없다 | brief v1 — approved |
| A-16 | 내용 보존은 기준 API.md code span fixture(454개) ⊆ 새 D로 자동 검사하고, span 밖의 수치·문장은 R-1 리뷰로 본다. test 역할은 fixture를 만들 때만 기준 커밋의 API.md를 `git show`로 읽을 수 있다(작업 트리의 Implementation은 읽지 않는다) | 기준 내용은 이번 구현의 산출물이 아니라 oracle 입력이다 | vetoed → 자동 검사는 이번 이동의 증거로만 쓰고 별도 파일 `tests/api-docs-preservation.test.mjs`에 둔다. complete 시 main이 그 파일과 fixture를 `agent-docs/spec-logs/`로 옮긴다. 정의·크기 검사만 tests/에 영구로 남는다 |
| A-17 | QR-P2 상한 18,000자(핵심 + 가장 큰 부품 문서 두 개) | 핵심 8,000 + diagram 약 4,000 + controls 약 3,500 추정 | brief v1 — approved |
| A-18 | 장면 타입 표·공통 필드 표의 행은 300자 이하("행마다 한두 문장"을 측정 가능하게 정한 값) | 기존 figure 행 1,012자, predict 행 669자 | brief v1 — approved |
| A-19 | 버전을 올리지 않는다. 릴리스하지 않는다. CLI를 만들지 않는다 | 릴리스는 외부 부작용이다 | brief v1 — approved |
| A-20 | fuzz와 mutation tool은 none, hand mutation 10건. Test command `npm test`, verifier 상한 2 | 정적 문서 변경 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1, C-3, C-4, C-5, C-6 | VO-1 | tests/api-docs.test.mjs; HM-1, HM-2, HM-3 |
| FR-2 | C-1 | VO-2 | tests/api-docs.test.mjs; HM-2 |
| FR-3 | C-1, C-2 | VO-3, VO-4 | tests/api-docs.test.mjs; HM-4 |
| FR-4 | C-1, C-7 | VO-5, VO-9 | tests/api-docs-preservation.test.mjs + fixture; R-1; HM-9 |
| FR-5 | C-1 | VO-4, VO-9 | tests; R-1 |
| FR-6 | C-1 | VO-7, VO-10 | tests; R-2; HM-10 |
| FR-7 | C-1 | VO-6 | tests |
| FR-8 | C-1, C-9 | VO-6 | tests; HM-5 |
| FR-9 | C-1 | VO-6 | tests; HM-6 |
| FR-10 | C-1 | VO-6 | tests |
| FR-11 | C-1 | VO-6 | tests |
| FR-12 | C-1, C-8 | VO-8 | tests; HM-7, HM-8 |
| QR-P1 | C-2 | VO-3 | tests; HM-4 |
| QR-P2 | C-2 | VO-3, VO-11 | tests; R-3 |
| QR-C1 | C-1 | Test command | npm test |
| QR-C2 | C-8 | VO-8 | tests |
| QR-I1 | C-1 | VO-4, VO-6 | tests |
| QR-M1 | C-3, C-6 | VO-1 | tests; HM-1..HM-3 |

Hand mutations (6단계에서 하나씩 주입하고 seed.py로 복구):
- HM-1 controls.md에서 `LTT.sweep` 행 삭제 → VO-1 실패
- HM-2 API.md에 `` `LTT.diagram(svg, spec)` `` 행 추가(중복 정의) → VO-1, VO-2 실패
- HM-3 ltt-parts.js에 `LTT.newThing = tween;` 추가(문서 없음) → VO-1 실패
- HM-4 API.md 끝에 패딩을 붙여 8,501자 이상 → VO-3 실패
- HM-5 SKILL.md §2의 B1 문장 삭제 → VO-6 실패
- HM-6 SKILL.md §5 템플릿의 `- 생성 비용:` 블록 삭제 → VO-6 실패
- HM-7 package.json `files`에서 `"api/"` 삭제 → VO-8 실패
- HM-8 build.mjs의 api 정리 되돌리기 → VO-8(stale) 실패
- HM-9 charts.md에서 `` `tone: "floor"` `` 문장 삭제(이동 손실) → VO-5 실패
- HM-10 catalog.html에서 `api-controls` 삭제 → VO-7 실패

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 2 |
| verifier invocations | 2 |
| open finding ids | F-4 (VO-9 나머지) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 4 | tests/api-docs.test.mjs VO-1 C-1/C-3/C-4/C-5/C-6 (rev: correction 1) | accepted (verifier 1, verifier 2 유지) | npm test 438/438 pass; 감사 대기 | 공유 helper `definitions`/`cells`/`codeSpans` |
| VO-2 | 4 | tests/api-docs.test.mjs VO-2 (11 파일 표) | accepted (verifier 1, verifier 2 유지) | 통과; 감사 대기 | `definitions` |
| VO-3 | 4 | tests/api-docs.test.mjs VO-3 C-2, QR-P1, QR-P2 | accepted (verifier 1, verifier 2 유지) | 통과(API.md 8,455; 최악 두 부품 합 14,159) | `sizeError`/`partsSumError` |
| VO-4 | 4 | tests/api-docs.test.mjs VO-4 (`sceneTypeProblems` + 자체 테스트 2건) | accepted (verifier 2) | F-3 닫힘. HM-11로 확인(killed) | — |
| VO-5 | 4 | tests/api-docs-preservation.test.mjs + fixture(454) | accepted (verifier 1, verifier 2 유지) | 통과 | complete 시 spec-logs로 이동(A-16) |
| VO-6 | 4 | tests/api-docs.test.mjs VO-6 (참조 열 테스트는 correction 1에서 수정) | accepted (verifier 1, verifier 2 유지) | 통과 | SKILL 표 들여쓰기 규칙(v3) |
| VO-7 | 4 | tests/api-docs.test.mjs VO-7 | accepted (verifier 1, verifier 2 유지) | 통과 | — |
| VO-8 | 4 | tests/api-docs.test.mjs VO-8 S1–S3 | accepted (verifier 1, verifier 2 유지) | 통과(실제 build·npm pack) | — |
| VO-9 | 4 | spec-logs/fd310baab4363801-r1-review.py, -r1-review-output.md | open (F-4 나머지) | 스크립트가 단어 3개 미만 단위를 버린다(`len(words) >= 3`, 30행). 그래서 기준 44행 `LTT.warn(msg)`, 97행 `hscroll`, 157행 `LTT.bar(...)`, 158행 `LTT.tween(...)`과 짧은 문장들이 위치 표·판정에서 빠졌다 | verifier 2가 다시 열었다. 예산 소진으로 수정하지 않았다 |
| VO-10 | 4 | spec-logs/fd310baab4363801-r2-review.sh, -r2-review-output.txt, 양성 대조 | accepted (verifier 2) | F-5와 AD-3 닫힘 | — |
| VO-11 | 4 | R-3 (ledger attempt 2) | accepted (verifier 1, verifier 2 유지) | 수치 기록 | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | 첫 `npm test`: 438개 중 436 pass, 2 fail. F-1 `VO-4 themes`: missing이 `[]`인데 deepStrictEqual 실패 | verified: `LTT.themes.map(...).filter(...)`가 vm realm 배열이라 main realm의 `[]`와 prototype이 다르다 | test defect. vm에서 온 배열을 main realm 배열로 바꾼 뒤 비교한다. 같은 패턴(vm 배열 deepEqual)을 쓰는 다른 검사도 함께 점검한다 | correction batch 1 → test-implementer |
| 1 | F-2 `VO-6 FR-7 §3 reference column`: 머리 행을 찾지 못함 | verified: SKILL.md의 표가 목록 안에서 5칸 들여쓰여 있다(`     \| 보여 줄 것 \| 부품 \| 참조 \|`). spec이 SKILL 표의 들여쓰기를 정하지 않았다 | spec v3 contract-only 명확화(SKILL 표는 앞 공백을 지운 뒤 판정), test defect | correction batch 1 → test-implementer |
| 1 | implementer challenge: §2의 "교과서 한 챕터"와 PROJECT §3의 "분량 기준은 시간뿐"이 새 기본 예산과 충돌 | user answer 3은 그 문장 옆에 기본값 한 줄을 덧붙이라고 정했다(재작성이 아니라 추가) | 기각: B2(한 챕터 전체를 요청하면 늘린다)와 PROJECT 범위의 "기본값이며 상한이 아니다" 줄이 두 문장을 보완한다 | rejected, 변경 없음 |
| 1 | implementer note: B3 문구가 "v0에서 없앤 15분 하한을 되살리는 것도 아니다"이다 | PROJECT §3에 따르면 v0는 15분 하한과 범위 상한을 모두 없앴다. user decision의 취지는 과거 결정과 충돌하지 않는다는 것이다 | B3 토큰을 충족하고 사실과 맞으므로 받아들인다 | accepted |
| 2 | correction 1 뒤 `npm test`: tests 438, pass 438, fail 0, skipped 0(14.5 s, gallery-audit 포함) | — | — | correction 결과 확인 |
| 2 | R-1 내용 보존 리뷰: 기준 API.md(`git show b514c52`)와 D 대조. code span 밖 수치 Counter 비교 결과 부족 0. 기준 문장 262개 중 단어 일치 60% 미만인 9개를 수동 확인했고 모두 같은 뜻으로 압축된 것이다(예: lint 행 "`{{x}}`인데 `glossary`에도…" → "`{{x}}`의 풀이가 `glossary`·`terms` 장면에 없다", shrunk "화면에 맞추느라 88% 미만" → "88% 미만으로 줄었다", "색은 아래 토큰만" → 원칙 "색은 위 토큰만"). 작가 계약은 deck-contracts에, 개발자 이름은 internals에 있고 잘못 이동한 것은 없다 | — | 스크립트: scratchpad에서 실행(숫자 Counter + 문장별 최대 단어 일치율) | accepted, 손실 0 |
| 2 | R-2: `LTT_PORT=47912` 서버 + Chrome headless `--dump-dom --virtual-time-budget=8000 --window-size=1440,900` catalog | — | DOM 순서대로 `id="api-base" api-ui api-mock api-diagram api-map api-sequence api-charts api-controls` 8개, `class="demo"` 39개 | accepted |
| 2 | R-3 읽기 크기(code point / UTF-8 바이트): 기준 API.md 22,944 / 34,887. 핵심 8,455 / 12,217. 핵심 + controls 10,532 / 15,359. 핵심 + controls + charts(cache-ttl형 수업) 11,963 / 17,242. 최악 두 부품(diagram + controls) 14,159 / 20,846. steps·answerVisual을 써서 deck-contracts까지 읽으면(핵심 + controls + charts + deck-contracts) 15,740 / 24,185. 부품 파일: base 2,604, ui 1,928, mock 970, diagram 3,627, sequence 693, map 675, controls 2,077, charts 1,431, deck-contracts 3,777, internals 1,740 | — | — | accepted; refactoring-2 handoff ledger로 옮김(종료 시) |
| 3 | hand mutations HM-1..HM-10을 하나씩 주입: seed.py backup → 주입 → `npm test` → seed.py restore. 주입 스크립트는 scratchpad의 hm.py와 run-hm.sh | 선택 근거: 정의 손실(HM-1), 중복 정의(HM-2), 문서 없는 새 이름(HM-3), 크기 초과(HM-4), 예산 문장 손실(HM-5), 비용 항목 손실(HM-6), 패키지 누락(HM-7), stale 정리 회귀(HM-8), 이동 중 span 손실(HM-9), anchor 손실(HM-10). FR-1·3·4·6·8·9·12와 QR-P1·C2·M1의 서로 다른 결함 종류를 하나씩 맡는다 | 결과(모두 exit 1, 의도한 assertion이 잡음): HM-1 → VO-1 C-1, VO-2 controls, VO-5(행 span도 함께 사라짐). HM-2 → VO-1 C-1, VO-2 diagram. HM-3 → VO-1 C-1. HM-4 → VO-3 QR-P1. HM-5 → VO-6 B1. HM-6 → VO-6 §5 template. HM-7 → VO-8 S1, S3. HM-8 → VO-8 S2. HM-9 → VO-5. HM-10 → VO-7 | killed 10/10; 매번 restore 성공(seed status clean). 복구 뒤 `npm test` 438/438 pass |
| 4 | verifier 1 = retry, findings 3. F-3 (VO-4): scene-type 검사가 첫 행만 본다(`find`) → 중복된 긴 행이 통과 | verified (verifier가 test 코드에서 확인) | correction batch 2: test-implementer가 `sceneTypeProblems`로 모든 행을 보고(타입마다 행 정확히 1개, 행 ≤ 300) 자체 테스트 2건을 넣었다. 형제 검사(공통 필드, theme/lint/audit, 참조 열)는 변경이 필요 없음을 확인했다 | fixed, VO-4 재감사 필요 |
| 4 | F-4 (VO-9): R-1에 절·행 → 위치 표와 반복 가능한 산출물이 없다. 높은 일치율 속의 한 단어 뒤집힘(미만→이상)과 잘못된 파일 이동은 확인되지 않았다 | verified: ledger에 요약만 있었다 | spec v4가 R-1 절차를 보강했다. 스크립트와 출력은 spec-logs의 `-r1-review.py`, `-r1-review-output.md`. 기준 문장 342개 중 표시된 16개를 모두 같은 뜻으로 판정했고(출력 끝 판정 표), 극성 토큰 비교는 342개 전부에 적용했다. internals로 간 작가 문장은 0이다 | fixed |
| 4 | F-5 (VO-10): "페이지 오류 없음"이 관찰되지 않았다(`--dump-dom`은 예외를 보이지 않는다). demo 39에는 비교 기준이 없었다 | verified | spec v4가 R-2 절차를 보강했다. `-r2-review.sh` 실행 결과는 기준·소스·렌더 demo 39/39/39, anchor 8개, 바로 뒤 데모(base→tokens, ui→narration, mock→mock.phone · mock.browser, diagram→diagram, map→map, sequence→sequence, charts→axisPlot, controls→stepper; AD-3도 해소), 오류 0(CONSOLE 줄은 INFO 수준의 `[ltt] not a lesson page` 1줄뿐). 양성 대조: deck 그룹 앞에 `throw`를 넣었을 때 `Uncaught Error: r2-probe`가 찍히고 `.demo`가 38개로 줄었다. seed.py로 복구했다 | fixed |
| 4 | advisory AD-1, AD-2, AD-4, AD-5 | — | AD-4는 이 ledger에 기록한다(R-2는 포트를 인자로 받으며 47912, 47913, 47914를 썼다). AD-1, AD-2, AD-5는 선택 사항이라 보강하지 않는다 | advisory, open-nonblocking |
| 4 | 관찰: hand mutation 뒤 복구 확인용 `npm test` 1회가 437 pass / 1 fail이었다(실패 이름은 기록하지 못함). 곧바로 다시 실행한 4회는 모두 438/438 | hypothesis: 시간에 민감한 기존 테스트(headless Chrome audit 또는 서버 포트)의 간헐 실패. 새 테스트는 결정적이다 | 재현을 위해 실패 이름을 남기며 반복 실행한다(attempt 5) | open → attempt 5 |
| 5 | 간헐 실패 재현: correction 2 뒤 `npm test`(440개) 전체를 25회 돌렸다. 3회 실패: `gallery decks stay at or under the audit baseline`(1280x800 finance/diversification.html에서 `#ltt-audit` 없음) 1회, `VO-9 PF1 … median … <= 300 ms`(tests/autolayout.test.mjs) 2회. 새 테스트 두 파일을 뺀 기존 361개도 18회 돌렸고 PF1이 1회 실패했다. api-docs 테스트끼리는 실패하지 않았다 | verified: 실패하는 것은 기존의 시간 민감 테스트(헤드리스 Chrome audit, 성능 상한)뿐이다. 새 테스트 없이도 실패한다. 새 테스트가 더하는 부하는 약 0.7 s CPU(VO-8의 build kit 0.09 s + npm pack 0.44 s)다. 이 표본으로는 실패율 차이(약 12% 대 6%)를 원인으로 단정할 수 없다(hypothesis) | 범위 밖(기존 테스트와 audit.mjs는 이 run의 경로가 아니다)이라 고치지 않는다. advisory로 보고한다 | advisory (AD-6) |
| 6 | F-3 확인 mutation (HM-11): API.md에 짧은 `figure` 중복 행 하나를 추가 → `node --test tests/api-docs.test.mjs` | — | 결과는 `VO-4 scene types`만 실패(행 수 2). 긴 중복 행(약 360자)을 넣으면 VO-3 크기 검사와 VO-4가 함께 실패했다. 두 번 모두 seed.py로 복구했다 | killed |
| 7 | verifier 2 = retry(마지막 호출). F-4 나머지(VO-9): R-1 스크립트가 단어 3개 미만인 행과 문장을 버리는 바람에 4개 행(`LTT.warn`, `hscroll`, `LTT.bar`, `LTT.tween`)과 짧은 문장들의 위치·판정 기록이 없다. advisory AD-7(극성 토큰 `"만 "`의 뒤 공백), AD-8(scene type 첫 칸을 파일 전체에서 찾음) | verified: 출력의 기준 줄 번호가 43→45, 96→98, 156→159로 건너뛴다 | 고치려면 R-1을 다시 하고 fresh audit을 받아야 하는데 verifier 2회를 이미 썼다. stop condition에 따라 status `limit`으로 멈추고 handoff를 남긴다. VO-9 외 10개 obligation은 accepted다 | limit |
| 1 | test-implementer note: 기준 커밋의 build.mjs와 package.json을 `git show`로 읽음(A-16은 API.md만 명시) | 실행 방법만 확인했고 기대값의 출처는 아니다. 작업 트리 Implementation은 읽지 않았다 | 독립성에 영향이 없다고 판단해 기록만 한다 | advisory |

# Version Log
## v4 (종료 기록)
- verifier 2/2를 쓴 뒤 F-4 나머지(VO-9)가 열려 있어 status `limit`으로 멈췄다. handoff는 refactoring-2 handoff다. refactoring-3 handoff는 VO-6이 accepted되어 stale로 옮겼다. refactoring-1 handoff는 State·Next Step만 갱신했다. A-16에 따른 preservation 테스트와 fixture 이동은 complete일 때만 하므로 하지 않았다(`tests/`에 남아 있고, handoff Next Step 2에 적었다).
## v4
- contract-only: verifier 1의 F-4, F-5에 따라 R-1, R-2 절차에 반복 가능한 스크립트와 산출물 경로, 오류 관찰, 양성 대조를 더했다. brief 항목은 바뀌지 않는다.
## v3
- contract-only: SKILL.md 부품 표(목록 안에서 들여쓰임)의 행 판정은 앞 공백을 지운 뒤 한다. 첫 `npm test`의 F-2가 근거다. brief 항목이 바뀌지 않아 re-brief는 하지 않는다.
## v2
- 승인 브리프 v1 반영: Decided 1~5, 7~9 승인. 6번은 수정(A-16): 내용 보존 검사를 `tests/api-docs-preservation.test.mjs`로 분리하고, complete 시 spec-logs로 옮긴다. status를 active로 바꿨다.
## v1
- 최초 작성. understanding round에서 오케스트레이터(사용자 역할)가 답한 Ask 1(b, base.md), Ask 2(internals.md 분리), Ask 3(PROJECT.md 갱신 허용)을 반영했다.
