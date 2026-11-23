# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/b/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/b/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/b/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/b/refs/api/ui.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/b/scene.html` (+3426자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint used-before-defined: 'MSS'가 풀이(첫 {{MSS}})보다 먼저 쓰였다
  고침 lint used-before-defined: 'RTT'가 풀이(첫 {{RTT}})보다 먼저 쓰였다
 
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/b/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 '
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/b/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/b/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r2/samples/b/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 'cwnd' (앞 장면에서 풀이할 것)
  고침 lint predict-new-term: predict 질문에서 처음 나온 용어 '
- 말: `scene.html`을 만들었다. 3차 audit 뒤에도 "고침" 3건이 남았고, audit 횟수 상한(3회)에 걸려 더 고치지 않았다.

**그린 장면:** 손실 신호 직후 cwnd(MSS)가 어디로 떨어지는지 맞히는 predict 장면이다. 슬로 스타트로 64 MSS까지 오른 뒤 손실이 난 시점을 플롯으로 보여 주고, 정답 화면에서 중복 ACK 경로(64→32, 이후 +1/RTT)와 타임아웃 경로(64→1, slow start 재상승)를 같은 손실 지점에서 나란히 그린다.

**남은 "고침" 3건 (audit 마지막 회차 기준):**
- predict 장면에 `cwnd`, `MSS`, `RTT`가 질문 주변에서 풀이 전에 쓰였다는 lint 지적. 질문 문장은 고쳤지만 선택지의 `MSS`, 그리고 sub
- 결과: success $0.0188 13턴 94s
