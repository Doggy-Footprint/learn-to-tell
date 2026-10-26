# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/samples/a/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/samples/a/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/samples/a/refs/api/charts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/samples/a/scene.html` (+6052자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- 말: The audit flagged a load-order problem: `ltt-parts.js` needs d3 loaded first. Adding the d3 script tag and re-auditing.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/samples/a/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 그렸다: 지급준비율 10%에서 100의 예금이 라운드마다 준비금 10과 대출 90으로 갈라지고, 대출이 다음 은행의 예금이 되는 과정을 8라운드까지 보이며, 누적 예금이 상한 1000을 향해 올라가고 r 20%면 상한이 500으로 내려가는 것을 보여 준다. audit은 고침 0건으로 통과했다.

audit 1회차에서 `d3.min.js`가 빠져 로드가 실패해 `<script>` 한 줄을 추가했고, 2회차에서 고침 0건이었다.
- 결과: success $0.0265 8턴 170s
