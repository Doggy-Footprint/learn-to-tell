# kit 확장: 테마 자산, 설명 형태별 라이브러리, 복잡한 도식

## Goal

"라이브러리로서 테마, 에셋에 해당하는 것들, 그래프 등 다양한 설명 방법에서 사용하는 형태들를 표현할 수 있는 라이브러리들, 그리고 1,2,3,4 모두 넣어서 하나의 handoff로 만들어줘."

1–4는 직전 대화에서 제안한 도식 보강이다: (1) 꺾인 화살표, (2) 중첩 영역·여러 줄 라벨, (3) 자동 배치, (4) 시퀀스 다이어그램 같은 전용 형식.

## State

- branch: `master`, 기준 commit: `ece1ea6` (origin과 같음, 작업 트리 깨끗함). 이 handoff 파일과 `index.md`만 새로 추가됐다.
- 현재 kit (`skills/learn-to-tell/kit/`):
  - `ltt.js`: 토큰, 테마 6종(`THEMES`: studio, paper, blueprint, terminal, ledger, lab), 아이콘 44개(`ICONS`, 손으로 그린 24×24 선 아이콘), lint(`lintDeck`), 화면 점검 판정(`auditScene`).
  - `ltt-parts.js`: `LTT.diagram`(격자 좌표 노드, 직선 엣지, 사각 영역, `player`·`send`·`flow`·`highlight`), `stepper`, `units`, `bar`, `sweep`, `plane`, `sim`, `predict`, `math`.
  - `ltt-ui.js`, `ltt-mock.js`(phone, browser, terminal, code), `ltt-deck.js`(장면 타입, `figure`·`statement`·explain form·compare table·`layout: "full"`, `?audit` 측정).
  - vendor (`kit/vendor/VERSIONS`): d3 7.9.0, @observablehq/plot 0.6.17, KaTeX 0.16.11, Pretendard 1.3.9.
- `LTT.diagram` 한계 (`ltt-parts.js` `diagramLayout`): 엣지는 두 노드 중심을 잇는 직선을 상자 경계에서 자른 것뿐이다. 경유점·꺾임·곡선·포트·평행 엣지 분리·자동 배치·중첩 영역·여러 줄 라벨이 없다.
- 테마 한계: 폰트는 vendor 없이 시스템 스택(`SERIF`)이라 기기마다 다르다. 범주형 색 팔레트 토큰이 없어 Plot 차트 색이 테마를 따르지 않는다. 아이콘은 테마와 무관하게 한 벌이다.
- gallery 작업에서 서브에이전트들이 페이지에 직접 짠 부품(kit 후보, 위치는 아래 "부품 백로그" 표).

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| paper 테마 accent를 적갈색(`#9b3a24`)으로 둠 | anchoring·matrix 수업에서 accent와 bad 표시가 구분되지 않았다(서브에이전트 보고, 페이지 문구가 "파란/빨간"을 가리킴) | accent와 bad가 같은 색상 계열 (verified). accent를 남색 `#23508e`로 바꿔 해결 |
| `auditScene` 첫 기준: 가장 큰 그림 하나의 넓이, 글자 크기 6단계 | 정상인 compare table(행마다 작은 그림)과 대부분의 장면이 경고됐다 | 비교표는 칸 그림 합이 한 그림이고, kit 부품만으로 글자 크기가 약 7단계다 (verified). 합산·7단계로 보정 |
| 휴대폰 폭에서도 그림 넓이 비율 점검 | 390×844에서 정상 figure가 모두 `small-visual` | 휴대폰은 장면이 스크롤되고 넓은 그림은 화면 넓이 대비 항상 작다 (verified). 휴대폰은 `hscroll`만 본다 |
| figure 무대 `min-height:min(46vh,520px)` | cache-ttl figure 아래가 크게 비었다(스크린샷) | 그림보다 큰 최소 높이 (verified). `min(30vh,320px)`로 줄임 |
| color-contrast figure의 `.review`에 `flex-wrap: wrap` | 데스크톱에서 폰 목업과 검사 패널이 세로로 쌓여 78%로 축소됐다 | 폭 % 목업의 max-content 계산으로 줄바꿈 (hypothesis). 데스크톱은 `flex: none`, 720px 이하만 wrap |

## Next Step

작업은 다섯 갈래다. A(토큰·자산)가 B·C·D의 색과 폰트를 정하므로 먼저 한다. 각 갈래는 독립 커밋으로 끝내고, 끝날 때마다 gallery 전 페이지가 lint 0건, `?audit` 1440×900·390×844 0건, `npm test` 통과인지 확인한다.

### A. 테마 자산

1. 범주형 팔레트 토큰 `--ltt-c1`…`--ltt-c6`을 테마마다 라이트·다크 두 벌 정의하고, `LTT.palette()`가 배열로 돌려주게 한다. Plot 차트는 `color: {range: LTT.palette()}`로 쓴다. 팔레트는 dataviz 원칙(색각 이상 구분, 배경 대비 3:1 이상)으로 검증한다.
2. 모양 표식 어휘: 색만으로 구분하지 않도록 `LTT.mark(kind)`(square, ring, dot, diamond, cross)를 SVG 기호로 제공한다. anchoring 수업이 페이지에서 만든 것을 일반화한다.
3. 테마 폰트 vendor: 세리프(Noto Serif KR), 한글 포함 모노(D2Coding 또는 Noto Sans Mono CJK 계열)를 woff2로 넣는다. 용량이 크면 KS X 1001 2,350자 + 라틴으로 subset한다. Pretendard처럼 `@font-face`는 테마가 쓸 때만 로드한다.
4. 아이콘 확장: 손 아이콘 44개를 유지하고, 부족한 분야 아이콘은 Lucide(ISC)에서 필요한 것만 같은 선 굵기로 가져와 `ICONS`에 추가한다. 전체 세트를 vendor하지 않는다.
5. 테마 추가 후보: `sketch`(화이트보드, roughjs로 손그림 선), `atlas`(지도·지리). 수업 수요가 생기면 넣는다.

### B. 도식 보강 (1, 2)

1. 엣지 경로: 엣지에 `via: [[c, r], …]`(격자 좌표 경유점), `from`/`to`: `"top"|"right"|"bottom"|"left"`(나가는·들어오는 변), `shape: "straight"|"ortho"|"curve"`를 추가한다. `ortho`는 직각 꺾임에 모서리 반경을 준다. `send()` 패킷과 `flow()`는 경로를 따라야 하므로 `path.getPointAtLength`로 바꾼다.
2. 같은 두 노드 사이 엣지가 여러 개면 자동으로 벌린다(평행 오프셋). 엣지 라벨은 경로 중간점에 둔다.
3. 중첩 영역: 영역에 `parent`를 주어 영역 안의 영역을 그린다. 라벨 자리를 겹치지 않게 안쪽 영역을 들여 놓는다.
4. 여러 줄 라벨: 노드 `l`·`s`의 `\n`을 `tspan`으로 나누고, 노드 높이를 줄 수에 맞춰 자동으로 늘린다(`h`를 주면 그것을 따른다).
5. `diagramLayout`은 순수 함수로 유지하고 `tests/kit.test.mjs`에 경로·오프셋·중첩 영역 좌표 테스트를 추가한다.

### C. 자동 배치 (3)

1. `LTT.autoLayout(spec)`: 좌표 없는 `{nodes, edges, groups}`를 받아 `diagram`이 받는 좌표·경로를 돌려준다. 결과는 같은 입력에 같은 좌표여야 한다(테스트로 고정).
2. 엔진은 Open Questions의 선택에 따라 vendor한다. 단계 재생과 하이라이트가 그대로 동작하도록 출력은 B의 엣지 형식(`via`, `from`/`to`)으로 바꿔 넘긴다.
3. 노드 20개 이상인 예시 도식 하나를 catalog에 추가한다.

### D. 전용 형식과 설명 형태 부품 (4 포함)

1. `LTT.sequence(svg, {actors, messages, notes})`: 세로 생명선, 메시지 화살표(동기·비동기·응답), 활성 막대, 시간 구간 표시. `player`처럼 메시지 단계 재생을 지원한다. 백엔드 재시도·인증 흐름 수업에 쓴다.
2. `LTT.state(svg, {states, transitions})`: 상태 다이어그램. C의 자동 배치를 쓴다.
3. 차트 부품: 아래 표의 라이브러리를 쓰되, 테마 팔레트와 모노 눈금을 기본으로 하는 얇은 래퍼만 kit에 둔다.

| 설명 형태 | 라이브러리 | 상태 | kit에 둘 것 |
| --- | --- | --- | --- |
| 막대·선·점·분포 | Plot 0.6.17 | 있음 | 테마 팔레트·모노 눈금 기본 설정 `LTT.plotTheme()` |
| 축 있는 함수·궤적 플롯 | d3 | 있음 | `LTT.axisPlot(svg, {x, y, equal, ticks, labels})` (physics 수업 `traj()` 일반화) |
| 트리·트리맵·계층 | d3-hierarchy (d3에 포함) | 있음 | 예시만 catalog에 |
| 흐름량(Sankey) | d3-sankey (ISC) | 없음 | 비용·트래픽 흐름 수업 생기면 |
| 지도 | d3-geo(d3 포함) + topojson-client + world-atlas (ISC) | 없음 | 지리·물류 수업 생기면 |
| 수식 | KaTeX 0.16.11 | 있음 | 그대로 |
| 코드 강조 | Prism 또는 highlight.js (MIT/BSD) | 없음 | `mock.code`의 문법 색 |
| 손그림 선 | roughjs (MIT) | 없음 | `sketch` 테마용 |
| 3D(벡터·회전·물리) | three.js (MIT) | 없음 | 용량이 커서 3D가 핵심인 수업이 생길 때만 |

### E. 부품 백로그 (gallery 작업에서 페이지에 직접 짠 것)

| 부품 | 지금 있는 곳 | kit 형태 |
| --- | --- | --- |
| 화면 간격 레드라인(여백 막대 + px 라벨) | `gallery/uiux/visual-hierarchy-spacing.html` `paint(k)` | `LTT.redline(mockEl, {gaps})` |
| 대비 검사 패널(견본·hex·비·통과 태그) | `gallery/uiux/color-contrast.html` `inspector()` | `LTT.inspector(rows)` |
| figure + 단계 자막(그림 왼쪽, 자막 오른쪽) | 두 UI 페이지 `.review` | `figure` 장면의 `steps` 필드 |
| 같은 그림의 여러 상태(Method → Results) | `gallery/pedagogy/retrieval-practice.html` | `figure` 장면에 `enter(fig, ctx)` |
| 신문식 차트 틀(헤드라인·설명·굵은 선·출처) | `gallery/finance/diversification.html` `np()` | `LTT.chartFrame({title, dek, source})` |
| 고정 축 가로 막대 | 같은 파일 `volBars()` | `axisPlot` 또는 Plot 래퍼 |
| 시간 축 레인(어디서 시간이 드는가) | `gallery/gpu/single-gpu-dataflow.html` | `LTT.lanes(svg, {lanes, axis})` |
| 터미널 줄 종류(hit·miss·stale·db) | `gallery/cache-ttl.html` CSS | `mock.terminal` 줄 `t`에 `warn` 계열 추가, 색은 테마 토큰 |
| 요청 틱 띠(2×50) | `gallery/cache-ttl.html` | `LTT.units`에 띠 배치 옵션 |
| 비교표 열 머리글 | 없음(질문을 `sub`에 씀) | compare `form: "table"`의 `head: [..]` |
| 목업 위 번호 주석 대상 | figure는 무대 전체가 대상이라 `pointsOn: ".ltt-phone"` 필요 | figure가 첫 목업을 기본 대상으로 |

### 마무리

- `kit/API.md`, `gallery/catalog.html`(부품별 실물과 코드), `SKILL.md` §3의 부품 고르는 기준을 함께 갱신한다.
- vendor를 추가할 때마다 `kit/vendor/VERSIONS`에 버전·파일·sha256, `LICENSE-*`를 남긴다. 버전은 vendor하는 시점에 확인한다. 이 문서는 버전을 정하지 않는다.
- 다 끝나면 이 파일의 index 항목을 `stale.md`로 옮기고 파일을 `stale/`로 옮긴다.

## Open Questions

- 자동 배치 엔진: ELK(elkjs)는 중첩 그룹·포트·직각 경로를 지원하지만 용량이 크고(수백 KB) 라이선스가 EPL-2.0이다. dagre(MIT)는 작지만 중첩 그룹과 포트가 약하다. 사용자에게 고르게 하거나, 둘을 같은 도식으로 비교해 보이고 정한다.
- Mermaid를 쓰지 않는 이유(제안): 용량이 크고, 자체 테마라 `--ltt-*` 토큰·단계 재생·하이라이트·`?audit` 측정과 맞추기 어렵다. 사용자가 이 이유에 동의하면 Rejection Record Rule에 따라 기록을 제안한다.
- 폰트 vendor 용량 한도: Pretendard만 2.0MB다. 테마 폰트 두 벌을 더하면 kit이 커진다. subset 범위(2,350자 vs 11,172자)를 정해야 한다.
- 새 테마(`sketch`, `atlas`)를 지금 넣을지, 수업 수요가 생길 때 넣을지.
- 이 작업이 workflow-approach(스펙 우선, 독립 테스트 작성자)를 거칠지. B·C는 순수 함수가 많아 테스트 가치가 크다.

## Spec

해당 없음. workflow-approach를 거치지 않은 계획 handoff다. 실행할 때 workflow-approach를 쓰면 여기에 spec 경로와 run ID를 적는다.

## Execution Ledger

해당 없음. 아직 실행하지 않았다.
