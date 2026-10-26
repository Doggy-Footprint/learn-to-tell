# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/samples/c-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/samples/d-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/direction.md` (+2666자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/hdir/scene.html` (+6958자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 85%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint overview-order: overview는 summary 뒤, keywords 바로 앞에 둔다
## 1280x800
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면
- 말: 첫 줄 방향: 5노드 오각형 그림을 주인공으로 두고, 비트마다 노드 카드(역할, term, index:term 칸, 커밋 경계)가 바뀌는 overview로 짰다.
둘째 줄 가져온 것: b의 노드 카드와 13비트 순서, a의 픽셀 오각형 배치, c의 옛 리더 단절 표시, d의 짧은 자막과 "ack는 커밋 뒤에만" 원칙.

결과물은 `scene.html`이고, 방향은 `direction.md`(60줄 이내)에 적었다.

audit은 1회 돌렸고 고침 2건이 남았다. 둘 다 `overview-order`(overview는 summary 뒤에 있어야 함)이다. 브리프가 장면이 하나뿐이라 덱 순서 lint는 무시하라고 했고, 맞추려면 summary와 keywords 장면을 더 만들어야 해서 장면 하나 규칙을 어기게 
- 결과: success $0.0300 15턴 139s
