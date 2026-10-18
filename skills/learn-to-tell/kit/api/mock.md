언제: UI 예시, 명령, 코드를 실제 화면처럼 틀에 넣어 보일 때 · vendor: `prism/prism.min.js`(code의 `lang` 문법 색, 쓸 때만) · 실물: `https://learn-to-tell.vercel.app/gallery/catalog.html#api-mock`

# ltt-mock.js: 목업

모두 `{el, screen}`을 돌려준다. 내용은 `screen`에 넣고, 번호 주석은 `el`에 건다(틀 기준 %).

| 이름 | 옵션 |
| --- | --- |
| `LTT.mock.phone(o)` | `width`(px), `ratio`(기본 `"9/17.5"`), `dark`, `bg`, `time`, `content` |
| `LTT.mock.browser(o)` | `url` 또는 `title`, `width`, `height`, `bg`, `content` |
| `LTT.mock.terminal(o)` → `+ add(line)` | `title`, `lines: ["$ 명령", "출력", {t: "ok"\|"warn"\|"err"\|"dim"\|"out"\|"cmd", text}]`. 줄 색은 `--ltt-term-*` 변수(터미널은 테마와 무관하게 어둡다). 캐시 로그라면 미스=ok, 적중=out, 오래된 값=warn, 원본 쓰기=err처럼 의미를 골라 쓴다 |
| `LTT.mock.code(o)` → `+ line(n)` | `code`(원문 그대로), `lang`(javascript, typescript, python, bash, json, sql. Prism을 불러왔을 때 문법 색), `title`, `marks: {줄번호: "good"\|"bad"\|"accent"\|"warn"}`, `start`, `numbers: false` |

UI 예시는 맨 HTML 조각보다 목업에 넣는다. 목업 안의 색은 '실제 화면'이라 토큰 대신 hex를 써도 된다.
