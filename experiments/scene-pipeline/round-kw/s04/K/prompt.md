너는 Learn to Tell 수업의 장면 한 장을 만든다. 결과물은 현재 디렉터리의 `scene.html` 파일 하나다.

## 브리프
```json
{
 "topic_line": "전기 회로 · 키르히호프 전류 법칙, 분기점에서 전하가 나뉘는 경로",
 "topic": "키르히호프 전류 법칙",
 "audience": "회로 입문자",
 "theme": "blueprint",
 "medium": "회로 도면",
 "decision": "분기점에서 전류가 어떻게 나뉘나",
 "domain": "전기 회로",
 "role": "figure"
}
```
- `role`은 장면 type, `theme`은 deck theme이다. 파일은 `LTT.deck` 하나에 장면 하나다. 장면이 하나뿐이라 덱 순서 lint는 신경 쓰지 않는다.
- `storyboard.md`가 무엇을 설명할지 정한다. 화면 구성(구도, 움직임, 조작)은 네가 정한다.
- 독자가 혼자 보고 메커니즘을 이해할 수 있어야 한다. 그림 하나가 화면의 주인공이고, 움직임이 메커니즘을 보이며, 글은 그림에 얹힌다.

## 읽을 것
`storyboard.md`, `refs/API.md`, 그리고 API.md 부품 표에서 고른 `refs/api/<part>.md`만 한 응답에서 함께 Read한다 (본보기 포함). 그 밖의 경로(kit 소스, 다른 디렉터리, 웹)는 읽거나 검색하지 않는다.

## 본보기
`refs/examples/`의 `s49-basketball-zone-value.html`, `s34-amoc-weakening.html`는 이 장면에 필요한 기법(공간 도면 그리기, 갈라지고 합쳐지는 흐름, 경로를 따라 흐르는 입자, 움직이는 숫자 판독, 맥박 원)을 구현한 장면이다. kit 문서와 함께 Read하고, 기법(그리는 방법, 재생 루프, 조작)을 옮긴다. 본보기의 주제·문구·수치·배치는 옮기지 않는다.

## 규칙
- `scene.html`은 한 번에 Write하고, 고칠 때는 Edit만 쓴다. 자기가 쓴 `scene.html`을 다시 Read하지 않는다. 스크린샷은 찍지 않는다.
- Write 뒤 `node /home/user/learn-to-tell/experiments/scene-pipeline/audit.mjs scene.html`을 실행한다. "고침" 지적을 한 응답의 Edit 묶음으로 반영하고 다시 audit한다. audit은 최대 3회다. 고침 0건이면 끝낸다. 남은 "권고"는 그대로 둬도 된다.
- 끝나면 무엇을 그렸는지 한 줄로 답한다.
