# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/shots/scene-t8s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/shots/scene-knob-r-min.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/shots/scene-knob-r-max.jpg`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/review.md` (+2055자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r3/review/review.md`
- 말: 실패 3건 중 3건을 고쳤다 (실패 3, 고친 3). 다만 잘림 수정은 스크린샷으로 다시 확인하지 않았다.

- **사실 (강조 문장)**: "준비금 합계는 최초 예금 그대로"는 화면 수치(10 → 34.4 → 83.3)와 충돌해서 "준비금 합계는 최초 예금에 다가간다"로 바꿨다.
- **겹침**: "준비금 합계 한도 100" 라벨이 "라운드" 축 제목과 겹쳐 라벨을 점선 위로 옮겼다.
- **잘림**: 1280×800에서 핵심 박스가 하단 내비 아래로 잘렸다. 차트 max-height를 46vh에서 40vh로 줄였다.

audit은 두 번 돌렸고 둘 다 "고침 0건"이었다. 수정 뒤에는 축척이 78%에서 79%로 조금 커졌다. 이 audit은 위 세 결함을 잡지 못했으므로, 검수 결과는 스크린샷 근거를 따
- 결과: success $0.0307 19턴 148s
