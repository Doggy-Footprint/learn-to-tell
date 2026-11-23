너는 Learn to Tell 수업의 장면 한 장을 만든다. 결과물은 현재 디렉터리의 `scene.html` 파일 하나다.

## 브리프
```json
{
 "topic_line": "생물 · DNA 복제 분기점, 선도 가닥과 오카자키 절편",
 "topic": "DNA 복제 분기점",
 "audience": "생명과학 입문 학생",
 "theme": "paper",
 "medium": "교과서 도해",
 "decision": "복제 과정 이해",
 "domain": "생물",
 "role": "hook"
}
```
- `role`은 장면 type, `theme`은 deck theme이다. 파일은 `LTT.deck` 하나에 장면 하나다. 장면이 하나뿐이라 덱 순서 lint는 신경 쓰지 않는다.
- `storyboard.md`가 무엇을 설명할지 정한다. 화면 구성(구도, 움직임, 조작)은 네가 정한다.
- `samples/` 아래 `a.html`, `b.html`, `c.html`, `d.html`은 Haiku가 같은 스토리보드로 서로 모르고 만든 초안 4개이고, `samples/<x>-audit.txt`는 각 초안의 마지막 audit 결과다. 초안들이 무엇을 표현하려 했는지 읽고 방향을 정한 뒤, 그 방향으로 장면을 새로 만든다.
- 독자가 혼자 보고 메커니즘을 이해할 수 있어야 한다. 그림 하나가 화면의 주인공이고, 움직임이 메커니즘을 보이며, 글은 그림에 얹힌다.
- 움직임은 스토리보드의 생성 순서를 따른다. 대상은 메커니즘 안에서 실제로 생기는 순서대로 화면에 나타나고 바뀐다.

## 읽을 것
`storyboard.md`, `samples/*.html`, `samples/*-audit.txt`, `refs/API.md`, 그리고 API.md 부품 표에서 고른 `refs/api/<part>.md`만 한 응답에서 함께 Read한다. 그 밖의 경로(kit 소스, 다른 디렉터리, 웹)는 읽거나 검색하지 않는다.

## direction.md
`scene.html`보다 먼저 `direction.md`를 한 번 Write한다(60줄 이내):
1. 초안마다 한 단락: 표현하려 한 것(그림의 뼈대, 움직임, 조작), 스토리보드의 사실 점검표·생성 순서에 맞는 점과 어긋난 점, 화면 결함으로 보이는 코드.
2. 가져올 것: 어느 초안의 어떤 아이디어나 코드를 쓰는가.
3. 최종 방향 한 단락: 그림의 뼈대, 비트별 움직임(무엇이 어떤 순서로 생기는가), 조작, 화면에 얹을 글.

## 규칙
- `direction.md`를 쓴 뒤 `scene.html`을 한 번에 Write한다. 초안 코드를 가져와도 된다. 고칠 때는 Edit만 쓴다. 자기가 쓴 파일을 다시 Read하지 않는다. 스크린샷은 찍지 않는다.
- Write 뒤 `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`을 실행한다. "고침" 지적을 한 응답의 Edit 묶음으로 반영하고 다시 audit한다. audit은 최대 3회다. 고침 0건이면 끝낸다. 남은 "권고"는 그대로 둬도 된다.
- 끝나면 첫 줄에 고른 방향을, 둘째 줄에 초안에서 가져온 것을 답한다.
