# 검수: TCP 혼잡 제어 (predict)

고치기 전 판정. 근거의 `scene.html:N`은 고치기 전 줄 번호다.

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 단위 cwnd=MSS, 시간=RTT, 처리량=cwnd×MSS÷RTT | 통과 | scene.html:38-39 축 라벨, :86-88 expect |
| 사실: slow start RTT당 ×2, 혼잡 회피 RTT당 +1 MSS | 통과 | scene.html:24 (0.1 RTT당 `2**0.1`, `+0.1`) |
| 사실: 3 dup ACK ×1/2, 타임아웃만 cwnd 1 | 통과 | scene.html:28 (반감만), :132 why 문구 |
| 사실: 손 계산 1,2,4,…,32, 5 RTT에 도달 | 통과 | scene.html:89 expect 첫 손실 5 RTT |
| 사실: 처리량 3.74 / 1.87 / 평균 2.8 Mbps | 통과 | scene.html:86-88 expect 값 3737600·1868800·2803200 |
| 사실: 반감 직후 처리량은 정확히 절반 | 통과 | scene.html:28 (32→16) |
| 생성 순서: 곡선이 시간순 왼쪽에서 오른쪽으로 그려짐 | 통과 | scene.html:68-77 play, :48-65 drawUntil |
| 생성 순서: 손실은 cwnd가 커진 결과로 나타남 | 통과 | scene.html:25-27 simulate |
| 생성 순서: ssthresh 선은 손실 시각 이후에만 생김 | 통과 | scene.html:64 `T >= T1`, t1s에 점선 없음 |
| 생성 순서: 하락 후 선형은 ssthresh(16)에서 시작 | 통과 | scene.html:54-58 (T1,32)→(T1,16) 수직 하락 |
| 비트 1: 작은 cwnd에서 RTT마다 2배, 가파르게 오름 | 통과 | scene-t1s.jpg 곡선 1→32 |
| 비트 2: 32 부근에서 손실 신호 | 통과 | scene-t1s.jpg 5 RTT 빨간 점 at 32 |
| 비트 3: 예측 질문과 선택지 1/16/32 | 실패 | scene-t1s/t4s/t8s.jpg: 선택지는 보이나 질문 문장("32 MSS에서 큐가 차서…")이 어디에도 없음 (scene.html:102) |
| 비트 4: 답 16, ssthresh가 그 값으로 정해짐 | 통과(코드) | scene.html:108 answer, :128-129; 답 화면 스크린샷 없음 |
| 비트 5: 선형 +1/RTT 톱니 | 통과(코드) | scene.html:24, :28 ca 구간; 답 화면 스크린샷 없음 |
| 비트 6: 처리량은 최고점의 약 3/4 | 통과(코드) | scene.html:129 legend, :134 takeaway; 답 화면 스크린샷 없음 |
| 화면: 겹침 | 통과 | scene-t1s.jpg 그림·카드·버튼 겹침 없음 |
| 화면: 잘림 | 통과 | scene-t1s.jpg 선택지 카드 글 전부 보임 (하단 경계는 판단 불확실) |
| 화면: 빈 프레임 | 통과 | scene-t1s/t4s/t8s.jpg 곡선과 축 있음 |
| 화면: 읽을 수 없는 글 | 통과 | 축·카드 글 읽힘. 78% 축소는 audit 권고 |
| 화면: 움직임이 끝나지 않거나 멈추는 곳 | 통과(코드) | scene.html:72-74 T1에서 정지, 답은 END에서 정지 |

요약: 실패 1건(비트 3, 질문 미표시). 원인은 질문 문장이 화면에 나오지 않는 것이므로 scene.html:102의 `question`을 보이는 자리에 둔다.

## 고친 것
- 비트 3 질문 미표시: predict `visual`의 안내 줄 아래에 질문 문장을 `<p>`로 붙였다(scene.html:121-124). 함께 차트 높이를 260→230으로 줄였다(scene.html:38). 재audit은 고침 0건. 단, audit이 shots/를 다시 찍지 않아 질문이 실제로 보이는지는 스크린샷으로 확인하지 못했다.
