# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/samples/c.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/samples/d.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/samples/c-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/samples/d-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/direction.md` (+2419자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/hdir/scene.html` (+7576자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  권고 장면1 small-visual: 가장 큰 그림이 화면의 15%뿐이다. 그림을 키우거나 layout: "full"
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, l
- 말: 방향: c 초안을 뼈대로, 3×3 격자 그림(주인공)에 노드별 term·역할·로그 칸 패널과 득표·저장 확인 막대(세 번째 칸 뒤가 과반선)를 얹고, 스토리보드 생성 순서대로 11단계 재생한다.

가져온 것: c의 상태 누적 계산(`OPS`)과 패널·막대 구조를 그대로 썼다. 스토리보드의 "복제 전에 리더가 죽으면 덮어써질 수 있다"는 깨는 순간을 c의 7단계 캡션에 넣고, `term`을 풀이와 함께 추가했다.

산출물은 `scene.html`과 `direction.md`(hdir 안)다.

audit 결과:
- 고침 2건은 모두 `overview-order`다. 장면이 하나뿐이라 summary와 keywords를 추가하지 않는 한 고칠 수 없어서 적용하지 않았다. 브리프의 "덱 순서 lint는 신경 쓰지 
- 결과: success $0.0232 15턴 90s
