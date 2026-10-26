# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/shots/scene-t8s.jpg`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/review.md` (+2460자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/review.md`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/zero-fix-review-2nd/review.md`
- 말: 실패 항목 0개, 고친 항목 0개. `scene.html`은 바꾸지 않았다.

- 사실 점검, 생성 순서, 비트 6개, 화면 결함 항목을 모두 확인했고 전부 통과다. 근거는 `review.md`에 있다.
- 한 가지 확인하지 못한 것: `shots/scene-t1s.jpg` 하단의 흐린 글 한 줄은 판독할 수 없었다. 정답 뒤 화면은 캡처가 없어 코드로 확인했다. 재캡처로 한 번 봐 주면 좋겠다.
- 표시값 `15.0 Mbit/s`는 스토리보드의 14.95를 `toFixed(1)`로 반올림한 것이다. 기대값 검사는 통과하므로 고치지 않았다.
- audit은 1회 실행했고 고침 0건이다. 남은 권고는 "78% 축소" 2건뿐이라 그대로 두었다.
- `shots/index.txt`의 `#ltt-checks 없음`
- 결과: success $0.0230 14턴 108s
