# 반박 기록 · new-b1 wave 1 V 행 표본 (22행)

기준: `packages/runtime/types/lesson.d.ts`, `ext/*.d.ts`가 명시한 것만 보장으로 본다. 조각은 고치지 않았다.
반박으로 세는 것은 필수 속성이 lost 또는 ambiguous로 바뀌는 경우뿐이다. kept→approx로 낮출 일은 "주의"로 적고 반박 수에는 넣지 않았다(앞선 pilot 반박과 같은 기준).

공통 반례:
- (K) Explore JSDoc은 "knobs: model param to slider, choices, or toggle"이다. model defaults에 없는 키(ctx.params에서만 읽는 키)를 knob으로 두는 경우는 보장되지 않는다. model param이 아닌 knob을 무시하는 runtime도 d.ts를 지킨다.
- (R) "reveal.marks stay hidden until answered"는 Predict에만 적혀 있다. QuizReveal은 "Shown after a choice or numeric answer is submitted"뿐이라, quiz 그림의 marks를 처음부터 그려 두고 제출 뒤에 강조만 하는 runtime도 d.ts를 지킨다.

## price-elasticity-of-demand#F5
유지. 확인: gain 3,000×7,000 = 2,100만 원, loss 9,900×3,000 = 2,970만 원, 수요선 P = 19,900 − Q가 A(10,000, 9,900)와 B(7,000, 12,900)를 지난다. P3 approx(라벨이 사각형 안에 놓인다는 보장이 없음)는 정직하다.

## harmonic-series-consonance#F4
- P4 (predict: 고른 뒤 공개) kept → **ambiguous**. Option.params는 "while this option is selected"에 적용되므로, 제출 전에 선택만 바꿔도 C–C#(cents 100)의 부딪힘 그림이 미리 보이는 runtime이 d.ts를 지킨다. 기본 그림(cents 700)의 부딪힘 mark도 reveal.marks로 가려 두지 않았다.
- 주의(P2, 반박 수 제외): 일치 기준이 |Δf| < 1 Hz여서 평균율 5도에서 3/2 쌍(0.9 Hz)은 "일치"로, 6/4 쌍(1.8 Hz)과 9/6 쌍(2.7 Hz)은 "부딪힘"으로 나뉜다. 같은 관계가 다르게 분류되는 셈이다. C–G 11쌍 대 C–C# 18쌍이라 결론은 남는다.

## confounding-and-randomization#F5
유지. histogram 40 bins × [−4, 16] = 0.5%p 구간, 1,000회 시뮬레이션, SD 라벨은 model 값이다.

## enzyme-kinetics#F2
유지. knob 범위 0.2–200 mM = 0.1–100×Km(log). 점유 확률은 s/(Km+s), fill none/solid가 MarkOpts로 보장된다. P1 approx(사건 순서와 확산 궤적이 이어지지 않음)는 정직하고 포화의 원인도 보인다.

## circular-flow-of-income#F8
유지. 주의: 카드 "구독료 결제"의 reveal.marks `c-hi`는 term === "C"일 때만 그려진다. 그런데 f7thumb는 f7을 term ""로 inset하므로 이 mark는 존재하지 않는다. inset 안 mark id를 쓸 수 있는지도 d.ts에 없다. P2 diff의 "reveal.marks 강조로 대신"은 이 카드에서는 성립하지 않는다. 다만 필수 속성(옆의 축소판)은 QuizItem.figure로 남는다.

## enzyme-kinetics#F1
유지. 확인: 두 path의 시작점 (0, 20)과 끝점 (10, 5)가 같고, Bézier 정점이 95와 50이라 Ea 75와 30이 맞다.

## dna-replication#F1
- P3 (같은 위치의 염기쌍 ↔ 문자열 인덱스 i ↔ n−1−i) approx → **lost**. 위 가닥 `ATGCCGTA`가 역상보 회문이다. 역상보 TACGGCAT가 단순 상보와 같아서, 아래 문자열을 뒤집어도 글자가 바뀌지 않는다. 그래서 '역'이 글자에서 보이지 않고, 연결선만 교차한다. 그림의 결론(왜 역상보인가)을 읽어 낼 수 없다.

## price-elasticity-of-demand#F2
유지. 확인: Q(9,900) = 10,300, Q(12,900) = 1,300이고, 이동 후 곡선은 (30,000, 0)–(0, 10,000)이다. panel은 shift model의 param이고, Compare가 같은 figure를 나란히 보장한다.

## impulse-and-ground-reaction-force#F1
유지. 접촉 rect는 0–0.25 s, 체공 rect는 0.25–60/170 s이다. 발은 t ≤ 0.25에서 지면선 y = 0.15에 있다. Loop ms 1412 / span 0.353 s는 1/4 속도다.

## dna-replication#F7
- P1 (좌우 두 모델) kept → **lost**. msPanel의 분자 그림은 `mol${n}a`의 tone이 언제나 series1이고, `mol${n}b`는 n > 0에서 series2다. 그래서 보존적 패널도 1·2세대를 무거움+가벼움 혼성 분자로 그린다. 두 모델의 분자 그림이 똑같고 띠 막대만 다르므로, 모델 차이(가닥 분배)라는 비교의 근거가 거짓이다. 띠 비율(P2)과 강조(P3)는 맞다.

## harmonic-series-consonance#F3
유지. 확인: 0.22 cycles/ms = 220 Hz, 공통 주기 = q/220 s이다. 주의(P2, 반박 수 제외): 16:15의 15주기(68 ms)는 20 ms 창 밖이라 그 패널에는 공통 주기선이 없다. 5:4도 18.2 ms에 한 번뿐이다. brief 속성의 문자대로는 approx이고, "단순비 = 짧은 반복"이라는 결론은 남는다. sweep에는 dash 옵션이 없어 "점선"도 보장되지 않는다.

## enzyme-kinetics#F7
유지. kind는 inh model의 param이라 multiples가 보장된다. Km_app = 4, Vmax_app = 50이다. 주의(P4, 반박 수 제외): `by` 스스로 "x 20 mM까지는 수렴이 다 보이지 않아 화살표로 방향만"이라고 적었으니 approx가 맞다. 화살표 끝 (19, 97)은 기준 곡선(19 mM에서 90.5)보다 위에 있다. 간격이 17에서 8로 줄어드는 것은 보이므로 결론은 남는다.

## circular-flow-of-income#F7
- P3 (식의 항 선택 → 대응 화살표 하이라이트) approx → **ambiguous**. 반례 (K): `term`은 fee·chain·app 어느 model의 param도 아니다. 그래서 term knob을 무시하는 runtime에서는 하이라이트가 일어나지 않는다.
- 나머지 확인: 세금·저축·수입은 가계에서 나가고, 정부구매·투자·수출은 기업으로 들어간다(P1). 이전지출은 dash와 series4다(P4).

## circular-flow-of-income#F5
유지. 매출 스택 100/250/600 = 950, 부가가치 스택 100/150/350 = 600, brace는 600–950 "차이 350원"이다.

## dna-replication#F8
- P1 (거품 양쪽 분기점에서 선도/지연 뒤바뀜) kept → **lost**. 위 주형은 5'→3'(왼→오)이고, 분기점은 lf가 왼쪽, rf가 오른쪽으로 움직인다. 그러면 A·D가 선도, B·C가 지연이다. 그런데 조각은 "A와 D"를 correct로 두고 "B와 C"를 오답("주형 방향을 다시 보자")으로 채점한다. 이해 검증의 정답이 뒤집혔다.

## dna-replication#F6
유지. frags = floor(speed·1 s / gap)이고 x축은 선형 0–2,000 nt, speed와 gap은 fork model의 param이다.

## confounding-and-randomization#F6
유지. 확인: z(CRM) ≈ 6.7(p < 0.001), z(무작위) ≈ 1.03(p ≈ 0.30)이다. 무작위일 때 vip→coupon edge가 빠지고, node at이 배치를 고정한다. P1 approx(F1 아이콘 구성이 빠짐)는 정직하다.

## personal-data-roles-and-transfers#F3
유지. Predict의 params와 reveal.params(placed)로 공개되고, reveal.marks(mailer-why, mailer-cond)는 "stay hidden until answered"로 보장된다. P2 approx는 정직하다.

## personal-data-roles-and-transfers#F1
- P1 (기술/법적 레이어 토글) kept → **ambiguous**. 반례 (K): `legal`은 어느 model의 param도 아니다(models는 classify뿐이다). 그래서 knob `legal: false`를 무시하는 runtime에서는 토글이 없다.

## dna-replication#F4
유지. 주형 화살표 11→1 "3'→5'"와 프라이머 "5'→3'"은 역평행이고, step 3에서 프라이머 끝이 6으로 늘어난다. 주의: `end3` dot("3'-OH")은 step 3에서도 x = 5에 남아 새 3' 끝을 따라가지 않는다.

## enzyme-kinetics#F6
유지. 핸들 km-pt(x: km)와 vmax-h(y: vmax)이 있다. 노이즈는 ±8.5% 균등분포라 SD ≈ 4.9%로 5%에 맞다. 오차 막대는 ±5%이고, Vmax/2와 Km 교점은 dot size l, tone focus다.

## personal-data-roles-and-transfers#F7
- P3 (퀴즈 응답 후에만 책임 화살표 공개) kept → **ambiguous**. 반례 (R): QuizReveal에는 marks를 제출 전에 숨긴다는 문장이 없다. liability 그림은 liab-a와 liab-b를 무조건 그리므로, 문항과 함께 화살표가 처음부터 보이는 runtime도 d.ts를 지킨다.
- 나머지(P1 방향과 도달 범위, P4 bold+focus)는 유지.

## 집계
- 검사 행 수: 22
- 반박된 행 수(필수 속성 lost/ambiguous 1개 이상): 7 (harmonic-series-consonance#F4, circular-flow-of-income#F7, personal-data-roles-and-transfers#F1, personal-data-roles-and-transfers#F7, dna-replication#F1, dna-replication#F7, dna-replication#F8)
- 반박률: 7/22 = 31.8% (10% 초과)
- kept→approx 주의(반박 수 제외): harmonic F3 P2, harmonic F4 P2, enzyme F7 P4
- 반박 유형: 계약 공백 4(knob이 model param이 아님 2, QuizReveal marks 숨김 1, Option.params 선택 중 미리보기 1), 표현자의 값·데이터 오류 3(dna F1 회문 서열, dna F7 보존적 분자 색, dna F8 정답 뒤집힘)
