# stream.jsonl

- 말: 먼저 지정된 파일들을 한 번에 읽고, `shots/` 안의 파일 목록도 확인하겠습니다.
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/refs/API.md`
- Bash `ls -la /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/shots/`
- 말: 스크린샷 3장을 함께 읽습니다. 크기가 모두 96505바이트로 같아서 동일 이미지일 가능성이 있습니다.
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/shots/scene-t8s.jpg`
- 말: 세 스크린샷은 모두 답을 공개하기 전 상태입니다. 검수 기록을 먼저 씁니다.
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/review.md` (+2318자)
- 말: 검수 기록을 썼습니다. 실패 항목 중 방향을 바꾸지 않고 고칠 수 있는 것은 장면 머리글의 용어 풀이 하나입니다. 방향 문서가 `sub`에 `{{cwnd}}`와 `{{MSS}}`를 두라고 정했는데 빠져 있습니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 '
- 말: audit이 `sub`의 `{{cwnd}}`·`{{MSS}}`를 새 지적으로 잡았습니다. predict 장면은 질문 앞에서 용어를 풀면 안 되고, 풀이는 앞 장면에서 해야 한다는 규칙입니다. 이 덱에는 앞 장면이 없으므로 제 수정은 규칙에 어긋납니다. 이전 audit에서 고침 0건이었던 상태로 되돌립니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: audit은 고침 0건으로 통과했습니다. 검수 표의 독학 항목이 '고침'으로 적혀 있어 실제 결과와 맞지 않으므로 고칩니다. 그다음 `## 고친 것`을 붙입니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/review.md`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/hreview/review.md`
- 말: 실패 항목 7개 중 고친 항목은 0개입니다. audit은 고침 0건으로 통과했습니다.

고치지 못한 이유는 다음과 같습니다.
- 처리량 식 누락, 비트 5·6(진단 비교·처리량 진단), 구간 구분 라벨은 방향 문서의 "그림 하나가 주인공"과 빈 자리 규정에 어긋나서 방향을 정해야 고칠 수 있습니다.
- 하단 "핵심" 카드 잘림은 1280×800에서 78% 축소된 결과라, 그림 높이 250을 줄이지 않으면 해결되지 않습니다. 높이는 방향에서 정한 값입니다.
- 첫 등장 용어 cwnd·MSS 풀이는 `sub`에 넣었지만 audit이 predict 장면의 새 용어로 지적해 되돌렸습니다. 이 덱은 장면이 하나뿐이라 풀이를 앞 장면에 둘 수 없습니다.
- 중복 ACK·타임아웃 풀이도 같은 이유로 미수정입니다.

`s
- 결과: success $0.0273 18턴 132s
