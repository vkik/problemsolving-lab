# Testing report

**Version:** 1.1.0 · **Date:** 24 November 2026 · **Branch:** `feature/v1.1-quality-enhancements`
**Browser:** Chromium via Playwright (Google Chrome locally), against the production build served under `/problemsolving-lab/`.

| Check | Command | Result |
|-------|---------|--------|
| Type-check | `npm run typecheck` | ✅ no errors |
| Lint | `npm run lint` (oxlint) | ✅ 0 errors · 22 warnings (React fast-refresh export style, `Date` read during render; none affects behaviour) |
| Unit tests (Vitest) | `npm test` | ✅ 55 / 55 in 3 files |
| Production build | `npm run build` | ✅ 19 precached entries (≈ 922 KiB) |
| Acceptance tests (Playwright) | `npm run test:e2e` | ✅ 26 / 26 in 2 files |

Every end-to-end test also fails if the browser logs a console error or an uncaught exception. CI runs the same checks on every pull request and on `main` (see README → Deployment).

## Unit tests

| File | Covers |
|------|--------|
| `src/lib/saveQueue.test.ts` (12) | Failed snapshots retained and persisted on retry; back-off schedule then `failed`; manual retry; `flush()` reports failure; one write at a time with coalescing; an older snapshot never overwrites a newer one after a failure; delete waits for the in-flight write; unsaved detection; no debounce timer. Tab lifecycle: flush on hidden, flush on `pagehide`, confirm on `beforeunload` only when unsaved, unregister |
| `src/lib/evaluation.test.ts` (21) | Finding support (validated / unlinked / provisional for each reason; documented uncertainty → limitation, undocumented → needs evidence; evidence classes stay distinct). Recommendation chains (backed, limited, broken → unsupported, precautionary only with a justification, investigate = n/a). Analyses and define states. Empty project: no vacuous passes. v1 → v2 migration. Structure observations (and that they never change the review). Synthesis restatement and sentence-count warnings |
| `src/lib/core.test.ts` (22) | Tree operations, referential integrity on delete, import validation and sanitising, duplication with remapped ids, MECE signature, sample four-state evaluation, prioritization, SMART hints |

## Acceptance tests

### Original criteria (brief v1.0, §9) — `tests/e2e/app.spec.ts`

| # | Criterion | Result |
|---|-----------|--------|
| 1–2 | Create, save, reload, persistence | ✅ |
| 3–4 | Issue tree editing; review workflow (now six questions — acceptance stays disabled until all are answered consistently) | ✅ |
| 5–9 | Prioritize → work plan → analyses → findings → recommendations, with links and traceability | ✅ |
| 10 | Report with all 11 sections; print; A4 PDF render | ✅ |
| 11 | JSON export / import / copy-on-reimport / invalid file rejected | ✅ |
| — | Dashboard duplicate, archive, delete with confirmation | ✅ |
| 12–13 | Arabic / English switch, RTL layout, independent report language | ✅ |
| 14 | Offline after first visit | ✅ |
| 15 | No horizontal overflow at 390, 820 and 1180 px | ✅ (3 tests) |
| 16 | Base path, manifest, service worker, hash deep links | ✅ |

### v1.1 — `tests/e2e/v11.spec.ts`

Storage faults are simulated by making `IDBObjectStore.put` throw a `QuotaExceededError`.

| Phase | Test | Result |
|-------|------|--------|
| 1 | One failed write: banner and *retrying* state, automatic retry, value persists after reload | ✅ |
| 1 | Persistent failure: change kept in the tab, *Retry now* reports still failing, *Export backup* contains the unsaved change, recovery after storage returns, value persists | ✅ |
| 1 | Import during a storage failure reports it rather than claiming success; recovery | ✅ |
| 2 | Sample: synthesis *complete with documented limitations*; removing a finding's documented uncertainty → *needs further evidence* | ✅ |
| 2 | Breaking finding 1's chain makes its recommendation *unsupported* and the step *needs further evidence*; precautionary without a justification → *incomplete*, with one → *precautionary* and *complete with limitations*; the report never shows it as evidence-backed | ✅ |
| 3 | Role tag feeds the causes-vs-symptoms observation; observations don't change acceptance; a non-MECE answer withdraws acceptance | ✅ |
| 3 | Near-duplicate, tree-type and untagged observations on a weak tree | ✅ |
| 4 | Synthesis ladder and worked example; restatement warning; one-sentence draft built only from the user's insight and implication | ✅ |
| — | A v1 backup imports, upgrades to v2 and shows the new-questions notice | ✅ |

## Regression tests for every defect fixed

| Defect (found in) | Fixed by | Regression test |
|-------------------|----------|-----------------|
| Latin text in the issue tree spilled outside its boxes in RTL (v1.0) | SVG pinned to LTR, layout mirrored | e2e “RTL: Latin text in the issue tree stays inside its boxes” |
| Debounced saving could lose an edit made just before a reload (v1.0) | Immediate writes | unit “starts writing immediately — no debounce timer” |
| Empty project showed progress through vacuous criteria (v1.0; recurred with new SMART criteria in v1.1) | Criteria require substance | unit “an empty project is incomplete everywhere”; e2e “an empty project shows 0%…” |
| 3 px horizontal overflow on phones (v1.0) | Step navigation wraps | e2e responsive tests |
| Offline-ready message in English when the interface was Arabic (v1.0) | Reads the current language | e2e “offline-ready message follows the interface language” |
| Coaching pushed the workspace down on tablets (v1.0) | Folded below 1280 px | e2e “on tablets the coaching panel is folded…” |
| Reload within milliseconds of an action aborted the write (v1.0, CI run #2) | Unsaved-change confirmation; tests wait for “saved” | unit lifecycle `beforeunload` tests; e2e dashboard test |
| Dialog Escape handler referenced `close` before its declaration (v1.1 lint) | Self-contained handler | e2e “Escape cancels a confirmation dialog…” |
| **Failed IndexedDB writes were discarded** (v1.1 audit) | Save queue keeps failed snapshots | unit “keeps a failed snapshot…”; e2e Phase 1 tests |
| `flush()` reported success after a failure (v1.1 audit) | Returns `{ ok, unsaved, error }` | unit “flush resolves with a failure report…” |
| Deleting during an in-flight write could recreate the project (v1.1 audit) | `discard()` waits for the write | unit “discard waits for the in-flight write…” |
| Import claimed success when storage failed (v1.1 audit) | Import checks the write result | e2e “import reports a storage failure…” |
| Findings backed only by inconclusive/untested analyses counted as fully complete (v1.1 audit) | Finding support levels | unit “provisional when …”; e2e Phase 2 |
| A recommendation with a broken chain counted as traceable (v1.1 audit) | Recommendation chain rules | unit “a broken chain is unsupported…”; e2e Phase 2 |

No existing test was removed or weakened. The v1.0 MECE test now also answers the two new questions. The completion assertions now check the explicit state attribute instead of the old “Step complete” label.

## Known limitations

- **Closing the tab.** The app saves on every edit, flushes when the tab is hidden and asks for confirmation before closing with unsaved changes. A write that starts while the page is being closed may still be aborted by the browser; this cannot be guaranteed by a web app.
- **Retries** stop after four automatic attempts (≈ 44 s). Unsaved changes then stay in the tab until *Retry now*, the next edit, or the tab is hidden.
- **Structure observations and SMART hints** are heuristics (English and Arabic keywords, word overlap). They prompt reflection and never decide.
- **Evidence quality** affects status only through the ratings the user enters (low reliability, accuracy or confidence). Unrated evidence is not penalised.
- **PDF** output uses the browser's *Print → Save as PDF*. Issue-tree image export uses system fonts.
- **Lint warnings** (22) are style-level (fast-refresh export structure); lint fails CI only on errors.
- **Pages deploy actions** (`configure-pages`, `upload-pages-artifact`, `deploy-pages`) are kept at their proven major versions. They still trigger GitHub's Node 20 deprecation notice; they only run on `main`, so upgrade them in a separate change that can be verified with a deploy.
- **Collaboration and sync** are not included. Projects live in one browser; use backups to move them.
