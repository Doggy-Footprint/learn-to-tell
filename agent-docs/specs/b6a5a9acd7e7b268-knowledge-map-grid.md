---
version: 1
run_id: b6a5a9acd7e7b268
status: active
base_commit: 601d23ba9aab1999ebd275e8769c015cfeb7a735
max_verifier_invocations: 2
handoff: agent-docs/handoff/b6a5a9acd7e7b268-knowledge-map-grid.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | learner | see at a glance what they studied and what is fading | `/map/grid.html` shows every concept as a chip in a domain (row) × level 1–5 (column) grid, colored by freshness |
| UI-2 | learner | after a lesson, see what it connects to and what can be learned next | `/map/focus.html?id=<id>` shows the concept with prerequisites below, `leads_to` targets above (unlearned dashed), cross-domain neighbors at the sides |
| UI-3 | agent (fork learning session) | keep the map consistent across sessions without reading the whole map | `ltt-map find/show/check/sweep` give bounded output; same inputs always produce identical derived files |
| UI-4 | maintainer | recover from bad merges or schema changes | deleting `<home>/concepts/` and `<home>/map.md` and running `ltt-map rebuild` reproduces them from lesson records + decisions |

# Scope
In scope:
- Lesson record format: YAML frontmatter `concepts:` block at the top of `<home>/lessons/<id>/result.md` (source of truth).
- Append-only `<home>/decisions.jsonl` (merge, link, reject).
- Derived `<home>/concepts/<id>.md`, `<home>/map.md`, `<home>/map-data.json`; sweep state `<home>/map-state.json`.
- Node CLI `skills/learn-to-tell/map/ltt-map.mjs` with commands `rebuild`, `find`, `show`, `decide`, `check`, `sweep`, `sweep-done`.
- Grid and focus views served by the existing server under `/map/`.
- SKILL.md §0 (map reading), §5 (result.md frontmatter), §6 (map procedure, level rubric, link sweep procedure) rewrite.
Out of scope: forest/graph view, elkjs hulls, SQLite or any search index, embeddings, split command, per-user forgetting model, migration of existing `<home>` data, the Haiku call itself as code (the agent runs it per SKILL.md), multi-user or remote serving, phone layouts (< 720px, ADR 8a61c967e180bedb).

# Paths
Implementation: skills/learn-to-tell/map/, skills/learn-to-tell/server/server.mjs, skills/learn-to-tell/SKILL.md
Tests: tests/map/
Test command: node --test --experimental-test-coverage --test-coverage-include='skills/learn-to-tell/map/lib/**' --test-coverage-lines=90 --test-coverage-branches=85 tests/
Review evidence: RV-1 — main starts `LTT_HOME=tests/map/fixtures/home-review node skills/learn-to-tell/server/server.mjs`, opens `/map/grid.html` and `/map/focus.html?id=gpu-warp` in Chrome at 1440×900 and 720×900, light and dark; records `document.documentElement.scrollWidth <= innerWidth`, that the shared fixture concept appears in two rows, hover on a chip adds the highlight class to every connected chip, and screenshots. Artifact: notes in the Execution ledger.
Fuzzing: seeded property harness `tests/map/fuzz.test.mjs` — surface: `derive()` and `check()` over randomly generated lesson sets and decision logs (including malformed frontmatter, cycles, unknown ids, merge chains); oracles: never throws, `derive` deterministic (two runs byte-identical), `rebuild` idempotent, every reported error names a source file; seed 20261016; budget 2000 generated homes.
Mutation tool: none — no JS mutation tool is installed and adding Stryker is a new dependency; replaced by 8–10 hand mutations selected at Triage.

# Signatures
- Lesson frontmatter (YAML, parsed with vendored js-yaml 4.1.0 at `skills/learn-to-tell/map/vendor/js-yaml.mjs`):
  ```yaml
  ---
  lesson: <lesson id, must equal directory name>
  date: YYYY-MM-DD
  concepts:
    - id: <[a-z0-9][a-z0-9-]*>
      title: <display name>
      aliases: [<string>]          # optional
      definition: <one line>
      domains: [<domain id>]       # ≥1, [a-z0-9-]+
      level: 1|2|3|4|5
      requires: [<concept id>]     # optional
      leads_to: [<concept id>]     # optional
      quiz: pass|fail|skipped|none
  ---
  ```
- decisions.jsonl lines: `{"op":"merge","from":<id>,"into":<id>,"date":...}` | `{"op":"link","from":<prereq id>,"to":<dependent id>,"date":...}` | `{"op":"reject","a":<id>,"b":<id>,"date":...}`.
- `lib/derive.mjs`: `export function derive(lessons, decisions, today) -> { concepts, edges, frontier, errors, warnings }` (pure; `lessons` = `[{path, text}]`).
- `lib/check.mjs`: `export function check(derived) -> { errors, warnings }`.
- `lib/find.mjs`: `export function find(concepts, query, {k=5, domain}) -> [{id, title, definition, score, exact}]`.
- `lib/freshness.mjs`: `export function freshness(history, today) -> "fresh"|"fading"|"stale"|"weak"|"unquizzed"`.
- CLI `node skills/learn-to-tell/map/ltt-map.mjs <cmd>`; reads `$LTT_HOME` (default `~/.learn-to-tell`) via the same rule as `server.mjs lttHome()`.
  - `rebuild` — writes concepts/, map.md, map-data.json; exit 1 on errors (files still written for valid concepts).
  - `find "<text>" [--domain d] [-k n]` — one line per hit: `id | title | definition | score[ | exact]`.
  - `show <id> [--depth 1|2]` — the concept and its neighbors only; merged ids resolve to their target.
  - `decide merge|link|reject ...` — appends one line to decisions.jsonl, then runs rebuild.
  - `check` — prints errors and warnings; exit 1 on errors.
  - `sweep` — prints JSON `{due, new:[...], existing:[...], edges:[...], rejected:[...]}`; `due` true when ≥10 concepts are not in `map-state.json.swept`.
  - `sweep-done <id>...` — adds ids to `swept`.
- Server routes: `GET /map/grid.html`, `GET /map/focus.html`, static assets under `/map/`, `GET /map/data.json` → `<home>/map-data.json`.

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `derive` reads only the frontmatter of each `lessons/*/result.md`; files without frontmatter or with `concepts: []` contribute nothing and produce no error | must | discussion "레슨 기록이 원본" |
| FR-2 | the same `id` across lessons is one concept: `title`, `definition`, `level` from the lesson with the latest `date` (tie: lexicographically greater lesson id); `aliases`, `domains`, `requires`, `leads_to`, `lessons` are sorted unions; quiz history keeps every `(date, lesson, quiz)` | must | discussion |
| FR-3 | `A.leads_to: [B]` and `B.requires: [A]` and `link from A to B` all produce the single edge `A→B` (prereq→dependent); duplicate edges are collapsed | must | user "leads_to" |
| FR-4 | edge endpoints with no concept become frontier nodes (id only, status `frontier`); frontier nodes get no concept file | must | discussion |
| FR-5 | `merge from X into Y`: X's fields, history and edges move to Y; every reference to X resolves to Y; Y records `merged_from: [X]`; no concept file for X; merge chains resolve transitively; a merge cycle is an error and both merges are ignored | must | discussion (Graphiti superseded) |
| FR-6 | `reject a b` removes neither concept; it excludes the unordered pair from `sweep` suggestions and is reported as a warning if an edge between them exists | must | discussion (sweep problems 1) |
| FR-7 | status: latest quiz `pass` → learned, `fail` → weak, only `skipped`/`none` → diagnosed | must | SKILL.md §4 |
| FR-8 | freshness: weak if latest quiz is fail; unquizzed if never pass/fail; else days since latest pass ≤14 fresh, ≤60 fading, >60 stale | must | discussion (Duolingo HLR, fixed thresholds) |
| FR-9 | `check` errors: requires cycle (names the cycle), invalid id/domain syntax, level outside 1–5, missing title/definition/domains, `lesson` ≠ directory name, YAML parse failure (names the file); warnings: prereq level > dependent level, alias or normalized title shared by two concepts, edge on a rejected pair | must | discussion |
| FR-10 | a lesson with an error is skipped as a whole; other lessons still derive | must | reliability |
| FR-11 | `rebuild` writes `concepts/<id>.md` (YAML frontmatter of the derived concept + generated-file header line), removes concept files no longer derived, writes `map.md` (table: domain, level, title, status, freshness, last date, lessons) and `map-data.json` | must | discussion |
| FR-12 | `find`: normalized (NFKC, lowercase, whitespace/`-`/`_` removed) exact match on id, title, or alias → `exact` hits first with score 1; others ranked by character-trigram Jaccard over title+aliases (weight 2) and definition (weight 1); ties by id; at most k lines | must | discussion |
| FR-13 | `show` prints the concept and neighbors up to depth (default 1), never the whole map | must | user "검색으로 찾기" |
| FR-14 | `sweep` lists unswept concepts as `new`, all others as `existing` (id, title, definition, domains, level), current edges and rejected pairs; `due` iff `new.length ≥ 10` | must | user "10개 추가될 때마다" |
| FR-15 | grid view: rows = domains (sorted), columns = level 1–5; a concept with n domains appears in n rows; chip text = title; chip color = freshness token; hover/focus on a chip highlights every chip (all rows) of concepts sharing an edge with it; click opens focus view | must | user "격자" |
| FR-16 | focus view: center concept; prerequisites below; dependents above; frontier nodes dashed; neighbors with no domain in common with the center placed left/right and tagged with their domain; unknown id shows a not-found message with a link to the grid | must | discussion |
| FR-17 | views use kit tokens (`--ltt-*`) and load `/kit/ltt.js`; no external network | must | SKILL.md §3 principles |
| FR-18 | SKILL.md: §0 reads map via `ltt-map show`/`find` instead of whole `map.md`; §5 result.md template starts with the concepts frontmatter; §6 gives the find-before-create rule (exact → reuse; else compare definitions; ambiguous → ask user), the granularity rule (one concept = one decision variable checkable by one quiz item), the level rubric (1 freshman/new hire … 5 research/expert), the sweep procedure (when `due`, run Haiku with the `sweep` JSON, prompt states zero suggestions is normal and each suggestion needs one-sentence reason, the fork session decides by definition and records `decide link|reject`, then `sweep-done`), and the URLs of both views | must | discussion |

# Errors
- Malformed YAML / invalid field in a lesson — `check` and `rebuild` print `error <path>: <reason>`, exit 1 — that lesson is skipped, all other outputs written.
- requires cycle — error listing ids in cycle order — edges of the cycle are kept in `map-data.json` for display but `check` exits 1.
- merge cycle — error naming both decisions — both merges ignored.
- malformed decisions.jsonl line — error `decisions.jsonl:<line>` — line ignored, others applied.
- `show`/`decide` with unknown id — stderr `unknown concept <id>`, exit 2 — no file changed.
- `/map/data.json` when map-data.json missing — HTTP 404 `{error:"run ltt-map rebuild"}`; views render an empty-state message.
- path traversal under `/map/` — HTTP 403, as existing `serveFile`.

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | two lessons, disjoint concepts | both derived, files written, map.md rows sorted by domain, level, title |
| C-2 | normal | same id in two lessons with different definitions and dates | latest-date definition; domains union; two history entries |
| C-3 | normal | A.leads_to B, B.requires A, link A→B | exactly one edge A→B |
| C-4 | normal | leads_to target with no concept | frontier node, no concept file |
| C-5 | normal | merge X into Y, Z.requires X | Z→Y edge; Y.merged_from = [X]; `show X` shows Y |
| C-6 | normal | 12 concepts, 0 swept | `sweep.due` true, 12 new; after `sweep-done` of all, due false |
| C-7 | normal | `find "Coalescing"` with alias `coalescing` | exact hit first |
| C-8 | normal | concept in domains [gpu, linear-algebra] | grid shows it in both rows; hover highlights linked chips in both rows |
| C-9 | boundary | days since last pass 14 / 15 / 60 / 61 | fresh / fading / fading / stale |
| C-10 | boundary | level 1 and 5 valid; 0 and 6 | valid / error |
| C-11 | boundary | 9 vs 10 unswept | due false / true |
| C-12 | boundary | `find -k 1`; query matching nothing | one line / no lines, exit 0 |
| C-13 | error | one lesson malformed YAML, one valid | error names malformed path; valid lesson derived; exit 1 |
| C-14 | error | requires cycle A→B→A | error lists cycle; exit 1 |
| C-15 | error | merge X→Y and Y→X | error; neither applied |
| C-16 | error | `show nope` | stderr unknown concept, exit 2 |
| C-17 | error | `lesson:` ≠ directory name | error, lesson skipped |
| C-18 | edge | rebuild twice; delete concepts/ and rebuild | byte-identical outputs |
| C-19 | edge | concept removed from its only lesson | its concept file deleted on rebuild |
| C-20 | edge | reject a b while edge a→b exists | warning; edge kept; pair excluded from sweep |
| C-21 | edge | prereq level 4 → dependent level 2 | warning |
| C-22 | edge | result.md without frontmatter (old format) | ignored, no error |
| C-23 | edge | focus view of unknown id; data.json missing | not-found message / empty state, no script error |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | derivation and views are the product |
| Performance efficiency | yes | runs at every lesson end; must stay fast as concepts grow |
| Compatibility | yes | shares server and kit with lessons and gallery |
| Interaction capability | yes | grid/focus are user-facing views |
| Reliability | yes | one bad lesson must not break the map; rebuild is the recovery path |
| Security | yes | new server routes read files under home |
| Maintainability | yes | agent-maintained data; pure lib functions testable |
| Flexibility | no | single local user, one platform (macOS/Node ≥22); no portability target |
| Safety | no | no physical or harmful effect |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Performance / time behaviour | `rebuild` on generated home with 500 concepts, 100 lessons, 800 edges | wall time of `rebuild` in-process, ms, median of 3 | ≤ 2000 ms | automated (tests/map/perf.test.mjs) | default |
| QR-2 | Performance / resource | `find` and `show` output on the 500-concept home | output lines | find ≤ k lines; show depth 1 ≤ 1 + degree lines | automated | user "검색으로 찾기" |
| QR-3 | Compatibility / co-existence | existing tests and server routes | `node --test tests/` existing files; `/gallery/`, `/kit/`, `/lessons/` responses | all existing tests pass; routes unchanged | automated | existing behavior |
| QR-4 | Interaction capability / appropriateness recognizability, user error protection | grid and focus at 1440×900 and 720×900, light and dark | RV-1 procedure | no horizontal overflow; shared concept in both rows; hover highlights linked chips; chips keyboard-focusable | review RV-1 + automated DOM test with fixture data | ADR 8a61c967e180bedb |
| QR-5 | Reliability / fault tolerance | malformed lessons/decisions | fuzz harness + C-13..C-17 | 0 uncaught exceptions; every error names its source | automated, fuzz | discussion |
| QR-6 | Reliability / recoverability | delete derived files and rebuild | byte comparison | identical | automated C-18, fuzz | user intent UI-4 |
| QR-7 | Security / integrity, confidentiality | `/map/` routes | requests with `..`, encoded `%2e%2e`, absolute paths | 403 or 404; no file outside skill `map/` dir or `<home>/map-data.json` served | automated | existing serveFile invariant |
| QR-8 | Security / integrity | concept id used as filename | ids failing `[a-z0-9][a-z0-9-]*` | rejected, no file written outside `<home>/concepts/` | automated | — |
| QR-9 | Maintainability / testability | `skills/learn-to-tell/map/lib/**` | node test coverage | lines ≥ 90%, branches ≥ 85% | automated (Test command) | default |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, FR-2, C-1, C-2, C-19, C-22 | `derive()` lesson inputs | unit; all partitions | equivalence partitioning | P1 no frontmatter, P2 empty concepts, P3 single lesson, P4 same id multi-lesson, P5 date tie, P6 concept removed | 100% | derived fields per FR-2 | node test |
| VO-2 | FR-3, FR-4, C-3, C-4 | edge sources | unit | decision table | rules: leads_to only, requires only, link only, any two, all three, target missing | 100% | one edge; frontier when missing | node test |
| VO-3 | FR-5, C-5, C-15 | decisions merge | unit | state transition | states: active, merged, chain-merged; transitions: merge, merge into merged, cycle | 100% transitions | references resolved; cycle ignored with error | node test |
| VO-4 | FR-6, FR-14, C-6, C-11, C-20 | sweep state | unit + CLI integration | boundary value analysis (2-value) | unswept 9/10; swept-all → 0 | 100% | due flag; rejected pairs listed | node test |
| VO-5 | FR-7, FR-8, C-9 | `freshness()` / status | unit | boundary value analysis (3-value) | 13/14/15, 59/60/61 days; fail latest; never quizzed; pass then fail; fail then pass | 100% | per FR-8 | node test |
| VO-6 | FR-9, FR-10, C-10, C-13, C-14, C-17, C-21 | `check()` | unit | equivalence partitioning | each error and warning kind in FR-9 (10 items) + level 0/1/5/6 | 100% | kind, path, exit code | node test |
| VO-7 | FR-11, C-18, QR-6 | `rebuild` CLI on temp LTT_HOME | integration | scenario | rebuild; rebuild again; delete derived and rebuild; remove a concept and rebuild | 100% | byte-identical / file removed | node test |
| VO-8 | FR-12, FR-13, C-7, C-12, QR-2 | `find`, `show` CLI | integration | equivalence partitioning | exact by id/title/alias, normalized match (case, hyphen, NFKC), partial, no match, k=1, domain filter, show merged id, show depth 2 | 100% | ordering and line counts | node test |
| VO-9 | Errors, C-16 | CLI unknown id / bad decisions line | integration | equivalence partitioning | show unknown, decide unknown, malformed jsonl line | 100% | exit 2 / error line; files unchanged | node test |
| VO-10 | FR-15, FR-16, FR-17, C-8, C-23, QR-4 | grid/focus DOM from fixture data | integration (jsdom-free: run view module's pure layout function `layoutGrid(data)` / `layoutFocus(data,id)` + string-render check) | classification tree | classes: domains count 1/many, concept multi-domain, frontier present, cross-domain neighbor, unknown id, empty data | 100% leaves | rows/columns/positions/classes per FR | node test |
| VO-11 | QR-4 | rendered views | review | scenario | RV-1 steps | 100% | as RV-1 | RV-1 notes |
| VO-12 | QR-7, QR-8 | server `/map/` + id filenames | integration | syntax testing | `..`, `%2e%2e`, `/map/../server/server.mjs`, absolute path, id with `/`, id uppercase, id empty | 100% | 403/404; rejected | node test |
| VO-13 | QR-1 | perf | integration | scenario | 500-concept generated home | n/a | ≤2000 ms | node test |
| VO-14 | QR-3 | existing suite | integration | scenario | existing test files | 100% | pass | Test command |
| VO-15 | QR-5, QR-6 | fuzz harness | unit | random testing | 2000 generated homes, seed 20261016 | none — random | oracles per Fuzzing | fuzz test |
| VO-16 | FR-18 | SKILL.md text | review + automated grep | error guessing | missing: frontmatter template, find-before-create, granularity rule, level rubric 1–5, sweep "0 is normal" + reason sentence, decide/sweep-done, view URLs, §0 no longer reads whole map.md | none — experience-based | each present | node test asserting phrases + review |
| VO-17 | QR-9 | lib coverage | Test command | branch testing | lib/** | lines 90%, branches 85% | coverage thresholds pass | Test command |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| AD-1 | no migration; next session deletes everything under `<home>` (`map.md`, `lessons/`, `background.md`, `profiles/`) before implementing | user "기존 데이터 다 지워", "다 지워도 돼" | user answer |
| AD-2 | result.md YAML frontmatter is the lesson concept block | — | user answer |
| AD-3 | tooling in Node | existing `node --test` suite and server.mjs | user answer |
| AD-4 | `leads_to` replaces `connects_to`; means "learnable next after this" | user correction | user answer |
| AD-5 | vendor js-yaml 4.1.0 (ESM, MIT) instead of a hand-written YAML subset parser | Node has no YAML parser; hand parser is a bug source | brief v1 — approved |
| AD-6 | freshness thresholds 14 / 60 days, fixed | no per-user data yet; Duolingo HLR suggests later personalization | brief v1 — approved |
| AD-7 | `find` uses trigram Jaccard in memory, no index | tens–hundreds of concepts; QR-1/QR-2 guard growth | brief v1 — approved |
| AD-8 | sweep is triggered by the agent at lesson end per SKILL.md, not a hook | keeps CLI pure; missed sweeps are caught next lesson via map-state | brief v1 — approved |
| AD-9 | derived concept files carry a "generated — edit lesson or decisions" header; hand edits are overwritten | source of truth rule | brief v1 — approved |
| AD-10 | no mutation tool; hand mutations only | no Stryker installed; new dependency | brief v1 — approved |
| AD-11 | views split into a pure layout module (testable in Node) and a thin DOM renderer | no jsdom dependency | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1, FR-2 | C-1, C-2, C-19, C-22 | VO-1 | node test |
| FR-3, FR-4 | C-3, C-4 | VO-2 | node test |
| FR-5 | C-5, C-15 | VO-3 | node test |
| FR-6, FR-14 | C-6, C-11, C-20 | VO-4 | node test |
| FR-7, FR-8 | C-9 | VO-5 | node test |
| FR-9, FR-10 | C-10, C-13, C-14, C-17, C-21 | VO-6 | node test |
| FR-11 | C-18, C-19 | VO-7 | node test |
| FR-12, FR-13 | C-7, C-12 | VO-8 | node test |
| Errors | C-16 | VO-9 | node test |
| FR-15, FR-16, FR-17 | C-8, C-23 | VO-10, VO-11 | node test, RV-1 |
| FR-18 | — | VO-16 | node test + review |
| QR-1, QR-2 | — | VO-13, VO-8 | node test |
| QR-3 | — | VO-14 | Test command |
| QR-4 | C-8 | VO-10, VO-11 | node test, RV-1 |
| QR-5, QR-6 | C-13..C-18 | VO-15, VO-7 | fuzz, node test |
| QR-7, QR-8 | — | VO-12 | node test |
| QR-9 | — | VO-17 | Test command |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 0 |
| verifier invocations | 0 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1..VO-17 | 1 | — | pending | not started | — |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |

# Version Log
## v1
- Approved brief v1; status active; handoff written.
- Initial draft from design discussion: lesson records as source of truth, grid + focus views, optional requires/leads_to, incremental Haiku sweep every 10 concepts. Rejected in discussion: forest view, SQLite index, embeddings, strict DAG maintenance.
