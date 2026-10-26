# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/refs/API.md`
- Bash `ls -la /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/shots/`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/shots/scene-t8s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/shots/scene-knob-rr-min.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/shots/scene-knob-rr-max.jpg`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/review.md` (+2438자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/zero-review/review.md`
- 말: 실패 항목 1개, 고친 항목 1개입니다.

고친 것은 knob-rr-min의 "상한 500 (=100÷20%)" 라벨이 "예금 총액 (쌓인 예금)" 제목과 겹치던 문제입니다(`scene.html:73`). 라벨을 상한선 오른쪽에 붙였고, 프레임을 넘는 r=5%는 기존처럼 왼쪽 정렬을 유지했습니다. 스크린샷은 다시 찍지 않아서 코드로만 확인했고, audit은 고침 0건으로 끝났습니다.

검수 결과와 근거는 `review.md`에 있습니다. 고치지 않고 남긴 메모 두 가지도 거기 적었습니다.
- 캡션의 조사 "10를", "90를" 등이 숫자 발음에 맞지 않습니다. 방향 밖의 문장이라 두었습니다.
- 10라운드에서 막대는 "모인 준비금 65.1 / 100"인데 마지막 캡션은 "준비금은 합쳐 100 그대로다"라고 
- 결과: success $0.0246 17턴 117s
