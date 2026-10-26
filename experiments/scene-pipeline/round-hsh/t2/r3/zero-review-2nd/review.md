# 검수: TCP 혼잡 제어 (predict)

스크린샷은 질문 상태(t1s·t4s·t8s)뿐이다. 정답 공개 상태는 `scene.html` 코드로만 확인했다.

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 단위(cwnd MSS, RTT 100 ms, 처리량 = cwnd×MSS÷RTT) | 통과 | scene.html:20 `tp`, :54–56 expect, scene-t1s.jpg 카드 "3.74 Mbps" |
| 사실: slow start ×2, 혼잡 회피 +1 MSS/RTT, 둘을 섞지 않음 | 통과 | scene.html:23 `slow`, :25–32 `saw` |
| 사실: 3 dup ACK ×1/2, RTO는 1로 복귀(다른 사건) | 통과 | scene.html:46 `rto`(점선), :83 why |
| 사실: 손 계산 1→32(5 RTT), 32→16, 이후 17… | 통과 | scene.html:23, :26–31 |
| 사실: 처리량 3.74 / 1.87 / 평균 2.8 Mbps | 통과 | scene.html:54–56, :83 `tp(24)`, scene-t1s.jpg 카드 3.74 |
| 사실: 반감 직후 처리량 절반, 한 톱니 16 RTT | 통과 | scene.html:27–31 (5→22, 16 RTT) |
| 사실: 손실 전 절반선 없음 | 통과 | scene.html:45 `ss`는 full에서만. scene-t1s.jpg에 점선 없음 |
| 생성 순서: 곡선이 좌→우 시간순, 손실은 cwnd 증가의 결과 | 통과 | scene-t1s.jpg는 0–5 RTT만, 손실 표시 없음. 그리기 움직임은 t1s~t8s가 같아 확인 불가 |
| 생성 순서: ssthresh는 손실 순간에 정해짐 | 통과 | scene.html:45, :82 (answerVisual에서만 그림) |
| 비트 1: RTT마다 2배, 처음이 가파름 | 통과 | scene-t1s.jpg 0→5 RTT 곡선 |
| 비트 2: 큐가 차서 버려진다는 신호 | 실패 | scene-t1s.jpg에 질문 본문이 없다. scene.html:67 `question`이 화면에 안 나온다 |
| 비트 3: 예측(1 / 16 / 32) | 실패 | 선택지는 보인다(scene-t1s.jpg). 예측할 질문 문장이 없다(같은 원인, scene.html:67) |
| 비트 4: 답 16, ssthresh = 16 | 통과 | scene.html:81, :83 (정답 상태 스크린샷 없음, 코드 확인) |
| 비트 5: 선형 +1, 같은 반감 반복 | 통과 | scene.html:27–31 (하락 2회: t=5, t=22), :84 |
| 비트 6: 처리량 약 3/4 | 통과 | scene.html:83 `tp(24)` 2.8 Mbps, 최고점의 약 3/4 |
| 비트 6: 손실이 잦으면 톱니가 낮아지고 처리량이 떨어진다 | 실패 | scene.html:83–84에 이 진단 문장이 없다 |
| 화면: 구간 둘(slow start, 혼잡 회피)과 ssthresh 경계 | 실패 | scene.html:50 answerVisual에 구간 이름·경계 설명이 없다. 점선 두 개가 무엇인지 글이 없다 |
| 화면: 손실 지점과 직후 하락 | 통과 | scene.html:27 (정답 상태, 코드 확인) |
| 화면: 강조점 32→16(1이 아님) | 통과 | scene.html:46, :83 |
| 화면: 겹침·빈 프레임·읽을 수 없는 글 | 통과 | 세 장면 모두 내용이 있고 눈금·본문이 읽힌다 |
| 화면: 잘림 | 권고 | scene-t1s.jpg 하단(y≈732) 어두운 띠가 네비 아래로 잘린다. audit "78%로 줄었다"는 권고만 |

## 판정 요약

실패 4항목: 비트 2, 비트 3, 비트 6 진단, 구간·ssthresh 설명. 비트 2·3은 질문 본문 하나로 같이 고친다.

## 고친 것

- 비트 2·3(질문 본문 누락): `predictQ` 상수를 빼서 `question`과 `visual` 상단 `<p>`에 넣었다(scene.html:67–70, :76).
- 비트 6 진단(손실이 잦으면 처리량 하락): takeaway 끝에 한 문장을 덧붙였다(scene.html:84).
- 구간·ssthresh 설명: 정답 그림 아래에 `ltt-basis` 설명을 덧붙였다(scene.html:50 부근).
- 재 audit: 고침 0건. 권고 2건(shrunk 78%, no-signature)은 그대로 둔다.
