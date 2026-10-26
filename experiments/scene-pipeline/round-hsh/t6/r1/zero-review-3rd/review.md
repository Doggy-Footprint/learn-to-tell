# 검수: 가비지 컬렉션 방식 (zero-review-3rd)

기준: storyboard.md, scene.html. direction.md에는 작성자 방향 기록이 없다. 판정은 shots/ 기본 화면 9장과 scene.html 코드 위치로 확인했다.

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 생성 직후 A=2, B=1, C=1 | 통과 | scene-step2.jpg 참조 2/1/1; scene.html:92 |
| 사실: root→A 해제 후 A=1, B=1, C=1 | 통과 | scene-step3.jpg; scene.html:92 (n=2) |
| 사실: RC 결과 A·B 생존, 누수 2개 | 통과 | scene-step4.jpg "누수 2개"; scene.html:79 |
| 사실: M&S 결과 mark={root, C}, A·B 해제 | 통과 | scene-step5.jpg mark ✓ 2곳; scene-step6.jpg; scene.html:107–112 |
| 사실: 카운트 합 2 = 간선 수 | 통과 | 화면 필수 아님. 화면 수치와 모순 없음 |
| 사실: RC 즉시성·M&S 지연 구분 | 통과 | 화면 필수 아님. 화면 문구와 모순 없음 |
| 사실: weak ref 곁다리 | 통과 | 화면 필수 아님. takeaway에만 언급, scene.html:142 |
| 생성 순서: 카운트 시작값 (B는 A.next 하나) | 통과 | scene-step2.jpg B 참조 1; 루트 해제 전 A 2 |
| 생성 순서: mark 먼저, sweep 나중 | 통과 | scene-step5.jpg → scene-step6.jpg; scene.html:126–127 |
| 생성 순서: 대상이 등장하는 순서 | 통과 | 그래프는 완성 상태에서 시작(비트 1). 스토리보드는 생성 과정을 수치로만 요구 |
| 비트 1: 같은 그래프, 전부 생존 | 통과 | scene-t1s.jpg; 두 패널 모두 "전부 살아 있다" |
| 비트 2: 카운트 A=2, B=1, C=1 | 통과 | scene-step2.jpg |
| 비트 3: root→A 해제, A=1, B=1 | 통과 | scene-step3.jpg, "✕ 끊김" 표시 |
| 비트 4: RC 잔류 + 보유 경로 | 통과 | scene-step4.jpg |
| 비트 5: M&S mark 후 sweep | 통과 | scene-step5.jpg, scene-step6.jpg |
| 비트 6: 진단 판단 | 통과 | 하단 핵심 바 (scene-t1s.jpg); scene.html:142 |
| 화면 필수: 두 벌 그래프 (root·A·B·C) | 통과 | scene-t1s.jpg |
| 화면 필수: 카운트 숫자 / mark 표시 | 통과 | scene-step2.jpg / scene-step5.jpg |
| 화면 필수: 해제 후 남은 객체와 보유 경로 | 통과 | scene-step4.jpg (RC), scene-step6.jpg (M&S) |
| 화면 필수: A↔B 간선이 카운트 1을 붙듦 | 통과 | scene-step4.jpg: A·B 빨간 점선, 참조 1 주황 |
| 화면 결함: 겹침 | 통과 | 요소 간 겹침 없음 (scene-step2.jpg) |
| 화면 결함: 잘림 | 통과 | 모든 텍스트 완결 |
| 화면 결함: 빈 프레임 | 통과 | 6단계 모두 양쪽 패널에 내용 있음 |
| 화면 결함: 읽을 수 없는 글 | 통과 | 13px 프로파일러 행도 판독 가능 (scene-step4.jpg) |
| 화면 결함: 움직임이 끝나지 않거나 멈춤 | 통과 | 단계 전환 뒤 정적 상태, 반복 없음 |

## 판정 요약

실패 0건. scene.html은 수정하지 않았다. 수정이 없어 audit도 다시 돌리지 않았다.

## 권고 (고치지 않음)

- 상태 줄 두 개가 카드 밖 아래로 나간다. RC "카운트 1 ≠ 0 → 해제되지 않음"(scene.html:105), M&S "sweep: A, B 해제 — 누수 0개"(scene.html:115)가 y=440에 있어 카드(y 285–415) 밖에 놓인다 (scene-step4.jpg, scene-step6.jpg 하단). 읽히고 겹치지 않으므로 권고로 둔다.

## 고친 것

- 없음 (실패 항목 0건, 고친 항목 0건)
