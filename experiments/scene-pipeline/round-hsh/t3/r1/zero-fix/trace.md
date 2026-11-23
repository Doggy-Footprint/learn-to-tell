# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero-fix/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero-fix/refs/API.md`
- Bash `ls refs refs/api`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero-fix/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero-fix/refs/api/deck-contracts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero-fix/scene.html` (+7968자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 Raft 5노드 화이트보드 그림 하나를 그렸다. 9단계로 넘기며 본다. S1 리더 장애, S2의 term +1과 RequestVote, 득표 3/5가 과반선을 넘는 순간, 리더 로그에 미커밋 x가 생기는 것, 저장 ack 3개째에 커밋되는 것, 팔로워가 뒤늦게 커밋하는 것(S5 지연)이 차례로 나온다.

audit은 1번 돌렸고 "고침" 0건이다. "권고"는 1280px에서 장면이 87%로 줄었다는 것 하나인데, 그대로 뒀다.
- 결과: success $0.2406 8턴 86s
