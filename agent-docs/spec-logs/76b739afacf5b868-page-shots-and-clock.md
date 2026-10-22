---
version: 2
run_id: 76b739afacf5b868
status: complete
base_commit: 6d370ce27c20d821649d1bb4652a5a24e756c260
max_verifier_invocations: 2
handoff: agent-docs/handoff/6cc0362b0535c56b-page-screenshot-and-kit-keywords.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 생성 agent | 수업 형식(덱/스크롤/한 화면)과 무관하게 렌더링 결과를 스크린샷으로 받는다 | `audit.mjs <lesson> --shots <dir>`가 덱은 장면마다, 덱 아닌 페이지는 스크롤 위치마다 PNG를 남긴다 |
| UI-2 | 생성 agent | 움직이는 그림은 agent가 checklist에 정한 핵심 상태로 찍힌다. 한 그림에 여러 장일 수 있다 | `checklist.md`의 `[shot <clock id> <ms>]` 표식마다 그 시점의 PNG가 하나씩 나온다 |
| UI-3 | 생성 agent·검증 서브에이전트 | 도구 출력은 고칠 것(결정적 오류)과 볼 것(PNG 경로)뿐이다 | 출력에 check 오류·표식 오류·PNG 경로만 있고, 레이아웃 판정(auditScene)·deck lint 줄은 없다 |
| UI-4 | 학습자 | 움직이는 그림이 보일 때만 돌고, reduced-motion이면 움직이지 않는다 | 화면 밖·숨긴 탭에서 `draw`가 불리지 않고, reduced-motion이면 `draw(dur)`만 불린다 |
| UI-5 | 저장소 유지보수자 | 지운 판정 코드가 남지 않고 갤러리 기준선이 새 출력으로 돈다 | kit·server·scripts에 `auditScene`·`ltt-audit` 참조 0, `npm run audit:baseline`이 check 오류 수를 기록 |

# Scope
In scope: `LTT.clock`과 clock 레지스트리; kit `?shot` 모드(시계 고정, `y` 스크롤, `clock`/`t` 지정 상태); `#ltt-check`에 `scroll`·`scenes`·`clocks` 필드 추가; `server/audit.mjs`의 스크린샷 도구화와 `--checklist` 표식 읽기; 덱 `?audit`·`audit()`·`measure()`·`#ltt-audit`·`layout-audit` 이벤트와 `LTT.auditScene` 삭제; `scripts/gallery-audit.mjs` 기준선을 check 오류 수로; 관련 kit 문서(API.md 페이지 계약·기본 이름, api/rules.md audit 절, api/internals.md), CHANGELOG, SKILL.md §3의 audit·clock 서술.
Out of scope: A 갈래 자동 보정(handoff 4), kit `@ltt-part` 키워드 주석(단계 B), standalone.md·README·SKILL.md 문서 고정 테스트 6건(단계 C), `audit.mjs` 파일 이름 변경, `LTT.lintDeck` 규칙 자체의 변경(덱 패널 경고는 그대로), 폰 화면, 버전 올림.

# Paths
Implementation: skills/learn-to-tell/kit/api/deck-contracts.md, skills/learn-to-tell/kit/api/diagram.md, skills/learn-to-tell/kit/api/controls.md, skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/server/audit.mjs, scripts/gallery-audit.mjs, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/rules.md, skills/learn-to-tell/kit/api/internals.md, skills/learn-to-tell/kit/CHANGELOG.md, skills/learn-to-tell/SKILL.md
Tests: tests/release-docs.test.mjs, tests/clock.test.mjs, tests/shots.test.mjs, tests/fixtures/shots/, tests/check-page.test.mjs, tests/fixtures/check/, tests/kit.test.mjs, tests/scene-types.test.mjs, tests/lint-rules.test.mjs, tests/api-docs.test.mjs, tests/gallery-audit.test.mjs, tests/gallery-audit.baseline.json
Test command: npm test && node scripts/build.mjs css --check && node scripts/build.mjs version (통과 기준: base_commit에서도 실패하는 6건 — `plan b71ddee49f77ac06 §3: real SKILL.md is at most 8,500 code points`, `VO-16 §6 granularity rule`, `VO-6 FR-11 PROJECT 범위 line`, `VO-6 FR-11 PROJECT kit/api`, `VO-6 FR-7 §3 read line`, `VO-6 FR-9 §5 template` — 외 실패 0)
Review evidence: RV-1 PNG 육안 확인 — main이 `tests/fixtures/shots/`의 스크롤 페이지 1개(clock 포함)와 갤러리 덱 1개에 `audit.mjs --shots <scratchpad> --checklist <fixture checklist>`를 돌려 PNG를 열고, 스크롤 PNG가 겹침 없이 페이지를 위에서 아래로 덮고, 표식 PNG가 그 시점 상태(draw(t)가 그린 고유 표시)를 화면 안에 보이는지 본다. 산출물: Execution ledger에 명령·PNG 목록·판정.
Fuzzing: none — 새 파싱 표면은 표식 정규식 하나로 syntax testing(VO-7)이 유효·무효 형식을 덮고, 나머지 표면은 실제 Chrome 실행이라 무작위 반복 비용이 크다.
Mutation tool: none — 저장소에 의존성이 없고 도구 도입 비용이 범위에 비해 크다. hand mutation 8–10건.

# Signatures
LTT.clock(el: Element, draw: (t: number) => void, opts: {dur: number, loop?: boolean, id?: string}) → {play(): void, pause(): void, seek(t: number): void}
LTT.clock 환경 계약(전역은 `LTT.clock` 호출 때 읽는다. kit 로드 때가 아니다): `requestAnimationFrame(cb(ts))`/`cancelAnimationFrame`; `IntersectionObserver`(없으면 늘 보임으로 본다; 있으면 첫 콜백에서 `isIntersecting`이 참이 될 때까지 멈춤); `matchMedia("(prefers-reduced-motion: reduce)").matches`(없으면 거짓); `location.search`(`shot`, `clock`, `t`); `document.hidden`과 `document.addEventListener("visibilitychange", …)`(document 없으면 늘 보임). 재생(또는 재개) 뒤 첫 rAF 프레임은 현재 t를 그리고 그 ts를 기준점으로 삼는다. 이후 프레임은 t += (ts − 직전 ts).
export function parseChecklist(text: string) → {marks: [{id, ms}], errors: [{where: "checklist", rule: "shot-format", msg}]} (server/audit.mjs; 중복 (id, ms)는 첫 것만)
#ltt-check JSON: {source, viewport, errors, scroll: number, scenes?: number (덱만), clocks: [{id, dur}] (id 있는 clock만)}
URL 모드: `?shot` / `?shot&y=<px>` / `?shot&clock=<id>&t=<ms>`. `?shot`이면 kit은 자동 검사와 위치 맞춤(FR-5·FR-6)이 끝난 뒤 `<html data-ltt-shot>` 속성을 단다(스크린샷 도구가 기다리는 신호)
audit({targets, sizes, chrome, budget, jobs, home, galleryDir, shots, checklist: <file path>|null})
checklist 표식: `[shot <id> <ms>]`, id `[A-Za-z0-9_-]+`, ms 0 이상 정수. 표식이 아닌 `[shot` 시작 조각은 형식 오류
CLI: node audit.mjs <대상>... [--size WxH]... [--shots <dir>] [--checklist <file>] [--json] [--chrome <경로>] [--budget <ms>] [--jobs <n>] [--home <dir>] | --gallery
audit() 결과 항목: {target, size, url, viewport, scroll, check: [{where, rule, msg}], marks: [{where: "checklist", rule, msg}], shots: [path], truncated: boolean} | {target, size, url, error}
exitCode(results): 2 어떤 항목에 error / 1 check 또는 marks가 하나라도 / 0

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `LTT.clock`은 보이는 동안 rAF마다 `draw(t)`를 부른다. t는 재생 경과 ms, [0, dur]. `loop`이면 dur 뒤 0부터 다시, 아니면 `draw(dur)` 후 멈춘다 | must | handoff 2 |
| FR-2 | `el`이 뷰포트 밖(IntersectionObserver)이거나 `document.hidden`이면 `draw`를 부르지 않고 경과 시간도 늘지 않는다. 다시 보이면 멈춘 t에서 이어 간다 | must | handoff 2 |
| FR-3 | `prefers-reduced-motion: reduce`면 `draw(dur)` 한 번만 부르고 rAF를 돌지 않는다. `play()`도 돌지 않는다 | must | handoff 2 |
| FR-4 | `pause()`는 멈추고, `play()`는 이어 가고(보이는 동안만), `seek(t)`는 t를 [0, dur]로 잘라 `draw(t)`를 즉시 부른다 | must | handoff 2 |
| FR-5 | `?shot`이면 모든 clock은 돌지 않고 `draw(dur)`만 그린다. `?shot&clock=<id>&t=<ms>`면 그 id의 clock만 `draw(t)`(다른 clock은 dur), 그 clock이 덱 장면 안이면 그 장면을 보이고, el이 뷰포트 안에 오게 스크롤한다 | must | 사용자(핵심 상태를 checklist로) |
| FR-6 | `?shot&y=<px>`면 검사 뒤 `scrollTo(0, y)` | must | 계획 A |
| FR-7 | `#ltt-check`에 `scroll`(문서 scrollHeight), 덱이면 `scenes`, `clocks`(id 있는 clock의 `{id, dur}`, 생성 순)를 더한다. 같은 id가 두 번이면 check 오류 `clock-duplicate-id` 하나 | must | 계획 A |
| FR-8 | `audit.mjs`는 대상×크기마다 `?shot`으로 DOM을 떠 `#ltt-check`만 읽는다. 결과의 `check`는 `errors` 그대로다 | must | handoff 1 |
| FR-9 | `--shots <dir>`이면 덱은 장면 1..scenes(`#n`), 덱 아닌 페이지는 `y = 0, h, 2h, …`(h = viewport 높이, y < scroll)로 찍는다. 한 크기당 30장 상한, 넘으면 앞 30장만 찍고 `truncated: true` | must | handoff 1, 계획 기본값 |
| FR-10 | `--checklist <file>`이면 표식을 문서 순서로 읽고 같은 (id, ms) 중복은 한 번만, `--shots`가 있을 때 표식마다 `?shot&clock=<id>&t=<ms>`로 한 장 찍는다. 표식 PNG는 30장 상한에 세지 않는다 | must | 사용자 |
| FR-11 | 표식 오류는 `marks`에 `{where:"checklist", rule, msg}`로: `shot-format`(형식 오류 조각), `shot-unknown-clock`(그 크기의 `clocks`에 없는 id), `shot-bad-time`(ms > dur). 오류 표식은 찍지 않는다 | must | 사용자 |
| FR-17 | 스크린샷은 Chrome DevTools Protocol을 `--remote-debugging-pipe`로 써서 찍는다(대상×크기마다 Chrome 하나). CLI `--screenshot`은 쓰지 않는다. 장마다 새 문서로 연다(같은 URL의 해시만 바꾸지 않는다). 찍기 전 `prefers-reduced-motion: reduce`를 에뮬레이트하고 `data-ltt-shot`을 기다린 뒤 두 프레임을 더 기다린다. 한 장에서 실패(시간 초과·PNG 쓰기 실패)하면 그 장만 빠진다 | must | v2: Chrome 155 headless `--screenshot`이 스크롤한 문서를 빈 화면으로 찍는다 |
| FR-12 | PNG 이름: `<slug>-<size>-p<NN>.png`(스크롤), `<slug>-<size>-s<NN>.png`(장면), `<slug>-<size>-<id>-t<ms>.png`(표식). NN은 2자리 0채움 | must | 계획 A |
| FR-13 | 텍스트 출력: 대상·크기마다 `<size> <target>  check <n> · marks <m> · shots <k>[ (잘림)]` 한 줄, 이어서 `    check <where> [<rule>]: <msg>`, `    checklist [<rule>]: <msg>`, `    <png 경로>` 줄. 실패 항목은 `오류: <msg>`. 마지막 줄은 크기별 `<size> (화면 W×H): check <합계>건` 요약. auditScene·lint·expectFails 줄은 없다 | must | UI-3, 사용자(deck lint 뺌) |
| FR-14 | 덱 `?audit` 경로(`audit()`, `measure()`, `#ltt-audit`, `data-ltt-audit`, `layout-audit` 이벤트)와 `LTT.auditScene`(및 그만 쓰던 보조 코드)을 지운다. 덱 `prepare`는 `?check` 또는 `?shot`에서 모든 장면을 마운트한다. lintDeck의 패널 경고는 그대로 | must | handoff 1 |
| FR-15 | `scripts/gallery-audit.mjs --write-baseline`은 크기·대상별 `check.length`를 쓴다 | must | 계획 기본값 |
| FR-16 | 문서: API.md 페이지 계약에 `?shot` 모드와 `#ltt-check` 새 필드, 기본 이름 표에 `LTT.clock`. api/rules.md에서 audit 절 삭제, internals.md에서 지운 이름 제거. SKILL.md §3: 필수 파트에 "움직이는 그림은 `LTT.clock`(id 붙임)", 검증표 2번에 `[shot <id> <ms>]` 표식, 5번 명령에 `--checklist`, 검증 절의 `?audit`·패널 문장을 `?shot`·스크린샷으로. CHANGELOG 항목 | must | 계획 A |

# Errors
- `--checklist` 파일이 없음 — stderr 메시지, 종료 코드 2 — 아무것도 찍지 않는다.
- `#ltt-check`가 없음/JSON 깨짐 — 그 항목 `error`, 종료 2 — 다른 항목은 계속.
- 개별 스크린샷 Chrome 실패/시간 초과 — 그 PNG만 빠진다(`shots`에 없음), 나머지는 계속 — 종료 코드는 check·marks로만 정한다.
- 표식 오류(FR-11) — `marks` 줄, 종료 1 — 유효 표식은 찍는다.
- `LTT.clock`에 `dur`가 양수가 아님 — `TypeError` throw — clock은 등록되지 않는다.
- `draw`가 throw — 콘솔 경고, clock 멈춤 — 페이지와 다른 clock은 계속.
- `?shot&clock=<id>&t=<ms>`는 reduced-motion보다 앞선다: 그 clock은 reduced-motion이어도 draw(t).
- `?shot&clock=<없는 id>` — 모든 clock은 dur 상태, 스크롤 안 함 — 오류는 audit.mjs가 FR-11로 이미 낸다.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 보이는 clock, dur 1000, loop 없음, rAF 시각 0,500,1200 | draw(0), draw(500), draw(1000) 후 더 부르지 않음 |
| C-2 | normal | loop, dur 1000, 시각 0,1500 | draw(500) |
| C-3 | edge | 시각 300에 뷰포트 밖, 2000에 다시 보임, 2100 | 밖인 동안 draw 없음, 다시 보인 뒤 draw(300), draw(400) |
| C-4 | edge | document.hidden 전환 | C-3과 같음 |
| C-5 | normal | reduced-motion | draw(dur) 1회, rAF 등록 0, play() 뒤에도 0 |
| C-6 | boundary | seek(-5), seek(dur+5), seek(dur) | draw(0), draw(dur), draw(dur) |
| C-7 | error | dur 0, -1, NaN, 없음 | TypeError |
| C-8 | normal | `?shot` 페이지, clock 두 개 | 둘 다 draw(dur) 1회, rAF 0 |
| C-9 | normal | `?shot&clock=a&t=400` | a는 draw(400), b는 draw(dur), a의 el이 뷰포트 안 |
| C-10 | normal | 덱 3장면, 2장면에 clock `a`, `?shot&clock=a&t=0` | 2장면이 보이고 a는 draw(0) |
| C-11 | normal | 스크롤 높이 2.5×h 페이지, 1440x900 `--shots` | p01..p03, y=0,h,2h |
| C-12 | boundary | scroll = h, h+1, 31h | 1장, 2장, 30장+truncated |
| C-13 | normal | 덱 4장면 | s01..s04 |
| C-14 | normal | checklist `[shot a 0] [shot a 1200]` 그리고 `[shot a 1200]` 다시 | a-t0, a-t1200 두 장 |
| C-15 | error | `[shot a]`, `[shot a -1]`, `[shot a/../x 1]`, `[shot zz 0]`(없는 id), `[shot a 9999]`(dur 2000) | shot-format 3, shot-unknown-clock 1, shot-bad-time 1, 해당 PNG 없음, 종료 1 |
| C-16 | error | 같은 id clock 두 개 | check에 clock-duplicate-id 1건 |
| C-17 | normal | 오류 없는 페이지, 표식 없음 | 종료 0, 요약 줄 `check 0건` |
| C-18 | error | `--checklist` 없는 파일 | 종료 2 |
| C-19 | edge | 갤러리 덱 전체 `--gallery` | 모든 항목 error 없음, 기준선 check 수와 같음 |
| C-20 | edge | draw가 throw | 다른 clock 계속, 페이지 check 정상 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | FR 전체 |
| Performance efficiency | yes | 스크린샷 수가 Chrome 실행 수라 생성 시간이 늘어난다; 화면 밖 clock은 CPU를 쓰지 않아야 한다 |
| Compatibility | yes | 기존 갤러리 덱과 덱 아닌 페이지가 같은 도구로 돈다 |
| Interaction capability | yes | agent가 출력만으로 고칠 곳을 알아야 한다 |
| Reliability | yes | 한 장 실패가 전체를 막지 않는다 |
| Security | yes | 표식 id가 파일 이름이 된다(경로 탈출 금지) |
| Maintainability | yes | 지운 판정 코드의 잔여 참조 |
| Flexibility | no | 데스크톱 2크기 고정, 새 환경 요구 없음 |
| Safety | no | 물리적 위해 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Performance / time behaviour | 스크롤 3장 페이지 + 표식 2개, 2크기, jobs 4 | `audit()` 벽시계 시간, 초 | ≤ 60 | automated (tests/shots.test.mjs 시간 단언) | 계획 기본값 |
| QR-2 | Performance / resource utilization | 뷰포트 밖 clock | 밖인 구간의 draw 호출 수, 회 | = 0 | automated C-3, mutation | handoff 2 |
| QR-3 | Compatibility / co-existence | 갤러리 전체 | error 항목 수, 기준선과 다른 check 수 | = 0, = 0 | automated gallery-audit.test | 계획 A |
| QR-4 | Interaction / self-descriptiveness | FR-13 출력 | 각 오류 줄이 where·rule·msg를 담는가 | 100% | automated 출력 줄 단언 | UI-3 |
| QR-5 | Reliability / fault tolerance | 한 스크린샷만 실패(존재하지 않는 출력 경로 대신 스텁 chrome) | 나머지 PNG 수, 종료 코드 | 나머지 모두, 0/1(2 아님) | automated | Errors |
| QR-6 | Security / integrity | 표식 id | `/`, `..`, 공백 등 `[A-Za-z0-9_-]` 밖 문자 표식으로 `--shots` 밖 파일 생성 | = 0 | automated C-15 | 계획 기본값 |
| QR-7 | Maintainability / modifiability | kit/*.js, server/*.mjs, scripts/*.mjs, kit/API.md, kit/api/*.md, SKILL.md | `auditScene`, `ltt-audit`, `?audit`, `layout-audit` 문자열 수 | = 0 | automated grep 테스트 | handoff 1 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, FR-2, FR-4, C-1..C-4, C-6, QR-2 | `LTT.clock` 반환 객체, vm에서 rAF·IntersectionObserver·document.hidden 스텁 | unit, 모든 상태 | state transition | 상태 {playing, paused-user, paused-offscreen, paused-hidden, ended}; 전이 play/pause/seek/밖/안/hidden/visible/tick-to-end — 0-switch 전이 전부 | 100% 전이 | draw 호출 열이 기대 열과 같다 | tests/clock.test.mjs |
| VO-2 | FR-4, C-6 | `seek` 인자 | unit | boundary value analysis (3-value) | -1, 0, 1, dur-1, dur, dur+1 | 100% | draw 인자 = clamp | tests/clock.test.mjs |
| VO-3 | FR-3, FR-5, C-5, C-8 | reduced-motion × `?shot` × loop | unit | combinatorial (all combinations) | {rm 켬/끔} × {shot 있음/없음} × {loop 참/거짓} = 8 | 100% | 켬 또는 shot이면 draw(dur) 1회·rAF 0; 아니면 재생 | tests/clock.test.mjs |
| VO-4 | Errors(dur, draw throw), C-7, C-20 | `LTT.clock` opts.dur, draw | unit | equivalence partitioning | dur {양수, 0, 음수, NaN, 없음}; draw {정상, throw} | 100% | TypeError / 경고+정지, 다른 clock 계속 | tests/clock.test.mjs |
| VO-5 | FR-5, FR-6, FR-7, C-9, C-10, C-16 | 실제 Chrome `--dump-dom`/스크린샷, fixtures/shots | integration, 픽스처 페이지 3개(스크롤, 덱, 중복 id) | decision table | 규칙: {shot 없음, shot, shot+y, shot+clock 있는 id, shot+clock 없는 id} × 페이지 종류 {페이지, 덱} 중 의미 있는 9칸 + 중복 id | 100% | `#ltt-check` 필드·draw 표시(DOM 속성)·scrollY·보이는 장면 | tests/shots.test.mjs |
| VO-6 | FR-8, FR-9, FR-12, C-11..C-13 | `audit()` 결과 shots·truncated | integration | boundary value analysis (2-value) | scroll ∈ {h, h+1, 30h, 30h+1}; 덱 장면 수 {1, 4} | 100% | PNG 이름·개수·truncated | tests/shots.test.mjs |
| VO-7 | FR-10, FR-11, C-14, C-15, QR-6 | 표식 파서·검사 (export된 parse 함수 또는 audit() 결과) | unit+integration | syntax testing | 유효: 1 표식, 한 줄 여러 표식, 중복; 무효: ms 없음, 음수, 소수, id에 `/`·`..`·공백, `[shot]`, 닫는 괄호 없음; 의미 오류: 없는 id, ms>dur, ms=dur(유효) | 100% | marks rule·PNG 유무·`--shots` 밖 파일 0 | tests/shots.test.mjs |
| VO-8 | FR-13, Errors(checklist 없음, #ltt-check 없음), C-17, C-18, QR-4 | `formatReport`, `exitCode`, CLI | integration | decision table | {error 있음, check>0, marks>0, 모두 0} × 잘림 {예, 아니오}; CLI checklist 없음 | 100% | 출력 줄 정확 일치, 종료 코드 2/1/1/0 | tests/shots.test.mjs, tests/check-page.test.mjs VO-14 개정 |
| VO-9 | QR-5, FR-17 | 한 장 실패 | integration | error guessing | 두 번째 스크롤 PNG 경로(FR-12 이름)에 미리 같은 이름의 디렉터리를 만들어 쓰기 실패를 일으킴 | none — experience-based | 나머지 PNG 존재, 종료 ≠ 2 | tests/shots.test.mjs |
| VO-10 | FR-14, FR-15, C-19, QR-3 | 갤러리 전체 | end-to-end | scenario | 갤러리 각 대상 | 100% | error 0, check 수 = 기준선 | tests/gallery-audit.test.mjs + 기준선 재작성 |
| VO-11 | FR-14, FR-16, QR-7 | 저장소 파일 | unit | equivalence partitioning | QR-7 문자열 4종 × 파일 군 6종; `LTT.auditScene === undefined`; API.md에 `LTT.clock` 행·`?shot`; SKILL.md에 `[shot`·`--checklist` | 100% | 단언 | tests/api-docs.test.mjs |
| VO-12 | QR-1 | VO-5 스크롤 픽스처 + 표식 2 | integration | boundary value analysis (2-value) | 60초 경계(측정만, 60 이하) | 100% | 경과 ≤ 60s | tests/shots.test.mjs |
| VO-13 | UI-1, UI-2 | PNG 실물 | review | scenario | RV-1 두 대상 | 100% | 스크롤 PNG가 페이지를 덮고 표식 PNG에 그 시점 표시가 보인다 | RV-1 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| D-1 | 핵심 상태는 checklist `[shot <id> <ms>]` 표식으로, clock에 `id` | 사용자 선택 | user answer |
| D-2 | deck lintDeck 줄은 도구 출력에서 뺀다(덱 패널 경고는 유지) | 사용자 선택 | user answer |
| D-3 | 표식 없는 스크롤·장면 스크린샷의 clock은 마지막 상태 draw(dur) | 정지 상태가 결정적이어야 비교된다 | brief v1 — approved |
| D-4 | 파일 이름 `audit.mjs` 유지 | SKILL.md·scripts·tests 참조 | brief v1 — approved |
| D-5 | 크기당 스크롤·장면 30장 상한, 표식은 상한 밖 | 검증자 이미지 수 부담 | brief v1 — approved |
| D-6 | 결과 JSON 필드 교체(audit·lint·expectFails·scenes 삭제, marks·shots·truncated·scroll 추가) | 소비자는 저장소 안 scripts·tests뿐 | brief v1 — approved |
| D-7 | 기준선은 check 오류 수 | 판정 규칙이 사라짐 | brief v1 — approved |
| D-8 | Mutation tool·fuzzing 없음, hand mutation 8–10 | 의존성 없는 저장소 | brief v1 — approved |
| D-9 | QR-1 60초 | 현재 갤러리 덱 1개 2크기가 수 초 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1, C-2 | VO-1 | tests/clock.test.mjs |
| FR-2 | C-3, C-4 | VO-1 | tests/clock.test.mjs |
| FR-3 | C-5 | VO-3 | tests/clock.test.mjs |
| FR-4 | C-6 | VO-1, VO-2 | tests/clock.test.mjs |
| FR-5 | C-8, C-9, C-10 | VO-3, VO-5 | clock, shots tests |
| FR-6 | C-11 | VO-5 | tests/shots.test.mjs |
| FR-7 | C-16 | VO-5 | tests/shots.test.mjs |
| FR-8 | C-17 | VO-6, VO-8 | tests/shots.test.mjs |
| FR-9 | C-11, C-12, C-13 | VO-6 | tests/shots.test.mjs |
| FR-10 | C-14 | VO-7 | tests/shots.test.mjs |
| FR-11 | C-15 | VO-7 | tests/shots.test.mjs |
| FR-12 | C-11, C-13, C-14 | VO-6, VO-7 | tests/shots.test.mjs |
| FR-13 | C-17 | VO-8 | tests/shots.test.mjs |
| FR-14 | C-19 | VO-10, VO-11 | gallery, api-docs tests |
| FR-15 | C-19 | VO-10 | tests/gallery-audit.test.mjs |
| FR-16 | — | VO-11 | tests/api-docs.test.mjs |
| QR-1..QR-7 | — | VO-12, VO-1, VO-10, VO-8, VO-9, VO-7, VO-11 | as listed |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1, VO-2, VO-3, VO-9, VO-11, VO-12, VO-13 | 2 | 감사 1에서 accept, 감사 2에서 유지 | accepted | M1–M7 killed; VO-12 실측 6.5s | 이후 변경 없음 |
| VO-4, VO-5, VO-6, VO-7, VO-8, VO-10 | 2 | 감사 2: F-1/F-2/F-4/F-5 테스트, RV-2 | accepted | M8–M14 killed | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| A-1 | Chrome 155 headless `--screenshot`이 스크롤한 문서를 흰 화면으로 찍음 (implementer 보고, main 재현 scratchpad/bug/a.png) | verified: Chrome 버그 | CDP pipe `Page.captureScreenshot`(v2 FR-17) | fixed: p01–p04 내용 정상(implementer 확인) |
| A-2 | QR-7: kit/api/diagram.md·controls.md에 `?audit` 남음, 경로 밖 | verified: 경로 누락 | main이 한 구절씩 고치고 두 파일을 Implementation에 추가 | fixed: grep 0 |
| A-3 | 첫 Test command: 1130 중 78 실패. VO-1/VO-3/VO-4 clock 다수: C-1 draws [0,0,0] | verified: implementation defect — 계속 재생 중에도 프레임마다 시간 기준점이 초기화됨 | correction batch 1 → implementer | open |
| A-4 | VO-10 FR-9 field/meta table(release-docs), scene-types VO-1 C-2: auditHero·auditSmallVisual·auditLooseFigure·sumVisualAreas 기대 | verified: test defect — FR-14 "그만 쓰던 보조 코드"에 해당해 제거됨 | batch 1 → test-implementer, tests/release-docs.test.mjs를 Tests에 추가 | open |
| A-5 | VO-5 C-10: probe가 장면 1 보임·장면 2 안 보임 | verified: test defect — `--dump-dom`+virtual time에서 CSS 전환이 진행되지 않음. probe를 data-ltt-shot 1초 뒤로 미뤄도 같음; CDP 실제 PNG(scratchpad/c10/shots/…-a-t0.png)는 장면 2 | batch 1 → test-implementer: 픽스처에서 전환 끄기, probe는 data-ltt-shot 대기 | open |
| RV-1 | — | — | main이 PNG 열람 | pass |
| A-6 | shots suite 간헐 실패: CLI 종료 2 `ENOTEMPTY rmdir …/p0/Default`(C-17), VO-6·VO-9 1회씩 | hypothesis: close()가 SIGKILL 뒤 Chrome 종료를 기다리지 않고 tmp 프로필을 지움 | batch 2 → implementer: 종료 대기 + 관대한 정리 | open |
| A-3/A-4/A-5 갱신 | D-1 수정(implementer: update()의 last 리셋 제거), T-1·T-2 적용 | — | test-implementer 실행: scene-types·release-docs 통과, shots 54/54(1회) | fixed (Test command 재실행 대기) |
| A-6 갱신 | D-2 수정(close가 Chrome 종료 대기, rm maxRetries·무시) | — | implementer 10회 루프 종료 0; Test command 2회 연속 사전 실패 6건만 | fixed |
| V-1 | verifier 1: retry, F-1(bad-time 다른 clock dur·dur+1), F-2(다중 대상 중 하나 오류), F-3(baseline writer 미관찰), F-4(clocks 목록: 거부·id 없음·생성 순), F-5(표식이 30장 상한 밖) | evidence gaps | F-1/2/4/5 → test-implementer batch 3; F-3 → main RV-2 | 아래 |
| RV-2 | F-3 | — | site/gallery/zz-rv2.html(`{{}}` 미정의 2개) 추가 → `node scripts/gallery-audit.mjs --write-baseline` → 두 크기 모두 `"zz-rv2.html": 2` 기록 → 파일 삭제·기준선 복원(git status 깨끗) | pass |
| A-7 | batch 3 첫 실행 4 실패 | verified: main mutation 실행 중 겹침(무효), 이후 깨끗한 실행에서 VO-8 F-2만 실패 — test defect: target은 `lessons/<id>/lesson.html` 라벨 | test-implementer가 includes로 비교 | fixed: shots 59/59 |
| MUT | hand mutation 14건(M1 offscreen draw, M2 재개 재기준 없음, M3 shot draw(0), M4 seek 무클램프, M5 reduced 무시, M6 shot clock이 reduced에 짐, M7 draw throw 미격리, M8 스크롤 장수 off-by-one, M9 상한 >=, M10 exit가 marks 무시, M11 (잘림) 누락, M12 bad-time 최대 dur 비교, M13 표식이 상한에 셈, M14 id 없는 clock 나열) | 선택 이유: verifier 제안 결함 부류 + v2 위험(캡처 경로·상한·표식) | seed backup/restore, 대상 테스트 파일 실행 | 14/14 killed by intended assertions; seed status none. M8–M11은 batch 3 편집과 겹쳐 실행됐으나 각 mutation의 의도한 기존 단언(VO-6 BVA, VO-7 C-15, VO-8 truncated)이 잡음 |
| T-final | Test command | — | 1127 중 실패 6(사전 실패)만; css in sync; version 0.2.0; VO-12 실측 6.5초 | pass |
| V-2 | verifier 2: pass, F-1..F-5 closed | — | advisory: RV-2를 자동 테스트로 고정하면 좋음(비차단) | complete |

# Version Log
## v1
- 초안. handoff 6cc0362b 1·2단계, 사용자 결정 D-1·D-2.
## v2
- FR-17 추가, VO-9 주입 방법 변경, `data-ltt-shot` 신호와 `audit()`의 `checklist` 옵션을 Signatures에, shot clock이 reduced-motion보다 앞섬을 Errors에, `kit/api/deck-contracts.md`를 Implementation에. 근거: implementer가 보고하고 main이 재현함 — Chrome 155.0.8059.85 headless에서 scrollTo(0,900) 뒤 `--screenshot`이 전부 흰 PNG(scratchpad/bug/a.png); 같은 페이지를 CDP pipe `Page.captureScreenshot`으로 찍으면 정상(scratchpad/bug/y900.png, 3장 1.4초). brief 항목 변경 없음.

## v1 (추가)
- (계약만, 승인 뒤 dispatch 전) Signatures에 LTT.clock 환경 계약과 `parseChecklist` export를 적었다. 두 역할이 같은 스텁 표면을 쓰게 하려고.
