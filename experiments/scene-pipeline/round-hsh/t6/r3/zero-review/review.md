# 검수: 가비지 컬렉션 방식 (contrast)

기준: storyboard.md, direction.md(작성자 방향 기록 없음), scene.html, shots/ 스크린샷(t1s·t4s·t8s·step1–5).

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 카운트 손계산 (a·b 루트, 연결 후 2,2, 해제 후 1,1) | 통과 | scene.html:90 rc 배열 `["1","1"],["2","2"],["1","1"]`, scene-step2.jpg, scene-step3.jpg |
| 사실: 쌍 1 MB, 100회 누적 | 통과 | scene.html:39·41 주석, scene-step5.jpg (기준선 4 + 100 = 104 MB 표기) |
| 사실: mark 톱니 4~20 MB, 기준선 불변 | 통과 | scene.html:41 (`heap >= 20` 리셋 4), scene-step5.jpg |
| 사실: 화살표 방향 (들어오는 수 / 루트에서 나가는 화살표) | 통과 | scene.html:49–54 marker-end, scene-step2.jpg |
| 사실: 카운팅 장점, CPython 순환 감지기 명시 | 통과 | scene.html:122 basis, scene-t1s.jpg 하단 근거 줄 |
| 사실: 스냅샷 객체 목록 (클래스·개수·크기) | 통과 | scene.html:103 "A·B 200개, 약 100 MB 증가", scene-step5.jpg (클래스 이름 A·B 텍스트로 표기) |
| 생성 순서 1: 객체 생성 rc 1, 1 (루트만) | 통과 | scene-step1.jpg, scene.html:96 |
| 생성 순서 2: 연결 후 rc 2, 2 (루트 아직 쥠) | 통과 | scene-step2.jpg, scene.html:97 |
| 생성 순서 3: 루트 해제 즉시 2→1, mark 쪽 변화 없음 | 통과 | scene-step3.jpg, scene.html:98 |
| 생성 순서 4: mark는 GC 시점에 회수 | 통과 | scene-step4.jpg (ms-A·ms-B dim), scene.html:99 |
| 생성 순서 5: 쌍 누적, 카운팅 남고 mark는 GC로 떨어짐 | 통과 | scene-step5.jpg |
| 비트 1: A, B 서로 가리키며 루트가 쥠 | 통과 | scene-step2.jpg |
| 비트 2: 루트 놓는 순간 카운팅 1, 1에서 멈춤, mark 무변화 | 통과 | scene-step3.jpg |
| 비트 3: GC 시점 A, B 표시 없이 회수 | 통과 | scene-step4.jpg |
| 비트 4: 타임라인 카운팅 상승, mark 톱니 | 통과 | scene-step5.jpg |
| 비트 5: 스냅샷 200개, retainers가 서로뿐 | 통과 | scene-step5.jpg, scene.html:103 |
| 비트 6: 반전 (전역 캐시가 쥐면 누수) | 통과 | scene.html:104 ms-snap 2번째 줄 (텍스트로만 표기, 권고) |
| 화면 결함: 겹침 — rc 타임라인 라벨 "104 MB, 계속 오름"이 빨간 선과 겹침 | 실패 | scene-step5.jpg (라벨 가로지르는 선), scene.html:66 `py(104) + 14` |
| 화면 결함: 잘림 | 통과 | scene-t1s.jpg, scene-step5.jpg 모든 텍스트 박스 안 |
| 화면 결함: 빈 프레임 | 통과 | 단계 1–4 타임라인은 축만 있는 누적 전 상태 (의도). scene-step1.jpg |
| 화면 결함: 읽을 수 없는 글 | 통과 | 축·주석 10–11px (scene.html:48, 55, 62–64). 렌더 약 9px, 읽힘. 권고: kit 글자 단계 |
| 화면 결함: 움직임이 끝나지 않거나 멈춤 | 통과 | scene.html:83 선 그리기 2.2s 후 정지, scene-step5.jpg |
| 스토리보드 내부 불일치 (참고) | 통과 | storyboard.md 인과 사슬 2항 "B는 1로 그대로"와 사실 점검표 "B 2→1"이 다름. 장면은 점검표·비트를 따름. 스토리보드 정정 권고 |

## 판정 요약
- 실패 1건: 화면 겹침 (step 5, rc 타임라인 라벨).
- 고칠 것: scene.html:66 라벨 y 좌표를 선 아래 빈 영역으로 옮긴다.

## 고친 것
- 화면 겹침: rc 타임라인 라벨 y를 `py(104) + 14`에서 `py(30)`으로 옮겨 빨간 선 아래 빈 영역에 둠 (scene.html:66).
