# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero-fix/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero-fix/refs/API.md`
- Bash `ls refs/api; wc -c refs/api/*`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero-fix/refs/api/deck-contracts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero-fix/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero-fix/scene.html` (+14464자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  고침 lint no-title: 제목이 없다
## 1280x800
  고침 lint no-title: 제목이 없다
고침 2건
- 말: audit이 장면에 `title`이 없다고 해서 추가하고, 문구 오타와 불필요한 빈 라벨도 같이 고칩니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero-fix/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero-fix/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t1/r2/zero-fix/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 B+tree 분할 도해를 그렸고, audit 결과 고침 0건입니다. 화면 축소 권고 2건(87%, 85%)은 그대로 뒀습니다.

그림은 키 86을 꽉 찬 잎에 넣는 과정을 8단계로 보여 줍니다.
1. 높이 3 트리의 루트·I2·잎이 모두 4/4로 꽉 찬 상태
2. 86 삽입으로 잎이 넘침
3. 잎이 3+2로 갈라지고 새 오른쪽 잎이 연결 리스트에 끼어듦
4. 구분 키 86이 복사되어 I2에 올라가고 I2가 넘침
5. I2가 쪼개지며 가운데 80이 이동하고 루트가 넘침
6. 루트가 쪼개져 100이 올라가 새 루트가 맨 마지막에 생기고, 모든 잎이 한 층 내려가 높이가 3에서 4가 됨
7. 부모에 빈 칸이 있으면 잎 분할 한 번으로 멈추는 대비
8. 페이지 8 KB와 4 KB의 팬아웃 
- 결과: success $0.6559 12턴 302s
