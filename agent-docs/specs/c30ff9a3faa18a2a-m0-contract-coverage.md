---
version: 4
run_id: c30ff9a3faa18a2a
status: active
base_commit: 4f3c6058f14b1928894e39e97387c1a303e6623c
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 사용자(프로젝트 소유자) | runtime(M1) 전에 agent용 수업 계약을 고정한다 | `packages/runtime/types/lesson.d.ts`가 Signatures의 API를 정의하고, 양성 fixture는 통과, 음성 fixture는 tsc 오류 |
| UI-2 | 사용자 | 계약이 v1 범위와 v1 밖 분야를 덮는지 안다 | `bench/coverage/report.md`에 말뭉치별 (C+G)/(V+C+G)와 구간, held-out 비율 ≤ 10% |
| UI-3 | 생성 agent(미래 사용자) | 싸게 읽을 수 있는 정확한 계약 | core `lesson.d.ts` ≤ 21,000 B(약 6k 토큰), 영어 JSDoc |
| UI-4 | 사용자 | M1 렌더 목표이자 M3 few-shot의 원본이 될 예시 수업 | `skill/learn-to-tell/examples/projectile-drag.js`가 tsc·stub 검산을 통과하고 FR-40의 요소를 모두 씀 |
| UI-5 | M2 구현자 | check가 강제할 규칙의 목록과 고의 결함 | `packages/runtime/rules.md`에 FR-50의 규칙 ID 전부 |

# Scope
In scope: 개발 도구(package.json, tsconfig, typescript 고정), 계약 타입(`packages/runtime/types/` core·internal·ext), 측정용 stub(`packages/runtime/dev/spec-stub.mjs`: API 기술자, 수치 도우미, check·figure 평가, 사용 빈도), 감사 조각 형식과 집계(`bench/coverage/fragment.d.ts`, `bench/coverage/count.mjs`), 예시 수업 1개, 규칙 카탈로그, review evidence로서의 범위 감사(pilot → 사용자 게이트 → 전체 → 어휘 개정 → held-out), `bench/topics.md`에 새 분야 주제 추가, intent.md 수정.
Out of scope: 렌더링·UI·애니메이션 구현(M1), `ltt check`·`ltt sheet` CLI(M2), SKILL.md(M3), npm 배포·claude.ai(M5), 진단·map·result.md(M4), glyph·icon의 실제 목록(M1), plugin(악보·화학 구조식·소리) 타입.

# Paths
Implementation: package.json, package-lock.json, tsconfig.json, .gitignore, packages/runtime/types/, packages/runtime/dev/, packages/runtime/rules.md, skill/learn-to-tell/examples/projectile-drag.js, bench/coverage/fragment.d.ts, bench/coverage/count.mjs
Tests: packages/runtime/test/
Test command: npx tsc -p packages/runtime/test/tsconfig.json && node --test --experimental-test-coverage --test-coverage-include=packages/runtime/dev/spec-stub.mjs --test-coverage-include=bench/coverage/count.mjs --test-coverage-branches=80 --test-coverage-lines=90 'packages/runtime/test/**/*.test.mjs'
Review evidence: (R1) 범위 감사 — `bench/coverage/protocol.md` 절차, 산출물 `bench/coverage/{shots,lessons,new}/*.js`, `bench/coverage/out/{figures.tsv,summary.json}`, `bench/coverage/report.md`; (R2) 예시 수업 규칙 검토 — `bench/coverage/example-review.md`(rules.md의 check 층 규칙마다 예시 수업의 장면 경로와 충족 여부); (R3) 계약 문서 검토 — `bench/coverage/contract-review.md`(JSDoc이 AGENTS.md 주석 규칙을 지키는지, core/ext 분리, count_tokens 측정값 또는 근사 방법). 세 산출물은 main이 쓴다.
Fuzzing: none — 대상이 작은 결정적 순수 함수이고 경계값·결정표로 덮는다. 설치된 속성 기반 도구 없음.
Mutation tool: none — Stryker 등 미설치. 손 mutation 8–10개로 대신한다.

# Signatures
## 모듈과 타입 경로
- 타입 모듈 지정자 `"ltt"`는 tsconfig `paths`로 `packages/runtime/types/lesson.d.ts`에 대응한다(루트 tsconfig와 `packages/runtime/test/tsconfig.json` 모두).
- 수업 파일: `/** @type {import("ltt").LessonFactory} */ export default (api) => api.lesson(input)`. 수업 파일에는 import 문이 없다.
- `type LessonFactory = (api: Api) => LessonSpec`. `LessonSpec`은 `lesson()`의 반환 타입(불투명 brand).
- `Api` 멤버: core `lesson, model, figure, custom` / frame `cartesian, polar, lanes, graph, cells, space3d, geo` / mark `axis, grid, legend, line, area, dot, circle, rect, arc, arrow, path, label, dim, angle, brace, node, edge, cell, field, glyph, icon, math, code, mock` / motion `trace, flow, sweep, inset` / composition `split, multiples` / helper `ode, rng, argmax, root, sample, histogram, interpolate`.
- `space3d`, `geo`의 옵션 타입은 `packages/runtime/types/ext/space3d.d.ts`, `ext/geo.d.ts`에 정의하고 core는 import해 한 줄로 선언한다.

## 공용 타입
- `P = [x: number, y: number]` (frame 데이터 단위). `Axis = [min: number, max: number, unit: string]`. `Params = Record<string, number | string | boolean>`.
- `Text = string | ((m: Outputs) => string)`. `Outputs`는 `models`의 각 이름 → 그 model 출력 타입.
- `Tone = "focus" | "ref" | "muted" | "good" | "warn" | "bad" | "series1" | "series2" | "series3" | "series4" | "series5" | "series6"`. series1–6은 서로 구별되는 색(색각 이상 대비)이 보장되고, good·warn·bad는 의미 색이다. 색 값은 runtime이 정한다.
- `MarkOpts = { id?: string; tone?: Tone; label?: Text; reveal?: number /* 0–1, 경로 시작점부터 호 길이 비율로 그린다 */; from?: string; weight?: "thin" | "normal" | "bold"; size?: "s" | "m" | "l"; fill?: "none" | "soft" | "solid"; opacity?: number /* 0–1 */ }`. px·색·글꼴·style·className 필드는 없다(객체 리터럴의 초과 속성은 타입 오류). fill 기본값: area는 soft, dot는 solid, rect·circle·arc·path는 "none"(윤곽선). 그리기 순서는 MarkTree 순서이고 뒤의 mark가 위에 온다. mark는 frame 영역 밖에서 잘린다.
- `MarkTree = Mark | false | null | undefined | MarkTree[]`.
- `TimeSpec`은 정확히 하나: `{ loop: { ms: number; span: [number, number]; once?: boolean; warp?: [modelT: number, wall: number][] } }` | `{ steps: string[] }` | `{ idle: { ms: number } }` | `{ static: string }`. 없거나 둘 이상이면 타입 오류. loop는 span을 ms에 선형으로 대응시킨다. warp가 있으면 (span[0],0)…(span[1],1)을 잇는 단조 증가 구간 선형 대응을 쓰고(같은 modelT가 이어지면 그 시각에 머문다), 평균보다 느린 구간에 runtime이 "느리게 재생"을 표시한다. once면 한 번 재생하고 끝 상태에 머문다.

## core
- `lesson(input: LessonInput): LessonSpec`
- `LessonInput = { meta: Meta; glossary?: Record<string, string>; checks: Check[]; models: Record<string, Model>; figures: Record<string, Figure>; sections: Section[]; quiz: QuizItem[]; summary: { figures: FigKey[]; say?: Text } }`. 문서와 예시의 속성 순서는 meta, glossary, checks, models, figures, sections, quiz, summary.
- `Meta = { title: string; objectives: [Objective, ...Objective[]]; learner: { knows: string[]; misconceptions: string[]; review?: string[] }; domains: [string, ...string[]] }`, `Objective = { id: string; text: string }`.
- `model<P extends Params, O>(defaults: P, fn: (p: P) => O, src: string | { illustrative: true }): Model<P, O>`. `src`는 필수.
- `figure(frame: Frame, draw: (m: Outputs, t: number, ctx: { step: number; params: Params }) => MarkTree): Figure`. `FigKey`는 `figures`의 키. draw의 `m`은 TS 추론 한계로 `Record<string, any>`다(draw는 lesson의 models보다 먼저 검사된다). 그 밖의 `Outputs` 사용처(scene·quiz Text 함수, goal.done, drag answer, summary.say)는 model별 정확한 타입이다. draw의 실행 오류는 stub figure 평가(FR-15)가 잡는다.
- `custom(opts: { id: string; why: string; bounds: [P, P] }, render: (ctx: { h: H; m: Outputs; t: number }) => VNode | VNode[]): Mark`, `H = (tag: string, attrs?: Record<string, string | number>, ...children: (VNode | string)[]) => VNode`.

## checks
- `Expect = number | boolean | [lo: number, hi: number] | { lt: number } | { gt: number } | { lt: number; gt: number }`.
- `Check = { id?: string; model: <models의 키>; at?: Partial<그 model의 Params>; expect: Expect | Partial<Record<<그 model 출력의 키>, Expect>>; tol?: number; rel?: number; value?: (o: <그 model 출력>, run: (at: Partial<Params>) => <그 model 출력>) => number | boolean; limit?: string; source?: string }`.
- 타입 층: `model`이 `models`의 키가 아니면 오류. `expect`가 number이면 `tol` 또는 `rel`이 필수. `checks`를 `models`보다 먼저 써도 위 두 규칙과 `value` 인자 타입이 추론된다.

## frames
- `cartesian(o: { x: Axis; y: Axis; aspect?: "equal"; log?: "x" | "y" | "xy"; camera?: (m: Outputs, t: number) => { x: [number, number]; y: [number, number] } } & TimeSpec): Frame`
- `polar(o: { r: Axis; theta?: [number, number]; ring?: boolean } & TimeSpec): Frame`
- `lanes(o: { time: Axis; lanes: string[] } & TimeSpec): Frame`
- `graph(o: { layout: "tree" | "layered" | "force" | "sankey"; direction?: "down" | "right" } & TimeSpec): Frame`
- `cells(o: { cols: number; rows: number } & TimeSpec): Frame`
- `space3d(o: Space3dOpts & TimeSpec): Frame` (`Space3dOpts = { x: Axis; y: Axis; z: Axis; view?: { yaw: number; pitch: number }; projection?: "ortho" | "perspective" }`)
- `geo(o: GeoOpts & TimeSpec): Frame` (`GeoOpts = { projection: "equalEarth" | "mercator" | "orthographic"; region?: string }`)

## marks (모든 좌표는 frame 데이터 단위)
- `axis(which: "x" | "y" | "r" | "theta" | "time", o?: { label?: Text; ticks?: number | number[] } & MarkOpts)`
- `grid(o?: { x?: number | number[]; y?: number | number[] } & MarkOpts)`
- `legend(entries: { tone: Tone; text: Text }[], o?: { at?: P } & MarkOpts)` (tone과 글을 짝지은 범례)
- `line(pts: P[], o?: { curve?: "linear" | "smooth" | "step"; dash?: boolean } & MarkOpts)`
- `area(pts: P[], o?: { base?: number } & MarkOpts)`
- `dot(at: P, o?: MarkOpts)`, `rect(from: P, to: P, o?: MarkOpts)`, `arrow(from: P, to: P, o?: MarkOpts)`, `circle(center: P, radius: number, o?: MarkOpts)` (radius는 x축 데이터 단위)
- `arc(center: P, radius: number, degrees: [start: number, end: number], o?: { sector?: boolean } & MarkOpts)` (각도는 +x에서 반시계, sector면 중심까지 닫은 부채꼴)
- `path(cmds: PathCmd[], o?: MarkOpts)`, `PathCmd = ["M", x, y] | ["L", x, y] | ["Q", cx, cy, x, y] | ["C", c1x, c1y, c2x, c2y, x, y] | ["A", rx, ry, rotationDeg, largeArc: 0 | 1, sweep: 0 | 1, x, y] | ["Z"]` "A"의 sweep=1은 데이터 좌표(y 위쪽)에서 반시계 방향이다.
- `label(at: P, text: Text, o?: { anchor?: "c" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"; leader?: P } & MarkOpts)`
- `dim(from: P, to: P, text: Text, o?: MarkOpts)`, `brace(from: P, to: P, text: Text, o?: MarkOpts)`
- `angle(vertex: P, from: P, to: P, o?: { text?: Text } & MarkOpts)`
- `node(id: string, text: Text, o?: { at?: P; shape?: "box" | "round" | "circle"; group?: string } & MarkOpts)`
- `edge(from: string, to: string, o?: { text?: Text; value?: number; directed?: boolean } & MarkOpts)`
- `cell(col: number, row: number, o?: { value?: number; text?: Text } & MarkOpts)`
- `field(f: (x: number, y: number) => number | P, o?: { as?: "color" | "arrows"; density?: number } & MarkOpts)`
- `glyph(name: string, at: P, o?: { rotate?: number; scale?: number } & MarkOpts)`, `icon(name: string, at: P, o?: MarkOpts)`
- `math(at: P, tex: string, o?: MarkOpts)`, `code(at: P, source: string, o?: { lang?: string; highlight?: number[] } & MarkOpts)`
- `mock(kind: "browser" | "phone" | "window", box: [P, P], children: MarkTree, o?: { title?: Text } & MarkOpts)`

## motion, composition
- `trace(s: Series, t: number, o?: { trail?: boolean; head?: boolean; dims?: [number, number] } & MarkOpts): MarkTree`
- `flow(pts: P[], o: { n: number; rate: number; seed: number; t: number } & MarkOpts): MarkTree`
- `sweep(axis: "x" | "y", at: number, o?: { width?: number } & MarkOpts): Mark` (width는 데이터 단위)
- `inset(figure: FigKey, o: { source?: [P, P]; at: [P, P] } & MarkOpts): Mark` (source가 있으면 그 영역을 확대하고 원래 자리와 연결선을 긋는다. 없으면 그 figure 전체를 축소판으로 넣는다)
- `split(figures: [FigKey, FigKey], o?: { link?: string }): Figure` (두 하위 figure는 같은 t, step, scene params·knob 값, reveal·focus 목록을 받는다. mark id는 두 하위 figure를 합쳐 유일해야 한다. link는 model param 이름 또는 mark id이고 두 쪽에서 같은 강조로 표시된다)
- `multiples(figure: FigKey, o: { over: Record<string, Array<number | string | boolean>> }): Figure` (over의 키는 model param이어야 한다. 사본마다 그 값으로 model을 평가하고 같은 frame·축을 쓴다. t, step, knob 값은 모든 사본이 공유한다)

## helpers
- `ode(f: (t: number, y: number[]) => number[], y0: number[], span: [t0: number, t1: number], dt: number, o?: { event?: (t: number, y: number[]) => number }): Series`
- `Series = { points: { t: number; y: number[] }[]; at(t: number): number[]; until(t: number): { t: number; y: number[] }[]; end: { t: number; y: number[] }; xy(i?: number, j?: number, upTo?: number): P[] }`
- `rng(seed: number): () => number` (mulberry32, seed>>>0; runtime과 stub이 같은 수열을 낸다)
- `argmax(f: (x: number) => number, range: [number, number], o?: { tol?: number }): { x: number; y: number }`
- `root(f: (x: number) => number, range: [number, number], o?: { tol?: number }): number`
- `sample(rand: () => number, n: number, dist: { normal: [mu: number, sigma: number] } | { uniform: [a: number, b: number] }): number[]`
- `histogram(values: number[], o: { bins: number; range: [number, number] }): { x0: number; x1: number; count: number }[]`
- `interpolate(xs: number[], ys: number[], x: number): number`

## scenes (객체 리터럴, `type` 판별)
- `Section = { concept: Concept; scenes: Scene[] }`, `Concept = { id: string; title: string; definition: string; level: 1 | 2 | 3 | 4 | 5; requires?: string[]; leadsTo?: string[] }`
- `Scene = Hook | Predict | Define | Explain | Steps | Explore | Compare | QuizScene`
- `Explain = { type: "explain"; title: Text; say: Text; figure: FigKey; focus: string[]; params?: Params }` (설명 장면: 그림과 글)
- `Hook = { type: "hook"; title: Text; say: Text; figure: FigKey; focus: string[]; params?: Params }`
- `Predict = { type: "predict"; title: Text; ask: Text; figure: FigKey; focus: string[]; params?: Params; input: ChoiceInput | DragInput | DrawInput; reveal: { say: Text; marks?: string[]; figure?: FigKey; params?: Params }; targets?: string }` reveal.figure는 확정 뒤 보이는 답 그림, reveal.params는 확정 뒤 figure에 적용할 params. drag·draw 입력의 학습자 답은 runtime이 mark id "guess"로 그림에 겹쳐 그린다.
- `ChoiceInput = { kind: "choice"; options: Option[] }`, `Option = { text: Text; correct: true; params?: Params } | { text: Text; feedback: Text; params?: Params }` (params는 그 선택지를 고르는 동안 figure에 적용된다)
- `DragInput = { kind: "drag"; mark: string; axis: "x" | "y"; answer: (m: Outputs) => number; tol: number }`
- `DrawInput = { kind: "draw"; x: [number, number]; answer: string; tol: number }` (`answer`는 정답 곡선 mark id)
- `Define = { type: "define"; term: string; definition: Text; figure?: FigKey; focus: string[] }`
- `Steps = { type: "steps"; title: Text; figure: FigKey; steps: { say: Text; focus: string[] }[] }`
- `Explore = { type: "explore"; title: Text; say: Text; figure: FigKey; focus: string[]; knobs: Record<string, [min: number, max: number, step?: number] | { range: [number, number]; step?: number; log?: true } | string[] | boolean>; handles?: { mark: string; x?: string; y?: string }[]; goal?: { say: Text; done: (m: Outputs) => boolean } }` handles: mark를 끌면 그 mark의 데이터 좌표 x·y가 각각 지정한 model param 값이 된다(knob 범위 또는 frame 축 범위로 제한).
- `Compare = { type: "compare"; title: Text; say: Text; figure: FigKey; focus: string[]; a: Params; b: Params; labels: [Text, Text] }`
- `QuizScene = { type: "quiz"; items: [QuizItem, ...QuizItem[]] }`
- `QuizItem = { kind: "choice"; prompt: Text; options: Option[]; objective: string; transfer?: true; figure?: FigKey; params?: Params; reveal?: QuizReveal } | { kind: "numeric"; prompt: Text; answer: number | { check: string }; tol: number; unit: string; objective: string; transfer?: true; figure?: FigKey; params?: Params; reveal?: QuizReveal } | { kind: "order"; prompt: Text; items: Text[]; objective: string; transfer?: true } | { kind: "classify"; prompt: Text; bins: string[]; items: { text: Text; bin: string }[]; objective: string; transfer?: true }`
- `QuizReveal = { say?: Text; marks?: string[]; figure?: FigKey; params?: Params }` (choice·numeric 제출 뒤 공개)

## stub `packages/runtime/dev/spec-stub.mjs` (ES module)
- `export function createApi(): { api: Api; usage: Map<string, number> }`
- `export function load(factory: LessonFactory): { input: LessonInput; run(model: string, params?: Params): unknown }`
- `export function evaluate(factory: LessonFactory, o?: { samples?: number }): Report`
- `Report = { ok: boolean; checks: { index: number; id?: string; pass: boolean; actual?: unknown; expected: unknown; error?: string }[]; deterministic: { model: string; ok: boolean }[]; figureErrors: { figure: string; t: number; step: number; message: string }[]; focusErrors: { section: number; scene: number; step?: number; id: string }[] }`
- CLI: `node packages/runtime/dev/spec-stub.mjs <lesson.js>` → stdout에 Report JSON, 종료 코드 0(ok) / 1(not ok) / 2(불러오기 실패).

## 집계 `bench/coverage/count.mjs`, `bench/coverage/fragment.d.ts`
- `type Fragment = (api: Api) => { models?: Record<string, Model>; figures: Record<string, Figure>; scenes?: Scene[] }` (조각 default export)
- `type AuditRow = { fig: string; src: string; corpus: "shot" | "shot-extra" | "lesson" | "new-b1" | "new-b2"; domain: string; props: Prop[]; verdict: "V" | "C" | "G" | "X" | "N"; custom: string[]; candidates: string[]; reason?: string }` (조각의 `export const audit: AuditRow[]`)
- `type Prop = { id: string; cat: "Q" | "G" | "T" | "I" | "E" | "S" | "X"; text: string; essential: boolean; why: string; status: "kept" | "approx" | "lost" | "custom" | "ambiguous"; by?: string; diff?: string }`
- `export function wilson(k: number, n: number, z?: number): [number, number] | null`
- `export async function aggregate(dir: string): Promise<Summary>`, `Summary = { corpora: Record<string, { V: number; C: number; G: number; X: number; N: number; ratio: number | null; wilson: [number, number] | null }>; usage: { total: Record<string, number>; byCorpus: Record<string, Record<string, number>> }; candidates: { text: string; count: number; domains: string[]; promoted: boolean }[] }`
- CLI: `node bench/coverage/count.mjs <dir> --out <outDir>` → `<outDir>/figures.tsv`, `<outDir>/summary.json`. 종료 코드 0 / 1(검증 실패) / 2(사용법 오류).

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `lesson.d.ts`는 Signatures의 모든 `Api` 멤버와 공용·scene·quiz 타입을 정의하고, 지정자 `"ltt"`로 import된다 | must | intent 인포그래픽 계약, ADR 3c44a1f9 |
| FR-2 | 수업 파일 형태는 import 없는 팩토리 default export이며 `@type {import("ltt").LessonFactory}`로 검사된다 | must | intent 핵심 결정 5 |
| FR-3 | 타입 층에서 거부한다: 피드백도 correct도 없는 선택지, tol·rel 없는 number expect, `models`에 없는 check model 키, src 없는 model, TimeSpec 없음·중복, unit 없는 Axis, MarkOpts의 px·색·style·className·fontSize, 알 수 없는 scene type, 필수 focus 누락, `document`·`window` 참조, why 없는 custom, 빈 objectives, unit·tol 없는 numeric 문항, answer 없는 draw 입력, 빈 quiz scene | must | intent check 문법, v1 결함(빈 버튼) |
| FR-4 | `checks`를 `models`보다 먼저 써도 check의 model 키 검사와 `value` 인자 타입 추론이 된다 | must | intent "checks 먼저" |
| FR-5 | core는 `space3d`·`geo`를 ext 파일 타입을 import해 한 줄로만 선언한다 | must | intent 표현 범위 |
| FR-6 | `lesson.d.ts`의 JSDoc은 영어로, 타입이 말하지 못하는 제약(단위·좌표 공간, 시간 영역, runtime 소유 동작, 이름만으로 안 보이는 뜻)만 적는다 | must | AGENTS.md 주석 규칙 |
| FR-10 | `createApi()`의 api는 모든 `Api` 멤버를 구현한다. helper는 계산하고, 나머지는 `{ kind: <멤버 이름>, args: [...인자], id?: string }` 기술자를 돌려준다. `id`는 node는 첫 인자, edge는 `o.id ?? "<from>-><to>"`, 그 밖은 마지막 객체 인자의 `id` | must | 측정 도구 |
| FR-11 | `usage`는 api 멤버별 호출 횟수를 센다 | must | M1 우선순위 입력 |
| FR-12 | `load(factory)`는 factory를 createApi의 api로 실행해 `lesson()`에 넘긴 input과, defaults에 params를 합쳐 model fn을 실행하는 `run`을 돌려준다. 알 수 없는 model 이름은 `Error` | must | 예시 검산 |
| FR-13 | `evaluate`는 check마다: at을 defaults에 합쳐 model을 실행한다. `value`의 `run(x)`는 defaults ← check.at ← x 순으로 합친 params로 실행한다. `value`가 있으면 그 반환값을 실제값으로, 없으면 출력(객체 expect는 키별)을 쓴다. number는 \|실제−기대\| ≤ tol + ε 또는 ≤ rel·\|기대\| + ε (ε = 1e-12·max(1, \|기대\|), 부동소수 오차 흡수), `[lo,hi]`는 양끝 포함, `lt`·`gt`는 엄격, boolean은 같음. 객체 expect 안의 number는 check에 tol·rel이 없으면 그 check의 error("tol or rel required") | must | intent checks |
| FR-14 | `evaluate`는 model마다 defaults로 두 번 실행해 결과가 구조적으로 같은지 `deterministic`에 적는다(Series는 points 비교) | must | D5 결정성 |
| FR-15 | `evaluate`는 figure마다 t 표본에서 draw를 실행한다. loop: span [a,b]의 a+(b−a)k/S, k=0..S. steps: step i=0..n−1(t=i, ctx.step=i). idle: k/S, k=0..S−1. static: t=0. S = samples(기본 5). model 출력은 defaults로 구하고, ctx.params는 모든 model defaults를 하나로 합친 객체다. 예외, 또는 반환 기술자 args 안의 NaN·±Infinity(중첩 배열·객체 포함, 함수 인자는 실행하지 않음)는 figureErrors | must | intent 시간 |
| FR-16 | `evaluate`는 scene(explain 포함)의 focus id(steps는 단계별)가 그 scene figure의 어느 표본에서든 나온 기술자 id 집합에 있는지 본다. split·multiples는 하위 figure의 합집합이다. 없으면 focusErrors | must | intent focus |
| FR-17 | `Report.ok` = 모든 check pass ∧ 모든 deterministic ok ∧ figureErrors·focusErrors·bindingErrors 없음 | must | — |
| FR-20 | `evaluate`는 Report에 `bindingErrors: { section: number; scene: number; id: string; message: string }[]`를 더한다(lesson 수준 항목은 section·scene = -1). 항목: explore handles의 mark가 그 figure 기술자 id에 없음; handles의 x·y, knobs의 키, multiples over의 키가 어느 model defaults에도 없는 param; split link가 mark id도 model param도 아님; predict reveal.figure·quiz reveal.figure·summary.figures가 figures에 없음 | must | pilot 빈틈 2·3·6 |
| FR-18 | stub CLI는 Report JSON을 출력하고 ok면 0, 아니면 1로 끝난다. 파일 없음·default export가 함수가 아님이면 stderr에 이유를 쓰고 2로 끝나며 stdout은 비운다 | must | — |
| FR-19 | helper: `ode`는 고정 간격 RK4다. event 값이 양(≥0)에서 음으로 바뀌면 두 단계 사이를 e_k/(e_k−e_{k+1}) 비율로 선형 보간한 점을 마지막 점으로 두고 멈춘다. `Series.at`은 선형 보간(범위 밖은 끝값), `until(t)`는 t 이하 점과 t에서의 보간점, `end`는 마지막 점, `xy(i=0,j=1,upTo)`는 2D 점 배열. `rng`는 mulberry32(seed>>>0)로 [0,1)을 낸다. `argmax`는 단봉 f에서 \|x−x*\| ≤ tol(기본 (hi−lo)·1e-4)인 황금분할 탐색. `root`는 이분법. `sample`의 normal은 Box–Muller. `histogram`은 range 밖 값을 빼고 마지막 구간은 상한을 포함한다. `interpolate`는 오름차순 xs의 선형 보간이고 범위 밖은 끝값 | must | intent 모델 도우미 |
| FR-30 | `aggregate`는 dir 아래(하위 디렉터리 포함) `*.js` 조각마다 `audit`를 읽고, 행을 corpus별로 V·C·G·X·N으로 센다. ratio = (C+G)/(V+C+G), 분모가 0이면 null. wilson은 k=C+G, n=V+C+G, z=1.96 | must | 감사 지표 |
| FR-31 | `wilson(k,n,z=1.96)`는 Wilson 점수 구간을 돌려주고 n=0이면 null | must | — |
| FR-32 | 행 검증: kept는 `by`가 비지 않음, approx는 `diff`가 비지 않음. verdict C ⇔ custom 비어 있지 않음. G ⇔ custom 비어 있고 필수 속성 중 lost 또는 ambiguous가 있음. V ⇔ custom 비어 있고 필수 속성이 모두 kept 또는 approx. X·N은 `reason`이 비지 않음(조건 검사 없음). 위반은 검증 오류 | must | 판정 규칙 |
| FR-33 | 조각 소스에 `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `{any}`, `{*}`가 있으면 검증 오류 | must | 반증 가능성 |
| FR-34 | 조각 default export를 createApi로 실행하고, 이어서 조각의 model을 defaults로 실행한 출력으로 각 figure의 draw를 한 번(loop면 span 시작, 아니면 t=0, step 0) 실행한 usage를 더한다. 한 조각의 usage는 그 조각 audit 행에 나오는 서로 다른 corpus마다 더하고 전체에는 한 번 더한다. Summary.corpora에는 행에 나온 corpus만 둔다. candidates는 count 내림차순, 같으면 text 오름차순 | must | M1 우선순위 |
| FR-35 | candidates는 앞뒤 공백 제거·소문자로 정규화해 센다. 3행 이상이고 서로 다른 domain이 2개 이상이면 promoted | must | 승격 규칙 |
| FR-36 | CLI는 검증이 모두 통과한 뒤에만 `figures.tsv`(머리줄 `corpus	domain	fig	src	verdict	custom	lost_essential`)와 `summary.json`을 쓴다. 검증 실패는 stderr에 `<파일>: <이유>`를 줄마다 쓰고 1로 끝나며 출력 파일을 만들거나 덮지 않는다. dir 없음·`--out` 없음은 2 | must | — |
| FR-40 | 예시 수업 `projectile-drag.js`: bench/topics.md projectile-drag의 상황·진단을 쓴다. sections 4개(진단 사다리 4단), 장면 수(Σ sections[].scenes.length + 2) 18–24. scene type hook·predict·define·explain·steps·explore·compare·quiz 각 1개 이상. predict 입력 choice·drag·draw 각 1개 이상, `targets`가 `meta.learner.misconceptions[0]`과 같은 predict 1개 이상. 절마다 마지막 scene은 quiz. 최종 quiz에 choice·numeric·order·classify 각 1개 이상과 transfer 1개 이상. check 형태 number+tol/rel, 범위, 관계(lt/gt), `limit` 각 1개 이상. src가 문자열인 model마다 `limit` check 1개 이상. illustrative model 1개 이상. glossary 3개 이상. explore에 knobs와 goal. figure TimeSpec loop·steps·static 각 1개 이상. 함수 Text 1개 이상. custom 0개. 내용은 한국어 | must | intent M0, 사용자 결정(분량) |
| FR-41 | 예시 수업 model 이름과 params: `flight` {v0, deg, vt, drag} → {range, time, path: Series}, a = (0, −9.8) − (9.8/vt²)\|v\|v(drag=false면 항력 없음), 지면 출발·착지. `best` {v0, vt} → {deg, range}(항력 있는 최적각). `fall` {vt} → {v: Series}(정지 낙하 속력) | must | 독립 oracle(아래 Cases) |
| FR-42 | 예시 수업이 stub `evaluate`에서 ok | must | — |
| FR-50 | `rules.md`는 열 `id \| 규칙 \| 근거 \| 강제 층(type/check/runtime) \| 예시 수업 고의 결함 \| 상태`의 표이고, 다음 ID를 모두 담는다: first-scene, section-count, scene-count, predict-before-explain, section-quiz, final-quiz-count, misconception-predict, predict-reveal-hidden, focus-required, focus-unknown-id, accent-focus-only, quiz-objective, quiz-distractor-feedback, quiz-transfer, term-defined-before-use, term-unknown, model-limit-check, check-tol-required, provenance, illustrative-label, model-pure, figure-or-none, time-declared, custom-why, custom-bounds, id-unique, data-in-domain, text-length, goal-reachable, goal-at-start, input-binding, figure-eval, handle-binding, multiples-param, reveal-figure-exists, legend-for-series. 모든 행의 칸이 비지 않는다. text-length 행은 잠정 상한(제목 40자, 장면 본문 160자, 선택지 50자)을 적는다 | must | intent check 문법, M2 입력 |
| FR-60 | 범위 감사(R1)는 감사 시작 전 확정한 `bench/coverage/protocol.md`를 따른다: 그림 단위, 속성 범주, 필수 속성(shot은 beats·principle), 판정 V/C/G/X/N, held-out 분할(생명과학·음악은 batch 1, 나머지 10분야는 seed 고정 무작위로 batch 1에 4개·batch 2에 6개), Stage A 설계자는 어휘·d.ts·kit·look.md를 보지 않음, 반박 표본, 승격 규칙, batch 2가 10% 초과 시 사용자 선택. protocol.md의 sha256을 report.md에 적는다 | must | 사용자 결정(pilot, 분야 12개) |
| FR-61 | 감사는 pilot(shot s01·s13·s27·s38·s50·s51, gallery drawing-basics, 생명과학·음악 각 2주제, 반박) 뒤 사용자 게이트를 거쳐 전체로 간다. 감사 서브에이전트는 model opus, effort low | must | 사용자 결정 |
| FR-62 | batch 1까지의 감사 결과로 어휘를 개정할 때는 승격된 후보, ambiguous 해소, 예시 수업에서 드러난 수업 층 문제만 반영하고, 개정 뒤 모든 조각을 다시 tsc한다(기계적 수정만 허용). batch 2는 개정된 계약으로만 감사한다 | must | held-out 원칙 |
| FR-63 | 새 분야 24주제를 bench/topics.md 형식(상황·배경·진단 사다리·오개념)으로 `bench/topics.md`에 더한다 | should | M3 bench 재사용 |
| FR-64 | intent.md에 M0 결과와 정의(series 색, 절 quiz, 장면 수 세는 법, loop 시간 대응, concept 필드, 글 상한 잠정값, predict drag/draw 정답 표현, artifact 제약, 측정된 범위 비율)를 반영한다 | should | Plan 검토 지적 |

# Errors
- stub CLI: 파일 없음 또는 default export가 함수 아님 — stderr 한 줄 이상, 종료 코드 2, stdout 비어 있음 — 아무 파일도 쓰지 않음.
- `load().run`: 알 수 없는 model 이름 — `Error` throw(메시지에 이름) — 상태 변화 없음.
- `evaluate`: check의 model 키가 없음 — 그 check `pass:false`, `error` 문자열 — 나머지 check는 계속 평가.
- `evaluate`: 객체 expect 안 number인데 tol·rel 없음 — 그 check `pass:false`, error "tol or rel required" — 계속.
- `evaluate`: draw가 throw하거나 NaN·Infinity — figureErrors 항목, `ok:false` — 나머지 figure 계속.
- `ode`: dt ≤ 0 또는 span[1] ≤ span[0] — `RangeError` — 반환 없음.
- `root`: f(lo)·f(hi)가 같은 부호 — `RangeError` — 반환 없음.
- `histogram`: bins < 1 또는 range[1] ≤ range[0] — `RangeError`.
- count CLI: 조각 검증 실패(import 실패(문법 오류 등), audit 없음, 알 수 없는 verdict·corpus·status, FR-32·33 위반, default export가 함수 아님, factory 실행 예외) — stderr `<파일>: <이유>`, 종료 코드 1 — 출력 파일을 만들거나 덮지 않음.
- count CLI: dir 없음 또는 `--out` 없음 — stderr 사용법, 종료 코드 2 — 출력 없음.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | Signatures의 각 Api 멤버를 쓰는 최소 수업 fixture(`checks`가 `models`보다 앞) | tsc 오류 0 |
| C-2 | error | FR-3의 각 오용을 하나씩 담은 fixture에 `// @ts-expect-error` | 각 줄에서 tsc 오류(없으면 tsc 실패) |
| C-3 | normal | check {expect 40.8, tol 0.2}, model 출력 40.77 | pass |
| C-4 | boundary | \|실제−기대\| = tol 정확히 / tol보다 1e-9 큼 | pass / fail |
| C-5 | boundary | 범위 [1,2]에 1, 2, 2+1e-9 | pass, pass, fail |
| C-6 | boundary | {lt: 45}에 45 / 44.999 | fail / pass |
| C-7 | normal | rel 0.01, 기대 100, 실제 100.9 / 101.1 | pass / fail |
| C-8 | normal | value 함수가 run으로 두 at을 비교해 boolean | 그 boolean과 expect 비교 |
| C-9 | error | 객체 expect {range: 40.8}, tol·rel 없음 | 그 check error "tol or rel required", ok false |
| C-10 | error | Math.random을 쓰는 model | deterministic ok:false, Report.ok false |
| C-11 | normal | loop span [0,4], samples 2 | draw가 t=0,2,4로 호출 |
| C-12 | normal | steps ["a","b","c"] | draw가 (t,step)=(0,0),(1,1),(2,2)로 호출 |
| C-13 | normal | idle, samples 4 / static | t=0,0.25,0.5,0.75 / t=0 한 번 |
| C-14 | error | draw가 NaN 좌표를 냄 / throw | figureErrors 항목, ok false |
| C-15 | error | focus에 없는 id | focusErrors 항목 |
| C-16 | normal | y'=−y, y0=[1], span [0,1], dt 0.01 | \|at(1)[0] − e^{−1}\| ≤ 1e-8 |
| C-17 | normal | 자유낙하: 상태 [높이, 속도], f = (t,y) => [y[1], −9.8], y0=[10, 0], span [0, 5], dt 0.001, event (t,y) => y[0] | 마지막 점 t ≈ √(20/9.8) = 1.428571(±1e-5), y[0] ≈ 0(±1e-9) |
| C-18 | normal | rng(7) 두 번 10개 / rng(7) vs rng(8) | 같은 수열, 모두 [0,1) / 첫 10개가 다름 |
| C-19 | normal | argmax(−(x−3)², [0,10]) | \|x−3\| ≤ 1e-3 |
| C-20 | error | root(x²+1, [−1,1]) | RangeError |
| C-21 | boundary | histogram([0, 5, 10, 10.0001], bins 2, range [0,10]) | counts [1, 2](5는 둘째 구간, 10 포함, 10.0001 제외) |
| C-22 | boundary | interpolate([0,1],[0,10], −1 / 0.5 / 2) | 0 / 5 / 10 |
| C-23 | normal | wilson(5, 50) | [0.0435, 0.2136] (±1e-4) |
| C-24 | boundary | wilson(0, 20) / wilson(3, 0) | 하한 0(±1e-9), 상한 0.1611(±1e-4) / null |
| C-25 | error | verdict V인데 필수 속성 lost | 검증 오류, 종료 1, 출력 없음 |
| C-26 | normal | V 8 · C 1 · G 1 · X 2 행 | ratio 0.2, X 2는 분모 밖 |
| C-27 | boundary | 후보 "warp" 2행·2domain / 3행·1domain / 3행·2domain | promoted false / false / true |
| C-28 | error | 조각 소스에 `@ts-ignore` | 검증 오류 |
| C-29 | edge | 출력 디렉터리에 이전 summary.json이 있고 검증 실패 | 이전 파일 내용 그대로 |
| C-30 | error | stub CLI에 없는 파일 | 종료 2, stdout 빈 문자열 |
| C-31 | normal | 예시 수업 `run("flight", {v0:40, deg:45, vt:20, drag:true})` | range 48.07(±0.05), time 3.829(±0.005) |
| C-32 | normal | flight drag 30° / 36° / 60° / 15° (v0 40, vt 20) | 48.77 / 49.58 / 39.10 / 38.55 (±0.05) |
| C-33 | normal | flight drag:false, v0 40, deg 45 / 30 | range 163.27 / 141.39 (±0.05), time 5.772 / 4.082 (±0.005) |
| C-34 | normal | best {v0, vt} = {40,20} / {20,20} / {10,20} / {100,20} | deg 36.2 / 41.0 / 43.7 / 29.3 (±0.2) |
| C-35 | normal | fall {vt 20}의 v.at(1)[0] / at(2) / at(3) | 9.08 / 15.06 / 17.99 (±0.01) |
| C-36 | normal | 예시 수업 evaluate | ok true |
| C-37 | normal | 예시 수업 구조(FR-40 항목 전부) | 모두 충족 |
| C-38 | edge | 예시 수업을 Node `import()` | 성공, 소스에 `import ` 문 없음 |
| C-39 | normal | rules.md | FR-50의 ID 전부, 빈 칸 없음 |
| C-40 | normal | 범위 감사(R1) 완료 | report.md에 말뭉치별 비율·구간, batch 2 ≤ 10% |
| C-41 | error | explore handles [{mark:"h", x:"q"}]인데 figure에 id "h" 없음 / model defaults에 q 없음 | 각각 bindingErrors 1, ok false |
| C-42 | error | multiples over {zz:[1,2]}, zz는 어느 model param도 아님 | bindingErrors 1 |
| C-43 | normal | explain scene의 focus가 figure mark id에 있음 / 없음 | focusErrors 0 / 1 |
| C-44 | error | predict reveal.figure가 figures에 없는 키 | bindingErrors 1 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 계약 완전성, stub·집계의 정확성 |
| Performance efficiency | yes | 생성 agent가 읽는 계약·예시의 크기가 매 수업 비용이 된다 |
| Compatibility | yes | 같은 수업 텍스트가 Node와 브라우저(inline module)에서 돌아야 한다. M0은 Node 쪽과 DOM 비의존만 검증 |
| Interaction capability | yes | 계약의 사용자는 생성 agent다. 오용을 타입이 막는 것(user error protection) |
| Reliability | yes | 집계·stub이 잘못된 입력에서 조용히 틀린 결과를 내지 않아야 한다 |
| Security | no | 로컬 개발 도구가 신뢰된 로컬 파일만 실행한다. 네트워크·비밀 없음 |
| Maintainability | yes | core/ext 분리, 주석 규칙, 측정 도구의 테스트 가능성 |
| Flexibility | yes | 계약이 v1 밖 분야에 적응하는지(범위 감사)가 M0의 핵심 질문 |
| Safety | no | 물리적·인적 위해 경로 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Functional suitability / completeness | Api 멤버 | 양성 fixture가 사용한 멤버 수 ÷ Signatures 멤버 수(48) | = 100% | automated(tsc), mutation | UI-1 |
| QR-2 | Functional suitability / correctness | helper 수치, 예시 model | C-16–C-22, C-31–C-35의 허용 오차 | 전부 이내 | automated, mutation | UI-4 |
| QR-3 | Performance efficiency / resource utilization | 생성 agent context | `lesson.d.ts` UTF-8 바이트 / 예시 수업 바이트 | ≤ 21,000 B / ≤ 18,432 B | automated; review(R3에 count_tokens 측정값 또는 "근사") | intent 목표 수치 |
| QR-4 | Compatibility / interoperability | 수업 텍스트 | 예시·fixture의 Node `import()` 성공, `import ` 문 0, lib es2022(DOM 없음) tsc 통과 | 전부 | automated | intent 제공 경로 |
| QR-5 | Interaction capability / user error protection | FR-3 오용 16종 | 음성 fixture가 tsc 오류를 낸 종류 수 ÷ 16 | = 100% | automated, mutation | UI-1 |
| QR-6 | Reliability / faultlessness | count·stub CLI 잘못된 입력 | Errors의 각 조건에서 종료 코드·stderr·출력 파일 상태 | 명세와 일치 100% | automated, mutation | — |
| QR-7 | Maintainability / modularity | core/ext | ext 2파일 존재, core가 import 한 줄로만 선언 | 충족 | automated(파일·문자열), review(R3) | FR-5 |
| QR-8 | Maintainability / analysability | `lesson.d.ts` JSDoc | 한글 문자 수, JSDoc 블록별 단어 수, 주석 규칙 위반 수 | 0, ≤ 25, 0 | automated(앞 둘), review(R3) | AGENTS.md |
| QR-9 | Maintainability / testability | spec-stub.mjs, count.mjs | node test coverage 분기·줄 | 분기 ≥ 80%, 줄 ≥ 90% | automated(Test command 임계값) | — |
| QR-10 | Flexibility / adaptability | 범위 감사 | (C+G)/(V+C+G): batch 2(held-out), shot 49, gallery 그림; 반박률 = 반박된 표본 V ÷ 표본 V | batch 2 ≤ 10%; shot·gallery 각 ≤ 10%(하한 보고); 반박률 ≤ 10% | review(R1) | UI-2 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, FR-2, FR-4, QR-1, C-1 | 양성 fixture, tsc | unit(타입), 멤버마다 1회 이상 | equivalence partitioning | Api 멤버 48개, scene type 8개, quiz kind 4개, TimeSpec 4종, loop warp·once, handles·log knob·reveal.figure·QuizReveal·Option params, checks-before-models 1 | 100% | tsc 오류 0 | Test command |
| VO-2 | FR-3, QR-5, C-2 | 음성 fixture, tsc | unit(타입), 오용 종류마다 1 fixture | syntax testing | FR-3 오용 16종 N1–N16(나열 순서) | 100% | `@ts-expect-error` 줄마다 오류 | Test command |
| VO-3 | FR-13, C-3–C-9 | evaluate check 판정 | unit | decision table + boundary value analysis(2-value) | 결정표 행: number+tol, number+rel, 범위, lt, gt, lt+gt, boolean, 객체 키별, value 함수, value의 run 병합 순서(defaults ← check.at ← x), 객체 내 number 무 tol, 알 수 없는 model; 경계: tol, 범위 양끝, lt·gt 경계 | 100% | Cases 기대값 | Test command |
| VO-4 | FR-14, FR-15, FR-16, FR-17, FR-20, C-10–C-15, C-41–C-44 | evaluate 결정성·figure·focus | unit | equivalence partitioning | loop, steps, idle, static, throw, NaN, Infinity, 중첩 NaN, focus 있음/없음, steps 단계 focus, split 합집합, 비결정 model, explain focus, binding: handle mark 없음·handle param 없음·knob 키 없음·multiples 키 없음·split link 없음·predict reveal.figure 없음·quiz reveal.figure 없음·summary figure 없음·모두 정상 | 100% | Report 필드 | Test command |
| VO-5 | FR-10, FR-11, FR-12 | createApi·load | unit | equivalence partitioning | 기술자 kind/args/id 규칙(node, edge 기본·지정, 일반, circle·legend 포함), usage 증가, load input, run 병합, run 알 수 없는 이름 | 100% | 반환값·throw | Test command |
| VO-6 | FR-19, C-16–C-22, Errors(ode, root, histogram) | helper | unit | boundary value analysis(2-value) + equivalence partitioning | ode 정확도, event 보간, ode RangeError 2종, Series.at 안·밖, until, end, xy, rng 결정성·범위·seed 차이, argmax, root 정상·RangeError, sample normal 평균(n=10000, \|평균−mu\| ≤ 0.05σ)·uniform 범위, histogram 경계 3, histogram RangeError, interpolate 3 | 100% | Cases 기대값 | Test command |
| VO-7 | FR-18, C-30, QR-6 | stub CLI | integration(child process) | equivalence partitioning | 종료 0, 1, 2(없는 파일), 2(default가 함수 아님) | 100% | 종료 코드, stdout, stderr | Test command |
| VO-8 | FR-30–FR-35, C-23–C-28 | aggregate·wilson·검증 | unit | decision table + boundary value analysis | FR-32 행 V/C/G/X/N 각 합법·위반, kept 무 by, approx 무 diff, FR-33 토큰 5, wilson C-23·C-24, ratio null, 승격 경계 3, usage 합산(models 있는 조각의 draw 안 mark 포함, 여러 corpus 행), candidates 정렬, 하위 디렉터리, import 실패 | 100% | Summary·오류 | Test command |
| VO-9 | FR-36, C-29, QR-6 | count CLI | integration(child process) | state transition | 성공→출력 생성, 검증 실패→기존 출력 유지, dir 없음→2, --out 없음→2 | 100% | 종료 코드·파일 상태 | Test command |
| VO-10 | FR-40–FR-42, C-31–C-38, QR-2, QR-4 | 예시 수업(black-box: import 후 stub으로 실행) | integration | equivalence partitioning + 독립 oracle | FR-40 체크 항목 전부, C-31–C-35 값 17개, evaluate ok, import 문 0, Node import | 100% | 값·구조 | Test command |
| VO-11 | FR-50, C-39 | rules.md | unit(파일 파싱) | equivalence partitioning | FR-50 ID 36개, 열 6개 비어 있지 않음, text-length 잠정 상한 3개 | 100% | 표 내용 | Test command |
| VO-12 | FR-5, FR-6, QR-3, QR-7, QR-8 | 계약·예시 파일 | unit(파일 검사) | equivalence partitioning | d.ts 바이트, 예시 바이트, 한글 0, JSDoc 단어 ≤ 25, ext 2파일 존재, core에 ext import | 100% | 수치 | Test command |
| VO-13 | QR-9 | spec-stub.mjs, count.mjs | Test command 커버리지 | branch testing, statement testing | 두 파일의 분기·줄 | 분기 ≥ 80%, 줄 ≥ 90% | node 커버리지 임계값 | Test command |
| VO-14 | FR-60–FR-62, QR-10, C-40 | 범위 감사 | review | error guessing(반박) | none — experience-based | none — experience-based | report.md 수치가 임계값 충족, protocol sha256 일치 | R1 |
| VO-15 | FR-40, FR-50 | 예시 수업의 check 층 규칙 | review | equivalence partitioning | rules.md에서 layer=check인 규칙 전부 | 100% | 규칙마다 장면 경로·충족 | R2 |
| VO-16 | FR-6, QR-8 | JSDoc 내용 | review | error guessing | none — experience-based | none — experience-based | 위반 0 | R3 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v1 — approved / vetoed → answer / user answer |
| --- | --- | --- | --- |
| A-1 | M0 전체를 run 1개로 진행. 감사는 review evidence, 어휘 개정은 correction batch | 사용자 답 | user answer |
| A-2 | implementer·test-implementer·test-verifier와 감사 서브에이전트 모두 model opus, effort low | 사용자 답("opus-low") | user answer |
| A-3 | 새 분야 12개: 화학, 생명과학, 지구과학, 의학·생리, 통계, 경제학, 역사, 지리, 언어학, 음악, 법, 운동역학 | 사용자 답 | user answer |
| A-4 | 감사 pilot 뒤 사용자 게이트 | 사용자 답 | user answer |
| A-5 | 범위 판정은 held-out batch 2 기준(≤ 10%), shot·gallery는 하한으로 보고 | intent는 "모든 말뭉치 ≤ 10%"; in-sample은 어휘 설계에 쓰였다 | user answer(held-out 기준) |
| A-6 | 수업 파일 형태: import 없는 팩토리 default export, 타입 지정자 `"ltt"` | Node·로컬·artifact inline에서 같은 텍스트; CSP 실험은 M1 | user answer(팩토리 주입) |
| A-7 | TypeScript 6.0.3 정확 고정 | 7.x는 Go 네이티브 포트로 JSDoc checkJs 동작이 다를 수 있음(미확인) | brief v1 — approved |
| A-8 | JSDoc 영어, 블록당 25단어 이하 | 같은 뜻에 한국어 토큰이 더 큼 | brief v1 — approved |
| A-9 | frame 이름 `cells`(intent의 frame "grid"), mark `grid`는 격자선 | 이름 충돌 회피 | brief v1 — approved |
| A-10 | 장면 수 = Σ sections[].scenes.length + 2(최종 quiz, summary), 18–24 | intent 16–24의 세는 법 미정 | brief v1 — approved |
| A-11 | 예시 수업 oracle: v1 regen-fix2 outline 값(이 run에서 RK4 dt=1e-4로 재현 확인) | 출처는 로컬 measurements(미커밋); spec의 Cases에 값을 옮김 | brief v1 — approved |
| A-12 | 토큰 근사 3.5 B/토큰 → core 21,000 B. count_tokens API를 쓸 수 있으면 R3에 측정값 기록 | 근사 오차 ±15% | brief v1 — approved |
| A-13 | 분기 80%·줄 90% 커버리지(측정 도구 2파일) | 일반적 기준 | brief v1 — approved |
| A-14 | fuzzing·mutation tool 없음, 손 mutation 8–10개 | 도구 미설치 | brief v1 — approved |
| A-16 | 감사 프로토콜 변경: batch 2 전 어휘 개정 최대 2회(pilot 직후 1차), gallery는 나머지 16개 중 seed 20261023 무작위 6개, 반박자만 opus·effort medium | pilot 보고 뒤 사용자 답 | user answer |
| A-15 | 설계 문서를 먼저 커밋하고 그 커밋(4f3c605)을 base_commit으로 한다 | 사용자 답 | user answer |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1, FR-2, FR-4 | C-1 | VO-1 | Test command |
| FR-3 | C-2 | VO-2 | Test command |
| FR-5, FR-6 | — | VO-12, VO-16 | Test command, R3 |
| FR-10–FR-12 | — | VO-5 | Test command |
| FR-13 | C-3–C-9 | VO-3 | Test command |
| FR-14–FR-17, FR-20 | C-10–C-15, C-41–C-44 | VO-4 | Test command |
| FR-18 | C-30 | VO-7 | Test command |
| FR-19 | C-16–C-22 | VO-6 | Test command |
| FR-30–FR-35 | C-23–C-28 | VO-8 | Test command |
| FR-36 | C-29 | VO-9 | Test command |
| FR-40–FR-42 | C-31–C-38 | VO-10, VO-15 | Test command, R2 |
| FR-50 | C-39 | VO-11, VO-15 | Test command, R2 |
| FR-60–FR-62 | C-40 | VO-14 | R1 |
| FR-63, FR-64 | — | VO-14 | R1(report.md에 반영 목록) |
| QR-1–QR-9 | — | VO-1, VO-2, VO-6, VO-7, VO-9, VO-10, VO-12, VO-13, VO-16 | Test command, R3 |
| QR-10 | C-40 | VO-14 | R1 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 2 |
| verifier invocations | 0 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 1 | — | pending | — | — |
| VO-2 | 1 | — | pending | — | — |
| VO-3 | 1 | — | pending | — | — |
| VO-4 | 1 | — | pending | — | — |
| VO-5 | 1 | — | pending | — | — |
| VO-6 | 1 | — | pending | — | — |
| VO-7 | 1 | — | pending | — | — |
| VO-8 | 1 | — | pending | — | — |
| VO-9 | 1 | — | pending | — | — |
| VO-10 | 1 | — | pending | — | — |
| VO-11 | 1 | — | pending | — | — |
| VO-12 | 1 | — | pending | — | — |
| VO-13 | 1 | — | pending | — | — |
| VO-14 | 1 | — | pending | — | — |
| VO-15 | 1 | — | pending | — | — |
| VO-16 | 1 | — | pending | — | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | Test command exit 1: VO-5 edge 기본 id undefined, VO-4 focus 'b->c' 누락(같은 원인); count.mjs 분기 76.25% < 80 (74–78행 models 있는 조각 draw, 113–115행 import 실패) | edge id 규칙 미구현(implementation defect); spec에 없던 count 동작 2개(spec gap) | spec v3: FR-34·Errors·FR-13·FR-15·figure draw 타입 명시; implementer는 edge id, test-implementer는 VO-3·VO-8 추가 항목 | 해결: Test command 164/164, 커버리지 충족 |
| 2 | pilot 감사(R1 일부): shot 33%, lesson 43%, new-b1 24%; 반박률 42%·23% | 계약이 의미를 정하지 않음: 채움·그리기 순서, split·multiples 전파, handle→param, 시간 대응, 색 의미, 공개 그림, rng; 범용 설명 장면 없음 | spec v4 어휘 1차 개정(Signatures, FR-20, rules 4개, C-41–C-44) | Test command 177/177, 커버리지 충족. pilot 조각은 tmp/audit/pilot-v3/로 옮기고 v4로 전체 재감사 시작 |
| 3 | wave 1 감사(R1, v4): shot 12.2%, lesson 8.6%, new-b1 11.5%(반박 전); 반박률 40%·40%·32% | 표현자(opus-low) 판정이 불안정하고, custom 비율은 어휘가 SVG 기본 도형에 가까워 정보가 없다(C 1행). 큰 위험(그림 안 글자 배치, spec 크기, 정답 오류)은 지면 감사로 보이지 않는다(독립 검토 opus-high) | 감사 중단. 2차 개정·batch 2·E1–E3 판정 안 함. 결과와 실패 이유를 `bench/coverage/report.md`, 반박 기록을 `bench/coverage/refute/`에 둔다 | 실패(방법). 방향 전환은 v5에서 |

# Version Log
## v1
- 초안. 이해 확인(사용자: 맞음, run 1개, 서브에이전트 opus-low), Plan agent 독립 검토 반영, v1 projectile 기준값 재현 확인.
- brief v1 승인: A-5 held-out 기준, A-6 팩토리 주입, A-15 설계 문서 커밋 4f3c605를 base_commit으로. status active.
## v2
- C-17 정정: 기대 시각을 √(20/9.8)로 고치고(이전 2·10/9.8은 계산 오류), 상태 순서·dt·span·event를 명시. 계약만 바뀌는 정정이라 재승인 없음.
## v3
- 수정 묶음 1: FR-10 edge 기본 id 결함. spec 도전 반영(figure draw의 m은 Record<string, any>, 다른 Outputs 사용처는 정확). implementer의 미정 선택을 명시: check run 병합 순서, tol·rel ε, ctx.params, count의 draw 실행과 corpus별 usage·정렬. count import 실패를 Errors에. VO-10 값 개수 15→17. VO-3·VO-8 항목 추가.
## v4
- 수정 묶음 2(어휘 1차 개정, pilot 감사 근거): circle·legend mark, MarkOpts fill·opacity·reveal 방향, 그리기 순서·frame 잘림, Tone 의미 색과 series 구별 보장, loop 선형·warp·once, arc sector와 "A" 방향, sweep 폭 단위, inset 축소판, split·multiples 전파 규칙, explore handles→param과 log knob, explain scene, predict reveal.figure·params와 guess, Option params, QuizReveal, rng 알고리즘 명시. FR-20 bindingErrors. rules 4개 추가. A-16(사용자 답) 기록.
