---
version: 5
run_id: 37a2365a466d3e8b
status: complete
base_commit: a78503efc200bc3de983408c7ae72ee9dddc1168
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 사용자(계획 `we-will-perform-audit5-cost-and-outside-shiny-seal` Phase 2) | 수업 생성 비용(턴·Edit)을 줄인다. 생성 agent가 고쳐도 풀리지 않던 배율 경고를 kit이 먼저 흡수한다 | 저장된 생성 수업 첫 초안 corpus를 새 kit으로 다시 audit하면 `shrunk` 경고가 기준 kit의 0.65배 이하 |
| UI-2 | 같은 계획 | audit 출력만 보고 무엇을 어디서 고칠지 안다 | 줄마다 rule id와 등급(고침/권고), shrunk·overflow·hscroll·graph-overlap 메시지가 원인 상태·필드·요소·id를 말한다 |
| UI-3 | 같은 계획(사용자 결정: 권고는 첫 묶음에서만) | 권고만 남은 수업은 실패로 보이지 않는다 | 종료 코드 1은 고침 경고·고침 lint·expect 불일치가 있을 때만 |
| UI-4 | 프로젝트(ADR `40552fcb2a7c3985`) | 정답 공개·단계 이동이 장면 배율과 그림 크기를 바꾸지 않는다 | 공개·단계 이동 전후 장면 zoom과 그림 높이가 같다 |

# Scope
In scope: kit `ltt-deck.js`의 데스크톱 그림 흡수(K1)와 장면 측정값(배율을 정한 상태, 하한 도달, 가장 긴 글 필드, 가장 넓은 요소, 그래프 겹침 id, 흡수 비율), `ltt.js`의 `auditScene` 메시지와 audit·lint 경고의 `severity`, `#ltt-audit` JSON의 장면별 측정 요약, `server/audit.mjs`의 텍스트 보고 형식·종료 코드·사용법 문구, `kit/CHANGELOG.md`·`kit/api/internals.md`·`kit/api/rules.md`의 해당 서술.
Out of scope: schematic 그림 spec·K2 등록표(run B), 자동 `autoLayout` 대체, diagram 라벨 밀기, CDP 재작성, `--sheet` 칸 촬영 방식, 폰 배치(`mobileFit`), gallery 수업 수정(ADR `61d6c4210ba48008`), SKILL.md §3 흐름 문장, `LTT.placement`의 공개 모양(`{zoomLock}` 그대로), 기존 rule id·판정 임계값(78%·88%·10%·22%·35%·60%·7단계)의 변경, JSON 결과의 크기별 배열 모양.

# Paths
Implementation: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/server/audit.mjs, skills/learn-to-tell/kit/CHANGELOG.md, skills/learn-to-tell/kit/api/internals.md, skills/learn-to-tell/kit/api/rules.md
Tests: tests/audit-report.test.mjs, tests/absorb.test.mjs, tests/fixtures/absorb/, tests/motion-verbs.test.mjs, tests/fixtures/motion/, tests/kit.test.mjs, tests/scene-types.test.mjs, tests/placement.test.mjs, tests/api-docs.test.mjs, tests/release-docs.test.mjs, tests/gallery-audit.baseline.json
Test command: npm test && LTT_AUDIT=1 node --test tests/gallery-audit.test.mjs && npm run check:css
Review evidence: R-1 corpus 재audit — main이 `node scripts/reaudit-corpus.mjs <3 측정 폴더> --stage first --checkout <base_commit worktree>`와 같은 명령(현재 트리)을 각각 2회, `--stage final`도 같은 방식으로 돌려 규칙×등급 표를 `agent-docs/spec-logs/37a2365a466d3e8b-r1-corpus.txt`에 남긴다. R-2 메시지 표본 — R-1 새 kit 첫 초안 결과에서 shrunk 5건·overflow 전부·hscroll 전부를 골라, 메시지가 말한 상태·필드·요소가 그 수업 소스(장면 객체)와 맞는지 표로 남긴다(`37a2365a466d3e8b-r2-messages.md`). R-3 sheet 눈 확인 — R-1에서 흡수가 일어난 장면이 있는 첫 초안 2편을 `--sheet`로 찍어 그림이 잘리거나 비율이 깨지지 않았는지 본다(`37a2365a466d3e8b-r3-*.jpg`와 판정 줄).
Fuzzing: none — 입력은 렌더된 장면이라 무작위 생성이 비싸고, 실제 생성 수업 22편 corpus(R-1)가 대표 입력 분포다. 메시지·보고 형식은 결정표로 다 덮는다.
Mutation tool: none — Stryker 미설치(run 6cc24f891a69c407 기록), 전역 설치 금지. 손 변이 8–10개를 main이 고른다.

# Signatures
- 경고 객체(audit·lint 공통): `{ scene, rule, msg, severity }`, `severity`는 `"fix"`(고침) 또는 `"advise"`(권고). 권고 id는 정확히 `shrunk`, `small-visual`, `loose-figure`, `empty-stage`, `many-sizes`, `goal-narrow`, `still-visual`, `card-monotony`, `no-signature`, `unused-term`이고 나머지는 모두 `"fix"`. `LTT.auditScene(m)`과 `LTT.lintDeck(spec)` 둘 다 이 필드를 붙인다.
- `LTT.auditScene(m)`의 입력 `m`에 선택 필드가 늘어난다(없으면 지금과 같은 메시지 뼈대): `zoomBy`(문자열, 배율을 정한 상태 이름 — "질문", "정답 <선택지 글>", "단계 <k>", "회상 답" 중 하나, 장면 자신이 정했으면 없음), `floor`(불리언, zoom ≤ 0.781), `longest`(`{ field, chars }`, 장면 객체 최상위 필드 중 글이 가장 긴 것), `wide`(문자열, 가로로 가장 많이 넘친 요소의 `태그.첫클래스` 또는 `태그#id`, 폭 px 포함), `graphIds`(`["<kind> <a>/<b>", ...]`), `absorb`(0.65–1, 그림 높이 비율), `visualRatio`·`figRatio`는 흡수 전 그림 크기로 잰 값.
- `#ltt-audit` JSON: 기존 필드에 `measures: [{ zoom, absorb, zoomBy, floor }]`(장면 순서, 1-based 아님 배열 인덱스 = 장면 번호 − 1)가 더해진다. 장면 자신이 배율을 정했으면 `zoomBy`는 `null`이다(키는 늘 있다). `audit[]`·`lint[]` 항목에 `severity`.
- `audit({...})` 결과 배열 모양은 그대로(대상 × 크기 항목). 항목에 `measures`와 `bytes`(파일 대상이면 그 파일의 바이트 수, URL 대상이면 `null`)가 더해진다. `formatReport`는 대상 머리줄의 바이트를 이 `bytes`에서 읽는다.
- `formatReport(results)` 텍스트:
  ```
  <대상>  장면 <n> · <바이트> B            (대상마다 한 줄; 바이트는 파일 대상일 때만)
    <크기> (화면 W×H): audit <n>          (크기마다 한 줄)
    장면 N [rule·고침|권고] <크기들>: msg  (같은 장면·rule·msg가 여러 크기면 한 줄, 크기는 `·`로 잇는다)
    lint 장면 N [rule·고침|권고]: msg     (대상마다 한 번; 덱 lint는 "lint 덱 [...]")
    expect: <불일치 글>                   (대상마다 한 번)
  ```
  오류 항목은 지금처럼 `<크기> <대상>  오류: ...`. 끝의 크기별 합계 줄과 `sheet ...` 줄은 그대로.
- `exitCode(results)`: 2 = 측정 오류·sheet 오류(그대로), 1 = 어떤 결과에든 `severity: "fix"`인 audit 또는 lint 경고, 또는 expect 불일치, 0 = 그 밖(권고만 있어도 0). `USAGE`의 종료 코드 줄도 이 뜻으로.
- `LTT.placement`는 지금처럼 `{ zoomLock }`만 갖고 `zoomLock(question, zs)`는 수를 돌려준다.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | 데스크톱(`LTT.mobile()` 거짓)에서 장면 내용이 무대 높이(`el.clientHeight − 8`)를 넘으면, kit은 장면을 줄이기 전에 그 장면의 흡수 그림 높이를 하나의 비율 `absorb`(0.65 ≤ absorb < 1)로 줄인다. 흡수 그림 = `.dk-body` 안의 `svg[viewBox]`와 `[data-visual]` 중 아이콘(`.ltt-ic` 안)·목업(`.ltt-phone,.ltt-browser,.ltt-term-mock,.ltt-code`) 안·다른 흡수 그림 안이 아닌 것. 그림은 가로세로 비율을 유지한다. absorb는 장면이 배율 1로 들어가는 가장 큰 값이고, 0.65로도 안 들어가면 0.65이며 남은 넘침은 지금의 zoom이 맡는다. 넘치지 않는 장면은 absorb = 1이고 그림 스타일을 바꾸지 않는다. 측정 중의 임시 쓰기도 없다: 모든 상태가 배율 1로 들어가는 장면에서는 진입·창 크기 변경 동안 kit이 흡수 그림의 속성을 한 번도 쓰지 않는다 | must | UI-1, 계획 K1 |
| FR-2 | absorb는 장면마다 창 크기 키(창 너비·높이·`document.fonts.status`)가 바뀔 때 한 번 정하고, 미리 그려 재는 모든 상태(predict 질문과 선택지별 정답, figure 단계 전부, summary recall 답 자리)에서 필요한 값 중 가장 작은 것으로 정한다. 정답 공개·초기화·단계 이동은 absorb·그림 높이·장면 zoom을 바꾸지 않는다 | must | UI-4, ADR 40552fcb |
| FR-3 | kit은 자기가 건 높이 제한만 되돌린다. 작가가 inline으로 건 `max-height`가 있으면 kit 제한은 그 값보다 크지 않게 걸고, absorb가 1로 돌아가거나 폰 배치로 바뀌면 작가 inline `style` 값이 처음과 같아진다 | must | 계획 K1 실패한 시도 |
| FR-4 | 폰 배치(`LTT.mobile()` 참)에서는 kit 높이 제한이 하나도 남지 않는다. `mobileFit` 동작은 바뀌지 않는다 | must | Out of scope 폰 |
| FR-5 | `small-visual`·`loose-figure` 판정에 쓰는 `visualRatio`·`figRatio`는 흡수 전 그림 크기(absorb = 1일 때의 크기)로 잰다. 흡수 때문에 이 두 규칙이 새로 뜨지 않는다 | must | 계획 K1 |
| FR-6 | `shrunk` 메시지는 줄인 비율(%)과 함께, `zoomBy`가 있으면 그 상태 이름, `longest`가 있으면 필드 이름과 글자 수, `floor`이면 "78% 하한"이라는 말을 담는다 | must | UI-2 |
| FR-7 | `overflow` 메시지는 실제 zoom 비율(%)을 말하고, 그 비율이 하한(78%)인지, 다른 상태(`zoomBy`)에 맞춘 배율인지를 구분해 적는다. 하한이면 "78% 하한"이라고 말하고(이때 `zoomBy`는 덧붙여도 되고 안 붙여도 된다), 하한이 아니면 `zoomBy`가 있을 때 그 상태 이름을 적는다. zoom이 78%보다 큰데 "78%로 줄여도"라고 말하지 않는다 | must | UI-2, 결함 ltt.js:646 |
| FR-8 | `hscroll` 메시지는 넘친 폭(px)과 `wide`(가장 많이 넘친 요소와 그 폭)를 담는다 | must | UI-2 |
| FR-9 | `graph-overlap` 메시지는 겹침 수와 `graphIds` 앞 3개(그 밖은 "외 n곳")를 담는다 | should | UI-2 |
| FR-10 | 모든 audit·lint 경고에 Signatures의 `severity`가 붙고, kit의 권고 id 집합은 SKILL.md §3 검증 줄의 **권고** 목록, `kit/api/rules.md` 등급 열 "권고" 행과 같다 | must | UI-2, UI-3 |
| FR-11 | `formatReport`는 Signatures의 텍스트 형식을 따른다: 대상 머리줄(장면 수, 파일이면 바이트), 크기별 머리줄, `[rule·고침|권고]`, 같은 (장면, rule, msg)는 한 줄로 합치고 크기를 나열, lint·expect는 대상마다 한 번 | must | UI-2 |
| FR-12 | `exitCode`는 Signatures의 0/1/2 규칙을 따르고 `USAGE` 종료 코드 줄이 같은 뜻을 말한다 | must | UI-3 |
| FR-13 | `#ltt-audit` JSON과 `audit()` 결과 항목에 `measures`가 있고, 각 장면의 `zoom`·`absorb`·`zoomBy`·`floor`가 그 장면 측정값과 같다 | must | R-1·후속 측정, 테스트 관찰면 |
| FR-14 | 흡수 계산이 예외를 던지면 그 장면은 absorb = 1로 지금처럼 그려지고 `LTT.warn`으로 장면 번호와 사유를 남긴다. 덱 나머지는 계속 그려진다 | must | Reliability |
| FR-16 | 기존 계약 유지(`kit/api/deck-contracts.md` "steps (측정 모드)"): 장면 진입과 창 크기 변경 때 미리 그리기는 figure 단계마다 `enter`를 한 번씩 돌린다(미리 그리기 밖의 그리기 — 스테퍼 생성과 현재 단계 복원 — 는 base와 같은 횟수, 자막 칸이 그림 아래로 내려가는 경우의 두 번째 배치 측정은 지금처럼). 흡수는 이 횟수를 늘리지 않는다. predict 정답 미리 그리기도 선택지마다 지금보다 더 그리지 않는다 | must | 기존 계약, tests/motion-verbs.test.mjs C-16 |
| FR-15 | `CHANGELOG.md`(미배포 절)에 흡수·severity·보고 형식·종료 코드 변경, `internals.md`에 흡수와 새 측정 필드, `rules.md`의 `overflow` 행 뜻이 새 메시지와 맞는다. 기존 임계값 글자(78%·88% 등)는 그 행에 남는다 | must | 문서 동기화 |

# Errors
- 흡수 계산 중 예외 — `LTT.warn("장면 N: 그림 높이를 맞추다 실패해 ... (사유)")` — 그 장면 absorb = 1, kit 높이 제한 없음, 장면은 zoom으로만 맞춘다(FR-14).
- 흡수 그림이 없는 장면이 넘침 — 흡수 없이 zoom만(absorb = 1) — 경고는 지금과 같다.
- 측정 오류(Chrome 실패, `#ltt-audit` 없음) — 보고 줄 `오류: ...`, 종료 코드 2 — 그대로.
- 파일이 아닌 대상(URL) — 머리줄에 바이트 없음 — 나머지 동작 그대로.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 1280×800, figure 장면, 그림 SVG가 커서 배율 1에서 120% 높이 | absorb < 1, 장면 zoom 1, 그림 비율 유지, `shrunk` 없음 |
| C-2 | boundary | 넘침이 그림 높이 35%를 넘어(0.65로도 안 들어감) | absorb = 0.65, 남은 넘침을 zoom이 맡음(zoom < 1) |
| C-3 | boundary | 배율 1에서 딱 들어가는 장면 | absorb = 1, 그림 inline style 불변 |
| C-4 | normal | predict, 정답 그림이 질문보다 큼 | 공개 전후 absorb·그림 높이·zoom 같음, zoom을 정답이 정했으면 `zoomBy` "정답 …" |
| C-5 | normal | figure steps 4단계, 3단계 그림이 가장 큼 | 단계 이동 중 zoom·그림 높이 불변, `zoomBy` "단계 3"(낮춘 경우) |
| C-6 | edge | 작가 inline `max-height: 300px` 그림 | kit 제한 ≤ 300px, absorb 1로 돌아가면 inline style 원래 문자열 |
| C-7 | edge | 폰 폭(≤760px) | kit 높이 제한 없음 |
| C-8 | error | 흡수 계산에서 예외 | absorb 1, `LTT.warn` 한 줄, 덱 계속 |
| C-9 | normal | zoom 0.78에서도 넘침 | `overflow` 메시지 "78% 하한" |
| C-10 | boundary | zoom 0.83, 4번 맞추고도 넘침 | `overflow` 메시지 83%, "78%로 줄여도" 없음 |
| C-11 | normal | 고정 폭 1600px div가 가로로 넘침 | `hscroll` 메시지에 `div` 요소 이름과 1600px 근처 폭 |
| C-12 | normal | diagram 겹침 5곳 | `graph-overlap` 메시지 id 3개 + "외 2곳" |
| C-13 | normal | 두 크기 모두 장면 3 `still-visual` 같은 msg | 텍스트 한 줄 `장면 3 [still-visual·권고] 1440x900·1280x800: ...` |
| C-14 | normal | 결과에 권고만 | 종료 코드 0 |
| C-15 | normal | lint `used-before-defined`(고침) 1건 | 종료 코드 1, lint 줄은 두 크기여도 한 번 |
| C-16 | boundary | lint `unused-term`(권고)만 | 종료 코드 0 |
| C-17 | error | 한 대상 측정 오류 | 종료 코드 2, 오류 줄 |
| C-18 | edge | URL 대상 | 머리줄 바이트 없음 |
| C-19 | normal | 흡수로 줄어든 figure, 흡수 전 그림이 무대의 40% | `loose-figure` 없음(흡수 전 판정) |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 흡수·메시지·보고·종료 코드가 요구를 맞는지 |
| Performance efficiency | yes | 흡수가 장면마다 측정 패스를 늘린다 |
| Compatibility | yes | 기존 gallery·저장 수업이 같은 kit을 `/kit/`으로 읽는다 |
| Interaction capability | yes | 생성 agent가 읽는 메시지가 고칠 곳을 말해야 한다 |
| Reliability | yes | 흡수 실패가 덱을 깨면 안 된다 |
| Security | no | 새 입력 경로·권한 없음 |
| Maintainability | yes | 권고 목록이 세 곳(SKILL·rules·kit)에 있다 |
| Flexibility | no | 설치·이식 환경 변화 없음 |
| Safety | no | 해당 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Functional suitability / effectiveness | 생성 수업 첫 초안 22편, 1440×900·1280×800 | R-1: 새 kit `shrunk` 수 ÷ base kit `shrunk` 수 | ≤ 0.65 | review R-1 | UI-1 |
| QR-2 | Compatibility / co-existence | gallery 13편 | `LTT_AUDIT=1` gallery audit 기준선(`tests/gallery-audit.baseline.json`) | still-visual 밖 0건 유지, still-visual 허용치 이하 | automated | ADR 61d6 |
| QR-3 | Compatibility | 최종 수업 22편(R-1 `--stage final`) | 새 kit 고침 경고 수 − base kit 고침 경고 수 | ≤ 0 | review R-1 | 계획 Phase 2 |
| QR-4 | Performance efficiency / time behaviour | corpus 첫 초안 22편 재audit 벽시계 | R-1 실행 시간, base·new 각 2회 중앙값, 초 | new ≤ 1.25 × base | review R-1 | 흡수 측정 패스 |
| QR-5 | Interaction capability / self-descriptiveness | R-2 표본 | 메시지가 말한 상태·필드·요소가 소스와 맞는 비율 | = 100% | review R-2 | UI-2 |
| QR-6 | Reliability / fault tolerance | C-8 | 예외 주입 fixture에서 덱 장면 수·나머지 장면 렌더 | 모든 장면 렌더, warn 1줄 | automated | FR-14 |
| QR-7 | Maintainability / modifiability | 권고 id 집합 | SKILL.md·rules.md·kit severity 세 집합 비교 | 같음 | automated | FR-10 |
| QR-8 | Interaction capability / appropriateness recognizability | 흡수된 그림 | R-3 sheet 눈 확인 | 잘림·비율 깨짐 0 | review R-3 | FR-1 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, C-1, C-2, C-3 | fixture 덱(헤드리스 Chrome, 1280×800), `#ltt-audit` `measures`와 그림 `getBoundingClientRect` | integration, fixture마다 1회 | boundary value analysis (3-value) | 넘침 비율 b ∈ {배율 1에 딱 맞음 직전·딱·직후, 그림 35% 넘침 직전·딱·직후} 6점 | 100% | absorb·zoom이 FR-1 식과 맞고, 그림 너비/높이 비가 흡수 전과 ±1%; C-3 점(배율 1에서 들어감)에서는 진입 동안 흡수 그림에 속성 변경이 0건(MutationObserver) | tests/absorb.test.mjs |
| VO-2 | FR-1 | fixture 덱, 흡수 그림 종류 | integration | equivalence partitioning | figure stage svg, `[data-visual]`, compare `.vis` svg, 타입 없는 mount svg, 아이콘 svg(제외), 목업 안 svg(제외), 흡수 그림 안 svg(제외) 7개 | 100% | 앞 4개만 높이가 줄고 뒤 3개는 그대로 | tests/absorb.test.mjs |
| VO-3 | FR-2, C-4, C-5, UI-4 | predict·figure steps·summary recall fixture | integration | state transition | 상태 전이: predict 질문→공개→초기화, steps 1→2→3→4→1, recall 숨김→공개 (전이 7개) | 100% | 매 전이 뒤 장면 zoom과 흡수 그림 높이가 진입 직후 값과 같다 | tests/absorb.test.mjs |
| VO-4 | FR-3, FR-4, C-6, C-7 | 작가 max-height fixture, 폭 1280→390→1280 창 | integration | decision table | (작가 max-height 있음/없음) × (데스크톱 넘침/데스크톱 안 넘침/폰) 6칸 | 100% | kit 제한 ≤ 작가 값, 넘침 없음·폰이면 inline style이 처음 문자열과 같음 | tests/absorb.test.mjs |
| VO-5 | FR-5, C-19 | `LTT.auditScene` 순수 호출 + fixture | unit + integration | equivalence partitioning | 흡수 전 비율이 임계값 위·흡수 뒤 아래(small-visual, loose-figure 각각), 흡수 없음 3개 | 100% | 흡수 전 판정으로 경고 없음 | tests/absorb.test.mjs, tests/scene-types.test.mjs |
| VO-6 | FR-6, FR-7, FR-8, FR-9, C-9..C-12 | `LTT.auditScene(m)` 순수 호출 | unit | decision table | shrunk: zoomBy 유무 × longest 유무 × floor 유무 8칸; overflow: floor/zoomBy 있음/둘 다 없음 3칸; hscroll: wide 유무 2칸; graph-overlap: graphIds 0·3·5개 3칸 | 100% | 메시지에 해당 정보가 있고, 없는 정보는 지어내지 않으며, zoom > 0.781인 overflow에 "78%로 줄여도" 없음 | tests/kit.test.mjs |
| VO-7 | FR-6, FR-13 | fixture 덱 실제 측정 | integration | scenario | predict 정답이 정한 zoom, steps 단계가 정한 zoom, 질문 자체, 하한 도달, 긴 why 필드 5개 장면 | 100% | `measures`의 zoomBy·floor와 경고 msg가 장면 구성과 맞다 | tests/absorb.test.mjs |
| VO-8 | FR-10, QR-7 | `auditScene`·`lintDeck` 출력, SKILL.md·rules.md | unit | equivalence partitioning | 모든 audit rule id 13개 + lint rule id 전부(현재 목록) | 100% | severity가 권고 목록이면 "advise", 아니면 "fix"; 세 집합 같음 | tests/kit.test.mjs, tests/api-docs.test.mjs |
| VO-9 | FR-11, C-13, C-15, C-18 | `formatReport(results)` 합성 결과 | unit | classification tree | 분류: 대상 종류(파일/URL), 크기 수(1/2), 같은 (장면,rule,msg) 여부(같음/msg 다름), lint 유무, expect 유무, 오류 항목 유무 — 각 분류의 각 값 1회 이상 (each choice) | 100% each choice | 줄 형식이 Signatures와 같고 lint·expect가 대상마다 한 번 | tests/audit-report.test.mjs |
| VO-10 | FR-12, C-14..C-17 | `exitCode(results)` + CLI 실행 1회 | unit + end-to-end 1회 | decision table | (오류 있음) × (고침 audit 있음) × (고침 lint 있음) × (expect 있음) × (권고만) 조합 중 우선순위가 갈리는 7행 | 100% | 0/1/2가 표와 같다; CLI가 fixture에서 같은 코드로 끝나고 USAGE 줄이 뜻을 말한다 | tests/audit-report.test.mjs |
| VO-11 | FR-13 | `audit()` 결과·`#ltt-audit` JSON | integration | syntax | `measures` 길이 = 장면 수, 항목 키 4개와 타입 | 100% | 형식이 Signatures와 같고 기존 필드가 남는다 | tests/absorb.test.mjs |
| VO-12 | FR-14, QR-6, C-8 | 예외 주입 fixture(흡수 그림 접근 시 throw하도록 만든 페이지) | integration | error guessing | 흡수 측정 중 throw, 상태 미리 그리기 중 throw 2개 | none — experience-based | 장면 렌더, absorb 1, warn 한 줄, 덱 장면 수 그대로 | tests/absorb.test.mjs |
| VO-13 | FR-15 | 문서 파일 | unit | syntax | CHANGELOG 미배포 절에 absorb·severity·종료 코드, internals.md에 measures 필드 4개 이름, rules.md overflow 행이 "78%로 줄여도 넘친다"만 말하지 않음 | 100% | 문서에 해당 이름·뜻이 있다 | tests/release-docs.test.mjs 또는 tests/api-docs.test.mjs |
| VO-18 | FR-16, C-5 | steps·predict fixture, 진입 미리 그리기 | integration | equivalence partitioning | 흡수가 일어나는 steps 장면, 흡수 없는 steps 장면, 흡수가 일어나는 predict(선택지별 정답) 3개 | 100% | 진입 한 번에 단계별 `enter` 호출 수 = 1(자막 아래 배치 판정이 없을 때), 선택지별 정답 그리기 수 = base와 같음 | tests/absorb.test.mjs, 기존 tests/motion-verbs.test.mjs C-16 |
| VO-14 | QR-2 | gallery 13편 | end-to-end | scenario | 기준선 표 전체 | 100% | gallery audit 테스트 통과 | Test command |
| VO-15 | QR-1, QR-3, QR-4 | corpus 22편 | review | scenario | first·final 단계 × base·new × 2회 | 100% | QR-1 ≤ 0.65, QR-3 ≤ 0, QR-4 ≤ 1.25 | R-1 |
| VO-16 | QR-5 | 새 kit 메시지 표본 | review | scenario | shrunk 5건 + overflow 전부 + hscroll 전부 | 100% | 일치율 100% | R-2 |
| VO-17 | QR-8 | 흡수 장면 sheet 2편 | review | scenario | 흡수된 장면 전부 | 100% | 잘림·비율 깨짐 0 | R-3 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| A-1 | 흡수 하한 0.65(그림 자연 높이의 65%) | 계획 b71dd K1 spike 값. 더 낮추면 그림 글자가 작아진다 | brief v1 — approved |
| A-2 | 흡수 대상은 figure stage만이 아니라 본문의 모든 `svg[viewBox]`·`[data-visual]`(아이콘·목업 제외) | corpus 첫 초안 shrunk 78건 중 타입 없는 mount 25·predict 12·figure/overview 28 | brief v1 — approved |
| A-3 | 여러 흡수 그림은 같은 비율 하나로 줄인다 | 그림끼리 크기 관계를 유지; 가로로 나란한 그림은 높이 이득이 같다 | brief v1 — approved |
| A-4 | JSON 결과는 크기별 배열 그대로, 텍스트만 합친다 | `reaudit-corpus.mjs`·`summary.mjs`·gallery 기준선이 크기별 결과를 읽는다 | user answer (brief v1: approved as recommended) |
| A-5 | 종료 코드 1은 고침 경고·고침 lint·expect만 | 사용자 결정(권고는 첫 묶음에서만); 사용처는 skill과 테스트뿐 | user answer (brief v1: approved as recommended) |
| A-6 | `LTT.placement` 공개 모양 유지, 배율을 정한 상태는 내부에서 추적 | `tests/placement.test.mjs` VO-2가 `{zoomLock}`만 있음을 고정, internals.md에 문서화됨 | brief v1 — approved |
| A-7 | `severity` 값은 `"fix"`/`"advise"`, 텍스트는 고침/권고 | JSON은 영문 토큰, 화면 글은 기존 한국어 등급 | brief v1 — approved |
| A-8 | 손 변이 8–10개, 변이 도구 없음 | Stryker 미설치(이전 run 기록) | brief v1 — approved |
| A-9 | QR-1 임계값 0.5 → 0.65, 흡수 하한 0.65 유지 | 하한 훑기(첫 초안 22편): 0.65 → shrunk 47, 0.55 → 45, 0.50 → 41(기준 78). 남은 shrunk는 글이 원인인 장면이라 그림을 더 줄여도 거의 줄지 않는다 | user answer (v2 re-brief) |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1, C-2, C-3 | VO-1, VO-2, VO-17 | tests/absorb.test.mjs, R-3 |
| FR-2 | C-4, C-5 | VO-3 | tests/absorb.test.mjs |
| FR-3 | C-6 | VO-4 | tests/absorb.test.mjs |
| FR-4 | C-7 | VO-4 | tests/absorb.test.mjs |
| FR-5 | C-19 | VO-5 | tests/absorb.test.mjs, tests/scene-types.test.mjs |
| FR-6 | C-4, C-5 | VO-6, VO-7, VO-16 | tests/kit.test.mjs, tests/absorb.test.mjs, R-2 |
| FR-7 | C-9, C-10 | VO-6, VO-16 | tests/kit.test.mjs, R-2 |
| FR-8 | C-11 | VO-6, VO-16 | tests/kit.test.mjs, R-2 |
| FR-9 | C-12 | VO-6 | tests/kit.test.mjs |
| FR-10 | — | VO-8 | tests/kit.test.mjs, tests/api-docs.test.mjs |
| FR-11 | C-13, C-15, C-18 | VO-9 | tests/audit-report.test.mjs |
| FR-12 | C-14..C-17 | VO-10 | tests/audit-report.test.mjs |
| FR-13 | — | VO-7, VO-11 | tests/absorb.test.mjs |
| FR-14 | C-8 | VO-12 | tests/absorb.test.mjs |
| FR-15 | — | VO-13 | tests/release-docs.test.mjs |
| FR-16 | C-5 | VO-18 | tests/motion-verbs.test.mjs, tests/absorb.test.mjs |
| QR-1, QR-3, QR-4 | — | VO-15 | R-1 |
| QR-2 | — | VO-14 | Test command |
| QR-5 | — | VO-16 | R-2 |
| QR-6 | C-8 | VO-12 | tests/absorb.test.mjs |
| QR-7 | — | VO-8 | tests/api-docs.test.mjs |
| QR-8 | — | VO-17 | R-3 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 5 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1..VO-4, VO-6, VO-8..VO-11 | 5 | tests/absorb.test.mjs, tests/audit-report.test.mjs, tests/kit.test.mjs, tests/scene-types.test.mjs, tests/api-docs.test.mjs (정정 묶음 5 뒤) | accepted (verifier 2) | HM-1·2·4·5·6·8·9·10 KILLED | 흡수·보고 코드나 해당 테스트 변경 |
| VO-5 | 5 | tests/scene-types.test.mjs, tests/absorb.test.mjs(DOM rect 전제 포함) | accepted (verifier 2) | HM-4 KILLED | 같음 |
| VO-7 | 5 | tests/absorb.test.mjs(하한 경계 쌍 포함) | accepted (verifier 2) | HM-6·HM-7(재실행) KILLED | 같음 |
| VO-12 | 5 | tests/absorb.test.mjs injection 1–3 | accepted (verifier 2) | HM-11 KILLED | 같음 |
| VO-13 | 5 | tests/release-docs.test.mjs, tests/api-docs.test.mjs | accepted (verifier 2) | — | 문서 변경 |
| VO-14 | 5 | Test command gallery audit | accepted | — | gallery·kit 변경 |
| VO-15..VO-17 | 5 | 37a2365a466d3e8b-r1-corpus.txt, -r2-messages.md, -r3-sheets.md, -r3-*.jpg | accepted (verifier 2) | QR-1 0.60, QR-3 0, QR-4 1.11/0.98, QR-5 10/10, QR-8 0 | 흡수 코드 변경 |
| VO-18 | 5 | tests/absorb.test.mjs VO-18 진입·크기 변경, tests/motion-verbs.test.mjs C-16 | accepted (verifier 2) | HM-1·HM-3 KILLED | 미리 그리기 코드 변경 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| verify-1 | verifier 1: F-1 VO-12 injection 3 느슨함, F-2 크기 변경 경로 관찰 없음, F-3 R-1..R-3가 정정 전 kit, F-4 injection 2 skip 가능, F-5 VO-5 전제, F-6 단계 1 범위, F-7 URL bytes·미배포 절 | F-4는 main 확인으로 기각(Test command에서 ✔, skip 아님) | 묶음 4(test): F-1·F-2·F-5·F-6·F-7; main: F-3 재실행(셸 인자 실수로 base 줄이 새 kit을 쓴 1회는 버리고 배열 인자로 다시 돌림) | 정정, Test command 1393/1393 |
| mutate-1 | 손 변이 HM-1..HM-11(`37a2365a466d3e8b-hand-mutations.txt`): HM-7 floor 0.781→0.80 SURVIVED | verified: 0.781–0.80 사이 zoom으로 놓이는 관찰 장면이 없음 | 묶음 5(test): VO-7 하한 경계 쌍(zoom 0.79·0.78, 전제 검사 포함) | HM-7 재실행 KILLED, Test command 1395/1395 |
| verify-2 | verifier 2: pass, 차단 finding 0. 권고 A-G1(R-2 hscroll 폭을 Chrome 밖에서 재측정하지 않음), A-G2(VO-18 predict 크기 변경 변형 없음) | — | 비차단 | complete |
| advisory-1 | kit이 진입 뒤 fit마다 같은 cap 값을 다시 쓰고, 진입 중 195px → 194.987px처럼 미세하게 바꾼다(reconcile-3 재현 기록) | 표시 차이 없음(0.013px) | 비차단 권고: cap 쓰기를 값이 바뀔 때만 하게 하면 쓰기가 준다 | advisory |
| reconcile-3 | D-2 정정 뒤에도 C-16 실패 | verified(main 재현, scratch `dbg` 시나리오): C-16 fixture의 단계 `enter`는 svg를 지우지 않고 덧붙여 장면에 svg 8개가 쌓이고 실제로 넘친다(measures absorb 0.65, zoom 0.78 floor). M3의 추가 batch는 kit의 흡수 cap(svg 뿌리 `style` max-height·max-width) 쓰기이고, 재생의 그리기(path·rect 속성)는 첫 batch 한 번뿐이다 | test defect T-1: C-16의 "재생이 한 번 그린다" 관찰이 svg 하위 모든 속성 변경을 세어 FR-1이 허용한 흡수 쓰기와 구분하지 못한다. Tests 경로에 motion-verbs 테스트·fixture를 더하고(v5), 재생이 쓰는 속성만 세게 고친다 | 정정: V.watch `ignoreRootStyle` opt-in(verbs-measure만), Test command 1388/1388 통과 |
| reconcile-2 | D-2: D-1 정정 뒤에도 C-16 "M3 (step 1) ticked 3 batches"(단계 `enter` 수는 base와 같음 [3,1,1,1]) | verified(main 코드 판독): `ab.need`가 배율 1에서 들어가는지 보기 전에 0.65 시험 cap을 써서, 넘치지 않는 장면의 그림에도 속성 쓰기가 생긴다(MutationObserver가 batch로 셈) | FR-1에 "임시 쓰기 없음" 명시(v4), 정정 묶음 2: 배율 1에서 들어가는 상태는 쓰기 없이 1을 돌리고 0.65 표본을 1의 값으로 둔다(들어가는 단계의 그림 높이는 고정 높이의 안전한 상한) | 정정됨(넘치지 않는 장면 쓰기 0, VO-1 C-3 관찰 통과). C-16 남은 실패는 reconcile-3 |
| reconcile-1 | D-1: tests/motion-verbs.test.mjs C-16 "M3 (step 1) ticked 3 batches; a pre-draw play draws once"(base a78503e에서는 통과) | verified: 흡수 계산이 단계 미리 그리기를 따로 한 번 이상 더 돌려 단계 `enter`가 진입마다 여러 번 돈다 | FR-16 명시, 구현 정정 1묶음 | 단계 enter 수 base와 같아짐(VO-18 통과), C-16은 D-2로 남음 |
| impl-1 | QR-1 0.60(47/78) > 0.5 | verified: 남은 47 중 32가 흡수 하한, 8이 그림 없는 summary recall, 7이 흡수 그림 없음 | main이 하한 0.55·0.50으로 바꾼 사본으로 재audit: 45·41 | 사용자 결정으로 QR-1을 0.65로 고침(v2), 하한 유지 |

# Version Log
## v5 (close)
- status complete. verifier 2/2(retry → pass), 정정 묶음 5, 손 변이 11개 모두 KILLED, 변이 도구·fuzz 없음(spec).
## v5
- Tests 경로에 `tests/motion-verbs.test.mjs`, `tests/fixtures/motion/` 추가(T-1 정정용). 근거: reconcile-3. 계약 변화 없음.
## v4
- 계약만 명확히: FR-1 "넘치지 않는 장면은 측정 중 임시 쓰기도 없음", FR-16 단계 1의 미리 그리기 밖 그리기는 base와 같은 횟수(test-implementer 관찰: base에서도 [3,1,1,1]), VO-1 C-3 관찰 추가. 근거: reconcile-2.
## v3
- 계약만 명확히(사용자 brief 항목 변화 없음): 결과 항목 `bytes`, `zoomBy` 없음 = `null`, 하한 overflow 문구 우선, FR-16(기존 steps 측정 모드 계약 유지)과 VO-18 추가. 근거: test-implementer 도전 2·3·4, reconcile-1의 C-16 회귀.
## v2
- [intent-mismatch] QR-1·UI-1 임계값 0.5 → 0.65. 근거: 구현 뒤 corpus 하한 훑기(A-9). 계약 영향은 review R-1 판정뿐이고 테스트 의무는 그대로다(v1 테스트 작업 유효).
## v1
- 초안. 근거: 계획 Phase 2, corpus 첫 초안 재audit(shrunk 78건 장면 타입 분포), `ltt-deck.js` fit·placement·measure, `ltt.js` auditScene, `audit.mjs` formatReport·exitCode 판독.
