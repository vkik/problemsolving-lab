# Data model

Source of truth: [`src/lib/types.ts`](../src/lib/types.ts). Current schema version: **2** (ProblemSolving Lab 1.1).

## Relationship chain

```
Project
 ├─ define            (Step 1: worksheet, SMART assessment, statement)
 ├─ structure.nodes   IssueNode[] ──────────────┐  (Step 2: tree; parentId = null → child of central question)
 ├─ prioritize        assessments[issueId], ranking[issueId], selected[issueId]   (Step 3)
 ├─ workplan.tasks    WorkTask.issueId ─────────┤  (Step 4)
 ├─ analyses          Analysis.issueId, .taskId ┘  (Step 5)
 │     └─ evidence    Evidence[]
 ├─ synthesis         Finding.analysisIds[], .evidenceIds[]   (Step 6)
 └─ recommendations   Recommendation.findingIds[]             (Step 7)
```

Every link is stored as an id. The report and the traceability panel follow these ids from a recommendation back to its findings and then to the evidence behind them.

## Entities

| Entity | Key fields |
|--------|-----------|
| **Project** | `id`, `schemaVersion`, `title`, `category`, `context`, `owner`, `startDate`, `targetDate`, `status`, `archived`, `isSample`, `createdAt`, `updatedAt`, `currentStep`, `checklists[step]`, `reflections[step]` |
| **DefineStep** | `question`, `background`, `currentSituation`, `desiredSituation`, `gap`, `whyMatters`, `stakeholders`, `scope`, `constraints`, `availableInfo`, `infoGaps`, `smart[criterion] = {verdict, note}`, `statement` |
| **StructureStep** | `treeType` (`issue` or `hypothesis`), `rootText`, `nodes`, `mece[question] = {answer, note}` for six questions (`contributes`, `overlap`, `missing`, `logic`, `causes`, `treeType`), `meceStatus`, `meceReviewedAt`, `meceSignature`, `hypothesis {initial, rationale, alternatives, unknowns}` |
| **IssueNode** | `id`, `parentId`, `text`, `note`, `order`, `collapsed`, `kind` (`''`, `driver`, `symptom` or `consequence`; v2) |
| **Assessment** | `impact` 1–3, `feasibility` 1–3, `rationale`, `confidence`, `justification` |
| **WorkTask** | `issueId`, `hypothesis`, `question`, `requiredData`, `dataSource`, `methodology`, `owner`, `startDate`, `dueDate`, `expectedOutput`, `status` |
| **Analysis** | `issueId`, `taskId`, `title`, `hypothesis`, `method`, `results`, `interpretation`, `limitations`, `conclusion`, `result`, `relationship`, `missingInfo`, `revisedHypothesis`, `evidence[]` |
| **Evidence** | `description`, `type` (`fact`, `observation`, `assumption`, `interpretation` or `external`), `source`, `dateCollected`, `quality{reliability, completeness, accuracy, recency, confidence}`, `verificationNote` |
| **Finding** | `discovery`, `insight` (one sentence), `implication`, `meaning`, `whyMatters`, `uncertain`, `analysisIds`, `evidenceIds` |
| **SynthesisStep** | `findings`, `ranking`, `soWhat {mostImportant, whyMatters, decision, doNothing}` |
| **Recommendation** | `title`, `action`, `problemAddressed`, `findingIds`, `evidenceSummary`, `benefit`, `requirements`, `risks`, `owner`, `startDate`, `deadline`, `kpi`, `verification`, `horizon`, `disposition` (`recommended`, `investigate` or `rejected`), `rejectionReason`, `precautionary` (v2), `precautionaryJustification` (v2) |

Dates are `YYYY-MM-DD`; timestamps are ISO 8601.

## Integrity rules

1. **Deleting** an item removes every link to it (`src/lib/integrity.ts`):
   - Deleting an issue also deletes its sub-issues and their assessments, and unlinks tasks and analyses that pointed to them.
   - Deleting a task unlinks its analyses.
   - Deleting an analysis or evidence item removes it from findings.
   - Deleting a finding removes it from recommendations.

   Deletions of linked or non-empty items ask for confirmation.
2. **Duplicating** a project gives every entity a fresh id and remaps all cross-references.
3. **MECE acceptance** stores a fingerprint of the tree. If the tree changes afterwards, the review is flagged and the step is no longer counted as complete.
4. **Facts vs. assumptions.** Re-classifying evidence as a verified fact requires a verification note. On import, a “fact” with neither a source nor a verification note is downgraded to an assumption.
5. **Completion** of each step is computed from substance, not from whether fields were touched (`src/lib/progress.ts`).

## Completion states (`src/lib/progress.ts`)

Each step has **required criteria** and **quality checks**. `evaluateStep()` returns one of four states:

| State | Meaning |
|-------|---------|
| Complete | All criteria met, no quality concerns |
| Complete with documented limitations | All criteria met. Concerns exist, but they are documented (stated uncertainty, analysis limitations, a “partly” SMART verdict with a note, a justified precautionary action) |
| Needs further evidence | All criteria met, but something presented as supported is not backed |
| Incomplete | A required criterion is not met |

Steps that are *complete* or *complete with documented limitations* count towards “steps complete”. No criterion passes vacuously: on an empty project, every criterion is unmet.

| Step | Quality checks (level) |
|------|-----------------------|
| Define | SMART criterion “partly” met, with its note (limitation). “Partly” without a note, or “not met”, is a failed criterion |
| Structure | Review accepted under v1 with the two new questions unanswered (limitation) |
| Prioritize | Issue selected with low confidence (limitation) |
| Analyses | Not yet tested or inconclusive (limitation). Low-quality evidence (limitation if limitations are documented, otherwise needs evidence). “Supported” on assumptions/interpretations only, or a causal claim without facts or observations (needs evidence) |
| Synthesis | Provisional finding: limitation if its uncertainty is documented, needs evidence if not |
| Recommendations | Based on provisional findings (limitation). Justified precautionary action (limitation). No finding, or broken chain (needs evidence) |

## Evidence-chain rules (`src/lib/evidence.ts`)

- **Strong evidence** means verified facts, observations and external evidence. Assumptions and interpretations never count as strong, and the classes are never merged.
- **Finding support.** A finding's evidence is its directly linked evidence plus the evidence of its linked analyses.
  - *Not linked*: no analysis or evidence (a required criterion fails).
  - *Provisional* if any of these hold: a linked analysis is not tested or is inconclusive; there is no strong evidence; any evidence is rated low on reliability, accuracy or confidence.
  - *Validated* otherwise.
- **Recommendation chain** (recommended actions only):
  - *Evidence-backed*: every linked finding is validated.
  - *Backed with limitations*: some linked findings are provisional.
  - *Unsupported*: no finding, or a linked finding is not linked to anything (broken chain).
  - *Precautionary*: the action is marked precautionary and has a justification; this replaces *unsupported*.

  A broken chain is never displayed as evidence-backed.
- **Structure observations** (`src/lib/structureChecks.ts`) are read-only hints. They never set review answers or acceptance.

## Storage, saving and recovery

- IndexedDB database `problemsolving-lab`, object store `projects` (key path `id`).
- **Save queue** (`src/lib/saveQueue.ts`):
  - Every edit hands the latest project snapshot to the queue, and writing starts immediately (no debounce).
  - Writes run one at a time and in order, so an older snapshot can never overwrite a newer one. Edits made during a write are coalesced.
  - A snapshot leaves the queue only after its write succeeds; **failed snapshots are kept**.
  - Failed writes are retried after 1, 3, 10 and 30 s. Then the status becomes *failed* and waits for *Retry now*, the next edit, or a flush.
  - `flush()` always resolves with `{ ok, unsaved, error }`; it never reports success when a write failed.
  - Deleting a project first waits for any in-flight write, so the deleted project cannot be written back.
- **Status** shown in the header: saving · all changes saved · save failed, retrying · not saved. In the last two states a banner offers *Retry now* and *Export backup*. The export includes the unsaved in-memory changes.
- **Tab lifecycle** (`src/lib/lifecycle.ts`):
  - When the tab is hidden, the queue flushes.
  - On `pagehide` it flushes on a best-effort basis.
  - On `beforeunload` the browser is asked to confirm leaving while anything is unsaved.

  An asynchronous IndexedDB write started while the page is closing is **not guaranteed** to complete.
- If storage cannot be opened at all (e.g. blocked), the app still loads and says that nothing will be saved.
- Imports and the sample project report a storage failure instead of claiming success.
- Preferences (interface language, coaching panel state) are kept in LocalStorage under `psl.prefs`.

## Backup format

```json
{
  "app": "problemsolving-lab",
  "schemaVersion": 2,
  "exportedAt": "2026-11-24T10:00:00.000Z",
  "projects": [ { "...Project..." } ]
}
```

A bare Project object is also accepted on import.

### Import validation (`src/lib/migrate.ts`)

- Rejects non-JSON files, files that are not backups, empty backups, files over 20 MB, and backups from a **newer** schema version.
- Every field is type-checked; unknown keys are dropped; enum values are validated; text is capped at 20,000 characters and arrays at 2,000 items; ids must match `[A-Za-z0-9_-]{1,64}`.
- Node roles (`kind`) must be `''`, `driver`, `symptom` or `consequence`; anything else becomes unclassified. `precautionary` must be a boolean.
- Orphaned and cyclic tree nodes are removed; links to non-existent issues, tasks, analyses, evidence or findings are dropped.
- A project whose id already exists is imported as a copy with new ids. Existing data is never overwritten.
- Stored records are passed through the same validation when the app loads.

## Schema versioning

Bump `SCHEMA_VERSION` and add an upgrade step to `migrate()` whenever the persisted shape changes. Older stored projects and backups are upgraded on load or import.

| From → to | Migration |
|-----------|-----------|
| 0 → 1 | Unversioned data is treated as v1 |
| 1 → 2 | Nodes get `kind: ''`; recommendations get `precautionary: false` and `precautionaryJustification: ''`; the review gets `causes` and `treeType` as *unanswered*. A review accepted under v1 stays accepted; the Structure step then shows a notice and reports the two unanswered questions as a documented limitation |
