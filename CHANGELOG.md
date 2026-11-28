# Changelog

## 1.2.0 — Somali language

- **Somali (Soomaali)** is now a third language for the interface, coaching, completion criteria, quality checks, the About page and the report. The report language is still chosen independently.
- The header language button became a menu with three choices (English, العربية, Soomaali).
- SMART hints recognise Somali question, time, unit, vague and broad words, so well-formed Somali questions do not get false hints.
- The step header lets long status labels wrap instead of squeezing the title.
- New: `docs/TRANSLATION.md` (glossary and how to add a language). Tests: `src/i18n/so.test.ts` checks that every string is translated and keeps its placeholders; `tests/e2e/somali.spec.ts` checks the Somali interface, report and phone layout.
- The Somali text is a first draft and should be reviewed by a native speaker.

## 1.1.0 — Quality, reliability and methodology enhancement

Full notes: [`docs/V1.1_CHANGELOG.md`](docs/V1.1_CHANGELOG.md).

- **Saving:** failed writes are kept and retried; explicit save states; a recovery copy restores unsaved changes after a reload or close while storage is failing; `flush()` reports failures.
- **Backups:** a dashboard panel with the last backup and storage protection status, *Share backup* to Drive/WhatsApp/email on phones, and a weekly reminder.
- **Evidence:** five finding classes, five recommendation states and four step states, each with its reasons; an evidence-quality panel.
- **Structure:** a six-question review with a review record and branch roles; acceptance stays human.
- **Synthesis:** a ladder from data to decision relevance, a worksheet and a *“Because …, …”* draft from the user's own words.
- **Report:** 13 sections with an evidence register and a reasoning chain for each recommendation.
- **CI and tests:** lint, type-check, unit, build and e2e on every PR; deploy only from `main` after checks pass; 89 unit and 36 acceptance tests.

## 1.0.0
- First release: dashboard, seven step workspaces with coaching, executive report (EN/AR), JSON backup/import, offline PWA, illustrative groundwater-well sample.
