---
version: 4
run_id: 753ff3c539424409
status: complete
base_commit: bd8e3e48568b3da3b1a0d43afba76dff41b002cb
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | skill 관리자(사용자) | gallery v2 시험에서 반복된 생성기 결함 중 audit·lint가 검증 전에 잡을 수 있는 것을 생성기에서 고친다 (handoff `7a0ce2dc6e07a3ca` 결함 1, 4, 5, 6, 8, 9) | 시험 수업에서 재현한 입력이 audit/lint 출력에 오류로 나오거나 kit이 결함을 내지 않는다 |
| UI-2 | skill 관리자 | 지시(SKILL.md, kit/API.md, kit/api/deck-contracts.md, kit/api/rules.md)를 덧붙이기가 아니라 전체 맥락을 확인한 rewrite로 고친다 (결함 3, 4, 7, 9 문서 부분, 17, 19 포함) | 바뀐 동작이 생성 agent가 읽는 곳에 한 번씩, 서로 모순 없이 적혀 있다 |
| UI-3 | 학습자 | 수업 끝에 다음에 배울 개념을 개념 나무로 본다 | keywords 장면이 `next`를 나무로 그린다 |

# Scope
In scope: 결함 1(lint를 audit check로, `?shot`에서 패널 숨김), 3(개념 나무 = keywords `next`), 4(predict 형식 문서·lint), 5(audit이 predict/compare 공개 상태와 figure steps 각 단계를 찍음), 6(predict·compare takeaway는 공개 뒤), 7(checklist는 장면을 제목으로 지칭), 8(용어 사용 판정 단어 경계), 9(스크립트 오류·장면 mount 예외·type 없는 figure를 오류로, d3 필수 명시), 17(result.md frontmatter 따옴표 규칙), 19(background.md 없을 때·"미검증" 규칙) — 이를 위한 kit·audit 코드와 지시 4개 파일의 rewrite. 갤러리 baseline 재생성. 끝에서 handoff `7a0ce2dc6e07a3ca` 갱신.
Out of scope: 결함 2(레이아웃 탐지), 8의 후반(mount/figure HTML·SVG 안 용어 검사), 10–16, 18, 20. 수업·갤러리 HTML 수정. 재생성 시험과 생성 시간 측정. 폰 레이아웃.

# Paths
Implementation: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-deck.css (STYLE 원본, `npm run build:css`), skills/learn-to-tell/server/audit.mjs, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/deck-contracts.md, skills/learn-to-tell/kit/api/rules.md, skills/learn-to-tell/kit/api/internals.md, packages/ltt-kit/ (build 산출물, `npm run build:kit`로만)
Tests: tests/generator-defects.test.mjs, tests/generator-defects-audit.test.mjs, tests/term-boundary.fuzz.mjs, tests/fixtures/generator-defects/, tests/gallery-audit.baseline.json (main이 `npm run audit:baseline`으로만 갱신), 기존 tests/*.test.mjs 중 바뀐 계약에 걸린 단언
Test command: npm test
Review evidence: RV-1 지시 rewrite 검토(아래 VO-14 절차), RV-2 갤러리 baseline diff 검토(VO-15 절차)
Fuzzing: node tests/term-boundary.fuzz.mjs — `LTT.usesTerm(text, key)`를 테스트 안에 spec 정의대로 쓴 참조 구현과 차등 비교(differential), 알파벳 {a, p, t, F, L, O, P, S, 0, 가, 분, 산, 상, 관, 없, 이, 는, 된, 투, 자, 공백, ".", "』", "-"}, 키 {pt, FLOP, a, 분산, 상관, 이}, 문자열 길이 0–12, seed 1, 20,000 사례
Mutation tool: none — 저장소에 JS mutation 도구가 없고(node_modules 없음) kit 코드가 브라우저·vm에서 돈다. 손 mutation만 쓴다

# Signatures
LTT.usesTerm(text: string, key: string) → boolean  (ltt.js, LTT에 노출)
LTT.isAdvice(rule: string) → boolean  (ltt.js, LTT에 노출; 권고 rule이면 true)
두 이름은 기존 계약(공개 이름은 문서 하나에만 정의)에 따라 `kit/api/internals.md`에만 정의한다
#ltt-check JSON 추가 필드: `advice: [{where, rule, msg}]`(권고 등급, 건수에 안 셈), 덱이면 `sceneList: [{n, title, states: ["reveal" | "step-<k>"]}]`
URL: `?shot&state=reveal#n`, `?shot&state=step-<k>#n` (k는 1부터)
audit 결과 항목 추가: `advice: [{where, rule, msg}]`; shot 파일 `<slug>-<size>-sNN-reveal.png`, `<slug>-<size>-sNN-step<k>.png`; `--shots <dir>`이면 `<dir>/index.md`
keywords 장면 필드: `next: [{term, why, from?}]`
lint 새 rule: `predict-choices`, `figure-no-type`, `keywords-no-next` (모두 고침); check 새 rule: `script-error`, `scene-error`

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | 덱의 `#ltt-check` `errors`는 `LTT.lintDeck` 결과 중 등급 "고침" rule을 `{where: "장면 n" 또는 "덱", rule, msg}`로 포함한다. 권고 rule(`unused-term`, `card-monotony`, `no-signature`)은 `advice`에 들어가고 `errors`와 `data-ltt-check` 건수에 들어가지 않는다 | must | 결함 1 |
| FR-2 | audit은 `advice`를 결과와 텍스트 출력(`advice <where> [rule]: msg` 줄)에 담고, advice만 있으면 종료 코드 0이다 | must | 결함 1 |
| FR-3 | `?shot` 문서에서는 `#ltt-expect` 패널이 보이지 않는다(`display:none`). `?shot` 없이 열면 기존처럼 보인다 | must | 결함 1 |
| FR-4 | lint `predict-choices`: predict 장면의 `choices`가 2개 이상의 객체 배열이 아니거나, 항목에 비어 있지 않은 문자열 `id`·`text`가 없거나, `answer`가 어느 `id`와도 같지 않으면 그 장면에 1건 | must | 결함 4 |
| FR-5 | lint `figure-no-type`: `figure` 필드가 있는데 `type`이 `figure`·`overview`가 아닌 장면에 1건 | must | 결함 9 |
| FR-6 | lint `keywords-no-next`: 마지막 keywords 장면에 비어 있지 않은 `next`가 없으면 1건 | must | 결함 3 |
| FR-7 | keywords 장면은 `next`를 덱 제목을 뿌리로 한 나무로 그린다. `from`이 다른 `next` 항목의 `term`이면 그 아래 가지, 아니면 뿌리 아래. 항목마다 `term`과 `why`가 보인다. 기존 `terms`·`signals`·`neighbors`·`queries`는 그대로 그린다 | must | 결함 3, UI-3 |
| FR-8 | ltt.js는 로드 시점부터 `error`·`unhandledrejection`을 모아 check `errors`에 `{where: "페이지", rule: "script-error", msg}`로 넣는다. msg는 오류 문구와(있으면) 파일 이름:줄 | must | 결함 9 |
| FR-9 | 덱은 장면마다 render/mount 예외를 잡아 `{where: "장면 n", rule: "scene-error", msg}`를 내고 나머지 장면을 계속 mount한다. 예외 난 장면은 빈 본문으로 남는다 | must | 결함 9 |
| FR-10 | predict 장면의 `takeaway`는 정답 공개 전에 보이지 않고(자리는 유지) 공개 뒤 보인다. compare(`reveal !== false`)의 `takeaway`는 판정 공개 전 숨고 공개 뒤 보인다. summary는 예전처럼 모은다. '자리 유지'의 관찰: 공개 전 takeaway 요소의 bounding box 높이 > 0이고 계산된 visibility가 hidden(또는 opacity 0)이며, 공개 전후 장면 제목과 takeaway 요소의 top이 1px 넘게 움직이지 않는다 | must | 결함 6 |
| FR-11 | `?shot&state=reveal#n`: n번 predict는 정답(`answer`)을 고른 공개 상태(관찰: `data-choice`가 answer인 선택지 버튼만 `aria-pressed="true"`), compare는 판정 공개 상태로 그린다. `?shot&state=step-<k>#n`: n번 figure steps를 k단계로 그린다. 해당 장면이 그 상태를 갖지 않으면 상태 없이 그린다 | must | 결함 5 |
| FR-12 | 덱 `#ltt-check`의 `sceneList`는 map-related를 뺀 장면마다 `{n, title(태그 제거한 글), states}`; states는 predict·compare(reveal≠false)면 `["reveal"]`, figure steps가 m개면 `["step-2",…,"step-m"]`, 그 밖은 `[]` | must | 결함 5, 7 |
| FR-13 | audit `--shots`는 장면 PNG에 더해 `sceneList`의 상태마다 PNG를 찍고(크기당 상한은 장면·상태 합쳐 기존 `MAX_PAGE_SHOTS` 30을 넘으면 잘림 표시), `<dir>/index.md`에 `파일 이름 | 장면 n | 제목 | 상태(기본은 "처음")` 줄을 크기별로 쓴다. clock 표식 PNG도 index에 `clock <id> <ms>`로 적는다 | must | 결함 5, 7 |
| FR-14 | `LTT.usesTerm(text, key)`: key의 각 출현 위치에서 (a) key 첫 글자가 영문·숫자면 앞 글자가 영문·숫자가 아니고, 마지막 글자가 영문·숫자면 뒤 글자가 영문·숫자가 아니다; (b) key 첫 글자가 한글 음절이면 앞 글자가 한글 음절이 아니고, 마지막 글자가 한글 음절이면 뒤가 끝·한글 음절 아님이거나 뒤 문자열이 조사·어미 목록 `은 는 이 가 을 를 의 에 와 과 도 로 으로 에서 에게 만 까지 부터 보다 처럼 이다 이고 이며 이나 이란 이라 라 란 나 랑 하 한 할 해 했 된 되 될 적 들`의 하나로 시작한다; 그런 출현이 하나라도 있으면 true. 그 밖의 글자 종류는 경계 조건 없음. `used-before-defined`는 `indexOf` 대신 이것을 쓴다 | must | 결함 8 |
| FR-15 | 지시 rewrite: SKILL.md·API.md·deck-contracts.md·rules.md를 전체 맥락에서 다시 쓴다. 다음이 각각 생성 agent가 읽는 곳(SKILL.md 또는 API.md 네 절)에 한 번 적힌다: predict `choices: [{id, text}]`·`answer: id`; keywords `next`가 개념 나무이며 수업의 마지막 작성 장면; 덱 고정 순서(hook 처음, … summary → overview → keywords); predict·compare takeaway는 공개 뒤; d3·ltt.js·ltt-parts.js·ltt-ui.js 필수; audit 출력의 check(고침)·advice(권고)·script-error·scene-error의 뜻과 대응; 공개·단계 상태 shot과 `index.md`; checklist는 장면을 제목으로 가리키고 장면 순서·제목이 바뀌어 지칭만 어긋난 곳은 고쳐도 된다(질문·정답 내용은 고치지 않음); 검증 서브에이전트에 background.md는 있을 때만 주고 shot `index.md`를 준다; 검증 3회 뒤 고친 항목·검증 못 한 항목은 result.md에 "미검증"으로 적는 규칙 하나; result.md frontmatter 문자열 값에 `: `·`#`·따옴표가 있으면 큰따옴표로 감싼다(템플릿의 definition은 기본 큰따옴표). rules.md는 lint·check rule 표가 kit이 내는 rule id 집합과 같다 | must | UI-2, 결함 3, 4, 6, 7, 9, 17, 19 |
| FR-16 | 문서 rewrite는 이번 결함과 무관한 기존 규칙의 뜻을 바꾸지 않는다(삭제·약화는 RV-1에서 근거와 함께 보고). 기존 테스트가 글자 그대로 지키는 문장(예: gate-gaps A-4 평가 기준·체크리스트 줄, check를 학습자 상태 `?check`와 `?shot` 두 상태에서 읽는다는 SKILL.md 설명)은 유지한다 | must | UI-2 |

# Errors
- predict `choices`가 문자열 배열·`label` 필드·`answer` 불일치 — lint `predict-choices` 1건, audit check에 장면 n — 덱은 그대로 그린다
- 필수 vendor(d3) 누락으로 로드 중 예외 — check `script-error`, audit 종료 코드 1 — 페이지는 열린 상태 그대로
- 장면 mount 예외 — check `scene-error`(장면 n) — 다른 장면은 그려지고 clock·sweep은 계속 동작
- `?shot&state=`에 모르는 값 또는 그 상태가 없는 장면 — 상태 없는 shot과 같은 화면, 오류 없음
- `next.from`이 없는 term을 가리킴 — 그 항목은 뿌리 아래, 오류 없음

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | overview가 keywords 바로 앞이 아닌 덱 | audit check에 `overview-order`(장면 n), 종료 1 |
| C-2 | normal | 권고만 있는 덱(glossary 미사용 용어) | check 0, advice 1, 종료 0, `data-ltt-check="0"` |
| C-3 | normal | `?shot`으로 연 lint 경고 있는 덱 | `#ltt-expect` 계산된 display none; `?check`에서는 보임 |
| C-4 | error | predict `choices: ["1시간","2시간"]` / `[{id, label}]` / `answer`가 없는 id / choices 1개 | 각각 `predict-choices` 1건 |
| C-5 | boundary | predict `choices` 2개 `{id, text}`, answer 일치 | `predict-choices` 없음 |
| C-6 | error | `{title, figure, caption}`(type 없음) | `figure-no-type` 1건 |
| C-7 | error | keywords에 `next` 없음 / `next: []` | `keywords-no-next` 1건 |
| C-8 | normal | `next: [{term:"A",why:"a"},{term:"B",why:"b",from:"A"},{term:"C",why:"c",from:"Z"}]` | 뿌리(덱 제목) 아래 A, C; A 아래 B; 글 A·B·C·a·b·c 보임 |
| C-9 | error | d3 script 줄을 뺀 덱(parts가 d3를 씀) | check `script-error`, audit 종료 1 |
| C-10 | error | 장면 3 mount가 throw, 장면 5에 clock id | `scene-error` 장면 3; clock 목록에 장면 5 id 있음 |
| C-11 | normal | predict takeaway, `?check` 처음 상태 | takeaway 안 보임; 정답 공개 뒤 보임; summary 카드에 있음 |
| C-12 | normal | compare(reveal 기본) takeaway / compare `reveal:false` | 공개 전 숨김·공개 뒤 보임 / 처음부터 보임 |
| C-13 | normal | 덱(predict 장면 4, figure steps 3단계 장면 6), audit `--shots` | PNG s04-reveal, s06-step2, s06-step3 생성, index.md에 제목·상태 줄 |
| C-14 | edge | `?shot&state=reveal#2`인데 장면 2가 statement | 기본 shot과 같은 화면, 오류 없음 |
| C-15 | boundary | usesTerm: ("perceptual","pt")·("FLOPS","FLOP")·("a b","a")·("상관없이","상관")·("분산이","분산")·("분산 투자","분산")·("pt.","pt")·("FLOP","FLOP") | false, false, true, false, true, true, true, true |
| C-16 | edge | usesTerm("","x"), key가 문장 끝, 연속 출현 중 두 번째만 경계 만족 | false; true; true |
| C-17 | normal | 갤러리 audit | 측정 실패(error) 없음, check 건수는 새 baseline과 같음 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 위 FR |
| Performance efficiency | yes | 생성 agent가 읽는 지시 분량과 audit shot 수가 생성 시간에 직결(시간 handoff) |
| Compatibility | yes | 기존 수업·갤러리가 새 kit에서 열리고 기존 필드가 그대로 동작해야 함 |
| Interaction capability | yes | 학습자가 보는 takeaway 공개 시점과 개념 나무 |
| Reliability | yes | 한 장면 예외가 덱 전체를 죽이지 않아야 함 |
| Security | yes | shot 파일 이름이 경로를 벗어나지 않아야 함(기존 guard 유지) |
| Maintainability | yes | 지시 4개 파일 간 모순 없음, rule 표와 코드 일치 |
| Flexibility | no | 설치·환경 변화 없음 |
| Safety | no | 물리·인명 위험 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Performance / resource utilization | 생성 agent가 매번 읽는 지시 | SKILL.md + kit/API.md 바이트 합 | ≤ 36,139 B(base_commit 값), API.md ≤ 11,500 code points(기존 테스트) | automated | 시간 handoff "문서 탐색" |
| QR-2 | Performance / time behaviour | audit 추가 shot | 상태 PNG 수 = sceneList states 수(상한 내); 상태 없는 덱은 추가 PNG 0 | 같음 | automated | 결함 5 |
| QR-3 | Compatibility / co-existence | 기존 갤러리 17개 + scenes.html | audit `error` 항목(측정 실패) 수; check 건수는 baseline과 같음(D-5에 따라 새 rule 증가분 포함) | 0 | automated(gallery-audit) | UI-1 |
| QR-4 | Interaction capability / user error protection | predict 공개 전 화면 | takeaway 요소의 보임 | 공개 전 안 보임, 공개 뒤 보임 | automated | 결함 6 |
| QR-5 | Reliability / fault tolerance | 장면 예외 | 예외 장면 외 장면의 mount 수 | 전부 | automated | 결함 9 |
| QR-6 | Security / integrity | shot 파일 이름 | 생성 파일이 `--shots` dir 밖에 생기는 경우 | 0 (이름은 장면 번호와 고정 상태 문자열로만) | automated | 기존 SHOT_ID guard |
| QR-7 | Maintainability / modifiability | rules.md 표 | rules.md 표의 rule id 집합과 kit·audit이 낼 수 있는 rule id 집합(check errors·advice·audit marks: `clock-duplicate-id`, `shot-format`, `shot-unknown-clock`, `shot-bad-time` 포함) | 같음 | automated | FR-15 |
| QR-8 | Maintainability / analysability | 지시 4개 파일 | RV-1 체크리스트 위반 수 | 0 | review | UI-2 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-4, FR-5, FR-6, C-4..C-7 | `LTT.lintDeck` (vm) | unit, 모든 항목 | equivalence partitioning + BVA(2-value) | EP: choices 비배열, 문자열 원소, text 누락, id 누락, answer 불일치, 정상; BVA: choices 1개/2개; figure-no-type: type 없음/explain/figure/overview; next 없음/[]/1개 | 100% | rule·장면 번호 정확 | npm test |
| VO-2 | FR-1, FR-2, C-1, C-2 | 덱 페이지 `#ltt-check`와 audit 결과·출력·종료 코드 (Chrome) | integration, 고침 1개·권고 1개·둘 다·없음 | decision table | 4 규칙(고침 유무 × 권고 유무) | 100% | errors/advice 분리, 건수, 출력 줄, 종료 코드 0/1 | npm test |
| VO-3 | FR-3, C-3 | `?shot` vs `?check`의 `#ltt-expect` computed display | integration | equivalence partitioning | shot, check | 100% | none / not none | npm test |
| VO-4 | FR-7, C-8 | keywords 장면 DOM | integration | equivalence partitioning | from 없음, from 유효, from 무효 | 100% | 부모-자식 관계와 글 | npm test |
| VO-5 | FR-8, FR-9, C-9, C-10, QR-5 | 페이지 check (Chrome) + audit | integration | error guessing | 로드 중 ReferenceError(d3 누락), unhandled rejection, mount throw, 내용을 쓴 뒤 throw(빈 본문), render throw(예: predict choices 아님 상태로 render 예외), 예외 뒤 장면의 clock | none — experience-based | rule·where, 다른 장면 mount, 종료 1 | npm test |
| VO-6 | FR-10, C-11, C-12, QR-4 | predict·compare 장면 takeaway 보임과 자리 | integration | state transition | predict: 처음→공개, 공개→← 문제 상태; compare: 처음→공개, 초기화; reveal:false | 100% transitions | 각 상태의 보임; 공개 전 자리 유지(FR-10 관찰) | npm test |
| VO-7 | FR-11, FR-12, C-13, C-14 | `?shot&state=` 화면과 sceneList | integration | equivalence partitioning | reveal on predict, reveal on compare, step-k (2, m), 모르는 값, 상태 없는 장면, map-related 장면이 붙은 덱의 sceneList | 100% | 정답 선택(aria-pressed)·판정·단계 자막 k; map-related 제외와 n | npm test |
| VO-8 | FR-13, QR-2, QR-6 | audit `--shots` 파일과 index.md | integration | BVA(2-value) + EP | 상태 0개 덱, 상태 있는 덱(predict reveal, compare reveal, steps), 장면+상태 합 30/31 | 100% | 파일 집합·index 줄·잘림; 상태 PNG가 같은 장면 기본 PNG와 바이트가 다름 | npm test |
| VO-9 | FR-14, C-15, C-16 | `LTT.usesTerm` (vm) | unit | equivalence partitioning + BVA + differential fuzz | C-15·C-16의 항목, 조사 목록 각 항목 1개 이상 | 100% | 기대 boolean | npm test + fuzz |
| VO-10 | FR-14 | `used-before-defined` via `deckIssues` | unit | equivalence partitioning | 부분 문자열만 있는 앞 장면(없음), 경계 맞는 앞 장면(1건) | 100% | 건수 | npm test |
| VO-11 | FR-15, QR-1, QR-7 | 문서 파일 텍스트 | unit | syntax | FR-15의 각 사실(상태 shot은 `state=reveal`·`step-` 토큰, script-error·scene-error는 뜻(로드 예외·장면 예외)과 대응이 같은 줄에)(predict 형식, next, 순서, takeaway 공개, 필수 script, check/advice, shot 상태·index.md, 제목 지칭, background 조건, 미검증, 따옴표), 바이트 상한, rule 표 집합 | 100% | 각 사실이 지정 파일에 존재; 상한; 집합 같음 | npm test |
| VO-12 | QR-3, C-17 | 갤러리 audit | integration | scenario | 갤러리 전체 | 100% | error 0, baseline 같음 | npm test (gallery-audit) |
| VO-13 | 기존 계약 | 기존 tests | regression | scenario | 기존 테스트 전체 | 100% | pass(바뀐 계약에 걸린 단언만 이 spec 근거로 수정) | npm test |
| VO-14 | FR-15, FR-16, QR-8 | 지시 rewrite | review | — | RV-1 체크리스트 | 100% | 위반 0 | main이 base_commit 대비 diff를 읽고 RV-1 항목마다 판정을 실행 원장에 기록: (1) 각 FR-15 사실이 한 곳에만 있음 (2) 네 파일 간 모순 없음 (3) 삭제·약화된 기존 규칙마다 근거 (4) SKILL.md가 "API.md 네 절만 읽는다" 경계와 맞음 (5) 덧붙인 문단이 아니라 해당 절이 다시 짜였는지 |
| VO-15 | QR-3 | baseline diff | review | — | baseline 변화 항목 | 100% | 늘어난 건수가 모두 이번 rule(고침 lint·새 rule)로 설명됨 | main이 `npm run audit:baseline` 후 페이지별 audit 출력의 rule을 세어 원장에 기록 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | approval |
| --- | --- | --- | --- |
| D-1 | 개념 나무 = keywords `next`, 마지막 작성 장면 안에 그림 | 사용자 답 1-A | user answer |
| D-2 | checklist는 장면을 제목으로 지칭, 순서·제목 변경으로 지칭만 어긋난 곳의 고침 허용 | 사용자 답 2-A | user answer |
| D-3 | 결함 2·10–16·18·20 미룸, handoff `7a0ce2dc6e07a3ca`를 이 run 끝에 갱신(고친 항목 표시, 남은 항목 유지) | 사용자 답 3 "승인, handoff 작성" | user answer (갱신 방식은 brief v1 — approved) |
| D-4 | 권고 lint는 audit에 `advice`로만 보이고 종료 코드·건수에 안 셈 | rules.md "권고는 남아도 됨" 유지 | brief v1 — approved |
| D-5 | 갤러리 baseline은 새 rule로 늘어난 건수를 그대로 기록(수업 파일은 안 고침) | AGENTS.md Generated Lesson Defects | brief v1 — approved |
| D-6 | 결함 17·19(SKILL.md 문장만)는 rewrite에 포함 | rewrite 범위와 같은 파일, 비용 작음 | brief v1 — approved |
| D-7 | 한글 용어 경계는 조사·어미 목록 방식; "분산 투자", 『…기술』은 여전히 사용으로 셈 | 형태소 분석 없이 결정적으로 할 수 있는 한계 | brief v1 — approved |
| D-8 | 구조 기반 커버리지 측정 없음(kit은 Chrome·vm에서 실행) | 도구 없음 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1, FR-2 | C-1, C-2 | VO-2 | npm test |
| FR-3 | C-3 | VO-3 | npm test |
| FR-4, FR-5, FR-6 | C-4..C-7 | VO-1 | npm test |
| FR-7 | C-8 | VO-4 | npm test |
| FR-8, FR-9 | C-9, C-10 | VO-5 | npm test |
| FR-10 | C-11, C-12 | VO-6 | npm test |
| FR-11, FR-12 | C-13, C-14 | VO-7 | npm test |
| FR-13 | C-13 | VO-8 | npm test |
| FR-14 | C-15, C-16 | VO-9, VO-10 | npm test + fuzz |
| FR-15, FR-16 | — | VO-11, VO-14 | npm test + RV-1 |
| QR-1..QR-8 | C-17 | VO-2..VO-15 | 위 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| open finding ids | none (advisory A-2, A-4 남음) |

Audit state:
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 4 | tests/generator-defects.test.mjs (lintDeck predict-choices/figure-no-type/keywords-no-next) | accepted (verifier 2) | npm test 3차 pass | ltt.js RULES |
| VO-2 | 4 | tests/generator-defects-audit.test.mjs VO-2 (4 decision cells × page/audit + formatReport/exitCode) + no-signature·card-monotony 페이지 advice(A-1) | accepted (verifier 2) | pass | ltt.js, ltt-deck.js checkSource, audit.mjs |
| VO-3 | 4 | generator-defects-audit VO-3 | accepted (verifier 2) | pass | ltt.js STYLE |
| VO-4 | 4 | generator-defects-audit VO-4 (3 partitions + legacy fields) | accepted (verifier 2) | pass | ltt-deck.js keywords, ltt-deck.css |
| VO-5 | 4 | generator-defects-audit VO-5 (d3 누락, rejection+throw, mount throw ?shot/?check, render throw, string choices) + 쓰고-던짐 사례(G-4) | accepted (verifier 2) | pass | ltt.js listeners, ltt-deck.js mount |
| VO-6 | 4 | generator-defects-audit VO-6 (predict 3 states, compare reveal/reset, reveal:false, summary) + 자리 유지 관찰(S-1, predict) | accepted (verifier 2) | pass; '자리 유지'는 관찰 미지정으로 미단언 | ltt-deck.js, css |
| VO-7 | 4 | generator-defects-audit VO-7 (sceneList ?check/?shot, reveal predict/compare, step-2/3, C-14 4 cases) + aria-pressed 정답(G-2), map-related 제외(G-3) | accepted (verifier 2) | pass | ltt.js shotPosition, ltt-deck.js |
| VO-8 | 4 | generator-defects-audit VO-8 (C-13, 0-state, 2 sizes, 30/31 boundary, QR-6) + 상태 PNG 바이트 차이·compare reveal(G-1) | accepted (verifier 2) | pass | audit.mjs |
| VO-9 | 4 | generator-defects VO-9 (C-15, C-16, 40 josa, EP) + tests/term-boundary.fuzz.mjs (20000, seed 1, 0 diff) | accepted (verifier 2) | pass | ltt.js usesTerm |
| VO-10 | 4 | generator-defects VO-10 (6 cases deckIssues) | accepted (verifier 2) | pass | ltt.js termCheck |
| VO-11 | 4 | generator-defects VO-11 (20 doc facts, byte limits 36,126 B / 11,194 cp, QR-7 strict set) + api-docs internals.md defs + state=reveal·step- 토큰, 오류 뜻 줄 단위(G-5) | accepted (verifier 2) | pass | SKILL.md, API.md, rules.md, internals.md |
| VO-12 | 4 | tests/gallery-audit.test.mjs + regenerated baseline | accepted (verifier 2) | pass | baseline |
| VO-13 | 4 | 기존 테스트 전체; 갱신: api-docs, kit, lint-rules, scene-types, shots, fixtures/check 11개 (KW에 next, PNG만 셈, 이름 oracle 83) | accepted (verifier 2) | pass | — |
| VO-14 | 4 | RV-1 (실행 원장 R 행) | accepted (verifier 2) | F-2, F-3, F-6 발견·수정 | docs |
| VO-15 | 4 | baseline diff: 18×2 각 +1 `keywords-no-next` | accepted (verifier 2) | 설명됨 | baseline |

Execution ledger:
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | F-1 api-docs: `usesTerm`·`isAdvice` 문서 없음 (npm test 1차, 1335 중 7 실패) | 구현이 공개 이름을 문서화하지 않음 (verified) | v3: internals.md에 정의 | 보정 1 → implementer |
| 1 | F-2 gate-gaps: A-4 기준 2번 문장 변형, SKILL.md에 `?check` 없음 | rewrite가 기존 테스트가 지키는 문장을 바꿈, FR-16 (verified) | 원문 복원 | 보정 1 → implementer |
| 1 | F-3 RV-1: SKILL step 5·result.md가 남은 advice를 "미검증"에 넣음 | 검증 못 함과 권고 미처리가 섞임 (verified, 문서 읽음) | 별도 항목으로 | 보정 1 → implementer |
| 1 | F-4 api-docs/scene-types 이름 oracle에 `isAdvice` 없음 | spec에 Signature 없었음 (spec gap → v3) | oracle 갱신 | 보정 1 → test-implementer |
| 1 | F-5 퍼징 알파벳에 P 없음, QR-7 집합 모호 | spec 결함 (verified) | v3 | 보정 1 → test-implementer |
| 1 | gallery-audit baseline 불일치 | 예상된 변화(D-5) | main이 마지막에 재생성(VO-15) | resolved: `npm run audit:baseline`, 18페이지×2크기 각 +1, 전부 `keywords-no-next` (VO-15 기록) |
| 2 | npm test 2차 1343/1343 pass, fuzz 20000 no difference | F-1..F-5 해결 (verified) | — | F-1..F-5 closed |
| 2 | RV-1 판정: (1) FR-15 사실마다 한 곳—API.md(형식·next·순서·takeaway·필수 script·check JSON), SKILL.md(audit 뜻·shot 상태·제목 지칭·검증 입력·미검증·남은 권고·따옴표): 충족 (2) 4개 파일 모순 없음: 충족(F-3 수정 후) (3) 삭제·약화 근거: implementer 보고 목록, F-2·F-6로 복원 (4) 네 절 경계: 충족 (5) 덧붙임이 아니라 해당 절 재구성: SKILL §3 생성 순서 5번·검증·하지 않는다, API.md 페이지 계약·불러오기·덱 표 재구성 확인 | — | — | accepted |
| 3 | RV-1 (3) 삭제·약화 목록과 판정 (G-6): SKILL — 평가 기준 위 생성 단계 재나열 인용문 삭제(생성 순서 절과 중복, 근거 문장은 2번에 남음: 유지), kit 소개의 "kit에 없는 것은 직접 짠다" 삭제("하지 않는다"에 같은 규칙: 유지), audit 줄의 `?check`+`?shot` 병합 삭제(F-2로 복원), `control-shift` 언급 삭제(rules.md에 있음, audit 출력이 msg로 고칠 법을 줌: 유지), §1.3·§3 도입·3·4번 문장 다듬기(뜻 같음: 유지), "(아래 검증)"·"(이벤트 기록)" 삭제(유지), 평가 기준 2번 문장 변형(F-2로 복원). API.md — 메타 JSON 깨짐 시 동작 문장 삭제(작가가 할 일 아님: 유지), 비덱 구성 문장을 `LTT.theme` 행에 병합(유지), 소개의 rules.md 안내 삭제(SKILL에 있음: 유지), 부품 찾기 grep 코드 블록 삭제(SKILL에 같은 명령: 유지), `LTT.math`·`MOTION_MS` 행 병합·`LTT.check` "자동 한 번" 삭제(유지), 조합 조각의 diagram 노드·간선 1개와 `// LTT.deck` 줄·sweep `fmt` 삭제(문법 예시 유지: 유지), "테마는 그 분야 매체의 모양이다" 삭제(표 머리 설명과 중복: 유지), mock·deck 주석 단축(유지), katex CSS 주석 삭제(F-6로 복원), `layout` 행 기본값을 deck-contracts.md로 이관(덱 계약 문서에 같은 값: 유지), 소개 "수업 작성 참조." 삭제(유지) | — | — | accepted |
| 2 | F-6 RV-1: API.md katex CSS `<link>`의 `<!-- 수식 -->` 삭제 → 필수도 선택도 아닌 줄 | 보정 1의 바이트 절약 (verified, 문서 읽음) | 주석 복원, 다른 곳에서 같은 바이트 절약 | 보정 2 → implementer → fixed (npm test 3차 1343/1343) |
| 3 | 손 mutation 10건(가장 강한 결함 부류: lint 형식 오판, 등급 오배정, shot 패널, 공개 전 노출, 오류 수집 누락, 경계 판정, 단계 off-by-one, shot 상한, 나무 부모, 장면 예외 전파 — 각각 이번 결함 1·4·5·6·8·9를 다시 만드는 방향이라 선택) | M1..M10 주입 → 대상 테스트 실행 → seed restore | — | 10/10 killed, 의도한 단언(VO-1,2,3,4,5,6,7,8,9)이 실패; restore md5 일치 |
| 3 | verifier 1 retry: G-1..G-5 증거 공백, G-6 기록 공백, S-1 spec 문제, A-1..A-3 권고 | 테스트가 관찰을 덜 함 / spec 관찰 미정의 (verified, 테스트 읽음) | v4 개정, G-6 원장 보완, 보정 3 → test-implementer (G-1..G-5, S-1, A-1) | 진행 |
| 4 | 보정 3 결과: npm test 4차 1347/1347, fuzz 20000 0 diff | — | — | G-1..G-5, S-1, A-1 증거 추가 |
| 4 | 확인 mutation M11 상태 shot에 &state= 없음, M12 공개가 첫 선택지, M13 sceneList에 map-related, M14 부분 렌더 유지 (verifier 제안 결함 부류) | — | 주입·실행·restore | 4/4 killed, 각각 G-1·G-2·G-3·G-4 단언이 실패; restore md5 일치 |
| 4 | 영향 판단: 보정 3은 tests/generator-defects*.test.mjs만 변경. VO-1,3,4,9,10,12,13은 바뀐 의존 없음 → verifier 1 accept 유지; VO-2,5,6,7,8,11 invalidated → 재감사 | — | — | — |
| 5 | verifier 2 pass: VO-2,5,6,7,8,11,14 accept, 유지 accept 확인. advisory A-2(QR-7 기대 집합 수기), A-4(문서 사실 위치·한 번만 검사는 RV-1에 의존), 잘림 표시 index 형식 미단언 | — | — | 완료, advisory는 비차단 |

# Version Log
## v1
- 초안. 사용자 답: 1-A(keywords 끝 개념 나무), 2-A, 3(결함 2 미룸, handoff 작성), 지시는 덧붙이기가 아닌 rewrite.
## v2
- 계약만 변경: Implementation 경로에 `kit/ltt-deck.css` 추가(ltt-deck.js STYLE 블록의 원본이라 FR-7·FR-10 CSS가 여기 있어야 함; implementer 보고).
## v3
- 계약만 변경: `LTT.isAdvice` Signature 추가(implementer가 ltt-deck.js에서 쓰려고 공개함), `usesTerm`·`isAdvice` 문서 위치를 internals.md로 지정(기존 api-docs 계약), Implementation에 internals.md 추가. 퍼징 알파벳에 `P` 추가(test-implementer 지적: `FLOP`이 나올 수 없음). QR-7 집합 범위 명시. FR-16에 기존 테스트가 지키는 문장 유지 명시(gate-gaps 실패 2건).
## v4
- verifier 1 (retry) 반영, 계약·관찰만 구체화: FR-10 '자리 유지' 관찰 정의(S-1), FR-11 정답 선택 관찰 aria-pressed(G-2), VO-5 쓰고-던짐 사례(G-4), VO-7 map-related 사례(G-3), VO-8 상태 PNG 바이트 차이·compare reveal(G-1), VO-11 상태 shot·오류 뜻 토큰(G-5), QR-3·C-17 문구를 D-5와 일치(A-3).
