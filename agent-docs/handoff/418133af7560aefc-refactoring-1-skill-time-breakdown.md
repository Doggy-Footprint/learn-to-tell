# refactoring-1 compare1 실험: skill 경로 소요 시간 분해 원자료

## Goal

"왜 이렇게 우리 skill이 오래 걸렸는지 평가해봐" → "handoff 형태로 raw data만 남겨놔. 해석은 덧붙이지 말고."

## State

- 브랜치 `fix/efficiency`, 기준 커밋 `d918d99`.
- 변경 파일: 이 문서, `agent-docs/handoff/index.md`.
- 원자료 출처: `~/.claude/projects/-Users-hwansu-orca-workspaces-learn-to-tell-run-time/76d97b37-2581-43f6-a4e0-feeda1bf2e34/subagents/agent-<id>.jsonl` (각 줄의 `timestamp`, `type`, `message.content`).
- 집계 스크립트는 세션 scratchpad에 있었고 scratchpad가 사라져 남아 있지 않다. 측정 정의는 Execution Ledger "측정 정의"에 적었다.
- 실험 조건·토큰·산출물은 `b41cd6aec66a2589-refactoring-1-lesson-cost-ledger.md` Execution Ledger 실험 1·2와 `site/compare1/`에 있다.

## Failed Attempts

| attempt | failure evidence | cause |
|---|---|---|
| 모델 시간 = 각 assistant 메시지의 첫 기록 시각 − 직전 이벤트 시각의 합 | 기준선 ontology wall 296s에 모델 시간 35s, 도구 2s로 합이 wall과 맞지 않음 | 한 메시지의 content 블록이 서로 다른 시각의 줄로 기록되어 블록 사이 간격이 빠짐 (hypothesis) |
| transcript `message.usage.output_tokens` 합으로 출력 토큰 측정 | 생성 에이전트 합이 681~2070, 기준선 40~47로 Write 내용 길이(21k~45k자)와 맞지 않음 | 기록된 usage가 스트리밍 시작 시점 값 (hypothesis) |

## Next Step

없음. 원자료 기록만 요청받았다.

## Open Questions

- transcript의 thinking 블록 내용은 비어 있어 모델 시간 중 생각 시간과 입력 처리 시간을 나눠 잴 수 없다.

## Spec

해당 없음 (workflow-approach 작업 아님).

## Execution Ledger

### 측정 정의

- wall: 단계 첫 이벤트부터 마지막 assistant 기록까지.
- 단계: 텍스트가 든 user 메시지(첫 지시, main의 수정 요청)로 나눈다. phase1 = 생성, phase2 = 수정 왕복.
- 도구 시간: `tool_use` 기록 시각부터 같은 id의 `tool_result` 기록 시각까지.
- 모델 시간: 각 assistant 기록 시각 − 직전 이벤트(user 또는 assistant) 시각의 합.
- 대기: `SubagentHandback` 호출 시각부터 다음 텍스트 user 메시지 시각까지.
- write: `Write` 입력 `content` 길이(자), edit: `Edit` 입력 `new_string` 길이(자).
- 첫 쓰기 전 호출: 첫 `Write` 이전 tool_use 입력 문자열에 `kit/ltt*.js|ltt*.css|server/audit.mjs`(kit 소스), `kit`를 포함한 `.md`(문서), `site/gallery`(gallery)가 나온 횟수.

### 에이전트 ID

| 주제 | skill 생성 | 기준선 |
|---|---|---|
| cache-ttl | a3b7c5060ff097d56 | ae2bf0ed904a9949b |
| trolley | a86f1bf3cbd060d12 | ab8d19cf2262feef8 |
| projectile | a7fbbe0a35f2d9854 | ae023627bc979e553 |
| contrast | acc0522fc828811e1 | a408f1740b1e8fb1a |
| ontology | af77d459816c4e068 | a3a4e8a9bac052684 |

### 단계별 시간 (초)

| 에이전트 | phase | wall | 모델 | 도구 | 턴 | write(자) | edit(자) |
|---|---|---|---|---|---|---|---|
| 기준선 cache-ttl | 1 | 161 | 160 | 2 | 4 | 23.3k | 0 |
| 기준선 trolley | 1 | 158 | 157 | 2 | 4 | 21.7k | 0 |
| 기준선 projectile | 1 | 193 | 191 | 2 | 5 | 21.1k | 0 |
| 기준선 contrast | 1 | 178 | 175 | 12 | 6 | 24.8k | 0.2k |
| 기준선 ontology | 1 | 296 | 294 | 2 | 4 | 44.7k | 0 |
| skill cache-ttl | 1 | 646 | 581 | 67 | 31 | 26.3k | 0 |
| skill cache-ttl | 2 | 327 | 299 | 28 | 14 | 2.8k | 0 |
| skill trolley | 1 | 619 | 517 | 103 | 30 | 22.8k | 0 |
| skill trolley | 2 | 414 | 323 | 91 | 16 | 27.7k | 0 |
| skill projectile | 1 | 656 | 562 | 95 | 35 | 31.0k | 0.2k |
| skill projectile | 2 | 338 | 258 | 80 | 16 | 3.8k | 0 |
| skill contrast | 1 | 635 | 543 | 93 | 31 | 29.2k | 0 |
| skill contrast | 2 | 662 | 520 | 142 | 26 | 40.8k | 0 |
| skill ontology | 1 | 1130 | 1009 | 121 | 46 | 42.9k | 0 |
| skill ontology | 2 | 424 | 349 | 75 | 19 | 5.5k | 0 |

### skill 생성 에이전트 이벤트 시각 (에이전트 시작 기준 초)

| 주제 | 첫 lesson.html Write | 1차 handback | 수정 요청 도착 | 2차 lesson.html Write | 2차 handback | 대기 |
|---|---|---|---|---|---|---|
| cache-ttl | 321 | 646 | 855 | 없음 | 1182 | 209 |
| trolley | 339 | 619 | 812 | 1003 | 1226 | 193 |
| projectile | 393 | 656 | 872 | 없음 | 1210 | 216 |
| contrast | 362 | 635 | 847 | 1124 | 1509 | 211 |
| ontology | 644 | 1130 | 1366 | 없음 | 1790 | 236 |

lesson.html 전체 Write 길이(자): cache-ttl [26298], trolley [22785, 24888], projectile [31011], contrast [29199, 37157], ontology [42903]. Edit 호출 수: projectile 1, 나머지 0.

### 도구 종류별 시간 (전 단계 합, 초)

| 주제 | audit 실행 | audit 평균/최대 | Bash 읽기·검색 | Bash node 기타 | PNG Read | 기타 Read |
|---|---|---|---|---|---|---|
| cache-ttl | 8회 76s | 9 / 11 | 16회 9s | 4회 4s | 22회 2s | 5회 0s |
| trolley | 12회 179s | 15 / 20 | 16회 8s | 4회 3s | 12회 2s | 3회 0s |
| projectile | 12회 152s | 13 / 23 | 15회 8s | 6회 9s | 15회 4s | 9회 1s |
| contrast | 17회 220s | 13 / 21 | 12회 6s | 4회 3s | 19회 2s | 6회 1s |
| ontology | 11회 170s | 15 / 25 | 31회 16s | 9회 5s | 20회 3s | 2회 0s |

### 첫 Write 전 호출 수

| 주제 | kit 소스 | kit 문서 | gallery |
|---|---|---|---|
| cache-ttl | 3 | 3 | 5 |
| trolley | 5 | 4 | 5 |
| projectile | 3 | 6 | 3 |
| contrast | 1 | 3 | 2 |
| ontology | 2 | 2 | 6 |

### 검증 에이전트 시간 (초, 4종 병렬 실행)

| 주제 | 기대값 | 주장 | 독자 | 눈 |
|---|---|---|---|---|
| cache-ttl | 22 | 53 | 97 | 136 |
| trolley | 11 | 72 | 103 | 119 |
| projectile | 49 | 98 | 83 | 123 |
| contrast | 24 | 41 | 91 | 120 |
| ontology | 48 | 96 | 148 | 164 |

### trolley skill 생성 에이전트 턴 기록 (a86f1bf3cbd060d12)

| 시각(s) | 도구 | 대상 |
|---|---|---|
| 4 | Bash | skill 디렉터리 `ls -R`, `wc -c` |
| 7 | Read | SKILL.md |
| 14 | Bash, Read | 경로 준비, kit/API.md |
| 18 | Bash | `cat` kit/api/controls.md, diagram 등 |
| 22–33 | Bash ×4 | site/gallery 목록, retrieval-practice.html 크기, cache-ttl.html `grep`/`sed` |
| 91–105 | Bash ×4 | kit/ltt.js `expect` `grep`/`sed`, `node -e` 실험 |
| 223 | Bash | gallery scenes.html `ltt-param`/`stopLabel` `grep` |
| 339 | Write | lesson.html 22785자 |
| 364–391 | Bash ×3 | lint·audit, shots 목록 |
| 394–410 | Read ×5 | 스크린샷 PNG |
| 418–421 | Bash ×2 | kit/ltt-deck.js `overview` `grep`/`sed` |
| 440–551 | Bash ×5, Read ×2 | audit 반복, PNG |
| 574–581 | Read, Bash | PNG, 마무리 확인 |
| 619 | SubagentHandback | |
| 812 | (수정 요청 도착) | |
| 815–875 | Bash, Read | review-findings.md, lesson.html |
| 1003 | Write | lesson.html 24888자 |
| 1008–1171 | Bash ×7, Read ×4 | audit 반복, PNG, `wc -c` |
| 1190 | Write | result.md 2767자 |
| 1195 | Bash | 최종 확인 |
| 1226 | SubagentHandback | |
