/**
 * ProblemSolving Lab — project data model.
 *
 * The chain of relationships that every project preserves:
 *   Problem (define) → Issues (structure.nodes) → Priorities (prioritize.assessments, keyed by issue id)
 *   → Work Plan tasks (issueId) → Analyses (issueId, taskId) with Evidence
 *   → Findings (analysisIds, evidenceIds) → Recommendations (findingIds)
 *
 * Bump SCHEMA_VERSION and add a migration in migrate.ts whenever this shape changes.
 */

export const SCHEMA_VERSION = 1

export type Lang = 'en' | 'ar'

export type StepKey = 'define' | 'structure' | 'prioritize' | 'workplan' | 'analyses' | 'synthesis' | 'recommendations'

export const STEP_KEYS: StepKey[] = ['define', 'structure', 'prioritize', 'workplan', 'analyses', 'synthesis', 'recommendations']

export type ProjectCategory =
  | 'engineering'
  | 'water'
  | 'environment'
  | 'project-management'
  | 'organizational'
  | 'finance'
  | 'other'

export const CATEGORIES: ProjectCategory[] = ['engineering', 'water', 'environment', 'project-management', 'organizational', 'finance', 'other']

export type ProjectStatus = 'not-started' | 'in-progress' | 'on-hold' | 'completed'
export const PROJECT_STATUSES: ProjectStatus[] = ['not-started', 'in-progress', 'on-hold', 'completed']

/* ---------- Step 1: Define ---------- */

export type SmartKey = 'specific' | 'measurable' | 'actionOriented' | 'relevant' | 'timeBound'
export const SMART_KEYS: SmartKey[] = ['specific', 'measurable', 'actionOriented', 'relevant', 'timeBound']

/** The user's own judgement for each SMART criterion. The app only offers hints; it never sets this. */
export type SmartVerdict = 'unassessed' | 'met' | 'partly' | 'not-met'

export interface SmartAssessment {
  verdict: SmartVerdict
  note: string
}

export interface DefineStep {
  question: string
  background: string
  currentSituation: string
  desiredSituation: string
  gap: string
  whyMatters: string
  stakeholders: string
  scope: string
  constraints: string
  availableInfo: string
  infoGaps: string
  smart: Record<SmartKey, SmartAssessment>
  /** Final, user-approved problem statement. */
  statement: string
}

/* ---------- Step 2: Structure ---------- */

export type TreeType = 'issue' | 'hypothesis'

export interface IssueNode {
  id: string
  /** null = child of the central question */
  parentId: string | null
  text: string
  note: string
  order: number
  collapsed: boolean
}

export type MeceAnswer = 'unanswered' | 'yes' | 'no' | 'unsure'
export type MeceQuestionKey = 'overlap' | 'missing' | 'logic' | 'contributes'
export const MECE_KEYS: MeceQuestionKey[] = ['overlap', 'missing', 'logic', 'contributes']

export type MeceStatus = 'not-reviewed' | 'needs-improvement' | 'accepted'

export interface StructureStep {
  treeType: TreeType
  /** Central question; empty means "use the problem question from Step 1". */
  rootText: string
  nodes: IssueNode[]
  mece: Record<MeceQuestionKey, { answer: MeceAnswer; note: string }>
  meceStatus: MeceStatus
  meceReviewedAt: string | null
  /** Snapshot of the tree when the review was accepted, to detect later changes. */
  meceSignature: string
  hypothesis: {
    initial: string
    rationale: string
    alternatives: string
    unknowns: string
  }
}

/* ---------- Step 3: Prioritize ---------- */

export type Level = 1 | 2 | 3 // 1 = Low, 2 = Medium, 3 = High
export type Confidence = '' | 'low' | 'medium' | 'high'

export interface Assessment {
  impact: Level | null
  feasibility: Level | null
  rationale: string
  /** How sure the user is about the scoring itself — kept separate from priority. */
  confidence: Confidence
  justification: string
}

export interface PrioritizeStep {
  assessments: Record<string, Assessment>
  /** Manual ranking (issue ids). Issues not listed fall back to score order. */
  ranking: string[]
  /** Issues explicitly selected to carry into the work plan. */
  selected: string[]
}

/* ---------- Step 4: Work plan ---------- */

export type TaskStatus = 'not-started' | 'in-progress' | 'done' | 'blocked'
export const TASK_STATUSES: TaskStatus[] = ['not-started', 'in-progress', 'done', 'blocked']

export interface WorkTask {
  id: string
  issueId: string
  hypothesis: string
  question: string
  requiredData: string
  dataSource: string
  methodology: string
  owner: string
  startDate: string
  dueDate: string
  expectedOutput: string
  status: TaskStatus
}

/* ---------- Step 5: Analyses ---------- */

export type HypothesisResult = 'not-tested' | 'supported' | 'partially-supported' | 'rejected' | 'inconclusive'
export const HYPOTHESIS_RESULTS: HypothesisResult[] = ['not-tested', 'supported', 'partially-supported', 'rejected', 'inconclusive']

export type EvidenceType = 'fact' | 'observation' | 'assumption' | 'interpretation' | 'external'
export const EVIDENCE_TYPES: EvidenceType[] = ['fact', 'observation', 'assumption', 'interpretation', 'external']

export type Rating = '' | 'low' | 'medium' | 'high'
export type QualityKey = 'reliability' | 'completeness' | 'accuracy' | 'recency' | 'confidence'
export const QUALITY_KEYS: QualityKey[] = ['reliability', 'completeness', 'accuracy', 'recency', 'confidence']

export interface Evidence {
  id: string
  description: string
  type: EvidenceType
  source: string
  dateCollected: string
  quality: Record<QualityKey, Rating>
  /** Required when an item is re-classified from assumption to verified fact. */
  verificationNote: string
}

/** Correlation vs causation — what the evidence actually shows about the relationship. */
export type Relationship = 'not-assessed' | 'correlation' | 'causal-supported' | 'not-applicable'

export interface Analysis {
  id: string
  issueId: string
  taskId: string
  title: string
  hypothesis: string
  method: string
  results: string
  interpretation: string
  limitations: string
  conclusion: string
  result: HypothesisResult
  relationship: Relationship
  missingInfo: string
  revisedHypothesis: string
  evidence: Evidence[]
}

/* ---------- Step 6: Synthesis ---------- */

export interface Finding {
  id: string
  discovery: string
  /** The one-sentence synthesis: insight + implication. */
  insight: string
  implication: string
  meaning: string
  whyMatters: string
  uncertain: string
  analysisIds: string[]
  evidenceIds: string[]
}

export interface SynthesisStep {
  findings: Finding[]
  /** Ranked order of finding ids (index 0 = most important). */
  ranking: string[]
  soWhat: { mostImportant: string; whyMatters: string; decision: string; doNothing: string }
}

/* ---------- Step 7: Recommendations ---------- */

export type Horizon = 'immediate' | 'short' | 'medium' | 'long'
export const HORIZONS: Horizon[] = ['immediate', 'short', 'medium', 'long']
export type Disposition = 'recommended' | 'investigate' | 'rejected'
export const DISPOSITIONS: Disposition[] = ['recommended', 'investigate', 'rejected']

export interface Recommendation {
  id: string
  title: string
  action: string
  problemAddressed: string
  findingIds: string[]
  evidenceSummary: string
  benefit: string
  requirements: string
  risks: string
  owner: string
  startDate: string
  deadline: string
  kpi: string
  verification: string
  horizon: Horizon
  disposition: Disposition
  rejectionReason: string
}

/* ---------- Project ---------- */

export interface Project {
  schemaVersion: number
  id: string
  title: string
  category: ProjectCategory
  context: string
  owner: string
  startDate: string
  targetDate: string
  status: ProjectStatus
  archived: boolean
  isSample: boolean
  createdAt: string
  updatedAt: string
  /** Last step the user worked on — used for "current stage". */
  currentStep: StepKey
  define: DefineStep
  structure: StructureStep
  prioritize: PrioritizeStep
  workplan: { tasks: WorkTask[] }
  analyses: Analysis[]
  synthesis: SynthesisStep
  recommendations: Recommendation[]
  /** Quality-checklist ticks per step, keyed by checklist item id. */
  checklists: Record<StepKey, Record<string, boolean>>
  /** "Think Deeper" reflections per step. */
  reflections: Record<StepKey, string>
}
