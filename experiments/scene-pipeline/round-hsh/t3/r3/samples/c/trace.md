# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/c/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/c/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/c/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/c/scene.html` (+3614자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/c/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 81%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint used-before-defined: '과반수'가 풀이(첫 {{과반수}})보다 먼저 쓰였다
  고침 lint used-before-defined: '커밋'가 풀이(첫 {{커밋}})보다 먼저 쓰였다
  권
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/samples/c/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 81%로 줄었다. 글을 줄이거나 장면을 나눌 것
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
  고침 lint overview-order: overview는 summary
- 말: Raft 리더 선출과 로그 복제를 5노드 다이어그램으로 그린 장면 하나를 `scene.html`에 만들었습니다. 그림은 S2가 후보에서 리더가 되고, 쓰기가 미커밋 상태로 들어갔다가 과반수 3대 저장으로 커밋되는 7단계 재생입니다.

- **audit 결과:** 3회 중 2회를 돌렸고, 남은 "고침" 2건은 모두 `overview-order`(overview는 summary 뒤에 와야 함)입니다. 브리프가 장면이 하나뿐인 덱의 순서 lint는 신경 쓰지 않는다고 했으므로 summary와 keywords 장면은 추가하지 않았습니다.
- **나머지 "권고":** 장면이 화면에 맞추느라 약 80%로 줄었다는 것과 그림 장면 신호(`no-signature`)가 없다는 것이며, 그대로 두었습니다.
- **로그 표시 
- 결과: success $0.0176 10턴 120s
