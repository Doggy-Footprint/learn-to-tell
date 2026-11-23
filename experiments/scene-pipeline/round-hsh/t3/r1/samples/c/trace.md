# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/c/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/c/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/c/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/c/scene.html` (+5322자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- 말: Audit의 고침 지적은 d3 누락이다. `ltt-parts.js`가 d3를 요구하므로 kit 순서대로 d3를 앞에 넣고 다시 audit한다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/c/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 Raft 리더 선출과 로그 복제를 그렸다. 5노드 그림에서 리더 장애 뒤 선출, x 복제, 과반 3에서의 커밋, 늦은 노드의 따라잡기를 단계 재생으로 보여 준다. audit은 1회로 끝났고 고침 0건이다. 1280px에서 "화면에 맞추느라 86%로 줄었다"는 권고만 남았는데, 그대로 둬도 된다.

Audit 첫 실행에서 고침 8건이 나와 d3 스크립트를 추가해 고쳤다. 로드 실패가 d3 누락에서 이어진 것이다.
- 결과: success $0.0192 8턴 130s
