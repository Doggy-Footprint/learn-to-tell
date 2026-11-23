# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/zero/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/zero/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/zero/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/zero/refs/api/controls.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/zero/scene.html` (+15112자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 높이 3 B+tree 도해를 그렸습니다. 25 삽입이 리프 분할(25 복사), N2 분할(60 이동), 루트 분할(200 이동) 순으로 아래에서 위로 번지고, 새 루트가 맨 위에 생겨 높이가 3에서 4가 됩니다. audit은 1회 실행했고 고침 0건이며, 스크린샷은 찍지 않았고 브라우저에서 재생해 보지도 않았습니다.

노드는 분할 때마다 원본에서 갈라져 오른쪽 형제로 옮겨 가고, 올라가는 키는 토큰으로 날아갑니다. 단계는 7개이고, 아래쪽에 올라간 키 25, 60, 200이 차례로 쌓입니다.
- 결과: success $0.4769 7턴 233s
