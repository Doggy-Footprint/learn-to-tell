---
version: 3
run_id: ba4dd28c51280386
status: complete
base_commit: d49945a2b61129473fd326725f14fec53f7e238c
max_verifier_invocations: 2
handoff: agent-docs/handoff/fd373bf6199a30e8-t4-record-roundtrip.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| U1 | 사용자 | 내보낸 결과의 변조·손상을 가져올 때 검출 | 내용이 바뀐 result는 HASH 오류로 거부됨 |
| U2 | 사용자 | 같은 결과를 다시 가져와도 map이 중복되지 않음 | resultId가 달라도 내용 hash가 같으면 validateBundle이 저장 불필요(duplicateOf)를 알림 |
| U3 | T4 구현자 | T4 기록 왕복이 쓸 hash 계약 확정 | result·map v2 계약과 Node·브라우저 동일 hash |

# Scope
In scope: result·map 계약 version 2와 `contentHash` 필드, 정규화·SHA-256 hash 규칙(handoff 결정 7–10), `contracts/index.mjs`의 hash 재계산 검증(result·map·bundle)과 중복 판정, 브라우저 내보내기에서 hash 기록, `validateResultShape`의 v2 대응, 테스트 fixture 갱신.
Out of scope: map 파일 저장·백업·복구·삭제·CLI(T4), v1→v2 변환(v1은 거부), responseId·assessmentId 생성 규칙 변경(접두사 유지), diagnostic·lesson 버전 변경(1 유지), `contracts/schemas/`(빈 디렉터리, 변경 없음).

# Paths
Implementation: scripts/build-lesson.mjs (contracts 복사 목록만), contracts/definitions.mjs, contracts/index.mjs, contracts/content-hash.mjs (신규), learning/result.mjs, site/src/components/ui.js, examples/ (v1 리터럴이 result·map인 경우만)
Tests: tests/contracts.test.mjs, tests/learning.test.mjs, tests/fixtures/, tests/e2e/
Test command: npm run verify
Review evidence: R1 — 정규화 규칙 문서(이 spec의 Signatures)와 `contracts/content-hash.mjs`가 단일 정규화 구현을 Node·브라우저가 공유하는지 main이 확인하고 Execution ledger에 기록.

# Signatures
contracts/content-hash.mjs (Node·브라우저 공용, Buffer·node: import 금지):
- export function canonicalContent(result) → string: result에서 최상위 `resultId`, `contentHash`를 뺀 객체를 직렬화. 객체 키는 기본 `Array.prototype.sort()` 순서(UTF-16 code unit)로 재귀 정렬, 배열 순서 유지, 공백 없음, 원시값은 `JSON.stringify`와 동일.
- export async function computeContentHash(result) → `'sha256-' + 소문자 hex 64자`: `globalThis.crypto.subtle.digest('SHA-256', UTF-8(canonicalContent(result)))`.
contracts/index.mjs:
- 내부 동기 계산은 `node:crypto` `createHash('sha256')`로 같은 canonicalContent를 hash한다.
- validateDocument(document, 'result'|'map'), parseDocument, validateBundle: 기존 시그니처 유지.
- validateBundle 성공 반환: `{ok:true, errors:[]}` 또는 중복이면 `{ok:true, errors:[], duplicateOf:'<map 안 기존 resultId>'}`.
learning/result.mjs:
- buildResult(progress, lesson, session, now) → `contentHash` 제외 result v2 본문(version 2). 동기 유지.
- export async function finalizeResult(document) → `{...document, contentHash: await computeContentHash(document)}`.
- validateResultShape(document): v2 구조 + contentHash 형식(VALUE) 검사. hash 재계산은 하지 않는다(브라우저 동기 API 유지).
site/src/components/ui.js: exportResult가 buildResult → finalizeResult → validateResultShape → 다운로드 순으로 동작(async).

## Contract shapes
- result v2 = v1 필드 + `contentHash: string` (형식 `^sha256-[0-9a-f]{64}$`). `version` 값 2.
- map v2 = v1 필드, `version` 값 2, `results[]` 각 항목은 result v2(contentHash 포함).
- diagnostic·lesson은 version 1 유지. kind별 기대 버전과 다르면 VERSION.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| F1 | result·map의 version은 2만 허용, diagnostic·lesson은 1만 허용 | must | handoff 결정 9 |
| F2 | result는 contentHash 필수, 형식 위반은 VALUE | must | 결정 3, 사용자 확정(형식) |
| F3 | contentHash = SHA-256(canonicalContent), 입력에서 resultId·contentHash만 제외(responses[].recordedAt 포함) | must | 결정 7, 8 |
| F4 | 형식이 맞지만 재계산 값과 다르면 HASH 오류: result 문서 `/contentHash`, map `/results/<i>/contentHash`, bundle `/result/contentHash`·`/previousResult/contentHash`·`/map/results/<i>/contentHash` | must | 결정 3, 사용자 확정(map 재계산) |
| F5 | HASH 검사는 구조 검증 통과 후에만 수행(구조 오류 있으면 HASH 미보고) | must | 기존 구조→의미 순서 |
| F6 | bundle에서 map.results에 resultId는 다르고 contentHash가 같은 항목이 있으면, 다른 오류가 없을 때 ok:true와 duplicateOf=그 항목의 resultId | must | 결정 3, 사용자 확정(신호) |
| F7 | 같은 resultId인데 내용이 다르면 기존대로 CONFLICT `/result/resultId` | must | 결정 3 |
| F8 | 같은 resultId·같은 내용은 기존대로 ok:true이며 duplicateOf는 그 resultId | must | A1 |
| F9 | Node `contracts/index.mjs` 계산과 `computeContentHash`가 같은 입력에 같은 문자열을 낸다 | must | 결정 7 |
| F10 | 브라우저 내보내기 결과는 version 2와 올바른 contentHash를 포함하고, validateDocument(…,'result')가 ok:true | must | Next Step 1 |
| F11 | v1 result·map은 VERSION `/version`으로 거부 | must | 결정 9 |

# Errors
- contentHash 누락 — REQUIRED `/contentHash` — 문서 거부, HASH 미검사.
- contentHash 형식 위반 — VALUE `/contentHash` — 문서 거부, HASH 미검사.
- 재계산 불일치 — HASH (F4 경로) — ok:false, duplicateOf 없음.
- v1 문서 — VERSION `/version` — ok:false.
- duplicateOf 대상이 있으나 다른 오류 존재 — 오류만 반환, duplicateOf 없음.
- 브라우저 crypto.subtle 실패 또는 shape 오류 — `export-error`에 메시지, 다운로드 없음(기존 동작 유지).

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | 올바른 v2 result / map / bundle | ok:true, errors [] |
| C2 | normal | map에 다른 resultId·같은 hash 결과가 있는 bundle | ok:true, duplicateOf=기존 resultId |
| C3 | normal | 같은 resultId·같은 내용 | ok:true, duplicateOf=그 resultId |
| C4 | error | result 필드 하나(예: responses[0].answer, recordedAt, kind 외 임의 필드 값) 변경 후 hash 미갱신 | HASH /contentHash |
| C5 | error | map.results[i] 내용 변조 | HASH /results/i/contentHash |
| C6 | error | contentHash 누락 / 형식 위반(접두사 없음, 대문자, 63자) | REQUIRED / VALUE |
| C7 | error | version 1 result·map, version 2 diagnostic·lesson | VERSION /version |
| C8 | error | 같은 resultId·다른 내용 | CONFLICT /result/resultId |
| C9 | boundary | resultId만 바꾼 result(hash 그대로) | 단독 검증 ok:true(resultId는 hash 입력 아님) |
| C10 | boundary | 키 순서만 다른 동일 result, 비 ASCII(한국어) 답 포함 | 같은 hash, Node=Web 일치 |
| C11 | edge | duplicate 대상 존재 + 다른 의미 오류(예: PROFILE) | ok:false, duplicateOf 없음 |
| C12 | normal | 브라우저 e2e 내보내기 파일 | version 2, contentHash 형식, Node validateDocument ok:true |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | F1–F11 |
| Performance efficiency | no | 문서 1MB 상한, SHA-256 비용 무시 가능. 측정 대상 없음 |
| Compatibility | yes | Node와 브라우저 hash 상호운용(F9) |
| Interaction capability | no | 화면 변경 없음(내보내기 동작만 async) |
| Reliability | no | 저장·복구는 T4 범위 |
| Security | yes | 무결성: 우발적 손상·수동 변조 검출. 인증(서명)은 범위 밖 |
| Maintainability | yes | 정규화 구현 단일화, 기존 100% line/function coverage 유지 |
| Flexibility | no | 단일 환경 범위 |
| Safety | no | 해당 위험 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Compatibility / interoperability | Node 26 node:crypto vs Web Crypto(Node globalThis.crypto 및 Playwright Chromium) | 고정 입력 집합(C10 포함)에서 일치 개수 / 전체, % | = 100% | automated V6, V7; mutation M2 | 결정 7 |
| Q2 | Security / integrity | 단일 필드 변조 검출 | V4의 변조 항목 중 HASH로 거부된 비율, % | = 100% | automated V4; mutation M1 | 결정 3 |
| Q3 | Maintainability / modularity·testability | contracts/*.mjs, learning/*.mjs | npm run verify의 line·function coverage, % | = 100% (기존 임계값 유지) | automated Test command; review R1 | 기존 verify |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | F1, F11, C1, C7 | validateDocument 4 kind × version | unit, 전부 | equivalence partitioning | {diagnostic,lesson}×{1 유효, 2 무효}, {result,map}×{2 유효, 1 무효}, 기존 VERSION 경계 0·1.5 | 100% | 유효 ok:true, 무효 VERSION /version | node --test |
| V2 | F2, C6 | result.contentHash 형식 | unit, 전부 | syntax testing | 누락, 정상, 접두사 없음, `sha1-` 접두사, 대문자 hex, 63자, 65자, 비 hex 문자, 비문자열 | 100% | 누락 REQUIRED, 비문자열 TYPE, 나머지 무효 VALUE, 정상 ok | node --test |
| V3 | F3, C9, C10 | canonicalContent / computeContentHash | unit, 전부 | equivalence partitioning | 키 순서 다름, resultId 변경, contentHash 값 변경, recordedAt 변경, 중첩 배열 순서 변경, 한국어 문자열 | 100% | 처음 셋은 hash 동일, 뒤 셋은 hash 다름; 독립 oracle은 테스트 내 직접 계산한 node:crypto SHA-256과 알려진 고정 벡터 1건 | node --test |
| V4 | F4, C4, C5, Q2 | result 문서, map.results[i], bundle의 result·previousResult·map.results[i] | unit, 각 표면에서 대표 필드 | equivalence partitioning | 표면 5개 × 변경 필드 {kind 제외 최상위 스칼라 1, responses[0] 필드 1, assessments[0] 필드 1} | 100% | HASH, F4 경로 | node --test |
| V5 | F5, F6, F7, F8, C2, C3, C8, C11 | validateBundle 중복 판정 | unit, 전부 | decision table | 규칙: (같은 id,같은 내용)→ok+duplicateOf, (같은 id,다른 내용)→CONFLICT, (다른 id,같은 hash)→ok+duplicateOf, (다른 id,다른 hash)→ok만, (중복+다른 오류)→오류만, (구조 오류+hash 불일치)→HASH 없음 | 100% | 기대 반환 정확 일치(키 집합 포함) | node --test |
| V6 | F9, Q1 | Node 계산 vs computeContentHash(Node Web Crypto) | unit, 고정 입력 5건(C10 포함) | metamorphic testing | 입력 5건 | 100% | validateDocument가 computeContentHash로 채운 문서를 ok:true로 받음 | node --test |
| V7 | F10, F9, C12, Q1 | 브라우저 export 다운로드 | e2e, 기존 완료 흐름 1회 + partial 1회 | scenario testing | completed 내보내기, partial 내보내기 | 100% | version 2, 형식 일치, 테스트 프로세스의 validateDocument ok:true | playwright |
| V8 | learning validateResultShape | v2 shape | unit, 전부 | equivalence partitioning | 정상 v2, version 1, contentHash 누락, 형식 위반 | 100% | ok / VERSION / REQUIRED / VALUE | node --test |
| V9 | Q3 | coverage | Test command | statement(line)·function coverage (node --experimental-test-coverage) | contracts/*.mjs, learning/*.mjs, examples/manufacturing-inspection/*.mjs | 100% | verify 실패 없음 | npm run verify |
| V11 | Errors(브라우저 crypto.subtle 실패) | 브라우저 export 실패 경로 | e2e, 1건 | scenario testing | crypto.subtle.digest가 reject하도록 페이지 init script로 대체한 뒤 완료 흐름에서 내보내기 | 100% | `export-error`가 보이고 내용이 비어 있지 않음, download 이벤트 0건 | playwright |
| V10 | 회귀 | 기존 계약·학습·e2e 사례 | 전체 스위트, 기존 사례 v2로 갱신 | — (기존 obligations 재사용) | 기존 fixture 전부 | 100% | 기존 기대 유지(version 기대만 변경) | npm run verify |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | 같은 resultId·같은 내용(F8)도 duplicateOf를 반환 | 결정 3은 다른 resultId만 명시. T4가 저장 생략 신호를 하나로 다루도록 함 | 사용자 승인(v1) |
| A2 | 브라우저는 hash 재계산 검증 없이 형식만 검사, 정본 검증은 Node | crypto.subtle이 async라 validateResultShape 동기 유지 | 사용자 승인(v1) |
| A3 | 정규화·hash 모듈을 신규 `contracts/content-hash.mjs`로 두고 Node·브라우저가 공유 | 기존 contracts/index.mjs는 Buffer 사용으로 브라우저 불가 | 사용자 승인(v1) |
| A4 | hash 입력에 kind·version 포함 | 결정 8은 resultId·contentHash만 제외 | 결정 8에서 도출 |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| F1, F11 | C1, C7 | V1 | node --test |
| F2 | C6 | V2, V8 | node --test |
| F3 | C9, C10 | V3 | node --test |
| F4 | C4, C5 | V4 | node --test |
| F5–F8 | C2, C3, C8, C11 | V5 | node --test |
| F9 | C10 | V6, V7 | node --test, playwright |
| F10 | C12 | V7 | playwright |
| Errors(crypto 실패) | — | V11 | playwright |
| Q1–Q3 | — | V6, V7, V4, V9, R1 | npm run verify, R1 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 1 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| V1–V10 | 2 | 검증자 1회차 감사, verify 통과 트리 | accepted | 감사 근거는 E4 참조; mutation은 종료 전 수행 | V11 추가는 테스트 추가만이므로 영향 없음 |
| V11 | 3 | flow.spec.mjs CH-V11, 검증자 2회차 | accepted | M3 검출 | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| E1 | npm run verify: playwright WebServer `import not found: /contracts/content-hash.js` | 빌드가 contracts/definitions.mjs만 복사(verified: scripts/build-lesson.mjs) | spec v2에 경로 추가, 복사 목록에 content-hash.mjs 추가(main) | 재실행 |
| E2 | test-implementer 질의: F5의 "구조 검증" 범위 불명 | — | 기존 코드의 구조 단계(documentStructure: TYPE·REQUIRED·UNKNOWN_FIELD·VALUE·RANGE·LIMIT·KIND·VERSION)를 뜻함. 동작 변경 없는 해석이며 CH-V5 행으로 검증됨 | 거부(spec 변경 불필요) |
| E3 | test-implementer가 ID 접두사 CH- 사용, 추가 항목 CH-V8.hash-not-recomputed·CH-V10.build-result-v2·CH-V10.finalize-result | 기존 V1–V10 manifest id 충돌 | spec Signatures에서 직접 도출되는 검사이므로 유지 | 수용 |
| E4 | 검증자 1회차: SC1 차단(Errors의 브라우저 실패 경로에 obligation 없음), 자문 A1–A5 | 초안 누락 | 사용자 결정으로 V11 추가(spec v3) | V1–V10 accepted, A1–A5 advisory |
| E5 | V11 추가 후 npm run verify | — | node 2420 pass, playwright 56 passed, coverage 100% line/function | 통과 |
| M1 | hash 입력에 resultId 포함(content-hash.mjs) | Node·Web 공통 입력 결함 | 주입 후 verify | 검출: node 314 fail(CH-V3·CH-V6 포함) |
| M2 | 오류가 있어도 duplicateOf 반환(index.mjs) | 판정 순서 결함 | 주입 후 verify | 검출: node 7 fail(CH-V5) |
| M3 | 브라우저 digest 실패를 삼키고 가짜 hash로 다운로드(ui.js) | 실패 경로 결함 | 주입 후 verify | 검출: CH-V11 toBeVisible 실패 |
| R1 | 정규화 단일 구현 검토 | — | canonicalContent는 contracts/content-hash.mjs에만 있고 index.mjs가 import, 브라우저는 computeContentHash 사용 | 통과 |
| E6 | 검증자 2회차: pass, SC1 종료, 차단 없음 | — | — | 완료. 자문 A1–A5와 CH-V11 고정 대기 1500ms는 advisory로 남김 |

# Version Log
## v3
- V11 추가(브라우저 crypto 실패 시 export-error, 다운로드 없음). 근거: E4 SC1, 사용자 승인.
## v2
- Implementation 경로에 scripts/build-lesson.mjs 추가. 근거: E1. 동작·품질 목표 변경 없음.
## v1
- 초안. handoff 결정 3, 7–10과 이번 세션 사용자 확정(ID 접두사 유지, duplicateOf 신호, `sha256-` 형식·HASH 코드, map 재계산)을 반영.
