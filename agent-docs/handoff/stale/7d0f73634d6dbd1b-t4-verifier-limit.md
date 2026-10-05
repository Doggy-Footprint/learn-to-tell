# T4 기록 왕복 — verifier 한도 도달, V9 증거 1건 미해결

## Goal
"handoff를 완료했어. 체크하고, T4 spec을 작성해줘"

## State
- branch: `main`, base commit `67a17d2` (미커밋)
- 변경 파일: `package.json`(verify coverage include에 `knowledge/*.mjs`), `knowledge/{paths,store,import,delete,restore,summary}.mjs`, `scripts/map.mjs`, `tests/knowledge.test.mjs`, `tests/map-cli.test.mjs`, `tests/fixtures/knowledge/{world,faults}.mjs`
- `npm run verify` exit 0: node 2547/2547, Playwright 56/56, line·function 100%
- 정지 사유: verifier 2/2 사용. 두 번째 감사에 blocking 증거 gap(KT4-F4) 1건이 남아 추가 감사 없이는 완료 불가.

## Failed Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| spec v1 첫 map revision 0 | 구현·테스트 모두 `RANGE /revision` 보고, `[V1.rule-1]` 실패 | verified: 계약 revision·baseMapRevision ≥ 1 |
| import마다 map.revision 증가(설계 단계) | validateBundle `baseMapRevision === map.revision`로 같은 세션 checkpoint 2가 REVISION 거부 | verified: 계약 조건, 파일 밖 generation 래퍼로 대체 |
| 삭제 중 백업 삭제 실패를 IO로 보고 | 재실행 시 NOT_FOUND로 정리 불가, map은 이미 변경 | verified: v3에서 PARTIAL_DELETE·정리 전용 delete로 대체 |
| V9를 최신 후보 복구만으로 검증 | 변이 M1 '항상 최신 후보 복구' 121/121 통과 | verified: 테스트 gap, batch 3에서 보강 후 2 fail로 검출 |

## Next Step
1. `tests/knowledge.test.mjs` V9에 사례 1건 추가: 읽을 수 없는 map.json(계약 위반 래퍼, generation 20), 백업 ≤5. applyRestore 후 `out.generation === 21`, 디스크 래퍼 generation 21, 손상 파일 `map.json.corrupt-20-1`.
2. 변이 M4로 검출 확인: `knowledge/restore.mjs` maxGeneration을 `Math.max(current.status === 'ok' ? currentGeneration : 0, ...generations)`로 바꾸면 현재 127/127 통과(gap 확인됨) → 추가 후 실패해야 함. `python3 .harness/bin/seed.py backup/restore` 사용.
3. 새 workflow run(새 verifier 예산)으로 이 obligation만 감사하거나, 사용자가 이 1건을 main 확인으로 수용할지 결정한 뒤 커밋.
구현 코드는 이미 spec v4대로 동작한다(restore.mjs가 `currentGeneration`을 max에 포함). 남은 것은 증거뿐이다.

## Open Questions
- 감사 예산이 소진된 상태에서 KT4-F4 테스트 추가 후 새 run으로 재감사할지, main 변이 검출 증거로 수용할지.
- 백업 파일은 copyFile로 생성되어 원자적이지 않다(R1 기록). 부분 백업은 복구 후보 검증에서 제외되지만, 백업 원자성을 요구할지.
- 남은 advisory: A3(concept 줄 순서 미정), A4(손상된 백업 generation 지정 시 코드 미정), A6(V13이 파일 내 실행 순서 의존), A7(부분 기록된 백업 미재현).

## Spec
- 경로: `agent-docs/spec-logs/6c7d86d736dae677-t4-record-roundtrip.md` (archived), version 4, status `limit`, run ID `6c7d86d736dae677`

## Execution Ledger
- Findings:
  - KT4-F1(V9 비최신 후보): closed
  - KT4-F2(V8 무관 체인): closed
  - KT4-F3(V1/V2 lesson 추가): closed
  - KT4-S1(손상 generation 표식): v4로 해결
  - KT4-F4(V9 손상 래퍼 generation이 백업보다 큰 경우): **open**
  - A1: 기각(checkpoint 접두사 동일성)
  - A2, A5: 채택
  - A3, A4, A6, A7: advisory
- Mutations:
  - M1 '항상 최신 후보 복구': 2 fail(검출)
  - M2 '삭제 시 관측 과다 제거': 3 fail(검출)
  - M3 'rename 전 generation 재확인 생략': 3 fail(검출)
  - M4 '손상 현재 generation 무시': 127/127 통과(미검출, KT4-F4 확인)
  - 모든 변이는 seed restore 완료.
- Counters: correction batches 3, verifier invocations 2/2.
- Audit:
  - accepted: V1–V8, V10–V15
  - main 수용: R1
  - open: V9
