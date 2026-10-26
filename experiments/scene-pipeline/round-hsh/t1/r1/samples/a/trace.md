# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/samples/a/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/samples/a/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/samples/a/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/samples/a/refs/api/ui.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/samples/a/scene.html` (+8650자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/samples/a/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 lint used-before-defined: 'B+tree'가 풀이(첫 {{B+tree}})보다 먼저 쓰였다
  권고 lint unused-term: glossary의 'B+tree'가 어디에도 표시되지 않았다
## 1280x800
  고침 lint used-before-defined: 'B+tree'가
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r1/samples/a/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: B+tree에 25를 넣을 때 분할이 리프 → N2 → 루트로 한 층씩 번지고, 루트가 갈라질 때만 새 루트가 생겨 높이가 3에서 4로 오르는 4단계 figure 장면 하나를 `scene.html`에 만들었다. audit은 2회 실행해 첫 회에 실패한 `d3.min.js` 로드 누락과 `B+tree` 용어 표시 순서를 고쳤고, 마지막 실행에서 고침 0건으로 통과했다.
- 결과: success $0.0446 11턴 329s
