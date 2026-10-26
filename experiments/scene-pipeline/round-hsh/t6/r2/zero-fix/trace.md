# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/zero-fix/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/zero-fix/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/zero-fix/refs/api/controls.md`
- Bash `ls; ls refs refs/api`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/zero-fix/scene.html` (+7746자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 만들었다. audit 1회에서 고침 0건이었고, 남은 권고는 'retainer' 용어 미표시와 1280px 화면에서 88%로 줄어든다는 두 가지이며 그대로 뒀다.

참조 카운팅(왼쪽)과 mark-and-sweep(오른쪽)에 같은 A↔B 순환을 놓고, 7단계로 자동 재생한다.
- **카운트와 해제:** 카운트가 2에서 1로 내려가고, x, y를 해제하는 단계가 이어진다.
- **회수 차이:** 왼쪽은 서로만 붙잡아 남고, 오른쪽은 mark가 닿지 못한 A, B를 sweep이 해제한다.
- **진짜 누수와 진단:** 오른쪽에서 전역 cache가 붙잡은 객체 C가 누수로 남는 모습을 보인 뒤, 진단 질문으로 끝난다.
- **retainer 목록:** 단계마다 힙 스냅샷의 retainer 
- 결과: success $0.1767 7턴 65s
