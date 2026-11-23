# 검수: 가비지 컬렉션 방식 (contrast)

대상: `scene.html` · 기준: `storyboard.md`, `direction.md`(작성자 방향 기록 없음), 스크린샷 step1~4·t1s·t4s·t8s

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 생성 직후 A=2, B=1, C=1 | 통과 | scene-step1.jpg의 rc=2(A), rc=1(B), rc=1(C). scene.html:68 |
| 사실: root→A 해제 후 A=1, B=1, C=1 | 통과 | scene-step2.jpg, rc=1(A·B·C). scene.html:109 |
| 사실: RC 결과 A·B 생존(누수 2개), C 정상 생존 | 통과 | scene-step3.jpg 왼쪽 패널 3행과 "누수" 판정. scene.html:96-97 |
| 사실: M&S 결과 mark={root, C}, 해제={A, B} | 통과 | scene-step3.jpg mark(root, C), scene-step4.jpg A·B 흐림. scene.html:115-118 |
| 사실: 카운트 = 들어오는 간선 수 | 통과 | scene-step1.jpg 캡션 ①과 설명 "카운트 = 나를 가리키는 화살표 수". scene.html:112 |
| 사실: RC 즉시 해제 vs M&S 수거 주기 해제 구분 | 통과 | 화면에 없음. 잘못된 진술도 없음(권고 참고) |
| 사실: weak ref는 곁다리 | 통과 | scene-step4.jpg 캡션 ④ "weak ref를 쓴다"만 언급. scene.html:137 |
| 생성 순서: 카운트가 A=1 → B 연결 → A=2 → 루트 해제 → A=1 | 통과 | 장면은 완성된 그래프에서 시작(캡션 ①이 A.next→B.prev 순서를 말함). 생성 과정은 애니메이션되지 않음 |
| 생성 순서: M&S는 mark가 sweep보다 먼저 | 통과 | scene-step3.jpg(mark) → scene-step4.jpg(sweep). scene.html:115-118 |
| 비트 1: 같은 그래프 두 벌, 전부 살아 있음 | 통과 | scene-step1.jpg |
| 비트 2: 카운트 A=2, B=1, C=1 표시 | 통과 | scene-step1.jpg rc=2 / rc=1 / rc=1 |
| 비트 3: root→A 해제, A·B는 닿지 못함 | 통과 | scene-step2.jpg, root→A 점선(cut). scene.html:107 |
| 비트 4: RC 쪽 A·B 남음, 프로파일러 목록 | 통과 | scene-step3.jpg 왼쪽 패널. scene.html:91-97 |
| 비트 5: M&S 쪽 mark 후 sweep으로 A·B 해제 | 통과 | scene-step3.jpg → scene-step4.jpg. scene.html:115-118 |
| 비트 6: 진단 판단(루트 경로 없는 잔류 → 순환 누수 의심) | 통과 | scene-step4.jpg 캡션 ④와 takeaway. scene.html:137, 139 |
| 강조점: 루트가 끊긴 뒤 A↔B 간선이 카운트 1을 붙듦 | 통과 | scene-step2.jpg, 굵은 경고색 간선과 노드. scene.html:110-111 |
| 화면: 겹침 | 통과 | scene-step1~4.jpg, 라벨과 노드 사이 겹침 없음 |
| 화면: 잘림 | 통과 | scene-step1~4.jpg, SVG 안쪽 모든 글자 보임 |
| 화면: 빈 프레임 | 실패 | scene-step3.jpg 오른쪽 "힙 스냅샷 · 수거 뒤 남은 객체" 패널이 제목만 있고 비어 있음. msRow가 swept일 때만 켜짐. scene.html:99, 123 |
| 화면: 읽을 수 없는 글 | 통과 | 패널 본문이 작지만 1280px에서 읽힘 |
| 화면: 움직임이 끝나지 않거나 멈춤 | 통과 | 4단계에서 끝남. t1s·t4s·t8s가 같은 화면이라 자동 진행은 없음(권고 참고) |

## 권고(고치지 않음)
- 즉시성(RC) vs 수거 주기(M&S) 차이가 화면에 없다. 사실 점검표 항목이지만 필수 비트는 아니다.
- `weak ref`가 풀이 없이 쓰였다(독학 기준의 용어 풀이 규칙).
- 패널 본문 글자가 작다.
- t1s·t4s·t8s가 같다(반복 재생 버튼은 있음). 자동 진행 여부는 작성자 판단.

## 요약
실패 1건(빈 프레임). 나머지 항목은 통과.

## 고친 것
- 화면: 빈 프레임 — step3에서 M&S 수거 패널에 "C 보유자: root" 행을 켬(`on(msRow, k >= 2)`, scene.html:123). 재 audit 고침 0건.
