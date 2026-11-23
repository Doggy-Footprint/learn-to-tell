# 검수: Raft 합의 — 리더 선출과 로그 복제 (overview)

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 과반수 = floor(N/2)+1, N=5 → 3 | 통과 | scene.html:122-123 LTT.expect, scene-t1s 근거 줄 |
| 사실: 손 계산 (3개 커밋 / 2개 미커밋) | 통과 | scene.html:69(2/5 미커밋), :70(D 저장, B commit 3), scene-step8 "2/5" |
| 사실: 투표 term+1, term당 한 표, 높은 term에 하강 | 통과 | scene.html:64(B term 3), :65(C·D·E term 3), :75(A가 term 4 팔로워로 복귀). 리더 하강은 별도 비트가 아님(모순 없음) |
| 사실: election timeout 무작위, heartbeat 짧음 | 통과 | 장면에 수치 없음, 모순 없음 |
| 사실: 후보 로그가 덜 최신이면 표 못 받음 | 통과 | scene.html:74 D·E 로그가 C와 같음, 거부 장면은 없음(모순 없음) |
| 사실: 커밋 항목은 지워지지 않음 | 통과 | scene.html:74–75 C 로그와 commit 3 유지 |
| 생성 순서: append → 복제 → 커밋 → ack | 통과 | scene.html:67 → :68 → :70 → :71 |
| 생성 순서: term 상승이 선출 결과보다 먼저 | 통과 | scene.html:64 → :66 |
| 생성 순서: 팔로워 commit이 리더보다 한 박자 늦음 | 통과 | scene.html:70 → :72 (ack :71 사이) |
| 생성 순서: 클라이언트 ack가 커밋 뒤 | 통과 | scene.html:71 CL 송신은 :70 commit 3 뒤 |
| 생성 순서: 대상이 생기는 순서대로 나타남 | 통과 | scene.html:62–75 14비트 순서 = storyboard 비트 순서 |
| 비트 1: heartbeat 끊김, B timeout | 통과 | scene-step2 (A 단절, B 강조) |
| 비트 2: B 후보 term 3, 과반수 3표로 리더 | 통과 | scene-step3, scene-step4, scene-step5 (B 리더 term 3) |
| 비트 3: 쓰기가 점선(미커밋) 칸으로 생김 | 통과 | scene-step6 (3:t3 점선, 1/5) |
| 비트 4: 3번째 저장에서 커밋 경계 넘음 | 통과 | 코드 scene.html:70 (B commit 3, 3/5). scene-step8은 2/5까지 |
| 비트 5: 커밋 항목 가진 노드만 새 리더 | 통과 | 코드 scene.html:73–74. scene-step9 이후 캡처 없음 |
| 비트 6: 저장소 선택 (왕복 지연 대 2대 장애) | 실패 | 화면 어디에도 없음. 근거 줄은 "2대 장애"만 말하고 왕복 지연은 없음 (scene.html:143) |
| 화면 결함: 잘림 | 실패 | scene-step6·step7·step8: B 카드 3번째 칸(3:t3)이 줄바꿈해 카드가 약 18px 커지고, 근거 줄이 하단 내비에 가려짐. scene.html:15, 21, 24 |
| 화면 결함: 겹침 | 통과 | scene-step1~8에서 겹침 없음 |
| 화면 결함: 빈 프레임 | 통과 | 없음 |
| 화면 결함: 읽을 수 없는 글 | 통과 | 휴지 상태 노드 라벨이 작고 흐리나 읽힘. 그림 크기는 audit 권고(small-visual)로 남김 |
| 화면 결함: 움직임이 멈추거나 끝나지 않음 | 통과 | 수동 player(scene.html:117), 각 송신 800ms. t4s·t8s 정지 프레임 동일은 자동 재생이 없어서 |
| audit 고침: lint overview-order | 실패 | scene.html:132–144 장면이 overview 하나뿐, summary·keywords 없음. 장면 추가는 direction 변경이라 보류 |

## 고친 것
- 잘림: `.raft` gap 8→4, `.card` 세로 padding 6→4, `.cells` margin 4→2, `.cells` min-height 26→46. 카드 높이 변화를 상쇄해 근거 줄이 하단 내비에 가려지지 않게 했다 (scene.html:15, 21, 24)
- 비트 6: 근거 줄(`basis`)에 "쓰기마다 과반수 왕복을 치르는 대신 2대 장애까지 데이터가 남는다"를 넣었다 (scene.html:143)
- 미반영: audit 고침 overview-order는 summary·keywords 장면 추가가 필요해 보류했다
