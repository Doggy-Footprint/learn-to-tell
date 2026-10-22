# 페이지 스크린샷 도구, LTT.clock, kit 검색 키워드

## Goal

"SKILL.md 의 staged change를 보면 내가 수정한 걸 볼 수 있어. 그에 맞춰서 남은 부분을 다시 써줘." → (스크린샷·키워드 미구현 지적에) "handoff로 넘겨줘."

## State

- 브랜치 `education-first`. 1·2단계는 `e3ffc31`로 커밋했다.
- 커밋하지 않은 것(3·5·6단계와 문서 테스트):
  - kit `@ltt-part` 주석 36개(`ltt-parts.js`, `ltt-ui.js`, `ltt-mock.js`, `ltt-deck.js`, `ltt.js`).
  - `kit/API.md`의 "부품 찾기" 절. "부품 고르기" 표는 지웠다.
  - `kit/api/controls.md`의 "손잡이 고르기"와 `kit/CHANGELOG.md`.
  - `SKILL.md` "Auxiliary kit"의 grep 줄.
  - `standalone.md`, `README.md`, `look/look.md`("판정" 절과 `look/src` 참조를 지웠다).
  - `tests/api-docs.test.mjs`, `tests/map/skill.test.mjs`.
- `npm test`: 1127개 모두 통과.
- 사용자 결정:
  - SKILL.md 길이 상한 테스트는 지운다.
  - `learn-to-tell-PROJECT.md`를 읽던 FR-11 테스트 2개는 그 파일이 `2b3df17`에서 지워져 함께 지웠다(기본값).

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| SKILL.md에 `LTT.clock`을 필수 파트로 적음 | `grep -rn clock kit/ltt.js server/`에 아이콘 외 구현 없음 | verified: API.md가 미구현 API를 문서화하고 있었다. API.md·SKILL.md에서 제거함 |
| Chrome CLI `--screenshot`으로 스크롤한 페이지 찍기 | Chrome 155에서 `scrollTo` 뒤 찍은 PNG가 하얗다(scratchpad 재현) | verified: headless CLI 캡처 결함. CDP `--remote-debugging-pipe`로 바꿨다 |
| `--dump-dom` + `--virtual-time-budget`로 CSS 전환 뒤 상태 읽기 | 덱 C-10 probe가 전환 전 값을 읽었다 | verified: virtual time이 CSS transition을 진행시키지 않는다. 고정 페이지에서 전환을 끄고 `data-ltt-shot`을 기다린다 |

## Next Step

1. A 자동 보정(옛 계획 eff07952 2단계)을 구현한다: 최소 글자 크기, 가로 넘침, 겹침, 기본 theme, 안 쓴 풀이 제거. 보정 전후는 `autofix` 이벤트로 남긴다. workflow-approach 대상이다.
2. 위가 끝나면 기존 gallery 주제 하나로 새 절차(`audit.mjs --shots --checklist` 포함)를 돌려 `result.md` 생성 비용과 검증 보고를 현행본과 비교한다(옛 계획 6단계).
3. 권고(차단 아님): gallery-audit 기준 갱신(RV-2, 손으로 확인)을 자동 테스트로 만든다.

## Open Questions

없음(판정 절은 지우고, look/src 대신 카드 jpg만 쓰기로 사용자가 정했다).

## Spec

`agent-docs/spec-logs/76b739afacf5b868-page-shots-and-clock.md`, v2, complete, run `76b739afacf5b868` (1·2단계). 3·5·6단계는 문서·주석 작업이라 spec 없이 했다.

## Execution Ledger

- 검증 서브에이전트(verifier) 2회: 1회차 retry(F-1..F-5), 2회차 pass. 수정 3번.
- 손 mutation 14건 모두 잡힘. fuzz·mutation 도구 없음(spec D-8).
- RV-1: 덱 1개와 clock 시험 페이지의 PNG를 직접 확인했다. RV-2: 기준 파일 쓰기를 확인했다.
- 3단계 확인: grep "흐름도" → diagram·autoLayout, "2D 지도" → map, "시간에 따른 변화" → sim·clock. 같은 내용을 `tests/api-docs.test.mjs`가 고정한다.
