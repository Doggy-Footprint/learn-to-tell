언제: 글꼴·그림자·모서리 토큰, 다크 모드, 테마 표면, 폰트, 아이콘 크기·출처, 팔레트 대비가 궁금하거나 `themeTokens`·`summaryCards`·`linkTerms`·`warn`을 쓸 때 · vendor 없음 · 실물: `https://learn-to-tell.vercel.app/gallery/catalog.html#api-base`

# ltt.js 기초 중 드물게 쓰는 것

자주 쓰는 ltt.js 이름(테마, 색 토큰, 팔레트, 표식, 아이콘, 용어, lint, 기록, 기대값)은 `kit/API.md`에 있다.

| 이름 | 설명 |
| --- | --- |
| 글꼴·모양 토큰 | `--ltt-shadow` `--ltt-font` `--ltt-font-display` `--ltt-mono` `--ltt-r-lg` `--ltt-r-md` `--ltt-r-sm`. 색 토큰은 `kit/API.md`. |
| 다크 모드 | 다크 모드는 `prefers-color-scheme`를 따르고, `<html data-theme="light\|dark">`로 고정할 수 있다. |
| 폰트 | 본문 Pretendard Variable, 세리프 `'LTT Serif'`(Noto Serif KR), 모노 `'LTT Mono'`(D2Coding). 세리프·모노는 KS X 1001 한글 2,350자 + 라틴 subset이라 빠진 음절은 시스템 폰트로 그린다. 숫자·코드는 `var(--ltt-mono)`, 세리프 제목은 테마의 `--ltt-font-display`. |
| 팔레트 대비 | `LTT.palette()`의 색은 모든 테마에서 배경 대비 3:1 이상(글자 토큰 `ink`·`ink-2`·`muted`·`accent`·`good`·`bad`·`warn`은 바탕·카드·자기 soft 위 4.5:1 이상), 색각 이상(적록·청황) 시뮬레이션에서도 구분된다(`tests/kit.test.mjs`). |
| 표식 넣기 | `LTT.mark(...)`의 SVG는 (0,0) 중심이라 d3 `g.html(...)`에 넣는다. `inline: true`면 1em `<svg>`로 감싸 본문·범례에 쓴다. |
| 아이콘 크기 | 장면의 그림 칸(compare·explain·terms `visual`, predict `visual`·`answerVisual`, figure)에 아이콘 하나만 넣으면 본문 글자 크기가 아니라 칸에 맞는 크기(44–84px, 강조색)로 그린다. 문장 속·버튼·범례 아이콘은 1em 그대로다. SVG 안(diagram·sequence 노드)에서는 글자가 보이지 않으니 이름만 쓴다. |
| 아이콘 출처 | 손으로 그린 44개 + Lucide에서 가져온 16개(globe, map-pin, route, git-branch, timer, database-zap, network, shield-check, key-round, mail, package, truck, wifi, cloud, gauge, workflow). 더 필요하면 Lucide에서 그 아이콘만 `ICONS`에 옮긴다(전체 세트는 넣지 않는다). |
| `LTT.themeTokens(theme, scheme)` | 문서 없이 테마의 색 토큰 객체(`{bg, ink, c1, …}`). 테스트·서버 쪽 계산용. |
| `LTT.linkTerms(el, sceneIndex)` | 나중에 그린 DOM의 `{{}}`를 바꾼다(`load` 때 덱 밖 페이지의 `body`는 kit이 한다). `script`·`style`·`template`·`noscript`·`textarea`와 kit UI 안 글은 건드리지 않는다. 덱은 장면 마운트, predict 공개, compare 공개, summary recall의 답 보기, stepper 자막에서 알아서 부른다. |
| `LTT.warn(msg)` | 패널에 경고 한 줄. |
| `LTT.summaryCards(scene, scenes)` | summary 장면이 보일 항목 목록(lint와 덱이 같이 쓴다). |

## 테마 표면

테마는 토큰 값과 표면(모서리, 그림자, 제목 폰트, 배경 격자)만 바꾸므로 같은 부품이 다른 매체처럼 보인다.

| theme | 흉내 내는 매체 | 맞는 도메인 |
| --- | --- | --- |
| `paper` | 논문 figure·교과서: 크림 종이, 세리프 제목, 괘선, 그림자 없음 | 수학, 교육학, 인지과학, 연구 설계 |
| `blueprint` | 회로·블록 도면: 남색 격자, 모노 라벨, 선만 있는 상자 | GPU, 하드웨어, 시스템·네트워크 구조 |
| `terminal` | 터미널·로그·대시보드: 검정 바탕, 모노 번호, 녹색 강조 | 백엔드, 인프라, CLI, 운영 |
| `ledger` | 경제 신문 차트: 살구색 종이, 세리프 헤드라인, 각진 표 | 금융, 경제, 비즈니스 지표 |
| `lab` | 실험 노트·모눈 플롯: 모눈 배경, 주황 펜 색 | 물리, 공학, 시뮬레이션 |
| `studio` | 제품 화면·디자인 툴: 중립 회색, 둥근 카드 (기본) | UI/UX, 제품 |
| `sketch` | 화이트보드·손그림 설명: 흰 보드(다크는 칠판), 굵은 마커 선. `rough.js`를 불러오면 diagram이 손그림 선으로 그려진다 | 개념 첫 소개, 아키텍처 스케치, 브레인스토밍 |
| `atlas` | 지도·지리·물류: 바다·육지 색 토큰, 모노 번호 | 지리, 물류, 리전·지연 시간, 공급망 |
