---
session: baf55883-cbd9-42de-a717-fa11dd620f27
before: none
previous: none
branch: dev
commit: 137d62e7e415386a665d963220589948a115caaa
---

# README를 LLM Judge 실패 회고 중심으로 다시 씀

## Next Session

### State
- `README.md`가 LLM Judge 시도·실패·배운 것 중심으로 바뀌었고, 원래 skill 설명·설치·사용은 부록으로 줄었다. 커밋하지 않았다.
  - commit: 137d62e; files: README.md

### Next Step
- 사용자가 README 내용을 확인한 뒤 커밋 여부를 정한다.
  - commit: 137d62e; files: README.md

### Constraints
- "https://doggy-portfolio.vercel.app/posts/llm-judge-fail 이 포스팅 (포트폴리오 블로그 포스팅이야.)과 실패 기록, 특히 LLM Judge를 중심으로 README를 작성해줘."
  - source: 이 세션 첫 사용자 메시지
- "블로그 글은 원문을 읽어"
  - source: 이 세션 두 번째 사용자 메시지

### Verify
- README 수치는 `agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md`의 Failed Attempts, "드라이버 수정과 3회 재측정" 결과 표, "judge v1 dev 결과"–"1차 일단락" 절, Execution Ledger와 대조한다. 블로그 인용은 원문 페이지와 대조한다.
  - commit: 137d62e; files: README.md, agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md

### Dead Ends
- none: 이 세션에서 실패한 시도 없음.

### Related
- `agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md`
  - commit: 137d62e; files: agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md
- `agent-docs/try-n-fail/ac1876ba2e3a5c09-user-blind-scoring.md`
  - commit: 137d62e; files: agent-docs/try-n-fail/ac1876ba2e3a5c09-user-blind-scoring.md

## Record

### Changes
- `README.md` 전면 재작성: 요약, 배경, 시도와 실패 표, VLM 시간 축 한계, 결정론적 측정 결과 표(3회 중앙값), Sonnet judge v1–v4, 실패 원인, 배운 것(블로그의 분산 judge mermaid 포함), 재시도 조건, 관련 파일, 부록(skill 동작·설치·사용).

### Commands
- `curl -sL https://doggy-portfolio.vercel.app/posts/llm-judge-fail`로 원문을 받아 scratchpad에서 텍스트로 추출했다.

### Failed Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |

### Sources
- https://doggy-portfolio.vercel.app/posts/llm-judge-fail (2026-11-23 원문 확인)
- `agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md`
- `agent-docs/try-n-fail/index.md`, `agent-docs/try-n-fail/ac1876ba2e3a5c09-user-blind-scoring.md`

### User Requests

#### 1 — 2026-11-23T10:43:07Z

> https://doggy-portfolio.vercel.app/posts/llm-judge-fail 이 포스팅 (포트폴리오 블로그 포스팅이야.)과 실패 기록, 특히 LLM Judge를 중심으로 README를 작성해줘. 동영상을 요약해서 정리해주는 서비스를 제공하는 회사에 면접을 보게돼서 준비해야해.

#### 2 — 2026-11-23T10:44:15Z

> 블로그 글은 원문을 읽어

#### 3 — 2026-11-23T10:51:14Z

> 주석은 추가한 거 없지?

#### 4 — 2026-11-23T10:51:27Z

> 커밋 푸시
