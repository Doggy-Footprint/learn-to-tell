# 검수: Raft 합의 — 리더 선출과 로그 복제

기준: storyboard.md. direction.md는 작성자 기록이 없어 방향 판정은 하지 않는다.
스크린샷: t1s·t4s·t8s(모두 단계 1 상태), step1~step8. step9 없음.

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 과반 = ⌊5/2⌋+1 = 3 | 통과 | scene.html:36 QUORUM=3, step1 "과반 = ⌊5/2⌋+1 = 3" |
| 사실: 5노드 허용 장애 2 | 통과 | scene.html:38 expect, 그림 캡션 "2대가 죽어도 3대" |
| 사실: 후보 자기 표 포함 (득표 1부터) | 통과 | scene.html:51 meter n:1, step3 "득표 1/5" |
| 사실: 3표째 당선, 2표까지 과반 미달 | 통과 | step3 "과반 미달", step4 "과반 달성: 당선" |
| 사실: 같은 term에 리더 둘 불가 | 통과 | step5 S2 리더 term 2, 나머지 term 2 팔로워 |
| 사실: 손 계산 L+F1+F2 = 3이면 커밋 | 통과 | step8 "저장 3/5 · 과반 달성: 커밋" |
| 사실: 2표(L+F1)면 미커밋 | 통과 | step7 "저장 2/5 · 과반 미달", x 점선 |
| 사실: 2:2:1 분열, 이전 term 항목, term 단조 증가 | 통과 | 장면에 해당 비트 없음. 모순 없음 |
| 생성 순서: term 증가 → RequestVote → 리더 | 통과 | step3 term 2 → step4 RequestVote → step5 리더 |
| 생성 순서: 미커밋 → 복제 → 커밋 | 통과 | step6 S2 x 'u' → step7 S3 'u' → step8 S2 'c' |
| 생성 순서: 팔로워 커밋은 리더 뒤 | 통과 | step8 S3·S4 'u' → 비트 9 'c'(코드 scene.html:67-69) |
| 비트 1 평시 heartbeat | 통과 | step1: S1 리더 heartbeat 화살표 |
| 비트 2 리더 장애, S2 timeout 먼저 | 통과 | step2: S1 장애(빨강), S2 timeout 만료(주황) |
| 비트 3 term+1 후보, 득표 1 | 통과 | step3: S2 후보 term 2, 득표 1/5 |
| 비트 4 RequestVote, 득표 3 | 통과 | step4: RequestVote 화살표, S3·S4 표 줌, 득표 3/5 |
| 비트 5 리더 heartbeat 공지 | 통과 | step5: S2 리더 term 2, heartbeat 화살표 |
| 비트 6 미커밋 x | 통과 | step6: S2 x 점선, 저장 1/5 |
| 비트 7 AppendEntries, 저장 2 | 통과 | step7: S3 x 점선, 저장 2/5 |
| 비트 8 3번째 저장에서 커밋, S5 늦음 | 통과 | step8: S2 x 'c', 과반 달성: 커밋 |
| 비트 9 commitIndex로 팔로워 커밋, S5 지연 | 확인 불가 | step9 스크린샷 없음. 코드 BEATS[8]은 스토리보드와 일치 |
| 화면 겹침 | 통과 | step4·step8 캡션과 버튼 간격, AppendEntries 라벨 |
| 잘림 | 통과 | 전 단계 캡션 2~3줄이 프레임 안에 들어감 |
| 빈 프레임 | 통과 | 전 단계 노드와 로그 칸 채워짐 |
| 읽을 수 없는 글 | 통과 | 노드 부제가 작다(권고). heartbeat·RequestVote 풀이 없음(권고) |
| 움직임이 끝나지 않거나 멈춤 | 통과 | 단계마다 sends 1회(ms 800), 반복 없음 |
| audit 권고: 장면 1이 87%로 축소 | 권고 | shots/scene-audit.txt. 권고라 두고 둠 |

요약: 실패 0건, 확인 불가 1건(비트 9 스크린샷).

## 고친 것
- 없음. 실패 항목 0건이라 scene.html은 고치지 않았다. audit 결과도 고침 0건이다.
