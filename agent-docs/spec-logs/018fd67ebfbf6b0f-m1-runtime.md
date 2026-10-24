---
version: 18
run_id: 018fd67ebfbf6b0f
status: limit
base_commit: 08c85ef361d68c260dc42b1fdcc0e7167291c07a
max_verifier_invocations: 2
handoff: agent-docs/handoff/93e77e4b52d35f59-m1-runtime-verifier-limit.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 사용자(프로젝트 소유자) | M1 생성 실험 전에, 수업 spec을 실제로 그리는 runtime을 범위를 좁혀 만든다. 줄이는 것은 종류뿐이고 구현한 것은 완성한다 | `ltt html`·`ltt sheet`가 예시 수업과 시험용 fixture 수업을 데스크톱·모바일에서 오류 없이 그리고, 구현한 mark마다 글자 배치 보장이 시험으로 확인된다 |
| UI-2 | 생성 agent | 렌더 없이 고칠 수 있는 오류 보고 | `ltt check`가 tsc·의미 규칙·글자 배치 실패를 spec 경로와 규칙 id로 보고한다 |
| UI-3 | 사용자 | v1 실패(렌더 뒤 레이아웃 수정 반복, 검증 반복, runtime 결함을 생성 agent가 떠안음)를 구조와 예산으로 막는다 | SKILL 초안이 읽는 순서, 반복 예산, runtime 디버깅 금지, 정답 검산 1회 규칙을 담는다 |
| UI-4 | 사용자(측정자) | 생성 실험에서 반복을 원인별로 센다 | `ltt` 명령이 실행 기록을 `.ltt/log.jsonl`에 남기고, `ltt digest`가 독립 정답 검산 입력을 만든다 |
| UI-5 | 학습자 | 현대적이고 읽기 쉬운 수업 UI | 최소 글자 크기·대비·키보드 조작·reduced motion 보장, stage·card 배치, 장면 타입별 상호작용 |

# Scope
In scope:
- `packages/runtime`에 다음을 만든다.
  - core: M0 stub 로직을 src로 옮긴다.
  - 결정적 layout 엔진(Node·브라우저 공용).
  - 브라우저 runtime(React + Motion).
  - check·html·sheet·digest CLI(`ltt`)와 빌드.
- frame: cartesian(선형·log·aspect equal·camera), graph(layered·tree), cells, geo(equalEarth·mercator, region).
- mark: axis, grid, legend, line, area, dot, circle, rect, arc, arrow, path, label, dim, angle, brace, node, edge, cell, math, code, mock.
- motion·composition: trace, flow, sweep, split, multiples, custom. MarkOpts `reveal` 포함.
- 화면: 장면 타입 8종과 summary(정적 모음), predict 입력 3종, quiz 문항 4종, glossary 팝오버, 시간 제어, 오류 패널, 시험 hook.
- check 규칙: handoff가 당긴 7개 + unimplemented + 글자 배치 실패 + M0 stub 규칙 래핑.
- 문서: SKILL 초안 `skill/learn-to-tell/SKILL.md`, 정답 검산 지시 `skill/learn-to-tell/verify-answers.md`, rules.md 상태 갱신.

Out of scope:
- 생성 실험 자체(3주제 생성·측정·기준선·사실 검토). 이 run이 끝난 뒤 별도 측정 단계로 한다(A-1).
- 미구현 frame: polar, lanes, space3d. graph layout force·sankey, geo orthographic.
- 미구현 mark·옵션: field, glyph, icon, inset, MarkOpts `from`.
- summary 공유 요소 전환, 장면 간 같은 id 이동·변형(M2).
- 나머지 check 층 규칙(first-scene, section-count 등, M2).
- 어두운 테마. Chrome 외 브라우저.
- 학습 이벤트 `events.jsonl`·`ltt open`·`ltt result`·map(M4). npm 배포·claude.ai(M5).
- `lesson.d.ts` 계약 변경. 단 Signatures "의미 결정"의 JSDoc 문장 추가는 범위 안이다.

# Paths
Implementation:
- package.json, package-lock.json, tsconfig.json, .gitignore
- packages/runtime/package.json, packages/runtime/build.mjs, packages/runtime/bin/
- packages/runtime/src/, packages/runtime/dev/spec-stub.mjs
- packages/runtime/types/lesson.d.ts, packages/runtime/types/ext/geo.d.ts (둘 다 JSDoc 문장만), packages/runtime/rules.md
- skill/learn-to-tell/SKILL.md, skill/learn-to-tell/verify-answers.md

Tests: packages/runtime/test/

Test command:
```
npm run build:runtime && npx tsc -p packages/runtime/test/tsconfig.json && node --test --test-concurrency=1 --experimental-test-coverage --test-coverage-include='packages/runtime/src/core/**' --test-coverage-include='packages/runtime/src/layout/**' --test-coverage-include='packages/runtime/src/check/**' --test-coverage-include='packages/runtime/src/cli/**' --test-coverage-include=packages/runtime/dev/spec-stub.mjs --test-coverage-include=bench/coverage/count.mjs --test-coverage-branches=80 --test-coverage-lines=90 'packages/runtime/test/**/*.test.mjs'
```

Review evidence:
- (R1) 렌더 검토 `bench/m1/runtime-sheet-review.md`
  - 절차: main이 예시 수업과 `packages/runtime/test/lessons/*.js` 전부에 `ltt sheet`를 돌린다.
  - PNG를 하나씩 보고, 장면·상태·viewport마다 겹침·잘림·작은 글자·빈 입력·대비 결함을 적는다.
  - 기대: 결함 0, 또는 결함마다 finding id.
- (R2) SKILL 검토 `bench/m1/skill-review.md`
  - FR-60 항목마다 SKILL.md 줄 번호와 충족 여부, 바이트 수를 적는다.
- R1·R2는 main이 쓴다.

Fuzzing:
- 도구: Test command 안의 seeded random harness. rng는 mulberry32 사본이고 test에 둔다.
- 표면: `placeTexts`.
- oracle: property. 출력 글자 상자끼리 겹침 0, 모두 영역 안. 그렇지 않으면 그 글자 id의 `text-no-room` 오류.
- seed 20261024, 2,000 사례(글자 3–40개, 영역 120–900 px, 장애물 0–10개).

Mutation tool: none — Stryker 등 미설치. 손 mutation 8–10개로 대신한다.

# Signatures
## 패키지 구조와 실행
- 모듈은 전부 ES module이다.
- 브라우저 번들 `packages/runtime/dist/`는 `npm run build:runtime`(= `node packages/runtime/build.mjs`, esbuild)이 만든다. dist는 git에 넣지 않는다.
- CLI: `node packages/runtime/bin/ltt.mjs <command> ...`. 루트 package.json `bin.ltt`도 같은 파일이다.
- `packages/runtime/dev/spec-stub.mjs`는 M0 export(`createApi, load, evaluate, bindingErrors, ode, rng, argmax, root, sample, histogram, interpolate`)와 CLI 동작을 그대로 유지한다. 구현은 `src/core`로 옮기고, stub은 그것을 다시 export한다.
- Node 쪽 공개 모듈(시험이 import하는 경로):
  - `packages/runtime/src/core/index.mjs`: stub과 같은 export.
  - `packages/runtime/src/layout/index.mjs`: 아래 layout API.
  - `packages/runtime/src/check/index.mjs`: `checkLesson`, `RULES`.
  - `packages/runtime/src/cli/digest.mjs`: `digest`.
- layout·check·core 모듈은 DOM, React, `window`, `document`를 import하거나 참조하지 않는다.
- Chrome 실행 파일 경로:
  - 환경 변수 `LTT_CHROME`.
  - 없으면 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
  - 둘 다 없으면 sheet는 종료 코드 2.
  - 브라우저 제어는 `playwright-core`로 한다.

## 상수 (`src/layout/index.mjs` export)
- `VIEWPORTS = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } }`
- `stageBox(viewport: "desktop" | "mobile"): { width: number; height: number }`: 그 viewport에서 figure 하나가 받는 px 영역.
  - desktop: stage가 왼쪽, card가 오른쪽. card 폭은 400–440 px.
  - mobile: stage가 위, card가 아래. stage 폭은 viewport 폭 − 2×16 px.
- `TEXT = { figure: { m: 14, s: 12, l: 17 }, card: 16, min: 12 }` (px). MarkOpts `size`가 figure 글자 크기를 고른다. 기본 m.
- `LEADER_PX = 20`: 글자 상자에서 기준점까지 거리가 이 값을 넘으면 leader 선이 있다.
- `TONES: Record<Tone, string>`: 밝은 테마 색. `BACKGROUND: string`.
- `contrast(fg: string, bg: string): number`: WCAG 2.x 대비비.

## 글자 측정
- `measureText(text: string, o: { size: number; weight?: 400 | 600 }): { width: number; height: number }`
  - 한 줄 폭은 번들 글꼴(Pretendard)의 글자 폭 표로 잰다. 커닝은 없다.
  - height = 줄 수 × 줄 높이. 줄 높이는 size × 1.3.
- `wrapText(text: string, o: { size: number; weight?: 400 | 600; maxWidth: number }): string[]`
  - 공백에서 줄을 바꾼다. 공백이 없어 maxWidth를 넘는 토큰은 글자 단위로 나눈다.
- 브라우저 runtime은 같은 글꼴을 `font-kerning: none`으로 그린다. 그래서 Node 측정과 DOM 측정이 1 px 안에서 같다(QR-5).

## 글자 배치
- `placeTexts(req: { box: { width: number; height: number }; obstacles: Box[]; avoid?: [x1: number, y1: number, x2: number, y2: number][]; texts: TextReq[] }): { placed: Placed[]; errors: { id: string; rule: "text-no-room"; message: string }[] }`
  - `avoid`는 데이터 선분이다(약한 장애물). 후보 중 avoid 선분과 교차하지 않고 다른 조건을 지키는 자리가 있으면 그 자리를 쓴다. 그런 자리가 없을 때만 선분과 교차하는 자리를 쓴다(오류 아님).
  - layoutFigure는 같은 panel의 line·area 윤곽·path·arrow·trace 선분을 avoid로 넘긴다.
- `Box = { x: number; y: number; width: number; height: number }` (px, 좌상단 원점, y 아래로)
- `TextReq = { id: string; text: string; size: number; weight?: 400 | 600; ref: [number, number]; anchor?: Anchor; maxWidth?: number; leader?: [number, number]; fixed?: boolean; priority?: number }`
- `Placed = { id: string; box: Box; lines: string[]; leader?: [x1: number, y1: number, x2: number, y2: number] }`
- 배치가 지키는 것:
  - 모든 placed 상자는 box 안에 있다.
  - placed 상자끼리, 그리고 obstacles와 겹치지 않고 `TEXT_GAP = 6` px 이상 떨어진다(`src/layout/index.mjs` export). fixed 글자끼리의 간격 위반은 errors로 보고한다.
  - 같은 입력이면 같은 출력이다.
  - fixed 글자는 ref·anchor 자리를 그대로 쓰고 장애물이 된다. 겹치면 errors로 보고한다.
  - 상자와 ref 사이 거리가 LEADER_PX를 넘거나 req에 leader가 있으면 leader가 있다.
  - 자리가 없는 글자는 placed에 넣지 않고 errors에 넣는다. 글자 크기는 줄이지 않는다.
- 알고리즘: priority 높은 순서(같으면 입력 순서)의 탐욕적 배치다. 후보는 anchor 방향을 먼저, 그다음 8방향 × 거리 단계 순서로 보고, 첫 무충돌 후보를 쓴다.

## figure layout
- `layoutFigure(input: LessonInput, figKey: string, o: { viewport: "desktop" | "mobile"; t: number; step: number; params?: Params; focus?: string[] | null; hidden?: string[]; box?: { width: number; height: number }; compare?: { a: Params; b: Params; labels: [Text, Text] } }): Promise<FigureLayout>`
  - compare가 있으면 figure를 a·b params로 각각 그린 panel 2개를 낸다(같은 domain).
  - box 기본값은 `stageBox(viewport)`다.
  - params는 model defaults 위에 합친다.
  - hidden id의 mark는 그리지 않는다.
  - focus가 배열이면 그 id는 강조하고 나머지는 낮춘다. null이면 강조·낮춤이 없다.
- `FigureLayout`:
  ```
  {
    width: number; height: number;
    panels: Panel[];                // split·multiples·compare는 2개 이상, 그 밖은 1개
    items: Item[];                  // 그리기 순서
    errors: LayoutError[];
  }
  ```
- `Panel = { frame: "cartesian" | "graph" | "cells" | "geo"; box: Box; plot: Box; domain: { x: [number, number]; y: [number, number] }; log?: "x" | "y" | "xy"; projection?: "equalEarth" | "mercator"; region?: string }` (projection·region은 geo panel에만 있고 JSON에 남는 일반 속성이다)
  - box는 그 panel이 차지하는 영역 전체(panel 제목·축 글자 포함)다. panel이 2개 이상이면 box끼리 겹치지 않는다.
  - plot은 데이터 창이 대응하는 px 상자다.
  - cartesian은 domain이 축 범위(camera면 그 t의 창)다.
  - cells는 x [0, cols], y [0, rows]이고 row는 아래로 증가한다. cell (c, r)은 [c, c+1] × [r, r+1]을 덮는다.
  - graph는 [0,1]²이고 y는 위로 증가한다.
  - geo는 plot과 투영으로 정한다. `project(lon, lat)`는 `geoProject(panel, [lon, lat])`로 얻는다.
- `Item`:
  ```
  | { kind: "text"; id: string; mark: string; markId?: string; box: Box; lines: string[]; size: number; weight: 400 | 600; color: string; ref?: [number, number]; leader?: [number, number, number, number]; emphasis: "focus" | "dim" | "none" }
  | { kind: "shape"; mark: string; markId?: string; bbox: Box; d?: string; stroke?: string; fill?: string; opacity: number; dash: boolean; emphasis: "focus" | "dim" | "none" }
  ```
  - `mark`는 api 멤버 이름이다. split·multiples·compare의 panel 제목 글자는 `mark: "title"`이다.
  - 모든 item은 `panel: number`(panels 순번)를 가진다. text item 상자는 자기 panel의 box 안에 있다(leader 포함).
  - panel 제목은 글자 배치의 장애물이고, 다른 글자 상자는 제목 상자에서 4 px 이상 떨어진다.
  - text의 `ref`는 그 글자가 가리키는 px 점이다.
  - shape `bbox`는 잘린 뒤 보이는 범위다(frame plot, mock box, custom bounds와의 교집합). 완전히 잘린 shape는 item이 없다.
  - split `link`가 mark id이면 그 id를 그리는 panel(mark id는 두 하위 figure를 합쳐 유일하므로 한쪽)의 그 id item에 `link: true`가 붙는다(Item 공통 선택 필드 `link?: boolean`). 다른 item에는 붙지 않는다. link가 param 이름이면 layout item에는 표시가 없다.
  - emphasis dim: shape는 같은 tone 색에 불투명도를 낮춘다. text는 tone 색을 배경 쪽으로 섞어 대비를 낮추되 4.5:1 이상을 지킨다. 색상(hue)은 tone 색과 같다(HSL hue 차 ≤ 10°, 무채색 tone은 무채색). focus 상태보다 대비가 낮다. 다른 tone 색으로 바꾸지 않는다.
  - node 상자는 shape item이다.
- `LayoutError = { rule: "text-no-room" | "graph-too-large" | "unimplemented" | "unknown-region"; path: string; message: string }`
- `dataToPx(panel: Panel, p: P): [number, number]`: 선형은 plot 안 선형 대응, log는 log10 대응. aspect equal이면 x·y의 px/단위가 같고 plot은 box 안에서 가운데 정렬한다.
- `geoProject(panel: Panel, lonlat: P): [number, number]`

## frame·mark의 runtime 의미 결정 (M1, `lesson.d.ts` JSDoc에 영어 문장으로도 적음)
- **cells:** [col, row]에서 row 0이 위다. cell 글자는 칸 가운데에 두고, 칸에 들어가지 않으면 `text-no-room`. value가 있으면 runtime 순차 색으로 칠하고, 글자색은 배경과 대비 ≥ 4.5가 되게 고른다.
- **graph:**
  - layered는 ELK layered, tree는 ELK mrtree로 배치한다. direction down→DOWN, right→RIGHT, 기본 down.
  - 노드 상자 크기 = 글자 측정 + 고정 여백. 노드 글자 maxWidth는 상수다.
  - 한 장면에서 figure의 모든 시간 표본·단계에 나온 노드·간선의 합집합으로 한 번 배치한다. t·step에 따라 노드 위치가 바뀌지 않는다.
  - 배치 결과의 경계 상자를 plot에 맞춰 늘이거나 줄이지 않고, 가운데 정렬한다. px로 넘치면 간격을 줄이고, 그다음 노드 글자 줄바꿈 폭을 좁힌다. 그래도 넘치면 `graph-too-large`다.
  - `at`이 있는 노드는 [0,1]² 창 좌표의 그 자리에 놓는다. 그 노드에 붙은 간선은 직선으로 다시 그린다.
  - 간선 글자는 ELK가 준 위치를 첫 후보로 `placeTexts`에 넘긴다.
  - 다른 mark(label 등)의 좌표는 [0,1]² 창 좌표다. 창은 노드 경계 상자에 대응한다.
- **geo:**
  - projection equalEarth·mercator. orthographic은 `unimplemented`.
  - region은 `world`(기본), `europe`, `asia`, `east-asia`, `southeast-asia`, `south-asia`, `middle-east`, `africa`, `north-america`, `south-america`, `oceania`, `atlantic`, `indian-ocean`, `pacific`. 그 밖은 `unknown-region`.
  - 기본 지도는 Natural Earth 110m 육지(world-atlas `land-110m`)를 muted 면으로 자동으로 그린다.
  - line·path·arrow의 연속 점 사이는 대원 경로로 보간한다. 점 좌표는 [lon, lat]이다.
- **mock:** box는 내용 영역이다. 기기 틀(주소창·베젤·제목)은 box 바깥에 그리고, frame 안에 들어가지 않으면 `text-no-room`(title) 또는 그 mock id의 `text-no-room`이다. children은 부모 frame 데이터 좌표를 쓰고 box로 잘린다(글자 제외).
- **legend:** at이 없으면 plot 바깥(desktop은 오른쪽 위, mobile은 아래)에 둔다. figure 영역 안에 들어가지 않으면 `text-no-room`. legend 글자에는 leader를 긋지 않는다(가리키는 점이 없다). legend 자리는 plot 바깥 margin을 먼저 확보해서 정하고, avoid 선분 때문에 다른 곳으로 밀리지 않는다. at이 있으면 legend 상자는 at에 붙여 둔다(panel 안으로 당긴 경우 제외, 상자와 at의 거리 ≤ LEADER_PX). 다른 글자가 그 자리를 차지하면 가장 가까운 빈자리로 옮기되 leader는 없다.
- **axis:** 눈금 개수와 형식은 runtime이 정하고, 마지막 눈금 글자 또는 축 제목 옆에 단위를 붙인다. 눈금 글자도 `placeTexts`의 fixed 글자다. 겹치면 눈금을 솎아 낸다. figure 가장자리를 넘는 끝 눈금 글자는 안쪽으로 밀고, 그래도 안 되면 그 눈금을 뺀다. 눈금 글자와 축 제목으로는 `text-no-room`을 내지 않는다. 축 제목은 runtime이 자리를 정하는 글자이므로, 간격이 모자라면 축 제목을 옮기거나 다른 글자보다 먼저 자리를 잡는다.
- **MarkOpts reveal:** 그려진 비율은 px 호 길이 기준이다.
- **dim·brace:** 글자를 바깥 가운데에 둔다. **angle:** 호 바깥에 둔다. **edge:** 선 가운데에 둔다. **MarkOpts label:** mark 옆(dot·circle은 ref = 중심, line·area는 ref = 마지막 점, rect는 ref = 위 가운데)에 둔다.
- **edge:** `directed`가 없으면 화살촉 없는 선이다(기본 false).
- **글자 대비:** 그림 글자 대비 4.5:1은 그 글자 아래 실제로 깔린 면(geo 기본 지도 육지, cell 칠, area·rect 칠 등)을 합성한 배경에 대해 지킨다.
- **predict draw 채점:** x 범위에서 학습자 선과 정답 곡선의 평균 수직 거리(데이터 단위)가 tol 이하이면 정답이다. 평균은 x 범위 적분 평균이고, 200개 이상 등간격 구간의 사다리꼴 규칙으로 계산한다. 학습자 선이 x 범위 끝까지 닿지 않으면 가까운 끝 값을 쓴다.
- **math:** KaTeX(`trust: false`)로 그린다. 크기는 KaTeX가 잰 값을 쓰고, Node layout은 같은 KaTeX를 서버 측 렌더로 잰다.
- **code:** 고정폭 글꼴로 그린다. highlight 줄은 강조 배경을 둔다.
- **custom:**
  - 단위 좌표는 bounds 상자를 [0,1]²로 보고 y는 아래로 증가한다(SVG와 같음).
  - 허용 tag로 그린 도형은 다른 SVG 요소(path 등)로 바꿔 그려도 된다.
  - h가 허용하는 tag: `g, path, rect, circle, ellipse, line, polyline, polygon, text, tspan`.
  - 허용하는 attr: 모양·좌표·`fill, stroke, stroke-width, opacity, transform, d, points, x, y, x1, y1, x2, y2, cx, cy, r, rx, ry, width, height, text-anchor`.
  - 그 밖의 tag·`on*` attr·`href`는 그리지 않는다(무시).
  - 좌표는 bounds 상자를 [0,1]²로 본 단위다. bounds 밖은 잘린다.
- **unimplemented:** 범위 밖 frame·layout·projection·mark·옵션을 쓰면 layoutFigure와 check가 `unimplemented` 오류를 낸다. 대상: polar, lanes, space3d, graph force·sankey, geo orthographic, field, glyph, icon, inset, MarkOpts from. 브라우저 runtime은 그 figure 자리에 오류 패널을 그린다.

## check (`src/check/index.mjs`)
- `checkLesson(factory: LessonFactory, o?: { file?: string; viewports?: ("desktop" | "mobile")[]; samples?: number }): Promise<CheckReport>`
- `CheckReport = { ok: boolean; errors: CheckError[] }`
- `CheckError = { layer: "check" | "layout"; rule: RuleId; path: string; message: string; viewport?: "desktop" | "mobile" }`
- `RULES: RuleId[]`, 규칙 id와 조건은 다음과 같다.
  - `load-error`: factory 실행 실패, 또는 lesson 미반환.
  - `check-fail`: Report.checks의 실패 항목.
  - `model-pure`: deterministic false.
  - `figure-eval`: figureErrors.
  - `focus-unknown-id`: focusErrors.
  - `binding`: bindingErrors(M0 stub의 handle-binding·multiples-param·knob 키·split link·reveal.figure·summary 묶음).
  - `data-in-domain`:
    - 점을 가진 mark(line·area·dot·circle 중심·rect·arc 중심·arrow·path 모든 좌표·label·dim·brace·angle·math·code·mock box·flow·node at·cell)의 좌표가 그 panel domain 밖에 있다.
    - 표본: 장면 params와, explore knob마다 양끝(나머지 knob은 시작값). predict·quiz reveal params와 Option params, compare a·b 포함.
    - 시간 표본은 stub과 같다. camera가 있으면 그 t의 창이 기준이다.
  - `goal-reachable`:
    - explore goal.done이 knob 탐색에서 한 번도 true가 아니다.
    - 탐색: 숫자 knob은 [min, max]를 9등분 점(step이 있으면 그 격자 위 가장 가까운 값), 목록 knob은 모든 값, boolean은 둘 다.
    - 곱이 4,096을 넘으면 모든 꼭짓점 + rng(1) 무작위 4,096점.
  - `goal-at-start`: goal.done이 장면 시작 params에서 이미 true다.
  - `reveal-marks-exist`: predict·quiz reveal.marks의 id가 그 장면·문항 figure의 어느 표본에서도 그려지지 않는다.
  - `input-binding`: drag input의 mark, draw input의 answer가 그 predict figure의 mark id가 아니다.
  - `term-defined-before-use`: define term이 그 define 장면보다 앞선 장면 글(title·say·ask·선택지 text·feedback·reveal.say·quiz prompt)에 나온다. 대소문자는 그대로 비교하고, 부분 문자열로 찾는다.
  - `accent-focus-only`: tone focus mark가 보이는 장면(단계)의 focus 목록에 그 id가 없다. 또는 focus 목록이 없는 곳(quiz 문항 figure, summary, reveal.figure)에 tone focus mark가 있다.
  - `unimplemented`, `unknown-region`, `text-no-room`, `graph-too-large`: layer `layout`. 장면마다 그 figure를 장면 params·시간 표본·viewport 2개로 layoutFigure해서 얻는다. `graph-too-large`가 난 figure·viewport에서는 그 graph의 node·edge 글자로 인한 `text-no-room`을 내지 않는다(layoutFigure errors에도 넣지 않는다).
  - 같은 (rule, path, viewport)는 한 번만 보고한다.
- `path`는 lesson input 안의 JS 경로다. 아래 `<scene>`은 `sections[s].scenes[c]`, `<item>`은 `quiz[i]` 또는 `<scene>.items[i]`, `<mark>`는 `figures.<key>#<markId>`(id 없으면 `#<그 표본에서 평탄화한 mark 순번>`)다. 규칙별 경로:
  - `load-error`: `lesson`
  - `check-fail`: `checks[i]`
  - `model-pure`: `models.<name>`
  - `figure-eval`: `figures.<key>@t=<t>,step=<n>` (이 규칙만 `@t`를 붙인다)
  - `focus-unknown-id`: `<scene>.focus[k]`, steps는 `<scene>.steps[j].focus[k]`
  - `binding`: 문제 필드. `<scene>.handles[k].mark|x|y`, `<scene>.knobs.<name>`, `figures.<key>.over.<name>`, `figures.<key>.link`, `<scene>.reveal.figure`, `<item>.reveal.figure`, `summary.figures[i]`
  - `data-in-domain`: `<mark>`
  - `goal-reachable`, `goal-at-start`: `<scene>.goal`
  - `reveal-marks-exist`: `<scene>.reveal.marks[k]`, `<item>.reveal.marks[k]`
  - `input-binding`: `<scene>.input.mark`, `<scene>.input.answer`
  - `term-defined-before-use`: 용어가 나온 앞 장면의 필드. `<scene>.title|say|ask|reveal.say`, `<scene>.input.options[k].text|feedback`, `<item>.prompt`, `<item>.options[k].text|feedback`
  - `accent-focus-only`: 그 mark가 focus 없이 보인 곳. `<scene>`(steps는 `<scene>.steps[j]`), `<item>`, `<scene>.reveal.figure`, `<item>.reveal.figure`, `summary.figures[i]`. message에 mark id를 넣는다
  - `unimplemented`, `unknown-region`: frame이면 `figures.<key>`, mark·옵션이면 `<mark>`
  - `text-no-room`, `graph-too-large`: `<mark>`, graph 전체면 `figures.<key>`
  - 시간 표본·params 정보는 path가 아니라 message에 넣는다. 그래서 같은 위반이 여러 표본에서 나도 dedupe 뒤 1개다.
- `message`는 300자 이하다. 무엇이 기대와 어떻게 다른지(기대값·실제값)를 담는다.

## CLI `ltt`
- `ltt check <lesson.js> [--json]`
  - lesson 파일을 루트 tsconfig 설정(`checkJs`, `"ltt"` paths)으로 tsc 검사한다. tsc 오류는 `layer: "type"`, `rule: "TS<code>"`, `path: "<line>:<col>"`이다.
  - tsc 오류가 없을 때만 checkLesson을 돌린다.
  - 출력: 사람용은 오류마다 한 줄 `<file> <path> [<rule>] <message>`, 마지막 줄 `ok` 또는 `<n> errors`. `--json`은 `{ ok, errors }`(type 오류 포함).
  - 종료 코드 0(오류 없음) / 1(오류 있음) / 2(파일 없음·사용법 오류).
- `ltt html <lesson.js> --out <dir>`
  - `<dir>/index.html`, `<dir>/lesson.js`(사본), `<dir>/ltt/`(runtime 번들·글꼴·지연 chunk·지도 데이터)를 쓴다.
  - index.html은 HTTP로 열면 수업을 그린다.
  - 종료 코드 0 / 1(빌드 산출물 없음) / 2.
- `ltt serve <dir> [--port n]`: 정적 서버를 띄우고 URL을 출력한다.
- `ltt sheet <lesson.js> --out <dir>`
  - html을 임시로 만들고 headless Chrome으로 장면마다 상태 2개를 찍는다.
    - initial: t = 시간 영역 시작, step 0, 입력 전.
    - settled: loop은 span의 60% 지점, steps는 마지막 단계, idle은 0.5, predict·quiz는 정답을 확정한 뒤.
  - 장면 6개 × 상태 2개를 한 PNG로 묶어 `desktop-<n>.png`, `mobile-<n>.png`를 쓴다.
  - `sheet.json = { scenes: { index: number; path: string; type: string }[]; runtimeErrors: { scene: number; message: string }[]; layoutViolations: { scene: number; state: "initial" | "settled"; viewport: string; kind: "text-overlap" | "text-clipped" | "text-small" | "low-contrast"; ids: string[] }[] }`
  - layoutViolations는 브라우저 DOM에서 실제로 잰 값이다. stage 글자와 card 글자를 모두 잰다. card 글자는 card 스크롤 영역 안에 보이는 글자만 재고, 다른 요소가 그 글자를 덮으면 `text-clipped`다.
  - 데스크톱 PNG는 장면마다 한 줄(initial | settled)이고 줄 높이는 모든 PNG에서 같다. 장면 하나는 PNG에 한 번만 나온다(summary 포함). 모바일 PNG는 장면마다 한 열이다.
  - 종료 코드 0 / 1(runtimeErrors 또는 layoutViolations 있음) / 2(Chrome 없음·불러오기 실패·사용법 오류).
- `ltt digest <lesson.js>`
  - stdout에 markdown을 쓴다. 두 부분이다.
    - `## 문항`: 정답 표시 없이. 모든 predict ask·선택지, 절 quiz와 최종 quiz 문항(prompt·선택지·numeric 단위·order 항목·classify bin과 항목), 그 장면 params에서 평가한 Text, 문항 figure가 쓰는 model 출력 수치.
    - `## 정답 키`: predict 정답·reveal.say, 문항 정답·feedback·reveal.say, numeric answer(check 이름이면 그 값).
  - 종료 코드 0 / 1(불러오기 실패) / 2.
- 실행 기록:
  - `check`, `html`, `sheet`, `digest`는 실행마다 `<lesson 파일 디렉터리>/.ltt/log.jsonl`에 한 줄을 덧붙인다.
  - 형식: `{ ts: ISO 문자열, cmd, file, ms, exit, counts }`.
  - counts: check는 `{ type, check, layout }` 오류 수, sheet는 `{ runtimeErrors, layoutViolations, images }`.

## 브라우저 runtime
- 번들 진입점 `dist/ltt-runtime.js`: `export function mount(el: HTMLElement, factory: LessonFactory, o?: { start?: number }): void`
- index.html은 이 함수를 불러 `lesson.js` default export를 mount한다.
- predict·quiz의 reveal.figure는 확정·제출 뒤 장면 figure 옆에 stage를 반씩 나눠 보인다.
- summary는 스크롤 없이 stage 안에 있다. 데스크톱은 summary.figures를 격자에 모두 넣고 각 figure를 격자 칸 크기 box로 layout한다. 모바일은 한 쪽에 figure 하나를 stage 전체 크기로 보이고, card의 `[data-ltt-summary-page="<i>"]` 버튼으로 쪽을 바꾼다. check는 같은 box로 layout한다.
- 장면 순서: sections[].scenes[]를 차례로 놓고, 그 뒤에 최종 quiz(장면 1개, 문항 여럿), 그 뒤에 summary. 전역 장면 번호는 0부터 센다.
- DOM 계약(시험 표면):
  - `[data-ltt-scene="<n>"][data-ltt-type="<type>"]`: 현재 장면 루트.
  - `[data-ltt-stage]`, `[data-ltt-card]`
  - `[data-ltt-mark="<markId>"]`: id가 있는 mark의 SVG 그룹. `data-ltt-emphasis="focus|dim|none"`, `data-ltt-tone="<tone>"`(tone이 없으면 속성 없음), `data-ltt-kind="<api 멤버 이름>"`. 선 대비를 위해 획 아래 그리는 보조 획(흰 테두리 등)은 `data-ltt-casing` 속성을 가진다. 선 대비 측정에서 보조 획은 잴 대상이 아니라 배경 층이다.
  - `[data-ltt-text]`: 그림 안 글자 요소. `data-ltt-text-id`가 placeTexts id다.
  - predict:
    - `[data-ltt-option="<k>"]`, `[data-ltt-commit]`, `[data-ltt-reveal]`(공개 글, 확정 전에는 DOM에 없음. 확정 뒤 `data-ltt-correct="true|false"`로 학습자 답의 정오를 표시)
    - drag 대상 `[data-ltt-drag]`, draw 영역 `[data-ltt-draw]`
  - quiz:
    - `[data-ltt-item="<k>"]`, 그 안의 `[data-ltt-option="<k>"]`, `input[data-ltt-numeric]`
    - order `[data-ltt-order-item="<k>"]`(키보드 위·아래), classify `[data-ltt-classify-item="<k>"]`와 `[data-ltt-bin="<name>"]`
    - `[data-ltt-submit]`, `[data-ltt-feedback][data-ltt-correct="true|false"]`
  - explore:
    - `[data-ltt-knob="<name>"]`(range input, select, checkbox), `[data-ltt-handle="<markId>"]`
    - `[data-ltt-goal][data-ltt-done="true|false"]`
  - steps·loop 제어: `[data-ltt-play]`, `[data-ltt-rewind]`, `[data-ltt-step-next]`. warp의 느린 구간을 재생하는 동안 `[data-ltt-slow]`가 보이고, 그 밖에는 DOM에 없다
  - order 문항의 처음 표시 순서는 문항마다 새 `rng(1)`(mulberry32)로 한 Fisher–Yates 셔플이다: i = n−1부터 1까지 `j = floor(r() × (i+1))`, i와 j를 바꾼다. 셔플 결과가 정답 순서와 같으면 한 칸 회전한다(항목 2개 이상). digest 문항 부분도 같은 순서를 쓴다
  - classify 키보드: 항목에 focus 후 Enter로 집고, bin에 focus 후 Enter로 놓는다. 집은 항목은 `data-ltt-picked="true"`
  - draw 키보드 대안: `input[data-ltt-draw-y0]`, `input[data-ltt-draw-y1]`(x 범위 양끝의 y 값)과 `[data-ltt-draw-line]` 버튼이 두 점을 잇는 직선을 답으로 만든다
  - 이동: `[data-ltt-next]`, `[data-ltt-prev]`, `[data-ltt-progress]`
  - glossary 팝오버:
    - 장면 글 안 glossary 용어는 `[data-ltt-term="<term>"]` 버튼이고, 열면 `[data-ltt-glossary]`.
    - 첫 등장은 define 장면부터다. 그 앞 장면에는 term 버튼이 없다.
  - 오류 패널: `[data-ltt-error]`
- 시험 hook `window.__ltt`:
  - `goto(n: number): Promise<void>`
  - `freeze(t: number, step?: number): void`: 시계를 멈추고 그 시각으로 그린다.
  - `state(): { scene: number; t: number; step: number; params: Params; committed: boolean }`
  - `layout(): FigureLayout[]`: 현재 장면의 layout 결과. Node layoutFigure와 같은 형식이다.
  - `answer(correct: boolean): Promise<void>`: 현재 predict·quiz의 첫 문항에 정답 또는 첫 오답을 넣고 확정한다.
  - `ready(): Promise<void>`: 글꼴·지연 chunk·layout과 진행 중인 전환 애니메이션이 끝나면 resolve.
  - `goto`·`answer`도 그 결과 화면의 전환 애니메이션(card·reveal 등장 포함)이 끝난 뒤 resolve한다. resolve 시점의 화면은 정착 상태다(sheet 촬영과 시험 관찰의 기준).
- params 우선순위는 Signatures(M0)를 따른다. split 두 하위 figure는 같은 params를 받는다.
- 장면 전환은 Motion으로 한다: card 글은 이동하며 나타나고, stage figure는 교차 페이드.
- `prefers-reduced-motion: reduce`이면 loop·idle·flow 입자를 멈추고 trace는 잔상을 그린 끝 상태로 보인다. 장면 전환은 즉시 바뀐다.
- 키보드:
  - ←·→ 장면 이동(입력 요소에 focus가 있을 때는 제외).
  - Space 재생·멈춤.
  - 모든 버튼·선택지·knob은 Tab으로 닿고 Enter·Space로 조작된다.
  - drag 입력은 focus 뒤 방향키로 움직인다(축 범위 1/100 단위).
  - draw 입력은 키보드 대안으로 "직선 근사" 두 점 입력을 둔다.

## digest (`src/cli/digest.mjs`)
- `digest(factory: LessonFactory): string`: CLI가 출력하는 markdown과 같다.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `src/core`가 M0 stub의 모든 export와 동작을 가진다. `dev/spec-stub.mjs`는 그것을 다시 export하고 CLI 동작이 같다. M0 시험 249개가 그대로 통과한다 | must | 회귀 |
| FR-2 | `measureText`·`wrapText`가 번들 글꼴 글자 폭 표로 결정적인 크기를 낸다. 한글·영문·숫자·문장부호·공백을 다룬다 | must | ADR(글자 배치 runtime 소유), QR-5 |
| FR-3 | `placeTexts`가 Signatures "글자 배치"의 보장을 지킨다: 영역 안, 겹침 없음, 결정성, fixed, leader, 자리 없음 → text-no-room, 크기 불변 | must | UI-1, ADR |
| FR-4 | cartesian panel: 선형·log 대응, aspect equal, camera 창 | must | 계약 |
| FR-5 | cells panel: 칸 좌표, row 아래로, value 색과 글자 대비 | must | 계약, Signatures 의미 결정 |
| FR-6 | graph panel: layered·tree 배치, direction, 장면 단위 합집합 배치, 가운데 정렬, 넘침 처리와 graph-too-large, at 고정, 간선 글자 배치 | must | 사용자 질문(graph 구현), Signatures |
| FR-7 | geo panel: equalEarth·mercator, region 목록, 기본 지도, 대원 보간, unknown-region | must | Q2 사용자 수용 |
| FR-8 | 구현 mark 21종이 item을 낸다. 글자를 지닌 mark는 Signatures 위치 규칙대로 글자를 둔다: axis 눈금 솎기·단위, legend 바깥 기본, dim·brace·angle·edge·MarkOpts label | must | 계약 |
| FR-9 | trace(잔상·head·dims), flow(n·rate·seed 결정 위치), sweep, MarkOpts reveal(호 길이 비율) | must | 계약 |
| FR-10 | split(두 panel, 같은 params, link 강조), multiples(over 값마다 panel, 같은 domain), compare(a·b 두 panel, labels) | must | 계약 |
| FR-11 | custom: tag·attr 허용 목록, bounds 단위, bounds 밖 잘림 | must | rules custom-bounds(M1) |
| FR-12 | unimplemented 목록의 사용은 layout·check 오류이고, 브라우저는 그 figure 자리에 오류 패널을 그린다 | must | handoff |
| FR-13 | focus 강조: focus 목록 mark는 emphasis focus, 나머지는 dim, 목록 없음은 none. tone 색은 바뀌지 않는다 | must | 계약 v6 |
| FR-14 | checkLesson이 RULES의 조건마다 오류를 정확한 path·rule로 내고, 위반이 없으면 오류를 내지 않는다. 같은 오류는 한 번만 낸다 | must | handoff(의미 검사 M1) |
| FR-15 | `ltt check`: tsc 층, 출력 형식, --json, 종료 코드, tsc 오류 시 checkLesson 생략 | must | UI-2 |
| FR-16 | `ltt html`·`ltt serve`: 산출 디렉터리 구조와 HTTP 열람 | must | 생성 흐름 |
| FR-17 | `ltt sheet`: 상태 2개 × viewport 2개, 6장면 묶음 PNG, sheet.json, DOM 실측 위반, 종료 코드 | must | 생성 흐름 5단계 |
| FR-18 | `ltt digest`: 문항·정답 키 두 부분, Text 평가, check 이름 answer 해소 | must | 핵심 결정 3(정답 검산) |
| FR-19 | 실행 기록 `.ltt/log.jsonl` | must | UI-4 |
| FR-20 | UI shell: desktop stage 왼쪽·card 오른쪽, mobile stage 위·card 아래, 진행 표시, 이전·다음, 키보드 이동, 가로 스크롤 없음, card 글이 잘리지 않음(넘치면 card 안 스크롤). card 글은 이동 버튼 등 다른 UI에 가려지지 않는다(스크롤 영역은 nav 위에서 끝난다). predict 확정·quiz 제출 뒤에는 reveal·feedback이 보이도록 card를 스크롤한다 | must | plan UI |
| FR-21 | hook·explain: 그림 + 제목·본문. define: 용어·정의·작은 그림, 이후 glossary 팝오버 | must | 장면 타입 표 |
| FR-22 | steps: 자동 반복(단계마다 고정 간격), 멈춤·되감기·다음 단계, 단계별 focus | must | 장면 타입 표 |
| FR-23 | explore: knob(slider·log slider·select·toggle), handles(끌면 param, 범위 제한), goal 달성 표시 | must | 장면 타입 표 |
| FR-24 | compare: 같은 scale 두 panel, labels | must | 장면 타입 표 |
| FR-25 | predict: choice·drag·draw 입력. 확정 전에는 reveal.marks를 그리지 않고 Option params를 적용하지 않는다. 확정 뒤 reveal.say·marks·figure·params를 보이고, drag·draw 답은 mark id "guess" 유령선으로 남긴다. 오답 확정 시 그 선택지 feedback을 보인다 | must | rules predict-reveal-hidden(M1), 계약 |
| FR-26 | 선택지·문항 글 안의 glossary 용어 버튼은 앞뒤 글과 같은 줄 흐름(inline)으로 놓인다. quiz: choice·numeric(tol, 단위)·order·classify 채점, 즉시 피드백(오답별 feedback), reveal은 제출 뒤에만 보인다 | must | 장면 타입 표 |
| FR-27 | summary: summary.figures를 격자로 보이고 say를 둔다(정적) | must | 범위 축소(전환은 M2) |
| FR-28 | 시간: loop(ms·span·once·warp, 느린 구간 표시), steps, idle, static. 재생·멈춤·되감기. reduced motion 동작 | must | plan 시간 |
| FR-29 | 잘못된 spec(load-error, figure 평가 예외)은 빈 화면이 아니라 오류 패널이다. runtime 예외는 콘솔 오류로 남아 sheet가 잡는다 | must | v1 깨진 페이지 결함 |
| FR-30 | 시험 hook `window.__ltt`와 DOM data 속성 계약 | must | 검증 표면 |
| FR-31 | 브라우저 layout(`__ltt.layout()`)은 같은 입력의 Node layoutFigure와 같은 결과를 낸다(글자 상자 1 px 이내) | must | 핵심 결정 3(Node 결정적 검사) |
| FR-40 | `lesson.d.ts` JSDoc에 Signatures "runtime 의미 결정"의 cells row 방향, graph at 창과 배치 고정, geo region·대원, mock box·children 좌표를 영어로 짧게 적는다. `ext/geo.d.ts`의 region JSDoc은 region 이름 14개를 나열한다. 타입은 바꾸지 않는다 | must | 계약 공백 |
| FR-41 | rules.md: `reveal-marks-exist` 행(층 check, 고의 결함 예시 포함)을 새로 더한다. predict-reveal-hidden·custom-bounds 상태를 "강제됨(runtime, M1)"으로, 당긴 7개 규칙과 stub 규칙 6개(focus-unknown-id, model-pure, figure-eval, handle-binding, multiples-param, reveal-figure-exists)를 "강제됨(ltt check, M1)"으로 고친다. label-anchor는 "SKILL 규칙 + runtime 배치(감지 불가)"로 적는다 | must | handoff |
| FR-60 | SKILL 초안이 다음을 담는다. (1) 읽는 순서: SKILL → lesson.d.ts → 예시 1개 (2) 절 목록·핵심 그림을 알리고 기다리지 않음 (3) checks부터 한 번에 Write (4) `ltt check` 예산 3회 (5) `ltt sheet` 1회, 렌더 뒤 수정 1회 (명령은 처음에 `ltt` = 실행 경로를 한 번 정의하고 이후 `ltt check`·`ltt sheet`·`ltt digest`로 부른다) (6) runtime 결함 규칙: runtime 소스를 읽거나 고치거나 우회하지 않고 `runtime-issues.md`에 장면·상태·증상을 적음 (7) M1에서 쓸 수 있는 frame·mark 목록과 미구현 목록 (8) graph는 at 없이 layout에 맡기고, at은 [0,1]² 좌표 (9) 정답 검산: `ltt digest` 출력만 주는 서브에이전트 1회, 고친 뒤 check만 다시 돌리고 재검산 없음 (10) 예산을 다 쓰면 남은 항목을 적고 넘김 (11) illustrative 값 표시 규칙. 12,000 B 이하 | must | UI-3, handoff |
| FR-61 | `verify-answers.md`: 검산 서브에이전트 지시. digest의 문항 부분만 보고 먼저 풀고, 그다음 정답 키와 대조. 판정은 일치·불일치·판정 불가 셋. 판정 불가는 이유 한 줄, 다시 묻지 않음. 출력 형식은 표 | must | 핵심 결정 3, 전략(검증 반복 차단) |

# Errors
- lesson 파일 없음 → `ltt check|html|sheet|digest`: stderr 한 줄, 종료 2. 산출물·기록 없음.
- factory 실행 예외 또는 lesson 미반환:
  - check: `load-error` 오류 1개, 종료 1.
  - html: 산출(실행 시점 오류는 브라우저 오류 패널).
  - digest: 종료 1, stderr.
  - 브라우저: `[data-ltt-error]` 패널, 콘솔 오류.
- tsc 오류 → check는 type 오류만 보고(checkLesson 실행 안 함), 종료 1.
- 범위 밖 기능 → `unimplemented` layout 오류(경로 = 그 mark·frame 위치). 브라우저는 그 figure 자리에 오류 패널을 그리고 나머지 장면은 정상이다.
- 글자 자리 없음 → `text-no-room`(placeTexts errors, check layout 오류). 브라우저는 그 글자를 그리지 않고 콘솔 경고를 낸다. sheet layoutViolations에는 넣지 않는다(check가 이미 보고함).
- graph 넘침 → `graph-too-large`. 브라우저는 축소 없이 그리고 콘솔 경고를 낸다.
- 알 수 없는 region → `unknown-region`. 브라우저는 world로 그린다.
- Chrome 없음 → sheet 종료 2, stderr에 `LTT_CHROME` 안내.
- dist 없음 → html·sheet 종료 1, stderr에 `npm run build:runtime` 안내.
- 브라우저 runtime 예외(렌더 중) → 콘솔 오류, 그 장면 `[data-ltt-error]`. sheet runtimeErrors에 들어가고 종료 1.
- custom이 허용 목록 밖 tag·attr 사용 → 그 노드·attr를 무시한다(오류 아님). 나머지는 그린다.
- 숫자 입력이 숫자가 아님 → 제출 버튼 비활성, 채점 안 함.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | M0 Test command 시험 전체 | 통과(249) |
| C-2 | normal | `measureText("가나다", {size:14})` 두 번, Node | 같은 값, width > 0, height = 14×1.3 |
| C-3 | boundary | `wrapText`에 maxWidth보다 긴 공백 없는 토큰 | 글자 단위로 나뉜 줄, 각 줄 폭 ≤ maxWidth |
| C-4 | normal | placeTexts: 같은 ref 5개 글자, 넓은 box | 5개 placed, 겹침 0, 영역 안, 2개 이상 leader |
| C-5 | boundary | placeTexts: ref가 box 가장자리(0,0)·(W,H) | 상자가 box 안(잘림 없음) |
| C-6 | error | placeTexts: box보다 넓은 한 줄 글자(maxWidth 없음) | errors에 그 id, rule text-no-room, placed에 없음 |
| C-7 | edge | placeTexts: fixed 두 개가 겹침 | errors에 보고 |
| C-8 | normal | cartesian x [0,10], y [0,5], dot [5,2.5] | dot bbox 중심 = plot 중심 ±0.5 px |
| C-9 | boundary | cartesian log "x" [1, 1000], dot [10, ·] | x px = plot.x + plot.width/3 ±0.5 |
| C-10 | normal | cartesian aspect equal x [0,100] y [0,20] | x·y px/단위 같음 |
| C-11 | normal | cells cols 4 rows 3, cell(0,0) value 1, text "A" | 칸이 plot 좌상단, 글자색 대비 ≥ 4.5 |
| C-12 | normal | graph layered 노드 6·간선 6·층 4 이하, desktop·mobile | 노드 상자 겹침 0, 간선 글자 겹침 0, 모두 영역 안 |
| C-13 | edge | graph: t에 따라 노드 수가 3→6으로 느는 loop figure | 노드 위치가 표본 사이에 같다 |
| C-14 | error | graph: 긴 글자 노드 60개, mobile | graph-too-large 오류 |
| C-15 | boundary | graph: node at [0,0]·[1,1] | 노드 중심이 노드 경계 상자의 모서리(창 대응) |
| C-16 | normal | geo equalEarth world, dot [126.98, 37.57] | geoProject 값과 같은 px; d3-geo 독립 계산과 ±0.5 px |
| C-17 | error | geo region "mars" | unknown-region |
| C-18 | normal | axis x [0,170,"m"] | 눈금 글자 겹침 0, 단위 "m"이 글자에 있음 |
| C-19 | normal | legend at 없음 | 글자 상자가 plot 밖 |
| C-20 | normal | dim [0,0]→[10,0] "10 m" | 글자 상자가 치수선과 겹치지 않고 가운데(x 중심 ±2 px) |
| C-21 | normal | mock browser box, children label·rect | 틀이 box 바깥, children 잘림, children 글자 겹침 0 |
| C-22 | normal | flow n 5 seed 1 t 0.3 두 번 | 입자 위치 같음 |
| C-23 | normal | split 두 figure, link "v0" | panel 2개, 두 쪽 같은 params |
| C-24 | normal | multiples over {vt:[10,20,40]} | panel 3개, domain 같음 |
| C-25 | error | custom h("script")·onclick attr | 그 노드·attr 출력 없음, 나머지 그림 |
| C-26 | error | 각 unimplemented 대상(polar, lanes, space3d, force, sankey, orthographic, field, glyph, icon, inset, from) | 각각 unimplemented 오류, 경로가 그 위치 |
| C-27 | normal | focus ["a"], mark a·b | a emphasis focus, b dim; focus null이면 none |
| C-28 | normal | 예시 수업 checkLesson | ok, 오류 0 |
| C-29 | error | 규칙마다 위반 fixture(load-error, check-fail, model-pure, figure-eval, focus-unknown-id, binding, data-in-domain, goal-reachable, goal-at-start, reveal-marks-exist, input-binding, term-defined-before-use, accent-focus-only, text-no-room, graph-too-large, unknown-region, unimplemented) | 그 rule 오류, path가 위반 위치, 다른 rule 오류 없음 |
| C-30 | boundary | data-in-domain: 좌표 = 축 끝값 / 끝값+1e-6 | 오류 없음 / 오류 |
| C-31 | boundary | goal-reachable: knob 끝값에서만 달성 | 오류 없음 |
| C-32 | edge | 같은 위반이 시간 표본 6개에서 반복 | 오류 1개 |
| C-33 | normal | `ltt check` 정상 파일 / 위반 파일 / tsc 오류 파일 / 없는 파일 | 0·"ok" / 1·한 줄씩 / 1·type 오류만 / 2 |
| C-34 | normal | `ltt check --json` | `{ok, errors}` JSON, type 오류 포함 |
| C-35 | normal | `ltt html` 예시 → serve → Chrome | 장면 0 렌더, `[data-ltt-error]` 없음, 콘솔 오류 0 |
| C-36 | normal | `ltt sheet` 예시 | 종료 0, desktop·mobile PNG ⌈장면 수/6⌉개씩, sheet.json 장면 수 = 전역 장면 수 |
| C-37 | error | sheet: 렌더 중 예외를 던지는 custom fixture | 종료 1, runtimeErrors에 그 장면 |
| C-38 | error | sheet: LTT_CHROME이 없는 경로이고 기본 경로도 없음(LTT_CHROME_DEFAULT_OFF 시험 환경 변수로 기본 경로 무시) | 종료 2 |
| C-39 | normal | `ltt digest` 예시 | "## 문항"에 정답 표시(correct, 정답 값) 없음, "## 정답 키"에 모든 predict·문항 정답 |
| C-40 | normal | check 2회 실행 | log.jsonl 2줄, cmd·exit·counts |
| C-41 | normal | predict choice: 확정 전 | reveal.marks id의 `[data-ltt-mark]` 없음, `[data-ltt-reveal]` 없음, 선택지를 골라도 figure params 불변 |
| C-42 | normal | predict choice: 오답 확정 | 그 feedback, reveal.say, reveal.marks 보임, Option params 적용 |
| C-43 | normal | predict drag 확정 | "guess" mark 남음 |
| C-44 | normal | quiz numeric: 정답±tol 경계 안/밖 | correct true/false |
| C-45 | normal | quiz order·classify 키보드 조작 후 제출 | 채점·feedback |
| C-46 | normal | explore knob 변경 | params 반영, goal done 표시 변화 |
| C-47 | normal | explore handle을 범위 밖으로 끌기 | param이 범위 끝값으로 제한 |
| C-48 | normal | steps 자동 진행, 멈춤, 다음 | step 값과 단계 focus |
| C-49 | normal | reduced motion 에뮬레이션 | `freeze` 없이 1초 간격 두 번 state().t 같음 |
| C-50 | normal | 키보드만으로 첫 장면 → 끝 장면 | 도달, 각 predict·quiz 확정 가능 |
| C-51 | normal | 모든 fixture 장면 × desktop·mobile | 글자 겹침 0, 잘림 0, 글자 ≥ 12 px, 글자 대비 ≥ 4.5, 가로 스크롤 0 |
| C-52 | normal | 같은 장면 Node layoutFigure vs `__ltt.layout()` | 글자 상자 차이 ≤ 1 px |
| C-53 | error | 브라우저에서 load-error lesson | `[data-ltt-error]` 보임 |
| C-54 | error | 글자 `<img src=x onerror=...>` | 글자 그대로 보임, img 요소 없음 |
| C-55 | normal | glossary: define 앞 장면 / 뒤 장면 | term 버튼 없음 / 있음, 열면 정의 |
| C-56 | normal | mobile 터치 대상 | 버튼·선택지·knob 높이·폭 ≥ 44 px(본문 안 glossary 용어 버튼은 제외) |
| C-57 | normal | SKILL.md | FR-60 11항목, ≤ 12,000 B |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | runtime·check·CLI가 계약대로 동작해야 생성 실험이 의미 있다 |
| Performance efficiency | yes | check·sheet 시간이 생성 비용에 더해진다. 애니메이션 프레임과 번들 크기, SKILL 읽기 비용 |
| Compatibility | yes | Node layout과 브라우저 렌더가 같아야 check가 렌더 결과를 대신한다. Chrome만 범위 |
| Interaction capability | yes | 학습자 UI(글자·대비·키보드·reduced motion·터치)와 생성 agent가 쓰는 오류 메시지 |
| Reliability | yes | 잘못된 spec이 빈 화면·조용한 통과가 되면 v1 결함이 반복된다 |
| Security | yes | 수업 HTML을 Artifact로 공유한다. 글자·custom을 통한 스크립트 주입을 막는다 |
| Maintainability | yes | layout을 DOM과 분리해 시험 가능하게 두고, 커버리지 임계값을 지킨다 |
| Flexibility | yes | 데스크톱·모바일 두 viewport에 적응 |
| Safety | no | 물리적·인적 위해 경로 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Functional suitability / completeness | 구현 frame 4·mark 21·motion·composition 6·장면 타입 8+summary·predict 입력 3·quiz kind 4 | fixture 수업이 두 viewport에서 렌더한 항목 수 ÷ 항목 수 | = 100% | automated(e2e), review(R1) | UI-1 |
| QR-2 | Functional suitability / correctness | 데이터→px | cartesian·cells·graph at·geo 점의 px 오차(px). geo는 d3-geo 독립 계산 | ≤ 0.5 px | automated, mutation | 계약 |
| QR-3 | Performance efficiency / time behaviour | `ltt check` 예시 수업, `ltt sheet` 예시 수업, 이 Mac | 벽시계 초 | check ≤ 15 s, sheet ≤ 120 s | automated(시험이 시간 측정) | 목표 수치(생성 12분) |
| QR-4 | Performance efficiency / time behaviour | loop 재생, 예시 hook 장면, desktop Chrome, 3 s | requestAnimationFrame 간격 p95(ms) | ≤ 20 ms | automated(e2e) | plan(idle 움직임) |
| QR-5 | Performance efficiency / resource utilization | 첫 로드 번들(지연 chunk 제외), SKILL.md | 축소 번들 바이트, SKILL 바이트 | ≤ 400,000 B, ≤ 12,000 B | automated | 생성 비용 |
| QR-6 | Compatibility / interoperability | Node layout vs 브라우저 DOM | 같은 장면·viewport·t의 글자 상자 좌표 차(px) | ≤ 1 px | automated(e2e) | 핵심 결정 3 |
| QR-7 | Interaction capability / accessibility | 모든 fixture·예시 장면 × 2 viewport × 2 상태. 비활성(disabled) 조작 요소의 글자는 대비 기준에서 제외(WCAG 1.4.3 예외). 선 대비 3:1은 emphasis가 dim이 아닌 mark 중 tone이 focus·series1–6·good·warn·bad인 선형 mark(line·arrow·path·trace·edge, fill none인 circle·rect·arc)의 획과 fill solid dot에 대해, 그 아래 실제 배경을 합성해 잰다(dim은 낮춘 대비가 목적이라 제외). 요소 하나에 칠과 획이 둘 다 있으면(예: 흰 테두리를 두른 trace head) 투명하지 않은 쪽 중 대비가 큰 값을 그 요소의 대비로 본다. 측정 점에서 다른 요소에 완전히 가려진 요소는 잴 대상이 아니다. 배경 층은 페이지·패널·geo 기본 지도·cell·area·rect 칠·casing이고, 다른 선형 mark(dot·line·arrow·path·trace·edge)의 칠·획은 배경으로 합성하지 않는다(겹친 데이터 표시끼리의 대비는 이 기준의 대상이 아니다) | 글자 px, 글자 대비(dim 포함), focus·series·의미 tone 선 대비, 모바일 터치 대상 px | ≥ 12 px(figure)·≥ 16 px(card), ≥ 4.5:1, ≥ 3:1, ≥ 44 px | automated(e2e), review(R1) | plan UI(runtime 상수) |
| QR-8 | Interaction capability / operability | 키보드, reduced motion | 키보드만으로 끝까지 도달, 모든 입력 조작 가능; reduced motion에서 시간 정지 | 100%, 충족 | automated(e2e) | plan 움직임 |
| QR-9 | Interaction capability / user error protection | 생성 agent가 받는 check 오류 | 오류마다 RULES의 rule, 위반 위치를 가리키는 path, 300자 이하 message | 100% | automated, mutation | UI-2 |
| QR-10 | Reliability / faultlessness | 잘못된 입력의 CLI·브라우저 | Errors 조건마다 신호·사후 상태 일치 | 100% | automated, mutation | v1 깨진 페이지 |
| QR-11 | Security / integrity | 글자, custom, math | 주입 시도에서 실행 가능한 요소·속성 생성 수 | = 0 | automated(e2e, unit) | Artifact 공유 |
| QR-12 | Maintainability / testability | src/core, layout, check, cli | Node 커버리지 분기·줄 | ≥ 80%, ≥ 90% | automated(Test command 임계값) | M0과 같음 |
| QR-13 | Maintainability / modularity | layout·check·core | DOM·React import·참조 수(정적 검사) | = 0 | automated | 핵심 결정 3 |
| QR-14 | Flexibility / adaptability | 두 viewport | 가로 스크롤 px, stage·card 둘 다 보임, 글자 보장(QR-7) | 0, 충족 | automated(e2e), review(R1) | plan UI |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, C-1 | stub 회귀 | 기존 M0 시험 전부 | (회귀) equivalence partitioning | M0 시험 파일 전부 | 100% | 통과 | Test command |
| VO-2 | FR-2, C-2, C-3 | measureText·wrapText | unit | equivalence partitioning + boundary value analysis(2-value) | 한글, 영문, 숫자, 문장부호, 공백, 빈 문자열, weight 600, maxWidth 경계(=폭, 폭−1), 긴 토큰 | 100% | 결정성, 줄 폭 ≤ maxWidth, height 공식 | Test command |
| VO-3 | FR-3, C-4–C-7 | placeTexts | unit | boundary value analysis(2-value) + equivalence partitioning | 가장자리 ref 4모서리, anchor 9종, fixed 겹침/비겹침, leader 지정, LEADER_PX 경계, 자리 없음, priority 순서, 결정성 | 100% | 상자 영역 안·겹침 0·errors | Test command |
| VO-4 | FR-3, QR-2 | placeTexts 무작위 | fuzz(seeded) | random testing | 2,000 사례(seed 20261024) | 100% 실행 | 속성 위반 0 | Test command(fuzz 시험) |
| VO-5 | FR-4, FR-5, FR-7, C-8–C-11, C-16, C-17, QR-2 | panel 대응 | unit | equivalence partitioning + boundary value analysis | cartesian 선형·log x·log y·log xy·aspect equal·camera, cells 칸·row 방향·value 대비, geo equalEarth·mercator·region 14개 중 world·east-asia·indian-ocean·unknown | 100% | px 오차 ≤ 0.5, 대비 ≥ 4.5, 오류 | Test command |
| VO-6 | FR-6, C-12–C-15 | graph | unit | equivalence partitioning + boundary value analysis | layered down·right, tree, 합집합 고정, at 모서리 2, 일부 at, 넘침→간격 축소 성공, graph-too-large, 간선 글자 | 100% | 겹침 0·위치 고정·오류 | Test command |
| VO-7 | FR-8, FR-9, FR-11, C-18–C-22, C-25 | mark item | unit | equivalence partitioning | 구현 mark 21종 각각 item 생성, axis 솎기·단위, legend 바깥, dim·brace·angle·edge·MarkOpts label 위치 규칙, trace·flow 결정·sweep·reveal 비율 0·0.5·1, mock 틀·잘림, custom 허용·무시·bounds | 100% | item 종류·위치 관계 | Test command |
| VO-8 | FR-10, FR-13, C-23, C-24, C-27 | 구도·focus | unit | equivalence partitioning | split 2 panel·link(mark id → 두 panel item link true), multiples panel 수·같은 domain, compare 2 panel, focus 배열·빈 배열·null, dim text hue 유지·대비 ≥ 4.5·focus보다 낮은 대비, dim shape 같은 색·낮은 불투명도 | 100% | panel·emphasis | Test command |
| VO-9 | FR-12, C-26 | unimplemented | unit + integration(checkLesson) | equivalence partitioning | 대상 11종 | 100% | rule·path | Test command |
| VO-10 | FR-14, C-28–C-32, QR-9 | checkLesson 규칙 | integration(fixture lesson) | decision table + boundary value analysis | 규칙 17개 각각 위반 1·정상 1, data-in-domain 경계 2, goal 끝값 경계, 중복 제거, 예시 수업 0 오류 | 100% | rule·path·message 길이·다른 rule 없음 | Test command |
| VO-11 | FR-15, FR-19, C-33, C-34, C-40, QR-3 | `ltt check` CLI | integration(child process) | state transition | 정상→0, 위반→1, tsc 오류→1(type만), 없음→2, --json, log 줄, 예시 시간 ≤ 15 s | 100% | 종료 코드·stdout·log | Test command |
| VO-12 | FR-16, FR-17, FR-29, C-35–C-38, QR-3 | html·serve·sheet | e2e(Chrome) | state transition | html 산출 구조, 예시 렌더, sheet 정상·runtime 예외·Chrome 없음, dist 없음(임시 복사본에서), sheet 시간 ≤ 120 s | 100% | 종료 코드·파일·sheet.json | Test command |
| VO-13 | FR-18, C-39 | digest | unit + integration | equivalence partitioning | predict choice·drag·draw, quiz 4 kind, Text 함수, check 이름 answer, 정답 누출 금지, order 셔플(정답 순서와 다름) | 100% | 두 부분 내용 | Test command |
| VO-14 | FR-20–FR-28, FR-30, C-41–C-50, C-55, QR-8 | 장면·입력 UI | e2e(Chrome, fixture lesson) | state transition + scenario testing | 장면 타입 8 + summary 각각, predict 확정 전/후 × choice·drag·draw, 오답/정답, quiz 4 kind 제출 전/후, numeric tol 경계, explore knob 4종·handle 제한·goal, steps 자동·멈춤·다음, loop 재생·멈춤·되감기·once·warp 느림 표시(`[data-ltt-slow]`), order 처음 순서 ≠ 정답, classify·draw 키보드, reduced motion, 키보드 시나리오 처음→끝, glossary 앞/뒤 | 100% | DOM 계약 관찰 | Test command |
| VO-15 | QR-7, QR-14, C-51, C-56 | 렌더 품질 실측 | e2e(Chrome), 모든 fixture·예시 장면 × 2 viewport × 2 상태 | equivalence partitioning | 장면×viewport×상태 전부 | 100% | 겹침·잘림 0, ≥ 12/16 px, 대비 ≥ 4.5/3, 터치 ≥ 44, 가로 스크롤 0 | Test command |
| VO-16 | FR-31, C-52, QR-6 | Node·브라우저 일치 | e2e | equivalence partitioning | fixture 수업마다 장면 2개(글자 많은 장면) × 2 viewport | 100% | 상자 차 ≤ 1 px | Test command |
| VO-17 | FR-29, C-53, C-54, QR-10, QR-11 | 오류·주입 | e2e + unit | error guessing | 추측 결함: load-error 빈 화면, 렌더 예외 전파로 전체 중단, 글자 HTML 해석, custom on* 통과, KaTeX \href·\htmlClass 실행, unimplemented figure가 다른 장면을 깨뜨림 | none — experience-based | 결함마다 관찰 | Test command |
| VO-18 | QR-4, QR-5, QR-13 | 성능·크기·모듈 경계 | e2e + unit(파일 검사) | boundary value analysis(1-value 상한) | 프레임 p95, 번들 바이트, SKILL 바이트, layout·check·core의 DOM·React 참조 | 100% | 임계값 | Test command |
| VO-19 | QR-12 | Node 커버리지 | Test command 커버리지 | branch testing + statement testing | src/core·layout·check·cli 분기·줄 | 분기 ≥ 80%, 줄 ≥ 90% | 임계값 | Test command |
| VO-20 | FR-40, FR-41 | 계약 JSDoc·rules.md | unit(파일 검사) | equivalence partitioning | JSDoc 의미 4개(cells row, graph at·고정, geo region·대원, mock box), rules.md 상태 행(predict-reveal-hidden, custom-bounds, 당긴 7개, stub 규칙 6개(focus-unknown-id, model-pure, figure-eval, handle-binding, multiples-param, reveal-figure-exists), label-anchor), d.ts ≤ 21,000 B | 100% | 문장·상태 존재 | Test command |
| VO-21 | QR-1, QR-7, QR-14 | 렌더 눈 검토 | review | equivalence partitioning | 예시 + fixture 수업 sheet PNG 전부 | 100% | 결함 0 또는 finding | R1 |
| VO-22 | FR-60, FR-61, C-57 | SKILL·검산 지시 | review + unit(바이트) | equivalence partitioning | FR-60 11항목, FR-61 5항목 | 100% | 항목마다 줄 번호 | R2, Test command |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v1 — approved / vetoed → answer / user answer |
| --- | --- | --- | --- |
| A-1 | 이 run은 runtime·check·sheet·SKILL까지. 생성 실험은 run 완료 뒤 별도 측정 단계 | 사용자 A1 답 | user answer |
| A-2 | 시험 주제: attacker-moves-second, global-supply-chain, polished-ui-components. 고정 진단은 main 초안대로 `bench/topics.md`에 추가 | 사용자 A2 답, Q1 "임의 결정" | user answer |
| A-3 | geo 구현(equalEarth·mercator·region), sankey 미구현 | 사용자 Q2 추천 수용 | user answer |
| A-4 | 서브에이전트 model opus, effort low | handoff 사용자 선호 | user answer |
| A-5 | 구현 mark 목록 = 예시 수업 사용 mark ∪ 3주제에 필요한 mark(node·edge·cell·rect·circle·arc·path·label·brace·mock·flow). glyph·icon·field·inset·from 제외 | 예시 수업 사용 빈도, 주제별 그림 추정. glyph·icon 이름 목록이 설계되지 않음 | brief v1 — approved |
| A-6 | 의존성: react·react-dom 19, motion 12, d3-scale·d3-shape·d3-array·d3-geo, topojson-client, world-atlas, elkjs, katex, pretendard, esbuild·playwright-core·fontkit(dev). 지연 chunk: elkjs, katex, 지도 | plan 의존성 목록 + 빌드·측정 도구 | brief v1 — approved |
| A-7 | 글자 측정은 Pretendard 글자 폭 표(빌드 때 fontkit으로 생성)이고, 브라우저는 커닝을 끈다 | Node·브라우저 일치 필요. 커닝 끔의 시각 손실은 작음(추정) | brief v1 — approved |
| A-8 | 글자 배치: 탐욕적 후보 + leader. 자리 없으면 글자를 줄이지 않고 오류 | 사용자 질문 답(graph), 최소 글자 크기 보장 | brief v1 — approved |
| A-9 | 밝은 테마만. 어두운 테마는 M2 | 범위 축소. 테마 뒤집힘은 계약상 허용 | brief v1 — approved |
| A-10 | Chrome만(playwright-core + 설치된 Chrome). Safari는 M5 | 설치된 브라우저. 폰 Safari 차이 위험 남음 | brief v1 — approved |
| A-11 | viewport desktop 1280×800, mobile 390×844 | v1 contact sheet 1280×800, iPhone 13–15 폭 | brief v1 — approved |
| A-12 | 글자 크기: figure 12/14/17 px(s/m/l), card 16 px. 대비: 글자 4.5:1(dim 포함), 선·면 3:1 | WCAG 2.x AA | brief v1 — approved |
| A-13 | `ltt check`가 tsc를 포함한 한 명령. 출력에 layer를 붙여 원인별로 센다 | 생성 agent 단계를 줄임 | brief v1 — approved |
| A-14 | check 규칙: handoff 7개 + layout + stub 래핑만. 나머지 check 규칙은 M2 | handoff 범위 | brief v1 — approved |
| A-15 | sheet 상태 2개(initial·settled), 6장면/PNG | v1 contact sheet 방식 | brief v1 — approved |
| A-16 | 성능 임계값: check ≤ 15 s, sheet ≤ 120 s, 프레임 p95 ≤ 20 ms, 첫 번들 ≤ 400 KB, SKILL ≤ 12,000 B | 생성 12분 목표 대비 여유, 60 fps 근사 | brief v1 — approved |
| A-17 | 커버리지: 분기 80%·줄 90%(Node 쪽만). UI 코드는 e2e + R1 | M0과 같음. 브라우저 커버리지 도구 없음 | brief v1 — approved |
| A-18 | SKILL·검산 지시는 한국어 | 프로젝트 언어 | brief v1 — approved |
| A-19 | 대원 보간(geo), mock box = 내용 영역, cells row 아래로 | 계약에 없던 의미 결정, 감사 조각 사용 방식(mock children 부모 좌표) | brief v1 — approved |
| A-20 | 생성 조건은 v1과 같음(웹 없음). attacker 주제 수치는 생성 뒤 main 사실 검토 | v1 측정 조건, 측정 단계에서 적용 | brief v1 — approved |
| A-21 | 일반 요청 기준선 3개를 측정 단계에서 생성 | 비율 비교·쌍 비교용 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1 | VO-1 | Test command |
| FR-2 | C-2, C-3 | VO-2 | Test command |
| FR-3 | C-4–C-7 | VO-3, VO-4 | Test command |
| FR-4, FR-5, FR-7 | C-8–C-11, C-16, C-17 | VO-5 | Test command |
| FR-6 | C-12–C-15 | VO-6 | Test command |
| FR-8, FR-9, FR-11 | C-18–C-22, C-25 | VO-7 | Test command |
| FR-10, FR-13 | C-23, C-24, C-27 | VO-8 | Test command |
| FR-12 | C-26 | VO-9 | Test command |
| FR-14 | C-28–C-32 | VO-10 | Test command |
| FR-15, FR-19 | C-33, C-34, C-40 | VO-11 | Test command |
| FR-16, FR-17, FR-29 | C-35–C-38, C-53 | VO-12, VO-17 | Test command |
| FR-18 | C-39 | VO-13 | Test command |
| FR-20–FR-28, FR-30 | C-41–C-50, C-55 | VO-14 | Test command |
| FR-31 | C-52 | VO-16 | Test command |
| FR-40, FR-41 | — | VO-20 | Test command |
| FR-60, FR-61 | C-57 | VO-22 | R2, Test command |
| QR-1, QR-7, QR-14 | C-51, C-56 | VO-15, VO-21 | Test command, R1 |
| QR-2 | C-8, C-9, C-16 | VO-4, VO-5 | Test command |
| QR-3 | C-33, C-36 | VO-11, VO-12 | Test command |
| QR-4, QR-5, QR-13 | — | VO-18 | Test command |
| QR-6 | C-52 | VO-16 | Test command |
| QR-8 | C-49, C-50 | VO-14 | Test command |
| QR-9 | C-29 | VO-10 | Test command |
| QR-10, QR-11 | C-25, C-53, C-54 | VO-17 | Test command |
| QR-12 | — | VO-19 | Test command |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 10 |
| verifier invocations | 2 |
| open finding ids | V2-2, V2-3, V2-4, V2-5, V2-6, V2-6R |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1–VO-5, VO-8–VO-11, VO-13, VO-16, VO-18–VO-20 | 18 | Test command R13(604/604, 줄 94.37%, 분기 85.70%), verifier 2회차 판정 | accepted | verifier 2회차 전수 감사. 관련 mutation M1–M14 killed(M8 equivalent) | 구현 트리 9cedfd18 |
| VO-6 | 18 | layout-graph.test.mjs | accepted | V2-1 기각: 간격 축소 제거 mutation이 VO-6 C-12와 overflow 시험에 killed | — |
| VO-7, VO-17 | 18 | layout-marks.test.mjs:229-240, e2e-errors.test.mjs:107 | open | V2-2: on* 속성이 있는 custom 요소 전체를 버리는 mutation survived | 다음 run |
| VO-14 | 18 | e2e-ui.test.mjs | open | V2-3: drag 채점 항상 정답 mutation survived. V2-4: classify item tabIndex -1 mutation survived | 다음 run |
| VO-15 | 18 | e2e-quality.test.mjs:78-119 | open | V2-5: line·trace 그룹의 data-ltt-tone을 빼고 opacity 0.25로 낮춘 mutation survived | 다음 run |
| VO-12 | 18 | cli-html-sheet.test.mjs | open | V2-6: sheet layoutViolations 상수 [] mutation survived. 위반을 만드는 coverage item 없음(spec 공백) | 다음 run, 검증 방식 결정 필요 |
| VO-21 | 18 | bench/m1/runtime-sheet-review.md | open | V2-6R: v17/v18 뒤 트리(9cedfd18)에서 fixture PNG를 다시 보지 않았고, F5-1 재확인 기록이 R1 산출물에 없음 | 다음 run |
| VO-22 | 18 | bench/m1/skill-review.md | accepted | SKILL.md 변경 없음 | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| R1 | Test command 1회차: 562 중 542 통과, 20 실패, 커버리지 줄 93.5%·분기 84.7%, 6분 14초 | — | — | 분류는 아래 F1·T1 |
| F1-1 | VO-15 summary 장면 text-clipped 다수(projectile·coffee, 두 viewport) | 구현: summary가 stage 밖으로 넘치고 스크롤 | v4: summary는 스크롤 없이 stage 격자 | implementation defect, 수정 묶음 1 |
| F1-2 | VO-15 port-congestion geo 라벨 대비 4.12·4.21 | 구현: 글자색을 흰 배경 기준으로만 고름, 육지 면 위 | v4: 글자 아래 면 합성 배경 기준 | implementation defect, 수정 묶음 1 |
| F1-3 | VO-22 SKILL.md에 `ltt digest` 표기 없음(`node .../ltt.mjs digest`) | 문서: 명령 이름 규칙 없음 | v4 FR-60: `ltt` 별칭 정의 후 사용 | implementation defect |
| F1-4 | VO-20 geo region 이름 JSDoc 없음 | spec: ext/geo.d.ts가 Implementation 밖 | v4: 경로 추가, 이름 14개 나열 | spec gap → 수정 |
| F1-5 | VO-20 rules.md에 reveal-marks-exist 행 없음 | spec: FR-41이 새 행을 명시하지 않음 | v4 FR-41 | spec gap → 수정 |
| F1-6 | implementer challenge: compare 장면 layout 표면 없음, geo Panel projection 없음 | spec gap | v4 Signatures | 수용 |
| F1-7 | 구현 기본값 edge directed true | 선택적 boolean 기본 의미와 어긋남 | v4: 기본 false | implementation defect |
| F1-8 | 구현 기본값 4개(custom y 아래, 도형 변환, draw 채점, reveal.figure 배치) | — | v4에 기록 | 수용 |
| T1-1 | VO-15 card 버튼 "다음"·"제출" 대비 1.00 | 시험: layersAt가 글자 요소 자신의 배경을 빼고 합성 | 자기 배경 포함 | test defect |
| T1-2 | VO-15 order "↑"·"↓" 대비 2.71 | 비활성 버튼(추정). spec에 예외 없음 | v4 QR-7 disabled 예외 | spec gap → 시험 수정 |
| T1-3 | VO-5 dot 중심 14.25 vs 12 | 시험: domain 끝의 dot은 v2 잘림 규칙으로 bbox가 줄어듦 | 내부 점 또는 dataToPx 비교 | test defect |
| R2 | Test command 2회차: 573 중 570 통과, 커버리지 줄 93.6%·분기 84.9%. F1-1–F1-8, T1-1–T1-4 해소(해당 시험 통과) | — | — | 남은 3건은 F2 |
| F2-1 | VO-15 mobile predict settled reveal 글 대비 1.00(coffee, projectile) | 구현: answer() resolve 뒤에도 reveal 등장 애니메이션 진행 중(opacity≈0). spec에 resolve 시점 정의 없음 | v7: goto·answer·ready는 전환 애니메이션 종료 뒤 resolve | spec gap + implementation, 수정 묶음 2 |
| F2-2 | VO-14 draw 45→22가 false | 이산화 차이: 구현 25점 등간격 평균 8.019 > tol 8, 적분 평균 7.357(main 계산). spec "평균" 정의 없음 | v7: 적분 평균, 사다리꼴 ≥200 구간 | spec gap + implementation, 수정 묶음 2 |
| R3 | Test command 3회차: 571/573, F2-2 해소. F2-1 재발 형태: mobile predict settled reveal 글 대비 1.00(coffee, projectile) | — | main이 Chrome으로 직접 관찰: 글 중심점의 elementsFromPoint 최상단이 nav의 "다음" 버튼(어두운 배경). opacity 1. 애니메이션이 아니라 가림 | F2-1 원인 가설(애니메이션) 기각, F3-1로 |
| F3-1 | mobile card의 reveal 글이 하단 nav 버튼 아래에 깔림(y 788–813, viewport 844) | 구현: card 스크롤 내용이 nav 밑으로 들어가고, 확정 뒤 reveal로 스크롤하지 않음 | v8 FR-20: nav에 가려지지 않음, 확정·제출 뒤 reveal·feedback으로 스크롤 | implementation defect, 수정 묶음 3 |
| R4 | Test command 4회차: 573/573 통과, 커버리지 줄 93.6%·분기 84.9%, 6분 43초. F3-1 해소 | — | — | Verify 전 R1·R2 작성 |
| R1 | `bench/m1/runtime-sheet-review.md`: PNG 22장 검토, 결함 3(F4-1–F4-3), advisory 7 | — | — | 아래 |
| F4-1 | port-congestion desktop-3.png(1572×525): 장면 1개 쪽에서 summary가 반쪽 높이 두 줄로 반복 | 구현: 데스크톱 sheet가 summary를 figure 쪽마다 따로 찍음(추정) | v9 FR-17: 장면당 한 줄, 같은 줄 높이 | implementation defect, 수정 묶음 4, 증거 R1 재검토 |
| F4-2 | 선택지 글 안 glossary 용어가 글을 좌우로 가름(coffee #15·#16) | 구현: 선택지가 flex 배치라 용어 버튼과 글이 따로 놓임(추정) | v9 FR-26 inline | implementation defect |
| F4-3 | multiples panel 제목과 label이 붙음, leader가 다른 panel로 건너감(coffee 모바일 #14) | spec 공백 + 구현: panel 경계·제목이 배치 장애물이 아님 | v9: Panel.box, Item.panel, 제목 장애물 4 px, 글자는 자기 panel 안 | spec gap → 양쪽 |
| F4-4 | sheet 실측이 card 글을 안 재서 F3-1을 놓침(R1 A4-7) | spec 공백: 실측 대상 미정 | v9 FR-17: card 글 포함 | spec gap → implementation |
| R5 | Test command 5회차: 584/587. F4-1–F4-4 구현 반영. 실패 3: VO-12 PNG 높이 526 vs 516, VO-8 split 제목 없음 | — | main 재검토: port desktop-3 1572×526 한 줄(F4-1 해소), coffee 모바일 #15·#16 inline(F4-2 해소), #14 제목 간격(F4-3 해소) | 아래 |
| T5-1 | VO-12 PNG 높이를 rows × r로 가정 | 시험: PNG 위아래 여백 상수(pad≈12–13)를 빼지 않음. 6줄 3096, 1줄 526 → r 514, pad 12 | h = pad + n·r 모형으로 | test defect |
| T5-2 | VO-8 split에 제목 요구 | 시험: 계약상 split에는 제목 출처가 없음 | 제목은 multiples·compare만 요구 | test defect |
| F4-5 | coffee 모바일 #14 k = 0.2 panel: 축 제목 "온도차 비율"과 label "온도차 절반"이 맞닿아 한 문자열로 읽힘 | spec: placeTexts가 경계 맞닿음을 허용 | v10: 글자 상자 간격 ≥ 2 px | spec gap → 양쪽 |
| R6 | Test command 6회차: 589/589, 커버리지 줄 93.5%·분기 85.0%. T5-1·T5-2·F4-5(2 px) 반영 | — | main 재검토(coffee 모바일 #14 확대): k = 0.1 panel "온도차 비율"·"온도차 절반" 2 px 간격이 여전히 한 문자열처럼 읽힘. label 흰 바탕이 데이터 선을 덮어 선이 끊겨 보임("직선이 된다", "온도차 절반") | F4-6 |
| F4-6 | 2 px 간격 부족, label이 데이터 선 위에 놓여 선을 가림 | spec: 간격 값이 작음(12–14 px 글자의 공백 폭 약 3–4 px보다 작음), 데이터 선을 배치 장애물로 보지 않음 | v11: TEXT_GAP 6, placeTexts `avoid` 약한 장애물(같은 panel 데이터 선분) | spec gap → 양쪽, 수정 묶음 5 |
| R7 | Test command 7회차: 594/594, 줄 94.34%·분기 85.73%. F4-6·v12 축 제목 반영. main 재검토 2: coffee #14 해소, advisory A6-1·A6-2 | — | — | Verify로 |
| V1 | verifier 1회차(spec v12): retry. 막는 finding 3(V1-1 VO-15 선 대비 3:1 화면 미측정, V1-2 VO-14 order·classify 오답 채점 미시험, V1-3 VO-21 R1 전수 검토가 v8 시점). advisory A-V1-1(장면에 stage 글자가 하나도 없어도 VO-15 통과), A-V1-2(KaTeX 요소가 렌더되지 않아도 주입 시험 통과), A-V1-3(fuzz avoid 속성) | — | V1-1 → v13 측정 대상·DOM 속성, V1-2 → 시험 보강, V1-3 → main 전수 재검토 | 수정 묶음 6 |
| MUT-1 | 손 mutation 10개(R7 트리, 각각 seed.py backup·restore, 대상 시험 파일만 실행). 고른 이유: 이번 run에서 실제로 났던 결함 부류와 verifier가 가볍게만 본 의무(VO-3·5·10·13·14·17)를 겨눔 | — | M1 TEXT_GAP−2 → layout-text·fuzz killed; M2 log x 무시 → layout-panel killed; M3 domain 끝 엄격 → check-rules killed; M4 numeric tol `<` → e2e-ui C-44 killed; M5 draw tol×0.9 → e2e-ui 45→22 killed; M6 확정 전 Option params 적용 → e2e-ui C-41 killed; M7 확정 전 reveal.marks 표시 → e2e-ui C-41·C-43·draw killed; M8 custom on* 통과 → survived; M9 order 셔플 항등 → digest·e2e-ui killed; M10 accent-focus-only 끔 → check-rules killed | 9/10 killed. M8은 equivalent: main이 figure.mjs 1508–1535를 읽어 확인. custom 출력은 sanitize 뒤 fill·stroke·stroke-width·opacity·transform·좌표만 읽어 px path item으로 바뀌므로 on* 속성이 DOM에 닿는 경로가 없다 |
| R8 | Test command 8회차: 587/595, VO-15 8개 실패(모든 수업 × 2 viewport) 모두 line-contrast 1.00–1.23 | 시험·구현 경계: 구현이 V1-1 대응으로 tone 획 아래 흰 보조 획(casing)을 같은 mark 그룹에 그림. 시험은 그룹 안 모든 획을 재서 흰 casing을 전경색으로 잼(흰 위 흰 = 1.00). DOM 계약에 casing 구분 수단이 없음 | v14: casing은 `data-ltt-casing`, 측정 제외·배경 층 | spec gap → 양쪽, 수정 묶음 7 |
| R9 | Test command 9회차: 587/595, VO-15 8개. line-contrast 1.00–1.04(drag-path·now-trace trace, dot-부산·로테르담·cup-dot), 가드 실패(banner rect/warn) | main이 Chrome DOM 관찰: trace 그룹의 head는 tone 칠 + 흰 테두리 획 path이고, 시험은 kind=trace라 획(흰색)을 잼. 겹친 도시 점은 측정 점에서 자기 요소가 elementsFromPoint에 없을 때 위를 덮은 같은 색 점을 배경으로 합성. banner는 fill soft rect라 측정 대상이 아닌데 가드가 셈 | v15: 요소 대비 = 투명이 아닌 칠·획 중 큰 값, 가려진 요소 제외. 가드는 측정 대상 요소만 | test defect(+spec 명시), 수정 묶음 8 |
| R10 | Test command 10회차: 592/595. battery-supply 두 viewport에서 측정된 tone mark 0개(수업 단위 가드), coffee 모바일 summary cup-dot 1.00 | 시험: (a) 측정 점이 경로 가운데·bbox 점뿐이라 graph 간선 가운데는 간선 글자 흰 바탕에 덮여 모두 건너뜀(추정, battery의 tone mark는 graph 간선·노드), (b) cup-dot 아래 같은 색 trace head를 배경으로 합성 | 경로 위 여러 점(길이 0.1–0.9) 표본, 배경 층 정의(v16) | test defect, 수정 묶음 9 |
| R11 | Test command 11회차: 596/596, 줄 94.35%·분기 85.71%. V1-1·V1-2 시험 반영 통과 | — | — | V1-1·V1-2 해소(mutation 확인 대기) |
| R1-F | V1-3 대응 R1 전수 재검토(22장, 트리 해시 기록). 새 결함 F5-1 | — | bench/m1/runtime-sheet-review.md "전수 재검토" | V1-3 해소, F5-1 open |
| F5-1 | 예시 수업 traj legend가 plot 밖으로 밀리고 그림을 가로지르는 긴 leader가 붙음(데스크톱 #1·#6·#14, 모바일 #0·#1·#6·#10·#14) | 구현: v11 avoid가 legend 자리를 밀어내고 placeTexts 일반 규칙대로 leader를 그음. spec: legend leader 금지가 없었음 | v17: legend는 leader 없음, plot 바깥 margin을 먼저 확보 | spec gap + implementation, 수정 묶음 10 |
| MUT-2 | 손 mutation 13개 재실행(R11 트리, 해시 cca743c8…, 시험 변경 뒤): M1–M10 + M11 tone 획 opacity 0.25(V1-1 확인), M12 order 채점 항상 정답, M13 classify 채점이 bin을 무시(V1-2 확인) | — | M1–M7·M9–M13 killed. M11은 VO-15 coffee·port line-contrast가 잡음. M12·M13은 VO-14 C-45 오답 시험이 잡음. M8 survived(MUT-1과 같은 equivalent 판정) | 12/13 killed, 1 equivalent. restore 뒤 트리 해시가 실행 전과 같음 |
| R12 | Test command 12회차: 600/600, 줄 94.37%·분기 85.70%. 예시 sheet 재확인: legend leader 없음(F5-1 해소, 데스크톱·모바일 장면 0–17) | — | — | F5-1 해소 |
| MUT-3 | M14 legend noLeader 무력화(place.mjs) → layout-marks, e2e-quality, check-rules 모두 통과(survived) | 시험 공백: 현재 입력에서 at legend가 LEADER_PX 넘게 밀리는 경우가 없어 leader 경로를 밟지 않음 | v18: at legend 위치 규칙 명시, 시험에 at 자리를 다른 글자가 차지하는 사례 추가 | T12-1 obligation evidence gap(VO-7) |
| T12-1 | VO-7 legend at 사례 추가(자유 자리 + 선 통과, 고정 노드 글자에 막힌 자리, 이동 거리 > LEADER_PX 전제) | — | M14 재실행: layout-marks 2개 실패(killed) | 해소 |
| R13 | Test command 13회차: 604/604, 줄 94.37%·분기 85.70%, 7분 10초. 구현 트리 해시 9cedfd18… | — | — | Verify 2회차로 |
| V2 | verifier 2회차(spec v18, 최종): retry, 막는 finding 6(V2-1–V2-6, V2-6R). advisory A-V2-1–A-V2-5 | — | — | verifier 예산 소진 → limit |
| MUT-4 | V2 확인 mutation 6개(트리 9cedfd18, seed backup·restore): V2-1 SPACING [1]만 남김 → killed(layout-graph). V2-2 on* 속성 요소 전체 버림 → survived. V2-3 drag 항상 정답 → survived. V2-4 classify item tabIndex -1 → survived. V2-5 line·trace tone 속성 제거 + opacity 0.25 → survived. V2-6 sheet layoutViolations 상수 [] → survived | — | — | V2-1 기각, V2-2–V2-6 증거 빈틈 확인. restore 뒤 트리 해시 동일 |
| T1-4 | VO-17 custom `rect` 요소 없음 | 시험: 허용 도형을 같은 tag로 그린다고 가정. 구현은 path로 변환 | v4: 변환 허용, 시험은 mark 그룹 안 도형 요소 존재로 | test defect |

# Version Log
## v1
- 초안. handoff `9c1e4b7d20a6f385`, 사용자 답 A1(run 분리), A2(새 3주제), Q1(진단 임의 결정), Q2(geo 수용), graph 구현 방향 답.
## v2
- test-implementer spec challenge 13건 처리(계약 세부, brief 항목 변경 없음): 규칙별 path 형식과 `@t`는 figure-eval만(C-32와 일치), graph-too-large일 때 node·edge text-no-room 억제(C-29), shape bbox = 잘린 뒤 범위, reveal 호 길이는 px, `[data-ltt-slow]`, classify·draw 키보드 DOM, glossary 용어 버튼 터치 대상 제외, stub 규칙 6개로 정정, split link → item `link: true`, order 셔플(digest·UI, 답 누출 방지), C-12 층 4 이하, 끝 눈금 글자는 안쪽 이동 또는 제거(오류 없음).
- dim 정의 명확화: hue 유지·대비 ≥ 4.5·focus보다 낮은 대비. 근거: test가 dim 글자색이 tone과 다른 회색(#0b7a75 → #5b616b)으로 바뀌는 것을 관찰. 계약 v6 "tone 불변"과 QR-7 대비를 함께 만족시키는 정의.
## v3
- test-implementer v2 challenge 2건: split link mark id는 그 id를 그리는 한쪽 panel에만 `link: true`(계약상 id가 두 하위 figure를 합쳐 유일), order 셔플 알고리즘을 Fisher–Yates(i = n−1→1, 문항마다 새 rng(1))로 고정.
## v4
- implementer challenge 2건 수용: layoutFigure `compare` 옵션(compare 장면 2 panel), geo Panel `projection`·`region` 일반 속성.
- 구현이 스스로 정한 기본값 확인·기록: custom 단위 y 아래로, 허용 tag 도형의 SVG 요소 변환 허용, draw 채점 = 평균 수직 거리 ≤ tol, reveal.figure는 stage 반씩.
- 정정: edge `directed` 기본 false(구현은 true였음; 선택적 boolean의 기본 의미와 맞춤). summary는 스크롤 없이 stage 안 격자(구현의 모바일 스크롤은 VO-15 text-clipped 위반을 냄).
- Test command 1회차(542/562): 글자 대비를 글자 아래 면 기준으로 명시(geo 라벨 4.12–4.21 관찰), disabled 조작 요소 대비 예외(WCAG 1.4.3), rules.md `reveal-marks-exist` 행 추가, ext/geo.d.ts JSDoc을 Implementation에 포함해 region 이름 나열, SKILL의 `ltt` 별칭.
## v5
- test-implementer challenge: predict 정오를 관찰할 DOM 신호 없음 → `[data-ltt-reveal][data-ltt-correct="true|false"]` 추가(draw 채점 경계 시험용).
## v6
- implementer challenge 수용: 모바일 summary 격자(칸 약 171×162 px)에서는 예시 수업 `byvt` multiples가 text-no-room을 내 C-28과 충돌 → 모바일은 쪽당 figure 하나 + `[data-ltt-summary-page]`. 데스크톱은 격자 유지.
- F1-2 구현 방식(그림 글자 뒤 불투명 흰 바탕) 기록. 시각 영향(글자가 아래 선·육지를 가림)은 R1 검토 항목.
## v7
- Test command 2회차의 F2-1·F2-2: `__ltt` goto·answer·ready resolve 시점을 전환 애니메이션 종료 뒤로 정의, draw 채점 평균을 적분 평균(사다리꼴 ≥200 구간)으로 정의. 25점 등간격 평균은 경계 사례(적분 7.357, 이산 8.019, tol 8)에서 판정이 뒤집힘.
## v8
- F3-1: FR-20에 card 글이 nav 등에 가려지지 않음, 확정·제출 뒤 reveal·feedback으로 스크롤을 명시(main의 Chrome 관찰 근거).
- 구현 기본값 기록: draw 학습자 선이 x 범위 끝에 닿지 않으면 가까운 끝 값 사용.
## v9
- R1 결함 F4-1–F4-4: sheet PNG 합성 규칙(장면당 한 줄·같은 높이·summary 한 번), sheet 실측에 card 글 포함, 글 안 용어 버튼 inline, Panel `box`·Item `panel`·제목 `mark: "title"`·제목 장애물 4 px·text는 자기 panel 안.
## v10
- F4-5(R1 재검토): placeTexts 글자 상자끼리·장애물과 `TEXT_GAP` 2 px 이상. 이전에는 경계 맞닿음 허용이라 축 제목과 label이 한 문자열로 읽혔다.
## v11
- F4-6(R1 재검토): TEXT_GAP 2 → 6 px. placeTexts에 `avoid`(데이터 선분, 약한 장애물)를 더하고 layoutFigure가 같은 panel의 데이터 선분을 넘긴다. 근거: 2 px 간격 한글 글자열이 이어져 읽힘, 글자 흰 바탕이 데이터 선을 끊어 보이게 함.
## v12
- 축 제목도 눈금처럼 `text-no-room`을 내지 않는다(v11 TEXT_GAP 6 뒤 예시·coffee의 축 제목 "vx (m/s)", "온도 (°C)", "온도차 비율"이 text-no-room을 냄. 수업 쪽에서 고칠 수 없는 runtime 소유 글자).
## v13
- verifier 1회차 V1-1: QR-7 선 대비 3:1의 측정 대상(비 dim, 강조·범주·의미 tone 선형 mark 획과 solid dot)과 DOM 표면(`data-ltt-tone`, `data-ltt-kind`)을 명시. V1-2(order·classify 오답 채점)와 V1-3(R1 전수 재검토)은 계약 변경 없음.
## v14
- R8: 흰 보조 획(casing)을 DOM에서 구분하는 `data-ltt-casing`을 계약에 추가. 선 대비 측정은 casing을 전경이 아니라 배경 층으로 본다.
## v15
- R9: 선 대비 측정 규칙 명시. 요소 하나의 대비는 투명이 아닌 칠·획 중 큰 값, 측정 점에서 가려진 요소는 제외. 근거: trace head(흰 테두리 + tone 칠)와 겹친 지도 점에서 측정이 1.00으로 나옴(main의 DOM 관찰).
## v16
- R10: 선 대비의 배경 층을 정의(페이지·패널·기본 지도·cell·area·rect 칠·casing). 다른 선형 데이터 mark는 배경으로 합성하지 않는다. 근거: 같은 색 trace head 위의 cup-dot이 1.00으로 측정됨.
## v17
- R1 전수 재검토 F5-1: legend 글자에는 leader를 긋지 않고, plot 바깥 margin을 먼저 확보해 자리를 정한다(avoid로 밀리지 않음). 근거: 예시 수업 hook을 포함한 5개 장면에서 legend leader가 데이터를 가로지름.
## v18
- MUT-3: legend `at`의 위치 규칙 명시(at에 붙임, 거리 ≤ LEADER_PX, 자리가 차지되면 가장 가까운 빈자리, leader 없음). 근거: noLeader mutation이 기존 시험을 모두 통과.
## v18 (상태 변경)
- verifier 2회차 retry로 예산 소진. status limit, handoff `agent-docs/handoff/93e77e4b52d35f59-m1-runtime-verifier-limit.md`. 계약 변경 없음.
