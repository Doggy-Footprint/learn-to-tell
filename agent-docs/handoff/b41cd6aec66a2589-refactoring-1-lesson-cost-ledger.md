# refactoring-1: 수업 생성 비용을 result.md에 기록해 "빠르고 적은 토큰"을 측정 가능하게 하기

## Goal

"이 스킬은 일반적으로 학습 자료를 요청하는 것보다 빠르고 적은 토큰 소모로 학습 자료를 제작할 수 있도록 지원해야 한다." / "제안을 정리해서 handoff에 refactoring으로 정리하고, 필요한 경우 세부 항목으로 나눠서 여러 파일로 만들어."

## State

- 브랜치 `fix/run-time`, 기준 커밋 `956df3f`. 코드 변경 없음(2026-10-18 분석에서 나온 제안).
- 순서: refactoring-1. 뒤의 refactoring-2(API 분할)·3(장면 예산)의 효과를 이 기록으로 전후 비교한다.
- 관련 파일: `skills/learn-to-tell/SKILL.md` §3(자료)·§5(작업 복귀, `result.md` 템플릿), `skills/learn-to-tell/standalone.md`, `.harness/lib/telemetry.py`(세션 도구 호출 telemetry는 있으나 토큰·수업 단위 기록은 없음).
- 지금 상태: 토큰·시간·바이트를 재는 곳이 없다. SKILL.md에서 비용을 언급하는 곳은 "작업 세션 context 100k tokens" 한 줄(§0)뿐이다. `learn-to-tell-PROJECT.md` §5 "미정"에 context 크기 확인 후보(세션 transcript의 usage 합계, 비공개 형식)가 적혀 있다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |

## Next Step

1. `result.md` 템플릿(SKILL.md §5)에 "생성 비용" 항목을 추가한다. 적는 값: 읽은 문서(파일 이름과 바이트), 수업 `lesson.html` 바이트와 장면 수, 검증 단계별 서브에이전트 호출 수(기대값·주장 검토·독자 검토·눈 검토), 브라우저 왕복 수(audit·스크린샷), 시작·공개 시각. 토큰은 transcript usage를 읽을 수 있을 때만 적고, 못 읽으면 바이트로 대신한다.
2. SKILL.md에는 마지막(§5)에 한 번 정리하라고만 적는다. 단계마다 세게 하면 그 자체가 생성 비용을 늘린다.
3. 기준선 1회: 갤러리 주제 하나를 skill 없이 "학습 자료를 만들어 달라"로 요청해 같은 항목을 재고, 이 handoff의 Execution Ledger에 적는다. 비교 조건(모델, 세션 context 크기, 주제)을 함께 적는다.
4. 기록이 3~5건 쌓이면 refactoring-2·3 적용 전후를 비교하고, 수치가 intent 1과 어긋나면 SKILL.md §3.6 검증 단계의 tier(수업 길이별 생략 가능 항목)를 정한다.

## Open Questions

- 토큰을 어디서 읽나. 세션 transcript(`~/.claude/projects/<cwd>/<session-id>.jsonl`)는 공개 API가 아니다(PROJECT.md §5). 바이트만으로 충분한지.
- 기준선 비교 주제를 무엇으로 할지(갤러리 중 중간 길이인 cache-ttl 10장면이 후보).
- standalone(claude.ai)에서는 서브에이전트·브라우저가 없어 항목이 다르다. 같은 템플릿을 쓸지.

## Spec

없음(SKILL.md·템플릿 문서 변경, workflow-approach 대상 아님).

## Execution Ledger

- 2026-10-18 측정(읽기 비용): `SKILL.md` 17,156자(31.6KB), `kit/API.md` 22,764자(34.6KB), `gallery/catalog.html` 40,506자(48.0KB, 선택), `gallery/scenes.html` 12,384자(15.8KB, 선택). 수업마다 앞의 두 문서는 전부 읽게 되어 있다.
- 2026-10-18 측정(쓰기 비용): 갤러리 수업 11.6KB(trolley, 4장면) ~ 49.6KB(ontology, 24장면). `tls13-quic.html` 46.0KB 중 `<script>` 43.4KB.
- 2026-10-18 측정(검증 비용): SKILL.md §3.6은 서브에이전트 5종 + audit 2크기 + 장면별 스크린샷 검토(16장면 수업이면 이미지 32장)를 요구한다.
