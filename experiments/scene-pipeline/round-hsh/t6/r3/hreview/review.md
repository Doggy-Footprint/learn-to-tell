# 검수: 가비지 컬렉션 방식 (contrast)

대상: `scene.html`. 근거는 `shots/`(1280×800 기준)와 코드 위치(`scene.html:줄`). 스크린샷 순서는 step k = 단계 index k-1(step1 = A 생성, step5 = 루트 끊김, step6 = 반복).

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 카운트 손계산 최종 A=1, B=1 | 통과 | `scene.html:30–34` COUNT 4단계 rc 2,2 → 1,1; `scene-step5.jpg` rc 1, 1 |
| 사실: 512 KB, 쌍 1 MB, 100쌍 100 MB, GC 16쌍, 기준선 4 MB, 최대 약 20 | 통과 | `scene.html:22–25` (heapAt, mark 최대 19); `scene-step6.jpg` retained 100 MB |
| 사실: 화살표 방향(카운트는 들어오는 수, mark는 루트에서 나감) | 통과 | `scene.html:49–51`, `64–67` |
| 사실: 카운팅 장점은 승패 없이 대비로 | 통과 | 자막·takeaway에 승패 표현 없음 (`scene.html:137`) |
| 사실: CPython 순환 감지기, 순수 카운팅 모델 명시 | 통과 | `scene.html:139` basis; `scene-t1s.jpg` 하단 근거 줄 |
| 생성 순서(카운트): A → B → A.peer·B.peer(rc 2) → 루트 끊김(1,1) | 통과 | `scene.html:30–34`; `scene-step1.jpg`–`scene-step5.jpg` |
| 생성 순서(mark): A → B → 연결 → 루트 끊김 → GC mark → sweep → 반복 | 통과 | `scene.html:38–44` (코드). 스크린샷은 mark 쪽이 step0에 머묾, 코드로 확인 |
| 비트 1: 같은 코드 두 쪽, 루트가 쥠, 연결 후 값 | 통과 | `scene-step4.jpg` (A rc 2, B rc 2) |
| 비트 2: 루트를 놓는 순간 카운트 1,1 / mark는 아무 일 없음 | 통과(카운트) / 미확인(mark) | `scene-step5.jpg` 카운트 쪽. mark 쪽 스크린샷 없음 |
| 비트 3: GC 시점에 A, B를 표시 없이 회수 | 미확인 | mark 쪽 스크린샷 없음. 코드 `scene.html:42–43` |
| 비트 4: 100회 반복, 카운트 100 MB 계단 / mark 4–20 톱니 | 카운트 통과 / mark 미확인 | `scene-step6.jpg` 플롯 약 100 MB; mark 톱니 스크린샷 없음 |
| 비트 5: 스냅샷 A, B 200개, retainer가 서로뿐 | 통과 | `scene-step6.jpg` "Pair 200개 … A↔B뿐, 루트 없음" |
| 비트 6: 전역 캐시로 인한 반전 | 통과(방향에 따른 생략) | `direction.md` 최종 방향: 높이 때문에 생략, takeaway로 대체 |
| 강조: mark는 '도달 불가'로 끝난다 | 실패 | 스토리보드 16행. `scene.html:56` 라벨이 "mark 안 됨"뿐, "도달 불가" 문구가 없음 |
| 화면 결함: 잘림 (단계 5·6) | 실패 | `scene-step5.jpg`, `scene-step6.jpg`: 핵심 막대 하단이 이전/다음 줄 위에서 잘림(정상 막대 하단 y≈718, 여기선 y≈735). 원인은 자막·스냅샷이 3줄로 늘어난 것: `scene.html:34`, `95` |
| 화면 결함: 겹침 | 통과 | 두 쪽 패널이 겹치지 않음 (step1–step6) |
| 화면 결함: 빈 프레임 | 통과 | 모든 단계에서 그림과 플롯 표시 |
| 화면 결함: 읽을 수 없는 글 | 통과(권고) | 노드 `rc`·`peer` 글자가 작음(`scene-step4.jpg`). 값은 읽힌다 |
| 화면 결함: 움직임이 멈춤 | 통과(권고) | `scene-t1s.jpg`, `scene-t4s.jpg`, `scene-t8s.jpg` 동일: 로드 뒤 자동 진행 없음. direction의 "자동 재생"과 다르다. kit 플레이어 설정 문제라 고치지 않음 |

## 고칠 것
- `scene.html:34` 카운트 4단계 자막을 2줄 안으로 줄인다(잘림).
- `scene.html:56` mark 끝 라벨을 "도달 불가"로 바꾼다(강조).
- `scene.html:95` 스냅샷을 2줄 안으로 줄인다(잘림, 보유 경로 문구 유지).
- `scene.html:40–44` mark 쪽 3줄짜리 자막을 2줄 안으로 줄인다(같은 원인, 미확인이지만 같은 패턴).

## 고친 것
- `scene.html:34` 카운트 4단계 자막: "루트가 놓는다. rc 1, 1에서 멈춰 해제되지 않는다"로 줄임(잘림).
- `scene.html:40` mark 2단계 자막: "A.peer = B, B.peer = A. 순환이 완성된다"로 줄임(3줄 방지).
- `scene.html:41` mark 3단계 자막: "루트가 놓는다. GC가 올 때까지 메모리에 남는다"로 줄임(3줄 방지).
- `scene.html:42` mark 4단계 자막: "GC: 루트에서 닿는 것만 mark. A, B는 표시 없음"으로 줄임(3줄 방지).
- `scene.html:43` mark 5단계 자막: "sweep: 표시 없는 A, B를 회수. 순환 여부는 무관"으로 줄임(3줄 방지).
- `scene.html:44` mark 반복 자막: "쌍 16개마다 GC, 힙이 4 MB 기준선으로 돌아온다"로 줄임(3줄 방지).
- `scene.html:56` mark 끝 라벨: "mark 안 됨" → "도달 불가"(강조점).
- `scene.html:95` 스냅샷: "보유 경로: …, 루트 없음"을 "보유 A↔B뿐" / "보유 없음"으로 줄임(잘림). 객체 수·retained 값은 그대로.

실패 2항목(화면 잘림, 강조 라벨)은 위 Edit로 모두 고쳤다. audit은 고침 전후 모두 고침 0건이라 이 두 항목은 audit이 잡지 못했고 스크린샷 검수로 찾았다.
