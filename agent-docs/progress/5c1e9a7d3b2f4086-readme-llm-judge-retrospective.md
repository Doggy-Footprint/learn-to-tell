---
session: baf55883-cbd9-42de-a717-fa11dd620f27
before: none
previous: none
branch: dev
commit: a5d567d05d1b29373ddc68b580ec93a2d1e41584
---

# README를 LLM Judge 실패 회고 중심의 포트폴리오로 다시 씀

## Next Session

### State
- `README.md`를 PR #22의 긴 보고서형에서 포트폴리오형으로 줄였고, PR #23으로 master에 병합했다(064f337). 이후 "핵심 숫자" 절을 빼고 "문제" 절 문장 하나를 사용자 표현으로 바꿨으며, 이 변경은 아직 커밋하지 않았다.
  - commit: 171ba47; files: README.md

### Next Step
- 미커밋 README 변경을 사용자 요청 시 커밋하고 `dev → master` PR로 올린다.
  - commit: 171ba47; files: README.md

### Constraints
- "https://doggy-portfolio.vercel.app/posts/llm-judge-fail 이 포스팅 (포트폴리오 블로그 포스팅이야.)과 실패 기록, 특히 LLM Judge를 중심으로 README를 작성해줘."
  - source: User Requests 1
- "블로그 글은 원문을 읽어"
  - source: User Requests 2
- "README는 일종의 포트폴리오야. 지금은 너무 보고서 같고 길어. 숫자 위주로 남기고, 임팩트 있는 것만 남겨줘. 특히 움직이는 그림 (동영상 비슷) 한 것에 대한 처리 파트 위주로"
  - source: 이 세션의 README 축소 요청 메시지

### Verify
- README의 결함 표 수치는 `agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md`의 "드라이버 수정과 3회 재측정" 결과 표와, 사건 목록 judge 수치(40칸, 순간이동 오탐 7칸, 11 → 8 / 19)는 "judge v1 dev 결과"–"1차 일단락" 절과 대조한다. "역순 스크린샷 구분 실패"와 "position bias"는 블로그 원문에만 근거가 있다.
  - commit: 171ba47; files: README.md, agent-docs/todos/8712abeff5bd7bee-user-perspective-llm-judge.md

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
- 3차(미커밋): "핵심 숫자" 표 절을 삭제하고, "그러자 judge는 시간을 잃었다."를 "하지만 LLM은 시간을 잘 인지하지 못했다."로 바꿨다.
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

#### 9 — 2026-11-23T11:15:09Z

> 직접 머지해줘

#### 10 — 2026-11-23T12:48:59Z

> 핵심숫자 부분 통으로 빼줘.
> 
> 그러자 judge는 시간을 잃었다. → 하지만 LLM 은 시간을 잘 인지하지 못했다.

#### 11 — 2026-11-23T13:03:15Z

> ㅇㅇㅇ

#### 12 — 2026-11-23T13:05:03Z

> AUC 가 뭐야

#### 13 — 2026-11-24T08:58:21Z

> 좀 더 쉽게 설명 부탁해 ㅋㅋㅋㅋㅋ

#### 14 — 2026-11-24T08:59:17Z

> 정렬이 잘 된 정도구나?

#### 15 — 2026-11-24T09:15:10Z

> 지금 README를 보는데, AUC만 있고 임계값은 없어서 이건 어떻게 설명해야 할지 고민중이야 (고치지는 말고 알려만 줘)

#### 16 — 2026-11-24T09:19:15Z

> 정상 장면 오탐 10%라면
> 
> ㅁ- 정상
> ㅇ- 비정상
> 
> ㅁㅁㅁㅁㅁ|ㅇㅁㅇㅇㅇㅇㅇ
> 
> 이런 식으로 잘라서 정상의 10%는 들어오게 잘랐다는 거야?

#### 17 — 2026-11-24T09:23:52Z

> 그러면 매번 그 임계값을 새로 정하는 거야? 아니면 한 번 정하고 계속 쓰는 거야?

#### 18 — 2026-11-24T09:26:04Z

> 이거 한 번 더 설명 부탁해.
> 
> 
> <pasted_content id="6a57">
> 정답 없이 검증하는 방법
> 
> 결함 주입: 깨끗한 장면 24개에 결함 6종(흔들림, 끊김, 화면 밖, 축소, 정지, 3배속)을 일부러 넣었다. golden set 없이도 탐지율을 잴 수 있다.
> 사전 등록: 임계값과 통과 기준(주입 탐지 90% 이상, AUC 0.75 이상)을 실행 전에 적었다.
> 3회 반복: 같은 장면을 세 번 재서 판정이 뒤집히는지 셌다.
> 결함    주입 탐지    사람 라벨 재현    AUC    결과
> 흔들림    100%    8/8    0.98    ✅
> 그림이 작음    100%    8/8    1.00    ✅
> 애니메이션 없음    100%    7/7    1.00    ✅
> 화면 밖에서 변함    100%    13/15    0.92    ✅
> 이동 없이 다시 생김    89%    2/7    0.85    ❌
> 너무 빠름    38%    1/3    0.92    ❌
> 툭툭 끊김    100%    3/4    0.93    ❌ 결함 없는 장면 34/79를 잘못 잡음
> </pasted_content id="6a57">
> 

#### 19 — 2026-11-24T09:28:31Z

> LLM Judge에 대한 검증이구나

#### 20 — 2026-11-24T09:31:46Z

> 어 코들를 주고 LLM Judge가 그걸 확인할 수 있는지 검사한거야?

#### 21 — 2026-11-24T09:32:39Z

> 햇갈리기 시작했어. LLM이 없어도 저 표는 만들 수 있었어?

#### 22 — 2026-11-24T09:33:37Z

> 그럼 LLM judge에 움직임을 건네는 법 - 여기에도 입력할 결과가 있어?

#### 23 — 2026-11-24T09:34:27Z

> 오케이 고치고 표도 넣어줘

#### 24 — 2026-11-24T09:37:48Z

> 중간에 인터넷이 끊어졌네. 체크해봐
