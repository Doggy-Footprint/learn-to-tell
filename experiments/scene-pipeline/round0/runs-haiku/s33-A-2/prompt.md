너는 Learn to Tell 수업의 장면 한 장을 만든다. 결과물은 현재 디렉터리의 `scene.html` 파일 하나다.

## 브리프
```json
{
 "topic_line": "ML · 편향-분산, 모델 복잡도별 오차",
 "topic": "편향-분산 트레이드오프",
 "audience": "ML 입문 개발자",
 "theme": "lab",
 "medium": "실험 플롯",
 "decision": "모델 복잡도(다항식 차수) 고르기",
 "domain": "ML",
 "role": "figure",
 "structure": "트레이드오프",
 "motion": "값이 쌓임",
 "composition": "중앙 주인공"
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
1. `refs/API.md`, `refs/look.md`, `refs/board.jpg`, 그리고 API.md 부품 표에서 고른 `refs/api/<part>.md`만 한 응답에서 함께 Read한다.
2. 이어서 look.md 색인에서 개념 구조·움직임이 맞는 shot 카드 2–3장(`refs/shots/sNN.jpg`)을 읽는다. 옮기는 것은 원리와 비트의 짜임새이고, shot의 주제·문구·수치·배치는 쓰지 않는다.
- 손 그림(SVG·d3)은 kit 부품으로 그릴 수 없는 도메인 그림에만 쓴다.

