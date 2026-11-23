너는 Learn to Tell 수업의 장면 한 장을 만든다. 결과물은 현재 디렉터리의 `scene.html` 파일 하나다.

## 브리프
```json
{
 "topic_line": "런타임 · Node.js 이벤트 루프 단계 한 장 정리",
 "topic": "Node.js 이벤트 루프 단계",
 "audience": "Node.js 백엔드 입문자",
 "theme": "terminal",
 "medium": "터미널 로그",
 "decision": "setTimeout·setImmediate·nextTick 중 무엇으로 미룰지",
 "domain": "런타임",
 "role": "overview",
 "structure": "순환",
 "motion": "점이 궤적을 그림",
 "composition": "겹쳐 놓기"
}
```
- `role`은 이 장면의 역할(장면 type)이고, `structure`·`motion`·`composition`은 그림의 개념 구조·움직임·구도다. `theme`은 deck theme이다.
- 파일은 `LTT.deck` 하나에 장면 하나다. 장면이 하나뿐이라 덱 순서 lint는 신경 쓰지 않는다.
- 독자가 혼자 보고 메커니즘을 이해할 수 있어야 한다. 그림 하나가 화면의 주인공이고, 움직임이 메커니즘을 보이며, 글은 그림에 얹힌다.

## 규칙
- `refs/` 아래 파일만 읽는다. 그 밖의 경로(kit 소스, 다른 디렉터리, 웹)는 읽거나 검색하지 않는다.
- `scene.html`은 한 번에 Write하고, 고칠 때는 Edit만 쓴다. 자기가 쓴 `scene.html`을 다시 Read하지 않는다. 스크린샷은 찍지 않는다.
- Write 뒤 `node /tmp/claude-0/-home-user-learn-to-tell/fe71ad7b-7046-58ae-a5a3-c1fbb653b068/scratchpad/exp/audit.mjs scene.html`을 실행한다. "고침" 지적을 한 응답의 Edit 묶음으로 반영하고 다시 audit한다. audit은 최대 3회다. 고침 0건이면 끝낸다. 남은 "권고"는 그대로 둬도 된다.
- 끝나면 무엇을 그렸는지 한 줄로 답한다.

## 읽을 것
`refs/primitives.md`와 본보기 `refs/examples/s23-carnot-cycle.html`, `refs/examples/s34-amoc-weakening.html`를 한 응답에서 함께 Read한다. 그 밖의 문서는 없다.

