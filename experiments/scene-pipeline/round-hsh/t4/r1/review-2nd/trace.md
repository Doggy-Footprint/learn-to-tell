# stream.jsonl

- Bash `ls -R shots/ && pwd`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/direction.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/scene.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/shots/index.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/shots/scene-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/shots/scene-t1s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/shots/scene-t4s.jpg`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/shots/scene-t8s.jpg`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/review.md` (+2143자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t4/r1/review-2nd/review.md`
- 말: 실패 2개, 고친 항목 2개입니다. 나머지 항목은 통과입니다.

- 고침 1: 선도 가닥의 "프라이머가아제" 라벨이 중합효소 배지에 가려져 위치를 옮겼습니다 (`scene.html` L147).
- 고침 2: 지연 절편의 5'/3' 글자가 겹쳐 새 절편 3' 표기를 겹치는 구간에서만 잠깐 숨겼습니다 (`scene.html` L160).

audit은 두 번째 실행에서 "고침 0건"으로 끝났습니다. 다만 audit은 겹침을 잡지 못하므로 두 수정은 코드를 읽어서만 확인했고, 다시 찍은 스크린샷은 없습니다.

확인이 필요한 점 두 가지:
- 스토리보드 사실 점검표 두 번째 항목이 서로 모순됩니다. "선도 가닥 주형은 3' 쪽이 분기점을 향한다"라고 쓰였지만, 괄호 안 설명과 물리상 맞는 쪽은 5'가 분기점을 향
- 결과: success $0.0381 16턴 206s
