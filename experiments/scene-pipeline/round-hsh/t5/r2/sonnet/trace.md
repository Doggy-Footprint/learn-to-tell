# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/samples/c-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/samples/d-audit.txt`
- Bash `ls refs/api; wc -l refs/api/*`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/refs/api/controls.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/refs/api/charts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/direction.md` (+1726자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet/scene.html` (+9893자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 만들었고 audit을 1회 돌렸다. 고침은 0건이고, 남은 권고는 "화면에 맞추느라 78~83%로 줄었다"는 shrunk 하나다. 그림이 작다는 small-visual 권고는 이번에는 나오지 않았다. 스크린샷은 찍지 않았고 화면에서 직접 돌려 보지도 않아서, 움직임이 실제로 의도대로 도는지는 확인하지 못했다.

방향: 은행 A…J를 가로로 놓고 세로를 예금 누적액으로 삼은 폭포 막대를 직접 SVG로 그렸다. 라운드마다 예금 막대가 서고, 준비금과 대출로 나뉜 뒤, 대출 조각이 오른쪽 은행으로 건너가 다음 예금이 된다. 지급준비율 손잡이는 20·10·5%이고, 바꾸면 처음부터 다시 전개한다.

초안에서 가져온 것:
- c의 단계별 캡션(예금 → 분할 → 대출 이동 순서)과, 지급준비율
- 결과: success $0.3607 17턴 132s
