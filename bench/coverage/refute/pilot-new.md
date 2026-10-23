# 반박 기록 · new pilot (생명과학·음악) V 행

기준: `packages/runtime/types/lesson.d.ts`, `ext/*.d.ts`가 명시한 것만 보장으로 본다.
공통 반례 두 가지:
- (T) `Tone` JSDoc은 "Colors are assigned by the runtime per tone"뿐이다. series1~6이 서로 다른 색이라는 말은 없다. series를 모두 같은 회색으로 칠하는 runtime도 d.ts를 지킨다. (focus는 "the accent"라고 명시돼 있어 구분이 보장된다.)
- (M) `multiples`는 "One copy per value combination of model params"다. model defaults에 없는 키(ctx.params에서만 읽는 키)로 펼치는 것은 보장되지 않는다. model param이 아닌 키를 무시하고 기본값 사본만 만드는 runtime도 d.ts를 지킨다.

## dna-replication#F1
유지. (P3 approx는 위 (T)를 스스로 인정하고 있고, 연결선이 인덱스 대응을 따로 담는다.)

## dna-replication#F2
유지.

## dna-replication#F4
유지. 주의: 주형 화살표(0→10, "3'→5'")와 프라이머 화살표가 같은 쪽을 가리켜서 F1의 "화살표 = 5'→3'" 규약과 어긋난다. 역평행은 라벨로만 읽힌다. P2는 kept보다 approx에 가깝지만 반박 수에는 넣지 않았다.

## dna-replication#F5
- P3 (선도/지연 두 색, 프라이머 제3색) kept → **ambiguous**. 반례 (T): series1/2/3을 한 색으로 칠하는 runtime에서는 세 가닥 종류가 구별되지 않는다.

## dna-replication#F6
유지.

## dna-replication#F7
유지. (P2 approx는 정직하다. 띠 비율은 수치 라벨로도 남는다.)

## dna-replication#F8
유지. 확인 결과 A/D는 선도 가닥, B/C는 지연 가닥이고 정답 B와 맞다. `lag-B` mark는 reveal 0인 채로 끝까지 공개되지 않는 죽은 mark다. 속성에는 영향이 없다.

## dna-replication#F9
유지.

## enzyme-kinetics#F1
유지. 확인 결과 prof의 피크는 40+Ea이고 dim 70/115와 맞는다. 양끝 높이도 같다.

## enzyme-kinetics#F2
유지. (P1·P2·P5 approx는 정직하고 포화의 원인도 그대로 보인다.)

## enzyme-kinetics#F3
유지. 주의: 비례 직선의 기울기가 10이라 (1 mM, 33)을 지나지 않는다. 오개념("10배 → 10배")이 실제로 예측하는 직선(기울기 33)이 아니라 임의의 직선이다. P3는 approx가 맞지만 반박 수에는 넣지 않았다.

## enzyme-kinetics#F4
유지.

## enzyme-kinetics#F7
유지. (`kind`는 model inhib의 param이라 (M)에 해당하지 않는다.)

## enzyme-kinetics#F8
유지. 주의: 두 세트 중 어느 쪽이 저해제 +인지 범례가 없고, 구분은 series1/2 색에만 기댄다(T). 같은 [S]에서 두 점이 위아래로 짝지어져 판독은 가능하다.

## enzyme-kinetics#F9
유지.

## harmonic-series-consonance#F1
- P4 (모드별 small multiples + 합성) approx → **ambiguous**. 반례 (M): `mode`는 어떤 model의 param도 아니라서, model param만 펼치는 runtime에서는 7개 사본이 모두 n=1이 된다. P1·P2의 n차 모드 표시도 함께 무너진다.

## harmonic-series-consonance#F2
유지.

## harmonic-series-consonance#F3
- P3 (4개 음정 small multiples) kept → **ambiguous**. 반례 (M): `ratio`는 model param이 아니라서, 사본 4개가 모두 기본값 "2:1"로 그려질 수 있다.

## harmonic-series-consonance#F4
유지.

## harmonic-series-consonance#F5
유지.

## harmonic-series-consonance#F7
- P3 (compare에서 평균율 5도가 약 0.9 Hz로 맥놀이) approx → **lost**. clash()의 `df < 1`이 "same"을 뜻하는데, 평균율 700 cent에서 A3/B2의 차이는 약 0.91 Hz라 순정 5도와 똑같이 "일치" 점으로 그려진다. 두 패널이 같은 그림이 되고, 차이는 say 글에만 남는다.
- 참고: P1 approx의 diff는 장3도·단3도 부호만 언급하지만 5도 부호도 뒤집혔고(+2.0), toFixed(1) 때문에 1.96이 2.0으로 반올림된다. 크기는 유지돼 approx 판정은 그대로 둔다.

## triads-inversions-voicing#F2
유지.

## triads-inversions-voicing#F3
- P1 (3화음이 오선의 같은 종류 자리에 겹침) kept → **lost**. `STEP`이 D♯=1, F♯=3으로 샵 철자만 써서, 단3화음 C–D♯–G는 step 0/1/4, 감3화음 C–D♯–F♯는 step 0/1/3이 되어 줄과 칸이 섞인다. by가 주장한 "3도마다 같은 줄·칸"이 코드에서 성립하지 않는다(4종 중 2종). 덧붙여 staffY(60)이 y=2.5라서 C4가 높은음자리표 오선 안쪽(덧줄이 아닌 자리)에 놓인다.

## triads-inversions-voicing#F4
- P4 (predict 후 공개) kept → **approx**. reveal.marks가 `inv1n0`을 가리키지만 F4는 steps figure이고 Predict 장면은 step을 넘기지 않는다. step 0에서는 forms.slice(0,1)만 그려져 `inv1n0`이 없다. 그림 공개는 일어나지 않고 reveal.say 글만 남는다. by의 주장과 코드가 다르다.

## triads-inversions-voicing#F6
유지. 주의: 가까운 전위의 이동 합은 3+6+3=12로, brief의 "한 자리 수"가 아니다(근음 위치는 42). 대비는 성립한다.

## triads-inversions-voicing#F7
유지.

## 집계
- 검사한 행: 26 (dna 8, enzyme 7, harmonic 6, triads 5)
- 반박된 행(필수 속성 ≥1 반박): 6 (dna#F5, harmonic#F1, harmonic#F3, harmonic#F7, triads#F3, triads#F4)
- 반박률: 6/26 = 23.1% (프로토콜 기준 10% 초과 → 재감사 대상)
- 반박 수에 넣지 않은 주의: dna#F4 P2, enzyme#F3 P3, enzyme#F8, triads#F6 P1
