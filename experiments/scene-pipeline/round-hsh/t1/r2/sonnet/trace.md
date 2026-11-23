# stream.jsonl

- Bash `ls; ls samples refs refs/api`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/samples/c-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/samples/d-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/direction.md` (+1514자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/sonnet/scene.html` (+12115자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: 방향: 한 장짜리 B+tree SVG 도해(a안 기반)를 10단계로 재생합니다. 새 오른쪽 형제가 쪼개지는 노드에서 벌어져 나오고, 구분 키 칩이 "복사"/"이동"으로 올라갑니다. 새 루트는 맨 마지막에 생기며 모든 잎이 한 층 내려갑니다. 뒤에 "부모가 안 찬 경우 한 번에 멈춤"과 "8 KB·4 KB 팬아웃 막대 비교"를 붙였습니다.

가져온 것: a안의 칸 구조 노드 SVG, 같은 `g`가 미끄러지는 이동, 칩, 잎 연결 점선, 상태 데이터(S0~S6). d안에서는 "새 형제 → 구분 키 → 넘침 판단" 순서를 지키도록 단계를 잘게 나눈 구성을 가져왔습니다.

audit은 1회 실행했고 고침 0건입니다. 스크린샷은 찍지 않았습니다. `direction.md`는 `scene.html`보다 먼저 썼습니다.
- 결과: success $0.3851 16턴 118s
