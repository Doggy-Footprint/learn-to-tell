# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/c/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/c/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/c/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/c/refs/api/ui.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/c/scene.html` (+3509자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 '중복 ACK' (앞 장면에서 풀이할 것)
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  권고 lint no-signature: 그림이 주인
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/c/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/c/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 cwnd 시계열 predict 장면을 그렸다. 중복 ACK 손실(cwnd 64) 뒤 cwnd가 32로 절반이 되는 경로와 타임아웃 시 1로 떨어지는 경로를 손실 → ssthresh → 하강 순서로 나란히 그린다. audit은 2회 만에 고침 0건으로 끝났고, 남은 권고(no-signature, 그림이 주인공인 장면 없음)는 단일 predict 장면이라 그대로 뒀다.
- 결과: success $0.0145 10턴 69s
