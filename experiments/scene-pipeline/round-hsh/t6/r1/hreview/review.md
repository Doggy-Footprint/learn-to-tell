# 검수: 가비지 컬렉션 방식 (contrast, terminal)

대상: `scene.html` · 근거 자료: `storyboard.md`, `direction.md`, `shots/scene-t1s.jpg`·`scene-t4s.jpg`·`scene-t8s.jpg`, `shots/scene-audit.txt`(고침 0건)

## 사실 점검·생성 순서·비트·화면 결함

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 생성 직후 A=1, B=1, B.prev=A 뒤 A=2, C=1 | 통과 | `scene.html:36-43` 간선으로 세는 `node()` 카운트 `scene.html:97`; scene-t8s RC 로그 `rc(A)=2` |
| 사실: 루트→A 해제 뒤 A=1, B=1, C=1 | 통과 | `scene.html:44-45` (`rA` 제거, `BA`·`AB` 유지) |
| 사실: RC 잔류 2개, M&S mark {root, C}, 해제 {A, B} | 통과 | `scene.html:98` (`bad`), `scene.html:100-102`, `scene.html:124` (sweep 뒤 도달 불가 노드 제외) |
| 사실: 카운트 = 들어오는 간선 수 | 통과 | `scene.html:97` |
| 사실: 약한 참조는 화면에 없음(곁다리) | 통과 | 코드에 없음, 스토리보드상 필수 아님 |
| 생성 순서: A → B → C, 카운트 시작 1 | 통과 | `scene.html:36-43`; 스토리보드 22행 "B=2"는 점검표와 어긋나지만 코드는 점검표를 따른다(step1 B=1) |
| 생성 순서: M&S mark가 sweep보다 먼저 | 통과 | `scene.html:46` (mark) → `scene.html:48` (sweep) |
| 비트 1: 같은 그래프, 두 방식 모두 전부 생존 | 통과 | `scene.html:36-43`; scene-t8s 양쪽 패널 |
| 비트 2: 카운트 A=2, B=1, C=1 | 통과 | `scene.html:41`, `scene.html:43`, `scene.html:97` (그림 숫자는 작아 화면 확인 불가, 아래 글자 항목 참조) |
| 비트 3: 루트→A 끊김, A=1, B=1, 점선 표시 | 통과 | `scene.html:44-45`, `scene.html:117` (`끊김` 점선) |
| 비트 4: RC A·B 잔류, 누수 로그 | 통과 | `scene.html:98`, `scene.html:61-62` |
| 비트 5: M&S mark는 root·C만 | 통과 | `scene.html:46-47`, `scene.html:100-102` |
| 비트 6: sweep 뒤 A·B 그림에서 제거 | 통과 | `scene.html:48-49`, `scene.html:124` |
| 강조: A↔B 간선이 카운트를 붙든 순간 | 통과 | `scene.html:45` (`hot`), `scene.html:114` (`accent`) |
| 빈 프레임 | 통과 | scene-t1s·t4s·t8s 모두 노드가 있음 |
| 움직임: 멈추지 않음·reduced-motion 처리 | 통과 | `scene.html:75`, `scene.html:141` (2.4초 순환, reduced면 마지막 단계) |
| 조작: RC 쪽 이전/다음 | 통과 | `scene.html:170-178` |
| 자막 분리: RC/M&S 용어 분리(direction 결함 해소) | 통과 | `scene.html:36-49` (`rc`·`ms` 쌍) |
| 화면 결함: 겹침 — RC 로그 창이 캡션·이전/다음 줄과 겹치고 RC 패널이 좌측으로 치우침 | 실패 | scene-t1s, scene-t4s, scene-t8s; 버튼 행이 `box` 밖에 있음 `scene.html:171-178` |
| 화면 결함: 잘림 — 로그 줄이 접혀 패널이 하단 바를 밀어내고 '핵심' 바가 안 보임 | 실패 | scene-t8s 하단 (패널이 내비게이션 아래로 잘림) |
| 화면 결함: 읽을 수 없는 글 — 다이어그램 노드·카운트 글자가 약 6–7px | 실패 | scene-t1s·t4s·t8s의 RC/M&S 그림 (`루트`, `객체 A`), 격자 `scene.html:126` (`cell 180×120`, `node 116×56`) |
| 화면 결함: 읽을 수 없는 글 — 로그 제목 "힙 로그 · 참조 카운팅"이 3줄로 접힘, `new A rc=1`처럼 한 줄이 쪼개짐 | 실패 | scene-t1s, scene-t8s RC 로그 (`scene.html:160-163`) |
| 화면 결함: 흐려짐이나 남은 빨간 노드 혼선 | 통과 | scene-t4s·t8s에서 RC A·B 빨간 표시가 M&S 쪽과 구분됨 |

## 판정 요약

- 실패 4건: 겹침, 잘림, 읽을 수 없는 글(그림), 읽을 수 없는 글(로그 제목·줄).
- 사실·순서·비트·강조는 코드와 스토리보드를 대조해 모두 통과.
- 방향(`direction.md`)과 통과 항목은 건드리지 않는다.
- audit은 겹침·잘림·글자 크기를 잡지 못했다(scene-audit.txt "고침 0건"). 그래서 위 실패는 스크린샷 근거로 판정했다.

## 고칠 방법

- 그림 격자 크기를 줄여 글자가 커지고 패널 높이가 줄도록 한다(`scene.html:126`).
- `.cmp` 안의 그림과 로그가 칸 폭을 넘지 않도록 CSS를 준다(`scene.html:15-18`).
- 그림·로그·버튼 구조와 자막, 단계 데이터는 바꾸지 않는다.

## 고친 것

- 겹침(RC 로그·버튼 행): `.cmp-ctl`에 `position: relative; z-index: 1`을 줘 버튼 행이 로그 위에 남게 했다(`scene.html:17`). 스크린샷으로 다시 확인하지 못했다.
- 잘림(t8s 하단 '핵심' 바): 그림 격자를 줄여 패널 높이를 낮췄다(`scene.html:126`). 다시 확인하지 못했다.
- 읽을 수 없는 글(다이어그램): 격자 `cell` 180×120 → 120×90, `node` 116×56 → 100×44로 줄이고 `.cmp > svg`를 칸 폭에 맞췄다(`scene.html:15-16`, `scene.html:126`).
- 읽을 수 없는 글(로그 제목·줄 접힘): `.cmp`를 칸 폭 100%로 고정해 로그가 좁아지는 것을 막았다(`scene.html:15`). 간접 대응이며 제목이 한 줄로 나오는지는 확인하지 못했다.

audit 재실행 결과: 고침 0건(`audit.mjs scene.html`). audit은 위 겹침·잘림·글자 크기를 잡지 못하므로 0건이 시각 결함이 없다는 뜻은 아니다.
