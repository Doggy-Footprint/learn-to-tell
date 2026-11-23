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
- `storyboard.md`가 무엇을 설명할지, `plan.md`가 화면 구성과 검사 지점을 정한다. plan.md의 구성안 `c1`으로 만든다(추천 여부와 무관하게 `c1`).
- 독자가 혼자 보고 메커니즘을 이해할 수 있어야 한다. 그림 하나가 화면의 주인공이고, 움직임이 메커니즘을 보이며, 글은 그림에 얹힌다.

## 읽을 것
`storyboard.md`, `plan.md`, `refs/primitives.md`, 본보기 `refs/examples/s15-securitization-tranches.html`, `refs/examples/s26-git-branch-terms.html`를 한 응답에서 함께 Read한다. 그 밖의 경로(kit 소스, 다른 디렉터리, 웹)는 읽거나 검색하지 않는다.

## 검사 지점 블록
plan.md의 검사 지점마다, 내 장면에서 그 상태에 도달하는 방법을 `<head>` 안에 적는다:
```html
<script type="application/json" id="ltt-checks">
[{"id": "k1", "expect": "plan.md의 검사 지점 문장", "reach": [{"step": 3}, {"wait": 1500}]}]
</script>
```
`reach`는 장면을 새로 연 상태에서 차례로 하는 동작이다:
- `{"wait": ms}`: 기다림(자동 재생 장면은 그 비트가 보이는 시각).
- `{"step": n}`: 그림 단계 n번째로(1부터, figure `steps`·`LTT.stepper`의 "다음" 단추).
- `{"knob": "id", "stop": i}`: `steps` 손잡이 `#id`의 i번째(0부터) 단추. `{"knob": "id", "value": v}`: range 손잡이 `#id`의 입력값.
- `{"click": "css 선택자"}`.
녹화 스크립트가 이 동작으로 지점마다 스크린샷을 찍어 검토에 쓴다.

## 규칙
- `scene.html`은 한 번에 Write하고, 고칠 때는 Edit만 쓴다. 자기가 쓴 `scene.html`을 다시 Read하지 않는다. 스크린샷은 찍지 않는다.
- Write 뒤 `node /home/user/learn-to-tell/experiments/scene-pipeline/audit.mjs scene.html`을 실행한다. "고침" 지적을 한 응답의 Edit 묶음으로 반영하고 다시 audit한다. audit은 최대 3회다. 고침 0건이면 끝낸다. 남은 "권고"는 그대로 둬도 된다.
- 끝나면 무엇을 그렸는지 한 줄로 답한다.
