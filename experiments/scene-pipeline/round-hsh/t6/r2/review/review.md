# 검수: 가비지 컬렉션 방식 (contrast)

audit 1차(1440x900, 1280x800): 고침 0건. 아래 판정은 스크린샷과 코드를 직접 대조한 결과다.

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 연결 직후 A=2, B=2 | 통과 | scene-step4.jpg 카운트 A 2 · B 2; scene.html:50 |
| 사실: x·y 해제 후 A=1, B=1, 루트 경로 0개 | 통과 | scene-step5.jpg; scene.html:51-53 |
| 사실: 순환 없는 x→A라면 1→0에서 즉시 회수 (비교) | 통과 | scene.html:73 (캡션, 줄여도 뜻 유지) |
| 사실: mark 표시 0개, sweep 대상 A·B 2개 | 통과 | scene-step6.jpg "표시 0개", scene-step7.jpg |
| 사실: A.peer=B는 B의 카운트를 올린다 | 통과 | scene-step3.jpg 카운트 B 2, A 1 |
| 사실: 순환이 있어도 tracing에서는 누수 아님, 순환 없어도 루트에 닿으면 누수 | 통과 | scene-step8.jpg 오른쪽 객체 C "표시 ✓" |
| 사실: 출처 주석 (CPython, JVM·V8·Go) | 통과 | scene-t1s.jpg 우측 basis 줄 |
| 사실: V8 스냅샷은 취득 전 GC | 통과 | 화면 주장 없음(점검표 참고 항목) |
| 생성 순서: 객체 → 변수 → A.peer → B.peer → 해제 | 통과 | scene-step1~5.jpg; scene.html:56-63 |
| 생성 순서: mark가 먼저, sweep이 나중 | 통과 | scene-step6.jpg → scene-step7.jpg |
| 생성 순서: 회수는 GC 사이클에서 | 통과 | scene-step6.jpg 왼쪽 "GC 사이클" 캡션 |
| 비트 1: 카운트 둘 다 2 | 통과 | scene-step4.jpg |
| 비트 2: x·y 해제 후 1 (0 아님) | 통과 | scene-step5.jpg |
| 비트 3: RC retainer는 서로뿐, 루트 경로 없음 | 통과 | scene-step5.jpg "retainer는 서로뿐, 루트 경로 0개" |
| 비트 4: mark 쪽 A·B에 닿지 않고 sweep | 통과 | scene-step6.jpg, scene-step7.jpg |
| 비트 5: tracing 쪽 전역 캐시 누수 | 통과 | scene-step8.jpg 전역 캐시 → C |
| 비트 6: 진단 질문 | 통과 | scene-step8.jpg 캡션 "'루트에서 경로가 있나'" |
| 화면 필수: 두 쪽의 같은 순간 + 해제 시점 | 통과 | scene-step1~5.jpg |
| 화면 필수: 카운트 또는 mark, retainer 목록, 루트 경로 | 통과 | scene-step4.jpg, scene-step5.jpg 하단 줄 |
| 방향: 같은 힙 두 그림 + stepper 하나 | 통과 | scene.html:181-186 |
| 방향: 객체 상자 배지 (카운트 / 표시) | 통과 | scene-step2.jpg 이후 전 단계 |
| 결함: 겹침 | 통과 | scene-step4.jpg A.peer·B.peer 라벨이 화살표 옆에 있음 |
| 결함: 잘림 (핵심 바 하단이 푸터에 가려짐) | 실패 | scene-step6.jpg, scene-step7.jpg, scene-step8.jpg 하단 핵심 바. 원인: 두 줄로 넘친 캡션과 줄 — scene.html:72, 73, 92, 94 |
| 결함: 빈 프레임 | 통과 | 전 단계 |
| 결함: 읽을 수 없는 글 | 통과 | 권고: SVG 보조 글자("루트(전역·스택)", "A.peer")가 약 9px. 이번에는 고치지 않음 |
| 결함: 움직임이 끝나지 않음 | 실패 | scene.html:150, 152 펄스·흐름선은 무한 반복. scene.html:187 mount가 `leave` 없이 `{}`를 돌려줘 장면을 떠나도 계속 돈다 |

요약: 실패 2건 (잘림, 움직임 멈춤 누락). 나머지는 통과. 방향은 바꾸지 않는다.

## 고친 것
- 잘림: 두 줄로 넘치던 ⑥ 캡션을 한 줄로 줄임 (scene.html:92).
- 잘림: 두 줄로 넘치던 ⑧ 캡션을 한 줄로 줄임, 진단 질문 문구는 유지 (scene.html:94).
- 잘림: 두 줄로 넘치던 RC 줄 두 개를 한 줄로 줄임 (scene.html:72, 73). 1차 audit은 못 잡았다.
- 움직임 멈춤: mount가 `leave`를 돌려주고 펄스·흐름선 클래스를 뗀다 (scene.html:187).
