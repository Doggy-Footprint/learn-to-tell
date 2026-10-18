# refactoring-2: API.md를 "항상 읽는 핵심"과 "쓸 때만 읽는 부품별 참조"로 나누기

## Goal

"이 스킬은 일반적으로 학습 자료를 요청하는 것보다 빠르고 적은 토큰 소모로 학습 자료를 제작할 수 있도록 지원해야 한다." / "이 스킬에서 사용하는 라이브러리는 계속 개발하며 확장 가능해야하고, UIUX적으로 유지보수 가능한 아키텍쳐를 가지고 있어야 한다."

두 intent가 충돌하는 지점이다: 라이브러리를 확장할수록(`result.md`의 "kit 후보" 누적) API.md가 커지고, SKILL.md §3.1은 수업마다 API.md를 전부 읽게 한다.

## State

- 2026-10-19 갱신(run fd310baab4363801 limit). 브랜치 `fix/run-time`, 기준 커밋 `b514c52`, 커밋 안 됨(작업 트리 변경). 변경 파일: `skills/learn-to-tell/kit/API.md`(핵심 8,455자), `skills/learn-to-tell/kit/api/`(새 파일 10개: base, ui, mock, diagram, sequence, map, controls, charts, deck-contracts, internals), `skills/learn-to-tell/SKILL.md`(§2 예산, §3.1 읽기 규칙, §3 부품 표 참조 열, ### kit, §5 생성 비용), `skills/learn-to-tell/standalone.md`, `site/gallery/catalog.html`(`api-<part>` anchor 8개), `site/gallery/index.html`, `packages/ltt-kit/package.json`(`files`에 `api/`), `scripts/build.mjs`(kit 복사 전 `api/` 정리), `learn-to-tell-PROJECT.md`, 새 테스트 `tests/api-docs.test.mjs`(영구), `tests/api-docs-preservation.test.mjs`와 `tests/fixtures/api-md-base-codespans.json`(이동 증거, 아래 Next Step 3), spec·리뷰 산출물 `agent-docs/spec-logs/fd310baab4363801-*`. `npm test` 440개 통과(아래 Ledger의 간헐 실패 참고).
- 남은 것: 내용 보존 리뷰(R-1)의 마지막 증거 하나(F-4 나머지). 이것 말고는 11개 obligation 중 10개가 verifier에게 accepted됐다.
- 이하 착수 전(2026-10-18) 상태.
- 브랜치 `fix/run-time`, 기준 커밋 `956df3f`. 코드 변경 없음.
- 순서: refactoring-2. refactoring-1(비용 기록)로 전후 읽기 바이트를 비교한다. refactoring-4(덱 계약 문서화)와 문서 위치를 맞춘다.
- 관련 파일: `skills/learn-to-tell/kit/API.md`(215줄, 22,764자), `skills/learn-to-tell/SKILL.md` §3.1("먼저 `<skill>/kit/API.md`를 읽고")·§3.3 부품 표, `site/gallery/catalog.html`, `scripts/build.mjs`(`kit` 명령이 kit 디렉터리를 npm 패키지로 복사), `packages/ltt-kit/package.json`(`files`), `tests/gallery.test.mjs`.
- API.md 구성: 불러오기 순서, ltt.js 기초 표, 테마 표, lint 규칙 표, audit 규칙 표, ltt-ui 표, ltt-mock 표, ltt-parts 표(diagram 행 하나가 1,000자 이상), 덱 공통 필드 표, 장면 타입 표(figure 행 1,013자, predict 행 670자: 2026-10-17~18 배율 고정 작업으로 추가된 작가 계약).

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |
| R-1 내용 보존 리뷰를 스크립트(`agent-docs/spec-logs/fd310baab4363801-r1-review.py`)로 반복 가능하게 만들고 기준 문장 342개를 판정함 | verifier 2 F-4 나머지: 출력의 기준 줄 번호가 43→45, 96→98, 156→159로 건너뛴다. 기준 44행 `LTT.warn(msg)`, 97행 `hscroll`, 157행 `LTT.bar(...)`, 158행 `LTT.tween(...)`과 짧은 문장이 위치 표에 없다 | verified: 스크립트 30행 `len(words(u[3])) >= 3`이 단어 3개 미만 단위를 버린다 |

## Next Step

(2026-10-19 limit 이후. 원래 1~6과 7의 수치는 끝났다. 남은 것은 아래 1~3이다.)

1. R-1을 마무리한다: `fd310baab4363801-r1-review.py`의 단어 수 필터를 없애거나, 버려진 단위를 따로 출력해 기준 API.md의 모든 표 행과 산문 줄에 새 위치와 판정을 남긴다. 적어도 44 `LTT.warn`, 97 `hscroll`, 157 `LTT.bar`, 158 `LTT.tween`. 극성 토큰 `"만 "`을 `만`으로 바로잡는다(AD-7). 그다음 새 workflow run(verifier 예산 새로 시작)에서 VO-9만 fresh audit 받는다. 나머지 obligation의 acceptance는 구현이 바뀌지 않는 한 유지된다.
2. VO-9가 accepted되면 `tests/api-docs-preservation.test.mjs`와 `tests/fixtures/api-md-base-codespans.json`을 `agent-docs/spec-logs/fd310baab4363801-api-docs-preservation.test.mjs`·`fd310baab4363801-api-md-base-codespans.json`으로 옮긴다(사용자 결정: 옛 span을 영구히 요구하면 refactoring-4가 문서를 고칠 때 깨진다). 정의·크기 검사(`tests/api-docs.test.mjs`)는 남긴다.
3. 이 handoff를 닫는다(index → stale.md, 파일 → stale/).

원래 Next Step(2026-10-18):

1. `kit/API.md`를 핵심만 남긴다(목표 6천 자 안팎): 불러오기 순서, 토큰·테마 표, 덱 공통 필드와 장면 타입 표(각 행 한두 문장), lint·audit 규칙 표, 원칙. 장면 타입 표의 figure·predict 행에 든 측정 모드 계약은 한 줄로 줄이고 `kit/api/deck-contracts.md`로 옮긴다(refactoring-4의 ctx 프로토콜 문서와 같은 파일로 둘 수 있다).
2. 부품별 참조 `kit/api/<part>.md`를 만든다. 묶음 초안: `diagram.md`(diagram·graphOverlaps·diagramLayout·autoLayout·state), `sequence.md`, `map.md`, `controls.md`(sweep·drag·predict·stepper·sim·tween), `charts.md`(axisPlot·hbars·lanes·sankey·plot·plane·units·bar), `ui.md`(ltt-ui 전부), `mock.md`. 각 파일 첫 줄에 "언제 쓰나"와 필요한 vendor 스크립트를 적는다.
3. SKILL.md §3.1을 "API.md를 읽고, §3.3 부품 표에서 고른 부품의 `kit/api/<part>.md`만 읽는다"로 바꾸고, §3.3 부품 표에 참조 파일 열을 더한다.
4. 선택: `node <skill>/kit/api.mjs show <part>` CLI(`ltt-map`과 같은 방식). 파일을 직접 읽는 것으로 충분하면 만들지 않는다.
5. 테스트: `tests/gallery.test.mjs`에 "ltt.js·ltt-parts.js·ltt-ui.js·ltt-mock.js·ltt-deck.js가 `LTT`에 붙이는 공개 이름이 핵심 또는 부품 문서 중 정확히 한 곳에 문서화된다" 검사를 추가한다(지금은 문서와 코드의 동기화 검사가 없다).
6. 배포: `packages/ltt-kit/package.json`의 `files`에 `api/` 추가. `scripts/build.mjs kit`은 디렉터리 전체를 복사하므로 그대로. `catalog.html`의 TOC anchor를 부품 문서와 같은 이름으로 맞춘다.
7. refactoring-1 기록으로 전후 읽기 바이트를 비교해 Execution Ledger에 적는다.

## Open Questions

- 묶음 단위: 부품 하나에 파일 하나로 더 잘게 나눌지, 위 7묶음으로 둘지.
- CLI가 필요한지. 파일 읽기와 토큰 비용은 같고, CLI는 "어떤 부품이 있나" 목록 조회에만 이점이 있다.
- 장면 타입 표의 작가 계약을 핵심에서 빼면 agent가 계약을 모른 채 figure `steps`를 짤 위험이 있다. 핵심에 "steps·answerVisual을 쓰면 `deck-contracts.md`를 읽는다" 한 줄로 충분한지.

## Spec

`agent-docs/spec-logs/fd310baab4363801-api-split-cost-budget.md`, version 4, status `limit`, run ID `fd310baab4363801`(refactoring-1·2·3을 한 run으로 묶었다). 이 파일이 그 run의 limit handoff다.

## Execution Ledger

- 2026-10-18 측정: API.md에 문서화된 `LTT.*` 이름 59개. 갤러리 수업 12편에서 실제로 쓰인 이름 29개(`expect` 18편, `deck` 17, `sweep`·`facts`·`MOTION_MS` 7, `h` 6, `tween`·`stepper`·`bar` 5, `mock` 4, `units`·`mark`·`diagram` 3, 나머지 1~2편). `map`·`sankey`·`plot`·`state`·`annotate`·`beforeAfter`·`callout`은 수업에서 0편(catalog에만 있음). 수업마다 쓰는 부품은 전체의 절반 이하이므로 전부 읽는 구조가 비용을 만든다.
- 2026-10-19 run fd310baab4363801(limit) 기록.
  - 읽기 크기(code point / UTF-8 바이트): 기존 API.md 22,944 / 34,887(handoff 측정 때 22,764에서 늘었다). 핵심 API.md 8,455 / 12,217. 핵심 + controls 10,532 / 15,359. 핵심 + controls + charts(cache-ttl형) 11,963 / 17,242. 최악 두 부품(diagram + controls) 14,159 / 20,846. steps·answerVisual을 써서 deck-contracts까지 읽으면 15,740 / 24,185. 부품 파일: base 2,604, ui 1,928, mock 970, diagram 3,627, sequence 693, map 675, controls 2,077, charts 1,431, deck-contracts 3,777, internals 1,740.
  - 결정(user answer): 상한 8,500자, 드문 ltt.js 이름은 base.md, 내부 이름은 internals.md(SKILL.md는 가리키지 않음, 검사 집합에는 포함), deck-contracts는 작가 계약만. CLI는 만들지 않음. 공개 이름은 `LTT.$`까지 73개다.
  - findings: F-1(vm realm 배열 비교)과 F-2(SKILL 표 들여쓰기, spec v3 명확화)는 test defect로 correction 1에서 고쳤다. F-3(scene type 첫 행만 검사)은 correction 2에서 고쳤다. F-5(R-2 페이지 오류 관찰 없음)는 R-2 스크립트와 양성 대조로 닫았다. F-4는 R-1 v4로 대부분 닫았지만 나머지가 open이다(Next Step 1). implementer challenge(§2 "한 챕터"와 PROJECT "시간뿐")는 user answer 3에 따라 기각했다(덧붙이기로 정함).
  - mutation(손): HM-1..HM-11, 11/11 killed(정의 손실, 중복 정의, 문서 없는 새 이름, 크기 초과, 예산 문장 손실, 비용 블록 손실, 패키지 `api/` 누락, stale 정리 회귀, 이동 중 span 손실, anchor 손실, scene type 중복 행). fuzz: none(입력 표면 없음). mutation tool: none(Markdown·HTML 대상 도구 없음).
  - counters: correction batch 2, verifier 2/2(retry, retry), spec v1→v4(v2 승인 반영, v3·v4 contract-only).
  - 간헐 실패(AD-6, 범위 밖): 기존의 시간 민감 테스트인 `tests/gallery-audit.test.mjs`(헤드리스 audit에서 `#ltt-audit` 없음)와 `tests/autolayout.test.mjs` PF1(성능 300 ms)이 `npm test` 25회 중 3회 실패했다. 새 테스트를 빼고 돌렸을 때는 18회 중 1회 실패했다. 새 테스트 자체는 한 번도 실패하지 않았다.
- 2026-10-19 종료. VO-9 잔여(F-4 나머지)는 사용자 역할(오케스트레이터)이 네 행을 직접 대조해 받아들였다. 기준 API.md 44행 `LTT.warn(msg)` → `kit/api/base.md:18`, 97행 `hscroll` → `kit/API.md:92` 묶음 행("가로로 넘친다"), 157행 `LTT.bar(...)` → `kit/api/charts.md:14`, 158행 `LTT.tween(...)` → `kit/api/controls.md:12`, 모두 같은 문장이다. 표·제목·코드 블록 밖에서 단어 3개 미만인 산문은 11행 `<script src="/kit/vendor/d3.min.js">` 한 줄뿐이고, 이것은 code span이라 VO-5가 보존을 확인했다. 남은 위험은 받아들이고 새 run은 열지 않는다. 보존 테스트와 fixture는 `agent-docs/spec-logs/fd310baab4363801-api-docs-preservation.test.mjs`, `agent-docs/spec-logs/fd310baab4363801-api-md-base-codespans.json`으로 옮겼다(기록용, `npm test` 대상 아님). 정의·크기 검사 `tests/api-docs.test.mjs`는 영구로 남는다. 이 handoff를 닫는다.
