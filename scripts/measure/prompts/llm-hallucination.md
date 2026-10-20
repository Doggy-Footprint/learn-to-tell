- lesson id: 20261020-llm-hallucination-probe

## 상황
- 작업: 논문 "LLMs Know More Than They Show: On the Intrinsic Representation of LLM Hallucinations"(Orgad 외)의 probing 실험을 작은 오픈 모델로 재현한다. hidden state를 어느 층·어느 토큰 위치에서 뽑아 probe를 학습할지, 한 데이터셋에서 학습한 probe를 다른 과제에 그대로 써도 되는지 정해야 하는데 판단 근거를 모른다. 학습 자료를 만들어 달라.
- 배경: AI 대학원 1년차. PyTorch로 transformer를 불러 생성해 본 적은 있다. 로지스틱 회귀와 train/test 분리는 안다.

## 진단 결과(고정)
- 사다리(낮은 단부터): 층별 hidden state(residual stream)가 무엇인가(애매함) → 선형 probe로 내부 표현에서 정답 여부를 읽기(이름만 앎) → 어느 토큰 위치에서 읽나: 마지막 토큰과 정답 토큰(exact answer token)(아예 모름) → probe가 과제 사이로 일반화되는가(아예 모름) → 오류 유형을 예측하고, 내부에 정답이 있는데 다른 답을 내는 경우(아예 모름).
- 학습 수준: 정답 토큰 위치. hidden state는 애매함이라 수업에 일부 넣는다.
- 오개념: "환각은 모델이 정답을 모를 때만 생긴다"고 답했다.
