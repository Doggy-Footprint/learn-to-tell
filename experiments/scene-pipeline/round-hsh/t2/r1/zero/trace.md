# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero/refs/API.md`
- Bash `ls refs refs/api`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero/refs/api/deck-contracts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero/scene.html` (+2970자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  권고 lint no-signature: 그림이 주인공인 장면(figure, contras
- 말: audit에서 "고침" 1건(질문에 처음 나온 용어 `cwnd`)이 나왔습니다. 제목의 `cwnd`를 "혼잡 윈도"라는 말로 바꿔 고치겠습니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint used-before-defined: 'cwnd'가 풀이(첫 {{cwnd}})보다 먼저 쓰였다
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r1/zero/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 predict 장면 하나를 그렸고, audit은 "고침" 0건으로 끝났습니다(남은 "권고"는 78% 축소와 no-signature 두 가지입니다).

- **문제 화면:** 40 MSS에서 첫 손실이 나기 직전까지의 cwnd 시계열을 보여 줍니다. 시작 10 MSS에서 RTT마다 2배로 올라가는 곡선이고, 병목 한계선이 함께 있습니다. 선택지는 1 MSS로 추락, 절반인 20 MSS에서 재개, 40 MSS 유지입니다.
- **정답 공개 화면:** 정답은 절반(20 MSS)입니다. 공개하면 40에서 20으로 내려와 ssthresh 기준선에서 RTT당 +1 MSS로 오르는 톱니가 이어집니다. 타임아웃일 때 1 MSS로 떨어지는 점선도 함께 보입니다.
- **고친 것:** 처음 audit
- 결과: success $0.1795 12턴 77s
