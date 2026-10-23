# 감사 역할 지시

`protocol.md`를 먼저 읽는다. 이 파일은 표현자·반박자가 매번 따르는 작업 지시다. 계약은 `packages/runtime/types/lesson.d.ts`(+ `ext/*.d.ts`)이고, 그 타입과 JSDoc이 말하는 것만 보장된다.

## 표현자 (model opus, effort low)

목표: 원본 그림마다 계약 어휘로 실제 코드를 써 보고, 필수 속성이 kept·approx·lost·ambiguous·custom 중 무엇인지 기록한다. 원본의 속성이나 필수 표시를 지우거나 약하게 하지 않는다.

읽을 것: `protocol.md`, `lesson.d.ts`(+ ext), `bench/coverage/fragment.d.ts`, API 사용 예 `skill/learn-to-tell/examples/projectile-drag.js`.

조각 파일 형식:

```js
// @ts-check
/** @type {import("<상대경로>/fragment").Fragment} */
export default (api) => { /* 필요한 멤버 구조분해 */ return { models: {...}, figures: { <id>: figure(...) }, scenes: [ /* 조작(I)이 필수일 때 predict·explore 등 */ ] }; };
/** @type {import("<상대경로>/fragment").AuditRow[]} */
export const audit = [{ fig, src, corpus, domain, props: [...], verdict, custom: [], candidates: [] }];
```

규칙:
- 속성: shot은 beats의 비트와 principle 전부가 필수다(beats가 없는 s05·s08은 HTML에서 그림의 결론이 기대는 성질을 필수로 정하고 `why`를 적는다). lesson은 그 장면 제목·결론이 기대는 성질이 필수다. new는 brief의 속성을 그대로 옮긴다(필수 = brief의 필수).
- 실제로 그린다: 구체적인 값과 model(원본의 숫자·식), 단위 있는 축, 원본 시간 동작을 재현하는 TimeSpec(loop의 warp·once 포함), mark id, 움직임(trace, flow, sweep, inset, reveal, from), 구도(split, multiples), 조작(knobs, handles), 공개(reveal.figure, QuizReveal)를 필요한 만큼 쓴다. 속성을 피해 가는 자리 표시는 금지다.
- `kept`는 `by`에 그것을 보장하는 d.ts 멤버·옵션·JSDoc 문장을 적는다. d.ts가 그 의미를 말하지 않으면 `ambiguous`. `approx`는 `diff`에 잃는 것을 한 문장으로, 그 손실이 그림의 결론을 깨면 `lost`. `api.custom`이 필요하면 status `custom`, 행 `custom`에 짧은 이름, custom 호출의 `why`에 이유. 매체 한계(코드 SVG로도 불가)는 verdict X와 `reason`.
- `candidates`: 있었으면 하는 어휘를 짧은 kebab 이름으로(예: `path-fill`, `staff-notation`). 이미 계약에 있는 것은 적지 않는다.
- 판정 일관성(count.mjs가 검사): C ⇔ custom 있음; 아니면 필수 중 lost·ambiguous가 있으면 G; 아니면 V.
- 금지: `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `{any}`, `{*}`.
- 끝내기 전에: `npx tsc -p bench/coverage/tsconfig.json`에서 내 파일 오류 0, `node bench/coverage/count.mjs <내 디렉터리> --out tmp/audit/out-<이름>` exit 0. 내 파일과 `tmp/audit/` 밖은 고치지 않는다.
- 보고: 그림마다 한 줄(판정, lost·ambiguous·custom 속성, candidates), 계약에서 불분명한 점.

## 반박자 (model opus, effort medium)

대상: 지정된 V 행 표본. 원본(shot HTML·beats, lesson HTML, brief)과 조각, d.ts를 본다. 조각은 고치지 않는다.

행마다:
1. 빠진 필수 속성이나 낮춘 필수 표시가 있는가.
2. 필수 `kept`마다: d.ts의 모든 문장을 지키면서도 이 속성을 깨는 runtime을 한 문장으로 들 수 있는가 → 있으면 `ambiguous`.
3. 필수 `approx`마다: diff가 정직하고 결론이 남는가 → 아니면 `lost`.
4. 코드가 `by`가 주장하는 일을 실제로 하는가(값·철자·분류 오류 포함).

출력: 지정된 `tmp/audit/refute-<이름>.md`에 행마다 "유지" 또는 반박 목록(속성 id, 새 status, 한 문장 이유). 끝에 검사 행 수, 반박된 행 수(필수 속성 1개 이상 반박), 반박률.
