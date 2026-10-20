# kit CSS를 런타임 `<link rel="stylesheet">`로 불러오기

## Context
kit 다섯 모듈(`ltt.js`, `ltt-parts.js`, `ltt-ui.js`, `ltt-mock.js`, `ltt-deck.js`)의 정적 CSS 약 62 KB가 JS 문자열 배열로 있었다. handoff 12094d07(refactoring-6)은 이를 `.css` 파일로 옮기고 각 JS가 로드될 때 `KIT + "<모듈>.css"`를 `<link>`로 head에 넣는 안을 다음 단계로 두었다. 덱은 첫 `go`에서 장면 배율과 figure 단계 높이를 동기로 잰다(ADR 40552). standalone 수업은 claude.ai artifact에서 kit을 jsDelivr 스크립트로 불러온다.

## Rejected Alternative
각 kit JS가 로드될 때 같은 디렉터리의 `<모듈>.css`를 `<link rel="stylesheet">`로 head에 넣고, 덱은 `link.onload` 뒤에 첫 `go`를 한다.

## Reason
- 덱이 첫 `go`에서 동기로 재므로 스타일이 그 전에 적용되어 있어야 한다. 비동기 `<link>`는 첫 측정을 스타일 적용 뒤로 미루는 대기 코드와 깜빡임(FOUC) 경로를 새로 만든다.
- claude.ai artifact의 콘텐츠 보안 정책이 외부 스타일시트를 허용하는지 확인되지 않았다(스크립트는 몇몇 CDN에서 허용).
- standalone 수업마다 jsDelivr 요청이 다섯 개 늘어난다.
- 편집기 하이라이트와 의미 있는 diff라는 목적은 편집 시점 생성으로도 얻는다.

## Revisit Condition
kit에 빌드 단계가 생기거나 standalone이 jsDelivr 스크립트 로딩을 버릴 때, 또는 artifact CSP가 외부 스타일시트를 허용함이 확인될 때.

## Chosen Instead
scripts/build.mjs (`css` 하위 명령: `kit/*.css`를 JS 안 문자열로 생성), tests/kit-css.test.mjs
