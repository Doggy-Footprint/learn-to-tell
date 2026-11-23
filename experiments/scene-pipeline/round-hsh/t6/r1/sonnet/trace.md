# stream.jsonl

- Bash `ls . samples refs refs/api`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet/samples/d.html`
- Bash `cd samples; cat a-audit.txt b-audit.txt c-audit.txt d-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet/refs/api/mock.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet/direction.md` (+1313자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet/scene.html` (+6490자)
- Bash `cd /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/sonnet && node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: 방향: d.html의 상태별 그래프 함수를 뼈대로 삼고, RC와 M&S 두 그래프를 같은 타이머로 한 단계씩 함께 넘기는 contrast 장면으로 만들었다.
가져온 것: d.html의 `graph(i, side)`(대상이 생성 순서대로 나타남, 끊긴 루트 간선 점선, 판정 색)와 프로파일러 터미널 로그, c.html의 단일 타이머, 이전/다음 버튼, `isConnected` 정리. d.html에서 루트 해제 직후 A를 2로 둔 오류는 A=1로 고쳤다.

audit은 1회 돌렸고 고침 0건이다. 스크린샷은 찍지 않았다.
- 결과: success $0.2592 14턴 70s
