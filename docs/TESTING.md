# Testing report

**Version:** 1.0.0 · **Date:** 24 November 2026 · **Browser:** Google Chrome (headless, via Playwright) against the production build served under `/problemsolving-lab/`.

| Suite | Command | Result |
|-------|---------|--------|
| Type-check | `npm run typecheck` | ✅ no errors |
| Unit tests (Vitest) | `npm test` | ✅ 22 / 22 passed |
| End-to-end acceptance (Playwright) | `npm run test:e2e` | ✅ 12 / 12 passed, no browser console errors |

Every end-to-end test also fails if the browser logs any console error or uncaught exception.

## Acceptance criteria (brief §9)

| # | Criterion | How it is verified | Result |
|---|-----------|--------------------|--------|
| 1 | Create and save a project | E2E 1–2: create via dashboard modal, fill worksheet fields, wait for the “All changes saved” state | ✅ |
| 2 | Reload and confirm persistence | E2E 1–2: reload the page and check field values and the dashboard card (title, current stage) | ✅ |
| 3 | Create and edit an issue tree | E2E 3–4: add branches and sub-issues, Enter for a sibling, Shift+Tab to outdent, delete with confirmation, visual tree node count. Unit: add, move, indent, outdent and remove operations | ✅ |
| 4 | MECE review workflow | E2E 3–4: “accepted” is disabled until all four answers are MECE-consistent; a non-MECE answer is flagged; after acceptance, changing the tree shows a warning and the step is no longer complete | ✅ |
| 5 | Prioritize issues | E2E 5–9: impact/feasibility scoring, score = 9, quadrant list, matrix chips, selection with justification, step complete | ✅ |
| 6 | Create a work plan | E2E 5–9: coverage warning for selected issues, task from issue, owner and dates, **overdue** indicator, timeline, status filter | ✅ |
| 7 | Record multiple analyses | E2E 5–9: analysis started from a task (hypothesis carried over), a second analysis added, evidence recorded | ✅ |
| 8 | Link findings to evidence | E2E 5–9: finding linked to evidence; warnings for unlinked or multi-sentence synthesis appear and then clear | ✅ |
| 9 | Generate recommendations | E2E 5–9: recommendation with owner, deadline, KPI and verification, linked to a finding; traceability shows the finding’s verified evidence | ✅ |
| 10 | Generate and print the report | E2E 5–9: all 11 sections present and populated; the Print button calls `window.print()`; Chrome renders an A4 PDF of the report | ✅ |
| 11 | Export and import a JSON backup | E2E 11: download backup → delete project → import → restored; re-import creates a copy; malformed file rejected with a message. Unit: lossless round-trip of the sample, sanitising of bad input | ✅ |
| 12 | Switch Arabic / English | E2E 12–13: interface switches, user text unchanged, preference persists after reload; report language set independently | ✅ |
| 13 | RTL layout | E2E 12–13: `<html dir="rtl" lang="ar">`, step navigation on the right, Arabic text rendered in the tree, report `dir` follows report language. Visually checked with screenshots | ✅ |
| 14 | Offline functionality | E2E 14: service worker controls the page → network set offline → navigation, edits and reload all work; offline indicator shown | ✅ |
| 15 | Responsive layouts | E2E 15: phone 390 px, tablet 820 px, tablet landscape 1180 px — no horizontal page overflow on the workspace, all seven steps or the report. Visually checked | ✅ |
| 16 | GitHub Pages deployment | E2E 16: assets, manifest and `sw.js` resolve under the base path; hash deep links work on a static host. Live deployment: see README | ✅ locally |

Additional checks: duplicate, archive and delete with confirmation (E2E); SMART hints never set a verdict, and the drafted statement contains only the user’s text (E2E and unit); assumption → fact requires a verification note, and cancelling keeps it an assumption (E2E); imported unverified “facts” become assumptions (unit); duplication keeps every link with fresh ids (unit); the sample project’s completion status is realistic (unit).

## Defects found during testing and fixed

| Defect | Found by | Fix |
|--------|----------|-----|
| In Arabic, Latin text in the issue-tree SVG inherited RTL direction and spilled outside its boxes | RTL screenshots | The SVG coordinate system is pinned to LTR; mirroring is handled by the layout; Arabic lines are right-aligned |
| An edit made less than 400 ms before a reload or tab close could be lost (debounced saving) | E2E offline and dashboard tests | Writes now start immediately and coalesce while one is in flight |
| An empty project showed 3% progress (a vacuously true criterion) | Unit test | The criterion requires at least one recommendation |
| 3 px horizontal overflow on phones from the Next-step button | E2E responsive test | Step navigation buttons wrap |
| “Ready to work offline” toast appeared in English when the interface was Arabic | Screenshot | Toast reads the current language when it fires |
| Coaching panel pushed the workspace far down on phones and tablets | Screenshot | Folded into one collapsible “Coaching” section below 1280 px |

## Known limitations

- **PDF** is produced with the browser’s *Print → Save as PDF* (print stylesheet, A4, page breaks between major sections). No PDF library is bundled, which keeps the app small and fully offline.
- **Issue-tree image export** uses system fonts, because an SVG drawn to a canvas cannot use web fonts. Arabic renders correctly with any system Arabic font.
- **SMART hints** are keyword heuristics (English and Arabic). They prompt reflection; the assessment itself is always the user’s.
- **Collaboration** is not in version 1. The data model (stable ids, timestamps, JSON backups) is ready for a future sync layer.
- **Storage is per browser.** Clearing site data deletes projects; use backups to move between devices.
- The **sample project** is in English; the interface around it switches to Arabic normally.
