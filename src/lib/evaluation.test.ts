import { describe, expect, it } from 'vitest'
import { buildSampleProject } from './sample'
import { emptyProject, newAnalysis, newEvidence, newFinding, newRecommendation } from './factory'
import { findingSupport, recommendationChain } from './evidence'
import { evaluateStep } from './progress'
import { sanitizeProject } from './migrate'
import { structureHints } from './structureChecks'
import { addChild } from './tree'
import { findingWarnings, sentenceCount } from '../steps/Synthesis'
import { SCHEMA_VERSION, type Evidence, type IssueNode, type Project } from './types'

const ev = (patch: Partial<Evidence> = {}): Evidence => ({ ...newEvidence(), description: 'x', ...patch })

/** A project with one tested analysis backed by a verified fact, and one finding linked to it. */
function solid(): { p: Project; aId: string; fId: string; eId: string } {
  const p = buildSampleProject()
  const a = newAnalysis()
  a.title = 'A'
  a.hypothesis = 'H'
  a.result = 'supported'
  a.conclusion = 'c'
  a.limitations = 'l'
  a.results = 'r'
  const e = ev({ type: 'fact', source: 'record', quality: { reliability: 'high', completeness: 'high', accuracy: 'high', recency: 'high', confidence: 'high' } })
  a.evidence = [e]
  a.issueId = p.structure.nodes[1].id
  p.analyses = [a]
  const f = newFinding()
  Object.assign(f, { discovery: 'd', meaning: 'm', insight: 'Because an insight, an implication.', implication: 'i', analysisIds: [a.id] })
  p.synthesis.findings = [f]
  p.synthesis.ranking = [f.id]
  const r = newRecommendation()
  Object.assign(r, { title: 'R', owner: 'o', deadline: '2030-01-01', kpi: 'k', verification: 'v', findingIds: [f.id] })
  p.recommendations = [r]
  return { p, aId: a.id, fId: f.id, eId: e.id }
}

describe('finding classes (evidence chain)', () => {
  it('verified: tested analysis with a verified fact and no reservations', () => {
    const { p } = solid()
    const s = findingSupport(p, p.synthesis.findings[0])
    expect(s.cls).toBe('verified')
    expect(s.evidence).toHaveLength(1) // evidence behind a linked analysis counts
    expect(evaluateStep(p, 'synthesis').status).toBe('complete')
  })
  it('a linked analysis alone is not verification: no links → unsupported; analysis documenting nothing → unsupported', () => {
    const { p } = solid()
    p.synthesis.findings[0].analysisIds = []
    expect(findingSupport(p, p.synthesis.findings[0])).toMatchObject({ cls: 'unsupported', reasons: ['noLinks'] })
    expect(evaluateStep(p, 'synthesis').status).toBe('incomplete')
    const { p: q } = solid()
    Object.assign(q.analyses[0], { evidence: [], results: '', conclusion: '' })
    expect(findingSupport(q, q.synthesis.findings[0])).toMatchObject({ cls: 'unsupported', reasons: ['noBasis'] })
    expect(evaluateStep(q, 'synthesis').status).toBe('needs-evidence')
  })
  it.each<[string, string, (p: Project) => void]>([
    ['preliminary', 'untested', (p) => void (p.analyses[0].result = 'not-tested')],
    ['inconclusive', 'inconclusive', (p) => void (p.analyses[0].result = 'inconclusive')],
    ['partial', 'partialResult', (p) => void (p.analyses[0].result = 'partially-supported')],
    ['preliminary', 'noStrongEvidence', (p) => void (p.analyses[0].evidence[0].type = 'assumption')],
    ['preliminary', 'noEvidenceItems', (p) => void Object.assign(p.analyses[0], { evidence: [], results: 'documented results' })],
    ['partial', 'lowReliability', (p) => void (p.analyses[0].evidence[0].quality.reliability = 'low')],
    ['partial', 'lowCompleteness', (p) => void (p.analyses[0].evidence[0].quality.completeness = 'low')],
    ['partial', 'lowRecency', (p) => void (p.analyses[0].evidence[0].quality.recency = 'low')],
  ])('%s when %s — never silently verified; documented uncertainty is accepted', (cls, reason, mutate) => {
    const { p } = solid()
    mutate(p)
    const s = findingSupport(p, p.synthesis.findings[0])
    expect(s.cls).toBe(cls)
    expect(s.reasons).toContain(reason)
    expect(evaluateStep(p, 'synthesis').status).toBe('needs-evidence')
    p.synthesis.findings[0].uncertain = 'We have not yet verified this.'
    expect(evaluateStep(p, 'synthesis').status).toBe('complete-limited')
  })
  it('keeps evidence classes distinct: interpretation is not strong evidence, external evidence is', () => {
    const { p } = solid()
    p.analyses[0].evidence[0].type = 'interpretation'
    expect(findingSupport(p, p.synthesis.findings[0]).reasons).toContain('noStrongEvidence')
    p.analyses[0].evidence[0].type = 'external'
    expect(findingSupport(p, p.synthesis.findings[0]).cls).toBe('verified')
  })
  it('reports per-dimension quality counts and methodological limitations', () => {
    const { p } = solid()
    p.analyses[0].evidence.push(ev({ type: 'observation', quality: { reliability: 'low', completeness: '', accuracy: '', recency: '', confidence: '' } }))
    const s = findingSupport(p, p.synthesis.findings[0])
    expect(s.quality.find((q) => q.key === 'reliability')).toEqual({ key: 'reliability', low: 1, medium: 0, high: 1, unrated: 0 })
    expect(s.quality.find((q) => q.key === 'recency')).toMatchObject({ high: 1, unrated: 1 })
    expect(s.limitationsDocumented.map((a) => a.title)).toEqual(['A'])
  })
  it('requires a statement and an interpretation for every finding', () => {
    const { p } = solid()
    p.synthesis.findings[0].meaning = ''
    expect(evaluateStep(p, 'synthesis').criteria.find((c) => c.key === 'synthesis.statementInterpretation')?.met).toBe(false)
  })
})

describe('recommendation states', () => {
  it('evidence-backed only when every link holds', () => {
    const { p } = solid()
    expect(recommendationChain(p, p.recommendations[0])).toMatchObject({ level: 'backed', reason: 'allVerified' })
    expect(evaluateStep(p, 'recommendations').status).toBe('complete')
  })
  it('partially supported when a finding is not verified — with the reason', () => {
    const { p } = solid()
    p.analyses[0].result = 'inconclusive'
    p.synthesis.findings[0].uncertain = 'u'
    expect(recommendationChain(p, p.recommendations[0])).toMatchObject({ level: 'partial', reason: 'findingsNotVerified' })
    expect(evaluateStep(p, 'recommendations').status).toBe('complete-limited')
  })
  it('a broken chain is unsupported, never evidence-backed', () => {
    const { p } = solid()
    p.synthesis.findings[0].analysisIds = []
    expect(recommendationChain(p, p.recommendations[0])).toMatchObject({ level: 'unsupported', reason: 'brokenChain' })
    expect(evaluateStep(p, 'recommendations').status).toBe('needs-evidence')
  })
  it('no finding: incomplete unless explicitly precautionary and justified', () => {
    const { p } = solid()
    const r = p.recommendations[0]
    r.findingIds = []
    expect(recommendationChain(p, r).level).toBe('unsupported')
    expect(evaluateStep(p, 'recommendations').status).toBe('incomplete')
    r.precautionary = true
    expect(evaluateStep(p, 'recommendations').status).toBe('incomplete') // justification missing
    r.precautionaryJustification = 'Prevents contamination while tests run.'
    expect(recommendationChain(p, r)).toMatchObject({ level: 'precautionary', reason: 'precaution' })
    expect(evaluateStep(p, 'recommendations').status).toBe('complete-limited')
  })
  it('a justified emergency action on incomplete evidence is precautionary, not unsupported or partial', () => {
    const { p } = solid()
    p.analyses[0].result = 'not-tested'
    const r = p.recommendations[0]
    Object.assign(r, { precautionary: true, precautionaryJustification: 'Risk to health if we wait.' })
    expect(recommendationChain(p, r).level).toBe('precautionary')
  })
  it('“requires further investigation” is its own state; rejected options have none', () => {
    const { p } = solid()
    const r = newRecommendation()
    r.disposition = 'investigate'
    expect(recommendationChain(p, r)).toMatchObject({ level: 'investigate', reason: 'disposition' })
    r.disposition = 'rejected'
    expect(recommendationChain(p, r).level).toBe('na')
  })
  it('surfaces the issues addressed and the limitations that affect the recommendation', () => {
    const { p } = solid()
    p.synthesis.findings[0].uncertain = 'Only one month of data'
    const c = recommendationChain(p, p.recommendations[0])
    expect(c.issueIds).toEqual([p.analyses[0].issueId])
    expect(c.limitations.map((l) => [l.source, l.text])).toEqual([
      ['finding', 'Only one month of data'],
      ['analysis', 'l'],
    ])
  })
})

describe('analyses and define states', () => {
  it('"supported" on assumptions only needs further evidence', () => {
    const { p } = solid()
    p.analyses[0].evidence[0].type = 'assumption'
    const e = evaluateStep(p, 'analyses')
    expect(e.status).toBe('needs-evidence')
    expect(e.issues.map((i) => i.key)).toContain('analyses.supportedOnAssumptions')
  })
  it('low-quality evidence with documented limitations is a limitation', () => {
    const { p } = solid()
    p.analyses[0].evidence[0].quality.accuracy = 'low'
    expect(evaluateStep(p, 'analyses').status).toBe('complete-limited')
    p.analyses[0].limitations = ''
    expect(evaluateStep(p, 'analyses').status).toBe('incomplete') // limitations are required for tested analyses
  })
  it('SMART: partly + note → limitation; partly without note or not met → incomplete', () => {
    const p = buildSampleProject()
    expect(evaluateStep(p, 'define').status).toBe('complete-limited')
    p.define.smart.measurable.note = ''
    expect(evaluateStep(p, 'define').status).toBe('incomplete')
    p.define.smart.measurable = { verdict: 'not-met', note: 'x' }
    expect(evaluateStep(p, 'define').status).toBe('incomplete')
    for (const k of ['measurable', 'timeBound'] as const) p.define.smart[k] = { verdict: 'met', note: '' }
    expect(evaluateStep(p, 'define').status).toBe('complete')
  })
  it('an empty project is incomplete everywhere (no vacuous passes)', () => {
    const p = emptyProject()
    for (const s of ['define', 'structure', 'prioritize', 'workplan', 'analyses', 'synthesis', 'recommendations'] as const) {
      expect(evaluateStep(p, s).status).toBe('incomplete')
      expect(evaluateStep(p, s).criteria.some((c) => c.met)).toBe(false)
    }
  })
})

describe('schema v1 → v2 migration', () => {
  it('upgrades a v1 project with defaults and keeps an accepted review', () => {
    const v2 = buildSampleProject()
    const v1 = JSON.parse(JSON.stringify(v2))
    v1.schemaVersion = 1
    for (const n of v1.structure.nodes) delete n.kind
    delete v1.structure.mece.causes
    delete v1.structure.mece.treeType
    for (const r of v1.recommendations) {
      delete r.precautionary
      delete r.precautionaryJustification
    }
    const out = sanitizeProject(v1)
    expect(out.schemaVersion).toBe(SCHEMA_VERSION)
    expect(out.structure.nodes.every((n) => n.kind === '')).toBe(true)
    expect(out.structure.mece.causes.answer).toBe('unanswered')
    expect(out.recommendations.every((r) => r.precautionary === false && r.precautionaryJustification === '')).toBe(true)
    expect(out.structure.meceStatus).toBe('accepted')
    const e = evaluateStep(out, 'structure')
    expect(e.status).toBe('complete-limited')
    expect(e.issues[0].key).toBe('structure.reviewIncomplete')
  })
  it('rejects invalid node kinds', () => {
    const p = buildSampleProject()
    const raw = JSON.parse(JSON.stringify(p))
    raw.structure.nodes[0].kind = 'banana'
    expect(sanitizeProject(raw).structure.nodes[0].kind).toBe('')
  })
})

describe('structure hints (observations only)', () => {
  function tree(texts: [string | null, string][]) {
    let nodes: IssueNode[] = []
    const ids: Record<string, string> = {}
    for (const [parent, text] of texts) {
      const r = addChild(nodes, parent ? ids[parent] : null, text)
      nodes = r.nodes
      ids[text] = r.id
    }
    return { nodes, ids }
  }
  it('flags near-duplicates, single children, few branches, roles and tree-type mismatch', () => {
    const p = emptyProject()
    p.define.question = 'Why is yield low?'
    const { nodes, ids } = tree([
      [null, 'Pump equipment condition'],
      ['Pump equipment condition', 'Is the pump worn?'],
    ])
    p.structure.nodes = nodes
    const codes = structureHints(p).map((h) => h.code)
    expect(codes).toEqual(expect.arrayContaining(['fewTop', 'singleChild', 'untagged']))
    p.structure.nodes = addChild(nodes, null, 'Condition of pump equipment').nodes
    p.structure.nodes.find((n) => n.id === ids['Is the pump worn?'])!.kind = 'symptom'
    const codes2 = structureHints(p).map((h) => h.code)
    expect(codes2).toContain('duplicate')
    expect(codes2).toContain('symptom')
    expect(codes2).toContain('issueStatements') // issue tree, but most branches are statements
  })
  it('never changes the review answers or status', () => {
    const p = buildSampleProject()
    const before = JSON.stringify(p.structure)
    structureHints(p)
    expect(JSON.stringify(p.structure)).toBe(before)
  })
})

describe('synthesis coaching warnings', () => {
  it('detects multi-sentence synthesis and an insight that restates the finding', () => {
    expect(sentenceCount('One. Two.')).toBe(2)
    expect(sentenceCount('واحد؟ اثنان.')).toBe(2)
    const f = newFinding()
    Object.assign(f, { discovery: 'Breakdowns are frequent at sites without caretakers', meaning: 'Breakdowns are frequent at sites without caretakers', insight: 'x', implication: 'y', analysisIds: ['a'] })
    expect(findingWarnings(f)).toContain('syn.warn.restates')
    f.meaning = 'Missing routine maintenance, not pump quality, drives breakdowns'
    expect(findingWarnings(f)).not.toContain('syn.warn.restates')
  })
})
