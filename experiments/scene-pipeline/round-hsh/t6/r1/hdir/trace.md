# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/samples/c-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/samples/d-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/refs/api/mock.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/direction.md` (+2160자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/scene.html` (+7494자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 lint used-before-defined: 'mark-and-sweep'가 풀이(첫 {{mark-and-sweep}})보다 먼저 쓰였다
  권고 lint unused-term: glossary의 'mark-and-sweep'가 어디에도 표시되지 않았다
## 1280x800
  고침 lint used-b
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r1/hdir/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: 방향: 두 그림을 나란히 두고 루트 끊김 뒤 RC는 A·B가 남고 M&S는 sweep으로 사라지는 7단계를 생성 순서대로 재생한다. 조작은 RC 쪽 이전/다음이다.

가져온 것: c의 `reach` 기반 노드 제거와 간선 필터, 카운트를 간선 수로 계산하는 방식, 이전/다음·reduced-motion 처리. d의 쪽별 자막, 점선 "끊김" 간선, 단계별 로그 누적.

- audit은 1회 실행해 "고침" 2건(mark-and-sweep 풀이 위치)을 Edit으로 고쳤고, 재실행에서 고침 0건이다.
- 스토리보드 22행의 "B=2"는 점검표(29행)와 비트 2(43행)와 어긋난다. 점검표를 따라 B=1, A=2(B.prev 뒤), 루트 해제 뒤 A=1로 구현했다.
- 초안 네 개는 audit이 모두 "고침 0
- 결과: success $0.0445 18턴 207s
