# 검수: scene.html (review-2nd)

기준: storyboard.md 사실 점검표·생성 순서·비트, direction.md 최종 방향, 화면 결함.
스크린샷: scene-t1s·t4s·t8s.jpg. 세 장은 바이트 크기(97112)가 같아 모두 문제 상태 화면이다. 공개 상태 캡처가 없어 공개 움직임은 코드 위치로 판정한다.

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 점검: slow start 지수 10→20→40 (2 RTT) | 통과 | scene.html:21 PRE, scene-t1s.jpg 곡선 |
| 점검: 손실 후 ×0.5, 증가 +1 MSS/RTT | 통과 | scene.html:18 HALF=20, :22 ramp |
| 점검: 중복 ACK 손실 신호 | 통과 | scene.html:61 "중복 ACK 3개", scene-t1s.jpg |
| 점검: 단위·처리량 4.67 / 2.34 / 3.50 Mbit/s | 통과 | scene.html:24, :141, :147 LTT.expect |
| 점검: 20→40 복구 20 RTT | 통과 | scene.html:94 ramp(3,22), :97 |
| 점검: 톱니 평균 30 = 피크의 75% | 통과 | scene.html:101-102 |
| 점검: rwnd 평평한 지붕 (글로만 언급) | 통과 | scene.html:107 라벨, 사실 어긋남 없음 |
| 생성 순서: 손실 표식 → 감소 (t=2, 22, 42) | 통과 | scene.html:87, :95-96, :98-99 |
| 생성 순서: ssthresh는 손실 뒤에 생김 | 통과 | scene.html:88-91 (700ms, 손실 표식 뒤) |
| 생성 순서: 선형 +1은 지수 뒤 | 통과 | scene.html:94, :97 |
| 생성 순서: predict는 첫 손실 전까지 | 통과 | scene.html:65-72, scene-t1s.jpg |
| 비트 1: cwnd가 RTT마다 2배 | 통과 | scene-t1s.jpg 10→20→40 |
| 비트 2: 손실 직전 멈추고 "다음 곡선은?" | 통과 | scene-t1s.jpg 질문·선택지 |
| 비트 3: 절반에서 꺾여 직선 | 통과 | scene.html:96-97 (공개 캡처 없음, 코드 근거) |
| 비트 4: 같은 손실의 반복 톱니 | 통과 | scene.html:98-99 (두 번째 손실까지) |
| 비트 5: 톱니 vs 깊은 골 vs 평평한 지붕 | 실패 | 깊은 골은 scene.html:105 점선. 평평한 지붕은 그림 없이 라벨뿐(:107). 그림 추가는 방향 변경이라 고치지 않음 |
| 비트 6: 원인(손실률·RTT·rwnd)을 곡선으로 고르기 | 실패 | 장면에 진단 선택이 없음(scene.html:133-137은 다음 곡선 예측). 방향 밖이라 고치지 않음 |
| 방향: 병목 한계 40은 점선 | 실패 | scene.html:45 `dot: true`만 있어 scene-t1s.jpg에서 실선으로 보임 |
| 화면: 겹침 | 통과 | scene-t1s.jpg 라벨 간 충돌 없음 |
| 화면: 잘림 | 통과 | scene-t1s.jpg 축·축 라벨·병목 라벨 모두 보임 |
| 화면: 빈 프레임 | 통과 | scene-t1s.jpg 그림·선택지 채워짐 |
| 화면: 읽을 수 없는 글 | 통과 | scene-t1s.jpg |
| 화면: 움직임이 끝나지 않거나 멈춤 | 통과 | scene.html:110-117 run·isConnected 가드, 마지막 단계 900ms |

## 고친 것

- 방향: 병목 한계 40을 점선으로 — scene.html:45 `dash: true` 추가(`dot: true` 유지). audit 재실행 고침 0건.
- 고치지 않음: 비트 5(평평한 지붕 그림), 비트 6(진단 선택) — 방향 변경이 필요해 두었다.
