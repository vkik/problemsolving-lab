/**
 * Referential-integrity helpers. Deleting an item never leaves dangling links behind:
 * issues → priorities/tasks/analyses, tasks → analyses, analyses/evidence → findings, findings → recommendations.
 * All functions mutate the draft passed to them (used inside store.update recipes).
 */
import { removeNode } from './tree'
import type { Project } from './types'

export function deleteIssue(p: Project, id: string) {
  const { nodes, removed } = removeNode(p.structure.nodes, id)
  p.structure.nodes = nodes
  const gone = new Set(removed)
  for (const r of removed) delete p.prioritize.assessments[r]
  p.prioritize.ranking = p.prioritize.ranking.filter((x) => !gone.has(x))
  p.prioritize.selected = p.prioritize.selected.filter((x) => !gone.has(x))
  for (const t of p.workplan.tasks) if (gone.has(t.issueId)) t.issueId = ''
  for (const a of p.analyses) if (gone.has(a.issueId)) a.issueId = ''
}

export function deleteTask(p: Project, id: string) {
  p.workplan.tasks = p.workplan.tasks.filter((t) => t.id !== id)
  for (const a of p.analyses) if (a.taskId === id) a.taskId = ''
}

export function deleteAnalysis(p: Project, id: string) {
  const a = p.analyses.find((x) => x.id === id)
  const evIds = new Set(a?.evidence.map((e) => e.id) ?? [])
  p.analyses = p.analyses.filter((x) => x.id !== id)
  for (const f of p.synthesis.findings) {
    f.analysisIds = f.analysisIds.filter((x) => x !== id)
    f.evidenceIds = f.evidenceIds.filter((x) => !evIds.has(x))
  }
}

export function deleteEvidence(p: Project, analysisId: string, evidenceId: string) {
  const a = p.analyses.find((x) => x.id === analysisId)
  if (a) a.evidence = a.evidence.filter((e) => e.id !== evidenceId)
  for (const f of p.synthesis.findings) f.evidenceIds = f.evidenceIds.filter((x) => x !== evidenceId)
}

export function deleteFinding(p: Project, id: string) {
  p.synthesis.findings = p.synthesis.findings.filter((f) => f.id !== id)
  p.synthesis.ranking = p.synthesis.ranking.filter((x) => x !== id)
  for (const r of p.recommendations) r.findingIds = r.findingIds.filter((x) => x !== id)
}

export function deleteRecommendation(p: Project, id: string) {
  p.recommendations = p.recommendations.filter((r) => r.id !== id)
}

/** Findings in ranked order (manual ranking first, then creation order). */
export function rankedFindings(p: Project) {
  const byId = new Map(p.synthesis.findings.map((f) => [f.id, f]))
  const ranked = p.synthesis.ranking.filter((id) => byId.has(id))
  const rest = p.synthesis.findings.map((f) => f.id).filter((id) => !ranked.includes(id))
  return [...ranked, ...rest].map((id) => byId.get(id)!)
}
