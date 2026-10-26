# 검수: 가비지 컬렉션 방식 (contrast)

| 항목 | 판정 | 근거(스크린샷 또는 코드 위치) |
| --- | --- | --- |
| 사실: 생성 직후 A=1, B=1, B.prev=A 뒤 A=2, C=1 | 통과 | scene.html `graph()` i=2 `aCount=2`, `ltt-checks` after_b_prev / t4s |
| 사실: 루트→A 해제 뒤 A=1, B=1, C=1 | 통과 | `graph()` i=4 / t8s RC `rc(A)=1` |
| 사실: RC 결과 A·B 잔류(누수 2개), C 생존 | 통과 | `graph()` rc i≥4 `bad` / `CAP.rc[5]` |
| 사실: M&S mark={root, C}, sweep={A, B} | 통과 | `graph()` i=5 `unmarked`, i≥6 `dead` / `ltt-checks` ms |
| 사실: 간선 수 = 카운트 합 | 통과 | t4s·t8s의 A·B 카운트 |
| 사실: RC 즉시 해제 vs M&S 수거 주기 지연 | 통과 | `CAP.ms[4]` "수거 주기가 오기 전이라" |
| 사실: 약한 참조 곁다리 | 통과 | 화면 필수 아님, 생략 |
| 생성 순서: A → B → B.prev=A → C → 루트 해제 | 통과 | `graph()` 노드·간선이 i 순서로 추가 / `CAP.rc[0..4]` |
| 생성 순서: M&S mark가 sweep보다 먼저 | 통과 | `CAP.ms[5]` mark, `CAP.ms[6]` sweep |
| 비트 0~4 (생성, 카운트, B.prev, C, 루트 끊김 강조) | 통과 | t1s, t4s, t8s, `graph()` i=4 `accent` 간선 |
| 비트 5: M&S mark(root·C) → sweep(A·B) | 통과 | `graph()` i=5·6 (스크린샷은 t8s까지라 코드로 확인) |
| 비트 6: 진단 "의심"과 "해결(순환 끊기·weak ref)" | 실패 | `CAP.rc[6]`에 해결 없음. takeaway는 의심만 말함 |
| 화면: 제어 줄 설명이 세로 한 글자씩 줄바꿈, "자동 재생" 2줄 | 실패 | t1s·t4s·t8s 좌하단 `.gc-ctl`, `.gc-ctl span` flex 축소 |
| 화면: 하단 핵심 문장이 nav에 잘림 (1280x800) | 실패 | t1s·t4s·t8s 하단 핵심 박스. 원인은 위 제어 줄 높이 |
| 화면: 그림 글자 읽을 수 없음 (3열 그림이 약 253px 칸에 축소, 글자 약 5px) | 실패 | t1s·t8s 좌측 svg / `graph()` `cols: 3`, `cell: [170, 110]` |
| 화면: 캡션·터미널 겹침 | 통과 | t1s·t4s·t8s 캡션 아래 간격 확보 |
| 화면: 빈 프레임 | 통과 | 모든 확인 단계에 그림·캡션·터미널 있음 |
| 화면: 움직임이 멈추지 않음 / 멈추는 곳 | 통과 | 단일 장면, 타이머는 views 없으면 정리, reduced-motion은 최종 상태 |
| 로드: audit `load` 오류 `(checks || []) is not iterable` | 통과 | 재검사(audit 1회차)에서 오류 없음. `shots/scene-index.json`의 load 기록은 이전 실행분. `ltt-checks`는 그대로 둠 |

판정 요약: 실패 4건 (비트 6, 제어 줄, 하단 잘림, 그림 글자). load는 재검사에서 재현되지 않아 통과로 정정.

## 고친 것
- 비트 6: `CAP.rc[6]`에 "순환을 끊거나 weak ref로 푼다" 해결 문장을 추가했다.
- 제어 줄: `.gc-ctl`에 `flex-wrap`, 설명 `span`은 한 줄 전폭, 버튼은 `nowrap`으로 바꿨다.
- 하단 잘림: 제어 줄이 한 줄로 줄어 카드 높이가 내려간다. 같은 CSS 수정으로 처리했고 스크린샷 재촬영은 하지 않았다.
- 그림 글자: `graph()`를 3×2에서 2×2로 바꾸고 칸 150×84, 노드 116×44로 줄였다. B는 (1,1)로 옮겼다.
