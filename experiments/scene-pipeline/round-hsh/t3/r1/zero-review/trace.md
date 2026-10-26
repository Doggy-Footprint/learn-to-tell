# stream.jsonl

- 말: 먼저 읽을 파일들과 `shots/` 안의 스크린샷 목록을 확인하겠습니다.
- Bash `ls -la shots/ && pwd`
- Read `storyboard.md`
- Read `direction.md`
- Read `scene.html`
- Read `shots/index.txt`
- Read `shots/scene-audit.txt`
- Read `refs/API.md`
- 말: 스토리보드, 화면 방향, 장면 코드, 감사 결과, API 문서를 읽었습니다. 이제 스크린샷 11장을 모두 읽겠습니다.
- Read `shots/scene-t1s.jpg`
- Read `shots/scene-t4s.jpg`
- Read `shots/scene-t8s.jpg`
- Read `shots/scene-step1.jpg`
- Read `shots/scene-step2.jpg`
- Read `shots/scene-step3.jpg`
- Read `shots/scene-step4.jpg`
- Read `shots/scene-step5.jpg`
- Read `shots/scene-step6.jpg`
- Read `shots/scene-step7.jpg`
- Read `shots/scene-step8.jpg`
- 말: 스크린샷 11장을 확인했습니다. 고치기 전에 `review.md`를 먼저 씁니다.
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero-review/review.md` (+2317자)
- 말: `review.md`를 썼습니다. 그림 크기 문제를 고치려면 사용 중인 `LTT.diagram`의 부품 문서가 필요하니 그것만 읽겠습니다.
- Read `refs/api/diagram.md`
- 말: `LTT.diagram`은 격자 칸 크기에 맞춰 그림을 축소하는 방식이라, 글자 크기와 세로 높이를 바꾸는 변경은 렌더링으로 확인하지 않으면 다른 결함을 만들 수 있습니다. 그래서 사실 오류 두 건과 "과반 3" 겹침만 Edit로 고칩니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero-review/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero-review/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero-review/scene.html`
- 말: 세 건을 고쳤습니다. 이제 audit을 다시 실행합니다.
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 small-visual: 가장 큰 그림이 화면의 20%뿐이다. 그림을 키우거나 layout: "full"
  고침 lint overview-order: overview는 summary 뒤, keywords 바로 앞에 둔다
  권고 lint unused-term: glossary의 'term'가 어디
- 말: audit 결과는 "고침 2건"입니다. 둘 다 `overview-order`(두 뷰포트)이고, 제 수정 때문에 생긴 새 권고 하나(`unused-term`)가 추가됐습니다. 이 항목을 맞추려면 summary와 keywords 장면을 새로 만들어야 하는데, 그 내용은 스토리보드에 없어서 임의로 채울 수 없습니다. 그래서 여기서 멈추고 `review.md`에 결과를 적습니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r1/zero-review/review.md`
- 말: 실패 6건 중 3건을 고쳤습니다. 다만 audit의 `overview-order` 고침 1건은 해결하지 못했습니다.

**막힌 부분:** 덱에 summary와 keywords 장면이 없어서 overview 순서 규칙을 만족할 수 없습니다. 두 장면을 새로 만들려면 요약 카드와 keywords 용어가 필요한데, 스토리보드에 없는 내용이라 제가 채우지 않았습니다. 작성자가 정해 주셔야 합니다.

**고친 것 (scene.html):**
- 115행: 캡션의 "{{term}}·{{커밋}} 규칙" 설명을 "선출과 {{커밋}}이 쓰는 과반 수"로 바로잡았습니다.
- 58행: 화면에 없는 "팔로워 commitIndex 수신" 주장을 캡션에서 뺐습니다.
- 22행: "과반 3" 글자를 점선이 가르던 문제를 배경과 여백으
- 결과: success $0.0320 26턴 146s
