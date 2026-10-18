# refactoring-4: 장면 타입 메타를 TYPES에 모으고, ctx 프로토콜·측정 모드를 문서화하고, 측정 로직을 핸들러에서 분리하기

## Goal

"이 스킬에서 사용하는 라이브러리는 계속 개발하며 확장 가능해야하고, UIUX적으로 유지보수 가능한 아키텍쳐를 가지고 있어야 한다."

## State

- 브랜치 `fix/run-time`, 기준 커밋 `956df3f`. 코드 변경 없음.
- 순서: refactoring-4. 3번 항목(측정 로직 분리)은 refactoring-5(장면 배율 보류 항목, 안 B)와 같은 코드를 건드리므로 함께 진행한다. refactoring-6(CSS 분리)은 이 뒤에 한다.
- 관련 파일과 위치(`956df3f` 기준):
  - `skills/learn-to-tell/kit/ltt-deck.js` 1,180줄: `TYPES` 281~703(figure 383~515, predict 537~630), `SPLIT_OFF`·`NO_HEAD` 764~765, `fit`·`zoomTo`·`mobileFit`·`solidRects`·`floatPanel`·`panelOverlap` 769~881, `measure` 889, `deck` 927~1180(`mount` 964, `ctx` 생성).
  - `skills/learn-to-tell/kit/ltt.js`: `VISUAL_TYPES` 463, `isCardGrid` 466, `isSignature` 477, `lintDeck` 485~542(규칙이 순차 코드), `AUDIT_SKIP` 544, `auditScene` 549.
  - `tests/kit.test.mjs`: `ltt.js`만 node vm으로 로드. 덱 테스트는 이 브랜치가 추가한 `freeSlot` 1건.
- 지금 상태:
  - 장면 타입을 하나 더하려면 `TYPES` 외에 두 파일 다섯 곳(`SPLIT_OFF`, `NO_HEAD`, `VISUAL_TYPES`, `AUDIT_SKIP`, `isCardGrid`/`isSignature`)을 고쳐야 한다.
  - 핸들러가 `ctx`에 걸고 읽는 프로토콜(`gate`, `place`, `unplace`, `back`, `zmax`, `refit`, `float`, `fit`, `predictRest`)이 어디에도 문서화되지 않았다. `LTT.deckTypes`로 TYPES를 밖에 열어 두었지만 새 타입을 쓰는 데 필요한 계약은 코드를 읽어야 안다.
  - figure 핸들러 약 130줄에 `probe`·`measureAll`·`widen`·`under`가, predict 핸들러에 `lockZoom`이 들어 있어 렌더링과 측정이 섞여 있다. `widen`은 페이지 CSS가 `56vw`로 고정한 그림 폭을 되돌리는 코드로, kit이 페이지 CSS와 싸우는 구조다.
  - 이 브랜치에서 `ltt-deck.js`는 12회 커밋으로 바뀌었고 테스트는 1건 늘었다. 검증은 손으로 11편 × 폭 1400/1000/760(handoff e72bbfb2418e2e6d Execution Ledger).
  - kit 공개 API(작가 계약)가 바뀌었는데 `.claude-plugin/plugin.json`·`packages/ltt-kit/package.json`은 0.1.0이고 CHANGELOG가 없다. 개발자용 문서가 없다(API.md는 작가용).

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |

## Next Step

1. **타입 메타 통합**: `TYPES.<type>`을 `{ render(s, body, ctx), head, autoSplit, hero, signature, cardGrid(s, scenes), auditSmallVisual }` 형태로 바꾸고 `SPLIT_OFF`·`NO_HEAD`·`VISUAL_TYPES`·`AUDIT_SKIP`·`isCardGrid`·`isSignature`가 이 메타를 읽게 한다. lint·audit은 `ltt.js`에 있고 TYPES는 `ltt-deck.js`에 있으므로, 메타 표만 `ltt.js`의 `LTT.sceneTypes`로 내리고 deck이 거기에 `render`를 붙이는 방식이 로드 순서와 vm 테스트(`ltt.js`만 로드)에 맞다.
2. **ctx 프로토콜 문서화**: 핸들러가 받는 것(`el`, `scene`, `index`, `scenes`, `predictRest`), 걸 수 있는 것(`gate`, `place`, `unplace`, `back`, `zmax`), 부를 수 있는 것(`fit`, `refit`, `float`), 돌려주는 것(`{enter, leave}`), 측정 모드 규칙(`LTT.measure` 안에서 `send` 무효, `.dk-still`로 transition 정지, enter·answerVisual 멱등)을 `kit/DEVELOPING.md`(개발자용) 또는 refactoring-2의 `kit/api/deck-contracts.md`에 적는다. AGENTS.md 문서 규칙대로 코드로 복원할 수 없는 계약만 적는다.
3. **측정 로직 분리**: figure의 `probe`/`measureAll`/`widen`/`under`와 predict의 `lockZoom`, summary의 `pending` 자리 예약을 한 곳(deck 내부 `placement` 또는 `ltt-scale.js`)으로 모으고, 핸들러는 "가능한 상태를 열거하는 함수"(figure: steps, predict: choices, summary: recall 답)만 제공한다. refactoring-5의 안 B(단계 프레임 겹쳐 쌓기)를 택하면 figure의 probe가 없어지므로 그 결정 뒤에 한다.
4. **페이지 CSS와 그림 폭**: API.md·SKILL.md에 "figure 그림 폭을 `vw`로 고정하지 않는다(kit이 칸 폭을 준다)" 규칙을 넣고, 갤러리에서 그림 폭을 vw로 고정한 곳(`tls13-quic.html` `.seqwrap{width:min(820px,56vw)}` 등; `vw`가 등장하는 페이지는 8편이나 대부분 글자 크기 clamp이므로 그림 폭 고정만 가려낸다)을 고친 뒤 `widen`을 지울 수 있는지 확인한다.
5. **lint 규칙 레지스트리**(선택): `lintDeck`의 순차 코드를 `RULES = [{ id, check(spec, ctx) }]`로 바꿔 규칙 단위 테스트와 추가가 쉽게 한다.
6. **회귀 기준**: 지금 진행 중인 자동 audit(갤러리 12편 × 1440×900·1280×800)이 들어오면 이 작업의 전후 비교 기준으로 쓴다. TYPES 메타 표는 vm에서 단위 테스트한다.
7. **버전·변경 기록**: `kit/CHANGELOG.md`를 두고 작가 계약이 바뀔 때 한 줄씩 적는다. 이 브랜치의 계약 추가(enter 멱등, answerVisual 순수·동기, `rest`/`predictRest`, `panel-overlap`)를 첫 항목으로 적고 version을 올린다(릴리스 규칙은 README "릴리스").

## Open Questions

- TYPES 메타를 `ltt.js`로 내릴지, lintDeck이 `LTT.deckTypes`가 있으면 쓰고 없으면 기본 표를 쓰게 할지.
- 개발자 문서 위치(`kit/DEVELOPING.md` vs `agent-docs/`). skill zip과 npm 패키지에 들어갈 필요는 없다.
- kit 로직 변경이므로 workflow-approach(spec → 독립 테스트 → verifier)를 쓸지. ADR 06a89373 규칙 3("동작을 테스트로 고정할 가치가 있는 곳")에 해당한다.

## Spec

없음. 착수 시 1·3번은 workflow-approach 사용을 검토한다.

## Execution Ledger

- 2026-10-18 측정(`ltt-deck.js`에서 핸들러가 쓰는 ctx 속성 횟수): `fit` 8, `index` 7, `gate` 7, `zmax` 5, `refit` 5, `el` 5, `unplace` 4, `place` 4, `back` 3, `scenes` 2, `float` 2, `predictRest` 1.
- 2026-10-18 측정: 타입별 성질을 담은 표 5개가 두 파일에 있다(위 State). 이 브랜치의 `ltt-deck.js` 커밋 12회, `API.md` 9회, 테스트 추가 1건.
- 2026-10-18 측정: `vw`가 등장하는 갤러리 페이지 8편(anchoring 1, tls13-quic 4, ontology 1, trolley 1, matrix 7, retrieval 1, cache-ttl 2, color-contrast 1; 글자 크기 clamp 포함).
