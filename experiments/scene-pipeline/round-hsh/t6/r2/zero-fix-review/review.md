# 검수: 가비지 컬렉션 방식 (순환 참조, RC vs mark-and-sweep)

스크린샷 대응: s0=t1s, s1=t4s·step2, s2=step1, s3=t8s·step3, s4=step4, s5=step5, s6=step6. load 캡처는 실패(locator.click timeout)라 로드 상태는 판정 불가.

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 연결 직후 카운트 A=2, B=2 | 통과 | shots/scene-step2.jpg, scene-t4s.jpg 카운트 2 |
| 사실: x·y 해제 후 A=1, B=1, 0 아님 | 통과 | shots/scene-step1.jpg 카운트 1(붉은 표시) |
| 사실: 해제 후 RC 쪽 루트 경로 0개 | 통과 | shots/scene-step3.jpg 좌측 "루트 경로: 없음" |
| 사실: mark 루트 0개 → 표시 0, sweep 대상 2 | 통과 | shots/scene-t8s.jpg "mark: 루트 0개에서 출발 → 표시 0개", scene-step4.jpg "sweep" |
| 사실: 부호·방향 (A.peer=B가 B 카운트를 올림) | 통과 | scene.html:76-77 화살표 A→B·B→A, shots/scene-step2.jpg 카운트 둘 다 2 |
| 사실: 순환 없는 비교(즉시 회수) | 통과 | 화면 필수 목록 아님(그림 없음) |
| 사실: tracing 쪽 누수 = 순환 없는 C가 루트 경로로 남음 | 통과 | shots/scene-step5.jpg "표시됨 → 남음" |
| 사실: basis (CPython 순환 탐지, JVM·V8·Go tracing) | 통과 | scene.html:134 |
| 생성 순서: 생성 → 변수 연결 → 객체 연결 → 해제 | 통과 | shots/scene-t1s.jpg peer: null, scene-t4s.jpg peer 연결 후 |
| 생성 순서: 연결 전에는 retainer로 나열하지 않음 | 실패 | shots/scene-t1s.jpg 좌측 "A ← x, B.peer"가 peer가 없는 단계에 나옴. scene.html:97 |
| 생성 순서: mark가 먼저, sweep이 나중 | 통과 | shots/scene-step3.jpg(mark) → scene-step4.jpg(sweep) |
| 생성 순서: 해제 직후에는 회수 안 됨 | 통과 | shots/scene-step1.jpg "GC 사이클이 돌기 전" |
| 비트 1: 둘 다 카운트 2 | 통과 | shots/scene-t4s.jpg |
| 비트 2: 해제 후 카운트 1 | 통과 | shots/scene-step1.jpg |
| 비트 3: RC 스냅샷, retainer가 서로뿐, 루트 없음 | 통과 | shots/scene-step3.jpg 좌측 |
| 비트 4: mark 미표시, sweep이 치움 | 통과 | shots/scene-step3.jpg "미표시", scene-step4.jpg "해제됨" |
| 비트 5: tracing 진짜 누수 C | 통과 | shots/scene-step5.jpg |
| 비트 6: 진단 질문 | 통과 | shots/scene-step6.jpg 하단 녹색 질문 |
| 화면: 캡션 중복 표시 | 실패 | shots/scene-t1s.jpg 캡션이 두 번(512행·572행) 나옴. scene.html:20, 136-138, 141 |
| 화면: 그림 글자 크기 | 실패 | 1020 viewBox가 약 0.55배로 줄어 15px 본문이 약 8px로 보임. scene.html:16-18, shots/scene-step3.jpg 힙 스냅샷 줄. 레이아웃을 바꿔야 해서 이번 수정 범위 밖 |
| 화면: 잘림·겹침(cache 박스) | 통과 | shots/scene-step5.jpg "cache (루트)"가 박스 안에 들어감 |
| 화면: 빈 프레임 | 통과 | 9장 모두 그림과 캡션이 있음 |
| 화면: 움직임이 끝나지 않거나 멈춤 | 통과 | shots/scene-step6.jpg 마지막 단계 "다음" 비활성, 반복 재생으로 끝남 |
| 권고: audit 장면1 88% 축소 | 통과 | 권고로 남김. shots/scene-audit.txt |
| 권고: lint unused-term "retainer" | 통과 | 권고로 남김. scene.html:123 glossary, narration에 {{}} 없음 |

## 고친 것
- 생성 순서(연결 전 retainer): s<1 단계에서 B.peer 없이 `A ← x`, `B ← y`만 나열하도록 scene.html:97을 고침.
- 캡션 중복: 직접 쓴 `.gc-cap` 자리·CSS를 빼고, `LTT.stepper`가 주는 caption 하나만 남김(scene.html:20, 136-138).
- 미수정: 그림 글자 크기(실패). 1020 viewBox가 약 0.55배로 줄어 레이아웃 변경 없이는 키울 수 없어 이번 범위 밖으로 둠.
