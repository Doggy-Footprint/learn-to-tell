# 지식 map 격자·focus view 재설계

## Goal
"지식의 나무를 그려서 보여줄거야. … 내 intent는 좋은 UI / 유저 경험을 만들고, 이 지식 map이 관리하기 쉬운 형태가 되는거야." 이후 토의 결론: "격자가 나을 것 같네. … requires는 선택 필드로 남겨둬. connects_to(→ leads_to)도 같이 적게해서 … 갯수가 10개 추가될 때마다 haiku 정도로 전수조사 돌려서 연결 제안을 하게 하고 메인 에이전트 판단으로 연결". "spec을 작성해줘. 다음 세션에서 시작할 수 있게."

## State
- Branch: ui/ui-advice, base commit 601d23ba9aab1999ebd275e8769c015cfeb7a735
- Changed files: agent-docs/specs/b6a5a9acd7e7b268-knowledge-map-grid.md (new, active), this handoff, agent-docs/handoff/index.md
- No implementation or tests written. `<home>` (~/.learn-to-tell) data not yet deleted.

## Failed Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| Forest view (elkjs layered + domain hulls) as primary view | Sonnet review: < 30 concepts render as a few dots; low revisit value | hypothesis |
| Concept DAG with LLM-maintained required `requires` and level = longest path | Sonnet review: edges vary per session; one edge shifts all levels; Math Academy DAG is expert-curated | hypothesis |
| SQLite FTS5 index + full CLI with alias/split tooling | Sonnet review: over-engineering for tens of concepts | hypothesis |
| Full pairwise Haiku sweep | quadratic cost, re-suggests rejected pairs, forced suggestions on unrelated lessons | hypothesis |

## Next Step
1. Delete everything under `~/.learn-to-tell` (user approved: "다 지워도 돼"; AD-1).
2. Resume the workflow at step 3 (Implement + test) with the active spec: emit `implement_test`, dispatch implementer and test-implementer in parallel on spec v1.

## Open Questions
- none

## Spec
agent-docs/specs/b6a5a9acd7e7b268-knowledge-map-grid.md, version 1, status active, run ID b6a5a9acd7e7b268

## Execution Ledger
- Findings: none. Evidence: none yet. Fuzz: not run. Mutations (hand/tool): not run.
- correction batches used: 0; verifier invocations: 0
