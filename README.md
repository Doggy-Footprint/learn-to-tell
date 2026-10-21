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
3. 그 선택의 **의미를 설명**하고,
4. 지난 학습을 **map에서 찾아 복습**할 수 있게 하는 것이다.

## 어떻게 동작하나

### 1. 진단: 개념 사다리

낯선 용어부터 묻지 않는다. 상황에 필요한 개념을 낮은 수준부터 3–5단으로 세우고 중간 단부터 "알고 있음 / 애매함 / 아예 모름"을 묻는다. 답에 따라 위아래로 이동해, **아는 개념 바로 위의 모르는 개념**을 이번 학습 수준으로 정한다. 자기 보고는 실제보다 높게 나오기 쉬우므로 핵심 결정 변수는 짧은 퀴즈로 확인한다. 진단 결과는 판정이 아니라 가설로 다룬다.

### 2–3. 범위와 자료

범위는 결정 변수를 이해하는 데 필요한 교과서 기본기다(대략 교과서 한 챕터). 결정 변수마다 예측 → 조작 → 확인 파트로 나눈다. 개념 이름이 아니라 **선택지 · 영향 · 필요 정보 · 실패 조건**으로 결정 변수를 다룬다. 조작해서 관찰할 필요가 없으면 대화만으로 끝내고, 필요할 때만 시뮬레이션 수업을 생성한다.

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
| 시뮬레이션 수치가 틀림 | 모델 코드를 보지 않는 검토 서브에이전트가 수업 outline의 공식만 보고 기대값을 구함 → 페이지가 열릴 때 모델 값과 자동 대조. 불일치 시 기대값을 모델에 맞추지 않고 손계산으로 원인을 찾음 |
| 핵심 주장(공식, 범위, 비교 판정)이 틀림 | 같은 검토 서브에이전트가 outline의 주장 목록만 검토. 검토하지 못한 주장에는 "미검증" 표시 |
| 혼자 읽으면 이해가 안 됨 | 검토 서브에이전트가 사용자 배경(`background.md`)으로 outline을 읽고 정의 전 용어·빠진 선행 개념을 지적, lint가 용어 순서·밀도를 점검 |
| 화면이 깨지거나 단조로움 | 자동 lint(카드 남용, 채움 글, 용어 밀도)와 두 화면 크기의 레이아웃 감사("고침" 0건, "권고"는 3회 안에서 고치고 남으면 기록) |

agent의 자기 확언만으로는 정확성을 인정하지 않는 것이 원칙이다.

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

claude.ai에는 로컬 서버와 `~/.learn-to-tell`이 없으므로 수업은 **standalone artifact**(제목 `LTT · <주제>`)로 만들어지고, 이해 확인이 끝나면 결과(`result.md`)가 artifact 안에 담긴다. 나중에 Claude Code에서

```
/learn-to-tell import
```

를 실행하면 `LTT · ` artifact를 찾아 `~/.learn-to-tell/lessons/`로 가져오고 지식 map을 갱신한다. 목록에서 찾지 못하면 artifact 링크나 결과 텍스트를 붙여 넣으면 된다(`node <skill>/map/ltt-map.mjs import <html|md>`).

## 사용

```bash
# 작업 세션에서
/fork
# fork된 세션에서
/learn-to-tell <주제>

# 테스트
npm test

# 갤러리 수업을 헤드리스 Chrome으로 화면 점검 (1440×900 · 1280×800) / 기준선 갱신
npm run audit
npm run audit:baseline

# claude.ai용 zip (dist/learn-to-tell.zip) / kit npm 패키지 내용 채우기
npm run build:zip
npm run build:kit

# kit/*.css를 고친 뒤 kit JS 안 CSS 문자열 다시 만들기
npm run build:css

# 갤러리를 로컬에서 보기 → http://127.0.0.1:47823/gallery/index.html
# 비교 실험 결과 → http://127.0.0.1:47823/compare1/index.html (시작 안내에 site/compareN 목록이 함께 나온다)
node skills/learn-to-tell/server/server.mjs
```

서버는 127.0.0.1에만 열리고 40분 동안 요청이 없으면 스스로 종료된다. 포트는 `LTT_PORT`, 종료 대기 시간은 `LTT_IDLE_MINUTES`로 바꾼다. 같은 포트에 이미 learn-to-tell 서버가 떠 있으면 새로 띄우지 않고 그대로 종료하므로, 다른 worktree의 파일을 보려면 포트를 바꿔 띄운다.

`npm run audit`은 `skills/learn-to-tell/server/audit.mjs`로 갤러리 수업마다 `?audit`을 헤드리스 Chrome에서 열어 장면별 경고를 표로 보여 준다(수업 하나는 `node skills/learn-to-tell/server/audit.mjs <lesson.html 경로>`). `tests/gallery-audit.baseline.json`은 페이지·크기별로 허용하는 경고 수의 상한이고, 테스트는 실제 건수가 그 이하인지만 본다. 갤러리 경고를 줄이면 `npm run audit:baseline`으로 상한을 내린다. 크기는 창 크기라 실제 화면은 Chrome 툴바만큼 낮고(1440×900 → 1440×813), 요약 줄에 실제 화면 크기가 찍힌다. 이 테스트는 Chrome이 없거나 `CI`가 설정된 환경에서는 건너뛴다(`LTT_AUDIT=1`로 강제, `LTT_AUDIT=0`으로 끔).

### 릴리스

`master`에 push하면 `.github/workflows/release.yml`이 테스트 후, `.claude-plugin/plugin.json`의 `version`에 해당하는 태그 `v<version>`이 아직 없을 때만 릴리스한다: kit을 npm(`@doggy-footprint/ltt-kit`)에 publish하고, `learn-to-tell.zip`을 첨부한 GitHub Release를 만든다. 릴리스하려면 `.claude-plugin/plugin.json`과 `packages/ltt-kit/package.json`의 `version`을 함께 올린다(다르면 커밋과 CI가 실패한다. 커밋 검사는 `npm run setup:hooks`로 한 번 설치). npm publish에는 저장소 secret `NPM_TOKEN`이 필요하다. 버전을 올릴 때 작가 계약 변경은 `skills/learn-to-tell/kit/CHANGELOG.md`에 한 줄씩 적는다(npm 패키지에도 들어간다).

개인 학습 기록은 `~/.learn-to-tell/`(또는 `$LTT_HOME`)에 저장된다.

[^lost-multiturn]: Philippe Laban, Hiroaki Hayashi, Yingbo Zhou, Jennifer Neville, "LLMs Get Lost In Multi-Turn Conversation", arXiv:2505.06120, 2025. https://arxiv.org/abs/2505.06120
