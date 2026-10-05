---
version: 5
run_id: 6c7d86d736dae677
status: complete
base_commit: 67a17d26d0bec06e1268e6639f2d6e9859be8fbe
max_verifier_invocations: 3
handoff: agent-docs/handoff/7d0f73634d6dbd1b-t4-verifier-limit.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| U1 | 사용자 | 브라우저에서 내보낸 결과를 agent가 로컬 map에 저장 | `import <result.json>` 후 다시 실행해도 같은 결과가 map에 한 번만 존재 |
| U2 | 사용자 | 저장 실패·중단·동시 쓰기에도 기존 기록 유지 | 실패한 쓰기 뒤 map.json 바이트가 쓰기 전과 동일 |
| U3 | 사용자 | 손상 시 확인 후에만 복구, 원치 않는 결과 삭제 | 미리 보기 → 토큰 확인 2단계로만 변경, 손상 파일 보존 |
| U4 | agent(T5) | map을 읽어 다음 학습을 이어감 | `show`가 결과·관찰·미확인 항목을 텍스트로 요약 |

# Scope
In scope: `~/.learn-to-tell/profiles/<profileId>/` 저장 배치, 저장 래퍼 형식과 generation, 원자적 저장과 generation 검사, 최근 5개 백업, import(검증·중복·observation 생성), 결과 1건 삭제(후속 checkpoint·observation·관련 백업 연쇄), 백업 복구, map 텍스트 요약, CLI `scripts/map.mjs`.
Out of scope: lesson·diagnostic 파일을 profile 폴더에 생성하는 기능(T5; 테스트는 fixture로 배치), map.revision 증가·nextPaths 생성(T5), agent 검토로 pending을 supported로 바꾸는 기능, 브라우저 map 표시, 계약 v2 변경, lock 파일, 실제 병렬 프로세스 경합 테스트, Windows 지원.

# Paths
Implementation: knowledge/paths.mjs, knowledge/store.mjs, knowledge/import.mjs, knowledge/delete.mjs, knowledge/restore.mjs, knowledge/summary.mjs, scripts/map.mjs, package.json (verify의 coverage include에 `knowledge/*.mjs` 추가만)
Tests: tests/knowledge.test.mjs, tests/map-cli.test.mjs, tests/fixtures/knowledge/
Test command: npm run verify
Review evidence: R1 — main이 `knowledge/store.mjs`에서 모든 map.json·백업 쓰기가 temp→fsync→generation 재확인→rename 경로 하나만 거치는지 읽고 Execution ledger에 기록.

# Signatures
저장 배치 (`home` = `process.env.LEARN_TO_TELL_HOME ?? os.homedir()`, 루트 `<home>/.learn-to-tell`):
- `profiles/<profileId>/map.json` — 래퍼 `{"storage":1,"generation":<정수 ≥1>,"map":<map v2>}`
- `profiles/<profileId>/backups/map.<generation>.json` — 덮어쓰기 직전 map.json의 바이트 그대로
- `profiles/<profileId>/lessons/<lessonId>.<lessonRevision>.json` — lesson v1 (T5가 배치)
- `profiles/<profileId>/diagnostics/<diagnosticId>.json` — diagnostic v1 (T5가 배치)
- `profiles/<profileId>/map.json.corrupt-<generation 또는 0>-<n>` — 복구 시 보존한 손상 파일. generation 표식 = map.json을 JSON으로 읽을 수 있고 최상위 `generation`이 안전한 정수이면 그 값, 아니면 0. F13의 '현재'도 같은 값

knowledge/*.mjs (모든 함수는 마지막 인자로 선택적 `{fs, home}`를 받는다. `fs`는 `node:fs/promises` 호환 객체이며 테스트가 실패를 주입한다):
- paths.mjs: `profileDir(profileId, opts) → string` (profileId가 id 형식이 아니면 throw하지 않고 호출자가 PROFILE 오류 반환)
- store.mjs: `readMap(profileId, opts) → {status:'absent'} | {status:'ok', generation, map, bytes} | {status:'unreadable', reason:'JSON'|'WRAPPER'|'CONTRACT', errors}`; `writeMap(profileId, expectedGeneration, map, opts) → {ok:true, generation} | {ok:false, code:'STALE'|'IO'}`
- import.mjs: `importResult(resultText, opts) → Outcome`
- delete.mjs: `planDelete(profileId, resultId, opts) → Outcome(preview)`; `applyDelete(profileId, resultId, token, opts) → Outcome`
- restore.mjs: `planRestore(profileId, opts) → Outcome(preview)`; `applyRestore(profileId, backupGeneration, token, opts) → Outcome`
- summary.mjs: `summarize(profileId, opts) → {ok:true, text} | Outcome(error)`

Outcome: `{ok:true, action:'imported'|'duplicate'|'deleted'|'restored'|'preview', generation?, duplicateOf?, preview?, token?}` 또는 `{ok:false, code, message, errors?, next}`. `next`는 사용자가 할 다음 행동 한 문장(한국어).
- delete preview: `{resultIds:[삭제될 resultId, 순서=체인 순], observationIds:[...], backupGenerations:[삭제될 백업, 오름차순; 적용 시 writeMap이 만드는 삭제 직전 백업(현재 generation)도 포함], token}`
- restore preview: `{candidates:[{generation, lostGenerations, token}] (최신순, 검증 통과만), current:{status, generation?}, token}`. lostGenerations = 후보보다 큰 generation(손상된 것을 포함한 다른 모든 백업 파일 + 읽을 수 있는 현재) 오름차순. `preview.token` = Outcome의 `token` = `candidates[0].token`.
- applyRestore 판정 순서: 없는 generation → NOT_FOUND, token 없음 → preview, 불일치 → TOKEN.
- `readMap`의 `bytes`는 Buffer. map이 없을 때 writeMap의 `expectedGeneration`은 0.
- 정리 전용 delete: 대상 resultId가 map에 없지만 그것을 포함한 백업이 있으면 planDelete는 `{resultIds:[resultId], observationIds:[], backupGenerations:[그 백업들], mapChange:false, token}`을 반환하고, applyDelete는 token 일치 시 map을 쓰지 않고 그 백업만 지운 뒤 `{ok:true, action:'deleted', generation:<현재>}`. 일반 preview는 `mapChange:true`.
- applyDelete에서 map 저장 후 백업 삭제가 실패하면 `{ok:false, code:'PARTIAL_DELETE', generation:<새 generation>, remainingBackups:[남은 generation 오름차순], message, next}`; next는 같은 resultId로 delete를 다시 실행하라는 안내.
- ENOENT 외 읽기 오류(map·백업·lesson·diagnostic)는 예외를 던지지 않고 `IO` Outcome.
- show 텍스트 형식(한 줄에 항목 하나, 순서 고정): `profile: <id>` / `revision: <n>` / `generation: <n>` / `results: completed <n>, partial <n>` / 개념마다 `concept <conceptId>@<rev>: supported <n>, partial <n>` / `unresolved: pending <n>, skipped <n>, not_demonstrated <n>`.
- token = `sha256-` + hex(SHA-256(`<action>\n<map.json 현재 바이트 또는 "absent">\n<대상 식별자>`)); 대상 식별자는 delete면 resultId, restore면 선택 generation. 적용 시 현재 상태로 다시 계산해 다르면 `TOKEN`.

scripts/map.mjs CLI:
- `import <result.json>` · `delete <profileId> <resultId> [--confirm <token>]` · `restore <profileId> [--generation <n> --confirm <token>]` · `show <profileId>`
- import·delete·restore는 stdout에 Outcome JSON 한 줄, `show`는 성공 시 텍스트, 실패 시 Outcome JSON.
- 종료 코드: 0 = ok:true, 1 = ok:false, 2 = 사용법 오류(stderr에 사용법).

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| F1 | import는 result 텍스트를 `parseDocument(…,'result')`로 검증하고, profile 폴더의 lesson·diagnostic과 map(없으면 `{kind:'map',version:2,profileId,revision:1,lessons:[],results:[],observations:[],nextPaths:[]}`), map 안의 previousResult로 `validateBundle`을 호출한다. 실패하면 오류 그대로 반환하고 쓰지 않는다 | must | 결정 A, 계약 v2 |
| F2 | `duplicateOf`가 있으면 쓰지 않고 `{ok:true, action:'duplicate', duplicateOf}` | must | 결정 3 |
| F3 | 신규 결과는 results에 추가, lesson이 map에 없으면 lessons에 추가, 그 결과의 assessment 중 status `supported`·`partial`이고 같은 체인의 이전 결과로 이미 관찰되지 않은 assessmentId마다 observation 생성 (observationId=`obs-`+SHA-256(`resultId:assessmentId`) 앞 16 hex, conceptId·conceptRevision은 해당 response 값) | must | 결정 B, A2 |
| F4 | sequence>1인데 previousResultId가 map에 없으면 `REFERENCE` `/result/previousResultId`로 거부하고 next에 먼저 가져올 resultId를 적는다 | must | 결정 F |
| F5 | 저장 후 map은 `validateDocument(map,'map')` ok이고 래퍼 generation = 이전+1(없으면 1) | must | 결정 E |
| F6 | T4는 map.revision을 바꾸지 않는다 | must | 결정 E |
| F7 | 쓰기는 같은 디렉터리 temp → write → fsync → rename 직전 디스크 generation 재확인(다르면 `STALE`, temp 삭제) → rename. 어느 단계든 실패하면 map.json은 이전 바이트 그대로이고 temp는 남지 않는다(삭제 실패는 무시) | must | 결정 2 |
| F8 | 기존 map.json을 덮어쓰기 전에 `backups/map.<이전 generation>.json`으로 복사하고, 쓰기 성공 후 generation 상위 5개만 남긴다. 백업 복사 실패 시 map.json을 쓰지 않는다(`IO`) | must | 결정 1 |
| F9 | map.json이 unreadable이면 import·delete·show는 쓰지 않고 `MAP_UNREADABLE`, next에 restore 안내 | must | 결정 4 |
| F10 | planDelete는 대상과 그것을 previousResultId로 잇는 모든 후속 결과, 그 결과들의 observation, 삭제 대상 resultId를 하나라도 포함한 백업을 preview로 반환하고 아무것도 바꾸지 않는다 | must | 결정 5, C, D |
| F11 | applyDelete는 token이 일치할 때만 preview 범위를 제거해 저장하고 해당 백업 파일을 삭제한다. lessons는 유지 | must | 결정 5, C, D |
| F12 | planRestore는 `storage:1` 래퍼와 map 계약을 통과하는 백업만 최신순으로, 현재 generation보다 큰 lost 목록과 함께 반환하고 아무것도 바꾸지 않는다 | must | 결정 4 |
| F13 | applyRestore는 token 일치 시 현재 map.json을 `map.json.corrupt-…`(unreadable일 때) 또는 일반 백업(읽을 수 있을 때)으로 보존한 뒤, 선택 백업의 map을 generation = max(현재, 모든 백업)+1로 저장한다 | must | 결정 4 |
| F14 | summarize는 profileId, revision, generation, 결과 수(state별), 개념별 observation(status별 개수), pending·skipped·not_demonstrated assessment 수(체인의 마지막 결과만 집계; 다른 결과의 previousResultId가 가리키지 않는 결과)를 Signatures 형식으로 텍스트를 반환하고 쓰지 않는다. map이 없으면 `NO_MAP` | must | 결정 6 |
| F15 | profileId가 id 형식(`^[a-z][a-z0-9-]{0,63}$`)이 아니면 파일 접근 전에 `PROFILE` | must | Security |
| F16 | CLI는 Outcome을 위 형식·종료 코드로 출력한다 | must | 결정 6 |

# Errors
- result 파일 없음/읽기 실패 — `{ok:false, code:'IO'}`, exit 1 — 변경 없음.
- 계약·bundle 오류 — `{ok:false, code:'INVALID', errors:[…validateBundle/parseDocument errors]}` — 변경 없음.
- lesson 또는 diagnostic 파일 없음 — `code:'MISSING_LESSON'|'MISSING_DIAGNOSTIC'` — 변경 없음.
- 이전 checkpoint 없음 — `code:'INVALID'`, errors에 REFERENCE `/result/previousResultId` — 변경 없음.
- map.json 손상 — `MAP_UNREADABLE`, next에 `restore` 포함 — 변경 없음, 손상 파일 그대로.
- 쓰기 중 generation 변경 — `STALE`, next = 다시 가져오기 — 디스크의 새 map 그대로, temp 없음.
- write/fsync/rename/백업 복사 실패 — `IO` — map.json 이전 바이트, temp 없음.
- token 불일치·누락 상태로 적용 — 누락이면 preview 반환, 불일치면 `TOKEN` — 변경 없음.
- 삭제 적용 중 백업 삭제 실패 — `PARTIAL_DELETE` — map은 새 상태로 저장됨, 실패한 백업은 남음, 같은 resultId 재실행으로 정리 가능.
- profile 폴더의 lesson·diagnostic이 깨진 JSON — `INVALID`, errors `[{code:'JSON', path:'/lesson'}]` 또는 `/diagnostic` — 변경 없음.
- 복구 적용 중 손상 map.json 보존 복사 실패 — `IO` — 변경 없음.
- map에도 백업에도 없는 resultId 삭제, 복구 후보 없음, 없는 generation 지정 — `NOT_FOUND` — 변경 없음.
- 잘못된 profileId — `PROFILE` — 파일 접근 없음.
- CLI 인자 오류 — stderr 사용법, exit 2.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | map 없음, 유효 sequence 1 result | imported, generation 1, results 1, supported·partial 수만큼 observation |
| C2 | normal | C1 직후 같은 파일 재import | duplicate, map.json 바이트 불변 |
| C3 | normal | resultId만 다르고 hash 같은 result | duplicate, duplicateOf=기존 id |
| C4 | normal | checkpoint 1→2→3 순서 import | 모두 imported, 이미 관찰된 assessment는 observation 중복 없음 |
| C5 | error | checkpoint 2를 1보다 먼저 | INVALID(REFERENCE /result/previousResultId), next에 1의 id |
| C6 | error | 같은 resultId 다른 내용, 다른 profile, revision 불일치, v1 result, HASH 변조 | INVALID, 각 계약 코드, 변경 없음 |
| C7 | error | write / fsync / rename / 백업 복사 각 단계 실패 주입 | IO, map.json 바이트 불변, temp 0개 |
| C8 | error | readMap 후 rename 직전 다른 generation으로 디스크 변경 주입 | STALE, 디스크는 주입된 내용, temp 0개 |
| C9 | boundary | 쓰기 6회, 7회 | 백업 각각 5개, 최신 5 generation |
| C10 | normal | 재시작(새 프로세스) 후 show | 직전 저장 내용 요약 |
| C11 | normal | 체인 1–3 중 2 삭제: preview → confirm | 2·3과 그 observation 삭제, 해당 결과 포함 백업 삭제, 1과 lesson 유지 |
| C12 | error | 잘못된/이전 상태 token, token 생성 뒤 map 변경 | TOKEN, 변경 없음 |
| C13 | error | map.json 잘린 JSON / 래퍼 누락 / 계약 위반 | import·delete·show MAP_UNREADABLE |
| C14 | normal | C13 상태에서 restore preview → confirm | 최신 유효 백업 복원, 손상 파일 corrupt-로 보존, generation=max+1 |
| C15 | edge | 일부 백업도 손상 | 손상 백업은 후보 제외 |
| C16 | error | profileId `../x`, 대문자 | PROFILE, 파일 접근 없음 |
| C17 | normal | CLI 4개 명령과 사용법 오류 | Outcome JSON/텍스트, exit 0/1/2 |
| C18 | edge | pending만 있는 partial result | observation 0개, show에 pending 수 표시 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | F1–F16 |
| Performance efficiency | no | 단일 사용자, 문서 1MB 상한, 결과 수십 건 규모. 측정 대상 없음 |
| Compatibility | no | 계약 v2 무변경, 단일 환경(macOS·Node 26.8.1) |
| Interaction capability | yes | 실패마다 원인 코드와 다음 행동(next) 제공 — 완료 시나리오 5·6 |
| Reliability | yes | 원자적 저장·복구·손상 보존(M3 핵심) |
| Security | yes | profileId 경로 탈출 방지, 사용자 확인 없는 파괴적 변경 방지 |
| Maintainability | yes | 기존 100% line·function coverage 기준을 knowledge/*.mjs로 확장 |
| Flexibility | no | 단일 호스트·OS 범위 |
| Safety | no | 해당 위험 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Reliability / fault tolerance·recoverability | 주입 실패 지점 8개(V5)와 STALE | 실패 후 map.json 바이트 불변이고 temp 0개인 사례 / 전체, % | = 100% | automated V5, V6; review R1; mutation M1 | 결정 2, M3 |
| Q2 | Security / integrity·resistance | 파괴적 변경(delete·restore)과 경로 | token 없이·불일치로 변경된 사례 수, 경로 탈출 성공 수, 건 | = 0 | automated V8, V10, V12; mutation M2 | 결정 C, F15 |
| Q3 | Interaction capability / user error protection | 모든 ok:false Outcome | code와 비어 있지 않은 next를 가진 비율, % | = 100% | automated V13 | 완료 시나리오 5·6 |
| Q4 | Maintainability / testability | knowledge/*.mjs | npm run verify의 line·function coverage, % (branch는 측정·기록만) | = 100% | automated V14 | 결정 H |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | F1, F2, F5, F6, C1, C2, C3 | importResult | integration(임시 home), 전부 | decision table | 규칙: (map 없음, 신규)→imported gen1; (map 있음, 신규)→imported gen+1; (같은 id·내용)→duplicate; (다른 id·같은 hash)→duplicate | 100% | Outcome, map 계약 ok, revision 불변, duplicate 시 바이트 불변 | node --test |
| V2 | F3, C1, C4, C18 | observation 생성 | unit, 전부 | equivalence partitioning | assessment status 5종 × {체인 첫 등장, 이전 checkpoint에서 이미 관찰} | 100% | supported·partial 첫 등장만 생성, observationId 규칙·concept 값 일치(독립 계산) | node --test |
| V3 | F4, C4, C5 | checkpoint 순서 | integration, 전부 | state transition | 전이: ∅→1, 1→2, 2→3, ∅→2(거부), 1→3(거부), 3 재import(duplicate) | 100% | 기대 Outcome, 거부 시 next에 필요한 id | node --test |
| V4 | F1, C6 | import 거부 | integration, 전부 | equivalence partitioning | 같은 id 다른 내용, 다른 profile, baseMapRevision≠revision, v1, HASH 변조, 깨진 JSON, lesson 파일 없음, diagnostic 파일 없음, lesson 깨진 JSON, diagnostic 깨진 JSON, result 파일 없음 | 100% | 기대 code(INVALID+계약 코드/MISSING_*/IO), map.json 바이트 불변 | node --test |
| V5 | F7, F8, C7, Q1 | writeMap fs 실패 주입 | unit, 전부 | error guessing + equivalence partitioning | 실패 지점: mkdir, 백업 copy, temp open, write, fsync, close, rename, 백업 정리(성공 후 — map은 신규 상태, 결과 ok) | 100% | 앞 7개 IO·바이트 불변·temp 0, 정리 실패는 ok:true | node --test |
| V6 | F7, C8, Q1 | 동시 쓰기 | unit, 전부 | scenario testing | rename 직전 디스크 generation을 +1로 바꾸는 주입 1건, 같은 generation 재기록 주입 1건(바이트만 다름: 허용) | 100% | 첫째 STALE·주입 내용 유지·temp 0; 둘째 정책은 generation 기준이므로 ok | node --test |
| V7 | F8, C9 | 백업 회전 | integration, 전부 | boundary value analysis (3-value) | 쓰기 후 백업 수 4, 5, 6(→5) | 100% | 파일 집합 = 기대 generation, 내용 = 각 이전 map.json 바이트 | node --test |
| V8 | F10, F11, C11, C12, Q2 | delete | integration, 전부 | decision table | 규칙: (token 없음)→preview·불변; (token 일치)→적용; (token 불일치)→TOKEN; (preview 후 map 변경)→TOKEN; (map·백업 모두에 없는 id)→NOT_FOUND; (map에 없고 백업에만 있음)→정리 전용 preview·적용(map 바이트 불변); (적용 중 백업 rm 실패 주입)→PARTIAL_DELETE·map 새 상태·remainingBackups 일치, 이어서 같은 id 재실행으로 정리 완료; 대상 위치 {체인 첫, 중간, 끝} | 100% | preview 집합 독립 계산 일치(backupGenerations에 현재 generation 포함), 적용 후 계약 ok, 백업 삭제 집합 일치, lessons 유지 | node --test |
| V9 | F9, F12, F13, C13, C14, C15 | restore와 손상 | integration, 전부 | equivalence partitioning | 현재 상태 {잘린 JSON, 래퍼 누락, 계약 위반, 정상, 없음} × 백업 {모두 유효, 일부 손상, 전부 손상} | 100% | 손상 보존 copyFile 실패 주입 시 IO·변경 없음, 후보·lost 목록(손상 백업 포함)·후보별 token 일치, 판정 순서(NOT_FOUND→preview→TOKEN), 적용 후 generation=max+1, 손상 파일 바이트 보존, 후보 없음 NOT_FOUND | node --test |
| V10 | F15, C16, Q2 | profileId | unit, 전부 | syntax testing | `../x`, `a/b`, `A`, 빈 문자열, 65자, 정상 64자 | 100% | 무효 PROFILE·fs 호출 0회(주입 fs 기록), 정상 통과 | node --test |
| V11 | F14, C10, C18 | summarize | integration, 전부 | equivalence partitioning | map 없음, 빈 map, 결과·관찰 있음, pending만 | 100% | Signatures 형식의 줄 일치, unresolved는 체인 마지막 결과만, NO_MAP | node --test |
| V12 | F16, C17, C10 | CLI | integration(child_process, LEARN_TO_TELL_HOME), 명령별 대표 | scenario testing | import 성공, import duplicate, delete preview→confirm, restore preview→confirm, show(새 프로세스=재시작), 인자 오류 3종 | 100% | stdout 형식, exit 0/1/2, 재시작 후 내용 일치 | node --test |
| V13 | Q3 | 모든 오류 Outcome | unit, V4–V10의 ok:false 결과 전부 | equivalence partitioning | code 종류 전부 | 100% | code 존재, next 비어 있지 않음 | node --test |
| V14 | Q4 | coverage | Test command | statement(line)·function coverage (node --experimental-test-coverage) | knowledge/*.mjs 및 기존 include | 100% | verify 통과 | npm run verify |
| V15 | 회귀 | 기존 스위트 | 전체 | — | 기존 테스트 전부 | 100% | 통과 | npm run verify |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | lesson·diagnostic 파일명 `lessons/<lessonId>.<lessonRevision>.json`, `diagnostics/<diagnosticId>.json`; diagnosticId는 lesson.diagnosticId로 찾음 | 결정 A(profile 폴더 자동 조회)의 구체화 | 사용자 승인(v1) |
| A2 | checkpoint가 이전 결과의 assessment를 반복하므로 같은 체인에서 이미 관찰된 assessmentId는 observation을 다시 만들지 않음 | 계약상 checkpoint는 이전 assessments를 접두사로 포함 | 사용자 승인(v1) |
| A3 | 첫 map의 revision 1 (v2: 계약상 revision·baseMapRevision ≥ 1) | 결정 E(T4는 revision 미증가) | 사용자 승인(v1) |
| A4 | show는 텍스트, 나머지 CLI는 JSON 한 줄; 종료 코드 0/1/2 | 결정 6 | 사용자 승인(v1) |
| A5 | 복구 시 현재 map이 읽히면 일반 백업으로, 아니면 corrupt- 이름으로 보존 | 결정 4 "손상 파일 보존" | 사용자 승인(v1) |
| A6 | 백업 정리 실패는 저장 성공을 뒤집지 않음 | map은 이미 원자적으로 교체됨 | 사용자 승인(v1) |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| F1, F2, F5, F6 | C1–C3, C6 | V1, V4 | node --test |
| F3 | C1, C4, C18 | V2 | node --test |
| F4 | C4, C5 | V3 | node --test |
| F7, F8 | C7–C9 | V5–V7, R1 | node --test, R1 |
| F9, F12, F13 | C13–C15 | V9 | node --test |
| F10, F11 | C11, C12 | V8 | node --test |
| F14 | C10, C18 | V11 | node --test |
| F15 | C16 | V10 | node --test |
| F16 | C17 | V12 | node --test |
| Q1–Q4 | — | V5, V6, V8, V10, V12, V13, V14 | npm run verify, R1 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 4 |
| verifier invocations | 3 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| V1–V15 | 5 | tests/knowledge.test.mjs, tests/map-cli.test.mjs, tests/fixtures/knowledge/ @ working tree after correction batch 2; npm run verify 2541/2541, line·function 100% | accepted (verifier 2: V1–V8, V10–V15; verifier 3: V9) | — | V4, V8, V9, V11, V13 재작성(v2·v3), V4·V9 보강(batch 2) |
| R1 | 3 | knowledge/store.mjs writeMap | accepted (main) | map.json 쓰기는 writeMap의 rename 한 곳뿐(grep: writeFile/rename/open은 store.mjs에만). 백업은 writeMap 안에서 copyFile로만 생성되어 temp→rename을 거치지 않음: 부분 복사된 백업은 restore 후보 검증에서 제외(V9 some-corrupt)되므로 map 무결성에는 영향 없음. 기타 쓰기: delete.mjs rm(백업 삭제), restore.mjs copyFile(corrupt 보존, COPYFILE_EXCL) — map.json·백업 생성 아님 | 백업 원자성이 필요해지면 재개 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | 구현·테스트 challenge: 첫 map revision 0이 계약 RANGE와 충돌, restore token·lost·순서·show 집계 모호 | spec 결함 | v2 개정(사용자 결정), 양측 재배정 | 109/109 통과 |
| 2 | verify 커버리지 미달(delete 백업 삭제 실패, lesson JSON 손상, corrupt 보존 실패 경로) | spec 공백 | v3 개정(PARTIAL_DELETE·정리 전용 delete 등) | 2536 통과, function 99.03% |
| 3 | function 커버리지 미달: lesson·diagnostic 계약 위반, corrupt 이름 충돌 | test 결함(선언된 동작 미검증) | 테스트 보강만 | verify 통과 2541/2541, 100% |
| 4 | verifier 1: KT4-F1(V9 비최신 후보 복구 미검증; 변이 M1a '항상 최신 후보 복구' 121/121 통과로 gap 확인), KT4-F2(V8 무관 체인 미포함), KT4-F3(V2 기존 map에 lesson 추가 미검증), KT4-S1(손상 generation 표식) | 테스트 gap + spec 공백 | v4 개정(S1 사용자 결정), 테스트 보강; A1 기각: checkpoint는 이전 assessments를 동일 접두사로 요구(contracts/index.mjs checkpoint)해 상태 전이 불가; A2(generation ≥10 정렬) 채택 | verify 2547/2547·100%; 변이 M1 '항상 최신 후보 복구' 2 fail, M2 '삭제 시 관측 과다 제거' 3 fail, M3 'rename 전 generation 재확인 생략' 3 fail — 모두 검출, seed restore 완료 |
| 5 | verifier 2: KT4-F4(V9 손상 래퍼 generation이 모든 백업보다 큰 경우 미검증) | 테스트 gap | 변이 M4 '손상 현재 generation 무시' 127/127 통과로 gap 확인, seed restore | 예산 소진 → limit handoff |
| 6 | KT4-F4 보강(batch 4) | — | `[V9.corrupt-tag-dominates]` 추가 | verify 2548/2548·100%; M4 재실행 시 해당 테스트 1 fail로 검출, seed restore |
| 7 | verifier 3 | — | KT4-F4 closed, V9 accepted | complete |

# Version Log
## v1
- 초안. 입력: stale handoff fd373bf6199a30e8의 결정 1–6, 계약 v2(67a17d2), 이번 세션 결정 A–H(profile 폴더 조회, supported·partial observation, 2단계 token, 백업 파일 삭제, 파일 밖 generation 래퍼·revision 미증가, 역순 거부, LEARN_TO_TELL_HOME+fs 주입, line·function 100%).
- 기각: import마다 map.revision 증가 — validateBundle의 `baseMapRevision === map.revision`과 checkpoint 동일 조건 때문에 같은 세션 checkpoint 2가 항상 REVISION 거부됨. 계약 수정·map 계약 필드(v3)·별도 메타 파일 대신 파일 밖 래퍼 선택.
## v2
- 구현·테스트 spec challenge 반영(사용자 결정): A3·F1 첫 map revision 0→1(계약 RANGE와 충돌); 복구 후보별 token과 preview.token=candidates[0].token; lostGenerations 정의; applyRestore 판정 순서; 삭제 preview에 삭제 직전 백업 포함; ENOENT 외 읽기 오류는 IO Outcome; show는 체인 마지막 결과만 미확인 집계, 텍스트 형식 고정; MAP_UNREADABLE next에 restore; writeMap 부재 시 expectedGeneration 0; readMap bytes는 Buffer.
- 영향: V1(rule-1), V8, V9, V11, V13 재작성 필요. 나머지 obligation의 기대는 불변.
## v3
- `npm run verify` 커버리지 미달(knowledge 함수·라인)이 드러낸 미정 동작을 사용자 결정으로 확정: 삭제 중 백업 삭제 실패는 PARTIAL_DELETE + 같은 resultId 재실행 시 정리 전용 delete; lesson·diagnostic 깨진 JSON은 INVALID(JSON /lesson·/diagnostic); 복구 시 손상 파일 보존 실패는 IO·변경 없음; lostGenerations는 손상 백업 포함.
- 기각: 백업 삭제 실패를 IO로 보고(map은 이미 바뀌어 사용자 오해, 재실행 시 NOT_FOUND로 정리 불가), 성공+경고(삭제된 기록이 남아도 성공으로 보임).
- 영향: V4, V8, V9 재작성. 나머지 불변.
## v4
- verifier 1 KT4-S1: 손상 파일 generation 표식과 F13 '현재' = 읽을 수 있는 래퍼 generation, 아니면 0(사용자 결정). 기대 동작 변경 없음(구현과 동일), 테스트 단언만 강화.
## v5
- 사용자 결정: limit 이후 KT4-F4 수정과 verifier 1회 추가 승인(max_verifier_invocations 2→3). 동일 run 재개, 기존 카운트(2) 보존. 기대 동작 변경 없음.
