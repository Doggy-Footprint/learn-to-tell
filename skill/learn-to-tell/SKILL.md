---
name: learn-to-tell
description: 대화 진단으로 찾은 학습 공백을 15–20분짜리 인터랙티브 수업(lesson.js)으로 만든다. agent는 수업 spec만 쓰고 runtime이 그린다.
---

# Learn to Tell (M1 초안)

수업은 `lesson.js` 하나다. 수치 모델, 데이터 단위 그림, 장면만 쓴다. 레이아웃·CSS·DOM·애니메이션 코드는 쓰지 않는다. 글자 위치, 크기, 색, 줄바꿈은 runtime이 정한다.

`ltt`는 이 문서에서 실행 파일 `node packages/runtime/bin/ltt.mjs`를 뜻한다. 예: `ltt check <lesson.js>` = `node packages/runtime/bin/ltt.mjs check <lesson.js>`.

## 1. 읽는 순서 (이것만 읽는다)

1. 이 파일(SKILL.md)
2. `packages/runtime/types/lesson.d.ts` (계약 전체)
3. 주제에 가장 가까운 예시 1개: `skill/learn-to-tell/examples/projectile-drag.js`

runtime 소스(`packages/runtime/src/`), rules.md, 다른 문서는 읽지 않는다.

## 2. 쓰기 전에 알리기

절 목록(3–5개)과 절마다 핵심 그림 한 줄을 대화에 알린다. 사용자 답을 기다리지 않고 바로 다음 단계로 간다.

## 3. 한 번에 Write

- `lesson.js`를 Write 한 번으로 쓴다. 파일 안 순서는 `meta` → `glossary` → `checks` → `models` → `figures` → `sections` → `quiz` → `summary`다. `checks`를 `models`보다 먼저 쓴다.
- import 없이 `export default (api) => api.lesson({...})` 형태다. 첫 줄에 `/** @type {import("ltt").LessonFactory} */`를 둔다.
- 출처가 있는 model(`src`가 문자열)은 해석해가 알려진 극한 check(`limit`)를 1개 이상 둔다.

## 4. `ltt check` 예산: 3회

```
ltt check <lesson.js>
```

- 출력은 오류마다 한 줄 `<file> <path> [<rule>] <message>`이고 마지막 줄이 `ok` 또는 `<n> errors`다.
- `[TS…]`는 타입 오류, 나머지는 의미·배치 규칙이다. path가 가리키는 곳만 Edit로 고친다.
- 3회 안에 `ok`가 나오지 않으면 10번(예산 소진)으로 간다.
- 글자 배치 오류(`text-no-room`)는 글을 줄이거나, mark를 줄이거나, figure를 나눠서 고친다. 좌표를 옮겨 글자를 피하지 않는다.

## 5. `ltt sheet`: 1회, 렌더 뒤 수정 1회

```
ltt sheet <lesson.js> --out <dir>
```

- `desktop-*.png`, `mobile-*.png`를 한 번 본다. 장면마다 처음 상태와 정착 상태가 나란히 있다.
- 명백한 것(빈 그림, 엉뚱한 수치, 내용 오류)만 한 번에 고친다. 고친 뒤 `ltt check`만 다시 돌린다(4번 예산 안에서). sheet는 다시 돌리지 않는다.
- `sheet.json`의 `layoutViolations`·`runtimeErrors`가 runtime 결함으로 보이면 6번 규칙을 따른다.

## 6. runtime 결함 규칙

runtime 소스를 읽거나, 고치거나, 우회하지 않는다(`custom`으로 대신 그리기, 좌표를 비틀어 피하기 포함). 수업 쪽 원인이 아니라고 보이면 수업 파일 옆 `runtime-issues.md`에 한 줄씩 적고 넘어간다.

```
| 장면 번호 | 상태(initial/settled) | viewport | 증상 |
```

## 7. M1에서 쓸 수 있는 것

- frame: `cartesian`(선형·log·`aspect: "equal"`·camera), `graph`(`layered`·`tree`, direction down/right), `cells`, `geo`(`equalEarth`·`mercator`, region: world, europe, asia, east-asia, southeast-asia, south-asia, middle-east, africa, north-america, south-america, oceania, atlantic, indian-ocean, pacific).
- mark: axis(x·y), grid, legend, line, area, dot, circle, rect, arc, arrow, path, label, dim, angle, brace, node, edge, cell, math, code, mock.
- 움직임·구도: trace, flow, sweep, split, multiples, custom, MarkOpts `reveal`.
- 장면: hook, predict(choice·drag·draw), define, explain, steps, explore(knob·handle·goal), compare, quiz(choice·numeric·order·classify), summary.
- 미구현(쓰면 check가 `unimplemented` 오류): polar, lanes, space3d, graph `force`·`sankey`, geo `orthographic`, field, glyph, icon, inset, MarkOpts `from`.

## 8. graph 좌표

- graph는 `at` 없이 노드와 간선만 쓰고 배치는 runtime(ELK)에 맡긴다. 시간에 따라 노드가 늘어도 위치는 고정된다.
- `at`을 꼭 써야 하면 좌표는 [0,1]² 창이다(0,0이 왼쪽 아래, 1,1이 오른쪽 위). px나 축 단위가 아니다.
- 같은 frame의 label 등 다른 mark도 [0,1]² 좌표를 쓴다.

## 9. 정답 검산: 서브에이전트 1회

1. `ltt digest <lesson.js> > digest.md`
2. 서브에이전트 1개에 `skill/learn-to-tell/verify-answers.md`의 지시와 `digest.md`만 준다. 수업 파일, 대화, 이 SKILL은 주지 않는다.
3. 결과 표에서 "불일치"만 고친다. "판정 불가"는 이유를 읽고 수업 쪽 문제면 고치고, 아니면 둔다.
4. 고친 뒤에는 `ltt check`만 다시 돌린다. 재검산은 하지 않는다.

## 10. 예산을 다 쓰면

check 3회, sheet 1회, 렌더 뒤 수정 1회, 검산 1회 중 하나라도 다 쓰고 남은 문제가 있으면 더 고치지 않는다. 남은 오류(path·rule)와 이유를 대화에 적고 다음 단계(제공)로 넘긴다.

## 11. illustrative 값 표시

- 출처 없는 수치는 model의 `src`를 `{ illustrative: true }`로 둔다.
- 그 값을 보이는 장면 글(say, 선택지, feedback, 문항)에는 가정 값임을 같은 문장 안에 적는다. 예: `탁구공 vt는 약 8 m/s(가정: C_d 0.5, ρ 1.2)`.
- illustrative 값을 실측처럼 말하지 않는다.

## 수업 구조 요약

- 절 3–5개. 절마다 predict → define/steps/explain → explore/compare → 중간 확인 quiz. 첫 장면은 hook.
- 장면 18–24개(절 장면 합 + 최종 quiz + summary).
- `meta.learner.misconceptions[0]`을 `targets`로 겨냥한 predict를 첫 두 절 안에 둔다.
- figure가 있는 장면은 `focus`를 가진다. tone `focus`는 그 mark가 보이는 모든 장면의 focus 목록에 있을 때만 쓴다.
- define 장면의 term은 glossary에 있고, 그 장면보다 앞선 장면 글에 쓰지 않는다.
- 문항마다 `objective`, 오답 선택지마다 `feedback`, 최종 quiz에 `transfer: true` 문항 1개 이상.
- label의 `at`은 글자가 가리키는 점이다. 글자를 피하려고 옮기지 않는다. 글자 배치는 runtime이 한다.
