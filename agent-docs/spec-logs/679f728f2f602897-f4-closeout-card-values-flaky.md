---
version: 1
run_id: 679f728f2f602897
status: complete
base_commit: 2359115d09303e66f2efec63bb62b9492c5037cb
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| I1 | 사용자 | limit으로 끝난 F4 run(`agent-docs/spec-logs/0dcd8454f6e5111d-f4-lesson-visuals-practical-range.md` v4)의 남은 감사 항목을 닫는다 | F8(출력 카드 현재 값·`정의되지 않음` 관찰)이 정확 일치 검사로 보강되고 V7이 재감사로 accepted |
| I2 | 사용자 | A-1: v2 의미 위반 동등성을 클래스×표면 전체로 확인한다 | v2 의미 위반 클래스 전부가 validateDocument·map·bundle 세 표면에서 v3 = v2 |
| I3 | 사용자 | 기존 flaky `O3.size`(EPIPE)와 `V8.S11`(단계 탐색 timeout)을 고친다 | 반복 실행에서 실패 0건 |

# Scope
In scope: 출력 카드 값 요소 testid `output-value-<outputId>` 추가(표시 문구 불변), F1 수업 카드 값 정확 일치 e2e 보강(V7 F8), V3 v2 의미 동등성 클래스×표면 전체 보강, `scripts/serve.mjs`의 413 응답 신뢰성(O3.size), e2e 단계 탐색 helper의 시간 기반 대기 제거(V8.S11).
Out of scope: 이전 run의 다른 요구사항·관찰(R1–R19 동작 불변), 카드·표·차트 문구 변경, MAX_BODY 값·413 응답 본문 변경, 새 의존성. ROADMAP §5·T5 handoff 갱신과 테스트 프로젝트 skill 재설치는 완료 후 main이 수행(문서 작업).

# Paths
Implementation: site/src/components/ui.js, scripts/serve.mjs
Tests: tests/
Test command: npm run verify && for i in $(seq 1 30); do node --test --test-name-pattern='O3.size' tests/serve.test.mjs > /dev/null || exit 1; done && npx playwright test tests/e2e/storage.spec.mjs --repeat-each=10
Review evidence: none — 표시 문구·스타일 변경 없음(testid 속성만 추가)

# Signatures
testid(새로 추가): `output-value-<outputId>` — `output-card-<outputId>` 안의 현재 값 요소. 텍스트 = 표시값이 수이면 `formatCount(값) + ' ' + unit`, null이면 `정의되지 않음`. 기존 카드 문구·구조 불변.
`scripts/serve.mjs` 수신 엔드포인트 413: 응답 코드·본문(`TOO_LARGE`, `ok:false`)·파일 미생성 불변.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| R1 | 출력 카드 값 요소에 `output-value-<outputId>` testid. 텍스트 규칙은 Signatures(이전 spec R12와 동일, 동작 변경 없음) | must | F8, 사용자 결정(2026-10-08) |
| R2 | 수신 엔드포인트에 MAX_BODY 초과 요청(Content-Length 선언 초과 또는 수신 중 초과)이 오면, 요청 본문을 한 번에 끝까지 쓰는 클라이언트가 소켓 쓰기 오류(EPIPE/ECONNRESET) 없이 413 응답을 끝까지 받는다. 응답 후 연결은 닫히고(5초 이내), 초과 본문은 저장되지 않는다(파일 미생성). 정상 크기(= MAX_BODY) 요청 동작 불변 | must | handoff Open Question, 사용자 결정 |
| R3 | e2e 단계 탐색 helper(`show`, `gotoStage`)는 단계 이동 후 고정 시간 대기 대신 단계 변경(관찰 가능한 DOM 상태)을 기다린 뒤 다음 판단을 한다 | must | handoff Open Question, 사용자 결정 |

# Errors
- 413 경로: 클라이언트 쓰기 오류 없이 413 `TOO_LARGE` 수신 — 연결 닫힘, 파일 없음, 서버는 다음 요청을 계속 처리
- 초과 본문을 끝내지 않는 클라이언트 — 서버는 5초 이내 연결을 닫음(무한 대기·무제한 수신 없음)
- 카드 값 null — `정의되지 않음`, 페이지 오류 없음

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | F1 기본값(load-a 20, load-b 10) | 출력 5개 `output-value-*` = 독립 계산 문구 |
| C2 | normal | 비기본 확정 상태, 모든 출력 non-null(예: load-a 25, load-b 12) | 5개 정확 일치 |
| C3 | edge | 확정 상태에서 margin null(load-b 18, 16 < b < 19) | `output-value-margin` = `정의되지 않음`, 나머지 4개 정확 일치 |
| C4 | normal | 슬라이더 미리보기 중(input 이벤트만) | 5개 = 미리보기 입력 기준 문구 |
| C5 | edge | null 확정 상태 → non-null로 복귀 | margin 문구가 수로 돌아옴 |
| C6 | boundary | 본문 = MAX_BODY / MAX_BODY + 1 바이트 | 200 / 413(쓰기 오류 없음, 연결 닫힘, 파일 없음) |
| C7 | error | Content-Length = MAX_BODY + 1이지만 본문을 일부만 보내고 멈춤 | 5초 이내 연결 닫힘, 파일 없음 |
| C8 | normal | 413 후 같은 서버에 정상 요청 | 200 |
| C9 | normal | V8.S11 시나리오 반복 | 매회 통과 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 카드 값·413 동작 |
| Performance efficiency | no | 계산·렌더 경로 변경 없음 |
| Compatibility | yes | 기존 testid·문구 불변, 기존 e2e 회귀 |
| Interaction capability | no | 화면 문구·스타일 불변(testid 속성만) |
| Reliability | yes | 413 신뢰성, 테스트 결정성(flaky 제거) |
| Security | yes | 초과 본문 미저장, 무한 수신 없음 |
| Maintainability | yes | 100% line/function coverage 유지 |
| Flexibility | no | 데이터 형태 변경 없음 |
| Safety | no | 안내 문구 변경 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Functional suitability / correctness | C1–C9 | 사례 통과율, % | = 100% | automated + mutation | spec |
| Q2 | Compatibility / co-existence | 기존 node·e2e 전체 | `npm run verify` 실패 수 | 0 | automated | 이전 spec I4 |
| Q3 | Reliability / faultlessness | O3.size 단독 30회, storage.spec `--repeat-each=10` | 실패 횟수 | 0 | automated (Test command) | 사용자 결정 |
| Q4 | Security / integrity | C6, C7 | 413 후 out 디렉터리 파일 수; 닫힘까지 시간, s | 0개; ≤ 5s | automated | 이전 serve spec R6 |
| Q5 | Maintainability / testability | 기존 coverage include | node line·function coverage % | 100% / 100% | automated | 기존 정책 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W1 | R1, C1–C5 | 빌드된 F1 수업 `output-value-<id>` | end-to-end (Playwright Chrome) | equivalence partitioning | 상태 {기본(C1), 비기본 확정 non-null(C2), 확정 margin null(C3), 미리보기(C4), null→non-null 복귀(C5)} × 출력 {part-a, part-b, total, fill-b, margin} = 25 항목 | 100% | 요소 텍스트 정확 일치(`toHaveText`) = 테스트가 fixture 수식(part-a 3a, part-b 2b, total 3a+2b, fill-b b/50·100, margin (1−b/50)·100, 16<b<19이면 null)과 formatCount 독립 구현으로 만든 문자열 | tests/e2e/visuals.spec.mjs |
| W2 | 이전 spec R4 (A-1) | validateDocument(lesson), validateDocument(map), validateBundle | unit | equivalence partitioning | v2 의미 위반 클래스 17종(현재 `SEMANTIC` 13종 + v1 상속 4종) × 표면 3종 = 51 항목 | 100% | 같은 위반을 넣은 v3와 v2 결과가 deepEqual, v2 결과는 `ok:false`이고 위반 코드·경로(map은 `/lessons/<i>` 접두, bundle은 `/lesson` 접두)를 포함 | tests/contracts-v3.test.mjs |
| W3 | R2, C6–C8, Q4 | `scripts/serve.mjs` 실제 프로세스 | integration (node child process) | boundary value analysis (2-value) + equivalence partitioning | 크기 {MAX_BODY, MAX_BODY+1}; 초과 감지 {Content-Length 선언, 선언 없음(chunked)·수신 중 초과}; 클라이언트 {본문 한 번에 전부 씀, 일부만 쓰고 멈춤}; 413 후 정상 요청 | 100% | 200 / 413 `TOO_LARGE`·클라이언트 `error` 이벤트 없음·연결 닫힘 ≤5s·파일 없음 / 이후 200 | tests/serve.test.mjs |
| W4 | R2, Q3 | O3.size 반복 | integration | random testing (반복 실행) | 실행 30회 | 100% | 30회 모두 통과 | Test command |
| W5 | R3, C9, Q3 | `tests/e2e/helpers.mjs`의 `show`·`gotoStage`, storage.spec | end-to-end | scenario testing | storage.spec 전체 × 10회 반복; helper가 단계 이동 후 고정 timeout 대기 없이 단계 변경을 기다림(코드 검토 항목 1) | 100% | 반복 실패 0; helper에 `waitFor({timeout: 400})` 류 고정 대기 없음 | Test command + test-verifier 검토 |
| W6 | Q2, Q5 | 기존 전체 | structure-based: statement + function (node --experimental-test-coverage) | include 전체 | 100% / 100% | npm run verify 통과 | npm run verify |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | 카드 값 관찰수단은 testid 추가 | 값 요소에 testid 없음(`site/src/components/ui.js:260`) | 사용자 결정(2026-10-08) |
| A2 | A-1은 클래스×표면 전체 | 이전 spec V3 coverage 문구 해석 | 사용자 결정(2026-10-08) |
| A3 | flaky 2건을 이번 run에 포함 | O3.size: 서버가 Content-Length 초과 시 즉시 413 후 `finish`에서 socket destroy → 아직 본문을 쓰는 클라이언트가 EPIPE(hypothesis, `scripts/serve.mjs:84-90`); V8.S11: helper의 400ms 고정 대기(hypothesis, `tests/e2e/helpers.mjs:40,55`) | 사용자 결정(2026-10-08) |
| A4 | R2의 닫힘 상한 5초 | 기존 O3.size 테스트의 5000ms 대기와 동일 | 승인 대상 |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| R1 | C1–C5 | W1 | npm run verify |
| 이전 R4 (A-1) | — | W2 | npm run verify |
| R2 | C6–C8 | W3, W4 | Test command |
| R3 | C9 | W5 | Test command |
| Q1–Q5 | C1–C9 | W1–W6 | Test command |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 1 |
| verifier invocations | 1 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| W1–W6 | 1 | verify(배치 1 후): node 3347/3347, coverage line 100·func 100, e2e 130 passed, O3.size 30/30, storage.spec ×10 40/40 ; 감사 1회차 | accepted | 감사 1회차 PASS(blocking 0, advisory A1–A3); MA·MB·MC 검출 | helpers.mjs 변경은 이전 V9·V10 유지(대기 방식만 변경, 전체 e2e 통과) |
| 이전 V7 | 이전 v4 | verify8 + W1; 감사 1회차 | accepted | F8 closed(W1: C2·C3·C4·C5에서 정확 일치), F2·F3·F4·F7 closed 유지 | ui.js 변경은 testid 속성만 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | 첫 Test command: verify node 통과, e2e 1 실패 `F4C-W1.C4 preview` (part-a `60 pt` 기대 `105 pt`); O3.size 루프 1회차 실패 `request/socket: ECONNRESET` (413 응답은 수신) | T1 테스트 결함: 다른 슬라이더 미리보기 누적을 가정(이전 spec R11은 확정 입력 + 그 값, verified 문구); D1 구현 결함: 413 후 소켓 종료 경합 잔존(hypothesis) | 배치 1: test-implementer T1(슬라이더별 미리보기), implementer D1(실제 순서 재현 후 원인 진단) | T1: C4를 load-a 35·load-b 18 단독 미리보기 2개로 분리. D1 원인 verified: `agent:false` 클라이언트의 `Connection: close`로 Node가 413 응답 finish 직후 소켓을 닫아 쓰는 중인 클라이언트가 ECONNRESET(부하 시 재현 2–10/40) — 413을 본문 소진(`req.resume`) 후 `end`에서 전송, `socket.end()`, 3s 타이머(stall). 실패한 접근: finish 후 destroy, `Connection: close` 헤더, `socket.end()`만 교체(7–11/40). Test command 통과 |
| 2 | 감사 1회차 PASS: blocking 0; advisory A1(값 요소가 카드 안에 있는지 미검사), A2(chunked stall 미검사), A3(stall 시 413 전달 미검사) — spec 요구 밖, 비차단 | — | 확인 mutation(감사 제안 중 서로 다른 계층 3건: 화면 문구·전송 경합·자원 상한): MA 카드 null을 수로 렌더 → `F4C-W1.C3` `0 %` vs `정의되지 않음` 실패; MB 413 경로를 원래 코드(즉시 응답·finish 후 destroy)로 복귀 + CPU 부하 6 → O3.size 루프 24/30 실패, 모두 `the client wrote the whole body without a socket error`; MC stall 타이머 무력화 → `[O3.size stalled]` `connection still open after 5 s` | 3/3 검출, seed.py restore 확인. complete |

# Version Log
## v1
- 초안: handoff `agent-docs/handoff/f305f68fa49a22d3-f4-lesson-visuals-limit.md` Next Step 1·2와 Open Questions(A-1, flaky)를 사용자 결정(2026-10-08)으로 범위화.
