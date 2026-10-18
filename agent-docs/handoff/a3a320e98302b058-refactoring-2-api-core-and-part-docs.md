# refactoring-2: API.md를 "항상 읽는 핵심"과 "쓸 때만 읽는 부품별 참조"로 나누기

## Goal

"이 스킬은 일반적으로 학습 자료를 요청하는 것보다 빠르고 적은 토큰 소모로 학습 자료를 제작할 수 있도록 지원해야 한다." / "이 스킬에서 사용하는 라이브러리는 계속 개발하며 확장 가능해야하고, UIUX적으로 유지보수 가능한 아키텍쳐를 가지고 있어야 한다."

두 intent가 충돌하는 지점이다: 라이브러리를 확장할수록(`result.md`의 "kit 후보" 누적) API.md가 커지고, SKILL.md §3.1은 수업마다 API.md를 전부 읽게 한다.

## State

- 브랜치 `fix/run-time`, 기준 커밋 `956df3f`. 코드 변경 없음.
- 순서: refactoring-2. refactoring-1(비용 기록)로 전후 읽기 바이트를 비교한다. refactoring-4(덱 계약 문서화)와 문서 위치를 맞춘다.
- 관련 파일: `skills/learn-to-tell/kit/API.md`(215줄, 22,764자), `skills/learn-to-tell/SKILL.md` §3.1("먼저 `<skill>/kit/API.md`를 읽고")·§3.3 부품 표, `site/gallery/catalog.html`, `scripts/build.mjs`(`kit` 명령이 kit 디렉터리를 npm 패키지로 복사), `packages/ltt-kit/package.json`(`files`), `tests/gallery.test.mjs`.
- API.md 구성: 불러오기 순서, ltt.js 기초 표, 테마 표, lint 규칙 표, audit 규칙 표, ltt-ui 표, ltt-mock 표, ltt-parts 표(diagram 행 하나가 1,000자 이상), 덱 공통 필드 표, 장면 타입 표(figure 행 1,013자, predict 행 670자: 2026-10-17~18 배율 고정 작업으로 추가된 작가 계약).

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |

## Next Step

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

없음(문서 분할, workflow-approach 대상 아님). 5번 테스트는 작은 정적 검사다.

## Execution Ledger

- 2026-10-18 측정: API.md에 문서화된 `LTT.*` 이름 59개. 갤러리 수업 12편에서 실제로 쓰인 이름 29개(`expect` 18편, `deck` 17, `sweep`·`facts`·`MOTION_MS` 7, `h` 6, `tween`·`stepper`·`bar` 5, `mock` 4, `units`·`mark`·`diagram` 3, 나머지 1~2편). `map`·`sankey`·`plot`·`state`·`annotate`·`beforeAfter`·`callout`은 수업에서 0편(catalog에만 있음). 수업마다 쓰는 부품은 전체의 절반 이하이므로 전부 읽는 구조가 비용을 만든다.
