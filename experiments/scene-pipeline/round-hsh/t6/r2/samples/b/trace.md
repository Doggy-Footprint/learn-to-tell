# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/samples/b/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/samples/b/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/samples/b/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/samples/b/refs/api/ui.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/samples/b/scene.html` (+3858자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/samples/b/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 장면1 graph-overlap: 그래프에서 라벨·노드·엣지가 2곳 겹친다. 좌표를 손으로 정했다면 LTT.autoLayout으로 배치할 것
## 1280x800
  고침 장면1 graph-overlap: 그래프에서 라벨·노드·엣지가 2곳 겹친다. 좌표를 손으로 정했다면 LTT.autoLayout으로 배치
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/samples/b/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/samples/b/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: 참조 카운팅과 mark-and-sweep에서 같은 A↔B 순환을 나란히 놓고, 바깥 변수 x, y 해제 뒤 카운트 1로 남는 쪽과 표시되지 않아 sweep되는 쪽을 단계별로 보여 주는 장면을 `scene.html`에 만들었다. audit은 2회 실행했고 1차에서 고침 8건(d3 누락)과 2차에서 고침 2건(그래프 라벨 겹침)을 고쳐 최종 고침 0건이다. 남은 권고 1건(화면 맞춤 86%)은 그대로 둔다.
- 결과: success $0.0165 12턴 105s
