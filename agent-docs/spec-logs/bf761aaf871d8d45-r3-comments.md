# R-3 판정 기록 (spec bf761aaf871d8d45 v3, VO-12)

## `.css` 주석 판정 (AGENTS.md 주석 규칙)

기준: 주석은 드러나지 않는 설계 제약, 외부 시스템과의 관계, 안전 불변식, 이상해 보이는 구현이 필요한 이유 중 하나를 기록할 때만 남는다. 코드가 하는 일을 다시 말하는 주석과 구획 이름표는 지운다.

| 파일 | 주석 | 판정 | 근거 |
| --- | --- | --- | --- |
| ltt-mock.css | The terminal stays dark in every theme (it imitates a real screen); line colours are variables so a page or theme can retune them. | 유지 | 설계 제약: 테마 토큰을 따르지 않는 이유와 변수로 둔 이유 |
| ltt-deck.css | Revealing keeps every choice's box in place: removing them reflowed the scene mid-step and shook the frame. | 유지 | 이상해 보이는 구현의 이유(지우지 않고 숨김) |
| ltt-deck.css | A probe reads sizes right after each state is drawn; page CSS transitions would hand it the previous state's size. | 유지 | 측정과의 결합 제약(transition을 끄는 이유) |
| ltt-deck.css | skip-before-reveal nudge: the reveal button pulses three times in the theme's own medium, then rests | 제거(correction batch 2) | 뒤 keyframes가 하는 일을 다시 말할 뿐이다 |
| ltt-deck.css | mobile: the same scene units stacked in one column and scrolled (see mobileFit) | 유지 | 외부 결합: 이 규칙들이 JS `mobileFit`과 짝을 이룬다는 것은 CSS만 보고 알 수 없다(ADR dbd5ddb9b247aa15) |
| ltt-deck.css | Pages cap drawings with vh/vw sizes tuned for one desktop screen; a scrolling phone column needs them lifted. | 유지 | 페이지 CSS와의 관계(덮어쓰는 이유) |
| ltt-deck.css | an icon alone in a visual slot is the picture, so it takes a size for the slot instead of its 1em text size | 유지 | 이상해 보이는 크기 규칙의 이유 |

이름표 주석 24개(ltt-ui 7, ltt-deck 17)는 옮기지 않았다(implementer 보고 목록). 최종 남은 주석 6개, 이름표·서술 0개.

## 마커 밖 문자열 리터럴 분류 (`bf761aaf871d8d45-r3-source.mjs` v3 토큰화, `-r3-source.json`)

- ltt-parts.js, ltt-ui.js, ltt-mock.js: 0.
- ltt-deck.js: 1. `"{}"`는 754줄 `JSON.parse(… || "{}")`의 기본값이고 CSS가 아니다.
- ltt.js: 49. 모두 허용 구간 안이다.
  - `THEMES`(26–132줄)의 토큰 문자열과 `css` 필드: `themeCss()` 재료.
  - `STYLE` 머리 배열(143–157줄): `@font-face` 4개, `:root` 토큰 블록, 다크 media, `:root[data-theme=dark]`.
  - 토큰화 출력에서 허용 구간 밖에 있는 것은 `}}` 하나다. 517·541줄 lint 메시지(`"풀이가 없는 용어 {{" + t.key + "}}"` 등)의 문자열 조각이며 CSS가 아니다. 처음 기록한 `{{key}}`·`{{shown text|key}}`는 424줄 주석 안의 글자를 단순 정규식으로 잘못 센 것이다. 토큰화는 주석을 빼므로 잡지 않는다(verifier 2 BV2-3 지적으로 고침).
- 런타임 확인: R-1 구성 검사(`-r1-style-diff-{1..5}.json`, `composition: true`, bad 0)가 parts·ui·mock·deck `<style>` = N(css), `#ltt-style` = 기준 머리 + N(ltt.css) + 기준 꼬리임을 보였다. 그래서 마커 밖에서 붙는 정적 CSS는 런타임에도 없다. 민감도: css에서 규칙 하나를 뺀 kit 사본으로 같은 덤프를 대조하면 26/26 bad(deck, ltt-style).
