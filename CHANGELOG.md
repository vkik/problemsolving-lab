# Changelog

## 1.1.0 — Quality, reliability and methodology enhancement

Full notes: [`docs/V1.1_CHANGELOG.md`](docs/V1.1_CHANGELOG.md).

- **Saving:** failed writes are kept and retried; explicit save states; a recovery copy restores unsaved changes after a reload or close while storage is failing; `flush()` reports failures.
- **Evidence:** five finding classes, five recommendation states and four step states, each with its reasons; an evidence-quality panel.
- **Structure:** a six-question review with a review record and branch roles; acceptance stays human.
- **Synthesis:** a ladder from data to decision relevance, a worksheet and a *“Because …, …”* draft from the user's own words.
- **Report:** 13 sections with an evidence register and a reasoning chain for each recommendation.
- **CI and tests:** lint, type-check, unit, build and e2e on every PR; deploy only from `main` after checks pass; 83 unit and 32 acceptance tests.

## 1.0.0
- First release: dashboard, seven step workspaces with coaching, executive report (EN/AR), JSON backup/import, offline PWA, illustrative groundwater-well sample.
