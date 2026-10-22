---
version: 4
run_id: df4d5d6613e9ad3c
status: complete
base_commit: 3eb5ecec25425edf3bc0eec50f6e7f419c5c36ce
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 학습자 | 덱 예측 장면에서 무엇을 묻는지 화면만 보고 안다 | predict 장면에 `question` 글이 보인다 (anchoring #5 재발 방지) |
| UI-2 | 학습자 | 다이얼·패드를 끄는 동안 값이 떨지 않는다 | 포인터를 한 곳에 두면 주변 레이아웃이 움직여도 값이 바뀌지 않는다 (matrix-as-transform 재발 방지) |
| UI-3 | 생성 agent | audit의 check가 학습자가 보는 상태의 오류를 놓치지 않는다 | 답을 펼치지 않은 상태에서만 나는 오류도 audit 출력에 나온다 (color-contrast 재발 방지) |
| UI-4 | 생성 agent | 값을 바꿀 때 컨트롤이 움직이는 배치를 audit이 알려 준다 | 컨트롤 위치가 움직이면 `control-shift` check 오류가 나온다 |
| UI-5 | 생성 agent·검증자 | checklist가 질문 이해, 사례를 넣은 이유, 연결 그림의 숫자 일관성을 다룬다 | SKILL.md checklist 규칙에 세 항목이 있다 (anchoring·trolley·retrieval 재발 방지) |

# Scope
In scope: kit 덱 predict 렌더링, kit `dialControl`·`padControl` 드래그 기하, `audit.mjs`의 check 읽기와 새 컨트롤 이동 점검, 해당 문서(`kit/API.md` predict 행, `kit/api/rules.md`, `kit/api/controls.md`, `SKILL.md` 평가 기준·생성 순서 2·검증 절, `kit/CHANGELOG.md`), gallery audit baseline 갱신.
Out of scope: 생성된 수업(`measurements/…`)과 gallery 수업 본문 수정, `LTT.drag`(SVG 손잡이, 대상이 움직이는 것이 의도), `steps` 버튼 손잡이, 폰 화면, 핸드오프 D-1…D-7 결함, 자동 보정(A).

# Paths
Implementation: skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-deck.css, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/server/audit.mjs, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/rules.md, skills/learn-to-tell/kit/api/controls.md, skills/learn-to-tell/kit/CHANGELOG.md, skills/learn-to-tell/SKILL.md, tests/gallery-audit.baseline.json
Tests: tests/gate-gaps.test.mjs, tests/fixtures/gate-gaps/
Test command: npm test
Review evidence: RV-1 — 생성된 수업 3개(anchoring, matrix-as-transform, color-contrast; `measurements/20261022-all-topics/home`)에 새 audit을 돌린 출력과 anchoring s05 PNG를 main이 보고 기록한다. RV-2 — SKILL.md 문구 diff를 사용자가 승인한다.
Fuzzing: none — 입력이 페이지 DOM이고 판정 대상이 위치 차이라 경계값 고정 사례로 충분하다
Mutation tool: none — 저장소에 JS mutation 도구가 없다(spec 76b739afacf5b868 D-8). 손 mutation만 한다

# Signatures
deck scene `{ type: "predict", question?: string(HTML, {{용어}} 허용), ... }` — 렌더 결과에 `.dk-pq` 요소(`.dk-q`는 keywords 장면의 복사용 검색어 칩이 이미 쓴다)
`audit({...})` → 결과 항목의 `check` 배열은 `?check` 상태와 `?shot` 상태 오류의 합집합 + `control-shift` 오류
check 오류 `{ where: string, rule: "control-shift", msg: string }`

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | 덱 predict에 `question`이 있으면 장면 본문 맨 위(조건 그림 `visual` 앞)에 `.dk-pq` 글로 그린다. 덱의 다른 부품 스타일(keywords 검색어 칩의 고정폭 글꼴·배경·`cursor: copy`)을 물려받지 않는다. 공개 전·후 모두 보인다. `{{용어}}`는 다른 덱 글과 같이 풀이 링크가 된다. `question`이 없으면 `.dk-pq`가 없다 | must | 사용자 승인 #1 |
| FR-2 | `kit/API.md` predict 행이 `question`을 "화면에 보이는 질문"으로 적는다 | must | 사용자 승인 #1 |
| FR-3 | `dialControl`·`padControl`은 pointerdown 때 기준 사각형을 한 번 재고, 그 드래그가 끝날 때까지 값을 (포인터 좌표, 그 사각형)만으로 정한다. 키보드 조작은 바뀌지 않는다 | must | 사용자 승인 #2 |
| FR-4 | audit은 대상마다 `?check`(학습자 상태, 덱은 전 장면 mount)와 `?shot`을 따로 열어 check 오류를 읽고, `where`·`rule`·`msg`가 같은 오류는 하나로 합친다. 스크린샷·장면 수·스크롤·clock 목록은 지금처럼 `?shot` 값을 쓴다 | must | 사용자 승인 #3 |
| FR-5 | audit은 check를 읽은 첫 `?shot` 문서에서 스크린샷 전에(덱은 컨트롤 있는 장면마다 `?shot#N` 로드에서) 보이는(폭>0) `input[type=range]`, `.ltt-dial`, `.ltt-pad`의 값을 처음부터 끝까지 바꾸며(range 41점, dial·pad 키보드 40걸음) 그 컨트롤 상자의 left·top·width 중 하나가 시작 값에서 1 CSS px 넘게 바뀌면 컨트롤마다 `control-shift` 오류 하나를 낸다. msg는 컨트롤 id(없으면 label·종류)와 최대 이동 px를 담는다. 덱은 컨트롤이 있는 장면만 연다. where는 덱 `장면 N`, 페이지 `페이지` | must | 사용자 승인 #5 |
| FR-6 | 점검하는 동안 `/api/lessons/*/events` 요청은 막혀 수업 `events.jsonl`에 남지 않는다. 점검이 끝나면 막기를 풀어 다른 로드의 기록은 base와 같다 | must | 데이터 보존 기본값 |
| FR-7 | `kit/api/rules.md`가 `control-shift`를, `kit/api/controls.md`가 "값 표시 글자는 폭을 고정하고 손잡이와 같은 줄 가운데 정렬로 두지 않는다"를, SKILL.md 검증 절이 check를 두 상태에서 읽는다는 것을 적는다 | must | 사용자 승인 #3·#5 |
| FR-8 | SKILL.md 평가 기준 목록과 생성 순서 2의 수업 항목에 A-4 문구를 그대로 넣는다 | must | 사용자 승인 #4 |
| FR-9 | `tests/gallery-audit.baseline.json`은 새 audit의 gallery 측정값과 같다. 0에서 바뀐 항목은 Execution ledger에 오류 문구와 함께 적는다 | must | A-5 |

# Errors
`?check` 로드가 준비 신호(`data-ltt-check`)를 budget 안에 못 받음 — 결과 항목 `error`(지금 readCheck와 같은 문구 계열), 종료 코드 2 — 다른 대상·크기는 끝까지 측정
점검 실패·예외(페이지가 점검 중 던짐 포함) — 해당 결과에 `control-shift`가 없고 `check` 배열 끝에 `{rule: "probe-failed", msg}` 하나 — 스크린샷과 다른 check는 그대로
predict `question`이 빈 문자열 — `.dk-pq` 없음

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 덱 predict `question: "두 집단 평균 답의 차이는?"` | 공개 전 `.dk-pq` 글이 보이고 `visual`보다 위, 공개 뒤에도 보인다 |
| C-2 | boundary | predict `question` 없음 / `""` | `.dk-pq` 없음, 기존 배치 그대로 |
| C-3 | normal | `question`에 `{{용어}}` | `.ltt-term` 링크가 된다 |
| C-4 | normal | 다이얼 옆에 값마다 폭이 바뀌는 글을 가운데 정렬로 둔 fixture, 신뢰 포인터로 한 점을 누르고 같은 점에서 move 10회 | 값이 pointerdown 값에서 바뀌지 않는다 |
| C-5 | normal | 같은 fixture의 pad | 같다 |
| C-6 | edge | 레이아웃 이동이 없는 다이얼, 포인터를 90° 위치로 옮김 | 값이 90에 해당(step 반올림) — 정상 드래그는 그대로 |
| C-7 | normal | 일반 상태에서만 정의 전 용어가 나는 페이지(답 칸에 `{{x}}`, 앞 그림 주석에 x) | audit check에 `used-before-defined` 1건 |
| C-8 | normal | shot 상태에서만 나는 오류 페이지 | 그 오류도 나온다 |
| C-9 | boundary | 두 상태 모두 같은 오류 1건 | check 1건(중복 제거) |
| C-10 | normal | 값에 따라 폭이 바뀌는 글 때문에 다이얼이 움직이는 페이지 | `control-shift` 1건, msg에 id와 px |
| C-11 | boundary | 이동 1 px / 2 px 인 range 고정 fixture | 1 px은 오류 없음, 2 px은 1건 |
| C-19 | normal | 값에 따라 top만 바뀌는 컨트롤(위 줄 높이가 값으로 바뀜) / 컨트롤 자신의 width만 바뀌는 컨트롤 | 각각 `control-shift` 1건 |
| C-20 | normal | 스윕 중간에서만 움직였다가 끝에서 제자리로 돌아오는 컨트롤 | `control-shift` 1건, msg px = 중간 최대 이동 |
| C-12 | normal | 이동 없는 range·dial·pad가 있는 페이지, 덱 | `control-shift` 없음 |
| C-13 | edge | 숨은(폭 0) 컨트롤 | 점검하지 않는다 |
| C-14 | normal | 덱의 3번 장면에만 움직이는 다이얼 | where `장면 3` |
| C-15 | error | `?check`에서 kit이 안 뜨는 페이지 | error 항목, 종료 코드 2 |
| C-16 | normal | 점검 대상 수업 home에서 audit 실행 | 점검 뒤 `events.jsonl`에 sweep·predict 계열 이벤트가 늘지 않는다 |
| C-17 | normal | 점검이 있는 페이지 `--shots` | PNG 바이트가 손대지 않은 `?shot` 로드의 캡처와 같다(스크린샷마다 새로 로드) |
| C-18 | error | 점검 중 예외가 나는 페이지(예: 표시된 컨트롤의 `getBoundingClientRect`가 점검 시작 뒤 던짐) | `probe-failed` 1건, 다른 check 오류와 스크린샷은 그대로, 종료 코드 1 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 다섯 고침 자체 |
| Performance efficiency | yes | audit에 로드가 둘 늘어 생성 루프 시간이 는다 |
| Compatibility | yes | 기존 gallery 덱의 `question`이 새로 보이고, audit 출력 형식을 agent가 읽는다 |
| Interaction capability | yes | 다이얼·패드 조작감 |
| Reliability | yes | 점검이 스크린샷·이벤트 기록을 오염시키면 안 된다 |
| Security | no | 새 입력 경계 없음. 표식 id 경로 가드는 그대로 |
| Maintainability | yes | 문서·규칙 표가 코드와 맞아야 agent가 grep으로 찾는다 |
| Flexibility | no | 설치·이식 변화 없음 |
| Safety | no | 해당 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Performance / time behaviour | gallery 전체 audit, 2 크기, jobs 2 | 벽시계 초, base_commit과 새 코드 각 1회 | 새 시간 ≤ base × 1.6, 그리고 기존 VO-12(≤60 s) 통과 | 자동(VO-12) + ledger에 두 측정값 | A-6 |
| QR-2 | Compatibility / co-existence | gallery 13쪽 × 2 크기 | baseline 비교 테스트 | 바뀐 항목은 전부 ledger에 문구와 함께 기록, 덱 predict 장면에 `fit` 축소 0.78 미만 없음 | 자동(gallery-audit.test) + RV-1 | A-5 |
| QR-3 | Interaction / user error protection | C-4·C-5 fixture | 신뢰 포인터 move 10회 동안 값 변화 횟수 | 0 | 자동 + mutation | FR-3 |
| QR-4 | Reliability / faultlessness | C-16·C-17 | events.jsonl 줄 수 차, PNG 바이트 비교 | 0, 같음 | 자동 | FR-6 |
| QR-5 | Maintainability / analysability | rules.md·API.md·controls.md·SKILL.md | 기존 api-docs·release-docs 테스트 + `control-shift`가 rules.md에 있음 | 전부 통과 | 자동 | FR-7 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, C-1..C-3 | 덱 predict DOM, 헤드리스 Chrome | e2e, 모든 항목 | equivalence partitioning | question 있음 / 없음 / 빈 문자열 / 용어 포함 × 공개 전·후 (8) | 100% | `.dk-pq` 존재·순서·글·`.ltt-term`, 계산된 `cursor`가 `copy`가 아니고 `font-family`가 keywords 검색어 칩과 다르다 | `npm test` |
| VO-2 | FR-3, C-4..C-6, QR-3 | dial·pad, CDP Input 신뢰 포인터 | e2e, 모든 항목 | scenario | dial 고정점, pad 고정점, dial 이동 없는 정상 드래그, pad 정상 드래그 (4) | 100% | 값 변화 횟수 0 / 기대 값 | `npm test` |
| VO-3 | FR-4, C-7..C-9, C-15 | `audit()` 결과 `check`·`error` | integration(audit + Chrome), 모든 항목 | decision table | 오류 위치 {check만, shot만, 둘 다, 없음} + check 로드 실패 (5) | 100% | 건수·rule, error 항목·종료 코드 | `npm test` |
| VO-4 | FR-5, C-10..C-14, C-18..C-20 | `audit()` 결과 `control-shift` | integration, 모든 항목 | boundary value analysis (2-value) + equivalence partitioning | 이동 1 px / 2 px 경계, 종류 {range, dial, pad}, 숨김, 덱 장면 where, 점검 예외(probe-failed), top만 이동, width만 변화, 중간 최대 후 복귀 (11) | 100% | 건수·where·msg의 id와 px | `npm test` |
| VO-5 | FR-6, C-16, C-17, QR-4 | home의 events.jsonl, PNG | integration, 모든 항목 | scenario | 이벤트 줄 수, PNG 동일 (2) | 100% | 차 0, 바이트 같음 | `npm test` |
| VO-6 | FR-2, FR-7, QR-5 | 문서 파일 | unit(문서 grep), 모든 항목 | equivalence partitioning | API.md predict 행, rules.md control-shift, controls.md 폭 고정 문장, SKILL.md 두 상태 문장 (4) | 100% | 문구 존재 | `npm test` |
| VO-7 | FR-9, QR-1, QR-2 | gallery 전체 | e2e 기존 테스트 | experience-based (error guessing) | 기존 덱 question 렌더로 넘침·축소, 새 rule 오탐 | none — experience-based | baseline 일치, ledger 기록 | `npm test` + ledger 측정값 |
| VO-8 | FR-8 | SKILL.md 문구 | review | experience-based | 세 문구 | none — experience-based | 사용자 승인 | RV-2 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v1 — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| A-1 | `question`은 본문 맨 위, `visual` 앞에 한 줄 글로 그린다 | 조건 그림을 읽기 전에 물음을 알아야 한다. 제목과 겹치는 덱이 있을 수 있음 | brief v1 — approved |
| A-2 | check는 `?check`·`?shot` 두 상태의 합집합 | 학습자는 공개 전·후 두 상태를 다 본다. 공개 뒤에만 나는 오류도 학습자에게 보인다 | user answer (초안 채택) |
| A-3 | 이동 기준 1 CSS px, left·top·width | 17개 수업 측정에서 정상 컨트롤은 0 px, 결함은 69 px. 하위 픽셀 흔들림 배제 | brief v1 — approved |
| A-4 | SKILL.md 문구(아래) | 사용자가 표현을 정한다 | user answer |
| A-5 | gallery baseline은 새 측정값으로 맞추고 바뀐 항목을 기록한다. gallery 수업은 고치지 않는다 | AGENTS.md "Generated Lesson Defects" | brief v1 — approved |
| A-6 | audit 시간 상한 base × 1.6 | 로드 2개가 늘고(check 1, 점검 1) 스크린샷 로드는 그대로라 대부분 그 아래. 측정 전 추정 | brief v1 — approved |
| A-7 | 점검 중 이벤트는 CDP로 막는다 | audit이 실제 수업 home에서 돈다. 기존 lint 이벤트 기록은 바꾸지 않는다 | brief v1 — approved |
| A-9 | 점검은 check를 읽은 첫 `?shot` 문서에서 스크린샷 전에 한다 | 대상당 추가 로드가 2→1. 스크린샷은 장마다 새 로드라 오염되지 않는다(C-17) | user answer (v3) |
| A-8 | `LTT.drag`·steps 버튼은 점검 대상이 아니다 | drag는 대상이 움직이는 것이 의도, steps는 이번 측정에서 결함 없음 | brief v1 — approved |

A-4 문구(SKILL.md, 사용자 문구). "평가 기준 N:" 머리말 없이 "### 평가 기준" 목록에 이어 붙인다:
- "질문을 던지는 화면(예측, 떠올리기)은 화면에 보이는 글과 그림만으로 무엇을 묻는지 한 문장으로 말할 수 있어야 한다."
- "자료의 흐름은 논리적으로 이어져야 하며, 새로운 대상·사례·예·변형 등은 논리적 흐름 위에서 소개되거나, 확장되어야 한다."
- "서로 이어진 그림의 숫자는 화면에 보이는 값만으로 이어져야 한다."
- 생성 순서 2 `checklist.md`의 "형식과 무관한 수업 항목"에 더하는 세 줄:
  - "질문 화면마다: 화면만 보고 이 화면이 묻는 것을 한 문장으로 적는다."
  - "새 대상·사례·변형마다: 처음 나온 화면에서 앞 흐름과 무엇으로 이어지는지 적는다."
  - "숫자가 이어진 그림 쌍마다: 한쪽 숫자를 다른 쪽 화면에 보이는 값으로 계산해 본다."

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1, C-2, C-3 | VO-1 | npm test |
| FR-2 | — | VO-6 | npm test |
| FR-3 | C-4, C-5, C-6 | VO-2 | npm test |
| FR-4 | C-7, C-8, C-9, C-15 | VO-3 | npm test |
| FR-5 | C-10..C-14, C-18..C-20 | VO-4 | npm test |
| FR-6 | C-16, C-17 | VO-5 | npm test |
| FR-7 | — | VO-6 | npm test |
| FR-8 | — | VO-8 | RV-2 |
| FR-9 | — | VO-7 | npm test + ledger |
| QR-1 | — | VO-7 | ledger 측정 |
| QR-2 | — | VO-7 | npm test + RV-1 |
| QR-3 | C-4, C-5 | VO-2 | npm test |
| QR-4 | C-16, C-17 | VO-5 | npm test |
| QR-5 | — | VO-6 | npm test |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 4 | gate-gaps.test.mjs (batch 3) | accepted | verifier 1 accepted(v3) → F-2로 클래스 이름·스타일 요구가 바뀜 | F-2 |
| VO-2 | 3 | gate-gaps.test.mjs | accepted | verifier 1, M1 검출 | ltt-parts.js dragOn 변경 시 재개 |
| VO-3 | 3 | gate-gaps.test.mjs | accepted | verifier 1, M4·M5 검출 | audit check 읽기 변경 시 |
| VO-4 | 4 | gate-gaps.test.mjs (batch 3, shift-dims.html) | accepted | F-1 대응 | C-19·C-20 추가 |
| VO-5 | 3 | gate-gaps.test.mjs | accepted | verifier 1, M8·M9 검출 | probe 위치·blocked 변경 시 |
| VO-6 | 3 | gate-gaps.test.mjs | accepted | verifier 1 | 문서 변경 시 |
| VO-7 | 4 | gallery-audit.test + ledger 1, 9, 11 | accepted | batch 3 뒤 gallery 13×2 모두 0 | ltt-deck.css 변경(F-2) |
| VO-8 | 3 | RV-2 | accepted | 사용자 승인(chat, A-4) | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | QR-1: gallery audit base 14.7/15.3 s, v2 28.9/31.2 s (≈2×, 상한 1.6×) | verified: 페이지마다 +0.9 s가 컨트롤 없는 페이지에도 균일 → 로드 수(1→3)가 원인, 점검 걸음 수 아님 | v3: 점검을 첫 shot 문서로 옮겨 추가 로드 1개, load 폴링 100→25 ms(계약 무관) | 번갈아 5쌍 측정(부하 평균 ~60): 1.53·1.49·1.36·1.82·1.33, 중앙값 1.49× 통과 |
| 2 | probe-failed 경로에 검증 항목 없음(test-implementer 보고) | verified: v2 VO 표에서 Errors 2행 누락 | VO-4에 C-18 추가 | probe-throw.html 테스트 추가, M10이 잡힘 |
| 3 | 생성 수업 sanity(v2): matrix `control-shift` dial 'dir' 69px, color-contrast `used-before-defined` 1, anchoring 0, gallery 13×2 모두 0(baseline 변경 없음) | — | — | 기록 |
| 4 | 손 mutation 10건(gate-gaps.test.mjs): M1 rect 매 move 재측정, M2 question 안 그림, M3 공개 뒤 숨김, M4 ?check 미합류, M5 중복 제거 없음, M6 임계 ≥1, M7 첫 keyed 컨트롤만, M8 이벤트 막기 없음, M9 막기 안 풂, M10 probe-failed 삼킴 | 결함 클래스 = 이번 사용자 지적 재발 경로(M1–M4)와 새 점검의 경계·범위·데이터 오염(M5–M10) | 각 1회 주입 후 seed.py restore 확인 | M9 외 9건 의도한 단언으로 잡힘. M9 생존 → VO-5 evidence gap: 첫 shot 로드의 lint가 막기 전에 기록돼 '존재' 단언이 통과 |
| 6 | batch 2 뒤 M9 재주입: VO-5 FR-6 테스트 실패로 검출. M8 재확인 검출. 전체 npm test 2회: 1164/1165씩, 실패 1건이 매번 다른 기존 테스트(shots VO-5 page/no query, map perf VO-13) | hypothesis: 부하 평균 25–60에서의 시간 흔들림. 두 테스트 모두 단독 실행 통과, 바뀐 코드 경로 밖(dump-dom clock, map CLI) | — | 비차단 기록 |
| 7 | verifier 1: retry. F-1(VO-4 evidence gap: top만·width만·중간 최대 이동 미검증) | verified (verifier가 fixture가 단조 가로 이동만 만든다고 확인) | v4 C-19·C-20 | batch 3 |
| 8 | F-2: RV-1에서 anchoring s05의 질문이 고정폭 글꼴·배경 칩으로 보임 | verified: `.dk-q`가 keywords 장면 검색어 칩(ltt-deck.js:718, ltt-deck.css:962)과 이름이 같다. spec v1–v3이 그 이름을 정했다(spec gap) | v4: 클래스 `.dk-pq`, VO-1에 계산 스타일 관찰 추가 | batch 3 |
| 9 | QR-1 기록 보강: 쌍별 초(base/new) 13.9/21.3, 14.5/21.6, 15.1/20.6, 16.0/29.1, 25.6/34.0, 부하 평균 58–63. 결합 방식(쌍 비율의 중앙값)은 측정 뒤 정했다. VO-12(≤60 s)는 npm test에서 통과 | — | — | 기록 |
| 10 | RV-1(v3): anchoring check 0, s05에 질문 글 보임(스타일 결함 → F-2). matrix·color-contrast 결과는 v3에서 구현자 재확인(행 3과 같음). RV-2: 사용자 A-4 승인(chat) | — | — | 기록 |
| 11 | batch 3 뒤: 손 mutation M11 top 무시, M12 자기 width 무시, M13 range 끝-시작만, M14 keyed 절반 스윕, M15 range 절반 스윕, M16 질문 클래스 dk-q로 되돌림 — 6/6 의도한 단언으로 검출(누적 16/16). npm test 1171/1171 통과(부하 14). check:css 동기. QR-1 재측정(부하 10–33): base/new 14.0/20.4, 14.0/20.4, 14.3/21.0 → 1.46·1.46·1.47×. RV-1: anchoring s05 질문이 본문 글(칩 아님)로 보임, check 0 | — | — | 기록 |
| 12 | verifier 2: pass, 차단 0. 권고: VO-1이 배경색은 비교하지 않음, C-19가 range만, rAF 대기(행 5) | — | — | complete |
| 5 | 권고: PROBE_JS가 걸음마다 microtask만 기다려 rAF로 미뤄 그리는 수업의 이동을 놓칠 수 있다 | hypothesis | 사용자 판단 대기 | advisory |

# Version Log
## v4
- [intent-mismatch 아님, 계약만] F-2: predict 질문 클래스 `.dk-q`→`.dk-pq`(이름 충돌), VO-1 관찰 추가. F-1: VO-4에 C-19·C-20. 승인 항목(위치·동작) 변화 없음.
## v3
- [QR-1 실패] 사용자 승인: 점검을 check를 읽은 첫 `?shot` 문서에서 스크린샷 전에 한다(FR-5·FR-6·A-9). C-18(probe-failed) 추가. 상한 1.6× 유지.
## v2
- 사용자 답: A-4 문구 확정(평가 기준 세 문장, checklist 세 줄), A-2 초안 채택, 나머지 기본값 승인. status active.
## v1
- 초안. 근거: 2026-10-22 시험 생성 17개 수업의 사용자 지적 5건과 원인 측정(anchoring s05, matrix 다이얼 69 px, retrieval 29% 대 46%, trolley 3절, color-contrast `?check` 1 / `?check&shot` 0).
