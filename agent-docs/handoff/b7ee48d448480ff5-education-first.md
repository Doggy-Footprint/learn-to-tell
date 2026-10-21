# Education first

## Goal

사용자 원문:
- "하 대체 왜 다 별로일까. library를 쓰는 아이디어가 잘못된 걸까? 아니면 audit이 충분하지 않은걸까? library를 보강해야 하는 걸까? 어떻게 해야 https://learn-to-tell.vercel.app/gallery/shots/index.html 이런 비쥬얼로 제대로 된 설명을 할 수 있는걸까?"
- 아이디어:
  1. many-shot을 더 짧은 시간 단위로 보여 주고, 그 shot으로 핵심 이미지를 생성한다. 핵심 이미지는 설명의 근간이 되고, 유저에게 아이디어를 먼저 제시하는 데 쓴다.
  2. 지시와 규제를 대폭 완화한다. AI agent가 설명 방식의 결정권을 갖는다. agent가 먼저 mental image를 구축한 뒤 우리 형식에 맞게 살짝 수정한다.
  3. kit library는 기능을 제공하되 제약하지 않는다.
- "우리는 지금 주관적인 영역을 다루고 있고 검증을 위한 수치를 특정하는 것 보다는 계획을 통한 접근 후 확인이 필요해. 그러니 다음 세션에서는 지금 구조를 일부 파괴하고 지금 워크 플로우를 변경하는 것도 허가할거야."

## State

- 브랜치는 `dev`이고 HEAD는 `e744250`이다.
- 커밋하지 않은 변경이 있다.
  - `agent-docs/rejections/3c711c4d7cad7c40-ltt-later-deferred-draw.md`를 `stale/`로 옮겼고 `index.md`와 `stale.md`도 고쳤다. 사용자 지시에 따른 변경이다.
- 생성기 코드(`skills/learn-to-tell/`)는 아직 바꾸지 않았다.
- 기준으로 삼을 생성물: `~/.learn-to-tell/lessons/20261021-blockchain-hash-chain/`
  - 장면 15개, 32KB이다. audit 결과는 고침 0, 권고 5다.
  - 사용자는 이 결과물을 "별로"로 평가했다.
  - 원래 수업의 퀴즈, `result.md`, map은 보류 중이다.
- 측정 스크립트(저장소 밖): `/private/tmp/claude-501/-Users-hwansu-toy-projects-learn-to-tell/3365be40-7410-4982-ae8d-a08a9bd64532/scratchpad/metric/m.mjs`, `m2.mjs`

## 진단 (교차 검토 Opus·Sonnet의 공통 결론)

- 본보기 shot은 `draw(t)`로 계속 움직이는 그림이다. 생성물은 장면에 들어갈 때 한 번 바뀌고 멈추는 슬라이드다.
- agent는 렌더 결과를 보지 않고 생성한다. 현재 `audit.mjs`에는 contact sheet가 없다.
- 장면 수가 많아 장면당 노력이 얕다. 생성물은 장면당 약 2KB이고, 본보기는 약 8KB다.
- `SKILL.md`의 금지 목록이 gallery와 kit 소스를 읽지 못하게 막는다. agent는 shot의 프레임 jpg만 보고, 그 그림을 만드는 방법은 보지 못한다.
- kit 추상화 자체가 원인이라는 근거는 약하다.

## Failed Attempts

| attempt | failure evidence | cause |
|---|---|---|
| 하한 지표로 품질을 가르기: 글자 px(최소·중앙), 0.3s 대 3s 픽셀 차, 4초 프레임 차 합, rAF 수, CSS 애니메이션 수 | 본보기 3개(s04, s07, s09)와 생성물 2개(blockchain, sea-lanes)를 가르지 못했다. 최소 글자는 다섯 개 모두 11px였다. 본보기 s04의 움직임 값이 생성물보다 낮았다. | verified: 지표가 품질 차이와 무관하다 |
| rAF 호출 수 측정 | 화면이 계속 바뀌는 본보기에서도 0이 나왔다 | hypothesis: 카운터 주입이 실패했거나, 움직임이 SMIL·타이머에서 나온다 |
| visual_area(본보기 0.30 이상, 생성물 0.10 이하)와 active_frac(본보기 0.31 이상, 생성물 0.06–0.09)는 두 집합을 갈랐다 | 별도 검토가 "평가를 위한 평가"로 판정했다. 근거는 세 가지다: 겉모양을 재는 대리 지표다, 하한으로 걸면 Goodhart가 생긴다(무의미한 반복 애니메이션, viewBox 확대로 통과한다), 표본 5개로 고르고 같은 5개로 검증했다. | verified(사용자 판단): 주관적 영역이라 수치 하한을 특정하는 방식은 맞지 않는다 |
| 39977e7 revert 이유를 rejection으로 남기기 | revert 메시지에 이유가 없다. 사용자 설명은 "품질의 큰 하락이 있어 돌렸다. `LTT.motion.play`(07c9c39) 때문인지는 모른다"이다. | hypothesis: 동사 부품을 늘린 것이 하락의 원인인지는 확인되지 않았다 |

## Next Step

사용자는 수치 대신 계획으로 접근한 뒤 확인하기로 했다. 구조를 일부 파괴하고 워크플로를 바꾸는 것도 허가했다. 아래 순서로 진행하고, 매 단계 결과는 사람이 본다.

1. **storyboard 단계를 새로 둔다(아이디어 1).** outline과 lesson 사이에 넣는다.
   - agent가 주제의 mental image를 자유 형식으로 먼저 그린다. HTML, SVG, canvas 어느 것이든 된다.
   - 결과물은 핵심 이미지 3–5장과 비트 한 줄씩이다.
   - 사용자에게 먼저 보여 주고, 사용자가 고른 그림으로만 전체 lesson을 만든다.
2. **shot을 소스로 few-shot 제공한다(아이디어 1).**
   - 고른 2–3개 shot의 HTML 소스를 읽게 한다. `SKILL.md`의 gallery 읽기 금지를 푼다.
   - `look/shots`의 카드는 비트 단위 프레임 띠(짧은 시간 간격)로 다시 만든다.
   - 기각 기록 `2c5216fdfdbccf54`(gallery 페이지를 템플릿으로 복사)과 충돌하지 않게, 복사가 아니라 "만드는 법을 보는 예시"로 쓴다고 명시한다.
3. **규제를 결과 쪽으로 옮긴다(아이디어 2).**
   - `SKILL.md`의 방법 규정을 지운다: 매체·리듬 강제, "손 그림은 kit으로 못 그릴 때만", 재Read 금지, 스타일 권고 다수.
   - 장면 수 기본값을 6–8로 낮춘다.
   - 고침 등급은 `LTT.expect`, 넘침, 이진 결함(주 그림 장면에 그림 없음, 전 장면 정적)만 남긴다.
4. **kit 계약은 경계에만 둔다(아이디어 3).**
   - 장면 계약은 `mount(el) → {enter, leave, draw(t)}` 하나다.
   - `LTT.clock(draw)`를 만든다. rAF로 돌고, leave에서 멈추고, reduced-motion이면 최종 t를 그린다.
   - 동작 예시는 부품이 아니라 레시피 문서 `kit/api/motion.md`에 둔다. 07c9c39의 동사 부품은 되살리지 않는다(위 hypothesis 참조).
5. **agent가 결과를 본다.** audit에서 비트별 프레임 contact sheet를 만들고, outline의 "기대 화면"과 대조하는 판정 서브에이전트를 둔다.
6. **확인한다.** blockchain 주제로 현행본과 새 절차본을 사용자가 블라인드 A/B로 판정한다. 이것이 품질 판정의 기준이다.

수정 대상: `skills/learn-to-tell/SKILL.md`, `kit/API.md`, `kit/api/motion.md`(신규), `kit/ltt.js`, `server/audit.mjs`, `look/look.md`, `look/shots/`.

## Open Questions

- storyboard를 사용자에게 보여 줄 때 몇 안을 낼지 정하지 않았다(1안 또는 2–3안 비교).
- 기존 deck 형식을 유지할지, 장면 형식 자체를 바꿀지 정하지 않았다. 구조 파괴는 허가됐다.
- 39977e7 때 품질 하락의 원인은 확인되지 않았다. 새 절차에서도 같은 하락이 보이면 그때 원인을 다시 본다.
- blockchain 원래 수업의 남은 단계(§4 퀴즈, `result.md`, map)를 재개할지 정하지 않았다.

## Spec

없음. workflow-approach를 사용하지 않았다.

## Execution Ledger

- 교차 검토 서브에이전트 2개(Opus, Sonnet): 위 진단의 출처다.
- 지표 측정 서브에이전트(opus-low) 2회: 5개 대상을 측정했다. 결과는 Failed Attempts에 있다.
- 지표 비판 서브에이전트 1회: 판정은 "축소"다. audit 하한 도입은 보류하고, 비용은 생성 절차 변경과 블라인드 A/B에 쓴다.
- 대안 지표 후보(미사용): 결정 변수 결합 검사. 손잡이를 바꿨을 때 그림이 변하는지 보고, storyboard에 적은 변수와 대조한다.
