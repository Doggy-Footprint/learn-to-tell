| # | base section | base first cell | base line | best file:line | word match | number check | polarity diff | base sentence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | kit API |  | 3 | API.md:3 | 0.86 | ok |  | 수업은 빈 `lesson.html`에서 이 부품들을 조합해 짠다. |
| 2 * | kit API |  | 3 | API.md:3 | 0.57 | ok |  | 모든 부품이 실제로 동작하는 모습과 그 코드는 `https://learn-to-tell.vercel.app/gallery/catalog.html`에 있다. |
| 3 | kit API |  | 3 | API.md:3 | 0.82 | ok |  | 장면 타입별 예시는 `https://learn-to-tell.vercel.app/gallery/scenes.html`에 있다. |
| 4 | 불러오기 |  | 7 | API.md:19 | 1.00 | ok |  | 뒤 모듈이 앞 모듈을 쓴다. |
| 5 | 불러오기 |  | 26 | API.md:141 | 1.00 | ok |  | 페이지에는 모델 함수, 기대값, 장면 데이터, 그 수업에만 필요한 작은 CSS를 둔다. |
| 6 * | 불러오기 |  | 26 | API.md:142 | 0.75 | ok | 아래 | 색은 아래 토큰만 쓴다. |
| 7 | 불러오기 |  | 26 | API.md:142 | 1.00 | ok |  | hex를 새로 적으면 다크 모드가 깨진다(목업 속 '실제 화면' 색은 예외). |
| 8 | ltt.js: 기초 | `LTT.theme(name)`, `LTT.themes` | 32 | API.md:42 | 1.00 | ok |  | 도메인 테마를 고른다. |
| 9 | ltt.js: 기초 | `LTT.theme(name)`, `LTT.themes` | 32 | API.md:42 | 1.00 | ok |  | 덱에서는 `LTT.deck({theme})`로 넘긴다. |
| 10 | ltt.js: 기초 | `LTT.theme(name)`, `LTT.themes` | 32 | api/base.md:23 | 1.00 | ok |  | 테마는 토큰 값과 표면(모서리, 그림자, 제목 폰트, 배경 격자)만 바꾸므로 같은 부품이 다른 매체처럼 보인다. |
| 11 | ltt.js: 기초 | 토큰 | 33 | API.md:43 | 0.77 | ok |  | `--ltt-bg` `--ltt-card` `--ltt-card-2` `--ltt-line` `--ltt-line-2` `--ltt-ink` `--ltt-ink-2` `--ltt-muted` `--ltt-accent(-soft)` `--ltt-good(-soft)` `--ltt-bad( |
| 12 | ltt.js: 기초 | 토큰 | 33 | api/base.md:10 | 1.00 | ok |  | 다크 모드는 `prefers-color-scheme`를 따르고, `<html data-theme="light / dark">`로 고정할 수 있다. |
| 13 | ltt.js: 기초 | 폰트 | 34 | api/base.md:11 | 1.00 | ok |  | 본문 Pretendard Variable, 세리프 `'LTT Serif'`(Noto Serif KR), 모노 `'LTT Mono'`(D2Coding). |
| 14 | ltt.js: 기초 | 폰트 | 34 | api/base.md:11 | 1.00 | ok |  | 세리프·모노는 KS X 1001 한글 2,350자 + 라틴 subset이라 빠진 음절은 시스템 폰트로 그린다. |
| 15 | ltt.js: 기초 | 폰트 | 34 | api/base.md:11 | 1.00 | ok |  | 숫자·코드는 `var(--ltt-mono)`, 세리프 제목은 테마의 `--ltt-font-display`. |
| 16 | ltt.js: 기초 | `LTT.palette()`, `LTT.palette(theme, "li | 35 | API.md:44 | 1.00 | ok |  | 인자 없이 부르면 지금 페이지의 테마·다크 모드 값. |
| 17 | ltt.js: 기초 | `LTT.palette()`, `LTT.palette(theme, "li | 35 | API.md:44 | 1.00 | ok |  | 계열 구분에만 쓰고 판정(good·bad)에는 쓰지 않는다. |
| 18 | ltt.js: 기초 | `LTT.palette()`, `LTT.palette(theme, "li | 35 | api/base.md:12 | 1.00 | ok |  | 모든 테마에서 배경 대비 3:1 이상(글자 토큰 `ink`·`ink-2`·`muted`·`accent`·`good`·`bad`·`warn`은 바탕·카드·자기 soft 위 4.5:1 이상), 색각 이상(적록·청황) 시뮬레이션에서도 구분된다(`tests/kit.test.mjs`). |
| 19 | ltt.js: 기초 | `LTT.mark(kind, {size, color, weight, fi | 36 | API.md:45 | 0.75 | ok |  | 모양 표식 SVG 문자열(square, ring, dot, diamond, cross, 목록은 `LTT.marks`). |
| 20 | ltt.js: 기초 | `LTT.mark(kind, {size, color, weight, fi | 36 | api/base.md:13 | 1.00 | ok |  | (0,0) 중심이라 d3 `g.html(...)`에 넣는다. |
| 21 | ltt.js: 기초 | `LTT.mark(kind, {size, color, weight, fi | 36 | api/base.md:13 | 1.00 | ok |  | `inline: true`면 1em `<svg>`로 감싸 본문·범례에 쓴다. |
| 22 | ltt.js: 기초 | `LTT.mark(kind, {size, color, weight, fi | 36 | API.md:45 | 1.00 | ok |  | 색만으로 계열을 가르지 않게 모양을 함께 쓴다. |
| 23 | ltt.js: 기초 | `LTT.themeTokens(theme, scheme)` | 37 | api/base.md:16 | 1.00 | ok |  | 문서 없이 테마의 색 토큰 객체(`{bg, ink, c1, …}`). |
| 24 | ltt.js: 기초 | `LTT.themeTokens(theme, scheme)` | 37 | api/base.md:16 | 1.00 | ok |  | 테스트·서버 쪽 계산용. |
| 25 | ltt.js: 기초 | `LTT.icon(name, {weight, cls})` | 38 | API.md:46 | 1.00 | ok |  | 선 아이콘 SVG 문자열. |
| 26 * | ltt.js: 기초 | `LTT.icon(name, {weight, cls})` | 38 | API.md:7 | 0.25 | ok |  | 이름 목록은 `LTT.icons`. |
| 27 | ltt.js: 기초 | `LTT.icon(name, {weight, cls})` | 38 | API.md:46 | 1.00 | ok |  | hook `art`, explain·terms·facts `icon`, diagram 노드 `icon`에는 이름만 넘긴다. |
| 28 | ltt.js: 기초 | `LTT.icon(name, {weight, cls})` | 38 | API.md:46 | 1.00 | ok |  | 목록에 없는 값(이모지 등)은 글자로 그린다. |
| 29 | ltt.js: 기초 | `LTT.icon(name, {weight, cls})` | 38 | api/base.md:14 | 1.00 | ok |  | 장면의 그림 칸(compare·explain·terms `visual`, predict `visual`·`answerVisual`, figure)에 아이콘 하나만 넣으면 본문 글자 크기가 아니라 칸에 맞는 크기(44–84px, 강조색)로 그린다. |
| 30 | ltt.js: 기초 | `LTT.icon(name, {weight, cls})` | 38 | api/base.md:14 | 1.00 | ok |  | 문장 속·버튼·범례 아이콘은 1em 그대로다. |
| 31 | ltt.js: 기초 | `LTT.icon(name, {weight, cls})` | 38 | api/base.md:14 | 1.00 | ok |  | SVG 안(diagram·sequence 노드)에서는 글자가 보이지 않으니 이름만 쓴다. |
| 32 | ltt.js: 기초 | `LTT.icon(name, {weight, cls})` | 38 | api/base.md:15 | 1.00 | ok |  | 손으로 그린 44개 + Lucide에서 가져온 16개(globe, map-pin, route, git-branch, timer, database-zap, network, shield-check, key-round, mail, package, truck, wifi, cloud, gauge |
| 33 | ltt.js: 기초 | `LTT.icon(name, {weight, cls})` | 38 | api/base.md:15 | 1.00 | ok |  | 더 필요하면 Lucide에서 그 아이콘만 `ICONS`에 옮긴다(전체 세트는 넣지 않는다). |
| 34 | ltt.js: 기초 | `{{용어}}`, `{{보이는 말\/용어}}` | 39 | API.md:47 | 1.00 | ok |  | 본문 속 용어 표시. |
| 35 | ltt.js: 기초 | `{{용어}}`, `{{보이는 말\/용어}}` | 39 | API.md:47 | 1.00 | ok |  | 덱이 풀이 팝오버로 바꾼다(마우스 올리기·탭). |
| 36 | ltt.js: 기초 | `{{용어}}`, `{{보이는 말\/용어}}` | 39 | API.md:47 | 1.00 | ok |  | 처음 나온 장면은 진하게 표시된다. |
| 37 | ltt.js: 기초 | `LTT.linkTerms(el, sceneIndex)` | 40 | api/base.md:17 | 1.00 | ok |  | 덱 밖이나 나중에 그린 DOM의 `{{}}`를 바꾼다. |
| 38 | ltt.js: 기초 | `LTT.linkTerms(el, sceneIndex)` | 40 | api/base.md:17 | 1.00 | ok |  | 덱은 장면 마운트, predict 공개, compare 공개, summary recall의 답 보기, stepper 자막에서 알아서 부른다. |
| 39 | ltt.js: 기초 | `LTT.lintDeck(spec)` | 41 | API.md:48 | 1.00 | ok |  | 독학 기준 점검. |
| 40 | ltt.js: 기초 | `LTT.lintDeck(spec)` | 41 | API.md:48 | 1.00 | ok |  | `[{scene, rule, msg}]`. |
| 41 | ltt.js: 기초 | `LTT.lintDeck(spec)` | 41 | API.md:48 | 0.67 | ok |  | 덱이 시작할 때 실행해 경고를 화면 오른쪽 아래 패널에 띄우고 `lint` 이벤트로 남긴다. |
| 42 | ltt.js: 기초 | `LTT.record(type, data)` | 42 | API.md:50 | 1.00 | ok |  | lesson 페이지에서만 서버로 이벤트를 보낸다. |
| 43 | ltt.js: 기초 | `LTT.expect(label, actual, expected, {to | 43 | API.md:49 | 1.00 | ok |  | 불일치는 패널과 서버에 남는다. |
| 44 | ltt.js: 기초 | `LTT.contrast(a, b)` | 45 | api/ui.md:22 | 1.00 | ok |  | 두 hex 색의 WCAG 대비비. |
| 45 | ltt.js: 기초 | `LTT.summaryCards(scene, scenes)` | 46 | api/base.md:19 | 1.00 | ok |  | summary 장면이 보일 항목 목록(lint와 덱이 같이 쓴다). |
| 46 | 테마 | theme | 50 | api/base.md:25 | 1.00 | ok |  | 흉내 내는 매체 / 맞는 도메인 |
| 47 | 테마 | `paper` | 52 | api/base.md:27 | 1.00 | ok |  | 논문 figure·교과서: 크림 종이, 세리프 제목, 괘선, 그림자 없음 / 수학, 교육학, 인지과학, 연구 설계 |
| 48 | 테마 | `blueprint` | 53 | api/base.md:28 | 1.00 | ok |  | 회로·블록 도면: 남색 격자, 모노 라벨, 선만 있는 상자 / GPU, 하드웨어, 시스템·네트워크 구조 |
| 49 | 테마 | `terminal` | 54 | api/base.md:29 | 1.00 | ok |  | 터미널·로그·대시보드: 검정 바탕, 모노 번호, 녹색 강조 / 백엔드, 인프라, CLI, 운영 |
| 50 | 테마 | `ledger` | 55 | api/base.md:30 | 1.00 | ok |  | 경제 신문 차트: 살구색 종이, 세리프 헤드라인, 각진 표 / 금융, 경제, 비즈니스 지표 |
| 51 | 테마 | `lab` | 56 | api/base.md:31 | 1.00 | ok |  | 실험 노트·모눈 플롯: 모눈 배경, 주황 펜 색 / 물리, 공학, 시뮬레이션 |
| 52 | 테마 | `studio` | 57 | api/base.md:32 | 1.00 | ok |  | 제품 화면·디자인 툴: 중립 회색, 둥근 카드 (기본) / UI/UX, 제품 |
| 53 | 테마 | `sketch` | 58 | api/base.md:33 | 1.00 | ok |  | 화이트보드·손그림 설명: 흰 보드(다크는 칠판), 굵은 마커 선. |
| 54 | 테마 | `sketch` | 58 | api/base.md:33 | 1.00 | ok |  | `rough.js`를 불러오면 diagram이 손그림 선으로 그려진다 |
| 55 | 테마 | `sketch` | 58 | API.md:65 | 1.00 | ok |  | / 개념 첫 소개, 아키텍처 스케치, 브레인스토밍 |
| 56 | 테마 | `atlas` | 59 | api/base.md:34 | 1.00 | ok |  | 지도·지리·물류: 바다·육지 색 토큰, 모노 번호 / 지리, 물류, 리전·지연 시간, 공급망 |
| 57 | 테마 |  | 61 | API.md:143 | 1.00 | ok |  | 테마는 매체를 고르는 것이지 장식이 아니다. |
| 58 | 테마 |  | 61 | API.md:143 | 1.00 | ok |  | 페이지 CSS에서 토큰을 다시 정의하지 않는다. |
| 59 * | lint 규칙 | `unknown-term` | 67 | API.md:72 | 0.57 | ok |  | `{{x}}`인데 `glossary`에도 `terms` 장면에도 풀이가 없다 |
| 60 * | lint 규칙 | `used-before-defined` | 68 | API.md:72 | 0.29 | ok | 없,전 | glossary 용어가 처음 `{{}}`로 표시되기 전 장면에 그냥 쓰였다 |
| 61 | lint 규칙 | `predict-new-term` | 69 | API.md:74 | 0.83 | ok |  | predict의 질문·선택지에서 처음 나온 용어 |
| 62 | lint 규칙 | `no-reading-guide` | 70 | API.md:75 | 1.00 | ok |  | compare·contrast·figure·overview·타입 없는 `mount` 장면에 `narration`·`points`·`sub`·`caption`(contrast는 `before.points`도)이 없다 |
| 63 | lint 규칙 | `no-title` | 71 | API.md:77 | 1.00 | ok |  | 제목 없는 장면(hook·summary·keywords 제외) |
| 64 | lint 규칙 | `overview-missing` | 72 | API.md:76 | 1.00 | ok |  | summary가 있는데 한 장 정리(`overview`)가 없다 |
| 65 | lint 규칙 | `overview-order` | 73 | API.md:76 | 1.00 | ok |  | overview가 summary 뒤, keywords 바로 앞이 아니다 |
| 66 | lint 규칙 | `overview-no-visual` | 74 | API.md:76 | 1.00 | ok |  | overview에 `figure`가 없다 |
| 67 * | lint 규칙 | `keywords-last` | 75 | API.md:77 | 1.00 | ok | 없 | 마지막 장면이 keywords가 아니다 |
| 68 | lint 규칙 | `unused-term` | 76 | API.md:78 | 0.60 | ok |  | glossary에 넣고 어디에도 표시하지 않았다 |
| 69 * | lint 규칙 | `term-no-visual` | 77 | API.md:79 | 1.00 | ok | 못 | terms 항목에 `visual`이 없다. |
| 70 * | lint 규칙 | `term-no-visual` | 77 | API.md:79 | 0.57 | ok | 못 | 그림으로 보일 수 없는 말이면 `visual: false`로 밝힌다 |
| 71 | lint 규칙 | `summary-no-recall` | 78 | API.md:80 | 0.83 | ok |  | summary가 모으는 takeaway에 `recall` 질문이 없다 |
| 72 | lint 규칙 | `card-monotony` | 79 | API.md:81 | 1.00 | ok |  | 카드 격자 장면(explain `cards`, compare, terms, `recall` 없는 summary)이 3장 연속이거나, hook·keywords를 뺀 장면의 절반 초과 |
| 73 | lint 규칙 | `no-signature` | 80 | API.md:82 | 1.00 | ok |  | 그림이 주인공인 장면(`figure`, `contrast`, `layout: "full"`, 타입 없는 `mount`)이 없다 |
| 74 * | lint 규칙 | `no-theme`, `unknown-theme` | 81 | API.md:83 | 0.60 | ok | 않 | `theme`을 고르지 않았거나 없는 이름이다 |
| 75 | lint 규칙 | `filler-content` | 82 | API.md:84 | 1.00 | ok |  | "항목 1", "샘플 텍스트", lorem, TODO 같은 채움 글 |
| 76 | 화면 점검 (`?audit`) |  | 86 | API.md:88 | 1.00 | ok |  | lint는 장면 데이터만 본다. |
| 77 | 화면 점검 (`?audit`) |  | 86 | API.md:88 | 0.86 | ok |  | 실제로 그려진 화면은 URL에 `?audit`을 붙여 연다. |
| 78 * | 화면 점검 (`?audit`) |  | 86 | API.md:88 | 0.50 | ok |  | 덱이 모든 장면을 그려 재고, 결과를 패널 경고, `layout-audit` 이벤트, `<html data-ltt-audit="건수">`로 남긴다. |
| 79 | 화면 점검 (`?audit`) |  | 86 | api/deck-contracts.md:47 | 1.00 | ok |  | `LTT.deck(...)`가 돌려주는 객체의 `audit()`으로 직접 부를 수도 있다. |
| 80 | 화면 점검 (`?audit`) |  | 86 | api/deck-contracts.md:47 | 1.00 | ok |  | 판정은 `LTT.auditScene(측정값)`이 한다. |
| 81 | 화면 점검 (`?audit`) |  | 86 | api/deck-contracts.md:48 | 1.00 | ok |  | 결과는 `<script type="application/json" id="ltt-audit">`에 `{viewport, scenes, audit, lint, expectFails}`로도 남고, `server/audit.mjs`가 헤드리스 Chrome의 `--dump-dom` 출력에서 그 |
| 82 | 화면 점검 (`?audit`) |  | 88 | api/deck-contracts.md:49 | 1.00 | ok |  | 폭 1000px 이하 창에서는 `shrunk`·`small-visual`·`loose-figure`를 판정하지 않는다. |
| 83 | 화면 점검 (`?audit`) |  | 88 | api/deck-contracts.md:49 | 1.00 | ok |  | `small-visual`은 hook·terms·summary·keywords·statement·predict 장면에서도 판정하지 않는다. |
| 84 * | 화면 점검 (`?audit`) | `overflow`, `shrunk` | 92 | API.md:3 | 0.00 | MISS 88 | 미만 | / 화면에 맞추느라 88% 미만으로 줄었다 |
| 85 | 화면 점검 (`?audit`) | `small-visual` | 93 | API.md:93 | 1.00 | ok |  | 가장 큰 그림(compare는 칸 그림의 합)이 화면 넓이의 10% 미만, figure·full 장면은 22% 미만 |
| 86 * | 화면 점검 (`?audit`) | `loose-figure` | 94 | API.md:94 | 1.00 | ok | 만  | figure 그림이 figure 무대의 35% 미만 |
| 87 | 화면 점검 (`?audit`) | `empty-stage` | 95 | API.md:94 | 1.00 | ok |  | figure·full 장면이 화면 높이의 60% 미만만 쓴다 |
| 88 | 화면 점검 (`?audit`) | `many-sizes` | 96 | API.md:95 | 1.00 | ok |  | 장면 본문(목업·SVG·번호 표식 제외)에서 글자를 직접 가진 요소의 글자 크기가 7단계 초과 |
| 89 | 화면 점검 (`?audit`) | `graph-overlap` | 98 | API.md:96 | 0.75 | ok |  | 장면 속 diagram에서 라벨·노드·엣지가 겹친다(`LTT.graphOverlaps`) |
| 90 | 화면 점검 (`?audit`) | `panel-overlap` | 99 | API.md:97 | 1.00 | ok |  | figure 단계 자막 칸이나 펼친 predict 정답이 글 줄·컨트롤·그림(diagram은 노드·라벨 상자)과 겹친다 |
| 91 | 화면 점검 (`?audit`) | `goal-unreachable`, `goal-narrow`, `goal | 100 | API.md:98 | 0.83 | ok |  | `sweep` 목표가 손잡이의 어느 자리에서도 안 맞는다 |
| 92 | 화면 점검 (`?audit`) | `goal-unreachable`, `goal-narrow`, `goal | 100 | API.md:98 | 1.00 | ok |  | / 시작 위치에서 이미 맞는다. |
| 93 | 화면 점검 (`?audit`) | `goal-unreachable`, `goal-narrow`, `goal | 100 | api/deck-contracts.md:50 | 1.00 | ok |  | 최대 201곳(dial은 최대 360곳, pad·drag는 축마다 |
| 94 | 화면 점검 (`?audit`) | `goal-unreachable`, `goal-narrow`, `goal | 100 | api/deck-contracts.md:50 | 1.00 | ok |  | 41곳), 조합이 2만 개를 넘으면 고정 시드로 2만 개를 뽑아 `check`를 부른다 |
| 95 | 화면 점검 (`?audit`) |  | 102 | API.md:145 | 1.00 | ok |  | 작성·점검 기준은 1280px 이상 데스크톱이다. |
| 96 | 화면 점검 (`?audit`) |  | 102 | API.md:145 | 1.00 | ok |  | 1440×900과 1280×800 두 크기에서 0건이어야 한다. |
| 97 | 화면 점검 (`?audit`) |  | 104 | api/deck-contracts.md:54 | 1.00 | ok |  | 폰(폭 760px 미만, 또는 높이 500px 이하의 터치 화면)에서는 `<html data-ltt-mobile>`가 붙고, kit가 같은 장면을 다시 배치한다(`LTT.mobile()`). |
| 98 | 화면 점검 (`?audit`) |  | 104 | api/deck-contracts.md:54 | 1.00 | ok |  | 장면은 줄이지 않고 세로로 스크롤한다. |
| 99 | 화면 점검 (`?audit`) |  | 104 | api/deck-contracts.md:54 | 1.00 | ok |  | 모든 격자는 한 열이 되고, 그림 옆 설명은 그림 아래로 간다. |
| 100 | 화면 점검 (`?audit`) |  | 104 | api/deck-contracts.md:54 | 1.00 | ok |  | 글자가 10px 아래로 작아질 넓은 SVG는 그 크기를 지키고 자기 칸 안에서 가로로 스크롤한다. |
| 101 | 화면 점검 (`?audit`) |  | 104 | api/deck-contracts.md:54 | 1.00 | ok |  | 단 `steps`가 있는 figure의 그림은 단계마다 |
| 102 | 화면 점검 (`?audit`) |  | 104 | api/deck-contracts.md:54 | 1.00 | ok |  | 다시 그려질 수 있어 칸 폭에 맞춘다. |
| 103 | 화면 점검 (`?audit`) |  | 104 | api/deck-contracts.md:54 | 1.00 | ok |  | explain 단계 목록의 그림은 번호 칸을 비워 두고 글과 같은 열에 놓인다. |
| 104 | 화면 점검 (`?audit`) |  | 104 | api/deck-contracts.md:54 | 1.00 | ok |  | autoLayout 그래프는 `DOWN`으로 다시 배치된다. |
| 105 | 화면 점검 (`?audit`) |  | 104 | api/deck-contracts.md:54 | 1.00 | ok |  | 좌우로 밀면 장면이 넘어간다. |
| 106 | 화면 점검 (`?audit`) |  | 104 | api/deck-contracts.md:54 | 1.00 | ok |  | 참고용 화면이라 점검 대상이 아니다. |
| 107 | 화면 점검 (`?audit`) |  | 106 | API.md:144 | 1.00 | ok |  | 공개 전 경고는 0건이어야 한다. |
| 108 | 화면 점검 (`?audit`) |  | 106 | API.md:144 | 1.00 | ok |  | lint는 표시된 용어만 안다. |
| 109 | 화면 점검 (`?audit`) |  | 106 | API.md:144 | 1.00 | ok |  | 표시하지 않은 전문 용어는 독자 검토(SKILL.md)로 잡는다. |
| 110 | ltt-ui.js: 설명 부품 |  | 110 | api/ui.md:5 | 1.00 | ok |  | 모두 DOM 노드(또는 HTML 문자열)를 돌려준다. |
| 111 | ltt-ui.js: 설명 부품 |  | 110 | api/ui.md:5 | 1.00 | ok |  | 장면의 `visual`·`mount`·`aside`에서 쓴다. |
| 112 | ltt-ui.js: 설명 부품 | `LTT.narration(html \/ [html])` | 114 | api/ui.md:9 | 1.00 | ok |  | 그림만으로 이유가 안 보일 때. |
| 113 | ltt-ui.js: 설명 부품 | `LTT.narration(html \/ [html])` | 114 | api/ui.md:9 | 1.00 | ok |  | 원인 → 과정 → 결과를 2–4문장. |
| 114 | ltt-ui.js: 설명 부품 | `LTT.narration(html \/ [html])` | 114 | api/ui.md:9 | 1.00 | ok |  | 장면에서는 `narration` 필드. |
| 115 | ltt-ui.js: 설명 부품 | `LTT.annotate(target, points, {tone})` → | 115 | api/ui.md:10 | 1.00 | ok |  | 그림 위 번호 ↔ 해설 목록. |
| 116 | ltt-ui.js: 설명 부품 | `LTT.annotate(target, points, {tone})` → | 115 | api/ui.md:10 | 1.00 | ok |  | `points: [{at: [x%, y%], title, text, tone}]`. |
| 117 | ltt-ui.js: 설명 부품 | `LTT.annotate(target, points, {tone})` → | 115 | api/ui.md:10 | 1.00 | ok |  | `at`이 없으면 목록에만 나온다. |
| 118 | ltt-ui.js: 설명 부품 | `LTT.annotate(target, points, {tone})` → | 115 | api/ui.md:10 | 1.00 | ok |  | tone: accent(기본)·good·bad(✕ 표시)·warn. |
| 119 | ltt-ui.js: 설명 부품 | `LTT.annotate(target, points, {tone})` → | 115 | api/ui.md:10 | 1.00 | ok |  | 장면에서는 `points` 필드. |
| 120 | ltt-ui.js: 설명 부품 | `LTT.beforeAfter({before, after})` → `{e | 116 | api/ui.md:11 | 1.00 | ok |  | 같은 대상의 실패 예와 고친 예. |
| 121 | ltt-ui.js: 설명 부품 | `LTT.beforeAfter({before, after})` → `{e | 116 | api/ui.md:11 | 1.00 | ok |  | 각 쪽 `{visual, points, foot: {label, visual, caption}, label, tone, pointsOn}`. |
| 122 | ltt-ui.js: 설명 부품 | `LTT.beforeAfter({before, after})` → `{e | 116 | api/ui.md:11 | 1.00 | ok |  | 장면에서는 `type: "contrast"`. |
| 123 | ltt-ui.js: 설명 부품 | `LTT.facts([{icon, value, label, tone}]) | 117 | api/ui.md:12 | 1.00 | ok |  | 상황의 조건을 숫자 카드로. |
| 124 | ltt-ui.js: 설명 부품 | `LTT.facts([{icon, value, label, tone}]) | 117 | api/ui.md:12 | 1.00 | ok |  | predict의 `visual`에 넣으면 무엇을 근거로 짐작할지 보인다. |
| 125 | ltt-ui.js: 설명 부품 | `LTT.chips([text \/ {text, tone, icon, d | 118 | api/ui.md:13 | 1.00 | ok |  | 장면에서는 `chips` 필드(제목 아래). |
| 126 | ltt-ui.js: 설명 부품 | `LTT.badge(kind, text)` | 119 | api/ui.md:14 | 1.00 | ok |  | before·after·good·bad·warn·accent 상태 표시(문자열). |
| 127 | ltt-ui.js: 설명 부품 | `LTT.callout(html, {tone, title, icon})` | 120 | api/ui.md:15 | 1.00 | ok |  | 흔한 오해나 주의 한 가지. |
| 128 | ltt-ui.js: 설명 부품 | `LTT.swatches([{color, label, w, h, r, b | 121 | api/ui.md:16 | 1.00 | ok |  | '무엇을 썼나'를 실물 견본으로. |
| 129 | ltt-ui.js: 설명 부품 | `LTT.swatches([{color, label, w, h, r, b | 121 | api/ui.md:16 | 1.00 | ok |  | 색·크기·모서리 값 목록. |
| 130 | ltt-ui.js: 설명 부품 | `LTT.takeaway(text, sources)` | 122 | api/ui.md:17 | 1.00 | ok |  | 검은 '핵심' 바 + '찾아볼 곳'. |
| 131 | ltt-ui.js: 설명 부품 | `LTT.takeaway(text, sources)` | 122 | api/ui.md:17 | 1.00 | ok |  | 장면에서는 `takeaway`·`sources` 필드. |
| 132 | ltt-ui.js: 설명 부품 | `LTT.chartFrame({title, dek, source})` → | 123 | api/ui.md:18 | 1.00 | ok |  | 신문식 차트 틀: 굵은 괘선, 헤드라인(주장), dek(단위·조건), 차트, `foot()`가 붙이는 출처 줄. |
| 133 | ltt-ui.js: 설명 부품 | `LTT.chartFrame({title, dek, source})` → | 123 | api/ui.md:18 | 1.00 | ok |  | 차트는 `el`에 그린다. |
| 134 | ltt-ui.js: 설명 부품 | `LTT.inspector({title, rows: [{name, fg, | 124 | api/ui.md:19 | 1.00 | ok |  | 디자인 툴식 대비 검사 패널(문자열). |
| 135 | ltt-ui.js: 설명 부품 | `LTT.inspector({title, rows: [{name, fg, | 124 | api/ui.md:19 | 1.00 | ok |  | `ratio`가 없으면 `LTT.contrast`로 계산, `min`(기본 4.5) 미만이면 미달. |
| 136 | ltt-ui.js: 설명 부품 | `LTT.redline(container, {selector, x})`  | 125 | api/ui.md:20 | 1.00 | ok |  | 위쪽 margin을 오른쪽 여백에 px 측정선으로. |
| 137 | ltt-ui.js: 설명 부품 | `LTT.redline(container, {selector, x})`  | 125 | api/ui.md:20 | 1.00 | ok |  | 스타일을 바꾼 뒤 `update()`. |
| 138 | ltt-ui.js: 설명 부품 | `LTT.h(tag, cls, html)`, `LTT.fill(node, | 126 | api/ui.md:21 | 1.00 | ok |  | 작은 DOM 도우미. |
| 139 | ltt-ui.js: 설명 부품 | `LTT.h(tag, cls, html)`, `LTT.fill(node, | 126 | api/ui.md:21 | 1.00 | ok |  | `fill`은 문자열·노드·함수(노드를 채우거나 노드/문자열을 돌려줌)를 받는다. |
| 140 | ltt-mock.js: 목업 |  | 130 | api/mock.md:5 | 1.00 | ok |  | 모두 `{el, screen}`을 돌려준다. |
| 141 | ltt-mock.js: 목업 |  | 130 | api/mock.md:5 | 1.00 | ok |  | 내용은 `screen`에 넣고, 번호 주석은 `el`에 건다(틀 기준 %). |
| 142 | ltt-mock.js: 목업 | `LTT.mock.phone(o)` | 134 | api/mock.md:9 | 1.00 | ok |  | `width`(px), `ratio`(기본 `"9/17.5"`), `dark`, `bg`, `time`, `content` |
| 143 | ltt-mock.js: 목업 | `LTT.mock.browser(o)` | 135 | api/mock.md:10 | 1.00 | ok |  | `url` 또는 `title`, `width`, `height`, `bg`, `content` |
| 144 | ltt-mock.js: 목업 | `LTT.mock.terminal(o)` → `+ add(line)` | 136 | api/mock.md:11 | 1.00 | ok |  | `title`, `lines: ["$ 명령", "출력", {t: "ok"\/"warn"\/"err"\/"dim"\/"out"\/"cmd", text}]`. |
| 145 | ltt-mock.js: 목업 | `LTT.mock.terminal(o)` → `+ add(line)` | 136 | api/mock.md:11 | 1.00 | ok |  | 줄 색은 `--ltt-term-*` 변수(터미널은 테마와 무관하게 어둡다). |
| 146 | ltt-mock.js: 목업 | `LTT.mock.terminal(o)` → `+ add(line)` | 136 | api/mock.md:11 | 1.00 | ok |  | 캐시 로그라면 미스=ok, 적중=out, 오래된 값=warn, 원본 쓰기=err처럼 의미를 골라 쓴다 |
| 147 | ltt-mock.js: 목업 | `LTT.mock.code(o)` → `+ line(n)` | 137 | api/mock.md:12 | 1.00 | ok |  | `code`(원문 그대로), `lang`(javascript, typescript, python, bash, json, sql. |
| 148 | ltt-mock.js: 목업 | `LTT.mock.code(o)` → `+ line(n)` | 137 | api/mock.md:12 | 1.00 | ok |  | Prism을 불러왔을 때 문법 색), `title`, `marks: {줄번호: "good"\/"bad"\/"accent"\/"warn"}`, `start`, `numbers: false` |
| 149 | ltt-mock.js: 목업 |  | 139 | api/mock.md:14 | 1.00 | ok |  | UI 예시는 맨 HTML 조각보다 |
| 150 | ltt-mock.js: 목업 |  | 139 | api/mock.md:14 | 1.00 | ok |  | 목업 안의 색은 '실제 화면'이라 토큰 대신 hex를 써도 된다. |
| 151 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | 격자 좌표 다이어그램. |
| 152 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | `spec: {cols, rows, cell: [w, h], node: [w, h], pad, parallel, width, height, maxWidth, label, sketch, nodes, edges, zones}`. |
| 153 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | 노드 `{id, c, r, l, s, k, icon, flaw, ring, w, h}`(`ring`은 이중 테두리)(c·r은 소수 가능, 픽셀이면 `x, y` 중심). |
| 154 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | `l`·`s`의 `\n`은 줄바꿈이고 2줄 이상이면 상자가 커진다(`h`가 우선). |
| 155 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | 엣지 `{f, t, l, lo: [dx, dy], k, dash, both, arrow: false, id, shape, via, from, to, radius, points}`: `shape`는 `straight`(기본)·`ortho`(직각, 모서리 `radius` 기본 10)·`cu |
| 156 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | 같은 두 노드 사이 엣지는 `parallel`(기본 14px) 간격으로 벌어진다. |
| 157 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | 라벨은 경로 길이의 절반 지점 + `lo`. |
| 158 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | 영역 `{id, parent, c0, r0, c1, r1, l, k}` 또는 픽셀 `{x, y, w, h}`: `parent`가 있으면 깊이마다 |
| 159 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | 10px 더 들어가고 부모 라벨 아래·부모 안쪽으로 잘린다. |
| 160 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | k: accent·good·bad·warn·muted·dark. |
| 161 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | 자기 루프, 없는 노드·부모, 잘못된 변·모양 이름, 위치 없는 노드·영역은 오류. |
| 162 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | `rough.js`를 불러온 페이지에서 sketch 테마(또는 `sketch: true`)면 선이 손그림으로 그려진다(`sketch: false`로 끔). |
| 163 | ltt-parts.js: 움직이는 그림 | `LTT.diagram(svg, spec)` | 145 | api/diagram.md:7 | 1.00 | ok |  | 반환 `{svg, layout, node(id), edge(id), highlight, flow, send, clear, player}`; `send`의 패킷은 그려진 경로를 따른다. |
| 164 | ltt-parts.js: 움직이는 그림 | `.highlight(ids)` | 146 | api/diagram.md:8 | 1.00 | ok |  | 노드·엣지(`"from>to"`) 외에는 흐리게. |
| 165 | ltt-parts.js: 움직이는 그림 | `.highlight(ids)` | 146 | api/diagram.md:8 | 1.00 | ok |  | 빈 배열·null이면 해제. |
| 166 | ltt-parts.js: 움직이는 그림 | `.flow(edgeIds)` | 147 | api/diagram.md:9 | 1.00 | ok |  | 진행 방향을 보이는 점선 흐름. |
| 167 | ltt-parts.js: 움직이는 그림 | `.flow(edgeIds)` | 147 | api/diagram.md:9 | 1.00 | ok |  | 방향을 알려야 할 때만. |
| 168 | ltt-parts.js: 움직이는 그림 | `.send(from, to, {count, color, ms, gap, | 148 | api/diagram.md:10 | 1.00 | ok |  | 엣지를 따라 패킷이 이동. |
| 169 | ltt-parts.js: 움직이는 그림 | `.player(el, steps)` | 149 | api/diagram.md:11 | 1.00 | ok |  | 단계 재생(stepper). |
| 170 | ltt-parts.js: 움직이는 그림 | `.player(el, steps)` | 149 | api/diagram.md:11 | 1.00 | ok |  | 이전·다음으로 넘기고 '반복 재생'으로 순환한다. |
| 171 | ltt-parts.js: 움직이는 그림 | `.player(el, steps)` | 149 | api/diagram.md:11 | 1.00 | ok |  | 단계별 머무는 시간 `hold`는 표현하려는 바에 맞게 정한다. |
| 172 | ltt-parts.js: 움직이는 그림 | `.player(el, steps)` | 149 | api/diagram.md:11 | 1.00 | ok |  | `steps: [{caption, hold, hot, flow, send: [[from, to, opts]], enter(dg, i)}]`. |
| 173 | ltt-parts.js: 움직이는 그림 | `.player(el, steps)` | 149 | api/diagram.md:11 | 1.00 | ok |  | 단계의 `send`는 그 단계에 머무는 동안 반복된다. |
| 174 | ltt-parts.js: 움직이는 그림 | `.player(el, steps)` | 149 | api/diagram.md:11 | 1.00 | ok |  | `ms`(이동 시간)·`gap`(간격)을 달리해 빠르기 차이를 보인다. |
| 175 | ltt-parts.js: 움직이는 그림 | `.player(el, steps)` | 149 | api/diagram.md:11 | 1.00 | ok |  | 이어진 길은 `send`에 `{relay: [[from, to, ms], ...], count, gap, r, color}`를 넣는다. |
| 176 | ltt-parts.js: 움직이는 그림 | `.player(el, steps)` | 149 | api/diagram.md:11 | 1.00 | ok |  | 구간을 차례로 지나므로, 느린 구간 뒤의 빠른 구간도 느린 구간이 내주는 만큼만 흐른다. |
| 177 | ltt-parts.js: 움직이는 그림 | `.player(el, steps)` | 149 | api/diagram.md:11 | 1.00 | ok |  | 자막이 그림 읽는 법을 말한다. |
| 178 | ltt-parts.js: 움직이는 그림 | `LTT.graphOverlaps(spec)` | 150 | api/diagram.md:12 | 1.00 | ok |  | 그린 diagram spec의 겹침 `[{kind, a, b}]`. |
| 179 | ltt-parts.js: 움직이는 그림 | `LTT.graphOverlaps(spec)` | 150 | api/diagram.md:12 | 1.00 | ok |  | kind: `label-label`, `label-node`, `edge-node`(끝점이 아닌 노드를 지남), `edge-edge`(끝을 공유하지 않는 두 엣지가 한 줄 위를 6px 넘게 함께 달림). |
| 180 | ltt-parts.js: 움직이는 그림 | `LTT.graphOverlaps(spec)` | 150 | api/diagram.md:12 | 1.00 | ok |  | 교차는 세지 않는다. |
| 181 | ltt-parts.js: 움직이는 그림 | `LTT.graphOverlaps(spec)` | 150 | api/diagram.md:12 | 1.00 | ok |  | `?audit`의 `graph-overlap` 규칙이 쓴다. |
| 182 | ltt-parts.js: 움직이는 그림 | `LTT.diagramLayout(spec)` | 151 | api/diagram.md:13 | 1.00 | ok |  | 좌표만 계산(테스트·커스텀 그림용). |
| 183 | ltt-parts.js: 움직이는 그림 | `LTT.diagramLayout(spec)` | 151 | api/diagram.md:13 | 1.00 | ok |  | `pts`(꺾는 점 포함), SVG `d`, 라벨 기준점 `lx, ly`, 기존 `x1…y2`; 노드에 `lines`·`sub`; 영역에 `id, parent, depth`. |
| 184 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 좌표 없이 연결만 적으면 elk(layered)가 배치한 diagram spec을 돌려준다: `LTT.diagram(svg, await LTT.autoLayout(spec))`. |
| 185 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | `spec: {nodes, edges, groups, direction: RIGHT / DOWN, node: [w, h], spacing: [층, 노드] = [72, 36], pad, radius, label, maxWidth}`. |
| 186 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 노드·엣지 필드는 diagram과 같고 노드 `group`은 그룹 id, 그룹 `{id, l, k, parent}`는 중첩 영역이 된다. |
| 187 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 엣지는 직각(`ortho`)으로 꺾인다. |
| 188 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 라벨은 크기를 재서 elk에 넘기므로 elk가 라벨 자리를 비워 두고 정한 자리(엣지 `at`)에 그려진다. |
| 189 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 그래서 라벨·노드·엣지가 겹치지 않는 대신 라벨 몫만큼 층 간격이 넓어진다. |
| 190 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 엣지 `main: false`는 보조 엣지(역방향·추론·타입 표시)다. |
| 191 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 배치 방향을 정할 때 주 엣지를 앞세우고, 사이클은 보조 엣지를 뒤집어 끊는다. |
| 192 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 폰에서는 `direction`과 무관하게 `DOWN`으로 배치한다(`mobile: false`로 끔). |
| 193 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 같은 입력은 같은 그림. |
| 194 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 노드가 20개를 넘거나 층이 많으면 가로로 길어지니 좁은 칸에서는 `DOWN`. |
| 195 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | `<script src="/kit/vendor/elk.bundled.js">`(1.6MB)는 이 부품을 쓰는 페이지에서만 불러온다. |
| 196 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 호출할 때 없으면 reject한다. |
| 197 | ltt-parts.js: 움직이는 그림 | `LTT.autoLayout(spec)` → Promise | 152 | api/diagram.md:14 | 1.00 | ok |  | 오류(없는 노드·그룹, 중복 id, 자기 루프, 그룹 순환)도 reject. |
| 198 | ltt-parts.js: 움직이는 그림 | `LTT.state(svg, {states, transitions, in | 153 | api/diagram.md:15 | 1.00 | ok |  | 상태 `{id, l, s, k, icon, final}`, 전이 `{f, t, l, k, dash}`. |
| 199 | ltt-parts.js: 움직이는 그림 | `LTT.state(svg, {states, transitions, in | 153 | api/diagram.md:15 | 1.00 | ok |  | `initial` 앞에 시작 점, `final`은 이중 테두리(diagram 노드 `ring: true`), 자기 자신으로의 전이는 상태 아래 `↻ 이벤트` 줄. |
| 200 | ltt-parts.js: 움직이는 그림 | `LTT.state(svg, {states, transitions, in | 153 | api/diagram.md:15 | 1.00 | ok |  | autoLayout으로 배치하므로 `elk.bundled.js`가 필요하다. |
| 201 | ltt-parts.js: 움직이는 그림 | `LTT.state(svg, {states, transitions, in | 153 | api/diagram.md:15 | 1.00 | ok |  | 돌려받은 diagram으로 `player`·`highlight`·`send`를 쓴다(시작 점 id는 `__start`). |
| 202 | ltt-parts.js: 움직이는 그림 | `LTT.stateSpec(o)` | 154 | api/diagram.md:16 | 1.00 | ok |  | state가 autoLayout에 넘기는 입력만 만든다(테스트·조정용). |
| 203 | ltt-parts.js: 움직이는 그림 | `LTT.stepper(el, [{caption, hold, enter( | 155 | api/controls.md:10 | 1.00 | ok |  | `enter`는 다시 들어와도 같은 화면이 되게 짠다. |
| 204 | ltt-parts.js: 움직이는 그림 | `LTT.stepper(el, [{caption, hold, enter( | 155 | api/controls.md:10 | 1.00 | ok |  | '반복 재생' 버튼(또는 `play()`)은 단계마다 |
| 205 | ltt-parts.js: 움직이는 그림 | `LTT.stepper(el, [{caption, hold, enter( | 155 | api/controls.md:10 | 1.00 | ok |  | `hold`ms(없으면 `interval`, 기본 1800ms) 머문 뒤 다음 단계로, 끝에서 처음으로 돌아간다. |
| 206 | ltt-parts.js: 움직이는 그림 | `LTT.stepper(el, [{caption, hold, enter( | 155 | api/controls.md:10 | 1.00 | ok |  | `hold`는 표현하려는 바에 맞게 정한다(오래 봐야 할 단계는 길게). |
| 207 | ltt-parts.js: 움직이는 그림 | `LTT.stepper(el, [{caption, hold, enter( | 155 | api/controls.md:10 | 1.00 | ok |  | 이전/다음을 누르면 멈춘다. |
| 208 | ltt-parts.js: 움직이는 그림 | `LTT.units(el, n, cols, {band}).paint(k, | 156 | api/charts.md:13 | 1.00 | ok |  | `band: true`면 가는 틱의 넓은 띠(예: 2×50, 시간순 요청). |
| 209 | ltt-parts.js: 움직이는 그림 | `LTT.sweep({params: {id: {kind, map, fmt | 159 | api/controls.md:7 | 1.00 | ok |  | 손잡이 → `render(values)`. |
| 210 | ltt-parts.js: 움직이는 그림 | `LTT.sweep({params: {id: {kind, map, fmt | 159 | api/controls.md:7 | 1.00 | ok |  | 조작 자체가 배움일 때만, 실사용 범위만. |
| 211 | ltt-parts.js: 움직이는 그림 | `LTT.sweep({params: {id: {kind, map, fmt | 159 | api/controls.md:7 | 1.00 | ok |  | 손잡이는 `#id` 요소에 붙고 `#id-v`에 `fmt(값)`이 들어간다. |
| 212 | ltt-parts.js: 움직이는 그림 | `LTT.sweep({params: {id: {kind, map, fmt | 159 | api/controls.md:7 | 1.00 | ok |  | `kind`: `"range"`(기본, `#id`는 `<input type=range>`, 값 = `map(input.value)`), `"log"`(`#id`는 range 입력, `{min, max, value}`, 자릿수마다 |
| 213 | ltt-parts.js: 움직이는 그림 | `LTT.sweep({params: {id: {kind, map, fmt | 159 | api/controls.md:7 | 1.00 | ok |  | 같은 거리), `"steps"`(`#id`는 빈 `div`, `{stops, value, stopLabel}`, 단계 버튼), `"dial"`(빈 `div`, `{period=360, step=1, value, ring}`, 0이 위·시계 방향, `ring`은 고리 배경 CSS, 가운데 |
| 214 | ltt-parts.js: 움직이는 그림 | `LTT.sweep({params: {id: {kind, map, fmt | 159 | api/controls.md:7 | 1.00 | ok |  | `control`에 `LTT.drag(...)` 같은 손잡이 객체를 주면 `#id` 없이 그것을 쓴다. |
| 215 | ltt-parts.js: 움직이는 그림 | `LTT.sweep({params: {id: {kind, map, fmt | 159 | api/controls.md:7 | 1.00 | ok |  | `"range"` 외 손잡이는 화살표 키로도 움직이고 덱 장면 넘김을 막는다. |
| 216 | ltt-parts.js: 움직이는 그림 | `LTT.sweep({params: {id: {kind, map, fmt | 159 | api/controls.md:7 | 1.00 | ok |  | `presets` 버튼의 `data-preset`은 range는 입력값, 나머지는 손잡이 값이다. |
| 217 | ltt-parts.js: 움직이는 그림 | `LTT.sweep({params: {id: {kind, map, fmt | 159 | api/controls.md:7 | 1.00 | ok |  | `goal: {el, text, target, check(values)}`는 `el` 안에 목표 띠(목표 견본 `target` + 문장)를 그리고, `check`가 참이면 "맞췄다" 표시와 `goal` 이벤트를 남긴다. |
| 218 | ltt-parts.js: 움직이는 그림 | `LTT.sweep({params: {id: {kind, map, fmt | 159 | api/controls.md:7 | 1.00 | ok |  | `check`는 값만 보는 순수 함수여야 한다(`?audit`이 손잡이 자리마다 |
| 219 | ltt-parts.js: 움직이는 그림 | `LTT.drag(svg, {value, toSvg, fromSvg, b | 160 | api/controls.md:8 | 1.00 | ok |  | 그림 속 대상을 직접 끄는 손잡이. |
| 220 | ltt-parts.js: 움직이는 그림 | `LTT.drag(svg, {value, toSvg, fromSvg, b | 160 | api/controls.md:8 | 1.00 | ok |  | `svg` 위에 점선 원을 그리고, 끌거나 화살표 키로 옮기면 값 `[x, y]`가 `step`으로 맞춰지고 `bounds: [[xmin, xmax], [ymin, ymax]]` 안에 머문다. |
| 221 | ltt-parts.js: 움직이는 그림 | `LTT.drag(svg, {value, toSvg, fromSvg, b | 160 | api/controls.md:8 | 1.00 | ok |  | `toSvg`/`fromSvg`는 데이터 ⇄ SVG 좌표 변환(`LTT.plane`이 같은 이름으로 준다). |
| 222 | ltt-parts.js: 움직이는 그림 | `LTT.drag(svg, {value, toSvg, fromSvg, b | 160 | api/controls.md:8 | 1.00 | ok |  | 돌려주는 객체를 `sweep` `params`의 `control`로 넘긴다. |
| 223 | ltt-parts.js: 움직이는 그림 | `LTT.drag(svg, {value, toSvg, fromSvg, b | 160 | api/controls.md:8 | 1.00 | ok |  | 원 위치만 옮기고, 화살표·도형은 `render`가 다시 그린다. |
| 224 | ltt-parts.js: 움직이는 그림 | `LTT.predict({..., onReset})` → `{reset, | 161 | api/controls.md:9 | 1.00 | ok |  | 첫 짐작을 잠그고 기록. |
| 225 | ltt-parts.js: 움직이는 그림 | `LTT.predict({..., onReset})` → `{reset, | 161 | api/controls.md:9 | 1.00 | ok |  | 덱의 predict 장면이 쓴다. |
| 226 | ltt-parts.js: 움직이는 그림 | `LTT.predict({..., onReset})` → `{reset, | 161 | api/controls.md:9 | 1.00 | ok |  | `reset()`은 공개를 거두고 다시 고르게 한다. |
| 227 | ltt-parts.js: 움직이는 그림 | `LTT.predict({..., onReset})` → `{reset, | 161 | api/controls.md:9 | 1.00 | ok |  | 첫 기록은 남고 `predict-reset` 이벤트와 `retry: true` 짐작이 추가된다. |
| 228 | ltt-parts.js: 움직이는 그림 | `LTT.plane(svg, {range, vectors, shape}) | 162 | api/charts.md:12 | 1.00 | ok |  | `toSvg(p)`/`fromSvg(p)`는 평면 좌표 ⇄ SVG 좌표로, `LTT.drag`에 그대로 넘긴다. |
| 229 | ltt-parts.js: 움직이는 그림 | `LTT.sim({init, step, draw, until, dt, o | 163 | api/controls.md:11 | 1.00 | ok |  | 고정 간격 시뮬레이션. |
| 230 | ltt-parts.js: 움직이는 그림 | `LTT.sim({init, step, draw, until, dt, o | 163 | api/controls.md:11 | 1.00 | ok |  | `runToEnd()`는 화면 없이 결과만. |
| 231 | ltt-parts.js: 움직이는 그림 | `LTT.sequence(svg, {actors, items, spans | 164 | api/sequence.md:7 | 1.00 | ok |  | 배우 `{id, l, s, icon, k}`, `items`는 시간순으로 메시지 `{f, t, l, kind: "sync"\/"async"\/"reply", k, flaw, id}`와 메모 `{note, over: [ids]}`. |
| 232 | ltt-parts.js: 움직이는 그림 | `LTT.sequence(svg, {actors, items, spans | 164 | api/sequence.md:7 | 1.00 | ok |  | sync는 받는 쪽 활성 막대를 열고, 그 배우의 다음 reply가 닫는다. |
| 233 | ltt-parts.js: 움직이는 그림 | `LTT.sequence(svg, {actors, items, spans | 164 | api/sequence.md:7 | 1.00 | ok |  | f = t면 자기 호출 고리. |
| 234 | ltt-parts.js: 움직이는 그림 | `LTT.sequence(svg, {actors, items, spans | 164 | api/sequence.md:7 | 1.00 | ok |  | `spans: [{from, to, l, k}]`는 두 메시지 id 사이 시간 구간(왼쪽 괄호). |
| 235 | ltt-parts.js: 움직이는 그림 | `LTT.sequence(svg, {actors, items, spans | 164 | api/sequence.md:7 | 1.00 | ok |  | `.show(n)`, `.highlight(ids)`, `.send(id)`, `.player(el, [{caption, upto, hot}])`(upto 기본 = 단계 번호 + 1, 마지막 메시지에 패킷). |
| 236 | ltt-parts.js: 움직이는 그림 | `LTT.sequence(svg, {actors, items, spans | 164 | api/sequence.md:7 | 1.00 | ok |  | 재시도·인증·타임아웃 순서 수업. |
| 237 | ltt-parts.js: 움직이는 그림 | `LTT.sequenceLayout(spec)` | 165 | api/sequence.md:8 | 1.00 | ok |  | 좌표만 계산(테스트용). |
| 238 | ltt-parts.js: 움직이는 그림 | `LTT.axisPlot(svg \/ el, {width, height, | 166 | api/charts.md:7 | 1.00 | ok |  | 축이 고정된 함수·궤적 플롯. |
| 239 | ltt-parts.js: 움직이는 그림 | `LTT.axisPlot(svg \/ el, {width, height, | 166 | api/charts.md:7 | 1.00 | ok |  | `equal: true`(또는 `y: [y0]`)면 x 축척으로 y 범위를 정해 모양이 실제와 같다. |
| 240 | ltt-parts.js: 움직이는 그림 | `LTT.axisPlot(svg \/ el, {width, height, | 166 | api/charts.md:7 | 1.00 | ok |  | 계열 색 기본 `--ltt-c1…`. |
| 241 | ltt-parts.js: 움직이는 그림 | `LTT.lanes(svg \/ el, {axis: {max, step, | 167 | api/charts.md:8 | 1.00 | ok |  | 같은 시간 축의 레인 막대. |
| 242 | ltt-parts.js: 움직이는 그림 | `LTT.lanes(svg \/ el, {axis: {max, step, | 167 | api/charts.md:8 | 1.00 | ok |  | 어느 단계에서 시간이 드는지. |
| 243 | ltt-parts.js: 움직이는 그림 | `LTT.hbars(svg \/ el, {domain, ticks, ti | 168 | api/charts.md:9 | 1.00 | ok |  | 고정 축 가로 막대. |
| 244 | ltt-parts.js: 움직이는 그림 | `LTT.hbars(svg \/ el, {domain, ticks, ti | 168 | api/charts.md:9 | 1.00 | ok |  | `tone: "floor"`는 바닥(하한)을 점선 테두리로. |
| 245 | ltt-parts.js: 움직이는 그림 | `LTT.hbars(svg \/ el, {domain, ticks, ti | 168 | api/charts.md:9 | 1.00 | ok |  | `chartFrame` 안에 그리면 신문 차트가 된다. |
| 246 | ltt-parts.js: 움직이는 그림 | `LTT.plot(options)`, `LTT.plotTheme(opti | 169 | api/charts.md:10 | 1.00 | ok |  | Observable Plot을 테마 팔레트·모노 눈금·투명 배경 기본값으로. |
| 247 | ltt-parts.js: 움직이는 그림 | `LTT.plot(options)`, `LTT.plotTheme(opti | 169 | api/charts.md:10 | 1.00 | ok |  | `plot.umd.min.js` 필요. |
| 248 | ltt-parts.js: 움직이는 그림 | `LTT.sankey(svg \/ el, {nodes: [{id, l,  | 170 | api/charts.md:11 | 1.00 | ok |  | 흐름량(비용·트래픽·퍼널). |
| 249 | ltt-parts.js: 움직이는 그림 | `LTT.sankey(svg \/ el, {nodes: [{id, l,  | 170 | api/charts.md:11 | 1.00 | ok |  | `d3-sankey.min.js` 필요. |
| 250 | ltt-parts.js: 움직이는 그림 | `LTT.map(svg, {projection, rotate, exten | 171 | api/map.md:7 | 1.00 | ok |  | 세계 지도(Natural Earth 1:110m). |
| 251 | ltt-parts.js: 움직이는 그림 | `LTT.map(svg, {projection, rotate, exten | 171 | api/map.md:7 | 1.00 | ok |  | `projection`: equalEarth(기본)·mercator·naturalEarth·orthographic. |
| 252 | ltt-parts.js: 움직이는 그림 | `LTT.map(svg, {projection, rotate, exten | 171 | api/map.md:7 | 1.00 | ok |  | `extent: [[lon0, lat0], [lon1, lat1]]`로 지역에 맞추고, 날짜변경선을 넘는 지역은 `rotate: [-중심경도, 0]`. |
| 253 | ltt-parts.js: 움직이는 그림 | `LTT.map(svg, {projection, rotate, exten | 171 | api/map.md:7 | 1.00 | ok |  | `countries: {영어 이름: tone}`, `places: [{id, lon, lat, l, lo, k, mark}]`, `routes: [{f, t, l, lo, k, dash}]`(대권 호). |
| 254 | ltt-parts.js: 움직이는 그림 | `LTT.map(svg, {projection, rotate, exten | 171 | api/map.md:7 | 1.00 | ok |  | 결과에 `highlight`·`flow`·`send`·`player`·`project(lon, lat)`. |
| 255 | ltt-parts.js: 움직이는 그림 | `LTT.map(svg, {projection, rotate, exten | 171 | api/map.md:7 | 1.00 | ok |  | `topojson-client.min.js` 필요. |
| 256 | ltt-parts.js: 움직이는 그림 | 트리·트리맵 | 172 | api/diagram.md:17 | 1.00 | ok |  | kit 부품 없이 `d3.hierarchy` + `d3.tree`/`d3.treemap`. |
| 257 | ltt-parts.js: 움직이는 그림 | `LTT.math(scope)` | 173 | API.md:51 | 1.00 | ok |  | `data-tex` 요소를 KaTeX로. |
| 258 | ltt-parts.js: 움직이는 그림 | `LTT.MOTION_MS` | 174 | API.md:52 | 1.00 | ok |  | 기본 모션 길이. |
| 259 * | ltt-deck.js: 장면 덱 |  | 178 | API.md:42 | 0.29 | ok | 넘 | `LTT.deck({title, glossary: {용어: 풀이}, scenes})`. |
| 260 | ltt-deck.js: 장면 덱 |  | 178 | API.md:53 | 1.00 | ok |  | 장면 하나 = 메시지 하나 = 스크롤 없는 한 화면. |
| 261 | ltt-deck.js: 장면 덱 |  | 178 | api/deck-contracts.md:38 | 1.00 | ok |  | ←/→·PageUp/PageDown 키(화면 속 stepper가 있으면 그 stepper가 끝에 닿을 때까지 ←/→를 먼저 받는다), `#n` 해시, `scene` 이벤트. |
| 262 | ltt-deck.js: 장면 덱 |  | 178 | api/deck-contracts.md:40 | 1.00 | ok |  | compare의 판정이나 predict의 정답을 보지 않고 다음으로 가려 하면, 첫 시도는 넘어가지 않는다. |
| 263 | ltt-deck.js: 장면 덱 |  | 178 | api/deck-contracts.md:40 | 1.00 | ok |  | 대신 그 버튼(predict에서 아직 고르지 않았으면 선택지)을 테마에 맞게 강조하고 말풍선을 띄운다. |
| 264 | ltt-deck.js: 장면 덱 |  | 178 | api/deck-contracts.md:40 | 1.00 | ok |  | 다음 버튼이면 버튼 위에, 키·스와이프면 화면 가운데에 뜬다. |
| 265 | ltt-deck.js: 장면 덱 |  | 178 | api/deck-contracts.md:40 | 1.00 | ok |  | 같은 장면에서 한 번 더 시도하면 넘어간다(`skip-warn`, `skip-reveal` 이벤트). |
| 266 | ltt-deck.js: 장면 덱 |  | 178 | api/deck-contracts.md:41 | 1.00 | ok |  | predict에서 선택지를 이미 골랐다면 다음 버튼·키·스와이프는 넘어가지 않고 정답을 바로 펼친다(`auto-reveal` 이벤트). |
| 267 | ltt-deck.js: 장면 덱 |  | 178 | api/deck-contracts.md:42 | 1.00 | ok |  | 정답을 펼친 predict에서 ← 키는 이전 장면 대신 문제 상태로 돌아간다(`predict-back` 이벤트, 이전 버튼·스와이프는 그대로 이전 장면). |
| 268 | ltt-deck.js: 장면 덱 |  | 178 | api/deck-contracts.md:43 | 1.00 | ok |  | 펼친 정답은 장면 안에서 글·컨트롤·그림이 없는 빈자리를 찾아 그 위에 놓이고, 빈자리가 없으면 아래로 붙는다(넘치면 평소처럼 78%까지 줄인다). |
| 269 * | 모든 장면의 공통 필드 | `kicker` | 184 | API.md:109 | 1.00 | ok | 아래 | 제목 위 작은 알약(맥락) |
| 270 | 모든 장면의 공통 필드 | `title`, `en` | 185 | API.md:108 | 1.00 | ok |  | 주장 문장으로 쓴 제목, 영문 보조 제목 |
| 271 | 모든 장면의 공통 필드 | `sub` | 186 | API.md:109 | 1.00 | ok |  | 제목 아래 한두 줄(상황, 읽는 법) |
| 272 | 모든 장면의 공통 필드 | `chips` | 187 | API.md:109 | 1.00 | ok |  | 제목 아래 키워드 |
| 273 | 모든 장면의 공통 필드 | `narration` | 188 | API.md:110 | 1.00 | ok |  | 있으면 그림 옆 설명 레일이 생긴다 |
| 274 | 모든 장면의 공통 필드 | `points`, `pointsOn`, `pointsTone` | 189 | API.md:111 | 1.00 | ok |  | 대상은 `pointsOn` 셀렉터, 없으면 `[data-annotate]`, 없으면 본문의 첫 요소 |
| 275 | 모든 장면의 공통 필드 | `takeaway`, `sources` | 190 | API.md:112 | 1.00 | ok |  | 핵심 한 문장과 찾아볼 곳. |
| 276 | 모든 장면의 공통 필드 | `takeaway`, `sources` | 190 | API.md:112 | 1.00 | ok |  | summary 장면이 모은다 |
| 277 | 모든 장면의 공통 필드 | `recall` | 191 | API.md:113 | 1.00 | ok |  | takeaway를 떠올리게 하는 질문 한 줄. |
| 278 | 모든 장면의 공통 필드 | `recall` | 191 | api/deck-contracts.md:29 | 1.00 | ok |  | summary가 질문을 먼저 보이고 답(takeaway)은 "답 보기" 뒤에 연다 |
| 279 | 모든 장면의 공통 필드 | `ask` | 192 | API.md:114 | 1.00 | ok |  | summary 카드에 붙는다 |
| 280 | 모든 장면의 공통 필드 | `aside` | 193 | API.md:115 | 1.00 | ok |  | 설명 레일에 넣을 추가 부품 |
| 281 | 모든 장면의 공통 필드 | `basis`, `tex` | 194 | API.md:116 | 1.00 | ok |  | 근거 한 줄, 접힌 수식 |
| 282 | 모든 장면의 공통 필드 | `mount(body, ctx)` → `{enter, leave}`, ` | 195 | API.md:117 | 1.00 | ok |  | ctx: `{el, scene, index, scenes}` |
| 283 | 모든 장면의 공통 필드 | `layout` | 196 | API.md:118 | 1.00 | ok |  | `"split"`(그림 \/ 설명 레일), `"stack"`(설명 위, 그림 전체 폭), `"full"`(그림이 무대 전체, 해설·번호 주석은 그림 아래 캡션 줄). |
| 284 | 모든 장면의 공통 필드 | `layout` | 196 | API.md:118 | 1.00 | ok |  | 기본은 figure·overview면 full, 그 밖에는 narration·points가 있으면 split. |
| 285 | 모든 장면의 공통 필드 | `layout` | 196 | api/deck-contracts.md:34 | 1.00 | ok |  | 단 hook·keywords·summary·terms·contrast·predict·statement는 자동 split이 되지 않는다 |
| 286 | 모든 장면의 공통 필드 | `bare` | 197 | API.md:119 | 1.00 | ok |  | split에서 본문 카드 테두리를 없앤다(그림이 이미 패널일 때) |
| 287 | 모든 장면의 공통 필드 | `number: false` | 198 | API.md:120 | 1.00 | ok |  | 큰 장면 번호를 숨긴다 |
| 288 | 장면 타입 | `hook` | 204 | API.md:126 | 1.00 | ok |  | `art`(아이콘 이름·이모지·HTML), `pre`, `text`, `sub`, `kicker`, `chips`. |
| 289 | 장면 타입 | `terms` | 205 | API.md:127 | 1.00 | ok |  | `terms: [{key, word, en, icon, visual, plain, example}]`. |
| 290 | 장면 타입 | `terms` | 205 | API.md:127 | 1.00 | ok |  | 용어를 쉬운 말로 먼저 푼다. |
| 291 | 장면 타입 | `terms` | 205 | API.md:127 | 1.00 | ok |  | key는 glossary에 자동 등록. |
| 292 | 장면 타입 | `terms` | 205 | API.md:127 | 1.00 | ok |  | `visual`(HTML·노드·함수)은 그 말이 가리키는 것을 보이는 작은 그림으로, 풀이 위에 그린다(예: 색상 → 색상환 위의 각도) |
| 293 | 장면 타입 | `explain` | 206 | API.md:128 | 1.00 | ok |  | `steps: [{icon, title, text, visual}]`, `form`, `arrows`. |
| 294 | 장면 타입 | `explain` | 206 | API.md:128 | 1.00 | ok |  | `form`: `"cards"`(기본, 독립된 요소 나열), `"strip"`(이어진 한 줄 흐름, 카드 없이 선과 마디), `"stack"`(세로 타임라인, 단계마다 |
| 295 | 장면 타입 | `figure` | 207 | API.md:129 | 1.00 | ok |  | `figure`(그림: 노드·HTML·함수), `caption`, `label`, `steps`. |
| 296 | 장면 타입 | `figure` | 207 | API.md:129 | 1.00 | ok |  | 그림 하나가 화면을 차지하고 아래에 "그림 n." 캡션이 붙는다. |
| 297 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:9 | 1.00 | ok |  | `points`의 `at`은 무대 안 첫 목업(phone·browser·terminal·code)이 있으면 그 틀 기준, 없으면 무대 전체 기준 %다(`pointsOn`으로 바꾼다). |
| 298 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:13 | 1.00 | ok |  | `steps: [{caption, enter(k, fig, dir)}]`를 주면 그림 왼쪽, 단계 자막 오른쪽으로 놓인다. |
| 299 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:14 | 1.00 | ok |  | 그림의 글·그림(diagram은 노드·라벨 상자)이 자막 칸 밑으로 들어가거나 한 단계에서라도 그 상자들이 자막 칸 밑으로 들어가면, 같은 창 폭에서는 자막 칸이 계속 그림 아래에 있다. |
| 300 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:14 | 1.00 | ok |  | 폭 760px 이하에서는 판정 없이 아래에 둔다. |
| 301 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:15 | 1.00 | ok |  | 자막이 아래로 내려가면, 그림 안의 다이어그램(svg 하나)이 페이지 CSS로 화면 폭 비율(예: `56vw`)에 묶여 있어도 칸 폭까지 넓힌다. |
| 302 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:15 | 1.00 | ok |  | 장면 높이에 남는 만큼만 넓혀 배율은 줄지 않는다. |
| 303 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:16 | 1.00 | ok |  | 장면에 들어올 때와 창 크기가 바뀔 때 모든 단계의 `enter`를 한 번씩 미리 돌려 그림 높이와 자막 칸 위치를 정하므로, 단계를 넘겨도 배율과 배치가 바뀌지 않는다. |
| 304 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:16 | 1.00 | ok |  | 그래서 `enter`는 멱등이어야 하고(반복 재생도 마지막에서 첫 단계로 바로 간다) 기록·전역 상태를 건드리지 않아야 한다. |
| 305 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:17 | 1.00 | ok |  | 미리 돌리는 동안 kit의 `send`(패킷 연출)는 아무것도 하지 않고, 그림 안의 CSS transition은 꺼져 끝 크기로 잰다. |
| 306 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:17 | 1.00 | ok |  | 직접 만든 d3 transition·`setTimeout`으로 크기를 바꾸는 그리기는 끝 크기를 알 수 없으니 `enter`에 넣지 않는다. |
| 307 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:18 | 1.00 | ok |  | 자막 칸 높이는 가장 긴 단계 자막에 맞춰 고정되어 단계를 넘겨도 버튼이 움직이지 않는다. |
| 308 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:19 | 1.00 | ok |  | `figure` 함수가 `{el, ...}`를 돌려주면 `enter`의 `fig`로 그 객체가 온다(같은 그림의 여러 상태). |
| 309 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:19 | 1.00 | ok |  | 장면에 들어올 때마다 |
| 310 | 장면 타입 | `figure` | 207 | api/deck-contracts.md:19 | 1.00 | ok |  | 다시 그리려면 공통 필드 `enter(body, ctx)` |
| 311 | 장면 타입 | `overview` | 208 | API.md:130 | 1.00 | ok |  | `figure`, `caption`, `label`(기본 "한 장 정리."). |
| 312 | 장면 타입 | `overview` | 208 | API.md:130 | 1.00 | ok |  | summary 뒤, keywords 바로 앞에 두는 한 장 인포그래픽. |
| 313 * | 장면 타입 | `overview` | 208 | api/deck-contracts.md:34 | 1.00 | ok | 기본 | figure처럼 그림이 무대 전체를 쓴다. |
| 314 | 장면 타입 | `overview` | 208 | API.md:130 | 1.00 | ok |  | 새 내용 없이 앞 장면의 takeaway를 그림 안 자리에 배치한다 |
| 315 | 장면 타입 | `statement` | 209 | API.md:131 | 1.00 | ok |  | `title`(큰 주장 한 문장, `<em>`은 강조색), `sub`, `visual`(작은 근거 그림, 선택). |
| 316 | 장면 타입 | `statement` | 209 | API.md:131 | 1.00 | ok |  | 카드 없이 리듬을 바꾸는 장면 |
| 317 | 장면 타입 | `contrast` | 210 | API.md:132 | 0.67 | ok |  | `before`, `after`(위 beforeAfter의 각 쪽) |
| 318 | 장면 타입 | `compare` | 211 | API.md:133 | 1.00 | ok |  | `items: [{label, visual, tone, verdict, note, noteAfter, enter, onReveal, onReset}]`, `form`, `cols`, `reveal`, `revealLabel`. |
| 319 | 장면 타입 | `compare` | 211 | API.md:133 | 1.00 | ok |  | `form: "table"`이면 사례가 행이 되는 비교표(라벨 \/ 그림 \/ 판정), `head: ["라벨 열", "그림 열", "판정 열"]`은 열 머리글 |
| 320 | 장면 타입 | `predict` | 212 | API.md:134 | 1.00 | ok |  | `choices`, `answer`, `question`, `hint`, `visual`, `answerVisual`, `why`, `button`, `unsure`, `reveal`, `onReset`, `rest`. |
| 321 | 장면 타입 | `predict` | 212 | api/deck-contracts.md:23 | 1.00 | ok |  | `rest`는 정답 공개 뒤 고르지 않은 오답의 모습: `"hide"`(기본, 자리만 남기고 숨김) · `"dim"`(흐리게) · `"dot"`(점으로). |
| 322 | 장면 타입 | `predict` | 212 | api/deck-contracts.md:23 | 1.00 | ok |  | 어느 쪽이든 자리를 유지해 화면이 흔들리지 않는다. |
| 323 | 장면 타입 | `predict` | 212 | api/deck-contracts.md:23 | 1.00 | ok |  | 펼친 정답은 hide로 숨긴 자리에는 놓일 수 있지만 dim·dot 선택지는 가리지 않는다. |
| 324 | 장면 타입 | `predict` | 212 | api/deck-contracts.md:24 | 1.00 | ok |  | 배율은 장면에 들어올 때 문제 상태와 선택지별 정답 상태 중 가장 큰 쪽에 맞춰 한 번 정하고, 공개할 때 바꾸지 않는다. |
| 325 | 장면 타입 | `predict` | 212 | api/deck-contracts.md:24 | 1.00 | ok |  | 그래서 해설(`why`)·`answerVisual`이 길면 공개 전에도 장면이 작아지니 짧게 쓴다. |
| 326 | 장면 타입 | `predict` | 212 | api/deck-contracts.md:25 | 1.00 | ok |  | 측정을 위해 함수형 `answerVisual(node, id)`는 선택지마다 |
| 327 | 장면 타입 | `predict` | 212 | api/deck-contracts.md:25 | 1.00 | ok |  | 화면 밖에서 미리 한 번씩 불릴 수 있다(인자를 하나만 받으면 한 번만): 같은 입력이면 같은 크기를 내고, 전역 상태·기록을 건드리지 않아야 한다. |
| 328 | 장면 타입 | `predict` | 212 | api/deck-contracts.md:25 | 1.00 | ok |  | 미리 그리는 동안 kit의 `send`는 아무것도 하지 않는다. |
| 329 | 장면 타입 | `predict` | 212 | api/deck-contracts.md:25 | 1.00 | ok |  | `node` 안의 지연 애니메이션은 크기를 바꾸지 않을 때만 괜찮다. |
| 330 | 장면 타입 | `predict` | 212 | api/deck-contracts.md:23 | 1.00 | ok |  | 덱 전체 기본값은 `LTT.deck({predictRest})` |
| 331 | 장면 타입 | `summary` | 213 | API.md:135 | 1.00 | ok |  | 앞 장면의 `takeaway`를 모은다. |
| 332 * | 장면 타입 | `summary` | 213 | API.md:135 | 0.75 | ok | 없 | `recall`이 있으면 글 목록의 인출 연습이 된다: 질문 → 입력칸(선택) → "답 보기" → takeaway·`ask`. |
| 333 | 장면 타입 | `summary` | 213 | api/deck-contracts.md:29 | 1.00 | ok |  | 답 칸은 열기 전에도 빈자리로 잡혀 있어 열어도 배율이 바뀌지 않는다. |
| 334 | 장면 타입 | `summary` | 213 | api/deck-contracts.md:29 | 1.00 | ok |  | 공개할 때 `recall` 이벤트(`{scene, question, answer}`)를 남긴다. |
| 335 | 장면 타입 | `summary` | 213 | API.md:135 | 1.00 | ok |  | `recall`이 없으면 카드 격자. |
| 336 | 장면 타입 | `summary` | 213 | API.md:135 | 1.00 | ok |  | `cards: [{n, title, text, ask, recall}]`로 직접 줄 수도 있다. |
| 337 | 장면 타입 | `summary` | 213 | API.md:135 | 1.00 | ok |  | `extra: {title, text}`는 마지막 항목 |
| 338 | 장면 타입 | `keywords` | 214 | API.md:136 | 1.00 | ok |  | `terms: [{ko, en}]`, `signals`, `queries`, `neighbors: [{term, diff}]`. |
| 339 | 장면 타입 | `keywords` | 214 | API.md:136 | 1.00 | ok |  | 작성하는 마지막 장면. |
| 340 | 장면 타입 | `keywords` | 214 | api/deck-contracts.md:30 | 1.00 | ok |  | 그 뒤에 `map-related` 장면이 `/map/data.json`에서 자동으로 붙는다(이어진 개념이 없으면 없음). |
| 341 | 장면 타입 | `keywords` | 214 | api/deck-contracts.md:30 | 1.00 | ok |  | 직접 쓰지 않는다 |
| 342 | 장면 타입 | (없음) | 215 | API.md:137 | 1.00 | ok |  | `mount`로 그리는 커스텀 장면 |

flagged (*): 16

## 판정 (main, flagged 16건 수동 확인)

| # | 새 위치에서 확인한 문장 | 판정 |
| --- | --- | --- |
| 2 | API.md:3 "실물과 코드는 `…/catalog.html`" | 같은 뜻 |
| 6 | API.md:142 "색은 위 토큰만 쓴다" (토큰 표가 원칙보다 앞에 있어 아래 → 위) | 같은 뜻 |
| 26 | API.md:46 첫 칸 `LTT.icon(...)`, `LTT.icons`(목록 이름이 정의 칸에 있음) | 같은 뜻 |
| 59 | API.md:72 "`{{x}}`의 풀이가 `glossary`·`terms` 장면에 없다" | 같은 뜻 |
| 60 | API.md:73 "처음 `{{}}`로 표시하기 전 장면에서 썼다" | 같은 뜻 |
| 67 | API.md:77 "마지막 장면이 keywords가 아니다"(no-title과 한 행으로 합침) | 같은 뜻 |
| 69, 70 | API.md:79 "`visual`이 없다(그림으로 못 보일 말은 `visual: false`)" | 같은 뜻 |
| 74 | API.md:83 "`theme`이 없거나 없는 이름이다" | 같은 뜻 |
| 78 | API.md:88 "패널 경고, `layout-audit` 이벤트, `<html data-ltt-audit=…>`로 남는다" + deck-contracts "덱이 모든 장면을 그려 잰다" | 같은 뜻(두 곳으로 나뉨) |
| 84 | API.md:92 "88% 미만으로 줄었다"(행 안의 `/` 구분 때문에 스크립트가 다른 줄과 짝지음) | 같은 뜻, "화면에 맞추느라"만 생략 |
| 86 | API.md:94 "figure 그림이 figure 무대의 35% 미만" | 같은 뜻 |
| 259 | API.md 기본 이름 표 `LTT.deck({title, glossary: {용어: 풀이}, scenes})` 행 | 같은 뜻 |
| 269 | API.md:109 "제목 위 작은 알약(맥락)" | 같은 뜻 |
| 313 | deck-contracts.md:34 "overview도 figure처럼 그림이 무대 전체를 쓴다" | 같은 뜻 |
| 332 | API.md:135 "`recall`이 있으면 질문 → 입력칸(선택) → "답 보기" → takeaway·`ask`의 인출 연습" | 같은 뜻 |

이동 위치 요약(기준 절 → 새 파일, 문장 수): ltt.js 기초 → API.md 19·base 18·ui 1(contrast). 테마 → base 10(표면 설명)·API.md 3. lint → API.md 17. ?audit → API.md 17·deck-contracts 17. ltt-ui → ui 30. mock → mock 11. ltt-parts → diagram 53·controls 26·charts 14·sequence 7·map 6·API.md 2(math, MOTION_MS). 덱 소개 → deck-contracts 8·API.md 2. 공통 필드 → API.md 17·deck-contracts 2. 장면 타입 → API.md 26·deck-contracts 29. internals.md로 간 작가용 문장은 0이다. internals.md는 기준 문서에 없던 내부 이름 표만 담는다.
