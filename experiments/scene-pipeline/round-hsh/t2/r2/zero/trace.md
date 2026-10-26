# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero/refs/api/ui.md`
- Bash `ls refs refs/api; cat refs/api/deck-contracts.md 2>/dev/null | head -80`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero/scene.html` (+6937자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 '
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero/scene.html`
- 말: audit 지적을 반영했고 다시 돌려 확인하는 중이다.
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 predict 장면 하나를 그렸고, 두 번째 audit에서 고침 0건이 나왔다. 남은 권고는 "78%로 줄었다"(shrunk)와 "그림이 주인공인 장면이 없다"(no-signature) 둘이다.

장면은 cwnd(MSS) 시계열 플롯이다. slow start가 RTT마다 2배로 64까지 오르다 병목 한계선에서 손실이 난다. 독자가 직후 cwnd를 1, 32, 63 중에서 고르면 정답 공개 때 손실 → ssthresh=32 → 두 경로가 순서대로 그려진다.
- 중복 ACK 경로: 32로 반감한 뒤 +1 MSS/RTT로 오르고, 평균 48(최고점의 75%, 약 11.2 Mbit/s)이다.
- 타임아웃 경로: 1로 추락해 slow start로 다시 오른다.

audit 중 expect 검
- 결과: success $0.2307 13턴 93s
