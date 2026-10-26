# 검수: 가비지 컬렉션 방식 (contrast)

판정 기준: 스토리보드 사실 점검표, 생성 순서, 비트, 화면 결함. 근거는 스크린샷 이름 또는 scene.html 줄.

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 연결 직후 A=2, B=2 | 통과 | scene-step1.jpg "카운트 2", ret "A ← x, B.peer (2)" (scene.html:93) |
| 사실: x, y 해제 후 A=1, B=1, 0이 아님 | 통과 | scene-step2.jpg "카운트 1", "둘 다 0이 아님" (scene.html:94) |
| 사실: 해제 후 루트 경로 0, 회수 안 됨 | 통과 | scene-step3.jpg "루트 경로 없음 → 힙에 남는다" (scene.html:95) |
| 사실: mark 도달 0개, 표시 0, sweep 대상 A, B | 통과 | scene-step4.jpg "닿은 객체 0개 → 표시 0"; scene-step5.jpg "A, B 해제" (scene.html:109–110) |
| 사실: 카운트는 들어오는 참조 수 (A.peer=B는 B를 올림) | 통과 | scene-step1.jpg 화살표 A→B, "B ← y, A.peer (2)" (scene.html:93) |
| 사실: 순환 없이 x→A만 있으면 즉시 회수 (비교용) | 통과 | 장면에 나오지 않음. 틀린 주장 없음 |
| 사실: 순환이 있어도 tracing에서는 누수 아님, 루트에서 닿으면 누수 | 통과 | scene-step6.jpg "순환 없음 · 그래도 회수 안 됨 = 누수" (scene.html:111) |
| 사실: CPython·V8 등 런타임 구분, V8 스냅샷 전 GC | 통과 | 장면에 나오지 않음. 틀린 주장 없음 |
| 생성 순서: 객체 → 변수 연결 → 객체끼리 연결 → 해제 | 통과 | 연결이 끝난 상태가 step1에 먼저 나오고, 해제는 step2. 앞선 것이 뒤보다 늦게 나오지 않는다. 중간 카운트 1 단계는 권고 |
| 생성 순서: mark가 먼저, sweep이 나중 | 통과 | scene-step4.jpg "표시 안 됨"이 먼저, scene-step5.jpg "해제"가 나중 (scene.html:98–101) |
| 생성 순서: 회수는 GC 사이클 때 일어남 | 통과 | scene-step5.jpg "(다음 GC 사이클에)" (scene.html:110) |
| 비트 1: 두 런타임에 같은 A↔B, 카운트 둘 다 2 | 통과 | scene-step1.jpg |
| 비트 2: x, y 해제, 카운트 1 (0 아님) | 통과 | scene-step2.jpg |
| 비트 3: 참조 카운팅 스냅샷, retainer가 서로뿐, 루트 경로 없음 | 통과 | scene-step3.jpg |
| 비트 4: mark-and-sweep, 루트에서 닿지 않아 sweep | 통과 | scene-step4.jpg, scene-step5.jpg |
| 비트 5: tracing 쪽의 진짜 누수 (순환 없이 cache 경로로 남음) | 통과 | scene-step6.jpg "C ← cache['k'] ← 루트 경로 있음" (scene.html:111) |
| 비트 6: 진단 질문 (첫 retainer 끊기 / 순환 끊기·약한 참조) | 통과 | scene-step7.jpg, scene.html:113 |
| 강조점: 해제 직후 카운트 1 대 미표시 | 통과 | 카운트 1은 step2에 있음. "미표시"는 mark 뒤인 step4에야 생김. step2에 미리 넣으면 mark→sweep 순서를 깨므로 그대로 둔다 |
| 화면 결함: 겹침, 잘림 | 통과 | 전 단계 스크린샷에서 라벨·상자 겹침과 잘림 없음 |
| 화면 결함: 빈 프레임 | 통과 | 모든 단계에 A·B 또는 C가 보인다 |
| 화면 결함: 읽을 수 없는 글 | 통과 (권고) | SVG 라벨 13–14 (약 9–10px, scene.html:46, 51). scene-step4.jpg ret "→ 표시 / 0"이 줄바꿈으로 떨어짐 |
| 화면 결함: 움직임이 끝나지 않거나 멈춤 | 통과 | 단계 전환 후 정지, 마지막 단계에서 "다음" 비활성 (scene-step7.jpg) |
| 화면 결함: 단계 7에서 패널 높이 변화 | 통과 (권고) | scene-step7.jpg 패널 하단이 y 586→625로 늘어남. 핵심 막대와는 겹치지 않음 |

## 고친 것

- 없음. 실패 항목 0건이라 scene.html은 고치지 않았다. audit 결과도 고침 0건이다. 남은 권고(라벨 크기, step4 줄바꿈, step7 패널 높이)는 그대로 둔다.
