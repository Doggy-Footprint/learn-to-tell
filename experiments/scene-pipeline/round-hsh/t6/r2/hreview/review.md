# 검수: 가비지 컬렉션 방식 (contrast)

## 사실 점검표
| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 연결 직후 A=2, B=2 | 통과 | scene-step3 "카운트 A 2 · B 2"; `counts()` A=x+BA, B=y+AB (scene.html:32) |
| x 해제 후 A=1 (B는 2 유지) | 통과 | scene-step4 "카운트 A 1 · B 2"; STATE[3] |
| y 해제 후 B=1, 둘 다 0 아님 | 통과 | scene-step5 "카운트 A 1 · B 1"; STATE[4] |
| 루트 경로 0개 | 통과 | scene-step6 "루트 경로 0개 → 힙에 남는다" (scene.html:57) |
| 비교용 순환 없는 x→A 즉시 회수 | 통과 | 장면 주장 아님, 화면 비트 아님 (스토리보드 비교 메모) |
| mark 결과: 표시 0, sweep 대상 A·B | 통과 | MS_STEPS 'mark'·'sweep' 캡션 (scene.html:66-67). 스크린샷은 MS 쪽 미진행이라 코드 근거 |
| 카운트 방향(들어오는 참조) | 통과 | `counts()` (scene.html:32), 캡션 "A.peer = B … 카운트가 2" |
| 순환 있어도 tracing에서 누수 아님 | 통과 | 누수 정의는 takeaway "회수 조건이 채워졌는가"와 맞음 |
| 런타임 사실(CPython 순환 탐지, V8·JVM·Go tracing) | 통과 | basis 문구 (scene.html:130), scene-t1s 하단 근거 줄 |
| V8 스냅샷 전 GC | 통과 | 장면에 없음 (스토리보드 메모) |

## 생성 순서
| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 객체 생성 → 변수 연결 → 객체 연결 → 변수 해제 | 통과 | STATE 0→4 순서 (scene.html:23-29); scene-t1s, step2, step3, step4, step5 |
| 카운트는 연결 때 오르고 해제 때 내린다 | 통과 | scene-step2 1·1 → step3 2·2 → step4 1·2 → step5 1·1 |
| mark가 sweep보다 먼저 | 통과 | MS_STEPS mark(scene.html:66) → sweep(:67) 순서 |
| 회수는 GC 사이클 때 | 통과 | RC 마지막 캡션 "GC 시점" (scene.html:57), scene-step6 |

## 비트
| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 1. A·B 생성, 카운트 0·0, MS 0개 | 통과 | scene-t1s "카운트 A 0 · B 0", "루트에서 도달: 0개" |
| 2. x→A, y→B, 1·1 | 통과 | scene-step2 "카운트 A 1 · B 1" (RC). MS "루트 → A, 루트 → B"는 코드 근거 |
| 3. 서로 연결, 2·2 | 통과 | scene-step3. MS "루트 → A ↔ B"는 코드 근거 |
| 4. x 해제, 1·2, MS는 y→B→A로 닿음 | 통과 | scene-step4. MS 캡션은 코드 근거 |
| 5. y 해제, 1·1, retainer 서로뿐 | 통과 | scene-step5 "A의 retainer: B뿐 · B의 retainer: A뿐" |
| 6. GC 시점: RC 잔존, MS mark→sweep | 통과 | RC scene-step6 "회수 안 됨". MS mark·sweep은 코드 근거 |
| 5'. tracing 쪽 전역 캐시 누수 | 통과 | 방향(direction.md 버림 목록)에 따라 뺌 |

## 화면 결함
| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 겹침 | 통과 | scene-t1s ~ step6, 겹치는 요소 없음 |
| 잘림 | 통과 | 모든 스크린샷에서 카드 안에 정상 노출 |
| 빈 프레임 | 실패 | 두 카드 모두 배지 오른쪽 아래가 빈 영역. before/after `note`(scene.html:120, :126)가 어느 스크린샷에도 없다 |
| 읽을 수 없는 글 | 실패 | scene-t1s·step2 등: 그림 노드 라벨("루트 변수", "객체", "카운트")이 5px 안팎으로 읽히지 않음. scene.html:35 `cell`·`node` |
| 움직임이 멈추는 곳 | 통과 | 단계 재생은 각 쪽 '다음'으로 끝까지 간다(RC 끝 단계 scene-step6). MS 쪽은 누를 때까지 step 0에 머문다 (아래 권고) |

## 권고 (고치지 않음)
- MS 쪽 플레이어가 RC와 따로 돈다. 같은 STATE를 밟으므로 방향 위반은 아니나, 한 화면에서 두 쪽 단계가 어긋나 비교가 어렵다. 해결은 플레이어 하나로 묶는 구조 변경이라 이번 수정 범위 밖이다.
- MS 쪽 비트 2~6은 스크린샷으로 확인하지 못했다(RC만 진행). 코드 경로는 확인했다.
- `note` 누락은 kit의 contrast 렌더링 동작을 봐야 해서 이번에는 손대지 않았다(refs/api에 해당 부품이 없음).

## 고친 것
- 읽을 수 없는 글(그림 라벨): scene.html:35 `cell` [200, 120]→[112, 116], `node` [130, 54]→[92, 54]로 줄여 그림을 카드 폭에 맞게 키웠다. audit은 고침 0건이나, 스크린샷은 재촬영되지 않아 글자 크기는 아직 눈으로 확인하지 못했다.
- 빈 프레임(note 미표시): 고치지 않았다. kit의 contrast 렌더링을 확인할 수 없다.
