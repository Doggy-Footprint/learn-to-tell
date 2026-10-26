# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/c/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/c/refs/API.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/c/scene.html` (+5323자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- 말: The audit failed because `ltt-parts.js` needs `d3.min.js` loaded first. The API's import order lists d3 before `ltt.js`, so I'll add it there.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/c/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 만들었다. 오른쪽 복제 분기점에서 선도 가닥은 끊김 없이 자라고 지연 가닥은 분기점에서 멀어지며 오카자키 절편이 차례로 생기는 과정을 CSS 애니메이션으로 보여 준다.

- audit은 2회 돌렸다. 첫 실행은 `d3.min.js`를 빠뜨려 실패해서 로드 순서를 고쳤고, 두 번째 실행에서 고침 0건으로 끝났다. 남은 권고 "그림이 주인공인 장면이 없다"는 그대로 두었다.
- 장면 type은 브리프의 `hook`을 따랐다. `hook`의 `art` 칸에 SVG를 넣었는데, 큰 그림이 hook 레이아웃에서 어떻게 보일지는 스크린샷을 찍지 않아서 확인하지 못했다.
- 부품 표에 맞는 부품이 없어서(다이어그램 부품은 이중나선 도해에 맞지 않음) `refs/api/` 부품 문서는 읽지 않고 
- 결과: success $0.0264 7턴 184s
