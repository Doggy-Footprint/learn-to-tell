# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/shots/scene-t8s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/shots/scene-knob-r-min.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/shots/scene-knob-r-max.jpg`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/review.md` (+2145자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/shots/scene-t1s.jpg`
- Bash `ls -l --time-style=full-iso shots/ review.md scene.html 2>/dev/null || ls -lT shots/ review.md scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/zero-review-2nd/review.md`
- 말: 실패 3건, 고친 3건(CSS 2곳). 다만 시각 재확인은 못 했다.

- **실패 1: 준비금 합계 stat 잘림.** 세 번째 stat("누적 준비금 → 한계 100")이 카드 하단에서 내비게이션 바 아래로 가려져 값이 안 보인다. 비트 4와 준비금 합계 항목이 이 한 원인을 공유한다. `scene.html:26` `.cc-stats`를 nowrap, gap 16px로 바꿔 한 줄에 두었다.
- **실패 2: 비트 4 (준비금 100 불변).** 위와 같은 원인이라 같은 Edit로 함께 고쳤다.
- **실패 3: 겹침·잘림.** 카드가 세로로 넘친다. `scene.html:14` `.cc-chain`을 nowrap, `:15` `.cc-box` min-width를 0으로 바꿔 chain을 2행에서 1행으
- 결과: success $0.0298 19턴 138s
