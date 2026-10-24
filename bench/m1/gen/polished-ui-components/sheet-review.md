# sheet review: polished-ui-components

| id | PNG | scene #·state | 관찰 | 원인(runtime/lesson) | 심각도(차단/권고) |
|---|---|---|---|---|---|
| F1 | desktop-2, mobile-2 | #6 predict·initial | 예측 전에 막대 라벨이 `H1 21`을 그대로 보여 준다. 질문("H1은 대략 몇 px?")의 정답이 노출됨. scale figure의 rect label이 항상 값을 붙이고, predict에 reveal marks/숨김 지정이 없다 | lesson | 차단 |
| F2 | desktop-1, mobile-1 | #0–#4 card 전체 | 관리자 폼 mock이 회색 막대+빈 사각형뿐이라 라벨/입력/버튼 글자가 없다. 간격(dim 16/18, 8/24)은 보이지만 글자 위계·버튼 문구 같은 UI 실체가 안 보여 "투박함"을 체감하기 어렵다. mock 안에 실제 텍스트를 크기별로 그리는 mark가 없다 | runtime(능력 부족) | 권고 |
| F3 | desktop-3, mobile-3 | #13 explain | 팔레트가 회색 5단계+강조 1로 읽힌다(이전의 파란 단계 문제는 해결). 다만 회색이 약간 푸른 slate 톤이고, 가장 진한 "제목" 칸도 중간 회색이라 "제목=가장 진한 글자색" 역할이 드러나지 않는다(muted에 opacity만으로는 검정 근처까지 못 감). 2행 나머지 3칸이 빈 칸으로 남음 | runtime(중립 회색 척도 부재) + lesson(빈 칸, rows:2 cols:5) | 권고 |
| F4 | desktop-3, mobile-3 | #15·#16 states | 버튼 라벨 "저장"이 사각형 안이 아니라 위에 붙어 버튼처럼 보이지 않는다. empty 상태 문구도 점선 상자 바깥 위에 있음. 스피너/focus 링은 settled(5/5)만 찍혀 시트에서 확인 불가 | runtime(rect label 내부 배치 옵션 없음) | 권고 |
| F5 | mobile-1, mobile-2, mobile-3 | #1·#6·#15 predict·settled | 피드백이 늘면서 카드 본문이 스크롤되어 질문 첫 줄이 반쯤 잘린 채 figure 아래에 걸린다 | runtime | 권고 |
| F6 | mobile-2 | #11 predict·settled | dot 라벨 `2.61:1`이 4.5:1 가로선 위에 겹쳐 선이 글자를 관통 | runtime | 권고 |
| F7 | mobile-2 | #8 compare | 1.067 쪽 막대 라벨(본문 16, H4 17, H3 18, H2 19, H1 21)이 지그재그로 엇갈리며 서로 붙고 일부는 이웃 막대 위로 감 | runtime | 권고 |
| F8 | mobile-4 | #18 quiz·settled | 분류 버튼 "loadin/g에 넣/기", "empt/y에 넣/기"처럼 단어 중간 줄바꿈 | runtime | 권고 |
| F9 | desktop-4 | #19 quiz | 3번 order 문항이 패널 하단에서 반 줄 잘린 채 보임(스크롤 필요 신호 없음) | runtime | 권고 |
| F10 | desktop-1, mobile-1 | #3 define 근접성 | 직전 explain에서 8/24로 고친 뒤, 정의 장면은 다시 16/18(나쁜 예)로 돌아간다. "2배 이상이면 경계 분명"을 말하면서 그림은 반례 | lesson | 권고 |
| F11 | desktop-3, mobile-3 | #17 define 포커스 링 | figure 없이 큰 제목 플레이스홀더만. states의 focus 단계를 재사용하면 됨 | lesson | 권고 |
| F12 | desktop-4 | #19 quiz 3번 | "정렬이 가장 아래 단, 상태가 맨 위 단" 지시가 order UI(위→아래 목록)와 방향이 헷갈림 | lesson | 권고 |
| F13 | 전체 | 타입 위계 단원 | 글자 크기를 막대 높이로만 보여 줘 실제 글자 크기 차이를 보지 못한다(H1 21px vs 39px 텍스트 견본이 없음). F2와 같은 능력 부족 | runtime(능력 부족) | 권고 |

## 좋았던 점
- 수치가 정확함: 1.067⁴·16≈21, 1.333⁴·16≈51, 1.25²·16=25, 회색 118→4.54:1, 160→2.61:1, 150→2.96:1.
- 간격 hook→predict reveal(16/18 → 8/24) 전환이 dim 표시로 명확.
- 대비비 곡선 + 4.5:1 기준선 + good/bad dot이 한눈에 읽힌다. 축 제목 모두 있음.
- compare(1.067 vs 1.333) 나란히 배치가 위계 차이를 잘 보여 줌.
- 팔레트는 이제 회색 단계 + 파랑 하나 + 위험 빨강으로 읽힌다.
- 오개념(장식=세련됨)을 predict 오답 피드백과 transfer 문항에서 반복해 다룸.

## 집계
- runtime findings: 9 (F2, F3 일부, F4, F5, F6, F7, F8, F9, F13)
- lesson findings: 5 (F1, F3 일부, F10, F11, F12)
- missing axis titles: 0
