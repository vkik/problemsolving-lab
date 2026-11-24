import type { Assessment, Level, Project } from './types'
import { flatten } from './tree'

export const score = (a?: Assessment): number | null => (a?.impact && a?.feasibility ? a.impact * a.feasibility : null)

/**
 * Four-corner classification used by the Impact & Feasibility matrix.
 * High = 3, Low = 1. A Medium rating on either axis is kept separate ("review") rather than being
 * forced into a corner, so the matrix never overstates how clear-cut a judgement is.
 */
export type Bucket = 'hi-hi' | 'hi-lo' | 'lo-hi' | 'lo-lo' | 'review' | 'unscored'
export const BUCKETS: Bucket[] = ['hi-hi', 'hi-lo', 'lo-hi', 'lo-lo', 'review', 'unscored']

export function bucketOf(a?: Assessment): Bucket {
  if (!a?.impact || !a?.feasibility) return 'unscored'
  if (a.impact === 2 || a.feasibility === 2) return 'review'
  if (a.impact === 3) return a.feasibility === 3 ? 'hi-hi' : 'hi-lo'
  return a.feasibility === 3 ? 'lo-hi' : 'lo-lo'
}

/** Ranked issue ids: the user's manual order first, then remaining scored issues by score (desc). */
export function rankedIssues(p: Project): string[] {
  const issues = flatten(p.structure.nodes)
  const ids = new Set(issues.map((f) => f.node.id))
  const scored = issues.filter((f) => score(p.prioritize.assessments[f.node.id]) !== null).map((f) => f.node.id)
  const manual = p.prioritize.ranking.filter((id) => ids.has(id) && scored.includes(id))
  const rest = scored
    .filter((id) => !manual.includes(id))
    .sort((a, b) => (score(p.prioritize.assessments[b]) ?? 0) - (score(p.prioritize.assessments[a]) ?? 0))
  return [...manual, ...rest]
}

export const LEVELS: Level[] = [1, 2, 3]
