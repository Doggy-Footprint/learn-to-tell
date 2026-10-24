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

