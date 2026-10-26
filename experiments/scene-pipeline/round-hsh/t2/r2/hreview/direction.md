# direction: TCP 혼잡 제어 predict 장면

## 1. 초안 점검

- **a.html**: `trace()` 하나로 base(slow start)·rto를 먼저 `set`하고, 중복 ACK 곡선만 `tick`으로 RTT마다 60 ms씩 그린다. 질문 화면은 `LTT.facts`만 있어 곡선이 없다. 생성 순서가 어긋난다. 손실 표시선과 ssthresh 선이 없고, 중복 ACK 곡선만 움직인다. audit은 82%/78% 축소와 no-signature 권고뿐, 고침 0.
- **b.html**: `SLOW_START`·`DUP_ACK`·`TIMEOUT` 배열을 `cwndPlot`에 한 번에 넣는다. 움직임이 없고 생성 순서도 없다. sub에 `{{cwnd}}`·`{{MSS}}`·`{{RTT}}`를 풀어 둔 점은 좋다. 그러나 질문 화면의 조건 카드에 cwnd·MSS·RTT가 풀이 없이 나와 lint 고침 6건(두 크기 × 3용어). 질문 화면에 손실 직전 궤적이 없다.
- **c.html**: 생성 순서를 가장 잘 따른다. slow start → 손실선(`loss`) → ssthresh 선(`ssth`) → 중복 ACK 하강·복귀(`dup`) → 타임아웃 경로(`to`)를 단계마다 그린다. 질문 화면에도 slow start 궤적과 병목 한계선(64)이 보인다. `LTT.MOTION_MS`로 모션을 끈다. audit은 축소 권고와 no-signature뿐, 고침 0. 단점은 ssthresh 선에 이름이 없고, 손실 전후 시점을 가르는 라벨이 없다는 것이다.
- **d.html**: 단계 순서(pre → ss → dup → to)는 맞고 `grow`를 `await`로 이어 붙였다. 질문 화면은 `facts`만 있다. `PRE`가 2.7 RTT에 40→64로 올라 slow start의 배가 깨진다(0.7 RTT에 1.6배). 범례를 `ltt-basis` 긴 문단으로 적어 글이 그림을 누른다. audit 고침 0, 축소 86%/80%.

## 2. 가져올 것

- 생성 순서 모션과 질문 화면의 궤적: **c**의 단계 배열(`STEPS`)과 `play`식 순차 재생, 질문 화면에 slow start·한계선을 두는 구성.
- 정수 RTT 시각과 slow start 배가 맞는 값: **a**·**c**의 `[[0,10],[1,20],[2,40],[3,64]]`.
- 풀이 달린 sub: **b**의 `{{cwnd}}`·`{{MSS}}`·`{{RTT}}`를 sub에 두어 처음 나온 장면에서 풀이.
- 축소 방지: 범례 글을 줄이고 `why`·`basis`를 짧게.
- 모션 게이트: **a**의 `LTT.MOTION_MS` 조건 분기(reduced-motion이면 최종 상태).

## 3. 최종 방향

그림의 뼈대는 한 장의 cwnd(MSS) 대 RTT 번호 플롯(x 0–44, y 0–72)이다. 점선 수평선 64가 병목 한계(BDP+큐)다. 질문 화면(`visual`)은 slow start 곡선만 보인다. 정수 RTT마다 10→20→40→64로 그리고, 3에서 손실 표시를 점선 `?`로 둔다. 조건 카드는 "1460 B"(세그먼트 크기)·"50 ms"(왕복 시간)·"64 MSS"(손실 직전)를 보인다.

비트는 생성 순서대로 공개 뒤(`answerVisual`)에 나타난다. (1) 손실선이 RTT 3에 수직으로 생긴다. (2) ssthresh 점선이 32에 생긴다(손실 시점 cwnd의 절반). (3) 중복 ACK 경로(실선, accent)가 64에서 32로 수직 하강하고, RTT마다 +1씩 35에서 64까지 오른다. (4) 타임아웃 경로(긴 점선, bad)가 같은 손실 시점에서 1로 떨어지고 2·4·8·16·32로 slow start 재상승한다. 두 경로의 차이를 한 화면에서 비교하도록 같은 축에 둔다. 조작은 없다. 질문 선택지 세 개를 고르고 공개한다.

화면에 얹을 글: 제목 "손실 직후 cwnd는 어디로 떨어질까". sub는 {{cwnd}}·{{MSS}}·{{RTT}}를 풀어 쓴다. 질문은 "중복 ACK 3개로 손실을 알았다. 손실 직후 송신 윈도는?", 선택지는 "1 MSS", "32 MSS", "64 MSS 그대로". 정답 해설 `why`는 중복 ACK는 절반, 타임아웃만 1, 그 뒤 RTT마다 +1 MSS로 64까지 32 RTT(약 1.6 s)라는 점을 적는다. 근거 `basis`는 MSS 1460 B, RTT 50 ms, Reno 가정이다. 요약 `takeaway`는 "손실이 나면 cwnd는 절반으로 줄고(타임아웃이면 1), 그 뒤 RTT마다 1 MSS씩 느리게 오른다"다.
