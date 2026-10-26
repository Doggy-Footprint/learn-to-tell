# stream.jsonl

- 말: 스토리보드, 방향, 장면 HTML, 스크린샷 목록, 감사 결과, API 문서를 먼저 함께 읽겠습니다.
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/refs/API.md`
- 말: 장면 HTML에서 검수할 것을 정리했습니다. 이제 스크린샷 세 장과 `shots/` 안의 전체 파일 목록을 확인하겠습니다.
- Bash `ls -la shots/`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/shots/scene-t8s.jpg`
- 말: 스크린샷 3장은 모두 첫 장면(01/03 요약)이고 같은 파일입니다. 오버뷰 그림의 단계는 한 장도 없습니다. 이 점을 review.md에 기록하고 코드와 대조하겠습니다.
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/review.md` (+1866자)
- 말: review.md를 썼습니다. 지정된 audit을 실행해 현재 고침 건수를 확인하겠습니다.
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: audit 결과 고침은 0건입니다. review.md 끝에 `## 고친 것` 목록을 붙입니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero-review-3rd/review.md`
- 말: 실패 1건, 고친 항목 0건입니다.

실패 1건은 "커밋 항목은 지워지지 않는다" 사실입니다. 스토리보드 ⑦은 N4·N5가 항목을 받는다고 하고, ⑧은 N4가 덜 최신이라 표를 못 받는다고 합니다. 두 말은 같은 상태에서 함께 성립하지 않아서, 어느 쪽을 택할지 작성자가 정해야 합니다. 그 사이 `scene.html:53`에서 N4·N5 로그가 `▣1`에서 `—`로 사라져 보입니다. 이 부분은 보류했습니다.

스크린샷 3장(`scene-t1s/t4s/t8s.jpg`)은 모두 01/03 요약 장면이고 파일 크기가 같습니다. 그래서 비트 1–8, 겹침·잘림, 움직임 같은 화면 항목은 확인할 수 없었고 코드 기준으로만 판단했습니다. 오버뷰 단계를 다시 캡처해야 판정할 수 있습니다.

audit은 1440x900과
- 결과: success $0.0209 14턴 99s
