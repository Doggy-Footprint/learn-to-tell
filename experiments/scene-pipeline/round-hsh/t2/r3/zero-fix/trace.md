# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix/refs/api/charts.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix/refs/api/deck-contracts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t2/r3/zero-fix/scene.html` (+6177자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`에 predict 장면 하나를 그렸다. cwnd 시계열 플롯에서 slow start가 1·2·4·8·16·32로 커지다가 32 MSS에서 손실(dup ACK 3개)이 나는 지점까지 그려진다. "손실 직후 cwnd는 어디로?"를 1, 16, 32 중에서 고르고 나면, 16으로 반감된 뒤 RTT마다 +1 MSS씩 늘어나는 톱니가 나타난다. 이때 ssthresh=16 선과 평균 cwnd ≈ 24(약 2.8 Mbps)도 함께 보인다. 1을 고르면 타임아웃(RTO) 때만 1로 돌아간다는 점선 경로가 대신 나온다.

audit은 1회 실행했고 고침 지적은 0건이다. 남은 권고는 "78%로 축소"와 "no-signature" 둘이며, 그대로 뒀다.
- 결과: success $0.1684 7턴 51s
