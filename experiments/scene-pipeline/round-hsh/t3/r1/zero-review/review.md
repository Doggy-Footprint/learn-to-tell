# 검수: Raft 합의 한 장 정리 (scene.html)

## 사실 점검표

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 과반 = floor(N/2)+1, N=5 → 3, 허용 장애 2 | 통과 | scene-step8 "5 − 3 = 2대까지 장애 허용", scene.html:30–31 |
| 후보의 자기 투표 포함 | 통과 | scene-step3 N2 on, "1 < 3, 아직 부족" |
| term당 한 표, 같은 term에 리더 둘 불가 | 통과 | scene-step5 캡션 "같은 term에 리더는 둘일 수 없다" |
| 표가 갈리면(2:2:1) 재선거 | 통과(화면 미사용) | 화면에 없음, 필수 항목 아님 |
| 손 계산 예(L+F1+F2 = 3 커밋) | 통과(화면 미사용) | 화면에 없음 |
| 이전 term 항목은 개수로 커밋하지 않음 | 통과(화면 미사용) | 화면에 없음 |
| term 단조 증가, 큰 term을 보면 리더가 물러남 | 통과(화면 미사용) | scene-step3 N1 term 3 / N2 term 4 |
| 캡션 "노드를 고를 때는 {{term}}·{{커밋}} 규칙이 요구하는 과반" | 실패 | scene.html:115, term(임기 번호)은 과반 규칙이 아님. 스토리보드는 선출과 커밋이 과반을 쓴다고 한다 |
| 팔로워 commitIndex는 리더보다 늦게 갱신 | 실패 | scene.html:58 캡션 "팔로워는 이후 AppendEntries로 commitIndex를 받는다"인데 scene-step7·step8에 팔로워 적용 표시가 없다 |

## 생성 순서

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| term 증가 → RequestVote | 통과 | scene-step3 (term 4) → scene-step4 (RequestVote) |
| 선출 뒤에야 리더, 곧 heartbeat | 통과 | scene-step4 (득표 3) → scene-step5 (N2 리더, heartbeat) |
| 리더 로그 미커밋 → 복제 → 과반 확인 후 커밋 | 통과 | scene-step6 (x 미커밋, 1 < 3) → scene-step7 (3 ≥ 3 → 커밋) |
| 팔로워 commitIndex 갱신이 리더보다 늦다 | 실패 | 위 점검표 항목과 같다. 화면에 해당 장면이 없다 |

## 비트

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 1 평시 heartbeat | 통과 | scene-t1s, scene-step1 |
| 2 리더 장애, timeout이 먼저 끝난 팔로워 | 통과 | scene-step2 (N2 timeout 만료) |
| 3 선출: term 상승, RequestVote, 3표째 과반 | 통과 | scene-step3, scene-step4 |
| 4 쓰기 복제: 미커밋으로 생겨 퍼짐 | 통과 | scene-step6 |
| 5 커밋: 3번째 ack, 늦은 노드도 유효 | 통과 | scene-step7 (N5 "x 늦음") |
| 6 선택 연결: 노드 수와 허용 장애 수 | 통과 | scene-step8 |

## 화면 결함

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 겹침: "과반 3" 글자가 점선이 지나며 갈림 | 실패 | scene-step1, scene-step4 (`.raft-q .line span`, scene.html:22) |
| 잘림: 핵심 띠(takeaway)가 화면 아래에서 잘리거나 사라짐 | 실패 | scene-t4s, scene-step2, scene-step4(띠 없음), scene-step5~8. step마다 그림과 패널 높이가 바뀌어 아래가 밀린다 |
| 읽을 수 없는 글: 노드 부제("팔로워", "투표함")와 "heartbeat", "RequestVote" 선 라벨이 매우 작다 | 실패 | scene-step1, scene-step3, scene-step4 |
| 빈 프레임 | 통과 | 없음 |
| 움직임이 멈추지 않거나 끝나지 않음 | 통과 | scene-step8 다음 버튼 비활성, 반복 재생 버튼 노출 |
| overview-order 고침 (audit) | 실패 | shots/scene-audit.txt, 덱에 summary와 keywords가 없어 순서 규칙을 만족할 수 없다 |
| small-visual 권고 (audit) | 권고 | 그림이 화면의 20%, 권고라 그대로 둬도 된다 |

## 고친 것
- 캡션(scene.html:115)의 "{{term}}·{{커밋}} 규칙" 설명을 "선출과 {{커밋}}이 쓰는 과반 수"로 바로잡았다.
- 캡션(scene.html:58)에서 화면에 없는 "팔로워 commitIndex 수신" 주장을 뺐다. 스토리보드의 이 사실은 아직 화면에 없다.
- `.raft-q .line span`(scene.html:22)에 배경과 여백을 넣어 "과반 3" 글자를 점선이 가르지 않게 했다.

## 남긴 것
- 잘림(핵심 띠가 step마다 화면 밖으로 밀림)과 읽을 수 없는 작은 글(노드 부제, 선 라벨)은 고치지 못했다. 그림 축소 방식을 바꿔야 해서 렌더링으로 확인하지 않고는 고칠 수 없다.
- audit 고침: overview-order는 덱에 summary와 keywords 장면이 없어 규칙을 만족할 수 없다. 두 장면을 새로 쓰려면 내용(요약 카드, keywords 용어)이 필요하다.
- audit 권고 unused-term은 캡션에서 {{term}}을 뺀 결과다. 필요하면 용어를 다시 넣거나 glossary에서 지운다.
