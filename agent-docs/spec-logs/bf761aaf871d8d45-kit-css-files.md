---
version: 3
run_id: bf761aaf871d8d45
status: complete
base_commit: 8522f7011504ce774a2207b2ae308b2fc3bab736
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | kit 개발자 | 라이브러리는 확장 가능하고 UIUX적으로 유지보수 가능한 아키텍처를 가진다(refactoring-6): kit CSS를 실제 CSS 파일에서 고친다 | 다섯 모듈의 정적 CSS가 `skills/learn-to-tell/kit/<모듈>.css`에 한 선언 한 줄 형식으로 있고, `npm run build:css`가 JS 안 문자열을 그 파일에서 다시 만든다 |
| UI-2 | kit 개발자 | `.css`와 JS 안 문자열이 어긋난 채 커밋·릴리스되지 않는다 | 어긋나면 `npm test`, `node scripts/build.mjs css --check`, pre-commit이 실패한다 |
| UI-3 | 학습자, 수업 작가 | 수업이 이전과 똑같이 보이고 동작한다(standalone·폰 포함) | kit `<style>` 다섯 개의 텍스트가 기준 커밋과 바이트 단위로 같고, 갤러리 DOM·audit·R-2 결과가 기준과 같고, 추가 요청·`<link>`가 없다 |
| UI-4 | kit 개발자 | 측정 모듈 run(74cb05d7da21907e)의 남은 오류 경로 증거(TV-6)가 판별력을 갖춘다 | 새 R-2 errors fixture에서 공개 상태 재측정 throw의 zmax 1·세 번째 warn 문구·E-2 `.pk` 정리가 각각 hand mutation으로 구별되고, 판별력 가드가 fixture 퇴화를 잡는다 |
| UI-5 | kit 개발자 | 남은 handoff와 기각 결정이 정리된다 | handoff 12094d07·d7cbe1b9 종료, `<link>` 방식 기각 기록, CHANGELOG·internals.md·README 갱신 |

# Scope
In scope:
- `skills/learn-to-tell/kit/ltt.css`, `ltt-parts.css`, `ltt-ui.css`, `ltt-mock.css`, `ltt-deck.css`(새 파일): 각 모듈의 정적 CSS. `ltt.css`는 지금 `ltt.js` `STYLE`의 `body{…}`부터 `#ltt-expect .warn{…}`까지다. `@font-face` 4개, `:root{TOKENS_LIGHT + 고정 변수}`, 다크 media, `:root[data-theme=dark]` 블록과 `themeCss()`는 JS에 남는다(AD-3).
- 다섯 JS 파일: `STYLE`의 정적 부분을 마커 구간(`/* css:start <모듈>.css */` … `/* css:end */`) 안 생성 식으로 바꾼다. 마커 밖 런타임 코드는 바꾸지 않는다.
- `scripts/build.mjs`: 새 하위 명령 `css`와 `css --check`. `kit` 하위 명령이 패키지 루트의 옛 `*.js`·`*.css`를 지운 뒤 복사한다.
- `package.json`: `build:css`, `check:css` 스크립트. `packages/ltt-kit/package.json` `files`에 `*.css`. `scripts/git/pre-commit`에 `css --check` 한 줄.
- 문서: `kit/CHANGELOG.md` 0.2.0 kit 개발자용 한 줄, `kit/api/internals.md` "## CSS를 고치려면" 절, `README.md` "## 사용" 코드 블록에 `npm run build:css` 한 줄.
- 증거(main): R-2 errors fixture와 하네스를 이 run id로 새로 만든다(`agent-docs/spec-logs/bf761aaf871d8d45-error-fixture.html`, `-cdp-review.mjs`). 지난 run의 파일은 고치지 않는다.
- 종료(main): 기각 기록 1개(승인 brief 확인 뒤), handoff 12094d07·d7cbe1b9 종료(ledger 한 줄, index → stale.md, 파일 → stale/).

Out of scope:
- 런타임 `<link rel="stylesheet">`, CSS 규칙 재정렬·병합·값 정리(바이트 동일 기준, 사용자 답변 2).
- 테마 토큰과 `@font-face`를 JS 밖으로 옮기는 것.
- CSS 린터 도입, 버전 올리기, `standalone.md`·`kit/API.md`·`SKILL.md` 수정, `ltt-deck.js` 측정 로직 변경, 커밋.

# Paths
Implementation: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/ltt-ui.js, skills/learn-to-tell/kit/ltt-mock.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt.css, skills/learn-to-tell/kit/ltt-parts.css, skills/learn-to-tell/kit/ltt-ui.css, skills/learn-to-tell/kit/ltt-mock.css, skills/learn-to-tell/kit/ltt-deck.css, scripts/build.mjs, scripts/git/pre-commit, package.json, packages/ltt-kit/package.json, skills/learn-to-tell/kit/CHANGELOG.md, skills/learn-to-tell/kit/api/internals.md, README.md
Tests: tests/kit-css.test.mjs (새 파일), tests/api-docs.test.mjs (VO-8 패키징 절에 추가), tests/release-docs.test.mjs (문서 토큰 추가)
Test command: npm test
Review evidence: R-1 바이트 동일·갤러리 불변(`<style>` 텍스트, DOM 덤프, audit, baseline), R-2 CDP 하네스(reveal·resize·errors·timing·requests, 기준 트리 대 최종 트리), R-3 소스 검토(마커 밖 CSS, `<link>` 생성, 주석, `standalone.md`). 산출물은 `agent-docs/spec-logs/bf761aaf871d8d45-*`와 이 spec의 Execution ledger.
Fuzzing: differential random testing. 도구: node 스크립트 `agent-docs/spec-logs/bf761aaf871d8d45-css-fuzz.mjs`(main 작성·실행, npm test 밖). 표면: 임시 트리에 복사한 `scripts/build.mjs css`(CLI). 입력: 무작위 CSS 유사 텍스트(규칙·선언·중첩 `@media`·`@keyframes`, 공백·탭·CRLF 변형, 주석, `{ } ; , :`와 연속 공백을 담은 문자열, `calc(a + b)`, `>` 결합자). oracle: 아래 Signatures의 정규화 N을 main이 독립 구현한 값과 생성 구간을 평가한 값의 차분, 그리고 두 번째 `css` 실행이 바이트를 바꾸지 않음, 직후 `--check` 종료 코드 0. seed 20261019(mulberry32). budget 500 입력. 위반 0.
Mutation tool: none — JS 변이 도구(Stryker)가 설치되어 있지 않다(지난 run에서 `npx --no-install stryker --version` 실패). 전역 설치는 하지 않는다. 대신 hand mutation HM-1..HM-10.

# Signatures
정규화 N(css) → string. 생성기와 테스트가 각자 이 정의대로 구현한다.
1. 문자열 밖의 `/* … */` 주석을 지운다. 주석 자리는 공백 하나로 둔다.
2. 문자열(`'…'` 또는 `"…"`, 백슬래시 다음 글자는 건너뜀)은 따옴표째 그대로 둔다.
3. 문자열 밖에서 공백 문자(space, tab, CR, LF, FF)의 연속을 공백 하나로 바꾼다.
4. 문자열 밖에서 `{`, `}`, `;`, `,`, `>` 앞뒤의 공백과 `:` 뒤의 공백을 지운다. `:` 앞의 공백은 둔다(`.a :hover`).
5. 문자열 밖에서 `}` 바로 앞의 `;`를 지운다.
6. 앞뒤 공백을 지운다.

규칙은 1부터 6까지 차례로 한 번씩 적용한다. 규칙 5는 `}` 바로 앞의 `;` 하나만 지운다(`;;}` → `;}`, `; }` → 규칙 4 뒤 `;}` → `}`).

지금 다섯 `STYLE`의 정적 문자열은 N의 고정점이다(main 확인: 펼쳤다가 N을 적용하면 다섯 파일 모두 바이트 단위로 원래와 같다).

모듈 쌍(고정): `ltt.js`↔`ltt.css`, `ltt-parts.js`↔`ltt-parts.css`, `ltt-ui.js`↔`ltt-ui.css`, `ltt-mock.js`↔`ltt-mock.css`, `ltt-deck.js`↔`ltt-deck.css`. 모두 `skills/learn-to-tell/kit/`에 있다.

생성 구간:
- 각 JS 파일에 시작 마커 `/* css:start <짝 css 파일 이름> */`와 끝 마커 `/* css:end */`가 정확히 한 번씩, 그 순서로 있다. 다른 `css:start`·`css:end` 마커는 없다.
- 두 마커 사이 텍스트는 JS 식 하나다. 빈 vm 문맥에서 `(` + 텍스트 + `)`로 평가하면 문자열 N(짝 css 파일 내용)이 나온다.
- 생성기는 N 결과를 최상위 규칙(문자열 밖에서 괄호 깊이가 0으로 돌아오는 `}`까지)마다 한 줄씩 JSON 문자열로 쓰고 `.join("")`로 잇는다. 모양: 구간 텍스트를 앞뒤 공백을 빼고 보면 `[`로 시작하고 `].join("")`로 끝난다. 그 사이 비어 있지 않은 줄마다 JSON 문자열 리터럴 하나(뒤에 `,`가 붙을 수 있다, 마지막 줄은 `,` 없음)가 있다. 줄 수는 N(css)의 최상위 규칙 수와 같고, i번째 줄의 값은 i번째 최상위 규칙이다. N(css)가 `""`이면 구간 텍스트는 `""`이다.

`node scripts/build.mjs css`:
- 다섯 쌍을 모두 검증한다(Errors E-1..E-4). 하나라도 실패하면 아무 파일도 쓰지 않는다.
- 통과하면 구간 텍스트가 새로 만들 텍스트와 다른 JS 파일만 다시 쓴다(마커 밖 바이트는 그대로).
- 종료 코드 0, stdout에 바뀐 파일 수가 독립된 숫자 토큰으로 들어 있다(예: `1 file(s) regenerated: ltt-deck.js`, 아무것도 바뀌지 않으면 `0`). 두 번 연달아 실행하면 두 번째는 어떤 파일 바이트도 바꾸지 않는다.

`node scripts/build.mjs css --check`:
- 파일을 쓰지 않는다.
- 어떤 JS 파일이든 `css`가 구간을 바꾸게 되면(어긋남) 종료 코드 1, stderr에 `build.mjs css: <js 파일 이름>: drift (<css 파일 이름>)`처럼 어긋난 JS 파일 이름을 모두 담고, 어긋나지 않은 JS 파일 이름은 담지 않는다. 검증 실패는 E-1..E-4와 같다.
- 어긋남이 없으면 종료 코드 0.

`node scripts/build.mjs kit`:
- 지금 동작에 더해, 복사 전에 `packages/ltt-kit/` 바로 아래의 `*.js`·`*.css`를 지운다(`package.json`은 남긴다).

`npm run build:css` = `node scripts/build.mjs css`, `npm run check:css` = `node scripts/build.mjs css --check`.

`scripts/git/pre-commit`: 버전 검사 줄 다음에 `node "$(git rev-parse --show-toplevel)/scripts/build.mjs" css --check >/dev/null`.

`.css` 파일 형식: 문자열·주석 밖에서 `{`와 `;` 뒤에는 같은 줄에 공백이나 주석만 온다(한 선언 한 줄). 문자열·주석 밖의 `}`가 있는 줄에는 공백, 다른 `}`, 주석만 있다. 들여쓰기는 공백만 쓰고, 주석·빈 줄이 아닌 줄의 앞 공백 수는 2 × (그 줄이 시작될 때의 괄호 깊이, 줄이 `}`로 시작하면 1을 뺌)이다. 선언 줄(`;`로 끝나는 줄)은 문자열 밖 첫 `:` 앞에 공백이 없고 뒤에 공백이 정확히 하나다. `{`로 끝나지도 `}`로 시작하지도 않는 코드 줄은 `;` 또는 `,`(여러 줄 선택자)로 끝난다(마지막 선언도 `;`). 주석은 근거를 담은 기존 주석만 CSS 주석으로 옮긴다(사용자 답변 1).

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | 다섯 `.css` 파일이 있다. 각 JS 생성 구간이 Signatures 정의를 지킨다(마커 한 쌍, 평가값 = N(css)) | must | 사용자 결정 1 |
| FR-2 | 런타임 `<style>` 텍스트가 기준 커밋과 바이트 단위로 같다. 대상은 `#ltt-style`, `#ltt-parts-style`, `#ltt-ui-style`, `#ltt-mock-style`, 덱의 `<style>`이다. `ltt.js`의 마커 밖 부분(`@font-face`, `:root` 토큰 블록, `themeCss()`)이 생성 구간의 앞뒤에 기준과 같은 순서로 붙는다 | must | 사용자 결정 3, 사용자 답변 2 |
| FR-3 | `build.mjs css`와 `css --check`가 Signatures대로 동작한다(쓰기, 멱등, 어긋남 종료 코드 1과 파일 이름) | must | 사용자 결정 1 |
| FR-4 | `.css` 파일 형식(Signatures)과 주석 규칙. 바뀌는 것은 공백·`;`·주석뿐이다(규칙 순서·선택자·값은 그대로, FR-2가 확인) | must | 사용자 결정 1, 사용자 답변 1·2 |
| FR-5 | 패키징: `packages/ltt-kit/package.json` `files`에 `*.css`. `build.mjs kit` 뒤 `packages/ltt-kit/`에 다섯 `.css`가 원본과 바이트 단위로 같고, 미리 심은 `zz-stale.css`·`zz-stale.js`가 없다. `npm pack --dry-run`이 다섯 `.css`를 나열한다 | must | 사용자 결정 3 |
| FR-6 | `npm run build:css`, `npm run check:css` 스크립트와 pre-commit 줄이 있다. 실제 트리에서 pre-commit 스크립트가 종료 코드 0으로 끝난다 | must | 사용자 결정 1 |
| FR-7 | 문서. CHANGELOG `## 0.2.0` "kit 개발자용" 아래 한 줄: `.css`, `build:css`, 어긋남 검사(`npm test` 또는 `--check`)를 담는다. internals.md `## CSS를 고치려면`: `.css`를 고친다, `npm run build:css`, 테스트·`--check`(pre-commit)가 어긋남을 잡는다, 테마 토큰·`@font-face`는 `ltt.js`에 남는다, 마커 구간은 손으로 고치지 않는다. README `## 사용` 코드 블록에 `npm run build:css` | must | 사용자 결정 5, 사용자 답변 3 |
| FR-8 | 런타임 동작 불변: kit JS가 `<link>`를 만들지 않고 `.css`를 요청하지 않는다. 갤러리 페이지마다 요청 URL 집합이 기준과 같다. 작가 `<script>` 순서는 바뀌지 않는다(`kit/API.md`·`standalone.md` 수정 없음) | must | 사용자 결정 1·3 |
| FR-9 | TV-6: 새 R-2 errors fixture와 하네스가 EG-1..EG-5·C-16·C-17을 관찰한다. EG-2에는 판별력 가드가 있다. E-2 fixture는 측정 모드 밖에서 비행 중 `.pk`를 남긴다. 기준 트리와 최종 트리 모두 모든 항목이 기대대로다 | must | 사용자 결정 4, handoff d7cbe1b9 |

# Errors
- E-1: 짝 `.css` 파일이 없다.
  - signal: `css`와 `css --check` 모두 종료 코드 1, stderr에 `build.mjs css:`와 없는 파일 이름.
  - post-failure state: 어떤 JS 파일도 바뀌지 않는다.
- E-2: JS 파일의 마커가 틀렸다. 시작이나 끝이 없음, 둘 이상, 끝이 시작보다 앞, 시작 마커가 다른 css 파일 이름을 가리킴.
  - signal: 종료 코드 1, stderr에 `build.mjs css:`, JS 파일 이름, `marker`.
  - post-failure state: 어떤 JS 파일도 바뀌지 않는다.
- E-3: `.css`에 닫히지 않은 주석이나 문자열이 있다.
  - signal: 종료 코드 1, stderr에 `build.mjs css:`와 css 파일 이름.
  - post-failure state: 어떤 JS 파일도 바뀌지 않는다.
- E-4: `.css`의 `{`·`}` 짝이 맞지 않는다(문자열·주석 밖, 깊이가 음수가 되거나 끝에서 0이 아님).
  - signal: 종료 코드 1, stderr에 `build.mjs css:`와 css 파일 이름.
  - post-failure state: 어떤 JS 파일도 바뀌지 않는다.
- E-5: `--check`에서 어긋남.
  - signal: 종료 코드 1, stderr에 `build.mjs css:`와 어긋난 JS 파일 이름(여럿이면 모두). 어긋나지 않은 JS 파일 이름은 없다.
  - post-failure state: 파일을 쓰지 않는다.
- E-6(fixture 증거): R-2 errors의 판별력 가드가 깨진다.
  - signal: 결과 JSON `discriminating: false`, `bad ≥ 1`.
  - post-failure state: 그 실행은 VO-9 증거가 되지 못한다.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 실제 트리 다섯 쌍 | 구간 평가값 = N(css) |
| C-2 | normal | 실제 트리에서 `css --check` | 종료 코드 0 |
| C-3 | normal | 임시 트리: css 값 하나를 바꿈 → `--check` → `css` → `--check` → `css` | 1(파일 이름) → 0 → 0, 다시 만든 구간 = N(새 css), 마지막 `css`는 바이트 변화 없음 |
| C-4 | boundary | 임시 트리: N 규칙마다 하나씩 담은 입력. 주석, 따옴표 두 종류 문자열 안 `{ } ; , :`·`/*`·연속·끝 공백, 탭·CRLF, `{ } ; , >` 앞뒤 공백, `:` 뒤 공백, `.a :hover`, `calc(1px + 2px)`, `;}`, 중첩 `@media`, 앞뒤 공백 | 구간 평가값 = 손으로 쓴 기대 축약 문자열 |
| C-5 | boundary | 빈 css(주석만 있는 경우 포함) | 평가값 `""`, 오류 없음 |
| C-6 | error | E-1..E-4 각각(E-2는 네 가지 모양) | 종료 코드 1, stderr 내용, 다섯 JS 파일 바이트 불변 |
| C-7 | error | 두 JS가 어긋난 `--check` | 종료 코드 1, 두 파일 이름 |
| C-8 | normal | vm에 `ltt.js`·`ltt-parts.js`·`ltt-ui.js`·`ltt-mock.js` 로드(stub document) | parts·ui·mock `<style>` 텍스트 = N(css). `ltt.js` 텍스트에 N(ltt.css)가 정확히 한 번 들어 있고 그 앞에 `@font-face`, 뒤에 `themeCss` 출력이 있다(`:root[data-ltt-theme=` 로 시작하는 꼬리) |
| C-9 | normal | `build.mjs kit` + 심은 stale 파일, `npm pack --dry-run` | FR-5 |
| C-10 | normal | 갤러리 13편 × 1440×900·1280×800, 기준 대 최종 | R-1: `<style>` 텍스트 바이트 같음, DOM nomatch 0/26, audit 배열 같음·0/0, baseline sha 같음 |
| C-11 | normal | R-2 reveal·resize·timing·requests, 기준 대 최종 | 두 트리 모두 bad 0, 진입 zoom·요청 URL 집합 같음, timing 기준 |
| C-12 | error | R-2 errors 새 fixture | EG1·EG2·EG3·EG4·EG5·C16·C17 ok, `discriminating: true`(두 트리) |
| C-13 | edge | fixture 5장면 a를 다시 높게(HA 1400) | `discriminating: false` |
| C-14 | edge | 무작위 CSS 유사 입력 500개(fuzz) | 위반 0 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 생성기·어긋남 검사의 정확성 |
| Performance efficiency | yes | 런타임 요청 수와 진입 시간이 늘지 않아야 한다(`<link>` 기각 이유) |
| Compatibility | yes | 기존 수업·standalone·폰 화면이 같은 CSS 텍스트를 받는다 |
| Interaction capability | no | CSS 텍스트가 바이트 단위로 같아 화면이 바뀌지 않는다(FR-2가 보장, 깜빡임 경로 없음) |
| Reliability | no | 새 실패 경로는 생성기 입력 오류뿐이고 Errors E-1..E-5로 다룬다 |
| Security | no | 입력·권한·네트워크 표면 변화 없음(요청 불변은 FR-8) |
| Maintainability | yes | 이번 작업의 목적(CSS 수정 용이성, 어긋남 검출, 오류 경로 증거) |
| Flexibility | yes | npm 패키지·zip 설치본에 `.css`가 들어가야 한다(installability) |
| Safety | no | 해당 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Functional suitability / functional correctness | 생성기 CLI, 정규화 | VO-2·VO-3 시나리오 통과 수, fuzz 위반 수 | 100%, 위반 0/500 | automated VO-1..VO-3; fuzz VO-11; mutation HM-1, HM-2, HM-9 | FR-1, FR-3 |
| QR-2 | Compatibility / co-existence | 갤러리 13편 × 2크기, kit `<style>` 다섯 종 | R-1: 기준·최종 덤프에서 뽑은 kit `<style>` 텍스트의 바이트 비교, dom-match nomatch 수, audit 배열 차이 수 | 바이트 차이 0, nomatch 0/26, 차이 0/26, 경고 0, baseline sha 같음 | review R-1; automated VO-4; mutation HM-3 | FR-2, FR-8 |
| QR-3 | Performance efficiency / resource utilization | 갤러리 13편, 1440×813 | R-2 requests: 페이지마다 요청 URL(쿼리 제거) 집합, `.css` 요청 중 `/kit/vendor/` 밖 수 | 기준과 같은 집합 13/13, 0 | review R-2 | FR-8 |
| QR-4 | Performance efficiency / time behaviour | 1440×813, 갤러리 predict 장면 | R-2 timing: 이전 장면에서 들어가는 `go(i)` 동기 시간, 5회 중앙값(ms), 기준 대 최종 | 장면마다 최종 ≤ 기준 + 50 ms이고 ≤ 150 ms | review R-2 | FR-8 |
| QR-5 | Maintainability / modifiability | `.css` 한 곳 수정 → 재생성 | HM-1(수정만): 테스트·`--check` 실패 수; HM-3(규칙 삭제 + 재생성): R-1 바이트 차이 | 둘 다 탐지 | mutation HM-1, HM-3; automated VO-1 | FR-1, FR-3 |
| QR-6 | Maintainability / analysability | 오류 경로 증거(TV-6) | R-2 errors 항목 ok 수, 판별력 가드, HM-4..HM-8 탐지 수 | 7/7 ok(두 트리), `discriminating: true`, 5/5 탐지 | review R-2 errors; mutation HM-4..HM-8 | FR-9 |
| QR-7 | Maintainability / modularity | 다섯 JS 파일 소스 | R-3: 마커 밖 정적 CSS 문자열 수(`ltt.js`의 `@font-face`·`:root`·다크 블록·`themeCss` 제외), `<link` 생성 코드 수 | 0, 0 | review R-3 | FR-1, FR-8 |
| QR-8 | Flexibility / installability | npm 패키지, zip | VO-5 패키징 시나리오; R-3: `build.mjs zip` 결과에 `.css` 다섯 개 | 100%, 5/5 | automated VO-5; review R-3; mutation HM-10 | FR-5 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, FR-4, C-1 | 실제 트리 다섯 쌍 | unit, 다섯 쌍 전부 | equivalence partitioning | 쌍 5개 × {css 파일 있음, 시작·끝 마커 각 1회와 순서, 시작 마커 이름 = 짝, 구간 평가값 = 테스트가 구현한 N(css)}; css 파일 5개 × 형식 규칙(`{`·`;` 뒤 같은 줄 비공백 없음, `}` 줄, 들여쓰기 2 × 깊이, 선언 줄 `속성: 값;`, 마지막 선언 `;`); 쌍 5개 × 구간 모양(`[`…`].join("")`, 줄마다 JSON 문자열 하나, 줄 수 = 최상위 규칙 수, i번째 값 = i번째 규칙) | 100% | 모두 성립 | `tests/kit-css.test.mjs` |
| VO-2 | FR-3, E-1..E-5, C-2, C-3, C-5, C-6, C-7 | `build.mjs css` CLI(실제 트리와 임시 트리) | integration(실제 프로세스), 항목 전부 | scenario testing | S1 실제 트리 `--check` 0; S2 임시 트리 css 수정 → `--check` 1 + JS 이름, 다른 네 JS 이름 없음; S3 `css` 0 → 구간 = N(새 css), 마커 밖 바이트 같음; S4 직후 `--check` 0; S3 stdout 숫자 토큰 1, S5 두 번째 `css` 바이트 불변·stdout 숫자 토큰 0; S6 빈 css·주석만 → `""`; S7 E-1; S8 E-2 네 모양; S9 E-3 주석, E-3 문자열; S10 E-4 두 모양; S11 두 파일 어긋남 → 두 이름, 나머지 세 이름 없음; S7..S10은 다섯 JS 바이트 불변 | 100% | 기대 종료 코드·stderr·파일 상태 | `tests/kit-css.test.mjs`(임시 트리: `scripts/build.mjs`, `skills/learn-to-tell/kit/*.js|*.css`, `.claude-plugin/plugin.json`, `packages/ltt-kit/package.json`을 같은 상대 경로로 복사) |
| VO-3 | FR-1, C-4 | N 규칙 | integration(임시 트리 CLI) | syntax testing | N 규칙 1–6 각각과 C-4의 항목 12개(주석, `'` 문자열, `"` 문자열, 문자열 안 끝 공백, 탭·CRLF, `{`/`}`/`;`/`,`/`>` 주변, `:` 뒤, `.a :hover`, `calc` 안 ` + `, `;}`, 중첩 `@media`, 앞뒤 공백) | 100% | 손으로 쓴 기대 축약 문자열과 같다 | `tests/kit-css.test.mjs` |
| VO-4 | FR-2, C-8 | vm 런타임 `<style>` | unit, 네 모듈 | equivalence partitioning | parts·ui·mock 텍스트 = N(css); `ltt.js` 텍스트가 N(ltt.css)를 정확히 1회 포함, 그 앞부분이 `@font-face`로 시작, 뒷부분이 `:root[data-ltt-theme=`로 시작 | 100% | 위와 같다 | `tests/kit-css.test.mjs`(stub document는 `createElement`·`head.appendChild`·`addEventListener`, `matchMedia` 없음) |
| VO-5 | FR-5, C-9 | 패키징 | integration(실제 프로세스) | equivalence partitioning | `files`에 `*.css`; `build.mjs kit` 뒤 다섯 `.css`가 원본과 바이트 같음; 심은 `zz-stale.css`·`zz-stale.js` 없음; `npm pack --dry-run --json`에 다섯 `.css` | 100% | 모두 성립 | `tests/api-docs.test.mjs` VO-8 절(같은 파일 안에서 순서대로 실행해 다른 build kit 테스트와 겹치지 않게) |
| VO-6 | FR-6 | `package.json`, pre-commit | unit + integration | equivalence partitioning | `scripts.build:css`·`check:css` 값; pre-commit에 `build.mjs`와 `css --check`를 담은 줄이 버전 줄 뒤에 있음; 실제 트리에서 `bash scripts/git/pre-commit` 종료 코드 0; 임시 트리(VO-2와 같은 배치에 `scripts/git/pre-commit` 추가, `git init`)에서 어긋남이 없으면 0, css 값 하나를 바꾸면 ≠ 0 | 100% | 위와 같다 | `tests/kit-css.test.mjs` |
| VO-7 | FR-7 | 문서 3개 | unit(정적 문서) | syntax testing | CHANGELOG `## 0.2.0`의 kit 개발자용 줄 1개에 `.css`·`build:css`와 (`npm test` 또는 `--check`); internals.md `## CSS를 고치려면` 절에 `.css`, `npm run build:css`, `--check`, `themeCss`나 테마, `@font-face`, `css:start`와 `손으로`가 한 줄에; README `## 사용` 코드 블록에 `npm run build:css` | 100% | 토큰 존재 | `tests/release-docs.test.mjs` |
| VO-8 | FR-2, FR-8, QR-2, C-10 | 갤러리 실제 화면 | end-to-end review | metamorphic testing(기준 대 최종) | 26 덤프 파일 × kit `<style>` 다섯 종 바이트 비교; 최종 덤프에서 구성 검사(parts·ui·mock·deck `<style>` = N(짝 css), `#ltt-style` = 기준 `#ltt-style`에서 N(ltt.css) 앞부분 + N(ltt.css) + 기준 뒷부분, 기준 텍스트에 N(ltt.css)가 정확히 1회); dom-match 26; audit 26 × {audit, lint, expectFails}; baseline sha | 100% | 차이 0 | R-1(main): 기준 사본(`git archive 8522f70`) 덤프 5회 `0041d668222ce019-dom-dump.mjs`, 최종 사본 덤프 3회 이상 → `0041d668222ce019-dom-match.sh`; `bf761aaf871d8d45-style-diff.mjs`(덤프에서 kit `<style>` 추출·바이트 비교, v3부터 구성 검사 포함, N은 main 독립 구현); `audit.mjs --gallery --json` 두 트리 deep-equal |
| VO-9 | FR-9, E-6, QR-6, C-12, C-13 | 새 errors fixture | end-to-end review | error guessing | EG1(진입 throw: zoom 1, warn 글자 단위, 표시 없음); EG2(1440 진입 잠금 성공·warn 0, 공개 뒤 1280 resize: zoom = 새로 연 공개 zoom ±0.001, 새 warn 정확히 1개 글자 단위, 패널·`done`·버튼 표시·정답 글 유지, `.dk-still` 없음; 가드 fresh ≥ 0.79, fresh − successOnly ≥ 0.01, fresh − entry1440 ≥ 0.01); EG3(warn 글자 단위, `.pk` = 1, "단계 0", `min-height` ≠ 320px, `.dk-still` 없음); EG4(resize 뒤 warn 증가); EG5(공개 1회, 재측정 `s.reveal` 0·`LTT.record` 0); C16(호출 1); C17(`min-height` ≥ 300px) | none — experience-based | 두 트리 모두 `failed: []`, `discriminating: true`; HM-4..HM-8 각각 지정 항목 실패 | R-2(main): `bf761aaf871d8d45-cdp-review.mjs errors`를 기준·최종 사본에서 |
| VO-10 | FR-8, QR-3, QR-4, C-11 | 갤러리 R-2 | end-to-end review | metamorphic testing(기준 대 최종) | reveal 전 경우, resize 전 경우, timing predict 장면 전부, requests 13 페이지 | 100% | 두 트리 bad 0; 진입 zoom 기준과 \|Δ\| ≤ 0.001; 요청 집합 같음·kit 밖 `.css` 요청 0; QR-4 | R-2(main): 같은 하네스 `reveal`·`resize`·`timing`·`requests` |
| VO-11 | FR-1, FR-3, QR-1, C-14 | 생성기 CLI 입력 공간 | integration(main 실행) | random testing(differential) | 500 입력 | 예산 완주 | 위반 0(차분, 멱등, `--check` 0) | fuzz 결과 `bf761aaf871d8d45-css-fuzz-result.json`을 ledger에 |
| VO-12 | FR-1, FR-4, FR-8, QR-7, QR-8 | 소스·zip | review | error guessing | 다섯 JS의 마커 밖 문자열 리터럴(작은따옴표·큰따옴표·template, 주석 제외 토큰화) 중 `{`와 `:`를 함께 담거나 `}`로 끝나는 것(허용: `ltt.js` 머리 블록·THEMES 토큰과 `css`); kit JS의 `createElement("link")`·`<link`·`.css` 문자열; `.css` 주석마다 AGENTS.md 주석 규칙 판정(근거 종류 또는 이름표·서술 → 제거) 표; `standalone.md`·`kit/API.md` diff 없음; `build.mjs zip` 결과의 `.css` 5개 | none — experience-based | 허용 밖 0, 링크 0, 이름표 주석 0, diff 없음, 5/5 | R-3(main): `bf761aaf871d8d45-r3-source.mjs`(v3 토큰화) 출력, 주석 판정표 `bf761aaf871d8d45-r3-comments.md` |

hand mutation(main이 하나씩: `seed.py backup` → 주입 → 지정 절차 → `seed.py restore`). 고른 이유: 어긋난 채 배포, 생성기 입력 오류, 화면 변화를 놓침, 오류 경로 증거 판별력 상실이 이번 변경이 막아야 할 결함이다.
- HM-1: `ltt-deck.css` 값 하나를 바꾸고 재생성하지 않음 → VO-1 실패, VO-2 S1 실패, pre-commit 종료 코드 ≠ 0.
- HM-2: `ltt-deck.js`의 `/* css:end */`를 지움 → `build.mjs css` 종료 코드 1(파일 이름·`marker`), VO-1 실패.
- HM-3: `ltt-deck.css`에서 규칙 하나를 지우고 `build:css` → npm test는 통과(일관됨), R-1 `<style>` 바이트 차이와 dom-match nomatch로 탐지.
- HM-4: fixture 5장면 a 높이 1400 → errors `discriminating: false`.
- HM-5(P-1a): 배율 잠금 오류 경로가 `z = zoomLock(question, zs)` → EG1 zoom ≠ 1, EG2 zoom ≠ fresh.
- HM-6(P-1b): 오류 경로가 잠금 전 `ctx.zmax`를 유지 → EG2 zoom ≠ fresh(EG1은 통과할 수 있음).
- HM-7(P-2): figure 미리 그리기 뒤 `.pk` 정리를 뺌 → EG3 `.pk` = 2.
- HM-8(P-3): 공개 상태 재측정 오류 경로에서만 warn 문구를 바꿈 → EG2 새 warn 문구 불일치(EG1은 통과).
- HM-9: 생성기 N이 `}` 앞 `;`를 남기고 재생성 → VO-1 또는 VO-3 실패.
- HM-10: `build.mjs kit`이 옛 `*.css`를 지우지 않음 → VO-5 stale 실패.

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| AD-1 | CSS 원본은 `.css`, 런타임은 편집 시점 생성 문자열. `<link>` 방식은 기각하고 기록을 남긴다 | 덱이 첫 `go`에서 동기로 잰다; artifact CSP의 외부 스타일시트 허용이 확인되지 않았다; jsDelivr 요청 5개 | user answer(사용자 결정 1) |
| AD-2 | 판정 기준은 `<style>` 텍스트 바이트 동일. 바뀌는 것은 공백·`;`·주석뿐이다 | 지금 문자열이 N의 고정점(main 확인) | user answer(이해 라운드 답 2) |
| AD-3 | `@font-face`와 `:root` 토큰 블록(고정 변수 포함), 다크 블록, `themeCss()`는 `ltt.js`에 남는다. `ltt.css`는 `body{…}`부터다 | `@font-face`를 옮기면 `KIT` 경로 치환이 필요하고, 토큰 블록 앞에 있어서 구간이 둘이 되거나 규칙 순서가 바뀐다(바이트 동일 위반). 런타임 치환 코드를 더하는 이점이 없다 | brief v1 — approved |
| AD-4 | 이름표 주석은 버리고 근거 주석만 CSS 주석으로 옮긴다 | AGENTS.md 주석 규칙 | user answer(이해 라운드 답 1) |
| AD-5 | 생성 식은 최상위 규칙마다 JSON 문자열 한 줄, `.join("")` | JS diff도 규칙 단위로 남는다 | brief v1 — approved |
| AD-6 | `--check`는 텍스트 기준(재생성이 구간을 바꾸면 어긋남). 테스트는 값 기준(평가값 = N)으로 따로 본다 | `--check` 통과 = `css`가 아무것도 바꾸지 않음 | brief v1 — approved |
| AD-7 | 생성기는 다섯 쌍을 먼저 모두 검증하고, 하나라도 실패하면 아무것도 쓰지 않는다 | 반쯤 쓴 상태를 남기지 않는다 | brief v1 — approved |
| AD-8 | `check:css` 스크립트를 `check:version`과 나란히 더한다 | 기존 관례 | brief v1 — approved |
| AD-9 | `build.mjs kit`은 패키지 루트의 `*.js`·`*.css`를 지운 뒤 복사한다. `build.mjs zip`·vercel은 디렉터리 복사라 바꾸지 않는다 | `build.mjs` 코드 | brief v1 — approved |
| AD-10 | 패키징 테스트는 `tests/api-docs.test.mjs`의 기존 VO-8 절에 둔다 | `node --test`는 파일마다 병렬로 돌아서, 두 파일이 `build.mjs kit`을 동시에 부르면 `packages/ltt-kit`에서 지우기·복사가 겹친다 | brief v1 — approved |
| AD-11 | TV-6 fixture: 1장면(EG1)은 그대로 둔다. 새 5장면은 선택지 순서 a(정답, 360px)·c(540px)·b(1300px 미만 폭에서만 throw, `?eg2safe`면 아무것도 그리지 않음), `unsure: false`. 2장면 0단계는 `diagram.send(count 1, ms 60000)`. 기준 트리 시험 실행: EG2 entry1440 0.8058, fresh 0.8946, successOnly 0.78, 공개 상태 resize zoom 0.8946, EG3 `.pk` 1, 전 항목 ok | 이해 라운드 분석(a만 줄이면 판별 불가) | user answer(이해 라운드 확인) + brief v1 — approved(수치) |
| AD-12 | R-2는 네 모드(reveal·resize·errors·timing)에 `requests` 모드를 더해 기준·최종 사본에서 돌린다. timing 임계값은 지난 run과 같다(기준 + 50 ms, 150 ms) | 사용자 결정 4, 지난 spec AD-14 | brief v1 — approved |
| AD-13 | fuzz는 CLI 차분 500 입력, seed 20261019 | 정규화가 이번 계약의 중심이고 프로세스 하나에 약 50 ms | brief v1 — approved |
| AD-14 | `standalone.md`는 바꾸지 않는다. 불러오는 주소와 순서가 그대로라 그 문장들이 계속 참이다 | standalone.md 26–37줄 | brief v1 — approved |
| AD-15 | README `## 사용`에 `npm run build:css` 한 줄을 더한다 | — | user answer(이해 라운드 답 3) |
| AD-16 | handoff d7cbe1b9의 Next Step 5에 있는 refactoring-4·5 handoff는 이미 `stale/`에 있다. 이번에는 d7cbe1b9와 12094d07만 닫는다 | `agent-docs/handoff/stale/` | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1, C-4, C-5, C-14 | VO-1, VO-3, VO-11, VO-12 | kit-css.test, fuzz, R-3 |
| FR-2 | C-8, C-10 | VO-4, VO-8 | kit-css.test, R-1 |
| FR-3 | C-2, C-3, C-6, C-7, C-14 | VO-2, VO-11 | kit-css.test, fuzz |
| FR-4 | C-1 | VO-1, VO-12 | kit-css.test, R-3 |
| FR-5 | C-9 | VO-5, VO-12 | api-docs.test, R-3 |
| FR-6 | — | VO-6 | kit-css.test |
| FR-7 | — | VO-7 | release-docs.test |
| FR-8 | C-10, C-11 | VO-8, VO-10, VO-12 | R-1, R-2, R-3 |
| FR-9 | C-12, C-13 | VO-9 | R-2 errors |
| E-1..E-5 | C-6, C-7 | VO-2 | kit-css.test |
| E-6 | C-13 | VO-9 | R-2 errors, HM-4 |
| QR-1 | C-3..C-7, C-14 | VO-2, VO-3, VO-11 | kit-css.test, fuzz |
| QR-2 | C-10 | VO-4, VO-8 | R-1 |
| QR-3 | C-11 | VO-10 | R-2 requests |
| QR-4 | C-11 | VO-10 | R-2 timing |
| QR-5 | C-1, C-3 | VO-1, VO-2 | HM-1, HM-3 |
| QR-6 | C-12, C-13 | VO-9 | R-2 errors, HM-4..HM-8 |
| QR-7 | — | VO-12 | R-3 |
| QR-8 | C-9 | VO-5, VO-12 | api-docs.test, R-3 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 2 |
| verifier invocations | 2 |
| open finding ids | none (advisory BV2-1..BV2-7, A-1·A-4..A-7) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 3 | `tests/kit-css.test.mjs` VO-1(batch 2: 구간 모양 5건, 형식 규칙 확장) | accepted (verifier 2) | verifier 1 accepted(v2). batch 2로 테스트 바뀜. HM-1·HM-2·HM-11·HM-12 탐지(재실행) | `formatErrors`·`topRules`·`shapeErrors` 바뀜(BV-1a·b) |
| VO-2 | 3 | `tests/kit-css.test.mjs` VO-2(batch 2: S3·S5 stdout, S6 모양, A-3 css 바이트) | accepted (verifier 2) | verifier 1 accepted(v2). HM-1·HM-2·HM-9 재실행 탐지 | `assertShape`·`cssSnapshot` 추가(BV-1c, A-3) |
| VO-3 | 3 | `tests/kit-css.test.mjs` VO-3(batch 2: 14건에 모양 검사) | accepted (verifier 2) | verifier 1 accepted(v2). HM-9 재실행 탐지 | `assertShape` 공유 |
| VO-4 | 3 | `tests/kit-css.test.mjs` VO-4 | accepted (verifier 1, retained by verifier 2) | — | batch 2에서 바뀌지 않음; ltt-deck.css 주석 삭제는 VO-4 대상(parts·ui·mock·ltt) 밖 |
| VO-5 | 3 | `tests/api-docs.test.mjs` VO-8 bf761 VO-5 | accepted (verifier 1, retained by verifier 2) | HM-10 재실행 탐지 | 바뀌지 않음 |
| VO-6 | 3 | `tests/kit-css.test.mjs` VO-6(batch 2: 임시 git 트리 2건) | accepted (verifier 2) | verifier 1 accepted(v2). HM-13(`\|\| true`) 탐지 | BV-1d |
| VO-7 | 3 | `tests/release-docs.test.mjs` VO-7 | accepted (verifier 1, retained by verifier 2) | — | 바뀌지 않음 |
| VO-8 | 3 | R-1 v3: `agent-docs/spec-logs/bf761aaf871d8d45-r1-style-diff-{1..5}.json`(구성 검사 `composition: true`, bad 0), dom-match 5 대 5 nomatch 0, audit 배열 차이 0 | accepted (verifier 2) | verifier 1 accepted(v2). 구성 검사 민감도: 규칙 하나 뺀 kit 사본 26/26 bad. HM-3 탐지 | 절차 바뀜(BV-2) |
| VO-9 | 3 | R-2 errors | accepted (verifier 1, retained by verifier 2; TV-6 닫힘) | HM-4..HM-8 | 덤프 사본은 주석 삭제 전 트리지만 구간·런타임 불변(`--check` 0) |
| VO-10 | 3 | R-2 reveal·resize·timing·requests | accepted (verifier 1, retained by verifier 2) | — | 같은 이유로 유지 |
| VO-11 | 3 | fuzz | accepted (verifier 1, retained by verifier 2) | — | 생성기 바뀌지 않음 |
| VO-12 | 3 | R-3 v3 `agent-docs/spec-logs/bf761aaf871d8d45-r3-source.mjs`(토큰화)·`-r3-source.json`, 판정표 `agent-docs/spec-logs/bf761aaf871d8d45-r3-comments.md` | accepted (verifier 2) | HM-14(마커 밖 작은따옴표 CSS) R-3 탐지 | 절차 바뀜 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 0 | 착수 전 확인 | — | 기준 문자열 추출(scratchpad): 다섯 `STYLE` 정적 문자열에 `;}`·`{`/`}` 주변 공백·`: `·`, `·`>` 주변 공백·연속 공백 0건, ` + ` 3건(모두 `calc`), 백슬래시 0. 펼친 뒤 N 적용 → 다섯 파일 바이트 동일. TV-6 fixture 시험(기준 트리): 첫 높이(a 120, c 330)에서 a가 떠서 fresh 1, entry1440 1 → 가드 `aboveOld` 실패. a 360 / c 540으로 정함: entry1440 0.805793, fresh 0.89456, successOnly 0.78, 전 항목 ok, EG3 `.pk` 1 | 수치를 AD-11에 기록 |
| 1 | implementer·test-implementer 첫 보고, npm test 991/991 pass(15.0 s). test-implementer challenge 6건(VO-3 개수 오기, FR-7 대비 VO-7 토큰 누락, E-2..E-4 stderr 접두, E-5 어긋나지 않은 이름, 규칙 5 한 번/순서, `}` 줄 정의) | 계약 빈틈(구현 결함 아님) | spec v2(계약만), test-implementer correction batch 1(S2·S11 이름 부재, VO-7 토큰 2개, rule 5 경우 2개). 구현은 v2 계약을 이미 만족(stderr는 어긋난 파일만, CHANGELOG `npm test`, internals `css:start`+`손으로` 한 줄)해 재지시 없음 | npm test 996/996 pass |
| 2 | 최종 트리 main 증거(구현 보고 직후 scratchpad 사본 `final`) | 최종 덤프 1–3회 대조에서 `1280x800__philosophy__trolley-ethics.html` nomatch 1: 경로 하나의 인라인 `opacity` 유무(d3 `style("opacity")` transition 시작 전에 찍힘). 덤프 1–3은 npm test와 동시에 돌았다 | 부하 없는 상태에서 덤프 2회 추가(총 5 대 5, 지난 run 규칙) | R-1: dom-match `files=26 nomatch=0`; kit `<style>` 바이트 비교 5회 모두 `styleDiff=0`(기준 dom-base-1 대비); audit 26회 기준과 audit·lint·expectFails 배열 차이 0, 경고 0; `tests/gallery-audit.baseline.json` 변경 없음(sha256 644c2b2f…7e). R-2: reveal 110/110 두 트리 bad 0, 진입·공개 zoom 최대 \|Δ\| 0; resize 60 두 트리 bad 0; timing 12장면 최대 증가 +0.6 ms, 최대 16.4 ms; requests 13페이지 요청 경로 집합 같음, kit 밖 `.css` 0; errors 두 트리 `failed: []`, `discriminating: true`, 행 JSON 동일(EG2 entry1440 0.805793, fresh 0.89456, successOnly 0.78, zoom 0.89456, 새 warn 1개 글자 일치; EG3 `.pk` 1). fuzz 500 입력 위반 0. R-3: 마커 밖 CSS 문자열은 `ltt.js`의 `@font-face` 4·다크 media·THEMES `css`(themeCss 재료)뿐, 나머지 hit는 JS 객체 리터럴 조각(수동 분류); `<link`·`.css` 문자열 0; `.css` 주석 7개 모두 근거 주석(이름표 24개 제거); `standalone.md`·`kit/API.md`·`SKILL.md` diff 없음; zip에 `.css` 5개 |
| 3 | hand mutation HM-1..HM-10(`agent-docs/spec-logs/bf761aaf871d8d45-hand-mutations.py`, seed.py backup/restore, 끝난 뒤 `git diff` md5 동일) | — | 결과 `agent-docs/spec-logs/bf761aaf871d8d45-hand-mutations-result.json`, `seed: none` | 10/10 탐지. HM-1: VO-1 region·S1 실패(35 fail, 임시 트리 시나리오의 사전조건 `--check` 0도 실패), `--check` 1 `ltt-deck.js: drift`, pre-commit 1. HM-2: `css` 1 `marker`, VO-1 마커 실패. HM-3: 재생성 뒤 R-1 styleDiff 26·nomatch 26, gallery-audit 기준선 테스트 1 fail(spec 예상 "npm test 통과"보다 강하게 탐지). HM-4: `discriminating: false`(가드 3개 실패). HM-5: EG1 zoom 0.78 실패; EG2는 fresh도 같은 변이 코드라 zoom = fresh였고 가드(fresh 0.78)가 `discriminating: false`로 잡음(spec의 "EG2 zoom ≠ fresh" 기대는 틀렸고 가드가 그 몫을 함). HM-6: EG2만 실패(zoom 0.805793 = 옛 zmax), EG1 통과. HM-7: EG3 `.pk` 3. HM-8: EG2 새 warn 0개(문구 불일치), EG1 통과. HM-9: S1·VO-3 등 34 fail. HM-10: VO-5 stale 1 fail. mutation 도구 없음 |
| 4 | TV-6(handoff d7cbe1b9) 대응 확인 | — | (a) 공개 상태 재측정 throw 뒤 zmax 1: HM-5·HM-6이 EG1·EG2·가드로 구별되고, fixture 퇴화(HM-4)는 가드가 잡는다. 세 번째 warn: EG2 `newWarns` 글자 단위 비교, HM-8 탐지. (b) E-2 `.pk` 정리: EG3 `.pk` 1, HM-7에서 3 | verifier 감사 대기 |
| 5 | verifier 1 retry: BV-1(blocking spec challenge: AD-5 구간 모양, `.css` 들여쓰기·`속성: 값;`, `css` stdout, UI-2 pre-commit 실패 방향이 어떤 VO에도 없음), BV-2(blocking: R-3 정규식이 작은따옴표·template·나뉜 연결을 못 봄, 마커 밖 정적 CSS가 런타임 동일인 채 남는 결함을 못 잡음), BV-3(blocking: 주석별 판정 기록 없음, 서술형 2개). VO-1..VO-11 accepted, TV-6 (a)(b) 닫힘. advisory A-1..A-7 | 계약 빈틈 2(BV-1), 증거 정밀도(BV-2, BV-3) | spec v3(계약·증거만, 이미 승인된 FR·AD의 coverage 추가). BV-1 → VO-1·VO-2·VO-6 항목 추가(test-implementer batch 2). BV-2 → R-1에 런타임 구성 검사(style-diff v3, main 독립 N), R-3 문자열 토큰화. BV-3 → 판정표 `bf761aaf871d8d45-r3-comments.md`, "skip-before-reveal nudge" 주석을 서술로 판정해 제거(implementer batch 2, 구간 불변). A-2: hand mutation 결과에 실패 목록 전체 저장. A-3: test-implementer가 css 바이트 불변 단언 추가. A-1·A-4·A-5·A-6·A-7은 advisory로 둠(A-4는 기준·최종 행 JSON 동일 비교가 이번 run의 회귀를 막음) | v3 |
| 6 | correction batch 2 결과 | — | implementer: 주석 1개 삭제, `css` 0 files regenerated, `--check` 0, v3 형식 위반 0. test-implementer: 구간 모양(5쌍, CLI S3·S6·VO-3 14건), 형식 규칙 확장(음수 단위 7건), stdout 숫자, 임시 git 트리 pre-commit 2건, A-3 | npm test 1020/1020 pass |
| 7 | v3 증거 | — | R-1 구성 검사: 최종 덤프 1–5 모두 `styleDiff=0 composition=on`(bad 0). 민감도: `.dk-top` 규칙을 뺀 `ltt-deck.css`와 `main` 규칙을 뺀 `ltt.css`로 대조하면 26/26 bad. R-3 토큰화: parts·ui·mock 0, deck 1(`"{}"`, JSON 기본값), ltt.js 49(모두 THEMES·머리 배열 안; 그 밖 3개는 `{{key}}` 용어 문법), `<link`·`.css` 0, zip `.css` 5, 문서 diff 없음. hand mutation 재실행·추가(`-hand-mutations-result.json`): HM-1 37 fail(VO-1 값·모양, S1 등), HM-2 38, HM-9 35(VO-3), HM-10 1(VO-5), HM-11(구간을 문자열 하나로 생성) 20 fail(VO-1 모양 5쌍 등), HM-12(마지막 `;` 빼고 4칸 들여쓰기, 값 불변) VO-1 형식 1 fail, HM-13(pre-commit `\|\| true`) VO-6 임시 트리 1 fail, HM-14(ltt-deck.js 마커 밖 작은따옴표 CSS) R-3 deck hit `.dk-x{color:red}`. 모두 탐지, 복원 뒤 `git diff` md5 동일 | verifier 2 감사 대기 |
| 8 | verifier 2 실행이 API 사용량 한도(HTTP 429)로 중간에 끊김 | 외부 한도 | 같은 verifier 에이전트를 이어서 실행(SendMessage, 저장된 작업에서 계속). 새 verifier를 띄우지 않으므로 호출 수는 2 그대로 | 감사 재개 |
| 9 | verifier 2 pass(이어서 실행 뒤 완료): VO-1·VO-2·VO-3·VO-6·VO-8·VO-12 accepted, VO-4·VO-5·VO-7·VO-9·VO-10·VO-11 retained(주석 삭제 전 사본의 R-2·fuzz는 구간·런타임 바이트가 같아 유효하다는 판단 수용). BV-1..BV-3 해소. advisory BV2-1(stdout 숫자 단언이 다른 숫자의 부재는 안 봄), BV2-2(`#ltt-style` 구성 검사가 ltt.css 첫·끝 규칙을 마커 밖에 둔 경우는 VO-4 꼬리 검사와 R-3 순서 출력에 기댐), BV2-3(r3 판정표 기록 불일치), BV2-4(토큰화기 경계), BV2-5(주석으로 시작하는 코드 줄 들여쓰기 미정의), BV2-6(hand-mutation 머리 주석 HM-15 오기), BV2-7(handoff·기각 기록은 main 종료 조건) | — | BV2-3: `-r3-comments.md`의 허용 구간 밖 리터럴 설명을 고침(`}}` 하나, lint 메시지 조각; `{{key}}` 계열은 주석 안 글자를 단순 정규식으로 센 오기). BV2-6: 스크립트 머리 주석 HM-14로 고침. BV2-7: 기각 기록 `agent-docs/rejections/f9e3756dd41b66c2-kit-css-runtime-link.md`와 index 블록(brief v1 승인 문구 그대로), handoff 12094d07·d7cbe1b9에 종료 ledger 줄을 더하고 index → stale.md, 파일 → stale/(Failed Attempts 행은 고치지 않음). 나머지 advisory는 남김 | complete |

# Version Log
## v3 (종료 기록)
- verifier 2 pass, 모든 의무 accepted, status complete. 계약 변경 없음.
## v3
- 계약·증거만 고침(재브리프 없음), verifier 1 retry(BV-1..BV-3)에 따름: 생성 구간 모양을 정확히 정의하고 VO-1에 넣음(BV-1a); `.css` 형식의 들여쓰기·`속성: 값;`·마지막 `;`를 검사 가능한 정의로 바꾸고 VO-1에 넣음(BV-1b); `css` stdout 숫자 토큰을 Signatures와 VO-2에 넣음(BV-1c); VO-6에 임시 git 트리 pre-commit 어긋남 실패를 넣음(BV-1d, UI-2); VO-8 R-1에 런타임 `<style>` 구성 검사(마커 밖 정적 CSS가 없음을 런타임으로 봄, BV-2); VO-12 R-3을 문자열 토큰화로 바꾸고 주석 판정표를 남김(BV-2, BV-3).
## v2
- 계약만 고침(재브리프 없음, test-implementer 보고): N 적용 순서·규칙 5 한 번(`;;}`); `.css` 형식의 `}` 줄 정의(`}}` 허용, brief 정의와 맞춤); E-2..E-4 stderr에 `build.mjs css:` 접두(구현 지시와 같음); E-5·S2·S11에 어긋나지 않은 JS 이름 없음; VO-3 항목 수 오기 13 → 12; VO-7에 FR-7의 어긋남 검사 토큰과 마커 구간 손 편집 금지 토큰 추가(FR-7 대비 누락).
## v1
- 이해 라운드 답(1 주석 규칙, 2 바이트 동일, 3 README)과 착수 전 확인(ledger 0)으로 초안 작성.
- 승인: brief v1 전 항목 승인(Ask 1 기각 기록 초안과 index 블록 그대로, Decided 1–13). status active.
