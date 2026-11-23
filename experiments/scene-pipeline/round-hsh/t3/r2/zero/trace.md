# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero/scene.html` (+9371자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: parent.appendChild is not a function
## 1280x800
  고침 load: page.waitForSelector: Timeout 15000ms exc
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 86%로 줄었다. 글을 줄이거나 장면을 나눌 것
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
  고침 lint overview-order: overview는 summary
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/zero/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 86%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint overview-order: overview는 summary 뒤, keywords 바로 앞에 둔다
## 1280x800
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면
- 말: audit을 두 번 돌렸고, 남은 "고침" 2건은 `overview-order` 하나(해상도별로 한 번씩)입니다. 이 파일은 장면이 하나뿐이라 덱 순서 lint는 무시하기로 한 항목이어서 더 고치지 않고 끝냈습니다. "권고"로는 장면이 화면에 맞추느라 78~86%로 줄었다는 것과, 1280px에서 그림이 화면의 22%뿐이라는 것이 남았습니다. 스크린샷은 찍지 않아 실제 화면은 확인하지 못했습니다.

`scene.html`에는 서버 5대(S1~S5)의 화이트보드 도식을 그렸습니다. 각 서버의 term, 역할, 로그 칸(index·term)이 보이고, 7단계 재생기가 선출에서 커밋까지 스토리보드 순서대로 보여 줍니다.

1. S1의 타이머가 만료됩니다.
2. S1이 후보가 되어 term 3으로 올라가고 자기 표
- 결과: success $0.2525 10턴 147s
