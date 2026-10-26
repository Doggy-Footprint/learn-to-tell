# 검수: TCP 혼잡 제어 (predict)

스크린샷은 질문 상태(t1s·t4s·t8s)뿐이다. 정답 공개 상태는 코드 좌표로 확인했고, 근거에 그렇게 적었다.

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 단위 (cwnd MSS, 시간 RTT) | 통과 | scene-t1s.jpg 축 라벨 "cwnd (MSS)", "시간 (RTT, 100 ms)" |
| 사실: slow start ×2 와 CA +1 MSS를 바꿔 쓰지 않음 | 통과 | scene-t1s.jpg "slow start: RTT마다 ×2"; scene.html:65 "+1 MSS / RTT" |
| 사실: 3 dup ACK는 ×1/2, RTO만 1로 | 통과 | scene.html:60-72 half·rto 분기; 라벨 "×1/2", "타임아웃(RTO)일 때만 1로 돌아간다" |
| 사실: 손 계산 (32→16, 평균 24, 2.8 Mbps) | 통과 | scene.html:42, 64 thrMbps(24) = 2.8; why(:94)의 3.74 Mbps와 일치 |
| 사실: 반감 뒤 선형은 16 RTT에 16 MSS | 통과 | scene.html:61 점열 (5,16)→(21,32) |
| 생성 순서: 곡선은 좌→우 시간순 | 통과 | scene.html:52 cwdraw 2.2s, forwards |
| 생성 순서: ssthresh는 손실 전에 없음 | 통과 | scene-t1s/t4s/t8s 질문 상태에 절반선 없음; ssthresh 선은 half 분기에서만 |
| 생성 순서: 하락 전에 ×1/2 표지가 보임 | 실패 | scene.html:66 `×1/2` 텍스트에 애니메이션 없음, 답 공개 즉시 표시 (곡선 하강 전) |
| 생성 순서: 하락 전에 +1 MSS/RTT 표지가 보임 | 실패 | scene.html:65 `+1 MSS / RTT` 텍스트에 애니메이션 없음, 상승 전에 표시 |
| 비트 1: 작은 cwnd에서 RTT마다 2배, 가파름 | 통과 | scene-t4s.jpg 1→32 곡선, "RTT마다 ×2" |
| 비트 2: 32에서 손실 신호 | 통과 | scene-t4s.jpg "cwnd 32에서 패킷 손실 (dup ACK 3개)". "큐가 찬다"는 설명은 question 문장에만 있고 화면에 안 보임 (권고) |
| 비트 3: 예측 질문과 선택지 | 통과 | scene-t1s.jpg "손실 직후 cwnd는 어디로?", 선택지 1·16·32 |
| 비트 4: 16으로 반감, ssthresh 확정 | 통과 | scene.html:61-64 ssthresh = 16 "손실 순간에 정해짐" (정답 공개 상태, 코드 확인) |
| 비트 5: 완만한 선형, 톱니 | 통과 | scene.html:61 16↔32 톱니, 기울기 +1 |
| 비트 6: 평균 처리량 약 3/4 | 통과 | scene.html:64 "평균 cwnd ≈ 24 → 2.8 Mbps (최고점의 3/4)". "손실이 잦으면 톱니가 낮아짐"은 화면에 없음 (권고) |
| 화면: 겹침 — ×1/2 과 평균 24 점선 | 실패 | scene.html:66 텍스트 기준선이 sy(24)에 있어 점선 위에 얹힘 |
| 화면: 겹침 — 평균 라벨과 톱니 선 | 실패 | scene.html:64 우측 정렬 라벨(약 20 RTT 폭)이 t=21 하강, t=21–37 상승, t=37 하강과 교차 (좌표 계산) |
| 화면: 잘림 | 통과 | scene-t1s/t4s/t8s 모두 프레임 안 |
| 화면: 빈 프레임 | 통과 | 세 장 모두 곡선과 질문 보임 |
| 화면: 읽을 수 없는 글 | 통과 (권고) | 축 눈금 13px를 760px 뷰박스에서 축소해 약 9px. audit "장면1 shrunk 78%" 권고 그대로 둠 |
| 화면: 움직임이 끝나지 않거나 멈춤 | 통과 | draw·pop 모두 forwards로 끝남; scene.html:31 reduced-motion 최종 상태 처리 |

## 고친 것

- 생성 순서 (×1/2): scene.html:66 표지에 pop2 애니메이션을 0.4s 지연으로 붙여 하강 뒤에 나타나게 함.
- 생성 순서 (+1 MSS / RTT): scene.html:65 표지에 pop2 애니메이션을 0.75s 지연으로 붙여 상승 뒤에 나타나게 함.
- 겹침 (×1/2 과 평균 점선): scene.html:66 기준선 위로 6px 올려 점선과 겹치지 않게 함.
- 겹침 (평균 라벨과 톱니): scene.html:64 라벨에 배경색 halo(paint-order stroke)를 줘 선 위에서도 읽히게 함.
