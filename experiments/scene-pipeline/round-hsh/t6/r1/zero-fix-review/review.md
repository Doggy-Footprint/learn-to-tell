# 검수: 가비지 컬렉션 방식 (contrast)

대상: scene.html · 스토리보드 대조 · 스크린샷: scene-t1s/t4s/t8s, scene-step1~4

## 사실 점검표

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 생성 직후 A=2(root, B), B=1(A), C=1 | 통과 | scene-step1.jpg 라벨 `rc=2`·`rc=1`·`rc=1`, scene.html:68 |
| 루트→A 해제 후 A=1, B=1, C=1 유지 | 통과 | scene-step2.jpg 같은 라벨, 끊긴 간선 scene.html:107 |
| RC 결과: A·B 생존(누수 2개), C는 root 보유 | 통과 | scene-step3.jpg 왼쪽 패널 "A rc=1 보유자: B.prev" 외, scene.html:91-97 |
| M&S: mark={root, C}, 해제={A, B} | 통과 | scene-step3.jpg(mark), scene-step4.jpg(gone), scene.html:115-118 |
| 카운트 합 = 남은 간선 수(2) | 통과 | 손 계산 메모, 화면 요구 아님 |
| RC 즉시성 vs M&S 수거 주기 구분 | 통과 | scene-step3.jpg "0이 아니므로 해제되지 않는다", scene.html:112-113 |
| 약한 참조 곁다리 | 통과 | scene-step4.jpg 캡션 ④ "weak ref", scene.html:136 |

## 생성 순서

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 대상이 생기는 순서대로 나타나는가 | 통과 | 그래프와 최종 카운트가 한 번에 보인다. 비트 1이 "두 방식 모두 지금은 전부 살아 있음"으로 시작하라고 한다. scene-step1.jpg |

## 비트

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 1 같은 그래프 두 벌, 전부 살아 있음 | 통과 | scene-step1.jpg |
| 2 카운트 표시 A=2, B=1, C=1 | 통과 | scene-step1.jpg |
| 3 루트→A 해제, A=1 B=1 | 통과 | scene-step2.jpg |
| 4 RC 쪽 0이 아니라 잔류 | 통과 | scene-step3.jpg 왼쪽 패널 |
| 5 M&S mark(C만) 후 sweep이 A, B 해제 | 통과 | scene-step3.jpg, scene-step4.jpg |
| 6 진단: 루트 경로 없는 잔류 = 순환 누수 의심 | 통과 | 캡션 ④, scene.html:136 |

## 화면 결함

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 겹침: `.next` 라벨 | 실패 | 위쪽 호에 걸쳐 글자가 선과 겹친다. scene-step1.jpg 상단, scene.html:55 (y 52) |
| 겹침: `rc=N` 라벨 | 실패 | A의 `rc=2`/`rc=1`이 `.prev` 화살촉에 가려진다. scene-step1.jpg, scene-step2.jpg, scene.html:68-69 |
| 빈 프레임 | 실패 | step1·2에서 스냅샷 패널이 "수거 뒤 남은 객체" 머리글과 빈 박스만 보인다. 수거는 아직 일어나지 않았다. scene-step1.jpg, scene-step2.jpg, scene.html:83-98 |
| 잘림 | 통과 | 제목·패널이 모두 프레임 안. scene-t1s.jpg |
| 읽을 수 없는 글 | 통과 | 캡션·라벨 크기가 읽힌다. scene-step3.jpg |
| 움직임이 끝나지 않거나 멈춤 | 통과 | 4단계 모두 끝 상태에 도달하고 반복 재생이 있다. scene-step4.jpg |

## 고친 것

- 겹침 `.next`: 라벨 y 52 → 60으로 내려 호 아래 빈 자리에 둠 (scene.html:55).
- 겹침 `rc=N`: A 라벨을 노드 왼쪽 아래(132,116)로 옮겨 `.prev` 화살촉에서 뗌. B·C도 같은 좌표 방식으로 정리 (scene.html:67-70).
- 빈 프레임: 스냅샷 패널 그룹에 `data-s`를 달고 step 3부터 켬. 수거 전에는 머리글과 빈 박스가 안 보임 (scene.html:84, 121-122).
- audit 재실행: 1440x900·1280x800 모두 고침 0건.
- 참고: 위 세 항목은 audit이 잡지 않아서 화면 검수로 찾아 고쳤다.
