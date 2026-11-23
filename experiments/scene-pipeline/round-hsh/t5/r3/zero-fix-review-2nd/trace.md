# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/refs/API.md`
- Bash `ls -la shots/`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/shots/scene-t8s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/shots/scene-knob-r-min.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/shots/scene-knob-r-max.jpg`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/review.md` (+2138자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-fix-review-2nd/review.md`
- 말: 실패 3개 중 2개를 고쳤고 1개는 남았습니다. 실패 3건, 고친 항목 2건입니다.

- **고친 것**
  - "처음 예금" 라벨이 500억 점선과 겹쳐서, x축 아래 행으로 옮겼습니다 (`scene.html:117`).
  - 본문의 "위 파랑은 대출" 같은 색 이름을 없애고 위치로 가리키게 했습니다 (`scene.html:57`).
- **남은 것**
  - 하단 takeaway·recall 띠가 1280×800에서 잘립니다. 축약 뒤에도 장면 축소율이 78%로 그대로여서, audit 권고("글을 줄이거나 장면을 나눌 것")로 남겼습니다. 제대로 고치려면 장면을 나누거나 차트를 줄여야 하는데, 방향을 바꾸는 일이라 제가 하지 않았습니다.
- **audit**: 재실행 결과 고침 0건, 권고 2건(축소,
- 결과: success $0.0272 18턴 134s
