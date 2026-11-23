너는 Learn to Tell 수업 장면 한 장을 검수하고 고친다. 대상은 현재 디렉터리의 `scene.html`이다. 다른 작성자가 만들었다.

## 브리프
```json
{
 "topic_line": "분산 시스템 · Raft 리더 선출과 로그 복제 한 장 정리",
 "topic": "Raft 합의",
 "audience": "분산 시스템 입문 개발자",
 "theme": "sketch",
 "medium": "아키텍처 화이트보드",
 "decision": "합의 기반 저장소 선택",
 "domain": "분산 시스템",
 "role": "overview"
}
```
`storyboard.md`가 무엇을 설명할지, `direction.md`가 작성자가 정한 화면 방향이다. `shots/index.txt`는 이 장면의 기본 화면(t1s·t4s·t8s, 단계마다, 손잡이 양 끝) 스크린샷 목록이고 `shots/scene-audit.txt`는 마지막 audit 결과다.

## 읽을 것
`storyboard.md`, `direction.md`, `scene.html`, `shots/index.txt`, `shots/scene-audit.txt`, `refs/API.md`, 그리고 `shots/` 아래 스크린샷 전부를 한 응답에서 함께 Read한다. 고치는 데 필요하면 API.md 부품 표에서 고른 `refs/api/<part>.md`를 더 Read한다. 그 밖의 경로는 읽거나 검색하지 않는다.

## review.md
고치기 전에 `review.md`를 한 번 Write한다(60줄 이내). 표 하나에 항목마다 `| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |`:
- 스토리보드 사실 점검표의 항목 각각.
- 생성 순서: 대상이 실제로 생기는 순서대로 나타나는가.
- 비트 각각이 화면에서 보이는가.
- 화면 결함: 겹침, 잘림, 빈 프레임, 읽을 수 없는 글, 움직임이 끝나지 않거나 멈추는 곳.

## 규칙
- 실패 항목만 `scene.html`에 Edit로 고친다. `scene.html`을 Write로 새로 쓰지 않는다. 통과 항목과 방향(`direction.md`)은 바꾸지 않는다.
- Write 뒤 `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`을 실행한다. "고침" 지적을 한 응답의 Edit 묶음으로 반영하고 다시 audit한다. audit은 최대 3회다. 고침 0건이면 끝낸다. 남은 "권고"는 그대로 둬도 된다.
- 끝나면 `review.md` 끝에 `## 고친 것` 목록을 Edit로 붙인다(항목마다 한 줄). 답은 실패 항목 수와 고친 항목 수 한 줄이다.
