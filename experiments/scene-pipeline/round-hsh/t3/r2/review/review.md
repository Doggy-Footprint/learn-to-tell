# 검수: Raft 합의 overview 장면

스크린샷: scene-t1s.jpg, scene-t4s.jpg, scene-t8s.jpg (단계 ①·④·⑥ 상태). ⑦~⑩은 스크린샷이 없어 코드로 확인한다.

## 판정표

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 과반수 = floor(N/2)+1 = 3, 2대 장애까지 허용 | 통과 | scene.html:60 MAJ, :262 LTT.expect, :281 takeaway |
| 사실: 서버 5대 S1~S5, term, 역할, 로그 칸(index, term) 표시 | 통과 | scene-t1s.jpg, scene.html:61-67, :116-121 |
| 사실: 선출 패널 "선출 표 · term 4"가 선거 전에도 보임 | 실패 | scene-t1s.jpg 패널 제목이 전 서버 term 3인데 "term 4". scene.html:145 고정 문구 |
| 사실: 리더 S3 확정은 표 3/5 이후 | 통과 | scene-t8s.jpg 역할 "리더", scene.html:218-222 |
| 사실: 리더 로그 기록은 미커밋, 복제 과반 ack 후 커밋 | 통과(코드) | scene.html:229-245 |
| 사실: 팔로워 커밋은 commitIndex 전달 뒤 | 통과(코드) | scene.html:247-249 |
| 사실: 정리 문장 "과반수 두 번 사용" | 통과 | scene.html:251 |
| 생성 순서: term+1·자기 표 → RequestVote → 과반 → 리더 → heartbeat | 통과 | scene-t4s.jpg(③④), scene.html:208-226 |
| 생성 순서: 리더 로그 미커밋 → 복제 → ack → 리더 커밋 → 팔로워 커밋 | 통과(코드) | scene.html:230-249 |
| 생성 순서: 리더는 표를 센 뒤에 생긴다 | 통과 | scene.html:220-222 |
| 비트 1: 팔로워 timer가 먼저 끝나 후보(term+1) | 통과 | scene-t4s.jpg, scene.html:208-210 |
| 비트 2: 표 두 장으로 3/5, 리더 확정 | 통과 | scene-t8s.jpg 패널 "3 / 5 표" (글이 가려짐, 아래 겹침 항목) |
| 비트 3: heartbeat 후 나머지 조용한 팔로워 | 통과 | scene-t8s.jpg, scene.html:225-227 |
| 비트 4: 클라이언트 요청은 리더 로그에 미커밋(점선) 먼저 | 통과(코드) | scene.html:229-231, CSS :31 pend 점선 |
| 비트 5: 복제 ack 3/5에서 커밋 | 통과(코드) | scene.html:239-245 |
| 비트 6: 과반 미달 시 멈춤 | 통과 | scene.html:281 takeaway "3대가 멈추면 멈춘다" |
| 화면 겹침: 생존 신호 패킷 라벨이 패널 "3 / 5 표"와 "과반 3표" 글을 가림 | 실패 | scene-t8s.jpg 패널 중앙. 패킷 층(gPk)이 패널(gPn) 위에 그려짐. scene.html:90-92 |
| 잘림 / 빈 프레임 | 통과 | scene-t1s.jpg, scene-t4s.jpg, scene-t8s.jpg |
| 읽을 수 없는 글 | 통과 | 자막 16px, 패킷 라벨 12px, 스크린샷에서 판독 가능 |
| 움직임이 끝나지 않거나 멈춤 | 통과 | play()는 한 번 끝나고 "다시 보기"로 재시작. scene.html:193-258 |
| audit 고침: lint overview-order (summary 뒤, keywords 앞) | 실패 | shots/scene-audit.txt 고침 2건(1440, 1280). scene.html:272-284, scene 하나(overview)뿐이라 summary·keywords 없음 |
| audit 권고: 장면1 shrunk 78%, lint no-signature | 권고(손대지 않음) | shots/scene-audit.txt 권고 항목. 고침 대상 아님 |

## 고칠 계획

1. 패널 제목: 후보가 생긴 뒤에만 "term 4"를 쓴다. scene.html:145
2. 패킷 층을 패널 아래로 내려서 라벨이 글을 가리지 않게 한다. scene.html:90-92
3. overview-order: scenes를 summary → overview → keywords 순으로 바꾼다. scene.html:272-284

## 고친 것

- 선출 패널 제목: 후보가 생긴 뒤에만 "선출 표 · term 4"를 쓰고, 그 전에는 "선출 표"로 둠 (scene.html:145)
- 겹침: 패킷 층(gPk)을 패널 아래로 내려 생존 신호 라벨이 "3 / 5 표" 글을 가리지 않게 함 (scene.html:90-92)
- lint overview-order: scenes를 summary → overview → keywords 순서로 바꿈 (scene.html:272-)
- 재audit에서 생긴 고침 5건(summary-no-recall 2, used-before-defined 3): summary 카드에 recall 추가, 첫 등장 용어를 `{{}}`로 표시 (scene.html:273-281 근처)
- 최종 audit: 고침 0건, 권고 2건(장면 shrunk 78%, no-signature)은 그대로 둠
