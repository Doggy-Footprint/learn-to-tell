# 검수: 가비지 컬렉션 방식 (contrast)

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 카운트 손계산, 최종 A=1, B=1 | 통과 | scene-step3.jpg rc 1, 1 / scene.html:90 |
| 사실: 수치 100번 반복 = 100 MB 누수 | 실패 | scene-step5.jpg 라벨 "104 MB" (scene.html:66). 스토리보드는 100 MB |
| 사실: 쌍 1 MB, 임계 약 20 MB, 기준선 4 MB 톱니 | 통과 | scene.html:41, scene-step5.jpg 4~20 MB |
| 사실: 화살표 방향(들어오는 수 / 루트에서 나가는 화살표) | 통과 | scene.html:53-54, 79-80, 라벨 "들어오는 화살표 수" |
| 사실: 실제 CPython 순환 감지기, 순수 카운팅은 모델이라고 명시 | 실패 | basis(scene.html:122)에 "순환 감지 없을 때의 모델" 문구 없음 |
| 사실: 카운팅 즉시 해제·정지 짧음, mark의 GC 정지 | 통과 | basis(scene.html:122) |
| 사실: 스냅샷 클래스·개수·retained size | 실패 | scene-step5.jpg 스냅샷 줄. retained size 표기 없음 (scene.html:103) |
| 생성 순서 1: A, B 생성 rc 1 | 통과 | scene-step1.jpg |
| 생성 순서 2: 연결 뒤 rc 2, 2 (순환 완성) | 통과 | scene-step2.jpg |
| 생성 순서 3: 루트 해제 즉시 2→1, mark 쪽 변화 없음 | 통과 | scene-step3.jpg |
| 생성 순서 4: mark는 GC 시점에 한꺼번에 떨어짐 | 통과 | scene-step4.jpg, scene-step5.jpg 톱니 |
| 생성 순서 5: 쌍 누적, 카운팅은 쌓임 / mark는 GC로 소거 | 통과 | scene-step5.jpg |
| 비트 1: 같은 코드 두 런타임, 루트가 A, B를 쥠 | 통과 | scene-step1.jpg |
| 비트 2: 루트를 놓는 순간 카운팅 1, 1에서 멈춤 | 통과 | scene-step3.jpg, 캡션 ③ |
| 비트 3: GC 시점 루트에서 닿지 않는 A, B 회수 | 통과 | scene-step4.jpg dim, 캡션 ④ |
| 비트 4: 100번 반복 계단 대 톱니 | 통과 | scene-step5.jpg (수치 라벨은 위 실패 항목) |
| 비트 5: 스냅샷 A·B 200개, retainer가 서로뿐 | 통과 | scene-step5.jpg 스냅샷 줄 |
| 비트 6: 전역 캐시가 A를 쥐면 루트까지 이어져 누수 | 통과 | scene.html:104 텍스트 |
| 강조점: 카운트 "1, 1" 남음 / mark "도달 불가" 끝 | 통과 | scene-step3.jpg rc 1,1 / 캡션 ④ "도달 불가라 회수" |
| 화면: 각 쪽에 카운트 또는 mark 표시 | 통과 (약함) | 카운팅 쪽은 rc 표시. mark 쪽은 step4 dim만 있음 |
| 화면 결함: 겹침 | 통과 | scene-step2.jpg 라벨과 화살표 떨어짐 |
| 화면 결함: 잘림 | 통과 | 1280x800 전 장면 |
| 화면 결함: 빈 프레임 | 통과 | step1-4 타임라인은 축만 있음. 단계 공개로 의도됨 |
| 화면 결함: 읽을 수 없는 글 | 통과 | 전 장면 |
| 화면 결함: 움직임이 끝나지 않거나 멈춤 | 통과 | step5 dashoffset 2.2s 후 정지, 반복 재생 버튼 |
| 권고(고치지 않음): 루트 라벨 "a, b"가 해제 뒤에도 남음 | 권고 | scene-step3.jpg 루트 박스 (scene.html:48) |

## 고친 것
- 타임라인 끝 라벨 "104 MB"를 "100 MB 증가, 계속 오름"으로 고침 (스토리보드 수치 100 MB에 맞춤, scene.html:66)
- basis에 "순수 카운팅 누수는 순환 감지기가 없을 때의 모델" 문장 추가 (scene.html:122)
- 스냅샷 줄에 retained size 표기 추가 (scene.html:103)
