# 반박: pilot shot·lesson V 행

대상: verdict "V"인 행. 이 중 shot은 s01, s13, s27, s51이다(s38, s50은 G라서 뺐다). lesson은 drawing-basics의 V 행 8개다.
"반박"은 필수 속성이 lost 또는 ambiguous로 바뀐 경우만 센다. kept→approx 하향은 따로 적고, 반박 수에는 넣지 않는다.

## s01
- b3 → ambiguous. d.ts는 loop를 "maps span (model time) onto ms"라고만 적고 선형 대응이라고 말하지 않는다. 그런데 `by`는 "linearly"를 근거로 삼는다. 반례 runtime: 의미 없는 easing은 runtime 소유이므로 loop 시간 대응에 ease-in-out 같은 단조 곡선을 걸 수 있고, 그러면 M이 차지하는 재생 비율 28%가 아무 값으로나 바뀌어 "M기만 느리게 재생"이 깨진다.
- (하향, 반박 아님) p1 kept→approx. 호마다 양쪽 끝에서 1.4°씩 잘라 내므로 M 호는 15°가 아니라 12.2°이고 G1:M은 11 대신 13.3으로 그려진다. 결론("M은 아주 짧다")은 유지된다.
- 빠진 필수 속성: 없음.

## s13
- b3 → ambiguous. 사유별 막대(`reason-*`, tone focus)가 같은 tone focus인 `panel` rect 위에 놓인다. d.ts는 rect가 채워지는지, MarkTree 순서가 칠하는 순서인지 말하지 않는다. 반례 runtime: rect를 focus 색으로 불투명하게 채우거나 panel을 나중에 칠하면 패널 안 막대가 보이지 않는다.
- q2·s1 approx: diff가 정직하고 결론도 유지된다(사유 막대들은 같은 PER 척도를 쓴다).
- 빠진 필수 속성: 없음.

## s27
- q1 → lost. series1/2/3은 서로 다른 범주 색일 뿐이고, d.ts는 이 tone들에 순서도 좋음·나쁨의 의미도 주지 않는다. 범례의 "■"는 muted tone의 글자라서 어느 색에도 묶이지 않는다. 그래서 보는 사람이 어느 색이 "약함"인지 알 수 없고, beat 3("약한 구역")과 결론이 서지 않는다. diff는 "의미 색만 잃는다"고 적어 손실을 실제보다 작게 말한다.
- (참고) b1: sweep가 불투명한 cell rect 아래에 칠해져도 "밝힘"은 tone이 muted에서 등급 색으로 바뀌는 것으로 살아남는다. 유지한다.
- i1 approx: 정당하다.

## s51
- b2 → ambiguous. 가운데 칸이 가장 높아지는지는 `api.rng(7)`이 만드는 160개 표본에 달려 있다. 그런데 d.ts는 "Seeded uniform [0, 1)"이라고만 적고 알고리즘을 정하지 않는다. 반례 runtime: 다른 PRNG를 쓰면 기대 도수가 36(가운데)과 31(5·7번 칸)이고 표준편차가 약 5.5라서, 5번이나 7번 칸이 가장 높은 표본이 흔히 나온다.
- (하향, 반박 아님) b1 kept→approx. beat는 "궤적을 남긴다"인데, 코드는 공의 현재 위치만 그리고 지나간 자취(trail)는 남기지 않는다.
- b3 approx: diff가 정직하고 결론도 유지된다.

## drawing-basics#01-hook-art
유지. 필수 속성이 없다. glyph "pencil"이 runtime의 glyph 집합에 있는지는 d.ts가 보장하지 않지만, 이 속성은 비필수다.

## drawing-basics#02-table
유지. (참고) split은 Compare와 달리 "side by side"를 명시하지 않는다. 다만 위아래로 쌓여도 두 모양의 대비는 남는다.

## drawing-basics#08-head-choices
유지.

## drawing-basics#08-head-answer
유지. reveal.marks는 split이 아닌 단일 figure s08의 mark id를 가리키고, d.ts에 명시된 동작이다.

## drawing-basics#09-basic-shapes
- P2 → ambiguous. 가려진 선(점선 `cyl-bot-back`, `box-e*` dash)이 `stillFill()` path(tone muted)와 같은 영역에 그려진다. d.ts는 path가 채워지는지, MarkTree 순서가 칠하는 순서인지 말하지 않는다. 반례 runtime: 닫힌 path를 불투명하게 채우고 line보다 나중에 칠하면 상자 면 안쪽의 숨은 모서리와 머그 실루엣 안쪽의 바닥 뒤쪽 점선이 가려진다.

## drawing-basics#10-ellipse-side
유지.

## drawing-basics#11-perspective
유지. 소실점 좌표(F/tanθ, −F·tanθ), 수평선 y=0, θ=0일 때 1점 투시, 화면 밖 화살표, topVis 판정을 코드에서 확인했다. 면 채움이 모서리 위에 칠해져도 연장선은 꼭짓점에서 바깥으로 뻗으므로 가려지지 않는다.

## drawing-basics#13-next-tree
유지하되 diff를 보완해야 한다. edge가 `directed:false`라서 layered 배치가 now→next 방향으로 층을 나눈다는 보장조차 없다. 하지만 "이번 수업" 노드는 tone focus로 구별되므로 결론은 유지된다.

## 공통 관찰(행별 판정과 별개)
- MarkTree 순서와 칠하는 순서의 관계, rect/path 채움 여부를 d.ts가 정하지 않는다. s13 b3과 lesson 09 P2가 이 때문에 반박됐다.
- loop가 시간을 선형으로 대응한다는 보장이 없다. 그래서 모든 beat 시각은 엄밀히는 근사다. 이 행들 중 재생 속도 자체가 원칙인 행은 s01뿐이다.

## 집계
- 검사한 행: 12 (shot 4, lesson 8)
- 반박된 행(필수 속성 ≥1이 lost·ambiguous): 5 (s01, s13, s27, s51, drawing-basics#09-basic-shapes)
- 반박률: 5/12 = 41.7%
- kept→approx 하향(반박 아님): 2 (s01 p1, s51 b1)
