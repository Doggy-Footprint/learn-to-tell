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
2. 시험 생성은 1번보다 먼저 돌렸다(아래 "2026-10-22 시험 생성"). 1번 뒤에 같은 프롬프트로 다시 돌려 비교한다.
3. 시험 생성에서 반복된 생성기 결함을 고친다. 가장 비싼 것은 audit이 페이지 JS 예외를 check 오류로 내지 않는 것이다(아래 D-1). 1번보다 먼저 할지 사용자가 정한다.
4. 권고(차단 아님): gallery-audit 기준 갱신(RV-2, 손으로 확인)을 자동 테스트로 만든다.

## Open Questions

없음(판정 절은 지우고, look/src 대신 카드 jpg만 쓰기로 사용자가 정했다).

## Spec

`agent-docs/spec-logs/76b739afacf5b868-page-shots-and-clock.md`, v2, complete, run `76b739afacf5b868` (1·2단계). 3·5·6단계는 문서·주석 작업이라 spec 없이 했다.

## Execution Ledger

### 2026-10-22 시험 생성 (gallery 12 + 새 주제 5)

- 서브에이전트(general-purpose) 17개 동시 실행, 비대화형. 프롬프트와 결과는 `measurements/20261022-all-topics/`(gitignore, 로컬에만 있다). `LTT_HOME`은 그 아래 `home/`.
- 17개 모두 마지막 audit check 0. 검증 미충족 0이 16개, matrix-as-transform은 3회 한도 뒤 15번 1건(개념 나무 칸 '상' 미풀이, 사용자 허락 대기).
- 서브에이전트 토큰 합 약 303만, 수업당 13–25만, 9–25분.
- art-of-loving: 생성 agent가 1회차 검증 응답 전에 미충족 항목을 지어내 고쳤다(result.md에 보충함).
- vector-calculus result.md: `definition`의 `f: Rⁿ→R`가 YAML 파싱 실패. 메인 agent가 따옴표로 고쳤다.
- 반복된 생성기 결함(수업 수):
  - D-1 (6): d3를 빼면 ltt-parts.js가 실패하는데 audit check 0. `audit.mjs`에 페이지 예외 수집이 없다(확인함). API.md "불러오기"에 d3 필수 표시도 없다.
  - D-2 (17): `LTT.predict` 인자 문서 없음. 모두 직접 짰다. predict 이벤트 이름도 문서에 없다.
  - D-3 (~8): `?shot`과 "예측 전 답 숨김"의 충돌. 손잡이·토글·steps 그림은 기본 상태만 찍힌다. 정적 그림을 checklist에서 지정할 표식이 없다.
  - D-4 (~8): used-before-defined가 부분 문자열(TFLOPS⊃FLOP)·제목을 세고, 숨은 풀이 칸의 `{{}}`를 첫 정의로 친다. SVG 글자 판정이 수업마다 달랐다.
  - D-5 (3): clock `draw(t)` 상태를 sweep 첫 render가 덮어써 `[shot id ms]`가 틀린 시점으로 찍힌다.
  - D-6: audit 출력 `marks N`은 표식 오류 수다(코드 확인). expect는 불일치가 없으면 출력이 없다.
  - D-7: theme accent와 범주색 겹침(terminal의 good, lab의 c2). background.md가 없을 때 검증자 입력 규칙 없음. agent가 스스로 설계를 바꿨을 때 checklist 수정 허용 여부 없음. 검증 응답 전 수정 금지 규칙 없음. `LTT.plane`·`LTT.drag`·`LTT.takeaway` sources 문서 부족.
- 출처 미대조: trolley-ethics, retrieval-practice, art-of-loving 수치·인용은 기억에 의존했다.

- 검증 서브에이전트(verifier) 2회: 1회차 retry(F-1..F-5), 2회차 pass. 수정 3번.
- 손 mutation 14건 모두 잡힘. fuzz·mutation 도구 없음(spec D-8).
- RV-1: 덱 1개와 clock 시험 페이지의 PNG를 직접 확인했다. RV-2: 기준 파일 쓰기를 확인했다.
- 3단계 확인: grep "흐름도" → diagram·autoLayout, "2D 지도" → map, "시간에 따른 변화" → sim·clock. 같은 내용을 `tests/api-docs.test.mjs`가 고정한다.
