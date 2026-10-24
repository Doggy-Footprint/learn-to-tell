---
version: 3
run_id: 6ed8f04e251d4b22
status: complete
base_commit: 75c650b975a047c9418757589b367afa3827e0e9
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | user (project owner) | 그래프·차트·퀴즈 정답처럼 rule로 검증할 수 있는 대상을 프로그램이 판정한다 (`plan.md` What I want 3, 구조 표) | agent가 쓴 HTML 한 장을 넣으면 LLM 없이 통과/실패 JSON이 나온다 |
| UI-2 | generating agent | 실패를 보고 바로 고친다 | 각 실패가 rule id, 차트·기준점·퀴즈 id, 기대값, 실제값을 담는다 |
| UI-3 | user | 검사한 것과 화면에 그려지는 것이 같다 (`agent-docs/adr/ba753ada12166450-vega-lite-rule-check.md`) | 검사기는 페이지와 같은 Vega/Vega-Lite 버전과 같은 spec JSON을 쓴다. 버전이 다르면 실패한다 |
| UI-4 | user | artifact 제약을 지킨다 (`plan.md` 제공 환경 제약) | 외부 `url` 데이터와 허용되지 않은 출처의 Vega 스크립트는 실패한다. 검사기는 네트워크에 접속하지 않는다 |

# Scope
In scope: Node ESM 모듈 `checkHtml(html)`과 CLI `ltt-check`. HTML 계약(차트 script 태그, `usermeta.ltt.points`, 퀴즈 data attribute)을 읽고 아래 RULES를 판정한다. 루트 `package.json`과 lock 파일.
Out of scope: 테마·SKILL 지시문(마일스톤 2), 서브에이전트 검증·스크린샷(3), 비용 측정(4), claude.ai 실행·오프라인 번들(5). 화면 배치 검사. 페이지 JS를 실행하는 것, 페이지 JS가 data attribute 정답으로 실제 채점하는지 확인하는 것. facet(행·열 분할) 차트의 기준점 검사. ESM `import`로 불러온 Vega 스크립트 인식.

# Paths
Implementation: package.json, package-lock.json, packages/check/src/, packages/check/bin/ltt-check.mjs
Tests: packages/check/test/
Test command: node --test --experimental-test-coverage --test-coverage-include='packages/check/src/**' --test-coverage-lines=95 --test-coverage-branches=90 --test-coverage-functions=95 'packages/check/test/**/*.test.mjs'
Review evidence: none — 모든 의무를 자동 테스트로 관찰한다
Fuzzing: none — 설치된 fuzz 도구가 없다. 깨진 입력에 대한 내성은 VO-7(error guessing)이 맡는다
Mutation tool: none — Stryker가 설치되어 있지 않다

# Signatures
```
// packages/check/src/index.mjs (ESM)
export const VEGA_VERSION = "6.4.0";
export const VEGA_LITE_VERSION = "6.5.0";
export const RULES: readonly string[];            // exactly the 22 rule ids in FR-4..FR-11, any order
export async function checkHtml(html: string): Promise<Report>;   // never rejects for any string input

type Report = {
  ok: boolean;                                    // ok === (errors.length === 0)
  summary: { charts: number; points: number; quizzes: number; unchecked: number };
  errors: Issue[];
  unchecked: { quiz: string; reason: "no-from" | "linked-point-unevaluated" }[];
};
type Issue = {
  rule: string;                                   // ∈ RULES
  message: string;                                // English, 1..300 chars
  chart?: string; point?: string; quiz?: string; src?: string;
  expected?: unknown; actual?: unknown;           // JSON-serializable
};

// packages/check/bin/ltt-check.mjs
// usage: node packages/check/bin/ltt-check.mjs <file.html>
// exit 0: report.ok; exit 1: !report.ok; exit 2: missing argument or unreadable file
// stdout (exit 0/1): JSON.stringify(report, null, 2) + "\n"; stderr empty
// exit 2: stdout empty; stderr one line starting "ltt-check: "
```

## HTML contract

Chart:
```
<script type="application/json" data-ltt-chart="<chart-id>"> <Vega-Lite spec JSON> </script>
```
- id pattern `^[A-Za-z][A-Za-z0-9_-]*$` (no `.`; `.` separates chart and point in `data-from`).
- Reference points live in the spec: `usermeta.ltt.points` (array). Each point:
  `{ "id": string(id pattern), "mark": string, "params"?: object, "where": object, "field": string, "value": finite number, "tol": finite number >= 0 }`
  - `mark` is the `name` of a unit view (top-level, inside `layer`, or inside `concat`/`hconcat`/`vconcat`). It resolves to the compiled Vega mark named `<mark>_marks` (searched recursively). Its dataset is that mark's `from.data`, which must name a top-level Vega dataset.
  - `params` maps top-level Vega-Lite param names (params without `select`) to values. Omitted params keep their spec defaults.
  - `where` maps dataset field names to values. A row matches when every entry matches: numbers match when `|row[f] - w| <= 1e-9 * max(1, |w|)`; other values match by `===`. An empty `where` matches every row.

Quiz:
```
<any data-ltt-quiz="<quiz-id>" data-kind="choice"> ... <any data-ltt-option [data-correct]> ... </any>
<any data-ltt-quiz="<quiz-id>" data-kind="number" data-answer="<number>" data-tol="<number>" [data-from="<chart-id>.<point-id>"]>
```
- Options of a quiz are descendants with `data-ltt-option` whose nearest `data-ltt-quiz` ancestor is that quiz.
- `data-correct` counts by presence (HTML boolean attribute), whatever its value.

Library scripts: every `<script src>` is classified. Recognized forms, with `<pkg>` ∈ {`vega`, `vega-lite`}:
- `https://cdnjs.cloudflare.com/ajax/libs/<pkg>/<ver>/<file>`
- `https://cdn.jsdelivr.net/npm/<pkg>@<ver>` optionally followed by `/...`; `https://cdn.jsdelivr.net/npm/<pkg>` (no `@`) has version `""`
- `https://unpkg.com/<pkg>@<ver>` optionally followed by `/...`; `https://unpkg.com/<pkg>` has version `""`
- Any other src whose URL path has a segment matching `^(vega|vega-lite)([@.].*)?$` is an unrecognized Vega source. `vega-embed` and other packages are ignored.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `checkHtml` parses the HTML (parse5) and returns a Report per Signatures. `summary.charts` = number of elements with `data-ltt-chart`; `summary.points` = sum of `usermeta.ltt.points` array lengths over charts whose JSON parsed to an object; `summary.quizzes` = number of elements with `data-ltt-quiz`; `summary.unchecked` = `unchecked.length`. The same input yields a byte-identical `JSON.stringify` of the report. Issues are ordered: library issues (script document order), then charts in document order (chart-level issues, then points in array order), then quizzes in document order | must | UI-1, UI-2 |
| FR-2 | Library rules (page-level, only when `summary.charts >= 1` for `lib-missing`; `lib-version`/`lib-source` always). `lib-version`: a recognized `vega` or `vega-lite` src whose version ≠ the pinned constant; `src`, `expected` = pinned, `actual` = parsed version string. `lib-source`: an unrecognized Vega source; `src`. `lib-missing`: page has a chart but no recognized src for `vega` (and/or `vega-lite`); one issue per missing package, `actual` = package name. A recognized src with the wrong version still counts as present | must | UI-3, UI-4 |
| FR-3 | No network: the checker never calls `fetch`, `http`, or `https`. `chart-url` is decided before any compile or View creation, and a chart with `chart-url` is never built | must | UI-4 |
| FR-4 | Chart identity. `chart-json`: element is not `<script>` with `type` equal (case-insensitive) to `application/json`, or its text is not JSON, or the JSON is not an object; `chart`. `chart-id`: id does not match the pattern, or repeats an earlier chart id; `chart`, `actual` = id. Both are reported when both apply. A chart with either issue is not checked further and is unavailable to `data-from`. For `summary.points`, only `<script type="application/json">` charts are parsed | must | UI-1 |
| FR-5 | Chart spec. `chart-url`: any object anywhere in the spec that is the value of a key `data` and has an own property `url`; one issue per chart. `chart-schema`: the spec fails Ajv 8 validation against `vega-lite/build/vega-lite-schema.json` of the pinned version; `actual` = first ≤5 Ajv errors as `{instancePath, message}`. Both are reported when both apply. If either applies, the chart is not built and its points are not evaluated | must | UI-1, UI-3, UI-4 |
| FR-6 | `chart-build`: Vega-Lite `compile`, `vega.parse`, or `runAsync` with default params throws/rejects; `chart`, `actual` = error message. Also emitted with `point` when building or running the View for a point rejects. A chart with a default-build failure has no points evaluated | must | UI-1 |
| FR-7 | `chart-no-points`: `usermeta.ltt.points` is missing, not an array, or empty (checked for every chart that passed FR-4, independent of FR-5/FR-6) | must | UI-1 |
| FR-8 | Point evaluation, for each point of a chart that passed FR-4..FR-6, in array order, each in a fresh `vega.View` (`renderer: "none"`). `point-invalid`: point is not an object, or `id` missing/not matching pattern/duplicate in the chart, or `mark`/`field` not a non-empty string, or `where` not a plain object, or `params` present and not a plain object, or `value` not a finite number, or `tol` not a finite number ≥ 0; `point` = id when it is a string, `actual` = array index. `point-mark`: no compiled mark named `<mark>_marks`, or its `from.data` does not name a top-level dataset. `point-param-unknown`: a `params` key is not a top-level non-selection param; `actual` = key. `point-param-range`: the param has `bind.input === "range"` with numeric `min`/`max` and the value is not a number in `[min, max]`; `expected` = `[min, max]`, `actual` = value. `point-row`: number of matching rows ≠ 1; `actual` = count. `point-mismatch`: the matched row's `field` value is not a finite number, or `|actual - value| > tol`; `expected` = value, `actual` = row value if finite number, else `String(row value)`. Each point yields at most one of these issues, checked in the order listed; a point passing all of them is evaluated with that row value | must | UI-1, UI-2 |
| FR-9 | Quiz identity. `quiz-id`: id not matching the pattern or repeating an earlier quiz id; `quiz`, `actual` = id. `quiz-kind`: `data-kind` missing or not `choice`/`number`; `actual` = value or `null`. A quiz with either issue is not checked further | must | UI-1 |
| FR-10 | Choice quiz. `quiz-options`: fewer than 2 options; `actual` = count. `quiz-correct`: number of options with `data-correct` ≠ 1; `actual` = count. Both may be reported | must | UI-1 |
| FR-11 | Number quiz. `quiz-answer`: `data-answer` missing, empty after trim, or `Number(trimmed)` not finite; or `data-tol` missing, empty, not finite, or < 0; one issue per quiz. If valid and `data-from` is absent → `unchecked` `{quiz, reason: "no-from"}`. `quiz-from`: `data-from` does not split by `.` into exactly two non-empty parts, or names no chart that passed FR-4, or names no point id in that chart's points; `actual` = attribute value. A point is evaluated when it reached the row comparison of FR-8 with a finite-number row value (a point with `point-mismatch` for a finite row value counts as evaluated). If the point exists but was not evaluated → `unchecked` `{quiz, reason: "linked-point-unevaluated"}`, no issue. Otherwise `quiz-mismatch` when `|answer - pointRowValue| > tol`; `expected` = point row value, `actual` = answer | must | UI-1, UI-2 |
| FR-12 | CLI per Signatures. Reads the file as UTF-8 and prints the report of `checkHtml` | must | UI-2 |
| FR-13 | Root `package.json`: `"private": true`, `"type": "module"`, dependencies with exact versions (no range operator) `vega` 6.4.0 and `vega-lite` 6.5.0, plus `ajv` ^8 and `parse5` ^8. `engines.node` `>=22` | must | UI-3 |

# Errors
- Any string input, including empty or non-HTML text — `checkHtml` resolves a Report; problems appear only as Issues — no throw, no rejection, no output on stdout/stderr from the module.
- Malformed chart JSON / spec / point / quiz — corresponding Issue per FR-4..FR-11 — remaining charts, points and quizzes are still checked.
- Vega-Lite compile or Vega runtime error — `chart-build` Issue — the View is finalized; other charts continue.
- Data `url` in spec — `chart-url` Issue — no View created, zero network calls.
- CLI without argument or with unreadable path — exit 2, one stderr line prefixed `ltt-check: `, empty stdout — no report.
- Ajv format warnings — suppressed (no console output).

# Cases
Fixture conventions: `LIBS` = `<script src="https://cdn.jsdelivr.net/npm/vega@6.4.0"></script><script src="https://cdn.jsdelivr.net/npm/vega-lite@6.5.0"></script>`. `LINE(k)` = chart spec `{ "name": "curve", "params": [{"name":"k","value":k,"bind":{"input":"range","min":1,"max":5}}], "data": {"sequence": {"start":0,"stop":4,"step":1,"as":"x"}}, "transform": [{"calculate":"k*datum.x","as":"y"}], "mark":"line", "encoding": {"x":{"field":"x","type":"quantitative"},"y":{"field":"y","type":"quantitative"}}, "usermeta": {"ltt": {"points": [...]}} }`. Expected values come from arithmetic (`y = k*x`), not from running the checker.

| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | `LIBS` + chart `traj` = `LINE(2)` with points `{id:"p1",mark:"curve",where:{x:3},field:"y",value:6,tol:0}` and `{id:"p2",mark:"curve",params:{k:4},where:{x:2},field:"y",value:8,tol:0}`; choice quiz `q1` with 3 options, one `data-correct`; number quiz `q2` `data-answer="8" data-tol="0" data-from="traj.p2"` | `ok: true`, `errors: []`, `unchecked: []`, `summary {charts:1, points:2, quizzes:2, unchecked:0}` |
| C-2 | normal | layer spec: inline values `[{c:"a",v:1},{c:"a",v:2},{c:"b",v:5}]`, layer `bars` (bar, y `aggregate:"sum"` of `v`) and layer `curve` (sequence + calculate). Points `{mark:"bars",where:{c:"a"},field:"sum_v",value:3,tol:0}` and one on `curve` | ok, no errors |
| C-3 | normal | `hconcat` of two unit views named `left`, `right`, a point on each | ok |
| C-4 | normal | C-1 plus number quiz `q3` with valid answer/tol and no `data-from` | ok; `unchecked: [{quiz:"q3",reason:"no-from"}]`, `summary.unchecked: 1` |
| C-5 | normal | plain HTML with text only, no scripts | ok; all summary counts 0; no `lib-missing` |
| C-6 | normal | CLI on a file with C-1 content | exit 0; stdout parses to a report deep-equal to `checkHtml(C-1)`; stderr empty |
| C-7 | normal | chart page loading libs via (a) cdnjs `https://cdnjs.cloudflare.com/ajax/libs/vega/6.4.0/vega.min.js` + `.../vega-lite/6.5.0/vega-lite.min.js`, (b) unpkg `https://unpkg.com/vega@6.4.0` + `https://unpkg.com/vega-lite@6.5.0/build/vega-lite.min.js`, plus `https://cdn.jsdelivr.net/npm/vega-embed@6.0.0` | no `lib-*` issue in (a) or (b) |
| C-8 | normal | point without `params` on `LINE(3)`, `where:{x:3}`, value 9 (the sequence `stop` is exclusive: x ∈ {0,1,2,3}) | passes (default k used) |
| C-9 | normal | `where:{}` on a dataset with exactly one row (inline values `[{v:7}]`, unit named `one`) | passes with `field:"v",value:7,tol:0` |
| C-10 | boundary | `LINE(2)`, `where:{x:3}`: value 6.5 tol 0.5 → pass; value 6.5 tol 0.49 → `point-mismatch` expected 6.5 actual 6 | as stated |
| C-11 | boundary | `tol: 0` with exact value 6 → pass | pass |
| C-12 | boundary | `LINE(2)` param `k` bound `[1,5]`: params `{k:1}` and `{k:5}` → no range issue; `{k:0.999}` and `{k:5.001}` → `point-param-range` expected `[1,5]` | as stated |
| C-13 | boundary | sequence `start 0, stop 1, step 0.1` (accumulated floats), calculate `y = 10*datum.x`; `where:{x:0.3}` → exactly 1 row (value 3, tol 1e-9 passes); `where:{x:0.3001}` → `point-row` actual 0 | as stated |
| C-14 | boundary | choice quiz with exactly 2 options, 1 correct → no issue; 1 option with `data-correct` → `quiz-options` actual 1 | as stated |
| C-15 | boundary | number quiz linked to C-1 `p2` (row value 8): answer 8.5 tol 0.5 → pass; answer 8.5 tol 0.49 → `quiz-mismatch` expected 8 actual 8.5 | as stated |
| C-20 | error | three charts: `a` text `{bad json`; `b` JSON `[1,2]`; `c` is `<div data-ltt-chart="c">`; `d` valid `LINE(2)` with one passing point | `chart-json` for a, b, c; no issue for d |
| C-21 | error | chart ids `1x` (invalid) and two charts both `dup` | `chart-id` for `1x` and for the second `dup`; first `dup` checked normally |
| C-22 | error | `LINE(2)` with `"mark":"barz"` and one point | `chart-schema` with non-empty `actual`; no `point-*` or `chart-build` issue for it |
| C-23 | error | (a) top-level `data:{url:"data.csv"}`; (b) layer with `data:{url:"https://x/y.json"}`; (c) `lookup` transform `from:{data:{url:"z.csv"},key:"k",fields:["f"]}` — each in a separate chart, with `globalThis.fetch` replaced by a recording stub | one `chart-url` per chart; no `chart-build`/`point-*`; fetch stub call count 0 |
| C-24 | error | `LINE(2)` with transform `calculate: "foo(datum.x)"` | `chart-build` with `actual` containing `foo` |
| C-25 | error | point `mark:"nope"` → `point-mark`; spec with `encoding.column` facet named `f`, point `mark:"f"` and point `mark:"f_child"` → `point-mark` for both | as stated |
| C-26 | error | point `params:{zz:1}` → `point-param-unknown` actual `"zz"`; spec with selection param `{name:"sel",select:"interval"}` and point `params:{sel:1}` → `point-param-unknown` actual `"sel"` | as stated |
| C-27 | error | `LINE(2)` `where:{x:9}` → `point-row` actual 0; inline values `[{x:1,y:2},{x:1,y:3}]` `where:{x:1}` → `point-row` actual 2 | as stated |
| C-28 | error | `LINE(2)` with `field:"nofield"` → `point-mismatch` actual `"undefined"`; `LINE(2)` with calculate `sqrt(-1)` as `y` (line marks keep NaN rows; point/bar marks drop them) → `point-mismatch` actual `"NaN"` | as stated |
| C-29 | error | points: `null`; missing `tol`; `tol:-1`; `value:"6"`; `where:[1]`; `params:"k"`; id `"9a"`; two points with id `p` (second flagged); `mark:""` | `point-invalid` for each listed point (actual = its index); other valid points in the same chart still evaluated |
| C-30 | error | charts with `usermeta` absent; `usermeta.ltt.points: {}`; `points: []` | `chart-no-points` each |
| C-31 | error | `<script src="https://cdn.jsdelivr.net/npm/vega-lite@6.4.0">` → `lib-version` expected `"6.5.0"` actual `"6.4.0"`; `.../npm/vega-lite` → actual `""`; `.../npm/vega-lite@6` → actual `"6"`; cdnjs vega `6.3.0` → `lib-version` for vega | as stated; no `lib-missing` for a package present with a wrong version |
| C-32 | error | `<script src="https://example.com/js/vega-lite.min.js">`, `<script src="https://example.com/vega@6.4.0/vega.js">`, and relative `<script src="vendor/vega-lite.min.js">` | `lib-source` each with `src` |
| C-33 | error | a valid chart and only `vega-embed` script | `lib-missing` ×2, actuals `"vega"` and `"vega-lite"` |
| C-34 | error | quiz id `"bad id"`; two quizzes `q`; `data-kind` absent; `data-kind="text"` | `quiz-id` ×2 (`bad id`, second `q`), `quiz-kind` actual `null` and `"text"` |
| C-35 | error | choice quiz with 3 options and 0 correct; another with 2 correct | `quiz-correct` actual 0 and 2 |
| C-36 | error | number quizzes: `data-answer="abc"`; `data-answer="  "`; `data-answer` absent; `data-tol="-1"`; `data-tol` absent | `quiz-answer` each |
| C-37 | error | `data-from` values `nochart.p1`, `traj.nopoint`, `traj`, `traj.p1.x`, `.p1` | `quiz-from` each, actual = attribute value |
| C-38 | error | CLI with no argument; CLI with nonexistent path | exit 2, stdout empty, stderr one line starting `ltt-check: ` |
| C-39 | error | CLI on a file whose report has errors (C-24) | exit 1; stdout JSON with `ok:false` |
| C-40 | error | `LINE(2)` with transform `calculate: "datum.nope.a"` (passes `vega.parse`, fails while the dataflow evaluates) and one point | `chart-build` for the chart without `point`; no `point-*` issue |
| C-41 | error | `LINE(2)` with transform `calculate: "k > 3 ? datum.nope.a : k*datum.x"`; point `a` `params:{k:4}` and point `b` without params `where:{x:3}` value 6 | `chart-build` with `point:"a"`; no issue for `b` |
| C-42 | error | valid chart whose id is `"c"` followed by 400 `x` characters, with one point whose value is wrong | the `point-mismatch` Issue has a message of at most 300 characters |
| C-43 | error | page with `<script src="https://cdn.jsdelivr.net/npm/vega-lite@6.4.0">` placed at the end of `<body>` (after all charts and quizzes), plus `vega@6.4.0` in `<head>`, a chart `t` with a mismatching point, and a choice quiz `qa` with 0 correct | issue order exactly: `lib-version` (vega-lite), `point-mismatch` (t), `quiz-correct` (qa) |
| C-44 | error | `<div data-ltt-chart="1x">{}</div>` | both `chart-json` and `chart-id` for `1x`, in that order |
| C-45 | error | spec with `"mark":"barz"` and `data:{url:"d.csv"}` and one point | both `chart-url` and `chart-schema`, in that order; no `chart-build` |
| C-46 | edge | C-1 chart with `type="Application/JSON"` | no `chart-json`; points evaluated as in C-1 |
| C-47 | error | page without any chart, with `<script src="https://cdn.jsdelivr.net/npm/vega-lite@6.4.0">` and `<script src="https://example.com/vega.js">` | `lib-version` and `lib-source`; no `lib-missing` |
| C-48 | error | `LINE(2)` point with `params` key of 400 `z` characters | `point-param-unknown` whose message is 1..300 characters |
| C-50 | edge | quiz `outer` (choice) contains 2 own options (1 correct) and a nested quiz `inner` (choice) with 2 options (1 correct) | no issue; outer counts only its own 2 options |
| C-51 | edge | number quiz `data-from="bad.p1"` where chart `bad` fails `chart-schema` and declares point `p1`; another linked to point `p9` that is `point-invalid` (e.g. missing tol) in a valid chart | no quiz issue; `unchecked` entries with reason `linked-point-unevaluated` |
| C-52 | edge | number quiz linked to a point that has `point-mismatch` (row value 6, declared 7) | quiz compared against row value 6, not 7 |
| C-53 | edge | inputs `""`, `"not html at all {"`, unclosed tags `<div data-ltt-quiz="q" data-kind="choice"><p>` | each resolves; `""` → ok with zero counts; unclosed → `quiz-options` actual 0 and `quiz-correct` actual 0 |
| C-54 | edge | same page as C-1 with point order reversed and with chart order swapped against a second chart | the set of issues (ignoring order) is identical, and points pass identically (fresh View per point) |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 판정 정확성이 이 모듈의 목적이다 |
| Performance efficiency | yes | agent가 생성 중 실행하고 기다린다. 1.5배 비용 구간 안이다 |
| Compatibility | yes | 검사와 페이지 렌더가 같은 Vega/Vega-Lite 버전이어야 한다 |
| Interaction capability | yes | 보고를 agent가 읽고 고친다. 위치와 기대/실제값이 필요하다 |
| Reliability | yes | 깨진 HTML·JSON이 정상 입력이다. 죽으면 안 된다 |
| Security | yes | 검사기는 네트워크에 접속하지 않는다(외부 데이터 요청 차단) |
| Maintainability | yes | rule 추가·버전 갱신이 이어진다. 커버리지로 측정한다 |
| Flexibility | no | 다른 라이브러리·환경으로의 이식은 이번 범위가 아니다(마일스톤 5) |
| Safety | no | 물리적·인적 위해 경로가 없다 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Functional suitability / functional correctness | every rule and contract clause in FR-1..FR-13 | Cases C-1..C-54 pass; ratio of RULES ids with a triggering and a clean case | 100%, higher is better | automated VO-1..VO-6, VO-12, VO-13; mutation | UI-1 |
| QR-2 | Performance efficiency / time behaviour | CLI on fixture `perf`: `LIBS` + 3 charts each `LINE(2)`-style with sequence `stop 100 step 0.01` and 5 points, + 4 quizzes (2 linked) | wall-clock ms of `node packages/check/bin/ltt-check.mjs perf.html`, median of 3 runs, this machine (measured baseline of an equivalent probe: 1300 ms) | ≤ 5000 ms, lower is better | automated VO-8 | UI-1, `plan.md` 비용 |
| QR-3 | Compatibility / interoperability | installed `vega` and `vega-lite` vs exported constants and `package.json` | `node_modules/<pkg>/package.json` version string equality; `package.json` dependency string equality | `vega` = `VEGA_VERSION` = `"6.4.0"`, `vega-lite` = `VEGA_LITE_VERSION` = `"6.5.0"`, exact | automated VO-9 | UI-3 |
| QR-4 | Interaction capability / operability (actionable report) | every Issue produced anywhere in the suite | per Issue: `rule ∈ RULES`; message length 1..300; location fields present: `chart` for `chart-*` and `point-*`, `point` for `point-*` except `point-invalid` with non-string id, `quiz` for `quiz-*`, `src` for `lib-version`/`lib-source`; `JSON.stringify(report)` round-trips | 100% of Issues conform | automated VO-6 | UI-2 |
| QR-5 | Reliability / fault tolerance | VO-7 guessed-defect inputs and all error Cases | `checkHtml` resolves (no rejection); no stdout/stderr output from the module during the call (console spies applied to every `checkHtml` call in the suite, including all error Cases); CLI exit ∈ {0,1} for readable files | 0 rejections, 0 console writes | automated VO-7 | UI-1 |
| QR-6 | Security / resistance (no network) | C-23 inputs and C-1 point evaluation | count of calls to a recording `globalThis.fetch` stub and to `http.request`/`https.request`/`http.get`/`https.get` spies during `checkHtml` | 0 calls | automated VO-10 | UI-4 |
| QR-7 | Maintainability / testability | `packages/check/src/**` | Node test runner coverage via Test command: line %, branch %, function % | lines ≥ 95, branches ≥ 90, functions ≥ 95 | automated VO-11 | project default |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-2, FR-4..FR-11, C-20..C-37 | `checkHtml` report; one clean base page (C-1) mutated by exactly one violation per rule | integration (module API); one violating input per rule from the listed Case, plus the clean base | decision table | the 22 rule ids: lib-version, lib-source, lib-missing, chart-json, chart-id, chart-schema, chart-url, chart-build, chart-no-points, point-invalid, point-mark, point-param-unknown, point-param-range, point-row, point-mismatch, quiz-id, quiz-kind, quiz-options, quiz-correct, quiz-answer, quiz-from, quiz-mismatch; and `RULES` equals this set | 100% | violating input yields an Issue with that rule and the Case's expected location/expected/actual; clean base yields no Issue; `RULES` set-equal to the list | node:test |
| VO-2 | FR-8, FR-10, FR-11, C-10..C-15 | point tolerance, bind range, where float match, option count, quiz tolerance | integration; 2-value boundary per item, values as listed in Cases | boundary value analysis (2-value) | B1 point tol (C-10, C-11), B2 bind min, B3 bind max (C-12), B4 where float (C-13), B5 option count 2/1 (C-14), B6 quiz tol (C-15) | 100% | on-boundary passes, off-boundary yields the stated Issue | node:test |
| VO-3 | FR-2, C-7, C-31..C-33 | `<script src>` classification | integration; one input per listed form | syntax testing | S1 cdnjs pinned, S2 jsDelivr pinned, S3 unpkg pinned, S4 wrong version, S5 no version, S6 partial version, S7 other host vega-lite file, S8 other host `vega@` segment, S9 vega-embed ignored, S10 chart without libs | 100% | as in Cases | node:test |
| VO-4 | FR-12, C-6, C-38, C-39 | CLI process | end-to-end; spawn `node packages/check/bin/ltt-check.mjs` | scenario testing | SC1 ok file, SC2 failing file, SC3 no arg, SC4 missing file | 100% | exit code, stdout JSON/empty, stderr empty/one prefixed line | node:test with `child_process` |
| VO-5 | FR-8, C-2, C-3, C-8, C-9, C-25 | mark resolution and dataset | integration | equivalence partitioning | P1 top-level unit, P2 layer, P3 hconcat, P4 aggregate field `sum_v`, P5 defaults without params, P6 empty where, P7 unknown mark, P8 facet | 100% | resolvable partitions pass with arithmetic expected values; P7/P8 yield `point-mark` | node:test |
| VO-6 | QR-4, FR-1 | every Report produced by tests in VO-1..VO-5 (including the CLI SC2 report), VO-7, VO-13..VO-15 | integration; all Reports collected in suite | decision table | the 22 rule ids (location-field rule per QR-4) plus R-ok (`ok === errors.length===0`), R-summary (counts per FR-1), R-deterministic (two runs of C-1 and C-20 stringify identically) | 100% | each Issue conforms; each Report satisfies R-ok and R-summary | node:test shared assertion helper |
| VO-7 | QR-5, Errors | `checkHtml` and CLI under malformed input | integration; guessed defects listed | error guessing | G1 `""`; G2 non-HTML text; G3 chart JSON `null`; G4 `usermeta: null`; G5 `usermeta.ltt: 5`; G6 point `where: null`; G7 `params: []`; G8 `data-answer` with surrounding spaces `" 8 "` (valid, equals 8); G9 `data-from="a..b"`; G10 BOM-prefixed HTML; G11 chart text containing `</div>` inside a JSON string; G12 spec `params` not an array | none — experience-based | resolves; no console writes; G8 treated as 8; others yield the corresponding Issue or none, never a rejection | node:test with console spies |
| VO-8 | QR-2 | CLI on `perf` fixture | end-to-end; 3 runs | none — non-functional measurement | M1 median wall-clock | 100% | median ≤ 5000 ms | node:test measuring `performance.now()` around `spawnSync` |
| VO-9 | QR-3, FR-13 | installed packages, constants, root `package.json` | unit | equivalence partitioning | V1 vega, V2 vega-lite, V3 exact (no `^`/`~`) dependency strings, V4 `type: module`, V5 `engines.node` | 100% | equalities per QR-3 | node:test reading JSON files |
| VO-10 | QR-6, FR-3, C-23, C-1 | network calls | integration; stubs installed before import of index | equivalence partitioning | N1 top-level url, N2 layer url, N3 lookup url, N4 normal point evaluation | 100% | 0 recorded calls; N1..N3 also `chart-url` and no `chart-build` | node:test |
| VO-11 | QR-7 | `packages/check/src/**` | Test command coverage flags | statement and branch testing | line, branch, function % | lines 95, branches 90, functions 95 | Test command fails below threshold | Test command output |
| VO-12 | FR-8 (fresh View), FR-1 ordering, C-54 | report under reordering | integration | metamorphic testing | MR1 reversed point order → same issue multiset; MR2 swapped chart order → same issue multiset | 100% | multisets equal | node:test |
| VO-13 | FR-10, FR-11, C-4, C-5, C-50..C-53 | nesting, unchecked reasons, linked-to-failed, empty | integration | equivalence partitioning | E1 nested quiz, E2 no-from, E3 linked to schema-failed chart, E4 linked to invalid point, E5 linked to mismatched point uses row value, E6 empty page, E7 unclosed tags | 100% | as in Cases | node:test |
| VO-15 | FR-1 ordering, FR-2 always-on lib rules, FR-4 both issues and case-insensitive type, FR-5 both issues, QR-4 cap, C-43..C-48 | report order and co-reported issues | integration | equivalence partitioning | O1 C-43 cross-category order, O2 C-44, O3 C-45, O4 C-46, O5 C-47, O6 C-48 | 100% | exact issue lists in Case order | node:test |
| VO-14 | FR-6, FR-2, QR-4, C-32 (relative src), C-40, C-41, C-42 | runtime build failure, point-specific build failure, relative src, message cap | integration | equivalence partitioning | X1 dataflow evaluation error at default build (C-40), X2 point-only build failure (C-41), X3 relative src (C-32 third input), X4 message cap (C-42) | 100% | as in Cases | node:test |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| A-1 | 기준점은 점 목록(매개변수, 행 조건, 필드, 기대값, 허용오차) | 사용자 선택 | user answer |
| A-2 | 퀴즈 정답은 data attribute(`data-ltt-quiz`, `data-ltt-option`, `data-correct`, `data-answer`, `data-tol`, `data-from`) | 사용자 선택 | user answer |
| A-3 | 차트 spec은 `<script type="application/json" data-ltt-chart>`에 두고 페이지가 그 JSON을 그린다 | 검사 spec = 렌더 spec을 보장하는 방법. 질문 카드에 고정 조건으로 보였다 | user answer |
| A-4 | 기준점은 `usermeta.ltt.points`에 둔다 | `usermeta`는 Vega-Lite가 무시하는 공식 필드(https://vega.github.io/vega-lite/docs/spec.html). 차트 JSON 하나로 끝난다 | brief v1 — approved |
| A-5 | `mark`는 view의 `name`, 컴파일된 `<name>_marks`로 찾는다. facet은 지원하지 않는다 | vega-lite 6.5.0 compile 결과를 이 세션에서 확인(unit `traj_marks`, layer, hconcat `left_marks`; facet은 facet 하위 데이터). 컴파일 이름 규칙은 Vega-Lite 문서의 계약은 아니다 → 버전 고정(A-9)으로 묶는다 | brief v1 — approved |
| A-6 | `where` 숫자 일치는 상대 1e-9, 정확히 1행 | `sequence` step 0.1 누적 오차(0.30000000000000004) 흡수. 1행 강제로 모호한 비교를 막는다 | brief v1 — approved |
| A-7 | `tol` 필수, 경계 포함(≤) | agent가 반올림한 기대값을 쓰므로 명시가 안전하다 | brief v1 — approved |
| A-8 | 기준점마다 새 View | 기준점 사이 상태 누수 방지. 측정 15점 119 ms | brief v1 — approved |
| A-9 | vega 6.4.0 / vega-lite 6.5.0 정확 고정. cdnjs·jsDelivr·unpkg 형식만 인식 | `plan.md` 근거 표, Claude Code artifact CSP 목록 | brief v1 — approved |
| A-10 | HTML 파서 parse5 8(MIT), 스키마 검사 Ajv 8(MIT, `strict:false`, `allowUnionTypes:true`, `logger:false`) | Ajv가 VL 스키마를 컴파일·검증함을 확인(663 ms). `logger:false` 없으면 format 경고가 출력된다 | brief v1 — approved |
| A-11 | `data-from` 없는 수치 퀴즈는 실패가 아니라 `unchecked` | 모델과 무관한 수치 문항이 있다. 서브에이전트 단계가 본다 | brief v1 — approved |
| A-12 | `data-correct`는 존재 여부로 센다 | HTML boolean attribute 관례 | brief v1 — approved |
| A-13 | 위치 `packages/check/`, CLI 종료 코드 0/1/2, stdout JSON | v2 `ltt` CLI와 같은 관례 | brief v1 — approved |
| A-14 | node:test, 커버리지 95/90/95, mutation tool·fuzz 없음 | 설치된 도구 기준 | brief v1 — approved |
| A-15 | 성능 기준 5 s | 같은 규모 탐침 실측 1.3 s의 약 4배 여유 | brief v1 — approved |
| A-16 | 메시지는 영어 | 읽는 쪽이 agent다 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1, C-4, C-5, C-43, C-54 | VO-6, VO-12, VO-13, VO-15 | node:test |
| FR-2 | C-7, C-31, C-32, C-33, C-47 | VO-1, VO-3, VO-15 | node:test |
| FR-3 | C-23 | VO-10 | node:test |
| FR-4 | C-20, C-21, C-44, C-46 | VO-1, VO-15 | node:test |
| FR-5 | C-22, C-23, C-45 | VO-1, VO-10, VO-15 | node:test |
| FR-6 | C-24, C-40, C-41 | VO-1, VO-14 | node:test |
| FR-7 | C-30 | VO-1 | node:test |
| FR-8 | C-1..C-3, C-8..C-13, C-25..C-29, C-54 | VO-1, VO-2, VO-5, VO-12 | node:test |
| FR-9 | C-34 | VO-1 | node:test |
| FR-10 | C-14, C-35, C-50 | VO-1, VO-2, VO-13 | node:test |
| FR-11 | C-4, C-15, C-36, C-37, C-51, C-52 | VO-1, VO-2, VO-13 | node:test |
| FR-12 | C-6, C-38, C-39 | VO-4 | node:test |
| FR-13 | — | VO-9 | node:test |
| QR-1 | C-1..C-54 | VO-1..VO-6, VO-12..VO-14 | node:test |
| QR-2 | — | VO-8 | node:test |
| QR-3 | — | VO-9 | node:test |
| QR-4 | all error Cases | VO-6 | node:test |
| QR-5 | C-53 | VO-7 | node:test |
| QR-6 | C-23, C-1 | VO-10 | node:test |
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
| VO-1..VO-7, VO-10, VO-12..VO-14 | 3 | Test command run 3 (92/92, cov 99.82/98.05/100); verifier 2 | accepted | re-audited for `check()` spy helper change; M1..M14 detected | `fixtures/report.mjs` `check()` / `quietCheckHtml` |
| VO-8, VO-9, VO-11 | 3 | run 3; verifier 2 | accepted | unaffected by helper change | — |
| VO-15 | 3 | `vo15-order-and-coreport.test.mjs`; verifier 2 | accepted | M12, M13, M14 detected | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | run 1: 81/82 pass; C-8 `point-row` actual 0; function coverage 90.48% < 95 (chart.mjs 83.33%) | spec defect in C-8 (exclusive `stop`); declared behaviors FR-6 runtime/point build, FR-2 relative src, QR-4 cap lacked Cases; never-invoked logger stub functions | spec v2 (C-8 fix, C-40..C-42, VO-14); tests redispatched for C-8 and VO-14; implementer asked to stop defining never-invoked functions | run 2 green; M1..M10 hand mutations all detected |
| 2 | verifier 1 F-1: console spies only on G1..G12 (QR-5 says all error Cases); F-2: FR-1 cross-category order, FR-2 always-on, FR-4 both/case-insensitive, FR-5 both lack Cases | evidence gap (F-1); spec Cases missing for approved clauses (F-2) | spec v3 adds C-43..C-48 and VO-15; tests: spies inside the shared `check()` helper, SC2 through `assertReport` | run 3 green 92/92; M11..M14 detected; verifier 2 pass, F-1/F-2 closed; advisory A-3, A-4 (`process.emitWarning` spy) left open as non-blocking |

# Version Log
## v1
- Initial draft from `plan.md`, ADR `ba753ada12166450`, user answers on point format and quiz markup (2026-10-24).

## v2
- C-8 corrected: `LINE` sequence `stop` is exclusive, so `x:4` has no row (test run 1 failure: `point-row` actual 0). Contract-only.
- Added C-40, C-41, C-42, relative src in C-32, and VO-14: run 1 coverage showed declared FR-6 runtime/point build failures, FR-2 relative src, and QR-4 message cap without Cases.
- FR-11 defines "evaluated" (finite row value, mismatch included) to match C-52; FR-4 states both `chart-json` and `chart-id` are reported and which charts count toward `summary.points`. Implementer and test-implementer reported these as unstated.

## v3
- [contract-only] Added C-43..C-48 and VO-15 for approved clauses that had no Case (verifier 1 F-2): cross-category order, always-on lib rules, co-reported chart-json/chart-id and chart-url/chart-schema, case-insensitive type, message cap that truly exceeds 300 chars.
- QR-5 states the spies apply to every `checkHtml` call in the suite (verifier 1 F-1). VO-6 includes the CLI SC2 report (advisory A-1).
