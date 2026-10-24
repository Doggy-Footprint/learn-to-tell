# M1 생성 실험 결과 (2026-10-24)

skill 경로(수업 spec + runtime)와 일반 요청 기준선으로 새 3주제를 처음부터 끝까지 만들고 비용·반복·결함을 쟀다. 측정 방법은 `bench/v1-results.md`의 "실행 방법"을 따랐다.

## 조건

- runtime: 커밋 전 작업 트리, `packages/runtime/src` 트리 해시 `9cedfd18`(spec 018fd67ebfbf6b0f v18, limit). 실험 중 runtime은 바꾸지 않았다.
- 예시 수업: `angles` 그림에 axis를 넣은 뒤(A4-4)의 `skill/learn-to-tell/examples/projectile-drag.js`.
- 실행: 주제마다 빈 작업 디렉터리에서 `claude -p --model claude-opus-5-5 --effort low`를 돌렸다. 설정은 `--setting-sources project`, 빈 MCP, 허용 도구 `Read Write Edit Glob Grep Bash Agent`, Skill·WebSearch·WebFetch 금지다. 6개(skill 3, 기준선 3)를 동시에 돌렸다. 스크립트는 `gen/run.sh`다.
- skill 경로:
  - 스냅샷 SKILL은 저장소 SKILL.md에서 경로만 절대 경로로 바꿨다(A5-1).
  - 공통 지시는 `gen/gen-common.md`다. 묻지 않고, 진단은 고정값을 쓰고, runtime 소스를 읽지 않고, 끝에 보고를 남긴다.
  - 주제 prompt는 `bench/topics.md`의 상황과 진단(고정)이다.
- 기준선: 작업 문장, 배경, "질문하지 말고 `index.html` 한 파일로 저장"만 받았다. skill은 없다.
- 토큰 지표:
  - **최종 context**: 마지막 main 응답의 input + cache + output이다. v1의 `subagent_tokens`와 같은 뜻으로 본다(v1 가설).
  - **누적 처리량**: `modelUsage` 합이다. cache read를 포함한다.
  - 분석 스크립트는 `gen/analyze.py`, 원값은 `gen/metrics.json`이다.

## 비용

| 주제 | 경로 | 시간 | 최종 context | 누적 처리량 | 비용 | 산출물 |
|---|---|---|---|---|---|---|
| attacker-moves-second | skill | 171초 | 73.8k | 669k | $0.94 | lesson.js 17.2 KB, 20장면 |
| | 기준선 | 106초 | 32.6k | 64k | $0.32 | HTML 19.1 KB, 8절, 상호작용 없음 |
| global-supply-chain | skill | 250초 | 71.0k | 661k | $1.06 | lesson.js 23.1 KB, 20장면 |
| | 기준선 | 110초 | 32.7k | 64k | $0.33 | HTML 19.4 KB, 9절, SVG 1 |
| polished-ui-components | skill | 192초 | 77.7k | 690k | 약 $1.0 | lesson.js 19.2 KB, 21장면 |
| | 기준선 | 154초 | 40.0k | 117k | $0.53 | HTML 34.3 KB, 입력 24 |

- **M1 끝 조건**(주제마다 120k 토큰·12분 이하, 렌더 뒤 수정 1회 이하): 세 주제 모두 충족했다.
- **v1 대비**: gallery-v2 평균은 208k·25분 22초, regen-fix2는 29–33분이었다. 이번 최종 context는 그 약 1/3, 시간은 약 1/8이다. 단, effort가 low이고 v1의 검증 서브에이전트 4종이 없어 같은 조건은 아니다.
- **기준선 대비**: 최종 context 2.2배, 시간 1.2–2.3배, 누적 처리량 6–10배, 비용 약 2–3배다. 누적 처리량이 큰 이유는 계약 `lesson.d.ts`(약 33 KB)를 읽은 context가 매 turn cache read로 다시 세어지기 때문이다.
- **polished**: 정답 검산 서브에이전트를 background로 띄웠다. 그래서 `-p` 세션이 한 번 끝났다가 알림으로 다시 이어졌다(result 2개). 시간은 두 구간의 합이다.

## 반복 원인별

| 주제 | `ltt check` 회차별 오류 수 | sheet | 렌더 뒤 수정 | 정답 검산(일치/불일치/불가) | 단계별 누적 처리량(쓰기 / check 수정 / sheet·검산 뒤) |
|---|---|---|---|---|---|
| attacker | 11 → 0 (+ 수정 뒤 0) | 위반 0 | 1회(막대 이름 4개) | 13 / 0 / 0 | 175k / 184k / 273k |
| supply-chain | 2 → 1 → 1 (예산 소진) | 위반 0 | 0회 | 12 / 1 / 0, 고치지 못함 | 226k / 317k / 71k |
| polished | 7 → 0 (+ 수정 뒤 0) | 위반 0 | 1회(팔레트, 그림 빼기) | 10 / 0 / 1, 1개 고침 | 176k / 249k / 225k |

- 타입 오류(`[TS…]`)는 세 주제 모두 0이었다. check 오류는 의미 규칙과 배치 규칙에서 나왔다.
  - attacker 첫 회: figure-eval 1, data-in-domain 1, accent-focus-only 5, text-no-room 2, graph-too-large 2.
  - polished 첫 회: data-in-domain 3, goal-at-start 2, text-no-room 2.
  - supply-chain: goal-reachable 1, graph-too-large 1.
- runtime-issues.md는 세 주제 모두 비어 있다. 생성 agent가 runtime 결함을 하나도 기록하지 않았다. 아래 눈 검토에서는 runtime 결함이 나왔다. sheet를 한 번만 보는 규칙으로는 생성 agent가 runtime 결함을 가려내지 못한다.
- supply-chain이 check를 통과하지 못한 원인은 param 이름 충돌이다. 두 model이 같은 param 이름(`k`, `L`)을 쓰면 수업 전체에서 값 하나를 공유한다. 그래서 한 model의 기본값이 다른 model의 기본값을 덮는다. check는 goal-reachable 한 건만 잡았다. `L` 충돌은 공개 설명의 수치 오류(L=4라고 쓰고 L=5 값 표시)로 남았고, 정답 검산만 잡았다.

## 렌더 눈 검토

방법:
- 생성이 끝난 lesson.js로 sheet를 다시 찍었다. 렌더 뒤 수정을 반영하기 위해서다.
- 주제마다 서브에이전트 1개(opus, effort low)가 PNG 8장과 lesson.js를 대조했다.
- 결과는 `gen/<주제>/sheet-review.md`에 있다. 그중 "graph 노드 글자가 step에 따라 바뀌지 않음"은 main이 PNG(attacker desktop-2 #11)로 다시 확인했다.

| 주제 | runtime 원인 | lesson 원인 | 차단 |
|---|---|---|---|
| attacker | 6 | 5 | runtime 1(graph step 글자), lesson 1(predict 답 노출) |
| supply-chain | 6 | 7 | lesson 3(`L`·`k` 충돌) |
| polished | 9 | 5 | lesson 1(predict 답 노출) |

**여러 주제에서 반복된 것**

- **predict 전에 답이 보임** (lesson, 3주제 모두)
  - attacker #6: drag 점이 처음부터 정답 위치에 있다.
  - polished #6: 막대 label이 `H1 21`을 보인다.
  - supply-chain #13·#0: 단계별 막대와 우회 경로가 미리 보인다.
  - check와 SKILL에 이를 막는 규칙이 없다.
- **모바일에서 reveal 뒤 카드 첫 줄이 잘림** (runtime, 3주제 모두): v8에서 card를 reveal로 스크롤하게 한 결과다.
- **graph가 stage의 작은 일부만 씀** (runtime, 3주제 모두, A4-1 재발): 노드 글자가 데스크톱에서 너무 작다.
- **막대 범주 label이 작거나 막대와 겹침** (runtime, attacker·supply-chain·polished 모바일).

**한 주제에서 나온 runtime 결함 후보**
- graph 노드 글자가 step을 따르지 않는다(attacker, 차단, main 확인). 한 노드는 마지막 step 글자, 다른 노드는 첫 step 글자를 보인다.
- `steps` figure를 쓰는 비-steps 장면에 단계 컨트롤이 나온다.
- classify 버튼 글자가 단어 중간에서 줄바꿈된다.
- 지도 label leader가 대륙을 가로지른다.
- mock 안에 실제 글자 견본을 그리는 수단이 없다(능력 부족).

## 사실 검토 (attacker)

근거는 arXiv 2510.09023v1(Nasr, Carlini 외, 2025-10-10)이다.

- **틀린 주장: 0건.**
  - "최근 방어 12개, 대부분 성공률 90% 이상", "원 논문은 0에 가까운 성공률"은 맞다.
  - gradient(GCG 계열, 가중치 필요), RL(성공을 보상으로), 탐색(LLM 변형 + 점수), 사람 red-teaming 설명도 맞다.
- **과장 1건.** "사람 대회가 모든 방어를 뚫었다"는 지나치다. 논문은 대회 과제(일부 방어로 구성)를 모두 뚫었다고 쓴다.
- **분류 불일치 1건.** 가정 값 막대의 방어 네 종류(입력 필터·구분자 프롬프트·탐지 모델·미세조정)가 논문의 네 범주와 다르다. 논문은 prompting·training·filtering·secret-knowledge로 나눈다.
- **얕음.**
  - 방어 이름, 벤치마크, 실제 수치가 없다(예: MetaSecAlign 정적 2% → 적응형 96%, 사람 대회 500명 이상·상금 $20,000).
  - 대신 가정 값 막대를 썼다. 기준선은 방어 12개를 이름과 계열로 소개했다. 범주 배치는 일부 틀렸다(Data Sentinel·MELON).
  - SKILL 11번(illustrative 표시)이 아는 수치 인용을 막는 쪽으로 작동했을 수 있다(가설).

## 결론과 다음 작업

- 비용 목표는 큰 여유로 충족했다. v1에서 비용의 58%를 차지한 렌더 뒤 디버깅 반복이 사라졌다. 렌더 뒤 수정은 주제당 0–1회다.
- 품질 쪽 차단 결함은 생성 agent의 sheet 1회 검토로 잡히지 않았다. 그 결함은 세 가지다.
  - predict 답 노출: check 규칙 후보
  - param 이름 충돌: check 규칙 또는 계약 변경 후보
  - graph step 글자: runtime 결함
- runtime 결함과 check 규칙 후보는 증거 보강 run(spec 018fd67ebfbf6b0f 재개, verifier +1)에서 V2 빈틈과 함께 다룬다. 범위는 사용자 승인으로 정한다.
- SKILL에 반영할 후보:
  - 정답 검산 서브에이전트는 foreground로 띄운다.
  - 아는 출처 수치는 출처와 함께 쓰고, illustrative는 모르는 값에만 쓴다.
  - predict 그림에서 답을 가린다.

## 검수 후 정정 (2026-10-24)

독립 검수(`bench/m1/direction-review.md`)를 받고 위 결론 중 다음을 정정한다. v2는 여기서 닫고, 이어지는 작업은 `agent-docs/handoff/86bf8c8f61fad9f3-v3-start.md`에 넘긴다.

- **param 이름 충돌은 runtime 결함이다.**
  - check는 model마다 자기 기본값으로 계산한다(`packages/runtime/src/core/model.mjs:294`).
  - 화면은 모든 model의 기본값을 합쳐서 계산한다(`packages/runtime/src/layout/figure.mjs:51`).
  - 위 결론처럼 lesson 결함이나 check 규칙 후보로 볼 일이 아니다.
- **"비용 목표 충족"은 v1과 비교할 때만 맞다.**
  - 일반 요청과 비교하면 skill이 2–3배 비싸고 느리다.
  - supply-chain은 check가 실패한 채 제출됐는데도 충족으로 셌다.
- **이 실험은 "일반 요청보다 나은가"를 재지 않았다.**
  - 기준선은 진단 결과와 수업 구조 지시를 받지 않았다.
  - 품질 비교도 하지 않았다.
- **"렌더 뒤 디버깅 반복이 사라졌다"는 일부만 맞다.** sheet가 layoutViolations 0을 보고한 화면에서도 검토자가 겹침 4건을 찾았다.
- **위의 "증거 보강 run" 계획은 취소한다.** spec 018fd67ebfbf6b0f를 재개하지 않고, verifier +1도 쓰지 않는다.
