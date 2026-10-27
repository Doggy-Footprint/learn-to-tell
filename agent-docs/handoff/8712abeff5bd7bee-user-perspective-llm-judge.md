---
commit: 1b84f047ecdc810bd8f0cd7663b809cf680e832b
---

# 장면 평가 LLM-as-a-judge 만들기 (사용자 선호 배제, 외부 기준 기반 체크리스트)

## Goal

- "나 이거 힘드렄ㅋㅋㅋㅋ 이거 t5 까지만 하고, LLM-as-a-judge 만들자. (내 관점에서 평가할 수 있는) 지금 있는 걸로 억지로 만들려고 하지 말고, 제대로 LLM-as-judge만들어 보자. 일단 지금까지 한 거 커밋하고 다음 세션에서 이어갈 수 있도록 handoff 넘겨줘." (2026-10-26)
- 사용자가 앞서 밝힌 평가 관점:
  - "핵심은 infographic animation으로 정보를 정확하교 효율적이고 디테일하게 (AST의 경우 역으로 tree가 생성되는 등) 생성되는 거야."
  - "세련됨 / 창의성 / 표현력이라 해야하나. 그런 부분에선 shot이 없는 게 나은 거 같고 infographic animation의 체계성 면에서는 shot이 일부 도움이 되는 거 같아."
- 2026-10-26 세션(브랜치 `feat/llm-judge`)에서 바뀐 방향:
  - "기존 시험 및 채점 결과는 모두 \"참고\" 수준으로 낮추고 지금부터 제대로 평가를 진행한다."
  - "지금 나온 것들은 겹치는 게 많아서 새로 생성해서 쓰는 걸로 하자."
  - "나의 선호는 배제한다. 대신 infographic animation에서 평가할 수 있는 대상을 list-up한 다음 각각을 어떻게 평가할 수 있을지 구체적인 계획으로 들어간다."
  - "목표는 전문가가 없는 상황에서 LLM as expert Judge를 알려져 있는 평가 기준을 통해 보완하는 거야. 즉 \"LLM에게 니가 보기엔 어떠니?\"가 아니라 \"LLM아 infographic animation을 평가하는 기준표를 작성해줘.\" \"LLM아 이 기준표에 부족한 걸 보충해줘.\" \"LLM아 이 기준표에서 과도한 부분은 어디라 생각해\" 등의 과정을 거쳐 지식을 추출해 낸 다음 그걸 기준표로 사용. + 다양한 회사의 모델을 엮기 + 외부 루브릭, 평가표를 최대한 구해봄 -> 체크리스트를 만들어서 그걸로 평가."
  - "나의 선호를 배제하는 건 나도 딱히 UIUX, design 전문가가 아니기 때문이지."
  - 가중치: "최대한 외부 전문가 자료를 이용하고, 안 될 경우 여러 LLM 합의를 이용한다."
  - golden set: "각각 다른 주제, 스토리 보드로 하는 골든셋을 구성한다."

## State

- 브랜치 `feat/sample-n-correct`(worktree `sample-correct`). 이 handoff와 같은 커밋에 HSH 실험 전체(코드, `round-hsh/`, `round-judge/`)가 들어 있다.
- 2026-10-26 이후 작업 브랜치는 `feat/llm-judge`. 아래 재료(사용자 점수, 기존 채점관 결과, 기존 장면)는 사용자 결정에 따라 "참고" 수준이다. 새 judge의 검증 근거로 쓰지 않는다.
- 외부 검토(프로젝트를 읽지 않은 Opus high subagent, brief만 받음)의 판정: "개발자 관점 judge" 전제와 "개발자 선호를 지표로 쓰기" 전제 모두 조건부 통과. 지적: 기존 채점관의 불일치는 "관점 차이"와 "정지 화면이라 볼 수 없었음"이 갈리지 않는다(사용자 채점 페이지 `review-score.tpl.html`은 장면을 iframe으로 재생, 기존 채점관은 정지 스크린샷). 갈래별 사용자 평균의 표준오차는 약 0.65(갈래당 13장면, 표준편차 2.2–2.5).
- 1단계(조사) 원문 인용 수집 결과는 `experiments/rubric-sources/`에 있다. 저장소에는 커밋하지 않았다.
  - 비공개(secret) gist에 올렸다: https://gist.github.com/Doggy-Footprint/201fc70da1b36648db9f05e573e6cd4b
  - gist는 디렉터리를 담지 못해서 경로 `a/b/c`를 파일명 `a__b__c`로 저장했다
  - 복원: `git clone https://gist.github.com/201fc70da1b36648db9f05e573e6cd4b.git g && cd g && sh restore.sh <저장소>/experiments/rubric-sources`
  - 2026-10-26에 복원본이 로컬과 같음을 `diff -rq`로 확인했다(원본과 전문 텍스트 제외)
  - `sources.tsv`: 출처 43개와 종류
  - `quotes.jsonl`: 인용 3,764개, 원문 대조 통과 3,718개(`verified`)
  - `verified-quotes.md`: 통과 인용과 `[출처#번호]`
  - `sources/<id>/`: `url`, `quotes.md`, `verify.txt`. 원본(`raw.*`)과 전문 텍스트(`text.txt`)는 저작권 때문에 `.gitignore`로 제외했다. `tools/fetch.sh`로 다시 받는다
  - `candidates/`: 웹 검색 요약에서 나온 후보 목록. 숫자와 문구는 검증되지 않았다
- 수집 방법:
  - 웹 페이지: WebFetch로 원문 그대로 인용
  - PDF: WebFetch가 읽지 못해서(바이너리 전달, 10MB 제한) pdftotext로 텍스트를 만들고 출처별 sonnet subagent가 인용했다
  - 모든 인용은 `tools/verify.py`로 원문 텍스트와 문자열 대조
  - 확인 방법: `python3 -I experiments/rubric-sources/tools/verify.py <id>`
- 채점관을 만들 재료(모두 커밋됨):

  | 재료 | 경로 | 내용 |
  | --- | --- | --- |
  | HSH 사용자 점수 | `experiments/scene-pipeline/round-judge/user-hsh.json` | 13묶음 × 6장면 = 78장면의 1–10점과 장면별 메모. 갈래 키는 이미 풀려 있다. t2-r1은 "평가 불가"(묶음 메모만), t5-r3·t6은 채점하지 않았다 |
  | HSH 장면 | `experiments/scene-pipeline/round-hsh/<t>/<r>/<단계>/scene.html` | 갈래 → 단계: 0=`zero`, 0R=`zero-review`, 0RR2=`zero-review-2nd`, S4=`review`, S4R2=`review-2nd`, HHH=`hreview`. 각 단계에 `storyboard.md`가 있다 |
  | 키워드 실험 사용자 점수 | `experiments/scene-pipeline/round-kw/db/scores/`, `round-kw/db2/scores/` | 10묶음 × 3장면(orig, K, 0). 키는 `round-kw/review-key-kw.json` |
  | 기존 Opus 채점관 결과 | `experiments/scene-pipeline/round-judge/*.json`, `round-judge/groups/` | 비교 기준선. 결과는 Failed Attempts 참고 |
  | 실험 보고서 | https://claude.ai/artifact/7Wfj5h2EnjjdTZ9NN9SmMc | HSH 실험의 채점관 기준 결과(사용자 점수가 나오기 전에 썼다) |

- 사용자 점수의 갈래별 평균(채점한 13묶음): HHH 6.00, S4 5.46, S4R2 5.23, 0RR2 4.69, 0R 4.31, 0 4.15. 채점관 순서(S4R2 > S4 > 0RR2 > 0R > HHH ≈ 0)와 다르다. 특히 HHH가 사용자에게는 1위다.
- 장면별 메모에서 읽은 사용자 기준(메모 원문은 `user-hsh.json`):
  - 움직임의 연속성. "끊어져 보여서 이해가 어려움", "연속적이지 않고 투박", "이동하는 게 잘 보여서 이해하기 쉬움"(9점)
  - 무엇이 왜 움직이는지 보여야 한다. "어떻게 움직이는지 정보 없이 나타나서", "처음 86 삽입이 명시적으로 보이는 게 좋았음", "어떻게 분할이 시작되는지에 대한 게 없어서"
  - 화면 안정성. "프레임이 흔들린다"(여러 장면 4점 이하)
  - 그림 크기와 첫 화면 배치. "보이지 않을 정도로 작고, 설명은 과하게 큼", "스크롤을 해서 내려야 보이는 문제", "이미 끝나 있음"
  - 맥락 없는 개념 금지. "page 개념은 갑자기 왜 나오는 지 모르겠음"
  - 속도·조작. "좀 빨라서 보기 어려움 … stepper가 더 나았을 것", "설명(글)은 너무 빠르고 탬포는 너무 느림", "지급 준비율을 바꾸면 다시 진행이 되어야 함"
  - 비교 가능성·직관성. "지급 준비율 별 비교가 어려움", "돈의 크기가 직관적이지 않음"
  - 애니메이션이 없으면 최하점(1–2점)
- 지금 채점관(`judge.py`)은 정지 스크린샷과 장면 코드만 본다. 사용자가 깎은 이유의 대부분(연속성, 흔들림, 속도, 스크롤해야 보임, 이미 끝나 있음)은 시간에 따라 봐야 드러난다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| Opus 채점관(`judge.py`, 묶음 비교 1–10점, 정지 스크린샷 + 장면 HTML, 정확성·생성 순서 기준)을 사용자 대용으로 쓰기 | 키워드 실험: 사용자와 Spearman 0.45(묶음 안 0.39), 최고 일치 6/10. HSH 13묶음 중 공통 갈래 4개(0, 0R, S4, HHH): 전체 0.39, 묶음 안 평균 0.45. 갈래 순위가 사용자와 다르다(HHH 사용자 1위, 채점관 하위) | hypothesis: 채점관은 빠짐없음·사실 정확성에 무게를 두고, 사용자가 보는 움직임의 연속성·안정성·크기·첫 화면 배치는 정지 화면으로 보지 못한다. 자기 재현성은 높다(재채점 0.86) |
| 사용자에게 18묶음 × 6장면 블라인드 채점을 맡기기 | t1–t5 r2까지 13묶음 채점 후 중단("나 이거 힘드렄") | verified: 묶음당 6장면 × 18묶음은 사람에게 부담이 너무 크다. 다음 채점 묶음은 더 작아야 한다 |
| 조사 subagent가 WebSearch 요약으로 평가표 항목과 기준값을 모으기(`candidates/*.md`) | 사용자 지적: WebSearch는 여러 URL의 내용을 한 요약으로 합쳐 돌려주므로, 숫자가 어느 출처에서 왔는지 섞인다 | hypothesis: WebFetch도 작은 모델의 요약을 거친다. 그래서 원문 그대로 인용하고 원문 텍스트와 문자열 대조하는 방식으로 바꿨다 |
| PDF 출처를 WebFetch로 읽기 | 16개 PDF 모두 실패: 바이너리가 그대로 전달되어 추출 모델이 텍스트를 보지 못함, 또는 `maxContentLength size of 10485760 exceeded`. Tversky 2002는 SSL 인증서 오류 | verified: WebFetch는 PDF 본문을 텍스트로 바꾸지 않는다 |
| 비판 반영을 "비판 모델 2개 이상 같은 방향"으로 판정(`tools/revise.py`, sonnet) | 정성 판정으로 바뀐 기준값 17개 중 7개가 OpenAI 두 모델(sol, astra)의 지적만으로 바뀜. measure data+llm 37 → 47 | verified: 같은 회사 두 모델이 두 표로 셈해졌다. 사용자는 이후 다회사 합의를 구성 원칙에서 뺐다 |
| 문헌 인용에서 LLM(sonnet)이 이진 항목을 먼저 만들고, 사용자 충실도 판정과 LLM 판정자의 일치로 나머지 출처 판정을 맡기기(trial, 2회) | 1차: 사용자 충실 13/30(43%), 판정자 kappa 0.36–0.48. 프롬프트 수정 뒤 2차(출처 6개, 60개, 한국어 지문): 사용자 같다 29/60(48%), 판정자 6개의 kappa 0.11–0.22, 1차와 겹치지 않은 47개에서 0.05–0.18 | hypothesis: 번역 모델이 인용 일부를 빼거나 조건을 넓힌다. 판정자는 사용자보다 너그럽고, 사용자와 모델의 "같다" 정의가 다르다(누락 포함 여부). 정의를 맞춘 재측정은 하지 않았다 |

## Next Step

### 인용 데이터 품질 확인 (사용자 요청, 2026-10-26)

`quotes.jsonl`의 통과 인용 3,718개는 원문에 글자 그대로 있다는 것만 검증되어 있다. 빠짐없이 뽑았는지, 관련 있는 것만 뽑았는지, 맥락이 맞는지는 측정되지 않았다. 그래서 아래 1–3을 측정한다. 같은 날 계산한 현황(`verified`만):
- 40자 미만 258개
- 숫자 위주 116개
- 완전히 같은 인용의 추가 사본 27개
- 같은 출처의 다른 인용에 포함된 것 17개
- 다른 연구를 인용한 문장으로 보이는 것 약 105개(정규식으로 어림)
- 출처별 인용 수 상위: `learnlm2024` 197, `bbc-subtitles` 170

**1. 빠짐없음: Gemini로 같은 출처를 한 번 더 추출하고 겹침을 본다**
- 대상 출처(제안):
  - `lori2007`: 전문가 평가표
  - `heer2007`: 모션 실험
  - `berney2016`: 메타분석. 부록을 훑어봤다고 agent가 보고
  - `bbc-subtitles`: 일부 구간은 키워드 검색만 했다고 agent가 보고
- Gemini를 쓰는 경로는 두 가지다.
  - **API 키(`.env`의 `GEMINI_API_KEY`):** `tools/ask.py gemini gemini-4-argon <prompt> <out> <max_tokens>`. 사용량은 API로 과금되며, 사용자 구독과 별개다.
  - **사용자의 Gemini Pro 구독, Antigravity CLI(`agy`):** 2026-10-26에 확인했다.
    - Google은 2026-06-18에 Gemini CLI를 Antigravity CLI로 교체했다(https://geminicli.com/docs/resources/quota-and-pricing/ 상단 공지). 설치된 `gemini` 0.1.9는 쓰지 않았다. 구글 계정 로그인이 끝났다는 주장은 제3자 글(dev.to)뿐이라 공식으로 확인하지 못했다.
    - `/Users/hwansu/.local/bin/agy` 1.4.7은 `~/.gemini/antigravity-cli/`의 로그인 토큰으로 API 키 없이 동작한다. `agy models`: `gemini-4-argon-{low,medium,high}`, `gemini-3.8-flash-{low,medium,high}`, `claude-opus-5-5-*`, `claude-sonnet-5-5-*`, `gpt-oss-120b-medium`.
    - 호출: `agy -p "<프롬프트 전문>" --model <모델> --output-format json --print-timeout 900s`. stdin은 프롬프트에 합쳐지지 않는다(시험: "stdin 내용이 없다"는 응답). 68KB `text.txt`를 인자로 넣는 방식은 통했다. 응답은 JSON의 `response`, `usage`, `duration_seconds`.
    - 할당량: 사용자 보고로 argon 호출 1회(약 35k 토큰)가 주간 사용량의 약 1%를 썼다. argon 주간 사용량과 gemini-3.8-flash 주간 사용량은 따로 계산된다. `agy`는 남은 할당량을 출력하지 않는다. 그래서 argon은 중요한 출처에, flash는 나머지 출처에 쓴다.
    - `claude-*`·`gpt-oss` 모델이 같은 구독 한도에서 차감되는지는 확인하지 않았다.
  - 어느 경로든 결과는 같은 형식(`- "<원문>" — <위치>`)으로 저장하고 `tools/verify.py`로 원문 대조를 먼저 한다.
- 파일럿 도구(`experiments/rubric-sources/tools/`, 2026-10-26):
  - `agy-extract.py <id> <tag> <agy-model>`: `extract-agy-brief.md`(기존 규칙 + 표 규칙) + 기존 `quotes.md` 머리의 FOCUS + `text.txt` 전문 → `sources/<id>/quotes-<tag>.md`. 토큰·시간은 `sources/<id>/agy-usage.jsonl`에 쌓인다.
  - `verify.py <id>:quotes-<tag>.md`: 지정 파일을 대조해 `verify-<tag>.txt`를 쓴다. 인자 없이 `<id>`만 주면 기존 동작과 같다(`lori2007` 108/108 재확인).
  - `overlap.py <id> <tag>... [--write]`: 기준 `quotes.md`("base")와 각 `quotes-<tag>.md`의 원문 위치 겹침(인용 글자의 50% 이상이 상대 인용 구간 안). `--write`는 base에 안 덮인 검증 통과 인용을 `quotes-extra.jsonl`에 `quotes.jsonl`과 같은 필드로 추가한다. `qid`는 null, `extractor` 필드가 더 있다. `quotes.jsonl`은 건드리지 않는다. 합치기 전에 인용을 읽고 고른다.
- 파일럿 결과(`lori2007`, FOCUS는 기존과 같음, 모델 medium 기본):

  | 추출기 | 줄 | 원문 일치 | base 중 못 덮음 | base에 없는 것 | 토큰 | 시간 |
  | --- | --- | --- | --- | --- | --- | --- |
  | base(sonnet) | 108 | 108 | - | - | - | - |
  | argon, 첫 브리프 | 85 | 84 | 30/108 | 9 | 35,169 | 44s |
  | flash, 첫 브리프 | 34 | 25 | 63/108 | 2 | 36,371 | 33s |
  | argon, 표 규칙 추가 | 66 | 65 | 21/108 | 13 | 35,958 | 53s |
  | flash medium, 표 규칙 추가 | 75 | 75 | 44/108 | 6 | 38,774 | 46s |
  | flash high, 표 규칙 추가 | 99 | 99 | 34/108 | 17 | 55,328 | 131s |

  - flash 첫 브리프의 원문 불일치 9개는 표 행의 셀 사이에 ` | `와 제목을 끼워 넣은 것이다(유사도 0.76–0.91). 브리프에 "셀마다 따로 인용, 구분자·라벨 금지"를 넣자 flash의 불일치가 0이 됐다. argon의 불일치 1개는 그대로다.
  - argon과 flash high의 합집합이 못 덮은 base 인용은 19/108이다. 즉 Gemini는 sonnet을 대체하지 못하고 보완한다.
  - base에 없던 Gemini 인용 24개(`quotes-extra.jsonl`)를 읽었다. 대부분 서론·프레이밍(다른 연구 인용 포함)이다. 기준표에 쓸 만한 것은 presentation design 정의, "웹 페이지 로딩 최대 허용 지연 10초", interaction usability 설명 등 소수다.
  - 다른 출처에서도 같은 경향이 나오는지는 확인하지 않았다.
- 실행 순서 1번 결과(파일 시각 2026-10-26 19:06–19:15, `--write` 안 함)와 `berney2016` argon 추가 실행(다음 세션). `overlap.py`로 다시 계산했다:

  | 출처 | 추출기 | 원문 일치 | base 중 못 덮음 | base에 없는 것 | 토큰 | 시간 |
  | --- | --- | --- | --- | --- | --- | --- |
  | `heer2007` | flash high | 165/165 | 13/96 | 39 | 61,742 | 190s |
  | `berney2016` | flash high | 75/81 | 54/123 | 17 | 78,779 | 187s |
  | `berney2016` | argon medium | 203/234 | 56/123 | 108 | 56,224 | 89s |
  | `berney2016` | flash high ∪ argon | - | 39/123 | - | - | - |
  | `bbc-subtitles` | flash high | 103/103 | 106/170 | 39 | 93,107 | 214s |
  | `bbc-subtitles` | argon medium | 201/202 | 35/170 | 94 | 68,213 | 113s |

  - `berney2016` argon 불일치 31개 중 27개는 표 신뢰구간 조각(`[0.148; 0.921]` 등)이다. `text.txt`에서 마이너스 기호가 제어문자 `0x02`로 들어 있고(`[\x020.148; 0.921]`), argon은 그 문자를 빼서 음수 하한의 부호를 잃었다. `0x02`는 전 출처 중 `berney2016/text.txt`에만 84개 있고 base `quotes.md`에는 없다. 확인: `LC_ALL=C grep -c $'\x02' sources/*/text.txt`
  - 나머지 불일치는 저자명 오타("Schnotch"), pdftotext 깨진 글자("H€ ofﬂer")가 든 문장의 재구성이다.
  - 사용자 결정(2026-10-26): `agy`는 남은 사용량을 볼 수 없으므로 문턱 대신 출처 중요도 순으로 돌린다.
    - 1순위(애니메이션 학습 효과를 직접 다룬 연구), argon: `ploetzner2021`, `tversky2002`, `spanjers2010`, `dekoning2009`, `chang-ungar1993`, `dragicevic2011`
    - 2순위(생성 교육 자료 benchmark): `theoremexplain2025`, `code2video2025`, `eduvisbench2025`, `learnlm2024`
    - 3순위: 나머지 시각·텍스트 타이밍 연구, 짧은 웹 가이드(분량이 짧아 누락 위험이 낮다고 보고 뒤로 뺐다)
    - 모델 선택 근거: `berney2016`·`bbc-subtitles`에서 argon medium이 flash high보다 빨랐고(89–113s 대 187–214s) 토큰이 적었다. 주간 사용량 비율은 비교하지 못했다.
  - 사용자 결정(2026-10-26): 새 인용을 손으로 읽고 고르는 단계는 뺀다. 이유는 main context 소모(새 인용 약 300개 ≈ 1–2만 토큰, 43개 출처로 늘면 더 큼). 원문 대조를 통과한 새 인용은 전부 `quotes-extra.jsonl`에 넣고, 거르기는 아래 2(관련성)·3(맥락 꼬리표)에 맡긴다. 기존 `quotes.jsonl`도 손으로 고르지 않았다.
  - `overlap.py --write` 변경: 이전에는 글자가 완전히 같은 인용만 중복으로 걸렀다. 이제 인자 순서대로 태그를 돌며, base와 이번 실행에서 이미 쓴 인용의 위치 구간에 50% 이상 덮이는 인용은 건너뛴다. 그래서 더 많이 뽑은 추출기를 앞에 둔다(`overlap.py <id> argon flash-high --write`).
  - `quotes-extra.jsonl`에 쌓인 줄(2026-10-26): `lori2007` 24(변경 전 방식), `heer2007` flash-high 39, `berney2016` argon 93 + flash-high 11, `bbc-subtitles` argon 92 + flash-high 15. 쓰기 전 사본은 세션 scratchpad에만 있었다. 출처당 한 번만 `--write`한다는 규칙은 그대로다.
  - 1순위 6개 argon medium 결과(2026-10-26 19:27–19:34, 전부 `--write` 완료):

    | 출처 | 원문 일치 | base 중 못 덮음 | base에 없는 것 | `--write`로 쌓인 줄 | 토큰 | 시간 |
    | --- | --- | --- | --- | --- | --- | --- |
    | `ploetzner2021` | 87/88 | 33/92 | 33 | 32 | 33,418 | 48s |
    | `tversky2002` | 53/53 | 26/103 | 5 | 5 | 31,712 | 41s |
    | `spanjers2010` | 56/56 | 9/90 | 19 | 19 | 31,408 | 56s |
    | `dekoning2009` | 200/205 | 43/125 | 124 | 71 | 51,023 | 101s |
    | `chang-ungar1993` | 78/85 | 15/96 | 46 | 46 | 32,342 | 90s |
    | `dragicevic2011` | 69/75 | 17/79 | 30 | 30 | 33,431 | 69s |

    - `dekoning2009`는 base에 없는 124개 중 53개가 argon 자기 인용끼리 위치가 겹쳐 빠졌다.
    - 불일치 19개는 문장 재구성(유사도 0.28–0.99)이다. `chang-ungar1993` 7개는 유사도 0.51–0.72로 여러 문장을 이어 붙이거나 바꿔 쓴 것으로 보인다.
    - `quotes-extra.jsonl` 합계 477줄.
  - zsh에서 `"$id:quotes-argon.md"`처럼 쓰면 `:q`가 변수 수식자로 해석되어 `<id>uotes-argon.md`가 된다. 반복문에서는 `"${id}:quotes-argon.md"`로 쓴다.
  - 이 세션 `agy` 호출: argon medium 7회(`berney2016` + 1순위 6개). 사용자는 `agy`의 사용량을 추적할 방법을 모른다.
  - 사용자 보고(2026-10-26, 위 7회 뒤): argon 주간 사용량 약 10%. 같은 날 `agy` argon 호출은 모두 11회(`lori2007` 3, `bbc-subtitles` 1, 이 세션 7)이므로 호출당 약 0.9%로 어림된다. 사용자 판단: 2순위도 argon으로 돌린다.
  - 2순위 4개 argon medium 결과(2026-10-26 19:39–19:44, 전부 `--write` 완료):

    | 출처 | 원문 일치 | base 중 못 덮음 | base에 없는 것 | `--write`로 쌓인 줄 | 토큰 | 시간 |
    | --- | --- | --- | --- | --- | --- | --- |
    | `theoremexplain2025` | 112/114 | 24/80 | 29 | 25 | 38,870 | 70s |
    | `code2video2025` | 235/241 | 37/152 | 134 | 114 | 50,386 | 97s |
    | `eduvisbench2025` | 62/70 | 25/87 | 4 | 4 | 33,736 | 46s |
    | `learnlm2024` | 104/107 | 121/197 | 36 | 36 | 67,009 | 66s |

    - 불일치 19개는 문장 재구성이다(유사도 0.69–1.00).
    - `learnlm2024`는 base 197개 중 121개를 argon이 덮지 못했다. base가 이 출처에서 인용을 가장 많이 뽑은 출처라는 점과 함께 본다.
    - `quotes-extra.jsonl` 합계 656줄. 이 세션 argon 호출은 모두 11회.
  - gist 갱신: 세션 scratchpad의 gist 클론에 두 번 커밋했다(새 파일, `verify.py`·`overlap.py` 변경, `quotes-extra.jsonl`). push는 Claude Code 권한 분류기가 "Public Data-Sharing Upload"로 거부해서, 사용자가 `git -C <클론> -c credential.helper='!gh auth git-credential' push`로 직접 올렸다(gist `877f501`). 확인: gist의 `quotes-extra.jsonl` 줄 수가 656인지 본다.
  - **다음 세션 실행 순서(사용자 동의, 2026-10-26):** 모델 배분은 "기본 flash high, 중요하거나 겹침이 낮은 출처만 argon"이다.
    1. `heer2007`, `berney2016`, `bbc-subtitles` 각각 `python3 -I tools/agy-extract.py <id> flash-high gemini-3.8-flash-high` → `python3 -I tools/verify.py <id>:quotes-flash-high.md`. 명령은 `experiments/rubric-sources` 디렉터리에서 실행한다.
    2. 출처마다 `python3 -I tools/overlap.py <id> flash-high`로 base에 안 덮인 비율을 본다. 비율이 높거나 그 출처가 기준표에서 중요하면 `agy-extract.py <id> argon gemini-4-argon-medium`을 추가한다. 중요도 기준과 "높음"의 문턱은 정해지지 않았으니 결과를 보고 사용자와 정한다.
    3. 전 출처를 같은 방식으로 돌릴지는 1·2 결과를 본 뒤 정한다. 한 호출은 입력 약 30k 토큰이고 사용자 보고 기준 argon은 한 호출에 주간 사용량의 약 1%다. flash의 주간 사용량 비율은 아직 모른다. 첫 flash 호출 뒤 사용자에게 소모율을 물어 기록한다.
    4. (위 사용자 결정으로 "읽고 고르기"는 빠졌다.) 확인한 인용을 읽고 고른 뒤 `--write`로 `quotes-extra.jsonl`에 쌓는다. 같은 출처를 두 번 `--write`하면 중복 줄이 쌓이니 출처당 한 번만 실행한다(`lori2007` 24줄은 이미 쌓였다). `quotes.jsonl`에 합치는 스크립트는 아직 없다.
    5. 이 세션에서 `agy-extract.py`가 표 규칙으로 flash 불일치를 없앴으므로, 새 출처에서 불일치가 다시 나오면 `verify-<태그>.txt`의 MISS 줄 형식부터 본다.
  - 같은 `lori2007`에서 sonnet 재추출과 Gemini의 차이(실행마다 달라지는 정도)는 재지 않았다. 위 "못 덮음" 수치에는 추출기 간 차이와 실행 간 변동이 섞여 있다.
- 겹침 계산:
  - 두 추출기의 통과 인용을 정규화된 `text.txt` 안의 위치 구간으로 바꾼다.
  - 한쪽 인용 중 다른 쪽 구간과 겹치는 비율을 양방향으로 계산한다.
  - Gemini 인용 중 sonnet 구간과 겹치지 않는 것이 sonnet이 놓친 것의 추정치다. 그 내용을 읽어 중요한 누락인지 본다. (`overlap.py`로 구현됨. 아래 파일럿 결과 참고)

**2. 관련성: haiku가 표본을 판정한다**
- 표본: `verified` 인용에서 `kind`별로 층화한 무작위 100개. 표본 seed를 기록한다.
- haiku 판정 질문: "이 인용이 infographic animation 수업 장면의 평가 기준·기준값·적용 조건·의존 관계 중 하나의 근거로 쓰일 수 있는가".
  - 답: `yes` / `partial` / `no`, 그리고 한 줄 이유
  - 입력: 인용, 출처 제목, `kind`
- haiku 판정 자체의 신뢰도는 20개를 사용자나 다른 모델이 다시 판정해 일치율로 확인한다. 누가 할지는 미정이다.
- 결과: `kind`별 `yes` 비율. 기준표 근거로 쓸 인용을 거를지 정하는 데 쓴다.
- 실행(2026-10-26, Gemini 재추출을 2순위까지 하고 3순위는 미룬 뒤. 사용자 선택):
  - 도구: `tools/relevance.py`. `sample <seed> <n_base> <n_extra>` → `relevance/sample.jsonl`, `sample-meta.json`. `judge <model>`은 `claude -p`(도구 없음, 1 turn)를 10개 묶음으로 부르고 → `relevance/<model>.jsonl`. 프롬프트 원문은 스크립트의 `PROMPT`.
  - 표본: seed 20261026. 기존 `quotes.jsonl` 통과 인용 50 + `quotes-extra.jsonl` 50. 각각 `kind`마다 같은 수, 나머지는 큰 `kind`에 하나씩 더(base 8종 6–7개, extra 7종 7–8개). handoff의 "kind별 층화 100개"에서 base/extra 비교를 더하려고 반씩 나눴다.
  - haiku(`claude-haiku-5-5`) 결과, `claude -p` 보고 비용 $0.0157:

    | 묶음 | n | yes | partial | no | yes 비율 |
    | --- | --- | --- | --- | --- | --- |
    | base | 50 | 20 | 16 | 14 | 40% |
    | extra | 50 | 13 | 18 | 19 | 26% |
    | standard | 6 | 4 | 1 | 1 | 67% |
    | expert-rubric | 13 | 7 | 2 | 4 | 54% |
    | principles | 13 | 6 | 6 | 1 | 46% |
    | review | 14 | 6 | 2 | 6 | 43% |
    | style-guide | 13 | 3 | 7 | 3 | 23% |
    | benchmark | 15 | 3 | 4 | 8 | 20% |
    | experiment | 13 | 2 | 8 | 3 | 15% |
    | meta-analysis | 13 | 2 | 4 | 7 | 15% |

  - `kind`별 n이 6–15라 비율 차이는 거칠다. haiku는 이유를 한국어로 썼다.
  - 관찰: `heer2007`의 "Robertson et al's studies … found that …"(다른 연구 인용)이 `yes`를 받았다. 관련성 판정은 인용의 출처 성격을 거르지 않으므로 3(맥락 꼬리표)이 따로 필요하다.
  - haiku 판정 신뢰도 확인(사용자 선택: 다른 회사 모델 `gpt-6.1-sol`, 같은 표본 100개 전부, 같은 프롬프트):
    - `relevance.py judge gpt-6.1-sol`은 `tools/ask.py`의 OpenAI 경로(reasoning high, background mode)를 쓴다. `ask.py` `PRICE`에 `gpt-6.1-sol` (2.0, 10.0) USD/1M을 더했다(출처: https://developers.openai.com/api/docs/models/gpt-6.1-sol, 2026-10-26 확인). 비용 $0.109.
    - `relevance.py compare haiku gpt-6.1-sol` → 불일치 목록 `relevance/disagree-haiku-gpt-6.1-sol.md`.
    - 세 값 일치 68/100, Cohen's kappa 0.52. 혼동표(행 haiku, 열 sol, 순서 yes/partial/no): yes 27·5·1, partial 14·13·7, no 0·5·28.
    - 두 값으로 묶으면 일치가 올라간다: 쓸 수 있음(yes+partial) 대 no 87/100, yes 대 나머지 80/100. yes↔no로 갈린 것은 1개(`berney2016`의 iconic representation 정의; haiku yes, sol no).
    - 불일치 32개 중 대부분은 yes와 partial의 경계다. sol은 장면에 바로 적용할 기준이 있으면 yes(예: "16 characters per line", "objects move solidly"), 특정 연구의 결과·방법이면 no로 갈랐다.
    - sol의 묶음별 결과: base yes 22·partial 14·no 14, extra yes 19·partial 9·no 22. `kind`별 yes: expert-rubric 9/13, principles 8/13, review 7/14, experiment 6/13, style-guide 5/13, standard 3/6, benchmark 3/15, meta-analysis 0/13.
    - 두 모델 모두 extra의 no 비율이 base보다 높다(haiku 38% 대 28%, sol 44% 대 28%). yes 비율 차이는 모델에 따라 다르다(haiku 26% 대 40%, sol 38% 대 44%).
    - 사용자 GPT 예산 $10 중 누적 사용: 약 $0.11.

**3. 맥락: haiku가 인용마다 꼬리표를 붙인다**
- 대상: 통과 인용 3,718개 전부. 출처별로 묶어서 처리한다.
- 입력: 인용 + `text.txt`에서 그 인용 앞뒤 약 500자.
- 꼬리표:
  - `own-finding`: 그 문서 자신의 결과
  - `cited-work`: 다른 연구 인용
  - `hypothesis-or-intro`: 가설·서론의 주장
  - `method`: 방법 설명
  - `definition`: 정의
  - `recommendation`: 권고
  - `requirement`: 표준·가이드의 요구사항
  - `table-fragment`: 출처를 특정할 수 없는 표 조각
- 꼬리표 정확도는 30개를 sonnet이나 opus가 다시 판정해 확인한다.
- 기준표의 근거로는 `own-finding`, `recommendation`, `requirement`, `definition`만 쓰는 안을 사용자와 정한다.
- 실행(2026-10-26):
  - 도구: `tools/context.py`. `run <model> [workers]`는 `quotes.jsonl` 통과 인용과 `quotes-extra.jsonl`(qid `extra#<줄번호>`)을 출처별 10개 묶음으로 `claude -p`에 병렬로 보낸다. 묶음 결과는 `context/<model>/<n>.json`에 캐시되어 다시 실행하면 빠진 묶음만 돈다. 결과는 `context/<model>.jsonl`(qid, origin, source, kind, tag, relevant, reason).
  - 관련성(2)의 결과에 따라 같은 호출에서 `relevant`를 `usable`/`no` 두 값으로 함께 물었다. 프롬프트 원문은 스크립트의 `PROMPT`.
  - 문맥은 정규화한 `text.txt`(대소문자 유지)에서 인용 앞뒤 500자. 4,374개 모두 위치를 찾았다.
  - haiku 16 병렬, 456 묶음, 약 5.5분, `claude -p` 보고 비용 $1.03. `igenbench2026` 한 묶음이 `embedded null byte`로 실패해서 프롬프트의 제어문자를 지우게 고치고 그 묶음만 다시 돌렸다.
  - haiku 결과(4,374개): own-finding 688, method 647, cited-work 623, table-fragment 569, hypothesis-or-intro 565, recommendation 446, requirement 432, definition 404. usable 2,596 / no 1,778.
  - extra 656개 중 269개(41%)가 table-fragment다. base는 3,718개 중 299개(8%). usable 비율은 base 64%, extra 32%.
  - 재판정: `context.py sample 20261026 80`(haiku 꼬리표마다 10개) → `judge-sample gpt-6.1-sol`(비용 $0.158) → `compare haiku gpt-6.1-sol`. 불일치 33개는 `context/disagree-haiku-gpt-6.1-sol.md`.
    - tag 일치 55/80(0.69), kappa 0.64. haiku 꼬리표별 sol 일치: own-finding 10/10, method 10/10, cited-work 9/10, recommendation 8/10, hypothesis-or-intro 6/10, definition 4/10, requirement 4/10(나머지는 recommendation 3, definition 2, method 1), table-fragment 4/10(나머지 중 method 4).
    - relevant 일치 66/80(0.82), kappa 0.59. haiku `no` 29개 중 12개를 sol은 `usable`로 봤다. 반대는 2개.
    - "꼬리표가 위 네 가지에 드는가"로 묶으면 일치 75/80. "네 가지 꼬리표이면서 usable"로 묶으면 72/80.
  - "네 가지 꼬리표이면서 usable"을 통과하는 인용: 1,564/4,374. base 1,457/3,718(39%), extra 107/656(16%). kind별: standard 97%, expert-rubric 66%, style-guide 58%, experiment 39%, principles 30%, benchmark 27%, meta-analysis 24%, review 17%.
  - 네 가지 밖이지만 usable인 인용: cited-work 455(그중 review 291), hypothesis-or-intro 290(그중 principles 57), method 231, table-fragment 56.
  - GPT 누적 비용 약 $0.27.
  - 인용을 어떻게 거를지(A: 네 꼬리표만 / B: 1차·2차 등급)는 "인용을 다음 단계에서 어디에 쓰는가"에 달려 있다(사용자). handoff에는 "LLM에게만 맡기지 않고 외부 조사를 하는 이유"가 목표(17행 "알려져 있는 평가 기준을 통해 보완")와 우선순위(19행) 외에는 적혀 있지 않다. 그래서 사용자 요청으로 중립 brief의 조사 subagent(Opus medium, `scored-web-search`)를 돌렸다. 보고 요약과 출처는 `experiments/rubric-sources/notes/2026-10-26-llm-judge-research.md`.
    - 보고에서 VLM judge는 시간 축 손상(프레임 섞기·멈춤·역재생)에 둔감했다(NeurIPS 2026, PRIMARY). 이 계획의 3층과 진행 순서 2(측정 기반)는 원래부터 시간 축 품질을 픽셀이 아니라 구조화 데이터로 판정한다. HSH 장면 264개를 확인한 결과(2026-10-26, `grep -l` 기준): `<canvas>` 0개, 전부 d3(SVG/DOM). `requestAnimationFrame` 89개, `setTimeout`/`setInterval` 94개, CSS `transition` 85개, `@keyframes` 63개. rAF·타이머 기반 움직임은 `getAnimations()`에 잡히지 않아 위치 샘플링이 필요하다.
  - gist 갱신: `relevance/`, `context/`(묶음 캐시 `context/<model>/`는 제외), `tools/relevance.py`, `tools/context.py`, `ask.py` 가격 변경을 사용자가 push했다(gist `e31d2ee`).

1–3 결과로 이 데이터를 기준표 근거로 쓸지, 어떤 부분을 거를지 정한 뒤에 기초 기준표 작성과 모델 검토(argon → sol → astra → fable → opus)로 넘어간다.

### 시도(trial): 문헌 인용에서 항목을 먼저 만들기 (사용자 결정, 2026-10-27)

- 사용자: "한 번 시도해 보자. 이게 trial이라고 handoff에 명시해줘. 실패하면 어디로 돌아가야 하는지도."
- **이것은 trial이다.** 아래 "진행 순서" 1(회사별 모델이 독립 초안 작성 → 병합 → "부족한 것", "과한 것" 비판)과 순서가 다르다. 기준표의 틀을 LLM 초안이 아니라 문헌 인용이 잡는다. trial이 성공해야 이 순서로 바꾼다.
- 바꾸려는 이유:
  - LLM이 만든 루브릭은 사람 루브릭과 부분적으로만 겹쳤다(F1 최대 0.752, Wu et al. 2025, 출처 하나).
  - 회사가 달라도 모델 오류가 상관했다(2025, SKIM).
  - 조사 노트: `experiments/rubric-sources/notes/2026-10-26-llm-judge-research.md`
- 반대 근거와 보완(`experiments/rubric-sources/notes/2026-10-27-literature-to-item-research.md`):
  - 인용마다 LLM이 항목을 뽑는 방식을 직접 검증한 연구는 찾지 못했다.
  - LLM 문항 생성 선례는 생성 뒤에 독립 판정을 둔다. Hommel 2022에서는 전문가 2명이 모두 승인한 문항이 53.4%였다.
  - EvalGen(UIST 2024)은 산출물을 채점하면서 기준이 정해진다고 관찰했다(criteria drift).
- 과정:
  0. 인용 거르기는 B(등급)로 한다.
     - 1등급: own-finding, recommendation, requirement, definition 중 하나이고 usable인 인용 1,564개.
     - 2등급: cited-work 또는 hypothesis-or-intro이고 usable인 인용 745개. 항목의 보조 근거로만 쓴다.
     - 출처는 `context/haiku.jsonl`이다.
  1. 번역 시험 출처 3개(main agent 기본값, 종류가 다르게 골랐다): `berney2016`(meta-analysis, 1등급 55개), `lori2007`(expert-rubric, 66개), `carbon-motion`(style-guide, 18개).
     - 각 1등급 인용에서 이진 항목 후보를 만든다. 항목마다 질문, 인용 ID, 근거 종류, 기준값, 적용 조건, 효과 방향을 붙인다.
     - 항목이 나오지 않는 인용은 "항목 없음"으로 둔다.
     - 번역 모델 기본값은 sonnet(`claude -p`), 재검사 모델은 gpt-6.1-sol이다.
  2. 병합과 적용 가능성 판정. 장면에 없는 요소에 대한 항목은 이유를 붙여 제외한다.
  3. 사용자 판정(비전문가 분류 방식, Anderson–Gerbing 1991 계열. 본문은 미확인):
     - 항목 표본을 보여 주고, 각 항목이 어느 인용의 어떤 주장에 해당하는지 고르게 한다.
     - 묻는 것은 사실(충실도)이다. 선호는 묻지 않는다.
  4. 재검사 모델의 같은 판정과 사용자 판정의 일치도를 잰다. 일치하면 나머지 출처의 판정을 LLM 패널에 맡긴다.
  5. 골든셋에 적용한 뒤 한 번 고친다.
     - 고칠 수 있는 이유는 사실로 한정한다: "인용이 장면에 들어맞지 않는다", "항목이 모호해서 판정이 갈린다".
     - "보기에 별로다" 같은 선호는 고칠 이유로 쓰지 않는다.
- 실패 기준(main agent 기본값, 사용자가 바꿀 수 있다):
  - 충실도: 사용자 판정에서 인용을 정확히 담은 항목이 60% 미만이면, 번역 프롬프트를 한 번 고쳐 다시 시험한다. 그래도 60% 미만이면 실패.
  - 수율: 시험 출처 3개 중 2개 이상에서 충실하고 적용 가능한 항목이 3개 미만이면 실패.
  - LLM 확장: 재검사 모델과 사용자 판정의 kappa가 0.4 미만이면 실패. 나머지 40개 출처를 사용자가 판정해야 하기 때문이다.
  - 비용: GPT 누적이 예산 $10을 넘을 상황이면 멈추고 사용자에게 묻는다.
- 실패 시 돌아갈 곳:
  - 이 절 바로 위 상태로 돌아간다. 인용 데이터 품질 확인 1–3이 끝난 상태다.
  - 그 상태에서 아래 "진행 순서" 1의 원래 흐름을 쓴다. 회사별 독립 초안 → 병합 → "부족한 것", "과한 것" 비판 순서이고, 인용은 항목별 근거 찾기에만 쓴다.
  - 그대로 쓰는 산출물: `quotes.jsonl`, `quotes-extra.jsonl`, `relevance/`, `context/`.
  - 버리는 산출물: trial 출력.
  - 실패하면 Failed Attempts에 행을 추가한다.
  - 충실도 실패라면 대안 후보가 하나 더 있다. CheckEval처럼 차원을 먼저 정하고 LLM이 항목을 늘리는 방식이다. 조사 노트 5절에 있다.
- 조사 노트 2개(`notes/`)는 `.gitignore` 범위라 저장소에 없다. 사용자가 gist에 push했다(gist `4a60aae`).
- trial 진행(2026-10-27):
  - 번역: `tools/translate.py run sonnet berney2016 lori2007 carbon-motion`. 비용 $0.734. 출력은 `items-trial/sonnet.jsonl`, 묶음 캐시는 `items-trial/sonnet/`.
    | 출처 | 1등급 인용 | 항목 없음 | 항목 | fidelity(모델 자기 표시) |
    | --- | --- | --- | --- | --- |
    | berney2016 | 55 | 26 | 30 | stated 11, inferred 19 |
    | lori2007 | 66 | 15 | 81 | stated 60, inferred 21 |
    | carbon-motion | 18 | 0 | 18 | stated 15, inferred 3 |
  - berney2016의 "항목 없음"은 대부분 연구 코딩 변수 설명이다(예: "e) Presence of signaling cues ...").
  - 충실도 표본: 출처당 10개, 시드 20261027(`items-trial/fidelity-sample.json`). 후보 인용 3개 중 1개가 정답이고, 방해 인용 2개는 같은 출처의 항목을 낸 다른 1등급 인용이다. 판정은 출처 고르기와 같다/과장/다르다 비교다. "충실"은 정답 인용을 고르고 "같다"로 판정한 경우다(`tools/fidelity.py`).
  - 사용자 판정 페이지: https://claude.ai/artifact/W3Dfi9edB4uBugUkZwwQFU (비공개, `db` 컬렉션 `judgments`, 문서 `j<표본 번호>`). 페이지 원본은 세션 scratchpad에 있었고 저장소에는 없다. 한국어 기계 번역(`items-trial/fidelity-gloss.json`, sonnet, $0.10)은 선택해서 볼 수 있다.
  - gpt-6.1-sol 판정은 끝났다(`items-trial/fidelity-gpt-6.1-sol.json`, $0.062). 사용자 판정에 앵커가 되지 않도록, 사용자 판정이 끝날 때까지 결과를 보이지 않는다.
  - 다음: 사용자 판정을 `items-trial/fidelity-user.json`으로 내보낸다. 그 뒤 `fidelity.py score user gpt-6.1-sol`로 실패 기준(충실도 60%, kappa 0.4)을 판정한다. 통과하면 병합·적용 가능성 판정(trial 과정 2)과 수율 판정으로 간다.
  - 판정 결과(2026-10-27, `fidelity.py score user gpt-6.1-sol`):
    | 판정자 | 정답 인용 고름 | 충실 | berney2016 | lori2007 | carbon-motion |
    | --- | --- | --- | --- | --- | --- |
    | 사용자 | 22/30 | 13/30 (43%) | 2/10 | 4/10 | 7/10 |
    | gpt-6.1-sol | 27/30 | 19/30 (63%) | 4/10 | 7/10 | 8/10 |
    - 충실 여부 일치 20/30(0.67), kappa 0.36. sol은 충실, 사용자는 아님: 8건. 반대: 2건. 비교 판정(같다/과장/다르다/없음) 일치 17/30.
    - 미리 정한 기준으로는 충실도 43%(60% 미만, 프롬프트를 고쳐 한 번 재시험 허용), kappa 0.36(0.4 미만, 실패)이다.
    - 사용자는 아님, sol은 같다로 본 경우의 유형(main agent 분류):
      - 메타분석 하위집단 효과 → "하라" 항목: berney2016#62/0(iconic), #4/0(system-paced), #51/0(인지 과정별 효과). 평균 효과를 개별 장면 기준으로 옮기는 문제(Bowen 2025)와 같은 유형이다.
      - LORI "이러면 5점" 문장 → 점수 수준 없는 항목: lori2007#54/0, #98/1, extra#8/0.
      - 체크리스트 질문을 거의 그대로 옮긴 항목: carbon-motion#24/0. 사용자 판정 "다르다"의 이유는 기록되지 않았다.
    - 둘 다 걸러낸 유형: "consider"(고려하라)를 "제공하는가"로 바꿈(carbon-motion#27/0). 효과 없음 결과를 항목으로 만듦(berney2016#52/0, #92/0, extra#152/0). 효과 없음은 점검 항목이 될 수 없는데 번역 프롬프트가 `no-effect` 방향을 허용했다.
    - 측정 설계의 결함: 번역 모델은 인용 앞뒤 약 500자를 봤다. 판정 페이지와 sol 판정은 인용만 보여 줬다. extra#12/0, extra#8/1처럼 정답 인용이 `[...]`로 이어진 긴 인용이면, 항목이 앞뒤 문맥에서 왔을 수 있다. 또 같은 출처의 방해 인용이 같은 분석을 다른 문장으로 말하는 경우가 있다(berney2016#62/0, 사용자 메모: "생략된 부분이 있지만 iconic이 A에서 표현된 효과를 가지고 있을 것이라 생각해 골랐음").
  - 조사(2026-10-27, OpenAlex 조회, 초록만): 비전문가 분류 방식의 인용 수는 Anderson & Gerbing 1991 1,038회, Hinkin & Tracey 1999 404회, Colquitt et al. 2019 330회다(2022–2026 연 31–70회).
    - LLM 평가자 후속 연구: Son & Lee 2026 *ORM*(doi:10.1177/10944281261475596)은 리커트형 내용 타당도 평정에서 사람과 수용 가능한 수렴을 보였고, 보조 평가자로 결론 냈다. Pillet et al. 2025 *MISQ*(RATER, doi:10.25300/misq/2025/18946). Fyffe, Lee & Kaplan 2023 *ORM*(transformer가 구성개념 배정에서 사람 평가자보다 나음).
    - 이 연구들의 과제는 "문항이 구성개념 정의에 맞는가"다. "항목이 인용과 같은 말을 하는가"와는 다르다.
  - 2차 판정자 후보 비교(사용자 결정: "astra, opus, gemini argon 으로 일단 만들어는 보자"). 같은 30개, 같은 프롬프트, 인용만 보여 줌. 실행은 `fidelity.py judge <gpt-6-astra|opus|argon>`이다(argon은 agy `gemini-4-argon-medium`).
    | 판정자 | 정답 인용 고름 | 충실 | 사용자와 충실 여부 일치 | kappa | 사용자가 정답을 고른 22개에서 "같다" 여부 kappa | 비용 |
    | --- | --- | --- | --- | --- | --- | --- |
    | gpt-6-astra | 27 | 17 | 0.73 | 0.48 | 0.31 | $0.293 |
    | argon | 27 | 20 | 0.70 | 0.43 | 0.16 | agy 25,034 토큰 |
    | opus | 26 | 23 | 0.67 | 0.38 | 0.13 | $0.183 |
    | gpt-6.1-sol | 27 | 19 | 0.67 | 0.36 | 0.19 | $0.062 |
    - 모델끼리의 충실 여부 kappa: opus–argon 0.76, astra–argon 0.65, astra–opus 0.57. 모델끼리는 사용자보다 서로 더 잘 맞는다.
    - 세 모델이 모두 충실로 볼 때만 충실로 치면: 사용자와 일치 0.77, kappa 0.54, 충실 16개. 이 규칙은 결과를 본 뒤에 고른 것이라 같은 30개로는 검증되지 않는다.
    - 모든 모델이 사용자보다 너그럽다. 사용자가 정답을 고른 22개 중 사용자 "같다"는 13개, 모델은 16–21개다.
    - kappa 0.4를 넘긴 astra(0.48)와 argon(0.43)도, 사용자가 정답을 고른 항목만 보면 "같다" 판정 일치가 낮다(0.31, 0.16). 0.4를 넘긴 몫의 상당 부분은 출처 고르기 차이에서 왔다.
- 2차 시험(사용자 결정, 2026-10-27): "번역 쪽을 고쳐서 다시 시도하되, 앞에 내용이 뒤에 나와서 판정에 영향을 줌. (1번 지문 -> 20번대 지문에 다시 나옴) / 난 원어민 사용자가 아니라 한글 지문으로 50-100개 정도가 나을 것 같은데 / 판정은 flash 3.8, sol, argon, astra, opus, sonnet 모두 시도"
  - 번역: `tools/translate2.py run sonnet <6개 출처>`, 비용 $1.103. 출력은 `items-trial/sonnet-v2.jsonl`.
    - 바꾼 점: 번역 모델은 인용만 본다(1차는 앞뒤 약 500자). "효과 없음"과 결론 없는 결과는 항목을 만들지 않는다. 하위집단·특정 비교 결과는 그 비교로만 쓴다. 점수 수준은 condition에 남긴다. `strength`(requirement/recommendation/suggestion/finding) 필드를 추가했다.
    - 출처 6개: 1차의 3개 + `heer2007`(experiment), `wcag22-pause`(standard), `code2video2025`(benchmark). 새 출처를 넣은 이유는 1차 결과를 보고 고친 프롬프트가 다른 출처에서도 통하는지 보기 위해서다(main agent 기본값).
    | 출처 | 1등급 인용 | 항목 없음 | 항목 |
    | --- | --- | --- | --- |
    | berney2016 | 55 | 37 | 21 |
    | lori2007 | 66 | 18 | 82 |
    | carbon-motion | 18 | 1 | 17 |
    | heer2007 | 53 | 12 | 59 |
    | wcag22-pause | 31 | 14 | 17 |
    | code2video2025 | 47 | 14 | 46 |
  - 표본: `fidelity2.py sample`, 시드 20261028, 출처당 10개, 인용당 항목 1개. 표본 안에서 같은 인용은 한 번만 나온다(`items-trial/fidelity2-sample.json`).
  - 판정 방식 변경(main agent 기본값): 출처 고르기를 뺐다. 항목 하나와 그 항목이 나온 인용 하나만 보여 주고, 같다/과장/다르다를 고르게 한다. 이유: 1차에서는 방해 인용 때문에 같은 인용이 여러 번 나왔다(사용자 지적). 또 사용자의 출처 고르기 오답 8/30이 충실도 판정과 섞였다.
  - 판정 프롬프트에는 1차 사용자 판정에서 나온 과장 유형 세 가지를 명시했다: 하위집단 결과를 요인 권고로 바꿈, 점수 수준을 뺌, "consider"를 요구로 바꿈. 같은 유형을 페이지 안내문에도 적었다. 1차 표본을 보고 만든 규칙이므로 새 표본으로만 평가한다.
  - 한국어 지문: sonnet 번역(`items-trial/fidelity2-ko.json`, $0.264). 단서·조건·수치를 그대로 두고 전문 용어 뒤에 영어를 괄호로 붙이게 했다. 원문은 문항마다 펼쳐 볼 수 있다. 위험: 기계 번역이 단서나 조건을 바꾸면 항목 판정에 섞인다. 사용자에게는 번역 문제를 메모에 적어 달라고 했다.
  - 용어 풀이 85개: `items-trial/fidelity2-terms.json`, $0.081.
  - 사용자 판정 페이지: https://claude.ai/artifact/4BUqhzJ8k7vSbWWidk51EL (비공개, `db` 컬렉션 `judgments`, 문서 `j<표본 번호>`).
  - 판정 모델 6개(flash = agy `gemini-3.8-flash-high`, gpt-6.1-sol, argon, gpt-6-astra, opus, sonnet)를 `fidelity2.py judge <model>`로 돌렸다. 결과(`items-trial/fidelity2-<model>.json`)는 사용자 판정이 끝날 때까지 보지 않는다. sonnet은 번역 모델과 같아서 자기 출력 선호가 있을 수 있다.
  - 사용자 요청으로 중립 검토 subagent를 같은 시점에 돌렸다("sub agent하나 호출해서 우리가 하고 있는게 맞는 방향인지 중립적인 시각에서 검토해봐"). subagent에게는 `fidelity2-*` 판정 결과를 읽지 말라고 했다.
    - 보고: `experiments/rubric-sources/notes/2026-10-27-direction-review.md`(gist 미동기화).
    - 결론: 멈출 정도는 아니지만 구조를 바꿔야 한다. 충실도만 쟀고, 변별·판정 가능성·결함 탐지는 재지 않았다. 남은 출처로 번역을 넓히지 말고, v2 항목을 HSH 장면 20개에 미리 적용하고 결함 주입을 먼저 하라는 권고다.
  - 2차 표본의 독립성 결함(검토가 지적, main agent가 qid 대조로 확인): 2차 인용 60개 중 13개가 1차 정답 인용과 같다. 1차 후보 인용까지 치면 25개가 겹친다. 1차의 출처 3개에서 같은 인용 풀로 다시 뽑았기 때문이다. 그래서 2차 결과는 겹친 13개와 나머지 47개로 나눠 계산한다.
  - 2차 판정 결과(2026-10-27, `fidelity2.py score user flash gpt-6.1-sol argon gpt-6-astra opus sonnet`, 사용자 판정 `items-trial/fidelity2-user.json`):
    | 판정자 | 같다 | 사용자와 "같다" 여부 kappa(60개) | 겹친 13개 kappa | 나머지 47개 kappa | 비용 |
    | --- | --- | --- | --- | --- | --- |
    | 사용자 | 29/60 (48%) | — | — | — | — |
    | flash | 41 | 0.14 | 0.42 | 0.07 | agy 구독 |
    | gpt-6.1-sol | 42 | 0.11 | 0.28 | 0.08 | $0.071 |
    | argon | 34 | 0.17 | 0.16 | 0.10 | agy 구독 |
    | gpt-6-astra | 43 | 0.21 | 0.42 | 0.16 | $0.743 |
    | opus | 49 | 0.22 | 0.32 | 0.18 | $0.268 |
    | sonnet | 38 | 0.17 | 0.64 | 0.05 | $0.091 |
    - 사용자 판정: 같다 29, 과장 20, 다르다 11. 출처별 같다: berney2016 4, carbon-motion 8, code2video2025 5, heer2007 2, lori2007 5, wcag22-pause 5(각 10개 중).
    - 겹친 13개에서 사용자 같다 9/13, 나머지 47개에서 20/47(43%).
    - 모델끼리 kappa: 최소 0.31, 중앙값 0.51, 최대 0.80. 6개 중 k개 이상이 같다로 볼 때만 같다로 치는 규칙(k=1–6)도 사용자와 kappa 0.12–0.22다.
    - 사용자는 같다가 아닌데 모델 5개 이상이 같다: 17건. 사용자는 같다인데 모델 2개 이하가 같다: 7건.
    - 사용자 메모 16개 중 8개가 인용 일부 누락을 이유로 든다(예: #4 "인지 활동이라는 부분이 빠짐", #44 "가능하면 피해야 하고 … 피해야 한다는 점이 누락됨", #39 막대·도넛 차트 조건 누락). 이런 항목에 opus는 대체로 "일치"라고 썼다. 번역 문제를 적은 메모는 없다.
    - main agent 해석(hypothesis): 사용자의 "같다"는 인용 전체를 빠짐없이 담았는가에 가깝고, 모델의 "같다"는 인용보다 세게 말하지 않았는가에 가깝다. 정의 차이가 불일치의 일부를 설명할 수 있지만, 같은 정의로 다시 재지는 않았다.
    - 미리 정한 기준으로: 충실도 48%(60% 미만, 프롬프트 수정 뒤 재시험이므로 실패), kappa 최대 0.22(0.4 미만, 실패). trial은 기준상 실패다.

### 원래 흐름으로 복귀 (사용자 결정, 2026-10-27)

- 사용자: "이거 내가 병목인 거 같아. 매번 기준도 조금씩 다르고, 정확하게 이해하지 못하는 것도 많고 … 내가 이 labeling을 할 역량이 안 돼. … 논문 수준의 교육 자료 채점표를 읽을 기초 지식이 없어"
- 사용자: "원래 흐름으로 돌아가자. 아, 근데 이 채점표 - 컨닝 페이퍼로 쓰자. … 아예 생성할 때 신경 쓰게 해. / 채점표가 생성자에 들어가서 생기는 문제? 우리는 저 채점표를 잘 수행하기만 해도 충분해. 뭘 더 할필요 없어"
- 사용자: "오래된 건 기술 발전을 고려해서 빼거나 disadvantage해"
- 따라서:
  - 문헌 인용–항목 충실도를 사람이 판정하는 단계는 없다. 사용자가 판정하는 것은 장면을 보고 알 수 있는 것(형식 결함, 두 장면 비교)으로 한정한다(main agent 제안, 사용자가 원래 흐름 복귀로 답함).
  - 기준표는 judge의 채점표이면서 장면 생성기 입력이다. 그래서 항목은 생성기가 따를 수 있는 문장이어야 한다. 생성기가 채점표를 보는 데서 오는 문제(채점표에 맞춰 최적화)에 대한 별도 대책은 두지 않는다(사용자 결정).
  - 2a층(교육학적 타당성)은 전문가 검증이 없다. 근거는 문헌 인용 연결과 사실 검사(인용 문자열 대조, 장면마다 답이 늘 같지 않음, 결함 주입에 반응)다.
- 오래된 출처 처리(main agent 기본값, 사용자가 바꿀 수 있다). 근거 연결 단계에서 적용하고, 독립 초안 단계에는 영향이 없다:
  - 2015년 이후: 그대로.
  - 2005–2014년: 근거 강도를 한 단계 낮춘다. 해당: `simons-rensink2005`, `kalyuga2007`, `lori2007`, `heer2007`, `robertson2008`, `dekoning2009`, `bateman2010`, `spanjers2010`, `achieve-oer`(2011), `legge2011`, `dragicevic2011`, `guo2014`.
  - 2005년 이전: 단독 근거로 쓰지 않는다. 2015년 이후 출처가 같은 말을 할 때만 보조 근거로 남긴다. 해당: `chang-ungar1993`, `healey1996`, `tversky2002`.
  - 지각·인지 연구(`healey1996` 전주의 처리, `legge2011` 글자 크기)는 기술에 덜 의존하지만 예외를 두지 않았다. 사용자 지시가 연도 기준이어서다.
  - 판 번호가 있는 지침(WCAG 2.2, Material 3, Carbon, HIG, Netflix, BBC)은 현재 판의 연도로 본다.
  - 2026-10-27 변경. 사용자: "인지 지각 연구는 예외로 한다. 기술 발전에 의해 달라지는 부분들만 연도 규칙에 넣는다."
    - 분류는 main agent 기본값이다. 사용자가 바꿀 수 있다. 출처별로 나눴다.
    - 예외 11개(지각·인지): `simons-rensink2005`, `kalyuga2007`, `dekoning2009`, `spanjers2010`, `legge2011`, `healey1996`, `tversky2002`, `bateman2010`, `dragicevic2011`, `robertson2008`, `heer2007`. 이 중 `heer2007`(통계 그래픽 전환 애니메이션)과 `robertson2008`(추세 시각화 애니메이션)은 특정 시각화 도구로 한 실험이어서 경계 사례다.
    - 연도 규칙 유지 4개(매체·도구 의존): `lori2007`(학습 객체 평가 도구), `achieve-oer`(OER 채점표), `guo2014`(MOOC 영상 제작 방식), `chang-ungar1993`(1993년 UI 애니메이션 원칙).
    - `tools/evidence.py`의 `EXEMPT`에 반영했다. `evidence/items.json`의 `year`는 실제 연도이고, `age_exempt`가 예외 여부다.
    - 재계산 결과: strong 22, moderate 27, weak 0, none 24(이전 18 / 28 / 3 / 24).
      - moderate → strong: learner-pause-replay, congruent-motion, continuous-motion, trackable-duration.
      - weak → moderate: persistent-reference, object-constancy, motion-concurrency.

### 1단계 진행: 독립 초안 → 병합 → 비판 → 근거 연결 (2026-10-27)

도구는 `experiments/rubric-sources/tools/`(gitignore 범위)에 있다. 사본은 secret gist(`tools__*.py`, `drafts__*`, `evidence__*.json`)이고, 로컬 gist 사본 커밋까지 했다. push는 사용자가 한다.

- 독립 초안: `tools/draft.py opus gpt-6.1-sol gpt-6-astra argon`. 초안 모델은 인용을 보지 않는다.
  - 프롬프트(영어)에는 장면 설명, judge가 관찰할 수 있는 것, 사용자 메모에서 나온 결함 9개("반드시 잡아야 함"), 층 4개, 항목 필드가 들어간다. 항목 필드: id, layer, check, instruction(생성기용), applies_when, threshold, measure, evidence(모르면 "practice"), weight 1–3. 항목은 30–60개를 요구했다.
  - 결과: opus 58개($0.61, 한국어로 답함), gpt-6.1-sol 50개($0.117), gpt-6-astra 48개($1.068), argon 35개(구독). evidence가 "practice"인 항목: 18 / 31 / 24 / 13.
- 병합: `tools/merge.py sonnet <4개>`, $0.34. 초안을 쓰지 않은 sonnet이 묶음과 문장만 맡는다. 출처 모델, 가중치(median_low), 근거 주장은 코드가 복사한다. 모든 초안 항목이 정확히 한 묶음에 들어가는지 검사한다.
  - 결과 `drafts/merged.json`: 73개. 제안 모델 수별: 4개 29, 3개 10, 2개 7, 1개 27. 층별: pedagogy 24, format 20, animation 17, storyboard 12.
  - sonnet이 threshold 문자열에 "(opus)/(argon)" 같은 모델 표기를 남겼다. 고치지 않았다.
- 비판: `tools/critique.py <4개>`. 출처 모델은 숨겼다. 누락 / 과잉 수, 비용:
  - opus 3 / 19, $0.43
  - gpt-6.1-sol 3 / 37, $0.206
  - gpt-6-astra 1 / 39, $0.865
  - argon 3 / 18
  - 누락 후보(중복 정리 전 10개): no-runtime-errors, control-diagram-co-visible, predict-setup-sufficient, read-observe-opportunity, input-error-recovery, no-keyboard-trap, guided-parameter-exploration, pointer-path-non-overlap, state-delta-highlighted, step-backward-restores-state.
  - 4개 모두 지적: text-size, temporal-contiguity, persistent-end-state, no-unsupported-claims, entrance-from-origin, no-dead-time-or-filler, text-reading-pace, motion-concurrency, cue-leads-change, result-hold, loop-reset-distinct, trackable-duration. 대부분 threshold-wrong이고, persistent-end-state는 4개 모두 duplicate(result-hold와 중복)다.
  - 3개가 지적: keyboard-operable-controls, reduced-motion-suppresses-motion, predict-before-reveal, continuous-motion, control-change-reruns, animation-starts-when-visible, eased-motion.
  - 기준값 의견이 갈렸다. opus·argon은 값 하나로 통일하자고 했다. GPT 두 모델은 연구 근거가 없으니 숫자를 빼고 data+llm으로 판정하자고 했다.
- 근거 연결: `tools/evidence.py`.
  - 사용 인용: `context/haiku.jsonl`에서 usable인 인용만 쓴다. 1등급 = own-finding, recommendation, requirement, definition. 2등급 = cited-work, hypothesis-or-intro.
  - 제안: `propose sonnet`, $2.473. 출처 43개에서 682쌍이 나왔고, 출처별 캐시는 `evidence/sonnet/`이다.
  - 검증: `verify gpt-6.1-sol sonnet`, $0.853. 결과는 supports 89, partial 396, no 197.
  - 판정: `report sonnet gpt-6.1-sol` → `evidence/items.json`. 나이 규칙을 적용했다.
    - 점수: 1등급 3, 2등급 2. 2005–2014년이면 1을 빼고, partial이면 1을 더 뺀다.
    - 2005년 이전 출처는 2015년 이후 출처의 supports가 있을 때만 센다.
    - 항목 수준은 최댓값이다.
  - 결과: strong 18, moderate 28, weak 3, none 24.
  - 기준값을 supports한 인용이 있는 항목은 no-flashing(WCAG, 5개) 하나다. text-reading-pace는 strong(bbc-subtitles, brysbaert2019, netflix)이지만 기준값 supports는 0이다.
  - none 24개: theme-token-colors, diagram-first-screen, diagram-dominance, self-contained, animation-starts-when-visible, element-no-jitter, visible-focus, control-names-states, diagram-text-alternative, motivated-introduction, contrast-aligned, persistent-end-state, worked-example-concrete-values, predict-options-plausible, one-sentence-takeaway, build-order-matches, role-fulfilled, control-values-correct, correct-initial-state, entrance-from-origin, no-dead-time-or-filler, loop-reset-distinct, playback-state-coherence, path-following. 사용자 메모 결함과 스토리보드 준수 항목이 대부분이다. entrance-from-origin은 근거가 chang-ungar1993 하나여서 나이 규칙으로 none이 됐다.
  - 확인하지 않은 것: 수치를 말하는 인용(Netflix·BBC 읽기 속도, nng 지속시간, Material 3 토큰)이 기준값 근거로 잡히지 않은 원인. 가능성은 propose의 part 지정이나 verify의 엄격도다(hypothesis).
- main agent가 사용자에게 밝힌 기본값(사용자가 바꿀 수 있다):
  - 인용이 수치를 말하면 그 값을 기준값으로 쓴다.
  - 없으면 고정값을 두지 않고 후보값으로 남긴다. 후보값은 golden set과 결함 주입으로 맞춘다.
  - 근거 none 항목은 "관찰된 결함" 또는 "모델 합의"로 표시하고 남긴다.
- 사용자(2026-10-27, 위 결과 보고 뒤): "우리가 찾은 정보가 1차 자료 (논문, 공식 문서)인데, 거기에 또 문헌이 필요하지는 않을 것 같아." main agent 해석: 수집한 출처 43개 밖으로 문헌을 더 찾지 않는다. 근거 none 항목과 기준값 근거가 없는 항목도 추가 검색하지 않는다.
- 남은 일:
  - 비판 반영: duplicate 다수 항목을 합친다(persistent-end-state → result-hold 등). 누락 후보는 중복을 정리해 넣는다.
  - 기준값 근거 누락 원인을 확인한다.
  - 항목표를 한국어로 사용자에게 보인다. 사용자 검토 범위는 "측정 가능하게 쓰였는가"다.
  - 지각·인지 연구의 연도 규칙 예외: 사용자가 답했다(위 "2026-10-27 변경").

### 비판 반영 시도와 다회사 합의 포기 (2026-10-27, 다음 세션)

- 기준값 근거 누락 원인(위 "확인하지 않은 것"): propose는 수치를 잡았다(682쌍 중 `value` 있는 것 143개, threshold/both 136쌍). verify 프롬프트가 "인용이 항목의 threshold를 말하는가"를 물었고, 병합 threshold가 범위·수치 없는 문장이라 Netflix 12 cps 같은 인용도 partial이 됐다(threshold supports 1, both supports 4, partial 82). 확인: `evidence/verify-gpt-6.1-sol.json`에서 `part != "check"`인 쌍의 `rating`과 `reason`.
- `tools/revise.py run sonnet 8` → `drafts/revised.json`, 항목별 캐시 `drafts/revise-sonnet/`, 비용 $2.099.
  - 규칙: 비판 2개 이상이 같은 방향이면 반영, 병합 흔적(모델명, 값 병기)은 고침. verify에서 `no`가 아닌 인용의 `value`가 항목에 맞으면 기준값(`quoted`), 아니면 후보값(`candidate`), 수치가 필요 없거나 비판 2개 이상이 정성 판정을 요구하면 `none`. 비판의 누락 항목 10개는 그대로 추가(`origin: critic`, 근거 연결 안 됨).
  - 결과: revise 36, keep 34, add 10, remove 3(persistent-end-state → result-hold, role-fulfilled → one-sentence-takeaway, eased-motion → semantically-appropriate-easing). 기준값 상태 none 47, candidate 23, quoted 10. measure: data+llm 37 → 47.
  - 관찰: 기준값을 정성 판정으로 바꾼 항목 17개 중 7개는 비판이 gpt-6.1-sol·gpt-6-astra(둘 다 OpenAI)뿐이었다. opus·argon은 값 하나로 정하자고 했지만 값이 서로 달라 "같은 방향 2개"로 묶이지 않았다.
  - 관찰: `quoted` 중 motion-concurrency(≤1 그룹, `simons-rensink2005` 변화맹 문장)와 temporal-contiguity(BBC 자막 동기화 1.5s/2s)는 verify partial 인용을 장면 글에 옮긴 것이다.
  - 이 산출물을 쓸지는 정하지 않았다.
- 사용자 결정: "다 회사 합의는 포기하고, 어떻게 Judge를 구성하는 게 효과적인지 /scored-web-search로 조사한다. (subagent)". 조사 보고 위치: `experiments/rubric-sources/notes/2026-10-27-judge-construction-research.md`(subagent, `scored-web-search`, 후보 89개 중 통과 23개, 19개 읽음, 대부분 초록·일부). gist 미동기화.
  - 보고의 요지([근거]는 보고가 출처에서 옮긴 것, main agent가 원문을 다시 확인하지 않았다):
    - 패널: 정답 있는 QA에서 사람과의 kappa 단일 0.83 대 3모델 다수결 0.86(Badshah & Sajjad 2024). 강한 모델일수록 오류가 닮는다(Goel et al., ICML 2025).
    - 체크리스트: 쌍대 판정에서는 이득, 직접 점수에서는 유의차 없음, 항목의 약 40%가 사람 일치를 낮춤(Furuhashi et al., EMNLP 2025). 항목을 쪼개고 거르면 JudgeBench +17.7점(Shen et al., NeurIPS 2026).
    - 기준 출처: 산출물·사람 판정에서 기준을 끌어낸 방식이 사람 일치를 올렸다(EvalGen UIST 2024: 채점 16개로 coverage 49% → 73%, SPADE, HypoEval 판정 30개). "문헌 → 항목"과 비교한 연구는 없다.
    - 검증: 결함 주입에서 judge가 품질 저하의 절반 넘게 놓쳤고 참조(이 프로젝트의 storyboard)를 준 판정이 나았다(FBI, EMNLP 2024). 변성 시험 점수로 매긴 judge 순위와 사람 라벨 순위 Spearman 0.852(SANE, NeurIPS 2026 워크숍). 최소 라벨 수를 직접 답한 출처는 없다.
    - 시간 축: Manim 교육 영상 judge의 사람 상관은 시각 관련성 0.72, 배치 0.42, 시각 일관성 0.17(TheoremExplainAgent, ACL 2025). MotionBench 최고 VLM 0.58.
    - 코드 측정 + LLM 결합을 LLM 단독과 통제 비교한 연구는 없다. 임계값 설정은 EvalGen의 "잘못된 실패 비율 상한 안에서 coverage 최대화"만 찾았다.
- 다음 작업(main agent 제안, 사용자 승인 2026-10-27: "커밋하고 시작해. 본실험 전에 작게 pilot test 잊지 말고"): 진행 순서 2(측정 기반)와 결함 주입. 기존 HSH 장면을 재료로 쓴다.
  - 사용자 조건: "HSH 항목이 기준이 되는거야? 그런거면 신경써서 다시 생성하고. 퀄리티가 크게 상관 없으면 진행해도 돼."
  - main agent 판단: HSH 장면은 측정 도구의 시험 재료다. 결함 주입의 탐지율은 원본 품질과 덜 관련된다. 오탐(잘못된 실패) 기준선은 원본에 이미 결함이 있으면 흐려지므로, 사용자 메모에 형식 결함이 없는 고득점 장면을 깨끗한 기준선 후보로 쓴다. golden set은 이전 결정대로 새로 생성한다.
  - `drafts/revised.json`은 보류. 73개 항목은 후보 목록으로 보고, 결함 주입·작은 라벨 묶음에 반응하는 항목만 남기는 안이다.
- 측정 파일럿(2026-10-27). 도구: `experiments/scene-pipeline/measure/measure.mjs`(Playwright 1.63.0, `createLttServer`로 `round-hsh/` 제공, 1280x800, 50ms 표본 12초, stepper는 2초 뒤부터 3초마다 "다음"), `measure/metrics.py`. 출력 `measure/out/`(gitignore), 표 `measure/out/metrics.tsv`. Playwright 설치: `cd experiments/scene-pipeline && npm install --no-save --prefix . playwright@1.63.0`.
  - 대상 22회 실행, 오류 0: 깨끗한 기준 2개(t1-r1 0RR2 9점, t4-r2 S4 9점, 메모 없음), 메모 결함 장면(t3-r2 0 흔들림, t1-r3 0 끊김, t2-r2·t2-r3 6갈래 전부), 깨끗한 2개에 주입 3종(shake: 주 SVG 상자 1.2초마다 6px, choppy: rAF 250ms + CSS 전환 0s, below: 본문 앞 900px).
  - 주입: shake → `frame_jumps` 9 대 원본 0. choppy → `isolated_change` 0.42·0.77 대 0.01·0.12, `teleport_ratio` 0.97·0.98 대 0. below → `hidden_controls` 전부, `hidden_text` 1.0.
  - 메모 결함: t3-r2 0("프레임이 흔들린다") `frame_jumps` 4, 최대 263px(단계마다 SVG 크기가 626→500→400px로 바뀜). t2-r2에서 "연속적이지 않고 투박, 스크롤해야 보임" 메모 3갈래(S4, S4R2, HHH)는 `teleport_ratio` 0.80–0.82·`hidden_controls` 5(예측 선택지 단추가 카드 스크롤 밖), 메모 없는 3갈래는 0·0. t2-r3(6갈래 모두 스크롤 메모)은 `hidden_controls` 1이 3갈래, 0이 3갈래. t1-r3 0("끊어져 보여서")은 `teleport_ratio`·`isolated_change`로 안 잡히고 `travel_per_change` 0.29(깨끗한 기준 2.11·1.70)로만 갈린다. t2-r3 S4·S4R2("animation이 거의 없음")는 `travel_px` 361–381로 메모 없는 장면보다 크다.
  - 파일럿 중 고친 것: SVG 크기 변화가 요소 이동으로 잡힘(좌표를 SVG 너비로 정규화), `svg.innerHTML`로 매 단계 다시 그리는 장면은 DOM 정체성으로 이동을 못 따라감(정체성 없는 상자 서명 지표 `isolated_change` 추가), 덱 카드(`.dk-stage`) 안쪽 스크롤에 가린 내용을 못 봄(조상 overflow 상자와 교차 검사), 로드 직후 스크롤바로 생기는 9px 재배치(첫 1.5초 제외).
  - 확인 못 한 것: 사용자 채점 페이지 iframe의 실제 크기(`review-score.tpl.html` `.stage`는 16:10, 최대 82vh). 파일럿 판정 기준을 실행 전에 글로 정해 두지 않았다.
- 측정 본실험 사전 등록(사용자 지시 "커밋하고 본실험 하자", 2026-10-27, 실행 전에 기록).
  - 라벨: `measure/labels.json`. main agent가 `round-judge/user-hsh.json` 메모를 형식 결함 6종(shake 8, choppy 12, hidden 15, no_anim 7, small 8, fast 3)으로 코딩했다. clean 24 = 점수 7 이상이고 형식 결함 메모가 없는 장면. 측정 밖 메모(가독성, 조작 후 화면 깨짐, 조작 후 재실행 없음)는 `not_measured`. 사용자 확인 전이다.
  - 새 주입 미니 파일럿(깨끗한 2개: t1-r1 0RR2, t4-r2 S4): small(주 SVG 0.4배) `svg_area` 0.21·0.23 → 0.03·0.04, freeze(rAF 버림, CSS 애니메이션 정지) `smooth_px` 5102·2702 → 0·10, fast(시계 3배) `speed_p90` 13.7·5.4 → 37.2·17.0. `new_chars_max_1s`는 fast에 반응하지 않았다(글이 시간이 아니라 "다음" 클릭으로 바뀐다).
  - 실행: 84장면 원본 + clean 24 × 주입 6종(shake, choppy, below, small, freeze, fast). 1280x800.
  - 결함 종류별 지표와 방향(고정): shake → `frame_jumps` 높음. choppy → `teleport_ratio` 높음, `travel_per_change` 낮음. hidden → `hidden_controls` 높음, `svg_visible` 낮음, `hidden_text` 높음. no_anim → `smooth_px` 낮음. small → `svg_area` 낮음. fast → `speed_p90` 높음.
  - 임계값: clean 원본 24개 중 실패 판정이 2개(10%) 이하가 되는 가장 엄격한 값. 동점은 실패 쪽에 넣는다.
  - 통과 기준(지표별): 해당 주입 탐지율 90% 이상, 그리고 자연 라벨이 3개 이상인 종류는 clean 대비 AUC 0.75 이상. 같은 장면 파일(해시 동일)은 한 번만 센다. 한 결함 종류에 지표가 여러 개라 우연 통과 위험이 있음을 결과와 함께 적는다.
- 측정 본실험 1차(사전 등록 그대로, `measure/analyze.py out/main/metrics.tsv`, 252회 오류 0, 7분). 표본 시간 12초, 첫 쪽만.
  - 통과: shake `frame_jumps`(임계 1, clean 1/24, 주입 1.00, 라벨 6/8, AUC 0.85), hidden `hidden_text`(0.34, 2/24, 1.00, 5/15, 0.80), no_anim `smooth_px`(20 이하, 0/24, 1.00, 2/7, 0.92), small `svg_area`(0.14 이하, 2/24, 1.00, 8/8, 1.00).
  - 탈락: choppy `teleport_ratio`(주입 0.58, AUC 0.56), choppy `travel_per_change`(주입 0.12), hidden `hidden_controls`(주입 0.83, AUC 0.67), hidden `svg_visible`(라벨 0/15, AUC 0.50), fast `speed_p90`(임계 37.3, 주입 0.21, 라벨 1/3).
  - 원인 확인: 84장면 모두 `ltt-deck` 덱이다. 도구는 첫 쪽만 봤다. t3 장면은 1쪽이 퀴즈이고 그림은 2–3쪽에 있어 t3-r2 S4·S4R2(fast 라벨), t3-r3 HHH는 주 SVG가 18x18 아이콘으로 잡혔다(`svg_area` 0, 변화 0). t2 예측 장면은 선택지를 고르기 전 상태만 봤다(메모 없는 t2-r2 0·0R·0RR2와 hidden 라벨 t2-r1이 같은 값). no_anim 라벨 중 놓친 t2-r3 4개도 같은 이유일 수 있다(확인 안 함).
- 2차(사후 변경, 1차 결과를 본 뒤 도구를 고쳤다): 학습자 대용 드라이버(3초마다 한 동작: 정답 안 본 예측이면 첫 선택지 → 정답 보기, 화면 밖 단계 단추는 직접 클릭, 아니면 → 키, `.ltt-nudge`는 클릭, 마지막 쪽에서 남은 단계·예측이 없어진 뒤 6초에 종료, 최대 90초). 주입 shake·small은 현재 쪽의 SVG를 계속 대상으로 한다. 지표는 쪽 경계를 넘는 표본 쌍을 빼고, 첫 화면 지표는 쪽 도착 0.5초(그림)·1초(글·단추)에 쪽마다 재서 `svg_visible` 최소, `svg_area` 중앙값(뷰포트 1% 이상인 SVG가 있는 쪽만), `hidden_text`·`hidden_controls` 최대로 모은다. frame 지표는 창·덱 카드 스크롤을 더한 좌표로, 같은 쪽·같은 SVG 요소끼리만 비교한다. 임계값·통과 기준·라벨은 사전 등록 그대로 쓴다. 드라이버 미니 파일럿(장면 6개 + t1-r1 0RR2 주입 6종): 주입 6종 모두 반응, t2 예측 장면이 선택→공개까지, t3 덱이 3쪽까지 진행했다.
  - 결과(`analyze.py out/main2/metrics.tsv`, 252회 오류 0, 11분). 통과: shake `frame_jumps`(임계 1, clean 1/24, 주입 1.00, 라벨 8/8, AUC 0.98), hidden `hidden_text`(0.34, 2/24, 1.00, 5/15, 0.80), no_anim `smooth_px`(264 이하, 2/24, 1.00, 5/7, 0.96), small `svg_area`(0.15 이하, 2/24, 1.00, 8/8, 1.00).
  - 탈락: choppy `teleport_ratio`(주입 0.67, AUC 0.55), choppy `travel_per_change`(주입 0.42, AUC 0.72), hidden `hidden_controls`(주입 0.83, AUC 0.67), hidden `svg_visible`(라벨 0/15, AUC 0.50, 모든 장면 1.0), fast `speed_p90`(임계 40.0, 주입 0.38, 라벨 1/3, AUC 0.92). fast 임계가 높은 이유: clean t3-r1 S4·S4R2(9점, 메모 없음)의 `speed_p90`이 59.4·51.4.
  - 탐색(사전 등록 밖, 지표 8개 × 결함 4종을 같은 임계 규칙으로 훑어 고른 것이라 과적합 위험): hidden `hidden_change`(화면 밖에서 일어난 요소 변화 비율, 임계 0.17, 주입 1.00, 라벨 13/15, AUC 0.92). choppy `isolated_change`(0.04, 주입 1.00, 라벨 3/12, AUC 0.85).
  - 사용자 판단(2026-10-27, 측정 결과를 본 뒤). 속도: "자막 읽기 속도 - 적용", "WCAG 2.2.2 - 적용", "애니메이션 이해 연구는 - 부분 적용 (뭔가가 날아가는 것만 인지해도 되는 움직임과, 읽어야 하는 움직임, 중간에 모습이 변하는 걸 관찰해야 하는 움직임 등등 종류마다 속도가 다름.)". 끊김 메모의 뜻: "t1-r3 항목: 가·나·다: 다음 단계로 갈 때 기존의 node가 다른 node 위치로 어떻게 이동하는 정보가 없이 그냥 그 위치에서 생성됨." "t2-r2 항목: 다·마·바: 단순하게 애니메이션이 부드럽게 이어지지 않고 그래프가 선 단위로 툭툭 그려진다는 뜻. 점수가 낮은 이유는 Asthetic 점수가 많이 낮기 때문, 여기서 \"끊어짐\"은 이해를 방해하지 않음." "t1-r2 항목: 가·바: 위와 비슷함." "t1-r2 항목: 마: 정답 보기를 하면 전체 그래프가 한 번에 보임. animation이 아님."
  - 라벨 재코딩(`labels.json`): choppy를 둘로 나눴다. recreate(대상이 이동하지 않고 새 위치에서 다시 생김, 이해를 방해): t1-r3 0·0R·0RR2, 같은 메모의 t1-r3 S4·S4R2(main agent 기본값), t1-r2 0·0RR2("위와 비슷함"의 "위"를 같은 메모 문구 "어떻게 움직이는지 정보 없이 나타나서"에 따라 t1-r3 쪽으로 읽은 main agent 기본값). rough(선 단위로 툭툭 그려짐, 미감, 이해 방해 없음): t2-r2 S4·S4R2·HHH, t2-r1 S4("투박함"). no_anim에 t1-r2 0R 추가.
  - recreate 지표 사전 등록(계산 전에 기록): `text_jump_ratio` = SVG 글자를 같은 문자열끼리 표본 사이 최근접으로 짝지어(8 이하면 연속 이동) 짝이 없는 새 위치의 글자가 직전 1초 안에 같은 문자열이 있던 곳에서 8 넘게 떨어져 있으면 점프로 보고, 점프 거리 합 ÷ (점프 거리 합 + 연속 이동 거리 합). 거리는 SVG 너비 1000 기준, 쪽 경계 제외. 방향 높음, 주입은 choppy, 임계값·통과 기준은 위 사전 등록과 같다. 데이터는 `out/main2`를 다시 쓴다(재측정 없음). rough는 미감 결함이라 이해 층 지표로 쓰지 않고 `isolated_change`를 탐색으로만 본다.
  - recreate 지표 파일럿(t1-r3 6갈래, t1-r1 0RR2, t4-r2 S4와 주입): 위 정의는 t1-r3 HHH(9점, "이동하는 게 잘 보여서") 0.92, 끊김 라벨 0.95–0.97로 포화했다. 원인: 50ms에 8 넘게 가는 빠른 연속 이동을 점프로 셌다. 수정 정의(전체 계산 전에 기록): 같은 문자열끼리 표본 사이 최근접 일대일 짝(300 이내). 짝 이동이 8 이상이고 직전 표본에서 그 자리로 움직여 오지 않았고 다음 표본에서 그 자리를 떠나지 않으면 점프, 아니면 연속 이동. 짝이 없는 새 위치 글자는 직전 1초 안에 사라진 같은 문자열 위치에서 8 넘게 떨어져 있으면 점프. 비율 정의·방향·주입·기준은 그대로.
  - recreate 2차 파일럿: 수정 정의도 t1-r3 HHH 0.84, 0·0R·0RR2 0.93–0.94, S4 0.97, S4R2 0.36(t1-r1 0RR2 0.18, t4-r2 S4 0.0, choppy 주입 0.97–1.0). 키 "50"의 궤적(`out/main2/t1_r3_*.json`, t 5.0–6.9초): 두 장면 모두 잎 노드를 새 자리에 다시 만들어 흐리게 나타낸다. HHH는 위로 올라가는 "50"이 잎 근처(y 371)에서 생겨 부모 자리(y 291)까지 이동한다. 0은 처음부터 부모 자리(y 206)에 불투명도 1로 나타난다. 지표 `path_shown`(낮음 = 결함)로 바꿨다(t1-r3 묶음을 보고 정한 정의라 t1-r3 라벨은 오염, t1-r3 밖 결과를 따로 본다): 연속 이동 거리 ÷ (연속 이동 + 고립 점프 + 재등장 잔여). 재등장 잔여 = 사라진 같은 문자열 위치에서 새 글자가 멈춘 곳까지 거리 − 새 글자가 등장 뒤 이동한 거리(0 미만은 0). 주입·기준은 그대로.
  - recreate·rough 결과(`analyze.py out/main2/metrics.tsv`, 재측정 없음, 움직이는 SVG 글자가 없는 장면은 `path_shown`·`text_jump_ratio` 해당 없음으로 뺌): recreate `path_shown`(임계 0.24 이하, clean 2/21, 주입 0.89, 라벨 3/6, AUC 0.90) 탈락(주입 90% 미달). `text_jump_ratio`도 같은 값. t1-r3 제외 시 AUC 0.85, 라벨 0/2(t1-r2 0·0RR2 0.43–0.44가 임계 0.29 위). clean 중 낮은 값: t1-r3 HHH 0.17, t5-r2 0R·0·0RR2 0.21·0.25·0.30(라운드마다 바뀌는 수치 라벨로 보이나 확인 안 함). 놓친 choppy 주입 2개: t4-r1 S4·S4R2(0.30·0.31). rough `isolated_change`는 형식상 PASS(주입 1.00, AUC 0.83)지만 라벨 4개 값 0.02–0.03이 임계 0.04 아래라 재현 0/4.
  - 탐색(뷰포트): 원본 108개를 1240x680(채점 페이지 `.wrap` 최대 1240px, `.stage` 최대 82vh에서 고른 가정값)으로 다시 측정. hidden AUC: `hidden_controls` 0.67 → 0.85, `hidden_text` 0.80 → 0.86, `hidden_change` 0.92 → 0.91, `svg_visible` 0.50 → 0.50. 출력 `measure/out/vp680/`.

### 회고 (세션 3a457627, 2026-10-27)

사용자가 처방과 의견을 빼고 관찰과 가설만 남기는 데 동의했다. 아래는 그 기준으로 쓴 것이다.

- 관찰:
  - 문헌 인용→항목 충실도를 사용자가 판정하는 trial은 2회 모두 미리 정한 기준에 못 미쳤다(2차: 같다 48%, 모델–사용자 kappa 최대 0.22).
  - 사용자는 "논문 수준의 교육 자료 채점표를 읽을 기초 지식이 없어"라고 했다. 이어서 "원래 흐름으로 돌아가자"고 답했다. 사용자 판정 범위를 장면에서 보이는 것으로 한정하자는 main agent 제안에 명시적으로 동의한 적은 없다.
  - 긴 실행을 `| grep`으로 거른 동안 출력이 버퍼링되어 진행이 보이지 않았다. 사용자가 "이거 왜이렇게 오래 걸려?"라고 물었다.
  - main agent가 GPT 누적 비용을 기억으로 합산해 "$5.4"라고 보고했다. 이 파일 기록의 합은 약 $4.5다. 재확인 방법: Execution Ledger와 위 절들의 `$` 값을 합한다.
  - 근거 수준은 확인 모델 하나(gpt-6.1-sol)의 판정으로만 정했다. 다른 모델과 교차 확인하지 않았다. 682쌍 중 partial이 396쌍이다.
  - `drafts/merged.json`의 threshold 문자열에 "(opus)/(argon)" 같은 모델 표기가 남아 있다.
- 가설(확인 안 함):
  - 기준값을 supports한 인용이 no-flashing 하나뿐인 것은 propose의 `part` 지정이나 verify의 엄격도 때문일 수 있다.
- main agent 기본값(사용자가 반대하지 않았지만 명시적으로 동의하지도 않았다):
  - 연도 구간과 감점 폭, 근거 수준 점수 계산식
  - 인용에 수치가 없으면 기준값을 후보값으로 두는 처리
  - 지각·인지 예외 출처 분류
  - "문헌을 더 찾지 않는다"는 해석(사용자 원문: "거기에 또 문헌이 필요하지는 않을 것 같아")
- 사용자 지시로 확인된 것:
  - 응답 언어: "한글로"
  - gist: "gist에 올리고, 참조로 해줘"
- 출처를 확인하지 못한 제약:
  - secret gist, push는 사용자가 직접, `raw.*`·`text.txt`(저작권)·`.env` 업로드 제외는 이전 세션에서 정해졌다. 사용자 결정인지 main agent 판단인지 이 세션은 확인하지 못했다.
  - 사용자 이메일을 외부로 보내지 않는다는 규칙은 시스템 지시다.

### 전체 구조와 순서

사용자가 동의한 judge 구조:

| 층 | 대상 | 판정 | judge 검증 |
| --- | --- | --- | --- |
| 1. 형식 결함 | 결정론적으로 잡을 수 있는 결함(흔들림, 잘림, 첫 화면 밖 등) | 스크립트 | golden set(사용자가 형식 문제 없음으로 고른 장면) + 고의 결함 주입 |
| 2a. 교육학적 타당성 | 교육학·교육 자료 생성 연구에서 유효한 조건 | 체크리스트, 지켜진 정도로 총점 | 항목별 판정 정확도 |
| 2b. 설계 준수 | 스토리보드 항목 충족 | LLM이 채점표 대조 | 위반 주입 |
| 3. infographic animation 품질 | 평가 가능한 대상 목록(예: 시인성, 모션) | 측정값과 구조화 데이터(예: 대상·이동 경로·지속시간·easing, 시간 구간당 새로 보이는 글자 수)를 근거로 판정 | 항목별 판정 정확도 |

진행 순서(사용자 동의):

1. 조사. 외부 평가표·가이드라인 수집 → 여러 회사 모델이 서로의 초안을 보지 않고 독립 초안 작성 → 병합 → 각 모델에 "부족한 것", "과한 것" 비판 요청. 산출물은 항목, 출처(외부 문헌 / LLM 제안만), 근거 강도, 가중치, 측정 방법(스크립트 / 구조화 데이터 + LLM / 시각 LLM)을 가진 기준표. 사용자 검토는 "측정 가능하게 쓰였는가"에 한정한다.
2. 측정 기반. 모션 구조 데이터 추출(`document.getAnimations()`로 CSS·WAAPI 애니메이션, rAF 기반 움직임은 요소 위치 샘플링), 프레임 캡처, 화면 글자 타임라인.
3. 항목별 judge 구현과 검증(golden set, 결함 주입). workflow-approach로 진행한다.
4. 새 장면 생성과 평가.

## Open Questions

- 다른 회사 모델 접근: 사용자가 "필요한 건 다 가져다 줄게"라고 했다. 어떤 공급자·키를 쓸지 1단계 시작 때 정한다.
- golden set이 필요한가: 사용자가 되물었다(2026-10-26). 이 세션의 답은 대화에 있다.
- 가중치가 선형합이 아닌 경우(항목 사이 의존)의 집계 구조.
- judge의 용도가 파이프라인 갈래 비교뿐인지, 생성된 장면을 걸러내는 관문으로도 쓰는지. 2026-10-27: 기준표는 생성기 입력으로도 쓴다(사용자 결정). 관문 여부는 아직 정하지 않았다.
- 총점과 실제 학습 효과의 관계는 이 구조로 검증되지 않는다. 사용자가 초보인 주제의 퀴즈로 확인하는 선택지가 남아 있다.
- 메모가 드러낸 생성기 결함(AGENTS.md "Generated Lesson Defects")을 언제 kit에 반영할지: predict 장면에서 그림이 첫 화면 아래에 있고 스크롤하면 애니메이션이 이미 끝나 있다(t2 전 묶음), hook 그림이 너무 작다(t4), 프레임 흔들림(t3).

## Spec

없음. workflow-approach 작업이 아니다. 채점관 구현을 workflow-approach로 진행하게 되면 그때 spec을 만든다.

## Execution Ledger

- 이전 실험(HSH) 비용: 생성·검수 $32.22, Opus 채점관 $56.02(`round-judge/*.json`의 `cost` 합).
- 이 handoff 시점까지 새 채점관 관련 호출은 0건이다.
- 2026-10-26 외부 모델 호출 비용:
  - gemini-4-argon: 연결 확인 1회(API 키)
  - `agy`(구독) 2026-10-26: argon 3회, flash 3회, `lori2007` 한 출처에 대한 파일럿. 토큰은 `sources/lori2007/agy-usage.jsonl`. 사용자 보고로 첫 argon 호출이 argon 주간 사용량의 약 1%
  - gpt-5.6-sol: 연결 확인 1회, $0.001 미만
  - gpt-6-astra: 호출 없음
  - 사용자가 정한 GPT 예산은 $10이다.
- 2026-10-27 1단계(초안·병합·비판·근거 연결) 비용:
  - GPT: 초안 $1.185, 비판 $1.071, 근거 검증 $0.853, 합 $3.109.
  - GPT 누적: 그 전 기록 합 약 $1.44(이 파일의 판정·번역 항목 합)에 더해 약 $4.5.
  - Claude(`claude -p` 보고): opus 초안 $0.61, sonnet 병합 $0.34, opus 비판 $0.43, sonnet 근거 제안 $2.473.
  - argon(agy 구독): 초안 1회, 비판 1회.
- 같은 날 웹 검색 요약 기반 조사 agent의 결과는 출처 섞임 문제로 후보 목록으로만 쓰기로 했다(사용자 지적).
- 이전 실험 handoff: `agent-docs/handoff/stale/2b0025305e515b67-noshot-haiku-sample-correction.md`.
