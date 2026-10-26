# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/shots/scene-t8s.jpg`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/review.md` (+2048자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/scene.html`
- 말: Edits are in. Running the audit on the changed scene.
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-review-2nd/review.md`
- 말: 실패 5건 중 3건을 고쳤다. 고친 항목 3건, 실패 항목 5건(미수정 2건)이다.

- **고침:** 연결 표식이 프라이머 제거 전에 나타나던 순서 (`scene.html:138`, `:145`), 캡션 ②와 지연 절편이 맞지 않던 문제 (`:40`), 중합효소 표식이 선도 화살촉을 덮던 겹침 (`:122`).
- **미수정 1:** 지연 가닥 제목 끝이 아래 주형 곡선과 겹친다 (t1s). 고치려면 제목 배치를 바꿔야 해서 두었다.
- **미수정 2:** `index.txt`의 checks 항목 기준으로 `#ltt-checks`가 없다. 요구 형식을 참조 문서에서 확인할 수 없어 임의로 넣지 않았다.
- **판정 보류:** 비트 5(연결 완성)는 완성 상태 스크린샷이 없어 코드로만 확인했다.

audit
- 결과: success $0.0363 17턴 201s
