# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/refs/API.md`
- Bash `ls -la /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/shots/`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/shots/scene-t8s.jpg`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/review.md` (+1967자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: Audit은 "고침 0건"이다. 검수에서 실패로 잡은 3건은 audit이 못 보는 항목이라 Edit로 직접 고친다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix-review-2nd/review.md`
- 말: 실패 4개, 고친 4개. audit은 "고침 0건"이고 권고 2건(장면1 shrunk 78%, no-signature)은 그대로 뒀다.

고친 내용은 모두 `scene.html`에 있다.
- ×1/2 표지: 하강 뒤에 나타나도록 지연을 줬다 (`scene.html:66`).
- +1 MSS / RTT 표지: 상승 뒤에 나타나도록 지연을 줬다 (`scene.html:65`).
- ×1/2 표지가 평균 24 점선 위에 얹혀 있어서 6px 올렸다.
- 평균 라벨이 톱니 선과 겹쳐서 배경색 halo를 줬다 (`scene.html:64`).

정답 공개 뒤 화면은 스크린샷이 없어서 좌표 계산으로만 확인했다. 수정 후 화면은 다시 캡처하지 않았다.

검수 기록은 `review.md`에 있다.

실패 4 / 고친 4
- 결과: success $0.0267 17턴 127s
