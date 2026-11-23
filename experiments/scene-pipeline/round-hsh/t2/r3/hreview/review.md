# 검수: TCP 혼잡 제어 (predict, 장면 1)

확인한 화면: `shots/scene-t1s.jpg`, `scene-t4s.jpg`, `scene-t8s.jpg` (predict 단계). answerVisual 단계는 스크린샷이 없어 `scene.html` 코드로만 확인했다.

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 단위 (cwnd = MSS, 시간 = RTT) | 통과 | 축 라벨 "시간 (RTT)", "cwnd (MSS)" (scene-t1s.jpg, scene.html:33) |
| 사실: slow start RTT당 ×2 | 통과 | PRE 1, 2, 4, 8, 16, 32 (scene.html:19), scene-t4s.jpg |
| 사실: 혼잡 회피 RTT당 +1 MSS | 통과 | SAW t=6..21 값 17..32 (scene.html:21) |
| 사실: 3 dup ACK는 ×1/2, RTO만 1 MSS | 통과 | why 문장 (scene.html:95) |
| 사실: 손 계산 ssthresh 16, cwnd 16 후 17 | 통과 | SAW [5,16], [6,17] (scene.html:20-21) |
| 사실: 처리량 3.74 → 1.87 Mbps | 실패 | why의 식 "cwnd × MSS ÷ RTT"는 바이트/s(32 × 1460 ÷ 0.1 = 467,200)라 ×8이 빠진다. 식대로 계산하면 3.74 Mbps가 나오지 않는다 (scene.html:95) |
| 사실: 톱니 평균 24 = 0.75 × 32 | 통과 | callout (scene.html:83), LTT.expect (scene.html:28) |
| 사실: 평균 처리량 약 2.8 Mbps | 통과 | 화면에 나오지 않음. 틀린 값도 없음 |
| 생성 순서: 곡선은 시간순, 손실은 32 도달 뒤 | 통과 | t4s: 0~5 순서로 그려진 뒤 손실 점 (scene-t4s.jpg), reveal 뒤 loss 설정 (scene.html:69) |
| 생성 순서: ssthresh는 손실 순간부터 | 통과 | predict 단계에 점선 없음 (scene-t1s, t4s). answerVisual은 k > CUT에서만 그림 (scene.html:80) |
| 생성 순서: 하락 후 선형은 ssthresh에서 시작 | 통과 | SAW [5,16] 다음 점이 17 (scene.html:20-21) |
| 비트 1: 작은 cwnd에서 RTT마다 2배 | 통과 | scene-t1s.jpg (1, 2, 4, 8), scene-t4s.jpg |
| 비트 2: 32에서 손실 신호 | 통과 | scene-t4s.jpg 손실 점(t=5, 32), 캡션 "곡선이 32에 닿는 순간 손실 신호가 온다". 방향은 ×, 실제는 ● (권고) |
| 비트 3: 예측 질문 (1 / 16 / 32) | 통과 | scene-t1s.jpg 선택지 셋 |
| 비트 4: 16으로 반감 | 통과 | answerVisual 하락 (scene.html:76-80). 답 단계 스크린샷 없음 |
| 비트 5: 선형 증가, 톱니 반복 | 통과 | scene.html:21-23 |
| 비트 6: 최고점의 3/4 진단 | 통과 | callout (scene.html:83). "손실이 잦으면 톱니가 낮아진다" 문장은 없음 (권고) |
| 화면: 구간 둘(지수·선형)과 경계 표시 | 실패 | 답 단계 chart에 구간 이름이 없다. 지수 증가는 predict 캡션에만 있고, 선형 구간과 점선이 무엇인지 설명이 없다 (scene.html:67, 83) |
| 화면: "정답 보기" 버튼 잘림 | 실패 | scene-t1s.jpg, t4s, t8s에서 버튼 하단 y≈712–735가 잘린다 (scene.html:34 높이 340) |
| 화면: 겹침·빈 프레임 | 통과 | 겹침 없음. predict 단계는 곡선이 채워진 뒤 빈 프레임 없음 |
| 화면: 읽을 수 없는 글 | 통과 | ltt-basis 캡션이 작지만 읽힌다 (scene-t1s.jpg) |
| 화면: 움직임이 멈추거나 끝나지 않음 | 통과 | reveal과 setInterval 모두 끝난다 (scene.html:39-47, 89-93) |
| audit | 권고만 | 1440, 1280 모두 "장면1 shrunk 78%" 권고. 고침 0건 (shots/scene-audit.txt) |

## 고친 것

- 처리량 식: why에 ×8(바이트→비트)을 넣어 3.74 Mbps가 식으로 재현되게 함 (scene.html:95).
- 구간 둘: answerVisual에 지수·선형 구간과 점선(ssthresh) 설명 캡션을 추가함 (scene.html:71-80 부근).
- 버튼 잘림: 그림 높이 340 → 300으로 줄여 "정답 보기"가 들어오게 함 (scene.html:32). 답 단계 캡션 추가분을 상쇄한다.
- audit 재실행: 고침 0건, 권고 78%만 남음. 새 스크린샷은 만들지 않아 잘림 해소는 재촬영으로 확인하지 못함.
