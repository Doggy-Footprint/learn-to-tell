# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/refs/API.md`
- Bash `ls -la shots/ refs/ 2>&1`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/shots/scene-t8s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/shots/scene-index.json`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/review.md` (+2282자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html 2>&1`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 87%로 줄었다. 글을 줄이거나 장면을 나눌 것
  권고 장면1 small-visual: 가장 큰 그림이 화면의 17%뿐이다. 그림을 키우거나 layout: "full"
  고침 lint overview-order: overview는 summary 뒤, keywords
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/review2/review.md`
- 말: 실패 4건, 고친 항목 3건입니다.

남은 고침 1건은 `overview-order`(두 해상도 모두 같은 항목)입니다. 장면이 overview 하나뿐이라 summary·keywords 자리가 없습니다. 맞추려면 덱에 장면을 더해야 하는데, keywords의 용어 목록은 제가 정할 수 없는 내용이라 이번에는 반영하지 않았습니다. 필요하면 덱 구성을 정해 주세요.

- **생성 순서·비트 10**: E가 C·D와 같은 순간 커밋되어 "E는 가장 늦다" 자막과 어긋났습니다. 마지막 단계를 둘로 나눠 C·D를 먼저, E를 나중에 적용하도록 했습니다.
- **비트 8**: 저장 막대는 1인데 C·D 칸은 이미 저장된 상태였습니다. 저장 표시를 막대가 3이 되는 단계로 옮겼습니다.
- **읽을 수 없는 글**: 범례
- 결과: success $0.0338 21턴 175s
