/**
 * Safe handling of stored and imported project JSON.
 *
 * Every value is checked against the expected shape. Unknown keys are dropped, wrong types fall back
 * to defaults, enum values are validated, text is length-capped, and dangling references between
 * issues → tasks → analyses → findings → recommendations are removed. Nothing in an imported file is
 * ever executed or rendered as HTML.
 */
import { emptyProject, newAnalysis, newEvidence, newFinding, newNode, newRecommendation, newTask, uid } from './factory'
import {
  CATEGORIES,
  DISPOSITIONS,
  EVIDENCE_TYPES,
  HORIZONS,
  HYPOTHESIS_RESULTS,
  MECE_KEYS,
  NODE_KINDS,
  PROJECT_STATUSES,
  QUALITY_KEYS,
  SCHEMA_VERSION,
  SMART_KEYS,
  STEP_KEYS,
  TASK_STATUSES,
  type Assessment,
  type Project,
} from './types'

const MAX_TEXT = 20000
const MAX_ITEMS = 2000

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v.slice(0, MAX_TEXT) : fallback)
const bool = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : fallback)
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
const dateStr = (v: unknown): string => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '')
const isoStr = (v: unknown, fallback: string): string =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : fallback
const idStr = (v: unknown, prefix: string): string =>
  typeof v === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : uid(prefix)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v.slice(0, MAX_ITEMS) : [])
const strArr = (v: unknown): string[] => arr(v).filter((x): x is string => typeof x === 'string')
const level = (v: unknown): 1 | 2 | 3 | null => (v === 1 || v === 2 || v === 3 ? v : null)
const rating = <T extends string>(v: unknown, allowed: readonly T[]): T | '' =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : ''

export class ImportError extends Error {}

/** Parse a backup file's text. Accepts a bare project or the export envelope. */
export function parseBackup(text: string): Project[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ImportError('invalid-json')
  }
  let items: unknown[]
  if (isObj(data) && data.app === 'problemsolving-lab' && Array.isArray(data.projects)) items = data.projects
  else if (isObj(data) && 'define' in data && 'structure' in data) items = [data]
  else throw new ImportError('not-a-backup')
  if (items.length === 0) throw new ImportError('empty')
  return items.map((p) => sanitizeProject(p))
}

export function sanitizeProject(input: unknown): Project {
  if (!isObj(input)) throw new ImportError('not-a-backup')
  const version = typeof input.schemaVersion === 'number' ? input.schemaVersion : 0
  if (version > SCHEMA_VERSION) throw new ImportError('newer-version')
  const raw = migrate(input, version)
  const base = emptyProject()
  const p: Project = {
    ...base,
    id: idStr(raw.id, 'prj'),
    title: str(raw.title),
    category: oneOf(raw.category, CATEGORIES, 'other'),
    context: str(raw.context),
    owner: str(raw.owner),
    startDate: dateStr(raw.startDate),
    targetDate: dateStr(raw.targetDate),
    status: oneOf(raw.status, PROJECT_STATUSES, 'not-started'),
    archived: bool(raw.archived),
    isSample: bool(raw.isSample),
    createdAt: isoStr(raw.createdAt, base.createdAt),
    updatedAt: isoStr(raw.updatedAt, base.updatedAt),
    currentStep: oneOf(raw.currentStep, STEP_KEYS, 'define'),
  }

  // Step 1
  const d = isObj(raw.define) ? raw.define : {}
  for (const k of ['question', 'background', 'currentSituation', 'desiredSituation', 'gap', 'whyMatters', 'stakeholders', 'scope', 'constraints', 'availableInfo', 'infoGaps', 'statement'] as const) {
    p.define[k] = str(d[k])
  }
  const smart = isObj(d.smart) ? d.smart : {}
  for (const k of SMART_KEYS) {
    const s = isObj(smart[k]) ? (smart[k] as Obj) : {}
    p.define.smart[k] = { verdict: oneOf(s.verdict, ['unassessed', 'met', 'partly', 'not-met'] as const, 'unassessed'), note: str(s.note) }
  }

  // Step 2
  const s = isObj(raw.structure) ? raw.structure : {}
  p.structure.treeType = oneOf(s.treeType, ['issue', 'hypothesis'] as const, 'issue')
  p.structure.rootText = str(s.rootText)
  const seen = new Set<string>()
  p.structure.nodes = arr(s.nodes)
    .filter(isObj)
    .map((n, i) => {
      const node = newNode(null, i)
      node.id = idStr(n.id, 'iss')
      node.parentId = typeof n.parentId === 'string' ? n.parentId : null
      node.text = str(n.text)
      node.note = str(n.note)
      node.order = typeof n.order === 'number' && Number.isFinite(n.order) ? n.order : i
      node.collapsed = bool(n.collapsed)
      node.kind = oneOf(n.kind, NODE_KINDS, '')
      return node
    })
    .filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)))
  // Remove orphans and cycles: keep only nodes whose ancestor chain reaches the root.
  const byId = new Map(p.structure.nodes.map((n) => [n.id, n]))
  const reachesRoot = (id: string): boolean => {
    const visited = new Set<string>()
    let cur = byId.get(id)
    while (cur) {
      if (visited.has(cur.id)) return false
      visited.add(cur.id)
      if (cur.parentId === null) return true
      cur = byId.get(cur.parentId)
    }
    return false
  }
  p.structure.nodes = p.structure.nodes.filter((n) => reachesRoot(n.id))
  const mece = isObj(s.mece) ? s.mece : {}
  for (const k of MECE_KEYS) {
    const m = isObj(mece[k]) ? (mece[k] as Obj) : {}
    p.structure.mece[k] = { answer: oneOf(m.answer, ['unanswered', 'yes', 'no', 'unsure'] as const, 'unanswered'), note: str(m.note) }
  }
  p.structure.meceStatus = oneOf(s.meceStatus, ['not-reviewed', 'needs-improvement', 'accepted'] as const, 'not-reviewed')
  p.structure.meceReviewedAt = typeof s.meceReviewedAt === 'string' ? isoStr(s.meceReviewedAt, '') || null : null
  p.structure.meceSignature = str(s.meceSignature)
  const h = isObj(s.hypothesis) ? s.hypothesis : {}
  p.structure.hypothesis = { initial: str(h.initial), rationale: str(h.rationale), alternatives: str(h.alternatives), unknowns: str(h.unknowns) }

  const issueIds = new Set(p.structure.nodes.map((n) => n.id))

  // Step 3
  const pr = isObj(raw.prioritize) ? raw.prioritize : {}
  const assessments: Record<string, Assessment> = {}
  if (isObj(pr.assessments)) {
    for (const [k, v] of Object.entries(pr.assessments)) {
      if (!issueIds.has(k) || !isObj(v)) continue
      assessments[k] = {
        impact: level(v.impact),
        feasibility: level(v.feasibility),
        rationale: str(v.rationale),
        confidence: rating(v.confidence, ['low', 'medium', 'high'] as const),
        justification: str(v.justification),
      }
    }
  }
  p.prioritize = {
    assessments,
    ranking: strArr(pr.ranking).filter((id) => issueIds.has(id)),
    selected: strArr(pr.selected).filter((id) => issueIds.has(id)),
  }

  // Step 4
  const wp = isObj(raw.workplan) ? raw.workplan : {}
  p.workplan.tasks = arr(wp.tasks).filter(isObj).map((t) => {
    const task = newTask()
    task.id = idStr(t.id, 'tsk')
    task.issueId = typeof t.issueId === 'string' && issueIds.has(t.issueId) ? t.issueId : ''
    for (const k of ['hypothesis', 'question', 'requiredData', 'dataSource', 'methodology', 'owner', 'expectedOutput'] as const) task[k] = str(t[k])
    task.startDate = dateStr(t.startDate)
    task.dueDate = dateStr(t.dueDate)
    task.status = oneOf(t.status, TASK_STATUSES, 'not-started')
    return task
  })
  const taskIds = new Set(p.workplan.tasks.map((t) => t.id))

  // Step 5
  p.analyses = arr(raw.analyses).filter(isObj).map((a) => {
    const an = newAnalysis()
    an.id = idStr(a.id, 'anl')
    an.issueId = typeof a.issueId === 'string' && issueIds.has(a.issueId) ? a.issueId : ''
    an.taskId = typeof a.taskId === 'string' && taskIds.has(a.taskId) ? a.taskId : ''
    for (const k of ['title', 'hypothesis', 'method', 'results', 'interpretation', 'limitations', 'conclusion', 'missingInfo', 'revisedHypothesis'] as const) an[k] = str(a[k])
    an.result = oneOf(a.result, HYPOTHESIS_RESULTS, 'not-tested')
    an.relationship = oneOf(a.relationship, ['not-assessed', 'correlation', 'causal-supported', 'not-applicable'] as const, 'not-assessed')
    an.evidence = arr(a.evidence).filter(isObj).map((e) => {
      const ev = newEvidence()
      ev.id = idStr(e.id, 'evd')
      ev.description = str(e.description)
      ev.type = oneOf(e.type, EVIDENCE_TYPES, 'assumption')
      ev.source = str(e.source)
      ev.dateCollected = dateStr(e.dateCollected)
      ev.verificationNote = str(e.verificationNote)
      // Integrity rule: a "verified fact" must name its source or verification. Otherwise it is
      // treated as an assumption — imported files cannot silently upgrade assumptions into facts.
      if (ev.type === 'fact' && !ev.source.trim() && !ev.verificationNote.trim()) ev.type = 'assumption'
      const q = isObj(e.quality) ? e.quality : {}
      for (const k of QUALITY_KEYS) ev.quality[k] = rating(q[k], ['low', 'medium', 'high'] as const)
      return ev
    })
    return an
  })
  const analysisIds = new Set(p.analyses.map((a) => a.id))
  const evidenceIds = new Set(p.analyses.flatMap((a) => a.evidence.map((e) => e.id)))

  // Step 6
  const sy = isObj(raw.synthesis) ? raw.synthesis : {}
  p.synthesis.findings = arr(sy.findings).filter(isObj).map((f) => {
    const fd = newFinding()
    fd.id = idStr(f.id, 'fnd')
    for (const k of ['discovery', 'insight', 'implication', 'meaning', 'whyMatters', 'uncertain'] as const) fd[k] = str(f[k])
    fd.analysisIds = strArr(f.analysisIds).filter((id) => analysisIds.has(id))
    fd.evidenceIds = strArr(f.evidenceIds).filter((id) => evidenceIds.has(id))
    return fd
  })
  const findingIds = new Set(p.synthesis.findings.map((f) => f.id))
  p.synthesis.ranking = strArr(sy.ranking).filter((id) => findingIds.has(id))
  const sw = isObj(sy.soWhat) ? sy.soWhat : {}
  p.synthesis.soWhat = { mostImportant: str(sw.mostImportant), whyMatters: str(sw.whyMatters), decision: str(sw.decision), doNothing: str(sw.doNothing) }

  // Step 7
  p.recommendations = arr(raw.recommendations).filter(isObj).map((r) => {
    const rec = newRecommendation()
    rec.id = idStr(r.id, 'rec')
    for (const k of ['title', 'action', 'problemAddressed', 'evidenceSummary', 'benefit', 'requirements', 'risks', 'owner', 'kpi', 'verification', 'rejectionReason'] as const) rec[k] = str(r[k])
    rec.startDate = dateStr(r.startDate)
    rec.deadline = dateStr(r.deadline)
    rec.horizon = oneOf(r.horizon, HORIZONS, 'short')
    rec.disposition = oneOf(r.disposition, DISPOSITIONS, 'recommended')
    rec.findingIds = strArr(r.findingIds).filter((id) => findingIds.has(id))
    rec.precautionary = bool(r.precautionary)
    rec.precautionaryJustification = str(r.precautionaryJustification)
    return rec
  })

  // Checklists and reflections
  const cl = isObj(raw.checklists) ? raw.checklists : {}
  const rf = isObj(raw.reflections) ? raw.reflections : {}
  for (const k of STEP_KEYS) {
    const items = isObj(cl[k]) ? (cl[k] as Obj) : {}
    p.checklists[k] = Object.fromEntries(
      Object.entries(items).filter(([id, v]) => /^[a-z0-9-]{1,40}$/i.test(id) && typeof v === 'boolean'),
    ) as Record<string, boolean>
    p.reflections[k] = str(rf[k])
  }
  p.schemaVersion = SCHEMA_VERSION
  return p
}

/**
 * Upgrade older schema versions step by step, before validation.
 * - v0 (unversioned) → v1: same shape.
 * - v1 → v2: issue nodes gain `kind` (unclassified); recommendations gain `precautionary` (false)
 *   and `precautionaryJustification`; the structure review gains two questions (`causes`,
 *   `treeType`) as unanswered. A review accepted under v1 stays accepted — the UI asks the user to
 *   answer the two new questions at the next review, and the step reports it as a documented limitation.
 */
function migrate(raw: Obj, fromVersion: number): Obj {
  let data: Obj = raw
  if (fromVersion < 1) data = { ...data, schemaVersion: 1 }
  if (fromVersion < 2) {
    const s = isObj(data.structure) ? data.structure : {}
    const mece = isObj(s.mece) ? s.mece : {}
    data = {
      ...data,
      schemaVersion: 2,
      structure: {
        ...s,
        nodes: arr(s.nodes).map((n) => (isObj(n) ? { kind: '', ...n } : n)),
        mece: { causes: { answer: 'unanswered', note: '' }, treeType: { answer: 'unanswered', note: '' }, ...mece },
      },
      recommendations: arr(data.recommendations).map((r) => (isObj(r) ? { precautionary: false, precautionaryJustification: '', ...r } : r)),
    }
  }
  return data
}

export function buildBackup(projects: Project[]) {
  return {
    app: 'problemsolving-lab',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    projects,
  }
}
