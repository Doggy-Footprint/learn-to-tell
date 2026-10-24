# R1 렌더 검토 (spec 018fd67ebfbf6b0f v8)

절차:
- 커밋 전 작업 트리(base 08c85ef 위, 수정 묶음 3 반영)에서 `ltt sheet <lesson> --out <dir>`을 돌렸다.
- 대상은 예시 수업과 시험용 fixture 3개다. 각각을 빈 디렉터리에 복사해 돌렸다.
- PNG를 하나씩 열어 장면·상태·viewport마다 다음을 보았다: 겹침, 잘림, 작은 글자, 빈 입력, 대비, 그 밖의 표시 결함.
- 자동 시험(VO-15)이 이미 재는 항목(글자 겹침·잘림·크기·대비·터치 대상·가로 스크롤)은 눈으로 다시 확인만 했다. 눈 검토의 몫은 그 시험이 보지 않는 결함이다.

## 실행 결과

| 수업 | 장면 | sheet 종료 | runtimeErrors | layoutViolations | PNG(데스크톱 / 모바일) | 시간 |
| --- | --- | --- | --- | --- | --- | --- |
| projectile-drag(예시) | 18 | 0 | 0 | 0 | 3 / 3 | 24.7 s |
| coffee-cooling | 18 | 0 | 0 | 0 | 3 / 3 | 23.9 s |
| battery-supply | 11 | 0 | 0 | 0 | 2 / 2 | 16.3 s |
| port-congestion | 13 | 0 | 0 | 0 | 3 / 3 | 18.4 s |

PNG 22장을 모두 보았다.

## 결함 (finding)

| id | PNG | 장면·상태 | 관찰 | 분류 |
| --- | --- | --- | --- | --- |
| F4-1 | port-congestion/desktop-3.png (1572×525) | #12 summary | 마지막 쪽에 장면이 1개뿐이면 데스크톱 PNG가 잘못 합성된다. 한 장면의 initial·settled가 두 줄로 반복되고 칸마다 위쪽 약 280 px만 남는다. 같은 주제의 모바일 PNG(317×1344)는 정상이다. | 구현 결함(FR-17 sheet 출력) |
| F4-2 | coffee-cooling/desktop-3.png, mobile-3.png | #15·#16 quiz | 선택지 글에 glossary 용어가 들어가면 글이 좌우로 갈라진다. 용어 버튼("냉각 상수")은 왼쪽, 나머지 글("가 커진다")은 오른쪽 끝에 붙는다. | 구현 결함(FR-20·FR-26 카드 글 배치) |
| F4-3 | coffee-cooling/mobile-3.png | #14 explain(multiples 3개) | panel 제목 "k = 0.1"과 label "직선이 된다"가 간격 없이 붙어 "k = 0.1직선이 된다"로 읽힌다. 왼쪽 panel의 label leader("온도차 절반")가 오른쪽 panel 영역까지 건너간다. | 구현 결함 + spec 공백(panel 제목이 글자 배치의 장애물인지, 글자가 자기 panel 밖으로 나가도 되는지 정해지지 않음) |

## advisory (차단 아님)

| id | 관찰 | 제안 |
| --- | --- | --- |
| A4-1 | graph는 배치 결과를 늘리지 않고 가운데 정렬하므로 데스크톱 stage의 1/4 정도만 쓴다(battery-supply 전 장면). | 최소 글자 크기를 지키는 범위에서 ELK 간격을 stage에 맞춰 넓힌다. |
| A4-2 | `aspect: "equal"` 그림(예시 `traj`, compare)은 stage 대부분이 빈 공간이다. | 생성 실험에서 반복되면 처리. 수업 쪽(축 범위) 문제일 수도 있다. |
| A4-3 | phone mock의 화면이 짙은 회색이다. explore의 toggle knob이 검은 고리 모양이라 다른 UI와 어울리지 않는다. | 다듬기. |
| A4-4 | 예시 수업 `angles` figure에 axis가 없어 곡선 값을 읽을 수 없다(#1 reveal, #13, summary). | 예시 수업은 이 run의 Implementation 밖이다. run 뒤 사용자 확인을 받고 고친다. 생성 agent가 예시를 본뜨므로 우선순위가 높다. |
| A4-5 | drag predict의 손잡이가 "항력" 글자 위에 겹친다(예시 #4 initial). | 글자 배치 장애물에 drag 손잡이를 넣는다. |
| A4-6 | 모바일 compare(예시 #6)에서 legend가 plot 아래로 가고 긴 leader가 panel 사이를 가로지른다. | F4-3과 같은 원인(panel 경계)일 가능성이 있다. |
| A4-7 | `ltt sheet`의 DOM 실측은 stage 글자만 재고 card 글자는 재지 않는다. 그래서 F3-1(card 글이 하단 nav에 가림)을 sheet가 못 잡았다. | card 글도 sheet 실측에 넣는다. 생성 agent는 sheet로 runtime 결함을 기록하기 때문이다. |

## 결함이 없던 항목

- 그림 글자 뒤의 불투명 흰 바탕(v6 F1-2 방식)은 지도·칸 위에서 무겁게 보이지 않았다(port-congestion #0·#1·#3).
- 다음 화면에서는 위 표 밖의 겹침·잘림·빈 입력이 없었다: geo 라벨 leader 묶음, cells 글자 대비, graph 간선 글자, predict 확정 전 공개 mark 숨김(#4 port cells의 빈 칸), 모바일 summary 쪽 나눔.

## 재검토 (수정 묶음 4 뒤)

- port-congestion `desktop-3.png`: 1572×526이고 summary가 한 줄로 한 번만 나온다. 6장면 PNG는 1572×3096이다(줄 514 px, 여백 12 px). F4-1 해소.
- coffee-cooling `mobile-3.png` #15·#16: 용어 버튼 "냉각 상수"가 "가 커진다"·"가 아주 작다"와 한 줄로 이어진다. F4-2 해소.
- coffee-cooling `mobile-3.png` #14: panel 제목 k = 0.05/0.1/0.2가 label과 떨어져 있고, leader가 자기 panel 안에 있다. F4-3 해소.
- 새 결함 F4-5: 같은 장면 k = 0.2 panel에서 축 제목 "온도차 비율"과 label "온도차 절반"이 맞닿아 "온도차 비율온도차 절반"으로 읽힌다. 원인은 spec이 글자 상자의 경계 맞닿음을 허용한 데 있다. v10에서 글자 간격을 2 px 이상으로 정했다.

## 재검토 2 (수정 묶음 5, spec v11–v12 뒤)

- coffee-cooling `mobile-3.png` #14: 세 panel 모두에서 축 제목 "온도차 비율"과 label "온도차 절반"이 6 px 넘게 떨어져 있다. "직선이 된다"는 데이터 선 위가 아니라 옆에 놓인다. F4-5·F4-6 해소. k = 0.2 panel의 "온도차 절반"은 점 옆에 있고, 선과 겹치지 않는다.
- 예시 `desktop-3.png` #14: 선 피하기 때문에 `traj` legend가 plot 아래로 밀려났고, legend에 긴 leader가 붙었다. 읽을 수는 있다. → advisory A6-1.
- implementer 보고: 축 제목은 자리가 없으면 오류 없이 빠진다. 이번에 본 PNG에서 빠진 축 제목은 없었다. → advisory A6-2.

| id | 관찰 | 제안 |
| --- | --- | --- |
| A6-1 | legend가 점을 가리키지 않는데도 leader를 단다(예시 #14). | legend에는 leader를 긋지 않고, plot 바깥 자리를 먼저 찾는다. |
| A6-2 | 자리가 없는 축 제목이 조용히 빠진다. 수업 작성자와 check 모두 그 사실을 모른다. | 생성 실험의 sheet에서 축 제목이 빠진 장면 수를 센다. 반복되면 check의 layout 오류로 올린다. |

## 전수 재검토 (spec v16, verifier V1-3 대응)

절차:
- 작업 트리는 base 08c85ef 위 미커밋 변경 37개 파일이다. `packages/runtime/src` 파일 shasum 묶음의 해시는 `cca743c8fd9e8b5e5a8889f8f5dd97d6751be998`이다.
- Test command 11회차(596/596)를 통과한 직후 이 트리에서 빌드했다.
- 수업마다 빈 디렉터리에 복사한 뒤 `node packages/runtime/bin/ltt.mjs sheet <dir>/<lesson>.js --out <out>`을 돌렸다.
- 대상은 예시 projectile-drag와 test lesson 3개(coffee-cooling, battery-supply, port-congestion)다.

| 수업 | 장면 | 종료 | runtimeErrors | layoutViolations | PNG |
| --- | --- | --- | --- | --- | --- |
| projectile-drag | 18 | 0 | 0 | 0 | 데스크톱 3, 모바일 3 |
| coffee-cooling | 18 | 0 | 0 | 0 | 데스크톱 3, 모바일 3 |
| battery-supply | 11 | 0 | 0 | 0 | 데스크톱 2, 모바일 2 |
| port-congestion | 13 | 0 | 0 | 0 | 데스크톱 3, 모바일 3 |

PNG 22장을 모두 열었다.

결과:
- 새 결함 F5-1: 예시 수업에서 `traj` 그림의 legend(진공/공기)가 plot 아래나 옆으로 밀리고, 그 legend에서 그림을 가로지르는 긴 사선 leader가 그어진다.
  - 데스크톱: #1 settled(reveal 옆 traj), #6 compare, #14 explore.
  - 모바일: #0 hook, #1, #6, #10, #14.
  - legend는 점을 가리키는 글자가 아니라서 leader가 필요 없다. 더구나 그 leader가 데이터 위를 지난다.
  - v11의 선 피하기(avoid)가 legend 자리를 밀어낸 뒤에 생겼다. 그래서 A6-1을 차단 결함으로 올린다.
- 앞서 해소한 결함(F4-1~F4-6)은 재발하지 않았다. 남은 advisory A4-1~A4-5, A6-2는 그대로다. 이번 PNG에서 빠진 축 제목은 없었다.
- 모바일 summary 쪽 나눔, 지도 라벨 leader 묶음, cells 대비, graph 간선 글자, 확정 전 공개 mark 숨김에서 새 결함은 없었다.
