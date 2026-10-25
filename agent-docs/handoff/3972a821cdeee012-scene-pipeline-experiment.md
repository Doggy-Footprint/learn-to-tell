# 장면 생성 파이프라인 실험: 스토리보드 → 계획 → Haiku 샘플 / 바로 생성 → corrector

## Goal

- "이 프로젝트의 가장 성공적인 결과물은 https://learn-to-tell.vercel.app/gallery/shots/index.html 에서 볼 수 있는 핵심 내용을 이해하기 쉽게 표현하는 diagram 예시들이야. 나는 저걸 더 저렴한 가격에 만드는 걸 목표로 여러 시도를 했고, 결과적으로 1. 외형은 괜찮으나 생성에 필요한 cost가 너무 크거나, 2. skill에서 제공하는 library가 너무 커져서 agent에게 학습의 대상 + 디버깅의 대상이 되거나 3. 외부 라이브러리를 쓰면 원하는 퀄리티가 나오지 않거나. 하는 등의 문제가 있어서 rollback 을 하게 됐어. 위와 같은 문제를 반복하지 않으면서 적당한 생성시간 + `gallery/shots/index.html` 수준의 결과물이야."
- "rollback됨, 굳이 찾아보지 말것."
- 다음 실험(사용자 제안, 2026-10-25): "완벽하게 막는 건 어려운 일이다. haiku를 이용해서 Story board (설명하고자 하는 것-opus) 을 통해 계획(sonnet)을 세우고 전 단계로 - hiaku를 이용한 3-5 샘플링을 만든다. sonnet은 이를 체크하여 제작한다. --- 1번 시험 포인트, 효과가 있는지 그 이후 audit이 아닌 corrector가 직접 검사하고 고친다. 기준은 story board + 계획이다. 이 corrector가 sonnet / haiku 뭐가 들어가면 좋을지도 시험 대상이다."
- "계획까지는 그렇게 하고, 그 다음에 fork해서 sample 받기 / 바로 생성 나눠줄 수 있나? context 오염은 피하고 싶어."
- "순위 보다는 점수로 평가하게 해줘. 10점 만점. 그리고 각각 노트 남기게 해줘."

## State

- 브랜치 `raise/master`, 기준 커밋 `0c3ca51`. 이 handoff와 같은 커밋에 실험 스크립트를 넣었다. skill·kit 코드 변경은 없다.
- 변경 파일:
  - `experiments/scene-pipeline/` (새 디렉터리)
    - 스크립트: `setup.py`, `mkprompt.py`, `run_one.sh`, `audit.mjs`, `audit-pw.mjs`, `summarize.py`, `mklive.py`, `record.mjs`, `primitives.md`
    - 채점 페이지 템플릿: `review-score.tpl.html`(점수제, 다음 라운드 기본), `review-live.tpl.html`(순위제, round0)
    - `.gitignore`: 다시 만들 수 있는 `refs/`, `gallery/`, `review/` 등
  - `experiments/scene-pipeline/round0/`: round0 기록. `plan.json`, `review-key.json`(Sonnet 가–마 배정), `sonnet-ranks/`, `summary.jsonl`, `runs.log`, `runs/*/{scene.html,prompt.md}`(Sonnet 32개), `runs-haiku/`, `haiku/`(키·순위·요약)
  - 이 handoff, `agent-docs/handoff/index.md`
- 실행 환경을 다시 세우는 법(새 컨테이너):
  - `python3 setup.py`가 `refs/s{k}-{A,B}`와 `plan.json`을 만든다(PIL 필요).
  - `gallery/orig/`는 `site/gallery/shots/`를 통째로 복사한 것이다. `gallery/runs/`는 `run_one.sh`가 만든다.
  - round0 장면을 기준점으로 쓰려면 `round0/runs/<id>/scene.html`을 `gallery/runs/<id>/`로 복사한다.
- 채점 artifact(round0, 순위제): https://claude.ai/artifact/Rv3tSP2uq8qEiLisqJs8X1 (db `ranks`). 디버그용 `log` 컬렉션 문서 32개가 남아 있다.
- 관련 issue: https://github.com/Doggy-Footprint/learn-to-tell/issues/17 (Haiku 활용: 완성품 검사·수정, 쉬운 이미지 생성, Haiku 초안 → Sonnet 참고)

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| round0 B안: 가장 가까운 gallery shot 2개의 소스 복제 + `primitives.md`(A안: 현재 skill 흐름 API.md + look.md + 카드). 8 shot leave-one-out, 2회씩, Sonnet high | 사전 기준 둘 다 실패. 비용 −23%(중앙값 $0.479→$0.367, 기준 −50%). B ≥ A인 shot 2/8(기준 절반 이상). 평균 순위 A 2.81, B 3.12, 원본 3.12 | hypothesis: 품질 차이는 참고 자료보다 "무엇을 그릴지" 판단(강조점, 상호작용 종류)에서 갈렸다. A가 이긴 shot은 대부분 stepper 선택이 맞았다 |
| Haiku high로 같은 32회(재미 삼아) | 비용 중앙값 A $0.035, B $0.030. 평균 순위 원본 2.57, B 3.00, A 3.21(7 shot). audit 실패 A 2건 | verified: 사용자 결정으로 장난으로 처리하고 Sonnet으로 다시 했다. Haiku가 주 장면 생성을 맡는 안은 버렸다 |
| 채점을 11.5초 영상으로 | stepper·sweep 장면은 영상으로 공정하게 볼 수 없다 | verified: 라이브 iframe(`mklive.py`)으로 바꿨다 |
| 저장소 `server/audit.mjs` 사용 | root Chrome은 `--no-sandbox`가 필요하고, 그 뒤에도 `--virtual-time-budget`에서 멈췄다 | verified: `audit-pw.mjs`(Playwright + `createLttServer`)로 대체 |
| 채점 페이지 순위 클릭이 반영되지 않음 | 클릭은 기록되는데 순위가 그대로 | verified: artifact db `get()`이 frozen 객체를 돌려줘 변경이 조용히 실패했다. 새 객체로 복사해 고쳤다 |

## Next Step

round1을 연다. 아래는 사용자와 합의한 설계이고, 사용자가 아직 실행을 승인하지 않았다. 시작 전에 이 설계를 보여 주고 승인을 받는다.

1. 단계 S, 스토리보드(Opus): shot마다 2벌(sb1, sb2). 설명하려는 것을 정한다.
2. 단계 L, 계획(Sonnet): 스토리보드마다 하나. 내용은 다음과 같다.
   - 구성안 3–5개. 샘플끼리 닮지 않도록 서로 다른 구성이어야 한다.
   - 추천 구성안 하나.
   - 검사 지점 목록: 어느 상태에서 무엇이 보여야 하는지. 예: "3단계: 전류 + → −, 전자는 반대".
3. 분기: 서로 다른 `claude -p` 프로세스로 나눈다. 각 실행 디렉터리에는 스토리보드·계획 파일과 `refs/`만 둔다.
   - P(대조군): Sonnet이 추천 구성안으로 바로 만든다.
   - H: Haiku 프로세스가 구성안 하나씩 맡아 샘플 3–5개를 만든다. 이어서 새 Sonnet 프로세스가 스토리보드, 계획, 샘플 HTML, 샘플 스크린샷을 보고 하나를 골라 다듬는다.
   - 회차 1은 sb1, 회차 2는 sb2를 P와 H가 같이 쓴다. 이렇게 짝지어 비교하면서 스토리보드 편차도 반영한다.
4. 작성자는 계획의 검사 지점마다 도달 방법(단계 번호, 슬라이더 값, 시각)을 장면 안에 적는다. 녹화 스크립트는 그 지점들과 기본 화면(시간 3개 시점, 단계마다 마지막 상태, 슬라이더 양 끝)을 함께 찍는다.
5. audit(`audit.mjs`, 최대 3회, 고침 0건)은 비용이 없는 기계 관문으로 남긴다.
6. 점수제로 채점한다. shot마다 원본, round0 A-1(기준점), P×2, H×2의 6개 장면이다.
   - `mklive.py`는 장면 이름(orig/A1/A2/B1/B2)과 경로가 고정돼 있어 새 이름에 맞게 고쳐야 한다.
   - `review-key.json`이 있으면 재사용하므로 새 라운드는 새 키로 시작한다.
   - db는 `scores/<shot>` = `{scores:{label:n}, notes:{label:text}, note, at}`이다.
7. 사전 기준(round1): H가 P보다 평균 1점 이상 높거나, 같은 점수에 더 싸면 효과가 있다고 본다. 비용은 단계별로 기록한다. S·L 비용은 P와 H 양쪽에 더한다.
8. round2: round1 승자에 corrector를 적용한다. 없음 / Haiku / Sonnet × 2회.
   - 입력: 스토리보드, 계획, 검사 지점 스크린샷, 기본 스크린샷, HTML. 고칠 때는 Edit만 쓴다.
   - 기준: 평균 1점 이상 오르고, 2점 이상 떨어진 장면이 없을 것. 이를 통과하면 Haiku와 Sonnet은 비용 대비 점수로 비교한다.
9. round0 노트에서 나온 audit 빈틈은 corrector가 잡는지 확인할 대상이다. AGENTS.md "Generated Lesson Defects"에 따라 결과는 생성기·audit 규칙 수정 후보로 남긴다.
   - 그림 찌그러짐: s04
   - 그림이 너무 작음: s13
   - 그림이 칸을 벗어남: s16
   - 멈춘 것처럼 보임: s13, s10 각 1개
   - 물리 방향 반대: s04 1위 장면의 전류 방향

## Open Questions

- 스토리보드 입력: 기본값은 topic, audience, decision, domain, theme, medium, role만 준다. structure·motion·composition은 계획 단계가 정한다. round0은 이 세 축을 브리프로 줬으므로 round0 A-1 기준점과는 조건이 다르다.
- Opus·Sonnet·Haiku의 effort: 기본값은 round0과 같은 `high`다.
- 참고 자료: 기본값은 B 방식(본보기 2개 + `primitives.md`)이다. round0에서 더 싸고 Haiku audit 실패가 0건이었기 때문이다.
- 검사 지점을 장면에 적는 형식: 정하지 않았다. 후보는 다음과 같다. 정하기 전에 `kit/api/deck-contracts.md`를 읽는다.
  - 장면 안 JSON 블록
  - kit의 figure `steps`·`LTT.sweep` 상태 이름을 그대로 쓰는 것
- 새 라운드 채점 artifact: 기본값은 새 artifact를 만들어 round0의 `ranks` 데이터를 보존하는 것이다.

## Spec

없음. workflow-approach 작업이 아니라 실험이다.

## Execution Ledger

- round0 Sonnet(high), 32회, 모두 audit 통과. 실패 2회는 API 500/529였고 다시 돌렸다.

  | 지표 | A | B |
  | --- | --- | --- |
  | 비용 평균 | $0.486 | $0.353 |
  | 비용 합 | $7.78 | $5.65 |
  | 읽은 컨텍스트 | 500k | 281k |
  | 출력 토큰 | 23.8k | 19.9k |
  | 시간 | 211s | 162s |

- 비슷한 그림이 나온 것: Sonnet 실행 가운데 `runs-haiku`를 읽은 것은 없다. 같은 브리프, 같은 참고, 같은 kit/audit에서 수렴했다.
- 헤드리스 실행 조건:
  - `run_one.sh`는 환경 변수 `CLAUDE_CODE_SESSION_ID`, `CLAUDE_CODE_REMOTE_SESSION_ID`, `CLAUDE_CODE_CHILD_SESSION`을 지우고 실행한다.
  - 옵션: `--strict-mcp-config`, `--max-turns 60`. Read·Write·Edit·`Bash(node:*)`만 허용한다.
- 환경 함정:
  - `pkill -f http.server`는 자기 셸까지 죽인다(exit 144).
  - Playwright는 `/opt/node22/lib/node_modules/playwright/index.mjs` 절대 경로로 import한다.
