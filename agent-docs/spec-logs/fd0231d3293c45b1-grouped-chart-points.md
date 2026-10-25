---
version: 3
run_id: fd0231d3293c45b1
status: complete
base_commit: df854350095d30b0843db938d6ea68dc11e26c95
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | user (project owner) | 색·detail로 나눈 선/영역 차트와 facet 차트에도 기준점을 붙인다 (`agent-docs/handoff/307d54f26859f69b-v3-trial-findings.md` Next Step 1) | 그런 차트의 기준점이 그려진 값으로 판정된다. agent가 차트를 layer로 쪼개지 않아도 된다 |
| UI-2 | generating agent | 그룹이 있는 차트에서 `where`를 바로 고친다 | 그룹 필드가 빠지면 빠진 필드 이름이 담긴 Issue가 나온다 |
| UI-3 | user | 검사한 것과 화면에 그려지는 것이 같다 (ADR `ba753ada12166450`) | 그려지지 않은 행(facet 안 로컬 filter로 빠진 행 등)으로는 기준점이 통과하지 않는다 |

# Scope
Baseline: every requirement, Case, quality requirement, and obligation of `agent-docs/spec-logs/6ed8f04e251d4b22-m1-rule-checker.md` v3 stays in force, except the items this spec amends: HTML contract point `mark` clause, FR-8, `RULES` (Signatures), C-25, VO-1 coverage items, VO-5 P8, VO-6 location rule list, and the facet sentence of its Out of scope.
In scope: point evaluation for marks inside Vega-Lite path groups (`color`, `detail`, `strokeDash`, … on line/area/trail), facet operator (`facet` + `spec`), encoding facets (`encoding.column` / `row` / `facet`), facet + layer, and nesting of these; new rule `point-group`.
Out of scope: `repeat` charts; nested field names (`o.g`) in `where` or group fields; numeric-integration models (handoff Next Step 2); SKILL / generation instructions; page JS.

# Paths
Implementation: packages/check/src/
Tests: packages/check/test/
Test command: node --test --experimental-test-coverage --test-coverage-include='packages/check/src/**' --test-coverage-lines=95 --test-coverage-branches=90 --test-coverage-functions=95 'packages/check/test/**/*.test.mjs'
Review evidence: none — 모든 의무를 자동 테스트로 관찰한다
Fuzzing: none — 설치된 fuzz 도구가 없다. 오판 경로는 VO-18(error guessing)이 맡는다
Mutation tool: none — Stryker가 설치되어 있지 않다

# Signatures
```
// packages/check/src/index.mjs — unchanged except:
export const RULES: readonly string[];   // exactly 23 ids: the 22 of the baseline plus "point-group"
```

## HTML contract (amended point `mark` clause)
- `mark` is the `name` of a unit view anywhere in the spec (top-level, `layer`, `concat`/`hconcat`/`vconcat`, the `spec` of a facet operator, or a unit with `encoding.column`/`row`/`facet`).
- Resolution: the compiled Vega mark named `<mark>_marks`, searched recursively through all `marks`; if none exists, the compiled mark named `<mark>_child_marks`. (Vega-Lite 6.5.0 names the child of an unnamed facet operator `f` and of a unit `E` with an encoding facet `f_child_marks` / `E_child_marks`.)
- Rows of a point are the `datum` of every scenegraph item of that mark, over all its instances (every facet cell and every path group), after the View has run with the point's params. These are the rows the page draws from; top-level dataset contents that the mark does not draw are not rows.
- Group fields of a mark: walk the compiled mark's ancestor group marks from outermost to innermost; for each with `from.facet.groupby` (a string counts as a one-element array), append its entries in order, skipping entries already appended. A mark with no such ancestor has no group fields.
- `where` must have an own key for every group field. Other `where` rules are unchanged.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-8 | (replaces baseline FR-8) Point evaluation, for each point of a chart that passed FR-4..FR-6, in array order, each in a fresh `vega.View` (`renderer: "none"`). Checked in this order, each point yields at most one issue: `point-invalid` (unchanged). `point-mark`: resolution per the HTML contract finds no mark; `actual` = `mark`. `point-group`: one or more group fields are not own keys of `where`; `expected` = all group fields in group-field order, `actual` = the missing ones in the same order. `point-param-unknown`, `point-param-range` (unchanged). `chart-build` with `point` (unchanged). `point-row`: number of rows (per HTML contract) matching `where` ≠ 1; `actual` = count. `point-mismatch` (unchanged). A point passing all of them is evaluated with that row value | must | UI-1, UI-2, UI-3 |
| FR-14 | `RULES` contains exactly the 23 ids; `point-group` Issues carry `chart` and `point` | must | UI-2 |

# Errors
- Grouped mark, `where` missing a group field — `point-group` Issue — no View is built for that point; other points continue.
- `where` names a row that exists only in a top-level dataset but is not drawn by the mark — `point-row` actual 0 — not a pass.
- All baseline Errors unchanged.

# Cases
Fixture conventions (in addition to baseline `LIBS`, `LINE(k)`):
- `GROUPS(k, ch)` = `{ "name":"curves", "params":[{"name":"k","value":k,"bind":{"input":"range","min":1,"max":5}}], "data":{"values":[{"x":0,"g":"a"},{"x":1,"g":"a"},{"x":2,"g":"a"},{"x":0,"g":"b"},{"x":1,"g":"b"},{"x":2,"g":"b"}]}, "transform":[{"calculate":"(datum.g==='a'?1:2)*k*datum.x","as":"y"}], "mark":"line", "encoding":{"x":{"field":"x","type":"quantitative"},"y":{"field":"y","type":"quantitative"}, ch:{"field":"g","type":"nominal"}} }` with `ch` ∈ {`color`, `detail`, `strokeDash`}. Arithmetic: `y = (g=a ? 1 : 2)·k·x`.
- `HDATA` = values `[{"x":0,"h":"p"},{"x":1,"h":"p"},{"x":0,"h":"q"},{"x":1,"h":"q"}]` with transform `calculate "(datum.h==='p'?10:20)+datum.x" as "y"`. Arithmetic: `y = (h=p ? 10 : 20) + x`.
- `HGDATA` = values for every `h` ∈ {p,q}, `g` ∈ {a,b}, `x` ∈ {0,1} (8 rows) with `calculate "(datum.h==='p'?10:20)+(datum.g==='a'?1:2)*datum.x" as "y"`.
Facet and color field definitions carry `type`: `nominal` for `h` and `g`, `ordinal` for `x` used as a facet field.
Expected values come from the arithmetic above, not from running the checker.

| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-25 | error | (replaces baseline C-25) point `mark:"nope"` → `point-mark` actual `"nope"`; unit named `f` on `HDATA` (mark point) with `encoding.column` on `h`: point `mark:"f"` `where:{h:"q",x:1}` value 21 tol 0 → pass, and point `mark:"f_child"` with the same where/value → pass | as stated |
| C-60 | normal | `GROUPS(2,"color")`; points `{mark:"curves",where:{x:2,g:"b"},field:"y",value:8,tol:0}` and `{mark:"curves",params:{k:3},where:{x:1,g:"a"},field:"y",value:3,tol:0}` | ok, no errors |
| C-61 | normal | `GROUPS(2,"detail")`, `GROUPS(2,"strokeDash")`, and `GROUPS(2,"color")` with `"mark":"area"`, each with point `where:{x:2,g:"b"}` value 8 tol 0 | ok for each |
| C-62 | normal | facet operator on `HDATA`: `facet:{column:{field:"h"}}`, `spec:{name:"cell",mark:"line",encoding:x,y}`; point `mark:"cell"` `where:{h:"q",x:1}` value 21 tol 0 | ok |
| C-63 | normal | facet operator named `f` on `HDATA` whose `spec` has no name; point `mark:"f"` `where:{h:"p",x:1}` value 11 tol 0 | ok (resolves through `f_child_marks`) |
| C-64 | normal | facet operator on `HGDATA`: `facet:{column:{field:"h"}}`, `spec:{name:"c",mark:"line",encoding:{x,y,color:{field:"g"}}}`; point `where:{h:"q",g:"b",x:1}` value 22 tol 0 | ok |
| C-65 | normal | facet operator on `HDATA` with `facet:{row:{field:"h"},column:{field:"x"}}`, `spec:{layer:[{name:"A",mark:"line",encoding:x,y},{name:"B",mark:"point",transform:[{filter:"datum.y>10"}],encoding:x,y}]}`; point on `A` `where:{h:"p",x:0}` value 10; point on `B` `where:{h:"q",x:0}` value 20, each tol 0 | ok |
| C-66 | error | chart of C-65; point on `B` `where:{h:"p",x:0}` value 10 tol 0 (row exists in the chart data, but `B` filters it out) | `point-row` actual 0 |
| C-67 | error | `GROUPS(2,"color")` point `where:{x:2}` → `point-group` expected `["g"]` actual `["g"]`; chart of C-64 point `where:{x:1}` → expected `["h","g"]` actual `["h","g"]`; same chart `where:{x:1,h:"q"}` → expected `["h","g"]` actual `["g"]` | as stated, each with `chart` and `point` |
| C-68 | error | `GROUPS(2,"color")` point `where:{x:2}`, `params:{zz:1}` → only `point-group`; point `mark:"nope"`, `where:{x:2}` → only `point-mark` | as stated |
| C-69 | edge | `GROUPS(2,"color")` point `where:{x:2,g:"z"}` | `point-row` actual 0 |
| C-70 | edge | facet operator `facet:{column:{field:"g"}}` on the `GROUPS` data and transform, `spec:{name:"c",mark:"line",encoding:{x,y,color:{field:"g"}}}` (same field twice); point `where:{x:1}` | `point-group` expected `["g"]` actual `["g"]` |
| C-71 | edge | chart of C-65 with `HDATA` minus row `{x:1,h:"q"}`; point on `A` `where:{h:"q",x:1}` (empty facet cell) | `point-row` actual 0 |
| C-72 | edge | baseline C-2 (layer with top-level datasets), C-9 (`where:{}` on ungrouped one-row data), and C-28 (line NaN row → `point-mismatch` actual `"NaN"`) | same results as baseline; no `point-group` |
| C-74 | error | missing group field on other grouping structures, each `where` lacking the named field: `GROUPS(2,"detail")` `where:{x:2}` → expected `["g"]`; unit on `HDATA` (mark point) with `encoding.column` on `h`, `where:{x:1}` → expected `["h"]`; chart of C-65 point on `A` `where:{h:"p"}` → expected `["h","x"]` actual `["x"]` | as stated, `point-group` |
| C-75 | error | `GROUPS(2,"color")` with point `a` `where:{x:2}` (→ `point-group`) followed by point `b` `where:{x:2,g:"b"}` value 9 tol 0 | `point-group` for `a`, then `point-mismatch` for `b` expected 9 actual 8 |
| C-73 | edge | `GROUPS(2,"color")` points `where:{x:2,g:"b"}` and `where:{g:"b",x:2}` (key order swapped), value 8 | both pass |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 판정 정확성(그려진 행으로 판정)이 목적이다 |
| Performance efficiency | yes | 행을 scenegraph에서 읽는다. 기존 성능 기준을 유지해야 한다 |
| Compatibility | yes | `_child_marks`, path group 구조는 vega-lite 6.5.0의 내부 이름이다. 버전 고정이 유지되어야 한다 |
| Interaction capability | yes | `point-group`이 빠진 필드를 알려 준다 |
| Reliability | yes | 기존 기준(죽지 않음, 콘솔 출력 없음)이 새 경로에도 적용된다 |
| Security | yes | 새 경로도 네트워크 호출이 없어야 한다(기존 VO-10 유지) |
| Maintainability | yes | 커버리지 기준 유지 |
| Flexibility | no | 다른 라이브러리 이식은 범위 밖 |
| Safety | no | 물리적·인적 위해 경로가 없다 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Functional suitability / functional correctness | baseline FR plus amended FR-8, FR-14 | baseline Cases plus C-25 (new), C-60..C-73 pass | 100%, higher is better | automated VO-1, VO-5, VO-16..VO-18 and baseline VOs; mutation | UI-1, UI-3 |
| QR-2 | Performance efficiency / time behaviour | baseline QR-2 `perf` fixture, plus fixture `perf-group`: `LIBS` + 3 charts of C-64 shape, inline values with `x = i/100` for i = 0..2499 per (h,g) cell (10000 rows per chart, the baseline `perf` row count), 5 points each | wall-clock ms median of 3 CLI runs, this machine | ≤ 5000 ms each, lower is better | automated VO-8 (baseline) and VO-19 | UI-1 |
| QR-3 | Compatibility / interoperability | baseline QR-3 | unchanged | unchanged | automated VO-9 | UI-3 |
| QR-4 | Interaction capability / operability | baseline QR-4 with `point-group` added to the `point-*` location rule | unchanged | 100% of Issues conform | automated VO-6 | UI-2 |
| QR-5 | Reliability / fault tolerance | baseline QR-5, applied to all new Cases | unchanged | 0 rejections, 0 console writes | automated VO-7 and spies in the shared helper | UI-1 |
| QR-6 | Security / resistance | baseline QR-6, plus C-64 point evaluation | unchanged | 0 calls | automated VO-10 | UI-1 |
| QR-7 | Maintainability / testability | `packages/check/src/**` | Test command coverage | lines ≥ 95, branches ≥ 90, functions ≥ 95 | automated VO-11 | project default |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | (amended) FR-8, FR-14, C-67 | baseline VO-1 | baseline | decision table | baseline 22 rule ids plus `point-group` (violating input C-67 first item); `RULES` set-equal to the 23 | 100% | as baseline | node:test |
| VO-5 | (amended) FR-8, C-2, C-3, C-8, C-9, C-25 | mark resolution | integration | equivalence partitioning | P1..P7 as baseline; P8 encoding-facet unit resolves by its own name and by `<name>_child` and passes (C-25), and the same points with value 22 give `point-mismatch` actual 21 | 100% | P1..P6, P8 pass with arithmetic values; P7 `point-mark` | node:test |
| VO-6 | (amended) QR-4 | baseline VO-6, Reports of VO-16..VO-19 included | baseline | decision table | baseline items with `point-group` in the `point-*` location rule | 100% | as baseline | node:test shared helper |
| VO-16 | FR-8, C-60..C-65 | grouped and faceted mark structures | integration; one input per item | equivalence partitioning | Q1 color line, Q2 param change on grouped line, Q3 detail, Q4 strokeDash, Q5 color area, Q6 facet operator named child, Q7 facet operator unnamed child, Q8 facet + color nested, Q9 facet + layer (2-D facet), Q10 point layer with local filter inside facet | 100% | each point passes with the arithmetic value | node:test |
| VO-17 | FR-8, Errors, C-67, C-68, C-70, C-73, C-74, C-75 | `point-group` decision | integration | decision table | D1 single group field missing, D2 nested both missing, D3 nested one missing (order kept), D4 duplicate group field deduplicated, D5 `point-mark` precedes `point-group`, D6 `point-group` precedes `point-param-unknown`, D7 all present in any key order → no `point-group`, D8 other structures (C-74), D9 later point still evaluated (C-75) | 100% | exact `expected`/`actual` arrays and single issue per point | node:test |
| VO-18 | FR-8, UI-3, C-66, C-69, C-71, C-72 | wrong-pass guards and regression | integration | error guessing | G13 row filtered out by a facet-local transform, G14 empty facet cell, G15 group value that does not exist, G16 baseline C-2 / C-9 / C-28 unchanged | none — experience-based | G13..G15 `point-row` actual 0; G16 as baseline | node:test |
| VO-10 | (amended) QR-6, C-64 | baseline VO-10 | baseline | equivalence partitioning | N1..N4 as baseline, N5 C-64 point evaluation | 100% | 0 recorded calls; N5 report ok | node:test |
| VO-19 | QR-2 | CLI on `perf-group` | end-to-end; 3 runs | none — non-functional measurement | M2 median wall-clock | 100% | median ≤ 5000 ms | node:test measuring `performance.now()` around `spawnSync` |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| B-1 | 행은 mark의 scenegraph item `datum`에서 읽는다 (handoff의 "부모 group의 `from.facet.data`를 따라 top-level dataset" 방향 대신) | vega-lite 6.5.0: facet + layer는 cell group 안에 top-level과 같은 이름(`data_0`)의 로컬 dataset을 만들고 로컬 filter를 건다. top-level에서 읽으면 그려지지 않은 행으로 통과한다. scenegraph 탐침: color line, facet+color, 로컬 filter, point NaN 제외, bar 집계 필드가 기대대로 나왔다 | user answer |
| B-2 | facet(operator, encoding facet, layer 포함)까지 지원 | 사용자 선택. baseline C-25, VO-5 P8, Out of scope 문장 갱신 | user answer |
| B-3 | `where`에 그룹 필드를 강제하고 새 rule `point-group`을 둔다 | 시험 생성에서 같은 실패 5회 반복; 빠진 필드를 직접 알려 준다 | user answer |
| B-4 | `<mark>_marks`가 없으면 `<mark>_child_marks`로 찾는다 | encoding facet unit과 이름 없는 facet child의 컴파일 이름. 내부 이름이라 버전 고정(baseline A-9)으로 묶는다. `f_child`도 같은 mark로 풀린다 | user answer |
| B-5 | `point-group`: `expected` = 전체 그룹 필드, `actual` = 빠진 필드. 순서 바깥 group → 안쪽, 중복 제거. 검사 순서 `point-mark` 다음 | 고칠 필드를 바로 보여 주고 결정적 순서를 준다 | brief v1 — approved |
| B-6 | `point-mark`은 "mark 없음"만 뜻한다. top-level dataset 조건은 없앤다 | B-1에서 dataset 이름이 필요 없어진다 | user answer |
| B-7 | `repeat`, 중첩 필드는 범위 밖 | `repeat`는 `R_child__y_marks` 식 이름이라 별도 이름 규칙이 필요하다. 중첩 필드는 groupby가 `o\\.g`로 escape된다 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-8 | C-25, C-60..C-75, baseline FR-8 Cases | VO-1, VO-5, VO-16, VO-17, VO-18, baseline VO-2, VO-12 | node:test |
| FR-14 | C-67 | VO-1, VO-6 | node:test |
| QR-1 | C-25, C-60..C-75 | VO-1, VO-5, VO-16..VO-18 | node:test |
| QR-2 | — | VO-8, VO-19 | node:test |
| QR-3 | — | VO-9 | node:test |
| QR-4 | C-67, C-68, C-70 | VO-6 | node:test |
| QR-5 | C-60..C-73 | VO-7, shared helper spies | node:test |
| QR-6 | C-64 | VO-10 | node:test |
| QR-7 | — | VO-11 | Test command |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 2 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1, VO-5, VO-6, VO-10 | 3 | `vo01-rules`, `vo05-marks`, `fixtures/report.mjs` (RULE_IDS 23) | accepted | amended by this spec | baseline accepted at 6ed8f04e251d4b22 v3 |
| VO-16..VO-19 | 3 | `vo16`..`vo19` test files, `fixtures/grouped.mjs` | accepted | new | — |
| baseline VO-2..VO-4, VO-7..VO-15 | 3 | tests unchanged; pass in runs 2–3 | accepted | FR-8 row source changed (B-1); unchanged tests re-run green; verifier 2 retained | `packages/check/src/chart.mjs` |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | Test command run 1: 116/117; VO-19 M2 median 8061 ms under the parallel suite (alone: pass, ~4.5 s per run) | spec gap: QR-2 `perf-group` read as 40000 inline rows per chart (4× baseline `perf`). Profile: Ajv schema compile 0.9 s, each View run ~110 ms × 6 per chart; scenegraph row walk < 1 ms, so the row-source change is not the cost | spec v2 sets 10000 rows per chart; test fixture resized; implementation unchanged | Test command runs 2–3 (main): 117/117, cov 99.83/98.14/100, VO-19 median 3.3–3.4 s. One test-implementer run had VO-8 M1 median 6001 ms while other suites ran concurrently; main measured VO-8 alone with base `chart.mjs` 5.68/5.72 s and with the new one 5.50/5.58 s total for 3 runs (no regression). Advisory AD-1: perf tests share CPU with the parallel suite |
| 2 | verifier 1: F-1 QR-6 "plus C-64" unobserved in VO-10; F-2 D1 later point is correct so skipped vs evaluated is indistinguishable; AD-2 P8 no negative control; AD-3 `point-group` only observed on color line / operator facet | evidence gaps (F-1, F-2); spec Cases missing for other grouping structures (AD-3) | spec v3: VO-10 N5, C-74 (D8), C-75 (D9), P8 negative control; tests only, implementation unchanged | Test command 121/121, cov 99.83/98.13/100. Hand mutations (main, one at a time, seed.py backup/restore), all detected by the intended assertion: M1 rows via `view.data(mark.from.data)` → Q10 (in the layered facet `view.data("data_0")` returns the last cell's local dataset `[{x:1,h:"q",y:21}]`, so the baseline code read wrong rows there); M2 no `_child_marks` fallback → P8, Q7, D8; M3 skip point-group → D1..D9; M4 no dedupe → D4; M5 inner-first → D2, D3; M6 actual = all fields → D3, D8; M7 first group instance only → Q/D/N5/M2; M8 abort chart after point-group → D9; M9 RULES lacks point-group → VO-1; M10 point-group after params → D6; M11 fetch on grouped path → N5. Chosen as the defect classes FR-8, FR-14, QR-6 forbid: row source, mark resolution, group-field order/dedupe/subset, precedence, continuation, rule registry, network |
| 3 | verifier 2 | — | — | pass; F-1, F-2, AD-2, AD-3 closed; advisory AD-1 (perf tests share CPU with the parallel suite) left open, non-blocking |

# Version Log
## v1
- Initial draft from handoff `307d54f26859f69b` Next Step 1 and user answers (facet 포함, `where` 그룹 필드 강제, scenegraph 행 출처) on 2026-10-24/25.

## v2
- [contract-only] QR-2 `perf-group` row count fixed to 10000 per chart (test run 1: 40000-row reading exceeded 5000 ms under suite load; profile shows View runs, not the scenegraph walk, dominate). Fixture field `type`s stated (test-implementer challenge).

## v3
- [contract-only] VO-10 lists N5 (C-64) for QR-6 (verifier 1 F-1). C-75 / VO-17 D9 distinguish a skipped later point (F-2). C-74 / VO-17 D8 observe `point-group` on detail, encoding facet, and 2-D facet (AD-3). VO-5 P8 adds a negative control (AD-2).
