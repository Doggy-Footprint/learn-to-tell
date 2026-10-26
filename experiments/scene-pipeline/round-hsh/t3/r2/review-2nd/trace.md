# stream.jsonl

- 말: 검수 대상 파일을 먼저 한꺼번에 읽겠습니다.
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/shots/scene-t8s.jpg`
- 말: 스크린샷 세 장은 모두 장면 01(summary)입니다. `shots/` 아래에 다른 파일이 더 있는지 확인하겠습니다.
- Bash `ls -la shots/ && ls -la review.md 2>/dev/null; echo "---"; grep -n "gPk\|gPn\|gNd\|gMesh" scene.html`
- 말: `review.md`는 아직 없습니다. 검수 결과를 먼저 기록하겠습니다.
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/review.md` (+2143자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: audit에서 "고침" 지적이 0건이므로 재검수는 필요 없습니다. `review.md` 끝에 `## 고친 것`을 붙입니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/review-2nd/review.md`
- 말: 실패 1건, 고친 항목 1건입니다.

`review.md`에 기록했고, 실패 항목은 패킷 라벨이 중앙 패널 뒤로 사라지는 겹침 하나였습니다. 패킷 그룹과 패널의 생성 순서를 바꿔 해결했고, audit 재실행 결과 고침 0건입니다.

참고할 점은 두 가지입니다.
- `shots/`의 스크린샷 세 장은 모두 장면 01(summary)이라 장면 02 그림은 화면으로 확인하지 못했습니다. 그림 항목은 코드 좌표와 문구로만 판정했습니다.
- 캡션 ⑤의 "3/5이 되는 순간"은 조사 오류로 "3/5가"가 맞습니다. 검수 항목 밖이라 고치지 않았습니다.
- 결과: success $0.0248 15턴 114s
