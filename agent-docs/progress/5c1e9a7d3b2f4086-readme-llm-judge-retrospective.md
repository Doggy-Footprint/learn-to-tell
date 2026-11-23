---
session: baf55883-cbd9-42de-a717-fa11dd620f27
before: none
previous: none
branch: dev
commit: 01c2a959bb000371c4b4b42869607d7f36711e4d
---

# README를 LLM Judge 실패 회고 중심의 포트폴리오로 다시 씀

## Next Session

### State
- `README.md`를 PR #22(dev → master, 병합됨)의 긴 보고서형에서 약 90줄 포트폴리오형으로 줄였다. 숫자 표, 움직이는 그림 판정(50ms 측정, 결함 주입, 사건 목록 judge), 배운 것 중심이다. dev에 커밋해 `dev → master` PR로 올렸다.
  - commit: 01c2a95; files: README.md

### Next Step
- 사용자가 줄인 README PR을 확인하고 병합한다.
  - commit: 01c2a95; files: README.md

### Constraints
- "https://doggy-portfolio.vercel.app/posts/llm-judge-fail 이 포스팅 (포트폴리오 블로그 포스팅이야.)과 실패 기록, 특히 LLM Judge를 중심으로 README를 작성해줘."
  - source: User Requests 1
- "블로그 글은 원문을 읽어"
  - source: User Requests 2
- "README는 일종의 포트폴리오야. 지금은 너무 보고서 같고 길어. 숫자 위주로 남기고, 임팩트 있는 것만 남겨줘. 특히 움직이는 그림 (동영상 비슷) 한 것에 대한 처리 파트 위주로"
  - source: 이 세션의 README 축소 요청 메시지

### Verify
- README 수치는 `agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md`의 Failed Attempts, "드라이버 수정과 3회 재측정" 결과 표, "judge v1 dev 결과"–"1차 일단락" 절, Execution Ledger와 대조한다. "역순 스크린샷 구분 실패"와 "position bias"는 블로그 원문에만 근거가 있다.
  - commit: 01c2a95; files: README.md, agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md

### Dead Ends
- none: 이 세션에서 실패한 시도 없음.

### Related
- `agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md`
  - commit: 01c2a95; files: agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md
- `agent-docs/try-n-fail/ac1876ba2e3a5c09-user-blind-scoring.md`
  - commit: 01c2a95; files: agent-docs/try-n-fail/ac1876ba2e3a5c09-user-blind-scoring.md

## Record

### Changes
- 1차(커밋 e6e5d5e, PR #22로 master 병합): `README.md` 전면 재작성. 요약, 시도와 실패 표, VLM 시간 축 한계, 결정론적 측정 결과 표, Sonnet judge v1–v4, 실패 원인, 배운 것(블로그 mermaid), 재시도 조건, 부록.
- 2차(dev 커밋, `dev → master` PR): `README.md`를 핵심 숫자 표, 움직임 판정 문제·측정 파이프라인·결과 표, 사건 목록 judge, 배운 것, 더 보기, 설치로 줄였다.
- 로컬 `master`에 upstream(`origin/master`)을 설정했다. post-merge 훅이 이 파일을 `progress-logs/`로 옮겼고, 세션이 이어지므로 `progress/`로 되돌렸다.

### Commands
- `curl -sL https://doggy-portfolio.vercel.app/posts/llm-judge-fail`로 원문을 받아 scratchpad에서 텍스트로 추출했다.
- `gh pr create --base master --head dev` → PR #22.
- `git branch --set-upstream-to=origin/master master && git pull --ff-only`

### Failed Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |

### Sources
- https://doggy-portfolio.vercel.app/posts/llm-judge-fail (2026-11-23 원문 확인)
- `agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md`
- `agent-docs/try-n-fail/index.md`, `agent-docs/try-n-fail/ac1876ba2e3a5c09-user-blind-scoring.md`
- `vercel.json`: 배포 대상은 `skills/learn-to-tell/kit`과 `site/gallery`뿐

### User Requests

#### 1 — 2026-11-23T10:43:07Z

> https://doggy-portfolio.vercel.app/posts/llm-judge-fail 이 포스팅 (포트폴리오 블로그 포스팅이야.)과 실패 기록, 특히 LLM Judge를 중심으로 README를 작성해줘. 동영상을 요약해서 정리해주는 서비스를 제공하는 회사에 면접을 보게돼서 준비해야해.

#### 2 — 2026-11-23T10:44:15Z

> 블로그 글은 원문을 읽어

#### 3 — 2026-11-23T10:51:14Z

> 주석은 추가한 거 없지?

#### 4 — 2026-11-23T10:51:27Z

> 커밋 푸시

#### 5 — 2026-11-23T10:51:52Z

> master로 PR 만들어줘

#### 6 — 2026-11-23T10:52:21Z

> 지금 master로 올리면 배포 될텐데 vercel에서 보여지는 게 달라지려나?

#### 7 — 2026-11-23T11:09:16Z

> 마스터 브렌치 체크아웃하고 pull해.
> 
> README는 일종의 포트폴리오야.
> 
> 지금은 너무 보고서 같고 길어. 숫자 위주로 남기고,  임팩트 있는 것만 남겨줘.
> 
> 특히 움직이는 그림 (동영상 비슷) 한 것에 대한 처리 파트 위주로

#### 8 — 2026-11-23T11:12:59Z

> 그렇게 하자
