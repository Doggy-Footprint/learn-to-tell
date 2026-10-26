# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/scene-t8s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/scene-step1.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/scene-step2.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/scene-step3.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/scene-step4.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/scene-step5.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/shots/scene-step6.jpg`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/review.md` (+1764자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/hreview/review.md`
- 말: 실패 1개, 고친 1개입니다. 검수 기록은 `review.md`에 있습니다.

- **고친 것:** step3의 "복사해 올림" 칩 라벨이 루트→L3 간선과 겹쳐서, 라벨을 칩 왼쪽으로 옮겼습니다(`scene.html`의 `frame()` 칩 라벨과 STEPS[2].chip).
- **audit:** 다시 돌린 결과 고침 0건(1440x900, 1280x800)입니다. 레이아웃을 스크린샷으로 다시 찍지는 않아서, 겹침이 풀렸다는 확인은 좌표 계산으로 한 것입니다.
- **권고(그대로 둠):** 도해 글자가 작습니다(셀 숫자 약 9px). 그리고 "루트 분할은 거의 안 일어남"은 화면에 없습니다.
- **방향 문서 오류(고치지 않음):** direction.md 비트 2의 "A·B 모두 50을 가진 채 남는다
- 결과: success $0.0269 21턴 111s
