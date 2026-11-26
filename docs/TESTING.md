# Testing report

**Version:** 1.1.0 · **Date:** 26 November 2026 · **Branch:** `feature/v1.1-quality-enhancements`
**Browser:** Chromium via Playwright (Google Chrome locally), against the production build served under `/problemsolving-lab/`.

| Check | Command | Result |
|-------|---------|--------|
| Type-check | `npm run typecheck` | ✅ no errors |
| Lint | `npm run lint` (oxlint, used instead of ESLint) | ✅ 0 errors · 23 warnings (React fast-refresh export style, `Date` read during render; none affects behaviour) |
| Unit tests (Vitest) | `npm test` | ✅ 89 / 89 in 6 files |
| Production build | `npm run build` | ✅ 19 precached entries (≈ 956 KiB) |
| Acceptance tests (Playwright) | `npm run test:e2e` | ✅ 36 / 36 in 3 files |

Every end-to-end test also fails if the browser logs a console error or an uncaught exception. CI runs the same checks on every pull request and on `main` (see README → Deployment).

## Unit tests

| File | Covers |
|------|--------|
| `src/lib/saveQueue.test.ts` (21) | Failed snapshots retained and persisted on retry; back-off schedule, then *Retry required*; manual retry; one write at a time with coalescing; an older snapshot never overwrites a newer one; delete waits for the in-flight write; no debounce timer. **Flush semantics:** concurrent flushes both wait for every write; a flush during an active write does not resolve before it commits; an edit that arrives during a flush and then fails is reported; rapid edits write only the latest snapshot. **Recovery journal:** copies taken on failure, none on healthy saves, journal failure reported, `hold()` marks a restored snapshot unsaved. **Lifecycle:** flush on hidden, best-effort flush on `pagehide`, confirmation on `beforeunload` only when unsaved, a recovery copy before flushing, unregister |
| `src/lib/backup.test.ts` (6) | Backup reminder: no nagging on a new project; reminder after a week without a backup; a backup covers a project until it changes; a recent backup never reminds; *Later* snoozes for three days; only exported projects are recorded |
| `src/lib/journal.test.ts` (3) | Store / list / remove; failure reported when storage is full or missing; unreadable entries cleaned up |
| `src/store/projects.test.ts` (8) | Store-level persistence with a faulty storage double: D1 regression; reload returns stored data; reload after a failed write restores the journal copy (D7); same-timestamp copy restored only if different; stale copy ignored and removed; never-stored project restored; delete removes the copy; indicator states saving → saved and failure → retrying with unsaved count |
| `src/lib/evaluation.test.ts` (29) | All five finding classes with their reasons; quality profile and missing analysis limitations. All five recommendation states (backed, partial, precautionary only with a justification, investigate, unsupported for no finding or a broken chain), issues addressed and limitations. Define and analyses states; empty project with no vacuous passes; v1 → v2 migration; structure observations (which never change the review); synthesis warnings |
| `src/lib/core.test.ts` (22) | Tree operations, referential integrity on delete, import validation and sanitising, duplication with remapped ids, MECE signature, sample four-state evaluation, prioritization, SMART hints |

## Acceptance tests

### Full 17-step workflow — `tests/e2e/journey.spec.ts`

One test drives a new project through every step of brief §9 without using the sample:

1. Create a project.
2. Define a SMART problem.
3. Build an issue tree.
4. Complete a documented MECE review, including the review record.
5. Prioritize.
6. Create a work plan.
7. Record analyses.
8. Attach a verified fact (with its verification) and an observation.
9. Record a finding.
10. Record its insight, implication, so what and decision relevance.
11. Create a recommendation; it is *evidence-backed* and traces back to the issue.
12. Generate the 13-section report.
13. Export the data.
14. Delete the project and import the data again.
15. Reload and check persistence.
16. Switch Arabic ↔ English.
17. Work offline.

**Failure recovery** is covered by the Phase 1 tests below: storage is forced to fail, the page reloads, and the change is recovered.

### Original criteria (brief v1.0, §9) — `tests/e2e/app.spec.ts`

| # | Criterion | Result |
|---|-----------|--------|
| 1–2 | Create, save, reload, persistence | ✅ |
| — | SMART hints never set the verdict; the draft uses only user text | ✅ |
| 3–4 | Issue tree editing; review workflow (six questions; acceptance stays disabled until all are answered consistently) | ✅ |
| 5–9 | Prioritize → work plan → analyses → findings → recommendations, with links and traceability | ✅ |
| 10 | Report with all 13 sections; print; A4 PDF render | ✅ |
| 11 | JSON export / import / copy-on-reimport / invalid file rejected | ✅ |
| — | Dashboard duplicate, archive, delete with confirmation | ✅ |
| 12–13 | Arabic / English switch, RTL layout, independent report language | ✅ |
| 14 | Offline after first visit | ✅ |
| 15 | No horizontal overflow at 390, 820 and 1180 px | ✅ (3 tests) |
| 16 | Base path, manifest, service worker, hash deep links | ✅ |

### v1.1 — `tests/e2e/v11.spec.ts`

Storage faults are simulated by making `IDBObjectStore.put` throw a `QuotaExceededError`.

| Area | Test | Result |
|------|------|--------|
| Saving | One failed write: banner and *retrying* state, automatic retry, value persists after reload | ✅ |
| Saving | Persistent failure: the change stays in the tab, *Retry now* reports it is still failing, *Export backup* contains the unsaved change, recovery once storage returns | ✅ |
| Saving | **D7:** reload while writes are failing → the change is restored from the recovery copy, with a notice, and saved | ✅ |
| Saving | The indicator distinguishes queued (*Unsaved changes* / *Saving…*) from persisted (*Saved*) | ✅ |
| Saving | Import during a storage failure reports it rather than claiming success | ✅ |
| Evidence | Sample: *complete with documented limitations*; removing a finding's documented uncertainty → *needs further evidence* | ✅ |
| Evidence | A broken chain makes a recommendation *unsupported*; precautionary without a justification → *incomplete*, with one → *precautionary*; never shown as evidence-backed in the report | ✅ |
| Structure | Role tags feed the causes-vs-symptoms observation; observations don't change acceptance; a non-MECE answer withdraws acceptance | ✅ |
| Structure | Near-duplicate, tree-type and untagged observations on a weak tree | ✅ |
| Structure | Review record and tree comparison are stored and appear in the report | ✅ |
| Synthesis | Ladder and worked example; restatement warning; the *“Because …, …”* draft uses only the user's words | ✅ |
| Synthesis | Worksheet, decision relevance and evidence-quality panel | ✅ |
| Report | 13 sections; evidence register by class; verified vs. other findings; reasoning chain for each recommendation | ✅ |
| Migration | A v1 backup imports, upgrades to v2 and shows the new-questions notice | ✅ |
| Backups | The panel counts projects not backed up; *Download backup* records a backup that survives reload; a later edit makes the project pending again | ✅ |
| Backups | A week without a backup shows the reminder; *Later* hides it across reloads | ✅ |
| Backups | Phone (390 px), English and Arabic: no overflow; *Share backup* hands a full backup file to the share sheet and records it | ✅ |
| Backups | Cancelling the share sheet does not count as a backup | ✅ |

## Regression tests for every defect fixed

Defects D1–D8 are those confirmed in [`V1.1_IMPLEMENTATION_PLAN.md`](V1.1_IMPLEMENTATION_PLAN.md). Each was reproduced before it was fixed.

| Defect (found in) | Fixed by | Regression test |
|-------------------|----------|-----------------|
| **D1** A failed IndexedDB write was dropped and never retried (v1.0) | The save queue keeps failed snapshots | unit “D1 regression…” (fails on `main`), “keeps a failed snapshot…”; e2e Phase 1 |
| **D2** `flush()` reported success after a failure (v1.0) | Returns `{ ok, unsaved, error }` | unit “flush resolves with a failure report…”, flush-semantics tests |
| **D3** Deleting during an in-flight write could recreate the project (v1.0) | `discard()` waits for the write | unit “discard waits for the in-flight write…”, store “deleting a project removes its recovery copy…” |
| **D4** Import claimed success when storage failed (v1.0) | Import checks the write result | e2e “import reports a storage failure…” |
| **D5** Findings backed only by inconclusive or untested analyses counted as complete (v1.0) | Five finding classes | unit finding-class table; e2e Evidence tests |
| **D6** A broken recommendation chain counted as traceable (v1.0) | Recommendation states | unit “a broken chain is unsupported…”; e2e Evidence tests |
| **D7** Unsaved changes were lost on reload while storage was failing (v1.1 first pass) | Recovery journal | unit store “reload after a failed write…”; e2e “D7: reload after a failed write…” |
| **D8** The dialog Escape handler referenced `close` before its declaration (v1.1 lint) | Self-contained handler | e2e “Escape cancels a confirmation dialog…” |
| Latin text in the issue tree spilled outside its boxes in RTL (v1.0) | SVG pinned to LTR, layout mirrored | e2e “RTL: Latin text…” |
| Debounced saving could lose an edit made just before a reload (v1.0) | Immediate writes | unit “starts writing immediately — no debounce timer” |
| An empty project showed progress through vacuous criteria (v1.0; recurred with the SMART criteria in v1.1) | Criteria require substance or an explicit assessment | unit “an empty project is incomplete everywhere”; e2e “an empty project shows 0%…” |
| Horizontal overflow on phones: step navigation (v1.0) and the synthesis draft button (v1.1) | Both wrap | e2e responsive tests, journey test |
| Offline-ready message in English when the interface was Arabic (v1.0) | Reads the current language | e2e “the offline-ready message follows the interface language” |
| Coaching pushed the workspace down on tablets (v1.0) | Folded below 1280 px | e2e “on tablets the coaching panel is folded…” |
| Reload within milliseconds of an action aborted the write (v1.0, CI run #2) | Unsaved-change confirmation; tests wait for *Saved* | unit lifecycle tests; e2e dashboard test |

## Changed expectations

No test was removed or weakened. These assertions changed because the behaviour changed on purpose:

| Assertion | Before | Now | Why |
|-----------|--------|-----|-----|
| Report sections | 11 | 13 | New evidence register, implementation plan, and risks and outstanding questions sections |
| Sample finding classes | *provisional* | *partially supported* and *inconclusive* | Five classes replace three (brief P1) |
| Sample recommendation 2 | *backed with limitations* | *partially supported* | New recommendation states |
| Synthesis draft | “insight — implication” | “Because insight, implication.” | Brief P3 synthesis aid |
| Saved label | “All changes saved” | “Saved — all changes stored on this device” | Brief P0 state names |
| Completion checks | “Step complete” label | `data-status` attribute | Four explicit states |
| Store indicator | expected *saving* after an edit | *saved* | The storage double writes synchronously; *Saving…* is still asserted in e2e |
| MECE test | four questions | six questions answered | Two new review questions |

## Known limitations

- **Closing the tab.** The app writes on every edit, flushes and takes a synchronous recovery copy when the tab is hidden or closed, and asks for confirmation before closing with unsaved changes. A browser may still abort an asynchronous IndexedDB write started during `pagehide` or `beforeunload`; that is **not** guaranteed to complete. The recovery copy is what makes the change recoverable on the next start.
- **Recovery copy size.** The journal uses `localStorage` (≈ 5 MB per site in most browsers). If that is also full or blocked, the banner says the recovery copy could not be stored either and asks you to export a backup.
- **Retries** stop after four automatic attempts (≈ 44 s). Unsaved changes then stay in the tab (and the recovery copy) until *Retry now*, the next edit, or the tab is hidden.
- **Structure observations and SMART hints** are heuristics (English and Arabic keywords, word overlap). They prompt reflection and never decide.
- **Evidence quality** affects classes only through the ratings the user enters (a *low* rating is a reservation). Unrated evidence is reported, not penalised. There are no numeric thresholds.
- **Lint.** oxlint is used instead of ESLint (one dependency, no plugin set). Its 23 warnings are style-level; CI fails on errors.
- **Pages deploy actions** (`configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v4`) are kept at their proven versions. They still trigger GitHub's Node 20 deprecation notice. They run only on `main`, so upgrade them in a separate change that can be verified with a deploy.
- **PDF** output uses the browser's *Print → Save as PDF*. Issue-tree image export uses system fonts.
- **Storage protection** depends on the browser. Chrome usually grants it to installed apps; Safari decides on its own. The panel shows the actual answer.
- **Share backup** appears only where the device can share files (most Android and iOS phones). The share is recorded only when the share sheet completes; whether the receiving app then stored the file is outside the app's knowledge.
- **Collaboration and sync** are not included. Projects live in one browser; use backups to move them.
