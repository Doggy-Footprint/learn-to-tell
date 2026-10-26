# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero/refs/api/ui.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero/scene.html` (+3495자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint used-before-defined: 'ssthresh'가 풀이(첫 {{ssthresh}})보다 먼저 쓰였다
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'c
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero/scene.html`
- 말: audit 지적 두 건을 고쳤다. 다시 audit을 돌려 확인한다.
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 predict 장면 하나를 만들었다. 1→32 MSS로 RTT마다 2배씩 커진 cwnd 곡선을 먼저 보여 주고 손실 뒤 값(1, 16, 32)을 고르게 한다. 정답을 공개하면 16으로 반감한 뒤 RTT당 +1로 오르는 톱니와 ssthresh=16 점선, 타임아웃일 때의 1 MSS 하락 점선이 나온다. 처리량 3.74→1.87 Mbps, 평균 약 2.8 Mbps(최고점의 약 3/4)도 함께 적었다.

audit은 두 번 돌렸고 마지막에 "고침" 0건이다. 남은 "권고"는 두 가지다. 장면이 78%로 줄어든다는 것과, 그림이 주인공인 장면(figure 등)이 없다는 것이다. 둘 다 그대로 뒀다.

화면은 직접 확인하지 않았다(스크린샷 금지). 그래서 `axisPlot`에 넘긴 점 좌표 
- 결과: success $0.1552 11턴 62s
