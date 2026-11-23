# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero-fix/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero-fix/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero-fix/refs/api/controls.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero-fix/scene.html` (+8381자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 만들었다. audit은 1회 실행했고 고침 0건이다. 남은 권고는 1280px 화면에서 장면이 84%로 줄어든다는 것 하나이고, 그대로 뒀다.

화면에는 막대 그림 두 개가 나란히 있다.
- **왼쪽:** 라운드마다 새로 생기는 예금 막대다. 아래는 준비금, 위는 대출이고, 점선이 그 대출을 다음 라운드의 예금으로 잇는다. 막대가 한 라운드씩 차례로 자란다.
- **오른쪽:** 예금 누적 막대가 위로 자라며 상한선 100÷r에 다가간다.

지급준비율 r은 5, 10, 20, 25% 단계 손잡이로 바꾸고, r을 바꾸거나 "처음부터 다시"를 누르면 애니메이션이 처음부터 재생된다. 아래에는 승수, 상한, 24라운드 누적, 대출+준비금 수치가 나온다. 모두 최초 예금 100 기준의 이론 계
- 결과: success $0.1813 6턴 58s
