# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/samples/d/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/samples/d/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/samples/d/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/samples/d/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/samples/d/refs/api/mock.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/samples/d/scene.html` (+5874자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/samples/d/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: 가비지 컬렉션 장면 한 장을 `scene.html`에 그렸다: 참조 카운팅(좌)은 A↔B 순환의 rc가 루트를 놓은 뒤 1, 1에서 멈추고 힙이 쌍마다 +1 MB씩 계단으로 오르며, mark-and-sweep(우)은 GC 때 루트에서 닿지 않는 A, B를 회수해 힙이 4~20 MB 톱니로 돈다.

audit은 2회 실행했다. 1차는 `ltt-parts.js`가 d3를 요구해서 실패했고 `d3.min.js`를 앞에 넣어 고쳤다. 2차에서 고침 0건이고 남은 권고는 "장면1이 화면에 맞추느라 78~87%로 줄었다" 하나라서 그대로 두었다.
- 결과: success $0.0285 10턴 175s
