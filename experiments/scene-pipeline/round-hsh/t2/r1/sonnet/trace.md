# stream.jsonl

- Bash `ls . samples refs refs/api`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet/refs/API.md`
- Bash `cd samples; wc -c *; cat a-audit.txt b-audit.txt c-audit.txt d-audit.txt; cat a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet/refs/api/controls.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet/refs/api/deck-contracts.md`
- Bash `cd /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet; cat samples/b.html samples/c.html samples/d.html | grep -v '^<script src'; grep -n "axisPlot" -A12 refs/api/charts.md | head -60`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet/direction.md` (+1362자)
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet/scene.html` (+5935자)
- 말: `scene.html`을 썼다. 안에 쓸모없는 자리 표시 줄이 하나 남아서 지우고 audit을 돌린다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  권고 lint no-signature: 그림이 주인공인 장면(figure, contras
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  권고 lint no-signature: 그림이 주인공인 장면(figure, contras
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/sonnet/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: 방향: b의 생성 순서 연출(손실 → 감소 → 기준선 → 선형 상승)을 따르는 predict 장면이다. 큰 cwnd 시계열 플롯 하나가 주인공이다. 손실 표식이 먼저 찍히고, 그 다음 cwnd가 20으로 떨어진다. 이어서 ssthresh 20 기준선이 그어지고, RTT마다 +1씩 오르는 톱니가 두 번 반복된다. 끝에 평균 30(피크의 75%)과, 1로 떨어지는 건 타임아웃일 때뿐이라는 점선을 보인다.

가져온 것: b에서는 점을 시간순으로 자라게 하는 구조, 손실 표식, 손실 뒤에야 ssthresh 선이 생기는 순서를 가져왔다. a에서는 facts 줄과 병목 한계 점선을, d에서는 reduced-motion 처리를 가져왔다. d에서 audit "고침"을 낳은 질문 속 미풀이 용어는 피했다.

audit은 3
- 결과: success $0.3092 17턴 95s
