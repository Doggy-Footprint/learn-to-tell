---
version: 3
run_id: a96c8781ab82e025
status: limit
base_commit: 1d0021fcc29448b2551e2adccaa297b539f16ff4
max_verifier_invocations: 2
handoff: agent-docs/handoff/3b9ef4b406088e7f-skill-generation-diet.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 계획 3 run S | 생성 agent가 자기 수업 화면을 직접 보는 눈 검토에 쓸 contact sheet를 audit이 만든다 | `audit.mjs --sheet` 한 번에 장면 전체를 줄인 화면으로 담은 JPEG 몇 장과 그 경로가 나온다 |
| UI-2 | 계획 3 run S | 움직이는 장면은 비트 시각마다 필름스트립 칸으로 보인다 | 장면이 노출한 비트(`#ltt-audit` `beats`) 시각의 화면이 칸으로 찍힌다(최대 4칸) |
| UI-3 | 사용자(understanding round 답) | `--sheet`는 값 없는 플래그, 수업은 `<lesson>/audit/`, 그 밖은 OS 임시 폴더; 1280×800 한 크기로 찍고 배지는 두 크기 경고 합집합; kit 후보 1을 넣는다 | 아래 FR-2·FR-6·FR-11 |
| UI-4 | handoff `3b9ef4b4…` kit 후보 1 | 같은 시각 비트를 합칠 때 글 없는 비트가 글 있는 비트를 가리지 않는다 | 장면 비트에 글이 남는다 |

# Scope
In scope: `audit.mjs`의 `--sheet` 플래그와 `audit({ sheet })` 옵션, 칸 촬영·배치·JPEG 합성, 결과 JSON `sheet` 필드와 보고 줄, 사용법 문구; kit `#ltt-audit` JSON에 장면 type 목록 추가; kit `sceneBeats` 같은 시각 합치기 규칙; `kit/CHANGELOG.md` 항목.
Out of scope: SKILL.md §3 8단계·standalone.md·learn-to-tell-PROJECT.md·look.md(main이 run 뒤 직접), 기존 `--shots` 동작, CDP 재작성(계획 run B), kit 후보 2–4, 경고 고침/권고 분류를 코드에 넣기, gallery 수업(ADR `61d6c4210ba48008`), `scripts/shots.mjs`, 마무리 측정.

# Paths
Implementation: skills/learn-to-tell/server/audit.mjs, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/CHANGELOG.md
Tests: tests/audit-sheet.test.mjs, tests/fixtures/sheet/
Test command: npm test && LTT_AUDIT=1 node --test tests/gallery-audit.test.mjs && npm run check:css
Review evidence: R-1 main이 `node skills/learn-to-tell/server/audit.mjs site/gallery/gpu/single-gpu-dataflow.html site/gallery/knowledge-graph/ontology-triples.html --sheet`를 돌려 나온 sheet를 Read하고, 장면마다 칸 수·배지·비트 글·장면 순서가 `--json` 결과와 맞는지, 25장면 수업이 여러 장으로 나뉘는지, 칸 안 장면 구도가 알아볼 만한지를 표로 남긴다(`agent-docs/spec-logs/a96c8781ab82e025-r1-sheet.txt`와 sheet 사본 `a96c8781ab82e025-r1-*.jpg`). R-2 `audit.mjs`에서 프로세스를 띄우는 곳이 Chrome 실행 하나뿐인지 grep 결과를 같은 파일에 남긴다(QR-3).
Fuzzing: none — 입력은 audit JSON의 장면 수·비트 목록이고 경계·동등 분할로 다 덮는다. 칸마다 Chrome을 띄워 무작위 대량 실행이 비싸다.
Mutation tool: none — Stryker 미설치(run 6cc24f891a69c407 기록). 손 변이 HM-1..HM-10.

# Signatures
CLI: `node audit.mjs <대상>... --sheet [다른 옵션]` — 값 없는 플래그. 사용법 문구(`USAGE`)에 `--sheet` 줄이 있다.
API: `audit({ ..., sheet = false })` → 결과 배열(기존 형식). `sheet: true`이면 sheet 크기(FR-2)의 결과 항목마다 `sheet` 필드가 붙는다:
```
sheet: {
  size: "1280x800",
  dir: "<절대 경로>",
  files: ["<dir>/sheet.jpg", "<dir>/sheet-2.jpg", ...],
  cells: [{ file, scene, type, t, text, warn, x, y, w, h, failed }],
  failed: <촬영 실패 칸 수>,
  error: null | "<합성 실패 사유>"
}
```
- `scene`: 1부터 센 장면 번호. `type`: 장면 type 문자열(없으면 ""). `t`: 비트 칸이면 비트 시각(ms), 쉬는 칸이면 null. `text`: 비트 글 전체(자르지 않는다, 60자 자르기는 이미지 라벨에만) 또는 null. `warn`: 그 장면의 audit·lint 경고 규칙 id(모든 측정 크기 합집합, 중복 없음, 정렬). lint 경고는 `scene`이 있는 것만, 규칙 id가 없으면 `"lint"`. `x, y, w, h`: 그 sheet 이미지 안에서 화면 캡처가 놓인 사각형(px, 라벨 제외). `failed`: 그 칸 촬영 실패 여부.
보고(텍스트 출력): 기존 요약 줄 뒤에, sheet를 만든 대상마다 한 줄 `sheet <대상>: <파일 경로>[ <파일 경로>...]`(촬영 실패가 있으면 끝에 ` (칸 n개 촬영 실패)`), 합성 실패면 `sheet <대상>: 오류: <사유>`. 이 줄들이 출력의 마지막 줄이다.
촬영 호출 계약: 칸 하나마다 Chrome을 한 번 띄우고, 그 인자에는 대상 URL에 `#<장면 번호>`(1부터)를 붙인 주소가 있고 `?audit`은 없다(기존 `--shots`와 같다). audit 측정 호출은 `?audit` 주소, 합성 호출은 대상 URL을 인자로 갖지 않는다. 전달된 `chrome` 경로(CLI `--chrome`, API `chrome`)를 모든 호출에 쓴다.
kit: `#ltt-audit` JSON에 `types: [장면 type 문자열]`(장면 순서, 없으면 "")이 더해진다. 다른 필드는 그대로.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `--sheet`(CLI)·`sheet: true`(API)일 때만 sheet를 만든다. 없으면 출력·종료 코드·Chrome 실행 횟수가 지금과 같다 | must | UI-1 |
| FR-2 | sheet 크기: 측정 크기에 `1280x800`이 있으면 그것, 없으면 첫 측정 크기. sheet는 그 크기 결과 항목에만 붙는다 | must | UI-3 |
| FR-3 | 칸 고르기: 장면 비트(`beats[i]`)에 글 있는 비트가 있으면 그것들, 없으면 모든 비트. 5개 이상이면 정렬된 목록에서 인덱스 round(k·(n−1)/3), k=0..3의 4개. 비트가 없으면 쉬는 칸 1개 | must | UI-2 |
| FR-4 | 비트 칸은 장면 진입 뒤 t ms의 화면이다(허용: t 이상 t+300 미만). 쉬는 칸은 `--budget` 시각의 화면(기존 `--shots`와 같은 시각) | must | UI-2 |
| FR-5 | 칸마다 장면 번호, type, 경고 배지(규칙 id, 없으면 배지 없음)를 이미지에 그린다. 비트 칸 아래에 비트 글(60자 넘으면 잘라 "…"), 글이 없으면 `<t/1000>s` | must | UI-1 |
| FR-6 | 저장 위치: 수업 대상(`<home>/lessons/<id>/…`)은 `<home>/lessons/<id>/audit/`, 그 밖(gallery 파일, URL)은 `<os.tmpdir()>/ltt-audit-sheets/<slug>/`(slug는 대상 라벨에서 `[\w.-]` 밖 글자를 `-`로 바꾼 것). 파일 이름은 `sheet.jpg`, `sheet-2.jpg`, … | must | UI-3 |
| FR-7 | 쓰기 전에 그 폴더의 `^sheet(-\d+)?\.jpg$` 파일만 지운다. 다른 파일은 건드리지 않는다 | must | UI-3 |
| FR-8 | 배치: 장면 순서대로, 한 장면의 칸은 같은 장 안에서 이어진다(읽는 순서: 왼→오, 위→아래). 장 하나는 긴 변 ≤1568px, 넓이 ≤1,200,000px². 칸의 화면 캡처는 폭 ≥280px, 측정 화면의 가로세로비 유지(±2%), 서로 겹치지 않고 이미지 안에 있다. 넘치면 다음 장으로 나눈다 | must | UI-1 |
| FR-9 | 파일은 JPEG(첫 바이트 FF D8). Chrome과 Node 내장 모듈만 쓰고, 새 의존성이나 OS 도구(sips 등)를 부르지 않는다 | must | UI-1 |
| FR-10 | 보고: Signatures의 텍스트 줄이 마지막 줄이고, `--json`이면 결과 항목의 `sheet` 필드로 나온다 | must | UI-1 |
| FR-11 | kit 비트 합치기: 같은 시각 t의 비트가 여러 번 오면, 글 있는 비트가 글 없는 비트를 대신한다. 글 있는 비트가 둘 이상이면 먼저 온 글이 남는다. 노출 형식(`{t}` / `{t, text}`, t 오름차순, 시각마다 하나)은 그대로 | must | UI-4 |
| FR-12 | kit `#ltt-audit` JSON에 `types`를 더한다 | must | FR-5 |
| FR-13 | `kit/CHANGELOG.md`에 FR-11·FR-12 항목 | should | 프로젝트 관례 |

# Errors
- 칸 하나의 Chrome 촬영 실패(오류·시간 초과·파일 없음) — 그 칸은 회색 자리에 "촬영 실패" 글, `cells[].failed: true`, `sheet.failed` 증가, 보고 줄 끝 `(칸 n개 촬영 실패)` — 다른 칸과 sheet 파일은 정상, 종료 코드는 경고 기준 그대로(0/1).
- 합성 실패(폴더를 만들 수 없음, JPEG를 만들지 못함) — `sheet.error`에 사유, 보고 `sheet <대상>: 오류: <사유>` — 종료 코드 2, audit 결과와 다른 대상의 sheet는 그대로 보고.
- 대상의 audit 자체가 오류(`r.error`) — 그 대상 sheet를 만들지 않고 sheet 줄도 없음 — 기존대로 종료 코드 2.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 수업 3장면(비트 없음 · 글 있는 비트 2개 · 글 없는 비트 3개), `--sheet`, 기본 크기 | `<lesson>/audit/sheet.jpg` 1장, 칸 1+2+3=6, cells의 scene·t·text가 FR-3대로, 마지막 줄 `sheet …: <경로>` |
| C-2 | normal | C-1의 비트 칸 | 칸 중앙 픽셀이 그 비트 끝 상태 색(비트 사이 머무름 ≥500ms 픽스처) |
| C-3 | boundary | 글 있는 비트 4개 / 5개 / 7개, 글 없는 1개와 글 있는 1개 섞임 | 4 → 4칸 전부, 5·7 → FR-3 인덱스 4칸, 섞임 → 글 있는 1칸 |
| C-4 | boundary | 장면 25개 수업 | 2장 이상, 장마다 FR-8 크기 한도, 장면이 장을 넘어 갈라지지 않음, 장면 순서 유지 |
| C-5 | boundary | 크기 `1440x900 1280x800` / `1440x900`만 / `1280x800 1440x900` | sheet.size 1280x800 / 1440x900 / 1280x800, 그 크기 항목에만 `sheet` |
| C-6 | normal | 한 장면에 두 크기에서 다른 경고 | `warn`이 합집합·정렬·중복 없음 |
| C-7 | normal | gallery 파일 대상 | 폴더 `<tmpdir>/ltt-audit-sheets/<slug>/` |
| C-8 | edge | 폴더에 이전 `sheet.jpg`·`sheet-2.jpg`·`sheet-3.jpg`, `notes.txt`, `sheets.jpg`; 새 sheet는 1장 | sheet-2·sheet-3 사라짐, notes.txt·sheets.jpg 남음 |
| C-9 | error | 특정 장면 촬영만 실패하는 Chrome 래퍼 | 그 칸 failed, 다른 칸 정상, 보고 끝 `(칸 n개 촬영 실패)`, 종료 코드 경고 기준 |
| C-10 | error | `<lesson>/audit`이 파일이라 폴더를 못 만듦 | `sheet.error`, 보고 `오류:` 줄, 종료 코드 2 |
| C-11 | normal | `--sheet` 없이 같은 수업 | 출력에 sheet 줄 없음, `sheet` 필드 없음, audit 폴더 안 생김, 결과는 기존과 같음 |
| C-12 | normal | kit: 같은 t에 글 없는 비트가 먼저, 글 있는 비트가 뒤 / 글 있는 비트 둘 / 글 없는 둘 | `{t, text}` 하나 / 먼저 온 글 하나 / `{t}` 하나 |
| C-13 | normal | `#ltt-audit` JSON | `types` 길이 = 장면 수, 각 장면 type |
| C-14 | edge | 대상 audit 오류(없는 페이지 URL 등) | sheet 없음, sheet 줄 없음, 종료 코드 2 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | FR-1..FR-13 |
| Performance efficiency | yes | 칸마다 Chrome을 띄우므로 생성 흐름 벽시계에 더해진다 |
| Compatibility | yes | skill은 macOS 밖(Linux)에서도 돈다. OS 도구 없이 Chrome만 써야 한다 |
| Interaction capability | yes | sheet를 읽는 것은 모델이다. 줄여 보지 않는 크기와 알아볼 칸 크기 |
| Reliability | yes | 칸 하나 실패가 sheet 전체를 막지 않는다 |
| Security | yes | URL 대상 라벨이 저장 경로가 된다(경로 이탈 금지) |
| Maintainability | yes | 기존 테스트·gallery 기준선 유지 |
| Flexibility | no | 새 환경 적응 요구 없음(Compatibility로 덮음) |
| Safety | yes | 파일 삭제가 있다(FR-7 범위 밖 파일 보존) |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Performance / time behaviour | gallery `knowledge-graph/ontology-triples.html`(25장면), 기본 jobs, 이 기계 | `--sheet` 있는 실행과 없는 실행의 벽시계 차, s, 1회 | ≤ 60 s | automated(테스트가 잰다) | 계획(생성 흐름 비용) |
| QR-2 | Interaction / 판독성 | 모든 sheet 장 | JPEG 헤더 폭·높이, cells 사각형 | FR-8 한도 | automated, review R-1 | Claude 이미지 입력 한도(긴 변 1568, 약 1.15–1.2MP) |
| QR-3 | Compatibility / co-existence | `audit.mjs` | 프로세스를 띄우는 호출 grep | Chrome 실행 하나뿐 | review R-2, automated(FR-9 JPEG) | UI-1 |
| QR-4 | Reliability / fault tolerance | C-9 | 실패 칸 외 칸 수 | 실패 칸 외 전부 정상 | automated | Errors |
| QR-5 | Security / integrity | URL 대상 `http://127.0.0.1:<port>/../../x` 꼴 | sheet 폴더 실제 경로 | `<tmpdir>/ltt-audit-sheets/` 아래 | automated | FR-6 |
| QR-6 | Maintainability / modifiability | 저장소 전체 | Test command | 통과, gallery 기준선 0 증가 | automated | 프로젝트 관례 |
| QR-7 | Safety / fail safe | C-8 | 남은 파일 목록 | FR-7 밖 파일 전부 남음 | automated | FR-7 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, FR-6, FR-10, C-1, C-7, C-11 | CLI 프로세스(stdout, 종료 코드, 파일) | end-to-end; 수업 대상·gallery 대상·플래그 없음 각 1 | equivalence partitioning | P1 수업+플래그, P2 gallery+플래그, P3 플래그 없음 | 100% | 경로·마지막 줄·sheet 필드 유무·audit 폴더 유무가 Case대로 | tests/audit-sheet.test.mjs |
| VO-2 | FR-3, C-1, C-3 | `audit()` API 결과 cells | end-to-end; 픽스처 장면별 | boundary value analysis (2-value) + equivalence partitioning | 비트 0, 글 있는 4, 5, 7, 글 없는 3, 섞임 | 100% | cells의 장면별 t·text 목록이 FR-3 식과 같음 | tests/audit-sheet.test.mjs |
| VO-3 | FR-4, C-2 | sheet JPEG 픽셀(Chrome으로 디코드) | end-to-end; 비트 칸 전부 + 쉬는 칸 1 | equivalence partitioning | 비트 칸 각 1, 쉬는 칸 1 | 100% | `cells[].x,y,w,h` 중앙 픽셀 색이 그 시각 상태의 색(채널 차 ≤40) | tests/audit-sheet.test.mjs |
| VO-4 | FR-5, FR-12, C-13 | cells 필드 + 이미지 라벨 자리 | end-to-end | equivalence partitioning | 배지 있음/없음, 글 있음/없음/60자 초과 | 100% | cells.type·warn·text가 기대와 같고, 칸 사각형 바깥 라벨 띠에 배경과 다른 픽셀이 있음 | tests/audit-sheet.test.mjs |
| VO-5 | FR-8, QR-2, C-4 | JPEG 헤더 크기, cells 사각형 | end-to-end; 25장면 픽스처 | boundary value analysis (2-value) | 1장/여러 장, 긴 변 1568, 넓이 1.2MP, 폭 280, 비 ±2% | 100% | 모든 장 한도 안, 칸 겹침 없음·이미지 안, 장면 칸이 한 장 안·장면 순서 단조 | tests/audit-sheet.test.mjs |
| VO-6 | FR-2, C-5, C-6 | 결과 배열 | end-to-end | decision table | 크기 목록 3가지(Case C-5), 경고 합집합 1 | 100% | sheet.size·붙은 항목·warn이 Case대로 | tests/audit-sheet.test.mjs |
| VO-7 | FR-7, QR-7, C-8 | 파일 시스템 | end-to-end | error guessing | 남은 이전 장, 비슷한 이름, 다른 파일 | none — experience-based | Case C-8대로 | tests/audit-sheet.test.mjs |
| VO-8 | Errors, QR-4, C-9, C-10, C-14 | CLI 종료 코드·stdout·cells | end-to-end; Chrome 래퍼 스크립트로 장면 하나 실패 | equivalence partitioning | 칸 실패, 합성 실패, 대상 오류 | 100% | Errors 표의 신호와 뒤 상태 | tests/audit-sheet.test.mjs |
| VO-9 | FR-9, QR-3 | JPEG 매직 바이트 + R-2 | end-to-end + review | equivalence partitioning | 모든 sheet 파일 | 100% | FF D8, R-2 grep Chrome 하나 | tests/audit-sheet.test.mjs, R-2 |
| VO-10 | FR-11, C-12 | 장면 `data-ltt-beats`와 `#ltt-audit` beats | integration(브라우저 픽스처) | decision table | 글 없음→있음, 있음→있음, 없음→없음, 있음→없음 | 100% | Case C-12대로, 다른 시각 비트는 그대로 | tests/audit-sheet.test.mjs |
| VO-11 | QR-1 | 벽시계 | end-to-end | equivalence partitioning | ontology-triples 1회 | 100% | 차 ≤60 s | tests/audit-sheet.test.mjs |
| VO-12 | QR-5 | sheet.dir | end-to-end | error guessing | `..`·`/`·`:` 든 URL 라벨 | none — experience-based | realpath가 `<tmpdir>/ltt-audit-sheets/` 아래 | tests/audit-sheet.test.mjs |
| VO-13 | QR-6, FR-13 | 저장소 | Test command | equivalence partitioning | 전체 suite | 100% | 통과 | Test command |
| VO-14 | QR-2, FR-5 | sheet 이미지 | review | scenario testing | R-1 두 수업 | 100% | R-1 표 | R-1 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| A-1 | `--sheet` 값 없는 플래그, 수업 → `<lesson>/audit/`, 그 밖 → OS 임시 폴더 | understanding round Ask 1 | user answer |
| A-2 | sheet 크기 1280×800 우선, 배지는 크기 합집합 | Ask 2 | user answer |
| A-3 | kit 후보 1 포함, 같은 t 글 둘이면 먼저 온 쪽 | Ask 3 | user answer |
| A-4 | 비트가 있으면 비트 칸만(쉬는 칸을 따로 넣지 않음), 없으면 쉬는 칸 1 | once 재생의 쉬는 화면 = 마지막 비트 끝이라 겹친다. 반복 재생의 쉬는 시각은 임의 위상이다 | brief v1 — approved |
| A-5 | 칸 최대 4, 고르는 식 round(k·(n−1)/3) | 계획 "최대 3–4칸", 처음·끝 비트를 남긴다 | brief v1 — approved |
| A-6 | 장 한도 긴 변 1568, 넓이 1.2MP, 칸 폭 ≥280 | 모델이 그보다 크면 줄여 본다. 칸 폭 280은 1280 화면의 약 22%로 구도는 보이고 글은 audit이 잰다 | brief v1 — approved |
| A-7 | 배지는 규칙 id만, 고침/권고 색 구분 없음 | 분류 목록은 SKILL.md에만 있다. 코드에 두면 두 곳이 어긋난다 | brief v1 — approved |
| A-8 | 칸 실패는 종료 코드를 바꾸지 않고, 합성 실패만 2 | 2는 SKILL.md에서 "브라우저로 연다" 분기라 칸 하나 실패로 보내면 과하다 | brief v1 — approved |
| A-9 | 비트 칸 시각 허용 t..t+300ms | 가상 시간 예산은 진입 직후부터 센다(shots.mjs 실측). 픽스처 머무름 ≥500ms로 판정 여유 | brief v1 — approved |
| A-10 | 결과 JSON에 칸 사각형 `x,y,w,h`를 낸다 | 테스트가 구현을 보지 않고 칸 픽셀을 읽을 표면. 생성 agent에도 쓸모(장면→칸 위치) | brief v1 — approved |
| A-11 | QR-1 60 s 한도 | gpu 14장면 `--shots` 8.4 s 실측. 25장면 × 평균 2–3칸이면 직렬 약 35 s, 병렬이면 더 짧다 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-11 | VO-1 | tests/audit-sheet.test.mjs |
| FR-2 | C-5 | VO-6 | tests/audit-sheet.test.mjs |
| FR-3 | C-1, C-3 | VO-2 | tests/audit-sheet.test.mjs |
| FR-4 | C-2 | VO-3 | tests/audit-sheet.test.mjs |
| FR-5 | C-1, C-6 | VO-4, VO-14 | tests, R-1 |
| FR-6 | C-1, C-7 | VO-1, VO-12 | tests/audit-sheet.test.mjs |
| FR-7 | C-8 | VO-7 | tests/audit-sheet.test.mjs |
| FR-8 | C-4 | VO-5 | tests/audit-sheet.test.mjs |
| FR-9 | C-1 | VO-9 | tests, R-2 |
| FR-10 | C-1 | VO-1 | tests/audit-sheet.test.mjs |
| FR-11 | C-12 | VO-10 | tests/audit-sheet.test.mjs |
| FR-12 | C-13 | VO-4 | tests/audit-sheet.test.mjs |
| FR-13 | — | VO-13 | Test command |
| Errors | C-9, C-10, C-14 | VO-8 | tests/audit-sheet.test.mjs |
| QR-1..QR-7 | C-4, C-8, C-9 | VO-5, VO-7, VO-8, VO-9, VO-11, VO-12, VO-13, VO-14 | tests, R-1, R-2 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 2 |
| verifier invocations | 2 |
| open finding ids | F-2 (verifier 2) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-2, VO-4, VO-5, VO-7, VO-9, VO-10, VO-11, VO-12, VO-13 | 3 | tests/audit-sheet.test.mjs (TD-1 rev), Test command run 4 (1222/1222) | accepted (verifier 1, 2) | — | 정정 묶음 2가 같은 테스트 파일·픽스처를 바꾸면 VO-2/3/4/5 공유 헬퍼(checkLayout, pickBeats, 디코더) 영향 재평가 |
| VO-1, VO-6, VO-8 | 3 | tests/audit-sheet.test.mjs 정정 묶음 2 | accepted (verifier 2) | HM-5, HM-13, HM-15, HM-16 KILLED | — |
| VO-3 | 3 | 같음 | open (F-2: 쉬는 칸이 넘긴 budget이 아닌 고정 시각이어도 통과) | HM-14 KILLED, HM-17(쉬는 칸 고정 12000) SURVIVED | budget에 따라 기대 색이 갈리는 검사(budget < 바뀌는 시각 → 회색, > → 파랑) |
| VO-14 | 3 | spec-logs/a96c8781ab82e025-r1-sheet.txt + r1-*.jpg | accepted (verifier 1, 2) | R1-1 fixed before record | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| TC-1 | Test command 1회차: tests/autolayout.test.mjs VO-9 PF1 중앙값 393ms > 300 | hypothesis: 새 audit-sheet 테스트(Chrome 다수)가 병렬 부하를 늘림, 이 run 밖 성능 검사 | 그대로 재실행 | 2회차 1221/1221 통과, gallery audit 통과, css in sync. 부하 민감 기록만 |
| TD-1 | test-implementer 질문: cells.text가 전체 글인지 자른 글인지(Signatures vs FR-5) | spec 공백 | v3에서 전체 글로 정함, 테스트를 전체 글 일치로 좁힘 | 정정 묶음 1 |
| R1-1 | R-1 사전 검토: 비트 칸 아래 글이 칸 폭에서 한 줄로 잘려 약 22자만 보인다(ontology-triples 장면 10) | implementation defect: FR-5의 60자 글 그리기 미충족 | 아래 띠를 3줄 줄바꿈으로, 넘치면 셋째 줄 끝 "…" | 정정 묶음 1에 포함 |
| verify-1 | verifier 1 retry: F-1 VO-1 P3가 Chrome 호출을 보지 않음(플래그 없이 촬영 Chrome이 떠도 통과), F-2 VO-3 쉬는 칸이 처음부터 회색이라 촬영 시각을 구분 못 함, F-3 VO-6 크기별 경고 차이를 단언하지 않음, F-4 VO-8(a) 실패 뒤 다른 칸이 실제로 찍혔는지 보지 않음. 권고 F-5(합성 실패 시 다른 대상), F-6(t+300 상한·loop 비트 색), F-7(라벨 … ·`s` 꼴), F-8(R-2 grep 명령), F-9(머리 주석 v2) | test evidence gaps | 정정 묶음 2: 테스트 보강(F-1..F-4, F-5, F-9), F-8은 main이 R-2 기록 보강 | Test command 1222/1222, gallery 1/1, css sync. 손 변이 2회차 HM-1..HM-16 모두 KILLED(의도한 VO 테스트), F-6(loop 비트 색 oracle 없음)·F-7은 권고로 둠 |
| verify-2 | verifier 2 retry: F-2 좁혀서 남음(쉬는 칸이 `--budget`을 무시하고 고정 시각이어도 통과). 권고 F-6, F-7, P3 호출 수 하한만 | test evidence gap(구현은 budget을 쓴다: HM-17 SURVIVED는 테스트 공백 확인) | verifier 예산 소진 → limit. 닫는 방법: late.js 장면을 budget 2000(회색)·6000(파랑) 두 번 찍는 검사 | limit |

# Version Log
## v1
- 초안. understanding round 답(A-1..A-3) 반영.
## v2
- 계약만: 촬영·측정·합성 호출을 Chrome 인자로 구분하는 계약을 Signatures에 적었다(C-9 래퍼가 구현을 보지 않고 칸 하나를 실패시킬 표면).
## v3
- 계약만: `cells[].text`는 비트 글 전체, 자르기는 이미지 라벨에만(test-implementer 질문 TD-1). 구현은 이미 전체 글을 낸다.
## v3 (close)
- status limit: verifier 2/2, F-2 열림(VO-3 쉬는 칸 budget 의존 증거). handoff `agent-docs/handoff/3b9ef4b406088e7f-skill-generation-diet.md`.
