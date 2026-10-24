# global-supply-chain 시트 검토

sheet.json의 runtimeErrors와 layoutViolations는 모두 비어 있다.

| id | PNG | scene #·state | 관찰 | 원인(runtime/lesson) | 심각도(차단/권고) |
|---|---|---|---|---|---|
| F1 | desktop-3, mobile-3 | #13 predict·settled | reveal 문구는 "리드타임 4주"라고 하지만 "단계마다 3.0배, 수입사 28배"로 표시된다. L=4의 올바른 값은 2.5배와 16배이고, 3.0/28은 L=5 값이다. 이미 알려진 bull/safety 사이 `L` 충돌이 화면에 그대로 드러난다. | lesson | 차단 |
| F2 | desktop-3, mobile-3 | #15 explore·initial | 슬라이더가 L 5에서 시작한다. bull 모델의 기본값 4가 아니라 safety 모델의 L=5가 적용됐다(F1과 같은 원인). | lesson | 차단 |
| F3 | desktop-2, mobile-2 | #11 explore | share=0에서는 정상($1500)으로 보인다. 다만 goal 미도달(`k` 공유)은 정지 화면만으로 확인할 수 없다. 곡선은 k=6을 하드코딩해 그리므로 점(m.rates.rate)과 곡선이 서로 어긋날 위험이 있다. | lesson | 차단 |
| F4 | desktop-3, mobile-3 | #13 predict·initial | 예측 전인데 소매·도매 막대가 이미 단계별로 커지는 모습을 보여 준다. 정답("단계마다 커진다")이 미리 드러난다. | lesson | 권고 |
| F5 | desktop-1, mobile-1 | #0 hook | 훅 지도에 희망봉 우회 경로가 이미 그려져 있다. #5 predict의 reveal 대상이 먼저 노출되는 셈이다. | lesson | 권고 |
| F6 | desktop-2, mobile-2 | #6 define | 정의 문구는 네 곳을 모두 말하고 focus도 cp-0..3인데, 그림은 step에 따라 한 곳만 라벨링한다(initial 말라카, settled 파나마). 나머지 세 점에는 라벨이 없다. | lesson | 권고 |
| F7 | desktop-1 | #2, #3 hubs | 그래프가 패널 가운데에 아주 작게 그려지고 패널의 약 80%가 빈 공간이다. 노드 글자가 읽기 어려울 만큼 작다. | runtime | 권고 |
| F8 | desktop-1/3 | #1 modes, #13–15 bull | 범주 라벨이 막대 위에 매우 작은 글씨로만 표시되고 x축 범주 눈금이 없다. 데스크톱에서 읽기 어렵다. | runtime | 권고 |
| F9 | mobile-1/2/3 | #1, #5, #9, #13 settled | reveal 뒤 텍스트 패널이 스크롤되면서 질문 첫 줄이 위로 잘린다. | runtime | 권고 |
| F10 | mobile-2 | #6, #7 | chokepoint 라벨이 점에서 멀리 떨어져 있고, 긴 리더선이 대륙을 가로지른다. | runtime | 권고 |
| F11 | desktop-1, mobile-1/4 | #0, #5, #19 map | "로테르담·희망봉 우회·수에즈 경유" 라벨이 유럽 위에 세로로 쌓여 있다. 경로와의 대응이 약하다. | runtime | 권고 |
| F12 | desktop-3 | #12 quiz·settled | 정답 입력값이 27.34375로 소수점 다섯 자리까지 표시된다. 해설 없이 "정답입니다"만 나온다. | lesson | 권고 |
| F13 | desktop-1/2/3 | #4, #8, #12, #17 quiz | 왼쪽 그림 영역이 "확인 문제" 자리표시만 있고 비어 있다. | runtime | 권고 |

## 잘 된 점
- 지리: 수에즈·희망봉 경로와 상하이·싱가포르·로테르담, chokepoint 4곳의 위치가 정확하다.
- #5와 #9 predict는 initial에서 답을 가리고(cape 경로, 희망봉 막대 숨김) reveal 뒤에 보여 준다.
- voyage, rates, safety 그림의 수치(67→84일, 10→12척, 369→452개)가 카드 문구와 일치한다.
- safety 곡선의 리더선 라벨(수에즈 5주, 우회 7.5주)이 곡선과 겹치지 않는다.
- 요약 화면에서 4개 그림이 데스크톱은 격자로, 모바일은 탭으로 정리된다.
- 겹치는 텍스트나 잘린 축 라벨은 없다.

## 집계
- runtime 발견: 6 (F7, F8, F9, F10, F11, F13)
- lesson 발견: 7 (F1–F6, F12)
- 축 제목 누락: 정량 축 0. 범주 x축(modes, voyage, bull) 3개는 제목이 없지만 막대 라벨로 대신한다.
