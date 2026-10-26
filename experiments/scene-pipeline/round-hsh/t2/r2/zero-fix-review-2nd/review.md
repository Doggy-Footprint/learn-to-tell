# 검수: TCP 혼잡 제어 (predict)

대상: `scene.html` (장면 1, 손잡이 장면 아닌 mount 커스텀 장면, 예측 역할)
캡처: `shots/scene-t1s.jpg`, `shots/scene-t4s.jpg`, `shots/scene-t8s.jpg`. 정답 뒤 화면은 캡처에 없어 코드로 확인했다.

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 단위 MSS 통일 | 통과 | scene.html:93 "cwnd (MSS)", 세로 눈금 전부 MSS |
| 사실: slow start는 지수 ×2 | 통과 | scene.html:38 `2 ** r`, scene-t4s.jpg "slow start: RTT마다 ×2" |
| 사실: 감소 ×1/2, 증가 +1 MSS/RTT | 통과 | scene.html:40·42 `32 + (r-6)`, 139행 "이후 RTT마다 +1" |
| 사실: 처리량 ≈ cwnd×MSS/RTT | 통과 | scene.html:36 `mbps` |
| 사실: 손 계산 수치 (14.95, 11.2, 0.23) | 통과 | scene.html:153 최고점 표시 "15.0"(toFixed(1) 반올림, 스토리보드 14.95와 0.05 차이), 154 "11.2", 155 "0.23"; 166–168 `LTT.expect` 기대값 통과 |
| 사실: 32 RTT(1.6 s)로 32→64 복귀 | 통과 | scene.html:40, 140 "32 RTT(1.6 s) 걸려 다시 64" |
| 사실: 타임아웃 1→32 slow start 5 RTT | 통과 | scene.html:45 `tout` (RTT 6→11), 144행 "32까지 5 RTT" |
| 사실: 초기 윈도 예(10→20→40→80) | 통과 | scene.html:38 시작값 1, 화면은 1→64(RTT 6). 스토리보드가 "예"로 둔 범위, 초기값 표기 없음 |
| 사실: 중복 ACK 손실 vs 타임아웃 경로 나란히 | 통과 | scene.html:136·134 두 경로 모두 RTT 6에서 출발(코드 근거, 정답 뒤 캡처 없음) |
| 생성 순서: 손실 → ssthresh → cwnd 하강 | 통과 | scene.html:112–116 손실 X(scene-t4s.jpg), 129–131 ssthresh 선(정답 뒤), 136–138 하강 |
| 생성 순서: slow start 곡선이 ssthresh 갱신 이전 | 통과 | scene.html:107–109 slow start 먼저 그림(scene-t1s.jpg, scene-t4s.jpg) |
| 생성 순서: 증가 완만, 감소 순간 | 통과 | scene.html:45·136 감소는 수직 한 점 이동, 증가는 X 8.95px/RTT 대비 Y 4.03px/MSS |
| 비트 1: slow start 구간 RTT마다 2배 | 통과 | scene-t4s.jpg 점과 라벨 "slow start: RTT마다 ×2" |
| 비트 2: cwnd 64 손실, 예측 질문 | 통과 | scene-t4s.jpg X 표시와 "RTT 6: cwnd 64에서 패킷 손실", 선택지 1/32/48 |
| 비트 3: 중복 ACK 32 반감, 타임아웃 1 | 통과 | scene.html:127–128 정답·오답 설명, 144 타임아웃 문구 (정답 뒤 캡처 없음) |
| 비트 4: 반감 후 완만한 기울기 | 통과 | scene.html:139–140 |
| 비트 5: 톱니 평균 약 75% | 통과 | scene.html:149–150 "평균 48 (75%)", 점선 y=48 |
| 비트 6: 진단 판단 | 통과 | scene.html:156 진단 문장과 "모델로 계산한 예시" 태그 |
| 화면: 겹침 | 통과 | scene-t4s.jpg 라벨 "RTT 6…"과 "병목 한계" 분리. 정답 뒤 라벨(150·139·144)도 좌표상 겹치지 않음 |
| 화면: 잘림 | 통과 | scene-t4s.jpg 우측 "병목 한계 = BDP + 큐 (64)" 끝까지 보임(X(76)) |
| 화면: 빈 프레임 | 통과 | scene-t1s.jpg는 slow start 그리는 중간 상태(의도된 드로잉) |
| 화면: 읽을 수 없는 글 | 통과 | scene-t1s.jpg 하단 y≈735의 흐린 한 줄은 판독 불가, 다른 캡처에는 없음. 재캡처로 확인 권장(고치지 않음) |
| 화면: 멈춤·끝나지 않는 움직임 | 통과 | 선택 대기는 의도된 정지. 정답 뒤 "다시 예측" 버튼(158행), leave에서 token 증가로 정지(162행) |
| 참고: audit 권고 78% 축소 | 통과(권고) | shots/scene-audit.txt 권고 2건, 고침 0건. 권고는 그대로 둠 |
| 참고: `#ltt-checks` 없음 | 통과(검수 범위 밖) | shots/index.txt의 checks 행. 검수 기준에 없고 API.md에도 없어 추가하지 않음 |

## 고친 것
- 없음. 실패 항목 0건이라 `scene.html`은 바꾸지 않았다. audit은 1회 실행, 고침 0건.
