# M1 runtime run: verifier 예산 소진 인계

## User Query

- "agent-docs/handoff/9c1e4b7d20a6f385-m1-lite-generation-experiment.md 를 읽고 M1-lite 생성 실험을 시작해. 이해 확인부터 해."
- 이해 확인 답:
  - "A1. 나눠도 돼."
  - "A2. The Attacker Moves Second / 전 세계 주요 물류 공급망 설명 / 세련된 UI의 구성 요소"
  - "Q1. 임의 결정", "Q2. 추천 수용"
  - brief "승인"
- 중간 질문(방향 결정에 쓰임): "graph는 어떻게 구현할 계획이야?", "v1의 실패를 막기 위한 전략은?"

## State

- 브랜치 `dev`, base `08c85ef`. 커밋은 아직 없다. 커밋은 사용자 지시가 있을 때만 한다.
- 변경 파일:
  - 루트: `package.json`, `package-lock.json`, `.gitignore`, `plan.md`(M1·M2 행, geo 문장), `bench/topics.md`(새 3주제 고정 진단)
  - 새 산출물: `bench/m1/runtime-sheet-review.md`, `bench/m1/skill-review.md`
  - runtime 코드: `packages/runtime/{package.json,build.mjs,bin/,src/}`, `packages/runtime/dev/spec-stub.mjs`(src/core 재export)
  - 계약·규칙: `packages/runtime/types/lesson.d.ts`, `packages/runtime/types/ext/geo.d.ts`(JSDoc만), `packages/runtime/rules.md`
  - SKILL: `skill/learn-to-tell/SKILL.md`, `skill/learn-to-tell/verify-answers.md`
  - 시험: `packages/runtime/test/`의 새 시험 15개, `fixtures/{m1,check-cases,browser}.mjs`, `lessons/`(coffee-cooling, battery-supply, port-congestion), `tsconfig.json`
- 구현 트리 해시: `find packages/runtime/src -type f | xargs shasum | shasum` = `9cedfd18250e7f111811760a3627087840358d27`.
- Test command(spec Paths) 13회차 결과: 604/604 통과, Node 커버리지 줄 94.37%·분기 85.70%, 약 7분 10초.
- 예시와 fixture 3개 모두 `ltt check` ok, `ltt sheet` runtimeErrors 0·layoutViolations 0이다. 첫 로드 번들은 378,121 B, 예시 기준 check 약 1.7 s, sheet 약 25 s.
- 생성 실험(3주제 생성·측정·기준선·사실 검토)은 아직 시작하지 않았다. 계획에 따라 이 run 다음 단계다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| 글자 측정 후 그림 글자 뒤 흰 바탕만으로 대비 확보(v6) | coffee #14에서 label 바탕이 데이터 선을 끊어 보이게 함 | verified: 데이터 선이 배치 장애물이 아니었음 → v11 avoid |
| 글자 간격 2 px(v10) | 축 제목과 label이 한 문자열로 읽힘(coffee 모바일 #14) | verified: 12–14 px 한글 공백 폭보다 작음 → v11 6 px |
| 선 피하기(avoid)를 legend에도 적용(v11) | 예시 수업 5개 장면에서 legend가 밀리고 긴 leader가 데이터를 가로지름(F5-1) | verified: legend도 일반 label 규칙을 따랐음 → v17·v18 |
| at legend를 정확히 고정(v17 첫 구현) | 예시 `figures.traj#key` mobile text-no-room | verified: 고정 글자는 옮길 수 없음 → 가장 가까운 빈자리, leader 없음 |
| 선 대비를 tone 색 변경 없이 흰 casing으로 확보하고 시험은 그룹 안 모든 획을 잼(v13) | 대비 1.00 다수 | verified: casing 구분 수단이 없었음 → v14 `data-ltt-casing` |
| 선 대비 측정을 kind별 한 paint로 함(v14) | trace head 흰 테두리, 겹친 지도 점, 같은 색 점 아래 trace head에서 1.00 | verified: 측정 규칙 공백 → v15·v16 |
| 모바일 summary를 격자 하나로(v4) | 예시 `byvt` multiples가 text-no-room | verified: 칸 약 171×162 px로는 부족 → v6 쪽 나눔 |
| draw 채점 25점 평균 | 경계 사례(적분 7.357, 이산 8.019, tol 8)에서 판정 뒤집힘 | verified → v7 적분 평균 |
| answer() 뒤 카드 글 대비 1.00을 애니메이션 문제로 봄(F2-1 첫 가설) | Chrome 관찰: 글이 하단 nav 아래에 있었음 | verified: 가설 틀림. 원인은 card 스크롤 → v8 |
| verifier 1회차가 다수 의무를 "light check"로 수락 | 2회차 전수 감사에서 증거 빈틈 6개 | verified: 1회차 감사 깊이 부족. 2회차가 마지막이라 수정할 예산이 없었음 |

## Next Step

1. 새 workflow run을 연다. 이 run의 spec v18(보관본)을 출발점으로 삼고, verifier 예산을 새로 받는다. 다음 증거 빈틈을 닫는다. 구현은 바뀌지 않아도 될 수 있다.
   - **V2-2(VO-7, VO-17)**: custom 요소에 on* 속성이 있을 때 그 속성만 무시하고 요소는 그리는지 확인한다. 지금 시험은 요소 전체를 버려도 통과한다. 요소별 존재를 확인하는 시험을 추가한다(예: onclick이 붙은 rect의 bbox가 item에 있음).
   - **V2-3(VO-14)**: drag predict의 `data-ltt-correct` true·false를 확인한다(tol 안·밖).
   - **V2-4(VO-14, QR-8, C-50)**: classify item·bin, order item, knob에 Tab으로 닿는지, 그리고 최종 quiz 제출이 키보드만으로 되는지 확인한다. `locator.focus()`나 click으로 대신하지 않는다.
   - **V2-5(VO-15, FR-30)**: `data-ltt-tone`·`data-ltt-kind`가 lesson 또는 `__ltt.layout()`과 일치하는지 대조한다. 그래야 속성을 빼서 측정을 피하는 경우를 잡는다.
   - **V2-6(VO-12, FR-17)**: sheet가 layoutViolations를 실제로 보고하는 경로를 검증한다. lesson으로는 위반을 만들기 어렵다. 검증 방식(시험용 주입 hook 또는 review 절차)을 사용자와 정하고 coverage item을 더한다. spec 공백이다.
   - **V2-6R(VO-21)**: 트리 9cedfd18 이후에서 fixture 3개 PNG를 다시 본다. F5-1 확인을 포함해 R1 산출물에 트리 해시·PNG 목록·결과를 기록한다.
2. 그 run을 완료한 뒤 생성 실험을 한다(이 run의 A-1).
   - 주제는 `bench/topics.md`의 attacker-moves-second, global-supply-chain, polished-ui-components다.
   - 생성 서브에이전트를 새 context로 띄운다. 일반 요청 기준선 3개를 만든다. attacker 주제는 사실 검토를 한다.
   - 측정할 것: 반복 원인별 횟수·토큰(`.ltt/log.jsonl`), spec 크기, 정답 검산이 잡은 오류 수.
   - 준비할 것: SKILL의 상대 경로(A5-1)를 생성 환경에 맞게 바꾼다.
3. 사용자 확인 뒤 예시 수업 `angles` figure에 axis를 넣는다(A4-4). 예시 파일은 이 run의 Implementation 밖이었다.

## Open Questions

- V2-6: sheet의 DOM 실측 위반 보고를 어떻게 검증할지 정해야 한다. 후보는 두 가지다. (a) runtime에 시험 전용 hook을 두어 위반을 주입하고 sheet가 보고하는지 본다. (b) review 절차로 대신한다. 사용자 결정이 필요하다.
- V2-3: VO-14 coverage item "확정 전/후 × choice·drag·draw, 오답/정답"을 입력 종류마다 오답·정답을 다 보는 뜻으로 읽을지 정해야 한다. verifier는 그렇게 읽었다. 기본값은 그 해석이다.
- 생성 실험을 V2 증거 보강 run보다 먼저 할지 정해야 한다. 이 run이 증거만 limit이고 구현과 시험 604개는 통과한 상태라, 실험을 먼저 해도 측정은 된다. 사용자 결정이 필요하다.

## Spec

- 보관본: `agent-docs/spec-logs/018fd67ebfbf6b0f-m1-runtime.md`, version 18, status limit, run ID `018fd67ebfbf6b0f`.

## Execution Ledger

- 상세는 spec의 Workflow Control, Audit state, Execution ledger(R1–R13, F1–F5, T1, T5, T12, V1, V2, MUT-1–MUT-4)에 있다. 요약은 다음과 같다.
- 카운터:
  - 수정 묶음 10.
  - verifier 2/2. 1회차 retry(V1-1–V1-3 해소). 2회차 retry(V2-1 기각, V2-2–V2-6·V2-6R open).
  - spec version 1 → 18.
- 손 mutation:
  - MUT-1 10개: 9 killed, M8 equivalent.
  - MUT-2 13개: 12 killed, M8 equivalent.
  - MUT-3 M14: 처음 survived였고, T12-1 시험 추가 뒤 killed.
  - MUT-4 V2 확인 6개: V2-1 killed(기각), V2-2–V2-6 survived(증거 빈틈 확인).
  - restore 뒤 트리 해시는 매번 실행 전과 같았다.
- Fuzz: VO-4 seeded harness를 Test command 안에서 실행했다. seed 20261024, 2,000 사례, 위반 0.
- Mutation 도구: none(spec 선언).
- review 산출물:
  - R1 `bench/m1/runtime-sheet-review.md`: 초기 22장, 재검토 2회, 전수 재검토 22장(트리 cca743c8). F4-1–F4-6, F5-1 해소.
  - R2 `bench/m1/skill-review.md`: FR-60 11항목, FR-61 5항목 충족.
- 남은 advisory:
  - A4-1 graph가 stage 일부만 씀
  - A4-2 aspect equal 빈 공간
  - A4-3 phone mock·toggle 다듬기
  - A4-4 예시 angles axis 없음
  - A4-5 drag 손잡이와 글자 겹침
  - A6-2 축 제목 조용히 빠짐(생성 실험에서 셀 것)
  - A5-1 SKILL 상대 경로
  - A-V2-1 VO-9 "다른 rule 없음" 미확인
  - A-V2-2 VO-13 order 정답 순서 미확인
  - A-V2-3 sheet settled 시각 미관찰
  - A-V2-4 LEADER_PX 20/21 경계 사례 없음
  - A-V2-5 VO-5 oracle이 panel.plot을 씀
- 사용자 선호(계속 지킨다):
  - 서브에이전트는 opus, effort low로 돌린다.
  - 커밋은 지시가 있을 때만 한다.
  - ADR·rejection 기록은 초안을 승인받은 뒤 쓴다.
  - 결정은 기본값으로 밝히거나 묻는다.
  - 답은 방향을 정해서 한다.
  - 사용자에게는 한국어로 답한다.
