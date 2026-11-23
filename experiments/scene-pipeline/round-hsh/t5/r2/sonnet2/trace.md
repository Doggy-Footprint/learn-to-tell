# stream.jsonl

- Bash `ls -R . | head -50`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/refs/api/controls.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/refs/api/charts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/direction.md` (+1436자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/sonnet2/scene.html` (+9483자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: audit 1회 만에 고침 0건으로 끝났고, 남은 건 "shrunk" 권고 하나라 그대로 둔다.

방향: 커스텀 SVG 한 장(은행 A~H의 예금 막대 + 예금 합계 탑 + 고정 상한선 + 불변 준비금 막대)이 화면 전체를 차지한다. 라운드마다 "대출 화살표 → 다음 예금 → 합계 탑 증가 → 준비금/대출 분할" 순서로 자동 재생되고, r 손잡이(20/10/5%)를 바꾸면 처음부터 다시 전개된다.
가져온 것: a에서 r steps와 고정 점선 상한, r 변경 시 처음부터 재전개. b에서 `LTT.stepper` 자동 재생·되감기, 단계 자막, `LTT.expect` 검산.

`direction.md`와 `scene.html`을 현재 디렉터리에 썼다. 스크린샷은 찍지 않았다.
- 결과: success $0.2958 14턴 99s
