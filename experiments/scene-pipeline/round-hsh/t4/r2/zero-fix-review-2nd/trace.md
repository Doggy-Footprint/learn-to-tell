# stream.jsonl

- 말: 먼저 지정된 텍스트 파일들과 `shots/` 목록을 함께 읽습니다.
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/refs/API.md`
- Bash `ls -1 shots/`
- 말: 스크린샷 세 장을 함께 읽습니다.
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/shots/scene-t8s.jpg`
- 말: 스크린샷은 t1s·t4s·t8s 세 장뿐입니다. 이후 단계(비트 4·5, 연결효소)는 캡처가 없어 코드 기준으로 판정합니다. 고치기 전에 `review.md`를 먼저 씁니다.
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/review.md` (+1512자)
- 말: 실패 항목은 `3'` 라벨 하나입니다. 이 라벨만 아래로 옮깁니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: audit에서 고침 0건이므로 끝냅니다. `review.md` 끝에 고친 목록을 붙입니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-fix-review-2nd/review.md`
- 말: 실패 1건, 고친 항목 1건입니다.

`scene.html:143`에서 선도 가닥 `3'` 라벨을 4단위 아래로 옮겼습니다(t8s에서 파란 중합효소 점에 맞닿던 문제). 다시 돌린 audit은 고침 0건이고, 권고 lint 1건은 그대로 두었습니다. 검수 결과는 `review.md`에 있습니다.

참고로 두 가지는 손대지 않았습니다.
- `shots/index.txt`의 `checks` 행("#ltt-checks 없음 또는 JSON 오류")은 `scene.html`에 `#ltt-checks`가 없다는 뜻으로 보이지만, API.md에 해당 요소 명세가 없어 추가하지 않았습니다.
- "분기점 전진 →" 표시와 팔이 왼쪽으로 펼쳐지는 방향이 서로 맞지 않아 보입니다. 방향 기록(`direction.md`)이 없어
- 결과: success $0.0370 15턴 202s
