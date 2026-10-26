# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero/refs/api/deck-contracts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero/scene.html` (+12034자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 B+tree 삽입 시 노드 분할이 루트까지 전파되는 과정을 7단계 도해로 그렸고, audit은 "고침 0건"이었습니다. 한 번 돌렸고 스크린샷은 찍지 않았습니다.

- **1~2단계:** 높이 3 트리의 루트, 내부 노드 I2, 잎 L이 모두 꽉 찬 상태에서 키 86이 들어가 잎이 넘칩니다.
- **3~5단계:** 잎이 3+2로 갈라지고 86이 복사되어 올라갑니다. I2가 갈라지며 80이 이동해 올라가고, 루트가 갈라져 100이 올라가 새 루트가 맨 마지막에 생깁니다. 이때 모든 잎이 한 층 내려가 높이가 3에서 4가 됩니다.
- **6~7단계:** 부모에 빈 칸이 있으면 분할이 한 번에 멈추는 대비, 8 KB와 4 KB 페이지의 팬아웃과 담기는 키 수 비교(약 1.25억 대 1,5
- 결과: success $0.3975 7턴 174s
