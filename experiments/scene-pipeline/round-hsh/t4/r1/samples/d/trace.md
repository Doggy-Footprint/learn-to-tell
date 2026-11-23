# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/samples/d/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/samples/d/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/samples/d/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/samples/d/scene.html` (+5456자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/samples/d/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 만들었다. 분기점에서 선도 가닥은 중합효소가 한 번에 이어 자라고, 지연 가닥은 오카자키 절편이 분기점 반대쪽으로 하나씩 생기고 프라이머가 빠진 뒤 연결효소가 틈을 잇는 과정을 반복 재생하는 도해다. audit은 1회 실행에서 고침 0건이었고, 남은 권고는 "그림이 주인공인 장면" 목록에 없다는 것 하나라 그대로 뒀다.

이번 장면은 `hook` 타입이라 `LTT.diagram` 대신 SVG와 SMIL 애니메이션을 `art`에 직접 넣었다. 스토리보드에 틀린 것으로 보이는 부분이 있다. 사실 점검표의 "선도 가닥 주형은 3' 쪽이 분기점을 향한다"는 새 가닥이 분기점 방향으로 자라는 조건과 맞지 않는다. 역평행 관계로 따지면 선도 주형의 5' 쪽이 분기점 앞(전진 방향)에 있어야 한
- 결과: success $0.0353 8턴 234s
