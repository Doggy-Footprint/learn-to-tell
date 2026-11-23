# 검수: 가비지 컬렉션 방식 (contrast)

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 생성 직후 A=1, B=1, B.prev=A 뒤 A=2, C=1 | 통과 | scene.html graph() `aCount = i>=2&&i<=3 ? 2 : 1`, 노드 라벨 `rc N` |
| 사실: 루트→A 해제 뒤 A=1, B=1, C=1 | 통과 | graph() i=4, CAP.rc[4] |
| 사실: RC 결과 A·B 생존, C 생존 | 통과 | graph() rc 쪽은 dead 없음, LOG.rc[6] |
| 사실: M&S mark={root, C}, sweep={A, B} | 통과 | graph() i=5 unmarked, i>=6 dead, CAP.ms[5]·CAP.ms[6] |
| 사실: 카운트 = 들어오는 간선 수 | 통과 | edges r-a, a-b, b-a, r-c로 계산한 값과 일치 |
| 사실: RC 즉시 해제 / M&S 수거 주기 지연 구분 | 통과 | CAP.ms[4] "수거 주기가 오기 전이라", CAP.rc[5] |
| 사실: 약한 참조 곁다리 | 통과 | 화면 필수 아님, 화면에 없음 |
| 오해를 깨는 순간 | 통과 | CAP.rc[4]와 CAP.ms[5]가 같은 A·B를 다르게 표시 |
| 생성 순서 | 통과 | graph() 노드 추가 순서 A(0), B(1), prev 간선(2), C(3), 루트 끊김(4), mark(5), sweep(6). 스토리보드 생성 순서 절의 "B=2"는 뒤의 정정(B=1)을 따름 |
| 비트 0: A 생성 | 통과 | shots/scene-t1s.jpg |
| 비트 1: B 생성 | 통과 | shots/scene-t4s.jpg |
| 비트 2: B.prev=A, A=2 | 통과 | shots/scene-t8s.jpg 터미널 "rc(A)=2", graph() i=2 |
| 비트 3: C 생성 | 통과 | shots/scene-t8s.jpg 캡션 "루트가 C를 잡는다", 로그 "new C" |
| 비트 4: 루트→A 점선 끊김, A=1 B=1 | 통과 | 스크린샷 없음. graph() i=4 점선 bad 간선, CAP.rc[4] |
| 비트 5: RC 그대로 / M&S mark | 통과 | 스크린샷 없음. graph() i=5 |
| 비트 6: RC 누수 / M&S sweep | 통과 | 스크린샷 없음. graph() i=6, LOG.rc[6], LOG.ms[6] |
| 겹침: 좌측 패널 컨트롤 줄 | 실패 | shots/scene-t1s.jpg, t4s, t8s: "두 쪽이 같은 순서로 함께 넘어간다" 문구가 좁은 열로 찌그러져 그림·터미널 옆에 얹힘. scene.html panel() 안에서 `.gc-ctl`이 그림 box와 같은 가로 행에 들어감 |
| 잘림: 좌측 그림·터미널 | 실패 | shots/scene-t1s.jpg, t4s, t8s: BEFORE 쪽 그림과 터미널이 카드 왼쪽 밖으로 잘림. 같은 원인 |
| 잘림: 하단 핵심 박스 | 실패 | shots/scene-t4s.jpg, t8s.jpg: 핵심 박스가 하단 이전/다음 버튼 영역에 가려짐. 패널 높이가 커진 탓 |
| 읽을 수 없는 글 | 실패 | shots/scene-t1s.jpg: AFTER 그림의 노드·간선 라벨이 극소형. graph() cell [210,120], node [120,58]이 좁은 칸에 들어가 축소됨 |
| 빈 프레임 | 통과 | 세 장 모두 그림과 터미널이 보임 |
| 움직임이 끝나지 않거나 멈추는 곳 | 통과 | 자동 재생은 설계된 반복(restart, LAST 순환). reduced-motion은 LAST 정적 표시(REDUCED, 101행·113행). show()가 끊긴 뷰를 정리 |
| checks: #ltt-checks 블록 | 실패 | shots/index.txt checks 행 "#ltt-checks 없음 또는 JSON 오류". scene.html에 해당 블록 없음 |
| audit 결과 해석 | 참고 | shots/scene-audit.txt "고침 0건"은 위 겹침·잘림·글자 문제를 잡지 못함. 화면과 audit이 어긋남 |

실패 항목: 5건(겹침, 잘림 좌측, 잘림 하단, 읽을 수 없는 글, checks 블록).

## 고친 것
- 겹침: panel()이 그림 box와 `.gc-ctl`을 `.gc-wrap` 세로 래퍼 안에 넣어 컨트롤 줄이 그림 옆 행에 끼지 않게 함.
- 잘림 좌측: `.gc-wrap` 규칙으로 그림·터미널 폭을 카드 안에 맞춤.
- 잘림 하단: 같은 래퍼 수정으로 찌그러진 컨트롤 줄의 높이가 사라져 핵심 박스 가림이 해소되도록 함(화면 재확인 전).
- 읽을 수 없는 글: graph() 칸 크기 cell [210,120]→[170,110], node [120,58]→[112,52].
- checks: head에 `#ltt-checks` JSON 블록 추가(사실 점검표의 손 계산 값).
