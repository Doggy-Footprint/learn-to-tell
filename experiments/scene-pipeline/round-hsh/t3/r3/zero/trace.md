# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero/refs/API.md`
- Bash `ls refs refs/api`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero/refs/api/diagram.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero/refs/api/deck-contracts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r3/zero/scene.html` (+5341자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
  고침 lint overview-order: overview는 summary 뒤, keywords 바로 앞에 둔다
## 1280x800
  권고 lint no-signat
- 말: audit에서 남은 "고침" 2건은 모두 overview 덱 순서 lint(`overview-order`)입니다. 장면이 하나뿐이라 신경 쓰지 않기로 한 항목이라 그대로 뒀고, 다른 지적은 없습니다. 남은 "권고" 1건(`no-signature`)도 그대로 둡니다.

`scene.html`에 5노드 Raft 클러스터 화이트보드를 8단계로 그렸습니다. 노드 로그가 ▢(미커밋)에서 ▣(커밋)으로 바뀝니다. 아래 순서로 진행합니다.
1. 타이머 만료
2. 후보가 되어 term 상승, 표 요청
3. 3/5 표로 리더 확정
4. 리더 로그에 append
5. 복제 2/5(미커밋)
6. 3/5 저장 시 커밋과 클라이언트 ack
7. 다음 heartbeat에서 팔로워가 commit을 따라감
8. 리더가 죽어도 로그가 덜
- 결과: success $0.2063 8턴 69s
