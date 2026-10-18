# kit API

수업은 빈 `lesson.html`에서 부품을 조합해 짠다. 실물과 코드는 `https://learn-to-tell.vercel.app/gallery/catalog.html`, 장면 타입별 예는 `https://learn-to-tell.vercel.app/gallery/scenes.html`.

| 부품 문서 | 언제 읽나 |
| --- | --- |
| `kit/api/base.md` | 글꼴·모양 토큰, 다크 모드, 폰트, 아이콘 크기·출처, 팔레트 대비, 드문 ltt.js 이름 |
| `kit/api/ui.md` | 해설·번호 주석·BEFORE/AFTER·숫자 카드·콜아웃·대비 검사 |
| `kit/api/mock.md` | 폰·브라우저·터미널·코드 목업 |
| `kit/api/diagram.md` | 박스·화살표, 자동 배치, 상태 기계, 트리 |
| `kit/api/sequence.md` | 누가 누구에게 언제 보내나 |
| `kit/api/map.md` | 지도와 경로 |
| `kit/api/controls.md` | 손잡이, 짐작, 단계 재생, 시뮬레이션 |
| `kit/api/charts.md` | 축·막대·흐름·평면·단위 그림 |
| `kit/api/deck-contracts.md` | figure `steps`, predict `answerVisual`·`rest`, 덱 이동, `?audit` 세부, 폰 재배치 |

## 불러오기

순서를 지킨다. 뒤 모듈이 앞 모듈을 쓴다. 주석이 달린 vendor는 그 부품을 쓸 때만 불러온다.

```html
<link rel="stylesheet" href="/kit/vendor/katex/katex.min.css"> <!-- 수식 -->
<script src="/kit/vendor/d3.min.js"></script>
<script src="/kit/vendor/plot.umd.min.js"></script> <!-- plot, 전역 Plot -->
<script src="/kit/vendor/katex/katex.min.js"></script> <!-- 수식 -->
<script src="/kit/vendor/d3-sankey.min.js"></script> <!-- sankey -->
<script src="/kit/vendor/topojson-client.min.js"></script> <!-- map -->
<script src="/kit/vendor/prism/prism.min.js"></script> <!-- mock.code의 lang -->
<script src="/kit/vendor/elk.bundled.js"></script> <!-- autoLayout·state -->
<script src="/kit/vendor/rough.js"></script> <!-- sketch 손그림 선 -->
<script src="/kit/ltt.js"></script>
<script src="/kit/ltt-parts.js"></script>
<script src="/kit/ltt-ui.js"></script>
<script src="/kit/ltt-mock.js"></script> <!-- 목업, 쓸 때만 -->
<script src="/kit/ltt-deck.js"></script>
```

## 기본 이름

| 이름 | 설명 |
| --- | --- |
| `LTT.theme(name)`, `LTT.themes` | 도메인 테마를 고른다. 덱에서는 `LTT.deck({theme})`로 넘긴다. 아래 표. |
| 토큰 | `--ltt-bg` `--ltt-card` `--ltt-card-2` `--ltt-line` `--ltt-line-2` `--ltt-ink` `--ltt-ink-2` `--ltt-muted` `--ltt-accent(-soft)` `--ltt-good(-soft)` `--ltt-bad(-soft)` `--ltt-warn(-soft)` `--ltt-dark` `--ltt-on-dark` `--ltt-on-accent` `--ltt-accent-on-dark`, 범주형 `--ltt-c1`…`--ltt-c6`, 지도 `--ltt-sea` `--ltt-land` `--ltt-border`. 글꼴·모서리 토큰은 `kit/api/base.md` |
| `LTT.palette()`, `LTT.palette(theme, "light"\|"dark")` | 범주형 색 6개 배열. 인자 없이 부르면 지금 페이지의 테마·다크 모드 값. 계열 구분에만 쓰고 판정(good·bad)에는 쓰지 않는다. |
| `LTT.mark(kind, {size, color, weight, fill, inline})`, `LTT.marks` | 모양 표식 SVG 문자열(square, ring, dot, diamond, cross). 색만으로 계열을 가르지 않게 모양을 함께 쓴다. |
| `LTT.icon(name, {weight, cls})`, `LTT.icons` | 선 아이콘 SVG 문자열. hook `art`, explain·terms·facts `icon`, diagram 노드 `icon`에는 이름만 넘긴다. 목록에 없는 값(이모지 등)은 글자로 그린다. |
| `{{용어}}`, `{{보이는 말\|용어}}` | 본문 속 용어 표시. 덱이 풀이 팝오버로 바꾼다(마우스 올리기·탭). 처음 나온 장면은 진하게 표시된다. |
| `LTT.lintDeck(spec)` | 독학 기준 점검 `[{scene, rule, msg}]`. 덱이 시작할 때 실행해 오른쪽 아래 패널 경고와 `lint` 이벤트로 남긴다. |
| `LTT.expect(label, actual, expected, {tol})` | 기대값 대조. 불일치는 패널과 서버에 남는다. |
| `LTT.record(type, data)` | lesson 페이지에서만 서버로 이벤트를 보낸다. |
| `LTT.math(scope)` | `data-tex` 요소를 KaTeX로. |
| `LTT.MOTION_MS` | 기본 모션 길이. reduced-motion이면 0. |
| `LTT.deck({title, glossary: {용어: 풀이}, scenes})` | 장면 덱. 장면 하나 = 메시지 하나 = 스크롤 없는 한 화면. 아래 "덱". |

### 테마

| theme | 매체 | 맞는 도메인 |
| --- | --- | --- |
| `paper` | 논문 figure·교과서 | 수학, 교육학, 인지과학, 연구 설계 |
| `blueprint` | 회로·블록 도면 | GPU, 하드웨어, 시스템·네트워크 구조 |
| `terminal` | 터미널·로그·대시보드 | 백엔드, 인프라, CLI, 운영 |
| `ledger` | 경제 신문 차트 | 금융, 경제, 비즈니스 지표 |
| `lab` | 실험 노트·모눈 플롯 | 물리, 공학, 시뮬레이션 |
| `studio` | 제품 화면·디자인 툴 (기본) | UI/UX, 제품 |
| `sketch` | 화이트보드·손그림 설명 | 개념 첫 소개, 아키텍처 스케치, 브레인스토밍 |
| `atlas` | 지도·지리·물류 | 지리, 물류, 리전·지연 시간, 공급망 |

### lint 규칙

| rule | 뜻 |
| --- | --- |
| `unknown-term` | `{{x}}`의 풀이가 `glossary`·`terms` 장면에 없다 |
| `used-before-defined` | glossary 용어를 처음 `{{}}`로 표시하기 전 장면에서 썼다 |
| `predict-new-term` | predict 질문·선택지에서 처음 나온 용어 |
| `no-reading-guide` | compare·contrast·figure·overview·타입 없는 `mount` 장면에 `narration`·`points`·`sub`·`caption`(contrast는 `before.points`도)이 없다 |
| `overview-missing`, `overview-order`, `overview-no-visual` | summary가 있는데 한 장 정리(`overview`)가 없다 / overview가 summary 뒤·keywords 바로 앞이 아니다 / overview에 `figure`가 없다 |
| `no-title`, `keywords-last` | 제목 없는 장면(hook·summary·keywords 제외) / 마지막 장면이 keywords가 아니다 |
| `unused-term` | glossary 용어를 어디에도 표시하지 않았다 |
| `term-no-visual` | terms 항목에 `visual`이 없다(그림으로 못 보일 말은 `visual: false`) |
| `summary-no-recall` | summary가 모으는 takeaway에 `recall`이 없다 |
| `card-monotony` | 카드 격자 장면(explain `cards`, compare, terms, `recall` 없는 summary)이 3장 연속이거나, hook·keywords를 뺀 장면의 절반 초과 |
| `no-signature` | 그림이 주인공인 장면(`figure`, `contrast`, `layout: "full"`, 타입 없는 `mount`)이 없다 |
| `no-theme`, `unknown-theme` | `theme`이 없거나 없는 이름이다 |
| `filler-content` | "항목 1", "샘플 텍스트", lorem, TODO 같은 채움 글 |

### 화면 점검 (`?audit`)

lint는 장면 데이터만 본다. 그려진 화면은 URL에 `?audit`을 붙여 연다. 결과는 패널 경고, `layout-audit` 이벤트, `<html data-ltt-audit="건수">`로 남는다. 좁은 창 예외와 결과 JSON은 `kit/api/deck-contracts.md`.

| rule | 뜻 |
| --- | --- |
| `overflow`, `shrunk`, `hscroll` | 78%로 줄여도 넘친다 / 88% 미만으로 줄었다 / 가로로 넘친다 |
| `small-visual` | 가장 큰 그림(compare는 칸 그림의 합)이 화면 넓이의 10% 미만, figure·full 장면은 22% 미만 |
| `loose-figure`, `empty-stage` | figure 그림이 figure 무대의 35% 미만 / figure·full 장면이 화면 높이의 60% 미만만 쓴다 |
| `many-sizes` | 장면 본문(목업·SVG·번호 표식 제외)에서 글자를 직접 가진 요소의 글자 크기가 7단계 초과 |
| `graph-overlap` | diagram의 라벨·노드·엣지가 겹친다(`LTT.graphOverlaps`) |
| `panel-overlap` | figure 단계 자막 칸이나 펼친 predict 정답이 글 줄·컨트롤·그림(diagram은 노드·라벨 상자)과 겹친다 |
| `goal-unreachable`, `goal-narrow`, `goal-at-start` | `sweep` 목표가 어느 손잡이 자리에서도 안 맞는다 / 한 자리에서만 맞는다 / 시작 위치에서 이미 맞는다 |

## 덱

`LTT.deck(...)`에 아래 필드로 장면을 적는다. figure `steps`·predict `answerVisual`을 쓰면 `kit/api/deck-contracts.md`를 읽는다.

### 모든 장면의 공통 필드

| 필드 | 뜻 |
| --- | --- |
| `title`, `en` | 주장 문장으로 쓴 제목, 영문 보조 제목 |
| `kicker`, `sub`, `chips` | 제목 위 작은 알약(맥락) / 제목 아래 한두 줄(상황, 읽는 법) / 제목 아래 키워드 |
| `narration` | 해설 2–4문장. 있으면 그림 옆 설명 레일이 생긴다 |
| `points`, `pointsOn`, `pointsTone` | 번호 주석. 대상은 `pointsOn` 셀렉터, 없으면 `[data-annotate]`, 없으면 본문의 첫 요소 |
| `takeaway`, `sources` | 핵심 한 문장과 찾아볼 곳. summary 장면이 모은다 |
| `recall` | takeaway를 떠올리게 하는 질문 한 줄(summary에서 답보다 먼저 보인다) |
| `ask` | agent에게 할 질문 한 줄. summary 카드에 붙는다 |
| `aside` | 설명 레일에 넣을 추가 부품 |
| `basis`, `tex` | 근거 한 줄, 접힌 수식 |
| `mount(body, ctx)` → `{enter, leave}`, `enter` | 커스텀 그림. ctx: `{el, scene, index, scenes}` |
| `layout` | `"split"`(그림 \| 설명 레일), `"stack"`(설명 위, 그림 전체 폭), `"full"`(그림이 무대 전체, 해설·번호 주석은 그림 아래 캡션 줄). 기본은 figure·overview면 full, 그 밖에는 narration·points가 있으면 split(예외는 `kit/api/deck-contracts.md`) |
| `bare` | split에서 본문 카드 테두리를 없앤다(그림이 이미 패널일 때) |
| `number: false` | 큰 장면 번호를 숨긴다 |

### 장면 타입

| type | 필드 |
| --- | --- |
| `hook` | `art`(아이콘 이름·이모지·HTML), `pre`, `text`, `sub`, `kicker`, `chips`. 첫 장면 |
| `terms` | `terms: [{key, word, en, icon, visual, plain, example}]`. 용어를 쉬운 말로 먼저 푼다. key는 glossary에 자동 등록. `visual`(HTML·노드·함수)은 그 말이 가리키는 것을 보이는 작은 그림으로, 풀이 위에 그린다(예: 색상 → 색상환 위의 각도) |
| `explain` | `steps: [{icon, title, text, visual}]`, `form`, `arrows`. `form`: `"cards"`(기본, 독립된 요소 나열), `"strip"`(이어진 한 줄 흐름, 카드 없이 선과 마디), `"stack"`(세로 타임라인, 단계마다 오른쪽에 그림) |
| `figure` | `figure`(그림: 노드·HTML·함수), `caption`, `label`, `steps`. 그림 하나가 화면을 차지하고 아래에 "그림 n." 캡션이 붙는다 |
| `overview` | `figure`, `caption`, `label`(기본 "한 장 정리."). summary 뒤, keywords 바로 앞에 두는 한 장 인포그래픽. 새 내용 없이 앞 장면의 takeaway를 그림 안 자리에 배치한다 |
| `statement` | `title`(큰 주장 한 문장, `<em>`은 강조색), `sub`, `visual`(작은 근거 그림, 선택). 카드 없이 리듬을 바꾸는 장면 |
| `contrast` | `before`, `after`(`LTT.beforeAfter`의 각 쪽) |
| `compare` | `items: [{label, visual, tone, verdict, note, noteAfter, enter, onReveal, onReset}]`, `form`, `cols`, `reveal`, `revealLabel`. `form: "table"`이면 사례가 행이 되는 비교표(라벨 \| 그림 \| 판정), `head: ["라벨 열", "그림 열", "판정 열"]`은 열 머리글 |
| `predict` | `choices`, `answer`, `question`, `hint`, `visual`, `answerVisual`, `why`, `button`, `unsure`, `reveal`, `onReset`, `rest` |
| `summary` | 앞 장면의 `takeaway`를 모은다. `recall`이 있으면 질문 → 입력칸(선택) → "답 보기" → takeaway·`ask`의 인출 연습, 없으면 카드 격자. `cards: [{n, title, text, ask, recall}]`로 직접 줄 수도 있다. `extra: {title, text}`는 마지막 항목 |
| `keywords` | `terms: [{ko, en}]`, `signals`, `queries`, `neighbors: [{term, diff}]`. 작성하는 마지막 장면 |
| (없음) | `mount`로 그리는 커스텀 장면 |

## 원칙

- 페이지에는 모델 함수, 기대값, 장면 데이터, 그 수업에만 필요한 작은 CSS를 둔다.
- 색은 위 토큰만 쓴다. hex를 새로 적으면 다크 모드가 깨진다(목업 속 '실제 화면' 색은 예외).
- 테마는 매체를 고르는 것이지 장식이 아니다. 페이지 CSS에서 토큰을 다시 정의하지 않는다.
- 공개 전 경고는 0건이어야 한다. lint는 표시된 용어만 안다. 표시하지 않은 전문 용어는 독자 검토(SKILL.md)로 잡는다.
- 작성·점검 기준은 1280px 이상 데스크톱이다. 1440×900과 1280×800 두 크기에서 0건이어야 한다.
