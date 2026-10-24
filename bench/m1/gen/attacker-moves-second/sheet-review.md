# sheet review: attacker-moves-second

| id | PNG | scene #·state | 관찰 | 원인(runtime/lesson) | 심각도(차단/권고) |
|---|---|---|---|---|---|
| R1 | desktop-2/3/4, mobile-2/3 | #10–#12, #19 전 상태 | loop 그림의 atk 노드는 항상 "사람 red-teamer"(step 3), score 노드는 항상 "손실·기울기"(step 0)로 표시된다. step에 따라 바뀌지 않고, 두 노드가 서로 다른 step의 값을 보여 준다. #11 steps에서 1→4단계로 가도 그림이 그대로다. lesson.js는 `[...][step]`로 맞게 썼다 | runtime | 차단 |
| L1 | desktop-2, mobile-2 | #6 predict·initial | drag로 맞혀야 하는 점 `nowdot`의 초기 위치가 정답(63%)이다. 학습자가 끌기 전에 답이 보인다(`api.dot([n, m.asr.asr])`) | lesson | 차단 |
| R2 | mobile-1/3/4, desktop-1/3/4 | #1,#3,#4,#14,#15,#19 | bars의 카테고리 라벨(입력 필터 등)이 적응형 막대 아래쪽을 덮고, 모바일에서는 라벨끼리 맞붙는다. #4 compare 작은 그림에서는 라벨이 leader line과 함께 계단식으로 쌓여 막대와 겹친다 | runtime | 권고 |
| L2 | 전체 | #1,#3,#4,#14,#15 | 정적 막대(0.3–0.9%)가 1px 남짓으로 거의 보이지 않아 "정적 대 적응형" 대비가 막대 하나로만 읽힌다. 선형 y축에서는 1% 미만 값이 보일 수 없다(축 분할이나 값 라벨이 필요하다) | lesson | 권고 |
| L3 | desktop-3, mobile-3 | #14 predict | A(0.5%)와 B(30%) 보고서를 비교하는 질문인데, 그림은 네 방어의 정적/적응형 막대(a0·s0 강조)다. 30%짜리 값은 그림에 없어 그림과 질문이 맞지 않는다 | lesson | 권고 |
| L4 | desktop-3, mobile-3 | #15 explain | 다섯 항목 체크리스트를 한 문단에 이어 써서 읽기 어렵다. 그림(bars, a0–a3 강조)도 체크리스트와 직접 관련이 없다 | lesson | 권고 |
| R3 | desktop-2/3, mobile-2/3 | #10 predict, #12 explain | steps 장면이 아닌데 재생/처음으로/다음 단계(1/4) 컨트롤이 나온다. figure의 `steps` 선언 때문으로 보인다 | runtime | 권고 |
| R4 | mobile-1/3/4 | #1, #14, #18 settled | 피드백이 펼쳐진 뒤 카드 위쪽 줄(질문 첫 줄, "확인 문제" 머리말)이 반쯤 잘린 채 스크롤되어 있다 | runtime | 권고 |
| R5 | desktop-2, mobile-2 | #9 quiz·settled | 입력칸에 9.56179249911… 같은 긴 값이 잘린 채 보인다(입력 폭 부족) | runtime | 권고 |
| R6 | desktop-1/3 | #0, #2, #16 | pipe 그림이 넓은 figure 영역에서 작게 왼쪽 위에 몰리고, 노드 글자가 데스크톱에서 너무 작다 | runtime | 권고 |
| L5 | 전체 | bars | x축 제목이 없다(카테고리 축이라 라벨이 대신하지만 "방어 종류" 같은 제목이 없다) | lesson | 권고 |

## 좋았던 점
- #1 predict에서 적응형 막대를 숨겼다가 reveal 때 보여 준 흐름이 명확하고, 가정 값이라는 표기도 정확하다.
- budget 곡선은 log x축, 축 제목, 1회 기준점이 깔끔하고, 63%/9.56% 수치와 checks가 맞는다.
- prompt injection과 jailbreak 구분, 블랙박스 공격 설명, 권한 축소로 끝나는 마무리가 실무에 바로 연결된다.
- runtimeErrors와 layoutViolations가 모두 0건이다.

## 집계
- runtime 발견: 6 (R1–R6)
- lesson 발견: 5 (L1–L5)
- 빠진 축 제목: 1 (bars x축)
