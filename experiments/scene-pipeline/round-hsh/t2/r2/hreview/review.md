# 검수: TCP 혼잡 제어 predict 장면

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 단위 한 가지로 통일(MSS 권장) | 실패 | y축·facts·선택지·why는 "세그먼트", takeaway만 `{{MSS}}`를 개수 단위로 씀. glossary의 MSS는 바이트 정의라 충돌 (scene.html:98-101, 90) |
| 사실: slow start 명칭·지수 증가 | 실패 | "slow start"가 화면 글 어디에도 없다. 구간 이름 없음 (shots/scene-t4s.jpg, scene.html:75) |
| 사실: 손 계산 값 (1460 B, 50 ms, 64, 32, 1.6 s) | 통과 | facts 칸 1460 B·50 ms·64개 (scene-t1s.jpg), why 32 RTT·1.6 s (scene.html:20, 87) |
| 사실: 처리량 ≈ cwnd×MSS/RTT | 통과 | 화면에 수식 없음, 틀린 수치 없음 |
| 사실: 감소 ×1/2, 증가 +1/RTT, 타임아웃 1 | 통과 | SSTH=32, DUP 33→64, TO 1 (scene.html:22-24) |
| 흔한 오해 깨는 순간: 두 경로 같은 손실 시점 | 통과 | DUP·TO 모두 (3,64)에서 출발 (scene.html:23-24) |
| 생성 순서: 손실→ssthresh→하강 | 통과 | answerVisual pre→loss→ssth→dup→to 순차 (scene.html:79-85) |
| 비트 1: slow start RTT마다 2배 | 통과 | PRE 10→20→40, 3에서 64 캡 (scene-t1s.jpg) |
| 비트 2: 예측 지점 cwnd 64에서 손실 | 통과 | 점선 손실선 x=3 (scene-t4s.jpg). 세로 범위 문제는 겹침 항목 참고 |
| 비트 3: 중복 ACK 32, 타임아웃 1 | 통과 | 코드 확인(answerVisual). audit은 정답 화면을 캡처하지 않아 화면 확인은 못 함 |
| 비트 4: 반감 후 완만한 기울기 | 통과 | DUP 33→64가 32 RTT (scene.html:23) |
| 비트 5: 톱니 반복, 평균 75% | 실패 | 톱니가 한 번만 그려진다. 반복 없음. 방향 밖이라 보류 |
| 비트 6: 진단 판단(32↔64 정상, 1까지 무너짐 위험) | 실패 | 화면에 없음. 방향 밖이라 보류 |
| 화면: cwnd 시계열·ssthresh·손실 시점·병목 한계 | 통과 | scene-t1s.jpg(한계 64), scene-t4s.jpg(손실선) |
| 화면: 구간 구분 | 실패 | 구간 경계 표시 없음. 범례에도 구간 이름 없음 |
| 방향: 질문 화면 손실선 `?` 표시 | 실패 | 점선만 있고 `?` 없음 (scene.html:54, 21). 위치 계산 근거가 없어 보류 |
| 방향: x축 0–44 | 실패 | x:[0,40] 사용 (scene.html:27, 19, 22) |
| 방향: sub에 {{cwnd}}·{{RTT}} 풀이 | 실패(보류) | sub에 `{{}}`가 없음 (scene.html:41). `{{}}`를 넣으니 predict-new-term 고침 2건이 떠서 되돌림. 한 장면 덱이라 앞에서 풀 곳이 없음 |
| 결함: 겹침 | 실패 | 손실선이 y=72까지 올라가 y축 라벨 "한 번에 보내는 세그먼트 수"를 가른다 (scene-t4s.jpg, scene-t8s.jpg, scene.html:21) |
| 결함: 잘림·빈 프레임·읽을 수 없는 글 | 통과 | t1s·t4s·t8s 모두 프레임 완전. 정답 화면 글은 audit 미캡처 |
| 결함: 움직임이 끝나지 않거나 멈춤 | 통과 | grow는 유한 배열 순차 재생 (scene.html:33-35, 79-85) |

판정 요약: 실패 8 중 고침 4, 보류 4(비트 5·6, `?` 표시, sub 풀이).

## 고친 것
- 단위 통일: takeaway의 `{{MSS}}`를 "세그먼트"로 바꿈. glossary MSS는 바이트 정의라 개수 단위와 충돌했음.
- slow start·구간: 범례에 "구간: slow start → 혼잡 회피"를 추가. 구간 경계는 그리지 않아 글로만 명명함.
- x축: x 범위 40→44, LIMIT·SSTH 끝점도 44로(방향 x 0–44).
- 겹침: 손실선 끝 y=72→64로 낮춰 y축 라벨과 겹치지 않게 함.
- 되돌림: sub에 `{{cwnd}}`·`{{RTT}}`를 넣었다가 predict-new-term 고침 2건이 떠서 원래 문장으로 복구.
- 남은 권고: unused-term `MSS`(takeaway에서 뺀 탓), shrunk 78%, no-signature. 고침 0건.
- 검증 한계: audit 실행 뒤 shots/ 스크린샷이 갱신되지 않아(00:42 시각 그대로) 겹침·축 변경은 코드로만 확인했다.
