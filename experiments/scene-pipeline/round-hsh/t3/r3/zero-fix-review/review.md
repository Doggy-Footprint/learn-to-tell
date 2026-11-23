# 검수: Raft 합의 (overview)

기준: 스토리보드 사실 점검표, 생성 순서, 비트, 화면 결함. 근거의 scene-stepN.jpg는 shots/ 아래 파일이다.

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 과반수 = floor(N/2)+1, 5노드는 3 | 통과 | scene.html:44, :317 `LTT.expect`; scene-step3.jpg "3/5 ≥ 과반수 3" |
| 사실: 허용 장애 = N − 과반수 = 2 | 통과 | scene.html:318; 캡션 ⑧ scene.html:71 |
| 사실: 리더 포함 2개는 미커밋, 3개는 커밋 | 통과 | scene-step5.jpg "리더 포함 2개 … 과반수가 아니다"; scene-step6.jpg commitIndex 2 |
| 사실: 후보가 되는 순간 term+1, 노드는 term당 한 표 | 통과 | scene.html:65; scene-step2.jpg "term 2 · 후보" |
| 사실: 더 높은 term을 보면 리더가 팔로워로 내려감 | 통과 | 장면에서 다루지 않음. 위배 없음 |
| 사실: election timeout은 노드마다 다름 | 통과 | scene.html:53 timer [55,100,35,70,25]; scene-step1.jpg |
| 사실: 후보 로그가 덜 최신이면 표를 받지 못함 | 통과 | scene.html:270–273 "거절: 로그가 뒤짐"; scene-step8.jpg |
| 사실: 커밋 항목은 덮어써져도 지워지지 않음 | 통과 | scene-step8.jpg N1·N3·N4의 #2 · t2 x=7 유지 |
| 생성 순서: 리더 append → 복제 → 커밋 | 통과 | scene-step4.jpg(N2만 미커밋) → step5 → step6 |
| 생성 순서: term 상승이 리더 결과보다 먼저 | 통과 | scene-step2.jpg → scene-step3.jpg |
| 생성 순서: 팔로워 commitIndex는 한 박자 늦음 | 통과 | scene-step6.jpg(N3·N4 commitIndex 1) → scene-step7.jpg |
| 생성 순서: ack는 커밋 이후 | 통과 | scene.html:256, 커밋 render(S[5]) 뒤에 clientPkt |
| 비트 1: 리더 heartbeat 끊김, 팔로워 타이머가 먼저 만료 | 실패 | scene-step1.jpg 노드 5개가 모두 "term 1 · 팔로워"이고 리더가 없다. 캡션 ①의 "리더"가 화면에 없다 (scene.html:53) |
| 비트 2: 후보가 term+1, 과반수 3표로 리더 | 통과 | scene-step2.jpg, scene-step3.jpg |
| 비트 3: 쓰기가 리더 로그에 들어가되 미커밋 | 통과 | scene-step4.jpg N2의 점선 칸 |
| 비트 4: 3번째 저장 확인 순간 커밋 경계 | 통과 | scene-step6.jpg commitIndex 2 |
| 비트 5: 커밋 항목을 가진 노드만 새 리더 | 통과 (캡처 한계) | scene-step8.jpg는 거절 점이 이동 중이라 N3 리더 상태가 캡처되지 않음. 코드는 render(S[7])로 끝남 (scene.html:282) |
| 비트 6: 저장소 선택 (쓰기마다 과반수 왕복 ↔ 2대 장애까지 무손실) | 통과 | scene.html:312 캡션 |
| 화면: 노드 5개 (리더 1, 팔로워 4) | 실패 | scene-step1.jpg에 리더 없음. scene-step3~8은 N2가 리더 |
| 화면: 관계 (투표 요청·응답, AppendEntries, commitIndex 경계) | 통과 | scene-step2·5·7의 점선 패킷과 라벨 |
| 화면: 강조점 "과반수 3 = 커밋" | 통과 | scene-step6.jpg 커밋 전환 (합계 위젯 잘림은 아래 행) |
| 결함: 캡션 중복 | 실패 | scene-step1~8.jpg 상단 검은 캡션(scene.html:79, :290)과 하단 stepper 캡션이 같은 문장 |
| 결함: 겹침 | 실패 | scene-step4.jpg "commitIndex 1"을 클라이언트 점선이 지나고 "쓰기 x=7"과 겹친다 (scene.html:102, :188) |
| 결함: 잘림 | 실패 | scene-step5~8.jpg 페이지가 밀려 상단 제목과 합계 위젯 "저장한 노드 n/5"(scene.html:112–115)가 잘린다 |
| 결함: 읽을 수 없는 글 | 실패 | scene-step1.jpg 칸·타이머 글자가 약 6–7px (SVG 12px × 축척 약 0.55). audit small-visual과 같은 원인 |
| 결함: 빈 프레임 | 통과 | scene-t4s.jpg·t8s.jpg는 step1 안정 상태 (타이머 1.4s 뒤 정지) |
| 결함: 끝나지 않는 움직임 | 통과 | 모든 pkt가 done 경로를 가짐 (scene.html:171–175) |

## 고친 것

- 비트 1 / 화면 노드 5개: S[0] 첫 상태의 N1을 리더(`l`)로 바꿨다 (scene.html:53).
- 캡션 중복: 상단 `.cap` 요소와 CSS, `cap.innerHTML` 대입을 지워 stepper 캡션만 남겼다 (scene.html:79, :30–31, :290).
- 겹침: commitIndex 라벨 x를 600에서 510으로 옮겨 클라이언트 점선과 떨어뜨렸다 (scene.html:102).
- 잘림: 캡션 중복을 지워 높이를 줄인 것이 원인 제거다. 재캡처로 확인하지 않았다. audit 축척은 78%에서 80%로 올랐다.
- 미수정: 읽을 수 없는 글 (권고 small-visual과 같은 원인). 그림 축척을 키우는 배치 결정이 필요하다.
- 참고: 단계 1→2에서 N1이 리더에서 팔로워로 바뀌는데 장면이 이를 설명하지 않는다. 작성자 확인 필요.
