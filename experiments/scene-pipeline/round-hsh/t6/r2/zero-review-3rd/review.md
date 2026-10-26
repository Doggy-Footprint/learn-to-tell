# 검수: 가비지 컬렉션 방식

기준: storyboard.md, direction.md(작성자 방향 기록 없음), refs/API.md 독학 기준.
스크린샷: shots/index.txt의 t1s·t4s·t8s, step1–step8.

## 사실 점검표

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 연결 직후 A=2, B=2 | 통과 | scene-step2.jpg "카운트 2" ×2 |
| x, y 해제 후 A=1, B=1, 0이 아님 | 통과 | scene-step3.jpg "카운트 1", ret "둘 다 0이 아님" |
| 루트 경로 0개 | 통과 | scene-step4.jpg "루트 경로 없음" |
| mark 표시 0, sweep 대상 A·B | 통과 | scene-step5.jpg "표시 0", scene-step6.jpg A·B 해제 |
| 카운트는 들어오는 참조 수 (A.peer=B는 B를 올림) | 통과 | scene-step2.jpg ret "A ← x, B.peer (2)" |
| 순환이 있어도 tracing에서는 누수 아님, 순환 없어도 루트에서 닿으면 누수 | 통과 | scene-step7.jpg "C ← cache['k'] ← 루트 경로 있음" |
| "순환은 못 푼다"는 순수 참조 카운팅에 한정 | 통과 | scene.html:129 제목 "순수 참조 카운팅" (CPython 보조 GC는 장면 밖, 권고) |
| 비교용: 순환 없는 단일 객체는 즉시 회수 | 통과 (화면 미표시, 틀린 주장 없음) | 장면에 없음 |
| 스냅샷은 정지 시점의 한 장 | 통과 (화면 미표시) | 장면에 없음 |

## 생성 순서

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 객체·변수 연결 → 객체끼리 연결 → 변수 해제 | 통과 | scene-step1 → step2 → step3 (scene.html:133–135) |
| 카운트 1 → 2 → 1 | 통과 | scene-step1, step2, step3 |
| mark가 sweep보다 먼저 | 통과 | scene-step5 "표시 안 됨" → scene-step6 해제 |
| 회수는 GC 사이클에서 (해제 즉시 아님) | 통과 | scene-step6 "(다음 GC 사이클에)" |

## 비트

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 1. 같은 A↔B 순환, 카운트 둘 다 2 | 통과 | scene-step2.jpg |
| 2. x, y 해제 후 카운트 1 (0 아님) | 통과 | scene-step3.jpg |
| 3. RC 스냅샷: retainer는 서로뿐, 루트 경로 없음, 남음 | 통과 | scene-step4.jpg |
| 4. MS: mark 도달 0, sweep이 A·B 치움 | 통과 | scene-step5.jpg, scene-step6.jpg |
| 5. tracing 쪽 진짜 누수: cache가 C를 붙잡음 | 통과 | scene-step7.jpg |
| 6. 진단 질문: 루트 경로 유무로 끊을 retainer 결정 | 통과 | scene-step8.jpg |

## 화면 결함

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 겹침: "A.peer = B" 라벨 | 실패 | scene.html:54 baseline y=96, 곡선 정점 y≈98이라 'p' 하강부가 화살표 선에 닿음 (scene-step2.jpg) |
| 읽을 수 없는 글: SVG 주석 13–14단위 | 실패 | 1280 폭에서 약 10px 머리말·라벨 (scene.html:46, 51, 54, 55, 61). "루트(전역·스택)"이 scene-step1.jpg에서 거의 안 읽힘 |
| 잘림 | 통과 | scene-step7.jpg cache 상자, scene-step8.jpg 설명 상자 모두 카드 안 |
| 빈 프레임 | 통과 | 모든 단계에서 그림이 그려짐 |
| 움직임이 끝나지 않거나 멈춤 | 통과 | t1s·t4s·t8s가 같은 상태 = 자동 재생 없음, 단계는 수동 (반복 재생 버튼 있음) |
| 줄바꿈: step5 ret "표시 / 0" | 통과 (권고) | scene-step5.jpg, 읽힘은 됨 |
| step8 ret 4줄로 카드 높이 증가 | 통과 (권고) | scene-step8.jpg, .ret min-height 3.2em |
| #ltt-checks | 해당 없음 | shots/index.txt checks 행, 요소 없음 |

## 요약

실패 2항목 (겹침 1, 읽기 1). 수정 대상은 scene.html의 SVG 주석 라벨 크기·위치뿐이며 방향과 통과 항목은 그대로 둔다.

## 고친 것

- 겹침 "A.peer = B" 라벨: scene.html:54 y 96→90, 곡선 정점과 겹치던 'p' 하강부를 뗐다.
- 읽을 수 없는 글 SVG 주석: scene.html:46, 51, 54, 55, 61의 font-size 13·14→16 (루트 라벨, x·y 해제됨, A/B.peer 라벨, 전역 cache).
