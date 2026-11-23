# 검수: TCP 혼잡 제어 predict 장면 (scene.html)

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: cwnd 단위 MSS 통일 | 통과 | scene.html:29 y축 "cwnd (MSS)"; scene-t1s.jpg 좌상단 |
| 사실: slow start는 지수 증가 | 통과 | scene-t1s.jpg 곡선 10→20→40→64; sub "두 배로 올라" |
| 사실: 감소 ×1/2, 증가 +1 MSS/RTT | 통과 | scene.html:22 `32 + k`; why "+1 MSS" |
| 사실: 처리량 ≈ cwnd×MSS/RTT, 실제는 rwnd와 min | 실패 | scene.html:87 basis에 rwnd 단서 없음 |
| 사실: 손 계산 (64→32, 32 RTT≈1.6 s, 1→32는 5 RTT) | 통과 | scene.html:86 "32 RTT, 약 1.6 s"; scene.html:24 1→32 5단계. Mbit/s 값은 화면에 없음(선택 항목) |
| 사실: 손 계산 (75%, 0.23 Mbit/s) | 실패 | 75%가 화면·글 어디에도 없음 (scene.html:86) |
| 생성 순서: 손실 → ssthresh → cwnd 하강 | 통과 | scene.html:82(500ms ssthresh), :83(1100ms dup), :84(3600ms timeout); 손실점은 질문 단계(scene-t1s.jpg) |
| 생성 순서: slow start 곡선이 ssthresh 이전 | 통과 | scene-t1s.jpg에 공개 전부터 곡선 존재 |
| 비트 1: slow start가 RTT마다 2배 | 통과 | scene-t1s.jpg 회색 곡선 |
| 비트 2: cwnd 64에서 손실, 예측 | 통과 | scene-t1s.jpg RTT 3, 64 빨간 점; 선택지 3개 |
| 비트 3: 공개 시 32로 반감, ssthresh 32 | 통과(코드) | scene.html:78-83. 스크린샷은 공개 전 상태만 있음 |
| 비트 4: 반감 후 완만한 기울기, 32 RTT | 통과(코드) | scene.html:22, :83 (32→64, RTT 4~36) |
| 비트 5: 톱니 반복, 평균 75% | 실패 | 톱니 1개만 그림 (scene.html:22); why에 75% 없음 |
| 비트 6: 진단 판단(32↔64 정상 / 1 잦으면 원인) | 실패 | 화면에 없음. takeaway·why 어디에도 없음 |
| 화면: 질문 문장 | 실패 | scene-t1s.jpg: sub와 플롯 사이, 선택지 위에 question 텍스트 없음 (scene.html:58) |
| 화면: "정답 보기" 버튼 | 실패 | scene-t1s/t4s/t8s.jpg 하단 y≈727, 버튼 글자가 반쯤 잘림. 콘텐츠가 넘쳐 78%로 축소됨 |
| 화면: 읽을 수 없는 글 | 통과 | sub·힌트 글자는 작지만 읽힘 |
| 화면: 빈 프레임 | 통과 | 세 장 모두 플롯·선택지가 채워짐 |
| 화면: 겹침 | 통과 | 축 라벨·점선·빨간 점 겹침 없음 |
| 화면: 움직임이 멈추거나 끝나지 않음 | 통과 | 공개 전엔 움직임 없음 (세 장 동일) |
| 캡처: 1s·4s·8s | 권고 | 세 파일 크기 90598 B로 동일, 공개 상태 미캡처. 장면 결함 아님 |

## 판정 요약
- 실패 6행: rwnd 단서, 75% 손 계산, 비트 5, 비트 6, 질문 문장, 정답 보기 잘림.
- 고침 대상은 위 실패 행 전부. 톱니 반복과 진단 판단을 그림으로 넣으려면 x축(0~44)을 바꿔야 하므로 이번엔 텍스트로만 보강한다.

## 고친 것
- 사실: 처리량 basis에 rwnd와의 최솟값 단서 추가 (scene.html basis).
- 사실·비트 5: why에 "톱니 평균은 최고점의 약 75%" 추가 (scene.html why). 톱니 반복 그림은 아직 없음.
- 비트 6: takeaway를 한 문장으로 바꿔 타임아웃 잦음 = 처리량 저하 원인 명시 (scene.html takeaway). 그림 근거는 아직 없음.
- 화면 잘림: 플롯 높이 330 → 280 (scene.html cwndPlot). audit 뒤에도 78% 축소는 그대로.
- 미해결: 질문 문장 미표시 원인 불명(kit의 predict 렌더링은 확인 불가, 경로 제약).
