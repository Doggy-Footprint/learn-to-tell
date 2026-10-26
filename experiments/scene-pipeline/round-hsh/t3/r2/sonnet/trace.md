# stream.jsonl

- Bash `ls . samples refs refs/api`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/samples/c-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/samples/d-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/refs/api/base.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/direction.md` (+1230자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet/scene.html` (+12540자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
  고침 lint overview-order: overview는 summary
- 말: 방향은 a안(오각형 서버 5대와 가운데 과반수 계량기)이다.

가져온 것은 a의 골격 전체다. 오각형 서버 상자, 가운데 표/저장 패널, 메시지 라벨 이동, 로그 칸, 10단계 자막, 다시 보기 버튼이다. d에서는 미커밋 점선과 커밋 실선 구분을 가져왔다. a에서 고친 것은 다음 세 가지다.
- 투표 요청이 도착할 때 S2, S4, S5의 term이 함께 4로 오른다.
- 장면이 화면에서 사라지면 재생이 멈춘다.
- 자막에서 미커밋 점선을 명시했다.

audit는 1회 실행했다. 남은 "고침" 2건은 모두 `overview-order`다. 장면이 하나뿐이라 무시해도 된다는 브리프에 따라 그대로 뒀다. 남은 "권고"는 `shrunk`와 `no-signature` 두 가지다.

산출물은 `scene.html`과
- 결과: success $0.3358 17턴 69s
