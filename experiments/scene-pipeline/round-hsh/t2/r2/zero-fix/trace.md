# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix/refs/api/ui.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix/scene.html` (+10130자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 cwnd 시계열 플롯을 그렸다. slow start가 ×2/RTT로 64까지 올라 손실(✕)이 나면, 독자가 직후 cwnd(1/32/48)를 고른다. 정답 공개 뒤에는 ssthresh=32 선이 먼저 나오고, 중복 ACK의 64→32 반감과 +1/RTT 톱니, 타임아웃의 64→1 재시작이 차례로 그려진다. 마지막에 평균 48(최고점의 75%)과 처리량 14.95 / 11.2 / 0.23 Mbit/s, 진단 문장이 붙는다.

audit은 1회 실행했고 고침 0건이다. 남은 권고는 화면에 맞추려고 78%로 줄었다는 것 하나이고, 그대로 뒀다. 브라우저에서 직접 열어 보지는 않았다.
- 결과: success $0.1944 7턴 60s
