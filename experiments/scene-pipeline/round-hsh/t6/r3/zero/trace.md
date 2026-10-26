# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/zero/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/zero/refs/API.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/zero/scene.html` (+8316자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: Failed to execute 'appendChild' on 'Node': The new child element contains the parent.
## 1280x800
  고
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t6/r3/zero/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 만들었고 audit은 고침 0건으로 통과했습니다. 처음 audit에서 나온 로드 오류(appendChild)는 Edit 한 번으로 고쳤습니다.

그린 것은 좌 참조 카운팅, 우 mark-and-sweep을 같은 A↔B 순환 코드로 대비한 `figure` 장면입니다. 5단계로 재생됩니다.
1. A, B 생성(rc 1)
2. 서로 연결해 rc 2, 2
3. 루트 해제로 카운팅은 1, 1에서 멈춤
4. GC에서 mark 쪽 A, B가 도달 불가로 회수됨
5. 100회 반복 타임라인(카운팅은 104 MB까지 상승, mark는 4~20 MB 톱니)과 스냅샷 retainers 비교

스크린샷은 찍지 않았고, 단계 재생이 실제로 어떻게 보이는지는 확인하지 못했습니다.
- 결과: success $0.1832 7턴 94s
