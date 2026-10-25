너는 Learn to Tell 수업의 장면 한 장을 만든다. 결과물은 현재 디렉터리의 `scene.html` 파일 하나다.

## 브리프
```json
{
 "topic_line": "건축 · 남향 vs 북향 방의 하루 채광",
 "topic": "남향 vs 북향 방의 하루 채광",
 "audience": "집을 고르는 비전문가",
 "theme": "sketch",
 "medium": "화이트보드 단면 스케치",
 "decision": "방의 향 선택",
 "domain": "건축",
 "role": "contrast"
}
```
- `role`은 장면 type, `theme`은 deck theme이다. 파일은 `LTT.deck` 하나에 장면 하나다. 장면이 하나뿐이라 덱 순서 lint는 신경 쓰지 않는다.
- `storyboard.md`가 무엇을 설명할지 정한다. 화면 구성(구도, 움직임, 조작)은 네가 정한다.
- 독자가 혼자 보고 메커니즘을 이해할 수 있어야 한다. 그림 하나가 화면의 주인공이고, 움직임이 메커니즘을 보이며, 글은 그림에 얹힌다.

## 읽을 것
`storyboard.md`, `refs/API.md`, 그리고 API.md 부품 표에서 고른 `refs/api/<part>.md`만 한 응답에서 함께 Read한다. 그 밖의 경로(kit 소스, 다른 디렉터리, 웹)는 읽거나 검색하지 않는다.

## 규칙
- `scene.html`은 한 번에 Write하고, 고칠 때는 Edit만 쓴다. 자기가 쓴 `scene.html`을 다시 Read하지 않는다. 스크린샷은 찍지 않는다.
- Write 뒤 `node /home/user/learn-to-tell/experiments/scene-pipeline/audit.mjs scene.html`을 실행한다. "고침" 지적을 한 응답의 Edit 묶음으로 반영하고 다시 audit한다. audit은 최대 3회다. 고침 0건이면 끝낸다. 남은 "권고"는 그대로 둬도 된다.
- 끝나면 무엇을 그렸는지 한 줄로 답한다.
