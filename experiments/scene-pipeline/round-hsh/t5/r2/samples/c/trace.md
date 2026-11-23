# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/samples/c/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/samples/c/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/samples/c/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/samples/c/refs/api/controls.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/samples/c/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/samples/c/scene.html` (+3751자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- 말: Audit의 첫 지적은 `d3.min.js` 누락이다. 불러오기 순서대로 d3를 앞에 추가하고 다시 audit한다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/samples/c/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 장면1 graph-overlap: 그래프에서 라벨·노드·엣지가 1곳 겹친다. 좌표를 손으로 정했다면 LTT.autoLayout으로 배치할 것
  권고 장면1 small-visual: 가장 큰 그림이 화면의 8%뿐이다. 그림을 키우거나 layout: "full"
## 1280x800
  고침 장면1 grap
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/samples/c/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 만들었다: 지급준비율 10%에서 은행 A→E로 대출이 예금으로 이어지는 연쇄를 다이어그램으로 보여 주고, 누적 예금이 예금 상한(100 ÷ r)에 차오르는 막대와 지급준비율 손잡이(20/10/5%)를 얹은 장면이다.

audit 결과는 고침 0건이다. 남은 권고 1건(가장 큰 그림이 화면의 7%뿐이라는 small-visual)은 두었다.

오류 두 개를 고쳤다. `d3.min.js`를 빠뜨려 덱이 뜨지 않았고, 다이어그램 칸이 좁아 엣지 라벨이 노드와 겹쳤다. 두 번째 audit에서 고침 2건이 남았고, 칸 폭을 넓힌 뒤 0건이 됐다.
- 결과: success $0.0263 12턴 164s
