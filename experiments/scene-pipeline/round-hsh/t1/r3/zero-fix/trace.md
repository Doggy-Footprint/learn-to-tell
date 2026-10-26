# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/zero-fix/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/zero-fix/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/zero-fix/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/zero-fix/refs/api/deck-contracts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/zero-fix/scene.html` (+10110자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 52를 삽입하는 B+tree 분할 도해를 그렸고, audit은 1회 만에 고침 0건으로 끝났습니다. 6단계를 넘기며 이 순서로 바뀝니다.

1. 루트와 세 번째 잎이 가득 찬 상태에서 시작합니다.
2. 52가 들어가 잎이 초과합니다.
3. 새 오른쪽 잎이 생기고 50이 부모로 복사됩니다. 부모도 초과합니다.
4. 부모가 갈라지고 가운데 50이 위로 이동합니다.
5. 맨 위에 새 루트가 생기고 잎 깊이가 3층이 됩니다.
6. 8KB 페이지 팬아웃 약 500일 때의 규모를 보여 줍니다.

잎 연결 리스트와 복사 올림·이동 올림의 차이도 그림에 표시했습니다.

브라우저로 직접 열어 보거나 스크린샷을 찍어 확인하지는 않았습니다. audit 통과만 확인했습니다.
- 결과: success $0.2511 7턴 87s
