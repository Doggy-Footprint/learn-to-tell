# refactoring-4: 장면 타입 메타를 TYPES에 모으고, ctx 프로토콜·측정 모드를 문서화하고, 측정 로직을 핸들러에서 분리하기

## Goal

"이 스킬에서 사용하는 라이브러리는 계속 개발하며 확장 가능해야하고, UIUX적으로 유지보수 가능한 아키텍쳐를 가지고 있어야 한다."

## State

- 브랜치 `fix/run-time`, 기준 커밋 `956df3f`(작성 시). 1·2·5·7번은 workflow run `0041d668222ce019`(기준 커밋 `00bba01`, spec `agent-docs/spec-logs/0041d668222ce019-scene-type-meta-lint-registry.md`)에서 끝났다. 남은 것은 3·4·6번.
- 1·2·5·7번 결과(커밋과 무관한 증거):
  - 1번: `ltt.js`의 `LTT.sceneTypes`(프로토타입 없는 표, 타입 12개 × 메타 필드 13개: `head, autoSplit, fullByDefault, pointsOnMock, sumVisualAreas, needsReadingGuide, titleOptional, bookend, cardGrid, signature, auditHero, auditSmallVisual, auditLooseFigure`)에 `ltt-deck.js`가 `render`를 붙이고 `LTT.deckTypes`가 같은 객체를 가리킨다. `SPLIT_OFF`·`NO_HEAD`·`VISUAL_TYPES`·`AUDIT_SKIP`는 없어졌다. 새 타입 = `TYPE_META` entry 하나 + `RENDERS` render 하나. 테스트 `tests/scene-types.test.mjs`.
  - 2번: `kit/api/internals.md`에 메타 필드 표, ctx 계약, 측정 모드, lint 규칙 추가 절. 문장별 코드 대조 `agent-docs/spec-logs/0041d668222ce019-r4-doc-review.md`(43/43).
  - 5번: `lintDeck`이 내부 `RULES` 레지스트리(장면 단계 9개 + 덱 단계 7개, 등록 순서 = 출력 순서)로 돈다. 테스트 `tests/lint-rules.test.mjs`. 기준 커밋과의 차분 fuzz(seed 20261019, lintDeck 20,000 + auditScene 20,000, 망가진 입력 2,049 포함) 위반 0.
  - 7번: `kit/CHANGELOG.md` 0.2.0, `plugin.json`·`packages/ltt-kit/package.json` 0.2.0(`files`에 CHANGELOG.md), README 릴리스 한 문장. 테스트 `tests/release-docs.test.mjs`. 릴리스(master push)는 하지 않았다.
  - 동작 불변: 갤러리 13편 × 1440×900·1280×800의 `?audit` DOM(반복 덤프 규칙)·audit·lint 배열이 기준 커밋과 같고 `tests/gallery-audit.baseline.json`은 바이트 단위로 같다. `npm test` 775 pass.
- 순서: refactoring-4. 3번 항목(측정 로직 분리)은 refactoring-5(장면 배율 보류 항목, 안 B)와 같은 코드를 건드리므로 함께 진행한다. refactoring-6(CSS 분리)은 이 뒤에 한다.
- 관련 파일과 위치(`956df3f` 기준):
  - `skills/learn-to-tell/kit/ltt-deck.js` 1,180줄: `TYPES` 281~703(figure 383~515, predict 537~630), `SPLIT_OFF`·`NO_HEAD` 764~765, `fit`·`zoomTo`·`mobileFit`·`solidRects`·`floatPanel`·`panelOverlap` 769~881, `measure` 889, `deck` 927~1180(`mount` 964, `ctx` 생성).
  - `skills/learn-to-tell/kit/ltt.js`: `VISUAL_TYPES` 463, `isCardGrid` 466, `isSignature` 477, `lintDeck` 485~542(규칙이 순차 코드), `AUDIT_SKIP` 544, `auditScene` 549.
  - `tests/kit.test.mjs`: `ltt.js`만 node vm으로 로드. 덱 테스트는 이 브랜치가 추가한 `freeSlot` 1건.
- 지금 상태:
  - (해결됨, 1번) 장면 타입을 하나 더하려면 `TYPES` 외에 두 파일 다섯 곳을 고쳐야 했다.
  - (해결됨, 2번) ctx 프로토콜이 문서화되지 않았다.
  - figure 핸들러 약 130줄에 `probe`·`measureAll`·`widen`·`under`가, predict 핸들러에 `lockZoom`이 들어 있어 렌더링과 측정이 섞여 있다. `widen`은 페이지 CSS가 `56vw`로 고정한 그림 폭을 되돌리는 코드로, kit이 페이지 CSS와 싸우는 구조다.
  - 이 브랜치에서 `ltt-deck.js`는 12회 커밋으로 바뀌었고 테스트는 1건 늘었다. 검증은 손으로 11편 × 폭 1400/1000/760(handoff e72bbfb2418e2e6d Execution Ledger).
  - (해결됨, 7번) 버전 0.1.0, CHANGELOG 없음. 개발자용 문서는 `kit/api/internals.md`.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |

## Next Step

1. (완료, run 0041d668222ce019) **타입 메타 통합**: `TYPES.<type>`을 `{ render(s, body, ctx), head, autoSplit, hero, signature, cardGrid(s, scenes), auditSmallVisual }` 형태로 바꾸고 `SPLIT_OFF`·`NO_HEAD`·`VISUAL_TYPES`·`AUDIT_SKIP`·`isCardGrid`·`isSignature`가 이 메타를 읽게 한다. lint·audit은 `ltt.js`에 있고 TYPES는 `ltt-deck.js`에 있으므로, 메타 표만 `ltt.js`의 `LTT.sceneTypes`로 내리고 deck이 거기에 `render`를 붙이는 방식이 로드 순서와 vm 테스트(`ltt.js`만 로드)에 맞다.
2. (완료, run 0041d668222ce019) **ctx 프로토콜 문서화**: 핸들러가 받는 것(`el`, `scene`, `index`, `scenes`, `predictRest`), 걸 수 있는 것(`gate`, `place`, `unplace`, `back`, `zmax`), 부를 수 있는 것(`fit`, `refit`, `float`), 돌려주는 것(`{enter, leave}`), 측정 모드 규칙(`LTT.measure` 안에서 `send` 무효, `.dk-still`로 transition 정지, enter·answerVisual 멱등)을 `kit/DEVELOPING.md`(개발자용) 또는 refactoring-2의 `kit/api/deck-contracts.md`에 적는다. AGENTS.md 문서 규칙대로 코드로 복원할 수 없는 계약만 적는다.
3. **측정 로직 분리**: figure의 `probe`/`measureAll`/`widen`/`under`와 predict의 `lockZoom`, summary의 `pending` 자리 예약을 한 곳(deck 내부 `placement` 또는 `ltt-scale.js`)으로 모으고, 핸들러는 "가능한 상태를 열거하는 함수"(figure: steps, predict: choices, summary: recall 답)만 제공한다. refactoring-5의 안 B(단계 프레임 겹쳐 쌓기)를 택하면 figure의 probe가 없어지므로 그 결정 뒤에 한다.
4. **페이지 CSS와 그림 폭**: API.md·SKILL.md에 "figure 그림 폭을 `vw`로 고정하지 않는다(kit이 칸 폭을 준다)" 규칙을 넣고, 갤러리에서 그림 폭을 vw로 고정한 곳(`tls13-quic.html` `.seqwrap{width:min(820px,56vw)}` 등; `vw`가 등장하는 페이지는 8편이나 대부분 글자 크기 clamp이므로 그림 폭 고정만 가려낸다)을 고친 뒤 `widen`을 지울 수 있는지 확인한다.
5. (완료, run 0041d668222ce019) **lint 규칙 레지스트리**(선택): `lintDeck`의 순차 코드를 `RULES = [{ id, check(spec, ctx) }]`로 바꿔 규칙 단위 테스트와 추가가 쉽게 한다.
6. **회귀 기준**: 지금 진행 중인 자동 audit(갤러리 12편 × 1440×900·1280×800)이 들어오면 이 작업의 전후 비교 기준으로 쓴다. TYPES 메타 표는 vm에서 단위 테스트한다. (run 0041d668222ce019가 쓴 기준선 도구: `agent-docs/spec-logs/0041d668222ce019-dom-dump.mjs`·`-dom-diff.sh`·`-dom-match.sh`. 같은 트리끼리도 transition 중간값 때문에 덤프 0–2파일이 달라 반복 덤프 규칙이 필요하다.)
7. (완료, run 0041d668222ce019) **버전·변경 기록**: `kit/CHANGELOG.md`를 두고 작가 계약이 바뀔 때 한 줄씩 적는다. 이 브랜치의 계약 추가(enter 멱등, answerVisual 순수·동기, `rest`/`predictRest`, `panel-overlap`)를 첫 항목으로 적고 version을 올린다(릴리스 규칙은 README "릴리스").

## Open Questions

- (refactoring-8로 옮김, run 74cb05d7da21907e) overview hero 판정 질문은 audit 의미 문제라 `agent-docs/handoff/fb7b84e0280f15ef-refactoring-8-gallery-audit-zero-and-cleanup.md` Open Questions에 있다.
- 부하 아래(동시 headless Chrome 여러 개)에서 `server/audit.mjs`의 Chrome 하나가 60초 SIGKILL 뒤에도 끝나지 않아 gallery-audit 테스트가 14분 멈춘 적이 있다(run 0041d668222ce019 ledger 13, 원인 가설: Chrome 자식 프로세스가 stdout을 잡고 있음).

- TYPES 메타를 `ltt.js`로 내릴지, lintDeck이 `LTT.deckTypes`가 있으면 쓰고 없으면 기본 표를 쓰게 할지.
- 개발자 문서 위치(`kit/DEVELOPING.md` vs `agent-docs/`). skill zip과 npm 패키지에 들어갈 필요는 없다.
- kit 로직 변경이므로 workflow-approach(spec → 독립 테스트 → verifier)를 쓸지. ADR 06a89373 규칙 3("동작을 테스트로 고정할 가치가 있는 곳")에 해당한다.

## Spec

1·2·5·7번: `agent-docs/spec-logs/0041d668222ce019-scene-type-meta-lint-registry.md`(run `0041d668222ce019`, 종료 상태는 그 spec의 frontmatter). 3·4·6번은 아직 spec 없음.

## Execution Ledger

- 2026-10-18 측정(`ltt-deck.js`에서 핸들러가 쓰는 ctx 속성 횟수): `fit` 8, `index` 7, `gate` 7, `zmax` 5, `refit` 5, `el` 5, `unplace` 4, `place` 4, `back` 3, `scenes` 2, `float` 2, `predictRest` 1.
- 2026-10-18 측정: 타입별 성질을 담은 표 5개가 두 파일에 있다(위 State). 이 브랜치의 `ltt-deck.js` 커밋 12회, `API.md` 9회, 테스트 추가 1건.
- 2026-10-18 측정: `vw`가 등장하는 갤러리 페이지 8편(anchoring 1, tls13-quic 4, ontology 1, trolley 1, matrix 7, retrieval 1, cache-ttl 2, color-contrast 1; 글자 크기 clamp 포함).
- 2026-10-19 run 0041d668222ce019 (1·2·5·7번): 구현 1회, 테스트 correction 2회(동일성 단언 제거; verifier 1의 SC-1..SC-4·EG-1에 따른 증거 보강), 문서 문장 2개 수정(R-4), verifier 2회. hand mutation 15건 모두 탐지(HM-14는 모든 규칙을 감싼 변형으로). mutation 도구 없음(Stryker 미설치). 차분 fuzz 위반 0.
- 2026-10-19 run 74cb05d7da21907e(spec `agent-docs/spec-logs/74cb05d7da21907e-placement-module-float-aware-zoom.md`, status limit, verifier 2회): 3번은 `ltt-deck.js` 지역 `placement`로 측정 로직을 모았다(핸들러 본문의 측정 식별자 0, phase 1 DOM·audit·lint가 기준과 같음), 공개 이름 `LTT.placement.zoomLock`. 4번은 API.md vw 규칙을 넣고 tls13-quic `.seqwrap`·ontology-triples `.kg.wide, .ladder`에서 vw를 뺐으며 `widen`을 지웠다(측정한 9개 크기 중 창 폭 760에서만 작동, audit 건수 26/26 같음). 6번은 `server/audit.mjs`와 기준선 테스트를 이 run의 oracle로 써서 완료. 남은 것은 오류 경로 증거(TV-6) 하나로 `agent-docs/handoff/d7cbe1b9150ab344-placement-module-error-path-evidence.md`가 맡는다. 그것이 끝나면 이 문서를 닫는다.
- 2026-10-19 사용자 결정으로 닫음. 남은 TV-6(오류 경로 fixture 판별력)은 handoff d7cbe1b9150ab344가 추적.
