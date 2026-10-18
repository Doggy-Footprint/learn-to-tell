# refactoring-6: kit 모듈의 CSS 문자열을 .css 파일로 분리하기

## Goal

"이 스킬에서 사용하는 라이브러리는 계속 개발하며 확장 가능해야하고, UIUX적으로 유지보수 가능한 아키텍쳐를 가지고 있어야 한다."

## State

- 브랜치 `fix/run-time`, 기준 커밋 `956df3f`. 코드 변경 없음.
- 순서: refactoring-6. refactoring-4·5(측정 로직)가 CSS 적용 시점에 기대는 부분이 있어 그 뒤에 한다.
- 관련 파일: `skills/learn-to-tell/kit/ltt.js`(`STYLE` 74줄, `themeCss()`가 `THEMES`에서 토큰 CSS 생성, `KIT` 경로를 `document.currentScript.src`에서 구해 폰트 `@font-face`에 끼움), `ltt-parts.js`(`STYLE` 112줄), `ltt-ui.js`(101줄), `ltt-mock.js`(45줄), `ltt-deck.js`(256줄, `deck()`이 호출될 때 `<style>`을 head에 붙임), `packages/ltt-kit/package.json`(`files: ["*.js", "API.md", "vendor/"]`), `vercel.json`(kit 디렉터리 복사), `skills/learn-to-tell/standalone.md`(jsDelivr CDN 경로), `tests/gallery.test.mjs`(스크립트 로드 순서 검사).
- 지금 상태: CSS 588줄이 다섯 JS 파일 안의 문자열 배열이다. 편집기 하이라이트, 린트, 의미 있는 diff가 없다. 이 브랜치의 덱 CSS 변경(`.dk-figsteps.stack`, `.dk-capstack`, `.dk-float`, `.dk-probe`, `.dk-still`, `rest-*`)도 문자열 수정이었다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |

## Next Step

1. 각 모듈의 정적 CSS를 `kit/ltt.css`, `kit/ltt-parts.css`, `kit/ltt-ui.css`, `kit/ltt-mock.css`, `kit/ltt-deck.css`로 옮긴다. 각 JS는 로드될 때 `KIT + "<name>.css"`로 `<link rel="stylesheet">`를 head에 넣는다(폰트에 쓰는 것과 같은 경로 기준). 작가가 적는 `<script>` 순서는 바뀌지 않으므로 API.md 불러오기 절은 그대로다.
2. 테마 토큰 CSS(`themeCss`, `TOKENS_LIGHT`/`TOKENS_DARK`)는 JS 생성으로 남긴다. `themeTokens`·`palette`와 테스트가 같은 객체를 쓴다.
3. 깜빡임(FOUC): 외부 CSS가 늦게 오면 첫 장면이 스타일 없이 그려지고 `fit`·probe가 잘못 잴 수 있다. deck은 자기 `link.onload`(또는 `document.styleSheets` 확인) 뒤에 첫 `go`를 하고, `document.fonts.ready`처럼 `refit`을 건다.
4. 배포: `packages/ltt-kit/package.json` `files`에 `*.css` 추가. `scripts/build.mjs kit`과 `vercel.json`은 디렉터리 복사라 변경 없음. `tests/gallery.test.mjs`에 "kit JS마다 같은 이름의 css가 있다" 검사 1건.
5. 대안(비용 작음, 이점도 작음): 분리하지 않고 문자열 배열을 `/* css */` 태그가 붙은 템플릿 리터럴 하나로 바꿔 편집기 하이라이트만 얻는다. 린트·diff 이점은 없다.

## Open Questions

- 파일 다섯 개로 둘지 `ltt.css` 하나로 합칠지(요청 수 vs 모듈 경계).
- `@font-face`도 CSS로 옮길지. CSS 파일 기준 상대 경로(`vendor/pretendard/...`)로 쓸 수 있어 `KIT` 경로 끼우기가 필요 없어진다.
- standalone(jsDelivr)에서 요청 5개가 더 생기는 것이 문제인지.

## Spec

없음. 동작 변경이 아니라 위치 이동이므로 자동 audit(갤러리 12편 × 2크기) 전후 동일로 확인한다.

## Execution Ledger

- 2026-10-18 측정: `STYLE` 배열 줄 수 ltt.js 74, ltt-parts.js 112, ltt-ui.js 101, ltt-mock.js 45, ltt-deck.js 256(합 588).
