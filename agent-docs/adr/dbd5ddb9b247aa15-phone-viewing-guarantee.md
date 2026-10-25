# 폰에서는 수업 열람만 보장하고 작성·점검은 데스크톱에서 한다

- Status: Accepted (2026-10-18, 사용자 결정). `8a61c967e180bedb-desktop-only-min-720px.md`를 supersede한다.

## Context

ADR 8a61c967(2026-10-15)은 수업 서버가 `127.0.0.1`에만 열려 휴대폰에서 열 경로가 없다는 이유로 폭 720px 이상 데스크톱 전용을 정하고 휴대폰 분기와 390×844 점검을 없앴다. 그 뒤 커밋 `510f4b9`(2026-10-17)가 `skills/learn-to-tell/standalone.md`를 넣어 claude.ai 웹·모바일 앱에서 수업을 HTML artifact 하나로 만드는 절차를 두었다. 이 경로의 수업은 로컬 서버 없이 폰에서 열린다. 커밋 `b73f059`(2026-10-17)는 `data-ltt-mobile`, `LTT.mobile()`, `mobileFit`, deck CSS `[data-ltt-mobile]`, autoLayout `DOWN` 재배치를 다시 넣었고, `4a72991`(2026-10-17)과 `956df3f`(2026-10-18)는 그 폰 배치를 고쳤다. 세 커밋 모두 ADR 8a61c967의 Status를 바꾸지 않았다. 화면 점검(`server/audit.mjs`의 `?audit`)은 1440×900과 1280×800 두 크기에서 한다.

## Decision

- claude.ai 모바일 앱에서 artifact 수업을 여는 것을 지원 범위에 넣는다.
- 수업 작성과 화면 점검은 폭 1280px 이상 데스크톱 기준으로만 한다. 점검 크기는 1440×900과 1280×800이다.
- 폰(폭 760px 미만, 또는 높이 500px 이하의 터치 화면)은 열람만 보장한다: 한 열 배치, 세로 스크롤, 페이지 가로 넘침 없음. 폰 배치는 kit가 같은 장면에서 만든다.
- 수업마다 폰 화면을 따로 만들거나 열어 보지 않는다(`SKILL.md` §3.6).
- 자동 audit에 390×844 크기를 넣지 않는다.
- 기존 폰 코드(`data-ltt-mobile`, `LTT.mobile()`, `mobileFit`, deck CSS `[data-ltt-mobile]`, autoLayout `DOWN`)를 유지한다.

## Alternatives

- 폰 분기를 지우고 `standalone.md`에 "폰에서는 레이아웃을 보장하지 않는다"를 적어 ADR 8a61c967을 유지: 기각. standalone 수업의 열람 경로에 claude.ai 모바일 앱이 들어 있어, 분기를 지우면 그 경로에서 배치를 보장하는 장치가 없어진다.
- 자동 audit에 390×844 한 크기를 약한 검사(`hscroll` 0, 글자 10px 이상)로 추가: 기각. kit를 바꿀 때마다 검사 크기 하나와 그 경고 수정이 kit 개발 비용에 더해진다. 폰에서 배치가 깨진 사례가 보고되면 다시 정한다.

## Consequences

- Positive: 폰 배치 코드와 `kit/API.md`·`SKILL.md` §3.6의 폰 문단이 ADR과 일치한다. 수업마다 점검하는 크기는 2개 그대로다.
- Negative: 폰 배치는 자동 점검 대상이 아니어서 kit 변경으로 폰 배치가 깨져도 `npm test`가 실패하지 않는다. kit는 데스크톱 배치와 폰 배치 두 경로를 유지한다.
