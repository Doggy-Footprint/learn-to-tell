# 페이지 스크린샷 도구, LTT.clock, kit 검색 키워드

## Goal

"SKILL.md 의 staged change를 보면 내가 수정한 걸 볼 수 있어. 그에 맞춰서 남은 부분을 다시 써줘." → (스크린샷·키워드 미구현 지적에) "handoff로 넘겨줘."

## State

- 브랜치 `education-first`, 기준 커밋 `9ae88d0`. 사용자 검토 대기, stage·커밋하지 않음.
- staged(사용자 수정): `AGENTS.md`(원칙 6 삭제), `README.md`, `agent-docs/rejections/*`, `skills/learn-to-tell/SKILL.md` §1–§3 앞부분.
- unstaged(이번 세션): `skills/learn-to-tell/SKILL.md` §0, §3 "Auxiliary kit" 이후, §4–§6. `skills/learn-to-tell/kit/API.md`에서 `LTT.clock` 설명 3곳 삭제.
- 새 SKILL.md §3 절차: `outline.md` → `checklist.md`(시행)·`answers.md`(정답) → storyboard → `lesson.html` → `audit.mjs --shots` → 검증 서브에이전트 1개(미충족만 보고, 최대 3회) → 공개.
- `/fork` 안내는 사용자 지시로 유지(issue #16 범위).

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| SKILL.md에 `LTT.clock`을 필수 파트로 적음 | `grep -rn clock kit/ltt.js server/`에 아이콘 외 구현 없음 | verified: API.md가 미구현 API를 문서화하고 있었다. API.md·SKILL.md에서 제거함 |

## Next Step

1. `server/audit.mjs`를 스크린샷 도구로 바꾼다(옛 계획 eff07952 3단계). 지금은 `takeShots`가 deck 장면(`#1..n`)만 찍고, `check.source === "page"`면 `scenes: 0`이라 스크린샷이 없다. 페이지는 1440×900·1280×800에서 스크롤하며 찍고, 출력은 PNG 경로와 `check`·expect 오류만 남긴다. `LTT.auditScene` 판정·"고침/권고"는 지운다.
2. `LTT.clock(el, draw, {dur, loop})`을 `kit/ltt.js`에 구현한다(화면 밖·숨김이면 멈춤, reduced-motion이면 `draw(dur)`, `{play, pause, seek}`). 스크린샷 도구는 clock 그림을 idle 또는 마지막 t로 찍는다. 구현 뒤 API.md 페이지 계약과 SKILL.md 필수 파트에 다시 넣는다.
3. kit 파트 머리에 축별 검색 키워드 주석(설명 대상, 방식, 그림 종류)을 단다(옛 계획 4단계). 끝나면 SKILL.md "Auxiliary kit"의 "부품 고르기 표 grep"을 주석 grep으로 바꾸고, API.md에서 파트 목록을 줄인다.
4. A 자동 보정(옛 계획 eff07952 2단계)을 구현한다: 최소 글자 크기, 가로 넘침, 겹침, 기본 theme, 안 쓴 풀이 제거. 보정 전후는 `autofix` 이벤트로 남긴다.
5. `standalone.md` 표(3. 자료·3. 검증·5. 생성 비용 줄)를 새 §3에 맞춘다: 검토 서브에이전트·"결정 변수 주장" → 검증표(`checklist.md`·`answers.md`)와 검증 서브에이전트.
6. `README.md`의 범위(31행)와 품질 표(50–53행)를 새 절차에 맞춘다: 결정 변수·검토 서브에이전트·"고침/권고" 서술이 남아 있다.
7. 위가 끝나면 기존 gallery 주제 하나로 새 절차를 돌려 `result.md` 생성 비용과 검증 보고를 현행본과 비교한다(옛 계획 6단계).
8. 1·2·4는 workflow-approach 대상이다.

## Open Questions

- `look/look.md`의 "판정" 절과 storyboard 절 "판정 서브에이전트" 문장은 새 검증 방식과 맞지 않는다. 지울지 검증표 작성 가이드로 바꿀지.
- `look/src/`가 없다. shot 소스를 다시 둘지, 카드 jpg만 쓸지.

## Spec

없음.

## Execution Ledger

없음(구현 전).
