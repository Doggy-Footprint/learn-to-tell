# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/samples/c-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/samples/d-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/direction.md` (+1978자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/hdir/scene.html` (+5143자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: 방향: 같은 A↔B 그래프 한 장을 두고 상태표로 페이드해서, 생성→연결→x 해제→y 해제→(RC는 GC 시점 / MS는 mark→sweep) 순서로 보여 준다.
가져온 것: c의 상태표·페이드 방식, d의 mark/sweep 단계 분리와 `LTT.expect` 검증, a의 x·y 해제를 따로 두는 순서, b의 `note` 강조점.

audit은 한 번 돌렸고 고침 0건이었다. `direction.md`와 `scene.html`은 hdir에 있다.

의도적으로 뺀 것이 하나 있다. storyboard 비트 5(tracing 쪽 전역 캐시 누수)는 노드를 더해야 해서 화면이 다시 줄어들 것 같아 넣지 않았다. 대신 recall 질문으로 그 경우를 가리키게 했다. 넣는 게 낫다고 판단하면 말해 달라.
- 결과: success $0.0287 15턴 124s
