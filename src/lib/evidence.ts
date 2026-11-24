/**
 * Evidence-chain evaluation: how well an analysis, a finding or a recommendation is supported.
 *
 * Principles
 * - Facts, observations, assumptions, interpretations and external evidence stay distinct.
 *   Only verified facts, observations and external evidence count as "strong" support.
 * - A finding backed only by untested or inconclusive analyses, by assumptions/interpretations,
 *   or by evidence rated low in quality is "provisional" — never shown as validated.
 * - Provisional is legitimate when the uncertainty is documented: it then counts as a documented
 *   limitation, not as missing evidence. Nothing here rejects a finding for being uncertain.
 * - A recommendation is evidence-backed only when every link of its chain holds:
 *   recommendation → finding → analysis/evidence. A broken chain is reported as unsupported,
 *   unless the action is explicitly marked precautionary and justified.
 */
import type { Analysis, Evidence, EvidenceType, Finding, HypothesisResult, Project, Recommendation } from './types'

export const STRONG_TYPES: EvidenceType[] = ['fact', 'observation', 'external']
export const TESTED_RESULTS: HypothesisResult[] = ['supported', 'partially-supported', 'rejected']

const filled = (s: string) => s.trim().length > 0

/** Evidence rated low on reliability, accuracy or confidence. */
export const qualityConcern = (e: Evidence) => e.quality.reliability === 'low' || e.quality.accuracy === 'low' || e.quality.confidence === 'low'

/* ---------- Analyses ---------- */

export type AnalysisWarning = 'an.warn.resultNoEvidence' | 'an.warn.supportedOnAssumptions' | 'an.warn.causalNoFacts' | 'an.warn.lowQuality'

/** Integrity warnings for an analysis — shown in the lab, the report and reflected in completion. */
export function analysisWarnings(a: Analysis): AnalysisWarning[] {
  const w: AnalysisWarning[] = []
  if (a.result !== 'not-tested' && a.evidence.length === 0) w.push('an.warn.resultNoEvidence')
  if ((a.result === 'supported' || a.result === 'partially-supported') && a.evidence.length > 0 && !a.evidence.some((e) => STRONG_TYPES.includes(e.type)))
    w.push('an.warn.supportedOnAssumptions')
  if (a.relationship === 'causal-supported' && !a.evidence.some((e) => e.type === 'fact' || e.type === 'observation')) w.push('an.warn.causalNoFacts')
  if (a.evidence.some(qualityConcern)) w.push('an.warn.lowQuality')
  return w
}

/* ---------- Findings ---------- */

export type FindingReason = 'untested' | 'inconclusive' | 'noStrongEvidence' | 'qualityConcern'

export interface FindingSupport {
  /** unlinked: no analysis or evidence; validated: solid chain; provisional: see reasons. */
  level: 'unlinked' | 'validated' | 'provisional'
  reasons: FindingReason[]
  /** The finding records what remains uncertain. */
  documented: boolean
  analyses: Analysis[]
  evidence: { evidence: Evidence; analysis: Analysis }[]
}

export function findingSupport(p: Project, f: Finding): FindingSupport {
  const analyses = p.analyses.filter((a) => f.analysisIds.includes(a.id))
  const seen = new Set<string>()
  const evidence: FindingSupport['evidence'] = []
  for (const a of p.analyses) {
    for (const e of a.evidence) {
      // Direct links, plus the evidence behind each linked analysis.
      if ((f.evidenceIds.includes(e.id) || f.analysisIds.includes(a.id)) && !seen.has(e.id)) {
        seen.add(e.id)
        evidence.push({ evidence: e, analysis: a })
      }
    }
  }
  const documented = filled(f.uncertain)
  if (analyses.length === 0 && f.evidenceIds.length === 0) return { level: 'unlinked', reasons: [], documented, analyses, evidence }
  const reasons: FindingReason[] = []
  if (analyses.some((a) => a.result === 'not-tested')) reasons.push('untested')
  if (analyses.some((a) => a.result === 'inconclusive')) reasons.push('inconclusive')
  if (!evidence.some((x) => STRONG_TYPES.includes(x.evidence.type))) reasons.push('noStrongEvidence')
  if (evidence.some((x) => qualityConcern(x.evidence))) reasons.push('qualityConcern')
  return { level: reasons.length ? 'provisional' : 'validated', reasons, documented, analyses, evidence }
}

/* ---------- Recommendations ---------- */

export interface RecommendationChain {
  /**
   * backed: every linked finding validated · limited: linked findings provisional ·
   * precautionary: no evidence chain, but explicitly marked and justified ·
   * unsupported: no finding, or a linked finding has no analysis/evidence (broken chain) ·
   * na: not a recommended action (investigate / rejected).
   */
  level: 'backed' | 'limited' | 'precautionary' | 'unsupported' | 'na'
  reason: '' | 'noFinding' | 'brokenChain'
  findings: { finding: Finding; support: FindingSupport }[]
}

export const isJustifiedPrecaution = (r: Recommendation) => r.precautionary && filled(r.precautionaryJustification)

export function recommendationChain(p: Project, r: Recommendation): RecommendationChain {
  const findings = p.synthesis.findings.filter((f) => r.findingIds.includes(f.id)).map((finding) => ({ finding, support: findingSupport(p, finding) }))
  if (r.disposition !== 'recommended') return { level: 'na', reason: '', findings }
  if (findings.length === 0) return { level: isJustifiedPrecaution(r) ? 'precautionary' : 'unsupported', reason: 'noFinding', findings }
  if (findings.some((x) => x.support.level === 'unlinked')) return { level: isJustifiedPrecaution(r) ? 'precautionary' : 'unsupported', reason: 'brokenChain', findings }
  if (findings.every((x) => x.support.level === 'validated')) return { level: 'backed', reason: '', findings }
  return { level: 'limited', reason: '', findings }
}
