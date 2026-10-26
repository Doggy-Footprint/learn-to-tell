# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-hb1/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-hb1/refs/API.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-hb1/scene.html` (+8601자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 장면1 overflow: 한 화면에 안 들어간다 (78%로 줄여도 넘친다). 해설·캡션을 줄이거나 장면을 나눌 것
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
## 1280x800
  고침 장면1 overfl
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-hb1/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-hb1/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-hb1/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 장면1 overflow: 한 화면에 안 들어간다 (78%로 줄여도 넘친다). 해설·캡션을 줄이거나 장면을 나눌 것
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
## 1280x800
  고침 장면1 overfl
- 말: audit이 아직 화면 넘침을 지적해서, 그림 높이와 캡션을 더 줄여 보겠습니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-hb1/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r2/zero-hb1/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 복제 분기점 도해를 그렸고, audit은 "고침" 0건으로 끝났습니다. "권고" 하나(`no-signature`)는 그대로 뒀습니다.

그림에서는 헬리케이스가 Y자 분기점을 오른쪽으로 열고, 위쪽 선도 가닥은 프라이머 하나 뒤에 분기점을 따라 끊김 없이 자랍니다. 아래쪽 지연 가닥은 분기점 반대 방향(←)으로 프라이머마다 오카자키 절편이 생기고, 나중 절편일수록 분기점에 가깝습니다. 5'→3' 규칙은 하나이고 분기점 기준 방향만 반대라는 점을 강조한 다음, 프라이머 제거, 틈 메움, 연결효소로 이어 붙이는 과정이 자동 반복 재생됩니다.

화면에서 직접 실행해 확인하지는 않았습니다. 그림 높이를 `34vh`로 줄여 넘침을 해결했습니다.
- 결과: success $0.3477 12턴 157s
