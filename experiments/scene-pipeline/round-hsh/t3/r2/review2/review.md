# 검수: Raft 합의 overview 장면

스크린샷: scene-t1s.jpg, scene-t4s.jpg, scene-t8s.jpg (index.txt 기준. checks는 없음). 그 뒤 단계(④ 이후 일부)는 스크린샷이 없어 코드 줄로 확인했다.

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 과반수 = floor(N/2)+1, 5대면 3 | 통과 | scene.html:60, 278 (LTT.expect MAJ=3), 148–150 "과반 3표" |
| 사실: 2대 장애까지 견딤, 3대 멈추면 선출·커밋 불가 | 통과 | scene.html:297 takeaway, 219–225 stall 모드 2/5 멈춤 |
| 사실: 짝수 대수는 이득 없음 | 통과 | 장면에 주장 없음 (해당 없음) |
| 사실: 예시 S1 리더 term 3, index 7 3/5 커밋 | 통과 | 장면은 S3 리더 term 4, S2·S4 저장 3/5 예시 (243–259). 수치는 다르나 모순 아님 |
| 사실: 한 term에 리더 한 명, 서버는 term당 한 표 | 통과 | scene.html:215–235 (S3 표 한 번, 리더 한 명) |
| 사실: 커밋 항목은 사라지지 않음 | 통과 | scene.html:266 정리 문장 |
| 사실: 무작위 timeout은 표 분산을 줄임 | 통과 | scene.html:214 캡션 ③ |
| 순서: term+1과 자기 투표가 RequestVote보다 먼저 | 통과 | scene-t4s.jpg (S3 후보 term 4, 1/5), scene.html:215–217 → 229 |
| 순서: 리더는 표를 센 뒤에만 생김 | 통과 | scene-t8s.jpg (3/5 리더 확정), scene.html:231–235 |
| 순서: 리더 로그 미커밋 → 복제 → 3/5 확인 뒤 커밋 | 통과 | scene.html:243–259 (pend → ok) |
| 순서: 팔로워 커밋은 commitIndex 전달 뒤 (한 박자 늦음) | 통과 | scene.html:262–264 |
| 비트 1: 타이머 종료 → 후보 (term +1) | 통과 | scene-t4s.jpg (S3 후보, term 4) |
| 비트 2: 3/5 표로 리더 확정 | 통과 | scene-t8s.jpg |
| 비트 3: 리더 heartbeat 뒤 나머지 조용한 팔로워 | 통과 | scene-t8s.jpg (S2·S4·S5 팔로워) |
| 비트 4: 클라이언트 요청은 리더 로그에 미커밋으로 먼저 | 통과 | scene.html:243–246 (스크린샷 없음, 코드 확인) |
| 비트 5: 3/5 저장에서 커밋, 느린 서버가 있어도 진행 | 통과 | scene.html:253–259 (S5 응답 없음, 스크린샷 없음) |
| 비트 6: 과반을 못 모으면 멈춤 (저장소 관점) | 통과 | scene.html:219–225 "서버 3대 멈춤" 버튼 |
| 화면: 패킷 라벨이 출발 상자 가장자리와 겹침 | 실패 | scene-t8s.jpg "생존 신호"가 S4 오른쪽 가장자리와 겹침 (약 7px). scene-t4s.jpg "투표 요청" 라벨이 S3 왼쪽 가장자리를 침범. 원인: scene.html:155–156 edge 여백 12px, 라벨 반 너비 40px |
| 화면: 투표·복제 방향 화살표가 없음 (storyboard "꼭 보일 것") | 실패 | scene-t4s.jpg 라벨에 화살촉 없음, 방향은 움직임으로만 보임. scene.html:154–167 packet |
| 화면: 빈 프레임, 멈춤, 끝나지 않는 움직임 | 통과 | 정리 문장 scene.html:266 후 정지, 다시 보기 버튼 (scene.html:272–274) |
| 화면: 읽을 수 없는 글 | 통과 | scene-t1s.jpg 캡션과 제목 판독 가능 |
| 화면: 글자·그림 축소 (audit 권고, 78%) | 권고 | scene-audit.txt 장면1 shrunk. 권고이므로 그대로 둠 |
| audit 고침: lint overview-order (장면이 overview 1개뿐) | 실패(보류) | scene.html:288–300 scenes에 summary·keywords 없음. 고치려면 장면 구성 변경(summary·keywords 추가, takeaway 이동)이 필요해 보류. 사유는 최종 답 참고 |

요약: 실패 2건(겹침, 화살표) 고침 대상. overview-order 고침 1건은 보류.

## 고친 것
- 패킷 라벨 겹침: `edge`에 여백 인자 m을 두고 패킷만 m=44로 써서 시작·도착 점이 라벨 반 너비 밖에 놓이게 함 (scene.html:70–77, 155–156).
- 방향 화살표 없음: 패킷마다 출발점에서 라벨 앞까지 `trail` 선과 `arr` 화살촉을 그리고, 끝나면 함께 지움 (scene.html:45–46 CSS, 84–87 marker, 154–172 packet).
- 보류: audit `overview-order` 고침 2건. 장면이 overview 하나뿐이라 summary·keywords 추가 또는 takeaway 이동이 필요하다. 방향 문서가 takeaway·recall을 이 장면에 두라고 해서 임의로 바꾸지 않았다.
