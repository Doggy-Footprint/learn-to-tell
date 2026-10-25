---
version: 3
run_id: a7c20fbc04021f32
status: complete
base_commit: 3216f7072f92ec416aa0b65436ba5f5304208ceb
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | kit user (agent or person) | see what the kit supports from the main page | `/gallery/` shows part groups, bundled libraries with versions, and feature support (math, map, code highlight, auto layout, flow, sketch) |
| UI-2 | kit user | see the math part like every other part | `catalog.html` has a live `LTT.math` demo with its code |

# Scope
In scope: one "지원 범위" card in `gallery/index.html`; one `math` demo and KaTeX loading in `gallery/catalog.html`; tests in `tests/gallery.test.mjs`.
Out of scope: kit JS changes, new vendor libraries, lesson pages, scenes deck, `kit/API.md`, deploy config, adding ids to catalog group headings.

# Paths
Implementation: skills/learn-to-tell/gallery/index.html, skills/learn-to-tell/gallery/catalog.html
Tests: tests/gallery.test.mjs
Test command: npm test
Review evidence: main serves the repo with `node skills/learn-to-tell/server/server.mjs` (or the test server pattern) and opens `/gallery/` and `/gallery/catalog.html#math` in Chrome at 1440×900 and 720×900, light and dark (`prefers-color-scheme` / `LTT.theme`); records `document.documentElement.scrollWidth <= innerWidth`, count of `#math .katex` elements (≥ 2, one `.katex-display`), and screenshots. Artifact: verification notes in the Execution ledger.
Fuzzing: none — static pages with no input surface.
Mutation tool: none — no mutation tool targets HTML sources; replaced by 8 hand mutations (see Verification Obligations / ledger).

# Signatures
`<section class="ltt-card" id="support">` in index.html, after the `.lib` grid, inside the 라이브러리 group.
Library row: `<tr data-vendor="<name as first token of a VERSIONS line>">` whose text contains the version (second token of that line).
Feature item: element with `data-feature="<math|map|code|layout|flow|sketch>"`.
Group chip: an `<a>` element whose opening tag carries both `data-group="<ltt.js|ltt-ui.js|ltt-mock.js|ltt-parts.js|ltt-deck.js>"` and `href="catalog.html"`, containing 2–3 `<code>` part names.
Support slice: from `id="support"` to the first `</section>` after it (the card has no nested `<section>`).
Math demo span: the builder body — from the first `=> {` after `demo("math"` to the next `demo(` or `group(` call (excludes the demo name, signature and description text).
Catalog demo: `demo("math", "LTT.math(scope)", <when>, (el) => { ... })` inside `group("움직이는 그림 · ltt-parts.js")`.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | index.html has exactly one `#support` `.ltt-card` placed after the `.lib` grid and before the next `h3.group` | must | plan, user "한 카드 요약" |
| FR-2 | `#support` has 5 group chips (`data-group` values ltt.js, ltt-ui.js, ltt-mock.js, ltt-parts.js, ltt-deck.js), each naming 2–3 representative parts and linking to `catalog.html` | must | plan |
| FR-3 | `#support` has one `tr[data-vendor]` per VERSIONS entry (every non-empty line except the one starting `font subsets:`; name = first whitespace token, version = second token); each row text contains its version; no `data-vendor` absent from VERSIONS; each row states purpose and matching kit part | must | user "정적 HTML + 테스트" |
| FR-4 | `#support` has 6 `data-feature` items: math (KaTeX, `LTT.math`, deck `tex`), map (`LTT.map`, Natural Earth 1:110m), code (`mock.code` `lang`: javascript, typescript, python, bash, json, sql), layout (`LTT.autoLayout`/`LTT.state`, elkjs), flow (`LTT.sankey`), sketch (rough.js); each names the vendor file it needs (sketch/rough may say which part uses it) | must | plan, user's original question |
| FR-5 | catalog.html has `demo("math", ...)` in the ltt-parts.js group rendering one inline `data-tex` and one `data-display` block via `LTT.math` | must | plan |
| FR-6 | catalog.html loads `/kit/vendor/katex/katex.min.css` (link) and `/kit/vendor/katex/katex.min.js` (script) before `/kit/ltt.js`; any gallery page whose source contains `LTT.math(` must load katex.min.js before the kit | must | API.md load order |
| FR-7 | `<style>` blocks of index.html and catalog.html contain no hex color literals | must | API.md token rule |

# Errors
- Version in a `data-vendor` row differs from VERSIONS — test fails naming the library — page unchanged; user must update index.html.
- VERSIONS entry has no row, or a row names a library not in VERSIONS — test fails naming it.
- Page uses `LTT.math(` without katex.min.js, or loads it after `/kit/ltt.js` — test fails naming page.
- Without KaTeX loaded at runtime `LTT.math` silently does nothing (`ltt-parts.js` returns early) — non-exception failure; caught only by the source-level load check and review evidence.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | current VERSIONS and new index.html | all 13 rows present with matching versions; test passes |
| C-2 | error | one row's version differs (e.g. d3 7.9.1) | test fails, message names d3 |
| C-3 | error | prismjs row removed | test fails, message names prismjs |
| C-4 | error | extra row `data-vendor="mathjax"` | test fails, message names mathjax |
| C-5 | error | catalog without katex.min.js while using `LTT.math(` | test fails |
| C-6 | boundary | katex.min.js placed right after `/kit/ltt.js` | test fails (after-kit) |
| C-7 | edge | `world-atlas` (data, no script) and `lucide-static` (no vendored file) | still require rows; no script check |
| C-8 | edge | `font subsets:` line in VERSIONS | not treated as a library |
| C-9 | error | `demo("math"` removed | test fails |
| C-10 | error | hex color added to index.html `<style>` | test fails |
| C-11 | error | `data-feature="map"` removed | test fails |
| C-13 | error | `data-vendor="d3"` row duplicated | test fails naming d3 |
| C-14 | error | math demo loses its `data-display` block or `LTT.math(` call while the tokens remain elsewhere in the file | test fails |
| C-15 | error | a chip loses `href`, or a `data-feature` item sits outside the card | test fails |
| C-16 | error | a row's purpose cell blank, a chip with 1 part, a feature without vendor path | test fails |
| C-12 | normal | browser at 720×900 and 1440×900, light/dark | no horizontal scroll; ≥ 2 `.katex` in `#math`, one display |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | FR-1..7 |
| Performance efficiency | no | static page; KaTeX already vendored, one extra script on catalog only |
| Compatibility | yes | existing gallery tests (links, load order, ltt-meta) must keep passing |
| Interaction capability | yes | readable at supported widths and both color schemes |
| Reliability | no | no runtime state |
| Security | no | no input, no new external origin |
| Maintainability | yes | version drift must be caught by tests |
| Flexibility | no | no configuration surface |
| Safety | no | no physical/harm surface |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Functional suitability / completeness | FR-1..7 | passing obligations / declared obligations VO-1..6, ratio | = 1.0 | automated `npm test`; mutations M1–M8 | spec |
| QR-2 | Compatibility / co-existence | existing tests in tests/ | failing pre-existing tests, count | = 0 | automated `npm test` | spec |
| QR-3 | Interaction capability / user interface aesthetics, accessibility | `/gallery/`, `/gallery/catalog.html` at 1440×900 and 720×900, light and dark | `scrollWidth - innerWidth` px; `#math .katex` count | ≤ 0 px; ≥ 2 with ≥ 1 `.katex-display` | review VO-7 | AGENTS/ADR desktop-only 720px |
| QR-4 | Maintainability / modifiability | vendor version bump without index edit | test outcome | fails | mutation M1 | user answer |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-3, C-1, C-2, C-7, C-8 | index.html `tr[data-vendor]` vs parsed VERSIONS | unit (node:test, source parse); all VERSIONS entries | equivalence partitioning | each of the 13 VERSIONS names (e.g. `@observablehq/plot`, `d3`, `world-atlas`) — id = name | 100% | row exists and its text contains the version; else fail naming library | `npm test` |
| VO-2 | FR-3, C-3, C-4, C-13 | set difference both ways and multiplicity | unit | decision table | R1 in VERSIONS only; R2 in page only; R3 name appears in more than one row | 100% | each rule fails with name | `npm test` |
| VO-3 | FR-6, C-5, C-6 | `<script src>`/`<link href>` order in every live gallery page using `LTT.math(`; catalog katex css | unit | equivalence partitioning | P1 loaded before kit; P2 loaded after kit; P3 not loaded; P4 catalog css present | 100% | P1 passes, P2/P3 fail, P4 required | `npm test` |
| VO-4 | FR-5, C-9, C-14 | catalog.html math demo span | unit | syntax testing | inside the math demo span: `data-tex` without `data-display` (inline) ≥ 1, `data-display` ≥ 1, `LTT.math(` ≥ 1; demo after the ltt-parts.js group call and before the ltt-deck.js group call | 100% | all present in span and order | `npm test` |
| VO-5 | FR-1, FR-2, FR-4, C-11, C-15 | index.html support slice | unit | equivalence partitioning | single `#support` `.ltt-card` after `.lib` with no `h3.group` between; 5 `data-group` values each on an `<a>` opening tag with `href="catalog.html"`; 6 `data-feature` values; all `data-group`/`data-feature`/`data-vendor` attributes in the file lie inside the slice | 100% | all hold | `npm test` |
| VO-8 | FR-2, FR-3, FR-4, C-16 | content inside support slice | unit | equivalence partitioning | per chip: 2–3 `<code>` elements before its `</a>`; per `data-vendor` row: exactly 4 `<td>` cells, each with non-empty text; per `data-feature` item (up to `</li>`): contains `/kit/vendor/`; `code` item contains javascript, typescript, python, bash, json, sql; `math` item contains `LTT.math`; `map` item contains `LTT.map` | 100% (5 chips + 13 rows + 6 features + 3 named-content items) | all hold | `npm test` |
| VO-6 | FR-7, C-10 | `<style>` contents of index.html and catalog.html | unit | error guessing | hex literal `#[0-9a-fA-F]{3,8}` in style | none — experience-based | none found | `npm test` |
| VO-7 | QR-3, C-12 | browser render | end-to-end review | scenario testing | S1 index 1440 light; S2 index 720 dark; S3 catalog#math 1440 dark; S4 catalog#math 720 light | 100% | no hscroll; katex counts as QR-3 | review evidence procedure |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v1 — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| A-1 | versions written as static HTML and checked by test | user chose "정적 HTML + 테스트" | user answer |
| A-2 | one summary card, not full part list | user chose "한 카드 요약" | user answer |
| A-3 | table includes fonts and lucide (all 13 VERSIONS entries) | 1:1 keeps the check simple | brief v1 — approved |
| A-4 | chips link to `catalog.html` without anchors | catalog group headings have no ids | brief v1 — approved |
| A-5 | math demo shows `\det A = ad - bc` (display) and inline `A\mathbf{x}` | matches linear-algebra lesson | brief v1 — approved |
| A-6 | prism language list hand-written, untested | VERSIONS prism line is source | brief v1 — approved |
| A-7 | `?audit` panel does not apply (deck-only); interaction measured by scrollWidth and katex counts | API.md: audit is a deck feature | contract-only (logged) |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1 | VO-5 | npm test |
| FR-2 | C-1, C-15, C-16 | VO-5, VO-8 | npm test |
| FR-3 | C-1..C-4, C-7, C-8, C-13, C-16 | VO-1, VO-2, VO-8 | npm test |
| FR-4 | C-11, C-15, C-16 | VO-5, VO-8 | npm test |
| FR-5 | C-9, C-14 | VO-4 | npm test |
| FR-6 | C-5, C-6 | VO-3 | npm test |
| FR-7 | C-10 | VO-6 | npm test |
| QR-3 | C-12 | VO-7 | review |
| QR-4 | C-2 | VO-1 (M1) | mutation |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 2 |
| verifier invocations | 2 |
| open finding ids | none (advisory: F-4..F-10) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 1 | tests/gallery.test.mjs `VO-1 …` @ working tree; npm test 186/186 | accepted | M1 (d3 7.9.1) killed by VO-1; M2 killed by VO-1/2/5 | VERSIONS, index.html |
| VO-2 | 3 | `VO-2 … and appear once` (R1–R3) | accepted | M2, M3, M12 killed | VERSIONS, index.html |
| VO-3 | 1 | use→need row `LTT.math(`; `VO-3 catalog loads the katex stylesheet …` | accepted | M4 (removed) and M5 (after kit) killed by "vendor scripts before the kit" | gallery pages |
| VO-4 | 3 | `VO-4 catalog math demo span …` (builder body span) | accepted | M6, M9, M9b, M9c killed | catalog.html |
| VO-5 | 3 | `VO-5 support card sits after the lib grid; …` (card-bounded slice, per-chip anchor) | accepted | M8, M10, M11 killed | index.html |
| VO-6 | 1 | `VO-6 …` | accepted | M7 (#777 in style) killed | index.html, catalog.html |
| VO-8 | 3 | `VO-8 support card content …` | accepted | M2, M8, M11, M13a/b/c killed | index.html |
| VO-7 | 1 | agent-docs/spec-logs/a7c20fbc04021f32-vo7-review.mjs (headless Chrome CDP) | accepted | S1–S4 pass, see ledger R1 | browser |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| I1 | implement+test round 1 | — | implementer: index #support card + catalog math demo/katex; test-implementer: VO-1..6 in tests/gallery.test.mjs | npm test 186 pass 0 fail |
| C1 | implementer challenges: FR-2 deck chip has only one catalog demo; FR-4 sketch used only by LTT.diagram | — | accepted: deck chip names LTT.deck + figure/statement scene types (from deck demo text); sketch row/feature points to LTT.diagram sketch (API.md:56,139 confirm) | no spec change |
| H1 | hand mutations M1–M8 via seed.py backup/restore (script: agent-docs/spec-logs/a7c20fbc04021f32-hand-mutations.py) | strongest classes: stale version (drift, QR-4), missing row, extra row, missing katex, katex after kit, demo removed, hex color, feature removed | each executed; failing test = intended assertion | 8/8 killed; restore ok |
| R1 | VO-7 review: Chrome extension unavailable → headless Chrome via CDP (agent-docs/spec-logs/a7c20fbc04021f32-vo7-review.mjs), python http.server on skills/learn-to-tell | — | S1 index 1440 light: scrollW 1425 ≤ 1440, table overflow 0, console errors 0; S2 index 720 dark: 705 ≤ 720, overflow 0, errors 0; S3 catalog#math 1440 dark: .katex 2, display 1, katex-error 0; S4 catalog#math 720 light: 705 ≤ 720, .katex 2, display 1; screenshots inspected (readable both schemes) | pass |
| V1 | verifier round 1: retry; F-1 VO-4 tokens checked file-wide not in demo span; F-2 VO-5 chip link only checked somewhere in slice, slice ran past card; F-3 FR-2/3/4 content unverified; advisories F-4..F-7 | evidence gaps (F-1, F-2), spec gap (F-3) | spec v2: demo-scoped VO-4, per-chip anchor + card-bounded slice VO-5, new VO-8 content, VO-2 R3 duplicates (F-6) | VO-1/3/6/7 accepted at v1 (unchanged deps: VERSIONS, catalog head, styles, review script); VO-2/4/5 invalidated; VO-8 pending |
| H2 | v2 hand mutations (script agent-docs/spec-logs/a7c20fbc04021f32-hand-mutations.py, v2 set) | — | reran M2, M3, M6, M8 + new M9 (display block removed from demo), M9b (LTT.math(el) removed), M10 (chip href removed), M11 (feature moved outside card), M12 (d3 row duplicated), M13a/b/c (blank purpose cell, chip with one part, feature without vendor path) | 10/12 killed by intended tests; M9 and M9b SURVIVED: span includes the demo signature `LTT.math(scope)` and description text mentioning `data-display`, so tokens remain after the body loses them |
| C2 | M9/M9b survival | spec-defined span too wide (evidence defect from spec v2 wording) | spec v3: span = builder body after first `=> {`; redispatch test-implementer for VO-4 | VO-4 rewritten; npm test 187/187 |
| H3 | v3 hand mutations (agent-docs/spec-logs/a7c20fbc04021f32-hand-mutations-v2.py) | — | M2, M3, M6, M8, M9, M9b, M9c (inline tex removed), M10, M11, M12, M13a/b/c | 13/13 killed by intended tests; restore ok |
| V2 | verifier round 2: pass; F-1/F-2/F-3/F-6 closed; new advisories F-8 (exact chip/feature counts), F-9 (VO-4 tokens not tied to one element), F-10 (row text correctness not checked) | — | retained VO-1/3/6/7 confirmed by change-impact check | complete |

# Version Log
## v3
- Contract-only (mutations M9/M9b survived): VO-4 math demo span narrowed to the builder body so the signature and description text cannot satisfy it.
## v2
- Contract-only (verifier round 1 F-1, F-2, F-3, F-6): VO-4 scoped to the math demo span; VO-5 checks each chip is an `<a>` with `href="catalog.html"` and bounds the slice at the card's `</section>`; VO-8 added for FR-2/3/4 content; VO-2 adds R3 duplicate rows. Cases C-13..C-16 added. No user-facing decision changed.
## v1
- Initial spec from approved plan (user answers: scope confirmed, static HTML + test, one-card summary). A-7 logged as contract-only: `?audit` is deck-only.
