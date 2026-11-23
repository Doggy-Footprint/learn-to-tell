# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/b/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/b/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/b/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/b/scene.html` (+3712자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/b/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 84%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint used-before-defined: '과반'가 풀이(첫 {{과반}})보다 먼저 쓰였다
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"fu
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/b/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/b/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/samples/b/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 84%로 줄었다. 글을 줄이거나 장면을 나눌 것
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
  고침 lint overview-order: overview는 summary
- 말: 5노드 Raft 클러스터에서 S1 리더 장애 → S3 timeout → RequestVote 과반 당선 → heartbeat → 항목 복제 → 과반 ack 커밋까지 7단계로 움직이는 overview 장면 1개를 `scene.html`에 만들었습니다.

audit은 2회 돌렸습니다. 첫 회에는 d3 로드 누락으로 페이지가 깨져서 추가했고, 두 번째 회에는 "과반" 첫 등장 표시를 고쳤습니다. 남은 고침 항목은 overview 순서 lint 하나인데, 장면이 하나뿐이라 summary를 추가하지 않았습니다. 브리프의 "덱 순서 lint는 신경 쓰지 않는다"를 따른 결정입니다.

노드 라벨은 S1–S5만 두었습니다. 스토리보드의 노드별 term·역할·로그 칸은 단계가 바뀌면 값이 달라지는데 정적 라벨로는 맞출 수 
- 결과: success $0.0204 12턴 136s
