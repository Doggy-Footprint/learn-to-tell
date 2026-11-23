# review (2차): 손실 직후 cwnd 장면

대상 `scene.html`. 근거: `storyboard.md`, `direction.md`, `shots/scene-t1s·t4s·t8s.jpg`(문제 화면만 촬영됨), 코드 줄 번호.

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 단위 MSS 통일 | 통과 | scene.html:39 축 라벨, :71-73 facts, t4s |
| 사실: slow start 2배 | 통과 | :18 SLOW 10→20→40은 2배. 3번째 이후 64는 한계에서 잘린 값으로, 스토리보드 예(40→80)와 다름 (권고) |
| 사실: 손실 시 cwnd 64 | 통과 | :17 LOSS_X=3, :18 SLOW[3]=64, t4s |
| 사실: ssthresh = 64/2 = 32 | 통과 | :21 SSTHRESH 값 32 |
| 사실: 타임아웃 1→32는 5 RTT | 통과 | :23-24, x=3에 1, x=8에 32 |
| 사실: 32→64 는 +1/RTT, 32 RTT | 통과 | :22 DUP, x=3(32)에서 x=35(64) |
| 사실: 처리량 14.95 / 7.48 Mbit/s | 통과 | :87 basis 값과 계산 일치 |
| 사실: 평균 최고점의 약 75%, 32 RTT = 1.6 s | 통과 | :86 why |
| 생성 순서: 손실 → ssthresh → 하강 | 통과 | :83 answerVisual 순서 slow, loss, ssth, dup, to |
| 생성 순서: slow start가 ssthresh보다 먼저 | 통과 | :21 SSTHRESH는 LOSS_X에서 시작, slow는 그 전 |
| 비트 1: slow start가 RTT마다 2배 | 통과 | t1s·t4s 곡선 10→20→40→64, :65 sub |
| 비트 2: cwnd 64에서 손실, 예측 지점 | 통과 | t4s 빨간 세로 점선 x=3 |
| 비트 3: 중복 ACK 32, 타임아웃 1 | 통과(코드) | 공개 상태 촬영 없음. :22-23 |
| 비트 4: 반감 뒤 완만한 기울기 | 통과(코드) | :22 기울기 +1/RTT |
| 비트 5: 평균 최고점의 75%, 링크 미사용 | 통과 | :86 why |
| 비트 6: 진단 판단(32↔64 vs 1) | 통과 | :86 why |
| 구간 구분: slow start / congestion avoidance / 손실 반응 | 실패 | :69 범례에는 slow start만 있다. :84 범례에 congestion avoidance 구간명이 없다 |
| 화면: 겹침 | 실패 | t4s·t8s: 손실선(:20, 높이 72)이 y축 라벨 "cwnd (MSS)"를 가로지른다 |
| 화면: 잘림 | 통과 | 세 장 모두 잘린 글·그림 없음 |
| 화면: 빈 프레임 | 통과 | 세 장 모두 그림이 있다 |
| 화면: 읽을 수 없는 글 | 권고 | t1s 하단 범례(:69)가 매우 작다 |
| 화면: 움직임이 끝나거나 멈춤 | 통과 | t4s와 t8s 동일, 손실 뒤 정지. 반복 없음 |
| 확인 불가: #ltt-checks | 확인 불가 | index.txt checks 행. scene.html에 #ltt-checks가 없다. 이 요소가 필요한지 여기서 확인하지 못했다 |

## 권고 (고치지 않음)
- 독학: AIMD(:86), BDP(:69, :84)가 풀이 없이 쓰였다. 장면당 새 용어는 2개 이하.
- t1s에서 slow 곡선이 이미 끝나 있다. 촬영 시점 편차로 보인다.
- 손실선이 bad 토큰(빨강)을 쓴다. good·bad·warn은 판정에만 쓴다(:29).
- audit 권고 두 건(shrunk 78%, no-signature)은 그대로 둔다.

고침 전 기록 끝.

## 고친 것
- 화면 겹침: 손실선 끝을 72에서 66으로 낮춰 y축 라벨 "cwnd (MSS)"와 겹치지 않게 했다(scene.html:20).
- 구간 구분: 공개 범례에 slow start → 손실 → ssthresh 32 → congestion avoidance 구간명을 넣었다(scene.html:84).
