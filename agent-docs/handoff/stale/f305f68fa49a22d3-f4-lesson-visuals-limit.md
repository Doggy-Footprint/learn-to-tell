# F4 lesson v3 시각화·실사용 범위 — verifier 한도 도달

## Goal
"spec 대로 구현 시작해. /workflow-approach" (spec `0dcd8454f6e5111d-f4-lesson-visuals-practical-range`)

## State
- Branch `master`, base/HEAD commit `2359115d09303e66f2efec63bb62b9492c5037cb`, 미커밋.
- Implementation 변경: authoring/place.mjs, authoring/probes.mjs, contracts/definitions.mjs, contracts/index.mjs, contracts/model.mjs, learning/progress.mjs, site/src/components/{dom.js, ui.js, style.css, charts.js(new)}, skills/learn-to-tell/{SKILL.md, reference.md}.
- Tests 변경: tests/{authoring, build, contracts-v2, knowledge, learning, lesson-cli, skill-docs}.test.mjs, tests/contracts-v3.test.mjs(new), tests/e2e/{builds.mjs, helpers.mjs, generic.spec.mjs, quality.spec.mjs, values.spec.mjs, visuals.spec.mjs(new)}, tests/fixtures/contracts/*, tests/fixtures/contracts-v2/*, tests/fixtures/contracts-v3/(new), tests/fixtures/authoring/models-v3.mjs(new), tests/fixtures/learning/{synthetic-*-v3*.{json,mjs}, v3.mjs}(new).
- `npm run verify` (verify8) 통과: node 3292/3292, line 100% / function 100%, Playwright 123 passed.
- RV1: test-results/review/F4-*.png, F4-checklist.md (round 2, 6/6).

## Failed Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| verify1 | `F4-V3.place-lesson v4` 문구 없음 | place-lesson이 version 1만 문구와 함께 거부 (verified, 수정됨) |
| verify3 | axe color-contrast `hint-level-2`; `F4-V7.deltas and table` strict mode | 버튼 color transition 중간색 (hypothesis, transition 제거 후 해소); row locator 4요소 (verified, 수정됨) |
| verify4·6 | `O3.size` EPIPE (tests/serve.test.mjs, 미변경) | 413 응답 후 연결 종료와 클라이언트 쓰기 경합 (hypothesis); 범위 밖 |
| verify7 | `F4-V7.block order` safety-notice 순서 | R16 안내 문구 testid 부재 (verified, spec v4 `simulation-guidance`) |
| M2 1차 | `F4-C13.clamp`만 실패 + `V8.S11` timeout | mutation이 x 정의역까지 바꿔 의도한 assertion 전에 실패(verified); V8.S11 단계 탐색 400ms flaky (hypothesis) |
| 감사 2회차 | F8: 카드 현재 값·`정의되지 않음` 관찰 부족 | test evidence gap (verified, 감사 근거) — 수정 시 추가 감사가 필요해 한도로 중단 |

## Next Step
1. 새 run(새 spec, 이 spec 참조)으로 F8 테스트 보강: margin이 null인 상태(load-b 17 또는 18)와 기본값이 아닌 확정 상태에서 `output-card-<id>` 텍스트 = `ko(display(...)[id])` + ` ` + unit 또는 `정의되지 않음` (tests/e2e/visuals.spec.mjs). 제안 mutation: 카드가 null을 `NaN`/빈 문자열로 렌더 → 이 assertion으로 검출 확인.
2. 그 run에서 verifier 1회로 V7 재감사.
3. 완료 후 ROADMAP §5 미결 항목·handoff F4(`bc687eb8711f016a-t5-remaining.md`) 갱신(spec 범위에 포함됐으나 미수행), 테스트 프로젝트 skill 재설치.

## Open Questions
- A-1: V3 coverage "v2 의미 위반 클래스별 1건 … validateDocument·map·bundle에서"가 클래스×표면 전체 곱인지(현재는 전 클래스 validateDocument + 1클래스 map·bundle). 전체 곱이면 V3도 보강 필요.
- 기존 flaky `O3.size`, `V8.S11`을 별도 작업으로 고칠지.

## Spec
`agent-docs/spec-logs/0dcd8454f6e5111d-f4-lesson-visuals-practical-range.md`, version 4, status limit, run ID `0dcd8454f6e5111d`.

## Execution Ledger
- Findings: 감사 1회차 F1–F7 → spec v3·v4 개정과 배치 3·4로 해소, 감사 2회차에서 V1·V3·V6 accepted, V7의 F2·F3·F4·F7 closed. D1·D2·D3·T1 수정. 감사 2회차 F8 open (blocking, V7).
- Mutations: M1 검출(`F4-V6.previewing`), M2b 검출(`F4-V7.aria and caption states`), M3 검출(`F4-V3.v2 semantics` 12건); M2 1차 inconclusive.
- Counters: correction batches 4, verifier invocations 2/2.
