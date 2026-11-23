# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-t8s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-step1.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-step2.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-step3.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-step4.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-step5.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-step6.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-step7.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/shots/scene-step8.jpg`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/review.md` (+2125자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero-fix-review/review.md`
- 말: 실패 3건, 고친 3건입니다. audit은 1회 실행했고 고침 0건으로 끝났습니다. 남은 권고 2건(장면 78% 축소, 그림 주인공 없음)은 그대로 두었습니다.

- 고친 것: S5 ✕ 마커가 `term 2` 글자와 index 6 칸에 겹쳐서 카드 하단 빈 칸으로 옮겼습니다(`scene.html:106`). "로그 칸" 캡션을 SET x=7 화살표가 가로지르던 문제는 캡션 시작 x를 옮겨 해결했습니다(`scene.html:105`). 움직임 문구가 상단에서 잘리던 문제는 y를 36→50으로 내렸습니다(`scene.html:113`).
- 남은 문제: 팔로워 커밋은 리더 커밋 다음 비트에 나타나므로 순서는 맞습니다. 다만 8번 비트에서 팔로워 커밋 표시가 commitIndex 패킷이 도착하기 전에 바뀌는데, 
- 결과: success $0.0350 24턴 166s
