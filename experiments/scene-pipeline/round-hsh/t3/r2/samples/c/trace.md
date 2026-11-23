# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/samples/c/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/samples/c/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/samples/c/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/samples/c/scene.html` (+4154자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 small-visual: 가장 큰 그림이 화면의 21%뿐이다. 그림을 키우거나 layout: "full"
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
  고침 lint overview-order: ov
- 말: `scene.html`을 만들었고, 한 장면 "과반수 3/5가 리더 선출과 커밋을 함께 정한다"로 Raft 선출과 복제 흐름을 오각형 서버 5대 위에서 단계별로 보여 준다.

audit 결과는 "고침" 2건, 둘 다 `overview-order` 하나의 두 뷰포트 중복이다. 이건 브리프가 신경 쓰지 말라고 한 덱 순서 lint라서 고치지 않았다. 고치려면 summary와 keywords 장면을 추가해야 하는데, 이 파일은 장면 하나여야 하므로 그 요구와 충돌한다. 나머지 "권고" 2건(작은 그림, signature)은 그대로 두었다. audit은 한 번만 돌렸고 Edit은 하지 않았다.

Raft 흐름은 리더 S1 장애, S4 후보와 선출, 복제와 커밋, commitIndex 전달 순서를 따른다. 서버 상태
- 결과: success $0.0149 6턴 80s
