# ProblemSolving Lab — From Problem to Action

A practical problem-solving workspace that guides professionals through the **seven-step problem-solving method taught in the McKinsey.org Forward Program**. You can apply it to real organizational, engineering, infrastructure, water, environmental and management problems.

It is a working lab rather than a set of forms. Each step coaches you to think before it reveals guidance, checks the quality of what you produce, and keeps every link in the chain, from the problem to the recommended action:

```
Problem → Issues → Priorities → Work plan → Analyses (evidence) → Findings → Recommendations
```

**Live app:** https://vkik.github.io/problemsolving-lab/

> **Disclaimer.** This is an independent learning and practice tool. It is **not** an official McKinsey product and is **not** endorsed by McKinsey & Company or McKinsey.org.

---

## The seven steps

| # | Step | Ask yourself | Use |
|---|------|--------------|-----|
| 1 | Define the problem | What do we need to know, and why does it matter? | A SMART question and the Problem Statement Worksheet |
| 2 | Structure the problem | What are the pieces, and what might the answer be? | An issue tree, checked for MECE |
| 3 | Prioritize the issues | Which issues matter most, right now? | The impact and feasibility matrix |
| 4 | Develop the work plan | Where and how should we spend our time? | The Work Plan Worksheet, with an owner and date for each issue |
| 5 | Conduct analyses | What are we trying to prove or disprove? | Analyses that test the hypothesis, not just related data |
| 6 | Synthesize findings | So what do the findings mean? | One sentence: an insight plus its implication |
| 7 | Develop recommendations | What should we do? | A clear action with an owner and a timeline |

## Features

- **Dashboard.** Create, open, duplicate, archive and delete projects. Each card shows completion, current stage, outstanding and overdue items, and creation and modification dates.
- **Step 1, Define.** The full Problem Statement Worksheet, plus a SMART assessment that you judge yourself. Automatic hints flag vague, broad, unmeasured or untimed questions, in English and Arabic. *The app never invents targets, statistics, deadlines or baselines.*
- **Step 2, Structure.** Issue tree builder:
  - Unlimited levels; add, edit, delete, reorder, indent/outdent, and collapse/expand branches. Keyboard: Enter adds a sibling, Tab indents, Shift+Tab outdents.
  - A visual tree, exportable as PNG or SVG, with an issue-tree vs. hypothesis-tree choice.
  - **Guided structure review (MECE).** Six questions: relevance, mutually exclusive, collectively exhaustive, consistent logic, causes vs. symptoms and consequences, and tree type. Each comes with an explanation and automatic observations (near-duplicate siblings, single-child branches, too many siblings, mixed questions and statements, tagged symptoms or consequences, content that doesn't match the tree type).
  - The observations never answer a question. Acceptance stays a documented human judgement: it needs all six consistent answers, and it is flagged again if the tree changes afterwards.
  - A **review record**: overlaps found, missing areas, corrections made, reviewer and comments. It is shown in the report.
  - A **role** for each branch: driver/component, root cause, contributing factor, symptom or consequence.
  - A side-by-side note on **issue trees vs. hypothesis trees**, to help choose the right one.
  - Fields for the hypothesis, rationale, alternatives and unknowns.
- **Step 3, Prioritize.** Low/Medium/High impact and feasibility with a written rationale.
  - A 1–9 score and a 3×3 matrix.
  - Four-corner lists; medium ratings are kept apart for review rather than forced into a corner.
  - A separate **confidence** rating, so priority is never confused with certainty.
  - Manual ranking, and a justified selection of what goes into the work plan.
- **Step 4, Work plan.** An editable task table linking each issue to a hypothesis, question, data, source, method, owner, dates, output and status.
  - Coverage check: every selected issue must have an analysis.
  - Progress and overdue indicators, filters by issue, owner and status, and a timeline.
- **Step 5, Analysis Lab.** Each analysis is linked to an issue, a task and a hypothesis, and records:
  - Evidence classed as verified fact, observation, assumption, interpretation or external.
  - Five-factor evidence quality ratings and hypothesis-test results.
  - Correlation vs. causation, limitations, missing information and a revised hypothesis.
  - **An assumption can never silently become a verified fact.** Re-classifying requires a recorded verification, and imports enforce the same rule.
- **Step 6, Synthesis.**
  - A **data → finding → insight → implication → so what? → decision relevance** ladder, with definitions, prompts, an illustrative worked example and a seven-question worksheet. Each finding is written rung by rung, with an optional note on what you believed before the analysis.
  - The Forward playbook's one-sentence *insight + implication*, with a *“Because …, …”* draft built only from your own words. Warnings flag multi-sentence synthesis, a missing implication, or an insight that only restates the finding.
  - **Evidence class** for every finding, always shown with its reasons:
    - *verified*: tested and strongly evidenced, no reservations;
    - *partially supported*: tested and strongly evidenced, with reservations;
    - *preliminary*: not tested, or only assumptions or interpretations;
    - *inconclusive*: the analyses were inconclusive;
    - *unsupported claim*: no links, or links with nothing recorded.
  - An **evidence-quality panel** for each finding (reliability, accuracy, completeness, recency, confidence) and whether each analysis documents its limitations.
  - The four-question **So what?** test and ranked insights.
- **Step 7, Recommendations.**
  - All required fields, time horizons (immediate, short, medium, long term), and recommended / further investigation / rejected-with-justification.
  - Full traceability: Recommendation → Finding → Analysis → Evidence, including the **issues addressed** and the **limitations affecting** each action.
  - A state for each action, with its reason: *evidence-backed*, *partially supported*, *precautionary*, *requires further investigation* or *unsupported*. An action is never shown as evidence-backed when its chain is broken.
  - **Precautionary actions** are allowed when explicitly marked and justified.
- **Evidence-based completion.** Each step is *Complete*, *Complete with documented limitations*, *Needs further evidence* or *Incomplete*. A quality-check list shows why. Documented uncertainty is accepted; unsupported claims are not counted as complete. The screens separate what you enter, automatic validation, the methodological review and the completion status.
- **Reliable saving.** Edits are written to storage immediately, one write at a time. The header shows *Saving…*, *Unsaved changes*, *Saved — all changes stored on this device*, *Save failed — retrying* or *Retry required*. *Saved* appears only after storage confirms the write.
  - If the browser refuses a write (storage full or blocked), the change is kept in the tab and retried automatically (after 1, 3, 10 and 30 s).
  - A **recovery copy** is kept in `localStorage` while a change is unsaved after a failure, and when the tab is hidden or closed with pending changes. On the next start, a copy newer than storage is restored and saved again, with a notice naming the project.
  - A banner offers *Retry now* and *Export backup*, and says whether the recovery copy could be stored. The app asks for confirmation before you close a tab with unsaved changes.
- **Executive report.** It compiles all seven steps into thirteen sections in English or Arabic, independently of the interface language:
  - an evidence register grouped by class (facts, observations, external evidence, assumptions, interpretations);
  - verified conclusions kept apart from partially supported, preliminary and inconclusive findings;
  - a reasoning chain for every recommendation;
  - an implementation plan, and risks and outstanding questions.

  Print it or save it as PDF, and export it as a JSON backup.
- **Coaching on every step.**
  - Purpose, method, expected output, a practical example, common mistakes, guiding questions, a quality checklist and completion criteria.
  - **Think Deeper**: you write your own answer before the coaching prompt is revealed.
- **Bilingual.** English (default) and Arabic with full right-to-left layout. User content is never altered when you switch.
- **Private and offline.** No login, no backend, no external AI and no third-party calls. Data stays in IndexedDB on your device, and the app works offline after the first visit (installable PWA).
- **Illustrative sample.** “A newly drilled groundwater well failed to achieve its expected performance during the pumping test” walks through all seven steps without assuming the cause and without invented test values.

## Technology

React 19 · TypeScript · Vite · Tailwind CSS · Zustand · IndexedDB (`idb`) · LocalStorage (preferences only) · `vite-plugin-pwa` (Workbox service worker) · lucide icons · self-hosted Inter and IBM Plex Sans Arabic fonts. The issue tree is custom SVG, with no chart library dependency.

Routing uses hash URLs (`/#/p/<id>/step/define`), so every deep link works on GitHub Pages and offline without server rewrites.

## Quick start

```bash
npm ci
npm run dev          # http://localhost:5173/problemsolving-lab/
```

| Script | What it does |
|--------|--------------|
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build on port 4173 |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end acceptance tests (Playwright; builds and serves automatically) |
| `npm run lint` | Lint with [oxlint](https://oxc.rs) (used instead of ESLint: one dev dependency, no plugin set; CI fails on errors) |
| `npm run typecheck` | TypeScript project check without emitting |

## Deployment (GitHub Pages)

Deployment is automated by `.github/workflows/deploy.yml`.

1. Push this project to a GitHub repository, for example `problemsolving-lab`.
2. In the repository, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions** (one-time setting).
3. Push to `main`. The workflow (`.github/workflows/deploy.yml`):
   - **quality** job: lint, type-check, unit tests and the production build (with `BASE_PATH=/<repository-name>/`);
   - **e2e** job: Playwright acceptance tests in Chromium;
   - **deploy** job: publishes `dist/` to Pages, only on pushes to `main` and only if both other jobs passed.

   Pull requests run the quality and e2e jobs, including the production build, but never deploy. On failure, the Playwright report and traces (or the unit-test JUnit report) are kept as artifacts for 14 days.
4. The site is published at `https://<user>.github.io/<repository-name>/`.

The base path is derived from the repository name, so a renamed repository keeps working. Local builds default to `/problemsolving-lab/`; override with `BASE_PATH=/other/ npm run build`.

To test the live site: `E2E_BASE_URL=https://<user>.github.io/problemsolving-lab/ npx playwright test`.

## Maintaining and updating

| Task | Where |
|------|-------|
| Interface text | `src/i18n/en.ts` and `src/i18n/ar.ts`. The Arabic file is type-checked against the English keys, so a missing translation fails the build. |
| Coaching content (method, examples, mistakes, checklists, Think Deeper) | `src/content/coaching.ts` |
| Completion criteria and states | logic in `src/lib/progress.ts`, labels in `src/content/criteria.ts` (`CRITERIA`, `CHECKS`) |
| Evidence-chain rules (finding support, recommendation chains, analysis warnings) | `src/lib/evidence.ts` |
| Structure review observations | `src/lib/structureChecks.ts` |
| Saving, retries, tab lifecycle | `src/lib/saveQueue.ts`, `src/lib/lifecycle.ts`, `src/store/projects.ts` |
| SMART hint rules | `src/lib/smart.ts` |
| Data model | `src/lib/types.ts`, documented in [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) |
| Changing the data model | bump `SCHEMA_VERSION` in `types.ts` and add a step to `migrate()` in `src/lib/migrate.ts`. Old stored projects and backups are upgraded on load. |
| Sample project | `src/lib/sample.ts` |
| Each step’s screen | `src/steps/*.tsx` |
| Report | `src/pages/ReportPage.tsx` |

Before opening a pull request, run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` and `npm run build`. Every defect fix comes with a regression test (see `docs/TESTING.md`).

## Project structure

```
src/
  lib/         data model, storage, migration/validation, tree ops, progress, integrity, sample
  store/       project store with automatic saving
  i18n/        English and Arabic dictionaries, RTL handling
  content/     coaching content and completion-criteria labels (EN/AR)
  components/  layout, step shell, issue-tree SVG, UI primitives
  steps/       the seven step workspaces
  pages/       dashboard, workspace, step router, report, about
tests/e2e/     Playwright acceptance tests
docs/          data model and testing report
```

## Known limitations

- **Closing the tab.** Saving starts on every edit; the app flushes and takes a recovery copy when the tab is hidden or closed. A browser may still abort an IndexedDB write started while the page is closing; this is not guaranteed by any web app. The synchronous recovery copy is the safety net.
- **Recovery copy size.** It lives in `localStorage` (about 5 MB per site in most browsers). If that is full too, the banner says so; export a backup.
- **Heuristics.** Structure observations and SMART hints use keywords and word overlap. They prompt reflection and never decide.
- **No sync.** Projects live in one browser; use backups to move them.

See [`docs/TESTING.md`](docs/TESTING.md) for the full list.

## Data and privacy

- Projects are stored in **IndexedDB in your browser on your device**; the interface language is stored in LocalStorage. Nothing is transmitted anywhere.
- Every edit is saved immediately, and the app requests persistent storage so the browser will not evict data under pressure.
- **If saving fails:** your changes stay in the open tab and are retried automatically. A red banner says how many projects are unsaved and offers *Retry now* and *Export backup*. Keep the tab open until it says “All changes saved”.
- **Limit:** the app saves as soon as the tab is hidden and warns before you close it with unsaved changes. But no web app can guarantee that a write started while a tab is closing will finish.
- **Back up regularly** using *Back up all projects* (dashboard) or *Export JSON backup* (workspace or report). Clearing browser data deletes local projects.
- Imported files are fully validated (see `docs/DATA_MODEL.md`). Nothing in an imported file is executed or rendered as HTML.

## Sources

- McKinsey.org Forward Program, *Your 7-Step Problem Solving Playbook* (primary methodology).
- McKinsey & Company, *How to master the seven-step problem-solving process* (2019).
- McKinsey Quarterly, *Making great decisions* (2013).
- McKinsey, *Discovering better ways of working* (lean problem solving).
- Additional references: *Six problem-solving mindsets for very uncertain times*; *The McKinsey Approach to Problem Solving* (staff paper); Umbrex; Strategy Toolkit, *Issue trees and MECE*.
