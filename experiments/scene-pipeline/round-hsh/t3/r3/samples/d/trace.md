# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/d/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/d/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/d/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/d/refs/api/ui.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/d/scene.html` (+5623자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 장면1 graph-overlap: 그래프에서 라벨·노드·엣지가 2곳 겹친다. 좌표를 손으로 정했다면 LTT.autoLayout으로 배치할 것
  권고 장면1 shrunk: 화면에 맞추느라 86%로 줄었다. 글을 줄이거나 장면을 나눌 것
  권고 lint no-signature: 그림이 주인공인 장면(fig
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/d/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
  고침 lint overview-order: overview는 summary 뒤, keywords 바로 앞에 둔다
## 1280x800
  권고 장면1 shrunk: 화면
- 말: `scene.html`을 만들었다. 중앙 S2가 후보에서 리더가 되고, 과반수(5개 중 3개)가 저장한 뒤에만 커밋되는 Raft 쓰기 흐름을 8단계 재생으로 그렸다.

audit은 2회 돌렸다. 1회차 고침 4건 중 `graph-overlap`(라벨과 노드 겹침)은 노드 간격을 넓혀 해결했다. 남은 고침 1건은 `overview-order`(overview는 summary 뒤에 와야 함)인데, 장면이 하나뿐이라 덱 순서 lint는 보지 않는다는 브리프 지시에 따라 그대로 두었다. 권고 2건(`shrunk`, `no-signature`)도 남아 있다.

한 가지 짚을 점: 브리프의 `role`인 `overview`를 장면 type으로 썼기 때문에 단계 재생은 `overview` 안의 `dg.player`로 구
- 결과: success $0.0251 9턴 133s
