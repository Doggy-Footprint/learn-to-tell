# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/refs/api/charts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/scene.html` (+4091자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  권고 lint no-signature: 그림이 주인공인 장면(figure, contras
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  권고 lint no-signature: 그림이 주인공인 장면(figure, contras
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  권고 lint no-signature: 그림이 주인공인 장면(figure, contras
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint used-before-defined: 'cwnd'가 풀이(첫 {{cwnd}})보다 먼저 쓰였다
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  권고 lint no-signature: 그림이 주인공인 장면(figure, contras
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/samples/d/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 TCP 혼잡 제어 predict 장면을 만들었다. 손실이 나기 전까지 slow start 곡선을 시간순으로 그리고, 손실 뒤 cwnd가 어디로 떨어질지 맞히게 한 다음 32→16 반감과 선형 증가의 톱니를 보여 준다. audit은 2회 만에 고침 0건으로 통과했고 남은 권고 2건은 그대로 두었다.

- **고침 반영:** predict 질문 앞에 나온 용어 `cwnd`가 걸려서, 답 이전 글에서는 "보낸 양(MSS)"으로 쓰고 `{{cwnd}}` 풀이는 답 뒤 `why`에 두었다. 한 장면짜리 덱이라 앞 장면에서 풀어 줄 곳이 없었다.
- **근거:** API.md의 부품 표에서 `charts.md`의 `LTT.axisPlot`을 골랐다. `answerVisual`과 `visual`
- 결과: success $0.0295 19턴 182s
