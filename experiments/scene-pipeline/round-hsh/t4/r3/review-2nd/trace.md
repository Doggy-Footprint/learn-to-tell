# stream.jsonl

- 말: 먼저 지정된 텍스트 파일들과 `shots/` 목록을 함께 읽겠습니다.
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/refs/API.md`
- Bash `ls -la shots/`
- 말: 스크린샷 세 장을 함께 읽겠습니다.
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/shots/scene-t8s.jpg`
- 말: 스크린샷 세 장과 코드를 대조했습니다. 검수 결과를 `review.md`에 먼저 기록하겠습니다.
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/review.md` (+2346자)
- 말: `review.md`를 기록했습니다. 규칙에 따라 audit을 먼저 실행해 기준선을 봅니다.
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: audit 기준선은 고침 0건입니다. 실패로 판정한 두 항목을 Edit 한 묶음으로 고칩니다. 비트2에는 3' 끝 점 표시를, 컨트롤 밀림에는 캡션 영역 최소 높이를 2줄 분량으로 늘립니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/scene.html`
- 말: 두 Edit을 반영했습니다. 다시 audit합니다.
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: audit 재실행도 고침 0건입니다. 마지막으로 `review.md` 끝에 `## 고친 것`을 붙입니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/review-2nd/review.md`
- 말: 실패 2건, 고친 항목 2건입니다.

- 실패 2건: 비트2(3' 끝에 붙는 자리 표시 없음), 캡션이 2줄일 때 컨트롤이 밀리는 레이아웃 흔들림
- 고친 항목 2건: `scene.html`에 원형 표시를 추가했고, `.dr-cap`의 `min-height`를 3.2em으로 올렸습니다. audit은 기준선과 수정 후 모두 고침 0건입니다.

줄 바꿈 때 컨트롤이 밀리는 문제는 스크린샷 t1s와 t4s를 비교해 확인했습니다. 원형 표시와 줄 바꿈 고정은 스크린샷으로 다시 확인하지 않았습니다. 줄 바꿈은 CSS 변경이라 코드상으로만 맞습니다. 줌 장면과 최종 프레임은 스크린샷이 없어 코드로만 판정했습니다. 작은 라벨 글자(화면 약 8~9px)는 권고로만 남기고 고치지 않았습니다.
- 결과: success $0.0390 17턴 204s
