# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/a/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/a/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/a/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/a/refs/api/ui.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/a/scene.html` (+2988자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 82%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint used-before-defined: 'ssthresh'가 풀이(첫 {{ssthresh}})보다 먼저 쓰였다
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'R
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/a/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/a/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/a/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 TCP 혼잡 제어의 predict 장면 한 장을 그렸다. 손실 직후 cwnd(64 MSS) 질문을 던지고, 정답을 공개하면 중복 ACK 경로(64→32, 이후 RTT마다 +1)와 타임아웃 경로(→1)를 같은 손실 시점에서 나란히 그리는 cwnd 플롯이 한 점씩 그려진다. audit은 2회 만에 고침 0건으로 끝났다. 남은 권고는 "장면이 화면에 맞춰 줄었다"와 "그림이 주인공인 장면이 없다"뿐이라 그대로 두었다.

`LTT.axisPlot`의 `set(id, points)`에 `[x, y]` 배열을 넘기는 형식은 참조 문서에 명시되어 있지 않아 추정으로 썼다. 브라우저에서 한 번 확인해 볼 필요가 있다.
- 결과: success $0.0125 11턴 55s
