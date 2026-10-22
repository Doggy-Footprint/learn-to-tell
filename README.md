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

### 1. 진단: 학습 사다리

배우려는 내용을 구체화하고, 정하기 어려우면 일반적인 교육과정과 선수 과목을 가정해 낮은 수준부터 **학습 사다리**를 세운다. 단마다 짧은 퀴즈 카드에 "확실히 알고 있음 / 아예 모름 / 이해한 내용을 설명하기"로 답하며(최대 5회) 학습 시작 지점을 정한다. 종료 지점은 수업 단위가 끝나거나 다른 주제로 넘어가는 곳들을 경계로 한다. task에서 시작했다면 그 작업에 필요한 수준이다. 정한 범위는 사용자에게 확인받고, 지식 map에서 기억이 옅어진(fading·stale) 개념은 진단 질문에 섞어 복습 대상을 고른다.

### 2–3. 범위와 자료

범위는 결정 변수를 이해하는 데 필요한 교과서 기본기다(대략 교과서 한 챕터). 조작해서 관찰할 필요가 없으면 대화만으로 끝내고, 필요할 때만 수업 페이지를 생성한다.

수업은 "선생님 없이 혼자 읽어도 이해되는 자료"를 기준으로 하고, 설명의 중심은 그림이다. 그림이 보여 주는 것은 실제와 대응해야 하고, 핵심 관계가 가장 먼저 눈에 띄어야 한다. 어떤 구조(넘김, 스크롤, 한 화면)와 전략으로 전달할지는 agent가 정하고, kit은 같은 구조가 있을 때만 쓰는 보조 라이브러리다. 생성은 계획 → 검증표 → storyboard(설명 방식 2–3안 중 사용자가 고름) → 수업 → 스크린샷 검증 순서로 한 번 지나간다.

### 4–6. 확인, 복귀, 기록

서술 퀴즈로 "질문을 만들 수 있는지", "선택과 그 의미를 설명할 수 있는지"를 확인한다. 평가 기준은 답을 받기 전에 정해 둔다. 결과(이번 결정, 선택을 바꾸는 조건, agent에게 할 질문)는 `result.md`로 원래 작업 세션에 보내고, 약한 개념과 미룬 범위는 `~/.learn-to-tell/map.md`의 다음 학습 후보가 된다. 개인 데이터는 저장소 밖에만 남는다.

## 생성된 자료를 믿을 수 있게 만드는 장치

agent가 즉석에서 만드는 교재는 틀린 수치나 그럴듯한 오개념을 담기 쉽다. 그래서 공개 전에 여러 겹으로 검증한다.

| 위험 | 장치 |
| --- | --- |
| 시뮬레이션 수치가 틀림 | 생성 agent가 모델 코드보다 먼저 계산 지점의 기대값을 손으로 구해 두고, 페이지가 열릴 때 `LTT.expect`로 모델 값과 자동 대조. 불일치 시 기대값을 모델에 맞추지 않고 손계산으로 원인을 찾음 |
| 그림이 사실과 다르거나 핵심이 안 보임 | 생성 전에 시행(`checklist.md`: 그림만 보고 답할 질문, 먼저 눈에 띄어야 할 것)과 정답(`answers.md`)을 나눠 적고, 수업 코드를 보지 않는 검증 서브에이전트가 스크린샷만 보고 답한 뒤 정답과 대조해 미충족 항목만 보고(최대 3회) |
| 움직이는 그림의 중간 상태가 틀림 | 검증표에 핵심 상태 시점(`[shot <id> <ms>]`)을 적어 두면 스크린샷 도구가 그 시점마다 찍어 검증 대상에 넣음 |
| 정의 전 용어, 채움 글, 도달할 수 없는 목표 | 페이지가 열릴 때 kit이 결정적으로 검사(`#ltt-check`)하고, 0건이 될 때까지 고친 뒤 공개 |

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
