# stream.jsonl

- Bash `pwd && ls -la && ls -la samples refs refs/api 2>/dev/null`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/samples/c-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/samples/d-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/refs/api/ui.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/refs/api/deck-contracts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/direction.md` (+2414자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/scene.html` (+4067자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 '
- 말: The lint flags `cwnd` and `MSS` as new terms in the predict scene. Those words sit in the `sub` line and the axis label, which the predict scene shows alongside the question. I'll replace them with plain words and keep the term explanations for the reveal.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hdir/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: 방향: 손실 전 지수 곡선을 먼저 그리고, 예측 뒤 공개 때 손실 점 → 낙하 → ssthresh 기준선 → 선형 증가 순으로 한 점씩 그리는 cwnd 플롯 한 장.

초안에서 가져온 것: b의 공개 순서(손실 점 → 낙하 → 기준선 → 선형)와 c의 틱 재생 방식, d의 `rest: "dim"`과 고정 축 병목 점선. 질문의 용어 문제는 d의 audit 지적대로 질문과 축 라벨에서 뺐다.

`scene.html`은 `direction.md`를 쓴 뒤 한 번에 Write했고, audit은 2회 돌렸다. 1회차 고침 4건(질문의 `cwnd`, `MSS`)은 `sub`와 y축 라벨에서 용어를 빼서 반영했고, 2회차는 고침 0건이다. 남은 권고는 "1440·1280 모두 화면에 맞추느라 78%로 줄었다" 한 가지
- 결과: success $0.0349 22턴 163s
