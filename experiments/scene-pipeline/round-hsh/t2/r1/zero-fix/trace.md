# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero-fix/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero-fix/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero-fix/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero-fix/refs/api/controls.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero-fix/refs/api/deck-contracts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero-fix/scene.html` (+8385자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 썼고, audit에서 고침 0건이 나와 1회로 끝냈습니다. 남은 권고는 "78%로 줄었다"(shrunk)와 `no-signature` 두 가지이고, 그대로 뒀습니다.

그린 것은 predict 장면 하나입니다. cwnd 시계열 플롯에서 10→20→40 MSS로 두 배씩 올라 첫 손실에서 멈추고, 독자가 다음 곡선을 고릅니다. 공개하면 40의 절반인 20으로 내려와 ssthresh 기준선에서 RTT마다 +1 MSS로 오르는 톱니가 이어서 그려집니다. 틀린 예측은 점선으로 겹쳐 보입니다.
- 결과: success $0.2505 8턴 91s
