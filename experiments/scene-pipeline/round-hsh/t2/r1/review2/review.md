# 검수: scene.html (TCP 혼잡 제어, predict)

## 사실 점검표 (storyboard.md)
| 항목 | 판정 | 근거 |
| --- | --- | --- |
| slow start 지수: 10→20→40 | 통과 | scene.html:21 |
| 손실 후 ×0.5, 이후 +1 MSS/RTT | 통과 | scene.html:21-22 (40→20, 18+t) |
| 중복 ACK: cwnd = cwnd/2 | 통과 | scene.html:21, 73-75 |
| 타임아웃: 1 MSS부터 slow start | 통과 | scene.html:28 TIMEOUT |
| 단위: 처리량 = cwnd×MSS×8 / RTT (bit/s) | 실패 | scene.html:115 takeaway에 ×8, bit/s 없음 |
| 손 계산 (4.67, 2.34 Mbit/s 등) | 실패 | scene.html:114 why에 계산 없음. basis(117)는 가정만 |

## 생성 순서
| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 시간순 성장: 손실 → 낙하 → ssthresh 생성 | 통과 | scene.html:43, 68-75 |
| ssthresh는 처음부터 없음 | 통과 | scene.html:73 (손실 뒤 t=2, v=20에서만 생성) |
| 선형 기울기 RTT당 +1 | 통과 | scene.html:22 |
| predict: 첫 손실까지만 먼저 | 통과 | scene.html:105 full.slice(0, 3) |

## 비트
| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 1. RTT마다 2배 | 통과 | scene-t1s.jpg 파란 선 10→20→40 |
| 2. 첫 손실 직전 멈춤, "다음 곡선은?" | 실패 | scene-t1s.jpg: 손실 점, "손실" 라벨, "첫 손실 뒤 곡선은?" 안 보임. 원인: scene.html:50 `el.querySelector("svg")`가 facts 아이콘 SVG를 잡음 |
| 3. 절반에서 꺾여 선형 | 통과 (코드) | scene.html:21-22, 73-75. 정답 상태 스크린샷 없음 |
| 4. 톱니 반복, 평균 75% | 통과 (코드) | scene.html:26 LOSS(2, 22, 42), 59-60 평균 30. 정답 상태 스크린샷 없음 |
| 5. 진단 비교: 톱니 / 타임아웃 골 / rwnd 지붕 | 실패 | 타임아웃 골 있음(28, 61). rwnd 평평한 지붕 없음. direction 최종 비트에도 없음 → 방향 변경이라 고치지 않음 |
| 6. 처리량 원인 고르기 | 통과 | scene.html:98, 107-111 |

## 화면 결함
| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 구간 구분(slow start, 선형) 라벨 | 실패 | scene.html:48-63에 구간 라벨 없음 |
| 손실 표식과 "손실" 라벨 | 실패 | scene-t1s.jpg: 2 지점에 빨간 점 없음. 위 비트 2와 같은 원인 |
| "병목 한계 40 MSS" 라벨 | 실패 | scene-t1s.jpg: 40선만 있고 글 없음. 같은 원인 |
| 선택지 잘림 | 실패 | scene-t1s.jpg 하단 y 668–735: 카드 둘째 줄과 아래가 잘림. 그림 높이 scene.html:46 (250) |
| 겹침 | 통과 | scene-t1s.jpg 겹침 없음. 정답 상태 평균 라벨은 곡선 t≈13–14와 닿을 수 있음(권고, 화면 미검증) |
| 움직임이 멈추는 곳 | 통과 | 질문 상태에서 곡선이 손실 점에서 멈춤 (의도) |
| 글 읽기 | 통과 | scene-t1s.jpg 제목, sub, 질문 글 판독 가능 |

## 고친 것
- 처리량 단위: takeaway에 ×8, bit/s 추가 (scene.html:115)
- 손 계산: why에 4.67(40 MSS), 2.34(20 MSS) Mbit/s 추가 (scene.html:114)
- 손실 표식, "첫 손실 뒤 곡선은?" 라벨 안 보임: trace()가 facts 아이콘 SVG를 잡던 문제를 그림 전용 div로 분리 (scene.html:44-50)
- "병목 한계 40 MSS" 라벨 안 보임: 같은 원인으로 해결 (scene.html:51-53)
- 선택지 잘림: 그림 높이 250→200 (scene.html:46)
- 구간 구분 라벨: "slow start (지수)", "congestion avoidance (선형)" 추가 (scene.html:54-55)
- 미수정: 비트 5의 rwnd 평평한 지붕 대비. direction 최종 비트에 없어 방향 변경이 필요함
- 검증 한계: audit 3회 모두 "고침 0건"이었고 scene-t1s.jpg가 갱신되지 않아 수정 화면은 눈으로 확인하지 못함
