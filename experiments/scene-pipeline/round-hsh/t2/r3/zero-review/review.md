# 검수: TCP 혼잡 제어 (predict, 장면 1)

대상: `scene.html` · 스크린샷: `shots/scene-t1s.jpg`, `scene-t4s.jpg`, `scene-t8s.jpg` (세 장 모두 답 공개 전 상태)

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 단위 (cwnd MSS, 시간 RTT, 처리량 = cwnd×MSS÷RTT) | 통과 | scene.html:20 `tp()`, :83 |
| 사실: slow start ×2, 혼잡 회피 +1 MSS (섞지 않음) | 통과 | scene.html:23 (1,2,4,8,16,32), :26-31 (16→32 뒤 +1) |
| 사실: 3 dup ACK ×1/2 와 RTO=1 구분 | 통과 | scene.html:46 (rto 점선), :83 (RTO 때만 1) |
| 사실: 손 계산 32 MSS → 3.74 Mbps | 통과 | shots/scene-t1s.jpg "3.74 Mbps"; scene.html:54, :73 |
| 사실: 16 → 1.87 Mbps, 평균 24 → 2.8 Mbps | 통과 | scene.html:55-56, :83 (`tp(24).toFixed(1)`) |
| 사실: 반감 직후 처리량 절반 | 통과 | 화면에 값 없음, 틀린 진술 없음 (scene.html:83) |
| 생성 순서: 곡선이 시간순 왼→오 | 통과 | scene.html:23, :27-31 (t 오름차순) |
| 생성 순서: 손실이 cwnd 증가의 결과 (32에서 발생) | 통과 | scene.html:27 `[5, 32]` 뒤에 하락 |
| 생성 순서: ssthresh는 손실 전에 그려지지 않음 | 통과 | scene.html:48 (하락 전 `ss` 빈 배열), :45 (`answerVisual`에서만) |
| 생성 순서: 하락 후 기울기가 ssthresh에서 시작 (Reno) | 통과 | scene.html:27 (16에서 시작, +1) |
| 생성 순서: 독자가 하락 전 곡선을 보고 예측한 뒤 답 | 실패 | 예측 질문 문장이 shots/scene-t1s.jpg에 없음; scene.html:67, :40 (plot 높이 400) |
| 비트 1: 작은 cwnd에서 RTT마다 2배 | 통과 | shots/scene-t1s.jpg (0→5 RTT 지수 곡선) |
| 비트 2: 32에서 큐 차서 버려짐 신호 | 실패 | 질문 문장 "큐가 차서 패킷이 버려졌다"가 화면 밖 (shots/scene-t1s.jpg 하단 잘림) |
| 비트 3: 예측 질문과 선택지 (1, 16, 32) | 실패 | 선택지 카드가 shots/scene-t1s.jpg y≈718-735에서 잘림, 질문 미표시 |
| 비트 4: 답 16, ssthresh 정해짐 | 통과 (코드) | scene.html:81 `answer: "16"`, :82 `answerVisual`. 답 공개 상태 스크린샷 없음 |
| 비트 5: 완만한 선형 +1, 톱니 반복 | 통과 (코드) | scene.html:27-31 (32→16 하락 반복) |
| 비트 6: 처리량 약 3/4 | 통과 (코드) | scene.html:83, :84 |
| 화면 결함: 겹침 | 통과 | shots/scene-t1s.jpg (facts 카드와 그림 사이 겹침 없음) |
| 화면 결함: 잘림 | 실패 | 하단 선택지 카드 잘림 (shots/scene-t1s.jpg y≈718-735); audit "shrunk 78%" (shots/scene-audit.txt) |
| 화면 결함: 빈 프레임 | 통과 | 세 장 모두 내용 있음 |
| 화면 결함: 읽을 수 없는 글 | 통과 | 축 눈금이 작지만 읽힘 (shots/scene-t1s.jpg) |
| 화면 결함: 움직임 끝나지 않음/멈춤 | 통과 | 모션 코드 없음, 정지 장면 (scene.html:34-52) |

## 실패 요약

- F1 (잘림, 비트 2·3, 생성 순서 예측): 그림 높이 400이 화면을 넘쳐 질문과 선택지가 잘린다. 원인은 `plotFig`의 `height: 400` (scene.html:38). 답 공개 그림도 같은 함수를 쓰므로 함께 줄여 크기가 바뀌지 않게 한다.
- 실패 행 4개(예측 순서, 비트 2, 비트 3, 잘림)는 원인 하나(F1)에서 나온다.

## 권고 (고치지 않음)

- audit 권고 "장면1 shrunk 78%": 글을 줄이거나 장면을 나누라는 권고. 이번 고침 범위 밖.
- audit 권고 "lint no-signature": 그림이 주인공이지만 `layout:"full"`·`figure` 설정이 없다. 방향 기록이 없어 그대로 둔다.

## 고친 것

- F1 잘림: `plotFig`의 plot 높이 400 → 300 (scene.html:38). 답 공개 그림도 같은 함수라 함께 줄었다. 다시 audit은 "고침 0건"이나 "shrunk 78%" 권고는 그대로다. 스크린샷은 다시 찍지 않아 잘림 해소는 확인하지 못했다.
