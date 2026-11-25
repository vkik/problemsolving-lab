/**
 * Completion of the seven steps.
 *
 * Each step has required criteria (substance, not touched fields) and quality checks. The result
 * is one of four states:
 *   complete          — criteria met, no quality concerns
 *   complete-limited  — criteria met; concerns exist but are documented (e.g. stated uncertainty)
 *   needs-evidence    — criteria met, but something presented as supported is not (yet) backed
 *   incomplete        — required criteria not met
 * The rules are deliberately not punitive: documented uncertainty is accepted, not rejected.
 */
import { flatten, treeSignature } from './tree'
import { today } from './factory'
import { analysisWarnings, findingSupport, isJustifiedPrecaution, recommendationChain } from './evidence'
import { SMART_KEYS, STEP_KEYS, type Project, type StepKey } from './types'

export interface Criterion {
  key: string
  met: boolean
}

export type StepStatus = 'complete' | 'complete-limited' | 'needs-evidence' | 'incomplete'

export interface QualityIssue {
  key: string
  level: 'limitation' | 'needs-evidence'
  /** Display text of the item concerned (finding, recommendation, criterion…). */
  item: string
}

export interface StepEvaluation {
  status: StepStatus
  criteria: Criterion[]
  issues: QualityIssue[]
}

const filled = (s: string) => s.trim().length > 0

export function stepCriteria(p: Project, step: StepKey): Criterion[] {
  switch (step) {
    case 'define': {
      const d = p.define
      const worksheet = [d.background, d.currentSituation, d.desiredSituation, d.gap, d.whyMatters, d.stakeholders, d.scope, d.constraints]
      const assessed = SMART_KEYS.every((k) => d.smart[k].verdict !== 'unassessed')
      return [
        { key: 'define.question', met: filled(d.question) },
        { key: 'define.worksheet', met: worksheet.filter(filled).length >= 6 },
        { key: 'define.smartAssessed', met: assessed },
        // Both checks only count once every criterion has a verdict — never vacuously.
        { key: 'define.smartNoneUnmet', met: assessed && SMART_KEYS.every((k) => d.smart[k].verdict !== 'not-met') },
        { key: 'define.smartPartlyExplained', met: assessed && SMART_KEYS.every((k) => d.smart[k].verdict !== 'partly' || filled(d.smart[k].note)) },
        { key: 'define.statement', met: filled(d.statement) },
      ]
    }
    case 'structure': {
      const s = p.structure
      const top = s.nodes.filter((n) => n.parentId === null && filled(n.text))
      return [
        { key: 'structure.branches', met: top.length >= 2 },
        { key: 'structure.depth', met: s.nodes.some((n) => n.parentId !== null && filled(n.text)) },
        { key: 'structure.mece', met: s.meceStatus === 'accepted' && s.meceSignature === treeSignature(rootQuestion(p), s.nodes) },
        { key: 'structure.hypothesis', met: filled(s.hypothesis.initial) },
      ]
    }
    case 'prioritize': {
      const leaves = flatten(p.structure.nodes).filter((f) => f.isLeaf)
      const a = p.prioritize.assessments
      const scored = leaves.filter((f) => a[f.node.id]?.impact && a[f.node.id]?.feasibility)
      const selected = p.prioritize.selected
      return [
        { key: 'prioritize.allScored', met: leaves.length > 0 && scored.length === leaves.length },
        { key: 'prioritize.rationale', met: scored.length > 0 && scored.every((f) => filled(a[f.node.id]?.rationale ?? '')) },
        { key: 'prioritize.selected', met: selected.length > 0 },
        { key: 'prioritize.justified', met: selected.length > 0 && selected.every((id) => filled(a[id]?.justification ?? '')) },
      ]
    }
    case 'workplan': {
      const tasks = p.workplan.tasks
      const selected = p.prioritize.selected
      return [
        { key: 'workplan.coverage', met: selected.length > 0 && selected.every((id) => tasks.some((t) => t.issueId === id)) },
        { key: 'workplan.hypothesis', met: tasks.length > 0 && tasks.every((t) => filled(t.hypothesis)) },
        { key: 'workplan.ownerDate', met: tasks.length > 0 && tasks.every((t) => filled(t.owner) && filled(t.dueDate)) },
      ]
    }
    case 'analyses': {
      const tested = p.analyses.filter((a) => a.result !== 'not-tested')
      return [
        { key: 'analyses.linked', met: p.analyses.length > 0 && p.analyses.every((a) => filled(a.issueId) && filled(a.hypothesis)) },
        { key: 'analyses.evidence', met: tested.length > 0 && tested.every((a) => a.evidence.length > 0) },
        { key: 'analyses.tested', met: tested.length > 0 },
        { key: 'analyses.conclusion', met: tested.length > 0 && tested.every((a) => filled(a.conclusion) && filled(a.limitations)) },
      ]
    }
    case 'synthesis': {
      const f = p.synthesis.findings
      const sw = p.synthesis.soWhat
      return [
        { key: 'synthesis.findings', met: f.length > 0 && f.every((x) => filled(x.insight) && filled(x.implication)) },
        { key: 'synthesis.statementInterpretation', met: f.length > 0 && f.every((x) => filled(x.discovery) && filled(x.meaning)) },
        { key: 'synthesis.linked', met: f.length > 0 && f.every((x) => x.evidenceIds.length > 0 || x.analysisIds.length > 0) },
        { key: 'synthesis.soWhat', met: [sw.mostImportant, sw.whyMatters, sw.decision, sw.doNothing].every(filled) },
      ]
    }
    case 'recommendations': {
      const rec = p.recommendations.filter((r) => r.disposition === 'recommended')
      const rejected = p.recommendations.filter((r) => r.disposition === 'rejected')
      return [
        { key: 'recommendations.exists', met: rec.length > 0 },
        { key: 'recommendations.ownerTimeline', met: rec.length > 0 && rec.every((r) => filled(r.owner) && filled(r.deadline)) },
        { key: 'recommendations.kpi', met: rec.length > 0 && rec.every((r) => filled(r.kpi) && filled(r.verification)) },
        { key: 'recommendations.traceable', met: rec.length > 0 && rec.every((r) => r.findingIds.length > 0 || isJustifiedPrecaution(r)) },
        { key: 'recommendations.precautionaryJustified', met: p.recommendations.length > 0 && p.recommendations.every((r) => !r.precautionary || filled(r.precautionaryJustification)) },
        { key: 'recommendations.rejectedJustified', met: p.recommendations.length > 0 && rejected.every((r) => filled(r.rejectionReason)) },
      ]
    }
  }
}

const label = (s: string, fallback = '…') => (s.trim() || fallback).slice(0, 120)

/** Quality checks beyond the required criteria (see module comment for the levels). */
export function stepIssues(p: Project, step: StepKey): QualityIssue[] {
  const out: QualityIssue[] = []
  switch (step) {
    case 'define':
      for (const k of SMART_KEYS) if (p.define.smart[k].verdict === 'partly') out.push({ key: 'define.smartPartly', level: 'limitation', item: k })
      break
    case 'structure': {
      const m = p.structure.mece
      if (p.structure.meceStatus === 'accepted' && (m.causes.answer === 'unanswered' || m.treeType.answer === 'unanswered'))
        out.push({ key: 'structure.reviewIncomplete', level: 'limitation', item: '' })
      break
    }
    case 'prioritize':
      for (const id of p.prioritize.selected)
        if (p.prioritize.assessments[id]?.confidence === 'low')
          out.push({ key: 'prioritize.lowConfidence', level: 'limitation', item: label(p.structure.nodes.find((n) => n.id === id)?.text ?? '') })
      break
    case 'analyses':
      for (const a of p.analyses) {
        const name = label(a.title || a.hypothesis)
        if (a.result === 'not-tested') {
          out.push({ key: 'analyses.untested', level: 'limitation', item: name })
          continue
        }
        const w = analysisWarnings(a)
        if (w.includes('an.warn.supportedOnAssumptions')) out.push({ key: 'analyses.supportedOnAssumptions', level: 'needs-evidence', item: name })
        if (w.includes('an.warn.causalNoFacts')) out.push({ key: 'analyses.causalNoFacts', level: 'needs-evidence', item: name })
        if (w.includes('an.warn.lowQuality')) out.push({ key: 'analyses.lowQuality', level: filled(a.limitations) ? 'limitation' : 'needs-evidence', item: name })
        if (a.result === 'inconclusive') out.push({ key: 'analyses.inconclusive', level: 'limitation', item: name })
      }
      break
    case 'synthesis':
      for (const f of p.synthesis.findings) {
        const s = findingSupport(p, f)
        const name = label(f.insight || f.discovery)
        if (s.cls === 'verified') continue
        if (s.cls === 'unsupported') {
          if (s.reasons.includes('noBasis')) out.push({ key: 'synthesis.unsupported', level: 'needs-evidence', item: name })
          continue // no links at all is a failed criterion (synthesis.linked)
        }
        out.push({ key: s.documented ? `synthesis.${s.cls}Documented` : `synthesis.${s.cls}`, level: s.documented ? 'limitation' : 'needs-evidence', item: name })
      }
      break
    case 'recommendations':
      for (const r of p.recommendations) {
        const c = recommendationChain(p, r)
        const name = label(r.title || r.action)
        if (c.level === 'unsupported') out.push({ key: c.reason === 'brokenChain' ? 'recommendations.brokenChain' : 'recommendations.unsupported', level: 'needs-evidence', item: name })
        else if (c.level === 'partial') out.push({ key: 'recommendations.partial', level: 'limitation', item: name })
        else if (c.level === 'precautionary') out.push({ key: 'recommendations.precautionary', level: 'limitation', item: name })
      }
      break
  }
  return out
}

export function evaluateStep(p: Project, step: StepKey): StepEvaluation {
  const criteria = stepCriteria(p, step)
  const issues = stepIssues(p, step)
  const status: StepStatus = !criteria.every((c) => c.met)
    ? 'incomplete'
    : issues.some((i) => i.level === 'needs-evidence')
      ? 'needs-evidence'
      : issues.length > 0
        ? 'complete-limited'
        : 'complete'
  return { status, criteria, issues }
}

/** Complete, with or without documented limitations. */
export function stepComplete(p: Project, step: StepKey): boolean {
  const s = evaluateStep(p, step).status
  return s === 'complete' || s === 'complete-limited'
}

/** Fraction 0..1 of criteria met for a step. */
export function stepFraction(p: Project, step: StepKey): number {
  const c = stepCriteria(p, step)
  return c.filter((x) => x.met).length / c.length
}

export function projectProgress(p: Project): number {
  const total = STEP_KEYS.reduce((sum, s) => sum + stepFraction(p, s), 0)
  return Math.round((total / STEP_KEYS.length) * 100)
}

export function completedSteps(p: Project): number {
  return STEP_KEYS.filter((s) => stepComplete(p, s)).length
}

export const isOverdue = (due: string, done: boolean) => !!due && !done && due < today()

export function outstanding(p: Project) {
  const openTasks = p.workplan.tasks.filter((t) => t.status !== 'done')
  const overdueTasks = openTasks.filter((t) => isOverdue(t.dueDate, false))
  const openActions = p.recommendations.filter((r) => r.disposition === 'recommended')
  const overdueActions = openActions.filter((r) => isOverdue(r.deadline, false))
  const untested = p.analyses.filter((a) => a.result === 'not-tested')
  return { openTasks: openTasks.length, overdueTasks: overdueTasks.length, openActions: openActions.length, overdueActions: overdueActions.length, untested: untested.length }
}

/** All evidence across analyses, with its parent analysis — used by synthesis and the report. */
export function allEvidence(p: Project) {
  return p.analyses.flatMap((a) => a.evidence.map((e) => ({ evidence: e, analysis: a })))
}

/** The central question of the issue tree: its own text, or the Step 1 problem question. */
export const rootQuestion = (p: Project) => p.structure.rootText.trim() || p.define.question.trim()
