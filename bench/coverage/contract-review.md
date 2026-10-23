# 계약 문서 검토 (R3)

- 대상: `packages/runtime/types/lesson.d.ts`(17,331 B), `internal.d.ts`, `ext/space3d.d.ts`, `ext/geo.d.ts`
- 절차: (1) JSDoc 블록마다 AGENTS.md 주석 규칙에 맞는지 본다(설계 제약·runtime 소유 동작·단위만). (2) FR-7·FR-8 항목마다 그 문장이 대상 멤버에 있는지 본다. (3) core/ext 분리를 본다. (4) 크기를 토큰으로 환산한다.

## 크기

- count_tokens API는 이 환경에서 쓸 수 없어 근사했다(A-12): 17,331 B ÷ 3.5 B/토큰 ≈ 4,950 토큰(±15%). 상한 6k 토큰(21,000 B) 안이다.

## core/ext

- `space3d`, `geo`는 `ext/*.d.ts`의 옵션 타입을 import해 한 줄씩 선언한다(1–3행, 196·198행). 충족.

## FR-7 (글자 배치)

| 대상 | 문장 | 결과 |
|---|---|---|
| label | "at is the point the text refers to, not a shifted position. Runtime moves text off other text and frame edges, drawing a leader." | 있음 |
| Anchor(label의 anchor) | "Preferred side of the text. Text is never clipped …; size, wrap and offset are runtime constants." | 있음 |
| MarkOpts(잘림 예외) | "marks are clipped to the frame, except text." | 있음 |
| MarkOpts.label | "runtime chooses its position, avoiding other text and frame edges." | 있음 |
| dim | "runtime places the text." | 있음 |
| angle | "runtime places text outside the arc." | 있음 |
| brace | "Runtime places the text outside the brace, centered." | 있음 |
| edge | "Runtime places text at the line middle." | 있음 |
| axis | "Runtime chooses tick count and number format, and appends the axis unit." | 있음 |
| legend | "Without at, placed outside the plot area." | 있음 |

## FR-8 (의미 결정)

| 항목 | 위치 | 결과 |
|---|---|---|
| Option params는 확정 뒤 | Option | 있음 |
| QuizReveal 제출 전 숨김 | QuizReveal | 있음 |
| params 우선순위 | Params(11행) | 있음 |
| tone 안 대비 순서 | MarkOpts.tone | 있음 |
| series 순서 없음 | Tone(20행) | 있음 |
| 물리적 밝기 보장 없음 | MarkOpts.fill | 있음 |
| graph 데이터 창 [0,1]² | graph, node | 있음 |
| flow rate 단위 | flow | 있음 |
| dash를 MarkOpts로 | MarkOpts.dash, line 옵션 | 있음 |
| 화면 param·선언된 param (v6) | Params(10행) | 있음 |
| draw ctx.params = 최종 params (v6) | figure | 있음 |
| knobs·handles는 선언된 param (v6) | Explore | 있음 |
| split link·multiples over (v6) | split, multiples | 있음 |
| focus 강조·낮춤, tone 불변 (v6) | Hook 위(90행) | 있음 |

## 주석 규칙

위반 0. 아래는 고치면 좋은 점(advisory)이다.

| id | 위치 | 관찰 |
|---|---|---|
| R3-a1 | 10–11행 | `Params` 위에 JSDoc 블록이 둘이다. TypeScript는 마지막 블록만 선언에 붙이므로, 편집기 hover에는 화면 param 문장이 보이지 않는다. 생성 agent는 파일을 그대로 읽으므로 계약 내용은 전달된다 |
| R3-a2 | 90행 | focus 문장이 Hook 위에 있어 hover로는 Hook에만 붙는다. 같은 이유로 내용 전달에는 문제가 없다 |
| R3-a3 | 141행 | glossary의 "scene text may use only defined terms"는 무엇이 용어인지 정하지 않아 반증할 수 없다. rules.md term-unknown(굵은 용어·define term)과 범위가 다르다 |
| R3-a4 | 202행 | `grid`의 "Grid lines at spacing or positions."는 타입이 이미 말하는 내용에 가깝다 |

## 추측 결함별 결과 (spec v7, verifier V1-7)

블록 단위로 모든 JSDoc을 읽고 G1–G7을 대조했다.

| id | 추측 결함 | 결과 |
|---|---|---|
| G1 | 코드 서술·타입 반복 | 0. `grid`의 "Grid lines at spacing or positions."는 number = 간격, 배열 = 위치라는, 타입이 말하지 않는 뜻을 적으므로 유지(R3-a4 철회) |
| G2 | 튜토리얼·예시 문장 | 0 |
| G3 | 반증 불가 문장 | 1 → 고침. glossary "scene text may use only defined terms"(R3-a3)를 "Every define-scene term must be a key here (rule term-unknown)."로 바꿨다 |
| G4 | 한 선언에 JSDoc 둘 이상 / 엉뚱한 선언에 붙음 | 2, 유지. `Params`의 두 블록(R3-a1)은 합치면 25단어를 넘는다. focus 문장이 `Hook` 위에 있다(R3-a2). 생성 agent는 파일 원문을 읽으므로 내용은 전달된다. 편집기 hover에서만 빠진다 |
| G5 | 영어가 아닌 글 | 0 (VO-12 자동 검사) |
| G6 | Signatures와 어긋난 문장 | 0. 대조한 블록: Option, Predict, QuizReveal, DragInput, DrawInput, figure, label·leader, graph·node, flow, split, multiples, Explore |
| G7 | 25단어 초과 | 0 (VO-12 자동 검사) |
