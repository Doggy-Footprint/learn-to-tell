# 검수: 가비지 컬렉션 방식 (scene.html)

대상: `scene.html` (figure 장면 1장, 단계 5개). 방향 기록 없음(`direction.md`). 기준은 `storyboard.md`와 장면 자체.

## 점검 표

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 카운트 손계산, 최종 A=1, B=1 | 통과 | scene-step3.jpg (rc 1, 1), scene.html:98 |
| 사실: 객체 512 KB, 쌍 1 MB, 100회 → 약 100 MB | 통과 | scene.html:122 basis에 "모델로 계산한 예시" 태그, scene-step5.jpg "100 MB 증가" |
| 사실: mark 톱니 4↔20 MB, 기준선 불변 | 통과 | scene.html:41 (heap 20 도달 시 4로 복귀), scene-step5.jpg "4~20 MB 톱니" |
| 사실: 화살표 방향(카운트 = 들어오는 참조, mark = 루트에서 나가는 탐색) | 통과 | scene.html:49-54, scene-step2.jpg |
| 사실: CPython 순환 감지기, 대비(승패 아님) 명시 | 통과 | scene.html:122 basis |
| 사실: 스냅샷 retainers, 서로뿐 vs 루트까지 | 통과 | scene.html:103-104, scene-step5.jpg |
| 생성 순서 1: A, B 생성 rc 1, 1 (연결 전) | 통과 | scene-step1.jpg |
| 생성 순서 2: 연결 뒤 rc 2, 2, 순환 완성 | 통과 | scene-step2.jpg |
| 생성 순서 3: 루트 해제 시 2→1 즉시 | 통과 | scene-step3.jpg (rc 쪽 빨간 상태, mark 쪽 무변화) |
| 생성 순서 4: mark는 해제 직후 불변, GC 때 하락 | 통과 | scene-step3.jpg (ms note "GC 시점까지 힙에 그대로"), scene-step4.jpg |
| 생성 순서 5: 반복 쌍 누적, 카운팅 계단 / mark 톱니 | 통과 | scene-step5.jpg |
| 비트 1: 같은 코드 두 런타임, 루트가 A, B를 쥠 | 통과 | scene-step2.jpg |
| 비트 2: 루트를 놓는 순간 카운팅 1, 1 정지 / mark 아직 그대로 | 통과 | scene-step3.jpg, scene.html:118 |
| 비트 3: GC 시점, A, B 표시 없이 회수 | 통과 | scene-step4.jpg (ms 쪽 A, B 점선·희미), scene.html:99 |
| 강조점: 루트 끊긴 뒤 rc "1, 1" 남음 vs mark "도달 불가"로 끝남 | 실패 | scene-step4.jpg: rc 쪽은 "도달 불가인데 rc 1, 1"이 있으나 mark 쪽 문구에 "도달 불가"가 없다. scene.html:99 mark 쪽 "표시 없음 → sweep 회수" |
| 비트 4: 100회 반복, 카운팅 100 MB 오름 / mark 4~20 MB | 통과 | scene-step5.jpg |
| 비트 5: 스냅샷 A·B 200개, retainers 서로뿐 | 통과 | scene-step5.jpg 하단 스냅샷 텍스트, scene.html:103 |
| 비트 6: 전역 캐시가 A를 쥐면 retainers가 루트까지 이어져 누수 | 통과 | scene-step5.jpg 하단 스냅샷 텍스트, scene.html:104 (그림으로는 없음, 권고 참조) |
| 화면: 겹침 | 통과 | scene-step2.jpg: "A.peer=B · B.peer=A" 라벨이 화살표와 겹치지 않음(scene.html:55, x=270) |
| 화면: 잘림 | 통과 | 전 단계 라벨이 viewBox 안에 있음 |
| 화면: 빈 프레임 | 통과 | 단계 1–4의 타임라인 빈 축은 의도된 상태(scene.html:81-86) |
| 화면: 읽을 수 없는 글 | 통과 (권고) | 축 눈금 10px(scene.html:62-64)은 렌더 약 8px. 읽히나 작음 |
| 화면: 움직임이 끝나지 않거나 멈춤 | 통과 | scene-step5.jpg: 두 선 모두 끝까지 그려짐, 반복 재생 버튼 있음 |

## 권고 (고치지 않음)

- 용어: `retainers`가 `sub`(scene.html:113)와 `takeaway`(scene.html:123)에 풀이 없이 나온다. 바로 뒤 문장이 "누가 붙잡는지"로 풀이하므로 실패로 보지 않는다. `{{}}`와 `glossary`를 쓸지는 작성자 판단.
- 비트 6(반전)은 그림이 아니라 텍스트로만 보인다. 그림이 필요하면 장면을 나눈다.
- 축 눈금 글자 크기는 kit 단계 여부를 확인하지 않았다(`refs/api/base.md` 미읽음).

## 요약

실패 1건, 고침 대상 1건(강조점 문구).

## 고친 것

- 강조점(mark "도달 불가"): scene.html:99 mark 쪽 GC 문구를 "GC: 루트에서 닿지 않는 A, B는 도달 불가 → sweep 회수"로 바꿈. audit 재실행 고침 0건.
