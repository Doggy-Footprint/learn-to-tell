# 검수: TCP 혼잡 제어 (predict)

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 단위 (cwnd=MSS, 시간=RTT, 처리량=cwnd×MSS÷RTT) | 통과 | scene.html:100 sub, :85–87 expect |
| 사실: slow start RTT당 ×2, 혼잡 회피 RTT당 +1 MSS | 통과 | scene.html:24 (`2 ** 0.1` per 0.1 RTT, `c + 0.1`) |
| 사실: 3 dup ACK이면 ×1/2, RTO만 cwnd=1 | 통과 | scene.html:131 why |
| 사실: 손 계산 3,737,600 / 1,868,800 / 2,803,200 bps | 통과 | scene.html:85–87 expect 값과 식 일치 |
| 사실: 첫 손실 5 RTT, 반감 값 16 | 통과 | scene.html:88 expect, :28 (`PEAK / 2`), t4s 손실 점 위치 |
| 생성 순서: 곡선은 시간순, 손실은 cwnd 32 도달의 결과 | 통과 | scene.html:20–30 simulate, :49–60 drawUntil |
| 생성 순서: ssthresh는 손실 시각부터 생긴다 | 통과 | scene.html:63 (`T >= T1`) |
| 생성 순서: 하락 전에 절반선이 없다 | 통과 | scene.html:63 (선은 T1 이후에만 set), t1s에 점선 없음 |
| 비트 1: 작은 cwnd에서 RTT마다 2배, 가파르게 오른다 | 통과 | scene-t1s.jpg, scene-t4s.jpg (0→5 RTT 지수 곡선) |
| 비트 2: 32에 이르러 손실 신호, 손실 점 | 통과 | scene-t4s.jpg, scene-t8s.jpg (5 RTT, 32에 빨간 점) |
| 비트 3: 예측 순간에는 손실 뒤 값을 보이지 않는다 | 실패 | scene-t4s.jpg, scene-t8s.jpg: 질문 단계인데 5 RTT에서 32→16 빨간 수직선이 이미 보인다. scene.html:50 `p[0] <= T`가 손실 시각의 16 점(:29)을 포함해 정답이 노출됨 |
| 비트 4: 답 16으로 반감, 그때 ssthresh 점선이 생긴다 | 통과 | scene.html:127 play(…, true), :63. 답 단계 캡처는 없어 코드로 확인 |
| 비트 5: 이후 기울기가 완만한 선형, RTT당 +1, 톱니 | 통과 | scene.html:24 (ca 구간), :51–60. 답 단계 캡처 없음 |
| 비트 6: 처리량이 최고점의 약 3/4, 손실이 잦으면 낮아짐 | 통과 | scene.html:128 legend, :133 takeaway |
| 화면: 겹침 | 통과 | scene-t1s.jpg: 사실 카드, 플롯, 선택지 사이 겹침 없음 |
| 화면: 잘림 | 통과 | scene-t1s.jpg: 선택지 카드 하단이 하단 이동 버튼 위에 있음 |
| 화면: 빈 프레임 | 통과 | scene-t1s.jpg는 재생 중 상태, scene-t4s.jpg는 손실 상태. 빈 프레임 없음 |
| 화면: 읽을 수 없는 글 | 통과 | scene-t1s.jpg: 축 눈금·라벨 읽힘. 범례는 kit 기본 `ltt-basis` 크기 |
| 화면: 움직임이 끝나지 않거나 멈추는 곳 | 통과 | scene.html:118 predict는 T1에서 멈춤, :127 답은 40 RTT에서 끝남 |
| 권고: 장면이 78%로 축소, no-signature 린트 | 권고 | shots/scene-audit.txt 권고 2건. 이번 라운드에서는 고치지 않음 |

요약: 실패 1건(비트 3, 예측 전 정답 노출). 고칠 곳은 scene.html:50 한 줄.

## 고친 것
- 비트 3: `drawUntil`의 필터를 바꿔 예측 단계에서는 손실 시각의 16 점을 그리지 않는다. 답 단계에서는 그대로 그린다. 고친 뒤 이 줄은 scene.html:51로 옮겨졌다(앞에 주석 1줄 추가).
- audit 1회 실행: 고침 0건(권고 2건은 그대로 둠). audit은 정답 노출을 잡지 못하므로, 이 수정은 코드 읽기로 확인했다(예측 단계 마지막 프레임 T=5에서 `[5, 16, "ca"]`는 제외되고 `[5, 32, "ss"]`는 포함된다).
