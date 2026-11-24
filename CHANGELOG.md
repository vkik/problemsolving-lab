# Changelog

## 1.1.0 — Quality and methodology enhancement

### Data integrity
- New save queue (`src/lib/saveQueue.ts`): failed writes are never discarded, retries use back-off (1/3/10/30 s), and there is one write at a time with no stale overwrites. `flush()` reports failures, and deleting a project waits for any in-flight write.
- Header status: saving / saved / retrying / not saved. A recovery banner offers *Retry now* and *Export backup*.
- Tab lifecycle (`src/lib/lifecycle.ts`): flush when hidden, best-effort flush on pagehide, confirmation before closing with unsaved changes.
- Imports and the sample project report storage failures; the app says so if storage cannot be opened.

### Evidence-based completion
- Four step states: Complete · Complete with documented limitations · Needs further evidence · Incomplete, with a quality-check list on every step and in the report.
- Finding support (validated / provisional / not linked) and recommendation chains (evidence-backed / backed with limitations / precautionary / unsupported) in `src/lib/evidence.ts`.
- Precautionary recommendations: allowed when explicitly marked and justified, and never shown as evidence-backed.
- SMART: “partly” with an explanation is a documented limitation rather than a blocker.

### Coaching
- Structure: six-question guided review (relevance, mutually exclusive, collectively exhaustive, consistent logic, causes vs. symptoms/consequences, tree type), each with an explanation and automatic observations. Branch roles: driver/component, symptom, consequence. Acceptance remains a human review.
- Synthesis: a Data → Finding → Insight → Implication → So what? ladder with a worked example, rung-by-rung finding form, a one-sentence draft built only from the user's words, and a restatement warning.

### Data model
- Schema v2: `IssueNode.kind`, `Recommendation.precautionary` and `precautionaryJustification`, two new review questions. Automatic v1 → v2 migration for stored projects and backups.

### CI and tests
- CI: lint, type-check, unit tests and production build on every PR and push; Playwright acceptance tests; deploy only from `main` after both pass; failure artifacts kept 14 days; checkout/setup-node/upload-artifact/cache actions upgraded.
- Tests: 55 unit tests (from 22) and 26 acceptance tests (from 12), with a regression test for every fixed defect.

## 1.0.0
- First release: dashboard, seven step workspaces with coaching, executive report (EN/AR), JSON backup/import, offline PWA, illustrative groundwater-well sample.
