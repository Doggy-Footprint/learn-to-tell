# Learn to Tell

> 작업 중 coding agent가 "이 결정을 하려면 사용자가 무엇을 알아야 하는가"를 찾아내고, 그 결정에 필요한 교과서 기본기를 익히게 한 뒤 원래 작업으로 돌려보내는 학습 skill.

**예시 수업 갤러리 → https://learn-to-tell.vercel.app**

## 왜 만들었나

AI agent와 함께 일하다 보면 agent는 알지만 나는 모르는 결정이 계속 나온다. 캐시 TTL을 얼마로 둘지, 색 대비를 어디까지 맞출지, GPU 병목이 어디인지 같은 것들이다. 게다가 LLM은 정보가 여러 턴에 나뉘어 들어오는 대화에서 크게 흔들린다. 20만 건이 넘는 시뮬레이션 대화를 분석한 연구에 따르면, 같은 과제를 한 번에 다 주었을 때보다 여러 턴에 나눠 주었을 때 성능이 6개 생성 과제 평균 39% 떨어졌다. 모델은 초반 턴에서 가정을 세우고 성급하게 최종 답을 만든 뒤 그 답에 지나치게 기댔고, 한 번 잘못 들어서면 회복하지 못했다[^lost-multiturn]. 사용자가 결정 변수를 모르면, 모호한 결정을 agent가 묻지 않고 한쪽으로 정해 버려도 알아차리기 어렵다.

이때 선택지는 보통 둘뿐이다.

- agent의 추천을 그대로 받는다. 빠르지만 왜 그런 선택인지 설명할 수 없고, 조건이 바뀌면 판단하지 못한다.
- 따로 공부한다. 정확하지만 작업 흐름이 끊기고, 필요한 범위보다 훨씬 많이 읽게 된다.

Learn to Tell은 그 사이를 노린다. 목표는 숙련이 아니라, 사용자가

1. agent에게 **적절한 질문**을 하고,
2. agent의 도움으로 **결정 변수를 고르고**,
3. 그 선택의 **의미를 설명**할 수 있게 하는 것이다.

## 어떻게 동작하나

Claude Code skill(`/learn-to-tell <주제>`)로 동작한다. 작업 세션을 `/fork`한 세션에서 학습하므로 원래 작업의 context를 더럽히지 않는다.

```
작업 세션 ──/fork──▶ 학습 세션
                     1. 진단       대화로 quick survey (최대 5문항)
                     2. 목표 확인  agent가 학습 목표 1–3줄을 제안하고 사용자가 한 번 확인
                     3. 수업       움직이는 인포그래픽 장면 덱 (브라우저, 데스크톱·폰)
                     4. 이해 확인  서술 퀴즈 (pass / fail / skipped)
                     5. 작업 복귀  결정·조건·질문을 result.md로 원래 세션에 전달
작업 세션 ◀──────────┘
```

### 1–2. 진단과 목표

낯선 용어부터 묻지 않는다. 상황에 필요한 개념을 낮은 수준부터 3–5단으로 세우고 중간 단부터 "알고 있음 / 애매함 / 아예 모름"을 묻는다. 답에 따라 위아래로 이동해 **아는 개념 바로 위의 모르는 개념**을 학습 수준으로 정한다. 그다음 agent가 "이 수업을 마치면 …를 설명하고 고를 수 있다"는 학습 목표를 제안하고, 사용자가 한 번 확인한 뒤에만 수업을 만든다.

### 3. 수업

결정 변수마다 **예측 → 조작 → 회상**으로 진행한다. 장면마다 그림 하나가 화면을 차지하고, 움직임이 메커니즘을 보인다(요청 점이 캐시를 지나 원본까지 가는지, 막대가 어떻게 쌓이는지). 글은 그림 위 라벨·번호 핀·단계 자막에 얹는다. 손잡이는 실사용 범위만 움직이고 범위와 상수에는 근거를 단다.

### 4–5. 확인과 복귀

서술 퀴즈로 질문을 만들 수 있는지, 선택과 그 의미를 설명할 수 있는지 확인한다. 결과(이번 결정, 선택을 바꾸는 조건, agent에게 할 질문)는 `result.md`로 원래 작업 세션에 보낸다. 지난 수업은 로컬 서버 첫 화면(`http://127.0.0.1:47823/`)에서 대표 이미지 grid로 다시 연다.

## 싸고 믿을 수 있게 만드는 장치

| 위험 | 장치 |
| --- | --- |
| 화면이 깨짐 | 정적 부품은 상한(schema)과 칸 맞춤으로 넘침·겹침을 막는다. 모든 글을 상한까지 채운 fuzz 덱이 데스크톱 1280×800·폰 390×844에서 0건이어야 테스트가 통과한다 |
| 움직이는 그림이 의도와 다름 | `check.mjs`가 움직이는 장면만 beat 시각 프레임을 한 장(sheet)에 모으고 agent가 그 장만 본다 |
| 핵심 주장·수치가 틀림 | outline의 주장·모델 절만 받은 Sonnet 서브에이전트가 HTML 작성과 병렬로 검토. 기대값은 `LTT.expect`로 페이지가 열릴 때 대조. 검토하지 못한 주장에는 "미검증" |
| 생성 비용 | 수업 = `LTT.deck` 호출 하나(선언형 장면·부품·움직임 동사). API 문서 12KB, check 한 번에 데스크톱·폰 모두, 장면 12개 상한 |

agent의 자기 확언만으로는 정확성을 인정하지 않는 것이 원칙이다.

## 예시

https://learn-to-tell.vercel.app 에서 kit v2로 만든 움직이는 장면 본보기를 볼 수 있다. kit v1 시절의 수업 13편(캐시 TTL, GPU 데이터 흐름, 색 대비, 분산 투자 등)은 "이전 버전"에 그대로 보관했다.

## 구성

```
skills/learn-to-tell/
├── SKILL.md      # agent가 따르는 절차: 진단 → 목표 확인 → 수업 → 확인 → 복귀
├── kit/          # 수업 라이브러리 ltt.js 한 파일 + API.md + 글꼴·KaTeX
├── look/         # 화면 기준과 본보기 shot 카드
├── server/       # 로컬 서버(127.0.0.1:47823, / = 지난 수업 grid), check.mjs(CDP 화면 점검)
├── standalone.md # claude.ai(웹·모바일)용 artifact 수업 절차
└── hooks/        # background.md 크기 관리, kit 소스 읽기 차단 (Claude Code 전용)
site/gallery/     # kit v2 본보기 (Vercel 배포)
site/legacy/      # kit v1과 그 수업·비교 실험 (보관)
packages/ltt-kit/ # kit npm 패키지 (artifact 수업이 jsDelivr로 불러옴)
scripts/          # build(zip·kit), shots(look 카드), measure(생성 비용 측정)
tests/            # node --test: kit 단위·fuzz·check·서버
agent-docs/       # 설계 결정과 기각한 대안
```

## 설치

### Claude Code (plugin)

```bash
claude plugin marketplace add Doggy-Footprint/claude-plugins
claude plugin install learn-to-tell@doggy-footprint
```

**자동 업데이트**: 서드파티 marketplace는 auto-update가 기본으로 꺼져 있다. `/plugin` → Marketplaces → `doggy-footprint` → Enable auto-update를 켜면 Claude Code를 시작할 때 새 버전을 받는다.

수동 업데이트:

```bash
claude plugin marketplace update doggy-footprint
claude plugin update learn-to-tell@doggy-footprint
```

marketplace는 이 repo의 `master`를 가리키지만, 설치본은 `plugin.json`의 `version`이 바뀌어야 새 버전으로 인식한다. 그래서 배포할 때마다 `version`을 올린다(올리면 claude.ai용 릴리스도 같이 나간다).

### claude.ai (웹·모바일 앱)

모바일 앱에서는 skill을 업로드할 수 없으므로 PC 웹에서 한 번 올린다. 올린 skill은 같은 계정의 모바일 앱에서도 쓸 수 있다.

1. [최신 릴리스의 `learn-to-tell.zip`](https://github.com/Doggy-Footprint/learn-to-tell/releases/latest/download/learn-to-tell.zip)을 받는다(압축은 풀지 않는다).
2. claude.ai 설정에서 코드 실행(Code execution)을 켠다.
3. Customize → Skills → `+` → Create skill → Upload a skill에서 zip을 올린다.

**자동 업데이트되지 않는다.** 대신 skill이 시작할 때 GitHub 최신 릴리스와 자기 버전을 비교해, 새 버전이 있으면 대화 첫머리에 한 줄로 알려 준다(웹 fetch가 막혀 있으면 알림 없이 넘어감). 업데이트하려면 PC 웹에서 기존 skill을 지우고 위 링크의 새 zip을 다시 올린다. 이전에 만든 수업 artifact는 kit을 버전 고정 CDN 주소로 불러오므로 skill을 업데이트하지 않아도 계속 열린다.

claude.ai에는 로컬 서버와 `~/.learn-to-tell`이 없으므로 수업은 **standalone artifact**(제목 `LTT · <주제>`)로 만들어지고, 이해 확인이 끝나면 결과(`result.md`)가 artifact 안에 담긴다. 화면 점검(check)과 사실 검토 서브에이전트가 없으므로 결정 변수에 관한 주장에는 "미검증"이 붙는다.



## 사용

```bash
# 작업 세션에서
/fork
# fork된 세션에서
/learn-to-tell <주제>

# 테스트 (Chrome이 있으면 fuzz·check 테스트도 돈다)
npm test

# 수업 하나 점검: 데스크톱·폰 지적 + 움직이는 장면 sheet
node skills/learn-to-tell/server/check.mjs <lesson id | lesson.html | site/... 경로>

# 본보기 shot 카드와 무드보드 다시 만들기 (look/)
node scripts/shots.mjs && node scripts/shots.mjs --board

# claude.ai용 zip (dist/learn-to-tell.zip) / kit npm 패키지 내용 채우기
npm run build:zip
npm run build:kit

# 지난 수업 grid → http://127.0.0.1:47823/ , 본보기 → /gallery/index.html
node skills/learn-to-tell/server/server.mjs
```

서버는 127.0.0.1에만 열리고 40분 동안 요청이 없으면 스스로 종료된다. 포트는 `LTT_PORT`, 종료 대기 시간은 `LTT_IDLE_MINUTES`로 바꾼다. 같은 포트에 이미 learn-to-tell 서버가 떠 있으면 새로 띄우지 않고 종료하므로, 다른 worktree의 파일을 보려면 포트를 바꿔 띄운다.

### 릴리스

`master`에 push하면 `.github/workflows/release.yml`이 테스트 후, `.claude-plugin/plugin.json`의 `version`에 해당하는 태그 `v<version>`이 아직 없을 때만 릴리스한다: kit을 npm(`@doggy-footprint/ltt-kit`)에 publish하고, `learn-to-tell.zip`을 첨부한 GitHub Release를 만든다. 릴리스하려면 `.claude-plugin/plugin.json`과 `packages/ltt-kit/package.json`의 `version`을 함께 올린다(다르면 커밋과 CI가 실패한다. 커밋 검사는 `npm run setup:hooks`로 한 번 설치). npm publish에는 저장소 secret `NPM_TOKEN`이 필요하다. 

개인 학습 기록은 `~/.learn-to-tell/`(또는 `$LTT_HOME`)에 저장된다.

[^lost-multiturn]: Philippe Laban, Hiroaki Hayashi, Yingbo Zhou, Jennifer Neville, "LLMs Get Lost In Multi-Turn Conversation", arXiv:2505.06120, 2025. https://arxiv.org/abs/2505.06120
