# stream.jsonl

- Bash `ls . samples refs refs/api`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/samples/c-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/samples/d-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/refs/api/controls.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/direction.md` (+1571자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r2/sonnet/scene.html` (+9998자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: mark-and-sweep과 참조 카운팅을 한 화면에 나란히 놓은 장면은 audit 1회 만에 "고침 0건"으로 끝났습니다. 스크린샷은 찍지 않아서 실제 모양과 움직임은 눈으로 보지 못했습니다.

방향: 한 stepper가 두 힙 그림(참조 카운팅 / mark-and-sweep)을 같은 순간으로 동시에 움직입니다. 단계는 객체 생성, 변수 연결, A.peer, B.peer, x·y 해제, GC 사이클, 회수, 전역 캐시 C 누수 순서입니다. 그림은 `LTT.diagram` 대신 직접 그린 SVG입니다.

초안에서 가져온 것:
- d: 생성 순서와 `LTT.expect` 손 계산 검증, 루트 프레임
- c: 연결 목록에서 카운트를 계산하는 방식과 단계별 retainer 문구
- a: 양쪽에 같은 그래프를 놓는
- 결과: success $0.3283 17턴 114s
