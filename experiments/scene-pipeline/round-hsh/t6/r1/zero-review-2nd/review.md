# 검수: 가비지 컬렉션 방식 (contrast)

대상: `scene.html` · 기준: `storyboard.md`, `direction.md`(작성자 방향 기록 없음) · 스크린샷: `shots/scene-step1~6.jpg`, `scene-t1s·t4s·t8s.jpg`

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 생성 직후 A=2(root, B.prev), B=1(A.next), C=1 | 통과 | scene-step2.jpg, scene.html:123 |
| 사실: 루트→A 해제 후 A=1, B=1, C=1 | 통과 | scene-step3.jpg, scene.html:124 |
| 사실: RC 결과 A·B 생존(누수 2개), C 정상 | 통과 | scene-step4.jpg (`A 보유자: B.prev ← 루트 경로 없음`, `누수 2개`) |
| 사실: M&S mark={root, C}, 해제 대상={A, B} | 통과 | scene-step5.jpg, scene-step6.jpg, scene.html:107–115 |
| 사실: 카운트 = 들어오는 참조 수 | 통과 | scene-step2.jpg 캡션, scene.html:123 |
| 사실: RC 즉시성 vs M&S 지연 | 통과(화면 필수 아님) | scene.html:139 부제 "카운트가 0인가 / root에서 닿는가" |
| 사실: 약한 참조 | 해당 없음 | 곁다리, 화면 필수 아님 |
| 생성 순서: 나타나는 순서 그래프→카운트→끊김→RC 판정→mark→sweep | 통과 | scene-step1~6.jpg (생성 과정 자체는 장면에 없음, 비트 1이 완성된 그래프로 시작) |
| 생성 순서: M&S mark가 sweep보다 먼저 | 통과 | scene-step5.jpg → scene-step6.jpg |
| 비트 1: 같은 그래프, 전부 생존 | 통과 | scene-step1.jpg |
| 비트 2: 카운트 A=2, B=1, C=1 | 통과 | scene-step2.jpg |
| 비트 3: root→A 해제, A=1, B=1 | 통과 | scene-step3.jpg (`× 끊김`, 점선 간선) |
| 비트 4: RC 쪽에 남음, 목록과 보유 경로 | 통과 | scene-step4.jpg |
| 비트 5: M&S mark(C만), sweep(A, B 해제) | 통과 | scene-step5.jpg, scene-step6.jpg |
| 비트 6: 루트 경로 없는 잔류 → 순환 누수 의심 | 통과 | 핵심 바, scene.html:142 |
| 강조점: 끊긴 뒤 A↔B가 카운트 1로 붙듦 | 통과 | scene-step3·4.jpg (A `참조 1` 주황, A·B 점선 테두리). 간선 자체는 강조되지 않음 |
| 화면: 겹침 | 통과 | scene-step2.jpg (`참조 2`와 `next`가 인접하나 겹치지 않음) |
| 화면: 잘림 | 통과 | scene-step1~6.jpg, 모든 텍스트가 카드·viewBox 안에 있음 |
| 화면: 빈 프레임 | 통과 | scene-step1.jpg (M&S 카드 하단 빈 영역은 설명 카드 내부) |
| 화면: 읽을 수 없는 글 | 권고 | viewBox 1000 → 렌더 폭 약 710px, `.row` 13px → 실제 약 9px (scene.html:22, scene-step4~6.jpg). 읽히지만 작음 |
| 화면: 움직임이 멈추거나 끝나지 않음 | 통과 | 단계형(이전·다음), 6단계 모두 도달, 마지막 단계에서 다음 비활성 (scene-step6.jpg). t1s·t4s·t8s는 단계 1과 동일(시간 기반 움직임 없음) |
| 화면: 판정 문구가 카드 밖에 있음 | 권고 | `ms.status`/`rc.status` y=440 (scene.html:60, 105), 카드 하단 y=415 (scene.html:57). scene-step4~6.jpg 하단 붉은 글 |

## 판정 요약
- 실패 항목: 0건
- 권고: 2건(글자 크기, 판정 문구 위치). 둘 다 방향과 통과 항목을 바꾸지 않으므로 고치지 않는다.

## 고친 것
- 없음. 실패 항목 0건이라 `scene.html`을 수정하지 않았다. audit 재실행 결과도 고침 0건.
