# 검수: Raft 합의 — 리더 선출과 로그 복제 (overview 한 장)

## 항목별 판정

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 과반수 floor(N/2)+1, N=5→3, 허용 장애 2대 | 통과 | scene.html:131 basis; shots/scene-t1s.jpg 하단 basis 줄 |
| 사실: 리더+팔로워 2=3개 커밋, 1=2개 미커밋 | 통과 | scene.html:58 caption; shots/scene-step8.jpg 자막 "B와 C 둘뿐이라 3개에 못 미쳐" |
| 사실: 투표 term+1, term당 한 표, 높은 term 보면 리더도 팔로워 | 통과 | scene.html:53–54; scene.html:64(A 팔로워 term 4). 해당 단계 캡처 없음 |
| 사실: election timeout 무작위, heartbeat 짧음 | 통과 | 화면에 주장 없음(scene.html 전체) |
| 사실: 후보 로그가 덜 최신이면 표를 못 받음 | 통과 | scene.html:63 caption |
| 사실: 커밋된 항목은 리더가 죽어도 지워지지 않음 | 통과 | scene.html:129 takeaway |
| 생성 순서: append → 복제 → 커밋 → ack → 팔로워 커밋 | 통과 | scene.html:56–61 (append 56, 복제 57, 커밋 59, ack 60, 팔로워 커밋 61) |
| 생성 순서: term 상승이 리더 선출보다 먼저 | 통과 | scene.html:53 (term 3) → 55 (리더) |
| 비트 1 정상: 카드 모두 term 2, 로그 1–2, commit 2 | 통과 | shots/scene-t1s.jpg |
| 비트 2 A 단절, B 타이머 만료 강조 | 통과 | 자막 "A의 heartbeat가 끊긴다" 캡처(A 단절 태그, B 강조) |
| 비트 3 B 후보 term 3, 투표 요청 | 통과 | 자막 "B가 후보가 되어 term을 3으로" 캡처(B 후보, term 3) |
| 비트 4 C·D·E 한 표씩, 3표 과반수 | 통과 | 자막 "C·D·E는 term 3에…" 캡처(C·D·E term 3) |
| 비트 5 B 리더, A는 term 2 유지 | 통과 | 자막 "B가 term 3의 리더가 된다" 캡처(B 리더, A term 2) |
| 비트 6 index 3 append, 미커밋 점선 칸 | 통과 | 자막 "클라이언트 쓰기가…" 캡처(B 로그 3:t3 점선) |
| 비트 7 AppendEntries B→C·D·E | 통과 | 자막 "B가 AppendEntries로…" 캡처 |
| 비트 8 C 저장, 2개라 미커밋 | 통과 | shots/scene-step8.jpg |
| 비트 9 D 저장 → 5개 중 3개 커밋, B commit 3 | 통과(코드) · 화면 미확인 | scene.html:59 (commit 3). shots에 9번 이후 캡처 없음(index는 step1–8) |
| 비트 10 커밋 뒤 클라이언트 ack | 실패 | scene.html:60 자막만 있고 그려지는 것이 없다(send 없음, 클라이언트 노드 없음). 노드 5개 고정이라 그릴 자리 없음 |
| 비트 11 heartbeat로 C·D commit 3, E 따라잡기 | 통과(코드) · 화면 미확인 | scene.html:61 |
| 비트 12 B 죽음, C 후보 term 4 | 통과(코드) · 화면 미확인 | scene.html:62 |
| 비트 13 D·E 표, C 리더 | 통과(코드) · 화면 미확인 | scene.html:63 |
| 비트 14 A 팔로워 term 4, index 3 따라잡기 | 통과(코드) · 화면 미확인 | scene.html:64 |
| 화면 글(제목·sub·label·caption·takeaway·recall·basis) | 통과 | scene.html:123–131 vs direction.md 화면 글 |
| lint overview-order | 실패 | shots/scene-audit.txt "고침 lint overview-order" (1440·1280 공통) |
| 화면 결함: 하단 잘림·겹침 | 실패 | shots/scene-t1s.jpg 하단: 어두운 띠(takeaway 쪽)가 하단 이전/다음 바에 가려 글이 안 보임 |
| 화면 결함: 겹침(노드·엣지·칸) | 통과 | shots/scene-step8.jpg: 노드 라벨·칸 겹침 없음 |
| 화면 결함: 빈 프레임 | 통과 | 모든 캡처에 그림·카드 있음 |
| 화면 결함: 움직임이 끝나지 않거나 멈춤 | 통과(코드) | player(ctl, steps), hold 2600 (scene.html:91, 105). 반복은 player 버튼 |
| 권고: shrunk 85%(1440) / 78%(1280) | 권고 | shots/scene-audit.txt. 고침 아님, 그대로 둠 |
| 권고: #ltt-checks 없음 | 권고 | shots/index.txt "checks" 행 |

## 실패 항목 처리 계획
- lint overview-order: 장면 구성을 고친다(overview 앞 summary, 뒤 keywords). 방향은 바꾸지 않는다.
- 비트 10 ack: 노드 5개와 direction 고정 구성 안에는 클라이언트를 그릴 자리가 없다. 자막은 유지하고 보고만 한다.
- 하단 잘림·겹침: 크기와 글은 direction 고정이라 장면 파일 안에서 줄이면 방향이 바뀐다. 보고만 한다.

## 고친 것
- lint overview-order: overview 앞에 summary 장면을 넣었다(scene.html:119–123, takeaway·recall 직접 작성).
- lint overview-order: overview 뒤에 keywords 장면을 넣었다(scene.html:136–141, terms 3개 직접 작성).
- lint used-before-defined(1차 수정 뒤 생김): summary의 takeaway에서 `과반수`를 `{{과반수}}`로 표시했다.
- 재audit 결과: 고침 0건(권고 shrunk 2건만 남음).
- 보고만 함(고치지 않음): 비트 10 클라이언트 ack 시각 없음, 하단 잘림·겹침.
- 화면 확인 못 함: shots에 비트 9 이후 캡처가 없어 9–14는 코드로만 확인했다.
