# run e48ead05 커밋(5aac51f) 리뷰에서 나온 남은 결함

## Goal

- 리뷰 지시: "서브 에이전트 호출해서 추가 결함의 가능성을 검토해. 새로운 context에서. Opus-xhigh"
- 이어서: "문서 불일치, 사소한 건 바로 고치자."
- 이 handoff: "남은 건 handoff로 정리해. 새로운 세션에서 이어서 진행할거야. 각 의견에 대해 찬성/반대 의견 적어줘. (단, 억지로 적지는 말고, 신뢰도를 적어. 그리고 이건 이전 세션의 평가이며 참고로만 볼 것을 명시해.)"
- 상위 작업: `agent-docs/handoff/7a0ce2dc6e07a3ca-gallery-v2-test-results-and-generator-fixes.md`. 다음 run 범위(13·16·20·A-4)와 묶을지는 사용자가 정한다.

## State

- 브랜치 `test`, HEAD `c8ca763`(그 아래 `5aac51f`가 리뷰 대상, base `9636962`). push 안 함.
- 커밋하지 않은 변경(리뷰의 문서 불일치·사소한 항목 8, 9-1, 9-2, 9-4, 9-5 수정, `npm test` 1466/1466):
  - `skills/learn-to-tell/kit/ltt.js`: `fixSvgText`가 `ownerSVGElement` 없는 글을 건너뛰고(9-5), 전에 키운 글자는 먼저 작가 크기로 되돌린 뒤 다시 판단한다(9-4). 키운 뒤 작가가 바꾼 인라인 크기는 덮어쓰지 않는다.
  - `skills/learn-to-tell/kit/ltt-deck.js`: `scene-overflow` msg의 "78%까지 줄여도"는 세로 넘침일 때만(9-1). `placement.pages`가 배율을 정한 뒤 쪽마다 목록 높이를 재 가장 긴 쪽 높이를 `min-height`로 잡는다(9-2).
  - 문서: `kit/API.md`(시각 칸 형제 배치가 칸마다 가로/세로로 다름 — 8, SVG 글자 보정 시점과 한계 — 4), `kit/api/rules.md`(scene-overflow 정의), `kit/api/deck-contracts.md`(summary 높이 고정), `kit/CHANGELOG.md`.
  - 이전 세션이 사용자 확인 없이 정한 것(되돌리거나 바꿀 수 있음):
    - 9-2 해법: 목록에 가장 긴 쪽 높이를 `min-height`로 준다. 다른 안은 summary를 위쪽 정렬로 바꾸는 것이다.
    - "사소한 항목" 범위: 8, 9-1, 9-2, 9-4, 9-5. 9-3은 테스트 계약이 바뀌어 뺐다.
    - `kit/API.md`에 생성 에이전트에게 주는 새 지시 두 문장을 더했다: "다른 배치가 필요하면 감싸는 요소 하나에 배치를 준다"(8), "그런 글은 처음부터 10px 이상으로 쓴다"(4). 리뷰가 요구한 것은 문서와 동작의 불일치 수정뿐이었다.
  - 확인하지 않은 조건: 9-2는 1280×800 데스크톱에서만 쟀다. `min-height`는 데스크톱 배치 때만 잡히고 폰 배치로 바뀌어도 남는데(폰은 한 열이라 보통 더 길어 영향이 없을 것으로 추정, 미확인), 창 크기 변경 뒤 다시 잰 높이도 확인하지 않았다. 9-4는 `LTT.fixSvgText`를 직접 부른 fixture로만 확인했다.
  - 확인: 9-2는 갤러리 art-of-loving·projectile-drag 1280×800에서 쪽 넘김 전후 h2·쪽 버튼 y가 같다(수정 전 84→260, 73→236). 9-4는 SVG 폭 300→1000→200px에서 20px→33.3→20→50px, 작가가 바꾼 70px 유지. 둘 다 scratchpad 실험 스크립트로만 확인했고 회귀 테스트는 없다.
- 리뷰 실험 스크립트(세션 scratchpad, 세션이 끝나면 없어질 수 있음): `/private/tmp/claude-501/-Users-hwansu-toy-projects-learn-to-tell/83379570-f19f-47d7-b922-c8c6299bc068/scratchpad/exp/` (`x1` fixSvgText 배율·live/shot, `x2` 그려진 글 용어 검사, `x4` shot clock 재그림, `x5` summary 중복 보고, `x9` 갤러리 SVG 글자, `pg` 쪽 넘김 위치, `fs` 글자 복원). 리뷰의 갤러리 shot은 같은 scratchpad의 `gnew/`(new)·`gold/`(base).

## 남은 항목과 이전 세션의 평가

> 아래 "찬성/반대"와 신뢰도는 이전 세션(리뷰를 받고 일부를 고친 세션)의 평가다. 다음 세션은 참고로만 보고, 코드와 재현으로 다시 판단한다. 리뷰 내용은 Opus xhigh 서브에이전트가 base `9636962` worktree와 비교·재현한 결과이고, 이전 세션은 9-x 수정 외에는 직접 재현하지 않았다. BUG·RISK·NIT 분류와 "리뷰 수정안"도 리뷰 서브에이전트의 판단이다.

### 1. BUG — `?shot`의 clock 다시 그리기가 요청한 상태를 덮는다

- 위치: `kit/ltt.js` `shotPosition`의 `signal()`(clock `entry.repaint` 호출), 커밋 `5aac51f` 기준 1306–1314행.
- 리뷰 재현: compare reveal에서 base "REVEALED" → new "animated 600". figure step-2의 `enter`가 칠한 빨강이 clock 재그림으로 회색. 상태 PNG가 학습자 화면과 다르다.
- 리뷰 수정안: clock 재그림을 `checkSrc.state(st)` 앞으로 옮기고 `fixSvgText`는 신호 직전에 둔다.
- 찬성(신뢰도 높음): 실제 화면에서 공개·단계 넘김은 clock이 끝난 뒤 학습자가 하므로 "clock 끝 → 상태"가 맞는 순서다. 15번(FR-13)이 노린 sweep 렌더·`enter` 뒤 재그림은 둘 다 `shotPosition` 전에 일어나 순서를 바꿔도 유지된다.
- 반대: 근거 있는 반대 없음. 확인할 점(신뢰도 중간): `state(st)` 안에서 새로 만들어지는 clock은 재그림 대상에서 빠진다. `?shot`의 clock은 만들어질 때 `draw(dur)` 한 장만 그리므로 문제없을 것으로 보지만 테스트로 확인한다.

### 2. BUG — summary 쪽을 넘기면 recall 번호가 01부터 다시

- 위치: `kit/ltt-deck.js` `.dk-rc li{counter-increment:rc}`·`li::before{content:counter(rc…)}`, 쪽 밖 항목은 `.ltt-hidden`(`display:none`, `ltt.js`).
- 리뷰 재현: 갤러리 art-of-loving·projectile-drag 2쪽 7·8번이 "01·02". VO-5 테스트는 글만 보고 번호는 안 본다.
- 찬성(신뢰도 높음): `display:none` 요소는 CSS counter를 올리지 않는다. 카드형은 `pad2(c.n)`으로 번호를 직접 넣어 문제없다.
- 수정 방향(이전 세션 의견, 신뢰도 중간): recall 항목도 번호를 직접 넣거나 쪽 첫 항목에 `counter-set`을 준다. `extra`의 `+` 표시는 유지한다.
- 반대: 없음.

### 3. RISK — `fixSvgText` 배율이 틀리는 경우

- 위치: `kit/ltt.js` `fixSvgText`. 배율 = `ownerSVGElement` 상자 폭 ÷ viewBox 폭.
- 리뷰 재현(1440×900 fixture): 높이 제한으로 상자보다 작게 그려진 SVG(기본 `meet`)는 보정 뒤 8px, viewBox 없는 중첩 `<svg>`는 2.9px(FR-4 "가장 가까운 `<svg viewBox>`"와도 다름), `<g transform="scale(.5)">`는 5px. `svg{max-height:58vh}` 패턴은 갤러리 6개 수업에 있다. 현재 갤러리 1280×800에서 보정 뒤 9.5px 미만은 0건(잠재 결함).
- 리뷰 수정안: `t.getScreenCTM()`으로 실제 배율.
- 찬성(신뢰도 높음): 지금 공식은 viewBox와 상자 비율이 같고 내부 변환이 없을 때만 맞다.
- 반대·주의(신뢰도 중간): `getScreenCTM()`이 장면 `zoom`(fit 0.78–1)을 포함하는지 Chrome에서 확인해야 한다. 지금 공식은 `getBoundingClientRect`라 zoom을 포함한다. 비균등 배율(`preserveAspectRatio="none"`)이면 글자 높이에 맞는 세로 성분을 써야 한다. 글마다 CTM을 구하면 svg마다 한 번보다 비싸다(갤러리 수백 개 수준이라 문제는 작을 것).

### 4. RISK — fit 뒤에 다시 그린 작은 글자는 화면에선 작고 `?shot`에서만 커진다

- 위치: 보정은 `ctx.fit`(`ltt-deck.js`)과 `?shot` 신호 직전(`ltt.js`)에서만 돈다.
- 리뷰 재현: 매 프레임 `<text>`를 다시 쓰는 clock은 끝난 뒤 화면 4.8px, `?shot` 10px. step `enter`가 글을 다시 쓰는 figure도 같다. 갤러리에서는 차이 없음.
- 이전 세션 처리: 한계를 `kit/API.md`에 적었다(그런 글은 처음부터 10px 이상으로 쓴다). 코드는 안 바꿨다.
- 찬성(코드로 고치자, 신뢰도 낮음–중간): PNG 검토가 못 잡는 차이라 원칙 4(렌더 결과로 검사)와 어긋난다.
- 반대(신뢰도 중간): 고치려면 SVG `<text>` 변경을 MutationObserver로 보고 다시 보정해야 하는데, 매 프레임 글을 다시 쓰는 clock이면 프레임마다 측정이 돈다. 갤러리 사례가 없으니 문서로 둔 지금 상태가 비용 대비 낫다고 봤다. 대안: `?shot`에서 보정 전후 크기가 다르면 advice로 알리는 방법.

### 5. RISK — kit 버튼·라벨 글이 용어 검사의 수업 글로 섞인다

- 위치: `kit/ltt.js` `renderedText`, `ltt-deck.js`의 그려진 글 수집.
- 리뷰 재현: glossary `{"정답":…}`, 첫 `{{정답}}`이 장면 4, predict가 장면 2 → new에서 `used-before-defined 장면 2`(kit 버튼 "정답 보기"·"정답과 이유" 때문), base는 없음. "초기화", 쪽 버튼 "이전 쪽"·"다음 쪽", "답 보기"도 같은 위험.
- 리뷰 추가: inline 형제 글이 구분자 없이 붙어("가나잘 모르겠다") 다른 한글 낱말 뒤에 오는 용어를 놓친다(거짓 음성).
- 찬성(kit 글 제외, 신뢰도 높음): kit이 만든 UI 글은 작가가 쓴 글이 아니다. kit이 만드는 버튼·라벨에 표지(예: kit 표지 속성)를 달고 `renderedText`가 건너뛰면 된다.
- 반대·주의(구분자, 신뢰도 중간): 모든 요소 경계에 구분자를 넣으면 `<b>가</b>나` 같은 낱말 안 강조가 쪼개져 거짓 양성이 생긴다. 구분자는 inline-block·flex/grid 항목·버튼처럼 낱말이 이어질 수 없는 경계에만 넣는 쪽이 낫다고 본다.

### 6. RISK — summary가 앞 장면 takeaway의 용어·채움 글 오류를 다시 낸다

- 위치: summary가 다른 장면 takeaway를 그리고, 중복 제거는 장면 안에서만(`ltt.js` `deckIssues`).
- 리뷰 재현(`x5`): base 2건(장면 2) → new 4건(장면 2, 장면 3 = summary). `where`가 작가가 고칠 수 없는 장면을 가리킨다.
- 찬성(결함이다, 신뢰도 높음).
- 수정 방향(신뢰도 중간): summary·overview가 모아 그린 takeaway 사본은 그려진 글 수집에서 빼는 쪽이 낫다고 본다. 덱 전체에서 `(rule, msg)`로 합치는 방법은 서로 다른 장면의 실제 오류도 합칠 수 있어 덜 낫다.

### 7. RISK — `LTT.expect`가 타입이 다른 값을 이제 불일치로 본다

- 위치: `kit/ltt.js` `same()`/`compare()`.
- 리뷰 재현(vm): `expect(l, 42, "42")`, `(0, null)`, `(1, true)`가 base는 통과, new는 실패. archived spec(`agent-docs/spec-logs/e48ead05eb246d3c-layout-check-and-kit-defects.md`) Errors 줄의 "타입 다른 값 … 예전과 같음"과 다르다. 갤러리 `expect`는 모두 수라 영향 없음.
- 이전 세션 확인: `kit/API.md` 47행과 `kit/CHANGELOG.md`는 이미 "타입이 다르면 불일치"라고 적는다. 어긋난 것은 불변 기록인 archived spec 문장뿐이다.
- 찬성(엄격 비교 유지, 신뢰도 중간–높음): `42`와 `"42"`가 같다고 통과하는 것은 계산 결함을 숨긴다. 작가 문서와 동작이 이미 일치한다.
- 반대(신뢰도 낮음): 사용자 `~/.learn-to-tell/` 옛 수업 중 타입이 섞인 `expect`가 있으면 다시 열 때 새 `expect-mismatch`가 생긴다. 다만 그것도 실제 불일치를 드러내는 것이다.
- 남은 일: 사용자가 엄격 비교 유지를 확인하면 할 일 없음(spec-log는 고치지 않는다).

### 9-3. NIT — `vw-size`가 무해한 상한까지 "고침" 오류로 낸다

- 리뷰 근거: `site/gallery/scenes.html`의 `min(8px,1vw)` ×7, `max-width:calc(100vw - 48px)` 같은 패턴(kit도 쓴다, 단 kit 스타일은 검사에서 빠진다).
- 이번에 안 고친 이유: 범위를 줄이면 승인된 테스트 계약(VO-11 `tests/layout-check.test.mjs`의 8건, `max-width` 포함)이 바뀌어 사용자 결정이 필요하다.
- 찬성(줄이자, 신뢰도 낮음): `min(8px,1vw)`처럼 결과가 작은 px 상한에 묶이는 값은 칸 폭을 넘을 수 없다.
- 반대(지금대로, 신뢰도 중간): 18번의 원래 사례가 hook 칸을 덮어쓴 `min(440px, 34vw)`였다. `min()` 안 vw나 `max-width`를 통째로 빼면 원래 결함을 놓친다. 바꾼다면 "vw를 포함한 식이 칸 폭을 넘을 수 있는가"를 계산해야 해서 단순 패턴 검사보다 복잡하다. advice로 낮추는 안도 있으나 그러면 18번을 "고침"으로 막은 의도가 약해진다.

## Failed Attempts

| attempt | failure evidence | cause |
|---|---|---|
| 9-2 확인 스크립트를 `?check` 없이 실행 | `.dk-pager`가 null(`Cannot read properties of null`) | 덱은 방문한 장면만 mount한다. `?check`로 모든 장면을 그려야 쪽 버튼이 있다 (verified) |

## Next Step

1. 사용자에게 커밋하지 않은 9-x 수정의 커밋 여부를 확인한다.
2. 아래는 이전 세션의 제안이고 사용자가 아직 정하지 않았다.
   - 9-2·9-4 회귀 테스트 추가, 위 "확인하지 않은 조건" 확인.
   - 1·2·3·5·6 수정. workflow-approach run으로 할지, 상위 handoff의 다음 run 범위(13·16·20·A-4, 비차단 권고)와 묶을지는 사용자가 정한다.
   - 4·7·9-3은 Open Questions의 결정 뒤 처리.

## Open Questions

- 7: 엄격 비교 유지(문서와 동작 이미 일치)로 끝낼지.
- 9-3: `vw-size` 범위를 그대로 둘지, 줄일지(줄이면 18번 원래 사례를 계속 잡는 방법 포함), advice로 낮출지.
- 4: 문서로 둔 지금 상태로 끝낼지, 코드(관찰자 또는 `?shot` advice)로 고칠지.
- 1–6을 상위 handoff의 다음 run과 한 run으로 묶을지.
- 이전 세션이 정한 9-2 해법(`min-height`)과 `kit/API.md`에 더한 두 지시 문장을 유지할지.

## Spec

- 이 작업의 spec 없음(리뷰와 사소한 수정은 workflow-approach 밖에서 함).
- 리뷰 대상 run: `agent-docs/spec-logs/e48ead05eb246d3c-layout-check-and-kit-defects.md`, v6, status complete, run `e48ead05eb246d3c`.

## Execution Ledger

- findings: 리뷰 BUG 2(1, 2), RISK 5(3–7), 문서 불일치 1(8), NIT 5(9-1–9-5). 처분: 8, 9-1, 9-2, 9-4, 9-5 고침(커밋 안 함), 4는 문서화만, 나머지 open.
- evidence: 리뷰 서브에이전트(Opus xhigh) 보고(base `9636962` worktree와 headless Chrome·vm 비교, 갤러리 `audit.mjs --shots`), 이전 세션 실험 `pg.mjs`·`fs.mjs`, `npm test` 1466/1466.
- 리뷰 서브에이전트가 "문제 없음"으로 본 영역: 렌더 순서(장면 7종 DOM 순서·중복 삽입 없음, `mountFigure` (a)–(d)), 레이아웃 측정(비현재 장면 translate·zoom 일관, rise 애니메이션 거짓 양성 없음, 갤러리 유일 `scene-overflow` vector-calculus s07은 실제), rule 등록부·`AUDIT_RULE_IDS`, `vw-size` 스캔 범위(kit style 5개 표지, KaTeX `/kit/`), summary 쪽 넘김(번호 제외), tspan 변환·팝오버, hook 자유 그림 칸, `zoomTo` transition 마무리. 갤러리 audit `--shots` 2:12 → 2:28(shot 11장 증가).
- fuzz·mutation: 이번 작업에서는 없음.
- verifier: 이번 작업에서는 없음.
