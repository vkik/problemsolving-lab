import { describe, expect, it } from 'vitest'
import { duplicateProject, emptyProject, newAnalysis, newEvidence, newFinding, newRecommendation, newTask } from './factory'
import { addChild, addSiblingAfter, flatten, indent, move, outdent, removeNode, treeSignature } from './tree'
import { buildBackup, ImportError, parseBackup, sanitizeProject } from './migrate'
import { deleteAnalysis, deleteFinding, deleteIssue, deleteTask } from './integrity'
import { completedSteps, projectProgress, rootQuestion, stepComplete, stepCriteria } from './progress'
import { bucketOf, rankedIssues, score } from './priority'
import { reviewQuestion } from './smart'
import { buildSampleProject } from './sample'
import { SCHEMA_VERSION, STEP_KEYS, type IssueNode } from './types'

function treeOf(): { nodes: IssueNode[]; a: string; b: string; a1: string; a2: string } {
  let nodes: IssueNode[] = []
  const add = (pid: string | null, text: string) => {
    const r = addChild(nodes, pid, text)
    nodes = r.nodes
    return r.id
  }
  const a = add(null, 'A')
  const b = add(null, 'B')
  const a1 = add(a, 'A1')
  const a2 = add(a, 'A2')
  return { nodes, a, b, a1, a2 }
}

describe('issue tree operations', () => {
  it('numbers nodes in outline order', () => {
    const { nodes } = treeOf()
    expect(flatten(nodes).map((f) => `${f.label}:${f.node.text}`)).toEqual(['1:A', '1.1:A1', '1.2:A2', '2:B'])
  })
  it('adds a sibling directly after a node', () => {
    const { nodes, a1 } = treeOf()
    const r = addSiblingAfter(nodes, a1)
    expect(flatten(r.nodes).map((f) => f.label + (f.node.id === r.id ? '*' : ''))).toEqual(['1', '1.1', '1.2*', '1.3', '2'])
  })
  it('moves, indents and outdents', () => {
    const { nodes, a2, b } = treeOf()
    const moved = move(nodes, a2, -1)
    expect(flatten(moved).map((f) => f.node.text)).toEqual(['A', 'A2', 'A1', 'B'])
    const indented = indent(nodes, b) // B becomes child of A
    expect(flatten(indented).map((f) => `${f.label}:${f.node.text}`)).toEqual(['1:A', '1.1:A1', '1.2:A2', '1.3:B'])
    const out = outdent(indented, b)
    expect(flatten(out).map((f) => `${f.label}:${f.node.text}`)).toEqual(['1:A', '1.1:A1', '1.2:A2', '2:B'])
  })
  it('removes a subtree', () => {
    const { nodes, a } = treeOf()
    const r = removeNode(nodes, a)
    expect(r.removed).toHaveLength(3)
    expect(flatten(r.nodes).map((f) => `${f.label}:${f.node.text}`)).toEqual(['1:B'])
  })
  it('signature changes when the tree changes', () => {
    const { nodes, b } = treeOf()
    const s1 = treeSignature('Q', nodes)
    expect(treeSignature('Q', nodes)).toBe(s1)
    expect(treeSignature('Q', indent(nodes, b))).not.toBe(s1)
    expect(treeSignature('Q2', nodes)).not.toBe(s1)
  })
})

describe('referential integrity', () => {
  it('deleting an issue clears priorities, task and analysis links', () => {
    const p = emptyProject()
    const t = treeOf()
    p.structure.nodes = t.nodes
    p.prioritize.assessments[t.a1] = { impact: 3, feasibility: 3, rationale: '', confidence: '', justification: '' }
    p.prioritize.selected = [t.a1]
    p.prioritize.ranking = [t.a1]
    p.workplan.tasks = [newTask(t.a1)]
    p.analyses = [newAnalysis(t.a1)]
    deleteIssue(p, t.a)
    expect(p.prioritize.assessments[t.a1]).toBeUndefined()
    expect(p.prioritize.selected).toEqual([])
    expect(p.workplan.tasks[0].issueId).toBe('')
    expect(p.analyses[0].issueId).toBe('')
  })
  it('deleting tasks, analyses and findings removes downstream links', () => {
    const p = emptyProject()
    const task = newTask()
    const an = newAnalysis('', task.id)
    const ev = newEvidence()
    an.evidence = [ev]
    const f = newFinding()
    f.analysisIds = [an.id]
    f.evidenceIds = [ev.id]
    const r = newRecommendation()
    r.findingIds = [f.id]
    Object.assign(p, { workplan: { tasks: [task] }, analyses: [an], recommendations: [r] })
    p.synthesis.findings = [f]
    deleteTask(p, task.id)
    expect(p.analyses[0].taskId).toBe('')
    deleteAnalysis(p, an.id)
    expect(p.synthesis.findings[0].analysisIds).toEqual([])
    expect(p.synthesis.findings[0].evidenceIds).toEqual([])
    deleteFinding(p, f.id)
    expect(p.recommendations[0].findingIds).toEqual([])
  })
})

describe('import / export safety', () => {
  it('round-trips a full project through a backup file', () => {
    const p = buildSampleProject()
    const text = JSON.stringify(buildBackup([p]))
    const [back] = parseBackup(text)
    expect(back).toEqual(p)
  })
  it('rejects invalid files', () => {
    expect(() => parseBackup('not json')).toThrow(ImportError)
    expect(() => parseBackup('{"hello":1}')).toThrow('not-a-backup')
    expect(() => parseBackup(JSON.stringify({ app: 'problemsolving-lab', projects: [] }))).toThrow('empty')
    expect(() => parseBackup(JSON.stringify({ ...emptyProject(), schemaVersion: SCHEMA_VERSION + 1 }))).toThrow('newer-version')
  })
  it('drops unknown keys, fixes bad types and enums', () => {
    const raw = { ...emptyProject(), title: 42, status: 'exploded', evil: '<script>', define: { question: 'Q', smart: { specific: { verdict: 'nope' } } } }
    const p = sanitizeProject(raw)
    expect(p.title).toBe('')
    expect(p.status).toBe('not-started')
    expect('evil' in p).toBe(false)
    expect(p.define.question).toBe('Q')
    expect(p.define.smart.specific.verdict).toBe('unassessed')
  })
  it('removes dangling references and orphan/cyclic nodes', () => {
    const p = emptyProject()
    const t = treeOf()
    p.structure.nodes = [...t.nodes, { id: 'orph', parentId: 'missing', text: 'x', note: '', order: 0, collapsed: false }, { id: 'c1', parentId: 'c2', text: '', note: '', order: 0, collapsed: false }, { id: 'c2', parentId: 'c1', text: '', note: '', order: 0, collapsed: false }]
    p.prioritize.selected = [t.a1, 'ghost']
    const task = newTask('ghost')
    p.workplan.tasks = [task]
    const f = newFinding()
    f.analysisIds = ['ghost']
    p.synthesis.findings = [f]
    const r = newRecommendation()
    r.findingIds = [f.id, 'ghost']
    p.recommendations = [r]
    const s = sanitizeProject(JSON.parse(JSON.stringify(p)))
    expect(s.structure.nodes.map((n) => n.id).sort()).toEqual([t.a, t.b, t.a1, t.a2].sort())
    expect(s.prioritize.selected).toEqual([t.a1])
    expect(s.workplan.tasks[0].issueId).toBe('')
    expect(s.synthesis.findings[0].analysisIds).toEqual([])
    expect(s.recommendations[0].findingIds).toEqual([f.id])
  })
  it('never imports an unverified "fact": it becomes an assumption', () => {
    const p = emptyProject()
    const a = newAnalysis()
    a.evidence = [{ ...newEvidence(), type: 'fact', source: '', verificationNote: '' }, { ...newEvidence(), type: 'fact', source: 'Signed record' }]
    p.analyses = [a]
    const s = sanitizeProject(JSON.parse(JSON.stringify(p)))
    expect(s.analyses[0].evidence.map((e) => e.type)).toEqual(['assumption', 'fact'])
  })
})

describe('duplicate keeps relationships with fresh ids', () => {
  it('remaps every cross-reference', () => {
    const p = buildSampleProject()
    const c = duplicateProject(p, '(copy)')
    expect(c.id).not.toBe(p.id)
    const ids = new Set(c.structure.nodes.map((n) => n.id))
    expect(c.structure.nodes.some((n) => p.structure.nodes.find((o) => o.id === n.id))).toBe(false)
    expect(c.prioritize.selected.every((id) => ids.has(id))).toBe(true)
    expect(c.workplan.tasks.every((t) => ids.has(t.issueId))).toBe(true)
    const evIds = new Set(c.analyses.flatMap((a) => a.evidence.map((e) => e.id)))
    expect(c.synthesis.findings.every((f) => f.evidenceIds.every((e) => evIds.has(e)))).toBe(true)
    const fIds = new Set(c.synthesis.findings.map((f) => f.id))
    expect(c.recommendations.every((r) => r.findingIds.every((x) => fIds.has(x)))).toBe(true)
    // Re-validating the copy changes nothing → no dangling links
    expect(sanitizeProject(JSON.parse(JSON.stringify(c)))).toEqual(c)
  })
})

describe('progress and completion criteria', () => {
  it('an empty project has no completed steps', () => {
    const p = emptyProject()
    expect(completedSteps(p)).toBe(0)
    expect(projectProgress(p)).toBe(0)
  })
  it('structure is not complete just because branches exist', () => {
    const p = emptyProject()
    p.structure.nodes = treeOf().nodes
    p.structure.hypothesis.initial = 'H'
    expect(stepComplete(p, 'structure')).toBe(false)
    p.structure.meceStatus = 'accepted'
    p.structure.meceSignature = treeSignature(rootQuestion(p), p.structure.nodes)
    expect(stepComplete(p, 'structure')).toBe(true)
    // Changing the tree after acceptance invalidates the criterion
    p.structure.nodes = addChild(p.structure.nodes, null, 'C').nodes
    expect(stepComplete(p, 'structure')).toBe(false)
  })
  it('sample project: realistic, partly complete status', () => {
    const p = buildSampleProject()
    const status = Object.fromEntries(STEP_KEYS.map((s) => [s, stepComplete(p, s)]))
    expect(status.define).toBe(false) // SMART measurable/time-bound only "partly" met
    expect(status.structure).toBe(true)
    expect(status.prioritize).toBe(true)
    expect(status.workplan).toBe(true)
    expect(status.analyses).toBe(true)
    expect(status.synthesis).toBe(true)
    expect(status.recommendations).toBe(true)
    expect(stepCriteria(p, 'define').find((c) => c.key === 'define.smartMet')?.met).toBe(false)
  })
})

describe('prioritization', () => {
  it('scores and buckets without forcing medium into a corner', () => {
    expect(score({ impact: 3, feasibility: 2, rationale: '', confidence: '', justification: '' })).toBe(6)
    expect(bucketOf({ impact: 3, feasibility: 3, rationale: '', confidence: '', justification: '' })).toBe('hi-hi')
    expect(bucketOf({ impact: 3, feasibility: 1, rationale: '', confidence: '', justification: '' })).toBe('hi-lo')
    expect(bucketOf({ impact: 1, feasibility: 3, rationale: '', confidence: '', justification: '' })).toBe('lo-hi')
    expect(bucketOf({ impact: 2, feasibility: 3, rationale: '', confidence: '', justification: '' })).toBe('review')
    expect(bucketOf(undefined)).toBe('unscored')
  })
  it('honours manual ranking, then score order', () => {
    const p = emptyProject()
    const t = treeOf()
    p.structure.nodes = t.nodes
    const A = p.prioritize.assessments
    A[t.a1] = { impact: 1, feasibility: 1, rationale: '', confidence: '', justification: '' }
    A[t.a2] = { impact: 3, feasibility: 3, rationale: '', confidence: '', justification: '' }
    A[t.b] = { impact: 2, feasibility: 2, rationale: '', confidence: '', justification: '' }
    expect(rankedIssues(p)).toEqual([t.a2, t.b, t.a1])
    p.prioritize.ranking = [t.a1]
    expect(rankedIssues(p)).toEqual([t.a1, t.a2, t.b])
  })
})

describe('SMART hints', () => {
  it('flags vague, unmeasured, untimed questions', () => {
    const codes = reviewQuestion('Improve water issues').map((h) => h.code)
    expect(codes).toEqual(expect.arrayContaining(['tooShort', 'vagueWords', 'noMeasure', 'noTime']))
  })
  it('accepts a well-formed question', () => {
    const codes = reviewQuestion('How can we restore the borehole yield to the design rate of the approved scheme by the end of March 2027 within budget?').map((h) => h.code)
    expect(codes).not.toContain('noTime')
    expect(codes).not.toContain('noAction')
    expect(codes).not.toContain('noMeasure')
  })
  it('works for Arabic', () => {
    const codes = reviewQuestion('كيف يمكننا خفض نسبة الفاقد في شبكة المياه في المدينة إلى المستوى المتفق عليه بحلول نهاية 2027؟').map((h) => h.code)
    expect(codes).not.toContain('noTime')
    expect(codes).not.toContain('noAction')
  })
  it('never invents content — it returns only hint codes', () => {
    for (const h of reviewQuestion('fix stuff')) expect(Object.keys(h).sort()).toEqual(['code', 'criterion'])
  })
})
