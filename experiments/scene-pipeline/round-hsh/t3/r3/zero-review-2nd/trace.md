# stream.jsonl

- 말: 먼저 검수에 필요한 파일들을 한 번에 읽고, `shots/` 안의 스크린샷 목록을 확인하겠습니다.
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/refs/API.md`
- Bash `ls -la shots/`
- 말: 스크린샷은 `scene-t1s.jpg`, `scene-t4s.jpg`, `scene-t8s.jpg` 세 장입니다. 세 파일의 크기가 같아서 같은 그림일 수도 있으니 모두 읽어 확인하겠습니다.
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/shots/scene-t8s.jpg`
- 말: 세 장 모두 첫 장면(summary, 01/03)을 찍고 있습니다. 파일 크기가 같아서 바이트 단위로 같은지 확인하고, 작업 디렉터리에 `review.md`가 이미 있는지도 봅니다.
- Bash `ls -la && md5 shots/scene-t1s.jpg shots/scene-t4s.jpg shots/scene-t8s.jpg`
  - 도구 오류: This Bash command contains multiple operations. The following part requires approval: md5 shots/scene-t1s.jpg shots/scene-t4s.jpg shots/scene-t8s.jpg
- Bash `ls -la`
- 말: `review.md`는 아직 없으니 새로 씁니다. 스크린샷이 전부 첫 장면이라 overview 비트는 코드로 판정하고, 그 한계를 근거 칸에 적습니다.
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/review.md` (+1959자)
- 말: 검수 결과 실패 항목은 1건입니다. N2 간선에 거절 표시가 빠져 있어 그 한 줄만 고칩니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: audit은 고침 0건이고 남은 것은 "권고" 1종뿐이라 그대로 둡니다. 마지막으로 `review.md` 끝에 `## 고친 것`을 붙입니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-2nd/review.md`
- 말: 실패 1건, 고친 것 1건입니다. 고친 곳은 `scene.html:50`의 N2 간선 한 줄입니다. 후보 N4의 표 요청에 N2도 "거절: 로그 덜 최신"을 표시해, 두 노드 모두 덜 최신인 N4를 거절하도록 맞췄습니다. audit은 1회차에 고침 0건으로 끝났고, 남은 것은 "권고" 1종뿐이라 그대로 뒀습니다.

확인이 안 된 부분이 있습니다.
- **스크린샷 3장이 모두 같은 첫 장면(summary 01/03)입니다.** 크기도 같습니다. 그래서 overview 단계의 겹침·잘림·읽을 수 없는 글은 코드로만 판정했습니다. 캡처가 단계마다 넘어가지 않는 문제로 보이니 다시 찍어야 합니다.
- `shots/index.txt`의 `checks` 행("#ltt-checks 없음 또는 JSON 오류")은 검수 항
- 결과: success $0.0275 17턴 123s
