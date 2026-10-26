# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero/refs/api/controls.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero/scene.html` (+6841자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 small-visual: 가장 큰 그림이 화면의 20%뿐이다. 그림을 키우거나 layout: "full"
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
  고침 lint overview-order: ov
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 small-visual: 가장 큰 그림이 화면의 20%뿐이다. 그림을 키우거나 layout: "full"
  고침 lint overview-order: overview는 summary 뒤, keywords 바로 앞에 둔다
## 1280x800
  권고 장면1 small-visual: 가장 큰 그림이
- 말: `scene.html`을 만들었다. audit에 남은 "고침"은 `overview-order` 한 건뿐이다. 장면이 하나뿐이라 덱 순서 lint는 무시하라는 브리프에 따라 그대로 뒀다. "권고"인 `small-visual`(그림이 화면의 20%대)도 `layout: "full"`을 넣은 뒤에도 남았지만, 규칙대로 그대로 뒀다.

그린 것은 5노드 Raft 클러스터 화이트보드 한 장이다. 7단계가 자동 재생되고 이전·다음으로도 넘길 수 있다.

1. 평시 heartbeat
2. 리더 N1 장애
3. term 3→4와 자기 투표
4. RequestVote로 3표째에 과반 돌파
5. 새 리더가 서고 heartbeat
6. 쓰기 x가 리더 로그에 미커밋으로 생기고 복제
7. 3번째 ack에서 커밋

마지막 단계는 
- 결과: success $0.2066 9턴 118s
