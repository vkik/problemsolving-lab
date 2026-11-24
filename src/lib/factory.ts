import {
  SCHEMA_VERSION,
  STEP_KEYS,
  type Analysis,
  type Evidence,
  type Finding,
  type IssueNode,
  type Project,
  type Recommendation,
  type StepKey,
  type WorkTask,
} from './types'

export function uid(prefix = 'id'): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : Math.random().toString(36).slice(2, 14)
  return `${prefix}_${rand}`
}

export const nowIso = () => new Date().toISOString()
export const today = () => new Date().toISOString().slice(0, 10)

function perStep<T>(make: () => T): Record<StepKey, T> {
  return Object.fromEntries(STEP_KEYS.map((k) => [k, make()])) as Record<StepKey, T>
}

export function emptyProject(partial: Partial<Project> = {}): Project {
  const ts = nowIso()
  return {
    schemaVersion: SCHEMA_VERSION,
    id: uid('prj'),
    title: '',
    category: 'other',
    context: '',
    owner: '',
    startDate: today(),
    targetDate: '',
    status: 'not-started',
    archived: false,
    isSample: false,
    createdAt: ts,
    updatedAt: ts,
    currentStep: 'define',
    define: {
      question: '',
      background: '',
      currentSituation: '',
      desiredSituation: '',
      gap: '',
      whyMatters: '',
      stakeholders: '',
      scope: '',
      constraints: '',
      availableInfo: '',
      infoGaps: '',
      smart: {
        specific: { verdict: 'unassessed', note: '' },
        measurable: { verdict: 'unassessed', note: '' },
        actionOriented: { verdict: 'unassessed', note: '' },
        relevant: { verdict: 'unassessed', note: '' },
        timeBound: { verdict: 'unassessed', note: '' },
      },
      statement: '',
    },
    structure: {
      treeType: 'issue',
      rootText: '',
      nodes: [],
      mece: {
        overlap: { answer: 'unanswered', note: '' },
        missing: { answer: 'unanswered', note: '' },
        logic: { answer: 'unanswered', note: '' },
        contributes: { answer: 'unanswered', note: '' },
        causes: { answer: 'unanswered', note: '' },
        treeType: { answer: 'unanswered', note: '' },
      },
      meceStatus: 'not-reviewed',
      meceReviewedAt: null,
      meceSignature: '',
      hypothesis: { initial: '', rationale: '', alternatives: '', unknowns: '' },
    },
    prioritize: { assessments: {}, ranking: [], selected: [] },
    workplan: { tasks: [] },
    analyses: [],
    synthesis: {
      findings: [],
      ranking: [],
      soWhat: { mostImportant: '', whyMatters: '', decision: '', doNothing: '' },
    },
    recommendations: [],
    checklists: perStep(() => ({})),
    reflections: perStep(() => ''),
    ...partial,
  }
}

export function newNode(parentId: string | null, order: number, text = ''): IssueNode {
  return { id: uid('iss'), parentId, text, note: '', order, collapsed: false, kind: '' }
}

export function newTask(issueId = ''): WorkTask {
  return {
    id: uid('tsk'),
    issueId,
    hypothesis: '',
    question: '',
    requiredData: '',
    dataSource: '',
    methodology: '',
    owner: '',
    startDate: '',
    dueDate: '',
    expectedOutput: '',
    status: 'not-started',
  }
}

export function newEvidence(): Evidence {
  return {
    id: uid('evd'),
    description: '',
    type: 'observation',
    source: '',
    dateCollected: '',
    quality: { reliability: '', completeness: '', accuracy: '', recency: '', confidence: '' },
    verificationNote: '',
  }
}

export function newAnalysis(issueId = '', taskId = ''): Analysis {
  return {
    id: uid('anl'),
    issueId,
    taskId,
    title: '',
    hypothesis: '',
    method: '',
    results: '',
    interpretation: '',
    limitations: '',
    conclusion: '',
    result: 'not-tested',
    relationship: 'not-assessed',
    missingInfo: '',
    revisedHypothesis: '',
    evidence: [],
  }
}

export function newFinding(): Finding {
  return {
    id: uid('fnd'),
    discovery: '',
    insight: '',
    implication: '',
    meaning: '',
    whyMatters: '',
    uncertain: '',
    analysisIds: [],
    evidenceIds: [],
  }
}

export function newRecommendation(): Recommendation {
  return {
    id: uid('rec'),
    title: '',
    action: '',
    problemAddressed: '',
    findingIds: [],
    evidenceSummary: '',
    benefit: '',
    requirements: '',
    risks: '',
    owner: '',
    startDate: '',
    deadline: '',
    kpi: '',
    verification: '',
    horizon: 'short',
    disposition: 'recommended',
    rejectionReason: '',
    precautionary: false,
    precautionaryJustification: '',
  }
}

/** Deep copy with fresh ids everywhere, keeping every cross-reference intact. */
export function duplicateProject(p: Project, titleSuffix: string): Project {
  const map = new Map<string, string>()
  const remap = (id: string, prefix: string) => {
    if (!id) return id
    if (!map.has(id)) map.set(id, uid(prefix))
    return map.get(id)!
  }
  const clone: Project = JSON.parse(JSON.stringify(p))
  const ts = nowIso()
  clone.id = uid('prj')
  clone.title = `${p.title} ${titleSuffix}`.trim()
  clone.createdAt = ts
  clone.updatedAt = ts
  clone.archived = false
  clone.isSample = false

  clone.structure.nodes = clone.structure.nodes.map((n) => ({
    ...n,
    id: remap(n.id, 'iss'),
    parentId: n.parentId ? remap(n.parentId, 'iss') : null,
  }))
  const assessments: Project['prioritize']['assessments'] = {}
  for (const [k, v] of Object.entries(clone.prioritize.assessments)) assessments[remap(k, 'iss')] = v
  clone.prioritize.assessments = assessments
  clone.prioritize.ranking = clone.prioritize.ranking.map((id) => remap(id, 'iss'))
  clone.prioritize.selected = clone.prioritize.selected.map((id) => remap(id, 'iss'))
  clone.workplan.tasks = clone.workplan.tasks.map((t) => ({ ...t, id: remap(t.id, 'tsk'), issueId: remap(t.issueId, 'iss') }))
  clone.analyses = clone.analyses.map((a) => ({
    ...a,
    id: remap(a.id, 'anl'),
    issueId: remap(a.issueId, 'iss'),
    taskId: remap(a.taskId, 'tsk'),
    evidence: a.evidence.map((e) => ({ ...e, id: remap(e.id, 'evd') })),
  }))
  clone.synthesis.findings = clone.synthesis.findings.map((f) => ({
    ...f,
    id: remap(f.id, 'fnd'),
    analysisIds: f.analysisIds.map((x) => remap(x, 'anl')),
    evidenceIds: f.evidenceIds.map((x) => remap(x, 'evd')),
  }))
  clone.synthesis.ranking = clone.synthesis.ranking.map((id) => remap(id, 'fnd'))
  clone.recommendations = clone.recommendations.map((r) => ({
    ...r,
    id: remap(r.id, 'rec'),
    findingIds: r.findingIds.map((x) => remap(x, 'fnd')),
  }))
  return clone
}
