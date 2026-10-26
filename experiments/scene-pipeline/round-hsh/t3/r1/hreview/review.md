# 검수: Raft 리더 선출과 로그 복제 (overview 한 장)

판정은 통과/실패. 근거는 `shots/` 캡처 이름(stepN = 단계 N) 또는 `scene.html:줄`. step9–11 캡처는 `shots/index.txt`에 없어 코드로 본다.

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 과반 = floor(N/2)+1, N=5 → 3 | 통과 | scene.html:35, :180 "5노드 기준 과반 3대", :186 basis |
| 사실: 후보 자기 투표 포함 | 통과 | scene.html:50 `votes = 1`, step3 "1 / 3", step5 "3 / 3" |
| 사실: 노드당 term당 한 표 | 통과 | scene.html:145 캡션, 모순 없음 |
| 사실: 2:2:1 표 갈림 → 재선거 | 통과 | 장면에 없음, 모순 없음 |
| 사실: 손 계산 L+F1+F2 = 3 → 커밋 | 통과 | scene.html:54, :56 acks 1 → 3, step7 "1 / 3", step9 "3 / 3" |
| 사실: 이전 term 항목은 개수로 커밋 안 함 | 통과 | scene.html:42 이전 항목 t2는 시작부터 커밋 상태, 새 항목 t4만 커밋 |
| 사실: term 단조 증가 | 통과 | scene.html:50–51 term 3 → 4 |
| 생성 순서: term → 투표 → 리더 → 항목 → 복제 → 커밋 | 통과 | OPS idx 2→3→5→6→7→8→9 (scene.html:47–62) |
| 생성 순서: 리더는 선출 뒤에만 존재 | 통과 | S2 "리더"는 idx5(step6)부터, votes 3 뒤 |
| 생성 순서: 커밋은 복제 결과 | 통과 | 미커밋 idx6(step7 점선 "4"), 커밋 idx9 (scene.html:54, :57) |
| 생성 순서: 팔로워 commitIndex는 리더보다 늦음 | 통과 | 리더 커밋 idx9, 팔로워 커밋 idx10 (scene.html:57–60) |
| 비트1 평시 heartbeat | 통과 | step1 캡션. 움직임은 아래 행 |
| 비트2 리더 장애 | 통과 | step2 "장애" 태그, S1 흐림 |
| 비트3 선출(term, 득표, 과반선) | 통과 | step3 "후보" "1 / 3", step5 "3 / 3", 세 번째 칸 뒤 간격 |
| 비트4 쓰기 복제 | 통과 | step7 점선 칸 "4", step8 S3·S4 점선 칸 |
| 비트5 커밋 | 통과 | step9 "3 / 3"(idx8), step10 진한 칸(코드 idx9) |
| 비트6 선택 연결(과반으로 노드 수 고르기) | 통과 | takeaway(scene.html:184), recall(:185). "홀수 노드 권장" 문구는 없음 |
| 결함: 평시 움직임이 멈춘 채 시작 | 실패 | t1s·t4s·t8s가 같은 정지 화면, 점 메시지 없음. direction의 "자동 재생 후 반복"과 어긋남. 자동 재생 옵션이 refs/api/diagram.md에 없어 보류 |
| 결함: 겹침 | 통과 | 캡처 전 단계에서 선·라벨 겹침 없음 |
| 결함: 잘림 (basis 줄) | 실패 | basis(scene.html:186)가 step4 캡처에만 보임. 나머지 캡처에서는 안 보임. 원인이 kit 레이아웃 쪽이라 보류 |
| 결함: 빈 프레임 | 통과 | 없음 |
| 결함: 읽을 수 없는 글 | 통과 | 흐린 노드 라벨과 "득표" 작은 글은 대비가 낮지만 읽힌다 |
| lint: overview-order (고침) | 실패 | 장면이 overview 하나뿐. summary·keywords 없음 (scene.html:175–187) |
| audit 권고 3건 (shrunk, small-visual, no-signature) | 통과 | 권고라 그대로 둔다 |

판정 요약: 실패 3건(평시 움직임, basis 잘림, overview-order). 고칠 것은 overview-order 1건.

## 고친 것
- lint overview-order: summary 장면(카드마다 recall)을 overview 앞에, keywords 장면을 overview 뒤에 추가. 재audit 고침 0건.
