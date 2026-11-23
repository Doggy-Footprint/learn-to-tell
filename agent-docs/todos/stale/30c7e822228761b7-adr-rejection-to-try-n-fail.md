---
commit: fdeb29bc144ca965ee6946da3e12791e57f02e03
---

# Migrate ADR and rejection records to try-n-fail

## User Query
Harness 0.29.0 replaced the ADR and rejection record rules with the try-n-fail rule. Review the ADR and rejection records below and move what a later task still needs into `agent-docs/try-n-fail/`. How each record is handled depends on the repository's current state and the user's choices.

## State
Written by `harness.py update` (migration 0.29.0); no code or record was changed. Records to review (`stale/` entries are history):
- `agent-docs/adr/06a89373c78aaf85-rewrite-v0-with-minimal-design.md`
- `agent-docs/adr/0b47efebac2cbc9f-overview-after-recall.md`
- `agent-docs/adr/190db09929e4196e-distribute-as-harness-extension.md`
- `agent-docs/adr/40552fcb2a7c3985-lock-scene-scale-on-entry.md`
- `agent-docs/adr/6f876d6c883ac0b6-fix-feedback-at-the-generator.md`
- `agent-docs/adr/8a61c967e180bedb-desktop-only-min-720px.md`
- `agent-docs/adr/90dd94ba2dec2365-auto-layout-with-elkjs.md`
- `agent-docs/adr/b130c928be880b9c-infographic-for-learning-recall-for-summary.md`
- `agent-docs/adr/dbd5ddb9b247aa15-phone-viewing-guarantee.md`
- `agent-docs/rejections/1d250c5adce868bf-versioned-json-contracts.md`
- `agent-docs/rejections/20187af899089f43-confirm-scope-with-user.md`
- `agent-docs/rejections/2c5216fdfdbccf54-copy-gallery-page-as-lesson-template.md`
- `agent-docs/rejections/32d48725db48c450-browser-diagnosis-page.md`
- `agent-docs/rejections/3a2d6645686921a6-stacked-step-frames.md`
- `agent-docs/rejections/3c711c4d7cad7c40-ltt-later-deferred-draw.md`
- `agent-docs/rejections/472b8df126578190-lesson-time-floor-and-scope-caps.md`
- `agent-docs/rejections/92f0f2a78d6b9dca-situation-card-first-diagnosis.md`
- `agent-docs/rejections/a9a099a9ff5e3c5e-map-store-hardening.md`
- `agent-docs/rejections/d03c1a1badc46449-observable-framework-build.md`
- `agent-docs/rejections/f9e3756dd41b66c2-kit-css-runtime-link.md`
- `agent-docs/rejections/fe3a45c84cd7828b-download-result-json.md`

## Failed Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| none | none | none |

## Next Step
1. Read each record and check its claims against the current code.
2. Per record, propose one of these to the user, with the reason: convert the rejected alternatives or failed approaches a later task could try again into try-n-fail attempts (cause `user rejected: <reason>` or `verified`/`hypothesis`) with a Revisit Condition; otherwise recommend deleting it. A decision the code already shows needs no record.
3. Write and delete only what the user confirms, following the Try-n-Fail Rule in `AGENTS.md`. When no record is left, recommend deleting `agent-docs/adr/` and `agent-docs/rejections/` with their `index.md`, `stale.md`, and `stale/`. The harness does not manage these directories after this step; whatever the user keeps stays as it is.
4. Mark this handoff stale under the Index & Staleness Management rule.

## Open Questions
- Which records the user wants converted or deleted, and whether to delete the emptied directories.

## Spec
none — not a workflow-approach task.

## Execution Ledger
none
