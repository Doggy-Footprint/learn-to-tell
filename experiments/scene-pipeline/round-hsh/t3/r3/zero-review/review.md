# 검수 review — Raft 합의 (overview)

스크린샷: t1s·t4s·t8s 세 장 모두 1단계 상태(N1 타이머 만료)만 보인다. 2–8단계 판정은 코드 위치 근거다.

## 사실 점검표

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 과반수 = floor(N/2)+1, N=5 → 3 | 통과 | scene.html:18–19 `LTT.expect` 3 |
| 허용 장애 = N − 과반수 = 2 | 통과 | scene.html:20 |
| 손 계산: 3개 커밋, 2개 미커밋 | 통과 | scene.html:39–43 (저장 2/5 미커밋 → 3/5 커밋) |
| 투표 요청 term +1, term당 한 표 | 통과 | scene.html:32 "표 요청 T1", cap[1] |
| 높은 term을 보면 리더도 팔로워로 내려감 | 통과 | 장면에 없음, 모순 없음 |
| election timeout 무작위, heartbeat 주기 짧음 | 통과 | cap[0] "노드마다 타이머가 무작위", 수치는 장면에 없음 |
| 덜 최신 후보는 표를 못 받음 | 통과 | scene.html:50 "거절: 로그 덜 최신" |
| 커밋 항목은 지워지지 않음 | 통과 | cap[7], scene.html:47 |

## 생성 순서

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 리더 append 먼저, 복제는 그다음 | 통과 | scene.html:36–41 (send 없음 → AppendEntries) |
| term은 선출 결과보다 먼저 바뀜 | 통과 | scene.html:30 후보 T1 |
| 팔로워 commitIndex는 한 박자 늦음 | 통과 | scene.html:42 리더만 ▣, 팔로워는 다음 단계 ▣ |
| ack는 커밋 이후 | 통과 | scene.html:43 커밋과 ack가 같은 단계, append 단계(36–38)에는 ack 없음 |

## 비트

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 비트 1 타이머 만료 | 통과 | shots/scene-t1s.jpg, scene.html:28 |
| 비트 2 term 올리고 투표 요청 | 통과 | scene.html:32 |
| 비트 3 과반수 3표로 리더 | 통과 | scene.html:34 "득표 3/5 ≥ 3" |
| 비트 4 리더 로그에 미커밋 쓰기 | 통과 | scene.html:37 "미커밋 · ack 아직 없음" |
| 비트 5 복제 후 3번째 저장에서 커밋 경계 | 통과 | scene.html:43 "저장 3/5 ≥ 3" |
| 비트 6 리더 사망 후 커밋 항목 보유 노드만 리더 | 통과 | scene.html:49–50 |
| 비트 7 팔로워 커밋 따라감, N4·N5 수신 | 통과 | scene.html:45–47 |
| 비트 8 저장소 선택 문장 | 통과 | shots/scene-t1s.jpg 하단 caption |

## 화면 결함

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 겹침·잘림 | 통과 | shots/scene-t1s.jpg |
| 빈 프레임 | 통과 | shots/scene-t1s.jpg 다섯 노드 모두 보임 |
| 읽을 수 없는 글 | 통과 | shots/scene-t1s.jpg 노드 부글씨 1280px에서 읽힘 |
| 움직임이 멈추는 곳 | 통과 | 1단계는 정지가 의도(send 없음). 2단계 이후는 scene.html:103 send 애니메이션 |

## audit 고침·권고

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| lint overview-order (고침, 1440·1280) | 실패 | scene.html:86–108 overview 단일 장면, summary 앞·keywords 뒤 없음 |
| lint no-signature (권고) | 권고 | 그대로 둠 |

## 범위 밖 관찰

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| shots/index.txt `checks` (#ltt-checks) | 실패 | scene.html에 #ltt-checks 없음. 수정 명세를 읽지 않아 고치지 않음 |

## 고친 것

- lint overview-order: overview 앞에 summary 장면, 뒤에 keywords 장면을 추가했다 (scene.html:86 이후, 1440·1280 공통).
- lint summary-no-recall (1차 고침 뒤 생긴 항목): summary 카드 4개에 recall 질문을 붙였다 (scene.html 카드 블록).
- audit 재실행 결과: 고침 0건, 권고 no-signature만 남음.
