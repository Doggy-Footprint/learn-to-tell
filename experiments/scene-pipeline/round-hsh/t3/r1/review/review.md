# 검수: Raft 합의 장면 (scene.html)

스크린샷 기준: `shots/scene-t1s·t4s·t8s`, `scene-step1`~`step8`. `index.txt`에 step9~11 스크린샷이 없어 ⑨–⑪은 코드로만 확인했다(항목에 표시).

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 과반 = floor(N/2)+1, N=5 → 3 | 통과 | `scene.html:35` QUORUM, `scene-step5.jpg` "3 / 3" |
| 사실: 후보 자기 표 포함 득표 3 | 통과 | `scene.html:50` votes=1, `scene-step3.jpg` "1 / 3" → `scene-step5.jpg` "3 / 3" |
| 사실: 노드당 term당 한 표, term 단조 증가 | 통과 | `scene.html:50-51` S2 term 3→4 한 번, `scene-step4.jpg` 나머지 term 4 |
| 사실: 저장 3 ≥ 3에서 커밋, 늦은 노드도 유효 | 통과 | `scene.html:56-61`. ⑨–⑪ 스크린샷 없음(코드 근거) |
| 사실: 장애 허용 = N − 과반 = 2대 | 실패 | `scene.html:182` takeaway, 화면에 노출되지 않음(아래 비트 6 행) |
| 생성 순서: term↑ → RequestVote → 리더 → 미커밋 append → 복제 → 커밋 | 통과 | `scene-step3`→`step4`(RequestVote)→`step5`(3표)→`step6`(리더)→`step7`(t4 점선)→`step8`(복제). ⑨–⑪은 코드 `scene.html:56-61` |
| 생성 순서: 팔로워 commitIndex 전파가 리더 커밋 뒤 | 통과 | `scene.html:58-61` ⑪이 ⑩ 뒤, 코드 근거 |
| 비트 1 평시: heartbeat, 팔로워 조용 | 통과 | `scene-t1s.jpg`, `scene-step1.jpg` |
| 비트 2 장애, S2 timeout 먼저 끝남 | 통과 | `scene-step2.jpg` S1 "장애", S2 강조 |
| 비트 3 선출: term 오름, RequestVote, 3표째 과반 | 통과 | `scene-step3.jpg`, `step4.jpg`, `step5.jpg` |
| 비트 4 쓰기가 리더 로그에 미커밋, 복제 | 통과 | `scene-step7.jpg` t4 점선, `step8.jpg` S3·S4 t4 점선 |
| 비트 5 3번째 ack에서 커밋 전환 | 통과 | 코드 `scene.html:56-57`(⑨·⑩). 스크린샷 없음 |
| 비트 6 선택 연결: 노드 수·장애 허용으로 저장소 선택 | 실패 | `scene.html:181-184` takeaway·recall·basis는 설정돼 있으나 summary 장면이 없어 어느 스크린샷에도 없음 |
| 칸 범례: 진한 칸 = 커밋, 점선 = 미커밋, 과반선 | 실패 | `scene.html:181` caption, `:161` label이 어느 스크린샷에도 없음. 범례 글 없이 구분만 있음 |
| 화면: 겹침 | 통과 | 전 스크린샷, 선·라벨 겹침 없음 |
| 화면: 잘림 | 통과 | 전 스크린샷, 제목·본문 모두 보임 |
| 화면: 빈 프레임 | 통과 | 없음 |
| 화면: 읽을 수 없는 글 | 통과 | 흐림은 단계 강조. 본문 자막(우측)은 읽힘 |
| 화면: 움직임이 끝나지 않거나 멈춤 | 통과 | 수동 단계, 패킷 700ms 후 정지(`scene.html:125`) |
| 배치: 그림 왼쪽, 로그 패널 오른쪽 (방향) | 실패 | `scene-step1.jpg`: 패널이 그림 아래(y 520–710)로 내려감. kit 축소와 얽혀 이번 고침 범위 밖 |

요약: 실패 4건(사실 노출 1, 비트 6 1, 범례 1, 배치 1).

## 고친 것
- 사실: 장애 허용 2대 — takeaway 문장을 그림 옆 패널에 직접 넣어 화면에 노출(`scene.html` panelHTML).
- 비트 6: recall 질문을 같은 패널에 넣어 "어느 쪽이 장애를 더 견디나?"가 보이게 함.
- 칸 범례: 진한 칸·점선 칸·과반선 설명 한 줄을 패널 하단에 추가.
- 배치(미고침): 패널이 그림 아래로 내려가는 문제는 kit 축소 로직과 얽혀 이번 범위 밖. 권고로 남김.
- 시도 후 되돌림: summary·overview 장면 추가는 overview-order·no-title·keywords 연쇄 lint를 일으켜 취소.
