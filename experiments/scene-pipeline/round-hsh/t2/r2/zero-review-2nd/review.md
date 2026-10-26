# 검수: TCP 혼잡 제어 (predict)

정답 상태(`answer`)의 스크린샷은 `shots/`에 없다. 그 부분은 코드(`scene.html`)로 확인했다.

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 단위 MSS로 통일 | 통과 | 축 라벨 "cwnd (MSS)", scene-t1s.jpg |
| 사실: slow start는 지수(RTT마다 ×2) | 통과 | "RTT마다 ×2" 라벨, scene-t1s.jpg; scene.html:42 |
| 사실: 감소 ×1/2, 증가 +1 MSS/RTT | 통과 | scene.html:76-81 (ssthresh 32, "+1 MSS/RTT, 32 RTT 걸림") |
| 사실: 처리량 = cwnd×MSS/RTT, rwnd와 min 단서 | 실패 | 공식과 rwnd 단서가 화면 어디에도 없다. scene.html:110 basis |
| 사실: 손 계산 14.95 / 7.48 / 11.2 Mbit/s | 통과 | scene.html:47, 91-93 (mbit(64)=14.95, mbit(32)=7.48, mbit(48)=11.2) |
| 생성 순서: 손실 → ssthresh → cwnd 하강 | 통과 | 손실 원 1.5s(scene.html:67), ssthresh 선 2.1s(:76), 중복 ACK 하강 2.7s(:78), 타임아웃 하강 3.5s(:79) |
| 생성 순서: slow start가 ssthresh 갱신보다 먼저 | 통과 | slow start 선 0s(scene.html:63), 나머지는 이후 |
| 비트 1: slow start에서 RTT마다 2배 | 통과 | scene-t1s.jpg, 점 1→2→4→8→16→32 |
| 비트 2: cwnd = 64에서 손실, 예측 질문 | 통과 | scene-t1s.jpg, 빨간 원(6, 64), "?" 와 "다음 cwnd는?" |
| 비트 3: 중복 ACK면 32, 타임아웃이면 1 | 통과 | 정답 상태 코드 scene.html:78-83 (정답 스크린샷 없음) |
| 비트 4: 반감 후 기울기가 완만함 | 통과 | "congestion avoidance: +1 MSS/RTT, 32 RTT 걸림" scene.html:81 |
| 비트 5: 톱니 평균 = 최고점의 약 75% | 통과 | 점선 "평균 48 = 최고점의 75%", scene.html:84-86 |
| 비트 6: 진단 판단(32↔64 정상 / 바닥 자주 = 타임아웃) | 실패 | 정상 쪽(32↔64 규칙적) 기준이 takeaway에 없다. scene.html:111 |
| 화면: cwnd 시계열, 손실 시점, 병목 한계선 | 통과 | scene-t1s.jpg: 점선 "병목 한계 = BDP + 큐 = 64" |
| 화면: ssthresh 수준 | 통과 | 정답 공개 뒤에만 보임, scene.html:76-77 (정답 스크린샷 없음) |
| 화면: 구간 구분(slow start / CA / 손실 반응) | 통과 | slow start 띠 scene-t1s.jpg; CA 라벨 scene.html:81; 반응 라벨 :80, :83 |
| 화면 결함: 잘림 | 실패 | scene-t1s.jpg 선택지 아래 왼쪽(약 x175–245, y728)에 잘린 요소. audit가 78%로 축소 |
| 화면 결함: 겹침 | 통과 | "slow start" 라벨과 손실 원이 가깝지만 겹치지 않음 |
| 화면 결함: 빈 프레임 / 멈추지 않는 움직임 | 통과 | 모든 모션이 5.1s 안에 끝남, scene.html:20-26; reduced-motion 처리 있음 |
| 화면 결함: 읽을 수 없는 글 | 통과 | 부제·부가 글이 작지만 판독 가능, scene-t1s.jpg |

## 고친 것

- 사실: 처리량 공식과 rwnd 단서를 `basis`에 추가했다(scene.html:110).
- 비트 6: `takeaway`에 "32↔64 규칙적이면 정상" 기준을 추가했다(scene.html:111).
- 잘림: `.cw`에 `max-height: 380px`를 시도했으나 audit 축소율(78%)이 그대로여서 효과가 없다고 보고 되돌렸다. 미해결이다.
- audit: 1차 실행, 고침 0건. 남은 권고 2건(장면1 shrunk 78%, lint no-signature)은 그대로 둔다.
