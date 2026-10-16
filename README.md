# Learn to Tell

> 작업 중 coding agent가 "이 결정을 하려면 사용자가 무엇을 알아야 하는가"를 찾아내고, 20분 안에 그 지식을 익히게 한 뒤 원래 작업으로 돌려보내는 학습 skill.

**예시 수업 갤러리 → https://learn-to-tell.vercel.app**

## 왜 만들었나

AI agent와 함께 일하다 보면 agent는 알지만 나는 모르는 결정이 계속 나온다. 캐시 TTL을 얼마로 둘지, 색 대비를 어디까지 맞출지, GPU 병목이 어디인지 같은 것들이다. 게다가 LLM은 정보가 여러 턴에 나뉘어 들어오는 대화에서 크게 흔들린다. 20만 건이 넘는 시뮬레이션 대화를 분석한 연구에 따르면, 같은 과제를 한 번에 다 주었을 때보다 여러 턴에 나눠 주었을 때 성능이 6개 생성 과제 평균 39% 떨어졌다. 모델은 초반 턴에서 가정을 세우고 성급하게 최종 답을 만든 뒤 그 답에 지나치게 기댔고, 한 번 잘못 들어서면 회복하지 못했다[^lost-multiturn]. 사용자가 결정 변수를 모르면, 모호한 결정을 agent가 묻지 않고 한쪽으로 정해 버려도 알아차리기 어렵다.

이때 선택지는 보통 둘뿐이다.

- agent의 추천을 그대로 받는다. 빠르지만 왜 그런 선택인지 설명할 수 없고, 조건이 바뀌면 판단하지 못한다.
- 따로 공부한다. 정확하지만 작업 흐름이 끊기고, 필요한 범위보다 훨씬 많이 읽게 된다.

Learn to Tell은 그 사이를 노린다. 목표는 숙련이 아니라, 사용자가

1. agent에게 **적절한 질문**을 하고,
2. agent의 도움으로 **결정 변수를 고르고**,
3. 그 선택의 **의미를 설명**하고,
4. 지난 학습을 **map에서 찾아 복습**할 수 있게 하는 것이다.

## 어떻게 동작하나

Claude Code skill(`/learn-to-tell <주제>`)로 동작한다. 작업 세션을 `/fork`한 세션에서 학습하므로 원래 작업의 context를 더럽히지 않는다.

```
작업 세션 ──/fork──▶ 학습 세션
                     1. 진단     대화로 quick survey (최대 5문항)
                     2. 범위     이번 회차의 결정 변수 1–2개를 agent가 정해서 알림
                     3. 자료     최대 20분 분량의 시각 자료·시뮬레이션 (브라우저)
                     4. 이해 확인 서술 퀴즈 (pass / fail / skipped)
                     5. 작업 복귀 결정·조건·질문을 result.md로 원래 세션에 전달
                     6. 지식 map ~/.learn-to-tell/map.md 갱신
작업 세션 ◀──────────┘
```

### 1. 진단: 개념 사다리

낯선 용어부터 묻지 않는다. 상황에 필요한 개념을 낮은 수준부터 3–5단으로 세우고 중간 단부터 "알고 있음 / 애매함 / 아예 모름"을 묻는다. 답에 따라 위아래로 이동해, **아는 개념 바로 위의 모르는 개념**을 이번 학습 수준으로 정한다. 자기 보고는 실제보다 높게 나오기 쉬우므로 핵심 결정 변수는 짧은 퀴즈로 확인한다. 진단 결과는 판정이 아니라 가설로 다룬다.

### 2–3. 범위와 자료

분량 기준은 시간 하나다(학습 자료 최대 20분). 개념 이름이 아니라 **선택지 · 영향 · 필요 정보 · 실패 조건**으로 결정 변수를 다룬다. 조작해서 관찰할 필요가 없으면 대화만으로 끝내고, 필요할 때만 시뮬레이션 수업을 생성한다.

수업은 "선생님 없이 혼자 읽어도 이해되는 자료"를 기준으로 한다.

- 설명은 글 문단보다 그림 위 주석·라벨·단계 재생으로 한다.
- 직관이 틀리기 쉬운 곳에서 먼저 **예측**을 받고 결과를 공개한다.
- 조작은 목표를 준다("오래된 응답을 5% 아래로"). 손잡이는 실사용 범위만 움직이고, 범위와 상수에는 근거를 달며 근거가 약하면 "불확실"로 표시한다.
- 끝에는 그림을 다시 보여 주는 대신 **떠올려 보는 질문**(retrieval practice)으로 정리한다.

### 4–6. 확인, 복귀, 기록

서술 퀴즈로 "질문을 만들 수 있는지", "선택과 그 의미를 설명할 수 있는지"를 확인한다. 평가 기준은 답을 받기 전에 정해 둔다. 결과(이번 결정, 선택을 바꾸는 조건, agent에게 할 질문)는 `result.md`로 원래 작업 세션에 보내고, 약한 개념과 미룬 범위는 `~/.learn-to-tell/map.md`의 다음 학습 후보가 된다. 개인 데이터는 저장소 밖에만 남는다.

## 생성된 자료를 믿을 수 있게 만드는 장치

agent가 즉석에서 만드는 교재는 틀린 수치나 그럴듯한 오개념을 담기 쉽다. 그래서 공개 전에 여러 겹으로 검증한다.

| 위험 | 장치 |
| --- | --- |
| 시뮬레이션 수치가 틀림 | 모델 코드를 보지 않는 독립 서브에이전트가 공식만 보고 기대값을 구함 → 페이지가 열릴 때 모델 값과 자동 대조. 불일치 시 기대값을 모델에 맞추지 않고 손계산으로 원인을 찾음 |
| 핵심 주장(공식, 범위, 비교 판정)이 틀림 | 주장 목록만 독립 서브에이전트가 검토. 검토하지 못한 주장에는 "미검증" 표시 |
| 혼자 읽으면 이해가 안 됨 | 사용자 배경(`background.md`)을 가진 독자 역할의 서브에이전트가 정의 없는 용어, 건너뛴 단계를 장면 번호와 함께 지적 |
| 화면이 깨지거나 단조로움 | 자동 lint(카드 남용, 채움 글, 용어 밀도)와 두 화면 크기의 레이아웃 감사, 스크린샷 기반 시각 검토 |

agent의 자기 확언만으로는 정확성을 인정하지 않는 것이 원칙이다.

## 예시

https://learn-to-tell.vercel.app 에서 실제 생성 형식의 수업을 볼 수 있다. 분야마다 실무자가 실제로 보는 매체(터미널 로그, 회로 도면, 논문 figure, 신문 차트 등)의 모양을 따른다.

| 수업 | 분야 | 다루는 결정 |
| --- | --- | --- |
| [캐시 TTL](https://learn-to-tell.vercel.app/gallery/cache-ttl.html) | 백엔드 | 응답 신선도와 부하 사이의 TTL 선택 |
| [단일 GPU 데이터 흐름](https://learn-to-tell.vercel.app/gallery/gpu/single-gpu-dataflow.html) | 시스템 | HBM → L2 → SM 중 어디가 병목인가 |
| [색 대비](https://learn-to-tell.vercel.app/gallery/uiux/color-contrast.html) | UI/UX | 읽히는 대비 기준 |
| [시각 위계와 간격](https://learn-to-tell.vercel.app/gallery/uiux/visual-hierarchy-spacing.html) | UI/UX | 간격으로 묶음 표현하기 |
| [공기 저항이 있는 포물선](https://learn-to-tell.vercel.app/gallery/physics/projectile-drag.html) | 물리 | 저항을 모델에 넣어야 하는 조건 |
| [분산 투자](https://learn-to-tell.vercel.app/gallery/finance/diversification.html) | 금융 | 변동성과 상관관계 |
| [행렬 = 변환](https://learn-to-tell.vercel.app/gallery/linear-algebra/matrix-as-transform.html) | 선형대수 | 행렬을 격자 변형으로 읽기 |
| [앵커링](https://learn-to-tell.vercel.app/gallery/cognition/anchoring.html) | 인지심리 | 첫 숫자가 판단에 남기는 영향 |
| [인출 연습](https://learn-to-tell.vercel.app/gallery/pedagogy/retrieval-practice.html) | 교육학 | 다시 읽기 vs 떠올리기 |

수업은 폭 720px 이상의 데스크톱 브라우저를 기준으로 만든다.

## 구성

```
skills/learn-to-tell/
├── SKILL.md      # agent가 따르는 절차: 진단 → 범위 → 자료 → 검증 → 확인 → 복귀 → map
├── kit/          # 수업 생성용 부품 라이브러리 (장면 덱, 도식, 차트, lint, 기대값 대조)
├── gallery/      # 예시 수업 (Vercel 배포 대상)
├── server/       # 로컬 수업 서버 + 학습 이벤트 기록 (127.0.0.1:47823)
└── hooks/        # background.md 크기 관리
tests/            # node --test 기반 kit·서버·gallery 테스트
agent-docs/adr/   # 주요 설계 결정과 기각한 대안
```

설계 결정은 `agent-docs/adr/`에 기각한 대안과 함께 남겨 두었다. 예를 들어 v0를 폐기하고 최소 설계로 다시 쓴 이유, 정리 장면을 "그림 요약"이 아니라 "회상 질문 → 답 공개"로 둔 이유, 수업 하나의 피드백을 그 수업이 아니라 생성기(skill·kit)에서 고친다는 규칙 등이다.

## 사용

```bash
# 이 저장소를 Claude Code 프로젝트로 열면 .claude/skills/learn-to-tell 로 skill이 잡힌다
# 작업 세션에서
/fork
# fork된 세션에서
/learn-to-tell <주제>

# 테스트
npm test

# 갤러리를 로컬에서 보기 → http://127.0.0.1:47823/gallery/index.html
node skills/learn-to-tell/server/server.mjs
```

서버는 127.0.0.1에만 열리고 2시간 동안 요청이 없으면 스스로 종료된다. 포트는 `LTT_PORT`, 종료 대기 시간은 `LTT_IDLE_MINUTES`로 바꾼다. 같은 포트에 이미 learn-to-tell 서버가 떠 있으면 새로 띄우지 않고 그대로 종료하므로, 다른 worktree의 파일을 보려면 포트를 바꿔 띄운다.

개인 학습 기록은 `~/.learn-to-tell/`(또는 `$LTT_HOME`)에 저장된다.

[^lost-multiturn]: Philippe Laban, Hiroaki Hayashi, Yingbo Zhou, Jennifer Neville, "LLMs Get Lost In Multi-Turn Conversation", arXiv:2505.06120, 2025. https://arxiv.org/abs/2505.06120
