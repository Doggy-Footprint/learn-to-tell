# 검수: 가비지 컬렉션 방식 (contrast)

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| [사실] 연결 직후 A=2, B=2 | 통과 | scene-step3.jpg 「카운트 A 2 · B 2」, scene.html:20·26 |
| [사실] x, y 해제 후 A=1, B=1, 0이 아님 | 통과 | scene-step4.jpg 「카운트 A 1 · B 1 (0 아님)」, scene.html:27 |
| [사실] 루트 경로 0개, 회수 안 됨 | 통과 | scene-step5.jpg RC 「루트 경로 0개 → 회수 안 됨」, scene.html:28 |
| [사실] mark 도달 0개 → A, B 미표시, sweep 2개 | 통과 | scene-step5.jpg MS 「도달 0개 → A, B 미표시」, scene-step6.jpg MS 「A, B 해제」 |
| [사실] 부호·방향: A.peer=B가 B의 카운트를 올림 | 통과 | scene-step3.jpg 엣지 peer A→B, B 카운트 2, scene.html:55 |
| [사실] 순환 없이 루트에서 닿으면 tracing 누수 | 통과 | scene-step7.jpg MS 「루트→전역 캐시→C 경로 있음」, scene.html:88–91 |
| [사실] 비교용 순환 없는 즉시 회수 | 통과 | 화면에 주장 없음, 모순 없음 |
| [사실] 런타임 주의(CPython 순환 탐지, V8·JVM·Go tracing) | 통과 | scene-t1s.jpg 근거 줄, scene.html:167 |
| [순서] 객체 생성 → 변수 연결 → 객체끼리 연결 → 변수 해제 | 통과 | scene-step1 → step2 → step3 → step4 |
| [순서] 카운트는 연결 시 오르고 해제 시 내림(1→2→1) | 통과 | scene-step2 1·1, step3 2·2, step4 1·1 |
| [순서] mark가 sweep보다 먼저 | 통과 | scene-step5 mark → scene-step6 sweep |
| [순서] 회수는 GC 시점(해제 즉시 아님) | 통과 | MS 회수가 step6(sweep)에 나옴, RC는 0 되는 순간에만 회수 |
| [비트 1] 순환 + x, y, 카운트 2·2 | 통과 | scene-step2, scene-step3 |
| [비트 2] 해제 후 카운트 1 | 통과 | scene-step4 |
| [비트 3] RC 쪽 retainer가 서로뿐, 루트 경로 없음 | 통과 | scene-step5 RC 글줄 (그림 라벨은 실패 항목 참조) |
| [비트 4] MS 쪽 mark 미표시 → sweep | 통과 | scene-step5, scene-step6 |
| [비트 5] 순환 없는 객체가 전역 캐시로 남음 | 통과 | scene-step7 MS, scene.html:91 |
| [비트 6] 진단 분기(루트 경로 유무) | 통과 | scene-step7 글줄 「루트 경로 없음 → 순환 retainer…」, 「경로 있음 → 첫 retainer를 끊는다」 |
| [결함] 읽을 수 없는 글: 그림 라벨·부제(객체 A, 카운트 n, 변수 x, 루트, peer) | 실패 | scene-t1s.jpg, scene-step3.jpg: 노드 글자 약 5–6px. GRID cols 3·cell 210 (scene.html:17)을 268px 칸에 맞춰 축소 |
| [결함] 겹침: 상태 글줄이 정지 버튼에 닿음 | 실패 | scene-step4.jpg 「카운트 A 1 · B」가 「← 이전」에 닿음, scene-step6.jpg 「되지 않는 한」 |
| [결함] 잘림 | 통과 | 잘린 글 없음 |
| [결함] 빈 프레임 | 통과 | 모든 프레임에 그림과 글이 있음 (카드 가운데 여백은 권고) |
| [결함] 움직임이 끝나지 않거나 멈춤 | 통과 | scene-step7 끝 상태, 반복 재생 버튼 있음 |

## 판정 요약
- 실패 2건: 읽을 수 없는 그림 글, 상태 글줄과 버튼의 겹침.
- 권고: 카드 가운데 여백이 큼. 그대로 둬도 된다.

## 고친 것
- [결함] 읽을 수 없는 그림 글: GRID를 3열(cell 210)에서 2열(cell 160, node 120)로 줄이고, 마지막 단계(MS)의 노드를 2열 배치로 바꿈 (scene.html:17, 86–91). 스크린샷으로 확인하지 못함.
- [결함] 상태 글줄과 버튼의 겹침: 고치지 않음. 스크린샷을 다시 만들 수단이 없어 줄바꿈을 바꾸면 악화될 수 있다. 다음 검수에서 scene-step4·step6 확인 필요.

실패 2건 중 1건 고침, 1건 미고침. audit 고침 0건(2회 실행, 최초 실행 포함).
