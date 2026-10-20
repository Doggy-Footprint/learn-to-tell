# lint: hook `art`에 문자열이 아닌 값이 오면 "고침"으로 잡기

## Goal

- "2 순위는 새로운 handoff 로 남겨줘"
- 원래 후보(handoff `3b9ef4b406088e7f` Open Questions, 마무리 측정 후보): "lint: hook `art`(아이콘 이름·HTML 문자열)에 문자열이 아닌 값이 오면 '고침'. 함수를 넘기면 kit이 소스를 글로 찍는다."

## State

- 브랜치 `perform/diet`, 기준 커밋 `0fb63ae`. 코드 변경은 없다.
- 근거: 2026-10-20 마무리 측정(`dd6e1f9` 대 `79d132d`, sonnet medium)의 projectile 실행. 생성 agent가 hook `art`에 함수를 넘겼고, 장면에 함수 소스가 글로 찍혔다. lint·audit은 이것을 잡지 못했고, sheet 눈 검토에서야 발견됐다.
- 조사된 지점:
  - `skills/learn-to-tell/kit/ltt-deck.js:273-276` `iconOr(v)`는 `LTT.icons`에 있는 이름이면 아이콘을 만든다. 아니면 `v`를 그대로 돌려주고, 그 값이 `h()`의 자식이나 `innerHTML` 문자열로 들어간다. 함수는 소스 글이 된다.
  - `iconOr`를 부르는 곳은 4곳이다.
    - hook `art`(`:466`)
    - stepper 단계 `icon`(`:487`, `:491`)
    - terms `icon`(`:508`)
    - 그래서 `icon` 필드도 같은 위험이 있다(hypothesis, 재현 안 함).
  - API.md는 `art`를 "(아이콘·HTML)"이라고만 적고 형식을 강제하지 않는다(`kit/API.md:36`, `:84`).
  - lint 규칙은 `skills/learn-to-tell/kit/ltt.js`의 `RULES` 배열에 `{id, scene(s, i, c)}`로 등록한다(`:513`부터). 반환 형식은 `[index, rule, msg]`다.
  - 규칙 등급표는 `kit/api/rules.md`에 있다.
  - 새 규칙을 넣으면 함께 맞출 곳이 있다.
    - `tests/lint-rules.test.mjs`
    - `tests/api-docs.test.mjs`의 rules.md·SKILL.md 권고 id 대조 테스트("the 권고 ids named in SKILL.md §3 …"). 고침 등급이면 SKILL.md §3 권고 목록은 바뀌지 않는다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |

## Next Step

1. 사용자가 정할 것:
   - workflow-approach로 할지(kit·audit 코드는 workflow-approach라는 2026-10-19 결정이 있다).
   - 규칙 id.
   - 범위: `art`만 볼지, `iconOr`를 거치는 `icon` 필드까지 볼지.
2. `RULES`에 장면 규칙을 추가한다. hook `art`(와 고른 `icon` 필드)가 `undefined`·문자열이 아니면 "고침"으로 낸다.
3. `kit/api/rules.md`에 행을 추가하고, 필요하면 API.md hook 행에 "문자열만"을 적는다. 이때 `tests/api-docs.test.mjs`의 API.md 크기 상한을 확인한다.
4. lint 테스트에 함수·객체·숫자 입력을 넣고, gallery audit 기준선이 그대로인지 확인한다.

## Open Questions

- kit이 렌더할 때 막을지도 정해야 한다. 함수면 비워 두는 방식이다. lint만 하면 사용자 화면에는 여전히 소스가 찍힌다.
- `art`에 HTML 문자열(SVG 등)을 허용하는 것은 지금과 같이 둘지.

## Spec

none — workflow-approach run 없음(착수 전).

## Execution Ledger

없음 — 착수 전.
