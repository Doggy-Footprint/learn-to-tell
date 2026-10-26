# 검수: 신용 창조와 통화 승수 (scene.html)

기준: storyboard.md (사실 점검표·생성 순서·비트), direction.md는 방향 기록 없음.

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 라운드 1~3 (100/10/90 · 90/9/81 · 81/8.1/72.9) | 통과 | scene.html:33,70 (dep=100·(1−r)^(k−1), 준비금=d·r). scene-t1s.jpg 라운드 4 = 72.9 / 7.3 / 65.6 |
| 사실: 누적 3라운드 271, 5라운드 409.51 | 통과 | scene.html:34,37-38 (LTT.expect 2건 통과). scene-t1s.jpg 누적 343.9(4라운드) |
| 사실: 극한 총예금 1,000 | 통과 | scene.html:39,80 "1,000 억 한계 = 100 ÷ 10%" |
| 사실: 총대출 900 | 통과 | 화면에 수치로 나오지 않음. 필수 표시 항목 아님 |
| 사실: 준비금 합계 100 (= 최초 예금) | 실패 | scene.html:81 값 stat이 카드 하단에서 잘림. scene-t1s/t4s/t8s.jpg 모두 "→ 한계 100" 안 보임 |
| 사실: 승수 1/r → 천장 2,000 / 1,000 / 500 | 통과 | scene.html:96-100 r별 라벨. scene-knob-r-min.jpg 2,000선, scene-knob-r-max.jpg 500선 |
| 사실: 단위 (억 원, 지준율 % 표시 · 소수 계산) | 통과 | scene.html:45,80,94 ("억 원", `r * 100`%) |
| 사실: 이론상 상한 단서 | 통과 | scene.html:50 basis. 우측 레일 작은 글(전 스크린샷) |
| 생성 순서: 예금 → 준비금+대출 → 다음 예금 (대출 → 예금) | 통과 | scene.html:71-74 chain. scene-t1s.jpg 라운드 4 → 준비금·대출 → 라운드 5 |
| 생성 순서: 총예금이 라운드마다 쌓임 | 통과 | scene.html:105-115 addRound가 k번째 증분을 누적 위에 한 칸씩 추가. scene-t4s.jpg 계단 |
| 생성 순서: 천장선이 먼저 보임 | 통과 (판정 여지) | scene.html:95-103 frame()이 시작 때 r 3개의 기준선을 그린다. 비교용 기준선이고 막대는 0에서 쌓이므로 방향 유지 |
| 생성 순서: r 변경 시 비율·천장 재계산 | 통과 | scene.html:130-133 sweep → run(r/100) → frame(r) |
| 비트 1: 100 예금, 10% 묶임, 90 대출 가능 | 통과 | scene-t1s.jpg 첫 막대 "100", chain 준비금·대출 |
| 비트 2: 대출이 다른 은행의 새 예금 | 통과 | scene-t4s.jpg "→ 받은 쪽이 예금 →" |
| 비트 3: 폭 0.9배, 누적 271 → 409.5 | 통과 | scene-t4s.jpg 막대 폭 감소, 누적 stat(scene.html:79) |
| 비트 4: 1,000 못 넘김, 준비금 100 불변 | 실패 | 준비금 stat 잘림 (위 사실 행과 같은 원인). 천장선 자체는 보임 |
| 비트 5: r 5·10·20 → 2,000·1,000·500 | 통과 | scene-knob-r-min.jpg, scene-knob-r-max.jpg 라벨과 칩 |
| 비트 6: 기사 해석 (상한만 오름) | 통과 | scene.html:48,50 takeaway·basis |
| 화면 결함: 겹침·잘림 | 실패 | 카드 하단이 내비게이션 바(y≈735px) 아래로 잘림. 원인은 chain 2행(scene.html:14)과 stats 2행(scene.html:26). audit shrink 78~80% |
| 화면 결함: 빈 프레임 | 통과 | 전 스크린샷에 막대·칩·값 표시 |
| 화면 결함: 읽을 수 없는 글 | 통과 (권고) | SVG 960 폭을 축소해 축·막대 라벨이 약 9px. scene.html:56,65. 권고만 |
| 화면 결함: 움직임이 멈추지 않음 | 통과 | scene.html:124 k≥N에서 clearInterval, scene.html:135 leave에서 정지 |

## 고친 것

- 사실: 준비금 합계 100 stat 잘림 → scene.html:26 `.cc-stats`를 nowrap, gap 16px로 줄여 한 줄에 둠 (시각 재확인 안 됨)
- 비트 4: 같은 원인, 위와 같은 Edit로 함께 해결 (시각 재확인 안 됨)
- 겹침·잘림: scene.html:14 `.cc-chain`을 nowrap, scene.html:15 `.cc-box` min-width 0으로 바꿔 chain 2행을 1행으로 (audit 1280 shrink 78%, 변화 없음; 1440은 80→82%)
