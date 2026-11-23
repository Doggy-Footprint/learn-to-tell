# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/samples/c-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/samples/d-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/refs/api/controls.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/direction.md` (+2003자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/scene.html` (+5315자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 small-visual: 가장 큰 그림이 화면의 11%뿐이다. 그림을 키우거나 layout: "full"
  고침 lint used-before-defined: '지급준비율'가 풀이(첫 {{지급준비율}})보다 먼저 쓰였다
  권고 lint unused-term: glossary의 '지급준비율'가 어
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r2/hdir/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: 방향: 은행 10곳이 다섯 칸씩 두 줄로 꺾여 늘어선 연쇄 도식을 화면 가득 주인공으로 두고, 라운드마다 예금 → 대출 패킷 → 다음 은행 예금 순서로 19단계 재생한다. 아래 상한 대비 막대와 숫자 세 개가 누적과 상한을 보여 주고, 지급준비율 손잡이를 바꾸면 연쇄가 처음부터 다시 전개된다.
가져온 것: c의 현재 은행 accent와 상한 대비 막대, d의 대출 패킷(`send`)과 번호 자막, b의 "값이 바뀌면 연쇄를 처음부터 다시 전개" 규칙과 stepper 구조, a의 `LTT.expect` 검산 두 개.

audit은 2회 돌렸다. 1회차 "고침" 2건(`지급준비율` 풀이 전 사용, 미표시 용어)은 `{{지급준비율}}`을 sub와 takeaway에 달아 고쳤고, 2회차 고침은 0건이라 끝냈다. 남
- 결과: success $0.0438 21턴 220s
