# 반박: wave 1 lesson V 행 표본

대상: 지정된 lesson V 15행. 원본은 `tmp/audit/src/<lesson>.html`, 조각은 `bench/coverage/lessons/<lesson>.js`, 계약은 `packages/runtime/types/lesson.d.ts`(+ ext)다.
"반박"은 필수 속성이 lost 또는 ambiguous로 바뀌거나 빠진 필수 속성이 있는 경우만 센다. 참고 사항은 반박 수에 넣지 않는다.

공통 근거(graph 프레임 좌표): `P`는 "Point in the frame's data units"인데 `graph()`는 data 범위를 선언하지 않는다. `node`의 `at`("at overrides layout")과 graph 프레임 안의 `label`·`code` 위치는 어떤 단위인지 d.ts가 정하지 않는다. 반례 runtime: graph 프레임의 data 창을 [0,1]²로 고정하면, "marks are clipped to the frame"에 따라 at이 [2,0]이나 [440,250]인 node와 label이 잘려 보이지 않는다. 같은 조각의 표현자도 ontology-triples#row2triples P6에서 이 점을 ambiguous로 적었다.

## drawing-basics#head
- P1 → ambiguous. 선택지마다 `params: { eyeFrac }`가 붙어 있다. 그런데 figure는 eyeFrac을 키로 하는 `multiples`다. d.ts는 "params apply to the figure while this option is selected"와 "one copy per value"가 부딪힐 때 어느 쪽이 이기는지 말하지 않는다. 반례 runtime: 선택한 선택지의 params를 over 값 위에 덮어쓰면, 고르는 동안 세 머리가 모두 같은 눈 높이로 그려져 나란히 비교하는 구도가 사라진다.
- (참고) v1에서는 머리마다 A·B·C 글자가 붙어 선택지와 짝지어졌는데, 조각에는 이 글자가 없다. multiples가 판마다 over 값을 표시한다는 문장도 없다. 다만 선택지 글("위에서 1/3")만으로도 짝은 지을 수 있다.
- P2·P3·P4는 유지한다. 눈 위치 80 − 165f는 v1의 y 아래 방향 식을 y 위 방향으로 뒤집은 것으로 맞고, 정답 그림의 두 dim 길이는 82.5로 같다.

## drawing-basics#table
유지. 투영값을 확인했다. 앞 변은 y −200, x ±300이고 먼 변은 y −111, x ±166.7이며 비는 0.556이다. 눈높이 sweep y=0은 사다리꼴 위에 있다.
- (참고) v1 패널 머리 "아는 모양 (위에서 본 식탁)"과 "보이는 모양 (앉은 눈, 식탁 위 40cm)"가 조각에서는 `static` 대체 글로만 남아 화면에 나오지 않는다. 제목과 장면 글이 그 대비를 말하므로 결론은 남는다.

## drawing-basics#overview
- P3 approx → ambiguous. 그늘과 던진 그림자를 v1의 `#000` 대신 `tone: "muted"` + `fill: "solid"` + opacity로 그렸다. 그런데 정물의 면도 같은 muted tone(`fill: "soft"`)이다. d.ts는 tone의 명도 순서도, solid가 soft보다 어둡다는 것도 정하지 않는다(테마 색은 runtime이 갖는다). 반례 runtime: 어두운 테마에서 muted를 밝은 회색으로 두면 그늘이 빛 받는 면보다 밝아진다. 그러면 ⑤ "그늘과 던진 그림자는 오른쪽"이 뒤집힌다. diff의 "어두움 정도"는 정도만이 아니라 방향까지 보장되지 않는다는 점을 줄여 말한다.
- P1·P2는 유지한다. 그림자 이동 (+24, −2)는 v1의 (+24, +2)를 y만 뒤집은 것으로 맞다.

## ontology-triples#tag-vs-onto
- P2 → ambiguous. "→ 3명 (추론 켬)" label과 SPARQL `code`가 graph 프레임 `ontoSide`에 data 좌표([10,16], [10,60])로 놓여 있다. 공통 근거의 반례 runtime에서는 잘려 보이지 않는다.
- P3 → ambiguous. subClassOf 간선의 양 끝 node가 `at: [80..440, 250]`이라서, 같은 반례 runtime에서는 node가 잘려 화살표가 보이지 않는다.
- P1은 유지한다(split, tone bad/good).

## ontology-triples#domain-answer
- P1 approx → ambiguous. 점선 대신 tone·weight로 그린 근사는 정직하다. 그러나 u9·acct42·:직원 node를 `at: [90,50]` 등으로 고정했으므로 공통 근거의 반례 runtime에서 잘린다.
- P2 → ambiguous. "3 + 1 = 4명" label이 graph 프레임의 [250,150]에 놓여 있다. 같은 반례가 적용된다.
- (값 확인) inf8로 계산한 :직원 수는 4(emp17·21·30, u9)이고, emp6은 3이다. 맞다.

## ontology-triples#decide
유지. cells 3×6에 v1 표의 5행과 머리 행이 글자 그대로 들어 있고, approx diff(균등 칸)도 정직하다.
- (참고) "Points are [col, row]"는 0행이 위인지 정하지 않는다. 머리 행이 아래로 갈 수 있지만 bold 머리 글로 구별된다.

## ontology-triples#overview
유지. 단 높이 top = 270 + 30i는 v1의 150 − 30i를 y만 뒤집은 것으로 맞다. path는 기본이 외곽선이고("path none (outline)"), 아는 단만 muted다.
- (참고) v1에서 두 줄로 나눈 항목 글을 한 줄 label로 합쳤다. 176 단위 폭의 단을 넘칠 수 있지만, 글꼴과 px 배치는 감사 대상이 아니다.

## investing-basics#term-적립식
유지. 18×32 크기의 같은 rect 4개로, v1과 같다.

## investing-basics#overview
유지. P1·P2의 approx diff는 정직하다. at을 쓰지 않으므로 layered 배치가 그대로 적용된다.
- (참고) Text 안의 `\n`이 줄바꿈되는지, edge가 기본으로 화살표인지 d.ts는 말하지 않는다. 흐름 순서는 direction "right"가 지킨다.

## llm-hallucination-internal#tokens
유지. 강조 없는 토큰 5칸의 x·w가 v1과 같다.

## llm-hallucination-internal#term-probe
유지.
- (참고) 축 단위 "칸"·"층"을 termStream에서 그대로 복사했다. probe 그림에는 층이 없으므로, runtime이 단위를 표시하면 사실과 다른 축 이름이 된다. P1에는 영향이 없다.

## llm-hallucination-internal#probe
유지. 점 좌표는 v1과 같다. probeHits(0/45/90/135/180) = 10/12/8/4/2이고, 경계·반평면·warn 링·w 화살표가 ang에 따라 다시 계산된다. aspect "equal"이 수직을 유지한다.

## trolley-ethics#debate-deontologist
- P1 → ambiguous. `mini()`가 두 node를 `at: [0,0]`, `[2,0]`에 고정한다. 공통 근거의 반례 runtime에서는 "수단" node가 잘려 "부수 효과 ≠ 수단"이 읽히지 않는다. at을 빼고 layered 배치에 맡겼다면 kept였다.
- (참고) 같은 `mini()`를 쓰는 term-*·debate-consequentialist·kant 행도 같은 문제를 가진다(표본 밖).

## trolley-ethics#chains
- P3 → ambiguous. 2×2 격자가 graph 프레임에서 node `at`(열 0–8, 행 −1–2)과 머리글 `label` 위치에만 기댄다. 공통 근거의 반례 runtime에서는 대부분 잘린다.
- P5 → ambiguous. 판정 태그 label(verdict-sw, verdict-br)도 graph 프레임의 data 좌표에 놓여 있어 같은 반례가 적용된다.
- P1·P2는 유지한다. 간선 위상(turn→five, turn→one이 가지로 갈림; 민다→떨어진다→멈춘다→산다가 한 사슬)은 배치와 무관하다. P4 approx(opacity·muted)는 정직하다.

## trolley-ethics#bridge
유지. v1 좌표를 y만 뒤집어 옮겼다. 육교 rect는 330–374, 전차 경로는 20→325에서 멈추고, 사람은 0.6–2.0s에 136→190(v1 y 아래 방향)으로 떨어지며, 도착 뒤 집계가 나온다. 모두 v1과 같다. 원래 자리의 점선 원(ghost)은 결론이 기대지 않는다.

## 집계
- 검사 행 수: 15
- 반박된 행 수: 6 (drawing-basics#head, drawing-basics#overview, ontology-triples#tag-vs-onto, ontology-triples#domain-answer, trolley-ethics#debate-deontologist, trolley-ethics#chains)
- 반박률: 6/15 = 40%
- 이 중 4행(ontology 2, trolley 2)은 원인이 하나다. graph 프레임에서 `at`과 label 위치의 단위가 정의되지 않았다. d.ts가 graph 프레임의 data 좌표(예: "at and marks in graph frames use the layout's unit box, fitted to content")를 정하면 함께 풀린다.
