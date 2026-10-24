# 지시

너는 Learn to Tell skill로 수업 하나를 만든다. 이 실행은 비대화형이다.

- skill: `$G/skill/SKILL.md`를 먼저 읽고 그 절차와 예산을 그대로 따른다.
- 진단 대화는 하지 않는다. 아래 "진단 결과(고정)"를 그대로 `meta.learner`에 쓴다.
- 사용자에게 묻거나 답을 기다리지 않는다. 판단이 필요하면 합리적으로 정하고 진행한다.
- 수업 파일은 현재 작업 디렉터리의 `lesson.js`다. sheet 출력은 `./sheet`, digest는 `./digest.md`에 둔다.
- 읽지 않는다: runtime 소스, 저장소의 다른 문서(`agent-docs/`, `bench/`, `plan.md`, `rules.md`), 현재 작업 디렉터리 밖의 다른 수업.
- 웹 검색 도구는 없다. 사실은 알고 있는 지식으로 쓰고, 확실하지 않은 수치는 illustrative로 표시한다(SKILL 11번).
- 끝나면 마지막 메시지에 다음을 적는다.
  - `ltt check` 실행 횟수와 회차별 오류 수(rule별)
  - sheet 결과(runtimeErrors, layoutViolations)와 렌더 뒤 고친 내용
  - 정답 검산 결과(일치·불일치·판정 불가 수)와 고친 것
  - runtime-issues.md 내용(없으면 "없음")
  - 예산 소진으로 남긴 문제(없으면 "없음")

---

## 주제: attacker-moves-second

### 상황
- 작업: 사내 문서 요약 agent에 prompt injection 방어를 붙이려 한다. 논문 "The Attacker Moves Second: Stronger Adaptive Attacks Bypass Defenses against LLM Jailbreaks and Prompt Injections"(Nasr, Carlini 외, 2025)가 방어 평가에 대해 무엇을 말하는지, 어떤 방어를 믿을지 판단하고 싶다. 학습 자료를 만들어 달라.
- 배경: LLM API로 앱을 만들어 본 백엔드 개발자. jailbreak·prompt injection은 이름만 안다.

### 진단 결과(고정)
- 사다리(낮은 단부터): jailbreak와 prompt injection의 차이(애매함) → 정적 공격 vs 적응형 공격(아예 모름) → 공격 성공률과 공격 예산(아예 모름) → 적응형 공격 방법: gradient·RL·탐색·사람 red-teaming(아예 모름) → 방어 평가를 믿을 기준(아예 모름).
- 학습 수준: 사다리에서 "아예 모름"인 첫 단부터 끝 단까지. "애매함"인 단은 수업에 일부 넣는다.
- 오개념: "공개 벤치마크에서 공격 성공률이 1% 미만인 방어는 실제로도 안전하다"라고 답했다.
