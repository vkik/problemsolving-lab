# Data model

Source of truth: [`src/lib/types.ts`](../src/lib/types.ts). Current schema version: **1**.

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
| **StructureStep** | `treeType` (`issue` or `hypothesis`), `rootText`, `nodes`, `mece[question] = {answer, note}`, `meceStatus`, `meceReviewedAt`, `meceSignature`, `hypothesis {initial, rationale, alternatives, unknowns}` |
| **IssueNode** | `id`, `parentId`, `text`, `note`, `order`, `collapsed` |
| **Assessment** | `impact` 1–3, `feasibility` 1–3, `rationale`, `confidence`, `justification` |
| **WorkTask** | `issueId`, `hypothesis`, `question`, `requiredData`, `dataSource`, `methodology`, `owner`, `startDate`, `dueDate`, `expectedOutput`, `status` |
| **Analysis** | `issueId`, `taskId`, `title`, `hypothesis`, `method`, `results`, `interpretation`, `limitations`, `conclusion`, `result`, `relationship`, `missingInfo`, `revisedHypothesis`, `evidence[]` |
| **Evidence** | `description`, `type` (`fact`, `observation`, `assumption`, `interpretation` or `external`), `source`, `dateCollected`, `quality{reliability, completeness, accuracy, recency, confidence}`, `verificationNote` |
| **Finding** | `discovery`, `insight` (one sentence), `implication`, `meaning`, `whyMatters`, `uncertain`, `analysisIds`, `evidenceIds` |
| **SynthesisStep** | `findings`, `ranking`, `soWhat {mostImportant, whyMatters, decision, doNothing}` |
| **Recommendation** | `title`, `action`, `problemAddressed`, `findingIds`, `evidenceSummary`, `benefit`, `requirements`, `risks`, `owner`, `startDate`, `deadline`, `kpi`, `verification`, `horizon`, `disposition` (`recommended`, `investigate` or `rejected`), `rejectionReason` |

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

## Storage

- IndexedDB database `problemsolving-lab`, object store `projects` (key path `id`).
- Saving: every edit starts an IndexedDB write immediately. Edits made while a write is in flight are coalesced, and the latest version is written next. Persistent storage is requested from the browser.
- Preferences (interface language, coaching panel state) are kept in LocalStorage under `psl.prefs`.

## Backup format

```json
{
  "app": "problemsolving-lab",
  "schemaVersion": 1,
  "exportedAt": "2026-11-24T10:00:00.000Z",
  "projects": [ { "...Project..." } ]
}
```

A bare Project object is also accepted on import.

### Import validation (`src/lib/migrate.ts`)

- Rejects non-JSON files, files that are not backups, empty backups, files over 20 MB, and backups from a **newer** schema version.
- Every field is type-checked; unknown keys are dropped; enum values are validated; text is capped at 20,000 characters and arrays at 2,000 items; ids must match `[A-Za-z0-9_-]{1,64}`.
- Orphaned and cyclic tree nodes are removed; links to non-existent issues, tasks, analyses, evidence or findings are dropped.
- A project whose id already exists is imported as a copy with new ids. Existing data is never overwritten.
- Stored records are passed through the same validation when the app loads.

## Schema versioning

Bump `SCHEMA_VERSION` and add an upgrade step to `migrate()` whenever the shape changes. Older stored projects and backups are upgraded on load or import.
