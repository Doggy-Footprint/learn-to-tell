# 검수: Raft 합의 overview 장면

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 과반수 = floor(N/2)+1, N=5면 3 | 통과 | scene.html:225 basis, scene-step3 "3/5 과반수" |
| 사실: 5대는 2대 장애까지 견딤 | 통과 | scene.html:223 takeaway, :225 basis |
| 사실: 짝수 대수는 이득 없음 | 통과 | 화면에 주장 없음(해당 없음) |
| 사실: S1 리더 term 3, index 7을 S1·S2·S3에 저장하면 3/5로 커밋, S4·S5 없어도 됨 | 통과 | scene-step6 (S4 "index 7 없음"), scene-step7 (S1 "7 커밋·적용") |
| 사실: 한 term에 리더 한 명, 서버는 term당 투표 한 번 | 통과 | scene-step2 "자기 1표", scene-step3 "S1에 투표" ×2 |
| 사실: 더 높은 term을 보면 리더가 즉시 내려감 | 통과 | 화면에 주장 없음(해당 없음) |
| 사실: 커밋된 항목은 사라지지 않음 | 통과 | 화면에 주장 없음(해당 없음) |
| 사실: 무작위 timeout은 표 분산을 줄임 | 통과 | scene-step1 caption ①, S1 timer 바가 가장 먼저 참 |
| 사실: "리더가 쓰면 커밋"이라는 오해를 깸 | 통과 | scene-step5 "7 미커밋" 점선, scene-step7 커밋 표시 |
| 사실: 3대 장애면 선출도 커밋도 멈춤 | 통과 | scene-step8 caption ⑧, scene.html:69 |
| 생성 순서: 자기 투표(term 증가) → RequestVote | 통과 | scene-step2 → scene-step3 |
| 생성 순서: 리더는 표를 센 뒤에 생김 | 통과 | scene-step3 3/5 → scene-step4 "리더" |
| 생성 순서: 리더 로그 미커밋 → 복제 → 과반수 → 커밋 | 통과 | scene-step5 → step6 → step7 |
| 생성 순서: 팔로워 커밋은 리더보다 한 박자 늦음 | 통과 | scene-step7 리더만 커밋, scene-step8 팔로워 커밋 (패킷 도착 전 상태 전환은 기존 비트 규칙이라 고치지 않음) |
| 비트 1: 리더 소멸, 팔로워 timer가 먼저 끝나 후보 | 통과 | scene-step1 (S5 장애, S1 timer 최대) |
| 비트 2: term +1, 후보, 자기 1표 | 통과 | scene-step2 |
| 비트 3: 표 3/5, 과반수 표시 | 통과 | scene-step3 |
| 비트 4: 리더 확정, heartbeat로 나머지 눌러 앉힘 | 통과 | scene-step4 |
| 비트 5: 클라이언트 요청은 리더 로그에 미커밋으로 먼저 | 통과 | scene-step5 SET x=7, 7 미커밋 |
| 비트 6: 복제 응답 3/5 | 통과 | scene-step6 "복제 지연" S4 |
| 비트 7: 과반수 확인 후 리더 커밋 | 통과 | scene-step7 |
| 비트 8: 팔로워 커밋, 3대 장애 시 멈춤 | 통과 | scene-step8 |
| 화면 결함 겹침: S5 X 마커가 term 텍스트와 index 6 칸 위에 겹침 | 실패 | scene-step1 ~ step8, scene.html:106 |
| 화면 결함 겹침: "로그 칸" 캡션을 SET x=7 화살표가 가로지름 | 실패 | scene-step5, scene.html:105 (화살표 :118-119) |
| 화면 결함 잘림: 움직임 문구(msg)의 윗부분이 잘림 | 실패 | scene-step3, step4, step6, step8, scene.html:113 |
| 화면 결함 빈 프레임 | 통과 | 빈 화면 없음 |
| 화면 결함 읽을 수 없는 글 | 통과 | 캡션·범례 글자 크기 읽힘(1280px) |
| 화면 결함 움직임이 끝나지 않음 | 통과 | 패킷 반복은 scene.html:206-208 leave()에서 멈춤 |
| 권고(고치지 않음): 장면이 78%로 축소되어 figure가 위로 밀림 | 권고 | audit 결과, scene-step2~8 카드 위치 차이(약 170px) |

## 고친 것

- 겹침(S5 X 마커): 큰 X를 카드 하단 빈 칸(CY+204, 40px)으로 옮겨 term 텍스트·index 6 칸 위를 피함. scene.html:106
- 겹침("로그 칸" 캡션): 캡션 시작 x를 20→110으로 옮겨 SET x=7 화살표(x=95)와 겹치지 않게 함. scene.html:105
- 잘림(움직임 문구): 문구 baseline을 y=36→50으로 내려 figure 상단 잘림 선 아래로 보이게 함. scene.html:113
