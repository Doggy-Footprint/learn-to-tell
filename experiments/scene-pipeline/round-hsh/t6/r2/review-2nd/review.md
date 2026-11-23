# 검수: 가비지 컬렉션 방식 (contrast)

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 연결 직후 A 카운트 2, B 카운트 2 | 통과 | scene.html:50 expect, step4 `카운트 A 2 · B 2` |
| 사실: x 해제 → A=1, y 해제 → B=1 | 통과 | scene.html:51-52 expect, step5 `카운트 A 1 · B 1` |
| 사실: 해제 후 루트에서 닿는 객체 0개 | 통과 | step5 `루트에서 닿는 경로 0개`. 권고: scene.html:53은 roots가 빈 배열이라 항상 0을 내는 동어반복 |
| 사실: 순환 없는 x→A 단독은 즉시 회수 | 통과 | step8 rc 캡션 `x→A뿐이면 즉시 회수`, scene.html:73 |
| 사실: 카운트는 들어오는 참조, A.peer=B는 B를 올림 | 통과 | step3 `카운트 A 1 · B 2`, scene.html:41 주석 |
| 사실: mark 표시 0개, sweep 대상 A·B | 통과 | step6 `mark: 루트에서 출발 → 표시 0개`, step7 `sweep` |
| 사실: 순환이 없어도 루트 경로가 있으면 누수 | 통과 | step8 ms `객체 C 표시 ✓`, 전역 캐시 경로 |
| 사실: CPython 순환 탐지 보조, JVM·V8·Go는 tracing | 통과 | 화면 basis 줄 `모델로 계산한 예시…` (scene.html:177) |
| 사실: V8 스냅샷은 취득 전 GC | 통과 | 화면에 스냅샷 시점 표시 없음. 모순 없음 |
| 생성 순서: 객체 → 변수 → A.peer → B.peer → 해제 → GC | 통과 | step1 객체, step2 변수, step3 A.peer, step4 B.peer, step5 해제, step6 GC |
| 생성 순서: 순환은 해제 전에 완성 | 통과 | step4 `순환 완성`, step5에서 해제 |
| 생성 순서: mark가 sweep보다 먼저 | 통과 | step6 mark(`표시 ✗`), step7 sweep |
| 생성 순서: 회수는 GC 사이클 시점 | 통과 | step5 카운트 1 유지, step6 `GC 사이클` |
| 비트 1: A, B 생성, 카운트 0 | 통과 | step1 |
| 비트 2: x, y 연결 1·1, 해제 후 1·1 | 통과 | step2, step5 |
| 비트 3: rc retainer가 서로뿐, 루트 경로 없음 | 통과 | step7 rc `루트 경로 없이 서로만 붙잡는 순환` |
| 비트 4: ms mark가 A·B에 닿지 않고 sweep | 통과 | step6, step7 |
| 비트 5: tracing 쪽 진짜 누수(전역 캐시) | 통과 | step8 ms `루트 → 전역 캐시 → C 표시됨` |
| 비트 6: 진단 질문 | 통과 | step8 캡션 `먼저 '루트에서 경로가 있나?'`, scene.html:176 recall |
| 강조점: 해제 직후 카운트 1 vs 미표시 | 통과 | step5 rc `카운트 1`. 권고: step5 ms 라벨이 `표시 —`(미실행)이라 `표시 안 됨`보다 모호 |
| 기본 화면 t1s·t4s·t8s | 통과 | 세 장이 step1과 같다. 수동 단계 장면이라 자동 진행이 없으므로 정상 |
| 화면 결함: 겹침 | 통과 | step3·step4 `A.peer`·`B.peer` 라벨이 화살표와 겹치지 않음 |
| 화면 결함: 잘림 | 통과 | step1 ms 제목 `회수 조건: mark에 표시 안 됨` 우측 잘림 없음 |
| 화면 결함: 빈 프레임 | 통과 | step1 루트 틀이 비어 있으나 변수는 step2에 생기므로 생성 순서상 의도. 라벨 있음 |
| 화면 결함: 읽을 수 없는 글 | 통과 | 권고: 1280px에서 SVG 글자가 약 9px(`A.peer`, `루트(전역·스택)`). 읽히지만 작다 |
| 화면 결함: 끝나지 않는 움직임 | 통과 | step8 `flow` 반복은 단계 전환 때 교체되고 leave에서 제거(scene.html:188) |

## 고친 것

- 실패 항목이 없어 고친 항목은 없다. audit 결과 고침 0건이라 `scene.html`은 바꾸지 않았다.
