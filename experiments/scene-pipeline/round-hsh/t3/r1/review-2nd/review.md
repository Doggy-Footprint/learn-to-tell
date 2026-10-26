# 검수 review (2차)

대상: `scene.html` (1장면, figure). 기준: storyboard.md 사실 점검표·생성 순서·비트, direction.md 최종 방향, shots/ 스크린샷(t1s·t4s·t8s, step1–8). 2차 audit 결과는 고침 0건, 권고 2건(장면1 shrunk 78%).

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 과반 = floor(N/2)+1 (N=5 → 3, N=4 → 3) | 통과 | scene.html:35, :155, :186 |
| 사실: 후보 자기 표 포함, 5노드 득표 3에서 당선 | 통과 | scene-step3.jpg 득표 1/3 → scene-step5.jpg 3/3 |
| 사실: 저장 3이면 커밋, 저장 2 이하는 미커밋 | 통과 | scene.html:54–57, scene-step7.jpg·step8.jpg 저장 1/3 |
| 사실: term당 1표, 2:2:1 재선거, 이전 term 개수 커밋 금지, term 단조 증가 | 해당 없음 | 장면에 표현 없음(storyboard 참고 항목) |
| 생성 순서: term 증가 → RequestVote | 통과 | scene-step3.jpg(S3–S5 term 3) → scene-step4.jpg(S3–S5 term 4, 전송) |
| 생성 순서: 리더 선출 → 빈 AppendEntries → 쓰기 append | 통과 | scene-step5.jpg → step6.jpg(S2 리더) → step7.jpg(S2 t4 점선) |
| 생성 순서: 미커밋 → 복제 → 커밋 → 팔로워 commitIndex | 통과 | step8.jpg(S3·S4 점선) → scene.html:57(커밋), :59–60(팔로워 전파) |
| 비트 1 평시: 리더 heartbeat, 팔로워 조용 | 통과 | scene-step1.jpg |
| 비트 2 리더 장애, 팔로워 timeout 먼저 끝남 | 통과 | scene-step2.jpg (S1 장애, S2 후보 대기) |
| 비트 3 선출: term 상승, RequestVote, 3표째 과반 | 통과 | scene-step4.jpg, scene-step5.jpg |
| 비트 4 쓰기 복제: 미커밋으로 생겨 퍼짐 | 통과 | scene-step7.jpg, scene-step8.jpg |
| 비트 5 커밋: 3번째 저장 ack에서 커밋 전환 | 확인 불가 | scene-step9~11.jpg 없음, shots/index.txt도 step1–8만 나열(캡처 누락, 장면 결함 아님). 코드상 scene.html:57 |
| 비트 6 선택 연결: 노드 수와 허용 장애 수 | 실패 | 패널의 takeaway·recall 두 줄이 화면에 없음. 근거: scene-step1.jpg 하단, scene.html:84 |
| 화면: 겹침 | 통과 | 스크린샷 전 단계에서 노드·칸·막대 겹침 없음 |
| 화면: 잘림 | 실패 | 패널 마지막 두 줄(scene.html:84)이 하단 이동 바 아래로 잘려 안 보인다(scene-step1.jpg–step8.jpg 공통). 그림 아래 caption(:183)·basis(:186)도 스크린샷에 없어 잘림 여부 확인 필요 |
| 화면: 빈 프레임 | 통과 | 단계마다 칸·노드 채워짐 |
| 화면: 읽을 수 없는 글 | 통과(권고) | 78% 축소로 범례·근거 글이 작다(scene-step1.jpg 범례 줄). audit 권고 그대로 둔다 |
| 화면: 움직임이 끝나지 않거나 멈춤 | 확인 불가 | 정지 이미지만 있다. t4s·t8s가 t1s와 같아 자동 재생은 없고 stepper로만 진행(설계대로) |
| 방향 준수: 그림 주인공, 로그 칸 패널, 막대 2줄 | 통과 | scene-step1.jpg–step8.jpg |

## 실패 항목 계획
- 비트 6·화면 잘림: 그림 높이(scene.html:95, cell 세로 120)를 100으로 줄여 패널이 위로 올라오게 한다. 노드 크기·배치·방향은 그대로 둔다.

## 고친 것
- 화면 잘림·비트 6: scene.html:95 `cell: [240, 120]` → `[240, 100]`. 재audit은 고침 0건, 권고는 그대로(78% 축소). 스크린샷은 재생성되지 않아 잘림 해소는 확인하지 못했다.
