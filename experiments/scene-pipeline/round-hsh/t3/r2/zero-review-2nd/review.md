# 검수: Raft 합의 (overview, 장면 1)

기준: storyboard.md, direction.md(작성자 방향 기록 없음), shots/ 기본 화면 10장 (1280x800 기준).

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 과반수 = ⌊5/2⌋+1 = 3 | 통과 | scene.html:78, shots/scene-step3.jpg 「표 3/5 ≥ 과반수 3」 |
| 사실: 3대 장애 시 선출·커밋 멈춤 | 통과 | scene.html:161 하단 캡션 |
| 사실: 짝수 대수(4대) 이득 없음 | 통과 | 화면에 없음, 어긋나는 진술 없음 |
| 사실: 예 S1 term3, index 7을 S1·S2·S3에 저장 → 3/5 커밋, S4·S5 없어도 됨 | 통과 | shots/scene-step6.jpg (S4·S5 칸은 5·6만) |
| 사실: 한 term에 리더 최대 한 명, 표는 term당 한 장 | 통과 | shots/scene-step2.jpg, scene-step3.jpg |
| 사실: 높은 term을 보면 리더 강등, 커밋 항목 보존, 무작위 timeout | 통과 | 화면에 없음, 어긋나는 진술 없음 |
| 흔한 오해: 리더 기록 직후는 미커밋, 3/5에서 커밋, S4 장애여도 커밋 | 통과 | shots/scene-step5.jpg (S1 7·t3 회색), scene-step6.jpg (S1 초록, S4 ✕ 장애) |
| 생성 순서: term 증가·자기 투표 → RequestVote | 통과 | scene-step1.jpg(term 2) → scene-step2.jpg(term 3, RequestVote) |
| 생성 순서: 표 3/5 → 리더 확정 → heartbeat | 통과 | scene-step3.jpg(후보) → scene-step4.jpg(리더) |
| 생성 순서: 리더 로그 미커밋 → 복제 → 과반 확인 → 커밋 | 통과 | scene-step5.jpg → scene-step6.jpg |
| 생성 순서: 팔로워 커밋이 리더보다 한 박자 늦음 | 통과 | scene-step6.jpg(S2·S3 회색) → scene-step7.jpg(S2·S3 초록) |
| 비트1: timer 종료 → 후보 | 통과 | 타이머 자체는 안 그려짐. scene-step1.jpg 캡션 ①이 전달 |
| 비트2: 표 3/5로 리더 | 통과 | scene-step3.jpg 「표 3/5 ≥ 과반수 3」 |
| 비트3: heartbeat로 나머지는 조용한 팔로워 | 통과 | scene-step4.jpg 「heartbeat」, 팔로워 term 3 |
| 비트4: 클라이언트 요청은 리더 로그에 미커밋으로 먼저 | 통과 | scene-step5.jpg 「클라이언트: x=7 저장」 |
| 비트5: 3/5 복제에서 커밋, S4 장애여도 진행 | 통과 | scene-step6.jpg 「✕ 장애」, 「저장 3/5 ≥ 3 → 커밋」 |
| 비트6: 과반수 못 모으면 멈춤(가용성 양보) | 통과 | scene.html:161 캡션 |
| 화면 결함: 읽을 수 없는 글 | 실패 | scene-t1s.jpg의 「term 2 · 팔로워」, 범례 「미커밋/커밋」, 「과반수 = …」이 화면에서 8–10px. scene.html:55, 72, 75, 78, 85, 88, 92 |
| 화면 결함: 강조 링이 서버 박스와 어긋남 | 실패 | scene-step4.jpg ~ scene-step7.jpg: S1 파란 링이 박스보다 왼쪽·위로 치움. scene.html:54 (원인 미확인, 고치지 못함) |
| 화면 결함: 칸(5·t2 등)이 서버 박스 아래 테두리와 겹침 | 실패 | scene-t1s.jpg S1·S2 칸이 박스 하단선과 겹침. scene.html:61 (원인 미확인, 고치지 못함) |
| 화면 결함: 단계마다 그림 크기와 제목 위치가 바뀜 | 실패 | scene-step1.jpg 제목 y≈70, step2 ≈105, step3 ≈140; 그림 폭 약 600→430px. 원인 미확인, 고치지 못함 |
| 화면 결함: 움직임이 끝나지 않거나 멈춤 | 통과 | 패킷은 단계마다 1회, 자막·반복 재생 버튼 정상 |
| audit 고침: lint overview-order | 통과 | 이번 audit 실행에서 나오지 않음(고침 0건). shots/scene-audit.txt는 이전 결과로 보이며 장면 순서는 바꾸지 않았다 |
| audit 권고: 장면 축소 78–86%, 그림 22% | 권고 | 권고라 그대로 둠 |

## 고친 것
- 가독성: 라벨·칸 제목·범례·과반수 글자 크기를 키움(scene.html:55, 72, 75, 78, 85, 88, 92). 칸 번호(5·t2)는 칸 폭 때문에 그대로 둠.
