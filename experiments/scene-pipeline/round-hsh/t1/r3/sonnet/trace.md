# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/refs/API.md`
- Bash `ls samples refs refs/api; wc -c samples/*`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/refs/api/deck-contracts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/direction.md` (+1394자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r3/sonnet/scene.html` (+9525자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: 방향: c의 손으로 짠 SVG 트리를 뼈대로 삼아, 7단계를 생기는 순서대로 보이는 단계 재생 도해를 만들었다. 단계는 가득 찬 잎, 52 삽입으로 5키 초과, 새 잎 N 할당, 50 복사 올림, 루트 분할과 50 이동, 새 루트 생성, 규모 환산 순서다.

초안에서 가져온 것:
- **c**: 키 칸, 초과 칸 표시, 새로 생긴 것만 나타나는 fade-in, 잎 연결 포인터, 50 이동 칩.
- **b**: "올라간다"를 보이는 아이디어. 이를 N의 50에서 루트로 올라가는 복사 점선 경로로 새로 그렸다.
- **a**: 쓰지 않았다. 새 루트가 분할과 같은 단계에 나타나는 순서 오류가 있었다.
- **d**: 쓰지 않았다. 전체 교차 페이드라 무엇이 새로 생겼는지 안 보였다.
- 8KB 페이지 규모 단계
- 결과: success $0.3293 15턴 74s
