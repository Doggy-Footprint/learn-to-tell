# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/refs/API.md`
- Bash `ls -la /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/shots/`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/shots/scene-t8s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/shots/scene-index.json`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/review.md` (+1795자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review/review.md`
- 말: 실패 6개 항목 중 6개를 고쳤다. `review.md`는 검수 표와 `## 고친 것` 목록을 담고 있고, audit 재실행 결과는 "고침 0건"이다. 남은 것은 권고 2건(78% 축소)뿐이라 그대로 두었다.

고친 내용은 `scene.html`에 Edit 5회로 반영했다.
- 제목: "1로 돌아가지 않는다"는 타임아웃 경로(1로 떨어짐)와 맞지 않아 "보통 1이 아니라 절반에서 다시 오른다"로 바꿨다.
- 첫 톱니의 RTT 38 낙하가 빠져 있어 경로 범위를 고쳤다.
- slow start 라벨, 중복 ACK 라벨, 평균 라벨이 곡선·선과 겹쳐 위치를 옮겼다.
- 화면에 꼭 보여야 할 "congestion avoidance" 구간 이름을 중복 ACK 라벨에 넣었다.

확인 범위: 캡처는 답 전 상태(t1s
- 결과: success $0.0302 20턴 159s
