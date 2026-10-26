# 검수: Raft 합의 장면 (overview)

대상: `scene.html` · 기준: `storyboard.md`, `direction.md`, `shots/` (step1–step8, t1s·t4s·t8s)
참고: `shots/index.txt`에는 step9·step10 스크린샷이 없다. 그 두 단계는 코드로 판정한다.

## 판정

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 과반수 = floor(N/2)+1, N=5면 3 | 통과 | `scene.html` MAJ·`LTT.expect` (29, 123행) |
| 사실: 짝수 대수는 이득 없음 | 통과 | 장면에 없음. 틀린 주장도 없음 |
| 사실: 예시 index 7, 과반 저장이면 커밋, S5는 없어도 됨 | 통과 | steps 9 (91행) |
| 사실: 한 term에 리더 한 명, 서버는 표 한 장 | 통과 | 77행(표 한 장), 83행(리더 한 명) |
| 사실: 높은 term이면 리더 하강, 커밋 불멸, 무작위 timeout | 통과 | 장면에 없음. 틀린 주장도 없음 |
| 생성 순서: 후보·term → RequestVote → 리더 → 미커밋 기록 → 복제 → 커밋 → 팔로워 커밋 | 통과 | step3→4→5→7→8 순서 일치. step9·10은 코드 기준 |
| 비트 1: timer → 후보 | 통과 | step2, step3 |
| 비트 2: 표 → 3/5 리더 | 통과 | step5 "S3 리더 · 표 3/5" |
| 비트 3: heartbeat → 나머지 팔로워 | 통과 | step6 |
| 비트 4: 요청 → index 7 미커밋 | 통과 | step7 "1–6 · 7 미커밋" |
| 비트 5: 복제 응답 3/5 → 커밋 | 통과 (코드 기준) | 91–93행, STATES[8]. step9 스크린샷 없음 |
| 비트 6: 과반을 못 모으면 멈춤 | 통과 | takeaway 143행 |
| 화면: 서버 5대 · 역할 · term · 로그 | 통과 | step1 5칸 띠. 로그 칸별 term은 없고 띠 형식은 direction.md의 선택 |
| 화면: 투표·복제 화살표 | 실패 | step4 패킷이 2–3px 점이고, step5 표 패킷은 보이지 않는다. 방향이 읽히지 않음 |
| 화면: 과반 표시 3/5 | 통과 | step5 "표 3/5", `LTT.expect` 3 |
| 화면: 강조점(과반이 선출·커밋에서 같은 역할) | 통과 | takeaway 143행, 141행 caption |
| 화면 결함: 잘림 | 실패 | step4–step8: 하단 "핵심" 띠가 footer에 가려짐. caption 길이에 따라 figure 폭이 약 570px까지 늘어나 높이가 커짐 |
| 화면 결함: 읽을 수 없는 글 | 실패 | step1–step8: 그림 속 S1–S5 글자가 약 5px. audit small-visual 19%(1440), 14%(1280) |
| 화면 결함: 겹침·빈 프레임·멈춤 | 통과 | step1–step8 |
| lint overview-order (고침) | 실패 | `shots/scene-audit.txt` 1440·1280 두 곳 고침 2건. summary·keywords 장면이 없음 |

## 권고 (그대로 둠)

- small-visual, shrunk(1280 82%), no-signature: 권고이므로 이번에는 손대지 않는다.
- `#ltt-checks`가 없다(`shots/index.txt` checks 행). 기준에 없어 판정 제외.

## 고친 것

- 잘림(step4–8 핵심 띠): `.raft-fig`에 폭 520px 고정. caption 길이에 따라 그림이 커지던 것을 막았다. audit은 잘림을 잡지 않으므로 화면 확인 필요.
- 읽을 수 없는 글(그림 속 S1–S5): SPEC `cell` [240,140]→[150,80], `node` [176,64]→[128,40]. 그림 축척을 키웠다. small-visual 권고(18%/14%)는 남는다.
- lint overview-order: summary 장면(카드 3, 카드마다 recall)을 overview 앞에, keywords 장면(용어 4, queries, neighbors 1)을 뒤에 추가했다. 카드·keywords 필드 형식은 audit 통과로만 확인했다.
- 투표·복제 화살표: 미수정. 패킷이 2–3px 점이라 크기를 키우는 옵션이 필요하고, 부품 문서를 읽을 수 없어 보류했다.
