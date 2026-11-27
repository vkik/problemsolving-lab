/**
 * Evidence-chain evaluation: how well an analysis, a finding or a recommendation is supported.
 *
 * Principles
 * - Facts, observations, assumptions, interpretations and external evidence stay distinct.
 *   Only verified facts, observations and external evidence count as "strong" support.
 * - A linked analysis is not by itself reliable evidence: a finding is "verified" only when its
 *   analyses were tested and strong evidence supports it without recorded reservations.
 * - Anything less (partially supported, preliminary, inconclusive) is legitimate when the
 *   uncertainty is documented: it then counts as a documented limitation, not as missing
 *   evidence. Nothing here rejects a finding for being uncertain.
 * - A recommendation is evidence-backed only when every link of its chain holds:
 *   recommendation → finding → analysis → evidence. A broken chain is reported as unsupported,
 *   unless the action is explicitly marked precautionary and justified.
 */
import { QUALITY_KEYS, type Analysis, type Evidence, type EvidenceType, type Finding, type HypothesisResult, type Project, type QualityKey, type Recommendation } from './types'

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

/**
 * Finding classes (most to least supported). No numeric thresholds are used: the class follows
 * only from the user's own test results, evidence classes and quality ratings.
 *   verified     — tested analyses and strong evidence, no reservations recorded
 *   partial      — tested and strongly evidenced, but with reservations (a partially supported
 *                  result, an untested/inconclusive link alongside, or evidence rated low)
 *   preliminary  — not yet tested, or resting only on assumptions/interpretations or on an
 *                  analysis without evidence items
 *   inconclusive — the linked analyses were tested but were inconclusive
 *   unsupported  — no analysis or evidence linked, or linked analyses document nothing
 */
export type FindingClass = 'verified' | 'partial' | 'preliminary' | 'inconclusive' | 'unsupported'
export const FINDING_CLASSES: FindingClass[] = ['verified', 'partial', 'preliminary', 'inconclusive', 'unsupported']

export type FindingReason =
  | 'noLinks'
  | 'noBasis'
  | 'untested'
  | 'inconclusive'
  | 'partialResult'
  | 'noEvidenceItems'
  | 'noStrongEvidence'
  | 'lowReliability'
  | 'lowAccuracy'
  | 'lowCompleteness'
  | 'lowRecency'
  | 'lowConfidence'

const LOW_REASON: Record<QualityKey, FindingReason> = {
  reliability: 'lowReliability',
  accuracy: 'lowAccuracy',
  completeness: 'lowCompleteness',
  recency: 'lowRecency',
  confidence: 'lowConfidence',
}

/** Per-dimension summary of the ratings the user gave the linked evidence. */
export interface QualityProfile {
  key: QualityKey
  low: number
  medium: number
  high: number
  unrated: number
}

export interface FindingSupport {
  cls: FindingClass
  reasons: FindingReason[]
  /** The finding records what remains uncertain. */
  documented: boolean
  analyses: Analysis[]
  evidence: { evidence: Evidence; analysis: Analysis }[]
  quality: QualityProfile[]
  /** Linked tested analyses whose methodological limitations are (not) documented. */
  limitationsDocumented: Analysis[]
  limitationsMissing: Analysis[]
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
  const quality: QualityProfile[] = QUALITY_KEYS.map((key) => {
    const q = { key, low: 0, medium: 0, high: 0, unrated: 0 }
    for (const { evidence: e } of evidence) {
      const r = e.quality[key]
      if (r === '') q.unrated++
      else q[r]++
    }
    return q
  })
  const tested = analyses.filter((a) => TESTED_RESULTS.includes(a.result))
  const limitationsDocumented = tested.filter((a) => filled(a.limitations))
  const limitationsMissing = tested.filter((a) => !filled(a.limitations))
  const documented = filled(f.uncertain)
  const base = { documented, analyses, evidence, quality, limitationsDocumented, limitationsMissing }

  if (analyses.length === 0 && f.evidenceIds.length === 0) return { ...base, cls: 'unsupported', reasons: ['noLinks'] }
  const hasBasis = evidence.length > 0 || analyses.some((a) => filled(a.results) || filled(a.conclusion))
  if (!hasBasis) return { ...base, cls: 'unsupported', reasons: ['noBasis'] }

  const reasons: FindingReason[] = []
  if (analyses.some((a) => a.result === 'not-tested')) reasons.push('untested')
  if (analyses.some((a) => a.result === 'inconclusive')) reasons.push('inconclusive')
  if (analyses.some((a) => a.result === 'partially-supported')) reasons.push('partialResult')
  if (evidence.length === 0) reasons.push('noEvidenceItems')
  else if (!evidence.some((x) => STRONG_TYPES.includes(x.evidence.type))) reasons.push('noStrongEvidence')
  for (const q of quality) if (q.low > 0) reasons.push(LOW_REASON[q.key])

  const strong = evidence.some((x) => STRONG_TYPES.includes(x.evidence.type))
  let cls: FindingClass
  if (analyses.length > 0 && tested.length === 0) cls = analyses.some((a) => a.result === 'inconclusive') ? 'inconclusive' : 'preliminary'
  else if (!strong) cls = 'preliminary'
  else cls = reasons.length > 0 ? 'partial' : 'verified'
  return { ...base, cls, reasons }
}

/* ---------- Recommendations ---------- */

/**
 * backed        — every linked finding verified
 * partial       — linked findings are supported only partially, preliminarily or inconclusively
 * precautionary — marked precautionary with a justification, and not fully evidence-backed
 * investigate   — the decision is “requires further investigation”
 * unsupported   — no finding, or a linked finding has no support (broken chain)
 * na            — rejected option
 */
export type ChainLevel = 'backed' | 'partial' | 'precautionary' | 'investigate' | 'unsupported' | 'na'
export type ChainReason = '' | 'allVerified' | 'noFinding' | 'brokenChain' | 'findingsNotVerified' | 'disposition' | 'precaution' | 'rejected'

export interface RecommendationChain {
  level: ChainLevel
  reason: ChainReason
  findings: { finding: Finding; support: FindingSupport }[]
  /** Issues reached through finding → analysis → issue. */
  issueIds: string[]
  /** Uncertainties and analysis limitations that bear on this recommendation. */
  limitations: { source: 'finding' | 'analysis'; text: string; label: string }[]
}

export const isJustifiedPrecaution = (r: Recommendation) => r.precautionary && filled(r.precautionaryJustification)

export function recommendationChain(p: Project, r: Recommendation): RecommendationChain {
  const findings = p.synthesis.findings.filter((f) => r.findingIds.includes(f.id)).map((finding) => ({ finding, support: findingSupport(p, finding) }))
  const issueIds = [...new Set(findings.flatMap((x) => x.support.analyses.map((a) => a.issueId)).filter(Boolean))]
  const limitations: RecommendationChain['limitations'] = []
  const seenA = new Set<string>()
  for (const { finding, support } of findings) {
    if (filled(finding.uncertain)) limitations.push({ source: 'finding', text: finding.uncertain.trim(), label: finding.insight || finding.discovery })
    for (const a of support.analyses)
      if (filled(a.limitations) && !seenA.has(a.id)) {
        seenA.add(a.id)
        limitations.push({ source: 'analysis', text: a.limitations.trim(), label: a.title || a.hypothesis })
      }
  }
  const base = { findings, issueIds, limitations }
  if (r.disposition === 'rejected') return { ...base, level: 'na', reason: 'rejected' }
  if (r.disposition === 'investigate') return { ...base, level: 'investigate', reason: 'disposition' }
  const precaution = isJustifiedPrecaution(r)
  if (findings.length === 0) return { ...base, level: precaution ? 'precautionary' : 'unsupported', reason: precaution ? 'precaution' : 'noFinding' }
  if (findings.some((x) => x.support.cls === 'unsupported')) return { ...base, level: precaution ? 'precautionary' : 'unsupported', reason: precaution ? 'precaution' : 'brokenChain' }
  if (findings.every((x) => x.support.cls === 'verified')) return { ...base, level: 'backed', reason: 'allVerified' }
  return { ...base, level: precaution ? 'precautionary' : 'partial', reason: precaution ? 'precaution' : 'findingsNotVerified' }
}
