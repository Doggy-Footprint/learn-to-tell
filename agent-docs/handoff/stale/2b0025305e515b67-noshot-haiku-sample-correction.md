# 장면 생성 실험: HSH(Haiku 샘플 → Sonnet 방향·제작 → Haiku 검수)와 절제 갈래

## Goal

- "이 프로젝트의 가장 성공적인 결과물은 https://learn-to-tell.vercel.app/gallery/shots/index.html 에서 볼 수 있는 핵심 내용을 이해하기 쉽게 표현하는 diagram 예시들이야. 나는 저걸 더 저렴한 가격에 만드는 걸 목표로 여러 시도를 했고, 결과적으로 1. 외형은 괜찮으나 생성에 필요한 cost가 너무 크거나, 2. skill에서 제공하는 library가 너무 커져서 agent에게 학습의 대상 + 디버깅의 대상이 되거나 3. 외부 라이브러리를 쓰면 원하는 퀄리티가 나오지 않거나. 하는 등의 문제가 있어서 rollback 을 하게 됐어. 위와 같은 문제를 반복하지 않으면서 적당한 생성시간 + `gallery/shots/index.html` 수준의 결과물이야."
- 키워드 실험 채점 뒤(2026-10-25): "갤러리를 알고 있어서 오염이 좀 있을 수 있는데, 일단 무시해도 좋을 것 같아. 약간 특징이 있는데 - 세련됨 / 창의성 / 표현력이라 해야하나. 그런 부분에선 shot이 없는 게 나은 거 같고 infographic animation의 체계성 면에서는 shot이 일부 도움이 되는 거 같아."
- "그러면 넘어가서 no shot + haiku sample + haiku correction을 테스트하자. 이건 handoff로 만들고 다른 세션에서 진행할게"
- 이 세션에서 바꾼 설계(2026-10-25): "haiku를 이용해서 sample 4개를 만들고, sonnet이 그것들을 확인하고 (HTML) 표현하고자 하는 방향을 체크해서 만든다음, 새로운 haiku가 검수&수정을 해보는 거야. 각 단계 별로 기록을 남겨서 내가 볼 수 있게 해줘. 핵심은 infographic animation으로 정보를 정확하교 효율적이고 디테일하게 (AST의 경우 역으로 tree가 생성되는 등) 생성되는 거야. … 기존것 재활용하지 말고, gallery에도 없는 새로운 학습 목표 설정. ps. subagent는 모두 medium"
- "예산은 오버할거야. 예산 기준 높혀 놓고, 각각 3개 정도 뽑아보자." / "가격과 각각 단계의 기록도 잘 남겨놔"
- 밤사이: "사용량 제한 걸릴 때까지 필요한 다른 시험도 해놓을래? … 사용량 제한 걸리면 멈춰주고" / "좀 더 열심히 돌려도 될 것 같아. 그리고 3시가 되면 멈쳐줘"

## State

- 브랜치 `feat/sample-n-correct`(worktree `sample-correct`), 기준 커밋 `ee02264`. 커밋하지 않았다.
- 바뀐 파일(`experiments/scene-pipeline/`):
  - macOS 이식: `audit-pw.mjs`·`shots.mjs`·`record.mjs`의 playwright import를 `"playwright"`(같은 디렉터리 `node_modules/`, gitignore)로, `/home/user/learn-to-tell` 경로를 `Path(__file__).parents[2]`로(`kw.py`, `r1.py`, `mklive.py`, `mkprompt.py`, `cls.py`, `setup.py`).
  - `r1.py`: `plan.json` 없어도 import됨, `claude(..., effort=)`, `timeout` 명령 대신 subprocess timeout, 시도마다 `attempts.jsonl`(usage 포함), 실패 시도의 `stream.fail<n>.jsonl` 보존, 사용량 제한 문구 감지 시 `STOP` 파일 생성·이후 호출 거부, `shots()` 1회 재시도 후 실패를 기록하고 계속.
  - `audit.mjs`: 덱 순서 규칙 `overview-order`, `predict-new-term`도 거른다(장면 하나짜리 실험에서 지킬 수 없음). 01:13 이후 실행부터 적용, 그 전 장면의 final-audit에는 남아 있다.
  - `hsh.py`의 `done()`은 마지막 결과가 `is_error`가 아닐 때만 완료로 본다.
  - 새 파일: `hsh.py`(파이프라인과 절제 갈래, `--record`), `hsh-topics.json`(주제 6개 브리프), `mkhsh.py`·`hsh-view.tpl.html`(단계 기록 페이지), `mkhsh-score.py`(블라인드 채점 페이지), `judge.py`(Opus 채점관).
  - 기록: `round-hsh/<t>/<r>/<단계>/`(prompt.md, trace.md, attempts.jsonl, 산출물, final-audit.txt), `round-hsh/ledger.json`(단계별 비용·토큰·시간), `round-judge/*.json`(채점관 결과). 스트림 원본과 스크린샷은 `gallery/`(gitignore)에만 있다.
- 산출물:
  - 단계 기록 페이지: https://claude.ai/artifact/BcmjNWhGvP32GNCMn8b53z (`review-hsh/`). 썸네일은 반복별 `d/<t>-<r>.json`에 data URI로 들어 있다. 새 파일만 255개 이하로 나눠 publish한다.
  - 블라인드 채점 페이지(db에 `scores/<t>-<r>` 저장): https://claude.ai/artifact/495GEDWmuQdLPhKTBHvxF4 . 키는 `review-key-hsh.json`(gitignore, 채점 끝까지 열지 않는다). 갈래 6개(가–바): 0, 0R, 0RR2, S4, S4R2, HHH.
- 다시 세우는 법: `cd experiments/scene-pipeline && npm install --no-save --prefix . playwright@1.63.0`. 파이프라인은 `R1_PAR=8 python3 hsh.py t1 t2 …`(반복 1–3), 갈래는 `--ablate`(0R·HHH), `--ablate2`(샘플 2개), `--rereview`(2회차 검수), `--third`(0R 3회차 검수), `--hookbase`·`--hookfix`(hook 실험), `--docfix`(문서 수정본 + 검수 2회). 채점관 `judge.py kw|hsh|retest|second|third|fix`. 기록 `python3 hsh.py --record && python3 mkhsh.py`.

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
| macOS에서 `pgrep -f "python3 hsh.py"`로 실험 프로세스 찾기 | 일치 0건 | verified: macOS는 명령줄을 `.../Python.app/.../Python hsh.py`로 보인다. `"(hsh|judge)\.py( \|$)"`로 찾는다 |
| 녹화(`shots.mjs`)를 병렬 부하 중 1회만 시도 | 파일럿 샘플 a가 `t1s` 한 장만 남기고 index.json 없음, `json.load` 예외로 반복 전체가 멈출 뻔했다 | hypothesis: 동시 Chromium 부하. 단독 재실행은 성공. 지금은 1회 재시도 후 실패를 기록하고 계속한다 |
| 사용량 제한 뒤 재개 시 `done()`이 `subtype == "success"`만 보고 완료 판정 | 제한으로 실패한 검수 20개가 "끝"으로 찍히고 호출이 0건이었다 | verified: 제한 응답은 `subtype: success`, `is_error: true`로 온다. `done()`이 `is_error`도 본다 |
| 단계 기록 artifact에 썸네일을 파일로 추가 | `deploy 422: manifest exceeds 512 entries` | verified: artifact 한 버전은 파일 511개까지다. 썸네일을 반복별 JSON의 data URI로 옮겼다 |
| Opus 채점관(`judge.py`)을 사용자 점수 대용으로 쓰기 | 키워드 실험 30장면에서 사용자 점수와 Spearman 0.45, shot 안 0.39, 최고 일치 6/10. 채점관은 K 7.6 > 0 7.0으로 사용자(0 8.2 > K 6.8)와 반대 | hypothesis: 채점관은 정확성·빠짐없음·결함에 무게를 두고 세련됨·표현력을 덜 본다. 자기 재현성은 높다(같은 6그룹 재채점 Spearman 0.86, 평균 차 0.64점, 최고 일치 5/6). 보조 신호로만 쓴다 |
| HSH 결론을 Opus 채점관 점수로 내기 | 사용자 블라인드 채점 13묶음(t1–t5 r2) 평균: HHH 6.00, S4 5.46, S4R2 5.23, 0RR2 4.69, 0R 4.31, 0 4.15. 채점관 순서(S4R2 > S4 > 0RR2 > 0R > HHH ≈ 0)와 다르고, 공통 갈래 4개에서 Spearman 전체 0.39, 묶음 안 0.45 | hypothesis: 사용자는 움직임의 연속성·화면 흔들림·그림 크기·첫 화면 배치를 보고, 채점관은 정지 화면으로 이를 보지 못한다. 메모는 `round-judge/user-hsh.json` |

## Next Step

1. 사용자가 블라인드 채점 페이지에서 18회 × 6갈래를 채점한다(`scores/<t>-<r>`, 가–바). 끝나면 `ArtifactData list scores`로 읽고 `review-key-hsh.json`으로 풀어 갈래별 평균·대응 비교를 낸다. 채점관 결과(`round-judge/hsh.json`)와의 상관도 본다.
2. 사용자 점수로 결론을 낸다. 판단 기준 후보: S4R2($0.566)가 0RR2($0.296)보다 확실히 높으면 비용 1.9배를 감수할지, 아니면 0 + Haiku 검수 2회를 SKILL 흐름으로 옮길지. 문서 수정(0F) 효과도 함께 본다.
3. 아래 "생성기 수정 후보"를 AGENTS.md "Generated Lesson Defects"에 따라 kit 문서·audit에 반영할지 사용자에게 묻는다. 이 세션은 kit 원본을 고치지 않았다(실험용 복사본 `refs/API.md`만 hookfix에서 바꿨다).
4. 커밋 범위를 사용자와 정한다. `round-hsh/`는 스크린샷을 빼고 약 15MB, `round-judge/`는 1.8MB다.

## Open Questions

- 사용자 채점 결과가 채점관과 같은 방향(S4R2 > S4 ≈ 0RR2 > 0R > HHH ≈ 0)인가. 채점관은 검수가 고치는 결함에 민감해서 검수 효과를 부풀렸을 수 있다.
- 검수를 SKILL 흐름에 넣을 때, 검수자가 볼 스크린샷을 누가 찍는가(현재는 실험 스크립트가 `shots.mjs`로 찍어 넘긴다).
- hook 장면에서 `art`에 그림을 넣는 문제를 문서로 막을지, audit의 `small-visual` 면제를 좁혀 잡을지.

## Spec

없음. workflow-approach 작업이 아니라 실험이다.

## Execution Ledger

- 이전 키워드 실험 10쌍 점수(사용자, 블라인드, 10점 만점):

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

- HSH 설계(모든 호출 effort medium, 주제 6개 × 독립 반복 3회):
  - S1 스토리보드(Sonnet): 기존 항목에 "생성 순서"(메커니즘 안에서 대상이 실제로 생기는 순서)를 더했다.
  - S2 샘플 4개(Haiku, 서로 독립, 스토리보드 + kit 문서, 본보기 없음, audit ≤ 3). 장면 프롬프트에 "움직임은 스토리보드의 생성 순서를 따른다" 한 줄을 더했다(0도 같은 프롬프트).
  - S3(Sonnet): 샘플 HTML 4개를 읽고 `direction.md`(초안별 표현 의도·어긋남·가져올 것·최종 방향)를 쓴 뒤 장면을 새로 Write.
  - S4(새 Haiku): 스토리보드, direction.md, 장면, S3 스크린샷으로 `review.md` 점검표(사실 점검표·생성 순서·비트·화면 결함) → 실패 항목만 Edit.
  - 기준선 0: 같은 스토리보드로 Sonnet 단독.
  - 절제: 0R(0 + S4식 검수), HHH(S3를 Haiku가), S3-2(샘플 a·b만 보고 Sonnet), 2회차 검수(S4R2, 0RR2).
- 주제(`hsh-topics.json`): t1 B+tree 분할 전파(figure), t2 TCP 혼잡 제어(predict), t3 Raft(overview), t4 DNA 복제 분기점(hook), t5 신용 창조(sweep), t6 mark-and-sweep vs 참조 카운팅(contrast).
- 비용(반복당 평균, 18회, USD, 재시도 포함, 재시도는 0회):

  | 갈래 | 평균 | 범위 |
  | --- | --- | --- |
  | 0 | 0.235 | 0.155–0.477 |
  | 0R | 0.267 | 0.170–0.503 |
  | HHH | 0.239 | 0.176–0.421 |
  | S3-2 + 검수 | 0.408 | 0.326–0.547 |
  | S4(파이프라인) | 0.533 | 0.408–0.771 |

  단계별: 스토리보드 0.052(26초), 샘플 1개 0.026(156초), S3 0.345(109초), S4 0.030(137초), HHH의 Haiku 제작 0.049(171초), S3-2 0.268. 파이프라인 직렬 경로 약 7–10분. 생성 호출 합계 $21.26(재검수·hook 실험 제외), 채점관 kw $4.48, hsh $14.96, 재현성 $4.91.
- 채점관 점수(Opus medium, 반복마다 6갈래 블라인드 비교, 18회 평균): 0 5.28, S3 5.94, S4 7.00, 0R 6.11, HHH 5.72, S4-2 6.72. 대응 비교: S4−S3 +1.06(13승 4무 1패), S4−0 +1.72(14/1/3), 0R−0 +0.83(11/6/1), HHH−0 +0.44(9/2/7), HHH−S4 −1.28(2/5/11), S4-2−S4 −0.28(6/3/9).
- audit "고침"이 남은 장면: t3 전 갈래의 `overview-order`(오탐, 위 audit 수정), t2 샘플의 `predict-new-term`(오탐), t1 r3 샘플 b `graph-overlap` 등 샘플 15건, S3 2건, S4 1건.
- 생성기 수정 후보(채점관 근거와 코드로 확인):
  - hook에서 그림을 `art`에 넣으면 썸네일 크기가 된다. t4 장면 18개 중 7개가 `art`를 썼고 0·0R이 채점관 2점을 받았다(t4 r1). API.md hook 행이 `art`만 안내하고, `deck-contracts.md`는 hook을 `small-visual` 판정에서 뺀다. 갤러리 s30은 `mount`로 그린다. 실험: `--hookbase`(원본 API.md) vs `--hookfix`(hook 행에 "메커니즘 그림은 mount로" 추가), t4 × 3 스토리보드 × 2회.
  - predict `visual(el)`은 DOM에 붙기 전의 요소를 받는다. t2 r2 S3가 첫 프레임에서 `el.isConnected`를 보고 애니메이션을 멈춰 빈 그래프로 남았다(채점관 2점). kit 문서에 이 사실이 없고, audit은 빈 그래프를 못 잡는다.
  - contrast에서 그래프 SVG가 좁은 패널에 갇혀 글자를 읽을 수 없다(t6 여러 갈래). audit이 잡지 못한다.
  - 정적 장면이나 처음부터 완성된 그래프로 생성 순서가 드러나지 않는 장면이 남는다.
- 헤드리스 실행 조건: `r1.claude`가 세션 환경 변수 셋을 지우고 `--strict-mcp-config --max-turns 60`, 도구 Read·Write·Edit·`Bash(node:*)`(S3는 그대로, 검수도 같음). 이 맥(10코어, 17GB)에서 `claude -p` 동시 16–20개, 부하 7–13에서 문제없었다.
- 밤사이 정지 장치: 스크래치패드의 `stop3.sh`가 03:00에 `STOP`을 만들고 실험 python 프로세스와 그 자식만 끝낸다. 사용량 제한 문구가 보이면 `r1.claude`가 `STOP`을 만든다. 다시 돌리려면 `experiments/scene-pipeline/STOP`을 지운다.
- 01:26 사용량 제한("session limit · resets 2am")으로 `STOP`이 생기고 실험 프로세스를 끝냈다. 이 시점 상태:
  - 완료: 0RR2 vs S4R2 비교를 위한 2회차 검수(S4R2, 0RR2) 18회와 그 채점관 결과(`round-judge/second.json`): S4R2−S4 +0.83(12/6/0), 0RR2−0R +0.67(11/6/1), 0RR2−S4 +0.28(9/1/8). 2회차 검수 비용 반복당 $0.03.
  - 완료: hook 문서 실험. 원본 API.md에서 `art` 사용 6/9, hook 행 수정본 0/6(피셔 p ≈ 0.017).
  - 07:06에 재개해 07:29에 모두 끝냈다(아래).
  - 블라인드 채점 페이지는 6갈래(0, 0R, 0RR2, S4, S4R2, HHH)로 다시 publish했다. 키는 새로 만들었다(채점 0건일 때).
- 마무리(07:06–07:29, 실패 0건):
  - 3회차 검수(`judge.py third`, 18그룹): 0RR3−0RR2 +0.50(9/9/0), 0RR2−S4R2 −1.22(4/1/13), 0RR3−S4R2 −0.72(5/1/12). 검수는 3회차까지 점수를 깎은 적이 없고 효과는 줄어든다.
  - 문서 수정본(`judge.py fix`, 18그룹, 실험용 API.md 복사본에 hook 행과 시각 칸 함수 문장 두 줄): 0F−0 +1.11(10/2/6), 0FRR2−0RR2 +0.89(9/1/8), 0FRR2−0 +2.28(14/4/0), 0RR2−0 +1.39(16/1/1). t4 0F 3개 모두 `mount`.
  - 반복당 비용: S4 0.533, S4R2 0.566, 0 0.235, 0R 0.267, 0RR2 0.296, 0RR3 0.331, 0F + 검수 2회 0.327, HHH 0.239, S3-2 + 검수 0.408.
  - 전체 비용: 생성·검수 $32.22, 채점관 $56.62, 합계 $88.84.

## 종료 (2026-10-26)

- 사용자가 블라인드 채점을 t5 r2까지(13묶음, t2-r1은 평가 불가) 하고 멈췄다: "나 이거 힘드렄ㅋㅋㅋㅋ 이거 t5 까지만 하고, LLM-as-a-judge 만들자."
- 사용자 점수와 메모는 `experiments/scene-pipeline/round-judge/user-hsh.json`(갈래 키 풀림)에 있다.
- 사용자 점수로 보면 이 실험의 채점관 기준 결론(S4R2 최선, 검수 효과 큼)은 성립하지 않는다. 검수 효과는 작고(0R − 0 +0.15, 0RR2 − 0 +0.54), HHH가 가장 높다.
- 생성기 수정 후보와 커밋되지 않은 결정은 후속 handoff `agent-docs/handoff/8712abeff5bd7bee-user-perspective-llm-judge.md`로 넘겼다.
