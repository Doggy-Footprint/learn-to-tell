---
version: 2
run_id: 3c9d5e71a0b84f26
status: complete
base_commit: 699e53f1d426849e7305d534ca960a1c0af0d066
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| I1 | 사용자(학습자) | 수업 결과를 파일로 내려받아 경로를 전달하지 않는다. 수업 화면의 버튼 하나로 결과가 agent에게 넘어간다 | 수업 화면에 파일 다운로드가 없고, 제출 버튼을 누르면 `--out` 폴더에 결과 JSON이 생긴다 |
| I2 | agent(skill) | 결과 파일의 위치를 사용자에게 묻지 않고 알고 있다 | SKILL.md가 `serve.mjs --out $W`를 쓰고 `$W/result-<resultId>.json`을 import한다 |
| I3 | 사용자 | 같은 PC의 다른 웹페이지가 결과 수신 서버에 쓰지 못한다 | 허용되지 않은 Origin의 요청은 거부되고 파일이 생기지 않는다 |

# Scope
In scope: `serve.mjs`를 정적 서빙 + 결과 수신 서버로 재작성(`--out <dir>` 추가, `http-server` 자식 프로세스 제거); 수업 화면의 "결과 파일 내려받기"를 "결과 제출"(POST)로 교체하고 다운로드 경로 삭제; 안내문(`EXPORT_NOTICE`) 갱신; e2e·단위 테스트 이관; SKILL.md 7·8단계와 reference 갱신; handoff의 F1 처리; `http-server` 의존성 제거.
Out of scope: 결과 JSON 내용·계약·해시 변경; map import 로직 변경; 진단; 자동 import(agent가 사용자 완료 알림 뒤 파일을 읽어 `map.mjs import`를 실행하는 흐름은 skill 문장으로만 정의); 수업 화면 시각화.

# Paths
Implementation: scripts/serve.mjs, site/src/components/ui.js, site/src/components/content.js, package.json, package-lock.json, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/reference.md
Tests: tests/e2e/, tests/skill-docs.test.mjs, tests/learning.test.mjs, tests/fixtures/learning/, tests/serve.test.mjs (신규)
Test command: `npm run verify`
Review evidence: none — 화면 문구의 어색함은 사용자 실행으로 확인(범위 밖)

# Signatures
`serve.mjs [--port <n>] [--out <dir>]`
수신 엔드포인트: `POST /__ltt/result` — 본문은 결과 JSON, `Content-Type: application/json`
응답: 성공 `200 {"ok":true,"file":"result-<resultId>.json"}`; 실패 `{"ok":false,"code":"<CODE>"}` (코드·상태는 Errors 참조)
저장 파일: `<out>/result-<resultId>.json` (본문과 바이트 동일한 `JSON.stringify(doc, null, 2)` 재직렬화가 아니라 수신 본문 그대로)
정적 서빙: `GET|HEAD /<path>` → `dist/<path>`, `/` → `dist/index.html`, 헤더 `Cache-Control: no-cache`
수업 화면: `data-testid="export-result"` 버튼 라벨 "결과 제출", 성공 시 `data-testid="export-status"` 요소에 제출 완료 문구, 실패 시 기존 `export-error`에 오류 표시

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| R1 | `serve.mjs`는 `dist/`를 `127.0.0.1`에서 정적 서빙한다. `/`는 `index.html`, 존재하지 않는 경로는 404, `dist/` 밖으로 나가는 경로(`..`, 인코딩된 `%2e%2e`, 절대경로)는 404이며 파일을 읽지 않는다. 응답에 `Cache-Control: no-cache`. HEAD는 GET과 같은 헤더에 본문 없음 | must | 기존 서빙 동작(http-server `-c-1`) 유지 |
| R2 | 기동 시 stdout에 `http://127.0.0.1:<port>/` 한 줄(기존 계약 유지). `--port` 없으면 4321. 잘못된 `--port`는 `ARGUMENT --port` exit 2, 알 수 없는 옵션은 `ARGUMENT <name>` exit 2, `dist/index.html`이 없으면 `DIST_MISSING dist/index.html` exit 1. SIGINT·SIGTERM에서 종료 | must | 기존 동작 유지 |
| R3 | `--out <dir>`: 절대 또는 상대 경로. 없는 폴더는 기동 시 만들지 않고, 첫 수신 때 `mkdir -p`로 만든다. 값이 없거나 빈 문자열이면 `ARGUMENT --out` exit 2. `--out` 없이 기동하면 수신 엔드포인트는 `404 NO_OUT` | must | 사용자 결정(serve 직접 수신), Assumption A1 |
| R4 | `POST /__ltt/result` 수신 본문이 결과 문서 shape 검증(`validateResultShape`와 동일 규칙, 계약의 `result` v2 구조 검증)을 통과하면 `<out>/result-<resultId>.json`에 원자적(임시 파일 + rename)으로 쓰고 `200 {"ok":true,"file":…}`. 같은 `resultId`가 이미 있으면 덮어쓴다(마지막 제출이 유효) | must | I1, Assumption A2 |
| R5 | 요청 `Origin` 헤더가 있으면 `http://127.0.0.1:<port>` 또는 `http://localhost:<port>`와 정확히 같아야 하고, 아니면 `403 ORIGIN` 이며 파일 미생성. `Origin`이 없으면(브라우저 외 클라이언트) 허용 | must | I3, Assumption A3 |
| R6 | 수신 본문 최대 1 MiB. 초과 시 `413 TOO_LARGE`, 본문은 더 읽지 않고 연결을 닫으며 파일 미생성 | must | Assumption A4 |
| R7 | `Content-Type`이 `application/json`이 아니면 `415 CONTENT_TYPE`. JSON 파싱 실패는 `400 JSON`. 계약 위반은 `422 INVALID`와 `errors:[{code,path}]`. 모두 파일 미생성 | must | 기존 계약 오류 형식 |
| R8 | `/__ltt/result`에 대한 POST 이외 메서드는 `405`. 저장된 파일명은 `resultId`(id 형식으로 검증됨)에서만 만들어 경로 탈출이 없다 | must | 보안 |
| R9 | 수업 화면의 파일 다운로드는 없다(Blob·`download` 속성·`a` 링크 클릭 없음). 버튼 `export-result`(라벨 "결과 제출")는 `fetch('/__ltt/result', {method:'POST'})`로 결과 문서를 보낸다. 해시 계산 실패·shape 실패는 기존처럼 `export-error`를 보이고 요청을 보내지 않는다 | must | I1, 기존 CH-V11 |
| R10 | 제출 성공(`200`)이면 `export-status`에 "제출했습니다. agent에게 끝났다고 알려 주세요."를 보이고, 비-200 또는 네트워크 실패면 `export-error`에 `⚠` 접두 문구와 서버 `code`(또는 `NETWORK`)를 보인다. 둘은 동시에 보이지 않는다. 다시 눌러 재제출 가능 | must | I1, Assumption A5 |
| R11 | `EXPORT_NOTICE`는 다운로드·경로 전달을 언급하지 않고, 제출이 map 저장이 아니며 agent가 검증한 뒤 map에 반영한다는 내용이다 | must | I1 |
| R12 | SKILL.md 7단계: `serve.mjs --out $W`로 실행, 사용자가 제출·완료를 알리면 `$W/result-<resultId>.json` 존재를 확인하고 8단계 import. `result-<resultId>.json`을 내려받는다·파일 경로를 받는다는 문장 없음. reference.md는 serve 사용법에 `--out`을 명시 | must | I2 |
| R13 | `package.json`에서 `http-server`를 제거하고 lockfile을 일치시킨다. 저장소에 `http-server` 문자열이 `package*.json`·scripts에 없다 | must | Assumption A6 |
| R14 | 위 변경 외 수업 런타임·결과 JSON 내용·진단·map 동작은 유지된다. `npm run verify`의 커버리지 게이트 유지 | must | 기존 verify |

# Errors
- `ARGUMENT <name>` exit 2 (stderr, stdout 빈 문자열, 서버 미기동): 알 수 없는 옵션, 잘못된 `--port`, 값 없는 `--out`.
- `DIST_MISSING dist/index.html` exit 1.
- 수신 오류 응답(파일 미생성, 서버는 계속 동작): `404 NO_OUT`, `403 ORIGIN`, `413 TOO_LARGE`, `415 CONTENT_TYPE`, `400 JSON`, `422 INVALID`, `405 METHOD`.
- 쓰기 실패(권한 등): `500 IO`, 임시 파일 제거, 기존 최종 파일 유지.
- 정적 경로 오류: `404`, 파일 미읽기.
- 화면: 해시·shape 실패는 요청 없이 `export-error`; 제출 실패는 `export-error`에 서버 code 또는 `NETWORK`.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C1 | normal | `serve --out O` 후 유효 result v2를 Origin 없이 POST | 200, `O/result-<id>.json`이 본문과 바이트 동일 |
| C2 | normal | 브라우저에서 수업 완료 후 `export-result` 클릭(Origin=서버) | 다운로드 이벤트 0, `O/result-<id>.json` 생성, `export-status` 표시 |
| C3 | normal | 같은 resultId를 partial → completed로 두 번 제출 | 두 번째 내용으로 덮어씀 |
| C4 | normal | `GET /`, `GET /index.html`, `HEAD /` | 200, dist와 같은 바이트(HEAD는 본문 없음), `Cache-Control: no-cache` |
| C5 | boundary | 본문 정확히 1 MiB 유효 문서 / 1 MiB + 1 byte | 전자는 처리(유효하면 200), 후자는 413, 파일 없음 |
| C6 | boundary | `--out` 폴더가 없음 | 첫 수신 시 생성 후 저장 |
| C7 | error | `--out` 없이 기동, POST | 404 `NO_OUT` |
| C8 | error | Origin `http://evil.example` / `http://127.0.0.1:9999`(다른 포트) / `null` | 403 `ORIGIN`, 파일 없음 |
| C9 | error | Content-Type text/plain / JSON 깨짐 / 계약 위반(필드 누락) | 415 / 400 / 422 + errors, 파일 없음 |
| C10 | error | PUT, GET `/__ltt/result` | 405 |
| C11 | error | `GET /../package.json`, `GET /%2e%2e/package.json`, `GET //etc/passwd` | 404, 내용 노출 없음 |
| C12 | error | `--out` 값 없음 / `--bogus` / `--port x` | exit 2, stderr `ARGUMENT …` |
| C13 | error | `dist/index.html` 없음 | exit 1 `DIST_MISSING dist/index.html` |
| C14 | error | 쓰기 불가 `--out`(읽기 전용 폴더) | 500 `IO`, 임시 파일 잔존 없음 |
| C15 | error | 서버 중지 상태에서 화면 제출 | `export-error`에 `NETWORK`, `export-status` 없음 |
| C16 | error | crypto 해시 실패 상태에서 제출(기존 CH-V11) | 요청 0건, `export-error` |
| C17 | edge | 제출 실패 후 서버 재기동·재클릭 | 성공, `export-error` 사라짐 |
| C18 | edge | SKILL.md·reference.md·content.js 텍스트 | R11·R12 문자열 조건 |
| C19 | edge | 저장소 파일 | `http-server` 참조 없음 (`package*.json`, scripts) |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 수신·서빙 정확성 |
| Performance efficiency | no | 1 MiB 한도 외 성능 요구 없음 |
| Compatibility | yes | 기존 serve CLI 계약·e2e 서빙 유지 |
| Interaction capability | yes | 제출 성공·실패 피드백, 키보드·접근성 유지 |
| Reliability | yes | 원자적 쓰기, 실패 시 기존 파일 유지 |
| Security | yes | 로컬 웹서버가 쓰기 엔드포인트를 가짐: Origin·크기·경로 탈출 |
| Maintainability | yes | 커버리지 게이트, 의존성 제거 |
| Flexibility | no | 이식성 변경 없음 |
| Safety | no | 해당 위험 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Security / integrity | 허용되지 않은 Origin·경로 탈출·초과 크기·잘못된 형식 요청 | C5·C8–C11 입력 각각에 대해 거부된 수 / 시도 수, 그리고 `--out` 밖에 생긴 파일 수 | 거부율 =100%, 밖에 생긴 파일 =0 | automated, mutation | I3 |
| Q2 | Reliability / fault tolerance | 쓰기 실패·덮어쓰기 중 기존 파일 | C3·C14에서 실패 후 기존 최종 파일 바이트 변화 수, 임시 파일 잔존 수 | 변화 =0, 잔존 =0 | automated | R4 |
| Q3 | Compatibility / co-existence | 기존 서빙 계약 | 기존 `T53-V11.*` 의미(기동 URL 줄, ARGUMENT·DIST_MISSING exit)의 통과 수 / 이관 후 해당 수 | =100% | automated | R2 |
| Q4 | Interaction capability / error protection | 제출 성공·실패 피드백이 스크린리더에 전달 | 기존 axe 검사에 제출 후 상태(성공·실패)를 포함, critical·serious 위반 수 | =0 | automated | 기존 quality.spec |
| Q5 | Maintainability / testability | 구조 커버리지 | 기존 `npm run verify` 게이트(contracts·learning·knowledge·authoring·examples) lines·functions | =100 | automated | package.json |
| Q6 | Functional suitability / correctness | 전체 스위트 | `npm run verify` | exit 0 | automated | R14 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O1 | R1,R2 / C4,C11,C12,C13 | `scripts/serve.mjs` 프로세스, 정적 서빙·기동·인자 | integration (프로세스 실행, 임의 포트), 열거 항목 전부 | 분류 트리 | 메서드 {GET,HEAD}×경로 {/,/index.html,없는 경로,`..`,`%2e%2e`,`//etc/passwd`}, 인자 {정상, --bogus, --port x, --out 값없음, dist 없음, --port 생략(기동 URL이 `http://127.0.0.1:4321/`; 4321이 이미 사용 중이면 환경 사유로 건너뛰고 사유를 출력)} | 100% | 상태 코드·헤더·본문·exit·stderr | tests/serve.test.mjs, tests/e2e/quality.spec.mjs |
| O2 | R3,R4 / C1,C3,C6,C7 | 수신 엔드포인트 정상 경로 | integration | 시나리오 | 시나리오 4(기본, 덮어쓰기, 폴더 생성, NO_OUT) | 100% | 응답 JSON, 파일 바이트, 파일 목록 | tests/serve.test.mjs |
| O3 | R5–R8 / C5,C8,C9,C10,Q1 | 수신 엔드포인트 거부 경로 | integration | 경계값 분석(2값) + 분류 트리 | 크기 {1MiB,1MiB+1}, Origin {없음,정확,다른 호스트,다른 포트,null,localhost 정확}, Content-Type {json,text,없음}, 본문 {정상,깨진 JSON,계약 위반}, 메서드 {POST,PUT,GET} | 100% | 상태·code, 파일 미생성(`--out` 폴더 목록 비교) | tests/serve.test.mjs |
| O4 | R4,Q2 / C14 | 쓰기 실패 | integration | 오류 추측 | 읽기 전용 `--out` 1건, 덮어쓰기 중 실패(최종 파일 읽기 전용 교체 불가) 1건, 임시 파일은 쓰였으나 rename이 실패(최종 경로가 비어 있지 않은 디렉터리) 1건 — 이 경우 500 IO, 폴더에 임시 파일 0개. 세 테스트는 건너뛰지 않고 실행되어야 한다(root·win32가 아닌 환경) | none — experience-based | 500 IO, 기존 파일 불변, 임시 파일 없음(rename 실패 포함) | tests/serve.test.mjs |
| O5 | R9,R10 / C2,C15,C16,C17 | 수업 화면 e2e(Playwright) | end-to-end | 상태 전이 | 전이 6개: 대기→성공, 대기→네트워크실패, 대기→서버코드실패(NO_OUT), 대기→해시실패, 실패→성공(재제출), 성공→실패(성공 뒤 서버 중지 후 재제출). 각 전이 뒤 `export-status`와 `export-error`는 동시에 보이지 않는다. 추가로 제출 중(요청 보류) 상태에서 성공 문구가 보이지 않는다 | 100% | `download` 이벤트 0, 요청 수, DOM(`export-status`/`export-error`), 서버 `--out` 파일 | tests/e2e/*.spec.mjs |
| O6 | R11,R12,R13 / C18,C19 | 텍스트·설정 파일 | unit | 분류 트리 | SKILL.md 존재 {`--out`, `result-`, `$W/result-<resultId>.json`, `serve.mjs --out $W`} 부재 {`내려받`, `파일 경로`}; EXPORT_NOTICE 존재 {`제출`, `agent`, `map`, `검증`} 부재 {`다운로드`, `내려받`, `경로`}; reference.md 존재 {`--out`}; package.json·package-lock.json·scripts/ 부재 {`http-server`} | 100% | 문자열 조건 | tests/skill-docs.test.mjs |
| O7 | R9,Q4 | 접근성 | e2e | 시나리오 | 제출 성공 상태, 제출 실패 상태 2개 화면 axe | 100% | critical·serious 위반 0 | tests/e2e/quality.spec.mjs |
| O8 | R14,Q3,Q5,Q6 | 전체 | all | 구조 기반: 문장·함수 커버리지(node coverage) | 기존 include 파일 라인·함수 | lines 100, functions 100 | `npm run verify` exit 0 | 명령 출력 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | user approval or explicit delegation |
| --- | --- | --- | --- |
| A1 | 수신 폴더는 `serve --out <dir>`로 받고 skill은 `$W`를 쓴다. 프로필 폴더에 직접 쓰지 않는다 | 사용자 결정은 "serve가 직접 수신"까지. 저장 위치는 미정이라 임시 작업 폴더로 제안(import 전 검증 단계 유지) | 승인됨 (2026-10-07) |
| A2 | 같은 `resultId` 재제출은 덮어쓴다 | partial → completed 순으로 같은 resultId를 내보내는 기존 export 동작 때문. 먼저 import한 뒤 덮어쓰면 map에는 반영되지 않음 | 승인됨 (2026-10-07) |
| A3 | `Origin` 없는 요청은 허용한다 | curl·테스트 클라이언트 지원. 같은 PC의 비브라우저 프로세스는 막지 못함(원래 로컬 접근 가능) | 승인됨 (2026-10-07) |
| A4 | 크기 한도 1 MiB | 현재 결과 JSON 크기를 측정하지 않았고 한도는 추정. 초과하면 정상 제출이 막힘 | 승인됨 (2026-10-07) |
| A5 | 성공 문구 "제출했습니다. agent에게 끝났다고 알려 주세요." | agent가 서버 수신을 감지하는 자동 알림은 없음(사용자 알림 필요). 서버가 stdout에 수신 줄을 내는 방식은 선택하지 않음 | 승인됨 (2026-10-07) |
| A6 | `http-server` 의존성을 제거한다 | 정적 서빙을 직접 구현하므로 불필요. 동작 차이(디렉터리 인덱스, MIME 목록 등)가 생길 수 있어 테스트로 고정 | 승인됨 (2026-10-07) |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| R1 | C4,C11 | O1 | serve.test |
| R2 | C12,C13 | O1 | serve.test, quality.spec |
| R3 | C6,C7,C12 | O1,O2 | serve.test |
| R4 | C1,C3,C14 | O2,O4 | serve.test |
| R5 | C8 | O3 | serve.test |
| R6 | C5 | O3 | serve.test |
| R7 | C9 | O3 | serve.test |
| R8 | C10 | O3 | serve.test |
| R9 | C2,C16 | O5 | e2e |
| R10 | C2,C15,C17 | O5,O7 | e2e |
| R11 | C18 | O6 | skill-docs.test |
| R12 | C18 | O6 | skill-docs.test |
| R13 | C19 | O6 | skill-docs.test |
| R14 | — | O8 | npm run verify |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| O1–O8 | 2 | verifier 2 (spec v2) + 테스트 tag 맵 | accepted | 모두 accepted. mutation M1·M2·M3 검출. advisory A2·A3(비원자 쓰기, content-length만 검사) 미실행 | v2 이후 변경 없음 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | serve.test [O3.body] 해시 변조를 422로 기대 | 테스트가 spec(R4: shape 검증만) 밖을 기대 — test defect | 단언 제거 | resolved |
| 2 | e2e [T54S-O5.submitting] 90s 타임아웃 | 없는 요소에 textContent 자동 대기 — test defect | toHaveCount(0)로 교체 | resolved |
| 4 | verifier 1: F1 R2 기본 포트 미관찰, F2 rename 실패 시 임시 파일 정리 미관찰, F3 성공→실패 전이 미관찰, S1 O6 문자열 집합 미정(spec) | 증거 부족 3건 + spec 공백 1건 | 사용자 승인(2026-10-07)으로 spec v2에 관찰 항목·문자열 집합 명시, 테스트 보강 | resolved; verify green(3062 node, 87 e2e, skipped 0); mutation M1(임시 파일 미삭제)·M2(Origin 포트 무시)·M3(stale export-status) 모두 의도한 단언이 검출, 복원 확인 |
| 5 | verify 최종 재실행 중 values.spec [V5.S3.reload] defect-percent 6.2s 실패 재발(전체 약 8회 중 verify5·verify8 2회; 이후 전체 3회·단독 24회 통과). verifier 2는 이 실패를 알기 전에 "verify 통과" 전제로 발송됨 | 원인 미규명(첫 reload 테스트의 간헐 지연 가설, 변경 전 기준선 비교 없음) | 비차단 기록 | 미해결 간헐 실패, handoff에 기록 |
| 3 | 1회 관찰: values.spec [V5.S3.reload] defect-percent 6.2s 후 요소 못 찾음 | 단독·재실행 3회 통과, 첫 reload 느림은 변경 전에도 관찰(2.5s) — flaky 가설(미검증) | 재실행 | 비재현, 기록만 |

# Version Log
## v1
- 초안. 사용자 결정 2026-10-07: 수업 결과 다운로드 제거, serve가 직접 수신.
## v2
- verifier 1 지적 반영(사용자 승인): O1 기본 포트 4321 관찰, O4 rename 실패 임시 파일 정리(+건너뛰지 않음), O5 전이 6개 열거와 성공→실패 포함, O6 문자열 집합 확정. R·Cases 변경 없음.
