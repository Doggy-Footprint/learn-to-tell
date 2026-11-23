# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-fix/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-fix/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-fix/refs/api/controls.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-fix/scene.html` (+9715자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 만들었다. audit은 1회 돌렸고 고침 0건이다. "화면에 맞추느라 78%로 줄었다"는 권고가 남았고, 그대로 뒀다.

장면은 A→B→C…로 이어지는 은행 연쇄 막대 그림 하나다. 라운드마다 순서대로 움직인다.
1. 새 예금이 생긴다.
2. 예금이 준비금과 대출로 갈라진다.
3. 대출 화살표가 다음 은행으로 건너가 그 은행의 새 예금이 된다.

아래 띠에는 누적 예금이 쌓이고, 상한선(D0/r)은 처음부터 고정해 뒀다. 손잡이(r = 20/10/5%)를 바꾸면 연쇄가 처음부터 다시 전개되고 상한이 500, 1000, 2000으로 바뀐다. 준비금 100 불변 대비는 화면 위 수치로 보인다.

스토리보드 비트 6(지준율 인하가 곧 통화량 증가는 아니라는 점)은 화면 아래 "이론상 상한
- 결과: success $0.1892 6턴 65s
