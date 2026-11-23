# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/a/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/a/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/a/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/a/scene.html` (+6824자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 load: page.waitForSelector: Timeout 15000ms exceeded.
  고침 pageerror: ltt-parts.js needs d3.min.js and ltt.js loaded first
  고침 pageerror: ltt-deck.js needs ltt.js, ltt-pa
- 말: The audit says `ltt-parts.js` needs `d3.min.js` loaded first. The API doc's load order includes it, so I'll add it.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/a/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 장면1 hscroll: 가로로 넘친다 (폭 1241px 초과). 고정 폭을 max-width:100%로 바꿀 것
  고침 장면1 overflow: 한 화면에 안 들어간다 (78%로 줄여도 넘친다). 해설·캡션을 줄이거나 장면을 나눌 것
  권고 lint no-signature: 그림이 주인공인 장면(fig
- 말: The audit flags horizontal overflow and a vertical overflow that persists at 78%. I'll make the figure fluid, cap its width, and drop the takeaway and recall text that adds height to the hook.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/a/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/samples/a/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 장면1 hscroll: 가로로 넘친다 (폭 1241px 초과). 고정 폭을 max-width:100%로 바꿀 것
  고침 장면1 overflow: 한 화면에 안 들어간다 (78%로 줄여도 넘친다). 해설·캡션을 줄이거나 장면을 나눌 것
  권고 lint no-signature: 그림이 주인공인 장면(fig
- 말: `scene.html`에 DNA 복제 분기점 장면을 그렸다. 분기점이 오른쪽으로 전진하며 선도 가닥은 연속으로, 지연 가닥은 분기점과 반대 방향(←)의 절편으로 하나씩 자라고, 마지막에 프라이머를 떼고 절편을 잇는 과정이다.

audit은 3회를 모두 썼고, 마지막 결과에 고침 2건이 남았다. 두 건 모두 장면 1의 가로 넘침(1241px, 1280px 기준 1288px)과 한 화면 넘침이다. 원인은 확인하지 못했다. 그림 SVG는 폭을 100%로 제한했지만 효과가 없었다. 그래서 audit 지적을 해결했다고 말할 수 없다. 권고 `no-signature`는 남겨 두었다.

작업 중 바꾼 내용:
- `d3.min.js`를 추가했다. 없으면 `ltt-parts.js`가 로드되지 않아 페이지가 깨졌다.
- 고침
- 결과: success $0.0308 11턴 202s
