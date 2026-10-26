# 검수: Raft 합의 한 장 정리 (scene.html)

검수 기준: storyboard.md 사실 점검표·생성 순서·비트, 화면 결함. direction.md는 작성자 기록이 없어 장면 자체를 기준으로 본다.

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 과반 = 3, 5노드 허용 장애 2 | 통과 | scene.html:34-35, scene-step8 "5 − 3 = 2대까지 장애 허용" |
| 사실: 후보 자기 투표 포함 (1 < 3 → 3 ≥ 3 당선) | 통과 | scene-step3 "1 < 3", scene-step4 "3 ≥ 3 → 당선" |
| 사실: 노드당 term당 1표, 두 리더 불가 | 통과 | scene-step5 캡션 "같은 term에 리더는 둘일 수 없다" |
| 사실: 2:2:1 표 갈림 → 재선거 | 통과 | 화면에 주장 없음 |
| 사실: 손 계산 L+F1+F2 = 3 커밋, L+F1 = 2 미커밋 | 통과 | scene-step6 "1 < 3, 아직 미커밋", scene-step7 "3 ≥ 3 → 커밋" |
| 사실: 이전 term 항목은 개수만으로 커밋 안 함, term 단조 증가 | 통과 | 화면에 틀린 주장 없음(미표기) |
| 생성 순서: term 증가 → RequestVote → 리더 | 통과 | scene-step3 → scene-step4 → scene-step5 |
| 생성 순서: 리더 로그 미커밋 → 복제 → 과반 후 커밋 | 통과 | scene-step6 "x 미커밋" → scene-step7 "x 커밋" |
| 생성 순서: 팔로워 commitIndex가 리더보다 늦다 | 통과(미표기) | 비트 목록에 팔로워 적용 단계 없음. 틀린 순서는 없음 |
| 비트 1 평시 heartbeat | 통과 | scene-step1 |
| 비트 2 리더 장애, N2 timeout 먼저 | 통과 | scene-step2 "timeout 만료" |
| 비트 3 선출, 3표째 과반 | 통과 | scene-step4, scene-step5 "리더 · term 4" |
| 비트 4 쓰기 복제 (미커밋 항목) | 통과 | scene-step6 |
| 비트 5 3번째 ack에서 커밋, N5 늦음 | 통과 | scene-step7 |
| 비트 6 선택 연결 (홀수 노드, 허용 장애) | 통과 | scene-step8 |
| 화면: 과반 기준선·득표 칸·리더 로그 칸 | 통과 | scene-step4 "과반 3" 기준선, scene-step6 리더 로그 칸 |
| 화면: 노드별 로그 칸 | 통과(글로만) | 노드 부제 "x 저장 중"으로만 표기. 그림 칸은 없음. 읽기 결함과 함께 본다 |
| 화면 결함: 겹침·잘림 | 통과 | 전 단계 scene-step1–8, 라벨 겹침 없음 |
| 화면 결함: 빈 프레임 | 통과 | 전 단계 내용 있음 |
| 화면 결함: 멈추는 움직임 | 통과 | 반복 재생 버튼, heartbeat 흐름은 의도된 반복 |
| 화면 결함: 읽을 수 없는 글 | 실패 | scene-step1–7: 노드 부제(팔로워·x 저장 중)와 간선 라벨(heartbeat, RequestVote, AppendEntries)이 약 5–6px. scene.html:27 `.raft-fig svg` max-height 170px, scene.html:85 diagram cell [240, 120] |

판정 요약: 실패 1건(읽을 수 없는 글). 나머지는 통과.

## 고친 것

- 화면 결함: 읽을 수 없는 글 — scene.html:27 `.raft-fig svg` max-height 170px → 190px.
- 화면 결함: 읽을 수 없는 글 — scene.html:85 diagram cell 높이 120 → 100, `width: 560` 추가로 그림을 키움.
- 확인 한계: audit 재실행 결과 고침 0건. 다만 audit이 shots/의 스크린샷을 갱신하지 않아 수정 후 글자 크기는 눈으로 확인하지 못했다. 1280x800에서 노드·간선 글자가 충분히 커졌는지는 확인이 필요하다.
