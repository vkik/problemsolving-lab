/**
 * Completion criteria for each of the seven steps. A step is complete only when the substance is
 * there — e.g. Structure needs a reviewed-and-accepted MECE check, not merely some branches.
 */
import { flatten, treeSignature } from './tree'
import { today } from './factory'
import { SMART_KEYS, STEP_KEYS, type Project, type StepKey } from './types'

export interface Criterion {
  key: string
  met: boolean
}

const filled = (s: string) => s.trim().length > 0

export function stepCriteria(p: Project, step: StepKey): Criterion[] {
  switch (step) {
    case 'define': {
      const d = p.define
      const worksheet = [d.background, d.currentSituation, d.desiredSituation, d.gap, d.whyMatters, d.stakeholders, d.scope, d.constraints]
      return [
        { key: 'define.question', met: filled(d.question) },
        { key: 'define.worksheet', met: worksheet.filter(filled).length >= 6 },
        { key: 'define.smartAssessed', met: SMART_KEYS.every((k) => d.smart[k].verdict !== 'unassessed') },
        { key: 'define.smartMet', met: SMART_KEYS.every((k) => d.smart[k].verdict === 'met') },
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
        { key: 'recommendations.traceable', met: rec.length > 0 && rec.every((r) => r.findingIds.length > 0) },
        { key: 'recommendations.rejectedJustified', met: p.recommendations.length > 0 && rejected.every((r) => filled(r.rejectionReason)) },
      ]
    }
  }
}

export function stepComplete(p: Project, step: StepKey): boolean {
  return stepCriteria(p, step).every((c) => c.met)
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
