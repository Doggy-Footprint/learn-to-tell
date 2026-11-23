# 조사 인용 → 기준표·glitch 목록 대조 (main agent, 2026-10-28)

요청: "우리 글리치 목록이랑 조사 목록이 있잖아. 그거 얼마나 겹치는지 체크해서 혹시 우리가 빠뜨린 기준이 있는지 체크하는 태스크 하나만 넣자."

## A. 근거 없는 30개 항목의 근거 연결

- 대상: `drafts/revised.json`의 `origin: critic` 10개, `drafts/glitch-additions.json` 20개.
- 명령: `python3 -I tools/evidence.py propose sonnet --set extra`, `verify gpt-6.1-sol sonnet --set extra`, `report sonnet gpt-6.1-sol --set extra`.
  - 출력: `evidence/propose-sonnet-extra.json`, `verify-gpt-6.1-sol-extra.json`, `items-extra.json`.
- 비용: sonnet $1.698(156쌍), gpt-6.1-sol $0.202(supports 6, partial 67, no 83).
- 근거 수준: strong 2(valid-intermediate-states, input-response-latency), moderate 13, weak 2, none 13.
- 2026-10-27 수동 grep 판정과 다른 것: responsive-reflow strong → moderate, label-mark-sync weak → moderate(bbc-subtitles·netflix-timing 자막 동기화 partial), smooth-frame-rate weak → moderate.

## B. 연결 안 된 1등급 인용 분류

- 대상: 1등급 usable 인용 1,564개 중 기존·추가 항목 어느 것과도 연결(verify `no` 아님)되지 않은 것. A 뒤 1,272 → 1,251개.
- 명령: `python3 -I tools/classify.py run sonnet`, `report sonnet`. 출처별 캐시 `classify/sonnet/`, 합본 `classify/sonnet.json`.
- 파일럿: heer2007, wcag22-pause, edupanel2026(102개, $0.246). main agent가 102개 전부를 읽었다. 전체 비용 $2.918(파일럿 포함).
- 결과(1,251개):

  | 분류 | 수 |
  | --- | --- |
  | 기존 항목이 다룸 | 399 |
  | 새 기준 후보 | 61 |
  | 기준 없음(통계·정의·배경) | 492 |
  | 장면 범위 밖 | 203 |
  | judge 구성 방법 | 96 |

- "기존 항목이 다룸" 399개의 항목 대응 769건: merged 715, glitch 추가 32, 비판 추가 22.
- 표본 확인: 범위 밖 15개, 기준 없음 15개를 main agent가 읽었다. 기준을 놓친 사례는 보지 못했다. 파일럿에서 1건(heer2007#69 축 재조정이 변화 추정을 방해)이 기준 없음으로 분류됐으나 같은 기준이 heer2007#91에서 새 후보로 잡혔다.
- 분류는 sonnet 단일 판정이다. 다른 모델 교차 확인은 하지 않았다.

### 새 기준 후보 61개 묶음 (main agent 묶음, 33개)

표기: 인용 수, 출처. 권고는 main agent 의견이다.

| 묶음 | 기준 | 인용 | 권고 | 비고 |
| --- | --- | --- | --- | --- |
| A1 | 지속적인 주기 진동(특히 약 0.2Hz)이 없다 | 2, apple-hig-motion | 추가 | 주기 움직임 주파수로 측정 가능 |
| A2 | 같은 종류의 변화는 같은 전환, 다른 종류의 변화는 구별되는 전환 | 3, heer2007 | 추가 | data+llm |
| A3 | 단계 사이 축 척도를 고정하고, 바꿀 때는 별도 단계로 | 1, heer2007 | 추가 | 차트 장면만 |
| A4 | 스스로 움직이는 요소는 곡선 궤적 | 3, chang-ungar1993 | 제외 | 2005년 이전 단독 근거 |
| A5 | 등장이 퇴장보다 약간 길다(300ms 대 200–250ms) | 2, nng-duration | 보류 | UI 팝업 지침 |
| A6 | 새 요소가 읽던 글을 밀어내지 않는다 | 1, nng-usability | 추가 | stable-frame은 정적 요소만 본다 |
| A7 | 일시정지는 다시 재생할 때까지 유지된다(hover·focus 동안만이 아님) | 1, wcag22-pause | 추가 | WCAG 2.2.2 실패 사례 |
| A8 | 멈춘 화면에서도 변화 방향이 보인다(화살표·궤적) | 1, robertson2008 | 보류 | 인용은 정적 추세 시각화 맥락 |
| T1 | 비슷한 분량의 글은 표시 시간이 일관된다 | 3, bbc-subtitles | 보류 | 타이머로 바뀌는 글에만 해당 |
| T2 | 여러 줄 글은 구·절 경계에서 줄이 나뉜다 | 3, bbc-subtitles | 추가 | 자막 지침을 화면 글에 옮김 |
| T3 | 대문자·강조 서식을 절제한다 | 3, bbc-subtitles | 보류 | 한국어 장면에는 대문자 해당이 적다 |
| T4 | 문장을 여러 비트에 쪼개지 않는다 | 1, bbc-subtitles | 추가 | |
| T5 | 제목·주석·라벨이 가로로 쓰인다 | 2, evergreen-checklist | 추가 | 회전 transform으로 측정 |
| T6 | 문법·오탈자가 없다 | 2, ppteval2025 | 추가 | |
| T7 | 어휘·난이도가 학습자 수준에 맞다 | 2, brysbaert2019, merlot-form | 보류 | introduced-terms와 일부 겹침 |
| T8 | 숫자는 필요한 정밀도로만 보인다 | 2, evergreen-checklist | 추가 | |
| T9 | 글 색을 정하면 배경색도 정한다 | 2, wcag22-contrast | 보류 | text-contrast가 실제 합성 배경으로 결과를 본다 |
| D1 | 그림 형식이 보여 줄 관계에 맞다 | 2, evergreen-checklist | 추가 | |
| D2 | 나란한 항목이 논리적 순서로 놓인다 | 2, evergreen-checklist | 추가 | |
| D3 | 값 축이 하나씩이다(이중 y축 없음) | 2, evergreen-checklist | 추가 | 차트 장면만 |
| D4 | 정렬·간격이 일관된다 | 1, code2video2025 | 보류 | 인용은 배치 방식 비교 결과 |
| D5 | 한 표식의 여러 시각 채널이 서로 간섭하지 않는다 | 1, healey1996 | 보류 | 다변량 표식이 드물다 |
| D6 | 구분해야 할 차이는 범주적으로 뚜렷하게 | 1, tversky2002 | 추가 | |
| D7 | 도식적 형태를 쓴다(사실 묘사 아님) | 1, tversky2002 | D8과 합쳐 추가 | |
| D8 | 무엇을 나타내는지 알아볼 수 있는 형태 | 1, theoremexplain2025 | D7과 합쳐 추가 | D7과 반대 방향 |
| D9 | 분야의 관례 표기를 쓴다 | 1, merlot-form | 추가 | |
| D10 | 기억 고리가 되는 시각 이미지·은유 | 2, bateman2010 | 제외 | coherence-no-extraneous와 충돌 |
| P1 | 이 카드에서 무엇을 이해할지 화면에 밝힌다 | 4, lori2007, merlot-form, learnlm2024, evergreen-checklist | 추가 | one-sentence-takeaway는 화면이 그 문장을 받쳐 주는지만 본다 |
| P2 | 실생활 비유·사례를 쓴다 | 2, learnlm2024 | 보류 | 모든 장면 요구로는 과하다 |
| P3 | 불필요한 질문·조작으로 설명을 늦추지 않는다 | 2, learnlm2024 | 추가 | |
| P4 | 장면이 짧다 | 3, brame2016, guo2014 | 보류 | 영상 길이 연구, 카드 단위 기준값 없음 |
| P5 | 숙련 학습자는 안내를 접을 수 있다 | 1, kalyuga2007 | 제외 | 개인화, 장면 하나 범위 밖 |
| P6 | 전체 구조 안에서 현재 단계를 표시한다 | 1, dekoning2009 | 추가 | |

## C. glitch 77개의 근거

- 방법: `notes/2026-10-27-glitch-vs-rubric.md` 대응표의 항목을 `evidence/items.json`·`items-extra.json` 근거 수준에 붙였다. glitch마다 대응 항목 중 최고 수준.
- 제외 2개를 뺀 75개: strong 19, moderate 26, weak 2, none 28. 근거 있음 47/75(63%).
- 대응 구분별: 기존 항목만 40개 중 none 10, 새 항목만 31개 중 none 17.
- none 28개의 대부분은 구현 결함(전환 경계 깜빡임, 연속 클릭 경합, 포커스 소실, 쪽 전환 중 두 쪽 공존)과 사용자 메모 결함(그림 작음, 첫 화면에 그림 없음, 화면 밖에서 이미 끝남)이다.

## D. judge 구성 방법 인용 96개 정리

- 대상: B에서 `judge-method`로 분류된 96개. 출처: edupanel2026 33, igenbench2026 20, paper2video2025 8, achieve-oer 7, theoremexplain2025 7, genfig1-2026 5, 나머지 16. main agent가 전부 읽었다.
- 한계: 인용은 문장 단위라 실험 조건이 빠져 있다. 모델 버전은 출처 당시 것(Gemini-2.5-Pro, GPT-5-mini 등)이다. 원문 맥락은 다시 확인하지 않았다.

| 주제 | 관찰(인용) | 출처 |
| --- | --- | --- |
| 판정 형식 | 항목마다 독립 채점. 적용 안 됨(N/A)은 감점이 아니며 정말 해당이 없을 때만 쓴다 | achieve-oer#3·#9·#10, evergreen-checklist#3·#5 |
| 판정 형식 | 질문마다 1/0. 이미지로 분명히 확인할 수 없으면 No. 빠진 정보를 추론하거나 의도를 짐작하지 않는다. 보이는 증거로만 판정 | igenbench2026#27·#104–#106·#137 |
| 판정 형식 | 설계 초안이 명시한 경우에만 해당 질문을 만든다(숫자 라벨, 정렬 순서) | igenbench2026#120·#122 |
| 관대함 | 시각 근거 차원에서 judge의 양의 편향 +0.67, 대본 근거 차원 +0.24(Gemini). GPT는 시각 편향 +0.06. 사람도 같은 방향이지만 폭이 작다 | edupanel2026#46·#47·#54·#76 |
| 관대함 | 오류 대부분이 과대 긍정(미묘한 인코딩 위반을 못 봄). 데이터 인코딩 불일치 12.12%, 정렬 0%, 제목 2.5% | igenbench2026#84–#86 |
| 차원별 일치 | 사람 상관: 시각 관련성 0.72, 배치 0.42, 시각 일관성 0.17, 정확성 0.14, 논리 흐름 0.16 | theoremexplain2025#20·#27 |
| 차원별 일치 | 정보 밀도에서 τ 0.71로 가장 높고 나머지는 약간–보통 | genfig1-2026#2·#30 |
| 차원별 일치 | 대본 근거 차원에서 가장 정확하고 시각 근거 차원에서 가장 부정확 | edupanel2026#40·#45·#86·#95 |
| 입력 | 영상을 빼면 오차가 0.55 → 1.07(가장 큰 저하) | edupanel2026#58 |
| 사람 일치 상한 | 전문가 블라인드 일치 α 0.38, AI 도움 뒤 0.50. LearnLM 평가자 α 0.325. PPTEval Fleiss κ 0.59 | edupanel2026#44·#80, learnlm2024#158, ppteval2025#65 |
| 사람 일치 상한 | judge MAE 0.85가 블라인드 전문가 중앙값 0.87과 비슷 | edupanel2026#42 |
| 변별력 | 일부 지표가 천장 효과(거의 모두 최고점). 파일럿에서 분산이 있는 차원만 남김 | edupanel2026#7·#97·#98·#110, evergreen-checklist#7 |
| 변별력 | 단일 judge는 척도를 좁게 쓰고 최고점을 주지 않음(SD 0.77 대 사람 1.22) | edupanel2026#63 |
| 모델 | 사람 상관 0.8을 넘은 모델은 Gemini-2.5-Pro(0.90) 하나. GPT-5-mini 0.70 | igenbench2026#48·#54 |
| 모델 | 절대값은 평가 모델마다 다르지만 모델 순위는 안정(ρ ≥ 0.95) | igenbench2026#89 |
| 재현성 | Gemini judge는 안정적, GPT는 주관·시각 차원에서 불안정 | edupanel2026#106·#107 |
| 페르소나 | 학습자 페르소나를 바꾸면 학습자 적합 차원만 바뀌고 내용 차원은 그대로 | edupanel2026#5·#59·#60·#88 |
| 오탐 | judge가 전문가가 처음에 못 본 실제 문제를 찾은 사례 | edupanel2026#56 |
| 독립성 | 항목 쌍 사이 최대 상관 0.21로 중복이 적다고 판단 | igenbench2026#96·#97 |
| 학습 효과 | 퀴즈 기반 지표가 미감 지표보다 지식 전달 결함에 민감 | code2video2025#38 |
| 측정 조건 | 반복 재생되는 짧은 클립은 반복 상태로 분석. 가장 큰 보기 크기로 분석 | wcag22-flash#5·#9 |

- 출처 사이에 엇갈리는 것: 시각 차원의 일치가 낮다(edupanel2026)와 시각 관련성·배치는 높고 정확성·흐름이 낮다(theoremexplain2025). 차원 정의와 매체가 다르다. 항목별로 따로 재야 하는 근거로 읽었다(main agent 해석).

## E. 추가 19개 항목과 근거 연결 (사용자 결정 "권고대로 진행해도 되겠다", 2026-10-28)

- 파일: `drafts/quote-additions.json`. glitch-additions와 같은 필드에 `origin: "quote-classify"`, `source_quotes`(항목을 만든 인용 qid)를 붙였다. `weight`는 null(가중치를 매긴 모델 판단이 없다). 기준값은 no-sustained-oscillation의 0.2Hz만 `quoted`, 나머지 `none`. 항목 문구는 main agent가 영어로 썼다.
- 묶음 D7·D8은 schematic-but-recognizable 하나로 합쳤다.
- 명령: `evidence.py propose sonnet --set quotes`($1.355, 146쌍), `verify gpt-6.1-sol sonnet --set quotes`($0.177, supports 23, partial 81, no 42), `report ... --set quotes` → `evidence/items-quotes.json`.
- 근거 수준: strong 12, moderate 7. 항목을 만든 인용으로 다시 검증한 순환이 들어 있다. 만든 인용을 빼고 다시 계산하면 strong 4, moderate 9, weak 2, none 4.
  - 만든 인용 밖 근거가 없는 것: horizontal-text, appropriate-numeric-precision, single-value-axis(evergreen-checklist만), domain-conventional-notation(merlot-form만).
  - pause-persists: 만든 인용 wcag22-pause#22는 verify `no`(실패 사례 문장 조각). strong은 spanjers2010#13(구간마다 자동 정지, 학습자가 이어 보기를 정함)·extra#314·#315와 wcag22-pause#21에서 나왔다. spanjers2010은 학습자 진행 제어 연구라 "일시정지 유지"보다 넓다(main agent 판단, 재검증 안 함).
  - no-sustained-oscillation의 다른 근거는 대부분 "불필요한 움직임·장식 배제" 일반론 partial이다.
