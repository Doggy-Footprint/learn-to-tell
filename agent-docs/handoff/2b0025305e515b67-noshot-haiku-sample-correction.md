# 장면 생성 실험: 본보기 없음 + Haiku 샘플 + Haiku 교정

## Goal

- "이 프로젝트의 가장 성공적인 결과물은 https://learn-to-tell.vercel.app/gallery/shots/index.html 에서 볼 수 있는 핵심 내용을 이해하기 쉽게 표현하는 diagram 예시들이야. 나는 저걸 더 저렴한 가격에 만드는 걸 목표로 여러 시도를 했고, 결과적으로 1. 외형은 괜찮으나 생성에 필요한 cost가 너무 크거나, 2. skill에서 제공하는 library가 너무 커져서 agent에게 학습의 대상 + 디버깅의 대상이 되거나 3. 외부 라이브러리를 쓰면 원하는 퀄리티가 나오지 않거나. 하는 등의 문제가 있어서 rollback 을 하게 됐어. 위와 같은 문제를 반복하지 않으면서 적당한 생성시간 + `gallery/shots/index.html` 수준의 결과물이야."
- 키워드 실험 채점 뒤(2026-10-25): "갤러리를 알고 있어서 오염이 좀 있을 수 있는데, 일단 무시해도 좋을 것 같아. 약간 특징이 있는데 - 세련됨 / 창의성 / 표현력이라 해야하나. 그런 부분에선 shot이 없는 게 나은 거 같고 infographic animation의 체계성 면에서는 shot이 일부 도움이 되는 거 같아."
- "그러면 넘어가서 no shot + haiku sample + haiku correction을 테스트하자. 이건 handoff로 만들고 다른 세션에서 진행할게"

## State

- 브랜치 `raise/master`, 기준 커밋 `8d1f4c9`. 아직 이 실험의 코드는 없다.
- 이전 실험 기록은 stale handoff `stale/3972a821cdeee012-scene-pipeline-experiment.md`에 있다(round0, round1 파일럿, 키워드 실험).
- 쓸 수 있는 자산(`experiments/scene-pipeline/`):
  - `round-kw/s{04,07,13,14,16,25,30,31,47,49}/sb/storyboard.md`: shot 10개 스토리보드. s04·s07은 round1 sb1(Opus)이고 나머지는 Sonnet이다.
  - `round-kw/s*/0/scene.html`: 기준 장면. Sonnet이 스토리보드 + kit 문서(`API.md`, `api/*.md`)로 만들었고 본보기는 없다. 프롬프트는 `round-kw/s*/0/prompt.md`다.
  - `round-kw/db/`, `round-kw/db2/`, `round-kw/review-key-kw.json`: 기준 장면의 사용자 점수(10점 만점). 0 평균은 8.2, K는 6.8, 원본은 5.6이다.
  - `kw.py`: 스토리보드 → K/0 생성(`r1.claude`로 헤드리스 `claude -p` 실행, audit 최대 3회). `writer(k, "0", ex)`가 기준 프롬프트다.
  - `r1.py`: `claude()`(환경 변수 분리, 재시도, 비용 기록), `audit()`, `shots()`.
  - `shots.mjs`: 기본 화면(t1s·t4s·t8s, 단계마다, 손잡이 양 끝)과 `#ltt-checks` 지점 스크린샷.
  - `mklive.py`(`LTT_ROUND`, `LTT_SHOTS`)와 `review-score.tpl.html`: 블라인드 점수 채점 페이지 묶음. `LTT_ROUND=kw` 분기를 복제해 새 장면 이름을 넣는다.
- 새 컨테이너에서 다시 세우는 법(`gallery/`는 gitignore 대상):
  - `python3 setup.py`(plan.json, refs, PIL 필요). `cp -r site/gallery/shots gallery/orig`.
  - `round-kw/s*/`를 `gallery/kw/s*/`로 복사하고, 키워드 사전은 `round-kw/tag/keywords.json`을 `gallery/kw/tag/`에 둔다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| round0 B안: 가까운 gallery shot 2개 복제 + `primitives.md`, Sonnet | 비용 −23%(기준 −50%), B ≥ A shot 2/8 | hypothesis: 품질은 참고 자료보다 "무엇을 그릴지" 판단에서 갈린다 |
| Haiku high가 주 장면 생성을 맡음(round0, 본보기 있음, 브리프만) | 평균 순위 원본 2.57, B 3.00, A 3.21. audit 실패 A 2건 | verified: 사용자가 장난으로 처리했다. 이번 실험은 스토리보드가 있고 Haiku 교정이 뒤따르는 다른 조건이다 |
| round1 파일럿: 스토리보드(Opus) → 계획(Sonnet) → P(Sonnet) / H(Haiku 구성안별 샘플 → Sonnet 고르고 다듬기) | H 평균 $1.34, P $1.29로 비용이 같다. 다듬기 4건 중 3건이 계획의 추천안을 골랐다. 채점하지 않았다 | hypothesis: 계획이 정한 추천안이 고르는 단계를 좌우해, 샘플을 여러 개 만든 효과가 약하다 |
| 키워드 본보기(K) vs 본보기 없음(0), 10쌍, Sonnet | 0 8.2 > K 6.8. 0 > K 7쌍, 동점 1쌍, K > 0 2쌍. 대응 t ≈ 1.9(p ≈ 0.09) | hypothesis: 본보기는 체계성을 일부 돕지만 세련됨·창의성·표현력을 깎는다(사용자 관찰) |
| idf 가중 키워드 검색 | s04가 핵심 기법 대신 드문 장식 키워드(`맥박 원`)로 s49·s34를 뽑았다 | verified: 드문 키워드 가중이 검색을 끈다 |
| B 참고(본보기만)로 생성 | 계획 4개가 kit `steps`·`LTT.sweep` 대신 직접 만든 단계 단추를 허용했다 | verified: 본보기 2개에 해당 부품 문서가 없다. 이번 실험은 kit 문서를 주므로 해당 없음 |
| `pkill -f <패턴>`으로 감시 프로세스 정리 | 자기 셸이 exit 144로 죽었다(두 번) | verified: 명령줄에 패턴이 들어 있어 자기 자신이 걸린다. task id로 멈춘다 |

## Next Step

1. 아래 설계와 Open Questions의 기본값을 사용자에게 보여 주고 승인을 받는다.
2. 갈래 HH(본보기 없음 + Haiku 샘플 + Haiku 교정)를 shot 10개에 돌린다. 스토리보드는 `round-kw`의 것을 재사용한다.
   - 샘플: Haiku가 0과 같은 프롬프트(스토리보드 + kit 문서, 본보기 없음)로 서로 독립인 프로세스 N개에서 장면을 만든다. 각자 audit 최대 3회.
   - 녹화: `shots.mjs`로 샘플마다 기본 화면을 찍는다. 계획 단계가 없어 검사 지점은 없다.
   - 교정: 새 Haiku 프로세스가 스토리보드, 샘플 HTML, 스크린샷을 보고 하나를 골라 `cp`한 뒤 Edit로 고친다. 기준은 스토리보드(한 문장, 인과 사슬, 사실 점검표, 비트)와 화면 결함이다. audit 최대 3회.
3. 채점: shot마다 원본, 0(기준, 기존 장면), HH 3개 장면을 블라인드로 10점 만점. 사용자 노트를 받는다. 새 artifact를 만든다.
4. 비용은 단계별로 기록한다(샘플 합, 교정, 스토리보드는 0과 공통이라 제외 또는 양쪽에 같게 더한다).
5. 결과로 AGENTS.md "Generated Lesson Defects"에 따라 생성기(SKILL.md, kit 문서, audit) 수정 후보를 남긴다.

## Open Questions

- 샘플 수 N: 기본값은 3이다. round1 H는 구성안 수(4–5)였다.
- 고르는 주체: 기본값은 교정 Haiku가 직접 고른다. 대안은 Sonnet이 고르거나, 샘플마다 교정한 뒤 사용자가 고르는 것이다.
- 교정 입력에 스크린샷을 넣을지: 기본값은 넣는다(Haiku가 이미지를 읽는다). 비용이 크면 HTML과 audit 결과만 준다.
- 사전 기준: 기본값은 "HH 평균이 0보다 1점 이상 낮지 않고, 장면당 비용이 0의 절반 이하"다. 0의 장면당 비용은 평균 $0.37이다(스토리보드 제외).
- 교정 단계만의 효과를 볼지: 기본값은 보지 않는다. 보려면 교정 전 고른 샘플도 채점 장면에 넣는다(shot당 장면 4개).
- 0을 다시 뽑아 0의 편차를 볼지: 기본값은 보지 않는다(사용자가 다음 실험으로 넘어가기로 했다).

## Spec

없음. workflow-approach 작업이 아니라 실험이다.

## Execution Ledger

- 키워드 실험 10쌍 점수(사용자, 블라인드, 10점 만점):

  | shot | 원본 | K | 0 |
  | --- | --- | --- | --- |
  | s04 | 3 | 8 | 8 |
  | s07 | 7 | 7 | 10 |
  | s13 | 8 | 6 | 9 |
  | s16 | 2 | 7 | 10 |
  | s47 | 6 | 2 | 7 |
  | s14 | 9 | 5 | 7 |
  | s25 | 3 | 6 | 7 |
  | s30 | 7 | 10 | 7 |
  | s31 | 7 | 7 | 8 |
  | s49 | 4 | 10 | 9 |

- 비용 실측:
  - 0 장면 10개 합 $3.70(장면당 $0.26–0.59, 평균 $0.37). K 10개 합 $4.43.
  - Sonnet 스토리보드 $0.06–0.07, Opus 스토리보드 $0.39.
  - round1 Haiku 샘플(본보기 B 방식, 검사 지점 포함) $0.03–0.11.
  - `claude -p` 호출마다 시스템 프롬프트·도구·CLAUDE.md 약 4만 토큰을 1시간 캐시로 새로 쓴다. 실행 디렉터리마다 앞부분이 달라 프로세스끼리 캐시를 공유하지 못한다. 짧은 단계일수록 이 고정 비용 비중이 크다.
- 헤드리스 실행 조건: `r1.claude`가 `CLAUDE_CODE_SESSION_ID`, `CLAUDE_CODE_REMOTE_SESSION_ID`, `CLAUDE_CODE_CHILD_SESSION`을 지우고 `--strict-mcp-config --max-turns 60`, Read·Write·Edit·`Bash(node:*)`만 허용한다. 동시 실행 상한 `R1_PAR` 기본 8(4코어, 15GB에서 문제없었다).
- 환경 함정: Playwright는 `/opt/node22/lib/node_modules/playwright/index.mjs` 절대 경로로 import한다. 채점 artifact를 같은 `review/index.html` 경로로 다시 publish하면 이전 artifact를 덮어쓰므로 라운드마다 `review-<name>/`로 옮긴 뒤 publish한다.
