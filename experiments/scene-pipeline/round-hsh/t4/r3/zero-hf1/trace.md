# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/zero-hf1/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/zero-hf1/refs/API.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r3/zero-hf1/scene.html` (+9802자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 DNA 복제 분기점 도해를 그렸고, audit 결과는 고침 0건, 권고 2종(`no-signature`, 1280px에서 87%로 축소)이라 그대로 뒀습니다.

오른쪽으로 열리는 Y자 분기점에서 새 가닥 두 개가 생기는 순서를 애니메이션으로 보여 줍니다.
- **선도 가닥**: 프라이머 하나에서 시작해 분기점을 따라 끊김 없이 자랍니다.
- **지연 가닥**: 분기점이 열릴 때마다 프라이머를 놓고, 분기점 반대쪽(왼쪽)으로 짧은 절편이 쌓입니다. 가장 오래된 절편이 왼쪽 끝, 가장 새 절편이 분기점 옆입니다.
- **확대와 연결**: 절편 하나를 확대해 그 절편도 5'→3'으로 자란다는 점을 보이고, 마지막에 프라이머를 떼고 절편을 이어 붙입니다.

단계별 자막, 다시 재생 버튼, 
- 결과: success $0.2203 5턴 87s
